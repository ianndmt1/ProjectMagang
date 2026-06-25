'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/providers';
import { mockDb } from '@/lib/mockData';
import {
  Settings,
  Building,
  CreditCard,
  Database,
  RefreshCw,
  Save,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  const { isDemo, showToast, triggerRefresh } = useApp();
  
  // Kos profile details
  const [kosName, setKosName] = useState('SiKos Boarding House');
  const [kosAddress, setKosAddress] = useState('Jl. Merdeka No. 45, Jakarta Pusat');
  const [bankName, setBankName] = useState('Bank Central Asia (BCA)');
  const [bankAccountNumber, setBankAccountNumber] = useState('1234-5678-90');
  const [bankAccountHolder, setBankAccountHolder] = useState('Budi Kosmas');

  const [isSaving, setIsSaving] = useState(false);

  // Load configuration from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('sikos_business_config');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          setTimeout(() => {
            setKosName(config.kosName || 'SiKos Boarding House');
            setKosAddress(config.kosAddress || 'Jl. Merdeka No. 45, Jakarta Pusat');
            setBankName(config.bankName || 'Bank Central Asia (BCA)');
            setBankAccountNumber(config.bankAccountNumber || '1234-5678-90');
            setBankAccountHolder(config.bankAccountHolder || 'Budi Kosmas');
          }, 0);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const config = {
        kosName,
        kosAddress,
        bankName,
        bankAccountNumber,
        bankAccountHolder
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('sikos_business_config', JSON.stringify(config));
      }
      
      showToast('Boarding House profile saved successfully', 'success');
      triggerRefresh();
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemo = () => {
    if (confirm('Are you sure you want to reset all Demo data? This will restore original rooms, active tenants, and transaction logs.')) {
      mockDb.resetDemoData();
      showToast('Demo data restored successfully!', 'success');
      triggerRefresh();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure your boarding house details and connect databases.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Navigation Sidebar Panel */}
        <div className="space-y-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl transition-all">
              <Building className="w-4 h-4" /> Boarding House Profile
            </button>
            <div className="border-t border-slate-100 dark:border-slate-800 my-2" />
            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Integration status
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Database
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                isDemo 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25' 
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25'
              }`}>
                {isDemo ? 'Demo Mode' : 'Supabase Live'}
              </span>
            </div>
          </div>

          {/* Reset Demo button for demo session */}
          {isDemo && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-xs">
              <span className="font-bold text-amber-500 flex items-center gap-1 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Demo Sandbox
              </span>
              <p className="text-slate-400 font-medium leading-relaxed mb-3">
                Resetting will wipe custom rooms/tenants, restoring the default testing data.
              </p>
              <button
                onClick={handleResetDemo}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-xl text-xs font-bold transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin-reverse" /> Reset Sandbox Data
              </button>
            </div>
          )}
        </div>

        {/* Configurations form column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Form */}
          <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-150 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-500" /> General Profile Settings
              </h3>
              <p className="text-xs text-slate-500">Business credentials displayed on tenant invoices.</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Kos Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Boarding House Name
                </label>
                <input
                  type="text"
                  required
                  value={kosName}
                  onChange={(e) => setKosName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  placeholder="e.g. Kos Budi Mulia"
                />
              </div>

              {/* Kos Address */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Boarding House Address
                </label>
                <textarea
                  required
                  value={kosAddress}
                  onChange={(e) => setKosAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 h-16"
                  placeholder="Full physical address of the boarding house..."
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <CreditCard className="w-4 h-4 text-indigo-500" /> Bank Transfer Information
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {/* Bank Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Bank Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                    placeholder="e.g. Bank Central Asia (BCA)"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Account Number
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                    placeholder="e.g. 123-456-789"
                  />
                </div>
              </div>

              {/* Account Holder */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Account Owner Holder Name
                </label>
                <input
                  type="text"
                  required
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                  placeholder="e.g. Budi Kosmas"
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-150 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Database Setup Guideline Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
              <Database className="w-4.5 h-4.5 text-indigo-500" /> Connecting to live Supabase
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              To connect your live database and enable role-based security:
            </p>
            <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <li>Open your project&apos;s SQL editor in the Supabase console.</li>
              <li>Copy and execute the contents of the local file <code className="bg-slate-100 dark:bg-slate-850 py-0.5 px-1.5 rounded font-bold">schema.sql</code> to create the tables, RLS policies, and sync triggers.</li>
              <li>Edit the variables in <code className="bg-slate-100 dark:bg-slate-850 py-0.5 px-1.5 rounded font-bold">.env.local</code> with your actual Supabase URL and Anon key.</li>
              <li>Restart the local Next.js dev server. The app will automatically sync to live.</li>
            </ol>
          </div>

        </div>

      </div>

    </div>
  );
}
