(() => {
"use strict";
const COLS=7, ROWS=8, SPACING=1.02, TYPES=6, SAVE_KEY="cmr_reborn_v1", PLAYER_KEY="cmr_player_identity_v1";
const palette=[
  {name:"Ruby Heart",color:new BABYLON.Color3(.96,.12,.31)},
  {name:"Sun Drop",color:new BABYLON.Color3(1,.48,.055)},
  {name:"Star Sugar",color:new BABYLON.Color3(1,.79,.12)},
  {name:"Emerald Leaf",color:new BABYLON.Color3(.12,.78,.38)},
  {name:"Sky Diamond",color:new BABYLON.Color3(.12,.61,1)},
  {name:"Violet Jelly",color:new BABYLON.Color3(.68,.25,.96)},
  {name:"Plum Pop",color:new BABYLON.Color3(.52,.16,.68)}
];
const state={grid:[],savedGrid:null,score:0,target:1500,moves:25,level:1,resumeLevel:1,replayMode:false,coins:500,stars:0,lives:5,lastHeartAt:0,selected:null,busy:false,won:false,lossHandled:false,booster:null,hammer:3,rockets:3,colors:3,paints:3,extra:2,iceRemaining:0,obstacleGoal:0,obstaclesCleared:0};

const $=id=>document.getElementById(id);
const rand=()=>1+Math.floor(Math.random()*TYPES);
const pos=(r,c)=>new BABYLON.Vector3((c-(COLS-1)/2)*SPACING,0,((ROWS-1)/2-r)*SPACING);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function makeMaterial(type){
  const index=Math.max(1,Math.min(TYPES,Number(type)||1));
  if(materials[index])return materials[index];
  const mat=new BABYLON.StandardMaterial("candyMaterial_"+index,scene);
  mat.diffuseColor=palette[index-1].color.clone();
  mat.emissiveColor=palette[index-1].color.scale(.18);
  mat.specularColor=new BABYLON.Color3(.85,.85,.85);
  mat.specularPower=48;
  materials[index]=mat;
  return mat;
}
function say(message){
  const el=$("toast");if(!el)return;
  el.textContent=String(message||"");el.classList.add("show");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2200);
}
function playSfx(kind){
  if(!soundEnabled)return;
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)return;
    audioContext=audioContext||new AudioCtx();
    if(audioContext.state==="suspended")void audioContext.resume();
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();
    const tones={match:660,coin:880,tap:440,win:990,lose:180,bomb:150,rocket:760,color:1080};
    osc.type="sine";osc.frequency.value=tones[kind]||520;
    gain.gain.setValueAtTime(.0001,audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.07,audioContext.currentTime+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+.13);
    osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+.14);
  }catch(_){}
}
function applyHeartRegen(){
  const now=Date.now(),interval=30*60*1000;
  if(state.lives>=5){state.lives=5;state.lastHeartAt=now;return;}
  if(!state.lastHeartAt||state.lastHeartAt>now){state.lastHeartAt=now;return;}
  const gained=Math.floor((now-state.lastHeartAt)/interval);
  if(gained>0){state.lives=Math.min(5,state.lives+gained);state.lastHeartAt=state.lives>=5?now:state.lastHeartAt+gained*interval;}
}
function startHeartClock(){
  if(heartTimer)clearInterval(heartTimer);
  heartTimer=setInterval(()=>{const before=state.lives;applyHeartRegen();if(state.lives!==before){updateHud();saveProgress(false);}},60000);
}
let soundEnabled=true,audioContext=null,heartTimer=null;
let engine,scene,camera,canvas,materials=[],coreMaterials=[],toastTimer,boardBaseMesh,backgroundVideoLayer,renderLoop;
const activeAnimations=new Set();
let animationFrame=0;
const spriteMaterials={};
const spriteTextures={};
const specialSpriteMaterials={};
const specialSpriteTextures={};
const specialSpriteSources={
  wrapped:{
    1:"./14_bag_gold.png",
    2:"./15_bag_rainbow.png",
    3:"./16_bag_diamond_blue.png",
    4:"./17_bag_flower_purple.png",
    5:"./18_bag_crown_green.png",
    6:"./19_bag_lollipop_red.png"
  },
  color:"./13_chocolate_ball.png",
  striped:{
    1:"./21_rocket_crown_gold.png",
    2:"./22_rocket_crown_rainbow.png",
    3:"./23_rocket_diamond_blue.png",
    4:"./24_rocket_flower_purple.png",
    5:"./25_rocket_crown_green.png",
    6:"./26_rocket_lollipop_red.png"
  }
};
function specialSpriteMaterial(key,source){
  if(specialSpriteMaterials[key])return specialSpriteMaterials[key];
  const mat=new BABYLON.StandardMaterial("specialSpriteMat_"+key,scene);
  mat.diffuseColor=new BABYLON.Color3(1,1,1);
  mat.emissiveColor=new BABYLON.Color3(1,1,1);
  mat.disableLighting=true;
  mat.backFaceCulling=false;
  mat.useAlphaFromDiffuseTexture=true;
  mat.transparencyMode=BABYLON.Material.MATERIAL_ALPHABLEND;
  const texture=new BABYLON.Texture(source,scene,false,true,BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
    ()=>{texture.hasAlpha=true;mat.diffuseTexture=texture;mat.markAsDirty(BABYLON.Material.TextureDirtyFlag);},
    (message,error)=>console.warn("Special candy artwork unavailable; native 3D fallback remains:",source,message,error));
  texture.hasAlpha=true;
  texture.wrapU=BABYLON.Texture.CLAMP_ADDRESSMODE;
  texture.wrapV=BABYLON.Texture.CLAMP_ADDRESSMODE;
  mat.diffuseTexture=texture;
  specialSpriteTextures[key]=texture;
  specialSpriteMaterials[key]=mat;
  return mat;
}
let shineSharedMaterial=null,iceOverlayMaterial=null;
const iceStageTextures={};
const iceStageMaterials={};const obstacleMaterials={};const OBSTACLE_ZIP_URL="./Match3_GEMS_hAIpng256px_Free_Starter_Pack_95pcs.zip";let obstacleZipPromise=null;function loadObstaclePng(img,path){if(!obstacleZipPromise){obstacleZipPromise=fetch(OBSTACLE_ZIP_URL).then(r=>{if(!r.ok)throw new Error("Obstacle pack download failed: "+r.status);return r.arrayBuffer();}).then(buf=>JSZip.loadAsync(buf));}obstacleZipPromise.then(zip=>{const file=zip.file("Match3_GEMS_hAIpng256px_Free_Starter_Pack_95pcs/11_blocker/"+path+".png");if(!file)throw new Error("Missing obstacle image "+path);return file.async("blob");}).then(blob=>{img.src=URL.createObjectURL(blob);}).catch(err=>console.warn("Obstacle art unavailable; fallback remains:",path,err));}const OBSTACLE_DEFS={single_ice:{img:"1",hp:1,adj:true,self:true,spread:false,reward:false},double_ice:{img:"2",hp:2,adj:true,self:true,spread:false,reward:false},stone_wall:{img:"3",hp:2,adj:true,self:false,spread:false,reward:false},rope_net:{img:"4",hp:2,adj:true,self:false,spread:false,reward:false},vault:{img:"5",hp:3,adj:true,self:false,spread:false,reward:true},roots:{img:"6",hp:2,adj:true,self:false,spread:true,reward:false},golden_cage:{img:"7",hp:2,adj:false,self:true,spread:false,reward:true},iron_cage:{img:"8",hp:2,adj:false,self:true,spread:false,reward:false},whirlpool:{img:"9",hp:1,adj:true,self:false,spread:false,reward:true}};function getLevelConfig(lv){const L=Math.max(1,lv|0);let obstacles=["single_ice"],diffLabel="سهل";if(L<=2)obstacles=["single_ice"];else if(L<=5)obstacles=["single_ice","double_ice"];else if(L<=9){obstacles=["double_ice","stone_wall"];diffLabel="سهل";}else if(L<=13){obstacles=["single_ice","rope_net"];diffLabel="متوسط";}else if(L<=17){obstacles=["double_ice","roots"];diffLabel="متوسط";}else if(L<=21){obstacles=["stone_wall","vault"];diffLabel="متوسط";}else if(L<=25){obstacles=["rope_net","golden_cage"];diffLabel="متوسط";}else if(L<=29){obstacles=["roots","iron_cage"];diffLabel="صعب";}else if(L<=33){obstacles=["vault","whirlpool"];diffLabel="صعب";}else if(L<=40){obstacles=["single_ice","golden_cage","roots"];diffLabel="صعب";}else if(L<=50){obstacles=["stone_wall","iron_cage","whirlpool"];diffLabel="صعب جداً";}else{const cycle=[["single_ice","rope_net"],["double_ice","vault"],["stone_wall","roots"],["golden_cage","whirlpool"],["iron_cage","single_ice"]];obstacles=cycle[Math.floor((L-51)/5)%cycle.length];diffLabel="ملكي";}const obstacleCount=L<=10?2+Math.floor((L-1)/4):L<=20?3+Math.floor((L-11)/5):L<=35?5+Math.floor((L-21)/5):Math.min(9,7+Math.floor((L-36)/8));const target=1200+(L-1)*350+Math.floor(L/5)*250;const moves=Math.max(18,Math.min(30,25-Math.floor((L-1)/8)+(L>=25?1:0)));return{level:L,obstacleCount,target,moves,obstacles,diffLabel};}function isCellLocked(c){return !!(c&&(c.obs||c.ice>0));}function countObstacles(){let n=0;for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const it=state.grid[r]?.[c];if(it&&(it.obs||it.ice>0))n++;}return n;}function makeObstacleMaterial(type,hp){const t=OBSTACLE_DEFS[type]?type:"single_ice";const key=t+"_"+hp;if(obstacleMaterials[key])return obstacleMaterials[key];const def=OBSTACLE_DEFS[t];const mat=new BABYLON.StandardMaterial("obsMat_"+key,scene);const dt=new BABYLON.DynamicTexture("obsTex_"+key,{width:256,height:256},scene,true);dt.hasAlpha=true;const ctx=dt.getContext();const img=new Image();img.crossOrigin="anonymous";img.onload=()=>{ctx.clearRect(0,0,256,256);ctx.drawImage(img,0,0,256,256);if(hp<def.hp){ctx.strokeStyle="rgba(255,255,255,0.9)";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(40,40);ctx.lineTo(110,120);ctx.lineTo(80,190);ctx.stroke();}dt.update();};loadObstaclePng(img,def.img);mat.diffuseTexture=dt;mat.diffuseColor=new BABYLON.Color3(.92,.96,1);mat.emissiveColor=new BABYLON.Color3(.025,.035,.055);mat.specularColor=new BABYLON.Color3(.22,.25,.3);mat.specularPower=24;mat.opacityTexture=dt;mat.useAlphaFromDiffuseTexture=true;mat.transparencyMode=BABYLON.Material.MATERIAL_ALPHABLEND;mat.backFaceCulling=false;mat.needDepthPrePass=true;obstacleMaterials[key]=mat;return mat;}function spreadChocolateIfNeeded(){const cands=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const it=state.grid[r]?.[c];if(it&&it.obs==="roots"){for(const[dr,dc]of[[-1,0],[1,0],[0,-1],[0,1]]){const nr=r+dr,nc=c+dc,nb=state.grid[nr]?.[nc];if(inBounds(nr,nc)&&nb&&!nb.obs&&!nb.ice)cands.push({item:nb,r:nr,c:nc});}}}if(!cands.length)return;const pick=cands[Math.floor(Math.random()*cands.length)],item=pick.item;item.obs="roots";item.ice=1;if(item.mesh){item.mesh.dispose();item.mesh=candyMesh(pick.r,pick.c,item.type,item.special,item.ice);item.mesh.position.copyFrom(pos(pick.r,pick.c));}state.iceRemaining=countObstacles();}
const specialRingSharedMaterials={};
const specialMaterials={};
let shockwaveMaterial=null;
const burstSharedMaterials={};
const candyImages={
  1:"./01_star_gold.png",
  2:"./02_heart_rainbow.png",
  3:"./03_diamond_blue.png",
  4:"./04_flower_purple.png",
  5:"./05_crown_green.png",
  6:"./06_lollipop_red.png"
};
const candyImageRatios={1:1.01,2:.99,3:.84,4:1.33,5:1,6:1.02};

