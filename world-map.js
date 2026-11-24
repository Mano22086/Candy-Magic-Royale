(()=>{"use strict";
const KEY="cmr_reborn_v1";
const realms=[
 {name:"مملكة الحلوى البنفسجية",icon:"👑",castle:"queen",tag:"بداية الرحلة",description:"قصور الحلوى والطرق الذهبية"},
 {name:"الغابة السحرية",icon:"🌸",castle:"chocolate",tag:"أسرار الغابة",description:"أشجار الحلوى والحدائق المضيئة"},
 {name:"مملكة الجليد",icon:"❄️",castle:"ice",tag:"تحدي الكريستال",description:"شلالات متجمدة وبلورات زرقاء"},
 {name:"مملكة النجوم",icon:"🌟",castle:"enchanted",tag:"قمة المجرة",description:"جسور النجوم وقصر السماء"}
];
const castlePath=realm=>({queen:"queen",chocolate:"chocolate",ice:"ice",enchanted:"queen"}[realm.castle]||"queen");
let overlay=null,scale=1;
const BOARD_ART_ARCHIVE="./Candy-Magic-Royale-50-Boards-HD.zip";
let boardArtArchivePromise=null;
const boardArtObjectUrls=new Map();
function getBoardArtArchive(){
 if(!boardArtArchivePromise)boardArtArchivePromise=fetch(BOARD_ART_ARCHIVE,{cache:"force-cache"}).then(r=>{if(!r.ok)throw Error("50-board archive HTTP "+r.status);return r.arrayBuffer();}).then(JSZip.loadAsync).then(zip=>{
  const files=Object.keys(zip.files).filter(p=>!zip.files[p].dir&&/\.(png|jpe?g|webp)$/i.test(p)&&!/(thumb|preview|readme|license)/i.test(p.split("/").pop())).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:"base"}));
  if(!files.length)throw Error("لم يتم العثور على صور داخل حزمة الخلفيات");
  console.info("[CMR 50 Boards] found",files.length,"images");
  if(files.length<50)console.warn("[CMR 50 Boards] archive has fewer than 50 image files");
  return {zip,files:files.slice(0,50)};
 });
 return boardArtArchivePromise;
}
async function getBoardArtUrl(stage){
 const {zip,files}=await getBoardArtArchive();
 const index=((Math.max(1,Number(stage)||1)-1)%50)%files.length,path=files[index];
 if(!boardArtObjectUrls.has(path)){const blob=await zip.file(path).async("blob");boardArtObjectUrls.set(path,URL.createObjectURL(blob));}
 return boardArtObjectUrls.get(path);
}
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(_){return {}}};
const level=()=>{const x=read();return Math.max(1,Math.floor(Number(x.level)||1)+(x.completed?1:0))};
const worldIndex=()=>Math.floor((level()-1)/50);
const stageInWorld=()=>((level()-1)%50)+1;
const realmAt=i=>realms[i%realms.length];
const worldTitle=i=>"العالم "+(i+1)+" · "+realmAt(i).name;
function ensure(){
 if(overlay)return;
 overlay=document.createElement("section");overlay.id="worldMap";overlay.className="world-map hidden";
 overlay.innerHTML='<header class="wm-header"><div class="wm-heading"><small>THE FOUR REALMS · CANDY MAGIC ROYALE</small><h1>رحلة الممالك السحرية</h1><p id="wmSubtitle">أربع ممالك، ومغامرة لا تنتهي</p><div class="wm-progress"><span id="wmProgressText">العالم الأول · المرحلة 1 من 50</span><i><b id="wmProgressBar"></b></i></div></div><div class="wm-tools"><div class="wm-zoom"><button id="wmZoomOut" aria-label="تصغير">−</button><button id="wmZoomIn" aria-label="تكبير">＋</button></div></div></header><div class="wm-scroll" id="wmScroll"><div class="wm-world" id="wmWorld"></div></div><footer class="wm-footer"><span>✦ 50 مرحلة في كل مملكة · اجمع النجوم وافتح الطريق ✦</span><button id="wmBack" class="hidden">رجوع للعوالم</button></footer>';
 document.body.appendChild(overlay);
 overlay.querySelector("#wmZoomIn").onclick=()=>zoom(.1);
 overlay.querySelector("#wmZoomOut").onclick=()=>zoom(-.1);
 overlay.querySelector("#wmBack").onclick=renderWorld;
 let startDist=0;
 overlay.addEventListener("touchstart",e=>{if(e.touches.length===2)startDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)},{passive:true});
 overlay.addEventListener("touchmove",e=>{if(e.touches.length===2&&startDist){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(Math.abs(d-startDist)>18){zoom(d > startDist ? 0.035 : -0.035);startDist=d}}},{passive:true});
}
function zoom(delta){scale=Math.max(.78,Math.min(1.22,scale+delta));const world=overlay?.querySelector("#wmWorld");if(world)world.style.setProperty("--wm-scale",scale)}
function updateProgress(){
 const w=worldIndex(),h=stageInWorld(),text=overlay.querySelector("#wmProgressText"),bar=overlay.querySelector("#wmProgressBar");
 if(text)text.textContent=worldTitle(w)+" · المرحلة "+h+" من 50";
 if(bar)bar.style.width=((h-1)/50*100)+"%";
}
function show(){ensure();overlay.classList.remove("hidden");document.body.classList.add("map-open");window.CMRPauseGameRender?.();renderWorld()}
function hide(){overlay?.classList.add("hidden");document.body.classList.remove("map-open");window.CMRResumeGameRender?.()}
function renderWorld(){
 ensure();const current=worldIndex(),w=overlay.querySelector("#wmWorld"),scroll=overlay.querySelector("#wmScroll");
 document.documentElement.style.setProperty("--cmr-map-render",'url("./assets/world-render-0'+(current%4+1)+'.svg")');
 overlay.querySelector("#wmBack").classList.add("hidden");
 overlay.querySelector("#wmSubtitle").textContent="افتح القصور بالتتابع، وكل قصر يضم 50 مرحلة";
 updateProgress();w.innerHTML="";scroll.onscroll=null;
 const first=Math.max(0,current-3),last=Math.max(4,current+3);
 for(let i=first;i<last;i++){
  const done=i<current,active=i===current,locked=i>current,realm=realmAt(i),card=document.createElement("button");
  card.type="button";card.className="wm-realm "+(done?"done":active?"active":"locked");
  card.style.setProperty("--realm-index",i%4);
  const art=realm.castle==="enchanted"?"./assets/enchanted-castle.svg":"./assets/castle-"+castlePath(realm)+".svg";
  const progress=done?100:active?Math.max(0,(stageInWorld()-1)/50*100):0;
  const status=done?"اكتمل العالم":active?"أنت هنا · المرحلة "+stageInWorld()+" من 50":"افتحه بعد إنهاء العالم السابق";
  card.innerHTML='<span class="wm-realm-art"><img src="'+art+'" alt=""><i>'+realm.icon+'</i><em>'+(done?"✓":locked?"🔒":"✦")+'</em></span><span class="wm-realm-kicker">'+realm.tag+' · '+(i+1)+'</span><strong>'+realm.name+'</strong><small>'+realm.description+'</small><span class="wm-realm-status">'+status+'</span><span class="wm-realm-progress"><i style="width:'+progress+'%"></i></span><span class="wm-realm-range">المراحل '+(i*50+1)+' – '+((i+1)*50)+'</span>';
  card.onclick=()=>{if(locked){toast("كمّل المراحل الـ50 في العالم الحالي الأول");return}renderHouses(i)};
  w.appendChild(card);
 }
 w.style.setProperty("--wm-scale",scale);
}
function renderHouses(world){
 ensure();const scroll=overlay.querySelector("#wmScroll"),w=overlay.querySelector("#wmWorld"),activeWorld=worldIndex(),currentStage=stageInWorld(),realm=realmAt(world);
 document.documentElement.style.setProperty("--cmr-map-render",'url("./assets/world-render-0'+(world%4+1)+'.svg")');
 scroll.onscroll=null;overlay.querySelector("#wmBack").classList.remove("hidden");
 overlay.querySelector("#wmSubtitle").textContent=worldTitle(world)+" — خريطة المراحل";
 updateProgress();
 w.innerHTML='<div class="wm-house-title"><img src="'+(realm.castle==="enchanted"?"./assets/enchanted-castle.svg":"./assets/castle-"+castlePath(realm)+'.svg')+'" alt=""><span>'+realm.icon+'</span><b>'+worldTitle(world)+'</b><small>'+(world===activeWorld?"المرحلة الحالية "+currentStage+" من 50":world<activeWorld?"اكتملت كل مراحل هذا العالم":"هذا العالم مقفول")+'</small></div><div class="wm-houses" id="wmHouses"></div>';
 const grid=w.querySelector("#wmHouses"),route=document.createElementNS("http://www.w3.org/2000/svg","svg");
 route.setAttribute("class","wm-route");route.setAttribute("viewBox","0 0 500 740");route.setAttribute("preserveAspectRatio","none");route.setAttribute("aria-hidden","true");
 const points=[];for(let row=0;row<10;row++){const cols=row%2===0?[0,1,2,3,4]:[4,3,2,1,0];for(const col of cols)points.push((col*100+50)+","+(36+row*72))}
 const line=document.createElementNS("http://www.w3.org/2000/svg","polyline");line.setAttribute("points",points.join(" "));route.appendChild(line);grid.appendChild(route);
 for(let n=1;n<=50;n++){
  const global=world*50+n,done=global<level(),unlocked=global<=level(),btn=document.createElement("button");
  btn.type="button";btn.className="wm-house "+(done?"done":unlocked?"current":"locked")+(n%10===0?" checkpoint":"");
  const row=Math.floor((n-1)/5),offset=(n-1)%5,col=(row%2===0?offset:4-offset)+1;
  btn.style.gridColumn=String(col);btn.style.gridRow=String(row+1);
  btn.innerHTML='<span>'+(done?"✓":unlocked?"✦":"🔒")+'</span><b>'+n+'</b>';
  btn.setAttribute("aria-label","المرحلة "+global+(n%10===0?" · محطة تحدي":""));
  btn.onclick=async event=>{
   event.preventDefault();event.stopPropagation();
   if(global>level()){toast("المرحلة دي لسه مقفولة");return}
   const launch=window.CMRStartSelectedHouse;
   if(typeof launch!=="function"){toast("نظام تشغيل المرحلة مش جاهز. حدّث الصفحة وحاول تاني.");return}
   btn.disabled=true;toast(global<level()?"جاري إعادة المرحلة...":"جاري فتح المرحلة...");
   try{const opened=await launch(global);if(opened!==true){btn.disabled=false;toast("المرحلة ما فتحتش. حاول مرة تانية.")}}
   catch(error){console.error("Stage button failed:",error);btn.disabled=false;toast("خطأ في فتح المرحلة: "+(error?.message||"غير معروف"))}
  };
  grid.appendChild(btn);
 }
 w.style.setProperty("--wm-scale",scale);scroll.scrollTop=0;
 const current=grid.querySelector(".wm-house.current");
 if(current)requestAnimationFrame(()=>current.scrollIntoView({block:"center",behavior:"smooth"}));
}
function toast(message){const t=document.getElementById("toast");if(!t)return;t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1700)}
window.CMRGetBoardArtUrl=getBoardArtUrl;window.CMRShowWorldMap=show;window.CMRHideWorldMap=hide;
})();