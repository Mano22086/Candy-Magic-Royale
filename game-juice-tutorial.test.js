const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const Core = require("./game-core.js");
const Systems = require("./js/gameplay/match3-systems.js");

function makeMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

function makeCleanGrid(rows = 8, cols = 7) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      type: ((r * 2 + c) % 6) + 1,
      special: null,
      ice: 0,
      obs: null,
    }))
  );
}

test("Arabic combo callouts and escalating pitch clamp properly", () => {
  assert.equal(Systems.getComboCallout(1), null);
  assert.equal(Systems.getComboCallout(2).text, "رائع!");
  assert.equal(Systems.getComboCallout(3).text, "مذهل!");
  assert.equal(Systems.getComboCallout(4).text, "أسطوري!");
  assert.equal(Systems.getComboCallout(5).text, "فرعوني!");
  assert.equal(Systems.getComboCallout(9).text, "فرعوني!");

  assert.equal(Systems.computeComboPitchRate(1), 1);
  assert.equal(Systems.computeComboPitchRate(2), 1.08);
  assert.equal(Systems.computeComboPitchRate(5), 1.32);
  assert.equal(Systems.computeComboPitchRate(20), 1.6);
});

test("Super Booster Combos plan 3x3 cross, 5x5 bomb, cross rockets, and color+rocket chain", () => {
  const grid = makeCleanGrid();
  // Rocket + Bomb -> 3 rows x 3 cols cross
  grid[3][3].special = "striped";
  grid[3][4].special = "wrapped";
  const rb = Systems.computeSuperComboPlan(grid, 8, 7, { r: 3, c: 3 }, { r: 3, c: 4 });
  assert.equal(rb.comboType, "rocket_bomb");
  assert.equal(rb.isSuperCombo, true);
  assert.equal(rb.hapticMs, 30);
  // 3 full rows (21) + 3 full cols (24) - 9 overlap = 36 cells
  assert.equal(rb.cells.size, 36);

  // Bomb + Bomb -> 5x5 area (25 cells around center (3,3))
  const grid2 = makeCleanGrid();
  grid2[3][2].special = "wrapped";
  grid2[3][3].special = "wrapped";
  const bb = Systems.computeSuperComboPlan(grid2, 8, 7, { r: 3, c: 2 }, { r: 3, c: 3 });
  assert.equal(bb.comboType, "bomb_bomb");
  assert.equal(bb.cells.size, 25);

  // Rocket + Rocket -> full row + full col cross
  const grid3 = makeCleanGrid();
  grid3[4][2].special = "striped";
  grid3[4][3].special = "striped";
  const rr = Systems.computeSuperComboPlan(grid3, 8, 7, { r: 4, c: 2 }, { r: 4, c: 3 });
  assert.equal(rr.comboType, "rocket_rocket");
  assert.equal(rr.cells.size, 7 + 8 - 1);

  // Color Ball + Rocket -> converts all candies of most common color
  const grid4 = makeCleanGrid();
  grid4[2][2].special = "color";
  grid4[2][3].special = "striped";
  const cr = Systems.computeSuperComboPlan(grid4, 8, 7, { r: 2, c: 2 }, { r: 2, c: 3 });
  assert.equal(cr.comboType, "color_rocket");
  assert.equal(cr.convertTo, "striped");
  assert.equal(cr.chainDelayMs, 90);
  assert.ok(cr.chainTargets.length >= 6);
});

test("Smart 5-second auto-hint prioritizes Super Combo > Color Ball > Bomb > Rocket > 3-match", () => {
  const grid = makeCleanGrid();
  // Create a normal 3-match AND a 5-match Color Ball creation; scanner must pick Color Ball
  grid[1][0].type = 2;
  grid[1][1].type = 2;
  grid[2][2].type = 2;
  grid[1][2].type = 5;

  // Horizontal 5-match creation at row 5: cols 1,2,(swap 6,3 -> 5,3),4,5 of type 6
  grid[5][1].type = 6;
  grid[5][2].type = 6;
  grid[5][3].type = 3;
  grid[5][4].type = 6;
  grid[5][5].type = 6;
  grid[6][3].type = 6;

  const hint1 = Systems.findBestSmartHint(grid, 8, 7);
  assert.ok(hint1);
  assert.equal(hint1.kind, "create_color_ball");

  // Add adjacent Special+Special -> must take top priority
  grid[0][0].special = "striped";
  grid[0][1].special = "wrapped";
  const hint2 = Systems.findBestSmartHint(grid, 8, 7);
  assert.equal(hint2.kind, "super_combo");
});

