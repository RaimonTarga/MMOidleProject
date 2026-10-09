/**
 * The ability keystones — the keystone row of the ability node tree (design §22.1,
 * §22.4, §22.10, §22.11).
 *
 * WHAT A KEYSTONE IS HERE. Every other ability-node row is data over the closed
 * vocabulary (`offers.ts` and what `index.ts` derives from it). The keystone row is
 * the exception, exactly as the lane keystone row is (§4, `lineages/keystones.ts`):
 * a named server module that changes a RULE of one ability — "the flashy verb" —
 * never a number. So shared owns its IDENTITY (name, rule sentence, delivery body,
 * fx key, the payoff kind it is, whether it pays a share) and the server owns its
 * BEHAVIOUR, one module per keystone under
 * `server/src/systems/combat/keystones/ability/`.
 *
 * THREE VERBS PER ABILITY (§22.11). "The keystone row holds three verbs, pick one,
 * at home + 2." All three of every trio are authored here — names and rules from
 * the design's table — so the choice exists from the start. A verb whose server
 * module has not landed yet is `live: false`: the row shows it as a silhouette and
 * the shared purchase check refuses it ("not yet"), so a designed verb can never
 * be bought into a no-op. A later wave flips `live` when it adds the module, and
 * `abilityKeystones.test.ts` holds the two in step (every live verb has a module,
 * every module's verb is live).
 *
 * THE ROSTER IS THE FINAL ONE (§22.8, 19 abilities): the five §22.2 cuts have no
 * trio, and Sidestep and Cull have theirs before their ability exists. Every
 * lookup into the ability database is gated so an id it does not (yet) hold is
 * skipped rather than an error: the node tree is built from the ability database,
 * so a trio waits until its ability arrives.
 *
 * NO NUMBERS. A keystone that pays a share of a hit (`paysShare`) resolves it from
 * the magnitude table at `ROW_SCALAR.keystone` through `payoffValue`, like the lane
 * keystones; a rule with no magnitude names the payoff kind it IS only so every
 * non-stat row does something (as the lane keystones' cards do). The few timings
 * a rule needs live in {@link ABILITY_KEYSTONE_UNITS}, beside the lineage units
 * they reuse, never in a runtime module.
 *
 * Design authority: `design_docs/progression-rework-design.md` §22.4, §22.10, §22.11.
 */
import type { LineageFxKey, PacketId, PayoffKind } from '../lineages/types';
import { PACKET_IDS } from '../lineages/types';

/**
 * The body a keystone resolves on (design §22.10: "every keystone names its
 * delivery body"):
 *
 *  - `owner`           the player, wherever they stand;
 *  - `delivering-body` the physical summon or formation body that landed the
 *                      ability on a Conduit; the owner everywhere else;
 *  - `formation`       the owner's summons and same-node party.
 */
export type AbilityKeystoneDelivery = 'owner' | 'delivering-body' | 'formation';

export interface AbilityKeystoneDefinition {
  /** The ability whose keystone row this verb sits in. */
  abilityId: string;
  /** Stable id: the verb's own name, kebab-cased. Persisted in option ids. */
  id: string;
  /** Player-facing name. Renames the ability outright (§22.7, §22.10). */
  name: string;
  /** The rule, one sentence — the whole card (design §26.4). */
  rule: string;
  /** An existing `LineageFxKey` with a client handler: no new switch arm. */
  fx: LineageFxKey;
  delivery: AbilityKeystoneDelivery;
  /** The verb's place in its trio (§22.11). The first is this run's. */
  verb: 1 | 2 | 3;
  /** The payoff kind the rule is (see the file header). */
  payoff: PayoffKind;
  /**
   * The rule pays a SHARE of a hit, resolved from the magnitude table at
   * `ROW_SCALAR.keystone` for {@link payoff} through `payoffValue` — never a
   * literal. Absent on a rule whose numbers are timings, reaches or a refusal.
   */
  paysShare?: true;
  /**
   * True once the server has a module behind this verb. A verb that is not live
   * is a silhouette: shown, never sold.
   */
  live: boolean;
  /** A designer's note carried with the verb (§22.11), for the report and tooltip. */
  note?: string;
}

