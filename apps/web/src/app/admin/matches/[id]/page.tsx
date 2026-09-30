import Link from "next/link";
import { notFound } from "next/navigation";

import { parseMatchId } from "@regional-fantasy/shared";

import { getMatchById } from "@/data/matches";
import { getTeams } from "@/data/teams";
import { getCompetitions } from "@/data/competitions";
import {
  getMatchPlayers,
  getEligibleSquadPlayers,
} from "@/data/match-players";

import {
  addMatchPlayerAction,
  removeMatchPlayerAction,
} from "../../actions";

import { CreateForm } from "../../create-form";
import { matchStatusLabels } from "../fields";
import { isDevelopmentVotingEnabled } from "@/lib/development-voting";

export default async function ManageMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let matchId: string;

  try {
    matchId = parseMatchId(id);
  } catch {
    notFound();
  }

  let match;

  try {
    match = await getMatchById(matchId);
  } catch {
    return (
      <p role="alert">
        No se pudo cargar el partido. Inténtalo de nuevo.
      </p>
    );
  }

  if (!match) {
    return (
      <>
        <h1>Partido no encontrado</h1>

        <Link
          href="/admin/matches"
          className="underline"
        >
          Volver a partidos
        </Link>
      </>
    );
  }

  let loaded;

  try {
    loaded = await Promise.all([
      getTeams(),
      getCompetitions(),
      getMatchPlayers(match.id),
      getEligibleSquadPlayers(match),
    ]);
  } catch {
    return (
      <>
        <h1>Gestionar partido</h1>

        <p role="alert">
          No se pudo cargar la convocatoria o los datos del partido.
          Inténtalo de nuevo.
        </p>
      </>
    );
  }

  const [
    teams,
    competitions,
    squad,
    eligible,
  ] = loaded;

  const teamNames = new Map(
    teams.map((team) => [
      team.id,
      team.name,
    ]),
  );

  const selected = new Set(
    squad.map(
      (entry) => entry.player_id,
    ),
  );

  const available =
    eligible.filter(
      (player) =>
        !selected.has(player.id),
    );

  const competition =
    competitions.find(
      (item) =>
        item.id ===
        match.competition_id,
    );

  const date =
    new Intl.DateTimeFormat(
      "es-ES",
      {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      },
    ).format(
      new Date(match.match_date),
    );

  return (
    <>
      <h1 className="text-2xl font-semibold">
        Gestionar partido
      </h1>

      <p className="mt-4">
        <strong>
          {teamNames.get(
            match.home_team_id,
          ) ?? "Equipo local"}
          {" — "}
          {teamNames.get(
            match.away_team_id,
          ) ?? "Equipo visitante"}
        </strong>
      </p>

      <p>
        <time dateTime={match.match_date}>
          {date} UTC
        </time>
      </p>

      <p>
        Resultado:{" "}
        {match.home_score === null &&
        match.away_score === null
          ? "Sin resultado"
          : `${match.home_score ?? "—"} - ${match.away_score ?? "—"}`}
      </p>

      <p>
        Estado:{" "}
        {matchStatusLabels[
          match.status
        ]}
      </p>

      <p>
        Competición:{" "}
        {competition?.name ??
          (match.competition_id
            ? "No disponible"
            : "Sin competición")}
      </p>

      <div className="mt-4 space-y-2">
        <p>
          <Link
            href={`/admin/matches/${match.id}/edit`}
            className="underline"
          >
            Editar datos del partido
          </Link>
        </p>

        <p>
          <Link
            href={`/admin/matches/${match.id}/results`}
            className="underline"
          >
            Resultados / MVP
          </Link>
        </p>

        {match.status ===
          "voting" &&
          isDevelopmentVotingEnabled() && (
            <p>
              <Link
                href={`/matches/${match.id}/vote`}
                className="underline"
              >
                Votar (desarrollo)
              </Link>
            </p>
          )}
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Convocatoria
            </h2>

            <p className="mt-1 text-sm text-zinc-600">
              Selecciona los jugadores convocados para este partido.
            </p>
          </div>

          <span className="text-sm text-zinc-500">
            {squad.length} jugadores
          </span>
        </div>

        <div className="mt-5 rounded-xl border border-zinc-200 p-4">
          {available.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No hay jugadores activos disponibles para añadir.
            </p>
          ) : (
            <CreateForm
              action={addMatchPlayerAction.bind(
                null,
                match.id,
              )}
              disabled={
                available.length === 0
              }
              submitLabel="Añadir a la convocatoria"
              fields={[
                {
                  name: "player_id",
                  label: "Jugador",
                  required: true,
                  options:
                    available.map(
                      (player) => ({
                        value:
                          player.id,

                        label:
                          `${player.first_name} ${
                            player.last_name ??
                            ""
                          } — ${
                            teamNames.get(
                              player.team_id,
                            ) ??
                            "Equipo"
                          } — ${
                            player.position
                          }${
                            player.shirt_number ===
                            null
                              ? ""
                              : ` — Dorsal ${player.shirt_number}`
                          }`,
                      }),
                    ),
                },
              ]}
            />
          )}
        </div>

        {squad.length === 0 ? (
          <p className="mt-6">
            La convocatoria está vacía.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {squad.map(
              (entry) => (
                <article
                  key={entry.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4"
                >
                  <div>
                    <h3 className="font-semibold">
                      {entry.player
                        ? `${entry.player.first_name} ${
                            entry.player.last_name ??
                            ""
                          }`.trim()
                        : "Jugador no disponible"}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      {entry.team
                        ?.name ??
                        "Equipo no disponible"}
                      {" · "}
                      {entry.player
                        ?.position ??
                        "Sin posición"}

                      {entry.player
                        ?.shirt_number !=
                      null
                        ? ` · Dorsal ${entry.player.shirt_number}`
                        : ""}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <CreateForm
                      action={removeMatchPlayerAction.bind(
                        null,
                        match.id,
                        entry.id,
                      )}
                      fields={[]}
                      submitLabel="Quitar"
                    />
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>

      <p className="mt-8">
        <Link
          href="/admin/matches"
          className="underline"
        >
          ← Volver a partidos
        </Link>
      </p>
    </>
  );
}