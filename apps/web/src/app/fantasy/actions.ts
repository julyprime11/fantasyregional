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
  leaveFantasyLeague,
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
export type LeaveLeagueState = {
  status: "idle" | "error";
  message: string;
};

/**
 * El cliente envía solo el ID de la liga; nunca decide qué usuario
 * eliminar. La sesión y la política RLS verifican la identidad.
 */
export async function leaveFantasyLeagueAction(
  leagueId: string,
  _previous: LeaveLeagueState,
  _form: FormData,
): Promise<LeaveLeagueState> {
  const user = await requireUser();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leagueId)) {
    return {
      status: "error",
      message: "La liga seleccionada no es válida.",
    };
  }

  try {
    const removed = await leaveFantasyLeague(leagueId, user.id);
    if (!removed) {
      return {
        status: "error",
        message: "Ya no perteneces a esa liga. Recarga la página.",
      };
    }

    revalidatePath("/fantasy", "layout");
    revalidatePath("/fantasy/leagues");
    revalidatePath("/");
  } catch {
    return {
      status: "error",
      message: "No se pudo abandonar la liga. Inténtalo de nuevo.",
    };
  }

  redirect("/fantasy");
}
