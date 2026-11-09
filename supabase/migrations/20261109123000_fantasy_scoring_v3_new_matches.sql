-- Fantasy V3: nuevas jornadas.
-- No modifica la version de partidos existentes ni recalcula su historico.
-- Los partidos nuevos toman V3 salvo que la aplicacion indique otra version.
BEGIN;

ALTER TABLE public.matches
  ALTER COLUMN fantasy_scoring_version SET DEFAULT 'v3';

COMMENT ON COLUMN public.matches.fantasy_scoring_version IS
  'Version de las reglas Fantasy fijada por partido. V1/V2 historicas; V3 para nuevos partidos.';

COMMIT;
