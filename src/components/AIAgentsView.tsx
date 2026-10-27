import React, { useState } from 'react';
import {
  Code2,
  PenTool,
  Search,
  BookOpen,
  GitBranch,
  Bug,
  Sparkles,
  ArrowRight,
  Bot
} from 'lucide-react';
import { sendChatMessage } from '../services/api';

interface AgentDef {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: React.FC<{ size?: number; className?: string }>;
  accentColor: string;
  systemInstruction: string;
  sampleQuery: string;
}

interface AIAgentsViewProps {
  onLaunchAgentInChat: (agentName: string, systemInstruction: string, samplePrompt?: string) => void;
}

export const AIAgentsView: React.FC<AIAgentsViewProps> = ({ onLaunchAgentInChat }) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentDef | null>(null);
  const [inputQuery, setInputQuery] = useState('');
  const [agentOutput, setAgentOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const agents: AgentDef[] = [
    {
      id: 'coder',
      name: 'Algorithm & Code Architect',
      role: 'Computer Science & Software Engineering Specialist',
      description: 'Designs optimal data structures, solves LeetCode/ACM problems, and performs rigorous complexity audits.',
      icon: Code2,
      accentColor: 'text-sky-600',
      systemInstruction: 'You are the Senior Campus Software Engineer and Algorithm Specialist. When writing code, provide clean, modern TypeScript, Python, C++, or Java. Always discuss edge cases, space/time Big-O analysis, and defensive programming patterns.',
      sampleQuery: 'Write an efficient LRU Cache in TypeScript with O(1) get and put operations using a doubly linked list and hash map.',
    },
    {
      id: 'writer',
      name: 'Academic Paper & Thesis Editor',
      role: 'Peer-Review Prose & Citation Specialist',
      description: 'Transforms rough drafts into publication-grade academic prose adhering to IEEE, APA, or Nature style guides.',
      icon: PenTool,
      accentColor: 'text-indigo-600',
      systemInstruction: 'You are the Academic Publishing and Thesis Editor. You specialize in formal, scholarly tone, rigorous argument flow, elimination of passive redundancies, and clear methodology explanations.',
      sampleQuery: 'Edit this abstract to strengthen the thesis argument and heighten scholarly precision:\n"Our research tested if AI can help students study better by making quizzes."',
    },
    {
      id: 'researcher',
      name: 'Scientific Literature Researcher',
      role: 'Systematic Reviews & Hypothesis Formulator',
      description: 'Explores academic literature, compares opposing clinical or empirical findings, and structures methodology matrices.',
      icon: Search,
      accentColor: 'text-emerald-600',
      systemInstruction: 'You are a Principal Scientific Investigator and University Research Fellow. You guide literature reviews, synthesize disparate studies, evaluate statistical significance, and draft rigorous experimental methodologies.',
      sampleQuery: 'Outline a comparative methodology framework evaluating transformer attention vs. state-space models (Mamba) for long-context DNA sequence analysis.',
    },
    {
      id: 'story',
      name: 'Campus Script & Story Builder',
      role: 'Creative Writing & Multimedia Dramaturg',
      description: 'Drafts scripts for campus theater, university presentations, documentary voiceovers, and student film projects.',
      icon: BookOpen,
      accentColor: 'text-amber-600',
      systemInstruction: 'You are the Campus Dramaturg and Creative Scriptwriter. You craft authentic dialogue, compelling scene staging, three-act narrative structures, and pitch presentations.',
      sampleQuery: 'Draft a short 3-minute opening screenplay scene set in a university robotics lab during the night before an international robotics competition.',
    },
    {
      id: 'flowchart',
      name: 'Concept & Mind-Map Visualizer',
      role: 'Mermaid.js Diagram & Knowledge Graph Generator',
      description: 'Converts dense campus lecture topics into clear ASCII and Mermaid.js flowcharts and concept hierarchies.',
      icon: GitBranch,
      accentColor: 'text-purple-600',
      systemInstruction: 'You are the Visual Concept and Mind-Map Architect. Always provide clean Mermaid.js syntax (```mermaid) and structured ASCII mind maps that visually illustrate system architectures, biological pathways, or process lifecycles.',
      sampleQuery: 'Generate a comprehensive Mermaid diagram mapping the HTTP/3 handshake lifecycle and QUIC connection establishment.',
    },
    {
      id: 'debugger',
      name: 'AI Code Debugger & Diagnostic Engine',
      role: 'Runtime Exception & Memory Leak Hunter',
      description: 'Pinpoints memory leaks, concurrency race conditions, null dereferences, and infinite loops with exact patch diffs.',
      icon: Bug,
      accentColor: 'text-rose-600',
      systemInstruction: 'You are the Senior Debugging and Systems Diagnostic Specialist. Hunt for race conditions, stack overflows, asynchronous deadlocks, and boundary edge cases. Always present a root-cause explanation followed by an exact patch.',
      sampleQuery: 'Debug this React hook loop: useEffect(() => { fetchData().then(data => setData(data)); }, [data]);',
    },
  ];

  const handleTestAgent = async (agent: AgentDef) => {
    setSelectedAgent(agent);
    const query = inputQuery.trim() || agent.sampleQuery;
    setInputQuery(query);
    setLoading(true);
    setAgentOutput('');

    try {
      const res = await sendChatMessage({
        messages: [{ id: '1', sender: 'user', content: query, timestamp: '' }],
        systemInstruction: agent.systemInstruction,
      });
      setAgentOutput(res);
    } catch (err: any) {
      setAgentOutput('Agent query failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Bot className="text-sky-600" size={22} /> Specialized AI Agents
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Pre-tuned personas with dedicated system directives for software engineering, academic editing, research syntheses, and diagrams.
        </p>
      </div>

      {/* Agents Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-sky-300 dark:hover:border-sky-700 transition-all shadow-xs gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    <Icon size={20} className={agent.accentColor} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {agent.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{agent.role}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  {agent.description}
                </p>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg text-[11px] text-slate-500 border border-slate-200/60 dark:border-slate-800/60 italic line-clamp-2">
                  "{agent.sampleQuery}"
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleTestAgent(agent)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Quick Test
                </button>
                <button
                  onClick={() =>
                    onLaunchAgentInChat(agent.name, agent.systemInstruction, agent.sampleQuery)
                  }
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                >
                  <span>Launch Chat</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Quick-Test Console */}
      {selectedAgent && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-sm mt-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-sky-600" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Live Agent Sandbox: {selectedAgent.name}
              </h3>
            </div>
            <button
              onClick={() => setSelectedAgent(null)}
              className="text-xs text-slate-400 hover:text-rose-500"
            >
              Close Sandbox
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Prompt this agent..."
              className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-sky-500"
            />
            <button
              onClick={() => handleTestAgent(selectedAgent)}
              disabled={loading}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs shrink-0"
            >
              {loading ? 'Running...' : 'Run Query'}
            </button>
          </div>

          <div className="min-h-[160px] max-h-[400px] overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-xs font-mono leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
            {loading ? 'Consulting ' + selectedAgent.name + '...' : agentOutput || 'Output will display here.'}
          </div>
        </div>
      )}
    </div>
  );
};
