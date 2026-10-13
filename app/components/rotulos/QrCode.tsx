import { BUSINESS, QR_TARGET } from "./constants";
import { buildQrPath } from "./helpers";

/** Se calcula una sola vez por módulo: la matriz nunca cambia. */
const QR = buildQrPath(QR_TARGET);

/** Negro sobre blanco y con margen: asi es como de verdad escanea un telefono. */
export default function QrCode({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`-2 -2 ${QR.size + 4} ${QR.size + 4}`}
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label={`Codigo QR a ${BUSINESS.web}`}
    >
      <rect x={-2} y={-2} width={QR.size + 4} height={QR.size + 4} fill="#ffffff" />
      <path d={QR.path} fill="#052e16" />
    </svg>
  );
}
