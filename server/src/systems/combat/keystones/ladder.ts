/**
 * CONTROL — **Ladder**. "Hitting a target that carries the player's slow applies
 * a root; hitting one that carries the player's root applies a stun; each step
 * once per target per engagement; stun ladder durations." (design §4)
 *
 * THE SEAM. `applyMonsterRoot` and `applyStun` — the two functions that own the
 * middle and top rungs of the control ladder the ability tree already climbs
 * (`status/monsterControl.ts`: slow = moves slower, root = cannot move, stun =
 * cannot act). The keystone adds no fourth rung and invents no control: it lets
 * the Control lane's own slow, which it already applies as a payoff, climb.
 *
 * THE DURATIONS are the ladder's, from the authored table: `ladderRootMs` is
 * Binding Strike's own length, `ladderStunMs` is the `stun` payoff's — an item
 * must not out-stun the ability whose entire cost is that it stuns.
 *
 * ONCE PER STEP PER TARGET PER ENGAGEMENT. The latch is a flag on the MONSTER,
 * keyed by player, exactly like the per-body opener latch in `lineageCards.ts`:
 * monster combat state is ephemeral, node freeze/thaw takes the flag with it, and
 * nothing about it is persisted — so "per engagement" needs no clock and no
 * cleanup. Without the latch a slowed target would be re-rooted by every hit,
 * which is a permanent root, and a rooted one re-stunned, which is a chain-lock.
 *
 * Both rungs early-return on `evadeBlocksDebuffs(ctx)` like every other on-hit
 * applier, and both go through the appliers that refuse a control-immune boss, so
 * a plated boss shows nothing rather than a root its pattern then ignores.
 */
import {
  ABILITY_ROOT_EFFECT_ID,
  MONSTER_ROOT_STATUS_IDS,
  MONSTER_SLOW_STATUS_IDS,
  getFlag,
  getStatusEffect,
  lineageUnit,
  setFlag,
  type PacketId,
  type StatusEffect,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { registerCombatListener } from '../engine/combatPipeline';
import { applyMonsterRoot } from '../status/monsterControl';
import { applyStun } from '../status/stun';
import { monsterIgnoresControl } from '../status/controlImmunity';
import { evadeBlocksDebuffs } from '../../defense/mitigation/evasion';
import { defineKeystone, keystoneActive, pushKeystoneFx } from './registry';

const LANE: PacketId = 'control';

/** Per-player, per-rung latch on the monster. */
const rungFlag = (rung: 'root' | 'stun', playerId: string): string =>
  `keystone.ladder.${rung}.${playerId}`;

export const LADDER_KEYSTONE = defineKeystone({
  id: 'ladder',
  lane: LANE,
  seam: 'an onHit listener climbing applyMonsterRoot then applyStun, latched per target on the monster',
  register: () => {
    registerCombatListener('onHit', (ctx, world) => {
      if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
      const player = ctx.attacker;
      if (!keystoneActive(player, LANE)) return;
      const target = ctx.defender;
      if (target.hasHealth.hp <= 0) return;
      // A dodge suppresses the player's debuffs, and a rung is a debuff.
      if (evadeBlocksDebuffs(ctx)) return;
      if (monsterIgnoresControl(target)) return;

      climb(world, player, target);
    });
  },
});

/**
 * Take the one step this hit has earned, highest first.
 *
 * The STUN step is checked before the ROOT step so a hit into an already-rooted
 * target climbs rather than re-reading the slow underneath it (a root does not
 * remove the slow that earned it, so both are on the target at once). One step
 * per hit either way: the top rung returns before the bottom one is considered.
 */
function climb(world: World, player: PlayerEntity, target: MonsterEntity): void {
  const playerId = player.isPlayer.id;
  const cs = target.tracksCombat;

  // Each rung is read across every id that carries it (design §26.2): the
  // Control lean's slow is "Hobbled" and the Control payload's root "Pinned", on
  // their own ids, and both are still this player's slow and root to climb from.
  if (ownedAny(target, MONSTER_ROOT_STATUS_IDS, playerId)) {
    if (getFlag(cs, rungFlag('stun', playerId))) return; // already climbed this far
    if (!applyStun(cs, lineageUnit('ladderStunMs'), playerId)) return;
    setFlag(cs, rungFlag('stun', playerId), true);
    pushKeystoneFx(world, player, LANE, { target, stacks: 2 });
    return;
  }

  if (ownedAny(target, MONSTER_SLOW_STATUS_IDS, playerId)) {
    if (getFlag(cs, rungFlag('root', playerId))) return;
    applyMonsterRoot(world, target, lineageUnit('ladderRootMs'), playerId);
    // `applyMonsterRoot` refuses a control-immune target silently, so confirm the
    // rung actually landed before latching it or drawing it.
    if (!ownedEffect(target, ABILITY_ROOT_EFFECT_ID, playerId)) return;
    setFlag(cs, rungFlag('root', playerId), true);
    pushKeystoneFx(world, player, LANE, { target, stacks: 1 });
  }
}

/**
 * A live control effect on `target` that THIS player put there.
 *
 * Ownership by `sourceId`, the rule kill credit and the DoT inventory already
 * use: in a party you climb your own ladder and not your ally's.
 */
function ownedEffect(
  target: MonsterEntity,
  id: string,
  playerId: string,
): StatusEffect | undefined {
  const effect = getStatusEffect(target.tracksCombat, id);
  if (!effect || effect.remainingMs === 0) return undefined;
  return effect.sourceId === playerId ? effect : undefined;
}

/** {@link ownedEffect} across every id of one control rung. */
function ownedAny(target: MonsterEntity, ids: readonly string[], playerId: string): boolean {
  return ids.some((id) => ownedEffect(target, id, playerId) !== undefined);
}
