import { useCallback, useEffect, useState } from "react";
import {
  SAMPLE_EVENT_STAFF,
  SAMPLE_RECEIVED_INVITES,
  type StaffInvite,
  type StaffMember,
} from "./data/staff";

/**
 * Front-end state for Check-in Staff (per-event QR-scanner access).
 * Kept in sessionStorage for the tab, like likes and joins.
 *
 * SECURITY: UX only. The server must check that a user is accepted staff for an
 * event before accepting any check-in they submit.
 */

const STAFF_KEY = "salika.eventStaff";
const INVITES_KEY = "salika.staffInvites";

const isStatus = (v: unknown) => v === "pending" || v === "accepted";
const isStr = (v: unknown): v is string => typeof v === "string";

function loadStaff(): Record<string, StaffMember[]> {
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(STAFF_KEY) ?? "null");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return SAMPLE_EVENT_STAFF;
    const out: Record<string, StaffMember[]> = {};
    for (const [id, list] of Object.entries(raw)) {
      if (!Array.isArray(list)) continue;
      out[id] = list.filter(
        (m): m is StaffMember =>
          m && isStr(m.email) && isStatus(m.status) && (m.name === undefined || isStr(m.name))
      );
    }
    return out;
  } catch {
    return SAMPLE_EVENT_STAFF;
  }
}

function loadInvites(): StaffInvite[] {
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(INVITES_KEY) ?? "null");
    if (!Array.isArray(raw)) return SAMPLE_RECEIVED_INVITES;
    return raw.filter(
      (i): i is StaffInvite => i && isStr(i.eventId) && isStr(i.invitedBy) && isStatus(i.status)
    );
  } catch {
    return SAMPLE_RECEIVED_INVITES;
  }
}

function save(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — stays in memory only */
  }
}

export function useStaff() {
  const [eventStaff, setEventStaff] = useState(loadStaff);
  const [invites, setInvites] = useState(loadInvites);

  useEffect(() => save(STAFF_KEY, eventStaff), [eventStaff]);
  useEffect(() => save(INVITES_KEY, invites), [invites]);

  /** Host invites someone by email. Starts as "pending" until they accept. */
  const inviteStaff = useCallback((eventId: string, email: string) => {
    setEventStaff((all) => ({
      ...all,
      [eventId]: [...(all[eventId] ?? []), { email, status: "pending" }],
    }));
  }, []);

  const removeStaff = useCallback((eventId: string, email: string) => {
    setEventStaff((all) => ({
      ...all,
      [eventId]: (all[eventId] ?? []).filter((m) => m.email !== email),
    }));
  }, []);

  /** Invitee accepts (gets scanner access) or declines (invitation removed). */
  const respondToInvite = useCallback((eventId: string, accept: boolean) => {
    setInvites((list) =>
      accept
        ? list.map((i) => (i.eventId === eventId ? { ...i, status: "accepted" as const } : i))
        : list.filter((i) => i.eventId !== eventId)
    );
  }, []);

  /** On log out: back to the demo's starting data. */
  const resetStaff = useCallback(() => {
    setEventStaff(SAMPLE_EVENT_STAFF);
    setInvites(SAMPLE_RECEIVED_INVITES);
  }, []);

  return { eventStaff, invites, inviteStaff, removeStaff, respondToInvite, resetStaff };
}
