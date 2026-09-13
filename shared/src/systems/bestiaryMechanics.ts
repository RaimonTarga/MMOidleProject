import type {
  BossAction,
  MonsterAbility,
  MonsterAbilityAction,
  MonsterDefinition,
  StageAction,
} from '../data/monsters/types';
import type { BossPattern, BossPatternStep } from '../data/monsters/bossPatterns';
import { MONSTER_DATABASE, monsterIsRanged, monsterKites } from '../data/monsters';
import type { DungeonMonsterModifiers } from '../dungeons/dungeonTypes';
import { resolveMonsterDotDebuff } from './monsterDotFlavor';

// ─── Bestiary mechanic descriptors ───────────────────────────────────────────
// Turns a MonsterDefinition (+ any applied dungeon modifiers) into human-readable
// lines describing its secondary mechanics. Kept in shared so the text describing
// a field stays next to the field's authoritative meaning and both the compact
// list and detail view render the same wording.

export interface MechanicLine {
  /** Stable key for React lists. */
  id: string;
  /** Short glyph for the compact panel row. */
  icon: string;
  /** Short label (used as the tooltip headline / detail title). */
  label: string;
  /** Full description for the detail view. */
  detail: string;
  /** Accent color (hex string) when one is meaningful (e.g. DoT element). */
  color?: string;
  /** Ability lines are separated into the detailed cast/encounter panel. */
  category?: 'trait' | 'ability';
}

export type BestiaryAbilityKind = 'cast' | 'sequence' | 'passive' | 'encounter';

/** One authored ability or encounter beat shown in the bestiary ability panel. */
export interface BestiaryAbilityLine {
  /** Stable key for React lists. */
  id: string;
  /** Display name. */
  name: string;
  /** Short glyph for the card header. */
  icon: string;
  /** Whether this is a cast, an ordered sequence, a passive beat, or an encounter. */
  kind: BestiaryAbilityKind;
  /** Single wind-up duration, when the ability has one. */
  castMs?: number;
  /** Repeat interval, when the ability has one. */
  cooldownMs?: number;
  /** First-use delay on a fresh combat session, when it differs from cooldown. */
  initialCooldownMs?: number;
  /** Human-readable trigger such as "At 50% HP" or "On first aggro". */
  trigger?: string;
  /** Short explanation of the ability's purpose. */
  detail: string;
  /** Ordered sub-steps for a boss pattern or staged encounter. */
  steps?: string[];
  /** Accent color when the ability has a strong theme. */
  color?: string;
}

