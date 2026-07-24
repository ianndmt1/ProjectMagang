import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireActiveStaff } from "@/lib/auth/requireActiveStaff";
import { getAppSettings } from "@/lib/settings";

/**
 * GET /api/admin/orders/[id]/wa-link
 * Generate link wa.me siap kirim untuk memberitahu customer bahwa servis selesai.
 * WAJIB terautentikasi — return 401 kalau session tidak valid.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── 1. Validasi session & status ──────────────────────────────────────────
  const auth = await requireActiveStaff();
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const supabase = createServerSupabaseClient();
    const settings = await getAppSettings();

    const { data, error } = await supabase
      .from("service_orders")
      .select("invoice_code, customer_name, customer_phone, device_info, final_price")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[/api/admin/orders/[id]/wa-link] Supabase error:", error.message);
      return NextResponse.json(
        { error: "Gagal mengambil data order.", detail: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Order tidak ditemukan." },
        { status: 404 }
      );
    }

    // Format harga/biaya
    const priceFormatted = data.final_price !== null && data.final_price !== undefined
      ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(data.final_price))
      : "Estimasi awal (hubungi toko)";

    // Format pesan pre-filled WhatsApp
    const message = `Halo Kak ${data.customer_name},

Kami dari ${settings.shop_name} ingin menginfokan bahwa perbaikan perangkat *${data.device_info}* dengan nomor invoice *${data.invoice_code}* telah *SELESAI* dikerjakan dan siap diambil.

Total biaya: *${priceFormatted}*.

Jam Operasional: ${settings.operational_hours}.

Silakan datang ke toko untuk pengambilan unit. Terima kasih banyak!`;

    // Normalisasi format nomor telepon ke 62xxxxxxxxx
    let phoneCleaned = data.customer_phone.replace(/\D/g, "");
    if (phoneCleaned.startsWith("0")) {
      phoneCleaned = "62" + phoneCleaned.slice(1);
    }

    const waLink = `https://wa.me/${phoneCleaned}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({ wa_link: waLink }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/admin/orders/[id]/wa-link] Unexpected error:", message);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", detail: message },
      { status: 500 }
    );
  }
}
