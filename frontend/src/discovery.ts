import type { Category, EventItem, Occupation } from "./types";

export const OCCUPATIONS: { value: Occupation; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "professional", label: "Working professional" },
  { value: "business_owner", label: "Business owner" },
  { value: "self_employed", label: "Self-employed" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];
export interface DiscoveryProfile { occupation: Occupation; interests: Category[] }

export function normalizeDiscoveryProfile(value: unknown, categories: readonly Category[]): DiscoveryProfile | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const occupation = OCCUPATIONS.find((option) => option.value === source.occupation)?.value;
  const interests = Array.isArray(source.interests) ? categories.filter((category) => (source.interests as unknown[]).includes(category)) : [];
  return occupation && interests.length ? { occupation, interests } : null;
}

export function shouldOnboardJoiner(mode: "signup" | "login", role: "host" | "attendee" | undefined): boolean {
  return mode === "signup" && role !== "host";
}

/** Explicit interests lead; audience tags are only a small, organizer-supplied secondary signal. */
export function personalizeEvents(events: readonly EventItem[], profile: DiscoveryProfile | null): EventItem[] {
  if (!profile) return [...events];
  const interests = new Set(profile.interests);
  const score = (event: EventItem) => (interests.has(event.category) ? 10 : 0) +
    (profile.occupation !== "prefer_not_to_say" && event.audiences?.includes(profile.occupation) ? 2 : 0);
  return events.map((event, index) => ({ event, index, score: score(event) }))
    .sort((a, b) => b.score - a.score || a.index - b.index).map(({ event }) => event);
}
