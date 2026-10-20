# PickUp — A Bookmark for Your Brain

> **Taskforge Hackathon 2026 Project**  
> *When an interruption hits, don't lose the thread.*

PickUp helps people with ADHD, brain fog, caregivers, and interrupted knowledge workers quickly park their current mental state in under 10 seconds and effortlessly resume later with zero friction.

---

## 🎯 The Problem & Intended User
- **Problem**: When interrupted, getting back into the flow can cost 20+ minutes of context switching, disorientation, and cognitive paralysis.
- **Intended User**: A university student with ADHD who gets derailed every time a housemate or notification interrupts her study sessions.
- **The Core Loop**:
  1. **Park It**: 10-second capture via voice or text.
  2. **PickUp Card**: Three clear cues: *Where I was* / *Next 5-minute action* / *Waiting on*.
  3. **Resume Screen**: A calm 2-minute warm-up countdown to ease back into focus.
  4. **Hand Off** *(Optional)*: Clean summary export to pass context to a teammate or study partner.

---

## ⚡ Guiding Principles
- **Instant Access**: Zero login, zero onboarding friction, runs immediately in any browser.
- **Privacy First**: 100% on-device local storage. No trackers, no telemetry, no remote databases.
- **Calm UI**: No streaks, no red urgency flags, no guilt notifications. One primary action per screen.
- **Accessible & Resilient**: Semantic HTML, visible high-contrast focus rings, 44px min touch targets, screen-reader announcements, and graceful offline fallback.

---

## 🛠️ Tech Stack
- **Frontend**: Vanilla TypeScript + Vite (no heavyweight UI frameworks)
- **Styling**: Modern Vanilla CSS with CSS Custom Properties and design tokens
- **Testing**: Vitest
- **Deployment**: Static deployment (Vercel / Netlify)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit tests
npm test

# Run TypeScript typecheck
npm run typecheck

# Build for production
npm run build
```

---

## 📜 Project Documentation
- [Architecture & Decisions](docs/DECISIONS.md)
- [API Assumptions & Quirks](docs/ASSUMPTIONS.md)
- [Learnings & Retrospective](docs/LEARNINGS.md)
- [AI Assistance Disclosure](docs/AI_USE.md)

---

## 📄 License
[MIT](LICENSE)
