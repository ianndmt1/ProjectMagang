import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireActiveStaff } from "@/lib/auth/requireActiveStaff";

/**
 * GET /api/admin/orders
 * Mengambil semua order dengan data lengkap (termasuk admin_notes, final_price, dll).
 * WAJIB terautentikasi — return 401 kalau session tidak valid.
 */
export async function GET() {
  // ── 1. Validasi session & status ──────────────────────────────────────────
  const auth = await requireActiveStaff();
  if (!auth.authorized) {
    return auth.response;
  }

  // ── 2. Query data menggunakan service role (bypass RLS) ────────────────────
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("service_orders")
      .select(
        `
        id,
        invoice_code,
        customer_name,
        customer_phone,
        device_info,
        complaint,
        service_type,
        address,
        distance_km,
        transport_fee,
        status,
        base_price_estimate,
        final_price,
        admin_notes,
        created_at,
        updated_at,
        completed_at,
        service_categories!category_id (
          id,
          name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[/api/admin/orders] Supabase error:", error.message);
      return NextResponse.json(
        { error: "Gagal mengambil data order.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/admin/orders] Unexpected error:", message);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/orders
 * Membuat order servis baru.
 * WAJIB terautentikasi — return 401 kalau session tidak valid.
 */
export async function POST(request: Request) {
  // ── 1. Validasi session & status ──────────────────────────────────────────
  const auth = await requireActiveStaff();
  if (!auth.authorized) {
    return auth.response;
  }

  // ── 2. Parsing dan validasi data ───────────────────────────────────────────
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      category_id,
      device_info,
      complaint,
      service_type,
      address,
      distance_km,
      transport_fee,
      base_price_estimate,
    } = body;

    if (!customer_name || !customer_phone || !category_id || !device_info || !complaint || !service_type) {
      return NextResponse.json(
        { error: "Field customer_name, customer_phone, category_id, device_info, complaint, dan service_type wajib diisi." },
        { status: 400 }
      );
    }

    if (service_type !== "toko" && service_type !== "homeservice") {
      return NextResponse.json(
        { error: "service_type harus 'toko' atau 'homeservice'." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // ── 3. Generate invoice_code otomatis ─────────────────────────────────────
    // Format: SRV-YYYYMMDD-000X (nomor urut per hari)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    const prefix = `SRV-${dateStr}-`;

    const { data: existingOrders, error: fetchError } = await supabase
      .from("service_orders")
      .select("invoice_code")
      .like("invoice_code", `${prefix}%`);

    if (fetchError) {
      console.error("Error fetching today's orders count:", fetchError.message);
      return NextResponse.json(
        { error: "Gagal membuat nomor invoice.", detail: fetchError.message },
        { status: 500 }
      );
    }

    const nextNum = (existingOrders?.length ?? 0) + 1;
    // Format 4 digit agar muat banyak order per hari
    const invoiceCode = `${prefix}${String(nextNum).padStart(4, "0")}`;

    // ── 4. Insert data menggunakan service role ────────────────────────────────
    const { data, error } = await supabase
      .from("service_orders")
      .insert({
        invoice_code: invoiceCode,
        customer_name,
        customer_phone,
        category_id,
        device_info,
        complaint,
        service_type,
        address: address || null,
        distance_km: distance_km !== undefined ? distance_km : null,
        transport_fee: transport_fee !== undefined ? transport_fee : null,
        base_price_estimate: base_price_estimate !== undefined ? base_price_estimate : null,
        status: "diterima",
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/admin/orders] Supabase insert error:", error.message);
      return NextResponse.json(
        { error: "Gagal membuat order baru.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/admin/orders] Unexpected error:", message);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", detail: message },
      { status: 500 }
    );
  }
}

