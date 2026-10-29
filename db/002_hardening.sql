-- Kharasana MVP security hardening (apply after 001_foundation.sql).
-- Authenticated users never get direct membership or audit write permissions.
-- RLS applies even when GRANTs are extended by future schema changes.
revoke all on public.factory_members from anon, authenticated;
grant select on public.factory_members to authenticated;
revoke all on public.audit_events from anon, authenticated;
grant select on public.audit_events to authenticated;

-- Explicit privileges are needed for RLS-filtered API access.
revoke all on public.factories from anon, authenticated;
grant select on public.factories to authenticated;
revoke all on public.orders from anon, authenticated;
grant select, insert, update, delete on public.orders to authenticated;
revoke all on public.suppliers from anon, authenticated;
grant select, insert, update, delete on public.suppliers to authenticated;
revoke all on public.purchase_requests from anon, authenticated;
grant select, insert, update, delete on public.purchase_requests to authenticated;
revoke all on public.expenses from anon, authenticated;
grant select, insert, update, delete on public.expenses to authenticated;

-- Prevent accidental unrestricted API exposure to unauthenticated clients.
revoke all on all sequences in schema public from anon, authenticated;

-- Public schema must not allow arbitrary object creation.
revoke create on schema public from public;

-- NOTE: PostgreSQL table owner and service_role can bypass ordinary client RLS.
-- Keep service keys on a trusted server only. Add dedicated RLS integration tests
-- against an isolated Supabase project before using this for real factory data.
