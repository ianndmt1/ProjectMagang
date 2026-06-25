'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/supabase';
import { Room, Tenant, Payment } from '@/lib/mockData';
import { useApp } from '@/app/providers';
import {
  FileBarChart,
  Calendar,
  DollarSign,
  PieChart,
  Printer,
  Download,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';


export default function ReportsPage() {
  const { refreshTrigger, showToast } = useApp();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Time scope selection
  const [selectedYear, setSelectedYear] = useState('2026');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [pList, rList, tList] = await Promise.all([
          db.payments.list(),
          db.rooms.list(),
          db.tenants.list(),
        ]);
        setPayments(pList);
        setRooms(rList);
        setTenants(tList);
      } catch (err) {
        console.error(err);
        showToast('Failed to load reporting metrics', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Generating reports analytics...</p>
      </div>
    );
  }

  // Filter payments by year
  const paidPaymentsInYear = payments.filter((p) => {
    const pDate = new Date(p.payment_date);
    return p.status === 'paid' && pDate.getFullYear().toString() === selectedYear;
  });

  const totalIncome = paidPaymentsInYear.reduce((sum, p) => sum + p.amount, 0);

  // Method Breakdown
  const transferIncome = paidPaymentsInYear
    .filter((p) => p.payment_method === 'transfer')
    .reduce((sum, p) => sum + p.amount, 0);

  const cashIncome = paidPaymentsInYear
    .filter((p) => p.payment_method === 'cash')
    .reduce((sum, p) => sum + p.amount, 0);

  // Room Occupancy calculations
  const totalRooms = rooms.length;
  const occupiedRoomsCount = rooms.filter((r) => r.status === 'occupied').length;
  const overdueRoomsCount = rooms.filter((r) => r.status === 'overdue').length;
  const emptyRoomsCount = rooms.filter((r) => r.status === 'empty').length;

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRoomsCount / totalRooms) * 15000) / 150 : 0; // occupancy rate %

  // Monthly breakdown calculations (January - December)
  const months = [
    { name: 'Jan', value: 0 },
    { name: 'Feb', value: 0 },
    { name: 'Mar', value: 0 },
    { name: 'Apr', value: 0 },
    { name: 'May', value: 0 },
    { name: 'Jun', value: 0 },
    { name: 'Jul', value: 0 },
    { name: 'Aug', value: 0 },
    { name: 'Sep', value: 0 },
    { name: 'Oct', value: 0 },
    { name: 'Nov', value: 0 },
    { name: 'Dec', value: 0 },
  ];

  paidPaymentsInYear.forEach((p) => {
    const pDate = new Date(p.payment_date);
    const m = pDate.getMonth();
    if (m >= 0 && m < 12) {
      months[m].value += p.amount;
    }
  });

  // Find max monthly value to scale the SVG bar graph
  const maxMonthValue = Math.max(...months.map((m) => m.value), 1000000);

  // Unpaid invoices (Outstanding balances)
  const outstandingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'late');
  const totalOutstandingAmount = outstandingPayments.reduce((sum, p) => sum + p.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print-hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Financial & Occupancy Reports</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review total income generated, payment splits, and room occupancies.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="2026">Year 2026</option>
            <option value="2025">Year 2025</option>
          </select>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print Summary
          </button>
        </div>
      </div>

      {/* Print styles specifically for report sheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-sheet, #report-sheet * {
            visibility: visible;
          }
          #report-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 1.5rem !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* 2. Main Sheet Container */}
      <div id="report-sheet" className="space-y-6">
        
        {/* Print Header (Visible only when printed) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-2xl font-black text-indigo-700">SiKos Boarding House Business Summary</h1>
          <p className="text-xs text-slate-500">Business Statement report for Year: {selectedYear} • Printed on {new Date().toLocaleString()}</p>
        </div>

        {/* 2a. Income Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Total Net Income */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform">
              <DollarSign className="w-36 h-36 -mr-4 -mb-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75 mb-1">Net Income ({selectedYear})</span>
              <span className="text-2xl font-black tracking-tight">{formatCurrency(totalIncome)}</span>
            </div>
            <span className="text-[10px] opacity-75 mt-4 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Fully received payment transactions.
            </span>
          </div>

          {/* Outstanding Bills */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Outstanding Balance</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{formatCurrency(totalOutstandingAmount)}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-4 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Pending logs from active renters.</span>
            </span>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Average Occupancy</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{occupancyRate}%</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-4 font-medium">
              {occupiedRoomsCount} occupied, {emptyRoomsCount} empty, {overdueRoomsCount} overdue rooms.
            </span>
          </div>
        </div>

        {/* 2b. Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Monthly Bar Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileBarChart className="w-4 h-4 text-indigo-500" /> Income Breakdown by Month
                </h3>
                <p className="text-xs text-slate-500">Gross revenue earnings received monthly.</p>
              </div>
            </div>

            {/* Inline SVG Chart bar */}
            <div className="relative pt-4 pb-2">
              <div className="flex items-end justify-between h-48 gap-1.5 sm:gap-3">
                {months.map((m, idx) => {
                  const barHeight = (m.value / maxMonthValue) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip */}
                      <span className="absolute -top-7 scale-0 group-hover:scale-100 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md transition-all z-10 whitespace-nowrap">
                        {formatCurrency(m.value)}
                      </span>
                      
                      {/* Bar fill */}
                      <div
                        style={{ height: `${Math.max(barHeight, 3)}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          m.value > 0
                            ? 'bg-indigo-500 group-hover:bg-indigo-400'
                            : 'bg-slate-150 dark:bg-slate-800'
                        }`}
                      />
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 block">
                        {m.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                <PieChart className="w-4 h-4 text-indigo-500" /> Revenue Channels
              </h3>
              <p className="text-xs text-slate-500 mb-6">Payment method splits for paid rent.</p>

              {/* Progress visualizer for Cash vs Bank Transfer */}
              <div className="space-y-4">
                {/* Transfer */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Bank Transfer
                    </span>
                    <span>{totalIncome > 0 ? Math.round((transferIncome / totalIncome) * 100) : 0}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${totalIncome > 0 ? (transferIncome / totalIncome) * 100 : 0}%` }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                    {formatCurrency(transferIncome)}
                  </span>
                </div>

                {/* Cash */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Cash Payment
                    </span>
                    <span>{totalIncome > 0 ? Math.round((cashIncome / totalIncome) * 100) : 0}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${totalIncome > 0 ? (cashIncome / totalIncome) * 100 : 0}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                    {formatCurrency(cashIncome)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 text-[10px] text-slate-400 font-semibold mt-4">
              Tip: Most tenants prefer Bank Transfer; ensure you configure your account numbers correctly in Settings.
            </div>
          </div>

        </div>

        {/* 2c. Outstanding log details list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Unpaid Invoices & Arrears</h3>
              <p className="text-xs text-slate-500">Outstanding rents requiring follow-up.</p>
            </div>
            <span className="text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 rounded-full">
              {outstandingPayments.length} Overdue
            </span>
          </div>

          <div className="divide-y divide-slate-150 dark:divide-slate-800/40 text-xs font-medium">
            {outstandingPayments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 block">{p.tenant_name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Room {p.room_number} • Period: {formatDate(p.billing_period_start)} to {formatDate(p.billing_period_end)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 dark:text-slate-100 block">{formatCurrency(p.amount)}</span>
                  <span className="text-[9px] font-bold text-rose-500 uppercase">{p.status}</span>
                </div>
              </div>
            ))}
            {outstandingPayments.length === 0 && (
              <div className="text-center py-6 text-slate-400 italic">
                Awesome! No outstanding balances. All records are paid.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
