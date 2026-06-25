'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  mockProducts,
  Product,
  formatIDR,
  brands,
  sizes,
} from '@/lib/mock-data';
import AdminChat from '@/components/sections/admin-chat';
import ThemeToggle from '@/components/ui/theme-toggle';
import {
  X,
  Layers,
  PackageCheck,
  DollarSign,
  Compass,
  TrendingUp,
  RefreshCw,
  Home,
  Plus,
  AlertTriangle,
  LogOut,
  Share2,
  Check,
  Link2,
  UploadCloud,
  Loader2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  AlertOctagon,
} from 'lucide-react';
import { compressImage } from '@/lib/utils/image-compressor';

// ─── SHARE PRODUK (ADMIN — TASK I) ───────────────────────────────────────────
interface AdminShareButtonProps {
  product: Product;
}

function AdminShareButton({ product }: AdminShareButtonProps) {
  const [dropOpen, setDropOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/produk/${product.slug}`
      : `/produk/${product.slug}`;

  // Generate promo caption
  const caption = `🆕 BARU MASUK 🧥 ${product.brand} ${product.name} ukuran ${product.size}, kondisi ${product.grade}%, ${formatIDR(product.price)}. Order: ${productUrl}. #santdoor2nd #thriftjaket #thriftklaten #jaketoutdoor`;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${product.brand} ${product.name} — SANTDOOR.2ND`,
          text: caption,
          url: productUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch {
        // user cancelled
      }
    }
    setDropOpen(!dropOpen);
  };

  const handleCopyCaption = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(caption);
      setShared(true);
      setTimeout(() => {
        setShared(false);
        setDropOpen(false);
      }, 1500);
    } catch { /* noop */ }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(productUrl);
      setShared(true);
      setTimeout(() => {
        setShared(false);
        setDropOpen(false);
      }, 1500);
    } catch { /* noop */ }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={handleShare}
        aria-label="Bagikan produk ke sosial media"
        title="Bagikan ke Sosial Media"
        className={`flex items-center gap-1.5 px-3 py-1.5 border font-sans text-[10px] font-semibold uppercase tracking-widest transition-all duration-200 cursor-pointer rounded-[2px] active:scale-95 ${
          shared
            ? 'border-tan bg-tan text-bg'
            : 'border-[#1A1A1A] text-[#1A1A1A] bg-transparent hover:bg-[#1A1A1A] hover:text-white'
        }`}
      >
        {shared ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
        <span className="hidden sm:inline">{shared ? 'Tersalin!' : 'Bagikan'}</span>
      </button>

      {dropOpen && (
        <div className="absolute right-0 bottom-full mb-1 w-52 bg-white border border-[#E8E6E1] shadow-xl z-50 share-dropdown-enter rounded-[2px]">
          <div className="px-3 py-2 border-b border-[#E8E6E1] flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted font-bold">Bagikan ke</span>
            <button onClick={(e) => { e.stopPropagation(); setDropOpen(false); }} className="text-text-muted hover:text-text-main">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="py-1">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(caption)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDropOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-muted hover:bg-panel hover:text-text-main transition-colors"
            >
              <span>💬</span> WhatsApp
            </a>
            <button
              onClick={handleCopyCaption}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-text-muted hover:bg-panel hover:text-text-main transition-colors text-left"
            >
              <span>📋</span> Salin Caption Promosi
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-text-muted hover:bg-panel hover:text-text-main transition-colors text-left border-t border-hairline/40 mt-1"
            >
              <Link2 className="w-3.5 h-3.5" /> Salin Tautan Produk
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADD PRODUCT MODAL ────────────────────────────────────────────────────────
interface NewProductForm {
  name: string;
  brand: string;
  size: string;
  grade: string;
  price: string;
  category: string;
  description: string;
  defects: string;
}

const EMPTY_FORM: NewProductForm = {
  name: '',
  brand: brands[0],
  size: 'M',
  grade: '90',
  price: '',
  category: '',
  description: '',
  defects: '',
};

const CATEGORIES = ['Hard Shell', 'Soft Shell', 'Fleece', 'Windbreaker', 'Anorak', 'Parka', 'Vintage Shell', 'Insulated'];

function generateLotNumber(existingProducts: Product[]): string {
  const maxLot = existingProducts.reduce((max, p) => {
    const num = parseInt(p.lotNumber, 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return String(maxLot + 3).padStart(3, '0');
}

function generateSlug(name: string, brand: string): string {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface AddProductModalProps {
  onClose: () => void;
  onAdd: (product: Product) => void;
  existingProducts: Product[];
}

function AddProductModal({ onClose, onAdd, existingProducts }: AddProductModalProps) {
  const [form, setForm] = useState<NewProductForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<NewProductForm>>({});
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; file: File; preview: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const supabase = createClient();

  const set = (key: keyof NewProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedFiles(prev => {
            if (prev.length >= 4) return prev; // max 4
            return [...prev, { id: Math.random().toString(36).substr(2, 9), file, preview: reader.result as string }];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemoveImage = (idToRemove: string) => {
    setUploadedFiles(prev => prev.filter(img => img.id !== idToRemove));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      if (direction === 'left' && index > 0) {
        [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      } else if (direction === 'right' && index < newFiles.length - 1) {
        [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
      }
      return newFiles;
    });
  };

  const validate = (): boolean => {
    const newErrors: Partial<NewProductForm> = {};
    if (!form.name.trim()) newErrors.name = 'Nama produk wajib diisi';
    if (!form.category.trim()) newErrors.category = 'Kategori wajib diisi';
    if (!form.price.trim() || isNaN(Number(form.price))) newErrors.price = 'Harga harus angka';
    if (!form.description.trim()) newErrors.description = 'Deskripsi wajib diisi';
    const grade = parseInt(form.grade);
    if (isNaN(grade) || grade < 80 || grade > 100) newErrors.grade = 'Grade harus 80–100';
    
    if (uploadedFiles.length === 0) {
      setUploadError('Pilih setidaknya 1 foto produk.');
      return false;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setUploadError(null);
    setIsUploading(true);

    try {
      const publicUrls: string[] = [];

      // 1. Upload Images to Supabase Storage
      for (const item of uploadedFiles) {
        const compressedFile = await compressImage(item.file, 1200, 0.8);
        const fileExt = compressedFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(filePath, compressedFile, { upsert: false });

        if (uploadErr) throw new Error(`Upload gambar gagal: ${uploadErr.message}`);

        const { data: publicData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        publicUrls.push(publicData.publicUrl);
      }

      const lotNumber = generateLotNumber(existingProducts);
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        slug: generateSlug(form.name, form.brand),
        name: form.name.trim(),
        brand: form.brand,
        price: Number(form.price),
        size: form.size,
        grade: parseInt(form.grade),
        lotNumber,
        description: form.description.trim(),
        defects: form.defects.trim() || null,
        images: publicUrls,
        status: 'available',
        category: form.category,
        createdAt: new Date().toISOString(),
      };

      // 2. Coba simpan ke database (jika tabel products ada)
      // Abaikan error jika tabel tidak ada agar tetap bisa tes lokal
      await supabase.from('products').insert({
        ...newProduct,
        image_urls: publicUrls,
      });

      onAdd(newProduct);
      onClose();
    } catch (err: any) {
      setUploadError(err.message || 'Gagal menyimpan produk.');
    } finally {
      setIsUploading(false);
    }
  };

  const inputClass = "w-full bg-white border border-[#E8E6E1] px-3.5 py-2 font-sans text-xs text-text-main placeholder-text-muted/50 focus:outline-none focus:border-rust transition-colors rounded-[2px]";
  const labelClass = "font-sans text-[10px] text-text-muted uppercase font-semibold tracking-wider block mb-1";
  const errorClass = "font-sans text-xs text-rust mt-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-text-main/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Panel */}
      <div className="relative w-full max-w-2xl bg-white border border-[#E8E6E1] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden rounded-[2px]">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6E1] flex-shrink-0 bg-[#F8F6F1]">
          <div>
            <div className="font-mono text-[9px] text-tan uppercase font-bold tracking-widest mb-1">
              TAMBAH ENTRI DEPOT BARU
            </div>
            <h3 className="font-serif italic text-base font-bold text-text-main">
              Tambah Produk Baru
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#E8E6E1] text-text-muted hover:text-text-main hover:border-rust transition-all cursor-pointer rounded-[2px]"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <div className="flex-grow overflow-y-auto px-6 py-5 space-y-5">

            {/* Row 1: Nama + Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nama Produk *</label>
                <input
                  type="text"
                  placeholder="cth: Gore-Tex Mountain Light Jacket"
                  value={form.name}
                  onChange={set('name')}
                  className={inputClass}
                />
                {errors.name && <p className={errorClass}>{errors.name}</p>}
              </div>
              <div>
                <label className={labelClass}>Brand *</label>
                <select value={form.brand} onChange={set('brand')} className={inputClass}>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2: Kategori + Ukuran + Grade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Kategori *</label>
                <select value={form.category} onChange={set('category')} className={inputClass}>
                  <option value="">-- Pilih --</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className={errorClass}>{errors.category}</p>}
              </div>
              <div>
                <label className={labelClass}>Ukuran *</label>
                <select value={form.size} onChange={set('size')} className={inputClass}>
                  {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Grade (80–100) *</label>
                <input
                  type="number"
                  min={80}
                  max={100}
                  placeholder="95"
                  value={form.grade}
                  onChange={set('grade')}
                  className={inputClass}
                />
                {errors.grade && <p className={errorClass}>{errors.grade}</p>}
              </div>
            </div>

            {/* Row 3: Harga */}
            <div>
              <label className={labelClass}>Harga (IDR) *</label>
              <input
                type="number"
                min={0}
                step={50000}
                placeholder="750000"
                value={form.price}
                onChange={set('price')}
                className={inputClass}
              />
              {errors.price && <p className={errorClass}>{errors.price}</p>}
              {form.price && !isNaN(Number(form.price)) && (
                <p className="font-mono text-[9px] text-mustard mt-1 font-semibold">{formatIDR(Number(form.price))}</p>
              )}
            </div>

            {/* Row 4: Multi-Image Upload */}
            <div className="space-y-2">
              <label className={labelClass}>Foto Produk (Multi-Upload) *</label>
              
              <div 
                className="relative border-2 border-dashed border-[#E8E6E1] hover:border-rust p-6 transition-colors text-center cursor-pointer bg-white flex flex-col items-center justify-center min-h-[120px] rounded-[2px]"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <UploadCloud className="w-6 h-6 text-text-muted mb-2" />
                <div className="space-y-1">
                  <p className="font-sans text-xs text-text-main font-semibold">
                    Klik atau seret file gambar di sini
                  </p>
                  <p className="font-sans text-[10px] text-text-muted">
                    Format PNG, JPG, WEBP (Maksimal 4 gambar)
                  </p>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {uploadedFiles.map((item, idx) => (
                    <div key={item.id} className="relative group border border-hairline overflow-hidden h-24 bg-panel">
                      <img
                        src={item.preview}
                        alt={`preview ${idx}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-rust text-paper text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 select-none">
                          Cover
                        </span>
                      )}
                      
                      {/* Controls overlay */}
                      <div className="absolute inset-0 bg-text-main/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(item.id)}
                            className="w-5 h-5 bg-rust/80 hover:bg-rust text-paper flex items-center justify-center transition-colors cursor-pointer rounded-full"
                            title="Hapus foto"
                            disabled={isUploading}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center bg-bg/90 rounded-full px-1 py-0.5 mt-auto">
                          <button 
                            type="button" 
                            disabled={idx === 0 || isUploading}
                            onClick={() => moveImage(idx, 'left')}
                            className="p-1 text-text-main hover:text-rust disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <GripVertical className="w-3 h-3 text-text-muted" />
                          <button 
                            type="button" 
                            disabled={idx === uploadedFiles.length - 1 || isUploading}
                            onClick={() => moveImage(idx, 'right')}
                            className="p-1 text-text-main hover:text-rust disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {uploadError && (
                <div className="p-2 border border-rust/30 bg-rust/10 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rust shrink-0 mt-0.5" />
                  <p className="text-xs text-rust font-sans">{uploadError}</p>
                </div>
              )}
              
              <p className="font-sans text-[9px] text-text-muted leading-relaxed italic">
                * Gambar otomatis dikompresi dan diunggah ke Supabase Storage.
              </p>
            </div>

            {/* Row 5: Deskripsi */}
            <div>
              <label className={labelClass}>Deskripsi Produk *</label>
              <textarea
                rows={3}
                placeholder="Deskripsikan material, fitur utama, kondisi umum..."
                value={form.description}
                onChange={set('description')}
                className={`${inputClass} resize-none`}
              />
              {errors.description && <p className={errorClass}>{errors.description}</p>}
            </div>

            {/* Row 6: Catatan Kekurangan */}
            <div>
              <label className={labelClass}>
                Catatan Kekurangan / Defect Notes
                <span className="text-text-muted normal-case font-normal ml-2">(opsional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Sebutkan kecacatan secara jujur dan detail..."
                value={form.defects}
                onChange={set('defects')}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-2 bg-white border border-[#E8E6E1] p-3 rounded-[2px]">
              <AlertTriangle className="w-4 h-4 text-tan flex-shrink-0 mt-0.5" />
              <p className="font-sans text-[10px] text-text-muted leading-relaxed">
                LOT N° akan digenerate otomatis.
                Data ini hanya tersimpan di state lokal (belum terhubung database).
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-[#E8E6E1] flex items-center justify-end gap-3 bg-[#F8F6F1]">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 border border-[#E8E6E1] bg-white font-sans text-xs uppercase tracking-widest text-text-muted hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-all cursor-pointer font-semibold rounded-[2px] disabled:opacity-50"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 bg-[#1A1A1A] text-[#F8F6F1] hover:bg-rust hover:text-white font-sans text-xs uppercase font-semibold tracking-widest border border-transparent transition-all rounded-[2px] cursor-pointer disabled:opacity-50 flex items-center"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Tambah ke Stok
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── EDIT PRODUCT MODAL ───────────────────────────────────────────────────────
interface EditProductForm {
  name: string;
  brand: string;
  size: string;
  grade: string;
  price: string;
  category: string;
  description: string;
  defects: string;
  status: 'available' | 'sold';
}

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onSaved: (updated: Product) => void;
}

function EditProductModal({ product, onClose, onSaved }: EditProductModalProps) {
  const supabase = createClient();
  const [form, setForm] = useState<EditProductForm>({
    name: product.name,
    brand: product.brand,
    size: product.size,
    grade: String(product.grade),
    price: String(product.price),
    category: product.category || '',
    description: product.description || '',
    defects: product.defects || '',
    status: product.status,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<EditProductForm>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const set = (key: keyof EditProductForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
    };

  const validate = (): boolean => {
    const newErrors: Partial<EditProductForm> = {};
    if (!form.name.trim()) newErrors.name = 'Nama produk wajib diisi';
    if (!form.price.trim() || isNaN(Number(form.price))) newErrors.price = 'Harga harus angka';
    const grade = parseInt(form.grade);
    if (isNaN(grade) || grade < 80 || grade > 100) newErrors.grade = 'Grade harus 80–100';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaveError(null);
    setIsSaving(true);

    const updatedFields = {
      name: form.name.trim(),
      brand: form.brand,
      size: form.size,
      grade: parseInt(form.grade),
      price: Number(form.price),
      category: form.category,
      description: form.description.trim(),
      defects: form.defects.trim() || null,
      status: form.status,
    };

    try {
      const { error } = await supabase
        .from('products')
        .update(updatedFields)
        .eq('id', product.id);

      if (error) throw new Error(error.message);

      onSaved({ ...product, ...updatedFields });
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls = 'w-full bg-white border border-[#E8E6E1] px-3.5 py-2 font-sans text-xs text-text-main placeholder-text-muted/50 focus:outline-none focus:border-rust transition-colors rounded-[2px]';
  const labelCls = 'font-sans text-[10px] text-text-muted uppercase font-semibold tracking-wider block mb-1';
  const errorCls = 'font-sans text-xs text-rust mt-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-text-main/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Panel */}
      <div className="relative w-full max-w-2xl bg-white border border-[#E8E6E1] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden rounded-[2px]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6E1] flex-shrink-0 bg-[#F8F6F1]">
          <div>
            <div className="font-mono text-[9px] text-tan uppercase font-bold tracking-widest mb-1">
              EDIT ENTRI DEPOT — LOT N°{product.lotNumber}
            </div>
            <h3 className="font-serif italic text-base font-bold text-text-main">Edit Produk</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#E8E6E1] text-text-muted hover:text-text-main hover:border-rust transition-all cursor-pointer rounded-[2px]"
            aria-label="Tutup modal edit"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <div className="flex-grow overflow-y-auto px-6 py-5 space-y-5">

            {/* Row 1: Nama + Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nama Produk *</label>
                <input type="text" value={form.name} onChange={set('name')} className={inputCls} />
                {errors.name && <p className={errorCls}>{errors.name}</p>}
              </div>
              <div>
                <label className={labelCls}>Brand</label>
                <select value={form.brand} onChange={set('brand')} className={inputCls}>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2: Kategori + Ukuran + Grade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Kategori</label>
                <input type="text" value={form.category} onChange={set('category')} placeholder="Hard Shell, Fleece..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ukuran</label>
                <select value={form.size} onChange={set('size')} className={inputCls}>
                  {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Grade (80–100) *</label>
                <input type="number" min={80} max={100} value={form.grade} onChange={set('grade')} className={inputCls} />
                {errors.grade && <p className={errorCls}>{errors.grade}</p>}
              </div>
            </div>

            {/* Row 3: Harga + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Harga (IDR) *</label>
                <input type="number" min={0} step={50000} value={form.price} onChange={set('price')} className={inputCls} />
                {errors.price && <p className={errorCls}>{errors.price}</p>}
                {form.price && !isNaN(Number(form.price)) && (
                  <p className="font-mono text-[9px] text-mustard mt-1 font-semibold">{formatIDR(Number(form.price))}</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Status Stok</label>
                <select value={form.status} onChange={set('status')} className={inputCls}>
                  <option value="available">Tersedia</option>
                  <option value="sold">Terjual</option>
                </select>
              </div>
            </div>

            {/* Row 4: Deskripsi */}
            <div>
              <label className={labelCls}>Deskripsi Produk</label>
              <textarea rows={3} value={form.description} onChange={set('description')} className={`${inputCls} resize-none`} />
            </div>

            {/* Row 5: Defects */}
            <div>
              <label className={labelCls}>Catatan Kekurangan / Defect <span className="text-text-muted normal-case font-normal ml-1">(opsional)</span></label>
              <textarea rows={2} value={form.defects} onChange={set('defects')} className={`${inputCls} resize-none`} />
            </div>

            {/* Save error */}
            {saveError && (
              <div className="p-3 border border-rust/30 bg-rust/10 flex items-start gap-2 rounded-[2px]">
                <AlertTriangle className="w-3.5 h-3.5 text-rust shrink-0 mt-0.5" />
                <p className="text-xs text-rust font-sans">{saveError}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-[#E8E6E1] flex items-center justify-end gap-3 bg-[#F8F6F1]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-[#E8E6E1] bg-white font-sans text-xs uppercase tracking-widest text-text-muted hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-all cursor-pointer font-semibold rounded-[2px] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#1A1A1A] text-[#F8F6F1] hover:bg-rust hover:text-white font-sans text-xs uppercase font-semibold tracking-widest border border-transparent transition-all rounded-[2px] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</>
              ) : (
                <><Check className="w-3.5 h-3.5" /> Simpan Perubahan</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DELETE CONFIRM DIALOG ─────────────────────────────────────────────────────
interface DeleteConfirmDialogProps {
  product: Product;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

function DeleteConfirmDialog({ product, onClose, onDeleted }: DeleteConfirmDialogProps) {
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw new Error(error.message);

      onDeleted(product.id);
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus produk.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-text-main/40 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog Panel */}
      <div className="relative w-full max-w-sm bg-white border border-[#E8E6E1] shadow-2xl rounded-[2px]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E8E6E1] bg-[#F8F6F1]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#DC2626]/10 flex items-center justify-center flex-shrink-0">
              <AlertOctagon className="w-4 h-4 text-[#DC2626]" />
            </div>
            <div>
              <p className="font-mono text-[9px] text-[#DC2626] uppercase font-bold tracking-widest">Konfirmasi Hapus</p>
              <h3 className="font-serif italic text-sm font-bold text-text-main mt-0.5">Hapus Produk</h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="font-sans text-sm text-text-main leading-relaxed">
            Yakin ingin menghapus produk ini? Tindakan tidak bisa dibatalkan.
          </p>
          <div className="bg-[#F8F6F1] border border-[#E8E6E1] p-3 rounded-[2px]">
            <p className="font-mono text-[9px] text-tan uppercase font-bold tracking-widest mb-1">Produk yang akan dihapus</p>
            <p className="font-sans text-xs font-semibold text-text-main">{product.brand} — {product.name}</p>
            <p className="font-mono text-[10px] text-text-muted mt-0.5">LOT N°{product.lotNumber} · Size {product.size} · {formatIDR(product.price)}</p>
          </div>

          {deleteError && (
            <div className="p-2.5 border border-[#DC2626]/30 bg-[#DC2626]/10 flex items-start gap-2 rounded-[2px]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626] shrink-0 mt-0.5" />
              <p className="text-xs text-[#DC2626] font-sans">{deleteError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E6E1] flex items-center justify-end gap-3 bg-[#F8F6F1]">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-[#E8E6E1] bg-white font-sans text-xs uppercase tracking-widest text-text-muted hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-all cursor-pointer font-semibold rounded-[2px] disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-[#DC2626] text-white font-sans text-xs uppercase font-semibold tracking-widest border border-transparent hover:bg-[#B91C1C] transition-all rounded-[2px] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isDeleting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menghapus...</>
            ) : (
              <><Trash2 className="w-3.5 h-3.5" /> Ya, Hapus</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'stok' | 'ai'>('stok');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'ai') {
        setActiveTab('ai');
      }
    }
  }, []);

  const handleToggleStatus = (productId: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== productId) return p;
        return { ...p, status: p.status === 'available' ? 'sold' : 'available' };
      })
    );
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleEditSaved = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeleted = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const stats = useMemo(() => {
    const total = products.length;
    const available = products.filter(p => p.status === 'available').length;
    const sold = products.filter(p => p.status === 'sold').length;
    const assetValue = products.reduce((sum, p) => p.status === 'available' ? sum + p.price : sum, 0);
    return { total, available, sold, assetValue };
  }, [products]);

  return (
    <div className="min-h-screen bg-[#F4F2ED] flex flex-col font-sans text-text-main selection:bg-rust selection:text-paper">

      {/* ── Header ── */}
      <header className="w-full bg-[#1A1A1A] border-b border-white/5 sticky top-0 z-30 select-none text-[#F8F6F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Brand logo */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <Link href="/">
                <span className="font-serif italic text-lg font-bold tracking-wide text-[#F8F6F1] hover:text-[#C8A882] transition-colors">
                  Santdoor<span className="text-tan font-sans font-normal not-italic text-xs tracking-widest ml-1">.ADMIN</span>
                </span>
              </Link>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 text-[9px] bg-[#C8A882]/15 text-[#C8A882] border border-[#C8A882]/20 font-bold font-mono tracking-widest uppercase rounded-[2px]">
                Depot Klaten B.03
              </span>
            </div>

            {/* Main tabs */}
            <nav className="flex space-x-5 sm:space-x-8 h-full">
              <button
                onClick={() => setActiveTab('stok')}
                className={`flex items-center px-1 h-full border-b-2 font-semibold text-xs sm:text-sm tracking-widest uppercase transition-all cursor-pointer ${
                  activeTab === 'stok'
                    ? 'border-[#C8A882] text-[#C8A882]'
                    : 'border-transparent text-[#F8F6F1]/60 hover:text-[#C8A882]'
                }`}
              >
                Kelola Stok
              </button>
              <Link
                href="/admin/pesanan"
                className="flex items-center px-1 h-full border-b-2 border-transparent font-semibold text-xs sm:text-sm tracking-widest uppercase text-[#F8F6F1]/60 hover:text-[#C8A882] transition-all"
              >
                Daftar Pesanan
              </Link>
              <Link
                href="/admin/marketing"
                className="hidden sm:flex items-center px-1 h-full border-b-2 border-transparent font-semibold text-xs sm:text-sm tracking-widest uppercase text-[#F8F6F1]/60 hover:text-[#C8A882] transition-all"
              >
                Analisis Marketing
              </Link>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center px-1 h-full border-b-2 font-semibold text-xs sm:text-sm tracking-widest uppercase transition-all cursor-pointer ${
                  activeTab === 'ai'
                    ? 'border-[#C8A882] text-[#C8A882]'
                    : 'border-transparent text-[#F8F6F1]/60 hover:text-[#C8A882]'
                }`}
              >
                AI Co-Pilot
              </button>
            </nav>

            {/* Right: Quick Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/katalog"
                className="p-2 border border-white/10 hover:border-[#C8A882]/50 bg-white/5 hover:bg-white/10 text-[#F8F6F1]/70 hover:text-[#C8A882] flex items-center space-x-1.5 transition-all text-xs font-semibold rounded-[2px]"
                title="Lihat Toko"
              >
                <Compass className="w-4 h-4" />
                <span className="hidden md:inline font-sans uppercase tracking-wider text-[10px]">Lihat Toko</span>
              </Link>
              <Link
                href="/"
                className="p-2 border border-white/10 hover:border-[#C8A882]/50 bg-white/5 hover:bg-white/10 text-[#F8F6F1]/70 hover:text-[#C8A882] flex items-center space-x-1.5 transition-all text-xs font-semibold rounded-[2px]"
                title="Keluar ke Beranda"
              >
                <Home className="w-4 h-4" />
                <span className="hidden md:inline font-sans uppercase tracking-wider text-[10px]">Beranda</span>
              </Link>
              <ThemeToggle size="sm" />
              <button
                onClick={handleLogout}
                className="p-2 border border-rust/30 hover:border-rust hover:bg-rust/10 text-rust flex items-center space-x-1.5 transition-all text-xs font-semibold cursor-pointer rounded-[2px]"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline font-sans uppercase tracking-wider text-[10px]">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-grow bg-[#F4F2ED]">
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {activeTab === 'stok' ? (
            <>
              {/* Page header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-5 border-b border-[#E8E6E1] gap-4">
                <div>
                  <div className="flex items-center space-x-2 font-mono text-[9px] text-tan uppercase font-bold tracking-widest mb-1">
                    <span>Pengendali Operasional · Stok Depot</span>
                  </div>
                  <h2 className="font-serif italic text-2xl font-bold text-text-main">
                    Kelola Inventaris
                  </h2>
                </div>
                <div className="font-mono text-[9px] text-text-muted text-right tracking-widest leading-relaxed">
                  <span>REF_LOC: 7.7025° S, 110.6033° E</span><br />
                  <span className="text-tan font-semibold">STATUS SISTEM: STABIL</span>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-[#E8E6E1] p-5 relative overflow-hidden select-none rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.01)]">
                  <div className="flex justify-between items-start font-mono text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2">
                    <span>Total Terdaftar</span>
                    <Layers className="w-4 h-4 text-text-muted" />
                  </div>
                  <p className="font-mono text-3xl font-semibold text-text-main">{stats.total}</p>
                  <p className="font-mono text-[10px] text-text-muted tracking-wide uppercase mt-2">Unit LOT</p>
                </div>

                <div className="bg-white border border-[#E8E6E1] p-5 relative overflow-hidden select-none rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.01)]">
                  <div className="flex justify-between items-start font-mono text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2">
                    <span>Stok Tersedia</span>
                    <PackageCheck className="w-4 h-4 text-tan" />
                  </div>
                  <p className="font-mono text-3xl font-semibold text-tan">{stats.available}</p>
                  <p className="font-mono text-[10px] text-text-muted tracking-wide uppercase mt-2">Siap Kirim</p>
                </div>

                <div className="bg-white border border-[#E8E6E1] p-5 relative overflow-hidden select-none rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.01)]">
                  <div className="flex justify-between items-start font-mono text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2">
                    <span>Sudah Terjual</span>
                    <TrendingUp className="w-4 h-4 text-rust" />
                  </div>
                  <p className="font-mono text-3xl font-semibold text-rust">{stats.sold}</p>
                  <p className="font-mono text-[10px] text-text-muted tracking-wide uppercase mt-2">Habis Terjual</p>
                </div>

                <div className="bg-white border border-[#E8E6E1] p-5 relative overflow-hidden select-none rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.01)]">
                  <div className="flex justify-between items-start font-mono text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2">
                    <span>Nilai Aset Aktif</span>
                    <DollarSign className="w-4 h-4 text-tan" />
                  </div>
                  <p className="font-mono text-xl font-semibold text-text-main mt-1">{formatIDR(stats.assetValue)}</p>
                  <p className="font-mono text-[10px] text-text-muted tracking-wide uppercase mt-3">Tidak termasuk terjual</p>
                </div>
              </div>

              {/* Inventory Table + AI */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                {/* Inventory Table */}
                <div className="xl:col-span-8 bg-white border border-[#E8E6E1] p-6 space-y-4 rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.01)]">
                  <div className="flex justify-between items-center pb-3 border-b border-[#E8E6E1] gap-3">
                    <h3 className="font-sans text-xs font-semibold text-tan uppercase tracking-widest">
                      Daftar Stok Gear
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[9px] text-text-muted hidden sm:flex items-center gap-1.5 font-semibold">
                        <RefreshCw className="w-3 h-3 text-tan animate-spin" style={{ animationDuration: '4s' }} />
                        KALKULASI REAL-TIME
                      </span>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] text-[#F8F6F1] hover:bg-rust hover:text-white font-sans text-xs uppercase font-semibold tracking-widest transition-all rounded-[2px] cursor-pointer shadow-sm active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Produk</span>
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto select-text">
                    <table className="w-full text-left font-sans text-xs">
                      <thead>
                        <tr className="border-b border-[#E8E6E1] bg-[#F8F6F1] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-medium">
                          <th className="py-3 px-3 font-medium">LOT</th>
                          <th className="py-3 px-2 font-medium">Brand</th>
                          <th className="py-3 px-2 font-medium">Nama</th>
                          <th className="py-3 px-2 text-center font-medium">Ukuran</th>
                          <th className="py-3 px-2 text-right font-medium">Harga</th>
                          <th className="py-3 px-2 text-center font-medium">Status</th>
                          <th className="py-3 px-2 text-center font-medium">Aksi</th>
                          <th className="py-3 px-3 text-center font-medium">Bagikan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E6E1]/60">
                        {products.map((product) => {
                          const isAvailable = product.status === 'available';
                          return (
                            <tr key={product.id} className="hover:bg-[#F8F6F1]/50 transition-colors group">
                              <td className="py-3.5 px-3 font-mono font-bold text-tan">N°{product.lotNumber}</td>
                              <td className="py-3.5 px-2 font-sans font-semibold text-text-main uppercase text-[10px]">
                                {product.brand}
                              </td>
                              <td className="py-3.5 px-2 font-sans text-text-muted max-w-[140px] truncate">
                                {product.name}
                              </td>
                              <td className="py-3.5 px-2 text-center font-semibold text-text-main">{product.size}</td>
                              <td className="py-3.5 px-2 text-right font-semibold text-text-main">{formatIDR(product.price)}</td>
                              <td className="py-3.5 px-2 text-center">
                                <span className={`inline-flex px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider rounded-[2px] ${
                                  isAvailable
                                    ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                    : 'bg-[#F5F5F5] text-[#757575]'
                                }`}>
                                  {isAvailable ? 'Tersedia' : 'Terjual'}
                                </span>
                              </td>
                              <td className="py-3.5 px-2 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Toggle status */}
                                  <button
                                    onClick={() => handleToggleStatus(product.id)}
                                    className={`px-3 py-1.5 text-[10px] uppercase font-semibold tracking-widest transition-all rounded-[2px] active:scale-[0.96] cursor-pointer ${
                                      isAvailable
                                        ? 'bg-[#E8472A] text-white hover:bg-[#C13E24] border-transparent'
                                        : 'bg-transparent border border-[#C8A882] text-[#1A1A1A] hover:bg-[#C8A882] hover:text-white'
                                    }`}
                                  >
                                    {isAvailable ? 'Tandai Terjual' : 'Stok Ulang'}
                                  </button>
                                  {/* Edit */}
                                  <button
                                    onClick={() => setEditProduct(product)}
                                    title="Edit produk"
                                    className="p-1.5 border border-[#1A1A1A] text-[#1A1A1A] hover:border-[#E8472A] hover:text-[#E8472A] transition-all rounded-[2px] cursor-pointer active:scale-95"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Delete */}
                                  <button
                                    onClick={() => setDeleteProduct(product)}
                                    title="Hapus produk"
                                    className="p-1.5 border border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white transition-all rounded-[2px] cursor-pointer active:scale-95"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                              {/* Share button */}
                              <td className="py-3.5 px-3 text-center">
                                <AdminShareButton product={product} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI Analyst Panel */}
                <div className="xl:col-span-4">
                  <div className="mb-3 flex items-center space-x-2 font-mono text-[10px] text-tan font-bold uppercase select-none">
                    <span>Sistem Analisis AI</span>
                  </div>
                  <AdminChat />
                </div>

              </div>
            </>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E6E1]">
                <div>
                  <div className="flex items-center space-x-2 font-mono text-[9px] text-tan uppercase font-bold tracking-widest mb-1">
                    <span>Lingkungan Co-Pilot · Chat Aktif</span>
                  </div>
                  <h2 className="font-serif italic text-2xl font-bold text-text-main">
                    AI Co-Pilot Analis
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('stok')}
                  className="px-4 py-2 border border-[#E8E6E1] bg-white hover:bg-[#F8F6F1] text-text-muted hover:text-[#1A1A1A] text-xs font-semibold tracking-widest uppercase transition-all cursor-pointer rounded-[2px]"
                >
                  ← Kembali ke Stok
                </button>
              </div>
              <AdminChat />
            </div>
          )}
        </main>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddProduct}
          existingProducts={products}
        />
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <EditProductModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deleteProduct && (
        <DeleteConfirmDialog
          product={deleteProduct}
          onClose={() => setDeleteProduct(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
