import { CalendarCheck, ClipboardList, ScanLine, Star, Users, UserPlus, UserCog } from "lucide-react";
import { RatingRow } from "../components/RatingRow";
import { FEED_EVENTS, HOST_STATS, ORGANIZED_EVENTS } from "../data/events";
import type { EventItem } from "../types";

const num = new Intl.NumberFormat();
const rating = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Host (event organizer) home — an admin-style overview instead of the event feed.
 * Sample data only (data/events.ts); the backend will supply real numbers later.
 */
export function HostDashboardScreen({
  firstName,
  onOpenEvent,
  onOpenTool,
  staffCount,
  onManageStaff,
}: {
  firstName: string;
  onOpenEvent: (e: EventItem) => void;
  onOpenTool: (e: EventItem, tool: "qr-scanner" | "attendance") => void;
  /** How many Check-in Staff an event has (invited + accepted). */
  staffCount: (eventId: string) => number;
  onManageStaff: (e: EventItem) => void;
}) {
  const upcoming = FEED_EVENTS.filter((e) => e.hosting);
  const totalGoing = ORGANIZED_EVENTS.reduce((sum, e) => sum + e.going, 0);

  const stats = [
    { label: "Events hosted", value: num.format(HOST_STATS.hosted), Icon: CalendarCheck },
    { label: "Total attendees", value: num.format(totalGoing), Icon: Users },
    { label: "Followers", value: num.format(HOST_STATS.followers), Icon: UserPlus },
    { label: "Average rating", value: rating.format(HOST_STATS.rating), Icon: Star },
  ];

  return (
    <div className="page">
      <div className="dash-head">
        <div className="dash-head__text">
          <h1 className="page-title">Host Dashboard</h1>
          <p className="page-sub dash-head__sub">
            Welcome back, {firstName}. Here's how your events are doing.
          </p>
        </div>
      </div>

      <section aria-label="Your stats" className="dash-stats">
        {stats.map(({ label, value, Icon }) => (
          <div className="dash-stat card" key={label}>
            <span className="dash-stat__icon" aria-hidden="true">
              <Icon size={20} strokeWidth={2.2} />
            </span>
            <strong className="dash-stat__value">{value}</strong>
            <span className="dash-stat__label">{label}</span>
          </div>
        ))}
      </section>

      <section className="block">
        <h2 className="section-title block__title">Upcoming events</h2>
        {upcoming.length > 0 ? (
          <div className="stack">
            {upcoming.map((e) => (
              <article className="dash-event card" key={e.id}>
                <span className="dash-event__date" aria-hidden="true">
                  <span className="dash-event__month">{e.monthLabel}</span>
                  <span className="dash-event__day">{e.day}</span>
                </span>
                <div className="dash-event__info">
                  <h3 className="dash-event__title">{e.title}</h3>
                  <span className="muted">
                    {e.dateLine} · {e.location}
                  </span>
                  <span className="dash-event__going">
                    {num.format(e.going)} going · {num.format(staffCount(e.id))} check-in staff
                  </span>
                </div>
                <div className="dash-event__tools">
                  <button type="button" className="tool-btn" onClick={() => onOpenTool(e, "qr-scanner")}>
                    <ScanLine size={18} strokeWidth={2.2} aria-hidden="true" /> Check-in Scanner
                  </button>
                  <button type="button" className="tool-btn" onClick={() => onOpenTool(e, "attendance")}>
                    <ClipboardList size={18} strokeWidth={2.2} aria-hidden="true" /> Attendance List
                  </button>
                  <button type="button" className="tool-btn" onClick={() => onManageStaff(e)}>
                    <UserCog size={18} strokeWidth={2.2} aria-hidden="true" /> Manage Staff
                  </button>
                  <button type="button" className="tool-btn" onClick={() => onOpenEvent(e)}>
                    View Event
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No upcoming events. Use Post an Event at the top to add one.</p>
        )}
      </section>

      <section className="block">
        <div className="ratings-head">
          <h2 className="section-title">Ratings per event</h2>
          <span className="ratings-avg">
            <Star size={16} strokeWidth={2} fill="currentColor" aria-hidden="true" />
            {rating.format(HOST_STATS.rating)} avg · {num.format(HOST_STATS.reviews)} reviews
          </span>
        </div>
        <div className="stack">
          {ORGANIZED_EVENTS.map((e) => (
            <RatingRow key={e.id} event={e} onOpen={() => onOpenEvent(e)} />
          ))}
        </div>
      </section>
    </div>
  );
}
