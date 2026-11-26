/* Candy Magic Royale — Phase 3 Event 4: بطولة النيل (Nile League Weekly Tournament)
 * Isolated module listening to CMREventBus ("stage:win").
 * Uses 04_Nile_League/event_ui_nile_league.png and 4 league shields (Bronze -> Silver -> Gold -> Pharaoh).
 * Features left 4-tier league shield ladder with gleaming metallic sheen sweep across active shield,
 * top-3 ranked podium slots with crown scores & pulsing golden aura on 1st/2nd/3rd prize chests,
 * and animated rank-up slide when earning crowns on stage:win.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root, require("./event-bus"));
  } else {
    root.CMRNileLeague = factory(root, {
      EventBus: root.CMREventBus,
      EventFX: root.CMREventFX,
      EVENT_ASSETS: root.CMR_EVENT_ASSETS,
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root, busPkg) {
  "use strict";

  const STORAGE_KEY = "cmr_event_nile_league_v1";
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const ASSETS = busPkg?.EVENT_ASSETS || {
    nileLeagueFrame: "./public/assets/aistudio/event_ui_nile_league_d8e34672.png",
    league1Bronze: "./public/assets/aistudio/league_1_bronze_23744630.png",
    league2Silver: "./public/assets/aistudio/league_2_silver_f992fb4b.png",
    league3Gold: "./public/assets/aistudio/league_3_gold_0a8f5155.png",
    league4Pharaoh: "./public/assets/aistudio/league_4_pharaoh_4f175723.png",
    chestOpenIcon: "./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png",
    coinIcon: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png",
  };

  const LEAGUES = Object.freeze([
    { id: "bronze", tier: 1, nameAr: "البرونزي", minCrowns: 0, shield: ASSETS.league1Bronze },
    { id: "silver", tier: 2, nameAr: "الفضي", minCrowns: 15, shield: ASSETS.league2Silver },
    { id: "gold", tier: 3, nameAr: "الذهبي", minCrowns: 35, shield: ASSETS.league3Gold },
    { id: "pharaoh", tier: 4, nameAr: "الفراعنة", minCrowns: 65, shield: ASSETS.league4Pharaoh },
  ]);

  const PODIUM_PRIZES = Object.freeze([
    { rank: 1, labelAr: "المركز 1", coins: 2000, gems: 10 },
    { rank: 2, labelAr: "المركز 2", coins: 1200, gems: 5 },
    { rank: 3, labelAr: "المركز 3", coins: 700, gems: 3 },
  ]);

  const DEFAULT_RIVALS = Object.freeze([
    { id: "nl_1", name: "الفرعون سليم", crowns: 42, avatar: "👑" },
    { id: "nl_2", name: "إيزيس الملكية", crowns: 29, avatar: "💎" },
    { id: "nl_3", name: "حورس البطل", crowns: 18, avatar: "🦅" },
    { id: "nl_4", name: "نور الصحراء", crowns: 11, avatar: "⭐" },
    { id: "nl_5", name: "طارق الأقصر", crowns: 6, avatar: "🔥" },
  ]);

  // =========================================================================
  // PURE LOGIC ENGINE (Unit-Tested)
  // =========================================================================
  function createNileLeagueEngine(initial = {}, nowFn = () => Date.now()) {
    const now = nowFn();
    const initialEndsAt = Number(initial.endsAt);
    let state = {
      playerCrowns: Math.max(0, Math.floor(Number(initial.playerCrowns ?? 12))),
      claimedPromotionTiers: Array.isArray(initial.claimedPromotionTiers)
        ? initial.claimedPromotionTiers.map(Number).filter(Number.isFinite)
        : [1],
      endsAt: Number.isFinite(initialEndsAt) && initialEndsAt > now ? initialEndsAt : now + WEEK_MS,
      rivals:
        Array.isArray(initial.rivals) && initial.rivals.length > 0
          ? initial.rivals.map((r) => ({ ...r }))
          : DEFAULT_RIVALS.map((r) => ({ ...r })),
    };

    function getLeagueForCrowns(crowns) {
      let current = LEAGUES[0];
      for (const lg of LEAGUES) {
        if (crowns >= lg.minCrowns) current = lg;
      }
      return current;
    }

    function buildLeaderboard(playerName = "أنت") {
      const all = [
        ...state.rivals.map((r) => ({ ...r, isPlayer: false })),
        { id: "player", name: playerName, crowns: state.playerCrowns, avatar: "🏆", isPlayer: true },
      ];
      all.sort((a, b) => {
        if (b.crowns !== a.crowns) return b.crowns - a.crowns;
        return a.isPlayer ? -1 : 1;
      });
      return all.map((entry, i) => ({ ...entry, rank: i + 1 }));
    }

    function getState(playerName = "أنت") {
      const league = getLeagueForCrowns(state.playerCrowns);
      const leaderboard = buildLeaderboard(playerName);
      const playerEntry = leaderboard.find((e) => e.isPlayer);
      const playerRank = playerEntry ? playerEntry.rank : leaderboard.length;
      const nextLeague = LEAGUES.find((l) => l.tier === league.tier + 1) || null;
      const claimablePromotion =
        league.tier > 1 && !state.claimedPromotionTiers.includes(league.tier) ? league : null;

      return {
        playerCrowns: state.playerCrowns,
        playerRank,
        activeLeague: league,
        nextLeague,
        leagues: LEAGUES.map((l) => ({
          ...l,
          isActive: l.tier === league.tier,
          unlocked: state.playerCrowns >= l.minCrowns,
        })),
        podium: leaderboard.slice(0, 3),
        leaderboard,
        claimablePromotion,
        remainingMs: Math.max(0, state.endsAt - nowFn()),
        endsAt: state.endsAt,
      };
    }

    function recordWin(crownsEarned = 3) {
      const prevRank = getState().playerRank;
      const prevTier = getLeagueForCrowns(state.playerCrowns).tier;
      const inc = Math.max(1, Math.floor(Number(crownsEarned) || 3));
      state.playerCrowns += inc;
      const nextState = getState();
      return {
        earnedCrowns: inc,
        prevRank,
        newRank: nextState.playerRank,
        rankedUp: nextState.playerRank < prevRank,
        promotedLeague: nextState.activeLeague.tier > prevTier,
        state: nextState,
      };
    }

    function claimPromotionBonus() {
      const st = getState();
      if (!st.claimablePromotion) {
        return { ok: false, reason: "no_promotion_bonus", reward: null, state: st };
      }
      const tier = st.claimablePromotion.tier;
      state.claimedPromotionTiers.push(tier);
      const coins = tier * 350;
      const gems = tier * 2;
      return {
        ok: true,
        tier,
        leagueNameAr: st.claimablePromotion.nameAr,
        reward: { coins, gems },
        state: getState(),
      };
    }

    function exportState() {
      return {
        playerCrowns: state.playerCrowns,
        claimedPromotionTiers: [...state.claimedPromotionTiers],
        endsAt: state.endsAt,
        rivals: state.rivals.map((r) => ({ ...r })),
      };
    }

    return { getState, recordWin, claimPromotionBonus, exportState };
  }

  // =========================================================================
  // PERSISTENCE & BROWSER UI INTEGRATION
  // =========================================================================
  const hasDOM = typeof document !== "undefined" && typeof window !== "undefined";

  function loadPersisted() {
    if (!hasDOM) return {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function savePersisted(data) {
    if (!hasDOM) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  const engine = createNileLeagueEngine(loadPersisted());
  const bus = busPkg?.EventBus;
  const fx = busPkg?.EventFX;

  let modalEl = null;
  let pendingRankUpAnim = false;

  function notifyBadgeUpdate() {
    bus?.emit?.("events:badge-update", { source: "nile-league" });
  }

  function getPlayerName() {
    return window.CMRProfile?.getProfileState?.()?.displayName || "أنت";
  }

  function ensureModal() {
    if (!hasDOM) return null;
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.id = "nileLeagueModal";
    modalEl.className = "modal ev-modal hidden";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "nileLeagueTitle");

    modalEl.innerHTML = `
      <div class="ev-stage ev-stage-nile-league" dir="rtl">
        <img class="ev-frame-img" src="${ASSETS.nileLeagueFrame}" alt="" aria-hidden="true" draggable="false">
        <h2 class="ev-ribbon-title ev-title-nile-league" id="nileLeagueTitle">بطولة النيل</h2>
        <button type="button" class="ev-close-orb ev-close-nile-league" id="nileLeagueCloseBtn" aria-label="إغلاق بطولة النيل">
          <span aria-hidden="true">✕</span>
        </button>

        <div class="ev-inner-safe ev-safe-nile-league">
          <!-- Top Active League Summary + Promotion Bonus Claim -->
          <div class="ev-nl-summary-bar">
            <div class="ev-nl-summary-copy">
              <strong id="nlActiveLeagueName">الدوري البرونزي</strong>
              <small id="nlNextHint">اربح مراحل لجمع التيجان والصعود في الترتيب!</small>
            </div>
            <span class="ev-nl-crowns-pill" dir="ltr">👑 <b id="nlPlayerCrownsVal">12</b></span>
          </div>

          <button type="button" class="ev-nl-promo-btn hidden" id="nlClaimPromoBtn">
            <img src="${ASSETS.coinIcon}" alt="">
            <span id="nlPromoLabel">استلم مكافأة الترقية!</span>
          </button>

          <!-- Main Two-Column Body: Right/Main Podium + Rankings | Left 4-Shield League Ladder -->
          <div class="ev-nl-body-grid">
            <!-- Top-3 Ranked Podium & Full Leaderboard -->
            <div class="ev-nl-main-col">
              <div class="ev-nl-podium" id="nlPodiumRow" aria-label="منصة الأوائل"></div>
              <div class="ev-nl-board" id="nlLeaderboard" role="list" aria-label="ترتيب بطولة النيل"></div>
            </div>

            <!-- Left 4-Shield League Ladder (Pharaoh -> Gold -> Silver -> Bronze) -->
            <aside class="ev-nl-ladder" id="nlLeagueLadder" aria-label="سلّم الدوريات"></aside>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) close();
    });
    modalEl.querySelector("#nileLeagueCloseBtn").addEventListener("click", close);

    modalEl.querySelector("#nlClaimPromoBtn").addEventListener("click", () => {
      const btn = modalEl.querySelector("#nlClaimPromoBtn");
      const res = engine.claimPromotionBonus();
      if (!res.ok) return;
      savePersisted(engine.exportState());
      window.CMRProfile?.vibrate?.([22, 26, 26]);
      window.CMRAudio?.playSfx?.("win");
      fx?.spawnSparkleBurst?.(btn, { count: 22 });
      fx?.launchCoinBurst?.(btn, { count: 18, iconSrc: ASSETS.coinIcon, targetKind: "coins" });
      fx?.grantReward?.(res.reward);
      fx?.showToast?.(`🏆 مكافأة الصعود إلى الدوري ${res.leagueNameAr}: +${res.reward.coins} عملة و+${res.reward.gems} جواهر!`);
      render();
      notifyBadgeUpdate();
    });

    return modalEl;
  }

  function triggerRankUpSlide() {
    if (!modalEl) return;
    const playerRow = modalEl.querySelector(".ev-nl-row.is-player");
    if (!playerRow) return;
    playerRow.classList.remove("is-rank-up-slide");
    void playerRow.offsetWidth;
    playerRow.classList.add("is-rank-up-slide");
    fx?.spawnSparkleBurst?.(playerRow, { count: 14 });
    clearTimeout(playerRow.__slideTimer);
    playerRow.__slideTimer = setTimeout(() => playerRow.classList.remove("is-rank-up-slide"), 760);
  }

  function render() {
    if (!modalEl) return;
    const st = engine.getState(getPlayerName());

    const activeNameEl = modalEl.querySelector("#nlActiveLeagueName");
    const nextHintEl = modalEl.querySelector("#nlNextHint");
    const crownsEl = modalEl.querySelector("#nlPlayerCrownsVal");
    const promoBtn = modalEl.querySelector("#nlClaimPromoBtn");
    const promoLbl = modalEl.querySelector("#nlPromoLabel");
    const ladderEl = modalEl.querySelector("#nlLeagueLadder");
    const podiumEl = modalEl.querySelector("#nlPodiumRow");
    const boardEl = modalEl.querySelector("#nlLeaderboard");

    if (activeNameEl) activeNameEl.textContent = `الدوري ${st.activeLeague.nameAr}`;
    if (nextHintEl) {
      nextHintEl.textContent = st.nextLeague
        ? `متبقي ${Math.max(0, st.nextLeague.minCrowns - st.playerCrowns)} تاجاً للترقية إلى ${st.nextLeague.nameAr}`
        : "👑 وصلت إلى قمة دوري الفراعنة الأسطوري!";
    }
    if (crownsEl) crownsEl.textContent = String(st.playerCrowns);

    if (promoBtn && promoLbl) {
      if (st.claimablePromotion) {
        promoBtn.classList.remove("hidden");
        promoLbl.textContent = `استلم مكافأة الدوري ${st.claimablePromotion.nameAr} (+${st.claimablePromotion.tier * 350} عملة)`;
      } else {
        promoBtn.classList.add("hidden");
      }
    }

    // Left ladder: Pharaoh (top) down to Bronze (bottom) with metallic sheen sweep on active shield
    if (ladderEl) {
      ladderEl.innerHTML = "";
      const descending = [...st.leagues].reverse();
      descending.forEach((lg) => {
        const item = document.createElement("div");
        item.className = `ev-nl-shield-item ${lg.isActive ? "is-active-shield" : ""} ${lg.unlocked ? "is-unlocked" : "is-locked"}`;
        item.dataset.leagueTier = String(lg.tier);
        item.innerHTML = `
          <div class="ev-nl-shield-wrap">
            <img src="${lg.shield}" alt="${lg.nameAr}" draggable="false">
            ${lg.isActive ? `<span class="ev-nl-metallic-sheen" aria-hidden="true"></span>` : ""}
          </div>
          <span>${lg.nameAr}</span>
        `;
        ladderEl.appendChild(item);
      });
    }

    // Top-3 Podium slots with pulsing golden aura around 1st/2nd/3rd prize chests
    if (podiumEl) {
      podiumEl.innerHTML = "";
      // Visual podium order: 2nd, 1st (tallest center), 3rd
      const visualOrder = [1, 0, 2];
      visualOrder.forEach((idx) => {
        const entry = st.podium[idx];
        const prize = PODIUM_PRIZES[idx];
        if (!entry) return;
        const card = document.createElement("div");
        card.className = `ev-nl-podium-slot is-rank-${entry.rank} ${entry.isPlayer ? "is-player" : ""}`;
        card.innerHTML = `
          <span class="ev-nl-rank-medal">${entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</span>
          <div class="ev-nl-chest-halo">
            <img src="${ASSETS.chestOpenIcon}" alt="" draggable="false">
          </div>
          <strong class="ev-nl-pod-name">${entry.name}</strong>
          <span class="ev-nl-pod-crowns" dir="ltr">👑 ${entry.crowns}</span>
          <small class="ev-nl-pod-prize" dir="ltr">+${prize.coins.toLocaleString("en-US")}</small>
        `;
        podiumEl.appendChild(card);
      });
    }

    // Compact Ranked Leaderboard
    if (boardEl) {
      boardEl.innerHTML = "";
      st.leaderboard.forEach((entry) => {
        const row = document.createElement("div");
        row.className = `ev-nl-row ${entry.isPlayer ? "is-player" : ""}`;
        row.setAttribute("role", "listitem");
        row.dataset.rank = String(entry.rank);
        row.innerHTML = `
          <span class="ev-nl-row-rank" dir="ltr">#${entry.rank}</span>
          <span class="ev-nl-row-av" aria-hidden="true">${entry.avatar}</span>
          <strong class="ev-nl-row-name">${entry.name}</strong>
          <span class="ev-nl-row-crowns" dir="ltr">👑 ${entry.crowns}</span>
        `;
        boardEl.appendChild(row);
      });
    }
  }

  function open() {
    ensureModal();
    render();
    fx?.openElasticModal?.(modalEl);
    if (pendingRankUpAnim) {
      pendingRankUpAnim = false;
      setTimeout(() => triggerRankUpSlide(), 280);
    }
  }

  function close() {
    fx?.closeElasticModal?.(modalEl);
  }

  if (bus && typeof bus.on === "function") {
    bus.on("stage:win", (payload) => {
      const stars = Number(payload?.stars) || 3;
      const res = engine.recordWin(Math.max(2, stars));
      savePersisted(engine.exportState());
      if (modalEl && !modalEl.classList.contains("hidden")) {
        render();
        if (res.rankedUp) triggerRankUpSlide();
      } else if (res.rankedUp || res.promotedLeague) {
        pendingRankUpAnim = true;
      }
      notifyBadgeUpdate();
    });
  }

  return {
    LEAGUES,
    PODIUM_PRIZES,
    createNileLeagueEngine,
    getState: () => engine.getState(getPlayerName()),
    hasNotification: () => Boolean(engine.getState(getPlayerName()).claimablePromotion),
    triggerRankUpSlide,
    open,
    close,
    render,
  };
});
