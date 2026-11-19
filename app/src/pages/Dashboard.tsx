import clsx from 'clsx';
import { ArrowUpRight, Check, PenLine, X } from 'lucide-react';
import { animate, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { newDoc, TYPE_ICON } from '../components/Shell';
import { EASE, Panel, SectionHeader } from '../components/ui';
import { fmtDateLong, fmtMoney, todayISO, totals } from '../lib/format';
import { go } from '../lib/router';
import { useDocs, useSettings, useSync } from '../lib/store';
import { DEFAULT_SETTINGS, DOC_META, DOC_TYPES, type DocType } from '../lib/types';
import { DocTable } from './DocList';

const BLURB: Record<DocType, string> = {
  quotation: 'Price up goods or work',
  invoice: 'Bill a client',
  delivery: 'Hand over goods, get it signed',
  statement: 'Summarise an account',
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

/** Numbers glide to their new value instead of jumping. */
function CountUp({ value, money }: { value: number; money?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  useEffect(() => {
    const fmt = (n: number) => (money ? fmtMoney(n) : Math.round(n).toLocaleString('en-KE'));
    const c = animate(from.current, value, {
      duration: 0.9,
      ease: EASE,
      onUpdate: (n) => {
        if (ref.current) ref.current.textContent = fmt(n);
      },
    });
    from.current = value;
    return () => c.stop();
  }, [value, money]);
  return <span ref={ref}>{money ? fmtMoney(0) : '0'}</span>;
}

// ------------------------------------------------------------------ getting started

const DISMISS_KEY = 'vdh-getting-started-dismissed';

function GettingStarted() {
  const docs = useDocs();
  const settings = useSettings();
  const sync = useSync();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  const signed = docs.some((d) => Object.keys(d.data.signatures ?? {}).length > 0);
  const steps = [
    { done: settings.updated_at !== DEFAULT_SETTINGS.updated_at, title: 'Check your company details', body: 'Address, phone and payment details printed on every document.', cta: 'Open settings', run: () => go('settings') },
    { done: docs.length > 0, title: 'Create your first document', body: 'Start with a quotation. You can turn it into an invoice later.', cta: 'New quotation', run: () => newDoc('quotation') },
    {
      done: signed,
      title: 'Sign a document in person',
      body: 'Hand over the phone or tablet and let the client sign on screen.',
      cta: docs.length ? 'Open latest' : 'New delivery note',
      run: () => (docs.length ? go('doc/' + docs[0].id) : newDoc('delivery')),
    },
    { done: sync.mode === 'cloud', title: 'Sync across your devices', body: 'Connect Firebase so phones and computers share the same documents.', cta: 'How to connect', run: () => go('settings') },
  ];
  const done = steps.filter((s) => s.done).length;
  if (dismissed || done === steps.length) return null;

  return (
    <Panel className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <SectionHeader title="Get set up" description={`${done} of ${steps.length} done. A few minutes and you're ready to send documents.`} />
        <button
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, '1');
            setDismissed(true);
          }}
          className="-mr-1 -mt-1 flex size-7 items-center justify-center rounded-md text-ink-4 transition-colors hover:bg-hover hover:text-ink-2"
          aria-label="Hide"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mx-5 mt-4 h-1.5 overflow-hidden rounded-full bg-sunken">
        <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${(done / steps.length) * 100}%` }} transition={{ duration: 0.9, ease: EASE, delay: 0.15 }} />
      </div>
      <ol className="mt-4 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className={clsx('flex gap-3 border-line p-5', i > 0 && 'border-t sm:border-t-0', i % 2 === 1 && 'sm:border-l', i >= 2 && 'sm:border-t lg:border-t-0', i > 0 && 'lg:border-l')}>
            <motion.span
              initial={false}
              animate={{ scale: s.done ? [1, 1.18, 1] : 1 }}
              transition={{ duration: 0.4 }}
              className={clsx(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold',
                s.done ? 'bg-emerald-500 text-white' : 'border border-line-strong text-ink-3',
              )}
            >
              {s.done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
            </motion.span>
            <div className="min-w-0">
              <p className={clsx('text-sm font-medium', s.done ? 'text-ink-3 line-through decoration-ink-4' : 'text-ink')}>{s.title}</p>
              <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink-3">{s.body}</p>
              {!s.done && (
                <button onClick={s.run} className="mt-2 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-accent-ink hover:underline">
                  {s.cta} <ArrowUpRight className="size-3.5" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

// ------------------------------------------------------------------ page

export function Dashboard() {
  const docs = useDocs();
  const month = todayISO().slice(0, 7);
  const thisMonth = docs.filter((d) => d.data.date.startsWith(month));
  const sum = (type: DocType, list = thisMonth) => list.filter((d) => d.type === type).reduce((s, d) => s + totals(d.data, d.type).total, 0);
  const unpaid = docs.filter((d) => d.type === 'invoice' && d.data.status !== 'paid').sort((a, b) => a.data.date.localeCompare(b.data.date));
  const toSign = docs.filter((d) => d.type === 'delivery' && d.data.status !== 'delivered' && !d.data.signatures?.receiver);

  const stats = [
    { label: 'Quoted this month', value: sum('quotation'), money: true, note: `${thisMonth.filter((d) => d.type === 'quotation').length} quotations` },
    { label: 'Invoiced this month', value: sum('invoice'), money: true, note: `${thisMonth.filter((d) => d.type === 'invoice').length} invoices` },
    { label: 'Awaiting payment', value: sum('invoice', unpaid), money: true, note: `${unpaid.length} unpaid`, warn: unpaid.length > 0 },
    { label: 'Deliveries this month', value: thisMonth.filter((d) => d.type === 'delivery').length, note: toSign.length ? `${toSign.length} awaiting signature` : 'All signed' },
  ];

  const days = (iso: string) => Math.max(0, Math.round((Date.parse(todayISO()) - Date.parse(iso)) / 86400000));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-10 md:py-10">
      <header>
        <p className="eyebrow mb-2">{fmtDateLong(todayISO())}</p>
        <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink md:text-[2.25rem]">{greeting()}</h1>
      </header>

      <GettingStarted />

      {/* create */}
      <section>
        <p className="eyebrow mb-3">Create</p>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
          {DOC_TYPES.map((t) => {
            const Icon = TYPE_ICON[t];
            return (
              <button key={t} onClick={() => newDoc(t)} className="group flex items-start gap-3 bg-surface p-4 text-left transition-colors hover:bg-hover md:p-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-ink-2 transition-colors group-hover:border-accent/40 group-hover:text-accent">
                  <Icon className="size-[1.05rem]" strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{DOC_META[t].label}</span>
                  <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-3">{BLURB[t]}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* numbers */}
      <section className="grid grid-cols-2 overflow-hidden rounded-xl border border-line lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={clsx('border-line p-4 md:p-5', i % 2 === 1 && 'border-l', i >= 2 && 'border-t lg:border-t-0', i > 0 && 'lg:border-l')}>
            <p className="text-[0.8125rem] text-ink-3">{s.label}</p>
            <p className="mt-2 flex items-baseline gap-1.5 text-xl font-semibold tabular-nums tracking-[-0.02em] text-ink md:text-[1.625rem]">
              <CountUp value={s.value} money={s.money} />
              {s.money && <span className="text-xs font-medium tracking-normal text-ink-4">KSH</span>}
            </p>
            <p className={clsx('mt-1 text-xs', s.warn ? 'text-accent-ink' : 'text-ink-4')}>{s.note}</p>
          </div>
        ))}
      </section>

      <section>
        <p className="eyebrow mb-3">Recent documents</p>
        <DocTable docs={docs.slice(0, 8)} showType empty="Nothing yet. Create your first document above." />
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="contents">
          <div>
            <p className="eyebrow mb-3">Awaiting payment</p>
            <div className="overflow-hidden rounded-xl border border-line">
              {unpaid.length === 0 ? (
                <p className="px-4 py-6 text-[0.8125rem] text-ink-3">No unpaid invoices.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {unpaid.slice(0, 5).map((d) => (
                    <li key={d.id}>
                      <button onClick={() => go('doc/' + d.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{d.data.to || 'Untitled recipient'}</span>
                          <span className="block truncate text-xs text-ink-3">
                            <span className="font-mono">{d.number}</span> · {days(d.data.date)} days
                          </span>
                        </span>
                        <span className="text-sm font-medium tabular-nums text-ink">{fmtMoney(totals(d.data, d.type).total)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {toSign.length > 0 && (
            <div>
              <p className="eyebrow mb-3">To be signed on delivery</p>
              <div className="overflow-hidden rounded-xl border border-line">
                <ul className="divide-y divide-line">
                  {toSign.slice(0, 4).map((d) => (
                    <li key={d.id}>
                      <button onClick={() => go('doc/' + d.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover">
                        <PenLine className="size-4 shrink-0 text-ink-3" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{d.data.to || 'Untitled recipient'}</span>
                          <span className="block truncate font-mono text-xs text-ink-3">{d.number}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
