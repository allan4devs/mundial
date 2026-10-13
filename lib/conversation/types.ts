export type ConversationOption = {
  key: string;
  label: string;
  next: string;
  set?: {
    path: string;
    value: string | number | boolean | null;
  };
  resetReservation?: boolean;
  faqId?: string;
};

export type ConversationInputType = "text" | "date" | "integer" | "ages" | "phone" | "email";

export type ConversationStep = {
  id: string;
  message: string;
  kind: "menu" | "input" | "terminal";
  options?: ConversationOption[];
  capture?: {
    path: string;
    type: ConversationInputType;
    next: string;
    min?: number;
    max?: number;
    invalidMessage?: string;
  };
  statusOnEnter?: "active" | "human_requested" | "ready_for_checkout";
  seedVersion?: number;
  active: boolean;
  updatedAt: Date;
};

export type ConversationReservation = {
  tour: string | null;
  date: string | null;
  time: "08:00" | "09:00" | "10:00" | null;
  people: number | null;
  ages: number[];
  fitness: string | null;
  package: string | null;
  transport: string | null;
  lunch: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
};

export type ConversationSession = {
  sessionId: string;
  currentStep: string;
  customer: {
    name: string | null;
    phone: string | null;
    language: "es";
  };
  reservation: ConversationReservation;
  status: "active" | "human_requested" | "ready_for_checkout";
  lastRequestId?: string | null;
  humanNotification?: {
    status: "sending" | "sent" | "failed";
    attemptedAt: Date;
    sentAt?: Date;
    resendId?: string | null;
    error?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
};

export type PublicConversationStep = {
  id: string;
  message: string;
  kind: ConversationStep["kind"];
  inputType?: ConversationInputType;
  options: Array<{ key: string; label: string }>;
};

export type ConversationFaq = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: "preparation" | "duration" | "price" | "location" | "weather" | "children" | "transport" | "included";
  priority: number;
  active: boolean;
  seedVersion?: number;
  updatedAt: Date;
};

export type ConversationMessage = {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  source: "state-machine" | "mongodb-faq" | "openai";
  stepId: string;
  createdAt: Date;
  expiresAt: Date;
};

export type ConversationResponse = {
  reply: string;
  step: PublicConversationStep;
  reservation: ConversationReservation;
  status: ConversationSession["status"];
  readyForCheckout: boolean;
  answerSource?: ConversationMessage["source"];
  recoveredFields?: string[];
  history?: Array<Pick<ConversationMessage, "role" | "content">>;
  humanNotificationStatus?: NonNullable<ConversationSession["humanNotification"]>["status"];
};
