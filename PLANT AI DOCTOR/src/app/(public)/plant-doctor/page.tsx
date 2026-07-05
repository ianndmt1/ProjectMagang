import ScanUploader from "@/components/plant-doctor/ScanUploader";
import { Bot, AlertCircle } from "lucide-react";

export const metadata = {
  title: "AI Plant Doctor | Bakoel Kembang Boyolali",
  description:
    "Diagnosis penyakit tanaman hias dan tanaman buah Anda secara instan menggunakan AI Plant Doctor. Dapatkan rekomendasi obat tanaman terbaik.",
};

export default function PlantDoctorPage() {
  return (
    <div className="flex flex-col pb-20">
      {/* HERO SECTION KECIL */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sage to-dark-green py-16 text-white mb-12">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-cream-soft mb-2">
              <Bot className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-cream-soft">
              🌿 AI Plant Doctor
            </h1>
            <p className="text-base text-white/90 sm:text-lg leading-relaxed">
              Punya masalah dengan tanaman kesayangan? Upload atau ambil foto bagian daun tanaman yang sakit untuk mendapatkan diagnosis instan dari dokter tanaman AI kami secara gratis!
            </p>
          </div>
        </div>
      </section>

      {/* MAIN RENDER AREA UPLOADER */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScanUploader />

        {/* DISCLAIMER SECTION */}
        <div className="max-w-4xl mx-auto mt-12 flex items-start gap-3 rounded-2xl border border-cream-soft bg-white p-5 text-gray-500 shadow-sm">
          <AlertCircle className="h-5 w-5 text-sage flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            <strong>Peringatan Penting:</strong> AI Plant Doctor merupakan alat bantu diagnosis
            berbasis kecerdasan buatan (Gemini AI) untuk deteksi awal gejala visual pada tanaman.
            Informasi hasil analisis ini dirancang untuk tujuan edukatif dan saran umum, serta tidak
            sepenuhnya menggantikan konsultasi langsung dengan pakar pertanian profesional atau uji
            laboratorium agronomi.
          </p>
        </div>
      </div>
    </div>
  );
}
