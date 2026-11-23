/**
 * Candy Magic Royale - 3D Animated Pharaoh Dragon + Win 3 & Loss 3 Animated UI (v6)
 * - Replaces old green 3D dragon with the 3D Pharaoh Dragon in the right arch, facing screen,
 *   with 5 cycling match animations + tap reaction.
 * - Replaces the default Win & Loss popups with the animated Candy Pop Royal UI (Win 3 & Loss 3)
 *   featuring the English "Candy Magic Royale" logo at the top, staggered entrance animations,
 *   pop-in stars, confetti/sparkles, cracked crystal heart, and wired 3D buttons.
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
    if (document.getElementById("cmr-v6-styles")) return;
    const st = document.createElement("style");
    st.id = "cmr-v6-styles";
    st.textContent = `
      /* ===== 3D Pharaoh Dragon Overlay ===== */
      .dragon-3d-replaced { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
      .dragon-3d-overlay {
        position: fixed !important; overflow: hidden !important; cursor: pointer;
        -webkit-tap-highlight-color: transparent; pointer-events: auto !important;
        background: transparent !important; z-index: 25 !important;
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

      /* ===== Candy Magic Royale - Win 3 & Loss 3 Animated Screens ===== */
      .cmr-native-hidden { opacity: 0 !important; pointer-events: none !important; }

      .cmr-screen-backdrop {
        position: fixed; inset: 0; z-index: 99999;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 18px 16px; box-sizing: border-box;
        font-family: 'Cairo', 'Tajawal', 'Segoe UI', Tahoma, sans-serif;
        direction: rtl; user-select: none; -webkit-tap-highlight-color: transparent;
        overflow: hidden;
        animation: cmrFadeIn 0.32s ease-out forwards;
      }
      .cmr-screen-backdrop.cmr-win-mode {
        background: radial-gradient(circle at 50% 35%, rgba(92, 26, 132, 0.78) 0%, rgba(28, 10, 56, 0.9) 75%);
        backdrop-filter: blur(6px);
      }
      .cmr-screen-backdrop.cmr-loss-mode {
        background: radial-gradient(circle at 50% 35%, rgba(36, 26, 84, 0.84) 0%, rgba(13, 12, 34, 0.94) 75%);
        backdrop-filter: blur(7px);
      }

      /* Ambient rotating rays (Win) & twilight aura (Loss) */
      .cmr-bg-rays {
        position: absolute; left: 50%; top: 44%; width: 150vmax; height: 150vmax;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 0;
      }
      .cmr-win-mode .cmr-bg-rays {
        background: repeating-conic-gradient(from 0deg, rgba(255, 224, 110, 0.16) 0deg 10deg, transparent 10deg 24deg);
        animation: cmrRaysSpin 24s linear infinite;
      }
      .cmr-loss-mode .cmr-bg-rays {
        background: radial-gradient(circle, rgba(116, 130, 255, 0.24) 0%, rgba(72, 46, 148, 0.08) 40%, transparent 65%);
        animation: cmrAuraBreath 3.5s ease-in-out infinite alternate;
      }

      /* Floating particles / confetti layer */
      .cmr-particles { position: absolute; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
      .cmr-confetti {
        position: absolute; top: -16px; width: 10px; height: 16px; border-radius: 3px;
        opacity: 0.92; animation: cmrConfettiFall var(--dur, 4s) linear var(--del, 0s) infinite;
      }
      .cmr-dust {
        position: absolute; width: 6px; height: 6px; border-radius: 50%;
        background: radial-gradient(circle, #c8e2ff 0%, rgba(160, 120, 255, 0) 70%);
        animation: cmrDustDrift var(--dur, 5s) ease-in-out var(--del, 0s) infinite alternate;
      }

      /* Top English Logo: Candy Magic Royale */
      .cmr-en-logo {
        position: relative; z-index: 4; text-align: center; direction: ltr;
        margin-bottom: 10px;
        animation: cmrLogoDrop 0.55s cubic-bezier(0.22, 1.32, 0.36, 1) forwards;
      }
      .cmr-en-logo-top {
        display: block; font-weight: 900; font-size: 27px; line-height: 1.02; letter-spacing: 0.6px;
        background: linear-gradient(180deg, #fff9d6 0%, #ffe066 48%, #ff9d2e 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
        filter: drop-shadow(0 3px 0 #6e1a7a) drop-shadow(0 6px 14px rgba(255, 190, 50, 0.55));
      }
      .cmr-en-logo-sub {
        display: inline-block; font-weight: 900; font-size: 16px; letter-spacing: 2.8px; text-transform: uppercase;
        color: #fff; padding: 2px 14px; border-radius: 999px; margin-top: 2px;
        background: linear-gradient(90deg, #a93cff 0%, #ff4da6 50%, #a93cff 100%);
        border: 1.5px solid #ffe484; box-shadow: 0 3px 10px rgba(0,0,0,0.35);
      }
      .cmr-loss-mode .cmr-en-logo-top {
        background: linear-gradient(180deg, #f0f6ff 0%, #c6d6ff 55%, #9da8f0 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
        filter: drop-shadow(0 3px 0 #2b1d5c) drop-shadow(0 6px 14px rgba(120, 140, 255, 0.45));
      }
      .cmr-loss-mode .cmr-en-logo-sub {
        background: linear-gradient(90deg, #4b389e 0%, #7d52cc 50%, #4b389e 100%);
        border-color: #cbd5ff;
      }

      /* Main Modal Wrapper */
      .cmr-stage {
        position: relative; z-index: 3; width: 100%; max-width: 345px;
        display: flex; flex-direction: column; align-items: center;
        animation: cmrCardPop 0.58s cubic-bezier(0.22, 1.28, 0.36, 1) 0.08s both,
                   cmrGentleFloat 3.6s ease-in-out 0.7s infinite;
      }

      /* Curved Ribbon Banner */
      .cmr-ribbon {
        position: relative; z-index: 6; width: 92%; padding: 11px 18px 12px;
        border-radius: 24px 24px 18px 18px; text-align: center;
        border: 3px solid #ffe57f;
        box-shadow: 0 8px 20px rgba(0,0,0,0.4), inset 0 3px 8px rgba(255,255,255,0.45);
        margin-bottom: -14px;
        animation: cmrRibbonBounce 0.6s cubic-bezier(0.22, 1.35, 0.36, 1) 0.16s both;
      }
      .cmr-win-mode .cmr-ribbon {
        background: linear-gradient(180deg, #ff6fb5 0%, #e02984 55%, #ad1463 100%);
      }
      .cmr-loss-mode .cmr-ribbon {
        background: linear-gradient(180deg, #c93b7b 0%, #8e1e5b 55%, #5b1248 100%);
        border-color: #f3c669;
      }
      .cmr-ribbon-title {
        font-size: 25px; font-weight: 900; color: #fff8c8;
        text-shadow: 0 3px 0 #6b0b3e, 0 0 12px rgba(255, 224, 102, 0.55);
        margin: 0; line-height: 1.15;
      }
      .cmr-loss-badge {
        display: inline-block; margin-bottom: -8px; z-index: 7; position: relative;
        padding: 4px 22px; border-radius: 18px 18px 4px 4px;
        background: linear-gradient(180deg, #7f68c8 0%, #4b378f 100%);
        border: 2.5px solid #dfe6ff; color: #fff; font-size: 16px; font-weight: 900;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      }

      /* Rainbow 3-Stars Arc (Win 3) */
      .cmr-stars-arc {
        position: relative; z-index: 6; width: 250px; height: 84px;
        display: flex; align-items: flex-end; justify-content: center; gap: 6px;
        margin-top: 18px; margin-bottom: -24px;
      }
      .cmr-rainbow-glow {
        position: absolute; left: 50%; bottom: 4px; width: 220px; height: 84px;
        transform: translateX(-50%); border-radius: 120px 120px 0 0; pointer-events: none; z-index: 0;
        background: radial-gradient(circle at 50% 100%, transparent 40%, rgba(120,210,255,.55) 48%, rgba(120,255,150,.55) 56%, rgba(255,235,100,.65) 64%, rgba(255,110,190,.6) 72%, transparent 80%);
        filter: blur(2px);
      }
      .cmr-star-item {
        position: relative; z-index: 2; width: 64px; height: 64px;
        opacity: 0; transform: scale(0.2) rotate(-35deg);
        animation: cmrStarPop 0.55s cubic-bezier(0.2, 1.45, 0.35, 1) var(--sdel, 0.35s) forwards;
      }
      .cmr-star-item.cmr-star-mid { width: 82px; height: 82px; margin-bottom: 12px; }
      .cmr-star-item.cmr-star-dim { filter: grayscale(0.85) brightness(0.55); }

      /* Main Ornate Card (Win 3 Cream-Gold / Loss 3 Lavender-Silver) */
      .cmr-card {
        position: relative; z-index: 4; width: 100%; border-radius: 26px;
        padding: 34px 18px 20px; box-sizing: border-box; text-align: center;
      }
      .cmr-win-mode .cmr-card {
        background: linear-gradient(180deg, #fffdf4 0%, #fff3d6 100%);
        border: 5px solid #f7c948;
        box-shadow: 0 14px 36px rgba(0,0,0,0.48), 0 0 0 3px #fff3c4 inset, 0 0 28px rgba(255, 200, 70, 0.45);
      }
      .cmr-loss-mode .cmr-card {
        background: linear-gradient(180deg, #cbbcf2 0%, #a995df 100%);
        border: 5px solid #d7e0f7;
        box-shadow: 0 14px 36px rgba(0,0,0,0.55), 0 0 0 3px rgba(255,255,255,0.45) inset, 0 0 28px rgba(130, 150, 255, 0.4);
        padding-top: 28px;
      }

      /* Side Candy Ornaments (Win 3) */
      .cmr-candy-deco {
        position: absolute; font-size: 36px; z-index: 6; pointer-events: none;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        animation: cmrCandyBob 2.6s ease-in-out infinite alternate;
      }
      .cmr-candy-l { left: -18px; top: -18px; }
      .cmr-candy-r { right: -18px; top: -18px; animation-delay: 0.4s; }

      /* Rewards Box (Win 3) */
      .cmr-rewards-title { font-size: 18px; font-weight: 900; color: #7b3510; margin: 2px 0 10px; }
      .cmr-rewards-box {
        display: flex; align-items: center; justify-content: center; gap: 18px;
        background: rgba(232, 204, 156, 0.42); border: 2px solid rgba(226, 179, 96, 0.55);
        border-radius: 18px; padding: 14px 12px; margin-bottom: 16px;
      }
      .cmr-reward-badge {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 96px; height: 96px; border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #fff4b8 0%, #f5b92a 65%, #c77b08 100%);
        border: 3px solid #fff6cf; box-shadow: 0 6px 14px rgba(170, 100, 0, 0.35);
        animation: cmrBadgePulse 2.4s ease-in-out infinite;
      }
      .cmr-reward-badge.cmr-potion {
        background: radial-gradient(circle at 35% 30%, #f7d6ff 0%, #a54cff 65%, #651db8 100%);
        border-color: #ffe38f; animation-delay: 0.35s;
      }
      .cmr-reward-val { font-size: 23px; font-weight: 900; color: #fff; text-shadow: 0 2px 0 rgba(0,0,0,0.4); line-height: 1; }
      .cmr-reward-ico { font-size: 32px; line-height: 1.1; }

      /* Cracked Crystal Heart +5 Centerpiece (Loss 3) */
      .cmr-heart-wrap {
        position: relative; width: 138px; height: 124px; margin: 4px auto 16px;
        display: flex; align-items: center; justify-content: center;
        animation: cmrHeartShake 0.7s ease-in-out 0.3s both, cmrBadgePulse 2.6s ease-in-out 1.1s infinite;
      }
      .cmr-plus5-pill {
        position: absolute; right: 2px; bottom: 4px; width: 52px; height: 52px; border-radius: 50%;
        background: linear-gradient(180deg, #b88cff 0%, #6d3fd4 100%);
        border: 3px solid #f0e8ff; color: #ffe875; font-size: 22px; font-weight: 900;
        display: flex; align-items: center; justify-content: center;
        text-shadow: 0 2px 0 #34137a; box-shadow: 0 5px 12px rgba(0,0,0,0.35);
      }

      /* Glossy 3D Jelly Buttons */
      .cmr-btn-main {
        position: relative; overflow: hidden; width: 100%; padding: 14px 18px;
        border-radius: 999px; border: 3px solid #ffe787; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 10px;
        font-family: inherit; font-size: 20px; font-weight: 900; color: #fff;
        text-shadow: 0 2px 2px rgba(0, 60, 40, 0.55);
        background: linear-gradient(180deg, #3df2c4 0%, #0ec797 52%, #079471 100%);
        box-shadow: 0 6px 0 #056b50, 0 10px 22px rgba(10, 180, 130, 0.45), inset 0 4px 8px rgba(255,255,255,0.55);
        transition: transform 0.12s ease;
        animation: cmrBtnPop 0.5s cubic-bezier(0.22, 1.32, 0.36, 1) 0.42s both;
      }
      .cmr-btn-main::after {
        content: ""; position: absolute; top: 0; left: -120%; width: 60%; height: 100%;
        background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%);
        animation: cmrShineSweep 2.8s ease-in-out 1s infinite;
      }
      .cmr-btn-main:active { transform: translateY(4px) scale(0.97); }
      .cmr-btn-main-sub { display: block; font-size: 14px; font-weight: 800; color: #eafff6; margin-top: 1px; }

      /* Bottom Row (Retry + Map) */
      .cmr-btn-row {
        display: flex; gap: 10px; width: 100%; margin-top: 14px;
        animation: cmrBtnPop 0.5s cubic-bezier(0.22, 1.32, 0.36, 1) 0.54s both;
      }
      .cmr-btn-sec {
        flex: 1; padding: 11px 10px; border-radius: 999px; border: 2.5px solid #ffe484; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 6px;
        font-family: inherit; font-size: 15px; font-weight: 900; color: #fff;
        text-shadow: 0 2px 2px rgba(0,0,0,0.42); transition: transform 0.12s ease;
      }
      .cmr-btn-sec:active { transform: translateY(3px) scale(0.96); }
      .cmr-btn-purple {
        background: linear-gradient(180deg, #b84dff 0%, #861be0 55%, #620db0 100%);
        box-shadow: 0 5px 0 #44077d, 0 8px 16px rgba(130, 27, 224, 0.4), inset 0 3px 6px rgba(255,255,255,0.45);
      }
      .cmr-btn-pink {
        background: linear-gradient(180deg, #ff63b1 0%, #e0227e 55%, #b51262 100%);
        box-shadow: 0 5px 0 #7a0940, 0 8px 16px rgba(224, 34, 126, 0.4), inset 0 3px 6px rgba(255,255,255,0.45);
      }
      .cmr-btn-amber {
        background: linear-gradient(180deg, #ffd257 0%, #f59b16 55%, #cc7206 100%);
        box-shadow: 0 5px 0 #8a4a00, 0 8px 16px rgba(245, 155, 22, 0.4), inset 0 3px 6px rgba(255,255,255,0.55);
      }

      /* Keyframes */
      @keyframes cmrFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes cmrLogoDrop { 0% { opacity: 0; transform: translateY(-28px) scale(0.82); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes cmrCardPop { 0% { opacity: 0; transform: scale(0.76) translateY(36px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes cmrRibbonBounce { 0% { opacity: 0; transform: scale(0.65) translateY(-16px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes cmrStarPop { 0% { opacity: 0; transform: scale(0.15) rotate(-45deg); } 70% { opacity: 1; transform: scale(1.16) rotate(6deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
      @keyframes cmrBtnPop { 0% { opacity: 0; transform: translateY(18px) scale(0.9); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes cmrGentleFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      @keyframes cmrBadgePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      @keyframes cmrCandyBob { 0% { transform: rotate(-10deg) translateY(0); } 100% { transform: rotate(8deg) translateY(-5px); } }
      @keyframes cmrHeartShake { 0% { transform: scale(0.5); opacity: 0; } 45% { transform: scale(1.12) rotate(-7deg); opacity: 1; } 70% { transform: scale(0.96) rotate(5deg); } 100% { transform: scale(1) rotate(0); } }
      @keyframes cmrShineSweep { 0% { left: -120%; } 45%, 100% { left: 140%; } }
      @keyframes cmrRaysSpin { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
      @keyframes cmrAuraBreath { 0% { opacity: 0.45; transform: translate(-50%,-50%) scale(0.95); } 100% { opacity: 0.9; transform: translate(-50%,-50%) scale(1.05); } }
      @keyframes cmrConfettiFall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 0.95; } 100% { transform: translateY(105vh) rotate(540deg); opacity: 0.35; } }
      @keyframes cmrDustDrift { 0% { transform: translate(0, 0) scale(0.8); opacity: 0.3; } 100% { transform: translate(16px, -24px) scale(1.3); opacity: 0.9; } }
    `;
    document.head.appendChild(st);
  }

  function starSVG(earned) {
    const fill1 = earned ? "#fff7a8" : "#9ba4b8";
    const fill2 = earned ? "#ffb81c" : "#5e677a";
    const stroke = earned ? "#e07b00" : "#3a404f";
    return `<svg viewBox="0 0 64 64" width="100%" height="100%" style="filter:drop-shadow(0 4px 8px ${earned ? "rgba(255,190,30,.65)" : "rgba(0,0,0,.35)"})">
      <defs><linearGradient id="sg_${earned ? "y" : "n"}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${fill1}"/><stop offset="100%" stop-color="${fill2}"/></linearGradient></defs>
      <path d="M32 4 L40.5 21.5 L60 24.3 L45.8 38 L49.2 57.5 L32 48.3 L14.8 57.5 L18.2 38 L4 24.3 L23.5 21.5 Z" fill="url(#sg_${earned ? "y" : "n"})" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M32 9 L37 20 L26 23 Z" fill="rgba(255,255,255,0.55)"/>
    </svg>`;
  }

  function crackedHeartSVG() {
    return `<svg viewBox="0 0 120 110" width="116" height="106" style="filter:drop-shadow(0 8px 18px rgba(255,60,150,0.55))">
      <defs>
        <linearGradient id="cmrHGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff99d6"/><stop offset="45%" stop-color="#ff3898"/><stop offset="100%" stop-color="#b80f68"/>
        </linearGradient>
      </defs>
      <path d="M60 100 C20 74 6 52 6 31 C6 15 19 4 34 4 C45 4 54 10 60 19 C66 10 75 4 86 4 C101 4 114 15 114 31 C114 52 100 74 60 100 Z" fill="url(#cmrHGrad)" stroke="#ffd6ef" stroke-width="3"/>
      <path d="M22 24 C24 14 34 11 42 15" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="4" stroke-linecap="round"/>
      <path d="M60 19 L52 38 L65 52 L54 70 L62 88" fill="none" stroke="#3c0629" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M60 19 L52 38 L65 52 L54 70 L62 88" fill="none" stroke="#ffd1ec" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
    </svg>`;
  }

  function videoIconSVG() {
    return `<svg viewBox="0 0 36 28" width="28" height="22" style="flex-shrink:0;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))">
      <rect x="2" y="2" width="32" height="24" rx="5" fill="#fff" stroke="#0d7a5c" stroke-width="2"/>
      <polygon points="15,8 25,14 15,20" fill="#0ec797"/>
    </svg>`;
  }

  /**
   * Builds and displays the Win 3 or Loss 3 animated Candy Magic Royale overlay.
   */
  function showCandyScreen(mode, opts) {
    removeCandyScreen();
    injectStyles();

    const options = opts || {};
    const starsCount = Math.max(1, Math.min(3, options.stars || 3));
    const coinsVal = options.coins || 150;

    const wrap = document.createElement("div");
    wrap.id = "cmr-candy-screen";
    wrap.className = "cmr-screen-backdrop " + (mode === "win" ? "cmr-win-mode" : "cmr-loss-mode");

    // Particles HTML
    let particlesHtml = "";
    if (mode === "win") {
      const colors = ["#ff5ea8", "#ffd84d", "#4de6c2", "#a95cff", "#ff8a3d", "#5bc8ff"];
      for (let i = 0; i < 24; i++) {
        const left = (i * 4.2 + (i % 3) * 1.7) % 98;
        const dur = (3.2 + (i % 5) * 0.65).toFixed(2);
        const del = ((i % 7) * 0.45).toFixed(2);
        particlesHtml += `<span class="cmr-confetti" style="left:${left}%;background:${colors[i % colors.length]};--dur:${dur}s;--del:${del}s"></span>`;
      }
    } else {
      for (let i = 0; i < 18; i++) {
        const left = (i * 5.7) % 96;
        const top = (i * 7.3) % 92;
        const dur = (3.5 + (i % 4) * 0.9).toFixed(2);
        const del = ((i % 5) * 0.4).toFixed(2);
        particlesHtml += `<span class="cmr-dust" style="left:${left}%;top:${top}%;--dur:${dur}s;--del:${del}s"></span>`;
      }
    }

    const logoHtml = `
      <div class="cmr-en-logo">
        <span class="cmr-en-logo-top">Candy Magic</span>
        <span class="cmr-en-logo-sub">ROYALE</span>
      </div>`;

    if (mode === "win") {
      wrap.innerHTML = `
        <div class="cmr-bg-rays"></div>
        <div class="cmr-particles">${particlesHtml}</div>
        ${logoHtml}
        <div class="cmr-stage">
          <div class="cmr-ribbon"><div class="cmr-ribbon-title">أحسنت! فوز رائع</div></div>
          <div class="cmr-stars-arc">
            <div class="cmr-rainbow-glow"></div>
            <div class="cmr-star-item ${starsCount >= 1 ? "" : "cmr-star-dim"}" style="--sdel:0.32s">${starSVG(starsCount >= 1)}</div>
            <div class="cmr-star-item cmr-star-mid ${starsCount >= 2 ? "" : "cmr-star-dim"}" style="--sdel:0.50s">${starSVG(starsCount >= 2)}</div>
            <div class="cmr-star-item ${starsCount >= 3 ? "" : "cmr-star-dim"}" style="--sdel:0.68s">${starSVG(starsCount >= 3)}</div>
          </div>
          <div class="cmr-card">
            <span class="cmr-candy-deco cmr-candy-l">🍭</span>
            <span class="cmr-candy-deco cmr-candy-r">🍬</span>
            <div class="cmr-rewards-title">المكافآت</div>
            <div class="cmr-rewards-box">
              <div class="cmr-reward-badge">
                <span class="cmr-reward-ico">🪙</span>
                <span class="cmr-reward-val">${coinsVal}</span>
              </div>
              <div class="cmr-reward-badge cmr-potion">
                <span class="cmr-reward-ico">🧪</span>
                <span class="cmr-reward-val" dir="ltr">+1</span>
              </div>
            </div>
            <button class="cmr-btn-main" data-cmr-act="next">المرحلة التالية</button>
          </div>
          <div class="cmr-btn-row">
            <button class="cmr-btn-sec cmr-btn-pink" data-cmr-act="map">🗺️ الخريطة</button>
            <button class="cmr-btn-sec cmr-btn-purple" data-cmr-act="retry">↻ إعادة المرحلة</button>
          </div>
        </div>`;
    } else {
      wrap.innerHTML = `
        <div class="cmr-bg-rays"></div>
        <div class="cmr-particles">${particlesHtml}</div>
        ${logoHtml}
        <div class="cmr-stage">
          <div class="cmr-loss-badge">خسارة</div>
          <div class="cmr-ribbon"><div class="cmr-ribbon-title">انتهت الحركات!</div></div>
          <div class="cmr-card">
            <div class="cmr-heart-wrap">
              ${crackedHeartSVG()}
              <div class="cmr-plus5-pill" dir="ltr">+5</div>
            </div>
            <button class="cmr-btn-main" data-cmr-act="video">
              ${videoIconSVG()}
              <span>مشاهدة فيديو<span class="cmr-btn-main-sub">(+5 حركات)</span></span>
            </button>
          </div>
          <div class="cmr-btn-row">
            <button class="cmr-btn-sec cmr-btn-amber" data-cmr-act="map">🗺️ الرجوع للخريطة</button>
            <button class="cmr-btn-sec cmr-btn-purple" data-cmr-act="retry">↻ إعادة المحاولة</button>
          </div>
        </div>`;
    }

    document.body.appendChild(wrap);

    // Wire buttons to the game's real underlying buttons or fallback handlers
    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cmr-act]");
      if (!btn) return;
      const act = btn.getAttribute("data-cmr-act");
      const orig = options.nativeEl;

      function clickMatchingNative(re) {
        if (!orig) return false;
        const nBtns = Array.from(orig.querySelectorAll("button, .btn, [role='button']"));
        const found = nBtns.find((b) => re.test((b.textContent || "").trim()));
        if (found) {
          found.click();
          return true;
        }
        return false;
      }

      if (act === "next") {
        if (!clickMatchingNative(/(المرحلة التالية|استمرار|التالي|next|continue)/i)) {
          const nb = document.querySelector("#nextBtn");
          if (nb) nb.click();
        }
        removeCandyScreen(orig);
      } else if (act === "retry") {
        if (!clickMatchingNative(/(إعادة|حاول|retry|restart|again)/i)) {
          const rb = document.querySelector("#restartBtn");
          if (rb) rb.click();
        }
        removeCandyScreen(orig);
      } else if (act === "map") {
        if (!clickMatchingNative(/(الخريطة|القائمة|map|home|menu|استمرار)/i)) {
          const mb = document.querySelector("#mapBtn, .map-btn, #homeBtn");
          if (mb) mb.click();
          else if (typeof window.showWorldMap === "function") window.showWorldMap();
        }
        removeCandyScreen(orig);
      } else if (act === "video") {
        // Trigger game's +5 moves / rewarded-ad button if available
        if (!clickMatchingNative(/(فيديو|إعلان|5|حركات|ad|video|moves)/i)) {
          const mvBtn = document.querySelector("#movesBtn");
          if (mvBtn) mvBtn.click();
        }
        removeCandyScreen(orig);
      }
    });

    if (mode === "win" && window.Dragon3DCharacter && typeof window.Dragon3DCharacter.playCelebrate === "function") {
      window.Dragon3DCharacter.playCelebrate();
    }
  }

  function removeCandyScreen(nativeEl) {
    const existing = document.getElementById("cmr-candy-screen");
    if (existing) existing.remove();
    if (nativeEl) nativeEl.classList.remove("cmr-native-hidden");
    document.querySelectorAll(".cmr-native-hidden").forEach((el) => el.classList.remove("cmr-native-hidden"));
  }

  /**
   * Robustly detects ANY visible native Win or Loss popup in the game (regardless of class names).
   */
  function initWinLossWatcher() {
    const WIN_RE = /(انتصار\s*سحري|انتصار|فوز|المرحلة التالية|مبروك|victory|you win)/i;
    const LOSS_RE = /(انتهت الحركات|خسارة|نفدت الحركات|حاول مرة|للأسف|out of moves|game over|try again)/i;

    let lastShownFor = null;

    function scanForNativePopup() {
      if (document.getElementById("cmr-candy-screen")) return;

      // Look for any visible button or heading containing Win/Loss text, then walk up to its modal overlay
      const nodes = Array.from(document.querySelectorAll("h1, h2, h3, button, .modal-title, [class*='modal'], [class*='popup'], [class*='dialog'], [id*='modal']"));
      for (const el of nodes) {
        if (el.closest("#cmr-candy-screen")) continue;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 40 || rect.height < 18) continue;

        const txt = (el.textContent || "").trim();
        if (txt.length > 350) continue;

        const isWin = WIN_RE.test(txt);
        const isLoss = !isWin && LOSS_RE.test(txt);
        if (!isWin && !isLoss) continue;

        // Walk up to find the modal container (fixed/absolute overlay covering a noticeable area)
        let container = el;
        while (container.parentElement && container.parentElement !== document.body) {
          const p = container.parentElement;
          const pcs = getComputedStyle(p);
          if (pcs.position === "fixed" || pcs.position === "absolute" || parseInt(pcs.zIndex, 10) >= 20) {
            container = p;
            if (p.getBoundingClientRect().width >= window.innerWidth * 0.7) break;
          } else {
            container = p;
          }
        }
        if (container === document.body || container.id === "cmr-candy-screen") continue;
        if (lastShownFor === container && container.dataset.cmrHandled === "1") continue;

        const fullTxt = (container.textContent || "").trim();
        const coinMatch = fullTxt.match(/(\d+)\s*(?:عملة|coin)/i);
        const starMatch = fullTxt.match(/(\d)\s*(?:نجوم|نجمة|star)/i);

        container.classList.add("cmr-native-hidden");
        container.dataset.cmrHandled = "1";
        lastShownFor = container;

        showCandyScreen(isWin ? "win" : "loss", {
          nativeEl: container,
          coins: coinMatch ? parseInt(coinMatch[1], 10) : 150,
          stars: starMatch ? parseInt(starMatch[1], 10) : 3,
        });
        return;
      }

      // Reset handled flag once native modal disappears
      if (lastShownFor) {
        const cs = getComputedStyle(lastShownFor);
        if (cs.display === "none" || cs.visibility === "hidden" || !document.body.contains(lastShownFor)) {
          lastShownFor.dataset.cmrHandled = "0";
          lastShownFor = null;
        }
      }
    }

    setInterval(scanForNativePopup, 450);
    if (window.MutationObserver) {
      let t = null;
      new MutationObserver(() => {
        if (t) return;
        t = setTimeout(() => { t = null; scanForNativePopup(); }, 120);
      }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden"] });
    }

    window.CandyMagicScreens = {
      showWin: (stars, coins) => showCandyScreen("win", { stars: stars || 3, coins: coins || 150 }),
      showLoss: () => showCandyScreen("loss", {}),
      close: () => removeCandyScreen(),
    };
  }

  /* ===== 3D Pharaoh Dragon Module ===== */
  function hideOldGreenDragonInGameScenes(B, ownScene) {
    if (!B || !B.Engine || !Array.isArray(B.Engine.Instances)) return;
    function isGreenishMaterial(mat) {
      if (!mat) return false;
      const c = mat.albedoColor || mat.diffuseColor || mat.emissiveColor;
      return !!(c && c.g > 0.35 && c.g > c.r * 1.18);
    }
    for (const eng of B.Engine.Instances) {
      if (!eng || !Array.isArray(eng.scenes)) continue;
      for (const sc of eng.scenes) {
        if (!sc || sc === ownScene) continue;
        const hiddenRoots = new Set();
        [].concat(sc.transformNodes || []).concat(sc.meshes || []).forEach((node) => {
          if (/(dragon|drg|mascot_right|right_char|green_char|dino|lizard)/i.test(node.name || "")) hiddenRoots.add(node);
        });
        (sc.meshes || []).forEach((m) => {
          if (!m || !m.isVisible) return;
          if (/(candy|tile|board|grid|frame|bg|video|queen|crown|heart|star|flower|diamond|swirl|cage|ice)/i.test(m.name || "")) return;
          if (isGreenishMaterial(m.material)) {
            const wp = typeof m.getAbsolutePosition === "function" ? m.getAbsolutePosition() : m.position;
            if (wp && wp.x > 0.25) {
              let top = m;
              while (top.parent && !/(root|scene|world|stage)/i.test(top.parent.name || "")) top = top.parent;
              hiddenRoots.add(top);
            }
          }
        });
        hiddenRoots.forEach((root) => {
          try {
            if (typeof root.setEnabled === "function") root.setEnabled(false);
            if ("isVisible" in root) root.isVisible = false;
            if (typeof root.getChildMeshes === "function") {
              root.getChildMeshes(false).forEach((ch) => { ch.isVisible = false; if (typeof ch.setEnabled === "function") ch.setEnabled(false); });
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
    const refW = Math.min(vw, 520), leftOffset = (vw - refW) * 0.5;
    return { left: leftOffset + refW * 0.525, top: Math.max(8, vh * 0.012), width: refW * 0.24, height: Math.min(vh * 0.19, refW * 0.34), borderRadius: "50% 50% 18% 18% / 55% 55% 15% 15%" };
  }

  async function mount() {
    if (window.__dragon3dV6Mounted) return;
    window.__dragon3dV6Mounted = true;
    injectStyles();
    initWinLossWatcher();

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
    const engine = new B.Engine(canvas, true, { alpha: true, premultipliedAlpha: false, antialias: true, powerPreference: "high-performance" });
    engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2));

    const scene = new B.Scene(engine);
    scene.clearColor = new B.Color4(0, 0, 0, 0);

    hideOldGreenDragonInGameScenes(B, scene);
    setTimeout(() => hideOldGreenDragonInGameScenes(B, scene), 800);
    setTimeout(() => hideOldGreenDragonInGameScenes(B, scene), 2200);
    setTimeout(() => hideOldGreenDragonInGameScenes(B, scene), 4500);

    const camera = new B.ArcRotateCamera("pharaohDragonCam", Math.PI / 2, Math.PI / 2.06, 1.32, new B.Vector3(0, 0.03, 0), scene);
    camera.minZ = 0.01; camera.fov = 0.72;

    const hemi = new B.HemisphericLight("dHemi", new B.Vector3(0, 1, 0.5), scene);
    hemi.intensity = 1.45; hemi.diffuse = new B.Color3(1, 0.98, 0.94); hemi.groundColor = new B.Color3(0.45, 0.26, 0.62);
    const key = new B.DirectionalLight("dKey", new B.Vector3(-0.3, -0.4, -0.85), scene);
    key.intensity = 1.65; key.diffuse = new B.Color3(1, 0.94, 0.8);
    const rim = new B.PointLight("dRim", new B.Vector3(0.5, 0.65, 1.3), scene);
    rim.intensity = 1.85; rim.diffuse = new B.Color3(0.95, 0.72, 1);

    const res = await B.SceneLoader.ImportMeshAsync("", CFG.root, CFG.file, scene);
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
    function playClipOnce(g, spd) {
      if (!g) return;
      if (idle && idle.isPlaying) idle.stop();
      if (activeClip && activeClip !== g) activeClip.stop();
      activeClip = g; g.reset(); g.start(false, spd || 1, g.from, g.to, false);
      g.onAnimationGroupEndObservable.clear();
      g.onAnimationGroupEndObservable.addOnce(() => { activeClip = null; playIdle(); });
    }
    function playNextMatchAnimation() {
      const now = performance.now();
      if (now - lastAnimAt < CFG.cooldownMs) return;
      lastAnimAt = now;
      const mode = matchAnimIndex % 5; matchAnimIndex++;
      if (mode === 0) { flashAura("d3d-fx-gold"); playClipOnce(celebrate || tap, 1.05); activeFX = { mode: 0, startTime: now, duration: 1350 }; }
      else if (mode === 1) { flashAura("d3d-fx-purple"); playClipOnce(tap || celebrate, 1.25); activeFX = { mode: 1, startTime: now, duration: 1050 }; }
      else if (mode === 2) { flashAura("d3d-fx-cyan"); playClipOnce(tap || celebrate, 1.15); activeFX = { mode: 2, startTime: now, duration: 1100 }; }
      else if (mode === 3) { flashAura("d3d-fx-gold"); playClipOnce(idle, 1.4); activeFX = { mode: 3, startTime: now, duration: 1000 }; }
      else { flashAura("d3d-fx-purple"); playClipOnce(celebrate || tap, 1.2); activeFX = { mode: 4, startTime: now, duration: 1300 }; }
    }
    function playTap() { flashAura("d3d-fx-cyan"); playClipOnce(tap || celebrate, 1.15); activeFX = { mode: 1, startTime: performance.now(), duration: 900 }; }

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

    const onResize = () => { syncPosition(); engine.resize(); };
    window.addEventListener("resize", onResize);
    setTimeout(onResize, 300); setTimeout(onResize, 1200);
    host.addEventListener("pointerdown", playTap);
    ["#hammerBtn", "#shuffleBtn", "#movesBtn", "#nextBtn"].forEach((s) => { const b = document.querySelector(s); if (b) b.addEventListener("click", playNextMatchAnimation); });

    if (window.MutationObserver) {
      Array.from(document.querySelectorAll("#score, .score-value, #hudScore, #moves, .moves-value")).forEach((el) => {
        let lastVal = (el.textContent || "").trim();
        new MutationObserver(() => {
          const cur = (el.textContent || "").trim();
          if (cur && cur !== lastVal) { lastVal = cur; playNextMatchAnimation(); }
        }).observe(el, { childList: true, characterData: true, subtree: true });
      });
    }

    window.Dragon3DCharacter = { playIdle, playCelebrate: playNextMatchAnimation, playTap, hideOldDragon: () => hideOldGreenDragonInGameScenes(B, scene), sync: onResize, scene, engine, camera, host };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mount().catch(console.warn));
  else mount().catch(console.warn);
})();
