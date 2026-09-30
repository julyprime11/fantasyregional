import "server-only";

import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

import { cookies } from "next/headers";

import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

export async function createServerSupabaseClient() {
  const { url, publishableKey } = getSupabaseEnv();

  const cookieStore = await cookies();

  return createServerClient<Database>(
    url,
    publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(
                  name,
                  value,
                  options,
                );
              },
            );
          } catch {
            /*
             * En algunos Server Components las cookies
             * no se pueden modificar directamente.
             * Más adelante añadiremos el proxy de sesión
             * para gestionar también el refresh.
             */
          }
        },
      },
    },
  );
}