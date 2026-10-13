"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MapPin,
  Package,
  Printer,
  Store,
  Truck,
} from "lucide-react";
import { money } from "../data";
import { IBAN, readOrder, SAMPLE_ORDER, SINPE_NUMBER, type PlacedOrder } from "../order";
import { PartArt } from "../PartArt";

/**
 * /traa/pedido — comprobante posterior al pago.
 *
 * Reemplaza el salto a WhatsApp: al confirmar, el cliente aterriza acá y ve
 * exactamente qué compró, cuánto pagó, cómo y cuándo lo recibe, y qué sigue.
 * El pedido llega por localStorage (la demo no tiene backend); si se abre la
 * URL en frío se muestra un pedido de ejemplo.
 */
export default function PedidoPage() {
  const [order, setOrder] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    setOrder(readOrder(id) ?? SAMPLE_ORDER);
  }, []);

  return (
    <main className="tr-root">
      <div className="tr-demo">
        <div className="tr-wrap">
          <span>
            <b>DEMO</b> · Comprobante de compra — así queda el pedido después de pagar, sin salir
            del sitio.
          </span>
          <Link href="/traa/panel">Ver panel interno</Link>
        </div>
      </div>

      <header className="tr-header">
        <div className="tr-wrap">
          <Link className="tr-logo" href="/traa">
            <b>
              4<i>TRAA</i>
            </b>
            <small>REPUESTOS</small>
          </Link>
          <div className="tr-header-actions" style={{ marginLeft: "auto" }}>
            <Link className="tr-btn tr-btn--ghost" href="/traa">
              <ArrowLeft size={15} />
              <span>Volver al catálogo</span>
            </Link>
          </div>
        </div>
      </header>

      {order ? (
        <Comprobante order={order} />
      ) : (
        <div className="tr-conf-loading">Cargando pedido…</div>
      )}

      <footer className="tr-foot">
        <div className="tr-wrap">
          <span className="tr-logo" style={{ color: "#a49c94" }}>
            <b>
              4<i>TRAA</i>
            </b>
            <small>REPUESTOS</small>
          </span>
          <span>Demo de propuesta · San José, Costa Rica</span>
          <div className="tr-foot-links">
            <Link href="/traa">Catálogo</Link>
            <Link href="/traa/panel">Panel interno</Link>
            <Link href="/">La Vieja Adventures</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Comprobante({ order }: { order: PlacedOrder }) {
  const units = order.lines.reduce((n, l) => n + l.qty, 0);
  const retiro = order.delivery.id === "retiro";
  const pagado = order.payment.id === "tarjeta";
  const porConfirmar = order.payment.id === "sinpe" || order.payment.id === "transferencia";

  const fecha = new Date(order.createdAt).toLocaleString("es-CR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const pasos: { label: string; detail: string; state: "done" | "now" | "next" }[] = [
    { label: "Pedido recibido", detail: fecha, state: "done" },
    pagado
      ? { label: "Pago aprobado", detail: `Tarjeta ····${order.card4 ?? "0000"}`, state: "done" }
      : porConfirmar
        ? { label: "Pago por confirmar", detail: "Adjuntá el comprobante", state: "now" }
        : { label: "Pago contra entrega", detail: "Se cobra al recibir", state: "next" },
    {
      label: "En preparación",
      detail: `Bodega ${order.branch ?? "San José Centro"}`,
      state: pagado ? "now" : "next",
    },
    retiro
      ? { label: "Listo para retiro", detail: order.branch ?? "", state: "next" }
      : { label: "En ruta", detail: order.delivery.label.split(" · ")[0], state: "next" },
    { label: "Entregado", detail: order.delivery.eta, state: "next" },
  ];

  return (
    <>
      {/* -------- encabezado del comprobante -------- */}
      <section className="tr-wrap tr-conf-hero">
        <span className="tr-conf-check">
          <CheckCircle2 size={34} />
        </span>
        <h1>¡Gracias por tu compra!</h1>
        <p className="tr-conf-sub">
          Recibimos tu pedido y ya lo estamos alistando. Guardá este número: con él consultás el
          estado en cualquier sucursal.
        </p>
        <div className="tr-conf-id">{order.id}</div>
        <div className="tr-conf-date">{fecha}</div>
      </section>

      <section className="tr-wrap tr-conf-grid">
        {/* -------- columna principal -------- */}
        <div className="tr-conf-main">
          <div className="tr-conf-card">
            <h2 className="tr-conf-h2">
              <Package size={16} /> Lo que compraste
              <span className="tr-conf-count">
                {order.lines.length} {order.lines.length === 1 ? "línea" : "líneas"} · {units} art.
              </span>
            </h2>

            {order.lines.map((l) => (
              <div className="tr-conf-line" key={l.id}>
                <div className="tr-conf-thumb">
                  <PartArt category={l.category} />
                </div>
                <div className="tr-conf-line-info">
                  <h3>{l.name}</h3>
                  <div className="tr-conf-line-meta">
                    {l.brand} · {l.id}
                  </div>
                  <div className="tr-conf-line-meta">
                    {l.qty} × {money(l.unit)}
                  </div>
                </div>
                <span className="tr-conf-line-total">{money(l.unit * l.qty)}</span>
              </div>
            ))}

            <dl className="tr-conf-totals">
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal)}</dd>
              <dt>Envío</dt>
              <dd className={order.shippingFree ? "is-free" : undefined}>
                {order.shippingFree ? "Gratis" : money(order.shipping)}
              </dd>
              <dt>IVA</dt>
              <dd>Incluido</dd>
              <dt className="is-total">Total</dt>
              <dd className="is-total">{money(order.total)}</dd>
            </dl>
          </div>

          <div className="tr-conf-card">
            <h2 className="tr-conf-h2">
              <Clock size={16} /> Estado del pedido
            </h2>
            <ol className="tr-conf-steps">
              {pasos.map((p) => (
                <li key={p.label} className={`is-${p.state}`}>
                  <span className="tr-conf-dot">
                    {p.state === "done" ? <Check size={12} /> : null}
                  </span>
                  <div>
                    <b>{p.label}</b>
                    {p.detail && <span>{p.detail}</span>}
                  </div>
                </li>
              ))}
            </ol>
            <p className="tr-hint">
              Te avisamos por correo y SMS en cada cambio de estado. Entrega estimada:{" "}
              <b style={{ color: "var(--tr-text)" }}>{order.delivery.eta}</b>.
            </p>
          </div>
        </div>

        {/* -------- columna lateral -------- */}
        <aside className="tr-conf-side">
          <div className="tr-conf-card">
            <h2 className="tr-conf-h2">
              {retiro ? <Store size={16} /> : <Truck size={16} />} Entrega
            </h2>
            <div className="tr-conf-kv">
              <span>Método</span>
              <b>{order.delivery.label}</b>
            </div>
            <div className="tr-conf-kv">
              <span>Tiempo</span>
              <b>{order.delivery.eta}</b>
            </div>
            {retiro ? (
              <div className="tr-conf-kv">
                <span>Sucursal</span>
                <b>{order.branch}</b>
              </div>
            ) : order.address ? (
              <>
                <div className="tr-conf-kv">
                  <span>Recibe</span>
                  <b>{order.address.nombre}</b>
                </div>
                <div className="tr-conf-kv">
                  <span>Teléfono</span>
                  <b>{order.address.telefono}</b>
                </div>
                <div className="tr-conf-addr">
                  <MapPin size={13} />
                  <span>
                    {order.address.direccion}, {order.address.canton}, {order.address.provincia}
                  </span>
                </div>
              </>
            ) : null}
          </div>

          <div className="tr-conf-card">
            <h2 className="tr-conf-h2">
              <BadgeCheck size={16} /> Pago
            </h2>
            <div className="tr-conf-kv">
              <span>Método</span>
              <b>{order.payment.label}</b>
            </div>
            <div className="tr-conf-kv">
              <span>Monto</span>
              <b>{money(order.total)}</b>
            </div>
            <div className="tr-conf-kv">
              <span>Estado</span>
              <b className={pagado ? "is-ok" : "is-pending"}>
                {pagado ? "Aprobado" : porConfirmar ? "Por confirmar" : "Se cobra al entregar"}
              </b>
            </div>

            {order.payment.id === "sinpe" && (
              <div className="tr-conf-pay">
                <p>
                  Hacé el SINPE Móvil por <b>{money(order.total)}</b> a nombre de TRAA Repuestos
                  S.A. y adjuntá el comprobante acá abajo.
                </p>
                <CopyRow label="SINPE Móvil" value={SINPE_NUMBER} />
                <CopyRow label="Referencia" value={order.id} />
              </div>
            )}
            {order.payment.id === "transferencia" && (
              <div className="tr-conf-pay">
                <p>
                  Transferí <b>{money(order.total)}</b> a la cuenta IBAN de TRAA Repuestos S.A.
                  (BAC / Banco Nacional) usando el número de pedido como detalle.
                </p>
                <CopyRow label="IBAN" value={IBAN} />
                <CopyRow label="Referencia" value={order.id} />
              </div>
            )}
            {order.payment.id === "contra" && (
              <p className="tr-hint" style={{ marginTop: 10 }}>
                Pagás al recibir, en efectivo o con datáfono. Tené listo el monto exacto si es en
                efectivo.
              </p>
            )}
            {pagado && (
              <p className="tr-hint" style={{ marginTop: 10 }}>
                Cobro autorizado con 3-D Secure. El comprobante fiscal electrónico llega a tu
                correo en los próximos minutos.
              </p>
            )}

            {porConfirmar && (
              <button className="tr-btn tr-btn--primary tr-btn--block" style={{ marginTop: 12 }}>
                <Copy size={15} /> Adjuntar comprobante
              </button>
            )}
          </div>

          <div className="tr-conf-actions">
            <button className="tr-btn tr-btn--ghost tr-btn--block" onClick={() => window.print()}>
              <Printer size={15} /> Imprimir comprobante
            </button>
            <Link className="tr-btn tr-btn--primary tr-btn--block" href="/traa">
              Seguir comprando
            </Link>
          </div>

          <p className="tr-note" style={{ textAlign: "center", padding: 0 }}>
            Demostración: no se procesó ningún cobro real ni se despachará ningún repuesto.
          </p>
        </aside>
      </section>
    </>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* portapapeles no disponible */
    }
  }

  return (
    <button className="tr-conf-copy" onClick={copy} type="button">
      <span className="tr-conf-copy-l">{label}</span>
      <b>{value}</b>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
