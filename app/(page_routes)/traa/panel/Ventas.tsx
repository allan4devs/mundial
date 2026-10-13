"use client";

import {
  BarList,
  Card,
  DataTable,
  Legend,
  LineChart,
  ShareBar,
  StatTile,
} from "./Charts";
import {
  crc,
  crcShort,
  pct,
  PAYMENT_MIX,
  SALES_BY_BRANCH,
  SALES_BY_CATEGORY,
  SALES_DAYS,
  SALES_KPI,
  SPARKS,
  TOP_PRODUCTS,
} from "./panelData";

/**
 * Panel de ventas: cuánto entró, por qué canal, en qué se fue y quién lo vendió.
 * El rango de fechas de la fila de filtros ajusta todas las cifras de la vista.
 */
export function Ventas({ range }: { range: 7 | 30 }) {
  const days = SALES_DAYS.slice(-range);
  const factor = range / 30;

  const enLinea = days.reduce((s, d) => s + d.enLinea, 0);
  const mostrador = days.reduce((s, d) => s + d.mostrador, 0);
  const total = enLinea + mostrador;
  const pedidos = Math.round(SALES_KPI.pedidos * factor);
  const ticket = Math.round(enLinea / Math.max(pedidos, 1));
  const share = (enLinea / total) * 100;

  const periodo = `Últimos ${range} días`;
  const scale = (n: number) => Math.round(n * factor);

  return (
    <>
      <div className="tr-wrap tr-dash-tiles">
        <StatTile
          hero
          label={`Ventas · ${periodo.toLowerCase()}`}
          value={crcShort(total)}
          delta={SALES_KPI.totalDelta}
          deltaLabel=" % vs. periodo anterior"
          spark={SPARKS.total.slice(-Math.min(12, range))}
        />
        <StatTile
          label="Pedidos en línea"
          value={pedidos.toString()}
          delta={SALES_KPI.pedidosDelta}
          deltaLabel=" %"
          foot={`${pct(share)} de la venta total`}
          spark={SPARKS.pedidos.slice(-Math.min(12, range))}
        />
        <StatTile
          label="Ticket promedio en línea"
          value={crc(ticket)}
          delta={SALES_KPI.ticketDelta}
          deltaLabel=" %"
          foot="Mostrador: ₡ 38 900"
          spark={SPARKS.ticket.slice(-Math.min(12, range))}
        />
        <StatTile
          label="Conversión del catálogo"
          value={pct(SALES_KPI.conversion)}
          delta={SALES_KPI.conversionDelta}
          deltaLabel=" pp"
          foot="Visitas que terminan en pedido"
          spark={SPARKS.conversion.slice(-Math.min(12, range))}
        />
      </div>

      <div className="tr-wrap tr-dash-grid">
        <Card
          span={2}
          title="Ventas por día"
          sub="El canal en línea crece sin quitarle al mostrador; los domingos casi todo lo que entra es del sitio."
          action={
            <Legend
              items={[
                { label: "En línea", color: "var(--dv-1)" },
                { label: "Mostrador", color: "var(--dv-2)" },
              ]}
            />
          }
        >
          <LineChart
            labels={days.map((d) => d.label)}
            series={[
              { key: "linea", label: "En línea", color: "var(--dv-1)", values: days.map((d) => d.enLinea) },
              { key: "mostrador", label: "Mostrador", color: "var(--dv-2)", values: days.map((d) => d.mostrador) },
            ]}
            format={crc}
            formatAxis={crcShort}
          />
          <DataTable
            head={["Día", "En línea", "Mostrador", "Total"]}
            rows={days.map((d) => [
              d.label,
              crc(d.enLinea),
              crc(d.mostrador),
              crc(d.enLinea + d.mostrador),
            ])}
          />
        </Card>

        <Card title="Ventas por categoría" sub={periodo}>
          <BarList
            rows={SALES_BY_CATEGORY.map((c) => ({
              label: c.label,
              value: scale(c.value),
              hint: scale(c.orders).toString(),
            }))}
            format={crcShort}
            hintLabel="pedidos"
          />
        </Card>

        <Card
          title="Mezcla de pago"
          sub="Participación de cada método sobre los pedidos en línea del periodo"
        >
          <ShareBar parts={PAYMENT_MIX} format={(n) => `${n} %`} />
          <p className="tr-dash-note">
            Siete de cada diez pagos entran por SINPE o tarjeta: son los que se acreditan solos y
            no ocupan a un asesor.
          </p>
        </Card>

        <Card title="Top productos" sub={`Por ingreso · ${periodo.toLowerCase()}`}>
          <div className="tr-dash-scroll">
            <table className="tr-dash-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="is-num">Uds.</th>
                  <th className="is-num">Ingreso</th>
                  <th className="is-num">Margen</th>
                </tr>
              </thead>
              <tbody>
                {TOP_PRODUCTS.map((p) => (
                  <tr key={p.sku}>
                    <td className="is-strong">
                      {p.name}
                      <div className="tr-dash-sku">{p.sku}</div>
                    </td>
                    <td className="is-num">{scale(p.units)}</td>
                    <td className="is-num">{crcShort(scale(p.revenue))}</td>
                    <td className="is-num">{p.margin} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Ventas por sucursal" sub="Incluye el pedido en línea despachado desde cada bodega">
          <BarList
            rows={SALES_BY_BRANCH.map((b) => ({
              label: b.label,
              value: scale(b.value),
              hint: scale(b.orders).toString(),
            }))}
            format={crcShort}
            hintLabel="pedidos"
          />
          <p className="tr-dash-note">
            San José Centro concentra el {pct((SALES_BY_BRANCH[0].value / SALES_BY_BRANCH.reduce((s, b) => s + b.value, 0)) * 100, 0)} de
            la venta: es la bodega que hay que proteger de quiebres de inventario.
          </p>
        </Card>
      </div>
    </>
  );
}
