import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { listOperators } from "@/lib/models/operator";
import { listUsers } from "@/lib/models/user";
import { listLoginLogs } from "@/lib/models/login-log";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { listHeroSloganLogs } from "@/lib/models/hero-slogan-log";

type BookingAnalyticsEvent = {
  _id: string;
  event:
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
    | "booking_completed";
  path: string | null;
  sessionId: string | null;
  happenedAt: string | null;
  createdAt: string | null;
  metadata: {
    step?: string | number;
    stepLabel?: string;
    stage?: string;
    tickets?: number;
    amount?: number;
    currency?: string;
    [key: string]: unknown;
  };
  user: {
    userId?: string | null;
    email?: string | null;
    name?: string | null;
  };
  request: {
    country?: string | null;
    city?: string | null;
    deviceType?: string | null;
    browser?: string | null;
    os?: string | null;
  };
};

const BOOKING_ANALYTICS_EVENTS: BookingAnalyticsEvent["event"][] = [
  "booking_step",
  "booking_step_completed",
  "booking_step_blocked",
  "booking_step_abandoned",
  "booking_field_blur",
  "booking_selection_changed",
  "booking_submitted",
  "booking_checkout_started",
  "payment_order_created",
  "payment_approved",
  "payment_error",
  "booking_completed",
];

function isAuthorized(req: NextRequest): boolean {
  return Boolean(getAdminFromRequest(req));
}