function fmtMs(ms: number): string {
  if (ms % 1000 === 0) return `${ms / 1000}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtPct(frac: number): string {
  return `${Math.round(frac * 100)}%`;
}

function fmtMult(mult: number): string {
  return `${Number.isInteger(mult) ? mult : mult.toFixed(2)}×`;
}

function fmtNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function readableId(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function monsterLabel(id: string): string {
  return MONSTER_DATABASE.get(id)?.name ?? readableId(id);
}

function statusLabel(id: string, abilityName?: string): string {
  if (abilityName === 'Constrict') return 'Constrict root';
  const known: Record<string, string> = {
    'sun-mark': 'Sun Mark',
    slow: 'Slow',
    'dot-frozen': 'Frozen',
    antiheal: 'Wither',
    'tundra-chill': 'Chill',
  };
  return known[id] ?? readableId(id);
}

function describePlayerEffect(
  effect: { kind: 'slow'; speedMult: number; durationMs: number } |
    { kind: 'antiheal'; reduction: number; durationMs: number } |
    { kind: 'vulnerability'; damageTakenPct: number; durationMs: number } |
    undefined,
): string {
  if (!effect) return '';
  if (effect.kind === 'slow') return `, slowing you to ${fmtPct(effect.speedMult)} for ${fmtMs(effect.durationMs)}`;
  if (effect.kind === 'antiheal') return `, reducing your healing by ${fmtPct(effect.reduction)} for ${fmtMs(effect.durationMs)}`;
  return `, increasing your damage taken by ${fmtPct(effect.damageTakenPct)} for ${fmtMs(effect.durationMs)}`;
}

/**
 * One clause per authored ability action.
 *
 * Each clause names its OWN target. `MonsterAbility.target` only says where an
 * area action plants ('self' = at the caster's feet), so it must never be read as
 * who the ability hurts — a `target: 'self'` body sweep still lands on the player.
 */
function describeMonsterAbilityAction(action: MonsterAbilityAction): string {
  const effect = action.type === 'hit' || action.type === 'area-hit' ? action.effect : undefined;
  const effectText = describePlayerEffect(effect);
  const knockback = action.type === 'hit' || action.type === 'area-hit'
    ? action.knockback ? `, knocking you back ${action.knockback.distance}px` : ''
    : '';
  const stun = action.type === 'area-hit' && action.stunMs
    ? `, stunning for ${fmtMs(action.stunMs)}`
    : '';
  if (action.type === 'hit') return `hits you for ${fmtMult(action.multiplier)}${effectText}${knockback}`;
  if (action.type === 'area-hit') return `hits a ${action.radius}px circle for ${fmtMult(action.multiplier)}${effectText}${stun}${knockback}`;
  if (action.type === 'attack-speed-buff') {
    const count = action.attacks !== undefined
      ? ` for its next ${Math.max(1, Math.round(action.attacks))} attacks`
      : ` for ${fmtMs(action.durationMs)}`;
    return `gains +${fmtPct(action.attackSpeedPct)} attack speed${count}`;
  }
  if (action.type === 'plating-shred') {
    const plural = action.stacks === 1 ? 'stack' : 'stacks';
    return `strips ${action.stacks} ${plural} of your plating`;
  }
  const shatter = action.shatter
    ? `; breaking it deals ${fmtPct(action.shatter.selfDamagePct)} max-HP damage to the caster` +
      (action.shatter.vulnerability
        ? ` and leaves it taking ${fmtPct(action.shatter.vulnerability.damageTakenPct)} more damage for ${fmtMs(action.shatter.vulnerability.durationMs)}`
        : '') +
      (action.shatter.freezeRadius !== undefined && action.shatter.freezeDurationMs !== undefined
        ? ` and freezes enemy monsters within ${action.shatter.freezeRadius}px for ${fmtMs(action.shatter.freezeDurationMs)}`
        : '')
    : '';
  return `gains a ${fmtPct(action.shieldPct)} max-HP barrier for ${fmtMs(action.durationMs)}${shatter}`;
}

/**
 * Full sentence for one generic monster ability. Exported so the map's monster
 * panel renders the same wording as the bestiary instead of a second copy of this
 * logic — presentation for a shared data field belongs next to the field.
 */
export function describeMonsterAbility(ability: MonsterAbility): string {
  const actions = ability.actions.map(describeMonsterAbilityAction).join(' and ');
  const target = ability.target === 'self' ? 'itself' : 'the captured target';
  const first = ability.initialCooldownMs !== undefined && ability.initialCooldownMs !== ability.cooldownMs
    ? ` The first cast is ready after ${fmtMs(ability.initialCooldownMs)} on a fresh combat session.`
    : '';
  const range = ability.castWhileOutOfRange
    ? ' It can begin while outside basic attack range.'
    : ability.requiresRange === false
      ? ' It does not require basic attack range.'
      : '';
  return `Casts for ${fmtMs(ability.castMs)} on ${target}, then ${actions}; recurs every ${fmtMs(ability.cooldownMs)}.${first}${range}`;
}

function describeBossAction(a: BossAction): string {
  switch (a.type) {
    case 'enrage':
      return `Enrage: ${fmtMult(a.atkMult)} attack and ${fmtMult(a.cdMult)} attack cooldown` +
        (a.cdMult < 1 ? ` (${fmtPct(1 - a.cdMult)} faster)` : '') +
        (a.durationMs ? ` for ${fmtMs(a.durationMs)}` : ' until death');
    case 'regen':
      return `Regenerates ${fmtPct(a.hpPctPerSec)} max HP per second${a.durationMs ? ` for ${fmtMs(a.durationMs)}` : ' until death'}`;
    case 'shield':
      return `Gains +${fmtPct(a.drAdd)} damage reduction for ${fmtMs(a.durationMs)}`;
    case 'summon':
      return `Summons ${a.count} × ${monsterLabel(a.monsterTypeId)}` +
        (a.offsetRange !== undefined ? ` within ${a.offsetRange}px` : '');
    case 'spawn-adds':
      return `Spawns ${a.count} × ${monsterLabel(a.monsterTypeId)}` +
        (a.offsetRange !== undefined ? ` within ${a.offsetRange}px` : '') +
        (a.maxAlive !== undefined ? ` (up to ${a.maxAlive} alive)` : '');
    case 'cast':
      return `Casts ${a.label} for ${fmtMs(a.castMs)}: ${a.actions.map(describeBossAction).join('; ')}`;
    case 'stat-buff':
      return `${a.label ? `${a.label}: ` : ''}${fmtMult(a.mult)} ${a.stat === 'attackSpeed' ? 'attack speed' : a.stat === 'damageReduction' ? 'damage reduction' : a.stat}` +
        (a.moveSpeedMult !== undefined ? ` and ${fmtMult(a.moveSpeedMult)} move speed` : '') +
        (a.maxStacks !== undefined ? `, up to ${a.maxStacks} stacks` : '') +
        (a.durationMs ? ` for ${fmtMs(a.durationMs)}` : ' until death');
    case 'roar':
      return `Roars: the boss and nearby allies within ${a.radius ?? 'the node'}${typeof a.radius === 'number' ? 'px' : ''} gain +${fmtPct(a.attackSpeedPct)} attack speed for ${fmtMs(a.durationMs)}`;
    case 'apply-shield':
      return `Gains a ${fmtPct(a.shieldPct)} max-HP barrier every ${fmtMs(a.intervalMs)} for ${fmtMs(a.durationMs)}` +
        (a.shatter ? `; breaking it deals ${fmtPct(a.shatter.selfDamagePct)} max-HP damage` +
          (a.shatter.vulnerability ? ` and opens a ${fmtPct(a.shatter.vulnerability.damageTakenPct)} damage window for ${fmtMs(a.shatter.vulnerability.durationMs)}` : '') +
          (a.shatter.freezeRadius !== undefined && a.shatter.freezeDurationMs !== undefined
            ? ` and freezes enemy monsters within ${a.shatter.freezeRadius}px for ${fmtMs(a.shatter.freezeDurationMs)}` : '') : '');
    case 'apply-soft-cap':
      return `Gains a damage soft-cap: hit damage above ${fmtPct(a.capPct)} of max HP is scaled to ${fmtMult(a.capMult)}`;
    case 'shed-defense':
      return `Sheds all defenses and reduces current plating to 20%`;
    case 'modify-ramp-debuff':
      return `Raises slow caps to ${fmtPct(a.moveSlowMaxPct)} movement and ${fmtPct(a.atkSlowMaxPct)} attack speed`;
    case 'raise-dead':
      return `Raises up to ${a.count} nearby corpse${a.count === 1 ? '' : 's'}${a.corpseRange !== undefined ? ` within ${a.corpseRange}px` : ''}` +
        (a.maxAliveAdd !== undefined ? ` and increases the living cap by ${a.maxAliveAdd}` : '') +
        (a.hpMult !== undefined || a.damageMult !== undefined ? ` (${fmtMult(a.hpMult ?? 1)} HP, ${fmtMult(a.damageMult ?? 1)} damage)` : '');
    case 'stoke-ramp':
      return `Stokes the node's ambient ramp` +
        (a.rampMsMult !== undefined ? ` to ${fmtMult(a.rampMsMult)} of its normal timing` : '') +
        (a.minStacks !== undefined ? ` with a ${a.minStacks}-stack floor` : '') +
        (a.maxStacksAdd !== undefined ? ` and +${a.maxStacksAdd} maximum stacks` : '');
    case 'spawn-pool':
      return `Leaves a ${a.radius}px pool for ${fmtMs(a.durationMs)} dealing ${a.damagePerTick} damage every ${fmtMs(a.tickIntervalMs)}` +
        (a.slowSpeedMult !== undefined ? ` and slowing movement to ${fmtPct(a.slowSpeedMult)}` : '');
    case 'empower-charged': {
      const parts = [
        a.multiplierMult !== undefined ? `${fmtMult(a.multiplierMult)} charged damage` : '',
        a.cooldownMult !== undefined ? `${fmtMult(a.cooldownMult)} charged cooldown` : '',
        a.radiusMult !== undefined ? `${fmtMult(a.radiusMult)} charged radius` : '',
        a.castMsMult !== undefined ? `${fmtMult(a.castMsMult)} charged cast time` : '',
        a.aftershockRayCountAdd !== undefined ? `+${a.aftershockRayCountAdd} aftershock rays` : '',
        a.aftershockDamageMult !== undefined ? `${fmtMult(a.aftershockDamageMult)} aftershock damage` : '',
      ].filter(Boolean);
      return `Empowers its signature telegraphed attack: ${parts.join(', ')}`;
    }
    case 'empower-shred':
      return `Deepens corrosion` +
        (a.platingPerStackAdd !== undefined ? ` by +${a.platingPerStackAdd} plating per stack` : '') +
        (a.maxStacksAdd !== undefined ? ` and +${a.maxStacksAdd} maximum stacks` : '') +
        (a.extraThresholds?.length ? `; new venom thresholds at ${a.extraThresholds.join(' and ')}` : '');
    case 'morph':
      return `Changes stance` +
        (a.isRanged !== undefined ? a.isRanged ? ' to ranged' : ' to melee' : '') +
        (a.attackRange !== undefined ? ` at ${a.attackRange}px range` : '') +
        (a.attackStyle !== undefined ? ` with ${a.attackStyle} attacks` : '') +
        (a.kite ? ' and begins kiting' : '') +
        (a.dotEffect === null ? '; clears its DoT' : a.dotEffect ? `; applies ${a.dotEffect.label ?? readableId(a.dotEffect.debuffId ?? 'morph-dot')} for ${fmtNumber(a.dotEffect.damagePerStack)} per stack every ${fmtMs(a.dotEffect.tickIntervalMs)}, up to ${a.dotEffect.maxStacks} stacks` : '') +
        (a.durationMs ? ` for ${fmtMs(a.durationMs)}` : ' permanently');
    default:
      return (a as { type: string }).type;
  }
}

type PatternStatusStep = Extract<BossPatternStep, { kind: 'apply-status' }>;

function describePatternStatus(step: PatternStatusStep): string {
  const data = step.data ?? {};
  const details: string[] = [];
  if (data.speedMult !== undefined) {
    details.push(data.speedMult === 0 ? 'roots the target' : `slows movement to ${fmtPct(data.speedMult)}`);
  }
  if (data.damageTakenPct !== undefined) {
    details.push(`increases damage taken by ${fmtPct(data.damageTakenPct)}`);
  }
  if (data.antihealReduction !== undefined) {
    details.push(`reduces healing by ${fmtPct(data.antihealReduction)}`);
  }
  if (data.damagePerStack !== undefined) {
    details.push(`${fmtNumber(data.damagePerStack)} damage per stack`);
  }
  if (data.tickIntervalMs !== undefined) {
    details.push(`every ${fmtMs(data.tickIntervalMs)}`);
  }
  return details.length > 0 ? `; ${details.join(', ')}` : '';
}

