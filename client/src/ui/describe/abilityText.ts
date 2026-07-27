import {
  abilityTierScale,
  resolveAbilityEffect,
  TECHNIQUE_POWER_FIELDS,
  type AbilityDef,
  type AbilityEffectSpec,
  type AbilityTrigger,
} from '@mmo-idle/shared';

/**
 * Abilities, in numbers.
 *
 * The authored effect is only half the story: magnitudes deepen with player tier
 * and Technique Power, cooldowns shrink with cooldown reduction, casts shorten
 * with cast speed, and Guard buffs scale with potency/duration. This module
 * reproduces exactly those layers so a player reads the value their character
 * actually applies — with the authored base and every multiplier in the
 * tooltip, never hidden.
 *
 * The magnitude layer goes through `resolveAbilityEffect`, the same shared seam
 * the server uses. The fire-time Guard layers are reproduced here because the
 * server applies them at fire time rather than in the shared resolver; the caps
 * below mirror `abilityFiring.ts` and must move together with it.
 */

/** Mirrors GUARD_DR_CAP in server/src/systems/player/abilities. */
const GUARD_DR_CAP = 0.9;
/** Mirrors CD_REDUCTION_CAP (technique) and the inline guard cap. */
const CD_REDUCTION_CAP = 0.9;
/** Mirrors CAST_SPEED_CAP in abilityCasting.ts. */
const CAST_SPEED_CAP = 0.6;
/** Mirrors DEFAULT_HEAL_DURATION_MS in abilityFiring.ts. */
const DEFAULT_HEAL_DURATION_MS = 4000;

export interface AbilityContext {
  playerTier: number;
  passives: Record<string, number>;
  /** Current attack power, for turning a damage multiplier into real damage. */
  attack?: number;
  /** Current max HP, for turning a heal percentage into real health. */
  maxHp?: number;
}

export interface AbilityLine {
  key: string;
  label: string;
  /** The value this character actually applies. */
  value: string;
  /** Authored value → effective, plus each multiplier. Undefined when unscaled. */
  breakdown?: string;
}

export interface AbilityDescription {
  /** When it fires, in a sentence. */
  trigger: string;
  /** How the server runs it, in a sentence. */
  shape: string;
  lines: AbilityLine[];
}

// ── Formatting ────────────────────────────────────────────────────────────────

const round = (value: number, digits = 2): string => {
  const factor = 10 ** digits;
  return String(Math.round(value * factor) / factor);
};

const pct = (value: number): string => `${Math.round(value * 1000) / 10}%`;
const seconds = (ms: number): string => `${round(ms / 1000)}s`;

// ── Effect fields ─────────────────────────────────────────────────────────────

type EffectFieldFormat = 'pct' | 'mult' | 'ms' | 'px' | 'count' | 'flat';

interface EffectFieldMeta {
  label: string;
  format: EffectFieldFormat;
  /** Turns a relative magnitude into an absolute one, when context allows. */
  absolute?: (value: number, context: AbilityContext) => string | null;
}

const damageFromAttack = (mult: number, context: AbilityContext): string | null =>
  context.attack !== undefined ? `${Math.round(context.attack * mult)} damage` : null;

const healFromMaxHp = (fraction: number, context: AbilityContext): string | null =>
  context.maxHp !== undefined ? `${Math.round(context.maxHp * fraction)} HP` : null;

const EFFECT_FIELDS: Record<string, EffectFieldMeta> = {
  splashPct: { label: 'Splash damage', format: 'pct' },
  radius: { label: 'Splash radius', format: 'px' },
  damageMult: { label: 'Damage', format: 'mult', absolute: damageFromAttack },
  damageTakenPct: { label: 'Damage taken by target', format: 'pct' },
  durationMs: { label: 'Duration', format: 'ms' },
  distance: { label: 'Dash distance', format: 'px' },
  empowerMult: { label: 'Next attack', format: 'mult', absolute: damageFromAttack },
  platingBonus: { label: 'Plating gained', format: 'flat' },
  reflectFlat: { label: 'Reflected per hit', format: 'flat' },
  drPct: { label: 'Damage reduction', format: 'pct' },
  knockbackResistPct: { label: 'Knockback resist', format: 'pct' },
  stacks: { label: 'Debuff stacks removed', format: 'count' },
  healPct: { label: 'Health restored', format: 'pct', absolute: healFromMaxHp },
};

