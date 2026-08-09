'use client';
import { memo } from 'react';

export const TrailMapTerrain = memo(function TrailMapTerrain() {
  return (
    <>
      <rect x="0" y="0" width="100" height="100" rx="5" fill="#071510" />

      <ellipse cx="44" cy="18" rx="28" ry="16" fill="#0d2218" opacity="0.9" />
      <ellipse cx="18" cy="38" rx="18" ry="14" fill="#0a1e14" opacity="0.9" />
      <ellipse cx="54" cy="46" rx="24" ry="16" fill="#0f2016" opacity="0.9" />
      <ellipse cx="78" cy="66" rx="16" ry="14" fill="#0c1e28" opacity="0.9" />
      <ellipse cx="46" cy="84" rx="20" ry="12" fill="#091c24" opacity="0.9" />

      <path
        d="M10 92 C22 88 38 90 46 86 C54 82 68 88 88 84"
        fill="none" stroke="#0e7490" strokeWidth="3.5" opacity="0.55" strokeLinecap="round"
      />
      <path
        d="M10 94 C22 90 38 92 46 88 C54 84 68 90 88 86"
        fill="none" stroke="#0e7490" strokeWidth="1.5" opacity="0.3" strokeLinecap="round"
      />

      <circle cx="8" cy="22" r="3.5" fill="#0f3020" opacity="0.6" />
      <circle cx="14" cy="18" r="2.5" fill="#0f3020" opacity="0.5" />
      <circle cx="72" cy="30" r="3" fill="#0f3020" opacity="0.5" />
      <circle cx="82" cy="38" r="2.5" fill="#0f3020" opacity="0.45" />
      <circle cx="30" cy="58" r="3" fill="#0f3020" opacity="0.45" />
      <circle cx="60" cy="72" r="2.5" fill="#0f3020" opacity="0.4" />
    </>
  );
});
