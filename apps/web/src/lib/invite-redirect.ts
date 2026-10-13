/**
 * Solo aceptamos como regreso desde autenticación
 * una invitación local a una liga Fantasy.
 *
 * Nunca redirigir a URLs externas recibidas del usuario.
 */
export function getSafeLeagueInvitePath(
  value: string | null | undefined,
): string | null {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return null;
  }

  try {
    const origin =
      "https://fantasyregional.com";

    const target =
      new URL(value, origin);

    if (
      target.origin !== origin ||
      target.pathname !==
        "/fantasy/leagues/join"
    ) {
      return null;
    }

    const code =
      target.searchParams
        .get("code")
        ?.trim()
        .toUpperCase() ?? "";

    if (
      code.length < 4 ||
      code.length > 12
    ) {
      return null;
    }

    return `/fantasy/leagues/join?code=${encodeURIComponent(
      code,
    )}`;
  } catch {
    return null;
  }
}
