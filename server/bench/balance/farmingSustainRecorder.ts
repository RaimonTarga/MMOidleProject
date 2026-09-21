import { composePlayerView, getResource, getCooldown, GAME_CONFIG } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../src/ecs/entity';
import type { World } from '../../src/world/World';
import { activeRecoveryFraction } from '../../src/systems/defense/regen/recovery';
import { isPlayerInCombat, playerCombatPhase } from '../../src/systems/combat/ai/engagement';
import { isPlayerInHazardousNodeFeature } from '../../src/systems/world/nodeFeatures';

/** Read-only tick-boundary observations; never modifies combat or healing. */
export function sustainState(world: World, bot: PlayerEntity, now: number) {
  const view = composePlayerView(bot)!;
  return { hp: view.hp, maxHp: view.maxHp, barrier: view.barrier, recovery: bot.hasHealth.recovery,
    stance: bot.tracksProgression.activeStance, phase: playerCombatPhase(world, bot, now),
    activeFraction: activeRecoveryFraction(bot, isPlayerInCombat(bot, now), isPlayerInHazardousNodeFeature(world, bot)),
    killWindowMs: getResource(bot.tracksCombat, 'recovery.killMs'),
    killFraction: getResource(bot.tracksCombat, 'recovery.killPct'),
    killDurationMs: bot.usesSkills.passives['defense.recovery-on-kill-ms'] ?? GAME_CONFIG.RECOVERY_ON_KILL_MS,
    switchCooldownMs: getCooldown(bot.tracksCombat, 'stance.switch.cd'), autoIntent: view.autoIntent };
}
export class FarmingSustainRecorder {
  private previous: ReturnType<typeof sustainState>;
  readonly transitions: unknown[] = [];
  readonly recuperatingMs = { ACTIVE: 0, POST_COMBAT: 0, OUT_OF_COMBAT: 0 };
  killWindowObservedMs = 0;
  observedKillWindowStartsOrRefreshes = 0;
  cooldownDelayedReturnObservedMs = 0;
  minimumBarrier: number;
  minimumHp: number;
  fractionIntegral = 0;
  measuredMs = 0;
  constructor(private world: World, private bot: PlayerEntity, now: number) {
    this.previous = sustainState(world, bot, now);
    this.minimumBarrier = this.previous.barrier; this.minimumHp = this.previous.hp;
  }
  afterTick(atMs: number, now: number) {
    const s = sustainState(this.world, this.bot, now);
    this.measuredMs += 100; this.fractionIntegral += s.activeFraction * 100;
    this.minimumBarrier = Math.min(this.minimumBarrier, s.barrier); this.minimumHp = Math.min(this.minimumHp, s.hp);
    if (s.killWindowMs > 0) this.killWindowObservedMs += 100;
    if (s.killWindowMs > this.previous.killWindowMs) this.observedKillWindowStartsOrRefreshes++;
    if (s.stance === 'recuperating-stance') {
      this.recuperatingMs[s.phase] += 100;
      if (s.hp / s.maxHp > 0.25 && s.switchCooldownMs > 0) this.cooldownDelayedReturnObservedMs += 100;
    }
    if (s.stance !== this.previous.stance || s.phase !== this.previous.phase || JSON.stringify(s.autoIntent) !== JSON.stringify(this.previous.autoIntent))
      this.transitions.push({ atMs, fromStance: this.previous.stance, ...s });
    this.previous = s;
  }
  finish() {
    return { units: { time: 'ms', health: 'HP', fraction: 'fraction' },
      observation: '100ms post-tick samples; transitions may occur within a tick; refresh count is a lower bound',
      measuredMs: this.measuredMs, recuperatingMs: this.recuperatingMs,
      killWindowObservedMs: this.killWindowObservedMs, observedKillWindowStartsOrRefreshes: this.observedKillWindowStartsOrRefreshes,
      cooldownDelayedReturnObservedMs: this.cooldownDelayedReturnObservedMs,
      minimumBarrier: this.minimumBarrier, minimumHp: this.minimumHp, terminal: this.previous,
      meanObservedActiveFraction: this.measuredMs ? this.fractionIntegral / this.measuredMs : null,
      sourceSpecificHealingHp: null, overhealHp: null, counterfactualDamageLostHp: null,
      unavailableReasons: { healing: 'Existing heal events round applied HP, omit sub-1 HP applications, and do not label Recovery source; use them as recorded healing only.',
        overheal: 'Not emitted by existing stream', damageLost: 'Counterfactual damage is not observable; compare paired completed progress and actual damage during stance intervals.' } };
  }
}
