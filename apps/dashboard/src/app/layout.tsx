import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { DashboardShell } from '@/components/dashboard-shell';
import { ToastProvider } from '@/components/toast-provider';

import './globals.css';

export const metadata: Metadata = {
  title: 'AI Web Agency — Operations',
  description: 'Operations dashboard for the AI Web Agency platform.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <ToastProvider>
          <DashboardShell>{children}</DashboardShell>
        </ToastProvider>
      </body>
    </html>
  );
}
