-- Inventory ledger foundation. Review in staging before applying.
create table if not exists public.materials(
 id uuid primary key default gen_random_uuid(),
 factory_id uuid not null references public.factories(id),
 name text not null check(length(trim(name))>0),
 unit text not null check(unit in ('gram','milliliter','piece')),
 created_at timestamptz not null default now(),
 unique(id,factory_id)
);
create table if not exists public.inventory_balances(
 factory_id uuid not null references public.factories(id),
 material_id uuid not null,
 quantity bigint not null default 0 check(quantity>=0),
 primary key(factory_id,material_id),
 foreign key(material_id,factory_id) references public.materials(id,factory_id)
);
create table if not exists public.inventory_movements(
 id bigint generated always as identity primary key,
 factory_id uuid not null,
 material_id uuid not null,
 event_key uuid not null,
 quantity_delta bigint not null check(quantity_delta<>0),
 reason text not null check(reason in ('receipt','production','adjustment','return')),
 created_at timestamptz not null default now(),
 foreign key(factory_id,material_id) references public.inventory_balances(factory_id,material_id),
 unique(factory_id,event_key,material_id)
);
create index if not exists idx_inventory_movements_factory_date on public.inventory_movements(factory_id,created_at);

alter table public.materials enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.inventory_movements enable row level security;
revoke all on public.materials,public.inventory_balances,public.inventory_movements from anon,authenticated;
grant select on public.materials,public.inventory_balances,public.inventory_movements to authenticated;

create policy material_read on public.materials for select to authenticated
 using(public.has_factory_role(factory_id,array['owner','admin','accountant','dispatcher','viewer']));
create policy balance_read on public.inventory_balances for select to authenticated
 using(public.has_factory_role(factory_id,array['owner','admin','accountant','dispatcher','viewer']));
create policy movement_read on public.inventory_movements for select to authenticated
 using(public.has_factory_role(factory_id,array['owner','admin','accountant','dispatcher','viewer']));

-- Restrict writes to a database function that locks the balance row.
-- A service-role backend must authorize the actor and never accept arbitrary factory ids.
create or replace function public.post_inventory_movement(
 p_factory uuid,p_material uuid,p_event uuid,p_delta bigint,p_reason text
) returns bigint language plpgsql security invoker set search_path='' as $$
declare v_balance bigint;v_id bigint;
begin
 if p_delta is null or p_delta=0 or p_event is null or p_reason not in ('receipt','production','adjustment','return') then raise exception 'Invalid movement';end if;
 -- Caller must possess privileged database role, not authenticated/anon.
 if current_user in ('anon','authenticated') then raise exception 'Not authorized';end if;
 insert into public.inventory_balances(factory_id,material_id,quantity)
 values(p_factory,p_material,0) on conflict do nothing;
 select quantity into v_balance from public.inventory_balances
 where factory_id=p_factory and material_id=p_material for update;
 if not found then raise exception 'Unknown material';end if;
 -- Idempotency prevents duplicate retries for the same material/event.
 select id into v_id from public.inventory_movements
 where factory_id=p_factory and material_id=p_material and event_key=p_event;
 if found then
   if not exists(select 1 from public.inventory_movements
     where id=v_id and quantity_delta=p_delta and reason=p_reason) then
     raise exception 'Conflicting idempotency key';
   end if;
   return v_id;
 end if;
 if (p_delta = '-9223372036854775808'::bigint) then raise exception 'Invalid movement overflow';end if;
 if (p_delta<0 and v_balance < -p_delta) or (p_delta>0 and v_balance > 9223372036854775807-p_delta) then
  raise exception 'Insufficient stock or overflow';
 end if;
 update public.inventory_balances set quantity=quantity+p_delta where factory_id=p_factory and material_id=p_material;
 insert into public.inventory_movements(factory_id,material_id,event_key,quantity_delta,reason)
 values(p_factory,p_material,p_event,p_delta,p_reason) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.post_inventory_movement(uuid,uuid,uuid,bigint,text) from public,anon,authenticated;
-- Grant execute only to a dedicated trusted server database role during deployment.
