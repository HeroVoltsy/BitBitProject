import { useEffect, useRef, useState, type FormEvent } from "react";
import { MapPin, Check } from "lucide-react";
import { CATEGORIES } from "../data/events";
import { DatePicker } from "../components/DatePicker";
import { TimePicker, type TimeValue } from "../components/TimePicker";
import type { ApiEvent, EventInput } from "../events";
import type { Category, EventItem, ScreenName } from "../types";

export function CreateEventScreen({
  onNavigate,
  onSave,
  initial,
}: {
  onNavigate: (s: ScreenName) => void;
  onSave: (data: EventInput) => Promise<ApiEvent>;
  initial?: EventItem;
}) {
  const start = initial?.startsAt ? new Date(initial.startsAt) : null;
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<Category>(
    initial?.category ?? "Market",
  );
  const [date, setDate] = useState<Date | null>(start);
  const [time, setTime] = useState<TimeValue | null>(
    start
      ? {
          hour: start.getHours() % 12 || 12,
          minute: start.getMinutes(),
          period: start.getHours() >= 12 ? "PM" : "AM",
        }
      : null,
  );

  const [promote, setPromote] = useState(initial?.promoted ?? false);
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
    if (!date || !time || lock.current) return;
    const startsAt = new Date(date);
    startsAt.setHours(
      (time.hour % 12) + (time.period === "PM" ? 12 : 0),
      time.minute,
      0,
      0,
    );
    if (!initial && startsAt.getTime() <= Date.now()) {
      setError("Choose a future date and time.");
      return;
    }
    const form = new FormData(e.currentTarget);
    const cover = String(form.get("cover") ?? "").trim();
    if (cover && !/^https:\/\//i.test(cover)) {
      setError("Use an HTTPS image URL.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await onSave({
        title: String(form.get("title") ?? "").trim(),
        category,
        starts_at: startsAt.toISOString(),
        location: String(form.get("location") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        promoted: promote,
        cover_image_url: cover || null,
      });
      setPosted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this event.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="page page--narrow">
      <h1 className="page-title">{initial ? "Edit Event" : "Post an Event"}</h1>
      <p className="page-sub">Share what your community is up to.</p>

      <form className="form-card card" onSubmit={handleSubmit}>
        <fieldset disabled={busy || posted} className="integration-fieldset">
          <Field label="Cover image URL (optional)">
            <input
              className="input"
              name="cover"
              type="url"
              maxLength={500}
              defaultValue={initial?.coverImageUrl ?? ""}
              placeholder="https://..."
            />
          </Field>
          <Field label="Event Title">
            <input
              className="input"
              name="title"
              defaultValue={initial?.title ?? ""}
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
                defaultValue={initial?.location ?? ""}
                minLength={2}
                maxLength={300}
                placeholder="Event venue and address"
                required
              />
            </div>
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

          <Field label="Description">
            <textarea
              className="input textarea"
              name="description"
              defaultValue={initial?.description ?? ""}
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
            <p className="auth-error" role="alert">
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
                <Check size={18} strokeWidth={2.6} /> Saved!
              </>
            ) : busy ? (
              "Saving..."
            ) : initial ? (
              "Save Changes"
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
