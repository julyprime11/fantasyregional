import "server-only";

import {
  createClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "./database.types";

import {
  getSupabaseEnv,
} from "./env";

export function createAdminSupabaseClient() {
  const {
    url,
  } =
    getSupabaseEnv();

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient<Database>(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    },
  );
}