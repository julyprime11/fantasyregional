import Link from "next/link";

import {
  notFound,
} from "next/navigation";

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
  requireUser,
} from "@/lib/auth";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

import {
  canPlayFantasy,
  canVote,
  formatRole,
} from "@/lib/roles";

import {
  submitVotesAction,
} from "@/app/matches/[id]/vote/actions";

import {
  MobileVoteForm,
} from "./vote-form";

export default async function MatchVotePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const user =
    await requireUser();

  const {
    id,
  } =
    await params;

  let matchId:
    string;

  try {
    matchId =
      parseMatchId(
        id,
      );
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
      <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2] px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <p
          role="alert"
          className="rounded-[1.2rem] bg-red-50 p-4 text-sm font-bold text-red-700"
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
      <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2] px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <p
          role="alert"
          className="rounded-[1.2rem] bg-red-50 p-4 text-sm font-bold text-red-700"
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
      .from(
        "profiles",
      )
      .select(
        "display_name, voter_role",
      )
      .eq(
        "id",
        user.id,
      )
      .maybeSingle();
      const userCanVote =
  canVote(
    profile?.voter_role,
  );

const userCanPlayFantasy =
  canPlayFantasy(
    profile?.voter_role,
  );

const backHref =
  userCanPlayFantasy
    ? "/fantasy"
    : "/matches";

