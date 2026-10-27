import React, { useState } from 'react';
import { Users, Plus, Shield, ShieldAlert, ShieldCheck, Mail, Trash2, Edit2, Check, Folder } from 'lucide-react';
import { Workspace, WorkspaceMember } from '../types';
import { useAuth } from '../context/AuthContext';

interface WorkspacesViewProps {
  workspaces: Workspace[];
  onUpdateWorkspaces: (workspaces: Workspace[]) => void;
  onSelectWorkspace: (workspaceId: string) => void;
}

export const WorkspacesView: React.FC<WorkspacesViewProps> = ({
  workspaces,
  onUpdateWorkspaces,
  onSelectWorkspace,
}) => {
  const { currentUser } = useAuth();
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedWsId, setSelectedWsId] = useState<string | null>(
    workspaces.length > 0 ? workspaces[0].id : null
  );

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [editingWsName, setEditingWsName] = useState('');

  const activeWorkspace = workspaces.find((w) => w.id === selectedWsId) || workspaces[0];

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim() || !currentUser) return;

    const newWs: Workspace = {
      id: 'ws_' + crypto.randomUUID(),
      name: newWsName.trim(),
      description: newWsDesc.trim() || 'Collaborative study space',
      ownerId: currentUser.id,
      created_at: new Date().toISOString(),
      members: [
        {
          userId: currentUser.id,
          email: currentUser.email,
          fullName: currentUser.fullName,
          role: 'owner',
          joined_at: new Date().toISOString(),
        },
      ],
    };

    const updated = [newWs, ...workspaces];
    onUpdateWorkspaces(updated);
    setSelectedWsId(newWs.id);
    setNewWsName('');
    setNewWsDesc('');
    setIsCreating(false);
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeWorkspace) return;

    if (activeWorkspace.members.some((m) => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
      alert('This member is already in the workspace.');
      return;
    }

    const newMember: WorkspaceMember = {
      userId: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: inviteEmail.trim(),
      fullName: inviteEmail.split('@')[0],
      role: inviteRole,
      joined_at: new Date().toISOString(),
    };

    const updated = workspaces.map((w) =>
      w.id === activeWorkspace.id
        ? { ...w, members: [...w.members, newMember] }
        : w
    );

    onUpdateWorkspaces(updated);
    setInviteEmail('');
  };

  const handleRemoveMember = (userId: string) => {
    if (!activeWorkspace) return;
    const isOwner = activeWorkspace.ownerId === currentUser?.id;
    if (!isOwner) {
      alert('Only workspace owners can remove members.');
      return;
    }

    const updatedMembers = activeWorkspace.members.filter((m) => m.userId !== userId);
    const updated = workspaces.map((w) =>
      w.id === activeWorkspace.id ? { ...w, members: updatedMembers } : w
    );
    onUpdateWorkspaces(updated);
  };

  const handleDeleteWorkspace = (id: string) => {
    if (window.confirm('Are you sure you want to delete this study workspace?')) {
      const updated = workspaces.filter((w) => w.id !== id);
      onUpdateWorkspaces(updated);
      if (selectedWsId === id) {
        setSelectedWsId(updated.length > 0 ? updated[0].id : null);
      }
    }
  };

  const handleRenameWorkspace = (id: string) => {
    if (!editingWsName.trim()) return;
    const updated = workspaces.map((w) =>
      w.id === id ? { ...w, name: editingWsName.trim() } : w
    );
    onUpdateWorkspaces(updated);
    setEditingWsId(null);
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="text-sky-600" size={22} /> Workspaces & Collaboration
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Organize study groups, capstone project teams, and shared campus lab workspaces with granular role-based permissions.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs self-start"
        >
          <Plus size={14} /> New Workspace
        </button>
      </div>

      {/* Workspace Creation Form Modal / Card */}
      {isCreating && (
        <form
          onSubmit={handleCreateWorkspace}
          className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl p-5 flex flex-col gap-3 shadow-md"
        >
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Create Study Group Workspace
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Workspace Name (e.g. CS410 AI Ethics Lab)"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              required
              className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-sky-500"
            />
            <input
              type="text"
              placeholder="Description (e.g. Weekly seminar notes & projects)"
              value={newWsDesc}
              onChange={(e) => setNewWsDesc(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-sky-500"
            />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              Create Workspace
            </button>
          </div>
        </form>
      )}

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Workspace Directory */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1">
            My Study Workspaces ({workspaces.length})
          </span>

          {workspaces.map((ws) => {
            const isSelected = activeWorkspace?.id === ws.id;
            return (
              <div
                key={ws.id}
                onClick={() => setSelectedWsId(ws.id)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Folder size={15} />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {ws.name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {ws.members.length} members · {ws.ownerId === currentUser?.id ? 'Owner' : 'Member'}
                    </p>
                  </div>
                </div>

                {ws.ownerId === currentUser?.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWorkspace(ws.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Delete workspace"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Workspace Management & Members */}
        {activeWorkspace ? (
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-5 shadow-xs">
            {/* Workspace Title & Settings */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                {editingWsId === activeWorkspace.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingWsName}
                      onChange={(e) => setEditingWsName(e.target.value)}
                      className="text-base font-bold bg-slate-50 dark:bg-slate-950 border border-sky-500 rounded px-2 py-0.5 outline-none"
                    />
                    <button
                      onClick={() => handleRenameWorkspace(activeWorkspace.id)}
                      className="p-1 text-emerald-600"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {activeWorkspace.name}
                    </h3>
                    {activeWorkspace.ownerId === currentUser?.id && (
                      <button
                        onClick={() => {
                          setEditingWsId(activeWorkspace.id);
                          setEditingWsName(activeWorkspace.name);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-600"
                        title="Rename"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-1">{activeWorkspace.description}</p>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-md font-semibold">
                  {activeWorkspace.members.length} Active Members
                </span>
              </div>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  placeholder="Invite peer or faculty (e.g. peer@cutm.ac.in)..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2 outline-none focus:border-sky-500 placeholder:text-slate-400"
                />
              </div>

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none"
              >
                <option value="editor">Role: Editor (Can Edit Notes/Chats)</option>
                <option value="viewer">Role: Viewer (Read Only)</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
              >
                Invite Member
              </button>
            </form>

            {/* Member List Table */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Workspace Members & Access Control
              </span>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {activeWorkspace.members.map((member) => (
                  <div
                    key={member.userId}
                    className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-200">
                        {member.fullName[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {member.fullName} {member.userId === currentUser?.id && '(You)'}
                        </p>
                        <p className="text-[10px] text-slate-400">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          member.role === 'owner'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : member.role === 'editor'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {member.role}
                      </span>

                      {activeWorkspace.ownerId === currentUser?.id && member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 text-center p-12 text-slate-400">
            No workspace selected.
          </div>
        )}
      </div>
    </div>
  );
};
