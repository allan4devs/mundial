/** Ícono de red social dibujado con el path crudo, no con lucide. */
export default function SocialMark({
  path,
  className,
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={path} />
    </svg>
  );
}
