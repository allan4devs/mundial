import type { KeyboardEvent, RefObject } from "react";
import { AlertCircle } from "lucide-react";
import {
  TravelerInputField,
  TravelerPhoneInput,
} from "@/components/reservation/ReservationFormFields";
import type { ReservationFormState } from "@/lib/reservation/types";

type ReservationTranslations = typeof import("@/lib/translations").translations["es"]["reservation"];

interface ReservationDetailsStep2Props {
  travelerSectionRef: RefObject<HTMLDivElement | null>;
  nameInputRef: RefObject<HTMLInputElement | null>;
  emailInputRef: RefObject<HTMLInputElement | null>;
  phoneInputRef: RefObject<HTMLInputElement | null>;
  isStep2Valid: boolean;
  formState: ReservationFormState;
  validation: {
    isNameValid: boolean;
    isEmailValid: boolean;
    isPhoneNumberValid: boolean;
  };
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneCodeChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onSpecialRequestsChange: (value: string) => void;
  onNameEnter: (event: KeyboardEvent<HTMLInputElement>) => void;
  onEmailEnter: (event: KeyboardEvent<HTMLInputElement>) => void;
  onPhoneEnter: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFieldBlur: (field: "name" | "email" | "phone" | "specialRequests" | "terms") => void;
  onBack?: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
  tr: ReservationTranslations;
  lang: "es" | "en";
}

export default function ReservationDetailsStep2({
  travelerSectionRef,
  nameInputRef,
  emailInputRef,
  phoneInputRef,
  isStep2Valid,
  formState,
  validation,
  onNameChange,
  onEmailChange,
  onPhoneCodeChange,
  onPhoneNumberChange,
  onSpecialRequestsChange,
  onNameEnter,
  onEmailEnter,
  onPhoneEnter,
  onFieldBlur,
  onBack,
  onContinue,
  canContinue,
  tr,
  lang,
}: ReservationDetailsStep2Props) {
  return (
    <>
      <div
        ref={travelerSectionRef}
        className={`mb-4 rounded-3xl border bg-white p-5 shadow-sm transition-all dark:bg-zinc-900/70 sm:p-7 ${
          !isStep2Valid
            ? "border-amber-300 ring-2 ring-amber-300/35 dark:border-amber-600"
            : "border-zinc-200 dark:border-zinc-700"
        }`}
      >
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#087d72] dark:text-[#66ddcf]">{lang === "es" ? "Paso 2 de 3" : "Step 2 of 3"}</p>
            <h3 className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-50 sm:text-3xl">{tr.travelerTitle}</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">{lang === "es" ? "Usaremos estos datos para coordinar su visita y enviar la confirmación." : "We use these details to coordinate your visit and send confirmation."}</p>
          </div>
          {isStep2Valid ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              {lang === "es" ? "Listo para revisar" : "Ready to review"}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden /> {tr.indicators.completeTravelerData}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TravelerInputField
            id="name"
            label={tr.fullName}
            value={formState.name}
            onChange={onNameChange}
            onBlur={() => onFieldBlur("name")}
            onKeyDown={onNameEnter}
            inputRef={nameInputRef}
            placeholder={tr.namePlaceholder}
            isValid={validation.isNameValid}
            validationMessage={tr.nameRequired}
            autoComplete="name"
            required
          />
          <TravelerInputField
            id="email"
            label={tr.emailLabel}
            type="email"
            value={formState.email}
            onChange={onEmailChange}
            onBlur={() => onFieldBlur("email")}
            onKeyDown={onEmailEnter}
            inputRef={emailInputRef}
            placeholder={tr.emailPlaceholder}
            isValid={validation.isEmailValid}
            validationMessage={tr.emailInvalid}
            autoComplete="email"
            inputMode="email"
            required
          />
          <TravelerPhoneInput
            phoneCode={formState.phoneCode}
            phoneNumber={formState.phoneNumber}
            setPhoneCode={onPhoneCodeChange}
            setPhoneNumber={onPhoneNumberChange}
            onBlur={() => onFieldBlur("phone")}
            onKeyDown={onPhoneEnter}
            inputRef={phoneInputRef}
            isValid={validation.isPhoneNumberValid}
            label={tr.phoneLabel}
            placeholder={tr.phonePlaceholder}
            validationMessage={tr.phoneInvalid}
          />
          <div className="md:col-span-2">
            <label htmlFor="specialRequests" className="mb-1.5 block text-sm font-bold text-zinc-800 dark:text-zinc-200">
              {lang === "es" ? "¿Necesitas algo extra?" : "Need anything extra?"}
              <span className="ml-2 text-xs font-normal text-zinc-500">
                {lang === "es" ? "opcional" : "optional"}
              </span>
            </label>
            <textarea
              id="specialRequests"
              value={formState.specialRequests}
              onChange={(event) => onSpecialRequestsChange(event.target.value)}
              onBlur={() => onFieldBlur("specialRequests")}
              rows={2}
              maxLength={2000}
              className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm font-semibold text-zinc-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              placeholder={
                lang === "es"
                  ? "Ej: transporte desde hotel, comida vegetariana, cumpleaños, guia privado, fotos..."
                  : "Ex: hotel pickup, vegetarian meal, birthday, private guide, photos..."
              }
            />
            <p className="mt-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {lang === "es"
                ? "Lo revisamos antes de confirmar si requiere costo adicional."
                : "We review it before confirmation if it requires an extra cost."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 hidden gap-2 md:flex">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200"
          >
            {lang === "es" ? "Volver" : "Back"}
          </button>
        )}
        {onContinue && (
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="flex-[2] rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {lang === "es" ? "Revisar y pagar" : "Review and pay"}
          </button>
        )}
      </div>
    </>
  );
}
