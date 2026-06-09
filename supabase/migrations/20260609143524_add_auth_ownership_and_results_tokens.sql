-- Add creator ownership and recoverable encrypted result-token metadata.
-- Keep private_token_hmac temporarily for zero-downtime compatibility with the
-- previous deployment. New code reads and writes results_token_hash.

alter table public.diagnostic_spaces
  add column owner_user_id uuid references auth.users(id) on delete set null,
  add column results_token_hash text,
  add column results_token_encrypted text,
  add column results_token_enabled boolean not null default true,
  add column results_token_created_at timestamptz not null default now(),
  add column results_token_expires_at timestamptz;

update public.diagnostic_spaces
set results_token_hash = private_token_hmac
where results_token_hash is null;

alter table public.diagnostic_spaces
  alter column results_token_hash set not null,
  add constraint diagnostic_spaces_results_token_hash_length_check
    check (char_length(results_token_hash) >= 43),
  add constraint diagnostic_spaces_results_token_encrypted_not_blank_check
    check (results_token_encrypted is null or btrim(results_token_encrypted) <> ''),
  add constraint diagnostic_spaces_results_token_expires_at_check
    check (
      results_token_expires_at is null
      or results_token_expires_at >= results_token_created_at
    );

create index diagnostic_spaces_owner_user_id_idx
  on public.diagnostic_spaces(owner_user_id);

create index diagnostic_spaces_owner_public_code_idx
  on public.diagnostic_spaces(owner_user_id, public_code);

comment on column public.diagnostic_spaces.owner_user_id is
  'Authenticated XTEC creator that owns this anonymous diagnostic space. Existing legacy spaces may be null.';
comment on column public.diagnostic_spaces.results_token_hash is
  'Server-side HMAC of the shared results token. The plaintext token must never be stored.';
comment on column public.diagnostic_spaces.results_token_encrypted is
  'Encrypted shared results token, recoverable only server-side for the authenticated owner.';
comment on column public.diagnostic_spaces.results_token_enabled is
  'Whether the shared results token is currently accepted.';
comment on column public.diagnostic_spaces.results_token_created_at is
  'Creation timestamp for the active shared results token.';
comment on column public.diagnostic_spaces.results_token_expires_at is
  'Optional expiration timestamp for the active shared results token.';
