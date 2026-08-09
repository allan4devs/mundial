import type { Metadata } from "next";
import {
  Camera,
  Clock,
  Fish,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Utensils,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cevicheria Beta Azul | Caldosa tica, ceviche fresco y sabor costeno",
  description:
    "Propuesta web para Cevicheria Beta Azul: ceviche tico tipo caldosa, mariscos frescos, combos para llevar y galeria visual para vender por WhatsApp.",
};

const cevichePhotos = [
  {
    src: "https://images.unsplash.com/photo-1748659118761-44a30b82478c?auto=format&fit=crop&w=1200&q=80",
    alt: "Ceviche de camaron con limon y tostadas",
    label: "Camaron con limon",
  },
  {
    src: "https://images.unsplash.com/photo-1562707774-553917f561df?auto=format&fit=crop&w=1200&q=80",
    alt: "Ceviche de pescado con cebolla morada",
    label: "Pescado en leche de tigre",
  },
  {
    src: "https://images.unsplash.com/photo-1608176439783-556c7f59f263?auto=format&fit=crop&w=1200&q=80",
    alt: "Coctel de camaron con salsa roja",
    label: "Coctel rojo",
  },
  {
    src: "https://images.unsplash.com/photo-1748659118802-a23f097d5398?auto=format&fit=crop&w=1200&q=80",
    alt: "Ceviche de camaron con pan tostado",
    label: "Especial de la casa",
  },
  {
    src: "https://images.unsplash.com/photo-1761314036709-f6f68a3d7cf1?auto=format&fit=crop&w=1200&q=80",
    alt: "Ceviche servido con maiz y calamar",
    label: "Mixto tropical",
  },
  {
    src: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?auto=format&fit=crop&w=1200&q=80",
    alt: "Ceviche con camote, cebolla y hierbas",
    label: "Ceviche colorido",
  },
  {
    src: "https://images.unsplash.com/photo-1595531507616-1f5347ee003b?auto=format&fit=crop&w=1200&q=80",
    alt: "Ceviche con aguacate, cebolla y culantro",
    label: "Aguacate fresco",
  },
  {
    src: "https://images.unsplash.com/photo-1749522714946-c39b846c2dac?auto=format&fit=crop&w=1200&q=80",
    alt: "Mariscos frescos sobre hielo con limon",
    label: "Frescura del dia",
  },
  {
    src: "https://images.unsplash.com/photo-1553826230-8c808a97ff42?auto=format&fit=crop&w=1200&q=80",
    alt: "Camarones con hojas verdes",
    label: "Camaron firme",
  },
  {
    src: "https://images.unsplash.com/photo-1766556403793-04cd52cbf678?auto=format&fit=crop&w=1200&q=80",
    alt: "Pescado frito con limon y culantro",
    label: "Para acompanar",
  },
  {
    src: "https://images.unsplash.com/photo-1682970078946-22576389f45d?auto=format&fit=crop&w=1200&q=80",
    alt: "Pescado entero con vegetales y limon",
    label: "Pescado entero",
  },
  {
    src: "https://images.unsplash.com/photo-1772329354988-cf4ee5e0d99f?auto=format&fit=crop&w=1200&q=80",
    alt: "Boles de pescado fresco picado",
    label: "Preparacion fresca",
  },
];

const menuHighlights = [
  {
    icon: Fish,
    title: "Caldosa Beta",
    text: "Ceviche tico servido bien jugoso, con crunch de bolsita, limon mandarina y salsita de la casa.",
  },
  {
    icon: Utensils,
    title: "Mixto Azul",
    text: "Pescado, camaron y pulpo cuando hay fresco. Fresquito, picosito y listo para llevar.",
  },
  {
    icon: ShoppingBag,
    title: "Combo Playita",
    text: "Ceviche, caldosa, bebida fria y extra de chips. Perfecto para almuerzo rapido o tarde de antojo.",
  },
];

const sellingPoints = [
  "Ceviche preparado al momento",
  "Entrega express segun zona",
  "Pedidos por WhatsApp",
  "Fotos del producto real listas para redes",
];

