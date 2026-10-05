import "server-only";

import {
  InputError,
} from "@regional-fantasy/shared";

import type {
  Database,
} from "@/lib/supabase/database.types";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

export type ClubRow =
  Database["public"]["Tables"]["clubs"]["Row"];

export async function getClubs(): Promise<
  ClubRow[]
> {
  const supabase =
    await createServerSupabaseClient();

  const {
    data,
    error,
  } =
    await supabase
      .from("clubs")
      .select("*")
      .order("name")
      .order("id");

  if (error) {
    throw error;
  }

  return data;
}

export async function createClub(
  input:
    Database["public"]["Tables"]["clubs"]["Insert"],
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const {
    error,
  } =
    await supabase
      .from("clubs")
      .insert(
        input,
      );

  if (error) {
    throw error;
  }
}

export async function deleteClub(
  clubId: string,
): Promise<void> {
  if (
    !clubId ||
    typeof clubId !==
      "string"
  ) {
    throw new InputError(
      "Club no válido.",
    );
  }

  const supabase =
    await createServerSupabaseClient();

  /*
   * Primero comprobamos que el club siga
   * existiendo.
   */
  const {
    data: club,
    error:
      clubError,
  } =
    await supabase
      .from("clubs")
      .select(
        "id, name",
      )
      .eq(
        "id",
        clubId,
      )
      .maybeSingle();

  if (
    clubError
  ) {
    throw clubError;
  }

  if (!club) {
    throw new InputError(
      "El club ya no existe.",
    );
  }

  /*
   * No permitimos borrar un club que todavía
   * tenga equipos asociados.
   *
   * Primero habrá que eliminar o mover
   * esos equipos.
   */
  const {
    data: teams,
    error:
      teamsError,
  } =
    await supabase
      .from("teams")
      .select(
        "id",
      )
      .eq(
        "club_id",
        clubId,
      )
      .limit(
        1,
      );

  if (
    teamsError
  ) {
    throw teamsError;
  }

  if (
    teams.length >
    0
  ) {
    throw new InputError(
      "No puedes eliminar este club porque todavía tiene equipos asociados.",
    );
  }

  const {
    data:
      deletedClub,
    error:
      deleteError,
  } =
    await supabase
      .from("clubs")
      .delete()
      .eq(
        "id",
        clubId,
      )
      .select(
        "id",
      )
      .maybeSingle();

  if (
    deleteError
  ) {
    throw deleteError;
  }

  if (
    !deletedClub
  ) {
    throw new InputError(
      "El club no se pudo eliminar porque ya no está disponible.",
    );
  }
}