/* Candy Magic Royale — Vertical Fantasy World Map, 10 Interactive Transparent Palaces,
 * Sticky Player Information Banner, Royal Action Dock & Dedicated 100-Level Palace View.
 * Preserves all existing window hooks: CMRGetBoardArtUrl, CMRShowWorldMap, CMRHideWorldMap, CMRRefreshWorldMap.
 */
(() => {
  "use strict";

  const SAVE_KEY = "cmr_reborn_v1";
  const RANGE_SIZE = 25;
  const WORLD_MAP_BG_SRC = "./public/assets/aistudio/Picsart_26-11-25_18-52-31-817_a4649afd.jpg";

  // Measured exact centers (%) of the 5x20 circular slots across the (512x2064) palace interior maps
  const INTERIOR_COL_X = [20.6, 35.2, 49.8, 64.4, 79.0];
  const INTERIOR_ROW_Y = [
    14.95, 18.7, 22.45, 26.15, 29.85,
    33.55, 37.25, 41.0, 44.75, 48.45,
    52.2, 55.95, 59.65, 64.1, 67.9,
    71.7, 75.5, 79.35, 83.2, 87.0,
  ];
  // Palace 1's throne dais occupies the top row (14.95%), so its 19 drawn circle rows begin at 18.70%
  const PALACE_1_ROW_Y = [
    18.7, 22.45, 26.15, 29.85, 33.55,
    37.25, 41.0, 44.75, 48.45, 52.2,
    55.95, 59.65, 64.1, 67.9, 71.7,
    75.5, 79.35, 83.2, 87.0, 89.95,
  ];

  let overlay = null;
  let currentView = "palaces"; // "palaces" | "stages"
  let activePalaceIndex = 0;
  let mapZoomed = false;

  function core() {
    return window.CMRCore;
  }

  function i18n(key, vars) {
    return window.CMRI18n ? window.CMRI18n.t(key, vars) : key;
  }

  function isEnglish() {
    return window.CMRI18n?.getLanguage?.() === "en";
  }

  function readProgress() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function getUnlockedStage() {
    const saved = readProgress();
    const raw = Math.floor(Number(saved.highestUnlocked) || Number(saved.level) || 1);
    const completed = Boolean(saved.completed);
    const effective = completed ? Math.max(raw, Math.floor(Number(saved.level) || 1) + 1) : raw;
    return core().clampStage(effective);
  }

  function getStageStarsMap() {
    const saved = readProgress();
    return saved.stageStars && typeof saved.stageStars === "object" ? saved.stageStars : {};
  }

  function getPlayerSummary() {
    if (window.CMRProfile && typeof window.CMRProfile.getProfileState === "function") {
      return window.CMRProfile.getProfileState();
    }
    const saved = readProgress();
    const lives = saved.lives === undefined ? 5 : Math.max(0, Math.min(5, Math.floor(Number(saved.lives) || 0)));
    const coins = Number.isFinite(Number(saved.coins)) ? Math.max(0, Math.floor(Number(saved.coins))) : 500;
    const gems = Number.isFinite(Number(saved.gems)) ? Math.max(0, Math.floor(Number(saved.gems))) : 25;
    const stars = Number.isFinite(Number(saved.stars)) ? Math.max(0, Math.floor(Number(saved.stars))) : 0;
    const unlocked = getUnlockedStage();
    const rawProg = core().computePlayerProgression({ completedStages: Math.max(0, unlocked - 1), stars });
    const rawAv = core().getAvatarById("pharaoh_prince");
    return {
      displayName: saved.displayName || i18n("guestName"),
      avatar: { ...rawAv, img: rawAv.src },
      highestUnlocked: unlocked,
      stars,
      coins,
      gems,
      lives,
      stageStars: getStageStarsMap(),
      progression: { ...rawProg, playerLevel: rawProg.level, xpPercent: rawProg.progressPercent },
      claimableAchCount: 0,
    };
  }

  function getBoardArtUrl(globalStage) {
    const meta = core().getStageMeta(globalStage);
    return Promise.resolve(meta.boardImagePath);
  }

  function showToast(message) {
    if (window.CMRProfile && !window.CMRProfile.canNotify()) return;
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(t.__wmTimer);
    t.__wmTimer = setTimeout(() => t.classList.remove("show"), 2300);
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("section");
    overlay.id = "worldMap";
    overlay.className = "world-map cmr-vmap hidden";
    overlay.setAttribute("aria-label", i18n("mapTitle"));

    overlay.innerHTML = `
      <!-- Sticky Top Player Information Banner (Uses Supplied Blue/Gold Player Banner Asset) -->
      <header class="vmap-topbar" id="vmapTopbar">
        <button type="button" class="vmap-player-banner" id="vmapPlayerBannerBtn" dir="ltr" aria-label="${i18n("openProfileAria")}">
          <div class="vmap-banner-avatar-well" aria-hidden="true">
            <img id="vmapBannerAvatar" src="./assets/extracted/ui/avatar_pharaoh_portrait.png" alt="">
          </div>
          <img class="vmap-banner-frame" src="./assets/extracted/ui/player_map_banner_clean.png" alt="" aria-hidden="true">
          <div class="vmap-banner-info">
            <strong id="vmapBannerName">لاعب ضيف</strong>
            <div class="vmap-banner-stars-row">
              <img src="./assets/extracted/ui/icon_star_gold.png" alt="">
              <span id="vmapBannerStars">0</span>
            </div>
            <div class="vmap-banner-xp-track" aria-hidden="true">
              <i id="vmapBannerXpFill"></i>
            </div>
          </div>
          <div class="vmap-banner-level-shield">
            <small>Lv</small>
            <b id="vmapBannerLevel">1</b>
          </div>
        </button>

        <div class="vmap-resources" aria-label="Resources">
          <button type="button" class="vmap-res-pill vmap-res-coins" id="vmapResCoinsBtn" aria-label="${i18n("openShopAria")}">
            <img src="./public/assets/aistudio/06_shop_gold_coin_50095eb1.png" alt="">
            <b id="wmCoins">500</b>
          </button>
          <button type="button" class="vmap-res-pill vmap-res-gems" id="vmapResGemsBtn" aria-label="${i18n("openShopAria")}">
            <img src="./assets/extracted/ui/icon_gem_purple.png" alt="">
            <b id="wmGems">25</b>
          </button>
          <button type="button" class="vmap-res-pill vmap-res-hearts" id="vmapResHeartsBtn" aria-label="${i18n("openShopAria")}">
            <img src="./assets/extracted/ui/icon_heart_ruby.png" alt="">
            <b id="wmHearts">5</b>
          </button>
          <button type="button" class="vmap-gear-btn" id="wmSettingsBtn" aria-label="${i18n("openProfileAria")}" title="${i18n("openProfileAria")}">
            <img src="./assets/extracted/ui/icon_settings_gear.png" alt="">
          </button>
        </div>
      </header>

      <!-- Scrollable Vertical World Map Stage OR Dedicated Palace 100-Level View -->
      <div class="vmap-scroll" id="wmScroll">
        <div class="vmap-world-host" id="wmWorld"></div>
      </div>

      <!-- Floating Daily Lucky Spin Wheel Trigger (Bottom-Left of World Map) -->
      <button type="button" class="vmap-wheel-fab" id="wmWheelBtn" aria-label="عجلة الحظ اليومية" title="عجلة الحظ اليومية">
        <img src="./public/assets/aistudio/lucky_wheel_1_compact_1_1_e76b2f6a.png" alt="">
        <span class="vmap-wheel-fab-label" id="wmWheelLabel">عجلة الحظ</span>
        <span class="vmap-wheel-fab-badge" id="wmWheelBadge">1/1</span>
      </button>

      <!-- Floating Map Utility Controls (My Location, Zoom, Main Menu) -->
      <div class="vmap-float-tools" id="vmapFloatTools">
        <button type="button" class="vmap-mini-fab" id="wmLocateBtn" aria-label="${i18n("myLocation")}" title="${i18n("myLocation")}">
          <img src="./assets/extracted/ui/icon_star_gold.png" alt="">
          <span id="wmLocateLabel">${i18n("myLocation")}</span>
        </button>
        <button type="button" class="vmap-mini-fab" id="wmZoomBtn" aria-label="${i18n("zoomMap")}" title="${i18n("zoomMap")}">
          <b id="wmZoomLabel">1×</b>
        </button>
        <button type="button" class="vmap-mini-fab" id="wmHomeBtn" aria-label="${i18n("mainMenu")}" title="${i18n("mainMenu")}">
          <img src="./assets/packs/buttons/icon_home.png" alt="">
          <span id="wmHomeLabel">${i18n("mainMenu")}</span>
        </button>
      </div>

      <!-- Magical Palace Transition Veil -->
      <div class="vmap-magic-veil hidden" id="vmapMagicVeil" aria-hidden="true"></div>

      <!-- Compact Bottom Royal Action Dock (All Extracted Circular UI Assets) -->
      <nav class="vmap-dock" id="vmapDock" aria-label="Kingdom Actions">
        <button type="button" class="vmap-dock-icon" id="dockStatsBtn" aria-label="${i18n("openAchievementsAria")}">
          <img src="./assets/extracted/ui/btn_stats.png" alt="">
          <span class="vmap-dock-badge hidden" id="dockAchBadge">0</span>
        </button>
        <button type="button" class="vmap-dock-icon" id="dockCalendarBtn" aria-label="${i18n("openCalendarAria")}">
          <img src="./assets/extracted/ui/btn_calendar.png" alt="">
        </button>
        <button type="button" class="vmap-dock-play" id="wmQuickPlay" aria-label="${i18n("playNow")}">
          <img src="./assets/extracted/ui/btn_play_round.png" alt="">
          <span id="wmQuickPlayLevel">1</span>
        </button>
        <button type="button" class="vmap-dock-icon" id="dockFriendsBtn" aria-label="${i18n("openFriendsAria")}">
          <img src="./assets/extracted/ui/btn_friends.png" alt="">
        </button>
        <button type="button" class="vmap-dock-icon" id="dockMailBtn" aria-label="${i18n("openMailAria")}">
          <img src="./assets/extracted/ui/btn_mail.png" alt="">
        </button>
        <button type="button" class="vmap-dock-icon" id="wmShopBtn" aria-label="${i18n("openShopAria")}">
          <img src="./assets/extracted/ui/btn_gift.png" alt="">
        </button>
      </nav>
    `;

    document.body.appendChild(overlay);

    // Top banner & settings -> Player Profile & Settings screen
    overlay.querySelector("#vmapPlayerBannerBtn").addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(12);
      window.CMRAudio?.playSfx?.("swap");
      window.CMRProfile?.openProfile?.();
    });
    overlay.querySelector("#wmSettingsBtn").addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(12);
      window.CMRAudio?.playSfx?.("swap");
      window.CMRProfile?.openProfile?.();
    });

    // Resource pills -> Store
    overlay.querySelector("#vmapResCoinsBtn").addEventListener("click", () => window.CMRStore?.open?.("coins"));
    overlay.querySelector("#vmapResGemsBtn").addEventListener("click", () => window.CMRStore?.open?.("gems"));
    overlay.querySelector("#vmapResHeartsBtn").addEventListener("click", () => window.CMRStore?.open?.("hearts"));

    // Bottom Dock circular icons
    overlay.querySelector("#dockStatsBtn").addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(12);
      window.CMRProfile?.openAchievements?.();
    });
    overlay.querySelector("#dockCalendarBtn").addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(12);
      window.CMRProfile?.openCalendar?.();
    });
    overlay.querySelector("#dockFriendsBtn").addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(12);
      window.CMRProfile?.openFriends?.();
    });
    overlay.querySelector("#dockMailBtn").addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(12);
      window.CMRProfile?.openMail?.();
    });
    overlay.querySelector("#wmShopBtn").addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(12);
      window.CMRStore?.open?.("featured");
    });

    // Floating Daily Lucky Spin Wheel trigger
    const wheelBtn = overlay.querySelector("#wmWheelBtn");
    if (wheelBtn) {
      wheelBtn.addEventListener("click", () => {
        window.CMRProfile?.vibrate?.(14);
        window.CMRAudio?.playSfx?.("swap");
        window.CMRLuckyWheel?.open?.();
      });
    }

    // Center winged green Play button -> current unlocked level
    overlay.querySelector("#wmQuickPlay").addEventListener("click", async () => {
      window.CMRProfile?.vibrate?.(16);
      const unlocked = getUnlockedStage();
      await openStage(unlocked);
    });

    // Floating map tools
    overlay.querySelector("#wmLocateBtn").addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(10);
      focusCurrentLocation(true);
    });

    overlay.querySelector("#wmZoomBtn").addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(10);
      mapZoomed = !mapZoomed;
      const canvas = overlay.querySelector("#vmapCanvas");
      const zLabel = overlay.querySelector("#wmZoomLabel");
      if (canvas) canvas.classList.toggle("is-zoomed", mapZoomed);
      if (zLabel) zLabel.textContent = mapZoomed ? "1.2×" : "1×";
      setTimeout(() => focusCurrentLocation(true), 120);
    });

    overlay.querySelector("#wmHomeBtn").addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(12);
      hide();
      window.CMRShowMainMenu?.();
    });

    return overlay;
  }

  function updateBannerAndDock() {
    ensureOverlay();
    const st = getPlayerSummary();
    const avatarEl = overlay.querySelector("#vmapBannerAvatar");
    const nameEl = overlay.querySelector("#vmapBannerName");
    const starsEl = overlay.querySelector("#vmapBannerStars");
    const xpFill = overlay.querySelector("#vmapBannerXpFill");
    const lvlEl = overlay.querySelector("#vmapBannerLevel");
    const coinsEl = overlay.querySelector("#wmCoins");
    const gemsEl = overlay.querySelector("#wmGems");
    const heartsEl = overlay.querySelector("#wmHearts");
    const playLvlEl = overlay.querySelector("#wmQuickPlayLevel");
    const achBadge = overlay.querySelector("#dockAchBadge");

    if (avatarEl && st.avatar) avatarEl.src = st.avatar.img;
    if (nameEl) nameEl.textContent = st.displayName;
    if (starsEl) starsEl.textContent = st.stars.toLocaleString("en-US");
    if (xpFill) xpFill.style.width = `${Math.max(8, st.progression.xpPercent)}%`;
    if (lvlEl) lvlEl.textContent = String(st.progression.playerLevel);
    if (coinsEl) coinsEl.textContent = st.coins.toLocaleString("en-US");
    if (gemsEl) gemsEl.textContent = st.gems.toLocaleString("en-US");
    if (heartsEl) heartsEl.textContent = String(st.lives);
    if (playLvlEl) playLvlEl.textContent = String(st.highestUnlocked);
    window.CMRLuckyWheel?.syncBadge?.();

    const wheelLbl = overlay.querySelector("#wmWheelLabel");
    if (wheelLbl) wheelLbl.textContent = isEnglish() ? "Lucky Wheel" : "عجلة الحظ";

    if (achBadge) {
      if (st.claimableAchCount > 0) {
        achBadge.textContent = String(st.claimableAchCount);
        achBadge.classList.remove("hidden");
      } else {
        achBadge.classList.add("hidden");
      }
    }

    // Update localized aria-labels & mini labels
    overlay.setAttribute("aria-label", i18n("mapTitle"));
    overlay.querySelector("#vmapPlayerBannerBtn")?.setAttribute("aria-label", i18n("openProfileAria"));
    overlay.querySelector("#wmSettingsBtn")?.setAttribute("aria-label", i18n("openProfileAria"));
    overlay.querySelector("#dockStatsBtn")?.setAttribute("aria-label", i18n("openAchievementsAria"));
    overlay.querySelector("#dockCalendarBtn")?.setAttribute("aria-label", i18n("openCalendarAria"));
    overlay.querySelector("#dockFriendsBtn")?.setAttribute("aria-label", i18n("openFriendsAria"));
    overlay.querySelector("#dockMailBtn")?.setAttribute("aria-label", i18n("openMailAria"));
    overlay.querySelector("#wmShopBtn")?.setAttribute("aria-label", i18n("openShopAria"));
    overlay.querySelector("#wmQuickPlay")?.setAttribute("aria-label", i18n("playLevel", { n: st.highestUnlocked }));
    const locLbl = overlay.querySelector("#wmLocateLabel");
    if (locLbl) locLbl.textContent = i18n("myLocation");
    const homeLbl = overlay.querySelector("#wmHomeLabel");
    if (homeLbl) homeLbl.textContent = i18n("mainMenu");
  }

  function focusCurrentLocation(smooth = true) {
    if (!overlay) return;
    const target =
      currentView === "stages"
        ? overlay.querySelector(".pls-slot-node.is-current") ||
          overlay.querySelector(".pls-slot-node.is-done") ||
          overlay.querySelector(".pls-slot-node")
        : overlay.querySelector(".vmap-palace-node.is-active") || overlay.querySelector(".vmap-palace-node");
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center", inline: "center" });
    }
  }

  function playMagicTransition(callback) {
    const veil = overlay?.querySelector("#vmapMagicVeil");
    if (!veil) {
      callback();
      return;
    }
    veil.classList.remove("hidden");
    veil.classList.add("is-flashing");
    setTimeout(() => {
      callback();
      setTimeout(() => {
        veil.classList.remove("is-flashing");
        veil.classList.add("hidden");
      }, 240);
    }, 200);
  }

  async function openStage(globalStage, triggerBtn) {
    const unlocked = getUnlockedStage();
    if (globalStage > unlocked) {
      window.CMRProfile?.vibrate?.([25, 30, 25]);
      window.CMRAudio?.playSfx?.("invalid");
      showToast(i18n("levelLockedToast", { req: Math.max(1, globalStage - 1) }));
      return;
    }
    const st = getPlayerSummary();
    if (st.lives <= 0) {
      if (window.CMRGame && typeof window.CMRGame.openOutOfHeartsModal === "function") {
        window.CMRGame.openOutOfHeartsModal();
      } else {
        showToast(i18n("noHeartsToast"));
        window.CMRStore?.open?.("hearts");
      }
      return;
    }
    const launch = window.CMRStartSelectedHouse;
    if (typeof launch !== "function") {
      showToast("Game engine initializing...");
      return;
    }
    // Immediately stop map background music the moment the player enters a gameplay stage
    window.CMRAudio?.setMapMusicActive?.(false);
    if (triggerBtn) triggerBtn.disabled = true;
    try {
      const ok = await launch(globalStage);
      if (ok !== true) {
        if (triggerBtn) triggerBtn.disabled = false;
        if (overlay && !overlay.classList.contains("hidden")) {
          window.CMRAudio?.setMapMusicActive?.(true);
        }
      }
    } catch (err) {
      console.error("[CMR Map] Failed to open stage:", err);
      if (triggerBtn) triggerBtn.disabled = false;
      if (overlay && !overlay.classList.contains("hidden")) {
        window.CMRAudio?.setMapMusicActive?.(true);
      }
    }
  }

  function buildAmbientParticlesHtml() {
    // Subtle magical golden sparkles & drifting light motes across the vertical map
    const seeds = [
      { x: 18, y: 86, d: 0 }, { x: 82, y: 82, d: 1.2 }, { x: 56, y: 74, d: 2.1 },
      { x: 24, y: 65, d: 0.7 }, { x: 74, y: 58, d: 1.9 }, { x: 40, y: 49, d: 2.8 },
      { x: 66, y: 40, d: 0.4 }, { x: 20, y: 31, d: 1.5 }, { x: 60, y: 21, d: 2.4 },
      { x: 38, y: 12, d: 0.9 }, { x: 78, y: 15, d: 1.7 }, { x: 48, y: 62, d: 3.1 },
    ];
    return seeds
      .map(
        (s) =>
          `<span class="vmap-sparkle" style="left:${s.x}%;top:${s.y}%;animation-delay:${s.d}s" aria-hidden="true"></span>`
      )
      .join("");
  }

  function renderPalaces(autoScroll = true) {
    ensureOverlay();
    currentView = "palaces";
    updateBannerAndDock();

    const floatTools = overlay.querySelector("#vmapFloatTools");
    if (floatTools) floatTools.classList.remove("hidden");

    const st = getPlayerSummary();
    const unlocked = st.highestUnlocked;
    const stageStars = st.stageStars || {};
    const palaces = core().PALACES;
    const en = isEnglish();
    const worldEl = overlay.querySelector("#wmWorld");

    worldEl.className = "vmap-world-host is-world-view";
    worldEl.innerHTML = `
      <div class="vmap-canvas ${mapZoomed ? "is-zoomed" : ""}" id="vmapCanvas" data-testid="vertical-world-map">
        <img
          class="vmap-bg-img"
          src="${WORLD_MAP_BG_SRC}"
          alt="${i18n("mapTitle")}"
          draggable="false"
        >
        <!-- Subtle Floating Magical Particles -->
        <div class="vmap-particles" aria-hidden="true">${buildAmbientParticlesHtml()}</div>
        <!-- 10 Individual Interactive Transparent Palaces Layer -->
        <div class="vmap-palaces-layer" id="vmapPalacesLayer"></div>
      </div>
    `;

    const layer = worldEl.querySelector("#vmapPalacesLayer");

    palaces.forEach((palace) => {
      const summary = core().getPalaceProgressSummary(palace.index, unlocked, stageStars);
      const name = en ? palace.nameEn || palace.name : palace.name;
      const tag = en ? palace.tagEn || palace.tag : palace.tag;
      const stateClass = summary.isCompleted ? "is-done" : summary.isActive ? "is-active" : "is-locked";
      const pos = palace.mapPos || { x: 50, y: 50, scale: 1 };

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `vmap-palace-node ${stateClass}`;
      btn.dataset.palaceIndex = String(palace.index);
      btn.dataset.palaceId = palace.id;
      btn.style.left = `${pos.x}%`;
      btn.style.top = `${pos.y}%`;
      btn.style.setProperty("--palace-accent", palace.accent || "#ffd86b");
      btn.style.setProperty("--palace-scale", String(pos.scale || 1));
      btn.setAttribute(
        "aria-label",
        `${tag}: ${name} (${i18n("levelsRange", { s: summary.startStage, e: summary.endStage })})`
      );

      btn.innerHTML = `
        ${
          summary.isActive
            ? `<span class="vmap-player-pin" aria-hidden="true">
                <img src="${st.avatar.img || st.avatar.src}" alt="">
                <b>${i18n("youAreHere")}</b>
              </span>`
            : ""
        }
        <span class="vmap-palace-aura" aria-hidden="true"></span>
        <img
          class="vmap-palace-sprite"
          src="${palace.castleArt}"
          alt="${name}"
          loading="eager"
          draggable="false"
        >
        ${
          summary.isLocked
            ? `<span class="vmap-palace-lock" aria-hidden="true"><img src="./assets/packs/buttons/icon_lock.png" alt=""></span>`
            : summary.isCompleted
            ? `<span class="vmap-palace-check" aria-hidden="true"><img src="./assets/packs/buttons/icon_check.png" alt=""></span>`
            : ""
        }
        <span class="vmap-palace-plate">
          <strong>${name}</strong>
          <small>${summary.startStage}–${summary.endStage} · ⭐${summary.earnedStars}</small>
        </span>
      `;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.CMRProfile?.vibrate?.(18);
        window.CMRAudio?.playSfx?.("match");
        btn.classList.add("is-tapped");
        setTimeout(() => {
          btn.classList.remove("is-tapped");
          playMagicTransition(() => renderPalaceStages(palace.index));
        }, 190);
      });

      layer.appendChild(btn);
    });

    if (autoScroll) {
      requestAnimationFrame(() => {
        setTimeout(() => focusCurrentLocation(false), 60);
      });
    }
  }

  function renderPalaceStages(palaceIndex) {
    ensureOverlay();
    currentView = "stages";
    activePalaceIndex = Math.max(0, Math.min(core().PALACES_COUNT - 1, palaceIndex));
    updateBannerAndDock();

    const floatTools = overlay.querySelector("#vmapFloatTools");
    if (floatTools) floatTools.classList.add("hidden");

    const palace = core().PALACES[activePalaceIndex];
    const st = getPlayerSummary();
    const unlocked = st.highestUnlocked;
    const stageStars = st.stageStars || {};
    const summary = core().getPalaceProgressSummary(activePalaceIndex, unlocked, stageStars);
    const en = isEnglish();
    const name = en ? palace.nameEn || palace.name : palace.name;
    const tag = en ? palace.tagEn || palace.tag : palace.tag;
    const desc = en ? palace.descriptionEn || palace.description : palace.description;
    const palaceBase = activePalaceIndex * core().STAGES_PER_PALACE;

    const worldEl = overlay.querySelector("#wmWorld");
    worldEl.className = "vmap-world-host is-palace-levels";
    worldEl.innerHTML = `
      <div class="pls-shell" style="--palace-accent:${palace.accent || "#ffd86b"}">
        <!-- Palace Hero Header with Transparent Palace Artwork & Return-to-Map Button -->
        <div class="pls-hero">
          <div class="pls-hero-top">
            <button type="button" class="pls-back-btn" id="plsBackToMapBtn">
              <img src="./assets/packs/buttons/icon_home.png" alt="">
              <span>${i18n("returnToMap")}</span>
            </button>
            <span class="pls-range-badge">${i18n("levelsRange", { s: summary.startStage, e: summary.endStage })}</span>
          </div>

          <div class="pls-hero-main">
            <div class="pls-artwork-box">
              <img class="pls-palace-png" src="${palace.castleArt}" alt="${name}">
            </div>
            <div class="pls-hero-copy">
              <small class="pls-tag">${tag} (${activePalaceIndex + 1}/10)</small>
              <h1 id="plsPalaceTitle">${name}</h1>
              <p>${desc}</p>
              <div class="pls-stats-row">
                <span class="pls-stat-chip">
                  <img src="./assets/extracted/ui/icon_star_gold.png" alt="">
                  <b>${i18n("palaceStars", { stars: summary.earnedStars })}</b>
                </span>
                <span class="pls-stat-chip">
                  <img src="./assets/extracted/ui/badge_crown_laurel.png" alt="">
                  <b>${i18n("palaceProgress", { done: summary.completedCount })}</b>
                </span>
              </div>
              <div class="pls-progress-bar">
                <i style="width:${Math.max(2, summary.progressPercent)}%"></i>
              </div>
            </div>
          </div>

          ${
            summary.isLocked
              ? `<div class="pls-locked-notice" role="status">
                  <img src="./assets/packs/buttons/icon_lock.png" alt="">
                  <span>${i18n("palaceLockedBanner")}</span>
                </div>`
              : ""
          }
        </div>

        <!-- Quick-Jump Section Tabs (Smoothly scroll to each 25-level section on the 5x20 interior map) -->
        <div class="pls-jump-tabs" role="navigation" aria-label="Level Sections">
          ${[0, 1, 2, 3]
            .map((seg) => {
              const s = palaceBase + seg * RANGE_SIZE + 1;
              const e = s + RANGE_SIZE - 1;
              const isBossSeg = seg === 1;
              return `<button type="button" class="pls-jump-tab ${seg === 0 ? "is-active" : ""}" data-jump-seg="${seg}">${s}–${e}${isBossSeg ? " 👑" : ""}</button>`;
            })
            .join("")}
        </div>

        <!-- Scrollable 5x20 Palace Interior Map Background with 100 Precisely Aligned Circular Stage Slots -->
        <div class="pls-map-canvas" id="plsPathContainer" data-testid="palace-levels-grid">
          <img
            class="pls-map-bg"
            src="${palace.interiorMap}"
            alt="${name}"
            draggable="false"
          >
          <div class="pls-slots-layer" id="plsSlotsLayer"></div>
        </div>
      </div>
    `;

    worldEl.querySelector("#plsBackToMapBtn").addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(12);
      window.CMRAudio?.playSfx?.("swap");
      playMagicTransition(() => renderPalaces(true));
    });

    const container = worldEl.querySelector("#plsPathContainer");
    const slotsLayer = worldEl.querySelector("#plsSlotsLayer");
    const rowYs = activePalaceIndex === 0 ? PALACE_1_ROW_Y : INTERIOR_ROW_Y;
    const nodesPerRow = INTERIOR_COL_X.length; // 5 columns
    const totalRows = rowYs.length; // 20 rows = 100 circular slots

    for (let r = 0; r < totalRows; r++) {
      const rowY = rowYs[r];
      const isMedallionExtra = activePalaceIndex === 0 && r === totalRows - 1;
      for (let c = 0; c < nodesPerRow; c++) {
        const localStage = r * nodesPerRow + c + 1;
        if (localStage > core().STAGES_PER_PALACE) break;

        const globalStage = palaceBase + localStage;
        const done = globalStage < unlocked;
        const isCurrent = globalStage === unlocked;
        const locked = globalStage > unlocked;
        const isBoss = localStage === core().BOSS_STAGE_IN_PALACE;
        const recordedStars = Number(stageStars[String(globalStage)]);
        const starCount = done
          ? Number.isFinite(recordedStars) && recordedStars >= 1
            ? Math.min(3, recordedStars)
            : 3
          : 0;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = [
          "pls-slot-node",
          done ? "is-done" : isCurrent ? "is-current" : "is-locked",
          isBoss ? "is-boss" : "",
          isMedallionExtra ? "is-medallion-slot" : "",
        ]
          .filter(Boolean)
          .join(" ");
        btn.style.left = `${INTERIOR_COL_X[c]}%`;
        btn.style.top = `${rowY}%`;
        btn.dataset.stage = String(globalStage);
        btn.dataset.localStage = String(localStage);
        if (c === 0 && r % 5 === 0) {
          btn.dataset.segAnchor = String(Math.floor(r / 5));
        }
        btn.setAttribute("aria-disabled", locked ? "true" : "false");
        btn.setAttribute(
          "aria-label",
          `${en ? "Level" : "المرحلة"} ${globalStage} (${name})${isBoss ? ` — ${i18n("bossStageLabel")}` : ""}${
            locked ? ` (${i18n("lockedBadge")})` : isCurrent ? ` (${i18n("playNow")})` : ` (${starCount}★)`
          }`
        );

        const starsHtml = done
          ? `<span class="pls-slot-stars" aria-hidden="true">${"★".repeat(starCount)}${"☆".repeat(3 - starCount)}</span>`
          : isCurrent
          ? `<span class="pls-slot-now">${i18n("playNow")}</span>`
          : "";

        btn.innerHTML = `
          ${isCurrent ? '<span class="pls-slot-pulse" aria-hidden="true"></span>' : ""}
          <span class="pls-slot-disc">
            <b>${globalStage}</b>
          </span>
          ${
            locked
              ? '<span class="pls-slot-badge pls-slot-lock" aria-hidden="true"><img src="./assets/packs/buttons/icon_lock.png" alt=""></span>'
              : isBoss
              ? '<span class="pls-slot-badge pls-slot-crown" aria-hidden="true"><img src="./assets/packs/buttons/icon_crown.png" alt=""></span>'
              : ""
          }
          ${starsHtml}
        `;

        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          void openStage(globalStage, btn);
        });

        slotsLayer.appendChild(btn);
      }
    }

    // Quick-jump tabs smoothly scroll to the chosen 25-level segment on the 5x20 interior map
    worldEl.querySelectorAll(".pls-jump-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const seg = tab.dataset.jumpSeg;
        worldEl.querySelectorAll(".pls-jump-tab").forEach((t) => t.classList.toggle("is-active", t === tab));
        const anchor = container.querySelector(`[data-seg-anchor="${seg}"]`);
        if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    const scrollEl = overlay.querySelector("#wmScroll");
    if (scrollEl) scrollEl.scrollTop = 0;
    const localCurrent = unlocked - palaceBase;
    if (summary.isActive && localCurrent > 15) {
      requestAnimationFrame(() => focusCurrentLocation(false));
    }

    if (!overlay.classList.contains("hidden")) {
      window.CMRAudio?.setMapMusicActive?.(true);
    }
  }

  function show() {
    ensureOverlay();
    overlay.classList.remove("hidden");
    document.body.classList.add("map-open");
    document.body.dataset.state = "map";
    window.CMRPauseGameRender?.();
    window.Dragon3DCharacter?.pause?.();
    window.CMRAudio?.setMapMusicActive?.(true);
    renderPalaces(true);
  }

  function hide() {
    if (overlay) overlay.classList.add("hidden");
    document.body.classList.remove("map-open");
    window.CMRAudio?.setMapMusicActive?.(false);
    window.CMRResumeGameRender?.();
  }

  window.CMRGetBoardArtUrl = getBoardArtUrl;
  window.CMRShowWorldMap = show;
  window.CMRHideWorldMap = hide;
  window.CMRRefreshWorldMap = () => {
    if (!overlay || overlay.classList.contains("hidden")) return;
    if (currentView === "stages") renderPalaceStages(activePalaceIndex);
    else renderPalaces(false);
  };
  window.CMROpenPalace = (idx) => {
    ensureOverlay();
    if (overlay.classList.contains("hidden")) show();
    renderPalaceStages(Number(idx) || 0);
  };
})();