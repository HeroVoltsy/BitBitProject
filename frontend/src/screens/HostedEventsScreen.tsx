import { ArrowLeft } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { FEED_EVENTS } from "../data/events";
import type { EventItem } from "../types";

export function HostedEventsScreen({
  onOpenEvent,
  onBack,
}: {
  onOpenEvent: (e: EventItem) => void;
  onBack: () => void;
}) {
  const hosted = FEED_EVENTS.filter((e) => e.hosting);

  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={18} strokeWidth={2.2} /> Back to home
      </button>
      <h1 className="page-title">Your Hosted Events</h1>
      <p className="page-sub">Events you're organizing for the community.</p>

      {hosted.length > 0 ? (
        <div className="feed-grid">
          {hosted.map((e) => (
            <EventCard key={e.id} event={e} onOpen={() => onOpenEvent(e)} />
          ))}
        </div>
      ) : (
        <p className="empty">You're not hosting any events yet.</p>
      )}
    </div>
  );
}
