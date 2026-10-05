/**
 * The UI prototypes run's data export (docs/briefs/ui-prototypes-run-2026-10-04.md).
 *
 * Read-only on the game: it renders what the client's own models render — the
 * weapon page (`weaponPageModel.ts`), the rhythm ring shapes, the target and
 * buff status metadata (`targetStatusMeta.ts`, `statusHelp.ts`, `conceptIcons.ts`),
 * the arrival banner's territory line (`areaInformationModel.ts`) — plus the T1
 * node blends and the tutorial's lean + verb picks, and writes them to
 * `reports/ui-prototypes/data.json` (and `data.js`, the same object as a script
 * global, so a prototype opened from disk can load it without a fetch).
 *
 * No card's authored `description` is exported: the page never renders one
 * (design §24.6), so a prototype cannot either.
 *
 *   node --conditions=development --import tsx scripts/_uiProtoExport.ts
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BIOME_DATABASE,
  ESSENCE_LABELS,
  FAMILY_DATABASE,
  ITEM_DATABASE,
  LINEAGE_DATABASE,
  LEAN_CONDITION_NUMBERS,
  MONSTER_DATABASE,
  NODE_BIOMES,
  PACKET_HALF_NUMBERS,
  RECIPE_DATABASE,
  TUTORIAL_CLASS_PLANS,
  WORLD_NODE_LIST,
  cardSentence,
  composeVerb,
  emptyEquipment,
  familiesForBiome,
  isLineageParked,
  lineageEssenceType,
  nodeFamily,
  nodeShard,
  nodeSpawnBlend,
  packetDefinition,
  packetHalves,
  previewEquipmentStats,
  resolveLineageCards,
  rhythmShape,
  shardName,
  verbSentence,
  type CombatArchetype,
  type LineageCard,
  type LineageDefinition,
  type LineageProgress,
  type LineageWallet,
  type PacketId,
  tutorialScriptFor,
  TUTORIAL_CONCEPTS,
} from '@mmo-idle/shared';
import {
  formHeader,
  gateBlocks,
  laneColor,
  materialLines,
  pageBands,
  pageCardSentence,
  pageStatSheet,
  shardWord,
  successToast,
  verbNote,
  type CostChip,
  type PageBand,
  type PageCardModel,
} from '../../client/src/ui/lineage/weaponPageModel';
import { statusMeta } from '../../client/src/hud/targetStatusMeta';
import { buffHelp, prettifyStatusId, targetStatusHelp } from '../../client/src/hud/statusHelp';
import { statusIconSource, targetStatusIconSource } from '../../client/src/ui/conceptIcons';
import {
  FRAME_RING_COLOR, PULSE_MARK, READY_MARK, RHYTHM_PAYLOAD_GLYPHS, SPENT_MARK, cardWordFor,
} from '../../client/src/hud/rhythmReadoutModel';
import { arrivalTerritoryLine, ARRIVAL_DURATION_MS } from '../../client/src/hud/areaInformationModel';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = join(REPO, 'reports', 'ui-prototypes');

/** A repo-relative art path, or null when the file is not there. */
function art(relative: string): string | null {
  return existsSync(join(REPO, relative)) ? relative : null;
}

/** `/assets/...` (the client's public URL) → the repo path a prototype can load. */
function publicArt(url: string | undefined | null): string | null {
  if (!url) return null;
  return art(`client/public${url.replace(/\?.*$/, '')}`);
}

const T1_BIOMES = ['plains', 'forest', 'mountain', 'cave', 'swamp'] as const;
const T1_WEAPONS = [...LINEAGE_DATABASE.values()]
  .filter((l) => l.slot === 'weapon' && !isLineageParked(l) && l.forms.some((f) => f.tier === 1));

const archetypeOf = (root: string): CombatArchetype => root.replace(/-root$/, '') as CombatArchetype;

// ─── Packets (the seven weapon lanes) ────────────────────────────────────────

