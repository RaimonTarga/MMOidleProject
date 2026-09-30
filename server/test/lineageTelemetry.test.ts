/**
 * Lineage-tree gameplay telemetry (progression rework plan §1.5).
 *
 * The three events the Phase 1 playtest has to answer with — time-to-first-card,
 * swaps per session, gates paid — are emitted by the four economy handlers, not
 * by the socket layer, because only the handler knows the cost it actually paid.
 *
 * Bare `World`, no database: the recorder takes an emit callback.
 */
import assert from 'node:assert/strict';
import {
  gateCapstoneAmount,
  gateEssenceCost,
  gateShardCost,
  rowEssenceCost,
  rowShardCost,
  type GameplayEvent,
} from '@mmo-idle/shared';
import { gameplayPlayerSlices as slices } from './fixtures/gameplayPlayer';
import { GameplayRecorder } from '../src/analytics/gameplayRecorder';
import { gameplayMetrics } from '../src/analytics/gameplayMetrics';
import { World } from '../src/world/World';
import { equipItem } from '../src/systems/player/economy/inventory';
import {
  setLineageActive,
  unlockLineageCard,
  unlockLineageForm,
} from '../src/systems/player/economy/lineages';

const TEMPO_STAT = 'rapier-t1-tempo-stat';
const AFFLICTION_STAT = 'rapier-t1-affliction-stat';
const TEMPO_PAYOFF = 'rapier-t1-tempo-payoff';

