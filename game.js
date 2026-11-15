(() => {
"use strict";
const SIZE=8, SPACING=1.02, TYPES=6, SAVE_KEY="cmr_reborn_v1";
const palette=[
  {name:"Ruby Heart",color:new BABYLON.Color3(.96,.12,.31)},
  {name:"Sun Drop",color:new BABYLON.Color3(1,.48,.055)},
  {name:"Star Sugar",color:new BABYLON.Color3(1,.79,.12)},
  {name:"Emerald Leaf",color:new BABYLON.Color3(.12,.78,.38)},
  {name:"Sky Diamond",color:new BABYLON.Color3(.12,.61,1)},
  {name:"Violet Jelly",color:new BABYLON.Color3(.68,.25,.96)}
];
const state={grid:[],score:0,target:1500,moves:25,level:1,coins:500,stars:0,selected:null,busy:false,won:false,booster:null,hammer:3,extra:2};
let engine,scene,camera,canvas,materials=[],toastTimer;
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
      ctx.drawImage(image,0,0);
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
      mat.opacityTexture=texture;
      mat.useAlphaFromDiffuseTexture=true;
    }catch(error){console.warn("Candy sprite texture failed:",key,error);}
  };
  image.onerror=()=>console.warn("Candy sprite unavailable:",src);
  image.src=src;
  return mat;
}
function candyMesh(r,c,type,special){
  const root=BABYLON.MeshBuilder.CreateSphere("candyCore_"+r+"_"+c,{diameter:special?.72:.69,segments:24},scene);
  const core=new BABYLON.StandardMaterial("candyCoreMat_"+type,scene);
  core.diffuseColor=palette[type-1].color.scale(.72);
  core.specularColor=new BABYLON.Color3(1,1,1);
  core.specularPower=150;
  core.emissiveColor=palette[type-1].color.scale(.12);
  root.material=core;
  root.scaling=new BABYLON.Vector3(1,.92,1);
  const spriteKey=special==="color"?"special1":special==="striped"?"special2":"basic"+type;
  const spriteSrc=special==="color"?"./assets/candy_special_1.jpg":special==="striped"?"./assets/candy_special_2.jpg":"./assets/candy_basic_"+type+".jpg";
  const face=BABYLON.MeshBuilder.CreatePlane("candyFace_"+r+"_"+c,{size:special?.98:1.02},scene);
  face.parent=root;
  face.position.z=-.30;
  face.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL;
  face.material=candySpriteMaterial(spriteKey,spriteSrc);
  face.isPickable=false;
  root.position=pos(r,c);
  root.metadata={r:r,c:c,candy:true};
  root.isPickable=true;
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
  engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,antialias:true});
  scene=new BABYLON.Scene(engine);scene.clearColor=new BABYLON.Color4(.12,.045,.22,1);
  camera=new BABYLON.ArcRotateCamera("royalCamera",-Math.PI/2,.88,13.2,new BABYLON.Vector3(0,0,0),scene);
  camera.lowerRadiusLimit=13.2;camera.upperRadiusLimit=13.2;camera.inputs.clear();camera.fov=.72;
  const hemi=new BABYLON.HemisphericLight("softbox",new BABYLON.Vector3(0,1,-.35),scene);hemi.intensity=1.05;
  const key=new BABYLON.DirectionalLight("candyKey",new BABYLON.Vector3(-.45,-1,.65),scene);key.position=new BABYLON.Vector3(-5,10,-7);key.intensity=1.15;
  const fill=new BABYLON.PointLight("pinkFill",new BABYLON.Vector3(4,4,-3),scene);fill.diffuse=new BABYLON.Color3(.75,.42,1);fill.intensity=.45;
  const glow=new BABYLON.GlowLayer("sugarGlow",scene);glow.intensity=.25;
  makeBoard();bindInput();
  engine.runRenderLoop(()=>scene.render());
  window.addEventListener("resize",()=>engine.resize());
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
function pickCell(){
  const pick=scene.pick(scene.pointerX,scene.pointerY,m=>m&&m.metadata&&m.metadata.candy);
  if(!pick||!pick.hit||!pick.pickedMesh)return null;
  const m=pick.pickedMesh;return {r:m.metadata.r,c:m.metadata.c};
}
function bindInput(){
  let down=null,downPoint=null;
  scene.onPointerObservable.add(info=>{
    if(state.busy||state.won)return;
    if(info.type===BABYLON.PointerEventTypes.POINTERDOWN){
      down=pickCell();downPoint={x:scene.pointerX,y:scene.pointerY};
    }else if(info.type===BABYLON.PointerEventTypes.POINTERUP&&down){
      const dx=scene.pointerX-downPoint.x,dy=scene.pointerY-downPoint.y;
      if(Math.hypot(dx,dy)>18){
        const dr=Math.abs(dy)>Math.abs(dx)?(dy>0?1:-1):0;
        const dc=dr===0?(dx>0?1:-1):0;
        const nr=down.r+dr,nc=down.c+dc;
        if(inBounds(nr,nc))swap(down,{r:nr,c:nc});
      }else{
        const up=pickCell();if(up)tapCell(up);
      }
      down=null;downPoint=null;
    }
  });
}
function inBounds(r,c){return r>=0&&r<SIZE&&c>=0&&c<SIZE;}
function tapCell(cell){
  if(state.booster==="hammer"){useHammer(cell);return;}
  if(!state.selected){select(cell);return;}
  const a=state.selected;clearSelection();
  if(a.r===cell.r&&a.c===cell.c){select(cell);return;}
  if(Math.abs(a.r-cell.r)+Math.abs(a.c-cell.c)===1)swap(a,cell);else select(cell);
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
  if(A.special||B.special){await activateSpecial(a,b);state.moves--;updateHud();await settle();state.busy=false;return;}
  if(findMatches().size===0){
    await Promise.all([animate(A.mesh,pos(a.r,a.c),140),animate(B.mesh,pos(b.r,b.c),140)]);
    state.grid[a.r][a.c]=A;state.grid[b.r][b.c]=B;
    A.mesh.metadata={r:a.r,c:a.c,candy:true};B.mesh.metadata={r:b.r,c:b.c,candy:true};
  }else{
    state.moves--;updateHud();await settle();
  }
  state.busy=false;checkEnd();
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
async function activateSpecial(a,b){
  const cells=new Set(),A=state.grid[a.r][a.c],B=state.grid[b.r][b.c];
  [A,B].forEach((it,i)=>{
    if(!it||!it.special)return;
    const at=i===0?b:a;
    if(it.special==="color"){const target=(i===0?B:A)?.type;for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(state.grid[r][c]&&state.grid[r][c].type===target)cells.add(r+","+c);}
    else if(it.special==="striped"){for(let k=0;k<SIZE;k++){cells.add(at.r+","+k);cells.add(k+","+at.c);}}
  });
  for(const key of cells){const p=key.split(",").map(Number);const it=state.grid[p[0]][p[1]];if(it){it.mesh.dispose();state.grid[p[0]][p[1]]=null;state.score+=60;}}
  updateHud();await wait(130);
}
async function settle(){
  let chain=0;
  while(true){
    const matches=findMatches();if(matches.size===0)break;
    chain++;
    const remove=Array.from(matches).map(s=>s.split(",").map(Number));
    const groupSpecial=matches.size>=5?"color":(matches.size>=4?"striped":null);
    let keep=null;
    if(groupSpecial&&chain===1){const mid=remove[Math.floor(remove.length/2)];keep={r:mid[0],c:mid[1]};}
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
    animate(p,target,250).then(()=>p.dispose());
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
    state.won=true;state.stars=Math.min(3,Math.max(1,Math.floor(state.score/state.target*3)));state.coins+=80;
    $("resultTitle").textContent="انتصار سحري!";$("resultText").textContent="أنقذت حدائق السكر وجمعت "+state.score+" نقطة.";
    $("resultModal").classList.remove("hidden");$("nextBtn").disabled=false;$("characterMessage").textContent="يا له من إنجاز رائع!";
    $("queen").classList.add("celebrate");saveProgress();
  }else if(state.moves<=0&&!state.won){
    $("resultTitle").textContent="حاول مرة أخرى";$("resultText").textContent="محتاج نقاط أكتر لإنقاذ الحديقة.";
    $("resultModal").classList.remove("hidden");$("resultButton").textContent="إعادة المحاولة";
  }
}
function saveProgress(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({level:state.level,coins:state.coins,stars:state.stars}));}catch(e){}}
function loadProgress(){try{const x=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");state.level=Math.max(1,x.level||1);state.coins=x.coins||500;state.stars=x.stars||0;}catch(e){}}
function restart(){state.score=0;state.moves=25;state.won=false;state.booster=null;clearSelection();$("resultModal").classList.add("hidden");$("nextBtn").disabled=true;buildGrid();updateHud();$("characterMessage").textContent="بدّل الحلوى واجمع 3 أو أكثر!";}
function useHammer(cell){
  const it=state.grid[cell.r][cell.c];if(!it)return;
  it.mesh.dispose();state.grid[cell.r][cell.c]=null;state.score+=100;state.hammer=Math.max(0,state.hammer-1);
  $("hammerBtn").querySelector("small").textContent=state.hammer;$("hammerBtn").disabled=state.hammer===0;
  state.booster=null;$("hammerBtn").classList.remove("active");
  state.busy=true;
  const replacement={type:rand(),special:null,mesh:null};
  replacement.mesh=candyMesh(cell.r,cell.c,replacement.type,null);
  replacement.mesh.position.y=5.5;state.grid[cell.r][cell.c]=replacement;
  animate(replacement.mesh,pos(cell.r,cell.c),220).then(()=>{state.busy=false;updateHud();checkEnd();});
}
function shuffle(){
  if(state.busy)return;const values=[];for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)values.push(state.grid[r][c].type);
  for(let i=values.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){const it=state.grid[r][c];it.mesh.dispose();it.type=values[r*SIZE+c];it.special=null;it.mesh=candyMesh(r,c,it.type,null);}
  state.selected=null;say("تم خلط الحلوى!");if(findMatches().size)settle();
}
function nextLevel(){
  state.level++;state.target=Math.round(state.target*1.22);state.moves=Math.max(18,25-Math.floor(state.level/4));state.score=0;state.won=false;
  $("resultModal").classList.add("hidden");$("nextBtn").disabled=true;buildGrid();updateHud();saveProgress();$("characterMessage").textContent="مستوى جديد وتحدٍ أكبر!";
}
function bindUI(){
  $("restartBtn").addEventListener("click",restart);
  $("nextBtn").addEventListener("click",nextLevel);
  $("resultButton").addEventListener("click",()=>{if(state.moves<=0&&state.score<state.target)restart();else nextLevel();});
  $("hammerBtn").addEventListener("click",()=>{if(state.hammer<=0)return;state.booster=state.booster==="hammer"?null:"hammer";$("hammerBtn").classList.toggle("active",state.booster==="hammer");say(state.booster?"اختار حلوى لإزالتها":"تم إلغاء المطرقة");});
  $("shuffleBtn").addEventListener("click",shuffle);
  $("movesBtn").addEventListener("click",()=>{if(state.extra<=0)return;state.extra--;state.moves+=5;$("movesBtn").querySelector("small").textContent=state.extra;$("movesBtn").disabled=state.extra===0;updateHud();say("+5 حركات إضافية!");});
  $("plusCoins").addEventListener("click",()=>say("العملات والمكافآت هتتفتح مع نظام المتجر."));
  $("soundBtn").addEventListener("click",()=>say("المؤثرات الصوتية قيد التجهيز."));
}
function start(){
  loadProgress();setupScene();buildGrid();bindUI();updateHud();
  $("hammerBtn").querySelector("small").textContent=state.hammer;$("movesBtn").querySelector("small").textContent=state.extra;
  $("hammerBtn").disabled=false;$("movesBtn").disabled=false;
  $("characterMessage").textContent="أهلاً بك! أنقذ مملكتي بالحلوى.";
}
window.addEventListener("DOMContentLoaded",()=>{
  try{start();}catch(error){console.error(error);$("loading").textContent="حصل خطأ في تشغيل اللعبة. حدّث الصفحة."; }
});
})();