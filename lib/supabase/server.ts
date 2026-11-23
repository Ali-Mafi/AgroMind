import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig, sessionCookieOptions } from "./config";
import {
  sessionCookieName,
  visibleSessionCookies,
} from "./session-cookies";
import type { Database } from "./database.types";

export async function createClient() {
  const store = await cookies();
  const { url, key } = supabaseConfig();
  const sessionName = sessionCookieName(url);
  return createServerClient<Database>(url, key, {
    auth: {
      experimental: {
        recoveryCodes: true,
      },
    },
    cookieOptions: { ...sessionCookieOptions, name: sessionName },
    cookies: {
      getAll: () => visibleSessionCookies(store.getAll(), sessionName),
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
