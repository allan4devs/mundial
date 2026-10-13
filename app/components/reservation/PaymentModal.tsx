"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { translations } from "@/lib/translations";
import type { PaymentModalProps } from "@/lib/types/index";
import PaymentCheckoutContent from "@/app/components/reservation/PaymentCheckoutContent";

export default function PaymentModal({
  orderDetails,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const { lang } = useLanguage();
  const tr = translations[lang].payment;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const focusModal = () => {
      modalRef.current?.focus();
      modalRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const animationFrame = window.requestAnimationFrame(focusModal);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedElementRef.current?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6 md:p-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        tabIndex={-1}
        className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"
          aria-label={tr.closeLabel}
        >
          &times;
        </button>

        <div className="mb-6 pr-8">
          <h2 id="payment-modal-title" className="text-2xl sm:text-3xl font-bold">
            {tr.title}
          </h2>
        </div>

        <PaymentCheckoutContent orderDetails={orderDetails} onSuccess={onSuccess} />
      </div>
    </div>
  );
}
