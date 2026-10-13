"use client";

/**
 * Keel-billed toucan, drawn as a transparent, layered SVG so it can be
 * composited over the hero scene exactly like the MISOGI tiger cutout.
 *
 * Want a photoreal bird instead? Drop a transparent PNG at
 * `public/hero/toucan.png` and pass `imageSrc="/hero/toucan.png"` to
 * <ImmersiveHero />. This SVG is the zero-asset default so the page works
 * out of the box.
 */
export default function ToucanArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 560 660"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Tucán de La Vieja Adventures"
    >
      <defs>
        {/* Big colourful upper bill — rainbow along its length (tip = left) */}
        <linearGradient id="tk-bill" x1="70" y1="0" x2="270" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E24A2C" />
          <stop offset="0.26" stopColor="#F08A26" />
          <stop offset="0.54" stopColor="#F7C63C" />
          <stop offset="0.8" stopColor="#7FB93E" />
          <stop offset="1" stopColor="#3E9A55" />
        </linearGradient>
        <linearGradient id="tk-bill-low" x1="90" y1="0" x2="260" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2AA7C6" />
          <stop offset="0.6" stopColor="#3FA0B0" />
          <stop offset="1" stopColor="#E88A2E" />
        </linearGradient>
        <radialGradient id="tk-body" cx="0.38" cy="0.32" r="0.85">
          <stop offset="0" stopColor="#333333" />
          <stop offset="0.55" stopColor="#141414" />
          <stop offset="1" stopColor="#000000" />
        </radialGradient>
        <linearGradient id="tk-bib" x1="0" y1="150" x2="0" y2="330" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FDEEA8" />
          <stop offset="1" stopColor="#F4BE3E" />
        </linearGradient>
        <linearGradient id="tk-branch" x1="0" y1="470" x2="0" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7A5432" />
          <stop offset="1" stopColor="#4A3018" />
        </linearGradient>
        <radialGradient id="tk-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#12312a" stopOpacity="0.34" />
          <stop offset="1" stopColor="#12312a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="330" cy="600" rx="180" ry="34" fill="url(#tk-shadow)" />

      {/* Branch */}
      <path
        d="M120 560 C 240 512 380 512 520 548 L 520 590 C 380 560 250 560 130 598 Z"
        fill="url(#tk-branch)"
      />
      <path
        d="M150 556 C 250 522 360 522 470 548"
        stroke="#9B7248"
        strokeOpacity="0.5"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* A couple of tropical leaves on the branch */}
      <path d="M470 548 C 512 520 548 522 556 500 C 528 500 496 512 470 548 Z" fill="#3E8C4E" />
      <path d="M150 566 C 108 552 82 566 70 552 C 96 540 128 544 150 566 Z" fill="#4C9B57" />

      {/* Tail */}
      <path
        d="M392 452 C 468 500 486 556 452 616 C 436 566 410 520 360 494 Z"
        fill="#0c0c0c"
      />

      {/* Feet gripping the branch */}
      <g fill="#5C6B73">
        <path d="M300 512 c -6 22 -6 40 2 54 c 8 -2 12 -8 12 -18 c 8 12 16 16 24 12 c -4 -10 -12 -18 -20 -26 c 2 -10 -6 -20 -18 -22 Z" />
        <path d="M360 512 c -6 22 -6 40 2 54 c 8 -2 12 -8 12 -18 c 8 12 16 16 24 12 c -4 -10 -12 -18 -20 -26 c 2 -10 -6 -20 -18 -22 Z" />
      </g>

      {/* Body */}
      <ellipse cx="348" cy="382" rx="126" ry="146" fill="url(#tk-body)" />
      {/* Wing sheen + feather lines */}
      <ellipse cx="386" cy="392" rx="86" ry="126" fill="#000000" opacity="0.55" />
      <g stroke="#2c2c2c" strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round">
        <path d="M320 300 C 372 322 402 366 398 424" />
        <path d="M300 322 C 356 346 388 392 384 452" />
        <path d="M286 350 C 340 374 372 418 368 472" />
      </g>
      {/* Red crissum patch under tail */}
      <path d="M392 470 C 424 476 446 470 456 452 C 440 500 410 512 384 500 Z" fill="#D23B2C" opacity="0.9" />

      {/* Yellow bib on chest / lower face */}
      <path
        d="M250 236 C 232 300 246 356 300 372 C 356 356 372 300 352 236 C 322 214 282 214 250 236 Z"
        fill="url(#tk-bib)"
      />
      {/* thin red line under the bib */}
      <path d="M256 356 C 300 372 316 372 350 354" stroke="#E0552F" strokeWidth="6" strokeLinecap="round" opacity="0.8" />

      {/* Head */}
      <circle cx="322" cy="206" r="96" fill="url(#tk-body)" />
      {/* head-to-bib blend */}
      <path d="M244 232 C 262 214 300 206 344 214 C 356 250 356 250 348 236 C 322 214 282 214 250 236 Z" fill="#000" opacity="0.5" />

      {/* Eye patch (bare skin) */}
      <ellipse cx="300" cy="176" rx="46" ry="36" fill="#8FD1C8" />
      <ellipse cx="300" cy="176" rx="46" ry="36" fill="none" stroke="#B7DF57" strokeWidth="4" opacity="0.8" />
      {/* Eye */}
      <circle cx="288" cy="176" r="16" fill="#0b0b0b" />
      <circle cx="283" cy="170" r="5" fill="#ffffff" opacity="0.9" />

      {/* Upper bill (the showpiece) */}
      <path
        d="M262 168
           C 196 152 122 164 78 214
           C 68 224 68 236 84 242
           C 156 254 214 252 262 244
           C 276 232 276 182 262 168 Z"
        fill="url(#tk-bill)"
      />
      {/* culmen ridge line */}
      <path
        d="M262 170 C 200 156 128 168 82 216"
        stroke="#7a3a12"
        strokeOpacity="0.55"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* bill sheen */}
      <path
        d="M240 182 C 190 174 138 184 100 214"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Lower bill */}
      <path
        d="M262 246
           C 208 254 148 256 100 246
           C 118 268 190 278 262 272
           C 272 264 272 252 262 246 Z"
        fill="url(#tk-bill-low)"
      />

      {/* Base of bill where it meets the face */}
      <path d="M262 160 C 280 186 280 256 262 280 L 274 280 C 292 254 292 186 274 160 Z" fill="#1c1c1c" />
    </svg>
  );
}
