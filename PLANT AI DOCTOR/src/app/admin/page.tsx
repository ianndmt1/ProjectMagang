import { createAdminClient } from "@/lib/supabase/server";
import { Package, Bug, ScanLine, TrendingUp, Clock } from "lucide-react";

async function getDashboardStats() {
  const supabase = createAdminClient();

  // Total produk aktif
  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Total penyakit terdaftar
  const { count: totalDiseases } = await supabase
    .from("plant_diseases")
    .select("*", { count: "exact", head: true });

  // Scan hari ini
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayScans } = await supabase
    .from("scan_logs")
    .select("*", { count: "exact", head: true })
    .gte("scanned_at", todayStart.toISOString());

  // Scan bulan ini
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count: monthScans } = await supabase
    .from("scan_logs")
    .select("*", { count: "exact", head: true })
    .gte("scanned_at", monthStart.toISOString());

  // 5 scan terbaru
  const { data: recentScans } = await supabase
    .from("scan_logs")
    .select("id, scanned_at, ai_result")
    .order("scanned_at", { ascending: false })
    .limit(5);

  return {
    totalProducts: totalProducts ?? 0,
    totalDiseases: totalDiseases ?? 0,
    todayScans: todayScans ?? 0,
    monthScans: monthScans ?? 0,
    recentScans: recentScans ?? [],
  };
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      label: "Produk Aktif",
      value: stats.totalProducts,
      icon: <Package className="h-6 w-6 text-sage" />,
      bg: "bg-green-50",
    },
    {
      label: "Penyakit Terdaftar",
      value: stats.totalDiseases,
      icon: <Bug className="h-6 w-6 text-amber-500" />,
      bg: "bg-amber-50",
    },
    {
      label: "Scan Hari Ini",
      value: stats.todayScans,
      icon: <ScanLine className="h-6 w-6 text-blue-500" />,
      bg: "bg-blue-50",
    },
    {
      label: "Scan Bulan Ini",
      value: stats.monthScans,
      icon: <TrendingUp className="h-6 w-6 text-purple-500" />,
      bg: "bg-purple-50",
    },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-dark-green">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Selamat datang di panel admin Bakoel Kembang Boyolali</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-cream-soft bg-white p-6 shadow-sm"
          >
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-dark-green">{card.value}</p>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabel Scan Terbaru */}
      <div className="rounded-2xl border border-cream-soft bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-cream-soft">
          <Clock className="h-5 w-5 text-sage" />
          <h2 className="font-bold text-dark-green">5 Scan Tanaman Terbaru</h2>
        </div>

        {stats.recentScans.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            Belum ada data scan yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-soft bg-cream-soft/30 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Waktu</th>
                  <th className="px-6 py-3">Penyakit Terdeteksi</th>
                  <th className="px-6 py-3">Confidence</th>
                  <th className="px-6 py-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-soft">
                {stats.recentScans.map((scan: any) => {
                  const ai = scan.ai_result;
                  const severityColors: Record<string, string> = {
                    ringan: "bg-green-100 text-green-700",
                    sedang: "bg-yellow-100 text-yellow-700",
                    parah: "bg-red-100 text-red-700",
                    sehat: "bg-blue-100 text-blue-700",
                  };
                  const severity = (ai?.severity || "sehat").toLowerCase();
                  const colorClass = severityColors[severity] || "bg-gray-100 text-gray-600";

                  return (
                    <tr key={scan.id} className="hover:bg-cream-soft/20 transition-colors">
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {formatDate(scan.scanned_at)}
                      </td>
                      <td className="px-6 py-4 font-medium text-dark-green">
                        {ai?.disease_name || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {ai?.confidence ? `${ai.confidence}%` : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${colorClass}`}>
                          {severity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
