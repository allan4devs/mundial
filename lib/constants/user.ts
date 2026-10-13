import type { UserPreferences } from "@/lib/types/index";

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  notifications: {
    emailEnabled: true,
    bookingReminders: true,
    promotions: false,
    weeklySummary: false,
  },
  dashboard: {
    compactView: false,
    showSupportCard: true,
    defaultBookingTab: "upcoming",
  },
};
