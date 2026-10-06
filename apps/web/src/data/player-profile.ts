import "server-only";

import {
  getMatchResults,
} from "./match-results";

import {
  getMatches,
} from "./matches";

import {
  getPlayerById,
} from "./players";

import {
  getTeams,
} from "./teams";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

export type PlayerProfileMatch = {
  match_id: string;

  match_date: string;

  home_team_id: string;

  away_team_id: string;

  home_team_name: string;

  away_team_name: string;

  home_score:
    number | null;

  away_score:
    number | null;

  minutes_played: number;

  starter: boolean;

  goals: number;

  assists: number;

  yellow_cards: number;

  red_cards: number;

  clean_sheet: boolean;

  final_rating:
    number | null;

  fantasy_points:
    number | null;

  is_mvp: boolean;

  final:
    boolean;
};

export type PlayerProfileStats = {
  appearances: number;

  starts: number;

  minutes: number;

  goals: number;

  assists: number;

  yellow_cards: number;

  red_cards: number;

  clean_sheets: number;

  average_rating:
    number | null;

  fantasy_points: number;

  fantasy_average:
    number | null;

  mvp_count: number;
};

export type PlayerProfileData = {
  player: {
    id: string;

    first_name: string;

    last_name:
      string | null;

    shirt_number:
      number | null;

    position: string;

    image_url:
      string | null;

    active: boolean;

    team_id: string;
  };

  team: {
    id: string;

    name: string;

    category:
      string | null;
  } | null;

  stats:
    PlayerProfileStats;

  matches:
    PlayerProfileMatch[];
};

