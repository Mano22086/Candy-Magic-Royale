const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { EVENT_ASSETS } = require("./js/events/event-bus");
const LavaQuest = require("./js/events/lava-quest");
const CardAlbum = require("./js/systems/card-album");
const Teams = require("./js/social/teams");
const NileLeague = require("./js/events/nile-league");
const CoopSphinx = require("./js/events/coop-sphinx");

const PHASE23_ASSET_KEYS = [
  "lavaQuestFrame",
  "cardAlbumFrame",
  "cardPackPharaoh",
  "card01Scarab",
  "card02Pyramid",
  "card03Lotus",
  "card04Dragon",
  "card05Crown",
  "card06HorusEye",
  "card07Ankh",
  "card08Bastet",
  "card09Sphinx",
  "teamsFrame",
  "teamScarabShield",
  "royalHeart3d",
  "nileLeagueFrame",
  "league1Bronze",
  "league2Silver",
  "league3Gold",
  "league4Pharaoh",
  "coopSphinxFrame",
  "goldenCandySphinx",
];

test("All 22 Phase 2 & 3 transparent event/social assets exist on disk", () => {
  assert.equal(PHASE23_ASSET_KEYS.length, 22);
  for (const key of PHASE23_ASSET_KEYS) {
    const relPath = EVENT_ASSETS[key];
    assert.ok(relPath, `Missing EVENT_ASSETS.${key}`);
    const absPath = path.resolve(__dirname, relPath);
    assert.ok(fs.existsSync(absPath), `Asset file missing on disk: ${relPath}`);
  }
});

test("Lava Quest: 7-step survival curve, +5 moves revive protection, loss reset, and +10,000 jackpot", () => {
  const engine = LavaQuest.createLavaQuestEngine();
  assert.equal(engine.getState().step, 0);
  assert.equal(engine.getState().remainingPlayers, 100);

  // Advance 2 consecutive wins -> survivors shrink dynamically
  const w1 = engine.recordWin();
  assert.equal(w1.advanced, true);
  assert.equal(w1.state.step, 1);
  assert.equal(w1.state.remainingPlayers, 68);

  const w2 = engine.recordWin();
  assert.equal(w2.state.step, 2);
  assert.equal(w2.state.remainingPlayers, 46);

  // Revive with +5 extra moves protects streak on loss
  engine.protectWithExtraMoves();
  const protectedLoss = engine.recordLoss();
  assert.equal(protectedLoss.reset, false);
  assert.equal(protectedLoss.protectedByMoves, true);
  assert.equal(engine.getState().step, 2);

  // Unprotected loss resets to step 0 / 100 players
  const hardLoss = engine.recordLoss({ usedExtraMoves: false });
  assert.equal(hardLoss.reset, true);
  assert.equal(hardLoss.hadProgress, true);
  assert.equal(engine.getState().step, 0);
  assert.equal(engine.getState().remainingPlayers, 100);

  // Reach step 7 and claim +10,000 coins jackpot
  for (let i = 0; i < 7; i++) engine.recordWin();
  const summit = engine.getState();
  assert.equal(summit.step, 7);
  assert.equal(summit.remainingPlayers, 5);
  assert.equal(summit.canClaim, true);

  const claim = engine.claimJackpot();
  assert.equal(claim.ok, true);
  assert.equal(claim.payout, 10000);
  assert.equal(engine.claimJackpot().ok, false);
});

test("Card Album: 2 starter packs, +1 pack every 5 wins, 3-card pack draw, and 9/9 grand reward", () => {
  const engine = CardAlbum.createCardAlbumEngine({}, () => 0);
  assert.equal(engine.getState().packs, 2);
  assert.equal(engine.getState().totalCards, 9);

  // 5 wins award 1 free pack
  for (let i = 0; i < 4; i++) {
    assert.equal(engine.recordStageWin().earnedPack, false);
  }
  assert.equal(engine.recordStageWin().earnedPack, true);
  assert.equal(engine.getState().packs, 3);

  // Opening 3 deterministic packs yields all 9 unique cards
  const p1 = engine.openPack();
  assert.equal(p1.ok, true);
  assert.equal(p1.drawn.length, 3);
  assert.equal(engine.getState().unlockedCount, 3);

  engine.openPack();
  const p3 = engine.openPack();
  assert.equal(p3.ok, true);
  assert.equal(engine.getState().unlockedCount, 9);
  assert.equal(engine.getState().canClaimGrand, true);

  const grand = engine.claimGrandReward();
  assert.equal(grand.ok, true);
  assert.equal(grand.reward.coins, 3500);
  assert.equal(grand.reward.gems, 15);
  assert.equal(engine.claimGrandReward().ok, false);
});

