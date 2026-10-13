import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { DatePicker } from "../components/DatePicker";
import { CATEGORIES, FEED_EVENTS } from "../data/events";
import type { Category, EventItem } from "../types";

// Month label (e.g. "AUG") -> 0-indexed month, for matching a picked date.
const MONTH_IDX: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

export function HomeScreen({ onOpenEvent }: { onOpenEvent: (e: EventItem) => void }) {
  const [active, setActive] = useState<Category | "All">("All");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("All");
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Distinct filter options derived from the sample data.
  const locations = useMemo(
    () => Array.from(new Set(FEED_EVENTS.map((e) => e.location))),
    []
  );

  const feed = FEED_EVENTS.filter((e) => {
    if (e.hosting) return false; // your own hosted events don't show in the feed
    const q = query.trim().toLowerCase();
    const byCat = active === "All" || e.category === active;
    const byQuery =
      q === "" || e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
    const byLoc = location === "All" || e.location === location;
    const byDate =
      !filterDate ||
      (Number(e.day) === filterDate.getDate() && MONTH_IDX[e.monthLabel] === filterDate.getMonth());
    return byCat && byQuery && byLoc && byDate;
  });

  const activeCount =
    (active !== "All" ? 1 : 0) + (location !== "All" ? 1 : 0) + (filterDate ? 1 : 0);

  const clearAll = () => {
    setActive("All");
    setLocation("All");
    setFilterDate(null);
  };

  return (
    <div className="page">
      <div className="home-toolbar">
        <div className="home-search">
          <Search size={18} strokeWidth={2} className="muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events near you"
            aria-label="Search events near you"
          />
        </div>
        <button
          className={`btn-ghost home-filter-btn ${filterOpen ? "home-filter-btn--open" : ""}`}
          onClick={() => setFilterOpen((v) => !v)}
          aria-expanded={filterOpen}
        >
          <SlidersHorizontal size={18} strokeWidth={2.2} />
          Filters
          {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
        </button>
      </div>

      {filterOpen && (
        <div className="filter-panel card">
          <div className="filter-grid">
            <label className="filter-field">
              <span>Category</span>
              <select
                className="input"
                value={active}
                onChange={(e) => setActive(e.target.value as Category | "All")}
              >
                <option value="All">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-field">
              <span>Location</span>
              <select
                className="input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="All">All locations</option>
                {locations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-field">
              <span>Date</span>
              <DatePicker value={filterDate} onChange={setFilterDate} placeholder="Any date" />
            </label>
          </div>

          <div className="filter-actions">
            <button className="filter-clear" onClick={clearAll} disabled={activeCount === 0}>
              <X size={15} strokeWidth={2.4} /> Clear filters
            </button>
          </div>
        </div>
      )}

      <div className="pills" role="tablist" aria-label="Event categories">
        <Pill label="All" active={active === "All"} onClick={() => setActive("All")} />
        {CATEGORIES.map((c) => (
          <Pill key={c} label={c} active={active === c} onClick={() => setActive(c)} />
        ))}
      </div>

      <section className="block">
        <h2 className="section-title block__title">Events Around You</h2>
        <div className="feed-grid">
          {feed.map((e) => (
            <EventCard key={e.id} event={e} onOpen={() => onOpenEvent(e)} />
          ))}
        </div>
        {feed.length === 0 && <p className="empty">No events match your filters.</p>}
      </section>
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`pill ${active ? "pill--active" : ""}`}
      role="tab"
      aria-selected={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
