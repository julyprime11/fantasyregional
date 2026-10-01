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
  /*
   * Solo conservamos las notas.
   *
   * voter_id y voter_role nunca se aceptan
   * desde el navegador.
   */
  const values: Record<
    string,
    string
  > = {};

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

    /*
     * PERFIL Y ROL
     */
    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select(
          "id, display_name, voter_role",
        )
        .eq(
          "id",
          user.id,
        )
        .maybeSingle();

    if (profileError) {
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

    /*
     * Aquí está la nueva seguridad.
     *
     * jugador -> NO
     * player -> SÍ
     * entrenador -> SÍ
     * cuerpo_tecnico -> SÍ
     * directiva -> SÍ
     */
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
     * COMPROBAMOS EL PARTIDO DESDE EL SERVIDOR
     */
    const {
      data: match,
      error: matchError,
    } =
      await supabase
        .from("matches")
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

    if (matchError) {
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

    /*
     * El partido debe estar expresamente
     * en estado voting.
     */
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

    /*
     * Si se ha configurado fecha de apertura,
     * no permitimos votar antes.
     */
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

    /*
     * Si se ha configurado fecha de cierre,
     * no permitimos votar después.
     */
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
     * Los datos sensibles los construimos
     * exclusivamente en el servidor.
     */
    const raw: Record<
      string,
      unknown
    > = {
      ...Object.fromEntries(
        form,
      ),

      voter_id:
        user.id,

      voter_role:
        profile.voter_role,
    };

    const count =
      await submitMatchRatings(
        parsedMatchId,
        raw,
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

    return {
      status:
        "success",

      message:
        `Se han guardado ${count} ${
          count ===
          1
            ? "voto"
            : "votos"
        } correctamente.`,
    };
  } catch (error) {
    return {
      status:
        "error",

      message:
        error instanceof
        InputError
          ? error.message
          : "No se pudieron guardar los votos. Inténtalo de nuevo.",

      values,
    };
  }
}