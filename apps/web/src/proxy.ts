import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Next.js 16: la renovación SSR debe escribir las cookies en la respuesta.
 * En Server Components no siempre se permite hacerlo.
 *
 * El proxy NO toma decisiones de autorización: las rutas y las Server Actions
 * siguen comprobando la identidad y los permisos desde el servidor.
 */
export async function proxy(request: NextRequest) {
  const { url, publishableKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: {
        name: string;
        value: string;
        options: CookieOptions;
      }[]) {
        // Actualizar la petición evita que Server Components lean
        // tokens anteriores después de renovar la sesión.
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getClaims valida el JWT y renueva cuando ha caducado.
  // La autorización de cada acción sensible sigue usando getUser()
  // y los roles recuperados de profiles.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    "/fantasy/:path*",
    "/match-admin/:path*",
    "/admin/:path*",
    "/matches/:path*",
    "/post-login",
    "/api/fantasy/:path*",
  ],
};
