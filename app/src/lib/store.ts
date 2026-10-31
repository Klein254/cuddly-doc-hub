/**
 * Local-first document store with live cloud sync.
 *
 * Every edit is written to IndexedDB straight away and queued in an outbox. The outbox is pushed
 * to Supabase shortly after (and again whenever the device comes back online). Changes made on
 * other devices arrive through a realtime subscription, and a full pull runs on start-up and on
 * every reconnect. Conflicts resolve last-write-wins on updated_at.
 */
import type { RealtimeChannel, Session } from '@supabase/supabase-js';
import { clear, createStore, del, entries, get, set } from 'idb-keyval';
import { useSyncExternalStore } from 'react';
import { docNumber, todayISO, uid } from './format';
import { supabase } from './supabase';
import { DEFAULT_NOTES, DEFAULT_SETTINGS, type DocData, type DocRecord, type DocType, type Settings } from './types';

export interface SyncState {
  ready: boolean;
  mode: 'local' | 'cloud';
  session: Session | null;
  online: boolean;
  phase: 'idle' | 'syncing' | 'error';
  pending: number;
  error: string | null;
  lastSynced: string | null;
}

interface Snapshot {
  docs: DocRecord[];
  settings: Settings;
  sync: SyncState;
}

const docDb = createStore('vdh-docs', 'docs');
const metaDb = createStore('vdh-meta', 'meta');

const docs = new Map<string, DocRecord>();
let settings: Settings = { ...DEFAULT_SETTINGS };
const outbox = new Set<string>();
let settingsDirty = false;
let sync: SyncState = {
  ready: false,
  mode: supabase ? 'cloud' : 'local',
  session: null,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  phase: 'idle',
  pending: 0,
  error: null,
  lastSynced: null,
};

// ---------------------------------------------------------------- snapshot / subscriptions

const listeners = new Set<() => void>();
let snapshot: Snapshot = build();

function build(): Snapshot {
  const list = [...docs.values()].filter((d) => !d.deleted).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { docs: list, settings, sync: { ...sync, pending: outbox.size + (settingsDirty ? 1 : 0) } };
}

function emit() {
  snapshot = build();
  listeners.forEach((l) => l());
}

function setSync(patch: Partial<SyncState>) {
  sync = { ...sync, ...patch };
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useStore<T>(select: (s: Snapshot) => T): T {
  return useSyncExternalStore(subscribe, () => select(snapshot));
}

export const useDocs = () => useStore((s) => s.docs);
export const useSettings = () => useStore((s) => s.settings);
export const useSync = () => useStore((s) => s.sync);
export const useDoc = (id: string) => useStore((s) => s.docs.find((d) => d.id === id));

// ---------------------------------------------------------------- local persistence

const localWrites = new Set<string>();
let localTimer: ReturnType<typeof setTimeout> | undefined;

function persistLocal(id: string) {
  localWrites.add(id);
  clearTimeout(localTimer);
  localTimer = setTimeout(flushLocal, 250);
}

async function flushLocal() {
  const ids = [...localWrites];
  localWrites.clear();
  await Promise.all(ids.map((id) => (docs.has(id) ? set(id, docs.get(id), docDb) : del(id, docDb))));
  await set('outbox', [...outbox], metaDb);
  await set('settingsDirty', settingsDirty, metaDb);
}

const ts = (s: string) => Date.parse(s) || 0;

// ---------------------------------------------------------------- cloud sync

let flushTimer: ReturnType<typeof setTimeout> | undefined;
let retryDelay = 2000;
let flushing = false;
let flushAgain = false;
let channel: RealtimeChannel | null = null;

const canSync = () => !!supabase && !!sync.session && sync.online;

function scheduleFlush(delay = 600) {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, delay);
}

const toRow = (d: DocRecord) => ({
  id: d.id,
  type: d.type,
  number: d.number,
  year: d.year,
  seq: d.seq,
  data: d.data,
  deleted: d.deleted,
  created_at: d.created_at,
  updated_at: d.updated_at,
});

