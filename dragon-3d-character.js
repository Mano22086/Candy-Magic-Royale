/**
 * Candy Magic Royale - 3D Animated Pharaoh Dragon Replacement (v2)
 * Handles BOTH <img class="art-dragon"> (creates a synced sibling <div> overlay)
 * and <div class="art-dragon"> containers, auto-frames the 3D model, and plays
 * Idle, Celebrate, and TapReaction animations.
 */
(function () {
  "use strict";

  const CFG = {
    root: "./",
    file: "dragon-character.glb",
    selectors: [
      ".art-dragon",
      "#dragon-frame",
      "[data-character='dragon']",
      ".dragon-portrait",
    ],
    cooldownMs: 1800,
  };

  let lastCelebrateAt = 0;

  function waitForBabylon(timeoutMs) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      (function check() {
        if (window.BABYLON && window.BABYLON.SceneLoader) {
          resolve(window.BABYLON);
          return;
        }
        if (Date.now() - start > timeoutMs) {
          reject(new Error("BABYLON.SceneLoader not found on page"));
          return;
        }
        setTimeout(check, 150);
      })();
    });
  }

  function findDragonTarget() {
    for (const sel of CFG.selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs.find((i) => /dragon/i.test((i.src || "") + " " + (i.alt || "") + " " + (i.className || ""))) || null;
  }

  function injectStyles() {
    if (document.getElementById("dragon-3d-styles")) return;
    const st = document.createElement("style");
    st.id = "dragon-3d-styles";
    st.textContent = `
      .dragon-3d-replaced {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      .dragon-3d-overlay {
        overflow: hidden !important;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        pointer-events: auto !important;
        background: transparent !important;
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
        z-index: 2;
      }
      .dragon-3d-overlay.dragon-3d-cel::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 5;
        background: radial-gradient(circle at 50% 45%, rgba(255, 224, 102, 0.5) 0%, rgba(192, 92, 255, 0.22) 48%, transparent 74%);
        animation: d3dGlow 0.9s ease-out forwards;
      }
      @keyframes d3dGlow {
        0% { opacity: 0; transform: scale(0.85); }
        35% { opacity: 1; transform: scale(1.06); }
        100% { opacity: 0; transform: scale(1.22); }
      }
    `;
    document.head.appendChild(st);
  }

  function createHostForTarget(targetEl) {
    const tag = (targetEl.tagName || "").toUpperCase();
    const isVoidOrMedia = tag === "IMG" || tag === "SVG" || tag === "VIDEO" || tag === "CANVAS";

    if (!isVoidOrMedia) {
      // Target is already a container (e.g. <div>)
      Array.from(targetEl.children).forEach((ch) => {
        if (!ch.classList.contains("dragon-3d-canvas")) {
          ch.classList.add("dragon-3d-replaced");
        }
      });
      targetEl.classList.add("dragon-3d-overlay");
      if (getComputedStyle(targetEl).position === "static") {
        targetEl.style.position = "relative";
      }
      return { host: targetEl, sync: () => {} };
    }

    // Target is <img class="art-dragon"> (cannot contain a <canvas> child!)
    // Create a sibling <div> overlay matching its exact position, size, and arch border-radius.
    const parent = targetEl.parentElement || document.body;
    const host = document.createElement("div");
    host.className = "dragon-3d-overlay";

    function syncGeometry() {
      const cs = getComputedStyle(targetEl);
      host.style.position = cs.position === "static" ? "absolute" : cs.position;
      host.style.left = targetEl.offsetLeft + "px";
      host.style.top = targetEl.offsetTop + "px";
      host.style.width = (targetEl.offsetWidth || parseFloat(cs.width) || 90) + "px";
      host.style.height = (targetEl.offsetHeight || parseFloat(cs.height) || 110) + "px";
      host.style.borderRadius = cs.borderRadius;
      host.style.clipPath = cs.clipPath;
      const z = parseInt(cs.zIndex, 10);
      host.style.zIndex = Number.isFinite(z) ? String(z + 2) : "15";
    }

    syncGeometry();
    targetEl.classList.add("dragon-3d-replaced");
    parent.insertBefore(host, targetEl.nextSibling);
    return { host, sync: syncGeometry };
  }

  async function mount(targetEl) {
    if (targetEl.dataset.dragon3dMounted === "1") return;
    targetEl.dataset.dragon3dMounted = "1";

    injectStyles();
    const { host, sync } = createHostForTarget(targetEl);

    const canvas = document.createElement("canvas");
    canvas.className = "dragon-3d-canvas";
    canvas.setAttribute("aria-label", "3D Animated Pharaoh Dragon");
    host.appendChild(canvas);

    const B = await waitForBabylon(20000);

    const engine = new B.Engine(canvas, true, {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));

    const scene = new B.Scene(engine);
    scene.clearColor = new B.Color4(0, 0, 0, 0);

    const camera = new B.ArcRotateCamera(
      "dragonCam",
      -Math.PI / 2,
      Math.PI / 2.08,
      1.35,
      new B.Vector3(0, 0.04, 0),
      scene
    );
    camera.minZ = 0.01;
    camera.fov = 0.72;

    // Bright Royal 3-point lighting so the purple & gold dragon pops inside the arch
    const hemi = new B.HemisphericLight("dragonHemi", new B.Vector3(0, 1, 0.4), scene);
    hemi.intensity = 1.35;
    hemi.diffuse = new B.Color3(1.0, 0.98, 0.94);
    hemi.groundColor = new B.Color3(0.42, 0.24, 0.56);

    const key = new B.DirectionalLight("dragonKey", new B.Vector3(-0.3, -0.45, 0.85), scene);
    key.intensity = 1.5;
    key.diffuse = new B.Color3(1.0, 0.94, 0.78);

    const rim = new B.PointLight("dragonRim", new B.Vector3(0.5, 0.65, -1.2), scene);
    rim.intensity = 1.8;
    rim.diffuse = new B.Color3(0.88, 0.55, 1.0);

    const res = await B.SceneLoader.ImportMeshAsync("", CFG.root, CFG.file, scene);

    // Keep Babylon's default glTF __root__ transform (glTF +Z already faces camera at alpha = -PI/2)
    const root = res.meshes[0];

    for (const m of res.meshes) {
      if (m.material) {
        m.material.backFaceCulling = false;
        if ("metallic" in m.material) {
          m.material.metallic = 0.3;
          m.material.roughness = 0.55;
        }
      }
    }

    // Auto-frame camera to the loaded model's actual bounding box
    if (root && typeof root.getHierarchyBoundingVectors === "function") {
      root.computeWorldMatrix(true);
      const bounds = root.getHierarchyBoundingVectors(true);
      if (bounds && bounds.min && bounds.max) {
        const center = bounds.min.add(bounds.max).scale(0.5);
        const size = bounds.max.subtract(bounds.min);
        const maxDim = Math.max(size.x, size.y, size.z, 0.5);
        camera.target = new B.Vector3(center.x, center.y + maxDim * 0.04, center.z);
        camera.radius = maxDim * 1.48;
      }
    }

    const groups = res.animationGroups || [];
    const getGroup = (name) =>
      groups.find((g) => g.name && g.name.toLowerCase() === name) || null;

    const idle = getGroup("idle") || groups[0] || null;
    const celebrate = getGroup("celebrate") || null;
    const tap = getGroup("tapreaction") || celebrate;

    groups.forEach((g) => {
      g.stop();
      g.enableBlending = true;
      g.blendingSpeed = 0.1;
    });

    let activeOneShot = null;

    function playIdle() {
      if (activeOneShot) {
        activeOneShot.stop();
        activeOneShot = null;
      }
      if (idle && !idle.isPlaying) {
        idle.start(true, 1.0, idle.from, idle.to, false);
      }
    }

    function playOnce(group) {
      if (!group) return;
      host.classList.remove("dragon-3d-cel");
      void host.offsetWidth;
      host.classList.add("dragon-3d-cel");
      if (idle && idle.isPlaying) idle.stop();
      if (activeOneShot && activeOneShot !== group) activeOneShot.stop();
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
      if (now - lastCelebrateAt < CFG.cooldownMs) return;
      lastCelebrateAt = now;
      playOnce(celebrate || tap);
    }

    function playTap() {
      playOnce(tap || celebrate);
    }

    playIdle();

    let t = 0;
    engine.runRenderLoop(() => {
      if (document.hidden) return;
      t += engine.getDeltaTime() * 0.001;
      if (!activeOneShot && root) {
        root.position.y = Math.sin(t * 2.1) * 0.014;
      }
      scene.render();
    });

    const onResize = () => {
      sync();
      engine.resize();
    };
    if (window.ResizeObserver) {
      new ResizeObserver(onResize).observe(targetEl);
    }
    window.addEventListener("resize", onResize);
    setTimeout(onResize, 300);
    setTimeout(onResize, 1200);

    host.addEventListener("pointerdown", playTap);

    ["#hammerBtn", "#shuffleBtn", "#movesBtn", "#nextBtn"].forEach((sel) => {
      const btn = document.querySelector(sel);
      if (btn) btn.addEventListener("click", playCelebrate);
    });

    const sc = document.querySelector("#score, .score-value, #hudScore");
    if (sc && window.MutationObserver) {
      let prev = parseInt(sc.textContent.replace(/[^\d]/g, ""), 10) || 0;
      new MutationObserver(() => {
        const cur = parseInt(sc.textContent.replace(/[^\d]/g, ""), 10) || 0;
        if (cur > prev) {
          prev = cur;
          playCelebrate();
        }
      }).observe(sc, { childList: true, characterData: true, subtree: true });
    }

    window.Dragon3DCharacter = {
      playIdle,
      playCelebrate,
      playTap,
      sync: onResize,
      scene,
      engine,
      camera,
      host,
    };
  }

  function init() {
    const target = findDragonTarget();
    if (target) {
      mount(target).catch((err) => console.warn("[Dragon3DCharacter]", err));
      return;
    }
    if (window.MutationObserver) {
      const obs = new MutationObserver(() => {
        const found = findDragonTarget();
        if (found) {
          obs.disconnect();
          mount(found).catch((err) => console.warn("[Dragon3DCharacter]", err));
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
