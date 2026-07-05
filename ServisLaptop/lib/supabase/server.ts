import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase server client — menggunakan SERVICE_ROLE_KEY.
 * HANYA boleh dipakai di server/API routes (Next.js Route Handlers, Server Actions, Server Components).
 * JANGAN pernah diimport dari Client Component atau expose ke browser.
 *
 * Key ini bypass RLS — gunakan dengan hati-hati, validasi akses di setiap endpoint.
 */
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!supabaseServiceRoleKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // Service role tidak perlu session/cookie
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Mengambil user yang sedang login berdasarkan session cookie.
 * Pakai anon key + @supabase/ssr agar cookie bisa dibaca di server.
 * Gunakan ini di setiap /api/admin/* route untuk validasi sesi.
 *
 * PENTING: selalu pakai getUser() bukan getSession() —
 * getUser() memvalidasi token ke Supabase server (lebih aman).
 */
export async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Route Handler — tidak bisa set cookie di read-only context, abaikan
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
}
