"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

let client: SupabaseClient<Database> | undefined;

export function createBrowserSupabaseClient(): SupabaseClient<Database> {
  if (!client) {
    const { url, publishableKey } = getSupabaseEnv();

    client = createBrowserClient<Database>(
      url,
      publishableKey,
    );
  }

  return client;
}