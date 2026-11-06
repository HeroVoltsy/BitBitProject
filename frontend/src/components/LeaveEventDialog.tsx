import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { EventItem } from "../types";

const REASONS = ["Schedule conflict", "Feeling unwell", "Plans changed", "Other"] as const;

/**
 * Two-step confirmation for leaving ("unjoining") an event.
 * Step 1 explains what happens and offers an optional reason for the host.
 * Step 2 is the final, explicit "Yes, leave event".
 * The safe choice is focused by default on both steps.
 */
export function LeaveEventDialog({
  event,
  onConfirm,
  onClose,
}: {
  event: EventItem;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const safeRef = useRef<HTMLButtonElement>(null);
  const pressedBackdrop = useRef(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      opener?.focus?.();
    };
  }, []);

  // Each step starts on its safe button ("Keep my spot" / "Go back").
  useEffect(() => {
    safeRef.current?.focus();
  }, [step]);

  return (
    <dialog
      ref={ref}
      className="staff-modal leave-modal"
      aria-labelledby="leave-modal-title"
      aria-describedby="leave-modal-desc"
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

        <p className="leave-modal__step">Step {step} of 2</p>

        {step === 1 ? (
          <>
            <h2 className="staff-modal__title" id="leave-modal-title">
              Leave {event.title}?
            </h2>
            <div id="leave-modal-desc">
              <ul className="leave-modal__list">
                <li>Your attendance QR code will stop working.</li>
                <li>The host will be notified that you left.</li>
                <li>Your spot may go to someone else.</li>
              </ul>
            </div>

            <fieldset className="leave-modal__reasons">
              <legend>Reason (optional, shared with the host)</legend>
              <div className="fpresets">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="fpreset"
                    aria-pressed={reason === r}
                    onClick={() => setReason(reason === r ? null : r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="leave-modal__actions">
              <button ref={safeRef} type="button" className="btn-primary" onClick={onClose}>
                Keep My Spot
              </button>
              <button type="button" className="btn-ghost" onClick={() => setStep(2)}>
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="staff-modal__title" id="leave-modal-title">
              Are you sure?
            </h2>
            <p className="staff-modal__sub" id="leave-modal-desc">
              You&rsquo;re about to leave <strong>{event.title}</strong>. You can join again later
              if there are still spots open.
            </p>
            <div className="leave-modal__actions">
              <button ref={safeRef} type="button" className="btn-ghost" onClick={() => setStep(1)}>
                Go Back
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => onConfirm(reason ?? undefined)}
              >
                Yes, Leave Event
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
