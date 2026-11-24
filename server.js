const express = require('express');
const path = require('path');

const BLOCKED_PREFIXES = [
  '/node_modules',
  '/.git',
  '/.github',
  '/.playwright-cli',
  '/.aistudio',
];

const BLOCKED_FILES = new Set([
  '/server.js',
  '/server.test.js',
  '/game-core.test.js',
  '/package.json',
  '/package-lock.json',
  '/metadata.json',
]);

function isBlockedPath(reqPath) {
  let decoded = reqPath;
  try {
    decoded = decodeURIComponent(reqPath);
  } catch {
    return true;
  }
  const normalized = path.posix.normalize(decoded);
  if (BLOCKED_FILES.has(normalized)) {
    return true;
  }
  return BLOCKED_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

function createApp(rootDir = __dirname) {
  const app = express();

  app.use((req, res, next) => {
    if (isBlockedPath(req.path)) {
      return res.status(404).send('Not Found');
    }
    return next();
  });

  app.use(
    '/assets/aistudio',
    express.static(path.join(rootDir, 'public', 'assets', 'aistudio'), {
      dotfiles: 'ignore',
    })
  );

  app.use(
    express.static(rootDir, {
      dotfiles: 'ignore',
      index: 'index.html',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.glb')) {
          res.setHeader('Content-Type', 'model/gltf-binary');
        }
      },
    })
  );

  app.get('/', (_req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
  });

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const host = '0.0.0.0';
  const app = createApp(__dirname);
  app.listen(port, host, () => {
    console.log(`Candy Magic Royale server running at http://${host}:${port}`);
  });
}

module.exports = { createApp, isBlockedPath };
