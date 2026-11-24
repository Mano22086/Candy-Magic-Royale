const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, isBlockedPath } = require('./server');

test('isBlockedPath blocks internal files and directories', () => {
  assert.equal(isBlockedPath('/server.js'), true);
  assert.equal(isBlockedPath('/package.json'), true);
  assert.equal(isBlockedPath('/node_modules/express/index.js'), true);
  assert.equal(isBlockedPath('/.github/workflows/deploy.yml'), true);
  assert.equal(isBlockedPath('/%73erver.js'), true);
  assert.equal(isBlockedPath('/index.html'), false);
  assert.equal(isBlockedPath('/game.js'), false);
  assert.equal(isBlockedPath('/assets/queen-luma.svg'), false);
});

test('Express server serves index.html, static assets, and .glb MIME type, and hides internals', async () => {
  const app = createApp(__dirname);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  try {
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;

    const rootRes = await fetch(`${base}/`);
    assert.equal(rootRes.status, 200);
    const html = await rootRes.text();
    assert.ok(html.includes('Candy Magic Royale'));

    const jsRes = await fetch(`${base}/game.js`);
    assert.equal(jsRes.status, 200);

    const glbRes = await fetch(`${base}/dragon-character.glb`, { method: 'HEAD' });
    assert.equal(glbRes.status, 200);
    assert.equal(glbRes.headers.get('content-type'), 'model/gltf-binary');

    const winArtRes = await fetch(`${base}/assets/aistudio/Picsart_26-11-24_21-58-55-365_00747e2e.png`, { method: 'HEAD' });
    assert.equal(winArtRes.status, 200);

    const lossArtRes = await fetch(`${base}/assets/aistudio/Picsart_26-11-24_02-32-44-943_5bb9cc15.png`, { method: 'HEAD' });
    assert.equal(lossArtRes.status, 200);

    const blockedRes = await fetch(`${base}/server.js`);
    assert.equal(blockedRes.status, 404);

    const pkgRes = await fetch(`${base}/package.json`);
    assert.equal(pkgRes.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
