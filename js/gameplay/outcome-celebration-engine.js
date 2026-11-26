/* Candy Magic Royale — Pure Outcome Rating, Victory Star Persistence,
 * Out-of-Moves Urgency & Palace Map Avatar Curved-Hop Math (UMD).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CMROutcomeEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const OUTCOME_ASSETS = Object.freeze({
    victoryFrame: "./public/assets/aistudio/ui_victory_frame_dfff79ac.png",
    outOfMovesFrame: "./public/assets/aistudio/ui_out_of_moves_frame_a6e09c8a.png",
    victoryStar: "./public/assets/aistudio/icon_victory_star_8b503f69.png",
    goldCoin: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png",
    gemIcon: "./assets/packs/buttons/icon_gem.png",
    queenAvatar: "./assets/extracted/avatars/avatar_queen_luma.png",
    pharaohAvatar: "./assets/extracted/avatars/avatar_pharaoh_boy.png",
  });

  const REVIVE_GEMS_COST = 15;
  const REVIVE_EXTRA_MOVES = 5;
  const STAR_SLAM_INTERVAL_MS = 320;
  // Rising musical star chimes: C5 -> E5 -> G5 (Hz)
  const STAR_CHIME_FREQUENCIES = Object.freeze([523.25, 659.25, 783.99]);
  const AVATAR_WALK_DURATION_MS = 900;

  /**
   * Compute balanced score thresholds for 1, 2, and 3 stars on any stage 1..1000.
   */
  function getStarScoreThresholds(level = 1, isBoss = false) {
    const lvl = Math.max(1, Math.min(1000, Math.floor(Number(level) || 1)));
    const palaceIdx = Math.floor((lvl - 1) / 100);
    const local = ((lvl - 1) % 100) + 1;
    const bossMul = isBoss ? 1.35 : 1;
    const base = Math.round((800 + palaceIdx * 240 + local * 14) * bossMul);
    return {
      star1Threshold: Math.round(base * 0.5),
      star2Threshold: Math.round(base * 1.45),
      star3Threshold: Math.round(base * 2.25),
    };
  }

  /**
   * Exact Star Rating Logic (1, 2, or 3 Stars):
   * - 1 Star: Stage objectives cleared (score >= star1Threshold or objectives cleared)
   * - 2 Stars: score >= star2Threshold OR remainingMoves >= 3
   * - 3 Stars: score >= star3Threshold OR remainingMoves >= 6
   */
  function calculateStarsEarned({
    score = 0,
    remainingMoves = 0,
    level = 1,
    isBoss = false,
    objectivesCleared = true,
    thresholds = null,
  } = {}) {
    if (!objectivesCleared) return 0;
    const sc = Math.max(0, Number(score) || 0);
    const rem = Math.max(0, Math.floor(Number(remainingMoves) || 0));
    const th = thresholds || getStarScoreThresholds(level, isBoss);

    if (sc >= th.star3Threshold || rem >= 6) return 3;
    if (sc >= th.star2Threshold || rem >= 3) return 2;
    if (sc >= th.star1Threshold || objectivesCleared) return 1;
    return 1;
  }

  /**
   * Persist best stars for a level: stageStars[levelId] = Math.max(prev, starsEarned).
   */
  function mergeStageStars(currentMap, levelId, starsEarned) {
    const map = currentMap && typeof currentMap === "object" ? { ...currentMap } : {};
    const key = String(Math.max(1, Math.floor(Number(levelId) || 1)));
    const prev = Math.max(0, Math.min(3, Math.floor(Number(map[key]) || 0)));
    const earned = Math.max(1, Math.min(3, Math.floor(Number(starsEarned) || 1)));
    const bestStars = Math.max(prev, earned);
    map[key] = bestStars;
    return {
      stageStars: map,
      prevStars: prev,
      bestStars,
      starDelta: Math.max(0, bestStars - prev),
    };
  }

  /**
   * Format natural, urgent Arabic remaining-objective temptation text for Out-of-Moves.
   */
  function formatRemainingObjectiveTemptation(missionTargets, fallbackRemaining = 1) {
    const list = Array.isArray(missionTargets) ? missionTargets : [];
    const unfinished = list
      .map((t) => {
        const req = Math.max(1, Math.floor(Number(t?.required) || 1));
        const brk = Math.max(0, Math.floor(Number(t?.broken) || 0));
        return {
          id: String(t?.id || "single_ice"),
          required: req,
          broken: Math.min(req, brk),
          remaining: Math.max(0, req - brk),
        };
      })
      .filter((t) => t.remaining > 0);

    const totalRemaining =
      unfinished.length > 0
        ? unfinished.reduce((acc, t) => acc + t.remaining, 0)
        : Math.max(1, Math.floor(Number(fallbackRemaining) || 1));

    const primary = unfinished[0] || {
      id: "single_ice",
      required: totalRemaining,
      broken: 0,
      remaining: totalRemaining,
    };

    let headlineAr;
    if (totalRemaining === 1) {
      headlineAr = "باقي عائق واحد فقط على الفوز!";
    } else if (totalRemaining === 2) {
      headlineAr = "باقي عائقان فقط على الفوز!";
    } else if (totalRemaining <= 10) {
      headlineAr = `باقي ${totalRemaining} عوائق فقط على الفوز!`;
    } else {
      headlineAr = `باقي ${totalRemaining} عائقاً فقط على الفوز!`;
    }

    return {
      totalRemaining,
      primaryObstacleId: primary.id,
      primaryRemaining: primary.remaining,
      primaryBroken: primary.broken,
      primaryRequired: primary.required,
      unfinishedCount: unfinished.length || 1,
      headlineAr,
    };
  }

  function canReviveWithGems(gems, cost = REVIVE_GEMS_COST) {
    return Math.max(0, Math.floor(Number(gems) || 0)) >= Math.max(1, Math.floor(Number(cost) || REVIVE_GEMS_COST));
  }

  function applyGemRevive(snapshot, cost = REVIVE_GEMS_COST, extraMoves = REVIVE_EXTRA_MOVES) {
    const gems = Math.max(0, Math.floor(Number(snapshot?.gems) || 0));
    const moves = Math.max(0, Math.floor(Number(snapshot?.moves) || 0));
    const reqCost = Math.max(1, Math.floor(Number(cost) || REVIVE_GEMS_COST));
    const addMoves = Math.max(1, Math.floor(Number(extraMoves) || REVIVE_EXTRA_MOVES));
    if (gems < reqCost) {
      return { ok: false, reason: "insufficient_gems", gems, moves, cost: reqCost };
    }
    return {
      ok: true,
      gems: gems - reqCost,
      moves: moves + addMoves,
      cost: reqCost,
      addedMoves: addMoves,
    };
  }

  /**
   * Compute smooth curved-path walking/hopping coordinates between two map slots
   * (0 <= t <= 1) with bouncy multi-hop lift and playful squash-stretch.
   */
  function computeCurvedHopPoint(from, to, rawT, opts = {}) {
    const t = Math.max(0, Math.min(1, Number(rawT) || 0));
    // Smooth easeInOutQuad along the horizontal/vertical curve
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const x0 = Number(from?.x) || 0;
    const y0 = Number(from?.y) || 0;
    const x1 = Number(to?.x) || 0;
    const y1 = Number(to?.y) || 0;

    const arcLift = Number.isFinite(opts.arcLift) ? opts.arcLift : 28;
    const hops = Math.max(1, Math.floor(Number(opts.hops) || 3));
    const hopHeight = Number.isFinite(opts.hopHeight) ? opts.hopHeight : 18;

    // Midpoint control lifted upward for a curved royal path
    const cx = (x0 + x1) * 0.5;
    const cy = Math.min(y0, y1) - arcLift;

    // Quadratic Bézier base position
    const inv = 1 - ease;
    const bx = inv * inv * x0 + 2 * inv * ease * cx + ease * ease * x1;
    const by = inv * inv * y0 + 2 * inv * ease * cy + ease * ease * y1;

    // Add playful rhythmic hops along the walk
    const hopWave = Math.abs(Math.sin(t * Math.PI * hops));
    const y = by - hopWave * hopHeight;
    const scaleX = 1 - hopWave * 0.08 + (1 - hopWave) * 0.05;
    const scaleY = 1 + hopWave * 0.12 - (1 - hopWave) * 0.06;
    const tiltDir = x1 >= x0 ? 1 : -1;
    const rotateDeg = Math.sin(t * Math.PI * hops) * 7 * tiltDir;

    return {
      x: Number(bx.toFixed(3)),
      y: Number(y.toFixed(3)),
      hopPhase: Number(hopWave.toFixed(3)),
      scaleX: Number(scaleX.toFixed(3)),
      scaleY: Number(scaleY.toFixed(3)),
      rotateDeg: Number(rotateDeg.toFixed(2)),
    };
  }

  return {
    OUTCOME_ASSETS,
    REVIVE_GEMS_COST,
    REVIVE_EXTRA_MOVES,
    STAR_SLAM_INTERVAL_MS,
    STAR_CHIME_FREQUENCIES,
    AVATAR_WALK_DURATION_MS,
    getStarScoreThresholds,
    calculateStarsEarned,
    mergeStageStars,
    formatRemainingObjectiveTemptation,
    canReviveWithGems,
    applyGemRevive,
    computeCurvedHopPoint,
  };
});
