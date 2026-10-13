"use client";

import type { Lang } from "@/lib/LanguageContext";
import Image from "next/image";
import { MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { trackStoreAction } from "./store-conversion";
import type { Product } from "./store-data";

export type InterestLine = Product & {
  quantity: number;
  lineTotal: number;
};

export function StoreInterestDrawer({
  open,
  lang,
  lines,
  whatsappHref,
  onClose,
  onChangeQuantity,
  onRemove,
}: {
  open: boolean;
  lang: Lang;
  lines: InterestLine[];
  whatsappHref: string;
  onClose: () => void;
  onChangeQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
}) {
  const isEs = lang === "es";
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = "store-interest-title";

  useEffect(() => {
    if (!open) return;

    const previousActive =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    dialogRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousActive?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  const itemCount = lines.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label={isEs ? "Cerrar lista" : "Close list"}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col overflow-hidden rounded-t-[2rem] bg-[#F4F1EA] shadow-2xl md:inset-y-0 md:left-auto md:w-full md:max-w-md md:rounded-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#2E2A25]/10 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#0C766C]">
              {isEs ? "Solicitud sin cobro" : "No-charge request"}
            </p>
            <h2 id={titleId} className="mt-1 text-2xl font-black text-[#2E2A25]">
              {isEs ? "Mi lista de interés" : "My interest list"}
              {itemCount > 0 && (
                <span className="ml-2 text-base text-[#6C645B]">({itemCount})</span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEs ? "Cerrar lista" : "Close list"}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#2E2A25]/15 bg-white text-[#2E2A25] transition hover:bg-[#E7FAF6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08796D]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {lines.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[#2E2A25]/20 bg-white p-8 text-center">
              <ShoppingBag size={26} className="mx-auto text-[#08796D]" />
              <h3 className="mt-4 text-lg font-black text-[#2E2A25]">
                {isEs ? "Su lista está vacía" : "Your list is empty"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#5D564E]">
                {isEs
                  ? "Agregue las familias que le interesan y las revisamos juntos por WhatsApp."
                  : "Add the product families that interest you and we will review them together on WhatsApp."}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#2E2A25] px-5 text-sm font-black text-white"
              >
                {isEs ? "Seguir explorando" : "Keep browsing"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((item) => (
                <article
                  key={item.id}
                  className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 rounded-2xl border border-[#2E2A25]/10 bg-white p-3"
                >
                  <div className="relative h-[76px] overflow-hidden rounded-xl bg-[#DCD8D0]">
                    <Image src={item.image} alt="" fill sizes="76px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black leading-snug text-[#2E2A25]">
                          {item.name[lang]}
                        </h3>
                        <p className="mt-1 text-xs font-bold text-[#0C766C]">
                          {isEs ? "Detalles por confirmar" : "Details to confirm"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        aria-label={
                          isEs ? `Quitar ${item.name.es}` : `Remove ${item.name.en}`
                        }
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#6C645B] transition hover:bg-[#F4F1EA] hover:text-[#2E2A25]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="mt-2 inline-flex items-center rounded-full border border-[#2E2A25]/12 bg-[#F4F1EA]">
                      <button
                        type="button"
                        onClick={() => onChangeQuantity(item.id, -1)}
                        aria-label={
                          isEs
                            ? `Reducir cantidad de ${item.name.es}`
                            : `Decrease ${item.name.en} quantity`
                        }
                        className="grid h-9 w-9 place-items-center rounded-full text-[#2E2A25]"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="min-w-7 text-center text-sm font-black tabular-nums text-[#2E2A25]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onChangeQuantity(item.id, 1)}
                        aria-label={
                          isEs
                            ? `Aumentar cantidad de ${item.name.es}`
                            : `Increase ${item.name.en} quantity`
                        }
                        className="grid h-9 w-9 place-items-center rounded-full text-[#2E2A25]"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#2E2A25]/10 bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-5 sm:px-6">
          <p className="mb-4 text-xs font-semibold leading-5 text-[#5D564E]">
            {isEs
              ? "Enviar la lista no reserva inventario ni genera un cobro. El equipo confirma cada detalle antes de continuar."
              : "Sending this list does not reserve inventory or create a charge. The team confirms every detail before you continue."}
          </p>
          <a
            href={lines.length > 0 ? whatsappHref : undefined}
            target={lines.length > 0 ? "_blank" : undefined}
            rel={lines.length > 0 ? "noopener noreferrer" : undefined}
            aria-disabled={lines.length === 0}
            onClick={() =>
              lines.length > 0 &&
              trackStoreAction("interest_list_whatsapp_click", { items: itemCount })
            }
            className={`inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08796D] ${
              lines.length > 0
                ? "bg-[#25D366] text-[#052E16] hover:bg-[#39DF76]"
                : "pointer-events-none bg-[#D7D2CA] text-[#81786E]"
            }`}
          >
            <MessageCircle size={18} />
            {isEs ? "Enviar lista por WhatsApp" : "Send list on WhatsApp"}
          </a>
        </div>
      </div>
    </div>
  );
}
