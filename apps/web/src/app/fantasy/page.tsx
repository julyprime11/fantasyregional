import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/roles";

import {
  getFantasyLeagueById,
  getUserFantasyLeagues,
} from "@/data/fantasy-leagues";

import {
  getFantasyLineup,
  getFantasyLineupPlayers,
} from "@/data/fantasy-lineups";

import { getMatches } from "@/data/matches";
import { getTeams } from "@/data/teams";

import LogoutButton from "./logout-button";

export default async function FantasyPage() {
  const user =
    await requireUser();

  const supabase =
    await createServerSupabaseClient();

  const {
    data: profile,
  } =
    await supabase
      .from("profiles")
      .select(
        "display_name, voter_role",
      )
      .eq("id", user.id)
      .maybeSingle();

  const displayName =
    profile?.display_name ??
    user.user_metadata?.display_name ??
    user.email?.split("@")[0] ??
    "Jugador";

  const canAccessMatchAdmin =
    isAdminRole(
      profile?.voter_role,
    );

  /*
   * Ligas del usuario.
   */
  const memberships =
    await getUserFantasyLeagues(
      user.id,
    );

  const leagues = (
    await Promise.all(
      memberships.map(
        (membership) =>
          getFantasyLeagueById(
            membership.league_id,
          ),
      ),
    )
  ).filter(
    (
      league,
    ): league is NonNullable<
      Awaited<
        ReturnType<
          typeof getFantasyLeagueById
        >
      >
    > =>
      league !== null,
  );

  /*
   * Próximo partido de cualquiera de
   * los equipos asociados a sus ligas.
   */
  const [matches, teams] =
    await Promise.all([
      getMatches(),
      getTeams(),
    ]);

  const now =
    Date.now();

  const leagueTeamIds =
    new Set(
      leagues.map(
        (league) =>
          league.team_id,
      ),
    );

  const nextMatch =
    matches
      .filter(
        (match) =>
          match.status ===
            "scheduled" &&
          new Date(
            match.match_date,
          ).getTime() >
            now &&
          (
            leagueTeamIds.has(
              match.home_team_id,
            ) ||
            leagueTeamIds.has(
              match.away_team_id,
            )
          ),
      )
      .sort(
        (a, b) =>
          new Date(
            a.match_date,
          ).getTime() -
          new Date(
            b.match_date,
          ).getTime(),
      )[0] ??
    null;

  /*
   * Averiguamos a qué liga corresponde
   * el próximo partido.
   */
  const nextLeague =
    nextMatch
      ? leagues.find(
          (league) =>
            league.team_id ===
              nextMatch.home_team_id ||
            league.team_id ===
              nextMatch.away_team_id,
        ) ?? null
      : null;

  let lineup:
    Awaited<
      ReturnType<
        typeof getFantasyLineup
      >
    > = null;

  let selectedCount =
    0;

  if (
    nextMatch &&
    nextLeague
  ) {
    lineup =
      await getFantasyLineup({
        leagueId:
          nextLeague.id,
        userId:
          user.id,
        matchId:
          nextMatch.id,
      });

    if (lineup) {
      const lineupPlayers =
        await getFantasyLineupPlayers(
          lineup.id,
        );

      selectedCount =
        lineupPlayers.length;
    }
  }

  const teamNames =
    new Map(
      teams.map(
        (team) => [
          team.id,
          team.name,
        ],
      ),
    );

  const homeTeam =
    nextMatch
      ? teamNames.get(
          nextMatch.home_team_id,
        ) ??
        "Equipo local"
      : null;

  const awayTeam =
    nextMatch
      ? teamNames.get(
          nextMatch.away_team_id,
        ) ??
        "Equipo visitante"
      : null;

  /*
   * El XI se bloquea 1 hora antes.
   */
  const lineupLockTime =
    nextMatch
      ? new Date(
          nextMatch.match_date,
        ).getTime() -
        60 * 60 * 1000
      : null;

  const lockedByTime =
    lineupLockTime !==
      null &&
    now >=
      lineupLockTime;

  const locked =
    lockedByTime ||
    (
      lineup !== null &&
      lineup.locked_at !==
        null
    );

  const matchDateLabel =
    nextMatch
      ? new Intl.DateTimeFormat(
          "es-ES",
          {
            weekday:
              "short",
            day:
              "numeric",
            month:
              "short",
            hour:
              "2-digit",
            minute:
              "2-digit",
            timeZone:
              "Europe/Madrid",
          },
        ).format(
          new Date(
            nextMatch.match_date,
          ),
        )
      : null;

  const lockTimeLabel =
    lineupLockTime !==
    null
      ? new Intl.DateTimeFormat(
          "es-ES",
          {
            hour:
              "2-digit",
            minute:
              "2-digit",
            timeZone:
              "Europe/Madrid",
          },
        ).format(
          new Date(
            lineupLockTime,
          ),
        )
      : null;

  const lineupHref =
    nextLeague
      ? `/fantasy/leagues/${nextLeague.id}/lineup`
      : "/fantasy/lineup";

  return (
    <main className="min-h-screen bg-[#f2f4f2]">
      <div className="mx-auto max-w-xl">
        {/* CABECERA */}
        <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-7 pt-7 text-white shadow-lg">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

          <div className="absolute -left-16 bottom-[-70px] h-40 w-40 rounded-full border-[24px] border-white/5" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
                  Fantasy Regional
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight">
                  Hola,{" "}
                  {displayName}
                </h1>

                {profile?.voter_role && (
                  <div className="mt-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white/75">
                    {formatRole(
                      profile.voter_role,
                    )}
                  </div>
                )}
              </div>

              <LogoutButton />
            </div>

            <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">
              Prepara tu XI y sigue tu jornada Fantasy.
            </p>
          </div>
        </header>

        <div className="px-4 pb-8">
          {/* PRÓXIMO PARTIDO */}
          {nextMatch &&
          nextLeague ? (
            <section className="mt-5">
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                    Jornada
                  </p>

                  <h2 className="mt-1 text-xl font-black text-zinc-950">
                    Próximo partido
                  </h2>
                </div>

                <span className="text-xs font-bold text-zinc-400">
                  {
                    nextLeague.name
                  }
                </span>
              </div>

              <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-black/5">
                <div className="px-5 py-5">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ed] text-xl">
                        ⚽
                      </div>

                      <p className="mt-2 text-sm font-black leading-5 text-zinc-950">
                        {homeTeam}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-[10px] font-black text-white">
                      VS
                    </div>

                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-xl">
                        ⚽
                      </div>

                      <p className="mt-2 text-sm font-black leading-5 text-zinc-950">
                        {awayTeam}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-3 text-center">
                  <p className="text-xs font-bold capitalize text-zinc-500">
                    {
                      matchDateLabel
                    }
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="mt-5 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                Jornada
              </p>

              <p className="mt-2 font-black text-zinc-950">
                No hay próximo partido
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Cuando haya un partido programado aparecerá aquí.
              </p>
            </section>
          )}

          {/* ESTADO DEL XI */}
          {nextMatch &&
            nextLeague && (
              <section className="mt-3">
                <Link
                  href={
                    lineupHref
                  }
                  className={`block rounded-[1.5rem] p-5 ${
                    locked
                      ? "bg-zinc-950 text-white"
                      : selectedCount ===
                          11
                        ? "bg-[#e8f2ed]"
                        : "bg-white shadow-sm ring-1 ring-black/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black ${
                          locked
                            ? "bg-white/10 text-white"
                            : selectedCount ===
                                11
                              ? "bg-[#0f3d2e] text-white"
                              : "bg-[#e8f2ed] text-[#0f3d2e]"
                        }`}
                      >
                        {locked
                          ? "🔒"
                          : selectedCount ===
                              11
                            ? "✓"
                            : "11"}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-[9px] font-black uppercase tracking-[0.16em] ${
                            locked
                              ? "text-white/45"
                              : "text-zinc-400"
                          }`}
                        >
                          Mi XI
                        </p>

                        <p
                          className={`mt-1 font-black ${
                            locked
                              ? "text-white"
                              : "text-zinc-950"
                          }`}
                        >
                          {locked
                            ? "Alineación cerrada"
                            : selectedCount ===
                                11
                              ? "XI preparado"
                              : "Prepara tu alineación"}
                        </p>

                        <p
                          className={`mt-1 text-xs ${
                            locked
                              ? "text-white/55"
                              : "text-zinc-500"
                          }`}
                        >
                          {locked
                            ? `${selectedCount}/11 jugadores`
                            : selectedCount ===
                                11
                              ? `Puedes modificarlo hasta las ${lockTimeLabel}`
                              : `${selectedCount}/11 seleccionados · cierra a las ${lockTimeLabel}`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-black ${
                        locked
                          ? "bg-white text-zinc-950"
                          : "bg-zinc-950 text-white"
                      }`}
                    >
                      →
                    </span>
                  </div>

                  {!locked && (
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className="h-full rounded-full bg-[#0f3d2e]"
                        style={{
                          width: `${Math.min(
                            (
                              selectedCount /
                              11
                            ) *
                              100,
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </Link>
              </section>
            )}

          {/* MIS LIGAS */}
          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                  Fantasy
                </p>

                <h2 className="mt-1 text-xl font-black text-zinc-950">
                  Mis ligas
                </h2>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-500 shadow-sm ring-1 ring-black/5">
                {
                  leagues.length
                }
              </span>
            </div>

            <Link
              href="/fantasy/leagues"
              className="group block overflow-hidden rounded-[1.6rem] bg-zinc-950 p-5 text-white shadow-lg"
            >
              <div className="flex items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl">
                    🏆
                  </div>

                  <div>
                    <h3 className="text-lg font-black">
                      Tus competiciones
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      Clasificación, jornadas y puntos
                    </p>
                  </div>
                </div>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-black text-zinc-950 transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          </section>

          {/* CREAR / UNIRSE */}
          <section className="mt-3 grid grid-cols-2 gap-3">
            <Link
              href="/fantasy/leagues/create"
              className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f2ed] text-lg font-black text-[#0f3d2e]">
                +
              </div>

              <p className="mt-4 font-black text-zinc-950">
                Crear liga
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Nueva competición
              </p>
            </Link>

            <Link
              href="/fantasy/leagues/join"
              className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f2ed] text-lg font-black text-[#0f3d2e]">
                #
              </div>

              <p className="mt-4 font-black text-zinc-950">
                Unirme
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Introducir código
              </p>
            </Link>
          </section>

          {/* MATCH ADMIN */}
          {canAccessMatchAdmin && (
            <section className="mt-7">
              <p className="mb-3 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Equipo
              </p>

              <Link
                href="/match-admin"
                className="flex items-center justify-between rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0f3d2e] text-xl text-white">
                    ⚽
                  </div>

                  <div>
                    <p className="font-black text-zinc-950">
                      Match Admin
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Convocatoria, estadísticas, votos y resultados
                    </p>
                  </div>
                </div>

                <span className="ml-3 text-xl font-black text-zinc-300">
                  →
                </span>
              </Link>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function formatRole(
  role: string,
): string {
  switch (role) {
    case "entrenador":
      return "Entrenador";

    case "cuerpo_tecnico":
      return "Cuerpo técnico";

    case "directiva":
      return "Directiva";

    case "jugador":
      return "Jugador";

    default:
      return role;
  }
}