function describeBossPatternStep(step: BossPatternStep, pattern: BossPattern): string {
  switch (step.kind) {
    case 'cast':
      return `Casts ${step.name} for ${fmtMs(step.castMs)}` +
        (step.lane ? `, painting a ${step.lane.length}px lane ${step.lane.halfWidth}px half-wide` +
          (step.lane.lockAtCastPct !== undefined ? ` that commits at ${fmtPct(step.lane.lockAtCastPct)} of the cast` : '') : '') +
        (step.interruptible === false ? '; cannot be interrupted' : '') +
        (step.guardable === false ? '; Guard does not answer this beat' : '');
    case 'charge':
      return `Charges at ${fmtNumber(step.speed)}px/s for up to ${fmtMs(step.maxTravelMs)}` +
        (step.stopsOnContact === false ? ', passing through players' : ', stopping on player contact') +
        ` for ${fmtMult(pattern.damageMultiplier * (step.damageMult ?? 1))} damage` +
        (pattern.chargeInstinct ? `; each charge builds uncapped Instinct (+${fmtPct(pattern.chargeInstinct.speedPct)} speed and -${fmtPct(pattern.chargeInstinct.castReductionPct)} remaining wind-up per stack, minimum ${fmtMs(pattern.chargeInstinct.minCastMs)}; ${pattern.chargeInstinct.cooldownReductionPct ? `-${fmtPct(pattern.chargeInstinct.cooldownReductionPct)} remaining cooldown per stack, minimum 1s` : 'cooldown unchanged'}); a landed charge clears all stacks` : '');
    case 'impact':
      return `${step.name}: ${step.rawDamage !== undefined ? `${step.rawDamage} raw` : fmtMult(pattern.damageMultiplier * step.damageMult)} damage in a ${step.radius}px circle` +
        ` after a ${fmtMs(step.telegraphMs)} telegraph` +
        (step.stunMs ? `, stunning for ${fmtMs(step.stunMs)}` : '') +
        (step.requiresChargeHit ? '; only if the charge connected' : '');
    case 'fault-lines':
      return `After ${fmtMs(step.delayMs)}, ${step.rayCount} fault lines reach ${step.length}px` +
        ` (line radius ${step.lineRadius}px) for ${fmtMult(pattern.damageMultiplier * step.damageMult)} damage` +
        (step.innerRadius ? `; inner ring ${step.innerRadius}px` : '') +
        (step.requiresChargeHit ? '; only if the charge connected' : '');
    case 'barrier':
      return `Raises a ${fmtPct(step.shieldPct)} max-HP barrier` +
        (step.onBreak ? `; breaking it causes ${step.onBreak.label} for ${fmtMs(step.onBreak.staggerMs)}` : '');
    case 'drop-barrier':
      return `Drops the ${readableId(step.sourceId)} barrier`;
    case 'apply-status':
      return `Casts ${step.name} for ${fmtMs(step.castMs)}: ${statusLabel(step.effectId, step.name)}` +
        ` ×${step.stacks} for ${fmtMs(step.durationMs)}${describePatternStatus(step)}` +
        (step.requires ? `; requires ${step.requires.minStacks}+ ${statusLabel(step.requires.effectId)}` : '') +
        (step.interruptible === false ? '; cannot be interrupted' : '');
    case 'payoff': {
      const base = pattern.damageMultiplier * step.damageMult;
      const amplified = step.amplifiedMult !== undefined
        ? pattern.damageMultiplier * step.damageMult * step.amplifiedMult
        : undefined;
      return `Casts ${step.name} for ${fmtMs(step.castMs)}: ${fmtMult(base)} damage` +
        (step.radius ? ` in a ${step.radius}px circle` : '') +
        (amplified !== undefined && step.consumes
          ? `, amplified to ${fmtMult(amplified)} while ${statusLabel(step.consumes.effectId)} is present` : '') +
        (step.consumes ? `; consumes ${statusLabel(step.consumes.effectId)}` : '') +
        (step.reach !== undefined ? `; must be within ${step.reach}px reach` : '') +
        (step.onHitPoison ? `; a landed hit inflicts ${step.onHitPoison.stacks} Poison stacks (${step.onHitPoison.damagePerStack} damage each every ${fmtMs(step.onHitPoison.tickIntervalMs)} for ${fmtMs(step.onHitPoison.durationMs)})` : '') +
        (step.healsSelfPct ? `; restores ${fmtPct(step.healsSelfPct)} max HP on hit` : '') +
        (step.interruptible === false ? '; cannot be interrupted' : '');
    }
    case 'conceal':
      return `${step.name}: leaves a ${step.marker} marker and becomes untargetable for up to ${fmtMs(step.durationMs)}` +
        (step.travelSpeed ? ` and travels at ${fmtNumber(step.travelSpeed)}px/s` : '') +
        (step.relocate === 'near-target' ? ` to ${step.emergeGap ?? 0}px from the target` : '') +
        (step.relocate === 'leash-edge' ? ' toward the far edge of its leash' : '') +
        (step.feint ? `, feinting away until ${fmtPct(step.feint.untilPct)} of the travel` : '') +
        (step.surfacesOnContact ? '; surfaces on contact' : '') +
        (step.contactSlow ? ` and slows contact to ${fmtPct(step.contactSlow.speedMult)} for ${fmtMs(step.contactSlow.durationMs)}` : '') +
        (step.interruptible === false ? '; cannot be interrupted' : '');
    case 'escape-guard':
      return `Attempts ${step.name} for up to ${fmtMs(step.castMs)} behind a ${fmtPct(step.shieldPct)} barrier` +
        (step.flee ? `, fleeing at ${fmtNumber(step.flee.speed)}px/s until ${step.flee.escapeDistance}px from its target (at least 100px of actual retreat); timing out fails` : '') +
        `; breaking it causes ${step.onBreak.label} for ${fmtMs(step.onBreak.staggerMs)}` +
        `; shield breaks and timed-out attempts build uncapped Escape Instinct stacks` +
        (step.instinctSpeedPct ? ` (each increases flee speed by ${fmtPct(step.instinctSpeedPct)})` : '') + '; a successful escape clears the stacks';
    case 'pull':
      return `Casts ${step.name} for ${fmtMs(step.castMs)} and pulls the target ${step.distance}px` +
        (step.interruptible === false ? '; cannot be interrupted' : '');
    case 'wait':
      return `Waits ${fmtMs(step.durationMs)} while the sequence remains committed`;
    case 'recovery':
      return `${step.label}: rooted and unable to attack for ${fmtMs(step.durationMs)}`;
  }
}

