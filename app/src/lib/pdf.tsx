import { isAndroidApp, isDesktopApp } from './platform';
import type { DocRecord, Settings } from './types';

/** Builds the PDF on the device. The PDF engine is loaded on first use to keep start-up fast. */
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

const ANDROID_FOLDER = 'Vector Doc Hub';

async function toBase64(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

type SavePicker = (o: object) => Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }>;

/**
 * Saves the PDF and returns a message for the user, or null if they cancelled.
 * - Desktop app: native "Save as" dialog, written to disk by the app.
 * - Android app: written to Documents/Vector Doc Hub on the phone.
 * - Browser: "Save as" dialog in Chrome/Edge on a computer, otherwise a normal download.
 */
export async function savePdf(blob: Blob, name: string): Promise<string | null> {
  if (isDesktopApp) {
    const { invoke } = await import('@tauri-apps/api/core');
    const path = await invoke<string | null>('save_pdf', { name, data: Array.from(new Uint8Array(await blob.arrayBuffer())) });
    return path ? `Saved to ${path}` : null;
  }

  if (isAndroidApp) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    await Filesystem.writeFile({ path: `${ANDROID_FOLDER}/${name}`, data: await toBase64(blob), directory: Directory.Documents, recursive: true });
    return `Saved to Documents/${ANDROID_FOLDER}`;
  }

  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (picker && !isMobile()) {
    try {
      const handle = await picker({ suggestedName: name, types: [{ description: 'PDF document', accept: { 'application/pdf': ['.pdf'] } }] });
      const w = await handle.createWritable();
      await w.write(blob);
      await w.close();
      return 'PDF saved';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return null;
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
  return 'PDF downloaded';
}

export function canShareFiles() {
  if (isAndroidApp) return true;
  if (isDesktopApp) return false;
  try {
    return !!navigator.canShare?.({ files: [new File([''], 'a.pdf', { type: 'application/pdf' })] });
  } catch {
    return false;
  }
}

/** Opens the system share sheet (WhatsApp, Gmail, Drive, Files…) with the PDF attached. */
export async function sharePdf(blob: Blob, name: string, title: string) {
  if (isAndroidApp) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
    const { uri } = await Filesystem.writeFile({ path: name, data: await toBase64(blob), directory: Directory.Cache });
    try {
      await Share.share({ title, files: [uri] });
    } catch (e) {
      if (!/cancel/i.test((e as Error).message)) throw e;
    }
    return;
  }
  try {
    await navigator.share({ files: [new File([blob], name, { type: 'application/pdf' })], title });
  } catch (e) {
    if ((e as Error).name !== 'AbortError') throw e;
  }
}
