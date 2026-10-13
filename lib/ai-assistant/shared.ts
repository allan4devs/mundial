export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type BookingState = {
  date: string | null;
  tourTime: "08:00" | "09:00" | "10:00" | null;
  tourPackage: "essential-package" | "lunch-package" | "private-package" | null;
  tickets: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  specialRequests: string | null;
};

export const TOUR_TIME_OPTIONS = ["08:00", "09:00", "10:00"] as const;
export const TOUR_PACKAGE_OPTIONS = ["essential-package", "lunch-package", "private-package"] as const;
export const AI_BOOKING_SESSION_KEY = "aiBookingConversationState";
export const AI_BOOKING_HANDOFF_KEY = "aiBookingReservationHandoff";
export const AI_BOOKING_HANDOFF_VERSION = 1;

export type AIBookingHandoff = {
  version: typeof AI_BOOKING_HANDOFF_VERSION;
  createdAt: string;
  state: BookingState;
};

export const REQUIRED_BOOKING_FIELDS: (keyof BookingState)[] = [
  "date",
  "tourTime",
  "tourPackage",
  "tickets",
  "name",
  "email",
  "phone",
];

export const INITIAL_BOOKING_STATE: BookingState = {
  date: null,
  tourTime: null,
  tourPackage: null,
  tickets: null,
  name: null,
  email: null,
  phone: null,
  specialRequests: null,
};

export const FIELD_LABELS: Record<string, string> = {
  date: "Fecha",
  tourTime: "Hora",
  tourPackage: "Paquete",
  tickets: "Personas",
  name: "Nombre",
  email: "Correo",
  phone: "Teléfono",
};

export const NEXT_FIELD_PROMPTS: Record<string, string> = {
  date: "¿Qué fecha querés reservar? Podés escribirla como YYYY-MM-DD.",
  tourTime: "¿Qué horario preferís: 08:00, 09:00 o 10:00?",
  tourPackage: "¿Cuál paquete preferís: esencial, con almuerzo o privado?",
  tickets: "¿Para cuántas personas sería la reserva?",
  name: "¿A nombre de quién hacemos la reserva?",
  email: "¿Cuál es tu correo para enviarte la confirmación?",
  phone: "¿Cuál es tu número de teléfono? Incluí código de país (ej: +506 8888-9999).",
};

export function createAIBookingHandoff(state: BookingState): AIBookingHandoff {
  return {
    version: AI_BOOKING_HANDOFF_VERSION,
    createdAt: new Date().toISOString(),
    state,
  };
}

