-- Bloque B1: base de moderacion (NO aplicar hasta validar RLS y flujo Fantasy).
-- No elimina ni modifica alineaciones, miembros, partidos o puntuaciones.
-- La tabla fantasy_leagues sigue operativa para la aplicacion actual.
BEGIN;

ALTER TABLE public.fantasy_leagues
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'active';

ALTER TABLE public.fantasy_leagues
  DROP CONSTRAINT IF EXISTS fantasy_leagues_moderation_status_check;

ALTER TABLE public.fantasy_leagues
  ADD CONSTRAINT fantasy_leagues_moderation_status_check
  CHECK (moderation_status IN ('active', 'suspended', 'removed'));

COMMENT ON COLUMN public.fantasy_leagues.moderation_status IS
  'Estado de moderacion de plataforma. Las acciones se implementaran en B2.';

-- Defensa de la columna incluso mientras las tablas antiguas no tienen RLS.
-- Los usuarios normales no pueden elegir un estado distinto de active
-- ni modificarlo mediante el cliente publico.
CREATE OR REPLACE FUNCTION public.guard_fantasy_league_moderation_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'service_role') THEN
    IF TG_OP = 'INSERT' AND NEW.moderation_status <> 'active' THEN
      RAISE EXCEPTION 'No autorizado a definir el estado de moderacion.'
        USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE'
       AND NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
      RAISE EXCEPTION 'No autorizado a modificar el estado de moderacion.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fantasy_leagues_moderation_guard
  ON public.fantasy_leagues;

CREATE TRIGGER fantasy_leagues_moderation_guard
BEFORE INSERT OR UPDATE OF moderation_status
ON public.fantasy_leagues
FOR EACH ROW
EXECUTE FUNCTION public.guard_fantasy_league_moderation_status();

-- Registro inmutable desde el API publico. Escritura reservada al backend
-- privilegiado (B2). No contiene correos ni credenciales.
CREATE TABLE IF NOT EXISTS public.fantasy_league_moderation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.fantasy_leagues(id) ON DELETE RESTRICT,
  actor_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  previous_status text NOT NULL CHECK (
    previous_status IN ('active', 'suspended', 'removed')
  ),
  new_status text NOT NULL CHECK (
    new_status IN ('active', 'suspended', 'removed')
  ),
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 10 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (previous_status <> new_status)
);

CREATE INDEX IF NOT EXISTS fantasy_league_moderation_events_league_created_idx
  ON public.fantasy_league_moderation_events (league_id, created_at DESC);

ALTER TABLE public.fantasy_league_moderation_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fantasy_league_moderation_events FROM anon, authenticated;
GRANT ALL ON public.fantasy_league_moderation_events TO service_role;

COMMIT;
