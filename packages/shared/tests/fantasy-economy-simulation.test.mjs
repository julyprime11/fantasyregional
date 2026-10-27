import test from "node:test";
import assert from "node:assert/strict";
import { getCheapestFantasyXI, simulateFantasyEconomy } from "../src/fantasy-economy-simulation.ts";

const positions = ["GK", "RB", "CB", "LB", "DM", "CM", "AM", "ST", "RW", "LW", "CB", "CM", "ST"];
const players = positions.map((position, i) => ({ id: `p${i + 1}`, teamId: "team", position, active: true }));
const validIds = players.slice(0, 11).map((p) => p.id);

test("finds the cheapest valid formation rather than the eleven cheapest unrelated players", () => {
  const priced = players.map((p) => ({ id: p.id, position: p.position, price: 8_000 }));
  const xi = getCheapestFantasyXI(priced);
  assert.ok(xi);
  assert.equal(xi.playerIds.length, 11);
  assert.equal(xi.totalCost, 88_000);
  assert.equal(xi.formation, "3-5-2");
});

test("returns null if a valid formation is impossible", () => {
  assert.equal(getCheapestFantasyXI(players.filter((p) => p.position !== "GK").map(
    (p) => ({ id: p.id, position: p.position, price: 5_000 }),
  )), null);
});

test("simulates opening from first official closed match and next price evolution", () => {
  const result = simulateFantasyEconomy({
    players,
    leagues: [
      { id: "l1", teamId: "team", userIds: ["u1", "u2"] },
      { id: "l2", teamId: "team", userIds: ["u1"] },
    ],
    matches: [
      { id: "m1", matchDate: "2026-10-01T12:00:00Z", status: "closed",
        teams: [{ teamId: "team", playerPoints: players.map((p) => ({ playerId: p.id, points: 5 })) }] },
      { id: "m2", matchDate: "2026-10-08T12:00:00Z", status: "closed",
        teams: [{ teamId: "team", playerPoints: players.map((p) => ({ playerId: p.id, points: p.id === "p1" ? 11 : 5 })) }] },
      { id: "m3", matchDate: "2026-10-15T12:00:00Z", status: "voting",
        teams: [{ teamId: "team", playerPoints: [] }] },
    ],
    lineups: [
      { leagueId: "l1", userId: "u1", matchId: "m1", playerIds: validIds, totalPoints: 45 },
      { leagueId: "l1", userId: "u2", matchId: "m1", playerIds: validIds, totalPoints: 5 },
      { leagueId: "l2", userId: "u1", matchId: "m1", playerIds: validIds, totalPoints: 20 },
      { leagueId: "l1", userId: "u1", matchId: "m2", playerIds: validIds, totalPoints: 9 },
      { leagueId: "l1", userId: "u2", matchId: "m2", playerIds: validIds, totalPoints: 40 },
      { leagueId: "l2", userId: "u1", matchId: "m2", playerIds: validIds, totalPoints: 30 },
    ],
  });
  assert.equal(result.processedMatches, 2);
  const team = result.teams[0];
  assert.equal(team.openingMatchId, "m1");
  assert.equal(team.playerPrices.find((p) => p.playerId === "p1").price, 11_000);
  assert.equal(team.playerPrices.find((p) => p.playerId === "p2").price, 9_000);
  assert.equal(result.previousLineups.length, 3);
  assert.equal(result.previousLineups[0].xiCost, 99_000);
  assert.equal(result.members.find((m) => m.leagueId === "l1" && m.userId === "u1").openingBudget, 102_000);
  assert.equal(result.members.find((m) => m.leagueId === "l1" && m.userId === "u1").finalBudget, 100_000);
  assert.equal(result.members.find((m) => m.leagueId === "l1" && m.userId === "u2").finalBudget, 100_000);
  assert.equal(result.members.find((m) => m.leagueId === "l2" && m.userId === "u1").finalBudget, 101_000);
});

test("reports historical XIs over budget and impossible teams", () => {
  const expensive = simulateFantasyEconomy({
    players,
    leagues: [{ id: "l", teamId: "team", userIds: ["u"] }],
    matches: [
      { id: "m1", matchDate: "2026-10-01T12:00:00Z", status: "closed",
        teams: [{ teamId: "team", playerPoints: players.map((p) => ({ playerId: p.id, points: 14 })) }] },
      { id: "m2", matchDate: "2026-10-08T12:00:00Z", status: "closed",
        teams: [{ teamId: "team", playerPoints: players.map((p) => ({ playerId: p.id, points: 14 })) }] },
    ],
    lineups: [
      { leagueId: "l", userId: "u", matchId: "m1", playerIds: validIds, totalPoints: 5 },
      { leagueId: "l", userId: "u", matchId: "m2", playerIds: validIds, totalPoints: 5 },
    ],
  });
  assert.equal(expensive.previousLineups[0].xiCost, 165_000);
  assert.equal(expensive.previousLineups[0].affordable, false);
  assert.equal(expensive.summary.historicalLineupsOverBudget, 1);
  assert.equal(expensive.summary.membersUnableToAffordNextXI, 1);
});

test("rejects duplicate and unrelated player results", () => {
  assert.throws(() => simulateFantasyEconomy({
    players,
    leagues: [],
    matches: [{ id: "m1", matchDate: "2026-10-01T12:00:00Z", status: "closed",
      teams: [{ teamId: "team", playerPoints: [{ playerId: "unknown", points: 5 }] }] }],
    lineups: [],
  }), RangeError);
});
