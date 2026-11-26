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
import { LikedEventsScreen } from "./screens/LikedEventsScreen";
import { HostDashboardScreen } from "./screens/HostDashboardScreen";
import { StaffScreen } from "./screens/StaffScreen";
import { StaffScannerScreen } from "./screens/StaffScannerScreen";
import { ManageStaffDialog } from "./components/ManageStaffDialog";
import { useEvents } from "./useEvents";
import { CATEGORIES } from "./data/events";
import { remindersFor } from "./data/notifications";
import { useAuth, type Role } from "./useAuth";
import { useToast } from "./components/Toast";
import { ToastProvider } from "./components/Toast";
import { AuthGateProvider } from "./components/AuthGate";
import type { EventItem, ProfileTab, ScreenName } from "./types";

type EventOrigin =
  "home" | "profile" | "organized-events" | "liked-events" | "host-dashboard";
const HOST_ONLY = new Set<ScreenName>([
  "host-dashboard",
  "organized-events",
  "qr-scanner",
  "attendance",
  "create-event",
]);
const ATTENDEE_ONLY = new Set<ScreenName>([
  "home",
  "calendar",
  "map",
  "liked-events",
  "discovery",
]);
export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}
function AppShell() {
  const {
    session,
    login,
    logout,
    restoring,
    sessionError,
    setRole,
    setDiscoveryProfile,
    setDemoKycStatus,
  } = useAuth();
  const events = useEvents(session?.id);
  const activeRole: Role = session?.role === "host" ? "host" : "attendee";
  const demoKycStatus = getDemoKycStatus(session?.demoKyc, activeRole);
  const notify = useToast();
  const isHost = session?.role === "host";
  const [screen, setScreen] = useState<ScreenName>("home");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [staffDialogId, setStaffDialogId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<EventOrigin>("home");
  const [profileTab, setProfileTab] = useState<ProfileTab>("organizer");
  const [dark, setDark] = useState(() => {
    try {
      return sessionStorage.getItem("salika.theme") === "dark";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    try {
      sessionStorage.setItem("salika.theme", dark ? "dark" : "light");
    } catch {
      /* optional preference */
    }
  }, [dark]);
  useEffect(() => {
    if (!session && !restoring) {
      setActiveId(null);
      setStaffDialogId(null);
      setScreen("home");
    }
  }, [session, restoring]);
  const navigate = useCallback((next: ScreenName) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);
  const all = Array.from(
    new Map(
      [
        ...events.invites.map((i) => i.event),
        ...events.liked,
        ...events.joined,
        ...events.events,
      ].map((e) => [e.id, e]),
    ).values(),
  );
  const find = (id: string | null) => all.find((e) => e.id === id);
  const active = find(activeId);
  const staffDialog = find(staffDialogId);
  const likedIds = events.liked.map((e) => e.id);
  const isAttending = (event: EventItem) =>
    events.joined.some((e) => e.id === event.id);
  const openEvent = (event: EventItem, from: EventOrigin = "home") => {
    setActiveId(event.id);
    setOrigin(from);
    navigate("event-detail");
  };
  const perform = async (action: () => Promise<unknown>, success?: string) => {
    try {
      await action();
      if (success) notify(success);
      return true;
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "The request could not be completed.",
      );
      return false;
    }
  };
  const join = (id: string) => {
    void perform(
      () => events.join(id),
      "You're going! Your registration has been saved.",
    );
  };
  const like = (id: string) => {
    events.toggleLike(id);
    notify("Saved-event preferences updated on this browser.");
  };
  const respond = (id: string, accept: boolean) =>
    perform(
      () => events.respond(id, accept),
      accept ? "Staff invitation accepted" : "Invitation declined",
    );
  const switchRole = async (role: Role) => {
    if (
      await perform(async () => {
        setRole(role);
      })
    )
      navigate(role === "host" ? "host-dashboard" : "home");
  };
  const invites = events.invites;
  const pendingInvites = invites
    .filter((i) => i.status === "pending" && !i.event.ended)
    .map((i) => ({
      eventId: i.event.id,
      eventTitle: i.event.title,
      invitedBy: i.event.hostName ?? "Organizer",
    }));
  const canScan =
    active &&
    invites.some(
      (i) =>
        i.event.id === active.id && i.status === "accepted" && !i.event.ended,
    );
  const notifications = remindersFor(events.joined.filter((e) => !e.ended)).map(
    (n) => ({ ...n, available: true }),
  );
  const roleView =
    isHost && ATTENDEE_ONLY.has(screen)
      ? "host-dashboard"
      : !isHost && HOST_ONLY.has(screen)
        ? "home"
        : screen;
  const view =
    !session &&
    [
      "profile",
      "settings",
      "verification",
      "staff",
      "staff-scanner",
      "discovery",
    ].includes(roleView)
      ? "home"
      : roleView;

  const eventViews = [
    "home",
    "host-dashboard",
    "profile",
    "event-detail",
    "calendar",
    "map",
    "organized-events",
    "liked-events",
    "host-profile",
    "staff",
    "staff-scanner",
    "qr-scanner",
    "attendance",
  ];
  return (
    <AuthGateProvider
      signedIn={Boolean(session)}
      restoring={restoring}
      onLogin={login}
    >
      <div className="app">
        <TopNav
          key={session?.id ?? "visitor"}
          active={view}
          onNavigate={(next) => {
            if (next === "create-event") setEditingId(null);
            navigate(next);
          }}
          userName={session?.name}
          isHost={isHost}
          hasStaffAccess={Boolean(session)}
          staffInvites={pendingInvites}
          onRespondInvite={respond}
          notifications={notifications}
          onOpenEvent={(id) => {
            const e = find(id);
            if (e) openEvent(e);
          }}
        />
        <main>
          {restoring && (
            <p className="page" role="status">
              Checking your session...
            </p>
          )}
          {sessionError && (
            <p className="page auth-error" role="alert">
              {sessionError}
            </p>
          )}
          {eventViews.includes(view) && (events.loading || events.error) && (
            <div className="page event-load-status">
              {events.loading && <p role="status">Loading events...</p>}
              {events.error && (
                <p className="auth-error" role="alert">
                  {events.error}{" "}
                  <button
                    className="btn-secondary"
                    onClick={() => void events.refresh()}
                  >
                    Retry
                  </button>
                </p>
              )}
            </div>
          )}
          {session && (view === "home" || view === "host-dashboard") && (
            <aside className="kyc-banner" aria-label="Identity verification">
              <ShieldCheck size={24} aria-hidden="true" />
              <div>
                <strong>Identity verification</strong>
                <p>
                  {demoKycStatus === "not_started"
                    ? "Complete the identity steps for your " +
                      (isHost ? "Host" : "Joiner") +
                      " account."
                    : DEMO_KYC_LABELS[demoKycStatus]}
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("verification")}
              >
                {demoKycStatus === "not_started"
                  ? "Get started"
                  : "View progress"}
              </button>
            </aside>
          )}
          {view === "verification" && session && (
            <VerificationScreen
              key={session.email + ":" + activeRole}
              role={activeRole}
              status={demoKycStatus}
              onStatusChange={(status) => setDemoKycStatus(activeRole, status)}
              onBack={() => navigate("settings")}
            />
          )}
          {view === "home" && (
            <HomeScreen
              events={events.events}
              onOpenEvent={openEvent}
              likedIds={likedIds}
              onToggleLiked={like}
              isAttending={isAttending}
              onJoin={join}
              discoveryProfile={session?.discoveryProfile}
            />
          )}
          {view === "discovery" && session && (
            <div className="page page--narrow">
              <div className="card onboarding-settings-card">
                <JoinerOnboarding
                  key={session.id}
                  titleId="discovery-settings-title"
                  editing
                  initialProfile={normalizeDiscoveryProfile(
                    session.discoveryProfile,
                    CATEGORIES,
                  )}
                  onComplete={async (profile) => {
                    await setDiscoveryProfile(profile);
                    navigate("home");
                    notify("Preferences updated");
                  }}
                  onSkip={() => navigate("settings")}
                />
              </div>
            </div>
          )}
          {view === "liked-events" && session && (
            <LikedEventsScreen
              likedEvents={events.liked}
              onOpenEvent={(e) => openEvent(e, "liked-events")}
              onToggleLiked={like}
            />
          )}
          {view === "host-dashboard" && session && (
            <HostDashboardScreen
              firstName={session.name.split(" ")[0]}
              events={events.events}
              onOpenEvent={(e) => openEvent(e, "host-dashboard")}
              onOpenTool={(e, tool) => {
                setActiveId(e.id);
                setOrigin("host-dashboard");
                navigate(tool);
              }}
              onManageStaff={(e) => setStaffDialogId(e.id)}
            />
          )}
          {view === "organized-events" && (
            <OrganizedEventsScreen
              events={events.events.filter((e) => e.hosting)}
              onBack={() => navigate("host-dashboard")}
              onOpenEvent={(e) => openEvent(e, "organized-events")}
            />
          )}
          {view === "profile" && session && (
            <ProfileScreen
              onNavigate={navigate}
              onOpenEvent={(e) => openEvent(e, "profile")}
              tab={profileTab}
              onTabChange={setProfileTab}
              isHost={Boolean(isHost)}
              userName={session.name}
              userEmail={session.email}
              events={events.events}
              goingEvents={events.joined}
            />
          )}
          {view === "staff" && session && (
            <StaffScreen
              userId={session.id}
              onCheckAccess={(id) =>
                perform(() => events.checkStaff(id), "Staff access confirmed")
              }
              invites={invites}
              busy={events.busy}
              onRespond={respond}
              onOpenScanner={(e) => {
                setActiveId(e.id);
                navigate("staff-scanner");
              }}
            />
          )}
          {view === "staff-scanner" &&
            session &&
            (active && canScan ? (
              <StaffScannerScreen
                key={`${session.id}:${active.id}`}
                event={active}
                onBack={() => navigate("staff")}
              />
            ) : (
              <p className="page">
                You need an accepted staff invitation for this event.
              </p>
            ))}
          {view === "calendar" && (
            <CalendarScreen events={events.events} onOpenEvent={openEvent} />
          )}
          {view === "map" && (
            <MapScreen events={events.events} onOpenEvent={openEvent} />
          )}
          {view === "create-event" && session && (
            <CreateEventScreen
              key={editingId ?? "new"}
              onNavigate={navigate}
              initial={find(editingId)}
              onSave={
                editingId
                  ? (data) => events.update(editingId, data)
                  : events.create
              }
            />
          )}
          {view === "event-detail" &&
            (active ? (
              <EventDetailScreen
                userId={session?.id ?? 0}
                onEdit={
                  active.hosting
                    ? () => {
                        setEditingId(active.id);
                        navigate("create-event");
                      }
                    : undefined
                }
                key={`${session?.id}:${active.id}`}
                event={active}
                busy={events.busy}
                liked={likedIds.includes(active.id)}
                onToggleLiked={() => like(active.id)}
                attending={isAttending(active)}
                onJoin={() => join(active.id)}
                onLeave={() => {
                  void perform(
                    () => events.leave(active.id),
                    "You left this event.",
                  );
                }}
                onBack={() => navigate(origin)}
                backLabel="Back to events"
                onOpenHost={() => navigate("host-profile")}
                onNavigate={navigate}
                onManageStaff={
                  active.hosting ? () => setStaffDialogId(active.id) : undefined
                }
                onCancel={
                  active.hosting
                    ? () => {
                        if (
                          window.confirm(
                            `Cancel ${active.title}? Registrations and check-in will close.`,
                          )
                        )
                          void perform(
                            () => events.cancel(active.id),
                            "Event cancelled",
                          ).then((ok) => {
                            if (ok) navigate("host-dashboard");
                          });
                      }
                    : undefined
                }
              />
            ) : (
              !events.loading && (
                <p className="page">This event is unavailable.</p>
              )
            ))}
          {view === "host-profile" && active && (
            <HostProfileScreen
              host={active}
              events={events.events}
              onBack={() => navigate("event-detail")}
              onOpenEvent={openEvent}
            />
          )}
          {view === "qr-scanner" &&
            (active?.hosting ? (
              <QrScannerScreen
                key={`${session?.id}:${active.id}`}
                event={active}
                onNavigate={navigate}
              />
            ) : (
              <div className="page">
                <p>Choose an event to check people in.</p>
                <button
                  className="btn-primary"
                  onClick={() => navigate("host-dashboard")}
                >
                  Choose event
                </button>
              </div>
            ))}
          {view === "attendance" && active?.hosting && (
            <AttendanceScreen
              key={`${session?.id}:${active.id}`}
              event={active}
              onNavigate={navigate}
            />
          )}
          {view === "settings" && session && (
            <SettingsScreen
              onNavigate={navigate}
              onLogout={() => {
                logout();
                setActiveId(null);
                setStaffDialogId(null);
                navigate("home");
              }}
              session={session}
              dark={dark}
              onToggleDark={() => setDark((v) => !v)}
              onSwitchRole={switchRole}
            />
          )}
          {view === "terms" && <TermsScreen onNavigate={navigate} />}
          {view === "privacy" && <PrivacyScreen onNavigate={navigate} />}
          {view === "bylaws" && <BylawsScreen onNavigate={navigate} />}
        </main>
        {staffDialog && session && staffDialog.hosting && (
          <ManageStaffDialog
            key={`${session.id}:${staffDialog.id}`}
            event={staffDialog}
            onClose={() => setStaffDialogId(null)}
            onChanged={() => {
              void events.refresh();
            }}
          />
        )}
        <footer className="app-footer">
          <span>Sali Ka by BitBit · 2026</span>
        </footer>
      </div>
    </AuthGateProvider>
  );
}
