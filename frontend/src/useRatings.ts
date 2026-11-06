import { useCallback, useEffect, useState } from "react";

/**
 * Ratings the current user gave to past events they joined.
 * Kept in sessionStorage for the tab, like likes and joins.
 *
 * SECURITY: UX only. The server must enforce: one rating per user per event,
 * only from people who actually checked in, never by the host on their own
 * event, and it must hide the rater's identity from the host when
 * `anonymous` is true.
 */
export interface EventRating {
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string;
  anonymous: boolean;
  /** ISO date-time of the latest save. */
  ratedAt: string;
}

export const MAX_COMMENT = 500;
const KEY = "salika.ratings";

const isStars = (v: unknown): v is EventRating["stars"] =>
  v === 1 || v === 2 || v === 3 || v === 4 || v === 5;

function load(): Record<string, EventRating> {
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out: Record<string, EventRating> = {};
    for (const [id, r] of Object.entries(raw as Record<string, unknown>)) {
      const v = r as Partial<EventRating> | null;
      if (
        v &&
        isStars(v.stars) &&
        typeof v.comment === "string" &&
        typeof v.anonymous === "boolean" &&
        typeof v.ratedAt === "string"
      ) {
        out[id] = { ...v, comment: v.comment.slice(0, MAX_COMMENT) } as EventRating;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function useRatings() {
  const [ratings, setRatings] = useState(load);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(ratings));
    } catch {
      /* storage unavailable — stays in memory only */
    }
  }, [ratings]);

  const rateEvent = useCallback((eventId: string, rating: Omit<EventRating, "ratedAt">) => {
    setRatings((all) => ({
      ...all,
      [eventId]: {
        ...rating,
        comment: rating.comment.trim().slice(0, MAX_COMMENT),
        ratedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const resetRatings = useCallback(() => setRatings({}), []);

  return { ratings, rateEvent, resetRatings };
}
