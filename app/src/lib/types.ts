export type DocType = 'quotation' | 'invoice' | 'delivery' | 'statement';
export type DocStatus = 'draft' | 'sent' | 'accepted' | 'paid' | 'delivered';

export interface LineItem {
  id: string;
  qty: number;
  description: string;
  unitPrice: number;
}

export interface StatementRow {
  id: string;
  date: string;
  lpo: string;
  invoiceNo: string;
  deliveryNo: string;
  amount: number;
  vat: number;
}

export interface DocData {
  to: string;
  toAddress: string;
  date: string;
  subject: string;
  items: LineItem[];
  rows: StatementRow[];
  vatEnabled: boolean;
  vatRate: number;
  notes: string;
  authorizedName: string;
  includeCover: boolean;
  status: DocStatus;
}

export interface DocRecord {
  id: string;
  type: DocType;
  number: string;
  year: number;
  seq: number;
  data: DocData;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  companyName: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  poBox: string;
  phone: string;
  email: string;
  prefix: string;
  vatRate: number;
  authorizedName: string;
  paymentDetails: string;
  signOff: string;
  updated_at: string;
}

export const DOC_META: Record<DocType, { label: string; plural: string; code: string; recipientLabel: string }> = {
  quotation: { label: 'Quotation', plural: 'Quotations', code: 'Q', recipientLabel: 'Quotation for' },
  invoice: { label: 'Invoice', plural: 'Invoices', code: 'INV', recipientLabel: 'Billed to' },
  delivery: { label: 'Delivery Note', plural: 'Delivery Notes', code: 'DN', recipientLabel: 'Deliver to' },
  statement: { label: 'Statement of Accounts', plural: 'Statements', code: 'SOA', recipientLabel: 'Statement for' },
};

export const DOC_TYPES: DocType[] = ['quotation', 'invoice', 'delivery', 'statement'];

export const STATUSES: Record<DocType, DocStatus[]> = {
  quotation: ['draft', 'sent', 'accepted'],
  invoice: ['draft', 'sent', 'paid'],
  delivery: ['draft', 'delivered'],
  statement: ['draft', 'sent'],
};

export const DEFAULT_NOTES: Record<DocType, string> = {
  quotation: 'This is a quotation on the goods named, subject to the conditions noted below: All sales final, payment due upon receipt.',
  invoice: 'Please make payment to VECTOR TECHNICAL. Payment is due within 14 days of invoice date. Thank you for your continued business.',
  delivery: 'Received in good order and condition.',
  statement: '',
};

export const DEFAULT_SETTINGS: Settings = {
  companyName: 'Vector Technical',
  tagline: 'Maintenance & General Supplies',
  addressLine1: 'Jogoo Road Plaza, 2nd Floor Rm 517',
  addressLine2: 'Nairobi, Kenya.',
  poBox: 'P.O. Box 507775-00200',
  phone: '+254 115 526 992',
  email: 'vectortech254@gmail.com',
  prefix: 'VTMS',
  vatRate: 16,
  authorizedName: '',
  paymentDetails: '',
  signOff: 'VTMGS',
  updated_at: new Date(0).toISOString(),
};
