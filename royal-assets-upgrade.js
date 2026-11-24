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

  const settings = loadSettings();
  const pools = Object.create(null);
  const lastPlayedAt = Object.create(null);
  const listeners = new Set();

  let unlocked = false;
  let audioCtx = null;
  let musicGain = null;
  let musicTimer = null;
  let musicStep = 0;

  // Gentle royal celesta/harp progression (pentatonic C-major / A-minor fantasy motif)
  const MELODY_NOTES = [
    523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33,
    440.0, 523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 392.0,
  ];
  const BASS_NOTES = [261.63, 220.0, 174.61, 196.0];

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

  function ensureAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx) {
      audioCtx = new AudioCtx();
      musicGain = audioCtx.createGain();
      musicGain.gain.value = settings.musicEnabled ? settings.musicVolume * 0.16 : 0;
      musicGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playMusicNote() {
    if (!settings.musicEnabled || document.hidden || !unlocked || settings.musicVolume <= 0.001) {
      return;
    }
    const ctx = ensureAudioContext();
    if (!ctx || ctx.state !== "running" || !musicGain) return;

    const now = ctx.currentTime;
    const freq = MELODY_NOTES[musicStep % MELODY_NOTES.length];
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(0.28, now + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);

    osc.connect(noteGain);
    noteGain.connect(musicGain);
    osc.start(now);
    osc.stop(now + 0.76);

    if (musicStep % 4 === 0) {
      const bassFreq = BASS_NOTES[Math.floor(musicStep / 4) % BASS_NOTES.length];
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = "sine";
      bass.frequency.setValueAtTime(bassFreq, now);
      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.linearRampToValueAtTime(0.22, now + 0.08);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      bass.connect(bassGain);
      bassGain.connect(musicGain);
      bass.start(now);
      bass.stop(now + 1.55);
    }

    musicStep++;
  }

  function updateMusicPlayback() {
    if (musicGain && audioCtx) {
      const target = settings.musicEnabled && !document.hidden ? settings.musicVolume * 0.16 : 0;
      try {
        musicGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.05);
      } catch (_) {
        musicGain.gain.value = target;
      }
    }
    if (settings.musicEnabled && unlocked && !document.hidden && settings.musicVolume > 0.001) {
      if (!musicTimer) {
        ensureAudioContext();
        musicTimer = setInterval(playMusicNote, 560);
      }
    } else if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
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

  function playSfx(channel) {
    if (!settings.sfxEnabled || settings.sfxVolume <= 0.001 || document.hidden) return;
    const key = SFX_MAP[channel] ? channel : "click";
    const now = performance.now();
    const minGap = key === "match" || key === "ice" || key === "pop" ? 75 : 55;
    if (lastPlayedAt[key] && now - lastPlayedAt[key] < minGap) return;
    lastPlayedAt[key] = now;

    const pool = getPool(key);
    const audio = pool.items[pool.index++ % pool.items.length];
    if (!audio) return;
    try {
      audio.volume = Math.max(0, Math.min(1, settings.sfxVolume));
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (_) {}
  }

  function unlock() {
    if (!unlocked) {
      unlocked = true;
      ensureAudioContext();
      updateMusicPlayback();
    } else if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
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
    getSettings: () => ({ ...settings }),
    setMusicEnabled,
    setSfxEnabled,
    setMusicVolume,
    setSfxVolume,
    setMuted,
    isMuted,
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