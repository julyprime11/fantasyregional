import Image from "next/image";

import Link from "next/link";







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







import LogoutButton from "./logout-button";



import ShareLeagueButton from "./share-league-button";







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







          {/* PRÓXIMO PARTIDO */}



          {nextMatch ? (



            <section className="mt-5">



              <div className="mb-3 flex items-center justify-between px-1">



                <div>



                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">



                    Jornada



                  </p>







                  <h2 className="mt-1 text-xl font-black text-zinc-950">



                    Próximo partido



                  </h2>



                </div>



              </div>







              <div className="overflow-hidden rounded-[1.4rem] bg-white shadow-sm ring-1 ring-black/5">



                <div className="flex items-center gap-3 px-4 py-4">



                  <div className="min-w-0 flex-1 text-right">



                    <p className="text-xs font-black leading-4 text-zinc-950">



                      {homeTeam}



                    </p>



                  </div>







                  <div className="rounded-xl bg-zinc-950 px-3 py-2 text-[9px] font-black text-white">



                    VS



                  </div>







                  <div className="min-w-0 flex-1">



                    <p className="text-xs font-black leading-4 text-zinc-950">



                      {awayTeam}



                    </p>



                  </div>



                </div>







                <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-2 text-center">



                  <p className="text-[10px] font-bold capitalize text-zinc-500">



                    {matchDateLabel}



                  </p>



                </div>



              </div>



            </section>



          ) : (



            <section className="mt-5 rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">



              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">



                Jornada



              </p>







              <p className="mt-1.5 font-black text-zinc-950">



                No hay próximo partido



              </p>







              <p className="mt-1 text-xs leading-5 text-zinc-500">



                Cuando haya un partido programado aparecerá aquí.



              </p>



            </section>



          )}







          {/* MI XI */}



          {nextMatch && (



            <section className="mt-3">



              <Link



                href={



                  lineupHref



                }



                className={`block rounded-[1.4rem] p-4 ${



                  locked



                    ? "bg-zinc-950 text-white"



                    : selectedCount ===



                        11



                      ? "bg-[#e8f2ed]"



                      : "bg-white shadow-sm ring-1 ring-black/5"



                }`}



              >



                <div className="flex items-center justify-between gap-4">



                  <div className="flex min-w-0 items-center gap-3">



                    <div



                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black ${



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







                    <div>



                      <p



                        className={`text-[8px] font-black uppercase tracking-[0.16em] ${



                          locked



                            ? "text-white/45"



                            : "text-zinc-400"



                        }`}



                      >



                        Mi XI



                      </p>







                      <p



                        className={`mt-0.5 font-black ${



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



                        className={`mt-0.5 text-[10px] ${



                          locked



                            ? "text-white/55"



                            : "text-zinc-500"



                        }`}



                      >



                        {locked



                          ? `${selectedCount}/11 jugadores`



                          : selectedCount ===



                              11



                            ? `Editable hasta las ${lockTimeLabel}`



                            : `${selectedCount}/11 · cierra ${lockTimeLabel}`}



                      </p>



                    </div>



                  </div>







                  <span



                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-black ${



                      locked



                        ? "bg-white text-zinc-950"



                        : "bg-zinc-950 text-white"



                    }`}



                  >



                    →



                  </span>



                </div>



              </Link>



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







            <div className="mt-3 overflow-hidden rounded-[1.4rem] bg-white shadow-sm ring-1 ring-black/5">



              <div className="grid grid-cols-[36px_1fr_42px_48px] items-center border-b border-zinc-100 bg-zinc-50 px-3 py-2">



                <span className="text-[8px] font-black uppercase text-zinc-400">



                  Pos



                </span>







                <span className="text-[8px] font-black uppercase text-zinc-400">



                  Jugador



                </span>







                <span className="text-center text-[8px] font-black uppercase text-zinc-400">



                  PJ



                </span>







                <span className="text-right text-[8px] font-black uppercase text-zinc-400">



                  Pts



                </span>



              </div>







              {standings.map(



                (



                  standing,



                  index,



                ) => {



                  const isCurrentUser =



                    standing.user_id ===



                    user.id;







                  return (



                    <div



                      key={



                        standing.user_id



                      }



                      className={`grid grid-cols-[36px_1fr_42px_48px] items-center border-b border-zinc-100 px-3 py-3 last:border-b-0 ${



                        isCurrentUser



                          ? "bg-[#edf5f1]"



                          : "bg-white"



                      }`}



                    >



                      <span



                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black ${



                          index === 0



                            ? "bg-[#0f3d2e] text-white"



                            : "bg-zinc-100 text-zinc-600"



                        }`}



                      >



                        {index + 1}



                      </span>







                      <div className="flex min-w-0 items-center gap-2">



                        <p className="truncate text-xs font-black text-zinc-950">



                          {standing.display_name}



                        </p>







                        {isCurrentUser && (



                          <span className="rounded-full bg-[#0f3d2e] px-1.5 py-0.5 text-[7px] font-black uppercase text-white">



                            Tú



                          </span>



                        )}



                      </div>







                      <p className="text-center text-xs font-semibold text-zinc-500">



                        {standing.played_matches}



                      </p>







                      <p className="text-right text-sm font-black text-zinc-950">



                        {standing.total_points}



                      </p>



                    </div>



                  );



                },



              )}



            </div>



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