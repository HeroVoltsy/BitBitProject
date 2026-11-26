import { api, ApiError } from "./api";
import type { Category, EventItem } from "./types";
export interface ApiEvent {
  id: number;
  host_id: number;
  title: string;
  category: string;
  starts_at: string;
  location: string;
  description: string | null;
  promoted: boolean;
  latitude: number | null;
  longitude: number | null;
  cover_image_url: string | null;
  status: string;
  created_at: string;
}
export interface EventInput {
  title: string;
  category: Category;
  starts_at: string;
  location: string;
  description: string;
  promoted: boolean;
  cover_image_url: string | null;
}
export interface Registration {
  id: number;
  event_id: number;
  attendee_id: number;
  status: string;
  joined_at: string;
  cancelled_at: string | null;
}
export interface Attendee {
  attendee_id: number;
  username: string;
  registration_status: string;
  joined_at: string;
  checked_in_at: string | null;
}
export interface StaffMember {
  id: number;
  event_id: number;
  user_id: number;
  status: "pending" | "accepted" | "declined";
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
      " " +
      String.fromCharCode(183) +
      " " +
      start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    startsAt: event.starts_at,
    started: start.getTime() <= Date.now(),
    ended: false,
    location: event.location,
    going: 0,
    countsAvailable: false,
    promoted: event.promoted,
    hosting: event.host_id === userId,
    hostName: `Organizer #${event.host_id}`,
    description: event.description ?? "",
    coverImageUrl: event.cover_image_url ?? undefined,
    latitude: event.latitude,
    longitude: event.longitude,
  };
}
export function ticketToken(payload: string, eventId: string) {
  const match = /^BITBIT:TICKET:(\d+):([A-Za-z0-9_-]{20,300})$/.exec(
    payload.trim(),
  );
  if (!match)
    throw new Error("This is not a valid Sali Ka attendance QR code.");
  if (match[1] !== eventId)
    throw new Error("This ticket belongs to a different event.");
  return match[2];
}
export async function attendanceSummary(eventId: string, signal?: AbortSignal) {
  const rows = await api<Attendee[]>(`/api/v1/events/${eventId}/attendees`, {
    signal,
  });
  return {
    registered: rows.length,
    checked_in: rows.filter((r) => r.checked_in_at).length,
  };
}
export async function myRegistration(eventId: string, signal?: AbortSignal) {
  try {
    return await api<Registration>(
      `/api/v1/events/${eventId}/registrations/me`,
      { signal },
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
export const ticketKey = (userId: number, eventId: string) =>
  `salika.ticket.${userId}.${eventId}`;
