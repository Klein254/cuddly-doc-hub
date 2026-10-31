import clsx from 'clsx';
import { ChevronRight, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, Card, StatusChip } from '../components/ui';
import { fmtDateLong, fmtMoney, totals } from '../lib/format';
import { go } from '../lib/router';
import { createDoc, useDocs } from '../lib/store';
import { DOC_META, STATUSES, type DocRecord, type DocStatus, type DocType } from '../lib/types';

export function DocRow({ doc, showType }: { doc: DocRecord; showType?: boolean }) {
  const t = doc.type === 'delivery' ? null : totals(doc.data, doc.type).total;
  return (
    <li>
      <button onClick={() => go('doc/' + doc.id)} className="group flex w-full items-center gap-4 rounded-2xl px-2 py-3 text-left transition hover:bg-white/[0.04] md:px-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-white">{doc.data.to || 'Untitled recipient'}</span>
            <StatusChip status={doc.data.status} />
          </div>
          <div className="mt-0.5 truncate text-xs text-white/40">
            {showType && <span className="text-amber-200/70">{DOC_META[doc.type].label} · </span>}
            {doc.number} · {fmtDateLong(doc.data.date)}
            {doc.data.subject && <span className="hidden sm:inline"> · {doc.data.subject}</span>}
          </div>
        </div>
        {t !== null && (
          <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-white/90">
            {fmtMoney(t)}
            <span className="ml-1 text-[0.65rem] font-medium text-white/35">KSH</span>
          </span>
        )}
        {doc.type === 'delivery' && <span className="shrink-0 text-xs text-white/40">{doc.data.items.length} item{doc.data.items.length === 1 ? '' : 's'}</span>}
        <ChevronRight className="size-4 shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-white/60" />
      </button>
    </li>
  );
}

export function DocList({ type }: { type: DocType }) {
  const all = useDocs();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<DocStatus | 'all'>('all');
  const meta = DOC_META[type];

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter(
      (d) =>
        d.type === type &&
        (status === 'all' || d.data.status === status) &&
        (!needle || [d.number, d.data.to, d.data.subject, ...d.data.items.map((i) => i.description)].some((v) => v.toLowerCase().includes(needle))),
    );
  }, [all, type, q, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <p className="font-brand text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-300/80">Documents</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-white">{meta.plural}</h1>
        </div>
        <Button variant="primary" onClick={() => go('doc/' + createDoc(type).id)}>
          <Plus className="size-4" /> New {meta.label}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <input className="field rounded-full! pl-11" placeholder="Search client, number, item…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="glass flex gap-1 overflow-x-auto rounded-full p-1">
          {(['all', ...STATUSES[type]] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={clsx('h-8 rounded-full px-3.5 text-xs font-medium capitalize transition', status === s ? 'bg-white/90 text-black' : 'text-white/55 hover:text-white')}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-2 md:p-3">
        {list.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-white/45">{q || status !== 'all' ? 'No matches.' : `No ${meta.plural.toLowerCase()} yet.`}</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {list.map((d) => (
              <DocRow key={d.id} doc={d} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
