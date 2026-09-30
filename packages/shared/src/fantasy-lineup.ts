import type { PlayerPosition } from "./domain";

export type FantasyLine = "GK" | "DEF" | "MID" | "FWD";

export type FantasyLineupPlayer = {
  id: string;
  position: PlayerPosition;
};

export type FantasyLineupValidationResult =
  | {
      valid: true;
      errors: [];
      counts: FantasyLineupCounts;
    }
  | {
      valid: false;
      errors: string[];
      counts: FantasyLineupCounts;
    };

export type FantasyLineupCounts = {
  total: number;
  goalkeepers: number;
  defenders: number;
  midfielders: number;
  forwards: number;
};

const DEFENDER_POSITIONS: readonly PlayerPosition[] = [
  "RB",
  "CB",
  "LB",
  "RWB",
  "LWB",
];

const MIDFIELDER_POSITIONS: readonly PlayerPosition[] = [
  "DM",
  "CM",
  "AM",
];

const FORWARD_POSITIONS: readonly PlayerPosition[] = [
  "RW",
  "LW",
  "ST",
];

export function getFantasyLine(
  position: PlayerPosition,
): FantasyLine {
  if (position === "GK") {
    return "GK";
  }

  if (DEFENDER_POSITIONS.includes(position)) {
    return "DEF";
  }

  if (MIDFIELDER_POSITIONS.includes(position)) {
    return "MID";
  }

  if (FORWARD_POSITIONS.includes(position)) {
    return "FWD";
  }

 throw new Error(
    `Posición no válida para Fantasy: ${position}`,
  );
}

export function getFantasyLineupCounts(
  players: readonly FantasyLineupPlayer[],
): FantasyLineupCounts {
  let goalkeepers = 0;
  let defenders = 0;
  let midfielders = 0;
  let forwards = 0;

  for (const player of players) {
    const line = getFantasyLine(player.position);

    switch (line) {
      case "GK":
        goalkeepers += 1;
        break;

      case "DEF":
        defenders += 1;
        break;

      case "MID":
        midfielders += 1;
        break;

      case "FWD":
        forwards += 1;
        break;
    }
  }

  return {
    total: players.length,
    goalkeepers,
    defenders,
    midfielders,
    forwards,
  };
}

export function validateFantasyLineup(
  players: readonly FantasyLineupPlayer[],
): FantasyLineupValidationResult {
  const errors: string[] = [];
  const counts = getFantasyLineupCounts(players);

  const uniquePlayerIds = new Set(
    players.map((player) => player.id),
  );

  if (uniquePlayerIds.size !== players.length) {
    errors.push(
      "No puedes seleccionar el mismo jugador más de una vez.",
    );
  }

  if (counts.total !== 11) {
    errors.push(
      `Debes seleccionar exactamente 11 jugadores. Actualmente hay ${counts.total}.`,
    );
  }

  if (counts.goalkeepers !== 1) {
    errors.push(
      `Debes seleccionar exactamente 1 portero. Actualmente hay ${counts.goalkeepers}.`,
    );
  }

  if (
    counts.defenders < 3 ||
    counts.defenders > 5
  ) {
    errors.push(
      `Debes seleccionar entre 3 y 5 defensas. Actualmente hay ${counts.defenders}.`,
    );
  }

  if (
    counts.midfielders < 3 ||
    counts.midfielders > 5
  ) {
    errors.push(
      `Debes seleccionar entre 3 y 5 centrocampistas. Actualmente hay ${counts.midfielders}.`,
    );
  }

  if (
    counts.forwards < 1 ||
    counts.forwards > 3
  ) {
    errors.push(
      `Debes seleccionar entre 1 y 3 delanteros. Actualmente hay ${counts.forwards}.`,
    );
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      counts,
    };
  }

  return {
    valid: true,
    errors: [],
    counts,
  };
}