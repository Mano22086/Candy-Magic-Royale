/* Candy Magic Royale — Modular EventBus & GPU-Accelerated Event VFX Engine
 * Lightweight pub/sub for isolated event modules (stage:win, stage:fail, rocket:used)
 * plus 60 FPS transform/opacity-only reward flight, coin fountains, and sparkle bursts.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    const api = factory(root);
    root.CMREventBus = api.EventBus;
    root.CMREventFX = api.EventFX;
    root.CMR_EVENT_ASSETS = api.EVENT_ASSETS;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const EVENT_ASSETS = Object.freeze({
    // Phase 1 Assets
    royalVaultFrame: "./public/assets/aistudio/event_ui_royal_vault_d8e2bf76.png",
    bastetVaultIcon: "./public/assets/aistudio/icon_golden_bastet_vault_411d03d1.png",
    rocketRushFrame: "./public/assets/aistudio/event_ui_rocket_rush_74634efb.png",
    secretVaultFrame: "./public/assets/aistudio/event_ui_secret_vault_af844ced.png",
    chestClosedIcon: "./public/assets/aistudio/icon_chest_closed_egyptian_40e6290f.png",
    chestOpenIcon: "./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png",
    goldenKeyIcon: "./public/assets/aistudio/icon_golden_key_a3b6321c.png",
    rocketIcon: "./public/assets/aistudio/01_booster_candy_rocket_b53df03d.png",
    coinIcon: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png",
    wandIcon: "./public/assets/aistudio/02_booster_magic_wand_e83e8cc8.png",
    bombIcon: "./public/assets/aistudio/03_booster_candy_bomb_8bfca840.png",
    stripedIcon: "./public/assets/aistudio/04_booster_striped_candy_7749b182.png",
    gemIcon: "./assets/extracted/ui/icon_gem_purple.png",

    // Phase 2 & 3 Assets — 1. Lava Quest
    lavaQuestFrame: "./public/assets/aistudio/event_ui_lava_quest_f8f87d4d.png",

    // Phase 2 & 3 Assets — 2. Card Album
    cardAlbumFrame: "./public/assets/aistudio/event_ui_card_album_6eca2161.png",
    cardPackPharaoh: "./public/assets/aistudio/icon_card_pack_pharaoh_cbc27457.png",
    card01Scarab: "./public/assets/aistudio/card_01_scarab_4247642c.png",
    card02Pyramid: "./public/assets/aistudio/card_02_pyramid_5e27abf8.png",
    card03Lotus: "./public/assets/aistudio/card_03_lotus_f15c517b.png",
    card04Dragon: "./public/assets/aistudio/card_04_dragon_8cf36d15.png",
    card05Crown: "./public/assets/aistudio/card_05_crown_063689d6.png",
    card06HorusEye: "./public/assets/aistudio/card_06_horus_eye_7e5bc82b.png",
    card07Ankh: "./public/assets/aistudio/card_07_ankh_5e98293a.png",
    card08Bastet: "./public/assets/aistudio/card_08_bastet_8eb73ac7.png",
    card09Sphinx: "./public/assets/aistudio/card_09_sphinx_12ce88c7.png",

    // Phase 2 & 3 Assets — 3. Teams
    teamsFrame: "./public/assets/aistudio/event_ui_teams_814f0cee.png",
    teamScarabShield: "./public/assets/aistudio/icon_team_scarab_shield_9cc0cf8b.png",
    royalHeart3d: "./public/assets/aistudio/icon_royal_heart_3d_583b6300.png",

    // Phase 2 & 3 Assets — 4. Nile League
    nileLeagueFrame: "./public/assets/aistudio/event_ui_nile_league_d8e34672.png",
    league1Bronze: "./public/assets/aistudio/league_1_bronze_23744630.png",
    league2Silver: "./public/assets/aistudio/league_2_silver_f992fb4b.png",
    league3Gold: "./public/assets/aistudio/league_3_gold_0a8f5155.png",
    league4Pharaoh: "./public/assets/aistudio/league_4_pharaoh_4f175723.png",

    // Phase 2 & 3 Assets — 5. Co-op Golden Candy Sphinx
    coopSphinxFrame: "./public/assets/aistudio/event_ui_coop_sphinx_af779c23.png",
    goldenCandySphinx: "./public/assets/aistudio/icon_golden_candy_sphinx_0c0aee3b.png",
  });

  function createEventBus() {
    const listeners = new Map();

    function on(eventName, handler) {
      if (typeof eventName !== "string" || typeof handler !== "function") return () => {};
      if (!listeners.has(eventName)) listeners.set(eventName, new Set());
      const bucket = listeners.get(eventName);
      bucket.add(handler);
      return () => off(eventName, handler);
    }

    function off(eventName, handler) {
      const bucket = listeners.get(eventName);
      if (!bucket) return;
      bucket.delete(handler);
      if (bucket.size === 0) listeners.delete(eventName);
    }

    function once(eventName, handler) {
      if (typeof handler !== "function") return () => {};
      const wrapper = (payload) => {
        off(eventName, wrapper);
        handler(payload);
      };
      return on(eventName, wrapper);
    }

    function emit(eventName, payload) {
      const bucket = listeners.get(eventName);
      if (!bucket || bucket.size === 0) return 0;
      let called = 0;
      for (const fn of Array.from(bucket)) {
        try {
          fn(payload);
          called++;
        } catch (err) {
          if (typeof console !== "undefined" && console.error) {
            console.error(`[CMR EventBus] Listener failed for "${eventName}":`, err);
          }
        }
      }
      return called;
    }

    function clear(eventName) {
      if (eventName) {
        listeners.delete(eventName);
      } else {
        listeners.clear();
      }
    }

    function listenerCount(eventName) {
      return listeners.get(eventName)?.size || 0;
    }

    return { on, off, once, emit, clear, listenerCount };
  }

  const EventBus = createEventBus();

  // =========================================================================
  // SHARED REWARD & 60 FPS GPU-ACCELERATED VFX HELPERS (Browser Only)
  // =========================================================================
  const SAVE_KEY = "cmr_royal_save_v1";

  function grantReward(reward = {}) {
    if (!reward || typeof reward !== "object") return;
    if (typeof window !== "undefined" && window.CMRGame && typeof window.CMRGame.grantReward === "function") {
      window.CMRGame.grantReward(reward);
      window.CMRRefreshWorldMap?.();
      window.CMRProfile?.refresh?.();
      return;
    }
    if (typeof localStorage === "undefined") return;
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      const maxStock = window.CMRCore?.MAX_BOOSTER_STOCK || 25;
      const maxLives = window.CMRCore?.MAX_LIVES || 5;
      raw.coins = Math.max(0, Math.floor(Number(raw.coins ?? 500)) + Math.floor(Number(reward.coins) || 0));
      raw.gems = Math.max(0, Math.floor(Number(raw.gems ?? 25)) + Math.floor(Number(reward.gems) || 0));
      raw.lives = Math.min(maxLives, Math.max(0, Math.floor(Number(raw.lives ?? maxLives)) + Math.floor(Number(reward.lives) || 0)));
      raw.rockets = Math.min(maxStock, Math.max(0, Math.floor(Number(raw.rockets ?? 3)) + Math.floor(Number(reward.rockets) || 0)));
      raw.hammer = Math.min(maxStock, Math.max(0, Math.floor(Number(raw.hammer ?? 3)) + Math.floor(Number(reward.hammer) || 0)));
      raw.paints = Math.min(maxStock, Math.max(0, Math.floor(Number(raw.paints ?? 3)) + Math.floor(Number(reward.paints) || 0)));
      raw.colors = Math.min(maxStock, Math.max(0, Math.floor(Number(raw.colors ?? 3)) + Math.floor(Number(reward.colors) || 0)));
      localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
    } catch (_) {}
    if (typeof window !== "undefined") {
      window.CMRRefreshWorldMap?.();
      window.CMRGame?.syncMenuUI?.();
      window.CMRProfile?.refresh?.();
    }
  }

  function showToast(message) {
    if (typeof document === "undefined" || !message) return;
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast.__cmrEventToastTimer);
    toast.__cmrEventToastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function getHudTargetRect(kind = "coins") {
    if (typeof document === "undefined") return { x: 195, y: 36, el: null };
    const selectors =
      kind === "gems"
        ? ["#vmapResGemsBtn", "#gemCount"]
        : ["#vmapResCoinsBtn", "#coinCount"];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          return { x: r.left + r.width / 2, y: r.top + r.height / 2, el };
        }
      }
    }
    return { x: window.innerWidth * 0.5, y: 34, el: null };
  }

  function bumpHudCounter(el) {
    if (!el) return;
    el.classList.remove("ev-hud-bump");
    void el.offsetWidth;
    el.classList.add("ev-hud-bump");
    clearTimeout(el.__evBumpTimer);
    el.__evBumpTimer = setTimeout(() => el.classList.remove("ev-hud-bump"), 360);
  }

  // Launch 20+ golden coins (or custom icon tokens) arcing smoothly to HUD using transform & opacity only
  function launchCoinBurst(originEl, options = {}) {
    if (typeof document === "undefined") return;
    const count = Math.max(4, Math.min(32, Number(options.count) || 22));
    const iconSrc = options.iconSrc || EVENT_ASSETS.coinIcon;
    const targetKind = options.targetKind || "coins";

    const originRect = originEl
      ? originEl.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const startX = originRect.left + originRect.width / 2;
    const startY = originRect.top + originRect.height / 2;
    const target = getHudTargetRect(targetKind);

    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const img = document.createElement("img");
      img.className = "ev-fly-coin";
      img.src = iconSrc;
      img.alt = "";
      img.setAttribute("aria-hidden", "true");

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      const spread = 36 + Math.random() * 72;
      const midX = Math.cos(angle) * spread;
      const midY = Math.sin(angle) * spread - 36;
      const dx = target.x - startX;
      const dy = target.y - startY;
      const delay = Math.round(i * 22 + Math.random() * 24);
      const dur = 680 + Math.round(Math.random() * 220);

      img.style.left = `${Math.round(startX)}px`;
      img.style.top = `${Math.round(startY)}px`;
      img.style.setProperty("--ev-mid-x", `${Math.round(midX)}px`);
      img.style.setProperty("--ev-mid-y", `${Math.round(midY)}px`);
      img.style.setProperty("--ev-dx", `${Math.round(dx)}px`);
      img.style.setProperty("--ev-dy", `${Math.round(dy)}px`);
      img.style.setProperty("--ev-dur", `${dur}ms`);
      img.style.animationDelay = `${delay}ms`;

      frag.appendChild(img);
      setTimeout(() => {
        img.remove();
        if (i === Math.floor(count / 2) || i === count - 1) {
          bumpHudCounter(target.el);
        }
      }, dur + delay + 60);
    }
    document.body.appendChild(frag);
  }

  // Celebratory radial sparkle & confetti burst (GPU transform + opacity only)
  function spawnSparkleBurst(originEl, options = {}) {
    if (typeof document === "undefined") return;
    const count = Math.max(8, Math.min(28, Number(options.count) || 18));
    const palette = options.colors || ["#fde047", "#f59e0b", "#38bdf8", "#f472b6", "#34d399", "#ffffff"];

    const rect = originEl
      ? originEl.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "ev-spark-particle";
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.28;
      const dist = 38 + Math.random() * 68;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist - 14;
      const rot = Math.round((Math.random() - 0.5) * 320);
      const size = 6 + Math.round(Math.random() * 6);
      const dur = 520 + Math.round(Math.random() * 240);

      p.style.left = `${Math.round(cx)}px`;
      p.style.top = `${Math.round(cy)}px`;
      p.style.width = `${size}px`;
      p.style.height = `${i % 3 === 0 ? size * 1.55 : size}px`;
      p.style.background = palette[i % palette.length];
      p.style.setProperty("--sp-tx", `${Math.round(tx)}px`);
      p.style.setProperty("--sp-ty", `${Math.round(ty)}px`);
      p.style.setProperty("--sp-rot", `${rot}deg`);
      p.style.setProperty("--sp-dur", `${dur}ms`);

      frag.appendChild(p);
      setTimeout(() => p.remove(), dur + 60);
    }
    document.body.appendChild(frag);
  }

  function openElasticModal(modalEl) {
    if (!modalEl) return;
    clearTimeout(modalEl.__evCloseTimer);
    modalEl.classList.remove("hidden", "is-closing");
    modalEl.classList.remove("is-opening");
    void modalEl.offsetWidth;
    modalEl.classList.add("is-opening");
    window.CMRAudio?.playSfx?.("open");
  }

  function closeElasticModal(modalEl) {
    if (!modalEl || modalEl.classList.contains("hidden")) return;
    window.CMRAudio?.playSfx?.("cancel");
    modalEl.classList.remove("is-opening");
    modalEl.classList.add("is-closing");
    clearTimeout(modalEl.__evCloseTimer);
    modalEl.__evCloseTimer = setTimeout(() => {
      modalEl.classList.remove("is-closing");
      modalEl.classList.add("hidden");
    }, 180);
  }

  return {
    EVENT_ASSETS,
    createEventBus,
    EventBus,
    EventFX: {
      grantReward,
      showToast,
      launchCoinBurst,
      spawnSparkleBurst,
      openElasticModal,
      closeElasticModal,
      getHudTargetRect,
      bumpHudCounter,
    },
  };
});
