/**
 * What each ability OFFERS on its packet row (design §19) — the one authored
 * table in this directory.
 *
 * A row is three (lane, payoff) pairs and a sentence saying why those three.
 * Everything else about a node — its name, its blurb, its fx, its amplifier
 * axis, its price, its unlock — is derived in `index.ts` and `resolve.ts`, which
 * is what makes this a *generic* tree keyed to packets rather than 19 bespoke
 * ability trees.
 *
 * THE TWO RULES THE TABLE OBEYS.
 *
 *  - **A Technique offers three of the offensive packets**, fitted to what the
 *    ability already does, paying that packet's offensive payoff. After the ability
 *    pass's second review (design §22.10) the Technique refund sits on Sweep,
 *    Slam, Stunning Strike, Detonate and Cull, each trading away its least
 *    characteristic route. On a Technique that node means "landing this ability
 *    refunds part of its own cooldown", which is why it fits the shapes whose
 *    whole cost IS the cooldown. A Kill chain offer on a Technique fires on the
 *    KILL its hit makes (§22.10): Charge, Contagion, Disengage and Snipe pay it as
 *    that cooldown refund, and Cull, which refunds natively, as a speed window.
 *  - **A Guard offers the three defensive faces** — one `avoid`, one `sustain`,
 *    one `endure` — paying that face's defensive payoff, so defence never scales
 *    with offence. The avoid-face packets are Tempo, Engagement and Control; the
 *    sustain-face ones Kill chain, Barrier tempo and Affliction; the endure-face
 *    ones Bulwark and Empowered (`packetDefaultFace`). A Guard's three lanes are
 *    therefore drawn one from each of those groups, and `abilityNodes.test.ts`
 *    checks it.
 *
 *    The avoid face pays `engagement-dr` or `evasion-window` (added 2026-10-01,
 *    design §6) — never `speed-window`, which the brief's own parenthetical
 *    suggested and `types.ts` explains why not. Here the Engagement lane's avoid
 *    offer pays `evasion-window` so avoid has a genuinely different effect from
 *    endure's plating stack, rather than differing only in lane, shard and fx;
 *    Tempo and Control keep `engagement-dr`.
 *
 * A payoff a node fires NEVER duplicates the ability's own job: Contagion
 * already spreads, so its Affliction option seeds a fresh stack; Cull already
 * refunds on a kill, so its Kill chain option opens a speed window instead. A node that
 * simply did the ability louder would be a number, and numbers are what the old
 * system had too many of.
 */
import type { PacketId, PayoffKind } from '../lineages/types';

/** A packet row's three offers, in render order. */
export type AbilityPacketOffers = readonly [
  readonly [PacketId, PayoffKind],
  readonly [PacketId, PayoffKind],
  readonly [PacketId, PayoffKind],
];

