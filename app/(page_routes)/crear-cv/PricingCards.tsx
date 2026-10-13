"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, KeyRound, MessageCircle, Smartphone, Sparkles, X } from "lucide-react";
import type { Lang } from "@/lib/LanguageContext";
import { cn } from "@/lib/helpers/utils";
import { OPERATOR, PLANS, type Plan, checkoutWhatsAppHref, formatCRC } from "./pricing";
import { activateLicense } from "./storage";

export function PricingCards({ lang }: { lang: Lang }) {
  const isEs = lang === "es";
  const [checkout, setCheckout] = useState<Plan | null>(null);

  return (
    <>
      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const featured = Boolean(plan.featured);
          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border p-6",
                featured
                  ? "border-teal-500 bg-white shadow-[0_20px_50px_-20px_rgba(13,148,136,0.45)] ring-1 ring-teal-500"
                  : "border-zinc-200 bg-white",
              )}
            >
              {featured && (
                <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Sparkles size={11} />
                  {isEs ? "Más elegido" : "Most picked"}
                </span>
              )}
              <h3 className="text-lg font-bold text-zinc-900">{plan.name[lang]}</h3>
              <p className="mt-0.5 text-[13px] text-zinc-500">{plan.tagline[lang]}</p>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-3xl font-black tracking-tight text-zinc-900">
                  {formatCRC(plan.priceCRC)}
                </span>
                {plan.priceCRC > 0 && (
                  <span className="text-[12px] text-zinc-400">~${plan.priceUSD}</span>
                )}
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                {plan.cadence[lang]}
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f[lang]} className="flex gap-2 text-[13px] text-zinc-600">
                    <Check size={15} className="mt-0.5 shrink-0 text-teal-600" />
                    {f[lang]}
                  </li>
                ))}
              </ul>

              {plan.id === "gratis" ? (
                <Link
                  href="/crear-cv/editor"
                  className="mt-5 inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2.5 text-[13px] font-bold text-zinc-800 transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                >
                  {plan.cta[lang]}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setCheckout(plan)}
                  className={cn(
                    "mt-5 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[13px] font-bold transition-colors",
                    featured
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "border border-zinc-300 text-zinc-800 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white",
                  )}
                >
                  {plan.cta[lang]}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <CheckoutModal plan={checkout} lang={lang} onClose={() => setCheckout(null)} />
    </>
  );
}

function CheckoutModal({
  plan,
  lang,
  onClose,
}: {
  plan: Plan | null;
  lang: Lang;
  onClose: () => void;
}) {
  const isEs = lang === "es";
  const [code, setCode] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!plan) return;
    setCode("");
    setOk(false);
    setErr(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [plan, onClose]);

  if (!plan || typeof document === "undefined") return null;

  const amount = `${formatCRC(plan.priceCRC)} (~$${plan.priceUSD})`;
  const steps = isEs
    ? [
        `Hacé un SINPE Móvil de ${amount} al ${OPERATOR.sinpe} (${OPERATOR.sinpeName}).`,
        "Mandá el comprobante por WhatsApp con el botón de abajo.",
        plan.id === "profesional"
          ? "Coordinamos la revisión y te devolvemos el CV en 48 h, con tu código Pro."
          : "Te respondemos con tu código CVXPRO-… en minutos.",
        "Pegá el código acá para activar. También podés pegarlo dentro del editor.",
      ]
    : [
        `Send a SINPE Móvil of ${amount} to ${OPERATOR.sinpe} (${OPERATOR.sinpeName}).`,
        "Send the receipt over WhatsApp using the button below.",
        plan.id === "profesional"
          ? "We schedule the review and return your CV within 48 h, with your Pro code."
          : "We reply with your CVXPRO-… code within minutes.",
        "Paste the code here to activate. You can also paste it inside the editor.",
      ];

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-900/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
          <h2 className="text-[14px] font-bold text-zinc-900">
            {plan.name[lang]} · {amount}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
            <X size={17} />
          </button>
        </div>

        <div className="p-5">
          {ok ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                <Check size={22} />
              </div>
              <p className="mt-3 text-[14px] font-bold text-zinc-900">
                {isEs ? "¡Pro activado en este navegador!" : "Pro activated in this browser!"}
              </p>
              <Link
                href="/crear-cv/editor"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-teal-600 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-teal-700"
              >
                {isEs ? "Abrir el editor" : "Open the editor"}
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 text-[13px] text-zinc-700">
                <Smartphone size={16} className="shrink-0 text-teal-600" />
                <span>
                  SINPE Móvil <strong className="tabular-nums">{OPERATOR.sinpe}</strong> · {OPERATOR.sinpeName}
                </span>
              </div>

              <ol className="mt-4 space-y-2.5">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-zinc-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>

              <a
                href={checkoutWhatsAppHref(plan, lang)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-[13px] font-bold text-[#052E16] transition hover:brightness-105"
              >
                <MessageCircle size={16} />
                {isEs ? "Enviar comprobante por WhatsApp" : "Send receipt on WhatsApp"}
              </a>

              <div className="mt-4 border-t border-zinc-100 pt-4">
                <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                  <KeyRound size={12} />
                  {isEs ? "Código de activación" : "Activation code"}
                </label>
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setErr(false);
                    }}
                    placeholder="CVXPRO-…"
                    className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[13px] uppercase tracking-wide text-zinc-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (activateLicense(code)) setOk(true);
                      else setErr(true);
                    }}
                    className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-bold text-white hover:bg-zinc-700"
                  >
                    {isEs ? "Activar" : "Activate"}
                  </button>
                </div>
                {err && (
                  <p className="mt-1 text-[11.5px] font-medium text-rose-600">
                    {isEs ? "Ese código no es válido todavía." : "That code isn't valid yet."}
                  </p>
                )}
              </div>

              <p className="mt-3 text-[11px] leading-snug text-zinc-400">
                {isEs
                  ? `¿Preferís PayPal o transferencia? Escribinos: ${OPERATOR.email}.`
                  : `Prefer PayPal or bank transfer? Email us: ${OPERATOR.email}.`}
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
