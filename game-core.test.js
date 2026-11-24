const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const core = require("./game-core");

test("10 palaces x 100 stages = 1,000 stages with Candy King boss at stage 50 of each palace", () => {
  assert.equal(core.PALACES.length, 10);
  assert.equal(core.STAGES_PER_PALACE, 100);
  assert.equal(core.TOTAL_STAGES, 1000);

  for (let p = 0; p < 10; p++) {
    const firstStage = p * 100 + 1;
    const bossStage = p * 100 + 50;
    const lastStage = (p + 1) * 100;

    const firstMeta = core.getStageMeta(firstStage);
    assert.equal(firstMeta.palaceIndex, p);
    assert.equal(firstMeta.stageInPalace, 1);
    assert.equal(firstMeta.isBossStage, false);

    const bossMeta = core.getStageMeta(bossStage);
    assert.equal(bossMeta.palaceIndex, p);
    assert.equal(bossMeta.stageInPalace, 50);
    assert.equal(bossMeta.isBossStage, true);
    assert.equal(bossMeta.bossName, "زعيم ملك الحلوى");

    const lastMeta = core.getStageMeta(lastStage);
    assert.equal(lastMeta.palaceIndex, p);
    assert.equal(lastMeta.stageInPalace, 100);
    assert.equal(lastMeta.isBossStage, false);
  }
});

test("all 50 supplied stage backgrounds exist on disk and map cleanly across the 10 palaces", () => {
  const seenBoards = new Set();
  for (let p = 0; p < 10; p++) {
    for (let v = 1; v <= 5; v++) {
      const stage = p * 100 + v;
      const meta = core.getStageMeta(stage);
      seenBoards.add(meta.boardNumber);
      const diskPath = path.join(__dirname, meta.boardImagePath);
      assert.ok(fs.existsSync(diskPath), `Missing board background file: ${meta.boardImagePath}`);
    }
  }
  assert.equal(seenBoards.size, 50);
});

test("game state machine transitions cleanly and prevents post-win interference or duplicate end modals", () => {
  const sm = core.createGameStateMachine();
  assert.equal(sm.phase, core.GAME_STATES.PLAYING);
  assert.equal(sm.canAcceptInput(), true);

  assert.equal(sm.beginResolving(), true);
  assert.equal(sm.phase, core.GAME_STATES.RESOLVING);
  assert.equal(sm.canAcceptInput(), false);

  // Completing objective immediately transitions to Won
  const outcome1 = sm.evaluateOutcome({
    levelReady: true,
    obstacleGoal: 3,
    remainingObstacles: 0,
    movesLeft: 10,
  });
  assert.equal(outcome1, core.GAME_STATES.WON);
  assert.equal(sm.phase, core.GAME_STATES.WON);
  assert.equal(sm.isTerminal(), true);

  // Cannot emit a second victory or defeat modal
  const outcome2 = sm.evaluateOutcome({
    levelReady: true,
    obstacleGoal: 3,
    remainingObstacles: 0,
    movesLeft: 0,
  });
  assert.equal(outcome2, null);

  // Cannot accidentally return to Playing after Won
  assert.equal(sm.finishResolvingToPlaying(), false);
  assert.equal(sm.phase, core.GAME_STATES.WON);

  // Explicit reset starts next stage cleanly
  sm.resetToPlaying();
  assert.equal(sm.phase, core.GAME_STATES.PLAYING);
  assert.equal(sm.canAcceptInput(), true);

  // Out of moves with obstacles remaining => Lost
  const lossOutcome = sm.evaluateOutcome({
    levelReady: true,
    obstacleGoal: 3,
    remainingObstacles: 2,
    movesLeft: 0,
  });
  assert.equal(lossOutcome, core.GAME_STATES.LOST);
  assert.equal(sm.phase, core.GAME_STATES.LOST);
});