const offerEntries: [string, AbilityPacketOffers][] = [
  // ── Techniques: three of the six offensive packets ────────────────────────

  // Sweep is the breadth tool — the swarm answer. Breadth pays in volume, in
  // attrition across the bodies it touched, or in coming round again sooner: a
  // wide swing you can take twice as often is the Plains Swarm's own answer, which
  // is why the Swarm drops the Technique shard (design §22, §12.1).
  ['sweep', [
    ['tempo', 'echo-hit'],
    ['affliction', 'hemorrhage'],
    ['technique', 'technique-refund'],
  ]],

  // Charge is a gap-closer: an opener first, a blow second. The rush is the
  // opening, the weight of it brands, and a rush that kills is ready sooner for
  // the next body (Kill chain, on the kill: design §22.10).
  ['charge', [
    ['engagement', 'damage-window'],
    ['empowered', 'vulnerability'],
    ['kill-chain', 'technique-refund'],
  ]],

  // Contagion already spreads what the target carries, so its Affliction option
  // seeds a NEW stack rather than spreading harder. Chill what it touches, or —
  // when the hit that spreads it kills — have it back sooner (Kill chain, on the
  // kill: design §22.10).
  ['contagion', [
    ['affliction', 'poison-stack'],
    ['control', 'slow'],
    ['kill-chain', 'technique-refund'],
  ]],

  // Slam is the heavy area blow: it cracks armour, it staggers, or it comes back
  // round. The bleed went to make room — a blunt drop is the roster's least
  // characteristic way to open a wound, and Slam is the ability a Technique build
  // most wants off cooldown.
  ['slam', [
    ['empowered', 'plating-shred'],
    ['control', 'slow'],
    ['technique', 'technique-refund'],
  ]],

  // Binding Strike is pure setup. The node is what you do with a pinned target:
  // drag it further, brand it, or bleed it where it stands (design §22.10 swapped
  // the Technique refund for the bleed — a rooted body bleeds).
  ['binding-strike', [
    ['control', 'slow'],
    ['empowered', 'vulnerability'],
    ['affliction', 'hemorrhage'],
  ]],

  // Detonate spends everything the target was carrying, so its three routes are
  // what you get for spending it: the bleed re-opens the wound, the chill leaves
  // the emptied body dragging (design §22.10 swapped the brand for it), or the
  // detonation pays its own long cooldown back — the one ability in the roster
  // where a refund is the obvious want.
  ['detonate', [
    ['affliction', 'hemorrhage'],
    ['control', 'slow'],
    ['technique', 'technique-refund'],
  ]],

  // Disengage is a re-opening: breaking contact resets the fight's first beat,
  // leaves something floundering behind you, or — when the body you broke from
  // dies — is ready again sooner (Kill chain, on the kill: design §22.10).
  ['disengage', [
    ['engagement', 'damage-window'],
    ['kill-chain', 'technique-refund'],
    ['control', 'slow'],
  ]],

  // Snipe is one deliberate shot from outside reach: the brand, the opening, or
  // the second shot — a marksman's route is to be ready again when the shot
  // kills (design §22.10 moved the refund to Kill chain, on the kill).
  ['snipe', [
    ['empowered', 'vulnerability'],
    ['engagement', 'damage-window'],
    ['kill-chain', 'technique-refund'],
  ]],

  // Stunning Strike is the roster's hardest control. Control deepens it, Tempo
  // exploits it (a stunned target eats a second hit), and Technique is the
  // lock-down route: the shorter the cooldown, the less of the fight is spent
  // standing up.
  ['stunning-strike', [
    ['control', 'slow'],
    ['tempo', 'echo-hit'],
    ['technique', 'technique-refund'],
  ]],

  // Imbue Lightning is a charge window, so it carries the per-hit lanes: a second
  // strike, a seeded stack, or a brand on the body it discharges into.
  ['imbue-lightning', [
    ['tempo', 'echo-hit'],
    ['affliction', 'poison-stack'],
    ['empowered', 'vulnerability'],
  ]],

  // Cull is the kill-shaped Technique (design §22.8). It already refunds itself
  // on a kill, so its Kill chain route opens a speed window on the kill instead;
  // the brand softens the next body for it, and the Technique route pays part of
  // its cooldown back on a landing that does not kill.
  ['cull', [
    ['kill-chain', 'speed-window'],
    ['empowered', 'vulnerability'],
    ['technique', 'technique-refund'],
  ]],

  // ── Guards: the three defensive faces ─────────────────────────────────────

  // Second Wind is the sustain Guard, so Sustain deepens the mend it already is.
  // Avoid reads as the quickness the second breath buys; Endure as footing.
  ['second-wind', [
    ['tempo', 'engagement-dr'],
    ['kill-chain', 'recovery-window'],
    ['bulwark', 'plating-stack'],
  ]],

  // Cleanse strips what is eating you; the Sustain face leaves a shell behind so
  // the next application has further to go. Its Avoid face reads as the
  // nothing-landed-at-all version of "cost you less": a dodge window instead of
  // a softened hit.
  ['cleanse', [
    ['engagement', 'evasion-window'],
    ['barrier-tempo', 'ward'],
    ['bulwark', 'plating-stack'],
  ]],

  // Brace is the telegraphed-hit answer: braced footing, an absorb shell, or more
  // plating under the blow.
  ['brace', [
    ['control', 'engagement-dr'],
    ['barrier-tempo', 'ward'],
    ['bulwark', 'plating-stack'],
  ]],

  // Bramble Guard answers attrition by hurting what hits you, so its Sustain face
  // is Recovery rather than a shell.
  ['bramble-guard', [
    ['tempo', 'engagement-dr'],
    ['kill-chain', 'recovery-window'],
    ['bulwark', 'plating-stack'],
  ]],

  // Endure is the long hold. A long hold mends; it also wants the plating stack
  // that a long hold is built to carry. Its Avoid face is the dodge window a
  // held stance earns, not a repeat of the plating it already buys on Endure.
  ['endure', [
    ['engagement', 'evasion-window'],
    ['kill-chain', 'recovery-window'],
    ['bulwark', 'plating-stack'],
  ]],

  // Sidestep is the Avoid Guard (design §22.8): the dodge window deepens, a
  // dodge mends, or the plate it leaves catches the hit that lands after.
  ['sidestep', [
    ['engagement', 'evasion-window'],
    ['kill-chain', 'recovery-window'],
    ['bulwark', 'plating-stack'],
  ]],

  // Break Free answers control, so its Avoid face is the Control lane — the one
  // place a defensive Control card is the thematic answer to Control.
  ['break-free', [
    ['control', 'engagement-dr'],
    ['barrier-tempo', 'ward'],
    ['bulwark', 'plating-stack'],
  ]],

  // Recuperate is already the long mend, so its Sustain face is a ward: more of
  // the same would be a number, a shell is a second kind of buffer.
  ['recuperate', [
    ['tempo', 'engagement-dr'],
    ['barrier-tempo', 'ward'],
    ['bulwark', 'plating-stack'],
  ]],
];

