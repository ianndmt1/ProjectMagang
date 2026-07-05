// lib/store-info.ts
// Data toko dikumpulkan dari Google Business Profile + beberapa direktori service.
// Sumber: Google Places, kanakomputer.com, ulastempat.com, facebook.com/ServiceCenterLaptop
// Verifikasi ulang nomor telepon & jam buka terbaru sebelum go-live, karena data lapangan bisa berubah.

export const STORE_INFO = {
  name: "BK Computer - Pusat Service Laptop Solo",
  tagline: "Service laptop, komputer & sparepart terpercaya, cepat, dan bergaransi",

  address: {
    street: "Jl. K.H Samanhudi No.138",
    village: "Sondakan",
    district: "Kec. Laweyan",
    city: "Kota Surakarta",
    province: "Jawa Tengah",
    postalCode: "57147",
    full: "Jl. K.H Samanhudi No.138, Sondakan, Kec. Laweyan, Kota Surakarta, Jawa Tengah 57147",
  },

  coordinates: {
    lat: -7.5649413,
    lng: 110.7944999,
  },

  googleMapsUrl: "https://maps.google.com/?cid=17320240362327567896",
  googlePlaceId: "ChIJOcp-FzIUei4RGO7qzNfaXfA",

  contact: {
    phone: "+62 857-2542-0666",
    whatsapp: "6285725420666", // format untuk wa.me, tanpa spasi/simbol/plus
  },

  // CATATAN: data Google Business Profile berbeda dari yang diisi di PRD awal
  // (PRD: Senin-Sabtu 08.00-20.00). Konfirmasi ke pemilik toko jam mana yang benar
  // sebelum dipakai final. Di bawah ini pakai data Google Business (real-time listing).
  operatingHours: {
    monday: { open: "09:00", close: "20:00" },
    tuesday: { open: "09:00", close: "20:00" },
    wednesday: { open: "09:00", close: "20:00" },
    thursday: { open: "09:00", close: "20:00" },
    friday: { open: "09:00", close: "20:00" },
    saturday: { open: "09:00", close: "17:00" },
    sunday: null, // tutup
  },

  // Jam khusus homeservice, sesuai keputusan PRD (hari kerja saja, terpisah dari jam toko)
  homeserviceHours: {
    days: "Senin - Jumat",
    open: "08:00",
    close: "16:00",
  },

  homeserviceArea: {
    coverage: "Kecamatan Laweyan",
    extraFeeNote: "Biaya tambahan Rp 10.000/km untuk jarak di luar radius 10km dari toko",
  },

  rating: {
    score: 4.8,
    count: 483,
    source: "Google Business Profile",
  },

  // Ringkasan tema ulasan pelanggan (diparafrasekan, bukan kutipan langsung),
  // bisa dipakai untuk bagian testimoni di landing page
  testimonialThemes: [
    {
      title: "Berhasil perbaiki motherboard tanpa ganti total",
      summary:
        "Beberapa pelanggan menyebut laptopnya berhasil diperbaiki di bagian motherboard, setelah tempat lain hanya menawarkan penggantian motherboard penuh dengan biaya tinggi.",
    },
    {
      title: "Ramah dan fast response",
      summary:
        "Pelayanan dinilai ramah, teknisi menjelaskan detail kerusakan dengan sabar, dan respons terhadap pertanyaan pelanggan cepat.",
    },
    {
      title: "Harga bersahabat untuk mahasiswa",
      summary:
        "Beberapa ulasan menyebut harga servis terjangkau, cocok untuk kantong mahasiswa, dengan pengerjaan yang cepat.",
    },
    {
      title: "Terbuka soal kondisi sparepart",
      summary:
        "Pelanggan mengapresiasi keterbukaan mengenai kondisi dan kebutuhan sparepart sebelum servis dilakukan, tanpa penambahan biaya di luar kesepakatan.",
    },
  ],
} as const;
