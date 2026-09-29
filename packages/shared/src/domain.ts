export const PLAYER_POSITIONS = [
  "GK", "RB", "CB", "LB", "RWB", "LWB", "DM", "CM", "AM", "RW", "LW", "ST",
] as const;

export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];

export interface Player {
  id: string;
  name: string;
  teamId: string;
  position: PlayerPosition;
}

export interface Team {
  id: string;
  name: string;
}
