/* Candy Magic Royale — Startup Video Splash & Smooth World Map Transition Flow
 * Uses the looping 9:16 intro video with pixel-aligned GUEST PLAY and FACEBOOK PLAY buttons.
 * Pauses intro video cleanly when entering the World Map to preserve mobile battery & memory.
 */
(() => {
  "use strict";
  if (window.__CMR_LAUNCH_FLOW_V4__) return;
  window.__CMR_LAUNCH_FLOW_V4__ = true;

  const CORE_ASSETS = [
    "./public/assets/aistudio/Picsart_26-11-25_18-52-31-817_a4649afd.jpg",
    "./assets/extracted/palaces/palace_01.png",
    "./assets/extracted/ui/player_map_banner_clean.png",
    "./01_star_gold.png",
    "./02_heart_rainbow.png",
    "./03_diamond_blue.png",
    "./04_flower_purple.png",
    "./05_crown_green.png",
    "./06_lollipop_red.png",
  ];

  let launching = false;
  let preloaded = false;

  function preloadCoreAssetsBackground() {
    if (preloaded) return;
    preloaded = true;
    CORE_ASSETS.forEach((src) => {
      const img = new Image();
      img.src = src;
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

    const instant = Boolean(options.skipVideo);
    const startScreen = document.getElementById("startScreen");
    const overlay = document.getElementById("loadingVideoOverlay");

    window.CMRAudio?.unlock?.();
    window.CMRProfile?.vibrate?.(16);
    preloadCoreAssetsBackground();

    try {
      if (typeof window.CMRShowWorldMap !== "function") {
        throw new Error("World map module not ready");
      }

      if (startScreen && !instant) {
        startScreen.classList.add("is-leaving");
        await new Promise((r) => setTimeout(r, 260));
      }

      // Pause startup video immediately to save mobile CPU & memory
      window.CMRPauseSplashVideo?.();
      const introVideo = document.getElementById("startCinematicVideo");
      if (introVideo) {
        try {
          introVideo.pause();
        } catch (_) {}
      }

      if (overlay) overlay.classList.add("hidden");
      if (startScreen) {
        startScreen.classList.add("hidden");
        startScreen.classList.remove("is-leaving");
      }

      if (options.autostartStage) {
        await window.CMRStartSelectedHouse?.(options.autostartStage);
      } else {
        window.CMRShowWorldMap();
      }
    } catch (err) {
      console.error("[CMR launch]", err);
      if (startScreen) startScreen.classList.remove("is-leaving");
      launching = false;
      showLaunchError("تعذر تشغيل اللعبة، حاول مرة أخرى.");
      return;
    }

    launching = false;
  }

  function showMainMenu() {
    const startScreen = document.getElementById("startScreen");
    const overlay = document.getElementById("loadingVideoOverlay");
    window.CMRAudio?.setMapMusicActive?.(false);
    window.CMRHideWorldMap?.();
    window.CMRPauseGameRender?.();
    if (overlay) overlay.classList.add("hidden");
    if (startScreen) {
      startScreen.classList.remove("hidden", "is-leaving");
    }
    document.body.classList.remove("map-open");
    document.body.dataset.state = "title";
    window.CMRResumeSplashVideo?.();
    window.CMRGame?.syncMenuUI?.();
  }

  function isAnyModalOpen() {
    return document.querySelectorAll(".modal:not(.hidden)").length > 0;
  }

  function initMenu() {
    document.body.dataset.state = "title";
    preloadCoreAssetsBackground();

    const guestBtn = document.getElementById("splashGuestBtn");
    if (guestBtn) {
      guestBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.CMRAudio?.playSfx?.("match");
        // Preserve customized player name if already set; only initialize guest identity if missing
        const st = window.CMRProfile?.getProfileState?.();
        if (!st || !st.identity || !st.identity.id) {
          window.CMRGame?.setGuestProfile?.();
        }
        void launchGame();
      });
    }

    const fbBtn = document.getElementById("splashFacebookBtn");
    if (fbBtn) {
      fbBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.CMRAudio?.playSfx?.("swap");
        const st = window.CMRProfile?.getProfileState?.();
        if (st && st.identity && st.identity.provider === "account") {
          void launchGame();
        } else {
          window.CMRGame?.openLogin?.();
        }
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

    // Support ?autostart=1 (or ?autostart=map / ?autostart=stage) for direct launch & testing
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