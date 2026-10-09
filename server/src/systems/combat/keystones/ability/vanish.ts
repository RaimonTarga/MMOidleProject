/**
 * DISENGAGE — **Vanish**. "Breaking contact drops you from every nearby
 * monster's aggro until your next hit." (design §22.4; delivery: the owner)
 *
 * THE SEAMS.
 *  - THE BREAK: Disengage's resolution (the reposition branch hands it the
 *    departure point). Every monster within Disengage's reach of the point the
 *    player LEFT whose aggro is on the player drops it — `setAggroTarget(null)`
 *    and its attack target with it, and whatever it was winding up at them
 *    (`abortMonsterCast`; a boss's running pattern ends as on any target loss) —
 *    and the player is marked (`vanishMark.ts`). A pack hunts as one, so a
 *    dropped member's pack drops the player too (its coordinator would otherwise
 *    hand the target straight back from the members outside reach).
 *  - WHILE IT STANDS: nothing acquires a vanished player — the pull scan
 *    (`selectMonsterAggroCandidate`, every ordinary monster, boss and pack
 *    coordinator), a boss handing its target to its adds, a dungeon forcing its
 *    monsters' aggro. What the player's own damage does is untouched: a body they
 *    hurt still turns on them, as it always does.
 *  - THE NEXT HIT: the player's next landed attack (`onHit`, their own swing —
 *    not a summon's blow) clears the mark. So does the out-of-combat reset
 *    (`onCombatEnded`), which bounds a mark the player never spends: Vanish is
 *    for breaking contact in a fight, never a stealth walk across the map — the
 *    vanish itself marks the player engaged, so that reset always comes.
 *
 * BOSSES, ADDS AND DUNGEONS (design §22.12: Vanish works on them too). They drop
 * the player like anything else, but an encounter must neither reset nor wedge,
 * so a dropped ENCOUNTER body (`encounterMonster`) HOLDS for the player
 * (`holdsForVanished`): the AI keeps it where it stands with its ramp, the
 * out-of-combat regen passes it by, its boss script runs on (`isBossEngaged`
 * never comes off), and it may still take any other target in reach. The `tick`
 * below ends the hold: when the mark clears it takes the player back in the SAME
 * aggro session (so pattern clocks and openers carry on, nothing restarts); a
 * player who left the node or died releases it to the ordinary rules; any target
 * it found meanwhile ends it. Its adds hold with it (`syncBossSpawnedAddTarget`).
 *
 * THE HOLD'S CLOCK (design §22.13). A hold ends on a clock even if the player
 * never attacks: something else can keep them in combat (another monster out of
 * Vanish's reach), so the out-of-combat reset never comes. Once a hold has lasted
 * the out-of-combat reset window (`outOfCombatResetMs`, the very window
 * `updateCombatTransitions` ends a fight on) it takes the player back in the same
 * aggro session, as a mark-clear does, and clears the player's mark so every
 * other monster sees them again.
 *
 * Owner-delivered (§22.10): it is the player who vanishes, on a Conduit too —
 * the summons fight on and stay in the monsters' sight.
 *
 * No number: the reach is Disengage's own (`reach.ts`); the mark has no clock of
 * its own, and the hold's is the out-of-combat reset window.
 * One `card-fx` per vanish, left at the departure point (the fading outline).
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  setFlag,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { attachComponent, detachComponent } from '../../../../ecs/markerHelpers';
import { registerCombatListener } from '../../engine/combatPipeline';
import { abortMonsterCast } from '../../engine/combat';
import { setAggroTarget, setAttackTarget } from '../../ai/targeting';
import { markEngaged, outOfCombatResetMs } from '../../ai/engagement';
import { endPattern } from '../../ai/bossPatterns';
import { abilityEngagementRange } from '../../../player/abilities/abilityTargeting';
import { defineAbilityKeystone, pushAbilityKeystoneFx } from './registry';
import { VANISH_FLAG, encounterMonster, playerVanished } from './vanishMark';

const ID = 'vanish';

const aggroedOn = (monster: MonsterEntity, player: PlayerEntity): boolean =>
  monster.hasAggroTarget?.targetKind === 'player' && monster.hasAggroTarget.targetId === player.isPlayer.id;

/**
 * Drop `player` from `monster`'s aggro, with its swing, its wind-up and (a boss)
 * the pattern it was running at them. An encounter body holds for them instead of
 * going home.
 */
function drop(world: World, monster: MonsterEntity, player: PlayerEntity, now: number): void {
  const sinceMs = monster.hasAggroTarget?.sinceMs ?? now;
  if (monster.runsBossPattern?.targetId === player.isPlayer.id) endPattern(world, monster, 'target-lost', now);
  abortMonsterCast(world, monster);
  setAggroTarget(world, monster, null, now);
  if (monster.hasAttackTarget?.targetId === player.isPlayer.id) setAttackTarget(world, monster, null);
  if (encounterMonster(monster)) {
    attachComponent(world, monster, 'holdsForVanished', { playerId: player.isPlayer.id, sinceMs, heldMs: 0 });
  }
}

/** Put a re-acquired target back in the aggro session the hold began in (server-only slice). */
function resumeSession(monster: MonsterEntity, sinceMs: number): void {
  if (monster.hasAggroTarget) monster.hasAggroTarget.sinceMs = sinceMs;
}

export const VANISH_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'Disengage\'s resolution clears setAggroTarget on every monster in Disengage\'s reach of the departure point (and their packs), aborting its wind-up or pattern, and marks the player; nothing acquires a marked player; a dropped boss, add or dungeon monster holds (holdsForVanished) and takes the player back in the same aggro session when the next landed hit or the out-of-combat reset clears the mark, or once the hold has lasted the out-of-combat reset window',
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
      if (!aggroedOn(monster, player)) continue;
      if (!world.collision.canReach(departed, monster, reach)) continue;
      drop(world, monster, player, now);
      if (monster.inPack) packs.add(monster.inPack.packId);
    }
    // A pack hunts as one: its members out of reach let go too, and its shared
    // target is cleared so the coordinator does not hand the player straight back.
    for (const monster of node) {
      if (!monster.inPack || !packs.has(monster.inPack.packId)) continue;
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
  // Every hold, every tick (live or not: a hold outlives a swapped-out verb).
  tick: (world, dt) => {
    const now = Date.now();
    for (const monster of [...world.vanishHoldingMonsters]) {
      const hold = monster.holdsForVanished;
      // It found another fight meanwhile (a summon, another player): that ends it.
      if (monster.hasAggroTarget) {
        detachComponent(world, monster, 'holdsForVanished');
        continue;
      }
      const player = world.getPlayerEntity(hold.playerId);
      // Gone from the fight: the ordinary rules take it, exactly as when a target leaves.
      if (!player || player.isDead || player.hasPosition.nodeId !== monster.hasPosition.nodeId) {
        detachComponent(world, monster, 'holdsForVanished');
        continue;
      }
      if (playerVanished(player)) {
        hold.heldMs += dt;
        if (hold.heldMs < outOfCombatResetMs(player)) continue; // still hidden: hold
        // The hold ran the out-of-combat reset window (design §22.13): the mark
        // ends here too, so every other monster sees the player again.
        setFlag(player.tracksCombat, VANISH_FLAG, false);
      }
      // The mark is gone: the fight resumes, it does not restart — the same session.
      setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, now);
      resumeSession(monster, hold.sinceMs);
      detachComponent(world, monster, 'holdsForVanished');
    }
  },
  onCombatEnded: (_world, player) => {
    if (playerVanished(player)) setFlag(player.tracksCombat, VANISH_FLAG, false);
  },
});