const WEAPON_LANES = [...new Set(T1_WEAPONS.flatMap((l) => l.lanes))];
const packets = Object.fromEntries(WEAPON_LANES.map((lane) => {
  const def = packetDefinition(lane)!;
  const halves = packetHalves(lane);
  const shard = shardWord(lane).toLowerCase();
  return [lane, {
    lane,
    name: def.name,
    color: laneColor(lane),
    shardName: shardName(lane),
    shardWord: shardWord(lane),
    shardIcon: art(`art/src/items/materials/${shard}-shard.png`),
    scalingStat: def.scalingStat,
    momentPhrase: halves?.momentPhrase ?? null,
    payloadPhrase: halves?.payloadPhrase ?? null,
    momentCaveat: halves?.momentCaveat ?? null,
    payloadFx: halves?.payloadFx ?? null,
    pureFx: halves?.pure.fx ?? null,
    /** The pure pair (same lane, or no lean) as the page renders it at T1. */
    pureSentence: verbSentence(lane) ?? null,
    payloadGlyph: publicArt(RHYTHM_PAYLOAD_GLYPHS[lane]),
    numbers: PACKET_HALF_NUMBERS[lane] ?? null,
    leanCondition: LEAN_CONDITION_NUMBERS[lane] ?? null,
  }];
}));

// ─── Weapon pages ────────────────────────────────────────────────────────────

const slimChip = (c: CostChip) => ({
  kind: c.kind, key: c.key, amount: c.amount, held: c.held, short: c.short, word: c.word,
  color: c.color ?? null, title: c.title,
});

const slimCard = (m: PageCardModel) => ({
  id: m.card.id,
  name: m.card.name,
  row: m.card.row,
  tier: m.card.tier,
  lane: m.card.lane,
  laneColor: m.laneColor,
  sentence: m.sentence,
  note: m.note ?? null,
  state: m.state,
  tag: m.tag ?? null,
  chips: m.chips.map(slimChip),
  requirement: m.requirement ?? null,
  action: m.action,
  reason: m.reason ?? null,
  isLean: m.isLean,
  accessibleName: m.accessibleName,
});

const slimBands = (bands: PageBand[]) => bands.map((band) => ({
  tier: band.tier,
  mode: band.mode,
  summary: band.summary ?? null,
  rows: band.rows.map((row) => ({
    tier: row.tier, row: row.row, title: row.title, question: row.question, locked: row.locked,
    cards: row.cards.map(slimCard),
  })),
}));

function buildFor(archetype: CombatArchetype, root: string, items: Record<string, string | null>) {
  return {
    usesSkills: {
      unlockedSkills: [root], passives: {}, selectedClass: root,
      selectedSubVariant: null, selectedRange: null, combatArchetype: archetype,
    },
    equipment: { ...emptyEquipment(), ...items },
    itemUpgrades: {}, playerTier: 1, hpFraction: 1,
  } as Parameters<typeof pageStatSheet>[0]['build'];
}

interface PageState {
  key: string;
  label: string;
  archetype: CombatArchetype;
  root: string;
  progress: LineageProgress;
  wallet: LineageWallet;
  equipment: Record<string, string | null>;
}

