import React, { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react';

// Isometric "exploded building": each slab is one building system we look after.
// Scrolling separates the layers, then highlights each in turn (top to bottom).

const layers = [
  { name: 'Medical Gas', detail: 'Oxygen, vacuum and gas pipelines, manifolds and outlets for clinical areas.', pattern: 'gas' },
  { name: 'HVAC & Steam', detail: 'Ventilation, air quality and temperature control, plus steam for sterilisation and hot water.', pattern: 'hvac' },
  { name: 'Power & Electrical', detail: 'Generators, UPS, switchgear and electrical installations.', pattern: 'power' },
  { name: 'Plumbing & Drainage', detail: 'Water supply, pumps, tanks, and hydro-jet drain cleaning.', pattern: 'water' },
  { name: 'Structure & Fabrication', detail: 'General building maintenance, civil works and stainless steel fabrication.', pattern: 'structure' },
] as const;

const W = 230;
const H = 115;
const T = 16;
const CX = 300;
const BASE = 600;

function Pattern({ kind, active }: { kind: (typeof layers)[number]['pattern']; active: boolean }) {
  const stroke = active ? '#ff6900' : '#525252';
  const common = { fill: 'none', stroke, strokeWidth: 1.6, vectorEffect: 'non-scaling-stroke' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'gas':
      return (
        <g>
          <path d="M10 20 H90 M10 50 H90 M10 80 H90 M30 20 V80 M70 20 V80" {...common} />
          {[[30, 20], [70, 20], [30, 50], [70, 50], [30, 80], [70, 80], [50, 50]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={4} fill={active ? '#ff6900' : '#a3a3a3'} stroke="none" />
          ))}
        </g>
      );
    case 'hvac':
      return (
        <g>
          <rect x={10} y={15} width={55} height={18} {...common} />
          <rect x={47} y={15} width={18} height={70} {...common} />
          <circle cx={78} cy={70} r={12} {...common} />
          <path d="M78 58 V82 M66 70 H90" {...common} />
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M${15 + i * 10} 45 V60`} {...common} />)}
        </g>
      );
    case 'power':
      return (
        <g>
          <rect x={12} y={12} width={22} height={30} {...common} />
          <path d="M34 22 H60 V50 H88 M34 32 H50 V80 H70 M23 42 V70 H40" {...common} />
          {[[60, 50], [88, 50], [70, 80], [40, 70]].map(([x, y], i) => (
            <rect key={i} x={x - 4} y={y - 4} width={8} height={8} fill={active ? '#ff6900' : '#a3a3a3'} stroke="none" />
          ))}
        </g>
      );
    case 'water':
      return (
        <g>
          <path d="M8 30 H45 Q55 30 55 40 V70 Q55 80 65 80 H92 M30 30 V85 M75 10 V80" {...common} />
          <circle cx={30} cy={85} r={5} {...common} />
          <circle cx={75} cy={20} r={8} {...common} />
        </g>
      );
    case 'structure':
    default:
      return (
        <g>
          {[20, 40, 60, 80].map((v) => (
            <path key={v} d={`M${v} 8 V92 M8 ${v} H92`} {...common} strokeWidth={1} />
          ))}
          {[20, 40, 60, 80].flatMap((x) => [20, 40, 60, 80].map((y) => (
            <rect key={`${x}-${y}`} x={x - 3} y={y - 3} width={6} height={6} fill={active ? '#ff6900' : '#737373'} stroke="none" />
          )))}
        </g>
      );
  }
}

function Slab({ cy, active, kind, index }: { cy: number; active: boolean; kind: (typeof layers)[number]['pattern']; index: number }) {
  const top = `${CX},${cy - H} ${CX + W},${cy} ${CX},${cy + H} ${CX - W},${cy}`;
  const left = `${CX - W},${cy} ${CX},${cy + H} ${CX},${cy + H + T} ${CX - W},${cy + T}`;
  const right = `${CX},${cy + H} ${CX + W},${cy} ${CX + W},${cy + T} ${CX},${cy + H + T}`;
  // Map a 100x100 design square onto the isometric top face.
  const matrix = `matrix(${W / 100} ${H / 100} ${-W / 100} ${H / 100} ${CX} ${cy - H})`;
  return (
    <g>
      <polygon points={left} fill={active ? '#c2410c' : index % 2 ? '#d4d4d4' : '#c7c7c7'} />
      <polygon points={right} fill={active ? '#9a3412' : index % 2 ? '#b5b5b5' : '#a8a8a8'} />
      <polygon points={top} fill={active ? '#fff7ed' : '#fafafa'} stroke={active ? '#ff6900' : '#d4d4d4'} strokeWidth={1.5} />
      <g transform={matrix}>
        <Pattern kind={kind} active={active} />
      </g>
    </g>
  );
}

export default function SystemsStack() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 160, damping: 32 });
  const [p, setP] = useState(0);
  useMotionValueEvent(smooth, 'change', (v) => setP(Math.min(1, Math.max(0, v))));

  const explode = Math.min(1, p / 0.3);
  const e = 1 - Math.pow(1 - explode, 3);
  const gap = 6 + e * 74;
  const active = p < 0.3 ? -1 : Math.min(layers.length - 1, Math.floor(((p - 0.3) / 0.7) * layers.length));

  return (
    <section ref={ref} aria-labelledby="systems-heading" className="relative h-[320vh] bg-white">
      <div className="sticky top-0 h-[100svh] overflow-hidden flex items-center">
        <div className="container mx-auto max-w-7xl px-6 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center pt-24">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <span className="inline-flex items-center gap-3 text-orange-700 font-sans text-xs font-bold uppercase tracking-widest mb-3">
              <span className="w-8 h-px bg-orange-700" aria-hidden="true" /> One partner
            </span>
            <h2 id="systems-heading" className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tight mb-6 lg:mb-10 leading-[0.95]">
              Every system <br className="hidden md:block" />in your building.
            </h2>
            <ol className="space-y-1">
              {layers.map((l, i) => {
                const on = i === active;
                return (
                  <li key={l.name} className={`border-l-2 pl-4 py-1.5 lg:py-2.5 transition-colors duration-300 ${on ? 'border-orange-500' : 'border-neutral-200'}`}>
                    <p className={`font-display font-bold uppercase tracking-tight transition-colors duration-300 text-base lg:text-lg ${on ? 'text-black' : 'text-neutral-500'}`}>
                      <span className="text-xs mr-3 font-sans tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                      {l.name}
                    </p>
                    <motion.p
                      initial={false}
                      animate={{ height: on ? 'auto' : 0, opacity: on ? 1 : 0 }}
                      className="overflow-hidden text-neutral-600 text-sm leading-relaxed max-w-sm"
                    >
                      <span className="block pt-1">{l.detail}</span>
                    </motion.p>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="lg:col-span-7 order-1 lg:order-2 flex justify-center">
            <svg
              viewBox="0 70 600 750"
              className="w-full max-w-[300px] sm:max-w-[420px] lg:max-w-[560px] h-auto max-h-[42svh] lg:max-h-[78svh]"
              role="img"
              aria-label="Illustration of a building separated into five layers: medical gas, HVAC and steam, power and electrical, plumbing and drainage, and structure."
            >
              <ellipse cx={CX} cy={BASE + H + 40} rx={W * 1.1} ry={H * 0.45} fill="#000" opacity={0.06} />
              {layers
                .map((l, i) => ({ l, i }))
                .reverse()
                .map(({ l, i }) => {
                  const level = layers.length - 1 - i; // 0 = bottom
                  const lift = i === active ? -14 : 0;
                  return (
                    <React.Fragment key={l.name}>
                      <Slab index={i} kind={l.pattern} active={i === active} cy={BASE - level * (T + gap) + lift} />
                    </React.Fragment>
                  );
                })}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
