'use client';

import React, { useState } from 'react';
import { useApp } from '@/app/providers';
import { LogIn, Key, Mail, Lock, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading, isDemo } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email) {
      setFormError('Harap masukkan alamat email Anda.');
      return;
    }

    const { success, error } = await login(email);
    if (!success) {
      setFormError(error || 'Kredensial tidak valid.');
    }
  };

  const handleQuickSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setFormError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Latar Belakang Dinamis */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />

      <div className="max-w-md w-full animate-slide-in relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-extrabold text-white text-2xl mx-auto shadow-xl shadow-indigo-600/30 mb-4">
            S
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">SiKos</h2>
          <p className="text-slate-400 text-sm mt-1">Sistem Manajemen Kos</p>
        </div>

        {/* Kartu Login */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
            <LogIn className="w-4 h-4 text-indigo-500" />
            Masuk ke akun Anda
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}

            {/* Input Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder-slate-600"
                  placeholder="nama@contoh.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Input Kata Sandi */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder-slate-600"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Tombol Masuk */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Masuk
                </>
              )}
            </button>
          </form>

          {/* Tautan cepat akun demo */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Akun Demo
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickSelect('owner@sikos.com')}
                className="bg-slate-950 border border-slate-800 hover:border-indigo-500/30 text-left p-3 rounded-xl transition-all group"
              >
                <span className="block text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">Profil Pemilik</span>
                <span className="block text-[10px] text-slate-500 truncate">owner@sikos.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('admin@sikos.com')}
                className="bg-slate-950 border border-slate-800 hover:border-indigo-500/30 text-left p-3 rounded-xl transition-all group"
              >
                <span className="block text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">Profil Admin</span>
                <span className="block text-[10px] text-slate-500 truncate">admin@sikos.com</span>
              </button>
            </div>
            {isDemo && (
              <p className="text-[10px] text-amber-500 font-medium mt-3 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5">
                Catatan: Dalam Mode Demo, Anda bisa memasukkan email apa saja, namun profil yang sudah diisi akan menginisialisasi Peran yang benar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
