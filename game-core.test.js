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
    assert.equal(bossMeta.bossName, "الملك أنوبيس");

    const lastMeta = core.getStageMeta(lastStage);
    assert.equal(lastMeta.palaceIndex, p);
    assert.equal(lastMeta.stageInPalace, 100);
    assert.equal(lastMeta.isBossStage, true);
    assert.equal(lastMeta.bossName, "الملك أنوبيس الأعظم");
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

test("all 10 extracted individual palaces, 10 interior maps, new vertical world map, BGM MP3, profile frame, and UI badges exist on disk", () => {
  assert.ok(fs.existsSync(path.join(__dirname, "public/assets/aistudio/Picsart_26-11-25_18-52-31-817_a4649afd.jpg")));
  assert.ok(fs.existsSync(path.join(__dirname, "public/assets/aistudio/_____________13597d86.mp3")));
  assert.ok(fs.existsSync(path.join(__dirname, "assets/extracted/ui/player_map_banner_clean.png")));
  assert.ok(fs.existsSync(path.join(__dirname, "assets/extracted/profile/profile_frame_clean.png")));

  const expectedInteriorPrefixes = [
    "palace_01_golden_sapphire",
    "palace_02_amethyst_bastet",
    "palace_03_emerald_sphinx",
    "palace_04_crimson_lava",
    "palace_05_azure_oasis",
    "palace_06_obsidian_emerald",
    "palace_07_pharaoh_sphinx",
    "palace_08_pink_lotus",
    "palace_09_midnight_horus",
    "palace_10_sun_pyramid",
  ];

  const seenPalaceArt = new Set();
  const seenInteriorMaps = new Set();
  for (let i = 0; i < core.PALACES.length; i++) {
    const palace = core.PALACES[i];
    assert.ok(palace.castleArt.includes("assets/extracted/palaces/palace_"), `Palace ${palace.index} should use individual extracted PNG`);
    assert.ok(!seenPalaceArt.has(palace.castleArt), `Palace ${palace.index} artwork must be unique`);
    seenPalaceArt.add(palace.castleArt);
    assert.ok(fs.existsSync(path.join(__dirname, palace.castleArt)), `Missing palace PNG: ${palace.castleArt}`);

    assert.ok(
      palace.interiorMap && palace.interiorMap.includes(expectedInteriorPrefixes[i]),
      `Palace ${i + 1} interiorMap should match ${expectedInteriorPrefixes[i]}`
    );
    assert.ok(!seenInteriorMaps.has(palace.interiorMap), `Palace ${i + 1} interiorMap must be unique`);
    seenInteriorMaps.add(palace.interiorMap);
    assert.ok(fs.existsSync(path.join(__dirname, palace.interiorMap)), `Missing palace interior map: ${palace.interiorMap}`);

    assert.ok(palace.mapPos && typeof palace.mapPos.x === "number" && typeof palace.mapPos.y === "number");
  }
  assert.equal(seenPalaceArt.size, 10);
  assert.equal(seenInteriorMaps.size, 10);

  for (const av of core.AVATAR_CATALOG) {
    assert.ok(fs.existsSync(path.join(__dirname, av.src)), `Missing avatar image: ${av.src}`);
  }
  for (const ach of core.ACHIEVEMENTS) {
    assert.ok(fs.existsSync(path.join(__dirname, ach.badge)), `Missing achievement badge: ${ach.badge}`);
  }
});

test("player progression, palace summary, and achievements evaluate deterministically", () => {
  const prog1 = core.computePlayerProgression({ completedStages: 0, stars: 0, bossesDefeated: 0 });
  assert.equal(prog1.level, 1);
  assert.equal(prog1.totalXp, 0);

  const prog2 = core.computePlayerProgression({ completedStages: 154, stars: 410, bossesDefeated: 2 });
  assert.ok(prog2.level > 10);
  assert.ok(prog2.progressPercent >= 0 && prog2.progressPercent <= 100);

  const pal1 = core.getPalaceProgressSummary(0, 155, { 1: 3, 2: 2 });
  assert.equal(pal1.isCompleted, true);
  assert.equal(pal1.isLocked, false);
  assert.equal(pal1.completedCount, 100);
  assert.equal(pal1.earnedStars, 299);

  const pal2 = core.getPalaceProgressSummary(1, 155, {});
  assert.equal(pal2.isActive, true);
  assert.equal(pal2.completedCount, 54);

  const pal3 = core.getPalaceProgressSummary(2, 155, {});
  assert.equal(pal3.isLocked, true);
  assert.equal(pal3.completedCount, 0);

  const achs = core.evaluateAchievements(
    { highestUnlocked: 55, stars: 120, profileCustomized: true },
    { first_victory: true }
  );
  const firstVic = achs.find((a) => a.id === "first_victory");
  assert.equal(firstVic.unlocked, true);
  assert.equal(firstVic.claimed, true);
  assert.equal(firstVic.canClaim, false);

  const bossAch = achs.find((a) => a.id === "boss_slayer_1");
  assert.equal(bossAch.unlocked, true);
  assert.equal(bossAch.canClaim, true);

  const av = core.getAvatarById("unknown_id");
  assert.equal(av.id, "pharaoh_prince");
});

