/**
 * Item lineage trees — the closed vocabulary (progression rework Phase 1a).
 *
 * Design authority: `design_docs/progression-rework-design.md` §2–§8.
 * Plan: `docs/progression-rework-plan.md` §1.1.
 *
 * Two axioms shape every type here:
 *
 *  1. **Closed vocabulary.** A card is data over a fixed set of trigger kinds and
 *     payoff kinds. A card that needs bespoke code is a design bug, so the unions
 *     below are the whole surface the card runtime (Phase 1b) has to implement.
 *  2. **One magnitude table per tier.** An authored {@link LineageCard} carries NO
 *     numbers at all — not a magnitude, not a duration, not a cost, not an unlock
 *     level. Every number is derived from `magnitudes.ts` by `resolveLineageCard`.
 *     This is structural, not a convention: there is nowhere in the authored type
 *     to put a literal. `coverage.test.ts` also scans the card sources, so the rule
 *     survives someone widening the type.
 */
import type { EquipmentSlot, EssenceType, ItemStats } from '../../items';
import type { StatEffects } from '../skillTree/types';

// ─── Packets (lanes) ─────────────────────────────────────────────────────────

/**
 * A packet is a stat the player scales, a trigger that fires, and a payoff
 * (design §3). A lineage carries three of them as its three lanes; a packet
 * "completes" when a weapon lane and a non-weapon lane name the same one.
 */
export type PacketId =
  | 'tempo'
  | 'empowered'
  | 'affliction'
  | 'control'
  | 'kill-chain'
  | 'engagement'
  | 'bulwark'
  | 'barrier-tempo'
  // The ninth packet (design §22, run 4). It wants Technique cooldown reduction
  // and Technique power — the stats the Plains Broadsword and the Desert
  // staff/cross line already lean on — fires on `technique-cast`, and pays with
  // a cooldown refund or a window that empowers the next Technique.
  | 'technique';

export const PACKET_IDS: readonly PacketId[] = [
  'tempo', 'empowered', 'affliction', 'control',
  'kill-chain', 'engagement', 'bulwark', 'barrier-tempo',
  'technique',
] as const;

/**
 * The packets weapons draw from (design §3, §22). The two defensive-only ones
 * (`bulwark`, `barrier-tempo`) are excluded; `technique` joined in run 4, which
 * is why the list is seven rather than design §3's original six.
 */
export const WEAPON_PACKET_IDS: readonly PacketId[] = [
  'tempo', 'empowered', 'affliction', 'control', 'kill-chain', 'engagement',
  'technique',
] as const;

/**
 * The defensive face a frame expresses (design §3.1). Defensive cards pay out in
 * full on the matching frame and at `OFF_FACE_SCALAR` off it — a bias, never a
 * lock, so no encounter hard-counters a frame.
 */
export type DefensiveFace = 'avoid' | 'sustain' | 'endure';

// ─── Rows ────────────────────────────────────────────────────────────────────

/**
 * One row per tier, each asking a different question (design §4). The band never
 * gets wider: T1 is stat/payoff, T2 adds amplifier, T3 keystone, T4 cross.
 * The gate is not a row — it is the form purchase at the bottom of the band.
 */
export type RowKind = 'stat' | 'payoff' | 'amplifier' | 'keystone' | 'cross';

export const ROW_KINDS: readonly RowKind[] = ['stat', 'payoff', 'amplifier', 'keystone', 'cross'] as const;

// ─── Trigger and payoff vocabulary (design §6) ───────────────────────────────

/**
 * When a card fires. Every kind but `mechanic-fired` already has a server seam;
 * `mechanic-fired` is the one new combat primitive Phase 1b adds (a class-agnostic
 * "your mechanic fired" event covering finisher, execution, max stacks, reload,
 * energy burst, and a summon command).
 */
