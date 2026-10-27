import React, { useState } from 'react';
import {
  MessageSquare,
  FileText,
  Mic,
  Camera,
  Image,
  BookOpen,
  Bot,
  Users,
  CheckSquare,
  Code2,
  Settings,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
  LayoutDashboard
} from 'lucide-react';
import { ActiveTab, Conversation } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  conversations: Conversation[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: (isTemp?: boolean) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onTogglePinChat: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  conversations,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onTogglePinChat,
  isOpen,
  setIsOpen,
}) => {
  const { currentUser, isGuest } = useAuth();
  const [chatSearch, setChatSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const primaryNavItems: { id: ActiveTab; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'voice', label: 'Voice Assistant', icon: Mic },
    { id: 'camera', label: 'Camera Assistant', icon: Camera },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'notes', label: 'AI Notes', icon: Sparkles },
    { id: 'tasks', label: 'Tasks & Reminders', icon: CheckSquare },
    { id: 'workspaces', label: 'Workspaces', icon: Users },
    { id: 'agents', label: 'AI Agents', icon: Bot },
    { id: 'prompts', label: 'Prompt Library', icon: BookOpen },
    { id: 'imagegen', label: 'Image Generation', icon: Image },
    { id: 'devtools', label: 'Developer Tools', icon: Code2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const filteredChats = conversations.filter((c) =>
    c.title.toLowerCase().includes(chatSearch.toLowerCase())
  );

  const pinnedChats = filteredChats.filter((c) => c.isPinned);
  const recentChats = filteredChats.filter((c) => !c.isPinned);

  const startEditing = (chat: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 bg-white/95 dark:bg-slate-900/95 md:bg-white/60 md:dark:bg-slate-900/60 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        {/* Top Header */}
        <div className="flex flex-col gap-3 p-3.5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between">
            {isOpen ? (
              <div className="flex items-center gap-2.5 px-1">
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  SC
                </div>
                <div>
                  <h1 className="font-bold text-xs tracking-tight leading-tight text-slate-900 dark:text-slate-100">
                    Smart Campus Assistant
                  </h1>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isGuest ? 'CUTM Portal' : currentUser?.department || 'CUTM Student'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs mx-auto shadow-sm">
                SC
              </div>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

          {/* New Chat Actions */}
          {isOpen ? (
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => {
                  onNewChat(false);
                  setActiveTab('chat');
                }}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-all shadow-xs"
              >
                <Plus size={14} /> New Chat
              </button>
              <button
                onClick={() => {
                  onNewChat(true);
                  setActiveTab('chat');
                }}
                className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-all border border-slate-200/60 dark:border-slate-700/60"
                title="Temporary chat does not persist to history"
              >
                <Flame size={13} className="text-amber-500" /> Temp Chat
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onNewChat(false);
                setActiveTab('chat');
              }}
              className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white mx-auto flex items-center justify-center shadow-xs"
              title="New Chat"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Scrollable Center: Nav & Chat History */}
        <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-4 text-xs">
          {/* Main Workspace Navigation */}
          <div className="flex flex-col gap-0.5">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={!isOpen ? item.label : undefined}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  } ${!isOpen ? 'justify-center' : ''}`}
                >
                  <Icon size={16} className={isActive ? 'text-sky-600 dark:text-sky-400 shrink-0' : 'shrink-0'} />
                  {isOpen && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Chat History Section (When open) */}
          {isOpen && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
              <div className="flex items-center justify-between px-2">
                <span className="font-semibold text-[11px] text-slate-500 dark:text-slate-400">
                  Chat History
                </span>
                <span className="text-[10px] text-slate-400">
                  {conversations.length} chats
                </span>
              </div>

              {/* Chat search */}
              <div className="relative px-1">
                <Search size={13} className="absolute left-3.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="w-full bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 pl-8 pr-2 py-1.5 rounded-md text-xs border border-transparent focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Pinned Chats */}
              {pinnedChats.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <div className="px-2 text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Pin size={10} /> Pinned
                  </div>
                  {pinnedChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        onSelectChat(chat.id);
                        setActiveTab('chat');
                      }}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                        currentChatId === chat.id && activeTab === 'chat'
                          ? 'bg-sky-100/70 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {editingId === chat.id ? (
                        <form onSubmit={(e) => handleSaveRename(chat.id, e)} className="flex-1 mr-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => setEditingId(null)}
                            autoFocus
                            className="w-full bg-white dark:bg-slate-900 border border-sky-500 rounded px-1.5 py-0.5 text-xs outline-none"
                          />
                        </form>
                      ) : (
                        <span className="truncate flex-1 pr-1">{chat.title}</span>
                      )}

                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePinChat(chat.id);
                          }}
                          className="p-1 hover:text-sky-500"
                          title="Unpin"
                        >
                          <Pin size={11} className="fill-current text-sky-500" />
                        </button>
                        <button
                          onClick={(e) => startEditing(chat, e)}
                          className="p-1 hover:text-sky-500"
                          title="Rename"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                          className="p-1 hover:text-rose-500"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Chats */}
              <div className="flex flex-col gap-0.5">
                {recentChats.length === 0 && pinnedChats.length === 0 ? (
                  <div className="px-2 py-3 text-center text-slate-400 text-[11px] italic">
                    No conversations yet
                  </div>
                ) : (
                  recentChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        onSelectChat(chat.id);
                        setActiveTab('chat');
                      }}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                        currentChatId === chat.id && activeTab === 'chat'
                          ? 'bg-sky-100/70 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {editingId === chat.id ? (
                        <form onSubmit={(e) => handleSaveRename(chat.id, e)} className="flex-1 mr-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => setEditingId(null)}
                            autoFocus
                            className="w-full bg-white dark:bg-slate-900 border border-sky-500 rounded px-1.5 py-0.5 text-xs outline-none"
                          />
                        </form>
                      ) : (
                        <span className="truncate flex-1 pr-1">{chat.title}</span>
                      )}

                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePinChat(chat.id);
                          }}
                          className="p-1 hover:text-sky-500"
                          title="Pin conversation"
                        >
                          <Pin size={11} />
                        </button>
                        <button
                          onClick={(e) => startEditing(chat, e)}
                          className="p-1 hover:text-sky-500"
                          title="Rename"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                          className="p-1 hover:text-rose-500"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom User / Status */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          {isOpen ? (
            <div className="flex items-center justify-between text-xs">
              <div className="flex flex-col truncate">
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                  {currentUser?.fullName}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {currentUser?.email}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Settings"
              >
                <Settings size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('settings')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 mx-auto flex"
              title="Settings"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
