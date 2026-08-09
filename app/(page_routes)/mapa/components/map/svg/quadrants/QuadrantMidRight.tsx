import Bridge from '../Bridge';

// Q6 — mid-right: canyon body, upper-right bridge (SVG coords 854–1280 × 240–479)
export default function QuadrantMidRight() {
  return (
    <g>
      {/* Canyon rock face */}
      <path d="M792 454 C840 348 914 338 969 444 C1004 514 1112 506 1174 578 L780 584 Z" fill="#b3aa9d" stroke="#5b5046" strokeWidth="4" />
      {/* Canyon wall texture lines */}
      <path
        d="M838 450 C852 402 882 392 898 446 M943 446 C958 398 981 386 1002 452 M1066 510 C1088 472 1111 470 1138 528"
        fill="none"
        stroke="#5b5046"
        strokeWidth="3"
      />

      {/* Bridge over Quebrada Tramontito Seco */}
      <Bridge x={1095} y={293} rotate={-8} />
    </g>
  );
}
