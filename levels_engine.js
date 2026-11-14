// 100,000 Levels Procedural Generation Algorithm
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function generateInfiniteLevel(levelNumber) {
  const seed = levelNumber * 1234.567;
  const targetScore = Math.floor(1200 + (levelNumber * 350));
  const movesLimit = Math.max(12, Math.floor(32 - (Math.log10(levelNumber) * 4)));
  const colorsCount = Math.min(6, 4 + Math.floor(levelNumber / 15));
  const obstaclesRatio = Math.min(0.28, 0.05 + (Math.sqrt(levelNumber) * 0.001));

  const grid = [];
  for (let r = 0; r < 8; r++) {
    const row = [];
    for (let c = 0; c < 8; c++) {
      const tileSeed = seed + (r * 8 + c);
      const isObstacle = seededRandom(tileSeed) < obstaclesRatio;
      row.push({
        r, c,
        typeId: isObstacle ? -1 : Math.floor(seededRandom(tileSeed + 99) * colorsCount) + 1,
        isObstacle: isObstacle
      });
    }
    grid.push(row);
  }

  return {
    levelNumber,
    targetScore,
    movesLimit,
    colorsCount,
    grid
  };
}
window.generateInfiniteLevel = generateInfiniteLevel;
