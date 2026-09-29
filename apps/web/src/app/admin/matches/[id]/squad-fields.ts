import type { Field } from "../../create-form";

export const squadStatsFields: Field[] = [
  { name: "starter", label: "Titular", type: "checkbox" },
  { name: "minutes_played", label: "Minutos jugados", type: "number", required: true },
  { name: "goals", label: "Goles", type: "number", required: true },
  { name: "assists", label: "Asistencias", type: "number", required: true },
  { name: "yellow_cards", label: "Tarjetas amarillas", type: "number", required: true },
  { name: "red_cards", label: "Tarjetas rojas", type: "number", required: true },
  { name: "clean_sheet", label: "Portería a cero", type: "checkbox" },
];
