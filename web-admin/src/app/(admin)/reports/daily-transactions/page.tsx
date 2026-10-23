'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  IndianRupee,
  Calendar,
  Search,
  Filter,
  Download,
  Printer,
  ArrowLeft,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
  FileText,
  User,
  GraduationCap,
  Building2,
  CheckCircle2,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ClassItem } from '@/lib/types';

function DailyTransactionReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL query params
  const initialMode = searchParams.get('mode') || 'ALL';
  const initialDate = searchParams.get('date') || '';

  const [dateFilter, setDateFilter] = useState<string>(initialDate);
  const [useSpecificDate, setUseSpecificDate] = useState<boolean>(Boolean(initialDate));
  const [selectedMode, setSelectedMode] = useState<string>(initialMode.toUpperCase());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  const [receipts, setReceipts] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeReceiptModal, setActiveReceiptModal] = useState<any | null>(null);

  // Sync mode from URL if changed
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam) {
      setSelectedMode(modeParam.toUpperCase());
    }
  }, [searchParams]);

  // Load classes and transactions
  const fetchData = async () => {
    try {
      setLoading(true);
      const [receiptsList, classesList] = await Promise.all([
        api.fees.getReceipts({
          date: useSpecificDate && dateFilter ? dateFilter : undefined,
          mode: selectedMode !== 'ALL' ? selectedMode : undefined,
          search: searchQuery || undefined,
        }),
        api.academics.getClasses().catch(() => []),
      ]);
      setReceipts(receiptsList || []);
      setClasses(classesList || []);
    } catch (err: any) {
      console.error('Failed to load transaction report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMode, dateFilter, useSpecificDate]);

  // Handle live search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Filter receipts client-side by class if selected
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (selectedClass !== 'ALL' && r.class_name !== selectedClass) {
        return false;
      }
      return true;
    });
  }, [receipts, selectedClass]);

  // Aggregated mode summaries
  const summaries = useMemo(() => {
    let total = 0;
    let cash = 0;
    let online = 0;
    let app = 0;
    let cheque = 0;

    let cashCount = 0;
    let onlineCount = 0;
    let appCount = 0;
    let chequeCount = 0;

    for (const r of filteredReceipts) {
      const amt = Number(r.amount_paid) || 0;
      total += amt;
      const m = (r.payment_mode || '').toUpperCase();
      if (m === 'CASH') {
        cash += amt;
        cashCount++;
      } else if (m === 'ONLINE' || m === 'BANK_TRANSFER') {
        online += amt;
        onlineCount++;
      } else if (m === 'APP_PAYMENTS' || m === 'APP' || m === 'UPI') {
        app += amt;
        appCount++;
      } else if (m === 'CHEQUE' || m === 'CHEQUES' || m === 'DEMAND_DRAFT') {
        cheque += amt;
        chequeCount++;
      } else {
        online += amt;
        onlineCount++;
      }
    }

    return {
      total,
      totalCount: filteredReceipts.length,
      cash,
      cashCount,
      online,
      onlineCount,
      app,
      appCount,
      cheque,
      chequeCount,
    };
  }, [filteredReceipts]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredReceipts.length === 0) return;
    const headers = ['Receipt #', 'Date', 'Student Name', 'Admission No', 'Class', 'Payment Mode', 'Reference / Cheque', 'Amount (INR)', 'Remarks'];
    const rows = filteredReceipts.map((r) => [
      r.receipt_number,
      r.payment_date,
      `"${r.student_name || ''}"`,
      r.admission_number || '',
      `"${r.class_name ? `Class ${r.class_name} (${r.section_name})` : ''}"`,
      r.payment_mode,
      `"${r.transaction_reference || 'N/A'}"`,
      r.amount_paid,
      `"${r.remarks || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `daily_transaction_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getModeBadge = (mode: string) => {
    const m = (mode || '').toUpperCase();
    if (m === 'CASH') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Banknote className="w-3.5 h-3.5" />
          Cash
        </span>
      );
    }
    if (m === 'ONLINE' || m === 'BANK_TRANSFER') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <CreditCard className="w-3.5 h-3.5" />
          Online / Netbanking
        </span>
      );
    }
    if (m === 'APP_PAYMENTS' || m === 'APP' || m === 'UPI') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Smartphone className="w-3.5 h-3.5" />
          App Payments
        </span>
      );
    }
    if (m === 'CHEQUE' || m === 'CHEQUES' || m === 'DEMAND_DRAFT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Landmark className="w-3.5 h-3.5" />
          Cheque / DD
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <Receipt className="w-3.5 h-3.5" />
        {mode}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Command Center</span>
            </Link>
            <span>/</span>
            <Link href="/fees" className="hover:text-indigo-600">
              Finance
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Daily Transaction Report</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-indigo-600" />
            <span>Daily Transaction Report</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time audit register of school fee collections by Cash, Online, App Payments, and Cheques.
          </p>
        </div>

        {/* Date and Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Specific date vs all dates toggle */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium border border-slate-200">
            <button
              onClick={() => {
                setUseSpecificDate(false);
                setDateFilter('');
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                !useSpecificDate ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Dates
            </button>
            <button
              onClick={() => {
                setUseSpecificDate(true);
                if (!dateFilter) {
                  setDateFilter(new Date().toISOString().slice(0, 10));
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                useSpecificDate ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Date
            </button>
          </div>

          {useSpecificDate && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none"
              />
            </div>
          )}

          <button
            onClick={handleExportCSV}
            disabled={filteredReceipts.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Realization Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Fee Realized */}
        <div
          onClick={() => setSelectedMode('ALL')}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            selectedMode === 'ALL'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Realized</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 tabular-nums">
            ₹{summaries.total.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {summaries.totalCount} {summaries.totalCount === 1 ? 'transaction' : 'transactions'}
          </div>
        </div>

        {/* CASH Mode */}
        <div
          onClick={() => setSelectedMode('CASH')}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            selectedMode === 'CASH'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Cash</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-700 tabular-nums">
            ₹{summaries.cash.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600/80">
            {summaries.cashCount} {summaries.cashCount === 1 ? 'receipt' : 'receipts'}
          </div>
        </div>

        {/* ONLINE Mode */}
        <div
          onClick={() => setSelectedMode('ONLINE')}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            selectedMode === 'ONLINE'
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Online</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-blue-700 tabular-nums">
            ₹{summaries.online.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-blue-600/80">
            {summaries.onlineCount} {summaries.onlineCount === 1 ? 'receipt' : 'receipts'}
          </div>
        </div>

        {/* APP PAYMENTS Mode */}
        <div
          onClick={() => setSelectedMode('APP_PAYMENTS')}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            selectedMode === 'APP_PAYMENTS'
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">App Payments</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-purple-700 tabular-nums">
            ₹{summaries.app.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-purple-600/80">
            {summaries.appCount} {summaries.appCount === 1 ? 'receipt' : 'receipts'}
          </div>
        </div>

        {/* CHEQUES Mode */}
        <div
          onClick={() => setSelectedMode('CHEQUES')}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            selectedMode === 'CHEQUES' || selectedMode === 'CHEQUE'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Cheques</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-amber-700 tabular-nums">
            ₹{summaries.cheque.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-amber-600/80">
            {summaries.chequeCount} {summaries.chequeCount === 1 ? 'receipt' : 'receipts'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Mode Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Modes' },
              { id: 'CASH', label: 'Cash' },
              { id: 'ONLINE', label: 'Online' },
              { id: 'APP_PAYMENTS', label: 'App Payments' },
              { id: 'CHEQUES', label: 'Cheques' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMode(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedMode === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Class Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
            >
              <option value="ALL">All Classes</option>
              {classes.map((c) => (
                <option key={c.class_id} value={c.class_name}>
                  Class {c.class_name}
                </option>
              ))}
            </select>

            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student, receipt, UTR..."
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Transactions Table Register */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <span>Loading daily transactions register...</span>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-800">No transactions found</p>
            <p className="text-xs text-slate-400">
              There are no fee collection receipts matching your chosen date or payment mode filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-3.5 pl-6">Receipt #</th>
                  <th className="p-3.5">Payment Date</th>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Class / Sec</th>
                  <th className="p-3.5">Payment Mode</th>
                  <th className="p-3.5">Reference / Txn No</th>
                  <th className="p-3.5 text-right">Amount Paid</th>
                  <th className="p-3.5 pr-6 text-right">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 pl-6 font-mono font-bold text-indigo-700">
                      {r.receipt_number}
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">
                      {r.payment_date}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {r.student_name}
                      <span className="block font-mono text-[11px] text-slate-400 font-normal">
                        Adm: {r.admission_number}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {r.class_name ? `Class ${r.class_name} (${r.section_name})` : '—'}
                    </td>
                    <td className="p-3.5">
                      {getModeBadge(r.payment_mode)}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-600">
                      {r.transaction_reference || '—'}
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-600 text-sm tabular-nums">
                      ₹{Number(r.amount_paid).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 pr-6 text-right">
                      <button
                        onClick={() => setActiveReceiptModal(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>View Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Voucher Modal */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Fee Payment Voucher</h3>
              </div>
              <button
                onClick={() => setActiveReceiptModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Receipt Number</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {activeReceiptModal.receipt_number}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Payment Date</span>
                  <span className="font-semibold text-slate-800">{activeReceiptModal.payment_date}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-b border-slate-200/60 pb-3">
                <div>
                  <span className="text-slate-400 block">Student Name:</span>
                  <span className="font-bold text-slate-800">{activeReceiptModal.student_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Admission / Roll:</span>
                  <span className="font-mono text-slate-800">
                    {activeReceiptModal.admission_number || 'N/A'} (Roll: {activeReceiptModal.roll_number || '—'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Class & Section:</span>
                  <span className="font-semibold text-slate-800">
                    {activeReceiptModal.class_name ? `Class ${activeReceiptModal.class_name} - ${activeReceiptModal.section_name}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Mode:</span>
                  <span className="font-semibold text-slate-800">{activeReceiptModal.payment_mode}</span>
                </div>
              </div>

              <div className="border-b border-slate-200/60 pb-3">
                <span className="text-slate-400 block">Transaction Reference / Cheque:</span>
                <span className="font-mono text-slate-800 font-medium">
                  {activeReceiptModal.transaction_reference || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-bold text-slate-800">Amount Collected:</span>
                <span className="text-lg font-bold text-emerald-600">
                  ₹{Number(activeReceiptModal.amount_paid).toLocaleString('en-IN')}
                </span>
              </div>

              {activeReceiptModal.remarks && (
                <div className="pt-2 border-t border-slate-200/60 text-slate-500 italic text-[11px]">
                  Remarks: {activeReceiptModal.remarks}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                onClick={() => setActiveReceiptModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DailyTransactionReportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading daily transactions report...</div>}>
      <DailyTransactionReportContent />
    </Suspense>
  );
}