/** The lane a keystone's fx key draws in — the colour its card wears. */
export function keystoneFxLane(fx: LineageFxKey): PacketId {
  const lane = fx.split('.')[0] as PacketId;
  return PACKET_IDS.includes(lane) ? lane : 'technique';
}

type Trio = readonly [AbilityKeystoneDefinition, AbilityKeystoneDefinition, AbilityKeystoneDefinition];

/** Author one verb. `live` defaults to false: a designed verb is a silhouette. */
function verb(
  abilityId: string,
  index: 1 | 2 | 3,
  id: string,
  name: string,
  rule: string,
  fx: LineageFxKey,
  payoff: PayoffKind,
  options: {
    delivery?: AbilityKeystoneDelivery;
    paysShare?: true;
    live?: boolean;
    note?: string;
  } = {},
): AbilityKeystoneDefinition {
  return {
    abilityId, id, name, rule, fx, payoff,
    delivery: options.delivery ?? 'owner',
    verb: index,
    ...(options.paysShare ? { paysShare: true as const } : {}),
    live: options.live ?? false,
    ...(options.note ? { note: options.note } : {}),
  };
}

const DB = 'delivering-body' as const;

/**
 * The trios, in the §22.11 table's order. The first verb of each is §22.4's (with
 * Charge's Breakthrough in Trample's place: §22.11 dropped Trample). Delivery
 * bodies are the table's parentheses and §22.10's explicit calls.
 */