/** A weapon page exactly as `weaponPageModel` renders it for one game state. */
function renderPage(lineage: LineageDefinition, state: PageState) {
  const lineages = { [lineage.id]: state.progress };
  const leanIds = lineage.cards.filter((c) => c.tier === 1 && c.row === 'stat').map((c) => c.id);
  const build = buildFor(state.archetype, state.root, state.equipment);
  const still = pageStatSheet({ build, lineages, lineage, progress: state.progress, leanIds });
  const header = formHeader({
    lineage, progress: state.progress, wallet: state.wallet,
    attack: still.attack, attacksPerSecond: still.attacksPerSecond,
  });
  const bands = pageBands({
    lineage, progress: state.progress, wallet: state.wallet, lineages, archetype: state.archetype,
  });
  const gates = gateBlocks({ lineage, progress: state.progress, wallet: state.wallet }).map((g) => ({
    biome: g.biome, bossId: g.bossId, bossName: g.bossName,
    bossColor: `#${g.bossColor.toString(16).padStart(6, '0')}`,
    sentence: g.sentence, pips: g.pips, progressLine: g.progressLine,
    doors: g.doors.map((d) => ({ recipeId: d.form.recipeId, name: d.name, action: d.action, label: d.label, reason: d.reason ?? null })),
  }));
  const materials = materialLines({ lineage, progress: state.progress, wallet: state.wallet });
  // The lean hover: the stat sheet with each lean slotted, and every verb re-read.
  const leanHover = Object.fromEntries(leanIds.map((leanId) => {
    const sheet = pageStatSheet({ build, lineages, lineage, progress: state.progress, leanIds, hoveredLeanId: leanId });
    return [leanId, { rows: sheet.rows, note: sheet.note }];
  }));
  return {
    key: state.key,
    label: state.label,
    className: classNameOf(state.root),
    archetype: state.archetype,
    progress: state.progress,
    wallet: state.wallet,
    header: { ...header, iconArt: header.icon ? art(`art/src/${header.icon}`) : null },
    bands: slimBands(bands),
    gates,
    materials,
    statSheet: { rows: still.rows, note: still.note, attack: still.attack, attacksPerSecond: still.attacksPerSecond },
    leanHover,
  };
}

function classNameOf(root: string): string {
  return TUTORIAL_CLASS_PLANS.find((p) => p.classRoot === root)?.className ?? root;
}

/** Every verb of a band read with every lean (and none): the page's sentence, caveat, ring and fx. */
function compositions(lineage: LineageDefinition, tier: number, archetype: CombatArchetype) {
  const leans = lineage.cards.filter((c) => c.tier === tier && c.row === 'stat');
  const verbs = lineage.cards.filter((c) => c.tier === tier && c.row === 'payoff');
  const form = lineage.forms.find((f) => f.tier === tier)!.recipeId;
  const rows: unknown[] = [];
  for (const verb of verbs) {
    for (const lean of [undefined, ...leans] as (LineageCard | undefined)[]) {
      const progress: LineageProgress = {
        ownedCards: lean ? [lean.id, verb.id] : [verb.id],
        active: lean ? { stat: lean.id, payoff: verb.id } : { payoff: verb.id },
        ownedForms: [form], wornForm: form,
      };
      const composed = composeVerb(verb.lane, lean?.lane, tier)!;
      const resolved = resolveLineageCards(lineage, progress).find((r) => r.card.id === verb.id);
      const shape = resolved?.trigger ? rhythmShape(resolved.trigger, resolved.perTargetTrigger === true) : null;
      const payloadLane: PacketId = composed.pure ? verb.lane : (lean?.lane ?? verb.lane);
      rows.push({
        verbId: verb.id,
        verbName: verb.name,
        verbLane: verb.lane,
        leanId: lean?.id ?? null,
        leanName: lean?.name ?? null,
        leanLane: lean?.lane ?? null,
        pure: composed.pure,
        sentence: pageCardSentence(lineage, verb, progress),
        note: verbNote(lineage, verb, progress, archetype) ?? null,
        needs: composed.needs ?? null,
        trigger: resolved?.trigger ?? null,
        payoff: resolved?.payoff ?? null,
        fx: composed.fx,
        payloadLane,
        momentColor: laneColor(verb.lane),
        payloadColor: laneColor(payloadLane),
        ringShape: shape,
        ringGlyph: publicArt(RHYTHM_PAYLOAD_GLYPHS[payloadLane]),
        floatingWord: cardWordFor(verb.id) ?? null,
      });
    }
  }
  return rows;
}

