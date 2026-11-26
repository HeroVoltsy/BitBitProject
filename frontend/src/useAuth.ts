import { useCallback, useEffect, useRef, useState } from "react";
import type { DemoKycRecord, DemoKycStatus } from "./kyc";
import { normalizeDiscoveryProfile, type DiscoveryProfile } from "./discovery";
import { CATEGORIES } from "./data/events";
import { api, AUTH_EXPIRED, readToken, storeToken, type ApiUser } from "./api";
import { tokenExpiry } from "./apiClient";
import { useToast } from "./components/Toast";
export type Role = "attendee" | "host";
export interface Session {
  id: number;
  username: string;
  name: string;
  email: string;
  token: string;
  // These UI preferences are local; the existing API does not store them.
  role?: Role;
  businessName?: string;
  businessContact?: string;
  demoKyc?: DemoKycRecord;
  discoveryProfile?: DiscoveryProfile;
}
type Preferences = Pick<
  Session,
  | "name"
  | "role"
  | "businessName"
  | "businessContact"
  | "demoKyc"
  | "discoveryProfile"
>;
const preferenceKey = (id: number) => `salika.preferences.v2.${id}`;
function readPreferences(id: number): Partial<Preferences> {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(preferenceKey(id)) ?? "null",
    );
    if (!value || typeof value !== "object") return {};
    return {
      name:
        typeof value.name === "string" ? value.name.slice(0, 200) : undefined,
      role: value.role === "host" ? "host" : "attendee",
      businessName:
        typeof value.businessName === "string"
          ? value.businessName.slice(0, 100)
          : undefined,
      businessContact:
        typeof value.businessContact === "string"
          ? value.businessContact.slice(0, 200)
          : undefined,
      discoveryProfile:
        normalizeDiscoveryProfile(value.discoveryProfile, CATEGORIES) ??
        undefined,
      demoKyc:
        value.demoKyc && typeof value.demoKyc === "object"
          ? value.demoKyc
          : undefined,
    };
  } catch {
    return {};
  }
}
function savePreferences(session: Session) {
  const {
    name,
    role,
    businessName,
    businessContact,
    demoKyc,
    discoveryProfile,
  } = session;
  try {
    sessionStorage.setItem(
      preferenceKey(session.id),
      JSON.stringify({
        name,
        role,
        businessName,
        businessContact,
        demoKyc,
        discoveryProfile,
      }),
    );
  } catch {
    /* Optional local preferences. */
  }
}
export function sessionFromUser(
  user: ApiUser,
  token: string,
  preferences: Partial<Preferences> = {},
): Session {
  if (
    !Number.isSafeInteger(user.id) ||
    user.id <= 0 ||
    !user.username ||
    !user.email
  )
    throw new Error("The server returned invalid account information.");
  const local = { ...readPreferences(user.id), ...preferences };
  return {
    id: user.id,
    username: user.username,
    name: local.name || user.username,
    email: user.email,
    token,
    role: local.role === "host" ? "host" : "attendee",
    businessName: local.businessName,
    businessContact: local.businessContact,
    demoKyc: local.demoKyc,
    discoveryProfile:
      normalizeDiscoveryProfile(local.discoveryProfile, CATEGORIES) ??
      undefined,
  };
}
export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return !parts.length
    ? "?"
    : parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const current = useRef<Session | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const notify = useToast();
  const login = useCallback((s: Session) => {
    current.current = s;
    storeToken(s.token);
    savePreferences(s);
    setSession(s);
    setSessionError("");
  }, []);
  const logout = useCallback(() => {
    current.current = null;
    storeToken(null);
    setSession(null);
    try {
      for (const key of Object.keys(sessionStorage))
        if (key.startsWith("salika.ticket.")) sessionStorage.removeItem(key);
    } catch {
      /* No private tickets retained when storage is available. */
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const token = readToken();
    if (!token) {
      storeToken(null);
      setRestoring(false);
      return;
    }
    storeToken(token);
    api<ApiUser>("/users/me", { token, signal: controller.signal })
      .then((user) => {
        if (!controller.signal.aborted) login(sessionFromUser(user, token));
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          logout();
          setSessionError(
            e instanceof Error ? e.message : "Could not restore your login.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setRestoring(false);
      });
    return () => controller.abort();
  }, [login, logout]);
  useEffect(() => {
    const expire = () => {
      logout();
      notify("Your session has expired. Please log in again.");
    };
    window.addEventListener(AUTH_EXPIRED, expire);
    const timer = session
      ? window.setTimeout(
          expire,
          Math.max(0, tokenExpiry(session.token) - Date.now()),
        )
      : undefined;
    return () => {
      window.removeEventListener(AUTH_EXPIRED, expire);
      window.clearTimeout(timer);
    };
  }, [session, logout, notify]);
  const update = useCallback(
    (change: (s: Session) => Session) => {
      const before = current.current;
      if (!before) return;
      login(change(before));
    },
    [login],
  );
  const setRole = useCallback(
    (role: Role) => update((s) => ({ ...s, role })),
    [update],
  );
  const setDiscoveryProfile = useCallback(
    (profile: DiscoveryProfile) => {
      const normalized = normalizeDiscoveryProfile(profile, CATEGORIES);
      if (normalized) update((s) => ({ ...s, discoveryProfile: normalized }));
    },
    [update],
  );
  const setDemoKycStatus = useCallback(
    (role: Role, status: DemoKycStatus) =>
      update((s) => ({ ...s, demoKyc: { ...s.demoKyc, [role]: status } })),
    [update],
  );
  return {
    session,
    login,
    logout,
    restoring,
    sessionError,
    setRole,
    setDiscoveryProfile,
    setDemoKycStatus,
  };
}
