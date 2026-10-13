import { useState } from "react";
import { Settings, QrCode, Star } from "lucide-react";
import { ScheduleItem } from "../components/ScheduleItem";
import { FEED_EVENTS, GOING_LIST, HOST_STATS, HOSTED_RATINGS, USER } from "../data/events";
import type { EventItem, ScreenName } from "../types";

export function ProfileScreen({
  onNavigate,
  onOpenEvent,
}: {
  onNavigate: (s: ScreenName) => void;
  onOpenEvent: (e: EventItem) => void;
}) {
  const [tab, setTab] = useState<"attendee" | "organizer">("organizer");

  const hostedEvent = FEED_EVENTS.find((e) => e.hosting) ?? FEED_EVENTS[0];
  const attendingEvent = FEED_EVENTS.find((e) => e.attending) ?? FEED_EVENTS[0];
  // Match a going-list entry to the real event so its detail opens correctly.
  const openGoing = (title: string) =>
    onOpenEvent(FEED_EVENTS.find((e) => e.title === title && e.attending) ?? attendingEvent);

  return (
    <div className="page">
      <div className="profile-top">
        <h1 className="page-title">Profile</h1>
        <button className="btn-ghost" onClick={() => onNavigate("settings")}>
          <Settings size={18} strokeWidth={2} /> Settings
        </button>
      </div>

      <div className="profile-grid">
        <section className="identity-card card">
          <span className="identity-card__avatar">{USER.initials}</span>
          <h2 className="identity-card__name">{USER.name}</h2>
          <p className="muted">{USER.memberSince}</p>

          {/* Followers + reputation */}
          <div className="host-stats host-stats--last">
            <div className="host-stat">
              <strong>{HOST_STATS.hosted}</strong>
              <span>Events</span>
            </div>
            <div className="host-stat">
              <strong>{HOST_STATS.followers}</strong>
              <span>Followers</span>
            </div>
            <div className="host-stat">
              <strong className="host-stat__rating">
                <Star size={15} strokeWidth={2} fill="currentColor" /> {HOST_STATS.rating.toFixed(1)}
              </strong>
              <span>Rating</span>
            </div>
          </div>
        </section>

        <section className="qr-card card">
          <div className="qr-card__text">
            <h3>Membership QR</h3>
            <p className="muted">Scan this to check in at hosted events</p>
            <span className="qr-card__id">ID #{USER.membershipId}</span>
          </div>
          <div className="qr-graphic" aria-hidden="true">
            <QrCode size={104} strokeWidth={1.4} />
          </div>
        </section>
      </div>

      <div className="segmented">
        <button
          className={`segmented__tab ${tab === "organizer" ? "segmented__tab--active" : ""}`}
          onClick={() => setTab("organizer")}
        >
          Organizer
        </button>
        <button
          className={`segmented__tab ${tab === "attendee" ? "segmented__tab--active" : ""}`}
          onClick={() => setTab("attendee")}
        >
          Attendee
        </button>
      </div>

      {tab === "organizer" ? (
        <section className="block">
          <div className="ratings-head">
            <h2 className="section-title">Ratings on your events</h2>
            <span className="ratings-avg">
              <Star size={16} strokeWidth={2} fill="currentColor" />
              {HOST_STATS.rating.toFixed(1)} avg · {HOST_STATS.reviews} reviews
            </span>
          </div>
          <div className="stack">
            {HOSTED_RATINGS.map((e) => (
              <button className="rating-row card" key={e.title} onClick={() => onOpenEvent(hostedEvent)}>
                <span className="rating-row__info">
                  <strong>{e.title}</strong>
                  <span className="muted">{e.date}</span>
                </span>
                <span className="rating-row__score">
                  <span className="stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={15}
                        strokeWidth={2}
                        fill={Math.round(e.rating) >= n ? "currentColor" : "none"}
                      />
                    ))}
                  </span>
                  <span className="rating-row__val">
                    {e.rating.toFixed(1)} <span className="muted">({e.reviews})</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="block">
          <h2 className="section-title block__title">Events you're going to</h2>
          <div className="stack">
            {GOING_LIST.map((it) => (
              <ScheduleItem
                key={it.title}
                title={it.title}
                time={it.meta}
                location={it.location}
                onClick={() => openGoing(it.title)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
