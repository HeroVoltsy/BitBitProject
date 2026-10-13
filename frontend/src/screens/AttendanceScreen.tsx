import { useState } from "react";
import { ArrowLeft, User } from "lucide-react";
import { ATTENDEES } from "../data/events";
import type { ScreenName } from "../types";

type Status = "IN" | "PENDING";

export function AttendanceScreen({ onNavigate }: { onNavigate: (s: ScreenName) => void }) {
  const [rows, setRows] = useState(() => ATTENDEES.map((a) => ({ ...a })));
  const checkedIn = rows.filter((a) => a.status === "IN").length;

  // Frontend-only: tap a status to toggle check-in (nothing is saved).
  const toggle = (id: string) =>
    setRows((list) =>
      list.map((a) =>
        a.id === id
          ? { ...a, status: (a.status === "IN" ? "PENDING" : "IN") as Status }
          : a
      )
    );

  return (
    <div className="page page--narrow">
      <button className="back-link" onClick={() => onNavigate("event-detail")}>
        <ArrowLeft size={18} strokeWidth={2.2} /> Back
      </button>
      <h1 className="page-title">Attendance</h1>
      <p className="page-sub">Naga Sunday Market · Aug 23</p>

      <div className="stats-row">
        <div className="stat-card stat-card--green">
          <span className="stat-card__label">Checked in</span>
          <span className="stat-card__value">{checkedIn}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Registered</span>
          <span className="stat-card__value">{rows.length}</span>
        </div>
      </div>

      <section className="block">
        <h2 className="section-title block__title">Attendees ({rows.length})</h2>
        <p className="attendee-hint muted">Tap a status to check a member in or out.</p>
        <div className="stack">
          {rows.map((a) => (
            <div className="attendee-row card" key={a.id}>
              <span className="attendee-row__left">
                <span className="attendee-row__avatar">
                  <User size={18} strokeWidth={2.2} />
                </span>
                <span className="attendee-row__name">
                  <strong>{a.name}</strong>
                  <span className="muted">{a.id}</span>
                </span>
              </span>
              <button
                className={`status-pill ${
                  a.status === "IN" ? "status-pill--in" : "status-pill--pending"
                }`}
                onClick={() => toggle(a.id)}
                aria-label={`Toggle check-in for ${a.name}`}
              >
                {a.status}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
