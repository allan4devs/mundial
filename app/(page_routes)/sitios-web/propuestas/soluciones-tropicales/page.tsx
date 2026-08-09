import type { Metadata, Viewport } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  Clock3,
  Cog,
  Droplets,
  Facebook,
  Fuel,
  Gauge,
  Instagram,
  Leaf,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Tractor,
  TreePine,
  Wrench,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Soluciones Tropicales | Equipos agrícolas en Ciudad Quesada",
  description:
    "Equipos agrícolas, repuestos, accesorios y servicio técnico en Ciudad Quesada. Soluciones Tropicales, su aliado en el campo.",
};

export const viewport: Viewport = { themeColor: "#063b73" };

const BUSINESS = {
  phoneDisplay: "2461-3141",
  phone: "+50624613141",
  whatsappDisplay: "8772-3141",
  whatsapp: "50687723141",
  address: "100 m este y 50 m norte de McDonald's, Ciudad Quesada, San Carlos",
  facebook: "https://www.facebook.com/SolucionesTropicales/",
  instagram: "https://www.instagram.com/soluciones_tropicales_21/",
  maps:
    "https://www.google.com/maps/search/?api=1&query=Soluciones+Tropicales+Ciudad+Quesada+San+Carlos+Costa+Rica",
};

const PRODUCT_IMAGES = {
  bison:
    "https://www.bisongenerator.com/static/upload/image/20241126/9hp-land-cultivator-agriculture-machine-2.jpg",
  fumigadora:
    "https://garantiaverde.com.mx/cdn/shop/files/D_NQ_NP_2X_781602-MLU71708345878_092023-F_1024x1024.webp?v=1734409438",
  motosierra:
    "https://images.thdstatic.com/productImages/47dc4517-0d54-4bfd-98a6-18b7d1690d68/svn/echo-gas-chainsaws-cs-7310p-24-64_600.jpg",
  service:
    "https://greenmountmowers.co.nz/cdn/shop/files/SER_OM_Lavoro_035.jpg?v=1741308366&width=1500",
};

const NAV = [
  ["#equipos", "Equipos"],
  ["#servicios", "Servicios"],
  ["#respaldo", "Respaldo"],
  ["#ubicacion", "Visítenos"],
] as const;

const PRODUCTS = [
  {
    eyebrow: "Preparación de terreno",
    title: "Motoazada Bison BS1350FD",
    description:
      "Potencia diésel para trabajar terrenos exigentes con rendimiento, estabilidad y confianza.",
    specs: ["Motor diésel", "9 HP", "Trabajo exigente"],
    image: PRODUCT_IMAGES.bison,
    alt: "Motoazada Bison de 9 caballos para preparación de terreno",
    icon: Tractor,
    tone: "blue",
  },
  {
    eyebrow: "Fumigación profesional",
    title: "Fumigadora ECHO DM-6120",
    description:
      "Equipo motorizado de espalda para una aplicación eficiente y una jornada de trabajo más productiva.",
    specs: ["58,2 cc", "Carburador de diafragma", "Combustible 1,850 L"],
    image: PRODUCT_IMAGES.fumigadora,
    alt: "Fumigadora motorizada ECHO DM-6120",
    icon: Droplets,
    tone: "red",
  },
  {
    eyebrow: "Corte de alto rendimiento",
    title: "Motosierra ECHO CS-7310P",
    description:
      "Una motosierra profesional de dos tiempos para los desafíos de corte más exigentes.",
    specs: ["73,5 cc", "Encendido digital", "Capacidad 0,8 L"],
    image: PRODUCT_IMAGES.motosierra,
    alt: "Motosierra profesional ECHO CS-7310P",
    icon: TreePine,
    tone: "red",
  },
] as const;

const SERVICES = [
  {
    icon: ShoppingBag,
    number: "01",
    title: "Venta de equipos",
    text: "Maquinaria y herramientas seleccionadas para agricultura, jardinería, finca y trabajo profesional.",
  },
  {
    icon: Wrench,
    number: "02",
    title: "Servicio técnico",
    text: "Diagnóstico, mantenimiento y reparación para cuidar el rendimiento y extender la vida útil de su equipo.",
  },
  {
    icon: Cog,
    number: "03",
    title: "Repuestos y accesorios",
    text: "Consumibles, piezas y complementos para mantener cada herramienta lista para la próxima jornada.",
  },
  {
    icon: BadgeCheck,
    number: "04",
    title: "Asesoría cercana",
    text: "Le ayudamos a elegir la solución adecuada según el terreno, la frecuencia de uso y el trabajo por realizar.",
  },
] as const;

