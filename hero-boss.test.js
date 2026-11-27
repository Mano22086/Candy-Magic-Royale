const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Engine = require("./js/gameplay/hero-boss-engine");

test("all 3 50-frame 10x5 character sprite sheets and Mega Pack Boss HP bar PNG exist on disk", () => {
  assert.deepEqual(Object.keys(Engine.SPRITE_SHEETS).sort(), [
    "boss_anubis",
    "cleopatra",
    "golden_dragon",
  ]);
  for (const [id, rel] of Object.entries(Engine.SPRITE_SHEETS)) {
    const abs = path.join(__dirname, rel);
    assert.ok(fs.existsSync(abs), `Missing sprite sheet for ${id}: ${rel}`);
  }
  const hpBarAbs = path.join(__dirname, Engine.BOSS_HP_BAR_FRAME);
  assert.ok(fs.existsSync(hpBarAbs), `Missing Boss HP bar frame: ${Engine.BOSS_HP_BAR_FRAME}`);
});

test("50-frame 10x5 row-major sprite frame coordinates map indices 0..49 accurately", () => {
  assert.equal(Engine.SPRITE_GRID.COLS, 10);
  assert.equal(Engine.SPRITE_GRID.ROWS, 5);
  assert.equal(Engine.SPRITE_GRID.TOTAL_FRAMES, 50);

  const f0 = Engine.getSpriteFramePosition(0);
  assert.equal(f0.col, 0);
  assert.equal(f0.row, 0);
  assert.equal(f0.cssPosition, "0.0000% 0.0000%");

  const f9 = Engine.getSpriteFramePosition(9);
  assert.equal(f9.col, 9);
  assert.equal(f9.row, 0);
  assert.equal(f9.xPct, 100);
  assert.equal(f9.yPct, 0);

  const f25 = Engine.getSpriteFramePosition(25);
  assert.equal(f25.col, 5);
  assert.equal(f25.row, 2);
  assert.equal(f25.yPct, 50);

  const f49 = Engine.getSpriteFramePosition(49);
  assert.equal(f49.col, 9);
  assert.equal(f49.row, 4);
  assert.equal(f49.cssPosition, "100.0000% 100.0000%");
});

test("placement rules assign Queen Cleopatra + Golden Dragon on normal stages and King Anubis on Stage 50 & 100 of every palace (including infinite realms)", () => {
  const s1 = Engine.getStageCharacterSetup(1);
  assert.equal(s1.isBossStage, false);
  assert.equal(s1.leftHeroId, "cleopatra");
  assert.equal(s1.rightHeroId, "golden_dragon");

  const s101 = Engine.getStageCharacterSetup(101);
  assert.equal(s101.isBossStage, false);
  assert.equal(s101.leftHeroId, "cleopatra");
  assert.equal(s101.rightHeroId, "golden_dragon");

  // Exactly 20 Boss Stages in Palaces 1..10 + Infinite Bosses (1050, 1100)
  let bossCount = 0;
  for (let stage = 1; stage <= 1000; stage++) {
    const setup = Engine.getStageCharacterSetup(stage);
    if (setup.isBossStage) {
      bossCount++;
      assert.equal(setup.bossId, "boss_anubis");
      assert.equal(setup.leftHeroId, null);
      assert.equal(setup.rightHeroId, null);
      assert.ok(setup.stageInPalace === 50 || setup.stageInPalace === 100);
      assert.equal(setup.punishmentMoveLimit, 5);
    }
  }
  assert.equal(bossCount, 20);

  const infBoss = Engine.getStageCharacterSetup(1050);
  assert.equal(infBoss.isBossStage, true);
  assert.equal(infBoss.bossId, "boss_anubis");
  assert.equal(infBoss.palaceNumber, 11);
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

  assert.equal(Engine.computeRingOffset(0, 282.74), 282.74);
  assert.equal(Engine.computeRingOffset(100, 282.74), 0);

  assert.equal(tracker.consume("right"), true);
  assert.equal(tracker.getState().right, 0);
  assert.equal(tracker.getState().left, 100);

  assert.equal(tracker.consume("left"), true);
  assert.equal(tracker.getState().left, 0);
});

test("Golden Dragon and Queen Cleopatra ultimate planners target optimal 8x8 tiles", () => {
  const grid = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => ({ type: 1, special: null, ice: 0, obs: null }))
  );
  grid[4][2] = { type: 2, special: null, ice: 2, obs: "sandstone_block" };
  grid[4][3] = { type: 2, special: null, ice: 2, obs: "sandstone_block" };
  grid[5][2] = { type: 2, special: null, ice: 2, obs: "obsidian_shield" };
  grid[5][3] = { type: 2, special: null, ice: 2, obs: "obsidian_shield" };

  const dragonPlan = Engine.pickDragonBeamTargets(grid, 8, 8);
  assert.ok(dragonPlan.targets.length >= 6);
  assert.ok(Math.abs(dragonPlan.anchor.r - 4) <= 1 && Math.abs(dragonPlan.anchor.c - 2) <= 1);

  const queenTargets = Engine.pickQueenRocketTargets(grid, 8, 8, 3);
  assert.equal(queenTargets.length, 3);
  for (const t of queenTargets) {
    assert.equal(grid[t.r][t.c].obs, null);
  }

  const allObs = Engine.pickPharaohAnkhTargets(grid, 8, 8);
  assert.equal(allObs.length, 4);
});

test("King Anubis Boss HP Battle drains smoothly with 2-4 golden orbs, wins at 0% HP, and triggers 5-move Ankh Lightning punishment", () => {
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

  boss1.recordMoveOutcome(false);
  boss1.recordMoveOutcome(true);
  assert.equal(boss1.getState().movesWithoutBreak, 0);

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
