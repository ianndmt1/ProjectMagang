import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/categories
 * Mengembalikan semua kategori servis yang aktif (is_active = true).
 * Endpoint publik — tidak perlu autentikasi.
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("service_categories")
      .select("id, name, description, base_price_estimate, is_active, created_at")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("[/api/categories] Supabase error:", error.message);
      return NextResponse.json(
        { error: "Gagal mengambil data kategori.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/categories] Unexpected error:", message);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", detail: message },
      { status: 500 }
    );
  }
}
