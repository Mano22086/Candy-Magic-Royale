const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Engine = require("./js/gameplay/hero-boss-engine");

test("all 4 16-frame character sprite sheets and Boss HP bar PNG exist on disk", () => {
  for (const [id, rel] of Object.entries(Engine.SPRITE_SHEETS)) {
    const abs = path.join(__dirname, rel);
    assert.ok(fs.existsSync(abs), `Missing sprite sheet for ${id}: ${rel}`);
  }
  const hpBarAbs = path.join(__dirname, Engine.BOSS_HP_BAR_FRAME);
  assert.ok(fs.existsSync(hpBarAbs), `Missing Boss HP bar frame: ${Engine.BOSS_HP_BAR_FRAME}`);
});

test("16-frame 4x4 row-major sprite frame coordinates map indices 0..15 accurately", () => {
  const f0 = Engine.getSpriteFramePosition(0);
  assert.equal(f0.col, 0);
  assert.equal(f0.row, 0);
  assert.equal(f0.cssPosition, "0.0000% 0.0000%");

  const f7 = Engine.getSpriteFramePosition(7);
  assert.equal(f7.col, 3);
  assert.equal(f7.row, 1);
  assert.equal(f7.xPct, 100);
  assert.ok(Math.abs(f7.yPct - 33.3333) < 0.01);

  const f11 = Engine.getSpriteFramePosition(11);
  assert.equal(f11.col, 3);
  assert.equal(f11.row, 2);

  const f15 = Engine.getSpriteFramePosition(15);
  assert.equal(f15.col, 3);
  assert.equal(f15.row, 3);
  assert.equal(f15.cssPosition, "100.0000% 100.0000%");
});

test("placement rules assign Queen Luma (odd palaces), Pharaoh Boy (even/events), and Red Gummy Bear Boss (Stage 50 & 100 of all 10 palaces)", () => {
  // Odd Palace 1 -> Queen Luma + Crystal Dragon
  const s1 = Engine.getStageCharacterSetup(1);
  assert.equal(s1.isBossStage, false);
  assert.equal(s1.leftHeroId, "queen_luma");
  assert.equal(s1.rightHeroId, "pharaoh_dragon");

  // Even Palace 2 -> Pharaoh Boy + Crystal Dragon
  const s101 = Engine.getStageCharacterSetup(101);
  assert.equal(s101.isBossStage, false);
  assert.equal(s101.leftHeroId, "pharaoh_boy");
  assert.equal(s101.rightHeroId, "pharaoh_dragon");

  // Event override on odd palace -> Pharaoh Boy
  const ev = Engine.getStageCharacterSetup(5, { isEvent: true });
  assert.equal(ev.leftHeroId, "pharaoh_boy");

  // Exactly 20 Boss Stages (Stage 50 & Stage 100 of every palace)
  let bossCount = 0;
  for (let stage = 1; stage <= 1000; stage++) {
    const setup = Engine.getStageCharacterSetup(stage);
    if (setup.isBossStage) {
      bossCount++;
      assert.equal(setup.bossId, "boss_gummy_king");
      assert.equal(setup.leftHeroId, null);
      assert.equal(setup.rightHeroId, null);
      assert.ok(setup.stageInPalace === 50 || setup.stageInPalace === 100);
      assert.equal(setup.punishmentMoveLimit, setup.palaceNumber >= 3 ? 4 : 5);
    }
  }
  assert.equal(bossCount, 20);
});

test("Hero Ultimate charge rings charge +8%/+20% left and +10% right, pulse ready at 100%, and reset to 0% on consume", () => {
  const tracker = Engine.createHeroChargeTracker();
  assert.equal(tracker.getState().left, 0);
  assert.equal(tracker.getState().right, 0);

  tracker.onNormalMatch();
  assert.equal(tracker.getState().left, 8);
  assert.equal(tracker.getState().right, 10);

  tracker.onSpecialOrObstacleBreak(1);
  assert.equal(tracker.getState().left, 28);
  assert.equal(tracker.getState().right, 20);

  assert.equal(tracker.consume("left"), false);

  for (let i = 0; i < 8; i++) tracker.onSpecialOrObstacleBreak(1);
  assert.equal(tracker.getState().left, 100);
  assert.equal(tracker.getState().right, 100);
  assert.equal(tracker.getState().leftReady, true);
  assert.equal(tracker.getState().rightReady, true);

  // SVG stroke-dashoffset math
  assert.equal(Engine.computeRingOffset(0, 282.74), 282.74);
  assert.equal(Engine.computeRingOffset(100, 282.74), 0);

  assert.equal(tracker.consume("right"), true);
  assert.equal(tracker.getState().right, 0);
  assert.equal(tracker.getState().left, 100);

  assert.equal(tracker.consume("left"), true);
  assert.equal(tracker.getState().left, 0);
});

