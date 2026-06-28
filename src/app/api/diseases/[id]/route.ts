export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PATCH — update penyakit berdasarkan id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("plant_diseases")
      .update(body)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error(`Error saat mengupdate penyakit ${id}:`, error);
      return NextResponse.json(
        { success: false, error: "Gagal mengupdate penyakit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Kesalahan server internal saat mengupdate penyakit:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate penyakit" },
      { status: 500 }
    );
  }
}

// DELETE — hapus penyakit berdasarkan id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createAdminClient();
    const { error } = await supabase.from("plant_diseases").delete().eq("id", id);

    if (error) {
      console.error(`Error saat menghapus penyakit ${id}:`, error);
      return NextResponse.json(
        { success: false, error: "Gagal menghapus penyakit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Penyakit berhasil dihapus" });
  } catch (error) {
    console.error("Kesalahan server internal saat menghapus penyakit:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus penyakit" },
      { status: 500 }
    );
  }
}
