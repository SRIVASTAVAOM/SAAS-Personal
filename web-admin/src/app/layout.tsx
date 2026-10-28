import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAMAGRA - Web Admin Command Center',
  description: 'Enterprise Web Admin Panel for SAMAGRA School ERP (The Complete School Platform)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
