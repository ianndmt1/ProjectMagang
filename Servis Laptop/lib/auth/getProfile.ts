import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface Profile {
  role: "admin" | "kasir" | "teknisi";
  status: "aktif" | "nonaktif";
  full_name: string;
}

/**
 * Helper to fetch a profile from the 'profiles' table.
 * Accepts a Supabase session or user object, extracts the user ID,
 * and returns the role, status, and full_name of the user.
 * Returns null if not found or on database error.
 */
export async function getProfile(session: any): Promise<Profile | null> {
  const userId = session?.user?.id || session?.id;
  if (!userId) {
    return null;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("role, status, full_name")
      .eq("id", userId)
      .single();

    if (error) {
      console.error(`[getProfile] Error fetching profile for user ${userId}:`, error.message);
      return null;
    }

    return data as Profile;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[getProfile] Unexpected exception for user ${userId}:`, message);
    return null;
  }
}
