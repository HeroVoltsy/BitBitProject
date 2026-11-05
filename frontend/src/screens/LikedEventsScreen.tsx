import { Heart } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { useToast } from "../components/Toast";
import type { EventItem } from "../types";

/** Attendee top-bar page: every event the user liked (♥), newest first. */
export function LikedEventsScreen({
  likedEvents,
  onOpenEvent,
  onToggleLiked,
}: {
  likedEvents: EventItem[];
  onOpenEvent: (e: EventItem) => void;
  onToggleLiked: (id: string) => void;
}) {
  const notify = useToast();

  return (
    <div className="page">
      <h1 className="page-title">Liked Events</h1>
      <p className="page-sub">Events you saved with the heart, so you can find them again.</p>

      {likedEvents.length > 0 ? (
        <div className="feed-grid">
          {likedEvents.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              onOpen={() => onOpenEvent(e)}
              liked
              onToggleLiked={() => {
                onToggleLiked(e.id);
                notify("Removed from your liked events");
              }}
            />
          ))}
        </div>
      ) : (
        <div className="liked-empty card">
          <Heart size={28} strokeWidth={2} aria-hidden="true" />
          <strong>No liked events yet</strong>
          <span className="muted">
            Tap the heart on any event to save it here, so you can find it again later.
          </span>
        </div>
      )}
    </div>
  );
}
