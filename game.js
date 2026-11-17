(() => {
"use strict";
const SIZE=7, SPACING=1.02, TYPES=7, SAVE_KEY="cmr_reborn_v1", PLAYER_KEY="cmr_player_identity_v1";
const palette=[
  {name:"Ruby Heart",color:new BABYLON.Color3(.96,.12,.31)},
  {name:"Sun Drop",color:new BABYLON.Color3(1,.48,.055)},
  {name:"Star Sugar",color:new BABYLON.Color3(1,.79,.12)},
  {name:"Emerald Leaf",color:new BABYLON.Color3(.12,.78,.38)},
  {name:"Sky Diamond",color:new BABYLON.Color3(.12,.61,1)},
  {name:"Violet Jelly",color:new BABYLON.Color3(.68,.25,.96)},
  {name:"Plum Pop",color:new BABYLON.Color3(.52,.16,.68)}
];
const state={grid:[],savedGrid:null,score:0,target:1500,moves:25,level:1,coins:500,stars:0,lives:5,lastHeartAt:0,selected:null,busy:false,won:false,lossHandled:false,booster:null,hammer:3,extra:2};
let soundEnabled=true,audioContext=null,heartTimer=null;
let engine,scene,camera,canvas,materials=[],coreMaterials=[],toastTimer,boardBaseMesh,backgroundVideoLayer,renderLoop;
const spriteMaterials={};
const candyImages={
  1:"./assets/candy_basic_1.jpg",
  2:"./assets/candy_basic_2.jpg",
  3:"./assets/candy_basic_3.jpg",
  4:"./assets/candy_basic_4.jpg",
  5:"./assets/candy_basic_5.jpg",
  6:"./assets/candy_basic_6.jpg",
  7:"./assets/candy_special_1.jpg"
};
const $=id=>document.getElementById(id);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const rand=()=>Math.floor(Math.random()*TYPES)+1;
function say(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),1800);}
function playSfx(kind="tap"){
  if(!soundEnabled)return;
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
    audioContext=audioContext||new Ctx();if(audioContext.state==="suspended")void audioContext.resume();
    const now=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();
    const notes={tap:520,match:760,win:980,lose:180,coin:1120};
    osc.type=kind==="lose"?"triangle":"sine";osc.frequency.setValueAtTime(notes[kind]||520,now);
    if(kind==="win")osc.frequency.exponentialRampToValueAtTime(1480,now+.18);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.07,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+(kind==="win"?.28:.12));
    osc.connect(gain);gain.connect(audioContext.destination);osc.start(now);osc.stop(now+(kind==="win"?.3:.14));
  }catch(e){console.warn("Audio unavailable",e);}
}
const HEART_INTERVAL=30*60*1000;

const LEVEL_REWARD_KEY="cmr_level_rewards_v1";
const sessionRewardClaims=new Set();
function claimLevelReward(level){
  const key=String(Math.max(1,Math.floor(Number(level)||1)));
  try{
    const ledger=JSON.parse(localStorage.getItem(LEVEL_REWARD_KEY)||"{}");
    if(ledger&&ledger[key])return false;
    ledger[key]={claimedAt:Date.now()};
    localStorage.setItem(LEVEL_REWARD_KEY,JSON.stringify(ledger));
    return true;
  }catch(error){
    if(sessionRewardClaims.has(key))return false;
    sessionRewardClaims.add(key);return true;
  }
}

function applyHeartRegen(){
  const now=Date.now();
  if(state.lives>=5){state.lives=5;state.lastHeartAt=now;return false;}
  if(!state.lastHeartAt)state.lastHeartAt=now;
  const elapsed=now-state.lastHeartAt,earned=Math.floor(elapsed/HEART_INTERVAL);
  if(earned>0){state.lives=Math.min(5,state.lives+earned);state.lastHeartAt=state.lives>=5?now:state.lastHeartAt+earned*HEART_INTERVAL;return true;}
  return false;
}
function startHeartClock(){
  clearInterval(heartTimer);
  heartTimer=setInterval(()=>{if(applyHeartRegen()){updateHud();saveProgress(false);}else updateHud();},30000);
}

