import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { createPendingEmailChangeHandler } from "./handler.ts";

Deno.serve(async (request: Request) => {
  const url = Deno.env.get("SUPABASE_URL");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serverKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !publicKey || !serverKey) {
    return new Response(JSON.stringify({ error: "service_unavailable" }), {
      status: 503,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  const options = {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(8000) }),
    },
  };

  return createPendingEmailChangeHandler({
    admin: createClient(url, serverKey, options),
    auth: createClient(url, publicKey, options),
  })(request);
});
