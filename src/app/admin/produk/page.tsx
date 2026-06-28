"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, Product, ProductCategory } from "@/types";
import { Plus, Pencil, Trash2, Loader2, AlertCircle, ToggleLeft, ToggleRight } from "lucide-react";

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "tanaman_hias", label: "Tanaman Hias" },
  { value: "bunga_potong", label: "Bunga Potong" },
  { value: "tanaman_buah", label: "Tanaman Buah" },
  { value: "pupuk", label: "Pupuk" },
  { value: "pestisida", label: "Pestisida & Obat" },
  { value: "media_tanam", label: "Media Tanam" },
  { value: "aksesoris", label: "Aksesoris" },
  { value: "umum", label: "Umum" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  price: 0,
  category: "tanaman_hias" as ProductCategory,
  image_url: "",
  wa_message: "",
  is_active: true,
};

export default function AdminProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Admin fetch: tanpa filter is_active agar bisa lihat semua produk
      const res = await fetch("/api/products?all=true");
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch {
      showToast("Gagal memuat data produk", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddDialog = () => {
    setEditingProduct(null);
    setForm({ ...EMPTY_FORM });
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      category: product.category,
      image_url: product.image_url || "",
      wa_message: product.wa_message || "",
      is_active: product.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const value =
      target.type === "checkbox"
        ? (target as HTMLInputElement).checked
        : target.type === "number"
        ? Number(target.value)
        : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      showToast(
        editingProduct ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan",
        "success"
      );
      setIsDialogOpen(false);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || "Terjadi kesalahan", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !product.is_active }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast(
        `Produk ${!product.is_active ? "diaktifkan" : "dinonaktifkan"}`,
        "success"
      );
      fetchProducts();
    } catch {
      showToast("Gagal mengubah status produk", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast("Produk berhasil dihapus", "success");
      setDeleteId(null);
      fetchProducts();
    } catch {
      showToast("Gagal menghapus produk", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg transition-all ${
            toast.type === "success" ? "bg-dark-green" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-green">Kelola Produk</h1>
          <p className="text-sm text-gray-500 mt-1">Tambah, edit, dan hapus produk toko</p>
        </div>
        <button
          onClick={openAddDialog}
          className="inline-flex items-center gap-2 rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#769768] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      {/* Tabel Produk */}
      <div className="rounded-2xl border border-cream-soft bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-sage" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Belum ada produk.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-soft bg-cream-soft/40 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 w-16">Gambar</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-soft">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-cream-soft/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0">
                        <Image
                          src={product.image_url || "/placeholder-plant.jpg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                          onError={(e: any) => {
                            e.currentTarget.src = "/placeholder-plant.jpg";
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-dark-green max-w-[200px]">
                      <p className="truncate">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{product.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-cream-soft text-dark-green hover:bg-cream-soft border border-cream-soft text-xs">
                        {CATEGORY_LABELS[product.category] || product.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-dark-green whitespace-nowrap">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(product)}
                        title={product.is_active ? "Nonaktifkan" : "Aktifkan"}
                        className="flex items-center justify-center gap-1 mx-auto"
                      >
                        {product.is_active ? (
                          <ToggleRight className="h-6 w-6 text-sage" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                        <span className={`text-xs font-medium ${product.is_active ? "text-green-600" : "text-gray-400"}`}>
                          {product.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditDialog(product)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-cream-soft hover:text-dark-green transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(product.id)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Produk */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-dark-green">
              {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Produk *</label>
              <input
                name="name" required value={form.name} onChange={handleFormChange}
                className="w-full rounded-xl border border-cream-soft px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
                placeholder="Contoh: Pupuk NPK Mutiara"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi</label>
              <textarea
                name="description" value={form.description} onChange={handleFormChange} rows={3}
                className="w-full rounded-xl border border-cream-soft px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 resize-none"
                placeholder="Deskripsi singkat produk..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Harga (Rp) *</label>
                <input
                  name="price" type="number" min={0} required value={form.price} onChange={handleFormChange}
                  className="w-full rounded-xl border border-cream-soft px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori *</label>
                <select
                  name="category" value={form.category} onChange={handleFormChange}
                  className="w-full rounded-xl border border-cream-soft px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 bg-white"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">URL Gambar</label>
              <input
                name="image_url" value={form.image_url} onChange={handleFormChange}
                className="w-full rounded-xl border border-cream-soft px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pesan Default WhatsApp</label>
              <textarea
                name="wa_message" value={form.wa_message} onChange={handleFormChange} rows={2}
                className="w-full rounded-xl border border-cream-soft px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 resize-none"
                placeholder="Halo Bakoel Kembang, saya mau pesan..."
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="is_active" name="is_active" type="checkbox" checked={form.is_active}
                onChange={handleFormChange}
                className="h-4 w-4 accent-sage rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Produk Aktif (tampil di katalog)
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button" onClick={() => setIsDialogOpen(false)}
                className="flex-1 rounded-xl border border-cream-soft py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit" disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sage py-2.5 text-sm font-semibold text-white hover:bg-[#769768] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingProduct ? "Simpan Perubahan" : "Tambah Produk"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-2">
            Yakin ingin menghapus produk ini? Tindakan ini tidak bisa dibatalkan.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 rounded-xl border border-cream-soft py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDelete} disabled={isDeleting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-gray-300 transition-colors"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Ya, Hapus
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
