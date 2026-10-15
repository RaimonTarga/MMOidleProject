/**
 * The T1 summon types' jobs (class-first build plan CD.2; bible §7.4). A summon attacks through
 * the owner's player pipeline (`runFormationAttack`), so a piece's job is a listener keyed on the
 * hitting slot's piece: the Spitter's acid, the Marksman's power shot, the tanks' taunting sweep.
 * Every number is a kit `params` placeholder.
 */
import { CONDUIT_KIT, getResource, getStatusEffect, removeStatusEffect, setResource, type ConduitPiece } from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { applyTaunt } from '../../../combat/ai/targeting';
import { playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { attackNow, registerCombatListener, type CombatContext } from '../../../combat/engine/combatPipeline';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { applyFramePlatingShred } from '../../shared/frameLoop';
import { onTankTaunt } from './souls';
import { attachMarker } from '../../../../ecs/markerHelpers';
import { CONDUIT_POISON_ID } from '../../../combat/damage/bleedIds';
import { applyPlayerDebuff } from '../../shared/applyPlayerDebuff';

const PIECES = new Map<string, ConduitPiece>(CONDUIT_KIT.pieces.map((piece) => [piece.id, piece]));

const SHOTS = 'summon.shots';
/** Poison Staff, per stack of the weapon: ticks added per hit, the cap, a tick's share of the hit, the tick gap. PLACEHOLDERS. */
const POISON_TICKS_PER_HIT = 2;
const POISON_MAX_TICKS = 12;
const POISON_TICK_SHARE = 0.2;
const POISON_TICK_MS = 1_000;
const LAST_TAUNT_AT = 'summon.lastTauntAt';

/** The piece behind a formation hit, with the minion that swung. */
function swing(ctx: CombatContext, world: World): { owner: PlayerEntity; minion: MinionEntity; piece: ConduitPiece; target: MonsterEntity } | null {
  if (!ctx.formation || ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return null;
  const minion = world.getMinionEntity(ctx.formation.physicalEntityId);
  const piece = PIECES.get(ctx.formation.slotId.split('#')[0] ?? '');
  if (!minion || !piece) return null;
  return { owner: ctx.attacker, minion, piece, target: ctx.defender };
}

export function registerSummonPieces(): void {
  // The Dreadbore Soul's spiderling is a lighter strike (a stand-in; see souls.ts).
  registerCombatListener('onHit', (ctx) => {
    const mult = ctx.metadata['soulSpiderling'];
    if (typeof mult === 'number' && ctx.formation) ctx.damage = Math.round(ctx.damage * mult);
  });

  // Ridge Marksman: every few shots is a heavy one. One multiplier per hit: recorded as the
  // hit's empowered multiplier so a Technique rider reads the hit as it was before it.
  registerCombatListener('onHit', (ctx, world) => {
    const hit = swing(ctx, world);
    const every = hit?.piece.params.shotEvery ?? 0;
    if (!hit || every <= 0) return;
    const cs = hit.minion.tracksCombat;
    const shots = getResource(cs, SHOTS) + 1;
    if (shots < every) { setResource(cs, SHOTS, shots); return; }
    setResource(cs, SHOTS, 0);
    const mult = 1 + ((hit.piece.params.shotMult ?? 1) - 1) * (1 + (hit.owner.usesSkills.passives['conduit.ability-pct'] ?? 0));
    if (mult <= 1 || ctx.metadata['empoweredMultiplier'] !== undefined) return;
    ctx.damage = Math.round(ctx.damage * mult);
    ctx.metadata['empoweredMultiplier'] = mult;
  });

  registerCombatListener('afterHit', (ctx, world) => {
    const hit = swing(ctx, world);
    if (!hit) return;
    const { owner, minion, piece, target } = hit;

    // Bile Spitter: its acid strips a share of the target's plating.
    const shred = piece.params.shredFraction ?? 0;
    if (shred > 0 && !evadeBlocksDebuffs(ctx) && target.hasHealth.hp > 0) {
      applyFramePlatingShred(owner, target, shred * (1 + (owner.usesSkills.passives['conduit.ability-pct'] ?? 0)), piece.params.shredMs ?? 4000);
    }

    // Poison Staff: every summon hit adds ticks to a poison on the target (back-loaded damage).
    const poison = owner.usesSkills.passives['conduit.poison-stacks'] ?? 0;
    if (poison > 0 && !evadeBlocksDebuffs(ctx) && target.hasHealth.hp > 0) {
      const prior = getStatusEffect(target.tracksCombat, CONDUIT_POISON_ID);
      const ticks = Math.min(POISON_MAX_TICKS, (prior?.stacks ?? 0) + poison * POISON_TICKS_PER_HIT);
      const perTick = Math.max(1, Math.round(ctx.damage * POISON_TICK_SHARE), prior?.data['damagePerTick'] ?? 0);
      removeStatusEffect(target.tracksCombat, CONDUIT_POISON_ID);
      const effect = applyPlayerDebuff(owner, target.tracksCombat, {
        id: CONDUIT_POISON_ID,
        instanced: false,
        remainingMs: -1,
        sourceId: owner.isPlayer.id,
        data: { damagePerTick: perTick, nextTickIn: POISON_TICK_MS, tickIntervalMs: POISON_TICK_MS },
      }, { origin: 'mechanic' });
      effect.stacks = ticks; // one stack per remaining tick, as a bleed
      attachMarker(world, target, 'hasHemorrhage');
    }

    // Tanks (Plains Warden, Cave Brute): the sweep taunts the enemies around the target.
    const every = piece.params.tauntEveryMs ?? 0;
    if (every > 0) {
      const now = attackNow(ctx);
      const cs = minion.tracksCombat;
      const last = getResource(cs, LAST_TAUNT_AT);
      if (last > 0 && now - last < every) return;
      setResource(cs, LAST_TAUNT_AT, now);
      const around = [target, ...playerAoeTargets(world, owner, target.hasPosition.current, piece.params.tauntRadius ?? 100, target.isMonster.id)];
      for (const monster of around) {
        if (monster.hasHealth.hp <= 0) continue;
        applyTaunt(world, monster, { id: minion.isMinion.id, kind: 'minion' }, piece.params.tauntMs ?? 3000, now);
      }
      onTankTaunt(world, owner, minion);
    }
  });
}
