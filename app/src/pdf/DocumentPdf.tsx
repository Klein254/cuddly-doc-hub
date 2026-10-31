import { Circle, Document, Page, Path, Rect, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import { fmtDateLong, fmtDateShort, fmtMoney, rowTotal, totals } from '../lib/format';
import { DOC_META, type DocRecord, type Settings } from '../lib/types';
import { C, F } from './theme';

const s = StyleSheet.create({
  page: { fontFamily: F.sans, fontSize: 9, color: C.body, backgroundColor: C.white, paddingTop: 46, paddingHorizontal: 50, paddingBottom: 74 },
  label: { fontFamily: F.brand, fontWeight: 700, fontSize: 6.5, letterSpacing: 1.6, color: C.muted, textTransform: 'uppercase' },
  row: { flexDirection: 'row' },
});

// ------------------------------------------------------------------ logo

/** The Vector Technical mark: amber bracket frame broken by the wordmark, tagline in orange. */
export function PdfLogo({ width = 200, dark = false }: { width?: number; dark?: boolean }) {
  const h = width * 0.55;
  const stroke = Math.max(1.5, width * 0.022);
  const bracket = { position: 'absolute' as const, left: 0, right: 0, borderColor: C.amber, borderLeftWidth: stroke, borderRightWidth: stroke };
  return (
    <View style={{ width: width * 1.36, height: h, alignItems: 'center' }}>
      <View style={{ width, height: h, position: 'relative' }}>
        <View style={{ ...bracket, top: 0, height: h * 0.38, borderTopWidth: stroke }} />
        <View style={{ ...bracket, bottom: 0, height: h * 0.4, borderBottomWidth: stroke }} />
      </View>
      <Text
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: h * 0.355,
          textAlign: 'center',
          fontFamily: F.brand,
          fontWeight: 800,
          fontSize: width * 0.128,
          letterSpacing: -width * 0.0015,
          color: dark ? C.white : C.ink,
        }}
      >
        VECTOR TECHNICAL
      </Text>
      <Text
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: h * 0.655,
          textAlign: 'center',
          fontFamily: F.brand,
          fontWeight: 600,
          fontSize: width * 0.036,
          letterSpacing: width * 0.0058,
          color: C.orange,
        }}
      >
        MAINTENANCE &amp; GENERAL SUPPLIES
      </Text>
    </View>
  );
}

// ------------------------------------------------------------------ icons

