# PickUp Accessibility & Audit Checklist (Phase 6)

This document provides a comprehensive, reproducible manual accessibility test protocol for **PickUp**, covering keyboard navigation, screen-reader validation across all major operating systems (VoiceOver, TalkBack, NVDA), and Lighthouse audit instructions with a target score of **95+**.

---

## 1. Accessibility Standards & Baseline

PickUp is intentionally designed as an offline-first, low-friction tool for neurodivergent knowledge workers and students with ADHD. Its accessibility architecture follows these principles:
- **WCAG 2.1 Level AA Conformity** (and AAA for high-contrast mode & contrast ratios >= 7:1).
- **Zero Sensory Overload**: No blinking animations, no urgent red error walls, no guilt-tripping streaks.
- **Calm Screen-Reader Discipline**: Real-time counters (like countdown timers) do **not** flood `aria-live` with per-second ticks. Live regions announce only critical status transitions (e.g., timer started, timer completed, card parked).
- **Full Touch & Keyboard Equivalence**: Every single interactive action is achievable via keyboard and touch with visible focus and minimum 44px targets.

---

## 2. Manual Keyboard Navigation Protocol

Run through this keyboard-only test script without using a mouse or trackpad:

| Step | Action | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :---: |
| **K-01** | Load app and press `Tab` once from browser address bar. | The **Skip to main content** link appears prominently at top left with a high-contrast focus ring. | [ ] |
| **K-02** | Press `Enter` on the Skip link. | Focus jumps directly to `<main id="main-content">`, bypassing the header navigation. | [ ] |
| **K-03** | Press `Tab` through header nav (`Park It`, `Resume`, `Settings`). | Each button receives a clear 3px solid focus ring with 3px offset. `Park It` has `aria-current="page"`. | [ ] |
| **K-04** | Navigate to the Park It textarea and type thoughts. | Textarea receives focus. Placeholder text is readable with >= 4.5:1 contrast. | [ ] |
| **K-05** | Press `Ctrl + Enter` (or `Cmd + Enter` on macOS). | Form submits and immediately opens the Review Screen. Focus moves to the Review view. | [ ] |
| **K-06** | In Review screen, press `Tab` through the extracted cue textareas (*Where I was*, *Next 5-minute action*, *Waiting on*). | All three cue fields are editable and keyboard accessible with proper labels. | [ ] |
| **K-07** | Press `Enter` or `Space` on "Save Card". | Card is parked, badge updates to "1", and screen navigates to Resume view. | [ ] |
| **K-08** | In Resume screen, press `Tab` to the warm-up timer buttons ("Start 2-min warm up", "Pause", "Reset"). | Each button is keyboard-focusable with visible focus outline. | [ ] |
| **K-09** | Press `Tab` to the primary card actions: "I'm back at it", "Done", "Park again", "Share". | Each action button is keyboard-activatable via `Space` or `Enter`. | [ ] |
| **K-10** | Press `Tab` to the "Settings" button in header and press `Enter`. | The `<dialog id="settings-dialog">` modal opens. Focus moves inside the dialog to the first input. | [ ] |
| **K-11** | Use `Up`/`Down` arrow keys inside Text Size, Theme, and Motion radio groups. | Active selection updates dynamically, and styles preview immediately in real-time. | [ ] |
| **K-12** | Press `Escape` while Settings dialog is open. | Dialog closes, settings remain saved, and focus returns cleanly to the "Settings" trigger button. | [ ] |

---

## 3. Screen Reader Testing Matrix

### A. VoiceOver (macOS & iOS / Safari)
- **Activation**: `Cmd + F5` (macOS), or Triple-click Side button (iOS).
- **Rotor Shortcut**: `VO + U` (macOS) or two-finger twist (iOS).

#### Verification Steps:
1. **Landmarks**:
   - Open Rotor (`VO + U`) -> select **Landmarks**.
   - Verify `banner` (header), `main` (primary view), and `contentinfo` (footer) are announced properly.
2. **Form Controls & Labels**:
   - Navigate to Park It textarea: VoiceOver must read *"What are you in the middle of? Park your thoughts here."* with clear character limits.
   - Navigate to Review cue fields: VoiceOver must announce field labels (*Where I was*, *Next 5-minute action*, *Waiting on*) clearly before reading content.
3. **Timer Discipline**:
   - Press "Start 2-min warm up".
   - **Critical check**: VoiceOver must announce *"Warm-up timer started. 2 minutes remaining."* and then stay completely silent during seconds 119 down to 1.
   - When timer expires, VoiceOver must announce *"Time's up! Great job starting. Keep going or take a break."*
