/* Candy Magic Royale asset integration.
 * Safe pass: animated map + opt-in music/SFX. UI ZIP skins are intentionally
 * not auto-applied until their internal assets and licenses are reviewed.
 */
(function () {
  "use strict";
  const ROOT = "./";
  const KEY = "cmr_assets_audio_muted_v1";
  const state = {
    muted: localStorage.getItem(KEY) === "1",
    unlocked: false,
    bgm: null,
    pools: Object.create(null),
    urls: []
  };

  function addStyles() {
    if (document.getElementById("cmr-assets-upgrade-styles")) return;
    const style = document.createElement("style");
    style.id = "cmr-assets-upgrade-styles";
    style.textContent = `
      /* Actual map element created by world-map.js */
      .world-map {
        background-color: #17082f !important;
        background-image:
          radial-gradient(ellipse at 50% 18%, rgba(255,218,151,.20), transparent 34%),
          linear-gradient(180deg, rgba(24,8,49,.36), rgba(23,8,47,.12) 42%, rgba(16,6,34,.48)),
          url("./1795443357274.gif") !important;
        background-position: center, center, center;
        background-size: auto, auto, cover;
        background-repeat: no-repeat;
      }
      .cmr-audio-fab {
        position: fixed; top: 12px; left: 12px; z-index: 9999;
        width: 44px; height: 44px; border-radius: 50%;
        border: 2px solid rgba(255,224,130,.85);
        background: radial-gradient(circle at 30% 30%, #ff85c0, #7c3aed);
        color: white; font-size: 20px; display: grid; place-items: center;
        box-shadow: 0 6px 16px rgba(15,7,32,.45);
        -webkit-tap-highlight-color: transparent;
      }
      .cmr-audio-fab.is-muted { filter: grayscale(.75) brightness(.8); }
    `;
    document.head.appendChild(style);
  }

  function playAudio(audio) {
    if (state.muted || !audio) return;
    try {
      audio.currentTime = 0;
      const promise = audio.play();
      if (promise && promise.catch) promise.catch(() => {});
    } catch (_) {}
  }

  function unlockAudio() {
    state.unlocked = true;
    if (!state.muted && state.bgm) {
      const promise = state.bgm.play();
      if (promise && promise.catch) promise.catch(() => {});
    }
  }

  function setMuted(value) {
    state.muted = Boolean(value);
    localStorage.setItem(KEY, state.muted ? "1" : "0");
    if (state.bgm) {
      if (state.muted) state.bgm.pause();
      else if (state.unlocked) {
        const promise = state.bgm.play();
        if (promise && promise.catch) promise.catch(() => {});
      }
    }
    const button = document.getElementById("cmrAudioToggleBtn");
    if (button) {
      button.textContent = state.muted ? "🔇" : "🔊";
      button.classList.toggle("is-muted", state.muted);
      button.setAttribute("aria-label", state.muted ? "تشغيل الصوت" : "كتم الصوت");
    }
  }

  function mountAudioToggle() {
    if (document.getElementById("cmrAudioToggleBtn")) return;
    const button = document.createElement("button");
    button.id = "cmrAudioToggleBtn";
    button.type = "button";
    button.className = "cmr-audio-fab" + (state.muted ? " is-muted" : "");
    button.textContent = state.muted ? "🔇" : "🔊";
    button.title = "الصوت والموسيقى";
    button.setAttribute("aria-label", state.muted ? "تشغيل الصوت" : "كتم الصوت");
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      unlockAudio();
      setMuted(!state.muted);
      if (!state.muted) playSfx("confirm");
    });
    document.body.appendChild(button);
  }

  function playSfx(channel) {
    const pool = state.pools[channel] || state.pools.click;
    if (!pool || state.muted) return;
    const audio = pool.items[pool.index++ % pool.items.length];
    playAudio(audio);
  }

  async function loadUiPack() {
    if (!window.JSZip || document.getElementById("cmr-crispcute-ui")) return;
    try {
      const response = await fetch(ROOT + "CrispCute_Free_Sampler.zip");
      if (!response.ok) throw new Error("HTTP " + response.status);
      const zip = await window.JSZip.loadAsync(await response.arrayBuffer());
      const root = "CrispCute_Sampler/PNG/2x/";
      const assetPaths = {
        button: root + "strawberry/button_medium_normal.png",
        buttonHover: root + "strawberry/button_medium_hover.png",
        buttonPressed: root + "strawberry/button_medium_pressed.png",
        buttonDisabled: root + "strawberry/button_medium_disabled.png",
        roundButton: root + "strawberry/button_round_normal.png",
        closeButton: root + "strawberry/button_close_normal.png",
        panel: root + "strawberry/panel.png",
        panelInset: root + "strawberry/panel_inset.png",
        panelCloud: root + "strawberry/panel_cloud.png",
        dialog: root + "strawberry/dialog_box.png",
        nameTag: root + "strawberry/name_tag.png",
        tooltip: root + "strawberry/tooltip.png",
        slot: root + "strawberry/slot.png",
        slotSelected: root + "strawberry/slot_selected.png",
        coinPlate: root + "strawberry/coin_plate.png",
        ribbon: root + "strawberry/ribbon.png",
        starFull: root + "strawberry/star_full.png",
        heartFull: root + "strawberry/heart_full.png",
        heartEmpty: root + "strawberry/heart_empty.png",
        windowEars: root + "strawberry/window_ears.png",
        dialogContinue: root + "strawberry/dialog_continue.png",
        barTrack: root + "strawberry/bar_track.png",
        barHealth: root + "strawberry/bar_fill_health.png",
        barHeartCap: root + "strawberry/bar_cap_heart.png",
        hotbarSlot: root + "strawberry/hotbar_slot.png",
        settings: root + "icons/settings.png",
        play: root + "icons/play.png",
        pause: root + "icons/pause.png",
        close: root + "icons/close.png",
        check: root + "icons/check.png",
        home: root + "icons/home.png",
        heart: root + "icons/heart.png",
        star: root + "icons/star.png",
        coin: root + "icons/coin.png"
      };
      const vars = [];
      for (const [key, path] of Object.entries(assetPaths)) {
        const file = zip.file(path);
        if (!file) continue;
        const data = await file.async("base64");
        vars.push("--cmr-" + key + ':url("data:image/png;base64,' + data + '")');
      }
      const fontFile = zip.file("CrispCute_Sampler/fonts/Fredoka.ttf");
      let fontRule = "";
      if (fontFile) {
        const fontBlob = await fontFile.async("blob");
        const fontUrl = URL.createObjectURL(fontBlob);
        state.urls.push(fontUrl);
        fontRule = '@font-face{font-family:"CMR Fredoka";src:url("' + fontUrl + '") format("truetype");font-display:swap}';
      }
      const css = document.createElement("style");
      css.id = "cmr-crispcute-ui";
      css.textContent = fontRule + ":root{" + vars.join(";") + "}" +
        /* Keep the existing Egyptian palette; use the sampler as polished UI artwork. */
        ".primary-button{background:var(--cmr-button) center/100% 100% no-repeat!important;border:0!important;box-shadow:none!important;color:#54245e!important;text-shadow:0 1px #fff8!important}" +
        ".primary-button:not(:disabled):hover{background-image:var(--cmr-buttonHover)!important}" +
        ".primary-button:not(:disabled):active{background-image:var(--cmr-buttonPressed)!important;transform:translateY(1px) scale(.99)}" +
        ".primary-button:disabled{background-image:var(--cmr-buttonDisabled)!important}" +
        ".soft-button{background:var(--cmr-roundButton) center/100% 100% no-repeat!important;border:0!important;box-shadow:none!important;color:#fff!important}" +
        ".modal-card{background:var(--cmr-dialog) center/100% 100% no-repeat!important;border:0!important;box-shadow:0 12px 32px #09001899!important}" +
        ".modal-card h2{font-family:'CMR Fredoka',Cairo,sans-serif!important;text-shadow:0 1px 2px #48205e}" +
        ".royal-shop-card{background:var(--cmr-panelCloud) center/100% 100% no-repeat!important;border:0!important;box-shadow:0 12px 32px #09001899!important}" +
        ".shop-item{background:var(--cmr-slot) center/100% 100% no-repeat!important;border:0!important;border-radius:14px!important;padding:9px!important}" +
        ".shop-item button{background:var(--cmr-button) center/100% 100% no-repeat!important;border:0!important;box-shadow:none!important}" +
        ".booster{background:var(--cmr-slot) center/100% 100% no-repeat!important;border:0!important;box-shadow:none!important}" +
        ".booster.active{background-image:var(--cmr-slotSelected)!important}" +
        ".shop-close{background:var(--cmr-closeButton) center/contain no-repeat!important;border:0!important;font-size:0!important;min-width:36px;min-height:36px}" +
        ".toast{background:var(--cmr-tooltip) center/100% 100% no-repeat!important;border:0!important;box-shadow:none!important}" +
        ".art-objective{background:var(--cmr-panel) center/100% 100% no-repeat!important;padding:8px!important;border-radius:12px}" +
        ".art-message{background:var(--cmr-panelInset) center/100% 100% no-repeat!important;padding:7px!important}" +
        ".diff-tier-badge{background:var(--cmr-ribbon) center/100% 100% no-repeat!important;border:0!important}" +
        ".royal-heart-3d svg{display:none!important}" +
        ".royal-heart-3d{background:var(--cmr-heartFull) center/contain no-repeat!important}" +
        ".modal-crown{background:var(--cmr-nameTag) center/100% 100% no-repeat;padding:8px 18px}" +
        ".result-stars{color:#ffe18a;text-shadow:0 2px 4px #54245e}" +
        ".coin-pill{background:var(--cmr-coinPlate) center/100% 100% no-repeat!important;border:0!important}" +
        ".cmr-pack-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;font-size:0!important}" +
        ".cmr-pack-icon:before{content:'';display:block;width:22px;height:22px;background-image:var(--cmr-current-icon);background-size:contain;background-position:center;background-repeat:no-repeat}" +
        ".cmr-pack-icon[data-cmr-icon='settings']{--cmr-current-icon:var(--cmr-settings)}" +
        ".cmr-pack-icon[data-cmr-icon='play']{--cmr-current-icon:var(--cmr-play)}" +
        ".cmr-pack-icon[data-cmr-icon='pause']{--cmr-current-icon:var(--cmr-pause)}" +
        ".cmr-pack-icon[data-cmr-icon='close']{--cmr-current-icon:var(--cmr-close)}" +
        ".cmr-pack-icon[data-cmr-icon='home']{--cmr-current-icon:var(--cmr-home)}" +
        ".cmr-pack-icon[data-cmr-icon='heart']{--cmr-current-icon:var(--cmr-heart)}" +
        ".cmr-pack-icon[data-cmr-icon='star']{--cmr-current-icon:var(--cmr-star)}" +
        ".cmr-pack-icon[data-cmr-icon='coin']{--cmr-current-icon:var(--cmr-coin)}";
      document.head.appendChild(css);

      const iconTargets = [
        [".shop-close", "close"],
        ["#plusCoins", "coin"]
      ];
      for (const [selector, icon] of iconTargets) {
        const button = document.querySelector(selector);
        if (!button) continue;
        button.dataset.cmrIcon = icon;
        button.classList.add("cmr-pack-icon");
      }
      console.info("[CMR Assets] CrispCute UI artwork loaded:", Object.keys(assetPaths).length, "assets");
    } catch (error) {
      console.warn("[CMR Assets] CrispCute UI pack could not be loaded:", error);
    }
  }
  async function loadSfx() {
    if (!window.JSZip) {
      console.warn("[CMR Assets] JSZip missing; SFX skipped.");
      return;
    }
    try {
      const response = await fetch(ROOT + "Cozy_UI_Menu_SFX.zip");
      if (!response.ok) throw new Error("HTTP " + response.status);
      const zip = await window.JSZip.loadAsync(await response.arrayBuffer());
      const files = Object.keys(zip.files).filter(name =>
        !zip.files[name].dir &&
        !name.toLowerCase().includes("__macosx/") &&
        /\.(mp3|wav|ogg|m4a)$/i.test(name)
      );
      if (!files.length) return;

      const rules = {
        click: /(click|tap|select|button|press|tick)/i,
        pop: /(pop|bubble|plop|blip|boop)/i,
        confirm: /(confirm|accept|start|play|positive|success)/i,
        open: /(open|whoosh|slide|appear|expand|enter)/i,
        close: /(close|back|cancel|dismiss|exit)/i,
        reward: /(reward|win|chime|coin|star|fanfare|sparkle|bonus)/i,
        error: /(error|deny|invalid|fail|locked|negative)/i
      };
      const used = new Set();
      for (const [channel, pattern] of Object.entries(rules)) {
        const entry = files.find(name => !used.has(name) && pattern.test(name));
        if (!entry) continue;
        used.add(entry);
        const blob = await zip.file(entry).async("blob");
        const url = URL.createObjectURL(blob);
        state.urls.push(url);
        state.pools[channel] = {
          items: [0, 1, 2].map(() => {
            const audio = new Audio(url);
            audio.preload = "auto";
            audio.volume = channel === "reward" ? .68 : .5;
            return audio;
          }),
          index: 0
        };
      }
    } catch (error) {
      console.warn("[CMR Assets] SFX archive could not be loaded:", error);
    }
  }

  function init() {
    addStyles();
    mountAudioToggle();

    try {
      state.bgm = new Audio(ROOT + "preview.mp3");
      state.bgm.loop = true;
      state.bgm.volume = .22;
      state.bgm.preload = "auto";
      if (state.unlocked && !state.muted) {
        const promise = state.bgm.play();
        if (promise && promise.catch) promise.catch(() => {});
      }
    } catch (_) {}

    ["pointerdown", "touchstart", "keydown"].forEach(type => {
      window.addEventListener(type, unlockAudio, { once: true, passive: true });
    });

    document.addEventListener("click", event => {
      const target = event.target && event.target.closest
        ? event.target.closest("button, [role='button'], .wm-house, .wm-realm")
        : null;
      if (!target || target.id === "cmrAudioToggleBtn") return;
      if (target.disabled || target.classList.contains("disabled")) {
        playSfx("error");
        return;
      }
      const identity = ((target.id || "") + " " + (target.className || "")).toLowerCase();
      if (/(paintbtn|shufflebtn|bombbtn|colorbtn|rocketbtn|booster)/.test(identity)) playSfx("pop");
      else if (/(close|cancel|back|dismiss)/.test(identity)) playSfx("close");
      else if (/(play|start|confirm|next|retry)/.test(identity)) playSfx("confirm");
      else if (/(map|world|shop|settings)/.test(identity)) playSfx("open");
      else playSfx("click");
    }, true);

    loadSfx();
    loadUiPack();
  }

  window.CMR_ASSETS = {
    playSfx,
    setMuted,
    isMuted: () => state.muted
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();