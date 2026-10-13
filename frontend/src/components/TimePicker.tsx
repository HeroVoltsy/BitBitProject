import { useEffect, useRef, useState } from "react";
import { Clock, ChevronDown } from "lucide-react";

export interface TimeValue {
  hour: number; // 1–12
  minute: number; // 0–55
  period: "AM" | "PM";
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,…,55
const PERIODS: Array<"AM" | "PM"> = ["AM", "PM"];

export function formatTime(t: TimeValue) {
  return `${t.hour}:${String(t.minute).padStart(2, "0")} ${t.period}`;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select a time",
}: {
  value: TimeValue | null;
  onChange: (t: TimeValue) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TimeValue>(value ?? { hour: 9, minute: 0, period: "AM" });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const commit = (next: TimeValue) => {
    setDraft(next);
    onChange(next);
  };

  return (
    <div className="timepicker" ref={wrapRef}>
      <button
        type="button"
        className="input input--icon timepicker__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Clock size={18} strokeWidth={2} className="muted" />
        <span className={value ? "" : "muted"}>{value ? formatTime(value) : placeholder}</span>
        <ChevronDown size={18} strokeWidth={2} className="muted timepicker__caret" />
      </button>

      {open && (
        <div className="timepicker__pop card" role="dialog" aria-label="Choose a time">
          <div className="time-cols">
            <div className="time-col" role="listbox" aria-label="Hour">
              <span className="time-col__label">Hr</span>
              <div className="time-col__scroll">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`time-opt ${draft.hour === h ? "time-opt--active" : ""}`}
                    onClick={() => commit({ ...draft, hour: h })}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="time-col" role="listbox" aria-label="Minute">
              <span className="time-col__label">Min</span>
              <div className="time-col__scroll">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`time-opt ${draft.minute === m ? "time-opt--active" : ""}`}
                    onClick={() => commit({ ...draft, minute: m })}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            <div className="time-col time-col--period" role="listbox" aria-label="AM or PM">
              <span className="time-col__label">&nbsp;</span>
              <div className="time-col__scroll time-col__scroll--period">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`time-opt ${draft.period === p ? "time-opt--active" : ""}`}
                    onClick={() => commit({ ...draft, period: p })}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
