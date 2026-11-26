import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, getActiveToken } from "./api";
import {
  eventItem,
  myRegistration,
  ticketKey,
  type ApiEvent,
  type Attendee,
  type EventInput,
  type StaffMember,
} from "./events";
import type { EventItem } from "./types";
export interface StaffInvitation {
  event: EventItem;
  status: "pending" | "accepted";
}
interface Data {
  owner?: number;
  events: EventItem[];
  joined: EventItem[];
  invites: StaffInvitation[];
}
const empty = (owner?: number): Data => ({
  owner,
  events: [],
  joined: [],
  invites: [],
});
function loadIds(key: string) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "[]");
    return Array.isArray(value)
      ? value.filter(
          (id): id is string => typeof id === "string" && /^\d+$/.test(id),
        )
      : [];
  } catch {
    return [];
  }
}
function saveIds(key: string, ids: string[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* Optional local preferences. */
  }
}
export function useEvents(userId?: number) {
  const [data, setData] = useState<Data>(() => empty(userId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const version = useRef(0);
  const controller = useRef<AbortController>();
  const [localLikes, setLocalLikes] = useState<{
    owner?: number;
    ids: string[];
  }>({ ids: [] });
  const likesKey = `salika.likes.v2.${userId}`;
  const staffKey = `salika.staff-events.v2.${userId}`;
  useEffect(
    () =>
      setLocalLikes({ owner: userId, ids: userId ? loadIds(likesKey) : [] }),
    [userId, likesKey],
  );
  const refresh = useCallback(async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const run = ++version.current;
    if (!userId) {
      setData(empty());
      setError("");
      setLoading(false);
      return;
    }
    const actor = getActiveToken();
    if (!actor) return;
    setLoading(true);
    setError("");
    try {
      const rows: ApiEvent[] = [];
      for (let offset = 0; ; offset += 100) {
        const page = await api<ApiEvent[]>(
          `/api/v1/events?limit=100&offset=${offset}`,
          { signal: abort.signal, token: actor },
        );
        rows.push(...page);
        if (page.length < 100) break;
      }
      const events = Array.from(
        new Map(
          rows
            .sort((a, b) => Number(b.promoted) - Number(a.promoted))
            .map((e) => [e.id, eventItem(e, userId)]),
        ).values(),
      );
      const accepted = loadIds(staffKey);
      const found = new Set<string>();
      const notices: string[] = [];
      let next = 0;
      await Promise.all(
        Array.from({ length: Math.min(4, events.length) }, async () => {
          while (next < events.length) {
            const event = events[next++];
            if (abort.signal.aborted) return;
            const registration = await myRegistration(event.id, abort.signal);
            event.attending = Boolean(registration);
            if (event.hosting || accepted.includes(event.id)) {
              try {
                const attendance = await api<Attendee[]>(
                  `/api/v1/events/${event.id}/attendees`,
                  { signal: abort.signal },
                );
                event.going = attendance.length;
                event.countsAvailable = true;
                if (!event.hosting) found.add(event.id);
                if (event.hosting) {
                  const staff = await api<StaffMember[]>(
                    `/api/v1/events/${event.id}/staff`,
                    { signal: abort.signal },
                  );
                  event.staffCount = staff.filter(
                    (s) => s.status !== "declined",
                  ).length;
                }
              } catch (e) {
                if (abort.signal.aborted) return;
                if (e instanceof ApiError && e.status === 403) continue;
                if (e instanceof ApiError && e.status === 401) throw e;
                notices.push(
                  e instanceof Error ? e.message : "Attendance is unavailable.",
                );
              }
            }
          }
        }),
      );
      if (
        abort.signal.aborted ||
        run !== version.current ||
        actor !== getActiveToken()
      )
        return;
      saveIds(staffKey, [...found]);
      setData({
        owner: userId,
        events,
        joined: events.filter((e) => e.attending),
        invites: events
          .filter((e) => found.has(e.id))
          .map((event) => ({ event, status: "accepted" })),
      });
      if (notices.length)
        setError("Some event details could not be loaded. " + notices[0]);
    } catch (e) {
      if (run === version.current && !abort.signal.aborted)
        setError(e instanceof Error ? e.message : "Could not load events.");
    } finally {
      if (run === version.current) setLoading(false);
    }
  }, [userId, staffKey]);
  const latest = useRef(refresh);
  latest.current = refresh;
  useEffect(() => {
    void refresh();
    return () => {
      ++version.current;
      controller.current?.abort();
    };
  }, [refresh]);
  useEffect(() => {
    const focus = () => {
      if (!lock.current) void latest.current();
    };
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, []);
  const mutate = useCallback(async <T>(action: () => Promise<T>) => {
    const actor = getActiveToken();
    if (!actor) throw new Error("Please log in to continue.");
    if (lock.current) throw new Error("Please wait for the current request.");
    lock.current = true;
    setBusy(true);
    try {
      const value = await action();
      if (actor !== getActiveToken())
        throw new Error("Your session changed. Please try again.");
      await latest.current();
      return value;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }, []);
  const current = data.owner === userId ? data : empty(userId);
  const likedIds = localLikes.owner === userId ? localLikes.ids : [];
  return {
    ...current,
    loading,
    error,
    busy,
    refresh,
    likedIds,
    liked: current.events.filter((e) => likedIds.includes(e.id)),
    toggleLike: (id: string) => {
      if (!userId) return;
      const ids = likedIds.includes(id)
        ? likedIds.filter((x) => x !== id)
        : [id, ...likedIds];
      saveIds(likesKey, ids);
      setLocalLikes({ owner: userId, ids });
    },
    create: (input: EventInput) =>
      mutate(() =>
        api<ApiEvent>("/api/v1/events", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      ),
    update: (id: string, input: EventInput) =>
      mutate(() =>
        api<ApiEvent>(`/api/v1/events/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        }),
      ),
    join: (id: string) =>
      mutate(() =>
        api(`/api/v1/events/${id}/registrations`, { method: "POST" }),
      ),
    leave: (id: string) =>
      mutate(async () => {
        const result = await api(`/api/v1/events/${id}/registrations/me`, {
          method: "DELETE",
        });
        try {
          sessionStorage.removeItem(ticketKey(userId!, id));
        } catch {
          /* Optional cache. */
        }
        return result;
      }),
    cancel: (id: string) =>
      mutate(() => api(`/api/v1/events/${id}`, { method: "DELETE" })),
    respond: (id: string, accept: boolean) =>
      mutate(async () => {
        const value = await api<StaffMember>(`/api/v1/events/${id}/staff/me`, {
          method: "PATCH",
          body: JSON.stringify({ status: accept ? "accepted" : "declined" }),
        });
        const ids = loadIds(staffKey).filter((x) => x !== id);
        if (value.status === "accepted") ids.push(id);
        saveIds(staffKey, ids);
        return value;
      }),
    checkStaff: (id: string) =>
      mutate(async () => {
        const event = await api<ApiEvent>(`/api/v1/events/${id}`);
        if (event.host_id === userId)
          throw new Error(
            "You host this event. Open its scanner from your dashboard.",
          );
        await api<Attendee[]>(`/api/v1/events/${id}/attendees`);
        saveIds(staffKey, [...new Set([...loadIds(staffKey), id])]);
        return event;
      }),
  };
}