test("heart action guard deducts exactly 1 heart on confirm, 0 on cancel, and blocks double-click duplicates", () => {
  const guard = core.createHeartActionGuard();

  // Cancel never deducts
  guard.openConfirmation("restart");
  const cancelRes = guard.cancelConfirmation();
  assert.equal(cancelRes.deducted, false);

  // Confirm deducts exactly 1 heart, and a duplicate click deducts 0
  const token = guard.openConfirmation("exit");
  const firstConfirm = guard.confirmAndDeduct(5, token);
  assert.equal(firstConfirm.allowed, true);
  assert.equal(firstConfirm.deducted, true);
  assert.equal(firstConfirm.nextLives, 4);
  assert.equal(firstConfirm.actionType, "exit");

  const doubleClickConfirm = guard.confirmAndDeduct(4, token);
  assert.equal(doubleClickConfirm.allowed, false);
  assert.equal(doubleClickConfirm.deducted, false);
  assert.equal(doubleClickConfirm.nextLives, 4);
});

test("findMatchesInGrid detects horizontal and vertical 3+ runs accurately", () => {
  const grid = [
    [{ type: 1 }, { type: 1 }, { type: 1 }, { type: 2 }],
    [{ type: 3 }, { type: 4 }, { type: 5 }, { type: 2 }],
    [{ type: 6 }, { type: 3 }, { type: 4 }, { type: 2 }],
  ];
  const matches = core.findMatchesInGrid(grid, 3, 4);
  assert.equal(matches.has("0,0"), true);
  assert.equal(matches.has("0,1"), true);
  assert.equal(matches.has("0,2"), true);
  assert.equal(matches.has("0,3"), true);
  assert.equal(matches.has("1,3"), true);
  assert.equal(matches.has("2,3"), true);
  assert.equal(matches.size, 6);
});

test("in-game store includes all 6 required Arabic categories and every product image exists on disk", () => {
  const expectedLabels = [
    "العملات الذهبية",
    "الجواهر",
    "القلوب",
    "المعززات",
    "الصناديق والهدايا",
    "العروض الخاصة",
  ];
  assert.deepEqual(
    core.STORE_CATEGORIES.map((c) => c.label),
    expectedLabels
  );

  for (const cat of core.STORE_CATEGORIES) {
    const iconPath = path.join(__dirname, cat.icon);
    assert.ok(fs.existsSync(iconPath), `Missing store category icon: ${cat.icon}`);
    const catItems = core.STORE_ITEMS.filter((i) => i.category === cat.id);
    assert.ok(catItems.length >= 3, `Category ${cat.id} should have at least 3 products`);
  }

  for (const item of core.STORE_ITEMS) {
    assert.ok(item.name && item.description, `Store item ${item.id} missing name/description`);
    const imgPath = path.join(__dirname, item.image);
    assert.ok(fs.existsSync(imgPath), `Missing store product image: ${item.image}`);
  }
});

test("store engine deducts currencies accurately, updates inventory, blocks insufficient balance, full hearts, and duplicate clicks", () => {
  const store = core.createStoreEngine();
  let inv = { coins: 500, gems: 25, lives: 5, hammer: 3, rockets: 3, colors: 3, paints: 3 };

  // 1. Valid booster purchase with coins
  const buyBomb = store.purchase(inv, "booster_bomb_3", { now: 1000, minGapMs: 350 });
  assert.equal(buyBomb.ok, true);
  assert.equal(buyBomb.inventory.coins, 350);
  assert.equal(buyBomb.inventory.hammer, 6);
  inv = buyBomb.inventory;

  // 2. Duplicate rapid click within cooldown is blocked
  const dupClick = store.purchase(inv, "booster_bomb_3", { now: 1100, minGapMs: 350 });
  assert.equal(dupClick.ok, false);
  assert.equal(dupClick.reason, "duplicate_click");
  assert.equal(dupClick.inventory.coins, 350);

  // 3. Insufficient coins blocked
  const tooExpensive = store.purchase(inv, "gems_crown_pack", { now: 2000, minGapMs: 350 });
  assert.equal(tooExpensive.ok, false);
  assert.equal(tooExpensive.reason, "insufficient_coins");
  assert.equal(tooExpensive.inventory.coins, 350);

  // 4. Full hearts blocked
  const fullHearts = store.purchase(inv, "heart_single", { now: 3000, minGapMs: 350 });
  assert.equal(fullHearts.ok, false);
  assert.equal(fullHearts.reason, "hearts_full");

  // 5. Missing hearts allowed and deducts coins
  inv.lives = 3;
  const buyHeart = store.purchase(inv, "heart_single", { now: 4000, minGapMs: 350 });
  assert.equal(buyHeart.ok, true);
  assert.equal(buyHeart.inventory.lives, 4);
  assert.equal(buyHeart.inventory.coins, 200);
  inv = buyHeart.inventory;

  // 6. Gem purchase of royal chest unpacks multiple rewards
  const buyChest = store.purchase(inv, "chest_royal_gold", { now: 5000, minGapMs: 350 });
  assert.equal(buyChest.ok, true);
  assert.equal(buyChest.inventory.gems, 15);
  assert.equal(buyChest.inventory.coins, 500);
  assert.equal(buyChest.inventory.hammer, 8);
  assert.equal(buyChest.inventory.rockets, 5);
  assert.equal(buyChest.inventory.colors, 5);
  inv = buyChest.inventory;

  // 7. Daily gift allowed once per day, blocked second time
  const dailyClaims = {};
  const gift1 = store.purchase(inv, "offer_daily_gift", {
    now: 6000,
    minGapMs: 350,
    todayKey: "2026-11-24",
    dailyClaims,
  });
  assert.equal(gift1.ok, true);
  assert.equal(gift1.claimedDate, "2026-11-24");
  dailyClaims.offer_daily_gift = gift1.claimedDate;

  const gift2 = store.purchase(gift1.inventory, "offer_daily_gift", {
    now: 7000,
    minGapMs: 350,
    todayKey: "2026-11-24",
    dailyClaims,
  });
  assert.equal(gift2.ok, false);
  assert.equal(gift2.reason, "already_claimed_today");
});