4. **Handoff Screen**:
   - When opening a `#handoff=` share link, VoiceOver announces *"Handed off to you. Task bookmark shared with you."*

---

### B. NVDA (Windows / Firefox & Google Chrome)
- **Activation**: `Ctrl + Alt + N`.
- **Mode Toggle**: `Insert + Space` to toggle Browse Mode (reading) and Focus Mode (typing).

#### Verification Steps:
1. **Heading Hierarchy**:
   - Press `H` in Browse Mode to navigate headings sequentially:
     - `H1`: "Park your mental state" or "Pick up where you left off".
     - `H2`: Cue titles, settings modal title.
     - Verify no heading levels are skipped.
2. **Interactive States**:
   - Tab to the badge counter: NVDA reads *"1 parked task"* via `aria-label`.
   - Tab to Settings button: NVDA reads *"Settings, button, has pop-up"*.
3. **Radio Groups & Form Validation**:
   - Inside Settings dialog, NVDA reads the `<legend>` for each `<fieldset>` (e.g. *"Text Size, grouping, Normal (100%), radio button checked 1 of 3"*).
4. **High Contrast Mode**:
   - Toggle Windows High Contrast (`Alt + LeftShift + PrintScreen`).
   - Verify all buttons, borders, and inputs remain clearly delineated using system `CanvasText` and `Highlight` tokens.

---

### C. TalkBack (Android / Google Chrome)
- **Activation**: Settings > Accessibility > TalkBack, or hold both volume keys for 3 seconds.
- **Gestures**: Swipe right for next item, swipe left for previous, double tap to activate.

#### Verification Steps:
1. **Touch Target Dimensions**:
   - Check that all interactive items (buttons, checkboxes, radios) meet the minimum **44px x 44px** touch target size.
   - Confirm comfortable spacing so adjacent buttons cannot be accidentally double-tapped.
2. **Draft Auto-save**:
   - Type in the textarea, wait 500ms: confirm no disruptive audio cues occur during quiet background auto-save.
3. **Web Share API**:
   - Tap "Share" on a card: TalkBack properly navigates the native Android system share sheet.

---

## 4. Google Chrome Lighthouse Audit Instructions

### Target Accessibility Score: **95+ (Goal: 100)**

Follow these step-by-step instructions to run a clean Lighthouse audit:

1. **Launch Clean Environment**:
   - Open Google Chrome in an **Incognito Window** (`Ctrl + Shift + N`) to prevent browser extensions from interfering with DOM audits.
2. **Start Dev Server / Preview**:
   ```powershell
   npm run build
   npm run preview
   ```
   Navigate to the local preview URL (typically `http://localhost:4173/`).
3. **Open DevTools**:
   - Press `F12` or `Ctrl + Shift + I`.
   - Click the **Lighthouse** tab in the top DevTools toolbar.
4. **Configure Audit Parameters**:
   - **Mode**: Navigation (Default)
   - **Device**: Run two passes — one **Desktop** and one **Mobile**.
   - **Categories**: Check **Accessibility**, **Best Practices**, and **PWA**.
5. **Run Audit**:
   - Click **Analyze page load**.
   - Wait 10–15 seconds for report generation.

### Verified Audit Criteria in PickUp:
- [x] **Color Contrast**: All text elements meet or exceed WCAG AA contrast ratios (>= 4.5:1 for normal text, >= 3.0:1 for large text and UI borders). High contrast mode provides >= 7:1 (AAA).
- [x] **Heading Hierarchy**: Exactly one `<h1>` per view; sections use orderly `<h2>` and `<h3>`.
- [x] **ARIA Landmarks**: Banner (`<header>`), Main (`<main>`), Contentinfo (`<footer>`), and navigation (`<nav>`) are semantically tagged.
- [x] **Form Labels**: Every textarea, text input, checkbox, and radio input has an explicit label or `<fieldset>`/`<legend>` container.
- [x] **Meta Tags**: `<html lang="en">`, responsive `<meta name="viewport">` with no user-scalable disablement, and `<meta name="theme-color">`.
- [x] **PWA Installability**: Valid `manifest.webmanifest` with icons (192px, 512px, SVG), `start_url`, `display: standalone`, and active Service Worker.

---

## 5. Automated Accessibility Testing (`axe-core`)

> [!NOTE]
> **Pending User Approval**:
> Under PickUp's strict zero-unapproved-dependency constraint, `axe-core` has not been installed.
> Once user approval is granted, automated CI accessibility tests can be added via `npm install -D axe-core` to run alongside the existing Vitest suite (`npm test`).
