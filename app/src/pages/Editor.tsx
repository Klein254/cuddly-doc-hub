import clsx from 'clsx';
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Download, FileInput, Loader2, MoreHorizontal, Plus, Share2, Trash2, Truck, Receipt } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PdfPreview } from '../components/PdfPreview';
import { Button, Card, CardTitle, Label, NumberInput, Toggle, toast } from '../components/ui';
import { fileName, fmtDateOrdinal, fmtMoney, rowTotal, totals, uid } from '../lib/format';
import { canShareFiles, renderPdf, savePdf, sharePdf } from '../lib/pdf';
import { back, go } from '../lib/router';
import { convertDoc, createDoc, deleteDoc, isSeqTaken, setSeq, updateData, useDoc, useDocs, useSettings, useSync } from '../lib/store';
import { DOC_META, STATUSES, type DocData, type DocRecord, type DocType, type LineItem, type StatementRow } from '../lib/types';

export function Editor({ id }: { id: string }) {
  const doc = useDoc(id);
  const settings = useSettings();
  const sync = useSync();
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const renderId = useRef(0);

  // Re-render the preview shortly after typing stops; ignore results from older renders.
  useEffect(() => {
    if (!doc) return;
    const n = ++renderId.current;
    const t = setTimeout(
      () =>
        renderPdf(doc, settings)
          .then((b) => n === renderId.current && setBlob(b))
          .catch((e) => toast('Preview failed: ' + (e as Error).message)),
      blob ? 450 : 0,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, settings]);

  if (!doc) {
    return (
      <div className="py-24 text-center text-white/50">
        {sync.ready ? 'This document was deleted or does not exist.' : 'Loading…'}
        <div className="mt-4">
          <Button onClick={() => go('')}>Back to overview</Button>
        </div>
      </div>
    );
  }

  const meta = DOC_META[doc.type];
  const set = (patch: Partial<DocData>) => updateData(doc.id, patch);

  // Always build from the latest edits rather than reusing the (debounced) preview.
  const freshBlob = () => renderPdf(doc, settings);

  const onSave = async () => {
    setBusy('save');
    try {
      const r = await savePdf(await freshBlob(), fileName(doc));
      if (r !== 'cancelled') toast(r === 'saved' ? 'PDF saved' : 'PDF downloaded');
    } catch (e) {
      toast('Could not create the PDF: ' + (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const onShare = async () => {
    setBusy('share');
    try {
      await sharePdf(await freshBlob(), fileName(doc), `${meta.label} ${doc.number}`);
    } catch (e) {
      toast('Sharing failed: ' + (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* toolbar */}
      <div className="glass-strong sticky top-[4.6rem] z-30 flex flex-wrap items-center gap-2 rounded-[1.75rem] p-2 md:top-[5.6rem]">
        <Button variant="quiet" size="icon" onClick={() => back(doc.type)} aria-label="Back">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{doc.data.to || meta.label}</p>
          <p className="truncate font-brand text-[0.62rem] font-semibold tracking-[0.14em] text-white/40">{doc.number}</p>
        </div>
        {canShareFiles() && (
          <Button size="sm" onClick={onShare} disabled={!!busy} className="h-9">
            {busy === 'share' ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
            <span className="hidden sm:inline">Share</span>
          </Button>
        )}
        <Button variant="primary" size="sm" onClick={onSave} disabled={!!busy} className="h-9">
          {busy === 'save' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Save PDF
        </Button>
        <MoreMenu doc={doc} />
      </div>

      {/* phone: edit / preview switch */}
      <div className="glass mx-auto flex w-fit rounded-full p-1 lg:hidden">
        {(['edit', 'preview'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={clsx('h-9 rounded-full px-6 text-sm font-medium capitalize transition', tab === t ? 'bg-white/90 text-black' : 'text-white/60')}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className={clsx('space-y-5', tab === 'preview' && 'hidden lg:block')}>
          <DetailsCard doc={doc} set={set} />
          {doc.type === 'statement' ? <StatementCard doc={doc} set={set} /> : <ItemsCard doc={doc} set={set} />}
          <FinishCard doc={doc} set={set} />
        </div>
        <div className={clsx(tab === 'edit' && 'hidden lg:block')}>
          <div className="lg:sticky lg:top-[11rem]">
            <div className="glass max-h-none rounded-3xl p-3 md:p-5 lg:max-h-[calc(100dvh-12.5rem)] lg:overflow-y-auto scroll-thin">
              <PdfPreview blob={blob} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ toolbar menu

function MoreMenu({ doc }: { doc: DocRecord }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const convert = (type: DocType) => {
    const d = convertDoc(doc.id, type);
    if (d) {
      toast(`${DOC_META[type].label} ${d.number} created`);
      go('doc/' + d.id);
    }
  };
  const actions: { label: string; icon: typeof Copy; run: () => void; danger?: boolean }[] = [
    ...(doc.type === 'quotation' ? [{ label: 'Turn into invoice', icon: Receipt, run: () => convert('invoice') }] : []),
    ...(doc.type === 'quotation' || doc.type === 'invoice' ? [{ label: 'Make delivery note', icon: Truck, run: () => convert('delivery') }] : []),
    {
      label: 'Duplicate',
      icon: Copy,
      run: () => {
        const d = createDoc(doc.type, { ...doc.data, status: 'draft', items: doc.data.items.map((i) => ({ ...i, id: uid() })), rows: doc.data.rows.map((r) => ({ ...r, id: uid() })) });
        go('doc/' + d.id);
      },
    },
    {
      label: 'Delete',
      icon: Trash2,
      danger: true,
      run: () => {
        if (confirm(`Delete ${doc.number}? This removes it on every device.`)) {
          deleteDoc(doc.id);
          go(doc.type);
        }
      },
    },
  ];

  return (
    <div ref={ref} className="relative">
      <Button variant="quiet" size="icon" onClick={() => setOpen((o) => !o)} aria-label="More actions" aria-expanded={open}>
        <MoreHorizontal className="size-4" />
      </Button>
      {open && (
        <div className="glass-strong absolute right-0 top-11 z-50 w-56 rounded-2xl p-1.5">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => {
                setOpen(false);
                a.run();
              }}
              className={clsx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-white/[0.07]', a.danger ? 'text-red-300' : 'text-white/85')}
            >
              <a.icon className="size-4 opacity-70" /> {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ form sections

type SectionProps = { doc: DocRecord; set: (p: Partial<DocData>) => void };

function DetailsCard({ doc, set }: SectionProps) {
  const docs = useDocs();
  const pad = (n: number) => String(n).padStart(4, '0');
  const [seqText, setSeqText] = useState(pad(doc.seq));
  useEffect(() => setSeqText(pad(doc.seq)), [doc.seq]);
  const seqNum = parseInt(seqText, 10);
  const taken = Number.isInteger(seqNum) && seqNum !== doc.seq && isSeqTaken(doc, seqNum);
  const prefix = doc.number.slice(0, doc.number.lastIndexOf('/') + 1);

  // Past recipients, newest first, with the address they were last used with.
  const clients = useMemo(() => {
    const seen = new Map<string, string>();
    docs.forEach((d) => {
      const name = d.data.to.trim();
      if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
    });
    return [...seen.values()];
  }, [docs]);

  const pickClient = (to: string) => {
    const prev = docs.find((d) => d.id !== doc.id && d.data.to.trim().toLowerCase() === to.trim().toLowerCase() && d.data.toAddress);
    set(prev && !doc.data.toAddress ? { to, toAddress: prev.data.toAddress } : { to });
  };

  return (
    <Card className="p-4 md:p-6">
      <CardTitle action={<StatusPicker doc={doc} set={set} />}>{DOC_META[doc.type].label} details</CardTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <Label hint={taken ? <span className="text-red-300">Already used</span> : undefined}>Number</Label>
          <div className="field flex items-center gap-1 p-0! pl-3.5!">
            <span className="shrink-0 text-sm text-white/35">{prefix}</span>
            <input
              inputMode="numeric"
              className="w-full bg-transparent py-2.5 pr-3 text-sm tabular-nums outline-none"
              value={seqText}
              onChange={(e) => setSeqText(e.target.value.replace(/\D/g, ''))}
              onBlur={() => {
                if (Number.isInteger(seqNum) && seqNum > 0 && !taken) {
                  setSeq(doc.id, seqNum);
                  setSeqText(pad(seqNum));
                }
                else setSeqText(pad(doc.seq));
              }}
            />
          </div>
        </label>
        <label>
          <Label>{doc.type === 'statement' ? 'As at' : 'Date'}</Label>
          <input
            type="date"
            className="field"
            value={doc.data.date}
            onChange={(e) => {
              const date = e.target.value;
              // Keep an auto-written statement heading in step with the date.
              const auto = doc.type === 'statement' && (!doc.data.subject || doc.data.subject === statementSubject(doc.data.to, doc.data.date));
              set(auto ? { date, subject: statementSubject(doc.data.to, date) } : { date });
            }}
          />
        </label>
        <label className="sm:col-span-2">
          <Label>{DOC_META[doc.type].recipientLabel}</Label>
          <input className="field" list="clients" placeholder="Client or company name" value={doc.data.to} onChange={(e) => pickClient(e.target.value)} />
          <datalist id="clients">
            {clients.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="sm:col-span-2">
          <Label hint="optional">Address</Label>
          <textarea className="field min-h-[2.75rem] [field-sizing:content]" rows={2} placeholder={'P.O. Box 30270-00100\nNairobi'} value={doc.data.toAddress} onChange={(e) => set({ toAddress: e.target.value })} />
        </label>
        <label className="sm:col-span-2">
          <Label>Heading</Label>
          <input
            className="field"
            placeholder={doc.type === 'statement' ? statementSubject(doc.data.to, doc.data.date) : `e.g. ${doc.type === 'delivery' ? 'ARABIAN SHOWER DELIVERY NOTE' : 'QUOTATION FOR POWER CONSUMABLES'}`}
            value={doc.data.subject}
            onChange={(e) => set({ subject: e.target.value })}
          />
        </label>
      </div>
    </Card>
  );
}

const statementSubject = (to: string, date: string) => {
  const initials = to
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w) && !/^(of|the|and|&)$/i.test(w))
    .map((w) => w[0].toUpperCase())
    .join('');
  return `${initials ? initials + ' ' : ''}STATEMENT OF ACCOUNTS AS ON ${fmtDateOrdinal(date)}`;
};

function StatusPicker({ doc, set }: SectionProps) {
  return (
    <div className="flex gap-0.5 rounded-full border border-white/10 bg-white/[0.03] p-0.5">
      {STATUSES[doc.type].map((s) => (
        <button
          key={s}
          onClick={() => set({ status: s })}
          className={clsx('h-7 rounded-full px-3 text-[0.7rem] font-medium capitalize transition', doc.data.status === s ? 'bg-amber-300 text-black' : 'text-white/50 hover:text-white')}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function ItemsCard({ doc, set }: SectionProps) {
  const priced = doc.type !== 'delivery';
  const items = doc.data.items;
  const t = totals(doc.data, doc.type);
  const update = (id: string, patch: Partial<LineItem>) => set({ items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    set({ items: next });
  };

  return (
    <Card className="p-4 md:p-6">
      <CardTitle>Items</CardTitle>
      <ul className="space-y-3">
        {items.map((it, idx) => (
          <li key={it.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3">
            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
              <label>
                <Label>Qty</Label>
                <NumberInput value={it.qty} onChange={(qty) => update(it.id, { qty })} className="text-center" />
              </label>
              <label>
                <Label>Description</Label>
                <textarea
                  className="field min-h-[2.75rem] [field-sizing:content]"
                  rows={1}
                  placeholder="Item, model, specification…"
                  value={it.description}
                  onChange={(e) => update(it.id, { description: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              {priced && (
                <label className="w-40">
                  <Label>Unit price (KSH)</Label>
                  <NumberInput value={it.unitPrice} onChange={(unitPrice) => update(it.id, { unitPrice })} />
                </label>
              )}
              {priced && (
                <div className="pb-2.5">
                  <span className="block text-[0.72rem] text-white/40">Amount</span>
                  <span className="text-sm font-semibold tabular-nums text-white">{fmtMoney(it.qty * it.unitPrice)}</span>
                </div>
              )}
              <div className="ml-auto flex gap-1">
                <Button variant="quiet" size="icon" disabled={idx === 0} onClick={() => move(idx, -1)} aria-label="Move up">
                  <ArrowUp className="size-4" />
                </Button>
                <Button variant="quiet" size="icon" disabled={idx === items.length - 1} onClick={() => move(idx, 1)} aria-label="Move down">
                  <ArrowDown className="size-4" />
                </Button>
                <Button variant="quiet" size="icon" className="hover:text-red-300" onClick={() => set({ items: items.filter((i) => i.id !== it.id) })} aria-label="Remove item">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Button className="mt-3 w-full border-dashed" onClick={() => set({ items: [...items, { id: uid(), qty: 1, description: '', unitPrice: 0 }] })}>
        <Plus className="size-4" /> Add item
      </Button>

      {priced && (
        <div className="mt-5 space-y-3 border-t border-white/[0.07] pt-5">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Toggle checked={doc.data.vatEnabled} onChange={(vatEnabled) => set({ vatEnabled })} label="Charge VAT" />
            </div>
            {doc.data.vatEnabled && (
              <label className="flex items-center gap-2 text-sm text-white/50">
                <NumberInput value={doc.data.vatRate} onChange={(vatRate) => set({ vatRate })} className="w-16 py-1.5! text-center" aria-label="VAT rate" />%
              </label>
            )}
          </div>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between text-white/50">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{fmtMoney(t.subtotal)} KSH</dd>
            </div>
            {doc.data.vatEnabled && (
              <div className="flex justify-between text-white/50">
                <dt>VAT ({doc.data.vatRate}%)</dt>
                <dd className="tabular-nums">{fmtMoney(t.vat)} KSH</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between pt-1">
              <dt className="font-display text-lg text-white">Total due</dt>
              <dd className="text-lg font-semibold tabular-nums text-amber-300">{fmtMoney(t.total)} KSH</dd>
            </div>
          </dl>
        </div>
      )}
    </Card>
  );
}

function StatementCard({ doc, set }: SectionProps) {
  const docs = useDocs();
  const settings = useSettings();
  const rows = doc.data.rows;
  const t = totals(doc.data, 'statement');
  const update = (id: string, patch: Partial<StatementRow>) => set({ rows: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const norm = (s: string) => s.trim().toLowerCase();
  const unpaid = docs.filter((d) => d.type === 'invoice' && d.data.status !== 'paid' && doc.data.to && norm(d.data.to) === norm(doc.data.to) && !rows.some((r) => r.invoiceNo === d.number));

  const importInvoices = () => {
    const added = unpaid
      .slice()
      .sort((a, b) => a.data.date.localeCompare(b.data.date))
      .map((inv) => {
        const it = totals(inv.data, 'invoice');
        return { id: uid(), date: inv.data.date, lpo: '', invoiceNo: inv.number, deliveryNo: '', amount: it.subtotal, vat: it.vat };
      });
    set({ rows: [...rows, ...added] });
    toast(`Added ${added.length} invoice${added.length === 1 ? '' : 's'}`);
  };

  return (
    <Card className="p-4 md:p-6">
      <CardTitle
        action={
          unpaid.length > 0 && (
            <Button size="sm" onClick={importInvoices}>
              <FileInput className="size-3.5" /> Add {unpaid.length} unpaid invoice{unpaid.length === 1 ? '' : 's'}
            </Button>
          )
        }
      >
        Statement lines
      </CardTitle>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="col-span-2 sm:col-span-1">
                <Label>Date</Label>
                <input type="date" className="field" value={r.date} onChange={(e) => update(r.id, { date: e.target.value })} />
              </label>
              <label>
                <Label>LPO No.</Label>
                <input className="field" value={r.lpo} onChange={(e) => update(r.id, { lpo: e.target.value })} />
              </label>
              <label>
                <Label>Invoice No.</Label>
                <input className="field" value={r.invoiceNo} onChange={(e) => update(r.id, { invoiceNo: e.target.value })} />
              </label>
              <label>
                <Label>Delivery No.</Label>
                <input className="field" value={r.deliveryNo} onChange={(e) => update(r.id, { deliveryNo: e.target.value })} />
              </label>
              <label>
                <Label>Amount</Label>
                <NumberInput value={r.amount} onChange={(amount) => update(r.id, { amount })} />
              </label>
              <label>
                <Label hint={<button type="button" className="text-amber-300/80 hover:text-amber-200" onClick={() => update(r.id, { vat: Math.round(r.amount * settings.vatRate) / 100 })}>{settings.vatRate}%</button>}>VAT</Label>
                <NumberInput value={r.vat} onChange={(vat) => update(r.id, { vat })} />
              </label>
              <div className="flex items-end justify-between gap-2 sm:col-span-1">
                <div className="pb-2.5">
                  <span className="block text-[0.72rem] text-white/40">Total</span>
                  <span className="text-sm font-semibold tabular-nums">{fmtMoney(rowTotal(r))}</span>
                </div>
                <Button variant="quiet" size="icon" className="mb-0.5 hover:text-red-300" onClick={() => set({ rows: rows.filter((x) => x.id !== r.id) })} aria-label="Remove line">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Button className="mt-3 w-full border-dashed" onClick={() => set({ rows: [...rows, { id: uid(), date: doc.data.date, lpo: '', invoiceNo: '', deliveryNo: '', amount: 0, vat: 0 }] })}>
        <Plus className="size-4" /> Add line
      </Button>
      <div className="mt-5 flex items-baseline justify-between border-t border-white/[0.07] pt-4">
        <span className="font-display text-lg">Balance due</span>
        <span className="text-lg font-semibold tabular-nums text-amber-300">{fmtMoney(t.total)} KSH</span>
      </div>
    </Card>
  );
}

function FinishCard({ doc, set }: SectionProps) {
  return (
    <Card className="p-4 md:p-6">
      <CardTitle>Notes &amp; signature</CardTitle>
      <div className="space-y-4">
        {doc.type !== 'statement' && (
          <label className="block">
            <Label>Footer note</Label>
            <textarea className="field min-h-[4.5rem] [field-sizing:content]" rows={3} value={doc.data.notes} onChange={(e) => set({ notes: e.target.value })} />
          </label>
        )}
        <label className="block">
          <Label hint="printed above the signature line">Authorized name</Label>
          <input className="field" placeholder="Leave blank to sign by hand" value={doc.data.authorizedName} onChange={(e) => set({ authorizedName: e.target.value })} />
        </label>
        <Toggle checked={doc.data.includeCover} onChange={(includeCover) => set({ includeCover })} label="Include cover page" />
      </div>
    </Card>
  );
}
