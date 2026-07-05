"use client";

import { useState, useEffect } from "react";

interface MonthlyReport {
  bulan: string; // Format: YYYY-MM
  total_order: number;
  total_selesai: number;
  total_pendapatan: number;
  total_homeservice: number;
}

const MOCK_REPORTS: MonthlyReport[] = [
  {
    bulan: "2026-07",
    total_order: 12,
    total_selesai: 5,
    total_pendapatan: 2450000,
    total_homeservice: 4
  },
  {
    bulan: "2026-06",
    total_order: 45,
    total_selesai: 41,
    total_pendapatan: 14800000,
    total_homeservice: 15
  },
  {
    bulan: "2026-05",
    total_order: 38,
    total_selesai: 35,
    total_pendapatan: 11200000,
    total_homeservice: 8
  }
];

export default function ReportsPage() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/reports");
        const result = await res.json();
        if (res.ok && result.data && result.data.length > 0) {
          setReports(result.data);
        } else {
          setReports(MOCK_REPORTS);
        }
      } catch (err) {
        setReports(MOCK_REPORTS);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const formatMonth = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    } catch (e) {
      return monthStr;
    }
  };

  const totalRevenueAllTime = reports.reduce((acc, curr) => acc + (curr.total_pendapatan || 0), 0);
  const totalOrdersAllTime = reports.reduce((acc, curr) => acc + (curr.total_order || 0), 0);
  const totalCompletedAllTime = reports.reduce((acc, curr) => acc + (curr.total_selesai || 0), 0);
  const totalHomeserviceAllTime = reports.reduce((acc, curr) => acc + (curr.total_homeservice || 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>
          Laporan Customer
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
          Rekapitulasi performa dan jumlah servis bulanan
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Akumulasi Omset", value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalRevenueAllTime), color: "#22C55E", icon: "💰" },
          { label: "Total Servis Masuk", value: `${totalOrdersAllTime} unit`, color: "#0F172A", icon: "📥" },
          { label: "Servis Selesai", value: `${totalCompletedAllTime} unit`, color: "#14B8A6", icon: "✅" },
          { label: "Rasio Selesai", value: `${totalOrdersAllTime > 0 ? Math.round((totalCompletedAllTime / totalOrdersAllTime) * 100) : 0}%`, color: "#3B82F6", icon: "📈" },
        ].map((card, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl border bg-white"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div className="text-xl mb-2">{card.icon}</div>
            <div className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: card.color }}>
              {loading ? "—" : card.value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Report Table */}
      <div className="rounded-2xl border overflow-hidden bg-white" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-5 py-4 border-b bg-slate-50" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>
            Rekapitulasi Bulanan
          </h2>
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: "#94A3B8" }}>Memuat laporan...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: "#94A3B8" }}>Tidak ada data laporan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Bulan</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Total Servis</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Servis Selesai</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Homeservice</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Pendapatan Bersih</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((rep, idx) => (
                  <tr
                    key={idx}
                    className="border-b transition-colors hover:bg-slate-50"
                    style={{ borderColor: "#F1F5F9" }}
                  >
                    <td className="px-5 py-4 font-bold" style={{ color: "#0F172A" }}>{formatMonth(rep.bulan)}</td>
                    <td className="px-5 py-4" style={{ color: "#475569" }}>{rep.total_order} Order</td>
                    <td className="px-5 py-4" style={{ color: "#475569" }}>{rep.total_selesai} Unit</td>
                    <td className="px-5 py-4" style={{ color: "#475569" }}>{rep.total_homeservice} Panggilan</td>
                    <td className="px-5 py-4 font-semibold" style={{ color: "#16A34A" }}>
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(rep.total_pendapatan)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
