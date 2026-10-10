import assert from 'node:assert/strict';
import type { CombatEvent, Vec2 } from '@mmo-idle/shared';
import { flushCombatText, prepareCombatText, renderCombatText } from '../../client/src/render/combatText';
import { createRenderState } from '../../client/src/render/state';
import { ELEMENT_STYLE, SHIELD_DAMAGE_COLOR } from '../../client/src/render/damageNumberStyle';
import { hydrateSpectatorSnapshot } from '../../client/src/net/spectatorSnapshot';
import { NUMBER_TOKENS } from '../../client/src/render/readoutTokens';
import { resolveMonsterDamageStyle, resolvePlayerDamageStyle, resolveShieldDamageStyle } from '../../client/src/render/damageNumberStyle';
import { noteCombatTextNode } from '../../client/src/render/combatText';

const hit = (damage: number, extra = {}): CombatEvent => ({
  kind: 'player-hit', playerId: 'p', targetId: 'm', targetName: 'Monster',
  damage, empowered: false, execution: false, targetPos: { x: 100, y: 100 }, ...extra,
});
const dot = (amount: number, element: 'fire' | 'poison' = 'fire'): CombatEvent => ({
  kind: 'dot-tick', targetId: 'm', targetPos: { x: 100, y: 100 }, amount, element, sourceType: 'class',
});
/** A stand-in for a Phaser floater: records the lift the lane gives it. */
function fakeFloater() {
  const f = { height: 15, lift: 0, alive: true,
    isAlive: () => f.alive, setLift: (l: number) => { f.lift = l; }, destroy: () => { f.alive = false; } };
  return f;
}
/** Direct hits draw at once; DoT ticks draw when their one-second window closes. */
function present(events: CombatEvent[], kind: 'monster' | 'player' | 'minion' = 'monster') {
  const batch = prepareCombatText(events);
  const state = createRenderState();
  state.kind.set('m', kind);
  state.ownId = 'm';
  const output: { amount: number; color: string; pos: Vec2; symbol?: string; suffix?: string; floater: ReturnType<typeof fakeFloater> }[] = [];
  const spawn = (pos: Vec2, _offset: number, amount: number, color: string, style?: { symbol?: string; suffix?: string }) => {
    const floater = fakeFloater();
    output.push({ pos, amount, color, symbol: style?.symbol, suffix: style?.suffix, floater });
    return floater;
  };
  renderCombatText(batch, state, spawn, 0);
  flushCombatText(state, spawn, 1000);
  return { batch, state, output };
}

// Real presentation adapter/spawn seam: no HP patch is required, so healing or
// identical endpoint HP cannot cancel the damage number.
{
  const { output, state } = present([hit(100), dot(30), dot(12, 'poison')]);
  assert.deepEqual(output.map(x => x.amount), [100, 30, 12]);
  assert.deepEqual(output.map(x => x.color), ['#ffffff', ELEMENT_STYLE.fire.color, ELEMENT_STYLE.poison.color]);
  assert.equal(output[1].symbol, ELEMENT_STYLE.fire.symbol);
  assert.equal(output[2].symbol, ELEMENT_STYLE.poison.symbol);
}
{
  const { output } = present([hit(20), hit(20, { empowered: true }), hit(20)]);
  assert.deepEqual(output.map(x => x.amount), [20, 20, 20]);
  assert.deepEqual(output.map(x => x.floater.lift), [34, 17, 0], 'the lane stacks hits: newest at the base, older lifted');
  assert.equal(output[0].suffix, undefined);
  assert.equal(output[1].suffix, '!');
  assert.equal(output[2].suffix, undefined, 'empowerment must not leak to another hit');
}
{
  const { output, state } = present([hit(0, { absorbed: 45 })]);
  assert.deepEqual(output.map(x => x.amount), [45]);
  assert.equal(output[0].color, SHIELD_DAMAGE_COLOR);
  const mixed = present([hit(10, { absorbed: 15, evadedPartial: true }), dot(3)]).output;
  assert.deepEqual(mixed.map(x => x.amount), [10, 15, 3]);
  assert.equal(mixed[0].suffix, '~');
  assert.equal(mixed[2].color, ELEMENT_STYLE.fire.color, 'mitigation must not restyle DoT');
}
{
  const kill: CombatEvent = {
    kind: 'player-kill', playerId: 'p', targetId: 'm', targetName: 'Monster', damage: 100,
    biomeXpGained: 1, essenceGained: 1, essenceType: 'green',
  };
  const { output, state } = present([hit(100), kill]);
  assert.deepEqual(output.map(x => x.amount), [100], 'lethal hit survives without a final HP patch/sprite');
  assert.deepEqual(present([kill]).output, [], 'kill events never duplicate damage numbers');
}
{
  const legacy = { kind: 'monster-hit', targetId: 'm' } as CombatEvent;
  assert.deepEqual(present([legacy]).output, [], 'missing amount is safely omitted');
  assert.equal(present([hit(Number.NaN)]).output.length, 0);
  assert.deepEqual(prepareCombatText([hit(20)], { stateSync: true }).entries, [], 'state sync is a silent baseline');
  assert.deepEqual(present([]).output, [], 'HP alone cannot produce a number');
}
{
  const incoming = dot(30);
  assert.equal(present([incoming], 'player').output[0].color, ELEMENT_STYLE.fire.color);
  assert.equal(present([hit(10)], 'minion').output[0].color, '#ffd1d1');
  const batch = prepareCombatText([{ kind: 'monster-hit', targetId: 'missing', damage: 10 }]);
  renderCombatText(batch, createRenderState(), () => assert.fail('unknown target without position should be skipped'));
  const removedPlayer = prepareCombatText([{ kind: 'monster-hit', targetId: 'missing', damage: 10, targetPos: { x: 10, y: 20 } }]);
  const colors: string[] = [];
  renderCombatText(removedPlayer, createRenderState(), (_p, _o, _a, color) => colors.push(color));
  assert.deepEqual(colors, ['#ff8844'], 'incoming damage retains player styling without a sprite');
}
{
  const snapshot = hydrateSpectatorSnapshot({
    nodeId: 'node', tick: 10, full: true, deltas: [], events: [hit(20), dot(5)],
  }, 'node', ['m']);
  assert.equal(snapshot.full, true);
  assert.deepEqual(present(snapshot.events).output.map(x => x.amount), [20, 5], 'live full spectator snapshots retain text');
  assert(snapshot.deltas.some(x => x.kind === 'remove' && x.netId === 'm'));
}
{
  const { output } = present(Array.from({ length: 100 }, () => hit(1)));
  assert.equal(output.length, 5, 'burst presentation is bounded by the lane cap without a delayed backlog');
}

