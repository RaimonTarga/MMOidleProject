/**
 * The weapon page as data (design §24.6; the approved "weapon page" mockup).
 *
 * Everything the page decides that is not React lives here, so it is testable
 * without a DOM (`server/test/weaponPage.test.ts`): which bands and rows show and
 * in what order, what each card says and what pressing it does, which cost chips
 * are short, the requirement a card names, the gate's one sentence, the lean
 * preview, and the stat sheet's before → after.
 *
 * The client decides nothing about gameplay. Every enabled/disabled state comes
 * from a SHARED check (`checkUnlockCard`, `checkSetActive`, `checkUnlockForm`,
 * `checkWearForm`) — the functions the server applies — and every number on the
 * stat sheet comes from `previewEquipmentStats`, the server's own stat formula run
 * on a detached copy. A preview is display only: nothing is sent.
 */
import {
  BIOME_DATABASE,
  CAPSTONE_MATERIALS,
  DUNGEON_DEFS,
  ESSENCE_LABELS,
  ESSENCE_TYPES,
  ITEM_DATABASE,
  MONSTER_DATABASE,
  NODE_BIOMES,
  PACKET_IDS,
  ROW_LABELS,
  ROW_SCALAR,
  absorbedStatCards,
  applyAmplifiedAxis,
  bandContents,
  cardSentence,
  checkSetActive,
  checkUnlockCard,
  checkUnlockForm,
  checkWearForm,
  composeVerb,
  isVerbCard,
  keystoneDefinition,
  leanLaneFor,
  lineageBandBiome,
  lineageCardPrice,
  lineageEssenceType,
  lineageGateCost,
  nodeFamily,
  nodesPayingShard,
  packetDefinition,
  packetHalves,
  previewEquipmentStats,
  resolveDotClassProfile,
  resolveLineageCardFor,
  rowsForTier,
  shardName,
  statRowIsCollapsed,
  wornFormTier,
  type CombatArchetype,
  type EquipmentPreviewInput,
  type EssenceType,
  type LineageCard,
  type LineageCost,
  type LineageDefinition,
  type LineageForm,
  type LineagePayoff,
  type LineageProgress,
  type LineageProgressMap,
  type LineageTrigger,
  type LineageWallet,
  type PacketId,
  type PayoffKind,
  type ResolvedLineageCard,
  type RowKind,
  type SubVariant,
  type TriggerKind,
} from '@mmo-idle/shared';

// ─── Small formatting ────────────────────────────────────────────────────────

const FALLBACK_LANE_COLOR = '#a99e8a';

function trimmed(value: number, places = 1): string {
  const f = 10 ** places;
  return String(Math.round(value * f) / f);
}

function pct(fraction: number): string {
  return `${trimmed(fraction * 100)}%`;
}

function seconds(ms: number): string {
  return `${trimmed(ms / 1000)} s`;
}

