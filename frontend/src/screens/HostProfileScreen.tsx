import { ArrowLeft } from "lucide-react";
import { EventCard } from "../components/EventCard";
import type { EventItem } from "../types";
import { initialsOf } from "../useAuth";
export function HostProfileScreen({
  host,
  events,
  onBack,
  onOpenEvent,
}: {
  host: EventItem;
  events: EventItem[];
  onBack: () => void;
  onOpenEvent: (e: EventItem) => void;
}) {
  const name = host.hostName ?? "Organizer";
  const own = events.filter((e) => e.hostId === host.hostId);
  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={18} /> Back to event
      </button>
      <section className="host-header card">
        <span className="identity-card__avatar host-avatar">
          {initialsOf(name)}
        </span>
        <h1 className="host-name">{name}</h1>
        <p className="muted">Event organizer · {own.length} events</p>
      </section>
      <h2 className="section-title">Events by {name}</h2>
      <div className="feed-grid">
        {own.map((e) => (
          <EventCard key={e.id} event={e} onOpen={() => onOpenEvent(e)} />
        ))}
      </div>
    </div>
  );
}
