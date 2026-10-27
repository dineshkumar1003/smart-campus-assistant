import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  isGuest: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, fullName: string, role?: UserProfile['role']) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  continueAsGuest: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  getStorageKey: (prefix: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'sca_registered_users';
const SESSION_STORAGE_KEY = 'sca_active_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSession) {
        return JSON.parse(savedSession);
      }
    } catch (e) {
      console.error(e);
    }
    // Default to CUTM student profile for Mousami
    return {
      id: 'cutm_user_01',
      email: 'mousami@cutm.ac.in',
      fullName: 'Mousami',
      role: 'student',
      department: 'Centurion University (CUTM)',
      themePreference: 'system',
    };
  });

  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return currentUser?.id.startsWith('demo_guest') ?? false;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentUser));
      setIsGuest(currentUser.id.startsWith('demo_guest'));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setIsGuest(false);
    }
  }, [currentUser]);

  const getRegisteredUsers = (): any[] => {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const login = async (email: string, pass: string) => {
    const users = getRegisteredUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Allow seamless first-time CUTM login if using cutm.ac.in
      if (email.toLowerCase().endsWith('@cutm.ac.in')) {
        const profile: UserProfile = {
          id: 'user_' + crypto.randomUUID(),
          email: email.trim(),
          fullName: 'Mousami',
          role: 'student',
          department: 'Centurion University (CUTM)',
          themePreference: 'system',
        };
        setCurrentUser(profile);
        setIsGuest(false);
        return { success: true };
      }
      return { success: false, error: 'No account found with this email. Please register.' };
    }
    if (user.password !== pass) {
      return { success: false, error: 'Incorrect password entered.' };
    }

    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      fullName: user.fullName || 'Mousami',
      role: user.role || 'student',
      department: user.department || 'Centurion University (CUTM)',
      themePreference: user.themePreference || 'system',
    };

    setCurrentUser(profile);
    setIsGuest(false);
    return { success: true };
  };

  const register = async (email: string, pass: string, fullName: string, role: UserProfile['role'] = 'student') => {
    if (!email || !pass || pass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const users = getRegisteredUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newId = 'user_' + crypto.randomUUID();
    const newUserRecord = {
      id: newId,
      email: email.trim(),
      password: pass,
      fullName: fullName.trim() || 'Mousami',
      role,
      department: 'Centurion University (CUTM)',
      themePreference: 'system',
      created_at: new Date().toISOString(),
    };

    users.push(newUserRecord);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    const profile: UserProfile = {
      id: newId,
      email: newUserRecord.email,
      fullName: newUserRecord.fullName,
      role: newUserRecord.role,
      department: newUserRecord.department,
      themePreference: 'system',
    };

    setCurrentUser(profile);
    setIsGuest(false);
    return { success: true };
  };

  const logout = () => {
    const guestUser: UserProfile = {
      id: 'demo_guest_' + Math.random().toString(36).substring(2, 7),
      email: 'guest@cutm.ac.in',
      fullName: 'Mousami (Guest)',
      role: 'guest',
      department: 'Centurion University (CUTM)',
      themePreference: 'system',
    };
    setCurrentUser(guestUser);
    setIsGuest(true);
  };

  const continueAsGuest = () => {
    const guestUser: UserProfile = {
      id: 'demo_guest_' + Math.random().toString(36).substring(2, 7),
      email: 'guest@cutm.ac.in',
      fullName: 'Mousami (Guest)',
      role: 'guest',
      department: 'Centurion University (CUTM)',
      themePreference: 'system',
    };
    setCurrentUser(guestUser);
    setIsGuest(true);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);

    if (!isGuest) {
      const users = getRegisteredUsers();
      const idx = users.findIndex((u) => u.id === currentUser.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
    }
  };

  const resetPassword = async (email: string) => {
    return {
      success: true,
      message: `Password reset link simulated. In production this sends an encrypted auth link to ${email}.`
    };
  };

  // User storage isolation key generator
  const getStorageKey = (prefix: string) => {
    const uid = currentUser?.id || 'guest_shared';
    return `sca_${prefix}_${uid}`;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isGuest,
        login,
        register,
        logout,
        continueAsGuest,
        updateProfile,
        resetPassword,
        getStorageKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