function ordinal(n: number): string {
  const whole = Math.round(n);
  const mod100 = whole % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${whole}th`;
  switch (whole % 10) {
    case 1: return `${whole}st`;
    case 2: return `${whole}nd`;
    case 3: return `${whole}rd`;
    default: return `${whole}th`;
  }
}

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/** A count that opens a sentence: "Three", or digits past ten. */
function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

export function biomeDisplayName(group: string): string {
  return BIOME_DATABASE.get(group)?.name ?? group.charAt(0).toUpperCase() + group.slice(1);
}

export function laneColor(lane: PacketId): string {
  return packetDefinition(lane)?.color ?? FALLBACK_LANE_COLOR;
}

/** "Gale Shard" → "Gale": the cost chip's short word (the mockup's "4 Gale"). */
export function shardWord(lane: PacketId): string {
  return shardName(lane).replace(/ Shard$/, '');
}

// ─── Rows: the question each one asks ────────────────────────────────────────

/** The question on the right of a row header (mockup: "One active."). */
export const ROW_QUESTIONS: Readonly<Record<RowKind, string>> = {
  stat: 'Which way does the weapon lean? One active.',
  payoff: 'What does the weapon do? One active.',
  amplifier: 'How does it fire? One active.',
  keystone: 'What does it become? One active.',
  cross: 'What does it borrow? One active.',
};

export function rowTitle(tier: number, row: RowKind): string {
  return `Tier ${tier} · ${ROW_LABELS[row]}`;
}

/** What a locked row's header says instead of its question. */
export function lockedRowQuestion(tier: number): string {
  return `Opens with a Tier ${tier} form. Pay the gate below.`;
}

// ─── One sentence per card (design §24.6, rule 5) ────────────────────────────

/** A trigger as the subject of a sentence: "Every 3rd hit", "A kill". */
function triggerSubject(trigger: LineageTrigger | undefined, perTarget: boolean): string {
  const kind: TriggerKind | undefined = trigger?.kind;
  switch (kind) {
    case 'hit-nth': {
      const n = trigger?.n ?? 1;
      return n <= 1 ? 'Every hit' : `Every ${ordinal(n)} hit`;
    }
    case 'mechanic-fired': return 'Your class mechanic';
    case 'first-hit': return perTarget ? 'Your first hit on each new target' : 'Your first hit in a fight';
    case 'kill': return 'A kill';
    case 'evade': return 'A dodge';
    case 'hit-taken': return 'Taking a hit';
    case 'guard-cast': return 'A Guard';
    case 'standing': return 'Standing still';
    case 'pulse': return 'Every pulse';
    case 'barrier-break': return 'A broken barrier';
    case 'technique-cast': return 'A landed Technique';
    case 'hit-afflicted': return 'A hit on an afflicted target';
    case 'hit-held': return 'A hit on a held target';
    default: return 'It';
  }
}

/** A trigger as the object of "also fires …": "on a kill". */
function triggerObject(trigger: LineageTrigger | undefined): string {
  const subject = triggerSubject(trigger, false);
  return `on ${subject.charAt(0).toLowerCase()}${subject.slice(1)}`;
}

const timed = (payoff: LineagePayoff): string =>
  payoff.durationMs ? ` for ${seconds(payoff.durationMs)}` : '';

/**
 * What a payoff does, as a predicate, with the RESOLVED numbers — the ones the
 * runtime applies. Every kind is listed, so a new kind fails to compile here
 * rather than rendering as nothing.
 */
const PAYOFF_PREDICATE: Readonly<Record<PayoffKind, (p: LineagePayoff) => string>> = {
  'echo-hit': (p) => (Math.abs(p.magnitude - 1) < 1e-6 ? 'lands twice' : `lands again at ${pct(p.magnitude)} strength`),
  'vulnerability': (p) => `makes the target take ${pct(p.magnitude)} more damage${timed(p)}`,
  'plating-shred': (p) => `strips ${pct(p.magnitude)} of the target's plating${timed(p)}`,
  'hemorrhage': (p) => `bleeds ${pct(p.magnitude)} of the hit${p.durationMs ? ` over ${seconds(p.durationMs)}` : ''}`,
  'poison-stack': (p) => `poisons for ${pct(p.magnitude)} of the hit${p.durationMs ? ` over ${seconds(p.durationMs)}` : ''}`,
  'slow': (p) => `slows the target by ${pct(p.magnitude)}${timed(p)}`,
  'stun': (p) => `stuns the target${timed(p)}`,
  'damage-window': (p) => `opens a +${pct(p.magnitude)} damage window${timed(p)}`,
  'speed-window': (p) => `opens a +${pct(p.magnitude)} attack-speed window${timed(p)}`,
  'recovery-window': (p) => `adds ${pct(p.magnitude)} to your Recovery${timed(p)}`,
  'ward': (p) => `raises a ward worth ${pct(p.magnitude)} of your health${timed(p)}`,
  'cleanse': () => 'cleanses you',
  'plating-stack': (p) => `banks ${pct(p.magnitude)} plating${timed(p)}`,
  'engagement-dr': (p) => `cuts the damage you take by ${pct(p.magnitude)}${timed(p)}`,
  'contagion': (p) => `spreads ${pct(p.magnitude)} of the target's stacks to a neighbour`,
  'technique-refund': (p) => `takes ${pct(p.magnitude)} off your Technique cooldowns`,
  'technique-window': (p) => `empowers your next Technique by ${pct(p.magnitude)}`,
  'evasion-window': (p) => `adds ${pct(p.magnitude)} dodge chance${timed(p)}`,
  'big-hit': (p) => `lands for ${trimmed(p.magnitude, 2)}× damage`,
  'mechanic-proxy': () => 'counts as your class mechanic firing',
  'heal-and-load': (p) => `heals ${pct(p.magnitude)} of your pool and loads the hit`,
  'root': (p) => `roots the target${timed(p)}`,
  'redose': () => "re-doses the target's affliction",
};

/** A legacy card (it authors its own trigger and payoff) as one sentence. */
export function triggerPayoffLine(resolved: Pick<ResolvedLineageCard, 'trigger' | 'payoff' | 'perTargetTrigger'>): string | undefined {
  if (!resolved.payoff) return undefined;
  const predicate = PAYOFF_PREDICATE[resolved.payoff.kind];
  return `${triggerSubject(resolved.trigger, !!resolved.perTargetTrigger)} ${predicate(resolved.payoff)}.`;
}

/**
 * An amplifier as what it CHANGES on the card it modifies (review P5): never the
 * boost it resolves to as if it were a payoff of its own, which nothing applies.
 * The duration case quotes before and after through `applyAmplifiedAxis`, the
 * runtime's own arithmetic, so the number is the one the game will use.
 */
export function amplifierLine(lineage: LineageDefinition, progress: LineageProgress, card: LineageCard): string {
  const target = card.modifies ? lineage.cards.find((c) => c.id === card.modifies) : undefined;
  const name = target?.name ?? 'The card below';
  const axis = card.amplifies ?? 'duration';
  switch (axis) {
    case 'duration': {
      const payoff = target ? resolveLineageCardFor(lineage, progress, target).payoff : undefined;
      if (payoff?.durationMs) {
        const after = { ...payoff };
        applyAmplifiedAxis(after, 'duration', ROW_SCALAR.amplifier);
        return `${name} lasts ${seconds(after.durationMs ?? payoff.durationMs)} instead of ${seconds(payoff.durationMs)}.`;
      }
      return `${name}'s window holds longer.`;
    }
    case 'magnitude':
      return `${name}'s payoff is ${trimmed(ROW_SCALAR.amplifier * 100, 0)}% bigger.`;
    case 'targets':
      return `${name} also lands on a second body.`;
    case 'trigger': {
      const amp = resolveLineageCardFor(lineage, progress, card);
      if (target && amp.trigger?.kind === target.trigger) {
        return `${name} fires on each new target, not once a fight.`;
      }
      return `${name} also fires ${triggerObject(amp.trigger)}.`;
    }
    default:
      return `${name} gets stronger.`;
  }
}

/**
 * THE one sentence a card shows. `cardSentence` (shared) owns the T1 lean and
 * verb; everything else is generated from the resolved card — never from
 * `description`, which stays authored and unrendered (rule 5).
 */
