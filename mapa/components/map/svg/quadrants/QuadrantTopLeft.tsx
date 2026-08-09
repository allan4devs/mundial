// Q1 — top-left: reception sign, trail details (SVG coords 0–426 × 0–239)
export default function QuadrantTopLeft() {
  return (
    <g>
      {/* Reception service sign post */}
      <path d="M80 86 L80 228" stroke="#56341d" strokeWidth="7" strokeLinecap="round" />
      <path d="M80 92 C118 84 118 113 83 111" fill="none" stroke="#8a552e" strokeWidth="15" strokeLinecap="round" />
      <path d="M80 138 C115 126 120 154 88 158 C64 162 65 184 92 186 C123 188 118 216 78 212" fill="none" stroke="#8a552e" strokeWidth="14" strokeLinecap="round" />
      <path d="M68 98 L53 98 M68 150 L53 150 M68 202 L53 202" stroke="#2f2118" strokeWidth="3" strokeLinecap="round" />
      <text x="118" y="96" fill="#2b2118" fontSize="24" fontWeight="900">Recepción</text>
      <text x="118" y="148" fill="#2b2118" fontSize="24" fontWeight="900">Restaurante</text>
      <text x="118" y="200" fill="#2b2118" fontSize="24" fontWeight="900">Mirador</text>

      {/* Montañita area label */}
      <text x="382" y="184" fill="#2b2118" fontSize="25" fontWeight="900">Montañita</text>

      {/* Grass tufts along upper trail */}
      <g transform="translate(258 116) rotate(20)" stroke="#315d2f" strokeWidth="2.5" strokeLinecap="round">
        <path d="M0 12 C-2 4 -7 0 -12 -4" /><path d="M0 12 C1 3 2 -3 4 -10" /><path d="M0 12 C4 5 10 2 15 -1" />
      </g>
      <g transform="translate(287 116) rotate(-18)" stroke="#315d2f" strokeWidth="2.5" strokeLinecap="round">
        <path d="M0 12 C-2 4 -7 0 -12 -4" /><path d="M0 12 C1 3 2 -3 4 -10" /><path d="M0 12 C4 5 10 2 15 -1" />
      </g>
      <g transform="translate(340 135) rotate(12)" stroke="#315d2f" strokeWidth="2.5" strokeLinecap="round">
        <path d="M0 12 C-2 4 -7 0 -12 -4" /><path d="M0 12 C1 3 2 -3 4 -10" /><path d="M0 12 C4 5 10 2 15 -1" />
      </g>
      <g transform="translate(388 152) rotate(-10)" stroke="#315d2f" strokeWidth="2.5" strokeLinecap="round">
        <path d="M0 12 C-2 4 -7 0 -12 -4" /><path d="M0 12 C1 3 2 -3 4 -10" /><path d="M0 12 C4 5 10 2 15 -1" />
      </g>
      <g transform="translate(408 202) rotate(8)" stroke="#315d2f" strokeWidth="2.5" strokeLinecap="round">
        <path d="M0 12 C-2 4 -7 0 -12 -4" /><path d="M0 12 C1 3 2 -3 4 -10" /><path d="M0 12 C4 5 10 2 15 -1" />
      </g>

      {/* Hikers on trail */}
      <g transform="translate(280 180) rotate(18)" stroke="#3b2a1e" strokeWidth="3" strokeLinecap="round">
        <circle cx="0" cy="-12" r="4" fill="#7a4b25" stroke="none" />
        <path d="M0 -7 L-3 8" /><path d="M-2 -2 L-11 5" /><path d="M-1 8 L-11 20" /><path d="M-1 8 L8 20" /><path d="M5 -3 L13 -11" />
      </g>
      <g transform="translate(330 205) rotate(-6)" stroke="#3b2a1e" strokeWidth="3" strokeLinecap="round">
        <circle cx="0" cy="-12" r="4" fill="#7a4b25" stroke="none" />
        <path d="M0 -7 L-3 8" /><path d="M-2 -2 L-11 5" /><path d="M-1 8 L-11 20" /><path d="M-1 8 L8 20" /><path d="M5 -3 L13 -11" />
      </g>
      <g transform="translate(390 244) rotate(14)" stroke="#3b2a1e" strokeWidth="3" strokeLinecap="round">
        <circle cx="0" cy="-12" r="4" fill="#7a4b25" stroke="none" />
        <path d="M0 -7 L-3 8" /><path d="M-2 -2 L-11 5" /><path d="M-1 8 L-11 20" /><path d="M-1 8 L8 20" /><path d="M5 -3 L13 -11" />
      </g>
    </g>
  );
}
