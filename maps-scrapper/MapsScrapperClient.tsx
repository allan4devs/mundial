"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Mail,
  MousePointer2,
  Phone,
  Search,
  Send,
} from "lucide-react";

type LatLng = {
  lat: number;
  lng: number;
};

type Business = {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating: number | null;
  userRatingCount: number | null;
  businessStatus: string;
  googleMapsUri: string;
  websiteUri: string;
  hasWebsite: boolean;
  websiteEvaluation: {
    url: string;
    reachable: boolean;
    needsModernization: boolean;
    score: number;
    verdict: string;
    reasons: string[];
  } | null;
  contactIntel: {
    emails: string[];
    emailSources: Record<string, string[]>;
    scannedUrls: string[];
    externalProfiles: string[];
    notes: string[];
  } | null;
  types: string[];
  location: LatLng | null;
  emailedAt?: string | null;
  emailedTo?: string | null;
  noImprovementNeededAt?: string | null;
};

type SearchResponse = {
  businesses: Business[];
  limit?: number;
  savedCount?: number;
  alreadySavedCount?: number;
  totalCandidatesCount?: number;
  withoutWebsiteCount?: number;
  needsModernizationCount?: number;
  emailsFoundCount?: number;
  searchedTypes: string[];
  skippedTypes?: { type: string; error: string }[];
  error?: string;
};

type Pitch = {
  whatsapp: string;
  email: {
    subject: string;
    body: string;
  };
};

type EmailDraft = {
  to: string;
  subject: string;
  body: string;
};

type SendState = {
  status: "idle" | "sending" | "sent" | "error";
  message?: string;
};

type GoogleMapsWindow = Window & {
  google?: {
    maps: {
      importLibrary: (libraryName: string) => Promise<Record<string, any>>;
      Map: new (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => any;
      Geocoder: new () => any;
      LatLngBounds: new () => any;
      event: {
        clearInstanceListeners: (instance: unknown) => void;
      };
      marker: {
        AdvancedMarkerElement: new (options: Record<string, unknown>) => any;
      };
      places: {
        PlaceAutocompleteElement: new (options?: Record<string, unknown>) => any;
      };
      __ib__?: () => void;
    };
  };
};

type GoogleMapsNamespace = NonNullable<
  NonNullable<GoogleMapsWindow["google"]>["maps"]
>;

const DEFAULT_CENTER: LatLng = { lat: 10.3277, lng: -84.4311 };

const CATEGORY_OPTIONS = [
  { value: "all", label: "Todos populares" },
  { value: "restaurant", label: "Restaurantes" },
  { value: "cafe", label: "Cafeterias" },
  { value: "bakery", label: "Panaderias" },
  { value: "store", label: "Tiendas" },
  { value: "beauty_salon", label: "Salones" },
  { value: "gym", label: "Gimnasios" },
  { value: "car_repair", label: "Talleres" },
  { value: "lodging", label: "Hospedaje" },
  { value: "dentist", label: "Dentistas" },
];

const STATUS_LABELS: Record<string, string> = {
  OPERATIONAL: "Activo",
  CLOSED_TEMPORARILY: "Cerrado temporalmente",
  CLOSED_PERMANENTLY: "Cerrado permanentemente",
};

// Base for the per-business visual proposal pages under /sitios-web/propuestas.
const PROPOSAL_BASE_URL =
  "https://www.laviejaadventures.com/sitios-web/propuestas";

// Fixed signature that closes every pitch (matches the winning email).
const PITCH_SIGNATURE = "--\nAllan Rojas\nSoftware\nTel + 506.6144-7156";

function slugifyBusinessName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildProposalUrl(name: string) {
  return `${PROPOSAL_BASE_URL}/${slugifyBusinessName(name) || "negocio"}`;
}

// Deterministic pitch modeled on Allan's proven email to Xtreme Gym (got a
// positive reply). No AI: same structure for every lead, editable before send.
function buildPitchTemplate(business: Pick<Business, "name" | "phone">): Pitch {
  const name = business.name?.trim() || "su negocio";
  const proposalUrl = buildProposalUrl(business.name || "");

  const subject = `Propuesta para modernizar la presencia digital de ${name}`;

  const body = [
    "Hola, espero que se encuentren muy bien.",
    "",
    "Mi nombre es Allan Rojas. Soy de San Carlos y trabajo en desarrollo de páginas web, presencia digital y mejora de perfiles de negocios en Google Maps y redes sociales.",
    "",
    `Estuve revisando la presencia digital de ${name} y considero que una página web moderna podría ayudarles a mostrar mejor sus servicios, horarios, ubicación, medios de contacto y opciones para nuevos clientes.`,
    "",
    `Por iniciativa propia preparé una propuesta visual de cómo podría verse una nueva página web para ${name}, pensada para verse bien en celular, cargar rápido y facilitar que las personas puedan contactarlos, llegar por Google Maps o consultar información sobre sus servicios.`,
    "",
    proposalUrl,
    "",
    "Además, también podría apoyarles con mejoras en Google Maps y redes sociales para que la información del negocio esté más clara, actualizada y fácil de encontrar.",
    "",
    "Me gustaría compartirles la propuesta y conversar unos minutos, sin ningún compromiso, para ver si les puede ser útil.",
    "",
    "Muchas gracias por su tiempo.",
    "",
    PITCH_SIGNATURE,
  ].join("\n");

  const whatsapp =
    `¡Pura vida! Soy Allan Rojas, de San Carlos. Hago páginas web y mejoro perfiles en Google Maps y redes. ` +
    `Preparé una propuesta visual de una web moderna para ${name}: ${proposalUrl} ` +
    `¿Le comparto los detalles sin compromiso?`;

  return { whatsapp, email: { subject, body } };
}

function installGoogleMapsLoader(apiKey: string) {
  const win = window as GoogleMapsWindow;

  if (win.google?.maps?.importLibrary) {
    return;
  }

  const googleNamespace = (win.google ||= {} as NonNullable<GoogleMapsWindow["google"]>);
  const mapsNamespace = (googleNamespace.maps ||= {} as NonNullable<
    GoogleMapsWindow["google"]
  >["maps"]);
  const libraryNames = new Set<string>();
  const params = new URLSearchParams();
  let loaderPromise: Promise<void> | undefined;

  const loadScript = () =>
    loaderPromise ||
    (loaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");

      params.set("libraries", [...libraryNames].join(","));
      params.set("key", apiKey);
      params.set("v", "weekly");
      params.set("language", "es-419");
      params.set("region", "CR");
      params.set("callback", "google.maps.__ib__");

      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.onerror = () =>
        reject(new Error("No se pudo cargar Google Maps JavaScript API."));
      mapsNamespace.__ib__ = resolve;
      document.head.append(script);
    }));

  mapsNamespace.importLibrary = (libraryName: string) => {
    libraryNames.add(libraryName);
    return loadScript().then(() => mapsNamespace.importLibrary(libraryName));
  };
}

