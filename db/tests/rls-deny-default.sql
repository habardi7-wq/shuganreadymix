-- Run ONLY in CI disposable database after migrations 001-003.
-- Auth.uid in ci-auth-stub returns NULL for all roles, so test RLS deny by default.
begin;
set local role authenticated;
do $$
declare n bigint;
begin
 select count(*) into n from public.factories;
 if n <> 0 then raise exception 'Factory tenant isolation failed'; end if;
 select count(*) into n from public.orders;
 if n <> 0 then raise exception 'Order tenant isolation failed'; end if;
 select count(*) into n from public.factory_members;
 if n <> 0 then raise exception 'Membership tenant isolation failed'; end if;
 begin
  insert into public.factory_members(factory_id,user_id,role) values(gen_random_uuid(),gen_random_uuid(),'owner');
  raise exception 'Membership write must be denied';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.audit_events(factory_id,entity_type,action) values(gen_random_uuid(),'order','edit');
  raise exception 'Audit write must be denied';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
