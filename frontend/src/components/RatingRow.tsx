import { Star } from "lucide-react";
import type { OrganizedEvent } from "../data/events";

/** One organized event with its average rating, or "No ratings yet". */
export function RatingRow({ event, onOpen }: { event: OrganizedEvent; onOpen: () => void }) {
  return (
    <button className="rating-row card" onClick={onOpen}>
      <span className="rating-row__info">
        <strong>{event.title}</strong>
        <span className="muted">
          {event.dateLabel} · {event.location}
        </span>
      </span>
      {event.reviews > 0 ? (
        <span className="rating-row__score">
          <span className="stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={15}
                strokeWidth={2}
                fill={Math.round(event.rating) >= n ? "currentColor" : "none"}
              />
            ))}
          </span>
          <span className="rating-row__val">
            {event.rating.toFixed(1)} <span className="muted">({event.reviews})</span>
          </span>
        </span>
      ) : (
        <span className="muted rating-row__none">No ratings yet</span>
      )}
    </button>
  );
}
