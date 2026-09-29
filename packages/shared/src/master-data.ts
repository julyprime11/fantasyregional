import { PLAYER_POSITIONS, type PlayerPosition } from "./domain";

type Input = Record<string, unknown>;
export class InputError extends Error {}

export function parseRatingInput(input: Input) {
  const voter_id = id(input, "voter_id", "UUID del votante").toLowerCase();
  const voter_role = requiredText(input, "voter_role", "Rol del votante");
  const votes: { player_id: string; score: number }[] = [];
  const seen = new Set<string>();
  for (const key of Object.keys(input)) {
    if (!key.startsWith("score:")) continue;
    const value = text(input, key, "Puntuación");
    if (value === null) continue;
    const player_id = id({ player_id: key.slice(6) }, "player_id", "Jugador").toLowerCase();
    const score = Number(value);
    if (!/^\d+(?:\.\d+)?$/.test(value) || !Number.isFinite(score) || score < 1 || score > 10) {
      throw new InputError("Las puntuaciones deben ser números entre 1 y 10.");
    }
    if (seen.has(player_id)) throw new InputError("No puedes puntuar dos veces al mismo jugador en un envío.");
    seen.add(player_id);
    votes.push({ player_id, score });
  }
  if (votes.length === 0) throw new InputError("Introduce al menos una puntuación entre 1 y 10.");
  return { voter_id, voter_role, votes };
}

export const MATCH_STATUSES = ["scheduled", "finished", "voting", "closed"] as const;

export function parseMatchId(value: unknown): string {
  return id({ match_id: value }, "match_id", "Partido");
}

export function parseMatchPlayerId(value: unknown): string {
  return id({ match_player_id: value }, "match_player_id", "Registro de convocatoria");
}

function stat(input: Input, key: string, label: string): number {
  const value = matchScore(input, key, label);
  if (value === null) throw new InputError(label + " es obligatorio.");
  return value;
}

function checked(input: Input, key: string, label: string): boolean {
  if (input[key] != null && input[key] !== "on") throw new InputError(label + ": valor inválido.");
  return input[key] === "on";
}

export function parseMatchPlayerStats(input: Input) {
  return {
    starter: checked(input, "starter", "Titular"),
    minutes_played: stat(input, "minutes_played", "Minutos"),
    goals: stat(input, "goals", "Goles"),
    assists: stat(input, "assists", "Asistencias"),
    yellow_cards: stat(input, "yellow_cards", "Tarjetas amarillas"),
    red_cards: stat(input, "red_cards", "Tarjetas rojas"),
    clean_sheet: checked(input, "clean_sheet", "Portería a cero"),
  };
}

function matchDate(input: Input, key: string, label: string, required = false): string | null {
  const value = text(input, key, label, required);
  if (!value) return null;
  // datetime-local inputs are explicitly labelled UTC in the administration UI.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value)) {
    throw new InputError(label + ": fecha y hora inválidas.");
  }
  const date = new Date(value + "Z");
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() < 1 || date.toISOString().slice(0, 16) !== value.slice(0, 16)) {
    throw new InputError(label + ": fecha y hora inválidas.");
  }
  return date.toISOString();
}

function matchScore(input: Input, key: string, label: string): number | null {
  const value = text(input, key, label);
  if (value === null) return null;
  if (!/^\d+$/.test(value) || Number(value) > 2147483647) {
    throw new InputError(label + " debe ser un entero entre 0 y 2147483647.");
  }
  return Number(value);
}

export function parseMatchInput(input: Input) {
  const home_team_id = id(input, "home_team_id", "Equipo local");
  const away_team_id = id(input, "away_team_id", "Equipo visitante");
  if (home_team_id.toLowerCase() === away_team_id.toLowerCase()) {
    throw new InputError("El equipo local y el visitante deben ser distintos.");
  }
  const status = MATCH_STATUSES.find(value => value === input.status);
  if (!status) throw new InputError("Selecciona un estado válido.");
  const voting_opens_at = matchDate(input, "voting_opens_at", "Apertura de votación");
  const voting_closes_at = matchDate(input, "voting_closes_at", "Cierre de votación");
  if (voting_opens_at && voting_closes_at && voting_closes_at < voting_opens_at) {
    throw new InputError("El cierre de votación no puede ser anterior a la apertura.");
  }
  return {
    competition_id: text(input, "competition_id", "Competición") === null ? null : id(input, "competition_id", "Competición"),
    home_team_id, away_team_id,
    match_date: matchDate(input, "match_date", "Fecha del partido", true)!,
    home_score: matchScore(input, "home_score", "Goles locales"),
    away_score: matchScore(input, "away_score", "Goles visitantes"),
    status, voting_opens_at, voting_closes_at,
  };
}

function text(input: Input, key: string, label: string, required = false): string | null {
  const raw = input[key];
  if (raw != null && typeof raw !== "string") throw new InputError(label + ": valor inválido.");
  const value = typeof raw === "string" ? raw.trim() : "";
  if (required && !value) throw new InputError(label + " es obligatorio.");
  if (value.length > 500) throw new InputError(label + ": máximo 500 caracteres.");
  return value || null;
}
function requiredText(input: Input, key: string, label: string): string {
  return text(input, key, label, true)!;
}
function id(input: Input, key: string, label: string): string {
  const value = requiredText(input, key, label);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new InputError("Selecciona un " + label.toLowerCase() + " válido.");
  }
  return value;
}
function imageUrl(input: Input, key: string): string | null {
  const value = text(input, key, "URL de imagen");
  if (value && !/^https?:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/i.test(value)) {
    throw new InputError("La imagen debe tener una URL http o https válida.");
  }
  return value;
}
export function parseClubInput(input: Input) {
  return { name: requiredText(input, "name", "Nombre"), short_name: text(input, "short_name", "Nombre corto"), logo_url: imageUrl(input, "logo_url") };
}
export function parseTeamInput(input: Input) {
  return { club_id: id(input, "club_id", "Club"), name: requiredText(input, "name", "Nombre"), category: text(input, "category", "Categoría") };
}
function isPosition(value: string): value is PlayerPosition {
  return PLAYER_POSITIONS.some(position => position === value);
}
export function parsePlayerId(value: unknown): string {
  return id({ player_id: value }, "player_id", "Jugador");
}
export function parseStaffId(value: unknown): string {
  return id({ staff_id: value }, "staff_id", "Miembro del cuerpo técnico");
}
function parseTeamMemberInput(input: Input) {
  if (input.active != null && input.active !== "on") throw new InputError("Estado activo inválido.");
  return {
    team_id: id(input, "team_id", "Equipo"),
    first_name: requiredText(input, "first_name", "Nombre"),
    last_name: text(input, "last_name", "Apellidos"),
    image_url: imageUrl(input, "image_url"),
    active: input.active === "on",
  };
}
export function parseStaffInput(input: Input) {
  return { ...parseTeamMemberInput(input), role: requiredText(input, "role", "Cargo") };
}
export function parsePlayerInput(input: Input) {
  const position = requiredText(input, "position", "Posición");
  if (!isPosition(position)) throw new InputError("Selecciona una posición válida.");
  const shirt = text(input, "shirt_number", "Dorsal");
  if (shirt !== null && (!/^\d+$/.test(shirt) || Number(shirt) > 2147483647)) {
    throw new InputError("El dorsal debe ser un entero entre 0 y 2147483647.");
  }
  return {
    ...parseTeamMemberInput(input),
    shirt_number: shirt === null ? null : Number(shirt),
    position,
  };
}
