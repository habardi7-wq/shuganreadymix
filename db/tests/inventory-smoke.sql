-- SQL integration smoke test: run only in a disposable PostgreSQL/Supabase test database
-- after applying 001, 002, and 003. Roll back fixture records at end.
begin;
do $$
declare f uuid:=gen_random_uuid();m uuid:=gen_random_uuid(); e uuid:=gen_random_uuid(); first_id bigint;second_id bigint; balance_qty bigint;
begin
 insert into public.factories(id,legal_name) values(f,'Integration Test Factory');
 insert into public.materials(id,factory_id,name,unit) values(m,f,'Cement','gram');
 first_id:=public.post_inventory_movement(f,m,e,40000,'receipt');
 second_id:=public.post_inventory_movement(f,m,e,40000,'receipt');
 if first_id<>second_id then raise exception 'Idempotency failed'; end if;
 select quantity into balance_qty from public.inventory_balances where factory_id=f and material_id=m;
 if balance_qty<>40000 then raise exception 'Unexpected stock balance: %',balance_qty;end if;
 begin
  perform public.post_inventory_movement(f,m,e,30000,'receipt');
  raise exception 'Conflicting idempotency key was accepted';
 exception when others then
  if sqlerrm <> 'Conflicting idempotency key' then raise;end if;
 end;
 perform public.post_inventory_movement(f,m,gen_random_uuid(),-25000,'production');
 select quantity into balance_qty from public.inventory_balances where factory_id=f and material_id=m;
 if balance_qty<>15000 then raise exception 'Incorrect consumption balance';end if;
 begin
  perform public.post_inventory_movement(f,m,gen_random_uuid(),-20000,'production');
  raise exception 'Negative stock was accepted';
 exception when others then
  if sqlerrm <> 'Insufficient stock or overflow' then raise;end if;
 end;
end $$;
rollback;
