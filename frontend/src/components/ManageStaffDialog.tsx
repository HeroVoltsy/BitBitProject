import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { X } from "lucide-react";
import { api } from "../api";
import type { EventItem } from "../types";
interface Member {
  user_id: number;
  email: string;
  name: string;
  status: string;
}
export function ManageStaffDialog({
  event,
  ownEmail,
  onClose,
  onChanged,
}: {
  event: EventItem;
  ownEmail?: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const controller = useRef(new AbortController());
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [confirm, setConfirm] = useState<number | null>(null);
  const load = useCallback(async () => {
    const signal = controller.current.signal;
    setLoading(true);
    setError("");
    try {
      const members = await api<Member[]>(`/api/v1/events/${event.id}/staff`, {
        signal,
      });
      if (!signal.aborted) setMembers(members);
    } catch (e) {
      if (!signal.aborted)
        setError(e instanceof Error ? e.message : "Could not load staff.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [event.id]);
  useEffect(() => {
    controller.current = new AbortController();
    const opener = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    void load();
    return () => {
      controller.current.abort();
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
      setEmail("");
      setConfirm(null);
      await load();
      onChanged();
    } catch (e) {
      if (!controller.current.signal.aborted)
        setError(e instanceof Error ? e.message : "Could not update staff.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const invite = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === ownEmail?.toLowerCase()) {
      setError("You are the host. Invite someone else.");
      return;
    }
    void change(() =>
      api(`/api/v1/events/${event.id}/staff`, {
        method: "POST",
        signal: controller.current.signal,
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
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
        <h2 id="staff-title" className="staff-modal__title">
          Check-in Staff
        </h2>
        <p className="staff-modal__sub">
          Invite an existing account to help check people in at{" "}
          <strong>{event.title}</strong>.
        </p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <form className="staff-invite" onSubmit={invite}>
          <label className="field">
            <span className="field__label">Invite by email</span>
            <input
              className="input"
              type="email"
              required
              value={email}
              disabled={busy || loading}
              onChange={(e) => setEmail(e.target.value)}
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
                  <span className="staff-row__info">
                    <strong>{m.name}</strong>
                    <span>{m.email}</span>
                  </span>
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
                                signal: controller.current.signal,
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
