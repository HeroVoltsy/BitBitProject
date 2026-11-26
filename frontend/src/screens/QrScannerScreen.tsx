import { useState } from "react";
import { ArrowLeft, ChevronDown, QrCode, CheckCircle2, ScanLine } from "lucide-react";
import { RECENT_CHECKINS } from "../data/events";
import { useToast } from "../components/Toast";
import type { ScreenName } from "../types";

interface Checkin {
  id: string;
  ago: string;
}

function randomId() {
  return "CMN-" + String(Math.floor(10000 + Math.random() * 89999));
}

export function QrScannerScreen({ onNavigate }: { onNavigate: (s: ScreenName) => void }) {
  const [checkins, setCheckins] = useState<Checkin[]>(RECENT_CHECKINS);
  const notify = useToast();

  // Frontend-only: simulate scanning a member QR (nothing is saved).
  const simulateScan = () => {
    const id = randomId();
    setCheckins((list) => [{ id, ago: "just now" }, ...list]);
    notify(`Checked in ${id}`);
  };

  return (
    <div className="page page--narrow">
      <button className="back-link" onClick={() => onNavigate("event-detail")}>
        <ArrowLeft size={18} strokeWidth={2.2} /> Back
      </button>
      <h1 className="page-title">Check-In Scanner</h1>

      <button className="context-card card" onClick={() => notify("Only one active event in this demo")}>
        <span className="context-card__text">
          <span className="muted">Scanning for</span>
          <strong>Naga Sunday Market</strong>
        </span>
        <ChevronDown size={20} strokeWidth={2.2} className="muted" />
      </button>

      <button className="scanner card" onClick={simulateScan} aria-label="Simulate a QR scan">
        <span className="scanner__bracket scanner__bracket--tl" />
        <span className="scanner__bracket scanner__bracket--tr" />
        <span className="scanner__bracket scanner__bracket--bl" />
        <span className="scanner__bracket scanner__bracket--br" />
        <QrCode size={120} strokeWidth={1.2} className="scanner__code" />
        <span className="scanner__line" />
        <p className="scanner__hint">Tap to simulate scanning a member's QR code</p>
      </button>

      <section className="block">
        <h2 className="section-title block__title">Recently checked in</h2>
        <div className="stack">
          {checkins.map((c, i) => (
            <div className="checkin-row card" key={`${c.id}-${i}`}>
              <span className="checkin-row__left">
                <span className="checkin-row__avatar">
                  <ScanLine size={18} strokeWidth={2.2} />
                </span>
                <strong>{c.id}</strong>
              </span>
              <span className="checkin-row__right">
                <span className="muted">{c.ago}</span>
                <CheckCircle2 size={20} strokeWidth={2.2} className="checkin-row__check" />
              </span>
            </div>
          ))}
        </div>
        <button className="btn-ghost full-btn" onClick={() => onNavigate("attendance")}>
          View Full Attendance List
        </button>
      </section>
    </div>
  );
}
