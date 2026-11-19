import clsx from 'clsx';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileInput,
  Loader2,
  MoreHorizontal,
  PenLine,
  Plus,
  Receipt,
  RotateCcw,
  Share2,
  Trash2,
  Truck,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PdfPreview } from '../components/PdfPreview';
import { SignatureDialog, SignatureView } from '../components/SignaturePad';
import { Button, EASE, Label, Menu, NumberInput, Segmented, SectionHeader, StatusDot, Toggle, toast } from '../components/ui';
import { contentHash, fileName, fmtDateOrdinal, fmtDateTime, fmtMoney, rowTotal, totals, uid } from '../lib/format';
import { canShareFiles, renderPdf, savePdf, sharePdf } from '../lib/pdf';
import { back, go } from '../lib/router';
import { convertDoc, createDoc, deleteDoc, isSeqTaken, setSeq, updateData, useDoc, useDocs, useSettings, useSync } from '../lib/store';
import {
  DOC_META,
  SIGNATURE_META,
  SIGNATURE_ROLES,
  STATUSES,
  type DocData,
  type DocRecord,
  type DocType,
  type LineItem,
  type Signature,
  type SignatureRole,
  type StatementRow,
} from '../lib/types';

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
      <div className="px-6 py-24 text-center">
        <p className="text-sm text-ink-3">{sync.ready ? 'This document was deleted or does not exist.' : 'Loading…'}</p>
        <Button className="mt-4" onClick={() => go('')}>
          Back to overview
        </Button>
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
      const msg = await savePdf(await freshBlob(), fileName(doc));
      if (msg) toast(msg);
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

  const saving = sync.mode === 'cloud' && (sync.phase === 'syncing' || sync.pending > 0);

  return (
    <div>
      {/* top bar */}
      <div className="sticky top-[calc(3.5rem+var(--safe-area-inset-top,env(safe-area-inset-top)))] z-20 border-b border-line bg-surface/90 backdrop-blur-md md:top-0 md:rounded-t-xl">
        <div className="flex h-14 items-center gap-2 px-3 md:px-5">
          <Button variant="ghost" size="icon-sm" onClick={() => back(doc.type)} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Button>
          <nav className="flex min-w-0 items-center gap-1.5 text-[0.8125rem]">
            <button onClick={() => go(doc.type)} className="hidden shrink-0 text-ink-3 transition-colors hover:text-ink sm:block">
              {meta.plural}
            </button>
            <span className="hidden text-ink-4 sm:block">/</span>
            <span className="truncate font-mono text-xs font-medium text-ink">{doc.number}</span>
          </nav>
          <StatusMenu doc={doc} set={set} />
          <span className="ml-auto hidden items-center gap-1.5 text-xs text-ink-4 lg:flex">
            {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            {saving ? 'Saving…' : 'Saved'}
          </span>
          <div className="ml-auto flex items-center gap-1.5 lg:ml-2">
            {canShareFiles() && (
              <Button size="sm" onClick={onShare} disabled={!!busy}>
                {busy === 'share' ? <Loader2 className="size-3.5 animate-spin" /> : <Share2 className="size-3.5" />}
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={onSave} disabled={!!busy}>
              {busy === 'save' ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <MoreMenu doc={doc} />
          </div>
        </div>
      </div>

      {/* phone / tablet: edit or preview */}
      <div className="flex justify-center border-b border-line py-2.5 lg:hidden">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'edit', label: 'Edit' },
            { value: 'preview', label: 'Preview' },
          ]}
        />
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className={clsx('mx-auto w-full max-w-3xl space-y-5 px-4 py-6 md:px-8', tab === 'preview' && 'hidden lg:block')}>
          <div>
            <p className="eyebrow mb-1.5">{meta.label}</p>
            <h1 className="truncate text-2xl font-semibold tracking-[-0.025em] text-ink">{doc.data.to || <span className="text-ink-4">Untitled recipient</span>}</h1>
          </div>
          <DetailsSection doc={doc} set={set} />
          {doc.type === 'statement' ? <StatementSection doc={doc} set={set} /> : <ItemsSection doc={doc} set={set} />}
          <SignaturesSection doc={doc} />
          <FinishSection doc={doc} set={set} />
        </div>
        <div className={clsx('border-line bg-sunken lg:border-l', tab === 'edit' && 'hidden lg:block')}>
          <div className="scroll-thin px-4 py-6 md:px-8 lg:sticky lg:top-14 lg:h-[calc(100dvh-1rem-3.5rem-2px)] lg:overflow-y-auto">
            <PdfPreview blob={blob} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ top bar menus

function StatusMenu({ doc, set }: SectionProps) {
  return (
    <Menu
      label="Status"
      align="start"
      width="w-44"
      items={STATUSES[doc.type].map((s) => ({
        label: <span className="capitalize">{s}</span>,
        icon: <StatusDot status={s} />,
        checked: doc.data.status === s,
        onSelect: () => set({ status: s }),
      }))}
      trigger={({ toggle, open }) => (
        <button
          onClick={toggle}
          aria-expanded={open}
          className="flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-xs font-medium capitalize text-ink-2 transition-colors hover:bg-hover"
        >
          <StatusDot status={doc.data.status} />
          {doc.data.status}
          <ChevronDown className={clsx('size-3 text-ink-4 transition-transform duration-200', open && 'rotate-180')} />
        </button>
      )}
    />
  );
}

function MoreMenu({ doc }: { doc: DocRecord }) {
  const convert = (type: DocType) => {
    const d = convertDoc(doc.id, type);
    if (d) {
      toast(`${DOC_META[type].label} ${d.number} created`);
      go('doc/' + d.id);
    }
  };
  return (
    <Menu
      label="More actions"
      items={[
        ...(doc.type === 'quotation' ? [{ label: 'Turn into invoice', icon: <Receipt />, onSelect: () => convert('invoice') }] : []),
        ...(doc.type === 'quotation' || doc.type === 'invoice' ? [{ label: 'Make delivery note', icon: <Truck />, onSelect: () => convert('delivery') }] : []),
        {
          label: 'Duplicate',
          icon: <Copy />,
          onSelect: () => {
            const d = createDoc(doc.type, {
              ...doc.data,
              status: 'draft',
              signatures: {},
              items: doc.data.items.map((i) => ({ ...i, id: uid() })),
              rows: doc.data.rows.map((r) => ({ ...r, id: uid() })),
            });
            go('doc/' + d.id);
          },
        },
        'divider',
        {
          label: 'Delete',
          icon: <Trash2 />,
          danger: true,
          onSelect: () => {
            if (confirm(`Delete ${doc.number}? This removes it on every device.`)) {
              deleteDoc(doc.id);
              go(doc.type);
            }
          },
        },
      ]}
      trigger={({ toggle, open }) => (
        <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label="More actions" aria-expanded={open}>
          <MoreHorizontal className="size-4" />
        </Button>
      )}
    />
  );
}

// ------------------------------------------------------------------ sections

type SectionProps = { doc: DocRecord; set: (p: Partial<DocData>) => void };

function Section({ title, description, action, children }: { title: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel p-4 md:p-5">
      <SectionHeader title={title} description={description} action={action} className="mb-4" />
      {children}
    </section>
  );
}

function DetailsSection({ doc, set }: SectionProps) {
  const docs = useDocs();
  const pad = (n: number) => String(n).padStart(4, '0');
  const [seqText, setSeqText] = useState(pad(doc.seq));
  useEffect(() => setSeqText(pad(doc.seq)), [doc.seq]);
  const seqNum = parseInt(seqText, 10);
  const taken = Number.isInteger(seqNum) && seqNum !== doc.seq && isSeqTaken(doc, seqNum);
  const prefix = doc.number.slice(0, doc.number.lastIndexOf('/') + 1);

  // Past recipients, newest first.
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
    <Section title="Details" description="Who it's for and when.">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <Label hint={taken ? <span className="text-red-600 dark:text-red-400">Already used</span> : undefined}>Number</Label>
          <div className="field flex items-center gap-0.5 p-0! pl-2.5!">
            <span className="shrink-0 font-mono text-xs text-ink-4">{prefix}</span>
            <input
              inputMode="numeric"
              className="w-full bg-transparent py-1.5 pr-2.5 font-mono text-xs tabular-nums text-ink outline-none"
              value={seqText}
              onChange={(e) => setSeqText(e.target.value.replace(/\D/g, ''))}
              onBlur={() => {
                if (Number.isInteger(seqNum) && seqNum > 0 && !taken) {
                  setSeq(doc.id, seqNum);
                  setSeqText(pad(seqNum));
                } else setSeqText(pad(doc.seq));
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
          <Label hint="Optional">Address</Label>
          <textarea className="field min-h-[3.5rem] [field-sizing:content]" rows={2} placeholder={'P.O. Box 30270-00100\nNairobi'} value={doc.data.toAddress} onChange={(e) => set({ toAddress: e.target.value })} />
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
    </Section>
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

function ItemsSection({ doc, set }: SectionProps) {
  const priced = doc.type !== 'delivery';
  const items = doc.data.items;
  const t = totals(doc.data, doc.type);
  const update = (id: string, patch: Partial<LineItem>) => set({ items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    set({ items: next });
  };
  // Table layout when the form column is wide enough (container query), stacked rows otherwise.
  const grid = priced
    ? 'grid-cols-[4rem_minmax(0,1fr)_auto] @xl:grid-cols-[4.5rem_minmax(0,1fr)_7.5rem_6.5rem_auto]'
    : 'grid-cols-[4rem_minmax(0,1fr)_auto] @xl:grid-cols-[4.5rem_minmax(0,1fr)_auto]';

  return (
    <Section title="Items" description={`${items.length} line${items.length === 1 ? '' : 's'}`}>
      <div className="@container">
      <div className={clsx('mb-1.5 hidden gap-2 px-0.5 text-xs font-medium text-ink-3 @xl:grid', grid)}>
        <span className="text-center">Qty</span>
        <span>Description</span>
        {priced && <span className="text-right">Unit price</span>}
        {priced && <span className="text-right">Amount</span>}
        <span className="w-7" />
      </div>
      <ul className="divide-y divide-line border-y border-line">
        <AnimatePresence initial={false}>
          {items.map((it, idx) => (
            <motion.li
              key={it.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="overflow-hidden"
            >
              <div className={clsx('grid items-start gap-2 py-2.5', grid)}>
                <NumberInput value={it.qty} onChange={(qty) => update(it.id, { qty })} className="text-center" aria-label="Quantity" />
                <textarea
                  className="field min-h-9 resize-none [field-sizing:content]"
                  rows={1}
                  placeholder="Item, model, specification…"
                  aria-label="Description"
                  value={it.description}
                  onChange={(e) => update(it.id, { description: e.target.value })}
                />
                <div className="@xl:order-last">
                  <Menu
                    label="Line actions"
                    width="w-44"
                    items={[
                      { label: 'Move up', icon: <ArrowUp />, onSelect: () => idx > 0 && move(idx, -1) },
                      { label: 'Move down', icon: <ArrowDown />, onSelect: () => idx < items.length - 1 && move(idx, 1) },
                      { label: 'Duplicate line', icon: <Copy />, onSelect: () => set({ items: [...items.slice(0, idx + 1), { ...it, id: uid() }, ...items.slice(idx + 1)] }) },
                      'divider',
                      { label: 'Remove', icon: <Trash2 />, danger: true, onSelect: () => set({ items: items.filter((i) => i.id !== it.id) }) },
                    ]}
                    trigger={({ toggle, open }) => (
                      <Button variant="ghost" size="icon-sm" className="mt-1" onClick={toggle} aria-expanded={open} aria-label="Line actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    )}
                  />
                </div>
                {priced && (
                  <div className="col-span-full flex items-center gap-2 pl-[4.5rem] @xl:contents">
                    <span className="text-xs text-ink-3 @xl:hidden">Unit price</span>
                    <NumberInput value={it.unitPrice} onChange={(unitPrice) => update(it.id, { unitPrice })} className="max-w-36 text-right @xl:max-w-none" aria-label="Unit price" placeholder="0.00" />
                    <span className="ml-auto pr-9 text-right text-sm font-medium tabular-nums text-ink @xl:ml-0 @xl:pr-0.5 @xl:pt-2">{fmtMoney(it.qty * it.unitPrice)}</span>
                  </div>
                )}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      </div>
      <Button variant="ghost" size="sm" className="mt-2 -ml-1.5" onClick={() => set({ items: [...items, { id: uid(), qty: 1, description: '', unitPrice: 0 }] })}>
        <Plus className="size-4" /> Add line
      </Button>

      {priced && (
        <div className="mt-4 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-ink-2">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{fmtMoney(t.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 text-ink-2">
              <dt className="flex items-center gap-2">
                <Toggle checked={doc.data.vatEnabled} onChange={(vatEnabled) => set({ vatEnabled })} label="VAT" />
                {doc.data.vatEnabled && (
                  <span className="flex items-center gap-1 text-ink-3">
                    <NumberInput value={doc.data.vatRate} onChange={(vatRate) => set({ vatRate })} className="h-7! min-h-0! w-12 px-1.5! py-0! text-center text-xs" aria-label="VAT rate" />%
                  </span>
                )}
              </dt>
              <dd className="tabular-nums">{fmtMoney(t.vat)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-2.5">
              <dt className="font-medium text-ink">Total due</dt>
              <dd className="text-lg font-semibold tabular-nums tracking-[-0.01em] text-ink">
                {fmtMoney(t.total)} <span className="text-xs font-medium text-ink-4">KSH</span>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </Section>
  );
}

function StatementSection({ doc, set }: SectionProps) {
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
    <Section
      title="Statement lines"
      description={`${rows.length} line${rows.length === 1 ? '' : 's'}`}
      action={
        unpaid.length > 0 && (
          <Button size="sm" onClick={importInvoices}>
            <FileInput className="size-3.5" /> Add {unpaid.length} unpaid
          </Button>
        )
      }
    >
      <ul className="space-y-2.5">
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <motion.li
              key={r.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="rounded-lg border border-line bg-canvas/50 p-3"
            >
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
                  <input className="field font-mono text-xs!" value={r.invoiceNo} onChange={(e) => update(r.id, { invoiceNo: e.target.value })} />
                </label>
                <label>
                  <Label>Delivery No.</Label>
                  <input className="field font-mono text-xs!" value={r.deliveryNo} onChange={(e) => update(r.id, { deliveryNo: e.target.value })} />
                </label>
                <label>
                  <Label>Amount</Label>
                  <NumberInput value={r.amount} onChange={(amount) => update(r.id, { amount })} />
                </label>
                <label>
                  <Label
                    hint={
                      <button type="button" className="font-medium text-accent-ink hover:underline" onClick={() => update(r.id, { vat: Math.round(r.amount * settings.vatRate) / 100 })}>
                        {settings.vatRate}%
                      </button>
                    }
                  >
                    VAT
                  </Label>
                  <NumberInput value={r.vat} onChange={(vat) => update(r.id, { vat })} />
                </label>
                <div className="flex items-end justify-between gap-2">
                  <div className="pb-2">
                    <span className="block text-xs text-ink-3">Total</span>
                    <span className="text-sm font-medium tabular-nums text-ink">{fmtMoney(rowTotal(r))}</span>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="mb-1 hover:text-red-600" onClick={() => set({ rows: rows.filter((x) => x.id !== r.id) })} aria-label="Remove line">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <Button variant="ghost" size="sm" className="mt-2 -ml-1.5" onClick={() => set({ rows: [...rows, { id: uid(), date: doc.data.date, lpo: '', invoiceNo: '', deliveryNo: '', amount: 0, vat: 0 }] })}>
        <Plus className="size-4" /> Add line
      </Button>
      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
        <span className="font-medium text-ink">Balance due</span>
        <span className="text-lg font-semibold tabular-nums text-ink">
          {fmtMoney(t.total)} <span className="text-xs font-medium text-ink-4">KSH</span>
        </span>
      </div>
    </Section>
  );
}

// ------------------------------------------------------------------ signatures

const SLOT_HINT: Record<SignatureRole, (company: string) => string> = {
  authorized: (co) => `Sign for ${co}.`,
  receiver: () => 'Hand the device to the person receiving the goods.',
  client: () => 'Let the client sign on screen to accept.',
};

function SignatureSlot({ doc, role }: { doc: DocRecord; role: SignatureRole }) {
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const sig = doc.data.signatures?.[role];
  const meta = SIGNATURE_META[role];
  const stale = !!sig && sig.contentHash !== contentHash(doc.data);

  const save = (s: Pick<Signature, 'paths' | 'box' | 'name'>) => {
    const signature: Signature = { ...s, signedAt: new Date().toISOString(), contentHash: contentHash(doc.data) };
    const patch: Partial<DocData> = { signatures: { ...doc.data.signatures, [role]: signature } };
    // Signing settles the status: goods received → delivered, client signed → accepted.
    if (role === 'receiver') patch.status = 'delivered';
    if (role === 'client') patch.status = 'accepted';
    if (role === 'authorized' && !doc.data.authorizedName.trim()) patch.authorizedName = s.name;
    updateData(doc.id, patch);
    setOpen(false);
    toast(`Signed by ${s.name}`);
  };

  const remove = () => {
    const rest = { ...doc.data.signatures };
    delete rest[role];
    updateData(doc.id, { signatures: rest });
  };

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {sig ? (
          <motion.div key="signed" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden rounded-lg border border-line">
            <div className="flex items-center gap-3 p-3 sm:gap-4">
              <div className="flex h-16 w-32 shrink-0 items-center rounded-md border border-line bg-white px-2.5 text-[#1b1a18] sm:w-40">
                <SignatureView sig={sig} className="h-12 w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="eyebrow">{meta.label}</p>
                <p className="mt-0.5 truncate text-sm font-medium text-ink">{sig.name}</p>
                <p className="truncate text-xs text-ink-3">Signed in person · {fmtDateTime(sig.signedAt)}</p>
              </div>
              <Menu
                label="Signature actions"
                width="w-44"
                items={[
                  { label: 'Sign again', icon: <RotateCcw />, onSelect: () => setOpen(true) },
                  { label: 'Remove signature', icon: <Trash2 />, danger: true, onSelect: remove },
                ]}
                trigger={({ toggle, open: o }) => (
                  <Button variant="ghost" size="icon-sm" onClick={toggle} aria-expanded={o} aria-label="Signature actions">
                    <MoreHorizontal className="size-4" />
                  </Button>
                )}
              />
            </div>
            {stale && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span className="flex-1">The document changed after it was signed.</span>
                <button onClick={() => setOpen(true)} className="font-semibold hover:underline">
                  Sign again
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.button
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(true)}
            className="group flex w-full items-center gap-3 rounded-lg border border-dashed border-line-strong p-3 text-left transition-colors hover:border-accent/50 hover:bg-accent-soft/40"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-ink transition-transform group-hover:-rotate-6">
              <PenLine className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">{meta.label}</span>
              <span className="block text-[0.8125rem] text-ink-3">{SLOT_HINT[role](settings.companyName)}</span>
            </span>
            <span className="hidden shrink-0 text-[0.8125rem] font-medium text-ink sm:block">Sign in person</span>
          </motion.button>
        )}
      </AnimatePresence>
      <SignatureDialog
        open={open}
        onClose={() => setOpen(false)}
        title={`${meta.label} · ${doc.number}`}
        who={meta.who}
        consent={meta.consent(settings.companyName)}
        defaultName={role === 'authorized' ? doc.data.authorizedName || settings.authorizedName : (sig?.name ?? '')}
        onSave={save}
      />
    </div>
  );
}

function SignaturesSection({ doc }: { doc: DocRecord }) {
  return (
    <Section title="Signatures" description="Signed on this device, in person. The signature, name and time appear on the PDF.">
      <div className="space-y-2.5">
        {SIGNATURE_ROLES[doc.type].map((role) => (
          <SignatureSlot key={role} doc={doc} role={role} />
        ))}
      </div>
    </Section>
  );
}

function FinishSection({ doc, set }: SectionProps) {
  return (
    <Section title="Notes & options">
      <div className="space-y-4">
        {doc.type !== 'statement' && (
          <label className="block">
            <Label>Footer note</Label>
            <textarea className="field min-h-[4.5rem] [field-sizing:content]" rows={3} value={doc.data.notes} onChange={(e) => set({ notes: e.target.value })} />
          </label>
        )}
        <label className="block">
          <Label hint="Printed above the signature line">Authorized name</Label>
          <input className="field" placeholder="Leave blank to write it by hand" value={doc.data.authorizedName} onChange={(e) => set({ authorizedName: e.target.value })} />
        </label>
        <div className="border-t border-line pt-4">
          <Toggle checked={doc.data.includeCover} onChange={(includeCover) => set({ includeCover })} label="Cover page" description="A branded first page before the document." />
        </div>
      </div>
    </Section>
  );
}
