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
  finalizeMatchPlayerMinutes,
} from "./match-events";

export type MatchRow =
  Database["public"]["Tables"]["matches"]["Row"];

type MatchInsert =
  Database["public"]["Tables"]["matches"]["Insert"];

type MatchUpdate = Pick<
  Database["public"]["Tables"]["matches"]["Update"],
  | "competition_id"
  | "home_team_id"
  | "away_team_id"
  | "match_date"
  | "home_score"
  | "away_score"
  | "status"
  | "voting_opens_at"
  | "voting_closes_at"
>;

export type LiveMatchPhase =
  | "not_started"
  | "first_half"
  | "halftime"
  | "second_half"
  | "finished";

export type LiveMatchState = {
  id: string;

  status: string;

  live_phase:
    LiveMatchPhase;

  live_clock_seconds:
    number;

  live_clock_started_at:
    string | null;

  live_started_at:
    string | null;

  live_finished_at:
    string | null;
};

export async function getMatches(): Promise<
  MatchRow[]
> {
  const supabase =
    await createServerSupabaseClient();

  const {
    data,
    error,
  } =
    await supabase
      .from("matches")
      .select("*")
      .order(
        "match_date",
        {
          ascending: false,
        },
      )
      .order("id");

  if (error) {
    throw error;
  }

  return data;
}

export async function getMatchById(
  id: string,
): Promise<
  MatchRow | null
