# Sali Ka — Community Events Web App

**Sali Ka** ("come along / join in") is a community events discovery web app. Browse
what's happening around your neighborhood, RSVP, host your own events, and check
members in with a membership QR — all from a clean, Apple-inspired desktop
interface.

This project is a **front-end web adaptation** of a mobile app UI design. The
original nine mobile screens have been re-composed into a responsive desktop web
app with a hovering, glassmorphic navigation bar and multi-column layouts, while
keeping the same two-tone warm palette (cream surfaces + emerald green accent) and
Nunito typography.

> Front-end demo only — it runs entirely in the browser on local sample data.
> There is no backend, no authentication, and no external API calls.

---

## Features

- **Login / Sign-up gate** — a login and account-creation screen shown first, with
  client-side validation, show/hide password, and a "continue as guest" option. The
  signed-in name flows into the greeting, avatar, and settings. See the security note
  below — this is a demo gate, not real authentication.
- **Home feed** — greeting header, live category filtering (All / Market / Music /
  Sports / Volunteer), a hosted-event banner, and a responsive grid of event cards.
- **Schedule** — an interactive August 2026 month calendar with event markers and a
  day-by-day agenda.
- **Explore** — a stylized map with event pins and a synced list of nearby events.
- **Post an Event** — a validated create-event form with category picker, promote
  toggle, and a success state.
- **Event detail** — cover, date/location info card, social proof, description, and
  an RSVP action.
- **Profile** — identity card, membership QR, attendee/organizer segmented view, and
  quick links to organizer tools.
- **Organizer tools** — QR check-in scanner (animated) and a full attendance roster
  with live counts.
- **Settings** — grouped account, notification, preference, and support rows with
  working toggles.
- **Responsive** — adapts from wide desktop down to mobile, with a collapsing menu.
- **Accessible** — semantic markup, ARIA roles/labels, visible focus states, and
  `prefers-reduced-motion` support.