function describeStageAction(action: StageAction): string {
  switch (action.type) {
    case 'spawn-waves':
      return action.waves.map((wave, index) =>
        `Wave ${index + 1}: ${wave.adds.map((add) => `${add.count} × ${monsterLabel(add.monsterTypeId)}`).join(', ')}`,
      ).join('; ');
    case 'spawn-elites':
      if (action.offsetRange !== undefined) {
        return `Spawns ${action.count} \u00d7 ${monsterLabel(action.monsterTypeId)} elite${action.count === 1 ? '' : 's'} within ${action.offsetRange}px`;
      }
      return `Spawns ${action.count} × ${monsterLabel(action.monsterTypeId)} elite${action.count === 1 ? '' : 's'}`;
    case 'environmental-dot': {
      const stackCap = action.stackCap ?? action.maxStacks;
      return `Activates ${statusLabel(action.effectId)}: ${fmtNumber(action.damagePerStack)} damage per stack every ${fmtMs(action.tickIntervalMs)}` +
        `, refreshing every ${fmtMs(action.refreshMs)}, up to ${stackCap > 0 ? stackCap : 'an uncapped'} stacks` +
        (action.hazardHint ? ` (${action.hazardHint})` : '');
    }
    case 'set-invulnerable':
      return action.value ? 'Boss becomes invulnerable' : 'Boss becomes vulnerable';
    case 'set-rooted':
      return action.value ? 'Boss is rooted' : 'Boss can move again';
    case 'set-cannot-attack':
      return action.value ? 'Boss stops attacking' : 'Boss resumes attacking';
    case 'set-feature-block':
      return `${action.value ? 'Activates' : 'Opens'} ${readableId(action.featureId)}`;
  }
}

function describeStageCondition(kind: string): string {
  if (kind === 'adds-cleared') return 'after all adds are defeated';
  if (kind === 'elites-cleared') return 'after all elites are defeated';
  return 'after all waves are defeated';
}

function describeChargedAttack(def: MonsterDefinition): BestiaryAbilityLine | null {
  const charged = def.chargedAttack;
  if (!charged) return null;
  const details: string[] = [`Hits for ${fmtMult(charged.multiplier)} attack damage`];
  if (charged.aoe) {
    details.push(`in a ${charged.aoe.radius}px planted circle` +
      (charged.aoe.damageMult !== undefined ? ` at ${fmtMult(charged.multiplier * charged.aoe.damageMult)} total damage` : ''));
  }
  if (charged.precastStunMs) details.push(`stuns the target during the first ${fmtMs(charged.precastStunMs)}`);
  if (charged.marksTarget) details.push(`marks the target for ${fmtMs(charged.marksTarget.durationMs)}`);
  if (charged.rootMs) details.push(`roots on impact for ${fmtMs(charged.rootMs)}`);
  if (charged.lunge) details.push(`leaps up to ${charged.lunge.range}px onto its target`);
  if (charged.dragsToLair) {
    details.push(
      `roots the victim for ${fmtMs(charged.dragsToLair.durationMs)} and drags them` +
      ` into the nearest ${readableId(charged.dragsToLair.lair)} at ${charged.dragsToLair.speed}px/s`,
    );
  }
  if (charged.appliesSlow) details.push(`slows on impact to ${fmtPct(charged.appliesSlow.speedMult)} for ${fmtMs(charged.appliesSlow.durationMs)}`);
  if (charged.appliesAntiheal) details.push(`reduces healing by ${fmtPct(charged.appliesAntiheal.reduction)} for ${fmtMs(charged.appliesAntiheal.durationMs)}`);
  if (charged.refreshesPlayerDots) details.push(`extends existing DoTs by ${fmtMs(charged.refreshesPlayerDots.extendMs)} up to ${fmtMs(charged.refreshesPlayerDots.maxTotalMs)}`);
  if (charged.requiresAmbientStacks) details.push(`only arms at ${charged.requiresAmbientStacks}+ ambient-ramp stacks`);
  if (charged.stunMs) details.push(`stuns every victim for ${fmtMs(charged.stunMs)}`);
  if (charged.knockback) details.push(`knocks victims back ${charged.knockback.distance}px`);
  if (charged.healsSelfPct) details.push(`restores ${fmtPct(charged.healsSelfPct)} max HP on a landed hit`);
  if (charged.pool) {
    details.push(`leaves a ${charged.pool.durationMs >= 600000 ? 'lingering' : fmtMs(charged.pool.durationMs)} pool` +
      ` dealing ${fmtNumber(charged.pool.damagePerTick)} every ${fmtMs(charged.pool.tickIntervalMs)}` +
      (charged.pool.slowSpeedMult !== undefined ? ` and slowing to ${fmtPct(charged.pool.slowSpeedMult)}` : '') +
      (charged.pool.vulnerability ? `, with +${fmtPct(charged.pool.vulnerability.damageTakenPct)} damage taken for ${fmtMs(charged.pool.vulnerability.durationMs)}` : '') +
      (charged.pool.detonationMultiplier ? `, detonating for ${fmtMult(charged.pool.detonationMultiplier)}` : ''));
  }
  if (charged.aftershock) {
    details.push(`after ${fmtMs(charged.aftershock.delayMs)}, ${charged.aftershock.rayCount} fault lines deal ${fmtMult(charged.aftershock.damageMultiplier)} damage`);
  }
  if (charged.hastenedBy) {
    details.push(`its cast shortens by ${fmtPct(1 - charged.hastenedBy.castMsMultPerStack)} per ${charged.hastenedBy.bossEffect} stack, to a ${fmtMs(charged.hastenedBy.minCastMs)} floor`);
  }
  return {
    id: 'charged-attack',
    name: charged.name,
    icon: '!',
    kind: 'cast',
    castMs: charged.castMs,
    cooldownMs: charged.cooldownMs,
    initialCooldownMs: charged.initialCooldownMs,
    detail: `${details.join('; ')}. ${chargedCounterplay(charged)}`,
  };
}

/**
 * The one sentence that tells a player how to ANSWER a charged attack. It has to
 * match the ability's actual shape: this line used to claim every charge planted its
 * impact at cast start, which is only true of an `aoe` charge — for the two dozen
 * target-following ones (every hex, every bite) it advised counterplay that does not
 * exist, and for a lunge it named the wrong distance to walk out of.
 */
function chargedCounterplay(
  charged: NonNullable<MonsterDefinition['chargedAttack']>,
): string {
  if (charged.aoe) {
    return 'The impact is committed when the cast begins, so walking out of the telegraph is the answer.';
  }
  if (charged.lunge) {
    return `The leap follows its target, so break the ${charged.lunge.range}px range during the wind-up — or interrupt it.`;
  }
  return 'The cast follows its target, so interrupting it is the answer.';
}

function describeEngageSequence(def: MonsterDefinition): BestiaryAbilityLine | null {
  const sequence = def.engageSequence;
  if (!sequence) return null;
  if (sequence.kind === 'charge-lock-charged-attack') {
    return {
      id: 'engage-sequence',
      name: 'Opening charge',
      icon: '»',
      kind: 'sequence',
      trigger: 'On first aggro',
      detail: `Locks onto a target, then charges at ${fmtMult(sequence.speedMult)} move speed for up to ${fmtMs(sequence.maxChargeMs)} before beginning its signature attack.`,
    };
  }
  if (sequence.kind === 'cast-charge-root') {
    return {
      id: 'engage-sequence',
      name: sequence.name,
      icon: '»',
      kind: 'sequence',
      castMs: sequence.castMs,
      trigger: 'On first aggro',
      detail: `Casts, then charges at ${fmtMult(sequence.speedMult)} move speed for up to ${fmtMs(sequence.maxChargeMs)}; contact roots the target for ${fmtMs(sequence.rootMs)}${sequence.followWithChargedAttack ? ' and immediately arms its signature attack' : ''}.`,
    };
  }
  return {
    id: 'engage-sequence',
    name: sequence.name,
    icon: '»',
    kind: 'sequence',
    castMs: sequence.castMs,
    trigger: 'On first aggro',
    detail: `Casts, then ${def.flies ? 'dives' : 'lunges'} at ${fmtMult(sequence.speedMult)} move speed for up to ${fmtMs(sequence.maxChargeMs)}; the landing hits for ${fmtMult(sequence.damageMultiplier)} attack damage.`,
  };
}

