import type { Collection, Db } from "mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { sendConversationFollowupEmail } from "@/lib/email/conversation-followup-email";
import { isDateOnOrAfterMinBookableInCostaRica } from "@/lib/helpers/costa-rica-time";
import { searchSiteKnowledge, setupSiteKnowledge } from "@/lib/knowledge/site-knowledge";
import { getTourContent } from "@/lib/tour-content";
import { readPublicTours } from "@/lib/tours/public-catalog";
import { interpretWithOpenAI, type AssistantTourKnowledge } from "./ai";
import type {
  ConversationFaq,
  ConversationInputType,
  ConversationMessage,
  ConversationReservation,
  ConversationResponse,
  ConversationSession,
  ConversationStep,
  PublicConversationStep,
} from "./types";

const SESSION_TTL_DAYS = 30;
const STEP_SEED_VERSION = 4;
const FAQ_SEED_VERSION = 1;
let setupPromise: Promise<void> | null = null;

const EMPTY_RESERVATION: ConversationReservation = {
  tour: null,
  date: null,
  time: null,
  people: null,
  ages: [],
  fitness: null,
  package: null,
  transport: null,
  lunch: null,
  name: null,
  email: null,
  phone: null,
};

const STEP_SEEDS: Omit<ConversationStep, "updatedAt">[] = [
  {
    id: "first",
    message: "¡Hola! 👋 Bienvenido a La Vieja Adventures. Soy Vero, su asistente virtual. ¿Cómo puedo ayudarle?",
    kind: "menu",
    options: [
      { key: "A", label: "Reservar un tour", next: "reservation_tour" },
      { key: "B", label: "Hacer una pregunta", next: "questions_menu" },
      { key: "C", label: "Hablar con un agente", next: "human_name" },
    ],
    active: true,
  },
  {
    id: "reservation_tour",
    message: "¡Vamos a armar su aventura! ¿Cuál experiencia le interesa?",
    kind: "menu",
    options: [
      { key: "A", label: "Ciudad Esmeralda", next: "reservation_date", set: { path: "reservation.tour", value: "tour-ciudad-esmeralda" } },
      { key: "B", label: "Pozas Cristalinas", next: "reservation_date", set: { path: "reservation.tour", value: "cascadas-secretas-rio-la-vieja" } },
      { key: "C", label: "Cloud Forest Explorer", next: "reservation_date", set: { path: "reservation.tour", value: "caminata-volcanes-dormidos" } },
      { key: "D", label: "ATV, caballo o aves", next: "human_name" },
      { key: "E", label: "Volver", next: "first" },
    ],
    active: true,
  },
  {
    id: "reservation_date",
    message: "¿Para qué fecha desea reservar? Selecciónela en el calendario.",
    kind: "input",
    capture: { path: "reservation.date", type: "date", next: "reservation_time", invalidMessage: "Esa fecha no está disponible. Seleccione otra fecha válida en el calendario." },
    active: true,
  },
  {
    id: "reservation_time",
    message: "¿Qué horario prefiere? La disponibilidad final se confirma antes del pago.",
    kind: "menu",
    options: [
      { key: "A", label: "8:00 a. m.", next: "reservation_people", set: { path: "reservation.time", value: "08:00" } },
      { key: "B", label: "9:00 a. m.", next: "reservation_people", set: { path: "reservation.time", value: "09:00" } },
      { key: "C", label: "10:00 a. m.", next: "reservation_people", set: { path: "reservation.time", value: "10:00" } },
    ],
    active: true,
  },
  {
    id: "reservation_people",
    message: "¿Cuántas personas vienen?",
    kind: "input",
    capture: { path: "reservation.people", type: "integer", min: 1, max: 20, next: "reservation_ages", invalidMessage: "Indíqueme un número de personas entre 1 y 20." },
    active: true,
  },
  {
    id: "reservation_ages",
    message: "Indíqueme las edades separadas por comas. Ejemplo: 34, 32, 12.",
    kind: "input",
    capture: { path: "reservation.ages", type: "ages", next: "reservation_fitness", invalidMessage: "Escriba edades válidas separadas por comas; debe coincidir con la cantidad de personas." },
    active: true,
  },
  {
    id: "reservation_fitness",
    message: "¿Cómo describiría la condición física del grupo?",
    kind: "menu",
    options: [
      { key: "A", label: "Activa / buena", next: "reservation_package", set: { path: "reservation.fitness", value: "active" } },
      { key: "B", label: "Moderada", next: "reservation_package", set: { path: "reservation.fitness", value: "moderate" } },
      { key: "C", label: "Limitada o hay una condición médica", next: "human_name", set: { path: "reservation.fitness", value: "needs-review" } },
    ],
    active: true,
  },
  {
    id: "reservation_package",
    message: "¿Cuál paquete prefiere? El configurador confirmará el precio vigente.",
    kind: "menu",
    options: [
      { key: "A", label: "Esencial", next: "reservation_transport", set: { path: "reservation.package", value: "essential-package" } },
      { key: "B", label: "Con almuerzo", next: "reservation_transport", set: { path: "reservation.package", value: "lunch-package" } },
      { key: "C", label: "Privado", next: "reservation_transport", set: { path: "reservation.package", value: "private-package" } },
    ],
    active: true,
  },
  {
    id: "reservation_transport",
    message: "¿Necesita ayuda con transporte?",
    kind: "menu",
    options: [
      { key: "A", label: "Sí, necesito transporte", next: "reservation_lunch", set: { path: "reservation.transport", value: "required" } },
      { key: "B", label: "No, llego por mi cuenta", next: "reservation_lunch", set: { path: "reservation.transport", value: "self" } },
    ],
    active: true,
  },
  {
    id: "reservation_lunch",
    message: "¿Desea incluir almuerzo?",
    kind: "menu",
    options: [
      { key: "A", label: "Sí", next: "reservation_name", set: { path: "reservation.lunch", value: "yes" } },
      { key: "B", label: "No", next: "reservation_name", set: { path: "reservation.lunch", value: "no" } },
    ],
    active: true,
  },
  {
    id: "reservation_name",
    message: "¿A nombre de quién preparamos la solicitud?",
    kind: "input",
    capture: { path: "reservation.name", type: "text", min: 2, max: 120, next: "reservation_email", invalidMessage: "Necesito un nombre de al menos dos caracteres." },
    active: true,
  },
  {
    id: "reservation_email",
    message: "¿A qué correo enviamos la confirmación y el comprobante?",
    kind: "input",
    capture: { path: "reservation.email", type: "email", next: "reservation_phone", invalidMessage: "Ese correo no parece válido. Revíselo e inténtelo nuevamente." },
    active: true,
  },
  {
    id: "reservation_phone",
    message: "¿Cuál es su teléfono con código de país? Ejemplo: +506 8888-9999.",
    kind: "input",
    capture: { path: "reservation.phone", type: "phone", next: "reservation_review", invalidMessage: "Necesito un teléfono válido con entre 8 y 15 dígitos." },
    active: true,
  },
  {
    id: "reservation_review",
    message: "Ya reuní la solicitud. ¿Desea enviarla al configurador oficial para revisar horario, cupos y precio antes de confirmar?",
    kind: "menu",
    options: [
      { key: "A", label: "Confirmar y continuar", next: "reservation_ready" },
      { key: "B", label: "Comenzar de nuevo", next: "reservation_tour", resetReservation: true },
      { key: "C", label: "Hablar con un agente", next: "human_ready" },
    ],
    active: true,
  },
  {
    id: "reservation_ready",
    message: "¡Excelente! Su solicitud está lista. El siguiente paso valida disponibilidad, horario y tarifa; todavía no se ha creado ni cobrado una reserva.",
    kind: "terminal",
    options: [{ key: "A", label: "Ir al configurador", next: "reservation_ready" }, { key: "B", label: "Menú principal", next: "first" }],
    statusOnEnter: "ready_for_checkout",
    active: true,
  },
  {
    id: "questions_menu",
    message: "¡Claro! 😊 ¿Qué desea saber?",
    kind: "menu",
    options: [
      { key: "A", label: "¿Qué debo llevar?", next: "questions_menu", faqId: "what-to-bring" },
      { key: "B", label: "¿Cuánto dura?", next: "questions_menu", faqId: "duration" },
      { key: "C", label: "¿Cuánto cuesta?", next: "questions_menu", faqId: "price" },
      { key: "D", label: "¿Dónde están ubicados?", next: "questions_menu", faqId: "location" },
      { key: "E", label: "¿Qué pasa si llueve?", next: "questions_menu", faqId: "weather" },
      { key: "F", label: "¿Pueden ir niños?", next: "questions_menu", faqId: "children" },
      { key: "H", label: "Escribir otra pregunta", next: "questions_freeform" },
      { key: "G", label: "Volver al menú principal", next: "first" },
    ],
    active: true,
  },
  {
    id: "questions_freeform",
    message: "Escriba su pregunta con confianza. Primero revisaré la información verificada de La Vieja y, si hace falta, usaré IA.",
    kind: "input",
    capture: { path: "faq.query", type: "text", min: 3, max: 500, next: "questions_menu" },
    active: true,
  },
  {
    id: "faq_what_to_bring",
    message: "Traiga ropa para mojar, zapatos cerrados con buen agarre, cambio de ropa, toalla, agua, bloqueador y repelente.",
    kind: "menu",
    options: [{ key: "A", label: "Reservar", next: "reservation_tour" }, { key: "B", label: "Otra pregunta", next: "questions_menu" }, { key: "C", label: "Hablar con un agente", next: "human_name" }],
    active: true,
  },
  {
    id: "faq_duration",
    message: "Ciudad Esmeralda dura aproximadamente de 3 a 4 horas, según el ritmo del grupo y las condiciones seguras.",
    kind: "menu",
    options: [{ key: "A", label: "Reservar", next: "reservation_tour" }, { key: "B", label: "Otra pregunta", next: "questions_menu" }, { key: "C", label: "Hablar con un agente", next: "human_name" }],
    active: true,
  },
  {
    id: "faq_price",
    message: "El precio depende del tour, paquete, fecha, personas y extras. El configurador oficial muestra la tarifa vigente antes del pago.",
    kind: "menu",
    options: [{ key: "A", label: "Cotizar una reserva", next: "reservation_tour" }, { key: "B", label: "Otra pregunta", next: "questions_menu" }, { key: "C", label: "Hablar con un agente", next: "human_name" }],
    active: true,
  },
  {
    id: "faq_location",
    message: "Estamos en Sucre de San Carlos, Alajuela. En Google Maps o Waze puede buscar “La Vieja Adventures”.",
    kind: "menu",
    options: [{ key: "A", label: "Reservar", next: "reservation_tour" }, { key: "B", label: "Otra pregunta", next: "questions_menu" }, { key: "C", label: "Menú principal", next: "first" }],
    active: true,
  },
  {
    id: "faq_weather",
    message: "Seguridad primero: con lluvia fuerte, río crecido o terreno inestable no se ingresa al cañón. El equipo evalúa y propone reprogramar o una alternativa segura.",
    kind: "menu",
    options: [{ key: "A", label: "Ver alternativas", next: "reservation_tour" }, { key: "B", label: "Otra pregunta", next: "questions_menu" }, { key: "C", label: "Hablar con un agente", next: "human_name" }],
    active: true,
  },
  {
    id: "faq_children",
    message: "Depende de la edad, condición física y experiencia. Para Ciudad Esmeralda el equipo debe revisar el grupo antes de aceptar la solicitud.",
    kind: "menu",
    options: [{ key: "A", label: "Solicitar revisión", next: "human_name" }, { key: "B", label: "Otra pregunta", next: "questions_menu" }, { key: "C", label: "Menú principal", next: "first" }],
    active: true,
  },
  {
    id: "human_name",
    message: "Con gusto le paso la solicitud al equipo. ¿Cuál es su nombre?",
    kind: "input",
    capture: { path: "customer.name", type: "text", min: 2, max: 120, next: "human_phone" },
    active: true,
  },
  {
    id: "human_phone",
    message: "¿Cuál es su teléfono con código de país?",
    kind: "input",
    capture: { path: "customer.phone", type: "phone", next: "human_ready" },
    active: true,
  },
  {
    id: "human_ready",
    message: "Listo, su solicitud quedó marcada para seguimiento humano. Si es urgente, también puede escribirnos por WhatsApp.",
    kind: "terminal",
    options: [{ key: "A", label: "Volver al menú", next: "first" }],
    statusOnEnter: "human_requested",
    active: true,
  },
];

