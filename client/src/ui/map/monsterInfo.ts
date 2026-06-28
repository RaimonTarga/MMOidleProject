import {
  monsterIsRanged,
  monsterKites,
  resolveMonsterDotDebuff,
  type MonsterDefinition,
} from '@mmo-idle/shared';

// Readable presentation of a monster's combat profile for the map info panel:
// a stat grid, short capability tags (collapsed row), and a full plain-English
// mechanics breakdown (expanded row).

const round1 = (n: number): number => Math.round(n * 10) / 10;
const pct = (frac: number): string => `${Math.round(frac * 100)}%`;
const sec = (ms: number): string => `${round1(ms / 1000)}s`;

export interface StatCell { label: string; value: string; }

/** Full stat grid for the expanded monster view (APS derived from cooldown). */
export function monsterStatRows(def: MonsterDefinition): StatCell[] {
  const s = def.stats;
  const aps = s.attackCooldown > 0 ? round1(1000 / s.attackCooldown) : 0;
  const rows: StatCell[] = [
    { label: 'HP',   value: String(s.hp) },
    { label: 'ATK',  value: String(s.attack) },
    { label: 'APS',  value: aps.toFixed(1) },
    { label: 'PLT',  value: String(s.plating) },
    { label: 'DR',   value: pct(s.damageReduction) },
    { label: 'SPD',  value: String(s.speed) },
    { label: 'RNG',  value: String(s.attackRange) },
    { label: 'PULL', value: String(s.pullRange) },
  ];
  return rows;
}

/** Short capability tags shown on the collapsed monster row. */
export function monsterTags(def: MonsterDefinition): string[] {
  const tags: string[] = [];
  if (def.isBoss)        tags.push('BOSS');
  if (monsterKites(def)) tags.push('KITER');
  else if (monsterIsRanged(def)) tags.push('RANGED');
  if (def.holdsChokepoints) tags.push('HOLDS');
  if (def.chargeOnAggro) tags.push('CHARGE');
  if (def.dotEffect)     tags.push('DOT');
  if (def.slowEffect)    tags.push(def.slowEffect.speedMult === 0 ? 'ROOT' : 'SLOW');
  if (def.aoeAttack)     tags.push('AOE');
  if (def.evasion)       tags.push('EVADE');
  if (def.rampOnCombat || def.rampDebuff) tags.push('RAMP');
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
        case 'slam':      verbs.add('slams (AoE)');    break;
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
export function formatMonsterMechanics(def: MonsterDefinition): string[] {
  const lines: string[] = [];

  lines.push(monsterKites(def)
    ? `Kiter — attacks from range (${def.attackStyle} style)`
    : monsterIsRanged(def)
    ? `Attacks from range (${def.attackStyle} style)`
    : `Melee attacker (${def.attackStyle} style)`);

  if (def.chargeOnAggro) {
    const c = def.chargeOnAggro;
    lines.push(`Charges at ${round1(c.speedMult)}× speed for ${sec(c.durationMs)} when it first spots you`);
  }

  if (def.dotEffect) {
    const d = def.dotEffect;
    const dur = d.durationMs ? `, lasts ${sec(d.durationMs)}` : '';
    const debuff = resolveMonsterDotDebuff({ monster: def });
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

  if (def.rampOnCombat) {
    const r = def.rampOnCombat;
    lines.push(`Its ${r.stat} ramps +${pct(r.perTickPct)} every ${sec(r.tickIntervalMs)} in combat, up to +${pct(r.maxPct)}`);
  }

  if (def.rampDebuff) {
    const r = def.rampDebuff;
    lines.push(`Each hit stacks a move slow (max ${pct(r.moveSlowMaxPct)}) and attack-speed slow (max ${pct(r.atkSlowMaxPct)}); decays ${sec(r.stackDurationMs)} after the last hit`);
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
