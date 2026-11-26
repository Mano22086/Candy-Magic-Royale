/* Candy Magic Royale — Phase 2 Event 1: تحدي البركان (Lava Quest — 100-Player Survival)
 * Isolated module listening to CMREventBus ("stage:win", "stage:fail", "stage:revive").
 * Uses 01_Lava_Quest/event_ui_lava_quest.png with 7-step golden lava bridge,
 * live remaining-players counter (100 shrinking dynamically per step), glowing top treasure chest
 * (+10,000 coins jackpot), cute player avatar tokens on the bridge, rising glowing ember particles,
 * smooth parabolic hop animation on win, and dramatic flame-flash reset on unrevived loss.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root, require("./event-bus"));
  } else {
    root.CMRLavaQuest = factory(root, {
      EventBus: root.CMREventBus,
      EventFX: root.CMREventFX,
      EVENT_ASSETS: root.CMR_EVENT_ASSETS,
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root, busPkg) {
  "use strict";

  const STORAGE_KEY = "cmr_event_lava_quest_v1";
  const CONFIG = Object.freeze({
    TOTAL_STEPS: 7,
    INITIAL_PLAYERS: 100,
    JACKPOT_COINS: 10000,
    // Dynamic survival curve for steps 0..7 (100 -> 68 -> 46 -> 31 -> 20 -> 13 -> 8 -> 5)
    SURVIVOR_CURVE: Object.freeze([100, 68, 46, 31, 20, 13, 8, 5]),
  });

  const ASSETS = busPkg?.EVENT_ASSETS || {
    lavaQuestFrame: "./public/assets/aistudio/event_ui_lava_quest_f8f87d4d.png",
    chestOpenIcon: "./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png",
    coinIcon: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png",
  };

  // Exact % coordinates along the drawn 7-step golden lava bridge inside the safe stage
  const BRIDGE_STEPS = Object.freeze([
    { step: 0, x: 35, y: 84, labelAr: "البداية" },
    { step: 1, x: 42, y: 76, labelAr: "الخطوة 1" },
    { step: 2, x: 47, y: 68, labelAr: "الخطوة 2" },
    { step: 3, x: 51, y: 60, labelAr: "الخطوة 3" },
    { step: 4, x: 55, y: 52, labelAr: "الخطوة 4" },
    { step: 5, x: 59, y: 45, labelAr: "الخطوة 5" },
    { step: 6, x: 62, y: 39, labelAr: "الخطوة 6" },
    { step: 7, x: 64, y: 33, labelAr: "القمة ★" },
  ]);

  const RIVAL_AVATARS = Object.freeze([
    { id: "r1", icon: "👑", color: "#38bdf8" },
    { id: "r2", icon: "🐱", color: "#a855f7" },
    { id: "r3", icon: "💎", color: "#ec4899" },
    { id: "r4", icon: "🔥", color: "#f97316" },
    { id: "r5", icon: "⭐", color: "#22c55e" },
  ]);

  // =========================================================================
  // PURE LOGIC ENGINE (Unit-Tested)
  // =========================================================================
  function createLavaQuestEngine(initial = {}) {
    let state = {
      step: clampStep(initial.step ?? 0),
      remainingPlayers: Math.max(
        1,
        Math.min(
          CONFIG.INITIAL_PLAYERS,
          Math.floor(Number(initial.remainingPlayers ?? CONFIG.INITIAL_PLAYERS))
        )
      ),
      jackpotClaimed: Boolean(initial.jackpotClaimed),
      victoriesCount: Math.max(0, Math.floor(Number(initial.victoriesCount) || 0)),
      reviveProtected: false,
      lastResetAt: Number(initial.lastResetAt) || 0,
    };

    function clampStep(v) {
      return Math.max(0, Math.min(CONFIG.TOTAL_STEPS, Math.floor(Number(v) || 0)));
    }

    function computeSurvivors(step) {
      return CONFIG.SURVIVOR_CURVE[clampStep(step)] || CONFIG.INITIAL_PLAYERS;
    }

    function getState() {
      const canClaim = state.step >= CONFIG.TOTAL_STEPS && !state.jackpotClaimed;
      const shareCoins = Math.round(CONFIG.JACKPOT_COINS / Math.max(1, state.remainingPlayers));
      return {
        step: state.step,
        totalSteps: CONFIG.TOTAL_STEPS,
        remainingPlayers: state.remainingPlayers,
        initialPlayers: CONFIG.INITIAL_PLAYERS,
        jackpotCoins: CONFIG.JACKPOT_COINS,
        estimatedShare: shareCoins,
        jackpotClaimed: state.jackpotClaimed,
        canClaim,
        victoriesCount: state.victoriesCount,
        reviveProtected: state.reviveProtected,
        lastResetAt: state.lastResetAt,
      };
    }

    function recordWin() {
      state.reviveProtected = false;
      if (state.step >= CONFIG.TOTAL_STEPS) {
        return { advanced: false, prevStep: state.step, state: getState() };
      }
      const prevStep = state.step;
      state.step = clampStep(state.step + 1);
      state.remainingPlayers = computeSurvivors(state.step);
      state.jackpotClaimed = false;
      return { advanced: true, prevStep, state: getState() };
    }

    function protectWithExtraMoves() {
      state.reviveProtected = true;
      return getState();
    }

    function recordLoss(options = {}) {
      if (options.usedExtraMoves || state.reviveProtected) {
        state.reviveProtected = false;
        return { reset: false, protectedByMoves: true, state: getState() };
      }
      const hadProgress = state.step > 0;
      const prevStep = state.step;
      state.step = 0;
      state.remainingPlayers = CONFIG.INITIAL_PLAYERS;
      state.jackpotClaimed = false;
      state.lastResetAt = Date.now();
      return { reset: true, hadProgress, prevStep, state: getState() };
    }

    function claimJackpot() {
      if (state.step < CONFIG.TOTAL_STEPS || state.jackpotClaimed) {
        return { ok: false, reason: state.jackpotClaimed ? "already_claimed" : "not_at_summit", payout: 0, state: getState() };
      }
      const payout = CONFIG.JACKPOT_COINS;
      state.jackpotClaimed = true;
      state.victoriesCount += 1;
      return { ok: true, payout, state: getState() };
    }

    function startNewRun() {
      state.step = 0;
      state.remainingPlayers = CONFIG.INITIAL_PLAYERS;
      state.jackpotClaimed = false;
      state.reviveProtected = false;
      return getState();
    }

    function exportState() {
      return {
        step: state.step,
        remainingPlayers: state.remainingPlayers,
        jackpotClaimed: state.jackpotClaimed,
        victoriesCount: state.victoriesCount,
        lastResetAt: state.lastResetAt,
      };
    }

    return {
      getState,
      recordWin,
      protectWithExtraMoves,
      recordLoss,
      claimJackpot,
      startNewRun,
      exportState,
    };
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

  const engine = createLavaQuestEngine(loadPersisted());
  const bus = busPkg?.EventBus;
  const fx = busPkg?.EventFX;

  let modalEl = null;
  let pendingHopFromStep = null;
  let pendingFlameFlash = false;

  function notifyBadgeUpdate() {
    bus?.emit?.("events:badge-update", { source: "lava-quest" });
  }

  function buildEmbersHtml() {
    const embers = [
      { x: 14, d: 0.0, s: 1.0, dur: 2.8 },
      { x: 26, d: 0.5, s: 0.75, dur: 3.2 },
      { x: 38, d: 1.1, s: 1.15, dur: 2.5 },
      { x: 52, d: 0.3, s: 0.85, dur: 3.0 },
      { x: 64, d: 1.4, s: 1.1, dur: 2.6 },
      { x: 76, d: 0.8, s: 0.9, dur: 3.3 },
      { x: 86, d: 1.7, s: 0.7, dur: 2.9 },
      { x: 20, d: 2.0, s: 0.95, dur: 2.7 },
      { x: 46, d: 1.6, s: 1.2, dur: 2.4 },
      { x: 70, d: 2.2, s: 0.8, dur: 3.1 },
    ];
    return embers
      .map(
        (e) =>
          `<span class="ev-lq-ember" style="left:${e.x}%;animation-delay:${e.d}s;animation-duration:${e.dur}s;--ember-scale:${e.s}" aria-hidden="true"></span>`
      )
      .join("");
  }

  function getPlayerAvatarSrc() {
    const st = window.CMRProfile?.getProfileState?.();
    return st?.avatar?.img || "./assets/extracted/ui/avatar_pharaoh_portrait.png";
  }

  function ensureModal() {
    if (!hasDOM) return null;
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.id = "lavaQuestModal";
    modalEl.className = "modal ev-modal hidden";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "lavaQuestTitle");

    modalEl.innerHTML = `
      <div class="ev-stage ev-stage-lava-quest" dir="rtl">
        <img class="ev-frame-img" src="${ASSETS.lavaQuestFrame}" alt="" aria-hidden="true" draggable="false">
        <h2 class="ev-ribbon-title ev-title-lava-quest" id="lavaQuestTitle">تحدي البركان</h2>
        <button type="button" class="ev-close-orb ev-close-lava-quest" id="lavaQuestCloseBtn" aria-label="إغلاق تحدي البركان">
          <span aria-hidden="true">✕</span>
        </button>

        <div class="ev-inner-safe ev-safe-lava-quest">
          <!-- Dramatic Flame-Flash Overlay on Reset -->
          <div class="ev-lq-flame-flash" id="lqFlameFlash" aria-hidden="true"></div>

          <!-- Rising Glowing Ember Particles Over Lava -->
          <div class="ev-lq-embers" aria-hidden="true">${buildEmbersHtml()}</div>

          <!-- Top Survival Stats Strip -->
          <div class="ev-lq-top-hud">
            <div class="ev-lq-survivors-pill" id="lqSurvivorsPill">
              <span class="ev-lq-pill-icon" aria-hidden="true">🔥</span>
              <span>المتبقون:</span>
              <strong id="lqRemainingVal" dir="ltr">100 / 100</strong>
            </div>
            <div class="ev-lq-step-pill" id="lqStepPill" dir="ltr">
              <strong id="lqStepVal">0 / 7</strong>
            </div>
          </div>

          <!-- Interactive 7-Step Lava Bridge Stage -->
          <div class="ev-lq-bridge-stage" id="lqBridgeStage">
            <!-- Glowing +10,000 Coins Jackpot Chest on Summit Platform -->
            <div class="ev-lq-summit-chest" id="lqSummitChest">
              <span class="ev-lq-chest-aura" aria-hidden="true"></span>
              <img src="${ASSETS.chestOpenIcon}" alt="صندوق الكنز" draggable="false">
              <span class="ev-lq-jackpot-tag" dir="ltr">
                <img src="${ASSETS.coinIcon}" alt="">
                <b>+10,000</b>
              </span>
            </div>

            <!-- 7 Step Markers & Cute Rival Avatars -->
            <div class="ev-lq-nodes-layer" id="lqNodesLayer"></div>

            <!-- Player Parabolic Hopping Avatar Token -->
            <div class="ev-lq-player-token" id="lqPlayerToken" aria-label="موقعك الحالي على الجسر">
              <img id="lqPlayerAvatarImg" src="${getPlayerAvatarSrc()}" alt="اللاعب" draggable="false">
              <span class="ev-lq-you-tag">أنت</span>
            </div>
          </div>

          <!-- Bottom Status & Jackpot Action Bar -->
          <div class="ev-lq-footer">
            <p class="ev-lq-status-text" id="lqStatusText">اربح 7 مراحل متتالية لعبور جسر البركان والفوز بالجائزة الكبرى!</p>
            <button type="button" class="ev-lq-cta-btn hidden" id="lqClaimJackpotBtn">
              <img src="${ASSETS.coinIcon}" alt="">
              <span id="lqCtaLabel">استلام الجائزة (+10,000)</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) close();
    });
    modalEl.querySelector("#lavaQuestCloseBtn").addEventListener("click", close);

    modalEl.querySelector("#lqClaimJackpotBtn").addEventListener("click", () => {
      const st = engine.getState();
      if (st.jackpotClaimed) {
        engine.startNewRun();
        savePersisted(engine.exportState());
        window.CMRAudio?.playSfx?.("open");
        fx?.showToast?.("🌋 بدأ تحدي البركان من جديد — 100 لاعب على الجسر!");
        render();
        notifyBadgeUpdate();
        return;
      }

      const res = engine.claimJackpot();
      if (!res.ok) return;
      savePersisted(engine.exportState());
      window.CMRProfile?.vibrate?.([26, 30, 32]);
      window.CMRAudio?.playSfx?.("win");

      const chestEl = modalEl.querySelector("#lqSummitChest");
      fx?.spawnSparkleBurst?.(chestEl, { count: 28, colors: ["#fde047", "#fb923c", "#ef4444", "#ffffff"] });
      fx?.launchCoinBurst?.(chestEl, {
        count: 26,
        iconSrc: ASSETS.coinIcon,
        targetKind: "coins",
      });
      fx?.grantReward?.({ coins: res.payout });
      fx?.showToast?.(`🏆 عبرت جسر البركان وحصلت على +${res.payout.toLocaleString("en-US")} عملة ذهبية!`);
      render();
      notifyBadgeUpdate();
    });

    return modalEl;
  }

  function triggerParabolicHop(fromStep, toStep) {
    if (!modalEl) return;
    const token = modalEl.querySelector("#lqPlayerToken");
    if (!token) return;
    const fromPos = BRIDGE_STEPS[Math.max(0, Math.min(CONFIG.TOTAL_STEPS, fromStep))];
    const toPos = BRIDGE_STEPS[Math.max(0, Math.min(CONFIG.TOTAL_STEPS, toStep))];
    if (!fromPos || !toPos) return;

    token.style.setProperty("--hop-from-x", `${fromPos.x}%`);
    token.style.setProperty("--hop-from-y", `${fromPos.y}%`);
    token.style.setProperty("--hop-to-x", `${toPos.x}%`);
    token.style.setProperty("--hop-to-y", `${toPos.y}%`);
    token.classList.remove("is-hopping");
    void token.offsetWidth;
    token.classList.add("is-hopping");
    clearTimeout(token.__hopTimer);
    token.__hopTimer = setTimeout(() => {
      token.classList.remove("is-hopping");
    }, 640);
  }

  function triggerFlameFlash() {
    if (!modalEl) return;
    const flash = modalEl.querySelector("#lqFlameFlash");
    const stage = modalEl.querySelector(".ev-stage-lava-quest");
    if (flash) {
      flash.classList.remove("is-flashing");
      void flash.offsetWidth;
      flash.classList.add("is-flashing");
      clearTimeout(flash.__flashTimer);
      flash.__flashTimer = setTimeout(() => flash.classList.remove("is-flashing"), 780);
    }
    if (stage) {
      stage.classList.remove("is-lava-shake");
      void stage.offsetWidth;
      stage.classList.add("is-lava-shake");
      clearTimeout(stage.__shakeTimer);
      stage.__shakeTimer = setTimeout(() => stage.classList.remove("is-lava-shake"), 520);
    }
  }

  function render() {
    if (!modalEl) return;
    const st = engine.getState();

    const remEl = modalEl.querySelector("#lqRemainingVal");
    const stepEl = modalEl.querySelector("#lqStepVal");
    const statusEl = modalEl.querySelector("#lqStatusText");
    const ctaBtn = modalEl.querySelector("#lqClaimJackpotBtn");
    const ctaLbl = modalEl.querySelector("#lqCtaLabel");
    const avatarImg = modalEl.querySelector("#lqPlayerAvatarImg");
    const token = modalEl.querySelector("#lqPlayerToken");
    const nodesLayer = modalEl.querySelector("#lqNodesLayer");
    const summitChest = modalEl.querySelector("#lqSummitChest");

    if (remEl) remEl.textContent = `${st.remainingPlayers} / ${st.initialPlayers}`;
    if (stepEl) stepEl.textContent = `${st.step} / ${st.totalSteps}`;
    if (avatarImg) avatarImg.src = getPlayerAvatarSrc();

    if (summitChest) {
      summitChest.classList.toggle("is-unlocked", st.canClaim);
    }

    // Place step badges and cute rival survivor tokens along the 7 steps
    if (nodesLayer) {
      nodesLayer.innerHTML = "";
      for (let i = 1; i <= CONFIG.TOTAL_STEPS; i++) {
        const pos = BRIDGE_STEPS[i];
        const dot = document.createElement("div");
        const passed = st.step >= i;
        const current = st.step === i;
        dot.className = `ev-lq-step-node ${passed ? "is-passed" : ""} ${current ? "is-current" : ""}`;
        dot.style.left = `${pos.x}%`;
        dot.style.top = `${pos.y}%`;
        dot.dataset.lavaStep = String(i);
        dot.innerHTML = `<span>${i}</span>`;
        nodesLayer.appendChild(dot);

        // Render cute rival survivor tokens near active/upcoming bridge steps
        if (i <= st.step + 2 && i >= Math.max(1, st.step) && i < CONFIG.TOTAL_STEPS) {
          const rival = RIVAL_AVATARS[(i - 1) % RIVAL_AVATARS.length];
          const sideOffset = i % 2 === 0 ? -13 : 13;
          const rTok = document.createElement("span");
          rTok.className = "ev-lq-rival-token";
          rTok.style.left = `${pos.x + sideOffset}%`;
          rTok.style.top = `${pos.y + 1}%`;
          rTok.style.setProperty("--rival-bg", rival.color);
          rTok.style.animationDelay = `${i * 0.25}s`;
          rTok.setAttribute("aria-hidden", "true");
          rTok.textContent = rival.icon;
          nodesLayer.appendChild(rTok);
        }
      }
    }

    // Position player avatar token on current step
    const curPos = BRIDGE_STEPS[st.step] || BRIDGE_STEPS[0];
    if (token) {
      token.style.left = `${curPos.x}%`;
      token.style.top = `${curPos.y}%`;
    }

    if (statusEl) {
      if (st.canClaim) {
        statusEl.textContent = `🎉 وصلت إلى القمة! اضغط لاستلام كنز +10,000 عملة ذهبية!`;
      } else if (st.jackpotClaimed) {
        statusEl.textContent = `🏆 فزت بتحدي البركان! ابدأ جولة جديدة ضد 100 لاعب الآن.`;
      } else if (st.step > 0) {
        statusEl.textContent = `أنت في الخطوة ${st.step}/7 · تبقى ${st.remainingPlayers} لاعباً — خسارة بدون +5 حركات تعيدك للبداية!`;
      } else {
        statusEl.textContent = `اربح 7 مراحل متتالية لعبور الجسر! الخسارة بدون +5 حركات تشعل الجسر وتعيدك للبداية.`;
      }
    }

    if (ctaBtn && ctaLbl) {
      if (st.canClaim) {
        ctaBtn.classList.remove("hidden");
        ctaLbl.textContent = "استلام الجائزة الكبرى (+10,000)";
      } else if (st.jackpotClaimed) {
        ctaBtn.classList.remove("hidden");
        ctaLbl.textContent = "🔥 ابدأ تحدي بركان جديد";
      } else {
        ctaBtn.classList.add("hidden");
      }
    }
  }

  function open() {
    ensureModal();
    render();
    fx?.openElasticModal?.(modalEl);

    if (pendingFlameFlash) {
      pendingFlameFlash = false;
      setTimeout(() => triggerFlameFlash(), 240);
    } else if (pendingHopFromStep !== null) {
      const fromStep = pendingHopFromStep;
      pendingHopFromStep = null;
      setTimeout(() => triggerParabolicHop(fromStep, engine.getState().step), 260);
    }
  }

  function close() {
    fx?.closeElasticModal?.(modalEl);
  }

  // Subscribe cleanly via modular EventBus
  if (bus && typeof bus.on === "function") {
    bus.on("stage:win", () => {
      const res = engine.recordWin();
      savePersisted(engine.exportState());
      if (res.advanced) {
        if (modalEl && !modalEl.classList.contains("hidden")) {
          render();
          triggerParabolicHop(res.prevStep, res.state.step);
          fx?.spawnSparkleBurst?.(modalEl.querySelector("#lqPlayerToken"), { count: 14 });
        } else {
          pendingHopFromStep = res.prevStep;
        }
      }
      notifyBadgeUpdate();
    });

    bus.on("stage:revive", () => {
      engine.protectWithExtraMoves();
    });

    bus.on("stage:fail", (payload) => {
      const res = engine.recordLoss({ usedExtraMoves: Boolean(payload?.usedExtraMoves) });
      savePersisted(engine.exportState());
      if (res.reset && res.hadProgress) {
        if (modalEl && !modalEl.classList.contains("hidden")) {
          render();
          triggerFlameFlash();
          window.CMRAudio?.playSfx?.("lose");
        } else {
          pendingFlameFlash = true;
        }
      }
      notifyBadgeUpdate();
    });
  }

  return {
    CONFIG,
    BRIDGE_STEPS,
    createLavaQuestEngine,
    getState: () => engine.getState(),
    hasNotification: () => engine.getState().canClaim,
    triggerParabolicHop,
    triggerFlameFlash,
    open,
    close,
    render,
  };
});