test("all 4 shop frames, 7 transparent shop icons, 4 triple-combo bundles, and wheel layers exist on disk and triple-combo purchases work cleanly", () => {
  assert.equal(Object.keys(core.SHOP_FRAMES).length, 4);
  for (const [k, relPath] of Object.entries(core.SHOP_FRAMES)) {
    assert.ok(fs.existsSync(path.join(__dirname, relPath)), `Missing shop frame ${k}: ${relPath}`);
  }
  assert.ok(core.SHOP_FRAMES.royal_blue.includes("shop_royal_kingdom_blue"));

  for (const [k, relPath] of Object.entries(core.SHOP_ICONS)) {
    assert.ok(fs.existsSync(path.join(__dirname, relPath)), `Missing shop icon ${k}: ${relPath}`);
  }

  for (const [k, relPath] of Object.entries(core.LUCKY_WHEEL_ASSETS)) {
    assert.ok(fs.existsSync(path.join(__dirname, relPath)), `Missing wheel asset ${k}: ${relPath}`);
  }

  assert.equal(core.SHOP_SHOWCASE_IDS.length, 6);
  for (const id of [core.SHOP_FEATURED_BUNDLE_ID, ...core.SHOP_SHOWCASE_IDS]) {
    assert.ok(core.getStoreItemById(id), `Showcase item missing: ${id}`);
  }

  // Test purchasing the Featured Mega Bundle & Triple-Combo Offer Packs
  const store = core.createStoreEngine();
  let inv = { coins: 1000, gems: 50, lives: 5, hammer: 3, rockets: 3, colors: 3, paints: 3 };

  const megaRes = store.purchase(inv, "combo_mega_featured", { now: 1000, minGapMs: 350 });
  assert.equal(megaRes.ok, true);
  assert.equal(megaRes.inventory.gems, 35);
  assert.equal(megaRes.inventory.coins, 1500);
  assert.equal(megaRes.inventory.rockets, 5);
  assert.equal(megaRes.inventory.paints, 5);
  assert.equal(megaRes.inventory.colors, 5);
  inv = megaRes.inventory;

  const combo2Res = store.purchase(inv, "combo_pack_2", { now: 2000, minGapMs: 350 });
  assert.equal(combo2Res.ok, true);
  assert.equal(combo2Res.inventory.coins, 1120);
  assert.equal(combo2Res.inventory.hammer, 5);
  assert.equal(combo2Res.inventory.colors, 7);
  assert.equal(combo2Res.inventory.gems, 38);
});

test("Daily Lucky Spin Wheel has 8 valid 45-degree slices and spin math lands accurately on every slice 0..7", () => {
  assert.equal(core.LUCKY_WHEEL_SLICES.length, 8);
  for (let i = 0; i < 8; i++) {
    const s = core.LUCKY_WHEEL_SLICES[i];
    assert.equal(s.index, i);
    assert.equal(s.angleDeg, i * 45 + 22.5);
    assert.ok(fs.existsSync(path.join(__dirname, s.icon)), `Missing wheel slice icon: ${s.icon}`);
  }

  // Verify every slice index 0..7 resolves accurately across repeated cumulative spins with safe jitter
  let angle = 0;
  for (let i = 0; i < 8; i++) {
    for (const jitter of [-10, 0, 10]) {
      const nextAngle = core.computeWheelSpinTarget(angle, i, 5, jitter);
      assert.ok(nextAngle > angle + 5 * 360, "Wheel must spin forward by at least 5 full turns");
      const landed = core.resolveWheelSliceFromAngle(nextAngle);
      assert.equal(landed.index, i, `Expected slice ${i} with jitter ${jitter}, got ${landed.index}`);
      angle = nextAngle;
    }
  }
});

