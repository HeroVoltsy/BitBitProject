import { useEffect, useRef, useState } from "react";
import {
  Home,
  CalendarDays,
  MapPin,
  CalendarCheck,
  Heart,
  LayoutDashboard,
  ScanLine,
  UserCog,
  Bell,
  Plus,
  Menu,
  X,
} from "lucide-react";
import type { ScreenName } from "../types";
import { initialsOf } from "../useAuth";
import { ParrotLogo } from "./ParrotLogo";
import { useAuthGate } from "./AuthGate";

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

// Attendees (and signed-out visitors) browse and join events.
const ATTENDEE_LINKS: NavLink[] = [
  { key: "home", label: "Home", Icon: Home },
  { key: "calendar", label: "Schedule", Icon: CalendarDays },
  { key: "map", label: "Explore", Icon: MapPin },
  { key: "liked-events", label: "Liked Events", Icon: Heart },
];

// Hosts get an admin-style set of tools instead of the event feed.
const HOST_LINKS: NavLink[] = [
  { key: "host-dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { key: "organized-events", label: "My Events", Icon: CalendarCheck },
  { key: "qr-scanner", label: "Check-in", Icon: ScanLine },
];

export function TopNav({
  active,
  onNavigate,
  userName,
  isHost = false,
  hasStaffAccess = false,
  staffInvites = [],
}: {
  active: ScreenName;
  onNavigate: (s: ScreenName) => void;
  /** Undefined when signed out — shows a Sign Up button instead of the avatar. */
  userName?: string;
  /** Host (organizer) UI: host links + Post an Event. Otherwise the attendee UI. */
  isHost?: boolean;
  /** Shows the "Staff" link: the user has a Check-in Staff invite or assignment. */
  hasStaffAccess?: boolean;
  /** Pending Check-in Staff invitations, shown at the top of the bell menu. */
  staffInvites?: { eventTitle: string; invitedBy: string }[];
}) {
  const { requireAuth, openAuth } = useAuthGate();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const unread = seen ? 0 : NOTIFICATIONS.length + staffInvites.length;
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

  const toggleNotif = () =>
    requireAuth(() => {
      setNotifOpen((v) => {
        const next = !v;
        if (next) setSeen(true); // opening marks as read
        return next;
      });
    }, "Log in to see your notifications.");

  const postEvent = () => {
    setOpen(false);
    requireAuth(() => go("create-event"), "Log in to post an event.");
  };

  const STAFF_LINK: NavLink = { key: "staff", label: "Staff", Icon: UserCog };
  const links = [...(isHost ? HOST_LINKS : ATTENDEE_LINKS), ...(userName && hasStaffAccess ? [STAFF_LINK] : [])];

  // Liked Events needs an account (likes belong to a user).
  const openLink = (key: ScreenName) =>
    key === "liked-events"
      ? (setOpen(false), requireAuth(() => go(key), "Log in to see your liked events."))
      : go(key);

  // Which top-level tab is highlighted (sub-screens map back to a parent).
  // Profile / settings aren't nav links, so they highlight nothing.
  const highlighted: ScreenName =
    active === "event-detail"
      ? isHost
        ? "host-dashboard"
        : "home"
      : active === "attendance"
        ? "qr-scanner"
        : active === "staff-scanner"
          ? "staff"
          : active;

  return (
    <header className="topnav">
      <div className="topnav__inner">
        <button className="brand" onClick={() => go(isHost ? "host-dashboard" : "home")} aria-label="Sali Ka home">
          <span className="brand__mark">
            <ParrotLogo size={22} />
          </span>
          <span className="brand__name">
            sali ka<span className="brand__q">?</span>
          </span>
        </button>

        <nav className="topnav__links" aria-label="Primary">
          {links.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`navlink ${highlighted === key ? "navlink--active" : ""}`}
              onClick={() => openLink(key)}
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
              {userName && unread > 0 && <span className="iconbtn__dot">{unread}</span>}
            </button>
            {notifOpen && (
              <div className="notif__pop card" role="dialog" aria-label="Notifications">
                <div className="notif__head">Notifications</div>
                {staffInvites.map((n) => (
                  <button
                    type="button"
                    className="notif__item notif__item--action"
                    key={n.eventTitle}
                    onClick={() => go("staff")}
                  >
                    <span className="notif__title">
                      {n.invitedBy} invited you to be check-in staff for {n.eventTitle}
                    </span>
                    <span className="notif__meta">Tap to accept or decline</span>
                  </button>
                ))}
                {NOTIFICATIONS.map((n) => (
                  <div className="notif__item" key={n.title}>
                    <span className="notif__title">{n.title}</span>
                    <span className="notif__meta">{n.meta}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isHost && (
            <button className="btn-primary topnav__post" onClick={postEvent}>
              <Plus size={18} strokeWidth={2.6} aria-hidden="true" />
              <span>Post an Event</span>
            </button>
          )}

          {userName ? (
            <button className="topnav__avatar" onClick={() => go("profile")} aria-label="Your profile">
              {initialsOf(userName)}
            </button>
          ) : (
            <button
              type="button"
              className="topnav__signup"
              onClick={() => {
                setOpen(false);
                openAuth("signup");
              }}
            >
              Sign Up
            </button>
          )}

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
          {links.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`navlink ${highlighted === key ? "navlink--active" : ""}`}
              onClick={() => openLink(key)}
            >
              <Icon size={18} strokeWidth={2.2} />
              <span>{label}</span>
            </button>
          ))}
          {isHost && (
            <button className="btn-primary" onClick={postEvent}>
              <Plus size={18} strokeWidth={2.6} aria-hidden="true" />
              <span>Post an Event</span>
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
