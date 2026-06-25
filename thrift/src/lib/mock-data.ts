export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  size: string;
  grade: number; // Condition percentage (e.g. 95)
  lotNumber: string; // E.g., "042" -> formatted as "LOT N°042"
  description: string;
  defects: string | null; // "Catatan kekurangan"
  images: string[]; // Paths or placeholders for photos
  image_urls?: string[]; // Supabase image URLs
  status: 'available' | 'sold';
  category: string;
  createdAt: string;
  is_spotlight?: boolean;
}

// ─── ORDER TYPES ──────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'menunggu_pembayaran'
  | 'sudah_bayar'
  | 'dibatalkan'
  | 'selesai';

export interface Order {
  id: string;
  buyerName: string;
  buyerPhone: string;
  productId: string;
  productName: string;
  productBrand: string;
  lotNumber: string;
  price: number;
  size: string;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
}

// ─── BRANDS & SIZES ───────────────────────────────────────────────────────────
export const brands = [
  "The North Face",
  "Napapijri",
  "Patagonia",
  "Columbia",
  "Arc'teryx",
  "Mammut",
  "Helly Hansen",
  "Berghaus",
  "Jack Wolfskin"
];

export const sizes = ["S", "M", "L", "XL", "XXL"];

// ─── MOCK PRODUCTS ────────────────────────────────────────────────────────────
export const mockProducts: Product[] = [
  {
    id: "prod-001",
    slug: "the-north-face-gore-tex-mountain-jacket",
    name: "Gore-Tex Mountain Light Jacket",
    brand: "The North Face",
    price: 750000,
    size: "XL",
    grade: 95,
    lotNumber: "042",
    description: "Jaket legendaris dengan shell Gore-Tex heavy-duty, windproof, dan waterproof. Cocok untuk mountaineering atau hiking ekstrem di cuaca dingin. Warna Merah Bata/Hitam.",
    defects: "Noda gesekan tipis di saku depan kanan bawah (tidak kentara), lapisan tape seam-sealing bagian dalam masih 100% rapat dan aman.",
    images: [
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop"
    ],
    status: "available",
    category: "Hard Shell",
    createdAt: "2026-06-18T10:00:00Z"
  },
  {
    id: "prod-002",
    slug: "napapijri-rainforest-anorak",
    name: "Rainforest Anorak Winter",
    brand: "Napapijri",
    price: 850000,
    size: "L",
    grade: 92,
    lotNumber: "045",
    description: "Anorak ikonik Napapijri dengan fleece lining bagian dalam yang tebal dan hangat. Bukaan zipper samping. Sangat nyaman untuk udara dingin/motoran malam.",
    defects: "Tali kerutan karet (drawcord) di bagian pinggang bawah sedikit longgar elastisitasnya, kepala zipper saku dada ada kelupas cat minor.",
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=600&auto=format&fit=crop"
    ],
    status: "available",
    category: "Anorak",
    createdAt: "2026-06-19T08:30:00Z"
  },
  {
    id: "prod-003",
    slug: "patagonia-retro-x-fleece-jacket",
    name: "Classic Retro-X Fleece Jacket",
    brand: "Patagonia",
    price: 950000,
    size: "M",
    grade: 90,
    lotNumber: "048",
    description: "Jaket fleece tebal anti angin (windproof membrane). Model retro khas Patagonia dengan saku dada kontras nilon. Sangat hangat untuk camping.",
    defects: "Bulu fleece di bagian siku kanan sedikit pipih/keras (matting) karena bekas sandaran, kain saku nilon dada mulus tanpa gores.",
    images: [
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=600&auto=format&fit=crop"
    ],
    status: "sold",
    category: "Fleece",
    createdAt: "2026-06-15T12:00:00Z"
  },
  {
    id: "prod-004",
    slug: "columbia-omni-tech-windbreaker",
    name: "Omni-Tech Windbreaker Jacket",
    brand: "Columbia",
    price: 450000,
    size: "M",
    grade: 97,
    lotNumber: "051",
    description: "Windbreaker ringan berteknologi Omni-Tech. Tahan air ringan, bernapas (breathable), dan sangat andal menangkal angin kencang gunung.",
    defects: "Kondisi sangat mulus mendekati baru. Hanya minus tag wash dalam instruksi cuci sedikit pudar karena laundry.",
    images: [
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?q=80&w=600&auto=format&fit=crop"
    ],
    status: "available",
    category: "Windbreaker",
    createdAt: "2026-06-20T04:00:00Z"
  },
  {
    id: "prod-005",
    slug: "arcteryx-beta-lt-hybrid-shell",
    name: "Beta LT Hybrid Shell Gore-Tex",
    brand: "Arc'teryx",
    price: 2200000,
    size: "L",
    grade: 98,
    lotNumber: "054",
    description: "Premium technical shell Arc'teryx. Bobot sangat ringan dengan material Gore-Tex Pro di area kritis. Zippers Vislon anti air. Pilihan utama pendaki pro.",
    defects: "Kepala zipper utama orisinal patah kecil di pull-tab, sudah kami ganti dengan pull-tab cord paracord military-grade warna olive.",
    images: [
      "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=600&auto=format&fit=crop"
    ],
    status: "available",
    category: "Hard Shell",
    createdAt: "2026-06-20T09:00:00Z"
  },
  {
    id: "prod-006",
    slug: "mammut-ultimate-hooded-softshell",
    name: "Ultimate V Hooded Softshell Jacket",
    brand: "Mammut",
    price: 800000,
    size: "S",
    grade: 94,
    lotNumber: "063",
    description: "Jaket softshell Gore Windstopper Mammut. Sangat elastis, tahan percikan air (DWR), bernapas tinggi, dan windproof total. Sangat nyaman untuk trail running & summit attack.",
    defects: "Lubang micro diameter 1mm di lengan kanan dekat pergelangan tangan bekas bara api kecil (sudah ditambal dengan seam-tape Gore-Tex sewarna hitam dari dalam, tidak bocor).",
    images: [
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=600&auto=format&fit=crop"
    ],
    status: "available",
    category: "Soft Shell",
    createdAt: "2026-06-17T11:15:00Z"
  },
  {
    id: "prod-007",
    slug: "helly-hansen-salt-waterproof-jacket",
    name: "Salt Waterproof Yachting Jacket",
    brand: "Helly Hansen",
    price: 650000,
    size: "XL",
    grade: 88,
    lotNumber: "057",
    description: "Jaket yachting outdoor Helly Hansen dengan teknologi HellyTech. Tahan air laut, kerah tinggi berlapis fleece hangat, hoodie warna neon.",
    defects: "Tape seam-sealing pelapis jahitan di area pundak bagian dalam mengelupas sepanjang 2.5cm, sedikit bocor jika hujan deras konstan di area tersebut.",
    images: [
      "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop"
    ],
    status: "available",
    category: "Hard Shell",
    createdAt: "2026-06-16T15:20:00Z"
  },
  {
    id: "prod-008",
    slug: "berghaus-mera-peak-vintage-gore-tex",
    name: "Mera Peak Gore-Tex Vintage Jacket",
    brand: "Berghaus",
    price: 550000,
    size: "L",
    grade: 85,
    lotNumber: "060",
    description: "Jaket gunung retro klasik tahun 90-an Berghaus Mera Peak. Shell tebal dengan kombinasi warna colorblock legendaris biru-kuning-merah.",
    defects: "Warna di bagian pundak atas sedikit turun/faded karena paparan sinar matahari (maklum barang vintage). Zipper utama berfungsi normal dan kancing utuh.",
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=600&auto=format&fit=crop"
    ],
    status: "sold",
    category: "Vintage Shell",
    createdAt: "2026-06-14T14:40:00Z"
  },
  {
    id: "prod-009",
    slug: "jack-wolfskin-texapore-parka-jacket",
    name: "Texapore Winter Parka Jacket",
    brand: "Jack Wolfskin",
    price: 700000,
    size: "XXL",
    grade: 91,
    lotNumber: "066",
    description: "Jaket musim dingin model parka dari Jack Wolfskin. Menggunakan bahan waterproof Texapore, hoodie berbulu (faux fur) yang bisa dilepas-pasang.",
    defects: "Kancing cetet (snap button) paling bawah sendiri hilang. Ritsleting utama tertutup flap nilon dengan baik sehingga tetap hangat.",
    images: [
      "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=600&auto=format&fit=crop"
    ],
    status: "available",
    category: "Parka",
    createdAt: "2026-06-19T13:10:00Z"
  }
];

