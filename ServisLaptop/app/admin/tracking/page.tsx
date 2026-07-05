"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Order {
  id: string;
  invoice_code: string;
  customer_name: string;
  device_info: string;
  status: "diterima" | "dicek" | "menunggu_sparepart" | "dikerjakan" | "selesai" | "sudah_diambil";
  service_type: "toko" | "homeservice";
  created_at: string;
  updated_at?: string;
  service_categories?: { name: string };
}

const FLOW_STEPS = [
  { key: "diterima",           label: "Diterima",        color: "#14B8A6", bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.35)" },
  { key: "dicek",              label: "Dicek",           color: "#3B82F6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)" },
  { key: "menunggu_sparepart", label: "Menunggu Part",   color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)" },
  { key: "dikerjakan",         label: "Dikerjakan",      color: "#EF4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)"  },
  { key: "selesai",            label: "Selesai",         color: "#22C55E", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.35)"  },
  { key: "sudah_diambil",      label: "Sudah Diambil",   color: "#A855F7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.35)" },
];

const MOCK_ORDERS: Order[] = [
  { id: "1", invoice_code: "SRV-20260701-0001", customer_name: "Ahmad Dani", device_info: "Asus ZenBook UX430UA", status: "dikerjakan", service_type: "toko", created_at: new Date().toISOString(), service_categories: { name: "Servis Laptop" } },
  { id: "2", invoice_code: "SRV-20260701-0002", customer_name: "Siti Rahma", device_info: "PC Gaming i7/RTX3060", status: "dicek", service_type: "homeservice", created_at: new Date().toISOString(), service_categories: { name: "Servis PC" } },
  { id: "3", invoice_code: "SRV-20260630-0001", customer_name: "Rian Hidayat", device_info: "MacBook Air M1 2020", status: "selesai", service_type: "toko", created_at: new Date(Date.now() - 86400000).toISOString(), service_categories: { name: "Upgrade RAM/SSD" } },
];

export default function TrackingServicePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/orders");
        const result = await res.json();
        setOrders(res.ok && result.data?.length > 0 ? result.data : MOCK_ORDERS);
      } catch {
        setOrders(MOCK_ORDERS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeOrders = orders.filter((o) => !["sudah_diambil"].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === "sudah_diambil");

  function OrderCard({ order }: { order: Order }) {
    const isExpanded = expandedId === order.id;
    const stepIdx = FLOW_STEPS.findIndex((s) => s.key === order.status);
    const currentStep = FLOW_STEPS[stepIdx];

    return (
      <div className="rounded-2xl border overflow-hidden transition-all" style={{ background: "white", borderColor: "#E2E8F0" }}>
        {/* Header row */}
        <button
          onClick={() => setExpandedId(isExpanded ? null : order.id)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: currentStep?.color ?? "#94A3B8", boxShadow: `0 0 8px ${currentStep?.color ?? "#94A3B8"}80` }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold" style={{ color: "#0F172A" }}>{order.invoice_code}</span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: currentStep?.bg, color: currentStep?.color, border: `1px solid ${currentStep?.border}` }}
                >
                  {currentStep?.label}
                </span>
                {order.service_type === "homeservice" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.10)", color: "#D97706" }}>🏠 Homeservice</span>
                )}
              </div>
              <div className="text-xs mt-1" style={{ color: "#64748B" }}>
                {order.customer_name} · {order.device_info}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href={`/admin/orders/${order.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-slate-50 transition-colors"
              style={{ borderColor: "#E2E8F0", color: "#475569" }}
            >
              Kelola
            </Link>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"
              className="transition-transform flex-shrink-0"
              style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        {/* Expanded stepper */}
        {isExpanded && (
          <div className="px-5 pb-6 border-t" style={{ borderColor: "#F1F5F9" }}>
            <div className="pt-5">
              {/* Desktop horizontal */}
              <div className="hidden sm:flex items-start relative">
                {FLOW_STEPS.map((step, idx) => {
                  const isActive = idx <= stepIdx;
                  const isCurrent = idx === stepIdx;
                  return (
                    <div key={step.key} className="flex-1 flex items-start relative">
                      {idx < FLOW_STEPS.length - 1 && (
                        <div
                          className="absolute top-5 left-[calc(50%+20px)] right-0 h-0.5 z-0 transition-all"
                          style={{ background: isActive && idx < stepIdx ? `linear-gradient(90deg, ${step.color}60, ${FLOW_STEPS[idx + 1].color}40)` : "#E2E8F0" }}
                        />
                      )}
                      <div className="flex flex-col items-center text-center w-full px-1 relative z-10">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 mb-2 transition-all"
                          style={{
                            background: isCurrent ? step.color : isActive ? step.bg : "#F8FAFC",
                            borderColor: isActive ? step.color : "#E2E8F0",
                            color: isActive ? (isCurrent ? "white" : step.color) : "#CBD5E1",
                            boxShadow: isCurrent ? `0 0 16px ${step.color}50` : "none",
                            transform: isCurrent ? "scale(1.1)" : "scale(1)",
                          }}
                        >
                          {isCurrent ? "▶" : idx < stepIdx ? "✓" : idx + 1}
                        </div>
                        <p className="text-xs font-medium leading-tight" style={{ color: isActive ? (isCurrent ? step.color : "#374151") : "#CBD5E1" }}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile vertical */}
              <div className="sm:hidden flex flex-col gap-0">
                {FLOW_STEPS.map((step, idx) => {
                  const isActive = idx <= stepIdx;
                  const isCurrent = idx === stepIdx;
                  return (
                    <div key={step.key} className="flex gap-3 items-start relative">
                      {idx < FLOW_STEPS.length - 1 && (
                        <div className="absolute left-[19px] top-10 bottom-0 w-0.5" style={{ background: isActive && idx < stepIdx ? step.color + "40" : "#E2E8F0" }} />
                      )}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 flex-shrink-0 z-10"
                        style={{ background: isCurrent ? step.color : isActive ? step.bg : "#F8FAFC", borderColor: isActive ? step.color : "#E2E8F0", color: isActive ? (isCurrent ? "white" : step.color) : "#CBD5E1" }}
                      >
                        {isCurrent ? "▶" : idx < stepIdx ? "✓" : idx + 1}
                      </div>
                      <div className="pb-6 pt-2.5">
                        <p className="text-sm font-medium" style={{ color: isActive ? (isCurrent ? step.color : "#374151") : "#CBD5E1" }}>{step.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 text-center">
                <Link href={`/admin/orders/${order.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg text-white"
                  style={{ background: "linear-gradient(135deg, #14B8A6, #3B82F6)" }}
                >
                  Update Status & Detail →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>Tracking Service</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Pantau progress alur servis tiap order</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm" style={{ color: "#94A3B8" }}>Memuat data...</div>
      ) : (
        <>
          {/* Active orders */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: "#374151" }}>
              Order Aktif <span className="text-xs font-normal ml-1" style={{ color: "#94A3B8" }}>({activeOrders.length})</span>
            </h2>
            {activeOrders.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border text-sm" style={{ borderColor: "#E2E8F0", color: "#94A3B8", background: "white" }}>Tidak ada order aktif saat ini.</div>
            ) : (
              activeOrders.map((o) => <OrderCard key={o.id} order={o} />)
            )}
          </div>

          {/* Completed orders */}
          {completedOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold" style={{ color: "#94A3B8" }}>
                Sudah Diambil <span className="text-xs font-normal ml-1">({completedOrders.length})</span>
              </h2>
              {completedOrders.map((o) => <OrderCard key={o.id} order={o} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
