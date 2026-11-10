import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { canJoinLeague } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { joinFantasyLeague } from "@/data/fantasy-leagues";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { message: "Inicia sesión para unirte a la liga." },
      { status: 401 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("voter_role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!canJoinLeague(profile?.voter_role)) {
      return NextResponse.json(
        {
          message:
            "Tu cuenta no tiene permiso Fantasy. Solicita a la Directiva que revise tu rol.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const code =
      typeof body.code === "string"
        ? body.code.trim().toUpperCase()
        : "";

    if (code.length < 4 || code.length > 12) {
      return NextResponse.json(
        { message: "Introduce un código de liga válido." },
        { status: 400 },
      );
    }

    // La base de datos comprueba el código, el rol y la identidad real.
    // Evita la unión directa por league_id a través de la API.
    const result = await joinFantasyLeague(code);

    return NextResponse.json({
      id: result.leagueId,
      alreadyMember: result.alreadyMember,
    });
  } catch (error) {
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";

    if (errorCode === "P0002") {
      return NextResponse.json(
        { message: "No existe ninguna liga con ese código." },
        { status: 404 },
      );
    }

    if (errorCode === "42501") {
      return NextResponse.json(
        { message: "No tienes permisos para entrar en esta liga." },
        { status: 403 },
      );
    }

    if (errorCode === "22023") {
      return NextResponse.json(
        { message: "Introduce un código de liga válido." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "No se pudo entrar en la liga. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
