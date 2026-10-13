import { useState } from "react";
import { ArrowLeft, ChevronRight, LogOut } from "lucide-react";
import { initialsOf, type Session } from "../useAuth";
import { useToast } from "../components/Toast";
import type { ScreenName } from "../types";

type ToggleKey = "push" | "email";

export function SettingsScreen({
  onNavigate,
  onLogout,
  session,
  dark,
  onToggleDark,
}: {
  onNavigate: (s: ScreenName) => void;
  onLogout: () => void;
  session: Session;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const displayEmail = session.email || "guest@salika.app";
  const notify = useToast();
  const demo = () => notify("This is a demo — changes aren't saved");
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    push: true,
    email: false,
  });

  const flip = (k: ToggleKey) => setToggles((t) => ({ ...t, [k]: !t[k] }));

  return (
    <div className="page page--narrow">
      <button className="back-link" onClick={() => onNavigate("profile")}>
        <ArrowLeft size={18} strokeWidth={2.2} /> Back
      </button>
      <h1 className="page-title">Settings</h1>

      <div className="settings-summary card">
        <span className="settings-summary__avatar">{initialsOf(session.name)}</span>
        <span className="settings-summary__text">
          <strong>{session.name}</strong>
          <span className="muted">{displayEmail}</span>
        </span>
        <span className="settings-summary__badge">{session.guest ? "GUEST" : "PRO"}</span>
      </div>

      <SettingsGroup title="Account">
        <Row label="Edit Profile" hint="Personal details, bio, and links" chevron onClick={demo} />
        <Row label="Change Password" hint="Last updated 3 months ago" chevron onClick={demo} />
      </SettingsGroup>

      <SettingsGroup title="Notifications">
        <Row
          label="Push Notifications"
          hint="Alerts for nearby events & chats"
          toggle={toggles.push}
          onToggle={() => flip("push")}
        />
        <Row
          label="Email Notifications"
          hint="Weekly summary and updates"
          toggle={toggles.email}
          onToggle={() => flip("email")}
        />
      </SettingsGroup>

      <SettingsGroup title="Preferences">
        <Row label="Language" value="English" chevron onClick={demo} />
        <Row
          label="Dark Mode"
          hint="Easier on the eyes at night"
          toggle={dark}
          onToggle={onToggleDark}
        />
      </SettingsGroup>

      <SettingsGroup title="Support">
        <Row label="Help Center" chevron onClick={demo} />
        <Row label="Report a Problem" chevron onClick={demo} />
        <Row label="Terms & Privacy" chevron onClick={demo} />
      </SettingsGroup>

      <button className="logout-btn" onClick={onLogout}>
        <LogOut size={18} strokeWidth={2.2} /> Log Out
      </button>
      <p className="version-text muted">Version 2.4.1 (40217)</p>
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="settings-group">
      <h2 className="settings-group__title">{title}</h2>
      <div className="settings-group__rows card">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  value,
  chevron,
  toggle,
  onToggle,
  onClick,
}: {
  label: string;
  hint?: string;
  value?: string;
  chevron?: boolean;
  toggle?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}) {
  const interactive = onToggle === undefined;
  const Tag = interactive ? "button" : "div";
  return (
    <Tag
      className="setting-row"
      {...(interactive ? { type: "button" as const, onClick } : {})}
    >
      <span className="setting-row__label">
        <strong>{label}</strong>
        {hint && <span className="muted">{hint}</span>}
      </span>
      <span className="setting-row__action">
        {value && <span className="muted">{value}</span>}
        {chevron && <ChevronRight size={20} strokeWidth={2} className="muted" />}
        {onToggle && (
          <button
            type="button"
            className={`toggle ${toggle ? "toggle--on" : ""}`}
            role="switch"
            aria-checked={toggle}
            aria-label={label}
            onClick={onToggle}
          >
            <span className="toggle__knob" />
          </button>
        )}
      </span>
    </Tag>
  );
}
