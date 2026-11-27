const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const Pack = require("./js/gameplay/anubis-mega-pack-engine.js");
const Core = require("./game-core.js");
const Systems = require("./js/gameplay/match3-systems.js");
const CardAlbum = require("./js/systems/card-album.js");

function assertExists(relPath) {
  const abs = path.join(__dirname, relPath.replace(/^\.\//, ""));
  assert.ok(fs.existsSync(abs), `Missing Mega Pack asset on disk: ${relPath}`);
}

test("All Anubis Mega Pack assets exist on disk across all 11 folders (candies, specials, 50-frame sheets, 70 WebP boards, UI frames, 22 obstacles, 18 MP3s)", () => {
  // 01 & 02 Dual Candy Palettes
  assert.equal(Object.keys(Pack.MEGA_PACK_ASSETS.candiesRoyalDesserts).length, 6);
  assert.equal(Object.keys(Pack.MEGA_PACK_ASSETS.candiesPharaonicRelics).length, 6);
  Object.values(Pack.MEGA_PACK_ASSETS.candiesRoyalDesserts).forEach(assertExists);
  Object.values(Pack.MEGA_PACK_ASSETS.candiesPharaonicRelics).forEach(assertExists);

  // 03, 04, 05 Special Candies
  assert.equal(Object.keys(Pack.MEGA_PACK_ASSETS.rockets).length, 6);
  assert.equal(Object.keys(Pack.MEGA_PACK_ASSETS.bombs).length, 6);
  Object.values(Pack.MEGA_PACK_ASSETS.rockets).forEach(assertExists);
  Object.values(Pack.MEGA_PACK_ASSETS.bombs).forEach(assertExists);
  assertExists(Pack.MEGA_PACK_ASSETS.colorBall);

  // 06 50-frame 10x5 Character Sheets
  assert.equal(Object.keys(Pack.MEGA_PACK_ASSETS.characters50).length, 3);
  Object.values(Pack.MEGA_PACK_ASSETS.characters50).forEach(assertExists);

  // 07 50 Regular WebP Boards
  for (let i = 1; i <= 50; i++) {
    assertExists(`./mega_pack/07_boards_regular_50/board_${String(i).padStart(2, "0")}.webp`);
  }

  // 08 20 King Anubis Boss WebP Boards
  for (let i = 1; i <= 20; i++) {
    assertExists(`./mega_pack/08_boards_boss_anubis_20/boss_anubis_board_${String(i).padStart(2, "0")}.webp`);
  }

  // 09 Pharaonic UI Frames & Buttons
  assert.equal(Object.keys(Pack.MEGA_PACK_ASSETS.uiFrames).length, 9);
  Object.values(Pack.MEGA_PACK_ASSETS.uiFrames).forEach(assertExists);

  // 10 All 22 Standalone Animated 3D Obstacles
  assert.equal(Object.keys(Pack.MEGA_PACK_ASSETS.obstacles22).length, 22);
  Object.values(Pack.MEGA_PACK_ASSETS.obstacles22).forEach(assertExists);

  // 11 All 18 MP3 Audio Files
  assert.equal(Object.keys(Pack.MEGA_PACK_ASSETS.audio18).length, 18);
  Object.values(Pack.MEGA_PACK_ASSETS.audio18).forEach(assertExists);
});

test("Dual candy palettes alternate cleanly between Odd (Royal Desserts) and Even (Pharaonic Relics) palaces including infinite realms", () => {
  assert.equal(Pack.getCandyPaletteForStage(1).themeId, "royal_desserts");
  assert.equal(Pack.getCandyPaletteForStage(100).themeId, "royal_desserts");
  assert.equal(Pack.getCandyPaletteForStage(101).themeId, "pharaonic_relics");
  assert.equal(Pack.getCandyPaletteForStage(250).themeId, "royal_desserts");
  assert.equal(Pack.getCandyPaletteForStage(1001).themeId, "royal_desserts");
  assert.equal(Pack.getCandyPaletteForStage(1101).themeId, "pharaonic_relics");
});

test("Infinite stages (1,001 -> Infinity) have no upper cap, cycle 70 WebP boards cleanly, and generate procedural realm titles", () => {
  assert.equal(Core.clampStage(1505), 1505);
  assert.equal(Core.clampStage(2500), 2500);

  const meta1001 = Core.getStageMeta(1001);
  assert.equal(meta1001.palaceNumber, 11);
  assert.equal(meta1001.isInfiniteRealm, true);
  assert.ok(meta1001.palace && meta1001.palace.name.includes("11"));
  assert.ok(meta1001.boardImagePath.endsWith(".webp"));
  assertExists(meta1001.boardImagePath);

  const boss1050 = Core.getStageMeta(1050);
  assert.equal(boss1050.isBossStage, true);
  assert.equal(boss1050.bossName, "الملك أنوبيس");
  assert.ok(boss1050.boardImagePath.includes("boss_anubis_board_"));
  assertExists(boss1050.boardImagePath);
});

test("STRICT Candy Crush swap rule blocks Rocket/Bomb + normal candy without 3-match, allows Color Ball + normal, and allows Special + Special", () => {
  const rocket = { type: 1, special: "striped" };
  const bomb = { type: 2, special: "wrapped" };
  const colorBall = { type: 0, special: "color" };
  const normalRed = { type: 1, special: null };
  const normalBlue = { type: 2, special: null };

  // Rocket + normal candy with NO match3 -> BLOCKED
  const rNoMatch = Pack.isStrictSpecialSwapAllowed(rocket, normalBlue, false);
  assert.equal(rNoMatch.allowed, false);
  assert.equal(rNoMatch.mode, "blocked_strict_special");

  // Bomb + normal candy with NO match3 -> BLOCKED
  const bNoMatch = Pack.isStrictSpecialSwapAllowed(bomb, normalRed, false);
  assert.equal(bNoMatch.allowed, false);

  // Rocket + normal candy WITH match3 -> ALLOWED
  const rWithMatch = Pack.isStrictSpecialSwapAllowed(rocket, normalRed, true);
  assert.equal(rWithMatch.allowed, true);
  assert.equal(rWithMatch.mode, "match3_with_special");

  // Color Ball + ANY normal candy -> ALLOWED even without 3-match
  const cSwap = Pack.isStrictSpecialSwapAllowed(colorBall, normalBlue, false);
  assert.equal(cSwap.allowed, true);
  assert.equal(cSwap.mode, "color_ball_swap");

  // Special + Special -> ALLOWED (Super Combo)
  const ssSwap = Pack.isStrictSpecialSwapAllowed(rocket, bomb, false);
  assert.equal(ssSwap.allowed, true);
  assert.equal(ssSwap.mode, "super_combo");
});

test("Epic Special Combos target Rocket/Bomb color and Color+Color triggers sequential full-board lightning", () => {
  const grid = Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => ({
      type: ((r + c) % 6) + 1,
      special: null,
      ice: 0,
      obs: null,
    }))
  );

  grid[2][2] = { type: 0, special: "color", ice: 0, obs: null };
  grid[2][3] = { type: 4, special: "striped", ice: 0, obs: null };
  const cr = Systems.computeSuperComboPlan(grid, 8, 8, { r: 2, c: 2 }, { r: 2, c: 3 });
  assert.equal(cr.comboType, "color_rocket");
  assert.equal(cr.targetColor, 4);
  assert.equal(cr.convertTo, "striped");

  grid[2][3] = { type: 5, special: "wrapped", ice: 0, obs: null };
  const cb = Systems.computeSuperComboPlan(grid, 8, 8, { r: 2, c: 2 }, { r: 2, c: 3 });
  assert.equal(cb.comboType, "color_bomb");
  assert.equal(cb.targetColor, 5);
  assert.equal(cb.convertTo, "wrapped");

  grid[2][3] = { type: 0, special: "color", ice: 0, obs: null };
  const cc = Systems.computeSuperComboPlan(grid, 8, 8, { r: 2, c: 2 }, { r: 2, c: 3 });
  assert.equal(cc.comboType, "color_color");
  assert.equal(cc.sequentialLightning, true);
  assert.equal(cc.cells.size, 64);
});

