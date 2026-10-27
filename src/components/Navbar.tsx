import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from '../types';
import { Sun, Moon, User, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  onOpenAuth,
  onOpenProfile,
}) => {
  const { currentUser, isGuest } = useAuth();

  return (
    <header className="h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between gap-8 shrink-0 z-20">
      {/* Zone 1: Single Wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            SC
          </span>
          <span>Smart Campus Assistant</span>
        </button>
      </div>

      {/* Zone 2: 4 Clean Single-Line Nav Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
        <button
          onClick={() => setActiveTab('chat')}
          className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-slate-100 ${
            activeTab === 'chat' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
          }`}
        >
          AI Chat
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-slate-100 ${
            activeTab === 'documents' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
          }`}
        >
          Document Studio
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-slate-100 ${
            activeTab === 'notes' || activeTab === 'tasks' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
          }`}
        >
          Productivity & Notes
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-slate-100 ${
            activeTab === 'agents' || activeTab === 'prompts' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
          }`}
        >
          Agents & Prompts
        </button>
        <button
          onClick={() => setActiveTab('workspaces')}
          className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-slate-100 ${
            activeTab === 'workspaces' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
          }`}
        >
          Workspaces
        </button>
      </nav>

      {/* Zone 3: Primary Action & User Zone */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-1 sm:p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {isGuest ? (
          <button
            onClick={onOpenAuth}
            className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <span className="hidden sm:inline">Sign In / Register</span>
            <span className="sm:hidden">Sign In</span>
          </button>
        ) : (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Open Account Profile"
          >
            <User size={13} className="text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="max-w-[70px] sm:max-w-[120px] truncate">{currentUser?.fullName || 'My Account'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
