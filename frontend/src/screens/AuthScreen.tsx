import { useRef, useState, type FormEvent } from "react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { sessionFromUser, type Role, type Session } from "../useAuth";
import { api, type ApiUser } from "../api";
import { useEffect } from "react";

/**
 * Log In / Sign Up form. Shown inside the sign-in pop-up (components/AuthGate.tsx)
 * whenever a signed-out visitor tries to use a feature that needs an account.
 */

export type AuthMode = "login" | "signup";

interface Errors {
  name?: string;
  username?: string;
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
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
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
    if (busy) return;
    setServerError("");
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
    if (mode === "signup" && !/^[a-zA-Z0-9_]{3,50}$/.test(username.trim())) e.username = "Use 3-50 letters, numbers, or underscores.";
    if (mode === "signup" ? password.length < 12 || password.length > 128 : !password || password.length > 128)
      e.password = mode === "signup" ? "Use 12-128 characters." : "Enter your password.";
    if (mode === "signup" && confirm !== password) e.confirm = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    if (busy) { ev.preventDefault(); return; }
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

    setBusy(true); setServerError("");
    const controller = new AbortController(); request.current = controller;
    let registered = false;
    try {
      if (mode === "signup") {
        await api<ApiUser>("/auth/register", { method: "POST", token: null, signal: controller.signal,
          body: JSON.stringify({ email: email.trim(), username: username.trim(), password,
            display_name: name.trim(), account_type: role,
            business_name: role === "host" ? businessName.trim() : null,
            business_contact: role === "host" ? businessContact.trim() : null,
          }),
        });
        registered = true;
      }
      const result = await api<{ access_token: string }>("/auth/login", {
        method: "POST", token: null, signal: controller.signal,
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const user = await api<ApiUser>("/users/me", { token: result.access_token, signal: controller.signal });
      if (!controller.signal.aborted) {
        setPassword(""); setConfirm("");
        onAuthenticated(sessionFromUser(user, result.access_token), mode);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : "Could not sign in. Please try again.";
      setServerError(registered ? "Your account was created. Please log in to continue. " + message : message);
      if (registered) { setMode("login"); setPassword(""); setConfirm(""); }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
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

      <form className="auth-form" ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={busy}>
        {serverError && <p className="auth-error" role="alert">{serverError}</p>}
        <fieldset className="integration-fieldset" disabled={busy}>
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

        {mode === "signup" && <label className="field">
          <span className="field__label">Username</span>
          <input className="input" name="username" autoComplete="username" value={username}
            maxLength={50} onChange={(event) => setUsername(event.target.value)}
            aria-invalid={Boolean(errors.username)} aria-describedby={errors.username ? "auth-err-username" : undefined} />
          {errors.username && <span className="auth-error" id="auth-err-username">{errors.username}</span>}
        </label>}

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
              placeholder={mode === "signup" ? "At least 12 characters" : "Your password"}
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
          {busy ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </button>
        </fieldset>
      </form>
    </div>
  );
}
