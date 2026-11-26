import { CheckInScanner } from "../components/CheckInScanner";
import type { EventItem, ScreenName } from "../types";
export function QrScannerScreen({
  event,
  onNavigate,
}: {
  event: EventItem;
  onNavigate: (screen: ScreenName) => void;
}) {
  return (
    <CheckInScanner
      event={event}
      onBack={() => onNavigate("event-detail")}
      onAttendance={() => onNavigate("attendance")}
    />
  );
}
