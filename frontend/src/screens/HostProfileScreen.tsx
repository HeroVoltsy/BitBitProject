import { useState } from "react";
import { ArrowLeft, Star, UserPlus, UserCheck } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { HOST_STATS, ORGANIZED_EVENTS, USER } from "../data/events";
import type { EventItem } from "../types";

// Public host details (demo data); counts and ratings come from HOST_STATS.
const HOST = {
  ...HOST_STATS,
  role: "Community Organizer",
  location: "Naga City, Camarines Sur",
};

export function HostProfileScreen({
  onBack,
  onOpenEvent,
}: {
  onBack: () => void;
  onOpenEvent: (e: EventItem) => void;
}) {
  const [following, setFollowing] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [hover, setHover] = useState(0);

  const followers = HOST.followers + (following ? 1 : 0);

  return (
    <div className="page page--narrow">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={18} strokeWidth={2.2} /> Back to event
      </button>

      <section className="host-header card">
        <span className="identity-card__avatar host-avatar">{USER.initials}</span>
        <h1 className="host-name">{USER.name}</h1>
        <p className="muted host-role">
          {HOST.role} · {HOST.location}
        </p>
        <p className="muted">{USER.memberSince}</p>

        <div className="host-stats">
          <div className="host-stat">
            <strong>{HOST.hosted}</strong>
            <span>Events</span>
          </div>
          <div className="host-stat">
            <strong>{followers}</strong>
            <span>Followers</span>
          </div>
          <div className="host-stat">
            <strong>{HOST.rating.toFixed(1)}</strong>
            <span>Rating</span>
          </div>
        </div>

        <button
          className={`follow-btn ${following ? "follow-btn--on" : "btn-primary"}`}
          onClick={() => setFollowing((v) => !v)}
        >
          {following ? (
            <>
              <UserCheck size={18} strokeWidth={2.4} /> Following
            </>
          ) : (
            <>
              <UserPlus size={18} strokeWidth={2.4} /> Follow
            </>
          )}
        </button>
      </section>

      <section className="rating-card card">
        <div className="rating-summary">
          <span className="rating-big">{HOST.rating.toFixed(1)}</span>
          <span className="stars" aria-label={`Average rating ${HOST.rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={18}
                strokeWidth={2}
                fill={Math.round(HOST.rating) >= n ? "currentColor" : "none"}
              />
            ))}
          </span>
          <span className="muted">{HOST.reviews} reviews</span>
        </div>

        <div className="rating-divider" />

        <div className="rate-block">
          <span className="field__label">{myRating > 0 ? "Your rating" : "Rate this host"}</span>
          <div className="stars-input">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setMyRating(n)}
              >
                <Star
                  size={28}
                  strokeWidth={2}
                  fill={(hover || myRating) >= n ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>
          {myRating > 0 && (
            <span className="rate-thanks">Thanks for rating {USER.firstName}!</span>
          )}
        </div>
      </section>

      <section className="block">
        <h2 className="section-title block__title">Events by {USER.firstName}</h2>
        <div className="feed-grid">
          {ORGANIZED_EVENTS.map((e) => (
            <EventCard key={e.id} event={e} onOpen={() => onOpenEvent(e)} />
          ))}
        </div>
      </section>
    </div>
  );
}
