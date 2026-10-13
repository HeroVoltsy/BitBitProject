import type { Category, EventItem } from "../types";

export const CATEGORIES: Category[] = [
  "Market",
  "Music",
  "Sports",
  "Volunteer",
  "Fun Run",
  "Concert",
  "Pop-Up",
];

/** Feed shown on the Home screen ("Events Around You"). */
export const FEED_EVENTS: EventItem[] = [
  {
    id: "naga-sunday-market",
    title: "Naga Sunday Market",
    category: "Market",
    monthLabel: "AUG",
    day: "23",
    dateLine: "Sun, Aug 23 · 10:00 AM",
    location: "Plaza Rizal, Naga City",
    going: 12,
    hosting: true,
  },
  {
    id: "acoustic-avenue",
    title: "Acoustic Nights at the Avenue",
    category: "Music",
    monthLabel: "AUG",
    day: "25",
    dateLine: "Tue, Aug 25 · 6:30 PM",
    location: "Avenue Square, Magsaysay Ave",
    going: 45,
    attending: true,
  },
  {
    id: "naga-river-cleanup",
    title: "Naga River Clean-up Drive",
    category: "Volunteer",
    monthLabel: "AUG",
    day: "29",
    dateLine: "Sat, Aug 29 · 8:00 AM",
    location: "Naga River Esplanade",
    going: 8,
    attending: true,
  },
  {
    id: "frisbee-friendly",
    title: "Weekend Frisbee Friendly",
    category: "Sports",
    monthLabel: "SEP",
    day: "02",
    dateLine: "Wed, Sep 02 · 5:00 PM",
    location: "Metro Naga Sports Complex",
    going: 19,
  },
  {
    id: "naga-fun-run",
    title: "Naga City Fun Run 2026",
    category: "Fun Run",
    monthLabel: "SEP",
    day: "27",
    dateLine: "Sun, Sep 27 · 5:00 AM",
    location: "Plaza Rizal, Naga City",
    going: 230,
  },
  {
    id: "penafrancia-concert",
    title: "Peñafrancia Grand Concert",
    category: "Concert",
    monthLabel: "SEP",
    day: "19",
    dateLine: "Sat, Sep 19 · 7:00 PM",
    location: "Plaza Quezon, Naga City",
    going: 540,
  },
  {
    id: "centro-popup",
    title: "Centro Pop-Up Bazaar",
    category: "Pop-Up",
    monthLabel: "SEP",
    day: "12",
    dateLine: "Sat, Sep 12 · 3:00 PM",
    location: "Magsaysay Ave, Naga City",
    going: 96,
  },
];

/** Schedule entries used on the Calendar screen. */
export const SCHEDULE = [
  {
    date: "August 23",
    items: [
      {
        title: "Naga Sunday Market",
        time: "10:00 AM - 2:00 PM",
        location: "Plaza Rizal, Naga City",
      },
      {
        title: "Sunset Yoga at the Plaza",
        time: "5:30 PM - 6:30 PM",
        location: "Plaza Quezon, Naga City",
      },
    ],
  },
];

export type EventStatus = "Ongoing" | "Upcoming" | "Finished";

export interface CalendarEvent {
  title: string;
  time: string;
  location: string;
  category: Category;
  status: EventStatus;
}

/**
 * Events keyed by date ("YEAR-MONTHINDEX-DAY", month is 0-indexed).
 * Clicking a day in the calendar shows that day's events.
 */
export const CALENDAR_EVENTS: Record<string, CalendarEvent[]> = {
  "2026-7-23": [
    {
      title: "Naga Sunday Market",
      time: "10:00 AM - 2:00 PM",
      location: "Plaza Rizal, Naga City",
      category: "Market",
      status: "Ongoing",
    },
    {
      title: "Sunset Yoga at the Plaza",
      time: "5:30 PM - 6:30 PM",
      location: "Plaza Quezon, Naga City",
      category: "Sports",
      status: "Upcoming",
    },
  ],
  "2026-7-25": [
    {
      title: "Acoustic Nights at the Avenue",
      time: "6:30 PM - 9:00 PM",
      location: "Avenue Square, Magsaysay Ave",
      category: "Music",
      status: "Upcoming",
    },
  ],
  "2026-7-29": [
    {
      title: "Naga River Clean-up Drive",
      time: "8:00 AM - 11:00 AM",
      location: "Naga River Esplanade",
      category: "Volunteer",
      status: "Finished",
    },
  ],
  "2026-8-2": [
    {
      title: "Weekend Frisbee Friendly",
      time: "5:00 PM - 7:00 PM",
      location: "Metro Naga Sports Complex",
      category: "Sports",
      status: "Upcoming",
    },
  ],
};

/** Events the current user is attending (Profile screen). */
export const GOING_LIST = [
  {
    title: "Acoustic Nights at the Avenue",
    meta: "Aug 25 · 6:30 PM",
    location: "Avenue Square, Magsaysay Ave",
  },
  {
    title: "Naga River Clean-up Drive",
    meta: "Aug 29 · 8:00 AM",
    location: "Naga River Esplanade",
  },
];

/** Map bottom-sheet mini cards. */
export const MAP_CARDS = [
  { title: "Naga Sunday Market", location: "Plaza Rizal, Naga City", category: "Market" as Category },
  { title: "Acoustic Nights", location: "Magsaysay Ave", category: "Music" as Category },
  { title: "Frisbee Friendly", location: "Metro Naga Sports Complex", category: "Sports" as Category },
];

/** Recent scans on the QR check-in screen. */
export const RECENT_CHECKINS = [
  { id: "CMN-29402", ago: "2 min ago" },
  { id: "CMN-08341", ago: "10 min ago" },
  { id: "CMN-77321", ago: "24 min ago" },
];

/** Attendance roster. */
export const ATTENDEES = [
  { name: "Maria Santos", id: "CMN-29402", status: "IN" as const },
  { name: "Jose dela Cruz", id: "CMN-08341", status: "IN" as const },
  { name: "Andrea Reyes", id: "CMN-77321", status: "IN" as const },
  { name: "Paolo Mendoza", id: "CMN-49018", status: "IN" as const },
  { name: "Kristine Bautista", id: "CMN-88102", status: "IN" as const },
  { name: "Miguel Torres", id: "CMN-31045", status: "PENDING" as const },
  { name: "Angela Villanueva", id: "CMN-99120", status: "PENDING" as const },
  { name: "Carlo Aquino", id: "CMN-10492", status: "PENDING" as const },
];

export const USER = {
  name: "Kyle Sta. Rosa",
  firstName: "Kyle",
  email: "kyle.starosa@community.com",
  memberSince: "Member since Mar 2024",
  initials: "KR",
  membershipId: "CMN-40217",
};

/** Public reputation stats for the current user (and host profile). */
export const HOST_STATS = {
  hosted: 24,
  followers: 312,
  rating: 4.8,
  reviews: 57,
};

/** Ratings the current user has earned on the events they hosted. */
export const HOSTED_RATINGS = [
  { title: "Naga Sunday Market", date: "Aug 23, 2026", rating: 4.9, reviews: 21 },
  { title: "Kinalas Food Crawl", date: "Jun 28, 2026", rating: 4.8, reviews: 34 },
  { title: "Barangay Fun Run", date: "May 12, 2026", rating: 4.7, reviews: 15 },
];
