/* Candy Magic Royale — Phase 1 Event 1: خزنة الملك (Royal Vault / Bastet Piggy Bank)
 * Isolated module listening to CMREventBus ("stage:win").
 * Adds +150 bonus coins per win up to 3000/3000; unlocks "افتح الخزنة" at >= 1500 coins.
 * Features rotating golden radial beams, Bastet breathing idle, squash-and-stretch jiggle,
 * shimmering golden bar, and a 22-coin GPU-accelerated burst into the player's HUD balance.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root, require("./event-bus"));
  } else {
    root.CMRRoyalVault = factory(root, {
      EventBus: root.CMREventBus,
      EventFX: root.CMREventFX,
      EVENT_ASSETS: root.CMR_EVENT_ASSETS,
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root, busPkg) {
  "use strict";

  const STORAGE_KEY = "cmr_event_royal_vault_v1";
  const CONFIG = Object.freeze({
    COINS_PER_WIN: 150,
    UNLOCK_THRESHOLD: 1500,
    MAX_CAPACITY: 3000,
    BURST_COIN_COUNT: 24,
  });

  const ASSETS = busPkg?.EVENT_ASSETS || {
    royalVaultFrame: "./public/assets/aistudio/event_ui_royal_vault_d8e2bf76.png",
    bastetVaultIcon: "./public/assets/aistudio/icon_golden_bastet_vault_411d03d1.png",
    coinIcon: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png",
  };

  // =========================================================================
  // PURE LOGIC ENGINE (Unit-Tested)
  // =========================================================================
  function createRoyalVaultEngine(initial = {}) {
    let state = {
      storedCoins: clampCoins(initial.storedCoins ?? 0),
      totalClaimed: Math.max(0, Math.floor(Number(initial.totalClaimed) || 0)),
      claimsCount: Math.max(0, Math.floor(Number(initial.claimsCount) || 0)),
    };

    function clampCoins(v) {
      return Math.max(0, Math.min(CONFIG.MAX_CAPACITY, Math.floor(Number(v) || 0)));
    }

    function getState() {
      const percent = Math.round((state.storedCoins / CONFIG.MAX_CAPACITY) * 100);
      const canOpen = state.storedCoins >= CONFIG.UNLOCK_THRESHOLD;
      const isFull = state.storedCoins >= CONFIG.MAX_CAPACITY;
      return {
        ...state,
        maxCapacity: CONFIG.MAX_CAPACITY,
        unlockThreshold: CONFIG.UNLOCK_THRESHOLD,
        percent,
        canOpen,
        isFull,
        remainingToUnlock: Math.max(0, CONFIG.UNLOCK_THRESHOLD - state.storedCoins),
      };
    }

    function addWinCoins(amount = CONFIG.COINS_PER_WIN) {
      const prev = state.storedCoins;
      const delta = Math.max(0, Math.floor(Number(amount) || 0));
      state.storedCoins = clampCoins(prev + delta);
      const added = state.storedCoins - prev;
      return { added, state: getState() };
    }

    function openVault() {
      if (state.storedCoins < CONFIG.UNLOCK_THRESHOLD) {
        return {
          ok: false,
          reason: "below_threshold",
          payout: 0,
          state: getState(),
        };
      }
      const payout = state.storedCoins;
      state.storedCoins = 0;
      state.totalClaimed += payout;
      state.claimsCount += 1;
      return {
        ok: true,
        payout,
        state: getState(),
      };
    }

    function exportState() {
      return {
        storedCoins: state.storedCoins,
        totalClaimed: state.totalClaimed,
        claimsCount: state.claimsCount,
      };
    }

    return { getState, addWinCoins, openVault, exportState };
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

  const engine = createRoyalVaultEngine(loadPersisted());
  const bus = busPkg?.EventBus;
  const fx = busPkg?.EventFX;

  let modalEl = null;

  function notifyBadgeUpdate() {
    bus?.emit?.("events:badge-update", { source: "royal-vault" });
  }

  function triggerBastetJiggle() {
    if (!modalEl) return;
    const cat = modalEl.querySelector("#rvBastetImg");
    if (!cat) return;
    cat.classList.remove("is-jiggling");
    void cat.offsetWidth;
    cat.classList.add("is-jiggling");
    clearTimeout(cat.__jiggleTimer);
    cat.__jiggleTimer = setTimeout(() => cat.classList.remove("is-jiggling"), 560);
  }

  function ensureModal() {
    if (!hasDOM) return null;
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.id = "royalVaultModal";
    modalEl.className = "modal ev-modal hidden";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "royalVaultTitle");

    modalEl.innerHTML = `
      <div class="ev-stage ev-stage-royal-vault" dir="rtl">
        <img class="ev-frame-img" src="${ASSETS.royalVaultFrame}" alt="" aria-hidden="true" draggable="false">
        <h2 class="ev-ribbon-title ev-title-royal-vault" id="royalVaultTitle">خزنة الملك</h2>
        <button type="button" class="ev-close-orb ev-close-royal-vault" id="royalVaultCloseBtn" aria-label="إغلاق خزنة الملك">
          <span aria-hidden="true">✕</span>
        </button>

        <div class="ev-inner-safe ev-safe-royal-vault">
          <p class="ev-rv-subtitle" id="rvSubtitle">كل فوز يضيف <b>+150</b> عملة ذهبية إلى خزنة باستت!</p>

          <!-- Golden Bastet Hero over Rotating Soft Golden Radial Beams -->
          <div class="ev-rv-hero" id="rvHeroStage">
            <div class="ev-rv-rays" aria-hidden="true"></div>
            <div class="ev-rv-glow" aria-hidden="true"></div>
            <img
              id="rvBastetImg"
              class="ev-rv-bastet"
              src="${ASSETS.bastetVaultIcon}"
              alt="خزنة باستت الذهبية"
              draggable="false"
            >
            <div class="ev-rv-coin-pill" id="rvCoinPill">
              <img src="${ASSETS.coinIcon}" alt="">
              <strong id="rvCoinAmount" dir="ltr">0</strong>
            </div>
          </div>

          <!-- Shimmering Metallic Golden Progress Bar (0 / 1500 unlock / 3000 max) -->
          <div class="ev-rv-progress-card">
            <div class="ev-rv-prog-head">
              <span id="rvStatusLabel">تُفتح عند 1,500 عملة</span>
              <strong id="rvProgFraction" dir="ltr">0 / 3,000</strong>
            </div>
            <div class="ev-rv-prog-track" role="progressbar" aria-valuemin="0" aria-valuemax="3000" aria-valuenow="0" id="rvProgBar">
              <div class="ev-rv-prog-fill" id="rvProgFill" style="width:0%"></div>
              <span class="ev-rv-unlock-mark" aria-hidden="true" title="1,500"></span>
            </div>
            <div class="ev-rv-prog-ticks" dir="ltr">
              <span>0</span>
              <span class="is-mid">1,500 🔓</span>
              <span>3,000 ★</span>
            </div>
          </div>

          <!-- Primary CTA -->
          <button type="button" class="ev-rv-open-btn" id="rvOpenVaultBtn" disabled>
            <img src="${ASSETS.coinIcon}" alt="">
            <span id="rvOpenBtnLabel">افتح الخزنة</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) close();
    });
    modalEl.querySelector("#royalVaultCloseBtn").addEventListener("click", close);

    const openBtn = modalEl.querySelector("#rvOpenVaultBtn");
    openBtn.addEventListener("click", () => {
      const res = engine.openVault();
      if (!res.ok) {
        window.CMRAudio?.playSfx?.("invalid");
        fx?.showToast?.(`اجمع ${res.state.remainingToUnlock.toLocaleString("en-US")} عملة إضافية لفتح خزنة الملك!`);
        triggerBastetJiggle();
        return;
      }

      savePersisted(engine.exportState());
      triggerBastetJiggle();
      window.CMRProfile?.vibrate?.([22, 30, 26]);
      window.CMRAudio?.playSfx?.("win");

      const heroEl = modalEl.querySelector("#rvHeroStage");
      fx?.spawnSparkleBurst?.(heroEl, { count: 22 });
      fx?.launchCoinBurst?.(heroEl, {
        count: CONFIG.BURST_COIN_COUNT,
        iconSrc: ASSETS.coinIcon,
        targetKind: "coins",
      });

      fx?.grantReward?.({ coins: res.payout });
      fx?.showToast?.(`🎉 فتحت خزنة الملك وحصلت على +${res.payout.toLocaleString("en-US")} عملة ذهبية!`);
      render();
      notifyBadgeUpdate();
    });

    return modalEl;
  }

  function render() {
    if (!modalEl) return;
    const st = engine.getState();

    const amountEl = modalEl.querySelector("#rvCoinAmount");
    const fracEl = modalEl.querySelector("#rvProgFraction");
    const fillEl = modalEl.querySelector("#rvProgFill");
    const barEl = modalEl.querySelector("#rvProgBar");
    const statusEl = modalEl.querySelector("#rvStatusLabel");
    const btn = modalEl.querySelector("#rvOpenVaultBtn");
    const btnLbl = modalEl.querySelector("#rvOpenBtnLabel");

    if (amountEl) amountEl.textContent = st.storedCoins.toLocaleString("en-US");
    if (fracEl) fracEl.textContent = `${st.storedCoins.toLocaleString("en-US")} / ${st.maxCapacity.toLocaleString("en-US")}`;
    if (fillEl) fillEl.style.width = `${st.percent}%`;
    if (barEl) barEl.setAttribute("aria-valuenow", String(st.storedCoins));

    if (statusEl) {
      if (st.isFull) {
        statusEl.textContent = "الخزنة ممتلئة بالكامل! استلم كنزك الآن";
      } else if (st.canOpen) {
        statusEl.textContent = "خزنة الملك جاهزة للفتح الآن!";
      } else {
        statusEl.textContent = `متبقي ${st.remainingToUnlock.toLocaleString("en-US")} عملة لفتح الخزنة`;
      }
    }

    if (btn) {
      btn.disabled = !st.canOpen;
      btn.classList.toggle("is-ready", st.canOpen);
    }
    if (btnLbl) {
      btnLbl.textContent = st.canOpen
        ? `افتح الخزنة (+${st.storedCoins.toLocaleString("en-US")})`
        : "افتح الخزنة (عند 1,500)";
    }
  }

  function open() {
    ensureModal();
    render();
    fx?.openElasticModal?.(modalEl);
  }

  function close() {
    fx?.closeElasticModal?.(modalEl);
  }

  function addBonusCoins(amount = CONFIG.COINS_PER_WIN) {
    const res = engine.addWinCoins(amount);
    savePersisted(engine.exportState());
    if (modalEl && !modalEl.classList.contains("hidden")) {
      render();
      if (res.added > 0) {
        triggerBastetJiggle();
        fx?.spawnSparkleBurst?.(modalEl.querySelector("#rvHeroStage"), { count: 12 });
      }
    }
    notifyBadgeUpdate();
    return res;
  }

  // Subscribe cleanly via modular EventBus
  if (bus && typeof bus.on === "function") {
    bus.on("stage:win", () => {
      addBonusCoins(CONFIG.COINS_PER_WIN);
    });
  }

  return {
    CONFIG,
    createRoyalVaultEngine,
    getState: () => engine.getState(),
    hasNotification: () => engine.getState().canOpen,
    addBonusCoins,
    open,
    close,
    render,
  };
});
