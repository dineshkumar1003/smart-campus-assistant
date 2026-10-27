import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  LayoutDashboard,
  MessageSquare,
  FileText,
  Save,
  RefreshCw,
  BookOpen,
  Camera
} from 'lucide-react';
import { Note, Task, Conversation, ActiveTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { sendChatMessage } from '../services/api';

interface ProductivityViewProps {
  initialTab?: 'dashboard' | 'notes' | 'tasks';
  conversations: Conversation[];
  setActiveTab: (tab: ActiveTab) => void;
  onNewChat: () => void;
}

export const ProductivityView: React.FC<ProductivityViewProps> = ({
  initialTab = 'dashboard',
  conversations,
  setActiveTab,
  onNewChat,
}) => {
  const { getStorageKey } = useAuth();
  const [subTab, setSubTab] = useState<'dashboard' | 'notes' | 'tasks'>(initialTab);

  // Notes state
  const notesStorageKey = getStorageKey('notes');
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(notesStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'note_1',
        userId: 'default',
        title: 'Algorithms & Data Structures: Dynamic Programming Notes',
        content: `### Dynamic Programming Overview\n- Principle of Optimality: Optimal solution contains optimal sub-solutions.\n- Overlapping Subproblems: Memoization (top-down) vs Tabulation (bottom-up).\n- Classical problems: Knapsack 0/1, Longest Common Subsequence, Matrix Chain Multiplication.`,
        tags: ['CS301', 'Algorithms', 'Midterm'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'note_2',
        userId: 'default',
        title: 'Machine Learning: Transformer Attention Mechanism',
        content: `### Self-Attention Formula\n$$Attention(Q, K, V) = softmax(\\frac{QK^T}{\\sqrt{d_k}}) V$$\n- Multi-head attention projects Queries, Keys, and Values $h$ times with different learned projections.\n- Positional encodings provide sequence order info without recurrent loops.`,
        tags: ['AI', 'NeuralNetworks'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id || null);
  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];
  const [noteEditTitle, setNoteEditTitle] = useState(activeNote?.title || '');
  const [noteEditContent, setNoteEditContent] = useState(activeNote?.content || '');
  const [aiNoteLoading, setAiNoteLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('Saved');

  // Tasks state
  const tasksStorageKey = getStorageKey('tasks');
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(tasksStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'task_1',
        userId: 'default',
        title: 'Submit Distributed Systems Lab 3 (Raft Consensus)',
        due_date: 'Tomorrow at 11:59 PM',
        is_completed: false,
        priority: 'high',
        courseOrCategory: 'CS450',
        created_at: new Date().toISOString(),
      },
      {
        id: 'task_2',
        userId: 'default',
        title: 'Read Biology Chapter 14: Cellular Metabolism',
        due_date: 'In 3 days',
        is_completed: false,
        priority: 'medium',
        courseOrCategory: 'BIO102',
        created_at: new Date().toISOString(),
      },
      {
        id: 'task_3',
        userId: 'default',
        title: 'Review Midterm exam grading rubric with teaching assistant',
        due_date: 'Friday 2:00 PM',
        is_completed: true,
        priority: 'low',
        courseOrCategory: 'General',
        created_at: new Date().toISOString(),
      },
    ];
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskCourse, setNewTaskCourse] = useState('');

  // Persist notes
  useEffect(() => {
    localStorage.setItem(notesStorageKey, JSON.stringify(notes));
  }, [notes, notesStorageKey]);

  // Persist tasks
  useEffect(() => {
    localStorage.setItem(tasksStorageKey, JSON.stringify(tasks));
  }, [tasks, tasksStorageKey]);

  // Sync active note editor
  useEffect(() => {
    if (activeNote) {
      setNoteEditTitle(activeNote.title);
      setNoteEditContent(activeNote.content);
    }
  }, [activeNoteId]);

  // Auto-save note
  const handleNoteChange = (title: string, content: string) => {
    setNoteEditTitle(title);
    setNoteEditContent(content);
    setSaveStatus('Saving...');

    if (activeNote) {
      const updated = notes.map((n) =>
        n.id === activeNote.id
          ? { ...n, title, content, updated_at: new Date().toISOString() }
          : n
      );
      setNotes(updated);
      setTimeout(() => setSaveStatus('Saved'), 400);
    }
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: 'note_' + crypto.randomUUID(),
      userId: 'user',
      title: 'Untitled Campus Note',
      content: '',
      tags: ['Study'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    if (activeNoteId === id) {
      setActiveNoteId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleAiNoteAssist = async (action: 'expand' | 'summarize' | 'quiz') => {
    if (!noteEditContent.trim() || aiNoteLoading) return;
    setAiNoteLoading(true);
    try {
      let prompt = '';
      if (action === 'expand') {
        prompt = `Please expand the following study note with in-depth academic explanations, relevant campus examples, and conceptual connections:\n\n"""\n${noteEditContent}\n"""`;
      } else if (action === 'summarize') {
        prompt = `Please synthesize the following study note into clear bullet points and a cheat-sheet review block:\n\n"""\n${noteEditContent}\n"""`;
      } else {
        prompt = `Generate 3 practice flashcards or conceptual test questions with answers based on this study note:\n\n"""\n${noteEditContent}\n"""`;
      }

      const res = await sendChatMessage({
        messages: [{ id: '1', sender: 'user', content: prompt, timestamp: '' }],
        systemInstruction: 'You are Smart Campus Note Assistant. Produce clean markdown formatting.',
      });

      const expandedContent = noteEditContent + '\n\n---\n### AI Academic Enrichment\n' + res;
      handleNoteChange(noteEditTitle, expandedContent);
    } catch (err: any) {
      alert('AI note assistance error: ' + err.message);
    } finally {
      setAiNoteLoading(false);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: Task = {
      id: 'task_' + crypto.randomUUID(),
      userId: 'user',
      title: newTaskTitle.trim(),
      due_date: newTaskDue.trim() || undefined,
      priority: newTaskPriority,
      courseOrCategory: newTaskCourse.trim() || 'General',
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    setTasks([task, ...tasks]);
    setNewTaskTitle('');
    setNewTaskDue('');
    setNewTaskCourse('');
  };

  const toggleTaskComplete = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, is_completed: !t.is_completed } : t
    );
    setTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
  };

  const pendingTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl mx-auto flex flex-col gap-6">
      {/* Top Segmented Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <LayoutDashboard className="text-sky-600" size={22} /> Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centralized academic launchpad, study tools, notes, and task management.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs self-start">
          <button
            onClick={() => setSubTab('dashboard')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              subTab === 'dashboard'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setSubTab('notes')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              subTab === 'notes'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            AI Notes ({notes.length})
          </button>
          <button
            onClick={() => setSubTab('tasks')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              subTab === 'tasks'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Tasks ({pendingTasks.length} pending)
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB - ONLY QUICK ACADEMIC LAUNCHPAD */}
      {subTab === 'dashboard' && (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col gap-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={18} className="text-sky-600" />
                  Quick Academic Launchpad
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Access key campus study modules, multi-turn AI chat, document analysis, and academic tools.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                onClick={() => {
                  onNewChat();
                  setActiveTab('chat');
                }}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200/80 dark:border-slate-800 text-left transition-all hover:border-sky-300 dark:hover:border-sky-700 flex items-start gap-3.5 group shadow-xs cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Start New Chat</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Ask academic coursework questions, write code, or explore STEM concepts.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-800 text-left transition-all hover:border-indigo-300 dark:hover:border-indigo-700 flex items-start gap-3.5 group shadow-xs cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Document Assistant</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Upload syllabus, research papers, DOCX, or PDF for executive summaries.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('camera')}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/80 dark:border-slate-800 text-left transition-all hover:border-amber-300 dark:hover:border-amber-700 flex items-start gap-3.5 group shadow-xs cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
                  <Camera size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Camera & Whiteboard</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Live camera capture of blackboard notes, diagrams, and formulas with OCR.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('agents')}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-800 text-left transition-all hover:border-emerald-300 dark:hover:border-emerald-700 flex items-start gap-3.5 group shadow-xs cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Specialized AI Agents</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Dedicated personas for software engineering, academic editing, and research.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTES TAB */}
      {subTab === 'notes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Notes Sidebar List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2 shadow-xs">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Notes ({notes.length})
              </span>
              <button
                onClick={handleCreateNote}
                className="p-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-medium flex items-center gap-1 shadow-xs cursor-pointer"
                title="New Note"
              >
                <Plus size={13} /> New Note
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto pr-1">
              {notes.map((note) => {
                const isSelected = activeNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800'
                        : 'bg-slate-50/60 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex-1">
                        {note.title}
                      </h4>
                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="text-slate-400 hover:text-rose-500 p-0.5 transition-colors cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {note.content.replace(/[#*`_]/g, '') || 'Empty note...'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {note.tags.map((t, i) => (
                        <span key={i} className="text-[9px] text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Note Editor */}
          {activeNote ? (
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <input
                  type="text"
                  value={noteEditTitle}
                  onChange={(e) => handleNoteChange(e.target.value, noteEditContent)}
                  placeholder="Note Title..."
                  className="text-base font-bold text-slate-900 dark:text-slate-100 bg-transparent outline-none flex-1"
                />
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Save size={11} /> {saveStatus}
                </span>
              </div>

              {/* AI Enrichment Bar */}
              <div className="flex flex-wrap items-center gap-2 py-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} className="text-sky-600" /> AI Assist:
                </span>
                <button
                  onClick={() => handleAiNoteAssist('expand')}
                  disabled={aiNoteLoading || !noteEditContent.trim()}
                  className="px-2.5 py-1 text-xs bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Expand with Examples
                </button>
                <button
                  onClick={() => handleAiNoteAssist('summarize')}
                  disabled={aiNoteLoading || !noteEditContent.trim()}
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Synthesize Key Takeaways
                </button>
                <button
                  onClick={() => handleAiNoteAssist('quiz')}
                  disabled={aiNoteLoading || !noteEditContent.trim()}
                  className="px-2.5 py-1 text-xs bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Generate Flashcards
                </button>
                {aiNoteLoading && (
                  <RefreshCw size={12} className="animate-spin text-sky-600" />
                )}
              </div>

              <textarea
                value={noteEditContent}
                onChange={(e) => handleNoteChange(noteEditTitle, e.target.value)}
                placeholder="Write markdown note, formulas, or course lectures here..."
                rows={16}
                className="w-full text-xs md:text-sm font-mono bg-slate-50/60 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 outline-none focus:border-sky-500 leading-relaxed resize-none"
              />
            </div>
          ) : (
            <div className="md:col-span-2 text-center p-12 text-slate-400">
              No note selected. Click "New Note" to create one.
            </div>
          )}
        </div>
      )}

      {/* TASKS TAB */}
      {subTab === 'tasks' && (
        <div className="flex flex-col gap-6">
          {/* New Task Creator */}
          <form
            onSubmit={handleAddTask}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-2.5 shadow-xs"
          >
            <input
              type="text"
              placeholder="Add an assignment, lab deadline, or study reminder..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
              className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-sky-500"
            />
            <input
              type="text"
              placeholder="Due date / time (e.g. Tomorrow 5 PM)"
              value={newTaskDue}
              onChange={(e) => setNewTaskDue(e.target.value)}
              className="sm:w-48 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none"
            />
            <input
              type="text"
              placeholder="Course (e.g. CS301)"
              value={newTaskCourse}
              onChange={(e) => setNewTaskCourse(e.target.value)}
              className="sm:w-28 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none"
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as any)}
              className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 outline-none"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus size={14} /> Add Task
            </button>
          </form>

          {/* Pending Tasks List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Campus Tasks ({pendingTasks.length})
            </span>

            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                All assignments completed! Enjoy your study break.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pendingTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTaskComplete(t.id)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/70 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Circle size={16} className="text-slate-400 shrink-0 hover:text-sky-600" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          {t.due_date && <span>Due: {t.due_date}</span>}
                          {t.courseOrCategory && <span>· {t.courseOrCategory}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded capitalize ${
                          t.priority === 'high'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : t.priority === 'medium'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(t.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Completed ({completedTasks.length})
              </span>
              <div className="flex flex-col gap-1.5 opacity-70">
                {completedTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTaskComplete(t.id)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span className="line-through text-slate-500 truncate">{t.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(t.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
