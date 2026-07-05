"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderDetail {
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
  warranty_days: number | null;
  payment_status: "belum_bayar" | "dp" | "lunas" | null;
  created_at: string;
  updated_at: string;
  service_categories?: { name: string };
}

const STATUS_OPTIONS = [
  { value: "diterima",           label: "Diterima",           color: "#14B8A6" },
  { value: "dicek",              label: "Dicek",              color: "#3B82F6" },
  { value: "menunggu_sparepart", label: "Menunggu Sparepart", color: "#F59E0B" },
  { value: "dikerjakan",         label: "Dikerjakan",         color: "#EF4444" },
  { value: "selesai",            label: "Selesai",            color: "#22C55E" },
  { value: "sudah_diambil",      label: "Sudah Diambil",      color: "#A855F7" },
];

const PAYMENT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  belum_bayar: { label: "Belum Bayar", color: "#EF4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)" },
  dp:          { label: "DP / Cicilan", color: "#F59E0B", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)" },
  lunas:       { label: "Lunas",        color: "#22C55E", bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.25)" },
};

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

const inputClass = "w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all";
const inputStyle: React.CSSProperties = { background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#0F172A" };

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [status, setStatus] = useState<OrderDetail["status"]>("diterima");
  const [finalPrice, setFinalPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [warrantyDays, setWarrantyDays] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"belum_bayar" | "dp" | "lunas">("belum_bayar");

  const MOCK: OrderDetail = {
    id, invoice_code: "SRV-20260701-0001", customer_name: "Ahmad Dani", customer_phone: "6285123456789",
    device_info: "Asus ZenBook UX430UA (Blue)", complaint: "Layar LCD bergaris dan engsel kiri patah",
    service_type: "toko", address: null, distance_km: null, transport_fee: null,
    status: "dikerjakan", base_price_estimate: 250000, final_price: null,
    admin_notes: "LCD dipesan, estimasi sampai besok. Perlu pengecekan engsel.",
    warranty_days: 30, payment_status: "belum_bayar",
    created_at: "2026-07-01T09:00:00Z", updated_at: "2026-07-01T11:30:00Z",
    service_categories: { name: "Servis Laptop" },
  };

  function hydrate(o: OrderDetail) {
    setOrder(o);
    setStatus(o.status);
    setFinalPrice(o.final_price?.toString() ?? "");
    setAdminNotes(o.admin_notes ?? "");
    setWarrantyDays(o.warranty_days?.toString() ?? "");
    setPaymentStatus(o.payment_status ?? "belum_bayar");
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/orders");
        const result = await res.json();
        if (res.ok && result.data) {
          const found = result.data.find((o: OrderDetail) => o.id === id);
          found ? hydrate(found) : hydrate(MOCK);
        } else { hydrate(MOCK); }
      } catch { hydrate(MOCK); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: Record<string, unknown> = {
        status,
        final_price: finalPrice ? parseFloat(finalPrice) : null,
        admin_notes: adminNotes || null,
        warranty_days: warrantyDays !== "" ? parseInt(warrantyDays) : null,
        payment_status: paymentStatus,
      };

      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Gagal memperbarui order.");
      }
    } catch { setError("Kesalahan koneksi ke server."); }
    finally { setSaving(false); }
  };

  const handleSendWa = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/wa-link`);
      const result = await res.json();
      if (res.ok && result.wa_link) {
        window.open(result.wa_link, "_blank");
      } else {
        alert("Gagal membuat link WhatsApp.");
      }
    } catch { alert("Kesalahan koneksi."); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm" style={{ color: "#94A3B8" }}>Memuat detail order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm" style={{ color: "#EF4444" }}>Order tidak ditemukan.</div>
      </div>
    );
  }

  const currentStatusCfg = STATUS_OPTIONS.find((s) => s.value === status);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm" style={{ color: "#94A3B8" }}>
          <Link href="/admin/tiket" className="hover:underline" style={{ color: "#14B8A6" }}>Tiket Service</Link>
          <span>/</span>
          <span className="font-mono font-medium" style={{ color: "#0F172A" }}>{order.invoice_code}</span>
        </div>

        {(status === "selesai" || status === "sudah_diambil") && (
          <button
            onClick={handleSendWa}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Kirim Notifikasi WhatsApp
          </button>
        )}
      </div>

      {/* Grid: left info + right form */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: Info ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Customer card */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ background: "white", borderColor: "#E2E8F0" }}>
            <h3 className="text-sm font-semibold border-b pb-3" style={{ fontFamily: "var(--font-display)", color: "#0F172A", borderColor: "#F1F5F9" }}>
              Informasi Pelanggan
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Nama Customer", value: order.customer_name },
                { label: "WhatsApp", value: order.customer_phone },
              ].map((row) => (
                <div key={row.label}>
                  <div className="text-xs mb-0.5" style={{ color: "#94A3B8" }}>{row.label}</div>
                  <div className="text-sm font-medium" style={{ color: "#0F172A" }}>{row.value}</div>
                </div>
              ))}
            </div>
            {order.service_type === "homeservice" && order.address && (
              <div className="pt-3 border-t" style={{ borderColor: "#F1F5F9" }}>
                <div className="text-xs mb-1" style={{ color: "#94A3B8" }}>Alamat Homeservice</div>
                <div className="text-sm" style={{ color: "#0F172A" }}>{order.address}</div>
                <div className="flex gap-4 mt-1 text-xs" style={{ color: "#94A3B8" }}>
                  <span>Jarak: {order.distance_km} km</span>
                  <span>Transport: Rp {order.transport_fee?.toLocaleString("id-ID") ?? 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* Device & complaint card */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ background: "white", borderColor: "#E2E8F0" }}>
            <h3 className="text-sm font-semibold border-b pb-3" style={{ fontFamily: "var(--font-display)", color: "#0F172A", borderColor: "#F1F5F9" }}>
              Detail Perangkat &amp; Keluhan
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Invoice", value: order.invoice_code },
                { label: "Kategori", value: order.service_categories?.name ?? "Jasa Umum" },
                { label: "Perangkat", value: order.device_info },
                { label: "Tipe Layanan", value: order.service_type === "homeservice" ? "🏠 Homeservice" : "🏬 Toko / Workshop" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="text-xs mb-0.5" style={{ color: "#94A3B8" }}>{row.label}</div>
                  <div className="text-sm font-medium" style={{ color: "#0F172A" }}>{row.value}</div>
                </div>
              ))}
            </div>

            {/* Complaint — menonjol */}
            <div className="pt-2">
              <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#374151" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Keluhan Customer
              </div>
              <div
                className="text-sm leading-relaxed p-4 rounded-xl whitespace-pre-wrap"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#374151" }}
              >
                {order.complaint}
              </div>
            </div>

            {/* Admin notes — menonjol */}
            {order.admin_notes && (
              <div>
                <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#374151" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Catatan Teknisi
                </div>
                <div
                  className="text-sm leading-relaxed p-4 rounded-xl whitespace-pre-wrap"
                  style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#374151" }}
                >
                  {order.admin_notes}
                </div>
              </div>
            )}

            {/* Warranty badge */}
            {order.warranty_days && order.warranty_days > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl"
                  style={{ background: "rgba(34,197,94,0.10)", color: "#16A34A", border: "1px solid rgba(34,197,94,0.25)" }}
                >
                  🛡️ Garansi Servis: <strong>{order.warranty_days} hari</strong>
                </span>
              </div>
            )}

            {/* Dates */}
            <div className="flex gap-6 pt-2 text-xs" style={{ color: "#94A3B8", borderTop: "1px solid #F1F5F9" }}>
              <div>
                <span className="block">Tanggal Masuk</span>
                <span className="font-semibold" style={{ color: "#475569" }}>
                  {new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div>
                <span className="block">Update Terakhir</span>
                <span className="font-semibold" style={{ color: "#475569" }}>
                  {new Date(order.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Update form ── */}
        <div className="rounded-2xl border p-5 h-fit" style={{ background: "white", borderColor: "#E2E8F0" }}>
          <h3 className="text-sm font-semibold border-b pb-3 mb-5" style={{ fontFamily: "var(--font-display)", color: "#0F172A", borderColor: "#F1F5F9" }}>
            Update Progress
          </h3>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(34,197,94,0.10)", color: "#16A34A", border: "1px solid rgba(34,197,94,0.25)" }}>
              ✅ Order berhasil diperbarui!
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-5">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>Status Servis</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderDetail["status"])}
                className={inputClass}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {currentStatusCfg && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: currentStatusCfg.color }} />
                  <span className="text-xs font-medium" style={{ color: currentStatusCfg.color }}>{currentStatusCfg.label}</span>
                </div>
              )}
            </div>

            {/* Estimasi awal (read-only info) */}
            <div>
              <div className="text-xs mb-1" style={{ color: "#94A3B8" }}>Estimasi Biaya Awal</div>
              <div className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                {order.base_price_estimate ? fmtCurrency(order.base_price_estimate) : "Belum ditentukan"}
              </div>
            </div>

            {/* Final price */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>Biaya Final (Rp)</label>
              <input
                type="number"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                placeholder="350000"
                className={inputClass}
                style={{ ...inputStyle }}
              />
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Total biaya jasa + sparepart pengganti</p>
            </div>

            {/* Warranty days */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>
                Garansi Servis (hari)
                {warrantyDays && parseInt(warrantyDays) > 0 && (
                  <span
                    className="ml-2 font-semibold px-2 py-0.5 rounded-full text-[10px]"
                    style={{ background: "rgba(34,197,94,0.10)", color: "#16A34A" }}
                  >
                    🛡️ {warrantyDays} hari
                  </span>
                )}
              </label>
              <input
                type="number"
                min="0"
                value={warrantyDays}
                onChange={(e) => setWarrantyDays(e.target.value)}
                placeholder="Contoh: 30"
                className={inputClass}
                style={{ ...inputStyle }}
              />
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Isi 0 jika tidak ada garansi</p>
            </div>

            {/* Payment status */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>Status Pembayaran</label>
              <div className="flex gap-2">
                {(["belum_bayar", "dp", "lunas"] as const).map((ps) => {
                  const cfg = PAYMENT_CFG[ps];
                  return (
                    <button
                      key={ps}
                      type="button"
                      onClick={() => setPaymentStatus(ps)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                      style={{
                        borderColor: paymentStatus === ps ? cfg.color : "#E2E8F0",
                        background: paymentStatus === ps ? cfg.bg : "white",
                        color: paymentStatus === ps ? cfg.color : "#94A3B8",
                      }}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Admin notes */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>Catatan Teknisi</label>
              <textarea
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Tindakan yang dilakukan, sparepart diganti, kendala..."
                className={`${inputClass} resize-none`}
                style={{ ...inputStyle }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #14B8A6, #3B82F6)", boxShadow: "0 4px 16px rgba(20,184,166,0.3)" }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  Menyimpan...
                </span>
              ) : "Simpan Perubahan"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
