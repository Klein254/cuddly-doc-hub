import { Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Logo } from '../components/Logo';
import { Button, Label } from '../components/ui';
import { signIn } from '../lib/store';

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
      setError((err as Error).message === 'Invalid login credentials' ? 'Wrong email or password.' : (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <form onSubmit={submit} className="glass-strong w-full max-w-sm rounded-[2rem] p-7">
        <Logo className="mx-auto h-16 w-auto" />
        <h1 className="mt-8 font-display text-3xl font-semibold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-white/50">Sign in to your documents. They stay in sync on every device.</p>
        <div className="mt-6 space-y-4">
          <label className="block">
            <Label>Email</Label>
            <input className="field" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <Label>Password</Label>
            <input className="field" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
        <Button variant="primary" type="submit" disabled={busy} className="mt-6 w-full">
          {busy && <Loader2 className="size-4 animate-spin" />} Sign in
        </Button>
      </form>
    </main>
  );
}
