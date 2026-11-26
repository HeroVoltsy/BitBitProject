import type { Category, EventItem, Occupation } from "./types";

export interface ApiEvent {
  id: number;
  host_id: number;
  host_name: string;
  title: string;
  category: string;
  starts_at: string;
  ends_at: string | null;
  location: string;
  description: string | null;
  promoted: boolean;
  latitude: number | null;
  longitude: number | null;
  cover_image_url: string | null;
  status: string;
  going: number;
  registered: boolean;
  staff_count: number;
  liked: boolean;
  audiences: Occupation[] | null;
}
export interface EventInput {
  title: string;
  category: Category;
  starts_at: string;
  ends_at: string;
  location: string;
  description: string;
  promoted: boolean;
  audiences: Occupation[];
}
export function eventItem(event: ApiEvent, userId?: number): EventItem {
  const start = new Date(event.starts_at);
  return {
    id: String(event.id),
    hostId: event.host_id,
    title: event.title,
    category: event.category as Category,
    monthLabel: start
      .toLocaleDateString("en-US", { month: "short" })
      .toUpperCase(),
    day: String(start.getDate()),
    dateLine:
      start.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      " \u00b7 " +
      start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    startsAt: event.starts_at,
    endsAt: event.ends_at ?? undefined,
    ended: Date.now() > new Date(event.ends_at ?? event.starts_at).getTime(),
    location: event.location,
    going: event.going,
    hosting: event.host_id === userId,
    attending: event.registered,
    hostName: event.host_name,
    description: event.description ?? "",
    audiences: event.audiences ?? [],
    staffCount: event.staff_count,
    liked: event.liked,
    coverImageUrl: event.cover_image_url ?? undefined,
    latitude: event.latitude,
    longitude: event.longitude,
  };
}
export function ticketToken(payload: string, eventId: string): string {
  const match = /^BITBIT:TICKET:(\d+):([A-Za-z0-9_-]{20,300})$/.exec(
    payload.trim(),
  );
  if (!match)
    throw new Error("This is not a valid Sali Ka attendance QR code.");
  if (match[1] !== eventId)
    throw new Error("This ticket belongs to a different event.");
  return match[2];
}
