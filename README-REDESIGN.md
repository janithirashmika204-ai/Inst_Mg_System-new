# EduPeak — Enterprise UI Refactor

This is a styling-layer modernization of the existing React/Vite EduPeak frontend. It retains the existing application routes and module workflows rather than rebuilding the app.

## Design system

`src/index.css` imports the modular styles in order. The `src/styles/` directory contains:

1. `design-tokens.css` — semantic light/dark tokens and local Anthropic Sans variable font.
2. `reset.css` — browser reset, focus visibility, form inheritance and scrollbars.
3. `typography.css` — shared typography.
4. `layout.css` — application frame and page layout.
5. `navigation.css` — horizontal pill navigation, account menu and expandable header search.
6. `components.css` — buttons, KPI cards, badges, inputs, tables, modals and theme toggle.
7. `authentication.css` — extracted split-screen authentication styles.
8. `themes.css` — dark-theme component behavior.
9. `modules.css` — attendance scan animation, dashboard setup shortcuts and print styles.
10. `responsive.css` — desktop/tablet/mobile breakpoints and reduced motion.

The shared `C.*` palette in `src/App.tsx` resolves to semantic CSS variables. Theme preference remains saved under `edupeak.theme`; `index.html` applies it before React starts to reduce a light/dark flash. The original horizontal navigation and existing navigation routes are retained. The floating theme switch is fixed to the viewport and no longer consumes a footer row. The shared page canvas carries the low-contrast wave artwork so it is consistent across modules.

## What was preserved

Dashboard, Students, Teachers, Classes, Attendance, Fees, Exams, Analytics, Data Import & Capture and Advanced Settings remain in the original application structure. Existing profile/edit, attendance, payment/receipt, ID-card, import/export and permissions UI implementations remain present in the source.

The old `edupeak.local.v2` data key is no longer automatically loaded into the current v3 store. The legacy key is not erased; legacy records should be moved deliberately using an explicit import.

## Important production limitations

This supplied project is a frontend-only localStorage app. No remote API or database integration was found. Authentication credentials and role checks are in client-side code and must be replaced with backend authentication and server-enforced authorization before production/LAN use. Payment gateway execution, SMS/WhatsApp delivery and automated ICR/OMR processing are not connected server services in this frontend package.

## Install and run

A compact search icon sits directly before the profile avatar. Clicking it expands the existing student/teacher search; result selection, Enter, clear, Escape and outside-click dismissal are supported. At narrower widths, the navigation scrolls rather than clipping labels.

The project uses pnpm and the supplied `pnpm-lock.yaml`:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
corepack pnpm build
```

No dependency was added. The current execution environment could not fetch pnpm or the project dependencies, so the Vite build and browser regression suite remain unverified. See `UI-REFRACTOR-AUDIT.md` and `FINAL-TEST-REPORT.md` for the audit and exact validation results.
