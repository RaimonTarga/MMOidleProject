import { composePlayerView } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../src/ecs/entity';

/** Reads the actual body; never advances shields, timers, RNG, or world state. */
export function bossContrastSnapshot(bot: PlayerEntity, boss: MonsterEntity) {
  const v = composePlayerView(bot)!;
  return {
    owner: { hp: v.hp, maxHp: v.maxHp, barrier: v.barrier, barrierMax: v.barrierMax, pos: { ...v.pos },
      energy: bot.usesEnergy ? { ...bot.usesEnergy } : null,
      execution: bot.usesCooldown ? { ...bot.usesCooldown } : null,
      empowered: !!bot.hasEmpoweredAttack, cooldowns: { ...bot.tracksCombat.cooldowns },
      statusEffects: structuredClone(bot.tracksCombat.statusEffects) },
    boss: { id: boss.entityId, hp: boss.hasHealth.hp, maxHp: boss.hasHealth.maxHp,
      barrier: boss.tracksCombat.statusEffects.reduce((n, e) => n + (e.remainingMs > 0 && e.data.monsterWard === 1 ? Math.max(0, e.data.wardAmount ?? 0) : 0), 0),
      pos: { ...boss.hasPosition.current }, pattern: structuredClone(boss.runsBossPattern ?? null),
      statusEffects: structuredClone(boss.tracksCombat.statusEffects), counters: { ...boss.tracksCombat.counters } },
    distance: Math.hypot(bot.hasPosition.current.x - boss.hasPosition.current.x, bot.hasPosition.current.y - boss.hasPosition.current.y),
  };
}

export function bossContrastDelivery(log: { atMs: number; event: any }[], ownerId: string, bossId: string, spirit: boolean) {
  // Exactly one canonical player-hit per delivered owner strike. Never count
  // armed-state samples or both world-log and node-event copies as discharges.
  const hits = log.filter(x => x.event.kind === 'player-hit' && x.event.playerId === ownerId && x.event.targetId === bossId);
  const discharges = spirit ? hits.filter(x => x.event.empowered === true).map(x => ({
    atMs: x.atMs, recordedHpDamage: x.event.damage, absorbed: x.event.absorbed ?? 0,
    usefulHpContribution: null,
  })) : [];
  return { ownerHitsOnBoss: hits.length, spirit: spirit ? {
    firstDischargeAtMs: discharges[0]?.atMs ?? null, landedDischargeCount: discharges.length, discharges,
    recordedHpDamage: discharges.reduce((n, x) => n + x.recordedHpDamage, 0),
    absorbed: discharges.reduce((n, x) => n + x.absorbed, 0),
    usefulHpContribution: null, incrementalDischargeBonus: null, overkill: null,
    limitation: 'Canonical delivered empowered-hit payload, after mitigation/shield; HP damage may exceed remaining HP. It includes the whole strike, not a causal incremental bonus. No farming overkill attribution.',
  } : null };
}
