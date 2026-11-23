/**
 * Candy Magic Royale - 3D Animated Pharaoh Dragon Replacement
 * Replaces the static dragon inside `.art-dragon` with the animated 3D `dragon-character.glb`.
 *
 * Installation in Mano22086/Candy-Magic-Royale:
 *   1. Upload `dragon-character.glb` and `dragon-3d-character.js` to the repository root.
 *   2. Add `<script src="dragon-3d-character.js"></script>` before `</body>` in `index.html`.
 */
(function () {
  "use strict";

  const CONFIG = {
    modelRootUrl: "./",
    modelFilename: "dragon-character.glb",
    targetSelectors: [
      ".art-dragon",
      "#dragon-frame",
      "[data-character='dragon']",
      ".dragon-portrait",
    ],
    babylonCdn: "https://cdn.jsdelivr.net/npm/babylonjs@7.31.0/babylon.js",
    loadersCdn: "https://cdn.jsdelivr.net/npm/babylonjs-loaders@7.31.0/babylonjs.loaders.min.js",
    celebrateCooldownMs: 1800,
  };

  let lastCelebrateAt = 0;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  }

  async function ensureBabylonWithGltf() {
    if (!window.BABYLON) {
      await loadScript(CONFIG.babylonCdn);
    }
    const hasGltfLoader =
      window.BABYLON &&
      window.BABYLON.SceneLoader &&
      typeof window.BABYLON.SceneLoader.IsPluginForExtensionAvailable === "function" &&
      window.BABYLON.SceneLoader.IsPluginForExtensionAvailable(".glb");

    if (!hasGltfLoader) {
      await loadScript(CONFIG.loadersCdn);
    }
    return window.BABYLON;
  }

  function findDragonContainer() {
    for (const sel of CONFIG.targetSelectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    // Fallback: look for any image whose src/alt mentions dragon
    const imgs = Array.from(document.querySelectorAll("img"));
    const dragonImg = imgs.find((img) => /dragon/i.test((img.src || "") + " " + (img.alt || "")));
    return dragonImg ? dragonImg.parentElement : null;
  }

  function injectStyles() {
    if (document.getElementById("dragon-3d-styles")) return;
    const style = document.createElement("style");
    style.id = "dragon-3d-styles";
    style.textContent = `
      .dragon-3d-host {
        position: relative !important;
        overflow: hidden !important;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .dragon-3d-host > img,
      .dragon-3d-host > svg:not(.dragon-3d-keep) {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      .dragon-3d-canvas {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        display: block !important;
        background: transparent !important;
        outline: none !important;
        touch-action: manipulation;
        z-index: 3;
      }
      .dragon-3d-host.dragon-3d-celebrate::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 4;
        background: radial-gradient(circle at 50% 45%, rgba(255, 224, 102, 0.45) 0%, rgba(192, 92, 255, 0.18) 45%, transparent 72%);
        animation: dragon3dGlowPulse 0.9s ease-out forwards;
      }
      @keyframes dragon3dGlowPulse {
        0% { opacity: 0; transform: scale(0.85); }
        35% { opacity: 1; transform: scale(1.05); }
        100% { opacity: 0; transform: scale(1.2); }
      }
    `;
    document.head.appendChild(style);
  }

  async function mountDragon3D(container) {
    if (container.dataset.dragon3dMounted === "1") return;
    container.dataset.dragon3dMounted = "1";

    injectStyles();
    container.classList.add("dragon-3d-host");

    const canvas = document.createElement("canvas");
    canvas.className = "dragon-3d-canvas";
    canvas.setAttribute("aria-label", "3D Animated Pharaoh Dragon");
    container.appendChild(canvas);

    const BABYLON = await ensureBabylonWithGltf();

    const engine = new BABYLON.Engine(canvas, true, {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));

    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    // Camera framed on the Pharaoh Dragon facing +Z in glTF space
    const camera = new BABYLON.ArcRotateCamera(
      "dragonCam",
      -Math.PI / 2,
      Math.PI / 2.08,
      1.32,
      new BABYLON.Vector3(0, 0.04, 0),
      scene
    );
    camera.minZ = 0.05;
    camera.fov = 0.68;

    // Warm Royal 3-point lighting
    const hemi = new BABYLON.HemisphericLight("dragonHemi", new BABYLON.Vector3(0, 1, 0.3), scene);
    hemi.intensity = 1.15;
    hemi.diffuse = new BABYLON.Color3(1.0, 0.97, 0.92);
    hemi.groundColor = new BABYLON.Color3(0.32, 0.16, 0.45);

    const keyLight = new BABYLON.DirectionalLight("dragonKey", new BABYLON.Vector3(-0.35, -0.55, 0.75), scene);
    keyLight.intensity = 1.35;
    keyLight.diffuse = new BABYLON.Color3(1.0, 0.92, 0.75);

    const rimLight = new BABYLON.PointLight("dragonRim", new BABYLON.Vector3(0.5, 0.6, -1.2), scene);
    rimLight.intensity = 1.6;
    rimLight.diffuse = new BABYLON.Color3(0.82, 0.42, 1.0);

    // Load the optimized, rigged, animated Pharaoh Dragon GLB
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
      "",
      CONFIG.modelRootUrl,
      CONFIG.modelFilename,
      scene
    );

    // Ensure front-facing orientation (+Z towards camera) and crisp materials
    const rootNode = result.meshes[0];
    if (rootNode) {
      rootNode.rotationQuaternion = null;
      rootNode.rotation.y = Math.PI;
      rootNode.position = new BABYLON.Vector3(0, -0.02, 0);
    }

    for (const mesh of result.meshes) {
      if (mesh.material) {
        mesh.material.backFaceCulling = false;
        if ("metallic" in mesh.material) {
          mesh.material.metallic = 0.35;
          mesh.material.roughness = 0.58;
        }
      }
    }

    // Gather embedded glTF animation groups (Idle, Celebrate, TapReaction)
    const animGroups = result.animationGroups || [];
    const findAnim = (name) =>
      animGroups.find((g) => g.name && g.name.toLowerCase() === name.toLowerCase()) || null;

    const idleAnim = findAnim("Idle") || animGroups[0] || null;
    const celebrateAnim = findAnim("Celebrate") || null;
    const tapAnim = findAnim("TapReaction") || celebrateAnim;

    for (const g of animGroups) {
      g.stop();
      g.enableBlending = true;
      g.blendingSpeed = 0.1;
    }

    let activeOneShot = null;

    function playIdle() {
      if (activeOneShot) {
        activeOneShot.stop();
        activeOneShot = null;
      }
      if (idleAnim && !idleAnim.isPlaying) {
        idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
      }
    }

    function playOneShot(group, glow) {
      if (!group) return;
      if (glow) {
        container.classList.remove("dragon-3d-celebrate");
        void container.offsetWidth;
        container.classList.add("dragon-3d-celebrate");
      }
      if (idleAnim && idleAnim.isPlaying) {
        idleAnim.stop();
      }
      if (activeOneShot && activeOneShot !== group) {
        activeOneShot.stop();
      }
      activeOneShot = group;
      group.reset();
      group.start(false, 1.0, group.from, group.to, false);
      group.onAnimationGroupEndObservable.clear();
      group.onAnimationGroupEndObservable.addOnce(() => {
        activeOneShot = null;
        playIdle();
      });
    }

    function playCelebrate() {
      const now = Date.now();
      if (now - lastCelebrateAt < CONFIG.celebrateCooldownMs) return;
      lastCelebrateAt = now;
      playOneShot(celebrateAnim || tapAnim, true);
    }

    function playTap() {
      playOneShot(tapAnim || celebrateAnim, true);
    }

    // Start continuous idle wing-flapping & breathing immediately
    playIdle();

    // Subtle secondary camera float for extra life even between clips
    let t = 0;
    engine.runRenderLoop(() => {
      if (document.hidden) return;
      t += engine.getDeltaTime() * 0.001;
      if (!activeOneShot && rootNode) {
        rootNode.position.y = -0.02 + Math.sin(t * 2.1) * 0.012;
      }
      scene.render();
    });

    // Keep canvas sharp when container resizes
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => engine.resize());
      ro.observe(container);
    }
    window.addEventListener("resize", () => engine.resize());

    // Interactive tap on the dragon frame
    container.addEventListener("pointerdown", () => playTap());

    // Auto-hook booster buttons so the dragon celebrates when you use a power-up
    ["#hammerBtn", "#shuffleBtn", "#movesBtn", "#nextBtn"].forEach((sel) => {
      const btn = document.querySelector(sel);
      if (btn) {
        btn.addEventListener("click", () => playCelebrate());
      }
    });

    // Auto-hook score counter so the dragon celebrates on matches
    const scoreEl = document.querySelector("#score, .score-value, #hudScore");
    if (scoreEl && window.MutationObserver) {
      let prevScore = parseInt(scoreEl.textContent.replace(/[^\d]/g, ""), 10) || 0;
      const mo = new MutationObserver(() => {
        const nextScore = parseInt(scoreEl.textContent.replace(/[^\d]/g, ""), 10) || 0;
        if (nextScore > prevScore) {
          prevScore = nextScore;
          playCelebrate();
        }
      });
      mo.observe(scoreEl, { childList: true, characterData: true, subtree: true });
    }

    // Expose public API for game.js if needed
    window.Dragon3DCharacter = {
      playIdle,
      playCelebrate,
      playTap,
      scene,
      engine,
      camera,
      animationGroups: animGroups,
    };
  }

  function init() {
    const container = findDragonContainer();
    if (container) {
      mountDragon3D(container).catch((err) => {
        console.warn("[Dragon3DCharacter] Failed to initialize 3D dragon:", err);
      });
      return;
    }

    // If `.art-dragon` is rendered dynamically, watch DOM briefly
    if (window.MutationObserver) {
      const obs = new MutationObserver(() => {
        const found = findDragonContainer();
        if (found) {
          obs.disconnect();
          mountDragon3D(found).catch((err) => {
            console.warn("[Dragon3DCharacter] Failed to initialize 3D dragon:", err);
          });
        }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => obs.disconnect(), 15000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();