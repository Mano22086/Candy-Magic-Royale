/* Candy Magic Royale — Daily Lucky Spin Wheel Modal
 * Uses extracted seamless 8-slice rotating disc, fixed 12 o'clock pointer,
 * upright golden center spin button ("لف العجلة 1/1" -> "لف العجلة 0/1"),
 * radial 03_Shop_Icons reward nodes, localStorage persistence, and prize celebration popup.
 */
(() => {
  "use strict";

  const WHEEL_STORAGE_KEY = "cmr_lucky_wheel_v1";

  let modalEl = null;
  let rotorEl = null;
  let pointerEl = null;
  let hubBtnEl = null;
  let hubLabelEl = null;
  let statusLineEl = null;
  let bonusAdBtnEl = null;
  let rewardPopupEl = null;
  let currentRotationDeg = 0;
  let isSpinning = false;
  let spinTimer = null;

  function core() {
    return window.CMRCore;
  }

  function isEnglish() {
    return window.CMRI18n?.getLanguage?.() === "en";
  }

  function getTodayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function readWheelState() {
    const today = getTodayKey();
    try {
      const raw = JSON.parse(localStorage.getItem(WHEEL_STORAGE_KEY) || "{}");
      if (raw.date !== today) {
        return {
          date: today,
          freeSpinsUsed: 0,
          bonusSpins: Math.max(0, Math.floor(Number(raw.bonusSpins) || 0)),
          totalSpins: Math.max(0, Math.floor(Number(raw.totalSpins) || 0)),
          lastPrizeId: raw.lastPrizeId || null,
        };
      }
      return {
        date: today,
        freeSpinsUsed: Math.max(0, Math.min(1, Math.floor(Number(raw.freeSpinsUsed) || 0))),
        bonusSpins: Math.max(0, Math.floor(Number(raw.bonusSpins) || 0)),
        totalSpins: Math.max(0, Math.floor(Number(raw.totalSpins) || 0)),
        lastPrizeId: raw.lastPrizeId || null,
      };
    } catch (_) {
      return {
        date: today,
        freeSpinsUsed: 0,
        bonusSpins: 0,
        totalSpins: 0,
        lastPrizeId: null,
      };
    }
  }

  function writeWheelState(st) {
    try {
      localStorage.setItem(WHEEL_STORAGE_KEY, JSON.stringify(st));
    } catch (_) {}
  }

  function getAvailableSpins(st = readWheelState()) {
    const freeLeft = Math.max(0, 1 - st.freeSpinsUsed);
    return freeLeft + Math.max(0, st.bonusSpins);
  }

  function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t.__lwToastTimer);
    t.__lwToastTimer = setTimeout(() => t.classList.remove("show"), 2500);
  }

  function syncWorldMapBadge() {
    const badge = document.getElementById("wmWheelBadge");
    if (!badge) return;
    const avail = getAvailableSpins();
    if (avail > 0) {
      badge.textContent = `${avail}/1`;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  function ensureModal() {
    if (modalEl) return modalEl;
    const C = core();
    const assets = C.LUCKY_WHEEL_ASSETS;
    const slices = C.LUCKY_WHEEL_SLICES;

    // Position 8 prize nodes radially inside the 8 equal 45-degree wedges (radius ~29.6% of wheel diameter)
    const RADIUS_PCT = 29.6;
    const slicesMarkup = slices
      .map((s) => {
        const rad = (s.angleDeg * Math.PI) / 180;
        const leftPct = (50 + RADIUS_PCT * Math.sin(rad)).toFixed(2);
        const topPct = (50 - RADIUS_PCT * Math.cos(rad)).toFixed(2);
        const isNumericBadge = /^[+×\d]/.test(s.labelAr);
        return `
          <div
            class="lw-slice-prize"
            data-slice-index="${s.index}"
            style="left:${leftPct}%;top:${topPct}%;transform:translate(-50%,-50%) rotate(${s.angleDeg}deg);"
          >
            <img src="${s.icon}" alt="${s.titleAr}" draggable="false">
            <span class="lw-slice-qty"${isNumericBadge ? ' dir="ltr"' : ""}>${s.labelAr}</span>
          </div>
        `;
      })
      .join("");

    modalEl = document.createElement("div");
    modalEl.id = "luckyWheelModal";
    modalEl.className = "modal cmr-royal-modal lw-modal hidden";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "lwModalTitle");

    modalEl.innerHTML = `
      <div class="lw-panel" dir="rtl">
        <button type="button" class="lw-close-btn" id="lwCloseBtn" aria-label="إغلاق عجلة الحظ">✕</button>

        <header class="lw-header">
          <div class="lw-title-ribbon">
            <h2 id="lwModalTitle">عجلة الحظ اليومية</h2>
          </div>
          <p class="lw-subtitle" id="lwSubtitle">لف العجلة يومياً واربح عملات ومعززات وكنوز ملكية!</p>
        </header>

        <div class="lw-wheel-stage" id="lwWheelStage">
          <div class="lw-wheel-glow" aria-hidden="true"></div>

          <!-- Rotating 8-slice disc + aligned radial transparent reward icons -->
          <div class="lw-disc-rotor" id="lwDiscRotor">
            <img class="lw-disc-img" src="${assets.disc}" alt="" draggable="false">
            <div class="lw-slices-layer" aria-hidden="true">
              ${slicesMarkup}
            </div>
          </div>

          <!-- Fixed 12 o'clock Pointer -->
          <img
            class="lw-pointer"
            id="lwPointer"
            src="${assets.pointer}"
            alt=""
            aria-hidden="true"
            draggable="false"
          >

          <!-- Fixed Upright Center Golden Spin Button -->
          <button
            type="button"
            class="lw-hub-btn"
            id="lwSpinBtn"
            aria-label="لف العجلة"
          >
            <img class="lw-hub-bg" src="${assets.hub}" alt="" aria-hidden="true" draggable="false">
            <span class="lw-hub-label" id="lwHubLabel">لف العجلة 1/1</span>
          </button>
        </div>

        <footer class="lw-footer">
          <div class="lw-status-pill" id="lwStatusLine">لديك لفة مجانية جاهزة اليوم!</div>
          <div class="lw-footer-actions">
            <button type="button" class="lw-primary-cta" id="lwSpinCtaBtn">
              <span id="lwSpinCtaText">لف العجلة 1/1</span>
            </button>
            <button type="button" class="lw-bonus-ad-btn hidden" id="lwBonusAdBtn" data-ad-button="true">
              <span>🎬 لفّة إضافية</span>
            </button>
          </div>
        </footer>

        <!-- Celebration Prize Popup Overlay -->
        <div class="lw-reward-popup hidden" id="lwRewardPopup" role="status" aria-live="polite">
          <div class="lw-reward-card">
            <div class="lw-reward-sparkles" aria-hidden="true">✨ ⭐ ✨</div>
            <h3 id="lwRewardHeading">مبروك! ربحت الجائزة!</h3>
            <div class="lw-reward-icon-wrap">
              <img id="lwRewardIcon" src="${C.SHOP_ICONS.chest}" alt="">
            </div>
            <strong class="lw-reward-title" id="lwRewardTitle">صندوق الكنز الملكي</strong>
            <p class="lw-reward-summary" id="lwRewardSummary">+500 عملة ذهبية</p>
            <button type="button" class="lw-claim-ok-btn" id="lwRewardOkBtn">رائع! استلام</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    rotorEl = modalEl.querySelector("#lwDiscRotor");
    pointerEl = modalEl.querySelector("#lwPointer");
    hubBtnEl = modalEl.querySelector("#lwSpinBtn");
    hubLabelEl = modalEl.querySelector("#lwHubLabel");
    statusLineEl = modalEl.querySelector("#lwStatusLine");
    bonusAdBtnEl = modalEl.querySelector("#lwBonusAdBtn");
    rewardPopupEl = modalEl.querySelector("#lwRewardPopup");

    modalEl.querySelector("#lwCloseBtn").addEventListener("click", close);
    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl && !isSpinning) close();
    });

    hubBtnEl.addEventListener("click", () => spin());
    modalEl.querySelector("#lwSpinCtaBtn").addEventListener("click", () => spin());

    modalEl.querySelector("#lwRewardOkBtn").addEventListener("click", () => {
      rewardPopupEl.classList.add("hidden");
      window.CMRAudio?.playSfx?.("swap");
    });

    bonusAdBtnEl.addEventListener("click", async () => {
      if (isSpinning) return;
      const grantBonusSpin = () => {
        const st = readWheelState();
        st.bonusSpins += 1;
        writeWheelState(st);
        syncWheelUI();
        showToast(isEnglish() ? "Bonus spin unlocked! Spin now!" : "تمت إضافة لفّة إضافية! لف العجلة الآن!");
      };
      if (window.CMRAdMob && typeof window.CMRAdMob.showRewardedAd === "function") {
        bonusAdBtnEl.disabled = true;
        const res = await window.CMRAdMob.showRewardedAd("lucky_wheel_spin", grantBonusSpin);
        bonusAdBtnEl.disabled = false;
        if (!res.ok || !res.rewarded) {
          if (res.status === "skipped") {
            showToast(isEnglish() ? "Ad closed early — no spin granted." : "تم إغلاق الإعلان مبكراً — لم تُمنح لفّة إضافية.");
          } else if (res.status === "offline") {
            showToast(isEnglish() ? "You are offline. Connect to watch ads." : "لا يوجد اتصال بالإنترنت لعرض الإعلان.");
          }
        }
      } else if (window.CMRAdManager && typeof window.CMRAdManager.openRewardedAdModal === "function") {
        window.CMRAdManager.openRewardedAdModal("lucky_wheel_spin", grantBonusSpin);
      } else {
        showToast(isEnglish() ? "Rewarded ads are not configured yet." : "شبكة الإعلانات المكافأة غير مفعلة حالياً.");
      }
    });

    return modalEl;
  }

  function syncWheelUI() {
    ensureModal();
    const en = isEnglish();
    const st = readWheelState();
    const avail = getAvailableSpins(st);
    const displayCount = avail > 0 ? `${Math.min(avail, 9)}/1` : "0/1";
    const spinText = en ? `SPIN ${displayCount}` : `لف العجلة ${displayCount}`;

    const titleEl = modalEl.querySelector("#lwModalTitle");
    const subEl = modalEl.querySelector("#lwSubtitle");
    const ctaBtn = modalEl.querySelector("#lwSpinCtaBtn");
    const ctaText = modalEl.querySelector("#lwSpinCtaText");

    if (titleEl) titleEl.textContent = en ? "Daily Lucky Wheel" : "عجلة الحظ اليومية";
    if (subEl) {
      subEl.textContent = en
        ? "Spin once daily to win coins, boosters & royal chests!"
        : "لف العجلة يومياً واربح عملات ومعززات وكنوز ملكية!";
    }
    if (hubLabelEl) hubLabelEl.textContent = spinText;
    if (ctaText) ctaText.textContent = spinText;

    hubBtnEl.classList.toggle("is-depleted", avail <= 0);
    hubBtnEl.classList.toggle("is-spinning", isSpinning);
    if (ctaBtn) {
      ctaBtn.disabled = isSpinning || avail <= 0;
      ctaBtn.classList.toggle("hidden", avail <= 0);
    }

    if (statusLineEl) {
      if (isSpinning) {
        statusLineEl.textContent = en ? "Good luck! Spinning..." : "حظاً سعيداً! العجلة تدور...";
      } else if (avail > 0) {
        statusLineEl.textContent = en
          ? "Your free daily spin is ready!"
          : "لفتك المجانية اليومية جاهزة الآن!";
      } else {
        statusLineEl.textContent = en
          ? "Daily spin used — next free spin tomorrow!"
          : "استخدمت لفتك المجانية اليوم — اللفة التالية غداً!";
      }
    }

    if (bonusAdBtnEl) {
      bonusAdBtnEl.classList.toggle("hidden", avail > 0 || isSpinning);
      bonusAdBtnEl.querySelector("span").textContent = en
        ? "🎬 Extra Spin"
        : "🎬 لفّة إضافية";
    }

    window.CMRAdMob?.syncOfflineAdButtons?.();
    syncWorldMapBadge();
  }

  function showPrizePopup(slice) {
    ensureModal();
    const en = isEnglish();
    const C = core();
    const headingEl = modalEl.querySelector("#lwRewardHeading");
    const iconEl = modalEl.querySelector("#lwRewardIcon");
    const titleEl = modalEl.querySelector("#lwRewardTitle");
    const summaryEl = modalEl.querySelector("#lwRewardSummary");
    const okBtn = modalEl.querySelector("#lwRewardOkBtn");

    if (headingEl) headingEl.textContent = en ? "Congratulations! You Won!" : "مبروك! ربحت الجائزة!";
    if (iconEl) iconEl.src = slice.icon;
    if (titleEl) titleEl.textContent = en ? slice.titleEn : slice.titleAr;
    if (summaryEl) summaryEl.textContent = C.formatRewardSummaryArabic(slice.reward);
    if (okBtn) okBtn.textContent = en ? "Awesome! Claim" : "رائع! استلام";

    rewardPopupEl.classList.remove("hidden");
  }

  function spin(options = {}) {
    ensureModal();
    if (isSpinning) return Promise.resolve({ ok: false, reason: "already_spinning" });

    const st = readWheelState();
    const avail = getAvailableSpins(st);
    if (avail <= 0) {
      showToast(
        isEnglish()
          ? "Free spin already used today. Come back tomorrow!"
          : "استخدمت لفتك المجانية اليوم! عد غداً أو شاهد إعلاناً للفة إضافية."
      );
      return Promise.resolve({ ok: false, reason: "no_spins_left" });
    }

    // Consume spin immediately & persist so refreshing cannot exploit duplicate spins
    if (st.freeSpinsUsed < 1) {
      st.freeSpinsUsed = 1;
    } else if (st.bonusSpins > 0) {
      st.bonusSpins -= 1;
    }
    st.totalSpins += 1;
    writeWheelState(st);

    const C = core();
    const targetIndex =
      typeof options.forceSliceIndex === "number"
        ? ((Math.floor(options.forceSliceIndex) % C.LUCKY_WHEEL_SLICES.length) + C.LUCKY_WHEEL_SLICES.length) %
          C.LUCKY_WHEEL_SLICES.length
        : C.pickWeightedWheelSliceIndex();
    const jitter = typeof options.jitterDeg === "number" ? options.jitterDeg : (Math.random() - 0.5) * 16;
    const durationMs = typeof options.durationMs === "number" ? Math.max(300, options.durationMs) : 4400;
    const nextDeg = C.computeWheelSpinTarget(currentRotationDeg, targetIndex, 5, jitter);

    isSpinning = true;
    rewardPopupEl.classList.add("hidden");
    syncWheelUI();
    window.CMRProfile?.vibrate?.(18);
    window.CMRAudio?.playSfx?.("swap");

    // Apply smooth GPU-accelerated rotation with cubic-bezier ease-out
    rotorEl.style.transition = `transform ${durationMs}ms cubic-bezier(0.12, 0.85, 0.18, 1)`;
    // Force reflow so transition always triggers cleanly
    void rotorEl.offsetWidth;
    currentRotationDeg = nextDeg;
    rotorEl.style.transform = `rotate(${currentRotationDeg.toFixed(2)}deg)`;

    // Subtle pointer tick animation during spin
    pointerEl.classList.add("is-ticking");

    return new Promise((resolve) => {
      clearTimeout(spinTimer);
      spinTimer = setTimeout(() => {
        isSpinning = false;
        pointerEl.classList.remove("is-ticking");

        const landed = C.resolveWheelSliceFromAngle(currentRotationDeg);
        const prizeSlice = landed.slice;

        const latestSt = readWheelState();
        latestSt.lastPrizeId = prizeSlice.id;
        writeWheelState(latestSt);

        // Grant reward atomically into game inventory + localStorage + HUD + World Map
        if (window.CMRGame && typeof window.CMRGame.grantReward === "function") {
          window.CMRGame.grantReward(prizeSlice.reward);
        }

        window.CMRAudio?.playSfx?.("win");
        window.CMRProfile?.vibrate?.([22, 40, 28]);
        syncWheelUI();
        showPrizePopup(prizeSlice);

        resolve({
          ok: true,
          index: landed.index,
          slice: prizeSlice,
          rotationDeg: currentRotationDeg,
        });
      }, durationMs + 80);
    });
  }

  function open() {
    ensureModal();
    rewardPopupEl.classList.add("hidden");
    syncWheelUI();
    modalEl.classList.remove("hidden");
    window.CMRProfile?.vibrate?.(12);
    window.CMRAudio?.playSfx?.("swap");
  }

  function close() {
    if (isSpinning) return;
    if (modalEl) modalEl.classList.add("hidden");
    if (rewardPopupEl) rewardPopupEl.classList.add("hidden");
  }

  window.CMRLuckyWheel = {
    open,
    close,
    spin,
    syncBadge: syncWorldMapBadge,
    getState: () => {
      const st = readWheelState();
      return {
        ...st,
        availableSpins: getAvailableSpins(st),
        isSpinning,
        currentRotationDeg,
        isOpen: Boolean(modalEl && !modalEl.classList.contains("hidden")),
      };
    },
  };

  window.addEventListener("cmr:language-changed", () => {
    if (modalEl) syncWheelUI();
  });

  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(syncWorldMapBadge, 200);
  });
})();
