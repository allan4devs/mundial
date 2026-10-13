// ── User preferences ────────────────────────────────────────────────────────

export type UserPreferences = {
  notifications: {
    emailEnabled: boolean;
    bookingReminders: boolean;
    promotions: boolean;
    weeklySummary: boolean;
  };
  dashboard: {
    compactView: boolean;
    showSupportCard: boolean;
    defaultBookingTab: "upcoming" | "past";
  };
};



// ── Tour summary (used in booking UI and reservation hooks) ──────────────────

export type TourSummary = {
  id: string;
  slug: string;
  titleEs: string;
  titleEn: string;
  descriptionEs?: string;
  descriptionEn?: string;
  duration?: string;
  difficulty?: string;
  priceCRC?: number;
  location?: string;
  inclusions?: string[];
  exclusions?: string[];
  cancellationPolicy?: string;
  restrictions?: string;
  packages?: TourPackageOption[];
  tagEs?: string;
  tagEn?: string;
};

export type TourPackageOption = {
  id?: string;
  name: string;
  nameEs?: string;
  price: number;
  priceCRC?: number | null;
  descriptionEn?: string;
  descriptionEs?: string;
  includes?: string[];
  groupTour?: boolean;
  departureTimes?: string[];
  scheduleNote?: string;
};

export type ContactInfo = {
whatsapp: string;
email: string;
youtube: string;
facebook: string;
twitter: string;
instagram: string;
};


export type TourInfo = {
name: string;
duration: string;
price: string;
inclusions: string[];
exclusions: string[];
cancellationPolicy?: string;
location: string;   
operator: string;
details: string;
restrictions: string;
contact: ContactInfo;
};

export interface PayPalCapture {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
}

export interface PayPalPurchaseUnit {
  reference_id?: string;
  payments?: {
    captures?: PayPalCapture[];
  };
}

export interface PayPalOrder {
  id: string;
  status: string;
  purchase_units: PayPalPurchaseUnit[];
}


export type AvailabilityMap = Record<number, number>;

// ── /tiempo route API response types ─────────────────────────────────────────

export type RainData = {
  success: boolean;
  meta?: {
    fetchedAt: string;
    lastUpdateISO: string;
    note: string;
    station: string;
  };
  status?: {
    risk: "green" | "yellow" | "red";
    riskLabel: string;
    riskEmoji: string;
    intensity: string;
    lastHour_mm: number;
    trend: string;
  };
  stats?: {
    last1h_mm: number;
    last3h_mm: number;
    last6h_mm: number;
    last24h_mm: number;
    last48h_mm: number;
    wetHoursLast24: number;
    wetStreak: number;
    dryStreak: number;
    peakHour24h: { mm: number; fecha: string };
  };
  rainTrend?: {
    direction: "subiendo" | "estable" | "bajando";
    label: string;
    last3h_mm: number;
    prev3h_mm: number;
  };
  analysis?: {
    rollingRisk: Array<{
      fecha: string;
      timestampISO: string | null;
      r3h: number;
      r6h: number;
    }>;
  };
  data?: {
    hourly: Array<{
      fecha: string;
      timestampISO: string | null;
      lluvia_mm: number;
      temp_c: number | null;
      hr_pct: number | null;
    }>;
    daily: Array<{ fecha: string; timestamp?: string | null; lluvia_mm: number }>;
  };
  currentSnapshot?: { sum_lluv_mm: number; lluv_ayer_mm: number } | null;
  crecidaRisk?: {
    level: "bajo" | "moderado" | "alto" | "critico";
    label: string;
    guidance: string;
    basisMm: number;
  };
  stationHealth?: import("@/lib/types/tiempo-api").StationHealth;
  baseline?: import("@/lib/types/tiempo-api").RainBaseline;
  /** Motor de predicción v2.0: AHORA / MAÑANA / RÍO, cada bloque con confianza. */
  model?: import("@/lib/types/tiempo-model").TiempoModel | null;
  error?: string;
};

export type RegionalHourlyEntry = {
  time: string;
  temp_c: number;
  hr_pct: number;
  precip_mm: number;
  precip_prob: number | null;
  rain_mm: number;
  weather_code: number;
  weather_icon: string;
};

