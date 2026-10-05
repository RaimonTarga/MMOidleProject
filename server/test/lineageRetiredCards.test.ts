/**
 * Loading a save written before design §26.1 (legibility run, 2026-10-05).
 *
 * The T1 band became the ranked lean trio (Attack / Speed / Effect) and the
 * weapon's ONE verb. The fifteen lane-named T1 leans and the two non-fixed T1
 * verbs per weapon left the data, and production saves own them. This pins the
 * on-load migration through the real load path (`loadCharacter`, a stub query
 * builder — CI provisions no Postgres):
 *
 *   1. every owned retired card is refunded at today's T1 row price (essence of the
 *      lineage's home biome, the card's own lane's shard), once, and logged once;
 *   2. the retired ids drop out of `ownedCards`, and no `active` row is left
 *      pointing at one — the kept fixed verb stays owned;
 *   3. it is idempotent: the slices saved back and loaded again refund nothing;
 *   4. the read-only listings never grant (the lobby, like the retired ladder);
 *   5. a malformed save never throws;
 *   6. hydration normalises ranks: an owned ranked card with no rank is rank I, an
 *      out-of-table rank is clamped, a rank for an unowned card is dropped — and
 *      the entity resolves the owned rank.
 *
 * Run: node --conditions=development --import tsx test/lineageRetiredCards.test.ts
 */
import {
  GAME_CONFIG, LINEAGE_DATABASE, baseRecoveryForTier, emptyEquipment, lineageEssenceType,
  resolveActiveLineages, rowEssenceCost, rowShardCost,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { listAccountCharacters, loadCharacter, type DB } from '../src/db/playerRepo';
import { subscribeAdminLogs } from '../src/log';
import { World } from '../src/world/World';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

/** A save from before design §26.1: a Rapier tree with retired cards slotted, an Axe tree too. */
function oldSave(id: string, lineages: unknown): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-t1-forest-01', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 5, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 40, yellow: 0, purple: 0 },
      shards: { tempo: 1 }, capstones: {},
      biomeXP: {}, biomeLevel: { forest: 6, cave: 6 },
      unlockedRecipes: [], questProgress: {},
      playerTier: 1, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: {
      inventory: ['chaotic-axe'],
      equipment: { ...emptyEquipment(), weapon: 'flash-rapier' },
      itemUpgrades: {},
      lineages,
    },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  } as unknown as PersistedPlayerSlices;
}

const OLD_LINEAGES = {
  rapier: {
    // Quick Wrist (lean) and Venom Point (verb) are retired; Flurry is kept.
    ownedCards: ['rapier-t1-tempo-stat', 'rapier-t1-affliction-payoff', 'rapier-t1-tempo-payoff'],
    active: { stat: 'rapier-t1-tempo-stat', payoff: 'rapier-t1-affliction-payoff' },
    ownedForms: ['flash-rapier'], wornForm: 'flash-rapier',
  },
  axe: {
    // Cleaving Blow is retired; the Axe tree is otherwise empty.
    ownedCards: ['axe-t1-empowered-payoff'], active: { payoff: 'axe-t1-empowered-payoff' },
    ownedForms: ['chaotic-axe'], wornForm: 'chaotic-axe',
  },
};

/** A drizzle builder that answers with fixed rows however it is chained. */
function stubDb(rows: readonly unknown[]): DB {
  const self: Record<string, unknown> = {
    then: (resolve: (value: readonly unknown[]) => unknown) => Promise.resolve(rows).then(resolve),
  };
  for (const step of ['from', 'where', 'orderBy', 'leftJoin', 'set', 'returning']) self[step] = () => self;
  return { select: () => self, update: () => self } as unknown as DB;
}

/** Slices as the `characters` row they would be written as. */
function asRow(id: string, slices: PersistedPlayerSlices): Record<string, unknown> {
  return {
    id, accountId: 'acct-retired',
    isPlayer: JSON.stringify(slices.isPlayer),
    hasPosition: JSON.stringify(slices.hasPosition),
    hasHealth: JSON.stringify(slices.hasHealth),
    tracksProgression: JSON.stringify(slices.tracksProgression),
    holdsInventory: JSON.stringify(slices.holdsInventory),
    usesSkills: JSON.stringify(slices.usesSkills),
    summonerState: null, deletedAt: null, lastPlayedAt: 1, updatedAt: 1,
  };
}

