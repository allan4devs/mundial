"use client";

import { Award } from "lucide-react";
import ProposalMock from "./ProposalMock";
import { PROPOSALS, RULES } from "./proposals-data";
import type { Copy, Lang } from "./types";

export default function SignProposals({ lang }: { lang: Lang }) {
  const t = (copy: Copy) => copy[lang];

  return (
    <section className="mt-14 border-t border-white/10 pt-10">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#65e2d5]">
        {lang === "es" ? "Propuestas de diseño" : "Design proposals"}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
        {lang === "es"
          ? "Siete formatos visuales de referencia"
          : "Seven visual reference formats"}
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-300 md:text-base">
        {lang === "es"
          ? "Estas referencias ayudan a comparar jerarquía, color y cantidad de información. Son propuestas visuales: su material, medida y ubicación final todavía deben validarse antes de producir."
          : "These references help compare hierarchy, color and information density. They are visual proposals: final material, size and placement must still be validated before production."}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {RULES.map((rule) => (
          <div
            key={rule.value}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <p className="text-xl font-black tracking-tight text-[#65e2d5]">{rule.value}</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">{t(rule.text)}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {PROPOSALS.map((proposal) => (
          <article
            key={proposal.id}
            className={`flex flex-col overflow-hidden rounded-3xl border bg-zinc-900/60 shadow-xl shadow-black/40 ${
              proposal.recommended ? "border-[#00C4B0]/40" : "border-white/10"
            }`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#65e2d5]">
                  {proposal.id} &middot; {proposal.slots}
                </p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-white">
                  {t(proposal.name)}
                </h3>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black ${
                  proposal.recommended
                    ? "border-[#00C4B0]/50 bg-[#00C4B0]/20 text-[#9ff5eb]"
                    : "border-sky-300/40 bg-sky-400/10 text-sky-200"
                }`}
              >
                <Award className="h-3.5 w-3.5" aria-hidden />
                {proposal.recommended
                  ? lang === "es"
                    ? "Recomendado"
                    : "Recommended"
                  : lang === "es"
                    ? "Referencia visual"
                    : "Visual reference"}
              </span>
            </div>

            <div className="flex justify-center bg-zinc-950/50 px-5 py-6">
              <ProposalMock variant={proposal.variant} />
            </div>

            <div className="flex flex-1 flex-col gap-3 px-5 py-4">
              <p className="text-sm leading-relaxed text-zinc-300">{t(proposal.why)}</p>
              <ul className="space-y-1.5 border-t border-white/10 pt-3 text-sm text-zinc-400">
                {proposal.specs.map((spec) => (
                  <li key={spec.es} className="flex gap-2">
                    <span className="text-[#65e2d5]">&middot;</span>
                    <span>{t(spec)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-auto border-t border-white/10 pt-3 text-xs text-zinc-500">
                <span className="font-black uppercase tracking-[0.14em] text-zinc-400">
                  {lang === "es" ? "Se usa en: " : "Used by: "}
                </span>
                {t(proposal.reference)}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-[#00C4B0]/30 bg-[#00C4B0]/10 p-5 md:p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9ff5eb]">
          {lang === "es" ? "Lo que yo haría" : "What I would do"}
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#c7faf5]">
          <li>
            <span className="font-black">R-01 · </span>
            {lang === "es"
              ? "Portal de entrada (P-E). Es el único que aguanta foto, QR, teléfonos y redes, porque ahí el carro va lento."
              : "Gateway sign (P-E). The only one that can carry photo, QR, phones and socials, because cars are slow there."}
          </li>
          <li>
            <span className="font-black">R-02 y R-03 · </span>
            {lang === "es"
              ? "Café turístico (P-A), o el formato vial modular de la foto (P-B) después de validar ubicación y permisos aplicables. Sin foto, QR ni redes: destino, próxima entrada y flecha."
              : "Brown tourist sign (P-A), or the modular road-style format from the photo (P-B) after validating location and applicable permits. No photo, QR or socials: destination, next entrance and arrow."}
          </li>
          <li>
            <span className="font-black">R-04 a R-07 · </span>
            {lang === "es"
              ? "Flecha mínima (P-C). Nombre, flecha y distancia; dos piezas marcan 2 km y dos piezas marcan 1 km."
              : "Minimal trailblazer (P-C). Name, arrow and distance; two signs mark 2 km and two signs mark 1 km."}
          </li>
        </ul>
        <p className="mt-4 border-t border-[#9ff5eb]/20 pt-3 text-xs leading-relaxed text-[#c7faf5]/80">
          {lang === "es"
            ? "Antes de mandar a fabricar, valide con MOPT o la municipalidad, según corresponda, si la ubicación, el diseño o la instalación requieren permiso. Además, deje por escrito en cada cotización el material reflectivo solicitado para comparar exactamente el mismo alcance."
            : "Before production, validate with MOPT or the municipality, as applicable, whether the location, design or installation requires a permit. Also state the requested reflective material in writing on every quote so all companies price the same scope."}
        </p>
      </div>
    </section>
  );
}
