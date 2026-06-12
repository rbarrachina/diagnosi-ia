-- Allow active administrators to read questionnaire administration metadata.
-- Writes remain server-side for now so validation, version immutability and
-- multi-table operations can be enforced consistently.

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
      and admin_users.role = 'admin'
      and admin_users.is_active = true
  );
$$;

comment on function public.current_user_is_admin() is
  'Returns whether the current Supabase Auth user is an active questionnaire administrator.';

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

drop policy if exists "No direct client access to questionnaires"
on public.questionnaires;
drop policy if exists "No direct client access to question blocks"
on public.question_blocks;
drop policy if exists "No direct client access to questions"
on public.questions;
drop policy if exists "No direct client access to admin users"
on public.admin_users;

grant select on public.questionnaires to authenticated;
grant select on public.question_blocks to authenticated;
grant select on public.questions to authenticated;
grant select on public.admin_users to authenticated;

create policy "Administrators can read questionnaires"
on public.questionnaires
for select
to authenticated
using (public.current_user_is_admin());

create policy "Administrators can read question blocks"
on public.question_blocks
for select
to authenticated
using (public.current_user_is_admin());

create policy "Administrators can read questions"
on public.questions
for select
to authenticated
using (public.current_user_is_admin());

create policy "Administrators can read admin users"
on public.admin_users
for select
to authenticated
using (public.current_user_is_admin());

-- Keep all sensitive response and space tables fully server-only.
-- Do not grant browser-facing roles any direct access to these tables.
revoke all on public.diagnostic_spaces from anon, authenticated;
revoke all on public.submissions from anon, authenticated;
revoke all on public.answers from anon, authenticated;
