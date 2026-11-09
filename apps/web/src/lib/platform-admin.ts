import "server-only";

import { requireUser } from "@/lib/auth";
import { currentUserIsAdmin } from "@/lib/admin-auth";

/**
 * El acceso a datos personales de participantes es un permiso de plataforma,
 * adicional al rol interno "directiva". Los UUID autorizados se configuran
 * exclusivamente en el servidor con PLATFORM_ADMIN_USER_IDS.
 */
export async function currentUserCanAuditFantasyLeagues(): Promise<boolean> {
  const allowedIds = new Set(
    (process.env.PLATFORM_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );

  // Si no se ha configurado el permiso, el acceso queda denegado.
  if (allowedIds.size === 0) {
    return false;
  }

  const user = await requireUser();

  if (!allowedIds.has(user.id)) {
    return false;
  }

  return currentUserIsAdmin();
}

export async function assertCanAuditFantasyLeagues(): Promise<void> {
  if (!(await currentUserCanAuditFantasyLeagues())) {
    throw new Error("No tienes permisos para consultar las ligas Fantasy.");
  }
}
