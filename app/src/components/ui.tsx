import clsx from 'clsx';
import { Check, ChevronDown, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import type { DocStatus } from '../lib/types';

/** Apple-style ease: quick start, long soft landing. */
export const EASE = [0.16, 1, 0.3, 1] as const;

// ------------------------------------------------------------------ layout

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={clsx('panel', className)}>{children}</section>;
}

/** Heading row inside a panel: title, optional one-line description, optional action on the right. */
export function SectionHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[0.8125rem] text-ink-3">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, meta, actions }: { eyebrow?: ReactNode; title: ReactNode; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink md:text-[2rem]">{title}</h1>
        {meta && <p className="mt-2 text-sm text-ink-3">{meta}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

// ------------------------------------------------------------------ buttons

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'icon' | 'icon-sm';
};

export function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...rest }: BtnProps) {
  return (
    <button
      type={type}
      {...rest}
      className={clsx(
        'inline-flex shrink-0 select-none items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap',
        'transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-45',
        size === 'icon' && 'size-9',
        size === 'icon-sm' && 'size-7 rounded-md',
        size === 'sm' && 'h-8 px-3 text-[0.8125rem]',
        size === 'md' && 'h-9 px-3.5 text-sm',
        variant === 'primary' && 'bg-ink text-on-ink shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:bg-ink/88',
        variant === 'secondary' && 'border border-line-strong bg-surface text-ink shadow-panel hover:bg-hover',
        variant === 'ghost' && 'text-ink-2 hover:bg-hover hover:text-ink',
        variant === 'danger' && 'text-red-600 hover:bg-red-500/10 dark:text-red-400',
        className,
      )}
    />
  );
}

// ------------------------------------------------------------------ form bits

export function Label({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between gap-3 text-[0.8125rem] font-medium text-ink-2">
      {children}
      {hint && <span className="text-xs font-normal text-ink-4">{hint}</span>}
    </span>
  );
}

/** Numeric input that lets people type freely ("1,500.5", "") and commits a clean number. */
export function NumberInput({
  value,
  onChange,
  className,
  ...rest
}: { value: number; onChange: (n: number) => void; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
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

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm text-ink">{label}</span>
        {description && <span className="block text-[0.8125rem] text-ink-3">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx('relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200', checked ? 'bg-accent' : 'bg-line-strong')}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 700, damping: 40 }}
          className={clsx('absolute top-0.5 size-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)]', checked ? 'right-0.5' : 'left-0.5')}
        />
      </button>
    </div>
  );
}

/** Segmented control with a sliding thumb (Framer-style micro-interaction). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" className={clsx('inline-flex rounded-lg bg-sunken p-0.5 ring-1 ring-line ring-inset', className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={clsx(
              'relative rounded-md font-medium capitalize transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3.5 text-[0.8125rem]',
              on ? 'text-ink' : 'text-ink-3 hover:text-ink',
            )}
          >
            {on && (
              <motion.span
                layoutId={id}
                transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                className="absolute inset-0 rounded-md bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.08)] ring-1 ring-line"
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ status

const STATUS_DOT: Record<DocStatus, string> = {
  draft: 'bg-ink-4',
  sent: 'bg-sky-500',
  accepted: 'bg-emerald-500',
  paid: 'bg-emerald-500',
  delivered: 'bg-accent',
};

export function StatusDot({ status }: { status: DocStatus }) {
  return <span className={clsx('inline-block size-1.5 shrink-0 rounded-full', STATUS_DOT[status])} />;
}

export function StatusChip({ status }: { status: DocStatus }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-xs font-medium capitalize text-ink-2">
      <StatusDot status={status} />
      {status}
    </span>
  );
}

// ------------------------------------------------------------------ menus

export type MenuItem = { label: ReactNode; icon?: ReactNode; onSelect: () => void; danger?: boolean; checked?: boolean; hint?: ReactNode };

/** Dropdown menu: closes on outside click, Escape or selection; scales in from its corner. */
export function Menu({
  trigger,
  items,
  align = 'end',
  width = 'w-56',
  label,
}: {
  trigger: (p: { open: boolean; toggle: () => void }) => ReactNode;
  items: (MenuItem | 'divider')[];
  align?: 'start' | 'end';
  width?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={label}
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -2, transition: { duration: 0.1 } }}
            transition={{ duration: 0.18, ease: EASE }}
            style={{ transformOrigin: align === 'end' ? 'top right' : 'top left' }}
            className={clsx('absolute top-[calc(100%+6px)] z-50 rounded-xl border border-line bg-surface p-1 shadow-pop', width, align === 'end' ? 'right-0' : 'left-0')}
          >
            {items.map((it, i) =>
              it === 'divider' ? (
                <div key={i} className="my-1 h-px bg-line" />
              ) : (
                <button
                  key={i}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    it.onSelect();
                  }}
                  className={clsx(
                    'flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[0.8125rem] transition-colors hover:bg-hover',
                    it.danger ? 'text-red-600 dark:text-red-400' : 'text-ink',
                  )}
                >
                  {it.icon && <span className="flex size-4 items-center justify-center text-ink-3 [&>svg]:size-4">{it.icon}</span>}
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.hint && <span className="text-xs text-ink-4">{it.hint}</span>}
                  {it.checked && <Check className="size-3.5 text-ink" />}
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Small select built on Menu, for filters ("Status: Any"). */
export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  onChange: (v: T) => void;
  label?: string;
  className?: string;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <Menu
      label={label}
      align="start"
      width="w-48"
      items={options.map((o) => ({ label: o.label, icon: o.icon, checked: o.value === value, onSelect: () => onChange(o.value) }))}
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className={clsx('inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2.5 text-[0.8125rem] text-ink shadow-panel transition-colors hover:bg-hover', className)}
        >
          {current?.icon}
          {current?.label}
          <ChevronDown className={clsx('size-3.5 text-ink-3 transition-transform duration-200', open && 'rotate-180')} />
        </button>
      )}
    />
  );
}

// ------------------------------------------------------------------ dialog

/** Centered dialog on larger screens, bottom sheet on phones. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ duration: 0.32, ease: EASE }}
            className={clsx(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-pop sm:rounded-2xl',
              wide ? 'sm:max-w-2xl' : 'sm:max-w-md',
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.01em] text-ink">{title}</h2>
                {description && <p className="mt-0.5 text-[0.8125rem] text-ink-3">{description}</p>}
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close" className="-mr-1.5">
                <X className="size-4" />
              </Button>
            </div>
            <div className="scroll-thin overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="pb-safe flex flex-wrap items-center justify-end gap-2 border-t border-line bg-canvas/60 px-5 py-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ------------------------------------------------------------------ toast

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let setToastGlobal: ((t: { id: number; msg: string } | null) => void) | null = null;
let toastId = 0;

export const toast = (msg: string) => {
  setToastGlobal?.({ id: ++toastId, msg });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => setToastGlobal?.(null), 3200);
};

export function Toaster() {
  const [t, setT] = useState<{ id: number; msg: string } | null>(null);
  useEffect(() => {
    setToastGlobal = setT;
    return () => {
      setToastGlobal = null;
    };
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 md:bottom-6">
      <AnimatePresence mode="popLayout">
        {t && (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="rounded-lg bg-ink px-4 py-2.5 text-[0.8125rem] font-medium text-on-ink shadow-pop"
          >
            {t.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------------ misc

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-line bg-canvas text-ink-3 [&>svg]:size-5">{icon}</div>}
      <p className="text-sm font-medium text-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-[0.8125rem] text-ink-3">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
