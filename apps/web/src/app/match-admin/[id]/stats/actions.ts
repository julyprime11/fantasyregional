"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  InputError,
  parseMatchId,
  parseMatchPlayerId,
} from "@regional-fantasy/shared";

import {
  finishLiveMatch,
  resetLiveMatch,
  setLiveHalftime,
  startLiveMatch,
  startLiveSecondHalf,
} from "@/data/matches";

import {
  updateMatchPlayerQuickStat,
  updateTeamCleanSheet,
  type QuickStatField,
} from "@/data/match-players";

import {
  performMatchSubstitution,
} from "@/data/match-events";

import {
  currentUserIsAdmin,
} from "@/lib/admin-auth";

export type LiveMatchActionState = {
  status:
    | "idle"
    | "success"
    | "error";

  message: string;
};

export type QuickStatActionState =
  LiveMatchActionState & {
    value?: number;
  };

export type SubstitutionActionState =
  LiveMatchActionState & {
    minute?: number;
  };

const forbiddenState: LiveMatchActionState = {
  status:
    "error",

  message:
    "No tienes permisos para gestionar el partido.",
};

async function requireAdmin(): Promise<
  LiveMatchActionState | null
> {
  const allowed =
    await currentUserIsAdmin();

  if (!allowed) {
    return forbiddenState;
  }

  return null;
}

function refreshMatch(
  matchId: string,
) {
  revalidatePath(
    `/match-admin/${matchId}`,
  );

  revalidatePath(
    `/match-admin/${matchId}/stats`,
  );

  revalidatePath(
    `/match-admin/${matchId}/results`,
  );

  revalidatePath(
    "/match-admin",
  );
}

export async function startLiveMatchAction(
  matchId: string,
): Promise<LiveMatchActionState> {
  const forbidden =
    await requireAdmin();

  if (forbidden) {
    return forbidden;
  }

  try {
    const parsedMatchId =
      parseMatchId(
        matchId,
      );

    await startLiveMatch(
      parsedMatchId,
    );

    refreshMatch(
      parsedMatchId,
    );

    return {
      status:
        "success",

      message:
        "Partido iniciado.",
    };
  } catch (error) {
    return {
      status:
        "error",

      message:
        error instanceof
        InputError
          ? error.message
          : "No se pudo iniciar el partido.",
    };
  }
}

export async function setLiveHalftimeAction(
  matchId: string,
): Promise<LiveMatchActionState> {
  const forbidden =
    await requireAdmin();

  if (forbidden) {
    return forbidden;
  }

  try {
    const parsedMatchId =
      parseMatchId(
        matchId,
      );

    await setLiveHalftime(
      parsedMatchId,
    );

    refreshMatch(
      parsedMatchId,
    );

    return {
      status:
        "success",

      message:
        "Partido en descanso.",
    };
  } catch (error) {
    return {
      status:
        "error",

      message:
        error instanceof
        InputError
          ? error.message
          : "No se pudo iniciar el descanso.",
    };
  }
}

export async function startLiveSecondHalfAction(
  matchId: string,
): Promise<LiveMatchActionState> {
  const forbidden =
    await requireAdmin();

  if (forbidden) {
    return forbidden;
  }

  try {
    const parsedMatchId =
      parseMatchId(
        matchId,
      );

    await startLiveSecondHalf(
      parsedMatchId,
    );

    refreshMatch(
      parsedMatchId,
    );

    return {
      status:
        "success",

      message:
        "Segunda parte iniciada.",
    };
  } catch (error) {
    return {
      status:
        "error",

      message:
        error instanceof
        InputError
          ? error.message
          : "No se pudo iniciar la segunda parte.",
    };
  }
}

/*
 * FINALIZAR PARTIDO CON MARCADOR
 */
export async function finishLiveMatchAction(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<LiveMatchActionState> {
  const forbidden =
    await requireAdmin();

  if (forbidden) {
    return forbidden;
  }

  try {
    const parsedMatchId =
      parseMatchId(
        matchId,
      );

    if (
      !Number.isInteger(
        homeScore,
      ) ||
      homeScore < 0 ||
      homeScore > 99
    ) {
      throw new InputError(
        "Introduce un resultado válido para el equipo local.",
      );
    }

    if (
      !Number.isInteger(
        awayScore,
      ) ||
      awayScore < 0 ||
      awayScore > 99
    ) {
      throw new InputError(
        "Introduce un resultado válido para el equipo visitante.",
      );
    }

    await finishLiveMatch(
      parsedMatchId,
      homeScore,
      awayScore,
    );

    refreshMatch(
      parsedMatchId,
    );

    return {
      status:
        "success",

      message:
        `Partido finalizado: ${homeScore} - ${awayScore}.`,
    };
  } catch (error) {
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
            : "No se pudo finalizar el partido.",
    };
  }
}