export function pageCardSentence(lineage: LineageDefinition, card: LineageCard, progress: LineageProgress): string {
  const own = cardSentence(card, progress);
  if (own) return own;
  if (card.row === 'amplifier') return amplifierLine(lineage, progress, card);
  if (card.row === 'keystone') {
    const rule = keystoneDefinition(card.lane)?.rule;
    if (rule) return rule;
  }
  const resolved = resolveLineageCardFor(lineage, progress, card);
  return triggerPayoffLine(resolved) ?? `${ROW_LABELS[card.row]} card.`;
}

/** A Control verb's moment needs a slowed or rooted target the tree may not supply (§24.2). */
export function verbNeedsSlow(lineage: LineageDefinition, card: LineageCard, progress: LineageProgress): boolean {
  if (!isVerbCard(card)) return false;
  return composeVerb(card.lane, leanLaneFor(lineage, progress))?.needs === 'slow';
}

export const NEEDS_SLOW_NOTE = 'needs a slow';
export const NO_HIT_NOTE = 'your mechanic has no hit yet';

/**
 * The roots whose mechanic fires with no hit to act on: a reload completes on a
 * timer (`mechanicFired.ts` — the one emitter that passes no exchange).
 */
const MECHANIC_WITHOUT_HIT: ReadonlySet<CombatArchetype> = new Set<CombatArchetype>(['reload']);

/**
 * The payloads that act on the hit in flight rather than on a body or the player
 * (`types.ts`: they are not `ON_TARGET_PAYOFF_KINDS`; the runtime's `liveExchange`
 * refuses them with no exchange). `heal-and-load` still heals; only its load needs
 * the hit.
 */
const HIT_PAYLOADS: ReadonlySet<PayoffKind> = new Set<PayoffKind>(['big-hit', 'mechanic-proxy', 'heal-and-load']);

/**
 * The one caveat a VERB card shows under its sentence, or undefined — at most one,
 * the most binding first:
 *  - "needs a slow": a Control verb with no hold source in the tree (§24.2; the
 *    Control lean is one, §24.9);
 *  - "your mechanic has no hit yet": the Slinger's Empowered verb when its payload
 *    acts on the hit — a reload has no hit, so it does not land until the T3 paths
 *    (§24.9: a known asymmetry, shown rather than patched);
 *  - the verb lane's own moment caveat ("weak on bosses" for Kill chain, §24.9).
 */
export function verbNote(
  lineage: LineageDefinition,
  card: LineageCard,
  progress: LineageProgress,
  archetype?: CombatArchetype | null,
): string | undefined {
  if (!isVerbCard(card)) return undefined;
  const composed = composeVerb(card.lane, leanLaneFor(lineage, progress));
  if (!composed) return undefined;
  if (composed.needs === 'slow') return NEEDS_SLOW_NOTE;
  if (archetype && MECHANIC_WITHOUT_HIT.has(archetype)
    && composed.trigger.kind === 'mechanic-fired' && HIT_PAYLOADS.has(composed.payoff.kind)) {
    return NO_HIT_NOTE;
  }
  return packetHalves(card.lane)?.momentCaveat;
}

// ─── Cost chips and the requirement ──────────────────────────────────────────

export interface CostChip {
  kind: 'essence' | 'shard' | 'capstone';
  key: string;
  amount: number;
  held: number;
  /** Held below the amount: the chip turns red. */
  short: boolean;
  /** "Wild", "Gale": the word after the amount. */
  word: string;
  /** Shards carry their lane colour; essence reads in ink. */
  color?: string;
  /** Full name, for the tooltip and the accessible label. */
  title: string;
}

export function costChips(cost: LineageCost, wallet: Pick<LineageWallet, 'essences' | 'shards'>): CostChip[] {
  const chips: CostChip[] = [];
  for (const [type, amount] of Object.entries(cost.essence) as [EssenceType, number][]) {
    const held = wallet.essences[type] ?? 0;
    chips.push({
      kind: 'essence', key: type, amount, held, short: held < amount,
      word: ESSENCE_LABELS[type], title: `${amount} ${ESSENCE_LABELS[type]} essence (you hold ${held})`,
    });
  }
  for (const [lane, amount] of Object.entries(cost.shards) as [PacketId, number][]) {
    const held = wallet.shards?.[lane] ?? 0;
    chips.push({
      kind: 'shard', key: lane, amount, held, short: held < amount,
      word: shardWord(lane), color: laneColor(lane),
      title: `${amount} ${shardName(lane)}s (you hold ${held})`,
    });
  }
  return chips;
}

export interface Requirement {
  /** "Forest 2", or "Global Mastery 18" when that is the binding gate. */
  text: string;
  met: boolean;
}

/**
 * The requirement a card names on its right (mockup: "Forest 2"). The door
 * biome's level comes first, as `checkUnlockCard` reads it; Global Mastery is
 * named only when it is the gate actually holding the card back.
 */
export function cardRequirement(
  resolved: Pick<ResolvedLineageCard, 'requiredBiomeGroup' | 'requiredBiomeLevel' | 'requiredGlobalMastery'>,
  wallet: Pick<LineageWallet, 'biomeLevels' | 'globalMastery' | 'isTestRoom'>,
): Requirement {
  const biome = `${biomeDisplayName(resolved.requiredBiomeGroup)} ${resolved.requiredBiomeLevel}`;
  if (wallet.isTestRoom) return { text: biome, met: true };
  const level = wallet.biomeLevels[resolved.requiredBiomeGroup] ?? 0;
  if (level < resolved.requiredBiomeLevel) return { text: biome, met: false };
  if (wallet.globalMastery !== undefined && wallet.globalMastery < resolved.requiredGlobalMastery) {
    return { text: `Global Mastery ${resolved.requiredGlobalMastery}`, met: false };
  }
  return { text: biome, met: true };
}

