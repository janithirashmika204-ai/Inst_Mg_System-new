-- EduPeak first Super Administrator bootstrap.
-- Run AFTER the initial schema migration and AFTER creating the Auth user.
-- Replace the values in the DECLARE section with your actual details.
-- Safe to rerun: it reuses the institute slug and updates the membership.

do $bootstrap$
declare
  v_admin_email text := 'super_admin@edupeak.local';
  v_admin_name text := 'System Administrator';
  v_institute_name text := 'EduPeak Institute';
  v_institute_slug text := 'edupeak';
  v_user_id uuid;
  v_institute_id uuid;
begin
  select u.id
    into v_user_id
    from auth.users as u
   where lower(u.email) = lower(v_admin_email)
   limit 1;

  if v_user_id is null then
    raise exception 'No Auth user found for the configured administrator email. Create the user in Authentication > Users and make sure the email matches.';
  end if;

  insert into public.institutes (name, slug, timezone, currency_code)
  values (v_institute_name, v_institute_slug, 'Asia/Colombo', 'LKR')
  on conflict (slug) do update
    set name = excluded.name,
        updated_at = now()
  returning id into v_institute_id;

  insert into public.user_profiles (id, email, full_name, username)
  values (v_user_id, v_admin_email, v_admin_name, 'super_admin')
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        username = excluded.username,
        updated_at = now();

  insert into public.institute_memberships (institute_id, user_id, role, status)
  values (v_institute_id, v_user_id, 'super_admin', 'active')
  on conflict (institute_id, user_id) do update
    set role = 'super_admin',
        status = 'active',
        updated_at = now();

  insert into public.institute_settings (institute_id, settings)
  values (
    v_institute_id,
    jsonb_build_object(
      'institute', jsonb_build_object(
        'name', v_institute_name,
        'registrationNumber', '',
        'address', '',
        'phone', '',
        'email', v_admin_email
      ),
      'rolePermissions', '{}'::jsonb,
      'smsTemplates', '{}'::jsonb,
      'branches', '[]'::jsonb,
      'language', 'English'
    )
  )
  on conflict (institute_id) do nothing;

  raise notice 'EduPeak Super Administrator bootstrap completed successfully.';
end;
$bootstrap$;
