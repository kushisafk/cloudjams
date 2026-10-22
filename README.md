# Cloud Quest — Google Cloud Study Jams · GDG on Campus IARE

An interactive synthwave / retro-arcade event platform and registration system built for **Google Cloud Study Jams**, hosted by **GDG on Campus at Institute of Aeronautical Engineering (IARE)**.

The platform combines an art-directed arcade landing experience with a full-stack serverless registration pipeline: real-time DNS `MX` email verification, PostgreSQL persistence via Prisma, cryptographic QR pass generation in memory, transactional confirmation emails with inline QR tickets via Resend, and live QR scan verification.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Tech Stack](#tech-stack)
3. [System Architecture & Registration Flow](#system-architecture--registration-flow)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Environment Variables](#environment-variables)
7. [Local Development Setup](#local-development-setup)
8. [Testing](#testing)
9. [Deploying to Vercel](#deploying-to-vercel)
10. [Customizing Event Content](#customizing-event-content)

---

## Key Features

### 1. Arcade Landing Experience (`/`)
- **Interactive 3D CRT Cabinet Hero:** Pointer-reactive 3D perspective arcade monitor with animated synthwave horizon, orbiting nodes, pixel cloud assembly, and live scrolling terminal log.
- **Hybrid Web Checkpoint Navigation (`useCheckpointScroll`):**
  - Single wheel/trackpad gestures or keyboard arrows (`↑` / `↓` / `PageUp` / `PageDown`) smoothly transition between full-screen section checkpoints (`01 START` → `02 STORY` → `03 MISSIONS` → `04 EVENT INFO` → `05 CHECKPOINTS` → `06 FAQ` → `07 READY PLAYER ONE`).
  - **Continuous Pinned Story Stage (`#story`):** Automatically switches to smooth lerped scrolling inside the 3-stage interactive narrative (*Stage 01: Explore*, *Stage 02: Build*, *Stage 03: Share*) so the live HUD progress bar (`000%`–`100%`) and pixel cloud assembly animate naturally before advancing to the next checkpoint.
- **Interactive Checkpoint Rail:** Fixed right-hand HUD rail showing the active section and allowing one-click jumps to any checkpoint.

### 2. Zero-Scroll Arcade Title Menu Registration (`/register`)
- **Arcade Game Home Screen UX:** Designed like a classic console title screen that fits inside a single locked viewport (`100vh`) with zero vertical scrolling.
- **Keyboard & Mouse Mode Selector:** Navigate with `↑` / `↓` + `Enter` or mouse hover across:
  - **`▶ NEW GAME` (Step 1 — Student Information):** Full Name, Roll Number (auto-uppercased, e.g. `25951A05F3`), Email Address, College Name, Year of Study (`1st`–`4th Year`), Branch/Department (with quick-select chips), and optional Phone Number.
  - **`▶ LOADOUT` (Step 2 — Learning Profile):** Optional questions covering prior Google Cloud usage (`Yes`/`No`), experience level (`Beginner`, `Some experience`, `Experienced`), and cloud computing interests.
  - **`▶ START JOURNEY.` (Step 3 — Confirmation & Launch):** Compact player summary, privacy notice, communication consent, and submission trigger.
  - **`▶ EXIT TO LOBBY`:** Returns to the main landing page.

### 3. Multi-Layer Email & Input Validation
- **Schema & Length Validation (`zod`):** Enforces strict field lengths, allowed enum values, and alphanumeric roll number formatting on both client and server.
- **3-Stage Real Email Verification:**
  1. **Common Typo Detection:** Detects mistyped domains (`@gmial.com`, `@gamil.com`, `@gmail.con`, `@outlok.com`, `@yaho.com`) and prompts the student with `"Did you mean @gmail.com?"`.
  2. **Disposable / Burner Domain Blocking:** Rejects throwaway email providers (`mailinator.com`, `yopmail.com`, `tempmail.com`, `10minutemail.com`, `guerrillamail.com`, `trashmail.com`, etc.).
  3. **Live DNS `MX` Verification (`node:dns/promises`):** Queries the email domain's DNS `MX` records on the server to confirm the domain exists and has active mail servers capable of receiving email.

### 4. Serverless QR Code Generation & `/testing` Pass Verification
- **Cryptographic QR Tokens:** Each registration receives a unique 192-bit URL-safe token (`crypto.randomBytes(24).toString("base64url")`) rather than sequential IDs or raw emails.
- **In-Memory PNG Generation:** Renders the QR code (`${APP_BASE_URL}/testing?ref=${qrToken}`) into a PNG `Buffer` in memory via `qrcode`—requiring zero local filesystem writes for serverless compatibility.
- **Live Participant Pass Page (`/testing?ref=...`):** Scanning a participant's QR code queries PostgreSQL on the server and displays their **Verified Participant Pass**:
  - Pass ID (`#IARE-XXXX`) & Registration Status (`● REGISTERED`)
  - Full Name & Roll Number (`25951A05F3`)
  - Email, College, Branch & Year
  - Cloud Track & Registration Date
  - Displays `✕ PASS NOT FOUND` if an unrecognized or invalid token is scanned.

### 5. Fault-Tolerant Resend Email Delivery & Idempotency
- **Branded HTML + Plain-Text Emails:** Sends a dark synthwave-styled HTML confirmation email (plus plain-text fallback) containing the participant's Player Pass table, inline QR code image (`cid:studyjams-qr`), downloadable PNG attachment (`study-jams-qr-IARE-XXXX.png`), and direct verification link.
- **Decoupled Persistence & Safe Retries:**
  - Database writes and email delivery are intentionally decoupled so a transient email failure never deletes or rolls back a student's registration.
  - If Resend fails, the registration is preserved with `emailStatus = "FAILED"` and `emailError` recorded for troubleshooting.
  - Retrying with the same email reuses the existing registration and `qrToken` without creating duplicates, using Resend's `idempotencyKey` (`studyjams-reg-${id}-attempt-${n}`) and a per-registration retry cooldown.
  - Once `emailStatus === "SENT"`, subsequent submissions with the same email are rejected with `409 Conflict` (`DUPLICATE_EMAIL`).

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [TanStack Start](https://tanstack.com/start) (`@tanstack/react-start`) + [TanStack Router](https://tanstack.com/router) |
| **UI & Styling** | React 19, TypeScript 5.8, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide Icons |
| **Server Runtime & Bundler** | Vite 8 + [Nitro](https://nitro.build/) (`vercel` preset targeting `nodejs22.x`) |
| **Database & ORM** | PostgreSQL ([Prisma Postgres](https://www.prisma.io/postgres)) + [Prisma ORM](https://www.prisma.io/) (`v6.19.3`) |
| **Email Service** | [Resend](https://resend.com/) Node.js SDK (`resend`) |
| **QR Code Engine** | `qrcode` (in-memory PNG buffer generation) + Node `node:crypto` |
| **Validation & Testing** | `zod` + [Vitest](https://vitest.dev/) |

---

## System Architecture & Registration Flow

```mermaid
flowchart TD
    A["Student Submits /register Form"] --> B["Server Fn: submitRegistration / POST /api/register"]
    B --> C{"Rate Limit & Zod Schema Valid?"}
    C -- "No" --> D["Return 400 / 429 with Field Errors"]
    C -- "Yes" --> E{"Typo, Disposable & DNS MX Check"}
    E -- "Invalid Domain" --> D
    E -- "Valid MX Server" --> F{"Existing Email in PostgreSQL?"}
    F -- "Yes (emailStatus = SENT)" --> G["Return 409 Conflict (DUPLICATE_EMAIL)"]
    F -- "Yes (emailStatus = FAILED/PENDING)" --> H["Reuse Existing Registration & qrToken"]
    F -- "No" --> I["Generate #IARE-XXXX Pass ID + 192-bit qrToken"]
    I --> J["Insert Registration in PostgreSQL (emailStatus = PENDING)"]
    H --> K["Generate QR PNG Buffer in Memory (/testing?ref=qrToken)"]
    J --> K
    K --> L["Send Confirmation Email via Resend (with Idempotency-Key)"]
    L -- "Success" --> M["Update emailStatus = SENT & Return 201 + Pass ID"]
    L -- "Failure" --> N["Keep Registration, Update emailStatus = FAILED & Allow Retry"]
```

---

## Project Structure

```text
pixel-jam-quest/
├── prisma/
│   └── schema.prisma              # PostgreSQL schema (Registration model & enums)
├── public/
│   └── logo.png                   # Neon GDG on Campus IARE logo
├── src/
│   ├── components/
│   │   └── jams/
│   │       ├── Pixel.tsx          # PixelCloud, GlowMark, PixelRunner, Hud, Panel, Reveal
│   │       └── ScrollStory.tsx    # 3-stage interactive scroll narrative (#story)
│   ├── config/
│   │   └── event.ts               # Editable event metadata, tracks, steps, FAQs, social links
│   ├── lib/
│   │   ├── prisma.ts              # Server-only PrismaClient singleton
│   │   ├── qr.server.ts           # Cryptographic qrToken & in-memory QR PNG generator
│   │   ├── email.server.ts        # Branded Resend HTML/text email builder & sender
│   │   └── registration.server.ts # Validation, DNS MX check, rate limit, DB & QR lookup
│   ├── routes/
│   │   ├── __root.tsx             # Root HTML shell, fonts & metadata
│   │   ├── index.tsx              # Main landing page with Web Checkpoint scroll system
│   │   ├── register.tsx           # Single-screen Arcade Home Menu registration page
│   │   └── testing.tsx            # Live QR scan verification & Participant Pass display
│   ├── test/
│   │   └── registration.test.ts   # End-to-end integration tests for registration & QR flow
│   ├── router.tsx                 # TanStack Router configuration
│   ├── server.ts                  # SSR entry & POST /api/register HTTP handler
│   ├── start.ts                   # TanStack Start CSRF & error middleware
│   └── styles.css                 # Tailwind v4 theme, synthwave utilities & animations
├── .env.example                   # Safe template for required environment variables
├── package.json                   # Scripts & dependencies (includes postinstall prisma generate)
└── vite.config.ts                 # Vite + TanStack Start + Nitro Vercel configuration
```

---

## Database Schema

Defined in [`prisma/schema.prisma`](file:///e:/Projects/pixel-jam-quest/prisma/schema.prisma):

| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id @default(cuid())` | Internal primary key |
| `playerCode` | `String` | `@unique` | Human-readable pass ID (e.g. `IARE-4821`) |
| `qrToken` | `String` | `@unique` | 32-char cryptographic token encoded in QR URL |
| `fullName` | `String` | Required | Participant's full name |
| `rollNumber` | `String` | `@default("")` | Uppercased college roll number (e.g. `25951A05F3`) |
| `collegeEmail` | `String` | `@unique` | Normalized lowercase email address |
| `collegeName` | `String` | Required | College / institution name |
| `yearOfStudy` | `String` | Required | `1st Year` – `4th Year` |
| `branch` | `String` | Required | Department / branch (e.g. `CSE`, `IT`, `ECE`) |
| `phone` | `String?` | Optional | Optional phone number for WhatsApp reminders |
| `usedGcp` | `String?` | Optional | `"yes"` / `"no"` |
| `experienceLevel` | `String?` | Optional | `"beginner"` / `"some"` / `"experienced"` |
| `cloudInterest` | `String?` | Optional | Optional note on cloud computing interests |
| `consent` | `Boolean` | `@default(false)` | Consent to receive event communications |
| `status` | `RegistrationStatus` | `@default(REGISTERED)` | `REGISTERED` \| `CANCELLED` |
| `emailStatus` | `EmailDeliveryStatus` | `@default(PENDING)` | `PENDING` \| `SENT` \| `FAILED` |
| `emailSentAt` | `DateTime?` | Optional | Timestamp when confirmation email was accepted |
| `emailMessageId` | `String?` | Optional | Resend message ID |
| `emailError` | `String?` | Optional | Last delivery error (for admin troubleshooting) |
| `emailAttempts` | `Int` | `@default(0)` | Total email delivery attempts |
| `lastEmailAttemptAt` | `DateTime?` | Optional | Timestamp of most recent email attempt |
| `createdAt` | `DateTime` | `@default(now())` | Registration creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Last update timestamp |

---

## Environment Variables

Copy [`.env.example`](file:///e:/Projects/pixel-jam-quest/.env.example) to `.env` in the project root:

```env
# PostgreSQL connection string (Prisma Postgres pooled or direct URL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

# Resend API secret key (server-only — https://resend.com/api-keys)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxx"

# Verified sender address configured in Resend
# Note: "onboarding@resend.dev" only delivers to your own Resend account email.
# Verify your domain in Resend to send to any participant's email address.
EMAIL_FROM="GDG on Campus IARE <onboarding@resend.dev>"

# Public base URL used for QR code links (optional on Vercel — auto-detects VERCEL_PROJECT_PRODUCTION_URL)
APP_BASE_URL="http://localhost:8080"
```

---

## Local Development Setup

### Prerequisites
- **Node.js** `>= 22.12.0` and `npm`
- A **PostgreSQL** database (e.g. [Prisma Postgres](https://console.prisma.io/))
- A **[Resend](https://resend.com/)** API key

### Step-by-Step

```bash
# 1. Clone the repository
git clone https://github.com/kushisafk/cloudjams.git
cd cloudjams

# 2. Install dependencies (automatically runs `prisma generate` via postinstall)
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL and RESEND_API_KEY

# 4. Push the Prisma schema to your PostgreSQL database
npx prisma db push

# 5. Start the development server (http://localhost:8080)
npm run dev
```

---

## Testing

Run the integration test suite and TypeScript compiler checks:

```bash
# Run Vitest integration suite (tests QR generation, email builder, validation, DB persistence & duplicate blocking)
npm test

# Run TypeScript type checking
npx tsc --noEmit
```

---

## Deploying to Vercel

The project is pre-configured to build for Vercel's Node.js Serverless runtime (`nodejs22.x`) using Nitro's `vercel` preset in [`vite.config.ts`](file:///e:/Projects/pixel-jam-quest/vite.config.ts) and Prisma's `rhel-openssl-3.0.x` binary target in [`prisma/schema.prisma`](file:///e:/Projects/pixel-jam-quest/prisma/schema.prisma).

1. Push your repository to GitHub.
2. Go to [Vercel → New Project](https://vercel.com/new) and import the repository.
3. Keep **Application Preset** as `TanStack Start` and **Root Directory** as `./`.
4. Under **Build and Output Settings**, set **Install Command** to `npm install` and **Build Command** to `npm run build`.
5. Under **Environment Variables**, add:
   - `DATABASE_URL`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `APP_BASE_URL` *(optional — automatically falls back to `VERCEL_PROJECT_PRODUCTION_URL`)*
6. Click **Create Project / Deploy**.

---

## Customizing Event Content

All event copy, tracks, checkpoints, FAQs, social links, and registration open/closed status are centralized in [`src/config/event.ts`](file:///e:/Projects/pixel-jam-quest/src/config/event.ts):

- `REGISTRATION_OPEN`: Set to `true` or `false` to toggle live registration across `/register` and the backend.
- `EVENT`: Update `date`, `venue`, and `deadline` once confirmed by organizers (confirmed values automatically appear in confirmation emails).
- `TRACKS`, `STEPS`, `FAQS`, `SOCIALS`: Edit arrays directly to update the landing page sections.
