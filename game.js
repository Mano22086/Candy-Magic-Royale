(() => {
  "use strict";

  const Core = window.CMRCore;
  if (!Core) {
    console.error("[CMR] game-core.js must be loaded before game.js");
    return;
  }

  const COLS = 8;
  const ROWS = 8;
  const SPACING = 1.0;
  const TYPES = 6;
  const CANDY_FIT = 0.86;
  const SAVE_KEY = "cmr_reborn_v1";
  const PLAYER_KEY = "cmr_player_identity_v1";
  const CLAIMED_KEY = "cmr_claimed_levels_v1";

  // Color indices 1..6 match Mega Pack color order: red, blue, green, yellow, purple, orange
  const palette = [
    { name: "Ruby Red", color: new BABYLON.Color3(0.95, 0.16, 0.28) },
    { name: "Sapphire Blue", color: new BABYLON.Color3(0.14, 0.62, 1.0) },
    { name: "Emerald Green", color: new BABYLON.Color3(0.14, 0.82, 0.42) },
    { name: "Golden Yellow", color: new BABYLON.Color3(1.0, 0.82, 0.14) },
    { name: "Amethyst Purple", color: new BABYLON.Color3(0.68, 0.25, 0.96) },
    { name: "Amber Orange", color: new BABYLON.Color3(1.0, 0.52, 0.08) },
  ];

  const Systems = window.CMRMatch3Systems || null;
  const HeroBossEngine = window.CMRHeroBossEngine || null;
  const OutcomeEngine = window.CMROutcomeEngine || null;
  const AnubisPack = window.CMRAnubisPack || null;

  const OBSTACLE_DEFS = Systems?.OBSTACLE_CATALOG
    ? { ...Systems.OBSTACLE_CATALOG }
    : {
        single_ice: { img: "1", imgSrc: "./assets/packs/blockers/1.png", hp: 1, adj: true, self: true, spread: false, reward: false },
        double_ice: { img: "2", imgSrc: "./assets/packs/blockers/2.png", hp: 2, adj: true, self: true, spread: false, reward: false },
        stone_wall: { img: "3", imgSrc: "./assets/packs/blockers/3.png", hp: 2, adj: true, self: false, spread: false, reward: false },
        rope_net: { img: "4", imgSrc: "./assets/packs/blockers/4.png", hp: 2, adj: true, self: false, spread: false, reward: false },
        vault: { img: "5", imgSrc: "./assets/packs/blockers/5.png", hp: 3, adj: true, self: false, spread: false, reward: true },
        roots: { img: "6", imgSrc: "./assets/packs/blockers/6.png", hp: 2, adj: true, self: false, spread: true, reward: false },
        golden_cage: { img: "7", imgSrc: "./assets/packs/blockers/7.png", hp: 2, adj: false, self: true, spread: false, reward: true },
        iron_cage: { img: "8", imgSrc: "./assets/packs/blockers/8.png", hp: 2, adj: false, self: true, spread: false, reward: false },
        whirlpool: { img: "9", imgSrc: "./assets/packs/blockers/9.png", hp: 1, adj: true, self: false, spread: false, reward: true },
      };

  const pityTracker = Systems?.createPityTracker ? Systems.createPityTracker() : null;

  // Dynamic dual candy palette (Odd Palaces = Royal Desserts, Even Palaces = Pharaonic Relics)
  let activeCandyTheme = "royal_desserts";
  const candyImages = {
    1: "./mega_pack/01_candies_royal_desserts/dessert_01_red_cupcake.png",
    2: "./mega_pack/01_candies_royal_desserts/dessert_02_blue_donut.png",
    3: "./mega_pack/01_candies_royal_desserts/dessert_03_green_macaron.png",
    4: "./mega_pack/01_candies_royal_desserts/dessert_04_yellow_star_cookie.png",
    5: "./mega_pack/01_candies_royal_desserts/dessert_05_purple_berry_tart.png",
    6: "./mega_pack/01_candies_royal_desserts/dessert_06_orange_glaze_swirl.png",
  };
  const candyImageRatios = { 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0 };

  const specialSpriteSources = {
    wrapped: {
      1: "./mega_pack/04_special_bombs_6/bomb_red.png",
      2: "./mega_pack/04_special_bombs_6/bomb_blue.png",
      3: "./mega_pack/04_special_bombs_6/bomb_green.png",
      4: "./mega_pack/04_special_bombs_6/bomb_yellow.png",
      5: "./mega_pack/04_special_bombs_6/bomb_purple.png",
      6: "./mega_pack/04_special_bombs_6/bomb_orange.png",
    },
    color: "./mega_pack/05_special_color_ball/special_color_ball.png",
    striped: {
      1: "./mega_pack/03_special_rockets_6/rocket_red.png",
      2: "./mega_pack/03_special_rockets_6/rocket_blue.png",
      3: "./mega_pack/03_special_rockets_6/rocket_green.png",
      4: "./mega_pack/03_special_rockets_6/rocket_yellow.png",
      5: "./mega_pack/03_special_rockets_6/rocket_purple.png",
      6: "./mega_pack/03_special_rockets_6/rocket_orange.png",
    },
  };

  const STORE_DAILY_KEY = "cmr_store_daily_v1";
  const stateMachine = Core.createGameStateMachine();
  const heartGuard = Core.createHeartActionGuard();
  const storeEngine = Core.createStoreEngine();

  const state = {
    grid: [],
    savedGrid: null,
    score: 0,
    moves: 25,
    level: 1,
    highestUnlocked: 1,
    resumeLevel: 1,
    replayMode: false,
    coins: 500,
    gems: 25,
    stars: 0,
    stageStars: {},
    lives: 5,
    lastHeartAt: Date.now(),
    selected: null,
    lossHandled: false,
    levelReady: false,
    booster: null,
    hammer: 3,
    rockets: 3,
    colors: 3,
    paints: 3,
    extra: 2,
    iceRemaining: 0,
    obstacleGoal: 0,
    obstaclesCleared: 0,
    obstacleGrowthTurns: 0,
    settingsOpen: false,
    settingsContext: "gameplay",
    activeConfirmToken: null,
    activeStoreCategory: "featured",
    lastWinCoinReward: 0,
    lastWinDoubled: false,
    completedStageForInterstitial: null,
    missionTargets: [],
    lastBonusTimeCoins: 0,
    earnedMovesForStars: null,
    bonusTimeRunning: false,
    lastSpeechAt: 0,
    lastMoveUsedBooster: false,
  };

  const $ = (id) => document.getElementById(id);
  const rand = () => 1 + Math.floor(Math.random() * TYPES);
  const pos = (r, c) =>
    new BABYLON.Vector3((c - (COLS - 1) / 2) * SPACING, 0, ((ROWS - 1) / 2 - r) * SPACING);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const inBounds = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

  let engine = null;
  let scene = null;
  let camera = null;
  let canvas = null;
  let renderLoop = null;
  let toastTimer = null;
  let heartTimer = null;
  let busyWatchdogTimer = null;
  let animationFrame = 0;
  let gameInitialized = false;

  const materials = [];
  let shineSharedMaterial = null;
  const spriteMaterials = {};
  const spriteTextures = {};
  const specialSpriteMaterials = {};
  const specialSpriteTextures = {};
  const specialRingSharedMaterials = {};
  const iceStageTextures = {};
  const iceStageMaterials = {};
  const obstacleMaterials = {};
  const candyTrim = {};
  const activeAnimations = new Set();
  const activeVfxMeshes = new Set();
  const vfxMaterials = {};
  const VFX_MESH_LIMIT = 64;

  let idleHintTimer = null;
  let comboBannerTimer = null;
  let diffBannerTimer = null;
  let shakeTimer = null;
  const speechTimers = { queen: null, dragon: null };

  function playSfx(kind, options) {
    const anubisAudio = window.CMRAnubisAudio;
    if (anubisAudio) {
      if (kind === "match") {
        const cascadeStep = Math.max(1, Number(options?.cascadeStep || 1));
        const pitchRate = Math.min(1.6, 1 + (cascadeStep - 1) * 0.08);
        anubisAudio.playMatch?.(pitchRate);
      } else if (kind === "rocket") anubisAudio.playRocket?.();
      else if (kind === "bomb") anubisAudio.playBomb?.();
      else if (kind === "color") anubisAudio.playColorBall?.();
      else if (kind === "ice" || kind === "obstacle") anubisAudio.playObstacleBreak?.();
      else if (kind === "boss") anubisAudio.playBossLaugh?.();
      else if (kind === "win") (anubisAudio.playVictory || anubisAudio.playVictoryFanfare)?.();
      else if (kind === "lose") (anubisAudio.playLose || anubisAudio.playLossDramatic)?.();
      else if (kind === "tap" || kind === "click") anubisAudio.playClick?.();
      else if (kind === "shuffle") anubisAudio.playShuffle?.();
      else if (kind === "wand" || kind === "paint") anubisAudio.playWand?.();
      else if (kind === "special_create") anubisAudio.playSpecialCreate?.();
    }
    const map = {
      match: "match",
      swap: "swap",
      coin: "coin",
      tap: "click",
      win: "win",
      lose: "lose",
      bomb: "booster",
      rocket: "booster",
      color: "booster",
      ice: "ice",
      boss: "boss",
    };
    window.CMRAudio?.playSfx?.(map[kind] || kind || "click", options);
  }

  function triggerHaptic(pattern) {
    try {
      if (window.CMRAudio?.isSfxEnabled?.() === false) return;
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(pattern);
      }
    } catch (_) {}
  }

  function triggerBoardShake() {
    const wrap = $("boardWrap");
    if (!wrap) return;
    wrap.classList.remove("is-micro-shake");
    void wrap.offsetWidth;
    wrap.classList.add("is-micro-shake");
    clearTimeout(shakeTimer);
    shakeTimer = setTimeout(() => wrap.classList.remove("is-micro-shake"), 165);
  }

  function showComboCallout(text, tier = 2, accent = "#fbbf24") {
    const el = $("comboCalloutBanner");
    if (!el || !text) return;
    el.textContent = text;
    el.dataset.tier = String(tier);
    el.style.setProperty("--callout-accent", accent || "#fbbf24");
    el.classList.remove("hidden", "is-active");
    void el.offsetWidth;
    el.classList.add("is-active");
    clearTimeout(comboBannerTimer);
    comboBannerTimer = setTimeout(() => {
      el.classList.remove("is-active");
      el.classList.add("hidden");
    }, 1050);
  }

  function showStageDifficultyBanner(tagAr, tier) {
    const el = $("stageDiffBanner");
    if (!el || !tagAr) return;
    el.textContent = tagAr;
    el.className = `stage-diff-banner is-tier-${tier || "hard"}`;
    void el.offsetWidth;
    el.classList.add("is-show");
    clearTimeout(diffBannerTimer);
    diffBannerTimer = setTimeout(() => {
      el.classList.remove("is-show");
      el.classList.add("hidden");
    }, 2100);
  }

  function showCharacterSpeech(trigger, force = false) {
    const now = Date.now();
    if (!force && now - state.lastSpeechAt < 8000) return false;
    const line = Systems?.getCharacterSpeechLine?.(trigger);
    if (!line) return false;
    const id = line.who === "dragon" ? "dragonSpeechBubble" : "queenSpeechBubble";
    const el = $(id);
    if (!el) return false;
    state.lastSpeechAt = now;
    el.textContent = line.text;
    el.classList.remove("hidden", "is-visible");
    void el.offsetWidth;
    el.classList.add("is-visible");
    clearTimeout(speechTimers[line.who]);
    speechTimers[line.who] = setTimeout(() => {
      el.classList.remove("is-visible");
      el.classList.add("hidden");
    }, 2200);
    return true;
  }

  function clearHintOverlay() {
    if (idleHintTimer) {
      clearTimeout(idleHintTimer);
      idleHintTimer = null;
    }
    const layer = $("boardHintLayer");
    if (layer) layer.textContent = "";
  }

  function renderSmartHint() {
    const layer = $("boardHintLayer");
    if (!layer || !canInteractWithBoard()) return null;
    if (window.CMRQueenTutorial?.isActive?.()) return null;
    if (!Systems?.findBestSmartHint) return null;

    const hint = Systems.findBestSmartHint(state.grid, ROWS, COLS, isCellLocked);
    if (!hint) return null;

    layer.textContent = "";
    const cellW = 100 / COLS;
    const cellH = 100 / ROWS;
    const dx = (hint.to.c - hint.from.c) * 6;
    const dy = (hint.to.r - hint.from.r) * 6;

    const cells = [
      { cell: hint.from, sx: dx, sy: dy },
      { cell: hint.to, sx: -dx, sy: -dy },
    ];
    for (const item of cells) {
      const node = document.createElement("div");
      node.className = "board-hint-tile";
      node.style.left = `${item.cell.c * cellW}%`;
      node.style.top = `${item.cell.r * cellH}%`;
      node.style.width = `${cellW}%`;
      node.style.height = `${cellH}%`;
      node.style.setProperty("--hint-dx", `${item.sx}px`);
      node.style.setProperty("--hint-dy", `${item.sy}px`);
      layer.appendChild(node);
    }
    return hint;
  }

  function resetIdleHintTimer() {
    clearHintOverlay();
    if (!canInteractWithBoard()) return;
    if (window.CMRQueenTutorial?.isActive?.()) return;
    idleHintTimer = setTimeout(() => {
      idleHintTimer = null;
      renderSmartHint();
    }, 5000);
  }

  function say(message) {
    const el = $("toast");
    if (!el) return;
    el.textContent = String(message || "");
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function syncPhaseAttributes() {
    const shell = $("gameShell");
    const phase = stateMachine.phase;
    const meta = Core.getStageMeta(state.level);
    if (shell) {
      shell.dataset.phase = phase;
      shell.dataset.level = String(state.level);
      shell.dataset.palace = String(meta.palaceNumber);
      shell.dataset.boss = String(meta.isBossStage);
      shell.dataset.obstacles = String(state.iceRemaining);
      shell.dataset.hearts = String(state.lives);
      shell.dataset.moves = String(state.moves);
    }
    if (!document.body.classList.contains("map-open")) {
      const startScreen = $("startScreen");
      const loadingOverlay = $("loadingVideoOverlay");
      const onStart = startScreen && !startScreen.classList.contains("hidden");
      const onLoading = loadingOverlay && !loadingOverlay.classList.contains("hidden");
      if (!onStart && !onLoading) {
        if (state.settingsOpen) document.body.dataset.state = "paused";
        else if (phase === Core.GAME_STATES.WON) document.body.dataset.state = "won";
        else if (phase === Core.GAME_STATES.LOST) document.body.dataset.state = "lost";
        else document.body.dataset.state = "playing";
      }
    }
  }

  function applyHeartRegen() {
    const now = Date.now();
    const interval = 30 * 60 * 1000;
    if (state.lives >= Core.MAX_LIVES) {
      state.lives = Core.MAX_LIVES;
      state.lastHeartAt = now;
      return;
    }
    if (!state.lastHeartAt || state.lastHeartAt > now) {
      state.lastHeartAt = now;
      return;
    }
    const gained = Math.floor((now - state.lastHeartAt) / interval);
    if (gained > 0) {
      state.lives = Math.min(Core.MAX_LIVES, state.lives + gained);
      state.lastHeartAt =
        state.lives >= Core.MAX_LIVES ? now : state.lastHeartAt + gained * interval;
    }
  }

  function startHeartClock() {
    if (heartTimer) clearInterval(heartTimer);
    heartTimer = setInterval(() => {
      const before = state.lives;
      applyHeartRegen();
      if (state.lives !== before) {
        updateHud();
        saveProgress(false);
      }
    }, 60000);
  }

  function isCellLocked(cell) {
    if (!cell) return true;
    if (AnubisPack?.isCellSwapLockedByObstacle && cell.obs) {
      if (AnubisPack.isCellSwapLockedByObstacle(cell)) return true;
    }
    return Boolean(cell.obs || cell.ice > 0);
  }

  function countObstacles() {
    let n = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const it = state.grid[r]?.[c];
        if (it && (it.obs || it.ice > 0)) n++;
      }
    }
    return n;
  }

  // ---- Materials & Textures ----
  function makeMaterial(type) {
    const index = Math.max(1, Math.min(TYPES, Number(type) || 1));
    if (materials[index]) return materials[index];
    const mat = new BABYLON.StandardMaterial("candyMaterial_" + index, scene);
    mat.diffuseColor = palette[index - 1].color.clone();
    mat.emissiveColor = palette[index - 1].color.scale(0.18);
    mat.specularColor = new BABYLON.Color3(0.82, 0.82, 0.82);
    mat.specularPower = 48;
    materials[index] = mat;
    return mat;
  }

  function loadCandyTrim(type) {
    return new Promise((resolve) => {
      const src = candyImages[type];
      if (!src) {
        resolve();
        return;
      }
      const img = new Image();
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const timeout = setTimeout(finish, 4000);
      img.onload = () => {
        try {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const sample = 96;
          const scale = Math.min(1, sample / Math.max(w, h));
          const sw = Math.max(1, Math.round(w * scale));
          const sh = Math.max(1, Math.round(h * scale));
          const cv = document.createElement("canvas");
          cv.width = sw;
          cv.height = sh;
          const ctx = cv.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(img, 0, 0, sw, sh);
            const d = ctx.getImageData(0, 0, sw, sh).data;
            let x0 = sw,
              y0 = sh,
              x1 = -1,
              y1 = -1;
            for (let y = 0; y < sh; y++) {
              for (let x = 0; x < sw; x++) {
                if (d[(y * sw + x) * 4 + 3] > 35) {
                  if (x < x0) x0 = x;
                  if (x > x1) x1 = x;
                  if (y < y0) y0 = y;
                  if (y > y1) y1 = y;
                }
              }
            }
            if (x1 >= x0 && y1 >= y0) {
              x1++;
              y1++;
              candyTrim[type] = {
                u0: x0 / sw,
                u1: x1 / sw,
                v0: 1 - y1 / sh,
                v1: 1 - y0 / sh,
                ratio: (x1 - x0) / (y1 - y0),
              };
            }
          }
        } catch (err) {
          console.warn("[CMR] Candy trim failed:", type, err);
        }
        clearTimeout(timeout);
        finish();
      };
      img.onerror = () => {
        clearTimeout(timeout);
        finish();
      };
      img.src = src;
    });
  }

  function candySpriteMaterial(type) {
    if (spriteMaterials[type]) return spriteMaterials[type];
    const mat = new BABYLON.StandardMaterial("candyArtworkMat_" + type, scene);
    mat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    mat.useAlphaFromDiffuseTexture = true;
    mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
    const source = candyImages[type];
    if (!source) {
      spriteMaterials[type] = mat;
      return mat;
    }
    const texture = new BABYLON.Texture(
      source,
      scene,
      false,
      true,
      BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
      () => {
        texture.hasAlpha = true;
        mat.diffuseTexture = texture;
        mat.markAsDirty(BABYLON.Material.TextureDirtyFlag);
      }
    );
    texture.hasAlpha = true;
    texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
    texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
    mat.diffuseTexture = texture;
    spriteTextures[type] = texture;
    spriteMaterials[type] = mat;
    return mat;
  }

  function specialSpriteMaterial(key, source) {
    if (specialSpriteMaterials[key]) return specialSpriteMaterials[key];
    const mat = new BABYLON.StandardMaterial("specialSpriteMat_" + key, scene);
    mat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    mat.useAlphaFromDiffuseTexture = true;
    mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
    const texture = new BABYLON.Texture(
      source,
      scene,
      false,
      true,
      BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
      () => {
        texture.hasAlpha = true;
        mat.diffuseTexture = texture;
        mat.markAsDirty(BABYLON.Material.TextureDirtyFlag);
      }
    );
    texture.hasAlpha = true;
    texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
    texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
    mat.diffuseTexture = texture;
    specialSpriteTextures[key] = texture;
    specialSpriteMaterials[key] = mat;
    return mat;
  }

  const LOCK_COLOR_HEX = {
    1: "#ef4444",
    2: "#3b82f6",
    3: "#22c55e",
    4: "#eab308",
    5: "#a855f7",
    6: "#f97316",
  };

  function makeObstacleMaterial(type, hp, meta = null) {
    const t = OBSTACLE_DEFS[type] ? type : "single_ice";
    const cdKey = meta?.countdown > 0 ? `_cd${meta.countdown}` : "";
    const colKey = meta?.lockColor ? `_lc${meta.lockColor}` : "";
    const key = t + "_" + hp + cdKey + colKey;
    if (obstacleMaterials[key]) return obstacleMaterials[key];
    const def = OBSTACLE_DEFS[t];
    const mat = new BABYLON.StandardMaterial("obsMat_" + key, scene);
    const dt = new BABYLON.DynamicTexture("obsTex_" + key, { width: 256, height: 256 }, scene, true);
    dt.hasAlpha = true;
    const ctx = dt.getContext();

    // Immediate clean golden-stone fallback before PNG finishes decoding
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = "rgba(45, 28, 86, 0.45)";
    ctx.fillRect(16, 16, 224, 224);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.85)";
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 216, 216);
    dt.update();

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, 256, 256);
      if (t === "color_lock_stone" && meta?.lockColor) {
        ctx.save();
        ctx.strokeStyle = LOCK_COLOR_HEX[meta.lockColor] || "#fbbf24";
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(128, 128, 108, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.drawImage(img, 6, 6, 244, 244);
      if (hp < (def.hp || 1)) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(46, 46);
        ctx.lineTo(118, 126);
        ctx.lineTo(82, 206);
        ctx.stroke();
      }
      if (t === "cursed_hourglass" && meta?.countdown > 0) {
        ctx.fillStyle = meta.countdown <= 2 ? "#dc2626" : "#7c3aed";
        ctx.beginPath();
        ctx.arc(54, 54, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fde047";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 36px Cairo, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(meta.countdown), 54, 56);
      }
      if (hp > 1) {
        ctx.fillStyle = def.boosterOnly ? "#4c1d95" : "#d82b59";
        ctx.beginPath();
        ctx.arc(206, 50, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff3b8";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 34px Cairo, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(hp), 206, 52);
      }
      dt.update();
    };
    img.src = def.imgSrc || `./assets/packs/blockers/${def.img || "1"}.png`;

    mat.diffuseTexture = dt;
    mat.opacityTexture = dt;
    mat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    mat.disableLighting = true;
    mat.alpha = t === "single_ice" || t === "double_ice" ? 0.86 : 1.0;
    mat.useAlphaFromDiffuseTexture = true;
    mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
    mat.backFaceCulling = false;
    obstacleMaterials[key] = mat;
    return mat;
  }

  function syncCandyPaletteForStage(level) {
    if (!AnubisPack?.getCandyPaletteForStage) return false;
    const info = AnubisPack.getCandyPaletteForStage(level);
    if (!info || !info.candies) return false;
    const changed = activeCandyTheme !== info.theme;
    activeCandyTheme = info.theme;
    for (let t = 1; t <= TYPES; t++) {
      candyImages[t] = info.candies[t] || candyImages[t];
    }
    if (changed) {
      for (let t = 1; t <= TYPES; t++) {
        if (spriteMaterials[t]) {
          try { spriteMaterials[t].dispose(false, true); } catch (_) {}
          delete spriteMaterials[t];
        }
        if (spriteTextures[t]) {
          try { spriteTextures[t].dispose(); } catch (_) {}
          delete spriteTextures[t];
        }
        delete candyTrim[t];
      }
      void preloadCandyTextures();
    }
    return changed;
  }

  async function preloadCandyTextures() {
    // Async non-blocking img.decode() warmup for 120Hz/144Hz zero-stutter rendering
    const decodeUrls = [
      ...Object.values(candyImages),
      ...Object.values(specialSpriteSources.striped),
      ...Object.values(specialSpriteSources.wrapped),
      specialSpriteSources.color,
    ];
    decodeUrls.forEach((src) => {
      try {
        const im = new Image();
        im.decoding = "async";
        im.src = src;
        if (typeof im.decode === "function") im.decode().catch(() => {});
      } catch (_) {}
    });
    await Promise.all(Object.keys(candyImages).map(loadCandyTrim));
    await Promise.all(
      Object.keys(candyImages).map(async (type) => {
        candySpriteMaterial(Number(type));
        const texture = spriteTextures[type];
        if (!texture || texture.isReady()) return;
        const started = Date.now();
        while (!texture.isReady() && Date.now() - started < 2400) {
          await wait(35);
        }
      })
    );
  }

  function candyMesh(r, c, type, special, ice = 0, obsOverride = null) {
    const root = new BABYLON.TransformNode("candyRoot_" + r + "_" + c, scene);
    root.position = pos(r, c);
    root.metadata = { r, c, candy: true };
    root.isPickable = false;

    // 3D fallback sphere kept until PNG sprite is ready
    const body = BABYLON.MeshBuilder.CreateSphere(
      "candy3D_" + r + "_" + c,
      { diameter: SPACING * 0.78, segments: 18 },
      scene
    );
    body.parent = root;
    body.position.y = 0.16;
    body.scaling.y = 0.48;
    body.material = makeMaterial(type);
    body.isPickable = true;
    body.metadata = { r, c, candy: true };

    const shine = BABYLON.MeshBuilder.CreateSphere(
      "candyShine_" + r + "_" + c,
      { diameter: SPACING * 0.14, segments: 10 },
      scene
    );
    shine.parent = root;
    shine.position = new BABYLON.Vector3(-0.12, 0.29, -0.11);
    shine.scaling = new BABYLON.Vector3(1, 0.28, 0.62);
    if (!shineSharedMaterial) {
      shineSharedMaterial = new BABYLON.StandardMaterial("candyShineShared", scene);
      shineSharedMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
      shineSharedMaterial.emissiveColor = new BABYLON.Color3(0.22, 0.22, 0.22);
      shineSharedMaterial.alpha = 0.7;
    }
    shine.material = shineSharedMaterial;
    shine.isPickable = false;

    const artworkPath = candyImages[type];
    if (artworkPath && !special) {
      const trim = candyTrim[type];
      const ratio = trim ? trim.ratio : candyImageRatios[type] || 1;
      const maxSide = SPACING * CANDY_FIT;
      const artworkWidth = ratio >= 1 ? maxSide : maxSide * ratio;
      const artworkHeight = ratio >= 1 ? maxSide / ratio : maxSide;
      const planeOpts = { width: artworkWidth, height: artworkHeight };
      if (trim) {
        planeOpts.frontUVs = new BABYLON.Vector4(trim.u0, trim.v0, trim.u1, trim.v1);
      }
      const artwork = BABYLON.MeshBuilder.CreatePlane(
        "candyArtwork_" + r + "_" + c,
        planeOpts,
        scene
      );
      artwork.parent = root;
      artwork.rotation.x = Math.PI / 2;
      artwork.position = new BABYLON.Vector3(0, 0.36, 0);
      artwork.material = candySpriteMaterial(type);
      artwork.isPickable = false;
      artwork.isVisible = false;
      const texture = spriteTextures[type];
      const revealArtwork = () => {
        if (root.isDisposed?.()) return;
        artwork.isVisible = true;
        body.setEnabled(false);
        shine.setEnabled(false);
      };
      const revealWhenReady = () => {
        if (root.isDisposed?.()) return;
        if (texture && texture.isReady()) {
          revealArtwork();
          return;
        }
        if (texture) setTimeout(revealWhenReady, 60);
      };
      revealWhenReady();
    }

    if (special) {
      const ringKind =
        special === "wrapped" ? "wrapped" : special === "color" ? "color" : "striped";
      if (!specialRingSharedMaterials[ringKind]) {
        const ringMat = new BABYLON.StandardMaterial("specialRingShared_" + ringKind, scene);
        ringMat.diffuseColor =
          ringKind === "wrapped"
            ? new BABYLON.Color3(1, 0.72, 0.18)
            : ringKind === "color"
            ? new BABYLON.Color3(0.9, 0.55, 1)
            : new BABYLON.Color3(0.25, 0.9, 1);
        ringMat.emissiveColor = ringMat.diffuseColor.scale(0.75);
        specialRingSharedMaterials[ringKind] = ringMat;
      }
      const ring = BABYLON.MeshBuilder.CreateTorus(
        "specialRing_" + r + "_" + c,
        { diameter: SPACING * 0.84, thickness: 0.048, tessellation: 24 },
        scene
      );
      ring.parent = root;
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.14;
      ring.material = specialRingSharedMaterials[ringKind];
      ring.isPickable = false;

      const specialSpritePath =
        special === "wrapped"
          ? specialSpriteSources.wrapped[type] || specialSpriteSources.wrapped[1]
          : special === "color"
          ? specialSpriteSources.color
          : specialSpriteSources.striped[type] || specialSpriteSources.striped[1];

      if (specialSpritePath) {
        const spriteKey = special + "_" + type;
        const art = BABYLON.MeshBuilder.CreatePlane(
          "specialCandyArtwork_" + r + "_" + c,
          { width: SPACING * 0.9, height: SPACING * 0.9 },
          scene
        );
        art.parent = root;
        art.rotation.x = Math.PI / 2;
        art.position.y = 0.41;
        art.material = specialSpriteMaterial(spriteKey, specialSpritePath);
        art.isPickable = false;
        art.isVisible = false;
        const texture = specialSpriteTextures[spriteKey];
        const revealSpecial = () => {
          if (root.isDisposed?.()) return;
          art.isVisible = true;
          for (const child of root.getChildMeshes()) {
            if (child !== art && child.name !== "iceOverlay" && !child.name.startsWith("iceCube")) {
              child.setEnabled(false);
            }
          }
        };
        const revealSpecialWhenReady = () => {
          if (root.isDisposed?.()) return;
          if (texture && texture.isReady()) {
            revealSpecial();
            return;
          }
          if (texture) setTimeout(revealSpecialWhenReady, 60);
        };
        revealSpecialWhenReady();
      }
    }

    const obs = obsOverride !== null ? obsOverride : state.grid[r]?.[c]?.obs || null;
    if (ice > 0) {
      const obsKey = obs || (ice >= 2 ? "double_ice" : "single_ice");
      const def = OBSTACLE_DEFS[obsKey] || OBSTACLE_DEFS.single_ice;
      const cellData = state.grid[r]?.[c] || null;
      // Standalone solid 3D obstacles replace the candy tile visually so they look crisp & 3D
      if (def.solidStandalone) {
        for (const child of root.getChildMeshes()) {
          child.setEnabled(false);
        }
      }
      const obsMesh = BABYLON.MeshBuilder.CreatePlane(
        "iceOverlay",
        { width: SPACING * 0.92, height: SPACING * 0.92 },
        scene
      );
      obsMesh.parent = root;
      obsMesh.position.y = 0.48;
      obsMesh.rotation.x = Math.PI / 2;
      obsMesh.material = makeObstacleMaterial(obsKey, ice, cellData);
      obsMesh.isPickable = false;
      obsMesh.renderingGroupId = 2;
    }

    return root;
  }

  // ---- Animations (Guaranteed Non-Hanging) ----
  function cancelAllAnimations() {
    for (const job of Array.from(activeAnimations)) {
      activeAnimations.delete(job);
      try {
        job.resolve();
      } catch (_) {}
    }
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
  }

  function runAnimations() {
    animationFrame = 0;
    const now = performance.now();
    try {
      for (const job of Array.from(activeAnimations)) {
        if (!job.mesh || job.mesh.isDisposed?.()) {
          activeAnimations.delete(job);
          job.resolve();
          continue;
        }
        const t = Math.max(0, Math.min(1, (now - job.begin) / job.duration));
        const e = 1 - Math.pow(1 - t, 3);
        BABYLON.Vector3.LerpToRef(job.start, job.target, e, job.mesh.position);
        if (t >= 1) {
          activeAnimations.delete(job);
          job.resolve();
        }
      }
    } catch (err) {
      console.error("[CMR] Animation loop error:", err);
      cancelAllAnimations();
    }
    if (activeAnimations.size) {
      animationFrame = requestAnimationFrame(runAnimations);
    }
  }

  function animate(mesh, target, duration = 165) {
    return new Promise((resolve) => {
      if (!mesh || mesh.isDisposed?.()) {
        resolve();
        return;
      }
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      const job = {
        mesh,
        start: mesh.position.clone(),
        target: target.clone(),
        duration,
        begin: performance.now(),
        resolve: finish,
      };
      activeAnimations.add(job);
      setTimeout(() => {
        if (activeAnimations.delete(job) && mesh && !mesh.isDisposed?.()) {
          mesh.position.copyFrom(target);
        }
        finish();
      }, duration + 450);
      if (!animationFrame) animationFrame = requestAnimationFrame(runAnimations);
    });
  }

  // ---- Scene Setup (Exact 7x8 Orthographic Fit) ----
  function setupScene() {
    if (engine && scene) return;
    if (!window.BABYLON || typeof BABYLON.Engine !== "function") {
      throw new Error("مكتبة Babylon.js لم يتم تحميلها");
    }
    canvas = $("renderCanvas");
    if (!canvas || typeof canvas.addEventListener !== "function") {
      throw new Error("لوحة اللعب renderCanvas غير موجودة");
    }
    const isMobileViewport = window.matchMedia("(max-width: 900px)").matches;
    engine = new BABYLON.Engine(
      canvas,
      true,
      { alpha: true, preserveDrawingBuffer: false, stencil: false, antialias: !isMobileViewport },
      false
    );
    engine.setHardwareScalingLevel(isMobileViewport ? 1.35 : 1);
    engine.enableOfflineSupport = false;

    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
    scene.skipPointerMovePicking = true;
    scene.imageProcessingConfiguration.toneMappingEnabled = false;

    // Exact 7 cols (-3.5..+3.5) × 8 rows (-4.0..+4.0) orthographic alignment
    camera = new BABYLON.ArcRotateCamera(
      "royalCamera",
      -Math.PI / 2,
      0.001,
      14.0,
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    camera.orthoLeft = -(COLS * SPACING) / 2;
    camera.orthoRight = (COLS * SPACING) / 2;
    camera.orthoTop = (ROWS * SPACING) / 2;
    camera.orthoBottom = -(ROWS * SPACING) / 2;
    camera.lowerRadiusLimit = 14.0;
    camera.upperRadiusLimit = 14.0;
    camera.inputs.clear();
    camera.minZ = 0.1;
    camera.maxZ = 60;

    const hemi = new BABYLON.HemisphericLight("softbox", new BABYLON.Vector3(0, 1, -0.3), scene);
    hemi.intensity = 1.05;
    const key = new BABYLON.DirectionalLight("candyKey", new BABYLON.Vector3(-0.35, -1, 0.55), scene);
    key.position = new BABYLON.Vector3(-4, 10, -6);
    key.intensity = 0.95;

    bindInput();

    let lastRenderAt = 0;
    renderLoop = () => {
      if (document.hidden || document.body.classList.contains("map-open")) return;
      const now = performance.now();
      if (now - lastRenderAt < 1000 / 60) return;
      lastRenderAt = now;
      scene.render();
    };
    engine.runRenderLoop(renderLoop);

    window.CMRPauseGameRender = () => {
      if (engine && renderLoop) engine.stopRenderLoop(renderLoop);
    };
    window.CMRResumeGameRender = () => {
      if (engine && renderLoop && !document.hidden) {
        engine.runRenderLoop(renderLoop);
        engine.resize();
      }
    };
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && engine) engine.resize();
    });
    window.addEventListener(
      "resize",
      () => {
        if (engine) engine.resize();
      },
      { passive: true }
    );
    requestAnimationFrame(() => engine.resize());
  }

  // ---- Grid Generation & Obstacles ----
  function randomType(r, c) {
    const createsMatch = (t) =>
      (c > 1 && state.grid[r][c - 1]?.type === t && state.grid[r][c - 2]?.type === t) ||
      (r > 1 && state.grid[r - 1][c]?.type === t && state.grid[r - 2][c]?.type === t);
    let t = rand();
    let tries = 0;
    while (tries < 12 && createsMatch(t)) {
      t = rand();
      tries++;
    }
    if (createsMatch(t)) {
      for (let cand = 1; cand <= TYPES; cand++) {
        if (!createsMatch(cand)) {
          t = cand;
          break;
        }
      }
    }
    return t;
  }

  function disposeGridMeshes() {
    for (const row of state.grid) {
      if (!Array.isArray(row)) continue;
      for (const item of row) {
        if (item?.mesh && !item.mesh.isDisposed?.()) {
          item.mesh.dispose();
        }
      }
    }
  }

  function buildGrid() {
    disposeGridMeshes();
    const cfg = Core.getLevelConfig(state.level);
    const obsMap = new Map();

    let initialMoves = cfg.moves;
    try {
      const testMovesParam = Number(new URLSearchParams(window.location.search).get("testMoves"));
      if (Number.isFinite(testMovesParam) && testMovesParam >= 1 && testMovesParam <= 50) {
        initialMoves = Math.floor(testMovesParam);
      }
    } catch (_) {}

    state.moves = initialMoves;
    state.obstacleGoal = cfg.obstacleCount;
    state.obstaclesCleared = 0;
    state.obstacleGrowthTurns = 0;

    // Place obstacles cleanly (including 2x2 linked Sleeping Sphinx, 6-move Hourglass, Color-Locked Stone)
    const deck = Array.from({ length: cfg.obstacleCount }, (_, i) => cfg.obstacles[i % cfg.obstacles.length]);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const sphinxGroups = new Map();
    let sphinxCounter = 0;

    for (let n = 0; n < deck.length; n++) {
      const obsId = deck[n];
      if (obsId === "sleeping_sphinx" && n <= deck.length - 4) {
        // Place a linked 2x2 Sleeping Sphinx cluster
        let placed = false;
        for (let tries = 0; tries < 40 && !placed; tries++) {
          const sr = Math.floor(Math.random() * (ROWS - 1));
          const sc = Math.floor(Math.random() * (COLS - 1));
          const idxs = [
            sr * COLS + sc,
            sr * COLS + sc + 1,
            (sr + 1) * COLS + sc,
            (sr + 1) * COLS + sc + 1,
          ];
          if (idxs.every((id) => !obsMap.has(id))) {
            sphinxCounter++;
            const gid = "sphinx_" + sphinxCounter;
            idxs.forEach((id) => {
              obsMap.set(id, "sleeping_sphinx");
              sphinxGroups.set(id, gid);
            });
            n += 3;
            placed = true;
          }
        }
        if (placed) continue;
      }
      let idx;
      let tries = 0;
      do {
        idx = Math.floor(Math.random() * ROWS * COLS);
        tries++;
      } while (obsMap.has(idx) && tries < 100);
      if (!obsMap.has(idx)) obsMap.set(idx, obsId);
    }

    state.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    const targetCounts = new Map();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const type = randomType(r, c);
        const flatIdx = r * COLS + c;
        const obs = obsMap.get(flatIdx) || null;
        const def = obs ? OBSTACLE_DEFS[obs] || OBSTACLE_DEFS.single_ice : null;
        const ice = obs ? (cfg.introSingleLayer ? def.introHp || 1 : def.hp || 1) : 0;
        if (obs) {
          targetCounts.set(obs, (targetCounts.get(obs) || 0) + 1);
        }
        const cellObj = {
          type,
          special: null,
          ice,
          obs,
          originObs: obs,
          sphinxGroupId: sphinxGroups.get(flatIdx) || null,
          countdown: obs === "cursed_hourglass" ? 6 : 0,
          lockColor: obs === "color_lock_stone" ? 1 + ((r + c) % TYPES) : 0,
          mesh: null,
        };
        state.grid[r][c] = cellObj;
        cellObj.mesh = candyMesh(r, c, type, null, ice, obs);
      }
    }
    state.missionTargets = Array.from(targetCounts.entries())
      .slice(0, 3)
      .map(([id, required]) => {
        const def = OBSTACLE_DEFS[id] || OBSTACLE_DEFS.single_ice;
        return {
          id,
          imgSrc: def.imgSrc || `./assets/packs/blockers/${def.img || "1"}.png`,
          nameAr: def.nameAr || "عائق",
          required,
          broken: 0,
        };
      });
    state.iceRemaining = countObstacles();
    state.obstacleGoal = state.iceRemaining;

    if (!hasPossibleMove()) {
      ensurePlayableTypesInPlace();
    }
  }

  function ensurePlayableTypesInPlace() {
    const items = state.grid.flat().filter(Boolean);
    for (let attempt = 0; attempt < 24; attempt++) {
      const vals = items.map((it) => it.type);
      for (let i = vals.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [vals[i], vals[j]] = [vals[j], vals[i]];
      }
      for (let i = 0; i < items.length; i++) items[i].type = vals[i];
      if (findMatches().size === 0 && hasPossibleMove()) {
        rebuildGridMeshes();
        return true;
      }
    }
    return false;
  }

  function rebuildGridMeshes() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const it = state.grid[r]?.[c];
        if (!it) continue;
        if (it.mesh && !it.mesh.isDisposed?.()) it.mesh.dispose();
        it.mesh = candyMesh(r, c, it.type, it.special || null, it.ice || 0, it.obs || null);
      }
    }
  }

  function pulseMissionSlot(slotIdx) {
    const el = $("missionSlot" + slotIdx);
    if (!el) return;
    el.classList.remove("is-pulse");
    void el.offsetWidth;
    el.classList.add("is-pulse");
  }

  function recordMissionBreak(originObsId, currentObsId) {
    if (!Array.isArray(state.missionTargets) || !state.missionTargets.length) return;
    let idx = state.missionTargets.findIndex(
      (t) => (t.id === originObsId || t.id === currentObsId) && t.broken < t.required
    );
    if (idx < 0) {
      idx = state.missionTargets.findIndex((t) => t.broken < t.required);
    }
    if (idx >= 0) {
      state.missionTargets[idx].broken = Math.min(
        state.missionTargets[idx].required,
        state.missionTargets[idx].broken + 1
      );
      pulseMissionSlot(idx);
    }
  }

  function damageIceAt(r, c, score = 25, source = "booster", hitColor = 0, _fromSphinxLink = false) {
    const item = state.grid[r]?.[c];
    if (!item || (item.ice <= 0 && !item.obs)) return false;
    const obs = item.obs || (item.ice > 1 ? "double_ice" : "single_ice");
    const originObs = item.originObs || obs;
    const def = OBSTACLE_DEFS[obs] || OBSTACLE_DEFS.single_ice;
    if (def.boosterOnly && source !== "booster") return false;
    if (source === "adj" && !def.adj) return false;
    if (source === "self" && !def.self) return false;

    // Color-Locked Stone: breaks only from matching color or explosion/booster
    if (obs === "color_lock_stone" && source !== "booster") {
      if (AnubisPack?.canBreakColorLockStone && !AnubisPack.canBreakColorLockStone(item, hitColor, false)) {
        return false;
      }
    }

    // 2x2 Linked Sleeping Sphinx: hitting any cell damages the linked 2x2 group once
    if (obs === "sleeping_sphinx" && item.sphinxGroupId && !_fromSphinxLink) {
      const groupCells = AnubisPack?.getSleepingSphinxGroupCells
        ? AnubisPack.getSleepingSphinxGroupCells(state.grid, ROWS, COLS, item.sphinxGroupId)
        : [{ r, c }];
      let anyHit = false;
      for (const gc of groupCells) {
        if (damageIceAt(gc.r, gc.c, score, source, hitColor, true)) anyHit = true;
      }
      return anyHit;
    }

    const impactPosition = item.mesh?.position?.clone();
    item.ice = Math.max(0, (Number(item.ice) || def.hp || 1) - 1);
    if (obs === "double_ice" && item.ice === 1) item.obs = "single_ice";

    if (item.ice === 0) {
      state.obstaclesCleared = Math.min(state.obstacleGoal, state.obstaclesCleared + 1);
      item.obs = null;
      item.originObs = null;
      item.sphinxGroupId = null;
      item.countdown = 0;
      item.lockColor = 0;
      recordMissionBreak(originObs, obs);

      if (obs === "vault" || obs === "pyramid_safe") {
        state.coins += 75;
        state.score += 125;
        say(obs === "pyramid_safe" ? "فتحت خزنة الهرم! +75 عملة" : "فتحت الخزنة الملكية! +75 عملة");
      } else if (obs === "golden_cage" || obs === "scarab_gem_box") {
        state.coins += 50;
        state.score += 100;
        say(obs === "scarab_gem_box" ? "فتحت صندوق الجعران! +50 عملة" : "فتحت القفص الذهبي! +50 عملة");
      } else if (obs === "surprise_coffin") {
        const drop = AnubisPack?.pickSurpriseCoffinDrop
          ? AnubisPack.pickSurpriseCoffinDrop()
          : { kind: "coins", coins: 50 };
        if (drop.kind === "rocket") {
          item.special = "striped";
          say("🎁 تابوت المفاجآت منحك صاروخ حلوى!");
        } else if (drop.kind === "bomb") {
          item.special = "wrapped";
          say("🎁 تابوت المفاجآت منحك قنبلة حلوى!");
        } else {
          state.coins += drop.coins || 50;
          say("🎁 تابوت المفاجآت منحك +50 عملة ذهبية!");
        }
      } else if (def.lampBlast) {
        rocketSweepAt({ r, c });
        triggerBoardShake();
        triggerHaptic(30);
        playSfx("rocket");
        say("المصباح السحري أطلق شعاع الصف! ✨");
        for (let col = 0; col < COLS; col++) {
          if (col === c) continue;
          const nb = state.grid[r]?.[col];
          if (!nb) continue;
          if (nb.ice > 0 || nb.obs) {
            damageIceAt(r, col, 30, "booster");
          } else {
            if (nb.mesh && !nb.mesh.isDisposed?.()) {
              burstAt(nb.mesh.position, nb.type);
              nb.mesh.dispose();
            }
            state.grid[r][col] = null;
            state.score += 65;
          }
        }
      } else if (def.reward) {
        const sp = ["striped", "wrapped", "color"];
        item.special = sp[Math.floor(Math.random() * sp.length)];
      }
      if (obs === "whirlpool") {
        const neighbours = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]
          .map(([dr, dc]) => [r + dr, c + dc])
          .filter(
            ([nr, nc]) =>
              inBounds(nr, nc) &&
              state.grid[nr]?.[nc] &&
              !state.grid[nr][nc].obs &&
              !(state.grid[nr][nc].ice > 0)
          );
        if (neighbours.length) {
          const [nr, nc] = neighbours[Math.floor(Math.random() * neighbours.length)];
          const victim = state.grid[nr][nc];
          if (victim?.mesh && !victim.mesh.isDisposed?.()) {
            burstAt(victim.mesh.position, victim.type);
            victim.mesh.dispose();
          }
          state.grid[nr][nc] = null;
          state.score += 80;
        }
      }
    }

    state.iceRemaining = countObstacles();
    if (item.mesh && !item.mesh.isDisposed?.()) item.mesh.dispose();
    item.mesh = candyMesh(r, c, item.type, item.special, item.ice, item.obs);
    state.score += score;
    if (impactPosition) {
      iceImpactAt(impactPosition, item.ice);
      playSfx("ice");
    }
    if (state.iceRemaining === 1 && state.obstacleGoal > 1) {
      showCharacterSpeech("one_left");
    }
    const meta = Core.getStageMeta(state.level);
    if (item.ice === 0) {
      state.turnBrokeObstacle = true;
      chargeHeroes("special", 1);
      if (meta.isBossStage) {
        triggerHaptic([20, 40, 20]);
        damageBossFromBoard("obstacle", { r, c }, 1);
        showCharacterSpeech("boss_attack");
      }
    }
    return true;
  }

  function spreadChocolateIfNeeded() {
    // NEVER spread or hop obstacles once the objective is already completed or terminal
    if (stateMachine.isTerminal() || countObstacles() === 0) return;

    // 1. Tick 6-move Cursed Hourglasses
    if (AnubisPack?.tickCursedHourglasses) {
      const hgRes = AnubisPack.tickCursedHourglasses(state.grid, ROWS, COLS);
      if (hgRes.ticked.length > 0) {
        for (const h of hgRes.ticked) {
          const cell = state.grid[h.r]?.[h.c];
          if (cell && cell.mesh && !cell.mesh.isDisposed?.()) {
            cell.mesh.dispose();
            cell.mesh = candyMesh(h.r, h.c, cell.type, cell.special, cell.ice, cell.obs);
          }
        }
      }
      if (hgRes.exploded.length > 0) {
        triggerBoardShake();
        triggerHaptic([30, 30, 30]);
        say("⏳ انفجرت الساعة الرملية الملعونة!");
        for (const ex of hgRes.exploded) {
          const cell = state.grid[ex.r]?.[ex.c];
          if (cell) {
            cell.countdown = 6;
            if (cell.mesh && !cell.mesh.isDisposed?.()) cell.mesh.dispose();
            cell.mesh = candyMesh(ex.r, ex.c, cell.type, cell.special, cell.ice, cell.obs);
          }
        }
      }
    }

    // 2. Hop Jumping Bastet statues to adjacent free tile between turns
    if (AnubisPack?.pickJumpingBastetDestination) {
      const bastets = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (state.grid[r]?.[c]?.obs === "jumping_bastet") bastets.push({ r, c });
        }
      }
      for (const b of bastets) {
        const dest = AnubisPack.pickJumpingBastetDestination(state.grid, ROWS, COLS, b.r, b.c);
        if (!dest) continue;
        const srcCell = state.grid[b.r][b.c];
        const dstCell = state.grid[dest.r][dest.c];
        if (!srcCell || !dstCell) continue;
        dstCell.obs = srcCell.obs;
        dstCell.originObs = srcCell.originObs;
        dstCell.ice = srcCell.ice;
        srcCell.obs = null;
        srcCell.originObs = null;
        srcCell.ice = 0;
        if (srcCell.mesh && !srcCell.mesh.isDisposed?.()) srcCell.mesh.dispose();
        if (dstCell.mesh && !dstCell.mesh.isDisposed?.()) dstCell.mesh.dispose();
        srcCell.mesh = candyMesh(b.r, b.c, srcCell.type, srcCell.special, 0, null);
        dstCell.mesh = candyMesh(dest.r, dest.c, dstCell.type, dstCell.special, dstCell.ice, dstCell.obs);
      }
    }

    // 3. Spread Quicksand / Chocolate Fountain / Roots if none was broken this turn
    if (state.turnBrokeObstacle || countObstacles() >= 24) return;
    state.obstacleGrowthTurns = (state.obstacleGrowthTurns || 0) + 1;
    if (state.obstacleGrowthTurns % 2 !== 0) return;

    const cands = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const it = state.grid[r]?.[c];
        if (it && (it.obs === "roots" || it.obs === "quicksand" || it.obs === "chocolate_fountain")) {
          const spreadType = it.obs === "chocolate_fountain" ? "caramel_jar" : it.obs;
          for (const [dr, dc] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]) {
            const nr = r + dr,
              nc = c + dc,
              nb = state.grid[nr]?.[nc];
            if (inBounds(nr, nc) && nb && !nb.obs && !nb.ice) {
              cands.push({ item: nb, r: nr, c: nc, spreadType });
            }
          }
        }
      }
    }
    if (!cands.length) return;
    const pick = cands[Math.floor(Math.random() * cands.length)];
    pick.item.obs = pick.spreadType;
    pick.item.originObs = pick.spreadType;
    pick.item.ice = 1;
    state.obstacleGoal++;
    if (pick.item.mesh && !pick.item.mesh.isDisposed?.()) pick.item.mesh.dispose();
    pick.item.mesh = candyMesh(pick.r, pick.c, pick.item.type, pick.item.special, 1, pick.spreadType);
    state.iceRemaining = countObstacles();
  }

  // ---- Input Mapping (Exact Orthographic Cell Picking) ----
  function cellScreenPos(r, c) {
    const rect = canvas.getBoundingClientRect();
    const cellW = rect.width / COLS;
    const cellH = rect.height / ROWS;
    return {
      x: rect.left + (c + 0.5) * cellW,
      y: rect.top + (r + 0.5) * cellH,
    };
  }

  function pickCellAtClient(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }
    const c = Math.floor(((clientX - rect.left) / rect.width) * COLS);
    const r = Math.floor(((clientY - rect.top) / rect.height) * ROWS);
    return inBounds(r, c) ? { r, c } : null;
  }

  function chooseNeighbour(cell, dx, dy) {
    if (Math.abs(dx) >= Math.abs(dy)) {
      const nc = cell.c + (dx > 0 ? 1 : -1);
      return inBounds(cell.r, nc) ? { r: cell.r, c: nc } : null;
    }
    const nr = cell.r + (dy > 0 ? 1 : -1);
    return inBounds(nr, cell.c) ? { r: nr, c: cell.c } : null;
  }

  function canInteractWithBoard() {
    if (state.bonusTimeRunning) return false;
    if (window.CMRQueenTutorial?.isBlockingInput?.()) return false;
    return state.levelReady && !state.settingsOpen && stateMachine.canAcceptInput();
  }

  function bindInput() {
    let gesture = null;
    const reset = () => {
      gesture = null;
    };

    canvas.addEventListener(
      "pointerdown",
      (event) => {
        if (!canInteractWithBoard()) return;
        clearHintOverlay();
        event.preventDefault();
        const startCell = pickCellAtClient(event.clientX, event.clientY);
        if (!startCell) return;
        if (!state.booster && window.CMRQueenTutorial && !window.CMRQueenTutorial.isCellAllowed(startCell.r, startCell.c)) {
          return;
        }
        gesture = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startCell,
          swiped: false,
        };
        if (canvas.setPointerCapture) {
          try {
            canvas.setPointerCapture(event.pointerId);
          } catch (_) {}
        }
      },
      { passive: false }
    );

    canvas.addEventListener(
      "pointermove",
      (event) => {
        if (!gesture || gesture.swiped || event.pointerId !== gesture.pointerId) return;
        event.preventDefault();
        if (!canInteractWithBoard()) {
          reset();
          return;
        }
        const dx = event.clientX - gesture.startX;
        const dy = event.clientY - gesture.startY;
        if (Math.hypot(dx, dy) >= 14) {
          gesture.swiped = true;
          const next = chooseNeighbour(gesture.startCell, dx, dy);
          const start = gesture.startCell;
          gesture = null;
          if (next) {
            clearSelection();
            void swap(start, next);
          }
        }
      },
      { passive: false }
    );

    canvas.addEventListener(
      "pointerup",
      (event) => {
        if (!gesture || event.pointerId !== gesture.pointerId) return;
        event.preventDefault();
        const g = gesture;
        gesture = null;
        if (!canInteractWithBoard()) return;
        if (!g.swiped) tapCell(g.startCell);
      },
      { passive: false }
    );

    canvas.addEventListener("pointercancel", reset, { passive: true });
    canvas.addEventListener("lostpointercapture", reset, { passive: true });
    window.addEventListener("blur", reset);
  }

  function select(cell) {
    clearSelection();
    state.selected = cell;
    const item = state.grid[cell.r]?.[cell.c];
    if (item?.mesh && !item.mesh.isDisposed?.()) item.mesh.scaling.setAll(1.1);
    playSfx("tap");
  }

  function clearSelection() {
    if (state.selected) {
      const it = state.grid[state.selected.r]?.[state.selected.c];
      if (it?.mesh && !it.mesh.isDisposed?.()) it.mesh.scaling.setAll(1);
    }
    state.selected = null;
  }

  function tapCell(cell) {
    if (!canInteractWithBoard()) return;
    clearHintOverlay();
    if (state.booster) {
      void useSelectedBooster(cell);
      return;
    }
    if (window.CMRQueenTutorial && !window.CMRQueenTutorial.isCellAllowed(cell.r, cell.c)) {
      return;
    }
    if (state.selected) {
      const previous = state.selected;
      if (previous.r === cell.r && previous.c === cell.c) {
        clearSelection();
        resetIdleHintTimer();
        return;
      }
      if (Math.abs(previous.r - cell.r) + Math.abs(previous.c - cell.c) === 1) {
        clearSelection();
        void swap(previous, cell);
        return;
      }
    }
    select(cell);
  }

  // ---- Core Match & Resolution Pipeline ----
  function findMatches() {
    return Core.findMatchesInGrid(state.grid, ROWS, COLS);
  }

  function findSpecialCandidate(matches) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!matches.has(r + "," + c)) continue;
        const item = state.grid[r][c];
        if (!item) continue;
        let left = 0,
          right = 0,
          up = 0,
          down = 0;
        for (let x = c - 1; x >= 0 && state.grid[r][x] && !state.grid[r][x].special && state.grid[r][x].type === item.type; x--) left++;
        for (let x = c + 1; x < COLS && state.grid[r][x] && !state.grid[r][x].special && state.grid[r][x].type === item.type; x++) right++;
        for (let y = r - 1; y >= 0 && state.grid[y][c] && !state.grid[y][c].special && state.grid[y][c].type === item.type; y--) up++;
        for (let y = r + 1; y < ROWS && state.grid[y][c] && !state.grid[y][c].special && state.grid[y][c].type === item.type; y++) down++;
        if (left + right + 1 >= 3 && up + down + 1 >= 3) {
          return { length: Math.max(left + right + 1, up + down + 1) + 2, type: "wrapped", cell: { r, c } };
        }
      }
    }

    let best = null;
    const consider = (cells, type) => {
      if (cells.length < 4) return;
      if (
        !best ||
        cells.length > best.length ||
        (cells.length === best.length && type === "color" && best.type !== "color")
      ) {
        best = { length: cells.length, type, cell: cells[Math.floor(cells.length / 2)] };
      }
    };

    for (let r = 0; r < ROWS; r++) {
      let c = 0;
      while (c < COLS) {
        const item = state.grid[r][c];
        if (!item || !matches.has(r + "," + c)) {
          c++;
          continue;
        }
        const type = item.type;
        let end = c + 1;
        while (end < COLS && matches.has(r + "," + end) && state.grid[r][end]?.type === type) end++;
        const cells = [];
        for (let x = c; x < end; x++) cells.push({ r, c: x });
        consider(cells, cells.length >= 5 ? "color" : "striped");
        c = end;
      }
    }

    for (let c = 0; c < COLS; c++) {
      let r = 0;
      while (r < ROWS) {
        const item = state.grid[r][c];
        if (!item || !matches.has(r + "," + c)) {
          r++;
          continue;
        }
        const type = item.type;
        let end = r + 1;
        while (end < ROWS && matches.has(end + "," + c) && state.grid[end][c]?.type === type) end++;
        const cells = [];
        for (let y = r; y < end; y++) cells.push({ r: y, c });
        consider(cells, cells.length >= 5 ? "color" : "striped");
        r = end;
      }
    }

    return best;
  }

  function hasHoles() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!state.grid[r][c]) return true;
      }
    }
    return false;
  }

  async function dropAndRefill() {
    const falling = [];
    const pityBias = pityTracker ? pityTracker.getSpawnBias(state.level) : 0;
    for (let c = 0; c < COLS; c++) {
      let write = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        const it = state.grid[r][c];
        if (it) {
          if (write !== r) {
            state.grid[write][c] = it;
            state.grid[r][c] = null;
            if (it.mesh) {
              it.mesh.metadata = { r: write, c, candy: true };
              falling.push(animate(it.mesh, pos(write, c), 155));
            }
          }
          write--;
        }
      }
      for (let r = write; r >= 0; r--) {
        const type = Systems?.pickBiasedCandyType
          ? Systems.pickBiasedCandyType(state.grid, r, c, ROWS, COLS, TYPES, pityBias)
          : rand();
        const mesh = candyMesh(r, c, type, null, 0, null);
        const target = pos(r, c);
        const rowsAbove = write - r + 1;
        mesh.position = new BABYLON.Vector3(target.x, 0.16, target.z + SPACING * (rowsAbove + 0.6));
        state.grid[r][c] = { type, special: null, ice: 0, obs: null, originObs: null, mesh };
        mesh.metadata = { r, c, candy: true };
        falling.push(animate(mesh, target, Math.min(260, 150 + rowsAbove * 22)));
      }
    }
    await Promise.all(falling);
    await wait(55);
  }

  async function activateSpecial(a, b) {
    try {
      const A = state.grid[a.r]?.[a.c];
      const B = state.grid[b.r]?.[b.c];
      const plan = Systems?.computeSuperComboPlan
        ? Systems.computeSuperComboPlan(state.grid, ROWS, COLS, a, b)
        : null;

      const kind = A?.special || B?.special;
      if (kind) {
        playSfx(kind === "wrapped" ? "bomb" : kind === "striped" ? "rocket" : "color");
      }
      if (A?.special === "striped" || B?.special === "striped") {
        window.CMREventBus?.emit?.("rocket:used", { source: "special_swap", cell: b });
      }

      if (plan) {
        if (plan.hapticMs) triggerHaptic(plan.hapticMs);
        if (plan.shake) triggerBoardShake();
        chargeHeroes("special", plan.isSuperCombo ? 2 : 1);
        window.CMRHeroBossVFX?.onHeroReaction?.("special");
        if (Core.getStageMeta(state.level).isBossStage) {
          const bossSrc = plan.isSuperCombo
            ? "super_combo"
            : kind === "color"
            ? "color"
            : kind === "wrapped"
            ? "bomb"
            : "rocket";
          damageBossFromBoard(bossSrc, b, plan.isSuperCombo ? 1.5 : 1);
        }
        if (plan.isSuperCombo && plan.bannerAr) {
          showComboCallout(plan.bannerAr, 5, "#fbbf24");
          showCharacterSpeech("big_combo");
        }

        // Special VFX for Super Combos
        if (plan.comboType === "rocket_bomb") {
          const ctr = plan.center || b;
          wrappedDetonationAt(ctr, A?.type || 1);
          for (let offset = -1; offset <= 1; offset++) {
            const rr = Math.max(0, Math.min(ROWS - 1, ctr.r + offset));
            const cc = Math.max(0, Math.min(COLS - 1, ctr.c + offset));
            rocketSweepAt({ r: rr, c: cc });
          }
        } else if (plan.comboType === "rocket_rocket") {
          rocketSweepAt(a);
          rocketSweepAt(b);
        } else if (plan.comboType === "bomb_bomb") {
          wrappedDetonationAt(a, A?.type || 1);
          wrappedDetonationAt(b, B?.type || 1);
        } else if (plan.comboType === "color_color") {
          // Color Ball + Color Ball -> Crackling rainbow-cyan lightning across entire board sequentially
          playSfx("color");
          triggerBoardShake();
          triggerHaptic([30, 35, 45]);
          const allCells = [];
          for (let rr = 0; rr < ROWS; rr++) {
            for (let cc = 0; cc < COLS; cc++) allCells.push({ r: rr, c: cc });
          }
          window.CMRHeroBossVFX?.fireBoardLightningArc?.(b, allCells);
          for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
              const it = state.grid[row]?.[col];
              if (!it) continue;
              if (it.ice > 0 || it.obs) {
                damageIceAt(row, col, 40, "booster");
              } else {
                if (it.mesh && !it.mesh.isDisposed?.()) {
                  burstAt(it.mesh.position, it.type);
                  it.mesh.dispose();
                }
                state.grid[row][col] = null;
                state.score += 95;
              }
            }
            updateHud();
            await wait(45);
          }
          return;
        } else if (plan.comboType === "color_rocket" || plan.comboType === "color_bomb") {
          colorChainAt(A?.special === "color" ? a : b, plan.targetColor);
          for (const anc of [a, b]) {
            const item = state.grid[anc.r]?.[anc.c];
            if (item) {
              if (item.mesh && !item.mesh.isDisposed?.()) {
                burstAt(item.mesh.position, item.type);
                item.mesh.dispose();
              }
              state.grid[anc.r][anc.c] = null;
              state.score += 100;
            }
          }
          const targets = (plan.chainTargets || []).slice(0, 16);
          for (const t of targets) {
            const cellItem = state.grid[t.r]?.[t.c];
            if (!cellItem || cellItem.obs || cellItem.ice > 0) continue;
            cellItem.special = plan.convertTo;
            if (cellItem.mesh && !cellItem.mesh.isDisposed?.()) cellItem.mesh.dispose();
            cellItem.mesh = candyMesh(t.r, t.c, cellItem.type, plan.convertTo, 0, null);
          }
          await wait(110);
          for (const t of targets) {
            if (plan.convertTo === "striped") {
              rocketSweepAt(t);
              playSfx("rocket");
              window.CMREventBus?.emit?.("rocket:used", { source: "color_rocket_chain", cell: t });
            } else {
              wrappedDetonationAt(t, plan.targetColor);
              playSfx("bomb");
            }
            triggerHaptic(12);
            const blastCells = new Set();
            if (plan.convertTo === "striped") {
              if (AnubisPack?.traceRocketWithMirrors) {
                for (const key of AnubisPack.traceRocketWithMirrors(state.grid, ROWS, COLS, t, "horizontal")) blastCells.add(key);
                for (const key of AnubisPack.traceRocketWithMirrors(state.grid, ROWS, COLS, t, "vertical")) blastCells.add(key);
              } else {
                for (let col = 0; col < COLS; col++) blastCells.add(t.r + "," + col);
                for (let row = 0; row < ROWS; row++) blastCells.add(row + "," + t.c);
              }
            } else {
              for (let rr = t.r - 1; rr <= t.r + 1; rr++) {
                for (let cc = t.c - 1; cc <= t.c + 1; cc++) {
                  if (inBounds(rr, cc)) blastCells.add(rr + "," + cc);
                }
              }
            }
            for (const key of blastCells) {
              const [rr, cc] = key.split(",").map(Number);
              const it = state.grid[rr]?.[cc];
              if (!it) continue;
              if (it.ice > 0 || it.obs) {
                damageIceAt(rr, cc, 30, "booster");
              } else {
                if (it.mesh && !it.mesh.isDisposed?.()) {
                  burstAt(it.mesh.position, it.type);
                  it.mesh.dispose();
                }
                state.grid[rr][cc] = null;
                state.score += 75;
              }
            }
            updateHud();
            await wait(plan.chainDelayMs || 78);
          }
          return;
        } else {
          if (A?.special === "wrapped") wrappedDetonationAt(a, A.type);
          else if (A?.special === "striped") rocketSweepAt(a);
          else if (A?.special === "color") colorChainAt(a, B?.type || null);
          if (B?.special === "wrapped") wrappedDetonationAt(b, B.type);
          else if (B?.special === "striped") rocketSweepAt(b);
          else if (B?.special === "color") colorChainAt(b, A?.type || null);
        }

        for (const key of plan.cells) {
          const [r, c] = key.split(",").map(Number);
          const it = state.grid[r]?.[c];
          if (!it) continue;
          if (it.ice > 0 || it.obs) {
            damageIceAt(r, c, 30, "booster");
          } else {
            if (it.mesh && !it.mesh.isDisposed?.()) {
              burstAt(it.mesh.position, it.type);
              it.mesh.dispose();
            }
            state.grid[r][c] = null;
            state.score += plan.isSuperCombo ? 85 : 60;
          }
        }
        return;
      }

      // Safe fallback if Systems is unavailable
      const cells = new Set([a.r + "," + a.c, b.r + "," + b.c]);
      for (const key of cells) {
        const [r, c] = key.split(",").map(Number);
        const it = state.grid[r]?.[c];
        if (!it) continue;
        if (it.ice > 0 || it.obs) damageIceAt(r, c, 25, "booster");
        else {
          if (it.mesh && !it.mesh.isDisposed?.()) {
            burstAt(it.mesh.position, it.type);
            it.mesh.dispose();
          }
          state.grid[r][c] = null;
          state.score += 60;
        }
      }
    } finally {
      updateHud();
      await wait(120);
    }
  }

  function isObjectiveCompletedNow() {
    state.iceRemaining = countObstacles();
    const bossDefeated = Boolean(state.bossBattleState?.getState?.().defeated);
    return state.levelReady && (bossDefeated || (state.obstacleGoal > 0 && state.iceRemaining === 0));
  }

  async function settle(actionToken) {
    let chain = 0;
    while (chain < 8) {
      // Abort cleanly if stage changed, exited, or restarted mid-cascade
      if (stateMachine.getToken() !== actionToken) return;

      // Immediately stop cascades the instant all stage obstacles are cleared!
      if (isObjectiveCompletedNow()) {
        break;
      }

      if (hasHoles()) {
        await dropAndRefill();
        if (stateMachine.getToken() !== actionToken) return;
      }

      const matches = findMatches();
      if (matches.size === 0) break;

      chain++;
      const pitchRate = Systems?.computeComboPitchRate ? Systems.computeComboPitchRate(chain) : 1;
      playSfx("match", { playbackRate: pitchRate, cascadeStep: chain });
      // 10-Second English Streak Voice Announcer (3rd+ consecutive match within 10s -> SWEET! .. LEGENDARY!)
      window.CMRAnubisAudio?.recordMatchForStreak?.(Date.now());

      if (chain >= 2) {
        const callout = Systems?.getComboCallout?.(chain);
        if (callout) showComboCallout(callout.text, callout.tier, callout.accent);
        if (chain >= 3) showCharacterSpeech("big_combo");
      }

      const matchedSpecials = [];
      for (const key of matches) {
        const [r, c] = key.split(",").map(Number);
        const item = state.grid[r]?.[c];
        if (item?.special) matchedSpecials.push({ r, c, item });
      }
      for (const { r, c, item } of matchedSpecials) {
        if (item.special === "wrapped") {
          for (let y = r - 1; y <= r + 1; y++) {
            for (let x = c - 1; x <= c + 1; x++) if (inBounds(y, x)) matches.add(y + "," + x);
          }
          playSfx("bomb");
          triggerHaptic(30);
          triggerBoardShake();
          wrappedDetonationAt({ r, c }, item.type);
          if (Core.getStageMeta(state.level).isBossStage) damageBossFromBoard("bomb", { r, c }, 1);
        } else if (item.special === "striped") {
          if (AnubisPack?.traceRocketWithMirrors) {
            for (const mk of AnubisPack.traceRocketWithMirrors(state.grid, ROWS, COLS, { r, c }, "horizontal")) {
              matches.add(mk);
            }
            for (const mk of AnubisPack.traceRocketWithMirrors(state.grid, ROWS, COLS, { r, c }, "vertical")) {
              matches.add(mk);
            }
          } else {
            for (let x = 0; x < COLS; x++) matches.add(r + "," + x);
            for (let y = 0; y < ROWS; y++) matches.add(y + "," + c);
          }
          playSfx("rocket");
          triggerHaptic(30);
          triggerBoardShake();
          window.CMREventBus?.emit?.("rocket:used", { source: "cascade", cell: { r, c } });
          rocketSweepAt({ r, c });
          if (Core.getStageMeta(state.level).isBossStage) damageBossFromBoard("rocket", { r, c }, 1);
        } else if (item.special === "color") {
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) if (state.grid[y][x]?.type === item.type) matches.add(y + "," + x);
          }
          playSfx("color");
          triggerHaptic(12);
          colorChainAt({ r, c }, item.type);
          if (Core.getStageMeta(state.level).isBossStage) damageBossFromBoard("color", { r, c }, 1);
        }
      }

      const remove = Array.from(matches).map((s) => s.split(",").map(Number));
      const obstacleHitCells = new Map();
      const matchedFromSpecialExplosion = matchedSpecials.length > 0;
      for (const key of matches) {
        const [mr, mc] = key.split(",").map(Number);
        const current = state.grid[mr]?.[mc];
        const hitCol = current?.type || 0;
        if (current && (current.obs || current.ice > 0)) {
          obstacleHitCells.set(mr + "," + mc, {
            source: matchedFromSpecialExplosion ? "booster" : "self",
            hitColor: hitCol,
          });
        }
        for (const [dr, dc] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const ir = mr + dr,
            ic = mc + dc,
            near = state.grid[ir]?.[ic];
          if (inBounds(ir, ic) && near && (near.obs || near.ice > 0) && !obstacleHitCells.has(ir + "," + ic)) {
            obstacleHitCells.set(ir + "," + ic, { source: "adj", hitColor: hitCol });
          }
        }
      }
      for (const [key, info] of obstacleHitCells) {
        const [ir, ic] = key.split(",").map(Number);
        damageIceAt(ir, ic, 25, info.source, info.hitColor);
      }

      const specialCandidate =
        matchedSpecials.length === 0 && chain === 1 ? findSpecialCandidate(matches) : null;
      const groupSpecial = specialCandidate?.type || null;
      const keep = specialCandidate?.cell || null;

      for (const [r, c] of remove) {
        const it = state.grid[r]?.[c];
        if (keep && r === keep.r && c === keep.c) continue;
        if (it?.ice > 0 || it?.obs) {
          if (!obstacleHitCells.has(r + "," + c)) {
            damageIceAt(r, c, 25, matchedFromSpecialExplosion ? "booster" : "self", it.type || 0);
          }
          if (state.grid[r]?.[c]?.ice > 0 || state.grid[r]?.[c]?.obs) continue;
        }
        if (it?.mesh && !it.mesh.isDisposed?.()) {
          burstAt(it.mesh.position, it.type);
          it.mesh.dispose();
        }
        state.grid[r][c] = null;
        state.score += 60;
      }

      if (keep && state.grid[keep.r]?.[keep.c]) {
        const it = state.grid[keep.r][keep.c];
        it.special = groupSpecial;
        if (it.mesh && !it.mesh.isDisposed?.()) it.mesh.dispose();
        it.mesh = candyMesh(keep.r, keep.c, it.type, groupSpecial, it.ice || 0, it.obs || null);
        playSfx("special_create");
        triggerHaptic(12);
      }

      if (chain > 1) {
        state.score += matches.size * 10;
      }
      const isSpecialMove = Boolean(groupSpecial || matchedSpecials.length > 0 || matches.size >= 4 || chain >= 2);
      chargeHeroes(isSpecialMove ? "special" : chain > 1 ? "cascade" : "normal", 1);
      window.CMRHeroBossVFX?.onHeroReaction?.(isSpecialMove ? "special" : "normal");
      triggerCharacterCombo(chain);
      updateHud();

      // Immediate stop on objective completion — no extra waiting or obstacle spreading!
      if (isObjectiveCompletedNow()) {
        break;
      }

      await wait(85);
      if (stateMachine.getToken() !== actionToken) return;
      await dropAndRefill();
    }

    if (stateMachine.getToken() !== actionToken) return;

    // If objective is complete, skip stabilization reshuffles and obstacle spreading completely!
    if (isObjectiveCompletedNow()) {
      updateHud();
      return;
    }

    if (findMatches().size > 0) {
      ensurePlayableTypesInPlace();
    } else if (chain > 1) {
      say("سلسلة سحرية ×" + chain + "!");
    }

    // Only spread obstacles when objective is NOT yet completed and moves remain
    if (state.moves > 0 && !isObjectiveCompletedNow()) {
      spreadChocolateIfNeeded();
    }
    updateHud();
  }

  async function swap(a, b) {
    if (!canInteractWithBoard() || !inBounds(a.r, a.c) || !inBounds(b.r, b.c)) return;
    if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) !== 1) return;
    if (window.CMRQueenTutorial && !window.CMRQueenTutorial.isSwapAllowed(a, b)) {
      return;
    }
    const A = state.grid[a.r]?.[a.c];
    const B = state.grid[b.r]?.[b.c];
    if (!A || !B || isCellLocked(A) || isCellLocked(B)) {
      clearSelection();
      playSfx("error");
      return;
    }

    if (!stateMachine.beginResolving()) return;
    clearHintOverlay();
    state.lastMoveUsedBooster = false;
    state.turnBrokeObstacle = false;
    state.turnConsumedMove = false;
    const token = stateMachine.getToken();
    syncPhaseAttributes();
    clearSelection();
    playSfx("swap");

    try {
      await Promise.all([animate(A.mesh, pos(b.r, b.c), 110), animate(B.mesh, pos(a.r, a.c), 110)]);
      if (stateMachine.getToken() !== token) return;

      state.grid[a.r][a.c] = B;
      state.grid[b.r][b.c] = A;
      if (A.mesh) A.mesh.metadata = { r: b.r, c: b.c, candy: true };
      if (B.mesh) B.mesh.metadata = { r: a.r, c: a.c, candy: true };

      // STRICT CANDY CRUSH RULE:
      // Direct Special Activation ONLY for: (1) Special + Special combo, or (2) Color Ball + any candy.
      // A single Rocket or Bomb swapped with a normal candy MUST form a 3+ match or smoothly bounce back!
      const isSpecialComboOrColor =
        (Boolean(A.special) && Boolean(B.special)) ||
        A.special === "color" ||
        B.special === "color";

      if (isSpecialComboOrColor) {
        state.moves = Math.max(0, state.moves - 1);
        state.turnConsumedMove = true;
        updateHud();
        await activateSpecial(a, b);
        if (stateMachine.getToken() !== token) return;
        await settle(token);
      } else if (findMatches().size === 0) {
        await Promise.all([animate(A.mesh, pos(a.r, a.c), 110), animate(B.mesh, pos(b.r, b.c), 110)]);
        if (stateMachine.getToken() !== token) return;
        state.grid[a.r][a.c] = A;
        state.grid[b.r][b.c] = B;
        if (A.mesh) A.mesh.metadata = { r: a.r, c: a.c, candy: true };
        if (B.mesh) B.mesh.metadata = { r: b.r, c: b.c, candy: true };
      } else {
        state.moves = Math.max(0, state.moves - 1);
        state.turnConsumedMove = true;
        updateHud();
        await settle(token);
      }
    } catch (error) {
      console.error("[CMR] Candy swap failed:", error);
      say("حدث خطأ بسيط في الحركة، جرّب مرة أخرى.");
    } finally {
      if (stateMachine.getToken() === token) {
        finalizeTurn();
      }
    }
  }

  async function useSelectedBooster(cell) {
    if (!canInteractWithBoard() || !state.booster) return;
    const kind = state.booster;
    const counts = {
      bomb: state.hammer,
      rocket: state.rockets,
      color: state.colors,
      paint: state.paints,
    };
    if ((counts[kind] || 0) <= 0) {
      say("نفد هذا المساعد. اختر مساعداً آخر.");
      clearActiveBooster();
      return;
    }
    const anchor = state.grid[cell.r]?.[cell.c];
    if (!anchor) return;

    if (!stateMachine.beginResolving()) return;
    clearHintOverlay();
    state.lastMoveUsedBooster = true;
    const token = stateMachine.getToken();
    syncPhaseAttributes();
    clearSelection();

    try {
      if (kind === "paint") {
        const neighbors = [
          [cell.r - 1, cell.c],
          [cell.r + 1, cell.c],
          [cell.r, cell.c - 1],
          [cell.r, cell.c + 1],
        ].filter(([r, c]) => inBounds(r, c) && state.grid[r][c] && !state.grid[r][c].special);
        const target = neighbors.find(([r, c]) => state.grid[r][c].type !== anchor.type);
        if (!target) {
          say("اختر حلوى بجوار لون مختلف.");
          stateMachine.finishResolvingToPlaying();
          syncPhaseAttributes();
          resetIdleHintTimer();
          return;
        }
        const newType = state.grid[target[0]][target[1]].type;
        if (anchor.mesh && !anchor.mesh.isDisposed?.()) anchor.mesh.dispose();
        anchor.type = newType;
        anchor.special = null;
        anchor.mesh = candyMesh(cell.r, cell.c, newType, null, anchor.ice || 0, anchor.obs || null);
        state.paints--;
        state.score += 40;
        state.moves = Math.max(0, state.moves - 1);
        playSfx("booster");
        triggerHaptic(12);
        say("تم تغيير لون الحلوى!");
      } else {
        const cells = new Set();
        if (kind === "bomb") {
          for (let r = cell.r - 1; r <= cell.r + 1; r++) {
            for (let c = cell.c - 1; c <= cell.c + 1; c++) if (inBounds(r, c)) cells.add(r + "," + c);
          }
        } else if (kind === "rocket") {
          for (let c = 0; c < COLS; c++) cells.add(cell.r + "," + c);
          for (let r = 0; r < ROWS; r++) cells.add(r + "," + cell.c);
        } else if (kind === "color") {
          const targetType = anchor.type;
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) if (state.grid[r][c]?.type === targetType) cells.add(r + "," + c);
          }
        }
        if (anchor.mesh) shockwaveAt(anchor.mesh.position, kind);
        playSfx(kind);
        if (kind === "bomb" || kind === "rocket") {
          triggerHaptic(30);
          triggerBoardShake();
        } else {
          triggerHaptic(12);
        }
        for (const key of cells) {
          const [r, c] = key.split(",").map(Number);
          const it = state.grid[r]?.[c];
          if (!it) continue;
          if (it.ice > 0 || it.obs) {
            damageIceAt(r, c, 40, "booster");
            continue;
          }
          if (it.mesh && !it.mesh.isDisposed?.()) {
            burstAt(it.mesh.position, it.type);
            it.mesh.dispose();
          }
          state.grid[r][c] = null;
          state.score += kind === "color" ? 75 : 85;
        }
        if (kind === "bomb") state.hammer--;
        if (kind === "rocket") {
          state.rockets--;
          window.CMREventBus?.emit?.("rocket:used", { source: "booster", cell });
        }
        if (kind === "color") state.colors--;
        state.moves = Math.max(0, state.moves - 1);
        say(
          kind === "bomb"
            ? "انفجار القنبلة!"
            : kind === "rocket"
            ? "الصاروخ مسح الصف والعمود!"
            : "عجلة الألوان مسحت نفس اللون!"
        );
      }

      clearActiveBooster();
      refreshBoosterBadges();
      updateHud();
      await wait(80);
      if (stateMachine.getToken() !== token) return;
      await settle(token);
    } catch (error) {
      console.error("[CMR] Booster failed:", error);
      say("تعذر استخدام المساعد، جرّب مجدداً.");
    } finally {
      if (stateMachine.getToken() === token) {
        finalizeTurn();
      }
    }
  }

  function clearActiveBooster() {
    state.booster = null;
    for (const id of ["paintBtn", "bombBtn", "colorBtn", "rocketBtn"]) {
      const btn = $(id);
      if (btn) btn.classList.remove("active");
    }
  }

  async function runVictoryBonusTimeAndShowModal() {
    if (state.bonusTimeRunning) return;
    state.bonusTimeRunning = true;
    clearHintOverlay();
    window.CMRQueenTutorial?.cancelAll?.();

    const banner = $("bonusTimeBanner");
    const rocketLayer = $("bonusRocketLayer");
    const remaining = Math.max(0, Math.floor(Number(state.moves) || 0));
    state.earnedMovesForStars = remaining;
    state.lastBonusTimeCoins = 0;

    try {
      if (remaining > 0) {
        const totalBonusCoins = remaining * 25;
        state.lastBonusTimeCoins = totalBonusCoins;
        if (banner) {
          banner.classList.remove("hidden");
          void banner.offsetWidth;
          banner.classList.add("is-show");
        }
        playSfx("coin");
        const blasts = Math.min(10, remaining);
        const coinsPerBlast = Math.floor(totalBonusCoins / blasts);
        let coinsAdded = 0;
        let movesRemainingVisual = remaining;

        for (let i = 0; i < blasts; i++) {
          if (stateMachine.phase !== Core.GAME_STATES.WON) break;
          const r = Math.floor(Math.random() * ROWS);
          const c = Math.floor(Math.random() * COLS);
          const it = state.grid[r]?.[c];
          if (rocketLayer) {
            const fly = document.createElement("img");
            fly.className = "bonus-flying-rocket";
            fly.src = "./public/assets/aistudio/01_booster_candy_rocket_b53df03d.png";
            fly.alt = "";
            fly.style.setProperty("--tx", `${((c + 0.5) / COLS) * 100}%`);
            fly.style.setProperty("--ty", `${((r + 0.5) / ROWS) * 100}%`);
            rocketLayer.appendChild(fly);
            setTimeout(() => fly.remove(), 420);
          }
          if (it?.mesh && !it.mesh.isDisposed?.()) {
            burstAt(it.mesh.position, it.type);
            shockwaveAt(it.mesh.position, i % 2 === 0 ? "rocket" : "bomb");
          }
          playSfx("rocket", { playbackRate: Math.min(1.6, 1 + i * 0.06) });
          triggerHaptic(12);
          const moveDrop = i === blasts - 1 ? movesRemainingVisual : Math.max(1, Math.floor(remaining / blasts));
          movesRemainingVisual = Math.max(0, movesRemainingVisual - moveDrop);
          state.moves = movesRemainingVisual;
          const addNow = i === blasts - 1 ? totalBonusCoins - coinsAdded : coinsPerBlast;
          coinsAdded += addNow;
          state.coins += addNow;
          state.score += 100;
          updateHud();
          await wait(160);
        }
        await wait(220);
      }
    } catch (err) {
      console.error("[CMR] Bonus Time error:", err);
    } finally {
      if (banner) {
        banner.classList.remove("is-show");
        banner.classList.add("hidden");
      }
      if (rocketLayer) rocketLayer.textContent = "";
      state.bonusTimeRunning = false;
      showOutcomeModal(true);
    }
  }

  // ---- Hero Ultimate Power & Boss HP Battle Orchestration ----
  function syncHeroChargeUI() {
    if (!state.heroChargeTracker) return;
    const c = state.heroChargeTracker.getState();
    window.CMRHeroBossVFX?.updateChargeRingDOM?.("left", c.left);
    window.CMRHeroBossVFX?.updateChargeRingDOM?.("right", c.right);
  }

  function chargeHeroes(kind, count = 1) {
    if (!state.heroChargeTracker || Core.getStageMeta(state.level).isBossStage) return;
    if (kind === "special") state.heroChargeTracker.onSpecialOrObstacleBreak(count);
    else if (kind === "cascade") state.heroChargeTracker.onCascadeMatch();
    else state.heroChargeTracker.onNormalMatch();
    syncHeroChargeUI();
  }

  function damageBossFromBoard(source, cell, magnitude = 1) {
    if (!state.bossBattleState || !state.bossBattleState.isBossStage) return;
    const res = state.bossBattleState.applyDamage(source, magnitude);
    if (res.orbsCount > 0) {
      window.CMRHeroBossVFX?.fireGoldenEnergyOrbsToBoss?.(cell, res.orbsCount, () => {
        triggerBoardShake();
        triggerHaptic([20, 35, 20]);
        window.CMRHeroBossVFX?.updateBossHpBarDOM?.(state.bossBattleState.getState().hpPercent);
      });
    } else {
      window.CMRHeroBossVFX?.updateBossHpBarDOM?.(res.hpPercent);
    }
  }

  async function triggerHeroUltimate(side) {
    if (!HeroBossEngine || !state.heroChargeTracker) return false;
    if (Core.getStageMeta(state.level).isBossStage) return false;
    if (!canInteractWithBoard()) return false;
    const ch = state.heroChargeTracker.getState();
    if ((side === "left" && !ch.leftReady) || (side === "right" && !ch.rightReady)) return false;

    if (!stateMachine.beginResolving()) return false;
    clearHintOverlay();
    clearSelection();
    clearActiveBooster();
    state.turnConsumedMove = false;
    state.turnBrokeObstacle = false;
    const token = stateMachine.getToken();
    syncPhaseAttributes();

    try {
      state.heroChargeTracker.consume(side);
      syncHeroChargeUI();
      const setup = HeroBossEngine.getStageCharacterSetup(state.level);

      if (side === "right") {
        // Golden Dragon: Cyan-Gold Crystal Energy Beam onto high-density obstacle cluster
        const plan = HeroBossEngine.pickDragonBeamTargets(state.grid, ROWS, COLS);
        say("⚡ التنين الذهبي أطلق شعاع الطاقة الكريستالي!");
        showComboCallout("شعاع التنين! ⚡", 5, "#38bdf8");
        playSfx("rocket");
        await new Promise((resolve) => {
          window.CMRHeroBossVFX?.fireDragonCrystalBeam?.(plan.anchor, plan.targets, () => {
            triggerBoardShake();
            triggerHaptic(30);
            for (const t of plan.targets) {
              const it = state.grid[t.r]?.[t.c];
              if (!it) continue;
              if (it.ice > 0 || it.obs) {
                damageIceAt(t.r, t.c, 45, "booster");
                if (state.grid[t.r]?.[t.c]?.ice > 0) damageIceAt(t.r, t.c, 45, "booster");
              } else {
                if (it.mesh && !it.mesh.isDisposed?.()) {
                  burstAt(it.mesh.position, it.type);
                  it.mesh.dispose();
                }
                state.grid[t.r][t.c] = null;
                state.score += 90;
              }
            }
            updateHud();
            resolve();
          });
        });
        await wait(240);
        if (stateMachine.getToken() !== token) return true;
        await settle(token);
      } else {
        // Queen Cleopatra: 3 royal magic bolts transform 3 random candies into Candy Rockets
        const rocketTargets = HeroBossEngine.pickQueenRocketTargets(state.grid, ROWS, COLS, 3);
        say("🪄 الملكة كليوباترا حوّلت 3 قطع إلى صواريخ حلوى!");
        showComboCallout("سحر كليوباترا! 🪄", 5, "#f472b6");
        playSfx("wand");
        await new Promise((resolve) => {
          window.CMRHeroBossVFX?.fireLeftHeroMagicBolts?.(
            "cleopatra",
            rocketTargets,
            (cell) => {
              const it = state.grid[cell.r]?.[cell.c];
              if (!it || it.obs || it.ice > 0) return;
              it.special = "striped";
              if (it.mesh && !it.mesh.isDisposed?.()) it.mesh.dispose();
              it.mesh = candyMesh(cell.r, cell.c, it.type, "striped", 0, null);
              playSfx("rocket");
              triggerHaptic(12);
            },
            () => {
              updateHud();
              resolve();
            }
          );
        });
        await wait(160);
      }
      return true;
    } catch (err) {
      console.error("[CMR] Hero ultimate error:", err);
      return false;
    } finally {
      if (stateMachine.getToken() === token) {
        finalizeTurn();
      }
    }
  }

  async function runBossPunishmentCounterAttack() {
    if (!HeroBossEngine || !state.bossBattleState || !state.bossBattleState.isBossStage) return;
    if (state.bossBattleState.getState().defeated) return;
    const targets = HeroBossEngine.pickBossLightningTargets(state.grid, ROWS, COLS, 3);
    if (!targets.length) {
      state.bossBattleState.resetCounterMoves();
      return;
    }
    const cfg = Core.getLevelConfig(state.level);
    const spawnObs = cfg.obstacles[0] || "sandstone_block";
    const def = OBSTACLE_DEFS[spawnObs] || OBSTACLE_DEFS.sandstone_block;

    say("⚡ الملك أنوبيس يشن صاعقة عنخ ويلقي 3 عوائق!");
    playSfx("boss");
    triggerBoardShake();

    await new Promise((resolve) => {
      window.CMRHeroBossVFX?.playBossPunishmentAttack?.(
        targets,
        () => {
          triggerBoardShake();
          triggerHaptic([30, 40, 30]);
          for (const t of targets) {
            const it = state.grid[t.r]?.[t.c];
            if (!it || it.obs || it.ice > 0) continue;
            it.obs = spawnObs;
            it.originObs = spawnObs;
            it.ice = Math.max(1, def.introHp || 1);
            it.special = null;
            if (it.mesh && !it.mesh.isDisposed?.()) it.mesh.dispose();
            it.mesh = candyMesh(t.r, t.c, it.type, null, it.ice, it.obs);
            const targetRow = (state.missionTargets || []).find((m) => m.id === spawnObs);
            if (targetRow) targetRow.required += 1;
          }
          state.iceRemaining = countObstacles();
          state.obstacleGoal = Math.max(state.obstacleGoal, state.obstaclesCleared + state.iceRemaining);
          state.bossBattleState.resetCounterMoves();
          updateHud();
        },
        resolve
      );
    });
  }

  async function finalizeTurn() {
    state.iceRemaining = countObstacles();
    const meta = Core.getStageMeta(state.level);

    // On Boss stages: defeating the Boss via 0% HP OR clearing all obstacles wins!
    let bossDefeatedNow = Boolean(state.bossBattleState?.getState?.().defeated);
    if (meta.isBossStage && state.bossBattleState && state.iceRemaining === 0 && !bossDefeatedNow) {
      const drained = state.bossBattleState.drainRemainingToZero();
      window.CMRHeroBossVFX?.updateBossHpBarDOM?.(0);
      if (drained.orbsCount > 0) {
        window.CMRHeroBossVFX?.fireGoldenEnergyOrbsToBoss?.({ r: 3, c: 3 }, drained.orbsCount);
      }
      bossDefeatedNow = true;
    }
    updateHud();

    const outcome = stateMachine.evaluateOutcome({
      levelReady: state.levelReady,
      obstacleGoal: state.obstacleGoal,
      remainingObstacles: bossDefeatedNow ? 0 : state.iceRemaining,
      movesLeft: state.moves,
    });

    if (outcome === Core.GAME_STATES.WON) {
      cancelAllAnimations();
      if (meta.isBossStage) {
        window.CMRHeroBossVFX?.updateBossHpBarDOM?.(0);
        window.CMRHeroBossVFX?.playBossDefeat?.();
        await wait(480);
      }
      void runVictoryBonusTimeAndShowModal();
      return;
    }

    if (outcome === Core.GAME_STATES.LOST) {
      cancelAllAnimations();
      clearHintOverlay();
      showOutcomeModal(false);
      return;
    }

    // Boss 5-Move (4-Move in Palace 3+) Punishment Attack if no obstacle broken
    if (meta.isBossStage && state.bossBattleState && state.turnConsumedMove) {
      const punish = state.bossBattleState.recordMoveOutcome(Boolean(state.turnBrokeObstacle));
      state.turnConsumedMove = false;
      state.turnBrokeObstacle = false;
      if (punish.shouldCounterAttack) {
        await runBossPunishmentCounterAttack();
      }
    }

    stateMachine.finishResolvingToPlaying();
    syncPhaseAttributes();

    if (state.moves === 3) {
      showCharacterSpeech("low_moves");
    }

    if (state.moves > 0 && !hasPossibleMove()) {
      shuffle(true);
    }

    const usedBooster = Boolean(state.lastMoveUsedBooster);
    state.lastMoveUsedBooster = false;
    window.CMRQueenTutorial?.onTutorialMoveResolved?.({ usedBooster });

    resetIdleHintTimer();
    saveProgress(false);
  }

  function hasPossibleMove() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        for (const [dr, dc] of [
          [0, 1],
          [1, 0],
        ]) {
          const nr = r + dr,
            nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          const a = state.grid[r][c],
            b = state.grid[nr][nc];
          if (!a || !b || isCellLocked(a) || isCellLocked(b)) continue;
          if ((a.special && b.special) || a.special === "color" || b.special === "color") return true;
          state.grid[r][c] = b;
          state.grid[nr][nc] = a;
          const valid = findMatches().size > 0;
          state.grid[r][c] = a;
          state.grid[nr][nc] = b;
          if (valid) return true;
        }
      }
    }
    return false;
  }

  function findFirstValidMove() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        for (const [dr, dc] of [
          [0, 1],
          [1, 0],
        ]) {
          const nr = r + dr,
            nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          const a = state.grid[r]?.[c],
            b = state.grid[nr]?.[nc];
          if (!a || !b || isCellLocked(a) || isCellLocked(b)) continue;
          if (a.special || b.special) return { from: { r, c }, to: { r: nr, c: nc } };
          state.grid[r][c] = b;
          state.grid[nr][nc] = a;
          const valid = findMatches().size > 0;
          state.grid[r][c] = a;
          state.grid[nr][nc] = b;
          if (valid) return { from: { r, c }, to: { r: nr, c: nc } };
        }
      }
    }
    return null;
  }

  function shuffle(silent = false) {
    if (!canInteractWithBoard() && !silent) return;
    if (stateMachine.isTerminal() || state.grid.flat().some((it) => !it)) return;
    clearSelection();
    const ok = ensurePlayableTypesInPlace();
    if (!ok) {
      // Deterministic safe pattern fallback
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          state.grid[r][c].type = randomType(r, c);
        }
      }
      rebuildGridMeshes();
    }
    if (!silent) {
      playSfx("swap");
      say("تم خلط الحلوى بنجاح!");
    }
    saveProgress(false);
  }

  // ---- VFX (Lightweight Mobile-Friendly Pools) ----
  function getVfxMaterial(key, color, alpha = 1) {
    if (vfxMaterials[key]) return vfxMaterials[key];
    const mat = new BABYLON.StandardMaterial("royalVfx_" + key, scene);
    mat.diffuseColor = color;
    mat.emissiveColor = color.scale(1.2);
    mat.specularColor = new BABYLON.Color3(0.9, 0.95, 1);
    mat.specularPower = 64;
    mat.alpha = alpha;
    vfxMaterials[key] = mat;
    return mat;
  }

  function trackVfx(mesh, duration = 380) {
    if (activeVfxMeshes.size >= VFX_MESH_LIMIT) {
      const oldest = activeVfxMeshes.values().next().value;
      if (oldest) {
        activeVfxMeshes.delete(oldest);
        if (!oldest.isDisposed?.()) oldest.dispose();
      }
    }
    activeVfxMeshes.add(mesh);
    const started = performance.now();
    const observer = scene.onBeforeRenderObservable.add(() => {
      if (mesh.isDisposed?.()) {
        scene.onBeforeRenderObservable.remove(observer);
        activeVfxMeshes.delete(mesh);
        return;
      }
      if (performance.now() - started >= duration) {
        scene.onBeforeRenderObservable.remove(observer);
        activeVfxMeshes.delete(mesh);
        mesh.dispose();
      }
    });
  }

  function beamBetween(from, to, color, duration = 260) {
    if (activeVfxMeshes.size >= VFX_MESH_LIMIT) return;
    const start = from.clone();
    start.y += 0.52;
    const end = to.clone();
    end.y += 0.52;
    const beam = BABYLON.MeshBuilder.CreateTube(
      "royalEnergyBeam",
      { path: [start, end], radius: 0.028, tessellation: 6, cap: BABYLON.Mesh.CAP_ROUND },
      scene
    );
    const mat = new BABYLON.StandardMaterial("royalEnergyBeamMat", scene);
    mat.diffuseColor = color;
    mat.emissiveColor = color.scale(1.6);
    mat.alpha = 0.9;
    beam.material = mat;
    beam.isPickable = false;
    const started = performance.now();
    const observer = scene.onBeforeRenderObservable.add(() => {
      if (beam.isDisposed?.()) {
        scene.onBeforeRenderObservable.remove(observer);
        if (!mat.isDisposed?.()) mat.dispose();
        return;
      }
      const t = Math.min(1, (performance.now() - started) / duration);
      mat.alpha = 0.9 * (1 - t);
      if (t >= 1) {
        scene.onBeforeRenderObservable.remove(observer);
        if (!mat.isDisposed?.()) mat.dispose();
      }
    });
    trackVfx(beam, duration + 40);
  }

  function shockwaveAt(position, kind) {
    const colors = {
      wrapped: new BABYLON.Color3(1, 0.48, 0.12),
      striped: new BABYLON.Color3(0.12, 0.78, 1),
      color: new BABYLON.Color3(0.8, 0.28, 1),
      bomb: new BABYLON.Color3(1, 0.48, 0.12),
      rocket: new BABYLON.Color3(0.12, 0.78, 1),
      ice: new BABYLON.Color3(0.48, 0.88, 1),
    };
    const color = colors[kind] || new BABYLON.Color3(1, 0.78, 0.32);
    const ring = BABYLON.MeshBuilder.CreateTorus(
      "royalShockwave",
      { diameter: 0.95, thickness: 0.05, tessellation: 28 },
      scene
    );
    ring.position = position.clone();
    ring.position.y += 0.5;
    ring.rotation.x = Math.PI / 2;
    ring.scaling.setAll(0.15);
    ring.isPickable = false;
    const ringMat = new BABYLON.StandardMaterial("royalShockMat_" + kind, scene);
    ringMat.diffuseColor = color;
    ringMat.emissiveColor = color.scale(1.25);
    ringMat.alpha = 0.88;
    ring.material = ringMat;
    const started = performance.now();
    const duration = 340;
    const observer = scene.onBeforeRenderObservable.add(() => {
      if (ring.isDisposed?.()) {
        scene.onBeforeRenderObservable.remove(observer);
        return;
      }
      const t = Math.min(1, (performance.now() - started) / duration);
      const ease = 1 - Math.pow(1 - t, 2);
      ring.scaling.setAll(0.15 + 2.0 * ease);
      ring.material.alpha = 0.88 * (1 - t);
      if (t >= 1) {
        scene.onBeforeRenderObservable.remove(observer);
        ringMat.dispose();
      }
    });
    trackVfx(ring, duration + 30);
  }

  function rocketSweepAt(cell) {
    const origin = pos(cell.r, cell.c);
    shockwaveAt(origin, "rocket");
    const cyan = new BABYLON.Color3(0.16, 0.82, 1);
    beamBetween(pos(cell.r, 0), pos(cell.r, COLS - 1), cyan, 260);
    beamBetween(pos(0, cell.c), pos(ROWS - 1, cell.c), cyan, 260);
    window.CMREventBus?.emit?.("rocket:used", { source: "striped", cell });
  }

  function wrappedDetonationAt(cell, type) {
    const origin = pos(cell.r, cell.c);
    shockwaveAt(origin, "wrapped");
    burstAt(origin, type);
  }

  function colorChainAt(originCell, targetType) {
    const origin = pos(originCell.r, originCell.c);
    shockwaveAt(origin, "color");
    const beamColor = targetType
      ? palette[Math.max(1, Math.min(TYPES, targetType)) - 1].color
      : new BABYLON.Color3(0.84, 0.42, 1);
    let emitted = 0;
    for (let r = 0; r < ROWS && emitted < 14; r++) {
      for (let c = 0; c < COLS && emitted < 14; c++) {
        const item = state.grid[r]?.[c];
        if (!item || (targetType && item.type !== targetType) || (r === originCell.r && c === originCell.c)) continue;
        beamBetween(origin, pos(r, c), beamColor, 240);
        emitted++;
      }
    }
  }

  function burstAt(position, type) {
    const safeType = Math.max(1, Math.min(TYPES, Number(type) || 1));
    const candyColor = palette[safeType - 1].color;
    const material = getVfxMaterial("sugar_" + safeType, candyColor);
    for (let i = 0; i < 5; i++) {
      if (activeVfxMeshes.size >= VFX_MESH_LIMIT) break;
      const p = BABYLON.MeshBuilder.CreatePolyhedron("sugarShard", { type: 1, size: 0.055 }, scene);
      p.position = position.clone();
      p.position.y += 0.2;
      p.material = material;
      p.isPickable = false;
      const angle = (Math.PI * 2 * i) / 5 + (Math.random() - 0.5) * 0.25;
      const dist = 0.36 + Math.random() * 0.22;
      const target = position.add(
        new BABYLON.Vector3(Math.cos(angle) * dist, 0.2 + Math.random() * 0.32, Math.sin(angle) * dist)
      );
      trackVfx(p, 280);
      animate(p, target, 240).then(() => {
        if (!p.isDisposed?.()) p.dispose();
      });
    }
  }

  function iceImpactAt(position, remainingLayers) {
    const iceColor = new BABYLON.Color3(0.48, 0.86, 1);
    shockwaveAt(position, "ice");
    const shardMat = getVfxMaterial("ice_shards", iceColor, 0.9);
    const count = remainingLayers > 0 ? 4 : 6;
    for (let i = 0; i < count; i++) {
      if (activeVfxMeshes.size >= VFX_MESH_LIMIT) break;
      const shard = BABYLON.MeshBuilder.CreatePolyhedron("iceShard", { type: 1, size: 0.05 }, scene);
      shard.position = position.clone();
      shard.position.y += 0.24;
      shard.material = shardMat;
      shard.isPickable = false;
      const angle = (Math.PI * 2 * i) / count;
      const dist = 0.3 + Math.random() * 0.22;
      const target = position.add(new BABYLON.Vector3(Math.cos(angle) * dist, 0.16, Math.sin(angle) * dist));
      trackVfx(shard, 280);
      animate(shard, target, 220).then(() => {
        if (!shard.isDisposed?.()) shard.dispose();
      });
    }
  }

  // ---- Character Reactions ----
  function triggerCharacterCombo(chain) {
    const tier = chain >= 3 ? 3 : chain === 2 ? 2 : 1;
    const msg = $("characterMessage");
    if (msg) msg.textContent = tier === 3 ? "قوة سحرية هائلة!" : tier === 2 ? "كومبو رائع!" : "ممتاز!";
    window.CMRCharacters?.react?.("combo-" + tier);
  }

  function triggerCharacterResult(won) {
    window.CMRCharacters?.react?.(won ? "celebrate" : "defeat");
  }

  // ---- HUD & Background Assignment ----
  function setBoardBackground(level) {
    const meta = Core.getStageMeta(level);
    // Remove any legacy inner-board art duplicate
    const legacyArt = $("cmrFiftyBoardArt");
    if (legacyArt) legacyArt.remove();

    const art = $("royalArtboard");
    if (art) {
      art.style.display = "block";
      if (art.getAttribute("src") !== meta.boardImagePath) {
        art.src = meta.boardImagePath;
      }
      art.alt = `خلفية ${meta.palace.name} — المرحلة ${meta.stageInPalace}`;
    }

    document.body.dataset.palace = String(meta.palaceNumber);
    document.body.dataset.stage = String(meta.globalStage);
    document.body.dataset.boss = String(meta.isBossStage);
    syncPhaseAttributes();
  }

  function updateHud() {
    applyHeartRegen();
    state.iceRemaining = countObstacles();
    const meta = Core.getStageMeta(state.level);
    const cfg = Core.getLevelConfig(state.level);

    const scoreEl = $("score");
    if (scoreEl) scoreEl.textContent = state.score.toLocaleString("en-US");
    const movesEl = $("moves");
    if (movesEl) movesEl.textContent = String(state.moves);
    const hudPanelMoves = $("hudPanelMoves");
    if (hudPanelMoves) {
      hudPanelMoves.textContent = String(state.moves);
      hudPanelMoves.classList.toggle("is-low", state.moves <= 5);
    }
    const heartEl = $("heartCount");
    if (heartEl) heartEl.textContent = String(state.lives);
    const coinEl = $("coinCount");
    if (coinEl) coinEl.textContent = state.coins.toLocaleString("en-US");
    const gemEl = $("gemCount");
    if (gemEl) gemEl.textContent = state.gems.toLocaleString("en-US");
    const starsEl = $("stars");
    if (starsEl) starsEl.textContent = String(state.stars);
    const levelLabelEl = $("levelLabel");
    if (levelLabelEl) levelLabelEl.textContent = `المرحلة ${state.level}`;

    // Render Top Objective Mission HUD (3 recessed dark-blue slots + bottom pill sockets)
    const targets = Array.isArray(state.missionTargets) ? state.missionTargets : [];
    for (let i = 0; i < 3; i++) {
      const slotEl = $("missionSlot" + i);
      const imgEl = $("missionSlotImg" + i);
      const pillEl = $("missionSlotPill" + i);
      const target = targets[i];
      if (!slotEl || !imgEl || !pillEl) continue;
      if (!target) {
        slotEl.classList.add("is-empty");
        slotEl.classList.remove("is-done");
        imgEl.removeAttribute("src");
        imgEl.alt = "";
        pillEl.textContent = "";
      } else {
        const doneCount = Math.min(target.required, target.broken);
        const completed = doneCount >= target.required;
        slotEl.classList.remove("is-empty");
        slotEl.classList.toggle("is-done", completed);
        if (imgEl.getAttribute("src") !== target.imgSrc) imgEl.src = target.imgSrc;
        imgEl.alt = target.nameAr;
        pillEl.textContent = completed ? "✓" : `${doneCount}/${target.required}`;
      }
    }

    const objective = $("obstacleObjective");
    if (objective) {
      const done = Math.min(state.obstaclesCleared, state.obstacleGoal);
      objective.textContent = `اكسر العوائق ${done}/${state.obstacleGoal}`;
      objective.classList.toggle("objective-complete", state.obstacleGoal > 0 && state.iceRemaining === 0);
    }

    const db = $("difficultyBadge");
    if (db) {
      db.classList.remove("is-boss", "is-hard", "is-super-hard");
      if (meta.isBossStage) {
        db.textContent = `👑 زعيم`;
        db.classList.add("is-boss");
      } else if (cfg.isSuperHard) {
        db.textContent = `⚡ خارق`;
        db.classList.add("is-super-hard");
      } else if (cfg.isHard) {
        db.textContent = `🔥 صعبة`;
        db.classList.add("is-hard");
      } else {
        db.textContent = `م ${meta.stageInPalace}`;
      }
      db.hidden = false;
    }

    syncMenuUI();
    syncPhaseAttributes();
  }

  function refreshBoosterBadges() {
    const set = (id, value) => {
      const el = $(id);
      if (!el) return;
      const count = el.querySelector("small");
      if (count) count.textContent = String(value);
      el.disabled = value <= 0;
    };
    set("bombBtn", state.hammer);
    set("rocketBtn", state.rockets);
    set("colorBtn", state.colors);
    set("paintBtn", state.paints);
  }

  // ---- Victory / Defeat Modal (Guaranteed Single Display, Zero Freeze) ----
  function safeClaimLevelReward(level) {
    try {
      const list = JSON.parse(localStorage.getItem(CLAIMED_KEY) || "[]");
      if (list.includes(level)) return false;
      list.push(level);
      localStorage.setItem(CLAIMED_KEY, JSON.stringify(list));
      return true;
    } catch (_) {
      return true;
    }
  }

  const CONFETTI_COLORS = [
    "#ffd86b",
    "#ff4d8d",
    "#38bdf8",
    "#4ade80",
    "#c084fc",
    "#fb923c",
    "#fde047",
    "#f43f5e",
    "#2dd4bf",
    "#ffffff",
  ];

  function clearVictoryConfetti() {
    const container = $("victoryConfetti");
    if (container) container.textContent = "";
    const modal = $("resultModal");
    if (modal) {
      modal.classList.remove("is-victory", "is-defeat");
    }
  }

  function triggerVictoryConfetti() {
    const container = $("victoryConfetti");
    const modal = $("resultModal");
    if (!container || !modal) return;

    container.textContent = "";
    modal.classList.remove("is-victory", "is-defeat");
    void modal.offsetWidth;
    modal.classList.add("is-victory");

    const isNarrow = window.matchMedia("(max-width: 600px)").matches;
    const count = isNarrow ? 52 : 76;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const piece = document.createElement("span");
      const shapeRoll = i % 6;
      piece.className =
        shapeRoll === 0
          ? "confetti-piece is-star"
          : shapeRoll === 1
          ? "confetti-piece is-circle"
          : shapeRoll === 2
          ? "confetti-piece is-ribbon"
          : "confetti-piece";

      // Launch from 3 festive emitters (left cannon, center burst, right cannon)
      const originRoll = i % 3;
      const ox = originRoll === 0 ? "18%" : originRoll === 1 ? "50%" : "82%";
      const oy = originRoll === 1 ? "42%" : "58%";

      const angle =
        originRoll === 0
          ? -Math.PI * 0.12 - Math.random() * Math.PI * 0.52
          : originRoll === 2
          ? -Math.PI * 0.36 - Math.random() * Math.PI * 0.52
          : (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;

      const spreadX = Math.min(vw * 0.58, 480);
      const spreadY = Math.min(vh * 0.48, 360);
      const power = 0.55 + Math.random() * 0.85;
      const tx = Math.cos(angle) * spreadX * power;
      const ty = Math.sin(angle) * spreadY * power - (65 + Math.random() * 110);
      const fallY = vh * 0.52 + Math.random() * 240;
      const drift = (Math.random() - 0.5) * 120;
      const rot = (Math.random() > 0.5 ? 1 : -1) * (420 + Math.random() * 680);
      const waveDelay = i >= Math.floor(count * 0.65) ? 0.45 + Math.random() * 0.35 : Math.random() * 0.24;
      const dur = 2.0 + Math.random() * 1.45;

      const size =
        shapeRoll === 0
          ? 14 + Math.random() * 7
          : shapeRoll === 1
          ? 8 + Math.random() * 5
          : shapeRoll === 2
          ? 7 + Math.random() * 4
          : 9 + Math.random() * 6;
      const height =
        shapeRoll === 2
          ? size * (2.2 + Math.random() * 0.9)
          : shapeRoll >= 3
          ? size * (1.45 + Math.random() * 0.55)
          : size;

      piece.style.setProperty("--ox", ox);
      piece.style.setProperty("--oy", oy);
      piece.style.setProperty("--tx", `${tx.toFixed(1)}px`);
      piece.style.setProperty("--ty", `${ty.toFixed(1)}px`);
      piece.style.setProperty("--fall-y", `${fallY.toFixed(1)}px`);
      piece.style.setProperty("--drift", `${drift.toFixed(1)}px`);
      piece.style.setProperty("--rot", `${rot.toFixed(0)}deg`);
      piece.style.setProperty("--dur", `${dur.toFixed(2)}s`);
      piece.style.setProperty("--delay", `${waveDelay.toFixed(2)}s`);
      piece.style.setProperty("--spin-dur", `${(0.45 + Math.random() * 0.55).toFixed(2)}s`);
      piece.style.setProperty("--w", `${size.toFixed(1)}px`);
      piece.style.setProperty("--h", `${height.toFixed(1)}px`);
      piece.style.setProperty("--color", CONFETTI_COLORS[i % CONFETTI_COLORS.length]);
      frag.appendChild(piece);
    }

    container.appendChild(frag);
  }

  function hideResultModal() {
    clearVictoryConfetti();
    window.CMROutcomeUI?.cancelPending?.();
    const modal = $("resultModal");
    const winView = $("victoryView");
    const lossView = $("defeatView");
    if (winView) winView.classList.add("hidden");
    if (lossView) lossView.classList.add("hidden");
    if (modal) modal.classList.add("hidden");
    if (!document.body.classList.contains("map-open")) {
      window.CMRResumeGameRender?.();
    }
  }

  function commitStageLossHeartCost() {
    if (!state.lossHandled) {
      pityTracker?.recordFail?.(state.level);
      state.lives = Math.max(0, state.lives - 1);
      state.lossHandled = true;
      if (state.lives < Core.MAX_LIVES && !state.lastHeartAt) {
        state.lastHeartAt = Date.now();
      }
      updateHud();
      saveProgress(false);
    }
    if (state.pendingDefeatFail) {
      state.pendingDefeatFail = false;
      window.CMREventBus?.emit?.("stage:fail", {
        level: state.level,
        livesLeft: state.lives,
        usedExtraMoves: false,
      });
    }
  }

  function showOutcomeModal(won) {
    const modal = $("resultModal");
    const winView = $("victoryView");
    const lossView = $("defeatView");
    const title = $("resultTitle");
    const message = $("resultText");
    const defeatSubtext = $("defeatSubtext");
    const meta = Core.getStageMeta(state.level);

    if (!modal || !winView || !lossView) {
      console.error("[CMR] Result modal elements missing");
      return;
    }

    const activeToast = $("toast");
    if (activeToast) activeToast.classList.remove("show");

    let victoryPayload = null;
    let outOfMovesPayload = null;

    try {
      const cfg = Core.getLevelConfig(state.level);
      if (won) {
        pityTracker?.recordWin?.(state.level);
        state.obstaclesCleared = state.obstacleGoal;
        for (const t of state.missionTargets || []) t.broken = t.required;
        state.lossHandled = false;
        state.pendingDefeatFail = false;

        const starMoves = state.earnedMovesForStars !== null ? state.earnedMovesForStars : state.moves;
        const earnedStars = OutcomeEngine
          ? OutcomeEngine.calculateStarsEarned({
              score: state.score,
              remainingMoves: starMoves,
              level: state.level,
              isBoss: meta.isBossStage,
              objectivesCleared: true,
            })
          : starMoves >= 6
          ? 3
          : starMoves >= 3
          ? 2
          : 1;

        const mergedStars = OutcomeEngine
          ? OutcomeEngine.mergeStageStars(state.stageStars, state.level, earnedStars)
          : (() => {
              const map = state.stageStars && typeof state.stageStars === "object" ? { ...state.stageStars } : {};
              const prev = Number(map[String(state.level)] || 0);
              const best = Math.max(prev, earnedStars);
              map[String(state.level)] = best;
              return { stageStars: map, prevStars: prev, bestStars: best, starDelta: Math.max(0, best - prev) };
            })();
        state.stageStars = mergedStars.stageStars;

        const rewardGranted = safeClaimLevelReward(state.level);
        const baseCoins = meta.isBossStage ? 250 : 150;
        const mult = cfg.coinMultiplier || 1;
        const coinReward = Math.round(baseCoins * mult);
        const gemReward = meta.isBossStage ? 5 : cfg.isSuperHard ? 4 : cfg.isHard ? 3 : 2;
        if (rewardGranted) {
          state.stars += earnedStars;
          state.coins += coinReward;
          state.gems += gemReward;
        } else if (mergedStars.starDelta > 0) {
          state.stars += mergedStars.starDelta;
        }
        const nextStageNum = Math.min(Core.TOTAL_STAGES, state.level + 1);
        state.highestUnlocked = Math.max(state.highestUnlocked, nextStageNum);
        state.lastCompletedVictory = {
          completedStage: state.level,
          nextStage: nextStageNum,
          starsEarned: earnedStars,
        };

        updateHud();
        saveProgress(true);
        triggerHaptic([28, 35, 28]);
        window.CMRProfile?.onGameplayProgress?.();
        window.CMREventBus?.emit?.("stage:win", {
          level: state.level,
          stars: earnedStars,
          isBoss: meta.isBossStage,
        });

        winView.classList.remove("hidden");
        lossView.classList.add("hidden");
        modal.classList.remove("is-defeat");
        modal.classList.add("is-victory");

        const stageSubtitle = meta.isBossStage
          ? `هزمت ${meta.bossName}!`
          : `المرحلة ${meta.stageInPalace} مكتملة · ${meta.palace.name}`;
        const bonusNote =
          state.lastBonusTimeCoins > 0
            ? `مكافأة الحركات المتبقية: +${state.lastBonusTimeCoins} عملة ✨`
            : `أكملت جميع الأهداف (${state.obstacleGoal}/${state.obstacleGoal}) بنجاح!`;

        if (title) title.textContent = stageSubtitle;
        if (message) message.textContent = bonusNote;

        const totalCoinsShown = (rewardGranted ? coinReward : 0) + (state.lastBonusTimeCoins || 0);
        const totalGemsShown = rewardGranted ? gemReward : 0;
        const isMilestone = meta.isBossStage || cfg.isHard || cfg.isSuperHard || meta.stageInPalace % 10 === 0;

        victoryPayload = {
          starsEarned: earnedStars,
          score: state.score,
          coins: Math.max(totalCoinsShown, coinReward),
          gems: totalGemsShown,
          isBoss: meta.isBossStage,
          ribbonTitle: meta.isBossStage || earnedStars === 3 ? "انتصار ساحق!" : "فوز ملكي!",
          stageSubtitle,
          bonusNote,
          showGems: isMilestone || totalGemsShown > 0,
        };

        state.lastWinCoinReward = rewardGranted ? coinReward : 0;
        state.lastWinDoubled = false;
        state.completedStageForInterstitial = state.level;

        const doubleBtn = $("winDoubleCoinsBtn");
        const doubleLbl = $("winDoubleCoinsLabel");
        if (doubleBtn) {
          doubleBtn.disabled = false;
          doubleBtn.classList.remove("is-claimed");
          doubleBtn.classList.toggle("hidden", state.lastWinCoinReward <= 0);
        }
        if (doubleLbl && state.lastWinCoinReward > 0) {
          doubleLbl.textContent = `🎬 ×2 عملات (+${state.lastWinCoinReward})`;
        }
        window.CMRAdMob?.syncOfflineAdButtons?.();

        triggerCharacterResult(true);
        playSfx("win");
      } else {
        // Defer 1-Heart deduction until player taps Quit/Retry so Ad/Gem Revive keeps their heart intact!
        state.lossHandled = false;
        updateHud();

        winView.classList.add("hidden");
        lossView.classList.remove("hidden");
        modal.classList.remove("is-victory");
        modal.classList.add("is-defeat");

        const remainingObs = countObstacles();
        const temptation = OutcomeEngine
          ? OutcomeEngine.formatRemainingObjectiveTemptation(state.missionTargets, remainingObs)
          : {
              totalRemaining: Math.max(1, remainingObs),
              primaryObstacleId: state.missionTargets?.[0]?.id || "single_ice",
              primaryRemaining: Math.max(1, remainingObs),
              primaryRequired: Math.max(1, state.obstacleGoal || remainingObs),
              headlineAr:
                remainingObs === 1
                  ? "باقي عائق واحد فقط على الفوز!"
                  : remainingObs === 2
                  ? "باقي عائقان فقط على الفوز!"
                  : `باقي ${remainingObs} عوائق فقط على الفوز!`,
            };
        const obsDef = OBSTACLE_DEFS[temptation.primaryObstacleId] || OBSTACLE_DEFS.single_ice;
        const obsIcon = obsDef?.imgSrc || `./assets/packs/blockers/${obsDef?.img || "1"}.png`;

        outOfMovesPayload = {
          temptation,
          obstacleIconSrc: obsIcon,
          obstacleLabelAr: obsDef?.nameAr || "عائق",
          gemsBalance: state.gems,
          gemCost: OutcomeEngine?.REVIVE_GEMS_COST || 15,
          livesLeft: state.lives,
          maxLives: Core.MAX_LIVES,
        };

        if (defeatSubtext) {
          defeatSubtext.textContent =
            state.lives > 0
              ? `الخسارة تخصم قلباً واحداً · قلوبك الحالية: ${state.lives}/${Core.MAX_LIVES}`
              : "تابع الآن بإعلان أو جواهر دون خسارة أي قلب!";
        }

        window.CMRAdMob?.syncOfflineAdButtons?.();
        state.pendingDefeatFail = true;
        window.CMREventBus?.emit?.("stage:fail-prompt", {
          level: state.level,
          livesLeft: state.lives,
        });
        triggerCharacterResult(false);
        playSfx("lose");
      }
    } catch (err) {
      console.error("[CMR] Result modal error:", err);
    }

    syncPhaseAttributes();
    window.CMRPauseGameRender?.();
    modal.classList.remove("hidden");
    if (won) {
      triggerVictoryConfetti();
      if (victoryPayload) {
        window.CMROutcomeUI?.triggerVictoryPresentation?.(victoryPayload);
      }
    } else {
      clearVictoryConfetti();
      modal.classList.add("is-defeat");
      if (outOfMovesPayload) {
        window.CMROutcomeUI?.triggerOutOfMovesPresentation?.(outOfMovesPayload);
      }
    }
  }

  // ---- Player Profile & Local Persistence ----
  function ensureGuestIdentity() {
    try {
      let identity = JSON.parse(localStorage.getItem(PLAYER_KEY) || "null");
      if (!identity || !identity.id) {
        const id =
          window.crypto && crypto.randomUUID
            ? crypto.randomUUID()
            : "guest-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
        identity = {
          id,
          provider: "guest",
          displayName: "لاعب ضيف",
          email: "",
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(PLAYER_KEY, JSON.stringify(identity));
      }
      if (!identity.displayName) {
        identity.displayName = identity.provider === "account" ? "لاعب ملكي" : "لاعب ضيف";
      }
      return identity;
    } catch (_) {
      return { id: "guest-session", provider: "guest", displayName: "لاعب ضيف", email: "" };
    }
  }

  function savePlayerProfile(displayName, email = "") {
    const cleanName = String(displayName || "").trim();
    const cleanEmail = String(email || "").trim();
    const current = ensureGuestIdentity();
    const updated = {
      ...current,
      provider: "account",
      displayName: cleanName,
      email: cleanEmail,
      signedInAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(PLAYER_KEY, JSON.stringify(updated));
    } catch (_) {}
    syncMenuUI();
    saveProgress(false);
    return updated;
  }

  function setGuestProfile() {
    const current = ensureGuestIdentity();
    const updated = {
      ...current,
      provider: "guest",
      displayName: "لاعب ضيف",
      email: "",
    };
    try {
      localStorage.setItem(PLAYER_KEY, JSON.stringify(updated));
    } catch (_) {}
    syncMenuUI();
    saveProgress(false);
    return updated;
  }

  function syncMenuUI() {
    const profile = ensureGuestIdentity();
    const nameEl = $("menuPlayerName");
    const heartsEl = $("menuHearts");
    const gemsEl = $("menuGems");
    const coinsEl = $("menuCoins");
    const loginBtnLabel = $("loginMenuBtn")?.querySelector("span");

    if (nameEl) nameEl.textContent = profile.displayName || "لاعب ضيف";
    if (heartsEl) heartsEl.textContent = String(state.lives);
    if (gemsEl) gemsEl.textContent = state.gems.toLocaleString("en-US");
    if (coinsEl) coinsEl.textContent = state.coins.toLocaleString("en-US");
    if (loginBtnLabel) {
      loginBtnLabel.textContent = profile.provider === "account" ? "حسابي" : "تسجيل الدخول";
    }
  }

  function saveProgress(completed = false) {
    try {
      const identity = ensureGuestIdentity();
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          version: 4,
          playerId: identity.id,
          provider: identity.provider,
          displayName: identity.displayName,
          level: state.level,
          highestUnlocked: Math.max(state.highestUnlocked, state.level),
          coins: state.coins,
          gems: state.gems,
          stars: state.stars,
          stageStars: state.stageStars || {},
          lives: state.lives,
          lastHeartAt: state.lastHeartAt,
          hammer: state.hammer,
          rockets: state.rockets,
          colors: state.colors,
          paints: state.paints,
          extra: state.extra,
          completed: Boolean(completed),
        })
      );
      window.CMRRefreshWorldMap?.();
    } catch (_) {}
  }

  function loadProgress() {
    try {
      const x = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      const rawUnlocked = Math.floor(Number(x.highestUnlocked) || Number(x.level) || 1);
      const completed = Boolean(x.completed);
      const effectiveUnlocked = completed
        ? Math.max(rawUnlocked, Math.floor(Number(x.level) || 1) + 1)
        : rawUnlocked;
      state.highestUnlocked = Core.clampStage(effectiveUnlocked);
      state.level = state.highestUnlocked;
      state.resumeLevel = state.highestUnlocked;
      state.coins = Number.isFinite(Number(x.coins)) ? Math.max(0, Math.floor(Number(x.coins))) : 500;
      state.gems = Number.isFinite(Number(x.gems)) ? Math.max(0, Math.floor(Number(x.gems))) : 25;
      state.stars = Number.isFinite(Number(x.stars)) ? Math.max(0, Math.floor(Number(x.stars))) : 0;
      state.stageStars = x.stageStars && typeof x.stageStars === "object" ? { ...x.stageStars } : {};
      state.lives =
        x.lives === undefined
          ? Core.MAX_LIVES
          : Math.min(Core.MAX_LIVES, Math.max(0, Math.floor(Number(x.lives) || 0)));
      const savedHeartTime = Number(x.lastHeartAt);
      state.lastHeartAt =
        Number.isFinite(savedHeartTime) && savedHeartTime > 0
          ? Math.min(Date.now(), savedHeartTime)
          : Date.now();
      applyHeartRegen();
      const maxStock = Core.MAX_BOOSTER_STOCK || 25;
      state.hammer = Number.isFinite(Number(x.hammer))
        ? Math.min(maxStock, Math.max(0, Math.floor(Number(x.hammer))))
        : 3;
      state.rockets = Number.isFinite(Number(x.rockets))
        ? Math.min(maxStock, Math.max(0, Math.floor(Number(x.rockets))))
        : 3;
      state.colors = Number.isFinite(Number(x.colors))
        ? Math.min(maxStock, Math.max(0, Math.floor(Number(x.colors))))
        : 3;
      state.paints = Number.isFinite(Number(x.paints))
        ? Math.min(maxStock, Math.max(0, Math.floor(Number(x.paints))))
        : 3;
      state.extra = Number.isFinite(Number(x.extra)) ? Math.min(10, Math.max(0, Math.floor(Number(x.extra)))) : 2;
    } catch (_) {
      state.highestUnlocked = 1;
      state.level = 1;
      state.coins = 500;
      state.gems = 25;
      state.stars = 0;
      state.lives = Core.MAX_LIVES;
      state.lastHeartAt = Date.now();
    }
    syncMenuUI();
  }

  let stageMissionToastTimer = null;
  function showStageStartMissionToast(level, meta, targets) {
    const el = $("stageStartMissionToast");
    if (!el) return;
    const itemsHtml = (targets || [])
      .map(
        (t) => `
        <span class="ssm-target-chip">
          <img src="${t.imgSrc}" alt="${t.nameAr}" draggable="false">
          <b>×${t.required}</b>
        </span>
      `
      )
      .join("");
    el.innerHTML = `
      <div class="ssm-toast-title">${meta.isBossStage ? `👑 معركة ${meta.bossName}` : `المرحلة ${level}`}</div>
      <div class="ssm-toast-sub">${meta.palace.name}</div>
      <div class="ssm-toast-targets">${itemsHtml}</div>
    `;
    el.classList.remove("hidden", "is-visible");
    void el.offsetWidth;
    el.classList.add("is-visible");
    clearTimeout(stageMissionToastTimer);
    stageMissionToastTimer = setTimeout(() => {
      el.classList.remove("is-visible");
      el.classList.add("hidden");
    }, 1850);
  }

  function applyPreLevelBoostersToBoard(preBoosters) {
    if (!Array.isArray(preBoosters) || !preBoosters.length) return;
    const freeCells = [];
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        const it = state.grid[r]?.[c];
        if (it && !it.obs && !it.ice && !it.special) freeCells.push({ r, c });
      }
    }
    for (let i = freeCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [freeCells[i], freeCells[j]] = [freeCells[j], freeCells[i]];
    }
    for (const key of preBoosters) {
      if (key === "rockets" && state.rockets > 0 && freeCells.length) {
        state.rockets--;
        const p = freeCells.pop();
        const it = state.grid[p.r][p.c];
        it.special = "striped";
        if (it.mesh && !it.mesh.isDisposed?.()) it.mesh.dispose();
        it.mesh = candyMesh(p.r, p.c, it.type, "striped", 0, null);
      } else if (key === "hammer" && state.hammer > 0 && freeCells.length) {
        state.hammer--;
        const p = freeCells.pop();
        const it = state.grid[p.r][p.c];
        it.special = "wrapped";
        if (it.mesh && !it.mesh.isDisposed?.()) it.mesh.dispose();
        it.mesh = candyMesh(p.r, p.c, it.type, "wrapped", 0, null);
      } else if (key === "colors" && state.colors > 0 && freeCells.length) {
        state.colors--;
        const p = freeCells.pop();
        const it = state.grid[p.r][p.c];
        it.special = "color";
        if (it.mesh && !it.mesh.isDisposed?.()) it.mesh.dispose();
        it.mesh = candyMesh(p.r, p.c, it.type, "color", 0, null);
      } else if (key === "paints" && state.paints > 0) {
        // Extra starting moves bonus when choosing Magic Wand pre-level booster
        state.paints--;
        state.moves += 3;
      }
    }
  }

  // ---- Stage Lifecycle: Launch, Restart, Next Stage, Exit to Map ----
  function startFreshBoardForCurrentLevel(options = {}) {
    cancelAllAnimations();
    clearHintOverlay();
    window.CMRQueenTutorial?.cancelAll?.();
    window.CMRAnubisAudio?.resetStreak?.();
    clearSelection();
    clearActiveBooster();
    hideResultModal();
    closeConfirmModal(false);
    closeSettingsModal();

    stateMachine.resetToPlaying();
    state.lossHandled = false;
    state.levelReady = false;
    state.score = 0;
    state.lastBonusTimeCoins = 0;
    state.earnedMovesForStars = null;
    state.bonusTimeRunning = false;

    const meta = Core.getStageMeta(state.level);
    const cfg = Core.getLevelConfig(state.level);
    syncCandyPaletteForStage(state.level);
    setBoardBackground(state.level);
    buildGrid();
    if (options && Array.isArray(options.preBoosters) && options.preBoosters.length > 0) {
      applyPreLevelBoostersToBoard(options.preBoosters);
    }
    state.levelReady = true;
    state.turnBrokeObstacle = false;
    state.turnConsumedMove = false;

    if (HeroBossEngine) {
      state.heroChargeTracker = HeroBossEngine.createHeroChargeTracker();
      state.bossBattleState = meta.isBossStage
        ? HeroBossEngine.createBossBattleState(state.level, state.obstacleGoal)
        : null;
      window.CMRHeroBossVFX?.configureForStage?.(state.level);
      syncHeroChargeUI();
      if (state.bossBattleState) {
        window.CMRHeroBossVFX?.updateBossHpBarDOM?.(100);
      }
    }

    refreshBoosterBadges();
    updateHud();
    saveProgress(false);

    showStageStartMissionToast(state.level, meta, state.missionTargets);

    if (meta.isBossStage) {
      playSfx("boss");
      const multTxt = cfg.coinMultiplier ? `×${cfg.coinMultiplier}` : "×2";
      showStageDifficultyBanner(`👑 ${meta.bossName} · ${multTxt} عملات`, "boss");
      say(`👑 مواجهة ${meta.bossName} في ${meta.palace.name}!`);
    } else if (cfg.isSuperHard) {
      showStageDifficultyBanner(`${cfg.difficultyTagAr} · ×2.5 عملات`, "super_hard");
    } else if (cfg.isHard) {
      showStageDifficultyBanner(`${cfg.difficultyTagAr} · ×2 عملات`, "hard");
    }

    // First-time Stage 1 triggers the 6-Step Guided Queen Cleopatra Spotlight Tutorial
    if (state.level === 1 && window.CMRQueenTutorial && !window.CMRQueenTutorial.isTutorialDone()) {
      window.CMRQueenTutorial.beginStage1Tutorial();
    } else if (window.CMRQueenTutorial?.checkAndShowNewObstacles) {
      window.CMRQueenTutorial.checkAndShowNewObstacles(cfg.obstacles, () => resetIdleHintTimer());
    } else {
      resetIdleHintTimer();
    }
  }

  function openOutOfHeartsModal() {
    applyHeartRegen();
    const modal = $("outOfHeartsModal");
    const btn = $("oohFreeHeartBtn");
    if (btn) btn.disabled = false;
    window.CMRAdMob?.syncOfflineAdButtons?.();
    if (modal) {
      modal.classList.remove("hidden");
    } else {
      say("لا توجد قلوب متاحة حالياً. انتظر استعادة قلب أو اشترِ من المتجر.");
      openStoreModal("hearts");
    }
  }

  function closeOutOfHeartsModal() {
    const modal = $("outOfHeartsModal");
    if (modal) modal.classList.add("hidden");
  }

  function restartFromResultModal() {
    applyHeartRegen();
    if (state.lives <= 0) {
      openOutOfHeartsModal();
      return;
    }
    startFreshBoardForCurrentLevel();
  }

  function advanceToNextStage() {
    // Infinite stage progression: 1 -> 1,000 -> 1,001 -> Infinity!
    state.level = Core.clampStage(state.level + 1);
    state.highestUnlocked = Math.max(state.highestUnlocked, state.level);
    state.hammer = Math.max(state.hammer, 3);
    state.rockets = Math.max(state.rockets, 3);
    state.colors = Math.max(state.colors, 3);
    state.paints = Math.max(state.paints, 3);
    startFreshBoardForCurrentLevel();
  }

  function exitToWorldMap() {
    cancelAllAnimations();
    clearHintOverlay();
    window.CMRQueenTutorial?.cancelAll?.();
    window.CMRHeroBossVFX?.stopAll?.();
    window.CMRAnubisAudio?.resetStreak?.();
    clearSelection();
    clearActiveBooster();
    hideResultModal();
    closeConfirmModal(false);
    closeSettingsModal();
    stateMachine.resetToPlaying();
    state.levelReady = false;
    saveProgress(false);
    window.CMRShowWorldMap?.();
  }

  function exitToPalaceWithVictoryTransition() {
    const payload = state.lastCompletedVictory || {
      completedStage: state.level,
      nextStage: Core.clampStage(state.level + 1),
      starsEarned: Number(state.stageStars?.[String(state.level)] || 3),
    };
    state.lastCompletedVictory = null;
    cancelAllAnimations();
    clearHintOverlay();
    window.CMRQueenTutorial?.cancelAll?.();
    window.CMRHeroBossVFX?.stopAll?.();
    window.CMRAnubisAudio?.resetStreak?.();
    clearSelection();
    clearActiveBooster();
    hideResultModal();
    closeConfirmModal(false);
    closeSettingsModal();
    stateMachine.resetToPlaying();
    state.levelReady = false;
    saveProgress(true);
    if (typeof window.CMROpenPalaceWithVictoryTransition === "function") {
      window.CMROpenPalaceWithVictoryTransition(payload);
    } else {
      advanceToNextStage();
    }
  }

  // ---- Gameplay Settings & Heart Confirmation Flow ----
  function syncAudioUI() {
    const audio = window.CMRAudio;
    if (!audio) return;
    const s = audio.getSettings();

    const musicBtn = $("musicToggleBtn");
    const musicIcon = $("musicStateIcon");
    const musicSlider = $("musicVolumeSlider");
    const musicVal = $("musicVolumeValue");

    if (musicBtn) {
      musicBtn.setAttribute("aria-pressed", String(s.musicEnabled));
      const img = musicBtn.querySelector("img");
      const txt = musicBtn.querySelector(".toggle-text");
      if (img) {
        img.src = s.musicEnabled
          ? "./assets/packs/images/toggle_on_normal.png"
          : "./assets/packs/images/toggle_off_normal.png";
      }
      if (txt) txt.textContent = s.musicEnabled ? "تشغيل" : "إيقاف";
    }
    if (musicIcon) {
      musicIcon.src = s.musicEnabled
        ? "./assets/packs/buttons/icon_volume.png"
        : "./assets/packs/buttons/icon_mute.png";
    }
    if (musicSlider) musicSlider.value = String(Math.round(s.musicVolume * 100));
    if (musicVal) musicVal.textContent = Math.round(s.musicVolume * 100) + "%";

    const sfxBtn = $("sfxToggleBtn");
    const sfxIcon = $("sfxStateIcon");
    const sfxSlider = $("sfxVolumeSlider");
    const sfxVal = $("sfxVolumeValue");

    if (sfxBtn) {
      sfxBtn.setAttribute("aria-pressed", String(s.sfxEnabled));
      const img = sfxBtn.querySelector("img");
      const txt = sfxBtn.querySelector(".toggle-text");
      if (img) {
        img.src = s.sfxEnabled
          ? "./assets/packs/images/toggle_on_normal.png"
          : "./assets/packs/images/toggle_off_normal.png";
      }
      if (txt) txt.textContent = s.sfxEnabled ? "تشغيل" : "إيقاف";
    }
    if (sfxIcon) {
      sfxIcon.src = s.sfxEnabled
        ? "./assets/packs/buttons/icon_volume.png"
        : "./assets/packs/buttons/icon_mute.png";
    }
    if (sfxSlider) sfxSlider.value = String(Math.round(s.sfxVolume * 100));
    if (sfxVal) sfxVal.textContent = Math.round(s.sfxVolume * 100) + "%";
  }

  function openSettingsModal(context = "gameplay") {
    if (context === "gameplay") {
      if (document.body.classList.contains("map-open")) return;
      if (stateMachine.isTerminal()) return;
    }
    clearHintOverlay();
    state.settingsOpen = true;
    state.settingsContext = context;
    syncAudioUI();

    const isGameplay = context === "gameplay";
    const restartBtn = $("settingsRestartBtn");
    const exitBtn = $("settingsExitBtn");
    const resumeBtnLabel = $("settingsResumeBtn")?.querySelector("span");
    const modalTitle = $("settingsModalTitle");

    if (restartBtn) restartBtn.hidden = !isGameplay;
    if (exitBtn) exitBtn.hidden = !isGameplay;
    if (resumeBtnLabel) resumeBtnLabel.textContent = isGameplay ? "متابعة اللعب" : "حفظ وإغلاق";
    if (modalTitle) modalTitle.textContent = isGameplay ? "إعدادات اللعب" : "الإعدادات";

    const modal = $("settingsModal");
    if (modal) modal.classList.remove("hidden");
    syncPhaseAttributes();
  }

  function closeSettingsModal() {
    state.settingsOpen = false;
    const modal = $("settingsModal");
    if (modal) modal.classList.add("hidden");
    syncPhaseAttributes();
  }

  function openHeartConfirmation(actionType) {
    applyHeartRegen();
    if (actionType === "restart" && state.lives <= 0) {
      openOutOfHeartsModal();
      return;
    }

    const token = heartGuard.openConfirmation(actionType);
    state.activeConfirmToken = token;

    const modal = $("confirmActionModal");
    const title = $("confirmTitle");
    const msg = $("confirmMessage");
    const heartsPreview = $("confirmHeartsPreview");
    const yesBtn = $("confirmYesBtn");

    const isRestart = actionType === "restart";
    if (title) {
      title.textContent = isRestart ? "تأكيد إعادة المرحلة" : "تأكيد الخروج من المرحلة";
    }
    if (msg) {
      msg.textContent = isRestart
        ? "هل أنت متأكد من إعادة المرحلة؟ سيتم خصم قلب واحد عند التأكيد."
        : "هل أنت متأكد من الخروج إلى خريطة القصور؟ سيتم خصم قلب واحد عند التأكيد.";
    }
    if (heartsPreview) {
      const after = Math.max(0, state.lives - 1);
      heartsPreview.textContent = `القلوب الحالية: ${state.lives} ← بعد التأكيد: ${after}`;
    }
    if (yesBtn) {
      yesBtn.disabled = false;
    }
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  function closeConfirmModal(cancelGuard = true) {
    if (cancelGuard) {
      heartGuard.cancelConfirmation();
      state.activeConfirmToken = null;
    }
    const modal = $("confirmActionModal");
    if (modal) modal.classList.add("hidden");
  }

  function handleConfirmYes() {
    const yesBtn = $("confirmYesBtn");
    if (yesBtn) yesBtn.disabled = true;

    const result = heartGuard.confirmAndDeduct(state.lives, state.activeConfirmToken);
    state.activeConfirmToken = null;

    if (!result.allowed) {
      closeConfirmModal(false);
      return;
    }

    // Atomic single heart deduction synced with HUD and persistent storage
    state.lives = result.nextLives;
    if (state.lives < Core.MAX_LIVES && !state.lastHeartAt) {
      state.lastHeartAt = Date.now();
    }
    updateHud();
    saveProgress(false);

    closeConfirmModal(false);
    closeSettingsModal();

    if (result.actionType === "restart") {
      say("تم خصم قلب واحد وإعادة المرحلة.");
      startFreshBoardForCurrentLevel();
    } else if (result.actionType === "exit") {
      say("تم خصم قلب واحد والعودة إلى خريطة القصور.");
      exitToWorldMap();
    }
  }

  // ---- Complete 6-Category In-Game Store ----
  function readStoreDailyClaims() {
    try {
      return JSON.parse(localStorage.getItem(STORE_DAILY_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function writeStoreDailyClaims(claims) {
    try {
      localStorage.setItem(STORE_DAILY_KEY, JSON.stringify(claims));
    } catch (_) {}
  }

  function getInventorySnapshot() {
    return {
      coins: state.coins,
      gems: state.gems,
      lives: state.lives,
      hammer: state.hammer,
      rockets: state.rockets,
      colors: state.colors,
      paints: state.paints,
    };
  }

  function applyInventorySnapshot(inv) {
    state.coins = inv.coins;
    state.gems = inv.gems;
    state.lives = inv.lives;
    if (state.lives >= Core.MAX_LIVES) state.lastHeartAt = Date.now();
    state.hammer = inv.hammer;
    state.rockets = inv.rockets;
    state.colors = inv.colors;
    state.paints = inv.paints;
    updateHud();
    refreshBoosterBadges();
    saveProgress(false);
    syncMenuUI();
    refreshShop();
    window.CMRRefreshWorldMap?.();
  }

  function applyRewardedAdGrant(reward) {
    if (!reward) return;
    const resultOpen = !$("resultModal")?.classList.contains("hidden");
    if (reward.extraMoves && (stateMachine.phase === Core.GAME_STATES.LOST || state.pendingDefeatFail || resultOpen)) {
      state.moves += reward.extraMoves;
      state.lossHandled = false;
      state.pendingDefeatFail = false;
      stateMachine.resetToPlaying();
      hideResultModal();
      updateHud();
      saveProgress(false);
      playSfx("coin");
      window.CMROutcomeUI?.showReviveCelebrateFlash?.(reward.extraMoves);
      say(`✨ تمت إضافة +${reward.extraMoves} حركات إضافية! تابع اللعب الآن!`);
      return;
    }
    const nextInv = Core.applyRewardToInventory(getInventorySnapshot(), reward);
    applyInventorySnapshot(nextInv);
    playSfx("coin");
  }

  function formatShopPillPrice(item, claimedToday, heartsFull) {
    if (item.currency === "real_money") {
      // Strictly BLANK/EMPTY price tag under high-value packs (ready for Google Play Billing)
      return `<span class="iap-blank-price" data-sku="${item.sku || item.id}" aria-label="سعر Google Play">${item.priceLabel || ""}</span>`;
    }
    if (item.currency === "rewarded_ad") {
      return `<span>🎬 إعلان</span>`;
    }
    if (item.currency === "free_daily") {
      return `<span>${claimedToday ? "تم الاستلام" : "مجاني!"}</span>`;
    }
    if (heartsFull) {
      return `<span>ممتلئ</span>`;
    }
    if (item.currency === "gems") {
      return `<img src="./assets/packs/buttons/icon_gem.png" alt=""><span>${item.price}</span>`;
    }
    return `<img src="${Core.SHOP_ICONS.coin}" alt=""><span>${item.price.toLocaleString("en-US")}</span>`;
  }

  function renderFeaturedShopBundle() {
    const slot = $("shopFeaturedSlot");
    if (!slot) return;
    const dailyCombo = AnubisPack?.getDailyShopComboBundle
      ? AnubisPack.getDailyShopComboBundle(new Date())
      : null;
    const featured = Core.getStoreItemById(Core.SHOP_FEATURED_BUNDLE_ID);
    const target = dailyCombo || featured;
    if (!target) return;

    const targetId = dailyCombo ? "daily_rotating_combo" : featured.id;
    const cantAfford =
      (target.currency === "coins" && state.coins < target.price) ||
      (target.currency === "gems" && state.gems < target.price);

    slot.innerHTML = `
      <div class="rk-featured-card is-daily-combo" data-item-id="${targetId}">
        <div class="rk-featured-art">
          <img src="${target.image}" alt="${target.titleAr || target.name}" draggable="false">
        </div>
        <div class="rk-featured-info">
          <span class="rk-featured-badge">${target.badgeAr || target.badge || "كومبو اليوم"}</span>
          <h3 class="rk-featured-title">${target.titleAr || target.name}</h3>
          <p class="rk-featured-qty">${target.shortQty || ""}</p>
          <button
            type="button"
            class="rk-featured-buy-btn ${cantAfford ? "is-muted" : ""}"
            data-store-buy="${targetId}"
            aria-label="شراء ${target.titleAr || target.name}"
          >
            ${formatShopPillPrice(target, false, false)}
          </button>
        </div>
      </div>
    `;

    const buyBtn = slot.querySelector("[data-store-buy]");
    if (buyBtn) {
      buyBtn.addEventListener("click", () => {
        if (dailyCombo) {
          if (dailyCombo.currency === "gems" && state.gems < dailyCombo.price) {
            say(`رصيدك من الجواهر غير كافٍ (تحتاج ${dailyCombo.price} جوهرة).`);
            return;
          }
          if (dailyCombo.currency === "coins" && state.coins < dailyCombo.price) {
            say(`رصيدك من العملات غير كافٍ (تحتاج ${dailyCombo.price} عملة).`);
            return;
          }
          const inv = getInventorySnapshot();
          if (dailyCombo.currency === "gems") inv.gems -= dailyCombo.price;
          else inv.coins -= dailyCombo.price;
          const updated = Core.applyRewardToInventory(inv, dailyCombo.reward);
          applyInventorySnapshot(updated);
          triggerPurchaseVisualFeedback(targetId);
          playSfx("coin");
          say(`🎉 تم شراء ${dailyCombo.titleAr}: ${Core.formatRewardSummaryArabic(dailyCombo.reward)}`);
        } else {
          handleStorePurchase(featured.id, buyBtn);
        }
      });
    }
  }

  function renderStoreCategories() {
    const tabsEl = $("shopCategoryTabs");
    if (!tabsEl) return;
    if (!state.activeStoreCategory) state.activeStoreCategory = "featured";

    const allTabs = [
      { id: "featured", shortLabel: "المميز", label: "العروض المميزة", icon: Core.SHOP_ICONS.chest },
      ...Core.STORE_CATEGORIES,
    ];

    tabsEl.innerHTML = allTabs
      .map(
        (cat) => `
        <button
          type="button"
          role="tab"
          aria-selected="${cat.id === state.activeStoreCategory}"
          class="rk-cat-pill ${cat.id === state.activeStoreCategory ? "active" : ""}"
          data-shop-cat="${cat.id}"
          title="${cat.label}"
        >
          <img src="${cat.icon}" alt="">
          <span>${cat.shortLabel || cat.label}</span>
        </button>
      `
      )
      .join("");

    tabsEl.querySelectorAll("[data-shop-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activeStoreCategory = btn.dataset.shopCat || "featured";
        playSfx("swap");
        renderStoreCategories();
        renderStoreProducts();
      });
    });
  }

  function renderStoreProducts() {
    const grid = $("shopGrid");
    if (!grid) return;

    const todayKey = new Date().toISOString().slice(0, 10);
    const dailyClaims = readStoreDailyClaims();

    let items;
    if (!state.activeStoreCategory || state.activeStoreCategory === "featured") {
      // Show mix of basic coin items, gem packs, and high-value real-money packs with blank price tags
      const showcase = [
        "iap_pharaoh_starter",
        "iap_anubis_vault",
        "booster_rocket_3",
        "booster_bomb_3",
        "chest_royal_gold",
        "ad_free_coins",
      ];
      items = showcase.map((id) => Core.getStoreItemById(id)).filter(Boolean);
    } else {
      items = Core.STORE_ITEMS.filter(
        (item) => item.category === state.activeStoreCategory && item.id !== Core.SHOP_FEATURED_BUNDLE_ID
      ).slice(0, 6);
    }

    const slots = [];
    for (let i = 0; i < 6; i++) {
      const item = items[i] || null;
      if (!item) {
        slots.push(`
          <div class="rk-offer-slot rk-slot-${i} is-empty" aria-hidden="true">
            <div class="rk-offer-empty-mark">✨</div>
          </div>
        `);
        continue;
      }

      const isAd = item.currency === "rewarded_ad";
      const isIap = item.currency === "real_money";
      const isDaily = item.currency === "free_daily";
      const claimedToday = isDaily && dailyClaims[item.id] === todayKey;
      const cantAfford =
        (item.currency === "coins" && state.coins < item.price) ||
        (item.currency === "gems" && state.gems < item.price);
      const heartsFull = Boolean(item.requiresMissingHearts && state.lives >= Core.MAX_LIVES);
      const pillHtml = formatShopPillPrice(item, claimedToday, heartsFull);

      slots.push(`
        <article class="rk-offer-slot rk-slot-${i} ${isAd ? "is-ad-card" : ""} ${isIap ? "is-iap-card" : ""}" data-item-id="${item.id}">
          ${item.badge ? `<span class="rk-offer-top-badge">${item.badge}</span>` : ""}
          <div class="rk-offer-body">
            <div class="rk-offer-art">
              <img src="${item.image}" alt="${item.name}" draggable="false">
            </div>
            <h3 class="rk-offer-name">${item.shortTitle || item.name}</h3>
            <span class="rk-offer-qty">${item.shortQty || ""}</span>
          </div>
          <button
            type="button"
            class="rk-offer-pill-btn ${isAd ? "cmr-pharaonic-ad-btn" : ""} ${isIap ? "is-iap-blank" : ""} ${cantAfford || heartsFull || claimedToday ? "is-muted" : ""}"
            data-store-buy="${item.id}"
            ${isAd ? 'data-ad-button="true"' : ""}
            aria-label="شراء ${item.name}"
          >
            ${pillHtml}
          </button>
        </article>
      `);
    }

    grid.innerHTML = slots.join("");
    window.CMRAdMob?.syncOfflineAdButtons?.();

    grid.querySelectorAll("[data-store-buy]").forEach((btn) => {
      btn.addEventListener("click", () => handleStorePurchase(btn.dataset.storeBuy, btn));
    });
  }

  function triggerPurchaseVisualFeedback(itemId) {
    const card = document.querySelector(`#royalShop [data-item-id="${itemId}"]`);
    if (!card) return;
    card.classList.remove("is-purchased-pop");
    void card.offsetWidth;
    card.classList.add("is-purchased-pop");
    setTimeout(() => card.classList.remove("is-purchased-pop"), 650);
  }

  function handleStorePurchase(itemId, btnEl) {
    const item = Core.getStoreItemById(itemId);
    if (!item) return;

    if (item.currency === "rewarded_ad") {
      if (item.requiresMissingHearts && state.lives >= Core.MAX_LIVES) {
        say("قلوبك ممتلئة بالفعل (5/5)!");
        return;
      }
      window.CMRAdManager?.openRewardedAdModal?.(item.adPlacement, (reward) => {
        applyRewardedAdGrant(reward);
      });
      return;
    }

    if (btnEl) btnEl.disabled = true;
    const dailyClaims = readStoreDailyClaims();
    const res = storeEngine.purchase(getInventorySnapshot(), itemId, {
      dailyClaims,
      minGapMs: 380,
    });

    if (!res.ok) {
      say(res.message);
      setTimeout(() => {
        if (btnEl) btnEl.disabled = false;
      }, 260);
      return;
    }

    if (res.claimedDate) {
      dailyClaims[itemId] = res.claimedDate;
      writeStoreDailyClaims(dailyClaims);
    }

    applyInventorySnapshot(res.inventory);
    triggerPurchaseVisualFeedback(itemId);
    playSfx("coin");
    say(res.message);
  }

  function setShopFrameTheme(frameKey = "royal_blue") {
    const src = Core.SHOP_FRAMES[frameKey] || Core.SHOP_FRAMES.royal_blue;
    const img = $("rkShopFrameImg");
    const stage = $("rkShopStage");
    if (img) img.src = src;
    if (stage) stage.dataset.frame = frameKey;
    return src;
  }

  function refreshShop() {
    applyHeartRegen();
    const coinsEl = $("shopCoins");
    const gemsEl = $("shopGems");
    const heartsEl = $("shopHearts");
    if (coinsEl) coinsEl.textContent = state.coins.toLocaleString("en-US");
    if (gemsEl) gemsEl.textContent = state.gems.toLocaleString("en-US");
    if (heartsEl) heartsEl.textContent = `${state.lives}/${Core.MAX_LIVES}`;

    const setText = (id, val) => {
      const el = $(id);
      if (el) el.textContent = String(val);
    };
    setText("invBomb", state.hammer);
    setText("invRocket", state.rockets);
    setText("invColor", state.colors);
    setText("invPaint", state.paints);

    renderFeaturedShopBundle();
    renderStoreCategories();
    renderStoreProducts();
  }

  function openStoreModal(categoryId) {
    if (categoryId === "featured" || (categoryId && Core.STORE_CATEGORIES.some((c) => c.id === categoryId))) {
      state.activeStoreCategory = categoryId;
    } else if (!state.activeStoreCategory) {
      state.activeStoreCategory = "featured";
    }
    refreshShop();
    const modal = $("royalShop");
    if (modal) modal.classList.remove("hidden");
  }

  function closeStoreModal() {
    const modal = $("royalShop");
    if (modal) modal.classList.add("hidden");
  }

  // ---- Login Modal ----
  function openLoginModal() {
    const modal = $("loginModal");
    const nameInput = $("loginDisplayName");
    const emailInput = $("loginEmail");
    const statusBanner = $("loginStatusBanner");
    const errorEl = $("loginErrorText");
    const signOutBtn = $("loginSignOutBtn");
    const profile = ensureGuestIdentity();

    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.add("hidden");
    }
    if (nameInput) {
      nameInput.value = profile.provider === "account" ? profile.displayName || "" : "";
    }
    if (emailInput) {
      emailInput.value = profile.email || "";
    }
    if (statusBanner) {
      statusBanner.textContent =
        profile.provider === "account"
          ? `مسجل الدخول حالياً باسم: ${profile.displayName} — جميع مراحل ومقتنيات حسابك محفوظة.`
          : "سجّل اسمك الملكي لحفظ تقدمك ومخزونك على هذا الجهاز.";
    }
    if (signOutBtn) {
      signOutBtn.classList.toggle("hidden", profile.provider !== "account");
    }
    if (modal) modal.classList.remove("hidden");
  }

  function closeLoginModal() {
    const modal = $("loginModal");
    if (modal) modal.classList.add("hidden");
  }

  // ---- Shell-Wide UI Bindings (Active immediately on Main Start Screen) ----
  let shellUiBound = false;
  function bindShellModals() {
    if (shellUiBound) return;
    shellUiBound = true;

    const bind = (id, handler) => {
      const el = $(id);
      if (el) el.addEventListener("click", handler);
    };

    // Main Start Screen buttons (Login, Settings, Store, Profile chip)
    bind("loginMenuBtn", openLoginModal);
    bind("menuProfileChip", openLoginModal);
    bind("menuSettingsBtn", () => openSettingsModal("menu"));
    bind("menuShopBtn", () => openStoreModal("coins"));

    // Hero Ultimate Charge Ring portrait taps (No move cost!)
    bind("heroLeftBtn", () => {
      void triggerHeroUltimate("left");
    });
    bind("heroRightBtn", () => {
      void triggerHeroUltimate("right");
    });

    // Login modal controls
    bind("loginCloseBtn", closeLoginModal);
    bind("loginAsGuestBtn", () => {
      setGuestProfile();
      closeLoginModal();
      say("أنت تلعب الآن كضيف مع حفظ التقدم تلقائياً.");
      window.CMRLaunchGame?.();
    });
    bind("loginSignOutBtn", () => {
      setGuestProfile();
      closeLoginModal();
      say("تم تسجيل الخروج والعودة إلى وضع الضيف.");
    });

    const loginModal = $("loginModal");
    if (loginModal) {
      loginModal.addEventListener("click", (e) => {
        if (e.target === loginModal) closeLoginModal();
      });
    }

    const loginForm = $("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameInput = $("loginDisplayName");
        const emailInput = $("loginEmail");
        const errorEl = $("loginErrorText");
        const name = String(nameInput?.value || "").trim();
        const email = String(emailInput?.value || "").trim();

        if (name.length < 2) {
          if (errorEl) {
            errorEl.textContent = "يرجى إدخال اسم لا يقل عن حرفين.";
            errorEl.classList.remove("hidden");
          }
          nameInput?.focus();
          return;
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          if (errorEl) {
            errorEl.textContent = "يرجى إدخال بريد إلكتروني صحيح أو تركه فارغاً.";
            errorEl.classList.remove("hidden");
          }
          emailInput?.focus();
          return;
        }

        if (errorEl) errorEl.classList.add("hidden");
        savePlayerProfile(name, email);
        closeLoginModal();
        playSfx("coin");
        say(`أهلاً بك يا ${name}! تم حفظ حسابك بنجاح.`);
        window.CMRProfile?.refresh?.();
        if (window.CMRQueenTutorial && !window.CMRQueenTutorial.isTutorialDone()) {
          window.CMRQueenTutorial.startWelcomeToStage1(name);
        } else if (document.body.dataset.state === "title") {
          window.CMRLaunchGame?.();
        }
      });
    }

    // Store modal controls
    const shopModal = $("royalShop");
    if (shopModal) {
      const closeBtn = shopModal.querySelector(".shop-close");
      if (closeBtn) closeBtn.addEventListener("click", closeStoreModal);
      shopModal.addEventListener("click", (e) => {
        if (e.target === shopModal) closeStoreModal();
      });
    }
    bind("shopOpenBtn", () => openStoreModal());

    // Settings Modal Controls (work from Menu, World Map, and Gameplay)
    bind("settingsBtn", () => openSettingsModal("gameplay"));
    bind("settingsCloseBtn", closeSettingsModal);
    bind("settingsResumeBtn", closeSettingsModal);
    bind("settingsRestartBtn", () => openHeartConfirmation("restart"));
    bind("settingsExitBtn", () => openHeartConfirmation("exit"));

    // Confirmation Modal
    bind("confirmYesBtn", handleConfirmYes);
    bind("confirmCancelBtn", () => closeConfirmModal(true));

    // Audio Controls inside Settings Modal
    bind("musicToggleBtn", () => {
      const s = window.CMRAudio?.getSettings?.();
      if (!s) return;
      window.CMRAudio.setMusicEnabled(!s.musicEnabled);
      syncAudioUI();
    });
    bind("sfxToggleBtn", () => {
      const s = window.CMRAudio?.getSettings?.();
      if (!s) return;
      window.CMRAudio.setSfxEnabled(!s.sfxEnabled);
      syncAudioUI();
    });

    const musicSlider = $("musicVolumeSlider");
    if (musicSlider) {
      musicSlider.addEventListener("input", () => {
        const val = Number(musicSlider.value) / 100;
        window.CMRAudio?.setMusicVolume?.(val);
        const out = $("musicVolumeValue");
        if (out) out.textContent = Math.round(val * 100) + "%";
      });
    }
    const sfxSlider = $("sfxVolumeSlider");
    if (sfxSlider) {
      sfxSlider.addEventListener("input", () => {
        const val = Number(sfxSlider.value) / 100;
        window.CMRAudio?.setSfxVolume?.(val);
        const out = $("sfxVolumeValue");
        if (out) out.textContent = Math.round(val * 100) + "%";
      });
    }

    // Out of Hearts Modal (Rewarded Ad for +1 Free Heart)
    bind("oohCloseBtn", closeOutOfHeartsModal);
    bind("oohOpenShopBtn", () => {
      closeOutOfHeartsModal();
      openStoreModal("hearts");
    });
    const oohModal = $("outOfHeartsModal");
    if (oohModal) {
      oohModal.addEventListener("click", (e) => {
        if (e.target === oohModal) closeOutOfHeartsModal();
      });
    }
    bind("oohFreeHeartBtn", async () => {
      playSfx("tap");
      const btn = $("oohFreeHeartBtn");
      const grantFreeHeart = () => {
        applyRewardedAdGrant({ lives: 1 });
        closeOutOfHeartsModal();
        say("❤️ تمت إضافة قلب مجاني فوري! يمكنك متابعة اللعب الآن.");
      };
      if (window.CMRAdMob && typeof window.CMRAdMob.showRewardedAd === "function") {
        if (btn) btn.disabled = true;
        const res = await window.CMRAdMob.showRewardedAd("extra_heart", grantFreeHeart);
        if (btn) btn.disabled = false;
        if (!res.ok || !res.rewarded) {
          if (res.status === "skipped") {
            say("تم إغلاق الإعلان مبكراً — لم يُمنح قلب مجاني.");
          } else if (res.status === "offline") {
            say("لا يوجد اتصال بالإنترنت لعرض الإعلان.");
          }
        }
      } else {
        window.CMRAdManager?.openRewardedAdModal?.("extra_heart", grantFreeHeart);
      }
    });

    // Victory Screen: ×2 Coins Rewarded Ad Button
    bind("winDoubleCoinsBtn", async () => {
      if (state.lastWinDoubled || state.lastWinCoinReward <= 0) return;
      playSfx("tap");
      const btn = $("winDoubleCoinsBtn");
      const lbl = $("winDoubleCoinsLabel");
      const bonusCoins = state.lastWinCoinReward;
      const grantDoubledCoins = () => {
        if (state.lastWinDoubled) return;
        state.lastWinDoubled = true;
        state.coins += bonusCoins;
        updateHud();
        saveProgress(true);
        syncMenuUI();
        refreshShop();
        window.CMRRefreshWorldMap?.();
        playSfx("coin");
        if (btn) {
          btn.disabled = true;
          btn.classList.add("is-claimed");
        }
        if (lbl) lbl.textContent = `✓ تمت مضاعفة العملات (+${bonusCoins})`;
        say(`🎉 تمت مضاعفة عملات الفوز! حصلت على +${bonusCoins} عملة إضافية.`);
      };
      if (window.CMRAdMob && typeof window.CMRAdMob.showRewardedAd === "function") {
        if (btn) btn.disabled = true;
        const res = await window.CMRAdMob.showRewardedAd("double_win_coins", grantDoubledCoins);
        if (!state.lastWinDoubled && btn) btn.disabled = false;
        if (!res.ok || !res.rewarded) {
          if (res.status === "skipped") {
            say("تم إغلاق الإعلان مبكراً — لم تتم مضاعفة العملات.");
          } else if (res.status === "offline") {
            say("لا يوجد اتصال بالإنترنت لعرض الإعلان.");
          }
        }
      } else {
        window.CMRAdManager?.openRewardedAdModal?.("free_coins", grantDoubledCoins);
      }
    });

    // Victory Transparent PNG Hotspots (Interstitial triggers ONLY between screens, never mid-level)
    const runPostWinInterstitial = async () => {
      const completedLvl = state.completedStageForInterstitial;
      state.completedStageForInterstitial = null;
      if (completedLvl && window.CMRAdMob?.maybeShowInterstitialAfterStage) {
        await window.CMRAdMob.maybeShowInterstitialAfterStage(completedLvl);
      }
    };

    bind("winNextBtn", async () => {
      playSfx("tap");
      await runPostWinInterstitial();
      exitToPalaceWithVictoryTransition();
    });
    bind("winReplayBtn", () => {
      playSfx("tap");
      startFreshBoardForCurrentLevel();
    });
    bind("winMapBtn", async () => {
      playSfx("tap");
      await runPostWinInterstitial();
      exitToWorldMap();
    });

    // Out-of-Moves Modal Actions: Primary Ad Revive (+5 Free Moves), 15-Gem Revive, Subtle Quit/Retry
    bind("lossWatchAdBtn", async () => {
      playSfx("tap");
      const btn = $("lossWatchAdBtn");
      const grantMoves = () => {
        state.pendingDefeatFail = false;
        state.lossHandled = false;
        window.CMREventBus?.emit?.("stage:revive", { level: state.level, extraMoves: 5, method: "ad" });
        applyRewardedAdGrant({ extraMoves: 5 });
      };
      if (window.CMRAdMob && typeof window.CMRAdMob.showRewardedAd === "function") {
        if (btn) btn.disabled = true;
        const res = await window.CMRAdMob.showRewardedAd("extra_moves", grantMoves);
        if (btn) btn.disabled = false;
        if (!res.ok || !res.rewarded) {
          if (res.status === "skipped") {
            say("تم إغلاق الإعلان مبكراً — لم تُضف +5 حركات.");
          } else if (res.status === "offline") {
            say("لا يوجد اتصال بالإنترنت لعرض الإعلان.");
          }
        }
      } else {
        window.CMRAdManager?.openRewardedAdModal?.("extra_moves", grantMoves);
      }
    });
    bind("lossGemReviveBtn", () => {
      playSfx("tap");
      const gemCost = OutcomeEngine?.REVIVE_GEMS_COST || 15;
      const extraMoves = OutcomeEngine?.REVIVE_EXTRA_MOVES || 5;
      const res = OutcomeEngine
        ? OutcomeEngine.applyGemRevive({ gems: state.gems, moves: state.moves }, gemCost, extraMoves)
        : state.gems >= gemCost
        ? { ok: true, gems: state.gems - gemCost, moves: state.moves + extraMoves, cost: gemCost, addedMoves: extraMoves }
        : { ok: false, reason: "insufficient_gems" };
      if (!res.ok) {
        say(`تحتاج ${gemCost} جوهرة للمتابعة — يمكنك مشاهدة إعلان مجاني أو زيارة المتجر!`);
        openStoreModal("gems");
        return;
      }
      state.gems = res.gems;
      state.pendingDefeatFail = false;
      state.lossHandled = false;
      window.CMREventBus?.emit?.("stage:revive", { level: state.level, extraMoves, method: "gems" });
      applyRewardedAdGrant({ extraMoves });
      syncMenuUI();
      refreshShop();
      window.CMRRefreshWorldMap?.();
    });
    bind("lossRetryBtn", () => {
      playSfx("tap");
      commitStageLossHeartCost();
      restartFromResultModal();
    });
    bind("lossMapBtn", () => {
      playSfx("tap");
      commitStageLossHeartCost();
      exitToWorldMap();
    });
    bind("lossHelpBtn", () => {
      playSfx("tap");
      openStoreModal(state.lives <= 0 ? "hearts" : "boosters");
    });

    // Escape key closes open modals cleanly
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const oohEl = $("outOfHeartsModal");
      if (oohEl && !oohEl.classList.contains("hidden")) {
        closeOutOfHeartsModal();
        return;
      }
      const adModal = $("rewardedAdModal");
      if (adModal && !adModal.classList.contains("hidden")) {
        window.CMRAdManager?.closeAdModal?.();
        return;
      }
      const confirmModal = $("confirmActionModal");
      if (confirmModal && !confirmModal.classList.contains("hidden")) {
        closeConfirmModal(true);
        return;
      }
      if (shopModal && !shopModal.classList.contains("hidden")) {
        closeStoreModal();
        return;
      }
      if (loginModal && !loginModal.classList.contains("hidden")) {
        closeLoginModal();
        return;
      }
      if (state.settingsOpen) {
        closeSettingsModal();
      } else if (
        !document.body.classList.contains("map-open") &&
        state.levelReady &&
        !stateMachine.isTerminal()
      ) {
        openSettingsModal("gameplay");
      }
    });
  }

  // ---- Gameplay-Only UI Bindings ----
  let gameplayUiBound = false;
  function bindUI() {
    bindShellModals();
    if (gameplayUiBound) return;
    gameplayUiBound = true;

    const bind = (id, handler) => {
      const el = $(id);
      if (el) el.addEventListener("click", handler);
    };

    // Boosters
    const toggleBooster = (id, kind, getCount) =>
      bind(id, () => {
        if (!canInteractWithBoard() || getCount() <= 0) return;
        state.booster = state.booster === kind ? null : kind;
        const mapping = { paintBtn: "paint", bombBtn: "bomb", colorBtn: "color", rocketBtn: "rocket" };
        for (const key of Object.keys(mapping)) {
          const el = $(key);
          if (el) el.classList.toggle("active", state.booster === mapping[key]);
        }
        const labels = {
          bomb: "اختر حلوى لتفجير مساحة 3×3",
          rocket: "اختر حلوى لمسح الصف والعمود",
          color: "اختر حلوى لمسح كل القطع من نفس اللون",
          paint: "اختر حلوى لتغيير لونها إلى لون مجاور",
        };
        say(state.booster ? labels[kind] : "تم إلغاء المساعد");
      });

    toggleBooster("bombBtn", "bomb", () => state.hammer);
    toggleBooster("rocketBtn", "rocket", () => state.rockets);
    toggleBooster("colorBtn", "color", () => state.colors);
    toggleBooster("paintBtn", "paint", () => state.paints);
    bind("shuffleBtn", () => shuffle(false));

    // Daily Coin Bonus button in gameplay HUD
    bind("plusCoins", () => {
      handleStorePurchase("offer_daily_gift");
    });
  }

  // ---- Stalled Animation Watchdog ----
  function startBusyWatchdog() {
    if (busyWatchdogTimer) return;
    let resolvingSince = 0;
    busyWatchdogTimer = setInterval(() => {
      if (stateMachine.phase !== Core.GAME_STATES.RESOLVING) {
        resolvingSince = 0;
        return;
      }
      if (!resolvingSince) {
        resolvingSince = Date.now();
        return;
      }
      if (Date.now() - resolvingSince < 7000) return;
      resolvingSince = Date.now();
      console.warn("[CMR] Watchdog resolving stalled animations");
      cancelAllAnimations();
      finalizeTurn();
    }, 1000);
  }

  // ---- Init & External Launch Entrypoint ----
  async function start() {
    loadProgress();
    state.levelReady = false;
    const loading = $("loading");
    if (loading) {
      loading.style.display = "grid";
      loading.textContent = "جاري تجهيز لوحة الحلوى...";
    }
    setupScene();
    await preloadCandyTextures();
    bindUI();
    updateHud();
    startHeartClock();
    startBusyWatchdog();
    if (loading) loading.style.display = "none";
    refreshBoosterBadges();
  }

  window.CMRStartSelectedHouse = async (selectedLevel, launchOptions = {}) => {
    window.CMRAudio?.setMapMusicActive?.(false);
    window.CMRAnubisAudio?.preloadAll?.();
    const shell = $("gameShell");
    if (shell) shell.classList.remove("is-hidden-shell");
    document.body.classList.add("game-started");
    document.body.dataset.state = "playing";
    window.CMRHideWorldMap?.();
    try {
      if (!gameInitialized) {
        await start();
        gameInitialized = true;
      }
      const requested = Core.clampStage(selectedLevel || state.level);
      state.level = requested;
      state.replayMode = requested < state.highestUnlocked;
      startFreshBoardForCurrentLevel(launchOptions);
      if (engine) requestAnimationFrame(() => engine.resize());
      return true;
    } catch (error) {
      console.error("[CMR] Stage launch failed:", error);
      const loading = $("loading");
      if (loading) {
        loading.style.display = "grid";
        loading.textContent = "تعذر تجهيز اللوحة. حاول مجدداً.";
      }
      say("تعذر فتح المرحلة.");
      return false;
    }
  };

  window.CMRStore = {
    open: openStoreModal,
    close: closeStoreModal,
    refresh: refreshShop,
    setFrame: setShopFrameTheme,
  };

  // ---- Stage 1 Scripted Interactive Tutorial Board Builder (8x8 + Strict Candy Crush Rules) ----
  function fillCleanNoMatchBoard(keepIceCells) {
    const iceSet = new Set((keepIceCells || []).map((p) => p.r + "," + p.c));
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const type = ((r * 2 + c) % 6) + 1;
        const isIce = iceSet.has(r + "," + c);
        state.grid[r][c] = {
          type,
          special: null,
          ice: isIce ? 1 : 0,
          obs: isIce ? "hieroglyph_tile" : null,
          originObs: isIce ? "hieroglyph_tile" : null,
          mesh: null,
        };
      }
    }
  }

  function setupTutorialStep(stepKey) {
    if (!state.grid || !state.grid.length) return null;
    const safeIce = [
      { r: 0, c: 0 },
      { r: 0, c: COLS - 1 },
    ];
    let result = null;

    if (stepKey === "match3") {
      fillCleanNoMatchBoard([
        { r: 3, c: 1 },
        { r: 0, c: 0 },
        { r: 0, c: COLS - 1 },
      ]);
      state.grid[2][2].type = 1;
      state.grid[4][2].type = 1;
      state.grid[3][2].type = 3;
      state.grid[3][3].type = 1;
      state.grid[2][3].type = 5;
      state.grid[4][3].type = 4;
      result = { from: { r: 3, c: 3 }, to: { r: 3, c: 2 } };
    } else if (stepKey === "rocket_create") {
      fillCleanNoMatchBoard(safeIce);
      state.grid[3][1].type = 2;
      state.grid[3][2].type = 2;
      state.grid[3][3].type = 5;
      state.grid[3][4].type = 2;
      state.grid[4][3].type = 2;
      state.grid[2][3].type = 4;
      result = { from: { r: 4, c: 3 }, to: { r: 3, c: 3 } };
    } else if (stepKey === "rocket_activate") {
      // Strict Candy Crush Rule: Rocket swaps into a valid 3-match of same color (type 2)!
      fillCleanNoMatchBoard(safeIce);
      state.grid[3][3].type = 2;
      state.grid[3][3].special = "striped";
      state.grid[3][4].type = 4;
      state.grid[2][4].type = 2;
      state.grid[4][4].type = 2;
      result = { from: { r: 3, c: 3 }, to: { r: 3, c: 4 } };
    } else if (stepKey === "bomb_create") {
      fillCleanNoMatchBoard(safeIce);
      state.grid[3][2].type = 3;
      state.grid[3][4].type = 3;
      state.grid[4][3].type = 3;
      state.grid[5][3].type = 3;
      state.grid[3][3].type = 6;
      state.grid[2][3].type = 3;
      result = { from: { r: 2, c: 3 }, to: { r: 3, c: 3 } };
    } else if (stepKey === "bomb_activate") {
      // Strict Candy Crush Rule: Bomb swaps into a valid 3-match of same color (type 3)!
      fillCleanNoMatchBoard(safeIce);
      state.grid[3][3].type = 3;
      state.grid[3][3].special = "wrapped";
      state.grid[3][4].type = 5;
      state.grid[2][4].type = 3;
      state.grid[4][4].type = 3;
      result = { from: { r: 3, c: 3 }, to: { r: 3, c: 4 } };
    } else if (stepKey === "color_create") {
      fillCleanNoMatchBoard(safeIce);
      state.grid[3][1].type = 4;
      state.grid[3][2].type = 4;
      state.grid[3][3].type = 1;
      state.grid[3][4].type = 4;
      state.grid[3][5].type = 4;
      state.grid[4][3].type = 4;
      result = { from: { r: 4, c: 3 }, to: { r: 3, c: 3 } };
    } else if (stepKey === "color_activate") {
      fillCleanNoMatchBoard(safeIce);
      state.grid[3][3].type = 4;
      state.grid[3][3].special = "color";
      state.grid[3][4].type = 1;
      result = { from: { r: 3, c: 3 }, to: { r: 3, c: 4 } };
    }

    if (result) {
      rebuildGridMeshes();
      const iceNow = countObstacles();
      state.iceRemaining = iceNow;
      state.obstacleGoal = Math.max(state.obstacleGoal, iceNow);
      state.missionTargets = [
        {
          id: "single_ice",
          imgSrc: OBSTACLE_DEFS.single_ice.imgSrc || "./assets/packs/blockers/1.png",
          nameAr: OBSTACLE_DEFS.single_ice.nameAr || "طبقة الجليد",
          required: state.obstacleGoal,
          broken: Math.max(0, state.obstacleGoal - iceNow),
        },
      ];
      updateHud();
    }
    return result;
  }

  function grantFreeTutorialBooster(kind) {
    if (kind === "rocket") state.rockets = Math.max(1, state.rockets + 1);
    else if (kind === "bomb") state.hammer = Math.max(1, state.hammer + 1);
    else if (kind === "color") state.colors = Math.max(1, state.colors + 1);
    else if (kind === "paint") state.paints = Math.max(1, state.paints + 1);
    refreshBoosterBadges();
    updateHud();
  }

  // Expose clean diagnostic/interaction API for verification & cross-module sync
  window.CMRGame = {
    getState: () => ({
      phase: stateMachine.phase,
      level: state.level,
      highestUnlocked: state.highestUnlocked,
      moves: state.moves,
      lives: state.lives,
      score: state.score,
      coins: state.coins,
      gems: state.gems,
      stars: state.stars,
      hammer: state.hammer,
      rockets: state.rockets,
      colors: state.colors,
      paints: state.paints,
      obstacleGoal: state.obstacleGoal,
      obstaclesRemaining: countObstacles(),
      obstaclesCleared: state.obstaclesCleared,
      missionTargets: state.missionTargets,
      settingsOpen: state.settingsOpen,
      meta: Core.getStageMeta(state.level),
      profile: ensureGuestIdentity(),
    }),
    getObstacleCells: () => {
      const cells = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const it = state.grid[r]?.[c];
          if (it && (it.obs || it.ice > 0)) {
            cells.push({ r, c, obs: it.obs, hp: it.ice, screen: cellScreenPos(r, c) });
          }
        }
      }
      return cells;
    },
    getCellScreenPos: cellScreenPos,
    findFirstValidMove,
    setupTutorialStep,
    grantFreeTutorialBooster,
    showSmartHintNow: renderSmartHint,
    triggerComboCallout: showComboCallout,
    triggerCharacterSpeech: (t) => showCharacterSpeech(t, true),
    getHeroCharge: () => state.heroChargeTracker?.getState?.() || { left: 0, right: 0, leftReady: false, rightReady: false },
    setHeroCharge: (side, pct) => {
      if (!state.heroChargeTracker) return null;
      const next = state.heroChargeTracker.setCharge(side, pct);
      syncHeroChargeUI();
      return next;
    },
    triggerHeroUltimate,
    getBossState: () => state.bossBattleState?.getState?.() || null,
    damageBossTest: (source = "bomb", mag = 1) => {
      damageBossFromBoard(source, { r: 3, c: 3 }, mag);
      return state.bossBattleState?.getState?.() || null;
    },
    triggerBossPunishment: () => runBossPunishmentCounterAttack(),
    previewVictoryModal: ({ remainingMoves = 6, score = 3600 } = {}) => {
      state.score = score;
      state.moves = remainingMoves;
      state.earnedMovesForStars = remainingMoves;
      state.lastBonusTimeCoins = remainingMoves * 25;
      stateMachine.resetToPlaying();
      stateMachine.beginResolve?.();
      stateMachine.evaluateOutcome({ remainingObstacles: 0, remainingMoves });
      showOutcomeModal(true);
    },
    previewOutOfMovesModal: () => {
      state.moves = 0;
      stateMachine.resetToPlaying();
      stateMachine.beginResolve?.();
      stateMachine.evaluateOutcome({ remainingObstacles: Math.max(1, countObstacles()), remainingMoves: 0 });
      showOutcomeModal(false);
    },
    getPityState: (lvl) => ({
      fails: pityTracker?.getFailCount?.(lvl || state.level) || 0,
      bias: pityTracker?.getSpawnBias?.(lvl || state.level) || 0,
    }),
    openSettings: openSettingsModal,
    closeSettings: closeSettingsModal,
    openOutOfHeartsModal,
    closeOutOfHeartsModal,
    openLogin: openLoginModal,
    setGuestProfile,
    syncMenuUI,
    exitToMap: exitToWorldMap,
    getInventorySnapshot,
    buyPreLevelBooster: (key, cost = 100) => {
      const safeCost = Math.max(0, Math.floor(Number(cost) || 100));
      if (state.coins < safeCost) {
        return { ok: false, reason: "insufficient_coins", message: `تحتاج ${safeCost} عملة ذهبية.` };
      }
      if (!["rockets", "hammer", "colors", "paints"].includes(key)) {
        return { ok: false, reason: "invalid_booster", message: "معزز غير صالح." };
      }
      state.coins -= safeCost;
      state[key] = Math.min(Core.MAX_BOOSTER_STOCK, (state[key] || 0) + 1);
      updateHud();
      refreshBoosterBadges();
      saveProgress(false);
      syncMenuUI();
      refreshShop();
      window.CMRRefreshWorldMap?.();
      playSfx("coin");
      return { ok: true, inventory: getInventorySnapshot() };
    },
    grantReward: (reward) => {
      if (!reward || typeof reward !== "object") return getInventorySnapshot();
      const nextInv = Core.applyRewardToInventory(getInventorySnapshot(), reward);
      applyInventorySnapshot(nextInv);
      return nextInv;
    },
    addRewards: (coinsAdd = 0, gemsAdd = 0) => {
      state.coins = Math.max(0, state.coins + Math.floor(Number(coinsAdd) || 0));
      state.gems = Math.max(0, state.gems + Math.floor(Number(gemsAdd) || 0));
      updateHud();
      saveProgress(false);
      syncMenuUI();
      refreshShop();
      window.CMRRefreshWorldMap?.();
    },
  };

  window.addEventListener("DOMContentLoaded", () => {
    loadProgress();
    bindShellModals();
    syncAudioUI();
    const shopWheelBtn = $("shopWheelShortcutBtn");
    if (shopWheelBtn) {
      shopWheelBtn.addEventListener("click", () => {
        closeStoreModal();
        window.CMRLuckyWheel?.open?.();
      });
    }
  });
})();
