import { useEffect, useRef, useState, type FormEvent } from "react";
import { Mail, ScanLine, X } from "lucide-react";
import type { StaffMember } from "../data/staff";
import type { EventItem } from "../types";
import { initialsOf } from "../useAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Host pop-up: invite Check-in Staff to one event. Staff can only open the QR
 * scanner (and see the check-in count) for this event — nothing else.
 */
export function ManageStaffDialog({
  event,
  staff,
  ownEmail,
  onInvite,
  onRemove,
  onClose,
}: {
  event: EventItem;
  staff: StaffMember[];
  /** The host's own email — they can't invite themselves. */
  ownEmail?: string;
  onInvite: (email: string) => void;
  onRemove: (email: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pressedBackdrop = useRef(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  // Remove needs a second click to confirm (no accidental removals).
  const [confirming, setConfirming] = useState<string | null>(null);

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
    const value = email.trim().toLowerCase();
    let problem: string | null = null;
    if (!EMAIL_RE.test(value)) problem = "Enter a valid email address, e.g. name@example.com.";
    else if (ownEmail && value === ownEmail.toLowerCase()) problem = "You're the host. Invite someone else.";
    else if (staff.some((m) => m.email.toLowerCase() === value)) problem = "That person is already on your staff list.";
    setError(problem);
    if (problem) {
      inputRef.current?.focus();
      return;
    }
    onInvite(value);
    setEmail("");
    setStatus(`Invitation sent to ${value}.`);
  };

  return (
    <dialog
      ref={ref}
      className="staff-modal"
      aria-labelledby="staff-modal-title"
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
      <div className="staff-modal__body">
        <button type="button" className="auth-modal__close" onClick={onClose} aria-label="Close">
          <X size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>

        <h2 className="staff-modal__title" id="staff-modal-title">
          Check-in Staff
        </h2>
        <p className="staff-modal__sub">
          Invite people to scan QR codes at <strong>{event.title}</strong>. Staff can only use the
          scanner and see the check-in count for this event.
        </p>

        <form className="staff-invite" onSubmit={submit} noValidate>
          <label className="field">
            <span className="field__label">Invite by email</span>
            <div className="input input--icon">
              <Mail size={18} strokeWidth={2} className="muted" aria-hidden="true" />
              <input
                ref={inputRef}
                type="email"
                name="staff-email"
                inputMode="email"
                autoComplete="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "staff-email-error" : undefined}
              />
            </div>
            {error && (
              <span className="auth-error" id="staff-email-error">
                {error}
              </span>
            )}
          </label>
          <button type="submit" className="btn-primary staff-invite__btn">
            <ScanLine size={18} strokeWidth={2.2} aria-hidden="true" /> Send Invite
          </button>
        </form>
        <p className="visually-hidden" aria-live="polite">
          {status}
        </p>

        <h3 className="staff-list__title">
          On your staff <span className="muted">({staff.length})</span>
        </h3>
        {staff.length > 0 ? (
          <ul className="staff-list">
            {staff.map((m) => (
              <li className="staff-row" key={m.email}>
                <span className="staff-row__avatar" aria-hidden="true">
                  {initialsOf(m.name ?? m.email.split("@")[0])}
                </span>
                <span className="staff-row__info">
                  <strong>{m.name ?? m.email}</strong>
                  {m.name && <span className="muted">{m.email}</span>}
                </span>
                <span className={`staff-chip ${m.status === "accepted" ? "staff-chip--on" : ""}`}>
                  {m.status === "accepted" ? "Accepted" : "Invited"}
                </span>
                {confirming === m.email ? (
                  <button
                    type="button"
                    className="staff-row__remove staff-row__remove--confirm"
                    onClick={() => {
                      onRemove(m.email);
                      setConfirming(null);
                      setStatus(`Removed ${m.name ?? m.email} from staff.`);
                    }}
                  >
                    Confirm Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    className="staff-row__remove"
                    onClick={() => setConfirming(m.email)}
                    aria-label={`Remove ${m.name ?? m.email} from staff`}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty staff-list__empty">No staff yet. Invite someone to help check people in.</p>
        )}
      </div>
    </dialog>
  );
}
