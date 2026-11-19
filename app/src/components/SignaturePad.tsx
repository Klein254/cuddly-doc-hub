import clsx from 'clsx';
import { Eraser, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Signature } from '../lib/types';
import { Button, Dialog, Label } from './ui';

type Pt = [number, number];

const W = 600;
const H = 240;
const BASELINE = 182;
const PEN = 2.6;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Smooth path through the points: quadratic curves via the midpoints, so fast strokes don't look jagged. */
function toPath(pts: Pt[]) {
  if (pts.length === 0) return '';
  const [x0, y0] = pts[0];
  if (pts.length === 1) return `M${r1(x0)} ${r1(y0)}l0.1 0`;
  let d = `M${r1(x0)} ${r1(y0)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += `Q${r1(x)} ${r1(y)} ${r1((x + nx) / 2)} ${r1((y + ny) / 2)}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  return d + `L${r1(lx)} ${r1(ly)}`;
}

function cropBox(strokes: Pt[][]): Signature['box'] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  strokes.flat().forEach(([x, y]) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  const pad = PEN * 2;
  return [r1(minX - pad), r1(minY - pad), r1(maxX - minX + pad * 2), r1(maxY - minY + pad * 2)];
}

/**
 * Drawing surface. Pointer events cover mouse, touch and stylus; coalesced events keep fast strokes smooth.
 * touch-action: none stops the page from scrolling while someone signs with a finger.
 */
function Pad({ strokes, setStrokes }: { strokes: Pt[][]; setStrokes: (s: Pt[][]) => void }) {
  const svg = useRef<SVGSVGElement>(null);
  const drawing = useRef<Pt[] | null>(null);
  const [, force] = useState(0);

  const point = (e: PointerEvent | ReactPointerEvent): Pt => {
    const r = svg.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };

  const down = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    svg.current!.setPointerCapture(e.pointerId);
    drawing.current = [point(e)];
    force((n) => n + 1);
  };

  const move = (e: ReactPointerEvent<SVGSVGElement>) => {
    const cur = drawing.current;
    if (!cur) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const p = point(ev);
      const [lx, ly] = cur[cur.length - 1];
      if (Math.hypot(p[0] - lx, p[1] - ly) > 1.2) cur.push(p);
    }
    force((n) => n + 1);
  };

  const up = () => {
    if (drawing.current) setStrokes([...strokes, drawing.current]);
    drawing.current = null;
  };

  const all = drawing.current ? [...strokes, drawing.current] : strokes;
  const empty = all.length === 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-line-strong bg-white">
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className="block aspect-[5/2] w-full cursor-crosshair touch-none select-none"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        role="img"
        aria-label="Signature area"
      >
        <line x1={36} x2={W - 36} y1={BASELINE} y2={BASELINE} stroke="#d6d3cb" strokeWidth={1.5} />
        <path d={`M44 ${BASELINE - 22}l12 12m0 -12l-12 12`} stroke="#a8a59d" strokeWidth={2} strokeLinecap="round" />
        {all.map((s, i) => (
          <path key={i} d={toPath(s)} fill="none" stroke="#1b1a18" strokeWidth={PEN} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
      <span
        className={clsx(
          'pointer-events-none absolute inset-x-0 top-[38%] text-center text-sm text-[#a8a59d] transition-opacity duration-300',
          empty ? 'opacity-100' : 'opacity-0',
        )}
      >
        Sign here
      </span>
    </div>
  );
}

/** Renders a saved signature (UI previews; the PDF draws its own copy). */
export function SignatureView({ sig, className }: { sig: Signature; className?: string }) {
  const [x, y, w, h] = sig.box;
  return (
    <svg viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="xMinYMid meet" className={className} role="img" aria-label={`Signature of ${sig.name}`}>
      {sig.paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={PEN} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

export function SignatureDialog({
  open,
  onClose,
  title,
  who,
  consent,
  defaultName,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  who: string;
  consent: string;
  defaultName: string;
  onSave: (s: Pick<Signature, 'paths' | 'box' | 'name'>) => void;
}) {
  const [strokes, setStrokes] = useState<Pt[][]>([]);
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (open) {
      setStrokes([]);
      setName(defaultName);
    }
  }, [open, defaultName]);

  const ready = strokes.length > 0 && name.trim().length > 1;
  const save = () => ready && onSave({ paths: strokes.map(toPath), box: cropBox(strokes), name: name.trim() });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      wide
      title={title}
      description={`Hand the device to ${who}. Sign with a finger, stylus or mouse.`}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => setStrokes(strokes.slice(0, -1))} disabled={!strokes.length} className="mr-auto">
            <Undo2 className="size-3.5" /> Undo
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setStrokes([])} disabled={!strokes.length}>
            <Eraser className="size-3.5" /> Clear
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!ready}>
            Add signature
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <Label>Full name</Label>
          <input className="field" autoComplete="name" placeholder="Name of the person signing" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <Pad strokes={strokes} setStrokes={setStrokes} />
        <p className="text-[0.8125rem] leading-relaxed text-ink-3">{consent} The date and time are recorded with the signature.</p>
      </div>
    </Dialog>
  );
}
