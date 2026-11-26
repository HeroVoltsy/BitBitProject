import { useState } from "react";
import { ArrowLeft, CheckCircle2, QrCode } from "lucide-react";
import type { EventItem } from "../types";

const num = new Intl.NumberFormat();

function randomId() {
  return "CMN-" + String(Math.floor(10000 + Math.random() * 89999));
}

/**
 * Scanner-only view for Check-in Staff: scan QR codes for ONE event and see the
 * running count. No attendee names list, no editing, no other host tools.
 */
export function StaffScannerScreen({ event, onBack }: { event: EventItem; onBack: () => void }) {
  // Frontend-only: simulated scans, nothing is saved or sent.
  const [checkedIn, setCheckedIn] = useState(0);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const total = event.going;
  const pct = total > 0 ? Math.min(100, Math.round((checkedIn / total) * 100)) : 0;

  const simulateScan = () => {
    if (checkedIn >= total) {
      setLastScan("Everyone on the list is already checked in.");
      return;
    }
    setCheckedIn((n) => n + 1);
    setLastScan(`Checked in ${randomId()}`);
  };

  return (
    <div className="page page--narrow">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" /> Back to staff events
      </button>
      <h1 className="page-title">Check-in Scanner</h1>

      <div className="context-card card staff-context">
        <span className="context-card__text">
          <span className="muted">Scanning for</span>
          <strong>{event.title}</strong>
        </span>
        <span className="staff-chip staff-chip--on">Check-in Staff</span>
      </div>

      <div className="staff-count card">
        <span className="staff-count__nums">
          <strong>{num.format(checkedIn)}</strong> of {num.format(total)} checked in
        </span>
        <span
          className="staff-count__bar"
          role="progressbar"
          aria-label="Check-in progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={checkedIn}
        >
          <span className="staff-count__fill" style={{ transform: `scaleX(${pct / 100})` }} />
        </span>
      </div>

      <button className="scanner card" onClick={simulateScan} aria-label="Simulate a QR scan">
        <span className="scanner__bracket scanner__bracket--tl" />
        <span className="scanner__bracket scanner__bracket--tr" />
        <span className="scanner__bracket scanner__bracket--bl" />
        <span className="scanner__bracket scanner__bracket--br" />
        <QrCode size={120} strokeWidth={1.2} className="scanner__code" aria-hidden="true" />
        <span className="scanner__line" />
        <p className="scanner__hint">Tap to simulate scanning an attendee's QR code</p>
      </button>

      <p className="staff-last" aria-live="polite">
        {lastScan && (
          <>
            <CheckCircle2 size={18} strokeWidth={2.4} aria-hidden="true" /> {lastScan}
          </>
        )}
      </p>
    </div>
  );
}