const FAQ_SEEDS: Omit<ConversationFaq, "updatedAt">[] = [
  {
    id: "what-to-bring",
    question: "¿Qué debo llevar?",
    answer: "Traiga ropa para mojar, zapatos cerrados con buen agarre, cambio de ropa, toalla, agua, bloqueador y repelente.",
    keywords: ["llevar", "llevo", "ropa", "zapatos", "calzado", "toalla", "bloqueador", "repelente", "equipo"],
    category: "preparation",
    priority: 90,
    active: true,
  },
  {
    id: "duration",
    question: "¿Cuánto dura el tour?",
    answer: "Ciudad Esmeralda dura aproximadamente de 3 a 4 horas, según el ritmo del grupo y las condiciones seguras.",
    keywords: ["duracion", "dura", "horas", "tiempo", "tarda"],
    category: "duration",
    priority: 80,
    active: true,
  },
  {
    id: "price",
    question: "¿Cuánto cuesta?",
    answer: "El precio depende del tour, paquete, fecha, personas y extras. El configurador oficial muestra la tarifa vigente antes del pago.",
    keywords: ["precio", "cuesta", "costo", "tarifa", "valor", "pago", "pagar"],
    category: "price",
    priority: 100,
    active: true,
  },
  {
    id: "location",
    question: "¿Dónde están ubicados?",
    answer: "Estamos en Sucre de San Carlos, Alajuela. En Google Maps o Waze puede buscar “La Vieja Adventures”.",
    keywords: ["ubicacion", "ubicados", "donde", "direccion", "llegar", "waze", "maps", "sucre"],
    category: "location",
    priority: 80,
    active: true,
  },
  {
    id: "weather",
    question: "¿Qué pasa si llueve?",
    answer: "Seguridad primero: con lluvia fuerte, río crecido o terreno inestable no se ingresa al cañón. El equipo evalúa y propone reprogramar o una alternativa segura.",
    keywords: ["lluvia", "llueve", "clima", "rio", "crecido", "tormenta", "seguridad"],
    category: "weather",
    priority: 120,
    active: true,
  },
  {
    id: "children",
    question: "¿Pueden ir niños?",
    answer: "Depende de la edad, condición física y experiencia. Para Ciudad Esmeralda el equipo debe revisar el grupo antes de aceptar la solicitud.",
    keywords: ["ninos", "ninas", "menor", "menores", "edad", "familia", "hijos"],
    category: "children",
    priority: 110,
    active: true,
  },
  {
    id: "transport",
    question: "¿Necesito vehículo 4x4 o hay transporte?",
    answer: "La necesidad de transporte depende del punto de salida y del tour. Indíquenos si llega por cuenta propia o si requiere coordinación; el equipo confirmará la opción disponible.",
    keywords: ["transporte", "carro", "vehiculo", "4x4", "bus", "recoger", "traslado"],
    category: "transport",
    priority: 75,
    active: true,
  },
];