const icon = { stroke: C.white, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function IconTile({ bg, kind }: { bg: string; kind: 'phone' | 'mail' | 'pin' }) {
  return (
    <View style={{ width: 17, height: 17, borderRadius: 3.5, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginLeft: 9 }}>
      <Svg viewBox="0 0 24 24" width={9} height={9}>
        {kind === 'phone' && (
          <Path
            {...icon}
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
          />
        )}
        {kind === 'mail' && (
          <>
            <Rect {...icon} x={2} y={4} width={20} height={16} rx={2} />
            <Path {...icon} d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </>
        )}
        {kind === 'pin' && (
          <>
            <Path {...icon} d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
            <Circle {...icon} cx={12} cy={10} r={3} />
          </>
        )}
      </Svg>
    </View>
  );
}

// ------------------------------------------------------------------ cover

function Cover({ doc, co }: { doc: DocRecord; co: Settings }) {
  const meta = DOC_META[doc.type];
  const words = meta.label.split(' ');
  // "Statement of Accounts" reads best on two lines: "Statement of / Accounts".
  const lines = words.length > 2 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : words.length === 2 ? words : [meta.label];
  const contact = [
    { text: co.phone, kind: 'phone' as const, bg: '#3A3F4A' },
    { text: co.email, kind: 'mail' as const, bg: C.orange },
    { text: co.addressLine2 || 'Nairobi, Kenya.', kind: 'pin' as const, bg: C.ink },
  ].filter((c) => c.text);

  return (
    <Page size="A4" style={{ fontFamily: F.sans, backgroundColor: C.white, position: 'relative' }}>
      <View style={{ alignItems: 'center', marginTop: 84 }}>
        <PdfLogo width={170} />
      </View>

      <View style={{ marginTop: 150, paddingHorizontal: 72 }}>
        <View style={{ ...s.row, alignItems: 'center', marginBottom: 18 }}>
          <View style={{ width: 26, height: 2.5, backgroundColor: C.orange, marginRight: 10 }} />
          <Text style={{ ...s.label, color: C.orange }}>{doc.number}</Text>
        </View>
        {lines.map((l, i) => (
          <Text
            key={i}
            style={{ fontFamily: F.serif, fontWeight: 600, fontSize: lines.length > 1 ? 54 : 64, lineHeight: 1.04, color: C.ink, letterSpacing: -0.6 }}
          >
            {l}
          </Text>
        ))}
        <Text style={{ marginTop: 22, fontSize: 10, letterSpacing: 3.2, color: C.muted, textTransform: 'uppercase' }}>Official {meta.label} Document</Text>

        <View style={{ ...s.row, marginTop: 46, borderTopWidth: 0.6, borderTopColor: C.hair, paddingTop: 14 }}>
          {[
            { k: 'Prepared for', v: doc.data.to || '—' },
            { k: 'Date', v: fmtDateLong(doc.data.date) },
            { k: 'Reference', v: doc.number },
          ].map((m, i) => (
            <View key={m.k} style={{ flex: i === 0 ? 1.4 : 1, paddingLeft: i ? 14 : 0, borderLeftWidth: i ? 0.6 : 0, borderLeftColor: C.hair }}>
              <Text style={s.label}>{m.k}</Text>
              <Text style={{ marginTop: 5, fontSize: 9.5, fontWeight: 600, color: C.ink }}>{m.v}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ position: 'absolute', right: 72, bottom: 132, alignItems: 'flex-end' }}>
        {contact.map((c) => (
          <View key={c.kind} style={{ ...s.row, alignItems: 'center', marginTop: 9 }}>
            <Text style={{ fontSize: 9, fontWeight: 600, color: C.ink }}>{c.text}</Text>
            <IconTile bg={c.bg} kind={c.kind} />
          </View>
        ))}
      </View>

      {/* bottom brand sweep: dark, orange and amber bands with a fine hatch */}
      <Svg style={{ position: 'absolute', left: 0, bottom: 0 }} width={595.28} height={96} viewBox="0 0 595 96">
        {Array.from({ length: 70 }, (_, i) => (
          <Path key={i} d={`M${262 + i * 5} 96 L${262 + i * 5 + 34} 52`} stroke="#E3E0DA" strokeWidth={0.6} />
        ))}
        <Path d="M0 30 H208 A66 66 0 0 1 274 96 H0 Z" fill={C.amber} />
        <Path d="M0 18 H158 A78 78 0 0 1 236 96 H0 Z" fill={C.orange} />
        <Path d="M0 6 H100 A90 90 0 0 1 190 96 H0 Z" fill={C.ink} />
      </Svg>
    </Page>
  );
}

// ------------------------------------------------------------------ body building blocks

function Header({ doc, co }: { doc: DocRecord; co: Settings }) {
  const meta = DOC_META[doc.type];
  return (
    <View>
      <View style={{ ...s.row, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ maxWidth: 270 }}>
          <Text
            style={{ fontFamily: F.serif, fontWeight: 600, fontSize: doc.type === 'statement' ? 24 : 30, color: C.ink, lineHeight: 1.1, letterSpacing: -0.3 }}
          >
            {meta.label}
          </Text>
          <Text style={{ ...s.label, marginTop: 7 }}>No. {doc.number}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: F.brand, fontWeight: 800, fontSize: 10, letterSpacing: 0.8, color: C.ink }}>{co.companyName.toUpperCase()}</Text>
          <Text style={{ fontFamily: F.brand, fontWeight: 600, fontSize: 5.6, letterSpacing: 1.5, color: C.orange, marginTop: 2.5, marginBottom: 6 }}>
            {co.tagline.toUpperCase()}
          </Text>
          {[co.addressLine1, co.poBox, co.addressLine2].filter(Boolean).map((l) => (
            <Text key={l} style={{ fontSize: 7.8, color: C.muted, lineHeight: 1.45 }}>
              {l}
            </Text>
          ))}
          <Text style={{ fontSize: 7.8, color: C.muted, lineHeight: 1.45 }}>
            {co.phone}
            <Text style={{ color: C.hair }}>{'  |  '}</Text>
            {co.email}
          </Text>
        </View>
      </View>
      <View style={{ ...s.row, marginTop: 18 }}>
        <View style={{ width: 44, height: 1.6, backgroundColor: C.orange }} />
        <View style={{ flex: 1, height: 0.6, marginTop: 0.5, backgroundColor: C.hair }} />
      </View>
    </View>
  );
}

