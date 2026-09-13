import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const currentUser = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
});
export const requireUser = cache(async () => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (!user.email_confirmed_at) redirect("/verify-email");
  return user;
});
export async function authenticatedDestination() {
  const user = await currentUser();
  if (!user) return null;
  if (!user.email_confirmed_at) return "/verify-email";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();
  if (error) throw new Error("Account services are temporarily unavailable.");
  return data.onboarding_completed ? "/dashboard" : "/onboarding";
}
