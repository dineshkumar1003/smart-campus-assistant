import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get GoogleGenAI client safely
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health and provider status
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'online',
    appName: 'Smart Campus Assistant',
    aiConfigured: hasKey,
    supportedModels: [
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (High Capability)', role: 'Default Campus Assistant' },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Ultra Fast)', role: 'Fast Queries & Instant Fallback' }
    ]
  });
});

// Resilient executor with automatic fallback if primary model experiences temporary high demand (503)
async function generateWithFallback(ai: GoogleGenAI, params: any) {
  const primaryModel = params.model || 'gemini-3.8-flash';
  try {
    return await ai.models.generateContent(params);
  } catch (err: any) {
    if (err.status === 503 || (err.message && (err.message.includes('high demand') || err.message.includes('UNAVAILABLE')))) {
      console.warn(`Model ${primaryModel} high demand, falling back to gemini-3.1-flash-lite`);
      return await ai.models.generateContent({
        ...params,
        model: 'gemini-3.1-flash-lite',
      });
    }
    throw err;
  }
}

async function generateStreamWithFallback(ai: GoogleGenAI, params: any) {
  const primaryModel = params.model || 'gemini-3.8-flash';
  try {
    return await ai.models.generateContentStream(params);
  } catch (err: any) {
    if (err.status === 503 || (err.message && (err.message.includes('high demand') || err.message.includes('UNAVAILABLE')))) {
      console.warn(`Model ${primaryModel} stream busy, falling back to gemini-3.1-flash-lite`);
      return await ai.models.generateContentStream({
        ...params,
        model: 'gemini-3.1-flash-lite',
      });
    }
    throw err;
  }
}

// AI Chat Endpoint with optional Streaming
app.post('/api/chat', async (req, res) => {
  const ai = getAIClient();
  if (!ai) {
    return res.status(503).json({
      error: 'AI Provider is not configured. Please ensure GEMINI_API_KEY is available in server secrets.'
    });
  }

  const {
    messages = [],
    model = 'gemini-3.8-flash',
    systemInstruction,
    documentContext,
    stream = false,
  } = req.body;

  try {
    const formattedContents: any[] = [];

    // Inject document context if present
    if (documentContext && typeof documentContext === 'string' && documentContext.trim()) {
      formattedContents.push({
        role: 'user',
        parts: [
          {
            text: `[REFERENCE CAMPUS MATERIAL / STUDY DOCUMENT]:\n"""\n${documentContext.slice(0, 30000)}\n"""\nPlease prioritize the above document content to assist the user accurately.`
          }
        ]
      });
      formattedContents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will answer with high fidelity using the provided campus document as context.' }]
      });
    }

    // Map conversation turns
    for (const msg of messages) {
      const role = msg.sender === 'assistant' ? 'model' : 'user';
      const parts: any[] = [{ text: msg.content || '' }];

      if (msg.image && typeof msg.image === 'string') {
        const matches = msg.image.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          });
        }
      }

      formattedContents.push({ role, parts });
    }

    const defaultSystem = `You are Smart Campus Assistant, an advanced, highly capable academic, technical, and productivity AI assistant designed for students, educators, researchers, and campus developers.
You assist with:
- Academic subjects: Computer science, mathematics, engineering, biology, chemistry, literature, history, and research methodologies.
- Interactive study: Formulating practice questions, clear step-by-step explanations, syllabus breakdown, and concept maps.
- Technical coding: Code explanations, debugging, algorithms, architecture diagrams, and best practices.
- Tone: Professional, encouraging, precise, and supportive. Use markdown formatting, bold keywords, bullet points, and syntax-highlighted code blocks where appropriate.`;

    const effectiveInstruction = systemInstruction
      ? `${defaultSystem}\n\n[SPECIALIZED AGENT DIRECTIVE]:\n${systemInstruction}`
      : defaultSystem;

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const responseStream = await generateStreamWithFallback(ai, {
        model,
        contents: formattedContents,
        config: {
          systemInstruction: effectiveInstruction,
        }
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const response = await generateWithFallback(ai, {
        model,
        contents: formattedContents,
        config: {
          systemInstruction: effectiveInstruction,
        }
      });

      const reply = response.text || 'No response generated.';
      return res.json({ reply });
    }
  } catch (error: any) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || 'An error occurred while communicating with Gemini AI.'
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// Camera and Image Vision Endpoint
app.post('/api/vision', async (req, res) => {
  const ai = getAIClient();
  if (!ai) {
    return res.status(503).json({
      error: 'AI Provider is not configured. Please ensure GEMINI_API_KEY is available.'
    });
  }

  const { prompt, imageBase64, mode = 'general' } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is required.' });
  }

  try {
    let cleanBase64 = imageBase64;
    let mimeType = 'image/jpeg';

    const matches = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      cleanBase64 = matches[2];
    }

    const defaultPrompt = mode === 'whiteboard'
      ? 'Examine this whiteboard or handwritten page carefully. Transcribe all mathematical formulas, code, diagrams, and bullet points. Explain the core ideas systematically.'
      : (prompt || 'Analyze this image in detail for campus study. Identify key concepts, diagram structures, text, formulas, or objects.');

    const response = await generateWithFallback(ai, {
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64
            }
          },
          { text: defaultPrompt }
        ]
      },
      config: {
        systemInstruction: 'You are Smart Campus Vision Assistant. Provide clean, well-structured visual analysis with precise breakdowns, LaTeX equations when applicable, and key takeaways.'
      }
    });

    const reply = response.text || 'No analysis available.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Vision error:', error);
    res.status(500).json({ error: error.message || 'Image analysis failed.' });
  }
});

