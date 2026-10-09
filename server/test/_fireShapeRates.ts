/**
 * THROWAWAY (W2-E report): per-Guard node firings per minute
 * in a synthetic fight — one monster hitting every 1.5 s through the real
 * monster-attack path, the Guard's node on each of its three routes.
 *
 *   held     the Guard's window held up the whole minute (re-cast the tick it drops)
 *   duty     the Guard cast on its own cooldown, as an always-on Rune would
 *
 * Run: node --conditions=development --import tsx test/_fireShapeRates.ts
 */
import {
  ABILITY_DATABASE, ABILITY_PACKET_OFFERS, ABILITY_FIRE_SHAPES, GAME_CONFIG, STARTER_RUNE_IDS,
  abilityNodeFx, abilityNodeId, applyStatusEffect, baseRecoveryForTier, emptyEquipment,
  getStatusEffect, guardEffectIdForAbility, recoveryEffectIdForAbility, setCooldown, getCooldown,
  ABILITY_SIDESTEP_EFFECT_ID, type AbilityNodeProgress, type CombatEvent, type PacketId,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { refreshAbilityNodeRuntime, updateAbilityNodePulses } from '../src/systems/combat/abilityNodes';
import { updateCombatState } from '../src/systems/combat/engine/combatState';
import { updateWards } from '../src/systems/defense/barrier/wards';
import { runMonsterAttack } from '../src/systems/combat/engine/combat';
import { requestManualAbilityUse } from '../src/systems/player/abilities/abilityFiring';
import { abilityCooldownKey } from '../src/systems/player/abilities/abilityCooldowns';
import { detachComponent } from '../src/ecs/markerHelpers';
import { applyStun } from '../src/systems/combat/status/stun';
import { BRAMBLE_EFFECT_ID } from '../src/systems/player/abilities/abilityBramble';

const NODE = 'node-5-5';
initCombatSystems();

function slices(id: string, abilityId: string, nodes: AbilityNodeProgress): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      shards: {}, capstones: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 4, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [abilityId], attunedAbilities: { techniques: [], guards: [abilityId] },
      abilityNodes: { [abilityId]: nodes },
      knownStances: [], equippedStances: { default: null }, activeStance: null, knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
  };
}

function windowUp(player: PlayerEntity, abilityId: string): boolean {
  const kind = ABILITY_DATABASE.get(abilityId)!.ranks[0].effect.kind;
  const id = kind === 'damage-reduction' ? guardEffectIdForAbility(abilityId)
    : kind === 'heal' ? recoveryEffectIdForAbility(abilityId)
    : kind === 'bramble' ? BRAMBLE_EFFECT_ID
    : kind === 'dodge-window' ? ABILITY_SIDESTEP_EFFECT_ID : undefined;
  if (!id) return false;
  const e = getStatusEffect(player.tracksCombat, id);
  return !!e && e.remainingMs > 0;
}

function run(abilityId: string, lane: PacketId, mode: 'held' | 'duty'): { fired: number; casts: number; upMs: number } {
  const world = new World();
  const packet = abilityNodeId(abilityId, 'packet', lane);
  const id = `rate-${abilityId}-${lane}-${mode}`;
  const player = world.attachPlayerEntity(slices(id, abilityId, { owned: [packet], active: { packet } }), id);
  player.dealsDamage.attack = 100;
  player.hasHealth.maxHp = 100_000;
  player.hasHealth.hp = 50_000;
  refreshAbilityNodeRuntime(player);
  const monster = world.createMonster(NODE, 'plains-slime', { x: 430, y: 400 })!;
  monster.hasHealth.maxHp = 1e9; monster.hasHealth.hp = 1e9;
  world.takeNodeEvents(NODE);
  const offer = ABILITY_PACKET_OFFERS.get(abilityId)!.find(([l]) => l === lane)!;
  const fx = abilityNodeFx(lane, offer[1]);
  const effect = ABILITY_DATABASE.get(abilityId)!.ranks[0].effect.kind;

  let fired = 0; let casts = 0; let upMs = 0;
  const TICK = 100;
  for (let t = 0; t < 60_000; t += TICK) {
    const now = 10_000 + t;
    updateCombatState(world, TICK);
    updateWards(world, TICK);
    player.hasHealth.hp = 50_000; // alive, and something to mend
    const cs = player.tracksCombat;
    const wantCast = mode === 'held'
      ? !windowUp(player, abilityId)
      : getCooldown(cs, abilityCooldownKey(abilityId)) <= 0;
    if (wantCast) {
      if (mode === 'held') {
        setCooldown(cs, abilityCooldownKey(abilityId), 0);
        setCooldown(cs, 'ability.guard.window', 0);
      }
      if (effect === 'cleanse') {
        for (const s of ['antiheal', 'slow']) applyStatusEffect(cs, { id: s, maxStacks: 1, remainingMs: 6_000, refreshable: true, sourceId: 'tester', data: {} });
      }
      if (effect === 'break-free') applyStun(cs, 2_000, 'tester');
      const r = requestManualAbilityUse(world, player, abilityId, now);
      if (r.state === 'activated') casts++;
      detachComponent(world, player, 'queuesAbilities');
    }
    if (t % 1_500 === 0) runMonsterAttack(world, monster, player, now, 1, undefined, 40);
    updateAbilityNodePulses(world);
    if (windowUp(player, abilityId)) upMs += TICK;
    fired += world.takeNodeEvents(NODE).filter((e): e is Extract<CombatEvent, { kind: 'card-fx' }> =>
      e.kind === 'card-fx' && e.fx === fx && e.playerId === id).length;
  }
  return { fired, casts, upMs };
}

const rowsOut: string[] = [];
for (const abilityId of ['brace', 'bramble-guard', 'sidestep', 'endure', 'recuperate', 'second-wind', 'cleanse', 'break-free']) {
  const shape = ABILITY_FIRE_SHAPES.get(abilityId)!.fire;
  for (const [lane, payoff] of ABILITY_PACKET_OFFERS.get(abilityId)!) {
    const held = ['brace', 'bramble-guard', 'sidestep', 'endure', 'recuperate'].includes(abilityId) ? run(abilityId, lane, 'held') : undefined;
    const duty = run(abilityId, lane, 'duty');
    rowsOut.push([
      abilityId.padEnd(14), shape.padEnd(22), `${lane}/${payoff}`.padEnd(30),
      `held ${held ? String(held.fired).padStart(3) : '  -'}/min`,
      `duty ${String(duty.fired).padStart(3)}/min (casts ${duty.casts}, window up ${(duty.upMs / 1000).toFixed(1)} s)`,
    ].join('  '));
  }
}
console.log(rowsOut.join('\n'));
