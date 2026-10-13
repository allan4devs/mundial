"use client";

export type AnalyticsEventName =
  | "page_view"
  | "click"
  | "booking_step"
  | "booking_step_completed"
  | "booking_step_blocked"
  | "booking_step_abandoned"
  | "booking_field_blur"
  | "booking_selection_changed"
  | "booking_submitted"
  | "booking_checkout_started"
  | "payment_order_created"
  | "payment_approved"
  | "payment_error"
  | "booking_completed"
  | "whatsapp_checkout_click"
  | "sinpe_checkout_selected";

export type AnalyticsPayload = {
  path?: string;
  referrer?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
};

const SESSION_STORAGE_KEY = "lva_analytics_session_id";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const next = crypto.randomUUID();
  window.localStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

function getDefaultMetadata() {
  if (typeof window === "undefined") return {};

  return {
    language: navigator.language,
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  };
}

export async function trackAnalyticsEvent(event: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    event,
    path: payload.path ?? window.location.pathname,
    referrer: payload.referrer ?? document.referrer,
    sessionId: payload.sessionId ?? getOrCreateSessionId(),
    metadata: {
      ...getDefaultMetadata(),
      ...(payload.metadata ?? {}),
    },
    happenedAt: new Date().toISOString(),
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/events", blob);
    return;
  }

  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Analytics should never crash UX.
  }
}
