/* Candy Magic Royale — Hero Ultimate Power, 50-Frame 10x5 Character Sprite Math,
 * & King Anubis Boss HP Battle State Machine (Pure UMD module for browser + node:test).
 * New Cast ONLY: Queen Cleopatra (Left), Golden Dragon (Right), King Anubis (Boss 50 & 100).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CMRHeroBossEngine = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SPRITE_GRID = Object.freeze({
    COLS: 10,
    ROWS: 5,
    TOTAL_FRAMES: 50,
    FRAME_W: 200,
    FRAME_H: 200,
    SHEET_W: 2000,
    SHEET_H: 1000,
  });

  const SPRITE_SHEETS = Object.freeze({
    cleopatra: "./mega_pack/06_characters_50frames_10x5/sheet_cleopatra_queen_50frames_10x5.png",
    golden_dragon: "./mega_pack/06_characters_50frames_10x5/sheet_golden_dragon_50frames_10x5.png",
    boss_anubis: "./mega_pack/06_characters_50frames_10x5/sheet_boss_anubis_50frames_10x5.png",
  });

  const BOSS_HP_BAR_FRAME = "./mega_pack/09_pharaonic_ui_frames/ui_boss_hp_bar_empty.png";

  const BOSS_STAGE_NUMBERS_IN_PALACE = Object.freeze([50, 100]);

  function rangeFrames(start, end) {
    const out = [];
    if (start <= end) {
      for (let i = start; i <= end; i++) out.push(i);
    } else {
      for (let i = start; i >= end; i--) out.push(i);
    }
    return Object.freeze(out);
  }

  // Smooth 50-frame (0..49) sequences at ~20ms/step for 120Hz/144Hz buttery playback
  const FRAME_SEQUENCES = Object.freeze({
    IDLE_LOOP: rangeFrames(0, 14),
    BLINK: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 6, 4, 2, 0]),
    DRAGON_WING_LOOP: rangeFrames(0, 19),
    HERO_HAPPY_IN: rangeFrames(15, 29),
    HERO_HAPPY_OUT: rangeFrames(29, 15),
    HERO_CELEBRATE_IN: rangeFrames(30, 44),
    HERO_CELEBRATE_OUT: rangeFrames(44, 49),
    BOSS_IDLE_LOOP: rangeFrames(0, 14),
    BOSS_EVIL_LAUGH: Object.freeze([...rangeFrames(10, 24), ...rangeFrames(23, 10)]),
    BOSS_ANGRY_CHARGE: rangeFrames(20, 34),
    BOSS_LIGHTNING_STRIKE: rangeFrames(35, 44),
    BOSS_RETURN_IDLE: rangeFrames(45, 49),
  });

  const TIMINGS = Object.freeze({
    STEP_MS: 20,
    BLINK_INTERVAL_MS: 3200,
    DRAGON_FLAP_MS: 32,
    HAPPY_HOLD_MS: 360,
    CELEBRATE_HOLD_MS: 640,
    BOSS_LAUGH_INTERVAL_MS: 15000,
    BOSS_STRIKE_HOLD_MS: 720,
  });

  /**
   * Row-major 10x5 sprite sheet frame coordinates (indices 0..49).
   * Returns exact CSS background-position percentages for background-size: 1000% 500%.
   */
  function getSpriteFramePosition(frameIndex) {
    const idx = Math.max(0, Math.min(SPRITE_GRID.TOTAL_FRAMES - 1, Math.floor(Number(frameIndex) || 0)));
    const col = idx % SPRITE_GRID.COLS;
    const row = Math.floor(idx / SPRITE_GRID.COLS);
    const xPct = (col * 100) / (SPRITE_GRID.COLS - 1);
    const yPct = (row * 100) / (SPRITE_GRID.ROWS - 1);
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
   * Determines whether a stage in a palace (1..100) is a King Anubis Boss Stage.
   * Stage 50 & Stage 100 of EVERY palace (infinite realms supported!).
   */
  function isBossStageInPalace(stageInPalace) {
    const s = Math.floor(Number(stageInPalace) || 1);
    return BOSS_STAGE_NUMBERS_IN_PALACE.includes(s);
  }

  /**
   * Resolves character placement & roles for ANY global stage (1..Infinity).
   * - Normal Stages: Left = Queen Cleopatra, Right = Golden Dragon
   * - Boss Stages (Stage 50 & Stage 100 of EVERY palace): Single centered King Anubis
   */
  function getStageCharacterSetup(globalStage) {
    const stage = Math.max(1, Math.floor(Number(globalStage) || 1));
    const palaceIndex = Math.floor((stage - 1) / 100);
    const palaceNumber = palaceIndex + 1; // 1..Infinity
    const stageInPalace = ((stage - 1) % 100) + 1; // 1..100
    const isBossStage = isBossStageInPalace(stageInPalace);

    if (isBossStage) {
      const bossSlotInPalace = stageInPalace === 50 ? 1 : 2;
      const bossNumber = palaceIndex * 2 + bossSlotInPalace; // 1..Infinity
      const bossBoardArtNum = ((bossNumber - 1) % 20) + 1; // 1..20 WebP boards
      const punishmentMoveLimit = 5; // Every 5 moves Ankh Lightning throws 3 flying obstacles
      return {
        globalStage: stage,
        palaceNumber,
        stageInPalace,
        isBossStage: true,
        bossNumber,
        bossBoardName: `boss_anubis_board_${String(bossBoardArtNum).padStart(2, "0")}`,
        bossBoardPath: `./mega_pack/08_boards_boss_anubis_20/boss_anubis_board_${String(bossBoardArtNum).padStart(2, "0")}.webp`,
        punishmentMoveLimit,
        bossId: "boss_anubis",
        bossSheet: SPRITE_SHEETS.boss_anubis,
        bossNameAr: stageInPalace === 100 ? "الملك أنوبيس الأعظم" : "الملك أنوبيس",
        leftHeroId: null,
        leftHeroSheet: null,
        rightHeroId: null,
        rightHeroSheet: null,
      };
    }

    return {
      globalStage: stage,
      palaceNumber,
      stageInPalace,
      isBossStage: false,
      bossNumber: 0,
      bossBoardName: null,
      bossBoardPath: null,
      punishmentMoveLimit: 0,
      bossId: null,
      bossSheet: null,
      bossNameAr: null,
      leftHeroId: "cleopatra",
      leftHeroSheet: SPRITE_SHEETS.cleopatra,
      leftHeroNameAr: "الملكة كليوباترا",
      rightHeroId: "golden_dragon",
      rightHeroSheet: SPRITE_SHEETS.golden_dragon,
      rightHeroNameAr: "التنين الذهبي",
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
   * - Left Hero Ring (Queen Cleopatra, Magenta-Gold): +8% per normal match, +20% per special/obstacle break
   * - Right Dragon Ring (Golden Dragon, Cyan-Gold): +10% per match/cascade
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
   * Golden Dragon Ultimate Planner:
   * Finds the highest-density obstacle row/diagonal cluster on the 8x8 board.
   */
  function pickDragonBeamTargets(grid, rows = 8, cols = 8) {
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

    const steps = Math.max(Math.abs(bestAnchor.r), Math.abs(cols - 1 - bestAnchor.c), 1);
    for (let s = 1; s <= steps; s++) {
      const rr = Math.round((bestAnchor.r * s) / steps);
      const cc = Math.round(cols - 1 - ((cols - 1 - bestAnchor.c) * s) / steps);
      pushCell(rr, cc);
    }

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        pushCell(bestAnchor.r + dr, bestAnchor.c + dc);
      }
    }

    return { anchor: bestAnchor, targets };
  }

  /**
   * Queen Cleopatra Ultimate Planner:
   * Picks up to `count` (default 3) random normal candies to transform into Candy Rockets.
   */
  function pickQueenRocketTargets(grid, rows = 8, cols = 8, count = 3, rng = Math.random) {
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
   * Utility Planner: returns all active obstacle cells on the board.
   */
  function pickPharaohAnkhTargets(grid, rows = 8, cols = 8) {
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
   * King Anubis Boss HP Battle & 5-Move Ankh Lightning Counter-Attack State Machine.
   */
  function createBossBattleState(globalStage, obstacleGoal = 14) {
    const setup = getStageCharacterSetup(globalStage);
    const goal = Math.max(6, Math.floor(Number(obstacleGoal) || 14));
    const palaceBonus = Math.min(20, setup.palaceNumber - 1) * 14 + (setup.stageInPalace === 100 ? 32 : 0);
    const maxHp = Math.max(110, goal * 12 + palaceBonus);
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
      drainRemainingToZero() {
        const remaining = hp;
        hp = 0;
        return { orbsCount: remaining > 0 ? 4 : 0, damage: remaining, ...this.getState() };
      },
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
   * Picks 3 valid normal candy cells (no existing obstacles) for King Anubis Ankh Lightning punishment.
   */
  function pickBossLightningTargets(grid, rows = 8, cols = 8, count = 3, rng = Math.random) {
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
    SPRITE_GRID,
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
