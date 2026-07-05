"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ProfileProvider, useProfile } from "@/components/admin/ProfileContext";

function IconLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="sb-logo-g" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="8" fill="url(#sb-logo-g)" />
      <path d="M9 10h7a4 4 0 010 8H9V10z" fill="white" />
      <path d="M9 18h8a4 4 0 010 8H9V18z" fill="white" opacity="0.7" />
      <rect x="20" y="12" width="2" height="12" rx="1" fill="white" opacity="0.5" />
      <rect x="24" y="10" width="2" height="16" rx="1" fill="white" />
    </svg>
  );
}

/* ── Nav structure ── */
const NAV_GROUPS = [
  {
    label: null,
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        exact: true,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Unit Service",
    items: [
      {
        label: "Tiket Service",
        href: "/admin/tiket",
        exact: false,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },
      {
        label: "Tracking Service",
        href: "/admin/tracking",
        exact: false,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
      {
        label: "Diagnosa",
        href: "/admin/tiket",
        exact: false,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        ),
      },
      {
        label: "Garansi",
        href: "/admin/tiket",
        exact: false,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Keuangan",
    items: [
      {
        label: "Invoice",
        href: "/admin/invoice",
        exact: false,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        ),
      },
      {
        label: "Laporan Customer",
        href: "/admin/reports",
        exact: false,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
    ],
  },
];

/* Menu yang terkunci */
const LOCKED_GROUPS = [
  {
    label: "Inventory",
    items: ["Kategori Inventory", "Stok Masuk", "Stok Keluar"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      </svg>
    ),
  },
  {
    label: "Pembukuan & Keuangan",
    items: ["Laporan Keuangan"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    label: "Karyawan",
    items: ["Absensi", "Jadwal Kerja"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  if (isLoginPage) return <>{children}</>;

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href) && pathname !== "/admin";

  const SidebarContent = () => {
    const { profile } = useProfile();
    
    return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="px-5 py-4 flex items-center justify-between border-b flex-shrink-0"
        style={{ borderColor: "#E2E8F0" }}
      >
        <Link href="/admin" className="flex items-center gap-2.5 no-underline" onClick={() => setMobileOpen(false)}>
          <IconLogo size={28} />
          <div>
            <div className="text-sm font-bold" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>
              BK Computer
            </div>
            <div className="text-[10px]" style={{ color: "#94A3B8" }}>Admin Panel</div>
          </div>
        </Link>
        <Link
          href="/"
          className="text-xs px-2 py-1 rounded-lg border transition-colors hover:bg-slate-50"
          style={{ borderColor: "#E2E8F0", color: "#64748B" }}
        >
          Web ↗
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label ?? "main"}>
            {group.label && (
              <div
                className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2"
                style={{ color: "#94A3B8", fontFamily: "var(--font-mono)" }}
              >
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact ?? false) ||
                  (item.exact && pathname === "/admin");
                return (
                  <Link
                    key={item.label + item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: active
                        ? "linear-gradient(135deg, rgba(20,184,166,0.12), rgba(59,130,246,0.10))"
                        : "transparent",
                      color: active ? "#0F172A" : "#475569",
                      borderLeft: active ? "2px solid #14B8A6" : "2px solid transparent",
                    }}
                  >
                    <span style={{ color: active ? "#14B8A6" : "#94A3B8" }}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Locked menus */}
        <div>
          <div
            className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2"
            style={{ color: "#CBD5E1", fontFamily: "var(--font-mono)" }}
          >
            Fitur Lainnya
          </div>
          <div className="space-y-0.5">
            {LOCKED_GROUPS.map((group) => (
              <div
                key={group.label}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-not-allowed select-none"
                style={{ color: "#CBD5E1" }}
              >
                <div className="flex items-center gap-3 text-sm">
                  <span style={{ color: "#E2E8F0" }}>{group.icon}</span>
                  {group.label}
                </div>
                <span
                  className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "#F1F5F9", color: "#94A3B8", fontFamily: "var(--font-mono)" }}
                >
                  Segera
                </span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 border-t pt-4 flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
        <div
          className="flex items-center justify-between p-3 rounded-xl"
          style={{ background: "#F8FAFC" }}
        >
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: "#0F172A" }}>
              {profile?.full_name || "Admin"}
            </div>
            <div className="text-[10px] truncate mt-0.5 capitalize" style={{ color: "#94A3B8" }}>
              {profile?.role || "Staff"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
            style={{ color: "#94A3B8" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#EF4444";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    );
  };

  return (
    <ProfileProvider>
      <div className="min-h-screen flex" style={{ background: "#F8FAFC" }}>
        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex flex-col w-60 flex-shrink-0 sticky top-0 h-screen border-r"
          style={{ background: "white", borderColor: "#E2E8F0" }}
        >
          <SidebarContent />
        </aside>

        {/* Mobile top bar */}
        <div
          className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b"
          style={{ background: "white", borderColor: "#E2E8F0" }}
        >
          <Link href="/admin" className="flex items-center gap-2">
            <IconLogo size={24} />
            <span className="text-sm font-bold" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>BK Admin</span>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg"
            style={{ color: "#64748B" }}
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 bg-black/40 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <aside
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 border-r"
              style={{ background: "white", borderColor: "#E2E8F0" }}
            >
              <SidebarContent />
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 md:overflow-y-auto">
          <div className="md:hidden h-14" /> {/* mobile top bar spacer */}
          {children}
        </main>
      </div>
    </ProfileProvider>
  );
}
