// Q3 — top-right: mountain range, right forest patch (SVG coords 854–1280 × 0–239)
export default function QuadrantTopRight() {
  return (
    <g>
      {/* Right forest canopy */}
      <path
        d="M725 198 C790 158 882 174 923 229 C1005 215 1082 260 1091 334 C1014 360 934 351 864 321 C802 342 742 313 725 198Z"
        fill="#4f8b41"
        opacity="0.74"
      />

      {/* Mountain range peaks */}
      <path d="M835 92 L895 22 L968 156 Z" fill="#a9a29a" stroke="#4c4339" strokeWidth="3" />
      <path d="M904 106 L957 48 L1042 170 Z" fill="#827a70" stroke="#4c4339" strokeWidth="3" />
      {/* Snow caps */}
      <path d="M860 64 L883 90 L895 22 L918 92 L940 70 L895 22 Z" fill="#f8fafc" opacity="0.92" />
      <path d="M948 73 L966 98 L957 48 L985 102 L1002 82 L957 48 Z" fill="#f8fafc" opacity="0.9" />
    </g>
  );
}
