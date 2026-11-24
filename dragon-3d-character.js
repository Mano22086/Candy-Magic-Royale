```javascript
/**
 * Candy Magic Royale - Lightweight All-in-One Suite (v9 — ~15 KB, ZERO base64)
 * Loads all 50 HD board backgrounds (`board_01..50`) + exact Win 3 (`win3.jpg`)
 * + exact Loss 3 (`loss3.jpg`) directly from `Candy-Magic-Royale-50-Boards-HD.zip` via JSZip.
 */
(function () {
  "use strict";

  const CFG = {
    root: "./",
    dragonFile: "dragon-character.glb",
    packZip: "./Candy-Magic-Royale-50-Boards-HD.zip",
    cooldownMs: 900,
  };

  let lastAnimAt = 0;
  let matchAnimIndex = 0;
  let winArtUrl = null;
  let lossArtUrl = null;

  function waitForGlobal(checkFn, timeoutMs) {
    return new Promise((resolve, reject) => {
      const t0 = Date.now();
      (function poll() {
        const v = checkFn();
        if (v) { resolve(v); return; }
        if (Date.now() - t0 > timeoutMs) { reject(new Error("Timeout")); return; }
        setTimeout(poll, 150);
      })();
    });
  }

  function injectStyles() {
    if (document.getElementById("cmr-v9-styles")) return;
    const st = document.createElement("style");
    st.id = "cmr-v9-styles";
    st.textContent = `
      html.cmr-boards-active,
      html.cmr-boards-active body {
        background-color: transparent !important;
      }
      #cmr-palace-board-bg {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100dvh !important;
        z-index: 0 !important;
        pointer-events: none !important;
        background-position: center center !important;
        background-size: cover !important;
        background-repeat: no-repeat !important;
        opacity: 0;
        transition: opacity 0.35s ease;
      }
      #cmr-palace-board-bg.cmr-bg-ready { opacity: 1 !important; }
      .cmr-old-bg-hidden {
        background-image: none !important;
        background-color: transparent !important;
      }

      /* 3D Pharaoh Dragon Overlay */
      .dragon-3d-replaced { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
      .dragon-3d-overlay {
        position: fixed !important; overflow: hidden !important; cursor: pointer;
        -webkit-tap-highlight-color: transparent; pointer-events: auto !important;
        background: transparent !important; z-index: 30 !important;
      }
      .dragon-3d-canvas {
        position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important;
        display: block !important; background: transparent !important; outline: none !important;
        touch-action: manipulation; z-index: 2;
      }
      .dragon-3d-overlay.d3d-fx-gold::after,
      .dragon-3d-overlay.d3d-fx-purple::after,
      .dragon-3d-overlay.d3d-fx-cyan::after {
        content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 5;
        animation: d3dGlow 0.95s ease-out forwards;
      }
      .dragon-3d-overlay.d3d-fx-gold::after { background: radial-gradient(circle at 50% 45%, rgba(255,224,96,.55) 0%, rgba(255,168,48,.22) 48%, transparent 74%); }
      .dragon-3d-overlay.d3d-fx-purple::after { background: radial-gradient(circle at 50% 45%, rgba(224,120,255,.55) 0%, rgba(140,50,255,.22) 48%, transparent 74%); }
      .dragon-3d-overlay.d3d-fx-cyan::after { background: radial-gradient(circle at 50% 45%, rgba(100,240,255,.52) 0%, rgba(180,110,255,.2) 48%, transparent 74%); }
      @keyframes d3dGlow { 0% { opacity: 0; transform: scale(.8); } 35% { opacity: 1; transform: scale(1.08); } 100% { opacity: 0; transform: scale(1.25); } }

      /* Win 3 & Loss 3 Exact Artwork Overlay */
      .cmr-native-hidden { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
      .cmr-art-backdrop {
        position: fixed; inset: 0; z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        background: rgba(14, 7, 32, 0.88); backdrop-filter: blur(6px);
        overflow: hidden; user-select: none; -webkit-tap-highlight-color: transparent;
        animation: cmrFadeIn 0.28s ease-out forwards;
      }
      .cmr-art-frame {
        position: relative; height: 100dvh; max-height: 100vh;
        aspect-ratio: 9 / 16; max-width: 100vw; border-radius: 14px; overflow: hidden;
        box-shadow: 0 0 45px rgba(0, 0, 0, 0.75);
        animation: cmrArtPopIn 0.56s cubic-bezier(0.2, 1.28, 0.34, 1) forwards,
                   cmrArtFloat 3.8s ease-in-out 0.6s infinite;
      }
      .cmr-art-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
      .cmr-art-fx { position: absolute; inset: 0; pointer-events: none; z-index: 3; overflow: hidden; }
      .cmr-cft { position: absolute; top: -14px; width: 9px; height: 15px; border-radius: 2px; opacity: 0.9; animation: cmrCftFall var(--dur, 4s) linear var(--del, 0s) infinite; }
      .cmr-glint { position: absolute; width: 7px; height: 7px; border-radius: 50%; background: radial-gradient(circle, #fff 0%, rgba(190, 215, 255, 0) 70%); animation: cmrGlintPulse var(--dur, 3s) ease-in-out var(--del, 0s) infinite alternate; }
      .cmr-hotspot {
        position: absolute; z-index: 5; background: transparent; border: none; border-radius: 999px;
        cursor: pointer; padding: 0; margin: 0; overflow: hidden; -webkit-tap-highlight-color: transparent;
        transition: transform 0.12s ease, background-color 0.12s ease;
      }
      .cmr-hotspot:active { transform: scale(0.95); background-color: rgba(255, 255, 255, 0.18); }
      .cmr-hotspot-shine::after {
        content: ""; position: absolute; top: 0; left: -120%; width: 55%; height: 100%;
        background: linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.45) 50%, transparent 80%);
        animation: cmrShine 2.7s ease-in-out 0.8s infinite;
      }
      @keyframes cmrFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes cmrArtPopIn { 0% { opacity: 0; transform: scale(0.76) translateY(32px); } 68% { opacity: 1; transform: scale(1.03) translateY(-3px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes cmrArtFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
      @keyframes cmrShine { 0% { left: -120%; } 42%, 100% { left: 140%; } }
      @keyframes cmrCftFall { 0% { transform: translateY(-16px) rotate(0deg); opacity: 0.95; } 100% { transform: translateY(104vh) rotate(520deg); opacity: 0.3; } }
      @keyframes cmrGlintPulse { 0% { opacity: 0.2; transform: scale(0.7); } 100% { opacity: 0.95; transform: scale(1.35); } }
    `;
    document.head.appendChild(st);
  }

  /* =====================================================================
   * 1. ZIP LOADER: 50 HD BOARDS + WIN 3 + LOSS 3 (ZERO BASE64 IN JS!)
   * ===================================================================== */
  function initPackSystem() {
    let bgLayer = document.getElementById("cmr-palace-board-bg");
    if (!bgLayer) {
      bgLayer = document.createElement("div");
      bgLayer.id = "cmr-palace-board-bg";
      document.body.insertBefore(bgLayer, document.body.firstChild);
    }

    let zipObj = null;
    let boardNames = [];
    const urlCache = new Map();
    let activeSlot = -1;

    function detectLevel() {
      for (const k of ["currentLevel", "levelNumber", "activeLevel", "lvl"]) {
        if (typeof window[k] === "number" && window[k] >= 1) return Math.floor(window[k]);
      }
      const els = document.querySelectorAll("#level, #levelTitle, .level-badge, .level-pill, [class*='level'], [id*='level'], span, div");
      for (const el of els) {
        if (el.children.length > 2) continue;
        const txt = (el.textContent || "").trim();
        if (!txt || txt.length > 48) continue;
        const m = txt.match(/(?:المرحلة|المستوى|بيت|level|lvl|stage)\s*[:#-]?\s*(\d+)/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n >= 1) return n;
        }
      }
      return 1;
    }

    function revealBackgroundThroughGame() {
      document.documentElement.classList.add("cmr-boards-active");
      // Make full-screen opaque wrapper backgrounds transparent so #cmr-palace-board-bg shows through
      const wrappers = document.querySelectorAll("#app, .app, .game-shell, .game-wrap, .game-screen, .art-bg, .bg-layer, main");
      wrappers.forEach((w) => w.classList.add("cmr-old-bg-hidden"));

      // Hide old background videos if present
      document.querySelectorAll("video").forEach((v) => {
        const r = v.getBoundingClientRect();
        if (r.width >= window.innerWidth * 0.85 && r.height >= window.innerHeight * 0.7) {
          v.style.opacity = "0";
        }
      });

      // Make main Babylon scene clearColor transparent & hide full-screen bg plane
      const B = window.BABYLON;
      if (B && B.Engine && Array.isArray(B.Engine.Instances)) {
        for (const eng of B.Engine.Instances) {
          for (const sc of eng.scenes || []) {
            if (sc === window.__cmrDragonScene) continue;
            sc.clearColor = new B.Color4(0, 0, 0, 0);
            (sc.meshes || []).forEach((m) => {
              if (/^(bg|background|sky|backdrop|videoBg)/i.test(m.name || "")) {
                m.isVisible = false;
              }
            });
          }
        }
      }
    }

    async function applyBoardForLevel(lv) {
      if (!zipObj || !boardNames.length) return;
      const slot = (Math.max(1, lv) - 1) % boardNames.length;
      if (slot === activeSlot) return;
      activeSlot = slot;

      const name = boardNames[slot];
      let url = urlCache.get(name);
      if (!url) {
        const f = zipObj.file(name);
        if (!f) return;
        url = URL.createObjectURL(await f.async("blob"));
        urlCache.set(name, url);
      }
      bgLayer.style.backgroundImage = `url("${url}")`;
      bgLayer.classList.add("cmr-bg-ready");
      revealBackgroundThroughGame();
    }

    async function loadPack() {
      try {
        await waitForGlobal(() => window.JSZip, 12000);
      } catch (_) {
        console.warn("[CMR] JSZip not available");
        return;
      }
      try {
        const resp = await fetch(CFG.packZip, { cache: "force-cache" });
        if (!resp.ok) return;
        zipObj = await window.JSZip.loadAsync(await resp.arrayBuffer());

        // Extract Win 3 & Loss 3 exact artworks if present inside the ZIP
        const wf = zipObj.file("win3.jpg");
        if (wf) winArtUrl = URL.createObjectURL(await wf.async("blob"));
        const lf = zipObj.file("loss3.jpg");
        if (lf) lossArtUrl = URL.createObjectURL(await lf.async("blob"));

        // Collect all 50 board backgrounds sorted 01..50
        boardNames = Object.keys(zipObj.files)
          .filter((n) => !zipObj.files[n].dir && /^board_\d+/i.test(n))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        if (boardNames.length) {
          let lastLv = detectLevel();
          await applyBoardForLevel(lastLv);
          setInterval(() => {
            const cur = detectLevel();
            if (cur !== lastLv) { lastLv = cur; applyBoardForLevel(cur); }
          }, 600);
        }
      } catch (e) {
        console.warn("[CMR] Pack load error:", e);
      }
    }

    loadPack();
    window.CandyMagicBoards = { setLevel: (n) => applyBoardForLevel(n), count: () => boardNames.length };
  }

  /* =====================================================================
   * 2. WIN 3 & LOSS 3 SCREENS (LOSS-FIRST DETECTION)
   * ===================================================================== */
  function showExactScreen(mode, nativeEl) {
    const artSrc = mode === "win" ? winArtUrl : lossArtUrl;
    if (!artSrc) return; // Wait until pack loads
    removeExactScreen();
    injectStyles();

    const backdrop = document.createElement("div");
    backdrop.id = "cmr-exact-screen";
    backdrop.className = "cmr-art-backdrop";

    let fxHtml = "";
    if (mode === "win") {
      const colors = ["#ff5ea8", "#ffd84d", "#4de6c2", "#a95cff", "#ff8a3d", "#5bc8ff"];
      for (let i = 0; i < 22; i++) {
        fxHtml += `<span class="cmr-cft" style="left:${(i * 4.5 + (i % 3) * 1.5) % 98}%;background:${colors[i % colors.length]};--dur:${(3.1 + (i % 5) * 0.6).toFixed(2)}s;--del:${((i % 7) * 0.4).toFixed(2)}s"></span>`;
      }
    } else {
      for (let i = 0; i < 16; i++) {
        fxHtml += `<span class="cmr-glint" style="left:${(i * 6.3) % 94}%;top:${(i * 8.1) % 92}%;--dur:${(2.4 + (i % 4) * 0.7).toFixed(2)}s;--del:${((i % 5) * 0.35).toFixed(2)}s"></span>`;
      }
    }

    const hotspots = mode === "win"
      ? `<button class="cmr-hotspot cmr-hotspot-shine" data-cmr-act="next" style="left:19%;top:72%;width:62%;height:9.8%"></button>
         <button class="cmr-hotspot" data-cmr-act="retry" style="left:18%;top:83.5%;width:31%;height:6.8%"></button>
         <button class="cmr-hotspot" data-cmr-act="map" style="left:51%;top:83.5%;width:31%;height:6.8%"></button>`
      : `<button class="cmr-hotspot cmr-hotspot-shine" data-cmr-act="video" style="left:22%;top:57.5%;width:56%;height:10.2%"></button>
         <button class="cmr-hotspot" data-cmr-act="retry" style="left:20%;top:69%;width:29%;height:7.8%"></button>
         <button class="cmr-hotspot" data-cmr-act="map" style="left:51%;top:69%;width:29%;height:7.8%"></button>`;

    backdrop.innerHTML = `<div class="cmr-art-frame"><img class="cmr-art-img" src="${artSrc}" alt=""><div class="cmr-art-fx">${fxHtml}</div>${hotspots}</div>`;
    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cmr-act]");
      if (!btn) return;
      const act = btn.getAttribute("data-cmr-act");

      function clickNative(re) {
        if (!nativeEl) return false;
        const btns = Array.from(nativeEl.querySelectorAll("button, .btn, [role='button']"))
          .filter((b) => getComputedStyle(b).display !== "none" && getComputedStyle(b).visibility !== "hidden");
        const found = btns.find((b) => re.test((b.textContent || "").trim()));
        if (found) { found.click(); return true; }
        return false;
      }

      if (act === "next") { if (!clickNative(/(المرحلة التالية|التالي|استمرار|next|continue)/i)) { const b = document.querySelector("#nextBtn"); if (b) b.click(); } }
      else if (act === "retry") { if (!clickNative(/(إعادة|حاول|retry|restart|again)/i)) { const b = document.querySelector("#restartBtn"); if (b) b.click(); } }
      else if (act === "map") { if (!clickNative(/(الخريطة|القائمة|map|home|menu|استمرار)/i)) { const b = document.querySelector("#mapBtn, .map-btn, #homeBtn"); if (b) b.click(); } }
      else if (act === "video") { if (!clickNative(/(فيديو|إعلان|\+5|حركات|video|ad|moves)/i)) { const b = document.querySelector("#movesBtn"); if (b) b.click(); } }

      removeExactScreen();
      if (nativeEl) setTimeout(() => nativeEl.classList.remove("cmr-native-hidden"), 350);
    });

    if (mode === "win" && window.Dragon3DCharacter) window.Dragon3DCharacter.playCelebrate();
  }

  function removeExactScreen() {
    const el = document.getElementById("cmr-exact-screen");
    if (el) el.remove();
  }

  function initWinLossWatcher() {
    const LOSS_RE = /(خسارة|انتهت الحركات|نفدت الحركات|حاول مرة|للأسف|فشلت|لم تكتمل|لا توجد حركات|game over|out of moves|try again|defeat|failed|you lose)/i;
    const WIN_RE = /(انتصار\s*سحري|انتصار|فوز|أحسنت|مبروك|اكتملت المرحلة|أنقذت|victory|you win|level complete)/i;
    let activeNative = null;

    function getNonButtonText(el) {
      const c = el.cloneNode(true);
      c.querySelectorAll("button, .btn, [role='button'], script, style").forEach((n) => n.remove());
      return (c.textContent || "").replace(/\s+/g, " ").trim();
    }

    function scan() {
      if (activeNative) {
        const cs = document.body.contains(activeNative) ? getComputedStyle(activeNative) : null;
        if (!cs || cs.display === "none" || cs.visibility === "hidden") {
          activeNative.dataset.cmrHandled = "0";
          activeNative = null;
        }
      }
      if (document.getElementById("cmr-exact-screen")) return;

      const headings = document.querySelectorAll("h1, h2, h3, .modal-title, [class*='title'], [id*='title'], [id*='modal'] p, [class*='modal'] p");
      for (const h of headings) {
        if (h.closest("#cmr-exact-screen") || h.closest("button")) continue;
        const hcs = getComputedStyle(h);
        if (hcs.display === "none" || hcs.visibility === "hidden" || parseFloat(hcs.opacity) === 0) continue;
        const txt = (h.textContent || "").trim();
        if (!txt || txt.length > 260 || (!LOSS_RE.test(txt) && !WIN_RE.test(txt))) continue;

        let box = h;
        while (box.parentElement && box.parentElement !== document.body) {
          const p = box.parentElement;
          const pcs = getComputedStyle(p);
          box = p;
          if ((pcs.position === "fixed" || pcs.position === "absolute") && p.getBoundingClientRect().width >= window.innerWidth * 0.7) break;
        }
        if (box === document.body || (box.dataset.cmrHandled === "1" && activeNative === box)) continue;

        const cleanTxt = getNonButtonText(box);
        const mode = LOSS_RE.test(cleanTxt) ? "loss" : (WIN_RE.test(cleanTxt) ? "win" : null);
        if (!mode) continue;

        box.classList.add("cmr-native-hidden");
        box.dataset.cmrHandled = "1";
        activeNative = box;
        showExactScreen(mode, box);
        return;
      }
    }

    setInterval(scan, 400);
    window.CandyMagicScreens = { showWin: () => showExactScreen("win", null), showLoss: () => showExactScreen("loss", null), close: removeExactScreen };
  }

  /* =====================================================================
   * 3. 3D PHARAOH DRAGON MODULE (RIGHT ARCH + FRONT FACING + 5 ANIMATIONS)
   * ===================================================================== */
  function hideOldGreenDragon(B, ownScene) {
    if (!B || !B.Engine || !Array.isArray(B.Engine.Instances)) return;
    function isGreenish(mat) {
      if (!mat) return false;
      const c = mat.albedoColor || mat.diffuseColor || mat.emissiveColor;
      return !!(c && c.g > 0.30 && c.g > c.r * 1.12);
    }
    for (const eng of B.Engine.Instances) {
      for (const sc of eng.scenes || []) {
        if (!sc || sc === ownScene) continue;
        const toHide = new Set();
        [].concat(sc.transformNodes || []).concat(sc.meshes || []).forEach((n) => {
          if (/(dragon|drg|mascot_right|right_char|green_char|dino|lizard)/i.test(n.name || "")) toHide.add(n);
        });
        (sc.meshes || []).forEach((m) => {
          if (!m || !m.isVisible) return;
          if (/(candy|tile|board|grid|frame|bg|video|queen|crown|heart|star|flower|diamond|swirl|cage|ice)/i.test(m.name || "")) return;
          if (isGreenish(m.material)) {
            const wp = typeof m.getAbsolutePosition === "function" ? m.getAbsolutePosition() : m.position;
            if (wp && wp.x > 0.15) {
              let top = m;
              while (top.parent && !/(root|scene|world|stage)/i.test(top.parent.name || "")) top = top.parent;
              toHide.add(top);
            }
          }
        });
        toHide.forEach((r) => {
          try {
            if (typeof r.setEnabled === "function") r.setEnabled(false);
            if ("isVisible" in r) r.isVisible = false;
            if (typeof r.getChildMeshes === "function") {
              r.getChildMeshes(false).forEach((ch) => { ch.isVisible = false; if (typeof ch.setEnabled === "function") ch.setEnabled(false); });
            }
          } catch (_) {}
        });
      }
    }
  }

  function computeRightArchRect() {
    const queenEl = document.querySelector(".art-queen");
    const dragonEl = document.querySelector(".art-dragon");
    const vw = window.innerWidth, vh = window.innerHeight;
    if (dragonEl && /dragon/i.test((dragonEl.src || "") + " " + (dragonEl.alt || ""))) dragonEl.classList.add("dragon-3d-replaced");
    if (queenEl) {
      const qr = queenEl.getBoundingClientRect();
      if (qr.width > 30 && qr.height > 30 && qr.left > vw * 0.44) {
        return { left: qr.left, top: qr.top, width: qr.width, height: qr.height, borderRadius: getComputedStyle(queenEl).borderRadius };
      }
    }
    const refW = Math.min(vw, 520), leftOff = (vw - refW) * 0.5;
    return { left: leftOff + refW * 0.525, top: Math.max(8, vh * 0.012), width: refW * 0.24, height: Math.min(vh * 0.19, refW * 0.34), borderRadius: "50% 50% 18% 18% / 55% 55% 15% 15%" };
  }

  async function mount() {
    if (window.__dragon3dV9Mounted) return;
    window.__dragon3dV9Mounted = true;
    injectStyles();
    initPackSystem();
    initWinLossWatcher();

    const host = document.createElement("div");
    host.className = "dragon-3d-overlay";
    host.id = "pharaoh-dragon-3d-host";
    document.body.appendChild(host);

    function syncPos() {
      const r = computeRightArchRect();
      host.style.left = Math.round(r.left) + "px";
      host.style.top = Math.round(r.top) + "px";
      host.style.width = Math.round(r.width) + "px";
      host.style.height = Math.round(r.height) + "px";
      host.style.borderRadius = r.borderRadius;
    }
    syncPos();

    const canvas = document.createElement("canvas");
    canvas.className = "dragon-3d-canvas";
    host.appendChild(canvas);

    const B = await waitForGlobal(() => window.BABYLON && window.BABYLON.SceneLoader && window.BABYLON, 20000);
    const engine = new B.Engine(canvas, true, { alpha: true, premultipliedAlpha: false, antialias: true, powerPreference: "high-performance" });
    engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));

    const scene = new B.Scene(engine);
    window.__cmrDragonScene = scene;
    scene.clearColor = new B.Color4(0, 0, 0, 0);

    hideOldGreenDragon(B, scene);
    setTimeout(() => hideOldGreenDragon(B, scene), 900);
    setTimeout(() => hideOldGreenDragon(B, scene), 2500);
    setTimeout(() => hideOldGreenDragon(B, scene), 5000);

    const camera = new B.ArcRotateCamera("pharaohCam", Math.PI / 2, Math.PI / 2.06, 1.32, new B.Vector3(0, 0.03, 0), scene);
    camera.minZ = 0.01; camera.fov = 0.72;

    const hemi = new B.HemisphericLight("dHemi", new B.Vector3(0, 1, 0.5), scene);
    hemi.intensity = 1.45; hemi.diffuse = new B.Color3(1, 0.98, 0.94); hemi.groundColor = new B.Color3(0.45, 0.26, 0.62);
    const key = new B.DirectionalLight("dKey", new B.Vector3(-0.3, -0.4, -0.85), scene);
    key.intensity = 1.65; key.diffuse = new B.Color3(1, 0.94, 0.8);
    const rim = new B.PointLight("dRim", new B.Vector3(0.5, 0.65, 1.3), scene);
    rim.intensity = 1.85; rim.diffuse = new B.Color3(0.95, 0.72, 1);

    const res = await B.SceneLoader.ImportMeshAsync("", CFG.root, CFG.dragonFile, scene);
    const root = res.meshes[0];
    res.meshes.forEach((m) => {
      if (m.material) { m.material.backFaceCulling = false; if ("metallic" in m.material) { m.material.metallic = 0.32; m.material.roughness = 0.52; } }
    });

    const choreo = new B.TransformNode("pharaohChoreo", scene);
    if (root) {
      root.parent = choreo;
      root.computeWorldMatrix(true);
      const b = root.getHierarchyBoundingVectors(true);
      if (b && b.min && b.max) {
        const c = b.min.add(b.max).scale(0.5), sz = b.max.subtract(b.min), md = Math.max(sz.x, sz.y, sz.z, 0.5);
        camera.target = new B.Vector3(c.x, c.y + md * 0.03, c.z);
        camera.radius = md * 1.42;
      }
    }

    const groups = res.animationGroups || [];
    const getG = (n) => groups.find((g) => g.name && g.name.toLowerCase() === n) || null;
    const idle = getG("idle") || groups[0] || null, celebrate = getG("celebrate"), tap = getG("tapreaction") || celebrate;
    groups.forEach((g) => { g.stop(); g.enableBlending = true; g.blendingSpeed = 0.12; });

    let activeClip = null, activeFX = null;
    function playIdle() { if (activeClip) { activeClip.stop(); activeClip = null; } if (idle && !idle.isPlaying) idle.start(true, 1, idle.from, idle.to, false); }
    function flashAura(cls) { host.classList.remove("d3d-fx-gold", "d3d-fx-purple", "d3d-fx-cyan"); void host.offsetWidth; host.classList.add(cls); }
    function playOnce(g, spd) {
      if (!g) return;
      if (idle && idle.isPlaying) idle.stop();
      if (activeClip && activeClip !== g) activeClip.stop();
      activeClip = g; g.reset(); g.start(false, spd || 1, g.from, g.to, false);
      g.onAnimationGroupEndObservable.clear();
      g.onAnimationGroupEndObservable.addOnce(() => { activeClip = null; playIdle(); });
    }
    function playNextMatch() {
      const now = performance.now();
      if (now - lastAnimAt < CFG.cooldownMs) return;
      lastAnimAt = now;
      const mode = matchAnimIndex % 5; matchAnimIndex++;
      if (mode === 0) { flashAura("d3d-fx-gold"); playOnce(celebrate || tap, 1.05); activeFX = { mode: 0, startTime: now, duration: 1350 }; }
      else if (mode === 1) { flashAura("d3d-fx-purple"); playOnce(tap || celebrate, 1.25); activeFX = { mode: 1, startTime: now, duration: 1050 }; }
      else if (mode === 2) { flashAura("d3d-fx-cyan"); playOnce(tap || celebrate, 1.15); activeFX = { mode: 2, startTime: now, duration: 1100 }; }
      else if (mode === 3) { flashAura("d3d-fx-gold"); playOnce(idle, 1.4); activeFX = { mode: 3, startTime: now, duration: 1000 }; }
      else { flashAura("d3d-fx-purple"); playOnce(celebrate || tap, 1.2); activeFX = { mode: 4, startTime: now, duration: 1300 }; }
    }
    function playTap() { flashAura("d3d-fx-cyan"); playOnce(tap || celebrate, 1.15); activeFX = { mode: 1, startTime: performance.now(), duration: 900 }; }

    playIdle();
    let t = 0;
    engine.runRenderLoop(() => {
      if (document.hidden) return;
      t += engine.getDeltaTime() * 0.001;
      if (activeFX) {
        const p = (performance.now() - activeFX.startTime) / activeFX.duration;
        if (p >= 1) { activeFX = null; choreo.position.set(0, 0, 0); choreo.rotation.set(0, 0, 0); choreo.scaling.set(1, 1, 1); }
        else {
          const s = Math.sin(p * Math.PI);
          if (activeFX.mode === 0) { choreo.position.set(0, s * 0.08, 0); choreo.rotation.set(0, 0, Math.sin(p * Math.PI * 2) * 0.08); const sc = 1 + s * 0.08; choreo.scaling.set(sc, sc, sc); }
          else if (activeFX.mode === 1) { choreo.position.set(Math.sin(p * Math.PI * 4) * 0.04, s * 0.1, 0); choreo.rotation.set(-s * 0.12, Math.sin(p * Math.PI * 2) * 0.25, Math.sin(p * Math.PI * 4) * 0.12); choreo.scaling.set(1 + s * 0.06, 1 + s * 0.06, 1 + s * 0.06); }
          else if (activeFX.mode === 2) { choreo.position.set(0, s * 0.12, 0); choreo.rotation.set(-p * Math.PI * 2, 0, 0); choreo.scaling.set(1, 1, 1); }
          else if (activeFX.mode === 3) { choreo.position.set(0, -s * 0.03, 0); choreo.rotation.set(s * 0.32, Math.sin(p * Math.PI * 2) * 0.18, 0); choreo.scaling.set(1 + s * 0.05, 1 + s * 0.05, 1 + s * 0.05); }
          else { choreo.position.set(Math.sin(p * Math.PI * 2) * 0.06, s * 0.09, 0); choreo.rotation.set(0, p * Math.PI * 2, Math.sin(p * Math.PI * 4) * 0.14); const sc = 1 + s * 0.1; choreo.scaling.set(sc, sc, sc); }
        }
      } else {
        choreo.position.set(0, Math.sin(t * 2.2) * 0.018, 0);
        choreo.rotation.set(0, Math.sin(t * 1.1) * 0.14, Math.sin(t * 1.7) * 0.03);
        choreo.scaling.set(1, 1, 1);
      }
      scene.render();
    });

    const onResize = () => { syncPos(); engine.resize(); };
    window.addEventListener("resize", onResize);
    setTimeout(onResize, 300); setTimeout(onResize, 1200);
    host.addEventListener("pointerdown", playTap);
    ["#hammerBtn", "#shuffleBtn", "#movesBtn", "#nextBtn"].forEach((s) => { const b = document.querySelector(s); if (b) b.addEventListener("click", playNextMatch); });

    if (window.MutationObserver) {
      Array.from(document.querySelectorAll("#score, .score-value, #hudScore, #moves, .moves-value")).forEach((el) => {
        let lastVal = (el.textContent || "").trim();
        new MutationObserver(() => {
          const cur = (el.textContent || "").trim();
          if (cur && cur !== lastVal) { lastVal = cur; playNextMatch(); }
        }).observe(el, { childList: true, characterData: true, subtree: true });
      });
    }

    window.Dragon3DCharacter = { playIdle, playCelebrate: playNextMatch, playTap, hideOldDragon: () => hideOldGreenDragon(B, scene), sync: onResize, scene, engine, camera, host };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mount().catch(console.warn));
  else mount().catch(console.warn);
})();
```