function waLink(message: string) {
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`;
}

export default function SolucionesTropicalesPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f7f8] pb-16 text-[#102439] selection:bg-[#e52629] selection:text-white sm:pb-0">
      <div className="bg-[#052c55] px-5 py-2.5 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center text-[11px] font-bold uppercase tracking-[0.16em] sm:justify-between">
          <span className="inline-flex items-center gap-2 text-white/72">
            <MapPin className="h-3.5 w-3.5 text-[#55ae45]" />
            Ciudad Quesada · San Carlos
          </span>
          <span className="hidden text-white/55 md:block">
            Ventas · Servicio técnico · Equipo profesional · Accesorios
          </span>
          <a href={`tel:${BUSINESS.phone}`} className="inline-flex items-center gap-2 transition hover:text-[#72c563]">
            <Phone className="h-3.5 w-3.5" />
            {BUSINESS.phoneDisplay}
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-[#0c3358]/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3.5 sm:px-8">
          <a href="#inicio" className="flex shrink-0 items-center gap-3" aria-label="Ir al inicio">
            <span className="relative grid h-11 w-[70px] place-items-center overflow-hidden bg-[#0874cf] text-2xl font-black italic tracking-[-0.16em] text-white [clip-path:polygon(0_0,100%_0,86%_100%,0_100%)]">
              <span className="-ml-1">ST</span>
              <span className="absolute bottom-0 left-0 h-1 w-full bg-[#e52629]" />
            </span>
            <span className="leading-none">
              <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-[#e52629]">Soluciones</span>
              <span className="mt-1 block text-lg font-black uppercase tracking-[-0.04em] text-[#063b73]">Tropicales</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-xs font-black uppercase tracking-[0.14em] text-[#23435f]/72 lg:flex">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} className="transition hover:text-[#0874cf]">{label}</a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <a
              href={BUSINESS.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook de Soluciones Tropicales"
              className="grid h-11 w-11 place-items-center border border-[#0c3358]/12 text-[#063b73] transition hover:border-[#0874cf] hover:text-[#0874cf]"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={waLink("Hola Soluciones Tropicales, quiero información sobre sus equipos.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 bg-[#e52629] px-5 text-sm font-black uppercase text-white transition hover:bg-[#bd171a]"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>

          <details className="relative sm:hidden">
            <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center border border-[#0c3358]/14 text-[#063b73] [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </summary>
            <div className="absolute right-0 top-14 w-64 border border-[#0c3358]/10 bg-white p-3 shadow-2xl">
              {NAV.map(([href, label]) => (
                <a key={href} href={href} className="flex items-center justify-between border-b border-[#0c3358]/8 px-3 py-3 text-sm font-black uppercase last:border-0">
                  {label}<ChevronRight className="h-4 w-4 text-[#0874cf]" />
                </a>
              ))}
              <a
                href={waLink("Hola Soluciones Tropicales, quiero información sobre sus equipos.")}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex min-h-12 items-center justify-center gap-2 bg-[#e52629] px-4 text-sm font-black uppercase text-white"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </details>
        </div>
      </header>

      <section id="inicio" className="relative isolate overflow-hidden bg-[#063b73] px-5 text-white sm:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-35 [background-image:linear-gradient(120deg,transparent_0%,transparent_68%,rgba(255,255,255,.12)_68%,rgba(255,255,255,.12)_69%,transparent_69%),radial-gradient(circle_at_12%_20%,#0c8ae5_0,transparent_34%),radial-gradient(circle_at_86%_90%,#55ae45_0,transparent_28%)]" />
        <div className="pointer-events-none absolute -left-28 bottom-[-13rem] -z-10 h-[32rem] w-[32rem] rounded-full border-[80px] border-white/[0.035]" />

        <div className="mx-auto grid min-h-[690px] max-w-7xl items-center gap-12 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 border border-white/18 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/80 backdrop-blur">
              <Leaf className="h-4 w-4 text-[#72c563]" /> Su aliado en el campo
            </div>
            <h1 className="mt-7 text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-7xl xl:text-[6.4rem]">
              Fuerza para<span className="block text-[#75c766]">hacer crecer</span>su trabajo.
            </h1>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-8 text-white/70 sm:text-lg">
              Equipos agrícolas, repuestos, accesorios y servicio técnico para quienes trabajan la tierra y necesitan rendimiento real todos los días.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#equipos" className="inline-flex min-h-13 items-center gap-2 bg-white px-6 py-3.5 text-sm font-black uppercase text-[#063b73] transition hover:bg-[#75c766] hover:text-[#052c55]">
                Ver equipos <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={waLink("Hola Soluciones Tropicales, necesito asesoría para elegir un equipo.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-13 items-center gap-2 border border-white/25 bg-white/8 px-6 py-3.5 text-sm font-black uppercase text-white backdrop-blur transition hover:bg-white/15"
              >
                Solicitar asesoría <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative lg:min-h-[560px]">
            <div className="absolute -right-24 top-0 hidden h-full w-[82%] bg-white/[0.06] [clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)] lg:block" />
            <div className="relative ml-auto max-w-[690px] bg-[#f8fafb] p-5 shadow-[0_34px_80px_rgba(0,0,0,.32)] sm:p-8 lg:absolute lg:inset-y-0 lg:right-0 lg:flex lg:w-[92%] lg:items-center [clip-path:polygon(8%_0,100%_0,100%_92%,91%_100%,0_100%,0_9%)]">
              <div className="relative w-full">
                <div className="absolute left-0 top-0 z-10 bg-[#e52629] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white">Equipo destacado</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PRODUCT_IMAGES.bison} alt="Motoazada Bison diésel de nueve caballos" className="aspect-[5/4] w-full object-contain mix-blend-multiply" />
                <div className="grid gap-3 border-t border-[#0c3358]/10 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#e52629]">Preparación de terreno</p>
                    <h2 className="mt-1 text-2xl font-black uppercase tracking-[-0.035em] text-[#063b73] sm:text-3xl">Bison BS1350FD</h2>
                  </div>
                  <div className="flex items-center gap-3 text-[#063b73]">
                    <span className="grid h-12 w-12 place-items-center bg-[#e9f2f8]"><Fuel className="h-5 w-5" /></span>
                    <span>
                      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#526b80]">Motor diésel</span>
                      <span className="block text-xl font-black">9 HP</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 sm:px-8">
        <div className="mx-auto -mt-1 grid max-w-7xl bg-[#052c55] text-white shadow-2xl sm:grid-cols-3">
          {[
            [Phone, BUSINESS.phoneDisplay, "Teléfono"],
            [MessageCircle, BUSINESS.whatsappDisplay, "WhatsApp"],
            [Wrench, "Equipo listo", "Servicio técnico"],
          ].map(([Icon, value, label], index) => (
            <div key={label as string} className="flex items-center gap-4 border-b border-white/10 px-6 py-5 last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <span className="grid h-11 w-11 shrink-0 place-items-center bg-[#0874cf] text-white"><Icon className="h-5 w-5" /></span>
              <span>
                <span className="block text-lg font-black uppercase">{value as string}</span>
                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/48">{label as string}</span>
              </span>
              {index < 2 && <ArrowUpRight className="ml-auto h-4 w-4 text-white/30" />}
            </div>
          ))}
        </div>
      </section>

      <section id="equipos" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e52629]">Equipos destacados</p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-[0.96] tracking-[-0.05em] text-[#063b73] sm:text-6xl">
                Potencia correcta.<span className="block text-[#0874cf]">Trabajo bien hecho.</span>
              </h2>
            </div>
            <p className="max-w-lg text-base font-semibold leading-8 text-[#526b80]">
              Una selección para preparar terreno, proteger cultivos y enfrentar labores de corte con equipos confiables.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {PRODUCTS.map((product) => (
              <article key={product.title} className="group flex flex-col overflow-hidden border border-[#0c3358]/10 bg-white shadow-[0_18px_50px_rgba(6,59,115,.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(6,59,115,.14)]">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f4f6f7] p-6">
                  <span className={`absolute left-0 top-0 z-10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white ${product.tone === "red" ? "bg-[#e52629]" : "bg-[#0874cf]"}`}>
                    {product.eyebrow}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt={product.alt} className="h-full w-full object-contain mix-blend-multiply transition duration-500 group-hover:scale-[1.04]" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-2xl font-black uppercase leading-tight tracking-[-0.035em] text-[#063b73]">{product.title}</h3>
                    <product.icon className="h-6 w-6 shrink-0 text-[#e52629]" />
                  </div>
                  <p className="mt-4 text-sm font-semibold leading-7 text-[#526b80]">{product.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {product.specs.map((spec) => (
                      <span key={spec} className="bg-[#edf3f7] px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#23435f]">{spec}</span>
                    ))}
                  </div>
                  <a
                    href={waLink(`Hola Soluciones Tropicales, quiero información sobre ${product.title}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-7 inline-flex items-center justify-between border-t border-[#0c3358]/10 pt-5 text-xs font-black uppercase tracking-[0.14em] text-[#0874cf]"
                  >
                    Consultar disponibilidad <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="servicios" className="bg-[#052c55] px-5 py-20 text-white sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#75c766]">Solución completa</p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-[0.96] tracking-[-0.05em] sm:text-6xl">Más que vender equipos.</h2>
            </div>
            <p className="max-w-2xl text-base font-semibold leading-8 text-white/60 lg:ml-auto">
              Le acompañamos antes, durante y después de la compra para que cada máquina se mantenga productiva y lista para el campo.
            </p>
          </div>

          <div className="mt-12 grid border-l border-t border-white/12 md:grid-cols-2 xl:grid-cols-4">
            {SERVICES.map((service) => (
              <article key={service.title} className="border-b border-r border-white/12 p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <service.icon className="h-8 w-8 text-[#75c766]" />
                  <span className="text-xs font-black tracking-[0.2em] text-white/24">{service.number}</span>
                </div>
                <h3 className="mt-10 text-xl font-black uppercase">{service.title}</h3>
                <p className="mt-4 text-sm font-semibold leading-7 text-white/52">{service.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="respaldo" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_.98fr] lg:items-stretch">
          <div className="relative min-h-[470px] overflow-hidden bg-[#0b2238]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PRODUCT_IMAGES.service} alt="Técnico dando mantenimiento a equipo motorizado" className="absolute inset-0 h-full w-full object-cover opacity-72" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#052c55] via-[#052c55]/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10">
              <span className="inline-flex items-center gap-2 bg-[#75c766] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#052c55]"><Wrench className="h-4 w-4" /> Taller especializado</span>
              <p className="mt-5 max-w-xl text-3xl font-black uppercase leading-tight sm:text-4xl">El respaldo también es parte del equipo.</p>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-white p-7 shadow-[0_18px_50px_rgba(6,59,115,.08)] sm:p-10 lg:p-14">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e52629]">Servicio técnico</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-[0.96] tracking-[-0.05em] text-[#063b73] sm:text-5xl">Cuide su inversión. Mantenga su rendimiento.</h2>
            <p className="mt-6 text-base font-semibold leading-8 text-[#526b80]">
              Un buen mantenimiento reduce imprevistos y ayuda a que el equipo responda cuando más lo necesita. Consulte diagnóstico, repuestos y servicio para su maquinaria.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                [Gauge, "Revisión de rendimiento"],
                [Cog, "Repuestos y consumibles"],
                [ShieldCheck, "Atención responsable"],
                [Clock3, "Mantenimiento oportuno"],
              ].map(([Icon, label]) => (
                <div key={label as string} className="flex items-center gap-3 bg-[#edf3f7] p-4">
                  <Icon className="h-5 w-5 shrink-0 text-[#0874cf]" />
                  <span className="text-xs font-black uppercase tracking-[0.08em] text-[#23435f]">{label as string}</span>
                </div>
              ))}
            </div>
            <a
              href={waLink("Hola Soluciones Tropicales, quiero consultar por servicio técnico para mi equipo.")}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 bg-[#e52629] px-6 text-sm font-black uppercase text-white transition hover:bg-[#bd171a]"
            >
              Consultar servicio <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-[#0c3358]/10 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-7 lg:flex-row">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-[#526b80] lg:text-left">Marcas para trabajo serio</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 text-2xl font-black italic tracking-[-0.05em] text-[#063b73]/76 sm:gap-x-16 sm:text-3xl">
            <span>ECHO</span><span>BISON</span><span className="text-[#e52629]/80">Oleo-Mac</span><span>OSAKA</span>
          </div>
        </div>
      </section>

      <section id="ubicacion" className="bg-[#edf3f7] px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.82fr_1.18fr]">
          <div className="bg-[#063b73] p-7 text-white sm:p-10 lg:p-12">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#75c766]">Visítenos</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-[0.96] tracking-[-0.05em] sm:text-5xl">La solución está más cerca.</h2>
            <p className="mt-6 text-base font-semibold leading-8 text-white/62">
              {BUSINESS.address}. Consulte disponibilidad antes de visitarnos y le ayudamos a preparar su compra.
            </p>

            <div className="mt-9 grid gap-3">
              <a href={`tel:${BUSINESS.phone}`} className="flex items-center gap-4 border border-white/14 bg-white/6 p-4 transition hover:bg-white/10">
                <span className="grid h-11 w-11 place-items-center bg-[#0874cf]"><Phone className="h-5 w-5" /></span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">Teléfono</span>
                  <span className="mt-1 block font-black">{BUSINESS.phoneDisplay}</span>
                </span>
              </a>
              <a
                href={waLink("Hola Soluciones Tropicales, quiero consultar disponibilidad antes de visitarles.")}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 border border-white/14 bg-white/6 p-4 transition hover:bg-white/10"
              >
                <span className="grid h-11 w-11 place-items-center bg-[#75c766] text-[#052c55]"><MessageCircle className="h-5 w-5" /></span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">WhatsApp</span>
                  <span className="mt-1 block font-black">{BUSINESS.whatsappDisplay}</span>
                </span>
              </a>
            </div>

            <div className="mt-8 flex items-center gap-3 border-t border-white/12 pt-7">
              <a href={BUSINESS.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid h-11 w-11 place-items-center bg-white/8 transition hover:bg-white/15"><Facebook className="h-5 w-5" /></a>
              <a href={BUSINESS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-11 w-11 place-items-center bg-white/8 transition hover:bg-white/15"><Instagram className="h-5 w-5" /></a>
              <span className="ml-2 text-xs font-bold uppercase tracking-[0.14em] text-white/44">Síganos para ver nuevos equipos</span>
            </div>
          </div>

          <div className="min-h-[520px] overflow-hidden border border-[#0c3358]/10 bg-white p-2 shadow-[0_18px_50px_rgba(6,59,115,.08)]">
            <iframe
              title="Ubicación de Soluciones Tropicales en Ciudad Quesada"
              src="https://www.google.com/maps?q=Soluciones%20Tropicales%20Ciudad%20Quesada%20San%20Carlos%20Costa%20Rica&z=16&output=embed"
              className="h-full min-h-[504px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#e52629] px-5 py-16 text-white sm:px-8 lg:py-20">
        <div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full border-[60px] border-white/[0.07]" />
        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/62">¿Listo para trabajar mejor?</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-[0.96] tracking-[-0.05em] sm:text-6xl">Cuéntenos qué necesita.</h2>
          </div>
          <a
            href={waLink("Hola Soluciones Tropicales, quiero encontrar el equipo adecuado para mi trabajo.")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-14 shrink-0 items-center justify-center gap-3 bg-white px-7 text-sm font-black uppercase text-[#bd171a] transition hover:bg-[#052c55] hover:text-white"
          >
            Hablar con un asesor <MessageCircle className="h-5 w-5" />
          </a>
        </div>
      </section>

      <footer className="bg-[#031f3a] px-5 py-9 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-lg font-black uppercase tracking-[-0.03em]">Soluciones Tropicales</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/42">Su aliado en el campo</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-white/52">
            <a href={`tel:${BUSINESS.phone}`} className="transition hover:text-white">{BUSINESS.phoneDisplay}</a>
            <a href={BUSINESS.maps} target="_blank" rel="noreferrer" className="transition hover:text-white">Ciudad Quesada, San Carlos</a>
            <span>© {new Date().getFullYear()} Soluciones Tropicales</span>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-white/10 bg-[#031f3a]/96 p-2 text-white shadow-2xl backdrop-blur sm:hidden">
        <a href={waLink("Hola Soluciones Tropicales, quiero información sobre sus equipos.")} target="_blank" rel="noreferrer" className="flex min-h-12 flex-col items-center justify-center gap-1 bg-[#75c766] text-[9px] font-black uppercase tracking-[0.1em] text-[#052c55]"><MessageCircle className="h-4 w-4" />WhatsApp</a>
        <a href={`tel:${BUSINESS.phone}`} className="flex min-h-12 flex-col items-center justify-center gap-1 text-[9px] font-black uppercase tracking-[0.1em]"><Phone className="h-4 w-4" />Llamar</a>
        <a href={BUSINESS.maps} target="_blank" rel="noreferrer" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[9px] font-black uppercase tracking-[0.1em]"><MapPin className="h-4 w-4" />Cómo llegar</a>
      </div>
    </main>
  );
}
