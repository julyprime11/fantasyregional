import "server-only";

import { redirect } from "next/navigation";

import { currentUserIsAdmin } from "@/lib/admin-auth";
import { currentUserCanViewLeagueEmails } from "@/lib/platform-admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminLeagueMember = {
  userId: string;
  displayName: string;
  email: string | null;
  joinedAt: string;
};

export type AdminLeagueOverview = {
  id: string;
  name: string;
  code: string;
  teamName: string;
  createdAt: string;
  creator: {
    userId: string;
    displayName: string;
    email: string | null;
  };
  members: AdminLeagueMember[];
};

export type AdminLeagueAudit = {
  leagues: AdminLeagueOverview[];
  canSeeEmails: boolean;
};

async function getRelevantAuthEmails(
  userIds: ReadonlySet<string>,
): Promise<Map<string, string>> {
  const admin = createAdminSupabaseClient();
  const emails = new Map<string, string>();
  const perPage = 1000;

  // Auth no ofrece búsqueda masiva por varios UUID. Recorremos las
  // páginas en el servidor y conservamos solamente correos relevantes.
  for (let page = 1; page <= 30; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    for (const user of data.users) {
      if (userIds.has(user.id) && user.email) {
        emails.set(user.id, user.email);
      }
    }

    if (data.users.length < perPage) {
      return emails;
    }
  }

  // No mostramos resultados potencialmente incompletos.
  throw new Error("La consulta de usuarios supera el límite de paginación.");
}

export async function getAdminFantasyLeagueAudit(): Promise<AdminLeagueAudit> {
  // El layout también verifica permisos, pero la capa de datos
  // debe protegerse de manera independiente.
  if (!(await currentUserIsAdmin())) {
    redirect("/post-login");
  }

  const canSeeEmails = await currentUserCanViewLeagueEmails();
  // Para datos no sensibles, usamos la sesión autenticada y sus RLS.
  // La clave privilegiada queda reservada a Auth (correos).
  const supabase = await createServerSupabaseClient();

  const [leaguesResult, membershipsResult, profilesResult] = await Promise.all([
    supabase
      .from("fantasy_leagues")
      .select("id, name, code, team_id, created_by, created_at, team:teams(id, name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("fantasy_league_members")
      .select("league_id, user_id, joined_at")
      .order("joined_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, display_name"),
  ]);

  if (leaguesResult.error) throw leaguesResult.error;
  if (membershipsResult.error) throw membershipsResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const leagues = leaguesResult.data ?? [];
  const memberships = membershipsResult.data ?? [];
  const profiles = profilesResult.data ?? [];

  const names = new Map(profiles.map((profile) => [
    profile.id,
    profile.display_name,
  ]));

  const userIds = new Set<string>();
  for (const league of leagues) userIds.add(league.created_by);
  for (const member of memberships) userIds.add(member.user_id);

  const emails = canSeeEmails
    ? await getRelevantAuthEmails(userIds)
    : new Map<string, string>();

  const membersByLeague = new Map<string, AdminLeagueMember[]>();

  for (const member of memberships) {
    const list = membersByLeague.get(member.league_id) ?? [];
    list.push({
      userId: member.user_id,
      displayName: names.get(member.user_id) ?? "Usuario sin perfil",
      email: emails.get(member.user_id) ?? null,
      joinedAt: member.joined_at,
    });
    membersByLeague.set(member.league_id, list);
  }

  return {
    canSeeEmails,
    leagues: leagues.map((league) => ({
      id: league.id,
      name: league.name,
      code: league.code,
      teamName: league.team?.name ?? "Equipo no disponible",
      createdAt: league.created_at,
      creator: {
        userId: league.created_by,
        displayName: names.get(league.created_by) ?? "Creador sin perfil",
        email: emails.get(league.created_by) ?? null,
      },
      members: membersByLeague.get(league.id) ?? [],
    })),
  };
}
