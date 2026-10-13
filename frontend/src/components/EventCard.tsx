import { Clock, MapPin } from "lucide-react";
import type { EventItem } from "../types";
import { CategoryBadge } from "./CategoryBadge";
import { StripePlaceholder } from "./StripePlaceholder";
import { AvatarGroup } from "./Avatar";

/** Full event card used in the Home feed ("Events Around You"). */
export function EventCard({ event, onOpen }: { event: EventItem; onOpen: () => void }) {
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
          <span className="sasali-pill">sasali</span>
        </div>
      </div>
    </button>
  );
}