// ── The combat readout (docs/briefs/combat-readout-run-2026-10-06.md) ──────────
// ── Colour and motion by kind ────────────────────────────────────────────────
{
  const direct = resolveMonsterDamageStyle({ hasDirectHit: true, empowered: false, execution: false }, { amount: 10, maxHp: 100 });
  assert.equal(direct.color, NUMBER_TOKENS.color.direct);
  assert.equal(direct.style?.band, 'hit');
  assert.equal(direct.style?.motion, 'hit');
  const dot = resolveMonsterDamageStyle({ hasDirectHit: false, isDot: true, empowered: false, execution: false, dotElement: 'bleed' },
    { amount: 90, maxHp: 100 });
  assert.equal(dot.color, NUMBER_TOKENS.element.bleed);
  assert.equal(dot.style?.motion, 'dot');
  assert.equal(dot.style?.band, NUMBER_TOKENS.dotMaxBand, 'a DoT number never draws above its cap');
  const taken = resolvePlayerDamageStyle({ hasDirectHit: true, empowered: false, execution: false }, NUMBER_TOKENS.color.takenOwn,
    { amount: 95, maxHp: 220 });
  assert.equal(taken.color, NUMBER_TOKENS.color.takenOwn);
  assert.equal(taken.style?.band, 'swing', 'incoming damage uses the same bands against the player pool');
  const shield = resolveShieldDamageStyle({ amount: 30, maxHp: 220 });
  assert.equal(shield.color, NUMBER_TOKENS.color.shield);
  assert.equal(shield.style?.band, 'heavy');
}

