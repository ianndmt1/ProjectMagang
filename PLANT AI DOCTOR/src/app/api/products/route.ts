export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const supabase = createAdminClient();
    let query = supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    if (category) {
      query = query.eq("category", category);
    }

    const { data: products, error } = await query.order("created_at", {
      ascending: true,
    });

    if (error) {
      console.error("Error saat mengambil data produk dari database:", error);
      return NextResponse.json(
        { success: false, error: "Gagal mengambil data produk" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("Kesalahan server internal di API products:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data produk" },
      { status: 500 }
    );
  }
}

// POST — tambah produk baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, price, category, image_url, wa_message, is_active } = body;

    if (!name || !price || !category) {
      return NextResponse.json(
        { success: false, error: "Field name, price, dan category wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .insert({ name, description, price, category, image_url, wa_message, is_active: is_active ?? true })
      .select("*")
      .single();

    if (error) {
      console.error("Error saat menambah produk:", error);
      return NextResponse.json(
        { success: false, error: "Gagal menambah produk" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Kesalahan server internal saat menambah produk:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambah produk" },
      { status: 500 }
    );
  }
}
