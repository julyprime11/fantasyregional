import "server-only";

import {
  InputError,
} from "@regional-fantasy/shared";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

export type MatchEventType =
  | "goal"
  | "assist"
  | "yellow_card"
  | "red_card"
  | "substitution";

export type MatchEvent = {
  id: string;

  match_id: string;

  event_type:
    MatchEventType;

  player_id:
    string | null;

  secondary_player_id:
    string | null;

  minute: number;

  scoring_team_id: string | null;
  is_own_goal: boolean;

  created_by:
    string | null;

  created_at:
    string;
};

export type SubstitutionResult = {
  eventId: string;
  minute: number;
};

export async function getMatchEvents(
  matchId: string,
): Promise<MatchEvent[]> {
  const supabase =
    await createServerSupabaseClient();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "match_events",
      )
      .select("*")
      .eq(
        "match_id",
        matchId,
      )
      .order(
        "minute",
        {
          ascending:
            true,
        },
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        },
      );

  if (error) {
    throw error;
  }

  return data as unknown as
    MatchEvent[];
}

export async function performMatchSubstitution(
  matchId: string,
  playerOutEntryId: string,
  playerInEntryId: string,
): Promise<SubstitutionResult> {
  const supabase =
    await createServerSupabaseClient();

  type RpcRow = {
    event_id: string;
    event_minute: number;
  };

  type RpcResult = {
    data:
      | RpcRow[]
      | null;

    error:
      | {
          message?: string;
        }
      | null;
  };

  /*
   * Conservamos el contexto de Supabase
   * al igual que con los quick stats.
   */
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
      "perform_match_substitution",
      {
        p_match_id:
          matchId,

        p_player_out_entry_id:
          playerOutEntryId,

        p_player_in_entry_id:
          playerInEntryId,
      },
    );

  if (error) {
    throw new InputError(
      error.message ??
        "No se pudo registrar la sustitución.",
    );
  }

  const row =
    data?.[0];

  if (!row) {
    throw new InputError(
      "No se pudo registrar la sustitución.",
    );
  }

  return {
    eventId:
      row.event_id,

    minute:
      row.event_minute,
  };
}

export async function finalizeMatchPlayerMinutes(
  matchId: string,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  type RpcResult = {
    data:
      | null
      | unknown;

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
    error,
  } =
    await rpc(
      "finalize_match_player_minutes",
      {
        p_match_id:
          matchId,
      },
    );

  if (error) {
    throw new InputError(
      error.message ??
        "No se pudieron cerrar los minutos del partido.",
    );
  }
}
/** Gol sin goleador inscrito: rival o en propia puerta. */
export async function registerUnattributedMatchGoal(
  matchId: string,
  scoringTeamId: string,
  minute: number,
  isOwnGoal: boolean,
): Promise<void> {
  if (
    !Number.isSafeInteger(minute) ||
    minute < 1 ||
    minute > 150 ||
    typeof isOwnGoal !== "boolean"
  ) {
    throw new InputError("Indica un minuto válido entre 1 y 150.");
  }

  const supabase = await createServerSupabaseClient();
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id, live_phase")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    throw new InputError("El partido no está disponible.");
  }
  if (
    match.live_phase === "not_started" ||
    (scoringTeamId !== match.home_team_id &&
      scoringTeamId !== match.away_team_id)
  ) {
    throw new InputError("El gol debe corresponder a uno de los equipos y a un partido iniciado.");
  }

  const { error } = await supabase.from("match_events").insert({
    match_id: matchId,
    event_type: "goal",
    player_id: null,
    secondary_player_id: null,
    minute,
    scoring_team_id: scoringTeamId,
    is_own_goal: isOwnGoal,
  });
  if (error) throw error;
}