const trioEntries: [string, Trio][] = [
  // ── Techniques ────────────────────────────────────────────────────────────
  ['sweep', [
    verb('sweep', 1, 'whirlwind', 'Whirlwind',
      'Sweep becomes a one-second spin that cleaves every tick.',
      'tempo.gale-wake', 'echo-hit', { paysShare: true, live: true }),
    verb('sweep', 2, 'reap', 'Reap',
      'A Sweep kill cleaves again from the body it killed.',
      'kill-chain.spread-arc', 'echo-hit', { delivery: DB }),
    verb('sweep', 3, 'momentum', 'Momentum',
      'A Sweep that hits three or more bodies re-arms at once.',
      'tempo.keystone', 'technique-refund',
      { delivery: DB, note: 'Flagged by the designer as probably broken; test before shipping.' }),
  ]],
  ['charge', [
    verb('charge', 1, 'breakthrough', 'Breakthrough',
      'Arriving staggers the target.',
      'control.knockdown', 'stun', { delivery: DB, live: true }),
    verb('charge', 2, 'rebound', 'Rebound',
      'If the Charge kills, the rush continues to the next body in reach and lands there.',
      'engagement.lunge', 'echo-hit', { delivery: DB }),
    verb('charge', 3, 'impact', 'Impact',
      'Arrival also hits every body adjacent to the target.',
      'empowered.quake-ring', 'echo-hit', { delivery: DB, paysShare: true }),
  ]],
  ['slam', [
    verb('slam', 1, 'aftershock', 'Aftershock',
      'The ground erupts again at the same spot one second later.',
      'empowered.quake-ring', 'echo-hit', { paysShare: true, live: true }),
    verb('slam', 2, 'tremor', 'Tremor',
      'Every body the Slam hits is staggered.',
      'control.knockdown', 'stun', { delivery: DB }),
    verb('slam', 3, 'crater', 'Crater',
      'The Slam leaves a crater that slows anything standing in it.',
      'control.mire-grasp', 'slow',
      { delivery: DB, note: 'Designer: a slow alone is thin unless you slam distant bodies; may gain a burn later. Test as is.' }),
  ]],
  ['binding-strike', [
    verb('binding-strike', 1, 'dragnet', 'Dragnet',
      'The root takes every body adjacent to the target.',
      'control.shackle', 'root', { delivery: DB, live: true }),
    verb('binding-strike', 2, 'impale', 'Impale',
      'A rooted target cannot attack you while you stand at max reach.',
      'control.keystone', 'root'),
    verb('binding-strike', 3, 'trapper', 'Trapper',
      'Binding Strike stays armed for two hits, rooting two bodies in a row.',
      'control.shackle', 'root', { delivery: DB }),
  ]],
  ['contagion', [
    verb('contagion', 1, 'outbreak', 'Outbreak',
      'A body Contagion infected passes its afflictions to its nearest neighbour when it dies.',
      'affliction.stinger-echo', 'contagion', { delivery: DB, live: true }),
    verb('contagion', 2, 'carrier', 'Carrier',
      'Afflicted bodies infect what touches them.',
      'affliction.spore-veil', 'contagion', { delivery: DB }),
    verb('contagion', 3, 'plague-wind', 'Plague Wind',
      'Contagion spreads from every afflicted body in reach, not only the one you hit.',
      'affliction.keystone', 'contagion', { delivery: DB }),
  ]],
  ['snipe', [
    verb('snipe', 1, 'pierce', 'Pierce',
      'The shot passes through its target and hits everything in line behind it.',
      'tempo.ruin-afterimage', 'echo-hit', { delivery: DB, paysShare: true, live: true }),
    verb('snipe', 2, 'mark', 'Mark',
      'The sniped body takes your next Technique as if from max reach.',
      'empowered.weak-point', 'vulnerability'),
    verb('snipe', 3, 'overwatch', 'Overwatch',
      'While you hold for the wind-up you cannot be interrupted, and the shot cannot be dodged.',
      'technique.cast-flare', 'damage-window'),
  ]],
  ['imbue-lightning', [
    verb('imbue-lightning', 1, 'fork', 'Fork',
      'Every imbued hit arcs to the nearest other body.',
      'kill-chain.spread-arc', 'echo-hit', { delivery: DB, paysShare: true, live: true }),
    verb('imbue-lightning', 2, 'static', 'Static',
      'An imbued hit that kills refunds its charge.',
      'technique.refund-flash', 'technique-refund'),
    verb('imbue-lightning', 3, 'thunderclap', 'Thunderclap',
      'The last charge discharges in an area around the target.',
      'empowered.quake-ring', 'echo-hit', { delivery: DB }),
  ]],
  ['detonate', [
    verb('detonate', 1, 'chain-reaction', 'Chain Reaction',
      'A Detonate kill detonates every afflicted body in reach.',
      'affliction.keystone', 'hemorrhage', { delivery: DB, live: true }),
    verb('detonate', 2, 'fuse', 'Fuse',
      'The detonation lands a second later, doubled on a body still afflicted.',
      'affliction.double-dose', 'hemorrhage', { delivery: DB }),
    verb('detonate', 3, 'smoulder', 'Smoulder',
      'Half the afflictions survive the detonation.',
      'affliction.heavy-drip', 'hemorrhage', { delivery: DB }),
  ]],
  ['cull', [
    verb('cull', 1, 'harvest', 'Harvest',
      'A Cull kill lands the same strike on the nearest body below the same health share, and keeps going while it keeps killing.',
      'kill-chain.keystone', 'echo-hit', { delivery: DB, live: true }),
    verb('cull', 2, 'death-sentence', 'Death Sentence',
      'A body Cull hits but does not kill is marked; your next kill of any body also kills it if it is below the threshold.',
      'empowered.weak-point', 'vulnerability'),
    verb('cull', 3, 'executioners-eye', "Executioner's Eye",
      'Cull targets the lowest-health body in reach, not the one you are fighting.',
      'engagement.opening-flash', 'damage-window'),
  ]],
  ['disengage', [
    verb('disengage', 1, 'vanish', 'Vanish',
      "Breaking contact drops you from every nearby monster's aggro until your next hit.",
      'engagement.sidestep-blur', 'evasion-window', { live: true }),
    verb('disengage', 2, 'parting-shot', 'Parting Shot',
      'Disengage also arms your next hit as an opening strike.',
      'engagement.opening-flash', 'damage-window'),
    verb('disengage', 3, 'caltrops', 'Caltrops',
      'The spot you left slows any body that crosses it.',
      'control.frost-drag', 'slow'),
  ]],
  ['stunning-strike', [
    verb('stunning-strike', 1, 'relay', 'Relay',
      'When the stun ends it jumps to the nearest body not yet stunned this fight.',
      'control.keystone', 'stun', { delivery: DB, live: true }),
    verb('stunning-strike', 2, 'concussion', 'Concussion',
      'The stun lands on every body around the target, shorter.',
      'empowered.quake-ring', 'stun', { delivery: DB }),
    verb('stunning-strike', 3, 'long-night', 'Long Night',
      'The stun holds until the body is hit again, instead of a timer.',
      'control.knockdown', 'stun', { delivery: DB, note: 'Designer: watch for power.' }),
  ]],

  // ── Guards: immunity, control of the attacker, or a shared mend — never damage ─
  ['second-wind', [
    verb('second-wind', 1, 'shared-breath', 'Shared Breath',
      'The mend also runs on your summons and same-node party.',
      'kill-chain.recovery-pulse', 'recovery-window', { delivery: 'formation' }),
    verb('second-wind', 2, 'deep-breath', 'Deep Breath',
      'Nothing can hard-control you while the mend runs.',
      'bulwark.keystone', 'engagement-dr'),
    verb('second-wind', 3, 'clean-breath', 'Clean Breath',
      'The mend also strips one affliction.',
      'affliction.toxic-pulse', 'cleanse'),
  ]],
  ['cleanse', [
    verb('cleanse', 1, 'immunity', 'Immunity',
      'The affliction kind you stripped cannot be reapplied for a few seconds.',
      'barrier-tempo.ward-shell', 'cleanse'),
    verb('cleanse', 2, 'purge', 'Purge',
      'The stripped affliction is thrown back onto its applier.',
      'affliction.stinger-echo', 'cleanse'),
    verb('cleanse', 3, 'clarity', 'Clarity',
      'With nothing to strip, Cleanse raises a small ward instead of holding its cooldown.',
      'barrier-tempo.keystone', 'ward'),
  ]],
  ['brace', [
    verb('brace', 1, 'riposte', 'Riposte',
      'A melee hit absorbed while Braced staggers the attacker.',
      'control.knockdown', 'stun'),
    verb('brace', 2, 'set', 'Set',
      'Brace also roots you and doubles its footing.',
      'bulwark.keystone', 'plating-stack'),
    verb('brace', 3, 'shield-wall', 'Shield Wall',
      'Your summons and same-node party share the reduction.',
      'bulwark.plating-chip', 'engagement-dr', { delivery: 'formation' }),
  ]],
  ['sidestep', [
    verb('sidestep', 1, 'afterimage', 'Afterimage',
      'A hit you dodge during the window leaves an afterimage the attacker keeps swinging at until it is struck.',
      'engagement.sidestep-blur', 'evasion-window'),
    verb('sidestep', 2, 'flow', 'Flow',
      'Every hit dodged during the window extends it; the first that lands ends it.',
      'tempo.evasive-blur', 'evasion-window'),
    verb('sidestep', 3, 'grace', 'Grace',
      'Each dodge in the window also shakes off a slow or root on you.',
      'control.chill-blur', 'cleanse'),
  ]],
  ['bramble-guard', [
    verb('bramble-guard', 1, 'entangle', 'Entangle',
      'A body that hits you while brambled is slowed.',
      'control.frost-drag', 'slow'),
    verb('bramble-guard', 2, 'thicket', 'Thicket',
      'Thorns also hit every body adjacent to the attacker.',
      'control.mire-grasp', 'plating-stack'),
    verb('bramble-guard', 3, 'deep-roots', 'Deep Roots',
      'Bramble Guard holds as long as you stand still, and drops when you move.',
      'bulwark.plating-chip', 'plating-stack'),
  ]],
  ['endure', [
    verb('endure', 1, 'unyielding', 'Unyielding',
      'You cannot be hard-controlled while Endure is up.',
      'bulwark.keystone', 'engagement-dr'),
    verb('endure', 2, 'second-skin', 'Second Skin',
      'The shell persists at half while you keep taking hits.',
      'bulwark.plating-chip', 'ward'),
    verb('endure', 3, 'ironhide', 'Ironhide',
      'Nothing staggers or displaces you while Endure is up.',
      'bulwark.rampart-seal', 'engagement-dr'),
  ]],
  ['break-free', [
    verb('break-free', 1, 'backlash', 'Backlash',
      'Breaking free staggers every adjacent body.',
      'control.knockdown', 'stun'),
    verb('break-free', 2, 'slip', 'Slip',
      'You are untargetable for a moment after breaking free.',
      'engagement.sidestep-blur', 'evasion-window'),
    verb('break-free', 3, 'turn-the-tables', 'Turn the Tables',
      'The body that held you is rooted for as long as it held you.',
      'control.shackle', 'root'),
  ]],
  ['recuperate', [
    verb('recuperate', 1, 'overflow', 'Overflow',
      'Healing past full becomes a ward.',
      'barrier-tempo.ward-shell', 'ward'),
    verb('recuperate', 2, 'battle-rest', 'Battle Rest',
      'Recuperate mends at its full rate while you are hit.',
      'kill-chain.recovery-pulse', 'recovery-window'),
    verb('recuperate', 3, 'steady-hand', 'Steady Hand',
      'Your casts cannot be interrupted while it runs.',
      'bulwark.keystone', 'engagement-dr'),
  ]],
];

