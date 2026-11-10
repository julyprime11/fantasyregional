import test from "node:test";
import assert from "node:assert/strict";

import { parseMatchInput, InputError } from "../src/master-data.ts";

const match = (overrides = {}) => ({
  competition_id: "",
  home_team_id: "11111111-1111-4111-8111-111111111111",
  away_team_id: "22222222-2222-4222-8222-222222222222",
  match_date: "2026-11-14T15:30",
  home_score: "",
  away_score: "",
  status: "scheduled",
  voting_opens_at: "",
  voting_closes_at: "",
  matchday_number: "8",
  ...overrides,
});

test("match creation stores the entered official round, not a date-derived index", () => {
  const parsed = parseMatchInput(match());
  assert.equal(parsed.matchday_number, 8);
  assert.equal(parsed.match_date, "2026-11-14T15:30:00.000Z");
});

test("a match requires an official round from 1 through 60", () => {
  for (const invalid of ["", "0", "-1", "61", "8.5", "foo"]) {
    assert.throws(
      () => parseMatchInput(match({ matchday_number: invalid })),
      InputError,
      "Rejected invalid official round: " + invalid,
    );
  }
});

test("rounds 1-4 remain valid even though Fantasy starts scoring in round 5", () => {
  assert.equal(parseMatchInput(match({ matchday_number: "1" })).matchday_number, 1);
  assert.equal(parseMatchInput(match({ matchday_number: "4" })).matchday_number, 4);
});
