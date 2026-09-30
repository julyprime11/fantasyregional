import test from "node:test";
import assert from "node:assert/strict";

import {
  getFantasyLine,
  validateFantasyLineup,
} from "../src/fantasy-lineup.ts";

const makePlayer = (id, position) => ({
  id,
  position,
});

test("position mapping works", () => {
  assert.equal(getFantasyLine("GK"), "GK");

  for (const position of ["RB", "CB", "LB", "RWB", "LWB"]) {
    assert.equal(getFantasyLine(position), "DEF");
  }

  for (const position of ["DM", "CM", "AM"]) {
    assert.equal(getFantasyLine(position), "MID");
  }

  for (const position of ["RW", "LW", "ST"]) {
    assert.equal(getFantasyLine(position), "FWD");
  }
});

test("4-3-3 is valid", () => {
  const players = [
    makePlayer("1", "GK"),

    makePlayer("2", "RB"),
    makePlayer("3", "CB"),
    makePlayer("4", "CB"),
    makePlayer("5", "LB"),

    makePlayer("6", "DM"),
    makePlayer("7", "CM"),
    makePlayer("8", "AM"),

    makePlayer("9", "RW"),
    makePlayer("10", "LW"),
    makePlayer("11", "ST"),
  ];

  const result = validateFantasyLineup(players);

  assert.equal(result.valid, true);
  assert.equal(result.counts.total, 11);
  assert.equal(result.counts.goalkeepers, 1);
  assert.equal(result.counts.defenders, 4);
  assert.equal(result.counts.midfielders, 3);
  assert.equal(result.counts.forwards, 3);
});

test("4-4-2 is valid", () => {
  const players = [
    makePlayer("1", "GK"),

    makePlayer("2", "RB"),
    makePlayer("3", "CB"),
    makePlayer("4", "CB"),
    makePlayer("5", "LB"),

    makePlayer("6", "DM"),
    makePlayer("7", "CM"),
    makePlayer("8", "CM"),
    makePlayer("9", "AM"),

    makePlayer("10", "LW"),
    makePlayer("11", "ST"),
  ];

  const result = validateFantasyLineup(players);

  assert.equal(result.valid, true);
  assert.equal(result.counts.defenders, 4);
  assert.equal(result.counts.midfielders, 4);
  assert.equal(result.counts.forwards, 2);
});

test("10 players is invalid", () => {
  const players = [
    makePlayer("1", "GK"),
    makePlayer("2", "RB"),
    makePlayer("3", "CB"),
    makePlayer("4", "CB"),
    makePlayer("5", "LB"),
    makePlayer("6", "DM"),
    makePlayer("7", "CM"),
    makePlayer("8", "AM"),
    makePlayer("9", "RW"),
    makePlayer("10", "ST"),
  ];

  const result = validateFantasyLineup(players);

  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /11 jugadores/);
});

test("two goalkeepers is invalid", () => {
  const players = [
    makePlayer("1", "GK"),
    makePlayer("2", "GK"),

    makePlayer("3", "RB"),
    makePlayer("4", "CB"),
    makePlayer("5", "LB"),

    makePlayer("6", "DM"),
    makePlayer("7", "CM"),
    makePlayer("8", "AM"),

    makePlayer("9", "RW"),
    makePlayer("10", "LW"),
    makePlayer("11", "ST"),
  ];

  const result = validateFantasyLineup(players);

  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /1 portero/);
});

test("six defenders is invalid", () => {
  const players = [
    makePlayer("1", "GK"),

    makePlayer("2", "RB"),
    makePlayer("3", "CB"),
    makePlayer("4", "CB"),
    makePlayer("5", "LB"),
    makePlayer("6", "RWB"),
    makePlayer("7", "LWB"),

    makePlayer("8", "DM"),
    makePlayer("9", "CM"),
    makePlayer("10", "AM"),

    makePlayer("11", "ST"),
  ];

  const result = validateFantasyLineup(players);

  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /3 y 5 defensas/);
});

test("duplicate player is invalid", () => {
  const players = [
    makePlayer("1", "GK"),

    makePlayer("2", "RB"),
    makePlayer("3", "CB"),
    makePlayer("4", "CB"),
    makePlayer("5", "LB"),

    makePlayer("6", "DM"),
    makePlayer("7", "CM"),
    makePlayer("8", "AM"),

    makePlayer("9", "RW"),
    makePlayer("9", "LW"),
    makePlayer("11", "ST"),
  ];

  const result = validateFantasyLineup(players);

  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /mismo jugador/);
});