import { Font } from '@react-pdf/renderer';
import { FONT_FILES } from './theme';

// Vite turns each font file into a hashed asset URL (and the service worker caches them for offline use).
const urls = import.meta.glob(
  [
    '/node_modules/@fontsource/inter/files/inter-latin-{400,500,600,700}-normal.woff',
    '/node_modules/@fontsource/playfair-display/files/playfair-display-latin-{500,600}-normal.woff',
    '/node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff',
    '/node_modules/@fontsource/montserrat/files/montserrat-latin-{600,700,800}-normal.woff',
  ],
  { query: '?url', import: 'default', eager: true },
) as Record<string, string>;

let done = false;

export function registerFonts() {
  if (done) return;
  done = true;
  for (const [family, fonts] of Object.entries(FONT_FILES)) {
    Font.register({
      family,
      fonts: fonts.map((f) => ({ src: urls[`/node_modules/@fontsource/${f.file}`], fontWeight: f.weight, fontStyle: f.style ?? 'normal' })),
    });
  }
  // Keep long words (part numbers, emails) intact instead of hyphenating them.
  Font.registerHyphenationCallback((word) => [word]);
}