function cardList(lineage: LineageDefinition) {
  return lineage.cards
    .filter((c) => c.tier <= 2)
    .map((c) => ({
      id: c.id, name: c.name, row: c.row, tier: c.tier, lane: c.lane, laneColor: laneColor(c.lane),
      // A lean's sentence is its stat line; a verb's own (no lean) is its pure pair.
      sentence: cardSentence(c, { ownedCards: [c.id], active: { [c.row]: c.id }, ownedForms: [], wornForm: '' })
        ?? pageCardSentence(lineage, c, { ownedCards: [c.id], active: { [c.row]: c.id }, ownedForms: [], wornForm: '' }),
    }));
}

const RICH_LEVELS = (lineage: LineageDefinition): LineageWallet => {
  const essence = lineageEssenceType(lineage);
  return {
    essences: { [essence]: 500 },
    shards: Object.fromEntries(lineage.lanes.map((l) => [l, 20])),
    capstones: {},
    biomeLevels: { [lineage.homeBiome]: 6 },
    globalMastery: 18,
    playerTier: 1,
  };
};

const weapons = T1_WEAPONS.map((lineage) => {
  const t1 = lineage.forms.find((f) => f.tier === 1)!;
  const item = ITEM_DATABASE.get(t1.recipeId);
  const recipe = RECIPE_DATABASE.get(t1.recipeId) as { weaponDot?: unknown } | undefined;
  const fresh: PageState = {
    key: 'fresh', label: 'Nothing bought, levels and materials at zero (Striker)',
    archetype: 'cadence', root: 'cadence-root',
    progress: { ownedCards: [], active: {}, ownedForms: [t1.recipeId], wornForm: t1.recipeId },
    wallet: { essences: {}, shards: {}, capstones: {}, biomeLevels: { [lineage.homeBiome]: 0 }, globalMastery: 0, playerTier: 1 },
    equipment: { weapon: t1.recipeId },
  };
  const open: PageState = {
    ...fresh, key: 'open', label: 'Nothing bought, every T1 gate met, materials plenty (Striker)',
    wallet: RICH_LEVELS(lineage),
  };
  return {
    lineageId: lineage.id,
    homeBiome: lineage.homeBiome,
    homeBiomeName: BIOME_DATABASE.get(lineage.homeBiome)?.name ?? lineage.homeBiome,
    essence: { type: lineageEssenceType(lineage), label: ESSENCE_LABELS[lineageEssenceType(lineage)] },
    lanes: lineage.lanes.map((lane) => ({ lane, name: packetDefinition(lane)?.name ?? lane, color: laneColor(lane), shardName: shardName(lane) })),
    t1Form: {
      recipeId: t1.recipeId, name: item?.name ?? t1.recipeId,
      attack: item?.statModifiers?.attack ?? null, attacksPerSecond: item?.attacksPerSecond ?? null,
      element: item?.element ?? null, weaponDot: recipe?.weaponDot ?? null,
      iconArt: item?.icon ? art(`art/src/${item.icon}`) : null,
    },
    t2Forms: lineage.forms.filter((f) => f.tier === 2).map((f) => ({
      recipeId: f.recipeId, name: ITEM_DATABASE.get(f.recipeId)?.name ?? f.recipeId, biome: f.biome,
      capstone: f.capstone ? { id: f.capstone.id, name: f.capstone.name, lane: f.capstone.lane } : null,
    })),
    cards: cardList(lineage),
    compositionsT1: compositions(lineage, 1, 'cadence'),
    pages: [renderPage(lineage, fresh), renderPage(lineage, open)],
  };
});

// ─── The Poison Dagger's scene states (SCENES.md) ────────────────────────────

