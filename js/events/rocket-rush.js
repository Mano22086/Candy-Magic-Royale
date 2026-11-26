/* Candy Magic Royale — Phase 1 Event 2: عاصفة الصواريخ (Rocket Rush)
 * Isolated module listening to CMREventBus ("rocket:used").
 * Live 48-hour countdown timer, hovering 3D Candy Rocket with thruster flicker & rising golden sparks,
 * and a glowing 5-tier winding milestone progress track (5, 15, 30, 50, 80 rockets).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root, require("./event-bus"));
  } else {
    root.CMRRocketRush = factory(root, {
      EventBus: root.CMREventBus,
      EventFX: root.CMREventFX,
      EVENT_ASSETS: root.CMR_EVENT_ASSETS,
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root, busPkg) {
  "use strict";

  const STORAGE_KEY = "cmr_event_rocket_rush_v1";
  const DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours

  const ASSETS = busPkg?.EVENT_ASSETS || {
    rocketRushFrame: "./public/assets/aistudio/event_ui_rocket_rush_74634efb.png",
    rocketIcon: "./public/assets/aistudio/01_booster_candy_rocket_b53df03d.png",
    coinIcon: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png",
    wandIcon: "./public/assets/aistudio/02_booster_magic_wand_e83e8cc8.png",
    chestOpenIcon: "./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png",
  };

  const MILESTONES = Object.freeze([
    Object.freeze({
      tier: 1,
      target: 5,
      titleAr: "إقلاع سريع",
      rewardLabelAr: "+200 عملة",
      icon: ASSETS.coinIcon,
      reward: Object.freeze({ coins: 200 }),
    }),
    Object.freeze({
      tier: 2,
      target: 15,
      titleAr: "شرارة السماء",
      rewardLabelAr: "2× عصا سحرية + 250 عملة",
      icon: ASSETS.wandIcon,
      reward: Object.freeze({ paints: 2, coins: 250 }),
    }),
    Object.freeze({
      tier: 3,
      target: 30,
      titleAr: "عاصفة نارية",
      rewardLabelAr: "+500 عملة + 2× صاروخ",
      icon: ASSETS.rocketIcon,
      reward: Object.freeze({ coins: 500, rockets: 2 }),
    }),
    Object.freeze({
      tier: 4,
      target: 50,
      titleAr: "قائد الصواريخ",
      rewardLabelAr: "3× عصا + 750 عملة",
      icon: ASSETS.wandIcon,
      reward: Object.freeze({ paints: 3, coins: 750 }),
    }),
    Object.freeze({
      tier: 5,
      target: 80,
      titleAr: "صندوق العاصفة الأسطوري",
      rewardLabelAr: "صندوق ملكي + 1,500 عملة + 10 جواهر",
      icon: ASSETS.chestOpenIcon,
      isGrand: true,
      reward: Object.freeze({ coins: 1500, gems: 10, rockets: 3, paints: 2 }),
    }),
  ]);

  // =========================================================================
  // PURE LOGIC ENGINE (Unit-Tested)
  // =========================================================================
  function createRocketRushEngine(initial = {}, nowFn = () => Date.now()) {
    const now = nowFn();
    const initialEndsAt = Number(initial.endsAt);
    let state = {
      rocketsUsed: Math.max(0, Math.floor(Number(initial.rocketsUsed) || 0)),
      claimedTiers: Array.isArray(initial.claimedTiers)
        ? initial.claimedTiers.map(Number).filter((n) => Number.isFinite(n))
        : [],
      endsAt: Number.isFinite(initialEndsAt) && initialEndsAt > now ? initialEndsAt : now + DURATION_MS,
    };

    function ensureCycleActive() {
      const current = nowFn();
      if (current >= state.endsAt) {
        state.rocketsUsed = 0;
        state.claimedTiers = [];
        state.endsAt = current + DURATION_MS;
      }
    }

    function recordRocket(count = 1) {
      ensureCycleActive();
      const inc = Math.max(1, Math.floor(Number(count) || 1));
      state.rocketsUsed += inc;
      return getState();
    }

    function claimTier(tierNum) {
      ensureCycleActive();
      const milestone = MILESTONES.find((m) => m.tier === Number(tierNum));
      if (!milestone) return { ok: false, reason: "invalid_tier", state: getState() };
      if (state.claimedTiers.includes(milestone.tier)) {
        return { ok: false, reason: "already_claimed", state: getState() };
      }
      if (state.rocketsUsed < milestone.target) {
        return { ok: false, reason: "not_reached", state: getState() };
      }
      state.claimedTiers.push(milestone.tier);
      return {
        ok: true,
        milestone,
        reward: { ...milestone.reward },
        state: getState(),
      };
    }

    function getState() {
      ensureCycleActive();
      const maxTarget = MILESTONES[MILESTONES.length - 1].target;
      const tiers = MILESTONES.map((m) => {
        const claimed = state.claimedTiers.includes(m.tier);
        const reached = state.rocketsUsed >= m.target;
        return {
          ...m,
          claimed,
          reached,
          canClaim: reached && !claimed,
        };
      });
      const claimableCount = tiers.filter((t) => t.canClaim).length;
      const remainingMs = Math.max(0, state.endsAt - nowFn());
      const percent = Math.min(100, Math.round((state.rocketsUsed / maxTarget) * 100));

      return {
        rocketsUsed: state.rocketsUsed,
        maxTarget,
        percent,
        endsAt: state.endsAt,
        remainingMs,
        claimableCount,
        tiers,
      };
    }

    function exportState() {
      return {
        rocketsUsed: state.rocketsUsed,
        claimedTiers: [...state.claimedTiers],
        endsAt: state.endsAt,
      };
    }

    return { recordRocket, claimTier, getState, exportState };
  }

  function formatCountdown(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
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

  const engine = createRocketRushEngine(loadPersisted());
  const bus = busPkg?.EventBus;
  const fx = busPkg?.EventFX;

  let modalEl = null;
  let countdownInterval = null;

  function notifyBadgeUpdate() {
    bus?.emit?.("events:badge-update", { source: "rocket-rush" });
  }

  function buildRisingSparksHtml() {
    const seeds = [
      { x: 22, d: 0.0, s: 1.1 },
      { x: 35, d: 0.35, s: 0.85 },
      { x: 48, d: 0.7, s: 1.2 },
      { x: 60, d: 0.2, s: 0.9 },
      { x: 74, d: 0.95, s: 1.0 },
      { x: 42, d: 1.25, s: 0.75 },
      { x: 56, d: 1.5, s: 1.1 },
      { x: 30, d: 1.8, s: 0.9 },
    ];
    return seeds
      .map(
        (p) =>
          `<span class="ev-rr-spark" style="left:${p.x}%;animation-delay:${p.d}s;--spark-scale:${p.s}" aria-hidden="true"></span>`
      )
      .join("");
  }

  function ensureModal() {
    if (!hasDOM) return null;
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.id = "rocketRushModal";
    modalEl.className = "modal ev-modal hidden";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "rocketRushTitle");

    modalEl.innerHTML = `
      <div class="ev-stage ev-stage-rocket-rush" dir="rtl">
        <img class="ev-frame-img" src="${ASSETS.rocketRushFrame}" alt="" aria-hidden="true" draggable="false">
        <h2 class="ev-ribbon-title ev-title-rocket-rush" id="rocketRushTitle">عاصفة الصواريخ</h2>
        <button type="button" class="ev-close-orb ev-close-rocket-rush" id="rocketRushCloseBtn" aria-label="إغلاق عاصفة الصواريخ">
          <span aria-hidden="true">✕</span>
        </button>

        <div class="ev-inner-safe ev-safe-rocket-rush">
          <!-- Top Countdown & Rocket Counter Strip -->
          <div class="ev-rr-top-bar">
            <span class="ev-rr-timer-pill" id="rrTimerPill" dir="ltr">
              <span aria-hidden="true">⏱</span>
              <b id="rrCountdownText">48:00:00</b>
            </span>
            <span class="ev-rr-count-pill">
              <img src="${ASSETS.rocketIcon}" alt="">
              <b id="rrRocketCount" dir="ltr">0 / 80</b>
            </span>
          </div>

          <!-- Hero Hovering 3D Candy Rocket with Dynamic Thruster Flicker & Rising Golden Sparks -->
          <div class="ev-rr-hero">
            <div class="ev-rr-sparks" aria-hidden="true">${buildRisingSparksHtml()}</div>
            <div class="ev-rr-rocket-wrap">
              <span class="ev-rr-thruster" aria-hidden="true"></span>
              <img class="ev-rr-rocket-img" src="${ASSETS.rocketIcon}" alt="صاروخ الحلوى" draggable="false">
            </div>
            <div class="ev-rr-hero-copy">
              <strong>أطلق الصواريخ في المراحل!</strong>
              <small>كل صاروخ أو مطابقة رباعية تقرّبك من الصندوق الأسطوري</small>
              <div class="ev-rr-bar-track" role="progressbar" aria-valuemin="0" aria-valuemax="80" aria-valuenow="0" id="rrProgBar">
                <div class="ev-rr-bar-fill" id="rrProgFill" style="width:0%"></div>
              </div>
            </div>
          </div>

          <!-- Glowing Winding 5-Tier Milestone Track -->
          <div class="ev-rr-track-scroll" id="rrMilestoneTrack"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) close();
    });
    modalEl.querySelector("#rocketRushCloseBtn").addEventListener("click", close);

    return modalEl;
  }

  function updateCountdownText() {
    if (!modalEl) return;
    const st = engine.getState();
    const timerEl = modalEl.querySelector("#rrCountdownText");
    if (timerEl) timerEl.textContent = formatCountdown(st.remainingMs);
  }

  function render() {
    if (!modalEl) return;
    const st = engine.getState();

    updateCountdownText();
    const countEl = modalEl.querySelector("#rrRocketCount");
    const fillEl = modalEl.querySelector("#rrProgFill");
    const barEl = modalEl.querySelector("#rrProgBar");
    if (countEl) countEl.textContent = `${st.rocketsUsed} / ${st.maxTarget}`;
    if (fillEl) fillEl.style.width = `${st.percent}%`;
    if (barEl) barEl.setAttribute("aria-valuenow", String(Math.min(st.rocketsUsed, st.maxTarget)));

    const track = modalEl.querySelector("#rrMilestoneTrack");
    if (!track) return;
    track.innerHTML = "";

    st.tiers.forEach((tier, idx) => {
      const node = document.createElement("article");
      const zigClass = idx % 2 === 0 ? "is-zig-right" : "is-zig-left";
      const stateClass = tier.claimed ? "is-claimed" : tier.canClaim ? "is-claimable" : "is-locked";
      node.className = `ev-rr-tier ${zigClass} ${stateClass} ${tier.isGrand ? "is-grand" : ""}`;
      node.dataset.tier = String(tier.tier);

      const tierPct = Math.min(100, Math.round((st.rocketsUsed / tier.target) * 100));

      node.innerHTML = `
        <div class="ev-rr-tier-badge">
          <span class="ev-rr-tier-num" dir="ltr">${tier.target}</span>
          <img class="ev-rr-mini-rocket" src="${ASSETS.rocketIcon}" alt="" draggable="false">
        </div>
        <div class="ev-rr-tier-mid">
          <strong>${tier.titleAr}</strong>
          <small>${tier.rewardLabelAr}</small>
          <span class="ev-rr-mini-bar"><i style="width:${tierPct}%"></i></span>
        </div>
        <div class="ev-rr-tier-cta">
          <div class="ev-rr-reward-orb ${tier.canClaim ? "has-halo" : ""}">
            <img src="${tier.icon}" alt="" draggable="false">
          </div>
          ${
            tier.claimed
              ? `<span class="ev-rr-claimed-tag">تم ✓</span>`
              : tier.canClaim
              ? `<button type="button" class="ev-rr-claim-btn" data-claim-tier="${tier.tier}">استلام</button>`
              : `<span class="ev-rr-pct-tag" dir="ltr">${Math.min(st.rocketsUsed, tier.target)}/${tier.target}</span>`
          }
        </div>
      `;

      const claimBtn = node.querySelector("[data-claim-tier]");
      if (claimBtn) {
        claimBtn.addEventListener("click", () => {
          const res = engine.claimTier(tier.tier);
          if (!res.ok) return;
          savePersisted(engine.exportState());
          window.CMRProfile?.vibrate?.([20, 25, 20]);
          window.CMRAudio?.playSfx?.(tier.isGrand ? "win" : "reward");
          fx?.spawnSparkleBurst?.(claimBtn, { count: tier.isGrand ? 24 : 16 });
          fx?.launchCoinBurst?.(claimBtn, {
            count: tier.isGrand ? 20 : 12,
            iconSrc: tier.reward.coins ? ASSETS.coinIcon : tier.icon,
            targetKind: "coins",
          });
          fx?.grantReward?.(res.reward);
          fx?.showToast?.(`🚀 استلمت مكافأة ${tier.titleAr}: ${tier.rewardLabelAr}!`);
          render();
          notifyBadgeUpdate();
        });
      }

      track.appendChild(node);
    });
  }

  function startCountdownLoop() {
    stopCountdownLoop();
    updateCountdownText();
    countdownInterval = setInterval(updateCountdownText, 1000);
  }

  function stopCountdownLoop() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  function open() {
    ensureModal();
    render();
    startCountdownLoop();
    fx?.openElasticModal?.(modalEl);
  }

  function close() {
    stopCountdownLoop();
    fx?.closeElasticModal?.(modalEl);
  }

  function recordRocketUsed(count = 1) {
    const st = engine.recordRocket(count);
    savePersisted(engine.exportState());
    if (modalEl && !modalEl.classList.contains("hidden")) {
      render();
    }
    notifyBadgeUpdate();
    return st;
  }

  if (bus && typeof bus.on === "function") {
    bus.on("rocket:used", (payload) => {
      const count = payload && Number.isFinite(Number(payload.count)) ? Number(payload.count) : 1;
      recordRocketUsed(count);
    });
  }

  return {
    MILESTONES,
    DURATION_MS,
    createRocketRushEngine,
    formatCountdown,
    getState: () => engine.getState(),
    hasNotification: () => engine.getState().claimableCount > 0,
    recordRocketUsed,
    open,
    close,
    render,
  };
});
