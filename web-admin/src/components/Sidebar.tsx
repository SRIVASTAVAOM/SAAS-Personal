'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  UploadCloud,
  FileSpreadsheet,
  LogOut,
  ShieldCheck,
  Building2,
  Users,
  UserCheck,
  BookOpen,
  Library,
  UserCog,
  ClipboardCheck,
  Receipt,
  Megaphone,
  Bell,
  MessageSquare,
  Globe,
  FolderOpen,
} from 'lucide-react';
import { clearSession, getCurrentUser } from '@/lib/api';

type NavItem = {
  name: string;
  href: string;
  icon: any;
  badge?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: 'Core ERP',
    items: [
      {
        name: 'Command Center',
        href: '/dashboard',
        icon: LayoutDashboard,
        badge: 'Live',
      },
    ],
  },
  {
    title: 'Students & Academics',
    items: [
      {
        name: '1. Student List',
        href: '/students',
        icon: Users,
      },
      {
        name: '2. Subject Master',
        href: '/subjects',
        icon: Library,
      },
      {
        name: '3. View Timetable',
        href: '/timetable',
        icon: CalendarDays,
        badge: 'Sync',
      },
      {
        name: '4. Report Cards',
        href: '/reports/greensheet',
        icon: FileSpreadsheet,
      },
      {
        name: '5. Student Attendance',
        href: '/attendance/students',
        icon: UserCheck,
      },
      {
        name: '11. View/Assign Homework',
        href: '/homework',
        icon: BookOpen,
      },
      {
        name: 'Study Material',
        href: '/academics/study-material',
        icon: FolderOpen,
      },
    ],
  },
  {
    title: 'Staff Management',
    items: [
      {
        name: '8. Staff List',
        href: '/staff',
        icon: UserCog,
      },
      {
        name: '6. Staff Attendance',
        href: '/attendance/staff',
        icon: ClipboardCheck,
      },
    ],
  },
  {
    title: 'Finance & Accounts',
    items: [
      {
        name: '2. Fees Section',
        href: '/fees',
        icon: Receipt,
      },
    ],
  },
  {
    title: 'Communication & Alerts',
    items: [
      {
        name: '9. Add Notice',
        href: '/notices',
        icon: Megaphone,
      },
      {
        name: '10. Push Notifications',
        href: '/notifications',
        icon: Bell,
      },
      {
        name: '7. View Feedback',
        href: '/feedback',
        icon: MessageSquare,
      },
    ],
  },
];

type SidebarProps = {
  /** Mobile drawer state. Ignored on md+ screens, where the sidebar is always visible. */
  open?: boolean;
  onClose?: () => void;
};

export function Sidebar({ open = false, onClose }: SidebarProps) {
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
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
  const isAdmin = user?.roles?.includes('ADMIN');
  const isTeacherOnly = user?.roles?.includes('TEACHER') && !isAdmin && !isSuperAdmin;

  const sectionsToRender = React.useMemo(() => {
    if (isSuperAdmin) {
      return [
        {
          title: 'Platform Master (Level 1)',
          items: [
            {
              name: 'Super Admin Engine',
              href: '/super-admin',
              icon: Globe,
              badge: 'L1',
            },
          ],
        },
        ...navSections,
      ];
    }
    if (isTeacherOnly) {
      return navSections
        .filter((sec) => sec.title !== 'Finance & Accounts' && sec.title !== 'Staff Management')
        .map((sec) => {
          if (sec.title === 'Students & Academics') {
            return {
              ...sec,
              items: sec.items.filter((item) => item.name !== '2. Subject Master'),
            };
          }
          return sec;
        });
    }
    return navSections;
  }, [isSuperAdmin, isTeacherOnly]);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="no-print fixed inset-0 z-30 bg-slate-900/30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 transition-transform duration-200 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-200 gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
            <Image
              src="/logo-icon.png"
              alt="SAMAGRA Logo"
              width={36}
              height={36}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5 truncate">
              SAMAGRA
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                isSuperAdmin 
                  ? 'bg-purple-50 text-purple-700 border-purple-200' 
                  : isTeacherOnly
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
              }`}>
                {isSuperAdmin ? 'Super Admin' : (isTeacherOnly ? 'Teacher Portal' : 'Web Admin')}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium truncate">
              {isSuperAdmin ? 'Multi-School Hub' : (isTeacherOnly ? 'Faculty Academic Suite' : 'SAMAGRA Core Suite')}
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
          {sectionsToRender.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-indigo-600" />
                      )}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                            isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-200 shrink-0">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold uppercase shrink-0">
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
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