function describeBossPattern(def: MonsterDefinition): BestiaryAbilityLine | null {
  const pattern = def.bossPattern;
  if (!pattern) return null;
  const triggerParts: string[] = [];
  if (pattern.armAboveHpPct !== undefined) triggerParts.push(`at or above ${fmtPct(pattern.armAboveHpPct)} HP`);
  if (pattern.armBelowHpPct !== undefined) triggerParts.push(`at or below ${fmtPct(pattern.armBelowHpPct)} HP`);
  return {
    id: `boss-pattern-${pattern.id}`,
    name: pattern.name,
    icon: '★',
    kind: 'sequence',
    cooldownMs: pattern.cooldownMs,
    initialCooldownMs: pattern.initialCooldownMs,
    trigger: triggerParts.length > 0 ? triggerParts.join(' and ') : 'While engaged',
    detail: `Commits to one ordered sequence for ${fmtMult(pattern.damageMultiplier)} base damage, suppressing ordinary attacks until recovery` +
      (pattern.oncePerLife ? '; runs once per life.' : '.'),
    steps: pattern.steps.map((step) => describeBossPatternStep(step, pattern)),
  };
}

function describeUltimateEncounter(def: MonsterDefinition): BestiaryAbilityLine | null {
  const encounter = def.ultimateEncounter;
  if (!encounter) return null;
  return {
    id: 'ultimate-encounter',
    name: 'Ultimate encounter',
    icon: '☠',
    kind: 'encounter',
    trigger: 'On boss engagement',
    detail: `${encounter.stages.length}-stage objective fight` +
      (encounter.reset.onWipe ? '; resets on a party wipe' : '') +
      (encounter.spawnFromFeatureId ? `; waves emerge from ${readableId(encounter.spawnFromFeatureId)}` : '') + '.',
    steps: encounter.stages.map((stage, index) => {
      const label = stage.displayName ?? stage.id.toUpperCase();
      const actions = stage.onEnter.map(describeStageAction).join('; ');
      const completion = stage.completeWhen ? `, then advances ${describeStageCondition(stage.completeWhen.kind)}` : ', then ends when the boss dies';
      return `Stage ${index + 1} — ${label}: ${actions}${completion}`;
    }),
  };
}

/**
 * Build the explicit cast and encounter panel for one monster. Unlike the compact
 * mechanic list, this keeps wind-ups, cooldowns, first-use delays, thresholds and
 * ordered boss steps visible as separate pieces of information.
 */
