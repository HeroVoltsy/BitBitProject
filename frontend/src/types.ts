export type Category =
  | "Market"
  | "Music"
  | "Sports"
  | "Volunteer"
  | "Fun Run"
  | "Concert"
  | "Pop-Up";

export type Occupation = "student" | "teacher" | "professional" | "business_owner" | "self_employed" | "other" | "prefer_not_to_say";

export type ScreenName =
  | "home"
  | "host-profile"
  | "calendar"
  | "map"
  | "create-event"
  | "profile"
  | "event-detail"
  | "qr-scanner"
  | "attendance"
  | "settings"
  | "verification"
  | "discovery"
  | "terms"
  | "privacy"
  | "bylaws"
  | "organized-events"
  | "followers"
  | "liked-events"
  | "host-dashboard"
  | "staff"
  | "staff-scanner";

/** Tabs on the Profile screen. */
export type ProfileTab = "organizer" | "attendee" | "past";

export interface EventItem {
  id: string;
  title: string;
  category: Category;
  monthLabel: string; // e.g. "AUG"
  day: string; // e.g. "23"
  dateLine: string; // e.g. "Sun, Aug 23 · 10:00 AM"
  location: string;
  going: number;
  hosting?: boolean;
  attending?: boolean;
  /** The event already happened (past events can be rated, not joined). */
  ended?: boolean;
  /** Organizer's display name, when it isn't the current user. */
  hostName?: string;
  /** Optional organizer-supplied audience tags for discovery, never attendance restrictions. */
  audiences?: Occupation[];
}
