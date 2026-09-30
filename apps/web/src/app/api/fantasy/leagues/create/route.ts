import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { createFantasyLeague } from "@/data/fantasy-leagues";

export async function POST(
  request: Request,
) {
  const user = await requireUser();

  try {
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const code =
      typeof body.code === "string"
        ? body.code
            .trim()
            .toUpperCase()
        : "";

    const teamId =
      typeof body.teamId === "string"
        ? body.teamId
        : "";

    if (!name) {
      return NextResponse.json(
        {
          message:
            "El nombre de la liga es obligatorio.",
        },
        { status: 400 },
      );
    }

    if (!teamId) {
      return NextResponse.json(
        {
          message:
            "Selecciona un equipo.",
        },
        { status: 400 },
      );
    }

    if (code.length < 4) {
      return NextResponse.json(
        {
          message:
            "El código debe tener al menos 4 caracteres.",
        },
        { status: 400 },
      );
    }

    const league =
      await createFantasyLeague({
        name,
        code,
        teamId,
        createdBy: user.id,
      });

    return NextResponse.json({
      id: league.id,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo crear la liga.";

    if (
      message.includes(
        "fantasy_leagues_code_key",
      ) ||
      message.includes(
        "duplicate key",
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Ese código ya está siendo utilizado por otra liga.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message:
          "No se pudo crear la liga.",
      },
      { status: 500 },
    );
  }
}