import { NextResponse } from "next/server";
import { requireActiveStaff } from "@/lib/auth/requireActiveStaff";

/**
 * GET /api/admin/me
 * Mengambil data profile dari staff yang sedang login.
 * Menggunakan requireActiveStaff yang sudah memastikan user valid dan status akun 'aktif'.
 */
export async function GET() {
  const auth = await requireActiveStaff();

  if (!auth.authorized) {
    return auth.response;
  }

  // auth.profile dijamin ada jika authorized === true
  return NextResponse.json({ profile: auth.profile }, { status: 200 });
}
