import { useCallback, useEffect, useState } from "react";
import { TopNav } from "./components/TopNav";
import { AuthScreen } from "./screens/AuthScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { HostedEventsScreen } from "./screens/HostedEventsScreen";
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
import { FEED_EVENTS, findEvent } from "./data/events";
import { useAuth } from "./useAuth";
import { ToastProvider } from "./components/Toast";
import type { EventItem, ProfileTab, ScreenName } from "./types";

const LIKED_KEY = "salika.liked";

// Screens that can open an event detail, and the label of the detail's Back button.
type EventOrigin = "home" | "profile" | "organized-events";
const BACK_LABELS: Record<EventOrigin, string> = {
  home: "Back to events",
  profile: "Back to profile",
  "organized-events": "Back to your events",
};

export default function App() {
  const { session, login, logout } = useAuth();
  const [screen, setScreen] = useState<ScreenName>("home");
  const [activeEvent, setActiveEvent] = useState<EventItem>(FEED_EVENTS[0]);
  // Where the event detail's Back button returns to (the screen that opened it).
  const [eventOrigin, setEventOrigin] = useState<EventOrigin>("home");
  // Kept here so returning to Profile restores the Organizer/Attendee tab.
  const [profileTab, setProfileTab] = useState<ProfileTab>("organizer");
  // Ids of events the user liked (heart on the event page), newest first. Kept for the tab.
  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try {
      const stored: unknown = JSON.parse(sessionStorage.getItem(LIKED_KEY) ?? "[]");
      return Array.isArray(stored) ? stored.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  });
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

  useEffect(() => {
    try {
      sessionStorage.setItem(LIKED_KEY, JSON.stringify(likedIds));
    } catch {
      /* storage unavailable — likes stay in memory only */
    }
  }, [likedIds]);

  const toggleLiked = useCallback((id: string) => {
    setLikedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]));
  }, []);

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

  const handleLogout = useCallback(() => {
    logout();
    // Likes belong to the signed-in user; don't hand them to the next person on this tab.
    setLikedIds([]);
    setScreen("home");
  }, [logout]);

  // Auth gate — the login / sign-up screen is shown first, before the app.
  if (!session) {
    return <AuthScreen onAuthenticated={login} />;
  }

  return (
    <ToastProvider>
    <div className="app">
      <TopNav active={screen} onNavigate={navigate} userName={session.name} />
      <main>
        {screen === "home" && (
          <HomeScreen onOpenEvent={openEvent} likedIds={likedIds} onToggleLiked={toggleLiked} />
        )}
        {screen === "hosted" && (
          <HostedEventsScreen onOpenEvent={openEvent} onBack={() => navigate("home")} />
        )}
        {screen === "calendar" && <CalendarScreen onOpenEvent={openEventByTitle} />}
        {screen === "map" && (
          <MapScreen onOpenEvent={openEventByTitle} onNavigate={navigate} />
        )}
        {screen === "create-event" && <CreateEventScreen onNavigate={navigate} />}
        {screen === "profile" && (
          <ProfileScreen
            onNavigate={navigate}
            onOpenEvent={(e) => openEvent(e, "profile")}
            tab={profileTab}
            onTabChange={setProfileTab}
            likedEvents={likedEvents}
            onToggleLiked={toggleLiked}
          />
        )}
        {screen === "event-detail" && (
          <EventDetailScreen
            event={activeEvent}
            liked={likedIds.includes(activeEvent.id)}
            onToggleLiked={() => toggleLiked(activeEvent.id)}
            onBack={() => navigate(eventOrigin)}
            backLabel={BACK_LABELS[eventOrigin]}
            onOpenHost={() => navigate("host-profile")}
            onNavigate={navigate}
          />
        )}
        {screen === "host-profile" && (
          <HostProfileScreen onBack={() => navigate("event-detail")} onOpenEvent={openEvent} />
        )}
        {screen === "qr-scanner" && <QrScannerScreen onNavigate={navigate} />}
        {screen === "attendance" && <AttendanceScreen onNavigate={navigate} />}
        {screen === "settings" && (
          <SettingsScreen
            onNavigate={navigate}
            onLogout={handleLogout}
            session={session}
            dark={dark}
            onToggleDark={() => setDark((v) => !v)}
          />
        )}
        {screen === "terms" && <TermsScreen onNavigate={navigate} />}
        {screen === "privacy" && <PrivacyScreen onNavigate={navigate} />}
        {screen === "bylaws" && <BylawsScreen onNavigate={navigate} />}
        {screen === "organized-events" && (
          <OrganizedEventsScreen
            onBack={() => navigate("profile")}
            onOpenEvent={(e) => openEvent(e, "organized-events")}
          />
        )}
        {screen === "followers" && <FollowersScreen onBack={() => navigate("profile")} />}
      </main>

      <footer className="app-footer">
        <span>Sali Ka by BitBit • 2026</span>
        <span className="muted">Front-end demo · sample data only</span>
      </footer>
    </div>
    </ToastProvider>
  );
}