const dagger = LINEAGE_DATABASE.get('dagger')!;
const SLINGER = { archetype: 'reload' as CombatArchetype, root: 'reload-root' };
const slingerKit = { weapon: 'ashbrand-blade', armor: 'forest-vest-t1', recovery: 'swamp-charm-t1', mobility: 'plains-boots-t1' };
const daggerForm = { ownedForms: ['ashbrand-blade'], wornForm: 'ashbrand-blade' };
const sceneWallet = (essence: number, shards: Partial<Record<PacketId, number>>): LineageWallet => ({
  essences: { purple: essence }, shards, capstones: { swamp: 0 },
  biomeLevels: { swamp: 4, plains: 4, forest: 4, mountain: 3, cave: 0 }, globalMastery: 15, playerTier: 1,
});
const daggerStates: PageState[] = [
  {
    key: 'scene2', label: 'Scene 2 — the page: Coated Edge active, Into the Wound affordable',
    ...SLINGER, equipment: slingerKit,
    progress: { ...daggerForm, ownedCards: ['dagger-t1-affliction-stat'], active: { stat: 'dagger-t1-affliction-stat' } },
    wallet: sceneWallet(95, { affliction: 9, control: 4, 'kill-chain': 2 }),
  },
  {
    key: 'scene2-after-buy', label: 'Scene 2 — after pressing Into the Wound (bought and made active)',
    ...SLINGER, equipment: slingerKit,
    progress: {
      ...daggerForm, ownedCards: ['dagger-t1-affliction-stat', 'dagger-t1-affliction-payoff'],
      active: { stat: 'dagger-t1-affliction-stat', payoff: 'dagger-t1-affliction-payoff' },
    },
    wallet: sceneWallet(5, { affliction: 1, control: 4, 'kill-chain': 2 }),
  },
  {
    key: 'scene3-composed', label: 'Scene 3b — Tendon Cut (Control lean) swapped in over Coated Edge, Into the Wound active',
    ...SLINGER, equipment: slingerKit,
    progress: {
      ...daggerForm,
      ownedCards: ['dagger-t1-affliction-stat', 'dagger-t1-control-stat', 'dagger-t1-affliction-payoff'],
      active: { stat: 'dagger-t1-control-stat', payoff: 'dagger-t1-affliction-payoff' },
    },
    wallet: sceneWallet(5, { affliction: 1, control: 1, 'kill-chain': 2 }),
  },
];
const daggerSlingerStats = previewEquipmentStats({
  ...buildFor(SLINGER.archetype, SLINGER.root, slingerKit),
  lineages: { dagger: daggerStates[1].progress },
});

/** The four worn items of the Gear tab (design: the trees are reached from a Gear tab). */
const gear = (Object.entries(slingerKit) as [string, string][]).map(([slot, recipeId]) => {
  const item = ITEM_DATABASE.get(recipeId);
  const lineage = [...LINEAGE_DATABASE.values()].find((l) => l.forms.some((f) => f.recipeId === recipeId));
  return {
    slot, recipeId, name: item?.name ?? recipeId, tier: item?.tier ?? null, biome: item?.biomeGroup ?? null,
    statModifiers: item?.statModifiers ?? null,
    iconArt: item?.icon ? art(`art/src/${item.icon}`) : null,
    hasPage: !!lineage && !isLineageParked(lineage),
  };
});

/** The Slinger's guide lines around the two purchases (its script, verbatim). */
const slingerScript = tutorialScriptFor('reload-root');
const tutorialBeats = slingerScript.beats
  .filter((b) => /^(shards|card):dagger-t1-/.test(b.id))
  .map((b) => {
    const { steps: _steps, ...rest } = b as typeof b & { steps?: unknown };
    return rest;
  });

