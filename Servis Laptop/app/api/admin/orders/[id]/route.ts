import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireActiveStaff } from "@/lib/auth/requireActiveStaff";

const VALID_STATUSES = [
  "diterima",
  "dicek",
  "menunggu_sparepart",
  "dikerjakan",
  "selesai",
  "sudah_diambil",
];

const VALID_PAYMENT_STATUSES = ["belum_bayar", "dp", "lunas"];

/**
 * PATCH /api/admin/orders/[id]
 * Update status, final_price, admin_notes, warranty_days, atau payment_status.
 * WAJIB terautentikasi — return 401 kalau session tidak valid.
 */
export async function PATCH(
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
    const body = await request.json();
    const { status, final_price, admin_notes, warranty_days, payment_status } = body;

    // ── 2. Validasi field ────────────────────────────────────────────────────
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Status tidak valid. Harus salah satu dari: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    if (payment_status !== undefined && !VALID_PAYMENT_STATUSES.includes(payment_status)) {
      return NextResponse.json(
        { error: `payment_status tidak valid. Harus salah satu dari: ${VALID_PAYMENT_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    if (
      warranty_days !== undefined &&
      warranty_days !== null &&
      (typeof warranty_days !== "number" || !Number.isInteger(warranty_days) || warranty_days < 0)
    ) {
      return NextResponse.json(
        { error: "warranty_days harus berupa angka bulat ≥ 0 atau null." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // ── 3. Siapkan data update ───────────────────────────────────────────────
    const updateData: Record<string, unknown> = {};

    if (status !== undefined) updateData.status = status;
    if (final_price !== undefined) updateData.final_price = final_price;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (warranty_days !== undefined) updateData.warranty_days = warranty_days;
    if (payment_status !== undefined) updateData.payment_status = payment_status;

    // Set completed_at jika status selesai/sudah_diambil
    if (status === "selesai" || status === "sudah_diambil") {
      updateData.completed_at = new Date().toISOString();
    } else if (status !== undefined) {
      updateData.completed_at = null;
    }

    updateData.updated_at = new Date().toISOString();

    // ── 4. Jalankan update ───────────────────────────────────────────────────
    const { data, error } = await supabase
      .from("service_orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[PATCH /api/admin/orders/[id]] Supabase error:", error.message);
      return NextResponse.json(
        { error: "Gagal memperbarui order.", detail: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Order tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[PATCH /api/admin/orders/[id]] Unexpected error:", message);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", detail: message },
      { status: 500 }
    );
  }
}
