import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Copy, Check, ArrowRight, Sparkles, Trash2 } from 'lucide-react';
import { SavedPrompt } from '../types';
import { useAuth } from '../context/AuthContext';

interface PromptLibraryViewProps {
  onUsePrompt: (promptText: string) => void;
}

export const PromptLibraryView: React.FC<PromptLibraryViewProps> = ({ onUsePrompt }) => {
  const { getStorageKey } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<SavedPrompt['category']>('custom');

  const storageKey = getStorageKey('custom_prompts');
  const [prompts, setPrompts] = useState<SavedPrompt[]>(() => {
    const defaultPrompts: SavedPrompt[] = [
      {
        id: 'p1',
        title: 'Step-by-Step Algorithm Debugger',
        category: 'coding',
        description: 'Breaks down bugs, edge cases, and time/space complexity bottlenecks.',
        prompt: 'Analyze this code algorithm. Step 1: Explain the logical flaw and edge cases that cause it to fail. Step 2: Show the corrected code with inline comments. Step 3: Analyze Big-O time and space complexity with proof:\n\n[PASTE CODE HERE]',
      },
      {
        id: 'p2',
        title: 'Academic Literature Review Synthesizer',
        category: 'research',
        description: 'Structures literature reviews comparing rival methodologies and research gaps.',
        prompt: 'Act as a senior faculty researcher. Given the research topic [TOPIC], generate a structured Literature Review outline. Compare existing dominant theoretical models, highlight current methodological debates, and isolate 3 unexplored research gaps.',
      },
      {
        id: 'p3',
        title: 'Socratic Concept Explainer',
        category: 'stem',
        description: 'Explains complex university theorems or mechanisms without jargon.',
        prompt: 'Explain [CONCEPT/THEOREM] to an undergraduate student. First give a intuitive physical analogy, followed by the rigorous mathematical formulation, then walk through a real-world campus lab application.',
      },
      {
        id: 'p4',
        title: 'Final Exam Practice Question Generator',
        category: 'exam',
        description: 'Creates challenging university exam questions with step-by-step solutions.',
        prompt: 'Generate 4 rigorous university exam questions on the topic of [TOPIC/SUBJECT]. Include 2 conceptual questions and 2 multi-step problem solving problems. Provide a full grading rubric and step-by-step worked solutions for each.',
      },
      {
        id: 'p5',
        title: 'APA / IEEE Essay & Paper Proofreader',
        category: 'writing',
        description: 'Refines academic prose for clarity, academic tone, and thesis rigor.',
        prompt: 'Review the following excerpt from my paper draft. Enhance academic vocabulary, eliminate repetitive phrasing, ensure objective passive/active voice balance, and flag claims that need citation backing:\n\n[PASTE DRAFT HERE]',
      },
      {
        id: 'p6',
        title: 'Weekly Campus Study Schedule Optimizer',
        category: 'productivity',
        description: 'Builds balanced time-blocked study schedules around lectures and deadlines.',
        prompt: 'Help me build a realistic weekly study schedule. My courses and weekly workload are [COURSES]. I also have exams coming up in [EXAM DATES]. Design a Pomodoro-based schedule maximizing deep-work blocks while preventing burnout.',
      },
    ];

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const userSaved: SavedPrompt[] = JSON.parse(saved);
        return [...defaultPrompts, ...userSaved];
      }
    } catch {}
    return defaultPrompts;
  });

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'coding', label: 'Coding & Algorithms' },
    { id: 'research', label: 'Research & Literature' },
    { id: 'stem', label: 'STEM & Math' },
    { id: 'exam', label: 'Exam Prep' },
    { id: 'writing', label: 'Academic Writing' },
    { id: 'productivity', label: 'Study Productivity' },
    { id: 'custom', label: 'My Custom Prompts' },
  ];

  const filteredPrompts = prompts.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) return;

    const newRecord: SavedPrompt = {
      id: 'cust_' + crypto.randomUUID(),
      title: newTitle.trim(),
      prompt: newPrompt.trim(),
      description: newDesc.trim() || 'Custom user study prompt',
      category: newCategory,
    };

    const updated = [newRecord, ...prompts];
    setPrompts(updated);

    // Save only custom prompts
    const customOnly = updated.filter((p) => p.id.startsWith('cust_'));
    localStorage.setItem(storageKey, JSON.stringify(customOnly));

    setNewTitle('');
    setNewPrompt('');
    setNewDesc('');
    setIsAdding(false);
  };

  const handleDeleteCustom = (id: string) => {
    const updated = prompts.filter((p) => p.id !== id);
    setPrompts(updated);
    const customOnly = updated.filter((p) => p.id.startsWith('cust_'));
    localStorage.setItem(storageKey, JSON.stringify(customOnly));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="text-sky-600" size={22} /> Campus Prompt Library
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Curated, high-performing academic and programming prompts for maximum learning yield.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs self-start"
        >
          <Plus size={14} /> Add Custom Prompt
        </button>
      </div>

      {/* Add Custom Prompt Modal / Drawer */}
      {isAdding && (
        <form
          onSubmit={handleAddPrompt}
          className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl p-5 flex flex-col gap-3 shadow-md"
        >
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Create Custom Study Prompt
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Prompt Title (e.g. Physics Problem Solver)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-sky-500"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none"
            >
              <option value="coding">Coding & Tech</option>
              <option value="stem">STEM & Science</option>
              <option value="research">Research & Papers</option>
              <option value="writing">Academic Writing</option>
              <option value="exam">Exam Preparation</option>
              <option value="productivity">Productivity</option>
              <option value="custom">General Custom</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Short Description of what this prompt accomplishes..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-sky-500"
          />
          <textarea
            placeholder="Full prompt text... Use [PLACEHOLDERS] for fields you customize each time."
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            required
            rows={4}
            className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 outline-none focus:border-sky-500 font-mono"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              Save to Library
            </button>
          </div>
        </form>
      )}

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search prompts by keyword or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrompts.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-sky-300 dark:hover:border-sky-700 transition-all shadow-xs gap-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-sky-600 dark:text-sky-400">
                  {p.category}
                </span>
                {p.id.startsWith('cust_') && (
                  <button
                    onClick={() => handleDeleteCustom(p.id)}
                    className="text-slate-400 hover:text-rose-500 p-0.5"
                    title="Delete prompt"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                {p.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-2">
                {p.description}
              </p>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg text-[11px] font-mono text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed border border-slate-200/60 dark:border-slate-800/60">
                {p.prompt}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => copyToClipboard(p.prompt, p.id)}
                className="text-xs text-slate-500 hover:text-sky-600 flex items-center gap-1 font-medium transition-colors"
              >
                {copiedId === p.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copiedId === p.id ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => onUsePrompt(p.prompt)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
              >
                <span>Use in Chat</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
