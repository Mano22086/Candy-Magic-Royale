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
      name: "قصر الحلوى الملكي",
      tag: "القصر الأول",
      description: "أبراج الحلوى البنفسجية والطرق الذهبية",
      icon: "👑",
      castleArt: "./assets/castle-queen.svg",
      accent: "#a855f7",
      boardPrefix: "royal_castle",
      boardStart: 1,
    },
    {
      index: 1,
      id: "pharaoh_temple",
      name: "معبد الفراعنة السحري",
      tag: "القصر الثاني",
      description: "أهرامات الكريستال ورمال الذهب المسحورة",
      icon: "🏺",
      castleArt: "./assets/enchanted-castle.svg",
      accent: "#f59e0b",
      boardPrefix: "pharaoh_temple",
      boardStart: 6,
    },
    {
      index: 2,
      id: "crystal_forest",
      name: "غابة الكريستال",
      tag: "القصر الثالث",
      description: "أشجار السكر المضيئة وشلالات الزمرد",
      icon: "🌿",
      castleArt: "./assets/castle-chocolate.svg",
      accent: "#10b981",
      boardPrefix: "crystal_forest",
      boardStart: 11,
    },
    {
      index: 3,
      id: "ice_palace",
      name: "قصر الجليد المتلألئ",
      tag: "القصر الرابع",
      description: "شلالات متجمدة وبلورات الثلج الملكية",
      icon: "❄️",
      castleArt: "./assets/castle-ice.svg",
      accent: "#38bdf8",
      boardPrefix: "ice_palace",
      boardStart: 16,
    },
    {
      index: 4,
      id: "sky_kingdom",
      name: "مملكة السماء والغيوم",
      tag: "القصر الخامس",
      description: "جسور الغيوم وقلاع السماء العالية",
      icon: "☁️",
      castleArt: "./assets/enchanted-castle.svg",
      accent: "#60a5fa",
      boardPrefix: "sky_kingdom",
      boardStart: 21,
    },
    {
      index: 5,
      id: "mermaid_reef",
      name: "شعاب حوريات البحر",
      tag: "القصر السادس",
      description: "لآلئ المحيط المضيئة وشعاب المرجان",
      icon: "🐚",
      castleArt: "./assets/castle-ice.svg",
      accent: "#14b8a6",
      boardPrefix: "mermaid_reef",
      boardStart: 26,
    },
    {
      index: 6,
      id: "ruby_cavern",
      name: "كهف الياقوت الأحمر",
      tag: "القصر السابع",
      description: "بلورات الياقوت المتوهجة وكنوز الأعماق",
      icon: "💎",
      castleArt: "./assets/castle-chocolate.svg",
      accent: "#f43f5e",
      boardPrefix: "ruby_cavern",
      boardStart: 31,
    },
    {
      index: 7,
      id: "galaxy_observatory",
      name: "مرصد المجرة السحري",
      tag: "القصر الثامن",
      description: "كواكب السكر ونجوم المجرة المتلألئة",
      icon: "🌟",
      castleArt: "./assets/castle-queen.svg",
      accent: "#8b5cf6",
      boardPrefix: "galaxy_observatory",
      boardStart: 36,
    },
    {
      index: 8,
      id: "sakura_garden",
      name: "حديقة أزهار الساكورا",
      tag: "القصر التاسع",
      description: "أزهار الكرز الوردية وجسور الحدائق الهادئة",
      icon: "🌸",
      castleArt: "./assets/enchanted-castle.svg",
      accent: "#ec4899",
      boardPrefix: "sakura_garden",
      boardStart: 41,
    },
    {
      index: 9,
      id: "autumn_village",
      name: "قرية الخريف الذهبي",
      tag: "القصر العاشر",
      description: "أوراق القيقب الذهبية وحصاد الحلوى الملكي",
      icon: "🍁",
      castleArt: "./assets/castle-chocolate.svg",
      accent: "#ea580c",
      boardPrefix: "autumn_village",
      boardStart: 46,
    },
  ]);

  function clampStage(stage) {
    const n = Math.floor(Number(stage) || 1);
    return Math.max(1, Math.min(TOTAL_STAGES, n));
  }

  function getStageMeta(globalStage) {
    const stage = clampStage(globalStage);
    const palaceIndex = Math.floor((stage - 1) / STAGES_PER_PALACE);
    const stageInPalace = ((stage - 1) % STAGES_PER_PALACE) + 1;
    const palace = PALACES[palaceIndex] || PALACES[0];
    const isBossStage = stageInPalace === BOSS_STAGE_IN_PALACE;
    const variantIndex = (stageInPalace - 1) % 5; // 0..4 => 5 HD boards per palace
    const boardNumber = palace.boardStart + variantIndex; // 1..50
    const padded = String(boardNumber).padStart(2, "0");
    const boardImagePath = `./assets/packs/boards/board_${padded}_${palace.boardPrefix}_v${variantIndex + 1}.jpg`;
    return {
      globalStage: stage,
      palaceIndex,
      palaceNumber: palaceIndex + 1,
      stageInPalace,
      palace,
      isBossStage,
      bossName: isBossStage ? "زعيم ملك الحلوى" : null,
      boardNumber,
      boardImagePath,
    };
  }

  function getLevelConfig(globalStage) {
    const meta = getStageMeta(globalStage);
    const L = meta.globalStage;
    const s = meta.stageInPalace;
    let obstacles = ["single_ice"];
    let diffLabel = "سهل";

    if (meta.isBossStage) {
      obstacles = ["vault", "golden_cage", "double_ice", "stone_wall"];
      diffLabel = "زعيم ملك الحلوى";
    } else if (L <= 2) {
      obstacles = ["single_ice"];
      diffLabel = "سهل";
    } else if (L <= 5) {
      obstacles = ["single_ice", "double_ice"];
      diffLabel = "سهل";
    } else if (L <= 10) {
      obstacles = ["double_ice", "stone_wall"];
      diffLabel = "سهل";
    } else if (s <= 25) {
      obstacles = ["single_ice", "rope_net"];
      diffLabel = "متوسط";
    } else if (s <= 45) {
      obstacles = ["double_ice", "roots", "stone_wall"];
      diffLabel = "متوسط";
    } else if (s <= 70) {
      obstacles = ["stone_wall", "vault", "golden_cage"];
      diffLabel = "صعب";
    } else if (s <= 90) {
      obstacles = ["roots", "iron_cage", "whirlpool"];
      diffLabel = "صعب جداً";
    } else {
      obstacles = ["vault", "golden_cage", "iron_cage", "whirlpool"];
      diffLabel = "ملكي";
    }

    const baseObstacles = meta.isBossStage
      ? Math.min(20, 12 + meta.palaceIndex)
      : Math.min(18, 2 + Math.floor((s - 1) / 8) + Math.min(4, Math.floor(meta.palaceIndex / 2)));

    const moves = meta.isBossStage
      ? Math.max(22, 28 - Math.floor(meta.palaceIndex / 3))
      : Math.max(18, Math.min(30, 26 - Math.floor((s - 1) / 14)));

    return {
      level: L,
      palaceIndex: meta.palaceIndex,
      palaceNumber: meta.palaceNumber,
      stageInPalace: s,
      isBossStage: meta.isBossStage,
      bossName: meta.bossName,
      obstacleCount: Math.max(2, baseObstacles),
      moves,
      obstacles,
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

  const STORE_CATEGORIES = Object.freeze([
    { id: "coins", label: "العملات الذهبية", icon: "./assets/packs/buttons/icon_coin.png" },
    { id: "gems", label: "الجواهر", icon: "./assets/packs/buttons/icon_gem.png" },
    { id: "hearts", label: "القلوب", icon: "./assets/packs/buttons/icon_heart.png" },
    { id: "boosters", label: "المعززات", icon: "./08_bomb_skull.png" },
    { id: "chests", label: "الصناديق والهدايا", icon: "./assets/packs/images/chest_gold.png" },
    { id: "offers", label: "العروض الخاصة", icon: "./assets/packs/images/gift_box.png" },
  ]);

  const STORE_ITEMS = Object.freeze([
    // 1. العملات الذهبية
    {
      id: "coins_pouch",
      category: "coins",
      name: "كيس العملات الذهبية",
      description: "احصل فوراً على +300 عملة ذهبية لشراء القلوب والمعززات.",
      image: "./assets/packs/images/coin.png",
      currency: "gems",
      price: 5,
      reward: { coins: 300 },
    },
    {
      id: "coins_sack",
      category: "coins",
      name: "حقيبة الكنز الملكي",
      description: "احصل على +850 عملة ذهبية بقيمة أفضل للمغامرين.",
      image: "./14_bag_gold.png",
      currency: "gems",
      price: 12,
      badge: "الأكثر طلباً",
      reward: { coins: 850 },
    },
    {
      id: "coins_vault",
      category: "coins",
      name: "خزينة الفراعنة الذهبية",
      description: "كنز ضخم يمنحك +2,000 عملة ذهبية دفعة واحدة.",
      image: "./assets/packs/images/chest_gold.png",
      currency: "gems",
      price: 24,
      badge: "قيمة ملكية",
      reward: { coins: 2000 },
    },
    {
      id: "ad_free_coins",
      category: "coins",
      name: "عملات مجانية مقابل إعلان",
      description: "شاهد إعلاناً مكافأً بالكامل لتحصل على +100 عملة ذهبية مجاناً.",
      image: "./assets/packs/images/currency_coin.png",
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
      id: "booster_bomb_3",
      category: "boosters",
      name: "حزمة القنابل (×3)",
      description: "تضيف 3 قنابل لتفجير مساحة 3×3 وتحطيم العوائق الصعبة.",
      image: "./08_bomb_skull.png",
      currency: "coins",
      price: 150,
      reward: { hammer: 3 },
    },
    {
      id: "booster_rocket_3",
      category: "boosters",
      name: "حزمة الصواريخ (×3)",
      description: "تضيف 3 صواريخ سحرية لمسح صف وعمود بالكامل.",
      image: "./09_rocket_striped.png",
      currency: "coins",
      price: 140,
      reward: { rockets: 3 },
    },
    {
      id: "booster_color_3",
      category: "boosters",
      name: "عجلات الألوان (×3)",
      description: "تضيف 3 عجلات ألوان لمسح كل القطع المتشابهة في اللوحة.",
      image: "./11_color_wheel.png",
      currency: "coins",
      price: 180,
      reward: { colors: 3 },
    },
    {
      id: "booster_paint_3",
      category: "boosters",
      name: "فرشاة التلوين (×3)",
      description: "تضيف 3 فرش سحرية لتغيير لون أي قطعة حلوى بذكاء.",
      image: "./10_paintbrush_rainbow.png",
      currency: "coins",
      price: 130,
      reward: { paints: 3 },
    },
    {
      id: "ad_free_booster",
      category: "boosters",
      name: "معزز مجاني مقابل إعلان",
      description: "شاهد إعلاناً مكافأً لتحصل على +1 قنبلة و+1 صاروخ مجاناً.",
      image: "./21_rocket_crown_gold.png",
      currency: "rewarded_ad",
      price: 0,
      adPlacement: "free_booster",
      reward: { hammer: 1, rockets: 1 },
    },

    // 5. الصناديق والهدايا
    {
      id: "chest_silver",
      category: "chests",
      name: "صندوق القصر السحري",
      description: "يمنحك 120 عملة + 1 قنبلة + 1 صاروخ + 1 فرشاة مباشرة في مخزونك.",
      image: "./assets/packs/images/gift_box.png",
      currency: "coins",
      price: 220,
      reward: { coins: 120, hammer: 1, rockets: 1, paints: 1 },
    },
    {
      id: "chest_royal_gold",
      category: "chests",
      name: "صندوق الكنز الذهبي",
      description: "يمنحك 300 عملة + 2 قنبلة + 2 صاروخ + 2 عجلة ألوان.",
      image: "./assets/packs/images/chest_gold.png",
      currency: "gems",
      price: 10,
      badge: "كنز ملكي",
      reward: { coins: 300, hammer: 2, rockets: 2, colors: 2 },
    },
    {
      id: "ad_reward_chest",
      category: "chests",
      name: "صندوق الهدايا المجاني (إعلان)",
      description: "شاهد إعلاناً مكافأً لفتح الصندوق والحصول على عملات ومعزز مجاناً.",
      image: "./15_bag_rainbow.png",
      currency: "rewarded_ad",
      price: 0,
      adPlacement: "reward_chest",
      reward: { coins: 75, paints: 1, gems: 1 },
    },

    // 6. العروض الخاصة
    {
      id: "offer_daily_gift",
      category: "offers",
      name: "هدية المملكة اليومية",
      description: "هدية مجانية يومية: +100 عملة ذهبية و+2 جوهرة (مرة كل يوم).",
      image: "./assets/packs/images/crown.png",
      currency: "free_daily",
      price: 0,
      badge: "مجاني يومياً",
      reward: { coins: 100, gems: 2 },
    },
    {
      id: "offer_boss_slayer",
      category: "offers",
      name: "حزمة قاهر زعيم ملك الحلوى",
      description: "استعد للمرحلة 50: +3 قنابل، +3 صواريخ، +2 عجلة ألوان، وتعبئة قلوب!",
      image: "./18_bag_crown_green.png",
      currency: "gems",
      price: 14,
      badge: "عرض خاص",
      reward: { hammer: 3, rockets: 3, colors: 2, fillLives: true },
    },
    {
      id: "offer_starter_royal",
      category: "offers",
      name: "عرض البداية الذهبي",
      description: "عرض مميز بالعملات: +2 قنبلة، +2 صاروخ، +2 فرشاة، و+4 جواهر.",
      image: "./16_bag_diamond_blue.png",
      currency: "coins",
      price: 420,
      badge: "وفر 35%",
      reward: { hammer: 2, rockets: 2, paints: 2, gems: 4 },
    },
  ]);

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

  return {
    PALACES_COUNT,
    STAGES_PER_PALACE,
    TOTAL_STAGES,
    BOSS_STAGE_IN_PALACE,
    MAX_LIVES,
    MAX_BOOSTER_STOCK,
    GAME_STATES,
    PALACES,
    STORE_CATEGORIES,
    STORE_ITEMS,
    REWARDED_AD_PLACEMENTS,
    REWARDED_AD_DAILY_TOTAL_LIMIT,
    clampStage,
    getStageMeta,
    getLevelConfig,
    getStoreItemById,
    formatRewardSummaryArabic,
    applyRewardToInventory,
    createGameStateMachine,
    createHeartActionGuard,
    createStoreEngine,
    createRewardedAdEngine,
    findMatchesInGrid,
  };
});
