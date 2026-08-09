"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  AudioLines,
  Cable,
  Check,
  Disc3,
  Drum,
  ExternalLink,
  Facebook,
  GraduationCap,
  Guitar,
  Instagram,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Mic2,
  Music2,
  Phone,
  Piano,
  Radio,
  Users,
  Volume2,
  X,
  Youtube,
  Zap,
} from "lucide-react";

const PHONE = "2461-1316";
const MOBILE = "8714-8993";
const WHATSAPP = "https://wa.me/50687148993?text=Hola%20JESS%20Music%2C%20quiero%20informaci%C3%B3n.";
const PRODUCT_WHATSAPP = "https://wa.me/50687148993?text=Hola%20JESS%20Music%2C%20quiero%20informaci%C3%B3n%20sobre%20la%20bater%C3%ADa%20junior%20de%205%20piezas%20con%2022%25%20de%20descuento.";
const MAPS = "https://www.google.com/maps/search/?api=1&query=Jess+Music+Ciudad+Quesada+Costa+Rica";
const MAP_EMBED = "https://www.openstreetmap.org/export/embed.html?bbox=-84.43768%2C10.31812%2C-84.42168%2C10.33012&layer=mapnik&marker=10.32412%2C-84.42968";
const IMG = "/propuestas/grupo-jess";

const NAV = [
  ["#tienda", "Tienda"],
  ["#galeria", "Galería"],
  ["#historia", "Historia"],
  ["#grupo", "Ecosistema"],
  ["#academia", "Academia"],
  ["#banda", "Banda"],
  ["#eventos", "Eventos"],
  ["#contacto", "Contacto"],
] as const;

const bars = [18, 34, 22, 52, 28, 70, 42, 88, 48, 64, 30, 78, 54, 94, 61, 38, 74, 46, 26, 58, 32, 68, 24, 49, 36, 81, 44, 60, 29, 72, 41, 55];

const categories = [
  { number: "01", title: "Cuerdas", subtitle: "Guitarras · Bajos · Accesorios", icon: Guitar, color: "#3778ff", image: `${IMG}/photo-store-guitars.jpg` },
  { number: "02", title: "Teclas & vientos", subtitle: "Pianos · Teclados · Vientos", icon: Piano, color: "#21d9e5", image: `${IMG}/photo-store-keys.jpg` },
  { number: "03", title: "Percusión", subtitle: "Baterías · Ritmo · Accesorios", icon: Drum, color: "#8de65c", image: `${IMG}/photo-store-drums.jpg` },
  { number: "04", title: "Audio profesional", subtitle: "Amplis · Micros · Monitoreo", icon: Volume2, color: "#d8ef55", image: `${IMG}/photo-pro-audio.jpg` },
];

const storeExtras = [
  "Asesoría para elegir instrumento",
  "Cuerdas, púas y repuestos",
  "Equipos de audio e iluminación",
  "Acompañamiento de músico a profesional",
];

const units = [
  {
    number: "01",
    name: "Jess Store",
    kicker: "Tienda musical",
    text: "Instrumentos, amplificadores, micrófonos, accesorios y tecnología para músicos de la Zona Norte. Asesoría cercana para encontrar el equipo correcto.",
    icon: Guitar,
    tone: "#397cff",
    image: `${IMG}/photo-store-guitars.jpg`,
  },
  {
    number: "02",
    name: "eXpression",
    kicker: "Academia de artes",
    text: "Formación musical para niños, jóvenes y adultos: profesores por instrumento, práctica grupal y presentaciones estudiantiles.",
    icon: GraduationCap,
    tone: "#26dce7",
    image: `${IMG}/photo-academy-guitar.jpg`,
  },
  {
    number: "03",
    name: "Sound Systems",
    kicker: "Producción de eventos",
    text: "Alquiler de sonido, iluminación, video, tarimas, DJ y montaje técnico para bodas, corporativos, culturales y celebraciones institucionales.",
    icon: AudioLines,
    tone: "#91e75d",
    image: `${IMG}/photo-festival-stage.jpg`,
  },
  {
    number: "04",
    name: "Jess Band",
    kicker: "Música en vivo",
    text: "Agrupación para eventos sociales y empresariales. Paquete integrado: música en vivo + sonido + iluminación + producción.",
    icon: Users,
    tone: "#f0b429",
    image: `${IMG}/photo-band-stage.jpg`,
  },
  {
    number: "05",
    name: "Jess Records",
    kicker: "Estudio & grabación",
    text: "Producción y grabación musical dentro del ecosistema JESS: tomas en vivo, apoyo creativo y registro de proyectos locales.",
    icon: Disc3,
    tone: "#c084fc",
    image: `${IMG}/photo-records-studio.jpg`,
  },
  {
    number: "06",
    name: "Pross Electronics",
    kicker: "Taller especializado",
    text: "Diagnóstico y reparación de audio, video, mezcladoras, parlantes, pantallas y luces. Soporte que cierra el ciclo del equipo.",
    icon: Cable,
    tone: "#d8ef55",
    image: `${IMG}/photo-pross-repair.jpg`,
  },
];

const timeline = [
  {
    year: "2010",
    title: "Omnimusic",
    text: "Primera tienda de instrumentos al servicio de la Zona Norte: el origen del ecosistema.",
    image: `${IMG}/photo-acoustic-wall.jpg`,
  },
  {
    year: "2011+",
    title: "Audio y producción",
    text: "Nace la identidad Jess Music y se abre el camino en producción de audio profesional.",
    image: `${IMG}/photo-pro-audio.jpg`,
  },
  {
    year: "→",
    title: "Integración vertical",
    text: "Tienda, alquiler técnico, eventos, academia, banda, grabación y servicio electrónico en una sola operación.",
    image: `${IMG}/photo-stage-lights.jpg`,
  },
  {
    year: "2022",
    title: "Plaza El Encuentro",
    text: "Anuncio de sucursal al sur del Hospital San Carlos, reforzando presencia en Ciudad Quesada.",
    image: `${IMG}/photo-store-keys.jpg`,
  },
  {
    year: "Hoy",
    title: "~16 años sonando",
    text: "Actividad continua en instrumentos, academia, producción técnica y entretenimiento en vivo.",
    image: `${IMG}/photo-band-stage.jpg`,
  },
];