/** The mockup's toast for a card the player cannot afford yet. */
export function shortToast(chips: readonly CostChip[], reason: string | undefined): string {
  const shard = chips.find((c) => c.kind === 'shard' && c.short);
  if (shard) return `Not enough ${shardName(shard.key as PacketId)}s. Shards drop where the map says.`;
  return reason ?? 'Not enough materials.';
}

// ─── Cards ───────────────────────────────────────────────────────────────────

export type PageCardState =
  /** Owned and the active card of its row. */
  | 'active'
  /** Owned, not active: pressing swaps it in, free. */
  | 'owned'
  /** A collapsed band's stat card, folded into the worn form (design §4). */
  | 'absorbed'
  /** Not owned, every gate passes: pressing buys it and makes it active. */
  | 'buy'
  /** Not owned, the level is there but the materials are not. */
  | 'short'
  /** Not owned, a level, mastery or prerequisite holds it back. */
  | 'gated'
  /** A row of the next band: shown, not pressable. */
  | 'locked';

export type PageCardAction = 'buy' | 'activate' | 'toast' | 'none';

export interface PageCardModel {
  card: LineageCard;
  laneColor: string;
  sentence: string;
  /** A Control verb with no hold source in the tree: "needs a slow". */
  needsSlow: boolean;
  /** The verb's one caveat under its sentence (`verbNote`): "needs a slow", … */
  note?: string;
  state: PageCardState;
  /** The tiny tag top-right: "active", "owned · click to swap in", "in your form". */
  tag?: string;
  /** Price, while unowned. */
  chips: CostChip[];
  /** "Forest 2", while unowned. */
  requirement?: Requirement;
  action: PageCardAction;
  /** What pressing a refusing card says, and the tooltip. */
  reason?: string;
  /** Lean cards drive the stat-sheet preview on hover and focus. */
  isLean: boolean;
  /** Name, sentence and state, for the button's accessible name. */
  accessibleName: string;
}

const RICH = Number.MAX_SAFE_INTEGER;
const RICH_ESSENCES = Object.fromEntries(ESSENCE_TYPES.map((t) => [t, RICH])) as Record<EssenceType, number>;
const RICH_SHARDS = Object.fromEntries(PACKET_IDS.map((p) => [p, RICH])) as Record<PacketId, number>;

/** The same wallet with every material in endless supply: what is left is a gate. */
function richWallet(wallet: LineageWallet): LineageWallet {
  return { ...wallet, essences: RICH_ESSENCES, shards: RICH_SHARDS };
}

const STATE_TEXT: Record<PageCardState, string> = {
  active: 'Active.',
  owned: 'Owned. Press to swap in, free.',
  absorbed: 'Part of your form.',
  buy: 'Press to buy and make active.',
  short: 'Not enough materials yet.',
  gated: 'Not open yet.',
  locked: 'Locked until the next form.',
};

export function pageCard(params: {
  lineage: LineageDefinition;
  card: LineageCard;
  progress: LineageProgress;
  /** The progress a verb's sentence reads: the real one, or the lean preview. */
  sentenceProgress?: LineageProgress;
  wallet: LineageWallet;
  lineages?: LineageProgressMap;
  locked?: boolean;
  /** This collapsed band's stat card the worn form absorbed. */
  absorbed?: boolean;
  /** The player's class root, for the caveats that depend on it (`verbNote`). */
  archetype?: CombatArchetype | null;
}): PageCardModel {
  const { lineage, card, progress, wallet, lineages, locked, absorbed } = params;
  const sentence = pageCardSentence(lineage, card, params.sentenceProgress ?? progress);
  const needsSlow = verbNeedsSlow(lineage, card, params.sentenceProgress ?? progress);
  const note = verbNote(lineage, card, params.sentenceProgress ?? progress, params.archetype);
  const owned = progress.ownedCards.includes(card.id);
  const base = {
    card, laneColor: laneColor(card.lane), sentence, needsSlow,
    ...(note ? { note } : {}),
    isLean: card.row === 'stat', chips: [] as CostChip[],
  };

  let model: Omit<PageCardModel, 'accessibleName'>;
  if (locked) {
    const resolved = resolveLineageCardFor(lineage, progress, card);
    const { cost } = lineageCardPrice({ lineage, card, lineages });
    model = {
      ...base, isLean: false, state: 'locked', action: 'none',
      chips: costChips(cost, wallet), requirement: cardRequirement(resolved, wallet),
    };
  } else if (absorbed) {
    model = { ...base, isLean: false, state: 'absorbed', tag: 'in your form', action: 'none' };
  } else if (owned && progress.active[card.row] === card.id && !statRowIsCollapsed(lineage, progress, card)) {
    model = { ...base, state: 'active', tag: 'active', action: 'none' };
  } else if (owned) {
    const check = checkSetActive({ lineage, progress, row: card.row, cardId: card.id });
    model = {
      ...base, state: 'owned', tag: 'owned · click to swap in',
      action: check.ok ? 'activate' : 'toast', reason: check.ok ? undefined : check.reason,
    };
  } else {
    const resolved = resolveLineageCardFor(lineage, progress, card);
    const { cost } = lineageCardPrice({ lineage, card, lineages });
    const chips = costChips(cost, wallet);
    const requirement = cardRequirement(resolved, wallet);
    const check = checkUnlockCard({ lineage, card, progress, wallet, lineages });
    if (check.ok) {
      model = { ...base, state: 'buy', action: 'buy', chips, requirement };
    } else if (checkUnlockCard({ lineage, card, progress, wallet: richWallet(wallet), lineages }).ok) {
      model = { ...base, state: 'short', action: 'toast', chips, requirement, reason: shortToast(chips, check.reason) };
    } else {
      model = { ...base, state: 'gated', action: 'toast', chips, requirement, reason: check.reason };
    }
  }
  return {
    ...model,
    accessibleName: `${card.name}. ${sentence}${note ? ` ${note.charAt(0).toUpperCase()}${note.slice(1)}.` : ''} ${STATE_TEXT[model.state]}`,
  };
}

