'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/supabase';
import { Room } from '@/lib/mockData';
import { useApp } from '@/app/providers';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const statusLabel: Record<string, string> = {
  occupied: 'Terisi',
  empty: 'Kosong',
  overdue: 'Jatuh Tempo',
};

const typeLabel: Record<string, string> = {
  daily: 'Harian',
  monthly: 'Bulanan',
  both: 'Harian & Bulanan',
};

export default function RoomsPage() {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [roomNumber, setRoomNumber] = useState('');
  const [status, setStatus] = useState<'empty' | 'occupied' | 'overdue'>('empty');
  const [type, setType] = useState<'daily' | 'monthly' | 'both'>('monthly');
  const [dailyRent, setDailyRent] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadRooms() {
      try {
        setLoading(true);
        const list = await db.rooms.list();
        setRooms(list);
      } catch (err) {
        console.error(err);
        showToast('Gagal memuat daftar kamar', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadRooms();
  }, [refreshTrigger]);

  const openAddModal = () => {
    setEditingRoom(null);
    setRoomNumber('');
    setStatus('empty');
    setType('monthly');
    setDailyRent('');
    setMonthlyRent('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.room_number);
    setStatus(room.status);
    setType(room.type);
    setDailyRent(room.daily_rent ? room.daily_rent.toString() : '');
    setMonthlyRent(room.monthly_rent ? room.monthly_rent.toString() : '');
    setDescription(room.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      showToast('Harap masukkan nomor kamar', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await db.rooms.upsert({
        id: editingRoom?.id,
        room_number: roomNumber.trim(),
        status,
        type,
        daily_rent: (type === 'daily' || type === 'both') ? Number(dailyRent) || 0 : 0,
        monthly_rent: (type === 'monthly' || type === 'both') ? Number(monthlyRent) || 0 : 0,
        description,
      });

      showToast(
        editingRoom ? 'Data kamar berhasil diperbarui' : 'Kamar berhasil ditambahkan',
        'success'
      );
      setIsModalOpen(false);
      triggerRefresh();
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Gagal menyimpan data kamar';
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, roomNum: string) => {
    if (confirm(`Yakin ingin menghapus Kamar ${roomNum}? Penyewa yang terhubung akan dilepaskan dari kamar ini.`)) {
      try {
        await db.rooms.delete(id);
        showToast(`Kamar ${roomNum} berhasil dihapus`, 'success');
        triggerRefresh();
      } catch (err) {
        console.error(err);
        const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus data kamar';
        showToast(errorMsg, 'error');
      }
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = r.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Kamar</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tambah, ubah, dan filter kamar yang tersedia di kos Anda.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/10"
        >
          <Plus className="w-4 h-4" /> Tambah Kamar
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
            placeholder="Cari nomor kamar atau fasilitas..."
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
            <option value="empty">Kosong</option>
            <option value="occupied">Terisi</option>
            <option value="overdue">Jatuh Tempo</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="all">Semua Tipe</option>
            <option value="daily">Harian</option>
            <option value="monthly">Bulanan</option>
            <option value="both">Harian & Bulanan</option>
          </select>
        </div>
      </div>

      {/* 3. Grid Kamar */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Memuat data kamar...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 block">
                      Kamar {room.room_number}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mt-1 border border-slate-200/50 dark:border-slate-700/50">
                      Tipe: {typeLabel[room.type] ?? room.type}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      room.status === 'occupied'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        : room.status === 'overdue'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {statusLabel[room.status] ?? room.status}
                  </span>
                </div>

                <div className="space-y-1 py-3 border-t border-b border-slate-100 dark:border-slate-800/50 my-4 text-xs font-medium">
                  {(room.type === 'daily' || room.type === 'both') && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sewa Harian</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(room.daily_rent)}</span>
                    </div>
                  )}
                  {(room.type === 'monthly' || room.type === 'both') && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sewa Bulanan</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(room.monthly_rent)}</span>
                    </div>
                  )}
                </div>

                <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed">
                  {room.description || 'Tidak ada deskripsi.'}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 px-5 py-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-between gap-2">
                <button
                  onClick={() => openEditModal(room)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Ubah Detail
                </button>
                <button
                  onClick={() => handleDelete(room.id, room.room_number)}
                  className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </div>
            </div>
          ))}
          {filteredRooms.length === 0 && (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-10 text-center text-slate-400 font-medium">
              Tidak ada kamar yang cocok dengan filter pencarian.
            </div>
          )}
        </div>
      )}

      {/* 4. Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white">
                {editingRoom ? `Ubah Kamar ${editingRoom.room_number}` : 'Tambah Kamar Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nomor Kamar
                  </label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                    placeholder="mis. A1, 102"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Status Awal
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'empty' | 'occupied' | 'overdue')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="empty">Kosong</option>
                    <option value="occupied">Terisi</option>
                    <option value="overdue">Jatuh Tempo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tipe Sewa
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'daily' | 'monthly' | 'both')}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="daily">Harian Saja</option>
                  <option value="monthly">Bulanan Saja</option>
                  <option value="both">Harian & Bulanan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(type === 'daily' || type === 'both') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Sewa Harian (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      value={dailyRent}
                      onChange={(e) => setDailyRent(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      placeholder="mis. 150000"
                    />
                  </div>
                )}

                {(type === 'monthly' || type === 'both') && (
                  <div className={type === 'monthly' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Sewa Bulanan (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      placeholder="mis. 1500000"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Deskripsi / Fasilitas
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 h-24"
                  placeholder="mis. AC, Wifi, Meja, Kamar Mandi Bersama..."
                />
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
                    'Simpan Data Kamar'
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