test("10-second English Streak Announcer fires voice_1..voice_6 from match 3..8+ and resets silently after 10s", () => {
  const streak = Pack.createStreakAnnouncerEngine(10000);
  assert.equal(streak.recordMatch(1000).triggered, false);
  assert.equal(streak.recordMatch(2000).triggered, false);

  const m3 = streak.recordMatch(3000);
  assert.equal(m3.triggered, true);
  assert.equal(m3.callout.text, "SWEET!");
  assert.equal(m3.callout.voiceKey, "voice_1");

  assert.equal(streak.recordMatch(4000).callout.text, "TASTY!");
  assert.equal(streak.recordMatch(5000).callout.text, "DELICIOUS!");
  assert.equal(streak.recordMatch(6000).callout.text, "DIVINE!");
  assert.equal(streak.recordMatch(7000).callout.text, "ROYAL!");
  assert.equal(streak.recordMatch(8000).callout.text, "LEGENDARY!");
  assert.equal(streak.recordMatch(9000).callout.text, "LEGENDARY!");

  // Pause > 10 seconds resets streak silently
  const afterGap = streak.recordMatch(20500);
  assert.equal(afterGap.triggered, false);
  assert.equal(afterGap.streakCount, 1);
});

test("Daily Rotating Shop Combo is deterministic by date, Pre-Level Boosters rotate cleanly, and real_money packs have BLANK price tags", () => {
  const comboA1 = Pack.getDailyShopComboBundle("2026-11-27");
  const comboA2 = Pack.getDailyShopComboBundle("2026-11-27");
  assert.deepEqual(comboA1, comboA2);
  assert.equal(comboA1.currency, "coins");

  const slots1 = Pack.getPreLevelBoosterRotation(1);
  const slots2 = Pack.getPreLevelBoosterRotation(2);
  assert.equal(slots1.length, 3);
  assert.equal(slots2.length, 3);
  assert.notEqual(slots1[0].id, slots2[0].id);

  assert.ok(Pack.REAL_MONEY_PACKS.length >= 3);
  for (const iap of Pack.REAL_MONEY_PACKS) {
    assert.equal(iap.currency, "real_money");
    assert.equal(iap.priceLabel, "");
  }

  const store = Core.createStoreEngine();
  const inv = { coins: 99999, gems: 999, lives: 5, hammer: 3, rockets: 3, colors: 3, paints: 3 };
  const iapAttempt = store.purchase(inv, "iap_pharaoh_starter", { now: 5000 });
  assert.equal(iapAttempt.ok, false);
  assert.equal(iapAttempt.reason, "requires_play_billing");
});

