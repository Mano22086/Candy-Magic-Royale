/* Candy Magic Royale — Interactive Royal Queen Onboarding Tutorial (6-Step Stage 1 Spotlight)
 * & Dynamic New-Obstacle Queen Spotlight Tutorials (All 20 Obstacles).
 * 60 FPS GPU-accelerated overlays with strict input gating outside highlighted tutorial tiles.
 */
(() => {
  "use strict";

  const TUTORIAL_DONE_KEY = "cmr_tutorial_done";
  const QUEEN_PORTRAIT = "./assets/Picsart_26-11-17_02-37-45-792.png";

  let overlayRoot = null;
  let active = false;
  let mode = null; // "welcome" | "stage1" | "obstacle"
  let currentStep = 0; // 1..6 (substeps tracked by subPhase)
  let subPhase = "create"; // "create" | "activate"
  let allowedCells = []; // [{ r, c }, { r, c }]
  let allowedBooster = null;
  let obstacleQueue = [];
  let onObstacleDone = null;
  let repositionRaf = 0;

  function systems() {
    return window.CMRMatch3Systems || null;
  }

  function isTutorialDone() {
    try {
      return localStorage.getItem(TUTORIAL_DONE_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function markTutorialDone() {
    try {
      localStorage.setItem(TUTORIAL_DONE_KEY, "1");
    } catch (_) {}
  }

  function isBlockingInput() {
    return active && (mode === "welcome" || mode === "obstacle");
  }

  function isCellAllowed(r, c) {
    if (!active || mode !== "stage1") return true;
    if (allowedBooster) return true; // Step 5 booster target anywhere on board
    if (!allowedCells.length) return true;
    return allowedCells.some((cell) => cell.r === r && cell.c === c);
  }

  function isSwapAllowed(a, b) {
    if (!active || mode !== "stage1") return true;
    if (allowedCells.length < 2) return true;
    const [c0, c1] = allowedCells;
    return (
      (a.r === c0.r && a.c === c0.c && b.r === c1.r && b.c === c1.c) ||
      (a.r === c1.r && a.c === c1.c && b.r === c0.r && b.c === c0.c)
    );
  }

  function ensureOverlay() {
    if (overlayRoot) return overlayRoot;
    overlayRoot = document.createElement("div");
    overlayRoot.id = "cmrQueenTutorialLayer";
    overlayRoot.className = "cmr-tut-layer hidden";
    overlayRoot.setAttribute("dir", "rtl");
    overlayRoot.innerHTML = `
      <div class="cmr-tut-backdrop" id="cmrTutBackdrop" aria-hidden="true"></div>
      <div class="cmr-tut-spotlight-ring hidden" id="cmrTutSpotlightRing" aria-hidden="true"></div>
      <div class="cmr-tut-finger hidden" id="cmrTutFinger" aria-hidden="true">👆</div>

      <!-- Royal Queen Dialogue Card (used for Welcome, Stage 1 Steps, and New Obstacles) -->
      <section class="cmr-tut-card hidden" id="cmrTutCard" role="dialog" aria-modal="false" aria-live="polite">
        <div class="cmr-tut-queen-avatar">
          <img src="${QUEEN_PORTRAIT}" alt="الملكة لوما" draggable="false">
        </div>
        <div class="cmr-tut-body">
          <div class="cmr-tut-header-row">
            <span class="cmr-tut-queen-name" id="cmrTutTitle">الملكة لوما 👑</span>
            <span class="cmr-tut-step-pill hidden" id="cmrTutStepPill">1 / 6</span>
            <button type="button" class="cmr-tut-skip-btn hidden" id="cmrTutSkipBtn">تخطي</button>
          </div>
          <div class="cmr-tut-obstacle-showcase hidden" id="cmrTutObsShowcase">
            <img id="cmrTutObsImg" src="" alt="" draggable="false">
            <strong id="cmrTutObsName"></strong>
          </div>
          <p class="cmr-tut-speech" id="cmrTutSpeech"></p>
          <div class="cmr-tut-boosters-guide hidden" id="cmrTutBoostersGuide">
            <span>🪄 عصا: تبديل لون</span>
            <span>🔀 خلط: ترتيب اللوحة</span>
            <span>💣 قنبلة: تفجير 3×3</span>
            <span>🍬 مخططة: مسح لون</span>
            <span>🚀 صاروخ: مسح صف وعمود</span>
          </div>
          <div class="cmr-tut-actions hidden" id="cmrTutActions">
            <button type="button" class="cmr-tut-cta-btn" id="cmrTutCtaBtn">فهمت!</button>
          </div>
        </div>
      </section>
    `;
    document.body.appendChild(overlayRoot);

    overlayRoot.querySelector("#cmrTutSkipBtn")?.addEventListener("click", () => {
      window.CMRAudio?.playSfx?.("cancel");
      finishStage1Tutorial(true);
    });

    return overlayRoot;
  }

  function hideOverlay() {
    if (!overlayRoot) return;
    overlayRoot.classList.add("hidden");
    overlayRoot.classList.remove("is-modal-blocking", "is-spotlight-pass", "is-has-spotlight", "is-card-top", "is-card-bottom");
    overlayRoot.querySelector("#cmrTutCard")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutSpotlightRing")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutFinger")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutObsShowcase")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutBoostersGuide")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutActions")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutStepPill")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutSkipBtn")?.classList.add("hidden");
    document.querySelector(".art-boosters")?.classList.remove("is-tut-highlighted");
    if (repositionRaf) {
      cancelAnimationFrame(repositionRaf);
      repositionRaf = 0;
    }
  }

  function getRectForCells(cells) {
    const canvas = document.getElementById("renderCanvas");
    if (!canvas || !cells || !cells.length) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const cols = 7;
    const rows = 8;
    const cw = rect.width / cols;
    const ch = rect.height / rows;
    let minC = Infinity,
      maxC = -Infinity,
      minR = Infinity,
      maxR = -Infinity;
    for (const cell of cells) {
      minC = Math.min(minC, cell.c);
      maxC = Math.max(maxC, cell.c);
      minR = Math.min(minR, cell.r);
      maxR = Math.max(maxR, cell.r);
    }
    return {
      left: rect.left + minC * cw,
      top: rect.top + minR * ch,
      width: (maxC - minC + 1) * cw,
      height: (maxR - minR + 1) * ch,
      cw,
      ch,
      c0x: rect.left + (cells[0].c + 0.5) * cw,
      c0y: rect.top + (cells[0].r + 0.5) * ch,
      c1x: cells[1] ? rect.left + (cells[1].c + 0.5) * cw : rect.left + (cells[0].c + 0.5) * cw,
      c1y: cells[1] ? rect.top + (cells[1].r + 0.5) * ch : rect.top + (cells[0].r + 0.5) * ch,
    };
  }

  function positionSpotlightOnCells(cells, animateSwipe = true) {
    if (!overlayRoot) return;
    const ring = overlayRoot.querySelector("#cmrTutSpotlightRing");
    const finger = overlayRoot.querySelector("#cmrTutFinger");
    const box = getRectForCells(cells);
    if (!box || !ring) return;

    const pad = 6;
    ring.style.left = `${box.left - pad}px`;
    ring.style.top = `${box.top - pad}px`;
    ring.style.width = `${box.width + pad * 2}px`;
    ring.style.height = `${box.height + pad * 2}px`;
    ring.classList.remove("hidden");
    overlayRoot.classList.add("is-has-spotlight");

    if (finger) {
      finger.style.setProperty("--fx0", `${box.c0x}px`);
      finger.style.setProperty("--fy0", `${box.c0y + 6}px`);
      finger.style.setProperty("--fx1", `${box.c1x}px`);
      finger.style.setProperty("--fy1", `${box.c1y + 6}px`);
      finger.classList.remove("hidden", "is-tap", "is-swipe");
      void finger.offsetWidth;
      finger.classList.add(animateSwipe && cells.length >= 2 ? "is-swipe" : "is-tap");
    }
  }

  function positionSpotlightOnElement(el) {
    if (!overlayRoot || !el) return;
    const ring = overlayRoot.querySelector("#cmrTutSpotlightRing");
    const finger = overlayRoot.querySelector("#cmrTutFinger");
    const rect = el.getBoundingClientRect();
    if (!ring || rect.width <= 0) return;

    const pad = 6;
    ring.style.left = `${rect.left - pad}px`;
    ring.style.top = `${rect.top - pad}px`;
    ring.style.width = `${rect.width + pad * 2}px`;
    ring.style.height = `${rect.height + pad * 2}px`;
    ring.classList.remove("hidden");
    overlayRoot.classList.add("is-has-spotlight");

    if (finger) {
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      finger.style.setProperty("--fx0", `${cx}px`);
      finger.style.setProperty("--fy0", `${cy}px`);
      finger.style.setProperty("--fx1", `${cx}px`);
      finger.style.setProperty("--fy1", `${cy}px`);
      finger.classList.remove("hidden", "is-swipe");
      finger.classList.add("is-tap");
    }
  }

  // -------------------------------------------------------------------------
  // 1. First-Time Registration Welcome Dialogue -> Auto Transition to Stage 1
  // -------------------------------------------------------------------------
  function startWelcomeToStage1(playerName) {
    if (isTutorialDone()) return false;
    ensureOverlay();
    active = true;
    mode = "welcome";
    allowedCells = [];
    allowedBooster = null;

    const cleanName = String(playerName || "أيها البطل").trim() || "أيها البطل";
    overlayRoot.classList.remove("hidden", "is-spotlight-pass", "is-has-spotlight", "is-card-top");
    overlayRoot.classList.add("is-modal-blocking", "is-card-bottom");

    const card = overlayRoot.querySelector("#cmrTutCard");
    const titleEl = overlayRoot.querySelector("#cmrTutTitle");
    const speechEl = overlayRoot.querySelector("#cmrTutSpeech");
    const actionsEl = overlayRoot.querySelector("#cmrTutActions");
    const ctaBtn = overlayRoot.querySelector("#cmrTutCtaBtn");

    overlayRoot.querySelector("#cmrTutSpotlightRing")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutFinger")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutObsShowcase")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutBoostersGuide")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutStepPill")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutSkipBtn")?.classList.add("hidden");

    if (titleEl) titleEl.textContent = "أهلاً بك في مملكة الحلوى! 👑";
    if (speechEl) {
      speechEl.textContent = `مرحباً يا ${cleanName}! أنا الملكة لوما، وسأرافقك الآن في المرحلة الأولى لتتعلم أسرار الصواريخ والقنابل وكرة الألوان السحرية!`;
    }
    if (ctaBtn) {
      ctaBtn.textContent = "ابدأ المرحلة الأولى! ✨";
      ctaBtn.onclick = async () => {
        window.CMRAudio?.playSfx?.("confirm");
        hideOverlay();
        active = false;
        mode = null;
        if (window.CMRLaunchGame) {
          await window.CMRLaunchGame({ skipVideo: true, autostartStage: 1 });
        } else {
          await window.CMRStartSelectedHouse?.(1);
        }
      };
    }
    if (actionsEl) actionsEl.classList.remove("hidden");
    if (card) card.classList.remove("hidden");
    window.CMRAudio?.playSfx?.("open");
    return true;
  }

  // -------------------------------------------------------------------------
  // 2. 6-Step Guided Interactive Spotlight Tutorial Inside Stage 1
  // -------------------------------------------------------------------------
  function renderStage1StepCard({ stepNum, speech, showBoostersGuide = false, ctaLabel = null, onCta = null }) {
    ensureOverlay();
    overlayRoot.classList.remove("hidden", "is-modal-blocking", "is-card-bottom");
    overlayRoot.classList.add("is-spotlight-pass", "is-card-top");

    const card = overlayRoot.querySelector("#cmrTutCard");
    const titleEl = overlayRoot.querySelector("#cmrTutTitle");
    const pillEl = overlayRoot.querySelector("#cmrTutStepPill");
    const skipBtn = overlayRoot.querySelector("#cmrTutSkipBtn");
    const speechEl = overlayRoot.querySelector("#cmrTutSpeech");
    const guideEl = overlayRoot.querySelector("#cmrTutBoostersGuide");
    const actionsEl = overlayRoot.querySelector("#cmrTutActions");
    const ctaBtn = overlayRoot.querySelector("#cmrTutCtaBtn");

    overlayRoot.querySelector("#cmrTutObsShowcase")?.classList.add("hidden");
    if (titleEl) titleEl.textContent = "الملكة لوما 👑";
    if (pillEl) {
      pillEl.textContent = `${stepNum} / 6`;
      pillEl.classList.remove("hidden");
    }
    if (skipBtn) skipBtn.classList.remove("hidden");
    if (speechEl) speechEl.textContent = speech;
    if (guideEl) guideEl.classList.toggle("hidden", !showBoostersGuide);
    if (actionsEl && ctaBtn) {
      if (ctaLabel && typeof onCta === "function") {
        ctaBtn.textContent = ctaLabel;
        ctaBtn.onclick = onCta;
        actionsEl.classList.remove("hidden");
      } else {
        actionsEl.classList.add("hidden");
      }
    }
    if (card) card.classList.remove("hidden");
  }

  function enterStep(stepNum, phase = "create") {
    currentStep = stepNum;
    subPhase = phase;
    allowedBooster = null;
    document.querySelector(".art-boosters")?.classList.remove("is-tut-highlighted");

    const game = window.CMRGame;
    if (!game || typeof game.setupTutorialStep !== "function") {
      finishStage1Tutorial(true);
      return;
    }

    if (stepNum === 1) {
      const setup = game.setupTutorialStep("match3");
      allowedCells = setup ? [setup.from, setup.to] : [];
      renderStage1StepCard({
        stepNum: 1,
        speech: "اسحب الحلوى لتصنع أول مطابقة!",
      });
      requestAnimationFrame(() => positionSpotlightOnCells(allowedCells, true));
    } else if (stepNum === 2 && phase === "create") {
      const setup = game.setupTutorialStep("rocket_create");
      allowedCells = setup ? [setup.from, setup.to] : [];
      renderStage1StepCard({
        stepNum: 2,
        speech: "رائع! طابق 4 قطع في صف واحد لتصنع صاروخ الكاندي الخارق!",
      });
      requestAnimationFrame(() => positionSpotlightOnCells(allowedCells, true));
    } else if (stepNum === 2 && phase === "activate") {
      const setup = game.setupTutorialStep("rocket_activate");
      allowedCells = setup ? [setup.from, setup.to] : [];
      renderStage1StepCard({
        stepNum: 2,
        speech: "رائع! 4 قطع تصنع صاروخاً خارقاً — جرّبه الآن!",
      });
      requestAnimationFrame(() => positionSpotlightOnCells(allowedCells, true));
    } else if (stepNum === 3 && phase === "create") {
      const setup = game.setupTutorialStep("bomb_create");
      allowedCells = setup ? [setup.from, setup.to] : [];
      renderStage1StepCard({
        stepNum: 3,
        speech: "ممتاز! الآن اصنع قنبلة الكاندي بشكل حرف T!",
      });
      requestAnimationFrame(() => positionSpotlightOnCells(allowedCells, true));
    } else if (stepNum === 3 && phase === "activate") {
      const setup = game.setupTutorialStep("bomb_activate");
      allowedCells = setup ? [setup.from, setup.to] : [];
      renderStage1StepCard({
        stepNum: 3,
        speech: "ممتاز! الآن اصنع قنبلة الكاندي وفجّرها!",
      });
      requestAnimationFrame(() => positionSpotlightOnCells(allowedCells, true));
    } else if (stepNum === 4 && phase === "create") {
      const setup = game.setupTutorialStep("color_create");
      allowedCells = setup ? [setup.from, setup.to] : [];
      renderStage1StepCard({
        stepNum: 4,
        speech: "أسطوري! طابق 5 قطع متتالية لتصنع كرة الألوان السحرية!",
      });
      requestAnimationFrame(() => positionSpotlightOnCells(allowedCells, true));
    } else if (stepNum === 4 && phase === "activate") {
      const setup = game.setupTutorialStep("color_activate");
      allowedCells = setup ? [setup.from, setup.to] : [];
      renderStage1StepCard({
        stepNum: 4,
        speech: "أسطوري! 5 قطع تصنع كرة الألوان السحرية — بدّلها مع أي حلوى!",
      });
      requestAnimationFrame(() => positionSpotlightOnCells(allowedCells, true));
    } else if (stepNum === 5) {
      allowedCells = [];
      allowedBooster = "rocket";
      const dock = document.querySelector(".art-boosters");
      if (dock) dock.classList.add("is-tut-highlighted");
      renderStage1StepCard({
        stepNum: 5,
        speech: "هذه هي المساعدات السحرية أسفل اللوحة! اختر صاروخاً مجانياً وجرّبه على أي خانة الآن!",
        showBoostersGuide: true,
        ctaLabel: "جرّب صاروخاً مجانياً! 🚀",
        onCta: () => {
          window.CMRAudio?.playSfx?.("confirm");
          game.grantFreeTutorialBooster?.("rocket");
          const rocketBtn = document.getElementById("rocketBtn");
          if (rocketBtn && !rocketBtn.classList.contains("active")) {
            rocketBtn.click();
          }
          // Spotlight center of board so player taps any tile to fire the free booster
          const targetCell = game.getObstacleCells?.()[0] || { r: 3, c: 3 };
          positionSpotlightOnCells([{ r: targetCell.r, c: targetCell.c }], false);
          const speechEl = overlayRoot?.querySelector("#cmrTutSpeech");
          if (speechEl) speechEl.textContent = "ممتاز! اضغط الآن على أي قطعة في اللوحة لإطلاق الصاروخ المجاني!";
          overlayRoot?.querySelector("#cmrTutActions")?.classList.add("hidden");
        },
      });
      const rocketBtn = document.getElementById("rocketBtn");
      requestAnimationFrame(() => positionSpotlightOnElement(rocketBtn || dock));
    } else if (stepNum >= 6) {
      finishStage1Tutorial(false);
    }
  }

  function beginStage1Tutorial() {
    if (isTutorialDone()) return false;
    active = true;
    mode = "stage1";
    currentStep = 1;
    subPhase = "create";
    // Delay slightly so Babylon canvas finishes layout & paint
    setTimeout(() => {
      if (active && mode === "stage1") {
        enterStep(1, "create");
      }
    }, 280);
    return true;
  }

  function onTutorialMoveResolved(info = {}) {
    if (!active || mode !== "stage1") return;
    if (currentStep === 1) {
      setTimeout(() => enterStep(2, "create"), 260);
    } else if (currentStep === 2 && subPhase === "create") {
      setTimeout(() => enterStep(2, "activate"), 260);
    } else if (currentStep === 2 && subPhase === "activate") {
      setTimeout(() => enterStep(3, "create"), 260);
    } else if (currentStep === 3 && subPhase === "create") {
      setTimeout(() => enterStep(3, "activate"), 260);
    } else if (currentStep === 3 && subPhase === "activate") {
      setTimeout(() => enterStep(4, "create"), 260);
    } else if (currentStep === 4 && subPhase === "create") {
      setTimeout(() => enterStep(4, "activate"), 260);
    } else if (currentStep === 4 && subPhase === "activate") {
      setTimeout(() => enterStep(5, "activate"), 260);
    } else if (currentStep === 5 && info.usedBooster) {
      setTimeout(() => enterStep(6, "done"), 260);
    }
  }

  function finishStage1Tutorial(skipped) {
    markTutorialDone();
    // Mark single_ice as seen since player just practiced Stage 1
    systems()?.createSeenObstaclesTracker?.()?.markSeen("single_ice");
    active = false;
    mode = null;
    allowedCells = [];
    allowedBooster = null;
    hideOverlay();

    if (!skipped) {
      ensureOverlay();
      overlayRoot.classList.remove("hidden", "is-spotlight-pass", "is-card-bottom");
      overlayRoot.classList.add("is-modal-blocking", "is-card-top");
      const card = overlayRoot.querySelector("#cmrTutCard");
      const titleEl = overlayRoot.querySelector("#cmrTutTitle");
      const pillEl = overlayRoot.querySelector("#cmrTutStepPill");
      const speechEl = overlayRoot.querySelector("#cmrTutSpeech");
      const actionsEl = overlayRoot.querySelector("#cmrTutActions");
      const ctaBtn = overlayRoot.querySelector("#cmrTutCtaBtn");
      if (titleEl) titleEl.textContent = "أحسنت يا بطل المملكة! 🏆";
      if (pillEl) {
        pillEl.textContent = "6 / 6";
        pillEl.classList.remove("hidden");
      }
      if (speechEl) {
        speechEl.textContent = "أصبحت الآن جاهزاً تماماً! أكمل ما تبقى من المرحلة الأولى بسهولة واستمتع بالمغامرة!";
      }
      if (ctaBtn) {
        ctaBtn.textContent = "هيا بنا! ✨";
        ctaBtn.onclick = () => {
          window.CMRAudio?.playSfx?.("confirm");
          hideOverlay();
        };
      }
      if (actionsEl) actionsEl.classList.remove("hidden");
      if (card) card.classList.remove("hidden");
    }
  }

  // -------------------------------------------------------------------------
  // 3. Dynamic New-Obstacle Queen Spotlight Tutorial (All 20 Obstacles)
  // -------------------------------------------------------------------------
  function showNextObstacleCard() {
    const sys = systems();
    if (!sys || !obstacleQueue.length) {
      active = false;
      mode = null;
      hideOverlay();
      if (typeof onObstacleDone === "function") {
        const cb = onObstacleDone;
        onObstacleDone = null;
        cb();
      }
      return;
    }

    const obsId = obstacleQueue.shift();
    const def = sys.OBSTACLE_CATALOG[obsId];
    if (!def) {
      showNextObstacleCard();
      return;
    }

    ensureOverlay();
    active = true;
    mode = "obstacle";
    overlayRoot.classList.remove("hidden", "is-spotlight-pass", "is-card-top");
    overlayRoot.classList.add("is-modal-blocking", "is-card-bottom");

    const card = overlayRoot.querySelector("#cmrTutCard");
    const titleEl = overlayRoot.querySelector("#cmrTutTitle");
    const obsShowcase = overlayRoot.querySelector("#cmrTutObsShowcase");
    const obsImg = overlayRoot.querySelector("#cmrTutObsImg");
    const obsName = overlayRoot.querySelector("#cmrTutObsName");
    const speechEl = overlayRoot.querySelector("#cmrTutSpeech");
    const actionsEl = overlayRoot.querySelector("#cmrTutActions");
    const ctaBtn = overlayRoot.querySelector("#cmrTutCtaBtn");

    overlayRoot.querySelector("#cmrTutStepPill")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutSkipBtn")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutBoostersGuide")?.classList.add("hidden");
    overlayRoot.querySelector("#cmrTutFinger")?.classList.add("hidden");

    if (titleEl) titleEl.textContent = "عائق جديد في المملكة! ✨";
    if (obsImg) obsImg.src = def.imgSrc;
    if (obsName) obsName.textContent = def.nameAr;
    if (obsShowcase) obsShowcase.classList.remove("hidden");
    if (speechEl) speechEl.textContent = def.tutorialAr;

    // Highlight an actual matching obstacle tile on the 7x8 board
    const boardCells = window.CMRGame?.getObstacleCells?.() || [];
    const sample = boardCells.find((item) => item.obs === obsId) || boardCells[0];
    if (sample) {
      requestAnimationFrame(() => positionSpotlightOnCells([{ r: sample.r, c: sample.c }], false));
    } else {
      overlayRoot.classList.remove("is-has-spotlight");
      overlayRoot.querySelector("#cmrTutSpotlightRing")?.classList.add("hidden");
    }

    if (ctaBtn) {
      ctaBtn.textContent = "فهمت!";
      ctaBtn.onclick = () => {
        window.CMRAudio?.playSfx?.("confirm");
        sys.createSeenObstaclesTracker().markSeen(obsId);
        showNextObstacleCard();
      };
    }
    if (actionsEl) actionsEl.classList.remove("hidden");
    if (card) card.classList.remove("hidden");
    window.CMRAudio?.playSfx?.("open");
  }

  function checkAndShowNewObstacles(obstacleTypes, doneCallback) {
    const sys = systems();
    if (!sys || (active && mode === "stage1")) {
      if (typeof doneCallback === "function") doneCallback();
      return false;
    }
    const tracker = sys.createSeenObstaclesTracker();
    const unseen = tracker.getUnseenInList(obstacleTypes || []);
    if (!unseen.length) {
      if (typeof doneCallback === "function") doneCallback();
      return false;
    }
    obstacleQueue = unseen;
    onObstacleDone = doneCallback || null;
    setTimeout(() => showNextObstacleCard(), 220);
    return true;
  }

  function cancelAll() {
    active = false;
    mode = null;
    allowedCells = [];
    allowedBooster = null;
    obstacleQueue = [];
    onObstacleDone = null;
    hideOverlay();
  }

  window.addEventListener(
    "resize",
    () => {
      if (!active) return;
      if (mode === "stage1" && allowedCells.length) {
        positionSpotlightOnCells(allowedCells, allowedCells.length >= 2);
      }
    },
    { passive: true }
  );

  window.CMRQueenTutorial = {
    isTutorialDone,
    markTutorialDone,
    isActive: () => active,
    getMode: () => mode,
    getStep: () => ({ step: currentStep, subPhase }),
    isBlockingInput,
    isCellAllowed,
    isSwapAllowed,
    startWelcomeToStage1,
    beginStage1Tutorial,
    onTutorialMoveResolved,
    finishStage1Tutorial,
    checkAndShowNewObstacles,
    cancelAll,
  };
})();
