import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { registerEmpoweredMultiplier } from '../../../combat/engine/empoweredAttacks';
import type { World } from '../../../../world/World';
import { getFlag } from '@mmo-idle/shared';
import { clipShiftFor } from '../../slinger/tuning';
import { isPlayerActivelyInCombat } from '../../../combat/ai/engagement';
import { RUNE_TACTICAL_RELOAD_FLAG } from '../../../combat/ai/runeConfig';
import {
  completeReload,
  emitReloadStart,
  registerReloadAfterHitListener,
  resolveReloadTimeMs,
  startReloadTimer,
} from './reloadLifecycle';

const RELOAD_MAX_AMMO = 10;
/**
 * Fallback for an Empowered mechanic-proxy. No reload path arms an empowered attack
 * (the exploding last bullet was retired). Nothing authors either key since those
 * paths went. 3.5 is the old exploding-clip fallback, kept so the registration
 * still has a number.
 */
const RELOAD_PROXY_MULT = 3.5;

export function updateReloadArchetype(world: World, dt: number): void {
  for (const entity of world.reloadPlayers) {
    const reload = entity.usesReload;
    // The gun sets the clip; the discipline shifts it by a flat amount (bible §10.2).
    const maxAmmo = Math.max(1, Math.round(entity.usesSkills.passives['reload.max-ammo'] ?? RELOAD_MAX_AMMO) + clipShiftFor(entity.usesSkills.disciplineId));
    if (reload.ammoMax !== maxAmmo) {
      const isFirstInit = reload.ammoMax === 0;
      reload.ammoMax = maxAmmo;
      if (isFirstInit || reload.ammo > maxAmmo) reload.ammo = maxAmmo;
    }

    const tacticalReload = getFlag(entity.tracksCombat, RUNE_TACTICAL_RELOAD_FLAG);
    const inCombat = tacticalReload && isPlayerActivelyInCombat(world, entity);
    if (
      tacticalReload &&
      !inCombat &&
      reload.ammo < reload.ammoMax &&
      reload.reloadingMs <= 0 &&
      reload.ammo > 0
    ) {
      const reloadTimeMs = resolveReloadTimeMs(entity);
      startReloadTimer(world, entity, reloadTimeMs);
      emitReloadStart(world, entity);
    }

    if (reload.reloadingMs > 0) {
      const tickMs = tacticalReload && !inCombat ? dt * 2 : dt;
      reload.reloadingMs = Math.max(0, reload.reloadingMs - tickMs);
    }

    if (reload.reloadingMs <= 0 && reload.ammo === 0) completeReload(world, entity);
  }
}

export function initReloadArchetype(): void {
  // No reload path arms an empowered attack (the exploding last bullet was retired).
  // The layer stays for a mechanic-proxy. Reads reload.empowered-mult, and the proxy
  // reads reload.mechanic-proxy-mult only when that key is authored.
  registerEmpoweredMultiplier(RELOAD_PROXY_MULT, {
    attackerType: 'player',
    attackerSlice: 'usesReload',
    passiveKey: 'reload.empowered-mult',
    proxyPassiveKey: 'reload.mechanic-proxy-mult',
    proxyRequiresPassive: true,
  });
  registerReloadAfterHitListener();

  registerCombatListener('beforeAttack', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    const entity = ctx.attacker;
    if (!entity?.usesReload) return;
    // An earlier gate already cancelled this attack. Don't drain the clip.
    if (ctx.cancelled) return;

    const reload = entity.usesReload;
    if (reload.reloadingMs > 0 || reload.ammo === 0) {
      ctx.cancelled = true;
      return;
    }

    // Chaotic miss: the shot whiffs but doesn't consume ammo or start a reload.
    if (ctx.metadata['chaoticMiss']) return;

    // Class adapters key off the authoritative ammo pipeline. `reloadClipSize` is
    // the authored clip: Tempo's attack-equivalents and Sweep's clip budget
    // normalise by it.
    ctx.metadata['reloadClipShot'] = true;
    ctx.metadata['reloadClipSize'] = Math.max(1, reload.ammoMax);

    reload.ammo -= 1;
    // Which round of the clip this is, 1-based. The Loadout's last-round seam
    // reads it (slinger.ts). Written after the decrement, so the last round is
    // ammoMax.
    ctx.metadata['reloadClipIndex'] = Math.max(1, reload.ammoMax - reload.ammo);

    if (reload.ammo === 0) {
      const reloadTimeMs = resolveReloadTimeMs(entity);
      startReloadTimer(world, entity, reloadTimeMs);
      ctx.metadata['pendingReloadStart'] = true;
    }
  });
}
