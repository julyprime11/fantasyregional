export const ADMIN_ROLES = [
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
  "directiva",
] as const;

export const ALL_ROLES = [
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

export type UserRole =
  (typeof ALL_ROLES)[number];

export type RolePermissions = {
  /*
   * FANTASY
   */
  canPlayFantasy: boolean;
  canCreateLeague: boolean;
  canJoinLeague: boolean;
  canPrepareLineup: boolean;
  canViewFantasyPoints: boolean;

  /*
   * VOTACIÓN
   */
  canVote: boolean;

  /*
   * GESTIÓN DE PARTIDOS
   */
  canAccessMatchAdmin: boolean;

  /*
   * ADMINISTRACIÓN TOTAL
   */
  canAccessAdmin: boolean;
  canManageClubs: boolean;
  canManageTeams: boolean;
  canManagePlayers: boolean;
  canManageMatches: boolean;
  canManageUsers: boolean;
  canUseFfcvSync: boolean;
};

const NO_PERMISSIONS: Readonly<RolePermissions> =
  Object.freeze({
    canPlayFantasy: false,
    canCreateLeague: false,
    canJoinLeague: false,
    canPrepareLineup: false,
    canViewFantasyPoints: false,

    canVote: false,

    canAccessMatchAdmin: false,

    canAccessAdmin: false,
    canManageClubs: false,
    canManageTeams: false,
    canManagePlayers: false,
    canManageMatches: false,
    canManageUsers: false,
    canUseFfcvSync: false,
  });

const ROLE_PERMISSIONS: Readonly<
  Record<
    UserRole,
    Readonly<RolePermissions>
  >
> = Object.freeze({
  /*
   * USUARIO FANTASY
   *
   * Puede utilizar toda la parte Fantasy,
   * pero no puede votar ni administrar.
   */
  jugador: Object.freeze({
    canPlayFantasy: true,
    canCreateLeague: true,
    canJoinLeague: true,
    canPrepareLineup: true,
    canViewFantasyPoints: true,

    canVote: false,

    canAccessMatchAdmin: false,

    canAccessAdmin: false,
    canManageClubs: false,
    canManageTeams: false,
    canManagePlayers: false,
    canManageMatches: false,
    canManageUsers: false,
    canUseFfcvSync: false,
  }),

  /*
   * JUGADOR DE EQUIPO
   *
   * Puede utilizar el Fantasy
   * y además votar.
   */
  player: Object.freeze({
    canPlayFantasy: true,
    canCreateLeague: true,
    canJoinLeague: true,
    canPrepareLineup: true,
    canViewFantasyPoints: true,

    canVote: true,

    canAccessMatchAdmin: false,

    canAccessAdmin: false,
    canManageClubs: false,
    canManageTeams: false,
    canManagePlayers: false,
    canManageMatches: false,
    canManageUsers: false,
    canUseFfcvSync: false,
  }),

  /*
   * ENTRENADOR
   *
   * Solo participa en las votaciones.
   */
  entrenador: Object.freeze({
    canPlayFantasy: false,
    canCreateLeague: false,
    canJoinLeague: false,
    canPrepareLineup: false,
    canViewFantasyPoints: false,

    canVote: true,

    canAccessMatchAdmin: false,

    canAccessAdmin: false,
    canManageClubs: false,
    canManageTeams: false,
    canManagePlayers: false,
    canManageMatches: false,
    canManageUsers: false,
    canUseFfcvSync: false,
  }),

  /*
   * CUERPO TÉCNICO
   *
   * Mismo comportamiento que entrenador:
   * únicamente puede votar.
   */
  cuerpo_tecnico: Object.freeze({
    canPlayFantasy: false,
    canCreateLeague: false,
    canJoinLeague: false,
    canPrepareLineup: false,
    canViewFantasyPoints: false,

    canVote: true,

    canAccessMatchAdmin: false,

    canAccessAdmin: false,
    canManageClubs: false,
    canManageTeams: false,
    canManagePlayers: false,
    canManageMatches: false,
    canManageUsers: false,
    canUseFfcvSync: false,
  }),

  /*
   * DIRECTIVA
   *
   * Acceso total a la aplicación:
   *
   * - Fantasy
   * - Votaciones
   * - Match Admin
   * - Clubs
   * - Equipos
   * - Jugadores
   * - Partidos
   * - Usuarios y roles
   * - Sincronización FFCV
   */
  directiva: Object.freeze({
    canPlayFantasy: true,
    canCreateLeague: true,
    canJoinLeague: true,
    canPrepareLineup: true,
    canViewFantasyPoints: true,

    canVote: true,

    canAccessMatchAdmin: true,

    canAccessAdmin: true,
    canManageClubs: true,
    canManageTeams: true,
    canManagePlayers: true,
    canManageMatches: true,
    canManageUsers: true,
    canUseFfcvSync: true,
  }),
});

export function getRolePermissions(
  role: string | null | undefined,
): Readonly<RolePermissions> {
  if (!role) {
    return NO_PERMISSIONS;
  }

  if (
    !ALL_ROLES.includes(
      role as UserRole,
    )
  ) {
    return NO_PERMISSIONS;
  }

  return ROLE_PERMISSIONS[
    role as UserRole
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

export function canCreateLeague(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canCreateLeague;
}

export function canJoinLeague(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canJoinLeague;
}

export function canPrepareLineup(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canPrepareLineup;
}

export function canViewFantasyPoints(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canViewFantasyPoints;
}

export function canAccessMatchAdmin(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canAccessMatchAdmin;
}

export function canAccessAdmin(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canAccessAdmin;
}

export function canManageClubs(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canManageClubs;
}

export function canManageTeams(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canManageTeams;
}

export function canManagePlayers(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canManagePlayers;
}

export function canManageMatches(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canManageMatches;
}

export function canManageUsers(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canManageUsers;
}

export function canUseFfcvSync(
  role: string | null | undefined,
): boolean {
  return getRolePermissions(
    role,
  ).canUseFfcvSync;
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