import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
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
import type { AppNotification } from "../data/notifications";
import { initialsOf } from "../useAuth";
import { ParrotLogo } from "./ParrotLogo";
import { useAuthGate } from "./AuthGate";


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
  onRespondInvite,
  notifications = [],
  onOpenEvent,
}: {
  active: ScreenName;
  onNavigate: (s: ScreenName) => void;
  /** Undefined when signed out — shows a Sign Up button instead of the avatar. */
  userName?: string;
  /** Host (organizer) UI: host links + Post an Event. Otherwise the attendee UI. */
  isHost?: boolean;
  /** Shows the "Staff" link: the user has accepted at least one Check-in Staff invite. */
  hasStaffAccess?: boolean;
  /** Pending Check-in Staff invitations, shown at the top of the bell menu. */
  staffInvites?: { eventId: string; eventTitle: string; invitedBy: string }[];
  /** Accept or decline a staff invitation straight from the bell menu. */
  onRespondInvite?: (eventId: string, accept: boolean) => void;
  /** Bell items; `available` is false when the linked event no longer exists. */
  notifications?: (AppNotification & { available: boolean })[];
  /** Opens the event a notification is about. */
  onOpenEvent?: (eventId: string) => void;
}) {
  const { requireAuth, openAuth } = useAuthGate();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  // Ids already shown to the user, so a newly joined event's reminder
  // (or a new invite) brings the badge back.
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const allIds = [
    ...staffInvites.map((i) => `invite-${i.eventId}`),
    ...notifications.map((n) => n.id),
  ];
  const unread = allIds.filter((id) => !seenIds.includes(id)).length;
  const notifRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  // Briefly highlights the Staff link right after an invite is accepted.
  const [staffJustAdded, setStaffJustAdded] = useState(false);
  useEffect(() => {
    if (!staffJustAdded) return;
    const t = setTimeout(() => setStaffJustAdded(false), 2400);
    return () => clearTimeout(t);
  }, [staffJustAdded]);

  const respondInvite = (eventId: string, accept: boolean) => {
    onRespondInvite?.(eventId, accept);
    if (accept) setStaffJustAdded(true);
    // The row disappears, so close the menu and put focus back on the bell.
    setNotifOpen(false);
    bellRef.current?.focus();
  };

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
        if (next) setSeenIds(allIds); // opening marks everything as read
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
              className={`navlink ${highlighted === key ? "navlink--active" : ""} ${
                key === "staff" && staffJustAdded ? "navlink--new" : ""
              }`}
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
              ref={bellRef}
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
                  <div className="notif__item notif__invite" key={n.eventId}>
                    <span className="notif__title">
                      {n.invitedBy} invited you to be check-in staff for {n.eventTitle}
                    </span>
                    <span className="notif__meta">Staff can scan guests&rsquo; QR codes at this event.</span>
                    <div className="notif__actions">
                      <button
                        type="button"
                        className="btn-primary notif__btn"
                        aria-label={`Accept staff invite for ${n.eventTitle}`}
                        onClick={() => respondInvite(n.eventId, true)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn-ghost notif__btn"
                        aria-label={`Decline staff invite for ${n.eventTitle}`}
                        onClick={() => respondInvite(n.eventId, false)}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
                {notifications.map((n) =>
                  n.eventId && n.available ? (
                    <button
                      type="button"
                      className="notif__item notif__item--link"
                      key={n.id}
                      onClick={() => {
                        setNotifOpen(false);
                        onOpenEvent?.(n.eventId!);
                      }}
                    >
                      <span className="notif__text">
                        <span className="notif__title">{n.title}</span>
                        <span className="notif__meta">{n.meta}</span>
                      </span>
                      <ChevronRight size={18} strokeWidth={2.2} className="notif__chev" aria-hidden="true" />
                      <span className="sr-only">Open event</span>
                    </button>
                  ) : (
                    <div className="notif__item" key={n.id}>
                      <span className="notif__title">{n.title}</span>
                      <span className="notif__meta">
                        {n.eventId ? "This event is no longer available" : n.meta}
                      </span>
                    </div>
                  )
                )}
                {notifications.length === 0 && staffInvites.length === 0 && (
                  <p className="notif__empty">You&rsquo;re all caught up.</p>
                )}
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
              className={`navlink ${highlighted === key ? "navlink--active" : ""} ${
                key === "staff" && staffJustAdded ? "navlink--new" : ""
              }`}
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
