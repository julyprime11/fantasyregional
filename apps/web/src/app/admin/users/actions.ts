"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  InputError,
} from "@regional-fantasy/shared";

import {
  updateProfileVoterRole,
} from "@/data/profiles";

import {
  currentUserIsAdmin,
} from "@/lib/admin-auth";

export type UserRoleState = {
  status:
    | "idle"
    | "error"
    | "success";

  message: string;
};

const allowedRoles =
  new Set([
    "jugador",
    "player",
    "entrenador",
    "cuerpo_tecnico",
    "directiva",
  ]);

export async function updateUserVoterRoleAction(
  profileId: string,
  _previous: UserRoleState,
  form: FormData,
): Promise<UserRoleState> {
  const isAdmin =
    await currentUserIsAdmin();

  if (!isAdmin) {
    return {
      status:
        "error",

      message:
        "No tienes permisos para modificar roles.",
    };
  }

  try {
    const rawRole =
      form.get(
        "voter_role",
      );

    const voterRole =
      typeof rawRole ===
      "string"
        ? rawRole.trim()
        : "";

    if (
      voterRole !== "" &&
      !allowedRoles.has(
        voterRole,
      )
    ) {
      throw new InputError(
        "Selecciona un rol válido.",
      );
    }

    await updateProfileVoterRole(
      profileId,
      voterRole === ""
        ? null
        : voterRole,
    );

    revalidatePath(
      "/admin/users",
    );

    revalidatePath(
      "/fantasy",
    );

    revalidatePath(
      "/",
    );

    return {
      status:
        "success",

      message:
        "Rol actualizado correctamente.",
    };
  } catch (error) {
    return {
      status:
        "error",

      message:
        error instanceof
        InputError
          ? error.message
          : "No se pudo actualizar el rol.",
    };
  }
}