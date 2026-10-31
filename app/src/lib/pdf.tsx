import type { DocRecord, Settings } from './types';

/** Builds the PDF in the browser. The PDF engine is loaded on first use to keep start-up fast. */
export async function renderPdf(doc: DocRecord, settings: Settings): Promise<Blob> {
  const [{ pdf }, { DocumentPdf }, { registerFonts }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../pdf/DocumentPdf'),
    import('../pdf/fonts'),
  ]);
  registerFonts();
  return pdf(<DocumentPdf doc={doc} settings={settings} />).toBlob();
}

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

type SavePicker = (o: object) => Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }>;

/**
 * Saves the PDF. On Windows/Mac Chrome & Edge this opens a "Save as" dialog so the user picks the
 * folder; elsewhere (Safari, Firefox, Android) it downloads to the Downloads folder.
 */
export async function savePdf(blob: Blob, name: string): Promise<'saved' | 'downloaded' | 'cancelled'> {
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (picker && !isMobile()) {
    try {
      const handle = await picker({ suggestedName: name, types: [{ description: 'PDF document', accept: { 'application/pdf': ['.pdf'] } }] });
      const w = await handle.createWritable();
      await w.write(blob);
      await w.close();
      return 'saved';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
      // Fall through to a normal download if the picker is blocked.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return 'downloaded';
}

export function canShareFiles() {
  try {
    return !!navigator.canShare?.({ files: [new File([''], 'a.pdf', { type: 'application/pdf' })] });
  } catch {
    return false;
  }
}

/** Opens the system share sheet (WhatsApp, Gmail, Drive, Files…) with the PDF attached. */
export async function sharePdf(blob: Blob, name: string, title: string) {
  try {
    await navigator.share({ files: [new File([blob], name, { type: 'application/pdf' })], title });
  } catch (e) {
    if ((e as Error).name !== 'AbortError') throw e;
  }
}
