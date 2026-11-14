(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const canvas=$("renderCanvas"), loading=$("loading"), scoreEl=$("score"), movesEl=$("moves");
  const statusEl=$("status"), progressFill=$("progressFill"), progressText=$("progressText"), toastEl=$("toast");
  const SIZE=8,TYPES=6,START_MOVES=25;
  const COLORS=["#ff5fa9","#54d9ff","#ffd34f","#9c75ff","#70e58d","#ff8b45"];
  const LEVELS=[
    {goal:1500,moves:25,place:"Enchanted Garden",story:"The Dragon Prince has lost the garden's magic. Help Queen Luma restore its colors!"},
    {goal:2200,moves:24,place:"Crystal Falls",story:"Queen Luma found the first crystal. The dragon needs your matches to awaken the waterfall."},
    {goal:3000,moves:23,place:"Royal Candy Castle",story:"The castle gates are sealed. Create powerful candy magic to open the royal hall."},
    {goal:3800,moves:22,place:"Starlight Bridge",story:"Cross the bridge of stars and collect enough magic to guide the dragon home."},
    {goal:4800,moves:22,place:"Dragon's Summit",story:"The final garden crystal is guarded at the summit. The kingdom is counting on you."}
  ];
  let engine,scene,camera,boardRoot,board=[],score=0,moves=START_MOVES,level=1,keyLight,rim;
  let busy=false,selected=null,pointerStart=null,soundOn=true,toastTimer;
  let specials=new Map(), candyMeshes=new Map(), unlocked=1, applyKingdomTheme=()=>{};
  let royalCandyTemplates=[], royalCandyLoadAttempted=false;
  const key=(r,c)=>r+","+c, parse=k=>k.split(",").map(Number);
  const goal=()=>LEVELS[Math.min(level-1,LEVELS.length-1)].goal;
  const levelData=()=>LEVELS[Math.min(level-1,LEVELS.length-1)];
  function toast(s){toastEl.textContent=s;toastEl.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove("show"),1900);}
  function updateHud(){
    $("level").textContent=String(level).padStart(2,"0");$("goal").textContent=goal().toLocaleString();
    scoreEl.textContent=score.toLocaleString();movesEl.textContent=moves;
    const pct=Math.min(100,Math.round(score/goal()*100));progressFill.style.width=pct+"%";progressText.textContent=pct+"%";
    statusEl.textContent=score>=goal()?"Garden restored! ✨":moves<=0?"Out of moves":"Make a match!";
    $("placeName").textContent=levelData().place;
  }
  function randType(){return Math.floor(Math.random()*TYPES);}
  function makeInitialBoard(){
    board=Array.from({length:SIZE},()=>Array(SIZE).fill(0));specials.clear();
    for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
      let t,n=0;do{t=randType();n++;}while(n<40&&((c>1&&board[r][c-1]===t&&board[r][c-2]===t)||(r>1&&board[r-1][c]===t&&board[r-2][c]===t)));
      board[r][c]=t;
    }
  }
  function loadRoyalCandyModels(){
    if(royalCandyLoadAttempted||!BABYLON.SceneLoader)return;
    royalCandyLoadAttempted=true;
    BABYLON.SceneLoader.LoadAssetContainerAsync("https://grab3d.com/dl/candy-set/","candy-set.glb",scene).then(container=>{
      const roots=container.rootNodes||[];
      let candidates=[];
      for(const node of roots){
        const direct=node.getChildren?node.getChildren(undefined,false):[];
        candidates.push(...direct.filter(child=>child.getChildMeshes&&child.getChildMeshes(false).length>0));
      }
      if(candidates.length<6)candidates=container.meshes.filter(mesh=>mesh.getTotalVertices&&mesh.getTotalVertices()>0&&!mesh.parent);
      candidates=candidates.filter((node,index,array)=>array.indexOf(node)===index).slice(0,10);
      if(candidates.length<6){console.warn("Candy GLB loaded but did not expose six independent candy models",candidates.length);container.dispose();return;}
      royalCandyTemplates=candidates;
      // Keep source meshes hidden; every board candy receives its own cloned model.
      for(const node of candidates)node.setEnabled(false);
      drawBoard();
      loading.classList.add("hidden");
      toast("Real candy models loaded ✨");
    }).catch(error=>console.warn("External candy model pack unavailable; keeping built-in candy models.",error));
  }
  function createCandy(type,r,c,special){
    const root=new BABYLON.TransformNode("candy-"+r+"-"+c,scene);
    root.position.set(c-3.5,3.5-r,0);
    if(royalCandyTemplates.length){
      const source=royalCandyTemplates[type%royalCandyTemplates.length];
      const model=source.clone("royal-candy-"+r+"-"+c,null,true);
      if(model){
        model.setEnabled(true);model.parent=root;
        const meshes=[model,...(model.getChildMeshes?model.getChildMeshes(false):[])].filter(m=>m.getBoundingInfo);
        let maxDim=0;
        for(const mesh of meshes){mesh.computeWorldMatrix(true);const box=mesh.getBoundingInfo().boundingBox;maxDim=Math.max(maxDim,box.extendSizeWorld.x*2,box.extendSizeWorld.y*2,box.extendSizeWorld.z*2);}
        const fit=maxDim>0?.76/maxDim:1;
        model.scaling.scaleInPlace(fit);
        const bounds=meshes.reduce((acc,m)=>{m.computeWorldMatrix(true);const b=m.getBoundingInfo().boundingBox;acc.minX=Math.min(acc.minX,b.minimumWorld.x);acc.maxX=Math.max(acc.maxX,b.maximumWorld.x);acc.minY=Math.min(acc.minY,b.minimumWorld.y);acc.maxY=Math.max(acc.maxY,b.maximumWorld.y);acc.minZ=Math.min(acc.minZ,b.minimumWorld.z);acc.maxZ=Math.max(acc.maxZ,b.maximumWorld.z);return acc;},{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity,minZ:Infinity,maxZ:-Infinity});
        if(Number.isFinite(bounds.minX))model.position.set(-(bounds.minX+bounds.maxX)/2,-(bounds.minY+bounds.maxY)/2,-(bounds.minZ+bounds.maxZ)/2);
        if(special){const ring=BABYLON.MeshBuilder.CreateTorus("royal-special-ring",{diameter:.94,thickness:.055,tessellation:36},scene);ring.parent=root;ring.position.z=-.08;const gold=new BABYLON.StandardMaterial("royal-special-gold",scene);gold.diffuseColor=new BABYLON.Color3(1,.72,.22);gold.emissiveColor=new BABYLON.Color3(.22,.1,.015);ring.material=gold;}
        root.metadata={r,c,type};candyMeshes.set(key(r,c),root);return root;
      }
    }
    const color=BABYLON.Color3.FromHexString(COLORS[type]);
    const mat=new BABYLON.StandardMaterial("sweet-glaze-"+r+"-"+c,scene);
    mat.diffuseColor=color;mat.specularColor=new BABYLON.Color3(.95,.9,1);mat.specularPower=96;mat.emissiveColor=color.scale(.12);
    const pearl=new BABYLON.StandardMaterial("sweet-pearl-"+r+"-"+c,scene);
    pearl.diffuseColor=new BABYLON.Color3(1,.88,.98);pearl.specularColor=BABYLON.Color3.White();pearl.specularPower=110;
    const gold=new BABYLON.StandardMaterial("sweet-gold-"+r+"-"+c,scene);
    gold.diffuseColor=new BABYLON.Color3(1,.72,.22);gold.emissiveColor=new BABYLON.Color3(.22,.1,.015);
    const add=(name,shape,opts,pos,scale,rot,material=mat)=>{
      const m=shape(name,opts,scene);m.parent=root;m.position.set(pos[0],pos[1],pos[2]);
      if(scale)m.scaling.set(scale[0],scale[1],scale[2]);if(rot)m.rotation.set(rot[0],rot[1],rot[2]);m.material=material;return m;
    };
    const shadowMat=new BABYLON.StandardMaterial("sweet-shadow-"+r+"-"+c,scene);
    shadowMat.diffuseColor=new BABYLON.Color3(.035,.012,.075);shadowMat.emissiveColor=new BABYLON.Color3(.018,.006,.035);shadowMat.alpha=.42;
    add("contact-shadow",BABYLON.MeshBuilder.CreateSphere,{diameter:.86,segments:16},[.045,-.12,.15],[1,.72,.12],null,shadowMat);
    if(type===0){
      add("jelly-center",BABYLON.MeshBuilder.CreateSphere,{diameter:.78,segments:28},[0,-.015,0],[1,.82,.86]);
      add("icing-crown",BABYLON.MeshBuilder.CreateTorus,{diameter:.52,thickness:.095,tessellation:32},[0,.22,-.04],[1,.72,.7],[.12,0,0],pearl);
      for(let i=0;i<3;i++)add("sugar-pearl",BABYLON.MeshBuilder.CreateSphere,{diameter:.075,segments:10},[-.19+i*.19,.25,-.31],[1,1,.65],null,pearl);
    }else if(type===1){
      add("candy-roll",BABYLON.MeshBuilder.CreateSphere,{diameter:.72,segments:28},[0,0,0],[1.18,.68,.82]);
      for(let i=-1;i<=1;i++)add("sugar-band",BABYLON.MeshBuilder.CreateTorus,{diameter:.57,thickness:.045,tessellation:24},[i*.2,0,-.025],[.72,1,.78],[0,0,Math.PI/2],pearl);
      add("end-cap-left",BABYLON.MeshBuilder.CreateSphere,{diameter:.2,segments:14},[-.39,0,0],[.72,1,.9],null,pearl);
      add("end-cap-right",BABYLON.MeshBuilder.CreateSphere,{diameter:.2,segments:14},[.39,0,0],[.72,1,.9],null,pearl);
    }else if(type===2){
      add("cupcake-wrapper",BABYLON.MeshBuilder.CreateCylinder,{height:.48,diameterTop:.48,diameterBottom:.66,tessellation:20},[0,-.12,0],[1,1,.82]);
      for(let i=0;i<8;i++){const ang=i*Math.PI/4;add("wrapper-ridge",BABYLON.MeshBuilder.CreateBox,{width:.035,height:.38,depth:.025},[Math.cos(ang)*.285,-.12,Math.sin(ang)*.23],[1,1,1],[0,-ang,0],gold);}
      add("frosting",BABYLON.MeshBuilder.CreateSphere,{diameter:.68,segments:24},[0,.19,-.015],[1,.67,.86],null,pearl);
      add("frosting-swirl",BABYLON.MeshBuilder.CreateTorus,{diameter:.36,thickness:.09,tessellation:28},[0,.39,-.08],[.82,.82,.72],[.2,0,0]);
      add("cherry",BABYLON.MeshBuilder.CreateSphere,{diameter:.17,segments:16},[.04,.49,-.17],[1,1,.8],null,gold);
    }else if(type===3){
      add("crystal-heart",BABYLON.MeshBuilder.CreatePolyhedron,{type:1,size:.48},[0,0,0],[1.02,1.08,.86],[0,0,Math.PI/4]);
      add("crystal-girdle",BABYLON.MeshBuilder.CreateTorus,{diameter:.61,thickness:.035,tessellation:28},[0,0,-.04],[1,.72,.75],[Math.PI/2,0,0],pearl);
      add("crystal-tip",BABYLON.MeshBuilder.CreateCylinder,{height:.28,diameterTop:0,diameterBottom:.3,tessellation:6},[0,.36,0],[1,1,.85],[0,0,0],pearl);
    }else if(type===4){
      add("berry-body",BABYLON.MeshBuilder.CreateSphere,{diameter:.76,segments:28},[0,-.015,0],[.82,1.05,.82]);
      for(let i=0;i<5;i++){const ang=i*Math.PI*2/5;add("berry-leaf",BABYLON.MeshBuilder.CreateSphere,{diameter:.25,segments:12},[Math.cos(ang)*.12,.37,Math.sin(ang)*.09],[.55,.28,.38],[0,0,-.35],gold);}
      for(let i=0;i<5;i++){const ang=i*2.4;add("sugar-dot",BABYLON.MeshBuilder.CreateSphere,{diameter:.045,segments:8},[Math.cos(ang)*.2,-.03+Math.sin(ang)*.23,-.31],[1,1,.55],null,pearl);}
    }else{
      add("bonbon-center",BABYLON.MeshBuilder.CreateSphere,{diameter:.62,segments:24},[0,0,0],[.92,.9,.82]);
      for(const side of [-1,1]){
        add("foil-knot",BABYLON.MeshBuilder.CreateSphere,{diameter:.25,segments:14},[side*.39,0,0],[1.25,.58,.68],[0,0,side*.18],pearl);
        add("foil-tail",BABYLON.MeshBuilder.CreateCylinder,{height:.34,diameterTop:.035,diameterBottom:.22,tessellation:8},[side*.58,0,0],[1,1,.82],[0,0,side*Math.PI/2],mat);
      }
      add("bonbon-ribbon",BABYLON.MeshBuilder.CreateTorus,{diameter:.5,thickness:.035,tessellation:28},[0,0,-.04],[1,.78,.75],[Math.PI/2,0,0],pearl);
    }
    add("specular-glint",BABYLON.MeshBuilder.CreateSphere,{diameter:.14,segments:14},[-.19,.2,-.32],[1.35,.62,.3],null,pearl);
    if(special){
      const ring=add("royal-special-ring",BABYLON.MeshBuilder.CreateTorus,{diameter:.94,thickness:.055,tessellation:36},[0,0,-.08],[1,1,.7],[Math.PI/2,0,0],gold);
      ring.rotation.y=.3;
      add("special-star",BABYLON.MeshBuilder.CreatePolyhedron,{type:1,size:.17},[0,0,-.42],[1,1,.45],[0,0,Math.PI/4],gold);
    }
    root.metadata={r,c,type};candyMeshes.set(key(r,c),root);return root;
  }
  function drawBoard(){
    if(boardRoot)boardRoot.dispose();candyMeshes.clear();boardRoot=new BABYLON.TransformNode("boardRoot",scene);
    const back=BABYLON.MeshBuilder.CreateBox("board-back",{width:8.45,height:8.45,depth:.58},scene);back.parent=boardRoot;back.position.z=.22;
    const bm=new BABYLON.StandardMaterial("boardMat",scene);bm.diffuseColor=new BABYLON.Color3(.18,.08,.32);bm.emissiveColor=new BABYLON.Color3(.08,.025,.15);back.material=bm;
    // A luminous royal frame sits behind the playable grid, like a jeweled game board.
    const frameMat=new BABYLON.StandardMaterial("royal-frame-gold",scene);frameMat.diffuseColor=new BABYLON.Color3(1,.66,.88);frameMat.emissiveColor=new BABYLON.Color3(.38,.12,.3);frameMat.specularColor=new BABYLON.Color3(1,.9,1);
    const outerFrame=BABYLON.MeshBuilder.CreateTorus("royal-board-frame",{diameter:8.82,thickness:.085,tessellation:96},scene);outerFrame.parent=boardRoot;outerFrame.position.z=.48;outerFrame.material=frameMat;
    const innerFrame=BABYLON.MeshBuilder.CreateTorus("royal-board-inner-frame",{diameter:8.58,thickness:.025,tessellation:96},scene);innerFrame.parent=boardRoot;innerFrame.position.z=.47;innerFrame.material=frameMat;
    for(const x of [-4.28,4.28])for(const y of [-4.28,4.28]){const jewel=BABYLON.MeshBuilder.CreatePolyhedron("frame-jewel",{type:1,size:.16},scene);jewel.parent=boardRoot;jewel.position.set(x,y,.45);jewel.material=frameMat;jewel.rotation.z=Math.PI/4;}
    for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
      const tile=BABYLON.MeshBuilder.CreateBox("tile",{width:.92,height:.92,depth:.25},scene);tile.parent=boardRoot;tile.position.set(c-3.5,3.5-r,.045);
      const tm=new BABYLON.PBRMaterial("tileMat-"+r+"-"+c,scene);tm.albedoColor=new BABYLON.Color3(.31,.17,.49);tm.metallic=.22;tm.roughness=.3;tm.alpha=.78;tm.emissiveColor=new BABYLON.Color3(.055,.025,.10);tile.material=tm;
      const rim=BABYLON.MeshBuilder.CreateBox("tile-rim",{width:.99,height:.99,depth:.075},scene);rim.parent=boardRoot;rim.position.set(c-3.5,3.5-r,.19);
      const rimMat=new BABYLON.StandardMaterial("tile-rim-mat-"+r+"-"+c,scene);rimMat.diffuseColor=new BABYLON.Color3(.72,.48,.92);rimMat.emissiveColor=new BABYLON.Color3(.12,.055,.2);rimMat.alpha=.42;rim.material=rimMat;
    }
    for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)createCandy(board[r][c],r,c,specials.get(key(r,c))).parent=boardRoot;
  }
  function getCandy(r,c){return candyMeshes.get(key(r,c))||null;}
  function findRuns(){
    const runs=[];
    for(let r=0;r<SIZE;r++){let c=0;while(c<SIZE){let e=c+1;while(e<SIZE&&board[r][e]===board[r][c])e++;if(board[r][c]!=null&&e-c>=3)runs.push({cells:Array.from({length:e-c},(_,i)=>key(r,c+i)),dir:"row",length:e-c});c=e;}}
    for(let c=0;c<SIZE;c++){let r=0;while(r<SIZE){let e=r+1;while(e<SIZE&&board[e][c]===board[r][c])e++;if(board[r][c]!=null&&e-r>=3)runs.push({cells:Array.from({length:e-r},(_,i)=>key(r+i,c)),dir:"col",length:e-r});r=e;}}
    return runs;
  }
  function matchSet(runs){const s=new Set();runs.forEach(run=>run.cells.forEach(k=>s.add(k)));return s;}
  function animatePosition(mesh,target){
    const a=new BABYLON.Animation("move","position",12,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    a.setKeys([{frame:0,value:mesh.position.clone()},{frame:8,value:target.clone()}]);mesh.animations=[a];scene.beginAnimation(mesh,0,8,false,1);
  }
  function swapData(a,b){
    const t=board[a.r][a.c];board[a.r][a.c]=board[b.r][b.c];board[b.r][b.c]=t;
    const ka=key(a.r,a.c),kb=key(b.r,b.c),sa=specials.get(ka),sb=specials.get(kb);
    specials.delete(ka);specials.delete(kb);if(sa)specials.set(kb,sa);if(sb)specials.set(ka,sb);
    const ma=getCandy(a.r,a.c),mb=getCandy(b.r,b.c);
    if(ma){candyMeshes.delete(ka);ma.metadata={r:b.r,c:b.c,type:board[b.r][b.c]};candyMeshes.set(kb,ma);animatePosition(ma,new BABYLON.Vector3(b.c-3.5,3.5-b.r,0));}
    if(mb){candyMeshes.delete(kb);mb.metadata={r:a.r,c:a.c,type:board[a.r][a.c]};candyMeshes.set(ka,mb);animatePosition(mb,new BABYLON.Vector3(a.c-3.5,3.5-a.r,0));}
  }
  function neighbors(a,b){return Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===1;}
  function expandSpecials(hit){
    const queue=[...hit],seen=new Set();
    while(queue.length){const k=queue.pop();if(seen.has(k))continue;seen.add(k);const sp=specials.get(k);if(!sp)continue;const [r,c]=parse(k);
      if(sp==="row"){for(let x=0;x<SIZE;x++)hit.add(key(r,x));}
      else if(sp==="col"){for(let y=0;y<SIZE;y++)hit.add(key(y,c));}
      else {const type=board[r][c];for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(board[y][x]===type)hit.add(key(y,x));}
      for(const q of hit)if(!seen.has(q))queue.push(q);
    }
  }
  function createSpecialFromRuns(runs,hit,anchor){
    let chosen=null;
    for(const run of runs){if(run.length>=5){chosen={cell:anchor&&run.cells.includes(key(anchor.r,anchor.c))?key(anchor.r,anchor.c):run.cells[Math.floor(run.length/2)],type:"color"};break;}
      if(run.length===4&&!chosen){const cell=anchor&&run.cells.includes(key(anchor.r,anchor.c))?key(anchor.r,anchor.c):run.cells[1];chosen={cell,type:run.dir};}}
    if(chosen){hit.delete(chosen.cell);specials.set(chosen.cell,chosen.type);return chosen;}
    return null;
  }
  function reactCharacters(kind="match"){
    document.querySelectorAll(".queen-art,.dragon-art,.win-card .map-characters img").forEach(el=>{
      el.classList.remove("royal-react","royal-celebrate","royal-super");
      void el.offsetWidth;
      el.classList.add(kind==="win"?"royal-celebrate":kind==="big"?"royal-super":"royal-react");
    });
  }
  function candyBurst(position,type,big){
    const color=BABYLON.Color3.FromHexString(COLORS[type]||'#ffe28a');
    const count=big?9:5;
    for(let i=0;i<count;i++){
      const p=BABYLON.MeshBuilder.CreateSphere('match-spark',{diameter:big ? .13 : .085,segments:8},scene);
      const mat=new BABYLON.StandardMaterial('match-spark-mat',scene);mat.emissiveColor=color;mat.diffuseColor=color;mat.alpha=1;p.material=mat;p.position.copyFrom(position);
      const angle=(Math.PI*2*i/count)+(Math.random()-.5)*.3;
      const distance=(big?1.0:.62)+Math.random()*.28;
      const target=position.add(new BABYLON.Vector3(Math.cos(angle)*distance,Math.sin(angle)*distance,-.12));
      const move=new BABYLON.Animation('spark-flight','position',30,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);move.setKeys([{frame:0,value:position.clone()},{frame:16,value:target}]);
      const fade=new BABYLON.Animation('spark-fade','visibility',30,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);fade.setKeys([{frame:0,value:1},{frame:16,value:0}]);
      const shrink=new BABYLON.Animation('spark-shrink','scaling',30,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);shrink.setKeys([{frame:0,value:new BABYLON.Vector3(1,1,1)},{frame:16,value:new BABYLON.Vector3(.05,.05,.05)}]);
      p.animations=[move,fade,shrink];scene.beginAnimation(p,0,16,false,1,()=>{p.dispose();mat.dispose();});
    }
    if(big){
      const ring=BABYLON.MeshBuilder.CreateTorus('match-wave',{diameter:.35,thickness:.045,tessellation:32},scene);ring.position.copyFrom(position);ring.position.z-=.08;
      const rm=new BABYLON.StandardMaterial('match-wave-mat',scene);rm.emissiveColor=color;rm.alpha=.9;ring.material=rm;
      const grow=new BABYLON.Animation('wave-grow','scaling',30,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);grow.setKeys([{frame:0,value:new BABYLON.Vector3(.3,.3,.3)},{frame:18,value:new BABYLON.Vector3(3.2,3.2,1)}]);
      const fade=new BABYLON.Animation('wave-fade','visibility',30,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);fade.setKeys([{frame:0,value:1},{frame:18,value:0}]);ring.animations=[grow,fade];scene.beginAnimation(ring,0,18,false,1,()=>{ring.dispose();rm.dispose();});
    }
  }
  function resolveMatches(anchor,forcedKeys){
    const runs=findRuns();const hit=matchSet(runs);(forcedKeys||[]).forEach(k=>hit.add(k));if(!hit.size){busy=false;return;}
    const created=(forcedKeys&&forcedKeys.length)?null:createSpecialFromRuns(runs,hit,anchor);
    reactCharacters(hit.size>=6?"big":"match");
    expandSpecials(hit);
    const points=hit.size*60+(hit.size>6?150:0);score+=points;updateHud();
    if(created)toast(created.type==="color"?"Rainbow Candy created! 🌈":"Magic Stripe created! ✨");
    else if(hit.size>=6)toast("Magic chain reaction! 💥");
    for(const k of hit){const [r,c]=parse(k);const candy=getCandy(r,c);if(candy){const world=candy.getAbsolutePosition().clone();candyBurst(world,board[r][c],hit.size>=6||!!specials.get(k));candy.dispose();}board[r][c]=null;specials.delete(k);}
    setTimeout(dropAndRefill,150);
  }
  function animateDrop(mesh,target,duration=22){
    const a=new BABYLON.Animation("candy-drop","position",30,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    a.setKeys([{frame:0,value:mesh.position.clone()},{frame:Math.max(1,duration-4),value:new BABYLON.Vector3(target.x,target.y+.12,target.z)},{frame:duration,value:target.clone()}]);
    const easing=new BABYLON.CubicEase();easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);a.setEasingFunction(easing);
    mesh.animations=[a];scene.beginAnimation(mesh,0,duration,false,1);
  }
  function dropAndRefill(){
    const oldMeshes=new Map(candyMeshes);candyMeshes.clear();
    for(let c=0;c<SIZE;c++){
      const keep=[];for(let r=SIZE-1;r>=0;r--)if(board[r][c]!==null)keep.push({type:board[r][c],sp:specials.get(key(r,c)),fromR:r});
      for(let r=0;r<SIZE;r++){specials.delete(key(r,c));board[r][c]=null;}
      let row=SIZE-1;
      for(const item of keep){
        board[row][c]=item.type;if(item.sp)specials.set(key(row,c),item.sp);
        const mesh=oldMeshes.get(key(item.fromR,c));
        if(mesh&&!mesh.isDisposed()){
          mesh.metadata={r:row,c,type:item.type};candyMeshes.set(key(row,c),mesh);
          animateDrop(mesh,new BABYLON.Vector3(c-3.5,3.5-row,0),18+Math.min(12,row-item.fromR));
        }else{
          const fresh=createCandy(item.type,row,c,item.sp);fresh.parent=boardRoot;animateDrop(fresh,new BABYLON.Vector3(c-3.5,3.5-row,0),18);
        }
        row--;
      }
      while(row>=0){
        const type=randType();board[row][c]=type;
        const fresh=createCandy(type,row,c,null);fresh.parent=boardRoot;
        fresh.position.y=4.35+(SIZE-1-row)*.08;
        animateDrop(fresh,new BABYLON.Vector3(c-3.5,3.5-row,0),22+(SIZE-1-row)*2);
        row--;
      }
    }
    for(const mesh of oldMeshes.values())if(mesh&&!mesh.isDisposed()&&!Array.from(candyMeshes.values()).includes(mesh))mesh.dispose();
    setTimeout(()=>{if(findRuns().length)resolveMatches(null);else{busy=false;updateHud();if(score>=goal())winLevel();else if(moves<=0)toast("No moves left — try again!");}},850);
  }
  function trySwap(a,b){
    if(busy||moves<=0||score>=goal()||!neighbors(a,b))return;busy=true;selected=null;
    swapData(a,b);
    setTimeout(()=>{const runs=findRuns();const specialSwap=specials.has(key(b.r,b.c))||specials.has(key(a.r,a.c));
      if(runs.length||specialSwap){const forced=[key(a.r,a.c),key(b.r,b.c)].filter(k=>specials.has(k));moves--;updateHud();resolveMatches({r:b.r,c:b.c},forced);}
      else{swapData(a,b);setTimeout(()=>busy=false,180);}
    },190);
  }
  function pickCell(p){
    const ray=scene.createPickingRay(p.x,p.y,BABYLON.Matrix.Identity(),camera);
    const hit=scene.pickWithRay(ray,m=>m&&m.name==="sweet");
    if(!hit||!hit.hit||!hit.pickedMesh||!hit.pickedMesh.parent)return null;
    const md=hit.pickedMesh.parent.metadata;return md?{r:md.r,c:md.c}:null;
  }
  function pointerDown(e){if(busy)return;const rect=canvas.getBoundingClientRect();pointerStart={x:e.clientX-rect.left,y:e.clientY-rect.top,cell:null};pointerStart.cell=pickCell(new BABYLON.Vector2(pointerStart.x/canvas.clientWidth*engine.getRenderWidth(),pointerStart.y/canvas.clientHeight*engine.getRenderHeight()));}
  function pointerUp(e){
    if(!pointerStart||!pointerStart.cell||busy){pointerStart=null;return;}
    const rect=canvas.getBoundingClientRect(),dx=e.clientX-(rect.left+pointerStart.x),dy=e.clientY-(rect.top+pointerStart.y),start=pointerStart.cell;
    if(Math.abs(dx)+Math.abs(dy)>12){const b=Math.abs(dx)>Math.abs(dy)?{r:start.r,c:start.c+(dx>0?1:-1)}:{r:start.r+(dy>0?1:-1),c:start.c};if(b.r>=0&&b.r<SIZE&&b.c>=0&&b.c<SIZE)trySwap(start,b);}
    else{const p=new BABYLON.Vector2((e.clientX-rect.left)/canvas.clientWidth*engine.getRenderWidth(),(e.clientY-rect.top)/canvas.clientHeight*engine.getRenderHeight()),cell=pickCell(p);if(cell){if(selected&&neighbors(selected,cell))trySwap(selected,cell);else selected=cell;}}
    pointerStart=null;
  }
  function startLevel(n){level=Math.max(1,Math.min(LEVELS.length,n));applyKingdomTheme(level-1);score=0;moves=levelData().moves;busy=false;selected=null;makeInitialBoard();drawBoard();updateHud();$("storyText").textContent=levelData().story;$("mapOverlay").classList.remove("open");toast("Level "+level+" — "+levelData().place);}
  function winLevel(){
    if(busy===false&&score>=goal()){reactCharacters("win");busy=true;unlocked=Math.max(unlocked,Math.min(LEVELS.length,level+1));localStorage.setItem("cmr-unlocked",String(unlocked));$("winTitle").textContent="Level "+level+" restored!";$("winMessage").textContent="Queen Luma and the Dragon Prince thank you for bringing magic back to "+levelData().place+"."; $("winOverlay").classList.add("open");}
  }
  function nextLevel(){if(level<LEVELS.length)startLevel(level+1);else{ $("winOverlay").classList.remove("open");$("mapOverlay").classList.add("open");buildMap();}}
  function buildMap(){
    const wrap=$("mapLevels");wrap.innerHTML="";
    LEVELS.forEach((item,i)=>{const n=i+1,btn=document.createElement("button");btn.className="map-level"+(n<=unlocked?" unlocked":" locked");btn.disabled=n>unlocked;btn.innerHTML="<strong>"+String(n).padStart(2,"0")+"</strong><span>"+item.place+"</span>"+(n<=unlocked?"<i>✦</i>":"<i>🔒</i>");btn.addEventListener("click",()=>startLevel(n));wrap.appendChild(btn);});
  }
  function restart(){startLevel(level);}
  function shuffle(){if(busy||moves<=0)return;makeInitialBoard();for(const m of candyMeshes.values())if(m&&!m.isDisposed())m.dispose();drawBoard();toast("Candies shuffled!");}
  function createKingdomAmbience(){
    // Small 3D set dressing around the board: floating crystals and drifting star motes.
    const themes=[{sky:[.12,.055,.22],crystal:"#b879ff",glow:"#ff9bdc",light:"#f2b7ff",rim:"#8c9cff"},{sky:[.035,.12,.24],crystal:"#55dfff",glow:"#9af5ff",light:"#8deaff",rim:"#6c9dff"},{sky:[.20,.075,.17],crystal:"#ff9fce",glow:"#ffe08a",light:"#ffd0a6",rim:"#ff80bb"},{sky:[.055,.08,.24],crystal:"#8c9dff",glow:"#c9b4ff",light:"#a8c8ff",rim:"#d2a2ff"},{sky:[.18,.045,.12],crystal:"#ff785f",glow:"#ffd16b",light:"#ffb18c",rim:"#ff6d9d"}];
    const crystalMat=new BABYLON.StandardMaterial("kingdomCrystalMat",scene);
    crystalMat.diffuseColor=new BABYLON.Color3(.55,.28,.9);
    crystalMat.emissiveColor=new BABYLON.Color3(.32,.12,.62);
    crystalMat.specularColor=new BABYLON.Color3(.9,.75,1);
    const goldMat=new BABYLON.StandardMaterial("kingdomStarMat",scene);
    goldMat.emissiveColor=new BABYLON.Color3(1,.65,.86);
    goldMat.diffuseColor=new BABYLON.Color3(1,.75,.9);
    const ornaments=[];
    // Soft bloom makes candy glaze, crystals and magic particles read as luminous.
    try{const glowLayer=new BABYLON.GlowLayer("royal-glow",scene,{blurKernelSize:32});glowLayer.intensity=.55;}catch(glowError){console.warn("Glow layer unavailable",glowError);}
    const crystalSpots=[[-4.25,3.55,.65],[-4.25,-3.55,.65],[4.25,3.55,.65],[4.25,-3.55,.65],[-4.28,0,.65],[4.28,0,.65]];
    crystalSpots.forEach((p,i)=>{
      const gem=BABYLON.MeshBuilder.CreatePolyhedron("kingdom-crystal-"+i,{type:1,size:.34},scene);
      gem.position.set(p[0],p[1],p[2]);gem.material=crystalMat;
      ornaments.push({mesh:gem,phase:i*.9,speed:i%2?.55:-.42,baseY:p[1]});
      const halo=BABYLON.MeshBuilder.CreateTorus("crystal-halo-"+i,{diameter:.58,thickness:.018,tessellation:24},scene);
      halo.position.copyFrom(gem.position);halo.rotation.x=Math.PI/2;halo.material=goldMat;
      ornaments.push({mesh:halo,phase:i*.9,speed:i%2?-.35:.3,baseY:p[1]});
    });
    const stars=[];
    for(let i=0;i<18;i++){
      const star=BABYLON.MeshBuilder.CreateSphere("kingdom-mote-"+i,{diameter:.045+(i%3)*.018,segments:8},scene);
      star.position.set(-4.45+(i%6)*1.78,-3.9+Math.floor(i/6)*3.9,.78);
      star.material=goldMat;stars.push({mesh:star,phase:i*.7,baseY:star.position.y});
    }

    // Five small 3D landmark sets frame the board and change with each kingdom.
    const landmarkSets=themes.map((theme,themeIndex)=>{
      const root=new BABYLON.TransformNode("world-landmarks-"+themeIndex,scene);
      const accent=BABYLON.Color3.FromHexString(theme.crystal);
      const glow=BABYLON.Color3.FromHexString(theme.glow);
      const solid=new BABYLON.StandardMaterial("landmark-solid-"+themeIndex,scene);
      solid.diffuseColor=accent;solid.emissiveColor=accent.scale(.28);solid.specularColor=new BABYLON.Color3(.9,.8,1);
      const shine=new BABYLON.StandardMaterial("landmark-glow-"+themeIndex,scene);
      shine.diffuseColor=glow;shine.emissiveColor=glow.scale(.8);
      const corners=[[-4.08,4.08], [4.08,4.08], [-4.08,-4.08], [4.08,-4.08]];
      corners.forEach(([x,y],i)=>{
        const cluster=new BABYLON.TransformNode("landmark-cluster-"+themeIndex+"-"+i,scene);
        cluster.parent=root;cluster.position.set(x,y,-.24);
        const base=BABYLON.MeshBuilder.CreateCylinder("landmark-base",{height:.16,diameter:.58,tessellation:8},scene);
        base.parent=cluster;base.position.y=-.04;base.material=solid;
        if(themeIndex===0){
          const stem=BABYLON.MeshBuilder.CreateCylinder("garden-stem",{height:.38,diameter:.13,tessellation:8},scene);
          stem.parent=cluster;stem.position.y=.2;stem.material=shine;
          const bloom=BABYLON.MeshBuilder.CreateSphere("garden-bloom",{diameter:.43,segments:12},scene);
          bloom.parent=cluster;bloom.position.y=.43;bloom.scaling.y=.62;bloom.material=solid;
          const bud=BABYLON.MeshBuilder.CreateSphere("garden-bud",{diameter:.15,segments:10},scene);
          bud.parent=cluster;bud.position.set(.12,.48,-.13);bud.material=shine;
        }else if(themeIndex===1||themeIndex===4){
          for(let j=0;j<3;j++){
            const crystal=BABYLON.MeshBuilder.CreatePolyhedron("landmark-shard",{type:1,size:.25+(j===1?.12:0)},scene);
            crystal.parent=cluster;crystal.position.set((j-1)*.18,.22+(j%2)*.13,0);
            crystal.rotation.z=(j-1)*.35;crystal.scaling.y=1.45;crystal.material=j===1?shine:solid;
          }
        }else if(themeIndex===2){
          const tower=BABYLON.MeshBuilder.CreateCylinder("castle-tower",{height:.62,diameterTop:.19,diameterBottom:.34,tessellation:10},scene);
          tower.parent=cluster;tower.position.y=.28;tower.material=solid;
          const roof=BABYLON.MeshBuilder.CreateCylinder("castle-roof",{height:.28,diameterTop:0,diameterBottom:.28,tessellation:10},scene);
          roof.parent=cluster;roof.position.y=.72;roof.material=shine;
          const window=BABYLON.MeshBuilder.CreateSphere("castle-window",{diameter:.12,segments:10},scene);
          window.parent=cluster;window.position.set(0,.31,-.17);window.material=shine;
        }else{
          const arch=BABYLON.MeshBuilder.CreateTorus("starlight-arch",{diameter:.58,thickness:.045,tessellation:24},scene);
          arch.parent=cluster;arch.position.y=.28;arch.rotation.x=Math.PI/2;arch.material=shine;
          const star=BABYLON.MeshBuilder.CreatePolyhedron("bridge-star",{type:1,size:.19},scene);
          star.parent=cluster;star.position.y=.32;star.rotation.z=Math.PI/4;star.material=solid;
        }
        cluster.rotation.y=i*Math.PI/2;
        ornaments.push({mesh:cluster,phase:i*.8,speed:i%2?.22:-.18,baseY:0});
      });
      return root;
    });
    // Miniature 3D royal companions live in the upper corners of the playfield.
    const queenRoot=new BABYLON.TransformNode("queen-luma-3d",scene);
    queenRoot.position.set(-4.72,4.2,-.48);
    const queenGold=new BABYLON.StandardMaterial("queen-gold",scene);queenGold.diffuseColor=new BABYLON.Color3(1,.72,.2);queenGold.emissiveColor=new BABYLON.Color3(.22,.11,.015);
    const queenDress=new BABYLON.StandardMaterial("queen-dress",scene);queenDress.diffuseColor=new BABYLON.Color3(.72,.22,.9);queenDress.emissiveColor=new BABYLON.Color3(.12,.025,.2);
    const queenSkin=new BABYLON.StandardMaterial("queen-skin",scene);queenSkin.diffuseColor=new BABYLON.Color3(1,.72,.58);
    const queenHair=new BABYLON.StandardMaterial("queen-hair",scene);queenHair.diffuseColor=new BABYLON.Color3(.34,.12,.48);
    const queenEye=new BABYLON.StandardMaterial("queen-eye",scene);queenEye.diffuseColor=new BABYLON.Color3(.12,.055,.2);queenEye.emissiveColor=new BABYLON.Color3(.08,.025,.1);
    const qPart=(name,shape,opts,mat,pos,scale,rot)=>{const m=shape(name,opts,scene);m.parent=queenRoot;m.material=mat;if(pos)m.position.set(pos[0],pos[1],pos[2]);if(scale)m.scaling.set(scale[0],scale[1],scale[2]);if(rot)m.rotation.set(rot[0],rot[1],rot[2]);return m;};
    const queenArms=[];
    qPart("luma-royal-gown",BABYLON.MeshBuilder.CreateCylinder,{height:.72,diameterTop:.18,diameterBottom:.72,tessellation:12},queenDress,[0,-.18,0],[1,1,.72]);
    qPart("luma-neck",BABYLON.MeshBuilder.CreateCylinder,{height:.13,diameter:.13,tessellation:10},queenSkin,[0,.22,0]);
    qPart("luma-face",BABYLON.MeshBuilder.CreateSphere,{diameter:.43,segments:16},queenSkin,[0,.48,0],[.88,1,.78]);
    qPart("luma-hair",BABYLON.MeshBuilder.CreateSphere,{diameter:.49,segments:14},queenHair,[0,.58,.035],[1.04,.9,.83]);
    qPart("luma-fringe",BABYLON.MeshBuilder.CreateSphere,{diameter:.27,segments:12},queenHair,[0,.68,-.12],[1.1,.52,.5]);
    for(const side of [-1,1]){
      qPart("luma-eye",BABYLON.MeshBuilder.CreateSphere,{diameter:.045,segments:8},queenEye,[side*.105,.49,-.185]);
      const arm=qPart("luma-sleeve",BABYLON.MeshBuilder.CreateSphere,{diameter:.22,segments:12},queenDress,[side*.29,.04,0],[.72,.8,.72],[0,0,side*.45]);queenArms.push({mesh:arm,side});
      qPart("luma-crown-point",BABYLON.MeshBuilder.CreateCylinder,{height:.23,diameterTop:0,diameterBottom:.13,tessellation:6},queenGold,[side*.13,.91,0],[1,1,1],[0,0,side*-.18]);
    }
    qPart("luma-crown-band",BABYLON.MeshBuilder.CreateTorus,{diameter:.34,thickness:.045,tessellation:18},queenGold,[0,.82,0],[1,1,.8],[Math.PI/2,0,0]);
    const gemMat=new BABYLON.StandardMaterial("luma-gem",scene);gemMat.diffuseColor=new BABYLON.Color3(1,.25,.65);gemMat.emissiveColor=new BABYLON.Color3(.7,.08,.3);
    qPart("luma-crown-gem",BABYLON.MeshBuilder.CreateSphere,{diameter:.1,segments:10},gemMat,[0,.91,-.05]);
    const dragonRoot=new BABYLON.TransformNode("dragon-prince-3d",scene);
    dragonRoot.position.set(4.72,4.2,-.48);
    const dragonBody=new BABYLON.StandardMaterial("dragon-body",scene);dragonBody.diffuseColor=new BABYLON.Color3(.22,.78,.55);dragonBody.emissiveColor=new BABYLON.Color3(.025,.12,.07);
    const dragonBelly=new BABYLON.StandardMaterial("dragon-belly",scene);dragonBelly.diffuseColor=new BABYLON.Color3(.9,.72,.36);
    const dragonWing=new BABYLON.StandardMaterial("dragon-wing",scene);dragonWing.diffuseColor=new BABYLON.Color3(.35,.22,.72);dragonWing.emissiveColor=new BABYLON.Color3(.08,.025,.18);dragonWing.backFaceCulling=false;
    const dragonEye=new BABYLON.StandardMaterial("dragon-eye",scene);dragonEye.diffuseColor=new BABYLON.Color3(1,.82,.2);dragonEye.emissiveColor=new BABYLON.Color3(.4,.22,.015);
    const dPart=(name,shape,opts,mat,pos,scale,rot)=>{const m=shape(name,opts,scene);m.parent=dragonRoot;m.material=mat;if(pos)m.position.set(pos[0],pos[1],pos[2]);if(scale)m.scaling.set(scale[0],scale[1],scale[2]);if(rot)m.rotation.set(rot[0],rot[1],rot[2]);return m;};
    const dragonWings=[];
    dPart("dragon-tummy",BABYLON.MeshBuilder.CreateSphere,{diameter:.64,segments:16},dragonBody,[0,-.12,0],[1.05,.82,.78]);
    dPart("dragon-belly",BABYLON.MeshBuilder.CreateSphere,{diameter:.46,segments:14},dragonBelly,[0,-.18,-.25],[.78,.78,.35]);
    dPart("dragon-head",BABYLON.MeshBuilder.CreateSphere,{diameter:.48,segments:16},dragonBody,[.03,.38,-.03],[1.05,.88,.82]);
    dPart("dragon-snout",BABYLON.MeshBuilder.CreateSphere,{diameter:.25,segments:12},dragonBelly,[.05,.27,-.25],[1.15,.62,.65]);
    for(const side of [-1,1]){
      dPart("dragon-eye",BABYLON.MeshBuilder.CreateSphere,{diameter:.07,segments:10},dragonEye,[side*.14,.43,-.34]);
      dPart("dragon-horn",BABYLON.MeshBuilder.CreateCylinder,{height:.28,diameterTop:0,diameterBottom:.13,tessellation:7},dragonBelly,[side*.17,.7,0],[1,1,1],[0,0,side*-.35]);
      const wing=dPart("dragon-wing",BABYLON.MeshBuilder.CreatePlane,{width:.56,height:.52,sideOrientation:BABYLON.Mesh.DOUBLESIDE},dragonWing,[side*.38,.15,.12],[1,1,1],[0,side*-.22,side*-.55]);
      wing.rotation.y=side*-.35;dragonWings.push({mesh:wing,side});
    }
    const companions=[{root:queenRoot,phase:0,speed:1.1,baseY:4.2},{root:dragonRoot,phase:1.7,speed:1.5,baseY:4.2}];

    // Detailed 3D kingdom scenery visible around the playable board.
    const worldSets=[],waterMeshes=[];
    const makeWorldMat=(name,color,alpha=1)=>{const m=new BABYLON.StandardMaterial(name,scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);m.emissiveColor=BABYLON.Color3.FromHexString(color).scale(.32);m.specularColor=new BABYLON.Color3(.95,.88,1);m.specularPower=80;m.alpha=alpha;return m;};
    themes.forEach((theme,idx)=>{
      const world=new BABYLON.TransformNode("world-scene-"+idx,scene);
      const stone=makeWorldMat("world-stone-"+idx,idx===4?"#67354c":"#49306f");
      const trim=makeWorldMat("world-trim-"+idx,theme.glow);
      const glass=makeWorldMat("world-glass-"+idx,theme.crystal,.78);
      const dark=makeWorldMat("world-gate-"+idx,"#20143e");
      const part=(name,shape,opts,pos,scale,mat,rot)=>{const m=shape(name,opts,scene);m.parent=world;m.position.set(...pos);if(scale)m.scaling.set(...scale);if(rot)m.rotation.set(...rot);m.material=mat;return m;};
      if(idx===0||idx===2){
        const n=idx===0?"enchanted-palace":"royal-castle";
        part(n+"-hall",BABYLON.MeshBuilder.CreateBox,{width:2.5,height:.68,depth:.72},[0,4.68,1.55],[1,1,1],stone);
        part(n+"-roof",BABYLON.MeshBuilder.CreateCylinder,{height:.42,diameterTop:0,diameterBottom:2.9,tessellation:4},[0,5.18,1.55],[1,1,.42],trim,[0,0,Math.PI/4]);
        for(const x of [-1.42,1.42]){
          part(n+"-tower",BABYLON.MeshBuilder.CreateCylinder,{height:.82,diameter:.62,tessellation:12},[x,4.82,1.55],[1,1,.82],stone);
          part(n+"-spire",BABYLON.MeshBuilder.CreateCylinder,{height:.42,diameterTop:0,diameterBottom:.7,tessellation:10},[x,5.42,1.55],[1,1,.82],trim);
          part(n+"-window",BABYLON.MeshBuilder.CreateSphere,{diameter:.18,segments:12},[x,4.83,1.13],[.72,1,.32],glass);
        }
        part(n+"-gate",BABYLON.MeshBuilder.CreateBox,{width:.5,height:.52,depth:.08},[0,4.54,1.12],[1,1,1],dark);
        part(n+"-gate-ring",BABYLON.MeshBuilder.CreateTorus,{diameter:.64,thickness:.045,tessellation:32},[0,4.75,1.05],[1,.9,1],trim,[Math.PI/2,0,0]);
      }else if(idx===1){
        for(const side of [-1,1]){
          part("crystal-falls-cliff",BABYLON.MeshBuilder.CreatePolyhedron,{type:1,size:.72},[side*1.75,4.83,1.5],[1.15,1.2,.6],stone,[0,0,side*.18]);
          for(let j=0;j<3;j++)part("falls-spire",BABYLON.MeshBuilder.CreatePolyhedron,{type:1,size:.34},[side*(1.25+j*.4),5.05+(j%2)*.12,1.15],[.65,1.55,.5],trim,[0,0,(j-1)*.2]);
        }
      }else if(idx===3){
        for(let j=0;j<3;j++)part("starlight-bridge-arch",BABYLON.MeshBuilder.CreateTorus,{diameter:1.5+j*.34,thickness:.06,tessellation:40},[0,4.78,1.45+j*.12],[1,.72,1],trim,[Math.PI/2,0,0]);
        for(let x=-2;x<=2;x++)part("bridge-star",BABYLON.MeshBuilder.CreatePolyhedron,{type:1,size:.13},[x*.62,4.55+Math.sin(x)*.12,1.08],[1,1,.5],glass,[0,0,Math.PI/4]);
      }else{
        part("dragon-volcano",BABYLON.MeshBuilder.CreateCylinder,{height:1.25,diameterTop:.12,diameterBottom:2.9,tessellation:7},[0,4.75,1.55],[1,1,.58],stone,[0,0,.08]);
        part("summit-crystal",BABYLON.MeshBuilder.CreatePolyhedron,{type:1,size:.42},[0,5.25,1.08],[.7,1.35,.55],trim,[0,0,.2]);
        for(let x=-1;x<=1;x+=2)part("magma-rift",BABYLON.MeshBuilder.CreateBox,{width:.06,height:.72,depth:.035},[x*.6,4.68,1.02],[1,1,1],glass,[0,0,x*.28]);
      }
      for(const side of [-1,1]){
        part("side-rock-wall",BABYLON.MeshBuilder.CreatePolyhedron,{type:1,size:.65},[side*4.68,-.05,1.48],[.78,3.25,.55],stone,[0,0,side*.12]);
        const water=part("waterfall-ribbon",BABYLON.MeshBuilder.CreatePlane,{width:.38,height:4.15,sideOrientation:BABYLON.Mesh.DOUBLESIDE},[side*4.72,-.05,.98],[1,1,1],glass);
        waterMeshes.push({mesh:water,phase:side*.8,x:side*4.72});
        for(let j=0;j<3;j++)part("side-crystal",BABYLON.MeshBuilder.CreatePolyhedron,{type:1,size:.2},[side*(4.24+j*.16),-1.4+j*1.3,.72],[.72,1.5,.6],trim,[0,0,side*.24]);
        part("floating-island-rock",BABYLON.MeshBuilder.CreateSphere,{diameter:1.15,segments:16},[side*3.52,-4.78,1.35],[1.35,.46,.72],stone);
        part("floating-island-rim",BABYLON.MeshBuilder.CreateCylinder,{height:.1,diameter:1.02,tessellation:16},[side*3.52,-4.48,1.2],[1,1,.72],trim);
        for(let j=0;j<3;j++)part("island-crystal",BABYLON.MeshBuilder.CreatePolyhedron,{type:1,size:.16},[side*(3.22+j*.27),-4.3+(j%2)*.1,.78],[.7,1.4,.65],glass);
      }
      for(let j=0;j<10;j++)part("sky-star",BABYLON.MeshBuilder.CreatePolyhedron,{type:1,size:.05+(j%3)*.02},[-3.8+(j%5)*1.9,4.08+Math.floor(j/5)*.58,2.05],[1,1,.45],trim,[0,0,Math.PI/4]);
      worldSets.push(world);
    });
    applyKingdomTheme=(index)=>{const active=Math.max(0,Math.min(themes.length-1,index));const theme=themes[active];scene.clearColor=new BABYLON.Color4(theme.sky[0],theme.sky[1],theme.sky[2],0);crystalMat.diffuseColor=BABYLON.Color3.FromHexString(theme.crystal);crystalMat.emissiveColor=BABYLON.Color3.FromHexString(theme.crystal).scale(.55);goldMat.diffuseColor=BABYLON.Color3.FromHexString(theme.glow);goldMat.emissiveColor=BABYLON.Color3.FromHexString(theme.glow);keyLight.diffuse=BABYLON.Color3.FromHexString(theme.light);rim.diffuse=BABYLON.Color3.FromHexString(theme.rim);landmarkSets.forEach((set,i)=>set.setEnabled(i===active));worldSets.forEach((set,i)=>set.setEnabled(i===active));};
    applyKingdomTheme(level-1);
    scene.onBeforeRenderObservable.add(()=>{
      const t=performance.now()*.001;
      ornaments.forEach(o=>{o.mesh.rotation.y=t*o.speed+o.phase;o.mesh.rotation.z=Math.sin(t*.8+o.phase)*.16;o.mesh.position.y=o.baseY+Math.sin(t*1.15+o.phase)*.10;});
      stars.forEach((o,i)=>{o.mesh.position.y=o.baseY+Math.sin(t*1.4+o.phase)*.16;o.mesh.visibility=.45+.55*(.5+.5*Math.sin(t*2+o.phase));});
      waterMeshes.forEach(w=>{w.mesh.position.x=w.x+Math.sin(t*1.5+w.phase)*.025;w.mesh.scaling.y=1+Math.sin(t*3+w.phase)*.025;});
      companions.forEach(o=>{o.root.position.y=o.baseY+Math.sin(t*o.speed+o.phase)*.09;o.root.rotation.z=Math.sin(t*.9+o.phase)*.055;});
      queenRoot.rotation.y=Math.sin(t*.65)*.12;
      queenArms.forEach(a=>{a.mesh.rotation.z=a.side*.45+Math.sin(t*1.7+a.side)*.14;});
      dragonWings.forEach(w=>{w.mesh.rotation.z=w.side*-.55+Math.sin(t*7+w.side)*.3;});
      dragonRoot.rotation.y=Math.PI+Math.sin(t*.8+1.4)*.13;
      // Gentle living motion keeps every candy visibly glossy and alive.
      for(const candy of candyMeshes.values()){
        if(!candy||candy.isDisposed())continue;
        const md=candy.metadata||{};
        candy.rotation.y=Math.sin(t*1.25+md.r*.7+md.c*.45)*.075;
        candy.rotation.z=Math.sin(t*1.7+md.r+md.c)*.022;
      }
    });
  }
  function init(){
    try{
    unlocked=Math.max(1,Math.min(LEVELS.length,Number(localStorage.getItem("cmr-unlocked")||1)));
    engine=new BABYLON.Engine(canvas,true,{alpha:true,preserveDrawingBuffer:false,stencil:true,antialias:true,powerPreference:"high-performance"});
    scene=new BABYLON.Scene(engine);scene.clearColor=new BABYLON.Color4(.12,.055,.22,0);
    camera=new BABYLON.ArcRotateCamera("camera",-Math.PI/2,Math.PI/2-.34,12.4,new BABYLON.Vector3(0,0,0),scene);camera.mode=BABYLON.Camera.ORTHOGRAPHIC_CAMERA;camera.inputs.clear();
    const resize=()=>{const aspect=canvas.clientWidth/Math.max(1,canvas.clientHeight),halfWidth=5.35;camera.orthoLeft=-halfWidth;camera.orthoRight=halfWidth;camera.orthoTop=halfWidth/Math.max(.45,aspect);camera.orthoBottom=-camera.orthoTop;};resize();scene.onBeforeRenderObservable.add(resize);
    const hemi=new BABYLON.HemisphericLight("hemi",new BABYLON.Vector3(0,1,-1),scene);hemi.intensity=.95;hemi.groundColor=new BABYLON.Color3(.32,.2,.48);
    keyLight=new BABYLON.PointLight("key",new BABYLON.Vector3(-3,5,-5),scene);keyLight.intensity=.8;keyLight.diffuse=new BABYLON.Color3(1,.78,.95);
    rim=new BABYLON.PointLight("rim",new BABYLON.Vector3(4,-3,-2),scene);rim.intensity=.45;rim.diffuse=new BABYLON.Color3(.35,.55,1);
    createKingdomAmbience();
    loadRoyalCandyModels();
    makeInitialBoard();drawBoard();canvas.addEventListener("pointerdown",pointerDown);canvas.addEventListener("pointerup",pointerUp);canvas.addEventListener("pointercancel",()=>pointerStart=null);
    engine.runRenderLoop(()=>scene.render());window.addEventListener("resize",()=>engine.resize());
    $("storyText").textContent=levelData().story;updateHud();buildMap();setTimeout(()=>loading.classList.add("hidden"),350);
    }catch(error){console.error("Candy Magic Royale startup failed:",error);loading.textContent="Magic is loading — "+(error&&error.message?error.message:"3D setup error");loading.classList.remove("hidden");}
  }
  $("restartButton").addEventListener("click",restart);$("shuffleButton").addEventListener("click",shuffle);
  $("mapButton").addEventListener("click",()=>{$("mapOverlay").classList.add("open");buildMap();});
  $("closeMap").addEventListener("click",()=>$("mapOverlay").classList.remove("open"));
  $("nextLevel").addEventListener("click",nextLevel);$("replayLevel").addEventListener("click",()=>{$("winOverlay").classList.remove("open");restart();});
  $("soundButton").addEventListener("click",()=>{soundOn=!soundOn;$("soundButton").textContent=soundOn?"♫":"♪";toast(soundOn?"Sound enabled":"Sound muted");});
  if(window.BABYLON)init();else loading.textContent="Could not load the 3D engine. Check your internet connection.";
})();