"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  InputError,
  parseMatchId,
} from "@regional-fantasy/shared";

import {
  submitMatchRatings,
} from "@/data/ratings";

import {
  requireUser,
} from "@/lib/auth";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

import {
  canVote,
} from "@/lib/roles";

export type VoteState = {
  status:
    | "idle"
    | "error"
    | "success";

  message: string;

  values?: Record<
    string,
    string
  >;
};

export async function submitVotesAction(
  matchId: string,
  _previous: VoteState,
  form: FormData,
): Promise<VoteState> {
  const values: Record<
    string,
    string
  > = {};

  const deletePlayerIds:
    string[] = [];

  /*
   * score:UUID
   *   -> voto nuevo/modificado
   *
   * delete:UUID
   *   -> voto existente eliminado
   */
  for (
    const [
      key,
      value,
    ] of form
  ) {
    if (
      key.startsWith(
        "score:",
      ) &&
      typeof value ===
        "string"
    ) {
      values[key] =
        value;
    }

    if (
      key.startsWith(
        "delete:",
      ) &&
      value ===
        "1"
    ) {
      deletePlayerIds.push(
        key.slice(
          "delete:".length,
        ),
      );
    }
  }

  try {
    const user =
      await requireUser();

    const parsedMatchId =
      parseMatchId(
        matchId,
      );

    const supabase =
      await createServerSupabaseClient();

    const {
      data: profile,
      error:
        profileError,
    } =
      await supabase
        .from(
          "profiles",
        )
        .select(
          "id, display_name, voter_role",
        )
        .eq(
          "id",
          user.id,
        )
        .maybeSingle();

    if (
      profileError
    ) {
      throw profileError;
    }

    if (!profile) {
      return {
        status:
          "error",

        message:
          "No se ha encontrado el perfil del usuario.",

        values,
      };
    }

    if (
      !canVote(
        profile.voter_role,
      )
    ) {
      return {
        status:
          "error",

        message:
          "Tu usuario no tiene permisos para votar.",

        values,
      };
    }

    /*
     * Comprobación temprana para mostrar
     * mensajes amigables en pantalla.
     *
     * ratings.ts vuelve a comprobarlo antes
     * de modificar la base de datos.
     */
    const {
      data: match,
      error:
        matchError,
    } =
      await supabase
        .from(
          "matches",
        )
        .select(
          `
            id,
            status,
            voting_opens_at,
            voting_closes_at
          `,
        )
        .eq(
          "id",
          parsedMatchId,
        )
        .maybeSingle();

    if (
      matchError
    ) {
      throw matchError;
    }

    if (!match) {
      return {
        status:
          "error",

        message:
          "El partido ya no está disponible.",

        values,
      };
    }

    if (
      match.status !==
      "voting"
    ) {
      return {
        status:
          "error",

        message:
          "La votación de este partido no está abierta.",

        values,
      };
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
        return {
          status:
            "error",

          message:
            "El plazo de votación todavía no ha comenzado.",

          values,
        };
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
        return {
          status:
            "error",

          message:
            "El plazo de votación ha finalizado.",

          values,
        };
      }
    }

    /*
     * Solo enviamos los datos reales del formulario.
     *
     * El usuario y su rol se resuelven de nuevo
     * dentro de submitMatchRatings().
     */
    const raw: Record<
      string,
      unknown
    > =
      Object.fromEntries(
        form,
      );

    const result =
      await submitMatchRatings(
        parsedMatchId,
        raw,
        deletePlayerIds,
      );

    revalidatePath(
      `/matches/${parsedMatchId}/vote`,
    );

    revalidatePath(
      `/match-admin/${parsedMatchId}/vote`,
    );

    revalidatePath(
      `/match-admin/${parsedMatchId}/results`,
    );

    revalidatePath(
      `/match-admin/${parsedMatchId}`,
    );

    const totalChanges =
      result.saved +
      result.deleted;

    let message =
      "Cambios guardados correctamente.";

    if (
      result.saved >
        0 &&
      result.deleted ===
        0
    ) {
      message =
        result.saved ===
        1
          ? "Valoración guardada correctamente."
          : `${result.saved} valoraciones guardadas correctamente.`;
    }

    if (
      result.saved ===
        0 &&
      result.deleted >
        0
    ) {
      message =
        result.deleted ===
        1
          ? "Valoración eliminada correctamente."
          : `${result.deleted} valoraciones eliminadas correctamente.`;
    }

    if (
      result.saved >
        0 &&
      result.deleted >
        0
    ) {
      message =
        `${totalChanges} cambios guardados correctamente.`;
    }

    return {
      status:
        "success",

      message,
    };
  } catch (error) {
    console.error(
      "submitVotesAction:",
      error,
    );

    return {
      status:
        "error",

      message:
        error instanceof
        InputError
          ? error.message
          : error instanceof
              Error
            ? error.message
            : "No se pudieron guardar las valoraciones. Inténtalo de nuevo.",

      values,
    };
  }
}