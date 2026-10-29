-- Isolated CI only. Verify RLS with two identities and two factories.
begin;
create or replace function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create temporary table tenant_fixture(uid_a uuid,uid_b uuid,f_a uuid,f_b uuid,o_a uuid,o_b uuid);
do $$
declare a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();fa uuid:=gen_random_uuid();fb uuid:=gen_random_uuid();oa uuid:=gen_random_uuid();ob uuid:=gen_random_uuid();
begin
 insert into auth.users(id) values(a),(b);
 insert into public.factories(id,legal_name) values(fa,'Factory Alpha'),(fb,'Factory Beta');
 insert into public.factory_members(factory_id,user_id,role) values(fa,a,'sales'),(fb,b,'viewer');
 insert into public.orders(id,factory_id,customer_name,neighborhood,concrete_grade,pour_type,quantity_m3,price_per_m3,cost_per_m3)
 values(oa,fa,'Customer A','Rimal','C30','Slab',10,200,170),(ob,fb,'Customer B','Yarmouk','C35','Foundation',20,210,180);
 insert into tenant_fixture values(a,b,fa,fb,oa,ob);
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select uid_a::text from tenant_fixture),true);
do $$
declare n integer;
begin
 select count(*) into n from public.orders;
 if n<>1 then raise exception 'User A can see incorrect number of orders: %',n;end if;
 if exists(select 1 from public.orders where factory_id=(select f_b from tenant_fixture)) then raise exception 'Cross-factory read';end if;
 update public.orders set customer_name='attack' where factory_id=(select f_b from tenant_fixture);
 if found then raise exception 'Cross-factory update';end if;
 begin
  insert into public.orders(factory_id,customer_name,neighborhood,concrete_grade,pour_type,quantity_m3,price_per_m3,cost_per_m3)
  values((select f_b from tenant_fixture),'attack','X','C30','Slab',1,1,1);
  raise exception 'Cross-factory insertion accepted';
 exception when check_violation or insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub',(select uid_b::text from tenant_fixture),true);
do $$
declare n integer;
begin
 select count(*) into n from public.orders;
 if n<>1 then raise exception 'User B can see incorrect number of orders: %',n;end if;
 update public.orders set customer_name='attack' where factory_id=(select f_b from tenant_fixture);
 if found then raise exception 'Viewer modified own factory';end if;
 begin
  insert into public.orders(factory_id,customer_name,neighborhood,concrete_grade,pour_type,quantity_m3,price_per_m3,cost_per_m3)
  values((select f_b from tenant_fixture),'attack','X','C30','Slab',1,1,1);
  raise exception 'Viewer insert accepted';
 exception when check_violation or insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