export function describeMonsterAbilities(
  def: MonsterDefinition,
  mods?: DungeonMonsterModifiers,
): BestiaryAbilityLine[] {
  const abilities: BestiaryAbilityLine[] = [];
  const push = (line: BestiaryAbilityLine | null) => {
    if (line) abilities.push(line);
  };

  push(describeEngageSequence(def));
  push(describeChargedAttack(def));

  if (def.castedAttackSpeedBuff) {
    const buff = def.castedAttackSpeedBuff;
    const target = buff.target === 'self'
      ? 'itself'
      : `nearby monsters within ${buff.radius ?? 'the node'}${typeof buff.radius === 'number' ? 'px' : ''}`;
    const outcome = buff.attacks !== undefined
      ? `its next ${Math.max(1, Math.round(buff.attacks))} attacks gain +${fmtPct(buff.attackSpeedPct)} attack speed`
      : `${target} gains +${fmtPct(buff.attackSpeedPct)} attack speed${buff.durationMs ? ` for ${fmtMs(buff.durationMs)}` : ''}`;
    push({
      id: 'casted-haste',
      name: buff.name,
      icon: '↯',
      kind: 'cast',
      castMs: buff.castMs,
      cooldownMs: buff.cooldownMs,
      initialCooldownMs: buff.initialCooldownMs,
      detail: `After the cast, ${outcome}` +
        (buff.rallyNearby ? `; rallies up to ${Math.max(0, Math.round(buff.rallyNearby.maxTargets))} unengaged monsters${buff.rallyNearby.oncePerCombat === false ? '' : ' once per combat'}` : '') +
        (buff.castWhileOutOfRange ? ' It can begin outside basic attack range.' : '.'),
    });
  }

  for (const ability of def.monsterAbilities ?? []) {
    push({
      id: `ability-${ability.id}`,
      name: ability.name,
      icon: '⚡',
      kind: 'cast',
      castMs: ability.castMs,
      cooldownMs: ability.cooldownMs,
      initialCooldownMs: ability.initialCooldownMs,
      detail: `${describeMonsterAbility(ability)}${ability.fx ? ` Visual cue: ${readableId(ability.fx)}.` : ''}`,
    });
  }

  if (def.lowHealthWard) {
    const ward = def.lowHealthWard;
    push({
      id: 'low-health-ward',
      name: ward.name,
      icon: '◈',
      kind: 'cast',
      castMs: ward.castMs,
      trigger: `At or below ${fmtPct(ward.thresholdPct)} HP`,
      detail: `Stops to raise a ${fmtPct(ward.wardPct)} max-HP ward for ${fmtMs(ward.durationMs)}. It is a one-time cast.`,
    });
  }

  if (def.shellUp) {
    const shell = def.shellUp;
    push({
      id: 'shell-up',
      name: 'Shell up',
      icon: '⬢',
      kind: shell.castMs ? 'cast' : 'passive',
      castMs: shell.castMs,
      cooldownMs: shell.repeatIntervalMs,
      trigger: `At or below ${fmtPct(shell.atHpPct)} HP`,
      detail: `Retracts for ${fmtMs(shell.durationMs)}; direct damage is multiplied by ${fmtMult(shell.directDamageMult)} while shelled` +
        (shell.pool ? ` and leaves a ${shell.pool.radius}px pool dealing ${fmtNumber(shell.pool.damagePerTick)} every ${fmtMs(shell.pool.tickIntervalMs)}` : '') +
        (shell.pool?.rampAccelMult !== undefined ? `; standing in it accelerates the ambient ramp by ${fmtMult(shell.pool.rampAccelMult)}` : '') +
        (shell.repeatIntervalMs ? `, repeating every ${fmtMs(shell.repeatIntervalMs)} after the first shell` : ', once per life') + '.',
    });
  }

  if (def.enemyShield) {
    const shield = def.enemyShield;
    const shatter = shield.shatter
      ? ` Breaking it deals ${fmtPct(shield.shatter.selfDamagePct)} max-HP damage` +
        (shield.shatter.vulnerability ? ` and opens a +${fmtPct(shield.shatter.vulnerability.damageTakenPct)} damage window for ${fmtMs(shield.shatter.vulnerability.durationMs)}` : '') +
        (shield.shatter.freezeRadius !== undefined && shield.shatter.freezeDurationMs !== undefined
          ? ` and freezes enemy monsters within ${shield.shatter.freezeRadius}px for ${fmtMs(shield.shatter.freezeDurationMs)}` : '') + '.'
      : '';
    push({
      id: 'enemy-shield',
      name: 'Periodic shield',
      icon: '◈',
      kind: 'passive',
      cooldownMs: shield.rechargeAfterCleanMs ?? shield.intervalMs,
      detail: shield.rechargeAfterCleanMs
        ? `Gains a ${fmtPct(shield.shieldPct)} max-HP barrier for ${fmtMs(shield.durationMs)} after ${fmtMs(shield.rechargeAfterCleanMs)} without taking a hit; every hit restarts that timer.` + shatter
        : `Gains a ${fmtPct(shield.shieldPct)} max-HP barrier for ${fmtMs(shield.durationMs)} every ${fmtMs(shield.intervalMs)}.` + shatter,
    });
  }

  if (def.empowersAllies) {
    const support = def.empowersAllies;
    push({
      id: 'ally-haste',
      name: 'Ally haste',
      icon: '↯',
      kind: 'passive',
      cooldownMs: support.intervalMs,
      detail: `Every ${fmtMs(support.intervalMs)}, nearby allies within ${support.radius}px gain +${fmtPct(support.attackSpeedPct)} attack speed for ${fmtMs(support.durationMs)}.`,
    });
  }

  if (def.appliesAntiheal) {
    const antiheal = def.appliesAntiheal;
    push({
      id: 'antiheal',
      name: 'Healing suppression',
      icon: '✚',
      kind: 'passive',
      trigger: 'On landed hit',
      detail: `Each hit reduces your healing by ${fmtPct(antiheal.reductionPerStack)}, up to ${antiheal.maxStacks} stacks, for ${fmtMs(antiheal.durationMs)} after the last hit.`,
    });
  }

  if (def.raisesDead) {
    const raise = def.raisesDead;
    push({
      id: 'raises-dead',
      name: raise.castName ?? 'Raises the dead',
      icon: '☠',
      kind: raise.castMs ? 'cast' : 'passive',
      castMs: raise.castMs,
      cooldownMs: raise.intervalMs,
      initialCooldownMs: raise.initialDelayMs,
      detail: `Re-animates one nearby corpse within ${raise.corpseRange}px every ${fmtMs(raise.intervalMs)}` +
        `, capped at ${raise.maxAlive} risen at once` +
        (raise.hpMult !== undefined || raise.damageMult !== undefined ? ` (${fmtMult(raise.hpMult ?? 1)} HP, ${fmtMult(raise.damageMult ?? 1)} damage)` : '') +
        '. Risen dead grant no rewards and crumble when their raiser dies.',
    });
  }

  if (def.onDeath?.spawnHazard) {
    const hazard = def.onDeath.spawnHazard;
    push({
      id: 'death-hazard',
      name: 'Toxic remains',
      icon: '☣',
      kind: 'passive',
      trigger: 'On death',
      detail: `Leaves a ${hazard.radius}px pool for ${fmtMs(hazard.durationMs)} dealing ${fmtNumber(hazard.damagePerTick)} damage every ${fmtMs(hazard.tickIntervalMs)}` +
        (hazard.slowSpeedMult !== undefined ? ` and slowing movement to ${fmtPct(hazard.slowSpeedMult)}` : '') + '.',
    });
  }

  if (def.onDeath?.empowerAllies) {
    const empower = def.onDeath.empowerAllies;
    push({
      id: 'death-empower',
      name: 'Death surge',
      icon: '↟',
      kind: 'passive',
      trigger: 'On death',
      detail: `Nearby monsters within ${empower.radius}px gain +${fmtPct(empower.damagePct)} damage for ${fmtMs(empower.durationMs)}` +
        `, up to ${empower.maxStacks ?? 3} stacks.`,
    });
  }

  if (def.chargeOnAggro) {
    const charge = def.chargeOnAggro;
    push({
      id: 'charge',
      name: 'Charge',
      icon: '»',
      kind: 'passive',
      trigger: 'On first aggro',
      detail: `Bursts to ${fmtMult(charge.speedMult)} move speed for ${fmtMs(charge.durationMs)}.`,
    });
  }

  const openingStrikeMult = mods?.openingStrikeMult ?? def.openingStrike?.multiplier;
  if (openingStrikeMult !== undefined) {
    push({
      id: 'opening-strike',
      name: 'Opening strike',
      icon: '⚔',
      kind: 'passive',
      trigger: 'First landed attack each combat session',
      detail: `That first hit deals ${fmtMult(openingStrikeMult)} damage, then the effect disarms until re-aggro.`,
    });
  }

  if (def.openingVolley) {
    push({
      id: 'opening-volley',
      name: 'Opening volley',
      icon: '⚔',
      kind: 'passive',
      trigger: 'First attack each combat session',
      detail: `The opening beat delivers ${def.openingVolley.hits} separate full-pipeline hits.`,
    });
  }

  if (def.cadenceVolley) {
    push({
      id: 'cadence-volley',
      name: 'Cadence volley',
      icon: '⚔',
      kind: 'passive',
      trigger: `Every ${def.cadenceVolley.everyNAttacks} attacks`,
      detail: `That attack beat delivers ${def.cadenceVolley.hits} separate full-pipeline hits.`,
    });
  }

  if (def.cadenceFinisher) {
    push({
      id: 'cadence-finisher',
      name: 'Cadence finisher',
      icon: '⚔',
      kind: 'passive',
      trigger: `Every ${def.cadenceFinisher.everyNAttacks} attacks`,
      detail: `The finisher lands for ${fmtMult(def.cadenceFinisher.multiplier)} damage` +
        (def.cadenceFinisher.rootMs ? ` and roots for ${fmtMs(def.cadenceFinisher.rootMs)}` : '') + '.',
    });
  }

  if (def.empoweredCooldown) {
    push({
      id: 'empowered-cooldown',
      name: 'Empowered strike',
      icon: '⏱',
      kind: 'passive',
      cooldownMs: def.empoweredCooldown.cooldownMs,
      detail: `Every ${fmtMs(def.empoweredCooldown.cooldownMs)}, its next landed attack deals ${fmtMult(def.empoweredCooldown.multiplier)} damage.`,
    });
  }

  if (def.appliesMark) {
    push({
      id: 'sun-mark',
      name: 'Sun Mark',
      icon: '✦',
      kind: 'passive',
      trigger: 'On landed hit',
      detail: `Marks you for ${fmtMs(def.appliesMark.durationMs)}; a marked strike can consume the mark for amplified damage.`,
    });
  }

  if (def.markedStrike) {
    push({
      id: 'marked-strike',
      name: 'Marked strike',
      icon: '✦',
      kind: 'passive',
      trigger: 'When hitting a Sun-Marked target',
      detail: `Consumes Sun Mark and multiplies that hit by ${fmtMult(def.markedStrike.multiplier)}.`,
    });
  }

  push(describeBossPattern(def));

  if (def.bossScript) {
    for (const [index, phase] of (def.bossScript.phases ?? []).entries()) {
      push({
        id: `boss-phase-${index}-${phase.hpPct}`,
        name: `Phase at ${fmtPct(phase.hpPct)} HP`,
        icon: '★',
        kind: 'sequence',
        trigger: `When HP falls to ${fmtPct(phase.hpPct)}`,
        detail: 'One-time phase actions:',
        steps: phase.actions.map(describeBossAction),
      });
    }
    for (const [index, repeating] of (def.bossScript.repeating ?? []).entries()) {
      push({
        id: `boss-repeat-${index}`,
        name: 'Recurring boss beat',
        icon: '↻',
        kind: 'sequence',
        cooldownMs: repeating.intervalMs,
        initialCooldownMs: repeating.initialDelayMs,
        trigger: 'While engaged',
        detail: 'Repeats until the boss disengages:',
        steps: repeating.actions.map(describeBossAction),
      });
    }
  }

  push(describeUltimateEncounter(def));
  return abilities;
}

/**
 * Build the full ordered list of secondary-mechanic lines for a monster, applying
 * the same dungeon guardian modifiers used for its stats (so DoT scaling matches).
 */
/**
 * "Arrives with N companions", for a pack alpha. Returns null for followers and
 * lone monsters: a follower's own line would just restate its alpha's.
 */
