import {
  modifiedDamageReduction,
  modifiedDotDamagePerStack,
  modifierStatScalars,
  describeMonsterAbility,
  monsterIsRanged,
  monsterKites,
  resolveMonsterDotDebuff,
  type MonsterDefinition,
  type NodeModifierFamily,
} from '@mmo-idle/shared';

// Readable presentation of a monster's combat profile for the map info panel:
// a stat grid, short capability tags (collapsed row), and a full plain-English
// mechanics breakdown (expanded row).

const round1 = (n: number): number => Math.round(n * 10) / 10;
const pct = (frac: number): string => `${Math.round(frac * 100)}%`;
const sec = (ms: number): string => `${round1(ms / 1000)}s`;

export interface StatCell {
  label: string;
  value: string;
  baseValue?: string;
  direction?: 'up' | 'down';
}

interface EffectiveMonsterStats {
  hp: number;
  attack: number;
  attackCooldown: number;
  speed: number;
  plating: number;
  damageReduction: number;
}

/**
 * A monster's stats as the node's modifier actually spawns it. Mirrors the server's
 * `createMonster` reshaping so the panel never shows the authored base when the
 * player is looking at a modified node.
 */
function effectiveMonsterStats(
  def: MonsterDefinition,
  modifier: NodeModifierFamily | undefined,
  biomeTier: number,
): EffectiveMonsterStats {
  const base = {
    hp: def.stats.hp,
    attack: def.stats.attack,
    attackCooldown: def.stats.attackCooldown,
    speed: def.stats.speed,
    plating: def.stats.plating,
    damageReduction: def.stats.damageReduction,
  };
  if (!modifier) return base;
  const scalars = modifierStatScalars(modifier, biomeTier);
  return {
    hp: Math.max(1, Math.round(base.hp * scalars.hpMult)),
    attack: Math.max(1, Math.round(base.attack * scalars.attackMult)),
    attackCooldown: Math.max(
      1,
      Math.round(base.attackCooldown * scalars.attackCooldownMult),
    ),
    speed: base.speed * scalars.moveSpeedMult,
    plating: Math.round(base.plating * scalars.platingMult),
    damageReduction: modifiedDamageReduction(
      base.damageReduction,
      scalars.incomingDamageMult,
    ),
  };
}

const compact = (value: number): string =>
  Number.isInteger(value) ? String(value) : round1(value).toFixed(1);

function changedCell(
  label: string,
  base: number,
  effective: number,
  format: (value: number) => string = compact,
): StatCell {
  const value = format(effective);
  if (effective === base) return { label, value };
  return {
    label,
    value,
    baseValue: format(base),
    direction: effective > base ? 'up' : 'down',
  };
}

/** Full stat grid for the expanded monster view (APS derived from cooldown). */
export function monsterStatRows(
  def: MonsterDefinition,
  modifier?: NodeModifierFamily,
  biomeTier = 0,
): StatCell[] {
  const s = def.stats;
  const effective = effectiveMonsterStats(def, modifier, biomeTier);
  const baseAps = s.attackCooldown > 0 ? 1000 / s.attackCooldown : 0;
  const effectiveAps =
    effective.attackCooldown > 0 ? 1000 / effective.attackCooldown : 0;
  // HP, plating and DR are now modifier-reshapable too (Dominion and Fortified), so
  // every one of them reports its base alongside the spawned value.
  const rows: StatCell[] = [
    changedCell('HP', s.hp, effective.hp),
    changedCell('ATK', s.attack, effective.attack),
    changedCell('APS', baseAps, effectiveAps, value => round1(value).toFixed(1)),
    changedCell('PLT', s.plating, effective.plating),
    changedCell('DR', s.damageReduction, effective.damageReduction, pct),
    changedCell('SPD', s.speed, effective.speed),
    { label: 'RNG',  value: String(s.attackRange) },
    { label: 'PULL', value: String(s.pullRange) },
  ];
  return rows;
}

