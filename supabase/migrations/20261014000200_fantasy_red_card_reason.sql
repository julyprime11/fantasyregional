-- Los partidos historicos quedan sin motivo explicito hasta revision manual.
alter table public.match_players
  add column red_card_reason text
  constraint match_players_red_card_reason_check
  check (red_card_reason is null or red_card_reason in ('direct', 'second_yellow'));

-- Motivo se borra de manera atómica cuando se elimina la roja
-- o se retira una amarilla de una expulsión por doble amarilla.
create function public.fantasy_clear_invalid_red_card_reason()
returns trigger
language plpgsql
as $$
begin
  if new.red_cards = 0
    or (new.red_card_reason = 'second_yellow' and new.yellow_cards < 2)
  then
    new.red_card_reason := null;
  end if;
  return new;
end;
$$;

create trigger fantasy_clear_invalid_red_card_reason_trigger
before insert or update of red_cards, yellow_cards
on public.match_players
for each row
execute function public.fantasy_clear_invalid_red_card_reason();
