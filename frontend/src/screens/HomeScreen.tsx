import { useMemo, useState } from "react";
import { CalendarDays, Search, SlidersHorizontal } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { DatePicker } from "../components/DatePicker";
import { FilterChip } from "../components/FilterChip";
import { useToast } from "../components/Toast";
import { useAuthGate } from "../components/AuthGate";
import { WelcomeBanner } from "../components/WelcomeBanner";
import { CATEGORIES, FEED_EVENTS } from "../data/events";
import type { Category, EventItem } from "../types";
import { normalizeDiscoveryProfile, personalizeEvents } from "../discovery";

// Month label (e.g. "AUG") -> 0-indexed month, for matching a picked date.
const MONTH_IDX: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

type DateFilter =
  | { kind: "today" | "tomorrow" | "weekend" }
  | { kind: "day"; date: Date }
  | null;

const DATE_PRESETS = [
  { kind: "today", label: "Today" },
  { kind: "tomorrow", label: "Tomorrow" },
  { kind: "weekend", label: "This weekend" },
] as const;

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** The calendar days a date filter covers (weekend = upcoming Sat + Sun). */
function datesFor(filter: NonNullable<DateFilter>, today: Date): Date[] {
  switch (filter.kind) {
    case "today":
      return [today];
    case "tomorrow":
      return [addDays(today, 1)];
    case "weekend": {
      const dow = today.getDay();
      if (dow === 0) return [today]; // it's Sunday: just today
      const sat = addDays(today, 6 - dow);
      return [sat, addDays(sat, 1)];
    }
    case "day":
      return [filter.date];
  }
}

function dateLabel(filter: DateFilter): string | null {
  if (!filter) return null;
  if (filter.kind === "day")
    return filter.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return DATE_PRESETS.find((p) => p.kind === filter.kind)!.label;
}

/** "Plaza Rizal, Naga City" -> "Plaza Rizal" for the compact chip label. */
const shortPlace = (loc: string) => loc.split(",")[0];

