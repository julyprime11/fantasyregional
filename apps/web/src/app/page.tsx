import Image from "next/image";
import Link from "next/link";

import { connection } from "next/server";



import {

  getTeams,

  type TeamRow,

} from "@/data/teams";



import { requireUser } from "@/lib/auth";

import { createServerSupabaseClient } from "@/lib/supabase/server";



const ADMIN_ROLES = new Set([

  "entrenador",

  "cuerpo_tecnico",

  "directiva",

]);



export default async function Home() {

  await connection();



  const user = await requireUser();



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

      .eq("id", user.id)

      .maybeSingle();



  const isAdmin =

    profile?.voter_role

      ? ADMIN_ROLES.has(

          profile.voter_role,

        )

      : false;



  let teams: TeamRow[] = [];

  let queryFailed = false;



  /*

   * Solo necesitamos cargar los equipos

   * para el bloque administrativo.

   */

  if (isAdmin) {

    try {

      teams =

        await getTeams();

    } catch {

      queryFailed = true;

    }

  }



  const displayName =

    profile?.display_name ??

    user.email?.split("@")[0] ??

    "Usuario";



  return (

    <main className="app-screen bg-zinc-100">

      <div className="mx-auto max-w-6xl px-4 pb-8 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 sm:py-8">

        <header className="overflow-hidden rounded-3xl bg-zinc-950 p-6 text-white shadow-lg sm:p-8">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <div className="flex items-center gap-2.5">
                <Image
                  src="/icon-192.png"
                  alt="Fantasy Regional"
                  width={32}
                  height={32}
                  priority
                  className="h-8 w-8 rounded-xl"
                />

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Fantasy Regional
                </p>
              </div>



              <h1 className="mt-4 text-3xl font-black sm:text-4xl">

                Hola, {displayName}

              </h1>



              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">

                {isAdmin

                  ? "Gestiona la competición y accede a tu Fantasy desde un único panel."

                  : "Gestiona tus ligas Fantasy, prepara tu XI y consulta tus jornadas."}

              </p>

            </div>



            {profile?.voter_role && (

              <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">

                <p className="text-xs uppercase tracking-wide text-zinc-400">

                  Rol

                </p>



                <p className="mt-1 font-bold capitalize">

                  {formatRole(

                    profile.voter_role,

                  )}

                </p>

              </div>

            )}

          </div>

        </header>



        {isAdmin && (

          <>

            <section className="mt-8">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">

                  Administración

                </p>



                <h2 className="mt-1 text-2xl font-black text-zinc-950">

                  Gestión

                </h2>

              </div>



              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <AdminCard

                  href="/admin/clubs"

                  title="Clubes"

                  description="Gestiona clubes, nombres y datos generales."

                  icon="C"

                />



                <AdminCard

                  href="/admin/teams"

                  title="Equipos"

                  description="Configura equipos y categorías."

                  icon="E"

                />



                <AdminCard

                  href="/admin/players"

                  title="Jugadores"

                  description="Altas, dorsales, posiciones y plantilla."

                  icon="J"

                />



                <AdminCard

                  href="/admin/staff"

                  title="Cuerpo técnico"

                  description="Gestiona entrenadores y miembros del staff."

                  icon="CT"

                />



                <AdminCard

                  href="/admin/matches"

                  title="Partidos"

                  description="Convocatorias, estadísticas y resultados."

                  icon="P"

                />



                <AdminCard

                  href="/admin/users"

                  title="Usuarios"

                  description="Asigna roles de votación."

                  icon="U"

                />

              </div>

            </section>



            <section className="mt-10">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">

                    Resumen

                  </p>



                  <h2 className="mt-1 text-2xl font-black text-zinc-950">

                    Equipos

                  </h2>

                </div>



                <Link

                  href="/admin/teams"

                  className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition hover:ring-zinc-400"

                >

                  Ver todos →

                </Link>

              </div>



              {queryFailed ? (

                <div className="mt-5 rounded-2xl bg-red-50 p-5 ring-1 ring-red-100">

                  <p

                    role="alert"

                    className="text-sm font-medium text-red-700"

                  >

                    No se pudieron cargar los equipos. Inténtalo de nuevo más tarde.

                  </p>

                </div>

              ) : teams.length === 0 ? (

                <div className="mt-5 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-zinc-200">

                  <p className="font-bold text-zinc-950">

                    No hay equipos disponibles

                  </p>



                  <p className="mt-2 text-sm text-zinc-500">

                    Crea el primer equipo desde el apartado Equipos.

                  </p>

                </div>

              ) : (

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                  {teams.map(

                    (team) => (

                      <div

                        key={

                          team.id

                        }

                        className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"

                      >

                        <div className="flex items-start justify-between gap-4">

                          <div>

                            <h3 className="font-black text-zinc-950">

                              {

                                team.name

                              }

                            </h3>



                            <p className="mt-1 text-sm text-zinc-500">

                              {team.category ??

                                "Sin categoría"}

                            </p>

                          </div>



                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm font-black text-zinc-500">

                            →

                          </span>

                        </div>

                      </div>

                    ),

                  )}

                </div>

              )}

            </section>

          </>

        )}



        <section className="mt-10">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">

              Aplicación

            </p>



            <h2 className="mt-1 text-2xl font-black text-zinc-950">

              Accesos

            </h2>

          </div>



          <div

            className={`mt-5 grid gap-4 ${

              isAdmin

                ? "sm:grid-cols-2"

                : "max-w-xl"

            }`}

          >

            {isAdmin && (

              <Link

                href="/match-admin"

                className="group rounded-3xl bg-zinc-950 p-6 text-white shadow-lg transition hover:-translate-y-1"

              >

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">

                  Match Admin

                </p>



                <h3 className="mt-2 text-2xl font-black">

                  Gestión de partidos

                </h3>



                <p className="mt-2 text-sm text-zinc-300">

                  Once inicial, estadísticas, votaciones y resultados.

                </p>



                <p className="mt-6 font-black">

                  Entrar →

                </p>

              </Link>

            )}



            <Link

              href="/fantasy"

              className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-1 hover:shadow-lg"

            >

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">

                Fantasy

              </p>



              <h3 className="mt-2 text-2xl font-black text-zinc-950">

                Regional Fantasy

              </h3>



              <p className="mt-2 text-sm text-zinc-500">

                Ligas, alineaciones, jornadas y clasificación.

              </p>



              <p className="mt-6 font-black text-zinc-950">

                Entrar →

              </p>

            </Link>

          </div>

        </section>

      </div>

    </main>

  );

}



function AdminCard({

  href,

  title,

  description,

  icon,

}: {

  href: string;

  title: string;

  description: string;

  icon: string;

}) {

  return (

    <Link

      href={href}

      className="group flex min-h-44 flex-col justify-between rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-zinc-400"

    >

      <div>

        <div className="flex items-start justify-between">

          <span className="flex h-12 min-w-12 items-center justify-center rounded-2xl bg-zinc-950 px-2 text-sm font-black text-white">

            {icon}

          </span>



          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 font-black text-zinc-500 transition group-hover:bg-zinc-950 group-hover:text-white">

            →

          </span>

        </div>



        <h3 className="mt-5 text-xl font-black text-zinc-950">

          {title}

        </h3>



        <p className="mt-2 text-sm leading-5 text-zinc-500">

          {description}

        </p>

      </div>

    </Link>

  );

}



function formatRole(

  role: string,

) {

  switch (role) {

    case "entrenador":

      return "Entrenador";



    case "cuerpo_tecnico":

      return "Cuerpo técnico";



    case "jugador":

      return "Jugador";



    case "directiva":

      return "Directiva";



    default:

      return role;

  }

}