function Recipient({ doc }: { doc: DocRecord }) {
  const d = doc.data;
  return (
    <View
      style={{ ...s.row, marginTop: 22, backgroundColor: C.ivory, borderLeftWidth: 2.5, borderLeftColor: C.orange, paddingVertical: 13, paddingHorizontal: 16 }}
    >
      <View style={{ flex: 1, paddingRight: 20 }}>
        <Text style={s.label}>To</Text>
        <Text style={{ marginTop: 5, fontSize: 10.5, fontWeight: 600, color: C.ink }}>{d.to || '—'}</Text>
        {d.toAddress
          .split('\n')
          .filter((l) => l.trim())
          .map((l, i) => (
            <Text key={i} style={{ fontSize: 8.5, color: C.body, marginTop: 2 }}>
              {l}
            </Text>
          ))}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.label}>{doc.type === 'statement' ? 'As at' : 'Date'}</Text>
        <Text style={{ marginTop: 5, fontSize: 10.5, fontWeight: 600, color: C.ink }}>{fmtDateLong(d.date)}</Text>
      </View>
    </View>
  );
}

function Subject({ text, center }: { text: string; center?: boolean }) {
  if (!text.trim()) return <View style={{ height: 22 }} />;
  return (
    <View style={{ marginTop: 24, marginBottom: 14, alignItems: center ? 'center' : 'flex-start' }}>
      <Text
        style={{
          fontFamily: F.brand,
          fontWeight: 700,
          fontSize: 9,
          letterSpacing: 1.1,
          color: C.ink,
          textTransform: 'uppercase',
          textAlign: center ? 'center' : 'left',
        }}
      >
        {text}
      </Text>
      <View style={{ width: 28, height: 1.2, backgroundColor: C.orange, marginTop: 6 }} />
    </View>
  );
}

type Col = { key: string; label: string; width?: number; flex?: number; align?: 'left' | 'center' | 'right' };

function TableHead({ cols, tight }: { cols: Col[]; tight?: boolean }) {
  return (
    <View style={{ ...s.row, borderBottomWidth: 1.2, borderBottomColor: C.ink, paddingBottom: 7 }} fixed>
      {cols.map((c) => (
        <Text
          key={c.key}
          style={{
            ...s.label,
            color: C.ink,
            letterSpacing: tight ? 0.6 : 1.6,
            width: c.width,
            flex: c.flex,
            textAlign: c.align ?? 'left',
            paddingHorizontal: 4,
          }}
        >
          {c.label}
        </Text>
      ))}
    </View>
  );
}

function Totals({ doc }: { doc: DocRecord }) {
  const t = totals(doc.data, doc.type);
  const vatLabel = doc.type === 'statement' ? 'VAT' : `VAT (${doc.data.vatRate}%)`;
  return (
    <View style={{ alignSelf: 'flex-end', width: 236, marginTop: 16 }} wrap={false}>
      <View style={{ ...s.row, justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 4 }}>
        <Text style={{ color: C.muted }}>Subtotal</Text>
        <Text style={{ color: C.body }}>{fmtMoney(t.subtotal)} KSH</Text>
      </View>
      {(doc.type === 'statement' || doc.data.vatEnabled) && (
        <View style={{ ...s.row, justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 4 }}>
          <Text style={{ color: C.muted }}>{vatLabel}</Text>
          <Text style={{ color: C.body }}>{fmtMoney(t.vat)} KSH</Text>
        </View>
      )}
      <View
        style={{
          ...s.row,
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 6,
          backgroundColor: C.ink,
          borderRadius: 3,
          paddingVertical: 10,
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ fontFamily: F.serif, fontWeight: 500, fontSize: 12, color: C.white }}>{doc.type === 'statement' ? 'Balance Due' : 'Total Due'}</Text>
        <Text style={{ fontSize: 12, fontWeight: 700, color: C.amber }}>{fmtMoney(t.total)} KSH</Text>
      </View>
    </View>
  );
}

