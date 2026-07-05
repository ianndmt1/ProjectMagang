import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/orders/track?invoice=SRV-YYYYMMDD-000X[&whatsapp=08xxxxxxxxxx]
 *
 * Mengambil status order berdasarkan nomor invoice.
 * Endpoint publik — tidak perlu autentikasi.
 *
 * Parameter opsional `whatsapp`:
 *   Jika diisi, nomor akan dinormalisasi dan dicocokkan dengan customer_phone
 *   di database. Kalau tidak cocok, return 404 dengan pesan generik supaya
 *   tidak membocorkan bahwa invoice sebenarnya valid.
 *
 * Kolom yang dikembalikan sengaja dibatasi:
 *   - TIDAK mengekspos: admin_notes, final_price, transport_fee, address, customer_phone
 *   - Mengekspos: informasi status dan progres yang relevan bagi customer
 */

/**
 * Normalisasi nomor telepon ke format 62xxxxxxxxxx.
 * Menangani berbagai format: 08xx, +628xx, 628xx, 8xx
 */
function normalizePhone(raw: string): string {
  // Hapus semua karakter non-digit
  let digits = raw.replace(/\D/g, "");

  // Mulai dengan 0 → ganti dengan 62
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  }
  // Mulai dengan 62 → biarkan
  // Mulai dengan 8 (tanpa prefix) → tambah 62
  else if (digits.startsWith("8")) {
    digits = "62" + digits;
  }

  return digits;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoice = searchParams.get("invoice");
    const whatsapp = searchParams.get("whatsapp");

    // Validasi: parameter invoice wajib ada dan tidak kosong
    if (!invoice || invoice.trim() === "") {
      return NextResponse.json(
        { error: "Parameter 'invoice' wajib diisi. Contoh: ?invoice=SRV-20240101-0001" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Sertakan customer_phone hanya jika whatsapp dikirim (untuk verifikasi server-side)
    // customer_phone TIDAK pernah dikembalikan ke client
    const selectFields = `
      invoice_code,
      customer_name,
      customer_phone,
      device_info,
      complaint,
      service_type,
      status,
      base_price_estimate,
      created_at,
      updated_at,
      completed_at,
      service_categories!category_id (
        name
      )
    `;

    const { data, error } = await supabase
      .from("service_orders")
      .select(selectFields)
      .eq("invoice_code", invoice.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      console.error("[/api/orders/track] Supabase error:", error.message);
      return NextResponse.json(
        { error: "Gagal mengambil data order.", detail: error.message },
        { status: 500 }
      );
    }

    // Nomor invoice tidak ditemukan
    if (!data) {
      return NextResponse.json(
        { error: "Data tidak ditemukan atau tidak cocok." },
        { status: 404 }
      );
    }

    // Verifikasi nomor WhatsApp jika disertakan
    if (whatsapp && whatsapp.trim() !== "") {
      const inputNorm = normalizePhone(whatsapp.trim());
      const storedNorm = normalizePhone((data as any).customer_phone ?? "");

      // Pesan generik — jangan bocorkan bahwa invoice valid tapi nomor salah
      if (inputNorm !== storedNorm) {
        return NextResponse.json(
          { error: "Data tidak ditemukan atau tidak cocok." },
          { status: 404 }
        );
      }
    }

    // Mapping status ke label bahasa Indonesia yang ramah untuk customer
    const statusLabel: Record<string, string> = {
      diterima: "Diterima — menunggu pengecekan",
      dicek: "Sedang dicek oleh teknisi",
      menunggu_sparepart: "Menunggu ketersediaan sparepart",
      dikerjakan: "Sedang dikerjakan",
      selesai: "Selesai — siap diambil",
      sudah_diambil: "Sudah diambil",
    };

    // Bangun response — customer_phone TIDAK disertakan
    const response = {
      invoice_code: data.invoice_code,
      customer_name: data.customer_name,
      device_info: data.device_info,
      complaint: data.complaint,
      service_type: data.service_type,
      category: Array.isArray(data.service_categories)
        ? (data.service_categories[0] as any)?.name
        : (data.service_categories as any)?.name ?? null,
      status: data.status,
      status_label: statusLabel[data.status] ?? data.status,
      base_price_estimate: data.base_price_estimate,
      created_at: data.created_at,
      updated_at: data.updated_at,
      completed_at: data.completed_at,
    };

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/orders/track] Unexpected error:", message);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", detail: message },
      { status: 500 }
    );
  }
}