/** Field order per effect kind — magnitude first, then the shape of the effect. */
const EFFECT_FIELD_ORDER: Record<AbilityEffectSpec['kind'], string[]> = {
  cleave: ['splashPct', 'radius'],
  empower: ['damageMult'],
  'cast-strike': ['damageMult', 'radius'],
  'expose-weakness': ['damageTakenPct', 'durationMs'],
  reposition: ['distance', 'empowerMult'],
  bramble: ['platingBonus', 'reflectFlat', 'durationMs'],
  'damage-reduction': ['drPct', 'knockbackResistPct', 'durationMs'],
  cleanse: ['stacks', 'drPct', 'durationMs'],
  heal: ['healPct', 'durationMs'],
};

function formatField(
  field: string,
  value: number,
  context: AbilityContext,
): string {
  const meta = EFFECT_FIELDS[field];
  const absolute = meta.absolute?.(value, context);
  const base = (() => {
    switch (meta.format) {
      case 'pct': return pct(value);
      case 'mult': return `×${round(value)}`;
      case 'ms': return seconds(value);
      case 'px': return `${Math.round(value)}px`;
      case 'count': return String(Math.round(value));
      case 'flat': return String(Math.round(value));
    }
  })();
  return absolute ? `${base} (${absolute})` : base;
}

// ── Guard fire-time layers ────────────────────────────────────────────────────

/**
 * The Guard buff scaling the server applies when the ability fires, on top of
 * the shared resolver. Only the damage-reduction buff is affected — heal and
 * bramble magnitudes are applied as authored (after tier deepening).
 */
function applyGuardLayers(
  effect: AbilityEffectSpec,
  passives: Record<string, number>,
): AbilityEffectSpec {
  const potency = Math.max(0, passives['guard.potency-pct'] ?? 0);
  const durationBonus = Math.max(0, passives['guard.duration-pct'] ?? 0);
  if (potency === 0 && durationBonus === 0) return effect;

  if (effect.kind === 'damage-reduction') {
    return {
      ...effect,
      drPct: Math.min(GUARD_DR_CAP, effect.drPct * (1 + potency)),
      durationMs: Math.round(effect.durationMs * (1 + durationBonus)),
      ...(effect.knockbackResistPct !== undefined
        ? { knockbackResistPct: Math.min(GUARD_DR_CAP, effect.knockbackResistPct * (1 + potency)) }
        : {}),
    };
  }
  if (effect.kind === 'cleanse' && effect.drPct !== undefined) {
    return {
      ...effect,
      drPct: Math.min(GUARD_DR_CAP, effect.drPct * (1 + potency)),
      ...(effect.durationMs !== undefined
        ? { durationMs: Math.round(effect.durationMs * (1 + durationBonus)) }
        : {}),
    };
  }
  return effect;
}

/** Which fire-time multiplier, if any, a Guard field picked up. */
function guardLayerFor(
  effect: AbilityEffectSpec,
  field: string,
  passives: Record<string, number>,
): { label: string; mult: number } | null {
  const isDrBuff = effect.kind === 'damage-reduction'
    || (effect.kind === 'cleanse' && effect.drPct !== undefined);
  if (!isDrBuff) return null;
  const potency = Math.max(0, passives['guard.potency-pct'] ?? 0);
  const durationBonus = Math.max(0, passives['guard.duration-pct'] ?? 0);
  if ((field === 'drPct' || field === 'knockbackResistPct') && potency > 0) {
    return { label: 'Guard potency', mult: 1 + potency };
  }
  if (field === 'durationMs' && durationBonus > 0) {
    return { label: 'Guard duration', mult: 1 + durationBonus };
  }
  return null;
}

// ── Sentences ─────────────────────────────────────────────────────────────────

export function triggerSentence(trigger: AbilityTrigger): string {
  switch (trigger.kind) {
    case 'in-combat':
      return 'Fires whenever you are in combat and off cooldown.';
    case 'hp-below':
      return `Fires when your health drops to ${pct(trigger.hpPct)} or below.`;
    case 'n-aggro':
      return `Fires when ${trigger.count} or more enemies are attacking you.`;
    case 'has-debuff':
      return 'Fires while you are carrying a debuff or damage-over-time effect.';
  }
}

const SHAPE_SENTENCES: Record<AbilityDef['shape'], string> = {
  armed: 'Arms your next qualifying attack — the payload lands when that attack hits.',
  cast: 'Winds up on the spot. You stop attacking while it charges, and hard control breaks it.',
  reposition: 'Resolves instantly by moving you relative to your current target.',
  instant: 'Resolves immediately on yourself the moment it fires.',
};

