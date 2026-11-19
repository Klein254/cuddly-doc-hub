import clsx from 'clsx';
import { ArrowDownUp, ChevronDown, PenLine, Plus, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { newDoc, TYPE_ICON } from '../components/Shell';
import { Button, EmptyState, Menu, PageHeader, StatusChip, StatusDot } from '../components/ui';
import { fmtDateLong, fmtMoney, todayISO, totals } from '../lib/format';
import { go } from '../lib/router';
import { useDocs } from '../lib/store';
import { DOC_META, STATUSES, type DocRecord, type DocStatus, type DocType } from '../lib/types';

// ------------------------------------------------------------------ table

const amountOf = (d: DocRecord) => (d.type === 'delivery' ? null : totals(d.data, d.type).total);

/** Linear-style list: dense rows, mono numbers, status dots, right-aligned amounts. Stacks on phones. */
export function DocTable({ docs, showType, empty }: { docs: DocRecord[]; showType?: boolean; empty: ReactNode }) {
  const cols = showType
    ? 'md:grid-cols-[9rem_minmax(0,1fr)_6.5rem_7.5rem] lg:grid-cols-[9rem_minmax(0,1fr)_7.5rem_6.5rem_7.5rem_8rem]'
    : 'md:grid-cols-[9rem_minmax(0,1fr)_6.5rem_7.5rem_8rem]';
  if (docs.length === 0) return <div className="rounded-xl border border-dashed border-line-strong">{typeof empty === 'string' ? <EmptyState title={empty} /> : empty}</div>;
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className={clsx('hidden h-9 items-center gap-4 border-b border-line bg-canvas/60 px-4 text-xs font-medium text-ink-3 md:grid', cols)}>
        <span>Number</span>
        <span>Client</span>
        {showType && <span className="hidden lg:block">Type</span>}
        <span>Status</span>
        <span className={clsx(showType && 'hidden lg:block')}>Date</span>
        <span className="text-right">Amount</span>
      </div>
      <ul className="divide-y divide-line">
        {docs.map((d, i) => {
          const amt = amountOf(d);
          const signed = Object.keys(d.data.signatures ?? {}).length > 0;
          const Icon = TYPE_ICON[d.type];
          return (
            <motion.li key={d.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(i * 0.025, 0.25), ease: [0.16, 1, 0.3, 1] }}>
              <button onClick={() => go('doc/' + d.id)} className={clsx('group w-full px-4 py-3 text-left transition-colors hover:bg-hover md:grid md:h-12 md:items-center md:gap-4 md:py-0', cols)}>
                {/* desktop cells */}
                <span className="hidden truncate font-mono text-xs text-ink-3 md:block">{d.number}</span>
                <span className="hidden min-w-0 items-center gap-2 md:flex">
                  <span className="truncate text-sm font-medium text-ink">{d.data.to || 'Untitled recipient'}</span>
                  {d.data.subject && <span className="hidden truncate text-[0.8125rem] text-ink-4 lg:inline">{d.data.subject}</span>}
                  {signed && <PenLine className="size-3.5 shrink-0 text-ink-4" aria-label="Signed" />}
                </span>
                {showType && (
                  <span className="hidden items-center gap-1.5 text-[0.8125rem] text-ink-2 lg:flex">
                    <Icon className="size-3.5 text-ink-4" />
                    {DOC_META[d.type].label.replace(' of Accounts', '')}
                  </span>
                )}
                <span className="hidden md:block">
                  <StatusChip status={d.data.status} />
                </span>
                <span className={clsx('hidden text-[0.8125rem] tabular-nums text-ink-3', showType ? 'lg:block' : 'md:block')}>{fmtDateLong(d.data.date)}</span>
                <span className="hidden text-right text-sm font-medium tabular-nums text-ink md:block">
                  {amt === null ? <span className="font-normal text-ink-3">{d.data.items.length} item{d.data.items.length === 1 ? '' : 's'}</span> : fmtMoney(amt)}
                </span>

                {/* phone layout */}
                <span className="flex items-baseline gap-3 md:hidden">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{d.data.to || 'Untitled recipient'}</span>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-ink">{amt === null ? '' : fmtMoney(amt)}</span>
                </span>
                <span className="mt-1 flex items-center gap-2 text-xs text-ink-3 md:hidden">
                  <StatusDot status={d.data.status} />
                  <span className="capitalize">{d.data.status}</span>
                  <span className="text-ink-4">·</span>
                  <span className="truncate font-mono">{d.number}</span>
                  {signed && <PenLine className="size-3 shrink-0 text-ink-4" />}
                  <span className="ml-auto shrink-0">{fmtDateLong(d.data.date)}</span>
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------------ filters

type Period = 'all' | 'month' | 'quarter' | 'year';
type Sort = 'newest' | 'oldest' | 'amount' | 'client';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'month', label: 'This month' },
  { value: 'quarter', label: 'Last 3 months' },
  { value: 'year', label: 'This year' },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'amount', label: 'Highest amount' },
  { value: 'client', label: 'Client A–Z' },
];

function periodStart(p: Period) {
  const today = todayISO();
  if (p === 'month') return today.slice(0, 7) + '-01';
  if (p === 'year') return today.slice(0, 4) + '-01-01';
  if (p === 'quarter') {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return todayISO(d);
  }
  return '';
}

/** One segment of the search pill: a small label over its current value, opening a menu. */
function Segment<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <Menu
      label={label}
      align="start"
      width="w-48"
      items={options.map((o) => ({ label: o.label, checked: o.value === value, onSelect: () => onChange(o.value) }))}
      trigger={({ toggle, open }) => (
        <button type="button" onClick={toggle} aria-expanded={open} className={clsx('flex h-full min-w-[9.5rem] flex-col justify-center rounded-full px-5 text-left transition-colors hover:bg-hover', open && 'bg-hover')}>
          <span className="text-[0.6875rem] font-semibold text-ink">{label}</span>
          <span className="flex items-center gap-1 text-[0.8125rem] capitalize text-ink-3">
            {options.find((o) => o.value === value)?.label}
            <ChevronDown className={clsx('size-3 transition-transform duration-200', open && 'rotate-180')} />
          </span>
        </button>
      )}
    />
  );
}

