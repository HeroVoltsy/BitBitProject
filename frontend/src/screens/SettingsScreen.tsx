import { useState } from "react";
import { ArrowLeft, ChevronRight, LogOut, CalendarPlus, Ticket } from "lucide-react";
import { initialsOf, type Role, type Session } from "../useAuth";
import { useToast } from "../components/Toast";
import type { ScreenName } from "../types";
import { DEMO_KYC_LABELS, getDemoKycStatus } from "../kyc";

type ToggleKey = "push" | "email";

export function SettingsScreen({
  onNavigate,
  onLogout,
  session,
  dark,
  onToggleDark,
  onSwitchRole,
}: {
  onNavigate: (s: ScreenName) => void;
  onLogout: () => void;
  session: Session;
  dark: boolean;
  onToggleDark: () => void;
  onSwitchRole: (role: Role) => void;
}) {
  const isHost = session.role === "host";
  const displayEmail = session.email;
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
        <span className="settings-summary__badge">PRO</span>
      </div>

      {/* Switch between the attendee and host (organizer) UI. */}
      <SettingsGroup title={isHost ? "Joining" : "Hosting"}>
        <div className="role-switch">
          <span className="role-switch__icon" aria-hidden="true">
            {isHost ? <Ticket size={22} strokeWidth={2.2} /> : <CalendarPlus size={22} strokeWidth={2.2} />}
          </span>
          <span className="role-switch__text">
            <strong>{isHost ? "Want to join other events?" : "Do you want to host an event?"}</strong>
            <span className="muted">
              {isHost
                ? "Switch to the attendee view to browse, like, and join events near you."
                : "Switch to the host view to post events, check people in, and see your ratings."}
            </span>
          </span>
          <button
            type="button"
            className="btn-primary role-switch__btn"
            onClick={() => onSwitchRole(isHost ? "attendee" : "host")}
          >
            {isHost ? "Sali na!" : "Sali ka as a host!"}
          </button>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Account">
        {!isHost && <Row label="Interests & recommendations" chevron onClick={() => onNavigate("discovery")} />}
        <Row
          label="Identity verification"
          hint={DEMO_KYC_LABELS[getDemoKycStatus(session.demoKyc, isHost ? "host" : "attendee")]}
          chevron
          onClick={() => onNavigate("verification")}
        />
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
        <Row
          label="Terms & Conditions"
          hint="Rules for using Sali Ka"
          chevron
          onClick={() => onNavigate("terms")}
        />
        <Row
          label="Privacy Policy"
          hint="How we handle your data"
          chevron
          onClick={() => onNavigate("privacy")}
        />
        <Row
          label="Community By-laws"
          hint="How members and Hosts are expected to behave"
          chevron
          onClick={() => onNavigate("bylaws")}
        />
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
