export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // 1. Ambil semua penyakit dari tabel plant_diseases
    const { data: diseasesData, error: diseasesError } = await supabase
      .from("plant_diseases")
      .select("*");

    if (diseasesError) {
      console.error("Error saat mengambil data penyakit:", diseasesError);
      return NextResponse.json(
        { success: false, error: "Gagal mengambil data penyakit" },
        { status: 500 }
      );
    }

    // 2. Ambil produk rekomendasi untuk setiap penyakit
    const diseases = await Promise.all(
      (diseasesData || []).map(async (disease) => {
        const { data: productsData, error: productsError } = await supabase
          .from("disease_products")
          .select(`
            priority,
            note,
            products!inner (
              id,
              name,
              description,
              price,
              category,
              image_url,
              wa_message,
              is_active,
              created_at,
              updated_at
            )
          `)
          .eq("disease_id", disease.id)
          .eq("products.is_active", true)
          .order("priority", { ascending: true });

        if (productsError) {
          console.error(
            `Error saat mengambil produk rekomendasi untuk penyakit ${disease.id}:`,
            productsError
          );
          return {
            ...disease,
            recommended_products: [],
          };
        }

        const recommendedProducts = (productsData || []).map((dp: any) => ({
          priority: dp.priority,
          note: dp.note,
          product: dp.products,
        }));

        return {
          id: disease.id,
          name: disease.name,
          keywords: disease.keywords,
          description: disease.description,
          severity: disease.severity,
          treatment: disease.treatment,
          recommended_products: recommendedProducts,
        };
      })
    );

    return NextResponse.json({ success: true, data: diseases });
  } catch (error) {
    console.error("Kesalahan server internal di API diseases:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data penyakit" },
      { status: 500 }
    );
  }
}

// POST — tambah penyakit baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, severity, treatment, keywords } = body;

    if (!name || !severity) {
      return NextResponse.json(
        { success: false, error: "Field name dan severity wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("plant_diseases")
      .insert({ name, description, severity, treatment, keywords: keywords ?? [] })
      .select("*")
      .single();

    if (error) {
      console.error("Error saat menambah penyakit:", error);
      return NextResponse.json(
        { success: false, error: "Gagal menambah penyakit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Kesalahan server internal saat menambah penyakit:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambah penyakit" },
      { status: 500 }
    );
  }
}
