export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PATCH — update produk berdasarkan id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error(`Error saat mengupdate produk ${id}:`, error);
      return NextResponse.json(
        { success: false, error: "Gagal mengupdate produk" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Kesalahan server internal saat mengupdate produk:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate produk" },
      { status: 500 }
    );
  }
}

// DELETE — hapus produk berdasarkan id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createAdminClient();
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error(`Error saat menghapus produk ${id}:`, error);
      return NextResponse.json(
        { success: false, error: "Gagal menghapus produk" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("Kesalahan server internal saat menghapus produk:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus produk" },
      { status: 500 }
    );
  }
}
