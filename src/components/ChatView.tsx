import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Square,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Pin,
  Flame,
  Volume2,
  VolumeX,
  Paperclip,
  X,
  FileDown,
  Trash2,
  Mic,
  MicOff,
  AlertCircle
} from 'lucide-react';
import { Message, Conversation } from '../types';
import { sendChatMessage, exportConversationToFile } from '../services/api';

interface ChatViewProps {
  currentConversation: Conversation;
  onUpdateConversation: (updated: Conversation) => void;
  isTemporary?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentConversation,
  onUpdateConversation,
  isTemporary,
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(
    currentConversation.model || 'gemini-3.8-flash'
  );
  const [useStreaming, setUseStreaming] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation.messages, loading]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        const text = Array.from(e.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInput((prev) => (prev ? prev + ' ' + text : text));
      };

      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser environment.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSpeak = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in your browser.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown chars for clean voice
    const plainText = text.replace(/[*#`_~[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if ((!textToSend.trim() && !selectedImage) || loading) return;

    setError(null);
    const userMsgId = crypto.randomUUID();
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      content: textToSend.trim(),
      image: selectedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...currentConversation.messages, userMsg];
    let updatedTitle = currentConversation.title;
    if (currentConversation.messages.length === 0 && textToSend.trim()) {
      updatedTitle = textToSend.trim().slice(0, 36) + (textToSend.length > 36 ? '...' : '');
    }

    onUpdateConversation({
      ...currentConversation,
      title: updatedTitle,
      messages: newMessages,
      model: selectedModel,
      updated_at: new Date().toISOString(),
    });

    setInput('');
    setSelectedImage(null);
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const assistantMsgId = crypto.randomUUID();
    let assistantText = '';

    try {
      if (useStreaming) {
        // Optimistically put empty assistant message
        const initialAssistantMsg: Message = {
          id: assistantMsgId,
          sender: 'assistant',
          content: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        onUpdateConversation({
          ...currentConversation,
          title: updatedTitle,
          messages: [...newMessages, initialAssistantMsg],
          model: selectedModel,
        });

        await sendChatMessage({
          messages: newMessages,
          model: selectedModel,
          stream: true,
          signal: controller.signal,
          onChunk: (streamedText) => {
            assistantText = streamedText;
            onUpdateConversation({
              ...currentConversation,
              title: updatedTitle,
              messages: [
                ...newMessages,
                {
                  id: assistantMsgId,
                  sender: 'assistant',
                  content: streamedText,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ],
            });
          },
        });
      } else {
        const reply = await sendChatMessage({
          messages: newMessages,
          model: selectedModel,
          stream: false,
          signal: controller.signal,
        });

        const assistantMsg: Message = {
          id: assistantMsgId,
          sender: 'assistant',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        onUpdateConversation({
          ...currentConversation,
          title: updatedTitle,
          messages: [...newMessages, assistantMsg],
          model: selectedModel,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Stopped by user
      } else {
        setError(err.message || 'Failed to receive response from Smart Campus Assistant.');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (loading || currentConversation.messages.length === 0) return;
    const lastUserIndex = [...currentConversation.messages]
      .reverse()
      .findIndex((m) => m.sender === 'user');

    if (lastUserIndex === -1) return;
    const actualIndex = currentConversation.messages.length - 1 - lastUserIndex;
    const userPrompt = currentConversation.messages[actualIndex].content;
    const pruned = currentConversation.messages.slice(0, actualIndex);

    onUpdateConversation({
      ...currentConversation,
      messages: pruned,
    });

    handleSendMessage(userPrompt);
  };

  const handleTogglePinMessage = (msgId: string) => {
    const updated = currentConversation.messages.map((m) =>
      m.id === msgId ? { ...m, isPinned: !m.isPinned } : m
    );
    onUpdateConversation({
      ...currentConversation,
      messages: updated,
    });
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all messages in this conversation?')) {
      onUpdateConversation({
        ...currentConversation,
        messages: [],
      });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large. Please select an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/60 relative">
      {/* Top Conversation Control Bar */}
      <div className="h-12 border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-4 flex items-center justify-between text-xs shrink-0 z-10">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] md:max-w-xs">
            {currentConversation.title}
          </span>
          {isTemporary && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              <Flame size={12} /> Temporary Chat
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Model selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md text-xs border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
          >
            <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
          </select>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1 transition-colors"
              title="Export Conversation"
            >
              <FileDown size={14} />
              <span className="hidden sm:inline">Export</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 top-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-lg py-1 w-36 z-30">
                <button
                  onClick={() => {
                    exportConversationToFile(currentConversation.messages, currentConversation.title, 'md');
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                >
                  Export Markdown (.md)
                </button>
                <button
                  onClick={() => {
                    exportConversationToFile(currentConversation.messages, currentConversation.title, 'txt');
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                >
                  Export Plain Text (.txt)
                </button>
                <button
                  onClick={() => {
                    exportConversationToFile(currentConversation.messages, currentConversation.title, 'json');
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                >
                  Export JSON (.json)
                </button>
              </div>
            )}
          </div>

          {/* Clear chat */}
          <button
            onClick={handleClearChat}
            disabled={currentConversation.messages.length === 0}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-500 disabled:opacity-40 transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Temporary Chat Notice */}
      {isTemporary && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 px-4 py-1 text-xs text-center font-medium">
          Temporary Session: Messages in this chat are kept strictly in-memory and will not be saved to your history.
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-24 py-6 flex flex-col gap-6">
        {currentConversation.messages.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
              <Sparkles size={24} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
              Smart Campus Assistant
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Your personalized academic and technical intelligence companion. Ask coursework questions, explore algorithms, draft lab reports, or upload diagrams.
            </p>

            {/* Quick Starter Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left">
              {[
                'Explain Dijkstra algorithm with a step-by-step example',
                'Help me outline an academic literature review paper',
                'Generate practice quiz questions for Calculus III',
                'Explain differences between TCP and UDP protocols',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(suggestion)}
                  className="p-3 text-xs bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-all text-left hover:border-sky-300 dark:hover:border-sky-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          currentConversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 shadow-xs relative group transition-all ${
                  msg.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-br-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                }`}
              >
                {/* Pinned Tag */}
                {msg.isPinned && (
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-sky-500 mb-2 pb-1 border-b border-sky-100 dark:border-sky-900">
                    <Pin size={10} className="fill-current" /> Pinned Message
                  </div>
                )}

                {/* Attached Image */}
                {msg.image && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 max-h-72">
                    <img
                      src={msg.image}
                      alt="User Attachment"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Message Content */}
                <div className="prose dark:prose-invert max-w-none text-sm break-words leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, className, children, ...props }: any) {
                        const isInline = !className;
                        const codeString = String(children).replace(/\n$/, '');
                        if (isInline) {
                          return (
                            <code className="bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <div className="relative group/code my-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div className="bg-slate-800 text-slate-300 text-[10px] font-mono px-3 py-1 flex items-center justify-between border-b border-slate-700">
                              <span>Code</span>
                              <button
                                onClick={() => copyToClipboard(codeString, msg.id + '-code')}
                                className="hover:text-white flex items-center gap-1"
                              >
                                {copiedId === msg.id + '-code' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                <span>Copy</span>
                              </button>
                            </div>
                            <pre className="p-3 bg-slate-900 text-slate-100 overflow-x-auto text-xs font-mono leading-relaxed">
                              <code>{children}</code>
                            </pre>
                          </div>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between gap-4 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                  <span className="tabular-nums">{msg.timestamp}</span>

                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleSpeak(msg.content, msg.id)}
                      className="p-1 hover:text-sky-500 rounded transition-colors"
                      title={speakingMsgId === msg.id ? 'Stop Voice' : 'Read Aloud'}
                    >
                      {speakingMsgId === msg.id ? (
                        <VolumeX size={13} className="text-rose-500" />
                      ) : (
                        <Volume2 size={13} />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="p-1 hover:text-sky-500 rounded transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check size={13} className="text-emerald-500" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                    <button
                      onClick={() => handleTogglePinMessage(msg.id)}
                      className="p-1 hover:text-sky-500 rounded transition-colors"
                      title={msg.isPinned ? 'Unpin message' : 'Pin message'}
                    >
                      <Pin
                        size={13}
                        className={msg.isPinned ? 'text-sky-500 fill-current' : ''}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs italic py-2">
            <RefreshCw size={14} className="animate-spin text-sky-600" />
            <span>Smart Campus Assistant is formulating response...</span>
            <button
              onClick={handleStop}
              className="ml-2 text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 not-italic"
            >
              <Square size={10} className="fill-current" /> Stop
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Generation Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
            <button
              onClick={handleRegenerate}
              className="px-2 py-1 bg-rose-100 dark:bg-rose-900/60 rounded hover:bg-rose-200 font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Action Controls */}
      <div className="p-3 md:p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          {/* Regenerate pill button if conversation has responses */}
          {currentConversation.messages.length > 0 && !loading && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-1 hover:text-sky-600 transition-colors"
              >
                <RefreshCw size={12} /> Regenerate last response
              </button>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-0"
                />
                <span>Stream response tokens</span>
              </label>
            </div>
          )}

          {/* Attached image preview */}
          {selectedImage && (
            <div className="relative inline-flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg max-w-xs">
              <img src={selectedImage} alt="Attachment" className="w-10 h-10 object-cover rounded" />
              <span className="text-xs truncate text-slate-600 dark:text-slate-300">
                Image Attached
              </span>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 text-slate-400 hover:text-rose-500 rounded-full"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input Box */}
          <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-sky-500 rounded-xl px-3 py-2 transition-all">
            <label className="cursor-pointer text-slate-500 hover:text-sky-600 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors" title="Attach Image">
              <Paperclip size={17} />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>

            <button
              onClick={toggleSpeechRecognition}
              className={`p-1.5 rounded-lg transition-colors ${
                isListening
                  ? 'text-rose-600 bg-rose-100 dark:bg-rose-950/60 animate-pulse'
                  : 'text-slate-500 hover:text-sky-600 hover:bg-white dark:hover:bg-slate-700'
              }`}
              title={isListening ? 'Stop Speech Recognition' : 'Voice Input (Push to talk)'}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything or request campus study assistance... (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm resize-none placeholder:text-slate-400 leading-normal max-h-32"
            />

            {loading ? (
              <button
                onClick={handleStop}
                className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all"
                title="Stop generation"
              >
                <Square size={15} className="fill-current" />
              </button>
            ) : (
              <button
                onClick={() => handleSendMessage()}
                disabled={(!input.trim() && !selectedImage) || loading}
                className="p-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg transition-all"
                title="Send Message"
              >
                <Send size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
