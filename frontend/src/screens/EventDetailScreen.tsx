import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Heart, CalendarDays, MapPin, Navigation, QrCode, X, ScanLine, ClipboardList, UserCog } from "lucide-react";
import { StripePlaceholder } from "../components/StripePlaceholder";
import { CategoryBadge } from "../components/CategoryBadge";
import { AvatarGroup } from "../components/Avatar";
import { LeaveEventDialog } from "../components/LeaveEventDialog";
import { useToast } from "../components/Toast";
import { useAuthGate } from "../components/AuthGate";
import { USER } from "../data/events";
import type { EventItem, ScreenName } from "../types";

const ABOUT =
  "Come support local Bicol farmers, craftsmen, and creators this weekend! Fresh produce, pili nut treats, handmade crafts, hot Naga coffee, and games for the kids. Family and pet friendly. Bring your own reusable bag!";

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
}: {
  event: EventItem;
  liked: boolean;
  onToggleLiked: () => void;
  /** Signed in and going (joined here, via "sasali", or in the sample data). */
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

  // Close the QR overlay on Escape.
  useEffect(() => {
    if (!qrOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setQrOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [qrOpen]);

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
        <StripePlaceholder className="detail-cover__stripes" />
        <button
          className={`round-btn detail-cover__fav ${liked ? "round-btn--on" : ""}`}
          aria-pressed={liked}
          aria-label={liked ? "Unlike event" : "Like event"}
          onClick={() =>
            requireAuth(() => {
              onToggleLiked();
              notify(liked ? "Removed from your liked events" : "Added to Profile → Liked");
            }, "Log in to save events you like.")
          }
        >
          <Heart size={20} strokeWidth={2.2} fill={liked ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="detail-body">
        <div className="badge-row">
          <CategoryBadge category={event.category} />
        </div>
        <h1 className="detail-title">{event.title}</h1>
        <p className="detail-host">
          Hosted by{" "}
          <button className="host-link" onClick={onOpenHost}>
            {event.hostName ?? USER.name}
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
              <span className="muted">Naga City, Camarines Sur</span>
            </span>
            <button className="directions" onClick={handleDirections}>
              <Navigation size={15} strokeWidth={2.2} /> Directions
            </button>
          </div>
        </div>

        <div className="social-proof">
          <AvatarGroup count={5} />
          <span>
            <strong>{event.going} members</strong> of your neighborhood are going
          </span>
        </div>

        <section className="block">
          <h2 className="section-title block__title">About this event</h2>
          <p className="detail-about">{ABOUT}</p>
        </section>

        {event.ended && (
          <p className="ended-note">This event has ended. You can rate it from your Profile → Past.</p>
        )}

        {attending && !event.hosting && !event.ended && onLeave && (
          <p className="leave-row">
            <span className="muted">Can&rsquo;t make it?</span>
            <button type="button" className="leave-link" onClick={() => setLeaveOpen(true)}>
              Leave event
            </button>
          </p>
        )}

        {event.hosting ? (
          <div className="detail-organizer">
            <div className="detail-hosting">You're hosting this event</div>
            <div className="organizer-tools">
              <button className="tool-btn" onClick={() => onNavigate("qr-scanner")}>
                <ScanLine size={18} strokeWidth={2.2} /> Check-in Scanner
              </button>
              <button className="tool-btn" onClick={() => onNavigate("attendance")}>
                <ClipboardList size={18} strokeWidth={2.2} /> Attendance List
              </button>
              {onManageStaff && (
                <button className="tool-btn" onClick={onManageStaff}>
                  <UserCog size={18} strokeWidth={2.2} aria-hidden="true" /> Manage Staff
                </button>
              )}
            </div>
          </div>
        ) : event.ended ? null : (
          // Pinned to the bottom of the screen so the main action stays in reach while scrolling.
          // Portaled to <body>: the page's entry animation uses transform, which would
          // otherwise make position: fixed scroll along with the page.
          createPortal(
          <div className="action-bar">
            <div className="action-bar__inner">
              {attending ? (
                <button className="btn-primary detail-rsvp" onClick={() => setQrOpen(true)}>
                  <QrCode size={18} strokeWidth={2.2} aria-hidden="true" /> Show My QR for Attendance
                </button>
              ) : (
                <button
                  className="btn-primary detail-rsvp"
                  onClick={() =>
                    requireAuth(() => {
                      onJoin();
                      notify("You're going! Show your QR to check in.");
                    }, `Log in to join ${event.title}.`)
                  }
                >
                  Join This Event
                </button>
              )}
            </div>
          </div>,
          document.body
          )
        )}
      </div>

      {leaveOpen && onLeave && (
        <LeaveEventDialog
          event={event}
          onClose={() => setLeaveOpen(false)}
          onConfirm={(reason) => {
            setLeaveOpen(false);
            onLeave(reason);
          }}
        />
      )}

      {qrOpen && (
        <div className="qr-modal" role="dialog" aria-modal="true" onClick={() => setQrOpen(false)}>
          <div className="qr-modal__card" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal__close" onClick={() => setQrOpen(false)} aria-label="Close">
              <X size={20} strokeWidth={2.2} />
            </button>
            <h3 className="qr-modal__title">Attendance QR</h3>
            <p className="muted qr-modal__sub">
              Show this at <strong>{event.title}</strong> to check in
            </p>
            <div className="qr-modal__code" aria-hidden="true">
              <QrCode size={180} strokeWidth={1.2} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