export function monsterQuickStats(
  def: MonsterDefinition,
  modifier?: NodeModifierFamily,
  biomeTier = 0,
): {
  hp: string;
  attack: string;
  hpDirection?: 'up' | 'down';
  attackDirection?: 'up' | 'down';
} {
  const effective = effectiveMonsterStats(def, modifier, biomeTier);
  return {
    hp: compact(effective.hp),
    attack: compact(effective.attack),
    ...(effective.hp === def.stats.hp
      ? {}
      : { hpDirection: effective.hp > def.stats.hp ? 'up' : 'down' }),
    ...(effective.attack === def.stats.attack
      ? {}
      : { attackDirection: effective.attack > def.stats.attack ? 'up' : 'down' }),
  };
}

/** Short capability tags shown on the collapsed monster row. */
export function monsterTags(def: MonsterDefinition): string[] {
  const tags: string[] = [];
  if (def.isBoss)        tags.push('BOSS');
  if (monsterKites(def)) tags.push('KITER');
  else if (monsterIsRanged(def)) tags.push('RANGED');
  if (def.holdsChokepoints) tags.push('HOLDS');
  if (def.chargeOnAggro) tags.push('CHARGE');
  if (def.castedAttackSpeedBuff || def.monsterAbilities?.length) tags.push('CAST');
  if (def.dotEffect)     tags.push('DOT');
  if (def.slowEffect)    tags.push(def.slowEffect.speedMult === 0 ? 'ROOT' : 'SLOW');
  if (def.aoeAttack)     tags.push('AOE');
  if (def.evasion)       tags.push('EVADE');
  if (def.rampOnCombat || def.rampDebuff || def.scalesWithAmbientRamp) tags.push('RAMP');
  return tags;
}

function summarizeBossScript(def: MonsterDefinition): string | null {
  const script = def.bossScript;
  if (!script) return null;
  const verbs = new Set<string>();
  const collect = (actions: { type: string }[]) => {
    for (const a of actions) {
      switch (a.type) {
        case 'enrage':    verbs.add('enrages');        break;
        case 'regen':     verbs.add('heals');          break;
        case 'shield':    verbs.add('shields');        break;
        case 'summon':    verbs.add('summons adds');   break;
        case 'stat-buff': verbs.add('buffs itself');   break;
        case 'roar':      verbs.add('rallies allies'); break;
        case 'morph':     verbs.add('changes stance'); break;
      }
    }
  };
  for (const phase of script.phases ?? []) collect(phase.actions);
  for (const rep of script.repeating ?? []) collect(rep.actions);
  if (verbs.size === 0) return null;
  return `Fight mechanics: ${Array.from(verbs).join(', ')}`;
}