export const ABILITY_PACKET_OFFERS: Map<string, AbilityPacketOffers> =
  new Map<string, AbilityPacketOffers>(offerEntries);

// ─── Fire-shapes (design §22.10, LOCKED 2026-10-02) ─────────────────────────
//
// WHERE AND WHEN an ability's packet payoff fires. Same payoffs, same
// magnitudes; this is where Brace and Endure stop being the same card. Kept in
// its own table keyed by ability id rather than as a fourth column of the offer
// tuples, so the offer rows above stay (lane, payoff) pairs and nothing that
// reads them changes shape.

/** The closed list of fire-shapes (design §22.10). Nothing else may appear. */
export type AbilityFireShape =
  | 'on land'
  | 'on every body hit'
  | 'on each hit of a window'
  | 'on the kill'
  | 'on cast'
  | 'per hit absorbed'
  | 'per hit dodged'
  | 'per tick while active'
  | 'on strip'
  | 'on the break';

/**
 * The existing trigger seams (design §22.10: "every entry maps to an existing
 * trigger seam"). A fire-shape with no seam would be a defect to report, never
 * a new primitive.
 */
export type AbilityFireSeam =
  | 'hit' | 'kill' | 'guard-cast' | 'hit-taken' | 'evade' | 'pulse' | 'cleanse' | 'break-free';

/** Which seam each fire-shape rides. */
export const ABILITY_FIRE_SHAPE_SEAM: Record<AbilityFireShape, AbilityFireSeam> = {
  'on land': 'hit',
  'on every body hit': 'hit',
  'on each hit of a window': 'hit',
  'on the kill': 'kill',
  'on cast': 'guard-cast',
  'per hit absorbed': 'hit-taken',
  'per hit dodged': 'evade',
  'per tick while active': 'pulse',
  'on strip': 'cleanse',
  'on the break': 'break-free',
};

