// lib/settings.ts
// SERVER-ONLY: menggunakan createServerSupabaseClient (pakai next/headers).
// Jangan import file ini dari Client Components.
// Untuk client components, import AppSettings & DEFAULT_APP_SETTINGS dari @/lib/settings-config

import { createServerSupabaseClient } from "./supabase/server";
import { AppSettings, DEFAULT_APP_SETTINGS } from "./settings-config";

export type { AppSettings };
export { DEFAULT_APP_SETTINGS };

/**
 * Fetch app settings from database (server-side using service_role key).
 * Returns DEFAULT_APP_SETTINGS if record is empty or query fails.
 * ONLY for use in Server Components, API Routes, and Server Actions.
 */
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("id, shop_name, shop_address, shop_whatsapp, operational_hours")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.warn("[getAppSettings] Failed to fetch settings, using fallback:", error.message);
      }
      return DEFAULT_APP_SETTINGS;
    }

    return {
      id: data.id ?? 1,
      shop_name: data.shop_name || DEFAULT_APP_SETTINGS.shop_name,
      shop_address: data.shop_address || DEFAULT_APP_SETTINGS.shop_address,
      shop_whatsapp: data.shop_whatsapp || DEFAULT_APP_SETTINGS.shop_whatsapp,
      operational_hours: data.operational_hours || DEFAULT_APP_SETTINGS.operational_hours,
    };
  } catch (err) {
    console.warn("[getAppSettings] Exception fetching settings, using fallback:", err);
    return DEFAULT_APP_SETTINGS;
  }
}
