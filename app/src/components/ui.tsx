import clsx from 'clsx';
import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import type { DocStatus } from '../lib/types';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={clsx('glass rounded-3xl', className)}>{children}</section>;
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-brand text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/45">{children}</h2>
      {action}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'quiet' | 'danger'; size?: 'sm' | 'md' | 'icon' };

export function Button({ variant = 'ghost', size = 'md', className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
        size === 'icon' ? 'size-9 text-sm' : size === 'sm' ? 'h-8 px-3.5 text-xs' : 'h-10 px-4.5 text-sm',
        variant === 'primary' &&
          'bg-gradient-to-b from-[#ffb93f] to-[#f08a1c] text-[#1a1006] shadow-[0_8px_24px_-8px_rgba(249,165,26,0.7),inset_0_1px_0_rgba(255,255,255,0.4)] hover:brightness-105',
        variant === 'ghost' && 'border border-white/10 bg-white/[0.05] text-white/85 hover:bg-white/[0.09]',
        variant === 'quiet' && 'text-white/60 hover:bg-white/[0.06] hover:text-white',
        variant === 'danger' && 'border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20',
        className,
      )}
    />
  );
}

export function Label({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between text-[0.72rem] font-medium tracking-wide text-white/50">
      {children}
      {hint && <span className="text-white/30">{hint}</span>}
    </span>
  );
}

/** Numeric input that lets people type freely ("1,500.5", "") and commits a clean number. */
export function NumberInput({ value, onChange, className, ...rest }: { value: number; onChange: (n: number) => void; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [text, setText] = useState(value ? String(value) : '');
  useEffect(() => {
    const parsed = parseFloat(text.replace(/,/g, '')) || 0;
    if (parsed !== value) setText(value ? String(value) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      {...rest}
      inputMode="decimal"
      className={clsx('field tabular-nums', className)}
      value={text}
      onChange={(e) => {
        const t = e.target.value.replace(/[^\d.,-]/g, '');
        setText(t);
        onChange(parseFloat(t.replace(/,/g, '')) || 0);
      }}
    />
  );
}

const STATUS_STYLE: Record<DocStatus, string> = {
  draft: 'bg-white/[0.06] text-white/60 ring-white/10',
  sent: 'bg-sky-400/10 text-sky-200 ring-sky-300/20',
  accepted: 'bg-emerald-400/10 text-emerald-200 ring-emerald-300/20',
  paid: 'bg-emerald-400/10 text-emerald-200 ring-emerald-300/20',
  delivered: 'bg-amber-400/10 text-amber-200 ring-amber-300/25',
};

export function StatusChip({ status }: { status: DocStatus }) {
  return <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium capitalize ring-1', STATUS_STYLE[status])}>{status}</span>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 text-sm text-white/75">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-brand' : 'bg-white/12')}
      >
        <span className={clsx('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', checked ? 'left-[1.375rem]' : 'left-0.5')} />
      </button>
    </label>
  );
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let setToastGlobal: ((t: string | null) => void) | null = null;

export const toast = (msg: string) => {
  setToastGlobal?.(msg);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => setToastGlobal?.(null), 3200);
};

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    setToastGlobal = setMsg;
    return () => {
      setToastGlobal = null;
    };
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-4 md:bottom-8">
      {msg && <div className="glass-strong rounded-full px-5 py-2.5 text-sm text-white/90">{msg}</div>}
    </div>
  );
}