// ─── MOCK ORDERS ──────────────────────────────────────────────────────────────
export const mockOrders: Order[] = [
  {
    id: "ord-001",
    buyerName: "Rizky Pratama",
    buyerPhone: "08112345678",
    productId: "prod-003",
    productName: "Classic Retro-X Fleece Jacket",
    productBrand: "Patagonia",
    lotNumber: "048",
    price: 950000,
    size: "M",
    status: "selesai",
    createdAt: "2026-06-15T14:30:00Z",
    notes: "Transfer BCA sudah dikonfirmasi. Dikirim via JNE REG."
  },
  {
    id: "ord-002",
    buyerName: "Dewi Anggraini",
    buyerPhone: "08567891234",
    productId: "prod-008",
    productName: "Mera Peak Gore-Tex Vintage Jacket",
    productBrand: "Berghaus",
    lotNumber: "060",
    price: 550000,
    size: "L",
    status: "selesai",
    createdAt: "2026-06-16T10:15:00Z",
    notes: "Ambil langsung di depot Klaten."
  },
  {
    id: "ord-003",
    buyerName: "Andi Surya",
    buyerPhone: "08234567890",
    productId: "prod-001",
    productName: "Gore-Tex Mountain Light Jacket",
    productBrand: "The North Face",
    lotNumber: "042",
    price: 750000,
    size: "XL",
    status: "sudah_bayar",
    createdAt: "2026-06-19T09:45:00Z",
    notes: "Pembayaran via GoPay. Menunggu pengemasan."
  },
  {
    id: "ord-004",
    buyerName: "Fira Maulida",
    buyerPhone: "08198765432",
    productId: "prod-005",
    productName: "Beta LT Hybrid Shell Gore-Tex",
    productBrand: "Arc'teryx",
    lotNumber: "054",
    price: 2200000,
    size: "L",
    status: "menunggu_pembayaran",
    createdAt: "2026-06-20T08:00:00Z",
    notes: "COD ditolak, disepakati transfer BCA. Menunggu bukti transfer."
  },
  {
    id: "ord-005",
    buyerName: "Bagas Nugroho",
    buyerPhone: "08387654321",
    productId: "prod-002",
    productName: "Rainforest Anorak Winter",
    productBrand: "Napapijri",
    lotNumber: "045",
    price: 850000,
    size: "L",
    status: "menunggu_pembayaran",
    createdAt: "2026-06-20T11:20:00Z",
  },
  {
    id: "ord-006",
    buyerName: "Sinta Rahayu",
    buyerPhone: "08112378456",
    productId: "prod-006",
    productName: "Ultimate V Hooded Softshell Jacket",
    productBrand: "Mammut",
    lotNumber: "063",
    price: 800000,
    size: "S",
    status: "dibatalkan",
    createdAt: "2026-06-18T16:00:00Z",
    notes: "Buyer minta cancel karena ukuran tidak cocok."
  }
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Format number to Indonesian Rupiah */
export const formatIDR = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/** Admin stats calculation helper */
export const getStats = (products: Product[]) => {
  const totalItems = products.length;
  const totalValue = products.reduce((acc, curr) => acc + (curr.status === "available" ? curr.price : 0), 0);
  const availableItems = products.filter(p => p.status === "available").length;
  const soldItems = products.filter(p => p.status === "sold").length;

  return {
    totalItems,
    totalValue,
    availableItems,
    soldItems
  };
};

/** Order status display helpers */
export const orderStatusLabel: Record<OrderStatus, string> = {
  menunggu_pembayaran: "Menunggu Bayar",
  sudah_bayar: "Sudah Bayar",
  dibatalkan: "Dibatalkan",
  selesai: "Selesai",
};

export const orderStatusColor: Record<OrderStatus, string> = {
  menunggu_pembayaran: "text-mustard border-mustard/40 bg-mustard/10",
  sudah_bayar: "text-olive border-olive/40 bg-olive/10",
  dibatalkan: "text-rust border-rust/40 bg-rust/10",
  selesai: "text-emerald-500 border-emerald-500/40 bg-emerald-500/10",
};
