import test from "node:test";
import assert from "node:assert/strict";

import {
  getAutomaticFantasyStandingView,
} from "../src/fantasy-standings-view.ts";

const fixture = (overrides = {}) => ({
  match_date: "2026-11-14T15:30:00Z",
  matchday_number: 8,
  status: "scheduled",
  ...overrides,
});

test("the new matchday is selected exactly two hours before kickoff", () => {
  const fixtures = [fixture()];
  assert.equal(
    getAutomaticFantasyStandingView(fixtures, Date.parse("2026-11-14T13:29:59.999Z")),
    "total",
  );
  assert.equal(
    getAutomaticFantasyStandingView(fixtures, Date.parse("2026-11-14T13:30:00Z")),
    "8",
  );
});

test("scheduled, finished and voting match stays selected until closed", () => {
  const now = Date.parse("2026-11-14T17:00:00Z");
  for (const status of ["scheduled", "finished", "voting"]) {
    assert.equal(getAutomaticFantasyStandingView([fixture({ status })], now), "8");
  }
  assert.equal(getAutomaticFantasyStandingView(
    [fixture({ status: "closed" })], now,
  ), "total");
});

test("latest eligible matchday wins, future fixtures stay on total", () => {
  const now = Date.parse("2026-11-14T16:00:00Z");
  assert.equal(getAutomaticFantasyStandingView([
    fixture({ matchday_number: 7, match_date: "2026-11-08T11:00:00Z" }),
    fixture({ matchday_number: 8 }),
    fixture({ matchday_number: 9, match_date: "2026-11-21T15:30:00Z" }),
  ], now), "8");

  assert.equal(getAutomaticFantasyStandingView([
    fixture({ matchday_number: 8, status: "closed" }),
    fixture({ matchday_number: 9, match_date: "2026-11-21T15:30:00Z" }),
  ], now), "total");
});

test("fixtures without an official round do not trigger selection", () => {
  assert.equal(getAutomaticFantasyStandingView([
    fixture({ matchday_number: null }),
  ], Date.parse("2026-11-14T15:30:00Z")), "total");
});

test("earlier fantasy rounds 1-4 never affect the upcoming J8 selection", () => {
  assert.equal(getAutomaticFantasyStandingView([
    fixture({ matchday_number: 4, status: "closed", match_date: "2026-10-18T15:30:00Z" }),
    fixture({ matchday_number: 8 }),
  ], Date.parse("2026-11-14T14:00:00Z")), "8");
});
