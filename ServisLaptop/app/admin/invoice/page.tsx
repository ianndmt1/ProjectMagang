"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Order {
  id: string;
  invoice_code: string;
  customer_name: string;
  customer_phone: string;
  device_info: string;
  status: string;
  service_categories?: { name: string };
  base_price_estimate: number | null;
  final_price: number | null;
  payment_status: "belum_bayar" | "dp" | "lunas" | null;
  warranty_days: number | null;
  created_at: string;
}

const PAYMENT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  belum_bayar: { label: "Belum Bayar", color: "#EF4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)" },
  dp:          { label: "DP / Cicilan", color: "#F59E0B", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)" },
  lunas:       { label: "Lunas",        color: "#22C55E", bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.25)" },
};

const STATUS_COLOR: Record<string, string> = {
  diterima: "#14B8A6", dicek: "#3B82F6", menunggu_sparepart: "#F59E0B",
  dikerjakan: "#EF4444", selesai: "#22C55E", sudah_diambil: "#A855F7",
};

const MOCK_ORDERS: Order[] = [
  { id: "1", invoice_code: "SRV-20260701-0001", customer_name: "Ahmad Dani", customer_phone: "6285123456789", device_info: "Asus ZenBook UX430UA", status: "dikerjakan", service_categories: { name: "Servis Laptop" }, base_price_estimate: 250000, final_price: null, payment_status: "belum_bayar", warranty_days: 30, created_at: new Date().toISOString() },
  { id: "2", invoice_code: "SRV-20260701-0002", customer_name: "Siti Rahma", customer_phone: "6285787654321", device_info: "PC Gaming i7/RTX3060", status: "dicek", service_categories: { name: "Servis PC" }, base_price_estimate: 150000, final_price: null, payment_status: "dp", warranty_days: null, created_at: new Date().toISOString() },
  { id: "3", invoice_code: "SRV-20260630-0001", customer_name: "Rian Hidayat", customer_phone: "6281222333444", device_info: "MacBook Air M1 2020", status: "selesai", service_categories: { name: "Upgrade RAM/SSD" }, base_price_estimate: 200000, final_price: 1800000, payment_status: "lunas", warranty_days: 90, created_at: new Date(Date.now() - 86400000).toISOString() },
];

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function InvoicePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [newPaymentStatus, setNewPaymentStatus] = useState<"belum_bayar" | "dp" | "lunas">("belum_bayar");
  const [filterPayment, setFilterPayment] = useState("Semua");

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

  const handleUpdatePayment = async () => {
    if (!selectedOrder) return;
    setUpdatingPayment(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: newPaymentStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => o.id === selectedOrder.id ? { ...o, payment_status: newPaymentStatus } : o)
        );
        setSelectedOrder((prev) => prev ? { ...prev, payment_status: newPaymentStatus } : null);
      } else {
        alert("Gagal memperbarui status pembayaran.");
      }
    } catch { alert("Kesalahan koneksi."); }
    finally { setUpdatingPayment(false); }
  };

  const openInvoice = (order: Order) => {
    setSelectedOrder(order);
    setNewPaymentStatus(order.payment_status ?? "belum_bayar");
  };

  const filtered = orders.filter((o) => {
    if (filterPayment === "Semua") return true;
    return (o.payment_status ?? "belum_bayar") === filterPayment;
  });

  const totalRevenue = orders.reduce((s, o) => s + (o.final_price ?? 0), 0);
  const lunas = orders.filter((o) => o.payment_status === "lunas").length;
  const belumBayar = orders.filter((o) => (o.payment_status ?? "belum_bayar") === "belum_bayar" && o.final_price).length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>Invoice</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Kelola status pembayaran tiap order</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Pendapatan", value: fmtCurrency(totalRevenue), icon: "💰", color: "#22C55E" },
          { label: "Sudah Lunas", value: `${lunas} order`, icon: "✅", color: "#22C55E" },
          { label: "Menunggu Bayar", value: `${belumBayar} order`, icon: "⏳", color: "#EF4444" },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl border" style={{ background: "white", borderColor: "#E2E8F0" }}>
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter + table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "#E2E8F0" }}>
        <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: "#F1F5F9", background: "#F8FAFC" }}>
          <span className="text-sm font-semibold" style={{ color: "#374151" }}>Daftar Invoice</span>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs border"
            style={{ borderColor: "#E2E8F0", color: "#374151", cursor: "pointer" }}
          >
            <option value="Semua">Semua Pembayaran</option>
            <option value="belum_bayar">Belum Bayar</option>
            <option value="dp">DP / Cicilan</option>
            <option value="lunas">Lunas</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: "#94A3B8" }}>Memuat data...</div>
        ) : (
          <>
            {/* Desktop Table (>=768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    {["Invoice", "Customer", "Kategori", "Status Servis", "Biaya Final", "Pembayaran", "Garansi", "Aksi"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#94A3B8" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, idx) => {
                    const pCfg = PAYMENT_CFG[order.payment_status ?? "belum_bayar"];
                    const sColor = STATUS_COLOR[order.status] ?? "#94A3B8";
                    return (
                      <tr key={order.id} style={{ borderBottom: "1px solid #F1F5F9", background: idx % 2 === 0 ? "white" : "#FAFAFA" }}>
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs font-semibold" style={{ color: "#0F172A" }}>{order.invoice_code}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium" style={{ color: "#0F172A" }}>{order.customer_name}</div>
                          <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{order.device_info}</div>
                        </td>
                        <td className="px-4 py-4 text-xs" style={{ color: "#64748B" }}>{order.service_categories?.name ?? "—"}</td>
                        <td className="px-4 py-4">
                          <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ background: sColor }} />
                          <span className="text-xs" style={{ color: sColor }}>{order.status.replace("_", " ")}</span>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold" style={{ color: order.final_price ? "#0F172A" : "#CBD5E1" }}>
                          {order.final_price ? fmtCurrency(order.final_price) : "—"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: pCfg.bg, color: pCfg.color, border: `1px solid ${pCfg.border}` }}
                          >
                            {pCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {order.warranty_days && order.warranty_days > 0 ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.10)", color: "#16A34A" }}>
                              🛡️ {order.warranty_days}h
                            </span>
                          ) : <span className="text-xs" style={{ color: "#CBD5E1" }}>—</span>}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => openInvoice(order)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 min-h-[36px] rounded-lg border hover:bg-slate-50 transition-colors"
                            style={{ borderColor: "#E2E8F0", color: "#475569" }}
                          >
                            Invoice
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (<768px) */}
            <div className="md:hidden divide-y" style={{ borderColor: "#F1F5F9" }}>
              {filtered.map((order) => {
                const pCfg = PAYMENT_CFG[order.payment_status ?? "belum_bayar"];
                const sColor = STATUS_COLOR[order.status] ?? "#94A3B8";
                return (
                  <div key={order.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold" style={{ color: "#0F172A" }}>{order.invoice_code}</span>
                      <span
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: pCfg.bg, color: pCfg.color, border: `1px solid ${pCfg.border}` }}
                      >
                        {pCfg.label}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-semibold" style={{ color: "#0F172A" }}>{order.customer_name} ({order.customer_phone})</div>
                      <div className="text-xs text-slate-500">{order.service_categories?.name ?? "—"} · {order.device_info}</div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div>
                        <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ background: sColor }} />
                        <span className="capitalize" style={{ color: sColor }}>{order.status.replace("_", " ")}</span>
                      </div>
                      <div className="font-semibold text-slate-800">
                        {order.final_price ? fmtCurrency(order.final_price) : "—"}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => openInvoice(order)}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 min-h-[44px] rounded-xl border hover:bg-slate-50 transition-colors w-full"
                        style={{ borderColor: "#E2E8F0", color: "#475569" }}
                      >
                        Lihat &amp; Print Invoice →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border my-8 shadow-2xl overflow-hidden" style={{ background: "white", borderColor: "#E2E8F0" }}>
            {/* Modal header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <div>
                <h3 className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>Detail Invoice</h3>
                <p className="text-xs mt-0.5 font-mono" style={{ color: "#94A3B8" }}>{selectedOrder.invoice_code}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "#E2E8F0", color: "#475569" }}
                >
                  🖨️ Print
                </button>
                <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100" style={{ color: "#64748B" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>

            {/* Invoice body — printable area */}
            <div className="p-6 space-y-5" id="invoice-print-area">
              {/* BK Header */}
              <div className="flex items-start justify-between pb-4 border-b" style={{ borderColor: "#E2E8F0" }}>
                <div>
                  <div className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>LaptopDoctor.AI</div>
                  <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Jl. Contoh No. 123, Kota Anda</div>
                  <div className="text-xs" style={{ color: "#64748B" }}>WA: +62 812-3456-789</div>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color: "#94A3B8" }}>Tanggal</div>
                  <div className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                    {new Date(selectedOrder.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Customer info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Customer", value: selectedOrder.customer_name },
                  { label: "WhatsApp", value: selectedOrder.customer_phone },
                  { label: "Perangkat", value: selectedOrder.device_info },
                  { label: "Kategori", value: selectedOrder.service_categories?.name ?? "—" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="text-xs mb-0.5" style={{ color: "#94A3B8" }}>{row.label}</div>
                    <div className="font-medium" style={{ color: "#0F172A" }}>{row.value}</div>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#64748B" }}>Estimasi Biaya Jasa</span>
                  <span style={{ color: "#0F172A" }}>{selectedOrder.base_price_estimate ? fmtCurrency(selectedOrder.base_price_estimate) : "—"}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t" style={{ borderColor: "#E2E8F0" }}>
                  <span style={{ color: "#0F172A" }}>Biaya Final</span>
                  <span style={{ color: selectedOrder.final_price ? "#0F172A" : "#94A3B8" }}>
                    {selectedOrder.final_price ? fmtCurrency(selectedOrder.final_price) : "Belum ditentukan"}
                  </span>
                </div>
                {selectedOrder.warranty_days && selectedOrder.warranty_days > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#64748B" }}>Garansi Servis</span>
                    <span className="font-semibold" style={{ color: "#22C55E" }}>🛡️ {selectedOrder.warranty_days} hari</span>
                  </div>
                )}
              </div>

              {/* Payment status update */}
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Status Pembayaran</div>
                <div className="flex gap-2">
                  {(["belum_bayar", "dp", "lunas"] as const).map((ps) => {
                    const cfg = PAYMENT_CFG[ps];
                    return (
                      <button
                        key={ps}
                        onClick={() => setNewPaymentStatus(ps)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                        style={{
                          borderColor: newPaymentStatus === ps ? cfg.color : "#E2E8F0",
                          background: newPaymentStatus === ps ? cfg.bg : "white",
                          color: newPaymentStatus === ps ? cfg.color : "#94A3B8",
                        }}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleUpdatePayment}
                  disabled={updatingPayment || newPaymentStatus === (selectedOrder.payment_status ?? "belum_bayar")}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #14B8A6, #3B82F6)" }}
                >
                  {updatingPayment ? "Menyimpan..." : "Simpan Status Pembayaran"}
                </button>
              </div>

              <div className="text-center">
                <Link href={`/admin/orders/${selectedOrder.id}`} className="text-xs hover:underline" style={{ color: "#14B8A6" }}>
                  Lihat & edit detail order →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
