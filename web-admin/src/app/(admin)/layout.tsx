import React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

// The admin shell shows a loading state until the client-side auth check finishes, so
// navigations into this segment can block. Opting out is allowed for this layout (instant
// cannot be set in a Client Component, so the layout is a server component).
export const instant = false;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
