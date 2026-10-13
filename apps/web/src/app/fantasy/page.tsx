import Image from "next/image";

import Link from "next/link";





import {
  DeleteLeagueButton,
} from "@/app/fantasy/leagues/delete-league-button";

import {



  requireUser,



} from "@/lib/auth";







import {



  createServerSupabaseClient,



} from "@/lib/supabase/server";







import {



  canVote,



  formatRole,



  isAdminRole,



} from "@/lib/roles";







import {



  getFantasyLeagueById,



  getFantasyLeagueMembers,



  getUserFantasyLeagues,



} from "@/data/fantasy-leagues";







import {



  getFantasyLeagueStandings,



} from "@/data/fantasy-standings";







import {



  getUserFantasyMatchdays,



} from "@/data/fantasy-matchdays";







import {



  getFantasyLineup,



  getFantasyLineupPlayers,



} from "@/data/fantasy-lineups";







import {



  getMatches,



} from "@/data/matches";







import {



  getTeams,



} from "@/data/teams";







import LineupCountdown from "./lineup-countdown";

import LogoutButton from "./logout-button";



import ShareLeagueButton from "./share-league-button";







import LatestMatchdaySummary from "./latest-matchday-summary";

export default async function FantasyPage({



  searchParams,



}: {



  searchParams: Promise<{



    league?: string | string[];



  }>;



}) {



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



      .eq(



        "id",



        user.id,



      )



      .maybeSingle();







  const displayName =



    profile?.display_name ??



    user.user_metadata



      ?.display_name ??



    user.email?.split(



      "@",



    )[0] ??



    "Jugador";







  const canAccessMatchAdmin =



    isAdminRole(



      profile?.voter_role,



    );







  const userCanVote =



    canVote(



      profile?.voter_role,



    );







  /*



   * LIGAS DEL USUARIO



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



   * LIGA ACTIVA



   *



   * /fantasy



   * -> primera liga



   *



   * /fantasy?league=UUID



   * -> liga seleccionada



   */



  const query =



    await searchParams;







  const requestedLeagueId =



    typeof query.league ===



    "string"



      ? query.league



      : null;







  const activeLeague =



    requestedLeagueId



      ? leagues.find(



          (league) =>



            league.id ===



            requestedLeagueId,



        ) ??



        leagues[0] ??



        null



      : leagues[0] ??



        null;







  /*



   * Si todavía no pertenece a ninguna liga,



   * mostramos una Home básica.



   */



  if (!activeLeague) {

    

    return (



      <main className="app-screen bg-[#f2f4f2]">



        <div className="mx-auto max-w-xl">



          <header className="relative overflow-hidden rounded-b-[1.75rem] bg-[#0f3d2e] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.55rem)] text-white shadow-lg">
            <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/icon-192.png"
                      alt="Fantasy Regional"
                      width={24}
                      height={24}
                      priority
                      className="h-6 w-6 rounded-lg"
                    />

                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/50">
                      Fantasy Regional
                    </p>
                  </div>

                  <h1 className="mt-1.5 truncate text-[1.55rem] font-black tracking-tight">
                    Hola, {displayName}
                  </h1>

                  {profile?.voter_role && (
                    <div className="mt-1 inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white/70">
                      {formatRole(
                        profile.voter_role,
                      )}
                    </div>
                  )}
                </div>

                <div className="shrink-0 [&>button]:!min-h-9 [&>button]:!rounded-xl [&>button]:!px-3 [&>button]:!py-1.5 [&>button]:!text-[11px]">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </header>







          <div className="px-4 pb-8">



            <section className="mt-5 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">



              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ed] text-xl">



                🏆



              </div>







              <h2 className="mt-4 text-xl font-black text-zinc-950">



                Todavía no tienes ligas



              </h2>







              <p className="mt-2 text-sm leading-6 text-zinc-500">



                Crea una liga Fantasy o únete a una existente mediante su código.



              </p>







              <div className="mt-5 grid grid-cols-2 gap-3">



                <Link



                  href="/fantasy/leagues/create"



                  className="flex min-h-12 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-black text-white"



                >



                  Crear liga



                </Link>







                <Link



                  href="/fantasy/leagues/join"



                  className="flex min-h-12 items-center justify-center rounded-xl bg-white px-4 text-sm font-black text-zinc-950 ring-1 ring-zinc-200"



                >



                  Unirme



                </Link>



              </div>



            </section>

            {canAccessMatchAdmin && (
              <section className="mt-7">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                    Gestión
                  </p>

                  <Link
                    href="/"
                    className="text-[10px] font-black text-[#0f3d2e]"
                  >
                    Panel principal →
                  </Link>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/match-admin"
                    className="flex items-center justify-between rounded-[1.3rem] bg-white p-4 shadow-sm ring-1 ring-black/5 transition active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f3d2e] text-lg text-white">
                        ⚽
                      </div>

                      <div>
                        <p className="font-black text-zinc-950">
                          Match Admin
                        </p>

                        <p className="mt-0.5 text-[10px] leading-4 text-zinc-500">
                          Convocatorias, estadísticas, votos y resultados
                        </p>
                      </div>
                    </div>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f2ed] font-black text-[#0f3d2e]">
                      →
                    </span>
                  </Link>

                  <Link
                    href="/admin"
                    className="flex items-center justify-between rounded-[1.3rem] bg-[#e8f2ed] p-4 shadow-sm ring-1 ring-[#d7e8df] transition active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                        ⚙️
                      </div>

                      <div>
                        <p className="font-black text-[#0b2f23]">
                          Administración
                        </p>

                        <p className="mt-0.5 text-[10px] leading-4 text-[#557368]">
                          Clubs, equipos, jugadores, partidos y usuarios
                        </p>
                      </div>
                    </div>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] font-black text-white">
                      →
                    </span>
                  </Link>
                </div>
              </section>
            )}

          </div>



        </div>



      </main>



    );



  }







  /*



   * DATOS DE LA LIGA ACTIVA



   */



  const [



    members,



    standings,



    matchdays,



    matches,



    teams,



  ] =



    await Promise.all([



      getFantasyLeagueMembers(



        activeLeague.id,



      ),







      getFantasyLeagueStandings(



        activeLeague.id,



      ),







      getUserFantasyMatchdays({



        leagueId:



          activeLeague.id,







        userId:



          user.id,



      }),







      getMatches(),







      getTeams(),



    ]);







  /*



   * Seguridad adicional:



   * debe seguir siendo miembro.



   */



  const currentMembership =



    members.find(



      (member) =>



        member.user_id ===



        user.id,



    );







  if (!currentMembership) {



    return (



      <main className="mx-auto min-h-screen max-w-xl px-4 py-6">



        <section className="rounded-[1.5rem] bg-red-50 p-5 text-red-700">



          <h1 className="text-xl font-black">



            No tienes acceso a esta liga



          </h1>







          <p className="mt-2 text-sm">



            Debes pertenecer a la liga para ver su contenido.



          </p>







          <Link



            href="/fantasy/leagues"



            className="mt-5 inline-flex font-black underline"



          >



            Ir a mis ligas



          </Link>



        </section>



      </main>



    );



  }







  const now =



    Date.now();







  const teamNames =



    new Map(



      teams.map(



        (team) => [



          team.id,



          team.name,



        ],



      ),



    );







  /*



   * PRÓXIMO PARTIDO



   *



   * Ahora buscamos únicamente partidos



   * correspondientes a la liga ACTIVA.



   */



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



            match.home_team_id ===



              activeLeague.team_id ||



            match.away_team_id ===



              activeLeague.team_id



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



   * PARTIDO EN VOTACIÓN



   */



  const votingMatch =



    userCanVote



      ? matches



          .filter(



            (match) => {



              if (



                match.status !==



                "voting"



              ) {



                return false;



              }







              const belongsToLeague =



                match.home_team_id ===



                  activeLeague.team_id ||



                match.away_team_id ===



                  activeLeague.team_id;







              if (!belongsToLeague) {



                return false;



              }







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







              if (



                opensAt !== null &&



                Number.isFinite(



                  opensAt,



                ) &&



                now < opensAt



              ) {



                return false;



              }







              if (



                closesAt !== null &&



                Number.isFinite(



                  closesAt,



                ) &&



                now > closesAt



              ) {



                return false;



              }







              return true;



            },



          )



          .sort(



            (a, b) =>



              new Date(



                b.match_date,



              ).getTime() -



              new Date(



                a.match_date,



              ).getTime(),



          )[0] ??



        null



      : null;







  /*



   * XI DEL PRÓXIMO PARTIDO



   */



  let lineup:



    Awaited<



      ReturnType<



        typeof getFantasyLineup



      >



    > = null;







  let selectedCount =



    0;







  if (nextMatch) {



    lineup =



      await getFantasyLineup({



        leagueId:



          activeLeague.id,







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







  const votingHomeTeam =



    votingMatch



      ? teamNames.get(



          votingMatch.home_team_id,



        ) ??



        "Equipo local"



      : null;







  const votingAwayTeam =



    votingMatch



      ? teamNames.get(



          votingMatch.away_team_id,



        ) ??



        "Equipo visitante"



      : null;







  /*



   * BLOQUEO DEL XI



   */



  const lineupLockTime =



    nextMatch



      ? new Date(



          nextMatch.match_date,



        ).getTime() -



        2 *



          60 *



          60 *



          1000



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







  const votingDateLabel =



    votingMatch



      ? new Intl.DateTimeFormat(



          "es-ES",



          {



            weekday:



              "short",







            day:



              "numeric",







            month:



              "short",







            timeZone:



              "Europe/Madrid",



          },



        ).format(



          new Date(



            votingMatch.match_date,



          ),



        )



      : null;







  const votingCloseLabel =



    votingMatch



      ?.voting_closes_at



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



            votingMatch.voting_closes_at,



          ),



        )



      : null;







  const lineupHref =



    `/fantasy/leagues/${activeLeague.id}/lineup`;







  const lineupStatus =



    locked



      ? "Cerrado"



      : selectedCount ===



          11



        ? "Completo"



        : "Incompleto";







  const lineupActionLabel =



    locked



      ? "Ver XI"



      : selectedCount ===



          11



        ? "Editar XI"



        : "Preparar XI";







  const rivalTeam =



    nextMatch



      ? nextMatch.home_team_id ===



          activeLeague.team_id



        ? awayTeam



        : homeTeam



      : null;







  const venueLabel =



    nextMatch



      ? nextMatch.home_team_id ===



          activeLeague.team_id



        ? "En casa"



        : "Fuera de casa"



      : null;







  return (



    <main className="app-screen bg-[#f2f4f2]">



      <div className="mx-auto max-w-xl">



        {/* CABECERA */}



        <header className="relative overflow-hidden rounded-b-[1.75rem] bg-[#0f3d2e] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.55rem)] text-white shadow-lg">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

          <div className="absolute -left-14 bottom-[-62px] h-36 w-36 rounded-full border-[22px] border-white/5" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Image
                    src="/icon-192.png"
                    alt="Fantasy Regional"
                    width={24}
                    height={24}
                    priority
                    className="h-6 w-6 rounded-lg"
                  />

                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/50">
                    Fantasy Regional
                  </p>
                </div>

                <h1 className="mt-1.5 truncate text-[1.55rem] font-black tracking-tight">
                  Hola, {displayName}
                </h1>

                {profile?.voter_role && (
                  <div className="mt-1 inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white/70">
                    {formatRole(
                      profile.voter_role,
                    )}
                  </div>
                )}
              </div>

              <div className="shrink-0 [&>button]:!min-h-9 [&>button]:!rounded-xl [&>button]:!px-3 [&>button]:!py-1.5 [&>button]:!text-[11px]">
                <LogoutButton />
              </div>
            </div>

            <p className="mt-2 text-xs leading-4 text-white/60">
              Prepara tu XI y sigue tu jornada Fantasy.
            </p>
          </div>
        </header>







        <div className="px-4 pb-8">



          {/* LIGA ACTIVA */}



          <section className="mt-4">



            <div className="flex items-center justify-between rounded-[1.3rem] bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">



              <div className="flex min-w-0 items-center gap-3">



                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ed] text-base">



                  🏆



                </div>







                <div className="min-w-0">



                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">



                    Liga activa



                  </p>







                  <p className="truncate text-sm font-black text-zinc-950">



                    {activeLeague.name}



                  </p>







                  <p className="truncate text-[10px] text-zinc-500">



                    {activeLeague.team?.name ??



                      "Equipo no disponible"}



                  </p>



                </div>



              </div>







              <Link



                href="/fantasy/leagues"



                className="ml-3 shrink-0 rounded-xl bg-zinc-100 px-3 py-2 text-[10px] font-black text-zinc-700"



              >



                Cambiar



              </Link>



            </div>



          </section>







          {/* VOTACIÓN */}



          {votingMatch &&



            userCanVote && (



              <section className="mt-3">



                <Link



                  href={`/matches/${votingMatch.id}/vote`}



                  className="group block overflow-hidden rounded-[1.5rem] bg-[#d8f36a] p-4 shadow-md ring-1 ring-black/5 active:scale-[0.99]"



                >



                  <div className="flex items-center gap-3">



                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-lg">



                      🗳️



                    </div>







                    <div className="min-w-0 flex-1">



                      <div className="inline-flex rounded-full bg-[#0f3d2e] px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-white">



                        Votación abierta



                      </div>







                      <p className="mt-1.5 font-black text-zinc-950">



                        Valora el partido



                      </p>







                      <p className="mt-0.5 truncate text-[10px] font-bold text-zinc-600">



                        {votingHomeTeam}



                        {" · "}



                        {votingAwayTeam}



                      </p>







                      <p className="mt-0.5 text-[9px] capitalize text-zinc-500">



                        {votingDateLabel}







                        {votingCloseLabel



                          ? ` · Hasta ${votingCloseLabel}`



                          : ""}



                      </p>



                    </div>







                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 font-black text-white">



                      →



                    </span>



                  </div>



                </Link>



              </section>



            )}







          {/* PRÓXIMA JORNADA / ESTADO DEL XI */}



          {nextMatch ? (



            <section className="mt-5">



              <div className="mb-3 flex items-end justify-between px-1">



                <div>



                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">



                    Próxima jornada



                  </p>







                  <h2 className="mt-1 text-xl font-black text-zinc-950">



                    Tu próximo reto



                  </h2>



                </div>







                <span



                  className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wide ${



                    locked



                      ? "bg-zinc-950 text-white"



                      : selectedCount === 11



                        ? "bg-[#0f3d2e] text-white"



                        : "bg-amber-100 text-amber-800"



                  }`}



                >



                  {lineupStatus}



                </span>



              </div>







              <div className="overflow-hidden rounded-[1.65rem] bg-white shadow-md ring-1 ring-black/5">



                <div className="relative overflow-hidden bg-[#0f3d2e] px-5 pb-5 pt-4 text-white">



                  <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full border-[20px] border-white/5" />







                  <div className="relative z-10">



                    <div className="flex items-center justify-between gap-3">



                      <div>



                        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/50">



                          Rival



                        </p>







                        <p className="mt-1 text-xl font-black leading-tight">



                          {rivalTeam}



                        </p>



                      </div>







                      <div className="rounded-2xl bg-white/10 px-3 py-2 text-right ring-1 ring-white/10">



                        <p className="text-[8px] font-black uppercase tracking-wide text-white/50">



                          Partido



                        </p>







                        <p className="mt-0.5 text-[10px] font-black capitalize text-white">



                          {matchDateLabel}



                        </p>



                      </div>



                    </div>







                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white/70">



                      <span className="rounded-full bg-white/10 px-2.5 py-1">



                        {venueLabel}



                      </span>







                      <span>



                        {homeTeam} · {awayTeam}



                      </span>



                    </div>



                  </div>



                </div>







                <div className="p-4">



                  <div className="grid grid-cols-2 gap-3">



                    <div className="rounded-[1.1rem] bg-zinc-50 p-3 ring-1 ring-zinc-100">



                      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">



                        Tu XI



                      </p>







                      <div className="mt-1 flex items-end gap-1">



                        <span className="text-2xl font-black text-zinc-950">



                          {selectedCount}



                        </span>







                        <span className="pb-1 text-xs font-black text-zinc-400">



                          /11



                        </span>



                      </div>







                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">



                        <div



                          className={`h-full rounded-full ${



                            selectedCount === 11



                              ? "bg-[#0f3d2e]"



                              : "bg-amber-500"



                          }`}



                          style={{



                            width: `${Math.min(



                              100,



                              Math.round(



                                (selectedCount / 11) * 100,



                              ),



                            )}%`,



                          }}



                        />



                      </div>



                    </div>







                    <div className="rounded-[1.1rem] bg-[#e8f2ed] p-3 ring-1 ring-[#d7e8df]">



                      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#557368]">



                        Cierre del XI



                      </p>







                      {locked || lineupLockTime === null ? (



                        <p className="mt-2 text-sm font-black text-[#0b2f23]">



                          Alineación cerrada



                        </p>



                      ) : (



                        <LineupCountdown



                          lockAt={lineupLockTime}



                          fallbackLabel={`Cierra a las ${lockTimeLabel}`}



                        />



                      )}



                    </div>



                  </div>







                  <div className="mt-4 flex items-center justify-between gap-3">



                    <div className="min-w-0">



                      <p className="text-sm font-black text-zinc-950">



                        {locked



                          ? "Tu XI ya está bloqueado"



                          : selectedCount === 11



                            ? "Tu alineación está lista"



                            : "Completa tu alineación"}

                      </p>







                      <p className="mt-0.5 text-[10px] leading-4 text-zinc-500">



                        {locked



                          ? `${selectedCount}/11 jugadores seleccionados`



                          : selectedCount === 11



                            ? `Puedes cambiarla hasta las ${lockTimeLabel}`



                            : `Te faltan ${11 - selectedCount} jugadores · cierre ${lockTimeLabel}`}

                      </p>



                    </div>







                    <Link



                      href={lineupHref}



                      className={`shrink-0 rounded-xl px-4 py-3 text-[10px] font-black transition active:scale-[0.99] ${



                        locked



                          ? "bg-zinc-950 text-white"



                          : "bg-[#0f3d2e] text-white"



                      }`}



                    >



                      {lineupActionLabel} →



                    </Link>



                  </div>



                </div>



              </div>



            </section>



          ) : (



            <section className="mt-5 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">



              <div className="flex items-start gap-3">



                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ed] text-lg">



                  📅



                </div>







                <div>



                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">



                    Próxima jornada



                  </p>







                  <p className="mt-1 font-black text-zinc-950">



                    No hay partido programado



                  </p>







                  <p className="mt-1 text-xs leading-5 text-zinc-500">



                    Cuando se programe el próximo partido aparecerán aquí el rival, el cierre del XI y tu estado de alineación.



                  </p>



                </div>



              </div>



            </section>



          )}







          {/* RESUMEN */}



          <section className="mt-4 grid grid-cols-3 gap-2">



            <div className="rounded-xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-black/5">



              <p className="text-xl font-black text-zinc-950">



                {members.length}



              </p>







              <p className="mt-0.5 text-[8px] font-black uppercase tracking-wide text-zinc-400">



                Jugadores



              </p>



            </div>







            <div className="rounded-xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-black/5">



              <p className="text-xl font-black text-zinc-950">



                {matchdays.length}



              </p>







              <p className="mt-0.5 text-[8px] font-black uppercase tracking-wide text-zinc-400">



                Jornadas



              </p>



            </div>







            <div className="rounded-xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-black/5">



              <p className="text-xl font-black text-[#0f3d2e]">



                {getMyPosition(



                  standings,



                  user.id,



                )}



              </p>







              <p className="mt-0.5 text-[8px] font-black uppercase tracking-wide text-zinc-400">



                Posición



              </p>



            </div>



          </section>







          {/* ÚLTIMA JORNADA */}
          <LatestMatchdaySummary
            leagueId={activeLeague.id}
            userId={user.id}
            matchdays={matchdays}
            standings={standings}
          />

          {/* CLASIFICACIÓN */}
          <section className="mt-7">
            <div className="flex items-end justify-between px-1">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                  Liga
                </p>
                <h2 className="mt-1 text-xl font-black text-zinc-950">
                  Clasificación
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-zinc-400">
                {standings.length} jugadores
              </span>
            </div>

            {standings.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-[1.15rem] bg-[#0f3d2e] px-3 py-3 text-white">
                  <p className="text-[8px] font-black uppercase tracking-wide text-white/55">
                    Líder
                  </p>
                  <p className="mt-1 truncate text-sm font-black">
                    {standings[0].display_name}
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {standings[0].total_points}
                    <span className="ml-1 text-[9px] text-white/60">
                      pts
                    </span>
                  </p>
                </div>
                <div className="rounded-[1.15rem] bg-[#e8f2ed] px-3 py-3">
                  <p className="text-[8px] font-black uppercase tracking-wide text-[#557368]">
                    Tu distancia al líder
                  </p>
                  <p className="mt-1 text-xl font-black text-[#0f3d2e]">
                    {standings.find(
                      (standing) =>
                        standing.user_id === user.id,
                    )?.points_behind_leader ?? 0}
                    <span className="ml-1 text-[9px] text-[#557368]">
                      pts
                    </span>
                  </p>
                  <p className="mt-1 text-[9px] text-[#557368]">
                    {getMyPosition(standings, user.id)} posición
                  </p>
                </div>
              </div>
            )}

            <div className="mt-3 overflow-hidden rounded-[1.4rem] bg-white shadow-sm ring-1 ring-black/5">
              <div className="grid grid-cols-[32px_minmax(0,1fr)_48px_48px] items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-2">
                <span className="text-[8px] font-black uppercase text-zinc-400">
                  Pos
                </span>
                <span className="text-[8px] font-black uppercase text-zinc-400">
                  Jugador
                </span>
                <span className="text-center text-[8px] font-black uppercase text-zinc-400">
                  Últ.
                </span>
                <span className="text-right text-[8px] font-black uppercase text-zinc-400">
                  Total
                </span>
              </div>
              {standings.map((standing, index) => {
                const isCurrentUser =
                  standing.user_id === user.id;

                return (
                  <div
                    key={standing.user_id}
                    className={`grid grid-cols-[32px_minmax(0,1fr)_48px_48px] items-center gap-2 border-b border-zinc-100 px-3 py-3 last:border-b-0 ${
                      isCurrentUser
                        ? "bg-[#edf5f1]"
                        : "bg-white"
                    }`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black ${
                      index === 0
                        ? "bg-[#0f3d2e] text-white"
                        : index < 3
                          ? "bg-[#e8f2ed] text-[#0f3d2e]"
                          : "bg-zinc-100 text-zinc-600"
                    }`}>
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-xs font-black text-zinc-950">
                          {standing.display_name}
                        </p>
                        {isCurrentUser && (
                          <span className="shrink-0 rounded-full bg-[#0f3d2e] px-1.5 py-0.5 text-[7px] font-black text-white">
                            Tú
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[9px] font-bold">
                        {standing.position_change === null ? (
                          <span className="text-zinc-400">
                            Sin comparativa
                          </span>
                        ) : standing.position_change > 0 ? (
                          <span className="text-emerald-700">
                            ▲ {standing.position_change} puesto{standing.position_change === 1 ? "" : "s"}
                          </span>
                        ) : standing.position_change < 0 ? (
                          <span className="text-red-600">
                            ▼ {Math.abs(standing.position_change)} puesto{standing.position_change === -1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="text-zinc-400">
                            — Sin cambios
                          </span>
                        )}
                        <span className="text-zinc-400">
                          {index === 0
                            ? "Líder"
                            : `-${standing.points_behind_leader} pts`}
                        </span>
                      </div>
                    </div>
                    <p className="text-center text-xs font-bold text-zinc-600">
                      {standing.last_match_points === null
                        ? "—"
                        : standing.last_match_points}
                    </p>
                    <p className="text-right text-sm font-black text-zinc-950">
                      {standing.total_points}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 px-1 text-[10px] leading-4 text-zinc-400">
              Últ. = puntos de la última jornada finalizada.
              Las flechas comparan la posición con la jornada anterior.
            </p>
          </section>
          {/* JORNADAS */}



          <section className="mt-7">



            <div className="flex items-end justify-between px-1">



              <div>



                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">



                  Partidos



                </p>







                <h2 className="mt-1 text-xl font-black text-zinc-950">



                  Jornadas



                </h2>



              </div>







              <span className="text-[10px] font-semibold text-zinc-400">



                {matchdays.length}



              </span>



            </div>







            {matchdays.length === 0 ? (



              <div className="mt-3 rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">



                <p className="font-black text-zinc-950">



                  Todavía no tienes jornadas



                </p>







                <p className="mt-1 text-xs text-zinc-500">



                  Cuando guardes un XI para un partido aparecerá aquí.



                </p>



              </div>



            ) : (



              <div className="mt-3 space-y-3">



                {matchdays.map(



                  (



                    matchday,



                  ) => {



                    const hasScore =



                      matchday.home_score !==



                        null &&



                      matchday.away_score !==



                        null;







                    const date =



                      new Intl.DateTimeFormat(



                        "es-ES",



                        {



                          dateStyle:



                            "medium",







                          timeStyle:



                            "short",







                          timeZone:



                            "Europe/Madrid",



                        },



                      ).format(



                        new Date(



                          matchday.match_date,



                        ),



                      );







                    return (



                      <div



                        key={



                          matchday.match_id



                        }



                        className="overflow-hidden rounded-[1.4rem] bg-white shadow-sm ring-1 ring-black/5"



                      >



                        <div className="p-4">



                          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">



                            {date}



                          </p>







                          <div className="mt-3 space-y-2">



                            <div className="flex items-center justify-between gap-3">



                              <p className="truncate text-xs font-black text-zinc-950">



                                {matchday.home_team_name}



                              </p>







                              {hasScore && (



                                <span className="text-lg font-black text-zinc-950">



                                  {matchday.home_score}



                                </span>



                              )}



                            </div>







                            <div className="flex items-center justify-between gap-3">



                              <p className="truncate text-xs font-black text-zinc-950">



                                {matchday.away_team_name}



                              </p>







                              {hasScore && (



                                <span className="text-lg font-black text-zinc-950">



                                  {matchday.away_score}



                                </span>



                              )}



                            </div>



                          </div>



                        </div>







                        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/70 px-4 py-3">



                          {matchday.points_status ===



                          "ready" ? (



                            <>



                              <div>



                                <p className="text-[8px] font-black uppercase tracking-wide text-zinc-400">



                                  Tus puntos



                                </p>







                                <p className="text-xl font-black text-[#0f3d2e]">



                                  {matchday.total_points}







                                  <span className="ml-1 text-[9px] text-zinc-400">



                                    pts



                                  </span>



                                </p>



                              </div>







                              <Link



                                href={`/fantasy/leagues/${activeLeague.id}/matches/${matchday.match_id}`}



                                className="rounded-xl bg-zinc-950 px-3 py-2 text-[10px] font-black text-white"



                              >



                                Ver puntos →



                              </Link>



                            </>



                          ) : (



                            <>



                              <div>



                                <p className="text-xs font-black text-zinc-700">



                                  Puntos pendientes



                                </p>







                                <p className="text-[9px] text-zinc-400">



                                  Esperando cierre



                                </p>



                              </div>







                              <span className="rounded-full bg-zinc-200/70 px-3 py-1 text-[8px] font-black uppercase text-zinc-500">



                                Pendiente



                              </span>



                            </>



                          )}



                        </div>



                      </div>



                    );



                  },



                )}



              </div>



            )}



          </section>







          {/* INVITAR */}



          <section className="mt-7">



            <p className="px-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">



              Invitar



            </p>







            <div className="mt-2 flex items-center justify-between rounded-[1.3rem] bg-[#e8f2ed] p-4">



              <div>



                <p className="text-[10px] font-bold text-[#557368]">



                  Código de liga



                </p>







                <p className="mt-1 text-xl font-black tracking-[0.16em] text-[#0b2f23]">



                  {activeLeague.code}



                </p>



              </div>







              <ShareLeagueButton



                leagueName={



                  activeLeague.name



                }



                code={



                  activeLeague.code



                }



              />



            </div>



          </section>







          {/* PARTICIPANTES */}



          <section className="mt-7">



            <div className="flex items-center justify-between px-1">



              <h2 className="text-lg font-black text-zinc-950">



                Participantes



              </h2>







              <span className="text-[10px] font-semibold text-zinc-400">



                {members.length}



              </span>



            </div>







            <div className="mt-3 overflow-hidden rounded-[1.3rem] bg-white shadow-sm ring-1 ring-black/5">



              {members.map(



                (member) => (



                  <div



                    key={



                      member.id



                    }



                    className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 last:border-b-0"



                  >



                    <div className="flex min-w-0 items-center gap-3">



                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f2ed] text-xs font-black text-[#0f3d2e]">



                        {getInitials(



                          member.profile



                            ?.display_name ??



                            "Usuario",



                        )}



                      </div>







                      <p className="truncate text-xs font-bold text-zinc-950">



                        {member.profile



                          ?.display_name ??



                          "Usuario"}



                      </p>



                    </div>







                    {member.user_id ===



                      activeLeague.created_by && (



                      <span className="ml-3 rounded-full bg-zinc-100 px-2 py-1 text-[8px] font-black uppercase text-zinc-500">



                        Creador



                      </span>



                    )}



                  </div>



                ),



              )}



            </div>



          </section>







{/* DIRECTIVA / ADMINISTRACIÓN */}
{canAccessMatchAdmin && (
  <section className="mt-7">
    <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
      Gestión
    </p>

    <div className="space-y-3">
      <Link
        href="/match-admin"
        className="flex items-center justify-between rounded-[1.3rem] bg-white p-4 shadow-sm ring-1 ring-black/5 transition active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f3d2e] text-lg text-white">
            ⚽
          </div>

          <div>
            <p className="font-black text-zinc-950">
              Match Admin
            </p>

            <p className="mt-0.5 text-[10px] leading-4 text-zinc-500">
              Convocatorias, estadísticas, votos y resultados
            </p>
          </div>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f2ed] font-black text-[#0f3d2e]">
          →
        </span>
      </Link>

      <Link
        href="/admin"
        className="flex items-center justify-between rounded-[1.3rem] bg-[#e8f2ed] p-4 shadow-sm ring-1 ring-[#d7e8df] transition active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
            ⚙️
          </div>

          <div>
            <p className="font-black text-[#0b2f23]">
              Administración
            </p>

            <p className="mt-0.5 text-[10px] leading-4 text-[#557368]">
              Clubs, equipos, jugadores, partidos y usuarios
            </p>
          </div>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] font-black text-white">
          →
        </span>
      </Link>
    </div>
  </section>
)}



        </div>



      </div>



    </main>



  );



}







function getMyPosition(



  standings: Array<{



    user_id: string;



  }>,



  userId: string,



): string {



  const index =



    standings.findIndex(



      (standing) =>



        standing.user_id ===



        userId,



    );







  if (index === -1) {



    return "-";



  }







  return `${index + 1}º`;



}







function getInitials(



  name: string,



): string {



  return name



    .trim()



    .split(/\s+/)



    .slice(0, 2)



    .map(



      (part) =>



        part



          .charAt(0)



          .toUpperCase(),



    )



    .join("");



}