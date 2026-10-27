'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  onSuccess: (identifier: string, newPassword: string) => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialIdentifier = '',
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Requirements metadata from backend
  const [reqs, setReqs] = useState<{
    userType: string;
    identifier: string;
    maskedPhone?: string;
    maskedDob?: string;
    prompt: string;
  } | null>(null);

  // Verification metadata
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [verifiedName, setVerifiedName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIdentifier(initialIdentifier || '');
      setPhone('');
      setEmail('');
      setDob('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setReqs(null);
      setResetToken(null);
      setVerifiedName('');
    }
  }, [isOpen, initialIdentifier]);

  if (!isOpen) return null;

  // Step 1: Look up requirements
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = identifier.trim();
    if (!id) {
      setError('Please enter your administrative identifier, username, or ID.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.auth.getForgotRequirements(id);
      setReqs(data);
      setStep(2);
    } catch (err: any) {
      setError(err?.message || 'Unable to find an account with this identifier.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify challenge details
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() && !email.trim() && !dob.trim()) {
      setError('Please fill in at least one verification detail (registered phone, email, or date of birth).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.verifyForgotChallenge({
        identifier: identifier.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        dob: dob.trim() || undefined,
      });

      setResetToken(res.resetToken);
      setVerifiedName(res.name || identifier.trim());
      setStep(3);
    } catch (err: any) {
      setError(
        err?.message ||
          'Verification failed. The details provided do not match records on file.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!resetToken) {
      setError('Reset session expired. Please verify your identity again.');
      setStep(1);
      return;
    }

    setLoading(true);

    try {
      await api.auth.resetPasswordWithToken(resetToken, newPassword);
      setStep(4);
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess(identifier.trim(), newPassword);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 id="forgot-password-title" className="text-lg font-bold text-slate-800 leading-tight">
                Account Password Recovery
              </h2>
              <p className="text-xs text-slate-500">
                Secure multi-factor challenge to restore account access
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper Progress */}
        {step < 4 && (
          <div className="px-6 pt-4 pb-2 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className={step >= 1 ? 'text-indigo-600 font-bold' : ''}>
                1. Identifier
              </span>
              <span className="text-slate-300">──</span>
              <span className={step >= 2 ? 'text-indigo-600 font-bold' : ''}>
                2. Challenge
              </span>
              <span className="text-slate-300">──</span>
              <span className={step >= 3 ? 'text-indigo-600 font-bold' : ''}>
                3. New Password
              </span>
            </div>
          </div>
        )}

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Find Account */}
          {step === 1 && (
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-identifier"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Administrative Identifier / Username
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="forgot-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. management1, admin, coordinator1"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                    autoFocus
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Enter your assigned staff username or administrative ID.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 disabled:opacity-60"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  <span>Search Account</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Identity Challenge */}
          {step === 2 && reqs && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-slate-700 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-900">
                    Account: <code className="font-mono text-indigo-700 bg-white px-1.5 py-0.5 rounded">{reqs.identifier}</code>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-200/80 text-indigo-800">
                    {reqs.userType}
                  </span>
                </div>
                <p className="text-slate-600 mt-1">{reqs.prompt}</p>
                {reqs.maskedPhone && (
                  <p className="font-mono text-indigo-700 text-[11px]">
                    Registered Phone: {reqs.maskedPhone}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="forgot-phone"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="forgot-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9000000005"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Registered Email Address <span className="text-xs font-normal text-slate-400">(Alternative)</span>
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. staff@school.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                  />
                </div>
              </div>

              {reqs.userType === 'STUDENT' && (
                <div>
                  <label
                    htmlFor="forgot-dob"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Date of Birth (DD-MM-YYYY)
                  </label>
                  <div className="relative">
                    <Calendar
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="forgot-dob"
                      type="text"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      placeholder="DD-MM-YYYY"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 disabled:opacity-60"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  <span>Verify Identity</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Create New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                <span>
                  Identity confirmed for <strong>{verifiedName}</strong>. Enter your new password below.
                </span>
              </div>

              <div>
                <label
                  htmlFor="forgot-new-password"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="forgot-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="forgot-confirm-password"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="forgot-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 disabled:opacity-60"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  <span>Update & Reset Password</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success View */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-50">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-800">
                  Password Reset Successfully!
                </h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto">
                  Your password for <strong className="text-slate-800">{identifier}</strong> has been updated in the database. You can now log into the Web Admin Portal.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                >
                  Log In With New Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
