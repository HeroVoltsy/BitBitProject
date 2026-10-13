import { useState, type FormEvent } from "react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, MapPin, CalendarDays, QrCode } from "lucide-react";
import type { Session } from "../useAuth";
import { ParrotLogo } from "../components/ParrotLogo";

type Mode = "login" | "signup";

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (s: Session) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [artOk, setArtOk] = useState(true);

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (mode === "signup" && name.trim().length < 2) e.name = "Enter your full name.";
    if (!EMAIL_RE.test(email)) e.email = "Enter a valid email address.";
    if (password.length < 8) e.password = "Use at least 8 characters.";
    if (mode === "signup" && confirm !== password) e.confirm = "Passwords do not match.";
    return e;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    // Demo only: no password is stored or sent anywhere.
    const displayName =
      mode === "signup"
        ? name.trim()
        : email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    onAuthenticated({ name: displayName, email: email.trim() });
  };

  return (
    <div className="auth-split">
      {/* Left — brand panel */}
      <aside className="auth-hero">
        <div className="auth-hero__top">
          <span className="brand__mark auth-hero__mark">
            <ParrotLogo size={30} />
          </span>
          <span className="auth-hero__name">
            sali ka<span className="auth-hero__q">?</span>
          </span>
        </div>

        <div className="auth-hero__art">
          {artOk ? (
            <img
              src="/parrot.png"
              alt="Sali Ka parrot"
              onError={() => setArtOk(false)}
            />
          ) : (
            <ParrotLogo size={168} className="auth-hero__art-fallback" title="Sali Ka parrot" />
          )}
        </div>

        <div className="auth-hero__body">
          <h1 className="auth-hero__headline">Your neighborhood, always up to something.</h1>
          <p className="auth-hero__lead">
            Discover, host, and check in to community events happening right around you.
          </p>

          <ul className="auth-hero__points">
            <li>
              <MapPin size={18} strokeWidth={2.2} />
              Find events happening near you
            </li>
            <li>
              <CalendarDays size={18} strokeWidth={2.2} />
              Host and manage your own
            </li>
            <li>
              <QrCode size={18} strokeWidth={2.2} />
              Check members in with a QR
            </li>
          </ul>
        </div>

        <p className="auth-hero__foot">Community events, reimagined for the web.</p>
      </aside>

      {/* Right — login / sign-up form */}
      <div className="auth-panel">
        <div className="auth-card">
          <h2 className="auth-card__title">
            {mode === "login" ? "sali na!" : "Create your account"}
          </h2>
          {mode === "signup" && (
            <p className="auth-card__sub">Join your community in a few seconds.</p>
          )}

          <div className="segmented auth-seg">
            <button
              className={`segmented__tab ${mode === "login" ? "segmented__tab--active" : ""}`}
              onClick={() => switchMode("login")}
              type="button"
            >
              Log In
            </button>
            <button
              className={`segmented__tab ${mode === "signup" ? "segmented__tab--active" : ""}`}
              onClick={() => switchMode("signup")}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {mode === "signup" && (
              <label className="field">
                <span className="field__label">Full name</span>
                <div className="input input--icon">
                  <User size={18} strokeWidth={2} className="muted" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Kyle Sta. Rosa"
                    autoComplete="name"
                  />
                </div>
                {errors.name && <span className="auth-error">{errors.name}</span>}
              </label>
            )}

            <label className="field">
              <span className="field__label">Email</span>
              <div className="input input--icon">
                <Mail size={18} strokeWidth={2} className="muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="auth-error">{errors.email}</span>}
            </label>

            <label className="field">
              <span className="field__label">Password</span>
              <div className="input input--icon">
                <Lock size={18} strokeWidth={2} className="muted" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
              {errors.password && <span className="auth-error">{errors.password}</span>}
            </label>

            {mode === "signup" && (
              <label className="field">
                <span className="field__label">Confirm password</span>
                <div className="input input--icon">
                  <Lock size={18} strokeWidth={2} className="muted" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirm && <span className="auth-error">{errors.confirm}</span>}
              </label>
            )}

            <button type="submit" className="btn-primary auth-submit">
              {mode === "login" ? "Log In" : "Create Account"}
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>
          </form>

          <button
            className="auth-guest"
            onClick={() => onAuthenticated({ name: "Kyle Sta. Rosa", email: "", guest: true })}
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
