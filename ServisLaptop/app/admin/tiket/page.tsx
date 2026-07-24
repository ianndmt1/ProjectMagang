"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Category { id: string; name: string; }
interface Order {
  id: string;
  invoice_code: string;
  customer_name: string;
  customer_phone: string;
  device_info: string;
  complaint: string;
  service_type: "toko" | "homeservice";
  address: string | null;
  distance_km: number | null;
  transport_fee: number | null;
  status: "diterima" | "dicek" | "menunggu_sparepart" | "dikerjakan" | "selesai" | "sudah_diambil";
  base_price_estimate: number | null;
  final_price: number | null;
  admin_notes: string | null;
  warranty_days?: number | null;
  payment_status?: "belum_bayar" | "dp" | "lunas" | null;
  created_at: string;
  service_categories?: { name: string };
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  diterima:          { label: "Diterima",      color: "#14B8A6", bg: "rgba(20,184,166,0.10)",  border: "rgba(20,184,166,0.30)" },
  dicek:             { label: "Dicek",         color: "#3B82F6", bg: "rgba(59,130,246,0.10)",  border: "rgba(59,130,246,0.30)" },
  menunggu_sparepart:{ label: "Menunggu Part", color: "#F59E0B", bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.30)" },
  dikerjakan:        { label: "Dikerjakan",    color: "#EF4444", bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.30)"  },
  selesai:           { label: "Selesai",       color: "#22C55E", bg: "rgba(34,197,94,0.10)",   border: "rgba(34,197,94,0.30)"  },
  sudah_diambil:     { label: "Sudah Diambil", color: "#A855F7", bg: "rgba(168,85,247,0.10)",  border: "rgba(168,85,247,0.30)" },
};

const MOCK_ORDERS: Order[] = [
  { id: "1", invoice_code: "SRV-20260701-0001", customer_name: "Ahmad Dani", customer_phone: "6285123456789", device_info: "Asus ZenBook UX430UA", complaint: "Layar LCD bergaris dan engsel kiri patah", service_type: "toko", address: null, distance_km: null, transport_fee: null, status: "dikerjakan", base_price_estimate: 250000, final_price: null, admin_notes: "LCD dipesan, estimasi besok", warranty_days: 30, payment_status: "belum_bayar", created_at: new Date().toISOString(), service_categories: { name: "Servis Laptop" } },
  { id: "2", invoice_code: "SRV-20260701-0002", customer_name: "Siti Rahma", customer_phone: "6285787654321", device_info: "PC Gaming i7/RTX3060", complaint: "Blue screen saat gaming", service_type: "homeservice", address: "Jl. Radjiman No.45, Laweyan", distance_km: 3, transport_fee: 0, status: "dicek", base_price_estimate: 150000, final_price: null, admin_notes: "Dicek thermal paste", warranty_days: null, payment_status: "belum_bayar", created_at: new Date().toISOString(), service_categories: { name: "Servis PC" } },
  { id: "3", invoice_code: "SRV-20260630-0001", customer_name: "Rian Hidayat", customer_phone: "6281222333444", device_info: "MacBook Air M1 2020", complaint: "Upgrade SSD 256GB → 1TB", service_type: "toko", address: null, distance_km: null, transport_fee: null, status: "selesai", base_price_estimate: 200000, final_price: 1800000, admin_notes: "Selesai SSD 1TB NVMe + reinstall", warranty_days: 90, payment_status: "lunas", created_at: new Date(Date.now() - 86400000).toISOString(), service_categories: { name: "Upgrade RAM/SSD" } },
];

const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Servis Laptop" },
  { id: "cat-2", name: "Servis PC / Komputer Rakitan" },
  { id: "cat-3", name: "Jual Sparepart" },
  { id: "cat-4", name: "Upgrade RAM/SSD" },
];

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

/* ── Input style helper ── */
const inputStyle: React.CSSProperties = {
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
  color: "#0F172A",
  outline: "none",
};

