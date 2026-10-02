import "server-only";
import type {
  PlayerPosition,
} from "@regional-fantasy/shared";
import {
  InputError,
  validateFantasyLineup,
} from "@regional-fantasy/shared";

import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type FantasyLineupRow =
  Database["public"]["Tables"]["fantasy_lineups"]["Row"];

export type FantasyLineupPlayerRow =
  Database["public"]["Tables"]["fantasy_lineup_players"]["Row"];

export type FantasyLineupPlayerDetails =
  FantasyLineupPlayerRow & {
    player: {
      id: string;
      first_name: string;
      last_name: string | null;
      shirt_number: number | null;
      position:
        Database["public"]["Tables"]["players"]["Row"]["position"];
      image_url: string | null;
      active: boolean;
      team_id: string;
    } | null;
  };

type LineupIdentity = {
  leagueId: string;
  userId: string;
  matchId: string;
};

export async function getFantasyLineup(
  input: LineupIdentity,
): Promise<FantasyLineupRow | null> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("fantasy_lineups")
      .select("*")
      .eq("league_id", input.leagueId)
      .eq("user_id", input.userId)
      .eq("match_id", input.matchId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getFantasyLineupPlayers(
  lineupId: string,
): Promise<FantasyLineupPlayerDetails[]> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("fantasy_lineup_players")
      .select(`
        *,
        player:players (
          id,
          first_name,
          last_name,
          shirt_number,
          position,
          image_url,
          active,
          team_id
        )
      `)
      .eq("lineup_id", lineupId)
      .order("created_at")
      .order("id");

  if (error) {
    throw error;
  }

  return data;
}

async function assertFantasyContext(
  input: LineupIdentity,
): Promise<{
  teamId: string;
  matchDate: string;
}> {
  const supabase =
    await createServerSupabaseClient();

  const {
    data: membership,
    error: membershipError,
  } =
    await supabase
      .from("fantasy_league_members")
      .select("id")
      .eq("league_id", input.leagueId)
      .eq("user_id", input.userId)
      .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  if (!membership) {
    throw new InputError(
      "El usuario no pertenece a esta liga Fantasy.",
    );
  }

  const {
    data: league,
    error: leagueError,
  } =
    await supabase
      .from("fantasy_leagues")
      .select("id, team_id")
      .eq("id", input.leagueId)
      .maybeSingle();

  if (leagueError) {
    throw leagueError;
  }

  if (!league) {
    throw new InputError(
      "La liga Fantasy ya no está disponible.",
    );
  }

  const {
    data: match,
    error: matchError,
  } =
    await supabase
      .from("matches")
      .select(
        "id, home_team_id, away_team_id, match_date",
      )
      .eq("id", input.matchId)
      .maybeSingle();

  if (matchError) {
    throw matchError;
  }

  if (!match) {
    throw new InputError(
      "El partido ya no está disponible.",
    );
  }

  const leagueTeamPlays =
    match.home_team_id === league.team_id ||
    match.away_team_id === league.team_id;

  if (!leagueTeamPlays) {
    throw new InputError(
      "Este partido no corresponde al equipo de la liga Fantasy.",
    );
  }

  return {
    teamId: league.team_id,
    matchDate: match.match_date,
  };
}

export async function getOrCreateFantasyLineup(
  input: LineupIdentity,
): Promise<FantasyLineupRow> {
  await assertFantasyContext(input);

  const existing =
    await getFantasyLineup(input);

  if (existing) {
    return existing;
  }

  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("fantasy_lineups")
      .insert({
        league_id: input.leagueId,
        user_id: input.userId,
        match_id: input.matchId,
      })
      .select("*")
      .single();

  if (!error) {
    return data;
  }

  /*
   * Si dos peticiones intentan crear la alineación
   * al mismo tiempo, la restricción UNIQUE puede
   * provocar un 23505. En ese caso recuperamos la
   * alineación que acaba de crearse.
   */
  if (error.code === "23505") {
    const created =
      await getFantasyLineup(input);

    if (created) {
      return created;
    }
  }

  throw error;
}

