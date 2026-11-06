import { useRef, useState, type FormEvent } from "react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import type { Role, Session } from "../useAuth";

/**
 * Log In / Sign Up form. Shown inside the sign-in pop-up (components/AuthGate.tsx)
 * whenever a signed-out visitor tries to use a feature that needs an account.
 */

export type AuthMode = "login" | "signup";

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  businessName?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({
  initialMode = "login",
  reason,
  titleId,
  onAuthenticated,
}: {
  initialMode?: AuthMode;
  /** Why the pop-up opened, e.g. "Log in to join this event." */
  reason?: string;
  /** id for the heading, so the dialog can be labelled by it. */
  titleId: string;
  onAuthenticated: (s: Session, mode: AuthMode) => void;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("attendee");
  const [businessName, setBusinessName] = useState("");
  const [businessContact, setBusinessContact] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLFormElement>(null);

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setErrors({});
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (mode === "signup" && name.trim().length < 2) e.name = "Enter your full name.";
    if (mode === "signup" && role === "host" && businessName.trim().length < 2) {
      e.businessName = "Enter your business name.";
    }
    if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address.";
    if (password.length < 8) e.password = "Use at least 8 characters.";
    if (mode === "signup" && confirm !== password) e.confirm = "Passwords do not match.";
    return e;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      // Move focus to the first field that needs fixing (after React marks it invalid).
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
      );
      return;
    }

    // Demo only: no password is stored or sent anywhere.
    const displayName =
      mode === "signup"
        ? name.trim()
        : email.trim().split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const isHost = mode === "signup" && role === "host";
    onAuthenticated({
      name: displayName,
      email: email.trim(),
      role: isHost ? "host" : "attendee",
      businessName: isHost ? businessName.trim() : undefined,
      businessContact: isHost ? businessContact.trim() : undefined,
    }, mode);
  };

  const sub = reason ?? (mode === "signup" ? "Join your community in a few seconds." : undefined);

  return (
    <div className="auth-card">
      <div className="auth-card__head">
        <div>
          <h2 className="auth-card__title" id={titleId}>
            {mode === "login" ? "sali na!" : "Create your account"}
          </h2>
          {sub && <p className="auth-card__sub">{sub}</p>}
        </div>

        {mode === "signup" && (
          <div className="account-toggle" role="group" aria-label="Account type">
            <button
              className={`account-toggle__btn ${
                role === "attendee" ? "account-toggle__btn--active" : ""
              }`}
              onClick={() => setRole("attendee")}
              aria-pressed={role === "attendee"}
              type="button"
            >
              Joiner
            </button>
            <button
              className={`account-toggle__btn ${
                role === "host" ? "account-toggle__btn--active" : ""
              }`}
              onClick={() => setRole("host")}
              aria-pressed={role === "host"}
              type="button"
            >
              Host
            </button>
          </div>
        )}
      </div>

      <div className="segmented auth-seg" role="group" aria-label="Log in or sign up">
        <button
          className={`segmented__tab ${mode === "login" ? "segmented__tab--active" : ""}`}
          onClick={() => switchMode("login")}
          aria-pressed={mode === "login"}
          type="button"
        >
          Log In
        </button>
        <button
          className={`segmented__tab ${mode === "signup" ? "segmented__tab--active" : ""}`}
          onClick={() => switchMode("signup")}
          aria-pressed={mode === "signup"}
          type="button"
        >
          Sign Up
        </button>
      </div>

      <form className="auth-form" ref={formRef} onSubmit={handleSubmit} noValidate>
        {mode === "signup" && (
          <label className="field">
            <span className="field__label">Full name</span>
            <div className="input input--icon">
              <User size={18} strokeWidth={2} className="muted" aria-hidden="true" />
              <input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kyle Sta. Rosa…"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "auth-err-name" : undefined}
              />
            </div>
            {errors.name && <span className="auth-error" id="auth-err-name">{errors.name}</span>}
          </label>
        )}

        {mode === "signup" && role === "host" && (
          <div className="business-fields">
            <label className="field">
              <span className="field__label">Business name</span>
              <input
                className="input"
                name="organization"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="BitBit Cafe…"
                autoComplete="organization"
                aria-invalid={Boolean(errors.businessName)}
                aria-describedby={errors.businessName ? "auth-err-businessName" : undefined}
              />
              {errors.businessName && <span className="auth-error" id="auth-err-businessName">{errors.businessName}</span>}
            </label>

            <label className="field">
              <span className="field__label">Business contact</span>
              <input
                className="input"
                name="business-contact"
                value={businessContact}
                onChange={(e) => setBusinessContact(e.target.value)}
                placeholder="Phone or Facebook page…"
                autoComplete="off"
              />
            </label>
          </div>
        )}

        <label className="field">
          <span className="field__label">Email</span>
          <div className="input input--icon">
            <Mail size={18} strokeWidth={2} className="muted" aria-hidden="true" />
            <input
              type="email"
              name="email"
              inputMode="email"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "auth-err-email" : undefined}
            />
          </div>
          {errors.email && <span className="auth-error" id="auth-err-email">{errors.email}</span>}
        </label>

        <label className="field">
          <span className="field__label">Password</span>
          <div className="input input--icon">
            <Lock size={18} strokeWidth={2} className="muted" aria-hidden="true" />
            <input
              type={showPw ? "text" : "password"}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "auth-err-password" : undefined}
            />
            <button
              type="button"
              className="auth-pw-toggle"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
            </button>
          </div>
          {errors.password && <span className="auth-error" id="auth-err-password">{errors.password}</span>}
        </label>

        {mode === "signup" && (
          <label className="field">
            <span className="field__label">Confirm password</span>
            <div className="input input--icon">
              <Lock size={18} strokeWidth={2} className="muted" aria-hidden="true" />
              <input
                type={showPw ? "text" : "password"}
                name="confirm-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirm)}
                aria-describedby={errors.confirm ? "auth-err-confirm" : undefined}
              />
            </div>
            {errors.confirm && <span className="auth-error" id="auth-err-confirm">{errors.confirm}</span>}
          </label>
        )}

        <button type="submit" className="btn-primary auth-submit">
          {mode === "login" ? "Log In" : "Create Account"}
          <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
