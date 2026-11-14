(function () {
  "use strict";
  const canvas = document.getElementById("renderCanvas");
  const loading = document.getElementById("loading");
  const scoreEl = document.getElementById("score");
  const movesEl = document.getElementById("moves");
  const statusEl = document.getElementById("status");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const toastEl = document.getElementById("toast");
  const SIZE = 8, TYPES = 6, GOAL = 1500, START_MOVES = 25;
  const COLORS = ["#ff5fa9", "#54d9ff", "#ffd34f", "#9c75ff", "#70e58d", "#ff8b45"];
  const EMOJIS = ["🍓", "💎", "🍋", "🫐", "🍏", "🍊"];
  let engine, scene, camera, boardRoot, board = [], score = 0, moves = START_MOVES;
  let busy = false, selected = null, pointerStart = null, soundOn = true, toastTimer;
  const meshes = new Map();

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1700);
  }
  function updateHud() {
    scoreEl.textContent = score.toLocaleString();
    movesEl.textContent = moves;
    const pct = Math.min(100, Math.round(score / GOAL * 100));
    progressFill.style.width = pct + "%";
    progressText.textContent = pct + "%";
    if (score >= GOAL) statusEl.textContent = "Garden restored! ✨";
    else if (moves <= 0) statusEl.textContent = "Out of moves";
    else statusEl.textContent = "Make a match!";
  }
  function randType() { return Math.floor(Math.random() * TYPES); }
  function cellKey(r, c) { return r + "," + c; }
  function makeInitialBoard() {
    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      let t, tries = 0;
      do {
        t = randType(); tries++;
      } while (tries < 30 && ((c >= 2 && board[r][c-1] === t && board[r][c-2] === t) ||
        (r >= 2 && board[r-1][c] === t && board[r-2][c] === t)));
      board[r][c] = t;
    }
  }
  function createCandy(type, r, c) {
    const root = new BABYLON.TransformNode("candy-" + r + "-" + c, scene);
    root.position.set(c - (SIZE - 1) / 2, (SIZE - 1) / 2 - r, 0);
    const body = BABYLON.MeshBuilder.CreateSphere("sweet", { diameter: 0.78, segments: 24 }, scene);
    body.parent = root;
    body.scaling.set(1, 1, 0.76);
    const mat = new BABYLON.PBRMaterial("candyMat-" + type, scene);
    mat.albedoColor = BABYLON.Color3.FromHexString(COLORS[type]);
    mat.metallic = 0.08; mat.roughness = 0.2;
    mat.emissiveColor = BABYLON.Color3.FromHexString(COLORS[type]).scale(0.10);
    body.material = mat;
    const shine = BABYLON.MeshBuilder.CreateSphere("shine", { diameter: 0.16, segments: 12 }, scene);
    shine.parent = root; shine.position.set(-0.18, 0.2, -0.28); shine.scaling.set(1.35, 0.7, 0.35);
    const shineMat = new BABYLON.StandardMaterial("shineMat", scene);
    shineMat.diffuseColor = BABYLON.Color3.White(); shineMat.emissiveColor = new BABYLON.Color3(0.35,0.35,0.35);
    shineMat.alpha = 0.88; shine.material = shineMat;
    root.metadata = { r, c, type, body };
    meshes.set(root.uniqueId, root);
    return root;
  }
  function drawBoard() {
    if (boardRoot) boardRoot.dispose();
    boardRoot = new BABYLON.TransformNode("boardRoot", scene);
    const back = BABYLON.MeshBuilder.CreateBox("board-back", { width: 8.45, height: 8.45, depth: 0.35 }, scene);
    back.parent = boardRoot; back.position.z = 0.22;
    const backMat = new BABYLON.StandardMaterial("boardMat", scene);
    backMat.diffuseColor = new BABYLON.Color3(0.18, 0.08, 0.32);
    backMat.emissiveColor = new BABYLON.Color3(0.08, 0.025, 0.15);
    backMat.specularColor = new BABYLON.Color3(0.45,0.3,0.6); back.material = backMat;
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const tile = BABYLON.MeshBuilder.CreateBox("tile", { width: 0.94, height: 0.94, depth: 0.12 }, scene);
      tile.parent = boardRoot; tile.position.set(c-3.5, 3.5-r, 0);
      const tm = new BABYLON.StandardMaterial("tileMat-" + r + "-" + c, scene);
      tm.diffuseColor = new BABYLON.Color3(0.38,0.22,0.55); tm.alpha = 0.62;
      tm.specularColor = new BABYLON.Color3(0.6,0.45,0.8); tile.material = tm;
    }
    boardRoot.addChild(back);
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const candy = createCandy(board[r][c], r, c);
      candy.parent = boardRoot;
    }
  }
  function getCandy(r,c) {
    for (const m of meshes.values()) if (!m.isDisposed() && m.parent === boardRoot && m.metadata.r === r && m.metadata.c === c) return m;
    return null;
  }
  function allMatches() {
    const found = new Set();
    for (let r = 0; r < SIZE; r++) {
      let start = 0;
      while (start < SIZE) {
        let end = start + 1;
        while (end < SIZE && board[r][end] === board[r][start]) end++;
        if (board[r][start] != null && end - start >= 3) for (let c = start; c < end; c++) found.add(cellKey(r,c));
        start = end;
      }
    }
    for (let c = 0; c < SIZE; c++) {
      let start = 0;
      while (start < SIZE) {
        let end = start + 1;
        while (end < SIZE && board[end][c] === board[start][c]) end++;
        if (board[start][c] != null && end - start >= 3) for (let r = start; r < end; r++) found.add(cellKey(r,c));
        start = end;
      }
    }
    return found;
  }
  function animatePosition(mesh, target, done) {
    const anim = new BABYLON.Animation("move", "position", 12, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    anim.setKeys([{frame:0,value:mesh.position.clone()},{frame:8,value:target.clone()}]);
    mesh.animations = [anim];
    scene.beginAnimation(mesh, 0, 8, false, 1, done);
  }
  function swapData(a,b) {
    const temp = board[a.r][a.c]; board[a.r][a.c] = board[b.r][b.c]; board[b.r][b.c] = temp;
    const ma = getCandy(a.r,a.c), mb = getCandy(b.r,b.c);
    if (ma) ma.metadata = { ...ma.metadata, r:b.r, c:b.c };
    if (mb) mb.metadata = { ...mb.metadata, r:a.r, c:a.c };
    if (ma) animatePosition(ma, new BABYLON.Vector3(b.c-3.5,3.5-b.r,0), ()=>{});
    if (mb) animatePosition(mb, new BABYLON.Vector3(a.c-3.5,3.5-a.r,0), ()=>{});
  }
  function areNeighbors(a,b) { return Math.abs(a.r-b.r) + Math.abs(a.c-b.c) === 1; }
  function resolveMatches() {
    const matches = allMatches();
    if (!matches.size) { busy = false; return; }
    score += matches.size * 60;
    updateHud();
    for (const key of matches) {
      const [r,c] = key.split(",").map(Number);
      const candy = getCandy(r,c);
      if (candy) {
        const scale = new BABYLON.Animation("pop","scaling",12,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        scale.setKeys([{frame:0,value:candy.scaling.clone()},{frame:6,value:new BABYLON.Vector3(0.05,0.05,0.05)}]);
        candy.animations=[scale]; scene.beginAnimation(candy,0,6,false,1,()=>{candy.dispose();});
      }
      board[r][c] = null;
    }
    setTimeout(dropAndRefill, 170);
  }
  function dropAndRefill() {
    for (let c = 0; c < SIZE; c++) {
      const survivors = [];
      for (let r = SIZE-1; r >= 0; r--) if (board[r][c] !== null) survivors.push(board[r][c]);
      let write = SIZE-1;
      for (const type of survivors) board[write--][c] = type;
      while (write >= 0) board[write--][c] = randType();
    }
    for (const m of Array.from(meshes.values())) {
      if (m.isDisposed() || m.parent !== boardRoot) continue;
      const {r,c} = m.metadata;
      if (board[r][c] !== m.metadata.type) {
        // A matched candy has already been disposed; remaining candies are repositioned below.
      }
    }
    // Rebuild only candy meshes after gravity; the board tiles stay in place.
    for (const m of Array.from(meshes.values())) if (!m.isDisposed() && m.parent === boardRoot) m.dispose();
    for (let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) createCandy(board[r][c],r,c).parent=boardRoot;
    setTimeout(() => {
      const before = allMatches();
      if (before.size) resolveMatches();
      else { busy = false; if (moves <= 0) showToast("No moves left — restart to play again"); }
      updateHud();
    }, 220);
  }
  function trySwap(a,b) {
    if (busy || moves <= 0 || score >= GOAL || !areNeighbors(a,b)) return;
    busy = true; selected = null;
    swapData(a,b);
    setTimeout(() => {
      if (allMatches().size) { moves--; updateHud(); resolveMatches(); }
      else {
        swapData(a,b);
        setTimeout(()=>{busy=false;},180);
      }
    }, 190);
  }
  function pickCell(point) {
    const ray = scene.createPickingRay(point.x, point.y, BABYLON.Matrix.Identity(), camera);
    const hit = scene.pickWithRay(ray, mesh => mesh && mesh.name === "sweet");
    if (!hit || !hit.hit || !hit.pickedMesh || !hit.pickedMesh.parent) return null;
    const md = hit.pickedMesh.parent.metadata;
    return md ? {r:md.r,c:md.c} : null;
  }
  function onPointerDown(evt) {
    if (busy) return;
    const rect=canvas.getBoundingClientRect();
    pointerStart={x:evt.clientX-rect.left,y:evt.clientY-rect.top,cell:null};
    const p=new BABYLON.Vector2(pointerStart.x/canvas.clientWidth*engine.getRenderWidth(),pointerStart.y/canvas.clientHeight*engine.getRenderHeight());
    pointerStart.cell=pickCell(p);
  }
  function onPointerUp(evt) {
    if (!pointerStart || !pointerStart.cell || busy) {pointerStart=null;return;}
    const rect=canvas.getBoundingClientRect(), dx=evt.clientX-(rect.left+pointerStart.x), dy=evt.clientY-(rect.top+pointerStart.y);
    let target=null;
    if (Math.abs(dx)+Math.abs(dy)>12) {
      const start=pointerStart.cell;
      if(Math.abs(dx)>Math.abs(dy)) target={r:start.r,c:start.c+(dx>0?1:-1)};
      else target={r:start.r+(dy>0?1:-1),c:start.c};
      if(target.r>=0&&target.r<SIZE&&target.c>=0&&target.c<SIZE) trySwap(start,target);
    } else {
      const p=new BABYLON.Vector2((evt.clientX-rect.left)/canvas.clientWidth*engine.getRenderWidth(),(evt.clientY-rect.top)/canvas.clientHeight*engine.getRenderHeight());
      const cell=pickCell(p);
      if(cell){
        if(selected&&areNeighbors(selected,cell)) trySwap(selected,cell);
        else selected=cell;
      }
    }
    pointerStart=null;
  }
  function restart() {
    if (boardRoot) boardRoot.dispose();
    for (const m of meshes.values()) if (m && !m.isDisposed()) m.dispose();
    meshes.clear(); score=0; moves=START_MOVES; busy=false; selected=null;
    makeInitialBoard(); drawBoard(); updateHud(); showToast("A fresh spell begins!");
  }
  function shuffle() {
    if (busy || moves<=0) return;
    makeInitialBoard();
    for (const m of Array.from(meshes.values())) if(m&&!m.isDisposed())m.dispose();
    meshes.clear(); drawBoard(); showToast("The candies have been shuffled!");
  }
  function init() {
    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer:false, stencil:true, antialias:true, powerPreference:"high-performance" });
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.12,0.055,0.22,1);
    camera = new BABYLON.ArcRotateCamera("camera", -Math.PI/2, Math.PI/2 - 0.12, 10.8, new BABYLON.Vector3(0,0,0), scene);
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    camera.attachControl(canvas, false);
    const resizeCamera=()=>{
      const aspect=canvas.clientWidth/Math.max(1,canvas.clientHeight);
      const half=4.55;
      camera.orthoLeft=-half*aspect; camera.orthoRight=half*aspect;
      camera.orthoTop=half; camera.orthoBottom=-half;
    };
    resizeCamera();
    scene.onBeforeRenderObservable.add(resizeCamera);
    const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0,1,-1), scene);
    hemi.intensity=0.95; hemi.groundColor=new BABYLON.Color3(0.32,0.2,0.48);
    const key = new BABYLON.PointLight("key", new BABYLON.Vector3(-3,5,-5), scene);
    key.intensity=0.8; key.diffuse=new BABYLON.Color3(1,0.78,0.95);
    const rim = new BABYLON.PointLight("rim", new BABYLON.Vector3(4,-3,-2), scene);
    rim.intensity=0.45; rim.diffuse=new BABYLON.Color3(0.35,0.55,1);
    makeInitialBoard(); drawBoard();
    canvas.addEventListener("pointerdown",onPointerDown);
    canvas.addEventListener("pointerup",onPointerUp);
    canvas.addEventListener("pointercancel",()=>pointerStart=null);
    engine.runRenderLoop(()=>scene.render());
    window.addEventListener("resize",()=>engine.resize());
    updateHud();
    setTimeout(()=>loading.classList.add("hidden"),350);
  }
  document.getElementById("restartButton").addEventListener("click",restart);
  document.getElementById("shuffleButton").addEventListener("click",shuffle);
  document.getElementById("soundButton").addEventListener("click",()=>{
    soundOn=!soundOn;
    document.getElementById("soundButton").textContent=soundOn?"♫":"♪";
    showToast(soundOn?"Sound enabled":"Sound muted");
  });
  if (window.BABYLON) init();
  else { loading.textContent="Could not load the 3D engine. Check your internet connection."; }
})();