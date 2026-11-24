/* Candy Magic Royale — Asset Bridge (lightweight, zero duplicate observers/listeners) */
(function () {
  "use strict";
  if (window.__CANDY_PACK_LOADED__) return;
  window.__CANDY_PACK_LOADED__ = true;

  window.CANDY_PACK = {
    ready: true,
    images: {
      booster_paint: "./10_paintbrush_rainbow.png",
      booster_shuffle: "./12_arrows_cross.png",
      booster_bomb: "./08_bomb_skull.png",
      booster_color: "./11_color_wheel.png",
      booster_rocket: "./09_rocket_striped.png",
      icon_settings: "./assets/packs/buttons/icon_settings.png",
      icon_volume: "./assets/packs/buttons/icon_volume.png",
      icon_mute: "./assets/packs/buttons/icon_mute.png",
      icon_home: "./assets/packs/buttons/icon_home.png",
      icon_refresh: "./assets/packs/buttons/icon_refresh.png",
      icon_coin: "./assets/packs/buttons/icon_coin.png",
      icon_heart: "./assets/packs/buttons/icon_heart.png",
      icon_crown: "./assets/packs/buttons/icon_crown.png",
      icon_star: "./assets/packs/buttons/icon_star.png",
      icon_cart: "./assets/packs/buttons/icon_cart.png",
      icon_check: "./assets/packs/buttons/icon_check.png",
      icon_cross: "./assets/packs/buttons/icon_cross.png",
      icon_lock: "./assets/packs/buttons/icon_lock.png",
    },
    playSound(name) {
      window.CMRAudio?.playSfx?.(name);
    },
  };
})();