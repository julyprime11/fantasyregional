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

    const league =
      await createFantasyLeague({
        name,
        teamId,
        createdBy: user.id,
      });

    return NextResponse.json({
      id: league.id,
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "No se pudo crear la liga.",
      },
      { status: 500 },
    );
  }
}