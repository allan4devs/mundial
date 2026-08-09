"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CakeSlice,
  CheckCircle2,
  ChefHat,
  Clock3,
  Coffee,
  Cookie,
  Croissant,
  Facebook,
  Flame,
  Gift,
  HeartHandshake,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Quote,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Wheat,
  X,
} from "lucide-react";

const SHOP = {
  name: "Panadería Inocente Hidalgo",
  shortName: "Inocente Hidalgo",
  tagline: "Tradición sancarleña recién salida del horno",
  city: "Ciudad Quesada, San Carlos",
  address:
    "100 m norte de la Catedral de Ciudad Quesada, calle principal, frente al Mercado Municipal, Costa Rica",
  phone: "24601701",
  phoneDisplay: "2460-1701",
  faxDisplay: "2461-0151",
  email: "panihsa@ice.co.cr",
  facebook: "https://www.facebook.com/inocentehidalgoquesada",
  mapsQuery: "Panadería Inocente Hidalgo, Ciudad Quesada, Costa Rica",
};

const NAV = [
  { href: "#inicio", label: "Inicio" },
  { href: "#favoritos", label: "Favoritos" },
  { href: "#historia", label: "Historia" },
  { href: "#empresa", label: "Empresa" },
  { href: "#encargos", label: "Encargos" },
  { href: "#ubicacion", label: "Visítenos" },
];

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=2200&q=85";

const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=900&q=85",
    alt: "Vitrina de panes y repostería artesanal",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=85",
    alt: "Croissants dorados recién horneados",
    className: "",
  },
  {
    src: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=800&q=85",
    alt: "Pan artesanal sobre mesa de trabajo",
    className: "",
  },
  {
    src: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=800&q=85",
    alt: "Repostería dulce para compartir",
    className: "",
  },
  {
    src: "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fit=crop&w=800&q=85",
    alt: "Queque decorado para celebración",
    className: "",
  },
];

const FAVORITES = [
  {
    icon: Croissant,
    title: "Pan dulce de la casa",
    text: "Ese antojo de tarde que pide cafecito y conversación tranquila.",
    badge: "Clásico",
  },
  {
    icon: Wheat,
    title: "Pan salado y casero",
    text: "Bollos, baguettes y panes para mesa familiar, negocio o paseo.",
    badge: "Diario",
  },
  {
    icon: CakeSlice,
    title: "Queques por encargo",
    text: "Cumpleaños, reuniones y celebraciones con sabor de panadería de verdad.",
    badge: "A pedido",
  },
  {
    icon: Cookie,
    title: "Repostería y dulces",
    text: "Rebanadas, galletas, confites y detalles para llevar al momento.",
    badge: "Para compartir",
  },
];

const MENU_GROUPS = [
  {
    title: "Horno de madrugada",
    icon: Flame,
    items: ["Pan casero", "Pan dulce", "Bollería", "Baguettes", "Pan para café"],
  },
  {
    title: "Mesa dulce",
    icon: Gift,
    items: ["Queques", "Rebanadas", "Pasteles", "Galletas", "Repostería fina"],
  },
  {
    title: "Para acompañar",
    icon: Coffee,
    items: ["Café", "Chocolate puro", "Refrescos", "Dulces", "Levadura"],
  },
];

const SCHEDULE = [
  { day: "Lunes a sábado", hours: "5:00 a.m. - 7:00 p.m." },
  { day: "Domingos", hours: "5:30 a.m. - 12:00 m.d." },
  { day: "Feriados", hours: "Horario especial" },
];

const PROOF = [
  { value: "1933", label: "año de fundación por Don Inocente Hidalgo Quesada" },
  { value: "5 a.m.", label: "horno encendido desde temprano" },
  { value: "100 m", label: "norte de la Catedral" },
];

const PURPOSE = [
  {
    title: "Misión",
    text: "Ofrecer productos de primera calidad y satisfacer las necesidades de todos nuestros clientes.",
  },
  {
    title: "Visión",
    text: "Mantener nuestro posicionamiento en el mercado, generando satisfacción al cliente por medio de la innovación de productos.",
  },
];

const VALUES = ["Responsabilidad", "Compromiso social", "Honestidad"];

const TESTIMONIALS = [
  {
    name: "María F.",
    text: "Uno pasa por el mercado y el olor lo llama. Es pan de toda la vida, con atención bonita.",
  },
  {
    name: "Carlos S.",
    text: "El pan casero y las rebanadas son parada obligatoria. Calidad de antes, presentación de ahora.",
  },
  {
    name: "Daniela R.",
    text: "Encargué un queque para cumpleaños y quedó precioso. Lo resolvieron con mucho cariño.",
  },
];

