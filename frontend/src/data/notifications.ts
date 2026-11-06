import type { EventItem } from "../types";

/**
 * Bell-menu notifications. Sample data only: the backend will decide when
 * reminders are sent (e.g. 1 day and 1 hour before) and return each
 * notification with the `eventId` it is about.
 */
export interface AppNotification {
  /** Stable id, used to track which notifications have been seen. */
  id: string;
  title: string;
  meta: string;
  /** The event this notification is about; clicking opens its page. */
  eventId?: string;
}

/** Other activity the demo user receives (not generated from joins). */
export const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: "host-reminder-naga-sunday-market",
    title: "Naga Sunday Market starts soon",
    meta: "Today · 10:00 AM · Plaza Rizal",
    eventId: "naga-sunday-market",
  },
  {
    id: "going-naga-sunday-market-maria",
    title: "Maria Santos is now going to your event",
    meta: "Naga Sunday Market · 2h ago",
    eventId: "naga-sunday-market",
  },
  {
    id: "new-acoustic-avenue",
    title: "New event near you: Acoustic Nights",
    meta: "Yesterday · Magsaysay Ave",
    eventId: "acoustic-avenue",
  },
];

/** "Plaza Rizal, Naga City" -> "Plaza Rizal" */
const shortPlace = (loc: string) => loc.split(",")[0];

/** One reminder per event the user is going to. */
export function remindersFor(events: EventItem[]): AppNotification[] {
  return events.map((e) => ({
    id: `reminder-${e.id}`,
    title: `Reminder: ${e.title}`,
    meta: `${e.dateLine} · ${shortPlace(e.location)}`,
    eventId: e.id,
  }));
}
