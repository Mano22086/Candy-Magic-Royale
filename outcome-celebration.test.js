const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Engine = require("./js/gameplay/outcome-celebration-engine.js");

test("all 3 Victory / Out-of-Moves / Star PNG assets exist on disk", () => {
  const files = [
    Engine.OUTCOME_ASSETS.victoryFrame,
    Engine.OUTCOME_ASSETS.outOfMovesFrame,
    Engine.OUTCOME_ASSETS.victoryStar,
  ];
  for (const rel of files) {
    const abs = path.join(__dirname, rel);
    assert.equal(fs.existsSync(abs), true, `Missing asset: ${rel}`);
    assert.ok(fs.statSync(abs).size > 4000, `Asset looks empty: ${rel}`);
  }
});

test("exact 1, 2, and 3 star rating rules honor both score thresholds and remaining moves (>=3 and >=6)", () => {
  const th = Engine.getStarScoreThresholds(1, false);
  assert.ok(th.star1Threshold < th.star2Threshold && th.star2Threshold < th.star3Threshold);

  // Objectives not cleared => 0 stars
  assert.equal(
    Engine.calculateStarsEarned({ score: 99999, remainingMoves: 10, level: 1, objectivesCleared: false }),
    0
  );

  // 1 Star: objectives cleared, low score, < 3 remaining moves
  assert.equal(
    Engine.calculateStarsEarned({ score: th.star1Threshold, remainingMoves: 2, level: 1, objectivesCleared: true }),
    1
  );

  // 2 Stars via remaining moves >= 3 (even with low score)
  assert.equal(
    Engine.calculateStarsEarned({ score: th.star1Threshold, remainingMoves: 3, level: 1, objectivesCleared: true }),
    2
  );

  // 2 Stars via score >= star2Threshold (even with 0 remaining moves)
  assert.equal(
    Engine.calculateStarsEarned({ score: th.star2Threshold, remainingMoves: 0, level: 1, objectivesCleared: true }),
    2
  );

  // 3 Stars via remaining moves >= 6
  assert.equal(
    Engine.calculateStarsEarned({ score: th.star1Threshold, remainingMoves: 6, level: 1, objectivesCleared: true }),
    3
  );

  // 3 Stars via score >= star3Threshold (even with 1 remaining move)
  assert.equal(
    Engine.calculateStarsEarned({ score: th.star3Threshold, remainingMoves: 1, level: 1, objectivesCleared: true }),
    3
  );
});

test("mergeStageStars persists Math.max and only adds positive starDelta", () => {
  const r1 = Engine.mergeStageStars({}, 12, 2);
  assert.equal(r1.bestStars, 2);
  assert.equal(r1.starDelta, 2);
  assert.equal(r1.stageStars["12"], 2);

  // Replaying and earning 1 star must NOT downgrade 2 stars
  const r2 = Engine.mergeStageStars(r1.stageStars, 12, 1);
  assert.equal(r2.bestStars, 2);
  assert.equal(r2.starDelta, 0);
  assert.equal(r2.stageStars["12"], 2);

  // Replaying and earning 3 stars upgrades 2 -> 3 with delta +1
  const r3 = Engine.mergeStageStars(r2.stageStars, 12, 3);
  assert.equal(r3.bestStars, 3);
  assert.equal(r3.starDelta, 1);
  assert.equal(r3.stageStars["12"], 3);
});

test("Arabic Out-of-Moves urgency formatter produces accurate singular, dual, and plural copy", () => {
  const one = Engine.formatRemainingObjectiveTemptation([{ id: "single_ice", required: 6, broken: 5 }]);
  assert.equal(one.totalRemaining, 1);
  assert.equal(one.primaryObstacleId, "single_ice");
  assert.equal(one.headlineAr, "باقي عائق واحد فقط على الفوز!");

  const two = Engine.formatRemainingObjectiveTemptation([{ id: "scarab_box", required: 4, broken: 2 }]);
  assert.equal(two.totalRemaining, 2);
  assert.equal(two.primaryObstacleId, "scarab_box");
  assert.equal(two.headlineAr, "باقي عائقان فقط على الفوز!");

  const five = Engine.formatRemainingObjectiveTemptation([
    { id: "crate", required: 4, broken: 1 },
    { id: "chain", required: 4, broken: 2 },
  ]);
  assert.equal(five.totalRemaining, 5);
  assert.equal(five.headlineAr, "باقي 5 عوائق فقط على الفوز!");
});

test("15-Gem revive deducts exactly 15 gems, adds +5 moves, and blocks insufficient gems", () => {
  assert.equal(Engine.REVIVE_GEMS_COST, 15);
  assert.equal(Engine.REVIVE_EXTRA_MOVES, 5);

  const fail = Engine.applyGemRevive({ gems: 10, moves: 0 });
  assert.equal(fail.ok, false);
  assert.equal(fail.reason, "insufficient_gems");
  assert.equal(fail.gems, 10);

  const ok = Engine.applyGemRevive({ gems: 25, moves: 0 });
  assert.equal(ok.ok, true);
  assert.equal(ok.gems, 10);
  assert.equal(ok.moves, 5);
});

test("curved Palace Map avatar hop path starts at origin, lifts mid-arc, and lands cleanly on target", () => {
  const from = { x: 20, y: 80 };
  const to = { x: 50, y: 80 };
  const start = Engine.computeCurvedHopPoint(from, to, 0);
  const mid = Engine.computeCurvedHopPoint(from, to, 0.5);
  const end = Engine.computeCurvedHopPoint(from, to, 1);

  assert.equal(start.x, 20);
  assert.equal(start.y, 80);
  assert.ok(mid.y < 80, "Mid-hop must lift cleanly above the straight line");
  assert.equal(end.x, 50);
  assert.equal(end.y, 80);
});