function pos(r,c){return new BABYLON.Vector3((c-(SIZE-1)/2)*SPACING,.55,(r-(SIZE-1)/2)*SPACING);}
function makeMaterial(type){
  if(materials[type])return materials[type];
  const mat=new BABYLON.StandardMaterial("sugarMat"+type,scene);
  mat.diffuseColor=palette[type-1].color;
  mat.specularColor=new BABYLON.Color3(1,.96,1);
  mat.specularPower=110;
  mat.emissiveColor=palette[type-1].color.scale(.10);
  mat.ambientColor=palette[type-1].color.scale(.22);
  mat.useSpecularOverAlpha=true;
  mat.emissiveFresnelParameters=new BABYLON.FresnelParameters();
  mat.emissiveFresnelParameters.bias=.04;
  mat.emissiveFresnelParameters.power=2.2;
  mat.emissiveFresnelParameters.leftColor=palette[type-1].color.scale(.12);
  mat.emissiveFresnelParameters.rightColor=new BABYLON.Color3(.62,.42,.85);
  materials[type]=mat;return mat;
}
function candySpriteMaterial(type){
  if(spriteMaterials[type])return spriteMaterials[type];
  const mat=new BABYLON.StandardMaterial("candySpriteMat_"+type,scene);
  mat.diffuseColor=new BABYLON.Color3(1,1,1);
  mat.emissiveColor=new BABYLON.Color3(1,1,1);
  mat.disableLighting=true;
  mat.backFaceCulling=false;
  mat.useAlphaFromDiffuseTexture=true;
  mat.transparencyMode=BABYLON.Material.MATERIAL_ALPHABLEND;
  mat.alpha=1;
  spriteMaterials[type]=mat;
  const texture=new BABYLON.Texture(
    candyImages[type],scene,
    true,false,
    BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
    ()=>{texture.hasAlpha=true;mat.diffuseTexture=texture;mat.useAlphaFromDiffuseTexture=true;},
    error=>console.warn("Candy SVG failed to load:",type,error)
  );
  texture.hasAlpha=true;
  texture.wrapU=BABYLON.Texture.CLAMP_ADDRESSMODE;
  texture.wrapV=BABYLON.Texture.CLAMP_ADDRESSMODE;
  return mat;
}
function candyMesh(r,c,type,special){
  const root=new BABYLON.TransformNode("candyRoot_"+r+"_"+c,scene);
  const plane=BABYLON.MeshBuilder.CreatePlane("candyArt_"+r+"_"+c,{size:SPACING*.82},scene);
  plane.parent=root;plane.position.y=.035;plane.rotation.x=Math.PI/2;
  plane.material=candySpriteMaterial(type);plane.isPickable=true;
  plane.metadata={r,c,candy:true};
  root.position=pos(r,c);root.metadata={r,c,candy:true};root.isPickable=false;
  if(special){
    const ringMat=new BABYLON.StandardMaterial("specialRingMat_"+r+"_"+c,scene);
    ringMat.diffuseColor=special==="wrapped"?new BABYLON.Color3(1,.72,.18):special==="color"?new BABYLON.Color3(.9,.55,1):new BABYLON.Color3(.25,.9,1);
    ringMat.emissiveColor=ringMat.diffuseColor.scale(.75);
    const ring=BABYLON.MeshBuilder.CreateTorus("specialRing_"+r+"_"+c,{diameter:.91,thickness:.055,tessellation:32},scene);
    ring.parent=root;ring.rotation.x=Math.PI/2;ring.position.y=.12;ring.material=ringMat;ring.isPickable=false;
  }
  root.__cmrSpriteBacked=true;root.__candyPlane=plane;
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
function makeBoard(){ /* The uploaded artwork supplies the empty 7x7 board and frame. */ }
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
  camera.orthoLeft=-3.7;camera.orthoRight=3.7;camera.orthoTop=3.7;camera.orthoBottom=-3.7;
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
  const canRestore=Array.isArray(saved)&&saved.length===SIZE&&saved.every(row=>Array.isArray(row)&&row.length===SIZE&&row.every(cell=>cell&&Number.isInteger(cell.type)&&cell.type>=1&&cell.type<=TYPES));
  state.grid=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    const savedCell=canRestore?saved[r][c]:null;
    const type=savedCell?savedCell.type:randomType(r,c);
    const special=savedCell&&(savedCell.special==="color"||savedCell.special==="striped"||savedCell.special==="wrapped")?savedCell.special:null;
    state.grid[r][c]={type,special,mesh:candyMesh(r,c,type,special)};
  }
  state.savedGrid=null;
}
function cellScreenPos(r,c){const rect=canvas.getBoundingClientRect(),rw=engine.getRenderWidth()||rect.width||1,rh=engine.getRenderHeight()||rect.height||1,vp=camera.viewport.toGlobal(rw,rh),p=BABYLON.Vector3.Project(pos(r,c),BABYLON.Matrix.Identity(),scene.getTransformMatrix(),vp);return{x:rect.left+(p.x/rw)*rect.width,y:rect.top+(p.y/rh)*rect.height};}function pickCellAtClient(clientX,clientY){const rect=canvas.getBoundingClientRect(),maxDist=Math.max(rect.width,rect.height)/SIZE*0.85;let best=null,bestD=Infinity;for(let r=0;r<SIZE;r++){for(let c=0;c<SIZE;c++){const sp=cellScreenPos(r,c),d=Math.hypot(clientX-sp.x,clientY-sp.y);if(d<bestD&&d<=maxDist){bestD=d;best={r,c};}}}return best;}function chooseNeighbour(cell,dx,dy){const origin=cellScreenPos(cell.r,cell.c),dirs=[[cell.r-1,cell.c],[cell.r+1,cell.c],[cell.r,cell.c-1],[cell.r,cell.c+1]];let best=null,bestDot=-Infinity;for(const[nr,nc]of dirs){if(!inBounds(nr,nc))continue;const np=cellScreenPos(nr,nc),vx=np.x-origin.x,vy=np.y-origin.y,len=Math.hypot(vx,vy)||1,dot=(dx*vx+dy*vy)/len;if(dot>bestDot){bestDot=dot;best={r:nr,c:nc};}}return best;}function bindInput(){let gesture=null;const reset=()=>{gesture=null;};canvas.addEventListener("pointerdown",event=>{if(state.busy||state.won)return;event.preventDefault();const startCell=pickCellAtClient(event.clientX,event.clientY);if(!startCell)return;gesture={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,startCell,swiped:false};if(canvas.setPointerCapture){try{canvas.setPointerCapture(event.pointerId);}catch(_){}}},{passive:false});canvas.addEventListener("pointermove",event=>{if(!gesture||gesture.swiped||event.pointerId!==gesture.pointerId)return;event.preventDefault();if(state.busy||state.won)return;const dx=event.clientX-gesture.startX,dy=event.clientY-gesture.startY;if(Math.hypot(dx,dy)>=14){gesture.swiped=true;const next=chooseNeighbour(gesture.startCell,dx,dy),start=gesture.startCell;gesture=null;if(next&&inBounds(next.r,next.c)){clearSelection();void swap(start,next);}}},{passive:false});canvas.addEventListener("pointerup",event=>{if(!gesture||event.pointerId!==gesture.pointerId)return;event.preventDefault();const g=gesture;gesture=null;if(state.busy||state.won)return;if(!g.swiped)tapCell(g.startCell);},{passive:false});canvas.addEventListener("pointercancel",reset,{passive:true});canvas.addEventListener("lostpointercapture",reset,{passive:true});window.addEventListener("blur",reset);}function inBounds(r,c){return r>=0&&r<SIZE&&c>=0&&c<SIZE;}
function tapCell(cell){
  if(state.booster==="hammer"){useHammer(cell);return;}
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
  for(let r=0;r<SIZE;r++){
    let c=0;while(c<SIZE){const item=state.grid[r][c];if(!item){c++;continue;}let end=c+1;while(end<SIZE&&state.grid[r][end]&&state.grid[r][end].type===item.type)end++;
      if(end-c>=3)for(let k=c;k<end;k++)found.add(r+","+k);c=end;
    }
  }
  for(let c=0;c<SIZE;c++){
    let r=0;while(r<SIZE){const item=state.grid[r][c];if(!item){r++;continue;}let end=r+1;while(end<SIZE&&state.grid[end][c]&&state.grid[end][c].type===item.type)end++;
      if(end-r>=3)for(let k=r;k<end;k++)found.add(k+","+c);r=end;
    }
  }
  return found;
}
function findSpecialCandidate(matches){
  // A T/L intersection of two same-type runs (3+ in each direction) creates a wrapped candy.
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    if(!matches.has(r+","+c))continue;
    const item=state.grid[r][c];if(!item)continue;
    let left=0,right=0,up=0,down=0;
    for(let x=c-1;x>=0&&state.grid[r][x]?.type===item.type;x--)left++;
    for(let x=c+1;x<SIZE&&state.grid[r][x]?.type===item.type;x++)right++;
    for(let y=r-1;y>=0&&state.grid[y][c]?.type===item.type;y--)up++;
    for(let y=r+1;y<SIZE&&state.grid[y][c]?.type===item.type;y++)down++;
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
  for(let r=0;r<SIZE;r++){
    let c=0;
    while(c<SIZE){
      const item=state.grid[r][c];
      if(!item||!matches.has(r+","+c)){c++;continue;}
      const type=item.type;let end=c+1;
      while(end<SIZE&&matches.has(r+","+end)&&state.grid[r][end]?.type===type)end++;
      const cells=[];for(let x=c;x<end;x++)cells.push({r,c:x});
      consider(cells,cells.length>=5?"color":"striped");
      c=end;
    }
  }
  for(let c=0;c<SIZE;c++){
    let r=0;
    while(r<SIZE){
      const item=state.grid[r][c];
      if(!item||!matches.has(r+","+c)){r++;continue;}
      const type=item.type;let end=r+1;
      while(end<SIZE&&matches.has(end+","+c)&&state.grid[end][c]?.type===type)end++;
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
  const addCross=cell=>{for(let k=0;k<SIZE;k++){cells.add(cell.r+","+k);cells.add(k+","+cell.c);}};
  if(A?.special==="color"&&B?.special==="color"){
    for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)cells.add(r+","+c);
  }else if(A?.special==="wrapped"&&B?.special==="wrapped"){
    for(const center of [a,b])for(let r=center.r-2;r<=center.r+2;r++)for(let c=center.c-2;c<=center.c+2;c++)if(inBounds(r,c))cells.add(r+","+c);
  }else if((A?.special==="wrapped"&&B?.special==="striped")||(B?.special==="wrapped"&&A?.special==="striped")){
    const center=A.special==="wrapped"?a:b;
    for(let offset=-1;offset<=1;offset++){
      for(let c=0;c<SIZE;c++)if(inBounds(center.r+offset,c))cells.add((center.r+offset)+","+c);
      for(let r=0;r<SIZE;r++)if(inBounds(r,center.c+offset))cells.add(r+","+(center.c+offset));
    }
  }else if((A?.special==="wrapped"&&B?.special==="color")||(B?.special==="wrapped"&&A?.special==="color")){
    const wrapped=A.special==="wrapped"?A:B,center=A.special==="wrapped"?a:b;
    const target=(wrapped===A?B:A)?.type;
    for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(state.grid[r][c]?.type===target){
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
    if(target)for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
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
    for(let c=0;c<SIZE;c++){
      let write=SIZE-1;
      for(let r=SIZE-1;r>=0;r--){const it=state.grid[r][c];if(it){if(write!==r){state.grid[write][c]=it;state.grid[r][c]=null;it.mesh.metadata={r:write,c:c,candy:true};falling.push(animate(it.mesh,pos(write,c),170));}write--;}}
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
  const gridReady=Array.isArray(state.grid)&&state.grid.length===SIZE&&state.grid.every(row=>Array.isArray(row)&&row.length===SIZE&&row.every(Boolean));
  const grid=gridReady?state.grid.map(row=>row.map(item=>({type:item.type,special:item.special||null}))):null;
  localStorage.setItem(SAVE_KEY,JSON.stringify({playerId:identity.id,provider:identity.provider,level:state.level,target:state.target,moves:state.moves,score:state.score,coins:state.coins,stars:state.stars,hammer:state.hammer,extra:state.extra,lives:state.lives,grid,completed,lossHandled:state.lossHandled,lastHeartAt:state.lastHeartAt}));
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
  const validGrid=Array.isArray(x.grid)&&x.grid.length===SIZE&&x.grid.every(row=>Array.isArray(row)&&row.length===SIZE&&row.every(cell=>cell&&Number.isInteger(cell.type)&&cell.type>=1&&cell.type<=TYPES&&(cell.special===null||cell.special==="color"||cell.special==="striped"||cell.special==="wrapped")));
  state.savedGrid=!completed&&validGrid?x.grid.map(row=>row.map(cell=>({type:cell.type,special:cell.special||null}))):null;
}catch(e){state.level=1;state.target=1500;state.moves=25;state.score=0;state.coins=500;state.stars=0;state.lives=5;state.lastHeartAt=Date.now();state.hammer=3;state.extra=2;state.savedGrid=null;}}
function restart(){applyHeartRegen();if(state.busy)return;if(state.lives<=0){say("مفيش قلوب متاحة. استنى استعادة قلب جديد.");return;}state.lossHandled=false;state.score=0;state.moves=Math.max(18,25-Math.floor(state.level/4));state.won=false;state.booster=null;
  $("resultButton").textContent="استمرار";$("queen").classList.remove("celebrate");$("dragon").classList.remove("celebrate","defeat");clearSelection();$("resultModal").classList.add("hidden");$("nextBtn").disabled=true;buildGrid();updateHud();saveProgress(false);$("characterMessage").textContent="بدّل الحلوى واجمع 3 أو أكثر!";}
async function useHammer(cell){
  if(state.won||state.busy)return;
  const it=state.grid[cell.r][cell.c];if(!it)return;
  state.busy=true;clearSelection();
  try{
    burstAt(it.mesh.position,it.type);it.mesh.dispose();state.grid[cell.r][cell.c]=null;
    state.score+=100;state.moves=Math.max(0,state.moves-1);state.hammer=Math.max(0,state.hammer-1);
    refreshBoosterBadges();
    state.booster=null;$("hammerBtn").classList.remove("active");
    const replacement={type:rand(),special:null,mesh:null};
    replacement.mesh=candyMesh(cell.r,cell.c,replacement.type,null);
    replacement.mesh.position.y=5.5;state.grid[cell.r][cell.c]=replacement;
    await animate(replacement.mesh,pos(cell.r,cell.c),220);await settle();
  }catch(error){console.error("Hammer action failed:",error);say("حصلت مشكلة في المطرقة، جرّب تاني.");}
  finally{state.busy=false;updateHud();checkEnd();if(!state.won&&state.moves>0&&!hasPossibleMove())shuffle();saveProgress(state.won&&state.score>=state.target);}
}
function hasPossibleMove(){
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
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
  for(let attempt=0;attempt<80;attempt++){
    values=original.slice();
    for(let i=values.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
    for(let i=0;i<items.length;i++)items[i].type=values[i];
    if(findMatches().size===0&&hasPossibleMove()){playable=true;break;}
  }
  if(!playable){for(let i=0;i<items.length;i++)items[i].type=original[i];say("اللوحة فيها حركات متاحة بالفعل.");return;}
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    const it=state.grid[r][c];it.mesh.dispose();it.special=null;it.mesh=candyMesh(r,c,it.type,null);
  }
  say("اتخلطت الحلوى! تقدر تكمل اللعب.");
  saveProgress(false);
}
function nextLevel(){
  if(!state.won||state.score<state.target)return;
  state.lossHandled=false;state.level++;state.target=Math.round(state.target*1.22);state.moves=Math.max(18,25-Math.floor(state.level/4));state.score=0;state.won=false;state.hammer=3;state.extra=2;
  $("hammerBtn").querySelector("small").textContent=state.hammer;$("hammerBtn").disabled=false;
  $("movesBtn").querySelector("small").textContent=state.extra;$("movesBtn").disabled=false;
  $("resultButton").textContent="استمرار";$("queen").classList.remove("celebrate");
  $("resultModal").classList.add("hidden");$("nextBtn").disabled=true;
  for(const row of state.grid)for(const item of row)if(item?.mesh)item.mesh.dispose();
  state.grid=[];state.savedGrid=null;state.selected=null;updateHud();saveProgress(false);$("characterMessage").textContent="مستوى جديد وتحدٍ أكبر!";
  window.CMRShowWorldMap?.();
}

function refreshBoosterBadges(){
  const hammer=$("hammerBtn"),moves=$("movesBtn");
  if(hammer){hammer.querySelector("small").textContent=state.hammer;hammer.disabled=state.hammer<=0;}
  if(moves){moves.querySelector("small").textContent=state.extra;moves.disabled=state.extra<=0;}
}
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
  $("hammerBtn").addEventListener("click",()=>{if(state.won||state.hammer<=0)return;state.booster=state.booster==="hammer"?null:"hammer";$("hammerBtn").classList.toggle("active",state.booster==="hammer");say(state.booster?"اختار حلوى لإزالتها":"تم إلغاء المطرقة");});
  $("shuffleBtn").addEventListener("click",shuffle);
  $("movesBtn").addEventListener("click",()=>{if(state.won||state.extra<=0)return;state.extra--;state.moves+=5;refreshBoosterBadges();updateHud();saveProgress(false);say("+5 حركات إضافية!");});
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
  loadProgress();setupScene();buildGrid();bindUI();updateHud();startHeartClock();
  // Download the candy models progressively, one at a time, while the board is playable.
  void // Candy artwork is loaded lazily by the board materials; no GLB models are requested.
  refreshBoosterBadges();
  $("characterMessage").textContent="أهلاً بك! أنقذ مملكتي بالحلوى.";
  checkEnd();
  saveProgress(state.won&&state.score>=state.target);
}
let gameInitialized=false;
window.CMRStartSelectedHouse=async()=>{
  if(gameInitialized){
    state.won=false;state.busy=false;state.booster=null;state.savedGrid=null;
    $("resultModal").classList.add("hidden");$("nextBtn").disabled=true;
    buildGrid();updateHud();
    window.CMRHideWorldMap?.();return;
  }
  try{
    await start();
    gameInitialized=true;
    document.body.classList.add("game-started");
    window.CMRHideWorldMap?.();
  }catch(error){
    console.error(error);
    say("حصلت مشكلة أثناء تجهيز المرحلة، حاول تاني.");
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
  launch.addEventListener("click",launchAsGuest);
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
