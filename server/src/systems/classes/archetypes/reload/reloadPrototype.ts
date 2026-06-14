import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { registerEmpoweredMultiplier, setEmpoweredAttack } from '../../../combat/engine/empoweredAttacks';
import type { World } from '../../../../world/World';
import { GAME_CONFIG, resetCounter } from '@mmo-idle/shared';
import { initReloadT3 } from './t3';
import { DEFAULT_EXPLODING_CLIP_MULT } from './t3/core/constants';
import {
  completeReload,
  emitReloadStart,
  registerReloadAfterHitListener,
  resolveReloadTimeMs,
  startReloadTimer,
} from './reloadLifecycle';
import { blunderbussAimPos } from './t3/pipeline/blunderbuss';
import {
  BLUNDERBUSS_VOLLEY_HITS_COUNTER,
  DEFAULT_BLUNDERBUSS_SPREAD_RAD,
} from './t3/core/constants';

const RELOAD_MAX_AMMO = 10;

export function updateReloadArchetype(world: World, dt: number, now: number): void {
  for (const entity of world.reloadPlayers) {
    const reload = entity.usesReload;

    const maxAmmo = Math.round(entity.usesSkills.passives['reload.max-ammo'] ?? RELOAD_MAX_AMMO);

    if (reload.ammoMax !== maxAmmo) {
      const isFirstInit = reload.ammoMax === 0;
      reload.ammoMax = maxAmmo;
      if (isFirstInit || reload.ammo > maxAmmo) {
        reload.ammo = maxAmmo;
      }
    }

    const lastCombatAt = entity.tracksEngagement;
    const inCombat = entity.hasAttackTarget !== undefined ||
      (lastCombatAt !== undefined && (now - lastCombatAt) < GAME_CONFIG.COMBAT_REGEN_DELAY);

    if (!inCombat && reload.ammo < reload.ammoMax && reload.reloadingMs <= 0 && reload.ammo > 0) {
      const reloadTimeMs = resolveReloadTimeMs(entity);
      startReloadTimer(world, entity, reloadTimeMs);
      emitReloadStart(world, entity);
    }

    if (reload.reloadingMs > 0) {
      const tickMs = inCombat ? dt : dt * 2;
      reload.reloadingMs = Math.max(0, reload.reloadingMs - tickMs);
    }

    if (reload.reloadingMs <= 0 && reload.ammo === 0) {
      completeReload(world, entity);
    }
  }
}

export function initReloadArchetype(): void {
  // Register the empowered multiplier FIRST so it runs before the T3 onHit hooks.
  // Only Duelist (exploding-clip) arms an empowered attack — on the clip's last
  // bullet (see beforeAttack below) — so this is inert for every other reload spec.
  // Reads the multiplier from the node (reload.empowered-mult) and layers the
  // universal empowered bonuses (shared.empowered-mult-add, weapon.empowered-mult-bonus).
  registerEmpoweredMultiplier(DEFAULT_EXPLODING_CLIP_MULT, {
    attackerType:  'player',
    attackerSlice: 'usesReload',
    passiveKey:    'reload.empowered-mult',
  });

  initReloadT3();
  registerReloadAfterHitListener();

  registerCombatListener('beforeAttack', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity?.usesReload) return;

    // If an earlier gate (laser/snipe) already cancelled this attack, don't run the
    // ammo/plating bookkeeping — otherwise a cancelled shot still drains the clip.
    if (ctx.cancelled) return;

    ctx.platingMult = 0.5;

    const reload = entity.usesReload;
    const passives = entity.usesSkills.passives;
    const isBlunderbussPellet = ctx.metadata['blunderbussPellet'] === true;

    // Blunderbuss volley pellets fire as one burst: pellet 0 empties the clip
    // and starts the reload, so the follow-up pellets must bypass both the
    // reloading and empty-clip guards (otherwise only the first pellet lands).
    if (!isBlunderbussPellet && (reload.reloadingMs > 0 || reload.ammo === 0)) {
      ctx.cancelled = true;
      return;
    }

    // Chaotic miss: the shot whiffs but doesn't consume ammo or start a reload.
    // The cancel guards above already ran, so a miss can't fire on an empty clip.
    if (ctx.metadata['chaoticMiss']) return;

    if ((passives['reload.blunderbuss'] ?? 0) > 0 && !isBlunderbussPellet) {
      const pelletCount = reload.ammo;
      if (pelletCount <= 0) {
        ctx.cancelled = true;
        return;
      }

      const spreadRad =
        passives['reload.blunderbuss-spread-rad'] ?? DEFAULT_BLUNDERBUSS_SPREAD_RAD;
      const targetPos = ctx.defender.hasPosition.current;
      const from = entity.hasPosition.current;
      ctx.metadata['aimPos'] = blunderbussAimPos(from, targetPos, spreadRad);
      ctx.metadata['blunderbussPellet'] = true;
      ctx.metadata['blunderbussPelletIndex'] = 0;
      ctx.metadata['blunderbussPelletTotal'] = pelletCount;
      ctx.metadata['blunderbussRemaining'] = pelletCount - 1;
      ctx.metadata['blunderbussLastPellet'] = pelletCount === 1;
      ctx.metadata['blunderbussVolleyTrigger'] = true;
      // Aesthetic-only crits: every pellet gets the yellow "!" styling (and yellow
      // tracer), with no AoE splash. Suppress keeps it cosmetic, not mechanical.
      ctx.metadata['empoweredAttack'] = true;
      ctx.metadata['suppressEmpoweredAoe'] = true;
      if (entity.tracksCombat) {
        resetCounter(entity.tracksCombat, BLUNDERBUSS_VOLLEY_HITS_COUNTER);
      }

      reload.ammo = 0;
      const reloadTimeMs = resolveReloadTimeMs(entity);
      startReloadTimer(world, entity, reloadTimeMs);
      return;
    }

    // Follow-up volley pellets don't consume ammo — pellet 0 already emptied the
    // clip and started the reload. Without this they'd drive ammo negative.
    if (isBlunderbussPellet) return;

    reload.ammo -= 1;

    if (reload.ammo === 0) {
      // Duelist: the bullet that empties the clip fires as an empowered attack.
      // Arm it here (beforeAttack) so the empowered multiplier consumes it at onHit
      // — this also drives the empowered AoE splash and the yellow "!" damage style.
      if ((passives['reload.exploding-clip'] ?? 0) > 0) {
        setEmpoweredAttack(world, entity);
      }
      const reloadTimeMs = resolveReloadTimeMs(entity);
      startReloadTimer(world, entity, reloadTimeMs);
      ctx.metadata['pendingReloadStart'] = true;
    }
  });
}
