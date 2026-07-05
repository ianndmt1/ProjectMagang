"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Profile } from "@/lib/auth/getProfile";

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/admin/me");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        } else {
          // Middleware usually handles unauthorized redirects, but we handle the error state just in case
          setError("Gagal memuat profil");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin text-teal-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
          </svg>
          <div className="text-sm font-medium text-slate-500">Memuat profil...</div>
        </div>
      </div>
    );
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, error }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