function describePack(def: MonsterDefinition): MechanicLine | null {
  const pack = def.pack;
  if (pack?.role !== 'alpha') return null;

  const core = (pack.followers ?? []).reduce((n, g) => n + g.count, 0);
  const variants = pack.followerVariants ?? [];
  const extras = variants.map(v => v.reduce((n, g) => n + g.count, 0));
  const low = core + (extras.length > 0 ? Math.min(...extras) : 0);
  const high = core + (extras.length > 0 ? Math.max(...extras) : 0);
  if (high <= 0) return null;

  const names = new Set<string>();
  for (const g of pack.followers ?? []) names.add(g.typeId);
  for (const v of variants) for (const g of v) names.add(g.typeId);
  const labels = [...names]
    .map(monsterLabel)
    .sort();

  const count = low === high ? `${high}` : `${low}\u2013${high}`;
  const noun = high === 1 ? 'companion' : 'companions';
  const alerted = (pack.callRange ?? 0) > 0
    ? ` It calls them onto whatever it engages from up to ${pack.callRange}px.`
    : '';

  return {
    id: 'pack-alpha',
    icon: '\u2691',
    label: 'Leads a pack',
    category: 'ability',
    detail:
      `Spawns with ${count} ${noun} \u2014 ${labels.join(', ')} \u2014 clustered around it.` +
      alerted,
  };
}