const daggerScenes = {
  className: 'Slinger',
  gear,
  tutorialBeats,
  tutorialConcepts: TUTORIAL_CONCEPTS,
  toasts: {
    buyVerb: successToast({ action: 'unlockCard', cardId: 'dagger-t1-affliction-payoff', row: 'payoff', name: 'Into the Wound', thenActivate: true }),
    buyLean: successToast({ action: 'unlockCard', cardId: 'dagger-t1-control-stat', row: 'stat', name: 'Tendon Cut', thenActivate: true }),
    swapLean: successToast({ action: 'setActive', cardId: 'dagger-t1-control-stat', name: 'Tendon Cut', afterBuy: false }),
  },
  pages: daggerStates.map((s) => renderPage(dagger, s)),
  compositionsT1Slinger: compositions(dagger, 1, 'reload'),
  compositionsT2Slinger: compositions(dagger, 2, 'reload'),
  playerStats: {
    note: 'previewEquipmentStats: Slinger (reload root, no frame), Poison Dagger + Forest vest + Swamp charm + Plains boots, Coated Edge + Into the Wound active.',
    maxHp: daggerSlingerStats.stats.maxHp,
    attack: daggerSlingerStats.stats.attack,
    attacksPerSecond: daggerSlingerStats.stats.attacksPerSecond,
    dps: daggerSlingerStats.stats.dps,
    speed: daggerSlingerStats.stats.speed,
  },
};

// ─── Statuses: every lineage status id, with what it has today ──────────────

const FALLBACK_META_COLOR = '#b0a8d0';

const TARGET_STATUSES: { id: string; source: string; lineage: boolean }[] = [
  { id: 'lineage.hemorrhage', lineage: true, source: 'Affliction payload (heavy bleed, a whole swing over 4 s) and the Affliction pure pair (the re-dose adds to it)' },
  { id: 'lineage.lean-bleed', lineage: true, source: 'Affliction lean: a light bleed added on every landed hit' },
  { id: 'lineage.poison', lineage: true, source: 'legacy poison-stack payoff (parked trees, some capstones)' },
  { id: 'ability-slowed', lineage: true, source: 'Control lean: a short weak slow on every landed hit (applyMonsterSlow); also the slow payoff' },
  { id: 'ability-rooted', lineage: true, source: 'Control payload: root 2 s' },
  { id: 'stunned', lineage: true, source: 'Control pure pair: knockdown 1.5 s (applyStun)' },
  { id: 'vulnerability', lineage: true, source: 'legacy vulnerability payoff (parked trees)' },
  { id: 'plating-shred', lineage: true, source: 'legacy plating-shred payoff (parked trees)' },
  { id: 'poison-dagger-burn', lineage: false, source: "the Poison Dagger's own poison reservoir (weaponDot, 50% of the hit over 4.5 s) — not a card, but on the same target" },
  { id: 'cadence-hemorrhage', lineage: false, source: "the Striker's class bleed — an affliction the Affliction moment also finds" },
  { id: 'dot', lineage: false, source: "the Apprentice's class DoT — an affliction the Affliction moment also finds" },
];

const statuses = {
  note: 'label/color from targetStatusMeta.statusMeta (metaIsFallback = no authored entry, the prettified id is what the target frame prints today); help from statusHelp.targetStatusHelp / buffHelp (null = no tooltip copy); icon from conceptIcons (null = no art).',
  target: TARGET_STATUSES.map(({ id, source, lineage }) => {
    const meta = statusMeta(id);
    const help = targetStatusHelp(id);
    return {
      id, lineage, source,
      label: meta.label,
      color: meta.color,
      metaIsFallback: meta.color === FALLBACK_META_COLOR,
      prettified: prettifyStatusId(id),
      help: help ? { title: help.title ?? null, kind: help.kind, help: help.help } : null,
      icon: publicArt(targetStatusIconSource(id)?.src),
    };
  }),
  playerWindows: [
    'lineage-damage', 'lineage-speed', 'lineage-recovery', 'lineage-guard',
    'lineage-ward', 'lineage-plate', 'lineage-technique', 'lineage-evasion', 'frame-window', 'frame-charge',
  ].map((id) => {
    const help = buffHelp(id);
    return {
      id,
      help: help ? { title: help.title ?? null, kind: help.kind, help: help.help } : null,
      icon: publicArt(statusIconSource(id)?.src),
    };
  }),
  playerDebuffIcons: {
    poison: publicArt(statusIconSource('debuff-poison')?.src),
    dot: publicArt(statusIconSource('debuff-dot')?.src),
    slow: publicArt(statusIconSource('debuff-slow')?.src),
    root: publicArt(statusIconSource('debuff-root')?.src),
    stunned: publicArt(statusIconSource('debuff-stunned')?.src),
  },
};

