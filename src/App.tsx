import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { VoiceAssistant } from './components/VoiceAssistant';
import { CameraAssistant } from './components/CameraAssistant';
import { DocumentAssistant } from './components/DocumentAssistant';
import { ProductivityView } from './components/ProductivityView';
import { WorkspacesView } from './components/WorkspacesView';
import { PromptLibraryView } from './components/PromptLibraryView';
import { AIAgentsView } from './components/AIAgentsView';
import { ImageGenView } from './components/ImageGenView';
import { DevToolsView } from './components/DevToolsView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { ActiveTab, Conversation, Workspace } from './types';
import { Menu } from 'lucide-react';

function SmartCampusApp() {
  const { currentUser, getStorageKey } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sca_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Storage key for current user conversations
  const chatStorageKey = getStorageKey('conversations');

  // Multi-conversation state
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(chatStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    const initialChat: Conversation = {
      id: 'chat_' + crypto.randomUUID(),
      title: 'Welcome to Smart Campus Assistant',
      userId: currentUser?.id || 'default',
      model: 'gemini-3.8-flash',
      isPinned: false,
      isTemporary: false,
      messages: [
        {
          id: 'msg_welcome',
          sender: 'assistant',
          content: `### Welcome to Smart Campus Assistant 🎓
I am your comprehensive academic, research, and technical intelligence partner.

**Key capabilities ready to use:**
- 💬 **Multi-Turn Chat**: Ask university coursework questions, math proofs, or code algorithms with real-time streaming tokens.
- 🎙️ **Voice Assistant**: Hands-free push-to-talk speech recognition and read-aloud responses.
- 📷 **Camera Assistant**: Snap blackboard notes, textbook diagrams, or lab apparatus for instant OCR and concept explanation.
- 📄 **Document Assistant**: Upload DOCX, TXT, or PDF files for executive summaries and study quizzes.
- 📝 **Productivity**: AI-assisted markdown study notes with auto-save and task management.
- 👥 **Workspaces**: Collaborate with study cohorts, assign editor/viewer roles, and share knowledge.

How can I assist your study or research session today?`,
          timestamp: 'Just now',
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return [initialChat];
  });

  const [currentChatId, setCurrentChatId] = useState<string | null>(
    conversations[0]?.id || null
  );

  // Temporary chat state (non-persisted)
  const [tempConversation, setTempConversation] = useState<Conversation | null>(null);

  // Workspaces state
  const wsStorageKey = getStorageKey('workspaces');
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    try {
      const saved = localStorage.getItem(wsStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}

    return [
      {
        id: 'ws_demo_1',
        name: 'CS450 Distributed Systems Lab',
        description: 'Collaborative study space for Raft, Paxos, and cloud algorithms',
        ownerId: currentUser?.id || 'demo_owner',
        created_at: new Date().toISOString(),
        members: [
          {
            userId: currentUser?.id || 'demo_owner',
            email: currentUser?.email || 'mousami@cutm.ac.in',
            fullName: currentUser?.fullName || 'Mousami',
            role: 'owner',
            joined_at: new Date().toISOString(),
          },
          {
            userId: 'usr_ta_1',
            email: 'ta.sarah@cutm.ac.in',
            fullName: 'Sarah Chen (TA)',
            role: 'editor',
            joined_at: new Date().toISOString(),
          },
        ],
      },
      {
        id: 'ws_demo_2',
        name: 'Biochemistry 2026 Study Group',
        description: 'Metabolic pathways, enzyme kinetics, and midterm review',
        ownerId: currentUser?.id || 'demo_owner',
        created_at: new Date().toISOString(),
        members: [
          {
            userId: currentUser?.id || 'demo_owner',
            email: currentUser?.email || 'mousami@cutm.ac.in',
            fullName: currentUser?.fullName || 'Mousami',
            role: 'owner',
            joined_at: new Date().toISOString(),
          },
        ],
      },
    ];
  });

  // Sync dark theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sca_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sca_theme', 'light');
    }
  }, [darkMode]);

  // Sync conversations to localStorage (only non-temporary chats)
  useEffect(() => {
    const persistable = conversations.filter((c) => !c.isTemporary);
    localStorage.setItem(chatStorageKey, JSON.stringify(persistable));
  }, [conversations, chatStorageKey]);

  // Sync workspaces to localStorage
  useEffect(() => {
    localStorage.setItem(wsStorageKey, JSON.stringify(workspaces));
  }, [workspaces, wsStorageKey]);

  // Active chat getter
  const activeConversation: Conversation = tempConversation
    ? tempConversation
    : conversations.find((c) => c.id === currentChatId) ||
      conversations[0] || {
        id: 'fallback',
        title: 'New Conversation',
        userId: currentUser?.id || 'default',
        model: 'gemini-3.8-flash',
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

  const handleNewChat = (isTemp = false) => {
    if (isTemp) {
      const tempChat: Conversation = {
        id: 'temp_' + crypto.randomUUID(),
        title: 'Temporary Session',
        userId: currentUser?.id || 'guest',
        model: 'gemini-3.8-flash',
        isTemporary: true,
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTempConversation(tempChat);
      setCurrentChatId(tempChat.id);
    } else {
      setTempConversation(null);
      const newChat: Conversation = {
        id: 'chat_' + crypto.randomUUID(),
        title: 'New Conversation',
        userId: currentUser?.id || 'default',
        model: 'gemini-3.8-flash',
        isPinned: false,
        isTemporary: false,
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConversations([newChat, ...conversations]);
      setCurrentChatId(newChat.id);
    }
    setActiveTab('chat');
  };

  const handleSelectChat = (id: string) => {
    setTempConversation(null);
    setCurrentChatId(id);
    setActiveTab('chat');
  };

  const handleDeleteChat = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    if (currentChatId === id) {
      setCurrentChatId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setConversations(
      conversations.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleTogglePinChat = (id: string) => {
    setConversations(
      conversations.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  const handleUpdateConversation = (updated: Conversation) => {
    if (updated.isTemporary) {
      setTempConversation(updated);
    } else {
      setConversations(conversations.map((c) => (c.id === updated.id ? updated : c)));
    }
  };

  // 1-Click Launch from Prompts / Agents into Chat
  const handleLaunchPromptInChat = (promptText: string) => {
    handleNewChat(false);
    // Switch to chat with user query
    setTimeout(() => {
      setActiveTab('chat');
    }, 50);
  };

  const handleLaunchAgentInChat = (agentName: string, systemInstruction: string, samplePrompt?: string) => {
    const agentChat: Conversation = {
      id: 'chat_' + crypto.randomUUID(),
      title: `${agentName} Session`,
      userId: currentUser?.id || 'default',
      model: 'gemini-3.8-flash',
      isPinned: false,
      isTemporary: false,
      messages: samplePrompt
        ? [
            {
              id: 'init_user',
              sender: 'user',
              content: samplePrompt,
              timestamp: 'Just now',
            },
          ]
        : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setConversations([agentChat, ...conversations]);
    setCurrentChatId(agentChat.id);
    setTempConversation(null);
    setActiveTab('chat');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
      {/* Sidebar Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conversations={conversations}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onTogglePinChat={handleTogglePinChat}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Navbar */}
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Toggle Menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <Navbar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onOpenAuth={() => setAuthModalOpen(true)}
              onOpenProfile={() => setProfileModalOpen(true)}
            />
          </div>
        </div>

        {/* Tab Route Switching */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'dashboard' && (
            <ProductivityView
              initialTab="dashboard"
              conversations={conversations}
              setActiveTab={setActiveTab}
              onNewChat={() => handleNewChat(false)}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView
              currentConversation={activeConversation}
              onUpdateConversation={handleUpdateConversation}
              isTemporary={Boolean(tempConversation)}
            />
          )}

          {activeTab === 'voice' && <VoiceAssistant />}

          {activeTab === 'camera' && <CameraAssistant />}

          {activeTab === 'documents' && <DocumentAssistant />}

          {activeTab === 'notes' && (
            <ProductivityView
              initialTab="notes"
              conversations={conversations}
              setActiveTab={setActiveTab}
              onNewChat={() => handleNewChat(false)}
            />
          )}

          {activeTab === 'tasks' && (
            <ProductivityView
              initialTab="tasks"
              conversations={conversations}
              setActiveTab={setActiveTab}
              onNewChat={() => handleNewChat(false)}
            />
          )}

          {activeTab === 'workspaces' && (
            <WorkspacesView
              workspaces={workspaces}
              onUpdateWorkspaces={setWorkspaces}
              onSelectWorkspace={() => setActiveTab('chat')}
            />
          )}

          {activeTab === 'agents' && (
            <AIAgentsView onLaunchAgentInChat={handleLaunchAgentInChat} />
          )}

          {activeTab === 'prompts' && (
            <PromptLibraryView onUsePrompt={handleLaunchPromptInChat} />
          )}

          {activeTab === 'imagegen' && <ImageGenView />}

          {activeTab === 'devtools' && <DevToolsView />}

          {activeTab === 'settings' && (
            <SettingsView darkMode={darkMode} setDarkMode={setDarkMode} />
          )}
        </main>
      </div>

      {/* Auth & Profile Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SmartCampusApp />
    </AuthProvider>
  );
}