async function main(): Promise<void> {
  const logs: string[] = [];
  const unsubscribe = subscribeAdminLogs((entry) => {
    if (/refunded retired T1 lineage cards/.test(entry.message)) logs.push(entry.message);
  });

  const id = 'p-retired';
  const before = oldSave(id, OLD_LINEAGES);

  // ── 4. The lobby listing reads, never grants ──────────────────────────────
  const lobby = await listAccountCharacters(stubDb([asRow(id, before)]), 'acct-retired');
  assert(lobby.length === 1, 'the lobby lists the character');
  assert(logs.length === 0, `a lobby listing grants nothing, got ${logs.length} refund log(s)`);

  // ── 1, 2. The load path refunds and drops ────────────────────────────────
  const loaded = await loadCharacter(stubDb([asRow(id, before)]), 'acct-retired', id);
  assert(loaded, 'the load path answers');
  const prog = loaded!.tracksProgression;
  const rapierEssence = lineageEssenceType(LINEAGE_DATABASE.get('rapier')!);
  const axeEssence = lineageEssenceType(LINEAGE_DATABASE.get('axe')!);
  const expectedRapier = rowEssenceCost(1, 'stat') + rowEssenceCost(1, 'payoff');
  const expectedAxe = rowEssenceCost(1, 'payoff');
  const heldBefore = before.tracksProgression.essences;
  if (rapierEssence === axeEssence) {
    assert(prog.essences[rapierEssence] === heldBefore[rapierEssence] + expectedRapier + expectedAxe, 'both refunds land');
  } else {
    assert(prog.essences[rapierEssence] === heldBefore[rapierEssence] + expectedRapier,
      `the Rapier refund is ${expectedRapier} ${rapierEssence}, got ${prog.essences[rapierEssence] - heldBefore[rapierEssence]}`);
    assert(prog.essences[axeEssence] === heldBefore[axeEssence] + expectedAxe,
      `the Axe refund is ${expectedAxe} ${axeEssence}`);
  }
  assert(prog.shards.tempo === 1 + rowShardCost(1, 'stat'), `Quick Wrist's Gale Shards come back, got ${prog.shards.tempo}`);
  assert(prog.shards.affliction === rowShardCost(1, 'payoff'), "Venom Point's Venom Shards come back");
  assert(prog.shards.empowered === rowShardCost(1, 'payoff'), "Cleaving Blow's Anvil Shards come back");
  assert(logs.length === 1, `the refund is logged once, got ${logs.length}`);

  const rapier = loaded!.holdsInventory.lineages!.rapier!;
  assert(rapier.ownedCards.join() === 'rapier-t1-tempo-payoff', `only the kept verb survives, got ${rapier.ownedCards.join()}`);
  assert(rapier.active.stat === undefined && rapier.active.payoff === undefined, 'no active row points at a retired card');
  const axe = loaded!.holdsInventory.lineages!.axe!;
  assert(axe.ownedCards.length === 0 && Object.keys(axe.active).length === 0, 'the Axe tree is emptied of its retired verb');

  // The live entity takes the migrated slices without complaint.
  const world = new World();
  const player = world.attachPlayerEntity(loaded!, id);
  assert(player.holdsInventory.lineages?.rapier?.ownedCards.includes('rapier-t1-tempo-payoff'), 'the kept verb is owned');
  assert(resolveActiveLineages(player.holdsInventory).cards.length === 0, 'nothing retired resolves');

  // ── 3. Idempotent: saved back and loaded again, nothing more is refunded ──
  const again = await loadCharacter(stubDb([asRow(id, loaded!)]), 'acct-retired', id);
  assert(JSON.stringify(again!.tracksProgression.essences) === JSON.stringify(prog.essences), 'no second essence refund');
  assert(JSON.stringify(again!.tracksProgression.shards) === JSON.stringify(prog.shards), 'no second shard refund');
  assert(logs.length === 1, 'and no second log');

  // ── 5. A malformed save never throws ─────────────────────────────────────
  const broken = oldSave('p-broken', { rapier: { ownedCards: 'rapier-t1-tempo-stat', active: 7 }, nope: null });
  const brokenLoaded = await loadCharacter(stubDb([asRow('p-broken', broken)]), 'acct-retired', 'p-broken');
  assert(brokenLoaded, 'a malformed tree still loads');
  assert(JSON.stringify(brokenLoaded!.tracksProgression.shards) === JSON.stringify({ tempo: 1 }), 'and refunds nothing');

  // ── 6. Ranks normalise on load ───────────────────────────────────────────
  const ranked = oldSave('p-ranks', {
    rapier: {
      ownedCards: ['rapier-t1-effect', 'rapier-t1-speed', 'rapier-t1-tempo-payoff'],
      active: { stat: 'rapier-t1-speed', payoff: 'rapier-t1-tempo-payoff' },
      ownedForms: ['flash-rapier'], wornForm: 'flash-rapier',
      ranks: { 'rapier-t1-speed': 7, 'rapier-t1-attack': 2 },
    },
  });
  const rankedLoaded = await loadCharacter(stubDb([asRow('p-ranks', ranked)]), 'acct-retired', 'p-ranks');
  const ranks = rankedLoaded!.holdsInventory.lineages!.rapier!.ranks!;
  assert(ranks['rapier-t1-effect'] === 1, 'an owned ranked card with no rank loads at rank I');
  assert(ranks['rapier-t1-speed'] === 3, 'an out-of-table rank is clamped to III');
  assert(ranks['rapier-t1-attack'] === undefined, 'a rank for an unowned card is dropped');
  assert(ranks['rapier-t1-tempo-payoff'] === undefined, 'a verb carries no rank');
  const rankedPlayer = new World().attachPlayerEntity(rankedLoaded!, 'p-ranks');
  assert(resolveActiveLineages(rankedPlayer.holdsInventory).statEffects.attackSpeedPct === 0.16,
    'the entity pays the owned rank III');

  unsubscribe();
}

void main()
  .then(() => { console.log('lineageRetiredCards.test.ts: ok'); })
  .catch((err: unknown) => { console.error(err); process.exitCode = 1; });