// ---- Unified candy size -------------------------------------------------
// Each PNG has a different amount of transparent padding. We detect the real
// visible area of every image, crop to it, and fit it into the same square.
const CANDY_FIT=0.88;      // candy size relative to its board cell (0.80 - 0.95)
const candyTrim={};
function loadCandyTrim(type){
  return new Promise(resolve=>{
    const src=candyImages[type];
    if(!src){resolve();return;}
    const img=new Image();
    let settled=false;
    const finish=()=>{if(settled)return;settled=true;resolve();};
    // A failed or slow image must never prevent the game board from opening.
    const timeout=setTimeout(finish,5000);
    img.onload=()=>{
      try{
        const w=img.naturalWidth,h=img.naturalHeight;
        // Analyze a tiny thumbnail instead of reading millions of full-size pixels
        // on mobile. The trim is only a layout estimate; the original art is untouched.
        const sample=128,scale=Math.min(1,sample/Math.max(w,h));
        const sw=Math.max(1,Math.round(w*scale)),sh=Math.max(1,Math.round(h*scale));
        const cv=document.createElement("canvas");cv.width=sw;cv.height=sh;
        const ctx=cv.getContext("2d",{willReadFrequently:true});
        if(!ctx){clearTimeout(timeout);finish();return;}
        ctx.drawImage(img,0,0,sw,sh);
        const d=ctx.getImageData(0,0,sw,sh).data;
        let x0=sw,y0=sh,x1=-1,y1=-1;
        for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
          if(d[(y*sw+x)*4+3]>40){
            if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
          }
        }
        if(x1>=x0&&y1>=y0){
          x1++;y1++;
          candyTrim[type]={u0:x0/sw,u1:x1/sw,v0:1-y1/sh,v1:1-y0/sh,ratio:(x1-x0)/(y1-y0)};
        }
      }catch(e){console.warn("Candy trim failed",type,e);}
      clearTimeout(timeout);finish();
    };
    img.onerror=()=>{clearTimeout(timeout);finish();};
    img.src=src;
  });
}
function preloadCandyArt(){return Promise.all(Object.keys(candyImages).map(loadCandyTrim));}
async function preloadCandyTextures(){
  // Load the supplied PNGs before creating the first board. Some Babylon.js
  // Poll texture readiness instead of relying on optional Babylon observables.
  await preloadCandyArt();
  await Promise.all(Object.keys(candyImages).map(async type=>{
    candySpriteMaterial(Number(type));
    const texture=spriteTextures[type];
    if(!texture||texture.isReady())return;
    const started=Date.now();
    while(!texture.isReady()&&Date.now()-started<4500)await wait(50);
    // If an image failed, candyMesh keeps its native 3D fallback visible.
  }));
}
// -------------------------------------------------------------------------

