import { useEffect, useState, type FormEvent } from "react";
import { Plus, MapPin, Check, ImagePlus } from "lucide-react";
import { CATEGORIES } from "../data/events";
import { DatePicker } from "../components/DatePicker";
import { TimePicker, type TimeValue } from "../components/TimePicker";
import { StripePlaceholder } from "../components/StripePlaceholder";
import type { Category, ScreenName } from "../types";

export function CreateEventScreen({ onNavigate }: { onNavigate: (s: ScreenName) => void }) {
  const [category, setCategory] = useState<Category>("Market");
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<TimeValue | null>(null);
  const [cover, setCover] = useState(false);
  const [promote, setPromote] = useState(true);
  const [posted, setPosted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Return to the feed after showing the confirmation state (cancelled if the user leaves first).
  useEffect(() => {
    if (!posted) return;
    const t = window.setTimeout(() => onNavigate("home"), 1100);
    return () => window.clearTimeout(t);
  }, [posted, onNavigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!date || !time) return;
    setPosted(true);
  };

  return (
    <div className="page page--narrow">
      <h1 className="page-title">Post an Event</h1>
      <p className="page-sub">Share what your community is up to.</p>

      <form className="form-card card" onSubmit={handleSubmit}>
        {cover ? (
          <button type="button" className="upload-preview" onClick={() => setCover(false)}>
            <StripePlaceholder className="upload-preview__img" showLabel={false} />
            <span className="upload-preview__badge">
              <ImagePlus size={15} strokeWidth={2.2} /> Change cover
            </span>
          </button>
        ) : (
          <button type="button" className="upload-area" onClick={() => setCover(true)}>
            <Plus size={22} strokeWidth={2.4} />
            <span>add cover photo</span>
          </button>
        )}

        <Field label="Event Title">
          <input className="input" placeholder="e.g. Naga Sunday Market" required />
        </Field>

        <div className="form-row">
          <Field label="Date">
            <DatePicker value={date} onChange={setDate} placeholder="Pick a date" />
            {submitted && !date && <span className="auth-error">Pick a date for your event.</span>}
          </Field>
          <Field label="Time">
            <TimePicker value={time} onChange={setTime} placeholder="Pick a time" />
            {submitted && !time && <span className="auth-error">Pick a start time.</span>}
          </Field>
        </div>

        <Field label="Location">
          <div className="input input--icon">
            <MapPin size={18} strokeWidth={2} className="muted" />
            <input placeholder="Plaza Rizal, Naga City" required />
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
            rows={4}
            placeholder="Tell the community about your event..."
          />
        </Field>

        <div className="promote">
          <div>
            <strong>Promote this event</strong>
            <p className="muted">Feature this on the home screen discover feeds</p>
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

        <button type="submit" className="btn-primary form-submit" disabled={posted}>
          {posted ? (
            <>
              <Check size={18} strokeWidth={2.6} /> Posted!
            </>
          ) : (
            "Post Event"
          )}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
    </label>
  );
}
