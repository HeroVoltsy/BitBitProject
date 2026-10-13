import { useEffect, useRef, useState } from "react";
import { Home, CalendarDays, MapPin, CalendarCheck, Bell, Plus, Menu, X } from "lucide-react";
import type { ScreenName } from "../types";
import { initialsOf } from "../useAuth";
import { ParrotLogo } from "./ParrotLogo";

const NOTIFICATIONS = [
  { title: "Naga Sunday Market starts soon", meta: "Today · 10:00 AM · Plaza Rizal" },
  { title: "Maria Santos is now going to your event", meta: "2h ago" },
  { title: "New event near you: Acoustic Nights", meta: "Yesterday · Magsaysay Ave" },
];

interface NavLink {
  key: ScreenName;
  label: string;
  Icon: typeof Home;
}

const LINKS: NavLink[] = [
  { key: "home", label: "Home", Icon: Home },
  { key: "calendar", label: "Schedule", Icon: CalendarDays },
  { key: "map", label: "Explore", Icon: MapPin },
  { key: "hosted", label: "Hosted Events", Icon: CalendarCheck },
];

export function TopNav({
  active,
  onNavigate,
  userName,
}: {
  active: ScreenName;
  onNavigate: (s: ScreenName) => void;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(3);
  const notifRef = useRef<HTMLDivElement>(null);

  const go = (s: ScreenName) => {
    setOpen(false);
    setNotifOpen(false);
    onNavigate(s);
  };

  // Close the notifications menu on outside click / Escape.
  useEffect(() => {
    if (!notifOpen) return;
    const onDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNotifOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [notifOpen]);

  const toggleNotif = () => {
    setNotifOpen((v) => {
      const next = !v;
      if (next) setUnread(0); // opening marks as read
      return next;
    });
  };

  // Which top-level tab is highlighted (sub-screens map back to a parent).
  // Profile / settings / organizer tools aren't nav links, so they highlight nothing.
  const highlighted: ScreenName = active === "event-detail" ? "home" : active;

  return (
    <header className="topnav">
      <div className="topnav__inner">
        <button className="brand" onClick={() => go("home")} aria-label="Sali Ka home">
          <span className="brand__mark">
            <ParrotLogo size={22} />
          </span>
          <span className="brand__name">
            sali ka<span className="brand__q">?</span>
          </span>
        </button>

        <nav className="topnav__links" aria-label="Primary">
          {LINKS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`navlink ${highlighted === key ? "navlink--active" : ""}`}
              onClick={() => go(key)}
              aria-current={highlighted === key ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={2.2} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="topnav__actions">
          <div className="notif" ref={notifRef}>
            <button
              className="iconbtn"
              aria-label="Notifications"
              aria-expanded={notifOpen}
              onClick={toggleNotif}
            >
              <Bell size={20} strokeWidth={2} />
              {unread > 0 && <span className="iconbtn__dot">{unread}</span>}
            </button>
            {notifOpen && (
              <div className="notif__pop card" role="dialog" aria-label="Notifications">
                <div className="notif__head">Notifications</div>
                {NOTIFICATIONS.map((n) => (
                  <div className="notif__item" key={n.title}>
                    <span className="notif__title">{n.title}</span>
                    <span className="notif__meta">{n.meta}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn-primary topnav__post" onClick={() => go("create-event")}>
            <Plus size={18} strokeWidth={2.6} />
            <span>Post an Event</span>
          </button>

          <button className="topnav__avatar" onClick={() => go("profile")} aria-label="Your profile">
            {initialsOf(userName)}
          </button>

          <button
            className="topnav__burger"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="topnav__mobile" aria-label="Mobile">
          {LINKS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`navlink ${highlighted === key ? "navlink--active" : ""}`}
              onClick={() => go(key)}
            >
              <Icon size={18} strokeWidth={2.2} />
              <span>{label}</span>
            </button>
          ))}
          <button className="btn-primary" onClick={() => go("create-event")}>
            <Plus size={18} strokeWidth={2.6} />
            <span>Post an Event</span>
          </button>
        </nav>
      )}
    </header>
  );
}