function candySpriteMaterial(type){
  if(spriteMaterials[type])return spriteMaterials[type];
  const mat=new BABYLON.StandardMaterial("candyArtworkMat_"+type,scene);
  mat.diffuseColor=new BABYLON.Color3(1,1,1);
  mat.emissiveColor=new BABYLON.Color3(1,1,1);
  mat.disableLighting=true;
  mat.backFaceCulling=false;
  mat.useAlphaFromDiffuseTexture=true;
  mat.transparencyMode=BABYLON.Material.MATERIAL_ALPHABLEND;
  const source=candyImages[type];
  if(!source){spriteMaterials[type]=mat;return mat;}
  const texture=new BABYLON.Texture(
    source,scene,false,true,BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
    ()=>{texture.hasAlpha=true;mat.diffuseTexture=texture;mat.markAsDirty(BABYLON.Material.TextureDirtyFlag);},
    (message,error)=>console.warn("Candy artwork unavailable; keeping native 3D fallback:",source,message,error)
  );
  texture.hasAlpha=true;
  texture.wrapU=BABYLON.Texture.CLAMP_ADDRESSMODE;
  texture.wrapV=BABYLON.Texture.CLAMP_ADDRESSMODE;
  mat.diffuseTexture=texture;
  spriteTextures[type]=texture;
  spriteMaterials[type]=mat;
  return mat;
}
function candyMesh(r,c,type,special,ice=0){
  const root=new BABYLON.TransformNode("candyRoot_"+r+"_"+c,scene);
  root.position=pos(r,c);
  root.metadata={r,c,candy:true};
  root.isPickable=false;

  // Native 3D candy remains visible until its PNG artwork has loaded successfully.
  const body=BABYLON.MeshBuilder.CreateSphere("candy3D_"+r+"_"+c,{diameter:SPACING*.76,segments:20},scene);
  body.parent=root;
  body.position.y=.17;
  body.scaling.y=.48;
  body.material=makeMaterial(type);
  body.isPickable=true;
  body.metadata={r,c,candy:true};

  const shine=BABYLON.MeshBuilder.CreateSphere("candyShine_"+r+"_"+c,{diameter:SPACING*.17,segments:12},scene);
  shine.parent=root;
  shine.position=new BABYLON.Vector3(-.13,.31,-.12);
  shine.scaling=new BABYLON.Vector3(1,.28,.62);
  if(!shineSharedMaterial){
    shineSharedMaterial=new BABYLON.StandardMaterial("candyShineShared",scene);
    shineSharedMaterial.diffuseColor=new BABYLON.Color3(1,1,1);
    shineSharedMaterial.emissiveColor=new BABYLON.Color3(.22,.22,.22);
    shineSharedMaterial.alpha=.72;
  }
  shine.material=shineSharedMaterial;
  shine.isPickable=false;

  const artworkPath=candyImages[type];
  if(artworkPath&&!special){
    const trim=candyTrim[type];
    const ratio=trim?trim.ratio:(candyImageRatios[type]||1);
    const maxSide=SPACING*CANDY_FIT;
    const artworkWidth=ratio>=1?maxSide:maxSide*ratio;
    const artworkHeight=ratio>=1?maxSide/ratio:maxSide;
    const planeOpts={width:artworkWidth,height:artworkHeight};
    if(trim)planeOpts.frontUVs=new BABYLON.Vector4(trim.u0,trim.v0,trim.u1,trim.v1);
    const artwork=BABYLON.MeshBuilder.CreatePlane("candyArtwork_"+r+"_"+c,planeOpts,scene);
    artwork.parent=root;
    // Board coordinates lie on XZ and the camera looks down from above.
    // Lay the candy artwork flat above the 3D body instead of edge-on.
    artwork.rotation.x=Math.PI/2;
    artwork.position=new BABYLON.Vector3(0,.39,0);
    artwork.material=candySpriteMaterial(type);
    artwork.isPickable=false;
    artwork.isVisible=false;
    const texture=spriteTextures[type];
    const revealArtwork=()=>{
      if(root.isDisposed?.())return;
      artwork.isVisible=true;
      body.setEnabled(false);
      shine.setEnabled(false);
    };
    const revealWhenReady=()=>{
      if(root.isDisposed?.())return;
      if(texture&&texture.isReady()){revealArtwork();return;}
      if(texture)setTimeout(revealWhenReady,60);
    };
    revealWhenReady();
  }

  if(special){
    const ringKind=special==="wrapped"?"wrapped":special==="color"?"color":"striped";
    if(!specialRingSharedMaterials[ringKind]){
      const ringMat=new BABYLON.StandardMaterial("specialRingShared_"+ringKind,scene);
      ringMat.diffuseColor=ringKind==="wrapped"?new BABYLON.Color3(1,.72,.18):ringKind==="color"?new BABYLON.Color3(.9,.55,1):new BABYLON.Color3(.25,.9,1);
      ringMat.emissiveColor=ringMat.diffuseColor.scale(.75);
      specialRingSharedMaterials[ringKind]=ringMat;
    }
    const ring=BABYLON.MeshBuilder.CreateTorus("specialRing_"+r+"_"+c,{diameter:.91,thickness:.055,tessellation:24},scene);
    ring.parent=root;ring.rotation.x=Math.PI/2;ring.position.y=.12;ring.material=specialRingSharedMaterials[ringKind];ring.isPickable=false;
  }
  const specialSpritePath=special==="wrapped"?(specialSpriteSources.wrapped[type]||specialSpriteSources.wrapped[1]):special==="color"?specialSpriteSources.color:special==="striped"?(specialSpriteSources.striped[type]||specialSpriteSources.striped[1]):null;
  if(specialSpritePath){
    const spriteKey=special+"_"+type;
    const art=BABYLON.MeshBuilder.CreatePlane("specialCandyArtwork_"+r+"_"+c,{width:SPACING*.82,height:SPACING*.82},scene);
    art.parent=root;
    art.rotation.x=Math.PI/2;
    art.position.y=.43;
    art.material=specialSpriteMaterial(spriteKey,specialSpritePath);
    art.isPickable=false;
    art.isVisible=false;
    const texture=specialSpriteTextures[spriteKey];
    const revealSpecial=()=>{if(root.isDisposed?.())return;art.isVisible=true;for(const child of root.getChildMeshes())if(child!==art&&child.name!=="iceOverlay")child.setEnabled(false);};
    const revealSpecialWhenReady=()=>{
      if(root.isDisposed?.())return;
      if(texture&&texture.isReady()){revealSpecial();return;}
      if(texture)setTimeout(revealSpecialWhenReady,60);
    };
    revealSpecialWhenReady();
  }
  if(special&&!specialSpritePath){
    const mat=(key,color,emissive=color)=>{if(!specialMaterials[key]){const m=new BABYLON.StandardMaterial("specialArt_"+key,scene);m.diffuseColor=color;m.emissiveColor=emissive;m.specularColor=new BABYLON.Color3(.9,.9,.9);m.specularPower=64;specialMaterials[key]=m;}return specialMaterials[key];};
    if(special==="wrapped"){
      const bomb=BABYLON.MeshBuilder.CreateSphere("wrappedCandyBomb",{diameter:.52,segments:16},scene);bomb.parent=root;bomb.position.y=.61;bomb.material=mat("bomb",new BABYLON.Color3(.18,.07,.3),new BABYLON.Color3(.3,.08,.48));bomb.isPickable=false;
      const fuse=BABYLON.MeshBuilder.CreateCylinder("bombFuse",{height:.18,diameter:.055,tessellation:8},scene);fuse.parent=root;fuse.position=new BABYLON.Vector3(.12,.91,-.08);fuse.rotation.z=-.5;fuse.material=mat("fuse",new BABYLON.Color3(1,.65,.12));fuse.isPickable=false;
      const spark=BABYLON.MeshBuilder.CreateSphere("bombSpark",{diameter:.12,segments:8},scene);spark.parent=root;spark.position=new BABYLON.Vector3(.2,.99,-.13);spark.material=mat("spark",new BABYLON.Color3(1,.88,.22),new BABYLON.Color3(1,.45,.04));spark.isPickable=false;
    }else if(special==="striped"){
      const rocket=BABYLON.MeshBuilder.CreateCylinder("stripedCandyRocket",{height:.62,diameter:.22,tessellation:12},scene);rocket.parent=root;rocket.position.y=.59;rocket.rotation.z=Math.PI/2;rocket.material=mat("rocket",new BABYLON.Color3(.92,.12,.22),new BABYLON.Color3(.45,.04,.08));rocket.isPickable=false;
      const nose=BABYLON.MeshBuilder.CreateCylinder("rocketNose",{height:.25,diameterTop:0,diameterBottom:.24,tessellation:12},scene);nose.parent=root;nose.position=new BABYLON.Vector3(.42,.59,0);nose.rotation.z=-Math.PI/2;nose.material=mat("rocketNose",new BABYLON.Color3(1,.72,.18));nose.isPickable=false;
      const flame=BABYLON.MeshBuilder.CreateSphere("rocketFlame",{diameter:.2,segments:8},scene);flame.parent=root;flame.position=new BABYLON.Vector3(-.38,.55,0);flame.scaling.x=1.35;flame.material=mat("rocketFlame",new BABYLON.Color3(1,.45,.08),new BABYLON.Color3(1,.18,.02));flame.isPickable=false;
    }else if(special==="color"){
      const orb=BABYLON.MeshBuilder.CreateSphere("rainbowCandyBall",{diameter:.5,segments:20},scene);orb.parent=root;orb.position.y=.62;orb.material=mat("rainbowOrb",new BABYLON.Color3(.95,.9,1),new BABYLON.Color3(.5,.25,.8));orb.isPickable=false;
      const hues=[new BABYLON.Color3(1,.12,.25),new BABYLON.Color3(1,.55,.08),new BABYLON.Color3(1,.88,.12),new BABYLON.Color3(.12,.9,.4),new BABYLON.Color3(.1,.58,1),new BABYLON.Color3(.68,.2,1)];
      hues.forEach((color,i)=>{const dot=BABYLON.MeshBuilder.CreateSphere("rainbowOrbDot",{diameter:.12,segments:8},scene);const a=i*Math.PI/3;dot.parent=root;dot.position=new BABYLON.Vector3(Math.cos(a)*.23,.79,Math.sin(a)*.23);dot.material=mat("rainbowDot"+i,color,color.scale(.8));dot.isPickable=false;});
    }
  }
    const obs=state.grid[r]?.[c]?.obs;if(ice>0){if(obs){const obsMesh=BABYLON.MeshBuilder.CreatePlane("iceOverlay",{width:SPACING*.92,height:SPACING*.92},scene);obsMesh.parent=root;obsMesh.position.y=.48;obsMesh.rotation.x=Math.PI/2;obsMesh.material=makeObstacleMaterial(obs,ice);obsMesh.isPickable=false;obsMesh.renderingGroupId=2;}else{
    const stage=ice>=2?0:1;
    const path=stage===0?"./ice_cube_realistic_4k.png":"./ice_cube_stylized_4k.png";
    const key=String(stage);
    if(!iceStageMaterials[key]){
      const mat=new BABYLON.StandardMaterial("iceStageMaterial_"+key,scene);
      const texture=new BABYLON.Texture(path,scene,false,true,BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
        ()=>{texture.hasAlpha=true;mat.diffuseTexture=texture;mat.useAlphaFromDiffuseTexture=true;mat.transparencyMode=BABYLON.Material.MATERIAL_ALPHABLEND;mat.specularColor=new BABYLON.Color3(.28,.36,.42);mat.specularPower=28;},
        (message,error)=>console.warn("Ice artwork unavailable:",path,message,error));
      texture.hasAlpha=true;texture.wrapU=BABYLON.Texture.CLAMP_ADDRESSMODE;texture.wrapV=BABYLON.Texture.CLAMP_ADDRESSMODE;
      mat.diffuseTexture=texture;mat.useAlphaFromDiffuseTexture=true;mat.transparencyMode=BABYLON.Material.MATERIAL_ALPHABLEND;
      mat.diffuseColor=new BABYLON.Color3(.86,.93,1);mat.emissiveColor=new BABYLON.Color3(.015,.025,.04);mat.specularColor=new BABYLON.Color3(.28,.36,.42);mat.specularPower=28;mat.backFaceCulling=false;
      iceStageMaterials[key]=mat;iceStageTextures[key]=texture;
    }
    // A real 3D box gives the supplied 4K ice artwork depth from every viewing angle.
    const iceBox=BABYLON.MeshBuilder.CreateBox("iceCube3D_"+stage+"_"+r+"_"+c,{width:SPACING*.88,height:SPACING*.88,depth:SPACING*.88,segments:1},scene);
    iceBox.parent=root;iceBox.position.y=.39;iceBox.material=iceStageMaterials[key];iceBox.isPickable=false;iceBox.renderingGroupId=2;
    const texture=iceStageTextures[key];
    const revealIceWhenReady=()=>{if(root.isDisposed?.()||iceBox.isDisposed?.())return;if(texture&&texture.isReady()){iceBox.setEnabled(true);return;}if(texture)setTimeout(revealIceWhenReady,60);};
    iceBox.setEnabled(false);revealIceWhenReady();
  }
  }root.__cmrSpriteBacked=!!artworkPath;
  return root;
}
// FIX: animations can never hang. The frame loop is wrapped in try/catch and
// every animate() promise has a safety timeout, so state.busy can't get stuck.
function runAnimations(){
  animationFrame=0;
  const now=performance.now();
  try{
    for(const job of Array.from(activeAnimations)){
      if(!job.mesh||job.mesh.isDisposed?.()){activeAnimations.delete(job);job.resolve();continue;}
      const t=Math.max(0,Math.min(1,(now-job.begin)/job.duration)),e=1-Math.pow(1-t,3);
      BABYLON.Vector3.LerpToRef(job.start,job.target,e,job.mesh.position);
      if(t>=1){activeAnimations.delete(job);job.resolve();}
    }
  }catch(err){
    console.error("Animation loop error:",err);
    for(const job of activeAnimations)job.resolve();
    activeAnimations.clear();
  }
  if(activeAnimations.size)animationFrame=requestAnimationFrame(runAnimations);
}
function animate(mesh,target,duration=170){
  return new Promise(resolve=>{
    let done=false;
    const finish=()=>{if(done)return;done=true;resolve();};
    const job={mesh,start:mesh.position.clone(),target:target.clone(),duration,begin:performance.now(),resolve:finish};
    activeAnimations.add(job);
    // Safety net: the promise always resolves, even if the frame loop stalls.
    setTimeout(()=>{
      if(activeAnimations.delete(job)&&mesh&&!mesh.isDisposed?.())mesh.position.copyFrom(target);
      finish();
    },duration+600);
    if(!animationFrame)animationFrame=requestAnimationFrame(runAnimations);
  });
}
function makeBoard(){ /* The uploaded artwork supplies the empty 7x8 board and frame. */ }
function setupScene(){
  if(engine&&scene)return;
  // Validate startup dependencies before Babylon registers canvas event listeners.
  if(!window.BABYLON||typeof BABYLON.Engine!=="function"){
    throw new Error("مكتبة Babylon.js لم يتم تحميلها");
  }
  canvas=$("renderCanvas");
  if(!canvas||typeof canvas.addEventListener!=="function"){
    throw new Error("عنصر لوحة اللعب renderCanvas غير موجود في الصفحة");
  }
  engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,antialias:true},false);
  // Reduce mobile GPU load; requestAnimationFrame follows 60/90/120 Hz displays when supported.
  const deviceRatio=Math.max(1,window.devicePixelRatio||1);
  const hardwareScale=1;
  engine.setHardwareScalingLevel(hardwareScale); // Render at native device resolution for sharper candy artwork.
  engine.enableOfflineSupport=false;
  scene=new BABYLON.Scene(engine);scene.clearColor=new BABYLON.Color4(0,0,0,0);
  scene.skipPointerMovePicking=true;
  scene.imageProcessingConfiguration.toneMappingEnabled=false;
  camera=new BABYLON.ArcRotateCamera("royalCamera",-Math.PI/2,.02,14.6,new BABYLON.Vector3(0,0,0),scene);
  camera.mode=BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
  camera.orthoLeft=-3.58;camera.orthoRight=3.58;camera.orthoTop=4.09;camera.orthoBottom=-4.09;
  camera.lowerRadiusLimit=14.6;camera.upperRadiusLimit=14.6;camera.inputs.clear();camera.minZ=.1;camera.maxZ=100;
  const hemi=new BABYLON.HemisphericLight("softbox",new BABYLON.Vector3(0,1,-.35),scene);hemi.intensity=1.05;
  const key=new BABYLON.DirectionalLight("candyKey",new BABYLON.Vector3(-.45,-1,.65),scene);key.position=new BABYLON.Vector3(-5,10,-7);key.intensity=1.15;
  // Keep the scene lightweight on mobile: two lights, no full-screen glow post-process.
  makeBoard();bindInput();
  let lastRenderAt=0;renderLoop=()=>{if(document.hidden)return;const now=performance.now();if(now-lastRenderAt<1000/60)return;lastRenderAt=now;scene.render();};
  engine.runRenderLoop(renderLoop);
  window.CMRPauseGameRender=()=>{if(engine&&renderLoop)engine.stopRenderLoop(renderLoop);};
  window.CMRResumeGameRender=()=>{if(engine&&renderLoop&&!document.hidden)engine.runRenderLoop(renderLoop);};
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&engine)engine.resize();});
  window.addEventListener("resize",()=>engine.resize());
  requestAnimationFrame(()=>engine.resize());
}
function randomType(r,c){
  const createsMatch=t=>(c>1&&state.grid[r][c-1]?.type===t&&state.grid[r][c-2]?.type===t)||(r>1&&state.grid[r-1][c]?.type===t&&state.grid[r-2][c]?.type===t);
  let t=rand(),tries=0;
  while(tries<12&&createsMatch(t)){t=rand();tries++;}
  // Deterministic fallback guarantees the first board has no accidental triples,
  // even if the random retry limit is reached on an unlucky mobile session.
  if(createsMatch(t))for(let candidate=1;candidate<=TYPES;candidate++){if(!createsMatch(candidate)){t=candidate;break;}}
  return t;
}
function damageIceAt(r,c,score=25,source="booster"){
  const item=state.grid[r]?.[c];if(!item||(item.ice<=0&&!item.obs))return false;
  const obs=item.obs||(item.ice>1?"double_ice":"single_ice"),def=OBSTACLE_DEFS[obs]||OBSTACLE_DEFS.single_ice;
  if(source==="adj"&&!def.adj)return false;
  if(source==="self"&&!def.self)return false;
  const impactPosition=item.mesh?.position?.clone();
  item.ice=Math.max(0,(Number(item.ice)||def.hp||1)-1);
  if(obs==="double_ice"&&item.ice===1)item.obs="single_ice";
  if(item.ice===0){state.obstaclesCleared=Math.min(state.obstacleGoal,state.obstaclesCleared+1);
    item.obs=null;
    if(obs==="vault"){state.coins+=75;state.score+=125;say("اتفتحت الخزنة الملكية! +75 عملة");}
    else if(obs==="golden_cage"){state.coins+=50;state.score+=100;say("اتفتح القفص الذهبي! +50 عملة");}
    else if(def.reward){const sp=["striped","wrapped","color"];item.special=sp[Math.floor(Math.random()*sp.length)];}
    if(obs==="whirlpool"){
      const neighbours=[[-1,0],[1,0],[0,-1],[0,1]].map(([dr,dc])=>[r+dr,c+dc]).filter(([nr,nc])=>inBounds(nr,nc)&&state.grid[nr]?.[nc]&&!state.grid[nr][nc].obs&&!(state.grid[nr][nc].ice>0));
      if(neighbours.length){
        const [nr,nc]=neighbours[Math.floor(Math.random()*neighbours.length)],victim=state.grid[nr][nc];
        if(victim?.mesh&&!victim.mesh.isDisposed?.()){burstAt(victim.mesh.position,victim.type);victim.mesh.dispose();}
        state.grid[nr][nc]=null;state.score+=80;
      }
    }
  }
  state.iceRemaining=countObstacles();
  if(item.mesh&&!item.mesh.isDisposed?.())item.mesh.dispose();
  item.mesh=candyMesh(r,c,item.type,item.special,item.ice);
  state.score+=score;
  if(impactPosition){iceImpactAt(impactPosition,item.ice);playSfx("match");}
  return true;
}
function _unused_damageIceAt(r,c,score=25){
  const item=state.grid[r]?.[c];if(!item||item.ice<=0)return false;
  const impactPosition=item.mesh?.position?.clone();
  item.ice=Math.max(0,item.ice-1);
  if(item.ice===0)state.iceRemaining=Math.max(0,state.iceRemaining-1);
  if(item.mesh&&!item.mesh.isDisposed?.())item.mesh.dispose();
  item.mesh=candyMesh(r,c,item.type,item.special,item.ice);
  state.score+=score;
  if(impactPosition){shockwaveAt(impactPosition,"ice");playSfx("match");}
  return true;
}
function buildGrid(){
  // Dispose the previous board before creating another one to prevent GPU memory leaks.
  for(const row of state.grid)for(const item of row)if(item?.mesh&&!item.mesh.isDisposed?.())item.mesh.dispose();
  const saved=state.savedGrid;
  const canRestore=Array.isArray(saved)&&saved.length===ROWS&&saved.every(row=>Array.isArray(row)&&row.length===COLS&&row.every(cell=>cell&&Number.isInteger(cell.type)&&cell.type>=1&&cell.type<=TYPES));
  const cfg=getLevelConfig(state.level);const obsMap=new Map();if(!canRestore){state.target=cfg.target;state.moves=cfg.moves;state.obstacleGoal=Math.min(cfg.obstacleCount,Math.max(1,Math.ceil(cfg.obstacleCount*.7)));state.obstaclesCleared=0;state.chocolateBrokenThisTurn=false;const obstacleDeck=Array.from({length:cfg.obstacleCount},(_,i)=>cfg.obstacles[i%cfg.obstacles.length]);for(let i=obstacleDeck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[obstacleDeck[i],obstacleDeck[j]]=[obstacleDeck[j],obstacleDeck[i]];}for(let n=0;n<cfg.obstacleCount;n++){const o=obstacleDeck[n];let idx,tries=0;do{idx=Math.floor(Math.random()*ROWS*COLS);tries++;}while(obsMap.has(idx)&&tries<100);if(!obsMap.has(idx))obsMap.set(idx,o);}}else{state.obstacleGoal=Math.max(1,Number(state.obstacleGoal)||1);state.obstaclesCleared=Math.max(0,Number(state.obstaclesCleared)||0);}
  // obstacles from getLevelConfig
  state.iceRemaining=0;
  state.grid=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const savedCell=canRestore?saved[r][c]:null;
    const type=savedCell?savedCell.type:randomType(r,c);
    const special=savedCell&&(savedCell.special==="color"||savedCell.special==="striped"||savedCell.special==="wrapped")?savedCell.special:null;
    const obs=savedCell?(savedCell.obs||null):(obsMap.get(r*COLS+c)||null);const ice=savedCell?Math.max(0,Math.min(3,Number(savedCell.ice)||0)):(obs?(OBSTACLE_DEFS[obs]?.hp||1):0);
    if(ice)state.iceRemaining++;
    state.grid[r][c]={type,special,ice,obs,mesh:null};state.grid[r][c].mesh=candyMesh(r,c,type,special,ice);
  }
  state.savedGrid=null;
}
function cellScreenPos(r,c){const rect=canvas.getBoundingClientRect(),rw=engine.getRenderWidth()||rect.width||1,rh=engine.getRenderHeight()||rect.height||1,vp=camera.viewport.toGlobal(rw,rh),p=BABYLON.Vector3.Project(pos(r,c),BABYLON.Matrix.Identity(),scene.getTransformMatrix(),vp);return{x:rect.left+(p.x/rw)*rect.width,y:rect.top+(p.y/rh)*rect.height};}function pickCellAtClient(clientX,clientY){const rect=canvas.getBoundingClientRect(),maxDist=Math.max(rect.width/COLS,rect.height/ROWS)*0.85;let best=null,bestD=Infinity;for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){const sp=cellScreenPos(r,c),d=Math.hypot(clientX-sp.x,clientY-sp.y);if(d<bestD&&d<=maxDist){bestD=d;best={r,c};}}}return best;}function chooseNeighbour(cell,dx,dy){const origin=cellScreenPos(cell.r,cell.c),dirs=[[cell.r-1,cell.c],[cell.r+1,cell.c],[cell.r,cell.c-1],[cell.r,cell.c+1]];let best=null,bestDot=-Infinity;for(const[nr,nc]of dirs){if(!inBounds(nr,nc))continue;const np=cellScreenPos(nr,nc),vx=np.x-origin.x,vy=np.y-origin.y,len=Math.hypot(vx,vy)||1,dot=(dx*vx+dy*vy)/len;if(dot>bestDot){bestDot=dot;best={r:nr,c:nc};}}return best;}function bindInput(){if(!canvas||typeof canvas.addEventListener!=="function")throw new Error("لوحة الرسم renderCanvas غير موجودة");let gesture=null;const reset=()=>{gesture=null;};canvas.addEventListener("pointerdown",event=>{if(state.busy||state.won)return;event.preventDefault();const startCell=pickCellAtClient(event.clientX,event.clientY);if(!startCell)return;gesture={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,startCell,swiped:false};if(canvas.setPointerCapture){try{canvas.setPointerCapture(event.pointerId);}catch(_){}}},{passive:false});canvas.addEventListener("pointermove",event=>{if(!gesture||gesture.swiped||event.pointerId!==gesture.pointerId)return;event.preventDefault();if(state.busy||state.won)return;const dx=event.clientX-gesture.startX,dy=event.clientY-gesture.startY;if(Math.hypot(dx,dy)>=14){gesture.swiped=true;const next=chooseNeighbour(gesture.startCell,dx,dy),start=gesture.startCell;gesture=null;if(next&&inBounds(next.r,next.c)){clearSelection();void swap(start,next);}}},{passive:false});canvas.addEventListener("pointerup",event=>{if(!gesture||event.pointerId!==gesture.pointerId)return;event.preventDefault();const g=gesture;gesture=null;if(state.busy||state.won)return;if(!g.swiped)tapCell(g.startCell);},{passive:false});canvas.addEventListener("pointercancel",reset,{passive:true});canvas.addEventListener("lostpointercapture",reset,{passive:true});window.addEventListener("blur",reset);}function inBounds(r,c){return r>=0&&r<ROWS&&c>=0&&c<COLS;}
async function useSelectedBooster(cell){
  if(state.busy||state.won||!state.booster)return;
  const kind=state.booster,counts={bomb:state.hammer,rocket:state.rockets,color:state.colors,paint:state.paints};
  if((counts[kind]||0)<=0){say("المساعد ده خلص. اختار مساعد تاني.");state.booster=null;return;}
  const anchor=state.grid[cell.r][cell.c];if(!anchor)return;
  state.busy=true;clearSelection();
  try{
    if(kind==="paint"){
      const neighbors=[[cell.r-1,cell.c],[cell.r+1,cell.c],[cell.r,cell.c-1],[cell.r,cell.c+1]].filter(([r,c])=>inBounds(r,c)&&state.grid[r][c]&&!state.grid[r][c].special);
      const target=neighbors.find(([r,c])=>state.grid[r][c].type!==anchor.type);
      if(!target){say("اختار حلوى جنب لون مختلف.");state.busy=false;return;}
      const newType=state.grid[target[0]][target[1]].type;
      if(anchor.mesh&&!anchor.mesh.isDisposed?.())anchor.mesh.dispose();
      anchor.type=newType;anchor.special=null;anchor.mesh=candyMesh(cell.r,cell.c,newType,null,anchor.ice||0);
      state.paints--;state.score+=40;state.moves=Math.max(0,state.moves-1);say("اتغير لون الحلوى!");
    }else{
      const cells=new Set();
      if(kind==="bomb"){
        for(let r=cell.r-1;r<=cell.r+1;r++)for(let c=cell.c-1;c<=cell.c+1;c++)if(inBounds(r,c))cells.add(r+","+c);
      }else if(kind==="rocket"){
        for(let c=0;c<COLS;c++)cells.add(cell.r+","+c);
        for(let r=0;r<ROWS;r++)cells.add(r+","+cell.c);
      }else if(kind==="color"){
        const targetType=anchor.type;
        for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(state.grid[r][c]?.type===targetType)cells.add(r+","+c);
      }
      shockwaveAt(anchor.mesh.position,kind);playSfx(kind==="bomb"?"bomb":kind==="rocket"?"rocket":"color");
      for(const key of cells){
        const [r,c]=key.split(",").map(Number),it=state.grid[r][c];if(!it)continue;
        if(it.ice>0){damageIceAt(r,c,40);continue;}
        burstAt(it.mesh.position,it.type);if(it.mesh&&!it.mesh.isDisposed?.())it.mesh.dispose();
        state.grid[r][c]=null;state.score+=kind==="color"?75:85;
      }
      if(kind==="bomb")state.hammer--;if(kind==="rocket")state.rockets--;if(kind==="color")state.colors--;
      state.moves=Math.max(0,state.moves-1);
      say(kind==="bomb"?"انفجار القنبلة!":kind==="rocket"?"الصاروخ مسح الصف والعمود!":"كرة الألوان مسحت نفس اللون!");
    }
    state.booster=null;
    for(const id of ["paintBtn","bombBtn","colorBtn","rocketBtn"]){const button=$(id);if(button)button.classList.remove("active");}
    refreshBoosterBadges();updateHud();await wait(90);await settle();
  }catch(error){console.error("Booster failed:",error);say("المساعد اتعطل، جرّب تاني.");}
  finally{state.busy=false;updateHud();checkEnd();if(!state.won&&state.moves>0&&!hasPossibleMove())shuffle();saveProgress(state.won&&state.score>=state.target);}
}
function tapCell(cell){
  if(state.booster){void useSelectedBooster(cell);return;}
  if(state.selected){
    const previous=state.selected;
    if(previous.r===cell.r&&previous.c===cell.c){clearSelection();return;}
    if(Math.abs(previous.r-cell.r)+Math.abs(previous.c-cell.c)===1){
      clearSelection();void swap(previous,cell);return;
    }
  }
  select(cell);
}
function select(cell){
  clearSelection();
  state.selected=cell;
  const item=state.grid[cell.r][cell.c];
  if(item?.mesh)item.mesh.scaling.setAll(1.08);
}
function clearSelection(){
  if(state.selected){
    const it=state.grid[state.selected.r][state.selected.c];
    if(it?.mesh)it.mesh.scaling.setAll(1);
  }
  state.selected=null;
}
async function swap(a,b){
  if(state.busy||!inBounds(a.r,a.c)||!inBounds(b.r,b.c))return;
  if(Math.abs(a.r-b.r)+Math.abs(a.c-b.c)!==1)return;
  const A=state.grid[a.r][a.c],B=state.grid[b.r][b.c];if(!A||!B||isCellLocked(A)||isCellLocked(B)){clearSelection();return;}
  state.busy=true;clearSelection();
  try{
    await Promise.all([animate(A.mesh,pos(b.r,b.c),115),animate(B.mesh,pos(a.r,a.c),115)]);
    state.grid[a.r][a.c]=B;state.grid[b.r][b.c]=A;
    A.mesh.metadata={r:b.r,c:b.c,candy:true};B.mesh.metadata={r:a.r,c:a.c,candy:true};
    // A special candy activates only when deliberately swapped with an adjacent candy.
    // Ordinary swaps still require a confirmed 3+ match and revert when invalid.
    if(A.special||B.special){
      state.moves--;state.chocolateBrokenThisTurn=false;updateHud();
      await activateSpecial(a,b);
      await settle();
    }else if(findMatches().size===0){
      await Promise.all([animate(A.mesh,pos(a.r,a.c),115),animate(B.mesh,pos(b.r,b.c),115)]);
      state.grid[a.r][a.c]=A;state.grid[b.r][b.c]=B;
      A.mesh.metadata={r:a.r,c:a.c,candy:true};B.mesh.metadata={r:b.r,c:b.c,candy:true};
    }else{state.moves--;state.chocolateBrokenThisTurn=false;updateHud();await settle();}
  }catch(error){console.error("Candy swap failed:",error);say("حصلت مشكلة في الحركة، جرّب تاني.");}
  finally{state.busy=false;checkEnd();if(!state.won&&state.moves>0&&!hasPossibleMove())shuffle();saveProgress(state.won&&state.score>=state.target);}
}
function findMatches(){
  const found=new Set();
  // Match by base color, regardless of whether a candy is special.
  // A special candy activates only when it belongs to a confirmed 3+ match;
  // swapping/touching it without a resulting match never activates it.
  const sameCandy=(a,b)=>!!a&&!!b&&a.type===b.type;
  for(let r=0;r<ROWS;r++){
    let c=0;while(c<COLS){
      const item=state.grid[r][c];if(!item){c++;continue;}
      let end=c+1;while(end<COLS&&sameCandy(state.grid[r][end],item))end++;
      if(end-c>=3)for(let k=c;k<end;k++)found.add(r+","+k);c=end;
    }
  }
  for(let c=0;c<COLS;c++){
    let r=0;while(r<ROWS){
      const item=state.grid[r][c];if(!item){r++;continue;}
      let end=r+1;while(end<ROWS&&sameCandy(state.grid[end][c],item))end++;
      if(end-r>=3)for(let k=r;k<end;k++)found.add(k+","+c);r=end;
    }
  }
  return found;
}
function findSpecialCandidate(matches){
  // A T/L intersection of two same-type runs (3+ in each direction) creates a wrapped candy.
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    if(!matches.has(r+","+c))continue;
    const item=state.grid[r][c];if(!item)continue;
    let left=0,right=0,up=0,down=0;
    for(let x=c-1;x>=0&&state.grid[r][x]&&!state.grid[r][x].special&&state.grid[r][x].type===item.type;x--)left++;
    for(let x=c+1;x<COLS&&state.grid[r][x]&&!state.grid[r][x].special&&state.grid[r][x].type===item.type;x++)right++;
    for(let y=r-1;y>=0&&state.grid[y][c]&&!state.grid[y][c].special&&state.grid[y][c].type===item.type;y--)up++;
    for(let y=r+1;y<ROWS&&state.grid[y][c]&&!state.grid[y][c].special&&state.grid[y][c].type===item.type;y++)down++;
    if(left+right+1>=3&&up+down+1>=3)return {length:Math.max(left+right+1,up+down+1)+2,type:"wrapped",cell:{r,c}};
  }
  let best=null;
  const consider=(cells,type)=>{
    if(cells.length<4)return;
    if(!best||cells.length>best.length||(cells.length===best.length&&type==="color"&&best.type!=="color")){
      best={length:cells.length,type,cell:cells[Math.floor(cells.length/2)]};
    }
  };
  // Scan real same-type contiguous runs, not merely adjacent cells that happen to
  // belong to different crossing matches. A vertical match must not join two
  // separate horizontal runs into a false four- or five-candy special.
  for(let r=0;r<ROWS;r++){
    let c=0;
    while(c<COLS){
      const item=state.grid[r][c];
      if(!item||!matches.has(r+","+c)){c++;continue;}
      const type=item.type;let end=c+1;
      while(end<COLS&&matches.has(r+","+end)&&state.grid[r][end]?.type===type)end++;
      const cells=[];for(let x=c;x<end;x++)cells.push({r,c:x});
      consider(cells,cells.length>=5?"color":"striped");
      c=end;
    }
  }
  for(let c=0;c<COLS;c++){
    let r=0;
    while(r<ROWS){
      const item=state.grid[r][c];
      if(!item||!matches.has(r+","+c)){r++;continue;}
      const type=item.type;let end=r+1;
      while(end<ROWS&&matches.has(end+","+c)&&state.grid[end][c]?.type===type)end++;
      const cells=[];for(let y=r;y<end;y++)cells.push({r:y,c});
      consider(cells,cells.length>=5?"color":"striped");
      r=end;
    }
  }
  return best;
}
function beamBetween(from,to,color,duration=280){
  if(activeVfxMeshes.size>=VFX_MESH_LIMIT)return;
  const start=from.clone();start.y+=.54;
  const end=to.clone();end.y+=.54;
  const beam=BABYLON.MeshBuilder.CreateTube("royalEnergyBeam",{path:[start,end],radius:.026,tessellation:6,cap:BABYLON.Mesh.CAP_ROUND},scene);
  const mat=new BABYLON.StandardMaterial("royalEnergyBeamMaterial",scene);
  mat.diffuseColor=color;mat.emissiveColor=color.scale(1.7);mat.specularColor=new BABYLON.Color3(1,1,1);mat.alpha=.92;
  beam.material=mat;beam.isPickable=false;
  const started=performance.now();
  const observer=scene.onBeforeRenderObservable.add(()=>{
    if(beam.isDisposed?.()){scene.onBeforeRenderObservable.remove(observer);if(!mat.isDisposed?.())mat.dispose();return;}
    const t=Math.min(1,(performance.now()-started)/duration);
    mat.alpha=.92*(1-t);
    if(t>=1){scene.onBeforeRenderObservable.remove(observer);if(!mat.isDisposed?.())mat.dispose();}
  });
  trackVfx(beam,duration+40);
}
function rocketSweepAt(cell){
  const origin=pos(cell.r,cell.c);
  shockwaveAt(origin,"rocket");
  const cyan=new BABYLON.Color3(.16,.82,1);
  beamBetween(pos(cell.r,0),pos(cell.r,COLS-1),cyan,300);
  beamBetween(pos(0,cell.c),pos(ROWS-1,cell.c),cyan,300);
}
function wrappedDetonationAt(cell,type){
  const origin=pos(cell.r,cell.c);
  shockwaveAt(origin,"wrapped");
  burstAt(origin,type);
}
function colorChainAt(originCell,targetType){
  const origin=pos(originCell.r,originCell.c);
  shockwaveAt(origin,"color");
  const beamColor=targetType?palette[Math.max(1,Math.min(TYPES,targetType))-1].color:new BABYLON.Color3(.84,.42,1);
  let emitted=0;
  for(let r=0;r<ROWS&&emitted<18;r++)for(let c=0;c<COLS&&emitted<18;c++){
    const item=state.grid[r]?.[c];
    if(!item||(targetType&&item.type!==targetType)||(r===originCell.r&&c===originCell.c))continue;
    beamBetween(origin,pos(r,c),beamColor,260+emitted*4);
    emitted++;
  }
}
async function activateSpecial(a,b){
  const A=state.grid[a.r][a.c],B=state.grid[b.r][b.c];
  if(A?.special||B?.special){
    const kind=A?.special||B?.special;
    playSfx(kind==="wrapped"?"bomb":kind==="striped"?"rocket":"color");
    if(A?.special==="wrapped")wrappedDetonationAt(a,A.type);
    else if(A?.special==="striped")rocketSweepAt(a);
    else if(A?.special==="color")colorChainAt(a,B?.type||null);
    if(B?.special==="wrapped")wrappedDetonationAt(b,B.type);
    else if(B?.special==="striped")rocketSweepAt(b);
    else if(B?.special==="color")colorChainAt(b,A?.type||null);
  }
  const cells=new Set([a.r+","+a.c,b.r+","+b.c]);
  const addCross=cell=>{for(let k=0;k<COLS;k++)cells.add(cell.r+","+k);for(let k=0;k<ROWS;k++)cells.add(k+","+cell.c);};
  if(A?.special==="color"&&B?.special==="color"){
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)cells.add(r+","+c);
  }else if(A?.special==="wrapped"&&B?.special==="wrapped"){
    for(const center of [a,b])for(let r=center.r-2;r<=center.r+2;r++)for(let c=center.c-2;c<=center.c+2;c++)if(inBounds(r,c))cells.add(r+","+c);
  }else if((A?.special==="wrapped"&&B?.special==="striped")||(B?.special==="wrapped"&&A?.special==="striped")){
    const center=A.special==="wrapped"?a:b;
    for(let offset=-1;offset<=1;offset++){
      for(let c=0;c<COLS;c++)if(inBounds(center.r+offset,c))cells.add((center.r+offset)+","+c);
      for(let r=0;r<ROWS;r++)if(inBounds(r,center.c+offset))cells.add(r+","+(center.c+offset));
    }
  }else if((A?.special==="wrapped"&&B?.special==="color")||(B?.special==="wrapped"&&A?.special==="color")){
    const wrapped=A.special==="wrapped"?A:B,center=A.special==="wrapped"?a:b;
    const target=(wrapped===A?B:A)?.type;
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(state.grid[r][c]?.type===target){
      for(let y=r-1;y<=r+1;y++)for(let x=c-1;x<=c+1;x++)if(inBounds(y,x))cells.add(y+","+x);
    }
    for(let r=center.r-1;r<=center.r+1;r++)for(let c=center.c-1;c<=center.c+1;c++)if(inBounds(r,c))cells.add(r+","+c);
  }else if(A?.special==="wrapped"||B?.special==="wrapped"){
    const center=A?.special==="wrapped"?a:b;
    for(let r=center.r-1;r<=center.r+1;r++)for(let c=center.c-1;c<=center.c+1;c++)if(inBounds(r,c))cells.add(r+","+c);
  }else if(A?.special==="striped"&&B?.special==="striped"){
    addCross(a);addCross(b);
  }else if(A?.special==="color"||B?.special==="color"){
    const colorCandy=A.special==="color"?A:B;
    const other=A.special==="color"?B:A;
    const target=other?.type;
    if(target)for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      if(state.grid[r][c]?.type===target){cells.add(r+","+c);if(other.special==="striped")addCross({r,c});}
    }
    if(colorCandy===A&&B?.special==="striped")addCross(b);
    if(colorCandy===B&&A?.special==="striped")addCross(a);
  }else{
    // A striped candy clears the row and column passing through its own cell,
    // not through the ordinary candy it was swapped with.
    if(A?.special==="striped")addCross(a);
    if(B?.special==="striped")addCross(b);
  }
  for(const key of cells){
    const [r,c]=key.split(",").map(Number),it=state.grid[r][c];
    if(it){if(it.ice>0){damageIceAt(r,c,25);}else{burstAt(it.mesh.position,it.type);it.mesh.dispose();state.grid[r][c]=null;state.score+=60;}}
  }
  updateHud();await wait(170);
}
function triggerCharacterCombo(chain){
  const queen=$("queen"),dragon=$("dragon");
  if(!queen||!dragon)return;
  const tier=chain>=3?3:chain===2?2:1;
  const message=tier===3?"قوة سحرية هائلة!":tier===2?"الكومبو بيزيد!":"رائع! استمر!";
  $("characterMessage").textContent=message;
  for(const [el,kind] of [[queen,"queen"],[dragon,"dragon"]]){
    el.classList.remove("combo-1","combo-2","combo-3");
    // Restart the CSS animation even when two cascades happen quickly.
    void el.offsetWidth;
    el.classList.add("combo-"+tier);
    el.addEventListener("animationend",()=>el.classList.remove("combo-1","combo-2","combo-3"),{once:true});
  }
}
function hasHoles(){
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(!state.grid[r][c])return true;
  return false;
}
// Drop candies into empty cells and refill the top. Also used after special candies
// clear cells, so the board never stays with empty holes.
async function dropAndRefill(){
  const falling=[];
  for(let c=0;c<COLS;c++){
    let write=ROWS-1;
    for(let r=ROWS-1;r>=0;r--){const it=state.grid[r][c];if(it){if(write!==r){state.grid[write][c]=it;state.grid[r][c]=null;it.mesh.metadata={r:write,c:c,candy:true};falling.push(animate(it.mesh,pos(write,c),170));}write--;}}
    for(let r=write;r>=0;r--){
      const type=rand(),mesh=candyMesh(r,c,type,null);
      // New candies always enter from above the top edge, then fall down into gaps.
      const target=pos(r,c);
      const rowsAbove=write-r+1;
      mesh.position=new BABYLON.Vector3(target.x,.17,target.z+SPACING*(rowsAbove+0.8));
      state.grid[r][c]={type:type,special:null,mesh:mesh};
      mesh.metadata={r:r,c:c,candy:true};
      falling.push(animate(mesh,target,Math.min(300,180+rowsAbove*24)));
    }
  }
  await Promise.all(falling);
  await wait(80);
}
async function settle(){
  let chain=0;
  // Prevent a pathological cascade from locking the board or monopolizing a mobile frame.
  // Bound cascade work so one lucky chain cannot monopolize a mobile browser.
  while(chain<8){
    if(hasHoles())await dropAndRefill();
    const matches=findMatches();if(matches.size===0)break;
    chain++;playSfx("match");
    // Only specials that are themselves inside a confirmed 3+ same-type match fire.
    // Their blast expands the clear set; merely touching/swapping a special never does.
    const matchedSpecials=[];
    for(const key of matches){
      const [r,c]=key.split(",").map(Number),item=state.grid[r][c];
      if(item?.special)matchedSpecials.push({r,c,item});
    }
    for(const {r,c,item} of matchedSpecials){
      if(item.special==="wrapped"){
        for(let y=r-1;y<=r+1;y++)for(let x=c-1;x<=c+1;x++)if(inBounds(y,x))matches.add(y+","+x);
        playSfx("bomb");wrappedDetonationAt({r,c},item.type);
      }else if(item.special==="striped"){
        for(let x=0;x<COLS;x++)matches.add(r+","+x);
        for(let y=0;y<ROWS;y++)matches.add(y+","+c);
        playSfx("rocket");rocketSweepAt({r,c});
      }else if(item.special==="color"){
        for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(state.grid[y][x]?.type===item.type)matches.add(y+","+x);
        playSfx("color");colorChainAt({r,c},item.type);
      }
    }
    const remove=Array.from(matches).map(s=>s.split(",").map(Number));
    // A confirmed 3+ match also cracks ice directly beside its matched candies.
    // Deduplicate cells so an ice block touched by two matched candies takes one hit only.
    const obstacleHitCells=new Map();
    for(const key of matches){
      const [mr,mc]=key.split(",").map(Number),current=state.grid[mr]?.[mc];
      if(current&&(current.obs||current.ice>0))obstacleHitCells.set(mr+","+mc,"self");
      for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
        const ir=mr+dr,ic=mc+dc,near=state.grid[ir]?.[ic];
        if(inBounds(ir,ic)&&near&&(near.obs||near.ice>0)&&!obstacleHitCells.has(ir+","+ic))obstacleHitCells.set(ir+","+ic,"adj");
      }
    }
    for(const [key,source] of obstacleHitCells){const [ir,ic]=key.split(",").map(Number);damageIceAt(ir,ic,25,source);}
    const specialCandidate=matchedSpecials.length===0&&chain===1?findSpecialCandidate(matches):null;
    const groupSpecial=specialCandidate?.type||null;
    const keep=specialCandidate?.cell||null;
    for(const p of remove){
      const r=p[0],c=p[1],it=state.grid[r][c];
      if(keep&&r===keep.r&&c===keep.c)continue;
      if(it?.ice>0||it?.obs){if(!obstacleHitCells.has(r+","+c))damageIceAt(r,c,25,"self");if(state.grid[r][c]?.ice>0||state.grid[r][c]?.obs)continue;}
      if(it&&it.mesh){burstAt(it.mesh.position,it.type);it.mesh.dispose();}
      state.grid[r][c]=null;state.score+=60;
    }
    if(keep){
      const it=state.grid[keep.r][keep.c];if(it){it.special=groupSpecial;it.mesh.dispose();it.mesh=candyMesh(keep.r,keep.c,it.type,groupSpecial,it.ice||0);}
    }
    if(chain>1)state.score+=matches.size*10;
    updateHud();await wait(100);
    await dropAndRefill();
  }
  if(findMatches().size>0){
    // A pathological board can keep auto-matching; reshuffle its types in place
    // to restore a playable stable board instead of leaving the game locked.
    const items=state.grid.flat().filter(Boolean);
    const original=items.map(item=>item.type);
    let stable=false;
    for(let attempt=0;attempt<12&&!stable;attempt++){
      const values=original.slice();
      for(let i=values.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
      for(let i=0;i<items.length;i++)items[i].type=values[i];
      stable=findMatches().size===0&&hasPossibleMove();
    }
    if(!stable){
      // Last-resort safe board with no initial horizontal or vertical triples.
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
        let type=rand(),tries=0;
        while(tries++<12&&((c>1&&state.grid[r][c-1].type===type&&state.grid[r][c-2].type===type)||(r>1&&state.grid[r-1][c].type===type&&state.grid[r-2][c].type===type)))type=rand();
        state.grid[r][c].type=type;
      }
    }
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      const item=state.grid[r][c];if(item?.mesh){
        item.mesh.dispose();item.mesh=candyMesh(r,c,item.type,item.special||null,item.ice||0);
        item.mesh.metadata={r,c,candy:true};
      }
    }
    say("تم ترتيب اللوحة تلقائيًا عشان تقدر تكمل اللعب.");
  }else if(chain>1)say("سلسلة سحرية ×"+chain+"!");
  spreadChocolateIfNeeded();updateHud();
}
const activeVfxMeshes=new Set();
const VFX_MESH_LIMIT=72;
const vfxMaterials={};
function getVfxMaterial(key,color,alpha=1){
  if(vfxMaterials[key])return vfxMaterials[key];
  const mat=new BABYLON.StandardMaterial("royalVfx_"+key,scene);
  mat.diffuseColor=color;mat.emissiveColor=color.scale(1.25);mat.specularColor=new BABYLON.Color3(.9,.95,1);
  mat.specularPower=64;mat.alpha=alpha;mat.disableLighting=false;
  vfxMaterials[key]=mat;return mat;
}
function trackVfx(mesh,duration=420){
  if(activeVfxMeshes.size>=VFX_MESH_LIMIT){
    const oldest=activeVfxMeshes.values().next().value;
    if(oldest){activeVfxMeshes.delete(oldest);if(!oldest.isDisposed?.())oldest.dispose();}
  }
  activeVfxMeshes.add(mesh);
  const started=performance.now();
  const observer=scene.onBeforeRenderObservable.add(()=>{
    if(mesh.isDisposed?.()){scene.onBeforeRenderObservable.remove(observer);activeVfxMeshes.delete(mesh);return;}
    const t=Math.min(1,(performance.now()-started)/duration);
    if(t>=1){scene.onBeforeRenderObservable.remove(observer);activeVfxMeshes.delete(mesh);mesh.dispose();}
  });
  return observer;
}
function shockwaveAt(position,kind){
  const colors={wrapped:new BABYLON.Color3(1,.48,.12),striped:new BABYLON.Color3(.12,.78,1),color:new BABYLON.Color3(.8,.28,1),bomb:new BABYLON.Color3(1,.48,.12),rocket:new BABYLON.Color3(.12,.78,1),ice:new BABYLON.Color3(.48,.88,1)};
  const color=colors[kind]||new BABYLON.Color3(1,.78,.32);
  // Two concentric rings create a layered impact without a costly full-screen post-process.
  for(let layer=0;layer<2;layer++){
    const ring=BABYLON.MeshBuilder.CreateTorus("royalShockwave",{diameter:1,thickness:layer?.022:.052,tessellation:40},scene);
    ring.position=position.clone();ring.position.y+=.5+layer*.035;ring.rotation.x=Math.PI/2;
    ring.scaling.setAll(.1);ring.isPickable=false;
    const ringMat=new BABYLON.StandardMaterial("royalShockMaterial_"+kind,scene);
    ringMat.diffuseColor=color;ringMat.emissiveColor=color.scale(1.25);ringMat.alpha=layer?.52:.9;ringMat.specularPower=64;ring.material=ringMat;
    const started=performance.now(),duration=layer?480:360;
    const observer=scene.onBeforeRenderObservable.add(()=>{
      if(ring.isDisposed?.()){scene.onBeforeRenderObservable.remove(observer);return;}
      const t=Math.min(1,(performance.now()-started)/duration),ease=1-Math.pow(1-t,2);
      ring.scaling.setAll(.12+(layer?2.75:2.05)*ease);
      ring.material.alpha=(layer?.52:.9)*(1-t);
      if(t>=1){scene.onBeforeRenderObservable.remove(observer);ringMat.dispose();}
    });
    trackVfx(ring,duration+30);
  }
}
function burstAt(position,type){
  const safeType=Math.max(1,Math.min(TYPES,Number(type)||1));
  const candyColor=palette[safeType-1].color;
  const material=getVfxMaterial("sugar_"+safeType,candyColor);
  // Compact premium pop: one expanding halo plus radial candy-glass fragments.
  if(activeVfxMeshes.size<VFX_MESH_LIMIT-7){
    const halo=BABYLON.MeshBuilder.CreateTorus("candyBurstHalo",{diameter:.58,thickness:.035,tessellation:32},scene);
    halo.position=position.clone();halo.position.y+=.43;halo.rotation.x=Math.PI/2;
    const haloMat=new BABYLON.StandardMaterial("candyBurstHaloMat_"+safeType,scene);
    haloMat.diffuseColor=candyColor;haloMat.emissiveColor=candyColor.scale(1.35);haloMat.alpha=.82;halo.material=haloMat;halo.isPickable=false;
    const started=performance.now(),duration=245;
    const observer=scene.onBeforeRenderObservable.add(()=>{
      if(halo.isDisposed?.()){scene.onBeforeRenderObservable.remove(observer);if(!haloMat.isDisposed?.())haloMat.dispose();return;}
      const t=Math.min(1,(performance.now()-started)/duration);
      halo.scaling.setAll(.55+t*1.35);haloMat.alpha=.82*(1-t);
      if(t>=1){scene.onBeforeRenderObservable.remove(observer);if(!halo.isDisposed?.())halo.dispose();if(!haloMat.isDisposed?.())haloMat.dispose();}
    });
    trackVfx(halo,duration+40);
  }
  for(let i=0;i<7;i++){
    if(activeVfxMeshes.size>=VFX_MESH_LIMIT)break;
    const size=.045+Math.random()*.04;
    const p=BABYLON.MeshBuilder.CreatePolyhedron("sugarShard",{type:1,size},scene);
    p.position=position.clone();p.position.y+=.17+Math.random()*.08;p.material=material;p.isPickable=false;
    const angle=Math.PI*2*i/7+(Math.random()-.5)*.24,dist=.38+Math.random()*.25;
    const target=position.add(new BABYLON.Vector3(Math.cos(angle)*dist,.18+Math.random()*.42,Math.sin(angle)*dist));
    p.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);
    trackVfx(p,320);
    animate(p,target,270).then(()=>{if(!p.isDisposed?.())p.dispose();});
  }
}
function iceImpactAt(position,remainingLayers){
  const iceColor=new BABYLON.Color3(.48,.86,1);
  shockwaveAt(position,"ice");
  const shardMat=getVfxMaterial("ice_shards",iceColor,.92);
  const count=remainingLayers>0?5:9;
  for(let i=0;i<count;i++){
    if(activeVfxMeshes.size>=VFX_MESH_LIMIT)break;
    const shard=BABYLON.MeshBuilder.CreatePolyhedron("iceShard",{type:1,size:.045+Math.random()*.045},scene);
    shard.position=position.clone();shard.position.y+=.23;shard.material=shardMat;shard.isPickable=false;
    shard.rotation.set(Math.random()*2,Math.random()*2,Math.random()*2);
    const angle=Math.PI*2*i/count+(Math.random()-.5)*.22,dist=.28+Math.random()*.26;
    const target=position.add(new BABYLON.Vector3(Math.cos(angle)*dist,.12+Math.random()*.32,Math.sin(angle)*dist));
    trackVfx(shard,remainingLayers>0?260:390);
    animate(shard,target,remainingLayers>0?210:310).then(()=>{if(!shard.isDisposed?.())shard.dispose();});
  }
  // Brief cold flash communicates the layer damage even on small phone screens.
  const flash=BABYLON.MeshBuilder.CreateDisc("iceImpactFlash",{radius:.38,tessellation:24},scene);
  flash.position=position.clone();flash.position.y+=.42;flash.rotation.x=Math.PI/2;
  const flashMat=new BABYLON.StandardMaterial("iceImpactFlashMaterial",scene);
  flashMat.diffuseColor=new BABYLON.Color3(.72,.94,1);flashMat.emissiveColor=new BABYLON.Color3(.72,.94,1);flashMat.alpha=.5;flash.material=flashMat;flash.isPickable=false;
  const started=performance.now(),observer=scene.onBeforeRenderObservable.add(()=>{
    if(flash.isDisposed?.()){scene.onBeforeRenderObservable.remove(observer);return;}
    const t=Math.min(1,(performance.now()-started)/190);flash.scaling.setAll(1+t*.7);flash.material.alpha=.5*(1-t);
    if(t>=1){scene.onBeforeRenderObservable.remove(observer);flashMat.dispose();}
  });
  trackVfx(flash,220);
}
function updateHud(){
  applyHeartRegen();
  $("score").textContent=state.score.toLocaleString("en-US");
  $("moves").textContent=state.moves;
  $("heartCount").textContent=state.lives;
  const objective=$("obstacleObjective");
  if(objective){
    objective.textContent="اكسر العوائق  "+Math.min(state.obstaclesCleared,state.obstacleGoal)+"/"+state.obstacleGoal;
    objective.classList.toggle("objective-complete",state.obstaclesCleared>=state.obstacleGoal);
    objective.setAttribute("aria-label","هدف المرحلة: تكسير "+Math.min(state.obstaclesCleared,state.obstacleGoal)+" من "+state.obstacleGoal+" عائق");
  }
  $("levelLabel").textContent="المستوى "+state.level;
  $("targetScore").textContent=state.target.toLocaleString("en-US");
  const iceGoal=$("iceGoal");
  if(iceGoal){iceGoal.hidden=state.iceRemaining<=0;iceGoal.textContent="❄️ "+state.iceRemaining;}
  $("levelProgress").style.width=Math.min(100,state.score/state.target*100)+"%";
  $("coinCount").textContent=state.coins;
  $("stars").textContent=state.stars;
  state.iceRemaining=countObstacles();
  const ig=$("iceGoal");
  if(ig){ig.hidden=state.iceRemaining<=0;ig.textContent="❄️ "+state.iceRemaining;}
  const scorePanel=document.querySelector(".art-score");
  if(scorePanel){
    let goal= $("scoreGoal");
    if(!goal){goal=document.createElement("small");goal.id="scoreGoal";scorePanel.insertBefore(goal,ig||null);}
    goal.textContent=" / "+state.target.toLocaleString("en-US");
    let track=$("scoreProgressTrack");
    if(!track){track=document.createElement("span");track.id="scoreProgressTrack";track.innerHTML='<i id="scoreProgressFill"></i>';scorePanel.appendChild(track);}
    const fill=$("scoreProgressFill");
    if(fill)fill.style.width=Math.min(100,state.score/state.target*100)+"%";
  }
  const db=$("difficultyBadge");
  if(db){const cfg=getLevelConfig(state.level);db.textContent="المرحلة "+state.level+" • "+cfg.diffLabel;db.hidden=!cfg.diffLabel;}
}
function triggerCharacterResult(won){
  for(const id of ["queen","dragon"]){
    const el=$(id);if(!el)continue;
    el.classList.remove("combo-1","combo-2","combo-3","celebrate","defeat");
    void el.offsetWidth;
    el.classList.add(won?"celebrate":"defeat");
  }
}
// FIX: claimLevelReward is not defined in this file. If world-map.js doesn't expose it
// (or it throws), checkEnd used to crash AFTER state.won=true, so input was blocked
// and the win window never appeared => the game looked frozen. This wrapper never throws.
function safeClaimLevelReward(level){
  try{
    if(typeof claimLevelReward==="function")return !!claimLevelReward(level);
    if(typeof window.claimLevelReward==="function")return !!window.claimLevelReward(level);
  }catch(e){console.error("claimLevelReward failed:",e);}
  try{
    const key="cmr_claimed_levels_v1";
    const list=JSON.parse(localStorage.getItem(key)||"[]");
    if(list.includes(level))return false;
    list.push(level);localStorage.setItem(key,JSON.stringify(list));
    return true;
  }catch(e){return true;}
}
function checkEnd(){
  state.iceRemaining=countObstacles();if(state.score>=state.target&&state.obstaclesCleared>=state.obstacleGoal&&!state.won){
    state.lossHandled=false;state.won=true;const earnedStars=state.score>=state.target*2?3:(state.score>=state.target*1.5?2:1);const rewardGranted=safeClaimLevelReward(state.level);if(rewardGranted){state.stars+=earnedStars;state.coins+=80;}updateHud();const rewardBag=$("rewardBag");if(rewardBag){rewardBag.hidden=!rewardGranted;rewardBag.src="./"+["14_bag_gold.png","15_bag_rainbow.png","16_bag_diamond_blue.png","17_bag_flower_purple.png","18_bag_crown_green.png","19_bag_lollipop_red.png","20_bag_lightning_purple.png"][(state.level-1)%7];}const starDisplay=$("resultModal").querySelector(".result-stars");if(starDisplay)starDisplay.textContent="⭐".repeat(earnedStars)+"☆".repeat(3-earnedStars);
    $("resultTitle").textContent=rewardGranted?"انتصار سحري!":"أحسنت!";
    $("resultModal").classList.remove("hidden");$("nextBtn").disabled=false;
    if(state.replayMode){$("nextBtn").textContent="العودة للخريطة";$("resultButton").textContent="العودة للخريطة";}
    else{$("nextBtn").textContent="المرحلة التالية";$("resultButton").textContent="استمرار";}
    $("characterMessage").textContent="يا له من إنجاز رائع!";$("resultText").textContent=rewardGranted?"أنقذت حدائق السكر وجمعت "+state.score+" نقطة، وحصلت على "+earnedStars+" نجوم ومكافأة 80 عملة.":"أنقذت حدائق السكر وجمعت "+state.score+" نقطة. مكافأة المستوى والنجوم اتصرفت قبل كده.";
    triggerCharacterResult(true);playSfx("win");saveProgress(true);
  }else if(state.moves<=0&&!state.won){
    state.won=true;
    if(!state.lossHandled){state.lives=Math.max(0,state.lives-1);state.lossHandled=true;if(state.lives<5&&!state.lastHeartAt)state.lastHeartAt=Date.now();}
    updateHud();
    $("resultTitle").textContent=state.lives>0?"حاول مرة أخرى":"انتهت القلوب!";
    $("resultText").textContent=state.lives>0?"خسرت محاولة واحدة. فاضلك "+state.lives+" قلوب.":"خلصت القلوب المتاحة. هيرجع قلب كل 30 دقيقة.";
    $("resultModal").classList.remove("hidden");$("resultButton").textContent="إعادة المحاولة";
    $("characterMessage").textContent="متستسلمش، جرب تاني!";
    triggerCharacterResult(false);playSfx("lose");
    saveProgress(false);
  }
}
function ensureGuestIdentity(){
  try{
    let identity=JSON.parse(localStorage.getItem(PLAYER_KEY)||"null");
    if(!identity||!identity.id){
      const id=window.crypto&&crypto.randomUUID?crypto.randomUUID():"guest-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);
      identity={id,provider:"guest",createdAt:new Date().toISOString()};
      localStorage.setItem(PLAYER_KEY,JSON.stringify(identity));
    }
    return identity;
  }catch(e){return {id:"guest-session",provider:"guest"};}
}
function saveProgress(completed=false){if(state.replayMode)return;try{
  const identity=ensureGuestIdentity();
  const gridReady=Array.isArray(state.grid)&&state.grid.length===ROWS&&state.grid.every(row=>Array.isArray(row)&&row.length===COLS&&row.every(Boolean));
  const grid=gridReady?state.grid.map(row=>row.map(item=>({type:item.type,special:item.special||null,ice:item.ice||0,obs:item.obs||null}))):null;
  localStorage.setItem(SAVE_KEY,JSON.stringify({iceDurabilityVersion:2,playerId:identity.id,provider:identity.provider,level:state.level,target:state.target,moves:state.moves,score:state.score,coins:state.coins,stars:state.stars,obstacleGoal:state.obstacleGoal,obstaclesCleared:state.obstaclesCleared,hammer:state.hammer,rockets:state.rockets,colors:state.colors,paints:state.paints,extra:state.extra,lives:state.lives,grid,completed,lossHandled:state.lossHandled,lastHeartAt:state.lastHeartAt,iceRemaining:state.iceRemaining}));
}catch(e){}}
function loadProgress(){try{
  const x=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");
  const completed=!!x.completed;
  const rawLevel=Number(x.level),savedLevel=Number.isFinite(rawLevel)?Math.min(1000000,Math.max(1,Math.floor(rawLevel)||1)):1;
  state.level=savedLevel+(completed?1:0);state.resumeLevel=state.level;state.replayMode=false;
  const rawTarget=Number(x.target),fallbackTarget=Math.round(1500*Math.pow(1.22,Math.min(savedLevel-1,1000)));
   const savedTarget=Number.isFinite(rawTarget)?Math.min(1e12,Math.max(1500,rawTarget)):(Number.isFinite(fallbackTarget)?fallbackTarget:1e12);
  state.target=completed?Math.round(savedTarget*1.22):savedTarget;
  const defaultMoves=Math.max(18,25-Math.floor(state.level/4));
  state.moves=completed?defaultMoves:(x.moves!==undefined&&Number.isFinite(Number(x.moves))?Math.max(0,Math.floor(Number(x.moves))):defaultMoves);
  state.score=completed?0:Math.max(0,Math.floor(Number(x.score)||0));
  state.lossHandled=!!x.lossHandled||Number(x.moves)===0;
  state.coins=Number.isFinite(Number(x.coins))?Math.min(999999999,Math.max(0,Math.floor(Number(x.coins)))):500;
  state.stars=Number.isFinite(Number(x.stars))?Math.min(999999999,Math.max(0,Math.floor(Number(x.stars)))):0;state.obstacleGoal=Math.max(0,Math.floor(Number(x.obstacleGoal)||0));state.obstaclesCleared=Math.max(0,Math.floor(Number(x.obstaclesCleared)||0));
  state.lives=x.lives===undefined?5:Math.min(5,Math.max(0,Math.floor(Number(x.lives)||0)));
  const savedHeartTime=Number(x.lastHeartAt);state.lastHeartAt=Number.isFinite(savedHeartTime)&&savedHeartTime>0?Math.min(Date.now(),savedHeartTime):Date.now();applyHeartRegen();
  const hammerValue=Number(x.hammer),extraValue=Number(x.extra);
  state.hammer=completed?3:(Number.isFinite(hammerValue)?Math.min(9,Math.max(0,Math.floor(hammerValue))):3);
  state.rockets=completed?3:(Number.isFinite(Number(x.rockets))?Math.min(9,Math.max(0,Math.floor(Number(x.rockets)))):3);
  state.colors=completed?3:(Number.isFinite(Number(x.colors))?Math.min(9,Math.max(0,Math.floor(Number(x.colors)))):3);
  state.paints=completed?3:(Number.isFinite(Number(x.paints))?Math.min(9,Math.max(0,Math.floor(Number(x.paints)))):3);
  state.extra=completed?2:(Number.isFinite(extraValue)?Math.min(10,Math.max(0,Math.floor(extraValue))):2);
  const validGrid=Array.isArray(x.grid)&&x.grid.length===ROWS&&x.grid.every(row=>Array.isArray(row)&&row.length===COLS&&row.every(cell=>cell&&Number.isInteger(cell.type)&&cell.type>=1&&cell.type<=TYPES&&(cell.special===null||cell.special==="color"||cell.special==="striped"||cell.special==="wrapped")));
  state.savedGrid=!completed&&validGrid?x.grid.map(row=>row.map(cell=>({type:cell.type,special:cell.special||null,ice:Math.max(0,Math.min(2,Number(cell.ice)||0))*(Number(x.iceDurabilityVersion)>=2?1:2),obs:cell.obs||null}))):null;
}catch(e){state.level=1;state.target=1500;state.moves=25;state.score=0;state.coins=500;state.stars=0;state.lives=5;state.lastHeartAt=Date.now();state.hammer=3;state.rockets=3;state.colors=3;state.paints=3;state.extra=2;state.savedGrid=null;}}
function restart(){applyHeartRegen();if(state.busy)return;if(state.lives<=0){say("مفيش قلوب متاحة. استنى استعادة قلب جديد.");return;}state.lossHandled=false;state.score=0;state.moves=getLevelConfig(state.level).moves;state.obstacleGoal=0;state.obstaclesCleared=0;state.won=false;state.booster=null;
  $("resultButton").textContent="استمرار";$("queen").classList.remove("celebrate");$("dragon").classList.remove("celebrate","defeat");clearSelection();$("resultModal").classList.add("hidden");$("nextBtn").disabled=true;buildGrid();updateHud();saveProgress(false);$("characterMessage").textContent="بدّل الحلوى واجمع 3 أو أكثر!";}
