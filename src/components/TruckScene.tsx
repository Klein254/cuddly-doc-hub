import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from 'motion/react';

/*
 * Scroll-driven delivery scene. Everything is computed from one progress value p (0 → 1):
 *   0.00–0.14  truck reverses into the yard
 *   0.14–0.30  container handler reaches for the top container
 *   0.30–0.58  container is lifted, swung across and lowered onto the trailer
 *   0.58–0.66  boom returns to rest
 *   0.60–0.80  camera follows the truck as it drives off; day turns to night
 *   0.80–1.00  truck cruises with headlights on
 * World units: viewBox is 1600 wide, ground line at y = 560.
 */

const G = 560;
const CW = 260; // container width
const CH = 104; // container height
const STACKER_X = 140;
const STACK_X = 470;
const PIVOT = { x: STACKER_X + 92, y: G - 160 };
const REST_TIP = { x: 330, y: 170 };
const LIFT_Y = 150;
const TRUCK_PARK_X = 800;
const TRAILER_BED = 92;
const ORANGE = '#ff6900';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Piecewise eased interpolation between keyframe stops.
function keyframes(p: number, stops: number[], values: number[]) {
  if (p <= stops[0]) return values[0];
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i]) return lerp(values[i - 1], values[i], ease(seg(p, stops[i - 1], stops[i])));
  }
  return values[values.length - 1];
}

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(',')})`;
}

const steps = [
  { k: '01', title: 'Sourced.', body: 'Hardware, electrical, medical and kitchen equipment, sourced through our network of manufacturers and distributors.' },
  { k: '02', title: 'Loaded.', body: 'Packed, checked and loaded for dispatch to your project.' },
  { k: '03', title: 'Delivered.', body: 'Delivered directly to your site in Nairobi and beyond.' },
  { k: '04', title: 'Installed & maintained.', body: 'Our technicians can install what we supply, then keep it running with scheduled maintenance.' },
];

function Wheel({ cx, cy, r, rot, dark }: { cx: number; cy: number; r: number; rot: number; dark: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      <circle r={r} fill="#111" stroke={mix('#111111', '#3a3a3a', dark)} strokeWidth={2} />
      <circle r={r * 0.55} fill="#3f3f46" />
      <circle r={r * 0.2} fill="#a3a3a3" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * r * 0.38} cy={Math.sin((a * Math.PI) / 180) * r * 0.38} r={r * 0.06} fill="#a3a3a3" />
      ))}
    </g>
  );
}

function Container({ x, y, fill, rib, label, labelFill, highlight = 0 }: {
  x: number; y: number; fill: string; rib: string; label?: string; labelFill?: string; highlight?: number;
}) {
  const ribs = [];
  for (let i = x + 18; i < x + CW - 28; i += 12) ribs.push(<line key={i} x1={i} y1={y + 9} x2={i} y2={y + CH - 9} />);
  return (
    <g>
      {highlight > 0 && (
        <rect x={x - 6} y={y - 6} width={CW + 12} height={CH + 12} rx={6} fill="none" stroke={ORANGE} strokeWidth={3} opacity={highlight} strokeDasharray="10 8" />
      )}
      <rect x={x} y={y} width={CW} height={CH} fill={fill} rx={2} />
      <g stroke={rib} strokeWidth={2} opacity={0.35}>{ribs}</g>
      <rect x={x} y={y} width={CW} height={8} fill="#000" opacity={0.2} />
      <rect x={x} y={y + CH - 8} width={CW} height={8} fill="#000" opacity={0.25} />
      {[[x, y], [x + CW - 12, y], [x, y + CH - 12], [x + CW - 12, y + CH - 12]].map(([cx, cy], i) => (
        <rect key={i} x={cx} y={cy} width={12} height={12} fill="#000" opacity={0.45} />
      ))}
      <rect x={x + CW - 24} y={y + 12} width={4} height={CH - 24} fill="#000" opacity={0.35} />
      <rect x={x + CW - 15} y={y + 12} width={4} height={CH - 24} fill="#000" opacity={0.35} />
      {label && (
        <text x={x + (CW - 28) / 2 + 4} y={y + CH / 2 + 7} textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight={700} fontSize={20} letterSpacing={2} fill={labelFill}>
          {label}
        </text>
      )}
    </g>
  );
}

function useIsNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

export default function TruckScene() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const narrow = useIsNarrow();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  const [p, setP] = useState(0);
  useMotionValueEvent(reduce ? scrollYProgress : smooth, 'change', (v) => setP(clamp(v)));

  // Deterministic night skyline.
  const skyline = useMemo(() => {
    const out: { x: number; w: number; h: number; lights: { x: number; y: number; on: boolean }[] }[] = [];
    let x = -200;
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    while (x < 3400) {
      const w = 60 + rnd() * 90;
      const h = 80 + rnd() * 200;
      const lights = [];
      for (let ly = G - h + 14; ly < G - 20; ly += 18) {
        for (let lx = x + 10; lx < x + w - 10; lx += 16) lights.push({ x: lx, y: ly, on: rnd() > 0.72 });
      }
      out.push({ x, w, h, lights });
      x += w + 6 + rnd() * 30;
    }
    return out;
  }, []);

  // --- Scene state from p ---------------------------------------------------
  const truckIn = ease(seg(p, 0, 0.14));
  const pan = ease(seg(p, 0.6, 0.8));
  const cruise = seg(p, 0.8, 1);
  const dark = ease(seg(p, 0.62, 0.8));
  const worldShift = -1400 * pan - 400 * cruise;
  // The camera follows the truck, so it only drifts from its parking spot to screen centre.
  const truckX = TRUCK_PARK_X + (1 - truckIn) * 950 - 260 * pan;
  // Truck distance travelled relative to the ground (for wheel spin and road dashes).
  const travel = truckX - worldShift;

  // Container path (world coords before the camera shift).
  let cx = STACK_X;
  let cy = G - 3 * CH;
  if (p >= 0.3 && p < 0.4) cy = lerp(G - 3 * CH, LIFT_Y, ease(seg(p, 0.3, 0.4)));
  else if (p >= 0.4 && p < 0.5) {
    const t = ease(seg(p, 0.4, 0.5));
    cx = lerp(STACK_X, TRUCK_PARK_X + 20, t);
    cy = LIFT_Y - Math.sin(t * Math.PI) * 18;
  } else if (p >= 0.5 && p < 0.58) {
    cx = TRUCK_PARK_X + 20;
    cy = lerp(LIFT_Y, G - TRAILER_BED - CH, ease(seg(p, 0.5, 0.58)));
  }
  const onTruck = p >= 0.58;
  const containerWorldX = onTruck ? truckX + 20 : cx + worldShift;
  const containerWorldY = onTruck ? G - TRAILER_BED - CH : cy;

  // Spreader tip (the point the boom holds).
  const grab = { x: STACK_X + CW / 2, y: G - 3 * CH - 26 };
  const release = { x: TRUCK_PARK_X + 20 + CW / 2, y: G - TRAILER_BED - CH - 26 };
  let tip = REST_TIP;
  if (p >= 0.14 && p < 0.3) {
    const t = ease(seg(p, 0.14, 0.3));
    tip = { x: lerp(REST_TIP.x, grab.x, t), y: lerp(REST_TIP.y, grab.y, t) - Math.sin(t * Math.PI) * 40 };
  } else if (p >= 0.3 && p < 0.58) {
    tip = { x: cx + CW / 2, y: cy - 26 };
  } else if (p >= 0.58 && p < 0.66) {
    const t = ease(seg(p, 0.58, 0.66));
    tip = { x: lerp(release.x, REST_TIP.x, t), y: lerp(release.y, REST_TIP.y, t) - Math.sin(t * Math.PI) * 60 };
  }
  const tipW = { x: tip.x + worldShift, y: tip.y };
  const pivotW = { x: PIVOT.x + worldShift, y: PIVOT.y };
  const boomAngle = (Math.atan2(tipW.y - pivotW.y, tipW.x - pivotW.x) * 180) / Math.PI;
  const boomLen = Math.hypot(tipW.x - pivotW.x, tipW.y - pivotW.y);
  const cylEnd = { x: pivotW.x + ((tipW.x - pivotW.x) / boomLen) * 150, y: pivotW.y + ((tipW.y - pivotW.y) / boomLen) * 150 };
  const gripping = p >= 0.3 && p < 0.58;

  const truckWheelRot = (travel / 32) * (180 / Math.PI);
  const stepIndex = p < 0.3 ? 0 : p < 0.6 ? 1 : p < 0.8 ? 2 : 3;

  // Camera: wide on desktop; on phones a narrower window that follows the action.
  const vbW = narrow ? 560 : 1600;
  const focusX = narrow
    ? keyframes(p, [0, 0.14, 0.22, 0.3, 0.5, 0.58, 0.66, 0.8], [1000, 960, 470, 560, 900, 940, 760, 806])
    : 800;
  const vbX = clamp(focusX - vbW / 2, 0, 1600 - vbW);
  const viewBox = `${vbX} 120 ${vbW} 520`;

  // Day → warm dusk → night, so the midpoint isn't a flat grey.
  const bg = dark < 0.5 ? mix('#f4f4f2', '#3b2414', dark * 2) : mix('#3b2414', '#0a0a0a', (dark - 0.5) * 2);
  const dayFade = Math.max(0, 1 - dark * 2.2);
  const night = dark > 0.35;
  const fg = night ? '#ffffff' : '#0a0a0a';
  const ground = mix('#e2e2df', '#141414', dark);

  return (
    <section ref={ref} aria-labelledby="delivery-heading" className="relative h-[460vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden" style={{ background: bg }}>
        {/* Ghost words */}
        <div aria-hidden="true" className="absolute inset-x-0 top-[30%] pointer-events-none select-none">
          <div
            className="whitespace-nowrap font-display font-bold uppercase leading-none text-[26vw] md:text-[20vw] text-outline"
            style={{ transform: `translateX(${8 - p * 45}%)`, WebkitTextStrokeColor: fg, opacity: 0.16 * dayFade }}
          >
            Supplies · Supplies
          </div>
          <div
            className="absolute top-0 whitespace-nowrap font-display font-bold uppercase leading-none text-[26vw] md:text-[20vw] text-outline"
            style={{ transform: `translateX(${30 - p * 45}%)`, WebkitTextStrokeColor: '#fff', opacity: 0.2 * dark * dark }}
          >
            Delivered · Delivered
          </div>
        </div>

        {/* Copy */}
        <div className="relative z-10 container mx-auto max-w-7xl px-6 md:px-16 pt-32 md:pt-36 transition-colors duration-500" style={{ color: fg }}>
          <p className="inline-flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-widest mb-4" style={{ color: night ? ORANGE : '#c2410c' }}>
            <span className="w-8 h-px" style={{ background: 'currentColor' }} aria-hidden="true" />
            Supply &amp; Delivery
          </p>
          <h2 id="delivery-heading" className="sr-only">From our suppliers to your site</h2>
          <ol className="sr-only">
            {steps.map((s) => (
              <li key={s.k}>{s.title} {s.body}</li>
            ))}
          </ol>
          <div aria-hidden="true" className="min-h-[170px] md:min-h-[210px] max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -24, filter: 'blur(6px)' }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="font-display font-bold text-sm tracking-widest opacity-60">{steps[stepIndex].k} / 04</span>
                <p className="font-display font-bold uppercase tracking-tight text-4xl md:text-6xl leading-[0.95] mt-2 mb-4">{steps[stepIndex].title}</p>
                <p className="font-sans text-sm md:text-base leading-relaxed max-w-md" style={{ color: night ? '#d4d4d4' : '#404040' }}>
                  {steps[stepIndex].body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Step indicator */}
        <div aria-hidden="true" className="absolute z-10 right-6 md:right-16 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-3">
          {steps.map((s, i) => (
            <div key={s.k} className="flex items-center gap-3 justify-end">
              <span className="font-display text-[11px] font-bold tracking-widest transition-opacity" style={{ color: fg, opacity: i === stepIndex ? 1 : 0.35 }}>{s.k}</span>
              <span className="h-[3px] rounded-full transition-all duration-500" style={{ width: i === stepIndex ? 36 : 14, background: i === stepIndex ? ORANGE : fg, opacity: i === stepIndex ? 1 : 0.25 }} />
            </div>
          ))}
        </div>

        {/* Scene */}
        <svg
          role="img"
          aria-label="Illustration: a Vector Technical container handler lifts a container onto a truck, which then drives off to deliver it at night."
          viewBox={viewBox}
          preserveAspectRatio="xMidYMax meet"
          className="absolute bottom-0 left-0 w-full h-[calc(100svh-300px)] md:h-[calc(100svh-230px)]"
        >
          <defs>
            <linearGradient id="beam" x1="0" x2="1">
              <stop offset="0" stopColor="#fff7e6" stopOpacity="0.85" />
              <stop offset="1" stopColor={ORANGE} stopOpacity="0" />
            </linearGradient>
            <radialGradient id="glow">
              <stop offset="0" stopColor={ORANGE} stopOpacity="0.5" />
              <stop offset="1" stopColor={ORANGE} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Night skyline (parallax) */}
          <g opacity={dark} transform={`translate(${worldShift * 0.25} 0)`}>
            {skyline.map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={G - b.h} width={b.w} height={b.h} fill="#161616" />
                {b.lights.map((l, j) => l.on && <rect key={j} x={l.x} y={l.y} width={6} height={8} fill={j % 5 === 0 ? ORANGE : '#fde68a'} opacity={0.55} />)}
              </g>
            ))}
          </g>

          {/* Warehouse backdrop (day) */}
          <g opacity={dayFade} transform={`translate(${worldShift * 0.6} 0)`}>
            <path d={`M 880 ${G} V 330 L 1180 270 L 1480 330 V ${G} Z`} fill="#e9e9e6" stroke="#d4d4d0" strokeWidth={2} />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={930 + i * 180} y={410} width={130} height={150} fill="#dcdcd8" />
                {Array.from({ length: 9 }).map((_, k) => (
                  <line key={k} x1={930 + i * 180} x2={1060 + i * 180} y1={420 + k * 15} y2={420 + k * 15} stroke="#cbcbc6" strokeWidth={2} />
                ))}
              </g>
            ))}
            <text x={1180} y={370} textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight={700} fontSize={22} letterSpacing={6} fill="#bdbdb8">VECTOR SUPPLY YARD</text>
            <rect x={760} y={250} width={8} height={310} fill="#d0d0cc" />
            <rect x={740} y={244} width={48} height={14} rx={3} fill="#c4c4bf" />
          </g>

          {/* Ground & road */}
          <rect x={-2000} y={G} width={6000} height={200} fill={ground} />
          <line x1={-2000} x2={4000} y1={G} y2={G} stroke={mix('#cfcfca', '#262626', dark)} strokeWidth={3} />
          <line
            x1={-2000} x2={4000} y1={G + 38} y2={G + 38}
            stroke={mix('#cfcfca', '#525252', dark)} strokeWidth={6} strokeDasharray="70 50"
            strokeDashoffset={-travel % 120}
            opacity={0.4 + dark * 0.6}
          />

          {/* Container stack */}
          <g transform={`translate(${worldShift} 0)`}>
            <Container x={STACK_X} y={G - CH} fill="#d4d4d4" rib="#737373" label="VT-02" labelFill="#404040" />
            <Container x={STACK_X} y={G - 2 * CH} fill="#1c1c1c" rib="#525252" label="VT-01" labelFill="#a3a3a3" />
          </g>

          {/* Container handler (reach stacker) */}
          <g transform={`translate(${STACKER_X + worldShift} ${G})`}>
            <rect x={0} y={-178} width={104} height={124} rx={10} fill="#c2410c" />
            {[0, 1, 2, 3].map((i) => <rect key={i} x={10} y={-160 + i * 24} width={84} height={6} fill="#000" opacity={0.18} />)}
            <path d="M 20 -125 H 340 Q 362 -125 364 -100 V -55 H 14 Z" fill={ORANGE} />
            <rect x={14} y={-70} width={350} height={16} fill="#000" opacity={0.25} />
            <rect x={70} y={-196} width={46} height={80} rx={6} fill="#9a3412" />
            <g>
              <rect x={204} y={-246} width={92} height={124} rx={8} fill="#171717" />
              <rect x={214} y={-236} width={72} height={58} rx={4} fill={mix('#bfd3dd', '#2b2b2b', dark)} />
              <rect x={198} y={-252} width={104} height={10} rx={4} fill="#171717" />
            </g>
            <rect x={330} y={-150} width={10} height={30} fill="#404040" />
            <text x={150} y={-88} fontFamily="Space Grotesk, sans-serif" fontWeight={700} fontSize={18} letterSpacing={3} fill="#000">VECTOR</text>
            <Wheel cx={70} cy={-46} r={46} rot={0} dark={dark} />
            <Wheel cx={300} cy={-46} r={46} rot={0} dark={dark} />
          </g>

          {/* Lift cylinder */}
          <line x1={STACKER_X + 220 + worldShift} y1={G - 120} x2={cylEnd.x} y2={cylEnd.y} stroke="#525252" strokeWidth={14} strokeLinecap="round" />
          <line x1={STACKER_X + 220 + worldShift} y1={G - 120} x2={lerp(STACKER_X + 220 + worldShift, cylEnd.x, 0.55)} y2={lerp(G - 120, cylEnd.y, 0.55)} stroke="#a3a3a3" strokeWidth={8} strokeLinecap="round" />

          {/* Boom (telescopic) */}
          <g transform={`translate(${pivotW.x} ${pivotW.y}) rotate(${boomAngle})`}>
            <rect x={240} y={-13} width={Math.max(0, boomLen - 230)} height={26} rx={5} fill="#9a3412" />
            <rect x={-28} y={-21} width={Math.min(boomLen, 320)} height={42} rx={8} fill={ORANGE} />
            <rect x={-28} y={12} width={Math.min(boomLen, 320)} height={9} rx={4} fill="#000" opacity={0.2} />
            <text x={60} y={7} fontFamily="Space Grotesk, sans-serif" fontWeight={700} fontSize={15} letterSpacing={4} fill="#000">VECTOR TECHNICAL</text>
            <circle r={14} fill="#262626" />
            <circle cx={boomLen} r={12} fill="#262626" />
          </g>

          {/* Spreader */}
          <g transform={`translate(${tipW.x} ${tipW.y})`}>
            <rect x={-14} y={-4} width={28} height={18} rx={3} fill="#262626" />
            <rect x={-CW / 2 + 6} y={12} width={CW - 12} height={12} rx={3} fill="#262626" />
            <rect x={-CW / 2 + 6} y={14} width={CW - 12} height={4} fill={ORANGE} />
            <rect x={-CW / 2 + 4} y={18} width={10} height={10} fill={gripping ? ORANGE : '#404040'} />
            <rect x={CW / 2 - 14} y={18} width={10} height={10} fill={gripping ? ORANGE : '#404040'} />
          </g>

          {/* Truck */}
          <g transform={`translate(${truckX} ${G})`}>
            {/* Headlight beam */}
            <polygon points="530,-78 980,-170 980,10" fill="url(#beam)" opacity={dark * 0.7} />
            <circle cx={530} cy={-76} r={40} fill="url(#glow)" opacity={dark} />
            {/* Trailer */}
            <rect x={0} y={-TRAILER_BED} width={310} height={14} fill="#262626" />
            <rect x={30} y={-78} width={280} height={12} fill="#1a1a1a" />
            <rect x={0} y={-90} width={6} height={10} fill="#dc2626" />
            <rect x={36} y={-70} width={110} height={12} rx={4} fill="#1a1a1a" />
            <rect x={246} y={-66} width={6} height={46} fill="#404040" />
            <Wheel cx={60} cy={-30} r={30} rot={truckWheelRot} dark={dark} />
            <Wheel cx={122} cy={-30} r={30} rot={truckWheelRot} dark={dark} />
            {/* Tractor */}
            <rect x={280} y={-70} width={240} height={14} fill="#262626" />
            <rect x={296} y={-98} width={52} height={10} rx={3} fill="#404040" />
            <rect x={392} y={-250} width={9} height={140} rx={3} fill="#525252" />
            <path d="M 402 -60 V -226 Q 402 -236 412 -236 H 500 Q 512 -236 518 -222 L 530 -150 V -60 Z" fill="#141414" stroke={mix('#141414', '#404040', dark)} strokeWidth={2} />
            <path d="M 412 -236 L 432 -266 H 498 L 506 -236 Z" fill="#1f1f1f" />
            <path d="M 470 -222 H 504 L 516 -170 H 470 Z" fill={mix('#b9c6ce', '#334155', dark)} />
            <rect x={416} y={-218} width={44} height={44} rx={4} fill={mix('#b9c6ce', '#334155', dark)} opacity={0.8} />
            <rect x={402} y={-118} width={128} height={10} fill={ORANGE} />
            <text x={412} y={-130} fontFamily="Space Grotesk, sans-serif" fontWeight={700} fontSize={14} letterSpacing={2} fill="#fff">VECTOR</text>
            <rect x={418} y={-68} width={48} height={24} rx={6} fill="#a3a3a3" />
            <rect x={522} y={-84} width={10} height={12} rx={2} fill={dark > 0.2 ? '#fff7e6' : '#fbbf24'} />
            <rect x={518} y={-62} width={16} height={14} rx={3} fill="#262626" />
            <rect x={526} y={-212} width={6} height={30} rx={2} fill="#262626" />
            <Wheel cx={336} cy={-34} r={34} rot={truckWheelRot} dark={dark} />
            <Wheel cx={396} cy={-34} r={34} rot={truckWheelRot} dark={dark} />
            <Wheel cx={486} cy={-34} r={34} rot={truckWheelRot} dark={dark} />
          </g>

          {/* The Vector container (moves between stack, spreader and trailer) */}
          <Container
            x={containerWorldX}
            y={containerWorldY}
            fill={ORANGE}
            rib="#7c2d12"
            label="VECTOR"
            labelFill="#000"
            highlight={p > 0.18 && p < 0.3 ? Math.sin(seg(p, 0.18, 0.3) * Math.PI) : 0}
          />
        </svg>

        {/* Scroll hint */}
        <div
          aria-hidden="true"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 font-sans text-[10px] font-bold uppercase tracking-[0.3em] transition-opacity duration-500"
          style={{ color: fg, opacity: p < 0.04 ? 0.6 : 0 }}
        >
          Scroll
        </div>
      </div>
    </section>
  );
}
