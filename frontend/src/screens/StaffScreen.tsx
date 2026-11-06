import { CalendarDays, MapPin, ScanLine } from "lucide-react";
import { findEvent } from "../data/events";
import type { StaffInvite } from "../data/staff";
import type { EventItem } from "../types";

/** "Staff" top-bar page: invitations to be Check-in Staff, and events you scan for. */
export function StaffScreen({
  invites,
  onRespond,
  onOpenScanner,
}: {
  invites: StaffInvite[];
  onRespond: (eventId: string, accept: boolean) => void;
  onOpenScanner: (e: EventItem) => void;
}) {
  const withEvent = invites
    .map((i) => ({ invite: i, event: findEvent(i.eventId) }))
    .filter((x): x is { invite: StaffInvite; event: EventItem } => x.event !== undefined);
  const pending = withEvent.filter((x) => x.invite.status === "pending");
  // Upcoming first; ended events stay listed (read-only) below them.
  const accepted = withEvent
    .filter((x) => x.invite.status === "accepted")
    .sort((a, b) => Number(Boolean(a.event.ended)) - Number(Boolean(b.event.ended)));

  return (
    <div className="page page--narrow">
      <h1 className="page-title">Check-in Staff</h1>
      <p className="page-sub">
        Events where a host asked you to scan attendees' QR codes. You can only use the scanner for
        these events.
      </p>

      {pending.length > 0 && (
        <section className="block staff-block">
          <h2 className="section-title block__title">Invitations</h2>
          <div className="stack">
            {pending.map(({ invite, event }) => (
              <article className="staff-invite-card card" key={event.id}>
                <p className="staff-invite-card__lead">
                  <strong>{invite.invitedBy}</strong> invited you to be check-in staff for
                </p>
                <h3 className="staff-invite-card__title">{event.title}</h3>
                <EventMeta event={event} />
                {event.ended ? (
                  <div className="staff-invite-card__actions staff-expired">
                    <span className="staff-ended-tag">This invitation expired</span>
                    <button
                      type="button"
                      className="btn-ghost"
                      aria-label={`Dismiss expired invitation for ${event.title}`}
                      onClick={() => onRespond(event.id, false)}
                    >
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <div className="staff-invite-card__actions">
                    <button type="button" className="btn-primary" onClick={() => onRespond(event.id, true)}>
                      Accept
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => onRespond(event.id, false)}>
                      Decline
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="block staff-block">
        <h2 className="section-title block__title">Your staff events</h2>
        {accepted.length > 0 ? (
          <div className="stack">
            {accepted.map(({ invite, event }) => (
              <article className={`staff-event card ${event.ended ? "staff-event--ended" : ""}`} key={event.id}>
                <div className="staff-event__info">
                  <h3 className="staff-invite-card__title">{event.title}</h3>
                  <EventMeta event={event} />
                  <span className="muted staff-event__host">Host: {invite.invitedBy}</span>
                </div>
                {event.ended ? (
                  <span className="staff-ended-tag">Event ended · scanning closed</span>
                ) : (
                  <button type="button" className="btn-primary staff-event__btn" onClick={() => onOpenScanner(event)}>
                    <ScanLine size={18} strokeWidth={2.2} aria-hidden="true" /> Open Scanner
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">
            {pending.length > 0
              ? "Accept an invitation above to start scanning."
              : "You're not check-in staff for any events yet."}
          </p>
        )}
      </section>
    </div>
  );
}

function EventMeta({ event }: { event: EventItem }) {
  return (
    <div className="staff-meta">
      <span className="metarow">
        <CalendarDays size={15} strokeWidth={2} aria-hidden="true" />
        <span>{event.dateLine}</span>
      </span>
      <span className="metarow">
        <MapPin size={15} strokeWidth={2} aria-hidden="true" />
        <span>{event.location}</span>
      </span>
    </div>
  );
}
