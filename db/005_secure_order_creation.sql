-- Authenticated order creation with verified tenant role. No service key in browser.
-- SECURITY DEFINER is limited to an explicit, fully qualified insert and role check.
create or replace function public.create_priced_order(
 p_factory uuid,p_customer text,p_neighborhood text,p_grade text,p_pour text,
 p_quantity numeric,p_price numeric,p_cost numeric
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if (select auth.uid()) is null or not public.has_factory_role(p_factory,array['owner','admin','sales']) then
  raise exception 'Access denied' using errcode='42501';
 end if;
 if p_customer is null or length(trim(p_customer)) not between 1 and 200
 or p_neighborhood is null or length(trim(p_neighborhood)) not between 1 and 200
 or p_grade is null or length(trim(p_grade)) not between 1 and 80
 or p_pour is null or length(trim(p_pour)) not between 1 and 80
 or p_quantity is null or p_quantity<=0 or p_quantity>999999999.999
 or p_price is null or p_price<0 or p_price>999999999999.99
 or p_cost is null or p_cost<0 or p_cost>999999999999.99 then
  raise exception 'Invalid order' using errcode='22023';
 end if;
 insert into public.orders(factory_id,customer_name,neighborhood,concrete_grade,pour_type,quantity_m3,price_per_m3,cost_per_m3,status)
 values(p_factory,trim(p_customer),trim(p_neighborhood),trim(p_grade),trim(p_pour),p_quantity,p_price,p_cost,'quotation')
 returning id into v_id;
 insert into public.audit_events(factory_id,actor_id,entity_type,entity_id,action)
 values(p_factory,(select auth.uid()),'order',v_id,'created');
 return v_id;
end $$;
revoke all on function public.create_priced_order(uuid,text,text,text,text,numeric,numeric,numeric) from public,anon;
grant execute on function public.create_priced_order(uuid,text,text,text,text,numeric,numeric,numeric) to authenticated;
-- Finance is intentionally not returned from this RPC. Separate restricted read RPC needed.
