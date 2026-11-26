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

> Signup, login, account type, discovery preferences, and identity verification now
> call the FastAPI backend. Event listings and event interactions still use sample
> data. Frontend and backend remain separate services.

## API integration setup

From the repository root, configure the backend `.env` privately (database URL,
JWT secret, and a stable Fernet KYC encryption key). Use your existing working
provider connection URL, not a pasted URL missing its database name.

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m src.core.configure_kyc
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn src.main:app --host 127.0.0.1 --port 8000
```

Migration `20261127_0006` adds profile fields, structured KYC details, and private
encrypted document storage in PostgreSQL. New uploads no longer rely on a Vercel
function's filesystem. Legacy local file paths remain readable where files exist.
Database storage grows with uploads; use a private object-storage implementation
when your application's document volume requires it. Never change the KYC key
without a data/key migration; existing ID numbers and documents depend on it.

For the frontend, copy `frontend/.env.example` to `frontend/.env.local`, then run
`npm install` and `npm run dev` from `frontend/`. The local API URL defaults to
`http://127.0.0.1:8000`. Do not put database passwords, JWT secrets, or KYC keys in
frontend `VITE_` variables. Only the bearer token is retained in per-tab session
storage; profiles are reloaded from `/users/me`, and KYC details/images are never
written to browser storage. Tokens expire after the backend's configured lifetime;
users log in again because the API has no refresh-token endpoint.

For separate deployments, apply the migration using a trusted connection to the
hosted database and deploy the backend first. Use the provider's direct/session
connection for migrations where required, and its serverless pooler for the API.
Set backend `CORS_ORIGINS` to a JSON array of exact allowed frontend origins,
including the deployed frontend URL and local origins you use. Configure stable
backend secrets privately in Vercel. Set frontend `VITE_API_BASE_URL` to the
public FastAPI HTTPS URL (`https://bit-bit-project.vercel.app` for the current
backend), then rebuild/redeploy the frontend. A Vite build embeds this value.
Do not deploy only the frontend against the old API contract.

KYC uses a draft -> document uploads -> complete flow. Interrupted uploads stay
incomplete, and users can retry. Card IDs need front/back/selfie; passports need
photo page/selfie. Uploads accept JPEG/PNG (PDF via API) up to 4 MiB each. The
smaller bound leaves room for multipart data within Vercel's default body limit.
Admin review remains API-only; the account type cannot grant admin permissions.
No hosted migrations, environment updates, or deployments are performed by these
local setup commands unless `.env` explicitly points to that hosted database.

Validation: `npm test` and `npm run build` from `frontend/`, plus `python -m pytest
-q -o asyncio_default_fixture_loop_scope=function` from the root. Set
`TEST_DATABASE_URL` to a local asyncpg PostgreSQL URL to include database tests;
they create/drop only random temporary schemas, not application tables. Browser
scripts under `tests/browser/` require Playwright and Chrome, plus a disposable API
at `127.0.0.1:8001` (with CORS allowing `http://127.0.0.1:5175`) and frontend at
`127.0.0.1:5175` pointing to that API. Use only disposable test databases for them.


---

## Features

- **Login / Sign-up** - real email/password authentication, username and profile
  persistence, Host/Joiner selection, and session restoration through FastAPI.
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
git clone https://github.com/HeroVoltsy/BitBitProject.git
cd BitBitProject/frontend

# 2. Install dependencies
npm install

# 3. Configure the API URL in your local env file — see API integration setup above
cp .env.example .env.local

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
- **No third-party trackers or analytics.** Google Fonts and the
  configured FastAPI API domain are explicitly allowed in the CSP.
- **Source maps disabled** in the production build so source is not exposed.
- **Dependencies:** `npm audit` reports **0 vulnerabilities**.

### Authentication

Passwords are sent to the configured FastAPI backend over HTTPS in deployment,
hashed with Argon2 on the server, and never stored by the frontend. The current
API uses bearer JWTs, retained only in per-tab session storage. The server verifies
every protected request; the frontend gate alone grants no permissions. A refresh
loads the real profile, and expired/invalid tokens are cleared. No refresh-token
endpoint or cookie session is implemented. Review rate limiting, account recovery,
and session hardening before a public launch.

## Environment Variables

`VITE_API_BASE_URL` is the public FastAPI URL. Local development defaults to
`http://127.0.0.1:8000`. Database credentials and JWT/KYC secrets belong exclusively
in the backend environment. The Vercel CSP allows the current API domain
`https://bit-bit-project.vercel.app`; if the API domain changes, update both the
frontend environment and the CSP `connect-src` allowlist. The backend CORS list
must separately allow the frontend's exact origin.

## Identity verification

Joiners and Hosts can submit verification from Home or Settings. Names, contact,
permanent/current addresses, organizer information, ID number, and required photos
are sent only when the user confirms and submits. The server encrypts ID numbers
and uploaded document bytes with its stable KYC key. Users see their own status;
only internal admins can download private documents and review submissions.

Select National ID, driver's license, or passport. Card IDs require front/back
images and a selfie; passports require the photo page and selfie. Uploads accept
JPG/PNG up to 4 MiB. Personal details are saved as a draft, documents are uploaded
individually, and the final completion call moves the submission to Under review.
Interrupted uploads remain drafts; retry uses the still-open form. After reload,
select photos again and re-enter the ID number, which is never returned by the API.
Photos and identity fields are never written to browser storage.

Review feedback/status is loaded from the server, including after login/refresh.
Rejected or changes-requested submissions can be updated; approved submissions
cannot be edited. Verification is per user across account-type changes. This
integration includes no admin web page or third-party identity-verification service.

## Joiner signup questions

After creating a Joiner account, the user sees two questions in a separate dialog:
**Which best describes you?** (Student, Teacher, Working professional, Business
owner, Self-employed, Other, or Prefer not to say), then **What are you interested
in?** (one or more existing event categories). Back preserves the previous answer;
Skip for now or Escape continues without saving any partial answers. Hosts and
returning logins do not get the questionnaire. The signup session is created before
the questions, and any pending join/like action resumes once after completion/skip.

Completed answers are saved to the authenticated profile in PostgreSQL and return
after logout/login, reload, and account-type switching. Joiners can edit them under **Settings > Account > Interests
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
