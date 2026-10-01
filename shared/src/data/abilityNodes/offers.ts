/**
 * What each ability OFFERS on its packet row (design §19) — the one authored
 * table in this directory.
 *
 * A row is three (lane, payoff) pairs and a sentence saying why those three.
 * Everything else about a node — its name, its blurb, its fx, its amplifier
 * axis, its price, its unlock — is derived in `index.ts` and `resolve.ts`, which
 * is what makes this a *generic* tree keyed to packets rather than 22 bespoke
 * ability trees.
 *
 * THE TWO RULES THE TABLE OBEYS.
 *
 *  - **A Technique offers three of the six offensive packets**, fitted to what
 *    the ability already does, paying that packet's offensive payoff.
 *  - **A Guard offers the three defensive faces** — one `avoid`, one `sustain`,
 *    one `endure` — paying that face's defensive payoff, so defence never scales
 *    with offence. The avoid-face packets are Tempo, Engagement and Control; the
 *    sustain-face ones Kill chain, Barrier tempo and Affliction; the endure-face
 *    ones Bulwark and Empowered (`packetDefaultFace`). A Guard's three lanes are
 *    therefore drawn one from each of those groups, and `abilityNodes.test.ts`
 *    checks it.
 *
 * A payoff a node fires NEVER duplicates the ability's own job: Expose Weakness
 * already brands, so its Empowered option strips plating instead; Contagion
 * already spreads, so its Affliction option seeds a fresh stack. A node that
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
  // attrition across the bodies it touched, or in the momentum of cutting through.
  ['sweep', [
    ['tempo', 'echo-hit'],
    ['affliction', 'hemorrhage'],
    ['kill-chain', 'speed-window'],
  ]],

  // Power Strike is the committed single-target blow. A burst wants the brand it
  // leaves behind, the stagger that buys the next one, or the window it opens.
  ['power-strike', [
    ['empowered', 'vulnerability'],
    ['control', 'slow'],
    ['engagement', 'damage-window'],
  ]],

  // Expose Weakness IS the brand, so Empowered strips plating instead of branding
  // twice. The other two are the other ways to make a target softer.
  ['expose-weakness', [
    ['empowered', 'plating-shred'],
    ['affliction', 'hemorrhage'],
    ['engagement', 'damage-window'],
  ]],

  // Hamstring is the control ability, and gets design §19's own illustration:
  // Control, Tempo, Engagement.
  ['hamstring', [
    ['control', 'slow'],
    ['tempo', 'echo-hit'],
    ['engagement', 'damage-window'],
  ]],

  // Charge is a gap-closer: an opener first, a blow second. The rush is the
  // opening, the weight of it brands, and closing keeps you moving.
  ['charge', [
    ['engagement', 'damage-window'],
    ['empowered', 'vulnerability'],
    ['kill-chain', 'speed-window'],
  ]],

  // Contagion already spreads what the target carries, so its Affliction option
  // seeds a NEW stack rather than spreading harder. Chill what it touches, or
  // speed on to the next body.
  ['contagion', [
    ['affliction', 'poison-stack'],
    ['control', 'slow'],
    ['kill-chain', 'speed-window'],
  ]],

  // Slam is the heavy area blow: it cracks armour, it staggers, it opens wounds.
  ['slam', [
    ['empowered', 'plating-shred'],
    ['control', 'slow'],
    ['affliction', 'hemorrhage'],
  ]],

  // Binding Strike is pure setup. The node is what you do with a pinned target.
  ['binding-strike', [
    ['control', 'slow'],
    ['empowered', 'vulnerability'],
    ['engagement', 'damage-window'],
  ]],

  // Frenzy is a tempo window. It pays in extra swings, in more pace, or in a
  // damage window layered over the speed it already bought.
  ['frenzy', [
    ['tempo', 'echo-hit'],
    ['kill-chain', 'speed-window'],
    ['engagement', 'damage-window'],
  ]],

  // Quick Strike is the cheapest, most frequent rider in the roster, which makes
  // it the best carrier for the per-hit lanes.
  ['quick-strike', [
    ['tempo', 'echo-hit'],
    ['engagement', 'damage-window'],
    ['affliction', 'hemorrhage'],
  ]],

  // Detonate is design §19's "burst one": Empowered, Kill chain, Affliction. The
  // bleed re-opens the wound the detonation just spent.
  ['detonate', [
    ['affliction', 'hemorrhage'],
    ['empowered', 'vulnerability'],
    ['kill-chain', 'speed-window'],
  ]],

  // Disengage is a re-opening: breaking contact resets the fight's first beat,
  // buys tempo, or leaves something floundering behind you.
  ['disengage', [
    ['engagement', 'damage-window'],
    ['kill-chain', 'speed-window'],
    ['control', 'slow'],
  ]],

  // Snipe is one deliberate shot from outside reach: the brand, the opening, or
  // the leg it takes out.
  ['snipe', [
    ['empowered', 'vulnerability'],
    ['engagement', 'damage-window'],
    ['control', 'slow'],
  ]],

  // Stunning Strike is the roster's hardest control. Control deepens it; Empowered
  // and Tempo are the two ways to cash a target that is on the floor.
  ['stunning-strike', [
    ['control', 'slow'],
    ['empowered', 'plating-shred'],
    ['tempo', 'echo-hit'],
  ]],

  // Imbue Lightning is a charge window, so it carries the per-hit lanes: a second
  // strike, a seeded stack, or a brand on the body it discharges into.
  ['imbue-lightning', [
    ['tempo', 'echo-hit'],
    ['affliction', 'poison-stack'],
    ['empowered', 'vulnerability'],
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
  // the next application has further to go.
  ['cleanse', [
    ['engagement', 'engagement-dr'],
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
  // that a long hold is built to carry.
  ['endure', [
    ['engagement', 'engagement-dr'],
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
