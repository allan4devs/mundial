"use client";

import { useState, useMemo, useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLanguage } from "@/lib/LanguageContext";
import { translations } from "@/lib/translations";
import { MapPin, ShieldCheck } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { TOUR_INFO } from "@/lib/tour-info";
import {
  ADDON_OPTIONS,
  DEFAULT_DEPARTURE_TIMES,
  RESERVATION_TRAVELER_DRAFT_KEY,
  formatDepartureLabel,
  getTransportLocationLabel,
} from "@/lib/reservation/constants";
import {
  buildAddonsBreakdown,
  getAddonsPricePerPerson,
  validateSelectedAddons,
} from "@/lib/reservation/addons";
import { isTransportConfigComplete } from "@/lib/reservation/transport";
import {
  getExcludedAddonIds,
  getPackageDepartureTimes,
  getPackageDisplayName,
  getPackageId,
  getTourPackageOptions,
  resolveInitialPackage,
  resolveRecommendedPackage,
} from "@/lib/reservation/pricing";
import { isPackageAvailableOnDate } from "@/lib/tour-packages";
import ReservationDetailsStepProgress from "./ReservationDetailsStepProgress";
import ReservationDetailsStep3 from "./ReservationDetailsStep3";
import BookingStickyBar from "./BookingStickyBar";
import type {
  TourTime,
  BookingStepId,
  ReservationDetailsProps,
  ReservationAddonDetails,
} from "@/lib/reservation/types";
import useReservationForm from "../../hooks/useReservationForm";
import { PHONE_COUNTRIES as ALL_PHONE_COUNTRIES } from "@/app/components/reservation/phoneCountries";
import { resolveSelectedTourSlug, getDefaultMainTourInfo } from "./reservationDetails.helpers";
import ReservationDetailsStep1Guided, { type ChoiceStep } from "./ReservationDetailsStep1Guided";
import ReservationDetailsStep2 from "./ReservationDetailsStep2";
import type { MainTourInfo, TourPackageOption } from "@/lib/types/index";
import { useTransportQuote } from "./hooks/useTransportQuote";
import {
  AI_BOOKING_HANDOFF_KEY,
  AI_BOOKING_HANDOFF_VERSION,
  type AIBookingHandoff,
} from "@/lib/ai-assistant/shared";

// ---------------------- MAIN COMPONENT ----------------------