// ─── Bands ───────────────────────────────────────────────────────────────────

export interface PageRow {
  tier: number;
  row: RowKind;
  title: string;
  question: string;
  locked: boolean;
  /** In the lineage's lane order; a lane with no card in this row is skipped. */
  cards: PageCardModel[];
}

export type PageBandMode = 'collapsed' | 'lit' | 'locked' | 'absent';

export interface PageBand {
  tier: number;
  mode: PageBandMode;
  rows: PageRow[];
  /** Collapsed only: "Tier 1: Quick Wrist, Flurry". */
  summary?: string;
  /** Collapsed only: the stat card folded into the worn form. */
  absorbedName?: string;
}

/**
 * Every band the page shows, top to bottom: the collapsed bands below the worn
 * form (a wardrobe, expandable to reslot), the ONE lit band, then the next band
 * locked — or "nothing beyond" when it is not authored.
 */
export function pageBands(params: {
  lineage: LineageDefinition;
  progress: LineageProgress;
  wallet: LineageWallet;
  lineages?: LineageProgressMap;
  /** The progress verb sentences read (the lean preview while one is hovered). */
  sentenceProgress?: LineageProgress;
  /** The player's class root, for the verbs' caveats. */
  archetype?: CombatArchetype | null;
}): PageBand[] {
  const { lineage, progress } = params;
  const wornTier = Math.max(1, wornFormTier(lineage, progress));
  const absorbedIds = new Set(absorbedStatCards(lineage, progress).map((c) => c.id));

  const rowsOf = (tier: number, locked: boolean): PageRow[] => {
    const { cards } = bandContents(lineage, tier);
    return rowsForTier(tier)
      .filter((row) => cards.some((c) => c.row === row))
      .map((row) => ({
        tier, row, locked,
        title: rowTitle(tier, row),
        question: locked ? lockedRowQuestion(tier) : ROW_QUESTIONS[row],
        cards: lineage.lanes
          .map((lane) => cards.find((c) => c.row === row && c.lane === lane))
          .filter((c): c is LineageCard => !!c)
          .map((card) => pageCard({
            ...params, card, locked, absorbed: absorbedIds.has(card.id),
          })),
      }));
  };

  const bands: PageBand[] = [];
  for (let tier = 1; tier < wornTier; tier++) {
    const { cards } = bandContents(lineage, tier);
    const owned = cards.filter((c) => progress.ownedCards.includes(c.id)).map((c) => c.name);
    bands.push({
      tier, mode: 'collapsed', rows: rowsOf(tier, false),
      summary: `Tier ${tier}: ${owned.length > 0 ? owned.join(', ') : 'nothing bought'}`,
      absorbedName: cards.find((c) => absorbedIds.has(c.id))?.name,
    });
  }
  bands.push({ tier: wornTier, mode: 'lit', rows: rowsOf(wornTier, false) });
  const next = wornTier + 1;
  bands.push(bandContents(lineage, next).cards.length > 0
    ? { tier: next, mode: 'locked', rows: rowsOf(next, true) }
    : { tier: next, mode: 'absent', rows: [] });
  return bands;
}

// ─── The lean preview (display only; nothing is sent) ───────────────────────

/**
 * The player's tree with `leanId` bought and slotted — a CLONE, for the stat
 * sheet's "after" and the verbs' preview sentences. Null when there is nothing
 * to preview: the card is not a stat card of this lineage, it is already the
 * active lean, or it could never sit in the row (a collapsed band's).
 */
export function previewLeanProgress(
  lineage: LineageDefinition,
  progress: LineageProgress,
  leanId: string,
): LineageProgress | null {
  const card = lineage.cards.find((c) => c.id === leanId);
  if (!card || card.row !== 'stat') return null;
  if (progress.active.stat === leanId && progress.ownedCards.includes(leanId)) return null;
  const ownedCards = progress.ownedCards.includes(leanId) ? [...progress.ownedCards] : [...progress.ownedCards, leanId];
  const clone: LineageProgress = { ...progress, ownedCards, active: { ...progress.active, stat: leanId } };
  return checkSetActive({ lineage, progress: clone, row: 'stat', cardId: leanId }).ok ? clone : null;
}

// ─── The stat sheet ──────────────────────────────────────────────────────────

type Preview = ReturnType<typeof previewEquipmentStats>;

interface PageStatDef {
  key: string;
  label: string;
  value: (p: Preview, subVariant: SubVariant | null) => number | undefined;
  fmt: (v: number) => string;
  /** Value at which the row says nothing; such a row is hidden unless it moves. */
  neutral: number;
  pinned?: boolean;
  lowerIsBetter?: boolean;
  /** Shown only for a class this number is read by. */
  onlyFor?: CombatArchetype;
}

