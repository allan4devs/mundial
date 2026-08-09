export default function MapDefs() {
  return (
    <defs>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#4b2c12" floodOpacity="0.18" />
      </filter>
      <pattern id="dashRoad" width="34" height="8" patternUnits="userSpaceOnUse">
        <path d="M4 4 H18" stroke="#f7f1df" strokeWidth="2" strokeLinecap="round" />
      </pattern>
    </defs>
  );
}
