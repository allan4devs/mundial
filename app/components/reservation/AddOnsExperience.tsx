"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  ADDON_OPTIONS,
  TRANSPORT_DROPOFF_OPTIONS,
  TRANSPORT_PICKUP_OPTIONS,
} from "@/lib/reservation/constants";
import {
  FOOD_MEAL_OPTIONS,
  FOOD_PROTEIN_OPTIONS,
  getAddonPricePerPerson,
  getDefaultFoodDetails,
  getDefaultLodgingDetails,
  isFoodConfigComplete,
  isLodgingConfigComplete,
} from "@/lib/reservation/addons";
import {
  getDefaultTransportDetails,
  getTransportPerPersonPrice,
  isTransportConfigComplete,
  type TransportQuoteResult,
} from "@/lib/reservation/transport";
import type { AddOnOption, ReservationAddonDetails } from "@/lib/reservation/types";

type Lang = "es" | "en";

type AddOnsExperienceProps = {
  lang: Lang;
  selectedAddons: string[];
  addonDetails: ReservationAddonDetails;
  onAddonToggle?: (addonId: string) => void;
  onAddonDetailsChange?: (details: ReservationAddonDetails) => void;
  excludedAddonIds?: string[];
  defaultCollapsed?: boolean;
  transportQuote?: TransportQuoteResult | null;
  transportLoading?: boolean;
  transportError?: string | null;
  transportPreview?: boolean;
};

