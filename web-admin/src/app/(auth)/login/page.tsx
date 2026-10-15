'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Shield,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  School,
  Database,
} from 'lucide-react';
import { api, setSession } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('management1');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.auth.login(identifier.trim(), password);
      // Validate that user is administrative
      const userRoles = data.user.roles || [];
      const isAllowed = userRoles.some((r: string) =>
        ['MANAGEMENT', 'COORDINATOR', 'ACCOUNTANT'].includes(r)
      );

      if (!isAllowed) {
        setError(
          'Access Restricted: Only Management, Coordinator, and Administrative roles can access the Web Admin Portal.'
        );
        setLoading(false);
        return;
      }

      setSession(data.token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const setPreset = (presetIdentifier: string) => {
    setIdentifier(presetIdentifier);
    setPassword('Password@123');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-slate-900 font-sans">
      {/* Left Column: OEM Brand & System Context */}
      <div className="md:w-5/12 bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-between border-r border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-sm">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                ACCORD ERP
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                  Accretion+
                </span>
              </div>
              <div className="text-xs text-slate-400">Institutional Command Center</div>
            </div>
          </div>

          <div className="space-y-6 max-w-sm">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Unified Administrative Web Portal
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enterprise management suite for Springdale International. Real-time section attendance pills, master timetable scheduling, academic uploads, and automated greensheet report tabulation.
            </p>

            <div className="pt-4 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded bg-slate-800/60 border border-slate-700/60 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-200">Live Attendance & HW Matrix</div>
                  <div className="text-slate-400 text-[11px]">Instant Green/Red section indicators across grades</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded bg-slate-800/60 border border-slate-700/60 text-xs">
                <Database className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-200">Preserved Academic Database</div>
                  <div className="text-slate-400 text-[11px]">Direct integration with PostgreSQL multi-tenant schema</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded bg-slate-800/60 border border-slate-700/60 text-xs">
                <School className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-200">Greensheet Tabulation Engine</div>
                  <div className="text-slate-400 text-[11px]">Consolidated marksheets, rankings, and exportable PDFs</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800">
          <span>Production Build v2.4</span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            256-bit TLS Encrypted
          </span>
        </div>
      </div>

      {/* Right Column: Clean OEM Login Form */}
      <div className="md:w-7/12 flex items-center justify-center p-8 md:p-16 bg-slate-50/50">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-xs">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Administrative Sign In
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your administrative credentials to access the command center.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Administrative Identifier
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. management1 or coordinator1"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-colors bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Secure Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-colors bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Authenticating Session...</span>
                ) : (
                  <>
                    <span>Enter Command Center</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Presets for Demo */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Quick Test Credentials
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPreset('management1')}
                  className="p-2 text-left rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[11px] transition-colors"
                >
                  <div className="font-semibold text-slate-800">Management</div>
                  <div className="text-slate-500 text-[10px]">ID: management1</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('coordinator1')}
                  className="p-2 text-left rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[11px] transition-colors"
                >
                  <div className="font-semibold text-slate-800">Coordinator</div>
                  <div className="text-slate-500 text-[10px]">ID: coordinator1</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
