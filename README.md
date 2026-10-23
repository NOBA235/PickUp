# PickUp — A Bookmark for Your Brain

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests: 72 Passing](https://img.shields.io/badge/Tests-72%20Passing-brightgreen.svg)](test/)
[![TypeScript: 5.5](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](tsconfig.json)
[![Accessibility: WCAG%20AA%2FAAA](https://img.shields.io/badge/Accessibility-WCAG%20AA%2FAAA-purple.svg)](docs/A11Y_CHECKLIST.md)
[![Privacy: 100%25%20On--Device](https://img.shields.io/badge/Privacy-100%25%20On--Device-success.svg)](docs/DECISIONS.md)

> **Taskforge Hackathon Project**  
> *When an interruption hits, don't lose the thread.*

PickUp is a calm, low-friction, offline-first assistive workflow tool designed for neurodivergent knowledge workers and students with ADHD. It allows users to quickly park their active mental state in under 10 seconds and resume focus effortlessly after an interruption.

---

## 🎯 The Problem & Intended User

- **The Resumption Penalty**: Research shows it takes an average of **23 minutes and 15 seconds** to recover flow after an interruption. For people with ADHD, working memory is volatile—an unexpected interruption can wipe context and lead to hours of task paralysis.
- **Why Existing Tools Fail**: Generic task managers induce anxiety with overdue red alarms, guilt streaks, and complex tagging hierarchies.
- **The Core Loop**:
  1. **Park It (10s)**: Dump messy thoughts via voice or keyboard before switching away.
  2. **Review Cues**: Deterministic extraction of 3 recovery cues: *Where was I?*, *Next 5-minute action*, and *Waiting on*.
  3. **Resume (2 min)**: A calm 2-minute countdown timer with the permission copy: *"Just start for 2 minutes. You can stop after."*
  4. **Hand Off**: Pass a card to a colleague via plain text, Web Share API, or a serverless `#handoff=[base64]` link with zero accounts.

---

## ⚡ Guiding Architectural Principles

- **Zero UI Framework Bloat**: Built purely with Vanilla TypeScript, Vite, and Vanilla CSS design tokens. No React/Vue/Angular overhead—loads in under 50ms.
- **Privacy & Local-First**: 100% on-device `localStorage`. Zero trackers, zero analytics, zero remote telemetry.
- **Calm UI**: Single primary action per screen. No streaks, no red urgency flags, no guilt notifications.
- **Accessible & Screen-Reader Disciplined**: Semantic HTML5 landmarks, visible high-contrast focus rings, 44px min touch targets, and polite `aria-live` announcements that never flood screen readers with countdown tick chatter.
- **100% Offline PWA**: Installable web manifest and service worker with stale-while-revalidate caching.

---

## 🛠️ Tech Stack & Dependencies

```
pickup/
├── api/             # Serverless endpoints (api/polish.ts with 8s timeout & rate limiter)
├── docs/            # Full architectural, accessibility, testing, and Devpost documentation
├── public/          # PWA manifest, service worker (sw.js), icons (SVG & PNG)
├── src/
│   ├── lib/         # Core libraries (cues extraction, timer, stopwatch, speech, handoff, polish)
│   ├── model/       # Domain models (Card, StudyTrial)
│   ├── storage/     # Resilient versioned storage with in-memory fallbacks
│   ├── styles/      # CSS tokens (tokens.css) & accessible reset/components (base.css)
│   └── ui/          # Accessible views (Park, Review, Resume, Handoff, Settings, Study)
└── test/            # 72 Vitest unit tests across 12 test suites
```

- **Runtime Dependencies**: `0` (Zero external runtime dependencies)
- **Dev Dependencies**: `typescript`, `vite`, `vitest`

---

## 🚀 Build, Test & Development Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- `npm` (v9 or higher)

### Setup
```bash
# Clone the repository
git clone https://github.com/NOBA235/PickUp.git
cd PickUp

# Install dev dependencies
npm install
```

### Local Development
```bash
# Start local Vite development server
npm run dev
```
Open your browser to `http://localhost:5173/`.

### Run Automated Unit Tests
```bash
# Execute full Vitest test suite (72 tests)
npm test
```

### Run TypeScript Verification
```bash
# Typecheck entire codebase (including api, src, and test directories)
npm run typecheck
```

### Production Build & Preview
```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Deployment Instructions

### Option 1: Vercel (Recommended)
PickUp is zero-configuration ready for Vercel deployment:
1. Push your repository to GitHub.
2. Import the project into your Vercel Dashboard.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build` (outputs to `dist/`).
5. (Optional) Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API key (enables the optional serverless AI polish endpoint).
6. Click **Deploy**.

### Option 2: Netlify
1. Connect repository in Netlify Dashboard.
2. Build Command: `npm run build`.
3. Publish Directory: `dist`.
4. (Optional) Set `GEMINI_API_KEY` in Netlify Site Environment Variables.

### Option 3: Static Hosting / GitHub Pages
If deploying strictly as a client-side static PWA without serverless functions:
- Deploy the `dist/` directory to GitHub Pages, Cloudflare Pages, or AWS S3.
- The app operates 100% offline using deterministic rule extraction.

---

## 🔬 Evidence & Research Mode (`?study=1`)

PickUp includes a built-in, local-only evidence mode for running small before/after interruption usability studies:
- Navigate to: `http://localhost:5173/?study=1`
- Includes:
  - Researcher-facing stopwatch for tracking task resumption latency.
  - Anonymous participant code input (`P01`, `P02`).
  - Condition toggle (*With PickUp* vs *Without PickUp*).
  - 1-to-5 subjective cognitive disorientation rating.
  - Real-time aggregate statistics.
  - 1-click on-device RFC 4180 CSV export (`pickup_study_results.csv`).

---

## 📜 Documentation Index

| Document | Description |
| :--- | :--- |
| **[docs/DEVPOST.md](docs/DEVPOST.md)** | Full Devpost hackathon submission write-up, demo script, and checklist |
| **[docs/DECISIONS.md](docs/DECISIONS.md)** | Architecture Decision Records (ADRs 0001 through 0010) |
| **[docs/A11Y_CHECKLIST.md](docs/A11Y_CHECKLIST.md)** | Manual keyboard, VoiceOver, NVDA, TalkBack, and Lighthouse audit protocol |
| **[docs/USER_TEST.md](docs/USER_TEST.md)** | User study protocol, verbal informed consent script, and honest reporting guide |
| **[docs/AI_USE.md](docs/AI_USE.md)** | Detailed AI assistance, tool disclosure, and attribution log |
| **[docs/LEARNINGS.md](docs/LEARNINGS.md)** | Technical findings, browser quirks, and user experience retrospectives |
| **[docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md)** | API support, storage limits, and browser platform assumptions |

---

## 📄 License
Released under the [MIT License](LICENSE).