function SignLine({ label, value, strong }: { label: string; value?: string; strong?: boolean }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.label}>{label}</Text>
      <View
        style={{ height: 24, justifyContent: 'flex-end', borderBottomWidth: strong ? 1 : 0.7, borderBottomColor: strong ? C.ink : '#B9BDC5', paddingBottom: 3 }}
      >
        {value ? <Text style={{ fontSize: 9.5, fontWeight: 600, color: C.ink }}>{value}</Text> : null}
      </View>
    </View>
  );
}

function Closing({ doc, co }: { doc: DocRecord; co: Settings }) {
  const d = doc.data;
  return (
    <View style={{ ...s.row, marginTop: 30, alignItems: 'flex-end' }} wrap={false}>
      <View style={{ flex: 1, paddingRight: 34 }}>
        {d.notes ? <Text style={{ fontSize: 9, lineHeight: 1.6, color: C.body }}>{d.notes}</Text> : null}
        {doc.type === 'invoice' && co.paymentDetails ? (
          <View style={{ marginTop: 10, padding: 10, backgroundColor: C.ivory, borderRadius: 3 }}>
            <Text style={s.label}>Payment details</Text>
            <Text style={{ marginTop: 4, fontSize: 8.5, lineHeight: 1.5, color: C.ink }}>{co.paymentDetails}</Text>
          </View>
        ) : null}
        {doc.type === 'quotation' && (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 9, color: C.body }}>To accept this quotation, sign here and return:</Text>
            <View style={{ width: 190, marginTop: 22, borderBottomWidth: 0.7, borderBottomColor: '#B9BDC5' }} />
          </View>
        )}
        {doc.type === 'delivery' && (
          <View style={{ ...s.row, alignItems: 'flex-end', marginTop: 16 }}>
            <Text style={{ fontSize: 9, color: C.body }}>Receiver&apos;s Signature:</Text>
            <View style={{ flex: 1, marginLeft: 8, borderBottomWidth: 0.7, borderBottomColor: '#B9BDC5' }} />
          </View>
        )}
        {doc.type === 'statement' && co.signOff ? (
          <Text style={{ fontFamily: F.brand, fontWeight: 700, fontSize: 9, letterSpacing: 1.5, color: C.ink }}>{co.signOff}</Text>
        ) : null}
        <Text style={{ fontFamily: F.brand, fontWeight: 700, fontSize: 7, letterSpacing: 1.8, color: C.ink, marginTop: 18 }}>THANK YOU FOR YOUR BUSINESS!</Text>
      </View>
      <View style={{ width: 186 }}>
        <SignLine label="Authorized name" value={d.authorizedName} />
        <SignLine label="Authorized signature" strong />
      </View>
    </View>
  );
}

function PageFooter({ doc, co, offset }: { doc: DocRecord; co: Settings; offset: number }) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} fixed>
      <View
        style={{
          ...s.row,
          justifyContent: 'space-between',
          marginHorizontal: 50,
          paddingTop: 8,
          marginBottom: 20,
          borderTopWidth: 0.6,
          borderTopColor: C.hair,
        }}
      >
        <Text style={{ ...s.label, fontSize: 5.8 }}>
          {co.companyName} · {co.tagline}
        </Text>
        <Text
          style={{ ...s.label, fontSize: 5.8 }}
          render={({ pageNumber, totalPages }) => `${doc.number}   ·   Page ${pageNumber - offset} of ${totalPages - offset}`}
        />
      </View>
      <View style={{ ...s.row, height: 4 }}>
        <View style={{ flex: 6, backgroundColor: C.ink }} />
        <View style={{ flex: 2.5, backgroundColor: C.orange }} />
        <View style={{ flex: 1.5, backgroundColor: C.amber }} />
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ bodies

const ITEM_COLS: Col[] = [
  { key: 'qty', label: 'Qty', width: 40, align: 'center' },
  { key: 'desc', label: 'Description', flex: 1 },
  { key: 'unit', label: 'Unit Price', width: 84, align: 'right' },
  { key: 'amt', label: 'Amount', width: 92, align: 'right' },
];