async function useHammer(cell){
  if(state.won||state.busy)return;
  const it=state.grid[cell.r][cell.c];if(!it)return;
  state.busy=true;clearSelection();
  try{
    if(it.ice>0){damageIceAt(cell.r,cell.c,40);state.moves=Math.max(0,state.moves-1);state.hammer=Math.max(0,state.hammer-1);refreshBoosterBadges();updateHud();await settle();return;}
    burstAt(it.mesh.position,it.type);it.mesh.dispose();state.grid[cell.r][cell.c]=null;
    state.score+=100;state.moves=Math.max(0,state.moves-1);state.hammer=Math.max(0,state.hammer-1);
    refreshBoosterBadges();
    state.booster=null;const hammerButton=$("hammerBtn")||$("bombBtn");if(hammerButton)hammerButton.classList.remove("active");
    const replacement={type:rand(),special:null,mesh:null};
    replacement.mesh=candyMesh(cell.r,cell.c,replacement.type,null);
    replacement.mesh.position.y=5.5;state.grid[cell.r][cell.c]=replacement;
    await animate(replacement.mesh,pos(cell.r,cell.c),220);await settle();
  }catch(error){console.error("Hammer action failed:",error);say("حصلت مشكلة في المطرقة، جرّب تاني.");}
  finally{state.busy=false;updateHud();checkEnd();if(!state.won&&state.moves>0&&!hasPossibleMove())shuffle();saveProgress(state.won&&state.score>=state.target);}
}
function hasPossibleMove(){
  // Specials are valid only when a player can legally swap them with an adjacent,
  // unlocked candy. A frozen/isolated special must not keep a dead board alive.
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    for(const [dr,dc] of [[0,1],[1,0]]){
      const nr=r+dr,nc=c+dc;if(!inBounds(nr,nc))continue;
      const a=state.grid[r][c],b=state.grid[nr][nc];
      if(!a||!b||isCellLocked(a)||isCellLocked(b))continue;
      // Swapping a special activates it by design, even without a 3+ match.
      if(a.special||b.special)return true;
      state.grid[r][c]=b;state.grid[nr][nc]=a;
      const valid=findMatches().size>0;
      state.grid[r][c]=a;state.grid[nr][nc]=b;
      if(valid)return true;
    }
  }
  return false;
}
function shuffle(){
  if(state.busy||state.won||state.grid.flat().some(it=>!it))return;
  clearSelection();
  const items=state.grid.flat(),original=items.map(it=>it.type);
  let playable=false;
  // A small bounded search prevents a dead-board recovery from freezing mobile devices.
  for(let attempt=0;attempt<36&&!playable;attempt++){
    const values=original.slice();
    for(let i=values.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
    for(let i=0;i<items.length;i++)items[i].type=values[i];
    playable=findMatches().size===0&&hasPossibleMove();
  }
  // Build a fresh match-free board if random permutations did not yield a legal move quickly.
  if(!playable){
    for(let attempt=0;attempt<12&&!playable;attempt++){
      const fresh=Array.from({length:ROWS},()=>Array(COLS).fill(0));
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
        let type=rand(),tries=0;
        while(tries++<24&&((c>1&&fresh[r][c-1]===type&&fresh[r][c-2]===type)||(r>1&&fresh[r-1][c]===type&&fresh[r-2][c]===type)))type=rand();
        fresh[r][c]=type;
      }
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)state.grid[r][c].type=fresh[r][c];
      playable=findMatches().size===0&&hasPossibleMove();
    }
  }
  // Deterministically create a legal match if random shuffles and fresh boards fail.
  // Search all four orientations of the classic A-B-A plus adjacent-A swap pattern.
  if(!playable){
    const base=items.map(item=>item.type),patterns=[];
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS-2;c++){
      const line=[[r,c],[r,c+1],[r,c+2]],middle=line[1];
      if(r<ROWS-1)patterns.push({line,middle,neighbor:[r+1,c+1]});
      if(r>0)patterns.push({line,middle,neighbor:[r-1,c+1]});
    }
    for(let c=0;c<COLS;c++)for(let r=0;r<ROWS-2;r++){
      const line=[[r,c],[r+1,c],[r+2,c]],middle=line[1];
      if(c<COLS-1)patterns.push({line,middle,neighbor:[r+1,c+1]});
      if(c>0)patterns.push({line,middle,neighbor:[r+1,c-1]});
    }
    let forced=null;
    outer:for(const pattern of patterns){
      const cells=[...pattern.line,pattern.neighbor];
      if(cells.some(([r,c])=>isCellLocked(state.grid[r][c])))continue;
      const [r1,c1]=pattern.line[0],[rm,cm]=pattern.middle,[r3,c3]=pattern.line[2],[rn,cn]=pattern.neighbor;
      for(let a=1;a<=TYPES;a++)for(let b=1;b<=TYPES;b++){
        if(a===b)continue;
        for(let i=0;i<items.length;i++)items[i].type=base[i];
        state.grid[r1][c1].type=a;state.grid[rm][cm].type=b;state.grid[r3][c3].type=a;state.grid[rn][cn].type=a;
        if(findMatches().size!==0)continue;
        state.grid[rm][cm].type=a;state.grid[rn][cn].type=b;
        const legal=findMatches().size>0;
        state.grid[rm][cm].type=b;state.grid[rn][cn].type=a;
        if(legal){forced={r1,c1,rm,cm,r3,c3,rn,cn,a,b};break outer;}
      }
    }
    for(let i=0;i<items.length;i++)items[i].type=base[i];
    if(forced){
      const {r1,c1,rm,cm,r3,c3,rn,cn,a,b}=forced;
      state.grid[r1][c1].type=a;state.grid[rm][cm].type=b;state.grid[r3][c3].type=a;state.grid[rn][cn].type=a;
      playable=findMatches().size===0&&hasPossibleMove();
    }
  }
  if(!playable){
    for(let i=0;i<items.length;i++)items[i].type=original[i];
    say("تعذر إعادة ترتيب اللوحة بحركة متاحة. جرّب تاني.");
    return;
  }
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const it=state.grid[r][c];
    if(it.mesh&&!it.mesh.isDisposed?.())it.mesh.dispose();
    it.mesh=candyMesh(r,c,it.type,it.special,it.ice||0);
  }
  say("اتخلطت الحلوى! تقدر تكمل اللعب.");
  saveProgress(false);
}
function nextLevel(){
  if(!state.won||state.score<state.target)return;
  if(state.replayMode){
    state.level=state.resumeLevel;state.replayMode=false;state.won=false;state.busy=false;
    $("resultModal").classList.add("hidden");$("nextBtn").disabled=true;
    $("nextBtn").textContent="المرحلة التالية";$("resultButton").textContent="استمرار";
    for(const row of state.grid)for(const item of row)if(item?.mesh&&!item.mesh.isDisposed?.())item.mesh.dispose();
    state.grid=[];state.savedGrid=null;updateHud();window.CMRShowWorldMap?.();return;
  }
  state.lossHandled=false;state.level++;state.target=Math.round(state.target*1.22);state.moves=Math.max(18,25-Math.floor(state.level/4));state.score=0;state.won=false;state.hammer=3;state.rockets=3;state.colors=3;state.paints=3;state.extra=2;
  const hammerButton=$("hammerBtn")||$("bombBtn");
  if(hammerButton){const count=hammerButton.querySelector("small");if(count)count.textContent=state.hammer;hammerButton.disabled=false;}
  refreshBoosterBadges();
  const movesButton=$("movesBtn");
  if(movesButton){const count=movesButton.querySelector("small");if(count)count.textContent=state.extra;movesButton.disabled=false;}
  $("resultButton").textContent="استمرار";$("queen").classList.remove("celebrate");
  $("resultModal").classList.add("hidden");$("nextBtn").disabled=true;
  for(const row of state.grid)for(const item of row)if(item?.mesh)item.mesh.dispose();
  state.grid=[];state.savedGrid=null;state.selected=null;updateHud();saveProgress(false);$("characterMessage").textContent="مستوى جديد وتحدٍ أكبر!";
  window.CMRShowWorldMap?.();
}

