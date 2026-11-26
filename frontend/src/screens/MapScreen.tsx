import { useState } from "react";
import { MapPin } from "lucide-react";
import { CategoryBadge } from "../components/CategoryBadge";
import type { EventItem } from "../types";
export function MapScreen({
  events,
  onOpenEvent,
}: {
  events: EventItem[];
  onOpenEvent: (event: EventItem) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = events.filter(
    (e) =>
      !e.ended &&
      (e.location + " " + e.title).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="page">
      <h1 className="page-title">Explore</h1>
      <p className="page-sub">Find events by location.</p>
      <label className="field">
        <span className="field__label">Search a location or event</span>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="feed-grid">
        {shown.map((e) => (
          <article className="map-mini card" key={e.id}>
            <CategoryBadge category={e.category} />
            <button className="host-link" onClick={() => onOpenEvent(e)}>
              {e.title}
            </button>
            <p>
              <MapPin size={14} /> {e.location}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.latitude != null && e.longitude != null ? `${e.latitude},${e.longitude}` : e.location)}`}
              target="_blank"
              rel="noreferrer"
            >
              View location
            </a>
          </article>
        ))}
      </div>
      {!shown.length && <p className="empty">No events match this location.</p>}
    </div>
  );
}
