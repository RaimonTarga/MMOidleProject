import {
  dotElementForPlayer,
  MONSTER_DATABASE,
  monsterDotFlavorByCode,
  resolveMonsterDotFlavor,
  type StatusEffect,
  type DamageElement,
  type DotPathElement,
  type DotTickFx,
  type DotTickSourceType,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";

interface DotTickEventOptions {
  sourceType?: DotTickSourceType;
  fx?: DotTickFx;
}

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
  options: DotTickEventOptions = {},
): void {
  if (amount <= 0) return;
  world.pushEvent(monster.hasPosition.nodeId, {
    kind: "dot-tick",
    targetId: monster.isMonster.id,
    targetPos: { ...monster.hasPosition.current },
    amount: Math.round(amount),
    element,
    sourceType: options.sourceType ?? "class",
    ...(options.fx ? { fx: options.fx } : {}),
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
  options: DotTickEventOptions = {},
): void {
  if (amount <= 0) return;
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "dot-tick",
    targetId: player.isPlayer.id,
    targetPos: { ...player.hasPosition.current },
    amount: Math.round(amount),
    element,
    sourceType: options.sourceType ?? "monster",
  });
}

/** Element of a monster's DoT (from its definition; falls back to poison). */
export function monsterDotElement(
  world: World,
  sourceId: string,
  effect?: StatusEffect,
): DamageElement {
  if (effect) return monsterDotFlavorByCode(effect.data["flavorCode"]).element;
  const monster = world.getMonsterEntity(sourceId);
  if (!monster) return "poison";
  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  const dotEffect = monster.scriptsBoss?.dotEffectOverride ?? def?.dotEffect;
  return resolveMonsterDotFlavor({
    biome: def?.biome,
    attackStyle: def?.attackStyle,
    element: dotEffect?.element,
  }).element;
}