const mosaic = [
  { src: `${IMG}/photo-store-guitars.jpg`, alt: "Pared de guitarras en tienda", className: "md:col-span-2 md:row-span-2 min-h-[280px] md:min-h-[420px]" },
  { src: `${IMG}/photo-band-stage.jpg`, alt: "Banda en vivo en escenario", className: "min-h-[200px]" },
  { src: `${IMG}/photo-violin-lesson.jpg`, alt: "Clase de violín", className: "min-h-[200px]" },
  { src: `${IMG}/photo-pro-audio.jpg`, alt: "Equipo de audio profesional", className: "min-h-[200px]" },
  { src: `${IMG}/photo-festival-stage.jpg`, alt: "Producción de festival", className: "md:col-span-2 min-h-[220px]" },
  { src: `${IMG}/photo-academy-ensemble.jpg`, alt: "Ensayo de academia", className: "min-h-[200px]" },
  { src: `${IMG}/photo-dj-booth.jpg`, alt: "Cabina DJ", className: "min-h-[200px]" },
  { src: `${IMG}/photo-records-studio.jpg`, alt: "Estudio de grabación", className: "md:col-span-2 min-h-[240px]" },
  { src: `${IMG}/photo-mic-studio.jpg`, alt: "Micrófono de estudio", className: "min-h-[240px]" },
  { src: `${IMG}/photo-guitar-detail.jpg`, alt: "Detalle de guitarra eléctrica", className: "min-h-[200px]" },
  { src: `${IMG}/photo-event-wedding.jpg`, alt: "Montaje para boda", className: "min-h-[200px]" },
  { src: `${IMG}/photo-pross-repair.jpg`, alt: "Taller de reparación", className: "min-h-[200px]" },
];

const galleryStrip = [
  { src: `${IMG}/photo-store-drums.jpg`, alt: "Batería en tienda" },
  { src: `${IMG}/photo-academy-guitar.jpg`, alt: "Clase de guitarra" },
  { src: `${IMG}/photo-stage-lights.jpg`, alt: "Iluminación de escenario" },
  { src: `${IMG}/photo-event-wedding.jpg`, alt: "Evento social" },
  { src: `${IMG}/photo-acoustic-wall.jpg`, alt: "Guitarras acústicas" },
  { src: `${IMG}/photo-mic-studio.jpg`, alt: "Micrófono" },
  { src: `${IMG}/photo-dj-booth.jpg`, alt: "DJ" },
  { src: `${IMG}/photo-festival-stage.jpg`, alt: "Festival" },
];

const programs = ["Guitarra", "Violín", "Viola", "Cello", "Piano", "Percusión", "Canto", "Bajo", "Saxofón", "Trompeta", "Flauta traversa"];
const brands = ["D.A.S.", "IBANEZ", "TAMA", "QSC AUDIO", "YAMAHA", "D’ADDARIO", "audio-technica", "JBL"];

const eventTypes = [
  "Bodas",
  "Quinceaños",
  "Graduaciones",
  "Corporativos",
  "Conferencias",
  "Conciertos",
  "Ferias",
  "Culturales",
];

const eventServices = [
  { title: "Sonido profesional", text: "Sistemas de audio para salones, exteriores y escenarios.", image: `${IMG}/photo-pro-audio.jpg` },
  { title: "Iluminación", text: "Diseño de luces para ambiente, show y producción.", image: `${IMG}/photo-stage-lights.jpg` },
  { title: "Video & AV", text: "Apoyo audiovisual para presentaciones y espectáculos.", image: `${IMG}/photo-festival-stage.jpg` },
  { title: "Tarimas y montaje", text: "Infraestructura y coordinación técnica del evento.", image: `${IMG}/photo-event-wedding.jpg` },
  { title: "DJ / discomóvil", text: "Entretenimiento y transición entre momentos del programa.", image: `${IMG}/photo-dj-booth.jpg` },
  { title: "Producción integral", text: "Preproducción, montaje y operación el día del evento.", image: `${IMG}/photo-band-stage.jpg` },
];

const bandVenues = [
  "Hotel El Tucano Resort & Spa",
  "Hotel Manoa",
  "Magic Mountain Hotel",
  "La Fortuna y Zona Norte",
];

const bandOccasions = [
  "Bodas y quinceaños",
  "Cumpleaños y aniversarios",
  "Fiestas empresariales",
  "Hoteles y turismo",
  "Fin de año",
  "Eventos privados",
];

const bandPhotos = [
  { src: `${IMG}/photo-band-stage.jpg`, alt: "Jess Band en escenario", className: "min-h-[320px] md:col-span-2 md:row-span-2 md:min-h-[520px]" },
  { src: `${IMG}/photo-stage-lights.jpg`, alt: "Luces de show", className: "min-h-[200px]" },
  { src: `${IMG}/photo-mic-studio.jpg`, alt: "Micrófono en vivo", className: "min-h-[200px]" },
  { src: `${IMG}/photo-event-wedding.jpg`, alt: "Evento social", className: "min-h-[200px] md:col-span-2" },
];

const academyPhotos = [
  { src: `${IMG}/photo-academy-guitar.jpg`, alt: "Clase de guitarra", className: "min-h-[260px] md:col-span-2" },
  { src: `${IMG}/photo-violin-lesson.jpg`, alt: "Clase de violín", className: "min-h-[260px]" },
  { src: `${IMG}/photo-academy-ensemble.jpg`, alt: "Ensamble estudiantil", className: "min-h-[260px]" },
  { src: `${IMG}/photo-guitar-detail.jpg`, alt: "Práctica de cuerdas", className: "min-h-[260px] md:col-span-2" },
];

