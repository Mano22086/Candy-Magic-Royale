const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const busMod = require("./js/events/event-bus");
const royalVault = require("./js/events/royal-vault");
const rocketRush = require("./js/events/rocket-rush");
const secretVault = require("./js/events/secret-vault");

test("all 6 Phase 1 Event assets and reused transparent assets exist on disk", () => {
  for (const [key, relPath] of Object.entries(busMod.EVENT_ASSETS)) {
    const abs = path.join(__dirname, relPath);
    assert.ok(fs.existsSync(abs), `Missing Phase 1 event asset ${key}: ${relPath}`);
  }
});

test("EventBus supports on, once, off, emit for stage:win, stage:fail, rocket:used with error isolation", () => {
  const bus = busMod.createEventBus();
  const seen = [];

  const offWin = bus.on("stage:win", (p) => seen.push(`win:${p.level}`));
  bus.on("stage:win", () => {
    throw new Error("boom");
  });
  bus.once("rocket:used", (p) => seen.push(`rocket:${p.source}`));
  bus.on("stage:fail", (p) => seen.push(`fail:${p.level}`));

  bus.emit("stage:win", { level: 3 });
  bus.emit("rocket:used", { source: "booster" });
  bus.emit("rocket:used", { source: "striped" }); // once already fired
  bus.emit("stage:fail", { level: 4 });
  offWin();
  bus.emit("stage:win", { level: 5 });

  assert.deepEqual(seen, ["win:3", "rocket:booster", "fail:4"]);
});

test("Event 1 (خزنة الملك / Royal Vault): +150/win up to 3000, unlocks at >=1500, opens and resets cleanly", () => {
  const vault = royalVault.createRoyalVaultEngine({ storedCoins: 0 });
  assert.equal(vault.getState().canOpen, false);
  assert.equal(vault.openVault().ok, false);

  // 9 wins -> 1350 (still locked)
  for (let i = 0; i < 9; i++) vault.addWinCoins();
  assert.equal(vault.getState().storedCoins, 1350);
  assert.equal(vault.getState().canOpen, false);

  // 10th win -> 1500 (unlocked!)
  vault.addWinCoins();
  assert.equal(vault.getState().storedCoins, 1500);
  assert.equal(vault.getState().canOpen, true);

  // Overflow cap at 3000
  for (let i = 0; i < 15; i++) vault.addWinCoins();
  assert.equal(vault.getState().storedCoins, 3000);
  assert.equal(vault.getState().isFull, true);

  // Open vault grants 3000 and resets to 0
  const openRes = vault.openVault();
  assert.equal(openRes.ok, true);
  assert.equal(openRes.payout, 3000);
  assert.equal(vault.getState().storedCoins, 0);
  assert.equal(vault.getState().canOpen, false);
  assert.equal(vault.getState().totalClaimed, 3000);
});

test("Event 2 (عاصفة الصواريخ / Rocket Rush): 5 exact tiers (5,15,30,50,80), 48h countdown, single-claim enforcement", () => {
  assert.deepEqual(
    rocketRush.MILESTONES.map((m) => m.target),
    [5, 15, 30, 50, 80]
  );

  let fakeNow = 1_700_000_000_000;
  const rr = rocketRush.createRocketRushEngine({}, () => fakeNow);

  assert.equal(rr.getState().claimableCount, 0);
  assert.equal(rocketRush.formatCountdown(rr.getState().remainingMs), "48:00:00");
  assert.equal(rr.claimTier(1).ok, false);

  // Record 15 rockets -> Tiers 1 (5) and 2 (15) claimable
  rr.recordRocket(15);
  assert.equal(rr.getState().claimableCount, 2);

  const c1 = rr.claimTier(1);
  assert.equal(c1.ok, true);
  assert.equal(c1.reward.coins, 200);
  assert.equal(rr.claimTier(1).ok, false); // cannot claim twice

  const c2 = rr.claimTier(2);
  assert.equal(c2.ok, true);
  assert.equal(c2.reward.paints, 2);
  assert.equal(rr.getState().claimableCount, 0);

  // Reach Tier 5 (80)
  rr.recordRocket(65);
  assert.equal(rr.getState().rocketsUsed, 80);
  const c5 = rr.claimTier(5);
  assert.equal(c5.ok, true);
  assert.equal(c5.reward.coins, 1500);
  assert.equal(c5.reward.gems, 10);

  // After 48h expires, cycle resets cleanly
  fakeNow += rocketRush.DURATION_MS + 1000;
  assert.equal(rr.getState().rocketsUsed, 0);
  assert.equal(rr.getState().claimableCount, 0);
});

test("Event 3 (غرفة الكنز / Secret Vault 3x3): starts with 3 keys, +1 key every 3 wins, opens 9 chests & resets round", () => {
  const sv = secretVault.createSecretVaultEngine({}, () => 0.42);
  assert.equal(sv.getState().keys, 3);
  assert.equal(sv.getState().chests.length, 9);

  // Open 3 chests with starting keys
  assert.equal(sv.openChest(0).ok, true);
  assert.equal(sv.openChest(1).ok, true);
  assert.equal(sv.openChest(2).ok, true);
  assert.equal(sv.getState().keys, 0);

  // Refuses opening when 0 keys
  assert.equal(sv.openChest(3).ok, false);
  assert.equal(sv.openChest(3).reason, "no_keys");

  // 3 stage wins earn +1 golden key
  assert.equal(sv.recordStageWin().earnedKey, false);
  assert.equal(sv.recordStageWin().earnedKey, false);
  assert.equal(sv.recordStageWin().earnedKey, true);
  assert.equal(sv.getState().keys, 1);

  // Add remaining keys and finish all 9 chests
  sv.addKeys(5);
  for (let i = 3; i < 9; i++) {
    assert.equal(sv.openChest(i).ok, true);
  }
  assert.equal(sv.getState().allOpened, true);
  assert.equal(sv.getState().openedCount, 9);

  // Reset round refreshes all 9 chests
  const reset = sv.resetRound();
  assert.equal(reset.ok, true);
  assert.equal(reset.state.roundNumber, 2);
  assert.equal(reset.state.openedCount, 0);
  assert.equal(reset.state.allOpened, false);
});
