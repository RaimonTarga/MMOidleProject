import type { World } from "../../../world/World";
import {
  PLATING_SHRED_EFFECT_ID,
  pruneStatusEffects,
  tickCooldowns,
  tickStatusEffectDurations,
} from "@mmo-idle/shared";
import { updatePlayerControlLockouts } from "../status/playerControlLockout";
import { holdFesteringDots } from "../keystones/festering";

function pruneEndedEncounterCorrosion(world: World): void {
  for (const player of world.livePlayers) {
    pruneStatusEffects(player.tracksCombat, effect => {
      if (effect.id !== PLATING_SHRED_EFFECT_ID) return false;
      const source = effect.sourceId
        ? world.getMonsterEntity(effect.sourceId)
        : undefined;
      return (
        !source ||
        !source.hasAggroTarget ||
        source.hasPosition.nodeId !== player.hasPosition.nodeId
      );
    });
  }
}

/**
 * Run at the top of every world tick so cooldowns and status effect durations are
 * decremented before any combat or AI system reads them.
 */
export function updateCombatState(world: World, dt: number): void {
  // FESTERING (design §4, the Affliction keystone) gives this tick's `dt` back to
  // the DoTs it holds, BEFORE the decay below takes it — the only honest way to
  // say "the duration does not tick down", since the decay is one loop over a
  // bare `TracksCombat` and prunes at zero, so a refund afterwards would arrive
  // to find the effect gone.
  holdFesteringDots(world, dt);
  for (const e of world.livePlayers) {
    tickCooldowns(e.tracksCombat, dt);
    tickStatusEffectDurations(e.tracksCombat, dt);
  }
  for (const e of world.monsterEntities) {
    tickCooldowns(e.tracksCombat, dt);
    tickStatusEffectDurations(e.tracksCombat, dt);
  }
  // Plating corrosion is permanent while its boss encounter is active, but it
  // must not follow the player into a later pull or another node.
  pruneEndedEncounterCorrosion(world);
  updatePlayerControlLockouts(world);
}
