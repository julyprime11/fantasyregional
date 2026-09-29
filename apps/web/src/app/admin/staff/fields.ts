import type { TeamRow } from "@/data/teams";
import type { Field } from "../create-form";

export function staffFields(teams: TeamRow[]): Field[] {
  return [
    {
      name: "team_id", label: "Equipo", required: true,
      options: teams.map(team => ({
        value: team.id,
        label: team.name + (team.category ? " — " + team.category : ""),
      })),
    },
    { name: "first_name", label: "Nombre", required: true },
    { name: "last_name", label: "Apellidos" },
    { name: "role", label: "Cargo (texto libre)", required: true },
    { name: "image_url", label: "URL de la imagen", type: "url" },
    { name: "active", label: "Activo", type: "checkbox" },
  ];
}
