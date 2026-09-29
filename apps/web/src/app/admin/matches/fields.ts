import { MATCH_STATUSES } from "@regional-fantasy/shared";
import type { MatchStatus } from "@/lib/supabase/database.types";
import type { CompetitionRow } from "@/data/competitions";
import type { TeamRow } from "@/data/teams";
import type { Field } from "../create-form";

export const matchStatusLabels: Record<MatchStatus, string> = {
  scheduled: "Programado", finished: "Finalizado", voting: "Votación abierta", closed: "Cerrado",
};

export function matchFields(teams: TeamRow[], competitions: CompetitionRow[]): Field[] {
  const options = teams.map(team => ({ value: team.id, label: team.name + (team.category ? " — " + team.category : "") }));
  return [
    { name: "competition_id", label: "Competición (opcional)", options: competitions.map(item => ({ value: item.id, label: item.name })) },
    { name: "home_team_id", label: "Equipo local", required: true, options, differentFrom: "away_team_id" },
    { name: "away_team_id", label: "Equipo visitante", required: true, options, differentFrom: "home_team_id" },
    { name: "match_date", label: "Fecha y hora del partido (UTC)", type: "datetime-local", required: true },
    { name: "home_score", label: "Goles locales", type: "number" },
    { name: "away_score", label: "Goles visitantes", type: "number" },
    { name: "status", label: "Estado", required: true, options: MATCH_STATUSES.map(value => ({ value, label: matchStatusLabels[value] })) },
    { name: "voting_opens_at", label: "Apertura de votación (UTC)", type: "datetime-local" },
    { name: "voting_closes_at", label: "Cierre de votación (UTC)", type: "datetime-local" },
  ];
}

export function toDateInput(value: string | null): string {
  return value === null ? "" : new Date(value).toISOString().slice(0, -1);
}
