'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Download,
  IndianRupee,
  Calendar,
  X,
  FileText,
  User,
  GraduationCap,
  Building2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ClassItem } from '@/lib/types';

export default function FeesSectionPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'receipts' | 'assign'>('overview');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Overview Tab State
  const [overviewData, setOverviewData] = useState<{
    kpis: {
      total_receivable: number;
      total_collected: number;
      total_pending: number;
      collection_percentage: number;
    };
    records: any[];
  } | null>(null);
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Collect Fee Modal State
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [collectStudent, setCollectStudent] = useState<any | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'DEMAND_DRAFT' | 'ONLINE'>('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Receipts Tab State
  const [receipts, setReceipts] = useState<any[]>([]);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [activeReceiptModal, setActiveReceiptModal] = useState<any | null>(null);

  // Assign Fee Head Tab State
  const [assignClassId, setAssignClassId] = useState('');
  const [assignFeeTitle, setAssignFeeTitle] = useState('Term 2 Tuition Fee');
  const [assignAmount, setAssignAmount] = useState<number>(10000);
  const [assignDueDate, setAssignDueDate] = useState('2026-11-30');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const [ovData, clsData] = await Promise.all([
        api.fees.getOverview({
          class_id: selectedClassId || undefined,
          section_id: selectedSectionId || undefined,
          status: statusFilter || undefined,
          search: search || undefined,
        }),
        api.academics.getClasses().catch(() => []),
      ]);
      setOverviewData(ovData);
      setClasses(clsData || []);
    } catch (err: any) {
      console.error('Failed to load fee overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const list = await api.fees.getReceipts(receiptSearch);
      setReceipts(list || []);
    } catch (err: any) {
      console.error('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverview();
    } else if (activeTab === 'receipts') {
      loadReceipts();
    }
  }, [activeTab, selectedClassId, selectedSectionId, statusFilter]);

  const handleOpenCollect = (rec: any) => {
    setCollectStudent(rec);
    setCollectAmount(rec.balance > 0 ? rec.balance : rec.amount);
    setPaymentMode('CASH');
    setTransactionRef('');
    setRemarks(`Fee payment for ${rec.fee_title}`);
    setCollectModalOpen(true);
  };

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectStudent || collectAmount <= 0) return;

    try {
      setSubmittingPayment(true);
      setStatusMessage(null);
      const receipt = await api.fees.collectFee({
        student_id: collectStudent.student_id,
        student_fee_id: collectStudent.id,
        amount_paid: Number(collectAmount),
        payment_mode: paymentMode,
        transaction_reference: transactionRef || undefined,
        remarks: remarks || undefined,
      });

      setStatusMessage({
        type: 'success',
        text: `Payment of ₹${Number(collectAmount).toLocaleString('en-IN')} recorded! Receipt #${receipt.receipt_number} generated.`,
      });
      setCollectModalOpen(false);
      await loadOverview();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to collect payment' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleAssignFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAssign(true);
      setStatusMessage(null);
      const res = await api.fees.assignFeeHead({
        class_id: assignClassId || undefined,
        fee_title: assignFeeTitle,
        amount: Number(assignAmount),
        due_date: assignDueDate,
      });

      setStatusMessage({
        type: 'success',
        text: `Fee head "${assignFeeTitle}" assigned successfully to ${res.affected_students} students!`,
      });
      setActiveTab('overview');
      await loadOverview();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to assign fee structure' });
    } finally {
      setSubmittingAssign(false);
    }
  };

  const selectedClass = classes.find((c) => c.class_id === selectedClassId);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
            <CreditCard className="w-4 h-4" />
            Financial Operations
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Fees Management &amp; Collections
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Collect fees through admin portal, check balances, and generate instant printable receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => (activeTab === 'overview' ? loadOverview() : loadReceipts())}
            title="Refresh Ledger"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline hover:opacity-75 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Financial KPIs */}
      {overviewData?.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Receivable</span>
            <div className="text-2xl font-bold text-slate-900">
              ₹{overviewData.kpis.total_receivable.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400">Total Fees Scheduled</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-emerald-700">Total Collected</span>
            <div className="text-2xl font-bold text-emerald-600">
              ₹{overviewData.kpis.total_collected.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Received Payments</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-rose-700">Total Pending Dues</span>
            <div className="text-2xl font-bold text-rose-600">
              ₹{overviewData.kpis.total_pending.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-rose-500 font-medium">Outstanding Balance</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Collection Rate</span>
              <span className="text-xs font-bold text-indigo-600">
                {overviewData.kpis.collection_percentage}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, overviewData.kpis.collection_percentage)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">Overall School Progress</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-[2px] ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Student Fee Ledger &amp; Collect
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-[2px] ${
            activeTab === 'receipts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Fee Receipts Register
        </button>
        <button
          onClick={() => setActiveTab('assign')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-[2px] ${
            activeTab === 'assign'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          + Assign New Fee Structure
        </button>
      </div>

      {/* TAB 1: OVERVIEW & COLLECTION */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSectionId('');
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    Class {c.class_name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                disabled={!selectedClassId}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">All Sections</option>
                {selectedClass?.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    Section {s.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending Dues Only</option>
                <option value="PARTIAL">Partially Paid</option>
                <option value="PAID">Fully Paid</option>
              </select>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadOverview();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or fee title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56 md:w-64"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-sm text-slate-500">Loading student fee records...</div>
            ) : !overviewData?.records || overviewData.records.length === 0 ? (
              <div className="p-16 text-center text-slate-500 space-y-2">
                <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-medium">No fee records found for the selected filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="p-3.5 pl-6">Student</th>
                      <th className="p-3.5">Class</th>
                      <th className="p-3.5">Fee Head</th>
                      <th className="p-3.5">Due Date</th>
                      <th className="p-3.5 text-right">Amount</th>
                      <th className="p-3.5 text-right">Paid</th>
                      <th className="p-3.5 text-right">Balance Due</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overviewData.records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 pl-6">
                          <div className="font-bold text-slate-900">{rec.student_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Adm: {rec.admission_number}
                          </div>
                        </td>

                        <td className="p-3.5 text-slate-700 font-medium">
                          Class {rec.class_name} ({rec.section_name})
                        </td>

                        <td className="p-3.5 font-semibold text-slate-800">{rec.fee_title}</td>

                        <td className="p-3.5 text-slate-500">{rec.due_date}</td>

                        <td className="p-3.5 text-right font-semibold text-slate-800">
                          ₹{Number(rec.amount).toLocaleString('en-IN')}
                        </td>

                        <td className="p-3.5 text-right font-semibold text-emerald-600">
                          ₹{Number(rec.amount_paid).toLocaleString('en-IN')}
                        </td>

                        <td className="p-3.5 text-right font-bold text-rose-600">
                          ₹{Number(rec.balance).toLocaleString('en-IN')}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : rec.status === 'PARTIAL'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>

                        <td className="p-3.5 pr-6 text-right">
                          <button
                            onClick={() => handleOpenCollect(rec)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect Fee</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RECEIPTS REGISTER */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Issued Payment Receipts</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {receipts.length}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadReceipts();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipt no or student..."
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  className="pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-sm text-slate-500">Loading receipts register...</div>
            ) : receipts.length === 0 ? (
              <div className="p-16 text-center text-slate-500 space-y-2">
                <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-medium">No receipts generated yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="p-3.5 pl-6">Receipt #</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Class</th>
                      <th className="p-3.5">Payment Mode</th>
                      <th className="p-3.5 text-right">Amount Paid</th>
                      <th className="p-3.5 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipts.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 pl-6 font-mono font-bold text-indigo-700">
                          {r.receipt_number}
                        </td>
                        <td className="p-3.5 text-slate-600">{r.payment_date}</td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {r.student_name}
                          <span className="block font-mono text-[11px] text-slate-400 font-normal">
                            Adm: {r.admission_number}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">
                          {r.class_name ? `Class ${r.class_name} (${r.section_name})` : '—'}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">{r.payment_mode}</td>
                        <td className="p-3.5 text-right font-bold text-emerald-600 text-sm">
                          ₹{Number(r.amount_paid).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 pr-6 text-right">
                          <button
                            onClick={() => setActiveReceiptModal(r)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
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
        </div>
      )}

      {/* TAB 3: ASSIGN NEW FEE HEAD */}
      {activeTab === 'assign' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-2xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Assign Fee Structure</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Create a fee installment or head (e.g. Term Tuition, Exam Fee, Transport) and assign it to an entire class or all students.
            </p>
          </div>

          <form onSubmit={handleAssignFeeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Target Class
              </label>
              <select
                value={assignClassId}
                onChange={(e) => setAssignClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Classes (School-wide)</option>
                {classes.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    Class {c.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Fee Title / Head <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={assignFeeTitle}
                onChange={(e) => setAssignFeeTitle(e.target.value)}
                placeholder="e.g. Q3 Tuition Fee (Oct - Dec)"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Fee Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={assignAmount}
                  onChange={(e) => setAssignAmount(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submittingAssign}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {submittingAssign ? 'Assigning Structure...' : 'Commit & Assign Fee'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* COLLECT FEE MODAL */}
      {collectModalOpen && collectStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Record Fee Payment</h3>
              </div>
              <button
                onClick={() => setCollectModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <strong className="text-slate-900">{collectStudent.student_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admission No:</span>
                <span className="font-mono">{collectStudent.admission_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fee Head:</span>
                <span className="font-semibold text-indigo-700">{collectStudent.fee_title}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Current Balance:</span>
                <strong className="text-rose-600">₹{Number(collectStudent.balance).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <form onSubmit={handleCollectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online (UPI / NetBanking / QR)</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="BANK_TRANSFER">Bank NEFT/RTGS</option>
                  <option value="DEMAND_DRAFT">Demand Draft (DD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Transaction Reference / Cheque No
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-983210492 or CHQ-00129"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional notes"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCollectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submittingPayment ? 'Processing...' : 'Collect & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW / PRINT RECEIPT MODAL */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            {/* Printable Receipt Slip */}
            <div className="border border-slate-300 rounded-xl p-6 bg-slate-50/50 space-y-5 font-sans">
              {/* Header */}
              <div className="text-center border-b border-slate-200 pb-4">
                <div className="text-base font-bold text-slate-900 uppercase tracking-tight">
                  ACCRETION+ ACADEMY ERP
                </div>
                <div className="text-[11px] text-slate-500">Official Fee Payment Receipt</div>
                <div className="text-xs font-mono font-bold text-indigo-700 mt-1">
                  Receipt No: {activeReceiptModal.receipt_number}
                </div>
              </div>

              {/* Receipt Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Date of Payment:</span>
                  <span className="font-semibold text-slate-800">{activeReceiptModal.payment_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Mode:</span>
                  <span className="font-semibold text-slate-800">{activeReceiptModal.payment_mode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Student Name:</span>
                  <span className="font-bold text-slate-900">{activeReceiptModal.student_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Admission Number:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {activeReceiptModal.admission_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Class &amp; Section:</span>
                  <span className="font-semibold text-slate-800">
                    {activeReceiptModal.class_name ? `Class ${activeReceiptModal.class_name} (${activeReceiptModal.section_name})` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Transaction Reference:</span>
                  <span className="font-mono text-slate-800">{activeReceiptModal.transaction_reference || 'N/A'}</span>
                </div>
              </div>

              {/* Total Box */}
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Total Amount Received:</span>
                <span className="text-base font-bold text-emerald-700">
                  ₹{Number(activeReceiptModal.amount_paid).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 text-center italic">
                This is a computer-generated receipt synced directly with the Student ERP Portal.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt Slip</span>
              </button>

              <button
                onClick={() => setActiveReceiptModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
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