test("Teams: send heart grants +10 coins, request hearts cooldown, weekly chest claim, Firestore merge", () => {
  let fakeNow = 1_000_000;
  const engine = Teams.createTeamsEngine({ chestPoints: 20 }, () => fakeNow);

  const s1 = engine.sendHeart("m_cleopatra");
  assert.equal(s1.ok, true);
  assert.equal(s1.bonusCoins, 10);
  assert.equal(engine.getState().chestPoints, 22);
  assert.equal(engine.sendHeart("m_cleopatra").ok, false);

  const req1 = engine.requestHearts();
  assert.equal(req1.ok, true);
  assert.equal(req1.grantedHearts, 1);
  assert.equal(engine.requestHearts().ok, false);

  // After 31 minutes cooldown expires
  fakeNow += 31 * 60 * 1000;
  assert.equal(engine.getState().canRequestHearts, true);

  // Reach 25 chest points and claim weekly Team Chest
  engine.sendHeart("m_ramesses");
  assert.equal(engine.getState().canClaimChest, true);
  const chest = engine.claimTeamChest();
  assert.equal(chest.ok, true);
  assert.equal(chest.reward.coins, 1000);

  // Remote Firestore merge takes max chest points and updates team name
  const merged = engine.mergeRemoteState({ teamName: "أبطال الفراعنة", chestPoints: 40 });
  assert.equal(merged.teamName, "أبطال الفراعنة");
  assert.equal(merged.chestPoints, 40);
});

test("Nile League: 4 tiers, crown gains, rank-up detection, and promotion bonus claim", () => {
  const engine = NileLeague.createNileLeagueEngine({ playerCrowns: 12 });
  assert.equal(engine.getState().activeLeague.id, "bronze");
  assert.equal(engine.getState().leagues.length, 4);

  // Earn 7 crowns -> crosses 15 crowns (Silver) and climbs past rival at 18 crowns
  const win1 = engine.recordWin(7);
  assert.equal(win1.state.playerCrowns, 19);
  assert.equal(win1.promotedLeague, true);
  assert.equal(win1.rankedUp, true);
  assert.equal(win1.state.activeLeague.id, "silver");
  assert.ok(win1.state.claimablePromotion);

  const promo = engine.claimPromotionBonus();
  assert.equal(promo.ok, true);
  assert.equal(promo.reward.coins, 700);
  assert.equal(engine.claimPromotionBonus().ok, false);

  // Climb to Pharaoh tier (65+ crowns)
  engine.recordWin(50);
  assert.equal(engine.getState().activeLeague.id, "pharaoh");
});

test("Co-op Golden Candy Sphinx: partner invite boost, token illumination, and 4 milestone claims", () => {
  const engine = CoopSphinx.createCoopSphinxEngine({
    playerPoints: 180,
    partnerPoints: 120,
    tokens: 2,
  });
  assert.equal(engine.getState().totalPoints, 300);
  assert.equal(engine.getState().percent, 15);
  assert.equal(engine.getState().milestones[0].canClaim, true);

  // Claim milestone 1 (300 pts)
  const m1 = engine.claimMilestone(1);
  assert.equal(m1.ok, true);
  assert.equal(m1.reward.coins, 300);

  // Invite partner -> adds +160 pts
  const inv = engine.invitePartner("الأميرة كليوباترا");
  assert.equal(inv.ok, true);
  assert.equal(inv.joinedNow, true);
  assert.equal(inv.state.totalPoints, 460);

  // Spend 2 tokens (+300 pts -> 760 pts -> unlocks milestone 2 at 750)
  const t1 = engine.spendToken();
  assert.equal(t1.ok, true);
  const t2 = engine.spendToken();
  assert.equal(t2.ok, true);
  assert.equal(t2.unlockedMilestone, true);
  assert.equal(engine.getState().milestones[1].canClaim, true);

  // No tokens left
  assert.equal(engine.spendToken().ok, false);
});