function Chip({ on, children, onClick }: { on: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'h-8 shrink-0 rounded-full border px-3.5 text-[0.8125rem] font-medium capitalize transition-colors',
        on ? 'border-ink bg-ink text-on-ink' : 'border-line-strong bg-surface text-ink-2 active:bg-hover',
      )}
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------------------ page

export function DocList({ type }: { type: DocType }) {
  const all = useDocs();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<DocStatus | 'all'>('all');
  const [period, setPeriod] = useState<Period>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const input = useRef<HTMLInputElement>(null);
  const meta = DOC_META[type];
  const ofType = useMemo(() => all.filter((d) => d.type === type), [all, type]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const from = periodStart(period);
    const out = ofType.filter(
      (d) =>
        (status === 'all' || d.data.status === status) &&
        (!from || d.data.date >= from) &&
        (!needle || [d.number, d.data.to, d.data.subject, d.data.toAddress, ...d.data.items.map((i) => i.description)].some((v) => v.toLowerCase().includes(needle))),
    );
    if (sort === 'oldest') out.sort((a, b) => a.data.date.localeCompare(b.data.date) || a.created_at.localeCompare(b.created_at));
    else if (sort === 'amount') out.sort((a, b) => (amountOf(b) ?? 0) - (amountOf(a) ?? 0));
    else if (sort === 'client') out.sort((a, b) => a.data.to.localeCompare(b.data.to));
    else out.sort((a, b) => b.data.date.localeCompare(a.data.date) || b.created_at.localeCompare(a.created_at));
    return out;
  }, [ofType, q, status, period, sort]);

  const filtered = !!q || status !== 'all' || period !== 'all';
  const clear = () => {
    setQ('');
    setStatus('all');
    setPeriod('all');
  };
  const total = type === 'delivery' ? null : list.reduce((s, d) => s + (amountOf(d) ?? 0), 0);
  const statusOptions = [{ value: 'all' as const, label: 'Any status' }, ...STATUSES[type].map((s) => ({ value: s, label: s }))];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-10 md:py-10">
      <PageHeader
        eyebrow="Documents"
        title={meta.plural}
        actions={
          <Button variant="primary" onClick={() => newDoc(type)}>
            <Plus className="size-4" /> New {meta.label.toLowerCase()}
          </Button>
        }
      />

      {/* desktop: segmented search pill */}
      <div className="hidden h-16 items-stretch rounded-full border border-line bg-surface p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_16px_-6px_rgba(0,0,0,0.08)] md:flex">
        <label className="flex flex-1 cursor-text flex-col justify-center rounded-full px-5 transition-colors focus-within:bg-hover hover:bg-hover">
          <span className="text-[0.6875rem] font-semibold text-ink">Search</span>
          <input ref={input} className="w-full bg-transparent text-[0.875rem] text-ink outline-none placeholder:text-ink-4" placeholder="Client, number, heading or item" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <span className="my-3 w-px bg-line" />
        <Segment label="Status" value={status} options={statusOptions} onChange={setStatus} />
        <span className="my-3 w-px bg-line" />
        <Segment label="Period" value={period} options={PERIODS} onChange={setPeriod} />
        <button
          onClick={() => (filtered ? clear() : input.current?.focus())}
          aria-label={filtered ? 'Clear filters' : 'Search'}
          className="ml-1.5 flex aspect-square h-full items-center justify-center rounded-full bg-accent text-white transition-transform hover:brightness-105 active:scale-95"
        >
          {filtered ? <X className="size-[1.1rem]" /> : <Search className="size-[1.1rem]" />}
        </button>
      </div>

      {/* phone: search field + chips */}
      <div className="space-y-3 md:hidden">
        <label className="flex h-12 items-center gap-3 rounded-full border border-line bg-surface px-4 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.12)]">
          <Search className="size-4 text-ink-3" />
          <input className="flex-1 bg-transparent text-[0.9375rem] text-ink outline-none placeholder:text-ink-4" placeholder={`Search ${meta.plural.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear search" className="text-ink-4">
              <X className="size-4" />
            </button>
          )}
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {statusOptions.map((o) => (
            <Chip key={o.value} on={status === o.value} onClick={() => setStatus(o.value)}>
              {o.value === 'all' ? 'All' : o.label}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" />
          {PERIODS.slice(1).map((p) => (
            <Chip key={p.value} on={period === p.value} onClick={() => setPeriod(period === p.value ? 'all' : p.value)}>
              {p.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 text-[0.8125rem] text-ink-3">
          <p>
            <span className="font-medium text-ink">{list.length}</span> {list.length === 1 ? meta.label.toLowerCase() : meta.plural.toLowerCase()}
            {total !== null && list.length > 0 && (
              <>
                {' '}
                · <span className="tabular-nums">{fmtMoney(total)}</span> KSH
              </>
            )}
            {filtered && (
              <button onClick={clear} className="ml-2 font-medium text-accent-ink hover:underline">
                Clear filters
              </button>
            )}
          </p>
          <Menu
            label="Sort"
            items={SORTS.map((s) => ({ label: s.label, checked: s.value === sort, onSelect: () => setSort(s.value) }))}
            trigger={({ toggle, open }) => (
              <Button variant="ghost" size="sm" onClick={toggle} aria-expanded={open}>
                <ArrowDownUp className="size-3.5" />
                {SORTS.find((s) => s.value === sort)?.label}
              </Button>
            )}
          />
        </div>
        <DocTable
          docs={list}
          empty={
            filtered ? (
              <EmptyState icon={<Search />} title="No matches" body="Try another name or number, or clear the filters." action={<Button size="sm" onClick={clear}>Clear filters</Button>} />
            ) : (
              <EmptyState
                icon={(() => {
                  const Icon = TYPE_ICON[type];
                  return <Icon />;
                })()}
                title={`No ${meta.plural.toLowerCase()} yet`}
                body={`Create one and it shows up here, on every device.`}
                action={
                  <Button variant="primary" size="sm" onClick={() => newDoc(type)}>
                    <Plus className="size-4" /> New {meta.label.toLowerCase()}
                  </Button>
                }
              />
            )
          }
        />
      </div>
    </div>
  );
}
