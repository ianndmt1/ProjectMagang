"use client";

import { useState, useEffect } from "react";
import { DEFAULT_APP_SETTINGS, AppSettings } from "@/lib/settings-config";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

/* ─── Status config ─── */
interface TrackedOrder {
  invoice_code: string;
  customer_name: string;
  device_info: string;
  complaint: string;
  service_type: "toko" | "homeservice";
  category: string;
  status: "diterima" | "dicek" | "menunggu_sparepart" | "dikerjakan" | "selesai" | "sudah_diambil";
  status_label: string;
  base_price_estimate: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  diterima: {
    label: "Diterima",
    color: "#14B8A6",
    bg: "rgba(20,184,166,0.10)",
    border: "rgba(20,184,166,0.30)",
    dot: "#14B8A6",
  },
  dicek: {
    label: "Dicek",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.10)",
    border: "rgba(59,130,246,0.30)",
    dot: "#3B82F6",
  },
  menunggu_sparepart: {
    label: "Menunggu Sparepart",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.30)",
    dot: "#F59E0B",
  },
  dikerjakan: {
    label: "Dikerjakan",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.10)",
    border: "rgba(239,68,68,0.30)",
    dot: "#EF4444",
  },
  selesai: {
    label: "Selesai — Siap Diambil",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.10)",
    border: "rgba(34,197,94,0.30)",
    dot: "#22C55E",
  },
  sudah_diambil: {
    label: "Sudah Diambil",
    color: "#A855F7",
    bg: "rgba(168,85,247,0.10)",
    border: "rgba(168,85,247,0.30)",
    dot: "#A855F7",
  },
};

const FLOW_STEPS = [
  { key: "diterima", label: "Diterima" },
  { key: "dicek", label: "Dicek" },
  { key: "menunggu_sparepart", label: "Menunggu Part" },
  { key: "dikerjakan", label: "Dikerjakan" },
  { key: "selesai", label: "Selesai" },
  { key: "sudah_diambil", label: "Diambil" },
];

/* ─── SVG Logo (moved to layout components) ─── */

/* ─── Helpers ─── */
function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