async function flush() {
  if (!canSync()) return;
  if (flushing) {
    flushAgain = true;
    return;
  }
  flushing = true;
  setSync({ phase: 'syncing' });
  try {
    for (const id of [...outbox]) {
      const doc = docs.get(id);
      if (!doc) {
        outbox.delete(id);
        continue;
      }
      const row = toRow(doc);
      const { error } = await supabase!.from('documents').upsert(row);
      if (error?.code === '23505') {
        // Another device took this number while we were offline: move to the next free one.
        await renumber(doc);
        flushAgain = true;
        continue;
      }
      if (error) throw error;
      // Only clear if nothing was edited while the request was in flight.
      if (docs.get(id)?.updated_at === row.updated_at) outbox.delete(id);
    }
    if (settingsDirty) {
      const sent = settings.updated_at;
      const { error } = await supabase!.from('settings').upsert({ id: 'company', data: settings, updated_at: sent });
      if (error) throw error;
      if (settings.updated_at === sent) settingsDirty = false;
    }
    await flushLocal();
    retryDelay = 2000;
    setSync({ phase: 'idle', error: null, lastSynced: new Date().toISOString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : (e as { message?: string })?.message || 'Sync failed';
    setSync({ phase: 'error', error: msg });
    scheduleFlush(retryDelay);
    retryDelay = Math.min(retryDelay * 2, 60000);
  } finally {
    flushing = false;
    if (flushAgain) {
      flushAgain = false;
      scheduleFlush(200);
    }
  }
}

async function renumber(doc: DocRecord) {
  const { data } = await supabase!
    .from('documents')
    .select('seq')
    .eq('type', doc.type)
    .eq('year', doc.year)
    .order('seq', { ascending: false })
    .limit(1);
  const seq = Math.max(data?.[0]?.seq ?? 0, localMaxSeq(doc.type, doc.year)) + 1;
  write({ ...doc, seq, number: docNumber(settings.prefix, doc.type, doc.year, seq) });
}

function mergeRemote(row: DocRecord) {
  const local = docs.get(row.id);
  if (local && ts(local.updated_at) >= ts(row.updated_at)) return false;
  docs.set(row.id, row);
  outbox.delete(row.id);
  persistLocal(row.id);
  return true;
}

function mergeRemoteSettings(row: { data: Settings; updated_at: string }) {
  if (ts(row.updated_at) <= ts(settings.updated_at)) return false;
  settings = { ...DEFAULT_SETTINGS, ...row.data, updated_at: row.updated_at };
  settingsDirty = false;
  set('settings', settings, metaDb);
  return true;
}

async function pull() {
  if (!canSync()) return;
  setSync({ phase: 'syncing' });
  try {
    const page = 1000;
    for (let from = 0; ; from += page) {
      const { data, error } = await supabase!.from('documents').select('*').order('created_at').range(from, from + page - 1);
      if (error) throw error;
      data.forEach((r) => mergeRemote(r as DocRecord));
      if (data.length < page) break;
    }
    const { data: s, error } = await supabase!.from('settings').select('*').eq('id', 'company').maybeSingle();
    if (error) throw error;
    if (s) mergeRemoteSettings(s);
    setSync({ phase: 'idle', error: null, lastSynced: new Date().toISOString() });
    if (outbox.size || settingsDirty) scheduleFlush(0);
  } catch (e) {
    setSync({ phase: 'error', error: (e as { message?: string })?.message || 'Could not reach the database' });
  }
}

function startRealtime() {
  if (!supabase || channel) return;
  channel = supabase
    .channel('doc-hub')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, (p) => {
      if (p.new && 'id' in p.new && mergeRemote(p.new as DocRecord)) emit();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (p) => {
      if (p.new && 'data' in p.new && mergeRemoteSettings(p.new as { data: Settings; updated_at: string })) emit();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') pull();
    });
}

function stopRealtime() {
  if (channel) supabase?.removeChannel(channel);
  channel = null;
}

// ---------------------------------------------------------------- init

let started = false;

export async function init() {
  if (started) return;
  started = true;

  const [stored, savedSettings, savedOutbox, savedSettingsDirty] = await Promise.all([
    entries<string, DocRecord>(docDb),
    get<Settings>('settings', metaDb),
    get<string[]>('outbox', metaDb),
    get<boolean>('settingsDirty', metaDb),
  ]);
  stored.forEach(([id, d]) => docs.set(id, d));
  if (savedSettings) settings = { ...DEFAULT_SETTINGS, ...savedSettings };
  savedOutbox?.forEach((id) => outbox.add(id));
  settingsDirty = !!savedSettingsDirty;

  window.addEventListener('online', () => {
    setSync({ online: true });
    pull();
  });
  window.addEventListener('offline', () => setSync({ online: false }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') pull();
    else flushLocal();
  });
  window.addEventListener('pagehide', () => flushLocal());

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    sync = { ...sync, session: data.session };
    supabase.auth.onAuthStateChange((_event, session) => {
      const was = sync.session?.user.id;
      setSync({ session });
      if (session && session.user.id !== was) {
        startRealtime();
        pull();
      }
      if (!session) stopRealtime();
    });
    if (data.session) startRealtime();
  }
  setSync({ ready: true });
}

// ---------------------------------------------------------------- mutations

function write(doc: DocRecord) {
  docs.set(doc.id, { ...doc, updated_at: new Date().toISOString() });
  outbox.add(doc.id);
  persistLocal(doc.id);
  emit();
  scheduleFlush();
}

function localMaxSeq(type: DocType, year: number) {
  let max = 0;
  docs.forEach((d) => {
    if (d.type === type && d.year === year) max = Math.max(max, d.seq);
  });
  return max;
}

export function blankData(type: DocType): DocData {
  return {
    to: '',
    toAddress: '',
    date: todayISO(),
    subject: '',
    items: type === 'statement' ? [] : [{ id: uid(), qty: 1, description: '', unitPrice: 0 }],
    rows: [],
    vatEnabled: true,
    vatRate: settings.vatRate,
    notes: DEFAULT_NOTES[type],
    authorizedName: settings.authorizedName,
    includeCover: true,
    status: 'draft',
  };
}

export function createDoc(type: DocType, data: Partial<DocData> = {}): DocRecord {
  const year = new Date().getFullYear();
  const seq = localMaxSeq(type, year) + 1;
  const now = new Date().toISOString();
  const doc: DocRecord = {
    id: uid(),
    type,
    year,
    seq,
    number: docNumber(settings.prefix, type, year, seq),
    data: { ...blankData(type), ...data },
    deleted: false,
    created_at: now,
    updated_at: now,
  };
  write(doc);
  return doc;
}

export function updateData(id: string, patch: Partial<DocData>) {
  const doc = docs.get(id);
  if (doc) write({ ...doc, data: { ...doc.data, ...patch } });
}

export function setSeq(id: string, seq: number) {
  const doc = docs.get(id);
  if (!doc || !Number.isInteger(seq) || seq < 1) return;
  write({ ...doc, seq, number: docNumber(settings.prefix, doc.type, doc.year, seq) });
}

export const isSeqTaken = (doc: DocRecord, seq: number) =>
  [...docs.values()].some((d) => d.id !== doc.id && d.type === doc.type && d.year === doc.year && d.seq === seq);

export function deleteDoc(id: string) {
  const doc = docs.get(id);
  if (doc) write({ ...doc, deleted: true });
}

/** Copies a document into another type, e.g. an accepted quotation into an invoice. */
export function convertDoc(id: string, type: DocType) {
  const src = docs.get(id);
  if (!src) return null;
  const { to, toAddress, subject, items, vatEnabled, vatRate, authorizedName } = src.data;
  return createDoc(type, {
    to,
    toAddress,
    subject: subject.replace(/^QUOTATION FOR/i, type === 'delivery' ? 'DELIVERY OF' : 'SUPPLY OF'),
    items: items.map((i) => ({ ...i, id: uid() })),
    vatEnabled,
    vatRate,
    authorizedName,
  });
}

export function updateSettings(patch: Partial<Settings>) {
  settings = { ...settings, ...patch, updated_at: new Date().toISOString() };
  settingsDirty = true;
  set('settings', settings, metaDb);
  set('settingsDirty', true, metaDb);
  emit();
  scheduleFlush();
}

export const syncNow = () => pull().then(flush);

// ---------------------------------------------------------------- auth

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Cloud sync is not configured');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Signs out and wipes this device's copy so the next person can't see it. */
export async function signOut() {
  await supabase?.auth.signOut();
  stopRealtime();
  docs.clear();
  outbox.clear();
  settingsDirty = false;
  settings = { ...DEFAULT_SETTINGS };
  await Promise.all([clear(docDb), clear(metaDb)]);
  emit();
}
