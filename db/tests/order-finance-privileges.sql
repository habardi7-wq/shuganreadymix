-- Dedicated least-privilege checks against a disposable PostgreSQL database.
begin;
set local role authenticated;
do $$
begin
 if has_column_privilege(current_user,'public.orders','price_per_m3','SELECT') then raise exception 'Pricing SELECT exposed';end if;
 if has_column_privilege(current_user,'public.orders','cost_per_m3','SELECT') then raise exception 'Cost SELECT exposed';end if;
 if has_column_privilege(current_user,'public.orders','cost_per_m3','UPDATE') then raise exception 'Cost UPDATE exposed';end if;
 if has_table_privilege(current_user,'public.orders','INSERT') then raise exception 'Priced order direct INSERT exposed';end if;
 if not has_column_privilege(current_user,'public.orders','status','SELECT') then raise exception 'Operational status read unexpectedly blocked';end if;
end $$;
reset role;
rollback;
