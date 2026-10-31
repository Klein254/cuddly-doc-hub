import clsx from 'clsx';
import { go } from '../lib/router';
import { useSync } from '../lib/store';

export function SyncBadge() {
  const s = useSync();
  let tone: 'ok' | 'busy' | 'warn' | 'bad' | 'off' = 'ok';
  let text = 'Synced';
  if (s.mode === 'local') {
    tone = 'off';
    text = 'This device';
  } else if (!s.online) {
    tone = 'warn';
    text = s.pending ? `Offline · ${s.pending} waiting` : 'Offline';
  } else if (s.phase === 'error') {
    tone = 'bad';
    text = 'Sync issue';
  } else if (s.phase === 'syncing' || s.pending) {
    tone = 'busy';
    text = 'Syncing';
  }
  return (
    <button
      onClick={() => go('settings')}
      title={s.error ?? (s.lastSynced ? `Last synced ${new Date(s.lastSynced).toLocaleTimeString()}` : undefined)}
      className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 text-xs font-medium text-white/70 hover:bg-white/[0.08]"
    >
      <span className="relative flex size-2">
        {tone === 'busy' && <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-300/70" />}
        <span
          className={clsx(
            'relative inline-flex size-2 rounded-full',
            tone === 'ok' && 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
            tone === 'busy' && 'bg-amber-300',
            tone === 'warn' && 'bg-amber-500',
            tone === 'bad' && 'bg-red-400',
            tone === 'off' && 'bg-white/40',
          )}
        />
      </span>
      {text}
    </button>
  );
}
