# EduPeak Supabase integration — exact file list

This package combines the latest EduPeak UI (including the header search and viewport/theme fixes) with the Supabase Auth/Postgres integration.

## Recommended method

The safest route is to back up your current project folder, then use this complete `edupeak-prod` folder as the project source. Do not overwrite your `.env.local` with a template if you already created one with real project values.

## If applying files manually

### Replace these existing files

- `src/App.tsx` — latest UI plus Supabase email/password authentication, session restore, cloud data hydration/synchronization, sign-out, institute settings and sync error feedback.
- `package.json` — adds `@supabase/supabase-js` and retains the existing React/Vite scripts.
- `.gitignore` — ensures `.env.local` is excluded but `.env.example` remains trackable.
- `src/vite-env.d.ts` — Vite environment variable typings for Supabase URL and publishable/anon keys.
- `src/styles/components.css` — keeps the current design and includes the database sync warning style.

### Add these new files/folders

- `.env.example` — placeholder environment-variable template. Copy it to `.env.local` and enter your own values.
- `src/lib/supabaseClient.ts` — creates the browser Supabase client using Vite environment variables.
- `src/lib/edupeakRepository.ts` — maps and synchronizes EduPeak record collections with Supabase tables.
- `supabase/migrations/20261031000100_edupeak_initial_schema.sql` — database schema and row-level security policies.
- `supabase/bootstrap-first-admin-complete.sql` — first institute/Super Administrator bootstrap script (the user already ran an equivalent successful script).
- `SUPABASE-SETUP.md` — setup and operational notes.
- `SUPABASE-INTEGRATION-REPORT.md` — integration scope and validation notes.

### Keep these files from your current UI project

Do not replace `src/styles/`, `src/index.css`, `src/main.tsx`, `index.html`, `vite.config.ts`, `tsconfig.json`, `pnpm-lock.yaml`, or `public/fonts/` with older copies. This package already includes the latest UI versions of those files.

`pnpm-lock.yaml` does not yet contain the new Supabase dependency. After copying the files, run `corepack pnpm install` (without `--frozen-lockfile`) once so pnpm resolves the new package and updates the lockfile. Then use `corepack pnpm dev` and `corepack pnpm build`.

## Create `.env.local`

Create this file in the project root — the same folder containing `package.json`:

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Get both values from your Supabase project's Connect panel or Project Settings → API Keys. Replace the placeholders with your real values. Use the publishable key (or legacy anon key), never the service_role/secret key in frontend code.

`.env.local` is intentionally not included because it must contain your private project-specific connection values and is ignored by git. Restart Vite after creating or changing it.

## Important

- The Supabase migration must already be applied to the same project.
- The Auth user must already exist, and its email must match the bootstrap SQL.
- Do not drop tables or rerun the migration if it has already succeeded.
- Existing localStorage data is not automatically migrated. Keep a backup before importing records.
- The browser integration uses the publishable/anon key and relies on database RLS; never expose service_role/secret credentials.