export async function resetLiveMatchAction(
  matchId: string,
): Promise<LiveMatchActionState> {
  const forbidden =
    await requireAdmin();

  if (forbidden) {
    return forbidden;
  }

  try {
    const parsedMatchId =
      parseMatchId(
        matchId,
      );

    await resetLiveMatch(
      parsedMatchId,
    );

    refreshMatch(
      parsedMatchId,
    );

    return {
      status:
        "success",

      message:
        "Partido reiniciado. El cronómetro, el marcador y las estadísticas vuelven a cero.",
    };
  } catch (error) {
    return {
      status:
        "error",

      message:
        error instanceof
        InputError
          ? error.message
          : "No se pudo reiniciar el partido.",
    };
  }
}

export async function updateQuickPlayerStatAction(
  matchId: string,
  entryId: string,
  field: QuickStatField,
  delta: 1 | -1,
): Promise<QuickStatActionState> {
  const forbidden =
    await requireAdmin();

  if (forbidden) {
    return forbidden;
  }

  try {
    const parsedMatchId =
      parseMatchId(
        matchId,
      );

    const parsedEntryId =
      parseMatchPlayerId(
        entryId,
      );

    const allowedFields:
      QuickStatField[] = [
        "goals",
        "assists",
        "yellow_cards",
        "red_cards",
      ];

    if (
      !allowedFields.includes(
        field,
      )
    ) {
      throw new InputError(
        "La estadística seleccionada no es válida.",
      );
    }

    if (
      delta !== 1 &&
      delta !== -1
    ) {
      throw new InputError(
        "El incremento no es válido.",
      );
    }

    const value =
      await updateMatchPlayerQuickStat(
        parsedMatchId,
        parsedEntryId,
        field,
        delta,
      );

    revalidatePath(
      `/match-admin/${parsedMatchId}/stats`,
    );

    revalidatePath(
      `/match-admin/${parsedMatchId}/results`,
    );

    return {
      status:
        "success",

      message:
        "Estadística actualizada.",

      value,
    };
  } catch (error) {
    console.error(
      "updateQuickPlayerStatAction:",
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
            : "No se pudo actualizar la estadística.",
    };
  }
}

/*
 * PORTERÍA A CERO
 */
export async function updateTeamCleanSheetAction(
  matchId: string,
  teamId: string,
  cleanSheet: boolean,
): Promise<LiveMatchActionState> {
  const forbidden =
    await requireAdmin();

  if (forbidden) {
    return forbidden;
  }

  try {
    const parsedMatchId =
      parseMatchId(
        matchId,
      );

    if (
      !teamId.trim()
    ) {
      throw new InputError(
        "El equipo no es válido.",
      );
    }

    await updateTeamCleanSheet(
      parsedMatchId,
      teamId,
      cleanSheet,
    );

    revalidatePath(
      `/match-admin/${parsedMatchId}/stats`,
    );

    revalidatePath(
      `/match-admin/${parsedMatchId}/results`,
    );

    return {
      status:
        "success",

      message:
        cleanSheet
          ? "Portería a cero activada para todo el equipo."
          : "Portería a cero desactivada para todo el equipo.",
    };
  } catch (error) {
    console.error(
      "updateTeamCleanSheetAction:",
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
            : "No se pudo actualizar la portería a cero.",
    };
  }
}

export async function performMatchSubstitutionAction(
  matchId: string,
  playerOutEntryId: string,
  playerInEntryId: string,
): Promise<SubstitutionActionState> {
  const forbidden =
    await requireAdmin();

  if (forbidden) {
    return forbidden;
  }

  try {
    const parsedMatchId =
      parseMatchId(
        matchId,
      );

    const parsedPlayerOutEntryId =
      parseMatchPlayerId(
        playerOutEntryId,
      );

    const parsedPlayerInEntryId =
      parseMatchPlayerId(
        playerInEntryId,
      );

    const result =
      await performMatchSubstitution(
        parsedMatchId,
        parsedPlayerOutEntryId,
        parsedPlayerInEntryId,
      );

    revalidatePath(
      `/match-admin/${parsedMatchId}/stats`,
    );

    revalidatePath(
      `/match-admin/${parsedMatchId}/results`,
    );

    return {
      status:
        "success",

      message:
        `Sustitución registrada en el minuto ${result.minute}.`,

      minute:
        result.minute,
    };
  } catch (error) {
    console.error(
      "performMatchSubstitutionAction:",
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
            : "No se pudo registrar la sustitución.",
    };
  }
}