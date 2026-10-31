import { BookOpenText, FileText, Plus, Receipt, Truck, type LucideIcon } from 'lucide-react';
import { fmtDateLong, fmtMoney, totals } from '../lib/format';
import { go } from '../lib/router';
import { createDoc, useDocs } from '../lib/store';
import { DOC_META, type DocType } from '../lib/types';
import { Card, CardTitle } from '../components/ui';
import { DocRow } from './DocList';

const CREATE: { type: DocType; icon: LucideIcon; blurb: string }[] = [
  { type: 'quotation', icon: FileText, blurb: 'Price up goods or work' },
  { type: 'invoice', icon: Receipt, blurb: 'Bill a client' },
  { type: 'delivery', icon: Truck, blurb: 'Goods handed over' },
  { type: 'statement', icon: BookOpenText, blurb: 'Account summary' },
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export function Dashboard() {
  const docs = useDocs();
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = docs.filter((d) => d.data.date.startsWith(month));
  const sum = (type: DocType, list = thisMonth) => list.filter((d) => d.type === type).reduce((s, d) => s + totals(d.data, d.type).total, 0);
  const unpaid = docs.filter((d) => d.type === 'invoice' && d.data.status !== 'paid');

  const stats = [
    { label: 'Quoted this month', value: sum('quotation'), money: true },
    { label: 'Invoiced this month', value: sum('invoice'), money: true },
    { label: 'Awaiting payment', value: sum('invoice', unpaid), money: true, note: `${unpaid.length} invoice${unpaid.length === 1 ? '' : 's'}` },
    { label: 'Deliveries this month', value: thisMonth.filter((d) => d.type === 'delivery').length, money: false },
  ];

  const create = (type: DocType) => go('doc/' + createDoc(type).id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <p className="text-sm text-white/45">{fmtDateLong(new Date().toISOString().slice(0, 10))}</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">{greeting()}.</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CREATE.map((c) => (
          <button
            key={c.type}
            onClick={() => create(c.type)}
            className="glass group relative overflow-hidden rounded-3xl p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300/25 md:p-5"
          >
            <span className="absolute -right-10 -top-10 size-32 rounded-full bg-amber-400/10 blur-2xl transition group-hover:bg-amber-400/20" />
            <span className="relative flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-amber-300">
              <c.icon className="size-5" strokeWidth={1.8} />
            </span>
            <span className="relative mt-5 flex items-center gap-1.5 text-[0.95rem] font-semibold text-white">
              <Plus className="size-4 text-amber-300" /> {DOC_META[c.type].label}
            </span>
            <span className="relative mt-0.5 block text-xs text-white/45">{c.blurb}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 md:p-5">
            <p className="text-xs text-white/45">{s.label}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-white md:text-2xl">
              {s.money ? fmtMoney(s.value) : s.value}
              {s.money && <span className="ml-1 text-xs font-medium text-white/40">KSH</span>}
            </p>
            {s.note && <p className="mt-1 text-xs text-amber-200/70">{s.note}</p>}
          </Card>
        ))}
      </div>

      <Card className="p-3 md:p-5">
        <div className="px-2 pt-1 md:px-0 md:pt-0">
          <CardTitle>Recent documents</CardTitle>
        </div>
        {docs.length === 0 ? (
          <p className="px-2 pb-6 text-sm text-white/45">Nothing yet. Create your first document above.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {docs.slice(0, 8).map((d) => (
              <DocRow key={d.id} doc={d} showType />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
