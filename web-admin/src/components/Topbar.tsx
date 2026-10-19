'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Calendar, Menu, School } from 'lucide-react';

const titleMap: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Command Center Dashboard',
    subtitle: 'Real-time section attendance pills, homework feeds, and school KPIs',
  },
  '/timetable': {
    title: 'Master Timetable Builder',
    subtitle: 'Day-wise (Mon–Sat) x period-wise (P1–P8) interactive grid matrix',
  },
  '/academics/uploads': {
    title: 'Unified Academic & HW Upload Portal',
    subtitle: 'Centralized repository for syllabus, homework, datesheets, and assignments',
  },
  '/reports/greensheet': {
    title: 'Master Greensheet Report Cards & Marks',
    subtitle: 'Official class tabulation marksheet, subject percentiles, and rank roster',
  },
};

type TopbarProps = {
  /** Opens the sidebar drawer on screens below md. */
  onMenuClick?: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const current = titleMap[pathname] || {
    title: 'Administration Portal',
    subtitle: 'Integrated Management System',
  };

  const todayStr = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="no-print h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center gap-3 shrink-0">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="md:hidden p-2 -ml-1 rounded-md text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="text-sm font-semibold text-slate-900 tracking-tight truncate">
          {current.title}
        </h1>
        <p className="text-xs text-slate-500 font-normal truncate">{current.subtitle}</p>
      </div>

      <div className="hidden md:flex items-center gap-2.5 text-xs shrink-0">
        {/* Date Display */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayStr}</span>
        </div>

        {/* School Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-50 border border-indigo-200/60 text-indigo-800 font-semibold">
          <School className="w-3.5 h-3.5 text-indigo-600" />
          <span>Springfield International</span>
        </div>
      </div>
    </header>
  );
}
