/* Candy Magic Royale — Anubis Mega Pack Pure Engine (UMD: Browser + node:test)
 * Manifests all 11 folders of /mega_pack/, dual candy palettes, 6-color Rockets/Bombs,
 * 70 WebP boards + Infinite Realms (1,001 -> Infinity), Strict Candy Crush Rocket/Bomb swap rule,
 * 10-Second English Voice Streak Announcer, Pre-Level Dynamic Boosters, Daily Rotating Shop Combo,
 * and Smart 3D Obstacle Pure Mechanics.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CMRAnubisPack = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const COLOR_KEYS = Object.freeze(["red", "blue", "green", "yellow", "purple", "orange"]);

  const MEGA_PACK_ASSETS = Object.freeze({
    candiesRoyalDesserts: Object.freeze({
      1: "./mega_pack/01_candies_royal_desserts/dessert_01_red_cupcake.png",
      2: "./mega_pack/01_candies_royal_desserts/dessert_02_blue_donut.png",
      3: "./mega_pack/01_candies_royal_desserts/dessert_03_green_macaron.png",
      4: "./mega_pack/01_candies_royal_desserts/dessert_04_yellow_star_cookie.png",
      5: "./mega_pack/01_candies_royal_desserts/dessert_05_purple_berry_tart.png",
      6: "./mega_pack/01_candies_royal_desserts/dessert_06_orange_glaze_swirl.png",
    }),
    candiesPharaonicRelics: Object.freeze({
      1: "./mega_pack/02_candies_pharaonic_relics/relic_01_red_scarab.png",
      2: "./mega_pack/02_candies_pharaonic_relics/relic_02_blue_horus_eye.png",
      3: "./mega_pack/02_candies_pharaonic_relics/relic_03_green_lotus.png",
      4: "./mega_pack/02_candies_pharaonic_relics/relic_04_yellow_ankh_coin.png",
      5: "./mega_pack/02_candies_pharaonic_relics/relic_05_purple_bastet.png",
      6: "./mega_pack/02_candies_pharaonic_relics/relic_06_orange_sun_swirl.png",
    }),
    rockets: Object.freeze({
      1: "./mega_pack/03_special_rockets_6/rocket_red.png",
      2: "./mega_pack/03_special_rockets_6/rocket_blue.png",
      3: "./mega_pack/03_special_rockets_6/rocket_green.png",
      4: "./mega_pack/03_special_rockets_6/rocket_yellow.png",
      5: "./mega_pack/03_special_rockets_6/rocket_purple.png",
      6: "./mega_pack/03_special_rockets_6/rocket_orange.png",
    }),
    bombs: Object.freeze({
      1: "./mega_pack/04_special_bombs_6/bomb_red.png",
      2: "./mega_pack/04_special_bombs_6/bomb_blue.png",
      3: "./mega_pack/04_special_bombs_6/bomb_green.png",
      4: "./mega_pack/04_special_bombs_6/bomb_yellow.png",
      5: "./mega_pack/04_special_bombs_6/bomb_purple.png",
      6: "./mega_pack/04_special_bombs_6/bomb_orange.png",
    }),
    colorBall: "./mega_pack/05_special_color_ball/special_color_ball.png",
    characters50: Object.freeze({
      cleopatra: "./mega_pack/06_characters_50frames_10x5/sheet_cleopatra_queen_50frames_10x5.png",
      golden_dragon: "./mega_pack/06_characters_50frames_10x5/sheet_golden_dragon_50frames_10x5.png",
      boss_anubis: "./mega_pack/06_characters_50frames_10x5/sheet_boss_anubis_50frames_10x5.png",
    }),
    uiFrames: Object.freeze({
      hudObjective: "./mega_pack/09_pharaonic_ui_frames/hud_objective_panel_empty.png",
      bossHpBar: "./mega_pack/09_pharaonic_ui_frames/ui_boss_hp_bar_empty.png",
      palaceHeader: "./mega_pack/09_pharaonic_ui_frames/ui_pharaonic_palace_header.png",
      adButton: "./mega_pack/09_pharaonic_ui_frames/ui_pharaonic_ad_button.png",
      tutorialDialog: "./mega_pack/09_pharaonic_ui_frames/ui_pharaonic_tutorial_dialog.png",
      prelevelFrame: "./mega_pack/09_pharaonic_ui_frames/ui_prelevel_frame.png",
      victoryFrame: "./mega_pack/09_pharaonic_ui_frames/ui_victory_frame.png",
      outOfMovesFrame: "./mega_pack/09_pharaonic_ui_frames/ui_out_of_moves_frame.png",
      victoryStar: "./mega_pack/09_pharaonic_ui_frames/icon_victory_star.png",
    }),
    obstacles22: Object.freeze({
      sleeping_sphinx: "./mega_pack/10_obstacles_all/smart_obs_01_sleeping_sphinx.png",
      magic_mirror: "./mega_pack/10_obstacles_all/smart_obs_02_magic_mirror.png",
      quicksand: "./mega_pack/10_obstacles_all/smart_obs_03_quicksand.png",
      surprise_coffin: "./mega_pack/10_obstacles_all/smart_obs_04_surprise_coffin.png",
      hieroglyph_tile: "./mega_pack/10_obstacles_all/smart_obs_05_hieroglyph_tile.png",
      cursed_hourglass: "./mega_pack/10_obstacles_all/smart_obs_06_cursed_hourglass.png",
      chocolate_fountain: "./mega_pack/10_obstacles_all/smart_obs_07_chocolate_fountain.png",
      color_lock_stone: "./mega_pack/10_obstacles_all/smart_obs_08_color_lock_stone.png",
      jumping_bastet: "./mega_pack/10_obstacles_all/smart_obs_09_jumping_bastet.png",
      golden_spiderweb: "./mega_pack/10_obstacles_all/smart_obs_10_golden_spiderweb.png",
      sandstone_block: "./mega_pack/10_obstacles_all/obs_09_sandstone_block.png",
      scarab_gem_box: "./mega_pack/10_obstacles_all/obs_10_scarab_gem_box.png",
      caramel_jar: "./mega_pack/10_obstacles_all/obs_11_caramel_jar.png",
      crystal_egg: "./mega_pack/10_obstacles_all/obs_12_crystal_egg.png",
      mummy_bandage: "./mega_pack/10_obstacles_all/obs_13_mummy_bandage.png",
      fire_brazier: "./mega_pack/10_obstacles_all/obs_14_fire_brazier.png",
      bubble_gum: "./mega_pack/10_obstacles_all/obs_15_bubble_gum.png",
      pharaoh_vase: "./mega_pack/10_obstacles_all/obs_16_pharaoh_vase.png",
      lotus_flower: "./mega_pack/10_obstacles_all/obs_17_lotus_flower.png",
      magic_lamp: "./mega_pack/10_obstacles_all/obs_18_magic_lamp.png",
      obsidian_shield: "./mega_pack/10_obstacles_all/obs_19_obsidian_shield.png",
      pyramid_safe: "./mega_pack/10_obstacles_all/obs_20_pyramid_safe.png",
    }),
    audio18: Object.freeze({
      sfx_match_normal: "./mega_pack/11_audio_18/sfx_match_normal.mp3",
      sfx_booster_rocket: "./mega_pack/11_audio_18/sfx_booster_rocket.mp3",
      sfx_booster_bomb: "./mega_pack/11_audio_18/sfx_booster_bomb.mp3",
      sfx_booster_colorball: "./mega_pack/11_audio_18/sfx_booster_colorball.mp3",
      sfx_booster_shuffle: "./mega_pack/11_audio_18/sfx_booster_shuffle.mp3",
      sfx_booster_wand: "./mega_pack/11_audio_18/sfx_booster_wand.mp3",
      sfx_special_create: "./mega_pack/11_audio_18/sfx_special_create.mp3",
      sfx_obstacle_break: "./mega_pack/11_audio_18/sfx_obstacle_break.mp3",
      sfx_queen_callout: "./mega_pack/11_audio_18/sfx_queen_callout.mp3",
      sfx_star_slam: "./mega_pack/11_audio_18/sfx_star_slam.mp3",
      sfx_victory_fanfare: "./mega_pack/11_audio_18/sfx_victory_fanfare.mp3",
      sfx_loss_dramatic: "./mega_pack/11_audio_18/sfx_loss_dramatic.mp3",
      voice_1: "./mega_pack/11_audio_18/voice_1.mp3",
      voice_2: "./mega_pack/11_audio_18/voice_2.mp3",
      voice_3: "./mega_pack/11_audio_18/voice_3.mp3",
      voice_4: "./mega_pack/11_audio_18/voice_4.mp3",
      voice_5: "./mega_pack/11_audio_18/voice_5.mp3",
      voice_6: "./mega_pack/11_audio_18/voice_6.mp3",
    }),
  });

  // Deterministic PRNG for Infinite Realms, Daily Shop Combo & Procedural Layouts
  function mulberry32(seed) {
    let a = (Number(seed) || 1) >>> 0;
    return function next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStringSeed(str) {
    const s = String(str || "cmr");
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h || 1;
  }

  // Dual Candy Theme: Odd Palaces = Royal Desserts, Even Palaces = Pharaonic Relics
  function getCandyPaletteForStage(levelId) {
    const lvl = Math.max(1, Math.floor(Number(levelId) || 1));
    const palaceNumber = Math.floor((lvl - 1) / 100) + 1;
    const isEvenPalace = palaceNumber % 2 === 0;
    return {
      palaceNumber,
      themeId: isEvenPalace ? "pharaonic_relics" : "royal_desserts",
      themeNameAr: isEvenPalace ? "آثار الفراعنة" : "حلويات المملكة",
      candies: isEvenPalace
        ? MEGA_PACK_ASSETS.candiesPharaonicRelics
        : MEGA_PACK_ASSETS.candiesRoyalDesserts,
      rockets: MEGA_PACK_ASSETS.rockets,
      bombs: MEGA_PACK_ASSETS.bombs,
      colorBall: MEGA_PACK_ASSETS.colorBall,
    };
  }

  function getSpecialSpriteForCandy(special, type = 1) {
    const t = Math.max(1, Math.min(6, Math.floor(Number(type) || 1)));
    if (special === "color") return MEGA_PACK_ASSETS.colorBall;
    if (special === "striped") return MEGA_PACK_ASSETS.rockets[t];
    if (special === "wrapped") return MEGA_PACK_ASSETS.bombs[t];
    return null;
  }

  // 70 WebP Boards (50 Regular + 20 Anubis Boss) with Infinite Cycling for 1,001 -> Infinity
  const INFINITE_REALM_TITLES_AR = Object.freeze([
    "عالم الفراعنة الأبدي",
    "واحة الشمس الذهبية",
    "معبد أنوبيس السماوي",
    "قصر كليوباترا البلوري",
    "أهرامات النجوم اللانهائية",
    "خزائن النيل الخالدة",
    "عرش اللوتس الأسطوري",
    "سماء الجعران المتوهج",
  ]);

  function getStageBoardWebp(levelId) {
    const lvl = Math.max(1, Math.floor(Number(levelId) || 1));
    const palaceIndex = Math.floor((lvl - 1) / 100); // 0..Infinity
    const palaceNumber = palaceIndex + 1;
    const stageInPalace = ((lvl - 1) % 100) + 1; // 1..100
    const isBossStage = stageInPalace === 50 || stageInPalace === 100;

    if (isBossStage) {
      const bossSlot = stageInPalace === 50 ? 1 : 2;
      const rawBossNumber = palaceIndex * 2 + bossSlot; // 1..Infinity
      const bossArtIndex = ((rawBossNumber - 1) % 20) + 1; // 1..20
      const padded = String(bossArtIndex).padStart(2, "0");
      return {
        isBossStage: true,
        palaceIndex,
        palaceNumber,
        stageInPalace,
        bossNumber: rawBossNumber,
        boardNumber: bossArtIndex,
        boardImagePath: `./mega_pack/08_boards_boss_anubis_20/boss_anubis_board_${padded}.webp`,
        isInfiniteRealm: palaceNumber > 10,
        infiniteRealmTitleAr:
          palaceNumber > 10
            ? `${INFINITE_REALM_TITLES_AR[(palaceNumber - 11) % INFINITE_REALM_TITLES_AR.length]} ${palaceNumber}`
            : null,
      };
    }

    const basePalaceMod = palaceIndex % 10;
    const variantIndex = (stageInPalace - 1) % 5; // 5 distinct regular boards per palace
    const boardNumber = ((basePalaceMod * 5 + variantIndex) % 50) + 1; // 1..50
    const padded = String(boardNumber).padStart(2, "0");
    return {
      isBossStage: false,
      palaceIndex,
      palaceNumber,
      stageInPalace,
      bossNumber: 0,
      boardNumber,
      boardImagePath: `./mega_pack/07_boards_regular_50/board_${padded}.webp`,
      isInfiniteRealm: palaceNumber > 10,
      infiniteRealmTitleAr:
        palaceNumber > 10
          ? `${INFINITE_REALM_TITLES_AR[(palaceNumber - 11) % INFINITE_REALM_TITLES_AR.length]} ${palaceNumber}`
          : null,
    };
  }

  /**
   * STRICT CANDY CRUSH RULE FOR SPECIAL SWAPS:
   * - Special + Special -> ALLOWED (super combo)
   * - Color Ball + Normal Candy -> ALLOWED (clears all candies of that normal candy's color)
   * - Rocket or Bomb + Normal Candy -> ONLY ALLOWED if the swap forms a 3+ same-color match!
   *   Never detonates when swapped with a different-colored normal candy.
   */
  function isStrictSpecialSwapAllowed(cellA, cellB, wouldFormMatch3 = false) {
    if (!cellA || !cellB) return { allowed: false, mode: "invalid" };
    const spA = cellA.special || null;
    const spB = cellB.special || null;
    if (spA && spB) {
      return { allowed: true, mode: "super_combo" };
    }
    if (spA === "color" || spB === "color") {
      return { allowed: true, mode: "color_ball_swap" };
    }
    if (spA === "striped" || spA === "wrapped" || spB === "striped" || spB === "wrapped") {
      if (wouldFormMatch3) {
        return { allowed: true, mode: "match3_with_special" };
      }
      return { allowed: false, mode: "blocked_strict_special" };
    }
    return { allowed: Boolean(wouldFormMatch3), mode: wouldFormMatch3 ? "normal_match" : "no_match" };
  }

  // 10-Second Consecutive English Voice Streak Announcer (voice_1..voice_6)
  const STREAK_CALLOUTS = Object.freeze([
    { tier: 1, matchCount: 3, text: "SWEET!", voiceKey: "voice_1", audioSrc: MEGA_PACK_ASSETS.audio18.voice_1 },
    { tier: 2, matchCount: 4, text: "TASTY!", voiceKey: "voice_2", audioSrc: MEGA_PACK_ASSETS.audio18.voice_2 },
    { tier: 3, matchCount: 5, text: "DELICIOUS!", voiceKey: "voice_3", audioSrc: MEGA_PACK_ASSETS.audio18.voice_3 },
    { tier: 4, matchCount: 6, text: "DIVINE!", voiceKey: "voice_4", audioSrc: MEGA_PACK_ASSETS.audio18.voice_4 },
    { tier: 5, matchCount: 7, text: "ROYAL!", voiceKey: "voice_5", audioSrc: MEGA_PACK_ASSETS.audio18.voice_5 },
    { tier: 6, matchCount: 8, text: "LEGENDARY!", voiceKey: "voice_6", audioSrc: MEGA_PACK_ASSETS.audio18.voice_6 },
  ]);

  function createStreakAnnouncerEngine(windowMs = 10000) {
    const win = Math.max(1000, Number(windowMs) || 10000);
    let streakCount = 0;
    let lastMatchAt = 0;

    return {
      recordMatch(nowMs = Date.now()) {
        const t = Number(nowMs) || Date.now();
        if (lastMatchAt > 0 && t - lastMatchAt > win) {
          streakCount = 0;
        }
        streakCount += 1;
        lastMatchAt = t;

        if (streakCount < 3) {
          return { triggered: false, streakCount, callout: null };
        }
        const tierIndex = Math.min(STREAK_CALLOUTS.length - 1, streakCount - 3);
        const callout = STREAK_CALLOUTS[tierIndex];
        return {
          triggered: true,
          streakCount,
          callout: { ...callout },
        };
      },
      reset() {
        streakCount = 0;
        lastMatchAt = 0;
      },
      getState(nowMs = Date.now()) {
        const t = Number(nowMs) || Date.now();
        const expired = lastMatchAt > 0 && t - lastMatchAt > win;
        return {
          streakCount: expired ? 0 : streakCount,
          lastMatchAt,
          windowMs: win,
        };
      },
    };
  }

  // Dynamic Pre-Level 3-Booster Rotation per Stage / 10-Stage Block
  const PRELEVEL_BOOSTER_POOL = Object.freeze([
    {
      id: "rockets",
      inventoryKey: "rockets",
      nameAr: "صاروخ البداية",
      descAr: "يضع صاروخ حلوى متفجراً على اللوحة",
      icon: MEGA_PACK_ASSETS.rockets[1],
      buyCoins: 80,
    },
    {
      id: "hammer",
      inventoryKey: "hammer",
      nameAr: "قنبلة البداية",
      descAr: "تضع قنبلة حلوى 3×3 في بداية المرحلة",
      icon: MEGA_PACK_ASSETS.bombs[5],
      buyCoins: 90,
    },
    {
      id: "colors",
      inventoryKey: "colors",
      nameAr: "كرة الألوان",
      descAr: "تضع كرة ألوان سحرية على اللوحة فوراً",
      icon: MEGA_PACK_ASSETS.colorBall,
      buyCoins: 120,
    },
    {
      id: "paints",
      inventoryKey: "paints",
      nameAr: "عصا التحويل",
      descAr: "تحوّل قطعتين عشوائيتين إلى صواريخ مزدوجة",
      icon: "./public/assets/aistudio/02_booster_magic_wand_e83e8cc8.png",
      buyCoins: 85,
    },
  ]);

  function getPreLevelBoosterRotation(levelId) {
    const lvl = Math.max(1, Math.floor(Number(levelId) || 1));
    const blockIdx = Math.floor((lvl - 1) / 10);
    const stageShift = (lvl - 1) % 4;
    const offset = (blockIdx + stageShift) % PRELEVEL_BOOSTER_POOL.length;
    const slots = [];
    for (let i = 0; i < 3; i++) {
      const b = PRELEVEL_BOOSTER_POOL[(offset + i) % PRELEVEL_BOOSTER_POOL.length];
      slots.push({ ...b });
    }
    return slots;
  }

  // Daily Rotating AI Combo Bundle (deterministic seed = YYYY-MM-DD) + Real-Money Blank-Price Packs
  function getDailyShopComboBundle(dateKey) {
    const key = String(dateKey || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const rng = mulberry32(hashStringSeed("daily_combo_" + key));
    const templates = [
      {
        titleAr: "كومبو كليوباترا اليومي",
        shortQty: "350 عملة + ×2 صاروخ + ×2 قنبلة",
        description: "عرض يومي متجدد: صواريخ وقنابل كليوباترا + 350 عملة ذهبية!",
        image: MEGA_PACK_ASSETS.rockets[5],
        currency: "coins",
        price: 260,
        badge: "عرض اليوم ✨",
        reward: { coins: 350, rockets: 2, hammer: 2 },
      },
      {
        titleAr: "كومبو التنين الذهبي اليومي",
        shortQty: "×2 كرة ألوان + ×2 صاروخ + 250 عملة",
        description: "باقة التنين اليومية لمسح أصعب مراحل القصر بسرعة خارقة!",
        image: MEGA_PACK_ASSETS.colorBall,
        currency: "coins",
        price: 290,
        badge: "متجدد يومياً 🔥",
        reward: { colors: 2, rockets: 2, coins: 250 },
      },
      {
        titleAr: "كومبو كنوز أنوبيس اليومي",
        shortQty: "×3 قنبلة + ×2 عصا + 400 عملة",
        description: "حزمة قاهر أنوبيس اليومية بعملات ذهبية مخفضة!",
        image: MEGA_PACK_ASSETS.bombs[1],
        currency: "coins",
        price: 310,
        badge: "خصم 40% ⚡",
        reward: { hammer: 3, paints: 2, coins: 400 },
      },
      {
        titleAr: "كومبو الواحة السحرية اليومي",
        shortQty: "×2 صاروخ + ×2 عصا + ×1 كرة ألوان",
        description: "توليفة سحرية متجددة كل 24 ساعة لإتقان التحديات!",
        image: MEGA_PACK_ASSETS.candiesPharaonicRelics[4],
        currency: "coins",
        price: 275,
        badge: "عرض اليوم 👑",
        reward: { rockets: 2, paints: 2, colors: 1 },
      },
    ];
    const picked = templates[Math.floor(rng() * templates.length)];
    return {
      id: "daily_rotating_combo",
      dateKey: key,
      category: "offers",
      name: picked.titleAr,
      shortTitle: picked.titleAr,
      shortQty: picked.shortQty,
      description: picked.description,
      image: picked.image,
      currency: picked.currency,
      price: picked.price,
      badge: picked.badge,
      reward: { ...picked.reward },
      isDailyRotating: true,
    };
  }

  // High-value Real-Money Store Packs with STRICTLY BLANK price tags (ready for Google Play Billing)
  const REAL_MONEY_PACKS = Object.freeze([
    {
      id: "iap_pharaoh_starter",
      category: "offers",
      name: "حزمة الفرعون الذهبية",
      shortTitle: "حزمة الفرعون",
      shortQty: "2,500 عملة · 25 جوهرة · ×6 معززات",
      description: "باقة ملكية كبرى جاهزة للتفعيل عبر متجر Google Play.",
      image: MEGA_PACK_ASSETS.candiesPharaonicRelics[1],
      currency: "real_money",
      price: 0,
      priceLabel: "",
      badge: "قيمة ملكية 👑",
      reward: { coins: 2500, gems: 25, rockets: 2, hammer: 2, colors: 2 },
    },
    {
      id: "iap_anubis_vault",
      category: "gems",
      name: "خزينة جواهر أنوبيس",
      shortTitle: "خزينة الجواهر",
      shortQty: "120 جوهرة نادرة · ×5 كرة ألوان",
      description: "كنز ضخم من الجواهر الملكية النادرة (جاهز لـ Google Play Billing).",
      image: MEGA_PACK_ASSETS.colorBall,
      currency: "real_money",
      price: 0,
      priceLabel: "",
      badge: "الأكثر فخامة 💎",
      reward: { gems: 120, colors: 5 },
    },
    {
      id: "iap_cleopatra_treasury",
      category: "coins",
      name: "كنز كليوباترا الأعظم",
      shortTitle: "كنز كليوباترا",
      shortQty: "10,000 عملة · 60 جوهرة · ×12 معززاً",
      description: "أضخم خزينة في المملكة (جاهزة لـ Google Play Billing).",
      image: MEGA_PACK_ASSETS.candiesRoyalDesserts[4],
      currency: "real_money",
      price: 0,
      priceLabel: "",
      badge: "كنز أسطوري ✨",
      reward: { coins: 10000, gems: 60, rockets: 4, hammer: 4, colors: 4 },
    },
  ]);

  // -------------------------------------------------------------------------
  // Smart 3D Obstacle Pure Mechanics Helpers (Unit-Tested)
  // -------------------------------------------------------------------------
  function deflectRocketDirection(dir) {
    // Magic Mirror deflects Rocket beam 90 degrees: "h" <-> "v" (or vector {dr, dc} -> {-dc, dr})
    if (dir === "h" || dir === "horizontal") return "v";
    if (dir === "v" || dir === "vertical") return "h";
    if (dir && typeof dir === "object") {
      return { dr: -Number(dir.dc || 0), dc: Number(dir.dr || 0) };
    }
    return "v";
  }

  function traceRocketWithMirrors(grid, rows, cols, startR, startC, initialAxis = "h") {
    const visitedCells = new Set();
    const hitMirrors = [];
    const queue = [];

    if (initialAxis === "h") {
      queue.push({ r: startR, c: startC, dr: 0, dc: 1 });
      queue.push({ r: startR, c: startC, dr: 0, dc: -1 });
    } else if (initialAxis === "v") {
      queue.push({ r: startR, c: startC, dr: 1, dc: 0 });
      queue.push({ r: startR, c: startC, dr: -1, dc: 0 });
    } else {
      queue.push({ r: startR, c: startC, dr: 0, dc: 1 });
      queue.push({ r: startR, c: startC, dr: 0, dc: -1 });
      queue.push({ r: startR, c: startC, dr: 1, dc: 0 });
      queue.push({ r: startR, c: startC, dr: -1, dc: 0 });
    }

    visitedCells.add(startR + "," + startC);
    const seenRays = new Set();
    let safety = 0;

    while (queue.length > 0 && safety++ < 64) {
      const ray = queue.shift();
      let r = ray.r + ray.dr;
      let c = ray.c + ray.dc;
      while (r >= 0 && r < rows && c >= 0 && c < cols) {
        const key = r + "," + c;
        visitedCells.add(key);
        const cell = grid[r]?.[c];
        if (cell && cell.obs === "magic_mirror" && cell.ice > 0) {
          hitMirrors.push({ r, c });
          const deflected1 = { r, c, dr: -ray.dc, dc: ray.dr };
          const deflected2 = { r, c, dr: ray.dc, dc: -ray.dr };
          for (const nextRay of [deflected1, deflected2]) {
            const sig = `${nextRay.r},${nextRay.c},${nextRay.dr},${nextRay.dc}`;
            if (!seenRays.has(sig)) {
              seenRays.add(sig);
              queue.push(nextRay);
            }
          }
          break;
        }
        r += ray.dr;
        c += ray.dc;
      }
    }

    return { cells: visitedCells, hitMirrors };
  }

  function getLinkedSphinxCluster(grid, rows, cols, r, c) {
    const item = grid[r]?.[c];
    if (!item || item.obs !== "sleeping_sphinx" || !item.sphinxGroupId) {
      return [{ r, c }];
    }
    const group = [];
    for (let rr = 0; rr < rows; rr++) {
      for (let cc = 0; cc < cols; cc++) {
        const cell = grid[rr]?.[cc];
        if (cell && cell.obs === "sleeping_sphinx" && cell.sphinxGroupId === item.sphinxGroupId) {
          group.push({ r: rr, c: cc });
        }
      }
    }
    return group.length ? group : [{ r, c }];
  }

  function canBreakColorLockStone(cell, matchColorType, isExplosion = false) {
    if (!cell || cell.obs !== "color_lock_stone") return true;
    if (isExplosion) return true;
    const reqColor = Math.max(1, Math.min(6, Math.floor(Number(cell.lockColor || cell.type) || 1)));
    return Number(matchColorType) === reqColor;
  }

  function tickCursedHourglasses(grid, rows, cols) {
    const expired = [];
    const active = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r]?.[c];
        if (cell && cell.obs === "cursed_hourglass" && cell.ice > 0) {
          const cur = Number.isFinite(Number(cell.countdown)) ? Number(cell.countdown) : 6;
          cell.countdown = Math.max(0, cur - 1);
          if (cell.countdown <= 0) {
            expired.push({ r, c });
          } else {
            active.push({ r, c, countdown: cell.countdown });
          }
        }
      }
    }
    return { expired, active };
  }

  function pickJumpingBastetDestination(grid, rows, cols, r, c, rng = Math.random) {
    const candidates = [];
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const nb = grid[nr]?.[nc];
      if (nb && !nb.obs && !(nb.ice > 0) && !nb.special) {
        candidates.push({ r: nr, c: nc });
      }
    }
    if (!candidates.length) return null;
    return candidates[Math.floor(rng() * candidates.length)];
  }

  function pickSurpriseCoffinDrop(rng = Math.random) {
    const roll = rng();
    if (roll < 0.42) return { kind: "rocket", labelAr: "صاروخ مفاجأة! 🚀" };
    if (roll < 0.78) return { kind: "bomb", labelAr: "قنبلة مفاجأة! 💣" };
    return { kind: "coins", coins: 50, labelAr: "+50 عملة ذهبية! 🪙" };
  }

  function isCellSwapLockedByObstacle(cell) {
    if (!cell || !(cell.ice > 0)) return false;
    if (cell.obs === "golden_spiderweb") return true;
    // Standalone solid obstacles cannot be swapped directly; overlay/floor obstacles allow swap unless spiderwebbed
    const swappableOverlays = new Set(["single_ice", "double_ice", "hieroglyph_tile", "quicksand"]);
    if (cell.obs && !swappableOverlays.has(cell.obs)) return true;
    return false;
  }

  return Object.freeze({
    COLOR_KEYS,
    MEGA_PACK_ASSETS,
    STREAK_CALLOUTS,
    PRELEVEL_BOOSTER_POOL,
    REAL_MONEY_PACKS,
    INFINITE_REALM_TITLES_AR,
    mulberry32,
    hashStringSeed,
    getCandyPaletteForStage,
    getSpecialSpriteForCandy,
    getStageBoardWebp,
    isStrictSpecialSwapAllowed,
    createStreakAnnouncerEngine,
    getPreLevelBoosterRotation,
    getDailyShopComboBundle,
    deflectRocketDirection,
    traceRocketWithMirrors,
    getLinkedSphinxCluster,
    canBreakColorLockStone,
    tickCursedHourglasses,
    pickJumpingBastetDestination,
    pickSurpriseCoffinDrop,
    isCellSwapLockedByObstacle,
  });
});
