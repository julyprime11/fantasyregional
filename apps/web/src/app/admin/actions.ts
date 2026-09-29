"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InputError, parseClubInput, parseTeamInput, parsePlayerInput, parsePlayerId, parseStaffInput, parseStaffId } from "@regional-fantasy/shared";
import { createClub } from "@/data/clubs";
import { createTeam } from "@/data/teams";
import { createPlayer, updatePlayer } from "@/data/players";
import { createStaff, updateStaff } from "@/data/staff";
import { parseMatchInput, parseMatchId } from "@regional-fantasy/shared";
import { createMatch, updateMatch } from "@/data/matches";
import { parseMatchPlayerId, parseMatchPlayerStats } from "@regional-fantasy/shared";
import { addMatchPlayer, updateMatchPlayerStats, removeMatchPlayer } from "@/data/match-players";

export type FormState = { status: "idle" | "error" | "success"; message: string; values?: Record<string, string> };
async function save<T>(form: FormData, parse: (input: Record<string, unknown>) => T, mutate: (input: T) => Promise<void>, successMessage = "Registro creado correctamente."): Promise<FormState> {
  const raw = Object.fromEntries(form);
  const values: Record<string, string> = {};
  for (const [key, value] of form) {
    if (!key.startsWith("$ACTION_") && typeof value === "string") values[key] = value;
  }
  let input: T;
  try { input = parse(raw); }
  catch (error) {
    return { status: "error", message: error instanceof InputError ? error.message : "Revisa los datos del formulario.", values };
  }
  try { await mutate(input); }
  catch (error) {
    return { status: "error", message: error instanceof InputError ? error.message : "No se pudo guardar. Comprueba que el registro y las opciones seleccionadas sigan existiendo e inténtalo de nuevo.", values };
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  return { status: "success", message: successMessage };
}
export async function createClubAction(_previous: FormState, form: FormData): Promise<FormState> {
  return save(form, parseClubInput, createClub);
}

export async function addMatchPlayerAction(matchId: string, _previous: FormState, form: FormData): Promise<FormState> {
  return save(form,
    input => ({ matchId: parseMatchId(matchId), playerId: parsePlayerId(input.player_id) }),
    input => addMatchPlayer(input.matchId, input.playerId),
    "Jugador añadido a la convocatoria.",
  );
}

export async function updateMatchPlayerAction(matchId: string, entryId: string, _previous: FormState, form: FormData): Promise<FormState> {
  return save(form,
    input => ({ matchId: parseMatchId(matchId), entryId: parseMatchPlayerId(entryId), stats: parseMatchPlayerStats(input) }),
    input => updateMatchPlayerStats(input.matchId, input.entryId, input.stats),
    "Estadísticas guardadas correctamente.",
  );
}

export async function removeMatchPlayerAction(matchId: string, entryId: string, _previous: FormState, form: FormData): Promise<FormState> {
  return save(form,
    () => ({ matchId: parseMatchId(matchId), entryId: parseMatchPlayerId(entryId) }),
    input => removeMatchPlayer(input.matchId, input.entryId),
    "Jugador retirado de la convocatoria.",
  );
}

export async function createMatchAction(_previous: FormState, form: FormData): Promise<FormState> {
  return save(form, parseMatchInput, createMatch);
}

export async function updateMatchAction(matchId: string, _previous: FormState, form: FormData): Promise<FormState> {
  const result = await save(
    form,
    input => ({ id: parseMatchId(matchId), match: parseMatchInput(input) }),
    ({ id, match }) => updateMatch(id, match),
    "Partido actualizado correctamente.",
  );
  if (result.status === "success") redirect("/admin/matches");
  return result;
}
export async function createTeamAction(_previous: FormState, form: FormData): Promise<FormState> {
  return save(form, parseTeamInput, createTeam);
}
export async function createPlayerAction(_previous: FormState, form: FormData): Promise<FormState> {
  return save(form, parsePlayerInput, createPlayer);
}

export async function updatePlayerAction(playerId: string, _previous: FormState, form: FormData): Promise<FormState> {
  const result = await save(
    form,
    (input) => ({ id: parsePlayerId(playerId), player: parsePlayerInput(input) }),
    ({ id, player }) => updatePlayer(id, player),
    "Jugador actualizado correctamente.",
  );
  if (result.status === "success") redirect("/admin/players");
  return result;
}

export async function createStaffAction(_previous: FormState, form: FormData): Promise<FormState> {
  return save(form, parseStaffInput, createStaff);
}

export async function updateStaffAction(staffId: string, _previous: FormState, form: FormData): Promise<FormState> {
  const result = await save(
    form,
    (input) => ({ id: parseStaffId(staffId), staff: parseStaffInput(input) }),
    ({ id, staff }) => updateStaff(id, staff),
    "Miembro del cuerpo técnico actualizado correctamente.",
  );
  if (result.status === "success") redirect("/admin/staff");
  return result;
}
