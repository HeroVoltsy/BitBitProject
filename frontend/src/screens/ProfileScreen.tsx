import { Settings, QrCode, Star, Heart } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { RatingRow } from "../components/RatingRow";
import { ScheduleItem } from "../components/ScheduleItem";
import { FEED_EVENTS, GOING_LIST, HOST_STATS, ORGANIZED_EVENTS, USER } from "../data/events";
import type { EventItem, ProfileTab, ScreenName } from "../types";

export function ProfileScreen({
  onNavigate,
  onOpenEvent,
  tab,
  onTabChange: setTab,
  likedEvents,
  onToggleLiked,
}: {
  onNavigate: (s: ScreenName) => void;
  onOpenEvent: (e: EventItem) => void;
  tab: ProfileTab;
  onTabChange: (t: ProfileTab) => void;
  likedEvents: EventItem[];
  onToggleLiked: (id: string) => void;
}) {

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
            <button
              className="host-stat host-stat--link"
              onClick={() => onNavigate("organized-events")}
              aria-label={`${HOST_STATS.hosted} events organized. View all`}
            >
              <strong>{HOST_STATS.hosted}</strong>
              <span>Events</span>
            </button>
            <button
              className="host-stat host-stat--link"
              onClick={() => onNavigate("followers")}
              aria-label={`${HOST_STATS.followers} followers. View all`}
            >
              <strong>{HOST_STATS.followers}</strong>
              <span>Followers</span>
            </button>
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
        <button
          className={`segmented__tab ${tab === "liked" ? "segmented__tab--active" : ""}`}
          onClick={() => setTab("liked")}
        >
          Liked{likedEvents.length > 0 && <span className="segmented__count">{likedEvents.length}</span>}
        </button>
      </div>

      {tab === "organizer" ? (
        <section className="block">
          <div className="ratings-head">
            <h2 className="section-title">Ratings on your events</h2>
            <span className="ratings-avg">
              <Star size={16} strokeWidth={2} fill="currentColor" />
              {HOST_STATS.rating.toFixed(1)} avg · {HOST_STATS.reviews} reviews across{" "}
              {HOST_STATS.hosted} events
            </span>
          </div>
          <div className="stack">
            {ORGANIZED_EVENTS.map((e) => (
              <RatingRow key={e.id} event={e} onOpen={() => onOpenEvent(e)} />
            ))}
          </div>
        </section>
      ) : tab === "liked" ? (
        <section className="block">
          <h2 className="section-title block__title">Events you liked</h2>
          {likedEvents.length > 0 ? (
            <div className="feed-grid">
              {likedEvents.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  onOpen={() => onOpenEvent(e)}
                  liked
                  onToggleLiked={() => onToggleLiked(e.id)}
                />
              ))}
            </div>
          ) : (
            <div className="liked-empty card">
              <Heart size={28} strokeWidth={2} />
              <strong>No liked events yet</strong>
              <span className="muted">
                Tap the heart on any event to save it here, so you can find it again later.
              </span>
            </div>
          )}
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
