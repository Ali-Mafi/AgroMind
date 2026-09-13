-- RPCs take no owner identifier. RLS applies to these invoker functions.
create function public.create_farm(p_data jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare target uuid := private.current_account_id(); existing jsonb;
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.farms(account_id,id,data) values(target,p_data->>'id',p_data)
    on conflict (account_id,id) do nothing;
  select data into existing from public.farms where account_id = target and id = p_data->>'id';
  if existing is distinct from p_data then raise exception 'FARM_ID_CONFLICT'; end if;
end $$;
create function public.save_irrigation_schedule(p_farm_id text, p_data jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.irrigation_schedules(account_id,farm_id,data)
    values(private.current_account_id(),p_farm_id,p_data)
    on conflict (account_id,farm_id) do update set data = excluded.data;
end $$;
revoke all on function public.create_farm(jsonb), public.save_irrigation_schedule(text,jsonb) from public, anon;
grant execute on function public.create_farm(jsonb), public.save_irrigation_schedule(text,jsonb) to authenticated;