export default function AddOnsExperience({
  lang,
  selectedAddons,
  addonDetails,
  onAddonToggle,
  onAddonDetailsChange,
  excludedAddonIds = [],
  defaultCollapsed = true,
  transportQuote = null,
  transportLoading = false,
  transportError = null,
  transportPreview = false,
}: AddOnsExperienceProps) {
  const canSelect = Boolean(onAddonToggle);
  const [expanded, setExpanded] = useState(!defaultCollapsed);
  const [activeAddonId, setActiveAddonId] = useState<string | null>(null);
  const addonPriority = [
    "transporte",
    "almuerzo",
    "guia-privado",
    "fotos",
    "alojamiento",
    "video-aventura",
    "guia-naturalista",
    "celebracion",
    "itinerario-personalizado",
  ];
  const visibleAddons = ADDON_OPTIONS
    .filter((addon) => !excludedAddonIds.includes(addon.id))
    .sort((a, b) => addonPriority.indexOf(a.id) - addonPriority.indexOf(b.id));
  const activeAddon = useMemo(
    () => ADDON_OPTIONS.find((addon) => addon.id === activeAddonId) ?? null,
    [activeAddonId],
  );

  const updateDetails = (patch: ReservationAddonDetails) => {
    onAddonDetailsChange?.({ ...addonDetails, ...patch });
  };

  const openConfigurator = (addon: AddOnOption) => {
    if (addon.id === "transporte") {
      updateDetails({
        ...(!addonDetails.pickupLocation ? getDefaultTransportDetails() : {}),
        transportType: "private",
      });
    }
    if (addon.id === "alojamiento" && !addonDetails.lodgingType) {
      updateDetails(getDefaultLodgingDetails());
    }
    if (addon.id === "almuerzo" && !addonDetails.restaurantMeal) {
      updateDetails(getDefaultFoodDetails());
    }
    setActiveAddonId(addon.id);
  };

  const handleAddonAction = (addon: AddOnOption) => {
    const selected = selectedAddons.includes(addon.id);

    if (addon.configurable) {
      if (selected) {
        onAddonToggle?.(addon.id);
        return;
      }
      openConfigurator(addon);
      return;
    }

    onAddonToggle?.(addon.id);
  };

  if (visibleAddons.length === 0) return null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
      >
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500">
            {lang === "es" ? "Extras opcionales" : "Optional extras"}
          </p>
          <h3 className="mt-0.5 text-sm font-black text-zinc-900 dark:text-zinc-50">
            {lang === "es" ? "Transporte, hospedaje y más" : "Transport, lodging & more"}
            {selectedAddons.length > 0 && (
              <span className="ml-2 text-emerald-600">({selectedAddons.length})</span>
            )}
          </h3>
        </div>
        <span className="shrink-0 text-xs font-bold text-emerald-700">
          {expanded ? (lang === "es" ? "Ocultar" : "Hide") : (lang === "es" ? "Agregar" : "Add")}
        </span>
      </button>

      {expanded && (
      <div className="border-t border-zinc-200 px-4 pb-4 pt-3 dark:border-zinc-700 sm:px-5 sm:pb-5">
      <div className="mb-4 flex flex-col gap-2 rounded-xl bg-zinc-50 px-3 py-3 text-xs font-semibold text-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {lang === "es"
            ? "Agregá solo lo que necesitás. Las solicitudes por cotizar no se cobran en línea."
            : "Add only what you need. Quote requests are not charged online."}
        </span>
        <span className="shrink-0 text-[#087d72] dark:text-[#63e5d8]">
          {lang === "es" ? "Sin cargos ocultos" : "No hidden charges"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleAddons.map((addon) => {
          const selected = selectedAddons.includes(addon.id);
          const Icon = addon.icon;
          const name = lang === "es" ? addon.nameEs : addon.nameEn;
          const description = lang === "es" ? addon.descriptionEs : addon.descriptionEn;
          const priceDisplay = getAddonPriceDisplay({
            addon,
            lang,
            selected,
            addonDetails,
            transportQuote,
            transportLoading,
            transportPreview,
          });

          return (
            <article
              key={addon.id}
              data-addon-id={addon.id}
              className={`flex min-h-[168px] flex-col rounded-2xl border p-4 transition-colors ${
                selected
                  ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10 dark:bg-emerald-950/25"
                  : "border-zinc-200 bg-zinc-50 hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-950/35"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  selected ? "bg-emerald-500 text-white" : "bg-white text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                }`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                  addon.priceStatus === "fixed"
                    ? "border-[#00C4B0]/30 bg-[#00C4B0]/10 text-[#087d72] dark:text-[#63e5d8]"
                    : addon.priceStatus === "estimated"
                      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                      : "border-zinc-300 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                }`}>
                  {addon.priceStatus === "fixed"
                    ? (lang === "es" ? "Tarifa definida" : "Set rate")
                    : addon.priceStatus === "estimated"
                      ? (lang === "es" ? "Estimado" : "Estimate")
                      : (lang === "es" ? "Por cotizar" : "Request quote")}
                </span>
              </div>

              <div className="mt-4 flex-1">
                <h4 className="text-base font-black leading-tight text-zinc-950 dark:text-zinc-50">{name}</h4>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">{priceDisplay.note}</p>
                  <p className={`break-words text-xl font-black leading-tight ${priceDisplay.muted ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-950 dark:text-zinc-50"}`}>
                    {priceDisplay.value}
                  </p>
                </div>
                <div className="flex w-full flex-wrap gap-2">
                  {addon.configurable && canSelect ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openConfigurator(addon)}
                        className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-black text-white transition hover:bg-[#087d72] dark:bg-zinc-100 dark:text-zinc-950"
                        aria-label={lang === "es" ? `Configurar ${name}` : `Configure ${name}`}
                      >
                        {selected ? <Pencil className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                        {selected
                          ? (lang === "es" ? "Editar" : "Edit")
                          : (lang === "es" ? "Configurar" : "Configure")}
                      </button>
                      {selected && canSelect && (
                        <button
                          type="button"
                          onClick={() => onAddonToggle?.(addon.id)}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-300"
                          aria-label={lang === "es" ? `Quitar ${name}` : `Remove ${name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </>
                  ) : canSelect ? (
                    <button
                      type="button"
                      onClick={() => handleAddonAction(addon)}
                      aria-pressed={selected}
                      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition ${
                        selected
                          ? "border border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-300"
                          : "bg-zinc-950 text-white hover:bg-emerald-700 dark:bg-zinc-100 dark:text-zinc-950"
                      }`}
                    >
                      {selected ? <Trash2 className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                      {selected
                        ? (lang === "es" ? "Quitar" : "Remove")
                        : addon.priceStatus === "quote"
                          ? (lang === "es" ? "Solicitar" : "Request")
                          : (lang === "es" ? "Agregar" : "Add")}
                    </button>
                  ) : (
                    <Link
                      href="/reservar"
                      className="flex h-11 w-full items-center justify-center rounded-xl bg-zinc-950 px-3 text-sm font-black text-white transition hover:bg-[#087d72] dark:bg-zinc-100 dark:text-zinc-950"
                    >
                      {addon.priceStatus === "quote"
                        ? (lang === "es" ? "Solicitar" : "Request")
                        : (lang === "es" ? "Reservar" : "Book")}
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {activeAddon && (
        <AddonModal
          addon={activeAddon}
          lang={lang}
          details={addonDetails}
          updateDetails={updateDetails}
          close={() => setActiveAddonId(null)}
          selected={selectedAddons.includes(activeAddon.id)}
          canSelect={canSelect}
          transportQuote={transportQuote}
          transportLoading={transportLoading}
          transportError={transportError}
          onSelect={() => {
            if (!selectedAddons.includes(activeAddon.id)) {
              onAddonToggle?.(activeAddon.id);
            }
            setActiveAddonId(null);
          }}
        />
      )}
      </div>
      )}
    </section>
  );
}

function getAddonPriceDisplay({
  addon,
  lang,
  selected,
  addonDetails,
  transportQuote,
  transportLoading,
  transportPreview,
}: {
  addon: AddOnOption;
  lang: Lang;
  selected: boolean;
  addonDetails: ReservationAddonDetails;
  transportQuote: TransportQuoteResult | null;
  transportLoading: boolean;
  transportPreview: boolean;
}) {
  const priceNote = lang === "es" ? addon.priceNoteEs : addon.priceNoteEn;

  if (addon.priceStatus === "quote") {
    return {
      note: priceNote,
      value: lang === "es" ? "Por cotizar" : "Request quote",
      muted: true,
    };
  }

  if (addon.id === "alojamiento") {
    if (!isLodgingConfigComplete(addonDetails) && !selected) {
      return {
        note: lang === "es" ? "Configurá tipo y noches" : "Set type and nights",
        value: lang === "es" ? "Configurar" : "Configure",
        muted: true,
      };
    }

    const configuredPrice = getAddonPricePerPerson("alojamiento", addonDetails);
    const nights = addonDetails.lodgingNights ?? 1;
    return {
      note: `${priceNote} · ${nights} ${lang === "es" ? "noche(s)" : "night(s)"}`,
      value: `$${configuredPrice}`,
      muted: false,
    };
  }

  if (addon.id === "almuerzo") {
    if (!isFoodConfigComplete(addonDetails) && !selected) {
      return {
        note: lang === "es" ? "Elegí comida y proteína" : "Choose meal and protein",
        value: lang === "es" ? "Configurar" : "Configure",
        muted: true,
      };
    }

    return {
      note: priceNote,
      value: `$${getAddonPricePerPerson("almuerzo", addonDetails)}`,
      muted: false,
    };
  }

  if (addon.id !== "transporte") {
    return {
      note: priceNote,
      value: `$${addon.price}`,
      muted: false,
    };
  }

  const configured = isTransportConfigComplete(addonDetails);
  const showQuote = configured && (selected || transportPreview);

  if (!configured) {
    return {
      note: lang === "es" ? "Configurá pickup y drop-off" : "Set pickup and drop-off",
      value: lang === "es" ? "Configurar" : "Configure",
      muted: true,
    };
  }

  if (transportLoading && showQuote) {
    return {
      note: lang === "es" ? "Calculando ruta" : "Calculating route",
      value: "…",
      muted: true,
    };
  }

  if (showQuote && transportQuote) {
    const perPerson = getTransportPerPersonPrice(transportQuote, addon.price);
    return {
      note: `${priceNote} · ${transportQuote.distanceKm} km`,
      value: `$${perPerson}`,
      muted: false,
    };
  }

  return {
    note: lang === "es" ? "Precio según ruta" : "Price by route",
    value: lang === "es" ? "Configurar" : "Configure",
    muted: true,
  };
}

function AddonModal({
  addon,
  lang,
  details,
  updateDetails,
  close,
  selected,
  canSelect,
  onSelect,
  transportQuote,
  transportLoading,
  transportError,
}: {
  addon: AddOnOption;
  lang: Lang;
  details: ReservationAddonDetails;
  updateDetails: (patch: ReservationAddonDetails) => void;
  close: () => void;
  selected: boolean;
  canSelect: boolean;
  onSelect: () => void;
  transportQuote: TransportQuoteResult | null;
  transportLoading: boolean;
  transportError: string | null;
}) {
  const name = lang === "es" ? addon.nameEs : addon.nameEn;
  const transportConfigured = addon.id === "transporte" && isTransportConfigComplete(details);
  const transportReady = transportConfigured && Boolean(transportQuote) && !transportLoading && !transportError;
  const lodgingReady = addon.id !== "alojamiento" || isLodgingConfigComplete(details);
  const foodReady = addon.id !== "almuerzo" || isFoodConfigComplete(details);
  const canConfirmAddon = (addon.id !== "transporte" || transportReady) && lodgingReady && foodReady;
  const configuredPrice = getAddonPricePerPerson(addon.id, details, {
    transportPricePerPerson: transportQuote?.perPerson ?? null,
  });
  const transportPerPerson = transportQuote
    ? getTransportPerPersonPrice(transportQuote, addon.price)
    : getAddonPricePerPerson("transporte", details);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 p-3 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-white p-5 shadow-2xl dark:bg-zinc-950">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500">
              {lang === "es" ? "Configurar extra" : "Configure add-on"}
            </p>
            <h3 className="mt-1 text-2xl font-black text-zinc-950 dark:text-zinc-50">{name}</h3>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
            aria-label={lang === "es" ? "Cerrar" : "Close"}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {addon.id === "alojamiento" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <OptionSelect
              label={lang === "es" ? "Tipo" : "Type"}
              value={details.lodgingType ?? "cabin"}
              onChange={(value) => updateDetails({ lodgingType: value as ReservationAddonDetails["lodgingType"] })}
              options={[
                ["hostel", lang === "es" ? "Hostal" : "Hostel"],
                ["hotel", "Hotel"],
                ["cabin", lang === "es" ? "Cabina" : "Cabin"],
              ]}
            />
            <OptionSelect
              label={lang === "es" ? "Noches" : "Nights"}
              value={String(details.lodgingNights ?? 1)}
              onChange={(value) => updateDetails({ lodgingNights: Number(value) })}
              options={[["1", "1"], ["2", "2"], ["3", "3+"]]}
            />
            <TextInput
              className="sm:col-span-2"
              label={lang === "es" ? "Preferencia de cuarto" : "Room preference"}
              value={details.lodgingRoom ?? ""}
              onChange={(value) => updateDetails({ lodgingRoom: value })}
              placeholder={lang === "es" ? "Ej: matrimonial, dos camas, vista bosque" : "Ex: queen bed, two beds, forest view"}
            />
          </div>
        )}

        {addon.id === "almuerzo" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <OptionSelect
              label={lang === "es" ? "Comida" : "Meal"}
              value={details.restaurantMeal ?? FOOD_MEAL_OPTIONS[0]}
              onChange={(value) => updateDetails({ restaurantMeal: value })}
              options={FOOD_MEAL_OPTIONS.map((option) => [option, option])}
            />
            <OptionSelect
              label={lang === "es" ? "Proteína" : "Protein"}
              value={details.restaurantProtein ?? FOOD_PROTEIN_OPTIONS[0]}
              onChange={(value) => updateDetails({ restaurantProtein: value })}
              options={FOOD_PROTEIN_OPTIONS.map((option) => [option, option])}
            />
            <TextInput
              className="sm:col-span-2"
              label={lang === "es" ? "Notas de comida" : "Food notes"}
              value={details.restaurantNotes ?? ""}
              onChange={(value) => updateDetails({ restaurantNotes: value })}
              placeholder={lang === "es" ? "Alergias, sin gluten, cumpleaños, etc." : "Allergies, gluten-free, birthday, etc."}
            />
          </div>
        )}

        {addon.id === "transporte" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200 sm:col-span-2">
              <MapPin className="mb-1 h-4 w-4" aria-hidden />
              {lang === "es"
                ? "Asignamos carro para 1–4 personas o buseta para 5–15, según el grupo."
                : "We assign a car for 1–4 guests or a minibus for 5–15."}
            </div>
            <OptionSelect
              label={lang === "es" ? "Pickup" : "Pickup"}
              value={details.pickupLocation ?? TRANSPORT_PICKUP_OPTIONS[0].id}
              onChange={(value) => updateDetails({ pickupLocation: value })}
              options={TRANSPORT_PICKUP_OPTIONS.map((option) => [
                option.id,
                lang === "es" ? option.labelEs : option.labelEn,
              ])}
            />
            <OptionSelect
              label={lang === "es" ? "Drop-off" : "Drop-off"}
              value={details.dropoffLocation ?? TRANSPORT_DROPOFF_OPTIONS[0].id}
              onChange={(value) => updateDetails({ dropoffLocation: value })}
              options={TRANSPORT_DROPOFF_OPTIONS.map((option) => [
                option.id,
                lang === "es" ? option.labelEs : option.labelEn,
              ])}
            />
            <TextInput
              className="sm:col-span-2"
              label={lang === "es" ? "Notas de transporte" : "Transport notes"}
              value={details.transportNotes ?? ""}
              onChange={(value) => updateDetails({ transportNotes: value })}
              placeholder={lang === "es" ? "Nombre del hotel, vuelo, hora ideal..." : "Hotel name, flight, ideal time..."}
            />
          </div>
        )}

        {addon.configurable && (
          <AddonPricePreview
            addon={addon}
            lang={lang}
            configuredPrice={configuredPrice}
            transportQuote={transportQuote}
            transportPerPerson={transportPerPerson}
            transportLoading={transportLoading}
            transportError={transportError}
            transportReady={transportReady}
            transportConfigured={transportConfigured}
            details={details}
          />
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="min-h-11 rounded-xl border border-zinc-300 px-5 py-2 font-bold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            {lang === "es" ? "Cerrar" : "Close"}
          </button>
          {canSelect ? (
            <button
              type="button"
              onClick={onSelect}
              disabled={!canConfirmAddon}
              className="min-h-11 rounded-xl bg-emerald-600 px-5 py-2 font-black text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selected
                ? (lang === "es" ? "Guardar cambios" : "Save changes")
                : addon.priceStatus === "fixed"
                  ? (lang === "es" ? "Agregar extra" : "Add extra")
                  : (lang === "es" ? "Agregar estimación" : "Add estimate")}
            </button>
          ) : (
            <Link
              href="/reservar"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 py-2 font-black text-white hover:bg-emerald-500"
            >
              {lang === "es" ? "Reservar con este extra" : "Book with this add-on"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function AddonPricePreview({
  addon,
  lang,
  configuredPrice,
  transportQuote,
  transportPerPerson,
  transportLoading,
  transportError,
  transportReady,
  transportConfigured,
  details,
}: {
  addon: AddOnOption;
  lang: Lang;
  configuredPrice: number;
  transportQuote: TransportQuoteResult | null;
  transportPerPerson: number;
  transportLoading: boolean;
  transportError: string | null;
  transportReady: boolean;
  transportConfigured: boolean;
  details: ReservationAddonDetails;
}) {
  if (addon.id === "transporte") {
    return (
      <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
          {lang === "es" ? "Precio estimado" : "Estimated price"}
        </p>
        {transportLoading && (
          <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            {lang === "es" ? "Calculando ruta segura..." : "Calculating safe route..."}
          </p>
        )}
        {transportError && (
          <p className="mt-2 text-sm font-semibold text-red-600">{transportError}</p>
        )}
        {transportReady && transportQuote && (
          <div className="mt-2 space-y-1">
            <p className="text-3xl font-black text-zinc-950 dark:text-zinc-50">
              ${transportPerPerson}
              <span className="ml-2 text-sm font-bold text-zinc-500">
                / {lang === "es" ? "persona" : "person"}
              </span>
            </p>
            <p className="text-sm font-medium text-zinc-500">
              {transportQuote.distanceKm} km · {transportQuote.type === "private"
                ? (lang === "es" ? `Total vehículo $${transportQuote.total}` : `Vehicle total $${transportQuote.total}`)
                : (lang === "es" ? "Traslado compartido" : "Shared shuttle")}
            </p>
            <p className="pt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
              {lang === "es"
                ? "Estimación sujeta a confirmación con Allan o Verónica."
                : "Estimate subject to confirmation with Allan or Verónica."}
            </p>
          </div>
        )}
        {transportConfigured && !transportLoading && !transportQuote && !transportError && (
          <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            {lang === "es" ? "Seleccioná pickup y drop-off para ver el precio." : "Select pickup and drop-off to see the price."}
          </p>
        )}
      </div>
    );
  }

  if (addon.id === "alojamiento" && isLodgingConfigComplete(details)) {
    return (
      <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
          {addon.priceStatus === "fixed"
            ? (lang === "es" ? "Tarifa definida" : "Set rate")
            : (lang === "es" ? "Precio estimado" : "Estimated price")}
        </p>
        <p className="mt-2 text-3xl font-black text-zinc-950 dark:text-zinc-50">
          ${configuredPrice}
          <span className="ml-2 text-sm font-bold text-zinc-500">/ {lang === "es" ? "persona" : "person"}</span>
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-500">
          {details.lodgingNights ?? 1} {lang === "es" ? "noche(s)" : "night(s)"} · {details.lodgingType}
        </p>
        <p className="pt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
          {lang === "es"
            ? "Estimación sujeta a confirmación con Allan o Verónica."
            : "Estimate subject to confirmation with Allan or Verónica."}
        </p>
      </div>
    );
  }

  if (addon.id === "almuerzo" && isFoodConfigComplete(details)) {
    return (
      <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
          {addon.priceStatus === "fixed"
            ? (lang === "es" ? "Tarifa definida" : "Set rate")
            : (lang === "es" ? "Precio estimado" : "Estimated price")}
        </p>
        <p className="mt-2 text-3xl font-black text-zinc-950 dark:text-zinc-50">
          ${configuredPrice}
          <span className="ml-2 text-sm font-bold text-zinc-500">/ {lang === "es" ? "persona" : "person"}</span>
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-500">
          {details.restaurantMeal} · {details.restaurantProtein}
        </p>
      </div>
    );
  }

  return null;
}

function OptionSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-zinc-700 dark:text-zinc-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 font-semibold text-zinc-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-black text-zinc-700 dark:text-zinc-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 font-semibold text-zinc-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
    </label>
  );
}