export async function getPlayerProfile(
  playerId: string,
): Promise<PlayerProfileData | null> {
  const [
    player,
    teams,
    matches,
  ] =
    await Promise.all([
      getPlayerById(
        playerId,
      ),

      getTeams(),

      getMatches(),
    ]);

  if (!player) {
    return null;
  }

  const team =
    teams.find(
      (
        item,
      ) =>
        item.id ===
        player.team_id,
    ) ??
    null;

  const teamNames =
    new Map(
      teams.map(
        (
          item,
        ) => [
          item.id,
          item.name,
        ],
      ),
    );

  const matchById =
    new Map(
      matches.map(
        (
          match,
        ) => [
          match.id,
          match,
        ],
      ),
    );

  const supabase =
    await createServerSupabaseClient();

  /*
   * Recuperamos todos los partidos en los
   * que este jugador ha formado parte de
   * la convocatoria.
   */
  const {
    data:
      playerMatchRows,
    error:
      playerMatchesError,
  } =
    await supabase
      .from(
        "match_players",
      )
      .select(
        `
          id,
          match_id,
          team_id,
          starter,
          minutes_played,
          goals,
          assists,
          yellow_cards,
          red_cards,
          clean_sheet
        `,
      )
      .eq(
        "player_id",
        player.id,
      );

  if (
    playerMatchesError
  ) {
    throw playerMatchesError;
  }

  const profileMatches:
    PlayerProfileMatch[] = [];

  for (
    const entry of
    playerMatchRows
  ) {
    const match =
      matchById.get(
        entry.match_id,
      );

    if (!match) {
      continue;
    }

    /*
     * getMatchResults es nuestra fuente única
     * para notas, puntos Fantasy y MVP.
     *
     * De esta forma el perfil utiliza exactamente
     * las mismas reglas que Match Admin y las
     * ligas Fantasy.
     */
    const results =
      await getMatchResults(
        match.id,
      );

    let finalRating:
      number | null =
      null;

    let fantasyPoints:
      number | null =
      null;

    let isMvp =
      false;

    let isFinal =
      false;

    if (
      results.status ===
      "ready"
    ) {
      const resultRow =
        results.rows.find(
          (
            row,
          ) =>
            row.entry.player_id ===
            player.id,
        );

      finalRating =
        resultRow
          ?.rating
          .final_rating ??
        null;

      /*
       * Solo consideramos puntos Fantasy
       * definitivos cuando la fase también
       * es final.
       */
      if (
        results.phase ===
        "final"
      ) {
        isFinal =
          true;

        fantasyPoints =
          resultRow
            ?.fantasy
            ?.points ??
          null;

        isMvp =
          results.mvp.players.some(
            (
              mvpPlayer,
            ) =>
              mvpPlayer.player_id ===
              player.id,
          );
      }
    }

    profileMatches.push({
      match_id:
        match.id,

      match_date:
        match.match_date,

      home_team_id:
        match.home_team_id,

      away_team_id:
        match.away_team_id,

      home_team_name:
        teamNames.get(
          match.home_team_id,
        ) ??
        "Equipo local",

      away_team_name:
        teamNames.get(
          match.away_team_id,
        ) ??
        "Equipo visitante",

      home_score:
        match.home_score,

      away_score:
        match.away_score,

      minutes_played:
        entry.minutes_played,

      starter:
        entry.starter,

      goals:
        entry.goals,

      assists:
        entry.assists,

      yellow_cards:
        entry.yellow_cards,

      red_cards:
        entry.red_cards,

      clean_sheet:
        entry.clean_sheet,

      final_rating:
        finalRating,

      fantasy_points:
        fantasyPoints,

      is_mvp:
        isMvp,

      final:
        isFinal,
    });
  }

  /*
   * Más recientes primero.
   */
  profileMatches.sort(
    (
      a,
      b,
    ) =>
      new Date(
        b.match_date,
      ).getTime() -
      new Date(
        a.match_date,
      ).getTime(),
  );

  /*
   * Estadísticas deportivas.
   *
   * Contamos partidos en los que realmente
   * ha disputado minutos.
   */
  const playedMatches =
    profileMatches.filter(
      (
        match,
      ) =>
        match.minutes_played >
        0,
    );

  const appearances =
    playedMatches.length;

  const starts =
    playedMatches.filter(
      (
        match,
      ) =>
        match.starter,
    ).length;

  const minutes =
    playedMatches.reduce(
      (
        total,
        match,
      ) =>
        total +
        match.minutes_played,
      0,
    );

  const goals =
    playedMatches.reduce(
      (
        total,
        match,
      ) =>
        total +
        match.goals,
      0,
    );

  const assists =
    playedMatches.reduce(
      (
        total,
        match,
      ) =>
        total +
        match.assists,
      0,
    );

  const yellowCards =
    playedMatches.reduce(
      (
        total,
        match,
      ) =>
        total +
        match.yellow_cards,
      0,
    );

  const redCards =
    playedMatches.reduce(
      (
        total,
        match,
      ) =>
        total +
        match.red_cards,
      0,
    );

  const cleanSheets =
    playedMatches.filter(
      (
        match,
      ) =>
        match.clean_sheet,
    ).length;

  /*
   * Solo entran en la media las notas
   * realmente disponibles.
   */
  const ratedMatches =
    playedMatches.filter(
      (
        match,
      ): match is PlayerProfileMatch & {
        final_rating: number;
      } =>
        match.final_rating !==
        null,
    );

  const averageRating =
    ratedMatches.length >
    0
      ? ratedMatches.reduce(
          (
            total,
            match,
          ) =>
            total +
            match.final_rating,
          0,
        ) /
        ratedMatches.length
      : null;

  /*
   * Los puntos de temporada solo incluyen
   * partidos con resultado Fantasy final.
   */
  const fantasyMatches =
    playedMatches.filter(
      (
        match,
      ): match is PlayerProfileMatch & {
        fantasy_points: number;
      } =>
        match.final &&
        match.fantasy_points !==
          null,
    );

  const fantasyPoints =
    fantasyMatches.reduce(
      (
        total,
        match,
      ) =>
        total +
        match.fantasy_points,
      0,
    );

  const fantasyAverage =
    fantasyMatches.length >
    0
      ? fantasyPoints /
        fantasyMatches.length
      : null;

  const mvpCount =
    fantasyMatches.filter(
      (
        match,
      ) =>
        match.is_mvp,
    ).length;

  return {
    player: {
      id:
        player.id,

      first_name:
        player.first_name,

      last_name:
        player.last_name,

      shirt_number:
        player.shirt_number,

      position:
        player.position,

      image_url:
        player.image_url,

      active:
        player.active,

      team_id:
        player.team_id,
    },

    team:
      team
        ? {
            id:
              team.id,

            name:
              team.name,

            category:
              team.category ??
              null,
          }
        : null,

    stats: {
      appearances,

      starts,

      minutes,

      goals,

      assists,

      yellow_cards:
        yellowCards,

      red_cards:
        redCards,

      clean_sheets:
        cleanSheets,

      average_rating:
        averageRating,

      fantasy_points:
        fantasyPoints,

      fantasy_average:
        fantasyAverage,

      mvp_count:
        mvpCount,
    },

    matches:
      profileMatches,
  };
}