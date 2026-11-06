export type Category =
  | "Market"
  | "Music"
  | "Sports"
  | "Volunteer"
  | "Fun Run"
  | "Concert"
  | "Pop-Up";

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
export type ProfileTab = "organizer" | "attendee" | "liked";

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
}
