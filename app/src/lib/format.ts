import { DOC_META, type DocData, type DocRecord, type DocType, type StatementRow } from './types';

const money = new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtMoney = (n: number) => money.format(Number.isFinite(n) ? n : 0);

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** "2026-07-17" → "17 July 2026" */
export function fmtDateLong(iso: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "2026-07-08" → "08/07/2026" (statement rows, as on the original) */
export function fmtDateShort(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

/** "2026-08-12" → "12th August, 2026" (statement subject line, as on the original) */
export function fmtDateOrdinal(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suffix} ${d.toLocaleDateString('en-GB', { month: 'long' })}, ${d.getFullYear()}`;
}

export const docNumber = (prefix: string, type: DocType, year: number, seq: number) =>
  `${prefix}/${DOC_META[type].code}/${year}/${String(seq).padStart(4, '0')}`;

export const fileName = (doc: DocRecord) => {
  const who = doc.data.to.trim().replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  return `${doc.number.replace(/\//g, '_')}${who ? '_' + who : ''}.pdf`;
};

export const rowTotal = (r: StatementRow) => (r.amount || 0) + (r.vat || 0);

export function totals(data: DocData, type: DocType) {
  if (type === 'statement') {
    const subtotal = data.rows.reduce((s, r) => s + (r.amount || 0), 0);
    const vat = data.rows.reduce((s, r) => s + (r.vat || 0), 0);
    return { subtotal, vat, total: subtotal + vat };
  }
  const subtotal = data.items.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
  const vat = data.vatEnabled ? Math.round(subtotal * data.vatRate) / 100 : 0;
  return { subtotal, vat, total: subtotal + vat };
}

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
