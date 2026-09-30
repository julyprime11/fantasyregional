"use server";

import { revalidatePath } from "next/cache";

import { InputError } from "@regional-fantasy/shared";

import { submitMatchRatings } from "@/data/ratings";
import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type VoteState = {
  status: "idle" | "error" | "success";
  message: string;
  values?: Record<string, string>;
};

export async function submitVotesAction(
  matchId: string,
  _previous: VoteState,
  form: FormData,
): Promise<VoteState> {
  /*
   * Solo conservamos las notas.
   * voter_id y voter_role ya no vienen del navegador.
   */
  const values: Record<string, string> = {};

  for (const [key, value] of form) {
    if (
      key.startsWith("score:") &&
      typeof value === "string"
    ) {
      values[key] = value;
    }
  }

  try {
    const user =
      await requireUser();

    const supabase =
      await createServerSupabaseClient();

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select(
          "id, display_name, voter_role",
        )
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      return {
        status: "error",
        message:
          "No se ha encontrado el perfil del usuario.",
        values,
      };
    }

    if (
      !profile.voter_role ||
      profile.voter_role.trim() === ""
    ) {
      return {
        status: "error",
        message:
          "Tu usuario no tiene un rol de votación asignado.",
        values,
      };
    }

    /*
     * Construimos nosotros mismos los datos
     * que necesita submitMatchRatings().
     *
     * El usuario no puede modificar su UUID
     * ni su rol desde el formulario.
     */
    const raw: Record<string, unknown> = {
      ...Object.fromEntries(form),
      voter_id: user.id,
      voter_role:
        profile.voter_role,
    };

    const count =
      await submitMatchRatings(
        matchId,
        raw,
      );

    revalidatePath(
      `/matches/${matchId}/vote`,
    );

    revalidatePath(
      `/match-admin/${matchId}/vote`,
    );

    revalidatePath(
      `/match-admin/${matchId}/results`,
    );

    return {
      status: "success",
      message: `Se han guardado ${count} ${
        count === 1
          ? "voto"
          : "votos"
      } correctamente.`,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof InputError
          ? error.message
          : "No se pudieron guardar los votos. Inténtalo de nuevo.",
      values,
    };
  }
}