import { useCallback, useEffect, useState } from "react";
import { TopNav } from "./components/TopNav";
import { ShieldCheck } from "lucide-react";
import { VerificationScreen } from "./screens/VerificationScreen";
import { DEMO_KYC_LABELS, getDemoKycStatus } from "./kyc";
import { HomeScreen } from "./screens/HomeScreen";
import { JoinerOnboarding } from "./components/JoinerOnboarding";
import { normalizeDiscoveryProfile } from "./discovery";
import { CalendarScreen } from "./screens/CalendarScreen";
import { MapScreen } from "./screens/MapScreen";
import { CreateEventScreen } from "./screens/CreateEventScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { EventDetailScreen } from "./screens/EventDetailScreen";
import { HostProfileScreen } from "./screens/HostProfileScreen";
import { QrScannerScreen } from "./screens/QrScannerScreen";
import { AttendanceScreen } from "./screens/AttendanceScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { TermsScreen } from "./screens/TermsScreen";
import { PrivacyScreen } from "./screens/PrivacyScreen";
import { BylawsScreen } from "./screens/BylawsScreen";
import { OrganizedEventsScreen } from "./screens/OrganizedEventsScreen";
import { FollowersScreen } from "./screens/FollowersScreen";
import { LikedEventsScreen } from "./screens/LikedEventsScreen";
import { HostDashboardScreen } from "./screens/HostDashboardScreen";
import { StaffScreen } from "./screens/StaffScreen";
import { StaffScannerScreen } from "./screens/StaffScannerScreen";
import { ManageStaffDialog } from "./components/ManageStaffDialog";
import { useStaff } from "./useStaff";
import { useRatings } from "./useRatings";
import { CATEGORIES, FEED_EVENTS, findEvent } from "./data/events";
import { SAMPLE_NOTIFICATIONS, remindersFor } from "./data/notifications";
import { useAuth, type Role } from "./useAuth";
import { useToast } from "./components/Toast";
import { ToastProvider } from "./components/Toast";
import { AuthGateProvider } from "./components/AuthGate";
import type { EventItem, ProfileTab, ScreenName } from "./types";

const LIKED_KEY = "salika.liked";
const JOINED_KEY = "salika.joined";
// Events the user left (also overrides the sample data's "attending" flags).
const LEFT_KEY = "salika.left";

/** Read a string-id list from sessionStorage, ignoring anything malformed. */
function loadIds(key: string): string[] {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(key) ?? "[]");
    return Array.isArray(stored) ? stored.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveIds(key: string, ids: string[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* storage unavailable — ids stay in memory only */
  }
}

// Screens that can open an event detail, and the label of the detail's Back button.
type EventOrigin = "home" | "profile" | "organized-events" | "liked-events" | "host-dashboard";
const BACK_LABELS: Record<EventOrigin, string> = {
  home: "Back to events",
  profile: "Back to profile",
  "organized-events": "Back to your events",
  "liked-events": "Back to liked events",
  "host-dashboard": "Back to dashboard",
};

// Two UIs: attendees browse/join events; hosts get an admin-style dashboard.
// A screen from the other UI falls back to that role's home.
const ATTENDEE_ONLY = new Set<ScreenName>(["home", "calendar", "map", "liked-events", "discovery"]);
const HOST_ONLY = new Set<ScreenName>([
  "host-dashboard",
  "organized-events",
  "qr-scanner",
  "attendance",
  "create-event",
  "followers",
]);

export default function App() {
  // ToastProvider wraps everything inside AppShell, so the shell can show toasts.
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}

