"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, AlertCircle, X } from "lucide-react";

type DiseaseSeverity = "ringan" | "sedang" | "parah";

interface Disease {
  id: string;
  name: string;
  description: string | null;
  severity: DiseaseSeverity;
  treatment: string | null;
  keywords: string[];
  recommended_products: any[];
}

const SEVERITY_OPTIONS = [
  { value: "ringan", label: "Ringan", color: "bg-green-100 text-green-700" },
  { value: "sedang", label: "Sedang", color: "bg-yellow-100 text-yellow-700" },
  { value: "parah", label: "Parah", color: "bg-red-100 text-red-700" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  severity: "ringan" as DiseaseSeverity,
  treatment: "",
  keywords: [] as string[],
};

export default function AdminPenyakitPage() {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDisease, setEditingDisease] = useState<Disease | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [keywordInput, setKeywordInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDiseases = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/diseases");
      const json = await res.json();
      if (json.success) setDiseases(json.data);
    } catch {
      showToast("Gagal memuat data penyakit", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiseases();
  }, []);

  const openAddDialog = () => {
    setEditingDisease(null);
    setForm({ ...EMPTY_FORM, keywords: [] });
    setKeywordInput("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (disease: Disease) => {
    setEditingDisease(disease);
    setForm({
      name: disease.name,
      description: disease.description || "",
      severity: disease.severity,
      treatment: disease.treatment || "",
      keywords: [...(disease.keywords || [])],
    });
    setKeywordInput("");
    setIsDialogOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keywordInput.trim()) {
      e.preventDefault();
      const newKw = keywordInput.trim().toLowerCase();
      if (!form.keywords.includes(newKw)) {
        setForm((prev) => ({ ...prev, keywords: [...prev.keywords, newKw] }));
      }
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    setForm((prev) => ({ ...prev, keywords: prev.keywords.filter((k) => k !== kw) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingDisease
        ? `/api/diseases/${editingDisease.id}`
        : "/api/diseases";
      const method = editingDisease ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      showToast(
        editingDisease ? "Penyakit berhasil diperbarui" : "Penyakit berhasil ditambahkan",
        "success"
      );
      setIsDialogOpen(false);
      fetchDiseases();
    } catch (err: any) {
      showToast(err.message || "Terjadi kesalahan", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/diseases/${deleteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast("Penyakit berhasil dihapus", "success");
      setDeleteId(null);
      fetchDiseases();
    } catch {
      showToast("Gagal menghapus penyakit", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const s = SEVERITY_OPTIONS.find((o) => o.value === severity);
    return s?.color || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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
          <h1 className="text-2xl font-extrabold text-dark-green">Kelola Penyakit Tanaman</h1>
          <p className="text-sm text-gray-500 mt-1">Tambah, edit, dan hapus data penyakit beserta keyword-nya</p>
        </div>
        <button
          onClick={openAddDialog}
          className="inline-flex items-center gap-2 rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#769768] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tambah Penyakit
        </button>
      </div>

      {/* Tabel Penyakit */}
      <div className="rounded-2xl border border-cream-soft bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-sage" />
          </div>
        ) : diseases.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Belum ada data penyakit.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-soft bg-cream-soft/40 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Nama Penyakit</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Keywords</th>
                  <th className="px-4 py-3">Produk Rekomendasi</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-soft">
                {diseases.map((disease) => (
                  <tr key={disease.id} className="hover:bg-cream-soft/10 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-dark-green">{disease.name}</p>
                      {disease.description && (
                        <p className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">
                          {disease.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getSeverityColor(disease.severity)}`}
                      >
                        {disease.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-dark-green font-bold">
                        {(disease.keywords || []).length}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">keyword</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-dark-green font-bold">
                        {(disease.recommended_products || []).length}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">produk</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditDialog(disease)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-cream-soft hover:text-dark-green transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(disease.id)}
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

      {/* Modal Tambah/Edit Penyakit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-dark-green">
              {editingDisease ? "Edit Penyakit" : "Tambah Penyakit Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Penyakit *</label>
              <input
                name="name" required value={form.name} onChange={handleFormChange}
                className="w-full rounded-xl border border-cream-soft px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
                placeholder="Contoh: Busuk Akar"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi</label>
              <textarea
                name="description" value={form.description} onChange={handleFormChange} rows={3}
                className="w-full rounded-xl border border-cream-soft px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 resize-none"
                placeholder="Deskripsi penyakit..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Severity *</label>
              <select
                name="severity" value={form.severity} onChange={handleFormChange}
                className="w-full rounded-xl border border-cream-soft px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 bg-white"
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cara Penanganan</label>
              <textarea
                name="treatment" value={form.treatment} onChange={handleFormChange} rows={3}
                className="w-full rounded-xl border border-cream-soft px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 resize-none"
                placeholder="Tips atau langkah penanganan..."
              />
            </div>

            {/* Input Keywords (Tag) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Keywords AI (tekan Enter untuk menambah)
              </label>
              <div className="rounded-xl border border-cream-soft px-3 py-2.5 focus-within:border-sage focus-within:ring-2 focus-within:ring-sage/20 transition-all">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 rounded-full bg-dark-green/10 text-dark-green text-xs px-2.5 py-1 font-medium"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="text-dark-green/50 hover:text-dark-green ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  className="w-full outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                  placeholder="Ketik keyword lalu tekan Enter..."
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Contoh: busuk akar, layu fusarium, kutu daun, bercak daun, dll.
              </p>
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
                {editingDisease ? "Simpan Perubahan" : "Tambah Penyakit"}
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
            Yakin ingin menghapus data penyakit ini? Semua relasi produk rekomendasi untuk penyakit ini juga akan terhapus.
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