/** Full plain-English mechanics breakdown for the expanded monster view. */
export function formatMonsterMechanics(
  def: MonsterDefinition,
  modifier?: NodeModifierFamily,
  biomeTier = 0,
): string[] {
  const lines: string[] = [];
  // Node modifiers no longer ADD mechanics — they are pure stat and population
  // scalars, so the list below is the monster's authored kit. The one magnitude a
  // modifier does move here is DoT damage, which rides `attackMult` alongside direct
  // damage; showing the base number would understate a Heavy or Dominion node.
  const effectiveDef: MonsterDefinition =
    def.dotEffect && modifier
      ? {
          ...def,
          dotEffect: {
            ...def.dotEffect,
            damagePerStack: modifiedDotDamagePerStack(
              def.dotEffect.damagePerStack,
              modifier,
              biomeTier,
            ),
          },
        }
      : def;

  lines.push(monsterKites(effectiveDef)
    ? `Kiter — attacks from range (${effectiveDef.attackStyle} style)`
    : monsterIsRanged(effectiveDef)
    ? `Attacks from range (${effectiveDef.attackStyle} style)`
    : `Melee attacker (${effectiveDef.attackStyle} style)`);

  if (def.chargeOnAggro) {
    const c = def.chargeOnAggro;
    lines.push(`Charges at ${round1(c.speedMult)}× speed for ${sec(c.durationMs)} when it first spots you`);
  }

  if (def.engageSequence?.kind === 'cast-charge-root') {
    const d = def.engageSequence;
    lines.push(`${d.name} — casts for ${sec(d.castMs)}, then charges at ${round1(d.speedMult)}× speed and roots for ${sec(d.rootMs)} on landing`);
  }

  if (def.engageSequence?.kind === 'cast-charge-strike') {
    const d = def.engageSequence;
    lines.push(`${d.name} — casts for ${sec(d.castMs)}, then charges at ${round1(d.speedMult)}× speed and lands for ${round1(d.damageMultiplier)}× damage`);
  }

  if (effectiveDef.dotEffect) {
    const d = effectiveDef.dotEffect;
    const dur = d.durationMs ? `, lasts ${sec(d.durationMs)}` : '';
    const debuff = resolveMonsterDotDebuff({ monster: effectiveDef });
    lines.push(`Applies ${debuff.label} on hit: ${d.damagePerStack}/stack, up to ${d.maxStacks} stacks, ticks every ${sec(d.tickIntervalMs)}${dur}`);
  }

  if (def.slowEffect) {
    const sl = def.slowEffect;
    lines.push(sl.speedMult === 0
      ? `Roots you in place for ${sec(sl.durationMs)} on hit`
      : `Slows you to ${pct(sl.speedMult)} move speed for ${sec(sl.durationMs)} on hit`);
  }

  if (def.aoeAttack) {
    const a = def.aoeAttack;
    const mult = a.damageMult && a.damageMult !== 1 ? ` (${round1(a.damageMult)}× damage)` : '';
    lines.push(`Attacks splash to everyone within ${a.radius}px of the target${mult}`);
  }

  if (monsterKites(def)) {
    lines.push('Kites — keeps its distance, backing away as you close in');
  }

  if (def.holdsChokepoints) {
    lines.push('Holds a chokepoint — guards the pass instead of roaming');
  }

  if (def.castedAttackSpeedBuff) {
    const b = def.castedAttackSpeedBuff;
    const target = b.target === 'self'
      ? 'itself'
      : `nearby monsters within ${b.radius ?? 'the node'}${typeof b.radius === 'number' ? 'px' : ''}`;
    const outcome = b.attacks !== undefined
      ? `primes its next ${Math.max(1, Math.round(b.attacks))} attacks at +${pct(b.attackSpeedPct)} attack speed`
      : `hastens ${target} by +${pct(b.attackSpeedPct)}${b.durationMs ? ` for ${sec(b.durationMs)}` : ''}`;
    const rally = b.rallyNearby
      ? ` and rallies up to ${Math.max(0, Math.round(b.rallyNearby.maxTargets))} unengaged nearby monsters`
      : '';
    lines.push(`${b.name} — casts for ${sec(b.castMs)}, then ${outcome}${rally}`);
  }

  if (def.monsterAbilities) {
    for (const ability of def.monsterAbilities) {
      // Same shared composer the bestiary uses, so the two panels never drift.
      lines.push(`${ability.name} — ${describeMonsterAbility(ability)}`);
    }
  }

  if (def.rampOnCombat) {
    const r = def.rampOnCombat;
    lines.push(`Its ${r.stat} ramps +${pct(r.perTickPct)} every ${sec(r.tickIntervalMs)} in combat, up to +${pct(r.maxPct)}`);
  }

  if (def.rampDebuff) {
    const r = def.rampDebuff;
    lines.push(`Each hit stacks a move slow (max ${pct(r.moveSlowMaxPct)}) and attack-speed slow (max ${pct(r.atkSlowMaxPct)}); decays ${sec(r.stackDurationMs)} after the last hit`);
  }

  if (def.scalesWithAmbientRamp) {
    const r = def.scalesWithAmbientRamp;
    lines.push(`Feeds on the node's ambient ramp — +${pct(r.perStackPct)} damage per stack you carry, up to +${pct(r.maxPct)}`);
  }

  if (def.evasion) {
    const mit = def.evadeMitigation ?? 0.5;
    const mitText = mit >= 1 ? 'fully avoiding it' : `avoiding ${pct(mit)} of the damage`;
    const through = def.appliesThroughEvade ? ' (your debuffs still land)' : '';
    lines.push(`Dodges 1 in ${Math.round(1 / def.evasion)} hits, ${mitText}${through}`);
  }

  const boss = summarizeBossScript(def);
  if (boss) lines.push(boss);

  return lines;
}
