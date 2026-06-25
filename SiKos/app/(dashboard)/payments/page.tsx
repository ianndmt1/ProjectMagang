'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/supabase';
import { Payment, Tenant } from '@/lib/mockData';
import { useApp } from '@/app/providers';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  X,
  CreditCard,
  Receipt,
  Printer,
  Calendar,
  CheckCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PaymentsPage() {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  
  // Invoice print state
  const [printingPayment, setPrintingPayment] = useState<Payment | null>(null);

  // Form states
  const [tenantId, setTenantId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('transfer');
  const [status, setStatus] = useState<'paid' | 'pending' | 'late'>('paid');
  const [billingPeriodStart, setBillingPeriodStart] = useState('');
  const [billingPeriodEnd, setBillingPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [pList, tList] = await Promise.all([
          db.payments.list(),
          db.tenants.list(),
        ]);
        setPayments(pList);
        setTenants(tList.filter(t => t.status === 'active'));
      } catch (err) {
        console.error(err);
        showToast('Gagal memuat riwayat pembayaran', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshTrigger]);

  const openAddModal = () => {
    setEditingPayment(null);
    setTenantId('');
    setAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('transfer');
    setStatus('paid');
    
    // Default billing period to current month
    const start = new Date();
    start.setDate(1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    setBillingPeriodStart(start.toISOString().split('T')[0]);
    setBillingPeriodEnd(end.toISOString().split('T')[0]);
    
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (payment: Payment) => {
    setEditingPayment(payment);
    setTenantId(payment.tenant_id);
    setAmount(payment.amount.toString());
    setPaymentDate(payment.payment_date);
    setPaymentMethod(payment.payment_method);
    setStatus(payment.status);
    setBillingPeriodStart(payment.billing_period_start);
    setBillingPeriodEnd(payment.billing_period_end);
    setNotes(payment.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      showToast('Please select a resident tenant', 'error');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }
    if (!billingPeriodStart || !billingPeriodEnd) {
      showToast('Please specify the billing period range', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await db.payments.upsert({
        id: editingPayment?.id,
        tenant_id: tenantId,
        amount: Number(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        status,
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        notes: notes.trim() || null,
        proof_url: null,
      });

      showToast(
        editingPayment ? 'Detail pembayaran berhasil diperbarui' : 'Pembayaran berhasil dicatat',
        'success'
      );
      setIsModalOpen(false);
      triggerRefresh();
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Gagal menyimpan data pembayaran';
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus catatan pembayaran untuk ${name}? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await db.payments.delete(id);
        showToast('Catatan pembayaran berhasil dihapus', 'success');
        triggerRefresh();
      } catch (err) {
        console.error(err);
        const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus data pembayaran';
        showToast(errorMsg, 'error');
      }
    }
  };

  // Automatically adjust amount when tenant is selected (pre-fill room monthly/daily rent)
  useEffect(() => {
    if (tenantId && !editingPayment) {
      const selectedTenant = tenants.find(t => t.id === tenantId);
      if (selectedTenant && selectedTenant.room_id) {
        // Query rent amount from rooms
        const getRent = async () => {
          try {
            const roomList = await db.rooms.list();
            const r = roomList.find(room => room.id === selectedTenant.room_id);
            if (r) {
              setAmount((r.monthly_rent || r.daily_rent || 0).toString());
              setNotes(`Rent for Room ${r.room_number}`);
            }
          } catch (err) {
            console.error(err);
          }
        };
        getRent();
      }
    }
  }, [tenantId]);

  // Filters calculation
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.tenant_name && p.tenant_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.room_number && p.room_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || p.payment_method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const handlePrint = () => {
    window.print();
  };

  const statusLabel: Record<string, string> = {
    paid: 'Lunas',
    pending: 'Menunggu',
    late: 'Terlambat',
    cash: 'Tunai',
    transfer: 'Transfer Bank',
  };

  return (
    <div className="space-y-6">

      {/* Gaya print untuk kwitansi */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2rem;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print-hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Catatan Pembayaran</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Lacak dan cetak kwitansi untuk sewa kamar kos.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/10"
        >
          <Plus className="w-4 h-4" /> Catat Pembayaran
        </button>
      </div>

      {/* 2. Filters Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4 print-hidden">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-700 dark:text-slate-200"
            placeholder="Cari nama penyewa, kamar, atau catatan..."
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
            <option value="paid">Lunas</option>
            <option value="pending">Menunggu</option>
            <option value="late">Terlambat</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="all">Semua Metode</option>
            <option value="cash">Tunai</option>
            <option value="transfer">Transfer Bank</option>
          </select>
        </div>
      </div>

      {/* 3. Payments Directory Log */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 print-hidden">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Memuat log transaksi...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm print-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Penyewa & Kamar</th>
                  <th className="py-4 px-6">Periode Tagihan</th>
                  <th className="py-4 px-6">Tanggal Bayar</th>
                  <th className="py-4 px-6">Metode</th>
                  <th className="py-4 px-6">Jumlah</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    {/* Detail Penyewa */}
                    <td className="py-4 px-6">
                      <div>
                        <span className="block font-bold text-slate-800 dark:text-slate-100">{p.tenant_name}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md mt-0.5">
                          Kamar {p.room_number}
                        </span>
                      </div>
                    </td>

                    {/* Billing Period */}
                    <td className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(p.billing_period_start)}</span>
                        <span className="text-slate-400 font-bold mx-0.5">→</span>
                        <span>{formatDate(p.billing_period_end)}</span>
                      </div>
                    </td>

                    {/* Paid Date */}
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(p.payment_date)}
                    </td>

                    {/* Metode */}
                    <td className="py-4 px-6 text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">
                      {statusLabel[p.payment_method] ?? p.payment_method}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-100">
                      {formatCurrency(p.amount)}
                    </td>

                    {/* Badge Status */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          p.status === 'paid'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : p.status === 'pending'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                        }`}
                      >
                        {statusLabel[p.status] ?? p.status}
                      </span>
                    </td>

                    {/* Tombol Aksi */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status === 'paid' && (
                          <button
                            onClick={() => setPrintingPayment(p)}
                            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-500/10 transition-all"
                            title="Cetak Kwitansi"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          title="Ubah Catatan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.tenant_name || '')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada log transaksi yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CRUD Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print-hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white">
                {editingPayment ? 'Ubah Catatan Pembayaran' : 'Catat Pembayaran Sewa Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Tenant Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Pilih Penyewa
                </label>
                <select
                  required
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  disabled={!!editingPayment}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Pilih Penyewa Aktif --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Kamar {t.room_number || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Payment Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Jumlah Dibayar (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-bold"
                    placeholder="e.g. 1500000"
                  />
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tanggal Pembayaran
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Method selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'transfer')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="transfer">Transfer Bank</option>
                    <option value="cash">Tunai</option>
                  </select>
                </div>

                {/* Status selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'paid' | 'pending' | 'late')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="paid">Lunas</option>
                    <option value="pending">Menunggu</option>
                    <option value="late">Terlambat / Jatuh Tempo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Period Start */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mulai Periode
                  </label>
                  <input
                    type="date"
                    required
                    value={billingPeriodStart}
                    onChange={(e) => setBillingPeriodStart(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Period End */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Akhir Periode
                  </label>
                  <input
                    type="date"
                    required
                    value={billingPeriodEnd}
                    onChange={(e) => setBillingPeriodEnd(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Catatan Transaksi
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 h-20"
                  placeholder="mis. Transfer BCA dari Rian, catatan sewa bulan Juni..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-855 flex justify-end gap-2.5">
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
                    'Catat Pembayaran'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Printable Invoice Modal */}
      {printingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print-hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPrintingPayment(null)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col justify-between">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Pratinjau Kwitansi</span>
              <button
                onClick={() => setPrintingPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Print container layout */}
            <div id="printable-invoice" className="p-8 bg-white text-slate-900 text-left font-sans">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-indigo-700">Kwitansi SiKos</h1>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Manajemen Kos</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold text-slate-400">NOMOR INVOICE</span>
                  <span className="text-sm font-black text-slate-800 uppercase">INV-{printingPayment.id.substring(0, 8)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Detail Penyewa</span>
                  <strong className="block text-sm text-slate-800">{printingPayment.tenant_name}</strong>
                  <span className="text-slate-500 font-medium block">Kamar {printingPayment.room_number}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Kwitansi</span>
                  <strong className="block text-slate-800">{formatDate(printingPayment.payment_date)}</strong>
                  <span className="text-slate-500 font-medium block">Metode: <span className="uppercase font-bold">{statusLabel[printingPayment.payment_method] ?? printingPayment.payment_method}</span></span>
                </div>
              </div>

              {/* Invoice Table details */}
              <table className="w-full border-collapse border-t-2 border-b-2 border-slate-900 text-xs mb-6">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-left">
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3 text-right">Periode Tagihan</th>
                    <th className="py-2.5 px-3 text-right">Total Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="text-slate-800 font-medium">
                    <td className="py-3 px-3">
                      <span>Biaya Sewa Kamar</span>
                      <span className="block text-[10px] text-slate-400 italic font-medium">{printingPayment.notes || 'Tidak ada catatan'}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatDate(printingPayment.billing_period_start)} to {formatDate(printingPayment.billing_period_end)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-sm text-slate-900">
                      {formatCurrency(printingPayment.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between items-end mt-12 text-xs">
                <div className="max-w-[220px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status Kwitansi</span>
                  <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider">
                    <CheckCircle className="w-3 h-3" /> Lunas
                  </div>
                </div>
                <div className="text-center w-[150px] border-t border-slate-300 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Pengelola Kos</span>
                  <div className="h-6" />
                  <span className="font-bold text-slate-800 text-[11px]">Manajemen SiKos</span>
                </div>
              </div>
            </div>

            {/* Print action buttons */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-2.5 bg-slate-50 dark:bg-slate-800/50">
              <button
                type="button"
                onClick={() => setPrintingPayment(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Tutup Pratinjau
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Kwitansi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
