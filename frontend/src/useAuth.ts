import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeDiscoveryProfile, type DiscoveryProfile } from "./discovery";
import { CATEGORIES } from "./data/events";
import { api, AUTH_EXPIRED, readToken, storeToken, updateProfile, type ApiUser } from "./api";
import { tokenExpiry } from "./apiClient";
import { useToast } from "./components/Toast";

export type Role = "attendee" | "host";
export interface Session {
  id: number; name: string; email: string; role: Role; token: string;
  businessName?: string; businessContact?: string; discoveryProfile?: DiscoveryProfile;
}
export function sessionFromUser(user: ApiUser, token: string): Session {
  if (!Number.isInteger(user.id) || !user.email || !user.username || !["attendee", "host"].includes(user.account_type)) {
    throw new Error("Account information could not be loaded. Please try again later.");
  }
  return {
    id: user.id, name: user.display_name || user.username, email: user.email,
    role: user.account_type, token, businessName: user.business_name ?? undefined,
    businessContact: user.business_contact ?? undefined,
    discoveryProfile: normalizeDiscoveryProfile(user.discovery_profile, CATEGORIES) ?? undefined,
  };
}
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const current = useRef<Session | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const notify = useToast();
  const login = useCallback((next: Session) => {
    current.current = next; storeToken(next.token); setSession(next); setSessionError("");
  }, []);
  const logout = useCallback(() => {
    current.current = null; storeToken(null); setSession(null);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const token = readToken();
    if (!token) { storeToken(null); setRestoring(false); return; }
    storeToken(token);
    api<ApiUser>("/users/me", { token, signal: controller.signal })
      .then((user) => { if (!controller.signal.aborted) login(sessionFromUser(user, token)); })
      .catch((error) => {
        if (controller.signal.aborted) return;
        logout(); setSessionError(error.message || "Could not restore your session. Please log in again.");
      })
      .finally(() => { if (!controller.signal.aborted) setRestoring(false); });
    return () => controller.abort();
  }, [login, logout]);
  useEffect(() => {
    const expire = () => { logout(); notify("Your session has expired. Please log in again."); };
    window.addEventListener(AUTH_EXPIRED, expire);
    const timer = session ? window.setTimeout(expire, Math.max(0, tokenExpiry(session.token) - Date.now())) : undefined;
    return () => { window.removeEventListener(AUTH_EXPIRED, expire); window.clearTimeout(timer); };
  }, [session, logout, notify]);

  const save = useCallback(async (data: Parameters<typeof updateProfile>[0]) => {
    const before = current.current;
    if (!before) throw new Error("Please log in again.");
    const user = await updateProfile(data);
    if (current.current?.token !== before.token) throw new Error("Your session changed. Please try again.");
    const next = sessionFromUser(user, before.token);
    login(next); return next;
  }, [login]);
  const setRole = useCallback((role: Role) => save({ account_type: role }), [save]);
  const setDiscoveryProfile = useCallback((profile: DiscoveryProfile) => save({ discovery_profile: profile }), [save]);
  return { session, login, logout, restoring, sessionError, setRole, setDiscoveryProfile };
}
