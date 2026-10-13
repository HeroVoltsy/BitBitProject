import { Search, MapPin } from "lucide-react";
import { CategoryBadge } from "../components/CategoryBadge";
import { MAP_CARDS } from "../data/events";
import { useToast } from "../components/Toast";
import type { ScreenName } from "../types";

const PINS = [
  { top: "22%", left: "28%" },
  { top: "44%", left: "58%" },
  { top: "58%", left: "34%" },
  { top: "34%", left: "72%" },
  { top: "68%", left: "62%" },
];

export function MapScreen({
  onOpenEvent,
  onNavigate,
}: {
  onOpenEvent: () => void;
  onNavigate: (s: ScreenName) => void;
}) {
  const notify = useToast();
  return (
    <div className="page">
      <h1 className="page-title">Explore</h1>
      <p className="page-sub">Events mapped across your area — {MAP_CARDS.length} nearby.</p>

      <div className="map-layout">
        <div className="map-canvas card">
          <div className="map-grid" aria-hidden="true" />
          <button
            className="map-search"
            onClick={() => notify("Showing events in this area (demo)")}
          >
            <Search size={18} strokeWidth={2} className="muted" />
            <span className="muted">Search this area</span>
          </button>
          {PINS.map((p, i) => (
            <button
              key={i}
              className="map-pin-marker"
              style={p}
              aria-label={`Event location ${i + 1}`}
              onClick={onOpenEvent}
            >
              <MapPin size={26} strokeWidth={2.5} fill="currentColor" />
            </button>
          ))}
        </div>

        <aside className="map-list">
          <div className="map-list__head">
            <strong>{MAP_CARDS.length} events near you</strong>
            <button className="map-list__link" onClick={() => onNavigate("home")}>
              List View
            </button>
          </div>
          <div className="stack">
            {MAP_CARDS.map((c) => (
              <button className="map-mini card" key={c.title} onClick={onOpenEvent}>
                <div className="map-mini__head">
                  <CategoryBadge category={c.category} />
                </div>
                <span className="map-mini__title">{c.title}</span>
                <span className="map-mini__loc">
                  <MapPin size={14} strokeWidth={2} /> {c.location}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
