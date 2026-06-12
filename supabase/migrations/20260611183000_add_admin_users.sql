-- Add server-managed administrator authorization.
-- This table stores only Supabase Auth user identifiers and admin metadata.
-- Do not add names, emails, centre identifiers, participant data, IPs, user
-- agents, or device information.

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,

  constraint admin_users_role_check check (role in ('admin'))
);

comment on table public.admin_users is
  'Server-managed global questionnaire administrators. Stores Supabase Auth ids only, not emails or participant data.';
comment on column public.admin_users.user_id is
  'Supabase Auth user id authorized for global questionnaire administration.';
comment on column public.admin_users.role is
  'Administrator role. Initial implementation supports only admin.';
comment on column public.admin_users.is_active is
  'Whether the administrator can access admin-only server-side operations.';
comment on column public.admin_users.created_by is
  'Supabase Auth user id of the administrator who granted access, when available.';

alter table public.admin_users enable row level security;
alter table public.admin_users force row level security;

revoke all on public.admin_users from anon, authenticated;
grant select, insert, update, delete on public.admin_users to service_role;

create policy "No direct client access to admin users"
on public.admin_users
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
