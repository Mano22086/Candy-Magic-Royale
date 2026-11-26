/* Candy Magic Royale — Phase 3 Social System 3: فرق المملكة (Teams & Heart Sharing)
 * Isolated module using 03_Teams/event_ui_teams.png, icon_team_scarab_shield.png, and icon_royal_heart_3d.png.
 * Features weekly Team Chest progress bar, member rows with "أرسل قلب" (+10 bonus coins & floating 3D royal heart
 * + sparkle burst) and "طلب قلوب", persisted in localStorage with ready-to-wire Firestore sync adapter hooks.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root, require("../events/event-bus"));
  } else {
    root.CMRTeams = factory(root, {
      EventBus: root.CMREventBus,
      EventFX: root.CMREventFX,
      EVENT_ASSETS: root.CMR_EVENT_ASSETS,
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root, busPkg) {
  "use strict";

  const STORAGE_KEY = "cmr_social_teams_v1";
  const CONFIG = Object.freeze({
    COINS_PER_HEART_SENT: 10,
    CHEST_TARGET_POINTS: 25,
    CHEST_REWARD: Object.freeze({ coins: 1000, rockets: 2, paints: 1 }),
    REQUEST_COOLDOWN_MS: 30 * 60 * 1000, // 30 minutes
  });

  const ASSETS = busPkg?.EVENT_ASSETS || {
    teamsFrame: "./public/assets/aistudio/event_ui_teams_814f0cee.png",
    teamScarabShield: "./public/assets/aistudio/icon_team_scarab_shield_9cc0cf8b.png",
    royalHeart3d: "./public/assets/aistudio/icon_royal_heart_3d_583b6300.png",
    coinIcon: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png",
    chestOpenIcon: "./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png",
  };

  const DEFAULT_MEMBERS = Object.freeze([
    { id: "m_cleopatra", name: "الملكة نفرتيتي", roleAr: "قائدة الفريق", crowns: 48, needsHeart: true, avatar: "👑" },
    { id: "m_ramesses", name: "رمسيس الذهبي", roleAr: "نائب القائد", crowns: 39, needsHeart: true, avatar: "🦅" },
    { id: "m_amira", name: "الأميرة سلمى", roleAr: "عضو نشط", crowns: 32, needsHeart: true, avatar: "💎" },
    { id: "m_kareem", name: "كريم النيل", roleAr: "عضو نشط", crowns: 27, needsHeart: true, avatar: "⭐" },
    { id: "m_layla", name: "ليلى الحلوى", roleAr: "عضو جديد", crowns: 19, needsHeart: false, avatar: "🌸" },
  ]);

  // =========================================================================
  // PURE LOGIC ENGINE (Unit-Tested)
  // =========================================================================
  function createTeamsEngine(initial = {}, nowFn = () => Date.now()) {
    const initialSent = Array.isArray(initial.sentHeartIds) ? initial.sentHeartIds : [];
    let state = {
      teamName: typeof initial.teamName === "string" && initial.teamName.trim() ? initial.teamName.trim() : "فرسان النيل الملكي",
      teamCode: typeof initial.teamCode === "string" && initial.teamCode.trim() ? initial.teamCode.trim() : "NILE-7742",
      chestPoints: Math.max(0, Math.floor(Number(initial.chestPoints ?? 14))),
      chestClaimed: Boolean(initial.chestClaimed),
      heartsSentTotal: Math.max(0, Math.floor(Number(initial.heartsSentTotal) || 0)),
      sentHeartSet: new Set(initialSent),
      lastRequestAt: Math.max(0, Number(initial.lastRequestAt) || 0),
      pendingReceivedHearts: Math.max(0, Math.floor(Number(initial.pendingReceivedHearts) || 0)),
      members:
        Array.isArray(initial.members) && initial.members.length > 0
          ? initial.members.map((m) => ({ ...m }))
          : DEFAULT_MEMBERS.map((m) => ({ ...m })),
    };

    function getState() {
      const now = nowFn();
      const cooldownRemainingMs =
        state.lastRequestAt > 0 ? Math.max(0, state.lastRequestAt + CONFIG.REQUEST_COOLDOWN_MS - now) : 0;
      const canRequestHearts = cooldownRemainingMs <= 0;
      const chestPercent = Math.min(100, Math.round((state.chestPoints / CONFIG.CHEST_TARGET_POINTS) * 100));
      const canClaimChest = state.chestPoints >= CONFIG.CHEST_TARGET_POINTS && !state.chestClaimed;
      const members = state.members.map((m) => ({
        ...m,
        heartSent: state.sentHeartSet.has(m.id),
        canSendHeart: Boolean(m.needsHeart) && !state.sentHeartSet.has(m.id),
      }));
      const sendableCount = members.filter((m) => m.canSendHeart).length;

      return {
        teamName: state.teamName,
        teamCode: state.teamCode,
        chestPoints: state.chestPoints,
        chestTarget: CONFIG.CHEST_TARGET_POINTS,
        chestPercent,
        chestClaimed: state.chestClaimed,
        canClaimChest,
        heartsSentTotal: state.heartsSentTotal,
        pendingReceivedHearts: state.pendingReceivedHearts,
        canRequestHearts,
        cooldownRemainingMs,
        sendableCount,
        members,
      };
    }

    function sendHeart(memberId) {
      const member = state.members.find((m) => m.id === memberId);
      if (!member) return { ok: false, reason: "member_not_found", bonusCoins: 0, state: getState() };
      if (!member.needsHeart || state.sentHeartSet.has(memberId)) {
        return { ok: false, reason: "already_sent", bonusCoins: 0, state: getState() };
      }
      state.sentHeartSet.add(memberId);
      state.heartsSentTotal += 1;
      state.chestPoints += 2;
      return {
        ok: true,
        member: { ...member },
        bonusCoins: CONFIG.COINS_PER_HEART_SENT,
        state: getState(),
      };
    }

    function requestHearts() {
      const now = nowFn();
      if (state.lastRequestAt > 0 && state.lastRequestAt + CONFIG.REQUEST_COOLDOWN_MS > now) {
        return { ok: false, reason: "cooldown", grantedHearts: 0, state: getState() };
      }
      state.lastRequestAt = now;
      state.chestPoints += 1;
      state.pendingReceivedHearts += 1;
      return {
        ok: true,
        grantedHearts: 1,
        state: getState(),
      };
    }

    function recordTeamWinContribution(points = 1) {
      const inc = Math.max(1, Math.floor(Number(points) || 1));
      state.chestPoints += inc;
      return getState();
    }

    function claimTeamChest() {
      if (state.chestPoints < CONFIG.CHEST_TARGET_POINTS) {
        return { ok: false, reason: "not_ready", reward: null, state: getState() };
      }
      if (state.chestClaimed) {
        return { ok: false, reason: "already_claimed", reward: null, state: getState() };
      }
      state.chestClaimed = true;
      return {
        ok: true,
        reward: { ...CONFIG.CHEST_REWARD },
        state: getState(),
      };
    }

    function exportState() {
      return {
        teamName: state.teamName,
        teamCode: state.teamCode,
        chestPoints: state.chestPoints,
        chestClaimed: state.chestClaimed,
        heartsSentTotal: state.heartsSentTotal,
        sentHeartIds: Array.from(state.sentHeartSet),
        lastRequestAt: state.lastRequestAt,
        pendingReceivedHearts: state.pendingReceivedHearts,
        members: state.members.map((m) => ({ ...m })),
      };
    }

    function mergeRemoteState(remote) {
      if (!remote || typeof remote !== "object") return getState();
      if (typeof remote.teamName === "string" && remote.teamName.trim()) state.teamName = remote.teamName.trim();
      if (Number.isFinite(Number(remote.chestPoints))) {
        state.chestPoints = Math.max(state.chestPoints, Math.floor(Number(remote.chestPoints)));
      }
      if (Array.isArray(remote.members) && remote.members.length > 0) {
        state.members = remote.members.map((m) => ({ ...m }));
      }
      return getState();
    }

    return {
      getState,
      sendHeart,
      requestHearts,
      recordTeamWinContribution,
      claimTeamChest,
      exportState,
      mergeRemoteState,
    };
  }

  // =========================================================================
  // PERSISTENCE, FIRESTORE SYNC HOOKS & BROWSER UI INTEGRATION
  // =========================================================================
  const hasDOM = typeof document !== "undefined" && typeof window !== "undefined";
  let firestoreAdapter = null;

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
    if (firestoreAdapter && typeof firestoreAdapter.pushTeamState === "function") {
      try {
        Promise.resolve(firestoreAdapter.pushTeamState(data)).catch(() => {});
      } catch (_) {}
    }
  }

  function registerFirestoreAdapter(adapter) {
    firestoreAdapter = adapter || null;
    if (firestoreAdapter && typeof firestoreAdapter.pullTeamState === "function") {
      try {
        Promise.resolve(firestoreAdapter.pullTeamState())
          .then((remote) => {
            if (remote) {
              engine.mergeRemoteState(remote);
              savePersisted(engine.exportState());
              render();
              notifyBadgeUpdate();
            }
          })
          .catch(() => {});
      } catch (_) {}
    }
  }

  const engine = createTeamsEngine(loadPersisted());
  const bus = busPkg?.EventBus;
  const fx = busPkg?.EventFX;

  let modalEl = null;

  function notifyBadgeUpdate() {
    bus?.emit?.("events:badge-update", { source: "teams" });
  }

  // Launch glowing 3D royal heart floating upward with sparkle particles (transform & opacity only)
  function launchFloatingRoyalHeart(originEl) {
    if (!hasDOM || !originEl) return;
    const rect = originEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const heart = document.createElement("img");
    heart.className = "ev-tm-floating-heart";
    heart.src = ASSETS.royalHeart3d;
    heart.alt = "";
    heart.setAttribute("aria-hidden", "true");
    heart.style.left = `${Math.round(cx)}px`;
    heart.style.top = `${Math.round(cy)}px`;
    document.body.appendChild(heart);

    fx?.spawnSparkleBurst?.(originEl, {
      count: 14,
      colors: ["#fb7185", "#f43f5e", "#fde047", "#ffffff"],
    });

    setTimeout(() => heart.remove(), 980);
  }

  function ensureModal() {
    if (!hasDOM) return null;
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.id = "teamsModal";
    modalEl.className = "modal ev-modal hidden";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "teamsModalTitle");

    modalEl.innerHTML = `
      <div class="ev-stage ev-stage-teams" dir="rtl">
        <img class="ev-frame-img" src="${ASSETS.teamsFrame}" alt="" aria-hidden="true" draggable="false">
        <button type="button" class="ev-close-orb ev-close-teams" id="teamsCloseBtn" aria-label="إغلاق فرق المملكة">
          <span aria-hidden="true">✕</span>
        </button>

        <div class="ev-inner-safe ev-safe-teams">
          <!-- Title Pill neatly seated below the frame's golden crest -->
          <div class="ev-tm-title-banner">
            <h2 id="teamsModalTitle">فرق المملكة</h2>
          </div>

          <!-- Team Crest Header + Request Hearts CTA -->
          <div class="ev-tm-club-card">
            <img class="ev-tm-shield-img" src="${ASSETS.teamScarabShield}" alt="شعار الفريق" draggable="false">
            <div class="ev-tm-club-info">
              <strong id="tmClubName">فرسان النيل الملكي</strong>
              <small id="tmClubMeta">5 أعضاء · أرسل قلباً واربح +10 عملة</small>
            </div>
            <button type="button" class="ev-tm-req-btn" id="tmRequestHeartsBtn">
              <img src="${ASSETS.royalHeart3d}" alt="" draggable="false">
              <span id="tmReqLabel">طلب قلوب</span>
            </button>
          </div>

          <!-- Weekly Team Chest Progress Bar -->
          <div class="ev-tm-chest-card">
            <div class="ev-tm-chest-top">
              <span>صندوق الفريق الأسبوعي</span>
              <strong id="tmChestFrac" dir="ltr">14 / 25</strong>
            </div>
            <div class="ev-tm-chest-row">
              <div class="ev-tm-chest-track">
                <div class="ev-tm-chest-fill" id="tmChestFill" style="width:56%"></div>
              </div>
              <button type="button" class="ev-tm-chest-btn" id="tmClaimChestBtn" aria-label="استلام صندوق الفريق الأسبوعي">
                <img src="${ASSETS.chestOpenIcon}" alt="" draggable="false">
                <span id="tmChestBtnLbl">صندوق</span>
              </button>
            </div>
          </div>

          <!-- Scrollable Team Member Rows -->
          <div class="ev-tm-members-list" id="tmMembersList" role="list" aria-label="أعضاء الفريق"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) close();
    });
    modalEl.querySelector("#teamsCloseBtn").addEventListener("click", close);

    modalEl.querySelector("#tmRequestHeartsBtn").addEventListener("click", () => {
      const btn = modalEl.querySelector("#tmRequestHeartsBtn");
      const res = engine.requestHearts();
      if (!res.ok) {
        const mins = Math.max(1, Math.ceil(res.state.cooldownRemainingMs / 60000));
        window.CMRAudio?.playSfx?.("invalid");
        fx?.showToast?.(`تم إرسال طلب القلوب! يمكنك الطلب مجدداً بعد ${mins} دقيقة.`);
        return;
      }
      savePersisted(engine.exportState());
      window.CMRProfile?.vibrate?.([14, 20, 16]);
      window.CMRAudio?.playSfx?.("reward");
      launchFloatingRoyalHeart(btn);
      fx?.grantReward?.({ lives: res.grantedHearts });
      fx?.showToast?.("❤️ أرسلت طلب قلوب لفريقك وتلقيت +1 قلب مجاني من رفاقك!");
      render();
      notifyBadgeUpdate();
    });

    modalEl.querySelector("#tmClaimChestBtn").addEventListener("click", () => {
      const btn = modalEl.querySelector("#tmClaimChestBtn");
      const res = engine.claimTeamChest();
      if (!res.ok) {
        if (res.reason === "already_claimed") {
          fx?.showToast?.("✅ تم استلام صندوق الفريق الأسبوعي لهذا الأسبوع!");
        } else {
          window.CMRAudio?.playSfx?.("invalid");
          fx?.showToast?.(`اجمع ${res.state.chestTarget - res.state.chestPoints} نقطة إضافية لفتح صندوق الفريق (+1,000 عملة و2× صاروخ)!`);
        }
        return;
      }
      savePersisted(engine.exportState());
      window.CMRProfile?.vibrate?.([22, 26, 26]);
      window.CMRAudio?.playSfx?.("win");
      fx?.spawnSparkleBurst?.(btn, { count: 22 });
      fx?.launchCoinBurst?.(btn, { count: 20, iconSrc: ASSETS.coinIcon, targetKind: "coins" });
      fx?.grantReward?.(res.reward);
      fx?.showToast?.("🏆 فتحت صندوق الفريق الأسبوعي (+1,000 عملة و2× صاروخ و1× عصا)!");
      render();
      notifyBadgeUpdate();
    });

    return modalEl;
  }

  function render() {
    if (!modalEl) return;
    const st = engine.getState();

    const clubNameEl = modalEl.querySelector("#tmClubName");
    const chestFracEl = modalEl.querySelector("#tmChestFrac");
    const chestFillEl = modalEl.querySelector("#tmChestFill");
    const chestBtn = modalEl.querySelector("#tmClaimChestBtn");
    const chestLbl = modalEl.querySelector("#tmChestBtnLbl");
    const reqBtn = modalEl.querySelector("#tmRequestHeartsBtn");
    const reqLbl = modalEl.querySelector("#tmReqLabel");
    const listEl = modalEl.querySelector("#tmMembersList");

    if (clubNameEl) clubNameEl.textContent = st.teamName;
    if (chestFracEl) chestFracEl.textContent = `${Math.min(st.chestPoints, st.chestTarget)} / ${st.chestTarget}`;
    if (chestFillEl) chestFillEl.style.width = `${st.chestPercent}%`;

    if (chestBtn && chestLbl) {
      chestBtn.classList.toggle("is-claimable", st.canClaimChest);
      chestBtn.classList.toggle("is-claimed", st.chestClaimed);
      chestLbl.textContent = st.chestClaimed ? "تم ✓" : st.canClaimChest ? "استلام!" : "صندوق";
    }

    if (reqBtn && reqLbl) {
      reqBtn.classList.toggle("is-cooldown", !st.canRequestHearts);
      reqLbl.textContent = st.canRequestHearts ? "طلب قلوب" : "تم الطلب ✓";
    }

    if (!listEl) return;
    listEl.innerHTML = "";
    st.members.forEach((member) => {
      const row = document.createElement("div");
      row.className = `ev-tm-member-row ${member.heartSent ? "is-sent" : ""}`;
      row.setAttribute("role", "listitem");
      row.dataset.memberId = member.id;
      row.innerHTML = `
        <span class="ev-tm-avatar" aria-hidden="true">${member.avatar}</span>
        <div class="ev-tm-member-meta">
          <strong>${member.name}</strong>
          <small>${member.roleAr} · 👑 ${member.crowns}</small>
        </div>
        ${
          member.canSendHeart
            ? `<button type="button" class="ev-tm-send-heart-btn" data-send-heart="${member.id}">
                 <img src="${ASSETS.royalHeart3d}" alt="" draggable="false">
                 <span>أرسل قلب</span>
                 <b>+10</b>
               </button>`
            : `<span class="ev-tm-sent-tag">${member.heartSent ? "أُرسل ❤️" : "ممتلئ"}</span>`
        }
      `;

      const sendBtn = row.querySelector("[data-send-heart]");
      if (sendBtn) {
        sendBtn.addEventListener("click", () => {
          const res = engine.sendHeart(member.id);
          if (!res.ok) return;
          savePersisted(engine.exportState());
          window.CMRProfile?.vibrate?.([14, 18]);
          window.CMRAudio?.playSfx?.("reward");
          launchFloatingRoyalHeart(sendBtn);
          fx?.launchCoinBurst?.(sendBtn, { count: 6, iconSrc: ASSETS.coinIcon, targetKind: "coins" });
          fx?.grantReward?.({ coins: res.bonusCoins });
          fx?.showToast?.(`❤️ أرسلت قلباً إلى ${member.name} وحصلت على +${res.bonusCoins} عملات ذهبية!`);
          render();
          notifyBadgeUpdate();
        });
      }

      listEl.appendChild(row);
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
      engine.recordTeamWinContribution(1);
      savePersisted(engine.exportState());
      if (modalEl && !modalEl.classList.contains("hidden")) render();
      notifyBadgeUpdate();
    });
  }

  return {
    CONFIG,
    createTeamsEngine,
    registerFirestoreAdapter,
    getState: () => engine.getState(),
    hasNotification: () => {
      const st = engine.getState();
      return st.sendableCount > 0 || st.canClaimChest;
    },
    open,
    close,
    render,
  };
});
