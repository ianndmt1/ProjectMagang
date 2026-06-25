'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/supabase';
import { Profile } from '@/lib/mockData';
import { useApp } from '@/app/providers';
import {
  Plus,
  Search,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  Mail,
  User,
  Calendar
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function UserManagementPage() {
  const { refreshTrigger, triggerRefresh, showToast, user: currentUser } = useApp();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'admin'>('admin');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const list = await db.profiles.list();
        setUsers(list);
      } catch (err) {
        console.error(err);
        showToast('Failed to load user management directory', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [refreshTrigger]);

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('admin');
    setIsModalOpen(true);
  };

  const openEditModal = (user: Profile) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a user name', 'error');
      return;
    }
    if (!email.trim()) {
      showToast('Please enter email address', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await db.profiles.upsert({
        id: editingUser?.id || `usr-${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        created_at: editingUser?.created_at || new Date().toISOString()
      });

      showToast(
        editingUser ? 'User details updated' : 'User account created',
        'success'
      );
      setIsModalOpen(false);
      triggerRefresh();
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Error saving user accounts';
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUser?.id) {
      showToast('Cannot delete your own active session account', 'error');
      return;
    }
    if (confirm(`Are you sure you want to revoke system access for ${name}?`)) {
      try {
        await db.profiles.delete(id);
        showToast(`Access revoked for ${name}`, 'success');
        triggerRefresh();
      } catch (err) {
        console.error(err);
        const errorMsg = err instanceof Error ? err.message : 'Error deleting user accounts';
        showToast(errorMsg, 'error');
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">User Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage boarding house managers, owners, and system access.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/10"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-700 dark:text-slate-200"
            placeholder="Search users by name or email..."
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Loading user registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm relative flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-indigo-400 uppercase text-xs border border-slate-200 dark:border-slate-700">
                      {user.name.substring(0, 2)}
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800 dark:text-slate-100">{user.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Joined {formatDate(user.created_at)}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    user.role === 'owner' 
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  }`}>
                    {user.role}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 py-3 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-4">
                <button
                  onClick={() => openEditModal(user)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-bold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                {user.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDelete(user.id, user.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-400 font-medium rounded-2xl">
              No users found matching filters.
            </div>
          )}
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white">
                {editingUser ? 'Edit User Credentials' : 'Add New System Admin'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  placeholder="e.g. Ani Admin"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!editingUser}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 disabled:opacity-50"
                  placeholder="e.g. admin@sikos.com"
                />
              </div>

              {/* Role selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'owner' | 'admin')}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="admin">Admin Manager</option>
                  <option value="owner">Owner / Proprietor</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-855 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Save User Access'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
