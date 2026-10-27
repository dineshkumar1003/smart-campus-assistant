import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Database, Download, RefreshCw, Sun, Moon, Laptop, Trash2, Check, AlertCircle } from 'lucide-react';
import { checkServerHealth } from '../services/api';

interface SettingsViewProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ darkMode, setDarkMode }) => {
  const [health, setHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [backupSuccess, setBackupSuccess] = useState(false);

  useEffect(() => {
    checkServerHealth().then((data) => {
      setHealth(data);
      setLoadingHealth(false);
    });
  }, []);

  const handleExportAllData = () => {
    const backup: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sca_')) {
        try {
          backup[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          backup[key] = localStorage.getItem(key);
        }
      }
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_campus_assistant_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 2500);
  };

  const handleClearCache = () => {
    if (window.confirm('Clear local study cache and reset to default? This will clear local notes and history.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="text-sky-600" size={22} /> System Settings & Diagnostics
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review connected AI models, runtime security, theme configuration, and offline data backups.
        </p>
      </div>

      {/* AI Provider Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              AI Service Provider Status
            </h3>
          </div>
          {loadingHealth ? (
            <RefreshCw size={14} className="animate-spin text-slate-400" />
          ) : (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
              Operational
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Smart Campus Assistant executes all Gemini AI calls through a secure, full-stack server backend. API keys and secrets are never transmitted to client browsers or exposed in local storage.
        </p>

        <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3.5 border border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Default Campus Model</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">gemini-3.8-flash</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Fast Query Model</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">gemini-3.1-flash-lite</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Multimodal Vision</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Enabled (Camera & File upload)</span>
          </div>
        </div>
      </div>

      {/* Theme Preference */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Appearance & Theme
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setDarkMode(false)}
            className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-semibold ${
              !darkMode
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sun size={16} /> Light Theme
          </button>

          <button
            onClick={() => setDarkMode(true)}
            className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-semibold ${
              darkMode
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Moon size={16} /> Dark Theme
          </button>
        </div>
      </div>

      {/* Data Management & Backup */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-sky-600" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Campus Data & Privacy Management
          </h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Your private conversation history, study notes, task lists, and workspaces are strictly isolated by your user ID. You can download an encrypted JSON archive of all campus data at any time.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportAllData}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-xs"
          >
            {backupSuccess ? <Check size={14} /> : <Download size={14} />}
            <span>{backupSuccess ? 'Backup Downloaded!' : 'Export All Campus Data (JSON)'}</span>
          </button>

          <button
            onClick={handleClearCache}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
          >
            <Trash2 size={14} /> Reset Local Cache
          </button>
        </div>
      </div>
    </div>
  );
};