export function HomeScreen({
  onOpenEvent,
  likedIds,
  onToggleLiked,
  isAttending,
  onJoin,
  discoveryProfile,
}: {
  onOpenEvent: (e: EventItem) => void;
  likedIds: string[];
  onToggleLiked: (id: string) => void;
  isAttending: (e: EventItem) => boolean;
  onJoin: (id: string) => void;
  discoveryProfile?: unknown;
}) {
  const notify = useToast();
  const { requireAuth } = useAuthGate();

  const toggleLiked = (e: EventItem) =>
    requireAuth(() => {
      notify(likedIds.includes(e.id) ? "Removed from your liked events" : "Added to Profile → Liked");
      onToggleLiked(e.id);
    }, "Log in to save events you like.");

  // "sasali" = join straight from the card. Already going → open the event (QR lives there).
  const sasali = (e: EventItem) => {
    if (isAttending(e)) {
      onOpenEvent(e);
      return;
    }
    requireAuth(() => {
      onJoin(e.id);
      notify(`You're going to ${e.title}!`);
    }, `Log in to join ${e.title}.`);
  };

  const [active, setActive] = useState<Category | "All">("All");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  // Distinct locations (with how many events each has) from the sample data.
  const locations = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of FEED_EVENTS) {
      if (!e.hosting) counts.set(e.location, (counts.get(e.location) ?? 0) + 1);
    }
    return Array.from(counts, ([name, count]) => ({ name, count }));
  }, []);


  const filterDays = dateFilter ? datesFor(dateFilter, today) : null;
  const calendarValue =
    dateFilter && dateFilter.kind !== "weekend" ? datesFor(dateFilter, today)[0] : null;

  const profile = normalizeDiscoveryProfile(discoveryProfile, CATEGORIES);
  const feed = personalizeEvents(FEED_EVENTS, profile).filter((e) => {
    if (e.hosting) return false; // your own hosted events don't show in the feed
    const q = query.trim().toLowerCase();
    const byCat = active === "All" || e.category === active;
    const byQuery =
      q === "" || e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
    const byLoc = location === null || e.location === location;
    const byDate =
      !filterDays ||
      filterDays.some(
        (d) => Number(e.day) === d.getDate() && MONTH_IDX[e.monthLabel] === d.getMonth()
      );
    return byCat && byQuery && byLoc && byDate;
  });

  const activeCount =
    (active !== "All" ? 1 : 0) + (location !== null ? 1 : 0) + (dateFilter !== null ? 1 : 0);

  const clearAll = () => {
    setActive("All");
    setLocation(null);
    setDateFilter(null);
    setShowCalendar(false);
  };

  return (
    <div className="page">
      <WelcomeBanner />
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
        <FilterChip
          title="Filters"
          icon={<SlidersHorizontal size={17} strokeWidth={2.2} />}
          value={null}
          badge={activeCount}
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          onClear={clearAll}
          clearLabel="Clear all"
          doneLabel={`Show ${feed.length} ${feed.length === 1 ? "event" : "events"}`}
          wide
        >
          <div className="fsec" role="group" aria-labelledby="fsec-cat">
            <p className="fsec__title" id="fsec-cat">
              Category
            </p>
            <div className="fpresets">
              {(["All", ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  className="fpreset"
                  aria-pressed={active === c}
                  onClick={() => setActive(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="fsec" role="group" aria-labelledby="fsec-date">
            <p className="fsec__title" id="fsec-date">
              Date
            </p>
            <div className="fpresets">
              <button
                type="button"
                className="fpreset"
                aria-pressed={dateFilter === null}
                onClick={() => {
                  setDateFilter(null);
                  setShowCalendar(false);
                }}
              >
                Any day
              </button>
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.kind}
                  type="button"
                  className="fpreset"
                  aria-pressed={dateFilter?.kind === p.kind}
                  onClick={() => {
                    setDateFilter({ kind: p.kind });
                    setShowCalendar(false);
                  }}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                className="fpreset fpreset--icon"
                aria-pressed={dateFilter?.kind === "day"}
                aria-expanded={showCalendar}
                onClick={() => setShowCalendar((v) => !v)}
              >
                <CalendarDays size={15} strokeWidth={2.2} aria-hidden="true" />
                {dateFilter?.kind === "day" ? dateLabel(dateFilter) : "Pick a date"}
              </button>
            </div>
            {showCalendar && (
              <div className="fsec__calendar">
                <DatePicker
                  inline
                  value={calendarValue}
                  onChange={(d) => setDateFilter({ kind: "day", date: d })}
                />
              </div>
            )}
          </div>

          <div className="fsec" role="group" aria-labelledby="fsec-loc">
            <p className="fsec__title" id="fsec-loc">
              Location
            </p>
            <div className="fpresets">
              <button
                type="button"
                className="fpreset"
                aria-pressed={location === null}
                onClick={() => setLocation(null)}
              >
                Anywhere
              </button>
              {locations.map((l) => (
                <button
                  key={l.name}
                  type="button"
                  className="fpreset"
                  title={l.name}
                  aria-pressed={location === l.name}
                  onClick={() => setLocation(l.name)}
                >
                  {shortPlace(l.name)}
                </button>
              ))}
            </div>
          </div>
        </FilterChip>
      </div>

      <section className="block">
        <h2 className="section-title block__title">{profile ? "Recommended for you" : "Events Around You"}</h2>
        <div className="feed-grid">
          {feed.map((e) => (
            <EventCard
              minimal
              key={e.id}
              event={e}
              onOpen={() => onOpenEvent(e)}
              liked={likedIds.includes(e.id)}
              onToggleLiked={() => toggleLiked(e)}
              joined={isAttending(e)}
              onSasali={() => sasali(e)}
            />
          ))}
        </div>
        {feed.length === 0 && <p className="empty">No events match your filters.</p>}
        <p className="sr-only" aria-live="polite">
          {feed.length} {feed.length === 1 ? "event" : "events"} shown
        </p>
      </section>
    </div>
  );
}
