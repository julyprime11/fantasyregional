export const ADMIN_ROLES = [
  "entrenador",
  "cuerpo_tecnico",
  "directiva",
] as const;

export const VOTER_ROLES = [
  "player",
  "entrenador",
  "cuerpo_tecnico",
  "directiva",
] as const;

export type AdminRole =
  (typeof ADMIN_ROLES)[number];

export type VoterRole =
  (typeof VOTER_ROLES)[number];

export function isAdminRole(
  role: string | null | undefined,
): role is AdminRole {
  if (!role) {
    return false;
  }

  return ADMIN_ROLES.includes(
    role as AdminRole,
  );
}

export function canVote(
  role: string | null | undefined,
): role is VoterRole {
  if (!role) {
    return false;
  }

  return VOTER_ROLES.includes(
    role as VoterRole,
  );
}

export function formatRole(
  role: string | null | undefined,
): string {
  switch (role) {
    case "jugador":
      return "Jugador Fantasy";

    case "player":
      return "Jugador";

    case "entrenador":
      return "Entrenador";

    case "cuerpo_tecnico":
      return "Cuerpo técnico";

    case "directiva":
      return "Directiva";

    default:
      return role ?? "Sin rol";
  }
}