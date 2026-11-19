import clsx from 'clsx';
import { BookOpenText, FileText, LayoutGrid, Plus, Receipt, Search, Settings2, Truck, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { go } from '../lib/router';
import { createDoc, useDocs, useSync } from '../lib/store';
import { DOC_META, DOC_TYPES, type DocType } from '../lib/types';
import { openPalette } from './CommandPalette';
import { Logo } from './Logo';
import { Kbd, Menu } from './ui';

export const TYPE_ICON: Record<DocType, LucideIcon> = {
  quotation: FileText,
  invoice: Receipt,
  delivery: Truck,
  statement: BookOpenText,
};

const spring = { type: 'spring' as const, stiffness: 520, damping: 42 };
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
export const MOD_KEY = isMac ? '⌘' : 'Ctrl';

export const newDoc = (type: DocType) => go('doc/' + createDoc(type).id);

// ------------------------------------------------------------------ sync status

function useSyncLabel() {
  const s = useSync();
  if (s.mode === 'local') return { tone: 'off', text: 'Saved on this device' } as const;
  if (!s.online) return { tone: 'warn', text: s.pending ? `Offline · ${s.pending} waiting` : 'Offline' } as const;
  if (s.phase === 'error') return { tone: 'bad', text: 'Sync issue' } as const;
  if (s.phase === 'syncing' || s.pending) return { tone: 'busy', text: 'Syncing…' } as const;
  return { tone: 'ok', text: 'All changes synced' } as const;
}

export function SyncDot({ tone }: { tone: 'ok' | 'busy' | 'warn' | 'bad' | 'off' }) {
  return (
    <span className="relative flex size-2 shrink-0">
      {tone === 'busy' && <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent/60" />}
      <span
        className={clsx(
          'relative inline-flex size-2 rounded-full',
          tone === 'ok' && 'bg-emerald-500',
          tone === 'busy' && 'bg-accent',
          tone === 'warn' && 'bg-amber-500',
          tone === 'bad' && 'bg-red-500',
          tone === 'off' && 'bg-ink-4',
        )}
      />
    </span>
  );
}

// ------------------------------------------------------------------ desktop sidebar

function NavItem({ on, icon: Icon, label, count, onClick }: { on: boolean; icon: LucideIcon; label: string; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={on ? 'page' : undefined}
      className={clsx('group relative flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[0.8125rem] transition-colors', on ? 'text-ink' : 'text-ink-2 hover:bg-hover hover:text-ink')}
    >
      {on && <motion.span layoutId="nav-active" transition={spring} className="absolute inset-0 rounded-lg bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-line" />}
      <Icon className={clsx('relative size-4 shrink-0', on ? 'text-accent' : 'text-ink-3 group-hover:text-ink-2')} strokeWidth={1.9} />
      <span className="relative flex-1 truncate text-left font-medium">{label}</span>
      {count !== undefined && count > 0 && <span className="relative text-xs tabular-nums text-ink-4">{count}</span>}
    </button>
  );
}

export function NewDocMenu({ trigger, align = 'start' }: { trigger: (p: { open: boolean; toggle: () => void }) => ReactNode; align?: 'start' | 'end' }) {
  return (
    <Menu
      label="New document"
      align={align}
      trigger={trigger}
      items={DOC_TYPES.map((t) => {
        const Icon = TYPE_ICON[t];
        return { label: DOC_META[t].label, icon: <Icon />, onSelect: () => newDoc(t) };
      })}
    />
  );
}

function Sidebar({ active }: { active: string }) {
  const docs = useDocs();
  const sync = useSync();
  const status = useSyncLabel();
  const counts = Object.fromEntries(DOC_TYPES.map((t) => [t, docs.filter((d) => d.type === t).length])) as Record<DocType, number>;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col px-3 pb-3 pt-4 md:flex">
      <button onClick={() => go('')} className="mb-4 flex items-center px-1.5 text-ink" aria-label="Overview">
        <Logo className="h-[3.25rem] w-auto" />
      </button>

      <div className="mb-4 flex gap-1.5">
        <button
          onClick={openPalette}
          className="flex h-8 flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-[0.8125rem] text-ink-3 shadow-panel transition-colors hover:border-line-strong hover:text-ink-2"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Search</span>
          <Kbd>{MOD_KEY} K</Kbd>
        </button>
        <NewDocMenu
          trigger={({ toggle, open }) => (
            <button
              onClick={toggle}
              aria-expanded={open}
              aria-label="New document"
              className="flex size-8 items-center justify-center rounded-lg bg-ink text-on-ink shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-transform active:scale-95"
            >
              <Plus className={clsx('size-4 transition-transform duration-200', open && 'rotate-45')} />
            </button>
          )}
        />
      </div>

      <nav className="space-y-0.5">
        <NavItem on={active === ''} icon={LayoutGrid} label="Overview" onClick={() => go('')} />
      </nav>
      <p className="eyebrow mb-1.5 mt-5 px-2.5">Documents</p>
      <nav className="space-y-0.5">
        {DOC_TYPES.map((t) => (
          <NavItem key={t} on={active === t} icon={TYPE_ICON[t]} label={DOC_META[t].plural} count={counts[t]} onClick={() => go(t)} />
        ))}
      </nav>

      <div className="mt-auto space-y-0.5">
        <NavItem on={active === 'settings'} icon={Settings2} label="Settings" onClick={() => go('settings')} />
        <button
          onClick={() => go('settings')}
          title={sync.error ?? undefined}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-hover"
        >
          <SyncDot tone={status.tone} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-ink-2">{status.text}</span>
            {sync.user?.email && <span className="block truncate text-[0.6875rem] text-ink-4">{sync.user.email}</span>}
          </span>
        </button>
      </div>
    </aside>
  );
}

// ------------------------------------------------------------------ phone chrome

const TABS: { path: string; label: string; icon: LucideIcon }[] = [
  { path: '', label: 'Home', icon: LayoutGrid },
  { path: 'quotation', label: 'Quotes', icon: FileText },
  { path: 'invoice', label: 'Invoices', icon: Receipt },
  { path: 'delivery', label: 'Delivery', icon: Truck },
  { path: 'statement', label: 'Statements', icon: BookOpenText },
];

function MobileChrome({ active }: { active: string }) {
  const status = useSyncLabel();
  return (
    <>
      <header className="pt-safe sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md md:hidden">
        <div className="flex h-14 items-center gap-1 px-3">
          <button onClick={() => go('')} className="mr-auto text-ink" aria-label="Overview">
            <Logo className="h-10 w-auto" />
          </button>
          <button onClick={openPalette} className="flex size-9 items-center justify-center rounded-lg text-ink-2 active:bg-hover" aria-label="Search">
            <Search className="size-[1.1rem]" />
          </button>
          <button
            onClick={() => go('settings')}
            className={clsx('relative flex size-9 items-center justify-center rounded-lg active:bg-hover', active === 'settings' ? 'text-accent' : 'text-ink-2')}
            aria-label={`Settings · ${status.text}`}
          >
            <Settings2 className="size-[1.1rem]" />
            <span className="absolute right-1.5 top-1.5">
              <SyncDot tone={status.tone} />
            </span>
          </button>
        </div>
      </header>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/92 backdrop-blur-md md:hidden">
        <ul className="mx-auto flex max-w-lg">
          {TABS.map((t) => {
            const on = active === t.path;
            return (
              <li key={t.path} className="flex-1">
                <button
                  onClick={() => go(t.path)}
                  aria-current={on ? 'page' : undefined}
                  className={clsx('relative flex h-14 w-full flex-col items-center justify-center gap-1 transition-colors', on ? 'text-ink' : 'text-ink-3')}
                >
                  {on && <motion.span layoutId="tab-active" transition={spring} className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-accent" />}
                  <t.icon className="size-5" strokeWidth={on ? 2.1 : 1.8} />
                  <span className="text-[0.625rem] font-medium leading-none">{t.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

// ------------------------------------------------------------------ shell

/**
 * Desktop: sidebar on the canvas, page inside an inset surface (Linear's layout).
 * Phone: sticky top bar, page, bottom tab bar within thumb reach.
 */
export function Shell({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <Sidebar active={active} />
      <MobileChrome active={active} />
      <div className="md:py-2 md:pl-60 md:pr-2">
        <main
          id="main"
          className="scroll-thin min-h-[calc(100dvh-3.5rem)] bg-surface pb-28 md:h-[calc(100dvh-1rem)] md:min-h-0 md:overflow-y-auto md:rounded-xl md:border md:border-line md:pb-12 md:shadow-panel"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
