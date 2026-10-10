/**
 * The fire-shape table (design §22.10, "Fire-shape", LOCKED 2026-10-02) and the
 * Kill chain `kill` tag.
 *
 * Data, not runtime: the table says WHERE and WHEN each ability's packet payoff
 * fires, from a closed list, and every entry maps to an existing trigger seam
 * (hit, kill, guard-cast, hit-taken, evade, pulse, cleanse, break-free) — a
 * fire-shape with no seam would be a defect to report, never a new primitive.
 * The runtime that honours each shape is pinned by
 * `abilityFireShapesRuntime.test.ts`, one wiring smoke per shape.
 *
 * Run: node --conditions=development --import tsx test/abilityFireShapes.test.ts
 */
import {
  ABILITY_DATABASE,
  ABILITY_FIRE_SHAPES,
  ABILITY_FIRE_SHAPE_SEAM,
  ABILITY_KILL_TRIGGER_OFFERS,
  ABILITY_PACKET_OFFERS,
  abilityOfferFireShape,
  type AbilityFireSeam,
  type AbilityFireShape,
} from '@mmo-idle/shared';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

// The closed list, exactly as §22.10 writes it, and the seams it may ride.
const CLOSED_LIST: readonly AbilityFireShape[] = [
  'on land', 'on every body hit', 'on each hit of a window', 'on the kill', 'on cast',
  'per hit absorbed', 'per hit dodged', 'per tick while active', 'on strip', 'on the break',
];
const SEAMS: readonly AbilityFireSeam[] = [
  'hit', 'kill', 'guard-cast', 'hit-taken', 'evade', 'pulse', 'cleanse', 'break-free',
];

// ── 1. Every closed-list shape maps to a named existing seam ─────────────────
assert(Object.keys(ABILITY_FIRE_SHAPE_SEAM).length === CLOSED_LIST.length, 'the seam map covers exactly the closed list');
for (const shape of CLOSED_LIST) {
  const seam = ABILITY_FIRE_SHAPE_SEAM[shape];
  assert(SEAMS.includes(seam), `${shape} must map to an existing trigger seam (got ${String(seam)})`);
}

// ── 2. Every ability has exactly one row, from the closed list ───────────────
assert(ABILITY_FIRE_SHAPES.size === ABILITY_DATABASE.size,
  `one fire-shape row per ability: ${ABILITY_FIRE_SHAPES.size} rows for ${ABILITY_DATABASE.size} abilities`);
for (const ability of ABILITY_DATABASE.values()) {
  const row = ABILITY_FIRE_SHAPES.get(ability.id);
  assert(!!row, `${ability.id} has no fire-shape row`);
  assert(CLOSED_LIST.includes(row!.fire), `${ability.id}: '${row!.fire}' is not on the closed list`);
  assert(row!.reads.length > 0, `${ability.id}: the row keeps the table's own sentence`);
  // A Guard fires on its own moment, never on a weapon hit it does not make.
  if (ability.slot === 'guard') {
    assert(ABILITY_FIRE_SHAPE_SEAM[row!.fire] !== 'hit', `${ability.id}: a Guard's packet cannot ride the hit seam`);
  }
}

// The table's lines that the LOCKED review spelled out word for word.
const EXPECTED: Record<string, string> = {
  sweep: 'on every body the cleave hits',
  charge: 'on the first body the rush touches, and the target on arrival',
  slam: 'on every body the Slam hits',
  'second-wind': 'on cast',
  // Amended by design §22.13: fires when it removed anything; the sizing is gone.
  cleanse: 'on strip',
  brace: 'per hit absorbed while Braced',
  sidestep: 'per hit dodged during the window',
  'binding-strike': 'on the rooted body',
  contagion: 'on every body the spread reaches',
  snipe: 'on the shot body',
  'bramble-guard': 'per thorn hit',
  endure: 'per tick while held',
  'imbue-lightning': 'on each imbued hit',
  detonate: 'on the detonated body',
  cull: 'on the struck body',
  'break-free': 'on the break',
  disengage: 'on the body you broke from',
  'stunning-strike': 'on the stunned body',
  recuperate: 'per tick of the mend',
};
for (const [id, reads] of Object.entries(EXPECTED)) {
  assert(ABILITY_FIRE_SHAPES.get(id)?.reads === reads, `${id}: the row must read "${reads}"`);
}

// ── 3. The Kill chain override and its `kill` tag ────────────────────────────
// §22.10: a Kill chain offer on a Technique fires on the KILL its hit makes, not
// on landing. Tagged exactly where a Technique offers Kill chain.
const killChainTechniques = [...ABILITY_PACKET_OFFERS.entries()]
  .filter(([id, offers]) => ABILITY_DATABASE.get(id)?.slot === 'technique' && offers.some(([lane]) => lane === 'kill-chain'))
  .map(([id]) => id)
  .sort();
assert(
  [...ABILITY_KILL_TRIGGER_OFFERS].sort().join() === killChainTechniques.join(),
  `the kill tag must sit on exactly the Techniques that offer Kill chain (${killChainTechniques.join()})`,
);
assert(
  ['charge', 'contagion', 'disengage', 'snipe', 'cull'].every((id) => ABILITY_KILL_TRIGGER_OFFERS.has(id)),
  'Charge, Contagion, Disengage, Snipe and Cull carry the kill tag (§22.10)',
);
for (const id of ABILITY_KILL_TRIGGER_OFFERS) {
  assert(abilityOfferFireShape(id, 'kill-chain') === 'on the kill', `${id}: its Kill chain offer fires on the kill`);
  assert(ABILITY_FIRE_SHAPE_SEAM['on the kill'] === 'kill', 'the kill shape rides the kill seam');
  // Every other route keeps the ability's own fire-shape.
  for (const [lane] of ABILITY_PACKET_OFFERS.get(id)!) {
    if (lane === 'kill-chain') continue;
    assert(abilityOfferFireShape(id, lane) === ABILITY_FIRE_SHAPES.get(id)!.fire,
      `${id}/${lane}: a non-Kill-chain route keeps the ability's own fire-shape`);
  }
}
// A Guard's Kill chain offer (a Recovery window) keeps its Guard's own shape.
assert(abilityOfferFireShape('second-wind', 'kill-chain') === 'on cast', 'a Guard is never kill-tagged');

// The payoff each Kill chain row pays (§22.10, conductor addendum F): Charge,
// Contagion, Disengage and Snipe refund part of their cooldown; Cull, which
// refunds natively, opens its speed window instead.
for (const id of ['charge', 'contagion', 'disengage', 'snipe']) {
  const offer = ABILITY_PACKET_OFFERS.get(id)!.find(([lane]) => lane === 'kill-chain');
  assert(offer?.[1] === 'technique-refund', `${id}: its Kill chain offer pays the cooldown refund`);
}
assert(ABILITY_PACKET_OFFERS.get('cull')!.find(([lane]) => lane === 'kill-chain')?.[1] === 'speed-window',
  'Cull: its Kill chain offer opens the speed window');

console.log('abilityFireShapes: ok');
