/* Candy Magic Royale — real repository assets bridge.
   Replaces the missing candy-assets-pack.zip dependency with assets already committed. */
(function () {
  "use strict";
  if (window.__CANDY_PACK_LOADED__) return;
  window.__CANDY_PACK_LOADED__ = true;
  const P = window.CANDY_PACK = {
    ready: true, images: {}, sounds: {}, muted: false,
    playSound: function(name, rate, vol) {
      const channel = ({click:"click", confirm:"confirm", cancel:"close", coin:"reward", win:"reward", swish:"open", pop:"pop", mallet:"click"})[name] || "click";
      if (window.CMR_ASSETS && typeof window.CMR_ASSETS.playSfx === "function" && !P.muted) window.CMR_ASSETS.playSfx(channel);
    }
  };
  const img = (name) => "./" + name + ".png";
  P.images = {
    booster_hammer: img("10_paintbrush_rainbow"),
    booster_rocket: img("09_rocket_striped"),
    booster_bomb: img("08_bomb_skull"),
    booster_lightning: img("07_lightning_purple"),
    booster_mystery: img("12_arrows_cross"),
    icon_settings: img("01_star_gold"),
    icon_pause: img("07_lightning_purple"),
    icon_cart: img("14_bag_gold"),
    icon_trophy: img("01_star_gold"),
    icon_home: img("05_crown_green"),
    icon_mail: img("15_bag_rainbow"),
    btn_close_round: img("03_diamond_blue"),
    icon_volume: img("07_lightning_purple"),
    icon_mute: img("04_flower_purple"),
    slot_empty: img("03_diamond_blue")
  };
  try { P.muted = localStorage.getItem("candy_pack_muted") === "1"; } catch (_) {}
  function styles() {
    if (document.getElementById("candy-pack-addon-style")) return;
    const s=document.createElement("style"); s.id="candy-pack-addon-style";
    s.textContent=".cp-skinned-btn{background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important;background-color:transparent!important;border:0!important;box-shadow:none!important}.cp-skinned-btn:active{transform:scale(.94)}.cp-booster-icon{width:76%!important;height:76%!important;object-fit:contain!important;pointer-events:none!important;filter:drop-shadow(0 3px 5px #0008)}";
    document.head.appendChild(s);
  }
  function applyBoosters() {
    const map=[["paintBtn","10_paintbrush_rainbow.png"],["shuffleBtn","12_arrows_cross.png"],["bombBtn","08_bomb_skull.png"],["colorBtn","11_color_wheel.png"],["rocketBtn","09_rocket_striped.png"]];
    map.forEach(([id,file])=>{const b=document.getElementById(id);if(!b)return;const i=b.querySelector("img");if(i){i.src="./"+file;i.classList.add("cp-booster-icon");i.onerror=()=>{i.onerror=null;};}});
  }
  function hookSfx() {
    if (document.documentElement.dataset.candySfxHook) return;
    document.documentElement.dataset.candySfxHook="1";
    document.addEventListener("click",e=>{
      const b=e.target?.closest?.("button,[role=button],.wm-house,.wm-realm"); if(!b)return;
      const t=((b.id||"")+" "+(b.className||"")+" "+(b.textContent||"")).toLowerCase();
      const channel=/close|back|cancel|رجوع|إغلاق/.test(t)?"close":/play|start|next|continue|ابدأ|التالي/.test(t)?"confirm":/buy|shop|claim|شراء|هدية/.test(t)?"reward":/booster|paint|shuffle|bomb|rocket|color/.test(t)?"pop":/map|world|settings/.test(t)?"open":"click";
      if(window.CMR_ASSETS?.playSfx) window.CMR_ASSETS.playSfx(channel);
    },true);
  }
  function init(){styles();applyBoosters();hookSfx();new MutationObserver(applyBoosters).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();