function numberFrom(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function stringFrom(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function bookingMeta(event: BookingAnalyticsEvent) {
  const nested = event.metadata.booking && typeof event.metadata.booking === "object"
    ? event.metadata.booking as Record<string, unknown>
    : {};

  return {
    tourSlug: stringFrom(event.metadata.tourSlug) ?? stringFrom(nested.selectedTourSlug) ?? null,
    tourName: stringFrom(event.metadata.tourName) ?? stringFrom(nested.selectedTourName) ?? null,
    tourPackage: stringFrom(event.metadata.tourPackage) ?? stringFrom(nested.selectedPackage) ?? null,
    tourTime: stringFrom(event.metadata.tourTime) ?? stringFrom(nested.selectedTime) ?? null,
    date: stringFrom(event.metadata.date) ?? stringFrom(nested.selectedDate) ?? null,
    tickets: numberFrom(event.metadata.tickets) ?? numberFrom(nested.tickets),
    amount:
      numberFrom(event.metadata.amount) ??
      numberFrom(event.metadata.totalWithTaxes) ??
      numberFrom(nested.totalWithTaxes),
    currency: stringFrom(event.metadata.currency) ?? "USD",
  };
}

function isPaidAnalyticsEvent(event: BookingAnalyticsEvent) {
  const meta = bookingMeta(event);
  const status = stringFrom(event.metadata.status)?.toUpperCase();

  return (
    event.event === "payment_approved" &&
    meta.amount != null &&
    meta.amount > 0 &&
    (status === "COMPLETED" || Boolean(stringFrom(event.metadata.captureId)))
  );
}

function countBy<T>(items: T[], keyFn: (item: T) => string | null | undefined) {
  return Object.entries(
    items.reduce<Record<string, number>>((acc, item) => {
      const key = keyFn(item);
      if (!key) return acc;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function stringArrayFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

function booleanFrom(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function averageBy<T>(items: T[], keyFn: (item: T) => string | null | undefined, valueFn: (item: T) => number | null | undefined) {
  const grouped = items.reduce<Record<string, { total: number; count: number }>>((acc, item) => {
    const key = keyFn(item);
    const value = valueFn(item);
    if (!key || typeof value !== "number" || !Number.isFinite(value)) return acc;
    const current = acc[key] ?? { total: 0, count: 0 };
    current.total += value;
    current.count += 1;
    acc[key] = current;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([label, data]) => ({ label, count: Number((data.total / data.count).toFixed(1)) }))
    .sort((a, b) => b.count - a.count);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [operators, users, loginLogs, reservations, bookingAnalyticsRaw, heroSlogans] = await Promise.all([
      listOperators(),
      listUsers(),
      listLoginLogs(),
      (async () => {
        const db = await getDb();
        const docs = await db
          .collection(COLLECTIONS.RESERVATIONS)
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

        return docs.map((reservation) => ({
          _id: reservation._id.toString(),
          name: reservation.name ?? null,
          email: reservation.email ?? null,
          date: reservation.date ?? null,
          tickets: reservation.tickets ?? null,
          amount: reservation.amount ?? null,
          currency: reservation.currency ?? null,
          status: reservation.status ?? null,
          tourName: reservation.tourName ?? null,
          createdAt: reservation.createdAt
            ? reservation.createdAt.toISOString()
            : null,
        }));
      })(),
      (async (): Promise<BookingAnalyticsEvent[]> => {
        const db = await getDb();
        const docs = await db
          .collection(COLLECTIONS.ANALYTICS_EVENTS)
          .find({ event: { $in: BOOKING_ANALYTICS_EVENTS } })
          .sort({ happenedAt: -1 })
          .limit(1000)
          .toArray();

        return docs.map((eventDoc) => ({
          _id: eventDoc._id.toString(),
          event: eventDoc.event,
          path: eventDoc.path ?? null,
          sessionId: eventDoc.sessionId ?? null,
          happenedAt: eventDoc.happenedAt instanceof Date ? eventDoc.happenedAt.toISOString() : null,
          createdAt: eventDoc.createdAt instanceof Date ? eventDoc.createdAt.toISOString() : null,
          metadata: (eventDoc.metadata ?? {}) as BookingAnalyticsEvent["metadata"],
          user: {
            userId: (eventDoc.user as { userId?: string | null } | undefined)?.userId ?? null,
            email: (eventDoc.user as { email?: string | null } | undefined)?.email ?? null,
            name: (eventDoc.user as { name?: string | null } | undefined)?.name ?? null,
          },
          request: {
            country: (eventDoc.request as { country?: string | null } | undefined)?.country ?? null,
            city: (eventDoc.request as { city?: string | null } | undefined)?.city ?? null,
            deviceType: (eventDoc.request as { deviceType?: string | null } | undefined)?.deviceType ?? null,
            browser: (eventDoc.request as { browser?: string | null } | undefined)?.browser ?? null,
            os: (eventDoc.request as { os?: string | null } | undefined)?.os ?? null,
          },
        }));
      })(),
      listHeroSloganLogs(),
    ]);

    const uniqueSessions = new Set(bookingAnalyticsRaw.map((event) => event.sessionId).filter(Boolean));
    const submissions = bookingAnalyticsRaw.filter((event) => event.event === "booking_submitted");
    const checkoutStarts = bookingAnalyticsRaw.filter((event) => event.event === "booking_checkout_started");
    const paymentOrders = bookingAnalyticsRaw.filter((event) => event.event === "payment_order_created");
    const paymentApprovals = bookingAnalyticsRaw.filter((event) => event.event === "payment_approved");
    const paymentErrors = bookingAnalyticsRaw.filter((event) => event.event === "payment_error");
    const completedBookings = bookingAnalyticsRaw.filter((event) => event.event === "booking_completed");
    const blockedSteps = bookingAnalyticsRaw.filter((event) => event.event === "booking_step_blocked");
    const abandonedSteps = bookingAnalyticsRaw.filter((event) => event.event === "booking_step_abandoned");
    const fieldBlurs = bookingAnalyticsRaw.filter((event) => event.event === "booking_field_blur");
    const invalidFieldBlurs = fieldBlurs.filter((event) => event.metadata.isValid === false);
    const selectionChanges = bookingAnalyticsRaw.filter((event) => event.event === "booking_selection_changed");
    const paidAnalyticsEvents = bookingAnalyticsRaw.filter(isPaidAnalyticsEvent);
    const completedRevenue = paidAnalyticsEvents.reduce((sum, event) => sum + (bookingMeta(event).amount ?? 0), 0);
    const reservationRevenue = reservations
      .filter((reservation) => reservation.status === "COMPLETED")
      .reduce((sum, reservation) => sum + (typeof reservation.amount === "number" ? reservation.amount : 0), 0);
    const eventCounts = countBy(bookingAnalyticsRaw, (event) => event.event);
    const topTours = countBy(
      paidAnalyticsEvents,
      (event) => bookingMeta(event).tourName ?? bookingMeta(event).tourSlug
    ).slice(0, 8);
    const topPackages = countBy(
      paidAnalyticsEvents,
      (event) => bookingMeta(event).tourPackage
    ).slice(0, 8);
    const deviceBreakdown = countBy(bookingAnalyticsRaw, (event) => event.request.deviceType).slice(0, 5);
    const browserBreakdown = countBy(bookingAnalyticsRaw, (event) => event.request.browser).slice(0, 5);
    const frictionPoints = countBy(
      [
        ...blockedSteps.flatMap((event) => stringArrayFrom(event.metadata.missingKeys)),
        ...abandonedSteps
          .filter((event) => !booleanFrom(event.metadata.completed))
          .flatMap((event) => stringArrayFrom(event.metadata.missingKeys)),
        ...invalidFieldBlurs.map((event) => stringFrom(event.metadata.field) ?? "unknown_field"),
      ],
      (label) => label
    ).slice(0, 10);
    const blockedActions = countBy(blockedSteps, (event) => stringFrom(event.metadata.source) ?? "unknown").slice(0, 8);
    const stepDropoffs = countBy(
      abandonedSteps.filter((event) => !booleanFrom(event.metadata.completed)),
      (event) => stringFrom(event.metadata.stepLabel) ?? String(event.metadata.step ?? "")
    ).slice(0, 8);
    const fieldIssues = countBy(invalidFieldBlurs, (event) => stringFrom(event.metadata.field) ?? "unknown").slice(0, 8);
    const averageStepSeconds = averageBy(
      abandonedSteps,
      (event) => stringFrom(event.metadata.stepLabel) ?? String(event.metadata.step ?? ""),
      (event) => numberFrom(event.metadata.durationSeconds)
    ).slice(0, 8);
    const selectionBreakdown = countBy(
      selectionChanges,
      (event) => {
        const field = stringFrom(event.metadata.field);
        const value = stringFrom(event.metadata.value);
        return field ? `${field}${value ? `: ${value}` : ""}` : null;
      }
    ).slice(0, 10);
    const recentIntents = bookingAnalyticsRaw
      .filter((event) => event.event !== "booking_step" || event.metadata.stepLabel === "review")
      .slice(0, 30)
      .map((event) => ({
        _id: event._id,
        event: event.event,
        step: event.metadata.step ?? null,
        stepLabel: event.metadata.stepLabel ?? null,
        stage: event.metadata.stage ?? null,
        happenedAt: event.happenedAt,
        path: event.path,
        sessionId: event.sessionId,
        user: event.user,
        request: event.request,
        ...bookingMeta(event),
      }));

    const bookingAnalytics = {
      totalEvents: bookingAnalyticsRaw.length,
      bookingSteps: bookingAnalyticsRaw.filter((event) => event.event === "booking_step").length,
      blockedSteps: blockedSteps.length,
      abandonedSteps: abandonedSteps.length,
      fieldIssuesTotal: invalidFieldBlurs.length,
      selectionChanges: selectionChanges.length,
      bookingSubmissions: submissions.length,
      checkoutStarts: checkoutStarts.length,
      paymentOrders: paymentOrders.length,
      paymentApprovals: paymentApprovals.length,
      paymentErrors: paymentErrors.length,
      completedBookings: paidAnalyticsEvents.length || completedBookings.length,
      uniqueSessions: uniqueSessions.size,
      conversionRate:
        uniqueSessions.size > 0
          ? Number(((submissions.length / uniqueSessions.size) * 100).toFixed(2))
          : 0,
      completionRate:
        uniqueSessions.size > 0
          ? Number((((paidAnalyticsEvents.length || completedBookings.length) / uniqueSessions.size) * 100).toFixed(2))
          : 0,
      paymentApprovalRate:
        paymentOrders.length > 0
          ? Number(((paymentApprovals.length / paymentOrders.length) * 100).toFixed(2))
          : 0,
      completedRevenue,
      reservationRevenue,
      eventCounts,
      funnel: [
        { label: "Sesiones", count: uniqueSessions.size },
        { label: "Bloqueos", count: blockedSteps.length },
        { label: "Enviaron reserva", count: submissions.length },
        { label: "Checkout", count: checkoutStarts.length },
        { label: "Orden PayPal", count: paymentOrders.length },
        { label: "Pago aprobado", count: paymentApprovals.length },
        { label: "Reserva pagada", count: paidAnalyticsEvents.length || completedBookings.length },
      ],
      topTours,
      topPackages,
      deviceBreakdown,
      browserBreakdown,
      frictionPoints,
      blockedActions,
      stepDropoffs,
      fieldIssues,
      averageStepSeconds,
      selectionBreakdown,
      recentIntents,
      recentEvents: bookingAnalyticsRaw.slice(0, 200),
    };

    return NextResponse.json({ operators, users, loginLogs, reservations, bookingAnalytics, heroSlogans });
  } catch (error) {
    console.error("Admin insights error", error);
    return NextResponse.json({ error: "Failed to load admin insights." }, { status: 500 });
  }
}
