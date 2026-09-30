import Link from "next/link";
import { notFound } from "next/navigation";

import {
  parseMatchId,
} from "@regional-fantasy/shared";

import {
  getMatchById,
} from "@/data/matches";

import {
  getMatchPlayers,
} from "@/data/match-players";

import {
  getTeams,
} from "@/data/teams";

import {
  getUserMatchVotes,
} from "@/data/ratings";

import {
  isDevelopmentVotingEnabled,
} from "@/lib/development-voting";

import {
  requireUser,
} from "@/lib/auth";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

import {
  submitVotesAction,
} from "@/app/matches/[id]/vote/actions";

import {
  MobileVoteForm,
} from "./vote-form";

export default async function MatchAdminVotePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  if (
    !isDevelopmentVotingEnabled()
  ) {
    return (
      <main className="mx-auto min-h-screen max-w-xl">
        <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
              Match Admin
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Votación
            </h1>
          </div>
        </header>

        <div className="px-4">
          <section className="mt-5 rounded-[1.5rem] bg-amber-50 p-5">
            <p className="font-black text-amber-800">
              Votación no disponible
            </p>

            <p className="mt-2 text-sm text-amber-700">
              La votación temporal solo está habilitada durante el desarrollo.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const user =
    await requireUser();

  const { id } =
    await params;

  let matchId: string;

  try {
    matchId =
      parseMatchId(id);
  } catch {
    notFound();
  }

  let match;

  try {
    match =
      await getMatchById(
        matchId,
      );
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-6">
        <p
          role="alert"
          className="rounded-[1.3rem] bg-red-50 p-4 text-sm font-bold text-red-700"
        >
          No se pudo cargar el partido.
        </p>
      </main>
    );
  }

  if (!match) {
    notFound();
  }

  let teams;
  let squad;
  let existingVotes;

  try {
    [
      teams,
      squad,
      existingVotes,
    ] =
      await Promise.all([
        getTeams(),

        match.status ===
        "voting"
          ? getMatchPlayers(
              matchId,
            )
          : Promise.resolve(
              [],
            ),

        match.status ===
        "voting"
          ? getUserMatchVotes(
              matchId,
              user.id,
            )
          : Promise.resolve(
              [],
            ),
      ]);
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-6">
        <p
          role="alert"
          className="rounded-[1.3rem] bg-red-50 p-4 text-sm font-bold text-red-700"
        >
          No se pudo cargar la convocatoria o los votos existentes.
        </p>
      </main>
    );
  }

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
      .eq(
        "id",
        user.id,
      )
      .maybeSingle();

  const existingVotesByPlayer =
    new Map(
      existingVotes.map(
        (vote) => [
          vote.player_id,
          vote.score,
        ],
      ),
    );

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
    teamNames.get(
      match.home_team_id,
    ) ??
    "Equipo local";

  const awayTeam =
    teamNames.get(
      match.away_team_id,
    ) ??
    "Equipo visitante";

  const hasResult =
    match.home_score !==
      null &&
    match.away_score !==
      null;

  const votedCount =
    existingVotes.length;

  const totalCount =
    squad.length;

  return (
    <main className="mx-auto min-h-screen max-w-xl">
      {/* CABECERA */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

        <div className="relative z-10">
          <Link
            href={`/match-admin/${matchId}`}
            className="text-sm font-bold text-white/70"
          >
            ← Volver al partido
          </Link>

          <div className="mt-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
                Match Admin
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight">
                Votación
              </h1>

              <p className="mt-1 text-sm text-white/60">
                Puntúa el rendimiento de los jugadores
              </p>
            </div>

            {profile && (
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                <p className="text-[10px] font-black text-white">
                  {profile.display_name}
                </p>

                <p className="mt-0.5 text-[9px] uppercase tracking-wide text-white/45">
                  {profile.voter_role ??
                    "Sin rol"}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* PARTIDO */}
        <section className="mt-5 overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-black/5">
          <div className="px-5 py-5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f2ed] text-lg">
                  ⚽
                </div>

                <p className="mt-2 text-sm font-black leading-5 text-zinc-950">
                  {homeTeam}
                </p>
              </div>

              {hasResult ? (
                <div className="rounded-2xl bg-zinc-950 px-4 py-3 text-center text-white">
                  <p className="whitespace-nowrap text-xl font-black">
                    {match.home_score}
                    <span className="mx-2 text-zinc-500">
                      -
                    </span>
                    {match.away_score}
                  </p>
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-[10px] font-black text-zinc-400">
                  VS
                </div>
              )}

              <div className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-lg">
                  ⚽
                </div>

                <p className="mt-2 text-sm font-black leading-5 text-zinc-950">
                  {awayTeam}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PROGRESO */}
        <section className="mt-4 rounded-[1.4rem] bg-[#e8f2ed] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#557368]">
                Progreso
              </p>

              <p className="mt-1 font-black text-[#0b2f23]">
                {votedCount} de {totalCount} votados
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f3d2e] text-sm font-black text-white">
              {totalCount > 0
                ? Math.round(
                    (votedCount /
                      totalCount) *
                      100,
                  )
                : 0}
              %
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-[#0f3d2e]"
              style={{
                width: `${
                  totalCount > 0
                    ? Math.min(
                        (votedCount /
                          totalCount) *
                          100,
                        100,
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </section>

        {!profile?.voter_role && (
          <section className="mt-5 rounded-[1.3rem] bg-red-50 p-4">
            <p className="font-black text-red-700">
              Rol de votación no configurado
            </p>

            <p className="mt-1 text-sm leading-5 text-red-600">
              Tu usuario necesita un valor en profiles.voter_role para poder votar.
            </p>
          </section>
        )}

        {match.status !==
        "voting" ? (
          <section className="mt-6 rounded-[1.4rem] bg-amber-50 p-5">
            <p className="font-black text-amber-900">
              Votación cerrada
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-700">
              El partido debe estar en estado «Votación abierta» para puntuar.
            </p>
          </section>
        ) : squad.length ===
          0 ? (
          <section className="mt-6 rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="font-black text-zinc-950">
              No hay jugadores disponibles para votar.
            </p>
          </section>
        ) : (
          <MobileVoteForm
            action={submitVotesAction.bind(
              null,
              match.id,
            )}
            disabled={
              !profile?.voter_role
            }
            players={squad.map(
              (entry) => ({
                id:
                  entry.player_id,

                name:
                  entry.player
                    ? `${entry.player.first_name} ${
                        entry.player.last_name ??
                        ""
                      }`.trim()
                    : "Jugador no disponible",

                shirtNumber:
                  entry.player
                    ?.shirt_number ??
                  null,

                position:
                  entry.player
                    ?.position ??
                  "Sin posición",

                team:
                  entry.team?.name ??
                  "Equipo no disponible",

                existingScore:
                  existingVotesByPlayer.get(
                    entry.player_id,
                  ) ?? null,
              }),
            )}
          />
        )}
      </div>
    </main>
  );
}