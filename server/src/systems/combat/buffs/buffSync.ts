import {
  formatLogNumber,
  getStatusEffect,
  isMonsterDotStatusEffectId,
  MONSTER_DATABASE,
  monsterDotFlavorByCode,
  resolveMonsterDotDebuff,
  FROST_RAMP_EFFECT_ID,
  frostRampMoveSlowPct,
  frostRampAtkSlowPct,
  type StatusEffect,
  type WorldLogActor,
  type PlayerBuff,
  type BuffId,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import { recordWorldLogEvent } from "../../../world/worldLog";
import { actorFromPlayer } from "../../../world/worldLogActors";
import { collectMechanicBuffs } from "../../classes/registry";
import { DEFENSE_BUFFS } from "../../defense";
import { WEAPON_BUFFS } from "../damage/weaponEffects";
import { MOBILITY_BUFFS } from "../../world/mobility/mobilityBoots";
import { defineBuff, type BuffDescriptor, type BuffProjectionContext } from "./descriptor";

const DEBUFF_BUFFS = [
  defineBuff(
    "debuff-slow",
    ({ playerCs, world }) => {
      if (!playerCs) return null;
      const slow = getStatusEffect(playerCs, "slow");
      if (!slow || (slow.data["speedMult"] ?? 1) <= 0) return null;
      const totalMs = slow.data["totalMs"] ?? slow.remainingMs;
      const source = world.getMonsterEntity(slow.sourceId);
      const speedPct = Math.round((slow.data["speedMult"] ?? 1) * 100);
      return {
        id: "debuff-slow",
        label: "SLOW",
        stacks: slow.stacks,
        durationPct:
          totalMs > 0 && slow.remainingMs > 0
            ? (slow.remainingMs / totalMs) * 100
            : -1,
        speedMult: Math.max(0, slow.data["speedMult"] ?? 1),
        color: "#55aaff",
        logSourceName: source?.isMonster.name ?? "Monster debuff",
        logSourceSide: "enemy",
        logDetail: `movement speed ${speedPct}%`,
      };
    },
    { category: "neutral", shape: "diamond", color: "#55aaff", label: "SLOW" },
  ),
  defineBuff(
    "debuff-root",
    ({ playerCs, world }) => {
      if (!playerCs) return null;
      const slow = getStatusEffect(playerCs, "slow");
      if (!slow || (slow.data["speedMult"] ?? 1) > 0) return null;
      const totalMs = slow.data["totalMs"] ?? slow.remainingMs;
      const source = world.getMonsterEntity(slow.sourceId);
      return {
        id: "debuff-root",
        label: "ROOT",
        stacks: slow.stacks,
        durationPct:
          totalMs > 0 && slow.remainingMs > 0
            ? (slow.remainingMs / totalMs) * 100
            : -1,
        speedMult: 0,
        color: "#aa66ff",
        logSourceName: source?.isMonster.name ?? "Monster debuff",
        logSourceSide: "enemy",
        logDetail: "movement speed 0%",
      };
    },
    { category: "neutral", shape: "diamond", color: "#aa66ff", label: "ROOT" },
  ),
  defineBuff(
    "debuff-frost-ramp",
    ({ playerCs, world }) => {
      if (!playerCs) return null;
      const ramp = getStatusEffect(playerCs, FROST_RAMP_EFFECT_ID);
      if (!ramp) return null;
      const totalMs = ramp.data["totalMs"] ?? ramp.remainingMs;
      const source = world.getMonsterEntity(ramp.sourceId);
      const moveSlow = frostRampMoveSlowPct(ramp);
      const movePct = Math.round(moveSlow * 100);
      const atkPct = Math.round(frostRampAtkSlowPct(ramp) * 100);
      return {
        id: "debuff-frost-ramp",
        label: "FROST",
        stacks: ramp.stacks,
        durationPct:
          totalMs > 0 && ramp.remainingMs > 0
            ? (ramp.remainingMs / totalMs) * 100
            : -1,
        // Keep client own-player prediction aligned with the server move-slow.
        speedMult: Math.max(0, 1 - moveSlow),
        color: "#aaddff",
        logSourceName: source?.isMonster.name ?? "Monster debuff",
        logSourceSide: "enemy",
        logDetail: `move -${movePct}%, attack -${atkPct}%`,
      };
    },
    { category: "neutral", shape: "diamond", color: "#aaddff", label: "FROST" },
  ),
  defineBuff(
    "debuff-dot",
    ({ playerCs, world }) => {
      if (!playerCs) return null;
      // Monster-inflicted DoT lives on the player's own combat state under the
      // 'dot' id (players never DoT themselves — that always hits monsters).
      const dot = getStatusEffect(playerCs, "__disabled-monster-dot-placeholder");
      if (!dot || dot.stacks <= 0) return null;
      const totalMs = dot.data["totalMs"] ?? dot.remainingMs;
      const source = world.getMonsterEntity(dot.sourceId);
      const perStack = Math.round(dot.data["damagePerStack"] ?? 0);
      const flavor = monsterDotFlavorByCode(dot.data["flavorCode"]);
      return {
        id: "debuff-dot",
        label: flavor.label,
        stacks: dot.stacks,
        durationPct:
          totalMs > 0 && dot.remainingMs > 0
            ? (dot.remainingMs / totalMs) * 100
            : -1,
        color: flavor.color,
        logSourceName: source?.isMonster.name ?? "Monster debuff",
        logSourceSide: "enemy",
        logDetail: `${flavor.label}: ${perStack} dmg/stack per tick`,
      };
    },
    { category: "neutral", shape: "diamond", color: "#88bb55", label: "DoT" },
  ),
] as const satisfies readonly BuffDescriptor[];

/** Compile-time guard: shared BUFF_IDS must match server descriptor ids. */
type AssertEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : never;
type _BuffIdsMatch = AssertEqual<ServerBuffId, BuffId>;

/**
 * Single source of truth for the buff list. Each entry is a BuffDescriptor with
 * a static id/label/color and a `project(ctx)` function. To add a new buff:
 * declare it in the owning system file via `defineBuff(...)` and add the array
 * to the spread below. Order here determines render order on the BuffBar.
 */
export const ALL_BUFFS = [
  ...collectMechanicBuffs(),
  ...WEAPON_BUFFS,
  ...DEFENSE_BUFFS,
  ...MOBILITY_BUFFS,
  ...DEBUFF_BUFFS,
] as const satisfies readonly BuffDescriptor[];

export type ServerBuffId = (typeof ALL_BUFFS)[number]["id"];

/**
 * Run once per world tick (after all combat systems) to populate
 * player.activeBuffs by projecting every registered BuffDescriptor.
 */
export function syncPlayerBuffs(world: World, now: number): void {
  for (const entity of world.livePlayers) {
    const previousBuffs = entity.hasStatus.activeBuffs ?? [];
    const playerCs = entity.tracksCombat;
    const targetId = entity.hasAttackTarget?.targetId;
    const target = targetId ? world.getMonsterEntity(targetId) : undefined;
    const targetCs = target?.tracksCombat;

    const buffs: PlayerBuff[] = [];
    for (const descriptor of ALL_BUFFS) {
      const buff = descriptor.project({
        player: entity,
        playerCs,
        targetCs,
        target,
        world,
        now,
      });
      if (buff) {
        buffs.push({
          ...buff,
          category: descriptor.category,
          iconKey: descriptor.iconKey,
          shape: descriptor.shape,
        });
      }
    }
    buffs.push(...collectMonsterDotDebuffs(playerCs, world));

    entity.hasStatus.activeBuffs = buffs;
    recordBuffTransitions(world, entity, previousBuffs, buffs);
  }
}

function collectMonsterDotDebuffs(
  playerCs: NonNullable<BuffProjectionContext["playerCs"]>,
  world: World,
): PlayerBuff[] {
  return playerCs.statusEffects
    .filter((effect) => isMonsterDotStatusEffectId(effect.id) && effect.stacks > 0)
    .map((effect) => monsterDotBuff(effect, world));
}

function monsterDotBuff(effect: StatusEffect, world: World): PlayerBuff {
  const source = world.getMonsterEntity(effect.sourceId);
  const sourceDef = source
    ? MONSTER_DATABASE.get(source.isMonster.monsterTypeId)
    : undefined;
  const debuff = sourceDef
    ? resolveMonsterDotDebuff({
        monster: sourceDef,
        dotEffect: source?.scriptsBoss?.dotEffectOverride ?? sourceDef.dotEffect,
      })
    : monsterDotFlavorByCode(effect.data["flavorCode"]);
  const totalMs = effect.data["totalMs"] ?? effect.remainingMs;
  const perStack = Math.round(effect.data["damagePerStack"] ?? 0);
  return {
    id: "debuff-dot",
    label: debuff.label,
    stacks: effect.stacks,
    durationPct:
      totalMs > 0 && effect.remainingMs > 0
        ? (effect.remainingMs / totalMs) * 100
        : -1,
    color: debuff.color,
    category: "neutral",
    iconKey: effect.id,
    shape: "diamond",
    logSourceName: source?.isMonster.name ?? "Monster debuff",
    logSourceSide: "enemy",
    logDetail: `${debuff.label}: ${perStack} dmg/stack per tick`,
  };
}

function recordBuffTransitions(
  world: World,
  player: Parameters<typeof actorFromPlayer>[0],
  previousBuffs: PlayerBuff[],
  nextBuffs: PlayerBuff[],
): void {
  const previousByKey = new Map(previousBuffs.map((buff) => [buffLogKey(buff), buff]));
  const nextByKey = new Map(nextBuffs.map((buff) => [buffLogKey(buff), buff]));

  for (const buff of nextBuffs) {
    const previous = previousByKey.get(buffLogKey(buff));
    if (!previous) {
      recordBuffLogEvent(world, player, null, buff, "buff-gain");
      continue;
    }
    if (previous.stacks !== buff.stacks) {
      recordBuffLogEvent(world, player, previous, buff, "buff-update");
    }
  }

  for (const buff of previousBuffs) {
    if (nextByKey.has(buffLogKey(buff))) continue;
    recordBuffLogEvent(world, player, buff, null, "buff-expire");
  }
}

function recordBuffLogEvent(
  world: World,
  player: Parameters<typeof actorFromPlayer>[0],
  previousBuff: PlayerBuff | null,
  nextBuff: PlayerBuff | null,
  kind: "buff-gain" | "buff-update" | "buff-expire",
): void {
  const eventBuff = nextBuff ?? previousBuff;
  if (!eventBuff) return;

  recordWorldLogEvent(
    world,
    {
      kind,
      nodeId: player.hasPosition.nodeId,
      target: buffLogTarget(player, eventBuff),
      buffId: eventBuff.id,
      label: eventBuff.label,
      stacks: nextBuff?.stacks ?? 0,
      stackDelta: buffStackDelta(previousBuff, nextBuff),
      category: eventBuff.category,
      sourceName: eventBuff.logSourceName ?? buffSourceName(eventBuff),
      sourceSide: eventBuff.logSourceSide ?? buffSourceSide(eventBuff),
      effectText: nextBuff ? buffCurrentEffectText(nextBuff) : "no active modifier",
      changeText: buffChangeText(previousBuff, nextBuff),
      durationPct: nextBuff?.durationPct ?? -1,
    },
    {
      visibility: "combat",
      relatedPlayerIds: [player.isPlayer.id],
      nodeId: player.hasPosition.nodeId,
    },
  );
}

function buffStackDelta(
  previousBuff: PlayerBuff | null,
  nextBuff: PlayerBuff | null,
): number {
  return (nextBuff?.stacks ?? 0) - (previousBuff?.stacks ?? 0);
}

function buffCurrentEffectText(buff: PlayerBuff): string {
  return buff.logDetail ?? buffEffectText(buff);
}

function buffChangeText(
  previousBuff: PlayerBuff | null,
  nextBuff: PlayerBuff | null,
): string | undefined {
  if (!previousBuff || !nextBuff) {
    if (previousBuff && !nextBuff) {
      return effectDeltaText(buffCurrentEffectText(previousBuff), undefined);
    }
    return undefined;
  }
  return effectDeltaText(
    buffCurrentEffectText(previousBuff),
    buffCurrentEffectText(nextBuff),
  );
}

function effectDeltaText(
  previousText: string,
  nextText: string | undefined,
): string | undefined {
  const previousTerms = splitEffectTerms(previousText);
  const nextTerms = nextText ? splitEffectTerms(nextText) : [];
  const terms = previousTerms
    .map((previous) => {
      const next = nextTerms.find((candidate) => candidate.key === previous.key);
      if (!next && nextText !== undefined) return undefined;
      const delta = (next?.value ?? 0) - previous.value;
      if (Math.abs(delta) < 0.005) return undefined;
      return `${signedNumber(delta)}${previous.unit}${previous.label}`;
    })
    .filter((term): term is string => term !== undefined);
  if (terms.length > 0) return terms.join(", ");
  if (!nextText) return `lost: ${previousText}`;
  return undefined;
}

interface EffectTerm {
  key: string;
  value: number;
  unit: string;
  label: string;
}

function splitEffectTerms(text: string): EffectTerm[] {
  return text
    .split(/,\s*/)
    .map((raw) => raw.trim())
    .map(parseEffectTerm)
    .filter((term): term is EffectTerm => term !== null);
}

function parseEffectTerm(text: string): EffectTerm | null {
  const match = /^([+-])(\d+(?:\.\d+)?)(%?)(.*)$/.exec(text);
  if (!match) return null;
  const sign = match[1] === "-" ? -1 : 1;
  const value = sign * Number(match[2]);
  const unit = match[3];
  const label = match[4];
  return {
    key: `${unit}:${label.trim().toLowerCase()}`,
    value,
    unit,
    label,
  };
}

function signedNumber(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${formatLogNumber(Math.abs(value))}`;
}

function buffLogKey(buff: PlayerBuff): string {
  return `${buff.iconKey}:${buff.id}:${buff.logTargetId ?? "self"}`;
}

function buffLogTarget(
  player: Parameters<typeof actorFromPlayer>[0],
  buff: PlayerBuff,
): WorldLogActor {
  if (buff.logTargetId && buff.logTargetName && buff.logTargetType) {
    return {
      id: buff.logTargetId,
      name: buff.logTargetName,
      actorType: buff.logTargetType,
    };
  }
  return actorFromPlayer(player);
}

function buffSourceName(buff: PlayerBuff): string {
  if (buff.id === "sacred-burst") return "Sacred weapon";
  if (buff.id.startsWith("defense-")) return "Defense";
  if (buff.id.startsWith("debuff-")) return "Debuff";
  if (buff.id.startsWith("cadence-")) return "Cadence";
  if (buff.id.startsWith("cooldown-")) return "Cooldown";
  if (buff.id.startsWith("energy-")) return "Energy";
  if (buff.id.startsWith("dot-")) return "DoT";
  if (buff.id.startsWith("reload-")) return "Reload";
  if (buff.id.startsWith("summoner-")) return "Summoner";
  return "Buff";
}

function buffSourceSide(buff: PlayerBuff): "ally" | "enemy" | "neutral" {
  if (buff.id.startsWith("debuff-")) return "enemy";
  if (buff.id.startsWith("summoner-")) return "ally";
  return "neutral";
}

function buffEffectText(buff: PlayerBuff): string {
  switch (buff.id) {
    case "cadence-accelerando":
      return "+attack speed";
    case "cadence-echo":
      return "echo hit stored";
    case "cadence-resonance":
      return "finisher amplified";
    case "cadence-verdict":
      return "banked execution power";
    case "cadence-aftershock":
      return "next attacks fire on-hit twice";
    case "cadence-metronome":
      return "+flat damage to subsequent hits";
    case "cadence-rampage":
      return "+attack speed and finisher damage";
    case "cadence-crescendo":
      return "+finisher damage (ramps in combat)";
    case "cooldown-overdrive":
      return "+attack speed";
    case "cooldown-eternal-charge":
      return "+execution charge";
    case "cooldown-temporal-ext":
      return "+on-hit damage";
    case "cooldown-battery":
      return "+execution damage";
    case "cooldown-reverb":
      return "next execution empowered";
    case "cooldown-alignment":
      return "+attack speed";
    case "cooldown-rupture":
      return "regular attacks pierce plating";
    case "cooldown-channel":
      return "channeled beam active";
    case "energy-overcharge":
      return "+discharge damage";
    case "energy-ac-charge":
      return "charging phase";
    case "energy-ac-discharge":
      return "discharge phase damage ticks";
    case "energy-reservoir":
      return "+discharge reservoir";
    case "energy-equilibrium":
      return "+damage";
    case "energy-sm-pool":
      return "stored true damage";
    case "dot-vigor":
      return "+attack and attack speed";
    case "dot-conflag":
      return "fast burn ticks";
    case "dot-chill":
      return "target chill stacks";
    case "dot-frozen":
      return "target frozen";
    case "dot-rimeblade":
      return "+attack damage per frost stack";
    case "reload-snipe-ready":
      return "next shot empowered";
    case "reload-hair-trigger":
      return "+attack speed";
    case "reload-cover-fire":
      return "damage reduction while reloading";
    case "sacred-burst":
      return "+damage and attack speed";
    case "debuff-slow":
      return "movement speed reduced";
    case "debuff-root":
      return "movement disabled";
    case "debuff-frost-ramp":
      return "movement and attack speed reduced";
    case "debuff-dot":
      return "taking damage over time";
    case "defense-absorb":
      return "healing pool active";
    case "defense-burst":
      return "regen burst pool active";
    case "defense-debt":
      return "deferred damage pool";
    case "summoner-howl-banner":
      return "+summoner banner stacks";
    case "summoner-trample-boon":
      return "trample boon active";
    case "summoner-debuff-immune":
      return "debuff immunity";
    case "debuff-stunned":
      return "actions disabled";
    default:
      return buff.stacks > 1 ? `${buff.stacks} stacks` : "active";
  }
}
