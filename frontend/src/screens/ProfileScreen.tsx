import { Settings } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { initialsOf } from "../useAuth";
import type { EventItem, ProfileTab, ScreenName } from "../types";
export function ProfileScreen({
  onNavigate,
  onOpenEvent,
  tab,
  onTabChange,
  isHost,
  userName,
  userEmail,
  events,
  goingEvents,
}: {
  onNavigate: (s: ScreenName) => void;
  onOpenEvent: (e: EventItem) => void;
  tab: ProfileTab;
  onTabChange: (t: ProfileTab) => void;
  isHost: boolean;
  userName: string;
  userEmail: string;
  events: EventItem[];
  goingEvents: EventItem[];
}) {
  const active = !isHost && tab === "organizer" ? "attendee" : tab;
  const shown =
    active === "organizer"
      ? events.filter((e) => e.hosting)
      : goingEvents.filter((e) => (active === "past" ? e.started : !e.started));
  return (
    <div className="page page--narrow">
      <h1 className="page-title">Profile</h1>
      <section className="pf-head card">
        <div className="pf-head__top">
          <span className="pf-head__avatar">{initialsOf(userName)}</span>
          <div className="pf-head__id">
            <h2>{userName}</h2>
            <p>{userEmail}</p>
            <span>{isHost ? "Host" : "Joiner"} account</span>
          </div>
          <button className="btn-ghost" onClick={() => onNavigate("settings")}>
            <Settings size={18} /> Settings
          </button>
        </div>
      </section>
      <div className="segmented pf-tabs">
        {(
          [...(isHost ? ["organizer"] : []), "attendee", "past"] as ProfileTab[]
        ).map((t) => (
          <button
            className={`segmented__tab ${active === t ? "segmented__tab--active" : ""}`}
            key={t}
            onClick={() => onTabChange(t)}
          >
            {t === "organizer"
              ? "Organizer"
              : t === "attendee"
                ? "Going"
                : "Past"}
          </button>
        ))}
      </div>
      <div className="stack">
        {shown.map((e) => (
          <EventCard key={e.id} event={e} onOpen={() => onOpenEvent(e)} />
        ))}
      </div>
      {!shown.length && <p className="empty">No events to show.</p>}
    </div>
  );
}
