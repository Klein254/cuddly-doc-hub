import { useEffect, useRef, useState } from 'react';

/**
 * Draws the generated PDF onto canvases with pdf.js, so the preview is exactly the file that gets
 * saved and works on Android too (Android browsers can't show PDFs inline).
 */
export function PdfPreview({ blob }: { blob: Blob | null }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blob || !host.current) return;
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
        pdfjs.GlobalWorkerOptions.workerSrc = worker;
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        const width = host.current!.clientWidth;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const canvases: HTMLCanvasElement[] = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = '100%';
          canvas.className = 'rounded-md bg-white shadow-[0_30px_60px_-25px_rgba(0,0,0,0.9)] ring-1 ring-white/10';
          await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
          canvases.push(canvas);
          if (cancelled) return;
        }
        // Swap in all pages at once so the preview never flashes blank while typing.
        host.current?.replaceChildren(...canvases);
        setError(null);
        pdf.destroy();
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob]);

  return (
    <div>
      <div ref={host} className="flex flex-col gap-5" />
      {!blob && <div className="aspect-[1/1.414] animate-pulse rounded-md bg-white/[0.04]" />}
      {error && <p className="mt-3 text-sm text-red-300">Preview failed: {error}</p>}
    </div>
  );
}