test("Dragon, Queen Luma, and Pharaoh Boy ultimate planners target optimal tiles", () => {
  const grid = Array.from({ length: 8 }, () =>
    Array.from({ length: 7 }, () => ({ type: 1, special: null, ice: 0, obs: null }))
  );
  // Put a high-density obstacle cluster at (4,2)..(5,3)
  grid[4][2] = { type: 2, special: null, ice: 2, obs: "double_ice" };
  grid[4][3] = { type: 2, special: null, ice: 2, obs: "double_ice" };
  grid[5][2] = { type: 2, special: null, ice: 2, obs: "stone_wall" };
  grid[5][3] = { type: 2, special: null, ice: 2, obs: "stone_wall" };

  const dragonPlan = Engine.pickDragonBeamTargets(grid, 8, 7);
  assert.ok(dragonPlan.targets.length >= 6);
  assert.ok(Math.abs(dragonPlan.anchor.r - 4) <= 1 && Math.abs(dragonPlan.anchor.c - 2) <= 1);

  const queenTargets = Engine.pickQueenRocketTargets(grid, 8, 7, 3);
  assert.equal(queenTargets.length, 3);
  for (const t of queenTargets) {
    assert.equal(grid[t.r][t.c].obs, null);
  }

  const pharaohTargets = Engine.pickPharaohAnkhTargets(grid, 8, 7);
  assert.equal(pharaohTargets.length, 4);
});

test("Boss HP Battle drains smoothly with 2-4 golden orbs, wins at 0% HP, and triggers 5-move (4-move Realm 3+) lightning punishment", () => {
  // Palace 1 Stage 50 => 5-move punishment limit
  const boss1 = Engine.createBossBattleState(50, 10);
  assert.equal(boss1.isBossStage, true);
  assert.equal(boss1.punishmentMoveLimit, 5);
  assert.equal(boss1.getState().hpPercent, 100);

  for (let i = 1; i <= 4; i++) {
    const r = boss1.recordMoveOutcome(false);
    assert.equal(r.shouldCounterAttack, false);
  }
  const fifth = boss1.recordMoveOutcome(false);
  assert.equal(fifth.shouldCounterAttack, true);
  boss1.resetCounterMoves();
  assert.equal(boss1.getState().movesWithoutBreak, 0);

  // Breaking an obstacle resets counter
  boss1.recordMoveOutcome(false);
  boss1.recordMoveOutcome(true);
  assert.equal(boss1.getState().movesWithoutBreak, 0);

  // Palace 3 Stage 300 => 4-move punishment limit
  const boss3 = Engine.createBossBattleState(300, 14);
  assert.equal(boss3.punishmentMoveLimit, 4);
  for (let i = 1; i <= 3; i++) assert.equal(boss3.recordMoveOutcome(false).shouldCounterAttack, false);
  assert.equal(boss3.recordMoveOutcome(false).shouldCounterAttack, true);

  // Golden energy orbs & HP drain -> 0% defeat
  const hit1 = boss1.applyDamage("obstacle", 1);
  assert.ok(hit1.orbsCount >= 2 && hit1.orbsCount <= 4);
  assert.ok(hit1.hpPercent < 100);

  const hit2 = boss1.applyDamage("color", 1);
  assert.equal(hit2.orbsCount, 4);

  while (!boss1.getState().defeated) {
    boss1.applyDamage("bomb", 1);
  }
  assert.equal(boss1.getState().hpPercent, 0);
  assert.equal(boss1.getState().defeated, true);
});
