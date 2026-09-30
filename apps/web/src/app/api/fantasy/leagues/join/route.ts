import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import {
  getFantasyLeagueByCode,
  joinFantasyLeague,
} from "@/data/fantasy-leagues";

export async function POST(
  request: Request,
) {
  const user =
    await requireUser();

  try {
    const body =
      await request.json();

    const code =
      typeof body.code === "string"
        ? body.code
            .trim()
            .toUpperCase()
        : "";

    if (code.length < 4) {
      return NextResponse.json(
        {
          message:
            "Introduce un código de liga válido.",
        },
        {
          status: 400,
        },
      );
    }

    const league =
      await getFantasyLeagueByCode(
        code,
      );

    if (!league) {
      return NextResponse.json(
        {
          message:
            "No existe ninguna liga con ese código.",
        },
        {
          status: 404,
        },
      );
    }

    try {
      await joinFantasyLeague({
        leagueId: league.id,
        userId: user.id,
      });
    } catch (error) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(
              error.code,
            )
          : "";

      /*
       * Ya pertenece a la liga.
       * No lo tratamos como un error grave:
       * simplemente lo enviamos a ella.
       */
      if (code === "23505") {
        return NextResponse.json({
          id: league.id,
          alreadyMember: true,
        });
      }

      throw error;
    }

    return NextResponse.json({
      id: league.id,
      alreadyMember: false,
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "No se pudo entrar en la liga. Inténtalo de nuevo.",
      },
      {
        status: 500,
      },
    );
  }
}