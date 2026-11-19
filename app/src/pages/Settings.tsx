import { CloudOff, Download, ExternalLink, LogOut, Monitor, Moon, RefreshCw, Sun } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { SyncDot } from '../components/Shell';
import { Button, Label, NumberInput, PageHeader, Segmented } from '../components/ui';
import { isNativeApp } from '../lib/platform';
import { signOut, syncNow, updateSettings, useSettings, useSync } from '../lib/store';
import { setTheme, useTheme, type ThemePref } from '../lib/theme';
import type { Settings as S } from '../lib/types';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferredInstall: InstallEvent | null = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstall = e as InstallEvent;
});

const FIELDS: { key: keyof S; label: string; hint?: string; wide?: boolean; area?: boolean }[] = [
  { key: 'companyName', label: 'Company name' },
  { key: 'tagline', label: 'Tagline' },
  { key: 'addressLine1', label: 'Address' },
  { key: 'addressLine2', label: 'Town / country' },
  { key: 'poBox', label: 'P.O. Box' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email', wide: true },
  { key: 'paymentDetails', label: 'Payment details', hint: 'Shown on invoices, e.g. bank or M-Pesa paybill', wide: true, area: true },
];

/** Settings row: what it is on the left, the controls on the right (stacks on phones). */
function Row({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line py-8 first:border-t-0 first:pt-2 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-10">
      <div>
        <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-3">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

const ENV_EXAMPLE = `VITE_FIREBASE_API_KEY=…
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_APP_ID=1:…:web:…`;

export function Settings() {
  const settings = useSettings();
  const sync = useSync();
  const theme = useTheme();
  const [canInstall, setCanInstall] = useState(!!deferredInstall);
  const standalone = window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    const on = () => setCanInstall(true);
    window.addEventListener('beforeinstallprompt', on);
    return () => window.removeEventListener('beforeinstallprompt', on);
  }, []);

  const install = async () => {
    await deferredInstall?.prompt();
    deferredInstall = null;
    setCanInstall(false);
  };

  const tone = !sync.online ? 'warn' : sync.phase === 'error' ? 'bad' : sync.phase === 'syncing' || sync.pending ? 'busy' : 'ok';

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-10 md:py-10">
      <PageHeader eyebrow="Workspace" title="Settings" />

      <div className="mt-8">
        <Row title="Company details" description="Printed in the header of every document and on the cover page.">
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.key} className={f.wide ? 'sm:col-span-2' : undefined}>
                <Label hint={f.hint}>{f.label}</Label>
                {f.area ? (
                  <textarea className="field min-h-[4rem] [field-sizing:content]" rows={2} value={settings[f.key] as string} onChange={(e) => updateSettings({ [f.key]: e.target.value })} />
                ) : (
                  <input className="field" value={settings[f.key] as string} onChange={(e) => updateSettings({ [f.key]: e.target.value })} />
                )}
              </label>
            ))}
          </div>
        </Row>

        <Row title="Defaults" description="Used when you create a new document. Existing documents keep their own values.">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <Label hint="New documents only">Number prefix</Label>
              <input className="field font-mono uppercase" value={settings.prefix} onChange={(e) => updateSettings({ prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })} />
            </label>
            <label>
              <Label>VAT rate (%)</Label>
              <NumberInput value={settings.vatRate} onChange={(vatRate) => updateSettings({ vatRate })} />
            </label>
            <label>
              <Label>Authorized name</Label>
              <input className="field" placeholder="Pre-filled on new documents" value={settings.authorizedName} onChange={(e) => updateSettings({ authorizedName: e.target.value })} />
            </label>
            <label>
              <Label hint="Statements">Sign-off</Label>
              <input className="field" value={settings.signOff} onChange={(e) => updateSettings({ signOff: e.target.value })} />
            </label>
          </div>
        </Row>

        <Row title="Appearance" description="Follows your device's light or dark mode unless you pick one. Applies to this device only.">
          <Segmented<ThemePref>
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'system', label: <span className="flex items-center gap-1.5"><Monitor className="size-3.5" /> System</span> },
              { value: 'light', label: <span className="flex items-center gap-1.5"><Sun className="size-3.5" /> Light</span> },
              { value: 'dark', label: <span className="flex items-center gap-1.5"><Moon className="size-3.5" /> Dark</span> },
            ]}
          />
        </Row>

        <Row title="Sync" description="Keeps every phone and computer on the same documents, live.">
          {sync.mode === 'local' ? (
            <div className="rounded-xl border border-line">
              <div className="flex gap-3 p-4">
                <CloudOff className="mt-0.5 size-5 shrink-0 text-ink-3" />
                <div className="text-sm">
                  <p className="font-medium text-ink">Saved on this device only</p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-3">
                    Connect your Firebase project to sync. Create a web app in the Firebase console, put its keys in <code className="font-mono text-xs text-ink-2">app/.env</code>, and rebuild. The full steps
                    are in <code className="font-mono text-xs text-ink-2">app/FIREBASE.md</code>.
                  </p>
                </div>
              </div>
              <pre className="scroll-thin overflow-x-auto border-t border-line bg-canvas/60 px-4 py-3 font-mono text-xs leading-relaxed text-ink-2">{ENV_EXAMPLE}</pre>
              <div className="border-t border-line px-4 py-3">
                <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-accent-ink hover:underline">
                  Open Firebase console <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-line">
              <dl className="divide-y divide-line text-sm">
                {[
                  ['Service', sync.backend === 'firebase' ? 'Firebase' : 'Supabase'],
                  ['Signed in as', sync.user?.email ?? '—'],
                  [
                    'Status',
                    <span key="s" className="flex items-center gap-2">
                      <SyncDot tone={tone} />
                      {!sync.online ? 'Offline' : sync.phase === 'error' ? 'Sync issue' : sync.phase === 'syncing' || sync.pending ? 'Syncing' : 'Up to date'}
                    </span>,
                  ],
                  ['Waiting to upload', String(sync.pending)],
                  ['Last synced', sync.lastSynced ? new Date(sync.lastSynced).toLocaleTimeString() : '—'],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <dt className="text-ink-3">{k}</dt>
                    <dd className="truncate text-right text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              {sync.error && <p className="border-t border-line bg-red-500/8 px-4 py-2.5 text-[0.8125rem] text-red-700 dark:text-red-300">{sync.error}</p>}
              <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
                <Button size="sm" onClick={() => syncNow()} disabled={!sync.online}>
                  <RefreshCw className="size-3.5" /> Sync now
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (!sync.pending || confirm(`${sync.pending} change(s) haven't uploaded yet and will be lost. Sign out anyway?`)) signOut();
                  }}
                >
                  <LogOut className="size-3.5" /> Sign out
                </Button>
              </div>
            </div>
          )}
        </Row>

        {!isNativeApp && (
          <Row title="Install app" description="Run Doc Hub in its own window with an icon, like any other app.">
            {standalone ? (
              <p className="text-sm text-ink-2">Installed. You&apos;re running Doc Hub as an app.</p>
            ) : canInstall ? (
              <Button variant="primary" onClick={install}>
                <Download className="size-4" /> Install Doc Hub
              </Button>
            ) : (
              <ul className="space-y-2 text-[0.8125rem] text-ink-3">
                <li>
                  <span className="font-medium text-ink">Windows / Mac (Chrome or Edge):</span> click the install icon at the right of the address bar.
                </li>
                <li>
                  <span className="font-medium text-ink">Android (Chrome):</span> menu ⋮ → <em>Add to Home screen</em> → <em>Install</em>.
                </li>
                <li>
                  <span className="font-medium text-ink">Mac Safari:</span> File → <em>Add to Dock</em>.
                </li>
              </ul>
            )}
          </Row>
        )}
      </div>
    </div>
  );
}