export type TriggerKind =
  | 'hit-nth'
  | 'mechanic-fired'
  | 'first-hit'
  | 'kill'
  | 'evade'
  | 'hit-taken'
  | 'guard-cast'
  | 'standing'
  | 'pulse'
  | 'barrier-break'
  /**
   * A Technique resolved — the Technique packet's own moment (design §22, run
   * 4). Fired from the one Technique resolution seam
   * (`server/src/systems/combat/techniqueResolved.ts`), once per cast that
   * lands or resolves, and NEVER from a Guard: a Guard has `guard-cast`, and
   * defence must not fire an offensive lane.
   */
  | 'technique-cast';

export const TRIGGER_KINDS: readonly TriggerKind[] = [
  'hit-nth', 'mechanic-fired', 'first-hit', 'kill', 'evade',
  'hit-taken', 'guard-cast', 'standing', 'pulse', 'barrier-break',
  'technique-cast',
] as const;

/**
 * What a card does. Each maps onto an existing server hook (cadence aftershock /
 * hemorrhage / rampage, cooldown rupture / overdrive, dot conflagration / chill,
 * defense hit-plating / engagement-dr / overheal-ward, the control ladder, the
 * affliction toolkit). If a card cannot be expressed here, the card changes.
 */
export type PayoffKind =
  | 'vulnerability'
  | 'plating-shred'
  | 'echo-hit'
  | 'hemorrhage'
  | 'poison-stack'
  | 'slow'
  | 'stun'
  | 'damage-window'
  | 'speed-window'
  | 'recovery-window'
  | 'ward'
  | 'cleanse'
  | 'plating-stack'
  | 'engagement-dr'
  | 'contagion'
  /**
   * The Technique packet's two payoffs (design §22, run 4).
   *
   *  - `technique-refund` takes the magnitude share off the REMAINING cooldown
   *    of each of the player's Techniques, so the lane pays in readiness rather
   *    than in damage. On an ability node (design §19) that reads as "landing
   *    this ability refunds part of its own cooldown", because the cooldown that
   *    is running when the node fires is the ability's own.
   *  - `technique-window` opens a window in which the next Technique lands
   *    empowered, folded into `ctx.metadata.empoweredMultiplier` exactly as
   *    `damage-window` is — one multiplier per hit (design §6), never a second
   *    multiplicative layer.
   */
  | 'technique-refund'
  | 'technique-window'
  | 'evasion-window';

export const PAYOFF_KINDS: readonly PayoffKind[] = [
  'vulnerability', 'plating-shred', 'echo-hit', 'hemorrhage', 'poison-stack',
  'slow', 'stun', 'damage-window', 'speed-window', 'recovery-window',
  'ward', 'cleanse', 'plating-stack', 'engagement-dr', 'contagion',
  'technique-refund', 'technique-window',
  'evasion-window',
] as const;

/**
 * The payoffs that land ON A MONSTER rather than on the player.
 *
 * Shared rather than server-local because two rules key off it: the runtime's
 * "every on-target applier early-returns on a blocking evade", and the authoring
 * check that only an on-target payoff can be amplified along the `targets` axis —
 * a second body is meaningless for a window that opens on yourself.
 */
export const ON_TARGET_PAYOFF_KINDS: ReadonlySet<PayoffKind> = new Set<PayoffKind>([
  'vulnerability', 'plating-shred', 'echo-hit', 'hemorrhage', 'poison-stack',
  'slow', 'stun', 'contagion',
]);

/** Whether this payoff lands on a monster. See {@link ON_TARGET_PAYOFF_KINDS}. */
export function payoffLandsOnTarget(kind: PayoffKind): boolean {
  return ON_TARGET_PAYOFF_KINDS.has(kind);
}

// ─── What an amplifier row moves (design §4) ─────────────────────────────────

/**
 * The axis of the modified payoff an `amplifier` card moves — the mechanical form
 * of design §4's own sentence, "modifies the owned payoff: duration, second
 * target, extra trigger".
 *
 * An amplifier does NOT fire a payoff of its own. It names a payoff card of its
 * lane and tier in `modifies` and one axis here, and `composeAmplifiers` adjusts
 * THAT card's resolved numbers before the runtime ever sees them. This is what
 * keeps "one multiplier per hit" (design §6) true of an amplified build: the
 * payoff's own magnitude moves rather than a second layer landing on top of it.
 *
 *  - `duration`  the window / debuff holds longer.
 *  - `magnitude` the payoff itself is bigger.
 *  - `targets`   it also lands on a second body (on-target payoffs only).
 *  - `trigger`   the SAME payoff also fires on this card's trigger, so the player
 *                procs it from two moments instead of one. The one axis that does
 *                produce a firing — of the modified payoff, never of its own.
 *
 * Closed, like every other vocabulary here: a card that wants a fifth axis is a
 * design decision, not an authoring one.
 */
