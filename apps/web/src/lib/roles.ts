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

export const FANTASY_ROLES = [
  "jugador",
  "player",
  "entrenador",
  "cuerpo_tecnico",
  "directiva",
] as const;

export type AdminRole =
  (typeof ADMIN_ROLES)[number];

export type VoterRole =
  (typeof VOTER_ROLES)[number];

export type FantasyRole =
  (typeof FANTASY_ROLES)[number];

export type RolePermissions = {
  canVote: boolean;
  canPlayFantasy: boolean;
  canAccessMatchAdmin: boolean;
};

const NO_PERMISSIONS: Readonly<RolePermissions> =
  Object.freeze({
    canVote: false,
    canPlayFantasy: false,
    canAccessMatchAdmin: false,
  });

const ROLE_PERMISSIONS: Readonly<
  Record<
    FantasyRole,
    Readonly<RolePermissions>
  >
> = Object.freeze({
  /*
   * Usuario Fantasy.
   *
   * Puede participar en ligas Fantasy,
   * pero no puede votar partidos.
   */
  jugador: Object.freeze({
    canVote: false,
    canPlayFantasy: true,
    canAccessMatchAdmin: false,
  }),

  /*
   * Jugador real de un equipo.
   */
  player: Object.freeze({
    canVote: true,
    canPlayFantasy: true,
    canAccessMatchAdmin: false,
  }),

  entrenador: Object.freeze({
    canVote: true,
    canPlayFantasy: true,
    canAccessMatchAdmin: true,
  }),

  cuerpo_tecnico: Object.freeze({
    canVote: true,
    canPlayFantasy: true,
    canAccessMatchAdmin: true,
  }),

  directiva: Object.freeze({
    canVote: true,
    canPlayFantasy: true,
    canAccessMatchAdmin: true,
  }),
});

export function getRolePermissions(
  role: string | null | undefined,
): Readonly<RolePermissions> {
  if (!role) {
    return NO_PERMISSIONS;
  }

  if (
    !FANTASY_ROLES.includes(
      role as FantasyRole,
    )
  ) {
    return NO_PERMISSIONS;
  }

  return ROLE_PERMISSIONS[
    role as FantasyRole
  ];
}

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

  return getRolePermissions(
    role,
  ).canVote;
}

export function canPlayFantasy(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canPlayFantasy;
}

export function canAccessMatchAdmin(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canAccessMatchAdmin;
}

export function formatRole(
  role: string | null | undefined,
): string {
  switch (role) {
    case "jugador":
      return "Usuario Fantasy";

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