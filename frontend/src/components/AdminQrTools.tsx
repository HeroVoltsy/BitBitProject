import { useRef, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { api } from "../api";
import { ticketToken } from "../events";
export function AdminQrTools({ eventId }: { eventId: string }) {
  const [userId, setUserId] = useState(""),
    [payload, setPayload] = useState(""),
    [image, setImage] = useState(""),
    [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The request failed.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const issue = (e: FormEvent) => {
    e.preventDefault();
    if (!Number.isSafeInteger(Number(userId)) || Number(userId) <= 0) {
      setError("Enter a valid attendee user ID.");
      return;
    }
    void run(async () => {
      const result = await api<{ qr_payload: string }>("/api/v1/qr/tickets", {
        method: "POST",
        body: JSON.stringify({
          event_id: Number(eventId),
          attendee_id: Number(userId),
        }),
      });
      setImage(
        await QRCode.toDataURL(result.qr_payload, { width: 280, margin: 3 }),
      );
      setStatus("Ticket created.");
    });
  };
  const scan = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const token = ticketToken(payload, eventId);
      const result = await api<{ message: string }>("/api/v1/qr/scan", {
        method: "POST",
        body: JSON.stringify({ event_id: Number(eventId), token }),
      });
      setStatus(result.message);
      setPayload("");
    });
  };
  return (
    <details className="card form-card">
      <summary>Administrator QR tools</summary>
      <p className="muted">
        Requires an administrator account. Selecting Host does not grant
        administrator access.
      </p>
      <form className="scan-form" onSubmit={issue}>
        <label className="field">
          <span className="field__label">Attendee user ID</span>
          <input
            className="input"
            type="number"
            min={1}
            required
            value={userId}
            disabled={busy}
            onChange={(e) => setUserId(e.target.value)}
          />
        </label>
        <button className="btn-secondary" disabled={busy}>
          Create admin ticket
        </button>
      </form>
      {image && (
        <img
          className="ticket-qr"
          src={image}
          alt="Administrator-issued attendance QR"
        />
      )}
      <form className="scan-form" onSubmit={scan}>
        <label className="field">
          <span className="field__label">Admin attendance code</span>
          <textarea
            className="input textarea"
            required
            value={payload}
            disabled={busy}
            onChange={(e) => setPayload(e.target.value)}
          />
        </label>
        <button className="btn-secondary" disabled={busy}>
          Submit admin check-in
        </button>
      </form>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <p role="status">{status}</p>
    </details>
  );
}
