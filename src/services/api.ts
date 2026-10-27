import { Message } from '../types';

export interface ChatRequestOptions {
  messages: Message[];
  model?: string;
  systemInstruction?: string;
  documentContext?: string;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}

export async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    return { status: 'offline', aiConfigured: false, supportedModels: [] };
  }
}

export async function sendChatMessage(options: ChatRequestOptions): Promise<string> {
  const {
    messages,
    model = 'gemini-3.8-flash',
    systemInstruction,
    documentContext,
    stream = false,
    onChunk,
    signal,
  } = options;

  if (stream && onChunk) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model,
        systemInstruction,
        documentContext,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || `Server responded with status ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Streaming not supported by browser.');

    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              fullText += parsed.text;
              onChunk(fullText);
            }
          } catch (e: any) {
            if (e.message && e.message !== 'Unexpected end of JSON input') {
              console.warn('Error parsing SSE chunk:', e);
            }
          }
        }
      }
    }

    return fullText;
  } else {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model,
        systemInstruction,
        documentContext,
        stream: false,
      }),
      signal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || `Failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.reply;
  }
}

export async function analyzeVisionImage(params: {
  imageBase64: string;
  prompt?: string;
  mode?: 'general' | 'whiteboard';
}): Promise<string> {
  const response = await fetch('/api/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || `Vision analysis failed: ${response.status}`);
  }

  const data = await response.json();
  return data.reply;
}

export async function queryDocumentContent(params: {
  documentText: string;
  query?: string;
  action?: 'qa' | 'summarize' | 'explain' | 'quiz' | 'study_guide';
}): Promise<string> {
  const response = await fetch('/api/document-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || `Document query failed: ${response.status}`);
  }

  const data = await response.json();
  return data.reply;
}

export async function requestImageGeneration(prompt: string, aspectRatio = '1:1'): Promise<{ imageUrl: string; description?: string }> {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, aspectRatio }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || `Image generation failed with status ${response.status}`);
  }

  return await response.json();
}

export function exportConversationToFile(
  messages: Message[],
  title: string,
  format: 'txt' | 'md' | 'json'
) {
  let fileContent = '';
  let mimeType = 'text/plain';
  let extension = format;

  if (format === 'json') {
    fileContent = JSON.stringify({ title, exported_at: new Date().toISOString(), messages }, null, 2);
    mimeType = 'application/json';
  } else if (format === 'md') {
    fileContent = `# ${title}\n\n*Exported from Smart Campus Assistant on ${new Date().toLocaleString()}*\n\n---\n\n`;
    for (const msg of messages) {
      const senderName = msg.sender === 'user' ? '👤 Student' : '🎓 Smart Campus Assistant';
      fileContent += `### ${senderName} (${msg.timestamp})\n\n${msg.content}\n\n---\n\n`;
    }
    mimeType = 'text/markdown';
  } else {
    fileContent = `SMART CAMPUS ASSISTANT - CONVERSATION EXPORT\nTitle: ${title}\nDate: ${new Date().toLocaleString()}\n${'='.repeat(60)}\n\n`;
    for (const msg of messages) {
      const senderName = msg.sender === 'user' ? 'STUDENT' : 'ASSISTANT';
      fileContent += `[${msg.timestamp}] ${senderName}:\n${msg.content}\n\n${'-'.repeat(40)}\n\n`;
    }
  }

  const blob = new Blob([fileContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'campus_chat'}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