test("Google AdMob manager stores real & test IDs, switches automatically on IS_TEST_MODE, and paces interstitials every 3 stages after Level 5", () => {
  const admob = require("./admob-manager");
  const cfg = admob.ADMOB_CONFIG;

  // 1. Exact IDs and safe Test Mode default
  assert.equal(cfg.IS_TEST_MODE, true);
  assert.equal(cfg.APP_ID, "ca-app-pub-7895931535988996~2281008271");
  assert.equal(cfg.LIVE_IDS.REWARDED, "ca-app-pub-7895931535988996/4427951627");
  assert.equal(cfg.LIVE_IDS.INTERSTITIAL, "ca-app-pub-7895931535988996/7728455278");
  assert.equal(cfg.TEST_IDS.REWARDED, "ca-app-pub-3940256099942544/5224354917");
  assert.equal(cfg.TEST_IDS.INTERSTITIAL, "ca-app-pub-3940256099942544/1033173712");

  // 2. Automatic TEST_IDS vs LIVE_IDS switching
  assert.deepEqual(admob.getActiveAdUnitIds({ ...cfg, IS_TEST_MODE: true }), cfg.TEST_IDS);
  assert.deepEqual(admob.getActiveAdUnitIds({ ...cfg, IS_TEST_MODE: false }), cfg.LIVE_IDS);

  // 3. Smart Interstitial pacing: never on levels 1..5
  let counter = 0;
  for (let lvl = 1; lvl <= 5; lvl++) {
    const res = admob.shouldShowInterstitial({ completedLevel: lvl, completedSinceLastAd: counter });
    assert.equal(res.show, false);
    assert.equal(res.reason, "below_min_level");
    counter = res.nextCounter;
  }
  assert.equal(counter, 0);

  // 4. Starting after Level 5 (levels 6, 7, 8 -> trigger on 8, reset to 0)
  const l6 = admob.shouldShowInterstitial({ completedLevel: 6, completedSinceLastAd: counter });
  assert.equal(l6.show, false);
  assert.equal(l6.nextCounter, 1);

  const l7 = admob.shouldShowInterstitial({ completedLevel: 7, completedSinceLastAd: l6.nextCounter });
  assert.equal(l7.show, false);
  assert.equal(l7.nextCounter, 2);

  const l8 = admob.shouldShowInterstitial({ completedLevel: 8, completedSinceLastAd: l7.nextCounter });
  assert.equal(l8.show, true);
  assert.equal(l8.reason, "interval_reached");
  assert.equal(l8.nextCounter, 0);

  // 5. VIP / No-Ads and Offline immediately skip interstitials
  const vipSkip = admob.shouldShowInterstitial({ completedLevel: 10, completedSinceLastAd: 2, hasNoAds: true });
  assert.equal(vipSkip.show, false);
  assert.equal(vipSkip.reason, "vip_no_ads");

  const offlineSkip = admob.shouldShowInterstitial({ completedLevel: 10, completedSinceLastAd: 2, isOnline: false });
  assert.equal(offlineSkip.show, false);
  assert.equal(offlineSkip.reason, "offline");
});

test("Capacitor AndroidManifest.xml and package.json are properly configured for @capacitor-community/admob", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
  assert.ok(pkg.dependencies && pkg.dependencies["@capacitor-community/admob"], "Missing @capacitor-community/admob in package.json");

  const manifestPath = path.join(__dirname, "android/app/src/main/AndroidManifest.xml");
  assert.ok(fs.existsSync(manifestPath), "Missing android/app/src/main/AndroidManifest.xml");
  const manifest = fs.readFileSync(manifestPath, "utf8");
  assert.ok(manifest.includes('android:name="com.google.android.gms.ads.APPLICATION_ID"'));
  assert.ok(manifest.includes('android:value="ca-app-pub-7895931535988996~2281008271"'));
});

test("all 4 Royal UI frame PNGs exist on disk and milestone achievements (obstacles, rockets, 3-star streaks) evaluate accurately", () => {
  assert.ok(core.ROYAL_MODAL_FRAMES, "ROYAL_MODAL_FRAMES must be exported");
  const expectedKeys = ["mail", "achievements", "calendar", "champions"];
  for (const key of expectedKeys) {
    const rel = core.ROYAL_MODAL_FRAMES[key];
    assert.ok(rel && rel.endsWith(".png"), `Missing PNG path for royal frame ${key}`);
    assert.ok(fs.existsSync(path.join(__dirname, rel)), `Royal frame PNG not found on disk: ${rel}`);
  }

  const evaluated = core.evaluateAchievements(
    {
      highestUnlocked: 105,
      stars: 260,
      obstaclesBroken: 120,
      rocketsCreated: 30,
      stageStars: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2 },
      profileCustomized: true,
    },
    {}
  );

  const obs = evaluated.find((a) => a.id === "obstacles_100");
  assert.ok(obs, "obstacles_100 achievement must exist");
  assert.equal(obs.unlocked, true);
  assert.equal(obs.current, 100);
  assert.equal(obs.percent, 100);

  const rkt = evaluated.find((a) => a.id === "rockets_25");
  assert.ok(rkt, "rockets_25 achievement must exist");
  assert.equal(rkt.unlocked, true);
  assert.equal(rkt.current, 25);

  const streak = evaluated.find((a) => a.id === "three_star_streak_5");
  assert.ok(streak, "three_star_streak_5 achievement must exist");
  assert.equal(streak.unlocked, true);
  assert.equal(streak.current, 5);
});





