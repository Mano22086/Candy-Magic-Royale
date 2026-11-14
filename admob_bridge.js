// AdMob Bridge for Candy Magic Royale
// Integrates with Capacitor / Cordova / GDevelop AdMob plugins
const AdMobManager = {
  isAvailable: false,
  rewardedAdId: 'ca-app-pub-3940256099942544/5224354917', // Test ID
  interstitialAdId: 'ca-app-pub-3940256099942544/1033173712', // Test ID
  init() {
    if (window.admob) {
      this.isAvailable = true;
      window.admob.rewarded.prepare({ adId: this.rewardedAdId });
      window.admob.interstitial.prepare({ adId: this.interstitialAdId });
    }
  },
  showRewarded(onReward, onFail) {
    if (window.admob && this.isAvailable) {
      window.admob.rewarded.show().then(onReward).catch(onFail);
    } else {
      // Browser fallback simulation (3 seconds)
      setTimeout(onReward, 3000);
    }
  },
  showInterstitial() {
    if (window.admob && this.isAvailable) {
      window.admob.interstitial.show();
    }
  }
};
window.AdMobManager = AdMobManager;
