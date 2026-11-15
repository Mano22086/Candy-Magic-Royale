(() => {
"use strict";
const SIZE=8, SPACING=1.02, TYPES=7, SAVE_KEY="cmr_reborn_v1";
const palette=[
  {name:"Ruby Heart",color:new BABYLON.Color3(.96,.12,.31)},
  {name:"Sun Drop",color:new BABYLON.Color3(1,.48,.055)},
  {name:"Star Sugar",color:new BABYLON.Color3(1,.79,.12)},
  {name:"Emerald Leaf",color:new BABYLON.Color3(.12,.78,.38)},
  {name:"Sky Diamond",color:new BABYLON.Color3(.12,.61,1)},
  {name:"Violet Jelly",color:new BABYLON.Color3(.68,.25,.96)},
  {name:"Plum Pop",color:new BABYLON.Color3(.52,.16,.68)}
];
const state={grid:[],score:0,target:1500,moves:25,level:1,coins:500,stars:0,selected:null,busy:false,won:false,booster:null,hammer:3,extra:2};
let engine,scene,camera,canvas,materials=[],coreMaterials=[],toastTimer;
const modelContainers={};
const modelFiles={1:"strawberry.glb",2:"mango.glb",3:"grapes.glb",4:"pineapple.glb",5:"pear.glb",6:"corn-cob.glb",7:"eggplant.glb"};
const MODEL_BASE="https://raw.githubusercontent.com/Mano22086/-/1ffd72fe8adf1bb784dc33c4ae02aae53ad8ce87/";
const $=id=>document.getElementById(id);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const rand=()=>Math.floor(Math.random()*TYPES)+1;
function say(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),1800);}
function pos(r,c){return new BABYLON.Vector3((c-3.5)*SPACING,.55,(r-3.5)*SPACING);}
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
      const scale=.72/(Math.max(extent.x,extent.y,extent.z)||1);
      modelRoot.position=center.scale(-1);
      modelRoot.scaling.setAll(scale);
    }
    root.position=pos(r,c);root.metadata={r,c,candy:true};root.isPickable=false;
    root.scaling.setAll(special?.94:1);
    root.metadata.animationGroups=entries.animationGroups||[];
    return root;
  }
  const root=BABYLON.MeshBuilder.CreateSphere("candyCore_"+r+"_"+c,{diameter:special?.72:.69,segments:24},scene);
  if(!coreMaterials[type]){
    const core=new BABYLON.StandardMaterial("candyCoreMat_"+type,scene);
    core.diffuseColor=palette[type-1].color.scale(.72);
    core.specularColor=new BABYLON.Color3(1,1,1);core.specularPower=150;
    core.emissiveColor=palette[type-1].color.scale(.12);coreMaterials[type]=core;
  }
  root.material=coreMaterials[type];root.scaling=new BABYLON.Vector3(1,.92,1);
  const spriteKey=special==="color"?"special1":special==="striped"?"special2":"basic"+Math.min(type,6);
  const spriteSrc=special==="color"?"./assets/candy_special_1.jpg":special==="striped"?"./assets/candy_special_2.jpg":"./assets/candy_basic_"+Math.min(type,6)+".jpg";
  const face=BABYLON.MeshBuilder.CreatePlane("candyFace_"+r+"_"+c,{size:special?.88:.82},scene);
  face.parent=root;face.position.z=-.34;face.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL;
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
function makeBoard(){
  const base=BABYLON.MeshBuilder.CreateBox("royalBoard",{width:8.45,height:.38,depth:8.45},scene);
  base.position.y=-.17;
  const bm=new BABYLON.StandardMaterial("boardMat",scene);bm.diffuseColor=new BABYLON.Color3(.19,.08,.34);bm.specularColor=new BABYLON.Color3(.7,.45,.9);bm.specularPower=80;base.material=bm;
  const edge=BABYLON.MeshBuilder.CreateBox("goldEdge",{width:8.55,height:.13,depth:8.55},scene);edge.position.y=-.37;
  const em=new BABYLON.StandardMaterial("goldEdgeMat",scene);em.diffuseColor=new BABYLON.Color3(.82,.48,.96);em.emissiveColor=new BABYLON.Color3(.12,.04,.2);edge.material=em;
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    const tile=BABYLON.MeshBuilder.CreateBox("tile"+r+"_"+c,{width:.96,height:.12,depth:.96},scene);
    tile.position=new BABYLON.Vector3((c-3.5)*SPACING,.08,(r-3.5)*SPACING);
    const tm=new BABYLON.StandardMaterial("tileMat"+r+c,scene);
    tm.diffuseColor=((r+c)%2===0)?new BABYLON.Color3(.35,.19,.55):new BABYLON.Color3(.27,.13,.45);
    tm.specularColor=new BABYLON.Color3(.5,.35,.7);tm.specularPower=40;tile.material=tm;tile.isPickable=false;
  }
}
function setupScene(){
  canvas=$("renderCanvas");
  engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,antialias:true},true);
  scene=new BABYLON.Scene(engine);scene.clearColor=new BABYLON.Color4(.10,.025,.19,1);
  scene.imageProcessingConfiguration.toneMappingEnabled=true;
  scene.imageProcessingConfiguration.toneMappingType=BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
  scene.imageProcessingConfiguration.exposure=1.08;
  scene.imageProcessingConfiguration.contrast=1.12;
  camera=new BABYLON.ArcRotateCamera("royalCamera",-Math.PI/2,.02,14.6,new BABYLON.Vector3(0,0,0),scene);
  camera.mode=BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
  camera.orthoLeft=-5;camera.orthoRight=5;camera.orthoTop=5;camera.orthoBottom=-5;
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
  state.grid=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    const type=randomType(r,c);state.grid[r][c]={type:type,special:null,mesh:candyMesh(r,c,type,null)};
  }
}
function gridPointAtClient(clientX,clientY){
  const rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return null;
  const x=(clientX-rect.left)*(engine.getRenderWidth()/rect.width);
  const y=(clientY-rect.top)*(engine.getRenderHeight()/rect.height);
  const ray=scene.createPickingRay(x,y,BABYLON.Matrix.Identity(),camera,false);
  const distance=ray.intersectsPlane(new BABYLON.Plane(0,1,0,-.55));
  if(distance===null||distance<0)return null;
  const point=ray.origin.add(ray.direction.scale(distance));
  return {r:Math.floor((point.z+SIZE*SPACING/2)/SPACING),c:Math.floor((point.x+SIZE*SPACING/2)/SPACING)};
}
function pickCellAtClient(clientX,clientY){
  const cell=gridPointAtClient(clientX,clientY);
  return cell&&inBounds(cell.r,cell.c)?cell:null;
}
function bindInput(){
  let down=null,downPoint=null,pointerId=null;
  const reset=()=>{down=null;downPoint=null;pointerId=null;};
  canvas.addEventListener("pointerdown",event=>{
    if(state.busy||state.won)return;
    if(event.pointerType==="mouse"&&event.button!==0)return;
    event.preventDefault();
    pointerId=event.pointerId;
    down=pickCellAtClient(event.clientX,event.clientY);
    downPoint={x:event.clientX,y:event.clientY};
    try{canvas.setPointerCapture(event.pointerId);}catch(_){}
  },{passive:false});
  canvas.addEventListener("pointerup",event=>{
    if(event.pointerId!==pointerId)return;
    event.preventDefault();
    if(!down){reset();return;}
    if(state.busy||state.won){reset();return;}
    const dx=event.clientX-downPoint.x,dy=event.clientY-downPoint.y;
    const distance=Math.hypot(dx,dy);
    const up=pickCellAtClient(event.clientX,event.clientY);
    if(state.booster==="hammer"){
      if(up)useHammer(up);
      else say("المطرقة: اضغط على حلوى داخل اللوحة");
    }else if(distance>10){
      if(up&&Math.abs(up.r-down.r)+Math.abs(up.c-down.c)===1){
        void swap(down,up);
      }else{
        say(up?"اسحب قطعة واحدة فقط إلى خانة مجاورة":"خلي السحب داخل لوحة الحلوى");
      }
    }else{
      say("اسحب الحلوى لخانة مجاورة للتبديل");
    }
    reset();
  },{passive:false});
  canvas.addEventListener("pointercancel",reset,{passive:true});
  canvas.addEventListener("lostpointercapture",reset,{passive:true});
  window.addEventListener("blur",reset);
}
function inBounds(r,c){return r>=0&&r<SIZE&&c>=0&&c<SIZE;}
function tapCell(cell){
  if(state.booster==="hammer"){useHammer(cell);return;}
  say("اسحب الحلوى لخانة مجاورة للتبديل");
}
function select(cell){
  state.selected=cell;const item=state.grid[cell.r][cell.c];if(item&&item.mesh){item.mesh.scaling.scaleInPlace(1.12);}
}
function clearSelection(){
  if(state.selected){const it=state.grid[state.selected.r][state.selected.c];if(it&&it.mesh)it.mesh.scaling.set(1,1,1);}
  state.selected=null;
}
async function swap(a,b){
  if(state.busy||!inBounds(b.r,b.c))return;
  const A=state.grid[a.r][a.c],B=state.grid[b.r][b.c];if(!A||!B)return;
  state.busy=true;
  const ap=pos(b.r,b.c),bp=pos(a.r,a.c);
  await Promise.all([animate(A.mesh,ap,150),animate(B.mesh,bp,150)]);
  state.grid[a.r][a.c]=B;state.grid[b.r][b.c]=A;
  A.mesh.metadata={r:b.r,c:b.c,candy:true};B.mesh.metadata={r:a.r,c:a.c,candy:true};
  if(A.special||B.special){await activateSpecial(a,b);state.moves--;updateHud();await settle();state.busy=false;checkEnd();return;}
  if(findMatches().size===0){
    await Promise.all([animate(A.mesh,pos(a.r,a.c),140),animate(B.mesh,pos(b.r,b.c),140)]);
    state.grid[a.r][a.c]=A;state.grid[b.r][b.c]=B;
    A.mesh.metadata={r:a.r,c:a.c,candy:true};B.mesh.metadata={r:b.r,c:b.c,candy:true};
  }else{
    state.moves--;updateHud();await settle();
  }
  state.busy=false;checkEnd();
  if(!state.won&&state.moves>0&&!hasPossibleMove())shuffle();
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
function checkEnd(){
  if(state.score>=state.target&&!state.won){
    state.won=true;const earnedStars=state.score>=state.target*2?3:(state.score>=state.target*1.5?2:1);state.stars+=earnedStars;state.coins+=80;updateHud();
    $("resultTitle").textContent="انتصار سحري!";
    $("resultModal").classList.remove("hidden");$("nextBtn").disabled=false;$("characterMessage").textContent="يا له من إنجاز رائع!";$("resultText").textContent="أنقذت حدائق السكر وجمعت "+state.score+" نقطة، وحصلت على "+earnedStars+" نجوم.";
    $("queen").classList.add("celebrate");saveProgress(true);
  }else if(state.moves<=0&&!state.won){
    state.won=true;
    $("resultTitle").textContent="حاول مرة أخرى";$("resultText").textContent="محتاج نقاط أكتر لإنقاذ الحديقة.";
    $("resultModal").classList.remove("hidden");$("resultButton").textContent="إعادة المحاولة";
    $("characterMessage").textContent="متستسلمش، جرب تاني!";
  }
}
function saveProgress(completed=false){try{localStorage.setItem(SAVE_KEY,JSON.stringify({level:state.level,target:state.target,moves:state.moves,coins:state.coins,stars:state.stars,completed}));}catch(e){}}
function loadProgress(){try{
  const x=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");
  const savedLevel=Math.max(1,Number(x.level)||1);
  state.level=savedLevel+(x.completed?1:0);
  const savedTarget=Math.max(1500,Number(x.target)||Math.round(1500*Math.pow(1.22,savedLevel-1)));
  state.target=x.completed?Math.round(savedTarget*1.22):savedTarget;
  state.moves=x.completed?Math.max(18,25-Math.floor(state.level/4)):Math.max(18,Number(x.moves)||Math.max(18,25-Math.floor(state.level/4)));
  state.coins=Number.isFinite(Number(x.coins))?Number(x.coins):500;
  state.stars=Math.max(0,Number(x.stars)||0);
}catch(e){state.level=1;state.target=1500;state.moves=25;state.coins=500;state.stars=0;}}
function restart(){if(state.busy)return;state.score=0;state.moves=Math.max(18,25-Math.floor(state.level/4));state.won=false;state.booster=null;
  $("resultButton").textContent="استمرار";$("queen").classList.remove("celebrate");clearSelection();$("resultModal").classList.add("hidden");$("nextBtn").disabled=true;buildGrid();updateHud();$("characterMessage").textContent="بدّل الحلوى واجمع 3 أو أكثر!";}
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
  $("movesBtn").addEventListener("click",()=>{if(state.won||state.extra<=0)return;state.extra--;state.moves+=5;$("movesBtn").querySelector("small").textContent=state.extra;$("movesBtn").disabled=state.extra===0;updateHud();say("+5 حركات إضافية!");});
  $("plusCoins").addEventListener("click",()=>say("العملات والمكافآت هتتفتح مع نظام المتجر."));
  $("soundBtn").addEventListener("click",()=>say("المؤثرات الصوتية قيد التجهيز."));
}
async function start(){
  loadProgress();setupScene();await loadCandyModels();buildGrid();bindUI();updateHud();
  $("hammerBtn").querySelector("small").textContent=state.hammer;$("movesBtn").querySelector("small").textContent=state.extra;
  $("hammerBtn").disabled=false;$("movesBtn").disabled=false;
  $("characterMessage").textContent="أهلاً بك! أنقذ مملكتي بالحلوى.";
}
window.addEventListener("DOMContentLoaded",()=>{
  const launch=$("startGameBtn"),screen=$("startScreen");
  launch.addEventListener("click",()=>{
    if(launch.disabled)return;
    launch.disabled=true;launch.textContent="جاري فتح المملكة...";
    start().then(()=>{
      screen.classList.add("start-screen-leaving");
      document.body.classList.add("game-started");
      setTimeout(()=>screen.remove(),520);
    }).catch(error=>{
      console.error(error);launch.disabled=false;launch.textContent="حاول مرة أخرى";
    });
  });
});
})();