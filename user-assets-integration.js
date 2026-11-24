(() => {
"use strict";
if (window.__CMR_USER_PACKS_V2__) return;
window.__CMR_USER_PACKS_V2__ = true;
const urls=[], sounds={}; let packs=null, busy=false;
const style=document.createElement("style");
style.textContent=".cmr-play-loading{position:relative!important;display:grid!important;place-items:center!important;gap:5px!important;min-height:58px!important;padding:7px 14px!important;overflow:hidden!important;pointer-events:none!important}.cmr-play-loading .cmr-play-label{font:900 14px Cairo,system-ui;color:#54265f;position:relative;z-index:2}.cmr-play-track{width:min(100%,260px);height:9px;padding:2px;border-radius:20px;background:#54265f44}.cmr-play-fill{height:100%;width:0;border-radius:20px;background:linear-gradient(90deg,#9b54d3,#ff78bd,#ffd56a);transition:width .14s linear}.cmr-play-percent{font:900 10px Cairo,system-ui;color:#54265f;position:relative;z-index:2}.start-button.cmr-pack-button{background:var(--cmr-user-start) center/100% 100% no-repeat!important;border:0!important}.facebook-button.cmr-pack-button{background:var(--cmr-user-menu) center/100% 100% no-repeat!important;border:0!important}.primary-button.cmr-pack-button{background:var(--cmr-user-next) center/100% 100% no-repeat!important;border:0!important}.soft-button.cmr-pack-button{background:var(--cmr-user-back) center/100% 100% no-repeat!important;border:0!important}.cmr-user-icon{width:23px;height:23px;object-fit:contain;vertical-align:middle}";
document.head.appendChild(style);
function progress(n,msg){const b=document.getElementById("startGameBtn");if(!b)return;const f=b.querySelector(".cmr-play-fill"),p=b.querySelector(".cmr-play-percent"),t=b.querySelector(".cmr-play-label");if(f)f.style.width=Math.max(0,Math.min(100,n))+"%";if(p)p.textContent=Math.round(n)+"%";if(t)t.textContent=msg||"بنجهز المملكة...";}
async function getZip(name){const r=await fetch("./"+encodeURIComponent(name),{cache:"force-cache"});if(!r.ok)throw Error("فشل تحميل "+name);return JSZip.loadAsync(await r.arrayBuffer());}
function file(zip,names){for(const n of names){const f=zip.file(n);if(f)return f;}const p=Object.keys(zip.files).find(p=>!zip.files[p].dir&&names.includes(p.split("/").pop()));return p?zip.file(p):null;}
async function img(zip,names){const f=file(zip,names);if(!f)return null;const u=URL.createObjectURL(await f.async("blob"));urls.push(u);const im=new Image();im.src=u;try{await im.decode();}catch(_){}return u;}
async function snd(zip,key,pattern){const p=Object.keys(zip.files).find(p=>!zip.files[p].dir&&pattern.test(p.split("/").pop()));if(!p)return;const u=URL.createObjectURL(await zip.file(p).async("blob"));urls.push(u);const a=new Audio(u);a.preload="auto";a.volume=.55;sounds[key]=a;}
async function prepare(){
 if(packs)return packs;
 if(!window.JSZip)throw Error("مكتبة فك الحزم غير جاهزة");
 progress(5,"تحميل حزم اللعبة...");
 const [bz,sz,iz]=await Promise.all([getZip("ازرار كاندي.zip"),getZip("اصوات كاندي.zip"),getZip("صور كاندي.zip")]);
 progress(45,"تجهيز الصور والأصوات بالتوازي...");
 const buttonNames={start:["btn_start.png","btn_play.png"],menu:["btn_menu.png","btn_options.png"],next:["btn_next.png","btn_continue.png"],back:["btn_back.png","btn_quit.png"],sound:["icon_volume.png"],mute:["icon_mute.png"],coinIcon:["icon_coin.png"],heartIcon:["icon_heart.png"],gemIcon:["icon_gem.png"],settingsIcon:["icon_settings.png"],homeIcon:["icon_home.png"],trophyIcon:["icon_trophy.png"],refreshIcon:["icon_refresh.png"]};
 const imageNames={wide:["btn_wide_lime_normal.png"],round:["btn_round_orange_normal.png"],panel:["inner_panel.png"],title:["title_plate.png"],coin:["currency_coin.png","coin.png"],heart:["heart.png"],gem:["currency_gem.png","gem_blue.png"],crown:["crown.png"],star:["gold_star.png"],chest:["chest_gold.png"]};
 const bPairs=await Promise.all(Object.entries(buttonNames).map(async([k,n])=>[k,await img(bz,n)]));
 const iPairs=await Promise.all(Object.entries(imageNames).map(async([k,n])=>[k,await img(iz,n)]));
 await Promise.all([
  snd(sz,"click",/UI_Click_Bubble_Pop_V06\.(wav|mp3|ogg)$/i),
  snd(sz,"confirm",/UI_Confirm_Bubble_Double_Pop_V01\.(wav|mp3|ogg)$/i),
  snd(sz,"cancel",/UI_Cancel_Back_V02\.(wav|mp3|ogg)$/i),
  snd(sz,"reward",/UI_Reward_Coin_Pickup_V03\.(wav|mp3|ogg)$/i),
  snd(sz,"win",/UI_Level_Complete_V02\.(wav|mp3|ogg)$/i),
  snd(sz,"achievement",/UI_Achievement_Unlocked_V01\.(wav|mp3|ogg)$/i)
 ]);
 const b=Object.fromEntries(bPairs),i=Object.fromEntries(iPairs);
 const vars=[];if(b.start)vars.push("--cmr-user-start:url('"+b.start+"')");if(b.menu)vars.push("--cmr-user-menu:url('"+b.menu+"')");if(b.next)vars.push("--cmr-user-next:url('"+b.next+"')");if(b.back)vars.push("--cmr-user-back:url('"+b.back+"')");document.documentElement.style.cssText+=";"+vars.join(";");
 const start=document.getElementById("startGameBtn"),menu=document.getElementById("facebookLoginBtn");
 if(start&&b.start)start.classList.add("cmr-pack-button");if(menu&&b.menu)menu.classList.add("cmr-pack-button");
 document.querySelectorAll(".primary-button").forEach(x=>{if(b.next)x.classList.add("cmr-pack-button")});
 document.querySelectorAll(".soft-button").forEach(x=>{if(b.back)x.classList.add("cmr-pack-button")});
 function addIcon(selector,url){if(!url)return;const el=document.querySelector(selector);if(!el||el.querySelector(".cmr-user-icon"))return;const im=new Image();im.className="cmr-user-icon";im.src=url;im.alt="";el.prepend(im);}
 addIcon("#soundBtn",b.sound);addIcon("#plusCoins",b.coinIcon);
 window.CMR_USER_ART=i;
 window.CMR_USER_SOUNDS={play(name){const a=sounds[name]||sounds.click;if(a){try{a.currentTime=0;const p=a.play();if(p)p.catch(()=>{});}catch(_){}}}};
 document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("button,[role=button],.wm-house,.wm-realm");if(!t||t.disabled)return;const id=(t.id+" "+t.className).toLowerCase();const k=/next|resultbutton/.test(id)?"win":/retry|back|close|cancel/.test(id)?"cancel":/coin|chest|shop|house|realm/.test(id)?"reward":"click";window.CMR_USER_SOUNDS.play(k);},true);
 packs={buttons:b,images:i,sounds:Object.keys(sounds)};progress(68,"الحزم الأساسية جاهزة");return packs;
}
async function preloadCore(){
 const paths=["01_star_gold.png","02_heart_rainbow.png","03_diamond_blue.png","04_flower_purple.png","05_crown_green.png","06_lollipop_red.png","ice_cube_realistic_4k.png","ice_cube_stylized_4k.png","Candy-Magic-Royale-50-Boards-HD.zip","Match3_GEMS_hAIpng256px_Free_Starter_Pack_95pcs.zip"];
 let done=0;
 await Promise.all(paths.map(async path=>{try{const r=await fetch("./"+encodeURIComponent(path),{cache:"force-cache"});if(r.ok)await r.arrayBuffer();}catch(_){}finally{done++;progress(68+done/paths.length*29,"تحميل موارد اللعبة "+done+"/"+paths.length);}}));
}
function showError(err){const note=document.getElementById("playDiagnostic")||document.createElement("div");note.id="playDiagnostic";note.style.cssText="position:fixed;z-index:99999;left:12px;right:12px;bottom:12px;padding:12px;background:#3b123f;color:white;border:2px solid #ffd36e;border-radius:12px;text-align:center;font:700 13px Cairo,sans-serif";note.textContent="تعذر تجهيز اللعبة: "+(err&&err.message?err.message:err);document.body.appendChild(note);}
async function launch(e){
 if(busy)return;busy=true;if(e){e.preventDefault();e.stopPropagation();}
 const b=document.getElementById("startGameBtn"),fb=document.getElementById("facebookLoginBtn");if(!b)return;
 b.disabled=true;b.classList.add("cmr-play-loading");b.innerHTML='<span class="cmr-play-label">بنجهز المملكة...</span><span class="cmr-play-track"><span class="cmr-play-fill"></span></span><span class="cmr-play-percent">0%</span>';if(fb)fb.hidden=true;
 try{
  progress(2,"تحميل حزم اللعبة...");
  await Promise.all([prepare(),preloadCore()]);
  progress(99,"بنفتح خريطة المملكة...");
  if(typeof window.CMRShowWorldMap!=="function")throw Error("خريطة المملكة لم تجهز");
  window.CMRShowWorldMap();const map=document.getElementById("worldMap");if(!map)throw Error("تعذر إنشاء الخريطة");
  map.classList.remove("hidden");document.body.classList.add("map-open");progress(100,"المملكة جاهزة!");
  await new Promise(r=>setTimeout(r,180));document.getElementById("startScreen")?.remove();
 }catch(err){console.error("[CMR loading]",err);busy=false;b.disabled=false;b.classList.remove("cmr-play-loading");b.innerHTML='<span class="button-label">PLAY</span><span class="button-arrow">✦</span>';if(fb)fb.hidden=false;showError(err);}
}
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("#startGameBtn")&&!busy)void launch(e);},true);
})();