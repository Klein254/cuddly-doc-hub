/** Vector Technical mark, redrawn as a vector so it stays sharp at any size. */
export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <svg viewBox="0 0 1055 422" className={className} role="img" aria-label="Vector Technical — Maintenance & General Supplies">
      <path d="M145 160V9h765v154M145 254v159h765V254" fill="none" stroke="#f9a51a" strokeWidth="18" />
      <text
        x="527.5"
        y="243"
        textAnchor="middle"
        textLength="1035"
        lengthAdjust="spacingAndGlyphs"
        fontFamily="Montserrat, sans-serif"
        fontWeight="800"
        fontSize="116"
        fill={dark ? '#14161b' : '#ffffff'}
      >
        VECTOR TECHNICAL
      </text>
      <text
        x="527.5"
        y="284"
        textAnchor="middle"
        textLength="630"
        lengthAdjust="spacing"
        fontFamily="Montserrat, sans-serif"
        fontWeight="600"
        fontSize="29"
        fill="#ef7d1a"
      >
        MAINTENANCE &amp; GENERAL SUPPLIES
      </text>
    </svg>
  );
}
