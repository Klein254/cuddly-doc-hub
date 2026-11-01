import { CloudOff, Download, LogOut, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Card, CardTitle, Label, NumberInput } from '../components/ui';
import { isNativeApp } from '../lib/platform';
import { signOut, syncNow, updateSettings, useSettings, useSync } from '../lib/store';
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
  { key: 'paymentDetails', label: 'Payment details', hint: 'shown on invoices, e.g. bank or M-Pesa paybill', wide: true, area: true },
];

export function Settings() {
  const settings = useSettings();
  const sync = useSync();
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

  return (
    <div className="space-y-5">
      <div className="pt-2">
        <p className="font-brand text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-300/80">Workspace</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-white">Settings</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card className="p-4 md:p-6">
            <CardTitle>Company details on documents</CardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <label key={f.key} className={f.wide ? 'sm:col-span-2' : undefined}>
                  <Label hint={f.hint}>{f.label}</Label>
                  {f.area ? (
                    <textarea
                      className="field min-h-[4rem] [field-sizing:content]"
                      rows={2}
                      value={settings[f.key] as string}
                      onChange={(e) => updateSettings({ [f.key]: e.target.value })}
                    />
                  ) : (
                    <input className="field" value={settings[f.key] as string} onChange={(e) => updateSettings({ [f.key]: e.target.value })} />
                  )}
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <CardTitle>Defaults</CardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <Label hint="new documents only">Number prefix</Label>
                <input
                  className="field uppercase"
                  value={settings.prefix}
                  onChange={(e) => updateSettings({ prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
                />
              </label>
              <label>
                <Label>VAT rate (%)</Label>
                <NumberInput value={settings.vatRate} onChange={(vatRate) => updateSettings({ vatRate })} />
              </label>
              <label>
                <Label>Authorized name</Label>
                <input
                  className="field"
                  placeholder="Pre-filled on new documents"
                  value={settings.authorizedName}
                  onChange={(e) => updateSettings({ authorizedName: e.target.value })}
                />
              </label>
              <label>
                <Label hint="statements">Sign-off</Label>
                <input className="field" value={settings.signOff} onChange={(e) => updateSettings({ signOff: e.target.value })} />
              </label>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-4 md:p-6">
            <CardTitle>Sync</CardTitle>
            {sync.mode === 'local' ? (
              <div className="flex gap-3 text-sm text-white/60">
                <CloudOff className="mt-0.5 size-5 shrink-0 text-white/40" />
                <p>
                  Documents are saved on this device only. Add your Supabase keys to <code className="text-amber-200/80">.env</code> to sync across every phone
                  and computer (see README).
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <dl className="space-y-2 text-white/60">
                  <div className="flex justify-between gap-4">
                    <dt>Signed in as</dt>
                    <dd className="truncate text-white/90">{sync.session?.user.email}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Connection</dt>
                    <dd className="text-white/90">{sync.online ? 'Online' : 'Offline'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Waiting to upload</dt>
                    <dd className="text-white/90">{sync.pending}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Last synced</dt>
                    <dd className="text-white/90">{sync.lastSynced ? new Date(sync.lastSynced).toLocaleTimeString() : '—'}</dd>
                  </div>
                </dl>
                {sync.error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-red-200">{sync.error}</p>}
                <div className="flex flex-wrap gap-2">
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
          </Card>

          {!isNativeApp && (
            <Card className="p-4 md:p-6">
              <CardTitle>Install app</CardTitle>
              {standalone ? (
                <p className="text-sm text-white/60">Installed. You&apos;re running Doc Hub as an app.</p>
              ) : canInstall ? (
                <Button variant="primary" onClick={install}>
                  <Download className="size-4" /> Install Doc Hub
                </Button>
              ) : (
                <ul className="space-y-2 text-sm text-white/60">
                  <li>
                    <span className="text-white/85">Windows / Mac (Chrome or Edge):</span> click the install icon at the right of the address bar.
                  </li>
                  <li>
                    <span className="text-white/85">Android (Chrome):</span> menu ⋮ → <em>Add to Home screen</em> → <em>Install</em>.
                  </li>
                  <li>
                    <span className="text-white/85">Mac Safari:</span> File → <em>Add to Dock</em>.
                  </li>
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
