'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, isDemoMode } from '@/lib/supabase';
import { Profile } from '@/lib/mockData';
import { useRouter, usePathname } from 'next/navigation';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: Profile | null;
  isLoading: boolean;
  isDemo: boolean;
  login: (email: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<void>;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const idRef = useRef(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    idRef.current += 1;
    const id = `toast-${idRef.current}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth fetch on mount and pathname changes
  useEffect(() => {
    async function loadUser() {
      setIsLoading(true);
      try {
        const u = await db.auth.getCurrentUser();
        setUser(u);
      } catch (err) {
        console.error('Error loading user session', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [pathname]);

  // Auth route protection
  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/dashboard');
      } else if (user && user.role !== 'owner' && pathname === '/user-management') {
        setTimeout(() => {
          showToast('Access Denied: Owner role required for User Management', 'error');
        }, 0);
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string) => {
    setIsLoading(true);
    const { user: loggedUser, error } = await db.auth.login(email);
    setIsLoading(false);
    
    if (error) {
      showToast(error, 'error');
      return { success: false, error };
    }
    
    setUser(loggedUser);
    showToast(`Welcome back, ${loggedUser?.name}!`, 'success');
    router.push('/dashboard');
    return { success: true, error: null };
  };

  const logout = async () => {
    setIsLoading(true);
    await db.auth.logout();
    setUser(null);
    setIsLoading(false);
    showToast('Logged out successfully', 'success');
    router.push('/login');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        isDemo: isDemoMode,
        login,
        logout,
        toasts,
        showToast,
        removeToast,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
      
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-slide-in ${
              t.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : t.type === 'error'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}
          >
            <span className="text-sm font-medium">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-4 hover:opacity-75 transition-opacity"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
