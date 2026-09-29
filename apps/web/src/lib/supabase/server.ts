import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

// A fresh anonymous client per call; no shared user session or cookie handling.
export function createServerSupabaseClient(): SupabaseClient<Database> {
  const { url, publishableKey } = getSupabaseEnv();

  return createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
