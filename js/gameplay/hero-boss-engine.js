/* Candy Magic Royale — Hero Ultimate Power, 16-Frame 4x4 Character Sprite Math,
 * & Boss HP Battle State Machine (Pure UMD module for browser + node:test).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CMRHeroBossEngine = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SPRITE_SHEETS = Object.freeze({
    queen_luma: "./public/assets/aistudio/sheet_queen_luma_16frames_4x4_d384e1eb.png",
    pharaoh_boy: "./public/assets/aistudio/sheet_pharaoh_boy_16frames_4x4_d3af62fb.png",
    pharaoh_dragon: "./public/assets/aistudio/sheet_pharaoh_dragon_16frames_4x4_f5e257ac.png",
    boss_gummy_king: "./public/assets/aistudio/sheet_boss_gummy_king_16frames_4x4_fed3ebe7.png",
  });

  const BOSS_HP_BAR_FRAME = "./public/assets/aistudio/image_5ccfa143-19dc-4aab-9a34-835ffcc3baf5_96da28e9.png";

  const BOSS_STAGE_NUMBERS_IN_PALACE = Object.freeze([50, 100]);

  const FRAME_SEQUENCES = Object.freeze({
    BLINK: Object.freeze([0, 1, 2, 3, 0]),
    DRAGON_WING_LOOP: Object.freeze([0, 1, 2, 3]),
    HERO_HAPPY_IN: Object.freeze([4, 5, 6, 7]),
    HERO_HAPPY_OUT: Object.freeze([6, 5, 4, 0]),
    HERO_CELEBRATE_IN: Object.freeze([8, 9, 10, 11]),
    HERO_CELEBRATE_OUT: Object.freeze([12, 13, 14, 15]),
    BOSS_EVIL_LAUGH: Object.freeze([0, 1, 2, 3, 2, 1, 0]),
    BOSS_ANGRY_CHARGE: Object.freeze([4, 5, 6, 7]),
    BOSS_LIGHTNING_STRIKE: Object.freeze([8, 9, 10, 11]),
    BOSS_RETURN_IDLE: Object.freeze([12, 13, 14, 15]),
  });

  const TIMINGS = Object.freeze({
    STEP_MS: 80,
    BLINK_INTERVAL_MS: 3500,
    DRAGON_FLAP_MS: 140,
    HAPPY_HOLD_MS: 450,
    CELEBRATE_HOLD_MS: 850,
    BOSS_LAUGH_INTERVAL_MS: 15000,
    BOSS_STRIKE_HOLD_MS: 850,
  });

  /**
   * Row-major 4x4 sprite sheet frame coordinates (indices 0..15).
   * Returns exact CSS background-position percentages for background-size: 400% 400%.
   */
  function getSpriteFramePosition(frameIndex) {
    const idx = Math.max(0, Math.min(15, Math.floor(Number(frameIndex) || 0)));
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const xPct = (col * 100) / 3;
    const yPct = (row * 100) / 3;
    return {
      index: idx,
      col,
      row,
      xPct,
      yPct,
      cssPosition: `${xPct.toFixed(4)}% ${yPct.toFixed(4)}%`,
    };
  }

  /**
   * Determines whether a stage in a palace (1..100) is a Boss Stage.
   * Stage 50 & Stage 100 of EVERY palace => 20 Boss stages total across 10 palaces.
   */
  function isBossStageInPalace(stageInPalace) {
    const s = Math.floor(Number(stageInPalace) || 1);
    return BOSS_STAGE_NUMBERS_IN_PALACE.includes(s);
  }

  /**
   * Resolves character placement & roles for any global stage (1..1000).
   * - Odd Palaces (1,3,5,7,9): Left = Queen Luma, Right = Crystal Dragon
   * - Even Palaces (2,4,6,8,10) & Events: Left = Pharaoh Boy, Right = Crystal Dragon
   * - Boss Stages (Stage 50 & Stage 100 of EVERY palace): Single centered Red Gummy Bear Boss
   */
  function getStageCharacterSetup(globalStage, options = {}) {
    const stage = Math.max(1, Math.min(1000, Math.floor(Number(globalStage) || 1)));
    const palaceIndex = Math.floor((stage - 1) / 100);
    const palaceNumber = palaceIndex + 1; // 1..10
    const stageInPalace = ((stage - 1) % 100) + 1; // 1..100
    const isBossStage = isBossStageInPalace(stageInPalace);

    if (isBossStage) {
      const bossSlotInPalace = stageInPalace === 50 ? 1 : 2;
      const bossNumber = palaceIndex * 2 + bossSlotInPalace; // 1..20
      const punishmentMoveLimit = palaceNumber >= 3 ? 4 : 5;
      return {
        globalStage: stage,
        palaceNumber,
        stageInPalace,
        isBossStage: true,
        bossNumber,
        bossBoardName: `boss_board_${String(bossNumber).padStart(2, "0")}`,
        punishmentMoveLimit,
        bossId: "boss_gummy_king",
        bossSheet: SPRITE_SHEETS.boss_gummy_king,
        bossNameAr: stageInPalace === 100 ? "ملك الحلوى الأعظم" : "زعيم ملك الحلوى",
        leftHeroId: null,
        leftHeroSheet: null,
        rightHeroId: null,
        rightHeroSheet: null,
      };
    }

    const usePharaohBoy = Boolean(options.isEvent) || palaceNumber % 2 === 0;
    const leftHeroId = usePharaohBoy ? "pharaoh_boy" : "queen_luma";
    return {
      globalStage: stage,
      palaceNumber,
      stageInPalace,
      isBossStage: false,
      bossNumber: 0,
      bossBoardName: null,
      punishmentMoveLimit: 0,
      bossId: null,
      bossSheet: null,
      bossNameAr: null,
      leftHeroId,
      leftHeroSheet: SPRITE_SHEETS[leftHeroId],
      leftHeroNameAr: usePharaohBoy ? "الأمير الفرعوني" : "الملكة لوما",
      rightHeroId: "pharaoh_dragon",
      rightHeroSheet: SPRITE_SHEETS.pharaoh_dragon,
      rightHeroNameAr: "تنين الكريستال",
    };
  }

  /**
   * Computes SVG circle stroke-dashoffset for a 0..100% progress ring.
   */
  function computeRingOffset(percent, circumference) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const c = Math.max(1, Number(circumference) || 100);
    return c * (1 - p / 100);
  }

  /**
   * Hero Ultimate Charge Tracker:
   * - Left Hero Ring (Magenta-Gold): +8% per normal match, +20% per special/obstacle break
   * - Right Dragon Ring (Cyan-Gold): +10% per match/cascade
   */
  function createHeroChargeTracker() {
    let left = 0;
    let right = 0;

    function clamp(v) {
      return Math.max(0, Math.min(100, Math.round(v)));
    }

    return {
      getState() {
        return {
          left,
          right,
          leftReady: left >= 100,
          rightReady: right >= 100,
        };
      },
      onNormalMatch() {
        left = clamp(left + 8);
        right = clamp(right + 10);
        return this.getState();
      },
      onCascadeMatch() {
        left = clamp(left + 8);
        right = clamp(right + 10);
        return this.getState();
      },
      onSpecialOrObstacleBreak(count = 1) {
        const n = Math.max(1, Math.min(4, Math.floor(Number(count) || 1)));
        left = clamp(left + 20 * n);
        right = clamp(right + 10);
        return this.getState();
      },
      setCharge(side, pct) {
        if (side === "left") left = clamp(pct);
        else if (side === "right") right = clamp(pct);
        return this.getState();
      },
      consume(side) {
        if (side === "left") {
          if (left < 100) return false;
          left = 0;
          return true;
        }
        if (side === "right") {
          if (right < 100) return false;
          right = 0;
          return true;
        }
        return false;
      },
      reset() {
        left = 0;
        right = 0;
        return this.getState();
      },
    };
  }

  /**
   * Crystal Dragon Ultimate Planner:
   * Finds the highest-density obstacle row/diagonal cluster on the board and
   * returns an ordered beam path + impact cluster ({ anchor, targets }).
   */
  function pickDragonBeamTargets(grid, rows, cols) {
    if (!Array.isArray(grid) || rows <= 0 || cols <= 0) {
      return { anchor: { r: 3, c: 3 }, targets: [] };
    }

    let bestScore = -1;
    let bestAnchor = { r: Math.floor(rows / 2), c: Math.floor(cols / 2) };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let score = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            const cell = grid[nr]?.[nc];
            if (!cell) continue;
            if (cell.obs || cell.ice > 0) score += 12 + (cell.ice || 1) * 3;
            else score += 1;
          }
        }
        if (score > bestScore) {
          bestScore = score;
          bestAnchor = { r, c };
        }
      }
    }

    // Collect 3x3 high-density cluster around bestAnchor plus diagonal beam corridor from top-right
    const seen = new Set();
    const targets = [];
    const pushCell = (r, c) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols) return;
      if (!grid[r]?.[c]) return;
      const key = `${r},${c}`;
      if (seen.has(key)) return;
      seen.add(key);
      targets.push({ r, c });
    };

    // Diagonal sweep leading from upper-right toward anchor
    const steps = Math.max(Math.abs(bestAnchor.r), Math.abs(cols - 1 - bestAnchor.c), 1);
    for (let s = 1; s <= steps; s++) {
      const rr = Math.round((bestAnchor.r * s) / steps);
      const cc = Math.round(cols - 1 - ((cols - 1 - bestAnchor.c) * s) / steps);
      pushCell(rr, cc);
    }

    // Full 3x3 impact cluster around bestAnchor
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        pushCell(bestAnchor.r + dr, bestAnchor.c + dc);
      }
    }

    return { anchor: bestAnchor, targets };
  }

  /**
   * Queen Luma Ultimate Planner:
   * Picks up to `count` (default 3) random normal candies (no obstacle, no special)
   * to transform into Candy Rockets.
   */
  function pickQueenRocketTargets(grid, rows, cols, count = 3, rng = Math.random) {
    const candidates = [];
    const fallback = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const it = grid[r]?.[c];
        if (!it) continue;
        if (!it.obs && !(it.ice > 0) && !it.special) {
          candidates.push({ r, c });
        } else if (!it.obs && !(it.ice > 0)) {
          fallback.push({ r, c });
        }
      }
    }
    const pool = candidates.length >= count ? candidates : candidates.concat(fallback);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.max(1, count));
  }

  /**
   * Pharaoh Boy Ultimate Planner:
   * Returns all active obstacle cells on the board so his Ankh staff blasts 1 layer off all of them.
   */
  function pickPharaohAnkhTargets(grid, rows, cols) {
    const targets = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const it = grid[r]?.[c];
        if (it && (it.obs || it.ice > 0)) {
          targets.push({ r, c });
        }
      }
    }
    return targets;
  }

  /**
   * Boss HP Battle & Counter-Attack State Machine (Stage 50 & Stage 100 of Every Palace).
   * - Scales Max HP cleanly so breaking stage obstacles & special blasts drains HP smoothly from 100% -> 0%.
   * - Tracks 5-move punishment counter (4 moves in Palace 3+).
   */
  function createBossBattleState(globalStage, obstacleGoal = 12) {
    const setup = getStageCharacterSetup(globalStage);
    const goal = Math.max(6, Math.floor(Number(obstacleGoal) || 12));
    const palaceBonus = (setup.palaceNumber - 1) * 14 + (setup.stageInPalace === 100 ? 30 : 0);
    // Calibrated so breaking ~all stage obstacles + a few special blasts drains 100% -> 0% smoothly
    const maxHp = Math.max(100, goal * 12 + palaceBonus);
    let hp = maxHp;
    let movesWithoutBreak = 0;
    let totalOrbsFired = 0;

    function getHpPercent() {
      if (hp <= 0) return 0;
      return Math.max(1, Math.min(100, Math.round((hp / maxHp) * 100)));
    }

    return {
      isBossStage: setup.isBossStage,
      palaceNumber: setup.palaceNumber,
      stageInPalace: setup.stageInPalace,
      bossNumber: setup.bossNumber,
      punishmentMoveLimit: setup.punishmentMoveLimit || 5,
      getState() {
        return {
          hp,
          maxHp,
          hpPercent: getHpPercent(),
          defeated: hp <= 0,
          movesWithoutBreak,
          punishmentMoveLimit: setup.punishmentMoveLimit || 5,
          totalOrbsFired,
        };
      },
      /**
       * Apply Boss damage from obstacle break, rocket, bomb, or color ball.
       * Returns 2-4 Golden Magic Energy Orbs + updated HP state.
       */
      applyDamage(source = "obstacle", magnitude = 1) {
        if (hp <= 0) {
          return { orbsCount: 0, damage: 0, ...this.getState() };
        }
        const m = Math.max(1, Number(magnitude) || 1);
        let baseDmg = 14;
        let orbsCount = 2;
        if (source === "color") {
          baseDmg = 26;
          orbsCount = 4;
        } else if (source === "bomb" || source === "super_combo") {
          baseDmg = 22;
          orbsCount = 4;
        } else if (source === "rocket") {
          baseDmg = 18;
          orbsCount = 3;
        } else if (source === "obstacle") {
          baseDmg = 14;
          orbsCount = 2 + (m > 1 ? 1 : 0);
        } else if (source === "ultimate") {
          baseDmg = 30;
          orbsCount = 4;
        }
        const damage = Math.round(baseDmg * Math.min(2.5, m));
        hp = Math.max(0, hp - damage);
        totalOrbsFired += orbsCount;
        return {
          orbsCount: Math.max(2, Math.min(4, orbsCount)),
          damage,
          ...this.getState(),
        };
      },
      /**
       * Sync victory when all board obstacles are cleared on a Boss stage
       * (drains any sliver of remaining HP cleanly to 0%).
       */
      drainRemainingToZero() {
        const remaining = hp;
        hp = 0;
        return { orbsCount: remaining > 0 ? 4 : 0, damage: remaining, ...this.getState() };
      },
      /**
       * Records a player move on a Boss stage:
       * - If an obstacle was broken this turn, resets counter to 0.
       * - Otherwise increments counter and triggers counter-attack when hitting limit (5 or 4).
       */
      recordMoveOutcome(brokeObstacle) {
        if (hp <= 0) {
          movesWithoutBreak = 0;
          return { shouldCounterAttack: false, ...this.getState() };
        }
        if (brokeObstacle) {
          movesWithoutBreak = 0;
          return { shouldCounterAttack: false, ...this.getState() };
        }
        movesWithoutBreak++;
        const limit = setup.punishmentMoveLimit || 5;
        const shouldCounterAttack = movesWithoutBreak >= limit;
        return {
          shouldCounterAttack,
          ...this.getState(),
        };
      },
      resetCounterMoves() {
        movesWithoutBreak = 0;
        return this.getState();
      },
    };
  }

  /**
   * Picks 3 valid normal candy cells (no existing obstacles) for Boss Lightning Strike punishment.
   */
  function pickBossLightningTargets(grid, rows, cols, count = 3, rng = Math.random) {
    const valid = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const it = grid[r]?.[c];
        if (it && !it.obs && !(it.ice > 0)) {
          valid.push({ r, c });
        }
      }
    }
    for (let i = valid.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [valid[i], valid[j]] = [valid[j], valid[i]];
    }
    return valid.slice(0, Math.max(0, count));
  }

  return Object.freeze({
    SPRITE_SHEETS,
    BOSS_HP_BAR_FRAME,
    BOSS_STAGE_NUMBERS_IN_PALACE,
    FRAME_SEQUENCES,
    TIMINGS,
    getSpriteFramePosition,
    isBossStageInPalace,
    getStageCharacterSetup,
    computeRingOffset,
    createHeroChargeTracker,
    pickDragonBeamTargets,
    pickQueenRocketTargets,
    pickPharaohAnkhTargets,
    createBossBattleState,
    pickBossLightningTargets,
  });
});