export async function saveFantasyLineup(
  input: LineupIdentity & {
    playerIds: readonly string[];
  },
): Promise<FantasyLineupRow> {
  const context =
    await assertFantasyContext(input);

  /*
   * Bloqueo automático:
   * el XI ya no se puede modificar desde
   * una hora antes del comienzo del partido.
   */
  const matchTime =
    new Date(
      context.matchDate,
    ).getTime();

  const lockTime =
    matchTime -
    60 * 60 * 1000;

  if (Date.now() >= lockTime) {
    throw new InputError(
      "El plazo para modificar tu XI ha terminado. La alineación se bloquea una hora antes del partido.",
    );
  }

  const lineup =
    await getOrCreateFantasyLineup(input);

  if (lineup.locked_at !== null) {
    throw new InputError(
      "Esta alineación está bloqueada y ya no se puede modificar.",
    );
  }

  const uniquePlayerIds = [
    ...new Set(input.playerIds),
  ];

  if (
    uniquePlayerIds.length !==
    input.playerIds.length
  ) {
    throw new InputError(
      "No puedes seleccionar el mismo jugador más de una vez.",
    );
  }

  if (uniquePlayerIds.length !== 11) {
    throw new InputError(
      "Debes seleccionar exactamente 11 jugadores.",
    );
  }

  const supabase =
    await createServerSupabaseClient();

  const {
    data: players,
    error: playersError,
  } =
    await supabase
      .from("players")
      .select(
        "id, team_id, position, active",
      )
      .in("id", uniquePlayerIds);

  if (playersError) {
    throw playersError;
  }

  if (
    players.length !==
    uniquePlayerIds.length
  ) {
    throw new InputError(
      "Uno o más jugadores seleccionados ya no existen.",
    );
  }

  const invalidPlayer =
    players.find(
      (player) =>
        !player.active ||
        player.team_id !==
          context.teamId,
    );

  if (invalidPlayer) {
    throw new InputError(
      "Solo puedes seleccionar jugadores activos del equipo asociado a esta liga.",
    );
  }

  const validation =
    validateFantasyLineup(
      players.map(
        (player) => ({
          id: player.id,
          position:
  player.position as PlayerPosition,
        }),
      ),
    );

  if (!validation.valid) {
    throw new InputError(
      validation.errors.join(" "),
    );
  }

  const currentPlayers =
    await getFantasyLineupPlayers(
      lineup.id,
    );

  const currentIds =
    new Set(
      currentPlayers.map(
        (entry) =>
          entry.player_id,
      ),
    );

  const nextIds =
    new Set(
      uniquePlayerIds,
    );

  const playersToInsert =
    uniquePlayerIds.filter(
      (playerId) =>
        !currentIds.has(
          playerId,
        ),
    );

  const entriesToDelete =
    currentPlayers.filter(
      (entry) =>
        !nextIds.has(
          entry.player_id,
        ),
    );

  /*
   * Insertamos primero los nuevos jugadores.
   * Así, si el INSERT falla, conservamos la
   * alineación anterior.
   */
  if (
    playersToInsert.length >
    0
  ) {
    const {
      error: insertError,
    } =
      await supabase
        .from(
          "fantasy_lineup_players",
        )
        .insert(
          playersToInsert.map(
            (playerId) => ({
              lineup_id:
                lineup.id,
              player_id:
                playerId,
            }),
          ),
        );

    if (insertError) {
      throw insertError;
    }
  }

  if (
    entriesToDelete.length >
    0
  ) {
    const {
      error: deleteError,
    } =
      await supabase
        .from(
          "fantasy_lineup_players",
        )
        .delete()
        .in(
          "id",
          entriesToDelete.map(
            (entry) =>
              entry.id,
          ),
        );

    if (deleteError) {
      throw deleteError;
    }
  }

  const {
    data: updatedLineup,
    error: updateError,
  } =
    await supabase
      .from("fantasy_lineups")
      .update({
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        lineup.id,
      )
      .select("*")
      .single();

  if (updateError) {
    throw updateError;
  }

  return updatedLineup;
}

export async function lockFantasyLineup(
  lineupId: string,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const { error } =
    await supabase
      .from("fantasy_lineups")
      .update({
        locked_at:
          new Date().toISOString(),
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        lineupId,
      )
      .is(
        "locked_at",
        null,
      );

  if (error) {
    throw error;
  }
}