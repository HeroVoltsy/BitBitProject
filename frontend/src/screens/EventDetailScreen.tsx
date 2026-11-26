import { useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Heart,
  CalendarDays,
  MapPin,
  Navigation,
  QrCode,
  ScanLine,
  ClipboardList,
  UserCog,
} from "lucide-react";
import { StripePlaceholder } from "../components/StripePlaceholder";
import { CategoryBadge } from "../components/CategoryBadge";
import { LeaveEventDialog } from "../components/LeaveEventDialog";
import { useToast } from "../components/Toast";
import { useAuthGate } from "../components/AuthGate";
import { AttendanceTicket } from "../components/AttendanceTicket";
import type { EventItem, ScreenName } from "../types";

export function EventDetailScreen({
  event,
  liked,
  onToggleLiked,
  attending,
  onJoin,
  onBack,
  backLabel,
  onOpenHost,
  onNavigate,
  onManageStaff,
  onLeave,
  busy,
  onCancel,
  onEdit,
  userId,
}: {
  event: EventItem;
  busy: boolean;
  userId: number;
  onEdit?: () => void;
  onCancel?: () => void;
  liked: boolean;
  onToggleLiked: () => void;
  /** Signed in and going (joined here, via "sasali", or in the server registration). */
  attending: boolean;
  onJoin: () => void;
  onBack: () => void;
  backLabel: string;
  onOpenHost: () => void;
  onNavigate: (s: ScreenName) => void;
  /** Host only: invite/remove Check-in Staff for this event. */
  onManageStaff?: () => void;
  /** Attendee only: leave the event (after a two-step confirmation). */
  onLeave?: (reason?: string) => void;
}) {
  const [qrOpen, setQrOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const notify = useToast();
  const { requireAuth } = useAuthGate();
  const [dateText, timeText] = event.dateLine.split(" · ");

  const handleDirections = async () => {
    try {
      await navigator.clipboard.writeText(event.location);
      notify("Location copied to clipboard");
    } catch {
      notify(`Directions to ${event.location}`);
    }
  };

  return (
    <div className="page page--narrow">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={18} strokeWidth={2.2} /> {backLabel}
      </button>

      <div className="detail-cover">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" className="event-cover-image" />
        ) : (
          <StripePlaceholder
            className="detail-cover__stripes"
            showLabel={false}
          />
        )}
        <button
          className={`round-btn detail-cover__fav ${liked ? "round-btn--on" : ""}`}
          aria-pressed={liked}
          aria-label={liked ? "Unlike event" : "Like event"}
          onClick={() =>
            requireAuth(() => {
              onToggleLiked();
            }, "Log in to save events you like.")
          }
        >
          <Heart
            size={20}
            strokeWidth={2.2}
            fill={liked ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="detail-body">
        <div className="badge-row">
          <CategoryBadge category={event.category} />
        </div>
        <h1 className="detail-title">{event.title}</h1>
        <p className="muted">Event ID: {event.id}</p>
        <p className="detail-host">
          Hosted by{" "}
          <button className="host-link" onClick={onOpenHost}>
            {event.hostName ?? "Organizer"}
          </button>
        </p>

        <div className="info-card card">
          <div className="info-row">
            <span className="info-icon">
              <CalendarDays size={20} strokeWidth={2} />
            </span>
            <span className="info-stack">
              <strong>{dateText}</strong>
              {timeText && <span className="muted">{timeText}</span>}
            </span>
          </div>
          <div className="info-divider" />
          <div className="info-row">
            <span className="info-icon">
              <MapPin size={20} strokeWidth={2} />
            </span>
            <span className="info-stack">
              <strong>{event.location}</strong>
            </span>
            <button className="directions" onClick={handleDirections}>
              <Navigation size={15} strokeWidth={2.2} /> Directions
            </button>
          </div>
        </div>

        {event.countsAvailable !== false && (
          <div className="social-proof">
            <strong>{event.going} members</strong> are going
          </div>
        )}
        <section className="block">
          <h2 className="section-title block__title">About this event</h2>
          <p className="detail-about">
            {event.description || "No description provided."}
          </p>
        </section>

        {event.started && !attending && !event.hosting && (
          <p className="ended-note">Registration has closed for this event.</p>
        )}
        {event.ended && (
          <p className="ended-note">
            This event has ended. You can rate it from your Profile → Past.
          </p>
        )}

        {attending && !event.hosting && !event.ended && onLeave && (
          <p className="leave-row">
            <span className="muted">Can&rsquo;t make it?</span>
            <button
              type="button"
              className="leave-link"
              onClick={() => setLeaveOpen(true)}
            >
              Leave event
            </button>
          </p>
        )}

        {event.hosting ? (
          <div className="detail-organizer">
            <div className="detail-hosting">You're hosting this event</div>
            <div className="organizer-tools">
              <button
                className="tool-btn"
                onClick={() => onNavigate("qr-scanner")}
              >
                <ScanLine size={18} strokeWidth={2.2} /> Check-in Scanner
              </button>
              <button
                className="tool-btn"
                onClick={() => onNavigate("attendance")}
              >
                <ClipboardList size={18} strokeWidth={2.2} /> Attendance List
              </button>
              {onEdit && (
                <button className="tool-btn" disabled={busy} onClick={onEdit}>
                  Edit event
                </button>
              )}
              {onCancel && (
                <button className="tool-btn" disabled={busy} onClick={onCancel}>
                  Cancel event
                </button>
              )}
              {onManageStaff && (
                <button className="tool-btn" onClick={onManageStaff}>
                  <UserCog size={18} strokeWidth={2.2} aria-hidden="true" />{" "}
                  Manage Staff
                </button>
              )}
            </div>
          </div>
        ) : event.ended || (event.started && !attending) ? null : (
          // Pinned to the bottom of the screen so the main action stays in reach while scrolling.
          // Portaled to <body>: the page's entry animation uses transform, which would
          // otherwise make position: fixed scroll along with the page.
          createPortal(
            <div className="action-bar">
              <div className="action-bar__inner">
                {attending ? (
                  <button
                    className="btn-primary detail-rsvp"
                    onClick={() => setQrOpen(true)}
                  >
                    <QrCode size={18} strokeWidth={2.2} aria-hidden="true" />{" "}
                    Show My QR for Attendance
                  </button>
                ) : (
                  <button
                    disabled={busy}
                    className="btn-primary detail-rsvp"
                    onClick={() =>
                      requireAuth(() => {
                        onJoin();
                      }, `Log in to join ${event.title}.`)
                    }
                  >
                    Join This Event
                  </button>
                )}
              </div>
            </div>,
            document.body,
          )
        )}
      </div>

      {leaveOpen && onLeave && (
        <LeaveEventDialog
          event={event}
          onClose={() => setLeaveOpen(false)}
          busy={busy}
          onConfirm={(reason) => {
            setLeaveOpen(false);
            onLeave(reason);
          }}
        />
      )}

      {qrOpen && (
        <AttendanceTicket
          userId={userId}
          event={event}
          onClose={() => setQrOpen(false)}
        />
      )}
    </div>
  );
}