// Document Assistant Endpoint (Summarize, Q&A, Explain words, Quiz Generation)
app.post('/api/document-query', async (req, res) => {
  const ai = getAIClient();
  if (!ai) {
    return res.status(503).json({
      error: 'AI Provider is not configured.'
    });
  }

  const { documentText, query, action = 'qa' } = req.body;

  if (!documentText) {
    return res.status(400).json({ error: 'Document text is required.' });
  }

  try {
    let promptInstruction = '';
    if (action === 'summarize') {
      promptInstruction = 'Provide a comprehensive executive summary of this academic document. Include: 1) Core Hypothesis/Subject, 2) Key Arguments or Methods, 3) 5 Major Findings or Takeaways, and 4) Actionable Study Summary.';
    } else if (action === 'explain') {
      promptInstruction = 'Identify and define all complex, technical, or domain-specific vocabulary and concepts in this text. For each, give a clear plain-English definition followed by an academic campus example.';
    } else if (action === 'quiz') {
      promptInstruction = 'Generate a 5-question multiple-choice or short-answer study quiz based strictly on this document. After each question, provide the correct answer with a brief justification citing the text.';
    } else if (action === 'study_guide') {
      promptInstruction = 'Convert this document into a structured campus study guide with main headings, sub-concepts, mnemonics, and review flashcard prompts.';
    } else {
      promptInstruction = query || 'Analyze and answer questions about this document.';
    }

    const response = await generateWithFallback(ai, {
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `[CAMPUS STUDY DOCUMENT]:\n"""\n${documentText.slice(0, 35000)}\n"""\n\nTask: ${promptInstruction}` }
          ]
        }
      ],
      config: {
        systemInstruction: 'You are the Smart Campus Document Specialist. Ground all responses firmly in the document content provided.'
      }
    });

    res.json({ reply: response.text || 'No response generated.' });
  } catch (error: any) {
    console.error('Document query error:', error);
    res.status(500).json({ error: error.message || 'Document analysis failed.' });
  }
});

// Image Generation Endpoint
app.post('/api/generate-image', async (req, res) => {
  const ai = getAIClient();
  if (!ai) {
    return res.status(503).json({
      error: 'AI Provider is not configured. Add GEMINI_API_KEY in the server secrets.'
    });
  }

  const { prompt, aspectRatio = '1:1' } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required for image generation.' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });

    let imageUrl: string | null = null;
    let descriptionText = '';

    const candidates = response.candidates || [];
    if (candidates.length > 0 && candidates[0].content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          descriptionText += part.text;
        }
      }
    }

    if (imageUrl) {
      return res.json({ imageUrl, description: descriptionText });
    } else {
      return res.status(422).json({
        error: 'The model completed the request without producing inline image data.',
        description: descriptionText
      });
    }
  } catch (error: any) {
    console.error('Image generation error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate image with Gemini model.'
    });
  }
});

// Mount Vite or static server
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Campus Assistant backend active on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