/** Keyed by ability id: the ability's three keystone verbs, in trio order. */
export const ABILITY_KEYSTONE_TRIOS: Map<string, Trio> = new Map<string, Trio>(trioEntries);

/** Keyed by keystone id: every authored verb, live or not. */
export const ABILITY_KEYSTONE_DEFINITIONS: Map<string, AbilityKeystoneDefinition> =
  new Map<string, AbilityKeystoneDefinition>(
    trioEntries.flatMap(([, trio]) => trio.map((def): [string, AbilityKeystoneDefinition] => [def.id, def])),
  );

/** One verb by id, or undefined. */
export function abilityKeystoneDefinition(keystoneId: string): AbilityKeystoneDefinition | undefined {
  return ABILITY_KEYSTONE_DEFINITIONS.get(keystoneId);
}

/** An ability's trio, or undefined (a §22.2 cut, or an id the table never had). */
export function abilityKeystoneTrio(abilityId: string): Trio | undefined {
  return ABILITY_KEYSTONE_TRIOS.get(abilityId);
}

// ─── Units ───────────────────────────────────────────────────────────────────

/**
 * The timings the first verbs' rules need that are not a payoff's magnitude
 * (design §18.4: no constants in a runtime module). Flat, like `LINEAGE_UNITS`:
 * a one-second spin is a one-second spin at every tier.
 *
 * The verbs also REUSE three lineage units rather than mint lookalikes:
 * `ladderStunMs` is Breakthrough's stagger ("the control ladder's shortest rung",
 * the `stun` payoff's own hold), and `contagionRadius` is how far "adjacent"
 * (Dragnet) and "nearest neighbour" (Outbreak) reach — "how far a lineage payoff
 * reaches to a neighbour" is one lever with one home.
 *
 * PROVISIONAL, the designer's to move:
 *  - `whirlwindMs`       §22.4's "a one-second spin";
 *  - `whirlwindTickMs`   the spin's "every tick": the channelled beam's own tick
 *                        (`BEAM_TICK_MS`, the cooldown root's Devout beam), whose
 *                        machinery the spin reuses — so a one-second spin cleaves
 *                        twice after the swing that started it;
 *  - `aftershockDelayMs` §22.4's "one second later".
 */
export interface AbilityKeystoneUnits {
  whirlwindMs: number;
  whirlwindTickMs: number;
  aftershockDelayMs: number;
}

export const ABILITY_KEYSTONE_UNITS: AbilityKeystoneUnits = {
  whirlwindMs: 1_000,
  whirlwindTickMs: 500,
  aftershockDelayMs: 1_000,
};

/** One authored keystone unit. The runtime reads these and never its own constant. */
export function abilityKeystoneUnit<K extends keyof AbilityKeystoneUnits>(key: K): AbilityKeystoneUnits[K] {
  return ABILITY_KEYSTONE_UNITS[key];
}