function floater(height = 10) {
  const f = { height, lift: -1, alive: true, destroyed: false,
    isAlive: () => f.alive, setLift: (l: number) => { f.lift = l; }, destroy: () => { f.alive = false; f.destroyed = true; } };
  return f;
}
// ── Wiring: entries carry their pool, DoTs wait, a node change drops windows ──
{
  const state = createRenderState();
  state.kind.set('m', 'monster');
  state.view.set('m', { maxHp: 160 } as never);
  const out: { amount: number; size?: number; color: string }[] = [];
  const spawn = (_p: Vec2, _o: number, amount: number, color: string, style?: { sizePx?: number }) => {
    out.push({ amount, size: style?.sizePx, color });
    return floater(style?.sizePx ?? 10);
  };
  const tickOf = (amount: number): CombatEvent => ({ kind: 'dot-tick', targetId: 'm', targetPos: { x: 1, y: 1 }, amount, element: 'bleed', sourceType: 'class' });
  const hitOf = (damage: number, empowered = false): CombatEvent => ({ kind: 'player-hit', playerId: 'p', targetId: 'm', targetName: 'Rat',
    damage, empowered, execution: false, targetPos: { x: 1, y: 1 } });
  renderCombatText(prepareCombatText([hitOf(15), tickOf(3)]), state, spawn, 0);
  assert.deepEqual(out.map(o => o.amount), [15], 'the hit draws at once, the tick waits');
  assert.equal(out[0].size, NUMBER_TOKENS.bands[1].sizePx, '15 of 160 is a "hit"');
  state.view.delete('m'); // the target dies inside the window
  renderCombatText(prepareCombatText([tickOf(2)]), state, spawn, 400);
  flushCombatText(state, spawn, 1000);
  assert.deepEqual(out.map(o => o.amount), [15, 5], 'the window draws one summed number');
  assert.equal(out[1].color, NUMBER_TOKENS.element.bleed);
  assert.equal(out[1].size, NUMBER_TOKENS.bands[0].sizePx, 'the captured pool still sizes it after the view is gone');
  noteCombatTextNode(state, 'a');
  renderCombatText(prepareCombatText([tickOf(9)]), state, spawn, 2000);
  noteCombatTextNode(state, 'b');
  flushCombatText(state, spawn, 5000);
  assert.equal(out.length, 2, 'a window from the old node never draws in the new one');
}

// ── The crit look is one look ────────────────────────────────────────────────
{
  const base = { hasDirectHit: true, empowered: false, execution: false };
  const share = { amount: 15, maxHp: 160 };
  const crit = resolveMonsterDamageStyle({ ...base, empowered: true }, share);
  assert.equal(crit.color, NUMBER_TOKENS.crit.color);
  assert.equal(crit.style?.suffix, NUMBER_TOKENS.crit.suffix);
  assert.equal(crit.style?.motion, 'crit');
  assert.equal(crit.style?.band, 'heavy', 'a crit moves up one band (15 of 160 is a "hit")');
  assert.equal(resolveMonsterDamageStyle({ ...base, execution: true }, share).color, NUMBER_TOKENS.crit.color);
  const fireCrit = resolveMonsterDamageStyle({ ...base, hasDirectHit: false, empowered: true, dotElement: 'fire' }, share);
  assert.equal(fireCrit.color, NUMBER_TOKENS.element.fire, 'an elemental crit keeps its element colour');
  assert.equal(fireCrit.style?.band, 'heavy', '...with the crit size');
  assert.equal(fireCrit.style?.symbol, ELEMENT_STYLE.fire.symbol);
  // Nothing else is gold.
  const others = [
    resolveMonsterDamageStyle(base, share),
    resolveMonsterDamageStyle({ ...base, capped: true, empowered: true }, share),
    resolveMonsterDamageStyle({ ...base, evadedPartial: true }, share),
    resolveMonsterDamageStyle({ ...base, hasDirectHit: false, isDot: true }, share),
    ...(['poison', 'fire', 'frost', 'lightning', 'bleed', 'doom'] as const).map(dotElement =>
      resolveMonsterDamageStyle({ ...base, hasDirectHit: false, isDot: true, dotElement }, share)),
    resolvePlayerDamageStyle({ ...base, empowered: true }, NUMBER_TOKENS.color.takenOwn, share),
    resolvePlayerDamageStyle(base, NUMBER_TOKENS.color.takenOther, share),
    resolveShieldDamageStyle(share),
  ];
  for (const look of others) assert.notEqual(look.color, NUMBER_TOKENS.crit.color, 'gold means crit and nothing else');
  const incomingCrit = resolvePlayerDamageStyle({ ...base, empowered: true }, NUMBER_TOKENS.color.takenOwn, share);
  assert.equal(incomingCrit.style?.motion, 'crit', 'an incoming crit is larger...');
  assert.equal(incomingCrit.color, NUMBER_TOKENS.color.takenOwn, '...in the damage-taken colour');
  // The crit floor: 51 of the Behemoth's 2100 is a chip, its crit still draws at heavy.
  const bossShare = { amount: 51, maxHp: 2100 };
  assert.equal(resolveMonsterDamageStyle(base, bossShare).style?.band, 'chip');
  assert.equal(resolveMonsterDamageStyle({ ...base, empowered: true }, bossShare).style?.band, 'heavy',
    'a crit on a big pool draws at the crit floor, not one band up from chip');
  assert.equal(resolvePlayerDamageStyle({ ...base, empowered: true }, NUMBER_TOKENS.color.takenOwn, bossShare).style?.band,
    'heavy', 'the incoming crit takes the same floor');
}
console.log('combatText.test.ts: ok');