const PAGE_STAT_DEFS: readonly PageStatDef[] = [
  { key: 'dps', label: 'Damage / sec', value: (p) => p.stats.dps, fmt: (v) => trimmed(v), neutral: 0, pinned: true },
  { key: 'attack', label: 'Attack', value: (p) => p.stats.attack, fmt: (v) => trimmed(v, 0), neutral: 0, pinned: true },
  { key: 'attacksPerSecond', label: 'Attack speed', value: (p) => p.stats.attacksPerSecond, fmt: (v) => `${trimmed(v, 2)}/s`, neutral: 0, pinned: true },
  { key: 'onHitDamage', label: 'On-hit damage', value: (p) => p.stats.onHitDamage, fmt: (v) => trimmed(v, 0), neutral: 0 },
  // DoT potency adds into the DoT root's damage multiplier (stats.ts) and nothing
  // else reads it, so the row exists only for the class that has one. Read the
  // way the runtime reads it: the passive, else the frame's profile default.
  {
    key: 'dotMult', label: 'Poison & bleed',
    value: (p, sub) => resolveDotClassProfile(p.passives, sub).dotMechanicMultiplier,
    fmt: (v) => `×${trimmed(v, 2)}`, neutral: 0, pinned: true, onlyFor: 'dot',
  },
  {
    key: 'techniquePower', label: 'Technique power', value: (p) => p.passives['technique.power-pct'] ?? 0,
    fmt: (v) => `+${pct(v)}`, neutral: 0,
  },
  { key: 'maxHp', label: 'Health', value: (p) => p.stats.maxHp, fmt: (v) => trimmed(v, 0), neutral: 0, pinned: true },
  { key: 'damageReduction', label: 'Damage reduction', value: (p) => p.stats.damageReduction, fmt: (v) => pct(v), neutral: 0 },
  { key: 'recovery', label: 'Recovery', value: (p) => p.stats.recovery, fmt: (v) => `${trimmed(v)}/s`, neutral: 0 },
  { key: 'speed', label: 'Move speed', value: (p) => p.stats.speed, fmt: (v) => trimmed(v, 0), neutral: 0, pinned: true },
];

export interface PageStatRow {
  key: string;
  label: string;
  before: string;
  /** Present while a lean is hovered and this row moves. */
  after?: string;
  direction: -1 | 0 | 1;
}

export interface PageStatSheet {
  rows: PageStatRow[];
  /** Under the rows: what the hover is showing, or that nothing moved. */
  note: string;
  /** Attack and swings/s for the form header's meta line. */
  attack: number;
  attacksPerSecond: number;
}

export const STAT_SHEET_NOTE =
  'Hover a lean: the sheet shows before → after. A verb has no number here; its sentence is the whole card.';
export const STAT_SHEET_INERT_NOTE =
  'Nothing on this sheet moves for your class. The lean still sets what your verb delivers.';

const EPS = 1e-6;

/**
 * The page's stat sheet: the player as they stand, and — while a lean is hovered
 * — the same sheet with that lean slotted, computed by `previewEquipmentStats`,
 * the server's own stat formula. The visible rows never change during a hover:
 * they are the pinned ones, the ones with a value, and the ones ANY lean of the
 * lit band would move.
 */
export function pageStatSheet(params: {
  build: Omit<EquipmentPreviewInput, 'lineages'>;
  lineages: LineageProgressMap;
  lineage: LineageDefinition;
  progress: LineageProgress;
  /** Every lean of the lit band, for the stable row set. */
  leanIds: readonly string[];
  hoveredLeanId?: string | null;
}): PageStatSheet {
  const { build, lineages, lineage, progress, leanIds, hoveredLeanId } = params;
  const withTree = (tree: LineageProgress): LineageProgressMap => ({ ...lineages, [lineage.id]: tree });
  const now = previewEquipmentStats({ ...build, lineages: withTree(progress) });
  const previewOf = (leanId: string): Preview | null => {
    const clone = previewLeanProgress(lineage, progress, leanId);
    return clone ? previewEquipmentStats({ ...build, lineages: withTree(clone) }) : null;
  };
  const options = leanIds.map(previewOf).filter((p): p is Preview => !!p);
  const hovered = hoveredLeanId ? previewOf(hoveredLeanId) : null;
  const archetype = build.usesSkills.combatArchetype;
  const sub = build.usesSkills.selectedSubVariant;

  const rows: PageStatRow[] = [];
  let moved = false;
  for (const def of PAGE_STAT_DEFS) {
    if (def.onlyFor && def.onlyFor !== archetype) continue;
    const before = def.value(now, sub);
    if (before === undefined) continue;
    const anyMoves = options.some((p) => Math.abs((def.value(p, sub) ?? before) - before) > EPS);
    if (!def.pinned && Math.abs(before - def.neutral) <= EPS && !anyMoves) continue;
    const after = hovered ? def.value(hovered, sub) ?? before : before;
    const changed = Math.abs(after - before) > EPS;
    if (changed) moved = true;
    const better = def.lowerIsBetter ? after < before : after > before;
    rows.push({
      key: def.key, label: def.label, before: def.fmt(before),
      ...(changed ? { after: def.fmt(after) } : {}),
      direction: changed ? (better ? 1 : -1) : 0,
    });
  }
  return {
    rows,
    note: hovered && !moved ? STAT_SHEET_INERT_NOTE : STAT_SHEET_NOTE,
    attack: now.stats.attack,
    attacksPerSecond: now.stats.attacksPerSecond,
  };
}

// ─── The form header ─────────────────────────────────────────────────────────

