import React, { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, resetPassword, continueAsGuest } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserProfile['role']>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Failed to sign in.');
        }
      } else if (mode === 'register') {
        const res = await register(email, password, fullName || 'Mousami', role);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Registration failed.');
        }
      } else if (mode === 'reset') {
        const res = await resetPassword(email);
        setResetMessage(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            SC
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {mode === 'login'
              ? 'Sign in to CUTM Account'
              : mode === 'register'
              ? 'Create CUTM Campus Account'
              : 'Reset Password'}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          {mode === 'login'
            ? 'Access your CUTM study history, documents, and workspaces.'
            : mode === 'register'
            ? 'Join Smart Campus Assistant with your Centurion University credentials.'
            : 'Enter your registered CUTM email to receive a secure recovery link.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resetMessage && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Check size={15} className="shrink-0" />
            <span>{resetMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-500">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Mousami"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-sky-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-500">Campus Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="researcher">Researcher / Graduate</option>
                  <option value="professor">Professor / Instructor</option>
                  <option value="developer">Campus Developer</option>
                </select>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                placeholder="mousami@cutm.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-sky-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-500">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-[10px] text-sky-600 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>
              {loading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                ? 'Complete Registration'
                : 'Send Recovery Code'}
            </span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Guest Demo Button */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5 text-center text-xs">
          <button
            onClick={() => {
              continueAsGuest();
              onClose();
            }}
            className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors cursor-pointer"
          >
            Continue as CUTM Guest Demo
          </button>

          <div className="text-slate-500 text-[11px]">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button onClick={() => setMode('register')} className="text-sky-600 font-semibold hover:underline cursor-pointer">
                  Register here
                </button>
              </p>
            ) : (
              <p>
                Already registered?{' '}
                <button onClick={() => setMode('login')} className="text-sky-600 font-semibold hover:underline cursor-pointer">
                  Back to sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