function refreshBoosterBadges(){
  const set=(id,value)=>{const el=$(id);if(!el)return;const count=el.querySelector("small");if(count)count.textContent=value;el.disabled=value<=0;};
  set("bombBtn",state.hammer);set("rocketBtn",state.rockets);set("colorBtn",state.colors);set("paintBtn",state.paints);
  const moves=$("movesBtn");if(moves){const count=moves.querySelector("small");if(count)count.textContent=state.extra;moves.disabled=state.extra<=0;}
}
function ensureShop(){
  if($("royalShop"))return;
  const coinsButton=$("plusCoins");
  if(!coinsButton)return;
  const trigger=document.createElement("button");
  trigger.id="shopOpenBtn";trigger.type="button";trigger.className="shop-open-btn";
  trigger.setAttribute("aria-label","المتجر");trigger.textContent="🛍️";
  coinsButton.insertAdjacentElement("afterend",trigger);
  const modal=document.createElement("div");modal.id="royalShop";modal.className="royal-shop hidden";
  modal.innerHTML='<div class="royal-shop-card" role="dialog" aria-modal="true" aria-labelledby="shopTitle"><button type="button" class="shop-close" aria-label="إغلاق">×</button><div class="shop-crown">♛</div><h2 id="shopTitle">المتجر الملكي</h2><p class="shop-wallet">رصيدك: <b id="shopCoins">0</b> ✦</p><div class="shop-items"><article class="shop-item"><span class="shop-item-icon">💣</span><div><b>قنابل إضافية</b><small>+3 قنابل · بحد أقصى 9</small></div><button type="button" data-buy="hammer">150 ✦</button></article><article class="shop-item"><span class="shop-item-icon">💣</span><div><b>حركات إضافية</b><small>+2 استخدام · بحد أقصى 10</small></div><button type="button" data-buy="moves">120 ✦</button></article><article class="shop-item"><span class="shop-item-icon">❤️</span><div><b>قلب إضافي</b><small>+1 قلب · بحد أقصى 5</small></div><button type="button" data-buy="heart">180 ✦</button></article></div><p class="shop-note">المشتريات بالعملات داخل اللعبة فقط، بدون دفع حقيقي.</p></div>';
  document.body.appendChild(modal);
  const close=()=>modal.classList.add("hidden");
  trigger.addEventListener("click",()=>{refreshShop();modal.classList.remove("hidden");});
  const closeButton=modal.querySelector(".shop-close");
  if(closeButton)closeButton.addEventListener("click",close);
  modal.addEventListener("click",e=>{if(e.target===modal)close();});
  modal.querySelectorAll("[data-buy]").forEach(btn=>btn.addEventListener("click",()=>{
    const kind=btn.dataset.buy;
    const offer={hammer:{cost:150,limit:9,amount:3},moves:{cost:120,limit:10,amount:2},heart:{cost:180,limit:5,amount:1}}[kind];
    const current=kind==="hammer"?state.hammer:kind==="moves"?state.extra:state.lives;
    if(current>=offer.limit){say(kind==="heart"?"قلوبك كاملة بالفعل!":"وصلت للحد الأقصى من المعززات.");return;}
    if(state.coins<offer.cost){say("عملاتك مش كفاية للشراء ده.");return;}
    state.coins-=offer.cost;
    if(kind==="hammer")state.hammer=Math.min(offer.limit,state.hammer+offer.amount);
    if(kind==="moves")state.extra=Math.min(offer.limit,state.extra+offer.amount);
    if(kind==="heart"){state.lives=Math.min(5,state.lives+1);if(state.lives===5)state.lastHeartAt=Date.now();}
    updateHud();refreshBoosterBadges();saveProgress(false);playSfx("coin");refreshShop();
    say("تم الشراء بنجاح!");
  }));
}
function refreshShop(){const wallet=$("shopCoins");if(wallet)wallet.textContent=state.coins.toLocaleString("en-US");}

