/**
 * DISENGAGE — **Vanish**. "Breaking contact drops you from every nearby
 * monster's aggro until your next hit." (design §22.4; delivery: the owner)
 *
 * THE SEAMS.
 *  - THE BREAK: Disengage's resolution (the reposition branch hands it the
 *    departure point). Every monster within Disengage's reach of the point the
 *    player LEFT whose aggro is on the player drops it — `setAggroTarget(null)`
 *    and its attack target with it — and the player is marked (`vanishMark.ts`).
 *    A pack hunts as one, so a dropped member's pack drops the player too (its
 *    coordinator would otherwise hand the target straight back from the members
 *    outside reach).
 *  - WHILE IT STANDS: monster acquisition (`selectMonsterAggroCandidate`, the
 *    pull scan every ordinary monster and pack coordinator acquires through)
 *    skips a vanished player. What the player's own damage does is untouched: a
 *    body they hurt still turns on them, as it always does.
 *  - THE NEXT HIT: the player's next landed attack (`onHit`, their own swing —
 *    not a summon's blow) clears the mark. So does the out-of-combat reset
 *    (`onCombatEnded`), which bounds a mark the player never spends: Vanish is
 *    for breaking contact in a fight, never a stealth walk across the map — the
 *    vanish itself marks the player engaged, so that reset always comes.
 *
 * BOSSES (the designer's to confirm): a boss, a boss's add and a dungeon guardian
 * neither drop the player nor are kept from finding them (`vanishMark.ts`) —
 * their targeting runs on a script's clock, and a target pulled out from under a
 * script is how an encounter resets or wedges.
 *
 * Owner-delivered (§22.10): it is the player who vanishes, on a Conduit too —
 * the summons fight on and stay in the monsters' sight.
 *
 * No number: the reach is Disengage's own (`reach.ts`), the mark has no clock.
 * One `card-fx` per vanish, left at the departure point (the fading outline).
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  setFlag,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { registerCombatListener } from '../../engine/combatPipeline';
import { setAggroTarget, setAttackTarget } from '../../ai/targeting';
import { markEngaged } from '../../ai/engagement';
import { abilityEngagementRange } from '../../../player/abilities/abilityTargeting';
import { defineAbilityKeystone, pushAbilityKeystoneFx } from './registry';
import { VANISH_FLAG, monsterSeesThroughVanish, playerVanished } from './vanishMark';

const ID = 'vanish';

const aggroedOn = (monster: MonsterEntity, player: PlayerEntity): boolean =>
  monster.hasAggroTarget?.targetKind === 'player' && monster.hasAggroTarget.targetId === player.isPlayer.id;

/** Drop `player` from `monster`'s aggro, and its swing with it. */
function drop(world: World, monster: MonsterEntity, player: PlayerEntity, now: number): void {
  setAggroTarget(world, monster, null, now);
  if (monster.hasAttackTarget?.targetId === player.isPlayer.id) setAttackTarget(world, monster, null);
}

export const VANISH_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'Disengage\'s resolution clears setAggroTarget on every monster in Disengage\'s reach of the departure point (and their packs) and marks the player; selectMonsterAggroCandidate skips a marked player; the next landed hit or the out-of-combat reset clears the mark; bosses, adds and dungeon guardians are exempt',
  onResolved: (world, player, ability, site) => {
    const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
    if (!definition || ability.id !== definition.abilityId) return;
    const from = site.from ?? player.hasPosition.current;
    // The player as they stood at the point they left: the body reach is measured from.
    const departed = { hasPosition: { ...player.hasPosition, current: { ...from } }, hasHitbox: player.hasHitbox };
    const reach = abilityEngagementRange(player, ability);
    const now = Date.now();
    // Walked twice (the break, then the packs): taken once as a list.
    const node = [...world.monsterEntitiesInNode(player.hasPosition.nodeId)];

    const packs = new Set<string>();
    for (const monster of node) {
      if (monsterSeesThroughVanish(monster) || !aggroedOn(monster, player)) continue;
      if (!world.collision.canReach(departed, monster, reach)) continue;
      drop(world, monster, player, now);
      if (monster.inPack) packs.add(monster.inPack.packId);
    }
    // A pack hunts as one: its members out of reach let go too, and its shared
    // target is cleared so the coordinator does not hand the player straight back.
    for (const monster of node) {
      if (!monster.inPack || !packs.has(monster.inPack.packId) || monsterSeesThroughVanish(monster)) continue;
      if (aggroedOn(monster, player)) drop(world, monster, player, now);
      const coordination = monster.inPack.coordination;
      if (coordination?.target?.kind === 'player' && coordination.target.id === player.isPlayer.id) {
        delete coordination.target;
      }
    }

    setFlag(player.tracksCombat, VANISH_FLAG, true);
    // Breaking contact is a fight's beat: the engagement clock restarts here, so
    // the out-of-combat reset that ends an unspent mark is always coming.
    markEngaged(world, player, now);
    pushAbilityKeystoneFx(world, player, definition, { pos: from });
  },
  register: () => {
    // The player's next landed attack ends it. Their own swing: a summon's blow
    // is the formation fighting on, not the owner coming out of hiding.
    registerCombatListener('onHit', (ctx) => {
      if (ctx.attackerType !== 'player' || ctx.formation?.side === 'summon') return;
      if (ctx.metadata['chaoticMiss']) return; // a whiff is not a hit
      if (playerVanished(ctx.attacker)) setFlag(ctx.attacker.tracksCombat, VANISH_FLAG, false);
    });
  },
  onCombatEnded: (_world, player) => {
    if (playerVanished(player)) setFlag(player.tracksCombat, VANISH_FLAG, false);
  },
});
