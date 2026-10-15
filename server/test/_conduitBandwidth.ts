/** Throwaway: the Conduit's network cost per broadcast by summon count (T2 bandwidth diet). */
import assert from 'node:assert/strict';
import {
  CONDUIT_DISCIPLINE_TUNING,
  CONDUIT_KIT,
  classConfigContextFromState,
  classLineFor,
  defaultClassConfig,
  emptyEquipment,
  getResource,
  getStatusEffect,
  ITEM_DATABASE,
  applyStatusEffect,
  rosterCommand,
  validateClassConfig,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { attachComponent } from '../src/ecs/markerHelpers';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { computeMinionSpeed } from '../src/systems/classes/archetypes/summoner/spawn';
import { computeLeashRadius } from '../src/systems/classes/archetypes/summoner/ai';
import { summonerProfileFor } from '../src/systems/classes/archetypes/summoner/profile';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { BARK_EFFECT_ID, firePackStrike, MARK_EFFECT_ID } from '../src/systems/classes/archetypes/summoner/summonPiecesT2';
import { soulPower } from '../src/systems/classes/archetypes/summoner/souls';
import { runMonsterAttackOnMinion } from '../src/systems/combat/engine/combat';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';
import { isMonsterStunned, STUN_EFFECT } from '../src/systems/combat/status/stun';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { equipItem } from '../src/systems/player/economy/inventory';
import { World } from '../src/world/World';


initCombatSystems();
const BIOMES = { plains: 12, forest: 12, swamp: 12, mountain: 12, cave: 12, jungle: 6, desert: 6 };

function setup(roster: string[], opts: { relic?: string; discipline?: string; cleared?: string[] } = {}) {
  const world = new World();
  const player = world.attachPlayerEntity({
    isPlayer: { id: 'conduit', name: 'Conduit' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-5-5', speed: 120 },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {}, unlockedRecipes: [], questProgress: {}, biomeLevel: BIOMES,
      playerTier: 2, currentSkillTier: 0, bossesCleared: opts.cleared ?? [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root'], passives: {}, selectedClass: 'summoner-root',
      selectedSubVariant: null, selectedRange: null, combatArchetype: 'summoner',
      disciplineId: opts.discipline ?? null,
    },
  } as unknown as PersistedPlayerSlices, 'conduit');
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  const ctx = classConfigContextFromState({
    combatArchetype: 'summoner', biomeLevel: BIOMES, bossesCleared: opts.cleared ?? [], disciplineId: opts.discipline ?? null,
  })!;
  const config = defaultClassConfig(ctx);
  assert.equal(config.system.kind, 'formation');
  if (config.system.kind === 'formation') config.system.roster = roster;
  if (opts.relic) config.relic = [opts.relic];
  attachComponent(world, player, 'configuresClass', { config: { ...config, mode: 'custom' } });
  return { world, player };
}


const ROSTERS: Record<string, string[]> = {
  '6': ['conduit-thrall','conduit-plains-tank','conduit-forest-bruiser','conduit-swamp-spitter','conduit-mountain-marksman','conduit-thrall'],
  '12': Array(12).fill('conduit-thrall'),
  '20': Array(20).fill('conduit-thrall'),
};
for (const [n, roster] of Object.entries(ROSTERS)) {
  const { world, player } = setup(roster, { discipline: 'conduit-swarm' });
  const node = player.hasPosition.nodeId;
  const dirty0 = world.beginBroadcast();
  world.buildNodeDelta(node, dirty0);
  let bytes = 0, frames = 0, now = 1_000;
  for (let i = 0; i < 100; i++) {
    now += 100;
    player.hasPosition.current.x += 6;
    world.tick(100, now);
    if (i % 2 === 1) {
      const dirty = world.beginBroadcast();
      const snap = world.buildNodeDelta(node, dirty);
      bytes += JSON.stringify(snap).length; frames++;
    }
  }
  console.log(`roster ${n}: minions ${player.summonsMinions?.minionIds.length}, ${(bytes / frames).toFixed(0)} B/broadcast`);
}
{
  const { world, player } = setup(ROSTERS['6'], { discipline: 'conduit-swarm' });
  const node = player.hasPosition.nodeId;
  world.buildNodeDelta(node, world.beginBroadcast());
  for (let i = 0; i < 20; i++) { player.hasPosition.current.x += 6; world.tick(100, 1000 + i * 100); if (i % 2) { const s = world.buildNodeDelta(node, world.beginBroadcast()); if (i === 19) console.log(JSON.stringify(s.deltas.filter((d: any) => d.kind !== 'remove').slice(1, 3))); } }
}
