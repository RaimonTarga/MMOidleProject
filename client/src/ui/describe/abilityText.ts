import {
  abilityCastMs,
  abilityCooldownMs,
  abilityMaxRank,
  abilityRangeBonus,
  abilityRankAt,
  abilityRankNumber,
  abilityRankNumeral,
  resolveAbilityEffect,
  TECHNIQUE_POWER_FIELDS,
  type AbilityDef,
  type AbilityEffectSpec,
  type AbilityTrigger,
} from '@mmo-idle/shared';

/**
 * Abilities, in numbers.
 *
 * The authored rank is only half the story: offensive payloads grow with
 * Technique Power, cooldowns shrink with cooldown reduction, casts shorten with
 * cast speed, and Guard buffs scale with potency/duration. This module reproduces
 * exactly those layers so a player reads the value their character actually
 * applies — with the authored base and every multiplier in the tooltip, never
 * hidden.
 *
 * Progression is AUTHORED, not scaled: the ability shows its current rank, and
 * every number here comes from that rank. There is deliberately no generic
 * "×1.45 tier deepening" line any more, because there is no such multiplier —
 * rank IV of Sweep is 100% splash on a 5 s cooldown because that is what rank IV
 * says, not because rank I was multiplied by anything.
 *
 * The magnitude layer goes through `resolveAbilityEffect`, the same shared seam
 * the server uses. The fire-time Guard layers are reproduced here because the
 * server applies them at fire time rather than in the shared resolver; the caps
 * below mirror `abilityFiring.ts` and must move together with it.
 */

/** Mirrors GUARD_DR_CAP in server/src/systems/player/abilities. */
const GUARD_DR_CAP = 0.9;
/** Mirrors CD_REDUCTION_CAP (technique) and the guard cap in abilityCooldowns.ts. */
const CD_REDUCTION_CAP = 0.9;
/** Mirrors CAST_SPEED_CAP in abilityCasting.ts. */
const CAST_SPEED_CAP = 0.6;

export interface AbilityContext {
  playerTier: number;
  passives: Record<string, number>;
  /** Current attack power, for turning a damage multiplier into real damage. */
  attack?: number;
  /** Current max HP, for turning a heal percentage into real health. */
  maxHp?: number;
  /** Current attack range, for showing what an ability's reach adds up to. */
  attackRange?: number;
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
  /** Rank numeral for this character, e.g. "III". */
  rank: string;
  /** "Rank III of IV" — how much of the lineage is still ahead. */
  rankLabel: string;
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
  stacks: { label: 'Stacks removed', format: 'count' },
  debuffs: { label: 'Afflictions cleansed', format: 'count' },
  recoveryPct: { label: 'Recovery activated', format: 'pct' },
  slowPct: { label: 'Movement slow', format: 'pct' },
  slowDurationMs: { label: 'Slow duration', format: 'ms' },
  rootMs: { label: 'Root duration', format: 'ms' },
  stunMs: { label: 'Stun duration', format: 'ms' },
  attackSpeedPct: { label: 'Attack speed', format: 'pct' },
  controlResistPct: { label: 'Control resistance', format: 'pct' },
  controlResistMs: { label: 'Resistance duration', format: 'ms' },
};

/** Field order per effect kind — magnitude first, then the shape of the effect. */
const EFFECT_FIELD_ORDER: Record<AbilityEffectSpec['kind'], string[]> = {
  cleave: ['splashPct', 'radius'],
  empower: ['damageMult'],
  'cast-strike': ['damageMult', 'stunMs', 'radius'],
  'expose-weakness': ['damageTakenPct', 'durationMs'],
  'slow-strike': ['damageMult', 'slowPct', 'slowDurationMs'],
  'root-strike': ['damageMult', 'rootMs'],
  reposition: ['distance', 'empowerMult'],
  bramble: ['platingBonus', 'reflectFlat', 'durationMs'],
  'damage-reduction': ['drPct', 'knockbackResistPct', 'durationMs'],
  cleanse: ['stacks', 'debuffs'],
  heal: ['recoveryPct', 'durationMs'],
  'attack-speed': ['attackSpeedPct', 'durationMs'],
  'break-free': ['controlResistPct', 'controlResistMs'],
};