export interface FormHeader {
  recipeId: string;
  name: string;
  icon: string | null;
  eyebrow: string;
  meta: string;
  lanes: { lane: PacketId; name: string; color: string }[];
  /** Owned forms of the worn tier the player can swap to, free. */
  alsoOwned: { recipeId: string; name: string; reason?: string }[];
}

export function formHeader(params: {
  lineage: LineageDefinition;
  progress: LineageProgress;
  wallet: LineageWallet;
  attack: number;
  attacksPerSecond: number;
}): FormHeader {
  const { lineage, progress, wallet, attack, attacksPerSecond } = params;
  const tier = Math.max(1, wornFormTier(lineage, progress));
  const def = ITEM_DATABASE.get(progress.wornForm);
  const door = lineageBandBiome(lineage, progress, tier);
  const meta = [
    `Attack ${trimmed(attack, 0)}`,
    `${trimmed(attacksPerSecond, 2)} swings/s`,
    `${biomeDisplayName(door)} level ${wallet.biomeLevels[door] ?? 0}`,
    ...(wallet.globalMastery !== undefined ? [`Global Mastery ${wallet.globalMastery}`] : []),
  ].join(' · ');
  const alsoOwned = lineage.forms
    .filter((f) => f.tier === tier && f.recipeId !== progress.wornForm && progress.ownedForms.includes(f.recipeId))
    .map((f) => {
      const check = checkWearForm({ lineage, progress, recipeId: f.recipeId });
      return { recipeId: f.recipeId, name: ITEM_DATABASE.get(f.recipeId)?.name ?? f.recipeId, reason: check.ok ? undefined : check.reason };
    });
  return {
    recipeId: progress.wornForm,
    name: def?.name ?? 'No form',
    icon: def?.icon ?? null,
    eyebrow: `Weapon · ${biomeDisplayName(lineage.homeBiome)} lineage · Tier ${tier} form`,
    meta,
    lanes: lineage.lanes.map((lane) => ({ lane, name: packetDefinition(lane)?.name ?? lane, color: laneColor(lane) })),
    alsoOwned,
  };
}

// ─── The gate ────────────────────────────────────────────────────────────────

export interface GateDoor {
  form: LineageForm;
  name: string;
  action: 'pay' | 'wear' | 'blocked';
  label: string;
  /** Why the button is disabled, shown under it and as its tooltip. */
  reason?: string;
}

export interface GateBlock {
  /** The capstone biome: one block per boss. */
  biome: string;
  bossId: string | null;
  bossName: string;
  bossColor: number;
  /** The one sentence: what it costs and what it opens. */
  sentence: string;
  pips: boolean[];
  /** "1 of 3 capstones · the Greatbear is in Bearroot Hollow". */
  progressLine: string;
  doors: GateDoor[];
}

/** "Gnarled Greatbear" → "the Greatbear": the short handle the progress line uses. */
function bossHandle(name: string): string {
  const last = name.trim().split(/\s+/).pop() ?? name;
  return `the ${last}`;
}

/** The dungeon whose boss drops this biome's capstone, by its map name. */
export function bossLairName(bossId: string): string | undefined {
  for (const def of DUNGEON_DEFS.values()) {
    if (def.boss.bossId === bossId) return NODE_BIOMES[def.nodeId]?.displayName;
  }
  return undefined;
}

/**
 * The gate at the bottom of the lit band (design §24.6 item 3). One block per
 * boss: two forms behind the same boss share a block and its sentence, a form
 * behind another biome's boss gets its own, because its capstones come from that
 * boss and nowhere else. One door (button) per form.
 */
export function gateBlocks(params: {
  lineage: LineageDefinition;
  progress: LineageProgress;
  wallet: LineageWallet;
}): GateBlock[] {
  const { lineage, progress, wallet } = params;
  const tier = Math.max(1, wornFormTier(lineage, progress));
  const forms = bandContents(lineage, tier).gateForms;
  const biomes = [...new Set(forms.map((f) => f.biome))];
  const essence = lineageEssenceType(lineage);

  return biomes.map((biome) => {
    const group = forms.filter((f) => f.biome === biome);
    const material = CAPSTONE_MATERIALS.get(biome);
    const boss = material ? MONSTER_DATABASE.get(material.bossMonsterId) : undefined;
    const bossName = boss?.name ?? `the ${biomeDisplayName(biome)} boss`;
    const cost = lineageGateCost(group[0]!, lineage);
    const required = cost.capstone.amount;
    const held = wallet.capstones?.[biome] ?? 0;

    const lanes = group.map((f) => f.capstone?.lane).filter((l): l is PacketId => !!l);
    const shardAmount = Object.values(cost.shards)[0] ?? 0;
    const shardPhrase = group.length === 1 && lanes[0]
      ? `${shardAmount} ${shardName(lanes[0])}s`
      : `${shardAmount} shards of the crowned lane`;
    const formList = group.map((f) => {
      const lane = f.capstone?.lane;
      const crowns = lane ? ` · crowns ${packetDefinition(lane)?.name ?? lane}` : '';
      return `the ${ITEM_DATABASE.get(f.recipeId)?.name ?? f.recipeId} (${biomeDisplayName(f.biome)}${crowns})`;
    }).join(' or ');
    const capstones = `${countWord(required)} ${biomeDisplayName(biome)} capstone${required === 1 ? '' : 's'}`;
    const sentence = `${capstones}, ${cost.essence[essence] ?? 0} ${ESSENCE_LABELS[essence]} and ${shardPhrase} open a Tier ${tier + 1} form: ${formList}.`;

    const lair = material ? bossLairName(material.bossMonsterId) : undefined;
    const progressLine = `${Math.min(held, required)} of ${required} capstone${required === 1 ? '' : 's'}`
      + (lair ? ` · ${bossHandle(bossName)} is in ${lair}` : '');

    const doors = group.map((form): GateDoor => {
      const name = ITEM_DATABASE.get(form.recipeId)?.name ?? form.recipeId;
      if (progress.ownedForms.includes(form.recipeId)) {
        const check = checkWearForm({ lineage, progress, recipeId: form.recipeId });
        return { form, name, action: check.ok ? 'wear' : 'blocked', label: `Wear the ${name}`, reason: check.ok ? undefined : check.reason };
      }
      const check = checkUnlockForm({ lineage, form, progress, wallet });
      const label = group.length === 1 ? 'Pay the gate' : `Pay for the ${name}`;
      return { form, name, action: check.ok ? 'pay' : 'blocked', label, reason: check.ok ? undefined : check.reason };
    });

    return {
      biome,
      bossId: material?.bossMonsterId ?? null,
      bossName,
      bossColor: boss?.color ?? 0x8a6d2b,
      sentence,
      pips: Array.from({ length: required }, (_, i) => i < held),
      progressLine,
      doors,
    };
  });
}