// ── Entry point ───────────────────────────────────────────────────────────────

export function describeAbility(
  ability: AbilityDef,
  context: AbilityContext,
): AbilityDescription {
  const techniquePowerPct = Math.max(0, context.passives['technique.power-pct'] ?? 0);
  const tierMult = abilityTierScale(ability, context.playerTier);
  const powerFields = TECHNIQUE_POWER_FIELDS[ability.effect.kind] ?? [];

  const resolved = applyGuardLayers(
    resolveAbilityEffect(ability, { playerTier: context.playerTier, techniquePowerPct }),
    context.passives,
  );

  const lines: AbilityLine[] = [];
  for (const field of EFFECT_FIELD_ORDER[ability.effect.kind]) {
    const authored = (ability.effect as unknown as Record<string, number | undefined>)[field];
    const effective = (resolved as unknown as Record<string, number | undefined>)[field];
    if (authored === undefined && effective === undefined) continue;
    // Cleanse authors an optional duration; heal falls back to the server default.
    const value = effective ?? authored!;
    const base = authored ?? value;

    const multipliers: string[] = [];
    if (tierMult !== 1 && base !== value) {
      multipliers.push(`×${round(tierMult)} tier deepening (T${ability.tier} → T${context.playerTier})`);
    }
    if (powerFields.includes(field) && techniquePowerPct > 0) {
      multipliers.push(`×${round(1 + techniquePowerPct)} Technique Power`);
    }
    const guardLayer = guardLayerFor(resolved, field, context.passives);
    if (guardLayer) multipliers.push(`×${round(guardLayer.mult)} ${guardLayer.label}`);

    lines.push({
      key: field,
      label: EFFECT_FIELDS[field].label,
      value: formatField(field, value, context),
      breakdown: multipliers.length > 0
        ? `Authored ${formatField(field, base, context)} · ${multipliers.join(' · ')}`
        : undefined,
    });
  }

  // Heal has an authored-optional duration the server defaults; state it rather
  // than leaving "how long is this heal" unanswered.
  if (ability.effect.kind === 'heal' && ability.effect.durationMs === undefined) {
    lines.push({
      key: 'durationMs',
      label: 'Duration',
      value: seconds(DEFAULT_HEAL_DURATION_MS),
    });
  }

  lines.push(...timingLines(ability, context));

  return {
    trigger: triggerSentence(ability.trigger),
    shape: SHAPE_SENTENCES[ability.shape],
    lines,
  };
}

/** Cooldown and cast time, after the passives that shorten them. */
function timingLines(ability: AbilityDef, context: AbilityContext): AbilityLine[] {
  const lines: AbilityLine[] = [];
  const isTechnique = ability.slot === 'technique';
  const reductionKey = isTechnique
    ? 'technique.cooldown-reduction-pct'
    : 'guard.cooldown-reduction-pct';
  const reduction = Math.min(
    CD_REDUCTION_CAP,
    Math.max(0, context.passives[reductionKey] ?? 0),
  );
  const cooldownMs = ability.cooldownMs * (1 - reduction);
  lines.push({
    key: 'cooldown',
    label: 'Cooldown',
    value: seconds(cooldownMs),
    breakdown: reduction > 0
      ? `Authored ${seconds(ability.cooldownMs)} · −${pct(reduction)} cooldown reduction`
      : undefined,
  });

  if (ability.shape === 'cast' && ability.castMs !== undefined) {
    const castReduction = Math.min(
      CAST_SPEED_CAP,
      Math.max(0, context.passives['technique.cast-speed-pct'] ?? 0),
    );
    lines.push({
      key: 'cast',
      label: 'Wind-up',
      value: seconds(ability.castMs * (1 - castReduction)),
      breakdown: castReduction > 0
        ? `Authored ${seconds(ability.castMs)} · −${pct(castReduction)} cast speed`
        : undefined,
    });
  }

  return lines;
}

/** Terse one-line form for dense rows, e.g. "78% splash · 4s cooldown". */
export function abilitySummary(ability: AbilityDef, context: AbilityContext): string {
  return describeAbility(ability, context)
    .lines.slice(0, 2)
    .map((line) => `${line.value} ${line.label.toLowerCase()}`)
    .join(' · ');
}
