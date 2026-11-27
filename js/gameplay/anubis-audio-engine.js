/* Candy Magic Royale — Pooled Zero-Lag 18-MP3 Audio Engine & 10-Second English Streak Voice Announcer
 * Preloads all 18 MP3s from ./mega_pack/11_audio_18/ and exposes clean hooks for match pitch climb,
 * boosters, special creation, obstacle breaks, star slam, victory/loss fanfares, and 10-second voice streaks.
 */
(() => {
  "use strict";
  if (window.__CMR_ANUBIS_AUDIO__) return;
  window.__CMR_ANUBIS_AUDIO__ = true;

  const Pack = window.CMRAnubisPack;
  const AUDIO_MAP = Pack?.MEGA_PACK_ASSETS?.audio18 || {};

  const POOL_SIZE = 3;
  const pools = Object.create(null);
  let preloaded = false;
  let activeVoiceAudio = null;
  let activeVoiceTimer = 0;

  const streakEngine = Pack?.createStreakAnnouncerEngine
    ? Pack.createStreakAnnouncerEngine(10000)
    : null;

  function isSfxEnabled() {
    if (window.CMRAudio && typeof window.CMRAudio.isSfxEnabled === "function") {
      return window.CMRAudio.isSfxEnabled();
    }
    return true;
  }

  function getSfxVolume() {
    const v = window.CMRAudio?.getSettings?.()?.sfxVolume;
    return typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.72;
  }

  function buildPool(key) {
    if (pools[key]) return pools[key];
    const src = AUDIO_MAP[key];
    if (!src) return null;
    const isVoice = key.startsWith("voice_");
    const count = isVoice ? 1 : POOL_SIZE;
    const items = [];
    for (let i = 0; i < count; i++) {
      const a = new Audio(src);
      a.preload = "auto";
      a.volume = getSfxVolume();
      items.push(a);
    }
    pools[key] = { items, idx: 0 };
    return pools[key];
  }

  function preloadAll() {
    if (preloaded) return;
    preloaded = true;
    Object.keys(AUDIO_MAP).forEach((key) => {
      try {
        buildPool(key);
      } catch (_) {}
    });
  }

  function playKey(key, options = {}) {
    if (!isSfxEnabled() || document.hidden) return null;
    const pool = buildPool(key);
    if (!pool || !pool.items.length) return null;
    const audio = pool.items[pool.idx++ % pool.items.length];
    try {
      audio.volume = Math.max(0, Math.min(1, getSfxVolume() * (options.volumeScale || 1)));
      const rate =
        typeof options.playbackRate === "number" && Number.isFinite(options.playbackRate)
          ? Math.max(0.7, Math.min(1.65, options.playbackRate))
          : 1;
      if ("preservesPitch" in audio) audio.preservesPitch = false;
      if ("mozPreservesPitch" in audio) audio.mozPreservesPitch = false;
      if ("webkitPreservesPitch" in audio) audio.webkitPreservesPitch = false;
      audio.playbackRate = rate;
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
      return audio;
    } catch (_) {
      return null;
    }
  }

  function ensureStreakBannerEl() {
    let el = document.getElementById("englishStreakBanner");
    if (el) return el;
    const boardRim = document.querySelector(".art-board-rim") || document.getElementById("boardWrap");
    if (!boardRim) return null;
    el = document.createElement("div");
    el.id = "englishStreakBanner";
    el.className = "cmr-en-streak-banner hidden";
    el.setAttribute("dir", "ltr");
    el.setAttribute("aria-hidden", "true");
    boardRim.appendChild(el);
    return el;
  }

  function hideStreakBanner() {
    const el = document.getElementById("englishStreakBanner");
    if (!el) return;
    el.classList.remove("is-visible");
    el.classList.add("is-fading");
    clearTimeout(el.__hideT);
    el.__hideT = setTimeout(() => {
      el.classList.add("hidden");
      el.classList.remove("is-fading");
    }, 240);
  }

  function showStreakCallout(callout) {
    if (!callout) return;
    const el = ensureStreakBannerEl();
    clearTimeout(activeVoiceTimer);

    if (activeVoiceAudio) {
      try {
        activeVoiceAudio.onended = null;
        activeVoiceAudio.pause();
        activeVoiceAudio.currentTime = 0;
      } catch (_) {}
      activeVoiceAudio = null;
    }

    if (el) {
      clearTimeout(el.__hideT);
      el.textContent = callout.text;
      el.dataset.tier = String(callout.tier || 1);
      el.classList.remove("hidden", "is-fading", "is-visible");
      void el.offsetWidth;
      el.classList.add("is-visible");
    }

    const voiceAudio = playKey(callout.voiceKey, { volumeScale: 1.0 });
    activeVoiceAudio = voiceAudio;

    // Fade out cleanly right after the voice finishes (with a crisp 1350ms fallback if audio muted/blocked)
    if (voiceAudio) {
      voiceAudio.onended = () => {
        if (activeVoiceAudio === voiceAudio) {
          activeVoiceAudio = null;
          clearTimeout(activeVoiceTimer);
          hideStreakBanner();
        }
      };
      activeVoiceTimer = setTimeout(() => {
        if (activeVoiceAudio === voiceAudio) activeVoiceAudio = null;
        hideStreakBanner();
      }, 1550);
    } else {
      activeVoiceTimer = setTimeout(() => hideStreakBanner(), 1150);
    }
  }

  function recordMatchForStreak(nowMs = Date.now()) {
    if (!streakEngine) return null;
    const res = streakEngine.recordMatch(nowMs);
    if (res.triggered && res.callout) {
      showStreakCallout(res.callout);
    }
    return res;
  }

  function resetStreak() {
    streakEngine?.reset?.();
    clearTimeout(activeVoiceTimer);
    if (activeVoiceAudio) {
      try {
        activeVoiceAudio.onended = null;
        activeVoiceAudio.pause();
      } catch (_) {}
      activeVoiceAudio = null;
    }
    hideStreakBanner();
  }

  function stopAll() {
    resetStreak();
    for (const pool of Object.values(pools)) {
      for (const a of pool.items) {
        try {
          a.pause();
          a.currentTime = 0;
        } catch (_) {}
      }
    }
  }

  // Warm preload on first pointer/load interaction without blocking first paint
  if (typeof window !== "undefined") {
    const kickPreload = () => preloadAll();
    window.addEventListener("pointerdown", kickPreload, { once: true, passive: true });
    if (document.readyState === "complete") {
      setTimeout(preloadAll, 300);
    } else {
      window.addEventListener("load", () => setTimeout(preloadAll, 300), { once: true });
    }
  }

  window.CMRAnubisAudio = {
    preloadAll,
    playKey,
    playMatch: (pitchRate = 1) => playKey("sfx_match_normal", { playbackRate: pitchRate }),
    playRocket: () => playKey("sfx_booster_rocket"),
    playBomb: () => playKey("sfx_booster_bomb"),
    playColorBall: () => playKey("sfx_booster_colorball"),
    playShuffle: () => playKey("sfx_booster_shuffle"),
    playWand: () => playKey("sfx_booster_wand"),
    playSpecialCreate: () => playKey("sfx_special_create"),
    playObstacleBreak: () => playKey("sfx_obstacle_break"),
    playQueenCallout: () => playKey("sfx_queen_callout"),
    playStarSlam: (starIndex = 0) =>
      playKey("sfx_star_slam", { playbackRate: Math.min(1.3, 1 + starIndex * 0.1) }),
    playVictoryFanfare: () => playKey("sfx_victory_fanfare"),
    playLossDramatic: () => playKey("sfx_loss_dramatic"),
    playVictory: () => playKey("sfx_victory_fanfare"),
    playLose: () => playKey("sfx_loss_dramatic"),
    playBossLaugh: () => playKey("sfx_loss_dramatic", { playbackRate: 0.85, volumeScale: 0.92 }),
    playClick: () => playKey("sfx_match_normal", { playbackRate: 1.25, volumeScale: 0.45 }),
    recordMatchForStreak,
    resetStreak,
    stopAll,
    getStreakState: () => streakEngine?.getState?.() || { streakCount: 0 },
  };
})();
