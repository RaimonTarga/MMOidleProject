import { applyStatusEffect } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import {
  ALT_ONHIT_CLIENT_EFFECT,
  ALT_CADENCE_ATTACK_MULT,
  ALT_CADENCE_ONHIT_MULT,
} from '../core/constants';

function usesStandardMagazine(passives: Record<string, number | undefined>): boolean {
  if ((passives['reload.laser'] ?? 0) > 0) return false;
  if ((passives['reload.snipe'] ?? 0) > 0) return false;
  if ((passives['reload.gatling'] ?? 0) > 0) return false;
  return true;
}

export function registerReloadLightT3(): void {
  registerCombatListener('onHit', (ctx) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;

    const player = ctx.attacker;
    const reload = player.usesReload;
    if (!reload) return;

    const passives = player.usesSkills.passives;
    if (!usesStandardMagazine(passives)) return;

    // Alternating Cadence: even shots = 2× attack (on-hit zeroed), odd shots =
    // 2× on-hit (attack zeroed). On-hit TRIGGERS (DoT/procs) still fire on all
    // shots — only the on-hit DAMAGE value is scaled (see combat.ts onHitDamageMult).
    if ((passives['reload.alternating-cadence'] ?? 0) > 0) {
      const shotPos = reload.ammoMax - reload.ammo; // 1-indexed shot just fired
      if (shotPos % 2 === 0) {
        const attackMult = passives['reload.alternating-attack-mult'] ?? ALT_CADENCE_ATTACK_MULT;
        ctx.damage = Math.max(1, Math.round(ctx.damage * attackMult));
        ctx.metadata['onHitDamageMult'] = 0;
      } else {
        ctx.damage = 0;
        ctx.metadata['onHitDamageMult'] = passives['reload.alternating-onhit-mult'] ?? ALT_CADENCE_ONHIT_MULT;
        // Odd shot = the on-hit-focused round → tag the blue shot FX.
        const existing = ctx.metadata['clientEffects'];
        const effects = Array.isArray(existing)
          ? existing.filter((e): e is string => typeof e === 'string')
          : [];
        effects.push(ALT_ONHIT_CLIENT_EFFECT);
        ctx.metadata['clientEffects'] = effects;
      }
    }
  });
}
