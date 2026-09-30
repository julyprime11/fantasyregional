export const ADMIN_ROLES = [
  "entrenador",
  "cuerpo_tecnico",
  "directiva",
] as const;

export type AdminRole =
  (typeof ADMIN_ROLES)[number];

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