> {
  const supabase =
    await createServerSupabaseClient();

  const {
    data,
    error,
  } =
    await supabase
      .from("matches")
      .select("*")
      .eq(
        "id",
        id,
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createMatch(
  input: MatchInsert,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const {
    error,
  } =
    await supabase
      .from("matches")
      .insert(
        input,
      );

  if (error) {
    throw error;
  }
}

export async function updateMatch(
  id: string,
  input: MatchUpdate,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const {
    error,
  } =
    await supabase
      .from("matches")
      .update(
        input,
      )
      .eq(
        "id",
        id,
      )
      .select("id")
      .single();

  if (error) {
    throw error;
  }
}

async function getLiveMatchState(
  id: string,
): Promise<LiveMatchState> {
  const supabase =
    await createServerSupabaseClient();

  const {
    data,
    error,
  } =
    await supabase
      .from("matches")
      .select(
        `
          id,
          status,
          live_phase,
          live_clock_seconds,
          live_clock_started_at,
          live_started_at,
          live_finished_at
        `,
      )
      .eq(
        "id",
        id,
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new InputError(
      "El partido ya no está disponible.",
    );
  }

  const live =
    data as unknown as LiveMatchState;

  return {
    id:
      live.id,

    status:
      live.status,

    live_phase:
      live.live_phase ??
      "not_started",

    live_clock_seconds:
      live.live_clock_seconds ??
      0,

    live_clock_started_at:
      live.live_clock_started_at ??
      null,

    live_started_at:
      live.live_started_at ??
      null,

    live_finished_at:
      live.live_finished_at ??
      null,
  };
}

export async function getLiveMatchById(
  id: string,
): Promise<LiveMatchState> {
  return getLiveMatchState(
    id,
  );
}

function calculateRunningClock(
  state: LiveMatchState,
): number {
  let seconds =
    state.live_clock_seconds;

  if (
    (
      state.live_phase ===
        "first_half" ||
      state.live_phase ===
        "second_half"
    ) &&
    state.live_clock_started_at
  ) {
    const startedAt =
      new Date(
        state.live_clock_started_at,
      ).getTime();

    if (
      Number.isFinite(
        startedAt,
      )
    ) {
      seconds +=
        Math.max(
          0,
          Math.floor(
            (
              Date.now() -
              startedAt
            ) /
              1000,
          ),
        );
    }
  }

  return seconds;
}

export async function startLiveMatch(
  matchId: string,
): Promise<void> {
  const state =
    await getLiveMatchState(
      matchId,
    );

  if (
    state.live_phase !==
    "not_started"
  ) {
    throw new InputError(
      "El partido ya ha sido iniciado.",
    );
  }

  const now =
    new Date().toISOString();

  const supabase =
    await createServerSupabaseClient();

  /*
   * Iniciamos el reloj.
   */
  const {
    error: matchError,
  } =
    await supabase
      .from("matches")
      .update({
        live_phase:
          "first_half",

        live_clock_seconds:
          0,

        live_clock_started_at:
          now,

        live_started_at:
          now,

        live_finished_at:
          null,
      } as never)
      .eq(
        "id",
        matchId,
      );

  if (matchError) {
    throw matchError;
  }

  /*
   * Antes de colocar el XI inicial
   * limpiamos cualquier estado de campo
   * o expulsión anterior.
   */
  const {
    error: resetFieldError,
  } =
    await supabase
      .from("match_players")
      .update({
        on_field:
          false,

        entered_minute:
          null,

        card_dismissed:
          false,

        dismissal_minute:
          null,
      } as never)
      .eq(
        "match_id",
        matchId,
      );

  if (resetFieldError) {
    throw resetFieldError;
  }

  /*
   * Colocamos únicamente a los titulares
   * en el campo desde el minuto 0.
   */
  const {
    error: startersError,
  } =
    await supabase
      .from("match_players")
      .update({
        on_field:
          true,

        entered_minute:
          0,
      } as never)
      .eq(
        "match_id",
        matchId,
      )
      .eq(
        "starter",
        true,
      );

  if (startersError) {
    throw startersError;
  }
}

export async function setLiveHalftime(
  matchId: string,
): Promise<void> {
  const state =
    await getLiveMatchState(
      matchId,
    );

  if (
    state.live_phase !==
    "first_half"
  ) {
    throw new InputError(
      "Solo puedes iniciar el descanso durante la primera parte.",
    );
  }

  const clockSeconds =
    calculateRunningClock(
      state,
    );

  const supabase =
    await createServerSupabaseClient();

  const {
    error,
  } =
    await supabase
      .from("matches")
      .update({
        live_phase:
          "halftime",

        live_clock_seconds:
          clockSeconds,

        live_clock_started_at:
          null,
      } as never)
      .eq(
        "id",
        matchId,
      );

  if (error) {
    throw error;
  }
}

export async function startLiveSecondHalf(
  matchId: string,
): Promise<void> {
  const state =
    await getLiveMatchState(
      matchId,
    );

  if (
    state.live_phase !==
    "halftime"
  ) {
    throw new InputError(
      "Debes poner primero el partido en descanso.",
    );
  }

  const now =
    new Date().toISOString();

  const supabase =
    await createServerSupabaseClient();

  const {
    error,
  } =
    await supabase
      .from("matches")
      .update({
        live_phase:
          "second_half",

        live_clock_seconds:
          45 * 60,

        live_clock_started_at:
          now,
      } as never)
      .eq(
        "id",
        matchId,
      );

  if (error) {
    throw error;
  }
}

/*
 * FINALIZAR PARTIDO
 *
 * Al finalizar:
 * - cerramos los minutos
 * - guardamos el marcador final
 * - marcamos todas las estadísticas como completadas
 * - detenemos el cronómetro
 * - cerramos el partido
 */
export async function finishLiveMatch(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<void> {
  if (
    !Number.isInteger(
      homeScore,
    ) ||
    homeScore < 0
  ) {
    throw new InputError(
      "El resultado del equipo local no es válido.",
    );
  }

  if (
    !Number.isInteger(
      awayScore,
    ) ||
    awayScore < 0
  ) {
    throw new InputError(
      "El resultado del equipo visitante no es válido.",
    );
  }

  const state =
    await getLiveMatchState(
      matchId,
    );

  if (
    state.live_phase !==
    "second_half"
  ) {
    throw new InputError(
      "Solo puedes finalizar el partido durante la segunda parte.",
    );
  }

  /*
   * Cerramos los minutos de los
   * jugadores que siguen en campo.
   */
  await finalizeMatchPlayerMinutes(
    matchId,
  );

  const supabase =
    await createServerSupabaseClient();

  /*
   * Al finalizar ya consideramos revisadas
   * las estadísticas de todos los jugadores.
   *
   * Esto hará que aparezca automáticamente
   * el check verde sin tener que entrar
   * jugador por jugador.
   */
  const {
    error: completedError,
  } =
    await supabase
      .from("match_players")
      .update({
        stats_completed:
          true,
      } as never)
      .eq(
        "match_id",
        matchId,
      );

  if (completedError) {
    throw completedError;
  }

  const clockSeconds =
    calculateRunningClock(
      state,
    );

  const now =
    new Date().toISOString();

  const {
    error,
  } =
    await supabase
      .from("matches")
      .update({
        home_score:
          homeScore,

        away_score:
          awayScore,

        live_phase:
          "finished",

        live_clock_seconds:
          clockSeconds,

        live_clock_started_at:
          null,

        live_finished_at:
          now,

        status:
          "finished",
      } as never)
      .eq(
        "id",
        matchId,
      );

  if (error) {
    throw error;
  }
}

/*
 * REINICIO COMPLETO DEL DIRECTO
 *
 * Conservamos:
 * - convocatoria
 * - XI inicial
 *
 * Limpiamos:
 * - marcador
 * - reloj
 * - eventos
 * - quién está en campo
 * - minutos automáticos
 * - estadísticas del partido
 * - estado de completado
 *
 * Así el partido vuelve realmente
 * a su estado previo al inicio.
 */
export async function resetLiveMatch(
  matchId: string,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  /*
   * Reiniciamos completamente
   * el estado del partido.
   */
  const {
    error: matchError,
  } =
    await supabase
      .from("matches")
      .update({
        home_score:
          null,

        away_score:
          null,

        live_phase:
          "not_started",

        live_clock_seconds:
          0,

        live_clock_started_at:
          null,

        live_started_at:
          null,

        live_finished_at:
          null,

        status:
          "scheduled",
      } as never)
      .eq(
        "id",
        matchId,
      );

  if (matchError) {
    throw matchError;
  }

  /*
   * Eliminamos toda la cronología
   * del intento anterior:
   *
   * goles
   * asistencias
   * amarillas
   * rojas
   * sustituciones
   */
  const {
    error: eventsError,
  } =
    await supabase
      .from("match_events")
      .delete()
      .eq(
        "match_id",
        matchId,
      );

  if (eventsError) {
    throw eventsError;
  }

  /*
   * Restauramos todos los jugadores.
   *
   * Conservamos:
   * - convocatoria
   * - titular / suplente
   *
   * Limpiamos:
   * - minutos
   * - estadísticas
   * - estado en campo
   * - expulsión automática
   * - portería a cero
   * - estado completado
   */
  const {
    error: playersError,
  } =
    await supabase
      .from("match_players")
      .update({
        on_field:
          false,

        entered_minute:
          null,

        card_dismissed:
          false,

        dismissal_minute:
          null,

        minutes_played:
          0,

        goals:
          0,

        assists:
          0,

        yellow_cards:
          0,

        red_cards:
          0,

        clean_sheet:
          false,

        stats_completed:
          false,
      } as never)
      .eq(
        "match_id",
        matchId,
      );

  if (playersError) {
    throw playersError;
  }
}