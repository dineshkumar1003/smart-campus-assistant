import React, { useState } from 'react';
import { X, User, Mail, GraduationCap, Shield, LogOut, Check, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, isGuest, updateProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [role, setRole] = useState<UserProfile['role']>(currentUser?.role || 'student');
  const [saved, setSaved] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName: fullName.trim() || 'Mousami',
      department: department.trim() || 'Centurion University (CUTM)',
      role,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleLogout = () => {
    logout();
    onClose();
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

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {(fullName || currentUser.fullName || 'M')[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {fullName || currentUser.fullName || 'Mousami'}
            </h2>
            <p className="text-xs text-slate-500">{currentUser.email || 'mousami@cutm.ac.in'}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500">Full Name</label>
            <input
              type="text"
              placeholder="Mousami"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-sky-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500">Department / Institution</label>
            <input
              type="text"
              placeholder="Centurion University (CUTM)"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-sky-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500">Campus Status</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 outline-none cursor-pointer"
            >
              <option value="student">Student</option>
              <option value="researcher">Researcher / Postgrad</option>
              <option value="professor">Professor / Faculty</option>
              <option value="developer">Campus Developer</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={14} /> Log Out
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              <span>{saved ? 'Saved!' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
