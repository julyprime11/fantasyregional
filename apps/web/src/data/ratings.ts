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

export type SubmitMatchRatingsResult = {
  saved: number;
  deleted: number;
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

/*
 * Comprueba que la votación continúa abierta
 * en el momento exacto de modificar los votos.
 */
async function assertVotingOpen(
  matchId: string,
): Promise<void> {
  const match =
    await getMatchById(
      matchId,
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

  const now =
    Date.now();

  if (
    match.voting_opens_at
  ) {
    const opensAt =
      new Date(
        match.voting_opens_at,
      ).getTime();

    if (
      Number.isFinite(
        opensAt,
      ) &&
      now <
        opensAt
    ) {
      throw new InputError(
        "El plazo de votación todavía no ha comenzado.",
      );
    }
  }

  if (
    match.voting_closes_at
  ) {
    const closesAt =
      new Date(
        match.voting_closes_at,
      ).getTime();

    if (
      Number.isFinite(
        closesAt,
      ) &&
      now >
        closesAt
    ) {
      throw new InputError(
        "El plazo de votación ha finalizado.",
      );
    }
  }
}

export async function submitMatchRatings(
  matchId: string,
  raw: Record<string, unknown>,
  deletePlayerIds: readonly string[] = [],
): Promise<SubmitMatchRatingsResult> {
  const id =
    parseMatchId(
      matchId,
    );

  /*
   * Extraemos los score:* existentes.
   *
   * parseRatingInput exige al menos un voto,
   * por lo que solo lo utilizamos si realmente
   * existen notas para guardar.
   */
  const hasScores =
    Object.keys(
      raw,
    ).some(
      (key) =>
        key.startsWith(
          "score:",
        ),
    );

  const input =
    hasScores
      ? parseRatingInput(
          raw,
        )
      : null;

  const voterIdRaw =
    raw.voter_id;

  const voterRoleRaw =
    raw.voter_role;

  if (
    typeof voterIdRaw !==
      "string" ||
    !voterIdRaw
  ) {
    throw new InputError(
      "Votante no válido.",
    );
  }

  if (
    typeof voterRoleRaw !==
      "string" ||
    !voterRoleRaw
  ) {
    throw new InputError(
      "Rol de votación no válido.",
    );
  }

  const voterId =
    voterIdRaw.toLowerCase();

  /*
   * No permitimos una petición vacía.
   */
  if (
    !input &&
    deletePlayerIds.length ===
      0
  ) {
    throw new InputError(
      "No hay cambios que guardar.",
    );
  }

  /*
   * Validamos la convocatoria.
   */
  const squad =
    await getMatchPlayers(
      id,
    );

  const squadPlayerIds =
    new Set(
      squad.map(
        (
          entry,
        ) =>
          entry.player_id,
      ),
    );

  if (
    input?.votes.some(
      (
        vote,
      ) =>
        !squadPlayerIds.has(
          vote.player_id,
        ),
    )
  ) {
    throw new InputError(
      "Solo puedes votar a jugadores de la convocatoria actual. Recarga la página.",
    );
  }

  if (
    deletePlayerIds.some(
      (
        playerId,
      ) =>
        !squadPlayerIds.has(
          playerId,
        ),
    )
  ) {
    throw new InputError(
      "Solo puedes modificar votos de jugadores de la convocatoria actual. Recarga la página.",
    );
  }

  /*
   * Última comprobación antes de escribir.
   */
  await assertVotingOpen(
    id,
  );

  const supabase =
    await createServerSupabaseClient();

  let deleted =
    0;

  /*
   * Primero eliminamos los votos que el
   * usuario haya marcado como borrados.
   *
   * Siempre filtramos también por voter_id:
   * nadie puede borrar votos de otro usuario.
   */
  const uniqueDeleteIds = [
    ...new Set(
      deletePlayerIds,
    ),
  ];

  if (
    uniqueDeleteIds.length >
    0
  ) {
    const {
      data:
        deletedRows,
      error:
        deleteError,
    } =
      await supabase
        .from("ratings")
        .delete()
        .eq(
          "match_id",
          id,
        )
        .eq(
          "voter_id",
          voterId,
        )
        .in(
          "player_id",
          uniqueDeleteIds,
        )
        .select(
          "id",
        );

    if (
      deleteError
    ) {
      throw deleteError;
    }

    deleted =
      deletedRows?.length ??
      0;
  }

  let saved =
    0;

  /*
   * Los votos nuevos o modificados se
   * guardan mediante UPSERT.
   *
   * La restricción UNIQUE:
   * match_id + player_id + voter_id
   *
   * garantiza un único voto por usuario.
   */
  if (
    input &&
    input.votes.length >
      0
  ) {
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
            voterId,

          voter_role:
            voterRoleRaw,

          score:
            vote.score,
        }),
      );

    const {
      error:
        upsertError,
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

    if (
      upsertError
    ) {
      throw upsertError;
    }

    saved =
      rows.length;
  }

  return {
    saved,
    deleted,
  };
}