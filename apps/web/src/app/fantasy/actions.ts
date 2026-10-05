"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  deleteFantasyLeague,
  getFantasyLeagueById,
} from "@/data/fantasy-leagues";

import {
  requireUser,
} from "@/lib/auth";

import {
  currentUserIsAdmin,
} from "@/lib/admin-auth";

export type DeleteLeagueState = {
  status:
    | "idle"
    | "error"
    | "success";

  message: string;
};

export async function deleteFantasyLeagueAction(
  leagueId: string,
  _previous: DeleteLeagueState,
  _form: FormData,
): Promise<DeleteLeagueState> {
  const user =
    await requireUser();

  try {
    const league =
      await getFantasyLeagueById(
        leagueId,
      );

    if (!league) {
      return {
        status:
          "error",

        message:
          "La liga ya no existe.",
      };
    }

    const isAdmin =
      await currentUserIsAdmin();

    const isCreator =
      league.created_by ===
      user.id;

    if (
      !isCreator &&
      !isAdmin
    ) {
      return {
        status:
          "error",

        message:
          "Solo el creador de la liga o Directiva puede eliminarla.",
      };
    }

    await deleteFantasyLeague(
      league.id,
    );

    revalidatePath(
      "/fantasy",
    );

    revalidatePath(
      "/fantasy/leagues",
    );

    revalidatePath(
      "/",
    );
  } catch {
    return {
      status:
        "error",

      message:
        "No se pudo eliminar la liga.",
    };
  }

  redirect(
    "/fantasy",
  );
}