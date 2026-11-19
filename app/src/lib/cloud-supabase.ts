import { createClient, type User } from '@supabase/supabase-js';
import { toDocRecord, toRow, type CloudBackend, type CloudUser, type RemoteSettings } from './cloud';

/** Supabase backend: Postgres tables from supabase/schema.sql, realtime via postgres_changes. */
export function createSupabaseBackend(): CloudBackend {
  const supabase = createClient(import.meta.env.VITE_SUPABASE_URL as string, import.meta.env.VITE_SUPABASE_ANON_KEY as string, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  const user = (u: User | null | undefined): CloudUser | null => (u ? { id: u.id, email: u.email ?? '' } : null);

  return {
    kind: 'supabase',
    liveIncludesSnapshot: false,

    async currentUser() {
      const { data } = await supabase.auth.getSession();
      return user(data.session?.user);
    },

    onAuthChange(cb) {
      supabase.auth.onAuthStateChange((_event, session) => cb(user(session?.user)));
    },

    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
    },

    async signOut() {
      await supabase.auth.signOut();
    },

    async putDoc(doc) {
      const { error } = await supabase.from('documents').upsert(toRow(doc));
      if (error?.code === '23505') return 'taken';
      if (error) throw error;
      return 'ok';
    },

    async putSettings(settings) {
      const { error } = await supabase.from('settings').upsert({ id: 'company', data: settings, updated_at: settings.updated_at });
      if (error) throw error;
    },

    async maxSeq(type, year) {
      const { data } = await supabase.from('documents').select('seq').eq('type', type).eq('year', year).order('seq', { ascending: false }).limit(1);
      return data?.[0]?.seq ?? 0;
    },

    async pullAll() {
      const docs = [];
      const page = 1000;
      for (let from = 0; ; from += page) {
        const { data, error } = await supabase.from('documents').select('*').order('created_at').range(from, from + page - 1);
        if (error) throw error;
        docs.push(...data.map(toDocRecord));
        if (data.length < page) break;
      }
      const { data: s, error } = await supabase.from('settings').select('*').eq('id', 'company').maybeSingle();
      if (error) throw error;
      return { docs, settings: (s as RemoteSettings | null) ?? null };
    },

    subscribe(h) {
      const channel = supabase
        .channel('doc-hub')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, (p) => {
          if (p.new && 'id' in p.new) h.doc(toDocRecord(p.new));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (p) => {
          if (p.new && 'data' in p.new) h.settings(p.new as RemoteSettings);
        })
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') h.ready();
          else if (status === 'CHANNEL_ERROR') h.error(err ?? new Error('Realtime connection failed'));
        });
      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}
