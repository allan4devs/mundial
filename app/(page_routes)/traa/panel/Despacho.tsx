"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Printer } from "lucide-react";
import { BarList, Card, Columns, DataTable, StatTile } from "./Charts";
import {
  CARRIER_SLA,
  crc,
  DISPATCH_DAYS,
  DISPATCH_KPI,
  pct,
  QUEUE,
  QUEUE_STATE_LABEL,
  RISK_LABEL,
  STAGES,
  type QueueRisk,
  type QueueState,
} from "./panelData";

type Filter = "todos" | QueueState | "atrasados";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "recibido", label: "Recibidos" },
  { id: "alistado", label: "En alistado" },
  { id: "empacado", label: "Empacados" },
  { id: "ruta", label: "En ruta" },
  { id: "atrasados", label: "Atrasados" },
];

const RISK_ICON: Record<QueueRisk, typeof Clock> = {
  ok: CheckCircle2,
  riesgo: Clock,
  atrasado: AlertTriangle,
};

/**
 * Panel de despacho: qué hay que sacar hoy, quién lo lleva y qué se está
 * saliendo del tiempo prometido al cliente.
 */
export function Despacho() {
  const [filter, setFilter] = useState<Filter>("todos");

  const rows = QUEUE.filter((r) =>
    filter === "todos"
      ? true
      : filter === "atrasados"
        ? r.riesgo === "atrasado"
        : r.estado === filter,
  );

  const maxStage = Math.max(...STAGES.map((s) => s.count));
  const pendiente = QUEUE.reduce((s, r) => (r.estado === "entregado" ? s : s + r.total), 0);

  return (
    <>
      <div className="tr-wrap tr-dash-tiles">
        <StatTile
          hero
          label="Por despachar hoy"
          value={DISPATCH_KPI.porDespachar.toString()}
          delta={DISPATCH_KPI.porDespacharDelta}
          deltaLabel=" vs. ayer"
          foot={`${crc(pendiente)} en mercadería pendiente de salir`}
        />
        <StatTile
          label="En ruta"
          value={DISPATCH_KPI.enRuta.toString()}
          foot="Con guía y transportista asignados"
        />
        <StatTile
          label="Entregados hoy"
          value={DISPATCH_KPI.entregadosHoy.toString()}
          delta={DISPATCH_KPI.entregadosDelta}
          deltaLabel=" vs. ayer"
          foot={`SLA global ${pct(DISPATCH_KPI.slaGlobal)}`}
        />
        <StatTile
          tone="critical"
          label="Atrasados"
          value={DISPATCH_KPI.atrasados.toString()}
          foot={`Alistado promedio: ${DISPATCH_KPI.tiempoAlistado}`}
        />
      </div>

      {/* -------- tubería de estados -------- */}
      <div className="tr-wrap tr-dash-pipe">
        {STAGES.map((s) => (
          <div className="tr-dash-stage" key={s.id}>
            <div className="tr-dash-stage-n">{s.count}</div>
            <span className="tr-dash-stage-l">{s.label}</span>
            <span className="tr-dash-stage-h">{s.hint}</span>
            <div className="tr-dash-stage-meter">
              <i style={{ width: `${(s.count / maxStage) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="tr-wrap tr-dash-grid">
        <Card
          title="Despachos por día"
          sub="Últimos 14 días · pedidos que salieron de bodega"
        >
          <Columns
            labels={DISPATCH_DAYS.map((d) => d.label)}
            values={DISPATCH_DAYS.map((d) => d.value)}
            format={(n) => n.toString()}
            unit="despachos"
          />
          <DataTable
            head={["Día", "Despachos"]}
            rows={DISPATCH_DAYS.map((d) => [d.label, d.value])}
          />
        </Card>

        <Card
          title="Cumplimiento por transportista"
          sub="Entregas dentro del tiempo prometido · últimos 30 días"
        >
          <BarList
            rows={CARRIER_SLA.map((c) => ({
              label: c.label,
              value: c.value,
              hint: c.envios.toString(),
            }))}
            format={(n) => pct(n)}
            hintLabel="envíos"
          />
          <p className="tr-dash-note">
            La encomienda de bus es la que más se sale del tiempo prometido. Con este dato se
            renegocia la tarifa o se cambia de ruta antes de que el cliente reclame.
          </p>
        </Card>

        <Card
          span={2}
          title="Cola de despacho"
          sub={`${rows.length} de ${QUEUE.length} pedidos`}
          action={
            <div className="tr-dash-qfilter">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  className={filter === f.id ? "is-active" : undefined}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="tr-dash-scroll">
            <table className="tr-dash-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Sucursal</th>
                  <th>Entrega</th>
                  <th className="is-num">Art.</th>
                  <th className="is-num">Total</th>
                  <th>Estado</th>
                  <th>Compromiso</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const Icon = RISK_ICON[r.riesgo];
                  return (
                    <tr key={r.id}>
                      <td className="is-strong">{r.id}</td>
                      <td>{r.cliente}</td>
                      <td>{r.sucursal}</td>
                      <td>
                        {r.metodo}
                        <div className="tr-dash-sku">{r.transportista}</div>
                      </td>
                      <td className="is-num">{r.items}</td>
                      <td className="is-num">{crc(r.total)}</td>
                      <td>
                        <span className="tr-dash-chip">{QUEUE_STATE_LABEL[r.estado]}</span>
                      </td>
                      <td>
                        <span className={`tr-dash-chip is-${r.riesgo}`}>
                          <Icon size={12} />
                          {RISK_LABEL[r.riesgo]} · {r.eta}
                        </span>
                      </td>
                      <td>
                        <button className="tr-dash-act" title="Demostración: no imprime nada">
                          <Printer size={12} /> Guía
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ color: "var(--tr-text-mute)", padding: "18px 0" }}>
                      No hay pedidos en ese estado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="tr-dash-note">
            Cada fila es un pedido real del sitio: entra pagado, con dirección validada y con la
            sucursal que tiene la parte. El asesor deja de transcribir WhatsApps.
          </p>
        </Card>
      </div>
    </>
  );
}