const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(
  SHOP.mapsQuery,
)}&z=17&output=embed`;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cx("relative px-5 py-16 sm:px-8 lg:py-24", className)}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </section>
  );
}

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.18em]",
        light
          ? "border-white/20 bg-white/10 text-amber-100"
          : "border-emerald-900/10 bg-emerald-50 text-emerald-800",
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function PrimaryLink({
  href,
  children,
  dark = false,
}: {
  href: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <a
      href={href}
      className={cx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4",
        dark
          ? "bg-stone-950 text-white shadow-xl shadow-stone-950/20 focus:ring-stone-500/30"
          : "bg-emerald-800 text-white shadow-xl shadow-emerald-950/20 focus:ring-emerald-500/30",
      )}
    >
      {children}
    </a>
  );
}

export default function PanaderiaSite() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const mapsUrl = useMemo(
    () =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        SHOP.mapsQuery,
      )}`,
    [],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen bg-[#fbf7ef] text-stone-900 selection:bg-emerald-200 selection:text-emerald-950">
      <header
        className={cx(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-stone-950/10 bg-[#fbf7ef]/92 shadow-sm backdrop-blur-xl"
            : "bg-gradient-to-b from-stone-950/55 to-transparent",
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <a href="#inicio" className="group flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-800 text-white shadow-lg shadow-emerald-950/20 transition group-hover:-rotate-3">
              <Croissant className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span
                className={cx(
                  "block text-[11px] font-black uppercase tracking-[0.2em]",
                  scrolled ? "text-emerald-800" : "text-amber-100",
                )}
              >
                Panadería
              </span>
              <span
                className={cx(
                  "block text-base font-black",
                  scrolled ? "text-stone-950" : "text-white",
                )}
              >
                Inocente Hidalgo
              </span>
            </span>
          </a>

          <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/10 p-1 backdrop-blur-md lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cx(
                  "rounded-md px-3.5 py-2 text-sm font-bold transition",
                  scrolled
                    ? "text-stone-600 hover:bg-stone-950/5 hover:text-stone-950"
                    : "text-white/82 hover:bg-white/14 hover:text-white",
                )}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href={SHOP.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className={cx(
                "grid h-11 w-11 place-items-center rounded-lg border transition",
                scrolled
                  ? "border-stone-950/10 bg-white text-stone-700 hover:border-emerald-800/30 hover:text-emerald-800"
                  : "border-white/15 bg-white/10 text-white hover:bg-white/18",
              )}
            >
              <Facebook className="h-4.5 w-4.5" />
            </a>
            <PrimaryLink href={`tel:+506${SHOP.phone}`} dark={!scrolled}>
              <Phone className="h-4 w-4" />
              {SHOP.phoneDisplay}
            </PrimaryLink>
          </div>

          <button
            aria-label="Abrir menú"
            onClick={() => setMenuOpen((value) => !value)}
            className={cx(
              "grid h-11 w-11 place-items-center rounded-lg border transition md:hidden",
              scrolled
                ? "border-stone-950/10 bg-white text-stone-900"
                : "border-white/20 bg-white/10 text-white",
            )}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {menuOpen ? (
          <div className="border-t border-stone-950/10 bg-[#fbf7ef]/96 px-5 py-4 shadow-xl backdrop-blur-xl md:hidden">
            <div className="mx-auto grid max-w-7xl gap-2">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-bold text-stone-700 hover:bg-white"
                >
                  {item.label}
                </a>
              ))}
              <a
                href={`tel:+506${SHOP.phone}`}
                className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 py-3 font-black text-white"
              >
                <Phone className="h-4 w-4" />
                Llamar {SHOP.phoneDisplay}
              </a>
            </div>
          </div>
        ) : null}
      </header>

      <section id="inicio" className="relative min-h-[92vh] overflow-hidden px-5 pb-12 pt-28 sm:px-8 lg:min-h-[88vh]">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt="Pan artesanal recién horneado en mesa de panadería"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,12,7,0.92)_0%,rgba(18,12,7,0.76)_40%,rgba(18,12,7,0.25)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#fbf7ef] to-transparent" />
        </div>

        <div className="relative z-10 mx-auto grid min-h-[calc(92vh-7rem)] max-w-7xl items-end gap-10 lg:grid-cols-[minmax(0,1fr)_390px]">
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.1 }}
            className="max-w-4xl pb-28 sm:pb-16 lg:pb-10"
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <Eyebrow light>{SHOP.city}</Eyebrow>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.55 }}
              className="mt-6 max-w-4xl text-5xl font-black leading-[0.94] text-white sm:text-7xl lg:text-8xl"
            >
              {SHOP.shortName}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.55 }}
              className="mt-5 max-w-2xl text-lg leading-8 text-amber-50/88 sm:text-xl"
            >
              Desde 1933, pan caliente, repostería honesta y queques por encargo
              en el corazón de Ciudad Quesada. Un negocio familiar de tercera
              generación, con presencia digital de primera.
            </motion.p>
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <PrimaryLink href="#favoritos">
                Ver favoritos
                <ArrowRight className="h-4 w-4" />
              </PrimaryLink>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/12 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20"
              >
                <MapPin className="h-4 w-4" />
                Cómo llegar
              </a>
            </motion.div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mb-10 hidden rounded-lg border border-white/18 bg-white/12 p-5 text-white shadow-2xl shadow-stone-950/30 backdrop-blur-xl lg:block"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-amber-100">
                Hoy en vitrina
              </span>
              <ChefHat className="h-5 w-5 text-amber-200" />
            </div>
            <div className="mt-4 space-y-4">
              {["Tradición desde 1933", "Queques para celebrar", "Café para llevar"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-200" />
                    <span className="text-sm font-semibold text-white/88">{item}</span>
                  </div>
                ),
              )}
            </div>
            <div className="mt-5 rounded-lg bg-amber-100 p-4 text-stone-950">
              <p className="text-sm font-black">Tip sancarleño</p>
              <p className="mt-1 text-sm text-stone-700">
                Pase temprano si anda buscando pan calientito. Después del mercado,
                ese antojo no perdona.
              </p>
            </div>
          </motion.aside>
        </div>
      </section>

      <Section className="-mt-8 !py-0">
        <div className="grid overflow-hidden rounded-lg border border-stone-950/10 bg-white shadow-2xl shadow-stone-950/8 md:grid-cols-3">
          {PROOF.map((item) => (
            <div
              key={item.label}
              className="border-b border-stone-950/10 p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <div className="text-4xl font-black text-emerald-800">{item.value}</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-stone-600">{item.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="favoritos">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1fr] lg:items-end">
          <div>
            <Eyebrow>Favoritos de la casa</Eyebrow>
            <h2 className="mt-5 text-4xl font-black leading-tight text-stone-950 sm:text-5xl">
              Lo que la gente viene buscando cuando el antojo llama.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-stone-600 lg:ml-auto">
            Una página ganadora no solo se ve bonita: vende el olor, ordena la
            oferta y hace fácil llamar, llegar o encargar. Aquí cada bloque empuja
            a una acción clara.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FAVORITES.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="group rounded-lg border border-stone-950/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-800/25 hover:shadow-xl hover:shadow-stone-950/8"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#7a1f1f] text-white">
                  <item.icon className="h-6 w-6" />
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">
                  {item.badge}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-black text-stone-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-stone-600">{item.text}</p>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section className="bg-[#153f35] text-white">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-center">
          <div>
            <Eyebrow light>Menú claro, ventas rápidas</Eyebrow>
            <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
              Todo lo que el cliente necesita decidir, sin rodeos.
            </h2>
            <p className="mt-5 text-lg leading-8 text-emerald-50/78">
              La oferta queda agrupada como piensa el comprador: pan para hoy,
              dulce para compartir y productos para acompañar.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {MENU_GROUPS.map((group) => (
              <div key={group.title} className="rounded-lg border border-white/12 bg-white/8 p-5">
                <group.icon className="h-7 w-7 text-amber-200" />
                <h3 className="mt-4 text-lg font-black">{group.title}</h3>
                <ul className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-emerald-50/82">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-200" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="historia">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-lg border border-stone-950/10 bg-white p-2 shadow-2xl shadow-stone-950/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1556910633-5099dc3971e8?auto=format&fit=crop&w=1200&q=85"
                alt="Panadero preparando masa artesanal"
                className="aspect-[4/5] w-full rounded-md object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-5 right-5 rounded-lg border border-stone-950/10 bg-white p-4 shadow-xl sm:left-auto sm:w-72">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-amber-100 text-amber-900">
                  <HeartHandshake className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-black text-stone-950">Trato familiar</p>
                  <p className="text-sm text-stone-600">De los negocios que saludan bonito.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Eyebrow>Historia con presente</Eyebrow>
            <h2 className="mt-5 text-4xl font-black leading-tight text-stone-950 sm:text-5xl">
              Desde 1933, una empresa familiar que sigue creciendo.
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-8 text-stone-600">
              <p>
                Panadería Inocente Hidalgo fue fundada en el año 1933 por el señor
                Inocente Hidalgo Quesada. Desde entonces ha permanecido en el
                mercado gracias al esfuerzo familiar y al cariño de sus clientes.
              </p>
              <p>
                Actualmente está a cargo de la tercera generación de Don Inocente,
                con la expectativa de seguir creciendo de generación en generación,
                como esos negocios que San Carlos reconoce por nombre y por sabor.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { icon: ShieldCheck, title: "Confianza", text: "Información directa, sin inventar precios ni disponibilidad." },
                { icon: ShoppingBag, title: "Acción", text: "Botones visibles para llamar, llegar o escribir." },
                { icon: Store, title: "Presencia local", text: "Ubicación y tradición como señales fuertes." },
                { icon: Star, title: "Deseo", text: "Fotos grandes, menú simple y copy con sabor." },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-stone-950/10 bg-white p-4">
                  <item.icon className="h-5 w-5 text-emerald-800" />
                  <p className="mt-3 font-black text-stone-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      <Section id="empresa" className="bg-[#efe7da]">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1fr] lg:items-stretch">
          <div className="rounded-lg bg-stone-950 p-6 text-white shadow-2xl shadow-stone-950/15 sm:p-8 lg:p-10">
            <Eyebrow light>Nuestra empresa</Eyebrow>
            <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
              Calidad, innovación y valores claros.
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-200">
              El sitio nuevo convierte la misión, visión y valores en señales de
              confianza visibles. Se siente institucional, pero con calidez local.
            </p>
            <div className="mt-8 grid gap-3">
              {VALUES.map((value) => (
                <div key={value} className="flex items-center gap-3 rounded-lg bg-white/8 p-4">
                  <CheckCircle2 className="h-5 w-5 text-amber-200" />
                  <span className="font-black">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {PURPOSE.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-stone-950/10 bg-white p-6 shadow-sm sm:p-8"
              >
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-emerald-50 text-emerald-800">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-2xl font-black text-stone-950">{item.title}</h3>
                <p className="mt-4 text-base leading-8 text-stone-600">{item.text}</p>
              </article>
            ))}
            <article className="rounded-lg border border-stone-950/10 bg-white p-6 shadow-sm md:col-span-2 sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-800">
                Diferencial de marca
              </p>
              <p className="mt-3 text-xl font-black leading-8 text-stone-950">
                Una panadería con casi un siglo de historia necesita una web que
                transmita trayectoria, confianza y antojo desde el primer vistazo.
              </p>
            </article>
          </div>
        </div>
      </Section>

      <Section id="encargos" className="bg-[#efe7da]">
        <div className="grid overflow-hidden rounded-lg border border-stone-950/10 bg-white shadow-2xl shadow-stone-950/8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="p-6 sm:p-10 lg:p-12">
            <Eyebrow>Encargos y eventos</Eyebrow>
            <h2 className="mt-5 text-4xl font-black leading-tight text-stone-950 sm:text-5xl">
              Queques, repostería y pedidos especiales con confirmación directa.
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-600">
              Para pedidos, lo correcto es hablar con la panadería y confirmar
              tamaño, fecha, diseño y disponibilidad. Nada de precios inventados,
              aquí se vende con seriedad.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryLink href={`tel:+506${SHOP.phone}`}>
                <Phone className="h-4 w-4" />
                Llamar
              </PrimaryLink>
              <a
                href={`mailto:${SHOP.email}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-950/10 bg-white px-5 py-3 text-sm font-black text-stone-800 transition hover:-translate-y-0.5 hover:border-emerald-800/25"
              >
                <Mail className="h-4 w-4" />
                Escribir correo
              </a>
            </div>
          </div>
          <div className="grid bg-[#7a1f1f] p-6 text-white sm:p-10 lg:p-12">
            <div className="self-center">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-100">
                Flujo ideal de pedido
              </p>
              <div className="mt-6 space-y-4">
                {[
                  "Cliente llama o escribe con fecha y cantidad.",
                  "Panadería confirma disponibilidad y detalles.",
                  "Se coordina retiro en tienda o indicaciones finales.",
                ].map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-lg bg-white/10 p-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-sm font-black text-stone-950">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold leading-6 text-white/88">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="galeria">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow>Galería</Eyebrow>
            <h2 className="mt-5 text-4xl font-black leading-tight text-stone-950 sm:text-5xl">
              Una vitrina digital que sí abre el apetito.
            </h2>
          </div>
          <p className="max-w-md text-lg leading-8 text-stone-600">
            Fotos grandes, proporciones estables y suficiente variedad para que el
            sitio se sienta vivo sin saturar.
          </p>
        </div>

        <div className="mt-10 grid auto-rows-[190px] gap-3 md:grid-cols-4 md:auto-rows-[220px]">
          {GALLERY.map((image, index) => (
            <motion.figure
              key={image.src}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
              className={cx("group overflow-hidden rounded-lg bg-stone-200", image.className)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.alt}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </motion.figure>
          ))}
        </div>
      </Section>

      <Section className="bg-stone-950 text-white">
        <div className="grid gap-8 lg:grid-cols-[0.6fr_1fr] lg:items-center">
          <div>
            <Eyebrow light>Clientes</Eyebrow>
            <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
              La prueba social también huele a pan recién hecho.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <article key={item.name} className="rounded-lg border border-white/10 bg-white/8 p-5">
                <Quote className="h-6 w-6 text-amber-200" />
                <p className="mt-4 text-sm leading-7 text-white/78">{item.text}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="font-black">{item.name}</span>
                  <span className="flex text-amber-300">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section id="ubicacion">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1fr]">
          <div>
            <Eyebrow>Visítenos</Eyebrow>
            <h2 className="mt-5 text-4xl font-black leading-tight text-stone-950 sm:text-5xl">
              Frente al Mercado Municipal, donde Ciudad Quesada se mueve.
            </h2>
            <div className="mt-8 grid gap-4">
              {[
                { icon: MapPin, label: "Dirección", value: SHOP.address, href: mapsUrl },
                { icon: Phone, label: "Teléfono", value: SHOP.phoneDisplay, href: `tel:+506${SHOP.phone}` },
                { icon: Phone, label: "Fax", value: SHOP.faxDisplay, href: `tel:+506${SHOP.faxDisplay.replace("-", "")}` },
                { icon: Mail, label: "Correo", value: SHOP.email, href: `mailto:${SHOP.email}` },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  className="flex gap-4 rounded-lg border border-stone-950/10 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-800/25 hover:shadow-lg hover:shadow-stone-950/6"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-800">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-black text-stone-950">{item.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-stone-600">{item.value}</span>
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-stone-950/10 bg-white p-5">
              <div className="flex items-center gap-3">
                <Clock3 className="h-5 w-5 text-emerald-800" />
                <p className="font-black text-stone-950">Horario</p>
              </div>
              <div className="mt-4 grid gap-2">
                {SCHEDULE.map((item) => (
                  <div key={item.day} className="flex justify-between gap-4 text-sm">
                    <span className="font-semibold text-stone-600">{item.day}</span>
                    <span className="font-black text-stone-950">{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="min-h-[440px] overflow-hidden rounded-lg border border-stone-950/10 bg-white p-2 shadow-2xl shadow-stone-950/8">
            <iframe
              title="Ubicación Panadería Inocente Hidalgo"
              src={mapEmbed}
              className="h-full min-h-[420px] w-full rounded-md"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </Section>

      <section className="relative overflow-hidden px-5 py-20 text-white sm:px-8">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=2200&q=85"
            alt="Panadería con panes artesanales en vitrina"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(19,13,9,0.92),rgba(19,13,9,0.62))]" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <Eyebrow light>Pan calientito, mae</Eyebrow>
            <h2 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">
              Pase hoy por el pan, el queque o el cafecito.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-amber-50/84">
              En San Carlos hay lluvia, mandados y antojos. Para los antojos,
              Inocente Hidalgo queda a la mano.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryLink href={`tel:+506${SHOP.phone}`}>
              <Phone className="h-4 w-4" />
              {SHOP.phoneDisplay}
            </PrimaryLink>
            <a
              href={SHOP.facebook}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/12 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
            >
              <MessageCircle className="h-4 w-4" />
              Facebook
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-950/10 bg-[#fbf7ef] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-800 text-white">
                <Croissant className="h-5 w-5" />
              </span>
              <div>
                <p className="font-black text-stone-950">{SHOP.name}</p>
                <p className="text-sm font-semibold text-stone-600">{SHOP.tagline}</p>
              </div>
            </div>
            <p className="mt-5 max-w-lg text-sm leading-6 text-stone-500">
              Propuesta visual para destacar una panadería tradicional de Ciudad
              Quesada con diseño moderno, fotografía fuerte y rutas claras de contacto.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-bold text-stone-600 hover:bg-white hover:text-emerald-800"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl flex-col justify-between gap-3 border-t border-stone-950/10 pt-5 text-xs font-semibold text-stone-500 sm:flex-row">
          <span>© {new Date().getFullYear()} {SHOP.name}. Todos los derechos reservados.</span>
          <span>Propuesta de sitio web · San Carlos, Costa Rica</span>
        </div>
      </footer>
    </main>
  );
}