function createMarkerDot({ color, label }: { color: string; label?: string }) {
  const dot = document.createElement("div");
  dot.style.width = label ? "28px" : "18px";
  dot.style.height = label ? "28px" : "18px";
  dot.style.borderRadius = "999px";
  dot.style.display = "grid";
  dot.style.placeItems = "center";
  dot.style.background = color;
  dot.style.border = "2px solid #ffffff";
  dot.style.boxShadow = "0 8px 18px rgba(15, 23, 42, 0.28)";
  dot.style.color = "#ffffff";
  dot.style.fontSize = "12px";
  dot.style.fontWeight = "900";
  dot.textContent = label ?? "";
  return dot;
}

export default function MapsScrapperClient({
  mapsBrowserKey,
  mapsMapId,
}: {
  mapsBrowserKey: string;
  mapsMapId: string;
}) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const autocompleteHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const businessMarkersRef = useRef<any[]>([]);

  const [isMapsReady, setIsMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<LatLng>(DEFAULT_CENTER);
  const [selectedLabel, setSelectedLabel] = useState("Ciudad Quesada, San Carlos");
  const [radius, setRadius] = useState(1500);
  const [category, setCategory] = useState("all");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchedTypes, setSearchedTypes] = useState<string[]>([]);
  const [withoutWebsiteCount, setWithoutWebsiteCount] = useState(0);
  const [needsModernizationCount, setNeedsModernizationCount] = useState(0);
  const [emailsFoundCount, setEmailsFoundCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [alreadySavedCount, setAlreadySavedCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [view, setView] = useState<"search" | "saved" | "sent" | "no-need">("search");
  const [savedBusinesses, setSavedBusinesses] = useState<Business[]>([]);
  const [savedTotal, setSavedTotal] = useState(0);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedError, setSavedError] = useState("");
  const [emailDrafts, setEmailDrafts] = useState<Record<string, EmailDraft>>({});
  const [sendStates, setSendStates] = useState<Record<string, SendState>>({});
  const [openEmail, setOpenEmail] = useState<Record<string, boolean>>({});
  const [emailedOverrides, setEmailedOverrides] = useState<
    Record<string, { emailed: boolean; to: string }>
  >({});
  const [noImprovementOverrides, setNoImprovementOverrides] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState("");

  const hasBrowserMapKey = mapsBrowserKey.length > 0;

  useEffect(() => {
    let isMounted = true;

    if (!hasBrowserMapKey) {
      setMapsError(
        "Mapa desactivado: agregue NEXT_PUBLIC_MAPS_JS_KEY si quiere renderizar Google Maps en el navegador.",
      );
      return;
    }

    try {
      installGoogleMapsLoader(mapsBrowserKey);
      setIsMapsReady(true);
    } catch (error) {
      if (isMounted) {
        setMapsError(
          error instanceof Error
            ? error.message
            : "No se pudo preparar Google Maps.",
        );
      }
    }

    return () => {
      isMounted = false;
    };
  }, [hasBrowserMapKey, mapsBrowserKey]);

  const updateMarker = useCallback((point: LatLng, label: string) => {
    const win = window as GoogleMapsWindow;

    setSelectedPoint(point);
    setSelectedLabel(label);

    if (!mapRef.current || !win.google?.maps) {
      return;
    }

    const AdvancedMarkerElement = win.google.maps.marker?.AdvancedMarkerElement;

    if (!AdvancedMarkerElement) {
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new AdvancedMarkerElement({
        map: mapRef.current,
        position: point,
        title: label,
        content: createMarkerDot({ color: "#0f766e", label: "•" }),
      });
    } else {
      markerRef.current.position = point;
      markerRef.current.title = label;
    }

    mapRef.current.panTo(point);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const win = window as GoogleMapsWindow;

    if (!isMapsReady || !mapNodeRef.current || !autocompleteHostRef.current || !win.google?.maps) {
      return;
    }

    async function initializeMap() {
      try {
        const [{ Map }, { AdvancedMarkerElement }, { Geocoder }, { PlaceAutocompleteElement }] = await Promise.all([
          win.google!.maps.importLibrary("maps"),
          win.google!.maps.importLibrary("marker"),
          win.google!.maps.importLibrary("geocoding"),
          win.google!.maps.importLibrary("places"),
        ]);

        if (!isMounted || !mapNodeRef.current || !autocompleteHostRef.current) {
          return;
        }

        const mapsNamespace = win.google!.maps as GoogleMapsNamespace;

        mapsNamespace.Map = Map as GoogleMapsNamespace["Map"];
        mapsNamespace.Geocoder = Geocoder as GoogleMapsNamespace["Geocoder"];
        mapsNamespace.marker = {
          ...mapsNamespace.marker,
          AdvancedMarkerElement,
        } as GoogleMapsNamespace["marker"];
        win.google!.maps.places = {
          ...win.google!.maps.places,
          PlaceAutocompleteElement,
        } as GoogleMapsNamespace["places"];

        const map = new Map(mapNodeRef.current, {
          center: DEFAULT_CENTER,
          zoom: 14,
          mapId: mapsMapId,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: true,
          styles: [
            { featureType: "poi.business", stylers: [{ visibility: "on" }] },
            { featureType: "water", stylers: [{ color: "#a7f3d0" }] },
          ],
        });
        mapRef.current = map;

        updateMarker(DEFAULT_CENTER, "Ciudad Quesada, San Carlos");

        const geocoder = new Geocoder();
        map.addListener("click", (event: any) => {
          const latLng = event.latLng;

          if (!latLng) {
            return;
          }

          const point = { lat: latLng.lat(), lng: latLng.lng() };
          updateMarker(point, `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);

          geocoder.geocode({ location: point }, (results: any[] | null, status: string) => {
            if (status === "OK" && results?.[0]?.formatted_address) {
              setSelectedLabel(results[0].formatted_address);
            }
          });
        });

        const placeAutocomplete = new PlaceAutocompleteElement({
          includedRegionCodes: ["cr"],
        });
        placeAutocomplete.placeholder = "Buscar ciudad, barrio o negocio";
        placeAutocomplete.includedRegionCodes = ["cr"];
        placeAutocomplete.locationBias = {
          radius: 5000,
          center: DEFAULT_CENTER,
        };
        placeAutocomplete.style.display = "block";
        placeAutocomplete.style.width = "100%";

        autocompleteHostRef.current.replaceChildren(placeAutocomplete);

        const boundsListener = map.addListener("bounds_changed", () => {
          placeAutocomplete.locationBias = null;
          placeAutocomplete.locationRestriction = map.getBounds();
        });

        const handlePlaceSelect = async (event: any) => {
          const placePrediction = event.placePrediction;

          if (!placePrediction) {
            return;
          }

          const place = placePrediction.toPlace();
          await place.fetchFields({
            fields: ["displayName", "formattedAddress", "location", "viewport"],
          });

          if (!place.location) {
            return;
          }

          const point = { lat: place.location.lat(), lng: place.location.lng() };
          const label =
            place.formattedAddress || place.displayName || "Punto seleccionado";

          updateMarker(point, label);

          if (place.viewport) {
            map.fitBounds(place.viewport);
          } else {
            map.setCenter(place.location);
            map.setZoom(15);
          }
        };

        placeAutocomplete.addEventListener("gmp-select", handlePlaceSelect);

        return () => {
          win.google?.maps.event.clearInstanceListeners(map);
          boundsListener?.remove?.();
          placeAutocomplete.removeEventListener("gmp-select", handlePlaceSelect);
        };
      } catch (error) {
        if (isMounted) {
          setMapsError(
            error instanceof Error
              ? error.message
              : "No se pudo cargar Google Maps.",
          );
        }
      }
    }

    let cleanup: void | (() => void);
    void initializeMap().then((cleanupHandler) => {
      cleanup = cleanupHandler;
    });

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [isMapsReady, mapsMapId, updateMarker]);

  const runSearch = useCallback(async () => {
    setIsSearching(true);
    setSearchError("");
    setBusinesses([]);
    setSearchedTypes([]);
    setWithoutWebsiteCount(0);
    setNeedsModernizationCount(0);
    setEmailsFoundCount(0);
    setSavedCount(0);
    setAlreadySavedCount(0);
    setEmailDrafts({});
    setSendStates({});
    setOpenEmail({});

    try {
      const response = await fetch("/api/maps-scrapper/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: selectedPoint,
          radius,
          category,
        }),
      });

      const payload = (await response.json()) as SearchResponse;

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo buscar negocios.");
      }

      if (payload.skippedTypes?.length) {
        const blockedMessage = payload.skippedTypes
          .map((item) => item.error)
          .find((message) => message.toLowerCase().includes("blocked"));

        if (blockedMessage) {
          throw new Error(
            `${blockedMessage} Active Places API (New) para esta key o quite restricciones que bloqueen places.googleapis.com.`,
          );
        }
      }

      setBusinesses(payload.businesses);
      setSearchedTypes(payload.searchedTypes);
      setWithoutWebsiteCount(payload.withoutWebsiteCount ?? 0);
      setNeedsModernizationCount(payload.needsModernizationCount ?? 0);
      setEmailsFoundCount(payload.emailsFoundCount ?? 0);
      setSavedCount(payload.savedCount ?? 0);
      setAlreadySavedCount(payload.alreadySavedCount ?? 0);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Error inesperado.");
    } finally {
      setIsSearching(false);
    }
  }, [category, radius, selectedPoint]);

  const loadSaved = useCallback(async () => {
    setIsLoadingSaved(true);
    setSavedError("");

    try {
      const response = await fetch("/api/maps-scrapper/businesses");
      const payload = (await response.json()) as {
        businesses?: Business[];
        savedTotal?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "No se pudieron cargar los leads guardados.");
      }

      setSavedBusinesses(payload.businesses ?? []);
      setSavedTotal(payload.savedTotal ?? payload.businesses?.length ?? 0);
    } catch (error) {
      setSavedError(error instanceof Error ? error.message : "Error inesperado.");
    } finally {
      setIsLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    if (view !== "search") {
      void loadSaved();
    }
  }, [view, loadSaved]);

  const isEmailed = useCallback(
    (business: Business) => {
      const override = emailedOverrides[business.id];
      return override ? override.emailed : Boolean(business.emailedAt);
    },
    [emailedOverrides],
  );

  const isNoImprovementNeeded = useCallback(
    (business: Business) => {
      const override = noImprovementOverrides[business.id];
      return override ?? Boolean(business.noImprovementNeededAt);
    },
    [noImprovementOverrides],
  );

  // Open (or close) the editable composer for a lead, seeding it once with the
  // proven template and the first public email the scraper found.
  const toggleEmailComposer = useCallback((business: Business) => {
    const template = buildPitchTemplate(business);

    setEmailDrafts((prev) =>
      prev[business.id]
        ? prev
        : {
            ...prev,
            [business.id]: {
              to:
                business.contactIntel?.emails[0] ||
                business.emailedTo ||
                "",
              subject: template.email.subject,
              body: template.email.body,
            },
          },
    );
    setSendStates((prev) =>
      prev[business.id] ? prev : { ...prev, [business.id]: { status: "idle" } },
    );
    setOpenEmail((prev) => ({ ...prev, [business.id]: !prev[business.id] }));
  }, []);

  // Manual check: mark/unmark a lead as already emailed and persist it.
  const setEmailedStatus = useCallback(
    async (business: Business, emailed: boolean, to = "") => {
      setEmailedOverrides((prev) => ({
        ...prev,
        [business.id]: { emailed, to },
      }));

      try {
        await fetch("/api/maps-scrapper/businesses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: business.id, emailed, emailedTo: to }),
        });
      } catch {
        /* keep the optimistic state; a refresh will reconcile */
      }
    },
    [],
  );

  const setNoImprovementStatus = useCallback(
    async (business: Business, noImprovementNeeded: boolean) => {
      setNoImprovementOverrides((prev) => ({
        ...prev,
        [business.id]: noImprovementNeeded,
      }));

      try {
        await fetch("/api/maps-scrapper/businesses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: business.id, noImprovementNeeded }),
        });
      } catch {
        /* keep optimistic state; refresh will reconcile */
      }
    },
    [],
  );

  const updateEmailDraft = useCallback(
    (businessId: string, patch: Partial<EmailDraft>) => {
      setEmailDrafts((prev) => {
        const current = prev[businessId] ?? { to: "", subject: "", body: "" };
        return { ...prev, [businessId]: { ...current, ...patch } };
      });
      // Editing after a send/error returns the row to a sendable state.
      setSendStates((prev) =>
        prev[businessId]?.status === "sending"
          ? prev
          : { ...prev, [businessId]: { status: "idle" } },
      );
    },
    [],
  );

  const sendPitchEmail = useCallback(
    async (businessId: string) => {
      const draft = emailDrafts[businessId];
      if (!draft) return;

      setSendStates((prev) => ({ ...prev, [businessId]: { status: "sending" } }));

      try {
        const response = await fetch("/api/maps-scrapper/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: draft.to,
            subject: draft.subject,
            body: draft.body,
            businessId,
          }),
        });

        const payload = (await response.json()) as { sent?: boolean; error?: string };

        if (!response.ok || !payload.sent) {
          throw new Error(payload.error || "No se pudo enviar el correo.");
        }

        setSendStates((prev) => ({ ...prev, [businessId]: { status: "sent" } }));
        // Sending through the app auto-marks the lead as emailed (server also
        // persists it) so the check shows immediately and across sessions.
        setEmailedOverrides((prev) => ({
          ...prev,
          [businessId]: { emailed: true, to: draft.to },
        }));
      } catch (error) {
        setSendStates((prev) => ({
          ...prev,
          [businessId]: {
            status: "error",
            message: error instanceof Error ? error.message : "Error al enviar.",
          },
        }));
      }
    },
    [emailDrafts],
  );

  const copyText = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(""), 1800);
    } catch {
      /* clipboard no disponible */
    }
  }, []);

  const savedPendingBusinesses = useMemo(
    () =>
      savedBusinesses.filter(
        (business) => !isEmailed(business) && !isNoImprovementNeeded(business),
      ),
    [isEmailed, isNoImprovementNeeded, savedBusinesses],
  );
  const sentBusinesses = useMemo(
    () => savedBusinesses.filter((business) => isEmailed(business)),
    [isEmailed, savedBusinesses],
  );
  const noNeedBusinesses = useMemo(
    () => savedBusinesses.filter((business) => isNoImprovementNeeded(business)),
    [isNoImprovementNeeded, savedBusinesses],
  );
  const displayedBusinesses =
    view === "search"
      ? businesses
      : view === "sent"
        ? sentBusinesses
        : view === "no-need"
          ? noNeedBusinesses
          : savedPendingBusinesses;

  useEffect(() => {
    const win = window as GoogleMapsWindow;

    businessMarkersRef.current.forEach((marker) => {
      marker.map = null;
    });
    businessMarkersRef.current = [];

    if (!mapRef.current || !win.google?.maps || displayedBusinesses.length === 0) {
      return;
    }

    const maps = win.google.maps;
    const AdvancedMarkerElement = maps.marker?.AdvancedMarkerElement;

    if (!AdvancedMarkerElement) {
      return;
    }

    const bounds = new maps.LatLngBounds();
    bounds.extend(selectedPoint);

    displayedBusinesses.forEach((business) => {
      if (!business.location) {
        return;
      }

      const marker = new AdvancedMarkerElement({
        map: mapRef.current,
        position: business.location,
        title: business.name,
        content: createMarkerDot({
          color: business.websiteUri
            ? business.websiteEvaluation?.needsModernization
              ? "#d97706"
              : "#2563eb"
            : "#dc2626",
        }),
      });

      businessMarkersRef.current.push(marker);
      bounds.extend(business.location);
    });

    mapRef.current.fitBounds(bounds);
  }, [displayedBusinesses, selectedPoint]);

  const csvContent = useMemo(() => {
    const headers = [
      "Name",
      "Phone",
      "Address",
      "Rating",
      "Reviews",
      "Status",
      "Google Maps",
      "Website",
      "Emails",
      "Email Sources",
      "External Profiles",
      "Emailed",
      "No Improvement Needed",
      "Modernization Score",
      "Modernization Verdict",
      "Modernization Reasons",
      "Types",
    ];

    const rows = displayedBusinesses.map((business) => [
      business.name,
      business.phone,
      business.address,
      business.rating ?? "",
      business.userRatingCount ?? "",
      STATUS_LABELS[business.businessStatus] ?? business.businessStatus,
      business.googleMapsUri,
      business.websiteUri,
      business.contactIntel?.emails.join(" | ") ?? "",
      Object.entries(business.contactIntel?.emailSources ?? {})
        .map(([email, sources]) => `${email}: ${sources.join(" | ")}`)
        .join(" || "),
      business.contactIntel?.externalProfiles.join(" | ") ?? "",
      isEmailed(business) ? "Yes" : "No",
      isNoImprovementNeeded(business) ? "Yes" : "No",
      business.websiteEvaluation?.score ?? "",
      business.websiteEvaluation?.verdict ?? "",
      business.websiteEvaluation?.reasons.join(" | ") ?? "",
      business.types.join(" | "),
    ]);

    return [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
  }, [displayedBusinesses, isEmailed, isNoImprovementNeeded]);

  const downloadCsv = useCallback(() => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `negocios-sin-website-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [csvContent]);

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-teal-700">
              Google Maps prospecting
            </p>
            <h1 className="mt-2 font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
              Leads web en Google Maps
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Seleccione un punto, ajuste el radio y encuentre negocios sin
              website o con sitios que conviene modernizar.
            </p>
          </div>

          <button
            type="button"
            onClick={downloadCsv}
            disabled={displayedBusinesses.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        </header>

        <section className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(390px,0.85fr)]">
          <div className="min-h-[520px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[minmax(0,1fr)_160px_180px_auto]">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Lugar
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <div
                    ref={autocompleteHostRef}
                    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-1 pl-10 pr-2 text-sm text-slate-950 outline-none transition focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Radio
                </span>
                <select
                  value={radius}
                  onChange={(event) => setRadius(Number(event.target.value))}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                >
                  <option value={800}>800 m</option>
                  <option value={1500}>1.5 km</option>
                  <option value={3000}>3 km</option>
                  <option value={5000}>5 km</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Tipo
                </span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={runSearch}
                disabled={isSearching}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 text-sm font-black text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-55 md:mt-auto"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                Buscar
              </button>
            </div>

            <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:grid-cols-[minmax(0,1fr)_140px_140px] md:items-center">
              <div className="flex items-center gap-2">
                <MousePointer2 className="h-4 w-4 text-teal-700" />
                <span className="font-semibold text-slate-800">{selectedLabel}</span>
              </div>
              <label className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-500">Lat</span>
                <input
                  type="number"
                  step="0.0001"
                  value={selectedPoint.lat}
                  onChange={(event) =>
                    updateMarker(
                      {
                        ...selectedPoint,
                        lat: Number(event.target.value),
                      },
                      "Coordenadas manuales",
                    )
                  }
                  className="h-9 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-500">Lng</span>
                <input
                  type="number"
                  step="0.0001"
                  value={selectedPoint.lng}
                  onChange={(event) =>
                    updateMarker(
                      {
                        ...selectedPoint,
                        lng: Number(event.target.value),
                      },
                      "Coordenadas manuales",
                    )
                  }
                  className="h-9 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600"
                />
              </label>
            </div>

            <div className="relative h-[62vh] min-h-[430px]">
              <div ref={mapNodeRef} className="h-full w-full" />
              {(!isMapsReady || mapsError) && (
                <div className="absolute inset-0 grid place-items-center bg-white/90 p-6 text-center">
                  <div>
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-teal-700" />
                    <p className="mt-3 font-bold text-slate-900">
                      {mapsError || "Cargando Google Maps..."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setView("search")}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-black transition ${
                    view === "search"
                      ? "bg-white text-teal-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Search className="h-4 w-4" />
                  Búsqueda
                </button>
                <button
                  type="button"
                  onClick={() => setView("saved")}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-black transition ${
                    view === "saved"
                      ? "bg-white text-teal-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Pendientes{savedPendingBusinesses.length > 0 ? ` (${savedPendingBusinesses.length})` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setView("sent")}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-black transition ${
                    view === "sent"
                      ? "bg-white text-teal-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Send className="h-4 w-4" />
                  Enviados{sentBusinesses.length > 0 ? ` (${sentBusinesses.length})` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setView("no-need")}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-black transition ${
                    view === "no-need"
                      ? "bg-white text-teal-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Check className="h-4 w-4" />
                  No ocupan{noNeedBusinesses.length > 0 ? ` (${noNeedBusinesses.length})` : ""}
                </button>
              </div>

              {view === "search" ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl font-black text-slate-950">
                        Resultados
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {businesses.length} lugares. {withoutWebsiteCount} sin website,
                        {" "}
                        {needsModernizationCount} con website para modernizar,
                        {" "}
                        {emailsFoundCount} emails encontrados.
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Max 10 nuevos por búsqueda · {savedCount} guardados ·{" "}
                        {alreadySavedCount} ya existían en MongoDB
                      </p>
                    </div>
                    <span className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-black text-amber-900">
                      {radius / 1000} km
                    </span>
                  </div>

                  {searchedTypes.length > 0 && (
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      Tipos consultados: {searchedTypes.join(", ")}
                    </p>
                  )}

                  {searchError && (
                    <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                      {searchError}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl font-black text-slate-950">
                        {view === "sent"
                          ? "Enviados"
                          : view === "no-need"
                            ? "No ocupan improvement"
                            : "Pendientes"}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {displayedBusinesses.length} leads en esta pestaña. {savedTotal} guardados en MongoDB
                        {savedTotal > savedBusinesses.length
                          ? ` (mostrando los ${savedBusinesses.length} más recientes de ${savedTotal})`
                          : ""}
                        .
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadSaved()}
                      disabled={isLoadingSaved}
                      className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {isLoadingSaved ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Refrescar
                    </button>
                  </div>

                  {savedError && (
                    <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                      {savedError}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              {displayedBusinesses.length === 0 ? (
                <div className="grid h-full min-h-[360px] place-items-center p-8 text-center">
                  {view === "saved" ? (
                    <div>
                      {isLoadingSaved ? (
                        <>
                          <Loader2 className="mx-auto h-10 w-10 animate-spin text-teal-700" />
                          <h3 className="mt-4 text-lg font-black text-slate-950">
                            Cargando guardados...
                          </h3>
                        </>
                      ) : (
                        <>
                          <Building2 className="mx-auto h-10 w-10 text-teal-700" />
                          <h3 className="mt-4 text-lg font-black text-slate-950">
                            Aún no hay leads guardados
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Cada búsqueda guarda hasta 10 negocios nuevos en
                            MongoDB. Corra una búsqueda para empezar a llenar
                            esta lista.
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div>
                      <MapPin className="mx-auto h-10 w-10 text-teal-700" />
                      <h3 className="mt-4 text-lg font-black text-slate-950">
                        Escoja un punto y busque
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Tip local: empiece con 1.5 km en Ciudad Quesada centro y
                        luego abra el radio. Así no se le baja el río de resultados.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {displayedBusinesses.map((business) => (
                    <article key={business.id} className="p-3 transition hover:bg-slate-50">
                      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="min-w-0">
                          <h3 className="truncate font-black leading-snug text-slate-950">
                            {business.name}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                            {business.address || "Sin direccion en Places"}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
                          {business.phone && (
                            <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700">
                              <Phone className="h-4 w-4 text-teal-700" />
                              {business.phone}
                            </span>
                          )}
                          <a
                            href={business.googleMapsUri}
                            target="_blank"
                            rel="noreferrer"
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-teal-500 hover:text-teal-700"
                            aria-label={`Abrir ${business.name} en Google Maps`}
                            title="Abrir en Google Maps"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                        {business.websiteUri ? (
                          <span
                            className={`rounded px-2 py-1 ${
                              business.websiteEvaluation?.needsModernization
                                ? "bg-amber-100 text-amber-900"
                                : "bg-blue-100 text-blue-900"
                            }`}
                          >
                            {business.websiteEvaluation
                              ? `${business.websiteEvaluation.score}/100 · ${business.websiteEvaluation.verdict}`
                              : "Website detectado"}
                          </span>
                        ) : (
                          <span className="rounded bg-red-100 px-2 py-1 text-red-800">
                            Sin website
                          </span>
                        )}
                        <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                          {STATUS_LABELS[business.businessStatus] ??
                            business.businessStatus}
                        </span>
                        {business.rating && (
                          <span className="rounded bg-amber-100 px-2 py-1 text-amber-900">
                            {business.rating} ({business.userRatingCount ?? 0})
                          </span>
                        )}
                        {isEmailed(business) && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-white">
                            <Check className="h-3 w-3" />
                            Email enviado
                          </span>
                        )}
                        {isNoImprovementNeeded(business) && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-white">
                            <Check className="h-3 w-3" />
                            No ocupa improvement
                          </span>
                        )}
                      </div>

                      {business.contactIntel &&
                        (business.contactIntel.emails.length > 0 ||
                          business.contactIntel.externalProfiles.length > 0) && (
                          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                            <p className="text-xs font-black uppercase text-emerald-900">
                              Contacto publico
                            </p>

                            {business.contactIntel.emails.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {business.contactIntel.emails.map((email) => (
                                  <a
                                    key={email}
                                    href={`mailto:${email}`}
                                    className="rounded bg-white px-2 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-200"
                                  >
                                    {email}
                                  </a>
                                ))}
                              </div>
                            )}

                            {business.contactIntel.externalProfiles.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {business.contactIntel.externalProfiles
                                  .slice(0, 4)
                                  .map((profileUrl) => (
                                    <a
                                      key={profileUrl}
                                      href={profileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-bold text-slate-700 ring-1 ring-emerald-200"
                                    >
                                      {new URL(profileUrl).hostname.replace(/^www\./, "")}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}

                      {business.websiteUri && (
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <a
                            href={business.websiteUri}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-black text-teal-800 hover:text-teal-950"
                          >
                            Ver website
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          {business.websiteEvaluation && (
                            <ul className="mt-2 space-y-1 text-xs font-semibold leading-5 text-slate-600">
                              {business.websiteEvaluation.reasons.slice(0, 3).map((reason) => (
                                <li key={reason}>{reason}</li>
                              ))}
                            </ul>
                          )}

                          {business.contactIntel?.notes.length ? (
                            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                              {business.contactIntel.notes[0]}
                            </p>
                          ) : null}
                        </div>
                      )}

                      {(() => {
                        const template = buildPitchTemplate(business);
                        const draft = emailDrafts[business.id] ?? {
                          to:
                            business.contactIntel?.emails[0] ||
                            business.emailedTo ||
                            "",
                          subject: template.email.subject,
                          body: template.email.body,
                        };
                        const send = sendStates[business.id] ?? {
                          status: "idle" as const,
                        };
                        const detectedEmails = business.contactIntel?.emails ?? [];
                        const composerOpen = openEmail[business.id] ?? false;
                        const emailed = isEmailed(business);
                        const noImprovementNeeded = isNoImprovementNeeded(business);
                        const waHref = business.phone
                          ? `https://wa.me/${business.phone.replace(/\D/g, "")}?text=${encodeURIComponent(template.whatsapp)}`
                          : "";
                        const canSend =
                          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.to.trim()) &&
                          draft.subject.trim().length > 0 &&
                          draft.body.trim().length > 0 &&
                          send.status !== "sending";

                        return (
                          <div className="mt-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleEmailComposer(business)}
                                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 text-sm font-black text-violet-800 transition hover:border-violet-400 hover:bg-violet-100"
                              >
                                <Mail className="h-4 w-4" />
                                {composerOpen ? "Ocultar email" : "Redactar email"}
                              </button>

                              {waHref && (
                                <a
                                  href={waHref}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 text-sm font-black text-green-800 transition hover:border-green-400 hover:bg-green-100"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  WhatsApp
                                </a>
                              )}

                              <label className="ml-auto inline-flex cursor-pointer select-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={emailed}
                                  onChange={(event) =>
                                    void setEmailedStatus(
                                      business,
                                      event.target.checked,
                                      draft.to,
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                Ya envié el email
                              </label>
                              <label className="inline-flex cursor-pointer select-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={noImprovementNeeded}
                                  onChange={(event) =>
                                    void setNoImprovementStatus(
                                      business,
                                      event.target.checked,
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                />
                                No ocupa improvement
                              </label>
                            </div>

                            {composerOpen && (
                              <div className="mt-3 space-y-2 rounded-lg border border-violet-200 bg-violet-50/60 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-violet-800">
                                    <Mail className="h-3.5 w-3.5" />
                                    Email
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyText(
                                        `${business.id}-mail`,
                                        `${draft.subject}\n\n${draft.body}`,
                                      )
                                    }
                                    className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900"
                                  >
                                    {copiedKey === `${business.id}-mail` ? (
                                      <Check className="h-3.5 w-3.5" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                    {copiedKey === `${business.id}-mail`
                                      ? "Copiado"
                                      : "Copiar"}
                                  </button>
                                </div>

                                <label className="mt-2 block text-[11px] font-black uppercase tracking-wide text-violet-700">
                                  Para
                                </label>
                                <input
                                  type="email"
                                  value={draft.to}
                                  onChange={(event) =>
                                    updateEmailDraft(business.id, {
                                      to: event.target.value,
                                    })
                                  }
                                  placeholder="correo@negocio.com"
                                  className="mt-1 h-9 w-full rounded-lg border border-violet-200 bg-white px-2 text-sm font-semibold text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                />
                                {detectedEmails.length > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {detectedEmails.map((email) => (
                                      <button
                                        key={email}
                                        type="button"
                                        onClick={() =>
                                          updateEmailDraft(business.id, { to: email })
                                        }
                                        className={`rounded px-2 py-0.5 text-[11px] font-bold ring-1 transition ${
                                          draft.to === email
                                            ? "bg-violet-600 text-white ring-violet-600"
                                            : "bg-white text-violet-700 ring-violet-200 hover:bg-violet-100"
                                        }`}
                                      >
                                        {email}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                <label className="mt-2 block text-[11px] font-black uppercase tracking-wide text-violet-700">
                                  Asunto
                                </label>
                                <input
                                  type="text"
                                  value={draft.subject}
                                  onChange={(event) =>
                                    updateEmailDraft(business.id, {
                                      subject: event.target.value,
                                    })
                                  }
                                  className="mt-1 h-9 w-full rounded-lg border border-violet-200 bg-white px-2 text-sm font-black text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                />

                                <label className="mt-2 block text-[11px] font-black uppercase tracking-wide text-violet-700">
                                  Mensaje
                                </label>
                                <textarea
                                  value={draft.body}
                                  onChange={(event) =>
                                    updateEmailDraft(business.id, {
                                      body: event.target.value,
                                    })
                                  }
                                  rows={12}
                                  className="mt-1 w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-sm leading-6 text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                />

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => sendPitchEmail(business.id)}
                                    disabled={!canSend}
                                    className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-violet-700 px-3 text-sm font-black text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-55"
                                  >
                                    {send.status === "sending" ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : send.status === "sent" ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Send className="h-4 w-4" />
                                    )}
                                    {send.status === "sending"
                                      ? "Enviando..."
                                      : send.status === "sent"
                                        ? "Enviado"
                                        : "Enviar email"}
                                  </button>
                                  {send.status === "sent" && (
                                    <span className="text-xs font-bold text-emerald-700">
                                      Correo enviado a {draft.to}
                                    </span>
                                  )}
                                </div>
                                {send.status === "error" && (
                                  <p className="mt-1.5 text-xs font-semibold text-red-600">
                                    {send.message}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