/** One row of the fire-shape table: the closed-list value and the table's own words. */
export interface AbilityFireShapeRow {
  fire: AbilityFireShape;
  /** The §22.10 table's sentence for the ability, exactly as written. */
  reads: string;
}

const fireShapeEntries: [string, AbilityFireShapeRow][] = [
  ['sweep', { fire: 'on every body hit', reads: 'on every body the cleave hits' }],
  ['charge', { fire: 'on land', reads: 'on the first body the rush touches, and the target on arrival' }],
  ['slam', { fire: 'on every body hit', reads: 'on every body the Slam hits' }],
  ['second-wind', { fire: 'on cast', reads: 'on cast' }],
  // Fires when the strip removed anything, once per cast: design §22.13 dropped
  // "sized by what it removed" (every Guard payoff fires once per cast, §22.12).
  ['cleanse', { fire: 'on strip', reads: 'on strip' }],
  ['brace', { fire: 'per hit absorbed', reads: 'per hit absorbed while Braced' }],
  ['sidestep', { fire: 'per hit dodged', reads: 'per hit dodged during the window' }],
  ['binding-strike', { fire: 'on land', reads: 'on the rooted body' }],
  ['contagion', { fire: 'on every body hit', reads: 'on every body the spread reaches' }],
  ['snipe', { fire: 'on land', reads: 'on the shot body' }],
  // Thorns strike back when you are hit: the hit-taken seam, the closed list's
  // "per hit absorbed".
  ['bramble-guard', { fire: 'per hit absorbed', reads: 'per thorn hit' }],
  ['endure', { fire: 'per tick while active', reads: 'per tick while held' }],
  ['imbue-lightning', { fire: 'on each hit of a window', reads: 'on each imbued hit' }],
  ['detonate', { fire: 'on land', reads: 'on the detonated body' }],
  ['cull', { fire: 'on land', reads: 'on the struck body' }],
  ['break-free', { fire: 'on the break', reads: 'on the break' }],
  ['disengage', { fire: 'on land', reads: 'on the body you broke from' }],
  ['stunning-strike', { fire: 'on land', reads: 'on the stunned body' }],
  ['recuperate', { fire: 'per tick while active', reads: 'per tick of the mend' }],
];

export const ABILITY_FIRE_SHAPES: Map<string, AbilityFireShapeRow> =
  new Map<string, AbilityFireShapeRow>(fireShapeEntries);

/**
 * The Kill chain offers tagged with the `kill` trigger (design §22.10: "Kill chain
 * routes fire on the kill"): a Kill chain offer on a TECHNIQUE fires when the
 * ability's hit kills, not when it lands. Charge, Contagion, Disengage and Snipe
 * pay it as a partial cooldown refund; Cull, which refunds natively, as a speed
 * window. The Guards' Kill chain offers (a Recovery window on Second Wind,
 * Bramble Guard, Endure, Sidestep) keep their Guard's own fire-shape: a Guard
 * cast kills nothing.
 *
 * The data record only: the runtime that fires a Technique's Kill chain offer on
 * the kill keys on (Technique, lane `kill-chain`) generically.
 */
export const ABILITY_KILL_TRIGGER_OFFERS: ReadonlySet<string> = new Set<string>([
  'charge', 'contagion', 'disengage', 'snipe', 'cull',
]);

/**
 * The fire-shape of one offer: the Kill chain override for a tagged ability's
 * Kill chain offer, otherwise the ability's own row. Undefined for an ability
 * with no row (the table test refuses that).
 */
export function abilityOfferFireShape(abilityId: string, lane: PacketId): AbilityFireShape | undefined {
  if (lane === 'kill-chain' && ABILITY_KILL_TRIGGER_OFFERS.has(abilityId)) return 'on the kill';
  return ABILITY_FIRE_SHAPES.get(abilityId)?.fire;
}
