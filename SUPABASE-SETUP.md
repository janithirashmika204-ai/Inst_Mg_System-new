# EduPeak + Supabase setup

This project is prepared to use Supabase Postgres for shared records and Supabase Auth for sign-in. The existing React/Vite screens and business calculations remain in place. The browser no longer authenticates against hard-coded demo passwords when Supabase is configured.

## What is included

- `supabase/migrations/20261031000100_edupeak_initial_schema.sql` — database schema, indexes, update triggers, Auth profile trigger, and Row Level Security (RLS) policies.
- `supabase/bootstrap-first-admin.sql` — creates the first institute and assigns the first Auth user the `super_admin` role.
- `src/lib/supabaseClient.ts` — Vite environment-based Supabase client.
- `src/lib/edupeakRepository.ts` — loads and synchronizes EduPeak records in batches, preserves current UI data shapes, and retries pending collection changes on the next update.
- `src/App.tsx` — Supabase session restore, email/password sign-in, workspace hydration, cloud writes, and sign-out.
- `.env.example` — safe variable names; it contains placeholders only.

No demo students, teachers, classes, fees, attendance, exams, or results are seeded.

## 1. Create a Supabase project

1. Sign in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project in an organization you control.
3. Choose a database password and keep it in a password manager. It is not the publishable key.
4. Select a region reasonably close to your institute and its users. Singapore is a sensible first region to consider for Sri Lanka when it is available in your project’s region list; compare actual latency from your network before production.
5. Wait for the project database to finish provisioning.

## 2. Apply the schema

1. Open the project’s **SQL Editor**.
2. Open `supabase/migrations/20261031000100_edupeak_initial_schema.sql` from this project.
3. Copy the complete SQL file into a new SQL Editor query and run it once.
4. Confirm that the tables below appear under **Table Editor**.

The migration creates:

| Table | Purpose |
|---|---|
| `institutes` | Institute identity, contact details, timezone and currency |
| `user_profiles` | Display name and username associated with a Supabase Auth user |
| `institute_memberships` | User-to-institute membership and role |
| `branches` | Branch records |
| `students` | Student registry and profile fields |
| `teachers` | Teacher registry |
| `classes` | Class, subject, teacher and timetable data |
| `student_class_enrollments` | Normalized student/class links, including free and half-card flags |
| `attendance_records` | Attendance history |
| `fee_payments` | Payment transactions and receipt details |
| `exams` | Examination schedules |
| `exam_results` | Result records, ready for the results workflow to be connected |
| `institute_settings` | Role permissions, institute profile, branch list and message templates |
| `audit_logs` | Administrative audit events; the current UI does not yet write these events |

Most operational tables include a `raw_data` JSONB column. This is intentional: EduPeak already has a working frontend data shape, so this column preserves fields used by existing profile cards, import/backup, quick payment, attendance and reporting while common searchable fields are also stored as normal Postgres columns. Class assignments are additionally mirrored to `student_class_enrollments` when a student or class collection changes.

## 3. Create the first Super Administrator

The first user must exist in Supabase Auth before being granted access to the institute.

1. Open **Authentication → Users**.
2. Add a user with the email address and password that the EduPeak Super Administrator will use. Confirm the user if your Auth settings require it.
3. Copy the new user's email address exactly.
4. Open `supabase/bootstrap-first-admin.sql` and replace:
   - `replace-with-admin-email@example.com`
   - `EduPeak Super Administrator` (optional display name)
   - `EduPeak Institute` (your institute name)
   - `edupeak-main` (a unique lowercase slug)
5. Run the modified bootstrap SQL in the same project's SQL Editor.
6. It will create the institute row, profile row, an active `super_admin` membership, and an empty settings record. It will not create student or financial records.

Do not manually insert a password into `user_profiles`. Passwords are managed by Supabase Auth.

## 4. Add Supabase connection values to the frontend

1. In the Supabase Dashboard, open **Connect** or **Project Settings → API Keys**.
2. Copy the Project URL and the **Publishable key** (older projects may show an `anon` key instead).
3. Copy `.env.example` to `.env.local` in the project root.
4. Set the values:

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

