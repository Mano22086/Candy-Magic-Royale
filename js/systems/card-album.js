/* Candy Magic Royale — Phase 2 System 2: ألبوم الفراعنة (Pharaoh Card Collection)
 * Isolated module listening to CMREventBus ("stage:win").
 * Uses 02_Card_Album/event_ui_card_album.png with a 3x3 grid of 9 collectible Egyptian cards.
 * Awards +1 free Pharaoh Card Pack every 5 stage wins (starts with 2 free packs for immediate testing).
 * Features pack shake & tear-open golden flash, 3-card 3D rotateY(180deg) flip reveal with sparkles,
 * flying card arrival into album slots, and grand reward chest burst upon collecting all 9/9 cards.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root, require("../events/event-bus"));
  } else {
    root.CMRCardAlbum = factory(root, {
      EventBus: root.CMREventBus,
      EventFX: root.CMREventFX,
      EVENT_ASSETS: root.CMR_EVENT_ASSETS,
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root, busPkg) {
  "use strict";

  const STORAGE_KEY = "cmr_system_card_album_v1";
  const CONFIG = Object.freeze({
    STARTING_FREE_PACKS: 2,
    WINS_PER_PACK: 5,
    CARDS_PER_PACK: 3,
    DUPLICATE_COIN_BONUS: 35,
    GRAND_REWARD: Object.freeze({ coins: 3500, gems: 15, rockets: 3, paints: 3 }),
  });

  const ASSETS = busPkg?.EVENT_ASSETS || {
    cardAlbumFrame: "./public/assets/aistudio/event_ui_card_album_6eca2161.png",
    cardPackPharaoh: "./public/assets/aistudio/icon_card_pack_pharaoh_cbc27457.png",
    card01Scarab: "./public/assets/aistudio/card_01_scarab_4247642c.png",
    card02Pyramid: "./public/assets/aistudio/card_02_pyramid_5e27abf8.png",
    card03Lotus: "./public/assets/aistudio/card_03_lotus_f15c517b.png",
    card04Dragon: "./public/assets/aistudio/card_04_dragon_8cf36d15.png",
    card05Crown: "./public/assets/aistudio/card_05_crown_063689d6.png",
    card06HorusEye: "./public/assets/aistudio/card_06_horus_eye_7e5bc82b.png",
    card07Ankh: "./public/assets/aistudio/card_07_ankh_5e98293a.png",
    card08Bastet: "./public/assets/aistudio/card_08_bastet_8eb73ac7.png",
    card09Sphinx: "./public/assets/aistudio/card_09_sphinx_12ce88c7.png",
    chestOpenIcon: "./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png",
    coinIcon: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png",
  };

  const CARD_CATALOG = Object.freeze([
    { id: "card_01_scarab", titleAr: "الجعران الذهبي", stars: 1, img: ASSETS.card01Scarab },
    { id: "card_02_pyramid", titleAr: "هرم السكر", stars: 2, img: ASSETS.card02Pyramid },
    { id: "card_03_lotus", titleAr: "لوتس النيل", stars: 2, img: ASSETS.card03Lotus },
    { id: "card_04_dragon", titleAr: "تنين البلورات", stars: 3, img: ASSETS.card04Dragon },
    { id: "card_05_crown", titleAr: "التاج الملكي", stars: 3, img: ASSETS.card05Crown },
    { id: "card_06_horus_eye", titleAr: "عين حورس", stars: 4, img: ASSETS.card06HorusEye },
    { id: "card_07_ankh", titleAr: "مفتاح الحياة", stars: 4, img: ASSETS.card07Ankh },
    { id: "card_08_bastet", titleAr: "باستت الذهبية", stars: 5, img: ASSETS.card08Bastet },
    { id: "card_09_sphinx", titleAr: "أبو الهول", stars: 5, img: ASSETS.card09Sphinx },
  ]);

  // =========================================================================
  // PURE LOGIC ENGINE (Unit-Tested)
  // =========================================================================
  function createCardAlbumEngine(initial = {}, rng = Math.random) {
    const validIds = new Set(CARD_CATALOG.map((c) => c.id));
    const initOwned = Array.isArray(initial.ownedCards)
      ? initial.ownedCards.filter((id) => validIds.has(id))
      : [];

    let state = {
      packs:
        initial.packs === undefined
          ? CONFIG.STARTING_FREE_PACKS
          : Math.max(0, Math.floor(Number(initial.packs) || 0)),
      winsTowardPack: Math.max(
        0,
        Math.min(CONFIG.WINS_PER_PACK - 1, Math.floor(Number(initial.winsTowardPack) || 0))
      ),
      ownedSet: new Set(initOwned),
      duplicateCounts:
        initial.duplicateCounts && typeof initial.duplicateCounts === "object"
          ? { ...initial.duplicateCounts }
          : {},
      grandRewardClaimed: Boolean(initial.grandRewardClaimed),
      albumsCompleted: Math.max(0, Math.floor(Number(initial.albumsCompleted) || 0)),
    };

    function getState() {
      const cards = CARD_CATALOG.map((c) => ({
        ...c,
        unlocked: state.ownedSet.has(c.id),
        duplicates: Math.max(0, Math.floor(Number(state.duplicateCounts[c.id]) || 0)),
      }));
      const unlockedCount = state.ownedSet.size;
      const totalCards = CARD_CATALOG.length;
      const isComplete = unlockedCount >= totalCards;
      const canClaimGrand = isComplete && !state.grandRewardClaimed;
      return {
        packs: state.packs,
        winsTowardPack: state.winsTowardPack,
        winsPerPack: CONFIG.WINS_PER_PACK,
        unlockedCount,
        totalCards,
        isComplete,
        grandRewardClaimed: state.grandRewardClaimed,
        canClaimGrand,
        albumsCompleted: state.albumsCompleted,
        cards,
      };
    }

    function recordStageWin() {
      state.winsTowardPack += 1;
      let earnedPack = false;
      if (state.winsTowardPack >= CONFIG.WINS_PER_PACK) {
        state.winsTowardPack = 0;
        state.packs += 1;
        earnedPack = true;
      }
      return { earnedPack, state: getState() };
    }

    function addPacks(count = 1) {
      const inc = Math.max(1, Math.floor(Number(count) || 1));
      state.packs += inc;
      return getState();
    }

    function openPack() {
      if (state.packs <= 0) {
        return { ok: false, reason: "no_packs", drawn: [], duplicateBonusCoins: 0, state: getState() };
      }
      state.packs -= 1;

      const missing = CARD_CATALOG.filter((c) => !state.ownedSet.has(c.id));
      const drawn = [];
      let duplicateBonusCoins = 0;

      // Guarantee at least 1-2 new cards per pack whenever missing cards exist so collection feels generous & rewarding
      for (let i = 0; i < CONFIG.CARDS_PER_PACK; i++) {
        let picked = null;
        if (missing.length > 0 && (i < 2 || rng() < 0.7)) {
          const idx = Math.floor(rng() * missing.length);
          picked = missing.splice(idx, 1)[0];
        } else {
          picked = CARD_CATALOG[Math.floor(rng() * CARD_CATALOG.length)];
        }
        const isNew = !state.ownedSet.has(picked.id);
        if (isNew) {
          state.ownedSet.add(picked.id);
        } else {
          state.duplicateCounts[picked.id] = (state.duplicateCounts[picked.id] || 0) + 1;
          duplicateBonusCoins += CONFIG.DUPLICATE_COIN_BONUS;
        }
        drawn.push({
          ...picked,
          isNew,
        });
      }

      return {
        ok: true,
        drawn,
        duplicateBonusCoins,
        completedNow: state.ownedSet.size >= CARD_CATALOG.length && !state.grandRewardClaimed,
        state: getState(),
      };
    }

    function claimGrandReward() {
      if (state.ownedSet.size < CARD_CATALOG.length) {
        return { ok: false, reason: "album_incomplete", reward: null, state: getState() };
      }
      if (state.grandRewardClaimed) {
        return { ok: false, reason: "already_claimed", reward: null, state: getState() };
      }
      state.grandRewardClaimed = true;
      state.albumsCompleted += 1;
      return {
        ok: true,
        reward: { ...CONFIG.GRAND_REWARD },
        state: getState(),
      };
    }

    function exportState() {
      return {
        packs: state.packs,
        winsTowardPack: state.winsTowardPack,
        ownedCards: Array.from(state.ownedSet),
        duplicateCounts: { ...state.duplicateCounts },
        grandRewardClaimed: state.grandRewardClaimed,
        albumsCompleted: state.albumsCompleted,
      };
    }

    return { getState, recordStageWin, addPacks, openPack, claimGrandReward, exportState };
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

  const engine = createCardAlbumEngine(loadPersisted());
  const bus = busPkg?.EventBus;
  const fx = busPkg?.EventFX;

  let modalEl = null;
  let isOpeningPack = false;

  function notifyBadgeUpdate() {
    bus?.emit?.("events:badge-update", { source: "card-album" });
  }

  function ensureModal() {
    if (!hasDOM) return null;
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.id = "cardAlbumModal";
    modalEl.className = "modal ev-modal hidden";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "cardAlbumTitle");

    modalEl.innerHTML = `
      <div class="ev-stage ev-stage-card-album" dir="rtl">
        <img class="ev-frame-img" src="${ASSETS.cardAlbumFrame}" alt="" aria-hidden="true" draggable="false">
        <h2 class="ev-ribbon-title ev-title-card-album" id="cardAlbumTitle">ألبوم الفراعنة</h2>
        <button type="button" class="ev-close-orb ev-close-card-album" id="cardAlbumCloseBtn" aria-label="إغلاق ألبوم الفراعنة">
          <span aria-hidden="true">✕</span>
        </button>

        <div class="ev-inner-safe ev-safe-card-album">
          <!-- Album Progress & Grand Chest Header -->
          <div class="ev-ca-header">
            <div class="ev-ca-progress-info">
              <div class="ev-ca-prog-row">
                <strong>البطاقات: <b id="caCountVal" dir="ltr">0 / 9</b></strong>
                <span id="caPackProgressText">حزمة مجانية كل 5 انتصارات (0/5)</span>
              </div>
              <div class="ev-ca-bar-track">
                <div class="ev-ca-bar-fill" id="caProgFill" style="width:0%"></div>
              </div>
            </div>
            <button type="button" class="ev-ca-grand-chest-btn" id="caGrandChestBtn" aria-label="صندوق جائزة الألبوم الكبرى" title="جائزة إكمال الألبوم">
              <img src="${ASSETS.chestOpenIcon}" alt="الجائزة الكبرى" draggable="false">
              <span id="caGrandChestTag">9/9</span>
            </button>
          </div>

          <!-- 3x3 Pharaoh Card Collection Grid -->
          <div class="ev-ca-grid" id="caCardGrid" role="list" aria-label="بطاقات ألبوم الفراعنة"></div>

          <!-- Pharaoh Pack Dock & Open Pack CTA -->
          <div class="ev-ca-pack-dock">
            <div class="ev-ca-pack-badge">
              <img src="${ASSETS.cardPackPharaoh}" alt="" draggable="false">
              <div>
                <strong>حزم الفراعنة</strong>
                <small id="caPacksCountLabel">لديك 2 حزم جاهزة</small>
              </div>
            </div>
            <button type="button" class="ev-ca-open-pack-btn" id="caOpenPackBtn">
              <span id="caOpenPackLabel">افتح حزمة (2)</span>
            </button>
          </div>

          <!-- Pack Opening Cinematic Overlay (Shake -> Golden Flash -> 3D rotateY Flip -> Fly to Slots) -->
          <div class="ev-ca-pack-stage hidden" id="caPackStage" aria-live="polite">
            <div class="ev-ca-flash-veil" id="caFlashVeil" aria-hidden="true"></div>
            <div class="ev-ca-pack-wrap" id="caPackWrap">
              <img class="ev-ca-pack-art" id="caPackArtImg" src="${ASSETS.cardPackPharaoh}" alt="حزمة بطاقات الفراعنة" draggable="false">
              <span class="ev-ca-pack-caption" id="caPackCaption">جاري فتح الحزمة الملكية...</span>
            </div>
            <div class="ev-ca-reveal-row hidden" id="caRevealRow"></div>
            <button type="button" class="ev-ca-collect-btn hidden" id="caCollectCardsBtn">إضافة للألبوم ✨</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl && !isOpeningPack) close();
    });
    modalEl.querySelector("#cardAlbumCloseBtn").addEventListener("click", () => {
      if (!isOpeningPack) close();
    });

    modalEl.querySelector("#caOpenPackBtn").addEventListener("click", startPackOpening);

    modalEl.querySelector("#caGrandChestBtn").addEventListener("click", () => {
      const res = engine.claimGrandReward();
      if (!res.ok) {
        const st = engine.getState();
        if (res.reason === "already_claimed") {
          fx?.showToast?.("🏆 لقد استلمت جائزة إكمال ألبوم الفراعنة الكبرى!");
        } else {
          window.CMRAudio?.playSfx?.("invalid");
          fx?.showToast?.(`اجمع البطاقات الـ ${st.totalCards - st.unlockedCount} المتبقية لفتح الصندوق الملكي (+3,500 عملة و15 جوهرة)!`);
        }
        return;
      }
      savePersisted(engine.exportState());
      window.CMRProfile?.vibrate?.([26, 28, 34]);
      window.CMRAudio?.playSfx?.("win");
      const chestBtn = modalEl.querySelector("#caGrandChestBtn");
      fx?.spawnSparkleBurst?.(chestBtn, { count: 28 });
      fx?.launchCoinBurst?.(chestBtn, { count: 24, iconSrc: ASSETS.coinIcon, targetKind: "coins" });
      fx?.grantReward?.(res.reward);
      fx?.showToast?.("👑 ألبوم مكتمل! حصلت على +3,500 عملة و+15 جوهرة ومعززات ملكية!");
      render();
      notifyBadgeUpdate();
    });

    return modalEl;
  }

  function flyNewCardsToAlbumSlots(drawn) {
    if (!modalEl) return;
    const revealCards = modalEl.querySelectorAll("#caRevealRow .ev-ca-flip-card");
    drawn.forEach((card, idx) => {
      if (!card.isNew) return;
      const fromEl = revealCards[idx];
      const slotEl = modalEl.querySelector(`.ev-ca-slot[data-card-id="${card.id}"]`);
      if (!fromEl || !slotEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = slotEl.getBoundingClientRect();
      const ghost = document.createElement("img");
      ghost.className = "ev-ca-fly-card";
      ghost.src = card.img;
      ghost.alt = "";
      ghost.style.left = `${Math.round(fromRect.left + fromRect.width / 2)}px`;
      ghost.style.top = `${Math.round(fromRect.top + fromRect.height / 2)}px`;
      ghost.style.setProperty("--card-dx", `${Math.round(toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2))}px`);
      ghost.style.setProperty("--card-dy", `${Math.round(toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2))}px`);
      document.body.appendChild(ghost);
      setTimeout(() => {
        ghost.remove();
        slotEl.classList.add("is-just-unlocked");
        fx?.spawnSparkleBurst?.(slotEl, { count: 10 });
        setTimeout(() => slotEl.classList.remove("is-just-unlocked"), 700);
      }, 540);
    });
  }

  function startPackOpening() {
    if (isOpeningPack || !modalEl) return;
    const res = engine.openPack();
    if (!res.ok) {
      window.CMRAudio?.playSfx?.("invalid");
      fx?.showToast?.("لا توجد حزم حالياً! اربح 5 مراحل للحصول على حزمة فراعنة مجانية.");
      return;
    }

    savePersisted(engine.exportState());
    isOpeningPack = true;

    const stage = modalEl.querySelector("#caPackStage");
    const packWrap = modalEl.querySelector("#caPackWrap");
    const packArt = modalEl.querySelector("#caPackArtImg");
    const flashVeil = modalEl.querySelector("#caFlashVeil");
    const revealRow = modalEl.querySelector("#caRevealRow");
    const collectBtn = modalEl.querySelector("#caCollectCardsBtn");

    stage.classList.remove("hidden");
    packWrap.classList.remove("hidden", "is-torn");
    revealRow.classList.add("hidden");
    revealRow.innerHTML = "";
    collectBtn.classList.add("hidden");

    // Step 1: Shake & tear open the Pharaoh Card Pack
    window.CMRAudio?.playSfx?.("open");
    window.CMRProfile?.vibrate?.([18, 28, 22]);
    packArt.classList.remove("is-shaking");
    void packArt.offsetWidth;
    packArt.classList.add("is-shaking");

    setTimeout(() => {
      // Golden flash burst
      flashVeil.classList.remove("is-flashing");
      void flashVeil.offsetWidth;
      flashVeil.classList.add("is-flashing");
      packWrap.classList.add("is-torn");
      fx?.spawnSparkleBurst?.(packArt, { count: 24 });
      window.CMRAudio?.playSfx?.("reward");
    }, 480);

    setTimeout(() => {
      packWrap.classList.add("hidden");
      revealRow.classList.remove("hidden");

      // Step 2: Deal 3 cards with smooth 3D CSS rotateY(180deg) flip animations
      res.drawn.forEach((card, i) => {
        const cardEl = document.createElement("div");
        cardEl.className = "ev-ca-flip-card";
        cardEl.innerHTML = `
          <div class="ev-ca-flip-inner">
            <div class="ev-ca-flip-back">
              <img src="${ASSETS.cardPackPharaoh}" alt="" draggable="false">
            </div>
            <div class="ev-ca-flip-front ${card.isNew ? "is-new-card" : "is-dup-card"}">
              <img src="${card.img}" alt="${card.titleAr}" draggable="false">
              <span class="ev-ca-flip-tag">${card.isNew ? "جديدة ★" : `+${CONFIG.DUPLICATE_COIN_BONUS} عملة`}</span>
              <strong class="ev-ca-flip-name">${card.titleAr}</strong>
            </div>
          </div>
        `;
        revealRow.appendChild(cardEl);

        setTimeout(() => {
          cardEl.classList.add("is-flipped");
          fx?.spawnSparkleBurst?.(cardEl, { count: card.isNew ? 14 : 8 });
          window.CMRAudio?.playSfx?.(card.isNew ? "win" : "swap");
        }, 180 + i * 240);
      });

      if (res.duplicateBonusCoins > 0) {
        fx?.grantReward?.({ coins: res.duplicateBonusCoins });
      }

      setTimeout(() => {
        collectBtn.classList.remove("hidden");
      }, 950);
    }, 760);

    // Step 3: Collect button flies new cards into their 3x3 album slots
    collectBtn.onclick = () => {
      flyNewCardsToAlbumSlots(res.drawn);
      stage.classList.add("hidden");
      isOpeningPack = false;
      render();
      notifyBadgeUpdate();

      if (res.completedNow) {
        const chestBtn = modalEl.querySelector("#caGrandChestBtn");
        fx?.spawnSparkleBurst?.(chestBtn, { count: 24 });
        fx?.showToast?.("🎉 أكملت ألبوم الفراعنة 9/9! اضغط على الصندوق الذهبي لاستلام الجائزة الكبرى!");
      } else if (res.duplicateBonusCoins > 0) {
        fx?.showToast?.(`✨ تمت إضافة البطاقات +${res.duplicateBonusCoins} عملة من التكرار!`);
      }
    };
  }

  function render() {
    if (!modalEl) return;
    const st = engine.getState();

    const countEl = modalEl.querySelector("#caCountVal");
    const progTxt = modalEl.querySelector("#caPackProgressText");
    const progFill = modalEl.querySelector("#caProgFill");
    const grandBtn = modalEl.querySelector("#caGrandChestBtn");
    const grandTag = modalEl.querySelector("#caGrandChestTag");
    const grid = modalEl.querySelector("#caCardGrid");
    const packsLbl = modalEl.querySelector("#caPacksCountLabel");
    const openBtn = modalEl.querySelector("#caOpenPackBtn");
    const openLbl = modalEl.querySelector("#caOpenPackLabel");

    if (countEl) countEl.textContent = `${st.unlockedCount} / ${st.totalCards}`;
    if (progTxt) progTxt.textContent = `حزمة كل 5 انتصارات (${st.winsTowardPack}/${st.winsPerPack})`;
    if (progFill) progFill.style.width = `${Math.round((st.unlockedCount / st.totalCards) * 100)}%`;

    if (grandBtn && grandTag) {
      grandBtn.classList.toggle("is-claimable", st.canClaimGrand);
      grandBtn.classList.toggle("is-claimed", st.grandRewardClaimed);
      grandTag.textContent = st.grandRewardClaimed ? "تم ✓" : st.canClaimGrand ? "استلام!" : `${st.unlockedCount}/9`;
    }

    if (packsLbl) {
      packsLbl.textContent = st.packs > 0 ? `لديك ${st.packs} حزم جاهزة للفتح` : "اربح مراحل لجمع الحزم";
    }
    if (openBtn && openLbl) {
      openBtn.disabled = st.packs <= 0;
      openBtn.classList.toggle("is-ready", st.packs > 0);
      openLbl.textContent = st.packs > 0 ? `افتح حزمة (${st.packs})` : "افتح حزمة (0)";
    }

    if (!grid) return;
    grid.innerHTML = "";
    st.cards.forEach((card) => {
      const slot = document.createElement("div");
      slot.className = `ev-ca-slot ${card.unlocked ? "is-unlocked" : "is-locked"}`;
      slot.dataset.cardId = card.id;
      slot.setAttribute("role", "listitem");
      slot.innerHTML = `
        <div class="ev-ca-slot-art">
          <img src="${card.img}" alt="${card.titleAr}" draggable="false">
          ${card.unlocked ? `<span class="ev-ca-shimmer" aria-hidden="true"></span>` : `<span class="ev-ca-lock-badge" aria-hidden="true">🔒</span>`}
        </div>
        <span class="ev-ca-slot-title">${card.titleAr}</span>
      `;
      grid.appendChild(slot);
    });
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
      if (res.earnedPack) {
        fx?.showToast?.("🃏 حصلت على حزمة بطاقات فراعنة مجانية في ألبوم الفراعنة!");
      }
      notifyBadgeUpdate();
    });
  }

  return {
    CONFIG,
    CARD_CATALOG,
    createCardAlbumEngine,
    getState: () => engine.getState(),
    hasNotification: () => {
      const st = engine.getState();
      return st.packs > 0 || st.canClaimGrand;
    },
    addFreePacks: (n = 1) => {
      const st = engine.addPacks(n);
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
