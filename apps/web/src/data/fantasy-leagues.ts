import "server-only";

import {
  randomBytes,
} from "node:crypto";

import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type FantasyLeagueRow =
  Database["public"]["Tables"]["fantasy_leagues"]["Row"];

export type FantasyLeagueMemberRow =
  Database["public"]["Tables"]["fantasy_league_members"]["Row"];

export type ProfileRow =
  Database["public"]["Tables"]["profiles"]["Row"];

export type FantasyLeagueDetails =
  FantasyLeagueRow & {
    team: {
      id: string;
      name: string;
    } | null;
  };

export type FantasyLeagueMemberDetails =
  FantasyLeagueMemberRow & {
    profile: {
      id: string;
      display_name: string;
    } | null;
  };

const LEAGUE_CODE_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const LEAGUE_CODE_LENGTH =
  8;

const MAX_LEAGUE_CODE_ATTEMPTS =
  5;

function generateFantasyLeagueCode(): string {
  const bytes =
    randomBytes(
      LEAGUE_CODE_LENGTH,
    );

  return Array.from(
    bytes,
    (byte) =>
      LEAGUE_CODE_ALPHABET[
        byte %
          LEAGUE_CODE_ALPHABET.length
      ],
  ).join("");
}

function getDatabaseErrorCode(
  error: unknown,
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    return String(
      error.code,
    );
  }

  return "";
}

export async function getFantasyLeagues(): Promise<
  FantasyLeagueDetails[]
> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("fantasy_leagues")
      .select(`
        *,
        team:teams (
          id,
          name
        )
      `)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw error;
  }

  return data;
}

export async function getFantasyLeagueById(
  leagueId: string,
): Promise<FantasyLeagueDetails | null> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("fantasy_leagues")
      .select(`
        *,
        team:teams (
          id,
          name
        )
      `)
      .eq("id", leagueId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getFantasyLeagueByCode(
  code: string,
): Promise<FantasyLeagueDetails | null> {
  const normalizedCode =
    code.trim().toUpperCase();

  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("fantasy_leagues")
      .select(`
        *,
        team:teams (
          id,
          name
        )
      `)
      .eq("code", normalizedCode)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getFantasyLeagueMembers(
  leagueId: string,
): Promise<FantasyLeagueMemberDetails[]> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("fantasy_league_members")
      .select(`
        *,
        profile:profiles (
          id,
          display_name
        )
      `)
      .eq("league_id", leagueId)
      .order("joined_at", {
        ascending: true,
      });

  if (error) {
    throw error;
  }

  return data;
}

export async function createFantasyLeague(
  input: {
    teamId: string;
    name: string;
    createdBy: string;
  },
): Promise<FantasyLeagueRow> {
  const name =
    input.name.trim();

  if (!name) {
    throw new Error(
      "El nombre de la liga es obligatorio.",
    );
  }

  const supabase =
    await createServerSupabaseClient();

  let league:
    FantasyLeagueRow | null =
    null;

  /*
   * El código se genera exclusivamente
   * en servidor.
   *
   * La restricción UNIQUE de PostgreSQL es
   * la garantía definitiva frente a dos
   * peticiones concurrentes que generasen
   * el mismo valor.
   */
  for (
    let attempt = 0;
    attempt <
    MAX_LEAGUE_CODE_ATTEMPTS;
    attempt += 1
  ) {
    const code =
      generateFantasyLeagueCode();

    const {
      data,
      error,
    } =
      await supabase
        .from("fantasy_leagues")
        .insert({
          team_id:
            input.teamId,
          name,
          code,
          created_by:
            input.createdBy,
        })
        .select("*")
        .single();

    if (!error) {
      league =
        data;

      break;
    }

    if (
      getDatabaseErrorCode(
        error,
      ) === "23505"
    ) {
      continue;
    }

    throw error;
  }

  if (!league) {
    throw new Error(
      "No se pudo generar un código único para la liga.",
    );
  }

  const { error: memberError } =
    await supabase
      .from("fantasy_league_members")
      .insert({
        league_id: league.id,
        user_id: input.createdBy,
      });

  if (memberError) {
    /*
     * Si falla la creación del miembro,
     * eliminamos la liga que acabamos de crear
     * para evitar dejar una liga huérfana.
     */
    await supabase
      .from("fantasy_leagues")
      .delete()
      .eq("id", league.id);

    throw memberError;
  }

  return league;
}

export async function joinFantasyLeague(
  input: {
    leagueId: string;
    userId: string;
  },
): Promise<FantasyLeagueMemberRow> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("fantasy_league_members")
      .insert({
        league_id: input.leagueId,
        user_id: input.userId,
      })
      .select("*")
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getUserFantasyLeagues(
  userId: string,
): Promise<FantasyLeagueMemberRow[]> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("fantasy_league_members")
      .select("*")
      .eq("user_id", userId)
      .order("joined_at", {
        ascending: false,
      });

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteFantasyLeague(
  leagueId: string,
): Promise<void> {
  if (!leagueId) {
    throw new Error(
      "Liga no válida.",
    );
  }

  const supabase =
    await createServerSupabaseClient();

  const {
    data: league,
    error: leagueError,
  } =
    await supabase
      .from("fantasy_leagues")
      .select(
        "id, name",
      )
      .eq(
        "id",
        leagueId,
      )
      .maybeSingle();

  if (leagueError) {
    throw leagueError;
  }

  if (!league) {
    throw new Error(
      "La liga ya no existe.",
    );
  }

  /*
   * Recuperamos las alineaciones de esta liga
   * porque fantasy_lineup_players depende de ellas.
   */
  const {
    data: lineups,
    error: lineupsError,
  } =
    await supabase
      .from("fantasy_lineups")
      .select("id")
      .eq(
        "league_id",
        leagueId,
      );

  if (lineupsError) {
    throw lineupsError;
  }

  const lineupIds =
    lineups.map(
      (lineup) =>
        lineup.id,
    );

  /*
   * Primero eliminamos los jugadores de
   * las alineaciones.
   */
  if (
    lineupIds.length >
    0
  ) {
    const {
      error:
        lineupPlayersError,
    } =
      await supabase
        .from(
          "fantasy_lineup_players",
        )
        .delete()
        .in(
          "lineup_id",
          lineupIds,
        );

    if (
      lineupPlayersError
    ) {
      throw lineupPlayersError;
    }
  }

  /*
   * Después las alineaciones de la liga.
   */
  const {
    error:
      deleteLineupsError,
  } =
    await supabase
      .from(
        "fantasy_lineups",
      )
      .delete()
      .eq(
        "league_id",
        leagueId,
      );

  if (
    deleteLineupsError
  ) {
    throw deleteLineupsError;
  }

  /*
   * Eliminamos todos los miembros.
   */
  const {
    error:
      membersError,
  } =
    await supabase
      .from(
        "fantasy_league_members",
      )
      .delete()
      .eq(
        "league_id",
        leagueId,
      );

  if (membersError) {
    throw membersError;
  }

  /*
   * Por último eliminamos la propia liga.
   */
  const {
    data:
      deletedLeague,
    error:
      deleteLeagueError,
  } =
    await supabase
      .from(
        "fantasy_leagues",
      )
      .delete()
      .eq(
        "id",
        leagueId,
      )
      .select("id")
      .maybeSingle();

  if (
    deleteLeagueError
  ) {
    throw deleteLeagueError;
  }

  if (!deletedLeague) {
    throw new Error(
      "La liga no se pudo eliminar.",
    );
  }
}