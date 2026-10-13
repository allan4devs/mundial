"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgePercent,
  BarChart3,
  Boxes,
  Check,
  CreditCard,
  MapPin,
  Phone,
  Search,
  ShoppingCart,
  Timer,
  Truck,
} from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  FREE_SHIPPING_THRESHOLD,
  money,
  norm,
  PRODUCTS,
  STOCK_LABEL,
  WHATSAPP,
  type CategoryId,
  type Product,
} from "./data";
import { PartArt } from "./PartArt";
import { CheckoutDrawer, type CartLine } from "./CheckoutDrawer";

const CART_KEY = "traa-cart-v1";
const NAV = ["Nosotros", "Divisiones", "Catálogo en Línea", "Marcas", "Sucursales", "REEP", "Contacto"];

type Cart = Record<string, number>;

export default function TraaPitchPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const [cart, setCart] = useState<Cart>({});
  const [drawer, setDrawer] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // cargar / guardar carrito
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setCart(JSON.parse(raw) as Cart);
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  const addToCart = useCallback((id: string) => {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
    setAddedId(id);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAddedId(null), 1200);
  }, []);

  const setQty = useCallback((id: string, delta: number) => {
    setCart((c) => {
      const next = { ...c };
      const q = (next[id] ?? 0) + delta;
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }, []);

  const removeLine = useCallback((id: string) => {
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const lines: CartLine[] = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const product = PRODUCTS.find((p) => p.id === id);
          return product ? { product, qty } : null;
        })
        .filter((x): x is CartLine => x !== null),
    [cart],
  );
  const count = lines.reduce((n, l) => n + l.qty, 0);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return PRODUCTS.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (!q) return true;
      return norm(`${p.name} ${p.brand} ${p.id} ${CATEGORY_LABEL[p.category]}`).includes(q);
    });
  }, [query, cat]);

  function openCheckoutDemo() {
    if (lines.length === 0) {
      const sample = PRODUCTS.find((p) => p.id === "TR-ELE-0540") ?? PRODUCTS[0];
      setCart((c) => ({ ...c, [sample.id]: (c[sample.id] ?? 0) + 1 }));
    }
    setDrawer(true);
  }

  return (
    <main className="tr-root">
      {/* -------- cinta de demo -------- */}
      <div className="tr-demo">
        <div className="tr-wrap">
          <span>
            <b>DEMO</b> · Propuesta de tienda en línea para TRAA Repuestos — carrito, pago SINPE /
            tarjeta y envíos a todo el país.
          </span>
          <a href="#propuesta">¿Por qué?</a>
          <Link href="/traa/panel">Panel interno</Link>
        </div>
      </div>

      {/* -------- header -------- */}
      <header className="tr-header">
        <div className="tr-wrap">
          <a className="tr-logo" href="#top">
            <b>
              4<i>TRAA</i>
            </b>
            <small>REPUESTOS</small>
          </a>

          <nav className="tr-nav">
            {NAV.map((item) => (
              <a
                key={item}
                href={item === "Contacto" ? `https://wa.me/${WHATSAPP}` : "#top"}
                className={item === "Catálogo en Línea" ? "is-active" : undefined}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="tr-header-actions">
            <button
              className="tr-cartbtn"
              onClick={() => setDrawer(true)}
              aria-label={`Abrir carrito (${count})`}
            >
              <ShoppingCart size={18} />
              {count > 0 && <span>{count}</span>}
            </button>
            <a className="tr-btn tr-btn--primary" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
              <Phone size={15} />
              <span>Hablar con un asesor</span>
            </a>
          </div>
        </div>
      </header>

      {/* -------- buscador -------- */}
      <section className="tr-wrap tr-searchwrap" id="top">
        <div className="tr-search">
          <div className="tr-search-field">
            <Search size={18} />
            <input
              className="tr-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar repuesto, marca o código…"
              aria-label="Buscar en el catálogo"
            />
          </div>
          <button className="tr-btn tr-btn--primary" onClick={() => undefined}>
            <Search size={16} />
            <span>Buscar</span>
          </button>
        </div>

        <div className="tr-chips">
          <button
            className={`tr-chip${cat === "all" ? " is-active" : ""}`}
            onClick={() => setCat("all")}
          >
            Todos
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`tr-chip${cat === c.id ? " is-active" : ""}`}
              onClick={() => setCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <p className="tr-results">
          <b>{filtered.length}</b> {filtered.length === 1 ? "producto encontrado" : "productos encontrados"}
          {query.trim() && (
            <>
              {" "}
              para <b>“{query.trim()}”</b>
            </>
          )}
          {cat !== "all" && <> en {CATEGORY_LABEL[cat]}</>}
        </p>
      </section>

      {/* -------- grilla -------- */}
      <section className="tr-wrap">
        {filtered.length === 0 ? (
          <div className="tr-empty">
            No encontramos repuestos para esa búsqueda. Probá con el código de parte o el nombre
            de la marca — o escribinos y lo conseguimos.
          </div>
        ) : (
          <div className="tr-grid">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                added={addedId === p.id}
                onAdd={() => addToCart(p.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* -------- pitch -------- */}
      <section className="tr-pitch" id="propuesta">
        <div className="tr-wrap">
          <p className="tr-eyebrow">La propuesta</p>
          <h2>
            De catálogo a <span className="tr-hl">tienda en línea</span>
          </h2>
          <p className="tr-lead">
            Hoy el catálogo termina en “Consulte su precio” y una llamada. Con esta capa el cliente
            ve el precio, agrega al carrito, paga por SINPE Móvil o tarjeta y programa el envío —
            sin salir del sitio y sin recargar a los asesores con cotizaciones de rutina. El mismo
            look, el mismo inventario, un paso más.
          </p>

          <div className="tr-feats">
            {[
              {
                icon: CreditCard,
                t: "Pago en línea",
                d: "SINPE Móvil, tarjeta con 3-D Secure, transferencia a IBAN y contra entrega. El comprobante queda en pantalla y en el correo, sin salir del sitio.",
              },
              {
                icon: Truck,
                t: "Envíos a todo el país",
                d: "Correos de Costa Rica, encomienda de bus, GAM exprés 24–48 h y retiro en sucursal. Tarifa y fecha al instante.",
              },
              {
                icon: Boxes,
                t: "Inventario por sucursal",
                d: "Stock real por tienda y estado (disponible, últimas unidades, sobre pedido). El cliente sabe antes de ir.",
              },
              {
                icon: Timer,
                t: "Checkout en 60 segundos",
                d: "Sin crear cuenta. Tres pasos: carrito, entrega, pago. El asesor entra solo cuando hace falta.",
              },
              {
                icon: BarChart3,
                t: "Panel de ventas y despacho",
                d: "Cada pedido cae en un tablero: qué se vende y con qué margen, qué hay que sacar hoy y qué se está atrasando.",
              },
            ].map((f) => (
              <div className="tr-feat" key={f.t}>
                <span className="tr-feat-ico">
                  <f.icon size={20} />
                </span>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>

          <div className="tr-metrics">
            <div className="tr-metric">
              <b>24/7</b>
              <span>El catálogo vende de noche</span>
            </div>
            <div className="tr-metric">
              <b>−40%*</b>
              <span>Cotizaciones de rutina al asesor</span>
            </div>
            <div className="tr-metric">
              <b>8</b>
              <span>Sucursales conectadas al stock</span>
            </div>
            <div className="tr-metric">
              <b>{money(FREE_SHIPPING_THRESHOLD)}</b>
              <span>Umbral de envío nacional gratis</span>
            </div>
          </div>

          <div className="tr-cta">
            <a
              className="tr-btn tr-btn--primary"
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                "Hola, vimos la demo de la tienda en línea de TRAA y queremos agendar una presentación.",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Phone size={15} /> Agendar demo
            </a>
            <button className="tr-btn tr-btn--ghost" onClick={openCheckoutDemo}>
              <ShoppingCart size={15} /> Probar el checkout
            </button>
            <Link className="tr-btn tr-btn--ghost" href="/traa/panel">
              <BarChart3 size={15} /> Ver el panel interno
            </Link>
          </div>
          <p className="tr-note">
            * Estimación ilustrativa para el pitch. Cifras y branding con fines de demostración; no
            es un sitio oficial de TRAA Repuestos.
          </p>
        </div>
      </section>

      {/* -------- footer -------- */}
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
            <a href="#top">Catálogo</a>
            <a href="#propuesta">La propuesta</a>
            <Link href="/traa/panel">Panel interno</Link>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            <Link href="/">La Vieja Adventures</Link>
          </div>
        </div>
      </footer>

      <CheckoutDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        lines={lines}
        onQty={setQty}
        onRemove={removeLine}
        onClear={clearCart}
      />
    </main>
  );
}

function ProductCard({
  product,
  added,
  onAdd,
}: {
  product: Product;
  added: boolean;
  onAdd: () => void;
}) {
  const off =
    product.listPrice && product.listPrice > product.price
      ? Math.round((1 - product.price / product.listPrice) * 100)
      : 0;

  return (
    <article className="tr-card">
      <div className="tr-card-img">
        <PartArt category={product.category} />
        {off > 0 && <span className="tr-ribbon">−{off}%</span>}
      </div>
      <div className="tr-card-body">
        <span className="tr-tag">{CATEGORY_LABEL[product.category]}</span>
        <h3 className="tr-name">{product.name}</h3>

        <div className="tr-price">
          {money(product.price)}
          {product.listPrice && product.listPrice > product.price && (
            <s>{money(product.listPrice)}</s>
          )}
        </div>
        <div className="tr-iva">IVA incluido</div>

        <div className="tr-meta">
          <span>Marca</span>
          <span>{product.brand}</span>
        </div>
        <div className="tr-meta" style={{ marginTop: 0 }}>
          <span>Código</span>
          <span>{product.id}</span>
        </div>

        <div
          className={
            product.stock === "in"
              ? "tr-stock tr-stock--in"
              : product.stock === "low"
                ? "tr-stock tr-stock--low"
                : "tr-stock tr-stock--consult"
          }
        >
          {product.stock === "consult" ? (
            <MapPin size={13} />
          ) : product.stock === "low" ? (
            <BadgePercent size={13} />
          ) : (
            <Check size={13} />
          )}
          {STOCK_LABEL[product.stock]}
          {product.stock !== "consult" && (
            <span style={{ color: "var(--tr-text-mute)", fontWeight: 400, letterSpacing: 0 }}>
              · {product.branches.length} suc.
            </span>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <button className={`tr-add${added ? " is-added" : ""}`} onClick={onAdd}>
          {added ? (
            <>
              <Check size={15} /> Agregado
            </>
          ) : (
            <>
              <ShoppingCart size={15} /> Agregar
            </>
          )}
        </button>
      </div>
    </article>
  );
}
