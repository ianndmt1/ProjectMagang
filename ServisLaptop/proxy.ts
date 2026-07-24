import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProfile } from "@/lib/auth/getProfile";

/**
 * Middleware proteksi route /admin/*.
 * Semua path di bawah /admin (kecuali /admin/login) wajib punya session aktif dan akun aktif.
 * Kalau belum login → redirect ke /admin/login.
 * Kalau akun dinonaktifkan → redirect ke /admin/login?error=inactive.
 * Kalau sudah login aktif dan akses /admin/login → redirect ke /admin.
 */
export async function proxy(request: NextRequest) {
  // supabaseResponse harus selalu dikembalikan agar cookie refresh session berjalan
  let supabaseResponse = NextResponse.next({ request });

  function withNoCache(response: NextResponse) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookie di request (untuk server) dan response (untuk browser)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // PENTING: getUser() memvalidasi token ke server Supabase, bukan hanya baca cookie lokal
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";

  // Belum login, akses halaman admin → redirect ke login
  if (!user && !isLoginPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    return withNoCache(NextResponse.redirect(redirectUrl));
  }

  // Sudah login, periksa profil
  if (user) {
    const profile = await getProfile(user);

    if (!profile || profile.status === "nonaktif") {
      // Jika tidak aktif, dan bukan di halaman login, redirect ke login dengan error
      if (!isLoginPage) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/admin/login";
        redirectUrl.searchParams.set("error", "inactive");
        return withNoCache(NextResponse.redirect(redirectUrl));
      }
    }
  }

  return withNoCache(supabaseResponse);
}

export const config = {
  // Hanya jalankan middleware untuk route /admin dan /admin/*
  matcher: ["/admin", "/admin/:path*"],
};