// ─── Rhythm readout vocabulary ───────────────────────────────────────────────

const rhythm = {
  note: 'rhythmReadoutModel.ts: one ring per active triggered card (at most three, with the frame ring). Shapes: count = k/n toward hit-nth; cap = a clock after firing, ✦ when ready; latch-body = ✦ ready on this target, — spent; carry = ✦ armed by a kill, — waiting; pulse = • resting.',
  marks: { ready: READY_MARK, spent: SPENT_MARK, pulse: PULSE_MARK },
  frameRingColor: FRAME_RING_COLOR,
  floatingWord: { riseMs: 900, risePx: 28, holdShare: 0.5, font: "'Cinzel', 'Palatino Linotype', Georgia, serif", sizePx: 16, text: 'the card name + "!" in its lane colour' },
};

// ─── Nodes: the T1 blends, family rosters and the shard each node pays ───────

const monsterSummary = (id: string) => {
  const m = MONSTER_DATABASE.get(id) as { name?: string; color?: number; stats?: Record<string, number>; behavior?: string } | undefined;
  return {
    id, name: m?.name ?? id,
    color: m?.color !== undefined ? `#${m.color.toString(16).padStart(6, '0')}` : null,
    hp: m?.stats?.hp ?? null, attack: m?.stats?.attack ?? null,
    attackCooldownMs: m?.stats?.attackCooldown ?? null, behavior: m?.behavior ?? null,
  };
};

const families = Object.fromEntries(T1_BIOMES.map((biome) => [biome, familiesForBiome(biome).map((f) => ({
  id: f.id, name: f.name, drops: f.drops, dropsShard: shardName(f.drops), punishes: f.punishes,
  monsters: f.monsterIds.map(monsterSummary),
}))]));

const nodes = WORLD_NODE_LIST
  .filter((n) => n.biomeTier === 1 && (T1_BIOMES as readonly string[]).includes(n.biomeGroup))
  .map((n) => {
    const family = nodeFamily(n.id);
    const shard = nodeShard(n.id);
    const resolved = nodeSpawnBlend(n.id);
    const placeName = NODE_BIOMES[n.id]?.displayName ?? n.id;
    return {
      id: n.id,
      displayName: placeName,
      biome: n.biomeGroup,
      biomeName: BIOME_DATABASE.get(n.biomeGroup)?.name ?? n.biomeGroup,
      tier: n.biomeTier,
      kind: n.blend ? 'normal' : 'no-blend (dungeon, sanctuary)',
      authoredBlend: n.blend ?? null,
      resolvedShares: resolved
        ? Object.fromEntries(Object.entries(resolved.shares).map(([f, v]) => [f, Math.round((v ?? 0) * 1000) / 1000]))
        : null,
      fieldedByFamily: resolved ? Object.fromEntries([...resolved.poolByFamily].map(([f, ids]) => [f, ids.map((id) => MONSTER_DATABASE.get(id)?.name ?? id)])) : null,
      spawnCycle: resolved?.cycle ?? null,
      family: family ? { id: family.id, name: family.name, punishes: family.punishes } : null,
      shard: shard ?? null,
      shardName: shard ? shardName(shard) : null,
      shardColor: shard ? laneColor(shard) : null,
      arrival: {
        discovery: arrivalTerritoryLine(n.id, 'discovery'),
        newNode: arrivalTerritoryLine(n.id, 'new-node'),
        return: arrivalTerritoryLine(n.id, 'return'),
      },
      mapTileLabel: family && shard ? `${placeName} · ${family.name} territory · ${shardName(shard)}s` : placeName,
    };
  });

// ─── Tutorial picks (the lean + verb each class is taught on its fighting weapon) ──

