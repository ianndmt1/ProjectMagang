import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/sparepart
 * Mengembalikan semua sparepart yang tersedia (is_available = true).
 * Endpoint publik — tidak perlu autentikasi.
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("sparepart_catalog")
      .select("id, name, category, price_note, image_url, is_available, created_at")
      .eq("is_available", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("[/api/sparepart] Supabase error:", error.message);
      return NextResponse.json(
        { error: "Gagal mengambil data sparepart.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/sparepart] Unexpected error:", message);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", detail: message },
      { status: 500 }
    );
  }
}
