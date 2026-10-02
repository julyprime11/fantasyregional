import "server-only";

import {
  InputError,
  parseMatchId,
  parseRatingInput,
} from "@regional-fantasy/shared";

import type {
  Database,
} from "@/lib/supabase/database.types";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

import {
  getMatchById,
} from "./matches";

import {
  getMatchPlayers,
} from "./match-players";

export type ExistingUserVote = {
  player_id: string;
  score: number;
};

export async function getUserMatchVotes(
  matchId: string,
  userId: string,
): Promise<ExistingUserVote[]> {
  const id =
    parseMatchId(
      matchId,
    );

  const supabase =
    await createServerSupabaseClient();

  const {
    data,
    error,
  } =
    await supabase
      .from("ratings")
      .select(
        `
          player_id,
          score
        `,
      )
      .eq(
        "match_id",
        id,
      )
      .eq(
        "voter_id",
        userId,
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

export async function submitMatchRatings(
  matchId: string,
  raw: Record<string, unknown>,
): Promise<number> {
  const id =
    parseMatchId(
      matchId,
    );

  const input =
    parseRatingInput(
      raw,
    );

  /*
   * Verificamos que los jugadores
   * pertenecen a la convocatoria actual.
   */
  const squad =
    await getMatchPlayers(
      id,
    );

  const playerIds =
    new Set(
      squad.map(
        (
          entry,
        ) =>
          entry.player_id,
      ),
    );

  if (
    input.votes.some(
      (
        vote,
      ) =>
        !playerIds.has(
          vote.player_id,
        ),
    )
  ) {
    throw new InputError(
      "Solo puedes votar a jugadores de la convocatoria actual. Recarga la página.",
    );
  }

  /*
   * Comprobamos el estado real del partido
   * en el momento exacto de guardar.
   *
   * Esto evita que alguien mantenga una
   * pantalla abierta y vote después de
   * haberse cerrado la votación.
   */
  const match =
    await getMatchById(
      id,
    );

  if (
    !match ||
    match.status !==
      "voting"
  ) {
    throw new InputError(
      "La votación de este partido no está abierta.",
    );
  }

  const supabase =
    await createServerSupabaseClient();

  /*
   * Un único voto por:
   *
   * match_id
   * + player_id
   * + voter_id
   *
   * Si todavía no existe:
   * INSERT
   *
   * Si ya existe:
   * UPDATE
   *
   * Esto permite modificar la nota
   * mientras la votación permanezca abierta,
   * sin generar votos duplicados.
   */
  const rows: Database["public"]["Tables"]["ratings"]["Insert"][] =
    input.votes.map(
      (
        vote,
      ) => ({
        match_id:
          id,

        player_id:
          vote.player_id,

        voter_id:
          input.voter_id,

        voter_role:
          input.voter_role,

        score:
          vote.score,
      }),
    );

  if (
    rows.length ===
    0
  ) {
    throw new InputError(
      "Introduce al menos una puntuación.",
    );
  }

  const {
    error,
  } =
    await supabase
      .from("ratings")
      .upsert(
        rows,
        {
          onConflict:
            "match_id,player_id,voter_id",
        },
      );

  if (error) {
    /*
     * Si aquí aparece 42P10 o un error
     * relacionado con ON CONFLICT,
     * significará que todavía falta
     * la restricción UNIQUE correcta
     * en PostgreSQL.
     */
    throw error;
  }

  return rows.length;
}