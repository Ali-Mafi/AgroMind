create table if not exists private.signup_verification_watches (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create or replace function private.bootstrap_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  account uuid;
  default_plan uuid;
  normalized_username text;
  verification_hash text;
begin
  select id into strict default_plan from public.plans where is_default and is_active;
  normalized_username := lower(nullif(btrim(coalesce(new.raw_user_meta_data->>'username','')), ''));
  if normalized_username is not null and normalized_username !~ '^[a-z0-9_]{3,30}$' then
    normalized_username := null;
  end if;
  insert into public.profiles(id,username,full_name,language)
  values(
    new.id,
    normalized_username,
    left(coalesce(new.raw_user_meta_data->>'full_name',''),120),
    case when new.raw_user_meta_data->>'language' = 'fa' then 'fa' else 'en' end
  );
  verification_hash := nullif(new.raw_user_meta_data->>'verification_watch_hash','');
  if verification_hash is not null and verification_hash ~ '^[a-f0-9]{64}$' then
    insert into private.signup_verification_watches(user_id, token_hash)
    values(new.id, verification_hash)
    on conflict (user_id) do update
      set token_hash = excluded.token_hash,
          expires_at = now() + interval '24 hours';
  end if;
  insert into public.accounts(owner_user_id) values(new.id) returning id into account;
  insert into public.subscriptions(account_id,plan_id) values(account,default_plan);
  return new;
end $$;

create or replace function public.pending_signup_verified(p_token_hash text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.signup_verification_watches w
    join auth.users u on u.id = w.user_id
    where w.token_hash = p_token_hash
      and w.expires_at > now()
      and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.pending_signup_verified(text) from public;
grant execute on function public.pending_signup_verified(text) to anon, authenticated;
