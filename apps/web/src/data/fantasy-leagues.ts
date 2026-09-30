import "server-only";

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
    code: string;
    createdBy: string;
  },
): Promise<FantasyLeagueRow> {
  const name =
    input.name.trim();

  const code =
    input.code.trim().toUpperCase();

  if (!name) {
    throw new Error(
      "El nombre de la liga es obligatorio.",
    );
  }

  if (code.length < 4) {
    throw new Error(
      "El código de la liga debe tener al menos 4 caracteres.",
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
      .insert({
        team_id: input.teamId,
        name,
        code,
        created_by: input.createdBy,
      })
      .select("*")
      .single();

  if (leagueError) {
    throw leagueError;
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