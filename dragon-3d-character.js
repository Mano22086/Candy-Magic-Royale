/* Candy Magic Royale — 3D Pharaoh Dragon Portrait Engine (Clean, Slot-Anchored & Mobile-Optimized)
 * - Anchors directly inside .art-dragon (never floats or covers HUD counters/buttons).
 * - Keeps the crisp 2D Dragon portrait visible immediately while dragon-character.glb loads
 *   and falls back seamlessly if WebGL or GLB loading fails.
 * - Pauses rendering when hidden, on the map, or in modals to save mobile GPU/battery.
 */
(function () {
  "use strict";
  if (window.__CMR_DRAGON_3D_CLEAN__) return;
  window.__CMR_DRAGON_3D_CLEAN__ = true;

  const MODEL_ROOT = "./";
  const MODEL_FILE = "dragon-character.glb";
  const COOLDOWN_MS = 850;

  let engine = null;
  let scene = null;
  let camera = null;
  let choreo = null;
  let hostCanvas = null;
  let mounted = false;
  let loading = false;
  let paused = true;
  let lastAnimAt = 0;
  let matchAnimIndex = 0;
  let activeClip = null;
  let activeFX = null;
  let idleGroup = null;
  let celebrateGroup = null;
  let tapGroup = null;

  function triggerFallbackDragonAnim(cls) {
    const img = document.getElementById("dragon");
    if (!img) return;
    img.classList.remove("combo-1", "combo-2", "combo-3", "celebrate", "defeat");
    void img.offsetWidth;
    img.classList.add(cls);
    clearTimeout(img.__dTimer);
    img.__dTimer = setTimeout(() => img.classList.remove(cls), 1100);
  }

  function playIdle() {
    if (activeClip) {
      try {
        activeClip.stop();
      } catch (_) {}
      activeClip = null;
    }
    if (idleGroup && !idleGroup.isPlaying) {
      try {
        idleGroup.start(true, 1, idleGroup.from, idleGroup.to, false);
      } catch (_) {}
    }
  }

  function playOnce(group, speed) {
    if (!group) return;
    try {
      if (idleGroup && idleGroup.isPlaying) idleGroup.stop();
      if (activeClip && activeClip !== group) activeClip.stop();
      activeClip = group;
      group.reset();
      group.start(false, speed || 1, group.from, group.to, false);
      group.onAnimationGroupEndObservable.clear();
      group.onAnimationGroupEndObservable.addOnce(() => {
        activeClip = null;
        playIdle();
      });
    } catch (_) {}
  }

  function playCelebrate() {
    const now = performance.now();
    if (now - lastAnimAt < COOLDOWN_MS) return;
    lastAnimAt = now;

    if (!mounted) {
      triggerFallbackDragonAnim("celebrate");
      return;
    }

    const mode = matchAnimIndex % 3;
    matchAnimIndex++;
    if (mode === 0) {
      playOnce(celebrateGroup || tapGroup, 1.05);
      activeFX = { mode: 0, startTime: now, duration: 1100 };
    } else if (mode === 1) {
      playOnce(tapGroup || celebrateGroup, 1.2);
      activeFX = { mode: 1, startTime: now, duration: 950 };
    } else {
      playOnce(celebrateGroup || idleGroup, 1.15);
      activeFX = { mode: 2, startTime: now, duration: 1050 };
    }
  }

  function playTap() {
    window.CMRAudio?.playSfx?.("pop");
    if (!mounted) {
      triggerFallbackDragonAnim("combo-2");
      return;
    }
    playOnce(tapGroup || celebrateGroup, 1.15);
    activeFX = { mode: 1, startTime: performance.now(), duration: 850 };
  }

  function setPaused(shouldPause) {
    paused = Boolean(shouldPause);
    if (engine && !paused) {
      try {
        engine.resize();
      } catch (_) {}
    }
  }

  async function mountIfNeeded() {
    if (mounted || loading) return;
    if (!window.BABYLON || !window.BABYLON.SceneLoader) return;

    const slot = document.querySelector(".art-dragon");
    const fallbackImg = document.getElementById("dragon");
    if (!slot) return;

    loading = true;
    try {
      const B = window.BABYLON;
      hostCanvas = document.createElement("canvas");
      hostCanvas.id = "pharaohDragonCanvas";
      hostCanvas.className = "dragon-3d-canvas";
      hostCanvas.setAttribute("aria-label", "أمير التنين ثلاثي الأبعاد");
      hostCanvas.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .3s ease;cursor:pointer;z-index:2;background:transparent;";
      slot.appendChild(hostCanvas);

      engine = new B.Engine(
        hostCanvas,
        true,
        {
          alpha: true,
          premultipliedAlpha: false,
          antialias: true,
          stencil: false,
          preserveDrawingBuffer: false,
        },
        false
      );
      const isMobile = window.matchMedia("(max-width: 900px)").matches;
      engine.setHardwareScalingLevel(isMobile ? 1.35 : 1);
      engine.enableOfflineSupport = false;

      scene = new B.Scene(engine);
      scene.clearColor = new B.Color4(0, 0, 0, 0);
      scene.autoClear = true;

      camera = new B.ArcRotateCamera(
        "pharaohCam",
        Math.PI / 2,
        Math.PI / 2.05,
        1.5,
        new B.Vector3(0, 0.05, 0),
        scene
      );
      camera.minZ = 0.05;
      camera.fov = 0.68;

      const hemi = new B.HemisphericLight("dHemi", new B.Vector3(0, 1, 0.4), scene);
      hemi.intensity = 1.25;
      hemi.diffuse = new B.Color3(1, 0.98, 0.94);
      hemi.groundColor = new B.Color3(0.42, 0.25, 0.56);

      const key = new B.DirectionalLight("dKey", new B.Vector3(-0.3, -0.45, -0.85), scene);
      key.intensity = 1.15;
      key.diffuse = new B.Color3(1, 0.95, 0.85);

      const res = await B.SceneLoader.ImportMeshAsync("", MODEL_ROOT, MODEL_FILE, scene);
      const root = res.meshes[0];
      res.meshes.forEach((m) => {
        m.isPickable = false;
        if (m.material) {
          m.material.backFaceCulling = false;
          if ("metallic" in m.material) {
            m.material.metallic = 0.24;
            m.material.roughness = 0.58;
          }
        }
      });

      choreo = new B.TransformNode("pharaohChoreo", scene);
      if (root) {
        root.parent = choreo;
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
      const findGroup = (name) =>
        groups.find((g) => g.name && g.name.toLowerCase() === name) || null;
      idleGroup = findGroup("idle") || groups[0] || null;
      celebrateGroup = findGroup("celebrate") || null;
      tapGroup = findGroup("tapreaction") || celebrateGroup;
      groups.forEach((g) => {
        g.stop();
        g.enableBlending = true;
        g.blendingSpeed = 0.12;
      });

      playIdle();

      let t = 0;
      let lastFrame = 0;
      engine.runRenderLoop(() => {
        if (paused || document.hidden || !scene) return;
        const now = performance.now();
        if (now - lastFrame < 1000 / 30) return; // Smooth 30fps cap for portrait to preserve mobile perf
        lastFrame = now;
        t += 0.033;

        if (activeFX && choreo) {
          const p = (now - activeFX.startTime) / activeFX.duration;
          if (p >= 1) {
            activeFX = null;
            choreo.position.set(0, 0, 0);
            choreo.rotation.set(0, 0, 0);
            choreo.scaling.set(1, 1, 1);
          } else {
            const s = Math.sin(p * Math.PI);
            if (activeFX.mode === 0) {
              choreo.position.set(0, s * 0.07, 0);
              choreo.rotation.set(0, 0, Math.sin(p * Math.PI * 2) * 0.07);
              const sc = 1 + s * 0.07;
              choreo.scaling.set(sc, sc, sc);
            } else if (activeFX.mode === 1) {
              choreo.position.set(0, s * 0.08, 0);
              choreo.rotation.set(-s * 0.1, Math.sin(p * Math.PI * 2) * 0.22, 0);
              const sc = 1 + s * 0.06;
              choreo.scaling.set(sc, sc, sc);
            } else {
              choreo.position.set(0, s * 0.08, 0);
              choreo.rotation.set(0, Math.sin(p * Math.PI * 2) * 0.35, 0);
              choreo.scaling.set(1 + s * 0.05, 1 + s * 0.05, 1 + s * 0.05);
            }
          }
        } else if (choreo) {
          choreo.position.set(0, Math.sin(t * 2.1) * 0.016, 0);
          choreo.rotation.set(0, Math.sin(t * 1.0) * 0.12, Math.sin(t * 1.5) * 0.025);
          choreo.scaling.set(1, 1, 1);
        }
        scene.render();
      });

      hostCanvas.addEventListener("pointerdown", playTap);
      window.addEventListener(
        "resize",
        () => {
          if (engine && !paused) engine.resize();
        },
        { passive: true }
      );

      // Reveal 3D canvas and gracefully fade out 2D fallback image
      paused = document.body.dataset.state !== "playing";
      engine.resize();
      scene.render();
      hostCanvas.style.opacity = "1";
      if (fallbackImg) fallbackImg.style.opacity = "0";
      mounted = true;
    } catch (err) {
      console.warn("[CMR Dragon3D] Falling back to 2D Dragon portrait:", err);
      if (hostCanvas) {
        hostCanvas.remove();
        hostCanvas = null;
      }
      if (engine) {
        try {
          engine.dispose();
        } catch (_) {}
        engine = null;
      }
      if (fallbackImg) fallbackImg.style.opacity = "1";
    } finally {
      loading = false;
    }
  }

  window.Dragon3DCharacter = {
    mount: mountIfNeeded,
    playIdle,
    playCelebrate,
    playTap,
    pause: () => setPaused(true),
    resume: () => {
      void mountIfNeeded();
      setPaused(false);
    },
    sync: () => {
      if (engine && !paused) engine.resize();
    },
  };
})();