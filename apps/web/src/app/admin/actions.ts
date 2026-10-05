"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  InputError,
  parseClubInput,
  parseTeamInput,
  parsePlayerInput,
  parsePlayerId,
  parseStaffInput,
  parseStaffId,
  parseMatchInput,
  parseMatchId,
  parseMatchPlayerId,
  parseMatchPlayerStats,
} from "@regional-fantasy/shared";

import {
  createClub,
  deleteClub,
} from "@/data/clubs";

import {
  createTeam,
} from "@/data/teams";

import {
  createPlayer,
  updatePlayer,
  deletePlayer,
} from "@/data/players";

import {
  createStaff,
  updateStaff,
} from "@/data/staff";

import {
  createMatch,
  updateMatch,
  deleteMatch,
} from "@/data/matches";

import {
  addMatchPlayer,
  updateMatchPlayerStats,
  updateMatchPlayerStarter,
  removeMatchPlayer,
} from "@/data/match-players";

import {
  currentUserIsAdmin,
} from "@/lib/admin-auth";

export type FormState = {
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

const forbiddenState: FormState = {
  status:
    "error",

  message:
    "No tienes permisos para realizar esta acción.",
};

async function requireAdminAction(): Promise<
  FormState | null
> {
  const allowed =
    await currentUserIsAdmin();

  if (!allowed) {
    return forbiddenState;
  }

  return null;
}

async function save<T>(
  form: FormData,

  parse: (
    input: Record<
      string,
      unknown
    >,
  ) => T,

  mutate: (
    input: T,
  ) => Promise<void>,

  successMessage =
    "Registro creado correctamente.",
): Promise<FormState> {
  const raw =
    Object.fromEntries(
      form,
    );

  const values: Record<
    string,
    string
  > = {};

  for (const [
    key,
    value,
  ] of form) {
    if (
      !key.startsWith(
        "$ACTION_",
      ) &&
      typeof value ===
        "string"
    ) {
      values[key] =
        value;
    }
  }

  let input: T;

  try {
    input =
      parse(
        raw,
      );
  } catch (error) {
    return {
      status:
        "error",

      message:
        error instanceof
        InputError
          ? error.message
          : "Revisa los datos del formulario.",

      values,
    };
  }

  try {
    await mutate(
      input,
    );
  } catch (error) {
    return {
      status:
        "error",

      message:
        error instanceof
        InputError
          ? error.message
          : "No se pudo guardar. Comprueba que el registro y las opciones seleccionadas sigan existiendo e inténtalo de nuevo.",

      values,
    };
  }

  revalidatePath(
    "/admin",
    "layout",
  );

  revalidatePath(
    "/match-admin",
    "layout",
  );

  revalidatePath(
    "/",
  );

  return {
    status:
      "success",

    message:
      successMessage,
  };
}

export async function createClubAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  return save(
    form,
    parseClubInput,
    createClub,
  );
}
export async function deleteClubAction(
  clubId: string,
  _previous: FormState,
  _form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  try {
    await deleteClub(
      clubId,
    );

    revalidatePath(
      "/admin/clubs",
    );

    revalidatePath(
      "/admin",
    );

    revalidatePath(
      "/",
    );

    return {
      status:
        "success",

      message:
        "Club eliminado correctamente.",
    };
  } catch (error) {
    return {
      status:
        "error",

      message:
        error instanceof
        InputError
          ? error.message
          : "No se pudo eliminar el club.",
    };
  }
}

export async function addMatchPlayerAction(
  matchId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  return save(
    form,

    (input) => ({
      matchId:
        parseMatchId(
          matchId,
        ),

      playerId:
        parsePlayerId(
          input.player_id,
        ),
    }),

    (input) =>
      addMatchPlayer(
        input.matchId,
        input.playerId,
      ),

    "Jugador añadido a la convocatoria.",
  );
}

export async function updateMatchPlayerAction(
  matchId: string,
  entryId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  return save(
    form,

    (input) => ({
      matchId:
        parseMatchId(
          matchId,
        ),

      entryId:
        parseMatchPlayerId(
          entryId,
        ),

      stats:
        parseMatchPlayerStats(
          input,
        ),
    }),

    (input) =>
      updateMatchPlayerStats(
        input.matchId,
        input.entryId,
        input.stats,
      ),

    "Estadísticas guardadas correctamente.",
  );
}

