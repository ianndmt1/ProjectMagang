import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase browser/client-side client — menggunakan ANON_KEY.
 * Hanya untuk keperluan autentikasi admin (Supabase Auth) di sisi client.
 * JANGAN gunakan untuk query data — semua query data wajib lewat API routes.
 *
 * Menggunakan createBrowserClient dari @supabase/ssr agar session disimpan
 * di cookie (bukan localStorage), supaya middleware bisa membaca session
 * dengan benar tanpa mismatch storage.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

