/**
 * Cloud backends for live sync. The store (store.ts) talks only to this interface, so the app can sync
 * through Firebase (Firestore + Firebase Auth) or Supabase, depending on which keys are set in `.env`.
 * With neither, the app runs in local-only mode. Firebase wins if both are set.
 */
import type { DocRecord, DocType, Settings } from './types';

export interface CloudUser {
  id: string;
  email: string;
}

export interface RemoteSettings {
  data: Settings;
  updated_at: string;
}

export interface LiveHandlers {
  doc: (d: DocRecord) => void;
  settings: (s: RemoteSettings) => void;
  /** The subscription is connected (for Firebase: the first full snapshot has been delivered). */
  ready: () => void;
  error: (e: Error) => void;
}

export interface CloudBackend {
  kind: 'firebase' | 'supabase';
  /** True when the live subscription also delivers the full current state, so no separate pull is needed. */
  liveIncludesSnapshot: boolean;
  currentUser(): Promise<CloudUser | null>;
  onAuthChange(cb: (u: CloudUser | null) => void): void;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Uploads a document. Returns 'taken' when another document already holds its number. */
  putDoc(doc: DocRecord): Promise<'ok' | 'taken'>;
  putSettings(settings: Settings): Promise<void>;
  /** Highest sequence number in the cloud for this type and year. */
  maxSeq(type: DocType, year: number): Promise<number>;
  pullAll(): Promise<{ docs: DocRecord[]; settings: RemoteSettings | null }>;
  /** Live changes from other devices. Returns an unsubscribe function. */
  subscribe(h: LiveHandlers): () => void;
}

const env = import.meta.env;

export const cloudKind: CloudBackend['kind'] | null =
  env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID ? 'firebase' : env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY ? 'supabase' : null;

/** Which project this build syncs with, so a device can tell when it's pointed at a new one. */
export const cloudTarget =
  cloudKind === 'firebase' ? `firebase:${env.VITE_FIREBASE_PROJECT_ID}` : cloudKind === 'supabase' ? `supabase:${env.VITE_SUPABASE_URL}` : null;

/** Loads only the SDK that's actually configured, so local-only installs stay small. */
export async function loadBackend(): Promise<CloudBackend | null> {
  if (cloudKind === 'firebase') return (await import('./cloud-firebase')).createFirebaseBackend();
  if (cloudKind === 'supabase') return (await import('./cloud-supabase')).createSupabaseBackend();
  return null;
}

/** Copies only the DocRecord fields, dropping backend bookkeeping columns. */
export const toDocRecord = (r: Record<string, unknown>): DocRecord => ({
  id: r.id as string,
  type: r.type as DocType,
  number: r.number as string,
  year: r.year as number,
  seq: r.seq as number,
  data: r.data as DocRecord['data'],
  deleted: !!r.deleted,
  created_at: r.created_at as string,
  updated_at: r.updated_at as string,
});

export const toRow = (d: DocRecord) => ({
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
