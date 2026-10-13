import { ChevronRight } from "lucide-react";

/** A compact row with title + meta and a chevron (Calendar & Profile screens). */
export function ScheduleItem({
  title,
  time,
  location,
  onClick,
}: {
  title: string;
  time: string;
  location: string;
  onClick?: () => void;
}) {
  return (
    <button className="scheduleitem" onClick={onClick}>
      <span className="scheduleitem__content">
        <span className="scheduleitem__title">{title}</span>
        <span className="scheduleitem__meta">
          {time} <span aria-hidden="true">·</span> {location}
        </span>
      </span>
      <ChevronRight size={20} strokeWidth={2} className="muted" />
    </button>
  );
}