const tutorialPicks = TUTORIAL_CLASS_PLANS.map((plan) => {
  const pick = plan.weaponCards!;
  const lineage = LINEAGE_DATABASE.get(pick.lineageId)!;
  const lean = lineage.cards.find((c) => c.id === pick.lean)!;
  const verb = lineage.cards.find((c) => c.id === pick.verb)!;
  const form = lineage.forms.find((f) => f.tier === 1)!.recipeId;
  const progress: LineageProgress = {
    ownedCards: [lean.id, verb.id], active: { stat: lean.id, payoff: verb.id }, ownedForms: [form], wornForm: form,
  };
  const archetype = archetypeOf(plan.classRoot);
  return {
    className: plan.className,
    classRoot: plan.classRoot,
    archetype,
    weapon: { lineageId: lineage.id, name: ITEM_DATABASE.get(form)?.name ?? form },
    lean: { id: lean.id, name: lean.name, lane: lean.lane, sentence: pageCardSentence(lineage, lean, progress) },
    verb: { id: verb.id, name: verb.name, lane: verb.lane, sentence: pageCardSentence(lineage, verb, progress), note: verbNote(lineage, verb, progress, archetype) ?? null },
    pair: `${lean.lane}+${verb.lane}`,
  };
});
const distinctPairs = [...new Map(tutorialPicks.map((p) => [`${p.weapon.lineageId}|${p.lean.id}|${p.verb.id}`, p])).values()]
  .map((p) => ({ weapon: p.weapon.name, lean: p.lean.name, verb: p.verb.name, sentence: p.verb.sentence, classes: tutorialPicks.filter((q) => q.lean.id === p.lean.id && q.verb.id === p.verb.id).map((q) => q.className) }));

// ─── Art the prototypes may load (repo-relative; null = missing) ─────────────

const artIndex = {
  note: 'Paths are relative to the repo root; from reports/ui-prototypes/<x>/index.html prefix ../../../. Every path was checked to exist when the export ran.',
  slingerSprite: art('art/src/sprites/classes/reload.png'),
  monsters: {
    'bog-slime': art('art/src/sprites/monsters/swampslime.png'),
    'fen-hexer': art('art/src/sprites/monsters/fen-hexer.png'),
    'bog-lurker': art('art/src/sprites/monsters/bog-lurker.png'),
    'mire-stalker': art('art/src/sprites/monsters/mire-stalker.png'),
    'mud-toad': art('art/src/sprites/monsters/mud-toad.png'),
  },
  /** No capstone material has art yet; the T1 biome bosses do. */
  bosses: Object.fromEntries(T1_BIOMES.map((b) => [b, art(`art/src/sprites/bosses/boss-${b}-t1.png`)])),
};

// ─── Write ───────────────────────────────────────────────────────────────────

const commit = execSync('git rev-parse --short HEAD', { cwd: REPO }).toString().trim();
const data = {
  generator: 'server/scripts/_uiProtoExport.ts',
  commit,
  brief: 'docs/briefs/ui-prototypes-run-2026-10-04.md',
  packets,
  weapons,
  daggerScenes,
  statuses,
  rhythm,
  arrival: { durationsMs: ARRIVAL_DURATION_MS },
  families,
  nodes,
  tutorialPicks,
  distinctPairs,
  art: artIndex,
};

mkdirSync(OUT_DIR, { recursive: true });
const json = JSON.stringify(data, null, 2);
writeFileSync(join(OUT_DIR, 'data.json'), `${json}\n`);
writeFileSync(join(OUT_DIR, 'data.js'),
  `// Generated by server/scripts/_uiProtoExport.ts at ${commit}. Do not edit; re-run the script.\nwindow.UI_PROTO_DATA = ${json};\n`);
console.log(`wrote ${join(OUT_DIR, 'data.json')} (${(json.length / 1024).toFixed(0)} KB): ${weapons.length} weapons, ${nodes.length} nodes, ${statuses.target.length} target statuses, ${tutorialPicks.length} tutorial picks (${distinctPairs.length} distinct)`);