function sessions(db: Db): Collection<ConversationSession> {
  return db.collection<ConversationSession>(COLLECTIONS.CONVERSATION_SESSIONS);
}

function steps(db: Db): Collection<ConversationStep> {
  return db.collection<ConversationStep>(COLLECTIONS.CONVERSATION_STEPS);
}

function faqs(db: Db): Collection<ConversationFaq> {
  return db.collection<ConversationFaq>(COLLECTIONS.CONVERSATION_FAQS);
}

function messages(db: Db): Collection<ConversationMessage> {
  return db.collection<ConversationMessage>(COLLECTIONS.CONVERSATION_MESSAGES);
}

async function setup(db: Db) {
  if (!setupPromise) {
    setupPromise = (async () => {
      await Promise.all([
        steps(db).createIndex({ id: 1 }, { unique: true, name: "unique_step_id" }),
        sessions(db).createIndex({ sessionId: 1 }, { unique: true, name: "unique_conversation_session" }),
        sessions(db).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "conversation_session_ttl" }),
        sessions(db).createIndex({ status: 1, updatedAt: -1 }, { name: "status_updated" }),
        faqs(db).createIndex({ id: 1 }, { unique: true, name: "unique_faq_id" }),
        faqs(db).createIndex({ active: 1, keywords: 1, priority: -1 }, { name: "active_faq_keywords" }),
        messages(db).createIndex({ sessionId: 1, createdAt: 1 }, { name: "session_timeline" }),
        messages(db).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "conversation_message_ttl" }),
      ]);
      const now = new Date();
      const existing = await steps(db)
        .find({ id: { $in: STEP_SEEDS.map((step) => step.id) } })
        .project<{ id: string; seedVersion?: number }>({ id: 1, seedVersion: 1 })
        .toArray();
      const versions = new Map(existing.map((step) => [step.id, step.seedVersion ?? 0]));
      const pendingSeeds = STEP_SEEDS.filter((step) => (versions.get(step.id) ?? 0) < STEP_SEED_VERSION);
      if (pendingSeeds.length > 0) {
        await steps(db).bulkWrite(
          pendingSeeds.map((step) => ({
            updateOne: {
              filter: { id: step.id },
              update: { $set: { ...step, seedVersion: STEP_SEED_VERSION, updatedAt: now } },
              upsert: true,
            },
          })),
          { ordered: false },
        );
      }
      const existingFaqs = await faqs(db)
        .find({ id: { $in: FAQ_SEEDS.map((faq) => faq.id) } })
        .project<{ id: string; seedVersion?: number }>({ id: 1, seedVersion: 1 })
        .toArray();
      const faqVersions = new Map(existingFaqs.map((faq) => [faq.id, faq.seedVersion ?? 0]));
      const pendingFaqs = FAQ_SEEDS.filter((faq) => (faqVersions.get(faq.id) ?? 0) < FAQ_SEED_VERSION);
      if (pendingFaqs.length > 0) {
        await faqs(db).bulkWrite(
          pendingFaqs.map((faq) => ({
            updateOne: {
              filter: { id: faq.id },
              update: { $set: { ...faq, seedVersion: FAQ_SEED_VERSION, updatedAt: now } },
              upsert: true,
            },
          })),
          { ordered: false },
        );
      }
    })().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }
  await setupPromise;
}

function expiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_TTL_DAYS);
  return date;
}

function createSession(sessionId: string): ConversationSession {
  const now = new Date();
  return {
    sessionId,
    currentStep: "first",
    customer: { name: null, phone: null, language: "es" },
    reservation: { ...EMPTY_RESERVATION },
    status: "active",
    createdAt: now,
    updatedAt: now,
    expiresAt: expiryDate(),
  };
}

function publicStep(step: ConversationStep): PublicConversationStep {
  return {
    id: step.id,
    message: step.message,
    kind: step.kind,
    inputType: step.capture?.type,
    options: (step.options ?? []).map(({ key, label }) => ({ key, label })),
  };
}

function setByPath(target: ConversationSession, path: string, value: unknown) {
  const parts = path.split(".");
  let cursor: Record<string, unknown> = target as unknown as Record<string, unknown>;
  for (const part of parts.slice(0, -1)) {
    const next = cursor[part];
    if (!next || typeof next !== "object") throw new Error(`Invalid conversation capture path: ${path}`);
    cursor = next as Record<string, unknown>;
  }
  cursor[parts.at(-1)!] = value;
}

function parseInput(type: ConversationInputType, raw: string, step: ConversationStep, session: ConversationSession) {
  const value = raw.trim();
  if (type === "text") {
    if (value.length < (step.capture?.min ?? 1) || value.length > (step.capture?.max ?? 500)) return null;
    return value;
  }
  if (type === "phone") {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15 ? value : null;
  }
  if (type === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254 ? value.toLowerCase() : null;
  }
  if (type === "integer") {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= (step.capture?.min ?? 0) && parsed <= (step.capture?.max ?? 999) ? parsed : null;
  }
  if (type === "ages") {
    const ages = value.split(/[,;\s]+/).filter(Boolean).map(Number);
    const valid = ages.length > 0 && ages.every((age) => Number.isInteger(age) && age >= 0 && age <= 100);
    return valid && (!session.reservation.people || ages.length === session.reservation.people) ? ages : null;
  }
  if (type === "date") {
    return isDateOnOrAfterMinBookableInCostaRica(value) ? value : null;
  }
  return null;
}

