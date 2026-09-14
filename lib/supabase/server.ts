import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig, sessionCookieOptions } from "./config";
import type { Database } from "./database.types";

export async function createClient() {
  const store = await cookies();
  const { url, key } = supabaseConfig();
  return createServerClient<Database>(url, key, {
    auth: {
      experimental: {
        recoveryCodes: true,
      },
    },
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, { ...options, ...sessionCookieOptions }),
          );
        } catch {
          /* Server Components are read-only. Proxy persists refreshes. */
        }
      },
    },
  });
}
