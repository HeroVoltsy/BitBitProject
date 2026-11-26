import { CheckInScanner } from "../components/CheckInScanner";
import type { EventItem } from "../types";
export function StaffScannerScreen({
  event,
  onBack,
}: {
  event: EventItem;
  onBack: () => void;
}) {
  return <CheckInScanner event={event} onBack={onBack} staff />;
}
