import { ArrowLeft } from "lucide-react";
import { EventCard } from "../components/EventCard";
import type { EventItem } from "../types";
export function OrganizedEventsScreen({
  events,
  onBack,
  onOpenEvent,
}: {
  events: EventItem[];
  onBack: () => void;
  onOpenEvent: (e: EventItem) => void;
}) {
  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="page-title">Events you've organized</h1>
      <div className="feed-grid">
        {events.map((e) => (
          <EventCard key={e.id} event={e} onOpen={() => onOpenEvent(e)} />
        ))}
      </div>
      {!events.length && <p className="empty">No events yet.</p>}
    </div>
  );
}
