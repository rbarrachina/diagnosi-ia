-- Admin RPCs call helper functions in the private schema.
-- The browser roles still have no access; only the server-side service role can execute them.

grant usage on schema private to service_role;
grant execute on all functions in schema private to service_role;
