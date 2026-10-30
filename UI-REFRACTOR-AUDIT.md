# EduPeak UI / styling-layer audit and refactor record

## 1. Source audit

| Area | Finding in supplied frontend |
|---|---|
| Framework | React 19 + TypeScript/TSX, built with Vite 8. |
| Styling pipeline | Tailwind CSS 4 Vite plugin is configured; application presentation also uses a large hand-authored CSS entry file and extensive React inline styles. |
| Original CSS | `src/index.css` was 2,440 lines / 107,629 bytes, with repeated declarations and overrides. A selector-frequency audit found 125 selectors repeated, with 327 occurrences beyond the first. |
| Application architecture | The existing module implementation is concentrated in `src/App.tsx` (~5,000 lines). Existing page components, local state and workflow handlers were kept in place to avoid a risky business-logic rewrite. |
| Theme | A React `theme` state and `edupeak.theme` preference already existed. Many components used the shared `C` palette, but it contained literal light-theme colors, so inline component styles did not automatically follow dark mode. |
| Persistence | Application records and settings use browser `localStorage`; the main data key is `edupeak.local.v3`. |
| API / backend | No `fetch`, Axios, Supabase, Firebase, WebSocket or `/api/` integration was found in the supplied app source. The checked-in app is a local-browser frontend, not a connected multi-client backend. |
| Authentication | The login credential map and role checks execute in the browser. They are not server authentication and cannot securely protect data or privileged operations in a production deployment. |
| Integrations | Gateway, messaging and recognition settings are frontend configuration/workflow UI; no server-side delivery/processing integration was found in this source. |

## 2. Refactored styling architecture

`src/index.css` is now a short ordered entry point. Styling is split into:

- `src/styles/design-tokens.css` — Anthropic Sans variable font-face and semantic light/dark color, typography, spacing, radius, shadow, sizing and transition tokens.
- `src/styles/reset.css` — browser reset, form inheritance, keyboard focus, selection and scrollbar defaults.
- `src/styles/typography.css` — common font and heading/text hierarchy.
- `src/styles/layout.css` — app shell, content frame, responsive-safe layout primitives and shared motion.
- `src/styles/navigation.css` — existing horizontal pill navigation, account menu and search UI.
- `src/styles/components.css` — shared buttons, KPI cards, badges, fields, tables, modals and theme switch.
- `src/styles/authentication.css` — extracted login page presentation; split-screen design retained and all form text uses Anthropic Sans.
- `src/styles/themes.css` — component-level dark theme surfaces and state overrides.
- `src/styles/modules.css` — attendance scanner, dashboard setup shortcuts and print rules.
- `src/styles/responsive.css` — tablet/mobile breakpoints and reduced-motion handling.

The previous all-in-one stylesheet has been replaced by these modules. The new CSS totals 1,219 lines / 47,344 bytes (entry point plus modules), approximately 50% fewer lines and 56% fewer bytes than the original stylesheet. A repeat-selector scan found no duplicate selectors within the same conditional/media context in the refactored files.

## 3. Theme and token implementation

- `C.*` palette entries in `App.tsx` now resolve to semantic CSS custom properties (`--ep-*`) instead of fixed palette hex values.
- The existing `edupeak.theme` preference remains the persistence key.
- `index.html` applies the stored theme synchronously before React starts, reducing incorrect-theme flashes.
- React continues to own the theme switch state and updates the document root, app shell and local preference.
- Alpha variants formerly constructed by appending hex suffixes are produced with `color-mix()`, so palette variables can switch between light and dark values.
- The supplied `public/fonts/AnthropicSans-Romans.woff2` is a variable font (weight axis 300–800; optical-size axis 16–48) and is used by the application, authentication page and generated print documents.
- Fixed-color treatments remain in intentionally fixed output contexts: student ID card brand artwork, thermal receipts, receipt preview and scanner camera canvas/overlays.

## 4. Existing modules and routes retained

The navigation and page map both still contain all ten existing routes: Dashboard, Students, Teachers, Classes, Attendance, Fees, Exams, Analytics, Data Import & Capture, and Advanced Settings. Static route inspection found no navigation/page-map mismatches.

The refactor retained the existing page implementations and their current handlers rather than substituting static or mock implementations. Existing student profile/edit, class/timetable, attendance, fee/payment and receipt, exam, analytics, data-import and settings workflows remain in the source. Static source retention is not a substitute for a live regression test; those interactions still need to be exercised in a browser after dependencies can be installed.

## 5. Data initialization note

The previous frontend source had a one-time automatic fallback from `edupeak.local.v2` into the newer `edupeak.local.v3` store. That automatic legacy hydration has been removed to honor the clean-start requirement. The old `edupeak.local.v2` browser data is not deleted or modified; it is simply no longer read automatically. Current `edupeak.local.v3` records continue to load. Use an explicit export/import process to bring legacy records forward deliberately.

## 6. Remaining technical debt / production recommendations

1. Many existing page controls still use inline styles. The shared semantic palette makes the majority of palette-driven component styles theme-aware, but some legacy inline declarations still require targeted stylesheet overrides. The resulting CSS currently has 294 `!important` declarations, concentrated in legacy component, navigation, responsive and theme rules. These should be reduced progressively as more of the inline presentation is migrated into component classes; removing them in bulk now could reintroduce inline-style conflicts.
2. `src/App.tsx` remains a large monolithic module. It was intentionally not split during this styling-focused change to limit regression risk. A separate, behavior-tested component extraction should be planned.
3. Frontend-only credentials and role gating must be replaced with backend authentication, hashed credentials, server-enforced authorization and a session model before production or LAN deployment. Do not use the current demo login as a security boundary.
4. The localStorage data store is per-browser/per-device. A shared PostgreSQL backend and API are still required for shared data across the institute's computers.
5. Payment, SMS/WhatsApp, backup automation and ICR/OMR ingestion require server-side integrations and validation before operational use.
6. The responsive navigation remains horizontally scrollable at narrow widths. It is touch-scrollable and avoids page-wide overflow, but a dedicated mobile menu can be considered as a separate navigation behavior enhancement.

## 7. Validation boundary

See `FINAL-TEST-REPORT.md` for the exact commands and observed results. TSX syntax transpilation and CSS static parsing passed. The Vite production build and interactive browser checks could not be run because project dependencies are not installed and Corepack could not reach the npm registry in the execution environment.
