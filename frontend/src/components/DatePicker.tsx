import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  inline = false,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
  placeholder?: string;
  /** Render just the calendar (always visible, no trigger button). */
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => value ?? new Date());
  const wrapRef = useRef<HTMLDivElement>(null);

  // Inline calendars follow the selected date (e.g. a "Tomorrow" preset that
  // lands in next month).
  const valueTime = value?.getTime();
  useEffect(() => {
    if (inline && valueTime !== undefined) setView(new Date(valueTime));
  }, [inline, valueTime]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const today = new Date();
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const changeMonth = (delta: number) => setView(new Date(year, month + delta, 1));

  const pick = (day: number) => {
    onChange(new Date(year, month, day));
    if (!inline) setOpen(false);
  };

  const calendar = (
    <>
      <div className="cal-month">
        <button type="button" className="cal-nav" onClick={() => changeMonth(-1)} aria-label="Previous month">
          <ChevronLeft size={18} strokeWidth={2.4} />
        </button>
        <span className="cal-month__label" aria-live="polite">
          {MONTHS[month]} {year}
        </span>
        <button type="button" className="cal-nav" onClick={() => changeMonth(1)} aria-label="Next month">
          <ChevronRight size={18} strokeWidth={2.4} />
        </button>
      </div>

      <div className="cal-grid cal-grid--head" aria-hidden="true">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="cal-weekday">
            {d}
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((day, i) => {
          if (day === null) return <span key={i} className="cal-cell cal-cell--empty" />;
          const date = new Date(year, month, day);
          const selected = !!value && sameDay(value, date);
          return (
            <button
              key={i}
              type="button"
              className={`cal-cell ${selected ? "cal-cell--selected" : ""} ${
                sameDay(today, date) ? "cal-cell--today" : ""
              }`}
              aria-label={formatDate(date)}
              aria-pressed={selected}
              onClick={() => pick(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </>
  );

  if (inline) return <div className="datepicker datepicker--inline">{calendar}</div>;

  return (
    <div className="datepicker" ref={wrapRef}>
      <button
        type="button"
        className="input input--icon datepicker__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarDays size={18} strokeWidth={2} className="muted" />
        <span className={value ? "" : "muted"}>{value ? formatDate(value) : placeholder}</span>
        <ChevronDown size={18} strokeWidth={2} className="muted datepicker__caret" />
      </button>

      {open && (
        <div className="datepicker__pop card" role="dialog" aria-label="Choose a date">
          {calendar}
        </div>
      )}
    </div>
  );
}
