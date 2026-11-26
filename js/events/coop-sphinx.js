/* Candy Magic Royale — Phase 3 Event 5: تحدي الأصدقاء (Co-op Golden Candy Sphinx)
 * Isolated module listening to CMREventBus ("stage:win").
 * Uses 05_Coop_Sphinx/event_ui_coop_sphinx.png and icon_golden_candy_sphinx.png.
 * Features bottom-to-top progressive statue illumination via CSS clip-path + golden sparkle particles,
 * 4-milestone shared progress bar with celebratory glow pulse & coin shower on unlock,
 * and a partner invite slot ("ادعُ صديقاً") with copyable/shareable invite code.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root, require("./event-bus"));
  } else {
    root.CMRCoopSphinx = factory(root, {
      EventBus: root.CMREventBus,
      EventFX: root.CMREventFX,
      EVENT_ASSETS: root.CMR_EVENT_ASSETS,
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root, busPkg) {
  "use strict";

  const STORAGE_KEY = "cmr_event_coop_sphinx_v1";
  const CONFIG = Object.freeze({
    POINTS_PER_WIN: 120,
    PARTNER_BOOST_POINTS: 160,
    STARTING_TOKENS: 2,
    POINTS_PER_TOKEN: 150,
  });

  const ASSETS = busPkg?.EVENT_ASSETS || {
    coopSphinxFrame: "./public/assets/aistudio/event_ui_coop_sphinx_af779c23.png",
    goldenCandySphinx: "./public/assets/aistudio/icon_golden_candy_sphinx_0c0aee3b.png",
    coinIcon: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png",
    chestOpenIcon: "./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png",
    rocketIcon: "./public/assets/aistudio/01_booster_candy_rocket_b53df03d.png",
    wandIcon: "./public/assets/aistudio/02_booster_magic_wand_e83e8cc8.png",
  };

  const MILESTONES = Object.freeze([
    { tier: 1, target: 300, labelAr: "+300 عملة", icon: ASSETS.coinIcon, reward: Object.freeze({ coins: 300 }) },
    { tier: 2, target: 750, labelAr: "2× صاروخ", icon: ASSETS.rocketIcon, reward: Object.freeze({ rockets: 2, coins: 200 }) },
    { tier: 3, target: 1350, labelAr: "2× عصا سحرية", icon: ASSETS.wandIcon, reward: Object.freeze({ paints: 2, coins: 400 }) },
    { tier: 4, target: 2000, labelAr: "صندوق أبو الهول", icon: ASSETS.chestOpenIcon, isGrand: true, reward: Object.freeze({ coins: 2500, gems: 12, rockets: 2 }) },
  ]);

  // =========================================================================
  // PURE LOGIC ENGINE (Unit-Tested)
  // =========================================================================
  function createCoopSphinxEngine(initial = {}) {
    const maxPoints = MILESTONES[MILESTONES.length - 1].target;
    let state = {
      playerPoints: Math.max(0, Math.floor(Number(initial.playerPoints ?? 180))),
      partnerPoints: Math.max(0, Math.floor(Number(initial.partnerPoints ?? 120))),
      tokens:
        initial.tokens === undefined
          ? CONFIG.STARTING_TOKENS
          : Math.max(0, Math.floor(Number(initial.tokens) || 0)),
      inviteCode:
        typeof initial.inviteCode === "string" && initial.inviteCode.trim()
          ? initial.inviteCode.trim()
          : "SPHINX-4092",
      partnerName:
        typeof initial.partnerName === "string" && initial.partnerName.trim()
          ? initial.partnerName.trim()
          : "",
      claimedTiers: Array.isArray(initial.claimedTiers)
        ? initial.claimedTiers.map(Number).filter(Number.isFinite)
        : [],
    };

    function getState() {
      const totalPoints = Math.min(maxPoints, state.playerPoints + state.partnerPoints);
      const percent = Math.min(100, Math.round((totalPoints / maxPoints) * 100));
      const milestones = MILESTONES.map((m) => {
        const claimed = state.claimedTiers.includes(m.tier);
        const reached = totalPoints >= m.target;
        return {
          ...m,
          claimed,
          reached,
          canClaim: reached && !claimed,
        };
      });
      const claimableCount = milestones.filter((m) => m.canClaim).length;

      return {
        playerPoints: state.playerPoints,
        partnerPoints: state.partnerPoints,
        totalPoints,
        maxPoints,
        percent,
        tokens: state.tokens,
        inviteCode: state.inviteCode,
        partnerName: state.partnerName,
        hasPartner: Boolean(state.partnerName),
        milestones,
        claimableCount,
        isComplete: totalPoints >= maxPoints,
      };
    }

    function addPoints(points = CONFIG.POINTS_PER_WIN, fromPartner = false) {
      const prevReached = MILESTONES.filter((m) => state.playerPoints + state.partnerPoints >= m.target).length;
      const inc = Math.max(1, Math.floor(Number(points) || CONFIG.POINTS_PER_WIN));
      if (fromPartner) {
        state.partnerPoints += inc;
      } else {
        state.playerPoints += inc;
      }
      const nextState = getState();
      const newReached = nextState.milestones.filter((m) => m.reached).length;
      return {
        added: inc,
        unlockedMilestone: newReached > prevReached,
        state: nextState,
      };
    }

    function spendToken() {
      if (state.tokens <= 0) {
        return { ok: false, reason: "no_tokens", unlockedMilestone: false, state: getState() };
      }
      state.tokens -= 1;
      const res = addPoints(CONFIG.POINTS_PER_TOKEN, false);
      return { ok: true, ...res };
    }

    function earnWinToken() {
      state.tokens += 1;
      return addPoints(CONFIG.POINTS_PER_WIN, false);
    }

    function invitePartner(name = "الأميرة كليوباترا") {
      const cleanName = typeof name === "string" && name.trim() ? name.trim() : "الأميرة كليوباترا";
      const wasEmpty = !state.partnerName;
      state.partnerName = cleanName;
      let boostRes = { unlockedMilestone: false };
      if (wasEmpty) {
        boostRes = addPoints(CONFIG.PARTNER_BOOST_POINTS, true);
      }
      return {
        ok: true,
        joinedNow: wasEmpty,
        unlockedMilestone: boostRes.unlockedMilestone,
        state: getState(),
      };
    }

    function claimMilestone(tierNum) {
      const m = MILESTONES.find((item) => item.tier === Number(tierNum));
      if (!m) return { ok: false, reason: "invalid_tier", reward: null, state: getState() };
      if (state.claimedTiers.includes(m.tier)) {
        return { ok: false, reason: "already_claimed", reward: null, state: getState() };
      }
      const totalPoints = state.playerPoints + state.partnerPoints;
      if (totalPoints < m.target) {
        return { ok: false, reason: "not_reached", reward: null, state: getState() };
      }
      state.claimedTiers.push(m.tier);
      return {
        ok: true,
        milestone: m,
        reward: { ...m.reward },
        state: getState(),
      };
    }

    function exportState() {
      return {
        playerPoints: state.playerPoints,
        partnerPoints: state.partnerPoints,
        tokens: state.tokens,
        inviteCode: state.inviteCode,
        partnerName: state.partnerName,
        claimedTiers: [...state.claimedTiers],
      };
    }

    return {
      getState,
      addPoints,
      spendToken,
      earnWinToken,
      invitePartner,
      claimMilestone,
      exportState,
    };
  }

  // =========================================================================
  // PERSISTENCE & BROWSER UI INTEGRATION
  // =========================================================================
  const hasDOM = typeof document !== "undefined" && typeof window !== "undefined";

  function loadPersisted() {
    if (!hasDOM) return {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function savePersisted(data) {
    if (!hasDOM) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  const engine = createCoopSphinxEngine(loadPersisted());
  const bus = busPkg?.EventBus;
  const fx = busPkg?.EventFX;

  let modalEl = null;

  function notifyBadgeUpdate() {
    bus?.emit?.("events:badge-update", { source: "coop-sphinx" });
  }

  function pulseSphinxGlow(showerCoins = false) {
    if (!modalEl) return;
    const stage = modalEl.querySelector("#csSphinxStage");
    if (!stage) return;
    stage.classList.remove("is-illuminating");
    void stage.offsetWidth;
    stage.classList.add("is-illuminating");
    fx?.spawnSparkleBurst?.(stage, {
      count: showerCoins ? 24 : 14,
      colors: ["#fde047", "#38bdf8", "#f472b6", "#ffffff"],
    });
    if (showerCoins) {
      fx?.launchCoinBurst?.(stage, { count: 18, iconSrc: ASSETS.coinIcon, targetKind: "coins" });
    }
    clearTimeout(stage.__glowTimer);
    stage.__glowTimer = setTimeout(() => stage.classList.remove("is-illuminating"), 780);
  }

  function ensureModal() {
    if (!hasDOM) return null;
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.id = "coopSphinxModal";
    modalEl.className = "modal ev-modal hidden";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "coopSphinxTitle");

    modalEl.innerHTML = `
      <div class="ev-stage ev-stage-coop-sphinx" dir="rtl">
        <img class="ev-frame-img" src="${ASSETS.coopSphinxFrame}" alt="" aria-hidden="true" draggable="false">
        <h2 class="ev-ribbon-title ev-title-coop-sphinx" id="coopSphinxTitle">تحدي الأصدقاء</h2>
        <button type="button" class="ev-close-orb ev-close-coop-sphinx" id="coopSphinxCloseBtn" aria-label="إغلاق تحدي الأصدقاء">
          <span aria-hidden="true">✕</span>
        </button>

        <div class="ev-inner-safe ev-safe-coop-sphinx">
          <!-- Partner Invite Slot with Shareable Invite Code -->
          <div class="ev-cs-partner-bar" id="csPartnerBar">
            <div class="ev-cs-partner-info">
              <strong id="csPartnerName">شريك البناء: بانتظار صديق</strong>
              <small id="csInviteCodeText" dir="ltr">CODE: SPHINX-4092</small>
            </div>
            <button type="button" class="ev-cs-invite-btn" id="csInviteBtn">
              <span id="csInviteBtnLbl">ادعُ صديقاً</span>
            </button>
          </div>

          <!-- Centered Golden Candy Sphinx Statue (Progressively Illuminated Bottom-to-Top via clip-path) -->
          <div class="ev-cs-sphinx-stage" id="csSphinxStage">
            <div class="ev-cs-aura" aria-hidden="true"></div>
            <div class="ev-cs-statue-wrap" id="csStatueWrap" style="--sphinx-pct:15%">
              <img class="ev-cs-statue-dim" src="${ASSETS.goldenCandySphinx}" alt="" aria-hidden="true" draggable="false">
              <img class="ev-cs-statue-lit" id="csStatueLit" src="${ASSETS.goldenCandySphinx}" alt="تمثال أبو الهول الذهبي" draggable="false">
            </div>
            <span class="ev-cs-pct-badge" id="csPctBadge" dir="ltr">15%</span>
          </div>

          <!-- 4-Milestone Shared Progress Bar -->
          <div class="ev-cs-progress-panel">
            <div class="ev-cs-prog-head">
              <span>تقدم بناء أبو الهول المشترك</span>
              <strong id="csPointsFrac" dir="ltr">300 / 2,000</strong>
            </div>
            <div class="ev-cs-bar-track">
              <div class="ev-cs-bar-fill" id="csBarFill" style="width:15%"></div>
            </div>
            <div class="ev-cs-milestones-row" id="csMilestonesRow"></div>
          </div>

          <!-- Contribute Golden Candy Points CTA -->
          <button type="button" class="ev-cs-build-btn" id="csBuildBtn">
            <img src="${ASSETS.coinIcon}" alt="">
            <span id="csBuildBtnLabel">أضف طاقة البناء (+150 نقطة · متاح 2)</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) close();
    });
    modalEl.querySelector("#coopSphinxCloseBtn").addEventListener("click", close);

    // Partner Invite Slot: copies invite code to clipboard + joins friendly partner if empty
    modalEl.querySelector("#csInviteBtn").addEventListener("click", () => {
      const st = engine.getState();
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(st.inviteCode).catch(() => {});
      }
      const res = engine.invitePartner("الأميرة كليوباترا");
      savePersisted(engine.exportState());
      window.CMRProfile?.vibrate?.([16, 22]);
      window.CMRAudio?.playSfx?.("reward");
      if (res.joinedNow) {
        pulseSphinxGlow(res.unlockedMilestone);
        fx?.showToast?.(`🤝 تم نسخ الكود ${st.inviteCode} وانضمت الأميرة كليوباترا (+160 نقطة بناء)!`);
      } else {
        fx?.showToast?.(`📋 تم نسخ كود الدعوة: ${st.inviteCode} لمشاركته مع أصدقائك!`);
      }
      render();
      notifyBadgeUpdate();
    });

    // Spend Build Token to progressively illuminate the Golden Candy Sphinx
    modalEl.querySelector("#csBuildBtn").addEventListener("click", () => {
      const res = engine.spendToken();
      if (!res.ok) {
        window.CMRAudio?.playSfx?.("invalid");
        fx?.showToast?.("اربح مرحلة جديدة للحصول على طاقة بناء إضافية لأبو الهول!");
        return;
      }
      savePersisted(engine.exportState());
      window.CMRProfile?.vibrate?.([16, 24]);
      window.CMRAudio?.playSfx?.(res.unlockedMilestone ? "win" : "reward");
      pulseSphinxGlow(res.unlockedMilestone);
      if (res.unlockedMilestone) {
        fx?.showToast?.("✨ أضاء تمثال أبو الهول الذهبي وفتح هدية جديدة!");
      } else {
        fx?.showToast?.(`🌟 أضفت +${CONFIG.POINTS_PER_TOKEN} نقطة لبناء أبو الهول!`);
      }
      render();
      notifyBadgeUpdate();
    });

    return modalEl;
  }

  function render() {
    if (!modalEl) return;
    const st = engine.getState();

    const partnerNameEl = modalEl.querySelector("#csPartnerName");
    const codeEl = modalEl.querySelector("#csInviteCodeText");
    const inviteLbl = modalEl.querySelector("#csInviteBtnLbl");
    const statueWrap = modalEl.querySelector("#csStatueWrap");
    const pctBadge = modalEl.querySelector("#csPctBadge");
    const pointsFrac = modalEl.querySelector("#csPointsFrac");
    const barFill = modalEl.querySelector("#csBarFill");
    const msRow = modalEl.querySelector("#csMilestonesRow");
    const buildBtn = modalEl.querySelector("#csBuildBtn");
    const buildLbl = modalEl.querySelector("#csBuildBtnLabel");

    if (partnerNameEl) {
      partnerNameEl.textContent = st.hasPartner
        ? `شريكك: ${st.partnerName} (+${st.partnerPoints})`
        : "شريك البناء: ادعُ صديقاً";
    }
    if (codeEl) codeEl.textContent = `CODE: ${st.inviteCode}`;
    if (inviteLbl) inviteLbl.textContent = st.hasPartner ? "نسخ الكود" : "ادعُ صديقاً";

    if (statueWrap) statueWrap.style.setProperty("--sphinx-pct", `${st.percent}%`);
    if (pctBadge) pctBadge.textContent = `${st.percent}%`;
    if (pointsFrac) pointsFrac.textContent = `${st.totalPoints.toLocaleString("en-US")} / ${st.maxPoints.toLocaleString("en-US")}`;
    if (barFill) barFill.style.width = `${st.percent}%`;

    if (buildBtn && buildLbl) {
      buildBtn.disabled = st.tokens <= 0 || st.isComplete;
      buildBtn.classList.toggle("is-ready", st.tokens > 0 && !st.isComplete);
      buildLbl.textContent = st.isComplete
        ? "🏆 اكتمل بناء أبو الهول الذهبي!"
        : st.tokens > 0
        ? `أضف طاقة البناء (+${CONFIG.POINTS_PER_TOKEN} · متاح ${st.tokens})`
        : "اربح مراحل لجمع طاقة البناء";
    }

    if (!msRow) return;
    msRow.innerHTML = "";
    st.milestones.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `ev-cs-ms-node ${m.claimed ? "is-claimed" : m.canClaim ? "is-claimable" : "is-locked"} ${m.isGrand ? "is-grand" : ""}`;
      btn.dataset.sphinxTier = String(m.tier);
      btn.disabled = !m.canClaim;
      btn.innerHTML = `
        <img src="${m.icon}" alt="" draggable="false">
        <span>${m.claimed ? "تم ✓" : m.canClaim ? "استلام!" : m.target}</span>
      `;
      if (m.canClaim) {
        btn.addEventListener("click", () => {
          const res = engine.claimMilestone(m.tier);
          if (!res.ok) return;
          savePersisted(engine.exportState());
          window.CMRProfile?.vibrate?.([22, 26, 28]);
          window.CMRAudio?.playSfx?.(m.isGrand ? "win" : "reward");
          pulseSphinxGlow(true);
          fx?.grantReward?.(res.reward);
          fx?.showToast?.(`🎁 استلمت هدية أبو الهول: ${m.labelAr}!`);
          render();
          notifyBadgeUpdate();
        });
      }
      msRow.appendChild(btn);
    });
  }

  function open() {
    ensureModal();
    render();
    fx?.openElasticModal?.(modalEl);
  }

  function close() {
    fx?.closeElasticModal?.(modalEl);
  }

  if (bus && typeof bus.on === "function") {
    bus.on("stage:win", () => {
      const res = engine.earnWinToken();
      savePersisted(engine.exportState());
      if (modalEl && !modalEl.classList.contains("hidden")) {
        render();
        pulseSphinxGlow(res.unlockedMilestone);
      }
      notifyBadgeUpdate();
    });
  }

  return {
    CONFIG,
    MILESTONES,
    createCoopSphinxEngine,
    getState: () => engine.getState(),
    hasNotification: () => {
      const st = engine.getState();
      return st.claimableCount > 0 || (st.tokens > 0 && !st.isComplete);
    },
    open,
    close,
    render,
  };
});