async function getStep(db: Db, id: string) {
  const step = await steps(db).findOne({ id, active: true });
  if (!step) throw new Error(`Conversation step not found: ${id}`);
  if (id === "reservation_tour") {
    const tours = await readPublicTours();
    step.options = tours.slice(0, 24).map((tour, index) => ({
      key: String.fromCharCode(65 + index),
      label: tour.titleEs,
      next: "reservation_date",
      set: { path: "reservation.tour", value: tour.slug },
    }));
  }
  return step;
}

async function getTourKnowledge(): Promise<AssistantTourKnowledge[]> {
  const tours = await readPublicTours();
  return tours.map((tour) => {
    const content = getTourContent(tour.slug);
    return {
      slug: tour.slug,
      title: tour.titleEs,
      aliases: [tour.titleEn, tour.tagEs, tour.tagEn].filter((value): value is string => Boolean(value)),
      description: tour.descriptionEs ?? "",
      duration: tour.duration,
      difficulty: tour.difficulty,
      location: tour.location,
      inclusions: [...(tour.inclusions ?? []), ...(content?.included ?? [])],
      exclusions: [...(tour.exclusions ?? []), ...(content?.notIncluded ?? [])],
      restrictions: tour.restrictions,
      cancellationPolicy: tour.cancellationPolicy,
      packages: (tour.packages ?? []).map((pkg) => ({
        id: pkg.id,
        name: pkg.nameEs ?? pkg.name,
        description: pkg.descriptionEs,
        includes: pkg.includes ?? [],
        departureTimes: pkg.departureTimes ?? [],
        scheduleNote: pkg.scheduleNote,
      })),
      highlights: content?.highlights ?? [],
      itinerary: content?.itinerary ?? [],
      whatToBring: content?.whatToBring ?? [],
      goodToKnow: content?.goodToKnow ?? [],
      faqs: (content?.faqs ?? []).map((faq) => ({ question: faq.q, answer: faq.a })),
    };
  });
}

function response(step: ConversationStep, session: ConversationSession, reply = step.message): ConversationResponse {
  return {
    reply,
    step: publicStep(step),
    reservation: session.reservation,
    status: session.status,
    readyForCheckout: session.status === "ready_for_checkout",
  };
}

const RESERVATION_FLOW: Array<{ step: string; field: keyof ConversationReservation }> = [
  { step: "reservation_tour", field: "tour" },
  { step: "reservation_date", field: "date" },
  { step: "reservation_time", field: "time" },
  { step: "reservation_people", field: "people" },
  { step: "reservation_ages", field: "ages" },
  { step: "reservation_fitness", field: "fitness" },
  { step: "reservation_package", field: "package" },
  { step: "reservation_transport", field: "transport" },
  { step: "reservation_lunch", field: "lunch" },
  { step: "reservation_name", field: "name" },
  { step: "reservation_email", field: "email" },
  { step: "reservation_phone", field: "phone" },
];

function fieldIsComplete(reservation: ConversationReservation, field: keyof ConversationReservation) {
  const value = reservation[field];
  if (field === "ages") {
    return Array.isArray(value)
      && value.length > 0
      && value.length === reservation.people
      && value.every((age) => Number.isInteger(age) && age >= 0 && age <= 100);
  }
  return value != null && value !== "";
}

async function nextMissingReservationStep(db: Db, session: ConversationSession, startStep = "reservation_tour") {
  const startIndex = Math.max(0, RESERVATION_FLOW.findIndex(({ step }) => step === startStep));
  for (const item of RESERVATION_FLOW.slice(startIndex)) {
    if (!fieldIsComplete(session.reservation, item.field)) return getStep(db, item.step);
  }
  return getStep(db, "reservation_review");
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}+]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

