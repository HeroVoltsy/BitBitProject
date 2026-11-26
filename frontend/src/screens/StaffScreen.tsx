import { useState } from "react";
import { ScanLine } from "lucide-react";
import { api } from "../api";
import { eventItem, type ApiEvent } from "../events";
import type { StaffInvitation } from "../useEvents";
import type { EventItem } from "../types";
export function StaffScreen({
  invites,
  onRespond,
  onOpenScanner,
  onCheckAccess,
  userId,
  busy,
}: {
  invites: StaffInvitation[];
  onRespond: (id: string, accept: boolean) => Promise<boolean>;
  onOpenScanner: (e: EventItem) => void;
  onCheckAccess: (id: string) => Promise<unknown>;
  userId: number;
  busy: boolean;
}) {
  const [id, setId] = useState(""),
    [selected, setSelected] = useState<EventItem | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const lookup = async () => {
    if (!/^\d+$/.test(id) || Number(id) <= 0) {
      setError("Enter the event ID shared by your host.");
      return;
    }
    setLoading(true);
    setError("");
    setSelected(null);
    try {
      setSelected(
        eventItem(await api<ApiEvent>(`/api/v1/events/${id}`), userId),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not find this event.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="page page--narrow">
      <h1 className="page-title">Check-in Staff</h1>
      <p className="page-sub">
        Your user ID is <strong>{userId}</strong>. Give it to the host to
        receive an invitation.
      </p>
      <section className="card form-card">
        <label className="field">
          <span className="field__label">Event ID</span>
          <input
            className="input"
            type="number"
            min={1}
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setSelected(null);
            }}
          />
        </label>
        <button
          className="btn-secondary"
          disabled={loading || busy}
          onClick={() => void lookup()}
        >
          Find event
        </button>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {selected && (
          <div>
            <h2 className="section-title">{selected.title}</h2>
            <p className="muted">{selected.dateLine}</p>
            <p>Respond to the invitation your host sent for this event.</p>
            <div className="staff-invite-card__actions">
              <button
                className="btn-primary"
                disabled={busy}
                onClick={() => void onRespond(selected.id, true)}
              >
                Accept
              </button>
              <button
                className="btn-ghost"
                disabled={busy}
                onClick={() => void onRespond(selected.id, false)}
              >
                Decline
              </button>
              <button
                className="btn-ghost"
                disabled={busy}
                onClick={() => void onCheckAccess(selected.id)}
              >
                Check existing access
              </button>
            </div>
          </div>
        )}
      </section>
      <h2 className="section-title block__title">Your staff events</h2>
      <div className="stack">
        {invites.map(({ event }) => (
          <article className="staff-event card" key={event.id}>
            <div>
              <h3>{event.title}</h3>
              <p className="muted">{event.dateLine}</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => onOpenScanner(event)}
            >
              <ScanLine size={18} /> Open Scanner
            </button>
          </article>
        ))}
      </div>
      {!invites.length && (
        <p className="empty">
          Accept an invitation using the event ID above. If you already accepted
          on another browser, use Check existing access.
        </p>
      )}
    </div>
  );
}