## Tech Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | [React 18](https://react.dev)                      |
| Language   | [TypeScript](https://www.typescriptlang.org) (strict) |
| Build tool | [Vite](https://vite.dev)                           |
| Icons      | [lucide-react](https://lucide.dev) (line SVG icons)|
| Styling    | Plain CSS with design tokens (CSS custom properties)|
| Font       | [Nunito](https://fonts.google.com/specimen/Nunito) |
| Hosting    | [Vercel](https://vercel.com) (static, free Hobby tier) |

No CSS framework, no runtime UI library — the styling is a small, self-contained
design system so the bundle stays lean (~54 KB gzipped JS).

## Getting Started

### Prerequisites

- **Node.js 20+** and **npm** (check with `node -v` and `npm -v`)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/gbzor/mock-sali-ka.git
cd mock-sali-ka

# 2. Install dependencies
npm install

# 3. (Optional) create your local env file — not required to run the demo
cp .env.example .env

# 4. Start the dev server
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

### Available Scripts

| Command           | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with hot reload           |
| `npm run build`   | Type-check (`tsc --noEmit`) then build to `dist/`   |
| `npm run preview` | Serve the production build locally                  |
| `npm run lint`    | Type-check only                                     |

## Usage Guide

- Use the **top navigation bar** to move between Home, Schedule, Explore, and Profile.
- On **Home**, click a category pill to filter, or type in the search box to filter
  by title/location. Click any event card to open its detail page.
- Click **Post an Event** (top right) to open the create-event form.
- On **Profile**, open **Check-in Scanner** or **Attendance** to see the organizer
  tools, and **Settings** for account preferences.

## Project Structure

```
mock-sali-ka/
├── public/
│   └── favicon.svg              # App icon
├── src/
│   ├── components/              # Reusable UI pieces
│   │   ├── TopNav.tsx           # Sticky glassmorphic navigation bar
│   │   ├── EventCard.tsx        # Feed event card
│   │   ├── CategoryBadge.tsx    # Colored category tag
│   │   ├── ScheduleItem.tsx     # Title + meta list row
│   │   ├── StripePlaceholder.tsx# "event photo" cover placeholder
│   │   └── Avatar.tsx           # Initials avatar + overlapping group
│   ├── screens/                 # One file per page
│   │   ├── HomeScreen.tsx
│   │   ├── CalendarScreen.tsx
│   │   ├── MapScreen.tsx
│   │   ├── CreateEventScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── EventDetailScreen.tsx
│   │   ├── QrScannerScreen.tsx
│   │   ├── AttendanceScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── data/
│   │   └── events.ts            # Sample data (events, attendees, user)
│   ├── styles/
│   │   ├── tokens.css           # Design tokens (colors, radii, shadows)
│   │   ├── global.css           # Reset, layout, shared primitives
│   │   └── app.css              # Component & screen styles
│   ├── types.ts                 # Shared TypeScript types
│   ├── App.tsx                  # Screen router (state-based navigation)
│   └── main.tsx                 # Entry point
├── .env.example                 # Safe placeholder env variables
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vercel.json                  # Static build config + security headers
└── vite.config.ts
```

## Deployment (Vercel — free)

This is a purely static site, so it deploys on Vercel's **free Hobby tier** with no
server functions and therefore no runtime compute cost.

1. Push the repo to GitHub.
2. In Vercel, **Add New → Project** and import the repository.
3. Vercel auto-detects Vite. Defaults are correct:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**.

`vercel.json` already sets the framework, SPA rewrites, and security headers.

## Security Notes

Security was treated as a requirement, not an afterthought:

- **No secrets in the codebase.** The app needs none to run. `.env` files are
  git-ignored; only `.env.example` (safe placeholders) is committed. Remember: any
  Vite variable prefixed with `VITE_` is shipped to the browser and is therefore
  **public** — never put private/server secrets there.
- **No injection surface.** No `dangerouslySetInnerHTML`, no `eval`, no direct DOM
  HTML writes. All rendered text is React-escaped sample data.
- **Security headers** (set in `vercel.json`): a strict `Content-Security-Policy`,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` /
  `frame-ancestors 'none'` (clickjacking protection), `Referrer-Policy`,
  a locked-down `Permissions-Policy` (camera/mic/geolocation disabled), and HSTS.
- **No third-party trackers or analytics.** The only external origin is Google Fonts
  (stylesheet + font files), which is explicitly allowed in the CSP.
- **Source maps disabled** in the production build so source is not exposed.
- **Dependencies:** `npm audit` reports **0 vulnerabilities**.

### Authentication (demo gate)

The login / sign-up screen is a **front-end UX gate only — not real
authentication**, because this app has no backend:

- **No password is ever stored, transmitted, or persisted.** On submit, the app
  validates format (valid email, 8+ char password, matching confirmation) and then
  discards the password entirely.
- Only a **non-sensitive session marker** (display name + email) is kept in
  `sessionStorage`, which is per-tab and cleared when the tab closes.
- The gate does **not** protect any data — all content is public sample data.

To make this production-grade authentication, add a backend and:
- hash passwords server-side (e.g. bcrypt/argon2) — never store or compare plaintext;
- serve everything over HTTPS and issue sessions via `httpOnly`, `Secure`,
  `SameSite` cookies (not `localStorage`/`sessionStorage`);
- add rate limiting / lockout on login, and validate all input server-side;
- keep all credentials and API keys on the server, never in client or `VITE_` vars.

If you extend this into a full-stack app, keep all authentication, database
credentials, and private API keys on the server side — never in client code or
`VITE_`-prefixed variables.

## Environment Variables

The demo requires **no** environment variables. The placeholders in `.env.example`
exist only for when you wire the UI to a real backend:

| Variable              | Description                                    | Example                       |
| --------------------- | ---------------------------------------------- | ----------------------------- |
| `VITE_API_BASE_URL`   | Base URL of your public events API             | `https://api.example.com`     |
| `VITE_MAP_PUBLIC_KEY` | Public, domain-restricted map/geocoding key    | `your_public_map_key_here`    |

## License

Released under the [MIT License](./LICENSE).

## Identity verification prototype

Joiners and Hosts can open **Identity verification** from Home/the Host Dashboard
or Settings. The three steps cover personal details (including residential address), identity
documents, and a review screen. Contact number appears between Name and Address. Permanent and current addresses
use full-width street fields, a barangay field, then paired city/region and
postal-code/country fields. Country defaults to Philippines. A same-as-permanent
option uses the latest permanent address without overwriting a separate current
address draft. First and last names are
required; middle name and additional address details are optional. Card IDs require
front and back photos plus a selfie; passports require their photo page and a selfie. Hosts also enter organizer details
and confirm authorization. The form has no built-in example data, autofill
buttons, sample images, or simulated review controls.

This is a frontend prototype: no upload, camera, network request, or identity check
is performed. Use test data while developing. Images are previewed with local
object URLs, revoked when the preview unmounts. Details and images are dropped on
completion, cancel/navigation, or reload. Only a per-role progress marker is stored
in this tab's session; logout removes it. No badge or real permissions are granted.
The acknowledgement and completion screen explain that nothing has been submitted.
Older saved review previews can be cleared with **Start again**.

Run `npm run test:kyc` for validation and per-role status checks, and
`npm run build` for the type-check and production build.

### Manual walkthrough

1. Sign up as a Joiner and choose **Get started** on Home.
2. Try Continue with empty fields, then enter personal and address details on
   the same step and proceed.
3. Select the document type. Add both card sides (or
   the passport photo page) and a selfie. Check that unsupported and
   oversized images are rejected and valid images display correctly.
4. Review all names, address fields, and document previews. Use Edit to check
   that each section returns to its step. Check the acknowledgement and choose **Finish**.
   The status reads **Ready to submit** because nothing has been sent.
5. Reload: only the progress marker remains. Choose **Start again** to retry.
6. Switch to Host in Settings. Its progress is separate, and organizer details
   and authorization are required on the first step.
7. Check narrow-screen and dark-mode layouts. Cancel and reopen the form to
   confirm that details and images are cleared. Log out to clear progress.

Production verification will need authenticated submission, private document
storage, access-controlled review, a retention policy, and server-issued status.
Never use the local prototype status for authorization.

## Joiner signup questions

After creating a Joiner account, the user sees two questions in a separate dialog:
**Which best describes you?** (Student, Teacher, Working professional, Business
owner, Self-employed, Other, or Prefer not to say), then **What are you interested
in?** (one or more existing event categories). Back preserves the previous answer;
Skip for now or Escape continues without saving any partial answers. Hosts and
returning logins do not get the questionnaire. The signup session is created before
the questions, and any pending join/like action resumes once after completion/skip.

Answers live in the current tab's session marker, survive reload/role switching,
and clear on logout. Joiners can edit them under **Settings > Account > Interests
& recommendations**. Cancel there discards draft changes.

Home keeps its existing single feed and filters. Completed answers change its
heading to **Recommended for you** and sort matching interests first (+10), with
organizer-provided audience tags as a smaller secondary signal (+2). Ties preserve
catalog order. The sample catalog includes sample audience tags; they are discovery
hints, not attendance restrictions. Prefer not to say disables the occupational
signal. No activity tracking, location preference, separate recommendation panel,
GPS, or KYC information is used. The existing event catalog is still sample data.

Run `npm run test:discovery` for onboarding eligibility, answer normalization,
and ranking tests; `npm test` also runs the existing KYC tests.

Manual check: create a Joiner account, choose Student/Teacher and interests, use
Back, finish, and check feed ordering. Try Skip and Escape, a Host signup, and a
normal login. Start signup via a saved/joined event action and confirm it runs only
once after the questions. Edit/cancel answers in Settings, reload, and log out.