export default function CevicheriaBetaAzulProposalPage() {
  return (
    <main className="min-h-screen bg-[#f8fbff] text-slate-950">
      <section className="relative isolate min-h-[92vh] overflow-hidden bg-slate-950 text-white">
        <img
          src={cevichePhotos[0].src}
          alt={cevichePhotos[0].alt}
          className="absolute inset-0 h-full w-full object-cover opacity-68"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,24,38,0.92),rgba(3,24,38,0.62)_45%,rgba(3,24,38,0.18))]" />

        <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="#inicio" className="flex items-center gap-3 font-black">
            <span className="grid size-11 place-items-center rounded-[8px] bg-cyan-400 text-slate-950">
              BZ
            </span>
            <span className="leading-tight">
              Cevicheria
              <span className="block text-cyan-200">Beta Azul</span>
            </span>
          </a>
          <a
            href="#pedido"
            className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-lime-300 px-4 text-sm font-black text-slate-950 transition hover:bg-white"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Pedir ahora
          </a>
        </nav>

        <div
          id="inicio"
          className="relative z-10 mx-auto grid min-h-[calc(92vh-84px)] w-full max-w-7xl items-end gap-10 px-5 pb-10 pt-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px]"
        >
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-[8px] border border-white/25 bg-white/10 px-3 py-2 text-sm font-extrabold text-cyan-100 backdrop-blur">
              <Sparkles size={16} aria-hidden="true" />
              Ceviche tico tipo caldosa, bien cargadito
            </p>
            <h1 className="font-display text-5xl font-black leading-[0.95] sm:text-7xl lg:text-8xl">
              Fresco, acidito y con crunch.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-100 sm:text-xl">
              Una pagina lista para vender Beta Azul: fotos grandes, menu claro,
              CTA directo a WhatsApp y ese antojo de caldosa que pega duro
              cuando el calor se pone serio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#galeria"
                className="inline-flex min-h-12 items-center gap-2 rounded-[8px] bg-cyan-300 px-5 font-black text-slate-950 transition hover:bg-white"
              >
                <Camera size={19} aria-hidden="true" />
                Ver fotos
              </a>
              <a
                href="#menu"
                className="inline-flex min-h-12 items-center gap-2 rounded-[8px] border border-white/30 bg-white/10 px-5 font-black text-white backdrop-blur transition hover:bg-white hover:text-slate-950"
              >
                <Utensils size={19} aria-hidden="true" />
                Ver menu
              </a>
            </div>
          </div>

          <aside className="grid gap-3 rounded-[8px] border border-white/20 bg-white/12 p-4 backdrop-blur-md">
            <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-4">
              <img
                src={cevichePhotos[2].src}
                alt={cevichePhotos[2].alt}
                className="h-24 w-full rounded-[8px] object-cover"
              />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-200">
                  Pedido rapido
                </p>
                <h2 className="mt-1 text-2xl font-black">Caldosa + bebida fria</h2>
                <p className="mt-1 text-sm font-semibold text-slate-100">
                  Ideal para pickup, express y promos de historia.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm font-black">
              <span className="rounded-[8px] bg-white/12 px-3 py-3">Limon al toque</span>
              <span className="rounded-[8px] bg-white/12 px-3 py-3">Picante opcional</span>
            </div>
          </aside>
        </div>
      </section>

      <section id="menu" className="bg-white py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-700">
                Menu vendedor
              </p>
              <h2 className="mt-3 font-display text-4xl font-black leading-none text-slate-950 sm:text-6xl">
                Lo que la gente pide cuando ya vio la foto.
              </h2>
            </div>
            <p className="max-w-2xl text-lg font-semibold leading-8 text-slate-600">
              La pagina esta pensada para convertir antojo en pedido: nombres
              cortos, descripciones sabrosas y espacio para conectar precios
              reales despues.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {menuHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-[8px] border border-slate-200 bg-[#f8fbff] p-6 shadow-sm"
                >
                  <div className="grid size-12 place-items-center rounded-[8px] bg-cyan-100 text-cyan-800">
                    <Icon size={24} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-slate-950">{item.title}</h3>
                  <p className="mt-3 font-semibold leading-7 text-slate-600">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#09202f] py-16 text-white sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="grid grid-cols-2 gap-3">
            {cevichePhotos.slice(1, 5).map((photo, index) => (
              <img
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                className={`h-52 w-full rounded-[8px] object-cover sm:h-72 ${
                  index === 0 || index === 3 ? "translate-y-6" : ""
                }`}
              />
            ))}
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-200">
              Estilo caldosa
            </p>
            <h2 className="mt-3 font-display text-4xl font-black leading-none sm:text-6xl">
              Una bolsita, ceviche encima y listo el vacilon.
            </h2>
            <p className="mt-6 text-lg font-semibold leading-8 text-cyan-50">
              La comunicacion visual va directo al antojo: juguito de limon,
              cebolla morada, culantro, salsita, marisco firme y ese crunch que
              hace que uno diga: &ldquo;deme otra, por aquello&rdquo;.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {sellingPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-[8px] border border-white/14 bg-white/8 px-4 py-4 font-black"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="galeria" className="bg-[#f8fbff] py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-700">
                Galeria para vender
              </p>
              <h2 className="mt-3 font-display text-4xl font-black leading-none text-slate-950 sm:text-6xl">
                Muchas fotos, poco bla bla.
              </h2>
            </div>
            <p className="max-w-md font-semibold leading-7 text-slate-600">
              Grid listo para cambiar por fotos reales de Beta Azul cuando las
              tengan. Por ahora queda con vibra marina, fresca y bien apetecible.
            </p>
          </div>

          <div className="mt-10 grid auto-rows-[220px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cevichePhotos.map((photo, index) => (
              <figure
                key={photo.src}
                className={`group relative overflow-hidden rounded-[8px] bg-slate-200 ${
                  index === 0 || index === 5 ? "lg:col-span-2 lg:row-span-2" : ""
                }`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/86 to-transparent p-4">
                  <span className="inline-flex rounded-[8px] bg-white px-3 py-2 text-sm font-black text-slate-950">
                    {photo.label}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="pedido" className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_0.75fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-700">
              Cierre directo
            </p>
            <h2 className="mt-3 font-display text-4xl font-black leading-none text-slate-950 sm:text-6xl">
              Del antojo al WhatsApp en un toque.
            </h2>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
              Esta seccion se puede conectar a un numero real, menu con precios,
              horarios y ubicacion. Asi Beta Azul puede vender sin que el cliente
              tenga que buscar mucho.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://wa.me/50600000000?text=Hola%20Beta%20Azul,%20quiero%20pedir%20una%20caldosa"
                className="inline-flex min-h-12 items-center gap-2 rounded-[8px] bg-cyan-600 px-5 font-black text-white transition hover:bg-cyan-700"
              >
                <MessageCircle size={19} aria-hidden="true" />
                WhatsApp demo
              </a>
              <a
                href="#galeria"
                className="inline-flex min-h-12 items-center gap-2 rounded-[8px] border border-slate-300 bg-white px-5 font-black text-slate-950 transition hover:border-cyan-500 hover:bg-cyan-50"
              >
                <Camera size={19} aria-hidden="true" />
                Revisar fotos
              </a>
            </div>
          </div>

          <div className="rounded-[8px] border border-slate-200 bg-[#f8fbff] p-6 shadow-sm">
            <div className="grid gap-4">
              <div className="flex items-start gap-4 rounded-[8px] bg-white p-4">
                <Clock className="mt-1 text-cyan-700" size={22} aria-hidden="true" />
                <div>
                  <h3 className="font-black text-slate-950">Horario editable</h3>
                  <p className="mt-1 font-semibold text-slate-600">
                    Espacio para almuerzo, tarde y pedidos especiales.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-[8px] bg-white p-4">
                <MapPin className="mt-1 text-cyan-700" size={22} aria-hidden="true" />
                <div>
                  <h3 className="font-black text-slate-950">Ubicacion y express</h3>
                  <p className="mt-1 font-semibold text-slate-600">
                    Se puede conectar a Google Maps y zonas de entrega.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-[8px] bg-white p-4">
                <ShoppingBag className="mt-1 text-cyan-700" size={22} aria-hidden="true" />
                <div>
                  <h3 className="font-black text-slate-950">Menu con precios reales</h3>
                  <p className="mt-1 font-semibold text-slate-600">
                    Cuando el negocio confirme montos, se agregan sin inventar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