export type AmplifiedAxis = 'duration' | 'magnitude' | 'targets' | 'trigger';

export const AMPLIFIED_AXES: readonly AmplifiedAxis[] = [
  'duration', 'magnitude', 'targets', 'trigger',
] as const;

// ─── Stats a stat row can scale ──────────────────────────────────────────────

/**
 * The stat a lane scales on its stat row. Drawn from the two existing stat
 * vocabularies: `ItemStats` (flat item numbers) and skill-tree `StatEffects`
 * (the `*Pct` affinity family, summed then applied once).
 */
export type LineageStatKey =
  | 'attack' | 'onHitDamage' | 'plating' | 'damageReduction' | 'evasion'
  | 'maxHp' | 'recovery' | 'speed'
  | 'attackPct' | 'attackSpeedPct'
  /**
   * Technique power (design §22). NOT an `ItemStats` field and not a skill-tree
   * `StatEffects` one: it is the existing `technique.power-pct` PASSIVE, the one
   * `techniquePowerPctFor` already reads and `abilities.ts` already applies to
   * `ability.slot === 'technique'`. The Technique lane scales that rather than
   * inventing a parallel stat, so a lineage stat row and a Desert recipe's
   * `technique.power-pct` are the same number to the ability code.
   */
  | 'techniquePowerPct';

/**
 * What a resolved stat row contributes. Folds into passives at recalc through the
 * same seam `itemMechanicEffectsAt` uses (Phase 1b), so the `*Pct` members keep
 * their sum-additively-then-apply-once semantics.
 *
 * `techniquePowerPct` is declared here rather than borrowed from `StatEffects`
 * because it is a passive key, not a skill-tree stat — widening `StatEffects`
 * would hand every skill node a stat the tree has no authored home for.
 */
export type LineageStatEffects =
  Partial<Pick<ItemStats, 'attack' | 'onHitDamage' | 'plating' | 'damageReduction' | 'evasion' | 'maxHp' | 'recovery' | 'speed'>>
  & Partial<Pick<StatEffects, 'attackPct' | 'attackSpeedPct'>>
  & { techniquePowerPct?: number };

// ─── Visual signatures (design §8) ───────────────────────────────────────────

/**
 * Every card the player buys adds one thing they can see in combat. The key is
 * the contract between the card and the Phaser effect map (Phase 1c): the server
 * pushes `card-fx { fx }` and the client draws it. A card with no signature is a
 * stat, and stats are what the old system had too many of.
 *
 * Keys are `<lane>.<signature>` so the lane grammar (§8: Tempo = afterimages,
 * Empowered = glow and crash, Affliction = pips and arcs) reads off the key.
 */
