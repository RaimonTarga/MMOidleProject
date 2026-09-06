import assert from 'node:assert/strict';
import type { CombatEvent, Vec2 } from '@mmo-idle/shared';
import { prepareCombatText, renderCombatText } from '../../client/src/render/combatText';
import { createRenderState } from '../../client/src/render/state';
import { ELEMENT_STYLE, SHIELD_DAMAGE_COLOR } from '../../client/src/render/damageNumberStyle';
import { hydrateSpectatorSnapshot } from '../../client/src/net/spectatorSnapshot';

const hit = (damage: number, extra = {}): CombatEvent => ({
  kind: 'player-hit', playerId: 'p', targetId: 'm', targetName: 'Monster',
  damage, empowered: false, execution: false, targetPos: { x: 100, y: 100 }, ...extra,
});
const dot = (amount: number, element: 'fire' | 'poison' = 'fire'): CombatEvent => ({
  kind: 'dot-tick', targetId: 'm', targetPos: { x: 100, y: 100 }, amount, element, sourceType: 'class',
});
function present(events: CombatEvent[], kind: 'monster' | 'player' | 'minion' = 'monster') {
  const batch = prepareCombatText(events);
  const state = createRenderState();
  state.kind.set('m', kind);
  state.ownId = 'm';
  const output: { amount: number; color: string; pos: Vec2; symbol?: string; suffix?: string }[] = [];
  renderCombatText(batch, state, (pos, _offset, amount, color, style) => {
    output.push({ pos, amount, color, symbol: style?.symbol, suffix: style?.suffix });
  });
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
  assert.equal(new Set(output.map(x => x.pos.y)).size, 3, 'hits occupy distinct vertical positions');
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
  assert.equal(output.length, 12, 'burst presentation is bounded without a delayed backlog');
}
console.log('combatText.test.ts: ok');
