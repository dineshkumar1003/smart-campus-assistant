export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  sender: Role;
  content: string;
  image?: string;
  timestamp: string;
  isPinned?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  workspaceId?: string;
  model: string;
  isPinned?: boolean;
  isTemporary?: boolean;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'researcher' | 'professor' | 'developer' | 'guest';
  department?: string;
  avatarUrl?: string;
  themePreference: 'light' | 'dark' | 'system';
}

export interface Note {
  id: string;
  userId: string;
  workspaceId?: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  due_date?: string;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  courseOrCategory?: string;
  created_at: string;
}

export interface WorkspaceMember {
  userId: string;
  email: string;
  fullName: string;
  role: 'owner' | 'editor' | 'viewer';
  joined_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: WorkspaceMember[];
  created_at: string;
}

export interface SavedPrompt {
  id: string;
  userId?: string;
  title: string;
  prompt: string;
  category: 'coding' | 'writing' | 'stem' | 'exam' | 'research' | 'productivity' | 'custom';
  description: string;
}

export interface CodeSnippet {
  id: string;
  userId: string;
  title: string;
  language: string;
  code: string;
  explanation?: string;
  created_at: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'chat'
  | 'voice'
  | 'camera'
  | 'documents'
  | 'notes'
  | 'tasks'
  | 'workspaces'
  | 'prompts'
  | 'agents'
  | 'imagegen'
  | 'devtools'
  | 'settings';
