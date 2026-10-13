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
import { FEED_EVENTS } from "./data/events";
import { useAuth } from "./useAuth";
import { ToastProvider } from "./components/Toast";
import type { EventItem, ScreenName } from "./types";

export default function App() {
  const { session, login, logout } = useAuth();
  const [screen, setScreen] = useState<ScreenName>("home");
  const [activeEvent, setActiveEvent] = useState<EventItem>(FEED_EVENTS[0]);
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

  const navigate = useCallback((next: ScreenName) => {
    setScreen(next);
    // Return to the top of the page on every navigation.
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const openEvent = useCallback(
    (event: EventItem) => {
      setActiveEvent(event);
      navigate("event-detail");
    },
    [navigate]
  );

  const handleLogout = useCallback(() => {
    logout();
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
        {screen === "home" && <HomeScreen onOpenEvent={openEvent} />}
        {screen === "hosted" && (
          <HostedEventsScreen onOpenEvent={openEvent} onBack={() => navigate("home")} />
        )}
        {screen === "calendar" && <CalendarScreen onOpenEvent={() => openEvent(FEED_EVENTS[0])} />}
        {screen === "map" && (
          <MapScreen onOpenEvent={() => openEvent(FEED_EVENTS[0])} onNavigate={navigate} />
        )}
        {screen === "create-event" && <CreateEventScreen onNavigate={navigate} />}
        {screen === "profile" && (
          <ProfileScreen onNavigate={navigate} onOpenEvent={openEvent} />
        )}
        {screen === "event-detail" && (
          <EventDetailScreen
            event={activeEvent}
            onBack={() => navigate("home")}
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
      </main>

      <footer className="app-footer">
        <span>Sali Ka by BitBit • 2026</span>
        <span className="muted">Front-end demo · sample data only</span>
      </footer>
    </div>
    </ToastProvider>
  );
}
