update public.profiles
set onboarding_step = 0
where onboarding_completed = false;