/* ─── Main Component ─── */
export default function TrackStatusPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [invoiceInput, setInvoiceInput] = useState("");
  const [waInput, setWaInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((res) => {
        if (res?.data) setSettings(res.data);
      })
      .catch((err) => console.warn("Failed to fetch settings:", err));
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  /* Demo data untuk testing UI */
  const demoOrder: TrackedOrder = {
    invoice_code: "SRV-20260701-0001",
    customer_name: "Ahmad Dani",
    device_info: "Asus ZenBook UX430UA",
    complaint: "Layar LCD bergaris dan engsel kiri patah",
    service_type: "toko",
    category: "Servis Laptop",
    status: "dikerjakan",
    status_label: "Sedang dikerjakan",
    base_price_estimate: 250000,
    created_at: "2026-07-01T09:00:00Z",
    updated_at: "2026-07-01T11:30:00Z",
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInvoice = invoiceInput.trim();
    if (!cleanInvoice) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    /* Demo shortcut */
    const upper = cleanInvoice.toUpperCase();
    if (upper === "SRV-DEMO" || upper === "SRV-20260701-0001") {
      setTimeout(() => {
        setOrder(demoOrder);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      let url = `/api/orders/track?invoice=${encodeURIComponent(cleanInvoice)}`;
      if (waInput.trim()) {
        url += `&whatsapp=${encodeURIComponent(waInput.trim())}`;
      }
      const res = await fetch(url);
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Nomor invoice tidak ditemukan.");
      } else {
        setOrder(result.data);
      }
    } catch {
      setError("Gagal terhubung ke server. Coba lagi beberapa saat.");
    } finally {
      setLoading(false);
    }
  };

  const currentStepIdx = order ? FLOW_STEPS.findIndex((s) => s.key === order.status) : -1;
  const statusCfg = order ? (STATUS_CONFIG[order.status] ?? STATUS_CONFIG.diterima) : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F172A", color: "#F1F5F9" }}>

      {/* ─── HEADER ─── */}
      <SiteHeader />

      {/* ─── MAIN ─── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-14">

        {/* Hero area */}
        <div className="text-center mb-10">
          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border mb-5"
            style={{
              background: "rgba(20,184,166,0.10)",
              borderColor: "rgba(20,184,166,0.30)",
              color: "#2DD4BF",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Cek Service
          </div>

          <h1
            className="text-3xl sm:text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Cek Status Service Kamu
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Masukkan nomor invoice untuk melihat progres servis perangkat kamu secara real-time.
          </p>
        </div>

        {/* ─── FORM ─── */}
        <form
          onSubmit={handleTrack}
          className="rounded-2xl border p-4 sm:p-6 mb-8"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.09)",
          }}
        >
          {/* Inputs row — sejajar di desktop, stack di mobile */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Invoice input */}
            <div className="flex-1">
              <label className="block text-xs font-medium mb-2" style={{ color: "#94A3B8" }}>
                Nomor Invoice <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                value={invoiceInput}
                onChange={(e) => setInvoiceInput(e.target.value)}
                placeholder="Nomor invoice, contoh SRV-20260701-0004"
                required
                className="w-full px-4 py-3 min-h-[44px] rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#F1F5F9",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(20,184,166,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(20,184,166,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.10)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* WhatsApp input */}
            <div className="flex-1">
              <label className="block text-xs font-medium mb-2" style={{ color: "#94A3B8" }}>
                Nomor WhatsApp{" "}
                <span className="text-xs font-normal" style={{ color: "#64748B" }}>(opsional)</span>
              </label>
              <input
                type="tel"
                value={waInput}
                onChange={(e) => setWaInput(e.target.value)}
                placeholder="Nomor WhatsApp (opsional, untuk verifikasi)"
                className="w-full px-4 py-3 min-h-[44px] rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#F1F5F9",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(20,184,166,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(20,184,166,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.10)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Button row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Hint text kiri */}
            <p className="text-xs sm:flex-1 leading-relaxed" style={{ color: "#64748B" }}>
              Tips: ketik{" "}
              <button
                type="button"
                className="font-mono font-semibold hover:underline inline-flex items-center min-h-[32px] px-1"
                style={{ color: "#2DD4BF", background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setInvoiceInput("SRV-DEMO")}
              >
                SRV-DEMO
              </button>{" "}
              untuk mencoba tampilan hasil.
            </p>

            {/* Submit — full-width di mobile, auto di desktop */}
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-60 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)",
                boxShadow: "0 4px 16px rgba(20,184,166,0.35)",
                fontFamily: "var(--font-display)",
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  Mencari...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Cek Status
                </>
              )}
            </button>
          </div>
        </form>

        {/* ─── ERROR STATE ─── */}
        {error && (
          <div
            className="flex items-start gap-3 p-5 rounded-2xl border mb-8"
            style={{
              background: "rgba(239,68,68,0.08)",
              borderColor: "rgba(239,68,68,0.25)",
            }}
          >
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: "#FCA5A5" }}>
                Data tidak ditemukan
              </p>
              <p className="text-sm" style={{ color: "#94A3B8" }}>{error}</p>
            </div>
          </div>
        )}

        {/* ─── RESULT CARD ─── */}
        {order && statusCfg && (
          <div className="space-y-5 animate-slide-up">

            {/* Status header card */}
            <div
              className="p-6 rounded-2xl border"
              style={{
                background: statusCfg.bg,
                borderColor: statusCfg.border,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-xs font-medium mb-2" style={{ color: "#94A3B8", fontFamily: "var(--font-mono)" }}>
                    INVOICE: {order.invoice_code}
                  </div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: statusCfg.color, boxShadow: `0 0 8px ${statusCfg.color}` }}
                    />
                    <span
                      className="text-xl font-bold"
                      style={{ fontFamily: "var(--font-display)", color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "#94A3B8" }}>{order.status_label}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs mb-1" style={{ color: "#64748B" }}>Kategori</div>
                  <div className="font-semibold text-sm text-white">{order.category}</div>
                </div>
              </div>
            </div>

            {/* Progress stepper */}
            <div
              className="p-6 rounded-2xl border"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <h3
                className="text-xs font-medium mb-6"
                style={{ color: "#64748B", fontFamily: "var(--font-mono)" }}
              >
                ALUR PROSES
              </h3>

              {/* Desktop horizontal */}
              <div className="hidden md:flex items-start relative">
                {FLOW_STEPS.map((step, idx) => {
                  const isActive = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  const cfg = STATUS_CONFIG[step.key];
                  return (
                    <div key={step.key} className="flex-1 flex items-start relative">
                      {idx < FLOW_STEPS.length - 1 && (
                        <div
                          className="absolute top-5 left-[calc(50%+20px)] right-0 h-0.5 z-0 transition-all duration-500"
                          style={{
                            background: isActive && idx < currentStepIdx
                              ? `linear-gradient(90deg, ${cfg.color}80, ${STATUS_CONFIG[FLOW_STEPS[idx + 1].key].color}50)`
                              : "rgba(255,255,255,0.08)",
                          }}
                        />
                      )}
                      <div className="flex flex-col items-center text-center w-full px-1 relative z-10">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 mb-3 transition-all duration-300"
                          style={{
                            background: isCurrent ? cfg.color : isActive ? cfg.bg : "rgba(255,255,255,0.05)",
                            borderColor: isActive ? cfg.color : "rgba(255,255,255,0.12)",
                            color: isActive ? (isCurrent ? "white" : cfg.color) : "#475569",
                            boxShadow: isCurrent ? `0 0 16px ${cfg.color}60` : "none",
                            transform: isCurrent ? "scale(1.1)" : "scale(1)",
                          }}
                        >
                          {isCurrent ? "▶" : idx < currentStepIdx ? "✓" : idx + 1}
                        </div>
                        <p
                          className="text-xs font-medium leading-tight"
                          style={{
                            color: isActive ? (isCurrent ? cfg.color : "#CBD5E1") : "#475569",
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile vertical */}
              <div className="md:hidden flex flex-col gap-0">
                {FLOW_STEPS.map((step, idx) => {
                  const isActive = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  const cfg = STATUS_CONFIG[step.key];
                  return (
                    <div key={step.key} className="flex gap-4 items-start relative">
                      {idx < FLOW_STEPS.length - 1 && (
                        <div
                          className="absolute left-[19px] top-10 bottom-0 w-0.5"
                          style={{
                            background: isActive && idx < currentStepIdx
                              ? cfg.color + "60"
                              : "rgba(255,255,255,0.08)",
                          }}
                        />
                      )}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 flex-shrink-0 z-10"
                        style={{
                          background: isCurrent ? cfg.color : isActive ? cfg.bg : "rgba(255,255,255,0.05)",
                          borderColor: isActive ? cfg.color : "rgba(255,255,255,0.12)",
                          color: isActive ? (isCurrent ? "white" : cfg.color) : "#475569",
                        }}
                      >
                        {isCurrent ? "▶" : idx < currentStepIdx ? "✓" : idx + 1}
                      </div>
                      <div className="pb-8 pt-2">
                        <p
                          className="text-sm font-medium"
                          style={{
                            color: isActive ? (isCurrent ? cfg.color : "#CBD5E1") : "#475569",
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail card */}
            <div
              className="p-6 rounded-2xl border"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <h3
                className="text-xs font-medium mb-5"
                style={{ color: "#64748B", fontFamily: "var(--font-mono)" }}
              >
                DETAIL ORDER
              </h3>

              <div className="grid sm:grid-cols-2 gap-5">
                {/* Left col */}
                <div className="space-y-4">
                  <div>
                    <div className="text-xs mb-1" style={{ color: "#64748B" }}>Nama Customer</div>
                    <div className="text-sm font-medium text-white">{order.customer_name}</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: "#64748B" }}>Perangkat</div>
                    <div className="text-sm font-medium text-white">{order.device_info}</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: "#64748B" }}>Keluhan</div>
                    <div
                      className="text-sm text-slate-300 leading-relaxed p-3 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      {order.complaint}
                    </div>
                  </div>
                </div>

                {/* Right col */}
                <div className="space-y-4">
                  <div>
                    <div className="text-xs mb-1" style={{ color: "#64748B" }}>Jenis Layanan</div>
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
                      style={
                        order.service_type === "homeservice"
                          ? { background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }
                          : { background: "rgba(20,184,166,0.12)", color: "#2DD4BF", border: "1px solid rgba(20,184,166,0.3)" }
                      }
                    >
                      {order.service_type === "homeservice" ? "🏠 Homeservice" : "🏬 Toko / Workshop"}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: "#64748B" }}>Estimasi Biaya Jasa</div>
                    <div className="text-sm font-semibold" style={{ color: "#2DD4BF" }}>
                      {order.base_price_estimate > 0
                        ? fmtCurrency(order.base_price_estimate)
                        : "Ditentukan setelah cek fisik"}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#475569" }}>
                      ⚠️ Estimasi awal, harga final setelah teknisi cek.
                    </div>
                  </div>
                  <div
                    className="grid grid-cols-2 gap-3 pt-3 border-t"
                    style={{ borderColor: "rgba(255,255,255,0.07)" }}
                  >
                    <div>
                      <div className="text-xs mb-1" style={{ color: "#64748B" }}>Tanggal Masuk</div>
                      <div className="text-sm text-slate-300">{fmt(order.created_at)}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: "#64748B" }}>Update Terakhir</div>
                      <div className="text-sm text-slate-300">{fmt(order.updated_at)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div className="text-center pt-2">
              <p className="text-xs mb-3" style={{ color: "#64748B" }}>
                Ada pertanyaan? Hubungi kami langsung
              </p>
              <a
                href={`https://wa.me/${settings.shop_whatsapp}?text=Halo%20${encodeURIComponent(settings.shop_name)}%2C%20saya%20ingin%20menanyakan%20status%20servis%20invoice%20${order.invoice_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Chat WhatsApp Admin
              </a>
            </div>
          </div>
        )}
      </main>

      {/* ─── FOOTER ─── */}
      <SiteFooter settings={settings} />
    </div>
  );
}
