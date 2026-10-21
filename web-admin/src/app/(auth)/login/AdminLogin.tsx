'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, School, User } from 'lucide-react';
import { api, setSession } from '@/lib/api';
import './AdminLogin.css';

// Brand and school text shown in the header. Replace SCHOOL_NAME once the
// school's name is available to the frontend.
const BRAND_NAME = 'Acccebx';
const SCHOOL_NAME = 'School Name';

const INFO_PASSWORD_RESET =
  "Password reset isn't available in this portal yet. Please contact your school administrator.";
const INFO_SIGN_UP =
  "Self-service sign-up isn't available. Please contact your school administrator to get access.";

export default function AdminLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('management1');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const data = await api.auth.login(identifier.trim(), password);
      // Validate that user is administrative
      const userRoles = data.user.roles || [];
      const isAllowed = userRoles.some((r: string) =>
        ['SUPER_ADMIN', 'MANAGEMENT', 'COORDINATOR', 'ACCOUNTANT'].includes(r)
      );

      if (!isAllowed) {
        setError(
          'Access Restricted: Only Super Admin, Management, Coordinator, and Administrative roles can access the Web Admin Portal.'
        );
        setLoading(false);
        return;
      }

      setSession(data.token, data.user);
      if (userRoles.includes('SUPER_ADMIN')) {
        router.push('/super-admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError((err instanceof Error && err.message) || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const setPreset = (presetIdentifier: string) => {
    setIdentifier(presetIdentifier);
    setPassword('Password@123');
    setError(null);
    setInfo(null);
  };

  return (
    <div className="admin-login">
      <header className="admin-login-header">
        <div className="admin-login-brand">
          <span className="admin-login-brand-mark" aria-hidden="true">
            A
          </span>
          <span className="admin-login-brand-name">{BRAND_NAME}</span>
        </div>
        <div className="admin-login-school">
          <span className="admin-login-school-mark" aria-hidden="true">
            <School size={15} />
          </span>
          <span className="admin-login-school-name">{SCHOOL_NAME}</span>
        </div>
      </header>

      <main className="admin-login-main">
        <div className="admin-login-card">
          <div className="admin-login-illustration" aria-hidden="true">
            <Image
              src="/admin-login-illustration.webp"
              alt=""
              width={1048}
              height={1008}
              className="admin-login-illustration-img"
              priority
            />
          </div>

          <div className="admin-login-panel">
            <h1 className="admin-login-title">Login</h1>

            {error && (
              <div className="admin-login-alert" role="alert">
                <AlertCircle size={16} className="admin-login-alert-icon" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {info && (
              <div className="admin-login-info" role="status">
                {info}
              </div>
            )}

            <form onSubmit={handleSubmit} className="admin-login-form">
              <div className="admin-login-field">
                <label htmlFor="admin-login-identifier" className="admin-login-sr-only">
                  Administrative Identifier
                </label>
                <input
                  id="admin-login-identifier"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. management1 or coordinator1"
                  className="admin-login-input"
                />
                <User className="admin-login-field-icon" size={18} aria-hidden="true" />
              </div>

              <div className="admin-login-field">
                <label htmlFor="admin-login-password" className="admin-login-sr-only">
                  Secure Password
                </label>
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="admin-login-input"
                />
                <button
                  type="button"
                  className="admin-login-icon-button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="admin-login-forgot">
                <button
                  type="button"
                  className="admin-login-link"
                  onClick={() => {
                    setError(null);
                    setInfo(INFO_PASSWORD_RESET);
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button type="submit" disabled={loading} className="admin-login-submit">
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <p className="admin-login-signup">
              Don&apos;t have account? Let&apos;s{' '}
              <button
                type="button"
                className="admin-login-link"
                onClick={() => {
                  setError(null);
                  setInfo(INFO_SIGN_UP);
                }}
              >
                Get Started For Free!
              </button>
            </p>

            <div className="admin-login-presets">
              <span>Quick test credentials:</span>
              <button type="button" className="admin-login-link font-semibold text-indigo-600" onClick={() => setPreset('superadmin')}>
                Super Admin
              </button>
              <span aria-hidden="true">·</span>
              <button type="button" className="admin-login-link" onClick={() => setPreset('management1')}>
                Management
              </button>
              <span aria-hidden="true">·</span>
              <button type="button" className="admin-login-link" onClick={() => setPreset('coordinator1')}>
                Coordinator
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
