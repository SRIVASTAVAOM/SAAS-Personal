'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  UploadCloud,
  FileSpreadsheet,
  LogOut,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { clearSession, getCurrentUser } from '@/lib/api';

const navItems = [
  {
    name: 'Command Center',
    href: '/dashboard',
    icon: LayoutDashboard,
    badge: 'Live',
  },
  {
    name: 'Master Timetable',
    href: '/timetable',
    icon: CalendarDays,
    badge: 'Accretion+',
  },
  {
    name: 'Unified Uploads',
    href: '/academics/uploads',
    icon: UploadCloud,
  },
  {
    name: 'Greensheet Marksheets',
    href: '/reports/greensheet',
    icon: FileSpreadsheet,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const roleName = user?.roles?.[0] || 'ADMIN';

  return (
    <aside className="no-print w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-200 gap-3">
        <div className="w-9 h-9 rounded bg-slate-900 text-white flex items-center justify-center font-bold tracking-tight text-sm shadow-sm">
          <Building2 className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <div className="font-semibold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
            ERP PORTAL
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Web Admin
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Accretion+ Core Suite</div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Administration
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold uppercase shrink-0">
              {user?.identifier?.slice(0, 2) || 'AD'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {user?.identifier || 'Admin User'}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">{roleName}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out of Admin Portal"
            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
