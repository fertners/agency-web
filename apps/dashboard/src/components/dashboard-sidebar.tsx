'use client';

import {
  Activity,
  Bot,
  Building2,
  ChartNoAxesCombined,
  CircleGauge,
  FileCode2,
  FileText,
  Globe2,
  MessageSquare,
  Rocket,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

const navigation = [
  ['Dashboard', '/', CircleGauge],
  ['Prospects', '/prospects', Search],
  ['Companies', '/companies', Building2],
  ['Websites', '/websites', Globe2],
  ['Proposals', '/proposals', FileText],
  ['Templates', '/templates', FileCode2],
  ['Clients', '/clients', Users],
  ['Deployments', '/deployments', Rocket],
  ['Conversations', '/conversations', MessageSquare],
  ['SEO', '/seo', Activity],
  ['Agent Jobs', '/jobs', Bot],
  ['Analytics', '/analytics', ChartNoAxesCombined],
  ['Settings', '/settings', Settings],
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-slate-800 bg-slate-950 px-4 py-5 text-slate-300 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <a className="mb-7 flex items-center gap-3 px-2" href="/">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 text-white">
          <Bot size={21} />
        </span>
        <span>
          <span className="block font-semibold text-white">AI Web Agency</span>
          <span className="block text-xs text-slate-500">
            Operations console
          </span>
        </span>
      </a>
      <nav className="flex gap-1 overflow-x-auto lg:block lg:space-y-1">
        {navigation.map(([label, href, Icon]) => {
          const active =
            pathname === href ||
            (href !== '/' && pathname.startsWith(`${href}/`));
          return (
            <a
              aria-current={active ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-violet-500/15 text-violet-300'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
              href={href}
              key={label}
            >
              <Icon size={17} />
              {label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