function AppShell() {
  const { session, login, logout, setRole, setDemoKycStatus, setDiscoveryProfile } = useAuth();
  const activeRole: Role = session?.role === "host" ? "host" : "attendee";
  const demoKycStatus = getDemoKycStatus(session?.demoKyc, activeRole);
  const notify = useToast();
  const isHost = session?.role === "host";
  const { eventStaff, invites, inviteStaff, removeStaff, respondToInvite, resetStaff } = useStaff();
  const { ratings, rateEvent, resetRatings } = useRatings();
  // Host's "Manage Staff" pop-up (which event it's for), and the event staff are scanning.
  const [staffDialogEvent, setStaffDialogEvent] = useState<EventItem | null>(null);
  const [staffEvent, setStaffEvent] = useState<EventItem | null>(null);
  const [screen, setScreen] = useState<ScreenName>("home");
  const [activeEvent, setActiveEvent] = useState<EventItem>(FEED_EVENTS[0]);
  // Where the event detail's Back button returns to (the screen that opened it).
  const [eventOrigin, setEventOrigin] = useState<EventOrigin>("home");
  // Kept here so returning to Profile restores the Organizer/Attendee tab.
  const [profileTab, setProfileTab] = useState<ProfileTab>("organizer");
  // Ids of events the user liked (heart on the event page), newest first. Kept for the tab.
  const [likedIds, setLikedIds] = useState<string[]>(() => loadIds(LIKED_KEY));
  // Ids of events the user joined (Join button or "sasali" on a card). Kept for the tab.
  const [joinedIds, setJoinedIds] = useState<string[]>(() => loadIds(JOINED_KEY));
  const [leftIds, setLeftIds] = useState<string[]>(() => loadIds(LEFT_KEY));
  const [dark, setDark] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("salika.theme") === "dark";
    } catch {
      return false;
    }
  });

  // Apply the theme to the document root and remember it for the tab.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try {
      sessionStorage.setItem("salika.theme", dark ? "dark" : "light");
    } catch {
      /* storage unavailable — theme stays in memory only */
    }
  }, [dark]);

  useEffect(() => saveIds(LIKED_KEY, likedIds), [likedIds]);
  useEffect(() => saveIds(JOINED_KEY, joinedIds), [joinedIds]);
  useEffect(() => saveIds(LEFT_KEY, leftIds), [leftIds]);

  const toggleLiked = useCallback((id: string) => {
    setLikedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]));
  }, []);

  const joinEvent = useCallback((id: string) => {
    setJoinedIds((ids) => (ids.includes(id) ? ids : [id, ...ids]));
    setLeftIds((ids) => ids.filter((x) => x !== id));
  }, []);

  // Leave ("unjoin") an event, after the two-step confirmation.
  // TODO(backend): call the leave-event API here, e.g. POST /events/:id/leave
  // with { reason }. The server must remove the RSVP, invalidate the QR code,
  // and notify the host (bell + email), including the optional reason.
  const leaveEvent = useCallback(
    (event: EventItem, _reason?: string) => {
      setJoinedIds((ids) => ids.filter((x) => x !== event.id));
      setLeftIds((ids) => (ids.includes(event.id) ? ids : [event.id, ...ids]));
      notify(`You left ${event.title}. The host has been notified.`);
    },
    [notify]
  );

  // Signed-out visitors aren't attending anything (sample "attending" flags are the demo user's).
  const isAttending = (e: EventItem) =>
    Boolean(session) &&
    !leftIds.includes(e.id) &&
    (Boolean(e.attending) || joinedIds.includes(e.id));

  const likedEvents = likedIds.map(findEvent).filter((e): e is EventItem => e !== undefined);

  const navigate = useCallback((next: ScreenName) => {
    setScreen(next);
    // Return to the top of the page on every navigation.
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const openEvent = useCallback(
    (event: EventItem, origin: EventOrigin = "home") => {
      setActiveEvent(event);
      setEventOrigin(origin);
      navigate("event-detail");
    },
    [navigate]
  );

  // Schedule and Explore only know an event's (sometimes shortened) title.
  const openEventByTitle = useCallback(
    (title?: string) =>
      openEvent((title && FEED_EVENTS.find((e) => e.title.includes(title))) || FEED_EVENTS[0]),
    [openEvent]
  );

  // Settings → "Sali ka as a host!" / "Sali na!"
  const switchRole = useCallback(
    (role: Role) => {
      setRole(role);
      navigate(role === "host" ? "host-dashboard" : "home");
      notify(role === "host" ? "You're now hosting. Welcome to your dashboard!" : "Sali na! Find events to join.");
    },
    [setRole, navigate, notify]
  );

  // Host tools open for a specific event, so their Back goes event → dashboard.
  const openTool = useCallback(
    (event: EventItem, tool: "qr-scanner" | "attendance") => {
      setActiveEvent(event);
      setEventOrigin("host-dashboard");
      navigate(tool);
    },
    [navigate]
  );

  const roleView: ScreenName =
    isHost && ATTENDEE_ONLY.has(screen)
      ? "host-dashboard"
      : !isHost && HOST_ONLY.has(screen)
        ? "home"
        : screen;

  // Check-in Staff (per-event, scanner-only access) — works in both UIs.
  const pendingInvites = invites
    .filter((i) => i.status === "pending" && !findEvent(i.eventId)?.ended)
    .map((i) => ({
      eventId: i.eventId,
      invitedBy: i.invitedBy,
      eventTitle: findEvent(i.eventId)?.title ?? "an event",
    }));
  // Bell notifications: a reminder for every event the user is going to, then
  // other activity. Events that no longer exist are flagged, not opened.
  const notifications = session
    ? [
        ...remindersFor(FEED_EVENTS.filter((e) => !e.hosting && isAttending(e))),
        ...SAMPLE_NOTIFICATIONS,
      ].map((n) => ({ ...n, available: !n.eventId || findEvent(n.eventId) !== undefined }))
    : [];
  const openNotificationEvent = (eventId: string) => {
    const event = findEvent(eventId);
    if (event) openEvent(event, isHost ? "host-dashboard" : "home");
  };

  // Staff access ends with the event. `ended` comes from the sample data; the
  // backend owns the real end time + grace period and must reject late scans.
  const eventEnded = (eventId: string) => findEvent(eventId)?.ended === true;
  // The Staff page only exists while the user has an accepted invite for an
  // event that hasn't ended. Pending invites are answered from the bell menu.
  const hasStaffAccess =
    Boolean(session) &&
    invites.some((i) => i.status === "accepted" && !eventEnded(i.eventId));
  const canScan = (e: EventItem | null): e is EventItem =>
    e !== null &&
    !e.ended &&
    invites.some((i) => i.eventId === e.id && i.status === "accepted");

  const respond = useCallback(
    (eventId: string, accept: boolean) => {
      // An invite to an event that already ended can't be accepted.
      if (accept && findEvent(eventId)?.ended) {
        notify("This invitation expired because the event has ended.");
        return;
      }
      respondToInvite(eventId, accept);
      notify(accept ? "You're now check-in staff for this event." : "Invitation declined.");
    },
    [respondToInvite, notify]
  );

  // Staff and verification pages need an account; Staff pages also need an
  // accepted invite, and the scanner needs one for that specific event.
  const view: ScreenName =
    !session && (roleView === "staff" || roleView === "staff-scanner" || roleView === "verification" || roleView === "discovery")
      ? "home"
      : (roleView === "staff" || roleView === "staff-scanner") && !hasStaffAccess
        ? isHost
          ? "host-dashboard"
          : "home"
      : roleView === "staff-scanner" && !canScan(staffEvent)
        ? "staff"
        : roleView;

  const handleLogout = useCallback(() => {
    logout();
    resetStaff();
    setStaffEvent(null);
    // Likes belong to the signed-in user; don't hand them to the next person on this tab.
    setLikedIds([]);
    setJoinedIds([]);
    setLeftIds([]);
    resetRatings();
    setScreen("home");
  }, [logout, resetStaff, resetRatings]);

  // No auth gate: anyone can browse. Features that need an account open the
  // sign-in pop-up via useAuthGate().requireAuth (see components/AuthGate.tsx).
  return (
    <AuthGateProvider signedIn={Boolean(session)} onLogin={login}>
    <div className="app">
      <TopNav
        active={view}
        onNavigate={navigate}
        userName={session?.name}
        isHost={isHost}
        hasStaffAccess={hasStaffAccess}
        staffInvites={session ? pendingInvites : []}
        onRespondInvite={respond}
        notifications={notifications}
        onOpenEvent={openNotificationEvent}
      />
      <main>
        {session && (view === "home" || view === "host-dashboard") && (
          <aside className="kyc-banner" aria-label="Identity verification">
            <ShieldCheck size={24} aria-hidden="true" />
            <div><strong>Identity verification</strong><p>{demoKycStatus === "not_started" ? "Complete the identity steps for your " + (isHost ? "Host" : "Joiner") + " account." : DEMO_KYC_LABELS[demoKycStatus]}</p></div>
            <button type="button" className="btn-secondary" onClick={() => navigate("verification")}>{demoKycStatus === "not_started" ? "Get started" : "View progress"}</button>
          </aside>
        )}
        {view === "verification" && session && (
          <VerificationScreen key={session.email + ":" + activeRole} role={activeRole} status={demoKycStatus}
            onStatusChange={(status) => setDemoKycStatus(activeRole, status)} onBack={() => navigate("settings")} />
        )}
        {view === "home" && (
          <HomeScreen
            onOpenEvent={openEvent}
            likedIds={likedIds}
            onToggleLiked={toggleLiked}
            isAttending={isAttending}
            onJoin={joinEvent}
            discoveryProfile={session?.discoveryProfile}
          />
        )}
        {view === "discovery" && session && !isHost && (
          <div className="page page--narrow"><div className="card onboarding-settings-card">
            <JoinerOnboarding key={session.email} titleId="discovery-settings-title" editing
              initialProfile={normalizeDiscoveryProfile(session.discoveryProfile, CATEGORIES)}
              onComplete={(profile) => { setDiscoveryProfile(profile); navigate("home"); notify("Your preferences have been updated"); }}
              onSkip={() => navigate("settings")} />
          </div></div>
        )}
        {view === "liked-events" && session && (
          <LikedEventsScreen
            likedEvents={likedEvents}
            onOpenEvent={(e) => openEvent(e, "liked-events")}
            onToggleLiked={toggleLiked}
          />
        )}
        {view === "host-dashboard" && session && (
          <HostDashboardScreen
            firstName={session.name.split(" ")[0]}
            onOpenEvent={(e) => openEvent(e, "host-dashboard")}
            onOpenTool={openTool}
            staffCount={(id) => (eventStaff[id] ?? []).length}
            onManageStaff={setStaffDialogEvent}
          />
        )}
        {view === "staff" && session && (
          <StaffScreen
            invites={invites}
            onRespond={respond}
            onOpenScanner={(e) => {
              setStaffEvent(e);
              navigate("staff-scanner");
            }}
          />
        )}
        {view === "staff-scanner" && session && canScan(staffEvent) && (
          <StaffScannerScreen event={staffEvent} onBack={() => navigate("staff")} />
        )}
        {view === "calendar" && <CalendarScreen onOpenEvent={openEventByTitle} />}
        {view === "map" && (
          <MapScreen onOpenEvent={openEventByTitle} onNavigate={navigate} />
        )}
        {view === "create-event" && <CreateEventScreen onNavigate={navigate} />}
        {view === "profile" && session && (
          <ProfileScreen
            onNavigate={navigate}
            onOpenEvent={(e) => openEvent(e, "profile")}
            tab={profileTab}
            onTabChange={setProfileTab}
            isHost={isHost}
            userName={session?.name ?? ""}
            userEmail={session?.email ?? ""}
            goingEvents={FEED_EVENTS.filter((e) => !e.hosting && isAttending(e))}
            ratings={ratings}
            onRate={(event, r) => {
              // TODO(backend): POST /events/:id/ratings { stars, comment, anonymous }.
              // The server notifies the host (bell + email) and must hide the
              // rater's name when anonymous is true.
              const edited = Boolean(ratings[event.id]);
              rateEvent(event.id, r);
              notify(
                `${edited ? "Rating updated" : "Thanks for rating"}! ${event.hostName} has been notified${
                  r.anonymous ? " (your name is hidden)" : ""
                }.`
              );
            }}
          />
        )}
        {view === "event-detail" && (
          <EventDetailScreen
            event={activeEvent}
            liked={likedIds.includes(activeEvent.id)}
            onToggleLiked={() => toggleLiked(activeEvent.id)}
            attending={isAttending(activeEvent)}
            onJoin={() => joinEvent(activeEvent.id)}
            onLeave={(reason) => leaveEvent(activeEvent, reason)}
            onBack={() => navigate(eventOrigin)}
            backLabel={BACK_LABELS[eventOrigin]}
            onOpenHost={() => navigate("host-profile")}
            onNavigate={navigate}
            onManageStaff={
              isHost && activeEvent.hosting ? () => setStaffDialogEvent(activeEvent) : undefined
            }
          />
        )}
        {view === "host-profile" && (
          <HostProfileScreen onBack={() => navigate("event-detail")} onOpenEvent={openEvent} />
        )}
        {view === "qr-scanner" && <QrScannerScreen onNavigate={navigate} />}
        {view === "attendance" && <AttendanceScreen onNavigate={navigate} />}
        {view === "settings" && session && (
          <SettingsScreen
            onNavigate={navigate}
            onLogout={handleLogout}
            session={session}
            dark={dark}
            onToggleDark={() => setDark((v) => !v)}
            onSwitchRole={switchRole}
          />
        )}
        {view === "terms" && <TermsScreen onNavigate={navigate} />}
        {view === "privacy" && <PrivacyScreen onNavigate={navigate} />}
        {view === "bylaws" && <BylawsScreen onNavigate={navigate} />}
        {view === "organized-events" && (
          <OrganizedEventsScreen
            onBack={() => navigate("host-dashboard")}
            onOpenEvent={(e) => openEvent(e, "organized-events")}
          />
        )}
        {view === "followers" && <FollowersScreen onBack={() => navigate("profile")} />}
      </main>

      {staffDialogEvent && (
        <ManageStaffDialog
          event={staffDialogEvent}
          staff={eventStaff[staffDialogEvent.id] ?? []}
          ownEmail={session?.email}
          onInvite={(email) => inviteStaff(staffDialogEvent.id, email)}
          onRemove={(email) => removeStaff(staffDialogEvent.id, email)}
          onClose={() => setStaffDialogEvent(null)}
        />
      )}

      <footer className="app-footer">
        <span>Sali Ka by BitBit • 2026</span>
        <span className="muted">Front-end demo · sample data only</span>
      </footer>
    </div>
    </AuthGateProvider>
  );
}
