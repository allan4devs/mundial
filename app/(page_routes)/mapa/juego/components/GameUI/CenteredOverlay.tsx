export function CenteredOverlay({
  children,
  background,
  pointer = false,
}: {
  children: React.ReactNode;
  background: string;
  pointer?: boolean;
}) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: pointer ? 'auto' : 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      background,
    }}>
      {children}
    </div>
  );
}
