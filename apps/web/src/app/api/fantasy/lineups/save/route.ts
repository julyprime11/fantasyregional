import { NextResponse } from "next/server";

import {
  InputError,
} from "@regional-fantasy/shared";

import { requireUser } from "@/lib/auth";
import { saveFantasyLineup } from "@/data/fantasy-lineups";

export async function POST(
  request: Request,
) {
  const user =
    await requireUser();

  try {
    const body =
      await request.json();

    const leagueId =
      typeof body.leagueId ===
      "string"
        ? body.leagueId
        : "";

    const matchId =
      typeof body.matchId ===
      "string"
        ? body.matchId
        : "";

    const playerIds =
      Array.isArray(
        body.playerIds,
      )
        ? body.playerIds.filter(
            (
              value: unknown,
            ): value is string =>
              typeof value ===
              "string",
          )
        : [];

    if (
      !leagueId ||
      !matchId
    ) {
      return NextResponse.json(
        {
          message:
            "Liga o partido no válido.",
        },
        {
          status: 400,
        },
      );
    }

    await saveFantasyLineup({
      leagueId,
      userId: user.id,
      matchId,
      playerIds,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    if (
      error instanceof
      InputError
    ) {
      return NextResponse.json(
        {
          message:
            error.message,
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        message:
          "No se pudo guardar la alineación.",
      },
      {
        status: 500,
      },
    );
  }
}