import "server-only";

import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { currentUserIsAdmin } from "@/lib/admin-auth";

export type ProfileRow =
  Database["public"]["Tables"]["profiles"]["Row"];

export async function getProfiles(): Promise<ProfileRow[]> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("profiles")
      .select("*")
      .order("display_name")
      .order("id");

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfileVoterRole(
  profileId: string,
  voterRole: string | null,
): Promise<void> {
  // Defensa en profundidad: la capa de datos verifica permisos,
  // aunque el Server Action ya haya autorizado la operacion.
  if (!(await currentUserIsAdmin())) {
    throw new Error("No tienes permisos para modificar roles.");
  }

  // RLS revoca UPDATE(voter_role) a los clientes normales.
  // Esta clave solo se utiliza en el servidor, tras comprobar el rol.
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("profiles")
    .update({ voter_role: voterRole })
    .eq("id", profileId)
    .select("id")
    .single();

  if (error) throw error;
}