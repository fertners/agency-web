import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';

export function SectionPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-6xl p-5 sm:p-8">
      <a className="text-sm font-semibold text-violet-600" href="/">
        ← Dashboard
      </a>
      <header className="mb-8 mt-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-slate-500">{description}</p>
      </header>
      <Card>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </main>
  );
}
