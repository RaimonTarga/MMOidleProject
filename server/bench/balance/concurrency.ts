import { inAttackRange, posHitboxFromEntity } from '@mmo-idle/shared';
import type { World } from '../../src/world/World';
import type { EntityId, PlayerEntity } from '../../src/ecs/entity';

// ─────────────────────────────────────────────────────────────────────────────
// Concurrency telemetry — how many monsters are actually on the player.
//
// This measures the single load-bearing input of the encounter model in
// tools/tier-table.ts. That model computes sustained pressure as `d · (N+1)/2`,
// where `(N+1)/2` is the mean number of live attackers as a focus-fired pull burns
// down from N bodies to 1. Crucially, that term is DIRECTLY OBSERVABLE: the
// time-weighted mean attacker count IS `(N+1)/2`, so this sampler measures the
// quantity the model consumes rather than measuring N and inferring it.
//
// Two populations are counted every tick because they answer different questions:
//   aggroed — monsters that have chosen the player as their target, including ones
//             still running at them. This is the shape of the pull.
//   inRange — the subset close enough to actually swing. The model's per-monster
//             `d` only applies here, so this is the number that feeds `sustained`.
//
// Everything is time-weighted over ticks, which is uniform (`BENCH_DT_MS`), so a
// plain count-and-divide is already time-weighting.
//
// Range uses the authoritative hitbox-aware `inAttackRange` (gap between hitbox
// rects, not centre-to-centre), the same predicate combat itself uses. This matters:
// the bench hydrates the baked hitbox cache precisely because square-AABB fallbacks
// diverge from real in-game reach, and reach is exactly what is being counted here.
//
// It also tracks TOTAL HP LOST, which exists because `metrics.damageTaken` is
// incomplete: it hooks the `onDamageTaken` combat pipeline, but monster DoT ticks
// apply `hasHealth.hp -= hpDamage` directly (dotPrototype.ts) and never enter that
// pipeline, as do AoE splash and node-feature damage. In a biome like Swamp, where
// ~75% of output is poison, the pipeline figure misses most of the damage — Swamp
// measured as SAFER than Plains until this was added. Summing per-tick HP decreases
// catches every path by construction; increases (regen, heals, respawn) are ignored.
//
// NOT modelled: attack cooldown state — a monster in range but mid-cooldown still
// counts, which is correct for comparing against a DPS rate. HP lost slightly
// undercounts when damage and regen land in the same tick and net positive.
// ─────────────────────────────────────────────────────────────────────────────

/** Bucket edges for the attacker-count histogram; the last bucket is "or more". */
const HISTOGRAM_BUCKETS = 7; // 0,1,2,3,4,5,6+

export interface ConcurrencyStats {
  /** Mean monsters targeting the player, averaged over EVERY tick of the run. */
  meanAggroed: number;
  /** Mean monsters in swing range, over every tick. Feeds `sustained`. */
  meanInRange: number;
  /** Mean monsters targeting the player, over ticks where at least one did. */
  meanAggroedInCombat: number;
  /** Mean monsters in swing range, over ticks where at least one was in range. */
  meanInRangeInCombat: number;
  /** Largest simultaneous counts seen. */
  peakAggroed: number;
  peakInRange: number;
  /** Fraction of ticks with ≥1 monster targeting the player. */
  combatUptime: number;
  /** Fraction of ticks with ≥1 monster in swing range. */
  contactUptime: number;
  /**
   * Share of ticks spent at each in-range attacker count (index 6 = "6 or more").
   * More honest than any mean: it distinguishes "steadily 3" from "usually 1,
   * occasionally 9", which the encounter model treats very differently.
   */
  inRangeHistogram: number[];
  /** Total monsters that aggroed the player, divided by kills. */
  aggroPerKill: number;
  /**
   * Total HP the player lost across the run, from EVERY source — direct hits, DoT
   * ticks, AoE splash and environmental damage alike. Use this, not the combat
   * pipeline's `damageTaken`, when comparing biomes whose damage arrives by
   * different routes.
   */
  hpLost: number;
}

export class ConcurrencySampler {
  private ticks = 0;
  private aggroedSum = 0;
  private inRangeSum = 0;
  private aggroedCombatTicks = 0;
  private inRangeCombatTicks = 0;
  private peakAggroedSeen = 0;
  private peakInRangeSeen = 0;
  private readonly histogram = new Array<number>(HISTOGRAM_BUCKETS).fill(0);
  /** Entity ids that have targeted the player at any point, for aggroPerKill. */
  private readonly everAggroed = new Set<EntityId>();
  private hpLostTotal = 0;
  private lastHp: number | null = null;

  /** Call once per world tick, after `world.tick`. */
  sample(world: World, nodeId: string, bot: PlayerEntity): void {
    this.ticks += 1;

    const hp = bot.hasHealth.hp;
    if (this.lastHp !== null && hp < this.lastHp) this.hpLostTotal += this.lastHp - hp;
    this.lastHp = hp;

    if (bot.isDead) {
      this.histogram[0] += 1;
      return;
    }

    const botHitbox = posHitboxFromEntity(bot);
    let aggroed = 0;
    let inRange = 0;

    for (const monster of world.monsterEntitiesInNode(nodeId)) {
      if (monster.hasAggroTarget?.targetId !== bot.entityId) continue;
      aggroed += 1;
      this.everAggroed.add(monster.entityId);

      const reach = monster.performsAttack.attackRange;
      if (inAttackRange(posHitboxFromEntity(monster), botHitbox, reach)) inRange += 1;
    }

    this.aggroedSum += aggroed;
    this.inRangeSum += inRange;
    if (aggroed > 0) this.aggroedCombatTicks += 1;
    if (inRange > 0) this.inRangeCombatTicks += 1;
    if (aggroed > this.peakAggroedSeen) this.peakAggroedSeen = aggroed;
    if (inRange > this.peakInRangeSeen) this.peakInRangeSeen = inRange;
    this.histogram[Math.min(inRange, HISTOGRAM_BUCKETS - 1)] += 1;
  }

  result(kills: number): ConcurrencyStats {
    const t = Math.max(1, this.ticks);
    return {
      meanAggroed: this.aggroedSum / t,
      meanInRange: this.inRangeSum / t,
      meanAggroedInCombat:
        this.aggroedCombatTicks > 0 ? this.aggroedSum / this.aggroedCombatTicks : 0,
      meanInRangeInCombat:
        this.inRangeCombatTicks > 0 ? this.inRangeSum / this.inRangeCombatTicks : 0,
      peakAggroed: this.peakAggroedSeen,
      peakInRange: this.peakInRangeSeen,
      combatUptime: this.aggroedCombatTicks / t,
      contactUptime: this.inRangeCombatTicks / t,
      inRangeHistogram: this.histogram.map((count) => count / t),
      aggroPerKill: kills > 0 ? this.everAggroed.size / kills : 0,
      hpLost: this.hpLostTotal,
    };
  }
}
