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
const state={grid:[],savedGrid:null,score:0,target:1500,moves:25,level:1,coins:500,stars:0,selected:null,busy:false,won:false,booster:null,hammer:3,extra:2};
let engine,scene,camera,canvas,materials=[],coreMaterials=[],toastTimer,boardBaseMesh,backgroundVideoLayer;
const modelContainers={};
const modelFiles={1:"strawberry.glb",2:"mango.glb",3:"grapes.glb",4:"pineapple.glb",5:"pear.glb",6:"corn-cob.glb",7:"eggplant.glb"};
const MODEL_BASE="https://raw.githubusercontent.com/Mano22086/-/main/";
const $=id=>document.getElementById(id);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const rand=()=>Math.floor(Math.random()*TYPES)+1;
function say(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),1800);}
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
const spriteMaterials={};
function candySpriteMaterial(key,src){
  if(spriteMaterials[key])return spriteMaterials[key];
  const mat=new BABYLON.StandardMaterial("candySpriteMat_"+key,scene);
  mat.diffuseColor=new BABYLON.Color3(1,1,1);
  mat.emissiveColor=new BABYLON.Color3(.92,.92,1);
  mat.disableLighting=true;
  mat.backFaceCulling=false;
  mat.useAlphaFromDiffuseTexture=true;
  mat.transparencyMode=BABYLON.Material.MATERIAL_ALPHABLEND;
  spriteMaterials[key]=mat;
  const image=new Image();
  image.onload=()=>{
    try{
      const canvas=document.createElement("canvas");
      canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      const ctx=canvas.getContext("2d",{willReadFrequently:true});
      ctx.drawImage(image,8,6,image.width-16,image.height-12,0,0,canvas.width,canvas.height);
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
      const data=pixels.data;
      const bgR=data[0],bgG=data[1],bgB=data[2];
      for(let i=0;i<data.length;i+=4){
        const dr=data[i]-bgR,dg=data[i+1]-bgG,db=data[i+2]-bgB;
        const distance=Math.sqrt(dr*dr+dg*dg+db*db);
        if(distance<34)data[i+3]=0;
        else if(distance<74)data[i+3]=Math.round(data[i+3]*(distance-34)/40);
      }
      ctx.putImageData(pixels,0,0);
      const texture=new BABYLON.DynamicTexture("candySpriteTex_"+key,{width:canvas.width,height:canvas.height},scene,false);
      texture.hasAlpha=true;texture.getContext().drawImage(canvas,0,0);texture.update(true);
      mat.diffuseTexture=texture;
      mat.useAlphaFromDiffuseTexture=true;
    }catch(error){console.warn("Candy sprite texture failed:",key,error);}
  };
  image.onerror=()=>console.warn("Candy sprite unavailable:",src);
  image.src=src;
  return mat;
}
function candyMesh(r,c,type,special){
  const container=modelContainers[type];
  if(container){
    const root=new BABYLON.TransformNode("candyRoot_"+r+"_"+c,scene);
    const modelRoot=new BABYLON.TransformNode("candyModel_"+r+"_"+c,scene);
    modelRoot.parent=root;
    const entries=container.instantiateModelsToScene(name=>name+"_"+r+"_"+c,false);
    entries.rootNodes.forEach(node=>{node.parent=modelRoot;});
    const meshes=[];
    const collect=node=>{
      if(node.getClassName&&node.getClassName()==="Mesh")meshes.push(node);
      (node.getChildren?node.getChildren():[]).forEach(collect);
    };
    entries.rootNodes.forEach(collect);
    meshes.forEach(mesh=>{mesh.isPickable=true;mesh.metadata={r,c,candy:true};});
    modelRoot.computeWorldMatrix(true);
    if(meshes.length){
      const bounds=modelRoot.getHierarchyBoundingVectors(true);
      const center=bounds.min.add(bounds.max).scale(.5);
      const extent=bounds.max.subtract(bounds.min);
      const scale=.94/(Math.max(extent.x,extent.y,extent.z)||1);
      modelRoot.position=center.scale(-1);
      modelRoot.scaling.setAll(scale);
    }
    root.position=pos(r,c);root.metadata={r,c,candy:true};root.isPickable=false;
    root.scaling.setAll(special?.94:1);
    if(special){
      const ringMat=new BABYLON.StandardMaterial("specialRingMat_"+r+"_"+c,scene);
      ringMat.diffuseColor=special==="wrapped"?new BABYLON.Color3(1,.72,.18):special==="color"?new BABYLON.Color3(.9,.55,1):new BABYLON.Color3(.25,.9,1);
      ringMat.emissiveColor=ringMat.diffuseColor.scale(.75);
      ringMat.specularColor=new BABYLON.Color3(1,1,1);
      const ring=BABYLON.MeshBuilder.CreateTorus("specialRing_"+r+"_"+c,{diameter:.92,thickness:.075,tessellation:32},scene);
      ring.parent=root;ring.rotation.x=Math.PI/2;ring.position.y=.12;ring.material=ringMat;ring.isPickable=false;
      if(special==="wrapped"){
        const second=BABYLON.MeshBuilder.CreateTorus("wrappedRibbon_"+r+"_"+c,{diameter:.92,thickness:.065,tessellation:32},scene);
        second.parent=root;second.rotation.set(Math.PI/2,0,.72);second.position.y=.12;second.material=ringMat;second.isPickable=false;
      }
    }
    root.metadata.animationGroups=entries.animationGroups||[];
    return root;
  }
  const root=BABYLON.MeshBuilder.CreateSphere("candyCore_"+r+"_"+c,{diameter:special?.88:.86,segments:32},scene);
  if(!coreMaterials[type]){
    const core=new BABYLON.StandardMaterial("candyCoreMat_"+type,scene);
    core.diffuseColor=palette[type-1].color.scale(.72);
    core.specularColor=new BABYLON.Color3(1,1,1);core.specularPower=150;
    core.emissiveColor=palette[type-1].color.scale(.12);coreMaterials[type]=core;
  }
  root.material=coreMaterials[type];root.scaling=new BABYLON.Vector3(1,.92,1);
  const spriteKey=special==="color"?"special1":special==="striped"?"special2":special==="wrapped"?"special3":"basic"+Math.min(type,6);
  const spriteSrc=special==="color"?"./assets/candy_special_1.jpg":special==="striped"?"./assets/candy_special_2.jpg":special==="wrapped"?"./assets/candy_special_3.jpg":"./assets/candy_basic_"+Math.min(type,6)+".jpg";
  const face=BABYLON.MeshBuilder.CreatePlane("candyFace_"+r+"_"+c,{size:special?.98:.96},scene);
  face.parent=root;face.position.z=-.43;face.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL;
  face.material=candySpriteMaterial(spriteKey,spriteSrc);face.isPickable=false;
  root.position=pos(r,c);root.metadata={r,c,candy:true};root.isPickable=true;
  return root;
}
async function loadCandyModels(){
  await Promise.all(Object.entries(modelFiles).map(async([type,file])=>{
    try{
      modelContainers[type]=await BABYLON.SceneLoader.LoadAssetContainerAsync(MODEL_BASE,file,scene,"",".glb");
      console.info("Loaded 3D candy:",file);
    }catch(error){console.warn("3D candy load failed; fallback active:",file,error);}
  }));
  say("تم تحميل "+Object.keys(modelContainers).length+" من 7 مجسمات 3D");
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
  canvas=$("renderCanvas");
  engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,antialias:true},false);
  // Keep mobile rendering sharp while capping internal resolution at 1.5x CSS pixels.
  const deviceRatio=Math.max(1,window.devicePixelRatio||1);
  engine.setHardwareScalingLevel(Math.max(1/deviceRatio,1/1.5));
  scene=new BABYLON.Scene(engine);scene.clearColor=new BABYLON.Color4(0,0,0,0);
  scene.skipPointerMovePicking=true;
  scene.imageProcessingConfiguration.toneMappingEnabled=true;
  scene.imageProcessingConfiguration.toneMappingType=BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
  scene.imageProcessingConfiguration.exposure=1.08;
  scene.imageProcessingConfiguration.contrast=1.12;
  camera=new BABYLON.ArcRotateCamera("royalCamera",-Math.PI/2,.02,14.6,new BABYLON.Vector3(0,0,0),scene);
  camera.mode=BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
  camera.orthoLeft=-3.7;camera.orthoRight=3.7;camera.orthoTop=3.7;camera.orthoBottom=-3.7;
  camera.lowerRadiusLimit=14.6;camera.upperRadiusLimit=14.6;camera.inputs.clear();camera.minZ=.1;camera.maxZ=100;
  const hemi=new BABYLON.HemisphericLight("softbox",new BABYLON.Vector3(0,1,-.35),scene);hemi.intensity=1.05;
  const key=new BABYLON.DirectionalLight("candyKey",new BABYLON.Vector3(-.45,-1,.65),scene);key.position=new BABYLON.Vector3(-5,10,-7);key.intensity=1.15;
  const fill=new BABYLON.PointLight("pinkFill",new BABYLON.Vector3(4,4,-3),scene);fill.diffuse=new BABYLON.Color3(.75,.42,1);fill.intensity=.45;
  const glow=new BABYLON.GlowLayer("sugarGlow",scene);glow.intensity=.34;
  makeBoard();bindInput();
  engine.runRenderLoop(()=>scene.render());
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
function gridPointAtClient(clientX,clientY){
  const rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return null;
  const nx=(clientX-rect.left)/rect.width;
  const ny=(clientY-rect.top)/rect.height;
  // The orthographic camera shows a 7.4 x 7.4 world area.
  // The 7x7 candy grid occupies the centered 7.14 x 7.14 area.
  const worldX=(nx-.5)*7.4;
  const worldZ=(.5-ny)*7.4;
  const half=SIZE*SPACING/2;
  if(worldX < -half || worldX >= half || worldZ < -half || worldZ >= half)return null;
  const c=Math.floor((worldX+half)/SPACING);
  const r=Math.floor((half-worldZ)/SPACING);
  return {r,c};
}
function pickCellAtClient(clientX,clientY){
  const cell=gridPointAtClient(clientX,clientY);
  return cell&&inBounds(cell.r,cell.c)?cell:null;
}
function bindInput(){
  let gesture=null;
  const reset=()=>{gesture=null;};
  const threshold=()=>{
    const rect=canvas.getBoundingClientRect();
    return Math.max(10,Math.min(rect.width/SIZE,rect.height/SIZE)*.16);
  };
  const chooseNeighbour=(cell,dx,dy)=>{
    if(Math.abs(dx)>=Math.abs(dy)){
      return {r:cell.r,c:cell.c+(dx>=0?1:-1)};
    }
    return {r:cell.r+(dy>=0?1:-1),c:cell.c};
  };
  canvas.style.touchAction="none";
  canvas.addEventListener("contextmenu",event=>event.preventDefault());
  canvas.addEventListener("pointerdown",event=>{
    if(state.busy||state.won||gesture)return;
    if(event.pointerType==="mouse"&&event.button!==0)return;
    const cell=pickCellAtClient(event.clientX,event.clientY);
    if(!cell)return;
    event.preventDefault();
    gesture={pointerId:event.pointerId,startCell:cell,startX:event.clientX,startY:event.clientY};
    try{canvas.setPointerCapture(event.pointerId);}catch(_){}
  },{passive:false});
  canvas.addEventListener("pointerup",event=>{
    if(!gesture||event.pointerId!==gesture.pointerId)return;
    event.preventDefault();
    const g=gesture;
    gesture=null;
    if(state.busy||state.won)return;
    const dx=event.clientX-g.startX,dy=event.clientY-g.startY;
    const distance=Math.hypot(dx,dy);
    const endCell=pickCellAtClient(event.clientX,event.clientY);
    if(distance<threshold()){
      tapCell(g.startCell);
      return;
    }
    let next=null;
    if(endCell&&Math.abs(endCell.r-g.startCell.r)+Math.abs(endCell.c-g.startCell.c)===1){
      next=endCell;
    }else{
      next=chooseNeighbour(g.startCell,dx,dy);
    }
    if(inBounds(next.r,next.c)){
      clearSelection();
      void swap(g.startCell,next);
    }
  },{passive:false});
  canvas.addEventListener("pointercancel",reset,{passive:true});
  canvas.addEventListener("lostpointercapture",reset,{passive:true});
  window.addEventListener("blur",reset);
}
function inBounds(r,c){return r>=0&&r<SIZE&&c>=0&&c<SIZE;}
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
  if(item?.mesh)item.mesh.scaling.setAll((item.special?.94:1)*1.1);
}
function clearSelection(){
  if(state.selected){
    const it=state.grid[state.selected.r][state.selected.c];
    if(it?.mesh)it.mesh.scaling.setAll(it.special?.94:1);
  }
  state.selected=null;
}
async function swap(a,b){
  if(state.busy||!inBounds(a.r,a.c)||!inBounds(b.r,b.c))return;
  if(Math.abs(a.r-b.r)+Math.abs(a.c-b.c)!==1)return;
  const A=state.grid[a.r][a.c],B=state.grid[b.r][b.c];if(!A||!B)return;
  state.busy=true;
  clearSelection();
  const ap=pos(b.r,b.c),bp=pos(a.r,a.c);
  await Promise.all([animate(A.mesh,ap,150),animate(B.mesh,bp,150)]);
  state.grid[a.r][a.c]=B;state.grid[b.r][b.c]=A;
  A.mesh.metadata={r:b.r,c:b.c,candy:true};B.mesh.metadata={r:a.r,c:a.c,candy:true};
  if(A.special||B.special){await activateSpecial(a,b);state.moves--;updateHud();await settle();state.busy=false;checkEnd();saveProgress(state.won&&state.score>=state.target);return;}
  if(findMatches().size===0){
    await Promise.all([animate(A.mesh,pos(a.r,a.c),140),animate(B.mesh,pos(b.r,b.c),140)]);
    state.grid[a.r][a.c]=A;state.grid[b.r][b.c]=B;
    A.mesh.metadata={r:a.r,c:a.c,candy:true};B.mesh.metadata={r:b.r,c:b.c,candy:true};
  }else{
    state.moves--;updateHud();await settle();
  }
  state.busy=false;checkEnd();
  if(!state.won&&state.moves>0&&!hasPossibleMove())shuffle();
  saveProgress(state.won&&state.score>=state.target);
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
  // A T/L intersection of two runs (3+ in each direction) creates a wrapped candy.
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
  for(let r=0;r<SIZE;r++){
    let run=[];
    for(let c=0;c<=SIZE;c++){
      if(c<SIZE&&matches.has(r+","+c)){run.push({r,c});}
      else{consider(run,run.length>=5?"color":"striped");run=[];}
    }
  }
  for(let c=0;c<SIZE;c++){
    let run=[];
    for(let r=0;r<=SIZE;r++){
      if(r<SIZE&&matches.has(r+","+c)){run.push({r,c});}
      else{consider(run,run.length>=5?"color":"striped");run=[];}
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
  while(true){
    const matches=findMatches();if(matches.size===0)break;
    chain++;
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
  if(chain>1)say("سلسلة سحرية ×"+chain+"!");
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
  $("score").textContent=state.score.toLocaleString("en-US");$("moves").textContent=state.moves;
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
    state.won=true;const earnedStars=state.score>=state.target*2?3:(state.score>=state.target*1.5?2:1);state.stars+=earnedStars;state.coins+=80;updateHud();
    $("resultTitle").textContent="انتصار سحري!";
    $("resultModal").classList.remove("hidden");$("nextBtn").disabled=false;$("characterMessage").textContent="يا له من إنجاز رائع!";$("resultText").textContent="أنقذت حدائق السكر وجمعت "+state.score+" نقطة، وحصلت على "+earnedStars+" نجوم.";
    triggerCharacterResult(true);saveProgress(true);
  }else if(state.moves<=0&&!state.won){
    state.won=true;
    $("resultTitle").textContent="حاول مرة أخرى";$("resultText").textContent="محتاج نقاط أكتر لإنقاذ الحديقة.";
    $("resultModal").classList.remove("hidden");$("resultButton").textContent="إعادة المحاولة";
    $("characterMessage").textContent="متستسلمش، جرب تاني!";\n    triggerCharacterResult(false);
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
  localStorage.setItem(SAVE_KEY,JSON.stringify({playerId:identity.id,provider:identity.provider,level:state.level,target:state.target,moves:state.moves,score:state.score,coins:state.coins,stars:state.stars,hammer:state.hammer,extra:state.extra,grid,completed}));
}catch(e){}}
function loadProgress(){try{
  const x=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");
  const completed=!!x.completed;
  const savedLevel=Math.max(1,Math.floor(Number(x.level)||1));
  state.level=savedLevel+(completed?1:0);
  const savedTarget=Math.max(1500,Number(x.target)||Math.round(1500*Math.pow(1.22,savedLevel-1)));
  state.target=completed?Math.round(savedTarget*1.22):savedTarget;
  const defaultMoves=Math.max(18,25-Math.floor(state.level/4));
  state.moves=completed?defaultMoves:(x.moves!==undefined&&Number.isFinite(Number(x.moves))?Math.max(0,Math.floor(Number(x.moves))):defaultMoves);
  state.score=completed?0:Math.max(0,Math.floor(Number(x.score)||0));
  state.coins=Number.isFinite(Number(x.coins))?Number(x.coins):500;
  state.stars=Math.max(0,Math.floor(Number(x.stars)||0));
  const hammerValue=Number(x.hammer),extraValue=Number(x.extra);
  state.hammer=completed?3:(Number.isFinite(hammerValue)?Math.min(3,Math.max(0,Math.floor(hammerValue))):3);
  state.extra=completed?2:(Number.isFinite(extraValue)?Math.min(2,Math.max(0,Math.floor(extraValue))):2);
  const validGrid=Array.isArray(x.grid)&&x.grid.length===SIZE&&x.grid.every(row=>Array.isArray(row)&&row.length===SIZE&&row.every(cell=>cell&&Number.isInteger(cell.type)&&cell.type>=1&&cell.type<=TYPES&&(cell.special===null||cell.special==="color"||cell.special==="striped"||cell.special==="wrapped")));
  state.savedGrid=!completed&&validGrid?x.grid.map(row=>row.map(cell=>({type:cell.type,special:cell.special||null}))):null;
}catch(e){state.level=1;state.target=1500;state.moves=25;state.score=0;state.coins=500;state.stars=0;state.hammer=3;state.extra=2;state.savedGrid=null;}}
function restart(){if(state.busy)return;state.score=0;state.moves=Math.max(18,25-Math.floor(state.level/4));state.won=false;state.booster=null;
  $("resultButton").textContent="استمرار";$("queen").classList.remove("celebrate");clearSelection();$("resultModal").classList.add("hidden");$("nextBtn").disabled=true;buildGrid();updateHud();saveProgress(false);$("characterMessage").textContent="بدّل الحلوى واجمع 3 أو أكثر!";}
async function useHammer(cell){
  if(state.won)return;
  const it=state.grid[cell.r][cell.c];if(!it||state.busy)return;
  state.busy=true;clearSelection();
  burstAt(it.mesh.position,it.type);it.mesh.dispose();state.grid[cell.r][cell.c]=null;
  state.score+=100;state.moves=Math.max(0,state.moves-1);state.hammer=Math.max(0,state.hammer-1);
  $("hammerBtn").querySelector("small").textContent=state.hammer;$("hammerBtn").disabled=state.hammer===0;
  state.booster=null;$("hammerBtn").classList.remove("active");
  const replacement={type:rand(),special:null,mesh:null};
  replacement.mesh=candyMesh(cell.r,cell.c,replacement.type,null);
  replacement.mesh.position.y=5.5;state.grid[cell.r][cell.c]=replacement;
  await animate(replacement.mesh,pos(cell.r,cell.c),220);
  await settle();
  state.busy=false;updateHud();checkEnd();
  if(!state.won&&state.moves>0&&!hasPossibleMove())shuffle();
  saveProgress(state.won&&state.score>=state.target);
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
  state.level++;state.target=Math.round(state.target*1.22);state.moves=Math.max(18,25-Math.floor(state.level/4));state.score=0;state.won=false;state.hammer=3;state.extra=2;
  $("hammerBtn").querySelector("small").textContent=state.hammer;$("hammerBtn").disabled=false;
  $("movesBtn").querySelector("small").textContent=state.extra;$("movesBtn").disabled=false;
  $("resultButton").textContent="استمرار";$("queen").classList.remove("celebrate");
  $("resultModal").classList.add("hidden");$("nextBtn").disabled=true;buildGrid();updateHud();saveProgress(false);$("characterMessage").textContent="مستوى جديد وتحدٍ أكبر!";
}
function bindUI(){
  $("restartBtn").addEventListener("click",restart);
  $("nextBtn").addEventListener("click",nextLevel);
  $("resultButton").addEventListener("click",()=>{if(state.moves<=0&&state.score<state.target)restart();else nextLevel();});
  $("hammerBtn").addEventListener("click",()=>{if(state.won||state.hammer<=0)return;state.booster=state.booster==="hammer"?null:"hammer";$("hammerBtn").classList.toggle("active",state.booster==="hammer");say(state.booster?"اختار حلوى لإزالتها":"تم إلغاء المطرقة");});
  $("shuffleBtn").addEventListener("click",shuffle);
  $("movesBtn").addEventListener("click",()=>{if(state.won||state.extra<=0)return;state.extra--;state.moves+=5;$("movesBtn").querySelector("small").textContent=state.extra;$("movesBtn").disabled=state.extra===0;updateHud();saveProgress(false);say("+5 حركات إضافية!");});
  $("plusCoins").addEventListener("click",()=>say("العملات والمكافآت هتتفتح مع نظام المتجر."));
  $("soundBtn").addEventListener("click",()=>say("المؤثرات الصوتية قيد التجهيز."));
}
async function start(){
  loadProgress();setupScene();await loadCandyModels();buildGrid();bindUI();updateHud();
  $("hammerBtn").querySelector("small").textContent=state.hammer;$("movesBtn").querySelector("small").textContent=state.extra;
  $("hammerBtn").disabled=state.hammer===0;$("movesBtn").disabled=state.extra===0;
  $("characterMessage").textContent="أهلاً بك! أنقذ مملكتي بالحلوى.";
  checkEnd();
  saveProgress(state.won&&state.score>=state.target);
}
window.addEventListener("DOMContentLoaded",()=>{
  const launch=$("startGameBtn"),screen=$("startScreen"),facebookModal=$("facebookModal");
  let launching=false;
  const launchAsGuest=()=>{
    if(launching)return;
    launching=true;
    ensureGuestIdentity();
    launch.disabled=true;launch.textContent="جاري فتح المملكة...";
    screen.classList.add("start-screen-leaving");
    setTimeout(()=>start().then(()=>{
      document.body.classList.add("game-started");
      screen.remove();
    }).catch(error=>{
      console.error(error);launching=false;launch.disabled=false;launch.textContent="العب كضيف";
      screen.classList.remove("start-screen-leaving");
      say("حصلت مشكلة أثناء فتح اللعبة، حاول تاني.");
    }),520);
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
