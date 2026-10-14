-- Los partidos historicos quedan sin motivo explicito hasta revision manual.
alter table public.match_players
  add column red_card_reason text
  constraint match_players_red_card_reason_check
  check (red_card_reason is null or red_card_reason in ('direct', 'second_yellow'));
