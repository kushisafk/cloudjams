# 🕹️ Cloud Quest — Google Cloud Study Jams

The official synthwave arcade website and registration portal for **Google Cloud Study Jams**, hosted by **GDG on Campus at IARE**.

---

## ✨ What's Inside

### 🎮 1. Retro-Arcade Landing Page (`/`)
- **3D CRT Arcade Cabinet:** Interactive hero monitor that tilts with your cursor and runs a live cloud terminal sequence.
- **Checkpoint Scroll System:** One scroll smoothly glides you from section to section (`01 START` → `07 READY PLAYER ONE`), with a clickable HUD rail on the right.
- **Interactive Scroll Story (`#story`):** Smoothly animates a 3-stage pixel cloud journey (*Explore → Build → Share*) as you scroll through it.

### 🎫 2. Arcade Title Screen Registration (`/register`)
- **Zero-Scroll Layout:** Fits on a single screen like a classic video game main menu.
- **Game Mode Navigation:** Use your mouse or `↑` `↓` + `Enter` to step through:
  - **`▶ NEW GAME`** — Student details (Name, Roll Number like `25951A05F3`, Email, Year & Branch)
  - **`▶ LOADOUT`** — Optional cloud experience & interests
  - **`▶ START JOURNEY.`** — Privacy notice, consent & instant pass generation

### 🛡️ 3. Smart Backend & QR Ticket Pipeline
- **Real Email Verification:** Catches common typos (`@gmial.com`), blocks burner/disposable domains, and checks live **DNS `MX` records** to ensure the email domain can actually receive mail.
- **Duplicate & Spam Protection:** Prevents duplicate registrations at the database level (`@unique`) and rate-limits rapid submissions.
- **In-Memory QR Code Generation:** Generates a secure random token and renders a QR code PNG in memory (no local disk writes—100% serverless-friendly).
- **Gmail API Confirmation Emails:** Sends a themed multipart MIME email via the official Gmail API (`users.messages.send`) with the student's **Player Pass** (`#IARE-XXXX`), inline CID QR code (`cid:studyjams-qr`), downloadable QR PNG attachment (`study-jams-qr-IARE-XXXX.png`), and verification link. If an email ever fails to send, the student's registration is still safely saved and can be retried without creating duplicates.

### 📱 4. Live QR Scan Page (`/testing`)
- Scanning a participant's QR code opens `/testing?ref=...` and displays their **Verified Participant Pass** (Pass ID, Full Name, Roll Number, Branch, Year, and Status) directly from PostgreSQL.

---

## 🛠️ Tech Stack

- **Frontend & SSR:** [TanStack Start](https://tanstack.com/start), React 19, TypeScript, Tailwind CSS v4
- **Server Runtime:** Vite 8 + [Nitro](https://nitro.build/) (configured for Vercel `nodejs22.x`)
- **Database:** PostgreSQL ([Prisma Postgres](https://www.prisma.io/postgres)) + [Prisma ORM](https://www.prisma.io/)
- **Emails & QR:** Official Google Gmail API (`@googleapis/gmail`) + `qrcode`
- **Validation & Tests:** `zod` + [Vitest](https://vitest.dev/)

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/kushisafk/cloudjams.git
cd cloudjams
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory (or copy `.env.example`):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:8080/api/auth/google/callback"
GMAIL_REFRESH_TOKEN="your-gmail-oauth-refresh-token"
GMAIL_SENDER_EMAIL="your-sender-account@gmail.com"
APP_BASE_URL="http://localhost:8080"
```

### 3. One-Time Gmail OAuth Setup (To Obtain `GMAIL_REFRESH_TOKEN`)
1. In [Google Cloud Console](https://console.cloud.google.com/), enable the **Gmail API** for your project.
2. Under **APIs & Services → OAuth consent screen**, configure your app and add the scope `https://www.googleapis.com/auth/gmail.send` (add your sender Gmail account as a Test User if the app is in Testing mode).
3. Under **APIs & Services → Credentials**, create an **OAuth 2.0 Client ID** (Web application) and register the exact Authorized Redirect URI:
   - Local: `http://localhost:8080/api/auth/google/callback`
   - Production (optional): `https://<your-vercel-domain>/api/auth/google/callback`
4. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in your local `.env`, start the dev server (`npm run dev`), and visit **`http://localhost:8080/api/auth/google`** in your browser.
5. Approve the consent prompt. In local development, the callback writes `GMAIL_REFRESH_TOKEN` to a gitignored `.env.oauth.local` file in the project root (never displayed in the browser or logged). Copy `GMAIL_REFRESH_TOKEN` into your local `.env` and Vercel Environment Variables, then delete `.env.oauth.local`.

### 4. Sync Database & Run
```bash
npx prisma db push
npm run dev
```
Open **`http://localhost:8080`** in your browser!

---

## 📂 Project Structure

```text
├── prisma/
│   └── schema.prisma              # PostgreSQL Registration table schema
├── src/
│   ├── components/jams/           # Pixel art sprites, HUD elements & ScrollStory
│   ├── config/event.ts            # Easy-to-edit event details, FAQs & social links
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── qr.server.ts           # QR token & in-memory PNG generator
│   │   ├── gmail-oauth.server.ts  # One-time Google OAuth 2.0 flow & CSRF state check
│   │   ├── email.server.ts        # Gmail API MIME builder & confirmation email sender
│   │   └── registration.server.ts # Validation, DNS MX check & DB logic
│   └── routes/
│       ├── index.tsx              # Main landing page
│       ├── register.tsx           # Arcade home screen registration
│       └── testing.tsx            # QR code scan verification page
└── vite.config.ts                 # Vite + TanStack Start + Vercel config
```

---

## ☁️ Deploying to Vercel

1. Push your code to GitHub.
2. Import the repo in **[Vercel](https://vercel.com/new)** (keep Preset as **TanStack Start**).
3. Under **Build and Output Settings**, set Install Command to `npm install`.
4. Add your environment variables (`DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER_EMAIL`, and optionally `APP_BASE_URL`).
5. Click **Deploy** — Vercel will automatically use your live domain for all QR codes!

---

## ⚙️ Useful Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start local dev server at `http://localhost:8080` |
| `npm run build` | Build production bundle for Vercel |
| `npm test` | Run automated backend, MIME, OAuth & QR tests |
| `npx prisma studio` | Open visual database viewer in your browser |