export default function TiketServicePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterType, setFilterType] = useState("Semua");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: "", customer_phone: "", category_id: "", device_info: "",
    complaint: "", service_type: "toko", address: "", distance_km: "", transport_fee: "", base_price_estimate: "",
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [orderRes, catRes] = await Promise.all([fetch("/api/admin/orders"), fetch("/api/categories")]);
      const orderResult = await orderRes.json();
      const catResult = await catRes.json();
      setOrders(orderRes.ok && orderResult.data?.length > 0 ? orderResult.data : MOCK_ORDERS);
      setCategories(catRes.ok && catResult.data ? catResult.data : MOCK_CATEGORIES);
    } catch {
      setOrders(MOCK_ORDERS);
      setCategories(MOCK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...newOrder,
        distance_km: newOrder.distance_km ? parseFloat(newOrder.distance_km) : null,
        transport_fee: newOrder.transport_fee ? parseFloat(newOrder.transport_fee) : null,
        base_price_estimate: newOrder.base_price_estimate ? parseFloat(newOrder.base_price_estimate) : null,
      };
      const res = await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await res.json();
      if (res.ok) {
        await loadData();
        setShowModal(false);
        setNewOrder({ customer_name: "", customer_phone: "", category_id: "", device_info: "", complaint: "", service_type: "toko", address: "", distance_km: "", transport_fee: "", base_price_estimate: "" });
      } else {
        alert(result.error || "Gagal membuat tiket.");
      }
    } catch { alert("Kesalahan koneksi."); }
    finally { setSubmitting(false); }
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === "Semua" || o.status === filterStatus;
    const matchType = filterType === "Semua" || o.service_type === filterType;
    const q = search.toLowerCase();
    const matchSearch = !q || o.invoice_code.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.device_info.toLowerCase().includes(q);
    return matchStatus && matchType && matchSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>Tiket Service</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Kelola semua order servis masuk</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg, #14B8A6, #3B82F6)", boxShadow: "0 4px 16px rgba(20,184,166,0.3)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Buat Tiket Baru
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Cari invoice, nama, device..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm flex-1 min-w-48"
          style={{ ...inputStyle, border: "1px solid #E2E8F0" }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm"
          style={{ ...inputStyle, border: "1px solid #E2E8F0", cursor: "pointer" }}
        >
          <option value="Semua">Semua Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm"
          style={{ ...inputStyle, border: "1px solid #E2E8F0", cursor: "pointer" }}
        >
          <option value="Semua">Semua Tipe</option>
          <option value="toko">Toko</option>
          <option value="homeservice">Homeservice</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "#E2E8F0" }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9", background: "#F8FAFC" }}>
          <span className="text-sm font-semibold" style={{ color: "#374151" }}>
            {filtered.length} tiket
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: "#94A3B8" }}>Memuat data tiket...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: "#94A3B8" }}>Tidak ada tiket yang cocok dengan filter.</div>
        ) : (
          <>
            {/* Desktop Table (>=768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    {["Invoice", "Customer", "Kategori & Device", "Tipe", "Status", "Garansi", "Biaya Final", "Aksi"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, idx) => {
                    const cfg = STATUS_CFG[order.status];
                    return (
                      <tr
                        key={order.id}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid #F1F5F9", background: idx % 2 === 0 ? "white" : "#FAFAFA" }}
                      >
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs font-semibold" style={{ color: "#0F172A" }}>{order.invoice_code}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium" style={{ color: "#0F172A" }}>{order.customer_name}</div>
                          <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{order.customer_phone}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium" style={{ color: "#0F172A" }}>{order.service_categories?.name ?? "Jasa Umum"}</div>
                          <div className="text-xs mt-0.5 max-w-48 truncate" style={{ color: "#94A3B8" }}>{order.device_info}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full"
                            style={order.service_type === "homeservice"
                              ? { background: "rgba(245,158,11,0.12)", color: "#D97706" }
                              : { background: "#F1F5F9", color: "#475569" }}
                          >
                            {order.service_type === "homeservice" ? "🏠 Homeservice" : "🏬 Toko"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {order.warranty_days && order.warranty_days > 0 ? (
                            <span
                              className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"
                              style={{ background: "rgba(34,197,94,0.10)", color: "#16A34A", border: "1px solid rgba(34,197,94,0.25)" }}
                            >
                              🛡️ {order.warranty_days}h
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "#CBD5E1" }}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold" style={{ color: order.final_price ? "#0F172A" : "#CBD5E1" }}>
                          {order.final_price ? fmtCurrency(order.final_price) : "—"}
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 min-h-[36px] rounded-lg border transition-colors hover:bg-slate-50"
                            style={{ borderColor: "#E2E8F0", color: "#475569" }}
                          >
                            Kelola →
                          </Link>
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
                const cfg = STATUS_CFG[order.status];
                return (
                  <div key={order.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold" style={{ color: "#0F172A" }}>{order.invoice_code}</span>
                      <span
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-semibold" style={{ color: "#0F172A" }}>{order.customer_name} ({order.customer_phone})</div>
                      <div className="text-xs text-slate-500">{order.service_categories?.name ?? "Jasa Umum"} · {order.device_info}</div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div>
                        <span className="text-slate-400">Tipe: </span>
                        <span className="font-medium" style={{ color: "#374151" }}>{order.service_type === "homeservice" ? "🏠 Homeservice" : "🏬 Toko"}</span>
                      </div>
                      <div className="font-semibold text-slate-800">
                        {order.final_price ? fmtCurrency(order.final_price) : "—"}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 min-h-[44px] rounded-xl border transition-colors hover:bg-slate-50 w-full"
                        style={{ borderColor: "#E2E8F0", color: "#475569" }}
                      >
                        Kelola Tiket →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border my-8 shadow-2xl overflow-hidden" style={{ background: "white", borderColor: "#E2E8F0" }}>
            {/* Modal header */}
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <div>
                <h3 className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>Buat Tiket Servis Baru</h3>
                <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Isi data customer dan perangkat yang akan diservis</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors" style={{ color: "#64748B" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Nama Customer *", key: "customer_name", placeholder: "Ahmad Dani", type: "text", required: true },
                  { label: "Nomor WhatsApp (628xxx) *", key: "customer_phone", placeholder: "6285725420666", type: "text", required: true },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>{field.label}</label>
                    <input
                      type={field.type} required={field.required} placeholder={field.placeholder}
                      value={(newOrder as any)[field.key]}
                      onChange={(e) => setNewOrder((p) => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl text-sm"
                      style={{ ...inputStyle }}
                    />
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>Kategori Servis *</label>
                  <select required value={newOrder.category_id} onChange={(e) => setNewOrder((p) => ({ ...p, category_id: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>Tipe Perangkat *</label>
                  <input type="text" required placeholder="Asus ROG G14 Gray" value={newOrder.device_info}
                    onChange={(e) => setNewOrder((p) => ({ ...p, device_info: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ ...inputStyle }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>Keluhan Perangkat *</label>
                <textarea required rows={3} placeholder="Deskripsikan gejala kerusakan..." value={newOrder.complaint}
                  onChange={(e) => setNewOrder((p) => ({ ...p, complaint: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm resize-none" style={{ ...inputStyle }} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>Tipe Layanan</label>
                  <select value={newOrder.service_type} onChange={(e) => setNewOrder((p) => ({ ...p, service_type: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="toko">🏬 Antar ke Toko</option>
                    <option value="homeservice">🏠 Homeservice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>Estimasi Biaya Awal (Rp)</label>
                  <input type="number" placeholder="150000" value={newOrder.base_price_estimate}
                    onChange={(e) => setNewOrder((p) => ({ ...p, base_price_estimate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ ...inputStyle }} />
                </div>
              </div>

              {newOrder.service_type === "homeservice" && (
                <div className="space-y-4 p-4 rounded-xl border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>Alamat Lengkap *</label>
                    <input type="text" required placeholder="Jl. nama jalan, RT/RW, kelurahan..." value={newOrder.address}
                      onChange={(e) => setNewOrder((p) => ({ ...p, address: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ ...inputStyle }} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: "Jarak dari Toko (km)", key: "distance_km", placeholder: "3.5", step: "0.1" },
                      { label: "Biaya Transport (Rp)", key: "transport_fee", placeholder: "10000", step: "1" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>{f.label}</label>
                        <input type="number" step={f.step} placeholder={f.placeholder} value={(newOrder as any)[f.key]}
                          onChange={(e) => setNewOrder((p) => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ ...inputStyle }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: "#E2E8F0" }}>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-slate-50"
                  style={{ borderColor: "#E2E8F0", color: "#475569" }}>
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #14B8A6, #3B82F6)" }}>
                  {submitting ? "Menyimpan..." : "Simpan Tiket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
