# EduPeak frontend readiness notes

This project is the frontend-first iteration requested for EduPeak. It preserves the current React/Vite UI, login layout, and dark application theme while removing the bundled example records and adding frontend flows for bulk import, scanned-form intake, role-oriented settings, and actionable notifications.

## Start the frontend

From this folder, run:

```bash
npm install
npm run dev
```

Vite prints the local development URL. The current application persists data in this browser's `localStorage`, so that storage is local to the browser/device and is not shared across computers.

## Frontend work included

- Empty initial record arrays for students, teachers, classes, fees, attendance, exams, analytics, and notifications; timetable rows and dashboards derive from records rather than bundled sample records.
- Bulk CSV and EduPeak JSON-backup import with preview, required-name validation, duplicate checks, an import template, and a single import action. JSON backups can merge additional available teachers, classes, fee, attendance, and exam records.
- Scanned-image/PDF intake queue for trilingual forms, a manual review/capture form, and student save flow.
- Advanced Settings views for role permissions, SMS/WhatsApp templates, payment-gateway configuration drafts, branches, backup/restore, language preference, and upgrade preparation.
- Fee reminders derived from student/class fees and current-month payment records. Clicking a notice opens the student profile and marks it read; preparing an SMS marks the notice read and opens a message draft.
- Fee amounts are no longer inferred from fixed sample subject prices. The frontend uses imported/manual student fees or configured class fees; free/half-card assignments adjust configured class fees.
- Vite's fallback title is `EduPeak App`; package metadata is named `edupeak-app`.

## Important limitations before client/production use

This is still a frontend prototype, not the final multi-computer product:

- Login currently uses temporary client-side demo credentials. It is not secure authentication and must be replaced by server-side authentication before real student data is used.
- Role visibility in the UI is not a security boundary. The API must enforce permissions server-side.
- OCR/ICR/OMR is not implemented by the UI alone. The capture screen accepts uploads and provides a manual review path, but a recognition service is not connected.
- SMS/WhatsApp messages are templates only; the current fee-reminder action may open the workstation's SMS application. No gateway sends messages.
- Payment gateway fields are drafts; no real payment integration or server-side secret storage is connected.
- Backup/restore currently operates on data stored in the current browser. There is no scheduled server backup or server database yet.
- Language preference is saved, but full interface translation has not been applied to every page.
- Upgrade UI is preparation only; no signed package validation or upgrade service is connected.
- Student, class, fee, attendance, and other records are not synchronized between workstations until the backend/database phase is implemented.

## Suggested next stage

Connect each frontend module to one central API and persistent database; add real accounts/roles and audit logging; then wire ICR/OMR, messaging and payment-provider integrations. Build and test the Windows installer only after those workflows are integrated and tested against imported sample/realistic test data.


## Automatic student ID and printable ID card

New registrations and imported records without an ID can receive an ID in the format `EPYYGGNNNN` (for example, `EP26120001`): `YY` is the enrollment year, `GG` is the first-enrolled grade formatted to two digits, and `NNNN` is the next position within that year/grade cohort. The assigned ID is saved on the student record and is not recalculated when the student's current grade changes. To generate an ID for a newly registered student, enter a grade containing a numeric grade value (for example, `Grade 12`). For historical imports, include `registration_date` and `first_enrolled_grade` where available; missing IDs are generated during preview.

From a student profile, use **View / Print ID** to preview the supplied green EduPeak card design and print it. Its Code 39 barcode encodes the displayed student ID. Browser-based storage remains local to that browser until the shared server/database integration is completed.
