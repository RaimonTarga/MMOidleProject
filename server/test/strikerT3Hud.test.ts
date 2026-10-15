/**
 * The Striker's T3 state as the HUD strip words it (T3-W2): Afterimage's held slashes and Frenzy's
 * finisher count ride on the discipline's resource line.
 */
import assert from 'node:assert/strict';
import { orderResourceFor, orderResourceText } from '../../client/src/hud/orderResource';

const base = { lit: true, edge: 0, momentum: 0 };

const plain = orderResourceFor('striker-light', base);
assert(plain && plain.note === null, 'no specialization, no extra words');
assert.equal(orderResourceText(plain!, 4), 'Shine lit');

const image = orderResourceFor('striker-light', { ...base, specializationId: 'striker-afterimage', held: 3 });
assert.equal(orderResourceText(image!, 4), 'Shine lit · 3 slashes held');
assert.equal(
  orderResourceText(orderResourceFor('striker-light', { ...base, specializationId: 'striker-afterimage', held: 1 })!, 4),
  'Shine lit · 1 slash held',
);
assert.equal(
  orderResourceText(orderResourceFor('striker-light', { ...base, specializationId: 'striker-afterimage', held: 0 })!, 4),
  'Shine lit',
  'nothing held, nothing said',
);

const heavy = { lit: false, edge: 0, momentum: 0.5, specializationId: 'striker-frenzy' };
assert.equal(orderResourceText(orderResourceFor('striker-heavy', { ...heavy, fightFinishers: 0 })!, 4), 'Momentum +50% · Frenzy 0 of 2');
assert.equal(orderResourceText(orderResourceFor('striker-heavy', { ...heavy, fightFinishers: 2 })!, 4), 'Momentum +50% · Frenzy ready');
assert.equal(
  orderResourceText(orderResourceFor('striker-heavy', { ...heavy, fightFinishers: 2, frenzyArmed: true })!, 4),
  'Momentum +50% · Frenzy: second finisher armed',
);

console.log('strikerT3Hud: ok');
