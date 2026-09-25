import assert from 'node:assert/strict';
import { ABILITY_DATABASE, ABILITY_RECIPE_DATABASE, isAbilityRecipeUnlocked, resolveAbilityEffectWithPassives,
  modifiedAbilityCooldownMs, referenceAbilityRule, getCooldown, getStatusEffect, guardEffectIdForAbility, composePlayerView } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../src/ecs/entity';
import type { World } from '../../src/world/World';
import { registerCombatListener, unregisterCombatListener, type CombatEventHandler } from '../../src/systems/combat/engine/combatPipeline';
import { isHardControlled } from '../../src/systems/combat/status/playerHardControl';

export function guardCoverageReadback(bot: PlayerEntity) {
  const p = bot.tracksProgression;
  return p.attunedAbilities.guards.map(id => {
    const ability = ABILITY_DATABASE.get(id)!;
    const recipe = [...ABILITY_RECIPE_DATABASE.values()].find(r => r.abilityId === id)!;
    assert(recipe && isAbilityRecipeUnlocked(recipe, p), `Native learnability failed: ${id}`);
    assert(p.knownAbilities.includes(id));
    return { id, recipeId: recipe.id, recipeGroup: recipe.recipeGroup, requiredMastery: recipe.requiredBiomeLevel,
      actualMastery: recipe.recipeGroup ? p.biomeLevel[recipe.recipeGroup] : null, cost: ability.attunementCost,
      referenceWiring: referenceAbilityRule(id), effect: resolveAbilityEffectWithPassives(ability, p.playerTier, bot.usesSkills.passives),
      cooldownMs: modifiedAbilityCooldownMs(ability, p.playerTier, bot.usesSkills.passives) };
  });
}

/** Opt-in bench observation only. Existing activation/damage events remain authoritative. */
export class GuardCoverageRecorder {
  readonly events: unknown[] = [];
  private activeMs = { brace: 0, endure: 0, overlap: 0 };
  private casts: Record<string, number> = {};
  private hpOpportunityMs = 0;
  private readyOpportunityMs = 0;
  private preTick: ReturnType<GuardCoverageRecorder['state']> | null = null;
  private lastDamage: unknown = null;
  private handler: CombatEventHandler;
  constructor(private world: World, private bot: PlayerEntity) {
    // Registered after production listeners, without mutating their context.
    this.handler = (ctx, w) => {
      if (w !== this.world || ctx.defender !== this.bot) return;
      const sample = { kind: 'incoming-pipeline', atMs: Date.now() - 1800000000000,
        pipelineDamage: ctx.damage, state: this.state() };
      this.lastDamage = sample;
      this.events.push(sample);
    };
    registerCombatListener('onDamageTaken', this.handler);
  }
  state() {
    const b = this.bot, v = composePlayerView(b)!;
    const guards = Object.fromEntries(['brace', 'endure'].map(id => {
      const effect = getStatusEffect(b.tracksCombat, guardEffectIdForAbility(id)!);
      return [id, { attuned: b.tracksProgression.attunedAbilities.guards.includes(id),
        remainingMs: effect?.remainingMs ?? 0, drPct: effect?.data.drPct ?? 0,
        cooldownMs: getCooldown(b.tracksCombat, `ability.cd.${id}`) }];
    }));
    return { hp: v.hp, maxHp: v.maxHp, barrier: v.barrier, guards,
      hardControlled: isHardControlled(b.tracksCombat), auto: b.usesAutocombat.auto,
      guardWindowMs: getCooldown(b.tracksCombat, 'ability.guard.window'),
      effects: structuredClone(b.tracksCombat.statusEffects),
      recoveryWindows: Object.fromEntries(Object.entries(b.tracksCombat.resources).filter(([k]) => k.startsWith('recovery.'))),
      abilityCooldowns: Object.fromEntries(Object.entries(b.tracksCombat.cooldowns).filter(([k]) => k.startsWith('ability.'))) };
  }
  beforeTick() { this.preTick = this.state(); }
  afterTick(atMs: number) {
    const s = this.state();
    const brace = s.guards.brace.remainingMs > 0, endure = s.guards.endure.remainingMs > 0;
    if (brace) this.activeMs.brace += 100;
    if (endure) this.activeMs.endure += 100;
    if (brace && endure) this.activeMs.overlap += 100;
    const p = this.preTick!;
    if (p.guards.endure.attuned && p.hp / p.maxHp <= 0.7) {
      this.hpOpportunityMs += 100;
      if (p.guards.endure.cooldownMs <= 100 && !p.hardControlled && p.auto) this.readyOpportunityMs += 100;
    }
    const activations = this.world.worldLogJournal.filter(e => e.kind === 'ability-activation' && e.player.id === this.bot.isPlayer.id && e.slot === 'guard');
    for (const e of activations) {
      if (e.kind !== 'ability-activation') continue;
      this.casts[e.abilityId] = (this.casts[e.abilityId] ?? 0) + 1;
    }
    // The external raw stream exposes cooldown/status context each tick.
    this.events.push({ kind: 'tick', atMs, before: p, after: s, activations });
  }
  finish() {
    unregisterCombatListener('onDamageTaken', this.handler);
    return { casts: this.casts, activeMs: this.activeMs, hpThresholdOpportunityMs: this.hpOpportunityMs,
      readyOpportunityMs: this.readyOpportunityMs, terminal: this.state(), beforeTerminalTick: this.preTick,
      lastIncomingPipeline: this.lastDamage,
      observation: 'Active time: 100ms post-tick samples. Opportunities: pre-tick HP/cooldown/control samples, not exact firing decisions. Incoming pipeline state is captured synchronously after production mitigation; pipelineDamage is not HP damage. Match to existing damage/death events. Non-pipeline damage may bypass this observer.' };
  }
}