function ItemsTable({ doc }: { doc: DocRecord }) {
  const priced = doc.type !== 'delivery';
  const cols = priced ? ITEM_COLS : ITEM_COLS.slice(0, 2);
  const items = doc.data.items.filter((i) => i.description.trim() || i.qty || i.unitPrice);
  // Totals sit outside the table so the repeating heading doesn't follow them onto a new page.
  return (
    <>
      <View>
        <TableHead cols={cols} />
        {items.map((it) => (
          <View key={it.id} style={{ ...s.row, alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 0.6, borderBottomColor: C.hair }} wrap={false}>
            <Text style={{ width: 40, textAlign: 'center', paddingHorizontal: 4, color: C.ink }}>{it.qty}</Text>
            <Text style={{ flex: 1, paddingHorizontal: 4, fontSize: 9, lineHeight: 1.5, color: C.body }}>{it.description}</Text>
            {priced && <Text style={{ width: 84, textAlign: 'right', paddingHorizontal: 4, color: C.body }}>{fmtMoney(it.unitPrice)}</Text>}
            {priced && (
              <Text style={{ width: 92, textAlign: 'right', paddingHorizontal: 4, fontWeight: 600, color: C.ink }}>{fmtMoney(it.qty * it.unitPrice)}</Text>
            )}
          </View>
        ))}
      </View>
      {priced && <Totals doc={doc} />}
    </>
  );
}

const STATEMENT_COLS: Col[] = [
  { key: 'date', label: 'Date', width: 60 },
  { key: 'lpo', label: 'LPO No.', width: 66 },
  { key: 'inv', label: 'Invoice No.', width: 66 },
  { key: 'dn', label: 'Delivery No.', width: 62 },
  { key: 'amt', label: 'Amount', flex: 1, align: 'right' },
  { key: 'vat', label: 'VAT', width: 62, align: 'right' },
  { key: 'tot', label: 'Total', width: 74, align: 'right' },
];

function StatementTable({ doc }: { doc: DocRecord }) {
  const rows = doc.data.rows;
  // The original statement leaves ruled lines to write on; keep a few blank ones.
  const fillers = Math.max(0, 6 - rows.length);
  const cell = { paddingHorizontal: 4, fontSize: 8.4 };
  return (
    <>
      <View>
        <TableHead cols={STATEMENT_COLS} tight />
        {rows.map((r, i) => (
          <View
            key={r.id}
            style={{ ...s.row, paddingVertical: 8, borderBottomWidth: 0.6, borderBottomColor: C.hair, backgroundColor: i % 2 ? C.ivory : C.white }}
            wrap={false}
          >
            <Text style={{ ...cell, width: 60 }}>{fmtDateShort(r.date)}</Text>
            <Text style={{ ...cell, width: 66 }}>{r.lpo}</Text>
            <Text style={{ ...cell, width: 66 }}>{r.invoiceNo}</Text>
            <Text style={{ ...cell, width: 62 }}>{r.deliveryNo}</Text>
            <Text style={{ ...cell, flex: 1, textAlign: 'right' }}>{fmtMoney(r.amount)}</Text>
            <Text style={{ ...cell, width: 62, textAlign: 'right' }}>{fmtMoney(r.vat)}</Text>
            <Text style={{ ...cell, width: 74, textAlign: 'right', fontWeight: 600, color: C.ink }}>{fmtMoney(rowTotal(r))}</Text>
          </View>
        ))}
        {Array.from({ length: fillers }, (_, i) => (
          <View
            key={'f' + i}
            style={{ height: 22, borderBottomWidth: 0.6, borderBottomColor: C.hair, backgroundColor: (rows.length + i) % 2 ? C.ivory : C.white }}
          />
        ))}
      </View>
      <Totals doc={doc} />
    </>
  );
}

// ------------------------------------------------------------------ document

export function DocumentPdf({ doc, settings }: { doc: DocRecord; settings: Settings }) {
  const meta = DOC_META[doc.type];
  const cover = doc.data.includeCover;
  return (
    <Document title={`${meta.label} ${doc.number}`} author={settings.companyName} subject={doc.data.subject} creator="Vector Doc Hub" producer="Vector Doc Hub">
      {cover && <Cover doc={doc} co={settings} />}
      <Page size="A4" style={s.page}>
        <Header doc={doc} co={settings} />
        <Recipient doc={doc} />
        <Subject text={doc.data.subject} center={doc.type === 'statement'} />
        {doc.type === 'statement' ? <StatementTable doc={doc} /> : <ItemsTable doc={doc} />}
        <View style={{ flexGrow: 1 }} />
        <Closing doc={doc} co={settings} />
        <PageFooter doc={doc} co={settings} offset={cover ? 1 : 0} />
      </Page>
    </Document>
  );
}
