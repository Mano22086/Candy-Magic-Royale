/* Candy Magic Royale — Legitimate Rewarded Advertisement Manager
 * Integrates authorized ad networks (Google H5 Games AdSense adBreak or Android AdMob WebView bridge)
 * via CMRCore.createRewardedAdEngine().
 * STRICT POLICY: Never fakes or simulates watching an ad and never grants unearned rewards
 * when an ad provider/credentials are not configured or when an ad is skipped/fails.
 */
(() => {
  "use strict";
  if (window.__CMR_AD_MANAGER_V1__) return;
  window.__CMR_AD_MANAGER_V1__ = true;

  const AD_STORAGE_KEY = "cmr_rewarded_ad_quota_v1";
  const Core = window.CMRCore;
  if (!Core) {
    console.error("[CMR Ads] game-core.js must be loaded before ad-manager.js");
    return;
  }

  function loadPersistedQuota() {
    try {
      return JSON.parse(localStorage.getItem(AD_STORAGE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function savePersistedQuota(snapshot) {
    try {
      localStorage.setItem(AD_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (_) {}
  }

  const engine = Core.createRewardedAdEngine(loadPersistedQuota());

  // Auto-detect real authorized ad bridges if present on the runtime page
  function detectAuthorizedProvider() {
    // 1. Native Android WebView AdMob Bridge (if packaged as Android APK/TWA with AdMob SDK)
    if (
      window.AndroidAdBridge &&
      typeof window.AndroidAdBridge.showRewardedAd === "function"
    ) {
      engine.registerProvider({
        name: "Google AdMob (Android Bridge)",
        showRewardedAd(placementId, { onComplete, onSkip, onError }) {
          window.__CMR_ON_AD_RESULT__ = (status) => {
            delete window.__CMR_ON_AD_RESULT__;
            if (status === "completed") onComplete();
            else if (status === "skipped") onSkip();
            else onError(status || "admob_error");
          };
          try {
            window.AndroidAdBridge.showRewardedAd(placementId);
          } catch (err) {
            delete window.__CMR_ON_AD_RESULT__;
            onError(err);
          }
        },
      });
      return;
    }

    // 2. Google AdSense H5 Games Ads SDK (adBreak)
    if (typeof window.adBreak === "function") {
      engine.registerProvider({
        name: "Google H5 Games Ads",
        showRewardedAd(placementId, { onComplete, onSkip, onError }) {
          try {
            window.adBreak({
              type: "reward",
              name: placementId,
              beforeReward(showAdFn) {
                showAdFn();
              },
              adDismissed() {
                onSkip();
              },
              adViewed() {
                onComplete();
              },
              adBreakDone(info) {
                if (
                  info &&
                  info.breakStatus !== "viewed" &&
                  info.breakStatus !== "dismissed"
                ) {
                  onError(info.breakStatus || "h5_ad_unavailable");
                }
              },
            });
          } catch (err) {
            onError(err);
          }
        },
      });
    }
  }

  detectAuthorizedProvider();

  let activeRewardCallback = null;
  let activePlacementId = null;

  function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = String(msg || "");
    t.classList.add("show");
    clearTimeout(t.__adTimer);
    t.__adTimer = setTimeout(() => t.classList.remove("show"), 3200);
  }

  function closeAdModal() {
    const modal = document.getElementById("rewardedAdModal");
    if (modal) modal.classList.add("hidden");
    activeRewardCallback = null;
    activePlacementId = null;
  }

  function openRewardedAdModal(placementId, onRewardGranted) {
    detectAuthorizedProvider();
    const quota = engine.getQuota(placementId);
    if (!quota) {
      showToast("هذا العرض الإعلاني غير متوفر.");
      return;
    }

    const modal = document.getElementById("rewardedAdModal");
    const titleEl = document.getElementById("adModalTitle");
    const descEl = document.getElementById("adModalDescription");
    const rewardEl = document.getElementById("adModalRewardBadge");
    const quotaEl = document.getElementById("adModalQuota");
    const statusBox = document.getElementById("adModalStatusBox");
    const watchBtn = document.getElementById("adWatchConfirmBtn");

    if (!modal || !watchBtn) {
      showToast("تعذر فتح نافذة الإعلانات المكافأة.");
      return;
    }

    activePlacementId = placementId;
    activeRewardCallback = typeof onRewardGranted === "function" ? onRewardGranted : null;

    const providerInfo = engine.getProviderInfo();
    const placement = quota.placement;

    if (titleEl) titleEl.textContent = placement.title;
    if (descEl) descEl.textContent = placement.description;
    if (rewardEl) {
      rewardEl.textContent = `المكافأة: ${Core.formatRewardSummaryArabic(placement.reward)}`;
    }
    if (quotaEl) {
      quotaEl.textContent = `المتبقي اليوم لهذا العرض: ${quota.remainingToday} / ${quota.dailyLimit} · الإجمالي اليومي: ${quota.totalToday} / ${quota.totalLimit}`;
    }

    if (statusBox) {
      if (!providerInfo.configured) {
        statusBox.className = "ad-status-box is-unconfigured";
        statusBox.innerHTML =
          "<strong>شبكة الإعلانات غير مفعّلة بعد:</strong> " +
          providerInfo.requiredSetup +
          "<br><small>المكافأة تُمنح فقط بعد إتمام مشاهدة إعلان حقيقي دون تخطي.</small>";
      } else if (quota.remainingToday <= 0) {
        statusBox.className = "ad-status-box is-limit";
        statusBox.textContent = "لقد وصلت إلى الحد اليومي المسموح لهذا الإعلان. عد غداً!";
      } else {
        statusBox.className = "ad-status-box is-ready";
        statusBox.textContent = `جاهز عبر ${providerInfo.providerName} — يجب إكمال الإعلان حتى النهاية لاستلام المكافأة.`;
      }
    }

    watchBtn.disabled = !providerInfo.configured || quota.remainingToday <= 0;
    watchBtn.textContent = !providerInfo.configured
      ? "بانتظار ربط شبكة الإعلانات"
      : quota.remainingToday <= 0
      ? "اكتمل الحد اليومي"
      : "مشاهدة الإعلان واستلام المكافأة";

    modal.classList.remove("hidden");
  }

  async function executeCurrentAd() {
    if (!activePlacementId) return;
    const watchBtn = document.getElementById("adWatchConfirmBtn");
    if (watchBtn) watchBtn.disabled = true;

    const placementId = activePlacementId;
    const callback = activeRewardCallback;

    const result = await engine.requestAd(placementId);
    savePersistedQuota(engine.exportState());

    if (result.ok && result.granted) {
      closeAdModal();
      if (typeof callback === "function") {
        callback(result.reward, result);
      }
      showToast(result.message);
    } else {
      showToast(result.message);
      if (watchBtn) {
        const providerInfo = engine.getProviderInfo();
        const quota = engine.getQuota(placementId);
        watchBtn.disabled = !providerInfo.configured || !quota || quota.remainingToday <= 0;
      }
    }
  }

  function bindAdModal() {
    const closeBtn = document.getElementById("adModalCloseBtn");
    const cancelBtn = document.getElementById("adModalCancelBtn");
    const watchBtn = document.getElementById("adWatchConfirmBtn");
    const modal = document.getElementById("rewardedAdModal");

    if (closeBtn) closeBtn.addEventListener("click", closeAdModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeAdModal);
    if (watchBtn) watchBtn.addEventListener("click", () => void executeCurrentAd());
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeAdModal();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindAdModal, { once: true });
  } else {
    bindAdModal();
  }

  window.CMRAdManager = {
    openRewardedAdModal,
    closeAdModal,
    getProviderInfo: () => {
      detectAuthorizedProvider();
      return engine.getProviderInfo();
    },
    getQuota: (placementId) => engine.getQuota(placementId),
    getPlacements: () => Core.REWARDED_AD_PLACEMENTS,
    registerProvider: (adapter) => engine.registerProvider(adapter),
    clearProvider: () => engine.clearProvider(),
    requestAdDirect: async (placementId) => {
      const res = await engine.requestAd(placementId);
      savePersistedQuota(engine.exportState());
      return res;
    },
  };
})();
