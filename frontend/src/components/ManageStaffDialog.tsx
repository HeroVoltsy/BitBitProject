import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { X } from "lucide-react";
import { api } from "../api";
import type { StaffMember } from "../events";
import type { EventItem } from "../types";
export function ManageStaffDialog({
  event,
  onClose,
  onChanged,
}: {
  event: EventItem;
  onClose: () => void;
  onChanged: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    abort = useRef(new AbortController()),
    lock = useRef(false);
  const [members, setMembers] = useState<StaffMember[]>([]),
    [userId, setUserId] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [confirm, setConfirm] = useState<number | null>(null);
  const load = useCallback(async () => {
    const signal = abort.current.signal;
    setLoading(true);
    setError("");
    try {
      const rows = await api<StaffMember[]>(
        `/api/v1/events/${event.id}/staff`,
        { signal },
      );
      if (!signal.aborted) setMembers(rows);
    } catch (e) {
      if (!signal.aborted)
        setError(e instanceof Error ? e.message : "Could not load staff.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [event.id]);
  useEffect(() => {
    abort.current = new AbortController();
    const opener = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    void load();
    return () => {
      abort.current.abort();
      dialog.current?.close();
      opener?.focus();
    };
  }, [load]);
  const change = async (action: () => Promise<unknown>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
      if (abort.current.signal.aborted) return;
      setUserId("");
      setConfirm(null);
      await load();
      onChanged();
    } catch (e) {
      if (!abort.current.signal.aborted)
        setError(e instanceof Error ? e.message : "Could not update staff.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const invite = (e: FormEvent) => {
    e.preventDefault();
    const id = Number(userId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError("Enter a valid user ID.");
      return;
    }
    void change(() =>
      api(`/api/v1/events/${event.id}/staff`, {
        method: "POST",
        signal: abort.current.signal,
        body: JSON.stringify({ user_id: id }),
      }),
    );
  };
  return (
    <dialog
      ref={dialog}
      className="staff-modal"
      aria-labelledby="staff-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="staff-modal__body">
        <button
          className="auth-modal__close"
          disabled={busy}
          aria-label="Close"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2 className="staff-modal__title" id="staff-title">
          Check-in Staff
        </h2>
        <p>{event.title}</p>
        <p className="muted">
          Event ID: <strong>{event.id}</strong>. Share this ID with your invited
          staff.
        </p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <form className="staff-invite" onSubmit={invite}>
          <label className="field">
            <span className="field__label">Invite by user ID</span>
            <input
              className="input"
              type="number"
              min={1}
              step={1}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              disabled={busy || loading}
            />
          </label>
          <button className="btn-primary" disabled={busy || loading}>
            Send Invite
          </button>
        </form>
        {loading ? (
          <p role="status">Loading staff...</p>
        ) : (
          <>
            <h3 className="staff-list__title">
              On your staff ({members.length})
            </h3>
            <ul className="staff-list">
              {members.map((m) => (
                <li className="staff-row" key={m.user_id}>
                  <strong>User #{m.user_id}</strong>
                  <span className="staff-chip">{m.status}</span>
                  <button
                    className="staff-row__remove"
                    disabled={busy}
                    onClick={() =>
                      confirm === m.user_id
                        ? void change(() =>
                            api(
                              `/api/v1/events/${event.id}/staff/${m.user_id}`,
                              {
                                method: "DELETE",
                                signal: abort.current.signal,
                              },
                            ),
                          )
                        : setConfirm(m.user_id)
                    }
                  >
                    {confirm === m.user_id ? "Confirm Remove" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
            {!members.length && <p className="empty">No staff yet.</p>}
          </>
        )}
        <button
          className="btn-ghost"
          disabled={busy}
          onClick={() => void load()}
        >
          Refresh staff
        </button>
      </div>
    </dialog>
  );
}
