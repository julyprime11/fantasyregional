import Image from "next/image";
import Link from "next/link";

import {
  connection,
} from "next/server";

import {
  requireUser,
} from "@/lib/auth";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

import {
  canAccessAdmin,
  canAccessMatchAdmin,
  canPlayFantasy,
  canVote,
  formatRole,
} from "@/lib/roles";

export default async function Home() {
  await connection();

  const user =
    await requireUser();

  const supabase =
    await createServerSupabaseClient();

  const {
    data: profile,
  } =
    await supabase
      .from("profiles")
      .select(
        "display_name, voter_role",
      )
      .eq(
        "id",
        user.id,
      )
      .maybeSingle();

  const role =
    profile?.voter_role ??
    null;

  const displayName =
    profile?.display_name ??
    user.email?.split(
      "@",
    )[0] ??
    "Usuario";

  const showFantasy =
    canPlayFantasy(
      role,
    );

  const showVoting =
    canVote(
      role,
    );

  const showMatchAdmin =
    canAccessMatchAdmin(
      role,
    );

  const showAdmin =
    canAccessAdmin(
      role,
    );

  return (
    <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2]">
      {/* CABECERA */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-7 pt-[calc(env(safe-area-inset-top)+1rem)] text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Image
                src="/icon-192.png"
                alt="Fantasy Regional"
                width={38}
                height={38}
                priority
                className="h-[38px] w-[38px] rounded-xl"
              />

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45">
                  Fantasy Regional
                </p>

                <p className="mt-0.5 text-xs font-bold text-white/75">
                  Panel principal
                </p>
              </div>
            </div>

            {role && (
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-black text-white/75 ring-1 ring-white/10">
                {formatRole(
                  role,
                )}
              </span>
            )}
          </div>

          <div className="mt-7">
            <p className="text-xs font-bold text-white/55">
              Bienvenido
            </p>

            <h1 className="mt-1 text-[2rem] font-black tracking-tight">
              Hola, {displayName}
            </h1>

            <p className="mt-2 max-w-sm text-xs leading-5 text-white/55">
              {showAdmin
                ? "Gestiona el club y accede a todas las áreas de Fantasy Regional."
                : showFantasy
                  ? "Gestiona tus ligas, prepara tu XI y sigue tus jornadas."
                  : "Accede a las herramientas disponibles para tu rol."}
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 pb-10">
        {/* ACCESOS PRINCIPALES */}
        <section className="mt-5">
          <div className="px-1">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
              Tu cuenta
            </p>

            <h2 className="mt-0.5 text-xl font-black tracking-tight text-zinc-950">
              ¿Dónde quieres entrar?
            </h2>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {showFantasy && (
              <AreaCard
                href="/fantasy"
                icon="⚽"
                eyebrow="Jugar"
                title="Fantasy"
                description="Ligas, XI y puntos"
                primary
              />
            )}

            {showVoting && (
              <AreaCard
                href="/matches"
                icon="★"
                eyebrow="Panel"
                title="Votar"
                description="Valora los partidos"
              />
            )}

            {showMatchAdmin && (
              <AreaCard
                href="/match-admin"
                icon="M"
                eyebrow="Partidos"
                title="Match Admin"
                description="Directo y estadísticas"
              />
            )}

            {showAdmin && (
              <AreaCard
                href="/admin"
                icon="A"
                eyebrow="Gestión"
                title="Admin"
                description="Club y aplicación"
              />
            )}
          </div>
        </section>

        {/* DIRECTIVA */}
        {showAdmin && (
          <section className="mt-7">
            <div className="flex items-end justify-between px-1">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                  Directiva
                </p>

                <h2 className="mt-0.5 text-xl font-black tracking-tight text-zinc-950">
                  Accesos rápidos
                </h2>
              </div>

              <Link
                href="/admin"
                className="text-[10px] font-black text-[#0f3d2e]"
              >
                Ver todo →
              </Link>
            </div>

            <div className="mt-3 overflow-hidden rounded-[1.4rem] bg-white shadow-sm ring-1 ring-black/5">
              <QuickLink
                href="/admin/players"
                icon="J"
                title="Jugadores"
                description="Plantilla, dorsales y posiciones"
              />

              <QuickLink
                href="/admin/matches"
                icon="P"
                title="Partidos"
                description="Partidos y convocatorias"
              />

              <QuickLink
                href="/admin/users"
                icon="U"
                title="Usuarios"
                description="Roles y permisos"
              />

              <QuickLink
                href="/admin/ffcv-sync"
                icon="F"
                title="FFCV"
                description="Sincronizar plantilla oficial"
                last
              />
            </div>
          </section>
        )}

        {/* INFORMACIÓN DEL ROL */}
        {role && (
          <section className="mt-7 rounded-[1.4rem] bg-[#e8f2ed] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] text-sm font-black text-white">
                {displayName
                  .charAt(
                    0,
                  )
                  .toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#557368]">
                  Sesión activa
                </p>

                <p className="mt-0.5 truncate text-sm font-black text-[#0b2f23]">
                  {displayName}
                </p>

                <p className="mt-0.5 text-[10px] font-semibold text-[#557368]">
                  {formatRole(
                    role,
                  )}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function AreaCard({
  href,
  icon,
  eyebrow,
  title,
  description,
  primary = false,
}: {
  href: string;
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-[9.5rem] flex-col justify-between rounded-[1.4rem] p-4 shadow-sm transition active:scale-[0.98] ${
        primary
          ? "bg-[#0f3d2e] text-white"
          : "bg-white text-zinc-950 ring-1 ring-black/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-sm font-black ${
            primary
              ? "bg-white/10 text-white"
              : "bg-[#e8f2ed] text-[#0f3d2e]"
          }`}
        >
          {icon}
        </span>

        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
            primary
              ? "bg-white/10 text-white/70"
              : "bg-zinc-100 text-zinc-400"
          }`}
        >
          →
        </span>
      </div>

      <div>
        <p
          className={`text-[8px] font-black uppercase tracking-[0.15em] ${
            primary
              ? "text-white/45"
              : "text-zinc-400"
          }`}
        >
          {eyebrow}
        </p>

        <h3 className="mt-1 text-lg font-black">
          {title}
        </h3>

        <p
          className={`mt-1 text-[9px] leading-4 ${
            primary
              ? "text-white/55"
              : "text-zinc-500"
          }`}
        >
          {description}
        </p>
      </div>
    </Link>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
  last = false,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3.5 transition active:bg-zinc-50 ${
        last
          ? ""
          : "border-b border-zinc-100"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ed] text-xs font-black text-[#0f3d2e]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-zinc-950">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[9px] text-zinc-400">
          {description}
        </p>
      </div>

      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-black text-zinc-400">
        →
      </span>
    </Link>
  );
}