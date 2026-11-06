import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Star, X } from "lucide-react";
import type { EventItem } from "../types";
import { MAX_COMMENT, type EventRating } from "../useRatings";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/**
 * Rate a past event: 1–5 stars, optional comment, and whether the host sees
 * your name or "A Sali Ka member". Stars are native radio inputs, so arrow
 * keys and screen readers work without extra code.
 */
export function RateEventDialog({
  event,
  hostName,
  initial,
  onSubmit,
  onClose,
}: {
  event: EventItem;
  hostName: string;
  initial?: EventRating;
  onSubmit: (rating: Omit<EventRating, "ratedAt">) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const firstStarRef = useRef<HTMLInputElement>(null);
  const pressedBackdrop = useRef(false);
  const name = useId();
  const [stars, setStars] = useState<number>(initial?.stars ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [anonymous, setAnonymous] = useState(initial?.anonymous ?? false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      opener?.focus?.();
    };
  }, []);

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (stars < 1) {
      setError("Choose 1 to 5 stars to rate this event.");
      firstStarRef.current?.focus();
      return;
    }
    onSubmit({ stars: stars as EventRating["stars"], comment, anonymous });
  };

  const shown = hover || stars;

  return (
    <dialog
      ref={ref}
      className="staff-modal rate-modal"
      aria-labelledby="rate-modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedBackdrop.current && e.target === e.currentTarget) onClose();
      }}
    >
      <form className="staff-modal__body" onSubmit={submit} noValidate>
        <button type="button" className="auth-modal__close" onClick={onClose} aria-label="Close">
          <X size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>

        <h2 className="staff-modal__title" id="rate-modal-title">
          {initial ? "Edit your rating" : "Rate this event"}
        </h2>
        <p className="staff-modal__sub">
          <strong>{event.title}</strong> · hosted by {hostName}
        </p>

        <fieldset
          className="rate-stars"
          aria-describedby={error ? "rate-error" : undefined}
          onMouseLeave={() => setHover(0)}
        >
          <legend className="field__label">Your rating</legend>
          <div className="rate-stars__row">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="rate-star" onMouseEnter={() => setHover(n)}>
                <input
                  ref={n === 1 ? firstStarRef : undefined}
                  type="radio"
                  name={name}
                  value={n}
                  checked={stars === n}
                  onChange={() => {
                    setStars(n);
                    setError(null);
                  }}
                  className="sr-only"
                />
                <Star
                  size={34}
                  strokeWidth={1.8}
                  fill={shown >= n ? "currentColor" : "none"}
                  aria-hidden="true"
                />
                <span className="sr-only">
                  {n} {n === 1 ? "star" : "stars"}, {LABELS[n]}
                </span>
              </label>
            ))}
            <span className="rate-stars__word" aria-hidden="true">
              {LABELS[shown]}
            </span>
          </div>
          {error && (
            <p className="field-error" id="rate-error" role="alert">
              {error}
            </p>
          )}
        </fieldset>

        <label className="field rate-comment">
          <span className="field__label">Comment (optional)</span>
          <textarea
            className="input textarea"
            name="rating-comment"
            autoComplete="off"
            maxLength={MAX_COMMENT}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you enjoy? What could be better…"
            aria-describedby="rate-comment-count"
          />
          <span className="rate-comment__count muted" id="rate-comment-count">
            {comment.length}/{MAX_COMMENT}
          </span>
        </label>

        <div className="rate-anon">
          <span className="rate-anon__text">
            <strong id="rate-anon-label">Rate anonymously</strong>
            <span className="muted" id="rate-anon-desc">
              {anonymous
                ? `${hostName} will see “A Sali Ka member” instead of your name.`
                : `${hostName} will see your name with this rating.`}
            </span>
          </span>
          <button
            type="button"
            className={`toggle ${anonymous ? "toggle--on" : ""}`}
            role="switch"
            aria-checked={anonymous}
            aria-labelledby="rate-anon-label"
            aria-describedby="rate-anon-desc"
            onClick={() => setAnonymous((v) => !v)}
          >
            <span className="toggle__knob" />
          </button>
        </div>

        <div className="leave-modal__actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {initial ? "Update Rating" : "Submit Rating"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
