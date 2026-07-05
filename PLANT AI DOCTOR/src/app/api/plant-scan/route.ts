export const dynamic = "force-dynamic";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Ambil file dari FormData
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    // Validasi keberadaan file
    if (!file) {
      return NextResponse.json(
        { success: false, error: "Tidak ada file yang diupload" },
        { status: 400 }
      );
    }

    // Validasi tipe file (hanya image/jpeg, image/png, image/webp)
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format file tidak didukung. Gunakan JPG, PNG, atau WebP",
        },
        { status: 400 }
      );
    }

    // Validasi ukuran file (maksimal 5MB)
    const maxFileSize = 5 * 1024 * 1024; // 5MB dalam bytes
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { success: false, error: "Ukuran file maksimal 5MB" },
        { status: 400 }
      );
    }

    // 2. Convert file ke base64 string
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // 3. Kirim ke Gemini Vision model
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY belum dikonfigurasi di environment");
      return NextResponse.json(
        { success: false, error: "Terjadi kesalahan server" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Kamu adalah dokter tanaman ahli. Analisis foto tanaman ini dan kembalikan HANYA JSON valid tanpa markdown, tanpa penjelasan tambahan.

Format JSON yang harus dikembalikan:
{
  "disease_name": "nama penyakit atau kondisi (string, dalam Bahasa Indonesia)",
  "confidence": 85,
  "severity": "ringan | sedang | parah | sehat",
  "is_healthy": false,
  "description": "deskripsi kondisi tanaman (string)",
  "symptoms": ["gejala 1", "gejala 2"],
  "treatment_tips": ["tips perawatan 1", "tips perawatan 2"],
  "matched_keywords": ["keyword1", "keyword2"]
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type,
        },
      },
    ]);

    const responseText = result.response.text();

    // 4. Parse JSON response dari Gemini (strip markdown code block jika ada)
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.substring(7);
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith("```")) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    let aiResult;
    try {
      aiResult = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Gagal parse JSON dari Gemini. Response mentah:", responseText, parseError);
      return NextResponse.json(
        { success: false, error: "Gagal menganalisis gambar. Coba lagi." },
        { status: 500 }
      );
    }

    // 5. Cari matching disease di tabel plant_diseases
    const supabase = createAdminClient();
    let matchedDisease = null;
    let recommendedProducts: any[] = [];

    if (
      aiResult.matched_keywords &&
      Array.isArray(aiResult.matched_keywords) &&
      aiResult.matched_keywords.length > 0
    ) {
      const { data: diseaseData, error: diseaseError } = await supabase
        .from("plant_diseases")
        .select("*")
        .overlaps("keywords", aiResult.matched_keywords)
        .limit(1)
        .maybeSingle();

      if (diseaseError) {
        console.error("Error saat mencari penyakit di database:", diseaseError);
      } else if (diseaseData) {
        matchedDisease = diseaseData;

        // 6. Jika disease ditemukan, ambil produk rekomendasi via join
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
          .eq("disease_id", matchedDisease.id)
          .eq("products.is_active", true)
          .order("priority", { ascending: true });

        if (productsError) {
          console.error("Error saat mengambil produk rekomendasi:", productsError);
        } else if (productsData) {
          recommendedProducts = (productsData as any[]).map((dp) => ({
            ...dp.products,
            priority: dp.priority,
            note: dp.note,
          }));
        }
      }
    }

    // 7. Simpan record ke tabel scan_logs
    const { data: scanLog, error: logError } = await supabase
      .from("scan_logs")
      .insert({
        image_url: "uploaded",
        ai_result: aiResult,
        disease_id: matchedDisease ? matchedDisease.id : null,
      })
      .select("id")
      .single();

    if (logError) {
      console.error("Error saat menyimpan log pemindaian:", logError);
    }

    const scanLogId = scanLog ? scanLog.id : null;

    // 8. Return JSON response sukses
    return NextResponse.json({
      success: true,
      ai_result: aiResult,
      matched_disease: matchedDisease,
      recommended_products: recommendedProducts,
      scan_log_id: scanLogId,
    });
  } catch (error) {
    console.error("Kesalahan server internal di API plant-scan:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