export async function updateMatchPlayerStarterAction(
  matchId: string,
  entryId: string,
  starter: boolean,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

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

    await updateMatchPlayerStarter(
      parsedMatchId,
      parsedEntryId,
      starter,
    );

    revalidatePath(
      `/match-admin/${parsedMatchId}/stats`,
    );

    return {
      status:
        "success",

      message:
        starter
          ? "Jugador marcado como titular."
          : "Jugador retirado del once inicial.",
    };
  } catch (error) {
    return {
      status:
        "error",

      message:
        error instanceof
        InputError
          ? error.message
          : "No se pudo actualizar el once inicial.",
    };
  }
}

export async function removeMatchPlayerAction(
  matchId: string,
  entryId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  return save(
    form,

    () => ({
      matchId:
        parseMatchId(
          matchId,
        ),

      entryId:
        parseMatchPlayerId(
          entryId,
        ),
    }),

    (input) =>
      removeMatchPlayer(
        input.matchId,
        input.entryId,
      ),

    "Jugador retirado de la convocatoria.",
  );
}

export async function createMatchAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  return save(
    form,
    parseMatchInput,
    createMatch,
  );
}

export async function updateMatchAction(
  matchId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  const parsedMatchId =
    parseMatchId(
      matchId,
    );

  const result =
    await save(
      form,

      (input) => ({
        id:
          parsedMatchId,

        match:
          parseMatchInput(
            input,
          ),
      }),

      ({
        id,
        match,
      }) =>
        updateMatch(
          id,
          match,
        ),

      "Partido actualizado correctamente.",
    );

  if (
    result.status ===
    "success"
  ) {
    revalidatePath(
      `/match-admin/${parsedMatchId}`,
    );

    revalidatePath(
      `/admin/matches/${parsedMatchId}/edit`,
    );

    redirect(
      `/match-admin/${parsedMatchId}`,
    );
  }

  return result;
}
export async function deleteMatchAction(
  matchId: string,
  _previous: FormState,
  _form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  try {
    const parsedMatchId =
      parseMatchId(
        matchId,
      );

    await deleteMatch(
      parsedMatchId,
    );

    revalidatePath(
      "/admin/matches",
    );

    revalidatePath(
      "/match-admin",
    );

    revalidatePath(
      "/fantasy",
      "layout",
    );

    revalidatePath(
      "/",
    );

    return {
      status:
        "success",

      message:
        "Partido eliminado correctamente.",
    };
  } catch (error) {
    return {
      status:
        "error",

      message:
        error instanceof
        InputError
          ? error.message
          : "No se pudo eliminar el partido.",
    };
  }
}
export async function createTeamAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  return save(
    form,
    parseTeamInput,
    createTeam,
  );
}

export async function createPlayerAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  return save(
    form,
    parsePlayerInput,
    createPlayer,
  );
}

export async function updatePlayerAction(
  playerId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  const result =
    await save(
      form,

      (input) => ({
        id:
          parsePlayerId(
            playerId,
          ),

        player:
          parsePlayerInput(
            input,
          ),
      }),

      ({
        id,
        player,
      }) =>
        updatePlayer(
          id,
          player,
        ),

      "Jugador actualizado correctamente.",
    );

  if (
    result.status ===
    "success"
  ) {
    redirect(
      "/admin/players",
    );
  }

  return result;
}
export async function deletePlayerAction(
  playerId: string,
  _previous: FormState,
  _form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  try {
    const parsedPlayerId =
      parsePlayerId(
        playerId,
      );

    await deletePlayer(
      parsedPlayerId,
    );

    revalidatePath(
      "/admin/players",
    );

    revalidatePath(
      "/admin",
    );

    revalidatePath(
      "/fantasy",
      "layout",
    );

    revalidatePath(
      "/",
    );

    return {
      status:
        "success",

      message:
        "Jugador eliminado correctamente.",
    };
  } catch (error) {
    return {
      status:
        "error",

      message:
        error instanceof
        InputError
          ? error.message
          : "No se pudo eliminar el jugador.",
    };
  }
}
export async function createStaffAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  return save(
    form,
    parseStaffInput,
    createStaff,
  );
}

export async function updateStaffAction(
  staffId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const forbidden =
    await requireAdminAction();

  if (forbidden) {
    return forbidden;
  }

  const result =
    await save(
      form,

      (input) => ({
        id:
          parseStaffId(
            staffId,
          ),

        staff:
          parseStaffInput(
            input,
          ),
      }),

      ({
        id,
        staff,
      }) =>
        updateStaff(
          id,
          staff,
        ),

      "Miembro del cuerpo técnico actualizado correctamente.",
    );

  if (
    result.status ===
    "success"
  ) {
    redirect(
      "/admin/staff",
    );
  }

  return result;
}