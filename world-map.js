/* Candy Magic Royale — Candy Crush-Style Vertically Scrollable Egyptian Fantasy World Map
 * - Vertically scrollable winding magical path connecting all 10 uniquely themed Palaces (1,000 stages).
 * - Each palace has distinct environmental scenery (Egyptian temples, waterfalls, floating islands,
 *   candy forests, ice crystals, mermaid reef, ruby cavern, galaxy nebula, sakura garden, autumn village).
 * - Smooth vertical scrolling + instant smooth camera focus on current player location ("موقعي الحالي").
 * - Opening any unlocked palace displays a winding S-curve Candy Crush-style stage path (1-25, 26-50 👑,
 *   51-75, 76-100) with Stage 50 Candy King Boss throne and strict unlocked-stage gating.
 */
(() => {
  "use strict";

  const SAVE_KEY = "cmr_reborn_v1";
  const RANGE_SIZE = 25;

  const PALACE_BIOMES = [
    {
      bg: "linear-gradient(150deg, #4b1d7f 0%, #6d28a8 42%, #b7791f 100%)",
      glow: "#ffd86b",
      landmarks: "🏛️ الأهرامات الذهبية · أنهار العسل السحرية",
      motif: "pyramids",
    },
    {
      bg: "linear-gradient(150deg, #3c1657 0%, #7c1f63 50%, #f472b6 100%)",
      glow: "#ff9be0",
      landmarks: "🍭 غابات الحلوى الوردية · شلالات السكر",
      motif: "candy-forest",
    },
    {
      bg: "linear-gradient(150deg, #0b4f6c 0%, #1d7fb8 52%, #7dd3fc 100%)",
      glow: "#7dd3fc",
      landmarks: "❄️ جبال الكريستال الجليدي · شلالات الألماس",
      motif: "ice-waterfalls",
    },
    {
      bg: "linear-gradient(150deg, #0b5d47 0%, #15803d 52%, #4ade80 100%)",
      glow: "#6ee7b7",
      landmarks: "🏝️ جزر الزمرد الطافية · معابد النيل المسحور",
      motif: "floating-islands",
    },
    {
      bg: "linear-gradient(150deg, #7c2d12 0%, #c2410c 50%, #fbbf24 100%)",
      glow: "#fde047",
      landmarks: "☀️ معبد الشمس الفرعوني · الكثبان الذهبية",
      motif: "sun-temple",
    },
    {
      bg: "linear-gradient(150deg, #0f3d56 0%, #0284c7 50%, #38bdf8 100%)",
      glow: "#38bdf8",
      landmarks: "🌊 شلالات المرجان · قصر حوريات البحر",
      motif: "reef-waterfall",
    },
    {
      bg: "linear-gradient(150deg, #5c0d29 0%, #be123c 50%, #fb7185 100%)",
      glow: "#fda4af",
      landmarks: "💎 كهوف الياقوت المتوهجة · جسور الكريستال",
      motif: "ruby-cavern",
    },
    {
      bg: "linear-gradient(150deg, #1b1048 0%, #4338ca 50%, #818cf8 100%)",
      glow: "#a5b4fc",
      landmarks: "🌌 جزر المجرة الطافية · أنهار النجوم",
      motif: "galaxy-islands",
    },
    {
      bg: "linear-gradient(150deg, #641b4e 0%, #db2777 50%, #fbcfe8 100%)",
      glow: "#f9a8d4",
      landmarks: "🌸 حدائق الساكورا السحرية · جداول الورد",
      motif: "sakura-river",
    },
    {
      bg: "linear-gradient(150deg, #5c2808 0%, #d97706 50%, #fde68a 100%)",
      glow: "#fcd34d",
      landmarks: "👑 القلعة الملكية العليا · عرش ملك الحلوى",
      motif: "royal-citadel",
    },
  ];

  let overlay = null;
  let currentView = "palaces"; // "palaces" | "stages"
  let activePalaceIndex = 0;
  let activeRangeIndex = 0;

  function core() {
    return window.CMRCore;
  }

  function readProgress() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function getUnlockedStage() {
    const saved = readProgress();
    const raw = Math.floor(Number(saved.highestUnlocked) || Number(saved.level) || 1);
    const completed = Boolean(saved.completed);
    const effective = completed ? Math.max(raw, Math.floor(Number(saved.level) || 1) + 1) : raw;
    return core().clampStage(effective);
  }

  function getPlayerSummary() {
    const saved = readProgress();
    const lives =
      saved.lives === undefined ? 5 : Math.max(0, Math.min(5, Math.floor(Number(saved.lives) || 0)));
    const coins = Number.isFinite(Number(saved.coins)) ? Math.max(0, Math.floor(Number(saved.coins))) : 500;
    const gems = Number.isFinite(Number(saved.gems)) ? Math.max(0, Math.floor(Number(saved.gems))) : 25;
    const stars = Number.isFinite(Number(saved.stars)) ? Math.max(0, Math.floor(Number(saved.stars))) : 0;
    return { lives, coins, gems, stars, unlocked: getUnlockedStage() };
  }

  function getBoardArtUrl(globalStage) {
    const meta = core().getStageMeta(globalStage);
    return Promise.resolve(meta.boardImagePath);
  }

  function showToast(message) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(t.__wmTimer);
    t.__wmTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function biomeScenerySvg(motif, glow) {
    if (motif === "pyramids" || motif === "sun-temple") {
      return `<svg class="wm-zone-svg" viewBox="0 0 360 120" preserveAspectRatio="none" aria-hidden="true">
        <circle cx="290" cy="28" r="22" fill="${glow}" opacity="0.35"/>
        <polygon points="35,120 110,32 185,120" fill="rgba(255,216,107,0.22)"/>
        <polygon points="150,120 235,20 325,120" fill="rgba(255,190,65,0.26)"/>
        <path d="M0,104 Q90,88 180,104 T360,100 L360,120 L0,120 Z" fill="rgba(56,189,248,0.28)"/>
      </svg>`;
    }
    if (motif === "ice-waterfalls" || motif === "reef-waterfall") {
      return `<svg class="wm-zone-svg" viewBox="0 0 360 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M40,0 C55,45 45,75 68,120 L108,120 C88,75 95,45 78,0 Z" fill="rgba(186,230,253,0.34)"/>
        <polygon points="210,120 250,24 295,120" fill="rgba(224,242,254,0.24)"/>
        <polygon points="270,120 315,38 355,120" fill="rgba(125,211,252,0.22)"/>
        <path d="M0,102 Q110,84 220,102 T360,96 L360,120 L0,120 Z" fill="rgba(125,211,252,0.28)"/>
      </svg>`;
    }
    if (motif === "floating-islands" || motif === "galaxy-islands") {
      return `<svg class="wm-zone-svg" viewBox="0 0 360 120" preserveAspectRatio="none" aria-hidden="true">
        <ellipse cx="78" cy="48" rx="46" ry="12" fill="rgba(255,255,255,0.2)"/>
        <polygon points="40,52 116,52 80,84" fill="rgba(16,185,129,0.24)"/>
        <ellipse cx="282" cy="40" rx="52" ry="13" fill="rgba(255,255,255,0.2)"/>
        <polygon points="240,44 324,44 282,78" fill="rgba(129,140,248,0.26)"/>
        <circle cx="176" cy="24" r="3" fill="#fff"/>
        <circle cx="198" cy="36" r="2" fill="${glow}"/>
      </svg>`;
    }
    return `<svg class="wm-zone-svg" viewBox="0 0 360 120" preserveAspectRatio="none" aria-hidden="true">
      <circle cx="66" cy="64" r="32" fill="${glow}" opacity="0.22"/>
      <circle cx="294" cy="58" r="38" fill="${glow}" opacity="0.2"/>
      <path d="M0,96 Q90,74 180,96 T360,90 L360,120 L0,120 Z" fill="rgba(255,255,255,0.16)"/>
    </svg>`;
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("section");
    overlay.id = "worldMap";
    overlay.className = "world-map hidden";
    overlay.setAttribute("aria-label", "خريطة القصور والمراحل");
    overlay.innerHTML = `
      <header class="wm-header">
        <div class="wm-header-top">
          <div class="wm-heading">
            <small>✦ رحلة مملكة الحلوى الفرعونية · 10 قصور · 1000 مرحلة ✦</small>
            <h1 id="wmTitle">خريطة القصور الملكية</h1>
            <p id="wmSubtitle">تقدّم عبر المسار السحري — زعيم ملك الحلوى ينتظرك عند المرحلة 50 من كل قصر</p>
          </div>
          <div class="wm-header-right">
            <div class="wm-stats-bar" aria-label="بيانات اللاعب">
              <span class="wm-stat-pill" title="القلوب">
                <img src="./assets/packs/buttons/icon_heart.png" alt="القلوب">
                <b id="wmHearts">5</b>
              </span>
              <span class="wm-stat-pill" title="الجواهر">
                <img src="./assets/packs/buttons/icon_gem.png" alt="الجواهر">
                <b id="wmGems">25</b>
              </span>
              <span class="wm-stat-pill" title="العملات">
                <img src="./assets/packs/buttons/icon_coin.png" alt="العملات">
                <b id="wmCoins">500</b>
              </span>
              <span class="wm-stat-pill" title="النجوم">
                <img src="./assets/packs/buttons/icon_star.png" alt="النجوم">
                <b id="wmStars">0</b>
              </span>
            </div>
            <div class="wm-quick-tools">
              <button type="button" id="wmShopBtn" class="wm-tool-btn" aria-label="المتجر" title="المتجر الملكي">
                <img src="./assets/packs/buttons/icon_cart.png" alt="">
                <span>المتجر</span>
              </button>
              <button type="button" id="wmSettingsBtn" class="wm-tool-btn" aria-label="الإعدادات" title="الإعدادات">
                <img src="./assets/packs/buttons/icon_settings.png" alt="">
                <span>الإعدادات</span>
              </button>
              <button type="button" id="wmHomeBtn" class="wm-tool-btn" aria-label="القائمة الرئيسية" title="القائمة الرئيسية">
                <img src="./assets/packs/buttons/icon_home.png" alt="">
                <span>الرئيسية</span>
              </button>
            </div>
          </div>
        </div>
        <div class="wm-progress">
          <span id="wmProgressText">القصر 1 · المرحلة 1 من 100</span>
          <i><b id="wmProgressBar"></b></i>
        </div>
      </header>
      <div class="wm-scroll" id="wmScroll">
        <div class="wm-world" id="wmWorld"></div>
      </div>
      <footer class="wm-footer">
        <button id="wmLocateBtn" type="button" class="wm-action-btn wm-action-locate">
          <img src="./assets/packs/buttons/icon_star.png" alt="">
          <span>موقعي الحالي</span>
        </button>
        <div class="wm-footer-actions">
          <button id="wmQuickPlay" type="button" class="wm-action-btn wm-action-play">
            <img src="./assets/packs/buttons/icon_play.png" alt="">
            <span>العب المرحلة 1</span>
          </button>
          <button id="wmBack" type="button" class="wm-action-btn wm-action-back hidden">
            <img src="./assets/packs/buttons/icon_home.png" alt="">
            <span>كل القصور</span>
          </button>
        </div>
      </footer>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector("#wmBack").addEventListener("click", () => {
      renderPalaces(true);
    });

    overlay.querySelector("#wmQuickPlay").addEventListener("click", async () => {
      const unlocked = getUnlockedStage();
      await openStage(unlocked);
    });

    overlay.querySelector("#wmLocateBtn").addEventListener("click", () => {
      focusCurrentLocation(true);
    });

    overlay.querySelector("#wmShopBtn").addEventListener("click", () => {
      window.CMRStore?.open?.("coins");
    });

    overlay.querySelector("#wmSettingsBtn").addEventListener("click", () => {
      window.CMRGame?.openSettings?.("map");
    });

    overlay.querySelector("#wmHomeBtn").addEventListener("click", () => {
      hide();
      window.CMRShowMainMenu?.();
    });

    return overlay;
  }

  function updateHeaderStats() {
    ensureOverlay();
    const { lives, coins, gems, stars, unlocked } = getPlayerSummary();
    const meta = core().getStageMeta(unlocked);
    const heartsEl = overlay.querySelector("#wmHearts");
    const gemsEl = overlay.querySelector("#wmGems");
    const starsEl = overlay.querySelector("#wmStars");
    const coinsEl = overlay.querySelector("#wmCoins");
    const progText = overlay.querySelector("#wmProgressText");
    const progBar = overlay.querySelector("#wmProgressBar");
    const quickBtn = overlay.querySelector("#wmQuickPlay span");

    if (heartsEl) heartsEl.textContent = String(lives);
    if (gemsEl) gemsEl.textContent = gems.toLocaleString("en-US");
    if (starsEl) starsEl.textContent = String(stars);
    if (coinsEl) coinsEl.textContent = coins.toLocaleString("en-US");
    if (progText) {
      progText.textContent = `موقعك: القصر ${meta.palaceNumber} (${meta.palace.name}) · المرحلة ${meta.stageInPalace} من 100`;
    }
    if (progBar) {
      progBar.style.width = `${Math.max(2, Math.min(100, ((unlocked - 1) / core().TOTAL_STAGES) * 100))}%`;
    }
    if (quickBtn) {
      quickBtn.textContent = `العب المرحلة ${unlocked}`;
    }
  }

  function focusCurrentLocation(smooth = true) {
    if (!overlay) return;
    const target =
      currentView === "stages"
        ? overlay.querySelector(".wm-path-node.current") || overlay.querySelector(".wm-path-node.done")
        : overlay.querySelector(".wm-biome-stop.active") || overlay.querySelector(".wm-biome-stop");
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
    }
  }

  async function openStage(globalStage, triggerBtn) {
    const unlocked = getUnlockedStage();
    if (globalStage > unlocked) {
      showToast("هذه المرحلة ما زالت مقفولة. أكمل المراحل السابقة أولاً!");
      return;
    }
    const { lives } = getPlayerSummary();
    if (lives <= 0) {
      showToast("نفدت قلوبك الحالية! يمكنك استعادة قلب من المتجر الملكي.");
      window.CMRStore?.open?.("hearts");
      return;
    }
    const launch = window.CMRStartSelectedHouse;
    if (typeof launch !== "function") {
      showToast("نظام اللعب قيد التجهيز، حاول مجدداً.");
      return;
    }
    if (triggerBtn) triggerBtn.disabled = true;
    try {
      const ok = await launch(globalStage);
      if (ok !== true && triggerBtn) {
        triggerBtn.disabled = false;
      }
    } catch (err) {
      console.error("[CMR Map] Failed to open stage:", err);
      if (triggerBtn) triggerBtn.disabled = false;
      showToast("تعذر فتح المرحلة، حاول مرة أخرى.");
    }
  }

  function buildWindingSvgPath(count, rowHeight, width = 600) {
    const points = [];
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? 0.3 : 0.7;
      points.push({
        x: Math.round(width * side),
        y: Math.round(rowHeight * i + rowHeight * 0.5),
      });
    }
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const midY = Math.round((p0.y + p1.y) / 2);
      d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
    }
    const totalHeight = count * rowHeight;
    return `
      <svg class="wm-winding-svg" viewBox="0 0 ${width} ${totalHeight}" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="cmrRoadGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffd86b"/>
            <stop offset="50%" stop-color="#f472b6"/>
            <stop offset="100%" stop-color="#38bdf8"/>
          </linearGradient>
        </defs>
        <path d="${d}" fill="none" stroke="rgba(18, 6, 38, 0.72)" stroke-width="26" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="url(#cmrRoadGlow)" stroke-width="14" stroke-linecap="round" opacity="0.92"/>
        <path d="${d}" fill="none" stroke="#fff8d6" stroke-width="4" stroke-dasharray="10 14" stroke-linecap="round" opacity="0.9"/>
      </svg>
    `;
  }

  function renderPalaces(autoScroll = true) {
    ensureOverlay();
    currentView = "palaces";
    updateHeaderStats();

    const unlocked = getUnlockedStage();
    const currentMeta = core().getStageMeta(unlocked);
    const worldEl = overlay.querySelector("#wmWorld");
    const backBtn = overlay.querySelector("#wmBack");
    const titleEl = overlay.querySelector("#wmTitle");
    const subEl = overlay.querySelector("#wmSubtitle");

    if (backBtn) backBtn.classList.add("hidden");
    if (titleEl) titleEl.textContent = "خريطة القصور السحرية";
    if (subEl) subEl.textContent = "اسحب عمودياً لاستكشاف القصور الـ 10 · 1000 مرحلة · زعيم ملك الحلوى عند المرحلة 50";

    const palaces = core().PALACES;
    worldEl.className = "wm-world wm-journey-map";
    worldEl.innerHTML = `
      <div class="wm-journey-track" id="wmJourneyTrack">
        ${buildWindingSvgPath(palaces.length, 232, 680)}
      </div>
    `;

    const track = worldEl.querySelector("#wmJourneyTrack");

    palaces.forEach((palace, idx) => {
      const biome = PALACE_BIOMES[idx] || PALACE_BIOMES[0];
      const startStage = palace.index * core().STAGES_PER_PALACE + 1;
      const endStage = (palace.index + 1) * core().STAGES_PER_PALACE;
      const done = unlocked > endStage;
      const active = unlocked >= startStage && unlocked <= endStage;
      const locked = unlocked < startStage;

      const completedInPalace = done
        ? core().STAGES_PER_PALACE
        : active
        ? Math.max(0, currentMeta.stageInPalace - 1)
        : 0;
      const progressPct = Math.round((completedInPalace / core().STAGES_PER_PALACE) * 100);

      const statusLabel = done
        ? "مكتمل بالكامل ✓"
        : active
        ? `موقعك الحالي · المرحلة ${currentMeta.stageInPalace}/100`
        : `مقفول · أكمل القصر ${palace.index}`;

      const badgeIcon = done
        ? "./assets/packs/buttons/icon_check.png"
        : locked
        ? "./assets/packs/buttons/icon_lock.png"
        : "./assets/packs/buttons/icon_crown.png";

      const stop = document.createElement("article");
      stop.className = `wm-biome-stop ${idx % 2 === 0 ? "align-start" : "align-end"} ${
        done ? "done" : active ? "active" : "locked"
      }`;
      stop.dataset.palaceIndex = String(palace.index);

      const card = document.createElement("button");
      card.type = "button";
      card.className = `wm-biome-card ${done ? "done" : active ? "active" : "locked"}`;
      card.style.background = biome.bg;
      card.style.setProperty("--biome-glow", biome.glow);
      card.setAttribute(
        "aria-label",
        `${palace.tag}: ${palace.name} — ${statusLabel}`
      );
      card.innerHTML = `
        ${biomeScenerySvg(biome.motif, biome.glow)}
        ${
          active
            ? `<span class="wm-player-beacon">
                <img src="./assets/Picsart_26-11-17_02-38-02-164.png" alt="">
                <b>أنت هنا</b>
              </span>`
            : ""
        }
        <div class="wm-biome-card-inner">
          <div class="wm-biome-castle-wrap">
            <img class="wm-castle-img" src="${palace.castleArt}" alt="${palace.name}" loading="lazy">
            <img class="wm-state-badge" src="${badgeIcon}" alt="">
          </div>
          <div class="wm-biome-info">
            <div class="wm-biome-top-tags">
              <span class="wm-realm-kicker">${palace.icon} ${palace.tag} (${palace.index + 1}/10)</span>
              <span class="wm-boss-mini">👑 الزعيم: 50</span>
            </div>
            <strong>${palace.name}</strong>
            <small class="wm-biome-landmarks">${biome.landmarks}</small>
            <div class="wm-biome-meta-row">
              <span class="wm-realm-status">${statusLabel}</span>
              <span class="wm-realm-range">مراحل ${startStage}–${endStage}</span>
            </div>
            <span class="wm-realm-progress"><i style="width:${progressPct}%"></i></span>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        if (locked) {
          showToast(`أكمل مراحل ${core().PALACES[palace.index - 1].name} لفتح هذا القصر!`);
          return;
        }
        const defaultRange = active ? Math.floor((currentMeta.stageInPalace - 1) / RANGE_SIZE) : 0;
        renderPalaceStages(palace.index, defaultRange);
      });

      stop.appendChild(card);
      track.appendChild(stop);
    });

    if (autoScroll) {
      requestAnimationFrame(() => focusCurrentLocation(false));
    }
  }

  function renderPalaceStages(palaceIndex, rangeIdx = 0) {
    ensureOverlay();
    currentView = "stages";
    activePalaceIndex = Math.max(0, Math.min(core().PALACES_COUNT - 1, palaceIndex));
    activeRangeIndex = Math.max(0, Math.min(3, rangeIdx));
    updateHeaderStats();

    const palace = core().PALACES[activePalaceIndex];
    const biome = PALACE_BIOMES[activePalaceIndex] || PALACE_BIOMES[0];
    const unlocked = getUnlockedStage();
    const worldEl = overlay.querySelector("#wmWorld");
    const backBtn = overlay.querySelector("#wmBack");
    const titleEl = overlay.querySelector("#wmTitle");
    const subEl = overlay.querySelector("#wmSubtitle");

    if (backBtn) backBtn.classList.remove("hidden");
    if (titleEl) titleEl.textContent = `${palace.tag}: ${palace.name}`;
    if (subEl) subEl.textContent = "اختر مرحلة مفتوحة على المسار — المرحلة 50 مواجهة زعيم ملك الحلوى";

    const rangeStart = activeRangeIndex * RANGE_SIZE + 1;
    const rangeEnd = rangeStart + RANGE_SIZE - 1;
    const palaceBase = activePalaceIndex * core().STAGES_PER_PALACE;

    worldEl.className = "wm-world wm-stages-view";
    worldEl.innerHTML = `
      <div class="wm-house-title" style="background:${biome.bg}">
        ${biomeScenerySvg(biome.motif, biome.glow)}
        <img src="${palace.castleArt}" alt="${palace.name}">
        <div class="wm-house-title-copy">
          <span class="wm-house-badge">${palace.icon} ${palace.tag} · ${biome.landmarks}</span>
          <b>${palace.name}</b>
          <small>${palace.description} · 100 مرحلة متدرجة</small>
        </div>
      </div>
      <div class="wm-range-tabs" role="tablist" aria-label="نطاق المراحل">
        ${[0, 1, 2, 3]
          .map((idx) => {
            const s = idx * RANGE_SIZE + 1;
            const e = s + RANGE_SIZE - 1;
            const hasBoss = s <= core().BOSS_STAGE_IN_PALACE && e >= core().BOSS_STAGE_IN_PALACE;
            return `<button type="button" role="tab" aria-selected="${idx === activeRangeIndex}" class="wm-range-tab ${
              idx === activeRangeIndex ? "active" : ""
            } ${hasBoss ? "has-boss" : ""}" data-range="${idx}">${s} – ${e}${hasBoss ? " 👑" : ""}</button>`;
          })
          .join("")}
      </div>
      <div class="wm-stage-winding" id="wmStageWinding" style="--biome-glow:${biome.glow}"></div>
    `;

    worldEl.querySelectorAll(".wm-range-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const nextRange = Number(tab.dataset.range) || 0;
        renderPalaceStages(activePalaceIndex, nextRange);
      });
    });

    const winding = worldEl.querySelector("#wmStageWinding");
    // Arrange 25 stages in 5 serpentine Candy Crush rows (5 nodes per row, alternating direction)
    const nodesPerRow = 5;
    const rowCount = Math.ceil(RANGE_SIZE / nodesPerRow);

    for (let r = 0; r < rowCount; r++) {
      const rowEl = document.createElement("div");
      rowEl.className = `wm-stage-row ${r % 2 === 1 ? "is-reversed" : ""}`;

      for (let i = 0; i < nodesPerRow; i++) {
        const localStage = rangeStart + r * nodesPerRow + i;
        if (localStage > rangeEnd) break;

        const globalStage = palaceBase + localStage;
        const done = globalStage < unlocked;
        const isCurrent = globalStage === unlocked;
        const locked = globalStage > unlocked;
        const isBoss = localStage === core().BOSS_STAGE_IN_PALACE;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = [
          "wm-path-node",
          done ? "done" : isCurrent ? "current" : "locked",
          isBoss ? "boss-stage" : "",
        ]
          .filter(Boolean)
          .join(" ");
        btn.dataset.stage = String(globalStage);

        const iconHtml = isBoss
          ? `<img class="wm-node-icon" src="./assets/packs/buttons/icon_crown.png" alt="زعيم">`
          : done
          ? `<img class="wm-node-icon" src="./assets/packs/buttons/icon_check.png" alt="مكتملة">`
          : isCurrent
          ? `<img class="wm-node-icon" src="./assets/packs/buttons/icon_star.png" alt="الحالية">`
          : `<img class="wm-node-icon" src="./assets/packs/buttons/icon_lock.png" alt="مقفولة">`;

        btn.innerHTML = `
          ${isCurrent ? '<span class="wm-node-pulse" aria-hidden="true"></span>' : ""}
          <span class="wm-node-circle">
            ${iconHtml}
            <b>${localStage}</b>
          </span>
          ${
            isBoss
              ? '<em class="wm-boss-tag">👑 ملك الحلوى</em>'
              : done
              ? '<em class="wm-node-stars">⭐⭐⭐</em>'
              : isCurrent
              ? '<em class="wm-node-here">العب الآن</em>'
              : ""
          }
        `;
        btn.setAttribute(
          "aria-label",
          `المرحلة ${localStage} (${palace.name})${isBoss ? " — زعيم ملك الحلوى" : ""}${
            locked ? " (مقفولة)" : isCurrent ? " (الحالية)" : " (مكتملة)"
          }`
        );

        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          void openStage(globalStage, btn);
        });

        rowEl.appendChild(btn);
      }
      winding.appendChild(rowEl);
    }

    requestAnimationFrame(() => focusCurrentLocation(false));
  }

  function show() {
    ensureOverlay();
    overlay.classList.remove("hidden");
    document.body.classList.add("map-open");
    document.body.dataset.state = "map";
    window.CMRPauseGameRender?.();
    window.Dragon3DCharacter?.pause?.();
    renderPalaces(true);
  }

  function hide() {
    if (overlay) overlay.classList.add("hidden");
    document.body.classList.remove("map-open");
    window.CMRResumeGameRender?.();
  }

  window.CMRGetBoardArtUrl = getBoardArtUrl;
  window.CMRShowWorldMap = show;
  window.CMRHideWorldMap = hide;
  window.CMRRefreshWorldMap = () => {
    if (overlay && !overlay.classList.contains("hidden")) {
      if (currentView === "stages") renderPalaceStages(activePalaceIndex, activeRangeIndex);
      else renderPalaces(false);
    }
  };
})();