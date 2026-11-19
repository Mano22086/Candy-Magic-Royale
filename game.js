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
const state={grid:[],savedGrid:null,score:0,target:1500,moves:25,level:1,resumeLevel:1,replayMode:false,coins:500,stars:0,lives:5,lastHeartAt:0,selected:null,busy:false,won:false,lossHandled:false,booster:null,hammer:3,rockets:3,colors:3,paints:3,extra:2,iceRemaining:0};

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
const iceStageMaterials={};
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
    img.onload=()=>{
      try{
        const w=img.naturalWidth,h=img.naturalHeight;
        const cv=document.createElement("canvas");cv.width=w;cv.height=h;
        const ctx=cv.getContext("2d");ctx.drawImage(img,0,0);
        const d=ctx.getImageData(0,0,w,h).data;
        let x0=w,y0=h,x1=-1,y1=-1;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){
          if(d[(y*w+x)*4+3]>40){
            if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
          }
        }
        if(x1>=x0&&y1>=y0){
          x1++;y1++;
          candyTrim[type]={u0:x0/w,u1:x1/w,v0:1-y1/h,v1:1-y0/h,ratio:(x1-x0)/(y1-y0)};
        }
      }catch(e){console.warn("Candy trim failed",type,e);}
      resolve();
    };
    img.onerror=()=>resolve();
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
  if(ice>0){
    const stage=ice>=2?0:1;
    const path=stage===0?"./ice_cube_realistic_4k.png":"./ice_cube_stylized_4k.png";
    const key=String(stage);
    if(!iceStageMaterials[key]){
      const mat=new BABYLON.StandardMaterial("iceStageMaterial_"+key,scene);
      const texture=new BABYLON.Texture(path,scene,false,true,BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
        ()=>{texture.hasAlpha=true;mat.diffuseTexture=texture;mat.useAlphaFromDiffuseTexture=true;mat.transparencyMode=BABYLON.Material.MATERIAL_ALPHABLEND;mat.specularColor=new BABYLON.Color3(.88,.97,1);mat.specularPower=128;},
        (message,error)=>console.warn("Ice artwork unavailable:",path,message,error));
      texture.hasAlpha=true;texture.wrapU=BABYLON.Texture.CLAMP_ADDRESSMODE;texture.wrapV=BABYLON.Texture.CLAMP_ADDRESSMODE;
      mat.diffuseTexture=texture;mat.useAlphaFromDiffuseTexture=true;mat.transparencyMode=BABYLON.Material.MATERIAL_ALPHABLEND;
      mat.specularColor=new BABYLON.Color3(.88,.97,1);mat.specularPower=128;mat.backFaceCulling=false;
      iceStageMaterials[key]=mat;iceStageTextures[key]=texture;
    }
    // A real 3D box gives the supplied 4K ice artwork depth from every viewing angle.
    const iceBox=BABYLON.MeshBuilder.CreateBox("iceCube3D_"+stage+"_"+r+"_"+c,{width:SPACING*.88,height:SPACING*.88,depth:SPACING*.88,segments:1},scene);
    iceBox.parent=root;iceBox.position.y=.39;iceBox.material=iceStageMaterials[key];iceBox.isPickable=false;iceBox.renderingGroupId=2;
    const texture=iceStageTextures[key];
    const revealIceWhenReady=()=>{if(root.isDisposed?.()||iceBox.isDisposed?.())return;if(texture&&texture.isReady()){iceBox.setEnabled(true);return;}if(texture)setTimeout(revealIceWhenReady,60);};
    iceBox.setEnabled(false);revealIceWhenReady();
  }
  root.__cmrSpriteBacked=!!artworkPath;
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
  let t=rand(),tries=0;
  while(tries<12&&((c>1&&state.grid[r][c-1]?.type===t&&state.grid[r][c-2]?.type===t)||(r>1&&state.grid[r-1][c]?.type===t&&state.grid[r-2][c]?.type===t))){t=rand();tries++;}
  return t;
}
function damageIceAt(r,c,score=25){
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
  const iceCells=new Set();
  if(!canRestore&&state.level>=1){const count=Math.min(12,3+Math.floor((state.level-1)/3));while(iceCells.size<count)iceCells.add(Math.floor(Math.random()*ROWS*COLS));}
  state.iceRemaining=0;
  state.grid=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const savedCell=canRestore?saved[r][c]:null;
    const type=savedCell?savedCell.type:randomType(r,c);
    const special=savedCell&&(savedCell.special==="color"||savedCell.special==="striped"||savedCell.special==="wrapped")?savedCell.special:null;
    const ice=savedCell?Math.max(0,Math.min(2,Number(savedCell.ice)||0)):(iceCells.has(r*COLS+c)?2:0);
    if(ice)state.iceRemaining++;
    state.grid[r][c]={type,special,ice,mesh:candyMesh(r,c,type,special,ice)};
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
  const A=state.grid[a.r][a.c],B=state.grid[b.r][b.c];if(!A||!B||A.ice>0||B.ice>0){clearSelection();return;}
  state.busy=true;clearSelection();
  try{
    await Promise.all([animate(A.mesh,pos(b.r,b.c),115),animate(B.mesh,pos(a.r,a.c),115)]);
    state.grid[a.r][a.c]=B;state.grid[b.r][b.c]=A;
    A.mesh.metadata={r:b.r,c:b.c,candy:true};B.mesh.metadata={r:a.r,c:a.c,candy:true};
    // A special candy activates only when deliberately swapped with an adjacent candy.
    // Ordinary swaps still require a confirmed 3+ match and revert when invalid.
    if(A.special||B.special){
      state.moves--;updateHud();
      await activateSpecial(a,b);
      await settle();
    }else if(findMatches().size===0){
      await Promise.all([animate(A.mesh,pos(a.r,a.c),115),animate(B.mesh,pos(b.r,b.c),115)]);
      state.grid[a.r][a.c]=A;state.grid[b.r][b.c]=B;
      A.mesh.metadata={r:a.r,c:a.c,candy:true};B.mesh.metadata={r:b.r,c:b.c,candy:true};
    }else{state.moves--;updateHud();await settle();}
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
async function activateSpecial(a,b){
  const A=state.grid[a.r][a.c],B=state.grid[b.r][b.c];
  if(A?.special||B?.special){const kind=A?.special||B?.special;playSfx(kind==="wrapped"?"bomb":kind==="striped"?"rocket":"color");shockwaveAt((A?.special?A:B).mesh.position,kind);}
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
        playSfx("bomb");shockwaveAt(item.mesh.position,"wrapped");
      }else if(item.special==="striped"){
        for(let x=0;x<COLS;x++)matches.add(r+","+x);
        for(let y=0;y<ROWS;y++)matches.add(y+","+c);
        playSfx("rocket");shockwaveAt(item.mesh.position,"striped");
      }else if(item.special==="color"){
        for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(state.grid[y][x]?.type===item.type)matches.add(y+","+x);
        playSfx("color");shockwaveAt(item.mesh.position,"color");
      }
    }
    const remove=Array.from(matches).map(s=>s.split(",").map(Number));
    // A confirmed 3+ match also cracks ice directly beside its matched candies.
    // Deduplicate cells so an ice block touched by two matched candies takes one hit only.
    const iceHitCells=new Set();
    for(const key of matches){
      const [mr,mc]=key.split(",").map(Number);
      const current=state.grid[mr]?.[mc];
      if(current?.ice>0)iceHitCells.add(mr+","+mc);
      for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
        const ir=mr+dr,ic=mc+dc;
        if(inBounds(ir,ic)&&state.grid[ir][ic]?.ice>0)iceHitCells.add(ir+","+ic);
      }
    }
    for(const key of iceHitCells){const [ir,ic]=key.split(",").map(Number);damageIceAt(ir,ic,25);}
    const specialCandidate=matchedSpecials.length===0&&chain===1?findSpecialCandidate(matches):null;
    const groupSpecial=specialCandidate?.type||null;
    const keep=specialCandidate?.cell||null;
    for(const p of remove){
      const r=p[0],c=p[1],it=state.grid[r][c];
      if(keep&&r===keep.r&&c===keep.c)continue;
      if(it?.ice>0){if(!iceHitCells.has(r+","+c))damageIceAt(r,c,25);continue;}
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
  updateHud();
}
function shockwaveAt(position,kind){
  const colors={wrapped:new BABYLON.Color3(1,.55,.12),striped:new BABYLON.Color3(.18,.82,1),color:new BABYLON.Color3(.85,.3,1),bomb:new BABYLON.Color3(1,.55,.12),rocket:new BABYLON.Color3(.18,.82,1)};
  const color=colors[kind]||new BABYLON.Color3(1,.8,.3);
  const ring=BABYLON.MeshBuilder.CreateTorus("specialShockwave",{diameter:1,thickness:.045,tessellation:32},scene);
  ring.position=position.clone();ring.position.y+=.55;ring.rotation.x=Math.PI/2;ring.scaling.setAll(.12);ring.isPickable=false;
  const material=new BABYLON.StandardMaterial("specialShockMaterial",scene);material.diffuseColor=color;material.emissiveColor=color;material.alpha=.9;ring.material=material;
  const started=performance.now(),duration=360;
  const observer=scene.onBeforeRenderObservable.add(()=>{
    if(ring.isDisposed?.()){scene.onBeforeRenderObservable.remove(observer);return;}
    const t=Math.min(1,(performance.now()-started)/duration);ring.scaling.setAll(.12+2.1*t);material.alpha=.9*(1-t);
    if(t>=1){scene.onBeforeRenderObservable.remove(observer);ring.dispose();material.dispose();}
  });
}
function burstAt(position,type){
  // Reuse one material per candy type and keep the particle count low on mobile.
  if(!burstSharedMaterials[type]){
    const color=palette[type-1].color;
    const material=new BABYLON.StandardMaterial("sugarParticleShared_"+type,scene);
    material.diffuseColor=color;material.emissiveColor=color;
    burstSharedMaterials[type]=material;
  }
  const material=burstSharedMaterials[type];
  for(let i=0;i<5;i++){
    const p=BABYLON.MeshBuilder.CreateSphere("sugarParticle",{diameter:.075,segments:4},scene);
    p.position=position.clone();p.material=material;p.isPickable=false;
    const angle=Math.PI*2*i/5,dist=.28+Math.random()*.18;
    const target=position.add(new BABYLON.Vector3(Math.cos(angle)*dist,.2+Math.random()*.25,Math.sin(angle)*dist));
    animate(p,target,190).then(()=>{if(!p.isDisposed?.())p.dispose();});
  }
}
function updateHud(){
  applyHeartRegen();$("score").textContent=state.score.toLocaleString("en-US");$("moves").textContent=state.moves;$("heartCount").textContent=state.lives;
  $("levelLabel").textContent="المستوى "+state.level;$("targetScore").textContent=state.target.toLocaleString("en-US");const iceGoal=$("iceGoal");if(iceGoal){iceGoal.hidden=state.iceRemaining<=0;iceGoal.textContent="❄️ "+state.iceRemaining;}
  $("levelProgress").style.width=Math.min(100,state.score/state.target*100)+"%";
  $("coinCount").textContent=state.coins;$("stars").textContent=state.stars;
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
  if(state.score>=state.target&&state.iceRemaining<=0&&!state.won){
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
  const grid=gridReady?state.grid.map(row=>row.map(item=>({type:item.type,special:item.special||null,ice:item.ice||0}))):null;
  localStorage.setItem(SAVE_KEY,JSON.stringify({iceDurabilityVersion:2,playerId:identity.id,provider:identity.provider,level:state.level,target:state.target,moves:state.moves,score:state.score,coins:state.coins,stars:state.stars,hammer:state.hammer,rockets:state.rockets,colors:state.colors,paints:state.paints,extra:state.extra,lives:state.lives,grid,completed,lossHandled:state.lossHandled,lastHeartAt:state.lastHeartAt,iceRemaining:state.iceRemaining}));
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
  state.stars=Number.isFinite(Number(x.stars))?Math.min(999999999,Math.max(0,Math.floor(Number(x.stars)))):0;
  state.lives=x.lives===undefined?5:Math.min(5,Math.max(0,Math.floor(Number(x.lives)||0)));
  const savedHeartTime=Number(x.lastHeartAt);state.lastHeartAt=Number.isFinite(savedHeartTime)&&savedHeartTime>0?Math.min(Date.now(),savedHeartTime):Date.now();applyHeartRegen();
  const hammerValue=Number(x.hammer),extraValue=Number(x.extra);
  state.hammer=completed?3:(Number.isFinite(hammerValue)?Math.min(9,Math.max(0,Math.floor(hammerValue))):3);
  state.rockets=completed?3:(Number.isFinite(Number(x.rockets))?Math.min(9,Math.max(0,Math.floor(Number(x.rockets)))):3);
  state.colors=completed?3:(Number.isFinite(Number(x.colors))?Math.min(9,Math.max(0,Math.floor(Number(x.colors)))):3);
  state.paints=completed?3:(Number.isFinite(Number(x.paints))?Math.min(9,Math.max(0,Math.floor(Number(x.paints)))):3);
  state.extra=completed?2:(Number.isFinite(extraValue)?Math.min(10,Math.max(0,Math.floor(extraValue))):2);
  const validGrid=Array.isArray(x.grid)&&x.grid.length===ROWS&&x.grid.every(row=>Array.isArray(row)&&row.length===COLS&&row.every(cell=>cell&&Number.isInteger(cell.type)&&cell.type>=1&&cell.type<=TYPES&&(cell.special===null||cell.special==="color"||cell.special==="striped"||cell.special==="wrapped")));
  state.savedGrid=!completed&&validGrid?x.grid.map(row=>row.map(cell=>({type:cell.type,special:cell.special||null,ice:Math.max(0,Math.min(2,Number(cell.ice)||0))*(Number(x.iceDurabilityVersion)>=2?1:2)}))):null;
}catch(e){state.level=1;state.target=1500;state.moves=25;state.score=0;state.coins=500;state.stars=0;state.lives=5;state.lastHeartAt=Date.now();state.hammer=3;state.rockets=3;state.colors=3;state.paints=3;state.extra=2;state.savedGrid=null;}}
function restart(){applyHeartRegen();if(state.busy)return;if(state.lives<=0){say("مفيش قلوب متاحة. استنى استعادة قلب جديد.");return;}state.lossHandled=false;state.score=0;state.moves=Math.max(18,25-Math.floor(state.level/4));state.won=false;state.booster=null;
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
  // FIX: swapping any special candy is always a valid move, so the board is never "dead".
  // Without this, the game could wrongly shuffle the board and wipe special candies.
  if(state.grid.some(row=>row.some(it=>it&&it.special)))return true;
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    for(const [dr,dc] of [[0,1],[1,0]]){
      const nr=r+dr,nc=c+dc;if(!inBounds(nr,nc))continue;
      const a=state.grid[r][c],b=state.grid[nr][nc];
      if(!a||!b||a.ice>0||b.ice>0)continue;
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
  if(!playable){
    for(let i=0;i<items.length;i++)items[i].type=original[i];
    say("اللوحة فيها حركات متاحة بالفعل.");
    return;
  }
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const it=state.grid[r][c];
    if(it.mesh&&!it.mesh.isDisposed?.())it.mesh.dispose();
    it.special=null;it.mesh=candyMesh(r,c,it.type,null,it.ice||0);
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
  const art=$("royalArtboard");if(!art)return;
  const index=((Math.max(1,Math.floor(Number(level)||1))-1)%3)+1;
  art.src="./assets/board-bg-0"+index+".svg";art.dataset.background=String(index);
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
