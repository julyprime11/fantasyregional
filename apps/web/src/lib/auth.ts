import "server-only";

import { cache } from "react";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

// Compartimos la validación de usuario entre layouts y páginas
// durante una única petición, sin persistir sesiones entre peticiones.
export const getCurrentUser = cache(async function getCurrentUser() {
  const supabase =
    await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}