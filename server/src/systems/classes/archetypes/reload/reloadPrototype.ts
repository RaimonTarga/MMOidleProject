import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { registerEmpoweredMultiplier } from '../../../combat/engine/empoweredAttacks';
import type { World } from '../../../../world/World';
import { getFlag, relicRatingsFromPassives, resolveReloadRelicProfile, resetCounter } from '@mmo-idle/shared';
import { isPlayerActivelyInCombat } from '../../../combat/ai/engagement';
import { RUNE_TACTICAL_RELOAD_FLAG } from '../../../combat/ai/runeConfig';
import { initReloadT3 } from './t3';
import { DEFAULT_EXPLODING_CLIP_MULT } from './t3/core/constants';
import {
  completeReload,
  emitReloadStart,
  registerReloadAfterHitListener,
  resolveReloadTimeMs,
  startReloadTimer,
} from './reloadLifecycle';
import { registerReloadFrameLoop } from './frameLoop';
import { blunderbussAimPos } from './t3/pipeline/blunderbuss';
import {
  BLUNDERBUSS_VOLLEY_HITS_COUNTER,
  DEFAULT_BLUNDERBUSS_SPREAD_RAD,
} from './t3/core/constants';

const RELOAD_MAX_AMMO = 10;

export function updateReloadArchetype(world: World, dt: number): void {
  for (const entity of world.reloadPlayers) {
    const reload = entity.usesReload;

    const baseMaxAmmo = Math.max(1, Math.round(entity.usesSkills.passives['reload.max-ammo'] ?? RELOAD_MAX_AMMO));
    const maxAmmo = resolveReloadRelicProfile(
      1600,
      baseMaxAmmo,
      relicRatingsFromPassives(entity.usesSkills.passives),
    ).ammoMax.after;

    if (reload.ammoMax !== maxAmmo) {
      const isFirstInit = reload.ammoMax === 0;
      reload.ammoMax = maxAmmo;
      // A Duelist's kill chain may hold rounds past the clip's size; a resize clamps
      // to the grown clip, never strips the chain's rounds (0 for everyone else).
      const ceiling = maxAmmo + reload.chainRounds;
      if (isFirstInit || reload.ammo > ceiling) {
        reload.ammo = ceiling;
      }
    }

    const tacticalReload = getFlag(
      entity.tracksCombat,
      RUNE_TACTICAL_RELOAD_FLAG,
    );
    const inCombat =
      tacticalReload && isPlayerActivelyInCombat(world, entity);

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

    if (reload.reloadingMs <= 0 && reload.ammo === 0) {
      completeReload(world, entity);
    }
  }
}

export function initReloadArchetype(): void {
  // Register the empowered multiplier FIRST so it runs before the T3 onHit hooks.
  // No reload path arms an empowered attack of its own since the T3 review retired
  // the Duelist's exploding last bullet (design §22.5); the layer stays for anything
  // else that arms one. Reads the multiplier from the node (reload.empowered-mult)
  // and layers the universal empowered bonuses (shared.empowered-mult-add,
  // weapon.empowered-mult-bonus).
  registerEmpoweredMultiplier(DEFAULT_EXPLODING_CLIP_MULT, {
    attackerType:  'player',
    attackerSlice: 'usesReload',
    passiveKey:    'reload.empowered-mult',
    // `mechanic-proxy` (design §24.2): a proxy reads its OWN key, which only the
    // Duelist authors (×3.5, design §22.12) — never `reload.empowered-mult`, so the
    // proxy's size moves no real shot (none is armed empowered; the Scout's openers
    // are the frame loop's fold) and no HUD or DPS reader. Every other reload spec
    // takes the proxy's fallback rather than a multiplier its class never fires.
    proxyPassiveKey: 'reload.mechanic-proxy-mult',
    proxyRequiresPassive: true,
  });

  // Frame loop (Phase 3): registered right after the empowered multiplier so the
  // clip-position fold composes onto `empoweredMultiplier` rather than racing it.
  registerReloadFrameLoop();

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

    // Class adapters can key off the authoritative ammo pipeline instead of
    // naming weapon paths. Follow-up Blunderbuss pellets are still shots from
    // this clip; Laser ticks never pass this ammo gate and therefore stay out.
    // `reloadClipSize` is the AUTHORED clip, never the one a Duelist's kill chain
    // has grown: Tempo's attack-equivalents and Sweep's clip budget normalise by it,
    // so a kill's extra round is one more shot worth 1/ammoMax of an attack, never
    // a reason to shrink every other shot's share.
    ctx.metadata['reloadClipShot'] = true;
    ctx.metadata['reloadClipSize'] = Math.max(1, reload.ammoMax);

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
      // tracer). Cosmetic only, not mechanical.
      ctx.metadata['empoweredAttack'] = true;
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

    // Which round of the clip this is, 1-based — the frame loop's whole input
    // (Phase 3). Deliberately NOT re-derived downstream from `ammoMax - ammo`: the
    // Blunderbuss branch above empties the clip in one beat and returns before here,
    // so a volley pellet carries no clip position and the frame loop skips it.
    // The clip a Duelist's kill chain has grown is `ammoMax + chainRounds` rounds
    // long, so a kill's round extends the clip rather than re-arming an opener.
    ctx.metadata['reloadClipIndex'] = Math.max(
      1,
      reload.ammoMax + reload.chainRounds - reload.ammo,
    );

    if (reload.ammo === 0) {
      const reloadTimeMs = resolveReloadTimeMs(entity);
      startReloadTimer(world, entity, reloadTimeMs);
      ctx.metadata['pendingReloadStart'] = true;
    }
  });
}
