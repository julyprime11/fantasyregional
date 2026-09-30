import "server-only";

import {
  InputError,
  parseMatchId,
  parseRatingInput,
} from "@regional-fantasy/shared";

import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDevelopmentVotingEnabled } from "@/lib/development-voting";

import { getMatchById } from "./matches";
import { getMatchPlayers } from "./match-players";

export type ExistingUserVote = {
  player_id: string;
  score: number;
};

export async function getUserMatchVotes(
  matchId: string,
  userId: string,
): Promise<ExistingUserVote[]> {
  const id = parseMatchId(matchId);

  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("ratings")
      .select(
        `
          player_id,
          score
        `,
      )
      .eq("match_id", id)
      .eq("voter_id", userId)
      .order("created_at")
      .order("id");

  if (error) {
    throw error;
  }

  return data;
}

export async function submitMatchRatings(
  matchId: string,
  raw: Record<string, unknown>,
): Promise<number> {
  if (!isDevelopmentVotingEnabled()) {
    throw new InputError(
      "La votación temporal solo está disponible en desarrollo.",
    );
  }

  const id =
    parseMatchId(matchId);

  const input =
    parseRatingInput(raw);

  const squad =
    await getMatchPlayers(id);

  const playerIds =
    new Set(
      squad.map(
        (entry) =>
          entry.player_id,
      ),
    );

  if (
    input.votes.some(
      (vote) =>
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
   * Comprobamos el estado actual en el momento
   * de enviar, no solo al renderizar la página.
   */
  const match =
    await getMatchById(id);

  if (
    !match ||
    match.status !== "voting"
  ) {
    throw new InputError(
      "La votación de este partido no está abierta.",
    );
  }

  /*
   * Comprobación amigable antes del INSERT.
   * La restricción UNIQUE de PostgreSQL sigue siendo
   * la garantía definitiva contra condiciones de carrera.
   */
  const supabase =
    await createServerSupabaseClient();

  const votedPlayerIds =
    input.votes.map(
      (vote) =>
        vote.player_id,
    );

  if (
    votedPlayerIds.length > 0
  ) {
    const {
      data: existingVotes,
      error: existingVotesError,
    } =
      await supabase
        .from("ratings")
        .select("player_id")
        .eq("match_id", id)
        .eq(
          "voter_id",
          input.voter_id,
        )
        .in(
          "player_id",
          votedPlayerIds,
        );

    if (existingVotesError) {
      throw existingVotesError;
    }

    if (
      existingVotes.length >
      0
    ) {
      throw new InputError(
        "Ya has votado a uno o más de estos jugadores. Los jugadores ya votados no pueden volver a puntuarse.",
      );
    }
  }

  const rows: Database["public"]["Tables"]["ratings"]["Insert"][] =
    input.votes.map(
      (vote) => ({
        match_id: id,
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

  /*
   * Un único INSERT:
   * si falla una restricción, se rechaza
   * todo el lote.
   *
   * Nunca hacemos upsert de votos.
   */
  const { error } =
    await supabase
      .from("ratings")
      .insert(rows);

  if (
    error?.code ===
    "23505"
  ) {
    throw new InputError(
      "Ya has votado a uno o más de estos jugadores. No se guardó ningún voto de este envío.",
    );
  }

  if (error) {
    throw error;
  }

  return rows.length;
}