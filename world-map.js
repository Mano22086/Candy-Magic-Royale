(()=>{"use strict";
const KEY="cmr_reborn_v1";
const names=["مملكة الملكة","مملكة الشوكولاتة","مملكة الفراولة","مملكة الآيس كريم","مملكة الكراميل","مملكة التوت","مملكة النجوم","مملكة الياقوت","مملكة الغيوم","مملكة السكر"];
const themes=["👑","🍫","🍓","🍦","🍮","🫐","⭐","💎","☁️","🍬"];
let overlay,scale=1,currentCastle=0;
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(_){return {}}};
const level=()=>{const x=read();return Math.max(1,Math.floor(Number(x.level)||1)+(x.completed?1:0))};
const castle=()=>Math.floor((level()-1)/50);
const house=()=>((level()-1)%50)+1;
const label=n=>names[n%names.length]+" رقم "+(n+1);
function ensure(){if(overlay)return;overlay=document.createElement("section");overlay.id="worldMap";overlay.className="world-map hidden";overlay.innerHTML='<header class="wm-header"><div><small>THE KINGDOM OF SWEETS</small><h1>خريطة المملكة</h1><p id="wmSubtitle">اختار القصر اللي هتستكشفه</p></div><div class="wm-zoom"><button id="wmZoomOut" aria-label="تصغير">−</button><button id="wmZoomIn" aria-label="تكبير">＋</button></div></header><div class="wm-scroll" id="wmScroll"><div class="wm-world" id="wmWorld"></div></div><footer class="wm-footer"><span>✦ كل قصر فيه 50 بيت ✦</span><button id="wmBack" class="hidden">رجوع للقصور</button></footer>';
document.body.appendChild(overlay);
overlay.querySelector("#wmZoomIn").onclick=()=>zoom(.12);overlay.querySelector("#wmZoomOut").onclick=()=>zoom(-.12);overlay.querySelector("#wmBack").onclick=renderWorld;
let startDist=0;overlay.addEventListener("touchstart",e=>{if(e.touches.length===2)startDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)},{passive:true});
overlay.addEventListener("touchmove",e=>{if(e.touches.length===2&&startDist){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(Math.abs(d-startDist)>18){zoom(d > startDist ? 0.04 : -0.04);startDist=d}}},{passive:true});
}
function zoom(delta){scale=Math.max(.72,Math.min(1.35,scale+delta));const world=overlay.querySelector("#wmWorld");if(world)world.style.setProperty("--wm-scale",scale)}
function show(){ensure();overlay.classList.remove("hidden");document.body.classList.add("map-open");window.CMRPauseGameRender?.();renderHouses(castle())}
function hide(){overlay?.classList.add("hidden");document.body.classList.remove("map-open");window.CMRResumeGameRender?.()}
function renderWorld(){ensure();const c=castle(),w=overlay.querySelector("#wmWorld");currentCastle=-1;overlay.querySelector("#wmBack").classList.add("hidden");overlay.querySelector("#wmSubtitle").textContent="رحلتك بين القصور السحرية";w.innerHTML="";
let next=Math.max(0,c-2);const addCard=i=>{const done=i<c,active=i===c,locked=i>c,card=document.createElement("button");card.className="wm-castle "+(done?"done":active?"active":"locked");card.style.setProperty("--island",i%4);const castleArt=["queen","chocolate","ice"][i%3];card.innerHTML='<span class="wm-island"><img class="wm-castle-image" src="./assets/castle-'+castleArt+'.svg" alt=""><i>'+themes[i%themes.length]+'</i><em>'+(done?"✓":locked?"🔒":"✦")+'</em></span><strong>القصر '+(i+1)+' · '+label(i)+'</strong><small>'+(done?"اكتمل القصر":active?"القصر الحالي":"افتحه بعد إكمال القصر السابق")+'</small>';card.onclick=()=>{if(locked){toast("كمّل الـ 50 بيت في القصر الحالي الأول");return}renderHouses(i)};w.appendChild(card)};
for(;next<c+7;next++)addCard(next);
const scroller=overlay.querySelector("#wmScroll");scroller.onscroll=()=>{if(scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-220){for(let j=0;j<6;j++)addCard(next++);}};
w.style.setProperty("--wm-scale",scale);
}
function renderHouses(c){ensure();overlay.querySelector("#wmScroll").onscroll=null;currentCastle=c;const w=overlay.querySelector("#wmWorld"),activeCastle=castle(),h=house();overlay.querySelector("#wmBack").classList.remove("hidden");overlay.querySelector("#wmSubtitle").textContent="القصر "+(c+1)+" — 50 بيت سحري";w.innerHTML='<div class="wm-house-title"><img src="./assets/castle-'+["queen","chocolate","ice"][c%3]+'.svg" alt=""><b>'+label(c)+'</b><small>اختار البيت التالي — '+(c===activeCastle?h:50)+' من 50</small></div><div class="wm-houses" id="wmHouses"></div>';
const grid=w.querySelector("#wmHouses");for(let n=1;n<=50;n++){const global=c*50+n,unlocked=global<=level(),done=global<level(),btn=document.createElement("button");btn.className="wm-house "+(done?"done":unlocked?"current":"locked");const row=Math.floor((n-1)/5),offset=(n-1)%5,col=(row%2===0?offset:4-offset)+1;btn.style.gridColumn=String(col);btn.style.gridRow=String(row+1);btn.innerHTML='<span>'+(done?"✓":unlocked?"✦":"🔒")+'</span><b>'+n+'</b>';btn.setAttribute("aria-label","البيت "+n);btn.onclick=()=>{if(global===level()){toast("جاري دخول البيت "+n+"...");window.CMRStartSelectedHouse?.()}else if(global<level())toast("البيت ده اتكمل بالفعل");else toast("البيت ده لسه مقفول")};grid.appendChild(btn)}
w.style.setProperty("--wm-scale",scale);
overlay.querySelector("#wmScroll").scrollTop=0;
const current=grid.querySelector(".wm-house.current");
if(current)requestAnimationFrame(()=>current.scrollIntoView({block:"center",behavior:"smooth"}));
}
function toast(msg){const t=document.getElementById("toast");if(!t)return;t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1700)}
window.CMRShowWorldMap=show;window.CMRHideWorldMap=hide;
})();