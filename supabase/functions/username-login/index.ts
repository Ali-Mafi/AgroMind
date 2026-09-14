import { createClient } from "npm:@supabase/supabase-js@2";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return response({ error: "method_not_allowed" }, 405);

  let payload: { username?: unknown; password?: unknown };
  try {
    payload = await req.json();
  } catch {
    return response({ error: "invalid_request" }, 400);
  }

  const username = typeof payload.username === "string" ? payload.username.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  if (!/^[a-z0-9_]{3,30}$/.test(username) || password.length < 1 || password.length > 128) {
    return response({ error: "invalid_credentials" }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceRoleKey) return response({ error: "service_unavailable" }, 503);

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (profileError || !profile) return response({ error: "invalid_credentials" }, 401);

  const { data: userResult, error: userError } = await admin.auth.admin.getUserById(profile.id);
  const email = userResult.user?.email;
  if (userError || !email) return response({ error: "invalid_credentials" }, 401);

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return response(
      { error: error?.code === "email_not_confirmed" ? "email_not_confirmed" : "invalid_credentials" },
      401,
    );
  }

  return response({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});
