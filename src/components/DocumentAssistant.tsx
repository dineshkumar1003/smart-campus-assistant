import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileQuestion,
  GraduationCap,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import mammoth from 'mammoth';
import { queryDocumentContent } from '../services/api';

export const DocumentAssistant: React.FC = () => {
  const [docContent, setDocContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setError(null);
    setFileName(file.name);
    setFileSize(file.size);
    setResult('');

    try {
      if (file.name.endsWith('.txt') || file.type === 'text/plain') {
        const text = await file.text();
        setDocContent(text);
      } else if (file.name.endsWith('.docx') || file.type.includes('wordprocessingml')) {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        setDocContent(res.value);
      } else if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
        // PDF parser fallback: Read as text stream or extracted text
        const text = await file.text();
        // Check if plain text can be extracted or inform user
        const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanText.length > 200) {
          setDocContent(cleanText);
        } else {
          setError(
            'The uploaded PDF appears to be image-based or compressed without an embedded text layer. Please copy/paste the text, convert it to .txt/.docx, or use the Camera Assistant for OCR.'
          );
          setDocContent('');
        }
      } else {
        // Fallback text reader
        const text = await file.text();
        setDocContent(text);
      }
    } catch (err: any) {
      setError('Failed to extract text from document: ' + err.message);
    }
  };

  const handleAction = async (action: 'qa' | 'summarize' | 'explain' | 'quiz' | 'study_guide', customQ?: string) => {
    if (!docContent || loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await queryDocumentContent({
        documentText: docContent,
        action,
        query: customQ || query,
      });
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze document.');
    } finally {
      setLoading(false);
    }
  };

  const clearDocument = () => {
    setDocContent('');
    setFileName('');
    setFileSize(0);
    setResult('');
    setQuery('');
    setError(null);
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const wordCount = docContent ? docContent.trim().split(/\s+/).length : 0;
  const estimatedReadMins = Math.ceil(wordCount / 200);

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="text-sky-600" size={22} /> Document Study Assistant
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Upload syllabi, research papers, lecture handouts, or reading assignments for grounded AI comprehension.
          </p>
        </div>

        {fileName && (
          <button
            onClick={clearDocument}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200 dark:border-rose-900"
          >
            <Trash2 size={13} /> Remove Document
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Zone */}
      {!docContent ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-white/50 dark:bg-slate-900/50 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-3">
            <Upload size={28} />
          </div>
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-1">
            Upload Campus Study Document
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
            Supports <strong className="text-slate-700 dark:text-slate-300">DOCX, TXT, and PDF</strong> files up to 10MB. Files are analyzed strictly in-memory.
          </p>
          <label className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all shadow-xs flex items-center gap-2">
            <Upload size={14} /> Select File from Device
            <input
              type="file"
              accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Document Metrics Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="text-emerald-500" size={18} />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{fileName}</span>
                <span className="text-slate-400 ml-2">({(fileSize / 1024).toFixed(1)} KB)</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-500">
              <span>{docContent.length.toLocaleString()} characters</span>
              <span>·</span>
              <span>{wordCount.toLocaleString()} words</span>
              <span>·</span>
              <span>~{estimatedReadMins} min read</span>
            </div>
          </div>

          {/* Quick AI Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => handleAction('summarize')}
              disabled={loading}
              className="p-3 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2"
            >
              <Sparkles size={16} className="text-sky-600 shrink-0" />
              <span>Executive Summary</span>
            </button>

            <button
              onClick={() => handleAction('quiz')}
              disabled={loading}
              className="p-3 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2"
            >
              <FileQuestion size={16} className="text-indigo-600 shrink-0" />
              <span>5-Question Quiz</span>
            </button>

            <button
              onClick={() => handleAction('explain')}
              disabled={loading}
              className="p-3 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2"
            >
              <HelpCircle size={16} className="text-amber-600 shrink-0" />
              <span>Explain Technical Words</span>
            </button>

            <button
              onClick={() => handleAction('study_guide')}
              disabled={loading}
              className="p-3 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2"
            >
              <GraduationCap size={16} className="text-emerald-600 shrink-0" />
              <span>Study Guide & Flashcards</span>
            </button>
          </div>

          {/* 2-Column Split: Extracted Content Preview vs AI Study Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: Document Raw Text Preview */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col shadow-xs">
              <span className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                Extracted Text Preview
              </span>
              <div className="h-[420px] overflow-y-auto text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 whitespace-pre-wrap leading-relaxed">
                {docContent.slice(0, 8000)}
                {docContent.length > 8000 && '\n\n... [Remaining text retained in AI context]'}
              </div>
            </div>

            {/* Right: AI Output & Custom Q&A */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-full min-h-[460px] shadow-xs">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-sky-600" />
                    AI Academic Insights
                  </span>
                  {result && (
                    <button
                      onClick={copyResult}
                      className="p-1 hover:text-sky-600 text-slate-400 transition-colors"
                      title="Copy result"
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>

                <div className="h-[340px] overflow-y-auto text-xs leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50/70 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <RefreshCw size={20} className="animate-spin text-sky-600" />
                      <span>Analyzing document and synthesising findings...</span>
                    </div>
                  ) : result ? (
                    <div className="prose dark:prose-invert max-w-none text-xs whitespace-pre-wrap">
                      {result}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-1">
                      <p>Select a quick action above or enter a question below.</p>
                      <p className="text-[11px] text-slate-500">
                        The assistant grounds its answers directly on your text.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Query Input */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Ask a question about this document..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAction('qa')}
                  className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-sky-500"
                />
                <button
                  onClick={() => handleAction('qa')}
                  disabled={loading || !query.trim()}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  Ask
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
