create or replace function public.pending_signup_user_id(p_token_hash text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select w.user_id
  from private.signup_verification_watches w
  join auth.users u on u.id = w.user_id
  where p_token_hash ~ '^[a-f0-9]{64}$'
    and w.token_hash = p_token_hash
    and w.expires_at > now()
    and u.email_confirmed_at is null
  limit 1;
$$;

revoke all on function public.pending_signup_user_id(text)
  from public, anon, authenticated;

grant execute on function public.pending_signup_user_id(text)
  to service_role;
