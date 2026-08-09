export const miniWrapStyle: React.CSSProperties = {
  position: 'absolute',
  top: 48,
  right: 16,
  width: 200,
  padding: 10,
  borderRadius: 10,
  background: 'rgba(4, 14, 12, 0.82)',
  border: '1px solid rgba(0, 230, 118, 0.28)',
  boxShadow: '0 0 20px rgba(0, 230, 118, 0.1)',
  color: '#eafff4',
};

export const fullWrapStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 700,
  padding: '18px 20px',
  borderRadius: 12,
  background: 'rgba(4, 14, 12, 0.96)',
  border: '1px solid rgba(0, 230, 118, 0.38)',
  boxShadow: '0 0 40px rgba(0, 230, 118, 0.15)',
  color: '#eafff4',
};

export const miniHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  fontSize: 10,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  color: '#8ff7c1',
};

export const fullHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  fontSize: 13,
  letterSpacing: 1.8,
  textTransform: 'uppercase',
  color: '#8ff7c1',
  marginBottom: 4,
};

export const miniSvgStyle: React.CSSProperties = {
  width: '100%', height: 124, display: 'block', marginTop: 6,
};
export const fullSvgStyle: React.CSSProperties = {
  width: '100%', height: 'min(45vh, 320px)', display: 'block', marginTop: 10,
};

export const miniFooterStyle: React.CSSProperties = {
  color: '#ffffff70',
  fontSize: 9,
  lineHeight: 1.35,
  marginTop: 4,
};

export const fullBodyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  textAlign: 'center',
  marginTop: 10,
};

export const stationDescStyle: React.CSSProperties = {
  margin: '2px 0 0',
  color: '#c8e8d0',
  fontSize: 14,
  lineHeight: 1.5,
};

export const routeTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#ffd166',
  fontSize: 13,
  fontWeight: 700,
};

export const hintTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#8aa498',
  fontSize: 11,
  lineHeight: 1.4,
};

export const completeTextStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#00e676',
  fontSize: 15,
  fontWeight: 700,
};

export const devStyle: React.CSSProperties = {
  margin: 0,
  color: '#8ff7c1',
  fontSize: 10,
  letterSpacing: 1.1,
  textTransform: 'uppercase',
  opacity: 0.7,
};

export const stageGridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'center',
  marginTop: 4,
};

export function stageButtonStyle(active: boolean, unlocked: boolean): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    width: 72,
    padding: '10px 6px 8px',
    borderRadius: 10,
    border: active
      ? '1px solid rgba(0,230,118,0.7)'
      : unlocked
      ? '1px solid rgba(200,146,42,0.35)'
      : '1px solid rgba(60,70,65,0.5)',
    background: active
      ? 'rgba(0,200,83,0.2)'
      : unlocked
      ? 'rgba(200,146,42,0.1)'
      : 'rgba(30,40,35,0.5)',
    color: '#f4fff8',
    fontFamily: '"Courier New", monospace',
    fontSize: 12,
    cursor: unlocked ? 'pointer' : 'not-allowed',
    boxShadow: active ? '0 0 18px rgba(0,230,118,0.3)' : 'none',
    transition: 'background 0.15s, border-color 0.15s',
  };
}
