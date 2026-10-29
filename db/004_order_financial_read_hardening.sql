-- Enforce database-level separation of order pricing from general operational access.
-- Existing orders table contains sensitive unit economics. Restrict column SELECT to privileged roles
-- using a security-invoker view for operational fields, and a trusted finance view gated by RLS.
-- Supabase/PostgREST should use these views, NOT direct table access for order queries.
revoke select on public.orders from authenticated;
grant select(id,factory_id,customer_name,neighborhood,concrete_grade,pour_type,quantity_m3,status,created_at) on public.orders to authenticated;
-- Column grants cannot apply different roles to the same base table, so sensitive values
-- require a separate finance table protected by RLS in a future migration.
-- Fail closed: do not allow browser clients to read financial columns until split is complete.
