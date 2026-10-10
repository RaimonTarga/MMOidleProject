// Combat readout capture: the REAL client (a production build served by a capture
// server on its own port) plays a guest character in a headless browser, while this
// driver stages each fight over the admin namespace and the page's own socket (dev-only
// debug events, sent as raw socket.io packets on the page's websocket). A second,
// anonymous page watches the boss fight through the spectator route (`/?watch=`).
//
//   node capture.cjs <baseUrl> <outDir> <label> [scenes=rat,boss,swarm]
//
// Needs the server started with NODE_ENV=production DEV_TOOLS=true and ADMIN_TOKEN below,
// and the tier-entry profiles dumped to $PROFILES (JSON keyed by profile id).
const { createRequire } = require('node:module');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const REPO = 'C:/Users/osaif/Documents/Claude/Projects/mmo-lineages';
const { chromium } = createRequire(REPO + '/package.json')('playwright');
const { io } = createRequire(REPO + '/bot/package.json')('socket.io-client');

const [BASE, OUT, LABEL, SCENES_RAW] = process.argv.slice(2);
const SCENES = (SCENES_RAW ?? 'rat,boss,swarm').split(',');
const ADMIN = process.env.ADMIN_TOKEN ?? 'readoutshot-admin-token-0123456789abcdef0123';
const PROFILES = JSON.parse(fs.readFileSync(process.env.PROFILES, 'utf8'));
// The guest route is rate-limited per IP: one guest, cached outside the repo.
const TOKEN_FILE = process.env.TOKEN_FILE ?? path.join(os.tmpdir(), 'combat-readout-guest-token.txt');
const CHAR_NAME = process.env.CHAR_NAME ?? 'Readout';
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const once = (sock, ev, ms = 20000) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error(`timeout waiting for ${ev}`)), ms);
  sock.once(ev, (...a) => { clearTimeout(t); res(a); });
});

async function guestToken() {
  if (fs.existsSync(TOKEN_FILE)) return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  const guest = await (await fetch(`${BASE}/auth/guest`, { method: 'POST' })).json();
  if (!guest.token) throw new Error(`guest: ${JSON.stringify(guest)}`);
  fs.writeFileSync(TOKEN_FILE, guest.token);
  return guest.token;
}

/** Make sure the account has a character, then let go of the session for the browser. */
async function ensureCharacter(token) {
  const sock = io(BASE, { auth: { token }, transports: ['websocket'] });
  const roster = once(sock, 'account:characters');
  await once(sock, 'connect');
  const [list] = await roster;
  const chars = list?.characters ?? list ?? [];
  if (!chars.length) {
    sock.emit('character:create', { name: CHAR_NAME });
    const [created] = await once(sock, 'character:createResult');
    if (!created.success) throw new Error(`create: ${created.reason}`);
    await sleep(1500);
  }
  sock.close();
  await sleep(800);
}

