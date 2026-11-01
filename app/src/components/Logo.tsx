import logoArt from '../assets/logo-art.png';

/**
 * Vector Technical logo: the original frame and tagline artwork, with the wordmark set in Montserrat across the
 * gap in the frame (the source artwork has the wordmark in black on black, so it can't be used as-is).
 */
export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <svg viewBox="0 0 1055 422" className={className} role="img" aria-label="Vector Technical — Maintenance & General Supplies">
      <image href={logoArt} width="1055" height="422" />
      <text
        x="527.5"
        y="244"
        textAnchor="middle"
        textLength="1035"
        lengthAdjust="spacingAndGlyphs"
        fontFamily="Montserrat, sans-serif"
        fontWeight="800"
        fontSize="104"
        fill={dark ? '#14161b' : '#ffffff'}
      >
        VECTOR TECHNICAL
      </text>
    </svg>
  );
}