test("rewarded ad engine strictly refuses fake rewards when unconfigured, grants only on real completion, and enforces daily limits", async () => {
  const adEngine = core.createRewardedAdEngine({ date: "2026-11-24" });

  // 1. Unconfigured provider MUST NOT fake an ad or grant rewards
  assert.equal(adEngine.getProviderInfo().configured, false);
  const unconf = await adEngine.requestAd("free_coins", { todayKey: "2026-11-24" });
  assert.equal(unconf.ok, false);
  assert.equal(unconf.granted, false);
  assert.equal(unconf.status, "unconfigured");

  // 2. Skipped ad grants ZERO reward and does not consume daily quota
  adEngine.registerProvider({
    name: "Test Ad Provider",
    showRewardedAd(_id, callbacks) {
      callbacks.onSkip();
    },
  });
  const skipped = await adEngine.requestAd("free_coins", { todayKey: "2026-11-24" });
  assert.equal(skipped.ok, false);
  assert.equal(skipped.granted, false);
  assert.equal(skipped.status, "skipped");
  assert.equal(adEngine.getQuota("free_coins", "2026-11-24").usedToday, 0);

  // 3. Failed ad grants ZERO reward
  adEngine.registerProvider({
    name: "Test Ad Provider",
    showRewardedAd(_id, callbacks) {
      callbacks.onError("no_fill");
    },
  });
  const failed = await adEngine.requestAd("extra_moves", { todayKey: "2026-11-24" });
  assert.equal(failed.ok, false);
  assert.equal(failed.granted, false);
  assert.equal(failed.status, "failed");

  // 4. Real completion grants exact reward once even if provider accidentally fires onComplete twice
  adEngine.registerProvider({
    name: "Test Ad Provider",
    showRewardedAd(_id, callbacks) {
      callbacks.onComplete();
      callbacks.onComplete(); // duplicate callback ignored
    },
  });
  const ok1 = await adEngine.requestAd("extra_heart", { todayKey: "2026-11-24" });
  assert.equal(ok1.ok, true);
  assert.equal(ok1.granted, true);
  assert.deepEqual(ok1.reward, { lives: 1 });
  assert.equal(adEngine.getQuota("extra_heart", "2026-11-24").usedToday, 1);

  // 5. Enforces placement daily limit (extra_heart limit = 2)
  const ok2 = await adEngine.requestAd("extra_heart", { todayKey: "2026-11-24" });
  assert.equal(ok2.ok, true);
  const blocked3 = await adEngine.requestAd("extra_heart", { todayKey: "2026-11-24" });
  assert.equal(blocked3.ok, false);
  assert.equal(blocked3.granted, false);
  assert.equal(blocked3.status, "daily_limit_reached");
});

