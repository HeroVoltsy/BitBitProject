import { useCallback, useEffect, useRef, useState } from "react";
import { api, getActiveToken } from "./api";
import { eventItem, type ApiEvent, type EventInput } from "./events";
import type { EventItem } from "./types";

export interface StaffInvitation {
  event: EventItem;
  status: "pending" | "accepted";
}
interface EventData {
  owner?: number;
  events: EventItem[];
  joined: EventItem[];
  liked: EventItem[];
  invites: StaffInvitation[];
}
const empty = (owner?: number): EventData => ({
  owner,
  events: [],
  joined: [],
  liked: [],
  invites: [],
});
export function useEvents(userId?: number) {
  const [data, setData] = useState<EventData>(() => empty(userId));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const version = useRef(0);
  const controller = useRef<AbortController>();
  const locked = useRef(false);
  const refresh = useCallback(async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const generation = ++version.current;
    const token = userId ? getActiveToken() : null;
    setLoading(true);
    setError("");
    const options = { signal: abort.signal, token };
    try {
      const pages: ApiEvent[] = [];
      for (let offset = 0; ; offset += 100) {
        const page = await api<ApiEvent[]>(
          `/api/v1/events?limit=100&offset=${offset}`,
          options,
        );
        pages.push(...page);
        if (page.length < 100) break;
      }
      const [joined, liked, invites] = userId
        ? await Promise.all([
            api<ApiEvent[]>("/api/v1/events/mine/registrations", options),
            api<ApiEvent[]>("/api/v1/events/mine/likes", options),
            api<{ event: ApiEvent; status: "pending" | "accepted" }[]>(
              "/api/v1/events/mine/staff",
              options,
            ),
          ])
        : [[], [], []];
      if (generation !== version.current || abort.signal.aborted) return;
      setData({
        owner: userId,
        events: pages.map((e) => eventItem(e, userId)),
        joined: joined.map((e) => eventItem(e, userId)),
        liked: liked.map((e) => eventItem(e, userId)),
        invites: invites.map((i) => ({
          ...i,
          event: eventItem(i.event, userId),
        })),
      });
    } catch (e) {
      if (generation === version.current && !abort.signal.aborted)
        setError(e instanceof Error ? e.message : "Could not load events.");
    } finally {
      if (generation === version.current) setLoading(false);
    }
  }, [userId]);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => {
    void refresh();
    return () => {
      ++version.current;
      controller.current?.abort();
    };
  }, [refresh]);
  useEffect(() => {
    const onFocus = () => {
      if (!locked.current) void refreshRef.current();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  const mutate = useCallback(async <T>(action: () => Promise<T>) => {
    const actor = getActiveToken();
    if (!actor) throw new Error("Please log in to continue.");
    if (locked.current)
      throw new Error("Please wait for the current request to finish.");
    locked.current = true;
    setBusy(true);
    try {
      const value = await action();
      if (actor !== getActiveToken())
        throw new Error("Your session changed. Please try again.");
      await refreshRef.current();
      return value;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }, []);
  const current = data.owner === userId ? data : empty(userId);
  return {
    ...current,
    loading,
    error,
    busy,
    refresh,
    create: (input: EventInput) =>
      mutate(() =>
        api<ApiEvent>("/api/v1/events", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      ),
    join: (id: string) =>
      mutate(() =>
        api(`/api/v1/events/${id}/registrations`, { method: "POST" }),
      ),
    leave: (id: string) =>
      mutate(() =>
        api(`/api/v1/events/${id}/registrations/me`, { method: "DELETE" }),
      ),
    toggleLike: (event: EventItem) =>
      mutate(() =>
        api(`/api/v1/events/${event.id}/likes`, {
          method: event.liked ? "DELETE" : "POST",
        }),
      ),
    respond: (id: string, accept: boolean) =>
      mutate(() =>
        api(`/api/v1/events/${id}/staff/me`, {
          method: "PATCH",
          body: JSON.stringify({ status: accept ? "accepted" : "declined" }),
        }),
      ),
    cancel: (id: string) =>
      mutate(() => api(`/api/v1/events/${id}`, { method: "DELETE" })),
  };
}
