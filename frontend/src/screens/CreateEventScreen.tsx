import { useEffect, useState, useRef, type FormEvent } from "react";
import { MapPin, Check } from "lucide-react";
import { CATEGORIES } from "../data/events";
import { DatePicker } from "../components/DatePicker";
import { TimePicker, type TimeValue } from "../components/TimePicker";
import type { ApiEvent, EventInput } from "../events";
import { OCCUPATIONS } from "../discovery";
import type { Category, Occupation, ScreenName } from "../types";

export function CreateEventScreen({
  onNavigate,
  onCreate,
}: {
  onNavigate: (s: ScreenName) => void;
  onCreate: (data: EventInput) => Promise<ApiEvent>;
}) {
  const [audiences, setAudiences] = useState<Occupation[]>([]);
  const [category, setCategory] = useState<Category>("Market");
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<TimeValue | null>(null);
  const [duration, setDuration] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const [promote, setPromote] = useState(false);
  const [posted, setPosted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Return to the feed after showing the confirmation state (cancelled if the user leaves first).
  useEffect(() => {
    if (!posted) return;
    const t = window.setTimeout(() => onNavigate("home"), 1100);
    return () => window.clearTimeout(t);
  }, [posted, onNavigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (!date || !time || submitting.current) return;
    const start = new Date(date);
    start.setHours(
      (time.hour % 12) + (time.period === "PM" ? 12 : 0),
      time.minute,
      0,
      0,
    );
    if (start.getTime() <= Date.now()) {
      setError("Choose a future date and time.");
      return;
    }
    const form = new FormData(e.currentTarget);
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await onCreate({
        title: String(form.get("title") ?? "").trim(),
        category,
        starts_at: start.toISOString(),
        ends_at: new Date(start.getTime() + duration * 3600000).toISOString(),
        location: String(form.get("location") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        promoted: promote,
        audiences,
      });
      setPosted(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not publish this event.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="page page--narrow">
      <h1 className="page-title">Post an Event</h1>
      <p className="page-sub">Share what your community is up to.</p>

      <form className="form-card card" onSubmit={handleSubmit}>
        <fieldset disabled={busy || posted} className="form-fields">
          <Field label="Event Title">
            <input
              className="input"
              name="title"
              minLength={3}
              maxLength={180}
              placeholder="Event title"
              required
            />
          </Field>

          <div className="form-row">
            <Field label="Date">
              <DatePicker
                value={date}
                onChange={setDate}
                placeholder="Pick a date"
              />
              {submitted && !date && (
                <span className="auth-error">Pick a date for your event.</span>
              )}
            </Field>
            <Field label="Time">
              <TimePicker
                value={time}
                onChange={setTime}
                placeholder="Pick a time"
              />
              {submitted && !time && (
                <span className="auth-error">Pick a start time.</span>
              )}
            </Field>
          </div>

          <Field label="Location">
            <div className="input input--icon">
              <MapPin size={18} strokeWidth={2} className="muted" />
              <input
                name="location"
                minLength={2}
                maxLength={300}
                placeholder="Event venue and address"
                required
              />
            </div>
          </Field>

          <Field label="Duration (hours)">
            <input
              className="input"
              type="number"
              min={0.5}
              max={168}
              step={0.5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Category">
            <div className="pills">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`pill ${category === c ? "pill--active" : ""}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

          <div className="field">
            <span className="field__label">Suggested audience (optional)</span>
            <div className="pills">
              {OCCUPATIONS.filter((o) => o.value !== "prefer_not_to_say").map(
                (o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={`pill ${audiences.includes(o.value) ? "pill--active" : ""}`}
                    aria-pressed={audiences.includes(o.value)}
                    onClick={() =>
                      setAudiences((v) =>
                        v.includes(o.value)
                          ? v.filter((x) => x !== o.value)
                          : [...v, o.value],
                      )
                    }
                  >
                    {o.label}
                  </button>
                ),
              )}
            </div>
          </div>
          <Field label="Description">
            <textarea
              className="input textarea"
              name="description"
              maxLength={10000}
              rows={4}
              placeholder="Tell the community about your event..."
            />
          </Field>

          <div className="promote">
            <div>
              <strong>Promote this event</strong>
              <p className="muted">
                Feature this on the home screen discover feeds
              </p>
            </div>
            <button
              type="button"
              className={`toggle ${promote ? "toggle--on" : ""}`}
              role="switch"
              aria-checked={promote}
              aria-label="Promote this event"
              onClick={() => setPromote((v) => !v)}
            >
              <span className="toggle__knob" />
            </button>
          </div>

          {error && (
            <p role="alert" className="auth-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn-primary form-submit"
            disabled={posted}
          >
            {posted ? (
              <>
                <Check size={18} strokeWidth={2.6} /> Posted!
              </>
            ) : busy ? (
              "Publishing..."
            ) : (
              "Post Event"
            )}
          </button>
        </fieldset>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
    </label>
  );
}