export default function ReservationDetails({
  selectedDate,
  currentMonth,
  tickets,
  setTickets,
  onReserve,
  availability,
  currentYear,
  tourInfo,
  tours,
  initialSelectedTourSlug,
  initialSelectedPackageId,
  hasPreselectedTour = false,
  ivaRatePercent = 13,
}: ReservationDetailsProps) {
  const { lang } = useLanguage();
  const tr = translations[lang].reservation;
  const dateLocale = lang === "es" ? es : enUS;
  const [selectedTourInfo, setSelectedTourInfo] = useState<{ slug: string; tour: MainTourInfo } | null>(null);
  const slots = availability[selectedDate] ?? 0;
  const isTicketsValid = Number.isInteger(tickets) && tickets >= 1 && tickets <= slots;

  const reservationDate = new Date(currentYear, currentMonth, selectedDate);
  const reservationDateIso = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
  const formattedDate = format(
    reservationDate,
    lang === "es" ? "EEEE, dd 'de' MMMM 'de' yyyy" : "EEEE, MMMM dd, yyyy",
    { locale: dateLocale }
  );

  const [tourTime, setTourTime] = useState<TourTime | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [addonDetails, setAddonDetails] = useState<ReservationAddonDetails>({});
  const transportQuoteEnabled = isTransportConfigComplete(addonDetails);
  const { transportQuote, transportLoading, transportError } = useTransportQuote({
    enabled: transportQuoteEnabled,
    addonDetails,
    tickets,
  });
  const [currentStep, setCurrentStep] = useState<BookingStepId>(1);
  const [choiceStep, setChoiceStep] = useState<ChoiceStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitInFlightRef = useRef(false);
  const currentStepRef = useRef<BookingStepId>(1);
  const stepEnteredAtRef = useRef(0);
  const completedStepsRef = useRef<Set<BookingStepId>>(new Set());
  const nextStepFocusRef = useRef<BookingStepId | null>(null);
  const step1FieldFocusRef = useRef<"schedule" | "tickets" | null>(null);
  const scheduleSectionRef = useRef<HTMLElement | null>(null);
  const ticketsInputRef = useRef<HTMLInputElement | null>(null);
  const travelerSectionRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const reviewSectionRef = useRef<HTMLDivElement | null>(null);
  const termsCheckboxRef = useRef<HTMLInputElement | null>(null);

  const selectedTourSlug = resolveSelectedTourSlug(tours, null, initialSelectedTourSlug);
  const selectedTour = tours.find((tour) => tour.slug === selectedTourSlug) ?? tours[0] ?? null;
  const packageOptions = useMemo(() => getTourPackageOptions(selectedTour), [selectedTour]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [hasConfirmedPackage, setHasConfirmedPackage] = useState(false);
  const [hasConfirmedTime, setHasConfirmedTime] = useState(false);
  const [hasConfirmedTickets, setHasConfirmedTickets] = useState(false);
  const selectedPackage = useMemo(
    () => packageOptions.find((pkg) => pkg.id === selectedPackageId) ?? packageOptions[0] ?? null,
    [packageOptions, selectedPackageId],
  );
  const excludedAddonIds = useMemo(
    () => getExcludedAddonIds(selectedPackage),
    [selectedPackage],
  );
  const packageLabel = selectedPackage
    ? getPackageDisplayName(selectedPackage, lang === "es")
    : lang === "es" ? "Entrada General" : "General Entry";
  const packagePriceUSD = selectedPackage?.price ?? 30;
  const selectedTourName = selectedTour ? (lang === "es" ? selectedTour.titleEs : selectedTour.titleEn) : (lang === "es" ? "Tour" : "Tour");
  const selectedTourDescription = selectedTour
    ? (lang === "es" ? selectedTour.descriptionEs : selectedTour.descriptionEn) ?? selectedTour.descriptionEs ?? selectedTour.descriptionEn ?? ""
    : "";
  const selectedTourFallbackInfo = useMemo<MainTourInfo | null>(() => {
    if (!selectedTour) return null;

    const priceLabel = typeof selectedTour.priceCRC === "number"
      ? new Intl.NumberFormat("es-CR", {
          style: "currency",
          currency: "CRC",
          maximumFractionDigits: 0,
        }).format(selectedTour.priceCRC)
      : "";

    return {
      name: selectedTourName,
      operator: TOUR_INFO.operator,
      duration: selectedTour.duration ?? "",
      price: priceLabel,
      location: selectedTour.location ?? "",
      inclusions: selectedTour.inclusions ?? [],
      exclusions: selectedTour.exclusions ?? [],
      cancellationPolicy: selectedTour.cancellationPolicy ?? "",
      details: selectedTourDescription,
      restrictions: selectedTour.restrictions ?? "",
      contact: TOUR_INFO.contact,
    };
  }, [selectedTour, selectedTourDescription, selectedTourName]);
  const defaultMainTourInfo: MainTourInfo = getDefaultMainTourInfo();
  const apiSelectedTourInfo = selectedTourInfo?.slug === selectedTourSlug ? selectedTourInfo.tour : null;
  const resolvedTourInfo: MainTourInfo = apiSelectedTourInfo
    ? {
        ...(selectedTourFallbackInfo ?? tourInfo ?? defaultMainTourInfo),
        ...apiSelectedTourInfo,
        duration: apiSelectedTourInfo.duration || selectedTourFallbackInfo?.duration || tourInfo?.duration || defaultMainTourInfo.duration,
        price: apiSelectedTourInfo.price || selectedTourFallbackInfo?.price || tourInfo?.price || defaultMainTourInfo.price,
        location: apiSelectedTourInfo.location || selectedTourFallbackInfo?.location || tourInfo?.location || defaultMainTourInfo.location,
        inclusions: apiSelectedTourInfo.inclusions.length > 0 ? apiSelectedTourInfo.inclusions : selectedTourFallbackInfo?.inclusions ?? tourInfo?.inclusions ?? defaultMainTourInfo.inclusions,
        exclusions: apiSelectedTourInfo.exclusions.length > 0 ? apiSelectedTourInfo.exclusions : selectedTourFallbackInfo?.exclusions ?? tourInfo?.exclusions ?? defaultMainTourInfo.exclusions,
        cancellationPolicy: apiSelectedTourInfo.cancellationPolicy || selectedTourFallbackInfo?.cancellationPolicy || tourInfo?.cancellationPolicy || defaultMainTourInfo.cancellationPolicy,
        details: apiSelectedTourInfo.details || selectedTourFallbackInfo?.details || tourInfo?.details || defaultMainTourInfo.details,
        restrictions: apiSelectedTourInfo.restrictions || selectedTourFallbackInfo?.restrictions || tourInfo?.restrictions || defaultMainTourInfo.restrictions,
        contact: apiSelectedTourInfo.contact ?? selectedTourFallbackInfo?.contact ?? tourInfo?.contact ?? defaultMainTourInfo.contact,
      }
    : selectedTourFallbackInfo ?? (tourInfo ? { ...defaultMainTourInfo, ...tourInfo, cancellationPolicy: tourInfo.cancellationPolicy ?? defaultMainTourInfo.cancellationPolicy } : defaultMainTourInfo);

  const availableTimeSlots = useMemo(() => {
    const fromPackage = getPackageDepartureTimes(selectedPackage);
    if (fromPackage.length > 0) return fromPackage;
    return DEFAULT_DEPARTURE_TIMES;
  }, [selectedPackage]);

  const isPackageDisabled = useCallback(
    (pkg: TourPackageOption) => !isPackageAvailableOnDate(pkg, reservationDateIso),
    [reservationDateIso],
  );

  useEffect(() => {
    // Prefer URL package, else recommended “popular” package for zero-decision booking.
    const packageFromUrl = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("package")
      : null;
    const requestedPackageId = packageFromUrl || initialSelectedPackageId;
    if (requestedPackageId) {
      const preferred = resolveInitialPackage(packageOptions, requestedPackageId);
      setSelectedPackageId(getPackageId(preferred));
      return;
    }
    const recommended = resolveRecommendedPackage(packageOptions, isPackageDisabled);
    const fallback = resolveInitialPackage(packageOptions, null);
    setSelectedPackageId(getPackageId(recommended ?? fallback));
  }, [selectedTourSlug, packageOptions, initialSelectedPackageId, isPackageDisabled]);

  // If the current package is closed for the chosen day, jump to recommended open one.
  useEffect(() => {
    if (packageOptions.length === 0 || !selectedPackageId) return;
    const current = packageOptions.find((pkg) => getPackageId(pkg) === selectedPackageId) ?? null;
    if (current && !isPackageDisabled(current)) return;

    const recommended = resolveRecommendedPackage(packageOptions, isPackageDisabled);
    if (recommended) {
      setSelectedPackageId(getPackageId(recommended));
      return;
    }
    const firstOpen = packageOptions.find((pkg) => !isPackageDisabled(pkg));
    if (firstOpen) setSelectedPackageId(getPackageId(firstOpen));
  }, [isPackageDisabled, packageOptions, selectedPackageId]);

  useEffect(() => {
    setSelectedAddons((current) => current.filter((id) => !excludedAddonIds.includes(id)));
  }, [excludedAddonIds]);

  useEffect(() => {
    if (tourTime && !availableTimeSlots.includes(tourTime)) {
      setTourTime(null);
    }
  }, [availableTimeSlots, tourTime]);

  // Keep shareable booking URL in sync with live selections (date / pax / package).
  useEffect(() => {
    if (typeof window === "undefined" || !selectedTourSlug || !selectedPackageId) return;

    const url = new URL(window.location.href);
    url.searchParams.set("tour", selectedTourSlug);
    url.searchParams.set("date", reservationDateIso);
    if (tickets > 1) url.searchParams.set("pax", String(tickets));
    else url.searchParams.delete("pax");
    url.searchParams.set("package", selectedPackageId);

    const next = `${url.pathname}${url.search}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState({}, "", next);
    }
  }, [reservationDateIso, selectedPackageId, selectedTourSlug, tickets]);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/tours/main?slug=${encodeURIComponent(selectedTourSlug)}`)
      .then((response) => response.json())
      .then((data) => {
        if (isMounted && data?.tour) {
          setSelectedTourInfo({ slug: selectedTourSlug, tour: data.tour as MainTourInfo });
        }
      })
      .catch(() => {
        if (isMounted && tourInfo && !selectedTourFallbackInfo) {
          setSelectedTourInfo({ slug: selectedTourSlug, tour: tourInfo });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTourSlug, selectedTourFallbackInfo, tourInfo]);

  const seemsSpanish = useCallback((value?: string) => {
    if (!value) return false;
    return /[áéíóúñ]|\b(entrada|guía|recorrido|cañón|horas|cancelación|solo|adultos|incluye)\b/i.test(value);
  }, []);

  const localizedCancellationPolicy = useMemo(() => {
    if (lang === "es") {
      return resolvedTourInfo.cancellationPolicy || tr.defaultCancellationPolicy;
    }

    if (!seemsSpanish(resolvedTourInfo.cancellationPolicy)) {
      return resolvedTourInfo.cancellationPolicy || tr.defaultCancellationPolicy;
    }

    return tr.defaultCancellationPolicy;
  }, [lang, resolvedTourInfo.cancellationPolicy, seemsSpanish, tr.defaultCancellationPolicy]);

  const addonsPricePerPerson = useMemo(() => {
    return getAddonsPricePerPerson(selectedAddons, addonDetails, {
      transportPricePerPerson: transportQuote?.perPerson ?? null,
    });
  }, [selectedAddons, addonDetails, transportQuote]);

  const addonsBreakdown = useMemo(
    () => buildAddonsBreakdown(selectedAddons, addonDetails, {
      transportPricePerPerson: transportQuote?.perPerson ?? null,
    }),
    [selectedAddons, addonDetails, transportQuote],
  );

  const addonDetailsSummary = useMemo(() => {
    const lines: string[] = [];

    if (selectedAddons.includes("alojamiento")) {
      lines.push([
        lang === "es" ? "Hospedaje" : "Lodging",
        addonDetails.lodgingType,
        addonDetails.lodgingNights ? `${addonDetails.lodgingNights} night(s)` : null,
        addonDetails.lodgingRoom,
      ].filter(Boolean).join(": "));
    }

    if (selectedAddons.includes("almuerzo")) {
      lines.push([
        lang === "es" ? "Restaurante" : "Restaurant",
        addonDetails.restaurantMeal,
        addonDetails.restaurantProtein,
        addonDetails.restaurantNotes,
      ].filter(Boolean).join(": "));
    }

    if (selectedAddons.includes("transporte")) {
      lines.push([
        lang === "es" ? "Transporte" : "Transport",
        addonDetails.transportType === "private"
          ? (lang === "es" ? "Privado 4x4" : "Private 4x4")
          : addonDetails.transportType === "shared"
            ? (lang === "es" ? "Compartido" : "Shared shuttle")
            : null,
        addonDetails.pickupLocation
          ? `${lang === "es" ? "Pickup" : "Pickup"}: ${getTransportLocationLabel(addonDetails.pickupLocation, lang)}`
          : null,
        addonDetails.dropoffLocation
          ? `${lang === "es" ? "Drop-off" : "Drop-off"}: ${getTransportLocationLabel(addonDetails.dropoffLocation, lang)}`
          : null,
        addonDetails.transportNotes,
      ].filter(Boolean).join(" | "));
    }

    return lines.filter((line) => line.includes(":")).join(" | ");
  }, [addonDetails, lang, selectedAddons]);

  const pricePerPerson = packagePriceUSD + addonsPricePerPerson;

  const { subtotalRaw, taxesRaw, totalWithTaxesRaw } = useMemo(() => {
    const safeTickets = Number.isFinite(tickets) ? Math.max(0, tickets) : 0;
    const sub = safeTickets * pricePerPerson;
    const normalizedTaxRate = Number.isFinite(ivaRatePercent)
      ? Math.max(0, ivaRatePercent) / 100
      : 0;
    const tax = sub * normalizedTaxRate;
    return { subtotalRaw: sub, taxesRaw: tax, totalWithTaxesRaw: sub + tax };
  }, [tickets, pricePerPerson, ivaRatePercent]);

  const subtotal = Number.isFinite(subtotalRaw) ? subtotalRaw : 0;
  const taxes = Number.isFinite(taxesRaw) ? taxesRaw : 0;
  const totalWithTaxes = Number.isFinite(totalWithTaxesRaw) ? totalWithTaxesRaw : 0;

  const { formState, isHydrated: isTravelerDraftHydrated, setFormState, handleChange, validation } = useReservationForm(
    {
      name: "",
      email: "",
      phoneCode: ALL_PHONE_COUNTRIES[0]?.code ?? "+506",
      phoneNumber: "",
      specialRequests: "",
      agreeTerms: false,
    },
    { storageKey: RESERVATION_TRAVELER_DRAFT_KEY },
  );
  const previousReservationDateRef = useRef(reservationDateIso);
  const hasPrefilledProfileRef = useRef(false);
  const hasAppliedPrefillRef = useRef(false);
  const hasResumedProgressRef = useRef(false);

  useEffect(() => {
    if (hasAppliedPrefillRef.current || !isTravelerDraftHydrated || availableTimeSlots.length === 0) return;

    try {
      const params = new URLSearchParams(window.location.search);
      const raw = sessionStorage.getItem(AI_BOOKING_HANDOFF_KEY);
      const parsedHandoff = raw ? JSON.parse(raw) as AIBookingHandoff : null;
      const handoff = parsedHandoff?.version === AI_BOOKING_HANDOFF_VERSION && parsedHandoff.state
        ? parsedHandoff
        : null;
      if (raw && !handoff) {
        sessionStorage.removeItem(AI_BOOKING_HANDOFF_KEY);
      }

      const requestedTime = (params.get("time") ?? params.get("tourTime") ?? handoff?.state.tourTime ?? "").trim();
      if (requestedTime && availableTimeSlots.includes(requestedTime)) {
        setTourTime(requestedTime);
      }

      const requestedPhone = (params.get("phone") ?? handoff?.state.phone ?? "").trim();
      const requestedPhoneNumber = (params.get("phoneNumber") ?? "").trim();
      const phoneMatch = requestedPhone.match(/^(\+\d{1,4})[\s-]*(.*)$/);
      const requestedAddonIds = (params.get("addons") ?? params.get("addonIds") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter((value) => ADDON_OPTIONS.some((addon) => addon.id === value));
      if (requestedAddonIds.length > 0) setSelectedAddons(requestedAddonIds);

      const addonDetailsParam = params.get("addonDetails");
      if (addonDetailsParam) {
        try {
          const parsedDetails = JSON.parse(addonDetailsParam) as ReservationAddonDetails;
          if (parsedDetails && typeof parsedDetails === "object") setAddonDetails(parsedDetails);
        } catch {
          // Ignore malformed optional add-on data and keep the configurator usable.
        }
      }

      setFormState((current) => ({
        ...current,
        name: params.get("name")?.trim() || current.name || handoff?.state.name || "",
        email: params.get("email")?.trim() || current.email || handoff?.state.email || "",
        phoneCode: params.get("phoneCode")?.trim() || phoneMatch?.[1] || current.phoneCode,
        phoneNumber: requestedPhoneNumber || phoneMatch?.[2] || requestedPhone || current.phoneNumber,
        specialRequests: params.get("specialRequests")?.trim() || current.specialRequests || handoff?.state.specialRequests || "",
        // Terms always require an explicit action in this page. Never trust a URL.
        agreeTerms: false,
      }));
      if (raw) sessionStorage.removeItem(AI_BOOKING_HANDOFF_KEY);
      hasAppliedPrefillRef.current = true;
    } catch {
      sessionStorage.removeItem(AI_BOOKING_HANDOFF_KEY);
      hasAppliedPrefillRef.current = true;
    }
  }, [availableTimeSlots, isTravelerDraftHydrated, setFormState]);

  useEffect(() => {
    if (previousReservationDateRef.current === reservationDateIso) return;
    previousReservationDateRef.current = reservationDateIso;
    completedStepsRef.current.clear();
    nextStepFocusRef.current = null;
    setCurrentStep(1);
    setChoiceStep(1);
    setTourTime(null);
    setHasConfirmedPackage(false);
    setHasConfirmedTime(false);
    setHasConfirmedTickets(false);
    handleChange("agreeTerms", false);
  }, [handleChange, reservationDateIso]);

  // Prefill traveler fields from profile when logged in — never overwrite typed draft values.
  useEffect(() => {
    if (hasPrefilledProfileRef.current) return;
    hasPrefilledProfileRef.current = true;

    let cancelled = false;

    fetch("/api/user/profile")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        const profile = data?.profile as { name?: string; email?: string; phone?: string } | undefined;
        if (!profile) return;

        setFormState((prev) => {
          const next = {
            ...prev,
            name: prev.name.trim() ? prev.name : (profile.name ?? prev.name),
            email: prev.email.trim() ? prev.email : (profile.email ?? prev.email),
          };

          if (prev.phoneNumber.trim() || !profile.phone?.trim()) return next;

          const normalizedPhone = profile.phone.trim();
          const matchedCode = ALL_PHONE_COUNTRIES.find((country) =>
            normalizedPhone.startsWith(country.code),
          );

          if (matchedCode) {
            return {
              ...next,
              phoneCode: matchedCode.code,
              phoneNumber: normalizedPhone.slice(matchedCode.code.length).trim(),
            };
          }

          return { ...next, phoneNumber: normalizedPhone };
        });
      })
      .catch(() => {
        // Guest or offline: draft/session storage still handles continuity.
      });

    return () => {
      cancelled = true;
    };
  }, [setFormState]);

  const isStep1Valid =
    isTicketsValid &&
    tourTime !== null &&
    hasConfirmedPackage &&
    hasConfirmedTime &&
    hasConfirmedTickets &&
    Boolean(selectedTour) &&
    Boolean(selectedPackage) &&
    !isPackageDisabled(selectedPackage);
  const isStep2Valid = validation.isNameValid && validation.isEmailValid && validation.isPhoneNumberValid;

  const missingStep1Items = useMemo(() => {
    const missing: string[] = [];

    if (!tourTime) missing.push(tr.missing.time);
    if (!selectedTour) missing.push(lang === "es" ? "Elegir un tour." : "Choose a tour.");
    if (!isTicketsValid) missing.push(tr.missing.tickets);

    return missing;
  }, [tourTime, isTicketsValid, selectedTour, tr.missing, lang]);

  const missingStep2Items = useMemo(() => {
    const missing: string[] = [];

    if (!validation.isNameValid) missing.push(tr.missing.name);
    if (!validation.isEmailValid) missing.push(tr.missing.email);
    if (!validation.isPhoneNumberValid) missing.push(tr.missing.phone);

    return missing;
  }, [validation.isNameValid, validation.isEmailValid, validation.isPhoneNumberValid, tr.missing]);

  const isFormValid = useMemo(
    () => isStep1Valid && isStep2Valid && validation.isAgreeTermsValid,
    [isStep1Valid, isStep2Valid, validation.isAgreeTermsValid]
  );

  const stepLabels = useMemo<Record<BookingStepId, string>>(() => ({
    1: "schedule",
    2: "traveler_details",
    3: "review",
  }), []);

  useEffect(() => {
    if (stepEnteredAtRef.current === 0) {
      stepEnteredAtRef.current = Date.now();
    }
  }, []);

  const missingStep1Keys = useMemo(() => {
    const missing: string[] = [];

    if (!tourTime) missing.push("tour_time");
    if (!selectedTour) missing.push("tour");
    if (!isTicketsValid) missing.push("tickets");

    return missing;
  }, [tourTime, isTicketsValid, selectedTour]);

  const missingStep2Keys = useMemo(() => {
    const missing: string[] = [];

    if (!validation.isNameValid) missing.push("name");
    if (!validation.isEmailValid) missing.push("email");
    if (!validation.isPhoneNumberValid) missing.push("phone");

    return missing;
  }, [validation.isNameValid, validation.isEmailValid, validation.isPhoneNumberValid]);

  const getMissingKeysForStep = useCallback((step: BookingStepId) => {
    if (step === 1) return missingStep1Keys;
    if (step === 2) return missingStep2Keys;
    return validation.isAgreeTermsValid ? [] : ["terms"];
  }, [missingStep1Keys, missingStep2Keys, validation.isAgreeTermsValid]);

  const getAnalyticsBookingSnapshot = useCallback(() => ({
    hasPreselectedTour,
    selectedTourSlug: selectedTour?.slug ?? null,
    selectedTourName,
    selectedDate,
    currentMonth,
    currentYear,
    tickets,
    slots,
    hasSelectedTime: Boolean(tourTime),
    selectedTime: tourTime,
    selectedAddons,
    addonDetails,
    addonDetailsSummary,
    addonsPricePerPerson,
    pricePerPerson,
    subtotal: subtotalRaw,
    taxes: taxesRaw,
    totalWithTaxes,
  }), [
    hasPreselectedTour,
    selectedTour?.slug,
    selectedTourName,
    selectedDate,
    currentMonth,
    currentYear,
    tickets,
    slots,
    tourTime,
    selectedAddons,
    addonDetails,
    addonDetailsSummary,
    addonsPricePerPerson,
    pricePerPerson,
    subtotalRaw,
    taxesRaw,
    totalWithTaxes,
  ]);

  useEffect(() => {
    trackAnalyticsEvent("booking_step", {
      metadata: {
        step: currentStep,
        stepLabel: stepLabels[currentStep],
        completion: {
          step1Valid: isStep1Valid,
          step2Valid: isStep2Valid,
          termsAccepted: validation.isAgreeTermsValid,
          formReadyToSubmit: isFormValid,
          missingStep1Items,
          missingStep2Items,
          missingStep1Keys,
          missingStep2Keys,
        },
        booking: getAnalyticsBookingSnapshot(),
        selectedDate,
        currentMonth,
        currentYear,
        tickets,
      },
    });
  }, [
    currentStep,
    isStep1Valid,
    isStep2Valid,
    validation.isAgreeTermsValid,
    isFormValid,
    missingStep1Items,
    missingStep2Items,
    missingStep1Keys,
    missingStep2Keys,
    getAnalyticsBookingSnapshot,
    selectedDate,
    currentMonth,
    currentYear,
    tickets,
    stepLabels,
  ]);

  useEffect(() => {
    const previousStep = currentStepRef.current;
    if (previousStep !== currentStep) {
      const durationMs = Date.now() - stepEnteredAtRef.current;

      trackAnalyticsEvent("booking_step_abandoned", {
        metadata: {
          step: previousStep,
          stepLabel: stepLabels[previousStep],
          durationMs,
          durationSeconds: Math.round(durationMs / 1000),
          missingKeys: getMissingKeysForStep(previousStep),
          completed: completedStepsRef.current.has(previousStep),
          nextStep: currentStep,
          nextStepLabel: stepLabels[currentStep],
          booking: getAnalyticsBookingSnapshot(),
        },
      });

      currentStepRef.current = currentStep;
      stepEnteredAtRef.current = Date.now();
    }
  }, [currentStep, getAnalyticsBookingSnapshot, getMissingKeysForStep, stepLabels]);

  useEffect(() => {
    const handlePageHide = () => {
      const activeStep = currentStepRef.current;
      const durationMs = Date.now() - stepEnteredAtRef.current;

      trackAnalyticsEvent("booking_step_abandoned", {
        metadata: {
          step: activeStep,
          stepLabel: stepLabels[activeStep],
          durationMs,
          durationSeconds: Math.round(durationMs / 1000),
          missingKeys: getMissingKeysForStep(activeStep),
          completed: completedStepsRef.current.has(activeStep),
          nextStep: null,
          nextStepLabel: null,
          source: "pagehide",
          booking: getAnalyticsBookingSnapshot(),
        },
      });
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [getAnalyticsBookingSnapshot, getMissingKeysForStep, stepLabels]);

  const trackBlockedStep = useCallback((targetStep: BookingStepId | "checkout", source: string) => {
    const missingKeys = getMissingKeysForStep(currentStep);

    trackAnalyticsEvent("booking_step_blocked", {
      metadata: {
        step: currentStep,
        stepLabel: stepLabels[currentStep],
        targetStep,
        targetStepLabel: targetStep === "checkout" ? "checkout" : stepLabels[targetStep],
        source,
        missingKeys,
        missingStep1Keys,
        missingStep2Keys,
        termsAccepted: validation.isAgreeTermsValid,
        booking: getAnalyticsBookingSnapshot(),
      },
    });
  }, [
    currentStep,
    getAnalyticsBookingSnapshot,
    getMissingKeysForStep,
    missingStep1Keys,
    missingStep2Keys,
    stepLabels,
    validation.isAgreeTermsValid,
  ]);

  const trackStepCompleted = useCallback((step: BookingStepId, targetStep: BookingStepId | "checkout", source: string) => {
    completedStepsRef.current.add(step);

    trackAnalyticsEvent("booking_step_completed", {
      metadata: {
        step,
        stepLabel: stepLabels[step],
        targetStep,
        targetStepLabel: targetStep === "checkout" ? "checkout" : stepLabels[targetStep],
        source,
        durationMs: Date.now() - stepEnteredAtRef.current,
        durationSeconds: Math.round((Date.now() - stepEnteredAtRef.current) / 1000),
        booking: getAnalyticsBookingSnapshot(),
      },
    });
  }, [getAnalyticsBookingSnapshot, stepLabels]);

  const guideToElement = useCallback((element: HTMLElement | null, focus = false) => {
    if (!element) return;

    window.setTimeout(() => {
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

      if (focus && "focus" in element) {
        window.setTimeout(() => {
          element.focus({ preventScroll: true });
        }, 180);
      }
    }, 80);
  }, []);

  const getStep1GuideTarget = useCallback(() => {
    if (!tourTime) return { element: scheduleSectionRef.current, focus: false };
    if (!isTicketsValid) return { element: ticketsInputRef.current, focus: true };
    return { element: ticketsInputRef.current, focus: true };
  }, [isTicketsValid, tourTime]);

  const getStep2GuideTarget = useCallback(() => {
    if (!validation.isNameValid) return { element: nameInputRef.current, focus: true };
    if (!validation.isEmailValid) return { element: emailInputRef.current, focus: true };
    if (!validation.isPhoneNumberValid) return { element: phoneInputRef.current, focus: true };
    return { element: travelerSectionRef.current, focus: false };
  }, [validation.isEmailValid, validation.isNameValid, validation.isPhoneNumberValid]);

  const getStep3GuideTarget = useCallback(() => {
    if (!validation.isAgreeTermsValid) return { element: termsCheckboxRef.current, focus: true };
    return { element: reviewSectionRef.current, focus: false };
  }, [validation.isAgreeTermsValid]);

  const guideToStep = useCallback((step: BookingStepId) => {
    const target =
      step === 1 ? getStep1GuideTarget() :
      step === 2 ? getStep2GuideTarget() :
      getStep3GuideTarget();

    guideToElement(target.element, target.focus);
  }, [getStep1GuideTarget, getStep2GuideTarget, getStep3GuideTarget, guideToElement]);

  const goToStep = useCallback((targetStep: BookingStepId, source: string) => {
    if (targetStep > currentStep) {
      if (currentStep === 1 && !isStep1Valid) {
        trackBlockedStep(targetStep, source);
        guideToStep(1);
        return;
      }

      if ((currentStep === 2 || targetStep === 3) && !isStep2Valid) {
        trackBlockedStep(targetStep, source);
        // From step 1 with incomplete traveler data, land on traveler form.
        if (currentStep === 1 && isStep1Valid) {
          trackStepCompleted(1, 2, source);
          nextStepFocusRef.current = 2;
          setCurrentStep(2);
          return;
        }
        guideToStep(2);
        return;
      }

      trackStepCompleted(currentStep, targetStep, source);
      if (currentStep === 1 && targetStep === 3) {
        completedStepsRef.current.add(2);
      }
    }

    nextStepFocusRef.current = targetStep;
    setCurrentStep(targetStep);
  }, [currentStep, guideToStep, isStep1Valid, isStep2Valid, trackBlockedStep, trackStepCompleted]);

  useEffect(() => {
    if (nextStepFocusRef.current !== currentStep) return;

    nextStepFocusRef.current = null;
    guideToStep(currentStep);
  }, [currentStep, guideToStep]);

  useEffect(() => {
    if (currentStep !== 1 || !step1FieldFocusRef.current) return;

    if (step1FieldFocusRef.current === "tickets" && tourTime) {
      step1FieldFocusRef.current = null;
      guideToElement(ticketsInputRef.current, true);
    }
  }, [currentStep, guideToElement, tourTime]);

  const handleReserve = useCallback((options?: { forceTermsAccepted?: boolean }) => {
    if (submitInFlightRef.current) return;

    const addonValidation = validateSelectedAddons(selectedAddons, addonDetails, lang);
    if (!addonValidation.ok) {
      trackBlockedStep("checkout", "addon_config");
      guideToStep(1);
      return;
    }

    const termsOk = options?.forceTermsAccepted || validation.isAgreeTermsValid;
    const ready = isStep1Valid && isStep2Valid && termsOk && Boolean(tourTime) && Boolean(selectedTour);

    if (!ready) {
      trackBlockedStep("checkout", "checkout_button");
      guideToStep(!isStep1Valid ? 1 : !isStep2Valid ? 2 : 3);
      return;
    }

    if (options?.forceTermsAccepted && !validation.isAgreeTermsValid) {
      handleChange("agreeTerms", true);
    }

    submitInFlightRef.current = true;
    setIsSubmitting(true);
    trackStepCompleted(3, "checkout", "checkout_button");

    trackAnalyticsEvent("booking_submitted", {
      metadata: {
        step: 3,
        stepLabel: "review",
        tickets,
        tourTime,
        tourSlug: selectedTour!.slug,
        selectedAddons,
        totalWithTaxes,
        expressTerms: Boolean(options?.forceTermsAccepted),
      },
    });

    const selectedAddonObjects = ADDON_OPTIONS.filter((a) => selectedAddons.includes(a.id));
    const mergedSpecialRequests = [formState.specialRequests.trim(), addonDetailsSummary]
      .filter(Boolean)
      .join("\n\nAdd-ons: ");

    try {
      onReserve({
        tickets,
        date: formattedDate,
        dateIso: reservationDateIso,
        total: totalWithTaxes,
        name: formState.name.trim(),
        email: formState.email.trim(),
        phone: `${formState.phoneCode} ${formState.phoneNumber.trim()}`,
        specialRequests: mergedSpecialRequests,
        tourTime: tourTime!,
        packageId: selectedPackage?.id ?? "general-entry",
        tourPackage: packageLabel,
        tourSlug: selectedTour!.slug,
        tourName: selectedTourName,
        packagePrice: packagePriceUSD,
        addons: selectedAddonObjects.map((a) => (lang === "es" ? a.nameEs : a.nameEn)),
        addonIds: selectedAddonObjects.map((a) => a.id),
        addonsPrice: addonsPricePerPerson * tickets,
        addonsPricePerPerson,
        addonsBreakdown,
        transportQuote,
        addonDetails,
      });
    } catch (error) {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
      throw error;
    }
  }, [
    tourTime,
    onReserve,
    tickets,
    formattedDate,
    reservationDateIso,
    totalWithTaxes,
    formState,
    selectedTour,
    selectedTourName,
    packageLabel,
    packagePriceUSD,
    selectedPackage,
    selectedAddons,
    addonDetails,
    addonDetailsSummary,
    addonsPricePerPerson,
    addonsBreakdown,
    transportQuote,
    lang,
    trackBlockedStep,
    trackStepCompleted,
    guideToStep,
    isStep1Valid,
    isStep2Valid,
    validation.isAgreeTermsValid,
    handleChange,
  ]);

  useEffect(() => {
    if (
      hasResumedProgressRef.current ||
      !hasAppliedPrefillRef.current ||
      !isTravelerDraftHydrated ||
      !selectedTour ||
      !selectedPackage ||
      !selectedPackageId ||
      (initialSelectedPackageId &&
        getPackageId(selectedPackage) !== getPackageId(resolveInitialPackage(packageOptions, initialSelectedPackageId))) ||
      transportLoading
    ) return;

    hasResumedProgressRef.current = true;
    // A fresh visit always follows the guided sequence. Prefilled values may be
    // displayed as suggestions, but only direct user actions unlock each choice.
    setCurrentStep(1);
    setChoiceStep(1);
  }, [
    addonDetails,
    handleReserve,
    isStep1Valid,
    isStep2Valid,
    isTicketsValid,
    isTravelerDraftHydrated,
    lang,
    selectedAddons,
    initialSelectedPackageId,
    packageOptions,
    selectedPackageId,
    selectedPackage,
    selectedTour,
    tourTime,
    transportError,
    transportLoading,
    transportQuote,
    transportQuoteEnabled,
    validation.isAgreeTermsValid,
  ]);

  const goToNextStep = useCallback(() => {
    if (currentStep === 1) {
      if (choiceStep === 1) {
        if (!hasConfirmedPackage) return;
        setChoiceStep(2);
        return;
      }
      if (choiceStep === 2) {
        if (!tourTime || !hasConfirmedTime) return;
        setChoiceStep(3);
        return;
      }
      if (choiceStep === 3) {
        if (!isTicketsValid || !hasConfirmedTickets) return;
        setChoiceStep(4);
        return;
      }
      goToStep(2, "next_button");
      return;
    }

    if (currentStep === 2) {
      goToStep(3, "next_button");
    }
  }, [
    choiceStep,
    currentStep,
    goToStep,
    hasConfirmedPackage,
    hasConfirmedTickets,
    hasConfirmedTime,
    isTicketsValid,
    tourTime,
  ]);

  const handleStep1Enter = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    if (isStep1Valid) {
      goToNextStep();
      return;
    }

    guideToStep(1);
  }, [goToNextStep, guideToStep, isStep1Valid]);

  const handleNameEnter = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    if (validation.isNameValid) {
      guideToElement(emailInputRef.current, true);
      return;
    }

    guideToElement(nameInputRef.current, true);
  }, [guideToElement, validation.isNameValid]);

  const handleEmailEnter = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    if (validation.isEmailValid) {
      guideToElement(phoneInputRef.current, true);
      return;
    }

    guideToElement(emailInputRef.current, true);
  }, [guideToElement, validation.isEmailValid]);

  const handlePhoneEnter = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    if (isStep2Valid) {
      goToNextStep();
      return;
    }

    guideToStep(2);
  }, [goToNextStep, guideToStep, isStep2Valid]);

  const handleTermsEnter = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    handleReserve({ forceTermsAccepted: true });
  }, [handleReserve]);

  const handleTourTimeSelect = useCallback((slot: TourTime) => {
    setTourTime(slot);
    setHasConfirmedTime(true);
    step1FieldFocusRef.current = "tickets";
    trackAnalyticsEvent("booking_selection_changed", {
      metadata: {
        step: 1,
        stepLabel: stepLabels[1],
        field: "tour_time",
        value: slot,
        booking: {
          ...getAnalyticsBookingSnapshot(),
          selectedTime: slot,
          hasSelectedTime: true,
        },
      },
    });
  }, [getAnalyticsBookingSnapshot, stepLabels]);

  const handleAddonToggle = useCallback((addonId: string) => {
    setSelectedAddons((prev) => {
      const next = prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId];
      return next;
    });
    trackAnalyticsEvent("booking_selection_changed", {
      metadata: {
        step: 1,
        stepLabel: stepLabels[1],
        field: "addon",
        addonId,
        booking: getAnalyticsBookingSnapshot(),
      },
    });
  }, [getAnalyticsBookingSnapshot, stepLabels]);

  const handleTicketsChange = useCallback((rawValue: string) => {
    const parsedValue = Number(rawValue);
    const integerValue = Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : 1;
    const nextTickets = Math.min(Math.max(integerValue, 1), Math.max(slots, 1));

    setTickets(nextTickets);
    setHasConfirmedTickets(true);
    trackAnalyticsEvent("booking_selection_changed", {
      metadata: {
        step: 1,
        stepLabel: stepLabels[1],
        field: "tickets",
        rawValue: Number.isFinite(parsedValue) ? parsedValue : null,
        value: nextTickets,
        wasClamped: nextTickets !== parsedValue,
        slots,
        booking: {
          ...getAnalyticsBookingSnapshot(),
          tickets: nextTickets,
        },
      },
    });
  }, [getAnalyticsBookingSnapshot, setTickets, slots, stepLabels]);

  const trackFieldBlur = useCallback((field: "name" | "email" | "phone" | "specialRequests" | "terms") => {
    const fieldState = {
      name: {
        isValid: validation.isNameValid,
        isEmpty: formState.name.trim() === "",
        valueLength: formState.name.trim().length,
      },
      email: {
        isValid: validation.isEmailValid,
        isEmpty: formState.email.trim() === "",
        valueLength: formState.email.trim().length,
      },
      phone: {
        isValid: validation.isPhoneNumberValid,
        isEmpty: formState.phoneNumber.trim() === "",
        valueLength: formState.phoneNumber.trim().length,
        phoneCode: formState.phoneCode,
      },
      specialRequests: {
        isValid: true,
        isEmpty: formState.specialRequests.trim() === "",
        valueLength: formState.specialRequests.trim().length,
      },
      terms: {
        isValid: validation.isAgreeTermsValid,
        isEmpty: !validation.isAgreeTermsValid,
        valueLength: validation.isAgreeTermsValid ? 1 : 0,
      },
    }[field];

    trackAnalyticsEvent("booking_field_blur", {
      metadata: {
        step: field === "terms" ? 3 : 2,
        stepLabel: field === "terms" ? stepLabels[3] : stepLabels[2],
        field,
        ...fieldState,
        missingStep2Keys,
        termsAccepted: validation.isAgreeTermsValid,
        booking: getAnalyticsBookingSnapshot(),
      },
    });
  }, [formState, getAnalyticsBookingSnapshot, missingStep2Keys, stepLabels, validation]);

  const missingItems = useMemo(() => [
    ...missingStep1Items,
    ...missingStep2Items,
    ...(validation.isAgreeTermsValid ? [] : [lang === "es" ? "Aceptar los términos." : "Accept the terms."]),
  ], [missingStep1Items, missingStep2Items, validation.isAgreeTermsValid, lang]);

  const wizardSteps = useMemo(
    () => [
      { id: 1 as BookingStepId, label: tr.steps.schedule },
      { id: 2 as BookingStepId, label: tr.steps.traveler },
      { id: 3 as BookingStepId, label: tr.steps.review },
    ],
    [tr.steps.schedule, tr.steps.traveler, tr.steps.review],
  );

  const stickySecondaryLabel = [
    formattedDate,
    hasConfirmedTime && tourTime ? formatDepartureLabel(tourTime) : null,
    hasConfirmedTickets ? `${tickets} pax` : null,
    hasConfirmedPackage ? packageLabel : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const step1ContinueLabel = lang === "es" ? "Siguiente · mis datos" : "Next · my details";

  const stickyLabel =
    currentStep === 1
      ? choiceStep < 4
        ? lang === "es" ? "Continuar" : "Continue"
        : step1ContinueLabel
      : currentStep === 2
        ? lang === "es" ? "Revisar" : "Review"
        : isSubmitting
          ? lang === "es" ? "Procesando…" : "Processing…"
        : validation.isAgreeTermsValid
            ? `${tr.proceedBtn} · $${totalWithTaxes.toFixed(0)}`
            : lang === "es" ? "Acepte los términos" : "Accept the terms";

  const handlePackageSelect = useCallback((packageId: string) => {
    setSelectedPackageId(packageId);
    setHasConfirmedPackage(true);
    trackAnalyticsEvent("booking_selection_changed", {
      metadata: {
        step: 1,
        stepLabel: stepLabels[1],
        field: "package",
        value: packageId,
        booking: getAnalyticsBookingSnapshot(),
      },
    });
  }, [getAnalyticsBookingSnapshot, stepLabels]);

  return (
    <div className="pb-32 md:pb-4">
      <div className={`mb-3 flex items-center gap-2.5 rounded-xl border p-2.5 ${
        isStep1Valid
          ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white dark:border-emerald-800/40 dark:from-emerald-950/30 dark:to-zinc-900/60"
          : `border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/60 ${!selectedTour ? "ring-2 ring-amber-300/70" : ""}`
      }`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-300">
          <MapPin className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-black leading-tight text-zinc-900 dark:text-zinc-50">{selectedTourName}</h3>
          <p className="truncate text-xs font-semibold capitalize text-zinc-500 dark:text-zinc-400">
            {formattedDate}
            {tourTime ? ` · ${formatDepartureLabel(tourTime)}` : ""}
            {hasConfirmedTickets ? ` · ${tickets} pax` : ` · ${lang === "es" ? "personas por elegir" : "guests to choose"}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
            {isStep1Valid ? (lang === "es" ? "Listo" : "Ready") : (lang === "es" ? "Est." : "Est.")}
          </p>
          <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
            ${totalWithTaxes.toFixed(0)}
          </p>
        </div>
      </div>

      <ReservationDetailsStepProgress
        steps={wizardSteps}
        currentStep={currentStep}
        maxReachableStep={
          currentStep === 1
            ? isStep1Valid
              ? isStep2Valid
                ? 3
                : 2
              : 1
            : currentStep === 2
              ? isStep2Valid
                ? 3
                : 2
              : 3
        }
        onStepSelect={(step) => {
          if (step < currentStep) {
            setCurrentStep(step);
            return;
          }
          if (currentStep === 1 && step === 3 && isStep1Valid && isStep2Valid) {
            goToStep(3, "progress_skip");
            return;
          }
          goToStep(step, "progress");
        }}
      />

      {currentStep === 1 && (
        <ReservationDetailsStep1Guided
          choiceStep={choiceStep}
          onChoiceStepChange={setChoiceStep}
          scheduleSectionRef={scheduleSectionRef}
          ticketsInputRef={ticketsInputRef}
          tourTime={tourTime}
          availableTimeSlots={availableTimeSlots}
          isTicketsValid={isTicketsValid}
          hasConfirmedPackage={hasConfirmedPackage}
          hasConfirmedTime={hasConfirmedTime}
          hasConfirmedTickets={hasConfirmedTickets}
          tickets={tickets}
          slots={slots}
          packages={packageOptions}
          selectedPackageId={selectedPackageId}
          excludedAddonIds={excludedAddonIds}
          selectedAddons={selectedAddons}
          addonDetails={addonDetails}
          addonsPricePerPerson={addonsPricePerPerson}
          packageLabel={hasConfirmedPackage ? packageLabel : (lang === "es" ? "Paquete por elegir" : "Package to choose")}
          reservationDateIso={reservationDateIso}
          estimatedTotal={totalWithTaxes}
          continueLabel={step1ContinueLabel}
          onPackageSelect={handlePackageSelect}
          isPackageDisabled={isPackageDisabled}
          onTourTimeSelect={handleTourTimeSelect}
          onTicketsChange={handleTicketsChange}
          onStep1Enter={handleStep1Enter}
          onAddonToggle={handleAddonToggle}
          onAddonDetailsChange={setAddonDetails}
          onContinue={goToNextStep}
          canContinue={isStep1Valid}
          transportQuote={transportQuote}
          transportLoading={transportLoading}
          transportError={transportError}
          transportPreview={transportQuoteEnabled}
          tr={tr}
          lang={lang}
        />
      )}

      {currentStep === 2 && (
        <ReservationDetailsStep2
          travelerSectionRef={travelerSectionRef}
          nameInputRef={nameInputRef}
          emailInputRef={emailInputRef}
          phoneInputRef={phoneInputRef}
          isStep2Valid={isStep2Valid}
          formState={formState}
          validation={validation}
          onNameChange={(value) => handleChange("name", value)}
          onEmailChange={(value) => handleChange("email", value)}
          onPhoneCodeChange={(value) => handleChange("phoneCode", value)}
          onPhoneNumberChange={(value) => handleChange("phoneNumber", value)}
          onSpecialRequestsChange={(value) => handleChange("specialRequests", value)}
          onNameEnter={handleNameEnter}
          onEmailEnter={handleEmailEnter}
          onPhoneEnter={handlePhoneEnter}
          onFieldBlur={trackFieldBlur}
          onBack={() => setCurrentStep(1)}
          onContinue={() => goToStep(3, "continue_button")}
          canContinue={isStep2Valid}
          tr={tr}
          lang={lang}
        />
      )}

      {currentStep === 3 && (
        <>
          <ReservationDetailsStep3
            reviewSectionRef={reviewSectionRef}
            termsCheckboxRef={termsCheckboxRef}
            formState={formState}
            selectedTourName={selectedTourName}
            packageLabel={packageLabel}
            basePriceUSD={packagePriceUSD}
            tourTime={tourTime}
            tickets={tickets}
            formattedDate={formattedDate}
            selectedAddons={selectedAddons}
            addonDetails={addonDetails}
            transportQuote={transportQuote}
            transportLoading={transportLoading}
            transportError={transportError}
            subtotal={subtotal}
            taxes={taxes}
            totalWithTaxes={totalWithTaxes}
            ivaRatePercent={ivaRatePercent}
            localizedCancellationPolicy={localizedCancellationPolicy}
            onTermsChange={(accepted) => handleChange("agreeTerms", accepted)}
            onTermsEnter={handleTermsEnter}
            onEditStep={(step) => setCurrentStep(step)}
            tr={tr}
            lang={lang}
          />

          <div className="mb-3 hidden gap-2 md:flex">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex-1 rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200"
            >
              {lang === "es" ? "Volver" : "Back"}
            </button>
            <button
              type="button"
              onClick={() => handleReserve()}
              disabled={!isFormValid || isSubmitting}
              className="inline-flex flex-[2] min-h-14 items-center justify-center gap-2 rounded-full bg-[#00C4B0] px-6 py-3 font-black text-[#17322f] shadow-lg shadow-[#00C4B0]/15 transition hover:bg-[#66ddcf] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck className="h-5 w-5" aria-hidden />
              {validation.isAgreeTermsValid
                ? `${tr.proceedBtn} · $${totalWithTaxes.toFixed(2)}`
                : lang === "es" ? "Acepte los términos para continuar" : "Accept the terms to continue"}
            </button>
          </div>

          {!isFormValid && missingItems.length > 0 && (
            <p className="mb-3 text-center text-xs font-semibold text-amber-600 dark:text-amber-400">
              {missingItems.join(" ")}
            </p>
          )}
        </>
      )}

      <BookingStickyBar
        lang={lang}
        label={stickyLabel}
        secondaryLabel={stickySecondaryLabel}
        total={totalWithTaxes}
        disabled={
          isSubmitting ||
          (currentStep === 1
            ? choiceStep === 1
              ? !selectedPackage || !hasConfirmedPackage
              : choiceStep === 2
                ? !tourTime || !hasConfirmedTime
                : choiceStep === 3
                  ? !isTicketsValid || !hasConfirmedTickets
                  : !isStep1Valid
            : currentStep === 2
              ? !isStep2Valid
              : !isFormValid)
        }
        onBack={
          currentStep === 1 && choiceStep > 1
            ? () => setChoiceStep((choiceStep - 1) as ChoiceStep)
            : currentStep > 1
              ? () => setCurrentStep((currentStep - 1) as BookingStepId)
              : undefined
        }
        onAction={currentStep === 3 ? () => handleReserve() : goToNextStep}
      />
    </div>
  );
}
