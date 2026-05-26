import { type Vec2 } from "@mmo-idle/shared";
import {
  registerCombatListener,
  type CombatContext,
} from "../../../../../combat/engine/combatPipeline";
import {
  isEmpoweredAttack,
  setEmpoweredAttack,
} from "../../../../../combat/engine/empoweredAttacks";
import { markSliceDirty } from "../../../../../../ecs/dirtyHelpers";
import { detachComponent } from "../../../../../../ecs/markerHelpers";
import { stopEntity } from "../../../../../world/movement";
import { NODE_REGISTRY } from "../../../../../../world/nodeRegistry";
import type { World } from "../../../../../../world/World";
import type { MonsterEntity, PlayerEntity } from "../../../../../../ecs/entity";
import { hasPassive } from "../core/helpers";
import {
  FLASH_OFFSET_MAX_PX,
  FLASH_OFFSET_MIN_PX,
  FLASH_OVERSHOOT_SPREAD_RAD,
} from "../core/constants";

const NODE_MARGIN = 40;
const FLASH_CLIENT_EFFECT = "flash-teleport";

function clampToNode(nodeId: string, pos: Vec2): Vec2 {
  const node = NODE_REGISTRY.get(nodeId);
  if (!node) return pos;
  return {
    x: Math.max(NODE_MARGIN, Math.min(node.width - NODE_MARGIN, pos.x)),
    y: Math.max(NODE_MARGIN, Math.min(node.height - NODE_MARGIN, pos.y)),
  };
}

function pushClientEffect(ctx: CombatContext, effectId: string): void {
  const effects = ctx.metadata["clientEffects"];
  if (Array.isArray(effects)) {
    effects.push(effectId);
    return;
  }
  ctx.metadata["clientEffects"] = [effectId];
}

function tryFlashTeleport(
  world: World,
  player: PlayerEntity,
  monster: MonsterEntity,
  ctx: CombatContext,
): void {
  const playerPos = player.hasPosition.current;
  const monsterPos = monster.hasPosition.current;
  const dx = monsterPos.x - playerPos.x;
  const dy = monsterPos.y - playerPos.y;
  const approachAngle =
    Math.abs(dx) + Math.abs(dy) > 0.001
      ? Math.atan2(dy, dx)
      : Math.random() * Math.PI * 2;
  const angle =
    approachAngle + (Math.random() - 0.5) * FLASH_OVERSHOOT_SPREAD_RAD;
  const radius =
    FLASH_OFFSET_MIN_PX +
    Math.random() * (FLASH_OFFSET_MAX_PX - FLASH_OFFSET_MIN_PX);
  const landing = clampToNode(player.hasPosition.nodeId, {
    x: monsterPos.x + Math.cos(angle) * radius,
    y: monsterPos.y + Math.sin(angle) * radius,
  });

  player.hasPosition.current = landing;
  markSliceDirty(world, player, "hasPosition");
  stopEntity(world, player);
  pushClientEffect(ctx, FLASH_CLIENT_EFFECT);
}

/**
 * Energy T3 beforeAttack listener.
 *
 *   1. Suppress the standard empowered multiplier for paths with a custom
 *      discharge formula (Polarity Decay, Cascading Induction,
 *      Superconducting Mass, Capacitor Shunt).
 *   2. Singularity Execute: force discharge early if the target would die
 *      from the projected empowered damage.
 *   3. Flash: teleport into melee range near the target before the hit resolves.
 */
export function registerBeforeAttack(): void {
  registerCombatListener("beforeAttack", (ctx, world) => {
    if (ctx.attackerType !== "player") return;

    const entity = ctx.attacker;
    if (!entity?.usesEnergy) return;

    const player = entity;
    const passives = player.usesSkills.passives;

    if (
      isEmpoweredAttack(entity) &&
      (hasPassive(player, "energy.polarity-decay") ||
        hasPassive(player, "energy.cascading-induction") ||
        hasPassive(player, "energy.superconducting-mass") ||
        hasPassive(player, "energy.capacitor-shunt"))
    ) {
      ctx.metadata["suppressEmpoweredMult"] = true;
    }

    if (hasPassive(player, "energy.flash") && ctx.defenderType === "monster") {
      if (player.isMoving || player.hasManualMoveIntent) {
        ctx.cancelled = true;
        return;
      }
      detachComponent(world, player, "hasEmpoweredAttack");
      tryFlashTeleport(world, player, ctx.defender, ctx);
      return;
    }

    if (
      hasPassive(player, "energy.singularity-execute") &&
      ctx.defenderType === "monster" &&
      !isEmpoweredAttack(entity)
    ) {
      const empMult = passives["energy.empowered-mult"] ?? 6.0;
      const projected = Math.floor(player.dealsDamage.attack * empMult);
      if (ctx.defender.hasHealth.hp <= projected) {
        setEmpoweredAttack(world, entity);
        console.log(
          `[SingularityExec] ${player.isPlayer.id}: execute — ${ctx.defender.hasHealth.hp} HP <= ${projected} projected`,
        );
      }
    }
  });
}
