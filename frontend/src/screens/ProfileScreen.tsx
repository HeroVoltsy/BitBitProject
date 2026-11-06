import { useState } from "react";
import { ChevronRight, Settings, Star } from "lucide-react";
import { RatingRow } from "../components/RatingRow";
import { RateEventDialog } from "../components/RateEventDialog";
import {
  HOST_STATS,
  ORGANIZED_EVENTS,
  PAST_JOINED_EVENTS,
  type PastEvent,
} from "../data/events";
import type { EventItem, ProfileTab, ScreenName } from "../types";
import type { EventRating } from "../useRatings";
import { initialsOf } from "../useAuth";

/** "Plaza Rizal, Naga City" -> "Plaza Rizal" */
const shortPlace = (loc: string) => loc.split(",")[0];

/** Small month/day block, matching the date chip on event cards. */
function DateBlock({ event }: { event: EventItem }) {
  return (
    <span className="pf-date" aria-hidden="true">
      <span className="pf-date__m">{event.monthLabel}</span>
      <span className="pf-date__d">{event.day}</span>
    </span>
  );
}

export function ProfileScreen({
  onNavigate,
  onOpenEvent,
  tab: tabProp,
  onTabChange: setTab,
  isHost = false,
  ratings,
  onRate,
  userName,
  userEmail,
  goingEvents,
}: {
  onNavigate: (s: ScreenName) => void;
  onOpenEvent: (e: EventItem) => void;
  tab: ProfileTab;
  onTabChange: (t: ProfileTab) => void;
  /** Hosts also see organizer stats + the Organizer tab. Liked events live in the nav bar. */
  isHost?: boolean;
  /** Ratings this user gave to past events, keyed by event id. */
  ratings: Record<string, EventRating>;
  onRate: (event: PastEvent, rating: Omit<EventRating, "ratedAt">) => void;
  /** The logged-in user. */
  userName: string;
  userEmail: string;
  /** Upcoming events this user joined (updates on join / leave). */
  goingEvents: EventItem[];
}) {
  const tab = !isHost && tabProp === "organizer" ? "attendee" : tabProp;
  const [rating, setRating] = useState<PastEvent | null>(null);

  const ratedCount = PAST_JOINED_EVENTS.filter((e) => ratings[e.id]).length;

  return (
    <div className="page page--narrow">
      <h1 className="page-title pf-title">Profile</h1>

      <section className="pf-head card" aria-label="Your account">
        <div className="pf-head__top">
          <span className="pf-head__avatar" aria-hidden="true">
            {initialsOf(userName)}
          </span>
          <div className="pf-head__id">
            <h2 className="pf-head__name">{userName}</h2>
            <p className="pf-head__meta">
              <span className="pf-head__email">{userEmail}</span>
              <span className="pf-head__dot" aria-hidden="true">
                {" · "}
              </span>
              <span className="pf-head__role">{isHost ? "Host account" : "Joiner account"}</span>
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost pf-head__settings"
            onClick={() => onNavigate("settings")}
            aria-label="Settings"
          >
            <Settings size={18} strokeWidth={2} aria-hidden="true" />
            <span className="pf-head__settings-label">Settings</span>
          </button>
        </div>

        {/* Host reputation (joiners see their counts on the tabs below) */}
        {isHost && (
          <div className="pf-stats">
            <button
              type="button"
              className="pf-stat"
              onClick={() => onNavigate("organized-events")}
              aria-label={`${HOST_STATS.hosted} events organized. View all`}
            >
              <strong>{HOST_STATS.hosted}</strong>
              <span>Events</span>
            </button>
            <button
              type="button"
              className="pf-stat"
              onClick={() => onNavigate("followers")}
              aria-label={`${HOST_STATS.followers} followers. View all`}
            >
              <strong>{HOST_STATS.followers}</strong>
              <span>Followers</span>
            </button>
            <div className="pf-stat pf-stat--static">
              <strong className="pf-stat__rating">
                <Star size={15} strokeWidth={2} fill="currentColor" aria-hidden="true" />
                {HOST_STATS.rating.toFixed(1)}
              </strong>
              <span>Rating</span>
            </div>
          </div>
        )}
      </section>

      <div className="segmented pf-tabs">
        {isHost && (
          <button
            className={`segmented__tab ${tab === "organizer" ? "segmented__tab--active" : ""}`}
            onClick={() => setTab("organizer")}
          >
            Organizer
          </button>
        )}
        <button
          className={`segmented__tab ${tab === "attendee" ? "segmented__tab--active" : ""}`}
          onClick={() => setTab("attendee")}
        >
          {isHost ? "Attendee" : "Going"}
          <span className="segmented__count">{goingEvents.length}</span>
        </button>
        <button
          className={`segmented__tab ${tab === "past" ? "segmented__tab--active" : ""}`}
          onClick={() => setTab("past")}
        >
          Past
          <span className="segmented__count">{PAST_JOINED_EVENTS.length}</span>
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
      ) : tab === "past" ? (
        <section className="block">
          <h2 className="section-title">Past events you joined</h2>
          <p className="muted past-sub">
            {ratedCount} of {PAST_JOINED_EVENTS.length} rated. The host is notified when you rate,
            and you can rate anonymously.
          </p>
          <div className="stack">
            {PAST_JOINED_EVENTS.map((e) => {
              const mine = ratings[e.id];
              return (
                <article className="past-row card" key={e.id}>
                  <button type="button" className="past-row__main" onClick={() => onOpenEvent(e)}>
                    <DateBlock event={e} />
                    <span className="pf-row__info">
                    <strong className="past-row__title">{e.title}</strong>
                    <span className="past-row__meta">
                      {e.dateLabel} · Hosted by {e.hostName}
                    </span>
                    {mine && (
                      <span className="past-row__mine">
                        <span className="mini-stars" aria-hidden="true">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={15}
                              strokeWidth={2}
                              fill={mine.stars >= n ? "currentColor" : "none"}
                            />
                          ))}
                        </span>
                        <span className="sr-only">You rated it {mine.stars} out of 5</span>
                        {mine.anonymous && <span className="past-row__tag">Anonymous</span>}
                      </span>
                    )}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={mine ? "btn-ghost past-row__rate" : "btn-primary past-row__rate"}
                    aria-label={mine ? `Edit your rating for ${e.title}` : `Rate ${e.title}`}
                    onClick={() => setRating(e)}
                  >
                    {mine ? (
                      "Edit"
                    ) : (
                      <>
                        <Star size={16} strokeWidth={2.2} aria-hidden="true" /> Rate
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
          {PAST_JOINED_EVENTS.length === 0 && (
            <p className="empty">Events you attend will show here so you can rate them.</p>
          )}
        </section>
      ) : (
        <section className="block">
          <h2 className="section-title block__title">Events you're going to</h2>
          {goingEvents.length > 0 ? (
            <div className="stack">
              {goingEvents.map((e) => (
                <button type="button" className="pf-row card" key={e.id} onClick={() => onOpenEvent(e)}>
                  <DateBlock event={e} />
                  <span className="pf-row__info">
                    <strong className="pf-row__title">{e.title}</strong>
                    <span className="pf-row__meta">
                      {e.dateLine.split(" · ")[1] ?? e.dateLine} · {shortPlace(e.location)}
                    </span>
                  </span>
                  <ChevronRight size={18} strokeWidth={2.2} className="pf-row__chev" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <div className="pf-empty card">
              <strong>You&rsquo;re not going to any events yet</strong>
              <span className="muted">Events you join will show here.</span>
              {!isHost && (
                <button type="button" className="btn-primary pf-empty__cta" onClick={() => onNavigate("home")}>
                  Find Events
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {rating && (
        <RateEventDialog
          event={rating}
          hostName={rating.hostName}
          initial={ratings[rating.id]}
          onClose={() => setRating(null)}
          onSubmit={(r) => {
            onRate(rating, r);
            setRating(null);
          }}
        />
      )}
    </div>
  );
}
