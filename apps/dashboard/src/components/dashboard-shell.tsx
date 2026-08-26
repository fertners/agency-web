'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';

export function DashboardShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  if (pathname.startsWith('/proposal/')) return children;
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <DashboardSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
