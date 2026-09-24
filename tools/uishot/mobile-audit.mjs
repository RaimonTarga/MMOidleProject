// Real React menus with synthetic, browser-local data. No login, sockets, or game mutations.
// Start the client with pnpm dev:client, then: node tools/uishot/mobile-audit.mjs [--url=http://localhost:3000]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const url = process.argv.find(arg => arg.startsWith('--url='))?.slice(6) ?? 'http://localhost:3000';
const engine = process.argv.includes('--webkit') ? 'webkit' : 'chromium';
const out = path.join(repo, `.uishot/mobile-audit-${engine}`);
fs.mkdirSync(out, { recursive: true });
const browser = await ({ chromium, webkit })[engine].launch();
const results = [];
const errors = [];
const onlySurface = process.argv.find(arg => arg.startsWith('--surface='))?.slice(10);
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  // A layout fixture never needs a socket, including Vite's HMR connection.
  await page.routeWebSocket('**', () => {});
  // Serve only a mount point. Import the actual client components through Vite,
  // without booting Phaser, auth networking, or the authoritative game session.
  await page.route('**/mobile-audit', route => route.fulfill({
    contentType: 'text/html',
    body: '<html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#050510;overflow:hidden}</style></head><body><div id="root"></div></body></html>',
  }));
  await page.goto(`${url}/mobile-audit`);
  await page.evaluate(async sharedPath => {
    const { default: refresh } = await import('/@react-refresh');
    refresh.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => type => type;
    window.__vite_plugin_react_preamble_installed__ = true;
    const { default: React } = await import('/node_modules/.vite/deps/react.js');
    const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
    const { getDefaultStore } = await import('/node_modules/.vite/deps/jotai.js');
    const atoms = await import('/src/hud/atoms.ts');
    const db = await import(sharedPath);
    const lobby = await import('/src/auth/lobbyState.ts');
    await import('/src/hud/hud.css');
    const store = getDefaultStore();
    const set = (key, value) => store.set(atoms[key], value);
    const nodeId = Object.keys(db.NODE_BIOMES).find(id => db.NODE_BIOMES[id].biomeGroup === 'plains' && db.NODE_BIOMES[id].biomeTier === 1);
    set('playerIdAtom', 'mobile-layout-fixture');
    set('playerNameAtom', 'Mobile Layout');
    set('statusAtom', 'connected');
    set('hpAtom', 100);
    set('maxHpAtom', 100);
    set('attackAtom', 10);
    set('attackCooldownAtom', 1000);
    set('playerTierAtom', 6);
    set('currentSkillTierAtom', 6);
    set('selectedClassAtom', 'cadence-root');
    set('combatArchetypeAtom', 'cadence');
    set('playerNodeIdAtom', nodeId);
    set('biomeLevelAtom', Object.fromEntries([...db.BIOME_DATABASE.keys()].map(key => [key, 30])));
    set('unlockedRecipesAtom', [...db.RECIPE_DATABASE.keys()]);
    set('inventoryAtom', [...db.ITEM_DATABASE.values()].filter(item => item.tier === 1).map(item => item.id));
    set('essencesAtom', { red: 99999, blue: 99999, green: 99999, yellow: 99999, purple: 99999 });
    set('runesOwnedAtom', [...db.CONDITION_DATABASE.keys(), ...db.ACTION_DATABASE.keys()]);
    for (const [key, name] of [['knownAbilitiesAtom', 'ABILITY_DATABASE'], ['knownStancesAtom', 'STANCE_DATABASE'], ['knownRitesAtom', 'RITE_DATABASE']]) set(key, [...db[name].keys()]);
    store.set(lobby.accountSummaryAtom, { displayName: 'Local layout fixture', isGuest: true });
    store.set(lobby.charactersAtom, Array.from({ length: 8 }, (_, i) => ({
      id: `fixture-${i}`, name: `Mobile Layout Hero ${i}`, globalMastery: 30, playerTier: 1,
      combatArchetype: 'cadence', selectedClass: 'cadence-root', classDisplayName: 'Striker',
      unlockedSkills: ['cadence-root'], nodeId, lastPlayedAt: Date.now(),
    })));
    const root = createRoot(document.getElementById('root'));
    let renderId = 0;
    const panels = {
      craft: ['ui/crafting/CraftingPanel', 'CraftingPanel', { tab: 'make' }],
      upgrade: ['ui/crafting/CraftingPanel', 'CraftingPanel', { tab: 'upgrade' }],
      inventory: ['ui/inventory/InventoryPanel', 'InventoryPanel'],
      abilities: ['ui/BuildPanel', 'BuildPanel'],
      mastery: ['ui/MasteryPanel', 'MasteryPanel'],
      skills: ['ui/SkillTreePanel', 'SkillTreePanel'],
      map: ['ui/map/MapPanel', 'MapPanel'],
      settings: ['hud/settings/SettingsPanel', 'SettingsPanel'],
      seals: ['ui/SealLedgerPanel', 'SealLedgerPanel'],
      bestiary: ['hud/bestiary/BestiaryDetailOverlay', 'BestiaryDetailOverlay'],
      death: ['hud/DeathOverlay', 'DeathOverlay'],
      release: ['hud/ReleaseAnnouncementOverlay', 'ReleaseAnnouncementOverlay'],
      return: ['hud/CharacterSelectPrompt', 'CharacterSelectPrompt'],
      roster: ['auth/AuthGate', 'AuthGate'],
      login: ['auth/AuthGate', 'AuthGate'],
      mobile: ['hud/MobileHUD', 'MobileHUD'],
    };
    window.mobileAudit = {
      async show(name) {
        set('selectedClassAtom', name === 'classes' ? null : 'cadence-root');
        set('buildPanelTabAtom', ['runes', 'stances', 'rites'].includes(name) ? name : 'abilities');
        set('bestiaryOpenAtom', true);
        set('deathOverlayAtom', { active: name === 'death', startedAt: Date.now(), payload: {
          cause: { kind: 'stance', damage: 123, stanceName: 'A long stance name for mobile layout' },
          diedAtNodeId: nodeId, deathPos: { x: 0, y: 0 }, graveFrame: 0,
        } });
        set('releaseAnnouncementAtom', { title: 'Mobile layout release fixture', version: 'test', releasedAt: Date.now(), markdown: '## Release notes\n\n' + 'A long release entry with enough text to require scrolling.\n\n'.repeat(35) });
        store.set(lobby.authPhaseAtom, name === 'roster' ? 'select' : name === 'login' ? 'login' : 'in-world');
        const config = panels[name] ?? (['runes', 'stances', 'rites'].includes(name) ? panels.abilities : panels.skills);
        const [modulePath, exported, props] = config;
        const component = await import(`/src/${modulePath}.tsx`);
        root.render(React.createElement(component[exported], { key: `${name}-${++renderId}`, onClose: () => root.render(null), onCancel: () => root.render(null), ...props }));
      },
    };
  }, `/@fs/${repo.replaceAll('\\', '/')}/shared/src/index.ts`);

  const variants = {
    'rune-editor': ['runes', 'Add rule'],
    'skill-build': ['skills', 'Your build'],
    'skill-compare': ['classes', 'Compare choices'],
    'inventory-stats': ['inventory', 'Stats', 'tab'],
    character: ['mobile', '^Stats$'],
    more: ['mobile', 'More'],
    quests: ['mobile', 'Current quest'],
  };
  const surfaces = ['craft', 'upgrade', 'inventory', 'abilities', 'runes', 'stances', 'rites', 'mastery', 'skills', 'classes', 'map', 'settings', 'seals', 'bestiary', 'death', 'release', 'return', 'roster', 'login', ...Object.keys(variants)];
  for (const [width, height] of [[320, 568], [390, 844], [844, 390], [768, 1024], [1366, 768]]) {
    for (const scale of [0.78, 1.2, 1.44]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(value => document.documentElement.style.setProperty('--ui-font-scale', value), String(scale));
      for (const surface of surfaces) {
        if (onlySurface && surface !== onlySurface) continue;
        if (width > 1100 && ['character', 'more', 'quests', 'inventory-stats'].includes(surface)) continue;
        await page.evaluate(name => window.mobileAudit.show(name), variants[surface]?.[0] ?? surface);
        await page.waitForTimeout(80);
        if (variants[surface]) {
          try {
            const target = page.getByRole(variants[surface][2] ?? 'button', { name: new RegExp(variants[surface][1], 'i') }).first();
            if (engine === 'webkit') {
              // WebKit's actionability stability probe can oscillate under CSS
              // zoom. Use an actual touch at the measured control, not a forced
              // DOM click, and verify the resulting view below.
              await target.evaluate(element => element.scrollIntoView({ block: 'nearest' }));
              const box = await target.boundingBox();
              assert.ok(box && box.width > 0 && box.height > 0);
              await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
            } else await target.click({ timeout: 5000 });
          } catch (error) {
            await page.screenshot({ path: path.join(out, 'interaction-failure.png') });
            console.log({ width, height, scale, surface, state: await page.evaluate(() => ({ width: innerWidth, text: document.body.innerText })) });
            throw error;
          }
          await page.waitForTimeout(100);
          const expected = {
            'rune-editor': '.rune-editor', 'skill-build': '.skill-build-view', 'skill-compare': '.skill-comparison',
            'inventory-stats': '#inventory-stats', character: '.mhud-sheet', more: '.mhud-more', quests: '.mhud-sheet',
          };
          await page.locator(expected[surface]).waitFor({ timeout: 5000 });
        }
        const audit = await page.evaluate(() => {
          const shell = document.querySelector('.game-dialog__panel');
          const rect = shell?.getBoundingClientRect();
          const clipped = [];
          const authContent = document.querySelector('.auth-login-panel, .auth-roster');
          if (authContent && authContent.getBoundingClientRect().top < -1) clipped.push({ selector: 'auth content above scroll origin' });
          for (const element of document.querySelectorAll('body *')) {
            if (!element.clientHeight || !element.clientWidth) continue;
            const style = getComputedStyle(element);
            if (style.clip !== 'auto' || style.clipPath === 'inset(50%)') continue; // Accessible, visually hidden labels.
            // Intentional crops: atlas frames, item-name ellipses, pan/zoom map.
            if (element.matches('.world-map-viewport, .world-map-viewport *, .atlas-sprite, .atlas-sprite *, .game-icon, .game-icon *, .item-icon, .item-icon *, .inv-item-slot__name, .auth-landing-cinematic, .auth-landing-cinematic *')) continue;
            if (style.overflowY === 'hidden' && element.scrollHeight > element.clientHeight + 5) clipped.push({ selector: element.className, client: element.clientHeight, content: element.scrollHeight });
            if (style.overflowX === 'auto' && element.scrollWidth > element.clientWidth + 5 && !element.matches('.craft-filter-row, .dialog-tabs, .release-card__body pre')) clipped.push({ selector: element.className, client: element.clientWidth, content: element.scrollWidth });
          }
          const horizontalOverflow = clipped.length ? [...document.querySelectorAll('body *')].filter(element => element.clientWidth && element.scrollWidth > element.clientWidth + 5).map(element => ({ selector: element.className || element.tagName, width: element.clientWidth, content: element.scrollWidth })) : [];
          return { rect: rect && { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom }, clipped, horizontalOverflow };
        });
        if (audit.rect && (audit.rect.x < -1 || audit.rect.y < -1 || audit.rect.right > width + 1 || audit.rect.bottom > height + 1)) audit.clipped.push({ selector: 'dialog outside viewport', ...audit.rect });
        results.push({ width, height, scale, surface, ...audit });
        if ([320, 844].includes(width) && scale === 1.44) await page.screenshot({ path: path.join(out, `${width}-${surface}.png`), animations: 'disabled' });
      }
    }
  }
  // Real touch events, rather than assigning scrollTop, catch gesture blockers.
  if (engine === 'chromium' && !onlySurface) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => document.documentElement.style.setProperty('--ui-font-scale', '1.2'));
    const cdp = await page.context().newCDPSession(page);
    for (const surface of ['craft', 'upgrade']) {
      await page.evaluate(name => window.mobileAudit.show(name), surface);
      const content = page.locator('.crafting-dialog__content');
      await content.waitFor();
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 100, y: 260 }] });
      for (let y = 240; y >= 120; y -= 20) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 100, y }] });
        await page.waitForTimeout(20);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      assert.ok(await content.evaluate(element => element.scrollTop > 0), `${surface} did not scroll on a touch swipe`);
      const action = page.locator(surface === 'craft' ? '.browser-pane__detail button' : '.craft-recipe__btn').last();
      await action.scrollIntoViewIfNeeded();
      const box = await action.boundingBox();
      assert.ok(box && box.y >= 0 && box.y + box.height <= 844, `${surface} final action is unreachable`);
      await page.getByRole('button', { name: /^Close / }).click();
      await page.locator('.game-dialog__panel').waitFor({ state: 'detached' });
    }
    console.log('Touch swipes, final action reachability, and dialog dismissal passed');
  }
  fs.writeFileSync(path.join(out, 'layout.json'), JSON.stringify(results, null, 2));
  const failures = results.filter(result => result.clipped.length);
  console.log(JSON.stringify(failures, null, 2));
  assert.equal(errors.length, 0, errors.join('\n'));
  assert.equal(failures.length, 0, `${failures.length} layout cases failed; see ${out}`);
  console.log(`mobile-audit: ${results.length} layout cases passed`);
} finally {
  await browser.close();
}
