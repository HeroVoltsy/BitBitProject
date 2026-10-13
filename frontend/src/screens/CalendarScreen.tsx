import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronRight as Arrow } from "lucide-react";
import { CategoryBadge } from "../components/CategoryBadge";
import { CALENDAR_EVENTS, type EventStatus } from "../data/events";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_CLASS: Record<EventStatus, string> = {
  Ongoing: "status--ongoing",
  Upcoming: "status--upcoming",
  Finished: "status--finished",
};

export function CalendarScreen({ onOpenEvent }: { onOpenEvent: () => void }) {
  // Default to a month/day that has events so the list isn't empty on first load.
  const [view, setView] = useState({ year: 2026, month: 7 }); // August 2026
  const [selected, setSelected] = useState<number | null>(23);

  const firstOffset = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const keyFor = (day: number) => `${view.year}-${view.month}-${day}`;
  const hasEvents = (day: number) => Boolean(CALENDAR_EVENTS[keyFor(day)]);

  const cells: (number | null)[] = [
    ...Array.from({ length: firstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const changeMonth = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setSelected(null);
  };

  const dayEvents = selected != null ? CALENDAR_EVENTS[keyFor(selected)] ?? [] : [];
  const selectedLabel =
    selected != null
      ? new Date(view.year, view.month, selected).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

  return (
    <div className="page">
      <h1 className="page-title">Schedule</h1>
      <p className="page-sub">Pick a date to see the events happening that day.</p>

      <div className="cal-layout">
        <div className="cal-card card">
          <div className="cal-month">
            <span className="cal-month__label">
              {MONTHS[view.month]} {view.year}
            </span>
            <span className="cal-month__nav">
              <button className="cal-nav" aria-label="Previous month" onClick={() => changeMonth(-1)}>
                <ChevronLeft size={20} strokeWidth={2.4} />
              </button>
              <button className="cal-nav" aria-label="Next month" onClick={() => changeMonth(1)}>
                <ChevronRight size={20} strokeWidth={2.4} />
              </button>
            </span>
          </div>

          <div className="cal-grid cal-grid--head">
            {WEEKDAYS.map((d, i) => (
              <span key={i} className="cal-weekday">
                {d}
              </span>
            ))}
          </div>

          <div className="cal-grid">
            {cells.map((day, i) =>
              day === null ? (
                <span key={i} className="cal-cell cal-cell--empty" />
              ) : (
                <button
                  key={i}
                  className={`cal-cell ${selected === day ? "cal-cell--selected" : ""}`}
                  onClick={() => setSelected(day)}
                >
                  {day}
                  {hasEvents(day) && <span className="cal-cell__dot" />}
                </button>
              )
            )}
          </div>
        </div>

        <div className="cal-side">
          <section className="cal-day-group">
            <h2 className="section-title cal-day-group__title">
              {selectedLabel ?? "Select a date"}
            </h2>

            {selected == null ? (
              <p className="empty">Tap a day on the calendar to see its events.</p>
            ) : dayEvents.length === 0 ? (
              <p className="empty">No events on this day.</p>
            ) : (
              <div className="stack">
                {dayEvents.map((e) => (
                  <button className="cal-event card" key={e.title} onClick={onOpenEvent}>
                    <span className="cal-event__main">
                      <span className="cal-event__top">
                        <CategoryBadge category={e.category} />
                        <span className={`status-tag ${STATUS_CLASS[e.status]}`}>{e.status}</span>
                      </span>
                      <strong className="cal-event__title">{e.title}</strong>
                      <span className="cal-event__meta">
                        {e.time} · {e.location}
                      </span>
                    </span>
                    <Arrow size={20} strokeWidth={2} className="muted cal-event__chevron" />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
