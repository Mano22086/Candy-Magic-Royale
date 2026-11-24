```javascript
/* ============================================================================
 * Candy Magic Royale — Safe Non-Destructive Assets Add-on (candy-pack-addon.js)
 * Loads candy-assets-pack.zip via JSZip and upgrades buttons, icons, boosters,
 * sound effects, and loading splash WITHOUT modifying or breaking index.html,
 * the Pharaoh Dragon, Queen, 50 board backgrounds, or Win/Loss screens.
 * ============================================================================ */
(function () {
  'use strict';

  if (window.__CANDY_PACK_LOADED__) return;
  window.__CANDY_PACK_LOADED__ = true;

  const ZIP_CANDIDATES = [
    './candy-assets-pack.zip',
    'candy-assets-pack.zip',
    'https://cdn.jsdelivr.net/gh/Mano22086/Candy-Magic-Royale@main/candy-assets-pack.zip'
  ];

  const PACK = {
    ready: false,
    images: {},
    sounds: {},
    loadingVideo: null,
    muted: false,
    playSound: function () {}
  };
  window.CANDY_PACK = PACK;

  try {
    PACK.muted = localStorage.getItem('candy_pack_muted') === '1';
  } catch (e) {}

  // ---- 1. Safe Web Audio SFX Engine ----
  let audioCtx = null;
  const audioBuffers = {};

  function unlockAudio() {
    try {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(function () {});
      }
    } catch (e) {}
  }

  window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });

  PACK.playSound = function (name, rate, vol) {
    if (PACK.muted || !PACK.sounds[name]) return;
    unlockAudio();
    const r = rate || 1.0;
    const v = vol != null ? vol : 0.68;
    try {
      if (audioCtx && audioBuffers[name]) {
        const src = audioCtx.createBufferSource();
        const gain = audioCtx.createGain();
        src.buffer = audioBuffers[name];
        src.playbackRate.value = r;
        gain.gain.value = v;
        src.connect(gain);
        gain.connect(audioCtx.destination);
        src.start(0);
        return;
      }
      const a = new Audio(PACK.sounds[name]);
      a.volume = v;
      a.playbackRate = r;
      a.play().catch(function () {});
    } catch (e) {}
  };

  // ---- 2. Ensure JSZip is available ----
  function ensureJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return new Promise(function (resolve, reject) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
      s.onload = function () { resolve(window.JSZip); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function fetchPackZip() {
    for (let i = 0; i < ZIP_CANDIDATES.length; i++) {
      try {
        const res = await fetch(ZIP_CANDIDATES[i]);
        if (res.ok) return await res.arrayBuffer();
      } catch (e) {}
    }
    return null;
  }

  // ---- 3. Inject Minimal Scoped CSS (never overrides dragon/boards/win3) ----
  function injectStyles() {
    if (document.getElementById('candy-pack-addon-style')) return;
    const css = `
      #candy-pack-splash {
        position: fixed; inset: 0; z-index: 99998;
        background: radial-gradient(circle at 50% 38%, #3c1882 0%, #160933 80%);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 12px; transition: opacity 0.45s ease; pointer-events: none;
      }
      #candy-pack-splash.fade { opacity: 0; }
      #candy-pack-splash img.cp-crown {
        width: 78px; filter: drop-shadow(0 6px 14px rgba(255,213,79,0.6));
      }
      #candy-pack-splash video {
        width: min(290px, 78vw); mix-blend-mode: screen;
        filter: brightness(1.15) contrast(1.15);
      }
      #candy-pack-mute-fab {
        position: fixed; bottom: 14px; left: 14px; z-index: 9990;
        width: 44px; height: 44px; padding: 0; border: none; background: transparent;
        cursor: pointer; transition: transform 0.14s ease;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45));
      }
      #candy-pack-mute-fab:active { transform: scale(0.9); }
      #candy-pack-mute-fab img { width: 100%; height: 100%; object-fit: contain; display: block; }
      .cp-skinned-btn {
        background-size: 100% 100% !important;
        background-repeat: no-repeat !important;
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
        transition: transform 0.12s ease, filter 0.12s ease !important;
      }
      .cp-skinned-btn:active { transform: scale(0.93) !important; }
      .cp-booster-icon {
        width: 76% !important; height: 76% !important; object-fit: contain !important;
        pointer-events: none; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.5));
      }
    `;
    const style = document.createElement('style');
    style.id = 'candy-pack-addon-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ---- 4. Brief Non-Blocking Loading Bar Splash ----
  function showBriefSplash() {
    if (!PACK.loadingVideo || document.getElementById('candy-pack-splash')) return;
    const wrap = document.createElement('div');
    wrap.id = 'candy-pack-splash';
    wrap.innerHTML =
      (PACK.images.crown ? '<img class="cp-crown" src="' + PACK.images.crown + '" alt="" />' : '') +
      '<video autoplay muted playsinline loop src="' + PACK.loadingVideo + '"></video>';
    document.body.appendChild(wrap);
    setTimeout(function () {
      wrap.classList.add('fade');
      setTimeout(function () { wrap.remove(); }, 480);
    }, 1150);
  }

  // ---- 5. Floating Sound Toggle ----
  function mountMuteButton() {
    if (document.getElementById('candy-pack-mute-fab')) return;
    const btn = document.createElement('button');
    btn.id = 'candy-pack-mute-fab';
    btn.title = 'تشغيل / كتم المؤثرات';
    const img = document.createElement('img');
    img.alt = 'Sound';
    const sync = function () {
      img.src = PACK.muted ? PACK.images.icon_mute : PACK.images.icon_volume;
    };
    sync();
    btn.appendChild(img);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      PACK.muted = !PACK.muted;
      try { localStorage.setItem('candy_pack_muted', PACK.muted ? '1' : '0'); } catch (err) {}
      sync();
      if (!PACK.muted) PACK.playSound('click');
    });
    document.body.appendChild(btn);
  }

  // ---- 6. Safe DOM Skinning (Skips Dragon, Board Canvas, Win3/Loss3 Overlays) ----
  function isProtected(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.closest('#candy-pack-mute-fab, #candy-pack-splash, canvas, [id*="dragon"], [class*="dragon"], [id*="royal-win"], [id*="royal-loss"]')) {
      return true;
    }
    return false;
  }

  const BOOSTER_RULES = [
    { re: /hammer|مطرقة|شاكوش/i, key: 'booster_hammer' },
    { re: /rocket|صاروخ/i,       key: 'booster_rocket' },
    { re: /bomb|قنبلة/i,         key: 'booster_bomb' },
    { re: /light|zap|صاعقة|برق/i, key: 'booster_lightning' },
    { re: /shuff|magic|خلط|سحر/i, key: 'booster_mystery' }
  ];

  const ICON_BTN_RULES = [
    { re: /setting|إعدادات|اعدادات|⚙/i, key: 'icon_settings' },
    { re: /pause|إيقاف|ايقاف|⏸/i,       key: 'icon_pause' },
    { re: /shop|store|متجر|🛒/i,        key: 'icon_cart' },
    { re: /trophy|leader|إنجاز|ترتيب|🏆/i, key: 'icon_trophy' },
    { re: /home|خريطة|رئيسية|🏠/i,      key: 'icon_home' },
    { re: /mail|daily|رسائل|هدية|🎁/i,  key: 'icon_mail' },
    { re: /close|إغلاق|اغلاق|^×$|^✕$|^X$/i, key: 'btn_close_round' }
  ];

  function enhanceDOM() {
    if (!PACK.ready) return;
    const buttons = document.querySelectorAll('button, .btn, [role="button"]');
    buttons.forEach(function (el) {
      if (el.dataset.cpEnhanced || isProtected(el)) return;
      const hint = ((el.id || '') + ' ' + (el.className || '') + ' ' + (el.textContent || '') + ' ' + (el.title || '')).trim();
      if (!hint) return;

      // Upgrade booster slots with real booster sprites + slot_empty background
      for (let i = 0; i < BOOSTER_RULES.length; i++) {
        const rule = BOOSTER_RULES[i];
        if (rule.re.test(hint) && PACK.images[rule.key]) {
          el.dataset.cpEnhanced = 'booster';
          if (PACK.images.slot_empty) {
            el.classList.add('cp-skinned-btn');
            el.style.backgroundImage = 'url(' + PACK.images.slot_empty + ')';
          }
          const existingImg = el.querySelector('img');
          if (existingImg) {
            existingImg.src = PACK.images[rule.key];
            existingImg.classList.add('cp-booster-icon');
          }
          return;
        }
      }

      // Upgrade small icon-only buttons cleanly
      const textOnly = (el.textContent || '').trim();
      const rect = el.getBoundingClientRect();
      const isCompact = rect.width > 0 && rect.width <= 68 && rect.height <= 68 && textOnly.length <= 3;
      if (isCompact) {
        for (let i = 0; i < ICON_BTN_RULES.length; i++) {
          const rule = ICON_BTN_RULES[i];
          if (rule.re.test(hint) && PACK.images[rule.key]) {
            el.dataset.cpEnhanced = 'icon';
            el.classList.add('cp-skinned-btn');
            el.style.backgroundImage = 'url(' + PACK.images[rule.key] + ')';
            el.style.color = 'transparent';
            return;
          }
        }
      }
    });
  }

  // ---- 7. Global Delegated Sound Hooks (Zero Impact on Existing Clicks) ----
  function bindGlobalSoundHooks() {
    document.addEventListener('click', function (e) {
      const btn = e.target && e.target.closest ? e.target.closest('button, .btn, [role="button"]') : null;
      if (!btn || btn.id === 'candy-pack-mute-fab') return;
      const txt = ((btn.textContent || '') + ' ' + (btn.id || '') + ' ' + (btn.className || '')).toLowerCase();
      if (/close|back|cancel|quit|رجوع|إغلاق|خروج|×/.test(txt)) {
        PACK.playSound('cancel', 1.0, 0.55);
      } else if (/play|start|next|continue|العب|ابدأ|التالي|استمرار/.test(txt)) {
        PACK.playSound('confirm', 1.0, 0.65);
      } else if (/buy|shop|claim|شراء|استلام|هدية|صندوق/.test(txt)) {
        PACK.playSound('coin', 1.0, 0.7);
      } else if (/hammer|مطرقة/.test(txt)) {
        PACK.playSound('mallet', 1.0, 0.7);
      } else if (/rocket|صاروخ/.test(txt)) {
        PACK.playSound('swish', 1.0, 0.7);
      } else {
        PACK.playSound('click', 1.0, 0.5);
      }
    }, true);

    // Watch for win/loss modals to play Victory/Lose sounds automatically
    let lastAlertAt = 0;
    const obs = new MutationObserver(function () {
      enhanceDOM();
      const now = Date.now();
      if (now - lastAlertAt < 2500) return;
      const bodyText = document.body ? document.body.innerText : '';
      if (/مبروك الفوز|level complete|victory/i.test(bodyText)) {
        const visibleWin = document.querySelector('[id*="win"]:not([style*="display: none"]), .modal.active, .popup.show');
        if (visibleWin) {
          lastAlertAt = now;
          PACK.playSound('win', 1.0, 0.75);
        }
      }
    });
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    }
  }

  // ---- 8. Bootstrap ----
  async function boot() {
    try {
      injectStyles();
      const JSZipLib = await ensureJSZip();
      const buf = await fetchPackZip();
      if (!buf) {
        console.warn('[CandyPack] candy-assets-pack.zip not found yet; running original game untouched.');
        return;
      }
      const zip = await JSZipLib.loadAsync(buf);
      const tasks = [];
      zip.forEach(function (relPath, entry) {
        if (entry.dir) return;
        tasks.push((async function () {
          if (relPath.startsWith('img/') && relPath.endsWith('.webp')) {
            const key = relPath.slice(4, -5);
            const blob = await entry.async('blob');
            PACK.images[key] = URL.createObjectURL(new Blob([blob], { type: 'image/webp' }));
          } else if (relPath.startsWith('snd/') && relPath.endsWith('.mp3')) {
            const key = relPath.slice(4, -4);
            const ab = await entry.async('arraybuffer');
            PACK.sounds[key] = URL.createObjectURL(new Blob([ab], { type: 'audio/mpeg' }));
            if (audioCtx) {
              audioCtx.decodeAudioData(ab.slice(0), function (decoded) { audioBuffers[key] = decoded; }, function () {});
            }
          } else if (relPath === 'loading_bar.mp4') {
            const blob = await entry.async('blob');
            PACK.loadingVideo = URL.createObjectURL(new Blob([blob], { type: 'video/mp4' }));
          }
        })());
      });
      await Promise.all(tasks);
      PACK.ready = true;
      showBriefSplash();
      mountMuteButton();
      enhanceDOM();
      bindGlobalSoundHooks();
      window.dispatchEvent(new CustomEvent('candy-pack-ready', { detail: PACK }));
    } catch (err) {
      console.warn('[CandyPack] Safe fallback triggered:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
```
