"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, PackageCheck, TrendingUp } from "lucide-react";
import { Despacho } from "./Despacho";
import { Ventas } from "./Ventas";
import "./panel.css";

/**
 * /traa/panel — la trastienda de la propuesta.
 *
 * Vista previa (datos de demostración, sin backend) de los dos tableros que la
 * tienda en línea habilita el día uno: ventas —qué se vende, por qué canal y
 * con qué margen— y despacho —qué hay que sacar hoy y qué se está atrasando—.
 */
type Tab = "ventas" | "despacho";

export default function PanelPage() {
  const [tab, setTab] = useState<Tab>("ventas");
  const [range, setRange] = useState<7 | 30>(30);

  return (
    <main className="tr-root tr-panel">
      <div className="tr-demo">
        <div className="tr-wrap">
          <span>
            <b>DEMO</b> · Panel interno — vista previa con datos de ejemplo. Ninguna cifra es real.
          </span>
          <Link href="/traa">Volver a la tienda</Link>
        </div>
      </div>

      <header className="tr-panel-head">
        <div className="tr-wrap">
          <Link className="tr-logo" href="/traa">
            <b>
              4<i>TRAA</i>
            </b>
            <small>REPUESTOS</small>
          </Link>
          <span className="tr-panel-badge">Panel</span>

          <div className="tr-panel-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "ventas"}
              className={tab === "ventas" ? "is-active" : undefined}
              onClick={() => setTab("ventas")}
            >
              <TrendingUp size={14} /> Ventas
            </button>
            <button
              role="tab"
              aria-selected={tab === "despacho"}
              className={tab === "despacho" ? "is-active" : undefined}
              onClick={() => setTab("despacho")}
            >
              <PackageCheck size={14} /> Despacho
            </button>
          </div>

          <div className="tr-panel-user">
            <span className="tr-panel-avatar">KM</span>
            <span>
              <b>Karla Méndez</b> · Gerencia comercial
            </span>
          </div>
        </div>
      </header>

      {/* -------- una sola fila de filtros, arriba de todo -------- */}
      <div className="tr-wrap tr-dash-filters">
        {tab === "ventas" ? (
          <>
            <div className="tr-dash-range">
              {([7, 30] as const).map((r) => (
                <button
                  key={r}
                  className={range === r ? "is-active" : undefined}
                  onClick={() => setRange(r)}
                >
                  Últimos {r} días
                </button>
              ))}
            </div>
            <span className="tr-hint">Todas las sucursales · IVA incluido</span>
          </>
        ) : (
          <span className="tr-hint">
            Turno del 4 de setiembre · seis sucursales · corte de despacho 4 p. m.
          </span>
        )}
        <span className="tr-dash-updated">
          <i /> Actualizado hace 2 min
        </span>
      </div>

      {tab === "ventas" ? <Ventas range={range} /> : <Despacho />}

      <div className="tr-wrap">
        <p className="tr-dash-note" style={{ maxWidth: "76ch" }}>
          Vista previa para el pitch: los datos son sintéticos y el panel no se conecta a ningún
          sistema. En producción estos dos tableros se alimentan de los mismos pedidos que genera
          el catálogo —{" "}
          <Link href="/traa/pedido" style={{ color: "var(--tr-orange-hi)" }}>
            así ve el cliente su compra
          </Link>{" "}
          — sin doble digitación.
        </p>
      </div>

      <footer className="tr-foot" style={{ marginTop: 40 }}>
        <div className="tr-wrap">
          <span className="tr-logo" style={{ color: "#a49c94" }}>
            <b>
              4<i>TRAA</i>
            </b>
            <small>REPUESTOS</small>
          </span>
          <span>Demo de propuesta · San José, Costa Rica</span>
          <div className="tr-foot-links">
            <Link href="/traa">
              <ArrowLeft size={12} style={{ verticalAlign: "-1px" }} /> Catálogo
            </Link>
            <Link href="/traa/pedido">Comprobante</Link>
            <Link href="/">La Vieja Adventures</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
