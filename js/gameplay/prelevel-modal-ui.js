/* Candy Magic Royale — Pharaonic Pre-Level Booster & Objective Modal (ui_prelevel_frame.png)
 * Displays stage goals (obstacle icons & counts) above 3 dynamic rotating booster slots.
 * Supports direct coin purchase via green '+' badge when owned=0 (or selected) and launches
 * the stage via "ابدأ المستوى [levelId]" with chosen starting boosters.
 */
(() => {
  "use strict";
  if (window.__CMR_PRELEVEL_MODAL__) return;
  window.__CMR_PRELEVEL_MODAL__ = true;

  let modalEl = null;
  let activeLevelId = 1;
  let selectedBoosters = new Set();
  let onStartCallback = null;

  function pack() {
    return window.CMRAnubisPack || null;
  }

  function core() {
    return window.CMRCore || null;
  }

  function systems() {
    return window.CMRMatch3Systems || null;
  }

  function getInventory() {
    if (window.CMRGame && typeof window.CMRGame.getInventorySnapshot === "function") {
      return window.CMRGame.getInventorySnapshot();
    }
    try {
      const saved = JSON.parse(localStorage.getItem("cmr_reborn_v1") || "{}");
      return {
        coins: Number.isFinite(Number(saved.coins)) ? Number(saved.coins) : 500,
        gems: Number.isFinite(Number(saved.gems)) ? Number(saved.gems) : 25,
        rockets: Number.isFinite(Number(saved.rockets)) ? Number(saved.rockets) : 3,
        hammer: Number.isFinite(Number(saved.hammer)) ? Number(saved.hammer) : 3,
        colors: Number.isFinite(Number(saved.colors)) ? Number(saved.colors) : 3,
        paints: Number.isFinite(Number(saved.paints)) ? Number(saved.paints) : 3,
      };
    } catch (_) {
      return { coins: 500, gems: 25, rockets: 3, hammer: 3, colors: 3, paints: 3 };
    }
  }

  function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t.__preT);
    t.__preT = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function ensureModal() {
    if (modalEl) return modalEl;
    const frameSrc =
      pack()?.MEGA_PACK_ASSETS?.uiFrames?.prelevelFrame ||
      "./mega_pack/09_pharaonic_ui_frames/ui_prelevel_frame.png";

    modalEl = document.createElement("div");
    modalEl.id = "prelevelModal";
    modalEl.className = "modal hidden cmr-prelevel-modal";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "prelevelTitle");

    modalEl.innerHTML = `
      <div class="cmr-prelevel-stage" id="prelevelStage" dir="rtl">
        <img
          src="${frameSrc}"
          alt=""
          class="cmr-prelevel-frame-img"
          aria-hidden="true"
          draggable="false"
        >
        <button type="button" class="cmr-prelevel-close" id="prelevelCloseBtn" aria-label="إغلاق">
          <span aria-hidden="true">✕</span>
        </button>

        <h2 class="cmr-prelevel-ribbon-title" id="prelevelTitle">المستوى 1</h2>
        <span class="cmr-prelevel-tier-tag hidden" id="prelevelTierTag"></span>

        <div class="cmr-prelevel-inner">
          <div class="cmr-prelevel-section-label">أهداف المرحلة</div>
          <div class="cmr-prelevel-goals" id="prelevelGoalsRow" aria-label="الأهداف المطلوبة"></div>

          <div class="cmr-prelevel-moves-chip" id="prelevelMovesChip">
            <span>الحركات المتاحة:</span>
            <strong id="prelevelMovesVal">25</strong>
          </div>

          <div class="cmr-prelevel-section-label">اختر معززات البداية</div>
          <div class="cmr-prelevel-boosters" id="prelevelBoostersRow" aria-label="معززات البداية"></div>

          <button type="button" class="cmr-prelevel-start-btn" id="prelevelStartBtn">
            <span id="prelevelStartBtnLabel">ابدأ المستوى 1</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) close();
    });
    modalEl.querySelector("#prelevelCloseBtn")?.addEventListener("click", close);
    modalEl.querySelector("#prelevelStartBtn")?.addEventListener("click", async () => {
      const chosen = Array.from(selectedBoosters);
      const lvl = activeLevelId;
      const cb = onStartCallback;
      window.CMRProfile?.vibrate?.(16);
      window.CMRAudio?.playSfx?.("confirm");
      close();
      if (typeof cb === "function") {
        await cb(lvl, chosen);
      } else if (typeof window.CMRStartSelectedHouse === "function") {
        await window.CMRStartSelectedHouse(lvl, { preBoosters: chosen });
      }
    });

    return modalEl;
  }

  function buySingleBooster(slot) {
    const inv = getInventory();
    if ((inv.coins || 0) < slot.buyCoins) {
      window.CMRAudio?.playSfx?.("error");
      showToast(`تحتاج ${slot.buyCoins} عملة ذهبية لشراء ${slot.nameAr}.`);
      return;
    }
    if (window.CMRGame && typeof window.CMRGame.buyPreLevelBooster === "function") {
      const res = window.CMRGame.buyPreLevelBooster(slot.inventoryKey, slot.buyCoins);
      if (res && res.ok) {
        selectedBoosters.add(slot.inventoryKey);
        window.CMRAudio?.playSfx?.("reward");
        window.CMRProfile?.vibrate?.(14);
        showToast(`✨ تم شراء +1 ${slot.nameAr} وتفعيله للمرحلة!`);
        render();
        return;
      }
    }
    showToast("تعذر إتمام الشراء حالياً.");
  }

  function render() {
    if (!modalEl) return;
    const cfg = core()?.getLevelConfig?.(activeLevelId) || {
      level: activeLevelId,
      moves: 25,
      obstacleCount: 6,
      obstacles: ["sandstone_block"],
      isBossStage: false,
      difficultyTagAr: null,
    };
    const inv = getInventory();
    const cat = systems()?.OBSTACLE_CATALOG || {};
    const boosters = pack()?.getPreLevelBoosterRotation
      ? pack().getPreLevelBoosterRotation(activeLevelId)
      : [];

    const titleEl = modalEl.querySelector("#prelevelTitle");
    const tierEl = modalEl.querySelector("#prelevelTierTag");
    const goalsEl = modalEl.querySelector("#prelevelGoalsRow");
    const movesEl = modalEl.querySelector("#prelevelMovesVal");
    const boostersEl = modalEl.querySelector("#prelevelBoostersRow");
    const startLbl = modalEl.querySelector("#prelevelStartBtnLabel");

    if (titleEl) {
      titleEl.textContent = cfg.isBossStage
        ? `زعيم أنوبيس · ${activeLevelId}`
        : `المستوى ${activeLevelId}`;
    }
    if (tierEl) {
      if (cfg.difficultyTagAr) {
        tierEl.textContent = cfg.difficultyTagAr;
        tierEl.classList.remove("hidden");
        tierEl.dataset.tier = cfg.difficultyTier || "hard";
      } else {
        tierEl.classList.add("hidden");
      }
    }
    if (movesEl) movesEl.textContent = String(cfg.moves || 25);
    if (startLbl) startLbl.textContent = `ابدأ المستوى ${activeLevelId}`;

    if (goalsEl) {
      goalsEl.innerHTML = "";
      const obsList = Array.isArray(cfg.obstacles) && cfg.obstacles.length ? cfg.obstacles : ["sandstone_block"];
      const perGoal = Math.max(2, Math.round((cfg.obstacleCount || 6) / obsList.length));
      obsList.slice(0, 3).forEach((obsId, idx) => {
        const def = cat[obsId] || {
          nameAr: "عائق فرعوني",
          imgSrc: pack()?.MEGA_PACK_ASSETS?.obstacles22?.sandstone_block || "./mega_pack/10_obstacles_all/obs_09_sandstone_block.png",
        };
        const count =
          idx === obsList.length - 1
            ? Math.max(2, (cfg.obstacleCount || 6) - perGoal * (obsList.length - 1))
            : perGoal;
        const item = document.createElement("div");
        item.className = "cmr-prelevel-goal-chip";
        item.innerHTML = `
          <img src="${def.imgSrc}" alt="${def.nameAr}" draggable="false">
          <strong class="cmr-prelevel-goal-count">${count}</strong>
          <small>${def.nameAr}</small>
        `;
        goalsEl.appendChild(item);
      });
    }

    if (boostersEl) {
      boostersEl.innerHTML = "";
      boosters.forEach((slot) => {
        const owned = Math.max(0, Math.floor(Number(inv[slot.inventoryKey]) || 0));
        const isSelected = owned > 0 && selectedBoosters.has(slot.inventoryKey);
        if (owned <= 0) selectedBoosters.delete(slot.inventoryKey);

        const card = document.createElement("div");
        card.className = `cmr-prelevel-booster-slot ${isSelected ? "is-selected" : ""} ${owned <= 0 ? "is-empty" : ""}`;
        card.innerHTML = `
          <button type="button" class="cmr-prelevel-booster-main" aria-label="${slot.nameAr}" title="${slot.descAr}">
            <img src="${slot.icon}" alt="${slot.nameAr}" draggable="false">
            <span class="cmr-prelevel-booster-name">${slot.nameAr}</span>
            <span class="cmr-prelevel-count-badge ${isSelected ? "is-check" : ""}">${isSelected ? "✓" : owned}</span>
          </button>
          <button type="button" class="cmr-prelevel-buy-plus ${owned <= 0 || isSelected ? "" : "is-subtle"}" aria-label="شراء ${slot.nameAr} بـ ${slot.buyCoins} عملة" title="شراء +1 بـ ${slot.buyCoins} عملة">
            <span>+</span>
            <small>${slot.buyCoins}</small>
          </button>
        `;

        card.querySelector(".cmr-prelevel-booster-main")?.addEventListener("click", () => {
          if (owned <= 0) {
            buySingleBooster(slot);
            return;
          }
          if (selectedBoosters.has(slot.inventoryKey)) {
            selectedBoosters.delete(slot.inventoryKey);
          } else {
            selectedBoosters.add(slot.inventoryKey);
          }
          window.CMRAudio?.playSfx?.("pop");
          window.CMRProfile?.vibrate?.(10);
          render();
        });

        card.querySelector(".cmr-prelevel-buy-plus")?.addEventListener("click", (e) => {
          e.stopPropagation();
          buySingleBooster(slot);
        });

        boostersEl.appendChild(card);
      });
    }
  }

  function open(levelId, onStart) {
    ensureModal();
    activeLevelId = Math.max(1, Math.floor(Number(levelId) || 1));
    selectedBoosters = new Set();
    onStartCallback = typeof onStart === "function" ? onStart : null;
    render();
    modalEl.classList.remove("hidden");
    const stage = modalEl.querySelector("#prelevelStage");
    if (stage) {
      stage.classList.remove("is-pop-in");
      void stage.offsetWidth;
      stage.classList.add("is-pop-in");
    }
    window.CMRAudio?.playSfx?.("open");
  }

  function close() {
    if (!modalEl) return;
    modalEl.classList.add("hidden");
  }

  window.CMRPreLevelModal = {
    open,
    close,
    render,
    getActiveLevel: () => activeLevelId,
    getSelectedBoosters: () => Array.from(selectedBoosters),
  };
})();
