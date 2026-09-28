// Real React presentation and arrival observer, with local fixtures; no game socket or saved character.
// Run against Vite: node tools/uishot/area-information-audit.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const url = process.argv.find(arg => arg.startsWith('--url='))?.slice(6) ?? 'http://localhost:3000';
const out = path.resolve('.uishot/area-information');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  await page.routeWebSocket('**', () => {});
  await page.route('**/area-audit', route => route.fulfill({ contentType: 'text/html', body:
    '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#20251e}#game-wrapper{position:relative;margin:auto;width:100%;height:100vh;max-width:1000px;background:radial-gradient(ellipse at center,#3f4930,#171c19)}#area-information-overlay{position:absolute;inset:0}</style></head><body><div id="game-wrapper"><div id="area-information-overlay"></div></div></body></html>' }));
  await page.goto(`${url}/area-audit`);
  await page.evaluate(async () => {
    const { default: refresh } = await import('/@react-refresh');
    refresh.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => type => type;
    window.__vite_plugin_react_preamble_installed__ = true;
    const { default: React } = await import('/node_modules/.vite/deps/react.js');
    const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
    const { getDefaultStore } = await import('/node_modules/.vite/deps/jotai.js');
    // Import via the same module URL as client components (works in Docker and on Windows).
    const source = await (await fetch('/src/hud/AreaInformation.tsx')).text();
    const dependency = filename => source.match(new RegExp('from\\s+"([^"]*' + filename + '[^"]*)"'))[1];
    const a = await import(dependency('/atoms.ts'));
    const s = await import(dependency('/areaInformationState.ts'));
    const { AreaInformation } = await import('/src/hud/AreaInformation.tsx');
    const sharedUrl = source.match(/from\s+"([^"]*shared\/src\/index\.ts[^"]*)"/)[1];
    const db = await import(sharedUrl);
    const store = getDefaultStore();
    const set = (key, value) => store.set(a[key], value);
    const node = (tier, biome, kind = 'normal', modifier) => db.WORLD_NODE_LIST.find(n => n.biomeTier === tier && n.biomeGroup === biome && n.kind === kind && (!modifier || n.modifier === modifier));
    set('statusAtom', 'connected'); set('hpAtom', 100); set('playerIdAtom', 'area-fixture');
    set('playerNodeIdAtom', 'node-clearing'); set('visitedNodesAtom', ['node-clearing']);
    createRoot(document.getElementById('area-information-overlay')).render(React.createElement(AreaInformation));
    window.areaAudit = {
      set,
      arrival: () => store.get(s.areaArrivalAtom),
      move(tier, biome, kind = 'normal', modifier, sync = false) {
        const next = node(tier, biome, kind, modifier);
        const player = { id: 'area-fixture', nodeId: next.id, isDead: false };
        s.observeAreaArrival(player, sync);
        set('playerNodeIdAtom', next.id);
        set('playerPosAtom', { x: 2400, y: 2400 });
        set('visitedNodesAtom', [...new Set([...store.get(a.visitedNodesAtom), next.id])]);
        return store.get(s.areaArrivalAtom);
      },
      display(tier, biome, kind = 'normal', modifier, visit = 'discovery') {
        const next = node(tier, biome, kind, modifier);
        set('playerNodeIdAtom', next.id);
        set('playerPosAtom', { x: 2400, y: 2400 });
        store.set(s.areaArrivalAtom, { nodeId: next.id, kind: visit, startedAt: Date.now(), duration: 30000 });
      },
      preview(direction) {
        store.set(s.areaArrivalAtom, null);
        const current = store.get(a.playerNodeIdAtom);
        const gate = db.buildNodeGateEntities(current).find(g => !g.sealed && (!direction || g.direction === direction));
        if (!gate) return null;
        set('playerPosAtom', { x: gate.bounds.x + gate.bounds.width / 2, y: gate.bounds.y + gate.bounds.height / 2 });
        return db.NODE_BIOMES[gate.exitNodeId].displayName;
      },
      corner() {
        const next = db.WORLD_NODE_LIST.find(n => {
          const gates = db.buildNodeGateEntities(n.id);
          return ['north', 'west'].every(d => gates.some(g => g.direction === d && !g.sealed));
        });
        store.set(s.areaArrivalAtom, null);
        set('playerNodeIdAtom', next.id);
        set('playerPosAtom', { x: 100, y: 100 });
        return db.buildNodeGateEntities(next.id).filter(g => ['north', 'west'].includes(g.direction) && !g.sealed)
          .map(g => db.NODE_BIOMES[g.exitNodeId].displayName);
      },
    };
  });
  assert.equal((await page.evaluate(() => areaAudit.move(1, 'cave', 'normal', 'heavy'))).kind, 'discovery');
  await page.locator('.area-arrival').waitFor();
  assert.match(await page.locator('.area-arrival').innerText(), /Very High danger/);
  assert.doesNotMatch(await page.locator('.area-arrival').innerText(), /relative to Tier/);
  // One skull, tinted by band, rather than one skull per level.
  assert.equal(await page.locator('.area-arrival .area-danger--4 .area-danger__skull .game-icon').count(), 1);
  assert.equal((await page.evaluate(() => areaAudit.move(1, 'cave', 'normal', 'alacrity'))).kind, 'new-node');
  assert.equal((await page.evaluate(() => areaAudit.move(1, 'cave', 'normal', 'heavy'))).kind, 'return');
  assert.equal(await page.evaluate(() => areaAudit.move(1, 'cave', 'normal', 'heavy', true)), null);
  await page.locator('.area-arrival').waitFor({ state: 'detached' });
  await page.evaluate(() => areaAudit.set('deathOverlayAtom', { active: true, payload: null, startedAt: Date.now() }));
  assert.equal(await page.evaluate(() => areaAudit.move(1, 'plains')), null);
  await page.evaluate(() => areaAudit.set('deathOverlayAtom', { active: false, payload: null, startedAt: null }));
  await page.evaluate(() => areaAudit.move(1, 'swamp'));
  assert.equal((await page.evaluate(() => areaAudit.move(3, 'swamp'))).kind, 'discovery');
  await page.waitForTimeout(50);
  assert.match(await page.locator('.area-arrival').innerText(), /Low danger/);
  await page.evaluate(() => areaAudit.move(1, 'cave', 'normal', 'heavy'));
  assert.equal((await page.evaluate(() => areaAudit.arrival())).kind, 'return');
  await page.locator('.area-arrival').waitFor({ state: 'detached', timeout: 3000 });
  // A visibility change drops the current announcement, rather than replaying on return.
  await page.evaluate(() => {
    areaAudit.display(1, 'cave');
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.locator('.area-arrival').waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(() => areaAudit.arrival()), null);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  for (const [width, height] of [[1366, 768], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    for (const [name, args] of [
      ['discovery', [1, 'cave', 'normal', 'dominion']],
      ['return', [1, 'cave', 'normal', 'heavy', 'return']],
      ['dungeon', [3, 'volcanic', 'dungeon']],
      ['sanctuary', [4, 'sanctuary', 'sanctuary']],
    ]) {
      await page.evaluate(args => areaAudit.display(...args), args);
      await page.waitForTimeout(120);
      const box = await page.locator('.area-arrival').boundingBox();
      assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height, `${name} ${width}x${height} clipped`);
      assert.equal(await page.locator('.area-arrival').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
      await page.screenshot({ path: path.join(out, `${name}-${width}x${height}.png`) });
      results.push({ name, width, height, box });
    }
    await page.evaluate(() => areaAudit.display(1, 'plains', 'normal', 'heavy'));
    await page.waitForTimeout(2300);
    for (const direction of ['north', 'south', 'east', 'west']) {
      const expected = await page.evaluate(direction => areaAudit.preview(direction), direction);
      if (!expected) continue;
      await page.locator('.area-exit').waitFor();
      // Move away to release hysteresis before inspecting another edge.
      assert.match(await page.locator('.area-exit').innerText(), new RegExp(expected));
      const box = await page.locator('.area-exit').boundingBox();
      assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height);
      await page.screenshot({ path: path.join(out, `exit-${direction}-${width}x${height}.png`) });
      await page.evaluate(() => areaAudit.set('playerPosAtom', { x: 2400, y: 2400 }));
      await page.locator('.area-exit').waitFor({ state: 'detached' });
    }
    const destinations = await page.evaluate(() => areaAudit.corner());
    await page.waitForFunction(() => document.querySelectorAll('.area-exit').length === 2);
    const signs = await page.locator('.area-exit').allTextContents();
    for (const name of destinations) assert.ok(signs.some(text => text.includes(name)), JSON.stringify({ destinations, signs }));
    const boxes = await page.locator('.area-exit').evaluateAll(elements => elements.map(el => {
      const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
    }));
    for (const b of boxes) assert.ok(b.x >= 0 && b.y >= 0 && b.right <= width && b.bottom <= height);
    const [a, b] = boxes;
    assert.ok(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y, `Corner signs overlap at ${width}x${height}`);
    await page.screenshot({ path: path.join(out, `corner-${width}x${height}.png`) });
  }
  assert.equal(errors.length, 0, errors.join('\n'));
  fs.writeFileSync(path.join(out, 'layout.json'), JSON.stringify(results, null, 2));
  console.log(`area-information-audit: lifecycle assertions and ${results.length} arrival layout cases passed; exit screenshots saved in ${out}`);
} finally { await browser.close(); }
