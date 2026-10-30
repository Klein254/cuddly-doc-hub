import React, { useRef } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

type SpotlightCardProps = HTMLMotionProps<'div'> & { dark?: boolean };

// Card with an orange glow that follows the cursor.
export default function SpotlightCard({ className = '', children, dark = false, ...rest }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <motion.div ref={ref} onPointerMove={onMove} className={`relative overflow-hidden group ${className}`} {...rest}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), ${
            dark ? 'rgba(255,105,0,0.18)' : 'rgba(255,105,0,0.10)'
          }, transparent 60%)`,
        }}
      />
      <div className="relative h-full">{children as React.ReactNode}</div>
    </motion.div>
  );
}
