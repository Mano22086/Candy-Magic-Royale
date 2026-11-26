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

      <!-- Free Gift Chest Every 4 Hours (Compact Animated World Map Badge) -->
      <button type="button" class="vmap-free-chest-fab is-ready" id="wmFreeChestBtn" aria-label="صندوق الهدية المجانية كل 4 ساعات" title="صندوق الهدية المجانية">
        <span class="vmap-chest-aura" aria-hidden="true"></span>
        <img src="./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png" alt="" draggable="false">
        <span class="vmap-chest-tag" id="wmFreeChestTag">هدية جاهزة!</span>
        <span class="vmap-chest-timer" id="wmFreeChestTimer">00:00:00</span>
      </button>

      <!-- Phase 1 + Teams Animated Side-Badge Rail (Left Edge on Mobile) -->
      <aside class="vmap-events-rail" id="vmapEventsRail" aria-label="الفعاليات الملكية">
        <button type="button" class="vmap-ev-badge is-vault" id="evBadgeRoyalVault" aria-label="خزنة الملك" title="خزنة الملك">
          <img src="./public/assets/aistudio/icon_golden_bastet_vault_411d03d1.png" alt="" draggable="false">
          <span class="vmap-ev-label">خزنة الملك</span>
          <span class="vmap-ev-dot hidden" id="evDotRoyalVault" aria-hidden="true"></span>
        </button>
        <button type="button" class="vmap-ev-badge is-rocket" id="evBadgeRocketRush" aria-label="عاصفة الصواريخ" title="عاصفة الصواريخ">
          <img src="./public/assets/aistudio/01_booster_candy_rocket_b53df03d.png" alt="" draggable="false">
          <span class="vmap-ev-label">الصواريخ</span>
          <span class="vmap-ev-dot hidden" id="evDotRocketRush" aria-hidden="true"></span>
        </button>
        <button type="button" class="vmap-ev-badge is-secret" id="evBadgeSecretVault" aria-label="غرفة الكنز" title="غرفة الكنز">
          <img src="./public/assets/aistudio/icon_chest_closed_egyptian_40e6290f.png" alt="" draggable="false">
          <span class="vmap-ev-label">غرفة الكنز</span>
          <span class="vmap-ev-dot hidden" id="evDotSecretVault" aria-hidden="true"></span>
        </button>
        <button type="button" class="vmap-ev-badge is-teams" id="evBadgeTeams" aria-label="فرق المملكة" title="فرق المملكة">
          <img src="./public/assets/aistudio/icon_team_scarab_shield_9cc0cf8b.png" alt="" draggable="false">
          <span class="vmap-ev-label">الفرق</span>
          <span class="vmap-ev-dot hidden" id="evDotTeams" aria-hidden="true"></span>
        </button>
      </aside>

      <!-- Phases 2 & 3 Events Animated Side-Badge Rail (Right Edge on Mobile) -->
      <aside class="vmap-events-rail vmap-events-rail-right" id="vmapEventsRailRight" aria-label="تحديات المملكة">
        <button type="button" class="vmap-ev-badge is-lava" id="evBadgeLavaQuest" aria-label="تحدي البركان" title="تحدي البركان">
          <img src="./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png" alt="" draggable="false">
          <span class="vmap-ev-label">البركان</span>
          <span class="vmap-ev-dot hidden" id="evDotLavaQuest" aria-hidden="true"></span>
        </button>
        <button type="button" class="vmap-ev-badge is-album" id="evBadgeCardAlbum" aria-label="ألبوم الفراعنة" title="ألبوم الفراعنة">
          <img src="./public/assets/aistudio/icon_card_pack_pharaoh_cbc27457.png" alt="" draggable="false">
          <span class="vmap-ev-label">الألبوم</span>
          <span class="vmap-ev-dot hidden" id="evDotCardAlbum" aria-hidden="true"></span>
        </button>
        <button type="button" class="vmap-ev-badge is-league" id="evBadgeNileLeague" aria-label="بطولة النيل" title="بطولة النيل">
          <img src="./public/assets/aistudio/league_4_pharaoh_4f175723.png" alt="" draggable="false">
          <span class="vmap-ev-label">النيل</span>
          <span class="vmap-ev-dot hidden" id="evDotNileLeague" aria-hidden="true"></span>
        </button>
        <button type="button" class="vmap-ev-badge is-sphinx" id="evBadgeCoopSphinx" aria-label="تحدي الأصدقاء" title="تحدي الأصدقاء">
          <img src="./public/assets/aistudio/icon_golden_candy_sphinx_0c0aee3b.png" alt="" draggable="false">
          <span class="vmap-ev-label">أبو الهول</span>
          <span class="vmap-ev-dot hidden" id="evDotCoopSphinx" aria-hidden="true"></span>
        </button>
      </aside>

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
          <span class="vmap-dock-badge hidden" id="dockCalBadge">!</span>
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
          <span class="vmap-dock-badge hidden" id="dockMailBadge">0</span>
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

    // Free Gift Chest Every 4 Hours trigger + live 1-second timer
    const freeChestBtn = overlay.querySelector("#wmFreeChestBtn");
    if (freeChestBtn) {
      freeChestBtn.addEventListener("click", () => {
        const sys = window.CMRMatch3Systems;
        if (!sys || typeof sys.createFreeChestEngine !== "function") return;
        const engine = sys.createFreeChestEngine();
        const res = engine.claim(Date.now());
        if (!res.ok) {
          window.CMRAudio?.playSfx?.("click");
          showToast(`الهدية المجانية القادمة بعد ${res.formatted} ⏳`);
          syncFreeChestBadge();
          return;
        }
        window.CMRProfile?.vibrate?.([18, 30, 18]);
        window.CMRAudio?.playSfx?.("reward");
        window.CMRGame?.grantReward?.(res.reward);
        triggerFreeChestBurst(freeChestBtn, res.labelAr, res.icon);
        showToast(`🎁 فتحت صندوق الهدية المجانية: ${res.labelAr}!`);
        updateBannerAndDock();
        syncFreeChestBadge();
      });
    }
    startFreeChestClock();

    // Phase 1, 2 & 3 Events & Social Side-Badge Triggers
    overlay.querySelector("#evBadgeRoyalVault")?.addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(14);
      window.CMRRoyalVault?.open?.();
    });
    overlay.querySelector("#evBadgeRocketRush")?.addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(14);
      window.CMRRocketRush?.open?.();
    });
    overlay.querySelector("#evBadgeSecretVault")?.addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(14);
      window.CMRSecretVault?.open?.();
    });
    overlay.querySelector("#evBadgeTeams")?.addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(14);
      window.CMRTeams?.open?.();
    });
    overlay.querySelector("#evBadgeLavaQuest")?.addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(14);
      window.CMRLavaQuest?.open?.();
    });
    overlay.querySelector("#evBadgeCardAlbum")?.addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(14);
      window.CMRCardAlbum?.open?.();
    });
    overlay.querySelector("#evBadgeNileLeague")?.addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(14);
      window.CMRNileLeague?.open?.();
    });
    overlay.querySelector("#evBadgeCoopSphinx")?.addEventListener("click", () => {
      window.CMRProfile?.vibrate?.(14);
      window.CMRCoopSphinx?.open?.();
    });

    // Live EventBus sync for side-badge notification dots
    window.CMREventBus?.on?.("events:badge-update", () => {
      syncEventSideBadges();
    });

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
    const mailBadge = overlay.querySelector("#dockMailBadge");
    const calBadge = overlay.querySelector("#dockCalBadge");

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
    syncEventSideBadges();

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

    if (mailBadge) {
      const mailCount = Number(st.unclaimedMailCount) || 0;
      if (mailCount > 0) {
        mailBadge.textContent = String(mailCount);
        mailBadge.classList.remove("hidden");
      } else {
        mailBadge.classList.add("hidden");
      }
    }

    if (calBadge) {
      if (st.canClaimDailyToday) {
        calBadge.textContent = "1";
        calBadge.classList.remove("hidden");
      } else {
        calBadge.classList.add("hidden");
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

  function syncEventSideBadges() {
    if (!overlay) return;
    const badgeBindings = [
      ["#evDotRoyalVault", () => window.CMRRoyalVault?.hasNotification?.()],
      ["#evDotRocketRush", () => window.CMRRocketRush?.hasNotification?.()],
      ["#evDotSecretVault", () => window.CMRSecretVault?.hasNotification?.()],
      ["#evDotTeams", () => window.CMRTeams?.hasNotification?.()],
      ["#evDotLavaQuest", () => window.CMRLavaQuest?.hasNotification?.()],
      ["#evDotCardAlbum", () => window.CMRCardAlbum?.hasNotification?.()],
      ["#evDotNileLeague", () => window.CMRNileLeague?.hasNotification?.()],
      ["#evDotCoopSphinx", () => window.CMRCoopSphinx?.hasNotification?.()],
    ];
    badgeBindings.forEach(([selector, check]) => {
      const dot = overlay.querySelector(selector);
      if (dot) dot.classList.toggle("hidden", !check());
    });
    syncFreeChestBadge();
  }

  let freeChestInterval = null;

  function syncFreeChestBadge() {
    if (!overlay) return;
    const btn = overlay.querySelector("#wmFreeChestBtn");
    const tag = overlay.querySelector("#wmFreeChestTag");
    const timer = overlay.querySelector("#wmFreeChestTimer");
    const sys = window.CMRMatch3Systems;
    if (!btn || !sys || typeof sys.createFreeChestEngine !== "function") return;
    const status = sys.createFreeChestEngine().getStatus(Date.now());
    btn.classList.toggle("is-ready", status.ready);
    if (tag) tag.textContent = status.ready ? "هدية جاهزة!" : "صندوق هدية";
    if (timer) timer.textContent = status.ready ? "افتح الآن ✨" : status.formatted;
  }

  function startFreeChestClock() {
    if (freeChestInterval) return;
    freeChestInterval = setInterval(() => {
      if (overlay && !overlay.classList.contains("hidden") && currentView === "palaces") {
        syncFreeChestBadge();
      }
    }, 1000);
  }

  function triggerFreeChestBurst(anchorBtn, labelAr, iconSrc) {
    if (!overlay || !anchorBtn) return;
    anchorBtn.classList.remove("is-bursting");
    void anchorBtn.offsetWidth;
    anchorBtn.classList.add("is-bursting");
    setTimeout(() => anchorBtn.classList.remove("is-bursting"), 700);

    const rect = anchorBtn.getBoundingClientRect();
    const pop = document.createElement("div");
    pop.className = "vmap-chest-reward-pop";
    pop.setAttribute("dir", "rtl");
    pop.style.left = `${rect.left + rect.width / 2}px`;
    pop.style.top = `${rect.top}px`;
    pop.innerHTML = `<img src="${iconSrc}" alt=""><span>${labelAr}</span>`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1700);
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
    overlay.querySelector("#vmapEventsRail")?.classList.remove("hidden");
    overlay.querySelector("#vmapEventsRailRight")?.classList.remove("hidden");
    overlay.querySelector("#wmFreeChestBtn")?.classList.remove("hidden");
    syncFreeChestBadge();

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
    overlay.querySelector("#vmapEventsRail")?.classList.add("hidden");
    overlay.querySelector("#vmapEventsRailRight")?.classList.add("hidden");
    overlay.querySelector("#wmFreeChestBtn")?.classList.add("hidden");

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
              const isBossSeg = seg === 1 || seg === 3;
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
        const bossList = core().BOSS_STAGES_IN_PALACE || [core().BOSS_STAGE_IN_PALACE];
        const isBoss = bossList.includes(localStage);
        const diffTier =
          typeof core().getStageDifficultyTier === "function"
            ? core().getStageDifficultyTier(localStage)
            : { isHard: false, isSuperHard: false, tagAr: null };
        const isHard = Boolean(diffTier.isHard);
        const isSuperHard = Boolean(diffTier.isSuperHard);
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
          isHard ? "is-hard-stage" : "",
          isSuperHard ? "is-super-hard-stage" : "",
          isMedallionExtra ? "is-medallion-slot" : "",
        ]
          .filter(Boolean)
          .join(" ");
        btn.style.left = `${INTERIOR_COL_X[c]}%`;
        btn.style.top = `${rowY}%`;
        btn.dataset.stage = String(globalStage);
        btn.dataset.localStage = String(localStage);
        btn.dataset.difficulty = diffTier.tier || "normal";
        if (c === 0 && r % 5 === 0) {
          btn.dataset.segAnchor = String(Math.floor(r / 5));
        }
        btn.setAttribute("aria-disabled", locked ? "true" : "false");
        btn.setAttribute(
          "aria-label",
          `${en ? "Level" : "المرحلة"} ${globalStage} (${name})${
            isBoss
              ? ` — ${i18n("bossStageLabel")}`
              : isSuperHard
              ? " — تحدي فرعوني خارق (×2.5 عملات)"
              : isHard
              ? " — مرحلة صعبة (×2 عملات)"
              : ""
          }${locked ? ` (${i18n("lockedBadge")})` : isCurrent ? ` (${i18n("playNow")})` : ` (${starCount}★)`}`
        );

        const starIconUrl =
          window.CMROutcomeEngine?.OUTCOME_ASSETS?.victoryStar ||
          "./public/assets/aistudio/icon_victory_star_8b503f69.png";
        const buildMiniStarsHtml = (count) => {
          let out = '<span class="pls-slot-stars-img" aria-hidden="true">';
          for (let sIdx = 1; sIdx <= 3; sIdx++) {
            const lit = sIdx <= count;
            out += `<img class="pls-mini-star ${lit ? "is-lit" : "is-dim"} ${sIdx === 2 ? "is-mid" : ""}" src="${starIconUrl}" alt="" draggable="false">`;
          }
          out += "</span>";
          return out;
        };

        const starsHtml = done
          ? buildMiniStarsHtml(starCount)
          : isCurrent
          ? `<span class="pls-slot-now">${i18n("playNow")}</span>`
          : isSuperHard
          ? `<span class="pls-slot-diff-tag is-super">⚡×2.5</span>`
          : isHard
          ? `<span class="pls-slot-diff-tag is-hard">🔥×2</span>`
          : "";

        btn.innerHTML = `
          ${isCurrent ? '<span class="pls-slot-pulse" aria-hidden="true"></span>' : ""}
          ${isHard ? '<span class="pls-hard-ring" aria-hidden="true"></span>' : ""}
          ${isSuperHard ? '<span class="pls-super-hard-ring" aria-hidden="true"></span>' : ""}
          <span class="pls-slot-disc">
            <b>${globalStage}</b>
          </span>
          ${
            locked
              ? '<span class="pls-slot-badge pls-slot-lock" aria-hidden="true"><img src="./assets/packs/buttons/icon_lock.png" alt=""></span>'
              : isBoss
              ? '<span class="pls-slot-badge pls-slot-crown" aria-hidden="true"><img src="./assets/packs/buttons/icon_crown.png" alt=""></span>'
              : isSuperHard
              ? '<span class="pls-slot-badge pls-slot-super-badge" aria-hidden="true">⚡</span>'
              : isHard
              ? '<span class="pls-slot-badge pls-slot-hard-badge" aria-hidden="true">🔥</span>'
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

    // Helper: pick player's golden-ring Avatar badge (profile avatar, or Queen Luma on Odd / Pharaoh Boy on Even palaces)
    const getPalaceAvatarSrc = () => {
      const profileSrc = st.avatar?.img || st.avatar?.src || "";
      if (profileSrc) return profileSrc;
      const isEvenPalace = (activePalaceIndex + 1) % 2 === 0;
      return isEvenPalace
        ? "./assets/extracted/avatars/avatar_pharaoh_boy.png"
        : "./assets/extracted/avatars/avatar_queen_luma.png";
    };

    // Place the player's Golden-Ring Avatar Marker on the active unlocked slot (if inside this palace)
    const activeSlotEl = slotsLayer.querySelector(`.pls-slot-node[data-stage="${unlocked}"]`);
    if (activeSlotEl) {
      const avatarPin = document.createElement("div");
      avatarPin.className = "pls-avatar-walker";
      avatarPin.id = "plsAvatarWalker";
      avatarPin.setAttribute("aria-hidden", "true");
      avatarPin.style.left = activeSlotEl.style.left;
      avatarPin.style.top = activeSlotEl.style.top;
      avatarPin.innerHTML = `
        <span class="pls-avatar-ring">
          <img src="${getPalaceAvatarSrc()}" alt="" draggable="false">
        </span>
      `;
      slotsLayer.appendChild(avatarPin);
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

  let activeWalkRaf = 0;

  function spawnMapSparkleBurst(parentEl, leftPct, topPct, count = 10) {
    if (!parentEl) return;
    const burst = document.createElement("div");
    burst.className = "pls-map-sparkle-burst";
    burst.style.left = `${leftPct}%`;
    burst.style.top = `${topPct}%`;
    const colors = ["#fde047", "#ffffff", "#fbbf24", "#38bdf8", "#f472b6"];
    for (let i = 0; i < count; i++) {
      const sp = document.createElement("span");
      sp.className = "pls-map-spark";
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const dist = 18 + Math.random() * 24;
      sp.style.setProperty("--mx", `${Math.round(Math.cos(ang) * dist)}px`);
      sp.style.setProperty("--my", `${Math.round(Math.sin(ang) * dist)}px`);
      sp.style.background = colors[i % colors.length];
      burst.appendChild(sp);
    }
    parentEl.appendChild(burst);
    setTimeout(() => burst.remove(), 700);
  }

  function spawnMapDustPuff(parentEl, leftPct, topPct) {
    if (!parentEl) return;
    const puff = document.createElement("span");
    puff.className = "pls-walk-dust-puff";
    puff.style.left = `${leftPct}%`;
    puff.style.top = `${topPct}%`;
    parentEl.appendChild(puff);
    setTimeout(() => puff.remove(), 460);
  }

  /**
   * Palace Map Star Stamping & 900ms Curved Avatar Walking Transition after Victory.
   */
  function openPalaceWithVictoryTransition({ completedStage, nextStage, starsEarned = 3 } = {}) {
    ensureOverlay();
    if (activeWalkRaf) {
      cancelAnimationFrame(activeWalkRaf);
      activeWalkRaf = 0;
    }

    const doneStage = Math.max(1, Math.min(core().TOTAL_STAGES, Math.floor(Number(completedStage) || 1)));
    const targetStage = Math.max(
      doneStage,
      Math.min(core().TOTAL_STAGES, Math.floor(Number(nextStage) || doneStage + 1))
    );
    const palaceIdx = Math.floor((doneStage - 1) / core().STAGES_PER_PALACE);

    const startScr = document.getElementById("startScreen");
    if (startScr) startScr.classList.add("hidden");
    document.body.classList.add("game-started", "map-open");
    overlay.classList.remove("hidden");
    document.body.dataset.state = "map";
    window.CMRPauseGameRender?.();
    window.Dragon3DCharacter?.pause?.();
    window.CMRAudio?.setMapMusicActive?.(true);

    renderPalaceStages(palaceIdx);

    const slotsLayer = overlay.querySelector("#plsSlotsLayer");
    if (!slotsLayer) return;
    const fromSlot = slotsLayer.querySelector(`.pls-slot-node[data-stage="${doneStage}"]`);
    const toSlot = slotsLayer.querySelector(`.pls-slot-node[data-stage="${targetStage}"]`);
    const walker = slotsLayer.querySelector("#plsAvatarWalker");

    if (fromSlot) {
      fromSlot.scrollIntoView({ behavior: "auto", block: "center" });
    }

    // 1) Stamp the earned mini golden stars on the completed slot with sparkle pop!
    const fromX = fromSlot ? parseFloat(fromSlot.style.left) || 50 : 50;
    const fromY = fromSlot ? parseFloat(fromSlot.style.top) || 10 : 10;
    if (fromSlot) {
      fromSlot.classList.add("is-just-stamped");
      spawnMapSparkleBurst(slotsLayer, fromX, fromY, 12);
      const earnedStarsCount = Math.max(1, Math.min(3, Math.floor(Number(starsEarned) || 1)));
      const miniStars = fromSlot.querySelectorAll(".pls-mini-star.is-lit");
      miniStars.forEach((starImg, idx) => {
        if (idx < earnedStarsCount) {
          starImg.classList.remove("is-stamp-pop");
          void starImg.offsetWidth;
          starImg.style.animationDelay = `${idx * 110}ms`;
          starImg.classList.add("is-stamp-pop");
        }
      });
      window.CMROutcomeUI?.playStarChime?.(Math.min(2, earnedStarsCount - 1));
    }

    // 2) Position Avatar Badge at the completed slot, then hop smoothly along a curved path (900ms) to nextStage!
    if (!walker || !fromSlot || !toSlot || doneStage === targetStage) {
      if (toSlot) toSlot.classList.add("is-just-unlocked");
      return;
    }

    const toX = parseFloat(toSlot.style.left) || fromX;
    const toY = parseFloat(toSlot.style.top) || fromY;

    walker.style.left = `${fromX}%`;
    walker.style.top = `${fromY}%`;
    walker.classList.add("is-walking");

    const engine = window.CMROutcomeEngine;
    const duration = engine?.AVATAR_WALK_DURATION_MS || 900;

    setTimeout(() => {
      const startAt = performance.now();
      let lastStepIdx = -1;
      let lastDustAt = 0;

      const stepFrame = (now) => {
        const rawT = Math.min(1, (now - startAt) / duration);
        const pt = engine?.computeCurvedHopPoint
          ? engine.computeCurvedHopPoint(
              { x: fromX, y: fromY },
              { x: toX, y: toY },
              rawT,
              { arcLift: 1.8, hops: 3, hopHeight: 1.15 }
            )
          : {
              x: fromX + (toX - fromX) * rawT,
              y: fromY + (toY - fromY) * rawT,
              scaleX: 1,
              scaleY: 1,
              rotateDeg: 0,
            };

        walker.style.left = `${pt.x}%`;
        walker.style.top = `${pt.y}%`;
        walker.style.setProperty("--walk-sx", String(pt.scaleX));
        walker.style.setProperty("--walk-sy", String(pt.scaleY));
        walker.style.setProperty("--walk-rot", `${pt.rotateDeg}deg`);

        // Footstep pop SFX at each hop landing (3 hops)
        const stepIdx = Math.floor(rawT * 3);
        if (stepIdx > lastStepIdx && stepIdx < 3) {
          lastStepIdx = stepIdx;
          window.CMROutcomeUI?.playFootstepPop?.(stepIdx);
        }

        // Trailing golden dust/star puffs along the path
        if (now - lastDustAt > 110 && rawT < 0.96) {
          lastDustAt = now;
          spawnMapDustPuff(slotsLayer, pt.x, pt.y);
        }

        if (rawT < 1) {
          activeWalkRaf = requestAnimationFrame(stepFrame);
        } else {
          activeWalkRaf = 0;
          walker.classList.remove("is-walking");
          walker.style.left = `${toX}%`;
          walker.style.top = `${toY}%`;
          walker.style.removeProperty("--walk-sx");
          walker.style.removeProperty("--walk-sy");
          walker.style.removeProperty("--walk-rot");
          walker.classList.add("is-landed-bounce");
          setTimeout(() => walker.classList.remove("is-landed-bounce"), 550);

          // Pulse/glow the newly unlocked slot & sparkle burst
          toSlot.classList.add("is-just-unlocked");
          spawnMapSparkleBurst(slotsLayer, toX, toY, 14);
          window.CMROutcomeUI?.playFootstepPop?.(3);
          toSlot.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };

      activeWalkRaf = requestAnimationFrame(stepFrame);
    }, 360);
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
    if (activeWalkRaf) {
      cancelAnimationFrame(activeWalkRaf);
      activeWalkRaf = 0;
    }
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
  window.CMROpenPalaceWithVictoryTransition = openPalaceWithVictoryTransition;
})();