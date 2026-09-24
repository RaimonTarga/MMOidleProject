import type { World } from '../../../world/World';
import type { PlayerEntity, MonsterEntity } from '../../../ecs/entity';
import { NODE_REGISTRY } from '../../../world/nodeRegistry';

export type HeatManagementState = 'normal' | 'requested' | 'waiting' | 'resumed';
interface Request { targets: Set<string>; state: HeatManagementState }
const requests = new WeakMap<PlayerEntity, Request>();

function enabled(player: PlayerEntity): boolean {
  const node = NODE_REGISTRY.get(player.hasPosition.nodeId);
  return !!node && node.biomeGroup === 'volcanic' && !node.isDungeon
    && !player.isDead && player.hasHealth.hp > 0 && player.usesAutocombat.auto
    && !player.hasManualMoveIntent && !player.hasSummonerCommand
    && player.tracksProgression.runesEquipped.some(r => r.actionId === 'wait-it-out'
      && r.conditionId === 'always' && r.waitOutMode === 'heat-managed');
}

/** Include the whole formation; never manufacture disengagement by clearing targets. */
export function heatEngagementTargets(world: World, player: PlayerEntity): Set<string> {
  const targets = new Set<string>();
  const minions = [...world.minionEntities].filter(m => m.isMinion.ownerPlayerId === player.isPlayer.id
    && m.hasHealth.hp > 0 && m.hasPosition.nodeId === player.hasPosition.nodeId);
  const ids = new Set(minions.map(m => m.isMinion.id));
  if (player.hasAttackTarget) targets.add(player.hasAttackTarget.targetId);
  if (player.isChanneling) targets.add(player.isChanneling.targetId);
  for (const m of minions) {
    if (m.hasAttackTarget) targets.add(m.hasAttackTarget.targetId);
    if (m.controlsMinion.currentTargetId) targets.add(m.controlsMinion.currentTargetId);
  }
  for (const m of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    const a = m.hasAggroTarget;
    if (a && (a.targetKind === 'player' ? a.targetId === player.isPlayer.id : ids.has(a.targetId))) targets.add(m.isMonster.id);
  }
  for (const id of targets) {
    const m = world.getMonsterEntity(id);
    if (!m || m.hasHealth.hp <= 0 || m.hasPosition.nodeId !== player.hasPosition.nodeId) targets.delete(id);
  }
  return targets;
}

export function updateHeatManagement(world: World, player: PlayerEntity): void {
  if (!enabled(player)) { requests.delete(player); return; }
  const heat = player.tracksCombat.statusEffects.find(e => e.id === 'volcanic-heat')?.stacks ?? 0;
  let request = requests.get(player);
  if (heat <= 10) {
    if (request) requests.set(player, { targets: new Set(), state: 'resumed' });
    return;
  }
  if ((!request || request.state === 'resumed') && heat < 25) return;
  if (!request || request.state === 'resumed') request = { targets: new Set(), state: 'requested' };
  for (const id of heatEngagementTargets(world, player)) request.targets.add(id);
  for (const id of request.targets) {
    const m = world.getMonsterEntity(id);
    if (!m || m.hasHealth.hp <= 0 || m.hasPosition.nodeId !== player.hasPosition.nodeId) request.targets.delete(id);
  }
  request.state = request.targets.size ? 'requested' : 'waiting';
  requests.set(player, request);
}

export function heatManagementState(player: PlayerEntity): HeatManagementState {
  return enabled(player) ? requests.get(player)?.state ?? 'normal' : 'normal';
}

/** A narrow acquisition veto. Existing targets and newly attacking threats remain legal. */
export function heatAllowsTarget(world: World, player: PlayerEntity, monster: MonsterEntity): boolean {
  const state = heatManagementState(player);
  if (state !== 'requested' && state !== 'waiting') return true;
  return requests.get(player)!.targets.has(monster.isMonster.id)
    || heatEngagementTargets(world, player).has(monster.isMonster.id);
}

/** Passive receipts: each phase owns its snapshot; later threats never rewrite it. */
export interface HeatDecisionReceipt {
  tick: number;
  serverTime: number;
  phase: 'rune-derivation';
  state: HeatManagementState;
  heat: number;
  engagementTargetIds: string[];
  waitHold: boolean;
  recoveryHold: boolean;
}
export interface HeatActionReceipt {
  tick: number;
  serverTime: number;
  phase: 'auto-target';
  action: string;
  targetId: string | null;
  engagementTargetIds: string[];
}
const decisions = new WeakMap<PlayerEntity, HeatDecisionReceipt>();
const actions = new WeakMap<PlayerEntity, HeatActionReceipt>();
export function recordHeatDecision(world: World, player: PlayerEntity, now: number, waitHold: boolean, recoveryHold: boolean): void {
  actions.delete(player);
  if (!enabled(player)) { decisions.delete(player); return; }
  decisions.set(player, {
    tick: world.tickCounter, serverTime: now, phase: 'rune-derivation',
    state: heatManagementState(player),
    heat: player.tracksCombat.statusEffects.find(e => e.id === 'volcanic-heat')?.stacks ?? 0,
    engagementTargetIds: [...heatEngagementTargets(world, player)], waitHold, recoveryHold,
  });
}
export function recordHeatAction(world: World, player: PlayerEntity, now: number, action: string, targetId: string | null = null): void {
  if (!decisions.has(player)) return;
  actions.set(player, { tick: world.tickCounter, serverTime: now, phase: 'auto-target',
    action, targetId, engagementTargetIds: [...heatEngagementTargets(world, player)] });
}
export function heatDecisionReceipts(player: PlayerEntity) {
  return { decision: decisions.get(player) ?? null, actionSelection: actions.get(player) ?? null };
}