function main(): void {
  let now = 1_000_000;
  const events: GameplayEvent[] = [];
  const world = new World();
  const player = world.attachPlayerEntity(slices('lineage-socket'), 'lineage-socket');
  const recorder = new GameplayRecorder((e) => events.push(e), 'lineage-test', () => now);
  world.gameplay = recorder;
  recorder.start(player, 'random-character-id', 'human');

  // Holding the base form is what opens the tree (Phase 1b, `lineageSync.ts`).
  player.holdsInventory.inventory.push('flash-rapier');
  equipItem(world, player, 'flash-rapier');
  assert(player.holdsInventory.lineages?.rapier, 'equipping the base form opens the tree');

  // Full T1 mastery across the five biomes: GM 30 clears every T1 row and gate.
  const prog = player.tracksProgression;
  for (const biome of ['plains', 'forest', 'mountain', 'cave', 'swamp']) prog.biomeLevel[biome] = 6;
  prog.essences.green = 10_000;
  prog.shards = { tempo: 100, affliction: 100 };
  prog.capstones = { forest: 10 };

  const lineageEvents = () => events.filter((e) => e.payload.kind === 'lineage');
  const lastLineage = () => {
    const payload = lineageEvents().at(-1)!.payload;
    assert(payload.kind === 'lineage');
    return payload;
  };

  // ── A refused purchase records nothing ──────────────────────────────────────
  now += 1_000;
  const refused = unlockLineageCard(world, player, 'rapier', 'rapier-t1-tempo-payoff-nope');
  assert(!refused.success, 'an unknown card is refused');
  assert.equal(lineageEvents().length, 0, 'a refused action emits no telemetry');

  // ── First card: time-to-first-card ──────────────────────────────────────────
  now += 4_000;
  assert(unlockLineageCard(world, player, 'rapier', TEMPO_STAT).success, 'buys the tempo stat row');
  assert.equal(lineageEvents().length, 1, 'one row per accepted purchase');
  const first = lastLineage();
  assert.equal(first.event, 'lineage.card-unlocked');
  assert.equal(first.lineageId, 'rapier');
  assert.equal(first.cardId, TEMPO_STAT);
  assert.equal(first.lane, 'tempo');
  assert.equal(first.row, 'stat');
  assert.equal(first.ownedCards, 1);
  assert.equal(first.firstOfSession, true, 'the session’s first card is flagged');
  assert.equal(first.sessionElapsedMs, 5_000, 'elapsed session time is the time-to-first-card');
  assert.equal(first.essenceSpent, rowEssenceCost(1, 'stat'), 'records the essence actually paid');
  assert.equal(first.shardsSpent, rowShardCost(1, 'stat'), 'records the shards actually paid');
  assert.equal(first.capstonesSpent, 0, 'a card is not a gate');

  // ── A second purchase is not "first" any more ───────────────────────────────
  now += 2_000;
  assert(unlockLineageCard(world, player, 'rapier', AFFLICTION_STAT).success, 'buys a second stat row');
  const second = lastLineage();
  assert.equal(second.event, 'lineage.card-unlocked');
  assert.equal(second.firstOfSession, false, 'only one first card per session');
  assert.equal(second.ownedCards, 2);
  // Buying into an already-filled row must NOT count as a swap: the player chose
  // nothing, the server simply left the row alone.
  assert.equal(lineageEvents().filter((e) => {
    const p = e.payload;
    return p.kind === 'lineage' && p.event === 'lineage.card-swapped';
  }).length, 0, 'a purchase into a filled row is not a swap');

  // ── Swapping the active card of a row ───────────────────────────────────────
  now += 3_000;
  assert(setLineageActive(world, player, 'rapier', 'stat', AFFLICTION_STAT).success, 'swaps the stat row');
  const swap = lastLineage();
  assert.equal(swap.event, 'lineage.card-swapped');
  assert.equal(swap.cardId, AFFLICTION_STAT);
  assert.equal(swap.replacedCardId, TEMPO_STAT, 'a swap names what it displaced');
  assert.equal(swap.row, 'stat');
  assert.equal(swap.essenceSpent, 0, 'activating is free');

  // Re-activating the same card is a no-op and must not inflate swaps per session.
  const before = lineageEvents().length;
  assert(setLineageActive(world, player, 'rapier', 'stat', AFFLICTION_STAT).success, 'no-op activation succeeds');
  assert.equal(lineageEvents().length, before, 'a no-op activation emits nothing');

  // Clearing a row IS a choice the player made, so it is a swap with a null card.
  now += 1_000;
  assert(setLineageActive(world, player, 'rapier', 'stat', null).success, 'clears the stat row');
  const cleared = lastLineage();
  assert.equal(cleared.event, 'lineage.card-swapped');
  assert.equal(cleared.cardId, null);
  assert.equal(cleared.replacedCardId, AFFLICTION_STAT);
  // And activating into the row it just emptied is a purchase-shaped no-swap.
  const afterClear = lineageEvents().length;
  assert(setLineageActive(world, player, 'rapier', 'stat', TEMPO_STAT).success, 'refills the empty row');
  assert.equal(lineageEvents().length, afterClear, 'filling an empty row is not a swap');

  // ── Paying a gate ──────────────────────────────────────────────────────────
  now += 5_000;
  assert(unlockLineageCard(world, player, 'rapier', TEMPO_PAYOFF).success, 'buys the payoff row');
  const essenceBefore = prog.essences.green ?? 0;
  const capstonesBefore = prog.capstones.forest ?? 0;
  assert(unlockLineageForm(world, player, 'rapier', 'gale-needle').success, 'pays the T1 gate');
  const gate = lastLineage();
  assert.equal(gate.event, 'lineage.gate-paid');
  assert.equal(gate.formRecipeId, 'gale-needle');
  assert.equal(gate.lane, 'tempo', 'the gate names the lane its form crowns');
  assert.equal(gate.cardId, null);
  assert.equal(gate.essenceSpent, gateEssenceCost(1));
  assert.equal(gate.shardsSpent, gateShardCost(1));
  assert.equal(gate.capstonesSpent, gateCapstoneAmount(1));
  assert.equal(essenceBefore - (prog.essences.green ?? 0), gate.essenceSpent, 'the row matches the wallet delta');
  assert.equal(capstonesBefore - (prog.capstones.forest ?? 0), gate.capstonesSpent, 'the row matches the capstone delta');

  // ── Every row projects only gameplay, and aggregates into daily metrics ────
  for (const event of lineageEvents()) {
    const json = JSON.stringify(event);
    assert(!json.includes('lineage-socket'), 'no socket id reaches telemetry');
    assert(!json.includes('Human Tester'), 'no display name reaches telemetry');
    assert.equal(event.characterId, 'random-character-id');
  }
  const metrics = lineageEvents().flatMap(gameplayMetrics);
  assert(metrics.some((m) => m.metric === 'lineage.card-unlocked'), 'purchases aggregate');
  assert(metrics.some((m) => m.metric === 'lineage.card-swapped'), 'swaps aggregate');
  assert(metrics.some((m) => m.metric === 'lineage.gate-paid'), 'gates aggregate');
  const firstCard = metrics.filter((m) => m.metric === 'lineage.first-card-ms');
  assert.equal(firstCard.length, 1, 'exactly one first-card row per session');
  assert.equal(firstCard[0].value, 5_000, 'time-to-first-card survives aggregation');

  console.log('lineageTelemetry.test.ts: ok');
}

main();
