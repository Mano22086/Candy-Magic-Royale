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
      calendarTitle: "التقويم اليومي الملكي",
      calendarSubtitle: "سجّل دخولك يومياً لتحصل على العملات والمعززات وصندوق اليوم السابع!",
      dayLabel: "اليوم {d}",
      claimNowBtn: "استلام الآن",
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
      rewardClaimedSummary: "تم استلام المكافأة: {summary}!",
      alreadyClaimedToday: "تم استلام مكافأة اليوم بالفعل — عد غداً!",
      welcomeMailTitle: "هدية الترحيب الملكية",
      welcomeMailBody: "أهلاً بك في مملكة Candy Magic Royale! استلم هديتك الملكية لبدء المغامرة.",
      palaceGuideMailTitle: "مكافأة المطور الملكية",
      palaceGuideMailBody: "شكراً لانضمامك إلى أبطال القصور العشرة! إليك جواهر نادرة وقنبلة حلوى.",
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
      calendarSubtitle: "Check in daily for Gold Coins, Boosters & Day 7 Royal Chest!",
      dayLabel: "Day {d}",
      claimNowBtn: "Claim Now",
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
      rewardClaimedSummary: "Reward claimed: {summary}!",
      alreadyClaimedToday: "Today's reward is already claimed — come back tomorrow!",
      welcomeMailTitle: "Royal Welcome Gift",
      welcomeMailBody: "Welcome to Candy Magic Royale! Claim your starter gold & rockets.",
      palaceGuideMailTitle: "Developer Royal Reward",
      palaceGuideMailBody: "Thank you for exploring the 10 Palaces! Enjoy rare Gems & a Candy Bomb.",
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

  const ROYAL_FRAME_URLS = Object.freeze({
    mail: "./public/assets/aistudio/ui_1_royal_mail_270fc2e1.png",
    achievements: "./public/assets/aistudio/ui_2_royal_achievements_5dc43009.png",
    calendar: "./public/assets/aistudio/ui_3_daily_calendar_c966c2ca.png",
    champions: "./public/assets/aistudio/ui_4_kingdom_champions_5dc36eea.png",
  });

  const DAILY_REWARDS = [
    {
      day: 1,
      icon: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png",
      labelAr: "+150 عملة",
      labelEn: "+150 Coins",
      reward: { coins: 150 },
    },
    {
      day: 2,
      icon: "./public/assets/aistudio/01_booster_candy_rocket_b53df03d.png",
      labelAr: "+200 · ×1 صاروخ",
      labelEn: "+200 · ×1 Rocket",
      reward: { coins: 200, rockets: 1 },
    },
    {
      day: 3,
      icon: "./public/assets/aistudio/02_booster_magic_wand_e83e8cc8.png",
      labelAr: "+250 · ×1 عصا",
      labelEn: "+250 · ×1 Wand",
      reward: { coins: 250, paints: 1 },
    },
    {
      day: 4,
      icon: "./public/assets/aistudio/03_booster_candy_bomb_8bfca840.png",
      labelAr: "+300 · ×1 قنبلة",
      labelEn: "+300 · ×1 Bomb",
      reward: { coins: 300, hammer: 1 },
    },
    {
      day: 5,
      icon: "./public/assets/aistudio/04_booster_striped_candy_7749b182.png",
      labelAr: "+400 · ×1 مخططة",
      labelEn: "+400 · ×1 Striped",
      reward: { coins: 400, colors: 1 },
    },
    {
      day: 6,
      icon: "./public/assets/aistudio/combo_1_rocket_wand_bomb_coins_28a68e57.png",
      labelAr: "+500 · ×2 معززات",
      labelEn: "+500 · ×2 Boosters",
      reward: { coins: 500, rockets: 1, hammer: 1 },
    },
    {
      day: 7,
      isGrand: true,
      icon: "./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png",
      labelAr: "صندوق ملكي + 800 عملة + 15 جوهرة",
      labelEn: "Royal Chest + 800 Coins + 15 Gems",
      reward: { coins: 800, gems: 15, rockets: 2, paints: 1 },
    },
  ];

  const ROYAL_MAIL_MESSAGES = [
    {
      id: "welcome_chest",
      senderIcon: "./public/assets/aistudio/07_shop_treasure_chest_b7263fcf.png",
      titleAr: "هدية الترحيب الملكية",
      titleEn: "Royal Welcome Gift",
      bodyAr: "أهلاً بك في مملكة Candy Magic Royale! استلم ذهبك وصواريخ البداية.",
      bodyEn: "Welcome to Candy Magic Royale! Claim starter gold & rockets.",
      reward: { coins: 250, rockets: 2 },
    },
    {
      id: "dev_appreciation",
      senderIcon: "./assets/extracted/ui/icon_gem_purple.png",
      titleAr: "مكافأة المطور الملكية",
      titleEn: "Developer Royal Reward",
      bodyAr: "هدية خاصة من فريق اللعبة تقديراً لمغامرتك في القصور العشرة!",
      bodyEn: "A special thank-you gift from the game creators!",
      reward: { gems: 10, hammer: 1 },
    },
    {
      id: "pharaoh_event",
      senderIcon: "./public/assets/aistudio/05_booster_mystery_box_864a8fca.png",
      titleAr: "جائزة مهرجان القصور",
      titleEn: "Palace Festival Prize",
      bodyAr: "مكافأة فعالية القصر الذهبي: عملات ذهبية وعصا سحرية نجمية.",
      bodyEn: "Golden Palace event reward: Gold Coins & Magic Star Wand.",
      reward: { coins: 300, paints: 1 },
    },
    {
      id: "friend_hearts_luma",
      senderIcon: "./assets/Picsart_26-11-17_02-37-45-792.png",
      titleAr: "هدية قلوب من الملكة لوما",
      titleEn: "Hearts Gift from Queen Luma",
      bodyAr: "أرسلت لك الملكة لوما قلوباً وعملات لدعمك في المراحل القادمة!",
      bodyEn: "Queen Luma sent you extra hearts & coins for your journey!",
      reward: { lives: 2, coins: 120 },
    },
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
    grantStructuredReward({ coins: coinsAdd, gems: gemsAdd });
  }

  function grantStructuredReward(reward = {}) {
    if (!reward || typeof reward !== "object") return;
    if (window.CMRGame && typeof window.CMRGame.grantReward === "function") {
      window.CMRGame.grantReward(reward);
      return;
    }
    try {
      const saved = readSave();
      const maxStock = core()?.MAX_BOOSTER_STOCK || 25;
      const maxLives = core()?.MAX_LIVES || 5;
      saved.coins = Math.max(0, Math.floor(Number(saved.coins ?? 500)) + Math.floor(Number(reward.coins) || 0));
      saved.gems = Math.max(0, Math.floor(Number(saved.gems ?? 25)) + Math.floor(Number(reward.gems) || 0));
      saved.lives = Math.min(maxLives, Math.max(0, Math.floor(Number(saved.lives ?? maxLives)) + Math.floor(Number(reward.lives) || 0)));
      saved.rockets = Math.min(maxStock, Math.max(0, Math.floor(Number(saved.rockets ?? 3)) + Math.floor(Number(reward.rockets) || 0)));
      saved.hammer = Math.min(maxStock, Math.max(0, Math.floor(Number(saved.hammer ?? 3)) + Math.floor(Number(reward.hammer) || 0)));
      saved.paints = Math.min(maxStock, Math.max(0, Math.floor(Number(saved.paints ?? 3)) + Math.floor(Number(reward.paints) || 0)));
      saved.colors = Math.min(maxStock, Math.max(0, Math.floor(Number(saved.colors ?? 3)) + Math.floor(Number(reward.colors) || 0)));
      localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
    } catch (_) {}
    window.CMRRefreshWorldMap?.();
    window.CMRGame?.syncMenuUI?.();
  }

  function animateFlyingReward(sourceEl, reward = {}) {
    if (!sourceEl || typeof document === "undefined") return;
    const rect = sourceEl.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    const tokens = [];
    if (reward.coins) {
      tokens.push(
        { src: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png", targetSel: "#vmapResCoinsBtn" },
        { src: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png", targetSel: "#vmapResCoinsBtn" },
        { src: "./public/assets/aistudio/06_shop_gold_coin_50095eb1.png", targetSel: "#vmapResCoinsBtn" }
      );
    }
    if (reward.gems) {
      tokens.push(
        { src: "./assets/extracted/ui/icon_gem_purple.png", targetSel: "#vmapResGemsBtn" },
        { src: "./assets/extracted/ui/icon_gem_purple.png", targetSel: "#vmapResGemsBtn" }
      );
    }
    if (reward.lives) {
      tokens.push({ src: "./assets/extracted/ui/icon_heart_ruby.png", targetSel: "#vmapResHeartsBtn" });
    }
    if (reward.rockets) {
      tokens.push({ src: "./public/assets/aistudio/01_booster_candy_rocket_b53df03d.png", targetSel: "#vmapResCoinsBtn" });
    }
    if (reward.hammer) {
      tokens.push({ src: "./public/assets/aistudio/03_booster_candy_bomb_8bfca840.png", targetSel: "#vmapResCoinsBtn" });
    }
    if (reward.paints) {
      tokens.push({ src: "./public/assets/aistudio/02_booster_magic_wand_e83e8cc8.png", targetSel: "#vmapResCoinsBtn" });
    }
    if (reward.colors) {
      tokens.push({ src: "./public/assets/aistudio/04_booster_striped_candy_7749b182.png", targetSel: "#vmapResCoinsBtn" });
    }

    tokens.forEach((tok, idx) => {
      const targetEl = document.querySelector(tok.targetSel);
      const tRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth * 0.5, top: 28, width: 32, height: 24 };
      const endX = tRect.left + tRect.width / 2;
      const endY = tRect.top + tRect.height / 2;

      const el = document.createElement("img");
      el.className = "rf-fly-token";
      el.src = tok.src;
      el.alt = "";
      el.setAttribute("aria-hidden", "true");
      const jitterX = (idx % 2 === 0 ? 1 : -1) * (12 + idx * 6);
      el.style.left = `${startX}px`;
      el.style.top = `${startY}px`;
      el.style.setProperty("--fly-dx", `${Math.round(endX - startX)}px`);
      el.style.setProperty("--fly-dy", `${Math.round(endY - startY)}px`);
      el.style.setProperty("--fly-mid-x", `${Math.round((endX - startX) * 0.45 + jitterX)}px`);
      el.style.setProperty("--fly-mid-y", `${Math.round((endY - startY) * 0.35 - 48)}px`);
      el.style.animationDelay = `${idx * 65}ms`;
      document.body.appendChild(el);
      setTimeout(() => {
        el.remove();
        if (targetEl) {
          targetEl.classList.remove("rf-balance-bump");
          void targetEl.offsetWidth;
          targetEl.classList.add("rf-balance-bump");
          setTimeout(() => targetEl.classList.remove("rf-balance-bump"), 360);
        }
      }, 760 + idx * 65);
    });
  }

  function formatRewardBadgesHtml(reward = {}, isEn = false) {
    const pills = [];
    if (reward.coins) {
      pills.push(`<span class="rf-rew-pill"><img src="./public/assets/aistudio/06_shop_gold_coin_50095eb1.png" alt="">+${reward.coins}</span>`);
    }
    if (reward.gems) {
      pills.push(`<span class="rf-rew-pill is-gem"><img src="./assets/extracted/ui/icon_gem_purple.png" alt="">+${reward.gems}</span>`);
    }
    if (reward.lives) {
      pills.push(`<span class="rf-rew-pill is-heart"><img src="./assets/extracted/ui/icon_heart_ruby.png" alt="">+${reward.lives}</span>`);
    }
    if (reward.rockets) {
      pills.push(`<span class="rf-rew-pill is-booster"><img src="./public/assets/aistudio/01_booster_candy_rocket_b53df03d.png" alt="">×${reward.rockets}</span>`);
    }
    if (reward.hammer) {
      pills.push(`<span class="rf-rew-pill is-booster"><img src="./public/assets/aistudio/03_booster_candy_bomb_8bfca840.png" alt="">×${reward.hammer}</span>`);
    }
    if (reward.paints) {
      pills.push(`<span class="rf-rew-pill is-booster"><img src="./public/assets/aistudio/02_booster_magic_wand_e83e8cc8.png" alt="">×${reward.paints}</span>`);
    }
    if (reward.colors) {
      pills.push(`<span class="rf-rew-pill is-booster"><img src="./public/assets/aistudio/04_booster_striped_candy_7749b182.png" alt="">×${reward.colors}</span>`);
    }
    return pills.join("") || (isEn ? "Gift" : "هدية");
  }

  function getTodayLocalKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function getUnclaimedMailCount() {
    return ROYAL_MAIL_MESSAGES.filter(
      (m) => m.reward && !prefs.claimedMailIds.includes(m.id)
    ).length;
  }

  function canClaimDailyCalendarToday() {
    const today = getTodayLocalKey();
    return prefs.lastDailyDate !== today;
  }

  function openAnimatedModal(modalEl) {
    if (!modalEl) return;
    clearTimeout(modalEl.__rfCloseTimer);
    modalEl.classList.remove("hidden", "is-closing");
    modalEl.classList.remove("is-opening");
    void modalEl.offsetWidth;
    modalEl.classList.add("is-opening");
    window.CMRAudio?.playSfx?.("open");
  }

  function closeAnimatedModal(modalEl) {
    if (!modalEl || modalEl.classList.contains("hidden")) return;
    window.CMRAudio?.playSfx?.("cancel");
    modalEl.classList.remove("is-opening");
    modalEl.classList.add("is-closing");
    clearTimeout(modalEl.__rfCloseTimer);
    modalEl.__rfCloseTimer = setTimeout(() => {
      modalEl.classList.remove("is-closing");
      modalEl.classList.add("hidden");
    }, 180);
  }

  let externalLeaderboardProvider = null;

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
          {
            highestUnlocked,
            stars,
            coins,
            gems,
            stageStars,
            obstaclesBroken: saved.obstaclesBroken,
            rocketsCreated: saved.rocketsCreated,
            profileCustomized: prefs.profileCustomized,
          },
          claimedMap
        )
      : [];

    const unlockedAchCount = achievements.filter((a) => a.unlocked).length;
    const claimableAchCount = achievements.filter((a) => a.canClaim).length;
    const unclaimedMailCount = getUnclaimedMailCount();
    const canClaimDailyToday = canClaimDailyCalendarToday();
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
      unclaimedMailCount,
      canClaimDailyToday,
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

  // ---- 2. Royal Achievements Modal (ui_2_royal_achievements.png) ----
  function ensureAchievementsModal() {
    if (achievementsModal) return achievementsModal;
    achievementsModal = document.createElement("div");
    achievementsModal.id = "achievementsModal";
    achievementsModal.className = "modal rf-modal hidden";
    achievementsModal.setAttribute("role", "dialog");
    achievementsModal.setAttribute("aria-modal", "true");
    achievementsModal.setAttribute("aria-labelledby", "achievementsModalTitle");
    achievementsModal.innerHTML = `
      <div class="rf-stage rf-stage-achievements" dir="rtl">
        <img class="rf-frame-img" src="${ROYAL_FRAME_URLS.achievements}" alt="" aria-hidden="true" draggable="false">
        <h2 class="rf-ribbon-title rf-title-achievements" id="achievementsModalTitle">الإنجازات الملكية</h2>
        <button type="button" class="rf-close-orb rf-close-achievements" id="achCloseBtn" aria-label="إغلاق">
          <span aria-hidden="true">✕</span>
        </button>
        <div class="rf-inner-safe rf-safe-achievements">
          <div class="rf-summary-pill" id="achSummarySub"></div>
          <div class="rf-scroll-list rf-ach-list" id="cmrAchList"></div>
        </div>
      </div>
    `;
    document.body.appendChild(achievementsModal);
    achievementsModal.addEventListener("click", (e) => {
      if (e.target === achievementsModal) closeAnimatedModal(achievementsModal);
    });
    achievementsModal.querySelector("#achCloseBtn").addEventListener("click", () => {
      closeAnimatedModal(achievementsModal);
    });
    return achievementsModal;
  }

  function renderAchievementsModal() {
    if (!achievementsModal) return;
    const st = getProfileState();
    const isEn = getLanguage() === "en";
    const stage = achievementsModal.querySelector(".rf-stage");
    if (stage) stage.setAttribute("dir", isEn ? "ltr" : "rtl");
    achievementsModal.querySelector("#achievementsModalTitle").textContent = t("achievementsTitle");
    achievementsModal.querySelector("#achCloseBtn").setAttribute("aria-label", t("closeBtn"));
    achievementsModal.querySelector("#achSummarySub").textContent = isEn
      ? `${st.unlockedAchCount} / ${st.achievements.length} Achievements Unlocked`
      : `المكتمل: ${st.unlockedAchCount} من ${st.achievements.length} إنجاز`;

    const list = achievementsModal.querySelector("#cmrAchList");
    list.innerHTML = "";
    st.achievements.forEach((ach) => {
      const pct = Number.isFinite(ach.percent) ? ach.percent : Math.min(100, Math.round((ach.current / Math.max(1, ach.target)) * 100));
      const rCoins = ach.reward?.coins || 0;
      const rGems = ach.reward?.gems || 0;
      const row = document.createElement("article");
      row.className = `rf-ach-row ${ach.unlocked && !ach.claimed ? "is-ready" : ach.claimed ? "is-claimed" : "is-progress"}`;
      row.innerHTML = `
        <div class="rf-ach-icon-box">
          <img class="rf-ach-icon" src="${ach.badge}" alt="" draggable="false">
        </div>
        <div class="rf-ach-mid">
          <strong class="rf-ach-name">${isEn ? ach.nameEn : ach.nameAr}</strong>
          <p class="rf-ach-desc">${isEn ? ach.descEn : ach.descAr}</p>
          <div class="rf-ach-prog-wrap">
            <span class="rf-ach-prog-track"><i class="rf-ach-prog-fill" style="width:${pct}%"></i></span>
            <em class="rf-ach-prog-num" dir="ltr">${ach.current}/${ach.target}</em>
          </div>
          <div class="rf-rew-row">${formatRewardBadgesHtml({ coins: rCoins, gems: rGems }, isEn)}</div>
        </div>
        <div class="rf-ach-cta">
          ${
            ach.claimed
              ? `<span class="rf-badge-done">✓</span>`
              : ach.unlocked
              ? `<button type="button" class="rf-gold-claim-btn is-glowing" data-claim-ach="${ach.id}">${t("claimBtn")}</button>`
              : `<span class="rf-badge-pct" dir="ltr">${pct}%</span>`
          }
        </div>
      `;
      const claimBtn = row.querySelector("[data-claim-ach]");
      if (claimBtn) {
        claimBtn.addEventListener("click", () => {
          if (prefs.claimedAchievements.includes(ach.id)) return;
          prefs.claimedAchievements.push(ach.id);
          savePrefs();
          animateFlyingReward(claimBtn, { coins: rCoins, gems: rGems });
          grantStructuredReward({ coins: rCoins, gems: rGems });
          vibrate([20, 30, 20]);
          window.CMRAudio?.playSfx?.("reward");
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
    openAnimatedModal(achievementsModal);
  }

  // ---- 3. Daily Royal Calendar Modal (ui_3_daily_calendar.png) ----
  function ensureCalendarModal() {
    if (calendarModal) return calendarModal;
    calendarModal = document.createElement("div");
    calendarModal.id = "calendarModal";
    calendarModal.className = "modal rf-modal hidden";
    calendarModal.setAttribute("role", "dialog");
    calendarModal.setAttribute("aria-modal", "true");
    calendarModal.setAttribute("aria-labelledby", "calendarModalTitle");
    calendarModal.innerHTML = `
      <div class="rf-stage rf-stage-calendar" dir="rtl">
        <img class="rf-frame-img" src="${ROYAL_FRAME_URLS.calendar}" alt="" aria-hidden="true" draggable="false">
        <h2 class="rf-ribbon-title rf-title-calendar" id="calendarModalTitle">التقويم اليومي الملكي</h2>
        <button type="button" class="rf-close-orb rf-close-calendar" id="calCloseBtn" aria-label="إغلاق">
          <span aria-hidden="true">✕</span>
        </button>
        <div class="rf-inner-safe rf-safe-calendar">
          <p class="rf-cal-banner" id="calSubText"></p>
          <div class="rf-scroll-list rf-cal-wrap">
            <div class="rf-cal-grid" id="cmrCalGrid"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(calendarModal);
    calendarModal.addEventListener("click", (e) => {
      if (e.target === calendarModal) closeAnimatedModal(calendarModal);
    });
    calendarModal.querySelector("#calCloseBtn").addEventListener("click", () => {
      closeAnimatedModal(calendarModal);
    });
    return calendarModal;
  }

  function renderCalendarModal() {
    ensureCalendarModal();
    const isEn = getLanguage() === "en";
    const stage = calendarModal.querySelector(".rf-stage");
    if (stage) stage.setAttribute("dir", isEn ? "ltr" : "rtl");
    calendarModal.querySelector("#calendarModalTitle").textContent = t("calendarTitle");
    calendarModal.querySelector("#calCloseBtn").setAttribute("aria-label", t("closeBtn"));

    const today = getTodayLocalKey();
    // Repeating 7-day cycle: reset cleanly on a new calendar day after completing Day 7
    if (prefs.dailyClaims.length >= 7 && prefs.lastDailyDate !== today) {
      prefs.dailyClaims = [];
      savePrefs();
    }

    const canClaimToday = prefs.lastDailyDate !== today;
    const nextDay = Math.min(7, prefs.dailyClaims.length + 1);
    const subEl = calendarModal.querySelector("#calSubText");
    if (subEl) {
      subEl.textContent = canClaimToday
        ? isEn
          ? `Day ${nextDay} reward is ready — claim it now!`
          : `مكافأة اليوم ${nextDay} جاهزة — استلمها الآن!`
        : t("alreadyClaimedToday");
    }

    const grid = calendarModal.querySelector("#cmrCalGrid");
    grid.innerHTML = "";

    DAILY_REWARDS.forEach((item) => {
      const claimed = prefs.dailyClaims.includes(item.day);
      const isToday = !claimed && item.day === nextDay && canClaimToday;
      const card = document.createElement("article");
      card.className = [
        "rf-cal-card",
        item.isGrand ? "is-grand" : "",
        claimed ? "is-claimed" : isToday ? "is-today" : "is-upcoming",
      ]
        .filter(Boolean)
        .join(" ");

      card.innerHTML = `
        <div class="rf-cal-top">
          <span class="rf-cal-day-pill">${t("dayLabel", { d: item.day })}</span>
          ${
            claimed
              ? `<span class="rf-cal-check" aria-label="${t("claimedBadge")}">✓</span>`
              : !isToday
              ? `<span class="rf-cal-lock" aria-hidden="true">🔒</span>`
              : `<span class="rf-cal-star" aria-hidden="true">✨</span>`
          }
        </div>
        <div class="rf-cal-body">
          <img class="rf-cal-icon" src="${item.icon}" alt="" draggable="false">
          <div class="rf-cal-info">
            <span class="rf-cal-reward-txt">${isEn ? item.labelEn : item.labelAr}</span>
            ${
              item.isGrand
                ? `<div class="rf-rew-row">${formatRewardBadgesHtml(item.reward, isEn)}</div>`
                : ""
            }
          </div>
        </div>
        <div class="rf-cal-foot">
          ${
            claimed
              ? `<span class="rf-cal-state-done">${t("claimedBadge")}</span>`
              : isToday
              ? `<button type="button" class="rf-gold-claim-btn rf-cal-claim-btn is-glowing" data-cal-day="${item.day}">${t("claimNowBtn")}</button>`
              : `<span class="rf-cal-state-lock">${t("lockedBadge")}</span>`
          }
        </div>
      `;

      const btn = card.querySelector("[data-cal-day]");
      if (btn) {
        btn.addEventListener("click", () => {
          if (prefs.lastDailyDate === today || prefs.dailyClaims.includes(item.day)) return;
          prefs.dailyClaims.push(item.day);
          prefs.lastDailyDate = today;
          savePrefs();
          animateFlyingReward(btn, item.reward);
          grantStructuredReward(item.reward);
          vibrate([20, 28, 22]);
          window.CMRAudio?.playSfx?.(item.isGrand ? "win" : "reward");
          const summary = core()?.formatRewardSummaryArabic?.(item.reward) || (isEn ? item.labelEn : item.labelAr);
          showToast(t("rewardClaimedSummary", { summary }), true);
          renderCalendarModal();
          refreshAllUI();
        });
      }
      grid.appendChild(card);
    });
  }

  function openCalendar() {
    renderCalendarModal();
    openAnimatedModal(calendarModal);
  }

  // ---- 1. Royal Mail Modal (ui_1_royal_mail.png) ----
  function ensureMailModal() {
    if (mailModal) return mailModal;
    mailModal = document.createElement("div");
    mailModal.id = "mailModal";
    mailModal.className = "modal rf-modal hidden";
    mailModal.setAttribute("role", "dialog");
    mailModal.setAttribute("aria-modal", "true");
    mailModal.setAttribute("aria-labelledby", "mailModalTitle");
    mailModal.innerHTML = `
      <div class="rf-stage rf-stage-mail" dir="rtl">
        <img class="rf-frame-img" src="${ROYAL_FRAME_URLS.mail}" alt="" aria-hidden="true" draggable="false">
        <h2 class="rf-ribbon-title rf-title-mail" id="mailModalTitle">البريد الملكي</h2>
        <button type="button" class="rf-close-orb rf-close-mail" id="mailCloseBtn" aria-label="إغلاق">
          <span aria-hidden="true">✕</span>
        </button>
        <div class="rf-inner-safe rf-safe-mail">
          <div class="rf-summary-pill" id="mailSubText"></div>
          <div class="rf-scroll-list rf-mail-list" id="cmrMailList"></div>
        </div>
      </div>
    `;
    document.body.appendChild(mailModal);
    mailModal.addEventListener("click", (e) => {
      if (e.target === mailModal) closeAnimatedModal(mailModal);
    });
    mailModal.querySelector("#mailCloseBtn").addEventListener("click", () => {
      closeAnimatedModal(mailModal);
    });
    return mailModal;
  }

  function renderMailModal() {
    ensureMailModal();
    const isEn = getLanguage() === "en";
    const stage = mailModal.querySelector(".rf-stage");
    if (stage) stage.setAttribute("dir", isEn ? "ltr" : "rtl");
    mailModal.querySelector("#mailModalTitle").textContent = t("mailTitle");
    mailModal.querySelector("#mailCloseBtn").setAttribute("aria-label", t("closeBtn"));

    const unclaimed = getUnclaimedMailCount();
    const subEl = mailModal.querySelector("#mailSubText");
    if (subEl) {
      subEl.textContent =
        unclaimed > 0
          ? isEn
            ? `${unclaimed} Royal Gifts Waiting to Claim`
            : `لديك ${unclaimed} رسائل وهدايا بانتظار الاستلام`
          : isEn
          ? "All royal gifts claimed — inbox up to date!"
          : "تم استلام جميع الهدايا الملكية!";
    }

    const list = mailModal.querySelector("#cmrMailList");
    list.innerHTML = "";

    ROYAL_MAIL_MESSAGES.forEach((m) => {
      const claimed = prefs.claimedMailIds.includes(m.id);
      const card = document.createElement("article");
      card.className = `rf-mail-card ${claimed ? "is-claimed" : "is-unread"}`;
      card.dataset.mailId = m.id;
      card.innerHTML = `
        <div class="rf-mail-sender-box">
          <img src="${m.senderIcon}" alt="" draggable="false">
          ${!claimed ? '<span class="rf-unread-dot" aria-hidden="true"></span>' : ""}
        </div>
        <div class="rf-mail-mid">
          <strong class="rf-mail-title">${isEn ? m.titleEn : m.titleAr}</strong>
          <p class="rf-mail-desc">${isEn ? m.bodyEn : m.bodyAr}</p>
          <div class="rf-rew-row">${formatRewardBadgesHtml(m.reward, isEn)}</div>
        </div>
        <div class="rf-mail-cta">
          ${
            claimed
              ? `<span class="rf-badge-done">${t("claimedBadge")}</span>`
              : `<button type="button" class="rf-gold-claim-btn is-glowing" data-claim-mail="${m.id}">${t("claimBtn")}</button>`
          }
        </div>
      `;

      const btn = card.querySelector("[data-claim-mail]");
      if (btn) {
        btn.addEventListener("click", () => {
          if (prefs.claimedMailIds.includes(m.id)) return;
          prefs.claimedMailIds.push(m.id);
          savePrefs();
          animateFlyingReward(btn, m.reward);
          grantStructuredReward(m.reward);
          vibrate(22);
          window.CMRAudio?.playSfx?.("reward");
          const summary = core()?.formatRewardSummaryArabic?.(m.reward) || "";
          showToast(t("rewardClaimedSummary", { summary }), true);
          renderMailModal();
          refreshAllUI();
        });
      }
      list.appendChild(card);
    });
  }

  function openMail() {
    renderMailModal();
    openAnimatedModal(mailModal);
  }

  // ---- 4. Kingdom Champions / Leaderboard Modal (ui_4_kingdom_champions.png) ----
  function ensureFriendsModal() {
    if (friendsModal) return friendsModal;
    friendsModal = document.createElement("div");
    friendsModal.id = "friendsModal";
    friendsModal.className = "modal rf-modal hidden";
    friendsModal.setAttribute("role", "dialog");
    friendsModal.setAttribute("aria-modal", "true");
    friendsModal.setAttribute("aria-labelledby", "friendsModalTitle");
    friendsModal.innerHTML = `
      <div class="rf-stage rf-stage-champions" dir="rtl">
        <img class="rf-frame-img" src="${ROYAL_FRAME_URLS.champions}" alt="" aria-hidden="true" draggable="false">
        <h2 class="rf-ribbon-title rf-title-champions" id="friendsModalTitle">أبطال المملكة</h2>
        <button type="button" class="rf-close-orb rf-close-champions" id="friendsCloseBtn" aria-label="إغلاق">
          <span aria-hidden="true">✕</span>
        </button>
        <div class="rf-inner-safe rf-safe-champions">
          <div class="rf-scroll-list rf-champ-list" id="cmrFriendsList"></div>
          <div class="rf-champ-pinned" id="cmrFriendsPinned" aria-label="ترتيبك الحالي"></div>
        </div>
      </div>
    `;
    document.body.appendChild(friendsModal);
    friendsModal.addEventListener("click", (e) => {
      if (e.target === friendsModal) closeAnimatedModal(friendsModal);
    });
    friendsModal.querySelector("#friendsCloseBtn").addEventListener("click", () => {
      closeAnimatedModal(friendsModal);
    });
    return friendsModal;
  }

  function buildLeaderboardEntries(st, isEn, externalRows = null) {
    const playerPalace = Math.min(10, Math.floor((st.highestUnlocked - 1) / 100) + 1);
    const playerScore = st.stars * 120 + st.progression.completedStages * 250;

    const baseRivals = Array.isArray(externalRows) && externalRows.length > 0
      ? externalRows
      : [
          {
            name: isEn ? "Queen Luma" : "الملكة لوما",
            palace: 9,
            stage: 845,
            stars: 2420,
            score: 501650,
            avatar: "./assets/Picsart_26-11-17_02-37-45-792.png",
            isYou: false,
          },
          {
            name: isEn ? "Pharaoh Ramses" : "الفرعون رمسيس",
            palace: 7,
            stage: 632,
            stars: 1790,
            score: 372800,
            avatar: "./assets/extracted/ui/avatar_pharaoh_portrait.png",
            isYou: false,
          },
          {
            name: isEn ? "Dragon Prince" : "أمير التنين",
            palace: 5,
            stage: 455,
            stars: 1210,
            score: 258950,
            avatar: "./assets/Picsart_26-11-17_02-38-02-164.png",
            isYou: false,
          },
          {
            name: isEn ? "Cleopatra Star" : "كليوباترا النجوم",
            palace: 4,
            stage: 318,
            stars: 840,
            score: 180300,
            avatar: "./assets/extracted/ui/badge_crown_laurel.png",
            isYou: false,
          },
          {
            name: isEn ? "Nile Guardian" : "حارس النيل",
            palace: 3,
            stage: 214,
            stars: 530,
            score: 117100,
            avatar: "./assets/extracted/ui/badge_scarab.png",
            isYou: false,
          },
          {
            name: isEn ? "Oasis Knight" : "فارس الواحة",
            palace: 2,
            stage: 128,
            stars: 310,
            score: 69200,
            avatar: "./assets/extracted/ui/badge_star_shield.png",
            isYou: false,
          },
          {
            name: isEn ? "Luxor Mage" : "ساحر الأقصر",
            palace: 1,
            stage: 54,
            stars: 128,
            score: 28860,
            avatar: "./assets/extracted/ui/badge_swords_shield.png",
            isYou: false,
          },
        ];

    const hasYou = baseRivals.some((r) => r.isYou);
    const merged = hasYou
      ? [...baseRivals]
      : [
          ...baseRivals,
          {
            name: st.displayName,
            palace: playerPalace,
            stage: st.highestUnlocked,
            stars: st.stars,
            score: playerScore,
            avatar: st.avatar.img,
            isYou: true,
          },
        ];

    return merged.sort((a, b) => b.stars - a.stars || b.stage - a.stage || b.score - a.score);
  }

  function renderLeaderboardRows(entries, isEn) {
    const list = friendsModal.querySelector("#cmrFriendsList");
    const pinned = friendsModal.querySelector("#cmrFriendsPinned");
    if (!list) return;
    list.innerHTML = "";

    const crownIcons = ["👑", "🥈", "🥉"];
    let playerEntry = null;
    let playerRank = entries.length;

    entries.forEach((entry, idx) => {
      const rank = idx + 1;
      if (entry.isYou) {
        playerEntry = entry;
        playerRank = rank;
      }
      const tierClass = rank === 1 ? "is-gold" : rank === 2 ? "is-silver" : rank === 3 ? "is-bronze" : "";
      const row = document.createElement("article");
      row.className = `rf-champ-row ${tierClass} ${entry.isYou ? "is-you" : ""}`;
      row.innerHTML = `
        <div class="rf-champ-rank ${tierClass}">
          ${rank <= 3 ? `<span class="rf-crown-icon" aria-hidden="true">${crownIcons[idx]}</span>` : ""}
          <b>#${rank}</b>
        </div>
        <img class="rf-champ-avatar" src="${entry.avatar}" alt="" draggable="false">
        <div class="rf-champ-info">
          <strong>${entry.name} ${entry.isYou ? `<em>(${t("youTag")})</em>` : ""}</strong>
          <small>${isEn ? `Palace ${entry.palace} · Lv.${entry.stage}` : `القصر ${entry.palace} · مرحلة ${entry.stage}`}</small>
        </div>
        <div class="rf-champ-score">
          <span class="rf-champ-stars">
            <img src="./assets/extracted/ui/icon_star_gold.png" alt="">
            <b>${Number(entry.stars || 0).toLocaleString("en-US")}</b>
          </span>
          <small dir="ltr">${Number(entry.score || 0).toLocaleString("en-US")}</small>
        </div>
      `;
      list.appendChild(row);
    });

    if (pinned && playerEntry) {
      pinned.innerHTML = `
        <div class="rf-champ-row is-you is-pinned-bar">
          <div class="rf-champ-rank is-you-rank">
            <b>#${playerRank}</b>
          </div>
          <img class="rf-champ-avatar" src="${playerEntry.avatar}" alt="" draggable="false">
          <div class="rf-champ-info">
            <strong>${playerEntry.name} <em>(${t("youTag")})</em></strong>
            <small>${isEn ? `Palace ${playerEntry.palace} · Lv.${playerEntry.stage}` : `القصر ${playerEntry.palace} · مرحلة ${playerEntry.stage}`}</small>
          </div>
          <div class="rf-champ-score">
            <span class="rf-champ-stars">
              <img src="./assets/extracted/ui/icon_star_gold.png" alt="">
              <b>${Number(playerEntry.stars || 0).toLocaleString("en-US")}</b>
            </span>
            <small dir="ltr">${Number(playerEntry.score || 0).toLocaleString("en-US")}</small>
          </div>
        </div>
      `;
    }
  }

  function openFriends() {
    ensureFriendsModal();
    const st = getProfileState();
    const isEn = getLanguage() === "en";
    const stage = friendsModal.querySelector(".rf-stage");
    if (stage) stage.setAttribute("dir", isEn ? "ltr" : "rtl");
    friendsModal.querySelector("#friendsModalTitle").textContent = t("friendsTitle");
    friendsModal.querySelector("#friendsCloseBtn").setAttribute("aria-label", t("closeBtn"));

    const entries = buildLeaderboardEntries(st, isEn, null);
    renderLeaderboardRows(entries, isEn);
    openAnimatedModal(friendsModal);

    // Optional live sync hook when Firebase/Firestore leaderboard provider is connected
    const provider = externalLeaderboardProvider || window.CMRFirestoreLeaderboard?.fetchTopChampions;
    if (typeof provider === "function") {
      Promise.resolve(provider(st))
        .then((remoteRows) => {
          if (Array.isArray(remoteRows) && remoteRows.length > 0 && friendsModal && !friendsModal.classList.contains("hidden")) {
            renderLeaderboardRows(buildLeaderboardEntries(st, isEn, remoteRows), isEn);
          }
        })
        .catch(() => {});
    }
  }

  function refreshAllUI() {
    if (profileModal && !profileModal.classList.contains("hidden")) {
      updateProfileModalContent();
    }
    if (achievementsModal && !achievementsModal.classList.contains("hidden")) {
      renderAchievementsModal();
    }
    if (mailModal && !mailModal.classList.contains("hidden")) {
      renderMailModal();
    }
    if (calendarModal && !calendarModal.classList.contains("hidden")) {
      renderCalendarModal();
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
    setLeaderboardProvider: (fn) => {
      externalLeaderboardProvider = typeof fn === "function" ? fn : null;
    },
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
