import { useEffect, useState } from "react";
import { ArrowLeft, Heart, CalendarDays, MapPin, Navigation, QrCode, X, ScanLine, ClipboardList } from "lucide-react";
import { StripePlaceholder } from "../components/StripePlaceholder";
import { CategoryBadge } from "../components/CategoryBadge";
import { AvatarGroup } from "../components/Avatar";
import { useToast } from "../components/Toast";
import { USER } from "../data/events";
import type { EventItem, ScreenName } from "../types";

const ABOUT =
  "Come support local Bicol farmers, craftsmen, and creators this weekend! Fresh produce, pili nut treats, handmade crafts, hot Naga coffee, and games for the kids. Family and pet friendly. Bring your own reusable bag!";

export function EventDetailScreen({
  event,
  onBack,
  onOpenHost,
  onNavigate,
}: {
  event: EventItem;
  onBack: () => void;
  onOpenHost: () => void;
  onNavigate: (s: ScreenName) => void;
}) {
  const [fav, setFav] = useState(false);
  const [joined, setJoined] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const notify = useToast();

  const attending = Boolean(event.attending) || joined;

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
        <ArrowLeft size={18} strokeWidth={2.2} /> Back to events
      </button>

      <div className="detail-cover">
        <StripePlaceholder className="detail-cover__stripes" />
        <button
          className={`round-btn detail-cover__fav ${fav ? "round-btn--on" : ""}`}
          aria-pressed={fav}
          aria-label="Save event"
          onClick={() => setFav((v) => !v)}
        >
          <Heart size={20} strokeWidth={2.2} fill={fav ? "currentColor" : "none"} />
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
            {USER.name}
          </button>
        </p>

        <div className="info-card card">
          <div className="info-row">
            <span className="info-icon">
              <CalendarDays size={20} strokeWidth={2} />
            </span>
            <span className="info-stack">
              <strong>Sunday, August 23, 2026</strong>
              <span className="muted">10:00 AM - 2:00 PM</span>
            </span>
          </div>
          <div className="info-divider" />
          <div className="info-row">
            <span className="info-icon">
              <MapPin size={20} strokeWidth={2} />
            </span>
            <span className="info-stack">
              <strong>{event.location}</strong>
              <span className="muted">Centro, Naga City, Camarines Sur</span>
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
            </div>
          </div>
        ) : attending ? (
          <button className="btn-primary detail-rsvp" onClick={() => setQrOpen(true)}>
            <QrCode size={18} strokeWidth={2.2} /> Show My QR for Attendance
          </button>
        ) : (
          <button
            className="btn-primary detail-rsvp"
            onClick={() => {
              setJoined(true);
              notify("You're going! Show your QR to check in.");
            }}
          >
            Join This Event
          </button>
        )}
      </div>

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
            <span className="qr-card__id">ID #{USER.membershipId}</span>
          </div>
        </div>
      )}
    </div>
  );
}
