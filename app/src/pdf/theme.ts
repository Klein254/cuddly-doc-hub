export const C = {
  ink: '#14161B',
  body: '#3A3F4A',
  muted: '#8A909C',
  hair: '#E7E4DE',
  ivory: '#F8F6F2',
  orange: '#EF7D1A',
  amber: '#F9A51A',
  white: '#FFFFFF',
};

export const F = {
  serif: 'Playfair',
  sans: 'Inter',
  brand: 'Montserrat',
};

/** Font files by family → weight (+ italic). Registered by fonts.ts in the browser. */
export const FONT_FILES: Record<string, { weight: number; style?: 'italic'; file: string }[]> = {
  Inter: [
    { weight: 400, file: 'inter/files/inter-latin-400-normal.woff' },
    { weight: 500, file: 'inter/files/inter-latin-500-normal.woff' },
    { weight: 600, file: 'inter/files/inter-latin-600-normal.woff' },
    { weight: 700, file: 'inter/files/inter-latin-700-normal.woff' },
  ],
  Playfair: [
    { weight: 500, file: 'playfair-display/files/playfair-display-latin-500-normal.woff' },
    { weight: 600, file: 'playfair-display/files/playfair-display-latin-600-normal.woff' },
    { weight: 400, style: 'italic', file: 'playfair-display/files/playfair-display-latin-400-italic.woff' },
  ],
  Montserrat: [
    { weight: 600, file: 'montserrat/files/montserrat-latin-600-normal.woff' },
    { weight: 700, file: 'montserrat/files/montserrat-latin-700-normal.woff' },
    { weight: 800, file: 'montserrat/files/montserrat-latin-800-normal.woff' },
  ],
};
