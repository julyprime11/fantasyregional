-- B1 seguridad: proteger perfiles y roles de votacion.
-- Se ejecuta junto al cambio de administracion de usuarios que usa
-- exclusivamente el cliente service_role en servidor.
-- No aplicar aisladamente: rompería el formulario de asignación de roles.
BEGIN;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Sustituir permisos heredados excesivamente amplios.
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT INSERT (id, display_name, voter_role)
  ON TABLE public.profiles TO authenticated;
GRANT UPDATE (display_name)
  ON TABLE public.profiles TO authenticated;

-- Las consultas de perfiles se necesitan para nombres de participantes,
-- clasificaciones y gestion de usuarios; nadie sin sesión puede leerlos.
CREATE POLICY profiles_read_authenticated_b1
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- El alta ordinaria por trigger Auth continúa creando un perfil 'jugador'.
-- Un INSERT explícito tampoco puede crear una cuenta directiva.
CREATE POLICY profiles_create_self_b1
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (
  id = (SELECT auth.uid())
  AND voter_role = 'jugador'
);

-- Solo se permite modificar el nombre propio; el GRANT por columna
-- impide elevar el rol incluso al enviar voter_role por API.
CREATE POLICY profiles_update_self_b1
ON public.profiles FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- DELETE no permitido: preserva FK de ligas y participantes.
-- La administracion de roles se valida en Next.js en servidor y emplea
-- service_role; nunca se entrega dicha credencial al navegador.
COMMIT;
