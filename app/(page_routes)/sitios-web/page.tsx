import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gauge, Palette, Smartphone } from "lucide-react";

export const metadata: Metadata = {
  title: "Sitios web modernos para tu negocio",
  description:
    "Diseño y desarrollo de sitios web rápidos, modernos y listos para vender. Mira las propuestas de demostración.",
};

const PERKS = [
  {
    icon: Smartphone,
    title: "100% responsivo",
    text: "Se ve perfecto en celular, tablet y escritorio.",
  },
  {
    icon: Gauge,
    title: "Rápido y optimizado",
    text: "Carga veloz y listo para aparecer en Google.",
  },
  {
    icon: Palette,
    title: "Diseño a tu marca",
    text: "Colores, logo y estilo alineados a tu negocio.",
  },
];

export default function SitiosWebPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Sitios web
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Tu negocio merece un
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              sitio web que venda
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400">
            Diseñamos sitios modernos, rápidos y hechos a la medida de tu marca.
            Mira algunas propuestas de demostración.
          </p>
          <Link
            href="/sitios-web/propuestas"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-8 py-4 font-bold text-neutral-950 transition hover:scale-105"
          >
            Ver propuestas
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-3">
          {PERKS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center"
            >
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <p.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-bold">{p.title}</h3>
              <p className="mt-2 text-sm text-neutral-400">{p.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
