import { ArrowLeft, Star } from "lucide-react";
import { RatingRow } from "../components/RatingRow";
import { HOST_STATS, ORGANIZED_EVENTS } from "../data/events";
import type { EventItem } from "../types";

export function OrganizedEventsScreen({
  onBack,
  onOpenEvent,
}: {
  onBack: () => void;
  onOpenEvent: (e: EventItem) => void;
}) {
  return (
    <div className="page page--narrow">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={18} strokeWidth={2.2} /> Back to profile
      </button>
      <h1 className="page-title">Events you've organized</h1>
      <p className="page-sub list-sub">
        {HOST_STATS.hosted} {HOST_STATS.hosted === 1 ? "event" : "events"}
        {HOST_STATS.reviews > 0 && (
          <>
            {" · "}
            <Star size={15} strokeWidth={2} fill="currentColor" className="list-sub__star" />
            {HOST_STATS.rating.toFixed(1)} avg from {HOST_STATS.reviews} reviews
          </>
        )}
      </p>

      {ORGANIZED_EVENTS.length > 0 ? (
        <div className="stack">
          {ORGANIZED_EVENTS.map((e) => (
            <RatingRow key={e.id} event={e} onOpen={() => onOpenEvent(e)} />
          ))}
        </div>
      ) : (
        <p className="empty">You haven't organized any events yet.</p>
      )}
    </div>
  );
}
