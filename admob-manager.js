/* Candy Magic Royale — Centralized Google AdMob Manager (@capacitor-community/admob)
 * Supports native Android Capacitor runtime AND safe browser Test Mode simulation.
 * Grants rewarded ad items ONLY after RewardAdPluginEvents.Rewarded confirms completion.
 * Pauses game BGM/SFX during any ad and resumes cleanly on close/error.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.CMRAdMob = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  // =========================================================================
  // CENTRAL ADMOB CONFIGURATION
  // Flip IS_TEST_MODE to false right before final Google Play production build
  // =========================================================================
  const ADMOB_CONFIG = Object.freeze({
    IS_TEST_MODE: true,
    APP_ID: "ca-app-pub-7895931535988996~2281008271",
    LIVE_IDS: Object.freeze({
      REWARDED: "ca-app-pub-7895931535988996/4427951627",
      INTERSTITIAL: "ca-app-pub-7895931535988996/7728455278",
    }),
    TEST_IDS: Object.freeze({
      REWARDED: "ca-app-pub-3940256099942544/5224354917",
      INTERSTITIAL: "ca-app-pub-3940256099942544/1033173712",
    }),
    INTERSTITIAL_MIN_LEVEL: 6, // Start showing interstitials AFTER Level 5
    INTERSTITIAL_EVERY_N_STAGES: 3, // Show 1 interstitial every 3 completed stages
    WEB_TEST_AD_SECONDS: 3,
  });

  // Official @capacitor-community/admob event names
  const REWARD_EVENTS = Object.freeze({
    Loaded: "onRewardedVideoAdLoaded",
    FailedToLoad: "onRewardedVideoAdFailedToLoad",
    Showed: "onRewardedVideoAdShowed",
    FailedToShow: "onRewardedVideoAdFailedToShow",
    Dismissed: "onRewardedVideoAdDismissed",
    Rewarded: "onRewardedVideoAdReward",
  });

  const INTERSTITIAL_EVENTS = Object.freeze({
    Loaded: "interstitialAdLoaded",
    FailedToLoad: "interstitialAdFailedToLoad",
    Showed: "interstitialAdShowed",
    FailedToShow: "interstitialAdFailedToShow",
    Dismissed: "interstitialAdDismissed",
  });

  const STORAGE_KEY = "cmr_admob_state_v1";

  // =========================================================================
  // PURE HELPERS (Unit-Tested in game-core.test.js)
  // =========================================================================
  function getActiveAdUnitIds(config = ADMOB_CONFIG) {
    const cfg = config || ADMOB_CONFIG;
    return cfg.IS_TEST_MODE ? { ...cfg.TEST_IDS } : { ...cfg.LIVE_IDS };
  }

  function shouldShowInterstitial(params = {}) {
    const cfg = params.config || ADMOB_CONFIG;
    const minLevel = Number.isFinite(Number(cfg.INTERSTITIAL_MIN_LEVEL))
      ? Number(cfg.INTERSTITIAL_MIN_LEVEL)
      : 6;
    const interval = Math.max(1, Math.floor(Number(cfg.INTERSTITIAL_EVERY_N_STAGES) || 3));
    const completedLevel = Math.max(1, Math.floor(Number(params.completedLevel) || 1));
    const currentCounter = Math.max(0, Math.floor(Number(params.completedSinceLastAd) || 0));

    if (params.hasNoAds) {
      return { show: false, reason: "vip_no_ads", nextCounter: currentCounter };
    }
    if (params.isOnline === false) {
      return { show: false, reason: "offline", nextCounter: currentCounter };
    }
    if (completedLevel < minLevel) {
      return { show: false, reason: "below_min_level", nextCounter: currentCounter };
    }

    const incremented = currentCounter + 1;
    if (incremented >= interval) {
      return { show: true, reason: "interval_reached", nextCounter: 0 };
    }
    return { show: false, reason: "counting", nextCounter: incremented };
  }

  // =========================================================================
  // RUNTIME STATE & PERSISTENCE (VIP/No-Ads + Interstitial Counter)
  // =========================================================================
  const hasDOM = typeof document !== "undefined" && typeof window !== "undefined";

  function readPersistedState() {
    if (!hasDOM) return { completedSinceLastAd: 0, noAds: false, vip: false };
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        completedSinceLastAd: Math.max(0, Math.floor(Number(raw.completedSinceLastAd) || 0)),
        noAds: Boolean(raw.noAds),
        vip: Boolean(raw.vip),
      };
    } catch (_) {
      return { completedSinceLastAd: 0, noAds: false, vip: false };
    }
  }

  function writePersistedState(st) {
    if (!hasDOM) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
    } catch (_) {}
  }

  let runtimeState = readPersistedState();
  let initialized = false;
  let nativeRewardedReady = false;
  let nativeInterstitialReady = false;
  let adInFlight = false;
  let testOverlayEl = null;

  function isOnline() {
    if (typeof navigator === "undefined") return true;
    return navigator.onLine !== false;
  }

  function isNativeCapacitor() {
    return Boolean(
      hasDOM &&
        window.Capacitor &&
        typeof window.Capacitor.isNativePlatform === "function" &&
        window.Capacitor.isNativePlatform()
    );
  }

  function getCapacitorAdMobPlugin() {
    if (!isNativeCapacitor()) return null;
    return (
      window.Capacitor?.Plugins?.AdMob ||
      window.AdMob ||
      null
    );
  }

  function hasNoAds() {
    runtimeState = readPersistedState();
    return Boolean(runtimeState.noAds || runtimeState.vip);
  }

  function setNoAds(enabled) {
    runtimeState = readPersistedState();
    runtimeState.noAds = Boolean(enabled);
    runtimeState.vip = Boolean(enabled);
    writePersistedState(runtimeState);
    return hasNoAds();
  }

  function pauseGameAudio() {
    if (!hasDOM) return;
    try {
      window.CMRAudio?.pauseForAd?.();
    } catch (_) {}
  }

  function resumeGameAudio() {
    if (!hasDOM) return;
    try {
      window.CMRAudio?.resumeAfterAd?.();
    } catch (_) {}
  }

  function syncOfflineAdButtons() {
    if (!hasDOM || !document.body) return;
    const offline = !isOnline();
    document.body.classList.toggle("cmr-offline", offline);
    document.querySelectorAll("[data-ad-button='true']").forEach((el) => {
      if (offline) {
        el.setAttribute("data-ad-offline-hidden", "1");
        el.setAttribute("aria-hidden", "true");
      } else {
        el.removeAttribute("data-ad-offline-hidden");
        el.removeAttribute("aria-hidden");
      }
    });
  }

  // =========================================================================
  // NATIVE CAPACITOR ADMOB PRELOAD & LIFECYCLE
  // =========================================================================
  async function preloadNativeRewarded() {
    const plugin = getCapacitorAdMobPlugin();
    if (!plugin || !isOnline()) return false;
    const ids = getActiveAdUnitIds();
    try {
      await plugin.prepareRewardVideoAd({
        adId: ids.REWARDED,
        isTesting: ADMOB_CONFIG.IS_TEST_MODE,
      });
      nativeRewardedReady = true;
      return true;
    } catch (err) {
      nativeRewardedReady = false;
      console.warn("[CMR AdMob] Rewarded preload unavailable:", err?.message || err);
      return false;
    }
  }

  async function preloadNativeInterstitial() {
    const plugin = getCapacitorAdMobPlugin();
    if (!plugin || !isOnline() || hasNoAds()) return false;
    const ids = getActiveAdUnitIds();
    try {
      await plugin.prepareInterstitial({
        adId: ids.INTERSTITIAL,
        isTesting: ADMOB_CONFIG.IS_TEST_MODE,
      });
      nativeInterstitialReady = true;
      return true;
    } catch (err) {
      nativeInterstitialReady = false;
      console.warn("[CMR AdMob] Interstitial preload unavailable:", err?.message || err);
      return false;
    }
  }

  async function initialize() {
    if (initialized) return true;
    initialized = true;
    syncOfflineAdButtons();

    if (!isNativeCapacitor()) {
      return true;
    }

    const plugin = getCapacitorAdMobPlugin();
    if (!plugin) {
      console.warn("[CMR AdMob] Native Capacitor detected, waiting for AdMob plugin.");
      return false;
    }

    try {
      await plugin.initialize({
        initializeForTesting: ADMOB_CONFIG.IS_TEST_MODE,
      });
      await Promise.allSettled([preloadNativeRewarded(), preloadNativeInterstitial()]);
      return true;
    } catch (err) {
      console.warn("[CMR AdMob] Initialization failed gracefully:", err?.message || err);
      return false;
    }
  }

  // =========================================================================
  // NON-BLOCKING 3-SECOND WEB TEST AD MODAL (Only when IS_TEST_MODE === true)
  // =========================================================================
  function ensureTestAdOverlay() {
    if (!hasDOM) return null;
    if (testOverlayEl) return testOverlayEl;
    testOverlayEl = document.createElement("div");
    testOverlayEl.id = "cmrTestAdOverlay";
    testOverlayEl.className = "modal cmr-test-ad-modal hidden";
    testOverlayEl.setAttribute("role", "dialog");
    testOverlayEl.setAttribute("aria-modal", "true");
    testOverlayEl.setAttribute("aria-labelledby", "cmrTestAdTitle");
    testOverlayEl.innerHTML = `
      <div class="cmr-test-ad-card" dir="rtl">
        <div class="cmr-test-ad-badge" id="cmrTestAdBadge">Google AdMob · وضع الاختبار (Test Mode)</div>
        <h3 id="cmrTestAdTitle">إعلان مكافأ تجريبي</h3>
        <p class="cmr-test-ad-desc" id="cmrTestAdDesc">جاري عرض إعلان تجريبي للتحقق من المكافأة...</p>
        <div class="cmr-test-ad-ring" aria-live="polite">
          <span id="cmrTestAdCountdown">3</span>
          <small>ثوانٍ</small>
        </div>
        <div class="cmr-test-ad-unit" id="cmrTestAdUnit" dir="ltr"></div>
        <div class="cmr-test-ad-actions">
          <button type="button" class="cmr-test-ad-skip-btn" id="cmrTestAdSkipBtn">إغلاق مبكر (بدون مكافأة)</button>
        </div>
      </div>
    `;
    document.body.appendChild(testOverlayEl);
    return testOverlayEl;
  }

  function runWebSimulatedTestAd({ adType, placementLabel, unitId, durationSec = ADMOB_CONFIG.WEB_TEST_AD_SECONDS }) {
    return new Promise((resolve) => {
      const overlay = ensureTestAdOverlay();
      if (!overlay) {
        resolve({ ok: false, rewarded: false, status: "no_dom" });
        return;
      }

      const isRewarded = adType === "rewarded";
      const titleEl = overlay.querySelector("#cmrTestAdTitle");
      const descEl = overlay.querySelector("#cmrTestAdDesc");
      const countEl = overlay.querySelector("#cmrTestAdCountdown");
      const unitEl = overlay.querySelector("#cmrTestAdUnit");
      const skipBtn = overlay.querySelector("#cmrTestAdSkipBtn");

      if (titleEl) {
        titleEl.textContent = isRewarded
          ? `إعلان مكافأ تجريبي — ${placementLabel || "مكافأة"}`
          : "إعلان بيني تجريبي (Interstitial)";
      }
      if (descEl) {
        descEl.textContent = isRewarded
          ? "شاهد الإعلان التجريبي حتى نهاية العد التنازلي لتأكيد المكافأة."
          : "استراحة قصيرة بين المراحل — يعود اللعب تلقائياً خلال ثوانٍ.";
      }
      if (unitEl) unitEl.textContent = `Test Unit: ${unitId}`;
      if (skipBtn) {
        skipBtn.textContent = isRewarded ? "إغلاق مبكر (بدون مكافأة)" : "تخطي الإعلان";
      }

      let remaining = Math.max(1, Math.round(Number(durationSec) || 3));
      if (countEl) countEl.textContent = String(remaining);

      let settled = false;
      let timerId = null;

      const finish = (result) => {
        if (settled) return;
        settled = true;
        clearInterval(timerId);
        if (skipBtn) skipBtn.onclick = null;
        overlay.classList.add("hidden");
        resolve(result);
      };

      if (skipBtn) {
        skipBtn.onclick = () => {
          finish({
            ok: !isRewarded,
            rewarded: false,
            status: isRewarded ? "skipped" : "dismissed",
            simulated: true,
          });
        };
      }

      overlay.classList.remove("hidden");

      timerId = setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          if (countEl) countEl.textContent = String(remaining);
          return;
        }
        if (countEl) countEl.textContent = "0";
        finish({
          ok: true,
          rewarded: isRewarded,
          status: "completed",
          simulated: true,
        });
      }, 1000);
    });
  }

  // =========================================================================
  // PUBLIC API: SHOW REWARDED AD (Grants ONLY on Rewarded confirmation)
  // =========================================================================
  const PLACEMENT_LABELS = Object.freeze({
    extra_moves: "+5 حركات إضافية",
    double_win_coins: "مضاعفة عملات الفوز ×2",
    extra_heart: "قلب مجاني",
    lucky_wheel_spin: "لفّة إضافية لعجلة الحظ",
    free_coins: "عملات مجانية",
    free_booster: "معزز مجاني",
    reward_chest: "صندوق الهدايا",
    secret_vault_key: "+1 مفتاح مجاني (غرفة الكنز)",
  });

  async function showRewardedAd(placementId = "rewarded", onRewarded, options = {}) {
    if (adInFlight) {
      return { ok: false, rewarded: false, status: "busy" };
    }
    if (!isOnline()) {
      syncOfflineAdButtons();
      return { ok: false, rewarded: false, status: "offline" };
    }

    await initialize();
    adInFlight = true;
    pauseGameAudio();

    const ids = getActiveAdUnitIds();

    try {
      let result;

      if (isNativeCapacitor()) {
        const plugin = getCapacitorAdMobPlugin();
        if (!plugin) {
          result = { ok: false, rewarded: false, status: "plugin_missing" };
        } else {
          if (!nativeRewardedReady) {
            await preloadNativeRewarded();
          }
          result = await new Promise((resolve) => {
            let rewardedConfirmed = false;
            let settled = false;
            const handles = [];

            const cleanupAndResolve = (res) => {
              if (settled) return;
              settled = true;
              handles.forEach((h) => {
                try {
                  if (h && typeof h.remove === "function") h.remove();
                } catch (_) {}
              });
              nativeRewardedReady = false;
              setTimeout(() => void preloadNativeRewarded(), 400);
              resolve(res);
            };

            const attach = async () => {
              try {
                if (typeof plugin.addListener === "function") {
                  handles.push(
                    await plugin.addListener(REWARD_EVENTS.Rewarded, () => {
                      rewardedConfirmed = true;
                    })
                  );
                  handles.push(
                    await plugin.addListener(REWARD_EVENTS.Dismissed, () => {
                      cleanupAndResolve({
                        ok: rewardedConfirmed,
                        rewarded: rewardedConfirmed,
                        status: rewardedConfirmed ? "completed" : "skipped",
                      });
                    })
                  );
                  handles.push(
                    await plugin.addListener(REWARD_EVENTS.FailedToShow, (err) => {
                      cleanupAndResolve({
                        ok: false,
                        rewarded: false,
                        status: "failed",
                        error: err ? String(err.message || err) : "failed_to_show",
                      });
                    })
                  );
                }

                // showRewardVideoAd resolves with reward item on some versions once rewarded
                const showRes = await plugin.showRewardVideoAd();
                if (showRes && (showRes.amount || showRes.type)) {
                  rewardedConfirmed = true;
                }
                // Fallback resolve if Dismissed event doesn't fire within 1.5s after promise resolves
                setTimeout(() => {
                  if (!settled) {
                    cleanupAndResolve({
                      ok: rewardedConfirmed,
                      rewarded: rewardedConfirmed,
                      status: rewardedConfirmed ? "completed" : "skipped",
                    });
                  }
                }, 1500);
              } catch (err) {
                cleanupAndResolve({
                  ok: false,
                  rewarded: false,
                  status: "failed",
                  error: String(err?.message || err),
                });
              }
            };

            void attach();
          });
        }
      } else if (ADMOB_CONFIG.IS_TEST_MODE) {
        result = await runWebSimulatedTestAd({
          adType: "rewarded",
          placementLabel: PLACEMENT_LABELS[placementId] || placementId,
          unitId: ids.REWARDED,
          durationSec: options.testDurationSec || ADMOB_CONFIG.WEB_TEST_AD_SECONDS,
        });
      } else {
        result = {
          ok: false,
          rewarded: false,
          status: "web_production_unsupported",
        };
      }

      if (result.ok && result.rewarded && typeof onRewarded === "function") {
        try {
          onRewarded(result);
        } catch (cbErr) {
          console.error("[CMR AdMob] Reward callback error:", cbErr);
        }
      }

      return result;
    } catch (err) {
      console.warn("[CMR AdMob] Rewarded ad failed gracefully:", err?.message || err);
      return { ok: false, rewarded: false, status: "failed", error: String(err?.message || err) };
    } finally {
      adInFlight = false;
      resumeGameAudio();
    }
  }

  // =========================================================================
  // PUBLIC API: SMART INTERSTITIAL ADS (Every 3 stages after Level 5)
  // =========================================================================
  async function showInterstitialAd(options = {}) {
    if (adInFlight) return { ok: false, shown: false, status: "busy" };
    if (hasNoAds()) return { ok: false, shown: false, status: "vip_no_ads" };
    if (!isOnline()) {
      syncOfflineAdButtons();
      return { ok: false, shown: false, status: "offline" };
    }

    await initialize();
    adInFlight = true;
    pauseGameAudio();

    const ids = getActiveAdUnitIds();

    try {
      if (isNativeCapacitor()) {
        const plugin = getCapacitorAdMobPlugin();
        if (!plugin) return { ok: false, shown: false, status: "plugin_missing" };
        if (!nativeInterstitialReady) {
          await preloadNativeInterstitial();
        }
        return await new Promise((resolve) => {
          let settled = false;
          const handles = [];
          const done = (res) => {
            if (settled) return;
            settled = true;
            handles.forEach((h) => {
              try {
                if (h && typeof h.remove === "function") h.remove();
              } catch (_) {}
            });
            nativeInterstitialReady = false;
            setTimeout(() => void preloadNativeInterstitial(), 500);
            resolve(res);
          };

          const run = async () => {
            try {
              if (typeof plugin.addListener === "function") {
                handles.push(
                  await plugin.addListener(INTERSTITIAL_EVENTS.Dismissed, () => {
                    done({ ok: true, shown: true, status: "dismissed" });
                  })
                );
                handles.push(
                  await plugin.addListener(INTERSTITIAL_EVENTS.FailedToShow, (err) => {
                    done({
                      ok: false,
                      shown: false,
                      status: "failed",
                      error: err ? String(err.message || err) : "failed_to_show",
                    });
                  })
                );
              }
              await plugin.showInterstitial();
              setTimeout(() => {
                if (!settled) done({ ok: true, shown: true, status: "completed" });
              }, 1200);
            } catch (err) {
              done({ ok: false, shown: false, status: "failed", error: String(err?.message || err) });
            }
          };
          void run();
        });
      }

      if (ADMOB_CONFIG.IS_TEST_MODE) {
        const sim = await runWebSimulatedTestAd({
          adType: "interstitial",
          placementLabel: "إعلان بين المراحل",
          unitId: ids.INTERSTITIAL,
          durationSec: options.testDurationSec || ADMOB_CONFIG.WEB_TEST_AD_SECONDS,
        });
        return { ok: true, shown: true, status: sim.status, simulated: true };
      }

      return { ok: false, shown: false, status: "web_production_unsupported" };
    } catch (err) {
      console.warn("[CMR AdMob] Interstitial error handled gracefully:", err?.message || err);
      return { ok: false, shown: false, status: "failed", error: String(err?.message || err) };
    } finally {
      adInFlight = false;
      resumeGameAudio();
    }
  }

  async function maybeShowInterstitialAfterStage(completedLevel, options = {}) {
    runtimeState = readPersistedState();
    const decision = shouldShowInterstitial({
      completedLevel,
      completedSinceLastAd: runtimeState.completedSinceLastAd,
      hasNoAds: hasNoAds(),
      isOnline: isOnline(),
      config: ADMOB_CONFIG,
    });

    runtimeState.completedSinceLastAd = decision.nextCounter;
    writePersistedState(runtimeState);

    if (!decision.show) {
      return { shown: false, reason: decision.reason, nextCounter: decision.nextCounter };
    }

    const res = await showInterstitialAd(options);
    return { ...res, reason: decision.reason, nextCounter: decision.nextCounter };
  }

  // Auto-init and bind online/offline listeners on browser load
  if (hasDOM) {
    window.addEventListener("online", () => {
      syncOfflineAdButtons();
      if (isNativeCapacitor()) {
        void preloadNativeRewarded();
        void preloadNativeInterstitial();
      }
    });
    window.addEventListener("offline", syncOfflineAdButtons);

    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          syncOfflineAdButtons();
          void initialize();
        },
        { once: true }
      );
    } else {
      syncOfflineAdButtons();
      void initialize();
    }
  }

  return {
    ADMOB_CONFIG,
    REWARD_EVENTS,
    INTERSTITIAL_EVENTS,
    getActiveAdUnitIds,
    shouldShowInterstitial,
    initialize,
    isNativeCapacitor,
    isOnline,
    hasNoAds,
    setNoAds,
    syncOfflineAdButtons,
    showRewardedAd,
    showInterstitialAd,
    maybeShowInterstitialAfterStage,
    getState: () => ({
      initialized,
      adInFlight,
      isTestMode: ADMOB_CONFIG.IS_TEST_MODE,
      isNative: isNativeCapacitor(),
      online: isOnline(),
      noAds: hasNoAds(),
      activeIds: getActiveAdUnitIds(),
      completedSinceLastAd: readPersistedState().completedSinceLastAd,
      nativeRewardedReady,
      nativeInterstitialReady,
    }),
  };
});
