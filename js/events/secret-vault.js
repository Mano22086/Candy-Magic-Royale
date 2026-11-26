/* Candy Magic Royale — Phase 1 Event 3: غرفة الكنز 3×3 (Secret Vault)
 * Isolated module listening to CMREventBus ("stage:win").
 * Starts with 3 free keys for immediate play; earns +1 key every 3 stage wins;
 * includes optional AdMob rewarded button "+1 مفتاح مجاني".
 * Features 3-stage chest opening animation:
 *  1. Glowing golden key flies from counter to tapped chest's scarab lock & turns with sparkle flash.
 *  2. Chest performs 0.45s anticipation shake/wobble with expanding golden light rays behind it.
 *  3. Chest pops open (swapping to 07_shop_treasure_chest.png) with confetti burst & reward flying to HUD.
 *  4. Opening all 9 chests reveals a celebratory reset button for a fresh round.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root, require("./event-bus"));
  } else {
    root.CMRSecretVault = factory(root, {
      EventBus: root.CMREventBus,
      EventFX: root.CMREventFX,
      EVENT_ASSETS: root.CMR_EVENT_ASSETS,
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root, busPkg) {
  "use strict";

  const STORAGE_KEY = "cmr_event_secret_vault_v1";
  const CONFIG = Object.freeze({
    STARTING_FREE_KEYS: 3,
    WINS_PER_KEY: 3,
    GRID_SIZE: 9,
  });

  const ASSETS = busPkg?.EVENT_ASSETS || {
    secretVaultFrame: "./public/assets/aistudio/event_ui_secret_vault_af844ced.png",
    chestClosedIcon: "./public/assets/aistudio/icon_chest_closed_egyptian_40e6290f.png",
    chestOpenIcon: "./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png",
    goldenKeyIcon: "./public/assets/aistudio/icon_golden_key_a3b6321c.png",
    coinIcon: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png",
    rocketIcon: "./public/assets/aistudio/01_booster_candy_rocket_b53df03d.png",
    wandIcon: "./public/assets/aistudio/02_booster_magic_wand_e83e8cc8.png",
    bombIcon: "./public/assets/aistudio/03_booster_candy_bomb_8bfca840.png",
    gemIcon: "./assets/extracted/ui/icon_gem_purple.png",
  };

  // Curated 9-chest Egyptian treasure loot table (shuffled cleanly each round)
  const ROUND_LOOT_TEMPLATES = Object.freeze([
    { id: "coins_200", labelAr: "+200 عملة", icon: ASSETS.coinIcon, reward: { coins: 200 } },
    { id: "coins_350", labelAr: "+350 عملة", icon: ASSETS.coinIcon, reward: { coins: 350 } },
    { id: "coins_500", labelAr: "+500 عملة", icon: ASSETS.coinIcon, reward: { coins: 500 }, isJackpot: true },
    { id: "rocket_1", labelAr: "1× صاروخ", icon: ASSETS.rocketIcon, reward: { rockets: 1 } },
    { id: "rocket_2", labelAr: "2× صاروخ", icon: ASSETS.rocketIcon, reward: { rockets: 2 } },
    { id: "wand_1", labelAr: "1× عصا سحرية", icon: ASSETS.wandIcon, reward: { paints: 1 } },
    { id: "wand_2", labelAr: "2× عصا سحرية", icon: ASSETS.wandIcon, reward: { paints: 2 } },
    { id: "bomb_1", labelAr: "1× قنبلة", icon: ASSETS.bombIcon, reward: { hammer: 1 } },
    { id: "gems_5", labelAr: "+5 جواهر", icon: ASSETS.gemIcon, reward: { gems: 5 }, isJackpot: true },
  ]);

  function shuffleTemplates(rng = Math.random) {
    const list = ROUND_LOOT_TEMPLATES.map((item) => ({
      ...item,
      reward: { ...item.reward },
      opened: false,
    }));
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  // =========================================================================
  // PURE LOGIC ENGINE (Unit-Tested)
  // =========================================================================
  function createSecretVaultEngine(initial = {}, rng = Math.random) {
    const validChests =
      Array.isArray(initial.chests) && initial.chests.length === CONFIG.GRID_SIZE
        ? initial.chests.map((c, idx) => {
            const fallback = ROUND_LOOT_TEMPLATES[idx % ROUND_LOOT_TEMPLATES.length];
            return {
              id: c.id || fallback.id,
              labelAr: c.labelAr || fallback.labelAr,
              icon: c.icon || fallback.icon,
              reward: c.reward && typeof c.reward === "object" ? { ...c.reward } : { ...fallback.reward },
              isJackpot: Boolean(c.isJackpot),
              opened: Boolean(c.opened),
            };
          })
        : shuffleTemplates(rng);

    let state = {
      keys:
        initial.keys === undefined
          ? CONFIG.STARTING_FREE_KEYS
          : Math.max(0, Math.floor(Number(initial.keys) || 0)),
      winsTowardKey: Math.max(0, Math.min(CONFIG.WINS_PER_KEY - 1, Math.floor(Number(initial.winsTowardKey) || 0))),
      roundNumber: Math.max(1, Math.floor(Number(initial.roundNumber) || 1)),
      chests: validChests,
    };

    function getState() {
      const openedCount = state.chests.filter((c) => c.opened).length;
      const allOpened = openedCount >= CONFIG.GRID_SIZE;
      return {
        keys: state.keys,
        winsTowardKey: state.winsTowardKey,
        winsPerKey: CONFIG.WINS_PER_KEY,
        roundNumber: state.roundNumber,
        openedCount,
        totalChests: CONFIG.GRID_SIZE,
        allOpened,
        chests: state.chests.map((c) => ({ ...c, reward: { ...c.reward } })),
      };
    }

    function recordStageWin() {
      state.winsTowardKey += 1;
      let earnedKey = false;
      if (state.winsTowardKey >= CONFIG.WINS_PER_KEY) {
        state.winsTowardKey = 0;
        state.keys += 1;
        earnedKey = true;
      }
      return { earnedKey, state: getState() };
    }

    function addKeys(count = 1) {
      const inc = Math.max(1, Math.floor(Number(count) || 1));
      state.keys += inc;
      return getState();
    }

    function openChest(index) {
      const idx = Math.floor(Number(index));
      if (!Number.isFinite(idx) || idx < 0 || idx >= CONFIG.GRID_SIZE) {
        return { ok: false, reason: "invalid_index", state: getState() };
      }
      const chest = state.chests[idx];
      if (chest.opened) {
        return { ok: false, reason: "already_opened", state: getState() };
      }
      if (state.keys <= 0) {
        return { ok: false, reason: "no_keys", state: getState() };
      }
      state.keys -= 1;
      chest.opened = true;
      return {
        ok: true,
        index: idx,
        chest: { ...chest, reward: { ...chest.reward } },
        reward: { ...chest.reward },
        state: getState(),
      };
    }

    function resetRound() {
      const openedCount = state.chests.filter((c) => c.opened).length;
      if (openedCount < CONFIG.GRID_SIZE) {
        return { ok: false, reason: "not_complete", state: getState() };
      }
      state.roundNumber += 1;
      state.chests = shuffleTemplates(rng);
      return { ok: true, state: getState() };
    }

    function exportState() {
      return {
        keys: state.keys,
        winsTowardKey: state.winsTowardKey,
        roundNumber: state.roundNumber,
        chests: state.chests.map((c) => ({ ...c, reward: { ...c.reward } })),
      };
    }

    return { getState, recordStageWin, addKeys, openChest, resetRound, exportState };
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

  const engine = createSecretVaultEngine(loadPersisted());
  const bus = busPkg?.EventBus;
  const fx = busPkg?.EventFX;

  let modalEl = null;
  let animatingIndex = -1;

  function notifyBadgeUpdate() {
    bus?.emit?.("events:badge-update", { source: "secret-vault" });
  }

  function animateKeyToChest(chestBtn, onLockReached) {
    if (!hasDOM || !modalEl || !chestBtn) {
      onLockReached?.();
      return;
    }
    const keyPill = modalEl.querySelector("#svKeyIconImg") || modalEl.querySelector("#svKeyPill");
    const fromRect = keyPill
      ? keyPill.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: 120, width: 28, height: 28 };
    const toRect = chestBtn.getBoundingClientRect();

    const startX = fromRect.left + fromRect.width / 2;
    const startY = fromRect.top + fromRect.height / 2;
    const endX = toRect.left + toRect.width / 2;
    const endY = toRect.top + toRect.height * 0.56;

    const flyKey = document.createElement("img");
    flyKey.className = "ev-sv-flying-key";
    flyKey.src = ASSETS.goldenKeyIcon;
    flyKey.alt = "";
    flyKey.setAttribute("aria-hidden", "true");
    flyKey.style.left = `${Math.round(startX)}px`;
    flyKey.style.top = `${Math.round(startY)}px`;
    flyKey.style.setProperty("--key-dx", `${Math.round(endX - startX)}px`);
    flyKey.style.setProperty("--key-dy", `${Math.round(endY - startY)}px`);
    document.body.appendChild(flyKey);

    setTimeout(() => {
      fx?.spawnSparkleBurst?.(chestBtn, {
        count: 10,
        colors: ["#fde047", "#38bdf8", "#ffffff"],
      });
      window.CMRAudio?.playSfx?.("swap");
      flyKey.remove();
      onLockReached?.();
    }, 360);
  }

  function ensureModal() {
    if (!hasDOM) return null;
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.id = "secretVaultModal";
    modalEl.className = "modal ev-modal hidden";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "secretVaultTitle");

    modalEl.innerHTML = `
      <div class="ev-stage ev-stage-secret-vault" dir="rtl">
        <img class="ev-frame-img" src="${ASSETS.secretVaultFrame}" alt="" aria-hidden="true" draggable="false">
        <h2 class="ev-ribbon-title ev-title-secret-vault" id="secretVaultTitle">غرفة الكنز</h2>
        <button type="button" class="ev-close-orb ev-close-secret-vault" id="secretVaultCloseBtn" aria-label="إغلاق غرفة الكنز">
          <span aria-hidden="true">✕</span>
        </button>

        <div class="ev-inner-safe ev-safe-secret-vault">
          <!-- Top Key Counter Pill + AdMob Free Key Button -->
          <div class="ev-sv-top-bar">
            <div class="ev-sv-key-pill" id="svKeyPill">
              <img id="svKeyIconImg" src="${ASSETS.goldenKeyIcon}" alt="">
              <strong id="svKeyCount" dir="ltr">3</strong>
              <span>مفتاح</span>
            </div>
            <button
              type="button"
              class="ev-sv-ad-key-btn"
              id="svFreeKeyAdBtn"
              data-ad-button="true"
              aria-label="شاهد إعلاناً للحصول على مفتاح مجاني"
            >
              <span>🎬 +1 مفتاح مجاني</span>
            </button>
          </div>

          <p class="ev-sv-hint" id="svHintLine">اضغط على أي صندوق لفتحه بمفتاح ذهبي! (+1 مفتاح كل 3 انتصارات)</p>

          <!-- 3x3 Grid of 9 Closed Egyptian Scarab Chests -->
          <div class="ev-sv-grid" id="svChestGrid" role="group" aria-label="صناديق غرفة الكنز"></div>

          <!-- Celebratory Round Reset Bar (Revealed when all 9 chests are opened) -->
          <div class="ev-sv-reset-bar hidden" id="svResetBar">
            <button type="button" class="ev-sv-reset-btn" id="svResetRoundBtn">
              <span>✨ تجديد غرفة الكنز (جولة جديدة)</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl && animatingIndex === -1) close();
    });
    modalEl.querySelector("#secretVaultCloseBtn").addEventListener("click", () => {
      if (animatingIndex === -1) close();
    });

    // Optional AdMob rewarded "+1 مفتاح مجاني"
    const adBtn = modalEl.querySelector("#svFreeKeyAdBtn");
    adBtn.addEventListener("click", async () => {
      if (adBtn.disabled) return;
      if (!window.CMRAdMob || typeof window.CMRAdMob.showRewardedAd !== "function") {
        fx?.showToast?.("الإعلانات المكافأة غير متاحة حالياً.");
        return;
      }
      adBtn.disabled = true;
      try {
        const res = await window.CMRAdMob.showRewardedAd("secret_vault_key", () => {
          engine.addKeys(1);
          savePersisted(engine.exportState());
          window.CMRAudio?.playSfx?.("reward");
          fx?.spawnSparkleBurst?.(modalEl.querySelector("#svKeyPill"), { count: 14 });
          fx?.showToast?.("🔑 حصلت على +1 مفتاح ذهبي مجاني!");
          render();
          notifyBadgeUpdate();
        });
        if (!res?.rewarded && res?.status === "offline") {
          fx?.showToast?.("أنت غير متصل بالإنترنت.");
        }
      } finally {
        adBtn.disabled = false;
      }
    });

    // Celebratory Reset Round Button
    modalEl.querySelector("#svResetRoundBtn").addEventListener("click", () => {
      const res = engine.resetRound();
      if (!res.ok) return;
      savePersisted(engine.exportState());
      window.CMRAudio?.playSfx?.("open");
      fx?.spawnSparkleBurst?.(modalEl.querySelector("#svChestGrid"), { count: 20 });
      fx?.showToast?.(`✨ تم تجديد غرفة الكنز — الجولة ${res.state.roundNumber}!`);
      render();
      notifyBadgeUpdate();
    });

    return modalEl;
  }

  function handleChestTap(index, chestBtn) {
    if (animatingIndex !== -1) return;
    const st = engine.getState();
    if (st.chests[index]?.opened) return;
    if (st.keys <= 0) {
      window.CMRAudio?.playSfx?.("invalid");
      fx?.showToast?.("تحتاج إلى مفتاح ذهبي! اربح 3 مراحل أو اضغط +1 مفتاح مجاني.");
      chestBtn.classList.remove("is-locked-shake");
      void chestBtn.offsetWidth;
      chestBtn.classList.add("is-locked-shake");
      setTimeout(() => chestBtn.classList.remove("is-locked-shake"), 360);
      return;
    }

    // Reserve & deduct immediately to prevent double-tap exploits
    const openRes = engine.openChest(index);
    if (!openRes.ok) return;
    savePersisted(engine.exportState());
    animatingIndex = index;

    // Immediately update key counter visually
    const keyCountEl = modalEl.querySelector("#svKeyCount");
    if (keyCountEl) keyCountEl.textContent = String(openRes.state.keys);

    // Stage 1: Glowing golden key flies to tapped chest's scarab lock & turns
    animateKeyToChest(chestBtn, () => {
      // Stage 2: 0.45s anticipation shake/wobble with expanding golden light rays behind chest
      chestBtn.classList.add("is-opening-shake");
      window.CMRProfile?.vibrate?.([15, 25, 18]);

      setTimeout(() => {
        // Stage 3: Pop open -> swap to 07_shop_treasure_chest.png + confetti burst + floating reward to HUD
        chestBtn.classList.remove("is-opening-shake");
        chestBtn.classList.add("is-opened", "is-pop-reveal");
        const img = chestBtn.querySelector(".ev-sv-chest-img");
        if (img) img.src = ASSETS.chestOpenIcon;

        const rewardTag = chestBtn.querySelector(".ev-sv-reward-badge");
        if (rewardTag) {
          rewardTag.innerHTML = `<img src="${openRes.chest.icon}" alt=""><span>${openRes.chest.labelAr}</span>`;
          rewardTag.classList.remove("hidden");
        }

        window.CMRAudio?.playSfx?.(openRes.chest.isJackpot ? "win" : "reward");
        fx?.spawnSparkleBurst?.(chestBtn, { count: openRes.chest.isJackpot ? 24 : 16 });
        fx?.launchCoinBurst?.(chestBtn, {
          count: openRes.reward.coins ? 10 : 5,
          iconSrc: openRes.chest.icon,
          targetKind: openRes.reward.gems ? "gems" : "coins",
        });

        fx?.grantReward?.(openRes.reward);
        fx?.showToast?.(`🎁 وجدت في الصندوق: ${openRes.chest.labelAr}!`);

        setTimeout(() => {
          animatingIndex = -1;
          render();
          notifyBadgeUpdate();
        }, 380);
      }, 450);
    });
  }

  function render() {
    if (!modalEl) return;
    const st = engine.getState();

    const keyCountEl = modalEl.querySelector("#svKeyCount");
    const hintEl = modalEl.querySelector("#svHintLine");
    const gridEl = modalEl.querySelector("#svChestGrid");
    const resetBar = modalEl.querySelector("#svResetBar");

    if (keyCountEl) keyCountEl.textContent = String(st.keys);
    if (hintEl) {
      hintEl.textContent = st.allOpened
        ? `🎉 فتحت جميع الصناديق الـ 9 في الجولة ${st.roundNumber}!`
        : `تقدم المفتاح القادم: ${st.winsTowardKey}/${st.winsPerKey} انتصارات · المفتوح: ${st.openedCount}/9`;
    }
    if (resetBar) resetBar.classList.toggle("hidden", !st.allOpened);

    if (!gridEl) return;
    gridEl.innerHTML = "";

    st.chests.forEach((chest, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `ev-sv-chest-cell ${chest.opened ? "is-opened" : "is-closed"} ${chest.isJackpot && chest.opened ? "is-jackpot" : ""}`;
      btn.dataset.chestIndex = String(idx);
      btn.disabled = chest.opened;
      btn.setAttribute(
        "aria-label",
        chest.opened ? `صندوق مفتوح: ${chest.labelAr}` : `افتح الصندوق رقم ${idx + 1}`
      );

      btn.innerHTML = `
        <span class="ev-sv-chest-rays" aria-hidden="true"></span>
        <img
          class="ev-sv-chest-img"
          src="${chest.opened ? ASSETS.chestOpenIcon : ASSETS.chestClosedIcon}"
          alt=""
          draggable="false"
        >
        <span class="ev-sv-reward-badge ${chest.opened ? "" : "hidden"}">
          <img src="${chest.icon}" alt="">
          <span>${chest.labelAr}</span>
        </span>
      `;

      if (!chest.opened) {
        btn.addEventListener("click", () => handleChestTap(idx, btn));
      }
      gridEl.appendChild(btn);
    });

    window.CMRAdMob?.syncOfflineAdButtons?.();
  }

  function open() {
    ensureModal();
    render();
    fx?.openElasticModal?.(modalEl);
  }

  function close() {
    fx?.closeElasticModal?.(modalEl);
  }

  if (bus && typeof bus.on === "function") {
    bus.on("stage:win", () => {
      const res = engine.recordStageWin();
      savePersisted(engine.exportState());
      if (modalEl && !modalEl.classList.contains("hidden")) {
        render();
      }
      notifyBadgeUpdate();
    });
  }

  return {
    CONFIG,
    ROUND_LOOT_TEMPLATES,
    createSecretVaultEngine,
    getState: () => engine.getState(),
    hasNotification: () => {
      const st = engine.getState();
      return st.keys > 0 || st.allOpened;
    },
    addFreeKeys: (n = 1) => {
      const st = engine.addKeys(n);
      savePersisted(engine.exportState());
      if (modalEl && !modalEl.classList.contains("hidden")) render();
      notifyBadgeUpdate();
      return st;
    },
    open,
    close,
    render,
  };
});