export function describeMonsterMechanics(
  def: MonsterDefinition,
  mods?: DungeonMonsterModifiers,
): MechanicLine[] {
  const lines: MechanicLine[] = [];

  if (monsterKites(def)) {
    lines.push({
      id: 'kiter',
      icon: '➶',
      label: 'Kiter',
      detail: `Attacks from up to ${def.stats.attackRange}px away and backs off as you close in.`,
    });
  } else if (monsterIsRanged(def)) {
    lines.push({
      id: 'ranged',
      icon: '➶',
      label: 'Ranged',
      detail: `Attacks from up to ${def.stats.attackRange}px away.`,
    });
  }

  if (def.dotEffect) {
    const dotMult = mods?.dotMult ?? 1;
    const flavor = resolveMonsterDotDebuff({ monster: def, dotEffect: def.dotEffect });
    const perStack = Math.round(def.dotEffect.damagePerStack * dotMult);
    const perStackPerSec = Math.round(perStack * (1000 / def.dotEffect.tickIntervalMs));
    const maxPerSec = perStackPerSec * def.dotEffect.maxStacks;
    lines.push({
      id: 'dot',
      icon: '☣',
      label: flavor.label,
      color: flavor.color,
      detail:
        `Applies ${flavor.label} on hit: ${perStack}/tick every ${fmtMs(def.dotEffect.tickIntervalMs)} ` +
        `(${perStackPerSec}/s per stack), up to ${def.dotEffect.maxStacks} stacks ` +
        `(${maxPerSec}/s at max)` +
        (def.dotEffect.openerStacks ? `; the first landed hit applies ${Math.min(def.dotEffect.openerStacks, def.dotEffect.maxStacks)} stacks` : '') +
        (def.dotEffect.durationMs ? `, lasts ${fmtMs(def.dotEffect.durationMs)}.` : '.') +
        (def.dotEffect.bypassBarrier ? ' Bypasses the barrier.' : ''),
    });
  }

  if (def.slowEffect) {
    const root = def.slowEffect.speedMult === 0;
    lines.push({
      id: 'slow',
      icon: root ? '⛓' : '❄',
      label: root ? 'Root' : 'Slow',
      detail: root
        ? `Roots you in place for ${fmtMs(def.slowEffect.durationMs)} on hit.`
        : `Slows your movement to ${fmtPct(def.slowEffect.speedMult)} for ${fmtMs(def.slowEffect.durationMs)} on hit.`,
    });
  }

  if (def.appliesVulnerability) {
    const vuln = def.appliesVulnerability;
    lines.push({
      id: 'sunder',
      icon: '🩸',
      label: 'Sunder',
      detail:
        `Each hit stacks +${fmtPct(vuln.damageTakenPct)} damage TAKEN from every source ` +
        `(up to ${vuln.maxStacks} stacks); decays ${fmtMs(vuln.durationMs)} after the last hit. Cleansable.`,
    });
  }

  if (def.aoeAttack) {
    lines.push({
      id: 'aoe',
      icon: '✸',
      label: 'Cleave',
      detail: `Basic attack splashes ${fmtMult(def.aoeAttack.damageMult ?? 1)} attack to everything within ${def.aoeAttack.radius}px.`,
    });
  }

  if ((def.consecutiveHits ?? 1) > 1) {
    lines.push({
      id: 'multi-hit',
      icon: '⚔',
      label: 'Consecutive strikes',
      detail: `Each basic attack lands ${def.consecutiveHits} separate hits.`,
    });
  }

  const corrosion = def.castsPlatingShred ?? def.appliesPlatingShred;
  if (corrosion) {
    let cap = corrosion.maxStacks;
    const capChanges = (def.bossScript?.phases ?? []).flatMap(phase => {
      const added = phase.actions.reduce((sum, action) =>
        sum + (action.type === 'empower-shred' ? action.maxStacksAdd ?? 0 : 0), 0);
      if (!added) return [];
      cap += added;
      return [`${cap} at ${fmtPct(phase.hpPct)} boss HP`];
    });
    lines.push({
      id: 'plating-shred',
      icon: '◫',
      label: 'Corrosion',
      detail:
        (def.castsPlatingShred ? 'Breach applies corrosion. Each stack removes ' : 'Each hit permanently removes ') +
        `${corrosion.platingPerStack} plating for this encounter, ` +
        `up to ${corrosion.maxStacks} stacks${capChanges.length ? ` initially, then ${capChanges.join(', then ')}` : ''}. Cleansable.` +
        (corrosion.thresholdPoison
          ? ` Reaching ${corrosion.thresholdPoison.atStacks.join(' or ')} stacks applies ${corrosion.thresholdPoison.label}.`
          : ''),
    });
  }

  if (def.chargedAttack) {
    const charged = def.chargedAttack;
    const pool = charged.pool;
    const aftershock = charged.aftershock;
    lines.push({
      id: 'charged-attack',
      icon: '!',
      label: charged.name,
      category: 'ability',
      detail:
        `Charges for ${fmtMs(charged.castMs)} before a ${fmtMult(charged.multiplier)} hit` +
        (charged.lunge ? `, leaping up to ${charged.lunge.range}px onto its target` : '') +
        (charged.dragsToLair
          ? `, then dragging them rooted into the nearest ${readableId(charged.dragsToLair.lair)} for ${fmtMs(charged.dragsToLair.durationMs)}`
          : '') +
        (charged.aoe ? ` in a ${charged.aoe.radius}px planted circle` : '') +
        (pool ? `, leaving a ${fmtMs(pool.durationMs)} pool` : '') +
        (pool?.detonationMultiplier ? ` that detonates for ${fmtMult(pool.detonationMultiplier)} damage` : '') +
        (aftershock ? `, then telegraphs ${aftershock.rayCount} radial fault lines` : '') +
        '.',
    });
  }

  if (def.castedAttackSpeedBuff) {
    const buff = def.castedAttackSpeedBuff;
    const target = buff.target === 'self'
      ? 'itself'
      : `nearby monsters within ${buff.radius ?? 'the node'}${typeof buff.radius === 'number' ? 'px' : ''}`;
    const outcome = buff.attacks !== undefined
      ? `primes its next ${Math.max(1, Math.round(buff.attacks))} attacks at +${fmtPct(buff.attackSpeedPct)} attack speed`
      : `hastens ${target} by +${fmtPct(buff.attackSpeedPct)}${buff.durationMs ? ` for ${fmtMs(buff.durationMs)}` : ''}`;
    const rally = buff.rallyNearby
      ? `, rallying up to ${Math.max(0, Math.round(buff.rallyNearby.maxTargets))} unengaged nearby monsters`
      : '';
    lines.push({
      id: 'casted-haste',
      icon: '↯',
      label: buff.name,
      category: 'ability',
      detail: `Casts for ${fmtMs(buff.castMs)}, then ${outcome}${rally}.`,
    });
  }

  if (def.monsterAbilities) {
    for (const ability of def.monsterAbilities) {
      lines.push({
        id: `ability-${ability.id}`,
        icon: '⚡',
        label: ability.name,
        category: 'ability',
        detail: describeMonsterAbility(ability),
      });
    }
  }

  if (def.cadenceFinisher) {
    lines.push({
      id: 'cadence',
      icon: '⚔',
      label: 'Cadence finisher',
      category: 'ability',
      detail: `Every ${def.cadenceFinisher.everyNAttacks}th attack hits for ${fmtMult(def.cadenceFinisher.multiplier)} damage.`,
    });
  }

  if (def.empoweredCooldown) {
    lines.push({
      id: 'empowered-cd',
      icon: '⏱',
      label: 'Empowered strike',
      category: 'ability',
      detail: `Every ${fmtMs(def.empoweredCooldown.cooldownMs)}, its next attack hits for ${fmtMult(def.empoweredCooldown.multiplier)} damage.`,
    });
  }

  if (def.enemyShield) {
    lines.push({
      id: 'shield',
      icon: '◈',
      label: 'Periodic shield',
      category: 'ability',
      detail: `Gains a ${fmtPct(def.enemyShield.shieldPct)} max-HP barrier every ${fmtMs(def.enemyShield.intervalMs)} (lasts ${fmtMs(def.enemyShield.durationMs)}). Rewards burst; punishes chip.`,
    });
  }

  if (def.enemySoftCap) {
    lines.push({
      id: 'soft-cap',
      icon: '🛡',
      label: 'Damage soft-cap',
      detail: `Single hits over ${fmtPct(def.enemySoftCap.capPct)} of its max HP are scaled by ${fmtMult(def.enemySoftCap.capMult)} above the threshold. Rewards fast, consistent damage.`,
    });
  }

  if (def.evasion) {
    const mit = def.evadeMitigation;
    lines.push({
      id: 'evasion',
      icon: '↷',
      label: 'Evasion',
      detail:
        `Dodges ${fmtPct(def.evasion)} of incoming hits` +
        (mit !== undefined ? `, avoiding ${fmtPct(mit)} of a dodged hit's damage.` : '.'),
    });
  }

  if (def.rampDebuff) {
    lines.push({
      id: 'ramp-debuff',
      icon: '🐌',
      label: 'Stacking slow',
      detail:
        `Each hit stacks a move slow (up to ${fmtPct(def.rampDebuff.moveSlowMaxPct)}) and attack-speed slow ` +
        `(up to ${fmtPct(def.rampDebuff.atkSlowMaxPct)}); decays ${fmtMs(def.rampDebuff.stackDurationMs)} after the last hit.`,
    });
  }

  if (def.rampOnCombat) {
    lines.push({
      id: 'ramp-combat',
      icon: '📈',
      label: 'Combat ramp',
      detail: `Its ${def.rampOnCombat.stat} grows +${fmtPct(def.rampOnCombat.perTickPct)} every ${fmtMs(def.rampOnCombat.tickIntervalMs)} while engaged, up to +${fmtPct(def.rampOnCombat.maxPct)}.`,
    });
  }

  if (def.scalesWithAmbientRamp) {
    const fed = def.scalesWithAmbientRamp;
    lines.push({
      id: 'ambient-fed',
      icon: '❆',
      label: 'Feeds on the cold',
      detail:
        `Hits +${fmtPct(fed.perStackPct)} harder for every stack of the node's ambient ramp YOU are carrying ` +
        `(up to +${fmtPct(fed.maxPct)}). Cleanse the ramp, or fight it early.`,
    });
  }

  if (def.chargeOnAggro) {
    lines.push({
      id: 'charge',
      icon: '»',
      label: 'Charge',
      category: 'ability',
      detail: `Bursts to ${fmtMult(def.chargeOnAggro.speedMult)} move speed for ${fmtMs(def.chargeOnAggro.durationMs)} when it first aggros.`,
    });
  }

  // PACK COMPOSITION. Which creatures arrive TOGETHER is a mechanic the player
  // plans around — it is the whole of the Gravewright's "kill the necromancer or
  // the escort?" question and of Volcano's mixed-pack read — and until this line
  // existed nothing on any player-facing surface said so.
  //
  // Counts are given as a RANGE because `followerVariants` rolls one add-on group
  // per spawn, so a promised exact number would be wrong most of the time.
  const packLine = describePack(def);
  if (packLine) lines.push(packLine);

  if (def.onDeath?.spawnHazard) {
    const hazard = def.onDeath.spawnHazard;
    lines.push({
      id: 'death-hazard',
      icon: 'â˜£',
      label: 'Toxic remains',
      detail: `Leaves a ${hazard.radius}px toxic pool for ${fmtMs(hazard.durationMs)} when killed.`,
    });
  }

  if (def.raisesDead) {
    const raise = def.raisesDead;
    lines.push({
      id: 'raises-dead',
      icon: '☠',
      label: 'Raises the dead',
      category: 'ability',
      detail:
        `Every ${fmtMs(raise.intervalMs)} while fighting, it re-animates a corpse within ` +
        `${raise.corpseRange}px (up to ${raise.maxAlive} at once). Its risen dead grant ` +
        `NO rewards and crumble when it dies.`,
    });
  }

  if (def.onDeath?.empowerAllies) {
    const empower = def.onDeath.empowerAllies;
    lines.push({
      id: 'death-empower',
      icon: 'â†‘',
      label: 'Death surge',
      detail: `On death, monsters within ${empower.radius}px gain +${fmtPct(empower.damagePct)} damage for ${fmtMs(empower.durationMs)} (up to ${empower.maxStacks ?? 3} stacks).`,
    });
  }

  if (def.targeting?.mode === 'lowest-hp') {
    lines.push({
      id: 'targeting',
      icon: '◎',
      label: 'Targets weakest',
      detail: `Acquires the lowest-HP target in range instead of the closest.`,
    });
  }

  if (def.bossScript) {
    for (const phase of def.bossScript.phases ?? []) {
      lines.push({
        id: `phase-${phase.hpPct}`,
        icon: '★',
        label: `Phase at ${fmtPct(phase.hpPct)} HP`,
        category: 'ability',
        detail: phase.actions.map(describeBossAction).join('; ') + '.',
      });
    }
    (def.bossScript.repeating ?? []).forEach((r, i) => {
      lines.push({
        id: `repeat-${i}`,
        icon: '↻',
        label: `Every ${fmtMs(r.intervalMs)}`,
        category: 'ability',
        detail: r.actions.map(describeBossAction).join('; ') + '.',
      });
    });
  }

  if (def.ultimateEncounter) {
    lines.push({
      id: 'ultimate',
      icon: '☠',
      label: 'Multi-stage encounter',
      category: 'ability',
      detail: `A staged boss fight (${def.ultimateEncounter.stages.length} stages) with objectives between phases.`,
    });
  }

  return lines;
}
