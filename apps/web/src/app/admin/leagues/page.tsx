import Link from "next/link";

import {
  getAdminFantasyLeagueAudit,
  getAdminFantasyLeagueStandings,
  type AdminLeagueOverview,
} from "@/data/admin-fantasy-leagues";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function matchesSearch(league: AdminLeagueOverview, term: string): boolean {
  if (!term) return true;

  const values = [
    league.name,
    league.code,
    league.teamName,
    league.creator.displayName,
    league.creator.email ?? "",
    ...league.members.flatMap((member) => [
      member.displayName,
      member.email ?? "",
    ]),
  ];

  return values.some((value) => normalize(value).includes(term));
}

export default async function AdminLeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    standing?: string | string[];
  }>;
}) {
  const { q, standing } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 120);
  const search = normalize(query);
  const { leagues, canSeeEmails } = await getAdminFantasyLeagueAudit();
  const filtered = leagues.filter((league) => matchesSearch(league, search));

  // Calculamos solo la clasificacion solicitada, nunca todas las del listado.
  const requestedStandingId = typeof standing === "string" ? standing : "";
  const selectedLeague = filtered.find((league) => league.id === requestedStandingId);
  const leagueStandings = selectedLeague
    ? await getAdminFantasyLeagueStandings(selectedLeague.id)
    : null;

  function standingsHref(leagueId: string | null): string {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (leagueId) params.set("standing", leagueId);
    const searchParamsString = params.toString();
    const hash = leagueId ? `#liga-${leagueId}` : selectedLeague ? `#liga-${selectedLeague.id}` : "";
    return `/admin/leagues${searchParamsString ? `?${searchParamsString}` : ""}${hash}`;
  }

  return (
    <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2] pb-12">
      <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-7 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
        <div className="relative">
          <Link href="/admin" className="text-xs font-bold text-white/65">
            ← Administración
          </Link>
          <p className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-white/50">
            Supervisión · Solo lectura
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Ligas Fantasy
          </h1>
          <p className="mt-2 text-xs leading-5 text-white/65">
            Consulta las ligas creadas, quién las administra y sus participantes.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">{leagues.length}</p>
              <p className="text-[10px] text-white/65">Ligas registradas</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">
                {leagues.reduce((sum, league) => sum + league.members.length, 0)}
              </p>
              <p className="text-[10px] text-white/65">Inscripciones actuales</p>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 pt-5">
        {!canSeeEmails && (
          <section className="rounded-[1.1rem] bg-amber-50 p-4 text-xs leading-5 text-amber-900 ring-1 ring-amber-200">
            <p className="font-black">Correos restringidos</p>
            <p className="mt-1">
              Solo los administradores de plataforma autorizados pueden
              consultar los correos. Puedes revisar aquí las ligas y sus
              participantes por nombre.
            </p>
          </section>
        )}

        <form action="/admin/leagues" method="get" role="search" className="rounded-[1.2rem] bg-white p-3 shadow-sm ring-1 ring-black/5">
          <label htmlFor="league-search" className="block text-[10px] font-black text-[#0f3d2e]">
            Buscar liga, código, equipo o usuario
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="league-search"
              name="q"
              type="search"
              maxLength={120}
              defaultValue={query}
              placeholder="Nombre, código, participante…"
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-[#0f3d2e]"
            />
            <button type="submit" className="rounded-xl bg-[#0f3d2e] px-4 text-xs font-black text-white">
              Buscar
            </button>
          </div>
          {query && (
            <Link href="/admin/leagues" className="mt-2 inline-block text-xs font-bold text-[#0f3d2e] underline">
              Limpiar búsqueda
            </Link>
          )}
        </form>

        <section aria-label="Ligas registradas" className="space-y-3">
          <p className="px-1 text-[11px] font-semibold text-zinc-500">
            {filtered.length} {filtered.length === 1 ? "liga encontrada" : "ligas encontradas"}
          </p>

          {filtered.length === 0 ? (
            <div className="rounded-[1.2rem] bg-white p-6 text-center text-sm text-zinc-500 shadow-sm ring-1 ring-black/5">
              {leagues.length === 0
                ? "Todavía no hay ligas registradas."
                : "No hay ligas que coincidan con la búsqueda."}
            </div>
          ) : (
            filtered.map((league) => (
              <article id={`liga-${league.id}`} key={league.id} className="scroll-mt-4 overflow-hidden rounded-[1.2rem] bg-white shadow-sm ring-1 ring-black/5">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-black text-zinc-950">
                        {league.name}
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{league.teamName}</p>
                    </div>
                    <span className="shrink-0 rounded-xl bg-[#e8f2ed] px-3 py-2 text-xs font-black text-[#0f3d2e]">
                      {league.members.length} 👥
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-xl bg-zinc-50 p-3">
                      <p className="font-bold text-zinc-400">Código</p>
                      <p className="mt-1 break-all font-black tracking-wider text-zinc-800">{league.code}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50 p-3">
                      <p className="font-bold text-zinc-400">Creada</p>
                      <p className="mt-1 font-black text-zinc-800">{formatDate(league.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-[#e8f2ed] p-3 text-xs">
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#557368]">
                      Creador
                    </p>
                    <p className="mt-1 font-black text-[#0b2f23]">{league.creator.displayName}</p>
                    {canSeeEmails && (
                      <p className="mt-1 break-all text-[#416656]">
                        {league.creator.email ?? "Correo no disponible"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-zinc-100 px-4 py-3">
                  <Link
                    href={standingsHref(selectedLeague?.id === league.id ? null : league.id)}
                    aria-expanded={selectedLeague?.id === league.id}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-[#e8f2ed] px-4 py-3 text-xs font-black text-[#0f3d2e] focus-visible:outline-2 focus-visible:outline-[#0f3d2e]"
                  >
                    <span>{selectedLeague?.id === league.id ? "Ocultar clasificación" : "Ver clasificación"}</span>
                    <span aria-hidden="true">{selectedLeague?.id === league.id ? "−" : "→"}</span>
                  </Link>
                </div>

                {selectedLeague?.id === league.id && leagueStandings && (
                  <section
                    aria-label={`Clasificación de ${league.name}`}
                    className="border-t border-zinc-100 bg-[#f5f8f6] p-4"
                  >
                    <div className="mb-4">
                      <h3 className="text-base font-black text-[#0b2f23]">Clasificación Fantasy</h3>
                      <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                        Puntos acumulados de las jornadas con resultados definitivos.
                      </p>
                    </div>
                    {leagueStandings.length === 0 ? (
                      <p className="rounded-xl bg-white p-4 text-xs text-zinc-500">
                        Todavía no hay participantes con clasificación.
                      </p>
                    ) : (
                      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200">
                        <div className="grid grid-cols-[2rem_minmax(0,1fr)_4.8rem] gap-2 bg-zinc-100 px-3 py-2 text-[10px] font-black text-zinc-500">
                          <span>Pos.</span>
                          <span>Participante</span>
                          <span className="text-right">Puntos</span>
                        </div>
                        <ol>
                          {leagueStandings.map((entry, index) => (
                            <li
                              key={entry.user_id}
                              className="grid grid-cols-[2rem_minmax(0,1fr)_4.8rem] items-center gap-2 border-t border-zinc-100 px-3 py-3"
                            >
                              <span className="text-sm font-black text-[#0f3d2e]">{index + 1}.</span>
                              <div className="min-w-0">
                                <p className="break-words text-xs font-bold text-zinc-900">{entry.display_name}</p>
                                <p className="mt-1 text-[10px] text-zinc-500">
                                  {entry.played_matches} {entry.played_matches === 1 ? "jornada puntuada" : "jornadas puntuadas"}
                                </p>
                              </div>
                              <span className="text-right text-base font-black tabular-nums text-[#0f3d2e]">
                                {entry.total_points}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </section>
                )}

                <details className="group border-t border-zinc-100">
                  <summary className="cursor-pointer list-none px-4 py-4 text-xs font-black text-[#0f3d2e] focus-visible:outline-2 focus-visible:outline-[#0f3d2e]">
                    <span className="flex items-center justify-between gap-2">
                      <span>Ver participantes ({league.members.length})</span>
                      <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
                    </span>
                  </summary>
                  <div className="space-y-2 bg-zinc-50 p-3">
                    {league.members.length === 0 ? (
                      <p className="p-3 text-xs text-zinc-500">Esta liga no tiene participantes actualmente.</p>
                    ) : (
                      league.members.map((member) => (
                        <div key={member.userId} className="rounded-xl bg-white p-3 ring-1 ring-black/5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-words text-xs font-black text-zinc-900">
                                {member.displayName}
                                {member.userId === league.creator.userId && (
                                  <span className="ml-1 font-semibold text-[#557368]">· Creador</span>
                                )}
                              </p>
                              {canSeeEmails && (
                                <p className="mt-1 break-all text-xs text-zinc-600">
                                  {member.email ?? "Correo no disponible"}
                                </p>
                              )}
                              <p className="mt-2 text-[10px] text-zinc-400">
                                Inscrito: {formatDate(member.joinedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </details>
              </article>
            ))
          )}
        </section>

        <p className="px-1 text-[11px] leading-5 text-zinc-500">
          Esta pantalla no modifica ligas ni usuarios. La suspensión, eliminación
          y notificación por correo se incorporarán en un bloque posterior
          con registro de auditoría y protección del historial Fantasy.
        </p>
      </div>
    </main>
  );
}