export default function GrupoJessClient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroProgress, [0, 1], [0, 180]);
  const heroScale = useTransform(heroProgress, [0, 1], [1.04, 1.14]);
  const heroOpacity = useTransform(heroProgress, [0, 0.85], [1, 0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="jess-site min-h-screen overflow-clip bg-[#050711] text-white selection:bg-[#a5ef5a] selection:text-[#071025]">
      <motion.div className="fixed left-0 top-0 z-[100] h-[2px] origin-left bg-gradient-to-r from-[#1768ff] via-[#22dce7] to-[#b9ef54]" style={{ scaleX: scrollYProgress }} />

      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "border-b border-white/[.08] bg-[#050711]/80 backdrop-blur-2xl" : "bg-transparent"}`}>
        <div className="mx-auto flex h-[76px] max-w-[1680px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#inicio" aria-label="JESS Music, inicio" className="group relative z-10">
            <img src={`${IMG}/logo.svg`} alt="JESS Music & Sound Systems" className="h-10 w-auto drop-shadow-[0_0_18px_rgba(37,219,230,.2)] sm:h-12" />
          </a>
          <nav className="hidden items-center gap-5 2xl:flex">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} className="text-[10px] font-bold uppercase tracking-[.22em] text-white/55 transition hover:text-white">{label}</a>
            ))}
          </nav>
          <div className="hidden items-center gap-5 sm:flex">
            <span className="text-xs font-semibold text-white/45">+506 {PHONE}</span>
            <MagneticButton href={WHATSAPP}>Hablemos <ArrowUpRight className="h-4 w-4" /></MagneticButton>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/20 2xl:hidden" aria-label="Abrir menú">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border-t border-white/10 bg-[#050711]/95 px-5 py-6 backdrop-blur-2xl 2xl:hidden">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between border-b border-white/10 py-4 text-lg font-bold">{label}<ArrowUpRight className="h-4 w-4 text-[#25dce7]" /></a>
            ))}
          </motion.div>
        )}
      </header>

      <section ref={heroRef} id="inicio" className="relative min-h-[100svh] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
          <img src={`${IMG}/hero-cinematic-v2.png`} alt="Escenario JESS con instrumentos y equipo de audio" className="h-full w-full object-cover object-[67%_center]" />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,4,12,.98)_0%,rgba(2,4,12,.86)_31%,rgba(2,4,12,.18)_68%,rgba(2,4,12,.38)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,4,12,.2)_0%,transparent_50%,#050711_100%)]" />
        <div className="jess-noise absolute inset-0 opacity-[.12]" />
        <div className="jess-beam absolute -right-[10%] -top-[20%] h-[120%] w-[42%] rotate-[13deg] bg-gradient-to-b from-[#21dce7]/0 via-[#21dce7]/10 to-transparent blur-3xl" />

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1680px] flex-col justify-end px-5 pb-8 pt-32 sm:px-8 lg:px-12 lg:pb-12">
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[.28em] text-[#50e5eb]">
                <span className="h-px w-10 bg-[#50e5eb]" /> Ciudad Quesada · San Carlos · Costa Rica
                <span className="rounded-full border border-[#50e5eb]/30 px-3 py-1 text-[9px] tracking-[.16em] text-[#50e5eb]/80">Desde 2010</span>
              </motion.div>
              <motion.h1 variants={fadeUp} className="mt-6 max-w-[960px] font-display text-[clamp(4rem,10.2vw,10.5rem)] font-black leading-[.76] tracking-[-.075em]">
                TODO<br /><span className="jess-outline-text">SUENA</span><span className="text-[#a9eb58]">.</span>
              </motion.h1>
              <motion.div variants={fadeUp} className="mt-8 flex max-w-3xl flex-col gap-7 border-l border-[#35dfe8]/60 pl-5 sm:flex-row sm:items-end sm:justify-between sm:pl-7">
                <p className="max-w-xl text-base leading-7 text-white/62 sm:text-lg">
                  No es solo un grupo musical: es el ecosistema sancarleño de instrumentos, formación, producción de eventos, sonido, iluminación, grabación y entretenimiento en vivo.
                </p>
                <a href="#galeria" className="group inline-flex shrink-0 items-center gap-3 text-xs font-black uppercase tracking-[.18em]">Ver galería <span className="grid h-11 w-11 place-items-center rounded-full border border-white/25 transition group-hover:border-[#a9eb58] group-hover:bg-[#a9eb58] group-hover:text-black"><ArrowDown className="h-4 w-4" /></span></a>
              </motion.div>
            </motion.div>
            <motion.aside initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .7, duration: .8 }} className="hidden border-l border-white/15 pl-8 lg:block">
              <p className="text-[10px] font-black uppercase tracking-[.25em] text-white/35">JESS Group</p>
              <p className="mt-4 text-3xl font-black leading-none">6 líneas.<br />1 misma pasión.</p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {[`${IMG}/photo-guitar-detail.jpg`, `${IMG}/photo-mic-studio.jpg`, `${IMG}/photo-store-drums.jpg`].map((src) => (
                  <div key={src} className="aspect-square overflow-hidden rounded-xl border border-white/10">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-[10px] font-bold uppercase tracking-[.14em] text-white/45">
                <span>Store</span><span>Academia</span><span>Eventos</span><span>Banda</span><span>Records</span><span>Taller</span>
              </div>
            </motion.aside>
          </div>

          <div className="mt-10 flex h-14 items-center gap-[5px] overflow-hidden border-t border-white/10 pt-5" aria-hidden="true">
            {bars.map((height, index) => <span key={index} className="jess-eq w-[3px] rounded-full bg-gradient-to-t from-[#1768ff] via-[#26dce7] to-[#b8ed56]" style={{ height: `${height}%`, animationDelay: `${index * -0.08}s`, animationDuration: `${.7 + index % 6 * .12}s` }} />)}
            <div className="ml-auto hidden items-center gap-3 sm:flex"><span className="h-2 w-2 animate-pulse rounded-full bg-[#a9eb58]" /><span className="text-[9px] font-black uppercase tracking-[.26em] text-white/35">Señal activa · Zona Norte</span></div>
          </div>
        </motion.div>
      </section>

      <div className="relative z-10 overflow-hidden border-y border-white/10 bg-[#090d1b] py-3">
        <div className="jess-marquee flex w-max items-center gap-3">
          {[...galleryStrip, ...galleryStrip].map((item, index) => (
            <div key={`${item.src}-${index}`} className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-white/10 sm:h-24 sm:w-40">
              <img src={item.src} alt={item.alt} className="h-full w-full object-cover opacity-80" loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      <section className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1500px]">
          <Reveal>
            <p className="text-[10px] font-black uppercase tracking-[.3em] text-[#39dfe7]">Ecosistema musical sancarleño</p>
            <h2 className="mt-8 max-w-[1250px] font-display text-[clamp(3.3rem,8vw,8.3rem)] font-black leading-[.88] tracking-[-.065em] text-white/18">
              ES EL LUGAR DONDE<br /><span className="text-white">LA MÚSICA SE VUELVE</span><br /><span className="bg-gradient-to-r from-[#2676ff] via-[#25dce7] to-[#a9eb58] bg-clip-text text-transparent">EXPERIENCIA.</span>
            </h2>
            <p className="mt-10 max-w-2xl text-base leading-8 text-white/45">
              Vende el instrumento, enseña a tocarlo, forma artistas, graba, pone músicos en el escenario y aporta sonido, luces, video y tarima. Cadena completa para clientes privados e institucionales.
            </p>
          </Reveal>
          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[
              { src: `${IMG}/photo-store-guitars.jpg`, label: "Tienda" },
              { src: `${IMG}/photo-academy-guitar.jpg`, label: "Academia" },
              { src: `${IMG}/photo-band-stage.jpg`, label: "Banda" },
              { src: `${IMG}/photo-festival-stage.jpg`, label: "Eventos" },
            ].map((item, index) => (
              <motion.figure
                key={item.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07 }}
                className="group relative overflow-hidden rounded-[1.5rem] border border-white/10"
              >
                <img src={item.src} alt={item.label} className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-[10px] font-black uppercase tracking-[.2em] text-white/80">{item.label}</figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      <section id="galeria" className="border-t border-white/10 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1500px]">
          <Reveal>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.3em] text-[#39dfe7]">Galería visual</p>
                <h2 className="mt-5 font-display text-4xl font-black tracking-[-.05em] sm:text-6xl">El ecosistema<br /><span className="font-serif italic text-[#a9eb58]">en imágenes.</span></h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-white/40">Tienda, clases, escenarios, luces y estudio: un recorrido visual por todo lo que JESS pone en marcha.</p>
            </div>
          </Reveal>
          <div className="mt-12 grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
            {mosaic.map((item, index) => (
              <motion.figure
                key={`${item.src}-${index}`}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: (index % 6) * 0.04 }}
                className={`group relative overflow-hidden rounded-[1.35rem] border border-white/10 ${item.className}`}
              >
                <img src={item.src} alt={item.alt} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80" />
                <figcaption className="absolute bottom-4 left-4 right-4 text-[10px] font-bold uppercase tracking-[.16em] text-white/75">{item.alt}</figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      <section id="tienda" className="relative border-t border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute right-[-20%] top-[-10%] h-[700px] w-[700px] rounded-full bg-[#1768ff]/10 blur-[160px]" />
        <div className="relative mx-auto max-w-[1500px]">
          <SectionTitle
            index="01"
            eyebrow="Jess Store / Jess Music"
            title={<>Encuentre su<br /><i>propio sonido.</i></>}
            copy="Guitarras, bajos, baterías, teclados, vientos, amplificadores, micrófonos y audio profesional. Asesoría para músicos que empiezan, crecen o viven del escenario. Marcas, modelos y existencias se confirman con el equipo."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[`${IMG}/photo-acoustic-wall.jpg`, `${IMG}/photo-guitar-detail.jpg`, `${IMG}/photo-store-keys.jpg`].map((src, i) => (
              <div key={src} className="overflow-hidden rounded-[1.25rem] border border-white/10">
                <img src={src} alt={`Instrumentos en tienda ${i + 1}`} className="aspect-[5/3] w-full object-cover transition duration-700 hover:scale-105" loading="lazy" />
              </div>
            ))}
          </div>
          <div className="mt-8 grid overflow-hidden rounded-[2rem] border border-white/10 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((item, index) => (
              <motion.article key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: index * .08 }} className="jess-category group relative min-h-[420px] overflow-hidden border-b border-white/10 last:border-0 md:odd:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
                <img src={item.image} alt={item.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050711] via-[#050711]/75 to-[#050711]/25" />
                <div className="absolute inset-0 opacity-0 transition duration-700 group-hover:opacity-100" style={{ background: `radial-gradient(circle at 20% 100%, ${item.color}33, transparent 60%)` }} />
                <div className="relative flex h-full flex-col justify-between p-7 sm:p-9">
                  <div className="flex items-start justify-between"><span className="font-mono text-[10px] text-white/50">/{item.number}</span><item.icon className="h-7 w-7 drop-shadow" style={{ color: item.color }} /></div>
                  <div>
                    <div className="mb-7 h-px w-full origin-left scale-x-0 transition duration-700 group-hover:scale-x-100" style={{ background: item.color }} />
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/55">{item.subtitle}</p>
                    <h3 className="mt-4 text-3xl font-black tracking-[-.04em]">{item.title}</h3>
                    <a href={WHATSAPP} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-white/70 transition hover:text-white">Consultar <ArrowUpRight className="h-4 w-4" /></a>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {storeExtras.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[.03] px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-white/50">
                <Check className="mr-1.5 inline h-3 w-3 text-[#9bea5d]" />{item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-[1500px] overflow-hidden rounded-[2.5rem] border border-[#2a79ff]/30 bg-[#070c19] shadow-[0_40px_120px_rgba(0,0,0,.45)] lg:grid-cols-[1.08fr_.92fr]">
          <div className="relative min-h-[520px] overflow-hidden lg:min-h-[700px]">
            <img src={`${IMG}/bateria-junior-featured.png`} alt="Batería junior de cinco piezas" className="absolute inset-0 h-full w-full object-cover object-center transition duration-[1.5s] hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040711]/85 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#070c19]/25" />
            <div className="absolute left-6 top-6 flex h-24 w-24 rotate-[-8deg] flex-col items-center justify-center rounded-full bg-[#b7ed55] text-[#071025] shadow-[0_0_50px_rgba(183,237,85,.35)] sm:left-10 sm:top-10 sm:h-32 sm:w-32">
              <strong className="text-3xl font-black sm:text-4xl">−22%</strong><span className="text-[9px] font-black uppercase tracking-[.18em]">Especial</span>
            </div>
          </div>
          <div className="relative flex flex-col justify-center p-7 sm:p-12 lg:p-16">
            <div className="absolute right-8 top-8 font-mono text-[10px] text-white/20">DROP / 001</div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.25em] text-[#28dce7]"><Zap className="h-3.5 w-3.5" /> Oferta destacada</p>
            <h2 className="mt-7 font-display text-5xl font-black leading-[.88] tracking-[-.06em] sm:text-7xl">PRIMER<br /><span className="jess-outline-text">RITMO.</span></h2>
            <p className="mt-7 text-xl font-bold text-white/80">Batería junior · 5 piezas</p>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/45">Una puerta de entrada al mundo de la percusión. Consulte precio final, existencias, colores y condiciones de la promoción.</p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <img src={`${IMG}/photo-store-drums.jpg`} alt="Batería profesional de referencia" className="aspect-[16/9] w-full object-cover" loading="lazy" />
            </div>
            <div className="mt-8 flex flex-wrap gap-2">{["5 piezas", "Formato junior", "22% de descuento"].map(item => <span key={item} className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/55"><Check className="mr-1.5 inline h-3 w-3 text-[#9bea5d]" />{item}</span>)}</div>
            <div className="mt-10"><MagneticButton href={PRODUCT_WHATSAPP}>Consultar oferta <ArrowUpRight className="h-4 w-4" /></MagneticButton></div>
          </div>
        </div>
      </section>

      <section id="historia" className="border-t border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1500px]">
          <Reveal>
            <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.3em] text-[#39dfe7]">Trayectoria</p>
                <h2 className="mt-7 font-display text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl">
                  DE OMNIMUSIC<br />A <span className="font-serif italic text-[#a9eb58]">JESS Group.</span>
                </h2>
              </div>
              <p className="max-w-xl text-base leading-8 text-white/45">
                Más de una década y media al servicio de la cultura musical de Ciudad Quesada y la Zona Norte: de la primera tienda a un ecosistema vertical de entretenimiento.
              </p>
            </div>
          </Reveal>
          <div className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {timeline.map((item, index) => (
              <motion.article
                key={`${item.year}-${item.title}`}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * .06 }}
                className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[.03]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050711] via-[#050711]/20 to-transparent" />
                  <span className="absolute bottom-3 left-4 font-mono text-xs text-[#36dfe7]">{item.year}</span>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black tracking-[-.03em]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/42">{item.text}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="grupo" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-40">
        <div className="mx-auto grid max-w-[1500px] gap-16 lg:grid-cols-[.72fr_1.28fr] lg:gap-24">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="text-[10px] font-black uppercase tracking-[.3em] text-[#37dfe7]">JESS Group / Ecosistema</p>
            <h2 className="mt-7 font-display text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl">SEIS<br />FORMAS DE<br /><span className="font-serif italic text-[#a9eb58]">hacer música.</span></h2>
            <p className="mt-8 max-w-md text-sm leading-7 text-white/45">
              Del primer instrumento al gran escenario. Tienda, academia, producción técnica, banda, grabación y taller conectados bajo una misma visión.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3">
              {[`${IMG}/photo-pross-repair.jpg`, `${IMG}/photo-records-studio.jpg`].map((src) => (
                <div key={src} className="overflow-hidden rounded-2xl border border-white/10">
                  <img src={src} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
          <div>
            {units.map((unit, index) => (
              <motion.article key={unit.name} initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: .65, delay: index * .04 }} className="group grid gap-6 border-t border-white/12 py-10 first:border-[#2877ff]/50 sm:grid-cols-[110px_1fr_auto] sm:items-center sm:py-12">
                <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-white/10 sm:h-28 sm:w-[110px]">
                  <img src={unit.image} alt={unit.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" loading="lazy" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.22em]" style={{ color: unit.tone }}>{unit.kicker}</p>
                  <h3 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-5xl">{unit.name}</h3>
                  <p className="mt-5 max-w-xl text-sm leading-7 text-white/42">{unit.text}</p>
                </div>
                <span className="grid h-14 w-14 place-items-center rounded-full border border-white/10 transition duration-500 group-hover:rotate-6 group-hover:border-white/30" style={{ background: `${unit.tone}12` }}>
                  <unit.icon className="h-6 w-6" style={{ color: unit.tone }} />
                </span>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="academia" className="relative overflow-hidden bg-[#e9f0f2] py-24 text-[#06102b] lg:py-36">
        <div className="absolute right-[-10%] top-[-40%] h-[700px] w-[700px] rounded-full bg-[#23dce7]/20 blur-[130px]" />
        <div className="relative mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.3em] text-[#0c63d8]">eXpression by Jess Music</p>
              <h2 className="mt-7 font-display text-[clamp(4rem,8.2vw,8.5rem)] font-black leading-[.78] tracking-[-.07em]">
                APRENDA.<br /><span className="text-[#0d66ee]">TOQUE.</span><br />EXPRESE.
              </h2>
            </div>
            <div className="max-w-lg lg:pb-2">
              <p className="text-lg font-semibold leading-8 text-[#06102b]/60">
                Academia musical de la Zona Norte: clases para niños, jóvenes y adultos, profesores especializados por instrumento, experiencias grupales y presentaciones de estudiantes.
              </p>
              <ul className="mt-6 space-y-2 text-sm font-medium text-[#06102b]/55">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#0d66ee]" /> Formación personalizada y práctica</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#0d66ee]" /> Conciertos y actividades comunitarias</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#0d66ee]" /> Ruta de curiosidad a técnica</li>
              </ul>
              <a href={WHATSAPP} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-3 text-xs font-black uppercase tracking-[.18em]">
                Consultar matrícula <span className="grid h-12 w-12 place-items-center rounded-full bg-[#06102b] text-white"><ArrowUpRight className="h-4 w-4" /></span>
              </a>
            </div>
          </div>
          <div className="mt-14 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {academyPhotos.map((item) => (
              <div key={item.src} className={`overflow-hidden rounded-[1.5rem] border border-[#06102b]/10 shadow-sm ${item.className}`}>
                <img src={item.src} alt={item.alt} className="h-full min-h-[260px] w-full object-cover transition duration-700 hover:scale-105" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-20 rotate-[-2deg] border-y border-[#06102b]/15 bg-[#b5ed57] py-5">
          <div className="jess-marquee-reverse flex w-max whitespace-nowrap font-display text-4xl font-black uppercase tracking-[-.04em] sm:text-6xl">
            {[...programs, ...programs].map((program, index) => (
              <span key={`${program}-${index}`} className="flex items-center"><Music2 className="mx-8 h-6 w-6" />{program}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="banda" className="relative overflow-hidden border-t border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(240,180,41,.12),transparent_45%),radial-gradient(ellipse_at_15%_80%,rgba(24,103,255,.12),transparent_40%)]" />
        <div className="relative mx-auto max-w-[1500px]">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <Reveal>
              <p className="text-[10px] font-black uppercase tracking-[.3em] text-[#f0b429]">Jess Band by Jess Music</p>
              <h2 className="mt-7 font-display text-[clamp(3.5rem,7.5vw,7.5rem)] font-black leading-[.82] tracking-[-.07em]">
                MÚSICA<br />EN VIVO.<br /><span className="jess-outline-text">SIN COSTURAS.</span>
              </h2>
              <p className="mt-8 max-w-xl text-base leading-8 text-white/48">
                La banda del ecosistema JESS para bodas, quinceaños, fiestas empresariales y celebraciones en hoteles de la Zona Norte. La ventaja: un solo proveedor con músicos, sonido, luces y producción.
              </p>
              <div className="mt-10 flex flex-wrap gap-2">
                {bandOccasions.map((item) => (
                  <span key={item} className="rounded-full border border-[#f0b429]/25 bg-[#f0b429]/08 px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#f0b429]/90">{item}</span>
                ))}
              </div>
              <div className="mt-10">
                <MagneticButton href={WHATSAPP}>Cotizar Jess Band <ArrowUpRight className="h-4 w-4" /></MagneticButton>
              </div>
            </Reveal>
            <div className="rounded-[2rem] border border-white/10 bg-white/[.03] p-8 sm:p-10">
              <p className="text-[10px] font-black uppercase tracking-[.24em] text-white/35">Presencia en escenarios</p>
              <p className="mt-4 text-sm leading-7 text-white/45">Presentaciones registradas en la zona turística y social de San Carlos y alrededores:</p>
              <ul className="mt-8 space-y-4">
                {bandVenues.map((venue) => (
                  <li key={venue} className="flex items-start gap-3 border-b border-white/8 pb-4 last:border-0 last:pb-0">
                    <Mic2 className="mt-0.5 h-4 w-4 shrink-0 text-[#f0b429]" />
                    <span className="text-sm font-semibold text-white/75">{venue}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-[11px] leading-6 text-white/30">
                Paquete integrado: música en vivo + sonido + iluminación + producción. Disponibilidad y repertorio se confirman con el equipo.
              </p>
            </div>
          </div>
          <div className="mt-14 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {bandPhotos.map((item) => (
              <div key={item.src + item.alt} className={`relative overflow-hidden rounded-[1.5rem] border border-white/10 ${item.className}`}>
                <img src={item.src} alt={item.alt} className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <p className="absolute bottom-4 left-4 text-[10px] font-black uppercase tracking-[.16em] text-white/80">{item.alt}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="eventos" className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_50%,rgba(24,103,255,.16),transparent_48%),radial-gradient(ellipse_at_80%_20%,rgba(39,220,231,.1),transparent_38%)]" />
        <div className="relative mx-auto max-w-[1500px]">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="text-[10px] font-black uppercase tracking-[.3em] text-[#9ee85a]">Sound Systems / Producción</p>
              <h2 className="mt-7 font-display text-[clamp(4rem,8vw,8rem)] font-black leading-[.8] tracking-[-.07em]">
                NO SOLO<br />SE VE.<br /><span className="jess-outline-text">SE SIENTE.</span>
              </h2>
              <p className="mt-8 max-w-xl text-base leading-8 text-white/48">
                División de alquiler de audio, video e iluminación. Montaje técnico y producción para eventos privados, empresariales, culturales e institucionales en Ciudad Quesada y la Zona Norte.
              </p>
            </Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
              <img src={`${IMG}/photo-festival-stage.jpg`} alt="Producción de escenario y luces" className="aspect-square w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050711]/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
                {["Bodas", "Corporativos", "Conciertos", "Culturales"].map((t) => (
                  <span key={t} className="rounded-full border border-white/15 bg-[#080c19]/85 px-4 py-2 text-[10px] font-black uppercase tracking-[.16em] text-white/70 backdrop-blur">{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[`${IMG}/photo-event-wedding.jpg`, `${IMG}/photo-stage-lights.jpg`, `${IMG}/photo-dj-booth.jpg`].map((src, i) => (
              <div key={src} className="overflow-hidden rounded-[1.25rem] border border-white/10">
                <img src={src} alt={`Producción de eventos ${i + 1}`} className="aspect-[16/10] w-full object-cover transition duration-700 hover:scale-105" loading="lazy" />
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventServices.map((service, index) => (
              <motion.article
                key={service.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * .05 }}
                className="group overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[.03]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={service.image} alt={service.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050711] via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-black tracking-[-.03em]">{service.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/42">{service.text}</p>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {eventTypes.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/55">{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#080b16] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.3em] text-[#c084fc]">Jess Records</p>
              <h2 className="mt-6 font-display text-4xl font-black tracking-[-.05em] sm:text-5xl">Estudio y producción musical</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/45">
                Grabaciones en vivo y apoyo de producción dentro del grupo. Ideal para proyectos locales, ensayos capturados y contenido musical vinculado a la academia y la banda.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Disc3, label: "Grabación", text: "Tomas y producción" },
                  { icon: Music2, label: "Proyectos", text: "Artistas y estudiantes" },
                  { icon: AudioLines, label: "En vivo", text: "Captura de shows" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-white/[.03] p-5">
                    <item.icon className="h-6 w-6 text-[#c084fc]" />
                    <p className="mt-4 text-sm font-black">{item.label}</p>
                    <p className="mt-1 text-xs text-white/40">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 sm:row-span-2">
                <img src={`${IMG}/photo-records-studio.jpg`} alt="Estudio de grabación" className="h-full min-h-[320px] w-full object-cover" loading="lazy" />
              </div>
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                <img src={`${IMG}/photo-mic-studio.jpg`} alt="Micrófono de estudio" className="aspect-[4/5] w-full object-cover" loading="lazy" />
              </div>
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                <img src={`${IMG}/photo-pross-repair.jpg`} alt="Soporte técnico de audio" className="aspect-[4/5] w-full object-cover" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#080b16] py-12">
        <p className="text-center text-[9px] font-black uppercase tracking-[.32em] text-white/25">Marcas de referencia</p>
        <div className="mt-9 overflow-hidden">
          <div className="jess-marquee flex w-max items-center whitespace-nowrap">
            {[...brands, ...brands].map((brand, index) => (
              <span key={`${brand}-${index}`} className="mx-10 font-display text-2xl font-black tracking-[-.03em] text-white/30 transition hover:text-white sm:mx-16 sm:text-4xl">{brand}</span>
            ))}
          </div>
        </div>
        <p className="mt-8 text-center text-[10px] text-white/25">Marcas, modelos y disponibilidad sujetos a confirmación con la tienda.</p>
      </section>

      <section id="contacto" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[`${IMG}/photo-store-guitars.jpg`, `${IMG}/photo-band-stage.jpg`, `${IMG}/photo-academy-ensemble.jpg`, `${IMG}/photo-festival-stage.jpg`].map((src, i) => (
              <div key={src} className="overflow-hidden rounded-[1.25rem] border border-white/10">
                <img src={src} alt={`JESS Music ${i + 1}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
          <div className="grid gap-14 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
            <div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[.28em] text-[#34dfe8]"><Radio className="h-4 w-4" /> Canal abierto</div>
              <h2 className="mt-7 font-display text-[clamp(4rem,8vw,8rem)] font-black leading-[.8] tracking-[-.07em]">HAGAMOS<br /><span className="font-serif italic text-[#a9eb58]">ruido.</span></h2>
              <p className="mt-8 max-w-lg text-base leading-8 text-white/45">
                Instrumentos, clases, banda, sonido o un evento completo. El equipo JESS confirma inventario, precios, horarios y disponibilidad.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <MagneticButton href={WHATSAPP}><MessageCircle className="h-4 w-4" /> WhatsApp {MOBILE}</MagneticButton>
                <a href={`tel:+506${PHONE.replace("-", "")}`} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 px-6 text-xs font-black transition hover:bg-white/10"><Phone className="h-4 w-4" /> {PHONE}</a>
              </div>
              <div className="mt-12 space-y-5 border-t border-white/10 pt-8">
                <ContactLine icon={MapPin} label="Sede histórica" value="Frente a la sede del INA, Ciudad Quesada" href={MAPS} />
                <ContactLine icon={MapPin} label="Plaza El Encuentro" value="Sucursal anunciada al sur del Hospital San Carlos" href={MAPS} />
                <ContactLine icon={Mail} label="Correo" value="info@jessmusic.cr" href="mailto:info@jessmusic.cr" />
              </div>
              <div className="mt-10 flex gap-3">
                <Social href="https://www.instagram.com/jessmusiccr/" label="Instagram" icon={Instagram} />
                <Social href="https://www.facebook.com/jessmusiccr" label="Facebook" icon={Facebook} />
                <Social href="https://www.youtube.com/results?search_query=Jess+Music+Sound+Systems+Costa+Rica" label="YouTube" icon={Youtube} />
              </div>
            </div>
            <div className="relative min-h-[540px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.03] p-2">
              <iframe title="Mapa de JESS Music" src={MAP_EMBED} className="h-[540px] w-full rounded-[2rem] border-0 grayscale invert-[.88] hue-rotate-[175deg] contrast-[1.25]" loading="lazy" />
              <a href={MAPS} target="_blank" rel="noreferrer" className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl border border-white/12 bg-[#060914]/90 p-5 backdrop-blur-xl sm:left-auto sm:w-[320px]">
                <span>
                  <small className="block text-[9px] font-black uppercase tracking-[.2em] text-[#3edfe7]">JESS Music</small>
                  <strong className="mt-2 block text-sm">Ciudad Quesada, San Carlos</strong>
                </span>
                <ExternalLink className="h-5 w-5 text-[#a9eb58]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#03050b] px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto mb-10 grid max-w-[1500px] grid-cols-3 gap-2 sm:grid-cols-6">
          {[`${IMG}/photo-guitar-detail.jpg`, `${IMG}/photo-store-drums.jpg`, `${IMG}/photo-dj-booth.jpg`, `${IMG}/photo-violin-lesson.jpg`, `${IMG}/photo-stage-lights.jpg`, `${IMG}/photo-mic-studio.jpg`].map((src) => (
            <div key={src} className="aspect-square overflow-hidden rounded-xl border border-white/10 opacity-70">
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <img src={`${IMG}/logo.svg`} alt="JESS Music" className="h-14 w-auto" />
            <p className="mt-5 text-[10px] uppercase tracking-[.18em] text-white/25">Store · eXpression · Sound Systems · Jess Band · Records · Pross</p>
            <p className="mt-3 max-w-md text-[10px] leading-5 text-white/20">
              JESS Music &amp; Sound Systems · Ecosistema musical de Ciudad Quesada. Propuesta web de demostración.
            </p>
          </div>
          <div className="text-xs text-white/25 sm:text-right">
            <p>Ciudad Quesada · San Carlos · Costa Rica</p>
            <p className="mt-2">© {new Date().getFullYear()} JESS Music &amp; Sound Systems</p>
          </div>
        </div>
      </footer>

      <a href={WHATSAPP} target="_blank" rel="noreferrer" aria-label="Escribir por WhatsApp" className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#a9eb58] text-[#071025] shadow-[0_8px_40px_rgba(169,235,88,.3)] transition hover:scale-110 sm:bottom-7 sm:right-7">
        <MessageCircle className="h-6 w-6" />
      </a>

      <style jsx global>{`
        .jess-site { scroll-behavior: smooth; background-image: radial-gradient(circle at 50% 0, rgba(30,92,230,.07), transparent 28%); }
        .jess-noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.92' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E"); mix-blend-mode: soft-light; }
        .jess-outline-text { color: transparent; -webkit-text-stroke: 1.4px rgba(255,255,255,.75); }
        .jess-eq { transform-origin: bottom; animation: jessEq ease-in-out infinite alternate; }
        .jess-marquee { animation: jessMarquee 30s linear infinite; }
        .jess-marquee-reverse { animation: jessMarqueeReverse 36s linear infinite; }
        .jess-orbit { animation: jessOrbit 24s linear infinite; }
        .jess-category { background: linear-gradient(160deg, rgba(255,255,255,.035), rgba(255,255,255,.008)); }
        @keyframes jessEq { from { transform: scaleY(.28); opacity: .45 } to { transform: scaleY(1); opacity: 1 } }
        @keyframes jessMarquee { to { transform: translateX(-50%); } }
        @keyframes jessMarqueeReverse { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @keyframes jessOrbit { to { transform: rotate(360deg); } }
        @keyframes jessBeam { 0%,100% { opacity:.45; transform:translateX(-4%) rotate(13deg) } 50% { opacity:.9; transform:translateX(8%) rotate(13deg) } }
        .jess-beam { animation: jessBeam 8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .jess-eq,.jess-marquee,.jess-marquee-reverse,.jess-orbit,.jess-beam { animation: none !important; } }
      `}</style>
    </main>
  );
}

function MagneticButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="group inline-flex min-h-12 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#1768ff] via-[#1ab4e6] to-[#27dce7] px-6 text-xs font-black text-white shadow-[0_10px_35px_rgba(23,104,255,.22)] transition duration-300 hover:scale-[1.035] hover:shadow-[0_15px_45px_rgba(39,220,231,.3)]">
      {children}
    </a>
  );
}

function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 55 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: .9, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function SectionTitle({ index, eyebrow, title, copy }: { index: string; eyebrow: string; title: React.ReactNode; copy: string }) {
  return (
    <Reveal>
      <div className="grid gap-10 lg:grid-cols-[1fr_.7fr] lg:items-end">
        <div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-white/25">/{index}</span>
            <p className="text-[10px] font-black uppercase tracking-[.3em] text-[#36dfe7]">{eyebrow}</p>
          </div>
          <h2 className="mt-7 font-display text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl lg:text-8xl">{title}</h2>
        </div>
        <p className="max-w-xl text-base leading-8 text-white/45">{copy}</p>
      </div>
    </Reveal>
  );
}

function ContactLine({ icon: Icon, label, value, href }: { icon: ComponentType<{ className?: string }>; label: string; value: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="group flex items-center gap-4">
      <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[.04]"><Icon className="h-4 w-4 text-[#34dfe8]" /></span>
      <span>
        <small className="block text-[9px] font-black uppercase tracking-[.2em] text-white/25">{label}</small>
        <strong className="mt-1 block text-sm text-white/70 transition group-hover:text-white">{value}</strong>
      </span>
    </a>
  );
}

function Social({ href, label, icon: Icon }: { href: string; label: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-white/50 transition hover:-translate-y-1 hover:border-[#31dfe7]/50 hover:text-[#31dfe7]">
      <Icon className="h-4 w-4" />
    </a>
  );
}

const fadeUp = { hidden: { opacity: 0, y: 35 }, show: { opacity: 1, y: 0, transition: { duration: .8, ease: [0.22, 1, 0.36, 1] as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: .12, delayChildren: .15 } } };
