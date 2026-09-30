import Link from "next/link";
import { notFound } from "next/navigation";

import {
  parseMatchId,
} from "@regional-fantasy/shared";

import {
  getMatchById,
} from "@/data/matches";

import {
  getTeams,
} from "@/data/teams";

import {
  getCompetitions,
} from "@/data/competitions";

import {
  updateMatchAction,
} from "../../../actions";

import {
  CreateForm,
} from "../../../create-form";

import {
  matchFields,
  toDateInput,
} from "../../fields";

const statusLabels: Record<
  string,
  string
> = {
  scheduled: "Programado",
  voting: "Votación abierta",
  finished: "Finalizado",
  closed: "Cerrado",
};

const statusClasses: Record<
  string,
  string
> = {
  scheduled:
    "bg-blue-50 text-blue-700",

  voting:
    "bg-amber-50 text-amber-700",

  finished:
    "bg-zinc-100 text-zinc-600",

  closed:
    "bg-[#e8f2ed] text-[#0f3d2e]",
};

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  let matchId: string;

  try {
    matchId =
      parseMatchId(id);
  } catch {
    notFound();
  }

  let loaded;

  try {
    loaded =
      await Promise.all([
        getMatchById(
          matchId,
        ),
        getTeams(),
        getCompetitions(),
      ]);
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-xl">
        <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

          <div className="relative z-10">
            <Link
              href="/match-admin"
              className="text-sm font-bold text-white/70"
            >
              ← Match Admin
            </Link>

            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
              Configuración
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Editar partido
            </h1>
          </div>
        </header>

        <div className="px-4">
          <section className="mt-5 rounded-[1.5rem] bg-red-50 p-5">
            <p className="font-black text-red-700">
              No se pudo cargar el partido.
            </p>

            <p className="mt-2 text-sm text-red-600">
              Inténtalo de nuevo.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const [
    match,
    teams,
    competitions,
  ] = loaded;

  if (!match) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-6">
        <h1 className="text-2xl font-black text-zinc-950">
          Partido no encontrado
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          El partido ya no está disponible.
        </p>

        <Link
          href="/match-admin"
          className="mt-5 inline-flex font-black text-[#0f3d2e]"
        >
          ← Volver a partidos
        </Link>
      </main>
    );
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
    match.home_score !== null &&
    match.away_score !== null;

  const matchDate =
    new Intl.DateTimeFormat(
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
        match.match_date,
      ),
    );

  return (
    <main className="mx-auto min-h-screen max-w-xl">
      {/* CABECERA */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

        <div className="relative z-10">
          <Link
            href={`/match-admin/${match.id}`}
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
                Editar partido
              </h1>

              <p className="mt-1 text-sm text-white/60">
                Configuración general del encuentro
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wide ${
                statusClasses[
                  match.status
                ] ??
                "bg-white/10 text-white"
              }`}
            >
              {statusLabels[
                match.status
              ] ??
                match.status}
            </span>
          </div>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* RESUMEN PARTIDO */}
        <section className="mt-5 overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-black/5">
          <div className="px-5 py-5">
            <p className="text-center text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
              Partido
            </p>

            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
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
                    {
                      match.home_score
                    }

                    <span className="mx-2 text-zinc-500">
                      -
                    </span>

                    {
                      match.away_score
                    }
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

          <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-center">
            <p className="text-xs font-bold capitalize text-zinc-500">
              {matchDate}
            </p>
          </div>
        </section>

        {/* AVISO HORARIO */}
        <section className="mt-4 rounded-[1.3rem] bg-[#e8f2ed] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] text-sm text-white">
              ◷
            </div>

            <div>
              <p className="font-black text-[#0b2f23]">
                Fecha y hora
              </p>

              <p className="mt-1 text-xs leading-5 text-[#557368]">
                Los campos técnicos de fecha se guardan en UTC.
                La aplicación los mostrará posteriormente en la zona horaria correspondiente.
              </p>
            </div>
          </div>
        </section>

        {/* FORMULARIO */}
        <section className="mt-8">
          <div className="px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
              Configuración
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
              Datos del partido
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Modifica equipos, fecha, resultado y estado.
            </p>
          </div>

          {teams.length <
            2 && (
            <div className="mt-4 rounded-[1.3rem] bg-amber-50 p-4">
              <p className="font-black text-amber-900">
                Faltan equipos
              </p>

              <p className="mt-1 text-sm text-amber-700">
                Necesitas al menos dos equipos para guardar el partido.
              </p>
            </div>
          )}

          <div
            className="
              mt-4 rounded-[1.6rem] bg-white p-5 shadow-sm ring-1 ring-black/5

              [&_form]:space-y-5

              [&_label]:block
              [&_label]:text-xs
              [&_label]:font-black
              [&_label]:uppercase
              [&_label]:tracking-wide
              [&_label]:text-zinc-500

              [&_input]:mt-2
              [&_input]:h-14
              [&_input]:w-full
              [&_input]:rounded-[1rem]
              [&_input]:border-0
              [&_input]:bg-zinc-100
              [&_input]:px-4
              [&_input]:text-base
              [&_input]:font-semibold
              [&_input]:text-zinc-950
              [&_input]:outline-none
              [&_input]:ring-1
              [&_input]:ring-transparent
              focus:[&_input]:bg-white
              focus:[&_input]:ring-[#0f3d2e]

              [&_select]:mt-2
              [&_select]:h-14
              [&_select]:w-full
              [&_select]:rounded-[1rem]
              [&_select]:border-0
              [&_select]:bg-zinc-100
              [&_select]:px-4
              [&_select]:text-base
              [&_select]:font-semibold
              [&_select]:text-zinc-950
              [&_select]:outline-none
              [&_select]:ring-1
              [&_select]:ring-transparent
              focus:[&_select]:bg-white
              focus:[&_select]:ring-[#0f3d2e]

              [&_button[type=submit]]:mt-3
              [&_button[type=submit]]:flex
              [&_button[type=submit]]:min-h-14
              [&_button[type=submit]]:w-full
              [&_button[type=submit]]:items-center
              [&_button[type=submit]]:justify-center
              [&_button[type=submit]]:rounded-[1.2rem]
              [&_button[type=submit]]:border-0
              [&_button[type=submit]]:bg-[#0f3d2e]
              [&_button[type=submit]]:px-5
              [&_button[type=submit]]:text-base
              [&_button[type=submit]]:font-black
              [&_button[type=submit]]:text-white
              [&_button[type=submit]]:shadow-lg
              disabled:[&_button[type=submit]]:opacity-40
            "
          >
            <CreateForm
              key={
                match.id
              }
              action={updateMatchAction.bind(
                null,
                match.id,
              )}
              fields={matchFields(
                teams,
                competitions,
              )}
              disabled={
                teams.length <
                2
              }
              submitLabel="Guardar cambios"
              initialValues={{
                competition_id:
                  match.competition_id ??
                  "",

                home_team_id:
                  match.home_team_id,

                away_team_id:
                  match.away_team_id,

                match_date:
                  toDateInput(
                    match.match_date,
                  ),

                home_score:
                  match.home_score ===
                  null
                    ? ""
                    : String(
                        match.home_score,
                      ),

                away_score:
                  match.away_score ===
                  null
                    ? ""
                    : String(
                        match.away_score,
                      ),

                status:
                  match.status,

                voting_opens_at:
                  toDateInput(
                    match.voting_opens_at,
                  ),

                voting_closes_at:
                  toDateInput(
                    match.voting_closes_at,
                  ),
              }}
            />
          </div>
        </section>

        {/* INFORMACIÓN ESTADO */}
        <section className="mt-5 rounded-[1.4rem] bg-zinc-950 p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg">
              ⚙
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
                Estado actual
              </p>

              <p className="mt-1 font-black">
                {statusLabels[
                  match.status
                ] ??
                  match.status}
              </p>

              <p className="mt-1 text-xs leading-5 text-white/55">
                {getStatusDescription(
                  match.status,
                )}
              </p>
            </div>
          </div>
        </section>

        {/* CANCELAR */}
        <section className="mt-4">
          <Link
            href={`/match-admin/${match.id}`}
            className="flex min-h-12 w-full items-center justify-center rounded-[1.1rem] bg-white px-4 text-sm font-black text-zinc-500 shadow-sm ring-1 ring-black/5"
          >
            Cancelar y volver al partido
          </Link>
        </section>
      </div>
    </main>
  );
}

function getStatusDescription(
  status: string,
): string {
  switch (status) {
    case "scheduled":
      return "El partido está programado y todavía puede prepararse la convocatoria.";

    case "voting":
      return "La votación está abierta y los usuarios autorizados pueden valorar jugadores.";

    case "finished":
      return "El encuentro ha finalizado y puede prepararse la fase de votación.";

    case "closed":
      return "El partido está cerrado y las valoraciones finales ya están disponibles.";

    default:
      return "Configura el estado actual del partido.";
  }
}