export type RegionalData = {
  success: boolean;
  fetchedAt?: string;
  locations?: Array<{
    id: string;
    name: string;
    lat: number;
    lon: number;
    current: {
      temp_c: number;
      hr_pct: number;
      precip_mm: number;
      precip_prob_next3h: number | null;
      weather_label: string;
      weather_icon: string;
      wind_kmh: number;
    } | null;
    hourly_24h?: RegionalHourlyEntry[];
    daily_5d: Array<{
      date: string;
      weather_icon: string;
      weather_label: string;
      temp_max_c: number;
      temp_min_c: number;
      precip_sum_mm: number;
      precip_prob_max: number | null;
    }>;
  }>;
};

export type LocationWeather = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lon: number;
  elevation_m: number | null;
  current: {
    time: string;
    temp_c: number;
    hr_pct: number;
    precip_mm: number;
    precip_prob_next3h: number | null;
    rain_mm: number;
    wind_kmh: number;
    cloud_pct: number;
    weather_code: number;
    weather_label: string;
    weather_icon: string;
  } | null;
  hourly_24h: Array<{
    time: string;
    temp_c: number;
    hr_pct: number;
    precip_mm: number;
    precip_prob: number | null;
    rain_mm: number;
    weather_code: number;
    weather_icon: string;
  }>;
  daily_5d: Array<{
    date: string;
    weather_code: number;
    weather_label: string;
    weather_icon: string;
    temp_max_c: number;
    temp_min_c: number;
    precip_sum_mm: number;
    precip_prob_max: number | null;
  }>;
  error?: string;
};


export type SuccessPageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export type BookingRecord = {
  orderId: string;
  captureId: string | null;
  status: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  date: string | null;
  tickets: number | null;
  amount: number | null;
  currency: string | null;
  tourTime: string | null;
  tourPackage: string | null;
  tourSlug?: string | null;
  tourName?: string | null;
  packagePrice: number | null;
  userId?: string | null;
  userEmail?: string | null;
  createdAt?: Date;
  paypalRaw?: unknown;
};

// Tour document stored in MongoDB
export type TourDocument = {
  _id?: string;
  slug: string;
  iconName: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  duration: string;
  difficulty: string;
  priceCRC: number;
  tagEs: string;
  tagEn: string;
  accent: string;
  border: string;
  type: "public" | "b2b" | "both";
  retailPricePerPax?: number;
  currency?: string;
  minPax?: number;
  maxPax?: number;
  includes?: string[];
  inclusions?: string[];
  exclusions?: string[];
  packages?: TourPackageOption[];
  restrictions?: string;
  location?: string;
  cancellationPolicy?: string;
  isMain?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
};

// Main tour info as served from the API
export type MainTourInfo = {
  name: string;
  operator: string;
  duration: string;
  price: string;
  location: string;
  inclusions: string[];
  exclusions: string[];
  cancellationPolicy: string;
  details: string;
  restrictions: string;
  contact: ContactInfo;
};

export type SendEmailParams = {
  to: string | null;
  name: string | null;
  phone: string | null;
  date: string | null;
  tickets: string | number | null;
  amount: string | number | null;
  currency: string | null;
  orderId: string;
  captureId: string | null;
  status: string | null;
  reservationId: string | null;
  language?: "es" | "en";
  tourName?: string | null;
  tourPackage?: string | null;
  tourTime?: string | null;
};

export type SuccessClientProps = {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  date?: string | null;
  tickets?: string | number | null;
  amount?: string | number | null;
  currency?: string | null;
  orderId?: string | null;
  captureId?: string | null;
  status?: string | null;
  error?: string | null;
};

export type OrderDetails = {
  bookingAttemptId?: string;
  name: string;
  email: string;
  phone: string;
  tickets: number;
  total: number;
  date: string;
  dateIso?: string;
  tourTime: string;
  packageId?: string;
  tourPackage: string;
  tourSlug: string;
  tourName: string;
  packagePrice: number;
  specialRequests?: string;
  addons?: string[];
  addonIds?: string[];
  addonsPrice?: number;
  addonsPricePerPerson?: number;
  addonsBreakdown?: Array<{ id: string; pricePerPerson: number }>;
  addonDetails?: import("@/lib/reservation/types").ReservationAddonDetails;
  transportQuote?: import("@/lib/reservation/transport").TransportQuoteResult | null;
};

export type PaymentModalProps = {
  orderDetails: OrderDetails;
  onClose: () => void;
  onSuccess: (orderData: unknown) => void;
};