function bindUI(){
  ensureShop();
  const bind=(id,handler)=>{const el=$(id);if(el)el.addEventListener("click",handler);};
  bind("restartBtn",restart);
  bind("nextBtn",nextLevel);
  bind("resultButton",()=>{if(state.moves<=0&&state.score<state.target)restart();else nextLevel();});
  const toggleBooster=(id,kind,count)=>bind(id,()=>{
    if(state.won||count()<=0)return;
    state.booster=state.booster===kind?null:kind;
    const mapping={paintBtn:"paint",bombBtn:"bomb",colorBtn:"color",rocketBtn:"rocket"};
    for(const key of Object.keys(mapping)){const el=$(key);if(el)el.classList.toggle("active",state.booster===mapping[key]);}
    const labels={bomb:"اختار حلوى لتحديد مركز انفجار 3×3",rocket:"اختار حلوى لمسح الصف والعمود",color:"اختار لون الحلوى اللي كرة الألوان هتمسحه",paint:"اختار حلوى وغيّر لونها للون حلوى مجاورة"};
    say(state.booster?labels[kind]:"تم إلغاء المساعد");
  });
  toggleBooster("bombBtn","bomb",()=>state.hammer);toggleBooster("rocketBtn","rocket",()=>state.rockets);
  toggleBooster("colorBtn","color",()=>state.colors);toggleBooster("paintBtn","paint",()=>state.paints);
  bind("shuffleBtn",shuffle);
  bind("movesBtn",()=>{if(state.won||state.extra<=0)return;state.extra--;state.moves+=5;refreshBoosterBadges();updateHud();saveProgress(false);say("+5 حركات إضافية!");});
  bind("plusCoins",()=>{
    const today=new Date().toISOString().slice(0,10),key="cmr_daily_reward_v1";
    let claimed="";try{claimed=localStorage.getItem(key)||"";}catch(e){}
    if(claimed===today){say("استلمت مكافأة النهارده بالفعل. ارجع بكرة!");return;}
    state.coins+=100;try{localStorage.setItem(key,today);}catch(e){}
    updateHud();saveProgress(false);playSfx("coin");say("مكافأة يومية: +100 عملة ذهبية!");
  });
  bind("soundBtn",()=>{
    soundEnabled=!soundEnabled;const soundButton=$("soundBtn");soundButton.textContent=soundEnabled?"♫":"🔇";
    if(soundEnabled)playSfx("tap");say(soundEnabled?"الصوت اتفتح":"الصوت اتقفل");
  });
}
// FIX: if state.busy stays true for more than 8 seconds (stuck animation or
// unexpected error), release the lock and re-settle the board.
let busyWatchdogTimer=null;
function startBusyWatchdog(){
  if(busyWatchdogTimer)return;
  let since=0;
  busyWatchdogTimer=setInterval(()=>{
    if(!state.busy){since=0;return;}
    if(!since){since=Date.now();return;}
    // Long cascades can legitimately take several seconds on slower phones.
    // Resolve stalled animation promises, but never launch a second settle()
    // while the original swap/settle chain is still running.
    if(Date.now()-since<15000)return;
    since=Date.now();
    console.warn("Animation watchdog: releasing pending animation jobs");
    for(const job of Array.from(activeAnimations))job.resolve();
    activeAnimations.clear();
    if(animationFrame){cancelAnimationFrame(animationFrame);animationFrame=0;}
  },1000);
}
function setBoardBackground(level){
  const current=Math.max(1,Math.floor(Number(level)||1));
  const realm=Math.floor((current-1)/50)%4+1;
  const house=((current-1)%50)+1;
  const art=$("royalArtboard");
  if(art){
    art.src="./assets/board-bg-0"+(((realm-1)%3)+1)+".svg";
    art.dataset.background=String(realm);
    art.dataset.house=String(house);
    art.style.filter="hue-rotate("+(((house-1)*29)%360)+"deg) saturate("+(1.04+((house%5)*.035)).toFixed(2)+")";
  }
  const x=12+((house*17)%77),y=12+((house*23)%76),zoom=106+((house*7)%19);
  document.documentElement.style.setProperty("--cmr-realm-render",`url("./assets/world-render-0${realm}.svg")`);
  document.documentElement.style.setProperty("--cmr-realm-position",`${x}% ${y}%`);
  document.documentElement.style.setProperty("--cmr-realm-zoom",`${zoom}% auto`);
  document.documentElement.style.setProperty("--cmr-house-hue",((house-1)*29)%360+"deg");
  document.documentElement.style.setProperty("--cmr-house-light",(.96+((house%7)*.012)).toFixed(2));
  document.body.dataset.realm=String(realm);
  document.body.dataset.house=String(house);
}
async function start(){
  loadProgress();
  const loading=$("loading");
  if(loading){loading.style.display="grid";loading.textContent="جاري تجهيز الحلوى الملكية...";}
  setupScene();
  // Do not create placeholder 3D candies. Wait until the six supplied PNG
  // textures are ready, then reveal the board with the correct artwork only.
  await preloadCandyTextures();
  buildGrid();bindUI();updateHud();startHeartClock();startBusyWatchdog();
  if(loading)loading.style.display="none";
  refreshBoosterBadges();
  $("characterMessage").textContent="أهلاً بك! أنقذ مملكتي بالحلوى.";
  checkEnd();
  saveProgress(state.won&&state.score>=state.target);
}
let gameInitialized=false;
window.CMRStartSelectedHouse=async(selectedLevel)=>{
  // Reveal gameplay first; the hidden game shell was preventing the user from
  // seeing the board whenever Babylon initialization failed.
  document.body.classList.add("game-started");
  window.CMRHideWorldMap?.();
  try{
    if(!gameInitialized){
      await start();
      gameInitialized=true;
    }
    const requested=Number.isFinite(Number(selectedLevel))?Math.max(1,Math.floor(Number(selectedLevel))):state.level;
    state.resumeLevel=Math.max(state.resumeLevel||1,state.level);
    state.replayMode=requested<state.resumeLevel;
    state.level=requested;
    setBoardBackground(requested);
    state.target=Math.round(1500*Math.pow(1.22,Math.min(requested-1,1000)));
    state.moves=Math.max(18,25-Math.floor(requested/4));
    state.score=0;state.won=false;state.busy=false;state.lossHandled=false;
    state.booster=null;state.savedGrid=null;
    $("resultModal").classList.add("hidden");$("nextBtn").disabled=true;
    $("nextBtn").textContent=state.replayMode?"العودة للخريطة":"المرحلة التالية";
    $("resultButton").textContent="استمرار";
    buildGrid();updateHud();refreshBoosterBadges();saveProgress(false);
    return true;
  }catch(error){
    console.error("House game initialization failed:",error);
    const detail=(error?.name?error.name+": ":"")+(error?.message||String(error)||"خطأ غير معروف");
    const loading=document.getElementById("loading");
    if(loading){
      loading.style.display="grid";
      loading.style.zIndex="5";
      loading.style.padding="18px";
      loading.style.textAlign="center";
      loading.style.whiteSpace="normal";
      loading.textContent="تعذر تجهيز اللوحة\n"+detail;
    }
    const diagnostic=document.getElementById("toast");
    if(diagnostic){diagnostic.textContent="تعذر تشغيل اللعبة: "+detail;diagnostic.classList.add("show");}
    return false;
  }
};
window.addEventListener("DOMContentLoaded",()=>{
  const launch=$("startGameBtn"),screen=$("startScreen"),facebookModal=$("facebookModal");
  let launching=false;
  const launchAsGuest=()=>{
    if(launching||!launch||!screen)return;
    launching=true;
    ensureGuestIdentity();
    launch.disabled=true;launch.textContent="جاري فتح المملكة...";
    screen.classList.add("start-screen-leaving");
    setTimeout(()=>{
      screen.remove();
      window.CMRShowWorldMap?.();
      if(!document.getElementById("worldMap")){
        launching=false;launch.disabled=false;launch.textContent="العب كضيف";
        say("الخريطة مش جاهزة، حدّث الصفحة وحاول تاني.");
      }
    },520);
  };
  // Every optional screen control is bound defensively; a missing modal button
  // must never abort the game bootstrap.
  const bindOptional=(id,handler)=>{
    const element=$(id);
    if(element)element.addEventListener("click",handler);
  };
  bindOptional("facebookLoginBtn",()=>{
    if(facebookModal)facebookModal.classList.remove("hidden");
  });
  bindOptional("facebookCloseBtn",()=>{
    if(facebookModal)facebookModal.classList.add("hidden");
  });
  bindOptional("facebookGuestBtn",()=>{
    if(facebookModal)facebookModal.classList.add("hidden");
    launchAsGuest();
  });
});
})();
