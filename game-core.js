(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CMRCore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PALACES_COUNT = 10;
  const STAGES_PER_PALACE = 100;
  const TOTAL_STAGES = PALACES_COUNT * STAGES_PER_PALACE;
  const BOSS_STAGE_IN_PALACE = 50;
  const BOSS_STAGES_IN_PALACE = Object.freeze([50, 100]);
  const MAX_LIVES = 5;

  const GAME_STATES = Object.freeze({
    PLAYING: "Playing",
    RESOLVING: "Resolving",
    WON: "Won",
    LOST: "Lost",
  });

  const PALACES = Object.freeze([
    {
      index: 0,
      id: "royal_castle",
      name: "قصر الواحة الذهبية",
      nameEn: "Golden Oasis Palace",
      tag: "القصر الأول",
      tagEn: "Palace 1",
      description: "أبراج الذهب الأزرق وبوابات النيل الملكية",
      descriptionEn: "Golden sapphire towers and royal Nile gates",
      icon: "👑",
      castleArt: "./assets/extracted/palaces/palace_01.png",
      interiorMap: "./public/assets/aistudio/palace_01_golden_sapphire_a0994a8a.png",
      mapPos: { x: 34.0, y: 91.5, scale: 1.04 },
      accent: "#38bdf8",
      boardPrefix: "royal_castle",
      boardStart: 1,
    },
    {
      index: 1,
      id: "pharaoh_temple",
      name: "معبد الجوهرة البنفسجية",
      nameEn: "Amethyst Orb Temple",
      tag: "القصر الثاني",
      tagEn: "Palace 2",
      description: "قباب السحر البنفسجي وتماثيل عنخ المضيئة",
      descriptionEn: "Amethyst mystic domes and glowing Ankh shrines",
      icon: "🏺",
      castleArt: "./assets/extracted/palaces/palace_02.png",
      interiorMap: "./public/assets/aistudio/palace_02_amethyst_bastet_e5ed5399.png",
      mapPos: { x: 75.2, y: 85.0, scale: 0.98 },
      accent: "#a855f7",
      boardPrefix: "pharaoh_temple",
      boardStart: 6,
    },
    {
      index: 2,
      id: "crystal_forest",
      name: "هرم الفيروز الكريستالي",
      nameEn: "Turquoise Sphinx Pyramid",
      tag: "القصر الثالث",
      tagEn: "Palace 3",
      description: "أبو الهول الذهبي وشلالات الزمرد السحرية",
      descriptionEn: "Golden sphinxes and emerald crystal cascades",
      icon: "🌿",
      castleArt: "./assets/extracted/palaces/palace_03.png",
      interiorMap: "./public/assets/aistudio/palace_03_emerald_sphinx_2c8e2b78.png",
      mapPos: { x: 27.8, y: 78.6, scale: 1.0 },
      accent: "#14b8a6",
      boardPrefix: "crystal_forest",
      boardStart: 11,
    },
    {
      index: 3,
      id: "ice_palace",
      name: "قلعة الياقوت المشتعل",
      nameEn: "Crimson Flame Citadel",
      tag: "القصر الرابع",
      tagEn: "Palace 4",
      description: "أبراج القرمزي الملكية وحراس النار الفرعونية",
      descriptionEn: "Crimson royal spires and pharaoh fire guardians",
      icon: "🔥",
      castleArt: "./assets/extracted/palaces/palace_04.png",
      interiorMap: "./public/assets/aistudio/palace_04_crimson_lava_10e1e8c3.png",
      mapPos: { x: 28.4, y: 65.8, scale: 1.0 },
      accent: "#ef4444",
      boardPrefix: "ice_palace",
      boardStart: 16,
    },
    {
      index: 4,
      id: "sky_kingdom",
      name: "قصر السماء واللازورد",
      nameEn: "Sapphire Sky Palace",
      tag: "القصر الخامس",
      tagEn: "Palace 5",
      description: "قباب اللازورد السماوية وينابيع النقاء",
      descriptionEn: "Azure sky domes and crystalline royal springs",
      icon: "☁️",
      castleArt: "./assets/extracted/palaces/palace_05.png",
      interiorMap: "./public/assets/aistudio/palace_05_azure_oasis_26b6d8d6.png",
      mapPos: { x: 75.5, y: 59.6, scale: 1.0 },
      accent: "#3b82f6",
      boardPrefix: "sky_kingdom",
      boardStart: 21,
    },
    {
      index: 5,
      id: "mermaid_reef",
      name: "حصن الزمرد الغامض",
      nameEn: "Obsidian Emerald Keep",
      tag: "القصر السادس",
      tagEn: "Palace 6",
      description: "بوابات الزمرد المضيئة وأسرار القلعة الداكنة",
      descriptionEn: "Glowing emerald portals and obsidian sanctums",
      icon: "💚",
      castleArt: "./assets/extracted/palaces/palace_06.png",
      interiorMap: "./public/assets/aistudio/palace_06_obsidian_emerald_081b0959.png",
      mapPos: { x: 27.9, y: 50.0, scale: 1.02 },
      accent: "#22c55e",
      boardPrefix: "mermaid_reef",
      boardStart: 26,
    },
    {
      index: 6,
      id: "ruby_cavern",
      name: "معبد الفرعون والشلالات",
      nameEn: "Pharaoh Falls Sanctuary",
      tag: "القصر السابع",
      tagEn: "Palace 7",
      description: "تمثال الفرعون العظيم وشلالات الذهب المتدفقة",
      descriptionEn: "Great Pharaoh monument and cascading sapphire falls",
      icon: "💎",
      castleArt: "./assets/extracted/palaces/palace_07.png",
      interiorMap: "./public/assets/aistudio/palace_07_pharaoh_sphinx_602cfc57.png",
      mapPos: { x: 74.6, y: 41.0, scale: 0.98 },
      accent: "#f59e0b",
      boardPrefix: "ruby_cavern",
      boardStart: 31,
    },
    {
      index: 7,
      id: "galaxy_observatory",
      name: "قصر اللوتس الوردي",
      nameEn: "Pink Lotus Jewel Palace",
      tag: "القصر الثامن",
      tagEn: "Palace 8",
      description: "زهرة اللوتس المتوهجة وحدائق الياقوت الوردي",
      descriptionEn: "Radiant lotus crown and rose jewel gardens",
      icon: "🌸",
      castleArt: "./assets/extracted/palaces/palace_08.png",
      interiorMap: "./public/assets/aistudio/palace_08_pink_lotus_98dcc7c0.png",
      mapPos: { x: 29.5, y: 31.2, scale: 1.0 },
      accent: "#ec4899",
      boardPrefix: "galaxy_observatory",
      boardStart: 36,
    },
    {
      index: 8,
      id: "sakura_garden",
      name: "قصر عين حورس الليلي",
      nameEn: "Eye of Horus Observatory",
      tag: "القصر التاسع",
      tagEn: "Palace 9",
      description: "هلال الليل السحري وبلورات النجوم الزرقاء",
      descriptionEn: "Midnight crescent spires and starlight crystals",
      icon: "🌙",
      castleArt: "./assets/extracted/palaces/palace_09.png",
      interiorMap: "./public/assets/aistudio/palace_09_midnight_horus_1c613bd3.png",
      mapPos: { x: 75.2, y: 23.0, scale: 1.02 },
      accent: "#6366f1",
      boardPrefix: "sakura_garden",
      boardStart: 41,
    },
    {
      index: 9,
      id: "autumn_village",
      name: "الهرم الملكي الأعظم",
      nameEn: "Grand Sun Scarab Pyramid",
      tag: "القصر العاشر",
      tagEn: "Palace 10",
      description: "قمة الشمس الذهبية وعرش ملك الحلوى النهائي",
      descriptionEn: "Golden sun summit and the Candy King throne",
      icon: "☀️",
      castleArt: "./assets/extracted/palaces/palace_10.png",
      interiorMap: "./public/assets/aistudio/palace_10_sun_pyramid_9d74e9e4.png",
      mapPos: { x: 50.1, y: 10.9, scale: 1.08 },
      accent: "#fbbf24",
      boardPrefix: "autumn_village",
      boardStart: 46,
    },
  ]);

  const INFINITE_REALM_TITLES_AR = Object.freeze([
    "معبد الخلود الذهبي",
    "هرم أوزوريس السماوي",
    "واحة حورس اللانهائية",
    "بوابة الشمس الأبدية",
    "عرش كليوباترا النجمي",
    "قصر النيل الكريستالي",
  ]);

  function clampStage(stage) {
    const n = Math.floor(Number(stage) || 1);
    return Math.max(1, n);
  }

  function getStageMeta(globalStage) {
    const stage = clampStage(globalStage);
    const palaceIndex = Math.floor((stage - 1) / STAGES_PER_PALACE);
    const stageInPalace = ((stage - 1) % STAGES_PER_PALACE) + 1;
    const basePalace = PALACES[palaceIndex % PALACES_COUNT] || PALACES[0];
    const isInfiniteRealm = palaceIndex >= PALACES_COUNT;
    const palace = isInfiniteRealm
      ? {
          ...basePalace,
          index: palaceIndex,
          name: `${INFINITE_REALM_TITLES_AR[(palaceIndex - PALACES_COUNT) % INFINITE_REALM_TITLES_AR.length]} #${palaceIndex + 1}`,
          nameEn: `Eternal Realm #${palaceIndex + 1}`,
          tag: `القصر اللانهائي ${palaceIndex + 1}`,
          tagEn: `Infinite Palace ${palaceIndex + 1}`,
        }
      : basePalace;
    const isBossStage = BOSS_STAGES_IN_PALACE.includes(stageInPalace);
    const bossNumber = isBossStage ? palaceIndex * 2 + (stageInPalace === 50 ? 1 : 2) : 0;
    const variantIndex = (stageInPalace - 1) % 5; // 0..4 => 5 WebP boards per palace
    const boardNumber = ((basePalace.boardStart - 1 + variantIndex) % 50) + 1; // 1..50
    const bossBoardNumber = isBossStage ? ((bossNumber - 1) % 20) + 1 : 0;
    const boardImagePath = isBossStage
      ? `./mega_pack/08_boards_boss_anubis_20/boss_anubis_board_${String(bossBoardNumber).padStart(2, "0")}.webp`
      : `./mega_pack/07_boards_regular_50/board_${String(boardNumber).padStart(2, "0")}.webp`;
    return {
      globalStage: stage,
      palaceIndex,
      palaceNumber: palaceIndex + 1,
      stageInPalace,
      palace,
      isInfiniteRealm,
      isBossStage,
      bossNumber,
      bossBoardNumber,
      bossName: isBossStage ? (stageInPalace === 100 ? "الملك أنوبيس الأعظم" : "الملك أنوبيس") : null,
      boardNumber,
      boardImagePath,
      candyTheme: (palaceIndex + 1) % 2 === 1 ? "royal_desserts" : "pharaonic_relics",
    };
  }

  const HARD_MILESTONE_STAGES = Object.freeze([10, 40, 75]);
  const SUPER_HARD_MILESTONE_STAGES = Object.freeze([25, 90]);

  function getStageDifficultyTier(stageInPalace) {
    const s = Math.max(1, Math.min(STAGES_PER_PALACE, Math.floor(Number(stageInPalace) || 1)));
    if (BOSS_STAGES_IN_PALACE.includes(s)) {
      return {
        tier: "boss",
        isHard: false,
        isSuperHard: false,
        isBoss: true,
        tagAr: s === 100 ? "الملك أنوبيس الأعظم 👑" : "الملك أنوبيس 👑",
        coinMultiplier: s === 100 ? 3 : 2,
      };
    }
    if (SUPER_HARD_MILESTONE_STAGES.includes(s)) {
      return {
        tier: "super_hard",
        isHard: false,
        isSuperHard: true,
        isBoss: false,
        tagAr: "تحدي فرعوني خارق ⚡",
        coinMultiplier: 2.5,
      };
    }
    if (HARD_MILESTONE_STAGES.includes(s)) {
      return {
        tier: "hard",
        isHard: true,
        isSuperHard: false,
        isBoss: false,
        tagAr: "مرحلة صعبة 🔥",
        coinMultiplier: 2,
      };
    }
    return {
      tier: "normal",
      isHard: false,
      isSuperHard: false,
      isBoss: false,
      tagAr: null,
      coinMultiplier: 1,
    };
  }

  // Palace-by-Palace progressive introduction of ALL 22 Standalone Animated 3D Obstacles
  const PALACE_OBSTACLE_THEMES = Object.freeze([
    ["hieroglyph_tile", "caramel_jar", "sandstone_block"], // Palace 1: clean intro + sandstone/caramel/hieroglyph
    ["bubble_gum", "scarab_gem_box", "golden_spiderweb"], // Palace 2: bubble gum + scarab + spiderweb
    ["crystal_egg", "pharaoh_vase", "surprise_coffin"], // Palace 3: crystal egg + vase + surprise coffin
    ["mummy_bandage", "fire_brazier", "quicksand"], // Palace 4: mummy bandage + fire brazier + quicksand
    ["lotus_flower", "magic_mirror", "color_lock_stone"], // Palace 5: lotus + 90° mirror + color-locked stone
    ["magic_lamp", "sleeping_sphinx", "scarab_gem_box"], // Palace 6: magic lamp + 2x2 sleeping sphinx
    ["obsidian_shield", "jumping_bastet", "pharaoh_vase"], // Palace 7: obsidian shield + jumping bastet
    ["pyramid_safe", "chocolate_fountain", "lotus_flower"], // Palace 8: pyramid safe + chocolate fountain
    ["cursed_hourglass", "magic_lamp", "obsidian_shield"], // Palace 9: 6-move cursed hourglass + lamp + shield
    ["sleeping_sphinx", "cursed_hourglass", "pyramid_safe"], // Palace 10: grand Anubis citadel mix
  ]);

  function getLevelConfig(globalStage) {
    const meta = getStageMeta(globalStage);
    const L = meta.globalStage;
    const s = meta.stageInPalace;
    const pIdx = meta.palaceIndex;
    const diffTier = getStageDifficultyTier(s);

    let obstacles = ["single_ice"];
    let diffLabel = "سهل";
    let introSingleLayer = false;
    let baseObstacles = 4;
    let moves = 25;

    const themeIdx = pIdx % PALACE_OBSTACLE_THEMES.length;
    const prevThemeIdx = (pIdx - 1 + PALACE_OBSTACLE_THEMES.length) % PALACE_OBSTACLE_THEMES.length;

    if (L <= 10) {
      // Tactical yet friendly First 10 Stages (Palace 1 Intro): 1-layer obstacles & Candy Crush pacing (8..13 tiles, 22..26 moves)
      introSingleLayer = true;
      if (L === 1) {
        obstacles = ["hieroglyph_tile", "sandstone_block"];
        baseObstacles = 8;
        moves = 25;
      } else if (L <= 3) {
        obstacles = ["hieroglyph_tile", "caramel_jar"];
        baseObstacles = 8 + (L - 1);
        moves = 24;
      } else if (L <= 6) {
        obstacles = ["caramel_jar", "sandstone_block"];
        baseObstacles = 10 + Math.floor((L - 3) / 2);
        moves = 23;
      } else if (L <= 9) {
        obstacles = ["hieroglyph_tile", "sandstone_block", "bubble_gum"];
        baseObstacles = 11 + Math.floor((L - 6) / 2);
        moves = 22;
      } else {
        // Stage 10: First Hard Milestone — tactical 1-layer mix, x2 coins!
        obstacles = ["caramel_jar", "sandstone_block", "scarab_gem_box"];
        baseObstacles = 13;
        moves = 22;
      }
      diffLabel = diffTier.isHard ? "مرحلة صعبة 🔥" : "سهل";
    } else if (meta.isBossStage) {
      // Stage 50 & 100 Boss (King Anubis): palace signature obstacles + high-stakes tactical count
      const theme = PALACE_OBSTACLE_THEMES[themeIdx] || PALACE_OBSTACLE_THEMES[0];
      obstacles =
        pIdx >= 4
          ? [theme[0], "obsidian_shield", "pyramid_safe"]
          : [theme[0], theme[2], "scarab_gem_box"];
      diffLabel = s === 100 ? "الملك أنوبيس الأعظم 👑" : "الملك أنوبيس 👑";
      baseObstacles = Math.min(24, 15 + Math.min(8, pIdx));
      moves = Math.max(22, 27 - Math.floor(Math.min(12, pIdx) / 3));
    } else {
      // Stages 11 -> Infinity: Balanced Candy Crush tactical pacing introducing all 22 3D obstacles
      const theme = PALACE_OBSTACLE_THEMES[themeIdx] || PALACE_OBSTACLE_THEMES[0];
      const prevTheme = PALACE_OBSTACLE_THEMES[prevThemeIdx] || theme;

      if (diffTier.isSuperHard) {
        obstacles =
          pIdx >= 2 || s >= 90
            ? [theme[1], theme[2], "obsidian_shield"]
            : [theme[0], theme[1], "fire_brazier"];
        diffLabel = "تحدي فرعوني خارق ⚡";
      } else if (diffTier.isHard) {
        obstacles =
          pIdx >= 3 && s >= 75
            ? [theme[0], theme[2], "obsidian_shield"]
            : [theme[0], theme[1], theme[2]];
        diffLabel = "مرحلة صعبة 🔥";
      } else if (s <= 30) {
        obstacles = [theme[0], theme[1]];
        diffLabel = pIdx === 0 ? "سهل" : "متوسط";
      } else if (s <= 65) {
        obstacles = [theme[1], theme[2]];
        diffLabel = "متوسط";
      } else {
        obstacles = [prevTheme[1], theme[1], theme[2]];
        diffLabel = "صعب";
      }

      const hardExtra = diffTier.isSuperHard ? 4 : diffTier.isHard ? 2 : 0;
      const infiniteExtra = pIdx >= PALACES_COUNT ? Math.min(4, Math.floor((pIdx - PALACES_COUNT + 1) / 2)) : 0;
      baseObstacles = Math.min(
        22,
        9 + Math.floor((s - 1) / 10) + Math.min(4, Math.floor(pIdx / 2)) + hardExtra + infiniteExtra
      );
      moves = Math.max(
        18,
        Math.min(26, 25 - Math.floor((s - 1) / 18) - (diffTier.isSuperHard ? 2 : diffTier.isHard ? 1 : 0))
      );
    }

    // Limit active mission types to max 3 distinct obstacles for the 3-slot Top Objective HUD
    const uniqueObstacles = Array.from(new Set(obstacles)).slice(0, 3);

    return {
      level: L,
      palaceIndex: meta.palaceIndex,
      palaceNumber: meta.palaceNumber,
      stageInPalace: s,
      isBossStage: meta.isBossStage,
      isHard: diffTier.isHard,
      isSuperHard: diffTier.isSuperHard,
      isHardStage: diffTier.isHard,
      isSuperHardStage: diffTier.isSuperHard,
      difficultyTier: diffTier.tier,
      difficultyTagAr: diffTier.tagAr,
      coinMultiplier: diffTier.coinMultiplier,
      introSingleLayer,
      bossName: meta.bossName,
      obstacleCount: Math.max(2, baseObstacles),
      moves,
      obstacles: uniqueObstacles,
      diffLabel,
      boardImagePath: meta.boardImagePath,
      boardNumber: meta.boardNumber,
    };
  }

  /**
   * Reliable state machine for gameplay phases.
   * Prevents permanent locks, post-win interference, and duplicate end modals.
   */
  function createGameStateMachine() {
    let phase = GAME_STATES.PLAYING;
    let outcomeEmitted = false;
    let actionLockToken = 0;

    return {
      get phase() {
        return phase;
      },
      get outcomeEmitted() {
        return outcomeEmitted;
      },
      resetToPlaying() {
        phase = GAME_STATES.PLAYING;
        outcomeEmitted = false;
        actionLockToken++;
        return phase;
      },
      canAcceptInput() {
        return phase === GAME_STATES.PLAYING && !outcomeEmitted;
      },
      beginResolving() {
        if (phase !== GAME_STATES.PLAYING || outcomeEmitted) return false;
        phase = GAME_STATES.RESOLVING;
        return true;
      },
      finishResolvingToPlaying() {
        if (phase === GAME_STATES.WON || phase === GAME_STATES.LOST || outcomeEmitted) {
          return false;
        }
        phase = GAME_STATES.PLAYING;
        return true;
      },
      evaluateOutcome({ levelReady, obstacleGoal, remainingObstacles, movesLeft }) {
        if (!levelReady || outcomeEmitted) {
          return null;
        }
        if (phase === GAME_STATES.WON || phase === GAME_STATES.LOST) {
          return null;
        }
        if (obstacleGoal > 0 && remainingObstacles <= 0) {
          phase = GAME_STATES.WON;
          outcomeEmitted = true;
          return GAME_STATES.WON;
        }
        if (movesLeft <= 0) {
          phase = GAME_STATES.LOST;
          outcomeEmitted = true;
          return GAME_STATES.LOST;
        }
        return null;
      },
      isTerminal() {
        return phase === GAME_STATES.WON || phase === GAME_STATES.LOST || outcomeEmitted;
      },
      getToken() {
        return actionLockToken;
      },
    };
  }

  /**
   * Atomic heart deduction manager for confirmed Restart / Exit actions.
   * Ensures 1 heart max per confirmed dialog, 0 on cancel, and prevents double-click bugs.
   */
  function createHeartActionGuard() {
    let pending = null;

    return {
      openConfirmation(actionType) {
        pending = {
          actionType,
          token: Symbol("confirm"),
          consumed: false,
        };
        return pending.token;
      },
      cancelConfirmation() {
        pending = null;
        return { deducted: false, actionType: null };
      },
      confirmAndDeduct(currentLives, token) {
        if (!pending || pending.consumed) {
          return { allowed: false, deducted: false, nextLives: currentLives, actionType: null };
        }
        if (token && pending.token !== token) {
          return { allowed: false, deducted: false, nextLives: currentLives, actionType: null };
        }
        pending.consumed = true;
        const actionType = pending.actionType;
        pending = null;
        const safeLives = Math.max(0, Math.min(MAX_LIVES, Math.floor(Number(currentLives) || 0)));
        const nextLives = Math.max(0, safeLives - 1);
        const deducted = nextLives < safeLives;
        return { allowed: true, deducted, nextLives, actionType };
      },
      hasPending() {
        return !!(pending && !pending.consumed);
      },
    };
  }

  function findMatchesInGrid(grid, rows, cols) {
    const found = new Set();
    const sameCandy = (a, b) => !!a && !!b && a.type === b.type;

    for (let r = 0; r < rows; r++) {
      let c = 0;
      while (c < cols) {
        const item = grid[r]?.[c];
        if (!item) {
          c++;
          continue;
        }
        let end = c + 1;
        while (end < cols && sameCandy(grid[r]?.[end], item)) end++;
        if (end - c >= 3) {
          for (let k = c; k < end; k++) found.add(r + "," + k);
        }
        c = end;
      }
    }

    for (let c = 0; c < cols; c++) {
      let r = 0;
      while (r < rows) {
        const item = grid[r]?.[c];
        if (!item) {
          r++;
          continue;
        }
        let end = r + 1;
        while (end < rows && sameCandy(grid[end]?.[c], item)) end++;
        if (end - r >= 3) {
          for (let k = r; k < end; k++) found.add(k + "," + c);
        }
        r = end;
      }
    }

    return found;
  }

  // =========================================================================
  // 6-Category Professional In-Game Store Catalog & Atomic Purchase Engine
  // =========================================================================
  const MAX_BOOSTER_STOCK = 25;

  const SHOP_FRAMES = Object.freeze({
    royal_blue: "./public/assets/aistudio/shop_royal_kingdom_blue_ab7c704a.png",
    royal_purple: "./public/assets/aistudio/shop_royal_kingdom_purple_02cd6eb8.png",
    candy_pink_blue: "./public/assets/aistudio/shop_candy_crush_pink_blue_56323b39.png",
    royal_open_azure: "./public/assets/aistudio/shop_royal_open_azure_a3f187e6.png",
  });

  const ROYAL_MODAL_FRAMES = Object.freeze({
    mail: "./public/assets/aistudio/ui_1_royal_mail_270fc2e1.png",
    achievements: "./public/assets/aistudio/ui_2_royal_achievements_5dc43009.png",
    calendar: "./public/assets/aistudio/ui_3_daily_calendar_c966c2ca.png",
    champions: "./public/assets/aistudio/ui_4_kingdom_champions_5dc36eea.png",
  });

  const SHOP_ICONS = Object.freeze({
    rocket: "./public/assets/aistudio/01_booster_candy_rocket_b53df03d.png",
    wand: "./public/assets/aistudio/02_booster_magic_wand_e83e8cc8.png",
    bomb: "./public/assets/aistudio/03_booster_candy_bomb_8bfca840.png",
    striped: "./public/assets/aistudio/04_booster_striped_candy_7749b182.png",
    mysteryBox: "./public/assets/aistudio/05_booster_mystery_box_864a8fca.png",
    coin: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png",
    chest: "./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png",
    combo1: "./public/assets/aistudio/combo_1_rocket_wand_bomb_coins_28a68e57.png",
    combo2: "./public/assets/aistudio/combo_2_bomb_striped_box_coins_a1efec08.png",
    combo3: "./public/assets/aistudio/combo_3_chest_rocket_wand_striped_273cd5ca.png",
    combo4: "./public/assets/aistudio/combo_4_coins_rocket_bomb_box_6b01e40e.png",
  });

  const STORE_CATEGORIES = Object.freeze([
    { id: "coins", label: "العملات الذهبية", shortLabel: "عملات", icon: SHOP_ICONS.coin },
    { id: "gems", label: "الجواهر", shortLabel: "جواهر", icon: "./assets/packs/buttons/icon_gem.png" },
    { id: "hearts", label: "القلوب", shortLabel: "قلوب", icon: "./assets/packs/buttons/icon_heart.png" },
    { id: "boosters", label: "المعززات", shortLabel: "معززات", icon: SHOP_ICONS.rocket },
    { id: "chests", label: "الصناديق والهدايا", shortLabel: "صناديق", icon: SHOP_ICONS.chest },
    { id: "offers", label: "العروض الخاصة", shortLabel: "عروض", icon: SHOP_ICONS.mysteryBox },
  ]);

  const STORE_ITEMS = Object.freeze([
    // 1. العملات الذهبية
    {
      id: "coins_pouch",
      category: "coins",
      name: "كيس العملات الذهبية",
      shortTitle: "عملات ملكية",
      shortQty: "+300 عملة",
      description: "احصل فوراً على +300 عملة ذهبية لشراء القلوب والمعززات.",
      image: SHOP_ICONS.coin,
      currency: "gems",
      price: 5,
      reward: { coins: 300 },
    },
    {
      id: "coins_sack",
      category: "coins",
      name: "حقيبة الكنز الملكي",
      shortTitle: "حقيبة الكنز",
      shortQty: "+850 عملة",
      description: "احصل على +850 عملة ذهبية بقيمة أفضل للمغامرين.",
      image: SHOP_ICONS.combo4,
      currency: "gems",
      price: 12,
      badge: "الأكثر طلباً",
      reward: { coins: 850 },
    },
    {
      id: "coins_vault",
      category: "coins",
      name: "خزينة الفراعنة الذهبية",
      shortTitle: "خزينة الذهب",
      shortQty: "+2,000 عملة",
      description: "كنز ضخم يمنحك +2,000 عملة ذهبية دفعة واحدة.",
      image: SHOP_ICONS.chest,
      currency: "gems",
      price: 24,
      badge: "قيمة ملكية",
      reward: { coins: 2000 },
    },
    {
      id: "ad_free_coins",
      category: "coins",
      name: "عملات مجانية مقابل إعلان",
      shortTitle: "عملات مجانية",
      shortQty: "+100 عملة",
      description: "شاهد إعلاناً مكافأً بالكامل لتحصل على +100 عملة ذهبية مجاناً.",
      image: SHOP_ICONS.coin,
      currency: "rewarded_ad",
      price: 0,
      adPlacement: "free_coins",
      reward: { coins: 100 },
    },

    // 2. الجواهر
    {
      id: "gems_crystal",
      category: "gems",
      name: "حزمة الجواهر السحرية",
      shortTitle: "جواهر سحرية",
      shortQty: "+5 جواهر",
      description: "استبدل عملاتك الذهبية بـ +5 جواهر ملكية نادرة.",
      image: "./assets/packs/images/gem_blue.png",
      currency: "coins",
      price: 350,
      reward: { gems: 5 },
    },
    {
      id: "gems_royal_bundle",
      category: "gems",
      name: "مجموعة جواهر القصر",
      shortTitle: "جواهر القصر",
      shortQty: "+15 جوهرة",
      description: "استبدل عملاتك بـ +15 جوهرة ملكية لفتح الصناديق والعروض.",
      image: "./assets/packs/images/currency_gem.png",
      currency: "coins",
      price: 950,
      badge: "توفير 10%",
      reward: { gems: 15 },
    },
    {
      id: "gems_crown_pack",
      category: "gems",
      name: "تاج الجواهر الفرعوني",
      shortTitle: "تاج الجواهر",
      shortQty: "+40 جوهرة",
      description: "أكبر حزمة جواهر داخل اللعبة: +40 جوهرة ملكية.",
      image: "./03_diamond_blue.png",
      currency: "coins",
      price: 2200,
      badge: "ملكي",
      reward: { gems: 40 },
    },

    // 3. القلوب
    {
      id: "heart_single",
      category: "hearts",
      name: "قلب إضافي واحد",
      shortTitle: "قلب إضافي",
      shortQty: "+1 قلب",
      description: "استعد +1 قلب فوراً لمتابعة التحدي دون انتظار.",
      image: "./assets/packs/images/heart.png",
      currency: "coins",
      price: 150,
      requiresMissingHearts: true,
      reward: { lives: 1 },
    },
    {
      id: "hearts_full_refill",
      category: "hearts",
      name: "تعبئة القلوب بالكامل",
      shortTitle: "تعبئة كاملة",
      shortQty: "5/5 قلوب",
      description: "املأ جميع القلوب إلى الحد الأقصى (5 قلوب كاملة) فوراً.",
      image: "./02_heart_rainbow.png",
      currency: "gems",
      price: 6,
      badge: "تعبئة كاملة",
      requiresMissingHearts: true,
      reward: { fillLives: true },
    },
    {
      id: "ad_extra_heart",
      category: "hearts",
      name: "قلب مجاني مقابل إعلان",
      shortTitle: "قلب مجاني",
      shortQty: "+1 قلب",
      description: "شاهد إعلاناً مكافأً بالكامل لتحصل على +1 قلب إضافي.",
      image: "./assets/packs/buttons/icon_heart.png",
      currency: "rewarded_ad",
      price: 0,
      adPlacement: "extra_heart",
      requiresMissingHearts: true,
      reward: { lives: 1 },
    },

    // 4. المعززات
    {
      id: "booster_rocket_3",
      category: "boosters",
      name: "حزمة الصواريخ (×3)",
      shortTitle: "صاروخ الحلوى",
      shortQty: "×3 صواريخ",
      description: "تضيف 3 صواريخ سحرية لمسح صف وعمود بالكامل.",
      image: SHOP_ICONS.rocket,
      currency: "coins",
      price: 140,
      reward: { rockets: 3 },
    },
    {
      id: "booster_paint_3",
      category: "boosters",
      name: "العصا السحرية (×3)",
      shortTitle: "العصا السحرية",
      shortQty: "×3 عصا نجمية",
      description: "تضيف 3 عصي سحرية لتغيير لون أي قطعة حلوى بذكاء.",
      image: SHOP_ICONS.wand,
      currency: "coins",
      price: 130,
      reward: { paints: 3 },
    },
    {
      id: "booster_bomb_3",
      category: "boosters",
      name: "قنبلة الحلوى (×3)",
      shortTitle: "قنبلة الحلوى",
      shortQty: "×3 قنابل",
      description: "تضيف 3 قنابل لتفجير مساحة 3×3 وتحطيم العوائق الصعبة.",
      image: SHOP_ICONS.bomb,
      currency: "coins",
      price: 150,
      reward: { hammer: 3 },
    },
    {
      id: "booster_color_3",
      category: "boosters",
      name: "الحلوى المخططة (×3)",
      shortTitle: "حلوى مخططة",
      shortQty: "×3 مخططة",
      description: "تضيف 3 معززات ملكية لمسح كل القطع المتشابهة في اللوحة.",
      image: SHOP_ICONS.striped,
      currency: "coins",
      price: 180,
      reward: { colors: 3 },
    },
    {
      id: "ad_free_booster",
      category: "boosters",
      name: "معزز مجاني مقابل إعلان",
      shortTitle: "معزز مجاني",
      shortQty: "×1 قنبلة و×1 صاروخ",
      description: "شاهد إعلاناً مكافأً لتحصل على +1 قنبلة و+1 صاروخ مجاناً.",
      image: SHOP_ICONS.combo1,
      currency: "rewarded_ad",
      price: 0,
      adPlacement: "free_booster",
      reward: { hammer: 1, rockets: 1 },
    },

    // 5. الصناديق والهدايا
    {
      id: "chest_silver",
      category: "chests",
      name: "صندوق المفاجآت السحري",
      shortTitle: "صندوق مفاجأة",
      shortQty: "120 عملة + 3 معززات",
      description: "يمنحك 120 عملة + 1 قنبلة + 1 صاروخ + 1 عصا مباشرة في مخزونك.",
      image: SHOP_ICONS.mysteryBox,
      currency: "coins",
      price: 220,
      reward: { coins: 120, hammer: 1, rockets: 1, paints: 1 },
    },
    {
      id: "chest_royal_gold",
      category: "chests",
      name: "صندوق الكنز الملكي",
      shortTitle: "صندوق الكنز",
      shortQty: "300 عملة + 6 معززات",
      description: "يمنحك 300 عملة + 2 قنبلة + 2 صاروخ + 2 حلوى مخططة.",
      image: SHOP_ICONS.chest,
      currency: "gems",
      price: 10,
      badge: "كنز ملكي",
      reward: { coins: 300, hammer: 2, rockets: 2, colors: 2 },
    },
    {
      id: "ad_reward_chest",
      category: "chests",
      name: "صندوق الهدايا المجاني (إعلان)",
      shortTitle: "صندوق هدايا",
      shortQty: "75 عملة + معزز",
      description: "شاهد إعلاناً مكافأً لفتح الصندوق والحصول على عملات ومعزز مجاناً.",
      image: SHOP_ICONS.mysteryBox,
      currency: "rewarded_ad",
      price: 0,
      adPlacement: "reward_chest",
      reward: { coins: 75, paints: 1, gems: 1 },
    },

    // 6. العروض الخاصة (Includes all 4 Triple-Combo Bundles!)
    {
      id: "combo_mega_featured",
      category: "offers",
      name: "الحزمة الملكية الكبرى",
      shortTitle: "الحزمة الكبرى",
      shortQty: "500 عملة · ×6 معززات",
      description: "صندوق الكنز + ×2 صاروخ + ×2 عصا سحرية + ×2 حلوى مخططة + 500 عملة!",
      image: SHOP_ICONS.combo3,
      currency: "gems",
      price: 15,
      badge: "العرض المميز",
      reward: { coins: 500, rockets: 2, paints: 2, colors: 2 },
    },
    {
      id: "combo_pack_1",
      category: "offers",
      name: "باقة الأبطال الثلاثية",
      shortTitle: "باقة الأبطال",
      shortQty: "350 عملة + 3 معززات",
      description: "صاروخ + عصا سحرية + قنبلة الحلوى + 350 عملة ذهبية.",
      image: SHOP_ICONS.combo1,
      currency: "gems",
      price: 8,
      badge: "الأكثر مبيعاً",
      reward: { coins: 350, rockets: 1, paints: 1, hammer: 1 },
    },
    {
      id: "combo_pack_2",
      category: "offers",
      name: "باقة الانفجار السحري",
      shortTitle: "باقة الانفجار",
      shortQty: "×4 معززات + 3 جواهر",
      description: "×2 قنبلة حلوى + ×2 حلوى مخططة + صندوق مفاجآت (+3 جواهر).",
      image: SHOP_ICONS.combo2,
      currency: "coins",
      price: 380,
      badge: "وفر 30%",
      reward: { hammer: 2, colors: 2, gems: 3 },
    },
    {
      id: "combo_pack_4",
      category: "offers",
      name: "حزمة الكنز والصواريخ",
      shortTitle: "كنز الصواريخ",
      shortQty: "650 عملة + 5 معززات",
      description: "650 عملة + ×2 صاروخ + ×2 قنبلة + ×1 عصا سحرية.",
      image: SHOP_ICONS.combo4,
      currency: "gems",
      price: 11,
      badge: "قيمة فائقة",
      reward: { coins: 650, rockets: 2, hammer: 2, paints: 1 },
    },
    {
      id: "offer_daily_gift",
      category: "offers",
      name: "هدية المملكة اليومية",
      shortTitle: "هدية اليوم",
      shortQty: "100 عملة + 2 جوهرة",
      description: "هدية مجانية يومية: +100 عملة ذهبية و+2 جوهرة (مرة كل يوم).",
      image: SHOP_ICONS.mysteryBox,
      currency: "free_daily",
      price: 0,
      badge: "مجاني يومياً",
      reward: { coins: 100, gems: 2 },
    },
    {
      id: "offer_boss_slayer",
      category: "offers",
      name: "حزمة قاهر الملك أنوبيس",
      shortTitle: "قاهر أنوبيس",
      shortQty: "×8 معززات + 5 قلوب",
      description: "استعد لمعركة الملك أنوبيس: +3 قنابل، +3 صواريخ، +2 كرة ألوان، وتعبئة قلوب!",
      image: SHOP_ICONS.combo3,
      currency: "gems",
      price: 14,
      badge: "عرض خاص",
      reward: { hammer: 3, rockets: 3, colors: 2, fillLives: true },
    },
    {
      id: "offer_starter_royal",
      category: "offers",
      name: "عرض البداية الذهبي",
      shortTitle: "عرض البداية",
      shortQty: "×6 معززات + 4 جواهر",
      description: "عرض مميز بالعملات: +2 قنبلة، +2 صاروخ، +2 عصا سحرية، و+4 جواهر.",
      image: SHOP_ICONS.combo1,
      currency: "coins",
      price: 420,
      badge: "وفر 35%",
      reward: { hammer: 2, rockets: 2, paints: 2, gems: 4 },
    },
    // High-value Real-Money Packs — BLANK/EMPTY priceLabel ready for Google Play Billing!
    {
      id: "iap_pharaoh_starter",
      category: "offers",
      name: "حزمة الفراعنة الملكية",
      shortTitle: "حزمة الفراعنة",
      shortQty: "1,500 عملة + 25 جوهرة + ×6 معززات",
      description: "حزمة قيمة ملكية جاهزة للشراء المباشر عبر المتجر الرسمي.",
      image: SHOP_ICONS.combo4,
      currency: "real_money",
      price: 0,
      priceLabel: "",
      sku: "cmr_pharaoh_starter_pack",
      badge: "قيمة فائقة",
      reward: { coins: 1500, gems: 25, rockets: 2, hammer: 2, colors: 2 },
    },
    {
      id: "iap_anubis_vault",
      category: "offers",
      name: "خزينة أنوبيس الذهبية",
      shortTitle: "خزينة أنوبيس",
      shortQty: "4,000 عملة + 75 جوهرة + ×12 معززات",
      description: "كنز ضخم من العملات والجواهر النادرة والمعززات الملكية.",
      image: SHOP_ICONS.chest,
      currency: "real_money",
      price: 0,
      priceLabel: "",
      sku: "cmr_anubis_golden_vault",
      badge: "الأكثر قيمة",
      reward: { coins: 4000, gems: 75, rockets: 4, hammer: 4, colors: 4, fillLives: true },
    },
    {
      id: "iap_cleopatra_treasury",
      category: "gems",
      name: "خزانة الملكة كليوباترا",
      shortTitle: "خزانة كليوباترا",
      shortQty: "10,000 عملة + 200 جوهرة + ×20 معززات",
      description: "أضخم كنز ملكي في مملكة الحلوى الفرعونية.",
      image: SHOP_ICONS.combo3,
      currency: "real_money",
      price: 0,
      priceLabel: "",
      sku: "cmr_cleopatra_royal_treasury",
      badge: "أسطوري 👑",
      reward: { coins: 10000, gems: 200, rockets: 8, hammer: 6, colors: 6, fillLives: true },
    },
  ]);

  const SHOP_FEATURED_BUNDLE_ID = "combo_mega_featured";
  const SHOP_SHOWCASE_IDS = Object.freeze([
    "combo_pack_1",
    "combo_pack_2",
    "combo_pack_4",
    "booster_rocket_3",
    "booster_bomb_3",
    "chest_royal_gold",
  ]);

  // =========================================================================
  // Daily Lucky Spin Wheel — 8 Equal 45-Degree Slices & Pure Rotation Math
  // =========================================================================
  const LUCKY_WHEEL_ASSETS = Object.freeze({
    disc: "./assets/extracted/wheel/lucky_wheel_disc_8slices.png",
    pointer: "./assets/extracted/wheel/lucky_wheel_pointer.png",
    hub: "./assets/extracted/wheel/lucky_wheel_hub_blank.png",
    preview: "./public/assets/aistudio/lucky_wheel_1_compact_1_1_e76b2f6a.png",
  });

  const LUCKY_WHEEL_SLICES = Object.freeze([
    {
      index: 0,
      id: "coins_150",
      angleDeg: 22.5,
      labelAr: "+150",
      labelEn: "+150",
      titleAr: "150 عملة ذهبية",
      titleEn: "150 Gold Coins",
      icon: SHOP_ICONS.coin,
      reward: { coins: 150 },
      weight: 22,
    },
    {
      index: 1,
      id: "rockets_2",
      angleDeg: 67.5,
      labelAr: "×2",
      labelEn: "×2",
      titleAr: "صاروخ الحلوى ×2",
      titleEn: "Candy Rocket ×2",
      icon: SHOP_ICONS.rocket,
      reward: { rockets: 2 },
      weight: 14,
    },
    {
      index: 2,
      id: "coins_300",
      angleDeg: 112.5,
      labelAr: "+300",
      labelEn: "+300",
      titleAr: "300 عملة ذهبية",
      titleEn: "300 Gold Coins",
      icon: SHOP_ICONS.coin,
      reward: { coins: 300 },
      weight: 14,
    },
    {
      index: 3,
      id: "wands_2",
      angleDeg: 157.5,
      labelAr: "×2",
      labelEn: "×2",
      titleAr: "العصا السحرية ×2",
      titleEn: "Magic Star Wand ×2",
      icon: SHOP_ICONS.wand,
      reward: { paints: 2 },
      weight: 13,
    },
    {
      index: 4,
      id: "bombs_2",
      angleDeg: 202.5,
      labelAr: "×2",
      labelEn: "×2",
      titleAr: "قنبلة الحلوى ×2",
      titleEn: "Candy Bomb ×2",
      icon: SHOP_ICONS.bomb,
      reward: { hammer: 2 },
      weight: 13,
    },
    {
      index: 5,
      id: "striped_2",
      angleDeg: 247.5,
      labelAr: "×2",
      labelEn: "×2",
      titleAr: "الحلوى المخططة ×2",
      titleEn: "Striped Candy ×2",
      icon: SHOP_ICONS.striped,
      reward: { colors: 2 },
      weight: 11,
    },
    {
      index: 6,
      id: "mystery_box",
      angleDeg: 292.5,
      labelAr: "هدية!",
      labelEn: "BOX",
      titleAr: "صندوق المفاجآت السحري",
      titleEn: "Mystery Surprise Box",
      icon: SHOP_ICONS.mysteryBox,
      reward: { coins: 120, gems: 2, paints: 1 },
      weight: 8,
    },
    {
      index: 7,
      id: "royal_chest",
      angleDeg: 337.5,
      labelAr: "كنز!",
      labelEn: "JACKPOT",
      titleAr: "صندوق الكنز الملكي!",
      titleEn: "Royal Treasure Chest!",
      icon: SHOP_ICONS.chest,
      reward: { coins: 500, gems: 5, rockets: 1, hammer: 1 },
      weight: 5,
    },
  ]);

  function pickWeightedWheelSliceIndex(rng = Math.random) {
    const totalWeight = LUCKY_WHEEL_SLICES.reduce((sum, s) => sum + (s.weight || 1), 0);
    let roll = Math.max(0, Math.min(0.999999, Number(rng()))) * totalWeight;
    for (let i = 0; i < LUCKY_WHEEL_SLICES.length; i++) {
      roll -= LUCKY_WHEEL_SLICES[i].weight || 1;
      if (roll <= 0) return i;
    }
    return 0;
  }

  function computeWheelSpinTarget(currentDeg, targetIndex, extraTurns = 5, jitterDeg = 0) {
    const sliceCount = LUCKY_WHEEL_SLICES.length;
    const sliceArc = 360 / sliceCount; // 45 deg
    const safeIdx = ((Math.floor(Number(targetIndex) || 0) % sliceCount) + sliceCount) % sliceCount;
    const safeJitter = Math.max(-12, Math.min(12, Number(jitterDeg) || 0));
    const sliceCenter = safeIdx * sliceArc + sliceArc / 2; // 22.5 + 45*i
    const desiredMod = (360 - sliceCenter + safeJitter + 720) % 360;
    const safeCurrent = Number.isFinite(Number(currentDeg)) ? Number(currentDeg) : 0;
    const currentMod = ((safeCurrent % 360) + 360) % 360;
    let delta = desiredMod - currentMod;
    if (delta <= 0) delta += 360;
    const turns = Math.max(3, Math.floor(Number(extraTurns) || 5));
    return safeCurrent + turns * 360 + delta;
  }

  function resolveWheelSliceFromAngle(finalDeg) {
    const sliceCount = LUCKY_WHEEL_SLICES.length;
    const sliceArc = 360 / sliceCount;
    const norm = ((Number(finalDeg) || 0) % 360 + 360) % 360;
    // Wheel rotated clockwise by norm -> the wheel angle sitting under 12 o'clock (0 deg) is (360 - norm) % 360
    const wheelAngleAtPointer = (360 - norm) % 360;
    const index = Math.floor(wheelAngleAtPointer / sliceArc) % sliceCount;
    return {
      index,
      slice: LUCKY_WHEEL_SLICES[index],
    };
  }

  function getStoreItemById(itemId) {
    return STORE_ITEMS.find((item) => item.id === itemId) || null;
  }

  function formatRewardSummaryArabic(reward) {
    const parts = [];
    if (reward.coins) parts.push(`+${reward.coins} عملة ذهبية`);
    if (reward.gems) parts.push(`+${reward.gems} جوهرة`);
    if (reward.fillLives) parts.push("تعبئة كاملة للقلوب (5)");
    else if (reward.lives) parts.push(`+${reward.lives} قلب`);
    if (reward.hammer) parts.push(`+${reward.hammer} قنبلة`);
    if (reward.rockets) parts.push(`+${reward.rockets} صاروخ`);
    if (reward.colors) parts.push(`+${reward.colors} عجلة ألوان`);
    if (reward.paints) parts.push(`+${reward.paints} فرشاة`);
    if (reward.extraMoves) parts.push(`+${reward.extraMoves} حركات إضافية`);
    return parts.join(" · ");
  }

  function applyRewardToInventory(inventory, reward) {
    const next = {
      coins: Math.max(0, Math.floor(Number(inventory.coins) || 0)),
      gems: Math.max(0, Math.floor(Number(inventory.gems) || 0)),
      lives: Math.max(0, Math.min(MAX_LIVES, Math.floor(Number(inventory.lives) || 0))),
      hammer: Math.max(0, Math.floor(Number(inventory.hammer) || 0)),
      rockets: Math.max(0, Math.floor(Number(inventory.rockets) || 0)),
      colors: Math.max(0, Math.floor(Number(inventory.colors) || 0)),
      paints: Math.max(0, Math.floor(Number(inventory.paints) || 0)),
    };
    if (reward.coins) next.coins += reward.coins;
    if (reward.gems) next.gems += reward.gems;
    if (reward.fillLives) next.lives = MAX_LIVES;
    else if (reward.lives) next.lives = Math.min(MAX_LIVES, next.lives + reward.lives);
    if (reward.hammer) next.hammer = Math.min(MAX_BOOSTER_STOCK, next.hammer + reward.hammer);
    if (reward.rockets) next.rockets = Math.min(MAX_BOOSTER_STOCK, next.rockets + reward.rockets);
    if (reward.colors) next.colors = Math.min(MAX_BOOSTER_STOCK, next.colors + reward.colors);
    if (reward.paints) next.paints = Math.min(MAX_BOOSTER_STOCK, next.paints + reward.paints);
    return next;
  }

  function createStoreEngine() {
    let inFlight = false;
    let lastPurchaseAt = 0;

    return {
      purchase(inventory, itemId, options = {}) {
        const now = typeof options.now === "number" ? options.now : Date.now();
        const minGapMs = typeof options.minGapMs === "number" ? options.minGapMs : 350;
        const todayKey = options.todayKey || new Date(now).toISOString().slice(0, 10);
        const dailyClaims = options.dailyClaims || {};

        if (inFlight || (lastPurchaseAt > 0 && now - lastPurchaseAt < minGapMs)) {
          return {
            ok: false,
            reason: "duplicate_click",
            inventory,
            message: "يرجى الانتظار لحظة قبل إتمام عملية شراء أخرى.",
          };
        }

        const item = getStoreItemById(itemId);
        if (!item) {
          return { ok: false, reason: "not_found", inventory, message: "هذا المنتج غير متاح حالياً." };
        }

        if (item.currency === "rewarded_ad") {
          return {
            ok: false,
            reason: "requires_ad",
            inventory,
            adPlacement: item.adPlacement,
            message: "هذا العرض يتطلب مشاهدة إعلان مكافأ بالكامل.",
          };
        }

        if (item.currency === "real_money") {
          return {
            ok: false,
            reason: "requires_play_billing",
            inventory,
            sku: item.sku || item.id,
            message: "حزمة جاهزة للربط مع Google Play Billing فور نشر التطبيق على المتجر.",
          };
        }

        inFlight = true;
        try {
          const safeInv = {
            coins: Math.max(0, Math.floor(Number(inventory.coins) || 0)),
            gems: Math.max(0, Math.floor(Number(inventory.gems) || 0)),
            lives: Math.max(0, Math.min(MAX_LIVES, Math.floor(Number(inventory.lives) || 0))),
            hammer: Math.max(0, Math.floor(Number(inventory.hammer) || 0)),
            rockets: Math.max(0, Math.floor(Number(inventory.rockets) || 0)),
            colors: Math.max(0, Math.floor(Number(inventory.colors) || 0)),
            paints: Math.max(0, Math.floor(Number(inventory.paints) || 0)),
          };

          if (item.requiresMissingHearts && safeInv.lives >= MAX_LIVES) {
            return { ok: false, reason: "hearts_full", inventory: safeInv, message: "قلوبك ممتلئة بالفعل (5/5)!" };
          }

          if (item.currency === "free_daily") {
            if (dailyClaims[item.id] === todayKey) {
              return {
                ok: false,
                reason: "already_claimed_today",
                inventory: safeInv,
                message: "استلمت هدية اليوم بالفعل. عد غداً لهدية جديدة!",
              };
            }
          } else if (item.currency === "coins") {
            if (safeInv.coins < item.price) {
              return {
                ok: false,
                reason: "insufficient_coins",
                inventory: safeInv,
                message: `رصيدك من العملات الذهبية غير كافٍ (تحتاج ${item.price} عملة).`,
              };
            }
            safeInv.coins -= item.price;
          } else if (item.currency === "gems") {
            if (safeInv.gems < item.price) {
              return {
                ok: false,
                reason: "insufficient_gems",
                inventory: safeInv,
                message: `رصيدك من الجواهر غير كافٍ (تحتاج ${item.price} جوهرة).`,
              };
            }
            safeInv.gems -= item.price;
          }

          // Guard against booster over-cap when buying pure booster packs
          const pureBoosterKeys = ["hammer", "rockets", "colors", "paints"].filter(
            (k) => item.reward[k] && !item.reward.coins && !item.reward.gems && !item.reward.fillLives
          );
          if (
            pureBoosterKeys.length === 1 &&
            safeInv[pureBoosterKeys[0]] >= MAX_BOOSTER_STOCK
          ) {
            return {
              ok: false,
              reason: "stock_full",
              inventory,
              message: `وصلت إلى الحد الأقصى من هذا المعزز (${MAX_BOOSTER_STOCK}).`,
            };
          }

          const updated = applyRewardToInventory(safeInv, item.reward);
          lastPurchaseAt = now;
          return {
            ok: true,
            reason: "purchased",
            item,
            inventory: updated,
            claimedDate: item.currency === "free_daily" ? todayKey : null,
            message: `تم الحصول على ${item.name}: ${formatRewardSummaryArabic(item.reward)}`,
          };
        } finally {
          inFlight = false;
        }
      },
    };
  }

  // =========================================================================
  // Legitimate Rewarded Advertisement Architecture (Strict Anti-Fake Guard)
  // =========================================================================
  const REWARDED_AD_DAILY_TOTAL_LIMIT = 8;

  const REWARDED_AD_PLACEMENTS = Object.freeze({
    free_coins: {
      id: "free_coins",
      title: "عملات ذهبية مجانية",
      description: "شاهد إعلاناً مكافأً بالكامل لتحصل على +100 عملة ذهبية مجانية.",
      dailyLimit: 3,
      reward: { coins: 100 },
    },
    extra_heart: {
      id: "extra_heart",
      title: "قلب إضافي مجاني",
      description: "شاهد إعلاناً مكافأً بالكامل لاستعادة +1 قلب إضافي فوراً.",
      dailyLimit: 2,
      reward: { lives: 1 },
    },
    free_booster: {
      id: "free_booster",
      title: "معززات مجانية",
      description: "شاهد إعلاناً مكافأً بالكامل للحصول على +1 قنبلة و+1 صاروخ.",
      dailyLimit: 2,
      reward: { hammer: 1, rockets: 1 },
    },
    reward_chest: {
      id: "reward_chest",
      title: "صندوق الهدايا المجاني",
      description: "شاهد إعلاناً مكافأً لفتح صندوق يحتوي على +75 عملة و+1 فرشاة و+1 جوهرة.",
      dailyLimit: 2,
      reward: { coins: 75, paints: 1, gems: 1 },
    },
    extra_moves: {
      id: "extra_moves",
      title: "+5 حركات إضافية",
      description: "شاهد إعلاناً مكافأً بالكامل لإضافة 5 حركات ومتابعة المرحلة فوراً.",
      dailyLimit: 3,
      reward: { extraMoves: 5 },
    },
    lucky_wheel_spin: {
      id: "lucky_wheel_spin",
      title: "لفة إضافية لعجلة الحظ",
      description: "شاهد إعلاناً مكافأً بالكامل للحصول على لفة إضافية في عجلة الحظ اليومية.",
      dailyLimit: 2,
      reward: { bonusWheelSpin: 1 },
    },
  });

  function createRewardedAdEngine(initialState = {}) {
    let provider = null;
    let activeSession = null;
    const state = {
      date: initialState.date || new Date().toISOString().slice(0, 10),
      totalToday: Math.max(0, Math.floor(Number(initialState.totalToday) || 0)),
      byPlacement: { ...(initialState.byPlacement || {}) },
    };

    function rollDayIfNeeded(todayKey) {
      if (state.date !== todayKey) {
        state.date = todayKey;
        state.totalToday = 0;
        state.byPlacement = {};
      }
    }

    return {
      registerProvider(adapter) {
        if (!adapter || typeof adapter.showRewardedAd !== "function") {
          throw new Error("Ad provider must implement showRewardedAd(placementId, callbacks)");
        }
        provider = adapter;
      },
      clearProvider() {
        provider = null;
      },
      getProviderInfo() {
        if (!provider) {
          return {
            configured: false,
            providerName: null,
            requiredSetup:
              "يلزم ربط شبكة إعلانات رسمية معتمدة (مثل Google AdSense H5 Games Placement ID أو Google AdMob Rewarded Ad Unit ID لتطبيق Android) قبل تفعيل المكافآت الإعلانية.",
          };
        }
        return {
          configured: true,
          providerName: provider.name || "Authorized Ad Network",
          requiredSetup: null,
        };
      },
      getQuota(placementId, todayKey = new Date().toISOString().slice(0, 10)) {
        rollDayIfNeeded(todayKey);
        const placement = REWARDED_AD_PLACEMENTS[placementId];
        if (!placement) return null;
        const usedPlacement = Number(state.byPlacement[placementId]) || 0;
        const remainingPlacement = Math.max(0, placement.dailyLimit - usedPlacement);
        const remainingTotal = Math.max(0, REWARDED_AD_DAILY_TOTAL_LIMIT - state.totalToday);
        return {
          placement,
          usedToday: usedPlacement,
          dailyLimit: placement.dailyLimit,
          remainingToday: Math.min(remainingPlacement, remainingTotal),
          totalToday: state.totalToday,
          totalLimit: REWARDED_AD_DAILY_TOTAL_LIMIT,
        };
      },
      exportState() {
        return {
          date: state.date,
          totalToday: state.totalToday,
          byPlacement: { ...state.byPlacement },
        };
      },
      requestAd(placementId, options = {}) {
        const todayKey = options.todayKey || new Date().toISOString().slice(0, 10);
        rollDayIfNeeded(todayKey);
        const placement = REWARDED_AD_PLACEMENTS[placementId];
        if (!placement) {
          return Promise.resolve({
            ok: false,
            status: "invalid_placement",
            granted: false,
            message: "موضع الإعلان المطلوب غير صالح.",
          });
        }
        if (activeSession) {
          return Promise.resolve({
            ok: false,
            status: "busy",
            granted: false,
            message: "يوجد إعلان قيد التشغيل بالفعل.",
          });
        }

        const quota = this.getQuota(placementId, todayKey);
        if (!quota || quota.remainingToday <= 0) {
          return Promise.resolve({
            ok: false,
            status: "daily_limit_reached",
            granted: false,
            message: "وصلت للحد اليومي المسموح من الإعلانات المكافأة. عد غداً!",
          });
        }

        // Strict rule: never fake or simulate ads when no real ad provider is configured
        if (!provider) {
          return Promise.resolve({
            ok: false,
            status: "unconfigured",
            granted: false,
            placement,
            message:
              "لم يتم ربط شبكة إعلانات رسمية بعد (Google H5 Games أو AdMob). لا يمكن منح مكافأة إعلان دون مشاهدة إعلان حقيقي مكتمل.",
          });
        }

        return new Promise((resolve) => {
          const token = Symbol("ad_session");
          let settled = false;
          activeSession = { token, placementId, claimed: false };

          const finish = (result) => {
            if (settled) return;
            settled = true;
            if (activeSession && activeSession.token === token) {
              activeSession = null;
            }
            resolve(result);
          };

          try {
            provider.showRewardedAd(placementId, {
              onComplete: () => {
                if (!activeSession || activeSession.token !== token || activeSession.claimed) {
                  return;
                }
                activeSession.claimed = true;
                state.totalToday += 1;
                state.byPlacement[placementId] = (Number(state.byPlacement[placementId]) || 0) + 1;
                finish({
                  ok: true,
                  status: "completed",
                  granted: true,
                  placement,
                  reward: { ...placement.reward },
                  message: `تمت مشاهدة الإعلان بنجاح! حصلت على ${formatRewardSummaryArabic(placement.reward)}.`,
                });
              },
              onSkip: () => {
                finish({
                  ok: false,
                  status: "skipped",
                  granted: false,
                  message: "تم تخطي الإعلان قبل اكتماله — لم يتم منح المكافأة.",
                });
              },
              onError: (err) => {
                finish({
                  ok: false,
                  status: "failed",
                  granted: false,
                  error: err ? String(err) : "ad_error",
                  message: "تعذر تحميل الإعلان حالياً — لم يتم منح المكافأة.",
                });
              },
            });
          } catch (err) {
            finish({
              ok: false,
              status: "failed",
              granted: false,
              error: String(err),
              message: "حدث خطأ أثناء تشغيل الإعلان — لم يتم منح المكافأة.",
            });
          }
        });
      },
    };
  }

  // =========================================================================
  // Player Avatars, XP/Level Progression & Achievement System (Pure Logic)
  // =========================================================================
  const AVATAR_CATALOG = Object.freeze([
    {
      id: "pharaoh_prince",
      nameAr: "الأمير الفرعوني",
      nameEn: "Pharaoh Prince",
      src: "./assets/extracted/ui/avatar_pharaoh_portrait.png",
    },
    {
      id: "queen_luma",
      nameAr: "الملكة لوما",
      nameEn: "Queen Luma",
      src: "./assets/Picsart_26-11-17_02-37-45-792.png",
    },
    {
      id: "baby_dragon",
      nameAr: "أمير التنين",
      nameEn: "Dragon Prince",
      src: "./assets/Picsart_26-11-17_02-38-02-164.png",
    },
    {
      id: "royal_crown",
      nameAr: "التاج الملكي",
      nameEn: "Royal Crown",
      src: "./assets/extracted/ui/badge_crown_laurel.png",
    },
    {
      id: "scarab_guardian",
      nameAr: "حارس الجعران الذهبي",
      nameEn: "Golden Scarab",
      src: "./assets/extracted/ui/badge_scarab.png",
    },
    {
      id: "star_champion",
      nameAr: "بطل النجوم",
      nameEn: "Star Champion",
      src: "./assets/extracted/ui/badge_star_shield.png",
    },
  ]);

  function getAvatarById(avatarId) {
    return AVATAR_CATALOG.find((a) => a.id === avatarId) || AVATAR_CATALOG[0];
  }

  function computePlayerProgression(stats = {}) {
    const completedStages = Math.max(0, Math.floor(Number(stats.completedStages) || 0));
    const totalStars = Math.max(0, Math.floor(Number(stats.stars) || 0));
    const bossesDefeated = Math.max(0, Math.floor(Number(stats.bossesDefeated) || 0));
    const bonusXp = Math.max(0, Math.floor(Number(stats.bonusXp) || 0));
    const totalXp = completedStages * 120 + totalStars * 45 + bossesDefeated * 350 + bonusXp;

    let level = 1;
    let remaining = totalXp;
    let xpForNext = 250;
    while (remaining >= xpForNext && level < 100) {
      remaining -= xpForNext;
      level++;
      xpForNext = 250 + (level - 1) * 120;
    }

    return {
      level,
      totalXp,
      currentLevelXp: remaining,
      xpForNext,
      progressPercent: Math.max(0, Math.min(100, Math.round((remaining / xpForNext) * 100))),
    };
  }

  function getPalaceProgressSummary(palaceIndex, highestUnlocked, stageStarsMap = {}) {
    const pIdx = Math.max(0, Math.floor(Number(palaceIndex) || 0));
    const startStage = pIdx * STAGES_PER_PALACE + 1;
    const endStage = (pIdx + 1) * STAGES_PER_PALACE;
    const unlocked = clampStage(highestUnlocked);
    const isCompleted = unlocked > endStage;
    const isActive = unlocked >= startStage && unlocked <= endStage;
    const isLocked = unlocked < startStage;

    let completedCount = 0;
    let earnedStars = 0;
    const bossStage = pIdx * STAGES_PER_PALACE + BOSS_STAGE_IN_PALACE;
    let bossDefeated = unlocked > bossStage;

    for (let s = startStage; s <= endStage; s++) {
      const recorded = Math.max(0, Math.min(3, Math.floor(Number(stageStarsMap[s]) || 0)));
      if (s < unlocked) {
        completedCount++;
        earnedStars += recorded > 0 ? recorded : 3;
      } else if (recorded > 0) {
        earnedStars += recorded;
      }
    }

    return {
      palaceIndex: pIdx,
      startStage,
      endStage,
      isCompleted,
      isActive,
      isLocked,
      completedCount,
      earnedStars,
      maxStars: STAGES_PER_PALACE * 3,
      bossDefeated,
      progressPercent: Math.round((completedCount / STAGES_PER_PALACE) * 100),
    };
  }

  const ACHIEVEMENTS = Object.freeze([
    {
      id: "first_victory",
      badge: "./assets/extracted/ui/badge_star_shield.png",
      nameAr: "الانتصار الأول",
      nameEn: "First Royal Victory",
      descAr: "أكمل المرحلة الأولى في مملكة الحلوى.",
      descEn: "Complete your very first stage in the kingdom.",
      metric: "completedStages",
      target: 1,
      reward: { coins: 150, gems: 2 },
    },
    {
      id: "stages_10",
      badge: "./assets/extracted/ui/badge_scarab.png",
      nameAr: "مستكشف الواحة",
      nameEn: "Oasis Explorer",
      descAr: "أكمل 10 مراحل بنجاح.",
      descEn: "Complete 10 stages across the palaces.",
      metric: "completedStages",
      target: 10,
      reward: { coins: 250, gems: 3 },
    },
    {
      id: "stages_50",
      badge: "./assets/extracted/ui/badge_swords_shield.png",
      nameAr: "محارب الحلوى",
      nameEn: "Royal Candy Warrior",
      descAr: "أكمل 50 مرحلة في رحلتك الملكية.",
      descEn: "Complete 50 stages on your royal journey.",
      metric: "completedStages",
      target: 50,
      reward: { coins: 500, gems: 8 },
    },
    {
      id: "stars_15",
      badge: "./assets/extracted/ui/icon_star_gold.png",
      nameAr: "جامع النجوم",
      nameEn: "Starlight Collector",
      descAr: "اجمع 15 نجمة من المراحل.",
      descEn: "Collect 15 stars from completed stages.",
      metric: "stars",
      target: 15,
      reward: { coins: 200, gems: 3 },
    },
    {
      id: "stars_100",
      badge: "./assets/extracted/ui/badge_laurel_trophy.png",
      nameAr: "كوكبة الفراعنة",
      nameEn: "Pharaoh Constellation",
      descAr: "اجمع 100 نجمة ذهبية.",
      descEn: "Collect 100 golden stars.",
      metric: "stars",
      target: 100,
      reward: { coins: 600, gems: 10 },
    },
    {
      id: "boss_slayer_1",
      badge: "./assets/extracted/ui/badge_crown_shield.png",
      nameAr: "قاهر ملك الحلوى",
      nameEn: "Candy King Vanquisher",
      descAr: "اهزم زعيم ملك الحلوى عند المرحلة 50 في أي قصر.",
      descEn: "Defeat the Candy King Boss at Stage 50 of any palace.",
      metric: "bossesDefeated",
      target: 1,
      reward: { coins: 400, gems: 8 },
    },
    {
      id: "palace_complete_1",
      badge: "./assets/extracted/ui/badge_crown_laurel.png",
      nameAr: "حاكم القصر الأول",
      nameEn: "Palace Conqueror",
      descAr: "أكمل جميع مراحل قصر واحد (100 مرحلة).",
      descEn: "Complete all 100 stages of a palace.",
      metric: "palacesCompleted",
      target: 1,
      reward: { coins: 800, gems: 15 },
    },
    {
      id: "palace_complete_5",
      badge: "./assets/extracted/ui/icon_ankh_gold.png",
      nameAr: "حامي الممالك الخمس",
      nameEn: "Guardian of Five Realms",
      descAr: "أكمل 5 قصور فرعونية بالكامل.",
      descEn: "Complete 5 Egyptian fantasy palaces.",
      metric: "palacesCompleted",
      target: 5,
      reward: { coins: 1500, gems: 25 },
    },
    {
      id: "player_level_5",
      badge: "./assets/extracted/ui/badge_trophy_shield.png",
      nameAr: "الصعود الملكي",
      nameEn: "Royal Ascension",
      descAr: "صل إلى المستوى الخامس للاعب.",
      descEn: "Reach Player Level 5.",
      metric: "playerLevel",
      target: 5,
      reward: { coins: 300, gems: 5 },
    },
    {
      id: "obstacles_100",
      badge: "./public/assets/aistudio/03_booster_candy_bomb_8bfca840.png",
      nameAr: "محطم العوائق",
      nameEn: "Obstacle Breaker",
      descAr: "اكسر 100 عائق وجليد عبر مراحل المملكة.",
      descEn: "Break 100 obstacles and ice tiles across stages.",
      metric: "obstaclesBroken",
      target: 100,
      reward: { coins: 350, gems: 5 },
    },
    {
      id: "rockets_25",
      badge: "./public/assets/aistudio/01_booster_candy_rocket_b53df03d.png",
      nameAr: "صانع الصواريخ",
      nameEn: "Rocket Crafter",
      descAr: "كوّن أو أطلق 25 صاروخ حلوى سحرياً.",
      descEn: "Create or launch 25 magical candy rockets.",
      metric: "rocketsCreated",
      target: 25,
      reward: { coins: 300, gems: 4 },
    },
    {
      id: "three_star_streak_5",
      badge: "./assets/extracted/ui/icon_star_gold.png",
      nameAr: "سلسلة الثلاث نجوم",
      nameEn: "3-Star Streak Master",
      descAr: "أكمل 5 مراحل بتقييم 3 نجوم كاملة.",
      descEn: "Earn a perfect 3-star rating on 5 stages.",
      metric: "threeStarStages",
      target: 5,
      reward: { coins: 400, gems: 6 },
    },
    {
      id: "profile_customized",
      badge: "./assets/extracted/ui/icon_papyrus_scroll.png",
      nameAr: "الهوية الملكية",
      nameEn: "Royal Identity",
      descAr: "خصّص اسمك أو صورتك الشخصية في الملف الشخصي.",
      descEn: "Customize your name or avatar in your Player Profile.",
      metric: "profileCustomized",
      target: 1,
      reward: { coins: 150, gems: 3 },
    },
  ]);

  function evaluateAchievements(progressSnapshot = {}, claimedMap = {}) {
    const highestUnlocked = clampStage(progressSnapshot.highestUnlocked || 1);
    const completedStages = Math.max(0, highestUnlocked - 1);
    const stars = Math.max(0, Math.floor(Number(progressSnapshot.stars) || 0));
    const palacesCompleted = Math.floor(completedStages / STAGES_PER_PALACE);
    let bossesDefeated = 0;
    for (let p = 0; p < PALACES_COUNT; p++) {
      if (highestUnlocked > p * STAGES_PER_PALACE + BOSS_STAGE_IN_PALACE) {
        bossesDefeated++;
      }
    }
    const stageStars =
      progressSnapshot.stageStars && typeof progressSnapshot.stageStars === "object"
        ? progressSnapshot.stageStars
        : {};
    const threeStarStagesFromMap = Object.values(stageStars).filter((v) => Number(v) >= 3).length;
    const threeStarStages = Math.max(
      threeStarStagesFromMap,
      Math.max(0, Math.floor(Number(progressSnapshot.threeStarStages) || 0))
    );
    const obstaclesBroken = Math.max(
      completedStages * 6,
      Math.max(0, Math.floor(Number(progressSnapshot.obstaclesBroken) || 0))
    );
    const rocketsCreated = Math.max(
      completedStages * 2,
      Math.max(0, Math.floor(Number(progressSnapshot.rocketsCreated) || 0))
    );
    const prog = computePlayerProgression({
      completedStages,
      stars,
      bossesDefeated,
      bonusXp: progressSnapshot.bonusXp || 0,
    });
    const metrics = {
      completedStages,
      stars,
      palacesCompleted,
      bossesDefeated,
      playerLevel: prog.level,
      obstaclesBroken,
      rocketsCreated,
      threeStarStages,
      profileCustomized: progressSnapshot.profileCustomized ? 1 : 0,
    };

    return ACHIEVEMENTS.map((ach) => {
      const current = Math.max(0, Number(metrics[ach.metric]) || 0);
      const unlocked = current >= ach.target;
      const claimed = Boolean(claimedMap && claimedMap[ach.id]);
      return {
        ...ach,
        current: Math.min(current, ach.target),
        rawCurrent: current,
        unlocked,
        claimed,
        canClaim: unlocked && !claimed,
        percent: Math.max(0, Math.min(100, Math.round((Math.min(current, ach.target) / ach.target) * 100))),
      };
    });
  }

  return {
    PALACES_COUNT,
    STAGES_PER_PALACE,
    TOTAL_STAGES,
    BOSS_STAGE_IN_PALACE,
    BOSS_STAGES_IN_PALACE,
    MAX_LIVES,
    MAX_BOOSTER_STOCK,
    GAME_STATES,
    PALACES,
    AVATAR_CATALOG,
    ACHIEVEMENTS,
    STORE_CATEGORIES,
    STORE_ITEMS,
    SHOP_FRAMES,
    ROYAL_MODAL_FRAMES,
    SHOP_ICONS,
    SHOP_FEATURED_BUNDLE_ID,
    SHOP_SHOWCASE_IDS,
    LUCKY_WHEEL_ASSETS,
    LUCKY_WHEEL_SLICES,
    REWARDED_AD_PLACEMENTS,
    REWARDED_AD_DAILY_TOTAL_LIMIT,
    clampStage,
    getStageMeta,
    getStageDifficultyTier,
    HARD_MILESTONE_STAGES,
    SUPER_HARD_MILESTONE_STAGES,
    PALACE_OBSTACLE_THEMES,
    getLevelConfig,
    getAvatarById,
    computePlayerProgression,
    getPalaceProgressSummary,
    evaluateAchievements,
    getStoreItemById,
    formatRewardSummaryArabic,
    applyRewardToInventory,
    pickWeightedWheelSliceIndex,
    computeWheelSpinTarget,
    resolveWheelSliceFromAngle,
    createGameStateMachine,
    createHeartActionGuard,
    createStoreEngine,
    createRewardedAdEngine,
    findMatchesInGrid,
  };
});
