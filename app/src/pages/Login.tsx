import { CloudOff, Loader2, PenLine, FileCheck2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { Logo } from '../components/Logo';
import { Button, EASE, Label } from '../components/ui';
import { signIn } from '../lib/store';

const FEATURES = [
  { icon: PenLine, title: 'Signed in person', body: 'Clients and receivers sign on the screen. The signature goes straight onto the PDF.' },
  { icon: CloudOff, title: 'Works offline', body: 'Everything saves on the device first and uploads as soon as there is a connection.' },
  { icon: FileCheck2, title: 'The same PDF everywhere', body: 'Documents are built on the device with real text, so they print identically on any machine.' },
];

/** A document sheet being signed: the signature draws itself once, like a pen on paper. */
function SheetIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
      className="relative mx-auto w-full max-w-sm"
    >
      <div className="absolute inset-0 translate-x-4 translate-y-3 rotate-3 rounded-md border border-line bg-surface/70" />
      <div className="relative rounded-md border border-line bg-white p-7 text-[#1b1a18] shadow-paper">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold tracking-[-0.02em]">Delivery Note</p>
            <p className="mt-0.5 font-mono text-[0.625rem] text-[#7a776f]">VTMS/DN/2026/0042</p>
          </div>
          <span className="h-1 w-8 rounded-full bg-[#ef7d1a]" />
        </div>
        <div className="mt-6 space-y-2.5">
          {[0.92, 0.7, 0.84, 0.55].map((w, i) => (
            <div key={i} className="flex gap-3">
              <span className="h-2 w-4 rounded-sm bg-[#e6e4de]" />
              <span className="h-2 rounded-sm bg-[#efeee9]" style={{ width: `${w * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-8">
          <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-[#a8a59d]">Received by</p>
          <svg viewBox="0 0 220 56" className="mt-1 h-14 w-48">
            <motion.path
              d="M6 40c10-20 18-30 24-26 6 4-8 28-2 30 7 2 14-26 22-24 7 2-2 22 5 22 8 0 12-18 20-17 6 1 0 14 6 14 9 0 14-13 22-12 6 1 2 10 9 10 10 0 19-9 30-11 10-2 20 0 30-3"
              fill="none"
              stroke="#1b1a18"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.8, ease: [0.45, 0, 0.25, 1], delay: 0.9 }}
            />
          </svg>
          <div className="h-px bg-[#d6d3cb]" />
          <p className="mt-1.5 text-[0.5625rem] text-[#a8a59d]">Signed in person · 14:32</p>
        </div>
      </div>
    </motion.div>
  );
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[1.1fr_1fr]">
      {/* story side */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-canvas px-12 py-10 lg:flex xl:px-16">
        <Logo className="h-12 w-auto self-start text-ink" />
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="max-w-xl text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.035em] text-ink xl:text-[2.75rem]"
          >
            Every quotation, invoice and delivery note. On every device.
          </motion.h1>
          <div className="mt-12 grid items-center gap-12 xl:grid-cols-[minmax(0,1fr)_16rem]">
            <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } } }} className="max-w-sm space-y-5">
              {FEATURES.map((f) => (
                <motion.li
                  key={f.title}
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
                  className="flex gap-3.5"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-2">
                    <f.icon className="size-4" strokeWidth={1.8} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink">{f.title}</span>
                    <span className="block text-[0.8125rem] leading-relaxed text-ink-3">{f.body}</span>
                  </span>
                </motion.li>
              ))}
            </motion.ul>
            <div className="hidden xl:block">
              <SheetIllustration />
            </div>
          </div>
        </div>
        <p className="text-xs text-ink-4">Vector Technical · Maintenance &amp; General Supplies</p>
      </aside>

      {/* form side */}
      <main className="flex items-center justify-center px-6 py-12">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
          className="w-full max-w-sm"
        >
          <Logo className="mb-10 h-14 w-auto text-ink lg:hidden" />
          <h2 className="text-2xl font-semibold tracking-[-0.025em] text-ink">Sign in to Doc Hub</h2>
          <p className="mt-1.5 text-sm text-ink-3">Use the email and password your administrator set up for you.</p>
          <div className="mt-8 space-y-4">
            <label className="block">
              <Label>Email</Label>
              <input className="field h-10" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <Label>Password</Label>
              <input className="field h-10" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
          </div>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-[0.8125rem] text-red-700 dark:text-red-300">
              {error}
            </motion.p>
          )}
          <Button variant="primary" type="submit" disabled={busy} className="mt-6 h-10 w-full">
            {busy && <Loader2 className="size-4 animate-spin" />} Sign in
          </Button>
          <p className="mt-6 text-center text-xs text-ink-4">Your documents stay on this device and sync when you're online.</p>
        </motion.form>
      </main>
    </div>
  );
}