test("Infinite Card Album supports Set 1 -> Set 2 -> Set 3 seamlessly after completing all 9 cards", () => {
  const album = CardAlbum.createCardAlbumEngine({ packs: 6 }, () => 0);
  assert.equal(album.getState().currentSet, 1);
  album.openPack();
  album.openPack();
  album.openPack();
  assert.equal(album.getState().unlockedCount, 9);

  const claim = album.claimGrandReward();
  assert.equal(claim.ok, true);
  assert.equal(album.getState().grandRewardClaimed, true);

  const next = album.advanceToNextSet();
  assert.equal(next.ok, true);
  assert.equal(album.getState().currentSet, 2);
  assert.equal(album.getState().unlockedCount, 0);
  assert.ok(album.getState().setTitleAr.length > 0);
});

test("Smart 3D Obstacle pure mechanics work accurately (Magic Mirror 90° deflection, 2x2 Sphinx, Color-Lock Stone, 6-move Hourglass, Jumping Bastet, Spiderweb)", () => {
  // 1) Magic Mirror 90° Rocket deflection
  assert.equal(Pack.deflectRocketDirection("h"), "v");
  assert.equal(Pack.deflectRocketDirection("v"), "h");

  const grid = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => ({ type: 1, special: null, ice: 0, obs: null }))
  );
  grid[3][5] = { type: 0, special: null, ice: 2, obs: "magic_mirror" };
  const trace = Pack.traceRocketWithMirrors(grid, 8, 8, 3, 2, "h");
  assert.equal(trace.hitMirrors.length, 1);
  assert.ok(trace.cells.has("0,5") && trace.cells.has("7,5"), "Deflected beam must travel vertically along column 5");

  // 2) Linked 2x2 Sleeping Sphinx cluster
  grid[1][1] = { type: 0, special: null, ice: 3, obs: "sleeping_sphinx", sphinxGroupId: "s1" };
  grid[1][2] = { type: 0, special: null, ice: 3, obs: "sleeping_sphinx", sphinxGroupId: "s1" };
  grid[2][1] = { type: 0, special: null, ice: 3, obs: "sleeping_sphinx", sphinxGroupId: "s1" };
  grid[2][2] = { type: 0, special: null, ice: 3, obs: "sleeping_sphinx", sphinxGroupId: "s1" };
  assert.equal(Pack.getLinkedSphinxCluster(grid, 8, 8, 1, 1).length, 4);

  // 3) Color-Locked Stone
  const lockCell = { type: 3, obs: "color_lock_stone", ice: 2, lockColor: 3 };
  assert.equal(Pack.canBreakColorLockStone(lockCell, 2, false), false);
  assert.equal(Pack.canBreakColorLockStone(lockCell, 3, false), true);
  assert.equal(Pack.canBreakColorLockStone(lockCell, 2, true), true);

  // 4) 6-move Cursed Hourglass countdown
  grid[6][6] = { type: 0, special: null, ice: 1, obs: "cursed_hourglass", countdown: 2 };
  const t1 = Pack.tickCursedHourglasses(grid, 8, 8);
  assert.equal(t1.expired.length, 0);
  assert.equal(grid[6][6].countdown, 1);
  const t2 = Pack.tickCursedHourglasses(grid, 8, 8);
  assert.equal(t2.expired.length, 1);

  // 5) Jumping Bastet hops to free adjacent cell
  const dest = Pack.pickJumpingBastetDestination(grid, 8, 8, 5, 5, () => 0);
  assert.ok(dest && (Math.abs(dest.r - 5) + Math.abs(dest.c - 5) === 1));

  // 6) Golden Spiderweb locks candy swaps
  assert.equal(Pack.isCellSwapLockedByObstacle({ type: 1, obs: "golden_spiderweb", ice: 1 }), true);
  assert.equal(Pack.isCellSwapLockedByObstacle({ type: 1, obs: "hieroglyph_tile", ice: 1 }), false);
});
