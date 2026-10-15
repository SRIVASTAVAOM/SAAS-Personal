'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Calendar, CheckCircle2, School } from 'lucide-react';

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

export function Topbar() {
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
    <header className="no-print h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {current.title}
        </h1>
        <p className="text-xs text-slate-500 font-normal">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-4 text-xs">
        {/* Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Backend Connected</span>
        </div>

        {/* Date Display */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayStr}</span>
        </div>

        {/* School Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200/60 text-indigo-800 font-semibold">
          <School className="w-3.5 h-3.5 text-indigo-600" />
          <span>Springfield International</span>
        </div>
      </div>
    </header>
  );
}
