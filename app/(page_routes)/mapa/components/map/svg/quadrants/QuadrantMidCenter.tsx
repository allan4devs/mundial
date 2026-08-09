// Q5 — mid-center: central forest, trail-side shrubs (SVG coords 427–853 × 240–479)
export default function QuadrantMidCenter() {
  return (
    <g>
      {/* Central forest canopy */}
      <path
        d="M492 315 C545 260 646 274 692 333 C752 308 814 334 833 392 C776 420 711 430 641 416 C578 439 509 407 492 315Z"
        fill="#4f8b41"
        opacity="0.74"
      />

      {/* Trail-side shrubs near Guayabal */}
      <g transform="translate(458 255)">
        <path d="M-12 15 C-22 4 -12 -12 2 -7 C12 -20 30 -5 17 10 C14 20 -2 22 -12 15Z" fill="#5d9b4f" stroke="#2f5f30" strokeWidth="3" />
        <path d="M0 10 L0 24" stroke="#6b4226" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g transform="translate(520 250)">
        <path d="M-12 15 C-22 4 -12 -12 2 -7 C12 -20 30 -5 17 10 C14 20 -2 22 -12 15Z" fill="#5d9b4f" stroke="#2f5f30" strokeWidth="3" />
        <path d="M0 10 L0 24" stroke="#6b4226" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g transform="translate(598 256)">
        <path d="M-12 15 C-22 4 -12 -12 2 -7 C12 -20 30 -5 17 10 C14 20 -2 22 -12 15Z" fill="#5d9b4f" stroke="#2f5f30" strokeWidth="3" />
        <path d="M0 10 L0 24" stroke="#6b4226" strokeWidth="4" strokeLinecap="round" />
      </g>
    </g>
  );
}