export type LineageFxKey =
  // Stat rows — weapon trail colour / intensity in the lane colour.
  | 'tempo.trail' | 'empowered.trail' | 'affliction.trail'
  | 'control.trail' | 'kill-chain.trail' | 'engagement.trail'
  | 'technique.trail'
  // Technique (design §22): the cast flare its payoff rows and its Desert
  // capstones draw — the lane's grammar is the flourish of the form itself.
  | 'technique.cast-flare'
  // Payoff rows — a new on-screen event.
  | 'tempo.ghost-strike'
  | 'empowered.plating-crack' | 'empowered.weak-point'
  | 'affliction.bleed-pips' | 'affliction.venom-pips'
  | 'control.frost-drag'
  | 'kill-chain.kill-pulse' | 'kill-chain.spread-arc'
  | 'engagement.opening-flash' | 'engagement.brace-sparks'
  // Capstones — the form's lasting verb.
  | 'tempo.gale-wake' | 'tempo.ruin-afterimage'
  | 'affliction.stinger-echo'
  | 'empowered.quake-ring'
  | 'control.mire-grasp'
  | 'kill-chain.steel-vigil'
  // Defensive signatures (Phase 4, armor/recovery/mobility): one per packet,
  // grammar from design §8's face list — Avoid = blur/sidestep, Sustain =
  // pulses and ward shells, Endure = plating chips and a stance pose. Reused
  // by both a lane's T1 payoff card and the capstone that crowns it, so the
  // client switch stays small (design §8's "lasting aura" is the same
  // signature drawn bigger, not a second effect).
  | 'tempo.evasive-blur' | 'engagement.sidestep-blur' | 'control.chill-blur'
  | 'kill-chain.recovery-pulse' | 'barrier-tempo.ward-shell' | 'affliction.toxic-pulse'
  | 'bulwark.plating-chip' | 'empowered.guard-spark'
  // Keystones — ONE per packet (design §4 as amended 2026-10-01), shared by every
  // lineage that carries the lane in any slot. The key is per LANE rather than per
  // lineage for the same reason the rule is: two lineages crowning Tempo play the
  // same Chain, so they draw the same thing — the lane's own grammar, one size
  // larger than its payoff row, because a keystone is the moment the character
  // starts playing differently.
  | 'tempo.keystone' | 'empowered.keystone' | 'affliction.keystone'
  | 'control.keystone' | 'kill-chain.keystone' | 'engagement.keystone'
  | 'bulwark.keystone' | 'barrier-tempo.keystone' | 'technique.keystone'
  // Defensive CAPSTONE signatures (gap closed 2026-10-01): the packet-keyed
  // defensive signature above is shared by every lineage that carries the
  // lane, so two lineages crowning the same lane (e.g. the Robe's and the
  // Plate's bulwark capstone) were visually identical. One lineage per lane
  // keeps the original shared key (the lane's "default" flavour); every other
  // lineage crowning that lane gets its own key here, reused across that
  // lineage's own doors into the band (same convention as the weapon
  // lineages' `tempo.gale-wake` / `tempo.ruin-afterimage` already follow).
  | 'bulwark.rampart-seal' | 'bulwark.hide-ward' | 'bulwark.frostline-plate'
  | 'bulwark.resonant-plate' | 'bulwark.ballast-plate'
  | 'control.deep-shock' | 'control.icebreaker' | 'control.wetland-anchor'
  | 'engagement.oasis-guard' | 'engagement.windstep' | 'engagement.mountain-stride'
  | 'engagement.cavern-sprint'
  | 'affliction.spore-veil' | 'affliction.bog-eye'
  | 'kill-chain.wind-chaser' | 'kill-chain.ember-spark'
  | 'barrier-tempo.bulwark-heart';

export const LINEAGE_FX_KEYS: readonly LineageFxKey[] = [
  'tempo.trail', 'empowered.trail', 'affliction.trail',
  'control.trail', 'kill-chain.trail', 'engagement.trail',
  'technique.trail', 'technique.cast-flare',
  'tempo.ghost-strike',
  'empowered.plating-crack', 'empowered.weak-point',
  'affliction.bleed-pips', 'affliction.venom-pips',
  'control.frost-drag',
  'kill-chain.kill-pulse', 'kill-chain.spread-arc',
  'engagement.opening-flash', 'engagement.brace-sparks',
  'tempo.gale-wake', 'tempo.ruin-afterimage',
  'affliction.stinger-echo',
  'empowered.quake-ring',
  'control.mire-grasp',
  'kill-chain.steel-vigil',
  'tempo.evasive-blur', 'engagement.sidestep-blur', 'control.chill-blur',
  'kill-chain.recovery-pulse', 'barrier-tempo.ward-shell', 'affliction.toxic-pulse',
  'bulwark.plating-chip', 'empowered.guard-spark',
  'tempo.keystone', 'empowered.keystone', 'affliction.keystone',
  'control.keystone', 'kill-chain.keystone', 'engagement.keystone',
  'bulwark.keystone', 'barrier-tempo.keystone', 'technique.keystone',
  'bulwark.rampart-seal', 'bulwark.hide-ward', 'bulwark.frostline-plate',
  'bulwark.resonant-plate', 'bulwark.ballast-plate',
  'control.deep-shock', 'control.icebreaker', 'control.wetland-anchor',
  'engagement.oasis-guard', 'engagement.windstep', 'engagement.mountain-stride',
  'engagement.cavern-sprint',
  'affliction.spore-veil', 'affliction.bog-eye',
  'kill-chain.wind-chaser', 'kill-chain.ember-spark',
  'barrier-tempo.bulwark-heart',
] as const;

