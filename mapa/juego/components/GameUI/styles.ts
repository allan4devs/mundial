export function btnStyle(color: string): React.CSSProperties {
  return {
    marginTop: 8,
    padding: '10px 36px',
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontFamily: '"Courier New", monospace',
    fontSize: 15,
    cursor: 'pointer',
    letterSpacing: 1,
    boxShadow: `0 0 24px ${color}88`,
  };
}

export const rootStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 10,
  fontFamily: '"Courier New", monospace',
};

export const hudStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

export const titleStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  textAlign: 'center',
};

export const helpStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 14,
  right: 14,
  color: '#ffffff40',
  fontSize: 10,
  textAlign: 'right',
  lineHeight: 1.6,
};

export const mapOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14,
  padding: 16,
  overflowY: 'auto',
  background: 'radial-gradient(circle at 50% 35%, rgba(0, 80, 52, 0.28), rgba(5, 12, 16, 0.94) 62%)',
};

export const dashboardStyle: React.CSSProperties = {
  width: 'min(1200px, 100%)',
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 0.8fr) minmax(460px, 1.5fr) minmax(220px, 0.8fr)',
  gap: 14,
  alignItems: 'stretch',
};

export const panelStyle: React.CSSProperties = {
  alignSelf: 'center',
  border: '1px solid rgba(0,230,118,0.18)',
  borderRadius: 12,
  background: 'rgba(0, 12, 10, 0.72)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
  padding: 16,
};

export const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#00e676',
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 3,
  textTransform: 'uppercase',
};

export const panelTitleStyle: React.CSSProperties = {
  margin: '4px 0 8px',
  color: '#fff',
  fontSize: 20,
};

export const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#ffffff8c',
  fontSize: 12,
  lineHeight: 1.5,
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(0,230,118,0.35)',
  borderRadius: 8,
  background: 'rgba(0,0,0,0.35)',
  color: '#fff',
  padding: '11px 12px',
  outline: 'none',
  fontFamily: '"Courier New", monospace',
  fontWeight: 700,
};

export const smallBtnStyle: React.CSSProperties = {
  border: '1px solid rgba(0,230,118,0.35)',
  borderRadius: 8,
  background: 'rgba(0,230,118,0.10)',
  color: '#00e676',
  padding: '9px 12px',
  cursor: 'pointer',
  fontFamily: '"Courier New", monospace',
  fontWeight: 900,
  fontSize: 11,
  letterSpacing: 1,
};

export const rankNameStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: '#fff',
  fontWeight: 800,
};

export function rankRowStyle(first: boolean): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0,1fr) auto',
    gap: 8,
    alignItems: 'center',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 8,
    background: first ? 'rgba(0,230,118,0.16)' : 'rgba(255,255,255,0.045)',
    padding: '8px 9px',
  };
}
