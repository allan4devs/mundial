"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  Building2,
  CheckCircle2,
  Clipboard,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Users,
  Wifi,
  X,
} from "lucide-react";

export interface WifiEntry {
  id: string;
  ssid: string;
  password: string;
  notes?: string;
  category: string;
  placeName?: string;
  area?: string;
  sharedBy?: string;
  consentConfirmed: boolean;
  createdAt: string;
}

interface WifiClientProps {
  entries: WifiEntry[];
  isDatabaseConfigured: boolean;
  createWifiEntry: (formData: FormData) => Promise<void>;
}

const categories = [
  { id: "all", label: "Todo", icon: Wifi },
  { id: "home", label: "Casas", icon: Home },
  { id: "cafe", label: "Cafe", icon: Sparkles },
  { id: "restaurant", label: "Comida", icon: Building2 },
  { id: "store", label: "Tiendas", icon: Store },
  { id: "office", label: "Oficinas", icon: Building2 },
  { id: "hotel", label: "Hospedaje", icon: Home },
  { id: "public", label: "Publicas", icon: Users },
  { id: "other", label: "Otras", icon: Wifi },
];

const categoryLabels = new Map(categories.map((category) => [category.id, category.label]));

function buildWifiConfig(entry: WifiEntry) {
  const escapedSsid = entry.ssid.replace(/([\\;,:"])/g, "\\$1");
  const escapedPassword = entry.password.replace(/([\\;,:"])/g, "\\$1");

  return `WIFI:T:WPA;S:${escapedSsid};P:${escapedPassword};;`;
}

function maskPassword(password: string) {
  if (!password) {
    return "";
  }

  return "*".repeat(Math.min(Math.max(password.length, 8), 18));
}

export default function WifiClient({ entries, isDatabaseConfigured, createWifiEntry }: WifiClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [connectEntry, setConnectEntry] = useState<WifiEntry | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesCategory = activeCategory === "all" || entry.category === activeCategory;
      const haystack = [entry.ssid, entry.placeName, entry.area, entry.sharedBy, entry.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [activeCategory, entries, query]);

  const stats = useMemo(() => {
    const areas = new Set(entries.map((entry) => entry.area).filter(Boolean));
    const places = new Set(entries.map((entry) => entry.placeName || entry.ssid).filter(Boolean));

    return [
      { label: "Redes guardadas", value: entries.length },
      { label: "Lugares", value: places.size },
      { label: "Zonas", value: areas.size },
    ];
  }, [entries]);

  useEffect(() => {
    let isActive = true;

    if (!connectEntry) {
      setQrCodeUrl("");
      return;
    }

    QRCode.toDataURL(buildWifiConfig(connectEntry), {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 8,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    }).then((url) => {
      if (isActive) {
        setQrCodeUrl(url);
      }
    });

    return () => {
      isActive = false;
    };
  }, [connectEntry]);

  function toggleReveal(id: string) {
    setRevealedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  async function copyText(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1400);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    startTransition(async () => {
      await createWifiEntry(new FormData(form));
      form.reset();
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#172033]">
      <section className="border-b border-[#dfe5dc] bg-[#fdfdf9]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-12">
          <div className="flex min-w-0 flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
              <ShieldCheck size={18} aria-hidden="true" />
              Directorio WiFi autorizado
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight text-[#122018] sm:text-5xl lg:text-6xl">
              WiFi de confianza para Ciudad Quesada
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Compartalo con familia, compas y lugares que dieron permiso. Nada de claves sacadas a escondidas, mae:
              aqui la vuelta es util, rapida y limpia.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <strong className="block text-3xl font-black text-emerald-700">{stat.value}</strong>
                  <span className="mt-1 block text-sm font-bold text-slate-600">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 shrink-0 text-amber-700" size={24} aria-hidden="true" />
              <div>
                <h2 className="text-lg font-black">Regla de oro</h2>
                <p className="mt-2 text-sm leading-6">
                  Solo agregue redes propias o donde el dueno/encargado autorizo compartir la clave. Bancos, tiendas o
                  negocios deben aprobarlo antes. Seguridad primero, como cuando el rio viene crecido.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[390px_minmax(0,1fr)] lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-emerald-700 text-white">
              <Plus size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-black">Agregar red</h2>
              <p className="text-sm text-slate-600">Para accesos autorizados y compartidos con permiso.</p>
            </div>
          </div>

          {!isDatabaseConfigured ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
              Falta configurar <code>MONGODB_URI</code>. El directorio se puede ver, pero no guardar entradas todavia.
            </div>
          ) : null}

          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Nombre del lugar
              <input
                name="placeName"
                type="text"
                placeholder="Casa de la familia, cafeteria, oficina..."
                className="min-h-11 rounded-md border border-slate-300 px-3 text-base font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Nombre de la red
              <input
                name="ssid"
                type="text"
                required
                placeholder="SSID"
                className="min-h-11 rounded-md border border-slate-300 px-3 text-base font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Clave WiFi
              <input
                name="password"
                type="text"
                required
                autoComplete="off"
                placeholder="Clave autorizada"
                className="min-h-11 rounded-md border border-slate-300 px-3 text-base font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Categoria
                <select
                  name="category"
                  className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-base font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  defaultValue="home"
                >
                  {categories
                    .filter((category) => category.id !== "all")
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Zona
                <input
                  name="area"
                  type="text"
                  defaultValue="Ciudad Quesada"
                  className="min-h-11 rounded-md border border-slate-300 px-3 text-base font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Compartido por
              <input
                name="sharedBy"
                type="text"
                placeholder="Allan, Vero, Familia..."
                className="min-h-11 rounded-md border border-slate-300 px-3 text-base font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Notas
              <textarea
                name="notes"
                rows={3}
                placeholder="Ej: pedir consumo, clave cambia los lunes, red de invitados..."
                className="rounded-md border border-slate-300 px-3 py-3 text-base font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-700">
              <input name="consentConfirmed" type="checkbox" required className="mt-1 size-4 accent-emerald-700" />
              Tengo permiso para compartir esta red y entiendo que se mostrara a quienes tengan acceso a esta pagina.
            </label>

            <button
              type="submit"
              disabled={!isDatabaseConfigured || isPending}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-base font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <KeyRound size={20} aria-hidden="true" />
              {isPending ? "Guardando..." : "Guardar WiFi"}
            </button>
          </div>
        </form>

        <div className="min-w-0">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por red, lugar, zona o nota"
                  className="min-h-12 w-full rounded-md border border-slate-300 pl-10 pr-3 text-base font-semibold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategory(category.id)}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-black transition ${
                        isActive
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                      title={`Filtrar por ${category.label}`}
                    >
                      <Icon size={16} aria-hidden="true" />
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {filteredEntries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                <Wifi className="mx-auto text-slate-400" size={42} aria-hidden="true" />
                <h2 className="mt-4 text-xl font-black">Todavia no hay redes aqui</h2>
                <p className="mt-2 text-slate-600">
                  Agregue la primera red autorizada y queda lista para compartir con la familia. Pura vida.
                </p>
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const isRevealed = revealedIds.has(entry.id);

                return (
                  <article key={entry.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-800">
                            <Wifi size={14} aria-hidden="true" />
                            {categoryLabels.get(entry.category) ?? "Otra"}
                          </span>
                          {entry.consentConfirmed ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-800">
                              <CheckCircle2 size={14} aria-hidden="true" />
                              Autorizada
                            </span>
                          ) : null}
                        </div>
                        <h2 className="mt-3 break-words text-2xl font-black text-slate-950">
                          {entry.placeName || entry.ssid}
                        </h2>
                        <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-600">
                          <MapPin size={16} aria-hidden="true" />
                          {entry.area || "Ciudad Quesada"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyText(`ssid-${entry.id}`, entry.ssid)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                          title="Copiar nombre de red"
                        >
                          <Clipboard size={16} aria-hidden="true" />
                          {copiedId === `ssid-${entry.id}` ? "Copiado" : "SSID"}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyText(`password-${entry.id}`, entry.password)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                          title="Copiar clave"
                        >
                          <KeyRound size={16} aria-hidden="true" />
                          {copiedId === `password-${entry.id}` ? "Copiado" : "Clave"}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyText(`wifi-${entry.id}`, buildWifiConfig(entry))}
                          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                          title="Copiar configuracion WiFi"
                        >
                          <Wifi size={16} aria-hidden="true" />
                          {copiedId === `wifi-${entry.id}` ? "Copiado" : "Config"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConnectEntry(entry)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-emerald-700 bg-emerald-700 px-3 text-sm font-black text-white hover:border-emerald-800 hover:bg-emerald-800"
                          title="Mostrar QR para conectar"
                        >
                          <Smartphone size={16} aria-hidden="true" />
                          Conectar
                        </button>
                      </div>
                    </div>

                    <dl className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <dt className="text-xs font-black uppercase text-slate-500">Red</dt>
                        <dd className="mt-1 break-words font-mono text-lg font-black text-slate-900">{entry.ssid}</dd>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <dt className="flex items-center justify-between gap-3 text-xs font-black uppercase text-slate-500">
                          Clave
                          <button
                            type="button"
                            onClick={() => toggleReveal(entry.id)}
                            className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                            title={isRevealed ? "Ocultar clave" : "Mostrar clave"}
                          >
                            {isRevealed ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                          </button>
                        </dt>
                        <dd className="mt-1 break-words font-mono text-lg font-black text-slate-900">
                          {isRevealed ? entry.password : maskPassword(entry.password)}
                        </dd>
                      </div>
                    </dl>

                    {(entry.notes || entry.sharedBy) ? (
                      <div className="mt-4 rounded-lg border border-lime-200 bg-lime-50 p-4 text-sm leading-6 text-lime-950">
                        {entry.notes ? <p>{entry.notes}</p> : null}
                        {entry.sharedBy ? <p className="mt-1 font-bold">Compartido por {entry.sharedBy}</p> : null}
                      </div>
                    ) : null}

                    <p className="mt-4 text-xs font-semibold text-slate-500">
                      Agregada {new Date(entry.createdAt).toLocaleString("es-CR")}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {connectEntry ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
          <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-800">
                  <Smartphone size={14} aria-hidden="true" />
                  Conectar al WiFi
                </p>
                <h2 className="mt-3 break-words text-2xl font-black text-slate-950">
                  {connectEntry.placeName || connectEntry.ssid}
                </h2>
                <p className="mt-1 break-words font-mono text-sm font-bold text-slate-600">{connectEntry.ssid}</p>
              </div>
              <button
                type="button"
                onClick={() => setConnectEntry(null)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                title="Cerrar"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={`QR para conectarse a ${connectEntry.ssid}`}
                  className="mx-auto aspect-square w-full max-w-64 rounded-md bg-white p-2"
                />
              ) : (
                <div className="grid aspect-square w-full max-w-64 place-items-center rounded-md bg-white p-6 text-center text-sm font-bold text-slate-500">
                  Generando QR...
                </div>
              )}
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-700">
              Escanee este QR con la camara del telefono. iPhone y Android normalmente muestran la opcion para unirse a
              la red; el telefono siempre pedira confirmar, porque una pagina web no puede conectarlo sola.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => copyText(`modal-password-${connectEntry.id}`, connectEntry.password)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <KeyRound size={16} aria-hidden="true" />
                {copiedId === `modal-password-${connectEntry.id}` ? "Copiado" : "Copiar clave"}
              </button>
              <button
                type="button"
                onClick={() => copyText(`modal-ssid-${connectEntry.id}`, connectEntry.ssid)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <Clipboard size={16} aria-hidden="true" />
                {copiedId === `modal-ssid-${connectEntry.id}` ? "Copiado" : "Copiar red"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