/** The keystone fx key of a lane. One per packet (design §4). */
export function keystoneFxKey(lane: PacketId): LineageFxKey {
  return `${lane}.keystone` as LineageFxKey;
}

// ─── Authored shapes (NO numbers — see the header) ───────────────────────────

/**
 * One card in a lineage's tree. Authored shape only: the lane, the row, what it
 * fires on and what it does. Every number comes from `magnitudes.ts` via
 * `resolveLineageCard`.
 */
export interface LineageCard {
  id: string;
  lineageId: string;
  /** Which band this card sits in. Its unlock level and costs derive from this. */
  tier: number;
  row: RowKind;
  lane: PacketId;
  name: string;
  /** Player-facing text WITHOUT magnitudes — the UI appends resolved numbers. */
  description: string;
  fx: LineageFxKey;
  /** `stat` rows only: the stat this lane scales. */
  statKey?: LineageStatKey;
  /** Every row but `stat`: when it fires. */
  trigger?: TriggerKind;
  /** Every row but `stat`: what it does. */
  payoff?: PayoffKind;
  /**
   * `amplifier` / `keystone` / `cross` rows: the card in this lineage they modify.
   * Owning the modified card is a prerequisite (see `checkUnlockCard`).
   */
  modifies?: string;
  /**
   * `amplifier` rows only, and REQUIRED on them: which axis of the modified
   * payoff this card moves (design §4). An amplifier does not fire a payoff of
   * its own — see {@link AmplifiedAxis} and `composeAmplifiers`.
   */
  amplifies?: AmplifiedAxis;
  /** `cross` rows only: the lane borrowed from, paid at the cross row scalar. */
  borrowsLane?: PacketId;
  /**
   * Defensive cards only (armor / charm / boots, Phase 4): the face this card
   * belongs to. Off-face it pays `OFF_FACE_SCALAR`. Absent = offensive, which is
   * frame-neutral.
   */
  face?: DefensiveFace;
}

/**
 * The verb a form adds (design §5). A capstone is a card without a row, an unlock
 * level, or a cost: it is granted by wearing the form and is never bought
 * separately. Capstones add a verb, never a number — the magnitude they do carry
 * comes from the same table as every other payoff.
 */
export interface LineageCapstone {
  id: string;
  name: string;
  description: string;
  fx: LineageFxKey;
  /** The lane this capstone crowns. Coverage requires every lane to be crowned. */
  lane: PacketId;
  trigger: TriggerKind;
  payoff: PayoffKind;
}

/**
 * A form is what the slot actually wears: name, art, and base stats come from
 * `recipeId`, an ordinary recipe in `RECIPE_DATABASE`. Forms of the same lineage
 * at the same tier share the band and differ only in base stats, art, and capstone.
 *
 * Tier-1 forms are crafted from the Make tab as today (no gate, no capstone).
 * Tier ≥ 2 forms are bought at the previous band's gate for essence plus the boss
 * capstone material of `biome` — which is why the boss is the only way up.
 */
export interface LineageForm {
  /** Existing recipe id. The form graph is still `Recipe.lineageId`/`evolvesFrom`. */
  recipeId: string;
  /** The tier of the form itself; it opens the band of the same tier. */
  tier: number;
  /** The biome whose boss capstone opens this door (tier ≥ 2), or crafts it (tier 1). */
  biome: string;
  /** Tier ≥ 2 only. A tier-1 base form crowns nothing. */
  capstone?: LineageCapstone;
}

