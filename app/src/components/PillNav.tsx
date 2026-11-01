import clsx from 'clsx';
import { BookOpenText, FileText, LayoutGrid, Receipt, Settings2, Truck, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { go } from '../lib/router';
import { Logo } from './Logo';
import { SyncBadge } from './SyncBadge';

const ITEMS: { path: string; label: string; short: string; icon: LucideIcon }[] = [
  { path: '', label: 'Overview', short: 'Home', icon: LayoutGrid },
  { path: 'quotation', label: 'Quotations', short: 'Quotes', icon: FileText },
  { path: 'invoice', label: 'Invoices', short: 'Invoices', icon: Receipt },
  { path: 'delivery', label: 'Delivery Notes', short: 'Delivery', icon: Truck },
  { path: 'statement', label: 'Statements', short: 'Statements', icon: BookOpenText },
  { path: 'settings', label: 'Settings', short: 'Settings', icon: Settings2 },
];

const spring = { type: 'spring' as const, stiffness: 420, damping: 34 };

/** Floating glass pill: across the top on desktop, along the bottom (thumb reach) on phones. */
export function PillNav({ active }: { active: string }) {
  return (
    <>
      {/* desktop / tablet */}
      <header className="sticky top-0 z-40 hidden px-4 pt-4 md:block">
        <nav className="glass-strong mx-auto flex max-w-6xl items-center gap-2 rounded-full p-1.5 pl-5">
          <button onClick={() => go('')} className="mr-2 shrink-0" aria-label="Overview">
            <Logo className="h-9 w-auto" />
          </button>
          <ul className="flex flex-1 items-center justify-center gap-0.5">
            {ITEMS.map((it) => {
              const on = active === it.path;
              return (
                <li key={it.path}>
                  <button
                    onClick={() => go(it.path)}
                    aria-current={on ? 'page' : undefined}
                    className={clsx('relative flex h-10 items-center gap-2 rounded-full px-3.5 text-sm transition-colors lg:px-4', on ? 'text-[#1a1006]' : 'text-white/60 hover:text-white')}
                  >
                    {on && (
                      <motion.span
                        layoutId="pill-desktop"
                        transition={spring}
                        className="absolute inset-0 rounded-full bg-gradient-to-b from-[#ffbd4a] to-[#f39223] shadow-[0_6px_20px_-6px_rgba(249,165,26,0.75),inset_0_1px_0_rgba(255,255,255,0.45)]"
                      />
                    )}
                    <it.icon className="relative size-4" strokeWidth={on ? 2.2 : 1.8} />
                    <span className={clsx('relative font-medium', !on && 'hidden lg:inline')}>{it.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <SyncBadge />
        </nav>
      </header>

      {/* phone: compact top bar + bottom pill */}
      <header className="sticky top-0 z-40 px-3 pt-[max(0.75rem,var(--safe-area-inset-top,env(safe-area-inset-top)))] md:hidden">
        <div className="glass-strong flex items-center justify-between rounded-full py-1.5 pl-4 pr-1.5">
          <Logo className="h-7 w-auto" />
          <SyncBadge />
        </div>
      </header>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 px-3 md:hidden">
        <ul className="glass-strong mx-auto flex max-w-md items-center justify-between rounded-full p-1.5">
          {ITEMS.map((it) => {
            const on = active === it.path;
            return (
              <li key={it.path} className="flex-1">
                <button
                  onClick={() => go(it.path)}
                  aria-current={on ? 'page' : undefined}
                  aria-label={it.label}
                  className={clsx('relative flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-full transition-colors', on ? 'text-[#1a1006]' : 'text-white/55')}
                >
                  {on && (
                    <motion.span
                      layoutId="pill-mobile"
                      transition={spring}
                      className="absolute inset-0 rounded-full bg-gradient-to-b from-[#ffbd4a] to-[#f39223] shadow-[0_6px_18px_-6px_rgba(249,165,26,0.8)]"
                    />
                  )}
                  <it.icon className="relative size-[1.15rem]" strokeWidth={on ? 2.2 : 1.8} />
                  <span className="relative text-[0.6rem] font-medium leading-none">{it.short}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
