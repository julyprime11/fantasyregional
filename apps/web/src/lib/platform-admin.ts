import "server-only";

import { requireUser } from "@/lib/auth";
import { currentUserIsAdmin } from "@/lib/admin-auth";

/**
 * Los correos de participantes son datos personales. Su consulta exige
 * rol administrativo más una autorización explícita de plataforma.
 *
 * PLATFORM_ADMIN_USER_IDS contiene UUID separados por comas y solo
 * existe en el servidor (nunca con prefijo NEXT_PUBLIC_).
 */
export async function currentUserCanViewLeagueEmails(): Promise<boolean> {
  const allowedIds = new Set(
    (process.env.PLATFORM_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );

  if (allowedIds.size === 0) {
    return false;
  }

  const user = await requireUser();

  if (!allowedIds.has(user.id)) {
    return false;
  }

  return currentUserIsAdmin();
}
