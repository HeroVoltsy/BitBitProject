import {
  CalendarCheck,
  Users,
  ScanLine,
  ClipboardList,
  UserCog,
} from "lucide-react";
import type { EventItem } from "../types";
export function HostDashboardScreen({
  firstName,
  events,
  onOpenEvent,
  onOpenTool,
  onManageStaff,
}: {
  firstName: string;
  events: EventItem[];
  onOpenEvent: (e: EventItem) => void;
  onOpenTool: (e: EventItem, tool: "qr-scanner" | "attendance") => void;
  onManageStaff: (e: EventItem) => void;
}) {
  const own = events.filter((e) => e.hosting);
  const stats = [
    { label: "Events hosted", value: own.length, Icon: CalendarCheck },
    {
      label: "Registrations",
      value: own.some((e) => e.countsAvailable === false)
        ? "Unavailable"
        : own.reduce((n, e) => n + e.going, 0),
      Icon: Users,
    },
  ];
  return (
    <div className="page">
      <h1 className="page-title">Host Dashboard</h1>
      <p className="page-sub">Welcome back, {firstName}.</p>
      <section className="dash-stats" aria-label="Your stats">
        {stats.map(({ label, value, Icon }) => (
          <div className="dash-stat card" key={label}>
            <span className="dash-stat__icon">
              <Icon size={20} />
            </span>
            <strong className="dash-stat__value">{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>
      <section className="block">
        <h2 className="section-title block__title">Your events</h2>
        <div className="stack">
          {own.map((e) => (
            <article className="dash-event card" key={e.id}>
              <span className="dash-event__date">
                <span>{e.monthLabel}</span>
                <strong>{e.day}</strong>
              </span>
              <div className="dash-event__info">
                <h3>{e.title}</h3>
                <p className="muted">
                  {e.dateLine} · {e.location}
                </p>
                <span>
                  {e.countsAvailable === false
                    ? "Count unavailable"
                    : `${e.going} going`}{" "}
                  · {e.staffCount ?? 0} check-in staff
                </span>
              </div>
              <div className="dash-event__tools">
                <button
                  className="tool-btn"
                  onClick={() => onOpenTool(e, "qr-scanner")}
                >
                  <ScanLine size={18} /> Check-in Scanner
                </button>
                <button
                  className="tool-btn"
                  onClick={() => onOpenTool(e, "attendance")}
                >
                  <ClipboardList size={18} /> Attendance List
                </button>
                <button className="tool-btn" onClick={() => onManageStaff(e)}>
                  <UserCog size={18} /> Manage Staff
                </button>
                <button className="tool-btn" onClick={() => onOpenEvent(e)}>
                  View Event
                </button>
              </div>
            </article>
          ))}
          {!own.length && (
            <p className="empty">
              No events yet. Use Post an Event to add one.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
