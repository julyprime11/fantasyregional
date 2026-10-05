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

export type PlayerRow =
  Database["public"]["Tables"]["players"]["Row"];

export async function getPlayerById(
  id: string,
): Promise<PlayerRow | null> {
  const supabase =
    await createServerSupabaseClient();

  const {
    data,
    error,
  } =
    await supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

type PlayerUpdate = Pick<
  Database["public"]["Tables"]["players"]["Update"],
  | "first_name"
  | "last_name"
  | "shirt_number"
  | "position"
  | "image_url"
  | "active"
  | "team_id"
  | "ffcv_player_code"
  | "ffcv_last_sync_at"
>;

export async function updatePlayer(
  id: string,
  input: PlayerUpdate,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const {
    error,
  } =
    await supabase
      .from("players")
      .update(input)
      .eq("id", id)
      .select("id")
      .single();

  if (error) {
    throw error;
  }
}

export async function getPlayers(): Promise<
  PlayerRow[]
> {
  const supabase =
    await createServerSupabaseClient();

  const {
    data,
    error,
  } =
    await supabase
      .from("players")
      .select("*")
      .order("first_name")
      .order("last_name")
      .order("id");

  if (error) {
    throw error;
  }

  return data;
}

export async function getPlayersByTeam(
  teamId: string,
): Promise<PlayerRow[]> {
  const supabase =
    await createServerSupabaseClient();

  const {
    data,
    error,
  } =
    await supabase
      .from("players")
      .select("*")
      .eq("team_id", teamId)
      .order("first_name")
      .order("last_name")
      .order("id");

  if (error) {
    throw error;
  }

  return data;
}

export async function createPlayer(
  input:
    Database["public"]["Tables"]["players"]["Insert"],
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const {
    error,
  } =
    await supabase
      .from("players")
      .insert(input);

  if (error) {
    throw error;
  }
}

export async function deletePlayer(
  playerId: string,
): Promise<void> {
  if (!playerId) {
    throw new InputError(
      "Jugador no válido.",
    );
  }

  const supabase =
    await createServerSupabaseClient();

  const {
    data: player,
    error: playerError,
  } =
    await supabase
      .from("players")
      .select(
        "id, first_name, last_name, active",
      )
      .eq(
        "id",
        playerId,
      )
      .maybeSingle();

  if (playerError) {
    throw playerError;
  }

  if (!player) {
    throw new InputError(
      "El jugador ya no existe.",
    );
  }

  /*
   * Comprobamos todas las tablas que
   * mantienen histórico deportivo/Fantasy.
   */
  const [
    lineupRefs,
    matchPlayerRefs,
    eventRefs,
    secondaryEventRefs,
    ratingRefs,
  ] =
    await Promise.all([
      supabase
        .from(
          "fantasy_lineup_players",
        )
        .select("id")
        .eq(
          "player_id",
          playerId,
        )
        .limit(1),

      supabase
        .from(
          "match_players",
        )
        .select("id")
        .eq(
          "player_id",
          playerId,
        )
        .limit(1),

      supabase
        .from(
          "match_events",
        )
        .select("id")
        .eq(
          "player_id",
          playerId,
        )
        .limit(1),

      supabase
        .from(
          "match_events",
        )
        .select("id")
        .eq(
          "secondary_player_id",
          playerId,
        )
        .limit(1),

      supabase
        .from(
          "ratings",
        )
        .select("id")
        .eq(
          "player_id",
          playerId,
        )
        .limit(1),
    ]);

  const responses = [
    lineupRefs,
    matchPlayerRefs,
    eventRefs,
    secondaryEventRefs,
    ratingRefs,
  ];

  for (
    const response of
    responses
  ) {
    if (response.error) {
      throw response.error;
    }
  }

  const hasHistory =
    responses.some(
      (
        response,
      ) =>
        (
          response.data
            ?.length ??
          0
        ) >
        0,
    );

  /*
   * Si tiene histórico no lo eliminamos:
   * lo desactivamos para preservar partidos,
   * votos y jornadas anteriores.
   */
  if (hasHistory) {
    if (!player.active) {
      throw new InputError(
        "Este jugador tiene histórico y ya está desactivado. No se puede eliminar definitivamente.",
      );
    }

    const {
      error:
        deactivateError,
    } =
      await supabase
        .from("players")
        .update({
          active:
            false,
        })
        .eq(
          "id",
          playerId,
        )
        .select("id")
        .single();

    if (
      deactivateError
    ) {
      throw deactivateError;
    }

    throw new InputError(
      "El jugador tiene histórico de partidos, votos o Fantasy. No se ha eliminado: se ha desactivado para conservar ese histórico.",
    );
  }

  const {
    data:
      deletedPlayer,
    error:
      deleteError,
  } =
    await supabase
      .from("players")
      .delete()
      .eq(
        "id",
        playerId,
      )
      .select("id")
      .maybeSingle();

  if (deleteError) {
    throw deleteError;
  }

  if (!deletedPlayer) {
    throw new InputError(
      "El jugador no se pudo eliminar porque ya no está disponible.",
    );
  }
}