function formatField(
  field: string,
  value: number,
  context: AbilityContext,
): string {
  const meta = EFFECT_FIELDS[field];
  const absolute = meta.absolute?.(value, context);
  const base = ((): string => {
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
 * The Guard buff scaling the server applies when the ability fires, on top of the
 * shared resolver. Only the damage-reduction buff is affected — Recovery skills
 * take `recovery-skill-potency` instead, and cleanse/break-free are DISCRETE and
 * must never be scaled by a percentage stat.
 */
function applyGuardLayers(
  effect: AbilityEffectSpec,
  passives: Record<string, number>,
): AbilityEffectSpec {
  if (effect.kind !== 'damage-reduction') return effect;
  const potency = Math.max(0, passives['guard.potency-pct'] ?? 0);
  const durationBonus = Math.max(0, passives['guard.duration-pct'] ?? 0);
  if (potency === 0 && durationBonus === 0) return effect;
  return {
    ...effect,
    drPct: Math.min(GUARD_DR_CAP, effect.drPct * (1 + potency)),
    durationMs: Math.round(effect.durationMs * (1 + durationBonus)),
    ...(effect.knockbackResistPct !== undefined
      ? { knockbackResistPct: Math.min(GUARD_DR_CAP, effect.knockbackResistPct * (1 + potency)) }
      : {}),
  };
}

/** Recovery skills take their own potency stat, and only when tagged `recovery`. */
function applyRecoveryLayer(
  ability: AbilityDef,
  effect: AbilityEffectSpec,
  passives: Record<string, number>,
): AbilityEffectSpec {
  if (effect.kind !== 'heal' || !ability.tags.includes('recovery')) return effect;
  const potency = Math.max(0, passives['defense.recovery-skill-potency'] ?? 0);
  if (potency === 0) return effect;
  return { ...effect, recoveryPct: effect.recoveryPct * (1 + potency) };
}

/** Which fire-time multiplier, if any, a field picked up. */
function fireTimeLayerFor(
  ability: AbilityDef,
  effect: AbilityEffectSpec,
  field: string,
  passives: Record<string, number>,
): { label: string; mult: number } | null {
  if (effect.kind === 'damage-reduction') {
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
  if (effect.kind === 'heal' && field === 'recoveryPct' && ability.tags.includes('recovery')) {
    const potency = Math.max(0, passives['defense.recovery-skill-potency'] ?? 0);
    if (potency > 0) return { label: 'Recovery skill potency', mult: 1 + potency };
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
    case 'has-hard-control':
      return 'Fires while you are stunned or otherwise held — it works through hard control.';
    case 'target-beyond-reach':
      return `Fires when a reachable target is at least ${Math.round(trigger.minGapPx)}px away, so the gap is worth closing.`;
    case 'enemy-within':
      return `Fires when an enemy closes to within ${Math.round(trigger.maxGapPx)}px.`;
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
  const rank = abilityRankAt(ability, context.playerTier);
  const authored = rank.effect;
  const powerFields = TECHNIQUE_POWER_FIELDS[authored.kind] ?? [];

  const resolved = applyRecoveryLayer(
    ability,
    applyGuardLayers(
      resolveAbilityEffect(ability, { playerTier: context.playerTier, techniquePowerPct }),
      context.passives,
    ),
    context.passives,
  );

  const lines: AbilityLine[] = [];
  for (const field of EFFECT_FIELD_ORDER[authored.kind]) {
    const base = (authored as unknown as Record<string, number | undefined>)[field];
    const effective = (resolved as unknown as Record<string, number | undefined>)[field];
    if (base === undefined && effective === undefined) continue;
    const value = effective ?? base!;

    const multipliers: string[] = [];
    if (powerFields.includes(field) && techniquePowerPct > 0) {
      multipliers.push(`×${round(1 + techniquePowerPct)} Technique Power`);
    }
    const layer = fireTimeLayerFor(ability, resolved, field, context.passives);
    if (layer) multipliers.push(`×${round(layer.mult)} ${layer.label}`);

    lines.push({
      key: field,
      label: EFFECT_FIELDS[field].label,
      value: formatField(field, value, context),
      breakdown: multipliers.length > 0
        ? `Authored ${formatField(field, base ?? value, context)} · ${multipliers.join(' · ')}`
        : undefined,
    });
  }

  lines.push(...reachLines(ability, context));
  lines.push(...timingLines(ability, context));

  const rankNumber = abilityRankNumber(ability, context.playerTier);
  const maxRank = abilityMaxRank(ability);
  return {
    rank: abilityRankNumeral(rankNumber),
    rankLabel:
      rankNumber >= maxRank
        ? `Rank ${abilityRankNumeral(rankNumber)} — fully deepened`
        : `Rank ${abilityRankNumeral(rankNumber)} of ${abilityRankNumeral(maxRank)}`,
    trigger: triggerSentence(ability.trigger),
    shape: SHAPE_SENTENCES[ability.shape],
    lines,
  };
}

/**
 * How far the ability itself reaches. Shown only when it exceeds the player's own
 * reach, because that extra distance IS the ability — it is what makes a
 * gap-closer worth a slot and what lets a melee build hold a ranged tool.
 */
function reachLines(ability: AbilityDef, context: AbilityContext): AbilityLine[] {
  const bonus = abilityRangeBonus(ability, context.playerTier);
  if (bonus <= 0) return [];
  const total =
    context.attackRange !== undefined ? Math.round(context.attackRange + bonus) : null;
  return [{
    key: 'rangeBonus',
    label: 'Ability reach',
    value: total !== null ? `${total}px` : `+${Math.round(bonus)}px`,
    breakdown:
      total !== null
        ? `Your ${Math.round(context.attackRange!)}px attack range · +${Math.round(bonus)}px from this ability`
        : undefined,
  }];
}

/** Cooldown and cast time, after the passives that shorten them. */
function timingLines(ability: AbilityDef, context: AbilityContext): AbilityLine[] {
  const lines: AbilityLine[] = [];
  const isTechnique = ability.slot === 'technique';
  const reductionKey = isTechnique
    ? 'technique.cooldown-reduction-pct'
    : 'guard.cooldown-reduction-pct';
  let reduction = Math.max(0, context.passives[reductionKey] ?? 0);
  if (isTechnique && ability.tags.includes('mobility')) {
    reduction += Math.max(0, context.passives['core.mobility-cooldown-reduction-pct'] ?? 0);
  }
  reduction = Math.min(CD_REDUCTION_CAP, reduction);

  const authoredCd = abilityCooldownMs(ability, context.playerTier);
  lines.push({
    key: 'cooldown',
    label: 'Cooldown',
    value: seconds(authoredCd * (1 - reduction)),
    breakdown: reduction > 0
      ? `Authored ${seconds(authoredCd)} · −${pct(reduction)} cooldown reduction`
      : undefined,
  });

  const authoredCast = abilityCastMs(ability, context.playerTier);
  if (ability.shape === 'cast' && authoredCast > 0) {
    const castReduction = Math.min(
      CAST_SPEED_CAP,
      Math.max(0, context.passives['technique.cast-speed-pct'] ?? 0),
    );
    lines.push({
      key: 'cast',
      label: 'Wind-up',
      value: seconds(authoredCast * (1 - castReduction)),
      breakdown: castReduction > 0
        ? `Authored ${seconds(authoredCast)} · −${pct(castReduction)} cast speed`
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