/** The slot holds the lineage, not an item (design §2). */
export interface LineageDefinition {
  id: string;
  slot: EquipmentSlot;
  /** The T1 biome this lineage debuts in; sets the essence its cards are paid in. */
  homeBiome: string;
  /** The three packets this lineage carries, in matrix order (design §3.2). */
  lanes: readonly [PacketId, PacketId, PacketId];
  forms: readonly LineageForm[];
  cards: readonly LineageCard[];
}

// ─── Resolved shapes (numbers, from the magnitude table) ─────────────────────

export interface LineageTrigger {
  kind: TriggerKind;
  /** `hit-nth` only: fires on every nth hit. 1 = every hit. */
  n?: number;
}

export interface LineagePayoff {
  kind: PayoffKind;
  /** Meaning is per payoff kind — see `PAYOFF_UNIT` in `magnitudes.ts`. */
  magnitude: number;
  durationMs?: number;
  /**
   * Extra bodies an on-target payoff also lands on, from an active amplifier on
   * the `targets` axis. Absent on an unamplified payoff; never authored.
   */
  extraTargets?: number;
}

export interface LineageCost {
  essence: Partial<Record<EssenceType, number>>;
  shards: Partial<Record<PacketId, number>>;
}

/** A gate also spends the biome boss's capstone material. */
export interface LineageGateCost extends LineageCost {
  capstone: { biome: string; amount: number };
}

/** A card with its numbers filled in. This is what the runtime and the UI read. */
export interface ResolvedLineageCard {
  card: LineageCard;
  /**
   * The biome the band gates on: the DOOR biome of the form worn at this card's
   * tier (design §21), not the lineage's home biome. Carried on the resolved card
   * so the purchase check, the lock message and the UI all name the same biome the
   * level was computed in, and so switching to a form from another biome
   * re-resolves the pair together.
   */
  requiredBiomeGroup: string;
  /** Level in {@link requiredBiomeGroup}'s own numbering (not level-within-the-tier). */
  requiredBiomeLevel: number;
  /** Global Mastery required, from the same per-tier band the +1..+5 ladder used. */
  requiredGlobalMastery: number;
  cost: LineageCost;
  statEffects?: LineageStatEffects;
  trigger?: LineageTrigger;
  payoff?: LineagePayoff;
  /**
   * Further moments this card's payoff also fires on, from an active amplifier on
   * the `trigger` axis. The runtime treats each exactly like `trigger` — the SAME
   * payoff, the same fx — so the player procs one effect from two moments rather
   * than owning two effects. Absent on an unamplified card; never authored.
   */
  extraTriggers?: LineageTrigger[];
  /**
   * Set by a `trigger`-axis amplifier that names the SAME trigger its target
   * already fires on. That is not a second moment — it re-scopes the one it has,
   * from once per engagement to once per BODY, which is what "the opening hit
   * fires again on each new target" means.
   *
   * Only meaningful for `first-hit`, the one trigger that latches per engagement
   * rather than per hit, kill or clock tick; `coverage.test.ts` refuses the
   * same-trigger form on any other kind, where it would be inert. Never authored.
   */
  perTargetTrigger?: boolean;
}

/** A worn form's capstone with its numbers filled in. Granted, never bought. */
export interface ResolvedLineageCapstone {
  capstone: LineageCapstone;
  form: LineageForm;
  trigger: LineageTrigger;
  payoff: LineagePayoff;
}

// ─── Player state ────────────────────────────────────────────────────────────

/**
 * Per-lineage player progress, stored on `HoldsInventory.lineages` (persisted,
 * component-shaped). "Owned is forever, active is a choice": paying for a card or
 * a form is permanent; swapping which owned card is active, or which owned form is
 * worn, is free and instant.
 */
export interface LineageProgress {
  /** Card ids bought. Permanent. */
  ownedCards: string[];
  /** One active card per row (design §4: a row is a choice, not a shopping list). */
  active: Partial<Record<RowKind, string>>;
  /** Recipe ids of forms bought. Permanent. */
  ownedForms: string[];
  /** Recipe id of the worn form. `equipment[slot]` mirrors it. */
  wornForm: string;
}

/** Keyed by lineage id. */
export type LineageProgressMap = Record<string, LineageProgress>;
