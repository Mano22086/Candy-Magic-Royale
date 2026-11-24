/* Candy Magic Royale — Main Menu & Loading Video Flow
 * Plays supplied loading video ./assets/packs/images/4_5877503749181675068.mp4
 * once to full completion (no infinite loop) with live progress bar and safe fallback.
 */
(() => {
  "use strict";
  if (window.__CMR_LAUNCH_FLOW_V3__) return;
  window.__CMR_LAUNCH_FLOW_V3__ = true;

  const LOADING_VIDEO_SRC = "./assets/packs/images/4_5877503749181675068.mp4";
  const CORE_ASSETS = [
    "./01_star_gold.png",
    "./02_heart_rainbow.png",
    "./03_diamond_blue.png",
    "./04_flower_purple.png",
    "./05_crown_green.png",
    "./06_lollipop_red.png",
    "./ice_cube_realistic_4k.png",
    "./ice_cube_stylized_4k.png",
    "./assets/Picsart_26-11-17_02-37-45-792.png",
    "./assets/Picsart_26-11-17_02-38-02-164.png",
  ];

  let launching = false;
  let preloaded = false;

  function setProgress(percent, label) {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    const fill = document.getElementById("loadingProgressFill");
    const pct = document.getElementById("loadingProgressPercent");
    const txt = document.getElementById("loadingProgressText");
    if (fill) fill.style.width = clamped + "%";
    if (pct) pct.textContent = clamped + "%";
    if (txt && label) txt.textContent = label;
  }

  async function preloadCoreAssets() {
    if (preloaded) {
      setProgress(100, "المملكة جاهزة!");
      return;
    }
    let done = 0;
    await Promise.all(
      CORE_ASSETS.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            let settled = false;
            const finish = () => {
              if (settled) return;
              settled = true;
              done++;
              setProgress(15 + (done / CORE_ASSETS.length) * 80, "جاري تجهيز مملكة الحلوى...");
              resolve();
            };
            const timer = setTimeout(finish, 3000);
            img.onload = () => {
              clearTimeout(timer);
              finish();
            };
            img.onerror = () => {
              clearTimeout(timer);
              finish();
            };
            img.src = src;
          })
      )
    );
    preloaded = true;
  }

  function playLoadingVideoOnce(videoEl) {
    return new Promise((resolve) => {
      if (!videoEl) {
        resolve();
        return;
      }

      let settled = false;
      let startedPlayback = false;
      let fallbackTimer = null;
      let maxDurationTimer = null;

      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(fallbackTimer);
        clearTimeout(maxDurationTimer);
        videoEl.removeEventListener("ended", onEnded);
        videoEl.removeEventListener("error", onError);
        videoEl.removeEventListener("playing", onPlaying);
        videoEl.removeEventListener("timeupdate", onTimeUpdate);
        try {
          videoEl.pause();
        } catch (_) {}
        resolve();
      };

      const onEnded = () => {
        setProgress(100, "المملكة جاهزة!");
        finish();
      };

      const onError = () => {
        // Video unavailable or unsupported codec — gracefully fall back to progress bar
        videoEl.classList.add("is-fallback");
        setTimeout(finish, 900);
      };

      const onPlaying = () => {
        startedPlayback = true;
        clearTimeout(fallbackTimer);
        const durMs =
          Number.isFinite(videoEl.duration) && videoEl.duration > 0
            ? Math.ceil(videoEl.duration * 1000) + 1200
            : 7500;
        clearTimeout(maxDurationTimer);
        maxDurationTimer = setTimeout(finish, Math.min(12000, durMs));
      };

      const onTimeUpdate = () => {
        if (Number.isFinite(videoEl.duration) && videoEl.duration > 0) {
          const pct = Math.min(99, Math.round((videoEl.currentTime / videoEl.duration) * 100));
          setProgress(pct, "جاري فتح بوابات القصور...");
        }
      };

      videoEl.loop = false;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.currentTime = 0;
      if (!videoEl.getAttribute("src")) {
        videoEl.src = LOADING_VIDEO_SRC;
      }

      videoEl.addEventListener("ended", onEnded);
      videoEl.addEventListener("error", onError);
      videoEl.addEventListener("playing", onPlaying);
      videoEl.addEventListener("timeupdate", onTimeUpdate);

      // Safety timer: if autoplay/playback never starts (e.g., restricted device), complete cleanly
      fallbackTimer = setTimeout(() => {
        if (!startedPlayback) {
          onError();
        }
      }, 2400);

      // Absolute upper bound so loading screen can NEVER get stuck
      maxDurationTimer = setTimeout(finish, 9500);

      try {
        videoEl.load();
        const playPromise = videoEl.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            onError();
          });
        }
      } catch (_) {
        onError();
      }
    });
  }

  function showLaunchError(message) {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent = message;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 3000);
    }
  }

  async function launchGame(options = {}) {
    if (launching) return;
    launching = true;

    const skipVideo = Boolean(options.skipVideo);
    const startScreen = document.getElementById("startScreen");
    const overlay = document.getElementById("loadingVideoOverlay");
    const videoEl = document.getElementById("loadingProgressVideo");
    const startBtn = document.getElementById("startGameBtn");

    window.CMRAudio?.unlock?.();
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.blur?.();
    }

    try {
      if (!skipVideo && overlay) {
        document.body.dataset.state = "loading";
        overlay.classList.remove("hidden");
        setProgress(5, "جاري تحميل عالم الحلوى...");

        // Wait for BOTH the loading video to play to completion AND core assets to preload
        await Promise.all([playLoadingVideoOnce(videoEl), preloadCoreAssets()]);
        setProgress(100, "أهلاً بك في مملكة الحلوى!");
        await new Promise((r) => setTimeout(r, 180));
      } else {
        await preloadCoreAssets();
      }

      if (typeof window.CMRShowWorldMap !== "function") {
        throw new Error("خريطة الممالك غير جاهزة");
      }

      // Pause intro video to free mobile CPU/memory
      const introVideo = document.getElementById("startCinematicVideo");
      if (introVideo) {
        try {
          introVideo.pause();
        } catch (_) {}
      }

      if (overlay) overlay.classList.add("hidden");
      if (startScreen) startScreen.classList.add("hidden");

      if (options.autostartStage) {
        await window.CMRStartSelectedHouse?.(options.autostartStage);
      } else {
        window.CMRShowWorldMap();
      }
    } catch (err) {
      console.error("[CMR launch]", err);
      if (overlay) overlay.classList.add("hidden");
      if (startBtn) startBtn.disabled = false;
      launching = false;
      showLaunchError("تعذر تشغيل اللعبة، حاول مرة أخرى.");
      return;
    }

    launching = false;
    if (startBtn) startBtn.disabled = false;
  }

  function showMainMenu() {
    const startScreen = document.getElementById("startScreen");
    const overlay = document.getElementById("loadingVideoOverlay");
    window.CMRHideWorldMap?.();
    window.CMRPauseGameRender?.();
    if (overlay) overlay.classList.add("hidden");
    if (startScreen) startScreen.classList.remove("hidden");
    document.body.classList.remove("map-open");
    document.body.dataset.state = "title";
    window.CMRGame?.syncMenuUI?.();
  }

  function isAnyModalOpen() {
    const modals = document.querySelectorAll(".modal:not(.hidden)");
    return modals.length > 0;
  }

  function initMenu() {
    document.body.dataset.state = "title";
    const startBtn = document.getElementById("startGameBtn");
    if (startBtn) {
      startBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        void launchGame();
      });
    }

    const guestBtn = document.getElementById("guestPlayBtn");
    if (guestBtn) {
      guestBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.CMRGame?.setGuestProfile?.();
        void launchGame();
      });
    }

    window.addEventListener("keydown", (e) => {
      if (document.body.dataset.state !== "title") return;
      if (isAnyModalOpen()) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        void launchGame();
      }
    });

    // Support ?autostart=1 (or ?autostart=stage) for direct testing
    try {
      const params = new URLSearchParams(window.location.search);
      const auto = params.get("autostart");
      if (auto === "1" || auto === "map") {
        void launchGame({ skipVideo: true });
      } else if (auto === "stage" || auto === "play") {
        const st = Number(params.get("stage")) || 1;
        void launchGame({ skipVideo: true, autostartStage: st });
      }
    } catch (_) {}
  }

  window.CMRLaunchGame = launchGame;
  window.CMRShowMainMenu = showMainMenu;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMenu, { once: true });
  } else {
    initMenu();
  }
})();