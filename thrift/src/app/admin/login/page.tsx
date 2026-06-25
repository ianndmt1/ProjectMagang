'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { KeyRound, Mail, AlertCircle, Loader2 } from 'lucide-react';
import ThemeToggle from '@/components/ui/theme-toggle';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setErrorMsg(data.message || 'Username atau password salah.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg('Terdapat kendala koneksi sistem.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F2ED] flex flex-col justify-center items-center p-4 font-sans text-text-main selection:bg-rust selection:text-paper relative">
      
      {/* Theme toggle position absolute top right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle size="md" />
      </div>

      {/* Brand Label */}
      <div className="mb-8 text-center select-none">
        <span className="font-serif italic text-2xl font-bold tracking-wide text-text-main">
          Santdoor<span className="text-tan font-sans font-normal not-italic text-sm tracking-widest ml-1">.ADMIN</span>
        </span>
        <p className="font-mono text-[9px] text-text-muted tracking-widest uppercase mt-2">
          Akses Aman Depot Operasional B.03 Klaten
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-[#F8F6F1] border border-[#E8E6E1] p-8 w-full max-w-md space-y-6 rounded-[2px] shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
        <div className="text-center space-y-1">
          <h2 className="font-serif italic text-xl font-bold text-text-main">
            Akses Masuk
          </h2>
          <p className="text-xs text-text-muted">
            Halaman ini khusus untuk administrator depot.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rust/10 border border-rust/30 text-rust text-xs p-3 flex items-start gap-2.5 font-medium leading-relaxed rounded-[2px]">
            <AlertCircle className="w-4 h-4 text-rust flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Username input */}
          <div className="space-y-1.5">
            <label className="font-sans text-[11px] text-text-muted uppercase font-semibold tracking-wider block">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full bg-white border border-[#E8E6E1] pl-9 pr-3.5 py-2.5 font-sans text-sm text-text-main placeholder-text-muted/50 focus:outline-none focus:border-rust transition-colors rounded-[2px] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="font-sans text-[11px] text-text-muted uppercase font-semibold tracking-wider block">
              Akses Kata Sandi
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-white border border-[#E8E6E1] pl-9 pr-3.5 py-2.5 font-sans text-sm text-text-main placeholder-text-muted/50 focus:outline-none focus:border-rust transition-colors rounded-[2px] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1A1A1A] text-[#F8F6F1] hover:bg-[#E8472A] hover:text-white font-sans text-xs uppercase font-semibold tracking-widest rounded-[2px] border border-transparent transition-all active:scale-[0.98] disabled:opacity-55 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengautentikasi...</span>
              </>
            ) : (
              <span>Masuk Dashboard</span>
            )}
          </button>
        </form>
      </div>

      {/* Footer Exit Link */}
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-xs font-semibold text-text-muted hover:text-text-main hover:underline decoration-tan decoration-1 underline-offset-4 transition-all uppercase tracking-widest"
        >
          &larr; Kembali ke Beranda Utama
        </Link>
      </div>

    </div>
  );
}
