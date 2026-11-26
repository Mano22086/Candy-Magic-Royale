/* Candy Magic Royale — AAA Match-3 Game Juice, Super Combos, Smart Auto-Hint,
 * 20-Obstacle Catalog, Smart Pity Difficulty, 4-Hour Free Gift Chest & Speech Helpers.
 * UMD module: works in both browser (window.CMRMatch3Systems) and Node unit tests.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CMRMatch3Systems = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const HUD_OBJECTIVE_PANEL_SRC =
    "./public/assets/aistudio/image_69bf8423-4605-4734-9fac-cdd0dee86c04_121d90de.png";

  const SHOP_CHEST_ICON = "./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png";
  const SHOP_COIN_ICON = "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png";
  const BOOSTER_ICONS = Object.freeze({
    rockets: "./public/assets/aistudio/01_booster_candy_rocket_b53df03d.png",
    paints: "./public/assets/aistudio/02_booster_magic_wand_e83e8cc8.png",
    hammer: "./public/assets/aistudio/03_booster_candy_bomb_8bfca840.png",
    colors: "./public/assets/aistudio/04_booster_striped_candy_7749b182.png",
  });

  // Complete 20-Obstacle Catalog (8/9 Legacy Blockers + 12 New Egyptian Obstacles Pack)
  const OBSTACLE_CATALOG = Object.freeze({
    // Original 9 obstacles
    single_ice: {
      id: "single_ice",
      nameAr: "طبقة الجليد",
      imgSrc: "./assets/packs/blockers/1.png",
      hp: 1,
      adj: true,
      self: true,
      spread: false,
      reward: false,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق الحلوى فوق الجليد أو بجانبه مرة واحدة لإذابته!",
    },
    double_ice: {
      id: "double_ice",
      nameAr: "الجليد المزدوج",
      imgSrc: "./assets/packs/blockers/2.png",
      hp: 2,
      adj: true,
      self: true,
      spread: false,
      reward: false,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "جليد سميك من طبقتين — طابق بجانبه أو فوقه مرتين لكسره!",
    },
    stone_wall: {
      id: "stone_wall",
      nameAr: "الجدار الحجري",
      imgSrc: "./assets/packs/blockers/3.png",
      hp: 2,
      adj: true,
      self: false,
      spread: false,
      reward: false,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق الحلوى بجانب الجدار الحجري مرتين لتحطيمه!",
    },
    rope_net: {
      id: "rope_net",
      nameAr: "شبكة الحبال",
      imgSrc: "./assets/packs/blockers/4.png",
      hp: 2,
      adj: true,
      self: false,
      spread: false,
      reward: false,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق الحلوى بجوار الشبكة مرتين أو فجّرها بمعزز لفتحها!",
    },
    vault: {
      id: "vault",
      nameAr: "الخزنة الملكية",
      imgSrc: "./assets/packs/blockers/5.png",
      hp: 3,
      adj: true,
      self: false,
      spread: false,
      reward: true,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق الحلوى بجانب الخزنة 3 مرات لفتحها وكسب الذهب!",
    },
    roots: {
      id: "roots",
      nameAr: "الجذور السحرية",
      imgSrc: "./assets/packs/blockers/6.png",
      hp: 2,
      adj: true,
      self: false,
      spread: true,
      reward: false,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "اكسر الجذور بسرعة بمطابقات مجاورة قبل أن تمتد للخانات القريبة!",
    },
    golden_cage: {
      id: "golden_cage",
      nameAr: "القفص الذهبي",
      imgSrc: "./assets/packs/blockers/7.png",
      hp: 2,
      adj: false,
      self: true,
      spread: false,
      reward: true,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق الحلوى المحبوسة داخل القفص أو فجّره بصاروخ وقنبلة!",
    },
    iron_cage: {
      id: "iron_cage",
      nameAr: "القفص الحديدي",
      imgSrc: "./assets/packs/blockers/8.png",
      hp: 2,
      adj: false,
      self: true,
      spread: false,
      reward: false,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "حرر الحلوى بمطابقتها من الداخل أو بضربة صاروخ وقنبلة!",
    },
    whirlpool: {
      id: "whirlpool",
      nameAr: "الدوامة السحرية",
      imgSrc: "./assets/packs/blockers/9.png",
      hp: 1,
      adj: true,
      self: false,
      spread: false,
      reward: true,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق بجانب الدوامة لتنطلق وتزيل قطعة مجاورة معها!",
    },

    // 12 New Egyptian Obstacles Pack (obs_09 .. obs_20)
    sandstone_block: {
      id: "sandstone_block",
      nameAr: "الحجر الرملي",
      imgSrc: "./public/assets/aistudio/obs_09_sandstone_block_fca5cec3.png",
      hp: 3,
      introHp: 1,
      adj: true,
      self: false,
      spread: false,
      reward: false,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق الحلوى بجانبه 3 مرات لكسره!",
    },
    scarab_gem_box: {
      id: "scarab_gem_box",
      nameAr: "صندوق الجعران",
      imgSrc: "./public/assets/aistudio/obs_10_scarab_gem_box_7a11add0.png",
      hp: 2,
      adj: true,
      self: false,
      spread: false,
      reward: true,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق الحلوى بجانبه مرتين لفتح صندوق الجعران وكسب مكافأة!",
    },
    caramel_jar: {
      id: "caramel_jar",
      nameAr: "جرة العسل والكراميل",
      imgSrc: "./public/assets/aistudio/obs_11_caramel_jar_f762ea23.png",
      hp: 2,
      introHp: 1,
      adj: true,
      self: true,
      spread: false,
      reward: false,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق الحلوى بجانب جرة العسل أو فوقها لتكسيرها وتنظيف الخانة!",
    },
    crystal_egg: {
      id: "crystal_egg",
      nameAr: "بيضة الكريستال",
      imgSrc: "./public/assets/aistudio/obs_12_crystal_egg_96b93eb5.png",
      hp: 2,
      adj: true,
      self: false,
      spread: false,
      reward: true,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق الحلوى بجوار بيضة الكريستال مرتين لتفقس وتمنحك معززاً!",
    },
    mummy_bandage: {
      id: "mummy_bandage",
      nameAr: "ضمادات المومياء",
      imgSrc: "./public/assets/aistudio/obs_13_mummy_bandage_72b48c89.png",
      hp: 2,
      adj: true,
      self: true,
      spread: false,
      reward: false,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق الحلوى بداخلها أو بجوارها مرتين لفك ضمادات المومياء!",
    },
    fire_brazier: {
      id: "fire_brazier",
      nameAr: "موقد النار الفرعوني",
      imgSrc: "./public/assets/aistudio/obs_14_fire_brazier_484db0b1.png",
      hp: 3,
      adj: true,
      self: false,
      spread: false,
      reward: false,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "أطفئ موقد النار بـ 3 مطابقات مجاورة أو بضربة صاروخ وقنبلة!",
    },
    bubble_gum: {
      id: "bubble_gum",
      nameAr: "فقاعة الحلوى",
      imgSrc: "./public/assets/aistudio/obs_15_bubble_gum_ac9cdae2.png",
      hp: 1,
      adj: true,
      self: true,
      spread: false,
      reward: false,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق الحلوى فوقها أو بجوارها مرة واحدة لتفجير الفقاعة الوردية!",
    },
    pharaoh_vase: {
      id: "pharaoh_vase",
      nameAr: "مزهرية الفرعون",
      imgSrc: "./public/assets/aistudio/obs_16_pharaoh_vase_4003049d.png",
      hp: 2,
      adj: true,
      self: false,
      spread: false,
      reward: false,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق الحلوى بجوار مزهرية الفرعون مرتين لتحطيمها!",
    },
    lotus_flower: {
      id: "lotus_flower",
      nameAr: "زهرة اللوتس",
      imgSrc: "./public/assets/aistudio/obs_17_lotus_flower_4d8d49db.png",
      hp: 2,
      adj: true,
      self: true,
      spread: false,
      reward: false,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق الحلوى بجوار زهرة اللوتس مرتين لتتفتح وتكمل الهدف!",
    },
    magic_lamp: {
      id: "magic_lamp",
      nameAr: "المصباح السحري",
      imgSrc: "./public/assets/aistudio/obs_18_magic_lamp_c3fc8954.png",
      hp: 3,
      adj: true,
      self: false,
      spread: false,
      reward: true,
      boosterOnly: false,
      lampBlast: true,
      tutorialAr: "اضربه 3 مرات ليطلق شعاعاً يمسح الصف!",
    },
    obsidian_shield: {
      id: "obsidian_shield",
      nameAr: "درع الأوبسيديان",
      imgSrc: "./public/assets/aistudio/obs_19_obsidian_shield_3294233b.png",
      hp: 2,
      adj: false,
      self: false,
      spread: false,
      reward: false,
      boosterOnly: true,
      lampBlast: false,
      tutorialAr: "لا يتكسر إلا بالصاروخ أو القنبلة!",
    },
    pyramid_safe: {
      id: "pyramid_safe",
      nameAr: "خزنة الهرم",
      imgSrc: "./public/assets/aistudio/obs_20_pyramid_safe_29871687.png",
      hp: 3,
      adj: true,
      self: false,
      spread: false,
      reward: true,
      boosterOnly: false,
      lampBlast: false,
      tutorialAr: "طابق بجانب خزنة الهرم 3 مرات أو استخدم قنبلة لفتحها وكسب الذهب!",
    },
  });

  const NEW_OBSTACLE_IDS = Object.freeze([
    "sandstone_block",
    "scarab_gem_box",
    "caramel_jar",
    "crystal_egg",
    "mummy_bandage",
    "fire_brazier",
    "bubble_gum",
    "pharaoh_vase",
    "lotus_flower",
    "magic_lamp",
    "obsidian_shield",
    "pyramid_safe",
  ]);

  // -------------------------------------------------------------------------
  // 1. Arabic Combo Callouts & Escalating Pitch Audio
  // -------------------------------------------------------------------------
  function getComboCallout(comboCount) {
    const c = Math.floor(Number(comboCount) || 0);
    if (c < 2) return null;
    if (c === 2) return { text: "رائع!", tier: 2, accent: "#38bdf8" };
    if (c === 3) return { text: "مذهل!", tier: 3, accent: "#f472b6" };
    if (c === 4) return { text: "أسطوري!", tier: 4, accent: "#c084fc" };
    return { text: "فرعوني!", tier: 5, accent: "#fbbf24" };
  }

  function computeComboPitchRate(cascadeStep) {
    const step = Math.max(1, Math.floor(Number(cascadeStep) || 1));
    return Math.min(1.6, Number((1 + (step - 1) * 0.08).toFixed(2)));
  }

  // -------------------------------------------------------------------------
  // 2. Hard & Super Hard Milestone Stages (×2 / ×2.5 Victory Coins)
  // -------------------------------------------------------------------------
  const HARD_STAGES = new Set([10, 40, 75]);
  const SUPER_HARD_STAGES = new Set([25, 90]);

  function getStageDifficultyTier(stageInPalace) {
    const s = Math.max(1, Math.min(100, Math.floor(Number(stageInPalace) || 1)));
    if (s === 50) {
      return {
        tier: "boss",
        isHard: false,
        isSuperHard: false,
        isBoss: true,
        tagAr: "زعيم ملك الحلوى 👑",
        coinMultiplier: 2,
      };
    }
    if (SUPER_HARD_STAGES.has(s)) {
      return {
        tier: "super_hard",
        isHard: false,
        isSuperHard: true,
        isBoss: false,
        tagAr: "تحدي فرعوني خارق ⚡",
        coinMultiplier: 2.5,
      };
    }
    if (HARD_STAGES.has(s)) {
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

  // -------------------------------------------------------------------------
  // 3. Super Booster Combos (Special + Special Swap Planner)
  // -------------------------------------------------------------------------
  function findMostCommonColorOnGrid(grid, rows, cols, excludeCells = new Set()) {
    const counts = new Map();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (excludeCells.has(r + "," + c)) continue;
        const item = grid[r]?.[c];
        if (!item || !item.type || item.special) continue;
        counts.set(item.type, (counts.get(item.type) || 0) + 1);
      }
    }
    let bestType = 1;
    let bestCount = -1;
    for (const [type, count] of counts.entries()) {
      if (count > bestCount) {
        bestCount = count;
        bestType = type;
      }
    }
    return bestType;
  }

  function computeSuperComboPlan(grid, rows, cols, a, b) {
    const inBounds = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;
    const A = grid[a.r]?.[a.c];
    const B = grid[b.r]?.[b.c];
    if (!A || !B) return null;
    const spA = A.special || null;
    const spB = B.special || null;
    if (!spA && !spB) return null;

    const cells = new Set([a.r + "," + a.c, b.r + "," + b.c]);
    const addCross = (cell) => {
      for (let c = 0; c < cols; c++) cells.add(cell.r + "," + c);
      for (let r = 0; r < rows; r++) cells.add(r + "," + cell.c);
    };

    // 1. Color + Color -> Entire board mega wipe
    if (spA === "color" && spB === "color") {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) cells.add(r + "," + c);
      }
      return {
        comboType: "color_color",
        isSuperCombo: true,
        bannerAr: "انفجار كوني فرعوني! ✨",
        hapticMs: 30,
        shake: true,
        cells,
        chainTargets: [],
        convertTo: null,
      };
    }

    // 2. Color Ball + Rocket (or Bomb) -> Convert all candies of most common color into Rockets/Bombs and detonate in 90ms chain
    if (
      (spA === "color" && (spB === "striped" || spB === "wrapped")) ||
      (spB === "color" && (spA === "striped" || spA === "wrapped"))
    ) {
      const convertTo = spA === "color" ? spB : spA;
      const exclude = new Set([a.r + "," + a.c, b.r + "," + b.c]);
      const targetColor = findMostCommonColorOnGrid(grid, rows, cols, exclude);
      const chainTargets = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (exclude.has(r + "," + c)) continue;
          const it = grid[r]?.[c];
          if (it && it.type === targetColor) {
            chainTargets.push({ r, c });
            cells.add(r + "," + c);
          }
        }
      }
      return {
        comboType: convertTo === "striped" ? "color_rocket" : "color_bomb",
        isSuperCombo: true,
        bannerAr: convertTo === "striped" ? "عاصفة صواريخ ملونة! 🚀" : "أمطار القنابل السحرية! 💣",
        hapticMs: 30,
        shake: true,
        cells,
        targetColor,
        convertTo,
        chainTargets,
        chainDelayMs: 90,
      };
    }

    // 3. Rocket + Bomb -> Giant 3-row x 3-column cross mega-blast
    if (
      (spA === "wrapped" && spB === "striped") ||
      (spB === "wrapped" && spA === "striped")
    ) {
      const center = b; // anchor on destination swap tile
      for (let offset = -1; offset <= 1; offset++) {
        const rr = center.r + offset;
        const cc = center.c + offset;
        if (rr >= 0 && rr < rows) {
          for (let c = 0; c < cols; c++) cells.add(rr + "," + c);
        }
        if (cc >= 0 && cc < cols) {
          for (let r = 0; r < rows; r++) cells.add(r + "," + cc);
        }
      }
      return {
        comboType: "rocket_bomb",
        isSuperCombo: true,
        bannerAr: "انفجار الصاروخ والقنبلة! 💥",
        hapticMs: 30,
        shake: true,
        center,
        cells,
        chainTargets: [],
        convertTo: null,
      };
    }

    // 4. Bomb + Bomb -> Massive 5x5 area explosion centered on swap target
    if (spA === "wrapped" && spB === "wrapped") {
      const center = b;
      for (let r = center.r - 2; r <= center.r + 2; r++) {
        for (let c = center.c - 2; c <= center.c + 2; c++) {
          if (inBounds(r, c)) cells.add(r + "," + c);
        }
      }
      return {
        comboType: "bomb_bomb",
        isSuperCombo: true,
        bannerAr: "انفجار 5×5 مزلزل! 💣",
        hapticMs: 30,
        shake: true,
        center,
        cells,
        chainTargets: [],
        convertTo: null,
      };
    }

    // 5. Rocket + Rocket -> Simultaneous full-row + full-column cross blast
    if (spA === "striped" && spB === "striped") {
      addCross(b);
      return {
        comboType: "rocket_rocket",
        isSuperCombo: true,
        bannerAr: "تقاطع الصواريخ الملكي! 🚀",
        hapticMs: 30,
        shake: true,
        center: b,
        cells,
        chainTargets: [],
        convertTo: null,
      };
    }

    // Single special swapped with regular candy
    if (spA === "color" || spB === "color") {
      const other = spA === "color" ? B : A;
      const targetColor = other?.type || findMostCommonColorOnGrid(grid, rows, cols);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r]?.[c]?.type === targetColor) cells.add(r + "," + c);
        }
      }
      return {
        comboType: "single_color",
        isSuperCombo: false,
        bannerAr: null,
        hapticMs: 12,
        shake: false,
        targetColor,
        cells,
        chainTargets: [],
        convertTo: null,
      };
    }

    if (spA === "wrapped" || spB === "wrapped") {
      const center = spA === "wrapped" ? a : b;
      for (let r = center.r - 1; r <= center.r + 1; r++) {
        for (let c = center.c - 1; c <= center.c + 1; c++) {
          if (inBounds(r, c)) cells.add(r + "," + c);
        }
      }
      return {
        comboType: "single_bomb",
        isSuperCombo: false,
        bannerAr: null,
        hapticMs: 30,
        shake: true,
        center,
        cells,
        chainTargets: [],
        convertTo: null,
      };
    }

    // Single Rocket (striped)
    const center = spA === "striped" ? a : b;
    addCross(center);
    return {
      comboType: "single_rocket",
      isSuperCombo: false,
      bannerAr: null,
      hapticMs: 30,
      shake: true,
      center,
      cells,
      chainTargets: [],
      convertTo: null,
    };
  }

  // -------------------------------------------------------------------------
  // 4. Smart 5-Second Auto-Hint Scanner (Prioritizes Special Creations & Combos)
  // -------------------------------------------------------------------------
  function scoreSwappedBoardForCell(grid, rows, cols, r, c) {
    const item = grid[r]?.[c];
    if (!item) return { maxRun: 0, isLT: false, matchedCount: 0, adjObstacles: 0 };
    const t = item.type;
    let left = 0,
      right = 0,
      up = 0,
      down = 0;
    for (let x = c - 1; x >= 0 && grid[r]?.[x]?.type === t; x--) left++;
    for (let x = c + 1; x < cols && grid[r]?.[x]?.type === t; x++) right++;
    for (let y = r - 1; y >= 0 && grid[y]?.[c]?.type === t; y--) up++;
    for (let y = r + 1; y < rows && grid[y]?.[c]?.type === t; y++) down++;

    const hLen = left + right + 1;
    const vLen = up + down + 1;
    const isLT = hLen >= 3 && vLen >= 3;
    const maxRun = Math.max(hLen >= 3 ? hLen : 0, vLen >= 3 ? vLen : 0);
    if (maxRun === 0) return { maxRun: 0, isLT: false, matchedCount: 0, adjObstacles: 0 };

    const matched = new Set();
    if (hLen >= 3) {
      for (let x = c - left; x <= c + right; x++) matched.add(r + "," + x);
    }
    if (vLen >= 3) {
      for (let y = r - up; y <= r + down; y++) matched.add(y + "," + c);
    }

    let adjObstacles = 0;
    const seenObs = new Set();
    for (const key of matched) {
      const [mr, mc] = key.split(",").map(Number);
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const nr = mr + dr;
        const nc = mc + dc;
        const nKey = nr + "," + nc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seenObs.has(nKey)) {
          const nb = grid[nr]?.[nc];
          if (nb && (nb.obs || nb.ice > 0)) {
            seenObs.add(nKey);
            adjObstacles++;
          }
        }
      }
    }

    return { maxRun, isLT, matchedCount: matched.size, adjObstacles };
  }

  function findBestSmartHint(grid, rows, cols, isLockedFn) {
    const locked =
      typeof isLockedFn === "function"
        ? isLockedFn
        : (cell) => Boolean(cell && (cell.obs || cell.ice > 0));

    let best = null;
    const consider = (cand) => {
      if (!best || cand.priority > best.priority) best = cand;
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        for (const [dr, dc] of [
          [0, 1],
          [1, 0],
        ]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          const a = grid[r]?.[c];
          const b = grid[nr]?.[nc];
          if (!a || !b || locked(a) || locked(b)) continue;

          if (a.special && b.special) {
            consider({
              from: { r, c },
              to: { r: nr, c: nc },
              priority: 100,
              kind: "super_combo",
            });
            continue;
          }
          if (a.special || b.special) {
            consider({
              from: { r, c },
              to: { r: nr, c: nc },
              priority: 55,
              kind: "special_use",
            });
            continue;
          }

          // Simulate swap in-place and immediately revert
          grid[r][c] = b;
          grid[nr][nc] = a;
          const s1 = scoreSwappedBoardForCell(grid, rows, cols, r, c);
          const s2 = scoreSwappedBoardForCell(grid, rows, cols, nr, nc);
          grid[r][c] = a;
          grid[nr][nc] = b;

          const maxRun = Math.max(s1.maxRun, s2.maxRun);
          const isLT = s1.isLT || s2.isLT;
          if (maxRun >= 3 || isLT) {
            let priority = 30;
            let kind = "match3";
            if (maxRun >= 5) {
              priority = 85;
              kind = "create_color_ball";
            } else if (isLT) {
              priority = 75;
              kind = "create_bomb";
            } else if (maxRun === 4) {
              priority = 65;
              kind = "create_rocket";
            }
            priority += Math.min(8, (s1.adjObstacles + s2.adjObstacles) * 2);
            consider({
              from: { r, c },
              to: { r: nr, c: nc },
              priority,
              kind,
            });
          }
        }
      }
    }

    return best;
  }

  // -------------------------------------------------------------------------
  // 5. Smart Pity Difficulty (Retention Helper: +12% match bias after 3+ fails)
  // -------------------------------------------------------------------------
  const PITY_STORAGE_KEY = "cmr_pity_fails_v1";

  function createPityTracker(storage) {
    const store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    function readMap() {
      try {
        const raw = store ? store.getItem(PITY_STORAGE_KEY) : null;
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (_) {
        return {};
      }
    }
    function writeMap(map) {
      try {
        if (store) store.setItem(PITY_STORAGE_KEY, JSON.stringify(map));
      } catch (_) {}
    }

    return {
      getFailCount(stage) {
        const key = String(Math.max(1, Math.floor(Number(stage) || 1)));
        return Math.max(0, Math.floor(Number(readMap()[key]) || 0));
      },
      recordFail(stage) {
        const key = String(Math.max(1, Math.floor(Number(stage) || 1)));
        const map = readMap();
        map[key] = (Math.floor(Number(map[key]) || 0) || 0) + 1;
        writeMap(map);
        return map[key];
      },
      recordWin(stage) {
        const key = String(Math.max(1, Math.floor(Number(stage) || 1)));
        const map = readMap();
        if (map[key]) {
          delete map[key];
          writeMap(map);
        }
        return 0;
      },
      getSpawnBias(stage) {
        return this.getFailCount(stage) >= 3 ? 0.12 : 0;
      },
      isPityActive(stage) {
        return this.getFailCount(stage) >= 3;
      },
    };
  }

  function pickBiasedCandyType(grid, r, c, rows, cols, typesCount, bias, rng = Math.random) {
    const safeTypes = Math.max(2, Math.floor(Number(typesCount) || 6));
    const safeBias = Math.max(0, Math.min(0.4, Number(bias) || 0));
    if (safeBias > 0 && rng() < safeBias) {
      const neighbors = [];
      for (const [dr, dc] of [
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, 0],
      ]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const nb = grid[nr]?.[nc];
          if (nb && nb.type >= 1 && nb.type <= safeTypes) neighbors.push(nb.type);
        }
      }
      if (neighbors.length > 0) {
        return neighbors[Math.floor(rng() * neighbors.length)];
      }
    }
    return 1 + Math.floor(rng() * safeTypes);
  }

  // -------------------------------------------------------------------------
  // 6. Free Gift Chest Every 4 Hours (World Map)
  // -------------------------------------------------------------------------
  const FREE_CHEST_STORAGE_KEY = "cmr_free_chest_v1";
  const FREE_CHEST_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

  function formatCountdownHHMMSS(ms) {
    const totalSec = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return [hrs, mins, secs].map((n) => String(n).padStart(2, "0")).join(":");
  }

  function createFreeChestEngine(storage) {
    const store = storage || (typeof localStorage !== "undefined" ? localStorage : null);

    function readState() {
      try {
        const raw = store ? store.getItem(FREE_CHEST_STORAGE_KEY) : null;
        const parsed = raw ? JSON.parse(raw) : {};
        return {
          nextReadyAt: Number.isFinite(Number(parsed.nextReadyAt)) ? Number(parsed.nextReadyAt) : 0,
          claimCount: Math.max(0, Math.floor(Number(parsed.claimCount) || 0)),
        };
      } catch (_) {
        return { nextReadyAt: 0, claimCount: 0 };
      }
    }

    function writeState(st) {
      try {
        if (store) store.setItem(FREE_CHEST_STORAGE_KEY, JSON.stringify(st));
      } catch (_) {}
    }

    return {
      COOLDOWN_MS: FREE_CHEST_COOLDOWN_MS,
      getStatus(now = Date.now()) {
        const st = readState();
        const remainingMs = Math.max(0, st.nextReadyAt - now);
        const ready = remainingMs <= 0;
        return {
          ready,
          remainingMs,
          formatted: ready ? "00:00:00" : formatCountdownHHMMSS(remainingMs),
          claimCount: st.claimCount,
          nextReadyAt: st.nextReadyAt,
        };
      },
      claim(now = Date.now(), rng = Math.random) {
        const st = readState();
        if (st.nextReadyAt > now) {
          return {
            ok: false,
            reason: "cooldown",
            remainingMs: st.nextReadyAt - now,
            formatted: formatCountdownHHMMSS(st.nextReadyAt - now),
          };
        }
        // 65% chance: +50 to +100 coins (in steps of 5); 35% chance: 1 random booster
        const roll = rng();
        let reward;
        let labelAr;
        let icon;
        if (roll < 0.65) {
          const coins = 50 + Math.floor(rng() * 11) * 5; // 50..100
          reward = { coins };
          labelAr = `+${coins} عملة ذهبية`;
          icon = SHOP_COIN_ICON;
        } else {
          const boosterPool = [
            { key: "rockets", labelAr: "+1 صاروخ الحلوى", icon: BOOSTER_ICONS.rockets },
            { key: "hammer", labelAr: "+1 قنبلة الحلوى", icon: BOOSTER_ICONS.hammer },
            { key: "paints", labelAr: "+1 العصا السحرية", icon: BOOSTER_ICONS.paints },
            { key: "colors", labelAr: "+1 حلوى مخططة", icon: BOOSTER_ICONS.colors },
          ];
          const pick = boosterPool[Math.floor(rng() * boosterPool.length)];
          reward = { [pick.key]: 1 };
          labelAr = pick.labelAr;
          icon = pick.icon;
        }

        const nextReadyAt = now + FREE_CHEST_COOLDOWN_MS;
        const nextState = { nextReadyAt, claimCount: st.claimCount + 1 };
        writeState(nextState);

        return {
          ok: true,
          reward,
          labelAr,
          icon,
          nextReadyAt,
          formatted: formatCountdownHHMMSS(FREE_CHEST_COOLDOWN_MS),
        };
      },
    };
  }

  // -------------------------------------------------------------------------
  // 7. Dynamic Seen Obstacles Tracker (cmr_seen_obstacles)
  // -------------------------------------------------------------------------
  const SEEN_OBSTACLES_KEY = "cmr_seen_obstacles";

  function createSeenObstaclesTracker(storage) {
    const store = storage || (typeof localStorage !== "undefined" ? localStorage : null);

    function readList() {
      try {
        const raw = store ? store.getItem(SEEN_OBSTACLES_KEY) : null;
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }

    function writeList(list) {
      try {
        if (store) store.setItem(SEEN_OBSTACLES_KEY, JSON.stringify(list));
      } catch (_) {}
    }

    return {
      getSeen() {
        return readList();
      },
      hasSeen(obsId) {
        return readList().includes(obsId);
      },
      markSeen(obsId) {
        const list = readList();
        if (!list.includes(obsId)) {
          list.push(obsId);
          writeList(list);
        }
        return list;
      },
      getUnseenInList(obsIds) {
        const seen = new Set(readList());
        const unseen = [];
        for (const id of obsIds || []) {
          if (id && OBSTACLE_CATALOG[id] && !seen.has(id) && !unseen.includes(id)) {
            unseen.push(id);
          }
        }
        return unseen;
      },
    };
  }

  // -------------------------------------------------------------------------
  // 8. Expressive Arabic Character Speech Bubbles (King/Queen & Dragon)
  // -------------------------------------------------------------------------
  function getCharacterSpeechLine(trigger, rng = Math.random) {
    if (trigger === "big_combo") {
      const lines = ["عاش يا بطل! 💪", "ضربة فرعونية! ✨"];
      const who = rng() < 0.55 ? "queen" : "dragon";
      return { who, text: lines[Math.floor(rng() * lines.length)] };
    }
    if (trigger === "low_moves") {
      return { who: "dragon", text: "فاضل 3 حركات بس، ركّز! 🔥" };
    }
    if (trigger === "one_left") {
      return { who: "queen", text: "قربت تكسب! 👑" };
    }
    if (trigger === "boss_attack") {
      return { who: "dragon", text: "استعد لهجمة الزعيم! ⚡" };
    }
    return null;
  }

  return {
    HUD_OBJECTIVE_PANEL_SRC,
    SHOP_CHEST_ICON,
    SHOP_COIN_ICON,
    BOOSTER_ICONS,
    OBSTACLE_CATALOG,
    NEW_OBSTACLE_IDS,
    FREE_CHEST_COOLDOWN_MS,
    getComboCallout,
    computeComboPitchRate,
    getStageDifficultyTier,
    computeSuperComboPlan,
    findMostCommonColorOnGrid,
    findBestSmartHint,
    createPityTracker,
    pickBiasedCandyType,
    formatCountdownHHMMSS,
    createFreeChestEngine,
    createSeenObstaclesTracker,
    getCharacterSpeechLine,
  };
});
