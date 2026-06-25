'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/supabase';
import { Tenant, Room } from '@/lib/mockData';
import { useApp } from '@/app/providers';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  Home,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function TenantsPage() {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roomId, setRoomId] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [tList, rList] = await Promise.all([
          db.tenants.list(),
          db.rooms.list(),
        ]);
        setTenants(tList);
        setRooms(rList);
      } catch (err) {
        console.error(err);
        showToast('Gagal memuat direktori penyewa', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshTrigger]);

  const openAddModal = () => {
    setEditingTenant(null);
    setName('');
    setEmail('');
    setPhone('');
    setRoomId('');
    setCheckInDate(new Date().toISOString().split('T')[0]);
    setCheckOutDate('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setName(tenant.name);
    setEmail(tenant.email || '');
    setPhone(tenant.phone);
    setRoomId(tenant.room_id || '');
    setCheckInDate(tenant.check_in_date);
    setCheckOutDate(tenant.check_out_date || '');
    setStatus(tenant.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Harap masukkan nama penyewa', 'error');
      return;
    }
    if (!phone.trim()) {
      showToast('Harap masukkan nomor telepon', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await db.tenants.upsert({
        id: editingTenant?.id,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim(),
        room_id: roomId || null,
        check_in_date: checkInDate,
        check_out_date: checkOutDate || null,
        status,
      });

      showToast(
        editingTenant ? 'Data penyewa berhasil diperbarui' : 'Penyewa berhasil didaftarkan',
        'success'
      );
      setIsModalOpen(false);
      triggerRefresh();
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Gagal menyimpan data penyewa';
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, tenantName: string) => {
    if (confirm(`Yakin ingin menghapus penyewa ${tenantName}? Kamar yang terhubung akan dikosongkan.`)) {
      try {
        await db.tenants.delete(id);
        showToast(`Penyewa ${tenantName} berhasil dihapus`, 'success');
        triggerRefresh();
      } catch (err) {
        console.error(err);
        const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus data penyewa';
        showToast(errorMsg, 'error');
      }
    }
  };

  const availableRooms = rooms.filter((r) => {
    if (editingTenant && r.id === editingTenant.room_id) return true;
    return r.status === 'empty';
  });

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.phone.includes(searchQuery) ||
      (t.room_number && t.room_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Penyewa</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Kelola direktori penyewa dan hubungkan ke kamar.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/10"
        >
          <Plus className="w-4 h-4" /> Tambah Penyewa
        </button>
      </div>

      {/* 2. Baris Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-700 dark:text-slate-200"
            placeholder="Cari nama, nomor kamar, email, atau telepon..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider pl-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {/* 3. Tabel Direktori Penyewa */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Memuat direktori penyewa...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Informasi Penyewa</th>
                  <th className="py-4 px-6">Kontak</th>
                  <th className="py-4 px-6">Kamar</th>
                  <th className="py-4 px-6">Tanggal Masuk</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs uppercase">
                          {tenant.name.substring(0, 2)}
                        </div>
                        <div>
                          <span className="block font-bold text-slate-800 dark:text-slate-100">{tenant.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">Ditambahkan {formatDate(tenant.created_at)}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tenant.phone}</span>
                        </div>
                        {tenant.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[150px]">{tenant.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {tenant.room_number ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/10">
                          <Home className="w-3.5 h-3.5" /> Kamar {tenant.room_number}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum ditugaskan</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        <div>
                          <strong className="text-slate-400 mr-1">Masuk:</strong>
                          {formatDate(tenant.check_in_date)}
                        </div>
                        {tenant.check_out_date && (
                          <div>
                            <strong className="text-slate-400 mr-1">Keluar:</strong>
                            {formatDate(tenant.check_out_date)}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          tenant.status === 'active'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {tenant.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => openEditModal(tenant)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          title="Ubah Profil"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tenant.id, tenant.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          title="Hapus Penyewa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada penyewa yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white">
                {editingTenant ? `Ubah Penyewa: ${editingTenant.name}` : 'Daftarkan Penyewa Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  placeholder="mis. Rian Hidayat"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                    placeholder="mis. 081234567890"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                    placeholder="mis. rian@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tugaskan Kamar
                  </label>
                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Belum Ditugaskan --</option>
                    {availableRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        Kamar {room.room_number} ({room.type} - {formatCurrency(room.monthly_rent || room.daily_rent)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="active">Penyewa Aktif</option>
                    <option value="inactive">Tidak Aktif / Sudah Keluar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tanggal Masuk
                  </label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tanggal Keluar (Opsional)
                  </label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Simpan Profil Penyewa'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
