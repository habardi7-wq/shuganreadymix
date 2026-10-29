-- Kharasana Pro foundation: PostgreSQL / Supabase
-- Apply in a new project only after reviewing with a database administrator.
create extension if not exists pgcrypto;

create table if not exists public.factories (
 id uuid primary key default gen_random_uuid(),
 legal_name text not null check(length(trim(legal_name)) between 2 and 200),
 registration_number text,
 created_at timestamptz not null default now()
);
create table if not exists public.factory_members (
 factory_id uuid not null references public.factories(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('owner','admin','sales','accountant','dispatcher','viewer')),
 created_at timestamptz not null default now(),
 primary key(factory_id,user_id)
);
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 factory_id uuid not null references public.factories(id) on delete cascade,
 customer_name text not null check(length(trim(customer_name)) between 1 and 200),
 neighborhood text not null,
 concrete_grade text not null,
 pour_type text not null,
 quantity_m3 numeric(12,3) not null check(quantity_m3>0),
 price_per_m3 numeric(14,2) not null check(price_per_m3>=0),
 cost_per_m3 numeric(14,2) not null check(cost_per_m3>=0),
 status text not null default 'quotation' check(status in ('quotation','confirmed','delivered','cancelled')),
 created_at timestamptz not null default now()
);
create table if not exists public.suppliers (
 id uuid primary key default gen_random_uuid(),
 factory_id uuid not null references public.factories(id) on delete cascade,
 supplier_name text not null,
 category text not null,
 registration_number text,
 status text not null default 'review' check(status in ('review','qualified','rejected')),
 created_at timestamptz not null default now()
);
create table if not exists public.purchase_requests (
 id uuid primary key default gen_random_uuid(),
 factory_id uuid not null references public.factories(id) on delete cascade,
 material text not null,
 quantity numeric(12,3) not null check(quantity>0),
 unit text not null,
 deadline date,
 status text not null default 'draft' check(status in ('draft','sent','closed','cancelled')),
 created_at timestamptz not null default now()
);
create table if not exists public.expenses (
 id uuid primary key default gen_random_uuid(),
 factory_id uuid not null references public.factories(id) on delete cascade,
 description text not null,
 category text not null,
 amount numeric(14,2) not null check(amount>0),
 created_at timestamptz not null default now()
);
create table if not exists public.audit_events (
 id bigint generated always as identity primary key,
 factory_id uuid not null references public.factories(id) on delete cascade,
 actor_id uuid,
 entity_type text not null,
 entity_id uuid,
 action text not null,
 recorded_at timestamptz not null default now()
);
create index if not exists idx_orders_factory_status on public.orders(factory_id,status,created_at);
create index if not exists idx_members_user on public.factory_members(user_id,factory_id);

-- Members can read own membership, but cannot self-insert or elevate.
-- Privileged membership writes must be performed through vetted server-side flows.
alter table public.factories enable row level security;
alter table public.factory_members enable row level security;
alter table public.orders enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.expenses enable row level security;
alter table public.audit_events enable row level security;

-- SECURITY DEFINER prevents policy recursion when looking up memberships.
-- This helper is read-only and contains no dynamic SQL.
create or replace function public.has_factory_role(p_factory uuid, p_roles text[])
returns boolean language sql stable security definer
set search_path = '' as $$
 select exists(
  select 1 from public.factory_members m
  where m.factory_id=p_factory and m.user_id=(select auth.uid()) and m.role=any(p_roles)
 );
$$;
revoke all on function public.has_factory_role(uuid,text[]) from public;
grant execute on function public.has_factory_role(uuid,text[]) to authenticated;

create policy factories_select on public.factories
for select to authenticated using(public.has_factory_role(id,array['owner','admin','sales','accountant','dispatcher','viewer']));
create policy members_select on public.factory_members
for select to authenticated using(public.has_factory_role(factory_id,array['owner','admin','sales','accountant','dispatcher','viewer']));

create policy orders_select on public.orders
for select to authenticated using(public.has_factory_role(factory_id,array['owner','admin','sales','accountant','dispatcher','viewer']));
create policy orders_insert on public.orders
for insert to authenticated with check(public.has_factory_role(factory_id,array['owner','admin','sales']));
create policy orders_update on public.orders
for update to authenticated using(public.has_factory_role(factory_id,array['owner','admin','sales']))
with check(public.has_factory_role(factory_id,array['owner','admin','sales']));
create policy orders_delete on public.orders
for delete to authenticated using(public.has_factory_role(factory_id,array['owner','admin']));

create policy suppliers_select on public.suppliers
for select to authenticated using(public.has_factory_role(factory_id,array['owner','admin','sales','accountant','dispatcher','viewer']));
create policy suppliers_write on public.suppliers
for all to authenticated using(public.has_factory_role(factory_id,array['owner','admin']))
with check(public.has_factory_role(factory_id,array['owner','admin']));

create policy purchase_requests_select on public.purchase_requests
for select to authenticated using(public.has_factory_role(factory_id,array['owner','admin','accountant','sales','dispatcher','viewer']));
create policy purchase_requests_write on public.purchase_requests
for all to authenticated using(public.has_factory_role(factory_id,array['owner','admin','accountant']))
with check(public.has_factory_role(factory_id,array['owner','admin','accountant']));

create policy expenses_select on public.expenses
for select to authenticated using(public.has_factory_role(factory_id,array['owner','admin','accountant','viewer']));
create policy expenses_write on public.expenses
for all to authenticated using(public.has_factory_role(factory_id,array['owner','admin','accountant']))
with check(public.has_factory_role(factory_id,array['owner','admin','accountant']));
create policy audit_select on public.audit_events
for select to authenticated using(public.has_factory_role(factory_id,array['owner','admin']));
-- No client-side insert/update/delete on audit events.

-- IMPORTANT: initial factory creation and owner enrollment must use a secure
-- backend transaction, never a public service_role key or browser-generated membership.
