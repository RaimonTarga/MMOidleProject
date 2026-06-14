import {
  dotElementForPlayer,
  MONSTER_DATABASE,
  type DamageElement,
  type DotPathElement,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";

/**
 * Queue a `dot-tick` combat event for a DoT tick landing on a monster. The client
 * uses it purely as a color/glyph style hint for the HP-delta damage number — the
 * amount displayed is still the HP delta, so non-elemental DoTs simply omit this.
 */
export function pushDotTickEvent(
  world: World,
  monster: MonsterEntity,
  element: DamageElement,
  amount: number,
): void {
  if (amount <= 0) return;
  world.pushEvent(monster.hasPosition.nodeId, {
    kind: "dot-tick",
    targetId: monster.isMonster.id,
    targetPos: { ...monster.hasPosition.current },
    amount: Math.round(amount),
    element,
  });
}

/** DoT-class element of the source player (falls back to poison if unresolved). */
export function dotElementForSource(world: World, sourceId: string): DamageElement {
  const player = world.getPlayerEntity(sourceId);
  if (!player) return "poison";
  return dotElementForPlayer(
    player.usesSkills.passives,
    player.usesSkills.selectedSubVariant,
  );
}

/** Queue a `dot-tick` style hint for a DoT tick landing on a player. */
export function pushPlayerDotTickEvent(
  world: World,
  player: PlayerEntity,
  element: DamageElement,
  amount: number,
): void {
  if (amount <= 0) return;
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "dot-tick",
    targetId: player.isPlayer.id,
    targetPos: { ...player.hasPosition.current },
    amount: Math.round(amount),
    element,
  });
}

/** Element of a monster's DoT (from its definition; falls back to poison). */
export function monsterDotElement(world: World, sourceId: string): DamageElement {
  const monster = world.getMonsterEntity(sourceId);
  if (!monster) return "poison";
  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  return def?.dotEffect?.element ?? "poison";
}
