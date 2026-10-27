'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { getCurrentUser } from '@/lib/api';

/**
 * Client-side admin shell. The auth check and the layout are unchanged; this lives in a
 * client component so the route layout can be a server component that sets `instant`.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_erp_token') : null;
    const user = getCurrentUser();

    if (!token || !user) {
      router.replace('/login');
      return;
    }

    const permittedRoles = ['SUPER_ADMIN', 'ADMIN', 'TEACHER'];
    const hasRole = user.roles?.some((r: string) => permittedRoles.includes(r));

    if (!hasRole) {
      router.replace('/login');
      return;
    }

    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Verifying administrative authorization...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-900">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
