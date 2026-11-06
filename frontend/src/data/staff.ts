/**
 * Check-in Staff — people a host invites to scan QR codes at one of their events.
 * Staff access is per event: staff can only open the scanner for that event.
 * Sample data only; the backend will own real invitations and permissions.
 */

export type StaffStatus = "pending" | "accepted";

/** Someone the current user (as host) invited to scan at one of their events. */
export interface StaffMember {
  email: string;
  name?: string;
  status: StaffStatus;
}

/** An invitation the current user received to be staff at someone else's event. */
export interface StaffInvite {
  eventId: string;
  invitedBy: string;
  status: StaffStatus;
}

/** Staff on the current user's own hosted events, keyed by event id. */
export const SAMPLE_EVENT_STAFF: Record<string, StaffMember[]> = {
  "naga-sunday-market": [
    { name: "Maria Santos", email: "maria.santos@example.com", status: "accepted" },
    { name: "Jose dela Cruz", email: "jose.delacruz@example.com", status: "pending" },
  ],
};

/** Invitations the current user received (so the staff side can be demoed). */
export const SAMPLE_RECEIVED_INVITES: StaffInvite[] = [
  { eventId: "naga-fun-run", invitedBy: "Paolo Mendoza", status: "pending" },
  // Ended events, to demo what happens to staff access afterwards:
  { eventId: "bicol-indie-night", invitedBy: "Paolo Mendoza", status: "accepted" },
  { eventId: "coastal-cleanup", invitedBy: "Miguel Torres", status: "pending" },
];