5. Restart the Vite development server after changing environment variables.

**Never put a `service_role` or secret key in `.env.local`, any `VITE_` variable, source code, or a browser build.** The publishable key is designed for client applications; RLS is what restricts which rows each authenticated user can access.

## 5. Install and run EduPeak

This project uses `pnpm-lock.yaml`. The Supabase JS dependency was added to `package.json`; the local lockfile needs to be refreshed on a machine with package-registry access:

```powershell
corepack pnpm install
corepack pnpm dev
```

Or, when using npm instead of pnpm:

```powershell
npm install
npm run dev
```

The login screen now accepts the Supabase Auth **email address** and password. The display username is loaded from `user_profiles`.

## 6. Create additional users

For the initial rollout, create/invite staff accounts under **Authentication → Users**. The SQL Auth trigger creates their `user_profiles` row. Then assign an institute membership from the SQL Editor, using the institute UUID returned by the bootstrap script:

```sql
insert into public.institute_memberships (institute_id, user_id, role, status)
select
  'YOUR-INSTITUTE-UUID'::uuid,
  u.id,
  'teacher',       -- see supported roles below
  'active'
from auth.users u
where lower(u.email) = lower('teacher@example.com')
on conflict (institute_id, user_id) do update
set role = excluded.role,
    status = excluded.status,
    updated_at = now();
```

Supported database role keys:

- `super_admin`
- `admin`
- `manager`
- `registrar`
- `teacher`
- `accountant`
- `attendance_staff`
- `viewer`

The app maps these keys to readable role labels. Database RLS policies enforce access independently of hidden/visible navigation items. For example, a teacher can record attendance but cannot read or edit fee payments; a manager or accountant can read and manage payments but cannot delete them; only Super Administrators and Administrators can delete payment records. The UI role-permission preferences are not a replacement for RLS.

## 7. Import existing EduPeak data safely

When a user signs in, EduPeak loads the selected institute's records from Supabase and replaces the in-memory browser collections with that institute's data. It does **not** automatically merge older localStorage data into Supabase.

Before moving to the cloud:

1. On the old installation, open Advanced Settings → Backup & Security and download a JSON backup.
2. Configure Supabase and sign in to the new cloud-connected app.
3. Use Data Import & Capture to import a CSV, or use the restore-backup workflow if you need all six record collections.
4. Verify student counts, class assignments, attendance, payment totals and receipts before using the new database as the live source of truth.

The current backup restore path writes collection changes through the Supabase-aware store setters. Do not test the first restore using the only copy of important records; retain the original backup.

## 8. Security model

- Every exposed application table has RLS enabled.
- Anonymous access to application tables is revoked.
- Each row is scoped by `institute_id`.
- The active user's institute membership and role are checked inside Postgres policy helper functions.
- Staff cannot create their own membership by signing up. The first membership is created by the bootstrap SQL; further memberships are managed by a Super Administrator.
- The client uses only the Supabase publishable/anon key.
- The `service_role` key must remain server-side and is not used by this frontend integration.

Review the RLS policies with a separate test account for each role before loading real student or financial data.

## Current integration boundaries

- Students, teachers, classes, attendance, fee payments and exams are loaded and synchronized with their matching Supabase tables.
- Institute profile, branch records, role permission preferences and SMS templates are stored in `institute_settings` / `branches`.
- Student class assignments are mirrored into `student_class_enrollments` when student or class data changes.
- `exam_results` and `audit_logs` tables are prepared, but the existing frontend has not yet connected a result-entry or audit-event workflow to them.
- Scanned application documents are still handled as local browser previews. A private Supabase Storage bucket and upload workflow are a separate implementation step.
- Payment gateway credentials and SMS/WhatsApp provider secrets must be stored server-side (for example, in Edge Function secrets), not in browser tables or Vite environment variables.
- The current app supports one active institute membership per signed-in session. An institute switcher is not yet part of the UI.
- Supabase connection and code have been prepared in this source package, but the actual hosted project cannot be provisioned from this workspace because no Supabase account/project credentials were supplied. You must create the project and run the SQL steps above.
