"use client";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

let recoveryClient:
  | SupabaseClient<Database>
  | undefined;

export function createPasswordRecoverySupabaseClient(): SupabaseClient<Database> {
  if (!recoveryClient) {
    const { url, publishableKey } =
      getSupabaseEnv();

    recoveryClient =
      createClient<Database>(
        url,
        publishableKey,
        {
          auth: {
            flowType: "implicit",
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
          },
        },
      );
  }

  return recoveryClient;
}
