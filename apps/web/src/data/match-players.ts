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

import {
  getMatchById,
  type MatchRow,
} from "./matches";

import type {
  PlayerRow,
} from "./players";

import type {
  TeamRow,
} from "./teams";

export type MatchPlayerRow =
  Database["public"]["Tables"]["match_players"]["Row"];

export type MatchPlayerDetails =
  MatchPlayerRow & {
    player:
      | Pick<
          PlayerRow,
          | "id"
          | "first_name"
          | "last_name"
          | "shirt_number"
          | "position"
        >
      | null;

    team:
      | Pick<
          TeamRow,
          "id" | "name"
        >
      | null;
  };

type Stats = Pick<
  MatchPlayerRow,
  | "starter"
  | "minutes_played"
  | "goals"
  | "assists"
  | "yellow_cards"
  | "red_cards"
  | "clean_sheet"
>;

export type QuickStatField =
  | "goals"
  | "assists"
  | "yellow_cards"
  | "red_cards";

async function getEligiblePlayers(
  match: MatchRow,
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
      .eq(
        "active",
        true,
      )
      .in(
        "team_id",
        [
          match.home_team_id,
          match.away_team_id,
        ],
      )
      .order(
        "first_name",
      )
      .order(
        "last_name",
      )
      .order(
        "id",
      );

  if (error) {
    throw error;
  }

  return data;
}

export async function getEligibleSquadPlayers(
  match: MatchRow,
): Promise<PlayerRow[]> {
  return getEligiblePlayers(
    match,
  );
}

export async function getMatchPlayers(
  matchId: string,
): Promise<MatchPlayerDetails[]> {
  const supabase =
    await createServerSupabaseClient();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "match_players",
      )
      .select(
        `
          *,
          player:players(
            id,
            first_name,
            last_name,
            shirt_number,
            position
          ),
          team:teams(
            id,
            name
          )
        `,
      )
      .eq(
        "match_id",
        matchId,
      )
      .order(
        "created_at",
      )
      .order(
        "id",
      );

  if (error) {
    throw error;
  }

  return data;
}

export async function addMatchPlayer(
  matchId: string,
  playerId: string,
): Promise<void> {
  const match =
    await getMatchById(
      matchId,
    );

  if (!match) {
    throw new InputError(
      "El partido ya no está disponible.",
    );
  }

  const supabase =
    await createServerSupabaseClient();

  const {
    data: player,
    error: playerError,
  } =
    await supabase
      .from(
        "players",
      )
      .select("*")
      .eq(
        "active",
        true,
      )
      .in(
        "team_id",
        [
          match.home_team_id,
          match.away_team_id,
        ],
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
      "Selecciona un jugador activo de uno de los equipos del partido.",
    );
  }

  const {
    error,
  } =
    await supabase
      .from(
        "match_players",
      )
      .insert({
        match_id:
          match.id,

        player_id:
          player.id,

        team_id:
          player.team_id,
      });

  if (
    error?.code ===
    "23505"
  ) {
    throw new InputError(
      "Este jugador ya está en la convocatoria del partido.",
    );
  }

  if (error) {
    throw error;
  }
}

/*
 * GUARDADO FINAL DEL JUGADOR
 *
 * Las estadísticas ya NO se escriben aquí.
 *
 * - minutos -> automáticos
 * - goles -> quick stats
 * - asistencias -> quick stats
 * - tarjetas -> quick stats
 * - clean sheet -> por equipo
 * - starter -> gestión del XI
 *
 * Esta acción únicamente marca que el
 * registro del jugador se ha revisado.
 *
 * Esto evita que un formulario antiguo
 * sobrescriba datos introducidos por otro
 * directivo.
 */
export async function updateMatchPlayerStats(
  matchId: string,
  entryId: string,
  _stats: Stats,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const {
    error,
  } =
    await supabase
      .from(
        "match_players",
      )
      .update({
        stats_completed:
          true,
      })
      .eq(
        "match_id",
        matchId,
      )
      .eq(
        "id",
        entryId,
      )
      .select(
        "id",
      )
      .single();

  if (error) {
    throw error;
  }
}

/*
 * ESTADÍSTICAS RÁPIDAS
 *
 * El incremento/reducción se ejecuta
 * atómicamente en PostgreSQL.
 *
 * El RPC también genera/elimina
 * match_events.
 */
export async function updateMatchPlayerQuickStat(
  matchId: string,
  entryId: string,
  field: QuickStatField,
  delta: 1 | -1,
): Promise<number> {
  const supabase =
    await createServerSupabaseClient();

  type RpcResult = {
    data:
      | number
      | null;

    error:
      | {
          message?: string;
        }
      | null;
  };

  const rpc =
    supabase.rpc.bind(
      supabase,
    ) as unknown as (
      functionName: string,
      args: Record<
        string,
        unknown
      >,
    ) => Promise<RpcResult>;

  const {
    data,
    error,
  } =
    await rpc(
      "increment_match_player_stat",
      {
        p_match_id:
          matchId,

        p_entry_id:
          entryId,

        p_field:
          field,

        p_delta:
          delta,
      },
    );

  if (error) {
    throw error;
  }

  if (
    typeof data !==
    "number"
  ) {
    throw new InputError(
      "No se pudo actualizar la estadística del jugador.",
    );
  }

  return data;
}

/*
 * PORTERÍA A CERO POR EQUIPO
 *
 * Se replica sobre TODOS los jugadores
 * del equipo convocados en este partido.
 *
 * Fantasy podrá después decidir qué
 * posiciones reciben puntos.
 */
export async function updateTeamCleanSheet(
  matchId: string,
  teamId: string,
  cleanSheet: boolean,
): Promise<void> {
  const match =
    await getMatchById(
      matchId,
    );

  if (!match) {
    throw new InputError(
      "El partido ya no está disponible.",
    );
  }

  const validTeam =
    teamId ===
      match.home_team_id ||
    teamId ===
      match.away_team_id;

  if (!validTeam) {
    throw new InputError(
      "El equipo seleccionado no pertenece a este partido.",
    );
  }

  const supabase =
    await createServerSupabaseClient();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "match_players",
      )
      .update({
        clean_sheet:
          cleanSheet,
      })
      .eq(
        "match_id",
        matchId,
      )
      .eq(
        "team_id",
        teamId,
      )
      .select(
        "id",
      );

  if (error) {
    throw error;
  }

  if (
    !data ||
    data.length ===
      0
  ) {
    throw new InputError(
      "No hay jugadores de este equipo en la convocatoria.",
    );
  }
}

export async function updateMatchPlayerStarter(
  matchId: string,
  entryId: string,
  starter: boolean,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const {
    error,
  } =
    await supabase
      .from(
        "match_players",
      )
      .update({
        starter,
      })
      .eq(
        "match_id",
        matchId,
      )
      .eq(
        "id",
        entryId,
      )
      .select(
        "id",
      )
      .single();

  if (error) {
    throw error;
  }
}

export async function removeMatchPlayer(
  matchId: string,
  entryId: string,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const {
    error,
  } =
    await supabase
      .from(
        "match_players",
      )
      .delete()
      .eq(
        "match_id",
        matchId,
      )
      .eq(
        "id",
        entryId,
      )
      .select(
        "id",
      )
      .single();

  if (error) {
    throw error;
  }
}