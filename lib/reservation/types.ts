import type { LucideIcon } from "lucide-react";
import type {
  AvailabilityMap,
  MainTourInfo,
  TourPackageOption,
  TourSummary,
} from "@/lib/types/index";

// Re-export for convenience
export type { TourSummary, MainTourInfo, AvailabilityMap, TourPackageOption };

export type TourTime = string;
export type BookingStepId = 1 | 2 | 3;
export type TourPackage = string;

export interface AddOnOption {
  id: string;
  category: "food" | "lodging" | "transport" | "service" | "media";
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  price: number;
  priceNoteEs: string;
  priceNoteEn: string;
  priceStatus: "fixed" | "estimated" | "quote";
  configurable?: boolean;
  icon: LucideIcon;
}

export interface ReservationAddonDetails {
  lodgingType?: "hostel" | "hotel" | "cabin";
  lodgingNights?: number;
  lodgingRoom?: string;
  restaurantMeal?: string;
  restaurantProtein?: string;
  restaurantNotes?: string;
  transportType?: "shared" | "private";
  pickupLocation?: string;
  dropoffLocation?: string;
  transportNotes?: string;
}

export interface ReservationFormState {
  name: string;
  email: string;
  phoneCode: string;
  phoneNumber: string;
  specialRequests: string;
  agreeTerms: boolean;
}

export interface ReservationOrderPayload {
  name: string;
  email: string;
  phone: string;
  tickets: number;
  total: number;
  date: string;
  dateIso: string;
  tourTime: TourTime;
  packageId: string;
  tourPackage: TourPackage;
  tourSlug: string;
  tourName: string;
  packagePrice: number;
  specialRequests: string;
  addons: string[];
  addonIds: string[];
  addonsPrice: number;
  addonsPricePerPerson?: number;
  addonsBreakdown?: Array<{ id: string; pricePerPerson: number }>;
  addonDetails?: ReservationAddonDetails;
  transportQuote?: import("./transport").TransportQuoteResult | null;
}

export interface ReservationDetailsProps {
  selectedDate: number;
  currentMonth: number;
  monthName: string;
  tickets: number;
  setTickets: (n: number) => void;
  onReserve: (data: ReservationOrderPayload) => void;
  availability: AvailabilityMap;
  currentYear: number;
  tourInfo?: MainTourInfo | null;
  tours: TourSummary[];
  initialSelectedTourSlug?: string;
  initialSelectedPackageId?: string;
  hasPreselectedTour?: boolean;
  ivaRatePercent?: number;
}
