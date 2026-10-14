/**
 * What a landed monster hit leaves on its target (class-first build plan S1, bible §7.10):
 * the one rider table, for players and summons alike. Before the rework a hit on a summon
 * skipped every rider ("damage sponges, not full combatants"), which is why the Conduit
 * ignored the debuff biomes.
 *
 * A `RiderTarget` says how a status reaches its target: a player's refusals (Unyielding,
 * Immunity), its debuff resistance and its status tenacity apply; a summon has none of them.
 * The riders themselves are written once, here.
 */
import {
  applyStatusEffect,
  DAMAGE_TAKEN_PCT_KEY,
  FROST_RAMP_EFFECT_ID,
  frostRampMaxStacks,
  getStatusEffect,
  SUN_MARK_EFFECT_ID,
  SUNDERED_EFFECT_ID,
  type MonsterDefinition,
  type StatusEffect,
  type StatusEffectConfig,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { cadenceFiredThisTick } from '../engine/monsterMechanics';
import { applyResistedPlayerDebuff, canApplyPlayerDebuff, playerRefusesStatus } from './debuffGuard';
import { harmfulStatusDurationMult } from './harmfulStatus';
import { applyMinionPlatingShred } from './minionAfflictions';
import { applyPlatingShredStacks } from './platingShred';

/** How a monster's harmful status reaches one target. */
export interface RiderTarget {
  state: TracksCombat;
  /** Whether a harmful status may land at all (a player's debuff immunity; a summon still standing). */
  canApply: boolean;
  /** Scales a rider's duration: the player's status tenacity; 1 for a summon. */
  durationMult(): number;
  /** The target refuses this status outright (a player's Unyielding or Immunity). */
  refuses(id: string, data?: Record<string, number>): boolean;
  /** Write one harmful status through the target's resistances; undefined when refused. */
  apply(config: StatusEffectConfig): StatusEffect | undefined;
  /** One stack of the monster's Cave corrosion, its threshold poison included. */
  shredPlating(world: World, monster: MonsterEntity, def: MonsterDefinition, abilityName?: string): void;
}

export function playerRiderTarget(player: PlayerEntity): RiderTarget {
  return {
    state: player.tracksCombat,
    canApply: canApplyPlayerDebuff(player),
    durationMult: () => harmfulStatusDurationMult(player),
    refuses: (id, data) => playerRefusesStatus(player, id, data),
    apply: (config) => applyResistedPlayerDebuff(player, config),
    shredPlating: (world, monster, def, abilityName) =>
      applyPlatingShredStacks(world, monster, player, def, 1, abilityName),
  };
}

export function minionRiderTarget(minion: MinionEntity): RiderTarget {
  return {
    state: minion.tracksCombat,
    canApply: minion.hasHealth.hp > 0,
    durationMult: () => 1,
    refuses: () => false,
    apply: (config) => applyStatusEffect(minion.tracksCombat, config),
    shredPlating: (world, monster, def, abilityName) =>
      applyMinionPlatingShred(world, monster, minion, def, abilityName),
  };
}

/**
 * The riders of one landed monster hit: the Desert's Sun Mark, the Constrict root on a
 * cadence finisher, the monster's slow, the Trench's antiheal, the Desert's sundering, the
 * Cave's corrosion and the Tundra's frost ramp. The caller has already decided the hit
 * carries debuffs (a player's full dodge doesn't; a summon never evades). Monster DoTs are
 * not here: a player's come from the `onHit` listener, a summon's from its swing.
 */
export function applyMonsterHitRiders(
  world: World,
  monster: MonsterEntity,
  def: MonsterDefinition | undefined,
  target: RiderTarget,
  now: number,
  options: {
    /** This hit just cashed a Sun Mark: a self-marking monster must not repaint on it. */
    sunMarkConsumed?: boolean;
    abilityName?: string;
  } = {},
): void {
  if (!def || !target.canApply) return;
  const sourceId = monster.isMonster.id;

  // Sun Mark setup (Desert): the marker paints a cleansable mark the finisher cashes in.
  // Edge-triggered telegraph: one pulse only when the mark is freshly applied.
  //
  // A SELF-MARKING monster (both `appliesMark` and `markedStrike`, the T2 Desert Emperor)
  // must not repaint on the very hit that just cashed the mark: the finisher check runs
  // before damage and the riders after it, so without this guard every hit from the
  // second onward would land amplified forever. Skipping the repaint makes it ALTERNATE.
  const mark = def.appliesMark;
  if (mark && options.sunMarkConsumed !== true && !target.refuses(SUN_MARK_EFFECT_ID)) {
    const fresh = !getStatusEffect(target.state, SUN_MARK_EFFECT_ID);
    const markMs = Math.round(mark.durationMs * target.durationMult());
    target.apply({
      id: SUN_MARK_EFFECT_ID,
      maxStacks: 1,
      remainingMs: markMs,
      refreshable: true,
      sourceId,
      data: { totalMs: markMs },
    });
    if (fresh) {
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'ecology-pulse',
        monsterId: sourceId,
        pos: { ...monster.hasPosition.current },
        pulse: 'sun-mark',
      });
    }
  }

  // CONSTRICT: when the cadence finisher fires, the boosted hit also roots. Gated on
  // `cadenceFiredThisTick` so it lands on the heavy beat only.
  const cadenceRootMs = def.cadenceFinisher?.rootMs;
  if (cadenceRootMs && cadenceFiredThisTick(monster, now)) {
    const rootMs = Math.round(cadenceRootMs * target.durationMult());
    target.apply({
      id: 'slow',
      maxStacks: 1,
      remainingMs: rootMs,
      refreshable: true,
      sourceId,
      data: { speedMult: 0, totalMs: rootMs },
    });
  }

  // The monster's own slow; a player's mobility-boot tenacity shortens it.
  const slow = def.slowEffect;
  if (slow) {
    const slowMs = Math.round(slow.durationMs * target.durationMult());
    target.apply({
      id: 'slow',
      maxStacks: 1,
      remainingMs: slowMs,
      refreshable: true,
      sourceId,
      data: { speedMult: slow.speedMult, totalMs: slowMs },
    });
  }

  // Trench "abyssal pressure": stacking `antiheal` that suppresses ALL healing
  // (`getAntiHealMult`), so you can't out-heal an abyssal terror and must burst it.
  // Decays after the last hit.
  const antiheal = def.appliesAntiheal;
  if (antiheal) {
    const durMs = Math.round(antiheal.durationMs * target.durationMult());
    target.apply({
      id: 'antiheal',
      maxStacks: antiheal.maxStacks,
      remainingMs: durMs,
      refreshable: true,
      sourceId,
      data: { reductionPerStack: antiheal.reductionPerStack, totalMs: durMs },
    });
  }

  // Desert sundering: stacking `sundered` (+damage TAKEN from every source via
  // `playerIncomingDamageMult`). The controller half of the Desert pair: the pinning mob
  // barely scratches you, it makes its kiting dealer's shots land harder.
  const vulnerability = def.appliesVulnerability;
  if (vulnerability) {
    const durMs = Math.round(vulnerability.durationMs * target.durationMult());
    target.apply({
      id: SUNDERED_EFFECT_ID,
      maxStacks: vulnerability.maxStacks,
      remainingMs: durMs,
      refreshable: true,
      sourceId,
      data: { [DAMAGE_TAKEN_PCT_KEY]: vulnerability.damageTakenPct, totalMs: durMs },
    });
  }

  // Cave corrosion: an ordinary hit erodes by ONE stack. The cast-only corrosion is
  // configured separately and never enters this rider.
  if (def.appliesPlatingShred) target.shredPlating(world, monster, def, options.abilityName);

  // Tundra rampDebuff: stacking move-slow + attack-slow, each capped, decaying
  // `stackDurationMs` after the last hit (refreshed every hit). A boss
  // 'modify-ramp-debuff' action raises the slow caps mid-fight.
  const rampDebuff = def.rampDebuff;
  if (rampDebuff) {
    const durMs = Math.round(rampDebuff.stackDurationMs * target.durationMult());
    const capOverride = monster.scriptsBoss?.rampDebuffCapOverride;
    const effectiveRamp = capOverride
      ? { ...rampDebuff, moveSlowMaxPct: capOverride.moveSlowMaxPct, atkSlowMaxPct: capOverride.atkSlowMaxPct }
      : rampDebuff;
    target.apply({
      id: FROST_RAMP_EFFECT_ID,
      maxStacks: frostRampMaxStacks(effectiveRamp),
      remainingMs: durMs,
      refreshable: true,
      sourceId,
      data: {
        moveSlowPerHit: effectiveRamp.moveSlowPerHit,
        moveSlowMaxPct: effectiveRamp.moveSlowMaxPct,
        atkSlowPerHit: effectiveRamp.atkSlowPerHit,
        atkSlowMaxPct: effectiveRamp.atkSlowMaxPct,
        totalMs: durMs,
      },
    });
  }
}
