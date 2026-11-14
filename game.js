/**
 * Candy Magic Royale — Babylon.js 3D Match-3 Engine (Upgraded)
 * Integrates:
 *  1. Procedural 100,000-level generator (levels_engine.js -> generateInfiniteLevel)
 *  2. Special Candies (Striped H/V, Wrapped 3x3, Rainbow Color Bomb) + Chain Combos
 *  3. Four Power-Up Boosters (Sugar Mallet, Magic Wand, Rainbow Rocket, +5 Moves)
 *  4. Touch Swipe & Tap-to-Swap picking + Particle Bursts + LocalStorage Progress
 */

(() => {
  "use strict";

  const GRID_SIZE = 8;
  const CELL_SPACING = 1.18;
  const BOARD_OFFSET = -((GRID_SIZE - 1) * CELL_SPACING) / 2;

  const CANDY_PALETTE = [
    { id: 1, name: "heart", color: new BABYLON.Color3(0.95, 0.16, 0.32), emissive: new BABYLON.Color3(0.35, 0.03, 0.08) },
    { id: 2, name: "orange", color: new BABYLON.Color3(1.0, 0.52, 0.08), emissive: new BABYLON.Color3(0.35, 0.14, 0.02) },
    { id: 3, name: "star", color: new BABYLON.Color3(1.0, 0.84, 0.12), emissive: new BABYLON.Color3(0.32, 0.25, 0.02) },
    { id: 4, name: "leaf", color: new BABYLON.Color3(0.18, 0.82, 0.36), emissive: new BABYLON.Color3(0.04, 0.28, 0.08) },
    { id: 5, name: "diamond", color: new BABYLON.Color3(0.14, 0.68, 1.0), emissive: new BABYLON.Color3(0.03, 0.22, 0.38) },
    { id: 6, name: "jelly", color: new BABYLON.Color3(0.68, 0.24, 0.96), emissive: new BABYLON.Color3(0.24, 0.05, 0.35) },
  ];

  const SPECIAL = {
    NONE: "none",
    STRIPED_H: "striped_h",
    STRIPED_V: "striped_v",
    WRAPPED: "wrapped",
    COLOR_BOMB: "color_bomb",
  };

  const STORAGE_KEY = "candy_magic_royale_save_v2";

  const state = {
    levelNumber: 1,
    score: 0,
    targetScore: 1500,
    movesLeft: 25,
    colorsCount: 5,
    stars: 0,
    coins: 500,
    boosters: {
      mallet: 3,
      wand: 3,
      rocket: 2,
      moves5: 2,
    },
    activeBooster: null,
    grid: [], // 8x8 of { typeId, special, isObstacle, mesh, badgeMesh }
    isBusy: false,
    selectedCell: null,
    pointerDownCell: null,
    pointerDownPos: null,
    gameOver: false,
  };

  let canvas, engine, scene, camera, glowLayer;

  // --- Persistence ---
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.levelNumber === "number") state.levelNumber = Math.max(1, saved.levelNumber);
      if (typeof saved.stars === "number") state.stars = saved.stars;
      if (typeof saved.coins === "number") state.coins = saved.coins;
      if (saved.boosters) Object.assign(state.boosters, saved.boosters);
    } catch (_) {
      // Ignore storage errors on restricted mobile webviews
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          levelNumber: state.levelNumber,
          stars: state.stars,
          coins: state.coins,
          boosters: state.boosters,
        })
      );
    } catch (_) {}
  }

  // --- Fallback Procedural Level Generator (used if levels_engine.js isn't loaded) ---
  function getLevelConfig(levelNumber) {
    if (typeof window.generateInfiniteLevel === "function") {
      return window.generateInfiniteLevel(levelNumber);
    }
    const seed = levelNumber * 1234.567;
    const seededRandom = (s) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };
    const targetScore = Math.floor(1200 + levelNumber * 350);
    const movesLimit = Math.max(12, Math.floor(32 - Math.log10(Math.max(1, levelNumber)) * 4));
    const colorsCount = Math.min(6, 4 + Math.floor(levelNumber / 15));
    const obstaclesRatio = Math.min(0.22, 0.04 + Math.sqrt(levelNumber) * 0.001);

    const grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const tileSeed = seed + (r * GRID_SIZE + c);
        const isObstacle = levelNumber >= 3 && seededRandom(tileSeed) < obstaclesRatio;
        row.push({
          r,
          c,
          typeId: isObstacle ? -1 : Math.floor(seededRandom(tileSeed + 99) * colorsCount) + 1,
          isObstacle,
        });
      }
      grid.push(row);
    }
    return { levelNumber, targetScore, movesLimit, colorsCount, grid };
  }

  // --- Coordinate Helpers ---
  function gridToWorld(r, c) {
    return new BABYLON.Vector3(
      BOARD_OFFSET + c * CELL_SPACING,
      -(BOARD_OFFSET + r * CELL_SPACING),
      0
    );
  }

  // --- Babylon.js Scene Setup ---
  function initScene() {
    canvas = document.getElementById("renderCanvas") || document.querySelector("canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "renderCanvas";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      document.body.appendChild(canvas);
    }

    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent to show enchanted kingdom backdrop

    camera = new BABYLON.ArcRotateCamera(
      "mainCam",
      -Math.PI / 2,
      Math.PI / 2,
      13.5,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.lowerRadiusLimit = 11;
    camera.upperRadiusLimit = 16;
    camera.inputs.clear(); // Lock camera for crisp mobile touch picking

    const hemi = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, -1), scene);
    hemi.intensity = 1.05;

    const dir = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0.4, -0.8, 0.9), scene);
    dir.position = new BABYLON.Vector3(-4, 8, -8);
    dir.intensity = 0.85;

    glowLayer = new BABYLON.GlowLayer("glow", scene);
    glowLayer.intensity = 0.45;

    createBoardFrame();
    bindPointerEvents();
    ensureBoosterBarUI();

    engine.runRenderLoop(() => {
      scene.render();
    });
    window.addEventListener("resize", () => engine.resize());
  }

  function createBoardFrame() {
    const boardBg = BABYLON.MeshBuilder.CreateBox(
      "boardFrame",
      { width: GRID_SIZE * CELL_SPACING + 0.5, height: GRID_SIZE * CELL_SPACING + 0.5, depth: 0.35 },
      scene
    );
    boardBg.position.z = 0.55;
    const frameMat = new BABYLON.StandardMaterial("frameMat", scene);
    frameMat.diffuseColor = new BABYLON.Color3(0.18, 0.08, 0.34);
    frameMat.specularColor = new BABYLON.Color3(0.5, 0.35, 0.7);
    frameMat.alpha = 0.72;
    boardBg.material = frameMat;

    // Tile backing cells
    const cellMat = new BABYLON.StandardMaterial("cellMat", scene);
    cellMat.diffuseColor = new BABYLON.Color3(0.28, 0.14, 0.5);
    cellMat.alpha = 0.55;

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const tile = BABYLON.MeshBuilder.CreateBox(
          `tile_${r}_${c}`,
          { width: CELL_SPACING * 0.92, height: CELL_SPACING * 0.92, depth: 0.12 },
          scene
        );
        const pos = gridToWorld(r, c);
        tile.position = new BABYLON.Vector3(pos.x, pos.y, 0.32);
        tile.material = cellMat;
        tile.metadata = { r, c, isTile: true };
      }
    }
  }

  // --- 3D Candy & Obstacle Mesh Builders ---
  function createCandyMesh(r, c, typeId, special = SPECIAL.NONE, isObstacle = false) {
    const pos = gridToWorld(r, c);
    let mesh;

    if (isObstacle) {
      mesh = BABYLON.MeshBuilder.CreateBox(`obs_${r}_${c}_${Date.now()}`, { size: 0.84 }, scene);
      const mat = new BABYLON.StandardMaterial("obsMat", scene);
      mat.diffuseColor = new BABYLON.Color3(0.32, 0.18, 0.12); // Chocolate block
      mat.specularColor = new BABYLON.Color3(0.45, 0.28, 0.2);
      mesh.material = mat;
      mesh.position = pos.clone();
      mesh.metadata = { r, c };
      return { mesh, badgeMesh: null };
    }

    if (special === SPECIAL.COLOR_BOMB) {
      mesh = BABYLON.MeshBuilder.CreateSphere(`bomb_${r}_${c}_${Date.now()}`, { diameter: 0.9, segments: 20 }, scene);
      const mat = new BABYLON.StandardMaterial("bombMat", scene);
      mat.diffuseColor = new BABYLON.Color3(0.15, 0.1, 0.2);
      mat.emissiveColor = new BABYLON.Color3(0.85, 0.35, 0.95);
      mat.specularPower = 64;
      mesh.material = mat;
    } else {
      const palette = CANDY_PALETTE[(typeId - 1) % CANDY_PALETTE.length];
      switch (typeId) {
        case 1: // Heart / Ruby Gem
          mesh = BABYLON.MeshBuilder.CreatePolyhedron(`candy_${r}_${c}`, { type: 1, size: 0.44 }, scene);
          break;
        case 2: // Orange Sphere
          mesh = BABYLON.MeshBuilder.CreateSphere(`candy_${r}_${c}`, { diameter: 0.86, segments: 18 }, scene);
          break;
        case 3: // Star Octahedron
          mesh = BABYLON.MeshBuilder.CreatePolyhedron(`candy_${r}_${c}`, { type: 2, size: 0.45 }, scene);
          break;
        case 4: // Leaf Capsule
          mesh = BABYLON.MeshBuilder.CreateCapsule(`candy_${r}_${c}`, { radius: 0.32, height: 0.82 }, scene);
          break;
        case 5: // Diamond
          mesh = BABYLON.MeshBuilder.CreatePolyhedron(`candy_${r}_${c}`, { type: 0, size: 0.44 }, scene);
          break;
        default: // Purple Jelly Cube
          mesh = BABYLON.MeshBuilder.CreateBox(`candy_${r}_${c}`, { size: 0.78 }, scene);
          break;
      }

      const mat = new BABYLON.StandardMaterial(`candyMat_${typeId}_${Date.now()}`, scene);
      mat.diffuseColor = palette.color;
      mat.emissiveColor = palette.emissive;
      mat.specularColor = new BABYLON.Color3(1, 1, 1);
      mat.specularPower = 48;
      mesh.material = mat;
    }

    mesh.position = pos.clone();
    mesh.metadata = { r, c };

    let badgeMesh = null;
    if (special === SPECIAL.STRIPED_H || special === SPECIAL.STRIPED_V) {
      badgeMesh = BABYLON.MeshBuilder.CreateTorus(
        `stripe_${r}_${c}`,
        { diameter: 0.94, thickness: 0.1, tessellation: 24 },
        scene
      );
      badgeMesh.parent = mesh;
      if (special === SPECIAL.STRIPED_V) badgeMesh.rotation.y = Math.PI / 2;
      const bMat = new BABYLON.StandardMaterial("stripeMat", scene);
      bMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
      badgeMesh.material = bMat;
    } else if (special === SPECIAL.WRAPPED) {
      badgeMesh = BABYLON.MeshBuilder.CreateBox(`wrap_${r}_${c}`, { size: 0.94 }, scene);
      badgeMesh.parent = mesh;
      const wMat = new BABYLON.StandardMaterial("wrapMat", scene);
      wMat.diffuseColor = new BABYLON.Color3(1, 0.9, 0.4);
      wMat.alpha = 0.35;
      wMat.emissiveColor = new BABYLON.Color3(0.6, 0.45, 0.1);
      badgeMesh.material = wMat;
    }

    return { mesh, badgeMesh };
  }

  // --- Level Lifecycle ---
  function startLevel(levelNum) {
    clearBoardMeshes();
    const config = getLevelConfig(levelNum);
    state.levelNumber = config.levelNumber;
    state.targetScore = config.targetScore;
    state.movesLeft = config.movesLimit;
    state.colorsCount = config.colorsCount;
    state.score = 0;
    state.gameOver = false;
    state.isBusy = false;
    state.activeBooster = null;
    state.selectedCell = null;

    state.grid = Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (_, c) => {
        const src = config.grid[r][c];
        return {
          typeId: src.typeId,
          special: SPECIAL.NONE,
          isObstacle: src.isObstacle,
          mesh: null,
          badgeMesh: null,
        };
      })
    );

    // Prevent pre-existing 3-in-a-row on initial spawn
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (state.grid[r][c].isObstacle) continue;
        while (
          (c >= 2 &&
            state.grid[r][c].typeId === state.grid[r][c - 1].typeId &&
            state.grid[r][c].typeId === state.grid[r][c - 2].typeId) ||
          (r >= 2 &&
            state.grid[r][c].typeId === state.grid[r - 1][c].typeId &&
            state.grid[r][c].typeId === state.grid[r - 2][c].typeId)
        ) {
          state.grid[r][c].typeId = Math.floor(Math.random() * state.colorsCount) + 1;
        }
      }
    }

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = state.grid[r][c];
        const built = createCandyMesh(r, c, cell.typeId, cell.special, cell.isObstacle);
        cell.mesh = built.mesh;
        cell.badgeMesh = built.badgeMesh;
      }
    }

    updateHUD();
  }

  function clearBoardMeshes() {
    for (let r = 0; r < state.grid.length; r++) {
      for (let c = 0; c < state.grid[r].length; c++) {
        const cell = state.grid[r][c];
        if (cell?.mesh) cell.mesh.dispose();
      }
    }
  }

  // --- Pointer / Touch Picking & Swapping ---
  function bindPointerEvents() {
    scene.onPointerObservable.add((pointerInfo) => {
      if (state.isBusy || state.gameOver) return;

      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        const pick = scene.pick(scene.pointerX, scene.pointerY);
        const cellPos = extractCellFromPick(pick);
        if (!cellPos) return;

        // If a booster is armed, execute it on the tapped cell
        if (state.activeBooster) {
          applyActiveBooster(cellPos.r, cellPos.c);
          return;
        }

        state.pointerDownCell = cellPos;
        state.pointerDownPos = { x: scene.pointerX, y: scene.pointerY };
      } else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
        if (!state.pointerDownCell || !state.pointerDownPos) return;
        const dx = scene.pointerX - state.pointerDownPos.x;
        const dy = scene.pointerY - state.pointerDownPos.y;
        const start = state.pointerDownCell;
        state.pointerDownCell = null;
        state.pointerDownPos = null;

        if (Math.hypot(dx, dy) > 22) {
          // Touch swipe detected
          let dr = 0, dc = 0;
          if (Math.abs(dx) > Math.abs(dy)) dc = dx > 0 ? 1 : -1;
          else dr = dy > 0 ? 1 : -1;
          const nr = start.r + dr;
          const nc = start.c + dc;
          if (inBounds(nr, nc)) {
            attemptSwap(start.r, start.c, nr, nc);
          }
        } else {
          // Tap-to-select fallback
          handleTapSelection(start.r, start.c);
        }
      }
    });
  }

  function extractCellFromPick(pick) {
    if (!pick || !pick.hit || !pick.pickedMesh || !pick.pickedMesh.metadata) return null;
    const { r, c } = pick.pickedMesh.metadata;
    if (typeof r !== "number" || typeof c !== "number") return null;
    return { r, c };
  }

  function handleTapSelection(r, c) {
    if (state.grid[r][c].isObstacle) return;
    if (!state.selectedCell) {
      state.selectedCell = { r, c };
      if (state.grid[r][c].mesh) state.grid[r][c].mesh.scaling.setAll(1.16);
      return;
    }

    const prev = state.selectedCell;
    if (state.grid[prev.r][prev.c].mesh) state.grid[prev.r][prev.c].mesh.scaling.setAll(1);
    state.selectedCell = null;

    if (Math.abs(prev.r - r) + Math.abs(prev.c - c) === 1) {
      attemptSwap(prev.r, prev.c, r, c);
    } else if (prev.r !== r || prev.c !== c) {
      state.selectedCell = { r, c };
      if (state.grid[r][c].mesh) state.grid[r][c].mesh.scaling.setAll(1.16);
    }
  }

  function inBounds(r, c) {
    return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
  }

  // --- Swap, Match Detection & Special Candy Creation ---
  async function attemptSwap(r1, c1, r2, c2) {
    const a = state.grid[r1][c1];
    const b = state.grid[r2][c2];
    if (a.isObstacle || b.isObstacle) return;

    state.isBusy = true;
    await animateSwap(r1, c1, r2, c2);

    // Color bomb swapped with any candy clears all of that color
    if (a.special === SPECIAL.COLOR_BOMB || b.special === SPECIAL.COLOR_BOMB) {
      state.movesLeft--;
      const targetType = a.special === SPECIAL.COLOR_BOMB ? b.typeId : a.typeId;
      const clearSet = new Set([`${r1},${c1}`, `${r2},${c2}`]);
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (state.grid[r][c].typeId === targetType) clearSet.add(`${r},${c}`);
        }
      }
      await resolveClearSet(clearSet, []);
      await cascadeAndRefill();
      checkEndState();
      state.isBusy = false;
      return;
    }

    const matches = findMatches();
    if (matches.groups.length === 0) {
      await animateSwap(r1, c1, r2, c2); // Revert invalid swap
      state.isBusy = false;
      return;
    }

    state.movesLeft--;
    await processMatches(matches, { r: r2, c: c2 });
    await cascadeAndRefill();
    checkEndState();
    state.isBusy = false;
  }

  function animateSwap(r1, c1, r2, c2) {
    return new Promise((resolve) => {
      const a = state.grid[r1][c1];
      const b = state.grid[r2][c2];
      state.grid[r1][c1] = b;
      state.grid[r2][c2] = a;

      if (a.mesh) a.mesh.metadata = { r: r2, c: c2 };
      if (b.mesh) b.mesh.metadata = { r: r1, c: c1 };

      const posA = gridToWorld(r2, c2);
      const posB = gridToWorld(r1, c1);
      if (a.mesh) a.mesh.position.copyFrom(posA);
      if (b.mesh) b.mesh.position.copyFrom(posB);

      setTimeout(resolve, 160);
    });
  }

  function findMatches() {
    const horiz = [];
    const vert = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      let run = [{ r, c: 0 }];
      for (let c = 1; c < GRID_SIZE; c++) {
        const cur = state.grid[r][c];
        const prev = state.grid[r][c - 1];
        if (!cur.isObstacle && !prev.isObstacle && cur.typeId > 0 && cur.typeId === prev.typeId) {
          run.push({ r, c });
        } else {
          if (run.length >= 3) horiz.push(run);
          run = [{ r, c }];
        }
      }
      if (run.length >= 3) horiz.push(run);
    }

    for (let c = 0; c < GRID_SIZE; c++) {
      let run = [{ r: 0, c }];
      for (let r = 1; r < GRID_SIZE; r++) {
        const cur = state.grid[r][c];
        const prev = state.grid[r - 1][c];
        if (!cur.isObstacle && !prev.isObstacle && cur.typeId > 0 && cur.typeId === prev.typeId) {
          run.push({ r, c });
        } else {
          if (run.length >= 3) vert.push(run);
          run = [{ r, c }];
        }
      }
      if (run.length >= 3) vert.push(run);
    }

    return { horiz, vert, groups: [...horiz, ...vert] };
  }

  async function processMatches(matches, pivotCell) {
    const clearSet = new Set();
    const spawns = [];

    // Detect L/T intersections for Wrapped Candy
    const horizKeys = new Set();
    matches.horiz.forEach((g) => g.forEach((p) => horizKeys.add(`${p.r},${p.c}`)));
    const intersections = new Set();
    matches.vert.forEach((g) =>
      g.forEach((p) => {
        const k = `${p.r},${p.c}`;
        if (horizKeys.has(k)) intersections.add(k);
      })
    );

    intersections.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      spawns.push({ r, c, typeId: state.grid[r][c].typeId, special: SPECIAL.WRAPPED });
    });

    for (const group of matches.groups) {
      group.forEach((p) => clearSet.add(`${p.r},${p.c}`));
      if (group.length >= 5) {
        const spot = pickSpawnSpot(group, pivotCell);
        spawns.push({ r: spot.r, c: spot.c, typeId: 0, special: SPECIAL.COLOR_BOMB });
      } else if (group.length === 4) {
        const spot = pickSpawnSpot(group, pivotCell);
        const isHoriz = group[0].r === group[1].r;
        spawns.push({
          r: spot.r,
          c: spot.c,
          typeId: state.grid[spot.r][spot.c].typeId,
          special: isHoriz ? SPECIAL.STRIPED_V : SPECIAL.STRIPED_H,
        });
      }
    }

    await resolveClearSet(clearSet, spawns);
  }

  function pickSpawnSpot(group, pivot) {
    if (pivot) {
      const hit = group.find((p) => p.r === pivot.r && p.c === pivot.c);
      if (hit) return hit;
    }
    return group[Math.floor(group.length / 2)];
  }

  async function resolveClearSet(clearSet, spawns) {
    // Expand special candy chain reactions
    const queue = Array.from(clearSet);
    const processedSpecials = new Set();

    while (queue.length > 0) {
      const key = queue.shift();
      if (processedSpecials.has(key)) continue;
      const [r, c] = key.split(",").map(Number);
      const cell = state.grid[r]?.[c];
      if (!cell || cell.special === SPECIAL.NONE) continue;

      processedSpecials.add(key);
      if (cell.special === SPECIAL.STRIPED_H) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const nk = `${r},${col}`;
          if (!clearSet.has(nk)) {
            clearSet.add(nk);
            queue.push(nk);
          }
        }
      } else if (cell.special === SPECIAL.STRIPED_V) {
        for (let row = 0; row < GRID_SIZE; row++) {
          const nk = `${row},${c}`;
          if (!clearSet.has(nk)) {
            clearSet.add(nk);
            queue.push(nk);
          }
        }
      } else if (cell.special === SPECIAL.WRAPPED) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (inBounds(nr, nc)) {
              const nk = `${nr},${nc}`;
              if (!clearSet.has(nk)) {
                clearSet.add(nk);
                queue.push(nk);
              }
            }
          }
        }
      }
    }

    // Clear adjacent chocolate obstacles
    const extraObstacles = [];
    clearSet.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ].forEach(([nr, nc]) => {
        if (inBounds(nr, nc) && state.grid[nr][nc].isObstacle) {
          extraObstacles.push(`${nr},${nc}`);
        }
      });
    });
    extraObstacles.forEach((k) => clearSet.add(k));

    // Dispose cleared meshes & award score
    clearSet.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      const cell = state.grid[r][c];
      if (cell.mesh) {
        spawnPopParticles(cell.mesh.position);
        cell.mesh.dispose();
      }
      state.grid[r][c] = {
        typeId: 0,
        special: SPECIAL.NONE,
        isObstacle: false,
        mesh: null,
        badgeMesh: null,
      };
      state.score += 60;
    });

    // Spawn newly formed special candies
    spawns.forEach((sp) => {
      const built = createCandyMesh(sp.r, sp.c, sp.typeId, sp.special, false);
      state.grid[sp.r][sp.c] = {
        typeId: sp.typeId,
        special: sp.special,
        isObstacle: false,
        mesh: built.mesh,
        badgeMesh: built.badgeMesh,
      };
    });

    updateHUD();
    await new Promise((res) => setTimeout(res, 150));
  }

  async function cascadeAndRefill() {
    let moved = true;
    while (moved) {
      moved = false;
      for (let c = 0; c < GRID_SIZE; c++) {
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (state.grid[r][c].typeId === 0 && !state.grid[r][c].isObstacle && state.grid[r][c].special !== SPECIAL.COLOR_BOMB) {
            for (let above = r - 1; above >= 0; above--) {
              if (state.grid[above][c].isObstacle) break;
              if (state.grid[above][c].typeId > 0 || state.grid[above][c].special === SPECIAL.COLOR_BOMB) {
                state.grid[r][c] = state.grid[above][c];
                state.grid[above][c] = { typeId: 0, special: SPECIAL.NONE, isObstacle: false, mesh: null, badgeMesh: null };
                if (state.grid[r][c].mesh) {
                  state.grid[r][c].mesh.metadata = { r, c };
                  state.grid[r][c].mesh.position.copyFrom(gridToWorld(r, c));
                }
                moved = true;
                break;
              }
            }
          }
        }

        // Fill empty top slots
        for (let r = 0; r < GRID_SIZE; r++) {
          if (state.grid[r][c].isObstacle) break;
          if (state.grid[r][c].typeId === 0 && state.grid[r][c].special !== SPECIAL.COLOR_BOMB) {
            const typeId = Math.floor(Math.random() * state.colorsCount) + 1;
            const built = createCandyMesh(r, c, typeId, SPECIAL.NONE, false);
            state.grid[r][c] = {
              typeId,
              special: SPECIAL.NONE,
              isObstacle: false,
              mesh: built.mesh,
              badgeMesh: built.badgeMesh,
            };
            moved = true;
          }
        }
      }

      await new Promise((res) => setTimeout(res, 140));
      const cascadeMatches = findMatches();
      if (cascadeMatches.groups.length > 0) {
        await processMatches(cascadeMatches, null);
        moved = true;
      } else {
        break;
      }
    }
  }

  // --- Four Power-Up Boosters ---
  function armBooster(type) {
    if (state.isBusy || state.gameOver) return;
    if (state.boosters[type] <= 0) return;

    if (type === "moves5") {
      state.boosters.moves5--;
      state.movesLeft += 5;
      saveProgress();
      updateHUD();
      return;
    }

    state.activeBooster = state.activeBooster === type ? null : type;
    updateHUD();
  }

  async function applyActiveBooster(r, c) {
    const type = state.activeBooster;
    state.activeBooster = null;
    if (!type || state.boosters[type] <= 0) return;

    state.isBusy = true;
    state.boosters[type]--;
    const clearSet = new Set();

    if (type === "mallet") {
      // Sugar Mallet: smashes single cell (including obstacles)
      clearSet.add(`${r},${c}`);
    } else if (type === "wand") {
      // Magic Wand: clears all candies of the tapped color
      const targetType = state.grid[r][c].typeId;
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (state.grid[row][col].typeId === targetType && !state.grid[row][col].isObstacle) {
            clearSet.add(`${row},${col}`);
          }
        }
      }
    } else if (type === "rocket") {
      // Rainbow Rocket: clears entire row + column cross
      for (let i = 0; i < GRID_SIZE; i++) {
        clearSet.add(`${r},${i}`);
        clearSet.add(`${i},${c}`);
      }
    }

    saveProgress();
    await resolveClearSet(clearSet, []);
    await cascadeAndRefill();
    checkEndState();
    state.isBusy = false;
  }

  function spawnPopParticles(position) {
    const ps = new BABYLON.ParticleSystem("pop", 24, scene);
    ps.emitter = position.clone();
    ps.minSize = 0.08;
    ps.maxSize = 0.22;
    ps.minLifeTime = 0.2;
    ps.maxLifeTime = 0.45;
    ps.emitRate = 120;
    ps.color1 = new BABYLON.Color4(1, 0.85, 0.2, 1);
    ps.color2 = new BABYLON.Color4(0.9, 0.3, 1, 1);
    ps.minEmitPower = 1.5;
    ps.maxEmitPower = 3.5;
    ps.targetStopDuration = 0.15;
    ps.disposeOnStop = true;
    ps.start();
  }

  // --- Win / Loss & HUD Sync ---
  function checkEndState() {
    if (state.score >= state.targetScore) {
      state.gameOver = true;
      state.stars += 3;
      state.coins += 100;
      state.levelNumber += 1;
      saveProgress();
      updateHUD();
      setTimeout(() => {
        if (confirm(`🎉 Level Cleared! Score: ${state.score}\nContinue to Level ${state.levelNumber}?`)) {
          startLevel(state.levelNumber);
        }
      }, 300);
    } else if (state.movesLeft <= 0) {
      state.gameOver = true;
      updateHUD();
      setTimeout(() => {
        if (typeof window.showRewardedAdForMoves === "function") {
          window.showRewardedAdForMoves(() => {
            state.movesLeft += 5;
            state.gameOver = false;
            updateHUD();
          });
        } else if (confirm("Out of moves! Retry this level?")) {
          startLevel(state.levelNumber);
        }
      }, 300);
    }
  }

  function ensureBoosterBarUI() {
    if (document.getElementById("cmr-booster-bar")) return;
    const bar = document.createElement("div");
    bar.id = "cmr-booster-bar";
    bar.style.cssText =
      "position:fixed;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:10px;z-index:50;background:rgba(36,12,68,0.88);padding:8px 14px;border-radius:18px;border:2px solid #ffd166;font-family:sans-serif;";
    const defs = [
      { key: "mallet", label: "🔨 Mallet" },
      { key: "wand", label: "🪄 Wand" },
      { key: "rocket", label: "🚀 Rocket" },
      { key: "moves5", label: "⏱️ +5" },
    ];
    defs.forEach((d) => {
      const btn = document.createElement("button");
      btn.id = `booster-${d.key}`;
      btn.style.cssText =
        "background:#5b21b6;color:#fff;border:1px solid #f59e0b;border-radius:12px;padding:8px 12px;font-weight:bold;cursor:pointer;font-size:13px;";
      btn.onclick = () => armBooster(d.key);
      bar.appendChild(btn);
    });
    document.body.appendChild(bar);
  }

  function updateHUD() {
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setTxt("score", state.score);
    setTxt("moves", state.movesLeft);
    setTxt("target", state.targetScore);
    setTxt("level", state.levelNumber);

    ["mallet", "wand", "rocket", "moves5"].forEach((k) => {
      const btn = document.getElementById(`booster-${k}`);
      if (!btn) return;
      const labels = { mallet: "🔨", wand: "🪄", rocket: "🚀", moves5: "⏱️ +5" };
      btn.textContent = `${labels[k]} (${state.boosters[k]})`;
      btn.style.outline = state.activeBooster === k ? "3px solid #fde047" : "none";
    });
  }

  // --- Boot ---
  window.addEventListener("DOMContentLoaded", () => {
    loadProgress();
    initScene();
    startLevel(state.levelNumber);
  });

  window.CandyMagicGame = { startLevel, armBooster, state };
})();