// ─── Materials ───────────────────────────────────────────────────────────────

export interface MaterialLine {
  kind: 'essence' | 'shard' | 'capstone';
  key: string;
  name: string;
  held: number;
  color?: string;
  /** Where it comes from, in ink3. */
  where?: string;
}

/**
 * Where a lane's shard drops: the territory and the nodes of the band's door
 * biome that pay it (design §24.3), falling back to the lineage's home biome at
 * tier 1 when the door biome has no node paying it.
 */
export function shardWhere(lineage: LineageDefinition, progress: LineageProgress, lane: PacketId): string | undefined {
  const tier = Math.max(1, wornFormTier(lineage, progress));
  const door = lineageBandBiome(lineage, progress, tier);
  const nodes = nodesPayingShard(door, tier, lane);
  const ids = nodes.length > 0 ? nodes : nodesPayingShard(lineage.homeBiome, 1, lane);
  if (ids.length === 0) return undefined;
  const families = [...new Set(ids.map((id) => nodeFamily(id)?.name).filter((n): n is string => !!n))];
  const places = ids.map((id) => NODE_BIOMES[id]?.displayName ?? id);
  return `${families.join(' / ')} territory: ${places.join(', ')}`;
}

export function materialLines(params: {
  lineage: LineageDefinition;
  progress: LineageProgress;
  wallet: LineageWallet;
}): MaterialLine[] {
  const { lineage, progress, wallet } = params;
  const essence = lineageEssenceType(lineage);
  const lines: MaterialLine[] = [{
    kind: 'essence', key: essence, name: `${ESSENCE_LABELS[essence]} essence`, held: wallet.essences[essence] ?? 0,
  }];
  for (const lane of lineage.lanes) {
    lines.push({
      kind: 'shard', key: lane, name: `${shardName(lane)}s`, held: wallet.shards?.[lane] ?? 0,
      color: laneColor(lane), where: shardWhere(lineage, progress, lane),
    });
  }
  const tier = Math.max(1, wornFormTier(lineage, progress));
  for (const biome of [...new Set(bandContents(lineage, tier).gateForms.map((f) => f.biome))]) {
    const material = CAPSTONE_MATERIALS.get(biome);
    const boss = material ? MONSTER_DATABASE.get(material.bossMonsterId)?.name : undefined;
    lines.push({
      kind: 'capstone', key: biome, name: material?.name ?? `${biomeDisplayName(biome)} capstone`,
      held: wallet.capstones?.[biome] ?? 0,
      where: `${biomeDisplayName(biome)} capstone${boss ? ` · ${boss} drops it` : ''}`,
    });
  }
  return lines;
}

// ─── Toasts (the mockup's copy) ──────────────────────────────────────────────

/** What the page asked the server for, so a result can be named in a toast. */
export type PendingIntent =
  | { action: 'unlockCard'; cardId: string; row: RowKind; name: string; thenActivate: boolean }
  | { action: 'setActive'; cardId: string; name: string; afterBuy: boolean }
  | { action: 'unlockForm'; recipeId: string; name: string; tier: number }
  | { action: 'wearForm'; recipeId: string; name: string };

export function successToast(pending: PendingIntent): string {
  switch (pending.action) {
    case 'unlockCard':
      return pending.thenActivate ? `${pending.name} bought and active. Owned forever.` : `${pending.name} bought. Owned forever.`;
    case 'setActive':
      return pending.afterBuy ? `${pending.name} bought and active. Owned forever.` : `${pending.name} swapped in. Free.`;
    case 'unlockForm':
      return `${pending.name} is yours. Wear it to open Tier ${pending.tier}.`;
    case 'wearForm':
      return `Wearing the ${pending.name}.`;
  }
}

/**
 * Should a successful buy be followed by a swap-in? The mockup's card buys AND
 * makes active. The server activates a purchase only into an empty row, so the
 * page asks for the swap itself — when the shared `checkSetActive` says the card
 * may sit in its row once owned (a collapsed band's stat card may not).
 */
export function activateAfterBuy(lineage: LineageDefinition, progress: LineageProgress, card: LineageCard): boolean {
  const owned: LineageProgress = { ...progress, ownedCards: [...progress.ownedCards, card.id] };
  return checkSetActive({ lineage, progress: owned, row: card.row, cardId: card.id }).ok;
}
