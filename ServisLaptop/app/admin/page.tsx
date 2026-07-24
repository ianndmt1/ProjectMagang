"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProfile } from "@/components/admin/ProfileContext";

interface Order {
  id: string;
  invoice_code: string;
  customer_name: string;
  customer_phone: string;
  device_info: string;
  status: "diterima" | "dicek" | "menunggu_sparepart" | "dikerjakan" | "selesai" | "sudah_diambil";
  service_type: "toko" | "homeservice";
  final_price: number | null;
  created_at: string;
  updated_at?: string;
  service_categories?: { name: string };
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  diterima:          { label: "Diterima",           color: "#14B8A6", bg: "rgba(20,184,166,0.10)",  border: "rgba(20,184,166,0.30)" },
  dicek:             { label: "Dicek",              color: "#3B82F6", bg: "rgba(59,130,246,0.10)",  border: "rgba(59,130,246,0.30)" },
  menunggu_sparepart:{ label: "Menunggu Part",      color: "#F59E0B", bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.30)" },
  dikerjakan:        { label: "Dikerjakan",          color: "#EF4444", bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.30)"  },
  selesai:           { label: "Selesai",             color: "#22C55E", bg: "rgba(34,197,94,0.10)",   border: "rgba(34,197,94,0.30)"  },
  sudah_diambil:     { label: "Sudah Diambil",       color: "#A855F7", bg: "rgba(168,85,247,0.10)",  border: "rgba(168,85,247,0.30)" },
};

const MOCK_ORDERS: Order[] = [
  { id: "1", invoice_code: "SRV-20260701-0001", customer_name: "Ahmad Dani", customer_phone: "6285123456789", device_info: "Asus ZenBook UX430UA", status: "dikerjakan", service_type: "toko", final_price: null, created_at: new Date().toISOString(), service_categories: { name: "Servis Laptop" } },
  { id: "2", invoice_code: "SRV-20260701-0002", customer_name: "Siti Rahma", customer_phone: "6285787654321", device_info: "PC Gaming i7/RTX3060", status: "dicek", service_type: "homeservice", final_price: null, created_at: new Date().toISOString(), service_categories: { name: "Servis PC" } },
  { id: "3", invoice_code: "SRV-20260630-0001", customer_name: "Rian Hidayat", customer_phone: "6281222333444", device_info: "MacBook Air M1 2020", status: "selesai", service_type: "toko", final_price: 1800000, created_at: new Date(Date.now() - 86400000).toISOString(), service_categories: { name: "Upgrade RAM/SSD" } },
];

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function AdminDashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toDateString();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/orders");
        const result = await res.json();
        if (res.ok && result.data?.length > 0) {
          setOrders(result.data);
        } else {
          setOrders(MOCK_ORDERS);
        }
      } catch {
        setOrders(MOCK_ORDERS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Statistik
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const activeOrders = orders.filter((o) => !["selesai", "sudah_diambil"].includes(o.status));
  const todayDone = orders.filter((o) => ["selesai", "sudah_diambil"].includes(o.status) && new Date(o.updated_at ?? o.created_at).toDateString() === today);
  const homeserviceActive = orders.filter((o) => o.service_type === "homeservice" && !["selesai", "sudah_diambil"].includes(o.status));

  const statusCounts = Object.keys(STATUS_CFG).map((key) => ({
    key,
    label: STATUS_CFG[key].label,
    color: STATUS_CFG[key].color,
    bg: STATUS_CFG[key].bg,
    border: STATUS_CFG[key].border,
    count: orders.filter((o) => o.status === key).length,
  }));

  const recentOrders = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold capitalize" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>
            {profileLoading ? "Halo, Admin" : `Halo, ${profile?.full_name || "Admin"} (${profile?.role || "Staff"})`}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
            Ringkasan aktivitas servis LaptopDoctor.AI hari ini
          </p>
        </div>
        <Link
          href="/admin/tiket"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg, #14B8A6, #3B82F6)", boxShadow: "0 4px 16px rgba(20,184,166,0.3)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Buat Tiket Baru
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Masuk Hari Ini", value: todayOrders.length, unit: "tiket", color: "#14B8A6", icon: "📥" },
          { label: "Sedang Aktif", value: activeOrders.length, unit: "order", color: "#3B82F6", icon: "⚙️" },
          { label: "Selesai Hari Ini", value: todayDone.length, unit: "unit", color: "#22C55E", icon: "✅" },
          { label: "Homeservice Aktif", value: homeserviceActive.length, unit: "panggilan", color: "#F59E0B", icon: "🏠" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-2xl border"
            style={{ background: "white", borderColor: "#E2E8F0" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl">{stat.icon}</span>
              <div
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: stat.color + "15", color: stat.color }}
              >
                Live
              </div>
            </div>
            <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>
              {loading ? "—" : stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: "#94A3B8" }}>
              {stat.unit} · {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="rounded-2xl border p-5" style={{ background: "white", borderColor: "#E2E8F0" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>
          Distribusi Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statusCounts.map((s) => (
            <div
              key={s.key}
              className="p-3 rounded-xl border text-center"
              style={{ background: s.bg, borderColor: s.border }}
            >
              <div className="text-xl font-bold" style={{ color: s.color, fontFamily: "var(--font-display)" }}>
                {loading ? "—" : s.count}
              </div>
              <div className="text-xs mt-1 leading-tight" style={{ color: s.color }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border" style={{ background: "white", borderColor: "#E2E8F0" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>
            Order Terbaru
          </h2>
          <Link href="/admin/tiket" className="text-xs font-medium hover:underline" style={{ color: "#14B8A6" }}>
            Lihat semua →
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: "#94A3B8" }}>Memuat data...</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
            {recentOrders.map((order) => {
              const cfg = STATUS_CFG[order.status];
              return (
                <div key={order.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold" style={{ color: "#0F172A" }}>
                        {order.invoice_code}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: "#64748B" }}>
                      {order.customer_name} · {order.device_info}
                    </div>
                  </div>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-slate-50 flex-shrink-0"
                    style={{ borderColor: "#E2E8F0", color: "#475569" }}
                  >
                    Kelola
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
