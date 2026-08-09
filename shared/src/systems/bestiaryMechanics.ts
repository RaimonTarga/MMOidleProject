import type { MonsterDefinition, BossAction } from '../data/monsters/types';
import { monsterIsRanged, monsterKites } from '../data/monsters/behavior';
import type { DungeonMonsterModifiers } from '../dungeons/gauntletTypes';
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

function describeBossAction(a: BossAction): string {
  switch (a.type) {
    case 'enrage':
      return `enrage (${fmtMult(a.atkMult)} atk, ${fmtMult(a.cdMult)} attack speed${a.durationMs ? ` for ${fmtMs(a.durationMs)}` : ''})`;
    case 'regen':
      return `regenerate ${fmtPct(a.hpPctPerSec)} HP/s${a.durationMs ? ` for ${fmtMs(a.durationMs)}` : ''}`;
    case 'shield':
      return `+${fmtPct(a.drAdd)} damage reduction for ${fmtMs(a.durationMs)}`;
    case 'summon':
      return `summon ${a.count}× ${a.monsterTypeId}`;
    case 'spawn-adds':
      return `spawn ${a.count}× ${a.monsterTypeId}`;
    case 'stat-buff':
      return `${fmtMult(a.mult)} ${a.stat}${a.durationMs ? ` for ${fmtMs(a.durationMs)}` : ''}`;
    case 'slam':
      return `AoE slam (${a.radius}px, ${fmtMult(a.damageMult ?? 1)} attack)`;
    case 'apply-shield':
      return `gains a ${fmtPct(a.shieldPct)} max-HP barrier every ${fmtMs(a.intervalMs)}`;
    case 'apply-soft-cap':
      return `gains a damage soft-cap (hits over ${fmtPct(a.capPct)} HP scaled ${fmtMult(a.capMult)})`;
    case 'shed-defense':
      return `sheds all defenses`;
    case 'modify-ramp-debuff':
      return `raises slow-debuff caps`;
    case 'morph':
      return `changes stance${a.isRanged !== undefined ? a.isRanged ? ' → ranged' : ' → melee' : ''}`;
    default:
      return (a as { type: string }).type;
  }
}

/**
 * Build the full ordered list of secondary-mechanic lines for a monster, applying
 * the same dungeon/gauntlet modifiers used for its stats (so DoT scaling matches).
 */
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
        (def.dotEffect.durationMs ? `, lasts ${fmtMs(def.dotEffect.durationMs)}.` : '.') +
        (def.dotEffect.bypassShield ? ' Bypasses shields.' : ''),
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

  if (def.cadenceFinisher) {
    lines.push({
      id: 'cadence',
      icon: '⚔',
      label: 'Cadence finisher',
      detail: `Every ${def.cadenceFinisher.everyNAttacks}th attack hits for ${fmtMult(def.cadenceFinisher.multiplier)} damage.`,
    });
  }

  if (def.empoweredCooldown) {
    lines.push({
      id: 'empowered-cd',
      icon: '⏱',
      label: 'Empowered strike',
      detail: `Every ${fmtMs(def.empoweredCooldown.cooldownMs)}, its next attack hits for ${fmtMult(def.empoweredCooldown.multiplier)} damage.`,
    });
  }

  if (def.enemyShield) {
    lines.push({
      id: 'shield',
      icon: '◈',
      label: 'Periodic shield',
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
      detail: `Bursts to ${fmtMult(def.chargeOnAggro.speedMult)} move speed for ${fmtMs(def.chargeOnAggro.durationMs)} when it first aggros.`,
    });
  }

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
        detail: phase.actions.map(describeBossAction).join('; ') + '.',
      });
    }
    (def.bossScript.repeating ?? []).forEach((r, i) => {
      lines.push({
        id: `repeat-${i}`,
        icon: '↻',
        label: `Every ${fmtMs(r.intervalMs)}`,
        detail: r.actions.map(describeBossAction).join('; ') + '.',
      });
    });
  }

  if (def.ultimateEncounter) {
    lines.push({
      id: 'ultimate',
      icon: '☠',
      label: 'Multi-stage encounter',
      detail: `A staged boss fight (${def.ultimateEncounter.stages.length} stages) with objectives between phases.`,
    });
  }

  return lines;
}
