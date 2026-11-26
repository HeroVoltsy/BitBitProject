import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, User } from "lucide-react";
import { api } from "../api";
import type { EventItem, ScreenName } from "../types";
interface Attendee {
  attendee_id: number;
  username: string;
  checked_in_at: string | null;
}
export function AttendanceScreen({
  event,
  onNavigate,
}: {
  event: EventItem;
  onNavigate: (s: ScreenName) => void;
}) {
  const abort = useRef<AbortController>();
  const [rows, setRows] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setLoading(true);
    setError("");
    try {
      const value = await api<Attendee[]>(
        `/api/v1/events/${event.id}/attendees`,
        { signal: controller.signal },
      );
      if (!controller.signal.aborted) setRows(value);
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Could not load attendees.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [event.id]);
  useEffect(() => {
    void refresh();
    return () => abort.current?.abort();
  }, [refresh]);
  return (
    <div className="page page--narrow">
      <button className="back-link" onClick={() => onNavigate("event-detail")}>
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="page-title">Attendance</h1>
      <p className="page-sub">{event.title}</p>
      <button
        className="btn-secondary"
        disabled={loading}
        onClick={() => void refresh()}
      >
        Refresh attendance
      </button>
      {loading && <p role="status">Loading attendees...</p>}
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && (
        <>
          <div className="stats-row">
            <div className="stat-card stat-card--green">
              <span>Checked in</span>
              <strong className="stat-card__value">
                {rows.filter((r) => r.checked_in_at).length}
              </strong>
            </div>
            <div className="stat-card">
              <span>Registered</span>
              <strong className="stat-card__value">{rows.length}</strong>
            </div>
          </div>
          <div className="stack">
            {rows.map((r) => (
              <div className="attendee-row card" key={r.attendee_id}>
                <span className="attendee-row__left">
                  <User size={18} />
                  <strong>{r.username}</strong>
                </span>
                <span
                  className={`status-pill ${r.checked_in_at ? "status-pill--in" : "status-pill--pending"}`}
                >
                  {r.checked_in_at ? "IN" : "PENDING"}
                </span>
              </div>
            ))}
          </div>
          {!rows.length && <p className="empty">No registrations yet.</p>}
        </>
      )}
    </div>
  );
}
