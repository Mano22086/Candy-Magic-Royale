/* Candy Magic Royale — Bilingual i18n (AR/EN), Egyptian Royal Player Profile & Settings,
 * Avatar Picker, Name Editor, Achievements Engine, Daily Calendar, Mail & Kingdom Friends.
 * Uses exclusively the extracted transparent game UI assets (zero energy/lightning icons).
 */
(() => {
  "use strict";
  if (window.__CMR_PROFILE_SYSTEM_V1__) return;
  window.__CMR_PROFILE_SYSTEM_V1__ = true;

  const SAVE_KEY = "cmr_reborn_v1";
  const PLAYER_KEY = "cmr_player_identity_v1";
  const PREFS_KEY = "cmr_profile_prefs_v1";

  const TRANSLATIONS = {
    ar: {
      appTitle: "Candy Magic Royale — مملكة الحلوى الفرعونية",
      editProfile: "تعديل الملف الشخصي",
      guestName: "لاعب ضيف",
      royalPlayer: "لاعب ملكي",
      levelShort: "Lv.",
      xpLabel: "الخبرة",
      starsLabel: "النجوم",
      coinsLabel: "العملات",
      gemsLabel: "الجواهر",
      heartsLabel: "القلوب",
      movesLabel: "الحركات",
      stagesCompleted: "مراحل مكتملة",
      achievementsTitle: "الإنجازات الملكية",
      achievementsShort: "الإنجازات",
      bossesDefeated: "الزعماء",
      changeAvatar: "تغيير الصورة الرمزية",
      chooseAvatarTitle: "اختر صورتك الملكية",
      changeName: "تغيير اسم اللاعب",
      editNameTitle: "تعديل اسم اللاعب",
      namePlaceholder: "اكتب اسمك الملكي...",
      nameErrorEmpty: "يرجى إدخال اسم اللاعب (حرفان على الأقل).",
      nameErrorShort: "يجب أن يتكون الاسم من حرفين على الأقل.",
      nameSaved: "تم تحديث اسم اللاعب بنجاح!",
      avatarSaved: "تم تحديث الصورة الرمزية!",
      saveBtn: "حفظ",
      cancelBtn: "إلغاء",
      closeBtn: "إغلاق",
      claimBtn: "استلام",
      claimedBadge: "تم الاستلام ✓",
      lockedBadge: "مقفول",
      unlockedBadge: "مفتوح",
      langName: "العربية",
      langCode: "AR",
      langSwitched: "تم تحويل اللغة إلى العربية",
      soundVolume: "مستوى المؤثرات الصوتية",
      musicVolume: "مستوى الموسيقى",
      notifToggle: "الإشعارات",
      vibeToggle: "الاهتزاز",
      hintsToggle: "التلميحات والدردشة",
      mailToggle: "البريد والتحديثات",
      toggleOn: "مفعّل",
      toggleOff: "متوقف",
      notifEnabledToast: "تم تفعيل الإشعارات",
      notifDisabledToast: "تم إيقاف الإشعارات",
      vibeEnabledToast: "تم تفعيل الاهتزاز",
      vibeDisabledToast: "تم إيقاف الاهتزاز",
      hintsEnabledToast: "تم تفعيل التلميحات",
      hintsDisabledToast: "تم إيقاف التلميحات",
      mailEnabledToast: "تم تفعيل تنبيهات البريد",
      mailDisabledToast: "تم إيقاف تنبيهات البريد",
      guestPlay: "اللعب كضيف",
      facebookPlay: "الدخول بحساب فيسبوك",
      tapToSkip: "تخطي",
      mapTitle: "خريطة الممالك الفرعونية",
      myLocation: "موقعي",
      zoomMap: "تكبير",
      mainMenu: "الرئيسية",
      returnToMap: "العودة إلى الخريطة",
      playNow: "العب الآن",
      playLevel: "العب المرحلة {n}",
      levelsRange: "المراحل {s}–{e}",
      palaceProgress: "{done} / 100 مرحلة",
      palaceStars: "{stars} / 300 نجمة",
      palaceLockedBanner: "أكمل القصر السابق لفتح مراحل هذا القصر",
      levelLockedToast: "هذه المرحلة مقفولة! أكمل المرحلة {req} أولاً.",
      noHeartsToast: "نفدت قلوبك! يمكنك استعادة القلوب من المتجر الملكي.",
      bossStageLabel: "زعيم ملك الحلوى",
      youAreHere: "أنت هنا",
      calendarTitle: "التقويم الملكي اليومي",
      calendarSubtitle: "سجّل يومياً واحصل على عملات وجواهر مجانية",
      dayLabel: "اليوم {d}",
      mailTitle: "البريد الملكي",
      mailSubtitle: "رسائل وهدايا من مملكة الحلوى",
      friendsTitle: "أبطال المملكة",
      friendsSubtitle: "ترتيبك بين أبطال القصور العشرة",
      shopTitle: "المتجر",
      settingsTitle: "إعدادات اللعب",
      restartStage: "إعادة المرحلة",
      exitStage: "الخروج من المرحلة",
      resumePlay: "متابعة اللعب",
      boosterPaint: "فرشاة",
      boosterShuffle: "خلط",
      boosterBomb: "قنبلة",
      boosterColor: "ألوان",
      boosterRocket: "صاروخ",
      rewardClaimed: "تم استلام المكافأة: +{coins} عملة و+{gems} جوهرة!",
      alreadyClaimedToday: "تم استلام مكافأة اليوم بالفعل — عد غداً!",
      welcomeMailTitle: "هدية الترحيب الملكية",
      welcomeMailBody: "أهلاً بك في مملكة Candy Magic Royale! استلم صندوقك الملكي لبدء مغامرة القصور العشرة.",
      palaceGuideMailTitle: "خريطة القصور الـ 10 الجديدة",
      palaceGuideMailBody: "استكشف 10 قصور فرعونية و1000 مرحلة متدرجة مع زعيم ملك الحلوى في المرحلة 50 من كل قصر.",
      loginTitle: "حساب اللاعب الملكي",
      loginSubtitle: "سجّل اسمك الملكي لحفظ تقدمك ومخزونك على هذا الجهاز.",
      loginNameLabel: "اسم اللاعب الملكي",
      loginEmailLabel: "البريد الإلكتروني (اختياري)",
      loginSubmit: "حفظ الحساب والدخول",
      continueGuest: "المتابعة كضيف",
      signOut: "تسجيل الخروج",
      openProfileAria: "فتح الملف الشخصي والإعدادات",
      openShopAria: "فتح المتجر الملكي",
      openAchievementsAria: "فتح الإنجازات",
      openCalendarAria: "فتح التقويم اليومي",
      openFriendsAria: "فتح أبطال المملكة",
      openMailAria: "فتح البريد الملكي",
      openSettingsAria: "فتح الإعدادات",
      youTag: "أنت",
    },
    en: {
      appTitle: "Candy Magic Royale — Pharaoh Candy Kingdom",
      editProfile: "EDIT PROFILE",
      guestName: "Guest Player",
      royalPlayer: "Royal Hero",
      levelShort: "Lv.",
      xpLabel: "XP",
      starsLabel: "Stars",
      coinsLabel: "Coins",
      gemsLabel: "Gems",
      heartsLabel: "Hearts",
      movesLabel: "Moves",
      stagesCompleted: "Stages Cleared",
      achievementsTitle: "Royal Achievements",
      achievementsShort: "Achievements",
      bossesDefeated: "Bosses",
      changeAvatar: "Change Avatar",
      chooseAvatarTitle: "Choose Royal Avatar",
      changeName: "Edit Player Name",
      editNameTitle: "Edit Player Name",
      namePlaceholder: "Enter your royal name...",
      nameErrorEmpty: "Please enter a player name (at least 2 characters).",
      nameErrorShort: "Name must be at least 2 characters.",
      nameSaved: "Player name updated!",
      avatarSaved: "Royal avatar updated!",
      saveBtn: "Save",
      cancelBtn: "Cancel",
      closeBtn: "Close",
      claimBtn: "Claim",
      claimedBadge: "Claimed ✓",
      lockedBadge: "Locked",
      unlockedBadge: "Unlocked",
      langName: "English",
      langCode: "EN",
      langSwitched: "Language switched to English",
      soundVolume: "Sound Effects Volume",
      musicVolume: "Music Volume",
      notifToggle: "Notifications",
      vibeToggle: "Vibration",
      hintsToggle: "Hints & Chat",
      mailToggle: "Mail & Updates",
      toggleOn: "ON",
      toggleOff: "OFF",
      notifEnabledToast: "Notifications enabled",
      notifDisabledToast: "Notifications muted",
      vibeEnabledToast: "Vibration enabled",
      vibeDisabledToast: "Vibration disabled",
      hintsEnabledToast: "Hints enabled",
      hintsDisabledToast: "Hints disabled",
      mailEnabledToast: "Mail updates enabled",
      mailDisabledToast: "Mail updates muted",
      guestPlay: "GUEST PLAY",
      facebookPlay: "FACEBOOK PLAY",
      tapToSkip: "Skip",
      mapTitle: "Egyptian Kingdom World Map",
      myLocation: "My Spot",
      zoomMap: "Zoom",
      mainMenu: "Menu",
      returnToMap: "Back to Map",
      playNow: "Play Now",
      playLevel: "Play Level {n}",
      levelsRange: "Levels {s}–{e}",
      palaceProgress: "{done} / 100 Levels",
      palaceStars: "{stars} / 300 Stars",
      palaceLockedBanner: "Complete the previous palace to unlock these levels",
      levelLockedToast: "Level locked! Complete Level {req} first.",
      noHeartsToast: "Out of hearts! Restore hearts in the Royal Store.",
      bossStageLabel: "Candy King Boss",
      youAreHere: "You",
      calendarTitle: "Daily Royal Calendar",
      calendarSubtitle: "Check in daily to claim free Coins & Gems",
      dayLabel: "Day {d}",
      mailTitle: "Royal Mail",
      mailSubtitle: "Gifts & scrolls from the Candy Kingdom",
      friendsTitle: "Kingdom Champions",
      friendsSubtitle: "Your rank across the 10 Egyptian Palaces",
      shopTitle: "Royal Store",
      settingsTitle: "Game Settings",
      restartStage: "Restart Level",
      exitStage: "Exit Level",
      resumePlay: "Resume",
      boosterPaint: "Paint",
      boosterShuffle: "Shuffle",
      boosterBomb: "Bomb",
      boosterColor: "Color",
      boosterRocket: "Rocket",
      rewardClaimed: "Reward claimed: +{coins} Coins & +{gems} Gems!",
      alreadyClaimedToday: "Today's reward is already claimed — come back tomorrow!",
      welcomeMailTitle: "Royal Welcome Chest",
      welcomeMailBody: "Welcome to Candy Magic Royale! Claim your starter treasure chest for the 10 Palaces journey.",
      palaceGuideMailTitle: "10 Egyptian Palaces Unlocked",
      palaceGuideMailBody: "Explore 10 themed palaces and 1,000 levels with the Candy King Boss waiting on Stage 50 of each palace.",
      loginTitle: "Royal Player Account",
      loginSubtitle: "Save your royal name & progress securely on this device.",
      loginNameLabel: "Royal Player Name",
      loginEmailLabel: "Email (Optional)",
      loginSubmit: "Save & Enter",
      continueGuest: "Continue as Guest",
      signOut: "Sign Out",
      openProfileAria: "Open Player Profile & Settings",
      openShopAria: "Open Royal Store",
      openAchievementsAria: "Open Achievements",
      openCalendarAria: "Open Daily Calendar",
      openFriendsAria: "Open Kingdom Champions",
      openMailAria: "Open Royal Mail",
      openSettingsAria: "Open Settings",
      youTag: "YOU",
    },
  };

  const DAILY_REWARDS = [
    { day: 1, coins: 150, gems: 5, icon: "./assets/extracted/ui/icon_coin_gold.png" },
    { day: 2, coins: 200, gems: 8, icon: "./assets/extracted/ui/icon_gem_purple.png" },
    { day: 3, coins: 250, gems: 10, icon: "./assets/extracted/ui/icon_coin_gold.png" },
    { day: 4, coins: 300, gems: 12, icon: "./assets/extracted/ui/icon_gem_purple.png" },
    { day: 5, coins: 400, gems: 15, icon: "./assets/extracted/ui/icon_royal_chest.png" },
    { day: 6, coins: 500, gems: 20, icon: "./assets/extracted/ui/icon_gem_purple.png" },
    { day: 7, coins: 800, gems: 35, icon: "./assets/extracted/ui/icon_royal_chest.png" },
  ];

  const DEFAULT_PREFS = {
    avatarId: "pharaoh_prince",
    language: "ar",
    notificationsEnabled: true,
    vibrationEnabled: true,
    hintsEnabled: true,
    mailEnabled: true,
    profileCustomized: false,
    claimedAchievements: [],
    dailyClaims: [],
    lastDailyDate: "",
    claimedMailIds: [],
  };

  function core() {
    return window.CMRCore;
  }

  function loadPrefs() {
    try {
      const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      return {
        ...DEFAULT_PREFS,
        ...raw,
        language: raw.language === "en" ? "en" : "ar",
        claimedAchievements: Array.isArray(raw.claimedAchievements) ? raw.claimedAchievements : [],
        dailyClaims: Array.isArray(raw.dailyClaims) ? raw.dailyClaims : [],
        claimedMailIds: Array.isArray(raw.claimedMailIds) ? raw.claimedMailIds : [],
      };
    } catch (_) {
      return { ...DEFAULT_PREFS };
    }
  }

  let prefs = loadPrefs();

  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (_) {}
  }

  function readSave() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function readIdentity() {
    try {
      const id = JSON.parse(localStorage.getItem(PLAYER_KEY) || "null");
      if (id && id.displayName) return id;
    } catch (_) {}
    return {
      id: "guest-session",
      provider: "guest",
      displayName: t("guestName"),
      email: "",
    };
  }

  function t(key, vars = null) {
    const lang = prefs.language === "en" ? "en" : "ar";
    let str = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.ar[key] || key;
    if (vars && typeof vars === "object") {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
      });
    }
    return str;
  }

  function getLanguage() {
    return prefs.language === "en" ? "en" : "ar";
  }

  function showToast(msg, force = false) {
    if (!force && !prefs.notificationsEnabled) return;
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast.__cmrProfileTimer);
    toast.__cmrProfileTimer = setTimeout(() => toast.classList.remove("show"), 2300);
  }

  let userActivated = false;
  const markUserActivated = () => {
    userActivated = true;
  };
  window.addEventListener("pointerdown", markUserActivated, { once: true, passive: true });
  window.addEventListener("keydown", markUserActivated, { once: true, passive: true });

  function vibrate(pattern = 18) {
    if (!prefs.vibrationEnabled) return;
    const active = userActivated || Boolean(navigator?.userActivation?.hasBeenActive);
    if (!active) return;
    try {
      if (navigator && typeof navigator.vibrate === "function") {
        navigator.vibrate(pattern);
      }
    } catch (_) {}
  }

  function creditWallet(coinsAdd = 0, gemsAdd = 0) {
    if (window.CMRGame && typeof window.CMRGame.addRewards === "function") {
      window.CMRGame.addRewards(coinsAdd, gemsAdd);
      return;
    }
    try {
      const saved = readSave();
      saved.coins = Math.max(0, Math.floor(Number(saved.coins ?? 500)) + Math.floor(coinsAdd));
      saved.gems = Math.max(0, Math.floor(Number(saved.gems ?? 25)) + Math.floor(gemsAdd));
      localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
    } catch (_) {}
    window.CMRRefreshWorldMap?.();
    window.CMRGame?.syncMenuUI?.();
  }

  function getProfileState() {
    const saved = readSave();
    const identity = readIdentity();
    const rawUnlocked = Math.floor(Number(saved.highestUnlocked) || Number(saved.level) || 1);
    const highestUnlocked = core() ? core().clampStage(saved.completed ? Math.max(rawUnlocked, Math.floor(Number(saved.level) || 1) + 1) : rawUnlocked) : Math.max(1, rawUnlocked);
    const stars = Number.isFinite(Number(saved.stars)) ? Math.max(0, Math.floor(Number(saved.stars))) : 0;
    const coins = Number.isFinite(Number(saved.coins)) ? Math.max(0, Math.floor(Number(saved.coins))) : 500;
    const gems = Number.isFinite(Number(saved.gems)) ? Math.max(0, Math.floor(Number(saved.gems))) : 25;
    const lives = saved.lives === undefined ? 5 : Math.max(0, Math.min(5, Math.floor(Number(saved.lives) || 0)));
    const stageStars = saved.stageStars && typeof saved.stageStars === "object" ? saved.stageStars : {};

    const completedStages = Math.max(0, highestUnlocked - 1);
    let defeatedBosses = 0;
    for (let p = 0; p < 10; p++) {
      if (highestUnlocked > p * 100 + 50) defeatedBosses++;
    }
    const unlockedPalaces = Math.min(10, Math.floor((highestUnlocked - 1) / 100) + 1);

    const rawProg = core()
      ? core().computePlayerProgression({ completedStages, stars, bossesDefeated: defeatedBosses })
      : { level: 1, totalXp: 0, currentLevelXp: 0, xpForNext: 250, progressPercent: 0 };

    const progression = {
      ...rawProg,
      playerLevel: rawProg.level,
      xpPercent: rawProg.progressPercent,
      completedStages,
      unlockedPalaces,
      defeatedBosses,
      stars,
    };

    const claimedMap = {};
    prefs.claimedAchievements.forEach((id) => {
      claimedMap[id] = true;
    });

    const achievements = core()
      ? core().evaluateAchievements(
          { highestUnlocked, stars, coins, gems, profileCustomized: prefs.profileCustomized },
          claimedMap
        )
      : [];

    const unlockedAchCount = achievements.filter((a) => a.unlocked).length;
    const claimableAchCount = achievements.filter((a) => a.canClaim).length;
    const rawAvatar = core()
      ? core().getAvatarById(prefs.avatarId)
      : { id: "pharaoh_prince", src: "./assets/extracted/ui/avatar_pharaoh_portrait.png" };
    const avatar = { ...rawAvatar, img: rawAvatar.src || rawAvatar.img };

    // Display localized default guest name if still default
    let displayName = identity.displayName || t("guestName");
    if (identity.provider === "guest" && (displayName === "لاعب ضيف" || displayName === "Guest Player")) {
      displayName = t("guestName");
    }

    return {
      identity,
      displayName,
      avatar,
      highestUnlocked,
      stars,
      coins,
      gems,
      lives,
      stageStars,
      progression,
      achievements,
      unlockedAchCount,
      claimableAchCount,
      prefs: { ...prefs },
    };
  }

  function setPlayerName(newName) {
    const clean = String(newName || "").trim().slice(0, 24);
    if (clean.length < 2) return { ok: false, error: t("nameErrorShort") };
    const current = readIdentity();
    const updated = {
      ...current,
      provider: current.provider || "account",
      displayName: clean,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(PLAYER_KEY, JSON.stringify(updated));
    } catch (_) {}
    // Also mirror displayName into SAVE_KEY without altering gameplay progress
    try {
      const saved = readSave();
      saved.displayName = clean;
      localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
    } catch (_) {}
    prefs.profileCustomized = true;
    savePrefs();
    window.CMRGame?.syncMenuUI?.();
    refreshAllUI();
    return { ok: true, name: clean };
  }

  function setAvatar(avatarId) {
    const av = core() ? core().getAvatarById(avatarId) : null;
    prefs.avatarId = av ? av.id : "pharaoh_prince";
    prefs.profileCustomized = true;
    savePrefs();
    vibrate(14);
    window.CMRAudio?.playSfx?.("match");
    refreshAllUI();
  }

  function applyTranslations() {
    const lang = getLanguage();
    const isEn = lang === "en";
    document.documentElement.lang = lang;
    document.documentElement.dir = isEn ? "ltr" : "rtl";
    document.body.dataset.lang = lang;
    document.title = t("appTitle");

    // Translate static DOM labels in index.html
    const setTxt = (selector, text) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = text;
    };

    setTxt("#shopTitle", t("shopTitle"));
    setTxt("#settingsModalTitle", t("settingsTitle"));
    setTxt("#settingsRestartBtn span", t("restartStage"));
    setTxt("#settingsExitBtn span", t("exitStage"));
    setTxt("#settingsResumeBtn span", t("resumePlay"));
    setTxt(".art-moves .hud-slot-label", t("movesLabel"));
    setTxt(".art-target .hud-slot-label", t("heartsLabel"));
    setTxt("#paintBtn .booster-name", t("boosterPaint"));
    setTxt("#shuffleBtn .booster-name", t("boosterShuffle"));
    setTxt("#bombBtn .booster-name", t("boosterBomb"));
    setTxt("#colorBtn .booster-name", t("boosterColor"));
    setTxt("#rocketBtn .booster-name", t("boosterRocket"));
    setTxt("#loginModalTitle", t("loginTitle"));
    setTxt('label[for="loginDisplayName"]', t("loginNameLabel"));
    setTxt('label[for="loginEmail"]', t("loginEmailLabel"));
    setTxt("#loginSubmitBtn", t("loginSubmit"));
    setTxt("#loginAsGuestBtn span", t("continueGuest"));
    setTxt("#loginSignOutBtn span", t("signOut"));

    // Splash buttons aria-labels / fallback labels
    const guestSplash = document.getElementById("splashGuestBtn");
    const fbSplash = document.getElementById("splashFacebookBtn");
    if (guestSplash) {
      guestSplash.setAttribute("aria-label", t("guestPlay"));
      const lbl = guestSplash.querySelector(".splash-fallback-label");
      if (lbl) lbl.textContent = t("guestPlay");
    }
    if (fbSplash) {
      fbSplash.setAttribute("aria-label", t("facebookPlay"));
      const lbl = fbSplash.querySelector(".splash-fallback-label");
      if (lbl) lbl.textContent = t("facebookPlay");
    }

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key) el.textContent = t(key);
    });
  }

  function setLanguage(lang) {
    const next = lang === "en" ? "en" : "ar";
    if (prefs.language === next) return;
    prefs.language = next;
    savePrefs();
    vibrate(14);
    window.CMRAudio?.playSfx?.("match");
    applyTranslations();
    refreshAllUI();
    showToast(t("langSwitched"), true);
  }

  function toggleLanguage() {
    setLanguage(prefs.language === "ar" ? "en" : "ar");
  }

  // ---- SVG Flags for Language Selector (Crisp Vector Matching Reference Style) ----
  function flagSvg(lang) {
    if (lang === "en") {
      return `<svg class="prof-flag-svg" viewBox="0 0 60 36" aria-hidden="true">
        <rect width="60" height="36" rx="5" fill="#012169"/>
        <path d="M0,0 L60,36 M60,0 L0,36" stroke="#fff" stroke-width="7"/>
        <path d="M0,0 L60,36 M60,0 L0,36" stroke="#C8102E" stroke-width="3.5"/>
        <path d="M30,0 V36 M0,18 H60" stroke="#fff" stroke-width="10"/>
        <path d="M30,0 V36 M0,18 H60" stroke="#C8102E" stroke-width="6"/>
      </svg>`;
    }
    // Arabic royal flag (Egypt / Arab royal gold-eagle tricolor)
    return `<svg class="prof-flag-svg" viewBox="0 0 60 36" aria-hidden="true">
      <rect width="60" height="12" y="0" fill="#CE1126"/>
      <rect width="60" height="12" y="12" fill="#FFFFFF"/>
      <rect width="60" height="12" y="24" fill="#111111"/>
      <polygon points="30,13.2 32.5,18 30,22.8 27.5,18" fill="#D4AF37"/>
      <circle cx="30" cy="18" r="2.2" fill="#F59E0B"/>
    </svg>`;
  }

  // ---- Build & Render Modals ----
  let profileModal = null;
  let avatarModal = null;
  let nameModal = null;
  let achievementsModal = null;
  let calendarModal = null;
  let mailModal = null;
  let friendsModal = null;

  function ensureProfileModal() {
    if (profileModal) return profileModal;
    profileModal = document.createElement("div");
    profileModal.id = "playerProfileModal";
    profileModal.className = "modal cmr-royal-modal hidden";
    profileModal.setAttribute("role", "dialog");
    profileModal.setAttribute("aria-modal", "true");
    profileModal.setAttribute("aria-labelledby", "profTitleText");

    profileModal.innerHTML = `
      <div class="prof-stage" id="profStage" dir="ltr">
        <!-- Live Avatar positioned cleanly behind the transparent golden winged avatar ring -->
        <div class="prof-avatar-well" aria-hidden="true">
          <img id="profAvatarImg" src="./assets/extracted/ui/avatar_pharaoh_portrait.png" alt="">
        </div>

        <!-- Authentic Supplied Egyptian Royal Profile Frame (cleaned interiors, untouched gold borders) -->
        <img class="prof-frame-img" src="./assets/extracted/profile/profile_frame_clean.png" alt="" aria-hidden="true">

        <!-- Title Banner -->
        <h2 class="prof-title-text" id="profTitleText">تعديل الملف الشخصي</h2>

        <!-- Red X Close Button -->
        <button type="button" class="prof-hotspot prof-close-btn" id="profileCloseBtn" aria-label="إغلاق"></button>

        <!-- Avatar Edit Pencil Button -->
        <button type="button" class="prof-hotspot prof-avatar-edit-btn" id="profileAvatarEditBtn" aria-label="تغيير الصورة الرمزية"></button>

        <!-- 5 Left Stat Slots -->
        <div class="prof-stat-slot prof-stat-level" title="Player Level">
          <strong id="profStatLevel">Lv. 1</strong>
          <span class="prof-xp-mini"><i id="profStatXpFill"></i></span>
        </div>
        <div class="prof-stat-slot prof-stat-stars" title="Total Stars">
          <strong id="profStatStars">0</strong>
        </div>
        <div class="prof-stat-slot prof-stat-stages" title="Completed Stages">
          <strong id="profStatStages">0</strong>
        </div>
        <button type="button" class="prof-stat-slot prof-stat-ach" id="profStatAchBtn" aria-label="الإنجازات الملكية">
          <strong id="profStatAch">0/10</strong>
        </button>
        <div class="prof-stat-slot prof-stat-bosses" title="Bosses Defeated">
          <strong id="profStatBosses">0</strong>
        </div>

        <!-- Player Name Display & Edit Pencil -->
        <button type="button" class="prof-name-display" id="profileNameBarBtn" aria-label="تعديل اسم اللاعب">
          <span id="profNameValue">لاعب ضيف</span>
        </button>
        <button type="button" class="prof-hotspot prof-name-edit-btn" id="profileNameEditBtn" aria-label="تعديل اسم اللاعب"></button>

        <!-- Language Switcher (Left Arrow, Flag + Label, Right Arrow) -->
        <button type="button" class="prof-hotspot prof-lang-prev" id="profileLangPrevBtn" aria-label="Previous Language"></button>
        <button type="button" class="prof-lang-center" id="profileLangCenterBtn" aria-label="Switch Language">
          <span id="profLangFlag"></span>
          <b id="profLangCode">AR</b>
        </button>
        <button type="button" class="prof-hotspot prof-lang-next" id="profileLangNextBtn" aria-label="Next Language"></button>

        <!-- Sound Volume Slider (matches supplied glossy cyan bar + golden knob) -->
        <div class="prof-slider-slot prof-slider-sfx">
          <div class="prof-slider-visual">
            <div class="prof-slider-fill" id="profSfxFill"></div>
            <div class="prof-slider-knob" id="profSfxKnob"></div>
          </div>
          <input type="range" id="profileSfxSlider" class="prof-range-input" min="0" max="100" value="70" aria-label="مستوى المؤثرات الصوتية">
        </div>

        <!-- Music Volume Slider -->
        <div class="prof-slider-slot prof-slider-music">
          <div class="prof-slider-visual">
            <div class="prof-slider-fill" id="profMusicFill"></div>
            <div class="prof-slider-knob" id="profMusicKnob"></div>
          </div>
          <input type="range" id="profileMusicSlider" class="prof-range-input" min="0" max="100" value="45" aria-label="مستوى الموسيقى">
        </div>

        <!-- 4 Glossy Toggle Switches (Notifications, Vibration, Hints/Chat, Mail) -->
        <button type="button" role="switch" aria-checked="true" id="profileToggleNotif" class="prof-toggle-switch prof-tg-notif is-on" aria-label="الإشعارات">
          <span class="prof-toggle-knob"></span>
        </button>
        <button type="button" role="switch" aria-checked="true" id="profileToggleVibe" class="prof-toggle-switch prof-tg-vibe is-on" aria-label="الاهتزاز">
          <span class="prof-toggle-knob"></span>
        </button>
        <button type="button" role="switch" aria-checked="true" id="profileToggleHints" class="prof-toggle-switch prof-tg-hints is-on" aria-label="التلميحات">
          <span class="prof-toggle-knob"></span>
        </button>
        <button type="button" role="switch" aria-checked="true" id="profileToggleMail" class="prof-toggle-switch prof-tg-mail is-on" aria-label="البريد">
          <span class="prof-toggle-knob"></span>
        </button>
      </div>
    `;

    document.body.appendChild(profileModal);

    // Backdrop click closes modal
    profileModal.addEventListener("click", (e) => {
      if (e.target === profileModal) closeProfile();
    });

    profileModal.querySelector("#profileCloseBtn").addEventListener("click", () => {
      vibrate(10);
      closeProfile();
    });

    profileModal.querySelector("#profileAvatarEditBtn").addEventListener("click", () => {
      vibrate(12);
      openAvatarPicker();
    });

    const openName = () => {
      vibrate(12);
      openNameEditor();
    };
    profileModal.querySelector("#profileNameBarBtn").addEventListener("click", openName);
    profileModal.querySelector("#profileNameEditBtn").addEventListener("click", openName);

    profileModal.querySelector("#profStatAchBtn").addEventListener("click", () => {
      vibrate(12);
      openAchievements();
    });

    profileModal.querySelector("#profileLangPrevBtn").addEventListener("click", toggleLanguage);
    profileModal.querySelector("#profileLangNextBtn").addEventListener("click", toggleLanguage);
    profileModal.querySelector("#profileLangCenterBtn").addEventListener("click", toggleLanguage);

    const sfxInput = profileModal.querySelector("#profileSfxSlider");
    sfxInput.addEventListener("input", () => {
      const pct = Number(sfxInput.value) || 0;
      window.CMRAudio?.unlock?.();
      window.CMRAudio?.setSfxEnabled?.(pct > 0);
      window.CMRAudio?.setSfxVolume?.(pct / 100);
      updateSliderVisual("sfx", pct);
      // Sync existing in-game settings modal if present
      const legacySfx = document.getElementById("sfxVolumeSlider");
      const legacyVal = document.getElementById("sfxVolumeValue");
      if (legacySfx) legacySfx.value = String(pct);
      if (legacyVal) legacyVal.textContent = pct + "%";
    });
    sfxInput.addEventListener("change", () => {
      if (Number(sfxInput.value) > 0) window.CMRAudio?.playSfx?.("match");
    });

    const musicInput = profileModal.querySelector("#profileMusicSlider");
    musicInput.addEventListener("input", () => {
      const pct = Number(musicInput.value) || 0;
      window.CMRAudio?.unlock?.();
      window.CMRAudio?.setMusicEnabled?.(pct > 0);
      window.CMRAudio?.setMusicVolume?.(pct / 100);
      updateSliderVisual("music", pct);
      const legacyMusic = document.getElementById("musicVolumeSlider");
      const legacyVal = document.getElementById("musicVolumeValue");
      if (legacyMusic) legacyMusic.value = String(pct);
      if (legacyVal) legacyVal.textContent = pct + "%";
    });

    const bindToggle = (id, prefKey, onMsgKey, offMsgKey) => {
      const btn = profileModal.querySelector(id);
      if (!btn) return;
      btn.addEventListener("click", () => {
        prefs[prefKey] = !prefs[prefKey];
        savePrefs();
        updateProfileModalContent();
        if (prefKey === "vibrationEnabled" && prefs.vibrationEnabled) {
          vibrate([22, 25, 22]);
        } else {
          vibrate(12);
        }
        window.CMRAudio?.playSfx?.("swap");
        showToast(t(prefs[prefKey] ? onMsgKey : offMsgKey), true);
      });
    };

    bindToggle("#profileToggleNotif", "notificationsEnabled", "notifEnabledToast", "notifDisabledToast");
    bindToggle("#profileToggleVibe", "vibrationEnabled", "vibeEnabledToast", "vibeDisabledToast");
    bindToggle("#profileToggleHints", "hintsEnabled", "hintsEnabledToast", "hintsDisabledToast");
    bindToggle("#profileToggleMail", "mailEnabled", "mailEnabledToast", "mailDisabledToast");

    return profileModal;
  }

  function updateSliderVisual(kind, pct) {
    if (!profileModal) return;
    const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
    const fill = profileModal.querySelector(kind === "sfx" ? "#profSfxFill" : "#profMusicFill");
    const knob = profileModal.querySelector(kind === "sfx" ? "#profSfxKnob" : "#profMusicKnob");
    if (fill) fill.style.width = `${clamped}%`;
    if (knob) knob.style.left = `calc(${clamped}% - 12px)`;
  }

  function updateProfileModalContent() {
    if (!profileModal) return;
    const st = getProfileState();
    const audio = window.CMRAudio?.getSettings?.() || { musicEnabled: true, sfxEnabled: true, musicVolume: 0.45, sfxVolume: 0.7 };
    const sfxPct = audio.sfxEnabled ? Math.round((audio.sfxVolume ?? 0.7) * 100) : 0;
    const musicPct = audio.musicEnabled ? Math.round((audio.musicVolume ?? 0.45) * 100) : 0;

    const avatarImg = profileModal.querySelector("#profAvatarImg");
    if (avatarImg) avatarImg.src = st.avatar.img;

    const titleEl = profileModal.querySelector("#profTitleText");
    if (titleEl) titleEl.textContent = t("editProfile");

    const nameEl = profileModal.querySelector("#profNameValue");
    if (nameEl) nameEl.textContent = st.displayName;

    const lvlEl = profileModal.querySelector("#profStatLevel");
    if (lvlEl) lvlEl.textContent = `${t("levelShort")} ${st.progression.playerLevel}`;
    const xpFill = profileModal.querySelector("#profStatXpFill");
    if (xpFill) xpFill.style.width = `${Math.max(6, st.progression.xpPercent)}%`;

    const starsEl = profileModal.querySelector("#profStatStars");
    if (starsEl) starsEl.textContent = st.stars.toLocaleString("en-US");
    const stagesEl = profileModal.querySelector("#profStatStages");
    if (stagesEl) stagesEl.textContent = String(st.progression.completedStages);
    const achEl = profileModal.querySelector("#profStatAch");
    if (achEl) achEl.textContent = `${st.unlockedAchCount}/${st.achievements.length || 10}`;
    const bossEl = profileModal.querySelector("#profStatBosses");
    if (bossEl) bossEl.textContent = String(st.progression.defeatedBosses);

    // Language UI
    const flagEl = profileModal.querySelector("#profLangFlag");
    const codeEl = profileModal.querySelector("#profLangCode");
    if (flagEl) flagEl.innerHTML = flagSvg(getLanguage());
    if (codeEl) codeEl.textContent = t("langName");

    // Sliders
    const sfxInput = profileModal.querySelector("#profileSfxSlider");
    const musicInput = profileModal.querySelector("#profileMusicSlider");
    if (sfxInput) {
      sfxInput.value = String(sfxPct);
      sfxInput.setAttribute("aria-label", t("soundVolume"));
    }
    if (musicInput) {
      musicInput.value = String(musicPct);
      musicInput.setAttribute("aria-label", t("musicVolume"));
    }
    updateSliderVisual("sfx", sfxPct);
    updateSliderVisual("music", musicPct);

    // Toggles
    const syncTg = (sel, val, labelKey) => {
      const el = profileModal.querySelector(sel);
      if (!el) return;
      el.classList.toggle("is-on", Boolean(val));
      el.setAttribute("aria-checked", val ? "true" : "false");
      el.setAttribute("aria-label", `${t(labelKey)}: ${val ? t("toggleOn") : t("toggleOff")}`);
    };
    syncTg("#profileToggleNotif", prefs.notificationsEnabled, "notifToggle");
    syncTg("#profileToggleVibe", prefs.vibrationEnabled, "vibeToggle");
    syncTg("#profileToggleHints", prefs.hintsEnabled, "hintsToggle");
    syncTg("#profileToggleMail", prefs.mailEnabled, "mailToggle");

    // Accessible labels
    profileModal.querySelector("#profileCloseBtn")?.setAttribute("aria-label", t("closeBtn"));
    profileModal.querySelector("#profileAvatarEditBtn")?.setAttribute("aria-label", t("changeAvatar"));
    profileModal.querySelector("#profileNameEditBtn")?.setAttribute("aria-label", t("changeName"));
    profileModal.querySelector("#profileNameBarBtn")?.setAttribute("aria-label", t("changeName"));
    profileModal.querySelector("#profStatAchBtn")?.setAttribute("aria-label", t("achievementsTitle"));
  }

  function openProfile() {
    ensureProfileModal();
    updateProfileModalContent();
    profileModal.classList.remove("hidden");
  }

  function closeProfile() {
    if (profileModal) profileModal.classList.add("hidden");
  }

  // ---- Avatar Picker Modal ----
  function ensureAvatarModal() {
    if (avatarModal) return avatarModal;
    avatarModal = document.createElement("div");
    avatarModal.id = "avatarPickerModal";
    avatarModal.className = "modal cmr-royal-modal cmr-submodal hidden";
    avatarModal.setAttribute("role", "dialog");
    avatarModal.setAttribute("aria-modal", "true");
    avatarModal.setAttribute("aria-labelledby", "avatarPickerTitle");
    avatarModal.innerHTML = `
      <div class="cmr-dialog-card">
        <button type="button" class="cmr-dialog-close" id="avatarPickerCloseBtn" aria-label="إغلاق">✕</button>
        <div class="cmr-dialog-header">
          <img src="./assets/extracted/ui/avatar_pharaoh_frame.png" alt="">
          <h2 id="avatarPickerTitle">اختر صورتك الملكية</h2>
        </div>
        <div class="cmr-avatar-grid" id="cmrAvatarGrid"></div>
      </div>
    `;
    document.body.appendChild(avatarModal);
    avatarModal.addEventListener("click", (e) => {
      if (e.target === avatarModal) avatarModal.classList.add("hidden");
    });
    avatarModal.querySelector("#avatarPickerCloseBtn").addEventListener("click", () => {
      avatarModal.classList.add("hidden");
    });
    return avatarModal;
  }

  function openAvatarPicker() {
    ensureAvatarModal();
    avatarModal.querySelector("#avatarPickerTitle").textContent = t("chooseAvatarTitle");
    avatarModal.querySelector("#avatarPickerCloseBtn").setAttribute("aria-label", t("closeBtn"));
    const grid = avatarModal.querySelector("#cmrAvatarGrid");
    const catalog = core()?.AVATAR_CATALOG || [];
    const isEn = getLanguage() === "en";
    grid.innerHTML = "";
    catalog.forEach((av) => {
      const selected = av.id === prefs.avatarId;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `cmr-avatar-option ${selected ? "is-selected" : ""}`;
      btn.dataset.avatarId = av.id;
      btn.setAttribute("aria-pressed", selected ? "true" : "false");
      btn.innerHTML = `
        <span class="cmr-avatar-ring">
          <img src="${av.src || av.img}" alt="${isEn ? av.nameEn : av.nameAr}">
        </span>
        <b>${isEn ? av.nameEn : av.nameAr}</b>
        ${selected ? '<span class="cmr-avatar-check" aria-hidden="true">✓</span>' : ""}
      `;
      btn.addEventListener("click", () => {
        setAvatar(av.id);
        avatarModal.classList.add("hidden");
        showToast(t("avatarSaved"), true);
      });
      grid.appendChild(btn);
    });
    avatarModal.classList.remove("hidden");
  }

  // ---- Name Editor Modal ----
  function ensureNameModal() {
    if (nameModal) return nameModal;
    nameModal = document.createElement("div");
    nameModal.id = "nameEditModal";
    nameModal.className = "modal cmr-royal-modal cmr-submodal hidden";
    nameModal.setAttribute("role", "dialog");
    nameModal.setAttribute("aria-modal", "true");
    nameModal.setAttribute("aria-labelledby", "nameEditTitle");
    nameModal.innerHTML = `
      <div class="cmr-dialog-card cmr-dialog-compact">
        <button type="button" class="cmr-dialog-close" id="nameEditCloseBtn" aria-label="إغلاق">✕</button>
        <div class="cmr-dialog-header">
          <img src="./assets/extracted/ui/icon_papyrus_scroll.png" alt="">
          <h2 id="nameEditTitle">تعديل اسم اللاعب</h2>
        </div>
        <form id="cmrNameEditForm" class="cmr-name-form" novalidate>
          <label for="cmrNameEditInput" id="cmrNameEditLabel">اسم اللاعب الملكي</label>
          <input type="text" id="cmrNameEditInput" maxlength="24" autocomplete="nickname" required>
          <p class="cmr-form-error hidden" id="cmrNameEditError" role="alert"></p>
          <div class="cmr-dialog-actions">
            <button type="submit" class="cmr-gold-btn" id="cmrNameSaveBtn">حفظ</button>
            <button type="button" class="cmr-purple-btn" id="cmrNameCancelBtn">إلغاء</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(nameModal);
    nameModal.addEventListener("click", (e) => {
      if (e.target === nameModal) nameModal.classList.add("hidden");
    });
    nameModal.querySelector("#nameEditCloseBtn").addEventListener("click", () => nameModal.classList.add("hidden"));
    nameModal.querySelector("#cmrNameCancelBtn").addEventListener("click", () => nameModal.classList.add("hidden"));
    nameModal.querySelector("#cmrNameEditForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = nameModal.querySelector("#cmrNameEditInput");
      const errEl = nameModal.querySelector("#cmrNameEditError");
      const val = String(input.value || "").trim();
      if (val.length < 2) {
        errEl.textContent = val.length === 0 ? t("nameErrorEmpty") : t("nameErrorShort");
        errEl.classList.remove("hidden");
        input.focus();
        return;
      }
      const res = setPlayerName(val);
      if (!res.ok) {
        errEl.textContent = res.error;
        errEl.classList.remove("hidden");
        return;
      }
      errEl.classList.add("hidden");
      nameModal.classList.add("hidden");
      vibrate(18);
      window.CMRAudio?.playSfx?.("win");
      showToast(t("nameSaved"), true);
    });
    return nameModal;
  }

  function openNameEditor() {
    ensureNameModal();
    const st = getProfileState();
    nameModal.querySelector("#nameEditTitle").textContent = t("editNameTitle");
    nameModal.querySelector("#cmrNameEditLabel").textContent = t("loginNameLabel");
    nameModal.querySelector("#cmrNameSaveBtn").textContent = t("saveBtn");
    nameModal.querySelector("#cmrNameCancelBtn").textContent = t("cancelBtn");
    nameModal.querySelector("#nameEditCloseBtn").setAttribute("aria-label", t("closeBtn"));
    const input = nameModal.querySelector("#cmrNameEditInput");
    const errEl = nameModal.querySelector("#cmrNameEditError");
    input.placeholder = t("namePlaceholder");
    input.value = st.displayName;
    errEl.classList.add("hidden");
    nameModal.classList.remove("hidden");
    setTimeout(() => {
      input.focus();
      input.select?.();
    }, 50);
  }

  // ---- Achievements Modal (Uses ALL Extracted Badge Assets) ----
  function ensureAchievementsModal() {
    if (achievementsModal) return achievementsModal;
    achievementsModal = document.createElement("div");
    achievementsModal.id = "achievementsModal";
    achievementsModal.className = "modal cmr-royal-modal hidden";
    achievementsModal.setAttribute("role", "dialog");
    achievementsModal.setAttribute("aria-modal", "true");
    achievementsModal.setAttribute("aria-labelledby", "achievementsModalTitle");
    achievementsModal.innerHTML = `
      <div class="cmr-dialog-card cmr-dialog-wide">
        <button type="button" class="cmr-dialog-close" id="achCloseBtn" aria-label="إغلاق">✕</button>
        <div class="cmr-dialog-header">
          <img src="./assets/extracted/ui/badge_laurel_trophy.png" alt="">
          <div>
            <h2 id="achievementsModalTitle">الإنجازات الملكية</h2>
            <p class="cmr-dialog-sub" id="achSummarySub"></p>
          </div>
        </div>
        <div class="cmr-ach-list" id="cmrAchList"></div>
      </div>
    `;
    document.body.appendChild(achievementsModal);
    achievementsModal.addEventListener("click", (e) => {
      if (e.target === achievementsModal) achievementsModal.classList.add("hidden");
    });
    achievementsModal.querySelector("#achCloseBtn").addEventListener("click", () => {
      achievementsModal.classList.add("hidden");
    });
    return achievementsModal;
  }

  function renderAchievementsModal() {
    if (!achievementsModal) return;
    const st = getProfileState();
    const isEn = getLanguage() === "en";
    achievementsModal.querySelector("#achievementsModalTitle").textContent = t("achievementsTitle");
    achievementsModal.querySelector("#achCloseBtn").setAttribute("aria-label", t("closeBtn"));
    achievementsModal.querySelector("#achSummarySub").textContent = `${st.unlockedAchCount} / ${st.achievements.length} ${t("unlockedBadge")}`;

    const list = achievementsModal.querySelector("#cmrAchList");
    list.innerHTML = "";
    st.achievements.forEach((ach) => {
      const pct = Number.isFinite(ach.percent) ? ach.percent : Math.min(100, Math.round((ach.current / Math.max(1, ach.target)) * 100));
      const rCoins = ach.reward?.coins || 0;
      const rGems = ach.reward?.gems || 0;
      const row = document.createElement("div");
      row.className = `cmr-ach-card ${ach.unlocked ? "is-unlocked" : "is-locked"} ${ach.claimed ? "is-claimed" : ""}`;
      row.innerHTML = `
        <img class="cmr-ach-badge" src="${ach.badge}" alt="">
        <div class="cmr-ach-body">
          <div class="cmr-ach-head">
            <strong>${isEn ? ach.nameEn : ach.nameAr}</strong>
            <span class="cmr-ach-rewards">
              <img src="./assets/extracted/ui/icon_coin_gold.png" alt="">+${rCoins}
              <img src="./assets/extracted/ui/icon_gem_purple.png" alt="">+${rGems}
            </span>
          </div>
          <small>${isEn ? ach.descEn : ach.descAr}</small>
          <div class="cmr-ach-bar-wrap">
            <span class="cmr-ach-bar"><i style="width:${pct}%"></i></span>
            <em>${ach.current}/${ach.target}</em>
          </div>
        </div>
        <div class="cmr-ach-action">
          ${
            ach.claimed
              ? `<span class="cmr-status-chip is-done">${t("claimedBadge")}</span>`
              : ach.unlocked
              ? `<button type="button" class="cmr-claim-btn" data-claim-ach="${ach.id}">${t("claimBtn")}</button>`
              : `<span class="cmr-status-chip is-locked">${t("lockedBadge")}</span>`
          }
        </div>
      `;
      const claimBtn = row.querySelector("[data-claim-ach]");
      if (claimBtn) {
        claimBtn.addEventListener("click", () => {
          if (prefs.claimedAchievements.includes(ach.id)) return;
          prefs.claimedAchievements.push(ach.id);
          savePrefs();
          creditWallet(rCoins, rGems);
          vibrate([20, 30, 20]);
          window.CMRAudio?.playSfx?.("win");
          showToast(t("rewardClaimed", { coins: rCoins, gems: rGems }), true);
          renderAchievementsModal();
          refreshAllUI();
        });
      }
      list.appendChild(row);
    });
  }

  function openAchievements() {
    ensureAchievementsModal();
    renderAchievementsModal();
    achievementsModal.classList.remove("hidden");
  }

  // ---- Daily Rewards Calendar Modal ----
  function ensureCalendarModal() {
    if (calendarModal) return calendarModal;
    calendarModal = document.createElement("div");
    calendarModal.id = "calendarModal";
    calendarModal.className = "modal cmr-royal-modal hidden";
    calendarModal.setAttribute("role", "dialog");
    calendarModal.setAttribute("aria-modal", "true");
    calendarModal.setAttribute("aria-labelledby", "calendarModalTitle");
    calendarModal.innerHTML = `
      <div class="cmr-dialog-card cmr-dialog-wide">
        <button type="button" class="cmr-dialog-close" id="calCloseBtn" aria-label="إغلاق">✕</button>
        <div class="cmr-dialog-header">
          <img src="./assets/extracted/ui/btn_calendar.png" alt="">
          <div>
            <h2 id="calendarModalTitle">التقويم الملكي اليومي</h2>
            <p class="cmr-dialog-sub" id="calSubText"></p>
          </div>
        </div>
        <div class="cmr-cal-grid" id="cmrCalGrid"></div>
      </div>
    `;
    document.body.appendChild(calendarModal);
    calendarModal.addEventListener("click", (e) => {
      if (e.target === calendarModal) calendarModal.classList.add("hidden");
    });
    calendarModal.querySelector("#calCloseBtn").addEventListener("click", () => calendarModal.classList.add("hidden"));
    return calendarModal;
  }

  function openCalendar() {
    ensureCalendarModal();
    calendarModal.querySelector("#calendarModalTitle").textContent = t("calendarTitle");
    calendarModal.querySelector("#calSubText").textContent = t("calendarSubtitle");
    calendarModal.querySelector("#calCloseBtn").setAttribute("aria-label", t("closeBtn"));

    const today = new Date().toISOString().slice(0, 10);
    const nextDay = Math.min(7, prefs.dailyClaims.length + 1);
    const canClaimToday = prefs.lastDailyDate !== today && prefs.dailyClaims.length < 7;
    const grid = calendarModal.querySelector("#cmrCalGrid");
    grid.innerHTML = "";

    DAILY_REWARDS.forEach((item) => {
      const claimed = prefs.dailyClaims.includes(item.day);
      const isToday = !claimed && item.day === nextDay && canClaimToday;
      const card = document.createElement("div");
      card.className = `cmr-cal-day ${claimed ? "is-claimed" : isToday ? "is-ready" : "is-future"}`;
      card.innerHTML = `
        <span class="cmr-cal-day-num">${t("dayLabel", { d: item.day })}</span>
        <img src="${item.icon}" alt="">
        <div class="cmr-cal-reward-line">
          <span>+${item.coins}</span>
          <span>💎+${item.gems}</span>
        </div>
        ${
          claimed
            ? `<span class="cmr-status-chip is-done">${t("claimedBadge")}</span>`
            : isToday
            ? `<button type="button" class="cmr-claim-btn">${t("claimBtn")}</button>`
            : `<span class="cmr-status-chip is-locked">${t("lockedBadge")}</span>`
        }
      `;
      const btn = card.querySelector(".cmr-claim-btn");
      if (btn) {
        btn.addEventListener("click", () => {
          prefs.dailyClaims.push(item.day);
          prefs.lastDailyDate = today;
          savePrefs();
          creditWallet(item.coins, item.gems);
          vibrate([20, 25, 20]);
          window.CMRAudio?.playSfx?.("win");
          showToast(t("rewardClaimed", { coins: item.coins, gems: item.gems }), true);
          openCalendar();
          refreshAllUI();
        });
      }
      grid.appendChild(card);
    });
    calendarModal.classList.remove("hidden");
  }

  // ---- Royal Mail Modal ----
  function ensureMailModal() {
    if (mailModal) return mailModal;
    mailModal = document.createElement("div");
    mailModal.id = "mailModal";
    mailModal.className = "modal cmr-royal-modal hidden";
    mailModal.setAttribute("role", "dialog");
    mailModal.setAttribute("aria-modal", "true");
    mailModal.setAttribute("aria-labelledby", "mailModalTitle");
    mailModal.innerHTML = `
      <div class="cmr-dialog-card cmr-dialog-wide">
        <button type="button" class="cmr-dialog-close" id="mailCloseBtn" aria-label="إغلاق">✕</button>
        <div class="cmr-dialog-header">
          <img src="./assets/extracted/ui/icon_papyrus_scroll.png" alt="">
          <div>
            <h2 id="mailModalTitle">البريد الملكي</h2>
            <p class="cmr-dialog-sub" id="mailSubText"></p>
          </div>
        </div>
        <div class="cmr-mail-list" id="cmrMailList"></div>
      </div>
    `;
    document.body.appendChild(mailModal);
    mailModal.addEventListener("click", (e) => {
      if (e.target === mailModal) mailModal.classList.add("hidden");
    });
    mailModal.querySelector("#mailCloseBtn").addEventListener("click", () => mailModal.classList.add("hidden"));
    return mailModal;
  }

  function openMail() {
    ensureMailModal();
    mailModal.querySelector("#mailModalTitle").textContent = t("mailTitle");
    mailModal.querySelector("#mailSubText").textContent = t("mailSubtitle");
    mailModal.querySelector("#mailCloseBtn").setAttribute("aria-label", t("closeBtn"));
    const list = mailModal.querySelector("#cmrMailList");
    const messages = [
      {
        id: "welcome_chest",
        icon: "./assets/extracted/ui/icon_royal_chest.png",
        title: t("welcomeMailTitle"),
        body: t("welcomeMailBody"),
        coins: 200,
        gems: 10,
      },
      {
        id: "palace_guide",
        icon: "./assets/extracted/ui/icon_papyrus_scroll.png",
        title: t("palaceGuideMailTitle"),
        body: t("palaceGuideMailBody"),
        coins: 0,
        gems: 0,
      },
    ];
    list.innerHTML = "";
    messages.forEach((m) => {
      const claimed = prefs.claimedMailIds.includes(m.id);
      const row = document.createElement("div");
      row.className = "cmr-mail-card";
      row.innerHTML = `
        <img src="${m.icon}" alt="">
        <div class="cmr-mail-copy">
          <strong>${m.title}</strong>
          <p>${m.body}</p>
        </div>
        ${
          m.coins > 0 || m.gems > 0
            ? claimed
              ? `<span class="cmr-status-chip is-done">${t("claimedBadge")}</span>`
              : `<button type="button" class="cmr-claim-btn">${t("claimBtn")}</button>`
            : ""
        }
      `;
      const btn = row.querySelector(".cmr-claim-btn");
      if (btn) {
        btn.addEventListener("click", () => {
          prefs.claimedMailIds.push(m.id);
          savePrefs();
          creditWallet(m.coins, m.gems);
          vibrate(22);
          window.CMRAudio?.playSfx?.("win");
          showToast(t("rewardClaimed", { coins: m.coins, gems: m.gems }), true);
          openMail();
          refreshAllUI();
        });
      }
      list.appendChild(row);
    });
    mailModal.classList.remove("hidden");
  }

  // ---- Kingdom Friends / Champions Modal ----
  function ensureFriendsModal() {
    if (friendsModal) return friendsModal;
    friendsModal = document.createElement("div");
    friendsModal.id = "friendsModal";
    friendsModal.className = "modal cmr-royal-modal hidden";
    friendsModal.setAttribute("role", "dialog");
    friendsModal.setAttribute("aria-modal", "true");
    friendsModal.setAttribute("aria-labelledby", "friendsModalTitle");
    friendsModal.innerHTML = `
      <div class="cmr-dialog-card cmr-dialog-wide">
        <button type="button" class="cmr-dialog-close" id="friendsCloseBtn" aria-label="إغلاق">✕</button>
        <div class="cmr-dialog-header">
          <img src="./assets/extracted/ui/btn_friends.png" alt="">
          <div>
            <h2 id="friendsModalTitle">أبطال المملكة</h2>
            <p class="cmr-dialog-sub" id="friendsSubText"></p>
          </div>
        </div>
        <div class="cmr-friends-list" id="cmrFriendsList"></div>
      </div>
    `;
    document.body.appendChild(friendsModal);
    friendsModal.addEventListener("click", (e) => {
      if (e.target === friendsModal) friendsModal.classList.add("hidden");
    });
    friendsModal.querySelector("#friendsCloseBtn").addEventListener("click", () => friendsModal.classList.add("hidden"));
    return friendsModal;
  }

  function openFriends() {
    ensureFriendsModal();
    const st = getProfileState();
    const isEn = getLanguage() === "en";
    friendsModal.querySelector("#friendsModalTitle").textContent = t("friendsTitle");
    friendsModal.querySelector("#friendsSubText").textContent = t("friendsSubtitle");
    friendsModal.querySelector("#friendsCloseBtn").setAttribute("aria-label", t("closeBtn"));

    const entries = [
      { name: isEn ? "Queen Luma" : "الملكة لوما", level: 28, stars: 840, avatar: "./assets/Picsart_26-11-17_02-37-45-792.png", isYou: false },
      { name: isEn ? "Pharaoh Ramses" : "الفرعون رمسيس", level: 22, stars: 615, avatar: "./assets/extracted/ui/avatar_pharaoh_portrait.png", isYou: false },
      { name: isEn ? "Dragon Prince" : "أمير التنين", level: 16, stars: 420, avatar: "./assets/Picsart_26-11-17_02-38-02-164.png", isYou: false },
      { name: isEn ? "Nile Guardian" : "حارس النيل", level: 9, stars: 195, avatar: "./assets/extracted/ui/badge_scarab.png", isYou: false },
      { name: st.displayName, level: st.progression.playerLevel, stars: st.stars, avatar: st.avatar.img, isYou: true },
    ].sort((a, b) => b.stars - a.stars || b.level - a.level);

    const list = friendsModal.querySelector("#cmrFriendsList");
    list.innerHTML = "";
    entries.forEach((entry, idx) => {
      const row = document.createElement("div");
      row.className = `cmr-friend-row ${entry.isYou ? "is-you" : ""}`;
      row.innerHTML = `
        <span class="cmr-rank-num">#${idx + 1}</span>
        <img class="cmr-friend-avatar" src="${entry.avatar}" alt="">
        <div class="cmr-friend-info">
          <strong>${entry.name} ${entry.isYou ? `<em>(${t("youTag")})</em>` : ""}</strong>
          <small>${t("levelShort")} ${entry.level}</small>
        </div>
        <span class="cmr-friend-stars">
          <img src="./assets/extracted/ui/icon_star_gold.png" alt="">
          <b>${entry.stars}</b>
        </span>
      `;
      list.appendChild(row);
    });
    friendsModal.classList.remove("hidden");
  }

  function refreshAllUI() {
    if (profileModal && !profileModal.classList.contains("hidden")) {
      updateProfileModalContent();
    }
    if (achievementsModal && !achievementsModal.classList.contains("hidden")) {
      renderAchievementsModal();
    }
    window.CMRRefreshWorldMap?.();
    window.CMRGame?.syncMenuUI?.();
  }

  // Expose APIs globally
  window.CMRI18n = {
    t,
    getLanguage,
    setLanguage,
    toggleLanguage,
    applyTranslations,
  };

  window.CMRProfile = {
    openProfile,
    closeProfile,
    openAvatarPicker,
    openNameEditor,
    openAchievements,
    openCalendar,
    openMail,
    openFriends,
    getProfileState,
    getPrefs: () => ({ ...prefs }),
    setPlayerName,
    setAvatar,
    vibrate,
    canNotify: () => Boolean(prefs.notificationsEnabled),
    hintsEnabled: () => Boolean(prefs.hintsEnabled),
    mailEnabled: () => Boolean(prefs.mailEnabled),
    onGameplayProgress: () => refreshAllUI(),
    refresh: refreshAllUI,
  };

  const onReady = () => {
    applyTranslations();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  } else {
    onReady();
  }
})();
