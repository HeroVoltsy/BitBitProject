import { useCallback, useState } from "react";
import type { DemoKycRecord, DemoKycStatus } from "./kyc";
import { normalizeDiscoveryProfile, type DiscoveryProfile } from "./discovery";
import { CATEGORIES } from "./data/events";

/**
 * Lightweight, front-end-only session for the demo.
 *
 * SECURITY: This is a UX gate, not a real authentication system. There is no
 * backend, so:
 *   - No password is ever stored, transmitted, or kept in memory after submit.
 *   - Only a non-sensitive marker (display name + email) is kept in
 *     sessionStorage, which is per-tab and cleared when the tab closes.
 *   - This gate does NOT protect any data — all content in this app is public
 *     sample data. For production, replace this with server-side auth
 *     (hashed passwords, HTTPS, httpOnly session cookies, rate limiting).
 */

const SESSION_KEY = "salika.session";

/** Which UI the user sees: attendees browse/join events, hosts get the dashboard. */
export type Role = "attendee" | "host";

export interface Session {
  name: string;
  email: string;
  /** Defaults to "attendee" when missing (e.g. sessions saved before roles existed). */
  role?: Role;
  businessName?: string;
  businessContact?: string;
  /** Per-role prototype status only; never identity data or a real verified flag. */
  demoKyc?: DemoKycRecord;
  discoveryProfile?: DiscoveryProfile;
}

function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(() => loadSession());

  const persist = useCallback((s: Session | null) => {
    try {
      if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* storage unavailable (private mode, blocked) — session stays in memory */
    }
  }, []);

  const login = useCallback(
    (s: Session) => {
      setSession(s);
      persist(s);
    },
    [persist]
  );

  const logout = useCallback(() => {
    setSession(null);
    persist(null);
  }, [persist]);

  /** Switch between the attendee and host UI (Settings → "Sali ka as a host!" / "Sali na!"). */
  const setRole = useCallback(
    (role: Role) => {
      setSession((s) => {
        if (!s) return s;
        const next = { ...s, role };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setDemoKycStatus = useCallback((role: Role, status: DemoKycStatus) => {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, demoKyc: { ...current.demoKyc, [role]: status } };
      persist(next);
      return next;
    });
  }, [persist]);

  const setDiscoveryProfile = useCallback((profile: DiscoveryProfile) => {
    const normalized = normalizeDiscoveryProfile(profile, CATEGORIES);
    if (!normalized) return;
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, discoveryProfile: normalized };
      persist(next);
      return next;
    });
  }, [persist]);

  return { session, login, logout, setRole, setDemoKycStatus, setDiscoveryProfile };
}
