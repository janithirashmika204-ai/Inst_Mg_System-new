# EduPeak Supabase Integration Report

## Scope and source audit

The supplied project is a React 19 + Vite 8 + TypeScript single-page application. Its primary screen/module state is held in `src/App.tsx`; before this integration, operational records were held in browser `localStorage` and the login flow used hard-coded frontend credentials. The existing routes and page components have been retained.

## Database objects

The migration `supabase/migrations/20261031000100_edupeak_initial_schema.sql` creates 14 tables:

- `institutes`, `user_profiles`, `institute_memberships`
- `branches`
- `students`, `teachers`, `classes`, `student_class_enrollments`
- `attendance_records`, `fee_payments`
- `exams`, `exam_results`
- `institute_settings`, `audit_logs`

Operational records are institute-scoped. Tables retain an indexed/normalized set of common fields and a `raw_data` JSONB copy of each existing EduPeak record so fields used by the current UI are not discarded during the transition. Class assignment objects are also synchronized to `student_class_enrollments`.

No mock students, classes, teachers, payments, attendance or exams are inserted. The separate bootstrap script creates only the institute, first Super Administrator membership and blank settings record.

## Frontend integration

- `src/lib/supabaseClient.ts`: initializes Supabase from Vite environment variables.
- `src/lib/edupeakRepository.ts`: reads and synchronizes the six active record collections; handles branch/institute settings and normalized class enrollments.
- `src/App.tsx`: restores Supabase Auth sessions, signs in by email/password, loads the user's active institute membership, hydrates the workspace and signs out.
- The existing React setter API is retained through `useCloudCollection`, so the existing CRUD/workflow components were not rewritten around a different data model.
- Browser `localStorage` remains a local cache; cloud data replaces the cache after authenticated workspace hydration. Legacy v2 data is not auto-imported.
- Writes are queued per collection and sent in batches. A last-successful snapshot is retained so a later write can retry changes from a previously failed sync.

## Security model

- RLS is enabled for every exposed public application table.
- Anonymous table access is revoked; authenticated grants are limited to the operations the app requires.
- Rows are scoped by institute membership and role policies.
- Finance records are readable and writable by Super Administrator, Administrator, Manager and Accountant. Fee deletion is restricted to Super Administrator and Administrator. The client skips the fee query for roles that do not have fee-read permission.
- Staff accounts do not receive institute membership merely by existing in Supabase Auth. The first membership is created by the bootstrap SQL; other memberships are granted by a Super Administrator.
- Only a publishable/anon key is used by the browser. A `service_role` or secret key is not included in the source or environment template.

## Current integration boundaries

- Existing active collections connected: students, teachers, classes, attendance, fee payments, exams.
- Institute profile/settings, role permission preferences, SMS templates and branches are persisted.
- `exam_results` and `audit_logs` tables exist but their corresponding UI flows are not yet wired to write them.
- Scanned application file storage is not yet connected to Supabase Storage.
- SMS/WhatsApp and payment gateway credentials are not persisted by this frontend; server-side Edge Functions and secret storage are required before sending messages or processing real payments.
- Staff Auth users are created in the Supabase Dashboard and assigned membership through SQL. A user-management invitation screen is not yet implemented.
- Student/Parent portal accounts are not part of the current Supabase membership roles; the current authentication integration is for institute staff roles.

## Validation performed in this workspace

- TypeScript/TSX transpilation check: zero syntax diagnostics in `src/App.tsx`, `src/lib/supabaseClient.ts` and `src/lib/edupeakRepository.ts`.
- CSS parser check across the 11 existing stylesheets: zero parse/declaration errors.
- Schema source review: 14 public tables, each with RLS enabled; grants and policies are present in the migration.
- Verified one Supabase session-restore effect remains (the duplicate loader was removed).
- Verified the browser environment example contains only placeholder Project URL and publishable-key variables, not a service key.
- ZIP integrity check is run when packaging this deliverable.

## Not verified / required before live data

- The migration has not been executed against a hosted Supabase project; no project URL, API key or account access was supplied. Therefore the remote database has not actually been provisioned from this workspace.
- The production Vite build and live browser/database integration test have not been run. This workspace has no installed `node_modules`, and registry access is unavailable here.
- `package.json` includes `@supabase/supabase-js`; the checked-in `pnpm-lock.yaml` has not yet been refreshed. Run `corepack pnpm install` on a machine with registry access to update it before using `--frozen-lockfile` in CI.
- Apply the SQL migration to a new Supabase project, create the first Auth user, run the bootstrap script with real institute details, set `.env.local`, install dependencies, and verify each role with a separate test account before importing production records.
