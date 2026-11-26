import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { X } from "lucide-react";
import { api } from "../api";
import type { EventItem } from "../types";
export function AttendanceTicket({
  event,
  onClose,
}: {
  event: EventItem;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const controller = useRef(new AbortController());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<{
    image: string;
    payload: string;
  } | null>(null);
  useEffect(() => {
    controller.current = new AbortController();
    const opener = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      controller.current.abort();
      dialog.current?.close();
      opener?.focus();
    };
  }, []);
  const generate = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const value = await api<{ qr_payload: string }>(
        `/api/v1/events/${event.id}/ticket`,
        { method: "POST", signal: controller.current.signal },
      );
      const image = await QRCode.toDataURL(value.qr_payload, {
        width: 280,
        margin: 3,
        errorCorrectionLevel: "M",
      });
      if (!controller.current.signal.aborted)
        setTicket({ image, payload: value.qr_payload });
    } catch (e) {
      if (!controller.current.signal.aborted)
        setError(
          e instanceof Error ? e.message : "Could not generate your ticket.",
        );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <dialog
      ref={dialog}
      className="staff-modal"
      aria-labelledby="attendance-ticket-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="staff-modal__body">
        <button
          className="auth-modal__close"
          disabled={busy}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <h2 id="attendance-ticket-title">Attendance QR</h2>
        <p>{event.title}</p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {ticket ? (
          <>
            <img
              className="ticket-qr"
              src={ticket.image}
              alt="Your private attendance QR code"
            />
            <p>Show this to the check-in staff.</p>
            <details>
              <summary>Attendance code</summary>
              <code className="ticket-payload">{ticket.payload}</code>
            </details>
          </>
        ) : (
          <button
            className="btn-primary"
            disabled={busy}
            onClick={() => void generate()}
          >
            {busy ? "Generating..." : "Generate my QR"}
          </button>
        )}
      </div>
    </dialog>
  );
}