test("Smart Pity Difficulty activates 12% bias after 3 consecutive fails and resets on win", () => {
  const store = makeMemoryStorage();
  const pity = Systems.createPityTracker(store);
  assert.equal(pity.getSpawnBias(12), 0);
  pity.recordFail(12);
  pity.recordFail(12);
  assert.equal(pity.getSpawnBias(12), 0);
  pity.recordFail(12);
  assert.equal(pity.getFailCount(12), 3);
  assert.equal(pity.getSpawnBias(12), 0.12);

  const grid = makeCleanGrid();
  // With rng returning 0.05 (< 0.12), pickBiasedCandyType picks an adjacent color
  const picked = Systems.pickBiasedCandyType(grid, 3, 3, 8, 7, 6, 0.12, () => 0.05);
  const validNeighbors = [grid[4][3].type, grid[3][2].type, grid[3][4].type, grid[2][3].type];
  assert.ok(validNeighbors.includes(picked));

  pity.recordWin(12);
  assert.equal(pity.getFailCount(12), 0);
  assert.equal(pity.getSpawnBias(12), 0);
});

test("Free Gift Chest enforces 4-hour cooldown and grants coins or random booster", () => {
  const store = makeMemoryStorage();
  const chest = Systems.createFreeChestEngine(store);
  const t0 = 1_700_000_000_000;
  assert.equal(chest.getStatus(t0).ready, true);

  const c1 = chest.claim(t0, () => 0.2); // coins branch
  assert.equal(c1.ok, true);
  assert.ok(c1.reward.coins >= 50 && c1.reward.coins <= 100);

  // Immediately blocked during 4h cooldown
  const blocked = chest.claim(t0 + 60_000);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, "cooldown");
  assert.equal(Systems.formatCountdownHHMMSS(chest.COOLDOWN_MS), "04:00:00");

  // Ready again after 4 hours -> booster branch
  const c2 = chest.claim(t0 + chest.COOLDOWN_MS, () => 0.8);
  assert.equal(c2.ok, true);
  assert.equal(Object.values(c2.reward)[0], 1);
});

test("Hard (10, 40, 75), Super Hard (25, 90), Gradual Difficulty Curve & All 20 Obstacles", () => {
  // Stages 1..10: light 1-layer intro obstacles & 22..28 generous moves
  for (let s = 1; s <= 10; s++) {
    const cfg = Core.getLevelConfig(s);
    assert.equal(cfg.introSingleLayer, true, `stage ${s} should be introSingleLayer`);
    assert.ok(cfg.moves >= 22 && cfg.moves <= 28, `stage ${s} moves=${cfg.moves}`);
    assert.ok(!cfg.obstacles.includes("obsidian_shield"), "obsidian_shield must not appear in Stages 1-10");
  }

  // Milestone coin multipliers
  for (const s of [10, 40, 75, 110, 240, 975]) {
    const cfg = Core.getLevelConfig(s);
    assert.equal(cfg.isHard, true);
    assert.equal(cfg.coinMultiplier, 2);
    assert.equal(cfg.difficultyTagAr, "مرحلة صعبة 🔥");
  }
  for (const s of [25, 90, 125, 490]) {
    const cfg = Core.getLevelConfig(s);
    assert.equal(cfg.isSuperHard, true);
    assert.equal(cfg.coinMultiplier, 2.5);
    assert.equal(cfg.difficultyTagAr, "تحدي فرعوني خارق ⚡");
  }

  // All 12 new uploaded obstacle assets exist on disk and are unlocked across Palaces 1..10
  const allSeenAcrossGame = new Set();
  for (let s = 1; s <= 1000; s++) {
    const cfg = Core.getLevelConfig(s);
    assert.ok(cfg.obstacles.length >= 1 && cfg.obstacles.length <= 3, `stage ${s} max 3 HUD slots`);
    cfg.obstacles.forEach((id) => allSeenAcrossGame.add(id));
  }
  for (const obsId of Systems.NEW_OBSTACLE_IDS) {
    assert.ok(allSeenAcrossGame.has(obsId), `${obsId} must appear in 1000-stage progression`);
    const def = Systems.OBSTACLE_CATALOG[obsId];
    assert.ok(def && def.tutorialAr.length > 8);
    const diskPath = path.join(__dirname, def.imgSrc.replace(/^\.\//, ""));
    assert.equal(fs.existsSync(diskPath), true, `missing asset ${def.imgSrc}`);
  }
  // HUD Objective Panel asset exists on disk
  const hudPath = path.join(__dirname, Systems.HUD_OBJECTIVE_PANEL_SRC.replace(/^\.\//, ""));
  assert.equal(fs.existsSync(hudPath), true, "HUD Objective Panel PNG must exist");

  // Obsidian shield is booster-only
  assert.equal(Systems.OBSTACLE_CATALOG.obsidian_shield.boosterOnly, true);
  assert.equal(Systems.OBSTACLE_CATALOG.magic_lamp.lampBlast, true);
});

test("Seen Obstacles Tracker queues unseen obstacles once and persists", () => {
  const store = makeMemoryStorage();
  const tracker = Systems.createSeenObstaclesTracker(store);
  assert.deepEqual(tracker.getUnseenInList(["sandstone_block", "magic_lamp"]), [
    "sandstone_block",
    "magic_lamp",
  ]);
  tracker.markSeen("sandstone_block");
  assert.deepEqual(tracker.getUnseenInList(["sandstone_block", "magic_lamp"]), ["magic_lamp"]);
});
