import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getProfile, Profile } from "@/lib/auth/getProfile";

type RequireActiveStaffResult =
  | { authorized: true; profile: Profile }
  | { authorized: false; response: NextResponse };

/**
 * Helper to validate both the Supabase session and staff profile status.
 * If unauthorized or inactive, it returns an appropriate NextResponse (401 or 403).
 * Otherwise, it returns authorized: true with the user's profile.
 */
export async function requireActiveStaff(session?: any): Promise<RequireActiveStaffResult> {
  let user = session;

  if (!user) {
    const authResult = await getAuthenticatedUser();
    user = authResult.user;
  }

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      ),
    };
  }

  const profile = await getProfile(user);

  if (!profile || profile.status !== "aktif") {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Akun tidak aktif" },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, profile };
}