(async () => {
  const token = await guestToken();
  await ensureCharacter(token);

  const admin = io(`${BASE}/admin`, { auth: { token: ADMIN }, transports: ['websocket'] });
  await once(admin, 'connect');
  const players = async () => {
    const got = once(admin, 'admin:players');
    admin.emit('admin:requestPlayers');
    return (await got)[0];
  };

  const browser = await chromium.launch();
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    const Native = window.WebSocket;
    window.__sockets = [];
    window.WebSocket = class extends Native {
      constructor(...args) { super(...args); window.__sockets.push(this); }
    };
  });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push({ page: 'player', text: m.text() }); });
  page.on('pageerror', (e) => errors.push({ page: 'player', text: String(e) }));
  await page.goto(`${BASE}/#session=${token}`);
  await page.getByRole('button', { name: /Enter World/ }).first().click({ timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 60000 });
  await sleep(4000);

  const me = (await players()).find((p) => p.name === CHAR_NAME) ?? (await players())[0];
  if (!me) throw new Error('player not in world');
  console.log('player', me.id, me.nodeId);

  // An anonymous spectator socket on the player tracks the node's bodies, so the
  // driver can walk the player to the nearest live monster between shots.
  const ents = new Map();
  let nodeId = null;
  const spec = io(BASE, { auth: { spectate: true }, transports: ['websocket'] });
  spec.on('spectate:snapshot', (snap) => {
    if (snap.full || snap.nodeId !== nodeId) ents.clear();
    nodeId = snap.nodeId;
    for (const d of snap.deltas ?? []) {
      if (d.kind === 'remove') { ents.delete(d.netId); continue; }
      const e = ents.get(d.netId) ?? {};
      const c = d.components ?? {};
      if (c.isMonster) { e.monster = true; e.boss = !!c.isMonster.isBoss; }
      if (c.isPlayer) e.playerId = c.isPlayer.id;
      if (c.hasPosition) e.pos = c.hasPosition.current;
      if (c.hasHealth) e.hp = c.hasHealth.hp;
      ents.set(d.netId, e);
    }
  });
  await once(spec, 'connect');
  spec.emit('spectate:setTarget', me.id);
  spec.emit('spectate:setActive', true);
  const hunt = async () => {
    const self = [...ents.values()].find((e) => e.playerId === me.id);
    if (!self?.pos) return;
    let best = null; let bestD = Infinity;
    for (const e of ents.values()) {
      if (!e.monster || e.boss || !e.pos || !(e.hp > 0)) continue;
      const d = Math.hypot(e.pos.x - self.pos.x, e.pos.y - self.pos.y);
      if (d < bestD) { best = e; bestD = d; }
    }
    if (best && bestD > 90) await send('player:move', { x: best.pos.x, y: best.pos.y });
  };

  // A raw socket.io event on the page's own (upgraded) websocket.
  const send = (event, ...args) => page.evaluate(([e, a]) => {
    const ws = window.__sockets.filter((s) => s.readyState === 1).pop();
    if (!ws) throw new Error('no open websocket');
    ws.send('42' + JSON.stringify([e, ...a]));
  }, [event, args]);

  // A raw event with an ack: resolves with the server's reply (or null after 3 s).
  const ask = (event, ...args) => page.evaluate(([e, a]) => new Promise((resolve) => {
    const ws = window.__sockets.filter((s) => s.readyState === 1).pop();
    const id = 900 + Math.floor(Math.random() * 9000);
    const onMsg = (m) => {
      if (typeof m.data === 'string' && m.data.startsWith('43' + id)) {
        ws.removeEventListener('message', onMsg);
        resolve(m.data.slice(2 + String(id).length));
      }
    };
    ws.addEventListener('message', onMsg);
    ws.send('42' + id + JSON.stringify([e, ...a]));
    setTimeout(() => { ws.removeEventListener('message', onMsg); resolve(null); }, 3000);
  }), [event, args]);
  const selfPos = () => [...ents.values()].find((e) => e.playerId === me.id)?.pos;

  const shoot = async (name, count, everyMs, hunting = true) => {
    for (let i = 0; i < count; i++) {
      if (hunting && i % 3 === 0) await hunt();
      await page.screenshot({ path: path.join(OUT, `${LABEL}-${name}-${String(i).padStart(2, '0')}.png`) });
      await sleep(everyMs);
    }
  };
  const warmHunt = async (ms) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { await hunt(); await sleep(700); }
  };
  // A death from the last pass: ack it and press RESPAWN (its overlay intercepts clicks).
  const revive = async () => {
    await send('player:ackDeath');
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /respawn/i.test(b.textContent ?? ''));
      btn?.click();
    });
    await sleep(1500);
  };
  const desktop = () => page.setViewportSize({ width: 1440, height: 900 });
  const phone = () => page.setViewportSize({ width: 390, height: 844 });

  const applyProfile = async (id) => {
    const profile = PROFILES[id];
    if (!profile) throw new Error(`no profile ${id}`);
    await send('debug:applyTierEntryProfile', profile);
    await sleep(2500);
  };

  for (const scene of SCENES) {
    console.log('scene', scene);
    if (scene === 'rat') {
      await applyProfile('striker-t1-t2-entry-clean');
      for (const vp of ['desktop', 'phone']) {
        await (vp === 'desktop' ? desktop() : phone());
        await revive();
        await send('debug:teleportToNode', 'node-t1-forest-02');
        await sleep(3500);
        await send('player:setAuto', true);
        await warmHunt(5000);
        await shoot(`${vp === 'desktop' ? 'desktop-1440' : 'portrait-390'}-rat`, 24, 350);
      }
    }
    if (scene === 'boss') {
      await applyProfile('striker-t1-t2-entry-clean');
      let watcher = null;
      for (const vp of ['desktop', 'phone']) {
        await (vp === 'desktop' ? desktop() : phone());
        await revive();
        await send('player:setAuto', false);
        await send('debug:prepareFastBossRetry', { nodeId: 'node-t1-mountain-dungeon', includeGuardians: false });
        await sleep(3000);
        // Walk to the altar (the path from the entry detours), wake it, and wait out
        // the boss's awakening before handing the fight to auto-combat.
        const walkUntil = Date.now() + 60000;
        while (Date.now() < walkUntil) {
          const pos = selfPos();
          if (pos && Math.hypot(pos.x - 2400, pos.y - 2400) < 80) break;
          await ask('player:move', { x: 2400, y: 2400 }, null);
          await sleep(700);
        }
        console.log('at altar', JSON.stringify(selfPos()));
        await send('player:activateDungeonAltar');
        await sleep(7500);
        await send('player:setAuto', true);
        if (vp === 'desktop' && LABEL === 'after') {
          // The spectator route: an anonymous page pinned to the player, clipped to its canvas.
          const watchCtx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
          watcher = await watchCtx.newPage();
          watcher.on('console', (m) => { if (m.type() === 'error') errors.push({ page: 'spectator', text: m.text() }); });
          watcher.on('pageerror', (e) => errors.push({ page: 'spectator', text: String(e) }));
          await watcher.goto(`${BASE}/?watch=${me.id}`);
          await sleep(5000);
        }
        await sleep(2500);
        const name = `${vp === 'desktop' ? 'desktop-1440' : 'portrait-390'}-boss`;
        for (let i = 0; i < 28; i++) {
          await page.screenshot({ path: path.join(OUT, `${LABEL}-${name}-${String(i).padStart(2, '0')}.png`) });
          if (watcher && vp === 'desktop' && i % 2 === 0) {
            const box = await watcher.locator('canvas').first().boundingBox().catch(() => null);
            await watcher.screenshot({ path: path.join(OUT, `${LABEL}-spectator-boss-${String(i).padStart(2, '0')}.png`), clip: box ?? undefined });
          }
          await sleep(550);
        }
      }
      if (watcher) await watcher.context().close();
    }
    if (scene === 'low') {
      // The low-health treatment: the same Behemoth fight without armour or charm,
      // shot densely so the window between a quarter and the next hit is caught.
      for (const vp of ['desktop', 'phone']) {
        await applyProfile('striker-t1-t2-entry-clean');
        await (vp === 'desktop' ? desktop() : phone());
        await revive();
        await send('player:setAuto', false);
        await send('debug:prepareFastBossRetry', { nodeId: 'node-t1-mountain-dungeon', includeGuardians: false });
        await sleep(3000);
        await send('inventory:unequip', 'armor');
        await send('inventory:unequip', 'recovery');
        const walkUntil = Date.now() + 60000;
        while (Date.now() < walkUntil) {
          const pos = selfPos();
          if (pos && Math.hypot(pos.x - 2400, pos.y - 2400) < 80) break;
          await ask('player:move', { x: 2400, y: 2400 }, null);
          await sleep(700);
        }
        await send('player:activateDungeonAltar');
        await sleep(7500);
        await send('player:setAuto', true);
        const name = `${vp === 'desktop' ? 'desktop-1440' : 'portrait-390'}-low`;
        for (let i = 0; i < 60; i++) {
          await page.screenshot({ path: path.join(OUT, `${LABEL}-${name}-${String(i).padStart(2, '0')}.png`) });
          await sleep(250);
        }
      }
    }
    if (scene === 'flash') {
      // The crit body flash lasts 110 ms: a burst of tight clips around the camera's
      // centre (the player), with no pause, catches it at its strength.
      await applyProfile('striker-t1-t2-entry-clean');
      await desktop();
      await revive();
      await send('debug:teleportToNode', 'node-t1-forest-02');
      await sleep(3500);
      await send('player:setAuto', true);
      await warmHunt(5000);
      for (let i = 0; i < 90; i++) {
        if (i % 15 === 0) await hunt();
        await page.screenshot({
          path: path.join(OUT, `${LABEL}-desktop-1440-flash-${String(i).padStart(2, '0')}.png`),
          clip: { x: 520, y: 250, width: 400, height: 300 },
        });
      }
    }
    if (scene === 'guardian') {
      // The GUARDIAN mark (designer's call, 2026-10-10): the Mountain dungeon with its
      // guardians up; auto-combat engages them before the altar is ever woken.
      await applyProfile('striker-t1-t2-entry-clean');
      for (const vp of ['desktop', 'phone']) {
        await (vp === 'desktop' ? desktop() : phone());
        await revive();
        await send('player:setAuto', false);
        await send('debug:prepareFastBossRetry', { nodeId: 'node-t1-mountain-dungeon', includeGuardians: true });
        await sleep(3000);
        await send('player:setAuto', true);
        // The nearest guardian can be a ledge's detour away: shoot once its mark is up.
        const marked = await page.waitForSelector('.tf-mark--guardian', { timeout: 45000 }).catch(() => null);
        console.log('guardian mark', vp, marked ? 'up' : 'not seen');
        const name = `${vp === 'desktop' ? 'desktop-1440' : 'portrait-390'}-guardian`;
        for (let i = 0; i < 24; i++) {
          await page.screenshot({ path: path.join(OUT, `${LABEL}-${name}-${String(i).padStart(2, '0')}.png`) });
          await sleep(400);
        }
      }
    }
    if (scene === 'swarm') {
      await applyProfile('slinger-t1-t2-entry-clean');
      for (const vp of ['desktop', 'phone']) {
        await (vp === 'desktop' ? desktop() : phone());
        await revive();
        await send('debug:teleportToNode', 'node-t1-plains-04');
        await sleep(3500);
        await send('player:setAuto', true);
        await warmHunt(6000);
        await shoot(`${vp === 'desktop' ? 'desktop-1440' : 'portrait-390'}-swarm`, 24, 350);
      }
    }
  }

  fs.writeFileSync(path.join(OUT, `${LABEL}-console-errors.json`), JSON.stringify(errors, null, 1));
  console.log('console errors', errors.length);
  await browser.close();
  admin.close();
  spec.close();
  process.exit(0);
})().catch((err) => { console.error(err); process.exit(1); });
