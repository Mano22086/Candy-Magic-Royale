/* Candy Magic Royale — Luxurious Victory Star-Slam, Count-Up Stats,
 * Rising Musical Chimes (C5 -> E5 -> G5), Out-of-Moves Urgency & Revive Flash UI.
 */
(() => {
  "use strict";
  if (window.__CMR_OUTCOME_CELEBRATION_UI__) return;
  window.__CMR_OUTCOME_CELEBRATION_UI__ = true;

  const Engine = window.CMROutcomeEngine;
  if (!Engine) return;

  let synthCtx = null;
  let activeTimers = [];
  let activeRafs = [];

  function getAudioCtx() {
    if (window.CMRAudio?.isSfxEnabled?.() === false) return null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!synthCtx) synthCtx = new AC();
      if (synthCtx.state === "suspended") synthCtx.resume().catch(() => {});
      return synthCtx;
    } catch (_) {
      return null;
    }
  }

  /**
   * Rising musical star chime SFX: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz)
   */
  function playStarChime(starIndex) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const freqs = Engine.STAR_CHIME_FREQUENCIES || [523.25, 659.25, 783.99];
    const baseFreq = freqs[Math.max(0, Math.min(freqs.length - 1, starIndex))] || 523.25;
    const now = ctx.currentTime;

    try {
      const master = ctx.createGain();
      master.gain.value = 0.24;
      master.connect(ctx.destination);

      // Warm bell fundamental + sparkly octave overtone
      [1, 2, 3].forEach((harmonic, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(baseFreq * harmonic, now);
        const amp = idx === 0 ? 0.62 : idx === 1 ? 0.26 : 0.1;
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(amp, now + 0.018);
        g.gain.exponentialRampToValueAtTime(0.001, now + (idx === 0 ? 0.56 : 0.34));
        osc.connect(g);
        g.connect(master);
        osc.start(now);
        osc.stop(now + 0.6);
      });
    } catch (_) {}
  }

  function playFootstepPop(stepIdx = 0) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const base = 360 + (stepIdx % 4) * 55;
      osc.type = "sine";
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * 1.45, now + 0.07);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.16, now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (_) {}
  }

  function playReviveFlashSfx() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.055);
        g.gain.setValueAtTime(0.001, now + i * 0.055);
        g.gain.linearRampToValueAtTime(0.18, now + i * 0.055 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.34);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + i * 0.055);
        osc.stop(now + i * 0.055 + 0.36);
      });
    } catch (_) {}
  }

  function cancelPending() {
    for (const t of activeTimers) clearTimeout(t);
    activeTimers = [];
    for (const id of activeRafs) cancelAnimationFrame(id);
    activeRafs = [];
  }

  function spawnStarSocketBurst(socketEl) {
    if (!socketEl) return;
    const oldBurst = socketEl.querySelector(".rk-star-burst-layer");
    if (oldBurst) oldBurst.remove();
    const layer = document.createElement("div");
    layer.className = "rk-star-burst-layer";
    const colors = ["#fde047", "#ffffff", "#fbbf24", "#f59e0b", "#fef08a"];
    for (let i = 0; i < 10; i++) {
      const p = document.createElement("span");
      p.className = "rk-star-burst-spark";
      const ang = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5) * 0.25;
      const dist = 26 + Math.random() * 22;
      p.style.setProperty("--sx", `${Math.round(Math.cos(ang) * dist)}px`);
      p.style.setProperty("--sy", `${Math.round(Math.sin(ang) * dist)}px`);
      p.style.background = colors[i % colors.length];
      layer.appendChild(p);
    }
    socketEl.appendChild(layer);
    const t = setTimeout(() => layer.remove(), 680);
    activeTimers.push(t);
  }

  function animateCountUp(el, targetValue, prefix = "", durationMs = 740) {
    if (!el) return;
    const end = Math.max(0, Math.round(Number(targetValue) || 0));
    if (end <= 0) {
      el.textContent = `${prefix}0`;
      return;
    }
    const startAt = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - startAt) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(end * eased);
      el.textContent = `${prefix}${val.toLocaleString("en-US")}`;
      if (p < 1) {
        const id = requestAnimationFrame(step);
        activeRafs.push(id);
      }
    };
    const id = requestAnimationFrame(step);
    activeRafs.push(id);
  }

  function triggerVictoryPresentation({
    starsEarned = 3,
    score = 0,
    coins = 0,
    gems = 0,
    isBoss = false,
    ribbonTitle = "",
    stageSubtitle = "",
    bonusNote = "",
    showGems = true,
  } = {}) {
    cancelPending();
    const earned = Math.max(1, Math.min(3, Math.floor(Number(starsEarned) || 1)));
    const stageEl = document.getElementById("rkVictoryStage");
    const ribbonEl = document.getElementById("rkVictoryRibbonTitle");
    const titleEl = document.getElementById("resultTitle");
    const subEl = document.getElementById("resultText");
    const scoreEl = document.getElementById("winStatScore");
    const coinsEl = document.getElementById("winStatCoins");
    const gemsEl = document.getElementById("winStatGems");
    const gemsChip = document.getElementById("winStatGemsChip");

    if (ribbonEl) {
      ribbonEl.textContent = ribbonTitle || (isBoss || earned === 3 ? "انتصار ساحق!" : "فوز ملكي!");
    }
    if (titleEl && stageSubtitle) {
      titleEl.textContent = stageSubtitle;
    }
    if (subEl && bonusNote !== undefined) {
      subEl.textContent = bonusNote;
    }
    if (gemsChip) {
      gemsChip.classList.toggle("hidden", !showGems && gems <= 0);
    }

    // Re-trigger elastic pop-in on the frame
    if (stageEl) {
      stageEl.classList.remove("is-pop-in");
      void stageEl.offsetWidth;
      stageEl.classList.add("is-pop-in");
    }

    // Reset all 3 star sockets to empty/darkened state first
    const sockets = [
      document.getElementById("rkVictoryStarSlot1"),
      document.getElementById("rkVictoryStarSlot2"),
      document.getElementById("rkVictoryStarSlot3"),
    ];
    sockets.forEach((slot) => {
      if (!slot) return;
      slot.classList.remove("is-earned", "is-slamming");
      slot.classList.add("is-empty");
      const oldBurst = slot.querySelector(".rk-star-burst-layer");
      if (oldBurst) oldBurst.remove();
    });

    // Sequential Star Slam (320ms apart) ONLY for earned stars (1..3)
    const interval = Engine.STAR_SLAM_INTERVAL_MS || 320;
    for (let i = 0; i < earned; i++) {
      const slot = sockets[i];
      if (!slot) continue;
      const t = setTimeout(() => {
        slot.classList.remove("is-empty");
        slot.classList.add("is-earned", "is-slamming");
        spawnStarSocketBurst(slot);
        playStarChime(i);
        try {
          if (navigator.vibrate && window.CMRAudio?.isSfxEnabled?.() !== false) {
            navigator.vibrate(14 + i * 6);
          }
        } catch (_) {}
      }, 180 + i * interval);
      activeTimers.push(t);
    }

    // Smooth counting-up rewards & score inside the inner purple panel
    animateCountUp(scoreEl, score, "", 760);
    animateCountUp(coinsEl, coins, "+", 700);
    animateCountUp(gemsEl, gems, "+", 640);
  }

  function triggerOutOfMovesPresentation({
    temptation,
    obstacleIconSrc,
    obstacleLabelAr,
    gemsBalance = 0,
    gemCost = Engine.REVIVE_GEMS_COST,
    livesLeft = 0,
    maxLives = 5,
  } = {}) {
    cancelPending();
    const stageEl = document.getElementById("rkOutOfMovesStage");
    if (stageEl) {
      stageEl.classList.remove("is-pop-in");
      void stageEl.offsetWidth;
      stageEl.classList.add("is-pop-in");
    }

    const iconEl = document.getElementById("oomObstacleIcon");
    const headlineEl = document.getElementById("oomUrgencyHeadline");
    const progressEl = document.getElementById("oomUrgencyProgress");
    const gemBtn = document.getElementById("lossGemReviveBtn");
    const gemCostLabel = document.getElementById("lossGemReviveCost");
    const subtextEl = document.getElementById("defeatSubtext");

    if (iconEl && obstacleIconSrc) {
      iconEl.src = obstacleIconSrc;
      iconEl.alt = obstacleLabelAr || "العائق المتبقي";
    }
    if (headlineEl && temptation?.headlineAr) {
      headlineEl.textContent = temptation.headlineAr;
    }
    if (progressEl && temptation) {
      const lbl = obstacleLabelAr ? `${obstacleLabelAr}: ` : "";
      progressEl.textContent = `${lbl}تبقى ${temptation.primaryRemaining} من ${temptation.primaryRequired}`;
    }
    if (gemCostLabel) {
      gemCostLabel.textContent = String(gemCost);
    }
    if (gemBtn) {
      const canAfford = Engine.canReviveWithGems(gemsBalance, gemCost);
      gemBtn.classList.toggle("is-low-gems", !canAfford);
      gemBtn.dataset.canAfford = String(canAfford);
    }
    if (subtextEl) {
      subtextEl.textContent =
        livesLeft > 0
          ? `الخسارة تخصم قلباً واحداً · قلوبك الحالية: ${livesLeft}/${maxLives}`
          : "الخسارة تعيدك للخريطة · يمكنك المتابعة الآن بدون خسارة قلب!";
    }
  }

  function showReviveCelebrateFlash(extraMoves = 5) {
    playReviveFlashSfx();
    const shell = document.getElementById("gameShell");
    if (!shell) return;
    const old = shell.querySelector(".cmr-revive-flash");
    if (old) old.remove();
    const flash = document.createElement("div");
    flash.className = "cmr-revive-flash";
    flash.setAttribute("aria-hidden", "true");
    flash.innerHTML = `<span>✨ +${extraMoves} حركات إضافية!</span>`;
    shell.appendChild(flash);

    const movesSlot = document.querySelector(".art-moves");
    if (movesSlot) {
      movesSlot.classList.remove("is-revive-pulse");
      void movesSlot.offsetWidth;
      movesSlot.classList.add("is-revive-pulse");
      setTimeout(() => movesSlot.classList.remove("is-revive-pulse"), 900);
    }
    setTimeout(() => flash.remove(), 1150);
  }

  window.CMROutcomeUI = {
    playStarChime,
    playFootstepPop,
    playReviveFlashSfx,
    triggerVictoryPresentation,
    triggerOutOfMovesPresentation,
    showReviveCelebrateFlash,
    cancelPending,
  };
})();
