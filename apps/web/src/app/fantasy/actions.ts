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
          "La liga no existe o ya ha sido retirada.",
      };
    }

    if (league.created_by !== user.id) {
      return {
        status: "error",
        message: "Solo el creador puede retirar su propia liga.",
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
        "No se pudo retirar la liga.",
    };
  }

  redirect(
    "/fantasy",
  );
}