/**
 * Firebase backend: Firebase Auth (email + password) and Cloud Firestore.
 *
 * Firestore layout (rules in firestore.rules):
 *   documents/{id}          one per document, same fields as DocRecord (+ numberKey, updated_by)
 *   numbers/{type_year_seq} claims a document number, so two devices can't both issue VTMS/INV/2026/0007
 *   settings/company        company details, prefix, VAT…  { data, updated_at }
 *   team_members/{email}    who may sign in and see documents (lower-case email as the document id)
 *
 * The app keeps its own offline copy and upload queue (store.ts), so Firestore runs with its default
 * in-memory cache; onSnapshot delivers the full state on connect and every change after that.
 */
import { FirebaseError, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, initializeFirestore, onSnapshot, query, runTransaction, where } from 'firebase/firestore';
import { toDocRecord, toRow, type CloudBackend, type CloudUser, type RemoteSettings } from './cloud';
import type { DocRecord, DocType } from './types';

const TAKEN = 'number-taken';

/** Turns Firebase error codes into sentences people can act on. */
function friendly(e: unknown): Error {
  if (!(e instanceof FirebaseError)) return e instanceof Error ? e : new Error(String(e));
  switch (e.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return new Error('Wrong email or password.');
    case 'auth/too-many-requests':
      return new Error('Too many attempts. Wait a minute and try again.');
    case 'auth/network-request-failed':
      return new Error('No connection. Check the internet and try again.');
    case 'permission-denied':
    case 'firestore/permission-denied':
      return new Error('This account is not on the team list. Add its email under team_members in Firestore (see FIREBASE.md).');
    case 'unavailable':
      return new Error('Firestore is unreachable right now. Changes are saved on this device and will upload later.');
    default:
      return new Error(e.message.replace(/^Firebase: /, ''));
  }
}

const numberKey = (d: Pick<DocRecord, 'type' | 'year' | 'seq'>) => `${d.type}_${d.year}_${String(d.seq).padStart(6, '0')}`;

/** True when the cloud copy's timestamp is later than ours. */
const newer = (remote: unknown, local: string) => (Date.parse(String(remote)) || 0) > (Date.parse(local) || 0);

export function createFirebaseBackend(): CloudBackend {
  const env = import.meta.env;
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  });
  // initializeAuth without a popup/redirect resolver works the same in browsers, Tauri and the Android app.
  const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  const user = (u: User | null): CloudUser | null => (u ? { id: u.uid, email: u.email ?? '' } : null);

  return {
    kind: 'firebase',
    liveIncludesSnapshot: true,

    async currentUser() {
      await auth.authStateReady();
      return user(auth.currentUser);
    },

    onAuthChange(cb) {
      onAuthStateChanged(auth, (u) => cb(user(u)));
    },

    async signIn(email, password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        throw friendly(e);
      }
    },

    async signOut() {
      await signOut(auth);
    },

    async putDoc(d) {
      const key = numberKey(d);
      const docRef = doc(db, 'documents', d.id);
      const numRef = doc(db, 'numbers', key);
      try {
        await runTransaction(db, async (tx) => {
          const [num, existing] = await Promise.all([tx.get(numRef), tx.get(docRef)]);
          // Last write wins: never replace a newer copy saved from another device.
          if (existing.exists() && newer(existing.data().updated_at, d.updated_at)) return;
          if (num.exists() && num.data().docId !== d.id) throw new Error(TAKEN);
          // Renumbered since the last upload: free the old number.
          const prevKey = existing.exists() ? (existing.data().numberKey as string | undefined) : undefined;
          if (prevKey && prevKey !== key) tx.delete(doc(db, 'numbers', prevKey));
          if (!num.exists()) tx.set(numRef, { docId: d.id });
          tx.set(docRef, { ...toRow(d), numberKey: key, updated_by: auth.currentUser?.uid ?? null });
        });
        return 'ok';
      } catch (e) {
        if (e instanceof Error && e.message === TAKEN) return 'taken';
        throw friendly(e);
      }
    },

    async putSettings(settings) {
      const ref = doc(db, 'settings', 'company');
      try {
        await runTransaction(db, async (tx) => {
          const existing = await tx.get(ref);
          if (existing.exists() && newer(existing.data().updated_at, settings.updated_at)) return;
          tx.set(ref, { data: settings, updated_at: settings.updated_at });
        });
      } catch (e) {
        throw friendly(e);
      }
    },

    async maxSeq(type: DocType, year: number) {
      // Two equality filters need no composite index.
      const snap = await getDocs(query(collection(db, 'documents'), where('type', '==', type), where('year', '==', year)));
      return snap.docs.reduce((m, s) => Math.max(m, (s.data().seq as number) || 0), 0);
    },

    async pullAll() {
      try {
        const [docsSnap, settingsSnap] = await Promise.all([getDocs(collection(db, 'documents')), getDoc(doc(db, 'settings', 'company'))]);
        return {
          docs: docsSnap.docs.map((s) => toDocRecord(s.data())),
          settings: settingsSnap.exists() ? (settingsSnap.data() as RemoteSettings) : null,
        };
      } catch (e) {
        throw friendly(e);
      }
    },

    subscribe(h) {
      let first = true;
      const offDocs = onSnapshot(
        collection(db, 'documents'),
        (snap) => {
          snap.docChanges().forEach((c) => c.type !== 'removed' && h.doc(toDocRecord(c.doc.data())));
          if (first) {
            first = false;
            h.ready();
          }
        },
        (e) => h.error(friendly(e)),
      );
      const offSettings = onSnapshot(
        doc(db, 'settings', 'company'),
        (s) => s.exists() && h.settings(s.data() as RemoteSettings),
        (e) => h.error(friendly(e)),
      );
      return () => {
        offDocs();
        offSettings();
      };
    },
  };
}
