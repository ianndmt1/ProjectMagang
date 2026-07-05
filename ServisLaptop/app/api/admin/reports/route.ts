import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireActiveStaff } from "@/lib/auth/requireActiveStaff";

/**
 * GET /api/admin/reports
 * Mengambil rekap bulanan laporan pendapatan dan order dari view `report_monthly`.
 * WAJIB terautentikasi — return 401 kalau session tidak valid.
 */
export async function GET() {
  // ── 1. Validasi session & status ──────────────────────────────────────────
  const auth = await requireActiveStaff();
  if (!auth.authorized) {
    return auth.response;
  }

  // ── 2. Query data menggunakan service role ─────────────────────────────────
  try {
    const supabase = createServerSupabaseClient();

    // Query ke view report_monthly
    const { data, error } = await supabase
      .from("report_monthly")
      .select("*")
      .order("bulan", { ascending: false });

    if (error) {
      console.error("[/api/admin/reports] Supabase error:", error.message);
      return NextResponse.json(
        { error: "Gagal mengambil data laporan.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/admin/reports] Unexpected error:", message);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", detail: message },
      { status: 500 }
    );
  }
}
