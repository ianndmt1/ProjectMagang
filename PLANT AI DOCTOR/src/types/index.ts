// src/types/index.ts
// Semua TypeScript types untuk Bakoel Kembang Boyolali
// Sesuai dengan skema tabel Supabase di fase1_schema.sql

// ============================================================
// DATABASE TYPES
// ============================================================

export type ProductCategory =
  | 'bunga_potong'
  | 'tanaman_hias'
  | 'tanaman_buah'
  | 'pupuk'
  | 'pestisida'
  | 'media_tanam'
  | 'aksesoris'
  | 'umum'

export type DiseaseSeverity = 'ringan' | 'sedang' | 'berat'

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category: ProductCategory
  image_url: string | null
  wa_message: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PlantDisease {
  id: string
  name: string
  keywords: string[]
  description: string | null
  severity: DiseaseSeverity
  treatment: string | null
  created_at: string
}

export interface DiseaseProduct {
  id: string
  disease_id: string
  product_id: string
  priority: number
  note: string | null
}

export interface ScanLog {
  id: string
  image_url: string | null
  ai_result: AIResult | null
  disease_id: string | null
  scanned_at: string
}

// ============================================================
// AI RESULT TYPE
// Struktur JSON yang dikembalikan Gemini setelah analisis foto
// ============================================================

export interface AIResult {
  disease_name: string
  // Nama penyakit yang terdeteksi, contoh: "Kutu Putih"
  // Jika sehat: "Tanaman Sehat"

  confidence: 'tinggi' | 'sedang' | 'rendah'
  // Tingkat keyakinan AI terhadap diagnosisnya

  severity: DiseaseSeverity | 'tidak ada'
  // Keparahan penyakit; 'tidak ada' jika tanaman sehat

  is_healthy: boolean
  // true jika tanaman terlihat sehat

  description: string
  // Penjelasan kondisi tanaman dalam Bahasa Indonesia

  symptoms: string[]
  // Gejala-gejala yang terlihat di foto, contoh:
  // ["bercak putih di daun", "daun menggulung"]

  treatment_tips: string
  // Saran penanganan umum

  matched_keywords: string[]
  // Kata kunci dari foto yang cocok dengan database penyakit
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface PlantScanResponse {
  success: boolean
  ai_result: AIResult
  matched_disease: PlantDisease | null
  recommended_products: ProductWithNote[]
  scan_log_id: string
}

export interface ProductWithNote extends Product {
  priority: number
  note: string | null
}

export interface ApiError {
  error: string
  details?: string
}

// ============================================================
// FORM TYPES (untuk admin panel)
// ============================================================

export interface ProductFormData {
  name: string
  description: string
  price: number
  category: ProductCategory
  wa_message: string
  is_active: boolean
  image_file?: File | null
}

export interface DiseaseFormData {
  name: string
  keywords: string
  // Input sebagai string dipisah koma, di-parse jadi array sebelum save
  description: string
  severity: DiseaseSeverity
  treatment: string
}

// ============================================================
// WHATSAPP HELPER TYPE
// ============================================================

export interface WAOrderParams {
  productName: string
  productPrice?: number
  customMessage?: string
}

// Generate URL WhatsApp order
export function generateWAUrl(params: WAOrderParams): string {
  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER || '6285725280724'
  const message = params.customMessage
    || `Halo Bakoel Kembang, saya mau pesan ${params.productName}. Mohon info ketersediaan dan harga terbaru ya. Terima kasih 🌿`
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
}

// ============================================================
// CATEGORY LABEL MAPPING
// ============================================================

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  bunga_potong: 'Bunga Potong',
  tanaman_hias: 'Tanaman Hias',
  tanaman_buah: 'Tanaman Buah',
  pupuk: 'Pupuk',
  pestisida: 'Pestisida & Obat',
  media_tanam: 'Media Tanam',
  aksesoris: 'Aksesoris',
  umum: 'Umum',
}

export const SEVERITY_LABELS: Record<DiseaseSeverity | 'tidak ada', string> = {
  ringan: 'Ringan',
  sedang: 'Sedang',
  berat: 'Berat',
  'tidak ada': 'Tidak Ada',
}

export const SEVERITY_COLORS: Record<DiseaseSeverity | 'tidak ada', string> = {
  ringan: 'bg-yellow-100 text-yellow-800',
  sedang: 'bg-orange-100 text-orange-800',
  berat: 'bg-red-100 text-red-800',
  'tidak ada': 'bg-green-100 text-green-800',
}
