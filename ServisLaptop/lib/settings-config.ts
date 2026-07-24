// lib/settings-config.ts
// Client-safe: hanya berisi type dan default values, TIDAK ada server imports.

export interface AppSettings {
  id?: number;
  shop_name: string;
  shop_address: string;
  shop_whatsapp: string;
  operational_hours: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: 1,
  shop_name: "LaptopDoctor.AI",
  shop_address: "Jl. Contoh No. 123, Kota Anda",
  shop_whatsapp: "628123456789",
  operational_hours: "Senin-Sabtu 09.00-20.00",
};
