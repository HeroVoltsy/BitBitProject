import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ArrowLeft, ScanLine } from "lucide-react";
import { api } from "../api";
import { attendanceSummary, ticketToken } from "../events";
import type { EventItem } from "../types";
interface Controls {
  stop: () => void;
}
export function CheckInScanner({
  event,
  onBack,
  onAttendance,
  staff = false,
}: {
  event: EventItem;
  onBack: () => void;
  onAttendance?: () => void;
  staff?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<Controls>();
  const generation = useRef(0);
  const lock = useRef(false);
  const abort = useRef(new AbortController());
  const [summary, setSummary] = useState<{
    registered: number;
    checked_in: number;
  } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState(false);
  const stop = useCallback(() => {
    ++generation.current;
    controls.current?.stop();
    controls.current = undefined;
    setCamera(false);
  }, []);
  const refresh = useCallback(async () => {
    const signal = abort.current.signal;
    try {
      const value = await attendanceSummary(event.id, signal);
      if (!signal.aborted) {
        setSummary(value);
        setLoadError("");
      }
    } catch (e) {
      if (!signal.aborted)
        setLoadError(
          e instanceof Error ? e.message : "Could not load attendance.",
        );
    }
  }, [event.id]);
  useEffect(() => {
    abort.current = new AbortController();
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 15000);
    return () => {
      abort.current.abort();
      ++generation.current;
      controls.current?.stop();
      window.clearInterval(timer);
    };
  }, [refresh]);
  const scan = async (payload: string) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const token = ticketToken(payload, event.id);
      const result = await api<{ valid: boolean; message: string }>(
        `/api/v1/events/${event.id}/check-ins/scan`,
        {
          method: "POST",
          body: JSON.stringify({ token }),
          signal: abort.current.signal,
        },
      );
      if (!abort.current.signal.aborted) {
        setStatus(result.message);
        setCode("");
        await refresh();
      }
    } catch (e) {
      if (!abort.current.signal.aborted)
        setError(e instanceof Error ? e.message : "Check-in failed.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const start = async () => {
    stop();
    const run = ++generation.current;
    setCamera(true);
    setError("");
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      if (run !== generation.current || !video.current) return;
      const reader = new BrowserQRCodeReader();
      const result = await reader.decodeFromVideoDevice(
        undefined,
        video.current,
        (result, _error, scanner) => {
          if (result && run === generation.current) {
            scanner.stop();
            stop();
            void scan(result.getText());
          }
        },
      );
      if (run !== generation.current) result.stop();
      else controls.current = result;
    } catch {
      if (run === generation.current) {
        stop();
        setError(
          "Could not open the camera. Allow camera access, or enter the attendance code below.",
        );
      }
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    stop();
    void scan(code);
  };
  return (
    <div className="page page--narrow">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="page-title">Check-in Scanner</h1>
      <div className="context-card card">
        <div>
          <span className="muted">Scanning for</span>
          <strong>{event.title}</strong>
        </div>
        {staff && <span className="staff-chip">Check-in Staff</span>}
      </div>
      {loadError && (
        <p className="auth-error" role="alert">
          {loadError}{" "}
          <button className="btn-ghost" onClick={() => void refresh()}>
            Retry
          </button>
        </p>
      )}
      {summary && (
        <div className="stats-row">
          <div className="stat-card stat-card--green">
            <span>Checked in</span>
            <strong className="stat-card__value">{summary.checked_in}</strong>
          </div>
          <div className="stat-card">
            <span>Registered</span>
            <strong className="stat-card__value">{summary.registered}</strong>
          </div>
        </div>
      )}
      <video
        ref={video}
        className="scan-video"
        muted
        playsInline
        hidden={!camera}
      />
      <button
        className="btn-secondary"
        disabled={busy || !summary || Boolean(loadError)}
        onClick={() => (camera ? stop() : void start())}
      >
        <ScanLine size={18} /> {camera ? "Stop camera" : "Start camera"}
      </button>
      <form className="scan-form card form-card" onSubmit={submit}>
        <label className="field">
          <span className="field__label">Attendance code</span>
          <textarea
            className="input textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="BITBIT:TICKET:..."
            required
            disabled={busy}
          />
        </label>
        <button
          className="btn-primary"
          disabled={busy || !summary || Boolean(loadError)}
        >
          {busy ? "Checking..." : "Check in attendee"}
        </button>
      </form>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <p role="status">{status}</p>
      {onAttendance && (
        <button className="btn-ghost" onClick={onAttendance}>
          View Full Attendance List
        </button>
      )}
    </div>
  );
}
