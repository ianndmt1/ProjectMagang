"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/* SVG logo icon — sama dengan di landing page */
function IconLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad-login" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="8" fill="url(#logo-grad-login)" />
      <path d="M9 10h7a4 4 0 010 8H9V10z" fill="white" />
      <path d="M9 18h8a4 4 0 010 8H9V18z" fill="white" opacity="0.7" />
      <rect x="20" y="12" width="2" height="12" rx="1" fill="white" opacity="0.5" />
      <rect x="24" y="10" width="2" height="16" rx="1" fill="white" />
    </svg>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionClearedMsg, setSessionClearedMsg] = useState(false);

  const searchParams = useSearchParams();
  const isInactive = searchParams.get("error") === "inactive";

  useEffect(() => {
    async function checkAndClearSession() {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await supabase.auth.signOut();
        setSessionClearedMsg(true);
      }
    }
    checkAndClearSession();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email atau password salah. Silakan coba lagi.");
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#F8FAFC" }}
    >
      {/* Subtle grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <IconLogo size={48} />
          </div>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "#0F172A",
            }}
          >
            LaptopDoctor.AI
          </h1>
          <p className="text-xs mt-1" style={{ color: "#64748B" }}>
            Pusat Service Laptop & PC
          </p>
        </div>

        {/* Login card */}
        <div
          className="rounded-2xl p-8 border"
          style={{
            background: "white",
            borderColor: "#E2E8F0",
            boxShadow: "0 4px 24px rgba(15,23,42,0.08)",
          }}
        >
          {/* Card header */}
          <div className="mb-6">
            <h2
              className="text-center font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}
            >
              Masuk ke Dashboard
            </h2>
            <p className="text-xs text-center mt-1" style={{ color: "#64748B" }}>
              Khusus staff LaptopDoctor.AI
            </p>
          </div>

          {/* Divider */}
          <div
            className="mb-6 h-px"
            style={{ background: "#E2E8F0" }}
          />

          {/* Inactive account error */}
          {isInactive && (
            <div
              className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#DC2626",
              }}
            >
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>Akun tidak aktif, hubungi admin utama</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium mb-2"
                style={{ color: "#374151" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@laptopdoctor.ai"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  color: "#0F172A",
                  fontFamily: "var(--font-sans)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#14B8A6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(20,184,166,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E2E8F0";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium mb-2"
                style={{ color: "#374151" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  color: "#0F172A",
                  fontFamily: "var(--font-sans)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#14B8A6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(20,184,166,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E2E8F0";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#DC2626",
                }}
              >
                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? "#94A3B8"
                  : "linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)",
                boxShadow: loading ? "none" : "0 4px 16px rgba(20,184,166,0.35)",
                fontFamily: "var(--font-display)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Demo account helper box */}
          <div
            className="mt-6 p-4 rounded-xl border text-xs"
            style={{
              background: "#F0FDF4",
              borderColor: "#BBF7D0",
              color: "#166534",
            }}
          >
            <div className="flex items-center justify-between font-medium mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-900">
                <span>🔑</span> Akses Demo Staff
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail("demo@laptopdoctor.ai");
                  setPassword("demo123456");
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #0D9488 100%)",
                  boxShadow: "0 2px 8px rgba(13,148,136,0.25)",
                }}
              >
                Isi otomatis
              </button>
            </div>
            <div className="font-mono text-[11px] bg-white/80 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-slate-700 select-all mb-2">
              Coba demo: <strong className="text-slate-900 font-semibold font-sans">demo@laptopdoctor.ai</strong> / <strong className="text-slate-900 font-semibold font-sans">demo123456</strong>
            </div>
            <p className="text-[11px] text-emerald-700 leading-snug">
              Akun demo bisa dipakai siapa saja yang mencoba, mohon tidak ubah data secara permanen
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-6" style={{ color: "#94A3B8" }}>
          Halaman ini hanya untuk staff LaptopDoctor.AI
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F8FAFC" }}>
          <div className="text-sm text-slate-500">Memuat...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
