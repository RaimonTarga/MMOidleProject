/**
 * Duelist (`reload-light-t3-a`) — KILL CHAIN (design §22.5, T3 path review).
 *
 * Every kill loads `reload.kill-chain` rounds (one) on top of the clip, past its
 * authored size, until the next reload starts: a long chain is a long clip, and the
 * ammo counter climbs past its maximum. A reload dumps the clip and returns it to
 * the authored size (`startReloadTimer` clears `chainRounds`).
 *
 * THE CLIP GROWS IN `ammo`, NOT IN `ammoMax`. The networked slice already carries
 * both, so the HUD shows "7 / 5" with no new flag. `ammoMax` stays the authored
 * clip because Tempo's attack-equivalents and Sweep's clip budget normalise every
 * shot by it (`reloadClipSize`): an extra round is one more shot worth 1/ammoMax of
 * an attack, not a reason to re-price the others. `chainRounds` is what keeps the
 * clip position honest — Scout's openers stay the first two rounds of a fresh clip
 * however long the chain grows it (`reloadClipIndex`).
 *
 * DISTINCT FROM REFUND. The Kill chain keystone *Refund* readies the mechanic, which
 * for a Slinger completes the reload. A Duelist with Refund gets the refill AND the
 * round: `completeReload` refills a READIED clip to `ammoMax + chainRounds`, so the
 * result is the same whichever of the two `onKill` listeners runs first.
 *
 * A KILL WHILE RELOADING (the last round's own kill, a DoT kill mid-reload) has no
 * clip to load into. The round is still counted, owed to the clip: if Refund readies
 * that reload the refill pays it; if the timer runs out instead, `completeReload`
 * forfeits it and the clip comes back at its authored size.
 */
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { markSliceDirty } from '../../../../../../ecs/dirtyHelpers';

export function registerKillChainRounds(): void {
  registerCombatListener('onKill', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    const reload = player.usesReload;
    if (!reload) return;

    const rounds = Math.round(player.usesSkills.passives['reload.kill-chain'] ?? 0);
    if (rounds <= 0) return;

    reload.chainRounds += rounds;
    // A live clip takes the round now; an empty one mid-reload is owed it (above).
    if (reload.reloadingMs <= 0 && reload.ammo > 0) reload.ammo += rounds;
    markSliceDirty(world, player, 'usesReload');
  });
}
