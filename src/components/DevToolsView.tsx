import React, { useState, useEffect } from 'react';
import { Code2, Play, Bug, Sparkles, Copy, Check, Plus, Trash2, Terminal, RefreshCw } from 'lucide-react';
import { CodeSnippet } from '../types';
import { useAuth } from '../context/AuthContext';
import { sendChatMessage } from '../services/api';

export const DevToolsView: React.FC = () => {
  const { getStorageKey } = useAuth();
  const [tab, setTab] = useState<'snippets' | 'debugger' | 'playground'>('debugger');

  // Snippets storage
  const snippetsStorageKey = getStorageKey('snippets');
  const [snippets, setSnippets] = useState<CodeSnippet[]>(() => {
    try {
      const saved = localStorage.getItem(snippetsStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'snip_1',
        userId: 'default',
        title: 'Binary Search with Edge Invariants',
        language: 'TypeScript',
        code: `function binarySearch(arr: number[], target: number): number {
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
        explanation: 'Standard O(log N) binary search avoiding integer overflow in midpoint calculation.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'snip_2',
        userId: 'default',
        title: 'Debounce Hook in React 19',
        language: 'TypeScript',
        code: `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}`,
        explanation: 'Prevents excessive API calls on rapid input keystrokes.',
        created_at: new Date().toISOString(),
      },
    ];
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Snippet Modal/State
  const [newTitle, setNewTitle] = useState('');
  const [newLang, setNewLang] = useState('TypeScript');
  const [newCode, setNewCode] = useState('');
  const [newExpl, setNewExpl] = useState('');
  const [isAddingSnippet, setIsAddingSnippet] = useState(false);

  // Debugger state
  const [buggyCode, setBuggyCode] = useState(
    `function calculateAverage(grades: number[]) {\n  let sum = 0;\n  for (let i = 0; i <= grades.length; i++) {\n    sum += grades[i];\n  }\n  return sum / grades.length;\n}`
  );
  const [stackTrace, setStackTrace] = useState('NaN returned or index out of bounds error');
  const [debugOutput, setDebugOutput] = useState('');
  const [debugLoading, setDebugLoading] = useState(false);

  // Playground state
  const [playModel, setPlayModel] = useState('gemini-3.8-flash');
  const [playSysInst, setPlaySysInst] = useState(
    'You are a rigorous campus software compiler and systems engineer.'
  );
  const [playPrompt, setPlayPrompt] = useState(
    'Compare PostgreSQL B-Tree indexing vs. Hash indexing for university registrar databases.'
  );
  const [playOutput, setPlayOutput] = useState('');
  const [playLoading, setPlayLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(snippetsStorageKey, JSON.stringify(snippets));
  }, [snippets, snippetsStorageKey]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim()) return;

    const record: CodeSnippet = {
      id: 'snip_' + crypto.randomUUID(),
      userId: 'user',
      title: newTitle.trim(),
      language: newLang,
      code: newCode.trim(),
      explanation: newExpl.trim(),
      created_at: new Date().toISOString(),
    };

    setSnippets([record, ...snippets]);
    setNewTitle('');
    setNewCode('');
    setNewExpl('');
    setIsAddingSnippet(false);
  };

  const handleDeleteSnippet = (id: string) => {
    setSnippets(snippets.filter((s) => s.id !== id));
  };

  const handleRunDebugger = async () => {
    if (!buggyCode.trim() || debugLoading) return;
    setDebugLoading(true);
    setDebugOutput('');

    try {
      const prompt = `Act as an expert software debugger.
Diagnose the following code and error:
[CODE]:
\`\`\`
${buggyCode}
\`\`\`

[ERROR / STACK TRACE / SYMPTOM]:
${stackTrace || 'Code misbehaves or returns incorrect values.'}

Provide:
1. Root cause explanation of the bug.
2. The exact fixed code with inline comments highlighting the correction.
3. Unit test case demonstrating the fix.`;

      const res = await sendChatMessage({
        messages: [{ id: '1', sender: 'user', content: prompt, timestamp: '' }],
        systemInstruction: 'You are the Smart Campus AI Diagnostic & Debugging Engine.',
      });
      setDebugOutput(res);
    } catch (err: any) {
      setDebugOutput('Debug failed: ' + err.message);
    } finally {
      setDebugLoading(false);
    }
  };

  const handleRunPlayground = async () => {
    if (!playPrompt.trim() || playLoading) return;
    setPlayLoading(true);
    setPlayOutput('');

    try {
      const res = await sendChatMessage({
        messages: [{ id: '1', sender: 'user', content: playPrompt, timestamp: '' }],
        model: playModel,
        systemInstruction: playSysInst || undefined,
      });
      setPlayOutput(res);
    } catch (err: any) {
      setPlayOutput('Playground error: ' + err.message);
    } finally {
      setPlayLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-6xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Code2 className="text-sky-600" size={22} /> Campus Developer Suite
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Software engineering tools: AI code debugger, reusable code snippet vault, and model API playground.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs self-start">
          <button
            onClick={() => setTab('debugger')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              tab === 'debugger'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            AI Debugger
          </button>
          <button
            onClick={() => setTab('snippets')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              tab === 'snippets'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Snippet Library ({snippets.length})
          </button>
          <button
            onClick={() => setTab('playground')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              tab === 'playground'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            API Playground
          </button>
        </div>
      </div>

      {/* DEBUGGER TAB */}
      {tab === 'debugger' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Bug size={14} className="text-rose-500" />
              Buggy Code & Stack Trace
            </h3>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500">Source Code to Debug</label>
              <textarea
                value={buggyCode}
                onChange={(e) => setBuggyCode(e.target.value)}
                placeholder="Paste buggy function or class..."
                rows={8}
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-sky-500 leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500">
                Error Message / Symptoms (Optional)
              </label>
              <input
                type="text"
                value={stackTrace}
                onChange={(e) => setStackTrace(e.target.value)}
                placeholder="e.g. TypeError: Cannot read properties of undefined"
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-sky-500"
              />
            </div>

            <button
              onClick={handleRunDebugger}
              disabled={debugLoading || !buggyCode.trim()}
              className="mt-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              {debugLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Diagnosing Bug...
                </>
              ) : (
                <>
                  <Bug size={14} /> Diagnose & Fix Bug
                </>
              )}
            </button>
          </div>

          {/* Diagnostic Result */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3 min-h-[420px] shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-sky-600" />
                Root Cause & Patch Diff
              </span>
              {debugOutput && (
                <button
                  onClick={() => handleCopy(debugOutput, 'dbg')}
                  className="p-1 hover:text-sky-600 text-slate-400"
                  title="Copy fix"
                >
                  {copiedId === 'dbg' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px] text-xs font-mono leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 whitespace-pre-wrap text-slate-800 dark:text-slate-200">
              {debugLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw size={22} className="animate-spin text-rose-500" />
                  <span>Tracing call stack and evaluating edge conditions...</span>
                </div>
              ) : debugOutput ? (
                debugOutput
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 gap-1">
                  <p>Paste buggy code on the left and click "Diagnose & Fix Bug".</p>
                  <p className="text-[11px] text-slate-500">
                    The assistant provides the root cause, fixed code, and unit tests.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SNIPPETS TAB */}
      {tab === 'snippets' && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saved Campus Code Snippets ({snippets.length})
            </span>
            <button
              onClick={() => setIsAddingSnippet(!isAddingSnippet)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs"
            >
              <Plus size={13} /> Add Snippet
            </button>
          </div>

          {isAddingSnippet && (
            <form
              onSubmit={handleAddSnippet}
              className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl p-5 flex flex-col gap-3 shadow-md"
            >
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                New Code Snippet
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Snippet Title (e.g. QuickSort Lomuto Partition)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="Language (e.g. Python, TypeScript, C++)"
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none"
                />
              </div>
              <textarea
                placeholder="Code content..."
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                required
                rows={6}
                className="text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 outline-none focus:border-sky-500"
              />
              <input
                type="text"
                placeholder="Brief explanation / Big-O complexity note..."
                value={newExpl}
                onChange={(e) => setNewExpl(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSnippet(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Save Snippet
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snippets.map((snip) => (
              <div
                key={snip.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs gap-3"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      {snip.title}
                    </span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono">
                      {snip.language}
                    </span>
                  </div>

                  <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto max-h-48 leading-relaxed">
                    <code>{snip.code}</code>
                  </pre>

                  {snip.explanation && (
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      {snip.explanation}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleCopy(snip.code, snip.id)}
                    className="text-xs text-slate-500 hover:text-sky-600 flex items-center gap-1 font-medium transition-colors"
                  >
                    {copiedId === snip.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    <span>{copiedId === snip.id ? 'Copied' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSnippet(snip.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                    title="Delete snippet"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PLAYGROUND TAB */}
      {tab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal size={14} className="text-sky-600" /> API Configuration
            </h3>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500">Gemini Model Choice</label>
              <select
                value={playModel}
                onChange={(e) => setPlayModel(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Standard recommended)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fastest latency)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500">System Instruction</label>
              <textarea
                value={playSysInst}
                onChange={(e) => setPlaySysInst(e.target.value)}
                rows={3}
                className="text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500">Input Prompt</label>
              <textarea
                value={playPrompt}
                onChange={(e) => setPlayPrompt(e.target.value)}
                rows={4}
                className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 outline-none"
              />
            </div>

            <button
              onClick={handleRunPlayground}
              disabled={playLoading || !playPrompt.trim()}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              {playLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Querying Model...
                </>
              ) : (
                <>
                  <Play size={14} /> Execute Request
                </>
              )}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3 min-h-[440px] shadow-xs">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sparkles size={14} className="text-sky-600" /> Raw Model Response
            </span>

            <div className="flex-1 overflow-y-auto max-h-[500px] text-xs font-mono leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 whitespace-pre-wrap text-slate-800 dark:text-slate-200">
              {playLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw size={22} className="animate-spin text-sky-600" />
                  <span>Executing server-side @google/genai call...</span>
                </div>
              ) : playOutput ? (
                playOutput
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                  Click "Execute Request" to test model parameters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
