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
const state={grid:[],savedGrid:null,score:0,target:1500,moves:25,level:1,coins:500,stars:0,lives:5,lastHeartAt:0,selected:null,busy:false,won:false,lossHandled:false,booster:null,boosterSource:null,hammer:3,extra:2,paint:3,color:3,rocket:3};

const $=id=>document.getElementById(id);
const rand=()=>1+Math.floor(Math.random()*TYPES);
const pos=(r,c)=>new BABYLON.Vector3((c-(COLS-1)/2)*SPACING,0,(r-(ROWS-1)/2)*SPACING);
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
    const tones={match:660,coin:880,tap:440,win:990,lose:180};
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
const spriteMaterials={};
const spriteTextures={};
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
function candyMesh(r,c,type,special){
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
  const shineMat=new BABYLON.StandardMaterial("candyShineMat_"+r+"_"+c,scene);
  shineMat.diffuseColor=new BABYLON.Color3(1,1,1);
  shineMat.emissiveColor=new BABYLON.Color3(.22,.22,.22);
  shineMat.alpha=.72;
  shine.material=shineMat;
  shine.isPickable=false;

  const artworkPath=candyImages[type];
  if(artworkPath){
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
    if(texture?.isReady())revealArtwork();
    else if(texture?.onLoadObservable)texture.onLoadObservable.addOnce(revealArtwork);
  }

  if(special){
    const ringMat=new BABYLON.StandardMaterial("specialRingMat_"+r+"_"+c,scene);
    ringMat.diffuseColor=special==="wrapped"?new BABYLON.Color3(1,.72,.18):special==="color"?new BABYLON.Color3(.9,.55,1):new BABYLON.Color3(.25,.9,1);
    ringMat.emissiveColor=ringMat.diffuseColor.scale(.75);
    const ring=BABYLON.MeshBuilder.CreateTorus("specialRing_"+r+"_"+c,{diameter:.91,thickness:.055,tessellation:32},scene);
    ring.parent=root;ring.rotation.x=Math.PI/2;ring.position.y=.12;ring.material=ringMat;ring.isPickable=false;
  }
  root.__cmrSpriteBacked=!!artworkPath;
  return root;
}
function animate(mesh,target,duration=170){
  return new Promise(resolve=>{
    const start=mesh.position.clone(),begin=performance.now();
    const tick=()=>{
      const t=Math.min(1,(performance.now()-begin)/duration),e=1-Math.pow(1-t,3);
      mesh.position=BABYLON.Vector3.Lerp(start,target,e);
      if(t<1)requestAnimationFrame(tick);else resolve();
    };requestAnimationFrame(tick);
  });
}
function makeBoard(){ /* The uploaded artwork supplies the empty 7x8 board and frame. */ }
function setupScene(){
  if(engine&&scene)return;
  canvas=$("renderCanvas");
  engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:false,antialias:false},false);
  // Reduce mobile GPU load; requestAnimationFrame follows 60/90/120 Hz displays when supported.
  const deviceRatio=Math.max(1,window.devicePixelRatio||1);
  engine.setHardwareScalingLevel(Math.max(1/deviceRatio,1/1.25));
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
  renderLoop=()=>{if(!document.hidden)scene.render();};
  engine.runRenderLoop(renderLoop);
  window.CMRPauseGameRender=()=>{if(engine&&renderLoop)engine.stopRenderLoop(renderLoop);};
  window.CMRResumeGameRender=()=>{if(engine&&renderLoop&&!document.hidden)engine.runRenderLoop(renderLoop);};
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&engine)engine.resize();});
  window.addEventListener("resize",()=>engine.resize());
  requestAnimationFrame(()=>engine.resize());
  $("loading").style.display="none";
}
function randomType(r,c){
  let t=rand(),tries=0;
  while(tries<12&&((c>1&&state.grid[r][c-1]?.type===t&&state.grid[r][c-2]?.type===t)||(r>1&&state.grid[r-1][c]?.type===t&&state.grid[r-2][c]?.type===t))){t=rand();tries++;}
  return t;
}
function buildGrid(){
  // Dispose the previous board before creating another one to prevent GPU memory leaks.
  for(const row of state.grid)for(const item of row)if(item?.mesh&&!item.mesh.isDisposed?.())item.mesh.dispose();
  const saved=state.savedGrid;
  const canRestore=Array.isArray(saved)&&saved.length===ROWS&&saved.every(row=>Array.isArray(row)&&row.length===COLS&&row.every(cell=>cell&&Number.isInteger(cell.type)&&cell.type>=1&&cell.type<=TYPES));
  state.grid=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const savedCell=canRestore?saved[r][c]:null;
    const type=savedCell?savedCell.type:randomType(r,c);
    const special=savedCell&&(savedCell.special==="color"||savedCell.special==="striped"||savedCell.special==="wrapped")?savedCell.special:null;
    state.grid[r][c]={type,special,mesh:candyMesh(r,c,type,special)};
  }
  state.savedGrid=null;
}
function cellScreenPos(r,c){const rect=canvas.getBoundingClientRect(),rw=engine.getRenderWidth()||rect.width||1,rh=engine.getRenderHeight()||rect.height||1,vp=camera.viewport.toGlobal(rw,rh),p=BABYLON.Vector3.Project(pos(r,c),BABYLON.Matrix.Identity(),scene.getTransformMatrix(),vp);return{x:rect.left+(p.x/rw)*rect.width,y:rect.top+(p.y/rh)*rect.height};}function pickCellAtClient(clientX,clientY){const rect=canvas.getBoundingClientRect(),maxDist=Math.max(rect.width/COLS,rect.height/ROWS)*0.85;let best=null,bestD=Infinity;for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){const sp=cellScreenPos(r,c),d=Math.hypot(clientX-sp.x,clientY-sp.y);if(d<bestD&&d<=maxDist){bestD=d;best={r,c};}}}return best;}function chooseNeighbour(cell,dx,dy){const origin=cellScreenPos(cell.r,cell.c),dirs=[[cell.r-1,cell.c],[cell.r+1,cell.c],[cell.r,cell.c-1],[cell.r,cell.c+1]];let best=null,bestDot=-Infinity;for(const[nr,nc]of dirs){if(!inBounds(nr,nc))continue;const np=cellScreenPos(nr,nc),vx=np.x-origin.x,vy=np.y-origin.y,len=Math.hypot(vx,vy)||1,dot=(dx*vx+dy*vy)/len;if(dot>bestDot){bestDot=dot;best={r:nr,c:nc};}}return best;}function bindInput(){let gesture=null;const reset=()=>{gesture=null;};canvas.addEventListener("pointerdown",event=>{if(state.busy||state.won)return;event.preventDefault();const startCell=pickCellAtClient(event.clientX,event.clientY);if(!startCell)return;gesture={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,startCell,swiped:false};if(canvas.setPointerCapture){try{canvas.setPointerCapture(event.pointerId);}catch(_){}}},{passive:false});canvas.addEventListener("pointermove",event=>{if(!gesture||gesture.swiped||event.pointerId!==gesture.pointerId)return;event.preventDefault();if(state.busy||state.won)return;const dx=event.clientX-gesture.startX,dy=event.clientY-gesture.startY;if(Math.hypot(dx,dy)>=14){gesture.swiped=true;const next=chooseNeighbour(gesture.startCell,dx,dy),start=gesture.startCell;gesture=null;if(next&&inBounds(next.r,next.c)){clearSelection();void swap(start,next);}}},{passive:false});canvas.addEventListener("pointerup",event=>{if(!gesture||event.pointerId!==gesture.pointerId)return;event.preventDefault();const g=gesture;gesture=null;if(state.busy||state.won)return;if(!g.swiped)tapCell(g.startCell);},{passive:false});canvas.addEventListener("pointercancel",reset,{passive:true});canvas.addEventListener("lostpointercapture",reset,{passive:true});window.addEventListener("blur",reset);}function inBounds(r,c){return r>=0&&r<ROWS&&c>=0&&c<COLS;}
function tapCell(cell){
  if(state.booster){useBoardBooster(cell);return;}
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
  const A=state.grid[a.r][a.c],B=state.grid[b.r][b.c];if(!A||!B)return;
  state.busy=true;clearSelection();
  try{
    await Promise.all([animate(A.mesh,pos(b.r,b.c),115),animate(B.mesh,pos(a.r,a.c),115)]);
    state.grid[a.r][a.c]=B;state.grid[b.r][b.c]=A;
    A.mesh.metadata={r:b.r,c:b.c,candy:true};B.mesh.metadata={r:a.r,c:a.c,candy:true};
    if(A.special||B.special){
      await activateSpecial(a,b);state.moves--;updateHud();await settle();
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
  for(let r=0;r<ROWS;r++){
    let c=0;while(c<COLS){const item=state.grid[r][c];if(!item){c++;continue;}let end=c+1;while(end<COLS&&state.grid[r][end]&&state.grid[r][end].type===item.type)end++;
      if(end-c>=3)for(let k=c;k<end;k++)found.add(r+","+k);c=end;
    }
  }
  for(let c=0;c<COLS;c++){
    let r=0;while(r<ROWS){const item=state.grid[r][c];if(!item){r++;continue;}let end=r+1;while(end<ROWS&&state.grid[end][c]&&state.grid[end][c].type===item.type)end++;
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
    for(let x=c-1;x>=0&&state.grid[r][x]?.type===item.type;x--)left++;
    for(let x=c+1;x<COLS&&state.grid[r][x]?.type===item.type;x++)right++;
    for(let y=r-1;y>=0&&state.grid[y][c]?.type===item.type;y--)up++;
    for(let y=r+1;y<ROWS&&state.grid[y][c]?.type===item.type;y++)down++;
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
    if(A?.special==="striped")addCross(b);
    if(B?.special==="striped")addCross(a);
  }
  for(const key of cells){
    const [r,c]=key.split(",").map(Number),it=state.grid[r][c];
    if(it){burstAt(it.mesh.position,it.type);it.mesh.dispose();state.grid[r][c]=null;state.score+=60;}
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
async function settle(){
  let chain=0;
  // Prevent a pathological cascade from locking the board or monopolizing a mobile frame.
  while(chain<18){
    const matches=findMatches();if(matches.size===0)break;
    chain++;playSfx("match");
    const remove=Array.from(matches).map(s=>s.split(",").map(Number));
    const specialCandidate=chain===1?findSpecialCandidate(matches):null;
    const groupSpecial=specialCandidate?.type||null;
    const keep=specialCandidate?.cell||null;
    for(const p of remove){
      const r=p[0],c=p[1],it=state.grid[r][c];
      if(keep&&r===keep.r&&c===keep.c)continue;
      if(it&&it.mesh){burstAt(it.mesh.position,it.type);it.mesh.dispose();}
      state.grid[r][c]=null;state.score+=60;
    }
    if(keep){
      const it=state.grid[keep.r][keep.c];if(it){it.special=groupSpecial;it.mesh.dispose();it.mesh=candyMesh(keep.r,keep.c,it.type,groupSpecial);}
    }
    if(chain>1)state.score+=matches.size*10;
    updateHud();await wait(100);
    const falling=[];
    for(let c=0;c<COLS;c++){
      let write=ROWS-1;
      for(let r=ROWS-1;r>=0;r--){const it=state.grid[r][c];if(it){if(write!==r){state.grid[write][c]=it;state.grid[r][c]=null;it.mesh.metadata={r:write,c:c,candy:true};falling.push(animate(it.mesh,pos(write,c),170));}write--;}}
      for(let r=write;r>=0;r--){const type=rand(),mesh=candyMesh(r,c,type,null);mesh.position.y=5.5;state.grid[r][c]={type:type,special:null,mesh:mesh};mesh.metadata={r:r,c:c,candy:true};falling.push(animate(mesh,pos(r,c),230));}
    }
    await Promise.all(falling);
    await wait(80);
  }
  if(findMatches().size>0)say("سلسلة طويلة! كمل المطابقة بحركة جديدة.");
  else if(chain>1)say("سلسلة سحرية ×"+chain+"!");
  updateHud();
}
function burstAt(position,type){
  const color=palette[type-1].color;
  for(let i=0;i<7;i++){
    const p=BABYLON.MeshBuilder.CreateSphere("sugarParticle",{diameter:.09,segments:6},scene);
    p.position=position.clone();const m=new BABYLON.StandardMaterial("particleMat",scene);m.diffuseColor=color;m.emissiveColor=color;p.material=m;p.isPickable=false;
    const angle=Math.PI*2*i/7,dist=.35+Math.random()*.25;
    const target=position.add(new BABYLON.Vector3(Math.cos(angle)*dist,.25+Math.random()*.35,Math.sin(angle)*dist));
    animate(p,target,250).then(()=>{p.dispose();m.dispose();});
  }
}
function updateHud(){
  applyHeartRegen();$("score").textContent=state.score.toLocaleString("en-US");$("moves").textContent=state.moves;$("heartCount").textContent=state.lives;
  $("levelLabel").textContent="المستوى "+state.level;$("targetScore").textContent=state.target.toLocaleString("en-US");
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
function checkEnd(){
  if(state.score>=state.target&&!state.won){
    state.lossHandled=false;state.won=true;const earnedStars=state.score>=state.target*2?3:(state.score>=state.target*1.5?2:1);const rewardGranted=claimLevelReward(state.level);if(rewardGranted){state.stars+=earnedStars;state.coins+=80;}updateHud();const starDisplay=$("resultModal").querySelector(".result-stars");if(starDisplay)starDisplay.textContent="⭐".repeat(earnedStars)+"☆".repeat(3-earnedStars);
    $("resultTitle").textContent=rewardGranted?"انتصار سحري!":"أحسنت!";
    $("resultModal").classList.remove("hidden");$("nextBtn").disabled=false;$("characterMessage").textContent="يا له من إنجاز رائع!";$("resultText").textContent=rewardGranted?"أنقذت حدائق السكر وجمعت "+state.score+" نقطة، وحصلت على "+earnedStars+" نجوم ومكافأة 80 عملة.":"أنقذت حدائق السكر وجمعت "+state.score+" نقطة. مكافأة المستوى والنجوم اتصرفت قبل كده.";
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
function saveProgress(completed=false){try{
  const identity=ensureGuestIdentity();
  const gridReady=Array.isArray(state.grid)&&state.grid.length===ROWS&&state.grid.every(row=>Array.isArray(row)&&row.length===COLS&&row.every(Boolean));
  const grid=gridReady?state.grid.map(row=>row.map(item=>({type:item.type,special:item.special||null}))):null;
  localStorage.setItem(SAVE_KEY,JSON.stringify({playerId:identity.id,provider:identity.provider,level:state.level,target:state.target,moves:state.moves,score:state.score,coins:state.coins,stars:state.stars,hammer:state.hammer,extra:state.extra,paint:state.paint,color:state.color,rocket:state.rocket,lives:state.lives,grid,completed,lossHandled:state.lossHandled,lastHeartAt:state.lastHeartAt}));
}catch(e){}}
function loadProgress(){try{
  const x=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");
  const completed=!!x.completed;
  const rawLevel=Number(x.level),savedLevel=Number.isFinite(rawLevel)?Math.min(1000000,Math.max(1,Math.floor(rawLevel)||1)):1;
  state.level=savedLevel+(completed?1:0);
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
  state.extra=completed?2:(Number.isFinite(extraValue)?Math.min(10,Math.max(0,Math.floor(extraValue))):2);
  state.paint=completed?3:Math.min(9,Math.max(0,Math.floor(Number(x.paint??3))));
  state.color=completed?3:Math.min(9,Math.max(0,Math.floor(Number(x.color??3))));
  state.rocket=completed?3:Math.min(9,Math.max(0,Math.floor(Number(x.rocket??3))));
  const validGrid=Array.isArray(x.grid)&&x.grid.length===ROWS&&x.grid.every(row=>Array.isArray(row)&&row.length===COLS&&row.every(cell=>cell&&Number.isInteger(cell.type)&&cell.type>=1&&cell.type<=TYPES&&(cell.special===null||cell.special==="color"||cell.special==="striped"||cell.special==="wrapped")));
  state.savedGrid=!completed&&validGrid?x.grid.map(row=>row.map(cell=>({type:cell.type,special:cell.special||null}))):null;
}catch(e){state.level=1;state.target=1500;state.moves=25;state.score=0;state.coins=500;state.stars=0;state.lives=5;state.lastHeartAt=Date.now();state.hammer=3;state.extra=2;state.savedGrid=null;}}
function restart(){applyHeartRegen();if(state.busy)return;if(state.lives<=0){say("مفيش قلوب متاحة. استنى استعادة قلب جديد.");return;}state.lossHandled=false;state.score=0;state.moves=Math.max(18,25-Math.floor(state.level/4));state.won=false;cancelBooster();
  $("resultButton").textContent="استمرار";$("queen").classList.remove("celebrate");$("dragon").classList.remove("celebrate","defeat");clearSelection();$("resultModal").classList.add("hidden");$("nextBtn").disabled=true;buildGrid();updateHud();saveProgress(false);$("characterMessage").textContent="بدّل الحلوى واجمع 3 أو أكثر!";}
async function useBoardBooster(cell){
  if(state.won||state.busy||!state.booster)return;
  const kind=state.booster,selected=state.grid[cell.r][cell.c];
  if(kind==="paint"&&!state.boosterSource){
    state.boosterSource=cell;selected.mesh.scaling.setAll(1.16);
    say("اختار الحلوى اللي عايز تغيّر لونها");return;
  }
  const counts={paint:state.paint,shuffle:state.extra,bomb:state.hammer,color:state.color,rocket:state.rocket};
  if((counts[kind]||0)<=0){say("المساعدة دي خلصت!");cancelBooster();return;}
  state.busy=true;
  try{
    const cells=new Set();
    if(kind==="paint"){
      const source=state.boosterSource,from=state.grid[source.r][source.c];
      if(!from||!selected||source.r===cell.r&&source.c===cell.c){say("اختار حلوى تانية لتغيير لونها.");return;}
      from.mesh.scaling.setAll(1);
      selected.mesh.dispose();selected.type=from.type;selected.special=null;
      selected.mesh=candyMesh(cell.r,cell.c,selected.type,null);
      selected.mesh.scaling.setAll(.2);await animate(selected.mesh,pos(cell.r,cell.c),160);selected.mesh.scaling.setAll(1);
      state.paint--;
    }else{
      if(kind==="bomb"){
        for(let r=cell.r-1;r<=cell.r+1;r++)for(let c=cell.c-1;c<=cell.c+1;c++)if(inBounds(r,c))cells.add(r+","+c);
        state.hammer--;
      }else if(kind==="color"){
        for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(state.grid[r][c]?.type===selected.type)cells.add(r+","+c);
        state.color--;
      }else if(kind==="rocket"){
        for(let c=0;c<COLS;c++)cells.add(cell.r+","+c);
        for(let r=0;r<ROWS;r++)cells.add(r+","+cell.c);
        state.rocket--;
      }
      for(const key of cells){
        const [r,c]=key.split(",").map(Number),it=state.grid[r][c];
        if(it?.mesh){burstAt(it.mesh.position,it.type);it.mesh.dispose();state.grid[r][c]=null;state.score+=60;}
      }
    }
    state.booster=null;state.boosterSource=null;
    document.querySelectorAll(".art-booster").forEach(btn=>btn.classList.remove("active"));
    refreshBoosterBadges();updateHud();await settle();
    say(({paint:"تم تغيير لون الحلوى!",bomb:"انفجار 3×3! 💥",color:"اختفى اللون بالكامل! 🌈",rocket:"الصاروخ مسح الصف والعمود! 🚀"})[kind]||"تم استخدام المساعدة!");
  }catch(error){console.error("Booster failed:",error);say("المساعدة ما اشتغلتش، جرّب تاني.");}
  finally{state.busy=false;checkEnd();if(!state.won&&state.moves>0&&!hasPossibleMove())shuffle();saveProgress(state.won&&state.score>=state.target);}
}
function cancelBooster(){
  if(state.boosterSource){const p=state.boosterSource;state.grid[p.r]?.[p.c]?.mesh?.scaling.setAll(1);}
  state.booster=null;state.boosterSource=null;
  document.querySelectorAll(".art-booster").forEach(btn=>btn.classList.remove("active"));
}
function selectBooster(kind){
  if(state.won||state.busy)return;
  if(kind==="shuffle"){
    if(state.extra<=0){say("مساعد الخلط خلص!");return;}
    state.extra--;refreshBoosterBadges();shuffle();saveProgress(false);return;
  }
  const count={paint:state.paint,bomb:state.hammer,color:state.color,rocket:state.rocket}[kind]||0;
  if(count<=0){say("المساعدة دي خلصت!");return;}
  if(state.booster===kind){cancelBooster();say("تم إلغاء المساعدة");return;}
  cancelBooster();state.booster=kind;
  const names={paint:"الفرشاة: اختار حلوى من لونها ثم الحلوى المستهدفة",bomb:"القنبلة: اختار مكان التفجير",color:"عجلة الألوان: اختار اللون اللي هتمسحه",rocket:"الصاروخ: اختار الصف والعمود"};
  $(kind+"Btn").classList.add("active");say(names[kind]);
}

function hasPossibleMove(){
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    for(const [dr,dc] of [[0,1],[1,0]]){
      const nr=r+dr,nc=c+dc;if(!inBounds(nr,nc))continue;
      const a=state.grid[r][c],b=state.grid[nr][nc];
      state.grid[r][c]=b;state.grid[nr][nc]=a;
      const valid=findMatches().size>0;
      state.grid[r][c]=a;state.grid[nr][nc]=b;
      if(valid)return true;
    }
  }
  return false;
}
function shuffle(){
  if(state.busy||state.won)return;
  clearSelection();
  const items=state.grid.flat(),original=items.map(it=>it.type);
  let values=original.slice(),playable=false;
  // Keep reshuffling until the board has no automatic matches and at least one legal move.
  for(let attempt=0;attempt<300;attempt++){
    values=original.slice();
    for(let i=values.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
    for(let i=0;i<items.length;i++)items[i].type=values[i];
    if(findMatches().size===0&&hasPossibleMove()){playable=true;break;}
  }
  // Last-resort fresh board: never leave the player with a dead board.
  if(!playable){
    for(let attempt=0;attempt<80&&!playable;attempt++){
      const fresh=Array.from({length:ROWS},()=>Array(COLS).fill(0));
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
        let type=rand(),tries=0;
        while(tries++<20&&((c>1&&fresh[r][c-1]===type&&fresh[r][c-2]===type)||(r>1&&fresh[r-1][c]===type&&fresh[r-2][c]===type)))type=rand();
        fresh[r][c]=type;
      }
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)state.grid[r][c].type=fresh[r][c];
      playable=findMatches().size===0&&hasPossibleMove();
    }
  }
  if(!playable){for(let i=0;i<items.length;i++)items[i].type=original[i];say("اللوحة فيها حركات متاحة بالفعل.");return;}
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const it=state.grid[r][c];it.mesh.dispose();it.special=null;it.mesh=candyMesh(r,c,it.type,null);
  }
  say("اتخلطت الحلوى! تقدر تكمل اللعب.");
  saveProgress(false);
}
function nextLevel(){
  if(!state.won||state.score<state.target)return;
  state.lossHandled=false;state.level++;state.target=Math.round(state.target*1.22);state.moves=Math.max(18,25-Math.floor(state.level/4));state.score=0;state.won=false;state.hammer=3;state.extra=2;state.paint=3;state.color=3;state.rocket=3;
  refreshBoosterBadges();
  $("resultButton").textContent="استمرار";$("queen").classList.remove("celebrate");
  $("resultModal").classList.add("hidden");$("nextBtn").disabled=true;
  for(const row of state.grid)for(const item of row)if(item?.mesh)item.mesh.dispose();
  state.grid=[];state.savedGrid=null;state.selected=null;updateHud();saveProgress(false);$("characterMessage").textContent="مستوى جديد وتحدٍ أكبر!";
  window.CMRShowWorldMap?.();
}

function refreshBoosterBadges(){const map={paintBtn:state.paint,shuffleBtn:state.extra,bombBtn:state.hammer,colorBtn:state.color,rocketBtn:state.rocket};for(const [id,count] of Object.entries(map)){const btn=$(id);if(btn){btn.querySelector("small").textContent=count;btn.disabled=count<=0;}}}
function ensureShop(){
  if($("royalShop"))return;
  const trigger=document.createElement("button");
  trigger.id="shopOpenBtn";trigger.type="button";trigger.className="shop-open-btn";
  trigger.setAttribute("aria-label","المتجر");trigger.textContent="🛍️";
  $("plusCoins").insertAdjacentElement("afterend",trigger);
  const modal=document.createElement("div");modal.id="royalShop";modal.className="royal-shop hidden";
  modal.innerHTML='<div class="royal-shop-card" role="dialog" aria-modal="true" aria-labelledby="shopTitle"><button type="button" class="shop-close" aria-label="إغلاق">×</button><div class="shop-crown">♛</div><h2 id="shopTitle">المتجر الملكي</h2><p class="shop-wallet">رصيدك: <b id="shopCoins">0</b> ✦</p><div class="shop-items"><article class="shop-item"><span class="shop-item-icon">🔨</span><div><b>مطارق إضافية</b><small>+3 مطارق · بحد أقصى 9</small></div><button type="button" data-buy="hammer">150 ✦</button></article><article class="shop-item"><span class="shop-item-icon">💣</span><div><b>حركات إضافية</b><small>+2 استخدام · بحد أقصى 10</small></div><button type="button" data-buy="moves">120 ✦</button></article><article class="shop-item"><span class="shop-item-icon">❤️</span><div><b>قلب إضافي</b><small>+1 قلب · بحد أقصى 5</small></div><button type="button" data-buy="heart">180 ✦</button></article></div><p class="shop-note">المشتريات بالعملات داخل اللعبة فقط، بدون دفع حقيقي.</p></div>';
  document.body.appendChild(modal);
  const close=()=>modal.classList.add("hidden");
  trigger.addEventListener("click",()=>{refreshShop();modal.classList.remove("hidden");});
  modal.querySelector(".shop-close").addEventListener("click",close);
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
  $("restartBtn").addEventListener("click",restart);
  $("nextBtn").addEventListener("click",nextLevel);
  $("resultButton").addEventListener("click",()=>{if(state.moves<=0&&state.score<state.target)restart();else nextLevel();});
  $("paintBtn").addEventListener("click",()=>selectBooster("paint"));
  $("shuffleBtn").addEventListener("click",()=>selectBooster("shuffle"));
  $("bombBtn").addEventListener("click",()=>selectBooster("bomb"));
  $("colorBtn").addEventListener("click",()=>selectBooster("color"));
  $("rocketBtn").addEventListener("click",()=>selectBooster("rocket"));
  $("plusCoins").addEventListener("click",()=>{
    const today=new Date().toISOString().slice(0,10),key="cmr_daily_reward_v1";
    let claimed="";try{claimed=localStorage.getItem(key)||"";}catch(e){}
    if(claimed===today){say("استلمت مكافأة النهارده بالفعل. ارجع بكرة!");return;}
    state.coins+=100;try{localStorage.setItem(key,today);}catch(e){}
    updateHud();saveProgress(false);playSfx("coin");say("مكافأة يومية: +100 عملة ذهبية!");
  });
  $("soundBtn").addEventListener("click",()=>{
    soundEnabled=!soundEnabled;$("soundBtn").textContent=soundEnabled?"♫":"🔇";
    if(soundEnabled)playSfx("tap");say(soundEnabled?"الصوت اتفتح":"الصوت اتقفل");
  });
}
async function start(){
  loadProgress();setupScene();
  // Measure the visible area of each candy image first so all candies share one size.
  await preloadCandyArt();
  buildGrid();bindUI();updateHud();startHeartClock();
  // Download the candy models progressively, one at a time, while the board is playable.
  void // Candy artwork is loaded lazily by the board materials; no GLB models are requested.
  refreshBoosterBadges();
  $("characterMessage").textContent="أهلاً بك! أنقذ مملكتي بالحلوى.";
  checkEnd();
  saveProgress(state.won&&state.score>=state.target);
}
let gameInitialized=false;
window.CMRStartSelectedHouse=async()=>{
  // Reveal gameplay first; the hidden game shell was preventing the user from
  // seeing the board whenever Babylon initialization failed.
  document.body.classList.add("game-started");
  window.CMRHideWorldMap?.();
  try{
    if(!gameInitialized){
      await start();
      gameInitialized=true;
    }else{
      state.won=false;state.busy=false;cancelBooster();state.savedGrid=null;
      $("resultModal").classList.add("hidden");$("nextBtn").disabled=true;
      buildGrid();updateHud();
    }
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
    if(launching)return;
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
  // Play is bound by the independent mobile-safe bootstrap in index.html.
  $("facebookLoginBtn").addEventListener("click",()=>{
    facebookModal.classList.remove("hidden");
  });
  $("facebookCloseBtn").addEventListener("click",()=>facebookModal.classList.add("hidden"));
  $("facebookGuestBtn").addEventListener("click",()=>{
    facebookModal.classList.add("hidden");
    launchAsGuest();
  });
});
})();
