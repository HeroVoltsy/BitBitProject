import { Check, Clock, Heart, MapPin, Ticket } from "lucide-react";
import type { EventItem } from "../types";
import { CategoryBadge } from "./CategoryBadge";
import { StripePlaceholder } from "./StripePlaceholder";
import { AvatarGroup } from "./Avatar";

/**
 * Full event card used in the Home feed ("Events Around You").
 * Pass onToggleLiked to show a heart for liking the event without opening it.
 * Pass onSasali to make "sasali" a button that joins the event from the card.
 *
 * The heart and sasali sit on top of the card (siblings, not children) because a
 * <button> can't contain another button.
 */
export function EventCard({
  event,
  onOpen,
  liked = false,
  onToggleLiked,
  joined = false,
  onSasali,
}: {
  event: EventItem;
  onOpen: () => void;
  liked?: boolean;
  onToggleLiked?: () => void;
  joined?: boolean;
  onSasali?: () => void;
}) {
  if (!onToggleLiked && !onSasali) return <CardButton event={event} onOpen={onOpen} joined={joined} />;
  return (
    <div className="eventcard-wrap">
      <CardButton event={event} onOpen={onOpen} sasaliSlot={Boolean(onSasali)} joined={joined} />
      {onToggleLiked && (
        <button
          type="button"
          className={`eventcard__like ${liked ? "eventcard__like--on" : ""}`}
          aria-pressed={liked}
          aria-label={liked ? `Unlike ${event.title}` : `Like ${event.title}`}
          onClick={onToggleLiked}
        >
          <Heart size={18} strokeWidth={2.2} fill={liked ? "currentColor" : "none"} />
        </button>
      )}
      {onSasali && (
        <button
          type="button"
          className={`sasali-pill eventcard__sasali ${joined ? "sasali-pill--on" : ""}`}
          aria-label={joined ? `You're going to ${event.title}. Open event` : `Join ${event.title}`}
          onClick={onSasali}
        >
          <SasaliLabel joined={joined} />
        </button>
      )}
    </div>
  );
}

function SasaliLabel({ joined }: { joined: boolean }) {
  return joined ? (
    <>
      <Check size={14} strokeWidth={3} aria-hidden="true" /> GOING
    </>
  ) : (
    <>
      <Ticket size={14} strokeWidth={2.4} aria-hidden="true" /> SASALI
    </>
  );
}

function CardButton({
  event,
  onOpen,
  sasaliSlot = false,
  joined = false,
}: {
  event: EventItem;
  onOpen: () => void;
  /** Leave room for the sasali button that's layered on top of the card. */
  sasaliSlot?: boolean;
  joined?: boolean;
}) {
  return (
    <button className="eventcard" onClick={onOpen} aria-label={`Open ${event.title}`}>
      <div className="eventcard__cover">
        <StripePlaceholder className="eventcard__stripes" />
        <span className="eventcard__badge">
          <CategoryBadge category={event.category} />
        </span>
        <span className="eventcard__date">
          <span className="eventcard__date-m">{event.monthLabel}</span>
          <span className="eventcard__date-d">{event.day}</span>
        </span>
        {event.hosting && <span className="eventcard__hosting">YOU'RE HOSTING</span>}
      </div>

      <div className="eventcard__body">
        <h3 className="eventcard__title">{event.title}</h3>
        <div className="metarow">
          <Clock size={15} strokeWidth={2} />
          <span>{event.dateLine}</span>
        </div>
        <div className="metarow">
          <MapPin size={15} strokeWidth={2} />
          <span>{event.location}</span>
        </div>

        <div className="eventcard__foot">
          <span className="going">
            <AvatarGroup count={4} />
            <span className="going__count">{event.going} going</span>
          </span>
          {sasaliSlot ? (
            // Invisible twin of the real button, so the footer keeps its size.
            <span className="sasali-pill sasali-pill--slot" aria-hidden="true">
              <SasaliLabel joined={joined} />
            </span>
          ) : (
            <span className="sasali-pill"><SasaliLabel joined={joined} /></span>
          )}
        </div>
      </div>
    </button>
  );
}
