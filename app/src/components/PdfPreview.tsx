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
          canvas.className = 'mx-auto max-w-[44rem] rounded-[3px] bg-white shadow-paper';
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
      <div ref={host} className="flex flex-col gap-6" />
      {!blob && <div className="mx-auto aspect-[1/1.414] max-w-[44rem] animate-pulse rounded-[3px] bg-surface shadow-paper" />}
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">Preview failed: {error}</p>}
    </div>
  );
}
