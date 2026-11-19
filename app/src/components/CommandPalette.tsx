import clsx from 'clsx';
import { ArrowRight, CornerDownLeft, LayoutGrid, Plus, Search, Settings2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { fmtDateLong } from '../lib/format';
import { go } from '../lib/router';
import { createDoc, useDocs } from '../lib/store';
import { DOC_META, DOC_TYPES } from '../lib/types';
import { EASE, StatusDot } from './ui';

let setOpenGlobal: ((v: boolean) => void) | null = null;
export const openPalette = () => setOpenGlobal?.(true);

type Item = { id: string; group: string; label: ReactNode; sub?: ReactNode; icon: ReactNode; run: () => void };

/** Ctrl/⌘+K: jump to any document by client, number, heading or item, or create a new one. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const docs = useDocs();
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpenGlobal = setOpen;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      setOpenGlobal = null;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const needle = q.trim().toLowerCase();
    const match = (...v: string[]) => !needle || v.some((s) => s.toLowerCase().includes(needle));
    const create: Item[] = DOC_TYPES.filter((t) => match('new', 'create', DOC_META[t].label)).map((t) => ({
      id: 'new-' + t,
      group: 'Create',
      label: `New ${DOC_META[t].label.toLowerCase()}`,
      icon: <Plus className="size-4" />,
      run: () => go('doc/' + createDoc(t).id),
    }));
    const pages: Item[] = [
      { id: 'p-home', label: 'Overview', icon: <LayoutGrid className="size-4" />, path: '' },
      ...DOC_TYPES.map((t) => ({ id: 'p-' + t, label: DOC_META[t].plural, icon: <ArrowRight className="size-4" />, path: t })),
      { id: 'p-settings', label: 'Settings', icon: <Settings2 className="size-4" />, path: 'settings' },
    ]
      .filter((p) => match(p.label, 'go to'))
      .map((p) => ({ ...p, group: 'Go to', run: () => go(p.path) }));
    const found: Item[] = docs
      .filter((d) => needle && match(d.number, d.data.to, d.data.subject, ...d.data.items.map((i) => i.description)))
      .slice(0, 8)
      .map((d) => ({
        id: d.id,
        group: 'Documents',
        label: (
          <span className="flex items-center gap-2">
            <StatusDot status={d.data.status} />
            <span className="truncate">{d.data.to || 'Untitled recipient'}</span>
          </span>
        ),
        sub: `${d.number} · ${fmtDateLong(d.data.date)}`,
        icon: <span className="font-mono text-[0.625rem] font-medium text-ink-3">{DOC_META[d.type].code}</span>,
        run: () => go('doc/' + d.id),
      }));
    return needle ? [...found, ...create, ...pages] : [...create, ...pages];
  }, [q, docs]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (i: number) => {
    const it = items[i];
    if (!it) return;
    setOpen(false);
    it.run();
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape') setOpen(false);
  };

  let lastGroup = '';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75] flex items-start justify-center px-3 pt-[12vh]">
          <motion.div className="absolute inset-0 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setOpen(false)} />
          <motion.div
            role="dialog"
            aria-label="Search and commands"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ duration: 0.24, ease: EASE }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 shrink-0 text-ink-3" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search documents, or type a command…"
                className="h-12 w-full bg-transparent text-[0.9375rem] text-ink outline-none placeholder:text-ink-4"
              />
            </div>
            <div ref={list} className="scroll-thin max-h-[min(60vh,26rem)] overflow-y-auto p-1.5">
              {items.length === 0 && <p className="px-3 py-8 text-center text-sm text-ink-3">No results for “{q}”.</p>}
              {items.map((it, i) => {
                const header = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                return (
                  <div key={it.id}>
                    {header && <p className="eyebrow px-2.5 pb-1 pt-2.5">{header}</p>}
                    <button
                      data-index={i}
                      onMouseMove={() => setActive(i)}
                      onClick={() => choose(i)}
                      className={clsx('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors', i === active ? 'bg-hover text-ink' : 'text-ink-2')}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-line bg-canvas text-ink-3">{it.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{it.label}</span>
                        {it.sub && <span className="block truncate font-mono text-[0.6875rem] text-ink-3">{it.sub}</span>}
                      </span>
                      {i === active && <CornerDownLeft className="size-3.5 shrink-0 text-ink-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