async function findFaq(db: Db, query: string) {
  const tokens = normalizeSearchText(query);
  if (tokens.length === 0) return null;
  const candidates = await faqs(db)
    .find({ active: true, keywords: { $in: tokens } })
    .sort({ priority: -1 })
    .limit(12)
    .toArray();
  return candidates
    .map((faq) => ({
      faq,
      score: faq.keywords.reduce((total, keyword) => total + (tokens.includes(keyword) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score || b.faq.priority - a.faq.priority)
    .at(0)?.faq ?? null;
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function validPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function applyReservationPatch(
  session: ConversationSession,
  patch: Partial<ConversationReservation>,
  validTourSlugs: Set<string>,
) {
  const recovered: string[] = [];
  const reservation = session.reservation;
  const set = <K extends keyof ConversationReservation>(field: K, value: ConversationReservation[K]) => {
    reservation[field] = value;
    recovered.push(field);
  };

  const tourAliases: Record<string, string> = {
    "ciudad-esmeralda": "tour-ciudad-esmeralda",
    "pozas-cristalinas": "cascadas-secretas-rio-la-vieja",
    "cloud-forest-explorer": "caminata-volcanes-dormidos",
  };
  const packageAliases: Record<string, string> = {
    "paquete-esencial": "essential-package",
    "paquete-con-almuerzo": "lunch-package",
    "paquete-privado": "private-package",
  };
  const normalizedTour = tourAliases[patch.tour ?? ""] ?? patch.tour;
  const normalizedPackage = packageAliases[patch.package ?? ""] ?? patch.package;
  const rawTime = patch.time as string | null | undefined;
  const normalizedTime = rawTime === "8:00" ? "08:00" : rawTime === "9:00" ? "09:00" : rawTime;
  const normalizedTransport = ["yes", "si", "sí", "true"].includes(patch.transport ?? "") ? "required"
    : ["no", "false"].includes(patch.transport ?? "") ? "self" : patch.transport;
  const normalizedLunch = ["si", "sí", "true", "included"].includes(patch.lunch ?? "") ? "yes"
    : ["false", "none"].includes(patch.lunch ?? "") ? "no" : patch.lunch;

  if (normalizedTour && validTourSlugs.has(normalizedTour)) set("tour", normalizedTour);
  if (patch.date && isDateOnOrAfterMinBookableInCostaRica(patch.date)) set("date", patch.date);
  if (normalizedTime && ["08:00", "09:00", "10:00"].includes(normalizedTime)) {
    set("time", normalizedTime as ConversationReservation["time"]);
  }
  if (Number.isInteger(patch.people) && patch.people! >= 1 && patch.people! <= 20) set("people", patch.people!);
  if (Array.isArray(patch.ages) && patch.ages.length > 0 && patch.ages.every((age) => Number.isInteger(age) && age >= 0 && age <= 100)) set("ages", patch.ages);
  if (patch.fitness && ["active", "moderate", "needs-review"].includes(patch.fitness)) set("fitness", patch.fitness);
  if (normalizedPackage && ["essential-package", "lunch-package", "private-package"].includes(normalizedPackage)) set("package", normalizedPackage);
  if (normalizedTransport && ["required", "self"].includes(normalizedTransport)) set("transport", normalizedTransport);
  if (normalizedLunch && ["yes", "no"].includes(normalizedLunch)) set("lunch", normalizedLunch);
  if (patch.name && patch.name.trim().length >= 2 && patch.name.length <= 120) set("name", patch.name.trim());
  if (patch.email && validEmail(patch.email)) set("email", patch.email.trim().toLowerCase());
  if (patch.phone && validPhone(patch.phone)) set("phone", patch.phone.trim());

  if (reservation.package === "lunch-package" && reservation.lunch !== "yes") set("lunch", "yes");
  if (reservation.people && reservation.ages.length !== reservation.people) reservation.ages = [];
  if (reservation.name) session.customer.name = reservation.name;
  if (reservation.phone) session.customer.phone = reservation.phone;
  return [...new Set(recovered)];
}

async function saveTurn(
  db: Db,
  sessionId: string,
  stepId: string,
  userContent: string,
  assistantContent: string,
  source: ConversationMessage["source"],
) {
  const createdAt = new Date();
  const expiresAt = expiryDate();
  try {
    await messages(db).insertMany([
      { sessionId, role: "user", content: userContent, source, stepId, createdAt, expiresAt },
      { sessionId, role: "assistant", content: assistantContent, source, stepId, createdAt: new Date(createdAt.getTime() + 1), expiresAt },
    ]);
  } catch (error) {
    console.error("[conversation/messages]", error);
  }
}

async function notifyHumanFollowup(db: Db, session: ConversationSession) {
  if (session.status !== "human_requested") return;
  const attemptedAt = new Date();
  const claimed = await sessions(db).findOneAndUpdate(
    {
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      status: "human_requested",
      $or: [
        { humanNotification: { $exists: false } },
        { "humanNotification.status": "failed" },
      ],
    },
    {
      $set: {
        humanNotification: {
          status: "sending",
          attemptedAt,
        },
      },
    },
    { returnDocument: "after" },
  );
  if (!claimed) return;

  const result = await sendConversationFollowupEmail(claimed);
  if (result.sent) {
    await sessions(db).updateOne(
      { sessionId: session.sessionId, createdAt: session.createdAt },
      {
        $set: {
          humanNotification: {
            status: "sent",
            attemptedAt,
            sentAt: new Date(),
            resendId: result.id,
          },
        },
      },
    );
    return;
  }

  await sessions(db).updateOne(
    { sessionId: session.sessionId, createdAt: session.createdAt },
    {
      $set: {
        humanNotification: {
          status: "failed",
          attemptedAt,
          error: result.reason.slice(0, 300),
        },
      },
    },
  );
}

export async function runConversation(
  db: Db,
  input: {
    sessionId: string;
    message?: string;
    optionKey?: string;
    reset?: boolean;
    prefill?: Partial<ConversationReservation>;
    requestId?: string;
  },
): Promise<ConversationResponse> {
  await setup(db);
  await setupSiteKnowledge(db);
  const tourKnowledge = await getTourKnowledge();
  const validTourSlugs = new Set(tourKnowledge.map((tour) => tour.slug));
  const collection = sessions(db);
  let session = await collection.findOne({ sessionId: input.sessionId }) as ConversationSession | null;
  if (!session || input.reset) {
    session = createSession(input.sessionId);
    await collection.replaceOne({ sessionId: input.sessionId }, session, { upsert: true });
    if (input.reset) await messages(db).deleteMany({ sessionId: input.sessionId });
  } else if (session.reservation.time === undefined) {
    session.reservation.time = null;
  }

  let currentStep = await getStep(db, session.currentStep);
  const recoveredFields = input.prefill
    ? applyReservationPatch(session, input.prefill, validTourSlugs)
    : [];
  if (recoveredFields.length > 0) {
    currentStep = await nextMissingReservationStep(db, session);
    session.currentStep = currentStep.id;
    session.status = "active";
    session.updatedAt = new Date();
    session.expiresAt = expiryDate();
    await collection.replaceOne({ sessionId: session.sessionId }, session, { upsert: true });
  }
  if (!input.message && !input.optionKey) {
    await notifyHumanFollowup(db, session);
    const notificationState = session.status === "human_requested"
      ? await collection.findOne({ sessionId: session.sessionId }, { projection: { humanNotification: 1 } })
      : null;
    const history = (await messages(db)
      .find({ sessionId: session.sessionId })
      .sort({ createdAt: -1 })
      .limit(60)
      .project<Pick<ConversationMessage, "role" | "content">>({ _id: 0, role: 1, content: 1 })
      .toArray())
      .reverse();
    return {
      ...response(currentStep, session),
      recoveredFields,
      history,
      humanNotificationStatus: notificationState?.humanNotification?.status,
    };
  }

  let nextStepId: string | null = null;
  let replyOverride: string | null = null;
  let answerSource: ConversationMessage["source"] = "state-machine";
  const userContent = (input.message ?? input.optionKey ?? "").trim();
  const messageTokens = normalizeSearchText(userContent);
  const requestsHuman = !currentStep.id.startsWith("human_")
    && messageTokens.some((token) => ["agente", "persona", "humano", "asesor"].includes(token));

  if (requestsHuman) {
    nextStepId = session.customer.name ? "human_phone" : "human_name";
    replyOverride = "Con gusto. Guardé lo que llevamos y le ayudo a dejar el contacto para el equipo.";
  } else if (currentStep.kind === "menu" || currentStep.kind === "terminal") {
    const selected = currentStep.options?.find(
      (option) => option.key.toUpperCase() === (input.optionKey ?? input.message ?? "").trim().toUpperCase(),
    );
    if (!selected) {
      const faq = await findFaq(db, userContent);
      if (faq) {
        currentStep = await getStep(db, "questions_menu");
        nextStepId = currentStep.id;
        replyOverride = faq.answer;
        answerSource = "mongodb-faq";
      } else {
        const tokens = normalizeSearchText(userContent);
        if (tokens.length <= 2 && tokens.some((token) => ["reservar", "reserva", "cotizar"].includes(token))) {
          currentStep = await nextMissingReservationStep(db, session);
          nextStepId = currentStep.id;
          replyOverride = "¡Con gusto! Retomemos justo en el primer dato que hace falta.";
        } else if (tokens.some((token) => ["agente", "persona", "humano", "asesor"].includes(token))) {
          currentStep = await getStep(db, session.customer.name ? "human_phone" : "human_name");
          nextStepId = currentStep.id;
        } else {
          const faqContext = await faqs(db).find({ active: true }).sort({ priority: -1 }).limit(12).toArray();
          const siteKnowledge = await searchSiteKnowledge(db, userContent);
          const interpreted = await interpretWithOpenAI({
            message: userContent,
            currentStep: currentStep.id,
            reservation: session.reservation,
            faqs: faqContext,
            tours: tourKnowledge,
            siteKnowledge,
            sessionId: session.sessionId,
          });
          if (!interpreted) {
            replyOverride = "No logré ubicar esa consulta todavía. Puede elegir una opción o pedir hablar con el equipo.";
          } else {
            answerSource = "openai";
            recoveredFields.push(...applyReservationPatch(
              session,
              interpreted.fields as Partial<ConversationReservation>,
              validTourSlugs,
            ));
            replyOverride = interpreted.reply || null;
            if (interpreted.intent === "booking") currentStep = await nextMissingReservationStep(db, session);
            else if (interpreted.intent === "human") currentStep = await getStep(db, session.customer.name ? "human_phone" : "human_name");
            else if (interpreted.intent === "question") currentStep = await getStep(db, "questions_menu");
            nextStepId = currentStep.id;
          }
        }
      }
    } else {
      if (selected.faqId) {
        const faq = await faqs(db).findOne({ id: selected.faqId, active: true });
        if (faq) {
          replyOverride = faq.answer;
          answerSource = "mongodb-faq";
        }
      }
      if (selected.resetReservation) {
        session.reservation = { ...EMPTY_RESERVATION, ages: [] };
        session.status = "active";
      }
      if (selected.set) {
        setByPath(session, selected.set.path, selected.set.value);
        if (selected.set.path === "reservation.package" && selected.set.value === "lunch-package") {
          session.reservation.lunch = "yes";
        }
      }
      nextStepId = selected.next;
    }
  } else if (currentStep.kind === "input" && currentStep.capture) {
    if (currentStep.id === "questions_freeform") {
      const faq = await findFaq(db, userContent);
      currentStep = await getStep(db, "questions_menu");
      nextStepId = currentStep.id;
      if (faq) {
        replyOverride = faq.answer;
        answerSource = "mongodb-faq";
      } else {
        const faqContext = await faqs(db).find({ active: true }).sort({ priority: -1 }).limit(12).toArray();
        const siteKnowledge = await searchSiteKnowledge(db, userContent);
        const interpreted = await interpretWithOpenAI({
          message: userContent,
          currentStep: "questions_freeform",
          reservation: session.reservation,
          faqs: faqContext,
          tours: tourKnowledge,
          siteKnowledge,
          sessionId: session.sessionId,
        });
        replyOverride = interpreted?.reply || "Esa consulta necesita confirmación del equipo para no inventarle información.";
        answerSource = interpreted ? "openai" : "state-machine";
      }
    } else {
      const parsed = parseInput(currentStep.capture.type, input.message ?? "", currentStep, session);
      if (parsed === null) {
        const invalidReply = currentStep.capture.invalidMessage ?? "Ese dato no parece válido. Inténtelo nuevamente.";
        await saveTurn(db, session.sessionId, currentStep.id, userContent, invalidReply, "state-machine");
        return { ...response(currentStep, session, invalidReply), answerSource: "state-machine" };
      }
      setByPath(session, currentStep.capture.path, parsed);
      if (currentStep.capture.path === "reservation.name") session.customer.name = String(parsed);
      if (currentStep.capture.path === "reservation.phone") session.customer.phone = String(parsed);
      if (currentStep.capture.path === "reservation.people" && session.reservation.ages.length !== Number(parsed)) {
        session.reservation.ages = [];
      }
      if (currentStep.capture.path === "reservation.people" && Number(parsed) > 12) {
        replyOverride = "Para un grupo así de bonito —ya eso parece paseo de toda la familia— el equipo prepara una atención personalizada.";
        nextStepId = session.customer.name ? "human_phone" : "human_name";
      } else {
        nextStepId = currentStep.capture.next;
      }
    }
  }

  if (!nextStepId) {
    const fallback = replyOverride ?? currentStep.message;
    await saveTurn(db, session.sessionId, currentStep.id, userContent, fallback, answerSource);
    return { ...response(currentStep, session, fallback), answerSource };
  }
  currentStep = await getStep(db, nextStepId);
  if (currentStep.id.startsWith("reservation_") && !["reservation_review", "reservation_ready"].includes(currentStep.id)) {
    currentStep = await nextMissingReservationStep(db, session, currentStep.id);
  }
  if (currentStep.id === "human_name" && session.customer.name) currentStep = await getStep(db, "human_phone");
  if (currentStep.id === "human_phone" && session.customer.phone) currentStep = await getStep(db, "human_ready");
  session.currentStep = currentStep.id;
  session.status = currentStep.statusOnEnter ?? "active";
  session.lastRequestId = input.requestId ?? null;
  session.updatedAt = new Date();
  session.expiresAt = expiryDate();

  await collection.replaceOne({ sessionId: session.sessionId }, session, { upsert: true });
  await notifyHumanFollowup(db, session);
  const notificationState = session.status === "human_requested"
    ? await collection.findOne({ sessionId: session.sessionId }, { projection: { humanNotification: 1 } })
    : null;
  const finalReply = replyOverride ?? currentStep.message;
  await saveTurn(db, session.sessionId, currentStep.id, userContent, finalReply, answerSource);
  return {
    ...response(currentStep, session, finalReply),
    answerSource,
    recoveredFields: [...new Set(recoveredFields)],
    humanNotificationStatus: notificationState?.humanNotification?.status,
  };
}
