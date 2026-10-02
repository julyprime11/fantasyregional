"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  syncCastelloPlayersFromFfcv,
} from "@/data/ffcv";

import {
  currentUserIsAdmin,
} from "@/lib/admin-auth";

export type FfcvSyncActionState = {
  status:
    | "idle"
    | "success"
    | "error";

  message: string;

  summary?: {
    total: number;
    matched: number;
    updated: number;
    unmatched: string[];
    errors: string[];
  };
};

/*
 * IMPORTANTE:
 *
 * Cambia este UUID por el ID real del equipo
 * Castelló de les Gerres en tu tabla teams.
 */
const CASTELLO_TEAM_ID =
  "233ed8c1-07dc-4c63-99ef-c8b241e78a03";

export async function syncFfcvAction(
  _previous: FfcvSyncActionState,
): Promise<FfcvSyncActionState> {
  const allowed =
    await currentUserIsAdmin();

  if (!allowed) {
    return {
      status:
        "error",

      message:
        "No tienes permisos para realizar esta sincronización.",
    };
  }

  try {
    const result =
      await syncCastelloPlayersFromFfcv(
        CASTELLO_TEAM_ID,
      );

    revalidatePath(
      "/admin/ffcv-sync",
    );

    revalidatePath(
      "/fantasy",
    );

    return {
      status:
        "success",

      message:
        `Sincronización completada: ${result.updated} jugadores actualizados.`,

      summary:
        result,
    };
  } catch (error) {
    console.error(
      "syncFfcvAction:",
      error,
    );

    return {
      status:
        "error",

      message:
        error instanceof
        Error
          ? error.message
          : "No se pudo sincronizar la plantilla con FFCV.",
    };
  }
}