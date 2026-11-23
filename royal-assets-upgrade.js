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
    if (!window.JSZip) return;
    try {
      const response = await fetch(ROOT + "CrispCute_Free_Sampler.zip");
      if (!response.ok) throw new Error("HTTP " + response.status);
      const zip = await window.JSZip.loadAsync(await response.arrayBuffer());
      const iconNames = ["settings", "play", "pause", "close", "check", "home", "heart", "star", "coin"];
      const css = document.createElement("style");
      css.id = "cmr-crispcute-ui";
      const rules = [];
      for (const name of iconNames) {
        const path = "CrispCute_Sampler/PNG/2x/icons/" + name + ".png";
        const file = zip.file(path);
        if (!file) continue;
        const data = await file.async("base64");
        rules.push("--cmr-icon-" + name + ':url("data:image/png;base64,' + data + '")');
      }
      if (!rules.length) return;
      css.textContent = ":root{" + rules.join(";") + "}" +
        ".icon-button.cmr-pack-icon{font-size:0!important;display:inline-grid!important;place-items:center!important}" +
        ".icon-button.cmr-pack-icon:before{content:'';display:block;width:24px;height:24px;background-image:var(--cmr-current-icon);background-size:contain;background-position:center;background-repeat:no-repeat;filter:drop-shadow(0 1px 2px #17082f)}" +
        ".icon-button.cmr-pack-icon[data-cmr-icon='settings']{--cmr-current-icon:var(--cmr-icon-settings)}" +
        ".icon-button.cmr-pack-icon[data-cmr-icon='play']{--cmr-current-icon:var(--cmr-icon-play)}" +
        ".icon-button.cmr-pack-icon[data-cmr-icon='pause']{--cmr-current-icon:var(--cmr-icon-pause)}" +
        ".icon-button.cmr-pack-icon[data-cmr-icon='close']{--cmr-current-icon:var(--cmr-icon-close)}" +
        ".icon-button.cmr-pack-icon[data-cmr-icon='home']{--cmr-current-icon:var(--cmr-icon-home)}" +
        ".icon-button.cmr-pack-icon[data-cmr-icon='heart']{--cmr-current-icon:var(--cmr-icon-heart)}" +
        ".icon-button.cmr-pack-icon[data-cmr-icon='star']{--cmr-current-icon:var(--cmr-icon-star)}" +
        ".icon-button.cmr-pack-icon[data-cmr-icon='coin']{--cmr-current-icon:var(--cmr-icon-coin)}";
      document.head.appendChild(css);

      const patterns = [
        ["settings", /settings|إعدادات|ضبط/i],
        ["play", /play|start|ابدأ|لعب/i],
        ["pause", /pause|إيقاف مؤقت/i],
        ["close", /close|إغلاق|قفل|خروج/i],
        ["home", /home|الرئيسية|البيت/i],
        ["heart", /heart|life|حياة|قلب/i],
        ["star", /star|نجمة|نجوم/i],
        ["coin", /coin|عملة|ذهب/i]
      ];
      document.querySelectorAll(".icon-button").forEach(button => {
        const label = [button.getAttribute("aria-label"), button.title, button.textContent].filter(Boolean).join(" ");
        const match = patterns.find(([key, pattern]) => pattern.test(label));
        if (match) {
          button.dataset.cmrIcon = match[0];
          button.classList.add("cmr-pack-icon");
        }
      });
      console.info("[CMR Assets] CrispCute icon set integrated:", iconNames.length);
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