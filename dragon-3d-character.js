/**
 * Candy Magic Royale - 3D Animated Pharaoh Dragon Replacement (v3)
 * - Removes/hides the old green 3D dragon inside the game's Babylon.js scene.
 * - Places the 3D Pharaoh Dragon cleanly inside the RIGHT arch (next to Heart 5),
 *   leaving the purple Queen on the left completely uncovered.
 * - Faces straight toward the screen (camera.alpha = +PI/2).
 * - Cycles through 5 different celebratory animations on every match/combo + tap reaction.
 */
(function () {
  "use strict";

  const CFG = {
    root: "./",
    file: "dragon-character.glb",
    cooldownMs: 900,
  };

  let lastAnimAt = 0;
  let matchAnimIndex = 0;

  function waitForBabylon(timeoutMs) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      (function check() {
        if (window.BABYLON && window.BABYLON.SceneLoader) {
          resolve(window.BABYLON);
          return;
        }
        if (Date.now() - start > timeoutMs) {
          reject(new Error("BABYLON.SceneLoader not found"));
          return;
        }
        setTimeout(check, 150);
      })();
    });
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
        position: fixed !important;
        overflow: hidden !important;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        pointer-events: auto !important;
        background: transparent !important;
        z-index: 25 !important;
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
      .dragon-3d-overlay.d3d-fx-gold::after,
      .dragon-3d-overlay.d3d-fx-purple::after,
      .dragon-3d-overlay.d3d-fx-cyan::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 5;
        animation: d3dGlow 0.95s ease-out forwards;
      }
      .dragon-3d-overlay.d3d-fx-gold::after {
        background: radial-gradient(circle at 50% 45%, rgba(255, 224, 96, 0.55) 0%, rgba(255, 168, 48, 0.22) 48%, transparent 74%);
      }
      .dragon-3d-overlay.d3d-fx-purple::after {
        background: radial-gradient(circle at 50% 45%, rgba(224, 120, 255, 0.55) 0%, rgba(140, 50, 255, 0.22) 48%, transparent 74%);
      }
      .dragon-3d-overlay.d3d-fx-cyan::after {
        background: radial-gradient(circle at 50% 45%, rgba(100, 240, 255, 0.52) 0%, rgba(180, 110, 255, 0.2) 48%, transparent 74%);
      }
      @keyframes d3dGlow {
        0% { opacity: 0; transform: scale(0.8); }
        35% { opacity: 1; transform: scale(1.08); }
        100% { opacity: 0; transform: scale(1.25); }
      }
    `;
    document.head.appendChild(st);
  }

  /**
   * Hides the old green 3D dragon meshes inside the game's existing Babylon.js scene(s).
   */
  function hideOldGreenDragonInGameScenes(B, ownScene) {
    if (!B || !B.Engine || !Array.isArray(B.Engine.Instances)) return;

    function isGreenishMaterial(mat) {
      if (!mat) return false;
      const c = mat.albedoColor || mat.diffuseColor || mat.emissiveColor;
      if (!c) return false;
      // Teal/greenish dragon body: green channel clearly higher than red
      return c.g > 0.35 && c.g > c.r * 1.18;
    }

    for (const eng of B.Engine.Instances) {
      if (!eng || !Array.isArray(eng.scenes)) continue;
      for (const sc of eng.scenes) {
        if (!sc || sc === ownScene) continue;

        // 1. Hide any TransformNode or Mesh explicitly named with dragon/pet/mascot
        const allNodes = []
          .concat(sc.transformNodes || [])
          .concat(sc.meshes || []);

        const hiddenRoots = new Set();
        for (const node of allNodes) {
          const name = (node.name || "").toLowerCase();
          if (/(dragon|drg|mascot_right|right_char|green_char|dino|lizard)/i.test(name)) {
            hiddenRoots.add(node);
          }
        }

        // 2. Also detect the procedural green 3D dragon in the top-right character area
        //    (greenish spheres/cones/cylinders whose parent or world position is on the right side x > 0.3 and upper area)
        for (const m of sc.meshes || []) {
          if (!m || !m.isVisible) continue;
          const mName = (m.name || "").toLowerCase();
          if (/(candy|tile|board|grid|frame|bg|video|queen|crown|heart|star|flower|diamond|swirl|cage|ice)/i.test(mName)) {
            continue;
          }
          if (isGreenishMaterial(m.material)) {
            const wp = typeof m.getAbsolutePosition === "function" ? m.getAbsolutePosition() : m.position;
            // Top-right character sits to the right (x > 0.25) and above/behind board
            if (wp && wp.x > 0.25) {
              // Walk up to its character group root if it has a parent
              let top = m;
              while (top.parent && !/(root|scene|world|stage)/i.test(top.parent.name || "")) {
                top = top.parent;
              }
              hiddenRoots.add(top);
            }
          }
        }

        for (const root of hiddenRoots) {
          try {
            if (typeof root.setEnabled === "function") root.setEnabled(false);
            if ("isVisible" in root) root.isVisible = false;
            if (typeof root.getChildMeshes === "function") {
              root.getChildMeshes(false).forEach((ch) => {
                ch.isVisible = false;
                if (typeof ch.setEnabled === "function") ch.setEnabled(false);
              });
            }
          } catch (_) {}
        }
      }
    }
  }

  /**
   * Computes the exact screen rect for the RIGHT character arch (where the old green dragon sits).
   */
  function computeRightArchRect() {
    // Prefer `.art-queen` if it is on the right side (left > 45% of viewport)
    const queenEl = document.querySelector(".art-queen");
    const dragonEl = document.querySelector(".art-dragon");

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Hide any old 2D dragon image inside `.art-dragon` only if it's a dragon image
    if (dragonEl && /dragon/i.test((dragonEl.src || "") + " " + (dragonEl.alt || ""))) {
      dragonEl.classList.add("dragon-3d-replaced");
    }

    if (queenEl) {
      const qr = queenEl.getBoundingClientRect();
      if (qr.width > 30 && qr.height > 30 && qr.left > vw * 0.44) {
        return {
          left: qr.left,
          top: qr.top,
          width: qr.width,
          height: qr.height,
          borderRadius: getComputedStyle(queenEl).borderRadius,
        };
      }
    }

    // Fallback: align symmetrically in the top-right arch (next to Heart 5)
    const board = document.querySelector(".art-board-wrap, #renderCanvas, canvas");
    const refW = Math.min(vw, 520);
    const leftOffset = (vw - refW) * 0.5;
    return {
      left: leftOffset + refW * 0.525,
      top: Math.max(8, vh * 0.012),
      width: refW * 0.24,
      height: Math.min(vh * 0.19, refW * 0.34),
      borderRadius: "50% 50% 18% 18% / 55% 55% 15% 15%",
    };
  }

  async function mount() {
    if (window.__dragon3dV3Mounted) return;
    window.__dragon3dV3Mounted = true;

    injectStyles();

    const host = document.createElement("div");
    host.className = "dragon-3d-overlay";
    host.id = "pharaoh-dragon-3d-host";
    document.body.appendChild(host);

    function syncPosition() {
      const r = computeRightArchRect();
      host.style.left = Math.round(r.left) + "px";
      host.style.top = Math.round(r.top) + "px";
      host.style.width = Math.round(r.width) + "px";
      host.style.height = Math.round(r.height) + "px";
      host.style.borderRadius = r.borderRadius;
    }
    syncPosition();

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

    // Hide the old green 3D dragon immediately and keep checking briefly as game scene finishes loading
    hideOldGreenDragonInGameScenes(B, scene);
    setTimeout(() => hideOldGreenDragonInGameScenes(B, scene), 800);
    setTimeout(() => hideOldGreenDragonInGameScenes(B, scene), 2200);
    setTimeout(() => hideOldGreenDragonInGameScenes(B, scene), 4500);

    // Camera at alpha = +Math.PI / 2 so the Pharaoh Dragon faces STRAIGHT AT THE SCREEN!
    const camera = new B.ArcRotateCamera(
      "pharaohDragonCam",
      Math.PI / 2,
      Math.PI / 2.06,
      1.32,
      new B.Vector3(0, 0.03, 0),
      scene
    );
    camera.minZ = 0.01;
    camera.fov = 0.72;

    // Bright Royal 3-point lighting from the FRONT (+Z side)
    const hemi = new B.HemisphericLight("dHemi", new B.Vector3(0, 1, 0.5), scene);
    hemi.intensity = 1.45;
    hemi.diffuse = new B.Color3(1.0, 0.98, 0.94);
    hemi.groundColor = new B.Color3(0.45, 0.26, 0.62);

    const key = new B.DirectionalLight("dKey", new B.Vector3(-0.3, -0.4, -0.85), scene);
    key.intensity = 1.65;
    key.diffuse = new B.Color3(1.0, 0.94, 0.80);

    const rim = new B.PointLight("dRim", new B.Vector3(0.5, 0.65, 1.3), scene);
    rim.intensity = 1.85;
    rim.diffuse = new B.Color3(0.95, 0.72, 1.0);

    const res = await B.SceneLoader.ImportMeshAsync("", CFG.root, CFG.file, scene);
    const root = res.meshes[0];

    for (const m of res.meshes) {
      if (m.material) {
        m.material.backFaceCulling = false;
        if ("metallic" in m.material) {
          m.material.metallic = 0.32;
          m.material.roughness = 0.52;
        }
      }
    }

    // Wrap root in a procedural choreography pivot so we can layer 5 distinct match animations cleanly!
    const choreo = new B.TransformNode("pharaohChoreo", scene);
    if (root) {
      root.parent = choreo;
      root.computeWorldMatrix(true);
      const bounds = root.getHierarchyBoundingVectors(true);
      if (bounds && bounds.min && bounds.max) {
        const center = bounds.min.add(bounds.max).scale(0.5);
        const size = bounds.max.subtract(bounds.min);
        const maxDim = Math.max(size.x, size.y, size.z, 0.5);
        camera.target = new B.Vector3(center.x, center.y + maxDim * 0.03, center.z);
        camera.radius = maxDim * 1.42;
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
      g.blendingSpeed = 0.12;
    });

    let activeClip = null;
    let activeFX = null; // { mode, startTime, duration }

    function playIdle() {
      if (activeClip) {
        activeClip.stop();
        activeClip = null;
      }
      if (idle && !idle.isPlaying) {
        idle.start(true, 1.0, idle.from, idle.to, false);
      }
    }

    function flashAura(cls) {
      host.classList.remove("d3d-fx-gold", "d3d-fx-purple", "d3d-fx-cyan");
      void host.offsetWidth;
      host.classList.add(cls);
    }

    function playClipOnce(group, speed) {
      if (!group) return;
      if (idle && idle.isPlaying) idle.stop();
      if (activeClip && activeClip !== group) activeClip.stop();
      activeClip = group;
      group.reset();
      group.start(false, speed || 1.0, group.from, group.to, false);
      group.onAnimationGroupEndObservable.clear();
      group.onAnimationGroupEndObservable.addOnce(() => {
        activeClip = null;
        playIdle();
      });
    }

    /**
     * 5 distinct animations that cycle on every match so the dragon always feels alive:
     *   0: Joyful Spin Jump (Celebrate clip + golden glow)
     *   1: Power Wing-Flap Cheer (Fast TapReaction + upward hover + purple glow)
     *   2: Victory Backflip Hop (360° front/back flip + cyan sparkle)
     *   3: Royal Proud Bow & Nod (Royal bow forward + golden shimmer)
     *   4: Super Combo Spiral Dance (Figure-8 dance + rapid wing flap + purple glow)
     */
    function playNextMatchAnimation() {
      const now = performance.now();
      if (now - lastAnimAt < CFG.cooldownMs) return;
      lastAnimAt = now;

      const mode = matchAnimIndex % 5;
      matchAnimIndex++;

      if (mode === 0) {
        flashAura("d3d-fx-gold");
        playClipOnce(celebrate || tap, 1.05);
        activeFX = { mode: 0, startTime: now, duration: 1350 };
      } else if (mode === 1) {
        flashAura("d3d-fx-purple");
        playClipOnce(tap || celebrate, 1.25);
        activeFX = { mode: 1, startTime: now, duration: 1050 };
      } else if (mode === 2) {
        flashAura("d3d-fx-cyan");
        playClipOnce(tap || celebrate, 1.15);
        activeFX = { mode: 2, startTime: now, duration: 1100 };
      } else if (mode === 3) {
        flashAura("d3d-fx-gold");
        playClipOnce(idle, 1.4);
        activeFX = { mode: 3, startTime: now, duration: 1000 };
      } else {
        flashAura("d3d-fx-purple");
        playClipOnce(celebrate || tap, 1.2);
        activeFX = { mode: 4, startTime: now, duration: 1300 };
      }
    }

    function playTap() {
      flashAura("d3d-fx-cyan");
      playClipOnce(tap || celebrate, 1.15);
      activeFX = { mode: 1, startTime: performance.now(), duration: 900 };
    }

    playIdle();

    let t = 0;
    engine.runRenderLoop(() => {
      if (document.hidden) return;
      t += engine.getDeltaTime() * 0.001;

      if (activeFX) {
        const p = (performance.now() - activeFX.startTime) / activeFX.duration;
        if (p >= 1) {
          activeFX = null;
          choreo.position.set(0, 0, 0);
          choreo.rotation.set(0, 0, 0);
          choreo.scaling.set(1, 1, 1);
        } else {
          const s = Math.sin(p * Math.PI);
          if (activeFX.mode === 0) {
            // Joyful high jump + scale pop
            choreo.position.set(0, s * 0.08, 0);
            choreo.rotation.set(0, 0, Math.sin(p * Math.PI * 2) * 0.08);
            const sc = 1 + s * 0.08;
            choreo.scaling.set(sc, sc, sc);
          } else if (activeFX.mode === 1) {
            // Power hover + excited side-to-side sway
            choreo.position.set(Math.sin(p * Math.PI * 4) * 0.04, s * 0.10, 0);
            choreo.rotation.set(-s * 0.12, Math.sin(p * Math.PI * 2) * 0.25, Math.sin(p * Math.PI * 4) * 0.12);
            choreo.scaling.set(1 + s * 0.06, 1 + s * 0.06, 1 + s * 0.06);
          } else if (activeFX.mode === 2) {
            // Victory flip bounce
            choreo.position.set(0, s * 0.12, 0);
            choreo.rotation.set(-p * Math.PI * 2, 0, 0);
            choreo.scaling.set(1, 1, 1);
          } else if (activeFX.mode === 3) {
            // Royal proud bow
            choreo.position.set(0, -s * 0.03, 0);
            choreo.rotation.set(s * 0.32, Math.sin(p * Math.PI * 2) * 0.18, 0);
            choreo.scaling.set(1 + s * 0.05, 1 + s * 0.05, 1 + s * 0.05);
          } else {
            // Super combo spiral dance
            choreo.position.set(Math.sin(p * Math.PI * 2) * 0.06, s * 0.09, 0);
            choreo.rotation.set(0, p * Math.PI * 2, Math.sin(p * Math.PI * 4) * 0.14);
            const sc = 1 + s * 0.1;
            choreo.scaling.set(sc, sc, sc);
          }
        }
      } else {
        // Smooth gentle idle float & playful look-around
        choreo.position.set(0, Math.sin(t * 2.2) * 0.018, 0);
        choreo.rotation.set(0, Math.sin(t * 1.1) * 0.14, Math.sin(t * 1.7) * 0.03);
        choreo.scaling.set(1, 1, 1);
      }

      scene.render();
    });

    const onResize = () => {
      syncPosition();
      engine.resize();
    };
    window.addEventListener("resize", onResize);
    setTimeout(onResize, 300);
    setTimeout(onResize, 1200);

    host.addEventListener("pointerdown", playTap);

    // Hook booster buttons
    ["#hammerBtn", "#shuffleBtn", "#movesBtn", "#nextBtn"].forEach((sel) => {
      const btn = document.querySelector(sel);
      if (btn) btn.addEventListener("click", playNextMatchAnimation);
    });

    // Hook score & moves changes so EVERY match triggers a different animation!
    const watchTargets = Array.from(
      document.querySelectorAll("#score, .score-value, #hudScore, #moves, .moves-value")
    );
    if (window.MutationObserver) {
      watchTargets.forEach((el) => {
        let lastVal = (el.textContent || "").trim();
        new MutationObserver(() => {
          const cur = (el.textContent || "").trim();
          if (cur && cur !== lastVal) {
            lastVal = cur;
            playNextMatchAnimation();
          }
        }).observe(el, { childList: true, characterData: true, subtree: true });
      });
    }

    window.Dragon3DCharacter = {
      playIdle,
      playCelebrate: playNextMatchAnimation,
      playTap,
      hideOldDragon: () => hideOldGreenDragonInGameScenes(B, scene),
      sync: onResize,
      scene,
      engine,
      camera,
      host,
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mount().catch(console.warn));
  } else {
    mount().catch(console.warn);
  }
})();
