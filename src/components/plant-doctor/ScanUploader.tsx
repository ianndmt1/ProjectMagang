"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Sparkles, AlertCircle } from "lucide-react";
import DiagnosisResult from "./DiagnosisResult";

export default function ScanUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validasi file helper
  const validateFile = (selectedFile: File): boolean => {
    setError(null);

    // Tipe valid
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Format file tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return false;
    }

    // Ukuran valid (maksimal 5MB)
    const maxFileSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxFileSize) {
      setError("Ukuran file terlalu besar. Maksimal ukuran file adalah 5MB.");
      return false;
    }

    return true;
  };

  // Handle seleksi file
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
      }
    }
  };

  // Drag & Drop handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setPreview(URL.createObjectURL(droppedFile));
      }
    }
  };

  // Reset state
  const handleReset = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  };

  // Trigger file dialog
  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Submit scan request
  const handleSubmit = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/plant-scan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menganalisis gambar. Coba lagi.");
      }

      setResult(data);
    } catch (err: any) {
      console.error("Scan submission error:", err);
      setError(err.message || "Terjadi kesalahan koneksi server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Map result recommended_products format to what DiagnosisResult expects
  const getMappedProducts = () => {
    if (!result || !result.recommended_products) return [];

    return result.recommended_products.map((item: any) => ({
      priority: item.priority || 1,
      note: item.note || "",
      product: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image_url: item.image_url,
        wa_message: item.wa_message,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
      },
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* KARTU SCAN UPLOADER */}
      {!result && (
        <div className="bg-white rounded-2xl border border-cream-soft p-6 sm:p-8 shadow-sm">
          <div className="space-y-6">
            
            {/* Input Tersembunyi */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* AREA DROPZONE */}
            {!preview ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? "border-dark-green bg-cream-soft/50 scale-[0.99]"
                    : "border-cream-soft hover:border-sage hover:bg-cream-soft/20"
                }`}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-soft text-sage mb-4">
                  <Upload className="h-8 w-8" />
                </div>
                <p className="text-gray-700 font-semibold text-center text-base">
                  Seret foto tanaman ke sini, atau klik untuk memilih
                </p>
                <p className="text-gray-400 text-xs mt-2 text-center">
                  Mendukung JPG, PNG, atau WebP (Maksimal 5MB)
                </p>
              </div>
            ) : (
              /* AREA PREVIEW */
              <div className="relative rounded-2xl border border-cream-soft overflow-hidden bg-gray-50 flex justify-center items-center h-[350px]">
                <div className="relative h-full w-full">
                  <Image
                    src={preview}
                    alt="Preview upload tanaman"
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors disabled:opacity-50"
                  title="Hapus foto"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 p-4 rounded-xl border border-red-200 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ACTION BUTTON */}
            {preview && (
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sage py-3.5 px-6 font-bold text-white shadow-sm hover:bg-[#769768] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 active:scale-98"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Menganalisis Tanaman...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Analisis Tanaman
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-xl border border-cream-soft bg-white py-3.5 px-6 font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 active:scale-98"
                >
                  Scan Ulang
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* RENDER DIAGNOSIS RESULT */}
      {result && (
        <div className="space-y-6">
          <DiagnosisResult
            aiResult={result.ai_result}
            matchedDisease={result.matched_disease}
            recommendedProducts={getMappedProducts()}
          />
          
          {/* Scan Ulang Button */}
          <div className="text-center pt-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-cream-soft hover:bg-gray-50 text-dark-green font-bold px-6 py-3.5 shadow-sm transition-all"
            >
              Scan Ulang Tanaman Lain
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