const backLabel =
  userCanPlayFantasy
    ? "← Fantasy"
    : "← Partidos";

  /*
   * Solo se votan jugadores
   * que hayan disputado minutos.
   */
  const votingPlayers =
    squad.filter(
      (
        entry,
      ) =>
        entry.minutes_played >
        0,
    );

  const votingPlayerIds =
    new Set(
      votingPlayers.map(
        (
          entry,
        ) =>
          entry.player_id,
      ),
    );

  const relevantExistingVotes =
    existingVotes.filter(
      (
        vote,
      ) =>
        votingPlayerIds.has(
          vote.player_id,
        ),
    );

  const existingVotesByPlayer =
    new Map(
      relevantExistingVotes.map(
        (
          vote,
        ) => [
          vote.player_id,
          vote.score,
        ],
      ),
    );

  const teamNames =
    new Map(
      teams.map(
        (
          team,
        ) => [
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
    relevantExistingVotes.length;

  const totalCount =
    votingPlayers.length;

  const progress =
    totalCount >
    0
      ? Math.round(
          (
            votedCount /
            totalCount
          ) *
            100,
        )
      : 0;

  const now =
    Date.now();

  const opensAt =
    match.voting_opens_at
      ? new Date(
          match.voting_opens_at,
        ).getTime()
      : null;

  const closesAt =
    match.voting_closes_at
      ? new Date(
          match.voting_closes_at,
        ).getTime()
      : null;

  const votingNotStarted =
    opensAt !==
      null &&
    Number.isFinite(
      opensAt,
    ) &&
    now <
      opensAt;

  const votingExpired =
    closesAt !==
      null &&
    Number.isFinite(
      closesAt,
    ) &&
    now >
      closesAt;

  const votingAvailable =
    match.status ===
      "voting" &&
    !votingNotStarted &&
    !votingExpired;

  return (
    <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2]">
      {/* CABECERA PWA */}
      <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.65rem)] text-white shadow-lg">
        <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

        <div className="absolute -left-14 bottom-[-60px] h-36 w-36 rounded-full border-[22px] border-white/5" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
          <Link
  href={backHref}
  className="text-xs font-bold text-white/65"
>
  {backLabel}
</Link>

            {profile && (
              <div className="rounded-xl bg-white/10 px-2.5 py-1.5 text-right">
                <p className="max-w-[130px] truncate text-[9px] font-black text-white">
                  {profile.display_name ??
                    "Usuario"}
                </p>

                <p className="mt-0.5 text-[7px] font-black uppercase tracking-wide text-white/45">
                  {formatRole(
                    profile.voter_role,
                  )}
                </p>
              </div>
            )}
          </div>

          <p className="mt-3 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
            Valoración del partido
          </p>

          <h1 className="mt-0.5 text-[2rem] font-black tracking-tight">
            Votación
          </h1>

          <p className="mt-0.5 text-xs text-white/55">
            Puntúa el rendimiento de los jugadores
          </p>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* PARTIDO */}
        <section className="mt-3 overflow-hidden rounded-[1.25rem] bg-white shadow-sm ring-1 ring-black/5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3">
            <p className="text-right text-[11px] font-black leading-4 text-zinc-950">
              {homeTeam}
            </p>

            {hasResult ? (
              <div className="rounded-xl bg-zinc-950 px-3 py-2 text-center text-white">
                <p className="whitespace-nowrap text-base font-black">
                  {match.home_score}

                  <span className="mx-1.5 text-zinc-500">
                    -
                  </span>

                  {match.away_score}
                </p>
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-[9px] font-black text-white">
                VS
              </div>
            )}

            <p className="text-left text-[11px] font-black leading-4 text-zinc-950">
              {awayTeam}
            </p>
          </div>
        </section>

        {/* PROGRESO */}
        {match.status ===
          "voting" &&
          totalCount >
            0 && (
            <section className="mt-2.5 rounded-[1rem] bg-[#e8f2ed] px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#557368]">
                    Tu progreso
                  </p>

                  <p className="mt-0.5 text-xs font-black text-[#0b2f23]">
                    {votedCount} de{" "}
                    {totalCount} guardados
                  </p>
                </div>

                <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#0f3d2e] px-2 text-[10px] font-black text-white">
                  {progress}%
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-[#0f3d2e]"
                  style={{
                    width:
                      `${progress}%`,
                  }}
                />
              </div>
            </section>
          )}

        {/* SIN PERMISO */}
        {!userCanVote && (
          <section className="mt-3 rounded-[1rem] bg-zinc-100 p-3">
            <p className="text-xs font-black text-zinc-800">
              Votación no disponible
            </p>

            <p className="mt-1 text-[10px] leading-4 text-zinc-600">
              Tu tipo de usuario no tiene permiso para votar los partidos.
            </p>
          </section>
        )}

        {/* ESTADO DE VOTACIÓN */}
        {match.status !==
        "voting" ? (
          <section className="mt-4 rounded-[1.2rem] bg-amber-50 p-4">
            <p className="font-black text-amber-900">
              Votación cerrada
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              Este partido no tiene la votación abierta actualmente.
            </p>
          </section>
        ) : votingNotStarted ? (
          <section className="mt-4 rounded-[1.2rem] bg-amber-50 p-4">
            <p className="font-black text-amber-900">
              La votación todavía no ha comenzado
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              El plazo está configurado, pero todavía no ha llegado la hora de apertura.
            </p>
          </section>
        ) : votingExpired ? (
          <section className="mt-4 rounded-[1.2rem] bg-amber-50 p-4">
            <p className="font-black text-amber-900">
              Votación finalizada
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              El plazo configurado para votar este partido ya ha terminado.
            </p>
          </section>
        ) : votingPlayers.length ===
          0 ? (
          <section className="mt-4 rounded-[1.2rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
            <p className="font-black text-zinc-950">
              No hay jugadores disponibles para votar.
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Solo aparecen jugadores que hayan disputado minutos.
            </p>
          </section>
        ) : (
          <MobileVoteForm
            action={submitVotesAction.bind(
              null,
              match.id,
            )}
            disabled={
              !userCanVote ||
              !votingAvailable
            }
            players={votingPlayers.map(
              (
                entry,
              ) => ({
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
                  entry.team
                    ?.name ??
                  "Equipo no disponible",

                existingScore:
                  existingVotesByPlayer.get(
                    entry.player_id,
                  ) ??
                  null,
              }),
            )}
          />
        )}
      </div>
    </main>
  );
}