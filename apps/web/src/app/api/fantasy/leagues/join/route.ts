import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { canJoinLeague } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getFantasyLeagueByCode,
  joinFantasyLeague,
} from "@/data/fantasy-leagues";

export async function POST(
  request: Request,
) {
  const user =
    await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { message: "Inicia sesión para unirte a la liga." },
      { status: 401 },
    );
  }

  try {
    const supabase =
      await createServerSupabaseClient();

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select("voter_role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (
      !canJoinLeague(
        profile?.voter_role,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Tu cuenta no tiene permiso Fantasy. Solicita a la Directiva que revise tu rol.",
        },
        { status: 403 },
      );
    }


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