-- Security regression: the new RPC must authorize tenant membership.
begin;
create or replace function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create temporary table order_rpc_ids(a uuid,b uuid,fa uuid,fb uuid);
do $$
declare a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();fa uuid:=gen_random_uuid();fb uuid:=gen_random_uuid();
begin
 insert into auth.users(id) values(a),(b);
 insert into public.factories(id,legal_name) values(fa,'RPC Test Alpha'),(fb,'RPC Test Beta');
 insert into public.factory_members(factory_id,user_id,role) values(fa,a,'sales'),(fb,b,'viewer');
 insert into order_rpc_ids values(a,b,fa,fb);
end $$;
grant select on order_rpc_ids to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select a::text from order_rpc_ids),true);
do $$
declare v_created uuid;
begin
 select public.create_priced_order((select fa from order_rpc_ids),'Test Customer','Rimal','C30','Slab',10,200,160) into v_created;
 if v_created is null then raise exception 'Authorized order not created'; end if;
 if not exists(select 1 from public.orders where id=v_created) then raise exception 'Order not readable';end if;
 begin
  perform public.create_priced_order((select fb from order_rpc_ids),'Attack','Rimal','C30','Slab',10,200,160);
  raise exception 'Cross tenant order permitted';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub',(select b::text from order_rpc_ids),true);
do $$
begin
 begin
  perform public.create_priced_order((select fb from order_rpc_ids),'Viewer','Rimal','C30','Slab',10,200,160);
  raise exception 'Viewer order creation permitted';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
