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
    "./mega_pack/09_pharaonic_ui_frames/ui_pharaonic_palace_header.png",
    "./mega_pack/09_pharaonic_ui_frames/ui_prelevel_frame.png",
    "./mega_pack/09_pharaonic_ui_frames/hud_objective_panel_empty.png",
    "./mega_pack/07_boards_regular_50/board_01.webp",
    "./mega_pack/06_characters_50frames_10x5/sheet_cleopatra_queen_50frames_10x5.png",
    "./mega_pack/06_characters_50frames_10x5/sheet_golden_dragon_50frames_10x5.png",
    "./mega_pack/01_candies_royal_desserts/dessert_01_red_cupcake.png",
    "./mega_pack/01_candies_royal_desserts/dessert_02_blue_donut.png",
    "./mega_pack/01_candies_royal_desserts/dessert_03_green_macaron.png",
    "./mega_pack/01_candies_royal_desserts/dessert_04_yellow_star_cookie.png",
    "./mega_pack/01_candies_royal_desserts/dessert_05_purple_berry_tart.png",
    "./mega_pack/01_candies_royal_desserts/dessert_06_orange_glaze_swirl.png",
  ];

  let launching = false;
  let preloaded = false;

  function preloadCoreAssetsBackground() {
    if (preloaded) return;
    preloaded = true;
    CORE_ASSETS.forEach((src) => {
      try {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        if (typeof img.decode === "function") img.decode().catch(() => {});
      } catch (_) {}
    });
    window.CMRAnubisAudio?.preloadAll?.();
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

      const shell = document.getElementById("gameShell");
      if (options.autostartStage) {
        if (overlay) overlay.classList.add("hidden");
        if (startScreen) {
          startScreen.classList.add("hidden");
          startScreen.classList.remove("is-leaving");
        }
        await window.CMRStartSelectedHouse?.(options.autostartStage);
      } else {
        // Show World Map BEFORE hiding Start Screen and keep #gameShell strictly hidden -> ZERO 1s board flash!
        if (shell) shell.classList.add("is-hidden-shell");
        document.body.classList.remove("game-started");
        window.CMRShowWorldMap();
        if (overlay) overlay.classList.add("hidden");
        if (startScreen) {
          startScreen.classList.add("hidden");
          startScreen.classList.remove("is-leaving");
        }
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
    const shell = document.getElementById("gameShell");
    if (shell) shell.classList.add("is-hidden-shell");
    document.body.classList.remove("game-started");
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