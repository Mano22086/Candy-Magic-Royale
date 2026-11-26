/* Candy Magic Royale — Unified Audio & Extracted Asset Pack Manager
 * Uses extracted assets from "اصوات كاندي.zip", "ازرار كاندي.zip", and "صور كاندي.zip"
 * directly from ./assets/packs/ for fast mobile loading, zero JSZip lag, and zero 404 errors.
 */
(function () {
  "use strict";
  if (window.__CMR_UNIFIED_AUDIO__) return;
  window.__CMR_UNIFIED_AUDIO__ = true;

  const SETTINGS_KEY = "cmr_audio_settings_v2";
  const SFX_BASE = "./assets/packs/sounds/";

  const SFX_MAP = {
    click: [SFX_BASE + "UI_Click_Bubble_Pop_V06.wav"],
    confirm: [SFX_BASE + "UI_Confirm_Bubble_Double_Pop_V01.wav"],
    cancel: [SFX_BASE + "UI_Cancel_Back_V02.wav"],
    reward: [SFX_BASE + "UI_Reward_Coin_Pickup_V03.wav"],
    coin: [SFX_BASE + "UI_Reward_Coin_Pickup_V03.wav"],
    win: [SFX_BASE + "UI_Level_Complete_V02.wav"],
    achievement: [SFX_BASE + "UI_Achievement_Unlocked_V01.wav"],
    boss: [SFX_BASE + "UI_Achievement_Unlocked_V01.wav"],
    lose: [SFX_BASE + "UI_Notify_New_Message_V02.wav"],
    notify: [SFX_BASE + "UI_Notify_New_Message_V02.wav"],
    match: [
      SFX_BASE + "02_Menu_Hover/UI_Hover_Magical_Sparkle_V01.wav",
      SFX_BASE + "02_Menu_Hover/UI_Hover_Magical_Sparkle_V02.wav",
      SFX_BASE + "02_Menu_Hover/UI_Hover_Magical_Sparkle_V03.wav",
      SFX_BASE + "02_Menu_Hover/UI_Hover_Magical_Sparkle_V04.wav",
    ],
    swap: [
      SFX_BASE + "02_Menu_Hover/UI_Hover_Airy_Swish_V01.wav",
      SFX_BASE + "02_Menu_Hover/UI_Hover_Airy_Swish_V02.wav",
      SFX_BASE + "02_Menu_Hover/UI_Hover_Airy_Swish_V03.wav",
    ],
    pop: [
      SFX_BASE + "02_Menu_Hover/UI_Hover_Bubble_Blip_V01.wav",
      SFX_BASE + "02_Menu_Hover/UI_Hover_Bubble_Blip_V02.wav",
      SFX_BASE + "02_Menu_Hover/UI_Hover_Bubble_Blip_V03.wav",
    ],
    booster: [
      SFX_BASE + "02_Menu_Hover/UI_Hover_Magical_Sparkle_V05.wav",
      SFX_BASE + "02_Menu_Hover/UI_Hover_Magical_Sparkle_V06.wav",
    ],
    ice: [
      SFX_BASE + "02_Menu_Hover/UI_Hover_Wooden_Mallet_V01.wav",
      SFX_BASE + "02_Menu_Hover/UI_Hover_Wooden_Mallet_V02.wav",
      SFX_BASE + "02_Menu_Hover/UI_Hover_Wooden_Mallet_V03.wav",
    ],
    open: [
      SFX_BASE + "02_Menu_Hover/UI_Hover_Fabric_Slide_V01.wav",
      SFX_BASE + "02_Menu_Hover/UI_Hover_Fabric_Slide_V02.wav",
    ],
    error: [SFX_BASE + "UI_Cancel_Back_V02.wav"],
  };

  function loadSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return {
        musicEnabled: raw.musicEnabled !== undefined ? Boolean(raw.musicEnabled) : true,
        sfxEnabled: raw.sfxEnabled !== undefined ? Boolean(raw.sfxEnabled) : true,
        musicVolume:
          typeof raw.musicVolume === "number" && Number.isFinite(raw.musicVolume)
            ? Math.max(0, Math.min(1, raw.musicVolume))
            : 0.45,
        sfxVolume:
          typeof raw.sfxVolume === "number" && Number.isFinite(raw.sfxVolume)
            ? Math.max(0, Math.min(1, raw.sfxVolume))
            : 0.7,
      };
    } catch (_) {
      return { musicEnabled: true, sfxEnabled: true, musicVolume: 0.45, sfxVolume: 0.7 };
    }
  }

  const BGM_SRC = "./public/assets/aistudio/_____________13597d86.mp3";

  const settings = loadSettings();
  const pools = Object.create(null);
  const lastPlayedAt = Object.create(null);
  const listeners = new Set();

  let unlocked = false;
  let mapMusicActive = false;
  let adPaused = false;
  let bgmAudio = null;

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (_) {}
    listeners.forEach((fn) => {
      try {
        fn({ ...settings });
      } catch (_) {}
    });
  }

  function ensureBgmAudio() {
    if (!bgmAudio) {
      bgmAudio = new Audio(BGM_SRC);
      bgmAudio.loop = true;
      bgmAudio.preload = "auto";
      bgmAudio.volume = Math.max(0, Math.min(1, settings.musicVolume));
      bgmAudio.addEventListener("ended", () => {
        if (mapMusicActive && settings.musicEnabled && !document.hidden) {
          bgmAudio.currentTime = 0;
          const p = bgmAudio.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        }
      });
    }
    return bgmAudio;
  }

  function updateMusicPlayback() {
    const shouldPlay =
      mapMusicActive &&
      !adPaused &&
      settings.musicEnabled &&
      !document.hidden &&
      settings.musicVolume > 0.001;

    if (!shouldPlay) {
      if (bgmAudio && !bgmAudio.paused) {
        try {
          bgmAudio.pause();
        } catch (_) {}
      }
      return;
    }

    const audio = ensureBgmAudio();
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, settings.musicVolume));

    if (audio.paused) {
      try {
        const p = audio.play();
        if (p && typeof p.then === "function") {
          p.then(() => {
            unlocked = true;
          }).catch(() => {
            // Autoplay blocked until first user tap/gesture; unlock() will retry immediately
          });
        }
      } catch (_) {}
    }
  }

  function setMapMusicActive(active) {
    mapMusicActive = Boolean(active);
    updateMusicPlayback();
  }

  function stopMusicForStage() {
    mapMusicActive = false;
    if (bgmAudio) {
      try {
        bgmAudio.pause();
      } catch (_) {}
    }
  }

  function pauseForAd() {
    adPaused = true;
    stopAllSfx();
    if (bgmAudio && !bgmAudio.paused) {
      try {
        bgmAudio.pause();
      } catch (_) {}
    }
  }

  function resumeAfterAd() {
    adPaused = false;
    updateMusicPlayback();
  }

  function getPool(channel) {
    const key = SFX_MAP[channel] ? channel : "click";
    if (!pools[key]) {
      const sources = SFX_MAP[key];
      const items = sources.map((src) => {
        const audio = new Audio(src);
        audio.preload = "none";
        audio.volume = settings.sfxVolume;
        return audio;
      });
      pools[key] = { items, index: 0 };
    }
    return pools[key];
  }

  function stopAllSfx() {
    for (const pool of Object.values(pools)) {
      for (const audio of pool.items) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (_) {}
      }
    }
  }

  function playSfx(channel, options) {
    if (adPaused || !settings.sfxEnabled || settings.sfxVolume <= 0.001 || document.hidden) return;
    const key = SFX_MAP[channel] ? channel : "click";
    const now = performance.now();
    const minGap = key === "match" || key === "ice" || key === "pop" ? 65 : 55;
    if (lastPlayedAt[key] && now - lastPlayedAt[key] < minGap) return;
    lastPlayedAt[key] = now;

    const pool = getPool(key);
    const audio = pool.items[pool.index++ % pool.items.length];
    if (!audio) return;
    try {
      audio.volume = Math.max(0, Math.min(1, settings.sfxVolume));
      const rate =
        options && typeof options.playbackRate === "number" && Number.isFinite(options.playbackRate)
          ? Math.max(0.7, Math.min(1.6, options.playbackRate))
          : 1.0;
      if ("preservesPitch" in audio) audio.preservesPitch = false;
      if ("mozPreservesPitch" in audio) audio.mozPreservesPitch = false;
      if ("webkitPreservesPitch" in audio) audio.webkitPreservesPitch = false;
      audio.playbackRate = rate;
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (_) {}
  }

  function unlock() {
    unlocked = true;
    if (mapMusicActive) {
      updateMusicPlayback();
    }
  }

  function setMusicEnabled(enabled) {
    settings.musicEnabled = Boolean(enabled);
    saveSettings();
    updateMusicPlayback();
  }

  function setSfxEnabled(enabled) {
    settings.sfxEnabled = Boolean(enabled);
    if (!settings.sfxEnabled) stopAllSfx();
    saveSettings();
  }

  function setMusicVolume(vol) {
    settings.musicVolume = Math.max(0, Math.min(1, Number(vol) || 0));
    saveSettings();
    updateMusicPlayback();
  }

  function setSfxVolume(vol) {
    settings.sfxVolume = Math.max(0, Math.min(1, Number(vol) || 0));
    for (const pool of Object.values(pools)) {
      for (const audio of pool.items) {
        audio.volume = settings.sfxVolume;
      }
    }
    saveSettings();
  }

  function setMuted(muted) {
    const m = Boolean(muted);
    settings.musicEnabled = !m;
    settings.sfxEnabled = !m;
    if (m) stopAllSfx();
    saveSettings();
    updateMusicPlayback();
  }

  function isMuted() {
    return !settings.musicEnabled && !settings.sfxEnabled;
  }

  ["pointerdown", "touchstart", "keydown"].forEach((evt) => {
    window.addEventListener(evt, unlock, { passive: true });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAllSfx();
    }
    updateMusicPlayback();
  });

  // Single authoritative UI button click SFX listener (eliminates overlapping duplicate clicks)
  document.addEventListener(
    "click",
    (event) => {
      const target =
        event.target && event.target.closest
          ? event.target.closest("button, [role='button'], .wm-house, .wm-realm")
          : null;
      if (!target || target.dataset.silentSfx === "1") return;
      unlock();
      if (target.disabled || target.classList.contains("locked")) {
        playSfx("error");
        return;
      }
      const id = ((target.id || "") + " " + (target.className || "")).toLowerCase();
      if (/(cancel|close|back|exit|quit)/.test(id)) playSfx("cancel");
      else if (/(confirm|start|play|next|continue|retry|restart)/.test(id)) playSfx("confirm");
      else if (/(booster|paint|shuffle|bomb|rocket|color)/.test(id)) playSfx("pop");
      else if (/(coin|shop|reward|chest|buy)/.test(id)) playSfx("reward");
      else if (/(settings|map|world|realm|house)/.test(id)) playSfx("open");
      else playSfx("click");
    },
    true
  );

  const api = {
    playSfx,
    stopAllSfx,
    unlock,
    setMapMusicActive,
    stopMusicForStage,
    pauseForAd,
    resumeAfterAd,
    resumeMapMusic: () => setMapMusicActive(true),
    getBgmState: () => ({
      active: mapMusicActive,
      adPaused,
      playing: Boolean(bgmAudio && !bgmAudio.paused),
      paused: Boolean(!bgmAudio || bgmAudio.paused),
      loop: Boolean(bgmAudio && bgmAudio.loop),
      src: BGM_SRC,
      volume: bgmAudio ? bgmAudio.volume : settings.musicVolume,
    }),
    getSettings: () => ({ ...settings }),
    setMusicEnabled,
    setSfxEnabled,
    setMusicVolume,
    setSfxVolume,
    setMuted,
    isMuted,
    isSfxEnabled: () => Boolean(settings.sfxEnabled && settings.sfxVolume > 0.001),
    onChange(fn) {
      if (typeof fn === "function") listeners.add(fn);
      return () => listeners.delete(fn);
    },
    assets: {
      buttons: "./assets/packs/buttons/",
      images: "./assets/packs/images/",
      sounds: "./assets/packs/sounds/",
      boards: "./assets/packs/boards/",
      blockers: "./assets/packs/blockers/",
    },
  };

  window.CMRAudio = api;
  window.CMR_ASSETS = api;
  window.CMR_USER_SOUNDS = { play: playSfx };
})();