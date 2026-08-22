import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  BIOME_DATABASE,
  emptyEquipment,
  estimateMonsterHitDamage,
  GAME_CONFIG,
  getMaxUpgrade,
  ITEM_DATABASE,
  MAX_UPGRADE,
  MONSTER_DATABASE,
  recalculatePlayerStats,
  upgradeMechanicEffectsTotal,
  upgradeStatBonusTotal,
  SKILL_TREE,
  type CombatArchetype,
  type ItemDefinition,
  type MonsterDefinition,
  type PassiveMap,
  type PlayerStatsTarget,
  type SkillNode,
  type SubVariant,
} from '@mmo-idle/shared';

// ─────────────────────────────────────────────────────────────────────────────
// Survivability (eHP / TTL / sustain) report — the defensive sibling of
// tools/dps-report.ts. Same philosophy: a deterministic, theory-only estimate
// built from shared formulas plus a re-implementation of the server defense
// pipeline (server/src/systems/defense/*) as steady-state averages. It is NOT a
// combat simulator: no movement, pathing, real AoE target count, enemy AI,
// kiting, or party effects. Every approximation is surfaced in row notes.
//
// What it sweeps: every class build (root / frame / range / spec, mirroring the
// DPS tool) crossed with armor × recovery (charm) item combinations. Weapon is
// held empty (it carries no defensive stats) and the mobility slot is excluded
// (movement-only). Incoming pressure comes from biome mobs one tier below the
// report tier, plus representative "shape" attackers and boss spike profiles.
// ─────────────────────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = process.argv.slice(2);
const OPTIONS = {
  excludeConduit: ARGS.includes('--exclude-conduit'),
  llmPacket: ARGS.includes('--llm-packet'),
  tier: numberArg('--tier'),
};
const REPORT_PATH = path.join(
  REPO_ROOT,
  'reports',
  OPTIONS.excludeConduit ? 'ehp-report-no-conduit.html' : 'ehp-report.html',
);

type RangeKind = 'close' | 'mid' | 'far';
const RANGE_CHOICES = ['close', 'far'] as const satisfies readonly RangeKind[];
// Fully-upgraded gear. Tracks the shared cap so the report never drifts behind
// it again — this was a literal `3` after MAX_UPGRADE moved 3 → 5, which
// silently under-reported every item by two upgrade levels.
const ITEM_UPGRADE_LEVEL = MAX_UPGRADE;
const REPORT_HORIZON_SEC = 60;
// Window over which sustained recovery is folded into the survival-score ranking.
// Short enough to weight a dangerous burst, long enough to reward sustain charms.
const RECOVERY_WINDOW_SEC = 15;
const CONDUIT_CLASS_ID = 'summoner-root';
const TUTORIAL_MONSTER_IDS = new Set(['tiny-slime']);
const DR_CAP = 0.9; // mirrors the shared stats.ts DR clamp and the in-place server clamps

function numberArg(name: string): number | null {
  const equals = ARGS.find((arg) => arg.startsWith(`${name}=`));
  const index = ARGS.indexOf(name);
  const raw = equals ? equals.slice(name.length + 1) : index >= 0 ? ARGS[index + 1] : undefined;
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface BuildCombo {
  classId: string;
  className: string;
  frameId: string | null;
  frameName: string;
  subVariant: SubVariant | null;
  rangeId: string | null;
  rangeName: string;
  rangeKind: RangeKind | null;
  specId: string | null;
  specName: string;
  archetype: Exclude<CombatArchetype, null>;
  unlockedSkills: string[];
}

interface Attacker {
  label: string;
  source: string;
  attack: number;
  attackCooldown: number; // ms between attacks
  dotDps: number; // raw DoT damage/s at steady-state max stacks (pre-resist)
  dotBypassShield: boolean;
  /** Largest single-hit multiplier this attacker can land (cadence/cooldown/aoe/ramp). */
  spikeMult: number;
}

interface Survivability {
  maxHp: number;
  plating: number;
  damageReduction: number;
  dodgeRate: number;
  evadeMitigation: number;
  ehp: number; // effective HP vs this attacker (maxHp scaled by all avoidance + mitigation)
  survivalScore: number; // eHP plus recovery-over-window, both amplified by mitigation
  mitigationPct: number; // 1 - incoming/raw
  incomingDps: number; // to HP, post-mitigation/resist/evasion, before recovery
  recoveryDps: number; // averaged steady-state HoT/shield throughput
  netHpPerSec: number; // recovery - incoming
  ttlSec: number; // Infinity when the build sustains
  biggestHit: number; // post-mitigation + damage-cap spike hit
  biggestHitPct: number; // biggestHit / maxHp
  oneShotRisk: boolean;
  notes: string[];
}

interface ReportRow extends Survivability {
  tier: number;
  classId: string;
  className: string;
  frameName: string;
  rangeName: string;
  specName: string;
  buildKey: string;
  armorId: string;
  armorName: string;
  recoveryId: string | null;
  recoveryName: string;
  plus: typeof ITEM_UPGRADE_LEVEL;
  combo: BuildCombo;
}

type OutlierFlag = '' | 'FRAGILE' | 'TANKY' | 'EXTREME_FRAGILE' | 'EXTREME_TANKY';

const CLASS_COLORS: Record<string, string> = {
  'cadence-root': '#2563eb',
  'cooldown-root': '#7c3aed',
  'dot-root': '#15803d',
  'energy-root': '#c2410c',
  'reload-root': '#be123c',
  'summoner-root': '#0f766e',
};

// ─── Small formatting helpers (shared shape with dps-report) ─────────────────

function archetypeForClassId(classId: string): Exclude<CombatArchetype, null> {
  return classId.replace(/-root$/, '') as Exclude<CombatArchetype, null>;
}

function asNumber(value: number): string {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '0';
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function html(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function classColor(classId: string): string {
  return CLASS_COLORS[classId] ?? '#4b5563';
}

function classBadge(classId: string, className: string): string {
  return `<span class="class-badge" style="--class-color: ${html(classColor(classId))}">${html(className)}</span>`;
}

function outlierTone(flag: OutlierFlag): 'positive' | 'negative' | '' {
  if (flag === 'TANKY' || flag === 'EXTREME_TANKY') return 'positive';
  if (flag === 'FRAGILE' || flag === 'EXTREME_FRAGILE') return 'negative';
  return '';
}

function outlierFlag(value: number, average: number): OutlierFlag {
  if (average <= 0) return '';
  const ratio = value / average;
  if (ratio >= 2) return 'EXTREME_TANKY';
  if (ratio >= 1.5) return 'TANKY';
  if (ratio <= 0.5) return 'EXTREME_FRAGILE';
  if (ratio <= 0.67) return 'FRAGILE';
  return '';
}

function skill(id: string): SkillNode {
  const node = SKILL_TREE.get(id);
  if (!node) throw new Error(`Missing skill node: ${id}`);
  return node;
}

function skillById(id: string): SkillNode | undefined {
  return SKILL_TREE.get(id);
}

// ─── Build combo generation (mirrors dps-report.ts) ──────────────────────────

function classRoots(): SkillNode[] {
  return [...SKILL_TREE.values()]
    .filter((node) => node.tier === 0 && node.classId === node.id)
    .filter((node) => !(OPTIONS.excludeConduit && node.id === CONDUIT_CLASS_ID))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function frameNodes(classId: string): SkillNode[] {
  return [...SKILL_TREE.values()]
    .filter((node) => node.tier === 1 && node.classId === classId && node.subVariantId)
    .sort((a, b) => String(a.subVariantId).localeCompare(String(b.subVariantId)));
}

function specNodes(classId: string, subVariant: SubVariant): SkillNode[] {
  return [...SKILL_TREE.values()]
    .filter((node) => node.tier === 3 && node.classId === classId && node.subVariantId === subVariant)
    .sort((a, b) => a.id.localeCompare(b.id));
}

interface BuildComboOptions {
  tier4MidOnly?: boolean;
}

function rangeChoicesForTier(classTier: number, options: BuildComboOptions): Array<RangeKind | null> {
  if (classTier < 2) return [null];
  if (options.tier4MidOnly && classTier === 3) return ['mid'];
  return [...RANGE_CHOICES];
}

function buildCombosForTier(classTier: number, options: BuildComboOptions = {}): BuildCombo[] {
  const combos: BuildCombo[] = [];
  for (const root of classRoots()) {
    const archetype = archetypeForClassId(root.id);
    const frames = classTier >= 1 ? frameNodes(root.id) : [null];
    for (const frame of frames) {
      const subVariant = frame?.subVariantId ?? null;
      const ranges = rangeChoicesForTier(classTier, options);
      for (const rangeKind of ranges) {
        const rangeId = rangeKind ? `${archetype}-range-${rangeKind}` : null;
        const range = rangeId ? skillById(rangeId) : null;
        const specs = classTier >= 3 && subVariant ? specNodes(root.id, subVariant) : [null];
        for (const spec of specs) {
          const unlockedSkills = [root.id];
          if (frame) unlockedSkills.push(frame.id);
          if (rangeId) unlockedSkills.push(rangeId);
          if (spec) unlockedSkills.push(spec.id);
          combos.push({
            classId: root.id,
            className: root.name,
            frameId: frame?.id ?? null,
            frameName: frame?.name ?? 'Not unlocked',
            subVariant,
            rangeId,
            rangeName: range?.name ?? 'Not unlocked',
            rangeKind,
            specId: spec?.id ?? null,
            specName: spec?.name ?? 'No spec',
            archetype,
            unlockedSkills,
          });
        }
      }
    }
  }
  return combos;
}

function formatBuildCombo(combo: BuildCombo, reportTier: number): string {
  const parts = [combo.className];
  if (reportTier >= 2) parts.push(combo.frameName);
  if (reportTier >= 3) parts.push(combo.rangeName);
  if (reportTier >= 4) parts.push(combo.specName);
  return parts.join(' / ');
}

// ─── Defensive item pools ────────────────────────────────────────────────────

function itemsForSlotTier(slot: 'armor' | 'recovery', reportTier: number): ItemDefinition[] {
  return [...ITEM_DATABASE.values()]
    .filter((item) => item.slot === slot && item.tier === reportTier)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function availableReportTiers(): number[] {
  return [...new Set([...ITEM_DATABASE.values()]
    .filter((item) => item.slot === 'armor' && item.tier > 0)
    .map((item) => item.tier))]
    .sort((a, b) => a - b);
}

// ─── Attacker model (the reverse of the DPS tool's target dummy) ──────────────

function isReportMonster(monster: MonsterDefinition): boolean {
  return !monster.isBoss &&
    monster.biome !== 'testroom' &&
    !monster.interactKind &&
    !TUTORIAL_MONSTER_IDS.has(monster.id);
}

function monstersForBiomeTier(biomeTier: number): MonsterDefinition[] {
  const ids = new Set<string>();
  for (const biome of BIOME_DATABASE.values()) {
    for (const monsterId of biome.monsterPoolByTier[biomeTier] ?? []) {
      ids.add(monsterId);
    }
  }
  return [...ids]
    .map((id) => MONSTER_DATABASE.get(id))
    .filter((monster): monster is MonsterDefinition => Boolean(monster && isReportMonster(monster)))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function attackerMonsterSource(reportTier: number): { monsters: MonsterDefinition[]; sourceTier: number; usedFallback: boolean } {
  const requestedTier = Math.max(0, reportTier - 1);
  const requested = monstersForBiomeTier(requestedTier);
  if (requested.length > 0) return { monsters: requested, sourceTier: requestedTier, usedFallback: false };
  return { monsters: monstersForBiomeTier(1), sourceTier: 1, usedFallback: true };
}

function bossesForBiomeTier(biomeTier: number): MonsterDefinition[] {
  const ids = new Set<string>();
  for (const biome of BIOME_DATABASE.values()) {
    for (const monsterId of biome.monsterPoolByTier[biomeTier] ?? []) ids.add(monsterId);
  }
  // Bosses are not in spawn pools; pull every boss whose biome matches a tier biome.
  const tierBiomes = new Set([...BIOME_DATABASE.values()]
    .filter((b) => (b.monsterPoolByTier[biomeTier] ?? []).length > 0)
    .map((b) => b.id));
  return [...MONSTER_DATABASE.values()]
    .filter((m) => m.isBoss && m.biome !== 'testroom' && tierBiomes.has(m.biome))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function monsterDotDps(monster: MonsterDefinition): { dps: number; bypass: boolean } {
  const d = monster.dotEffect;
  if (!d) return { dps: 0, bypass: false };
  const ticksPerSec = 1000 / Math.max(1, d.tickIntervalMs);
  // Steady-state: the player is carrying the full stack count (refreshed each hit).
  return { dps: d.maxStacks * d.damagePerStack * ticksPerSec, bypass: Boolean(d.bypassShield) };
}

function monsterSpikeMult(monster: MonsterDefinition): number {
  let mult = 1;
  if (monster.cadenceFinisher) mult = Math.max(mult, monster.cadenceFinisher.multiplier);
  if (monster.empoweredCooldown) mult = Math.max(mult, monster.empoweredCooldown.multiplier);
  if (monster.aoeAttack) mult = Math.max(mult, 1 + (monster.aoeAttack.damageMult ?? 1));
  if (monster.rampOnCombat) mult = Math.max(mult, 1 + monster.rampOnCombat.maxPct);
  if (monster.bossScript) {
    for (const phase of monster.bossScript.phases ?? []) {
      for (const action of phase.actions) {
        if (action.type === 'enrage') mult = Math.max(mult, action.atkMult);
        if (action.type === 'stat-buff' && action.stat === 'attack') mult = Math.max(mult, action.mult);
        if (action.type === 'slam') mult = Math.max(mult, action.damageMult ?? 1);
      }
    }
  }
  return mult;
}

function attackerFromMonster(monster: MonsterDefinition, label: string): Attacker {
  const dot = monsterDotDps(monster);
  return {
    label,
    source: monster.name,
    attack: monster.stats.attack,
    attackCooldown: Math.max(100, monster.stats.attackCooldown),
    dotDps: dot.dps,
    dotBypassShield: dot.bypass,
    spikeMult: monsterSpikeMult(monster),
  };
}

function averageAttackerForTier(reportTier: number): Attacker & { monsterCount: number; sourceTier: number; usedFallback: boolean } {
  const source = attackerMonsterSource(reportTier);
  const pool = source.monsters;
  const count = Math.max(1, pool.length);
  const acc = pool.reduce(
    (a, m) => {
      const dot = monsterDotDps(m);
      a.attack += m.stats.attack;
      a.cooldown += Math.max(100, m.stats.attackCooldown);
      a.dot += dot.dps;
      a.spike += monsterSpikeMult(m);
      if (dot.bypass) a.bypass = true;
      return a;
    },
    { attack: 0, cooldown: 0, dot: 0, spike: 0, bypass: false },
  );
  return {
    label: `neutral T${reportTier} attacker`,
    source: `${pool.length} mob average, biome tier ${source.sourceTier}${source.usedFallback ? ' fallback' : ''}`,
    attack: acc.attack / count,
    attackCooldown: acc.cooldown / count,
    dotDps: acc.dot / count,
    dotBypassShield: acc.bypass,
    spikeMult: acc.spike / count,
    monsterCount: pool.length,
    sourceTier: source.sourceTier,
    usedFallback: source.usedFallback,
  };
}

/** Named "shape" attackers: the worst case along each offensive axis. */
function representativeAttackers(reportTier: number): Attacker[] {
  const pool = attackerMonsterSource(reportTier).monsters;
  if (pool.length === 0) return [];
  const picks: Attacker[] = [];
  const used = new Set<string>();
  const add = (label: string, monster: MonsterDefinition | undefined) => {
    if (!monster || used.has(monster.id)) return;
    used.add(monster.id);
    picks.push(attackerFromMonster(monster, label));
  };

  add('Hardest hitter', [...pool].sort((a, b) => b.stats.attack - a.stats.attack)[0]);
  add('Fastest attacker', [...pool].sort((a, b) => a.stats.attackCooldown - b.stats.attackCooldown)[0]);
  add('DoT-heavy', [...pool].sort((a, b) => monsterDotDps(b).dps - monsterDotDps(a).dps)[0]);
  add('Biggest spike', [...pool].sort((a, b) => monsterSpikeMult(b) - monsterSpikeMult(a))[0]);

  const bosses = bossesForBiomeTier(Math.max(0, reportTier - 1));
  const topBoss = [...bosses].sort((a, b) =>
    b.stats.attack * monsterSpikeMult(b) - a.stats.attack * monsterSpikeMult(a))[0];
  if (topBoss) {
    used.add(topBoss.id);
    picks.push(attackerFromMonster(topBoss, 'Boss spike'));
  }
  return picks;
}

// ─── Player stats target ──────────────────────────────────────────────────────

function makeStatsTarget(
  combo: BuildCombo,
  armor: ItemDefinition,
  recovery: ItemDefinition | null,
  plus: number,
  tier: number,
): PlayerStatsTarget {
  const equipment = emptyEquipment();
  equipment.armor = armor.id;
  if (recovery) equipment.recovery = recovery.id;
  const inventory = [armor.id];
  const itemUpgrades: Record<string, number> = { [armor.id]: Math.min(plus, getMaxUpgrade(armor)) };
  if (recovery) {
    inventory.push(recovery.id);
    itemUpgrades[recovery.id] = Math.min(plus, getMaxUpgrade(recovery));
  }
  return {
    dealsDamage: { attack: 0, onHitDamage: 0, attackStyle: 'slash' },
    mitigatesDamage: { plating: 0, damageReduction: 0 },
    evadesHits: { dodgeRate: 0, evadeMitigation: 0 },
    performsAttack: { attackRange: 0, attackCooldown: 0, lastAttackAt: 0 },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP },
    hasPosition: { current: { x: 0, y: 0 }, nodeId: 'report', speed: 0 },
    usesSkills: {
      unlockedSkills: combo.unlockedSkills,
      passives: {},
      selectedClass: combo.classId,
      selectedSubVariant: combo.subVariant,
      selectedRange: combo.rangeId,
      combatArchetype: combo.archetype,
    },
    holdsInventory: { inventory, equipment, itemUpgrades },
    playerTier: tier,
  };
}

// ─── Defensive math (steady-state re-implementation of server/defense/*) ──────

/** Per-hit soft damage cap: defense.max-hit-pct / defense.max-hit-mult. */
function applyDamageCap(hit: number, maxHp: number, p: PassiveMap): number {
  const pct = p['defense.max-hit-pct'] ?? 0;
  if (pct <= 0) return hit;
  const threshold = maxHp * pct;
  if (hit <= threshold) return hit;
  const mult = p['defense.max-hit-mult'] ?? 1;
  return Math.ceil(threshold + (hit - threshold) * mult);
}

/**
 * Averaged steady-state healing (HP/s) from Recovery access, absorb and cleanse.
 * In-combat only, so every Recovery source is expressed as the fraction of the
 * player's Recovery RATE it switches on, averaged across its duty cycle.
 */
function recoveryPerSec(
  maxHp: number,
  recoveryStat: number,
  p: PassiveMap,
  incomingDirectDps: number,
  notes: string[],
): number {
  // HP/s at 100% active Recovery. Every access fraction below is a share of this.
  const fullRate = maxHp * (recoveryStat / 100);
  let healPerSec = 0;

  const inCombatPct = p['defense.recovery-active-pct'] ?? 0;
  if (inCombatPct > 0) {
    healPerSec += fullRate * inCombatPct;
    notes.push(`${Math.round(inCombatPct * 100)}% Recovery always active (${asNumber(fullRate)}/s at 100%)`);
  }

  const rampStart = p['defense.recovery-ramp-start-pct'] ?? 0;
  if (rampStart > 0) {
    const rampMax = p['defense.recovery-ramp-max-pct'] ?? rampStart;
    const avgPct = (rampStart + rampMax) / 2;
    healPerSec += fullRate * avgPct;
    notes.push(`ramping Recovery averaged ${Math.round(avgPct * 100)}% over the ramp window`);
  }

  // Damage absorb: a fraction of incoming direct damage is repaid as a HoT.
  const flatAbsorb = p['defense.absorb-pct'] ?? 0;
  const rampAbsorbMax = p['defense.absorb-ramp-max-pct'] ?? 0;
  let absorbPct = flatAbsorb;
  if (rampAbsorbMax > 0) {
    const rampStartPct = p['defense.absorb-ramp-start-pct'] ?? 0;
    absorbPct = Math.max(flatAbsorb, (rampStartPct + rampAbsorbMax) / 2);
  }
  if (absorbPct > 0) {
    healPerSec += incomingDirectDps * absorbPct;
    notes.push(`absorb repays ${Math.round(absorbPct * 100)}% of incoming as HoT`);
  }

  // Periodic Recovery pulse, averaged over its duty cycle: the fraction is only
  // switched on for `duration` out of every `interval`.
  const pulsePct = p['defense.recovery-pulse-pct'] ?? 0;
  const pulseInterval = p['defense.recovery-pulse-interval-ms'] ?? 0;
  if (pulsePct > 0 && pulseInterval > 0) {
    const pulseDuration = p['defense.recovery-pulse-duration-ms'] ?? GAME_CONFIG.RECOVERY_PULSE_MS;
    const duty = Math.min(1, pulseDuration / pulseInterval);
    healPerSec += fullRate * pulsePct * duty;
    notes.push(
      `Recovery pulse ${Math.round(pulsePct * 100)}% for ${pulseDuration / 1000}s every ${pulseInterval / 1000}s`,
    );
  }

  // On-kill Recovery is deliberately NOT modeled: its value is entirely a
  // function of kill cadence, which this tool does not simulate. A chain-farming
  // charm will therefore read as worthless here — that is a known blind spot,
  // not a balance signal.

  // NOTE: the barrier is deliberately NOT modeled here. It is a one-time buffer,
  // not throughput — under the recharge rule it only refills after 4s undamaged,
  // which never happens inside a modeled fight. It is added to the effective pool
  // in `survivability` instead.

  // Cleanse empty-heal (no player debuffs modeled, so the empty-heal branch).
  const cleanseEmpty = p['defense.cleanse-empty-heal-pct'] ?? 0;
  const cleanseInterval = p['defense.cleanse-interval-ms'] ?? 0;
  if (cleanseEmpty > 0 && cleanseInterval > 0) {
    healPerSec += (maxHp * cleanseEmpty) / (cleanseInterval / 1000);
    notes.push(`cleanse empty-heal ${Math.round(cleanseEmpty * 100)}% maxHp / ${cleanseInterval / 1000}s`);
  }

  return healPerSec;
}

function evaluateSurvivability(stats: PlayerStatsTarget, attacker: Attacker): Survivability {
  const p = stats.usesSkills.passives;
  const maxHp = stats.hasHealth.maxHp;
  const plating = stats.mitigatesDamage.plating;
  const damageReduction = stats.mitigatesDamage.damageReduction;
  const dodgeRate = stats.evadesHits.dodgeRate;
  const evadeMitigation = stats.evadesHits.evadeMitigation;
  const recovery = stats.hasHealth.recovery ?? 0;
  const notes: string[] = [];

  const hitsPerSec = 1000 / attacker.attackCooldown;
  // Average fraction of a hit's damage that lands after deterministic evasion.
  const evadeFactor = Math.max(0, 1 - dodgeRate * evadeMitigation);

  // Direct hit → mitigated (plating + DR) → soft damage cap.
  const baseHit = estimateMonsterHitDamage({
    attack: attacker.attack,
    targetPlating: plating,
    targetDamageReduction: damageReduction,
  });
  const cappedHit = applyDamageCap(baseHit, maxHp, p);
  if (cappedHit < baseHit) notes.push(`damage cap clips hits above ${Math.round((p['defense.max-hit-pct'] ?? 0) * 100)}% maxHp`);

  let directDps = cappedHit * hitsPerSec * evadeFactor;

  // Hit-to-DoT: redirect a fraction to a debt pool that drains with dot-resistance.
  const dotResist = Math.min(0.9, p['defense.dot-resistance'] ?? 0);
  const hitToDot = Math.min(0.5, p['defense.hit-to-dot-pct'] ?? 0);
  if (hitToDot > 0) {
    directDps = directDps * (1 - hitToDot) + directDps * hitToDot * (1 - dotResist);
    notes.push(`hit-to-dot redirects ${Math.round(hitToDot * 100)}% (then -${Math.round(dotResist * 100)}% dot-resist)`);
  }

  // Incoming DoT from the attacker, reduced by dot-resistance.
  const dotToHp = attacker.dotDps * (1 - dotResist);
  if (attacker.dotDps > 0 && dotResist > 0) notes.push(`-${Math.round(dotResist * 100)}% dot-resistance on incoming DoT`);

  const incomingDps = directDps + dotToHp;
  const rawDps = attacker.attack * hitsPerSec + attacker.dotDps; // no mitigation/avoidance
  const mitigationPct = rawDps > 0 ? Math.max(0, 1 - incomingDps / rawDps) : 0;
  const ehp = incomingDps > 0 ? maxHp * (rawDps / incomingDps) : Number.POSITIVE_INFINITY;

  // Recovery and sustain.
  const recoveryDps = recoveryPerSec(maxHp, recovery, p, directDps, notes);
  const netHpPerSec = recoveryDps - incomingDps;

  // Survival score: real pool + recovery over a fixed window, scaled by the same
  // mitigation multiplier eHP uses. Unlike raw eHP this responds to recovery, so
  // charms (which live in the recovery lane) actually rank.
  const mitigationMult = maxHp > 0 && Number.isFinite(ehp) ? ehp / maxHp : Number.POSITIVE_INFINITY;
  // The barrier scales with the same mitigation multiplier as the HP pool: it
  // absorbs post-mitigation damage one-for-one, exactly like health does.
  const barrierPool = (p['defense.barrier-pct'] ?? 0) * maxHp;
  const survivalScore = Number.isFinite(ehp)
    ? ehp + (barrierPool + recoveryDps * RECOVERY_WINDOW_SEC) * mitigationMult
    : Number.POSITIVE_INFINITY;

  // Effective health pool for time-to-live (one-time saves, not throughput).
  const barrierAmount = (p['defense.barrier-pct'] ?? 0) * maxHp;
  let pool = maxHp + barrierAmount;
  if (barrierAmount > 0) {
    notes.push(
      `barrier ${Math.round((p['defense.barrier-pct'] ?? 0) * 100)}% maxHp `
      + '(one-time buffer — no in-fight recharge)',
    );
  }
  if ((p['defense.cheat-death'] ?? 0) > 0) {
    const postHeal = (p['defense.post-cheat-death-heal-pct'] ?? 0) * maxHp;
    pool += maxHp + postHeal; // a second near-full bar plus its recovery HoT
    notes.push('cheat-death grants one extra near-full bar');
  }

  const ttlSec = netHpPerSec >= 0 || incomingDps <= 0
    ? Number.POSITIVE_INFINITY
    : pool / -netHpPerSec;

  // Burst survivability: the biggest single hit this attacker can land.
  const spikeBase = estimateMonsterHitDamage({
    attack: attacker.attack * attacker.spikeMult,
    targetPlating: plating,
    targetDamageReduction: damageReduction,
  });
  const biggestHit = applyDamageCap(spikeBase, maxHp, p);
  // A full barrier is the realistic opening state of an engagement, so it counts
  // toward the one-shot buffer.
  const standingBarrier = (p['defense.barrier-pct'] ?? 0) * maxHp;
  const oneShotRisk = biggestHit >= maxHp + standingBarrier && (p['defense.cheat-death'] ?? 0) <= 0;
  if (oneShotRisk) notes.push(`spike hit ${asNumber(biggestHit)} can one-shot (${asNumber(maxHp + standingBarrier)} buffer)`);

  return {
    maxHp,
    plating,
    damageReduction,
    dodgeRate,
    evadeMitigation,
    ehp,
    survivalScore,
    mitigationPct,
    incomingDps,
    recoveryDps,
    netHpPerSec,
    ttlSec,
    biggestHit,
    biggestHitPct: biggestHit / Math.max(1, maxHp),
    oneShotRisk,
    notes,
  };
}

// ─── Row building ─────────────────────────────────────────────────────────────

function buildRowsForTier(reportTier: number, comboOptions: BuildComboOptions = {}): ReportRow[] {
  const classTier = reportTier - 1;
  const attacker = averageAttackerForTier(reportTier);
  const armors = itemsForSlotTier('armor', reportTier);
  const recoveries = itemsForSlotTier('recovery', reportTier);
  const recoveryChoices: Array<ItemDefinition | null> = recoveries.length > 0 ? recoveries : [null];
  const combos = buildCombosForTier(classTier, comboOptions);
  const rows: ReportRow[] = [];

  for (const combo of combos) {
    for (const armor of armors) {
      for (const recovery of recoveryChoices) {
        const plus = ITEM_UPGRADE_LEVEL;
        const stats = makeStatsTarget(combo, armor, recovery, plus, classTier);
        recalculatePlayerStats(stats);
        const surv = evaluateSurvivability(stats, attacker);
        rows.push({
          tier: reportTier,
          classId: combo.classId,
          className: combo.className,
          frameName: combo.frameName,
          rangeName: combo.rangeName,
          specName: combo.specName,
          buildKey: formatBuildCombo(combo, reportTier),
          armorId: armor.id,
          armorName: armor.name,
          recoveryId: recovery?.id ?? null,
          recoveryName: recovery?.name ?? 'None',
          plus,
          combo,
          ...surv,
        });
      }
    }
  }
  return rows;
}

function evaluateRowAgainst(row: ReportRow, attacker: Attacker): Survivability {
  const armor = ITEM_DATABASE.get(row.armorId)!;
  const recovery = row.recoveryId ? ITEM_DATABASE.get(row.recoveryId) ?? null : null;
  const stats = makeStatsTarget(row.combo, armor, recovery, row.plus, row.tier - 1);
  recalculatePlayerStats(stats);
  return evaluateSurvivability(stats, attacker);
}

// ─── Aggregation helpers ──────────────────────────────────────────────────────

function averageBy<T extends string>(
  rows: ReportRow[],
  keyFn: (row: ReportRow) => T,
  valueFn: (row: ReportRow) => number = (row) => row.survivalScore,
): Array<{ key: T; avg: number; count: number }> {
  const buckets = new Map<T, { sum: number; count: number }>();
  for (const row of rows) {
    const key = keyFn(row);
    const bucket = buckets.get(key) ?? { sum: 0, count: 0 };
    bucket.sum += valueFn(row);
    bucket.count++;
    buckets.set(key, bucket);
  }
  return [...buckets.entries()].map(([key, bucket]) => ({ key, avg: bucket.sum / bucket.count, count: bucket.count }));
}

/** Best (tankiest) item loadout per class build, ranked by survival score. */
function optimalRowsByBuild(rows: ReportRow[]): ReportRow[] {
  const best = new Map<string, ReportRow>();
  for (const row of rows) {
    const current = best.get(row.buildKey);
    if (!current || row.survivalScore > current.survivalScore) best.set(row.buildKey, row);
  }
  return [...best.values()].sort((a, b) =>
    a.classId.localeCompare(b.classId) ||
    a.frameName.localeCompare(b.frameName) ||
    a.rangeName.localeCompare(b.rangeName) ||
    a.specName.localeCompare(b.specName));
}

// ─── HTML rendering ────────────────────────────────────────────────────────────

function renderSummaryTable(items: Array<Record<string, string | number>>): string {
  if (items.length === 0) return '<p>No data.</p>';
  const headers = Object.keys(items[0]);
  return `<table><thead><tr>${headers.map((h) => `<th>${html(h)}</th>`).join('')}</tr></thead><tbody>${
    items.map((item) => `<tr>${headers.map((h) => `<td>${html(item[h])}</td>`).join('')}</tr>`).join('')
  }</tbody></table>`;
}

function ttl(value: number): string {
  return Number.isFinite(value) ? `${asNumber(value)}s` : 'sustains';
}

function renderClassAverageTable(rows: ReportRow[]): string {
  const classAverages = averageBy(rows, (row) => row.classId).sort((a, b) => b.avg - a.avg);
  return `<table><thead><tr><th>Class</th><th>Avg survival</th><th>Samples</th></tr></thead><tbody>${
    classAverages.map((item) => {
      const row = rows.find((c) => c.classId === item.key);
      return `<tr><td>${row ? classBadge(row.classId, row.className) : html(item.key)}</td><td>${asNumber(item.avg)}</td><td>${item.count}</td></tr>`;
    }).join('')
  }</tbody></table>`;
}

function renderItemPerformanceTable(rows: ReportRow[], slot: 'armorName' | 'recoveryName', heading: string): string {
  const averages = averageBy(rows, (row) => row[slot]).sort((a, b) => b.avg - a.avg);
  const avg = averages.reduce((sum, item) => sum + item.avg, 0) / Math.max(1, averages.length);
  return `<table><thead><tr><th>${html(heading)}</th><th>Avg survival</th><th>Samples</th></tr></thead><tbody>${
    averages.map((item) => {
      const tone = outlierTone(outlierFlag(item.avg, avg));
      return `<tr><td>${html(item.key)}</td><td class="${tone ? `outlier ${tone}` : ''}">${asNumber(item.avg)}</td><td>${item.count}</td></tr>`;
    }).join('')
  }</tbody></table>`;
}

function buildDetailHeaders(reportTier: number): string {
  const headers = ['Class'];
  if (reportTier >= 2) headers.push('Frame');
  if (reportTier >= 3) headers.push('Range');
  if (reportTier >= 4) headers.push('Spec');
  return headers.map((h) => `<th>${h}</th>`).join('');
}

function buildDetailCells(row: ReportRow, reportTier: number): string {
  const cells = [classBadge(row.classId, row.className)];
  if (reportTier >= 2) cells.push(html(row.frameName));
  if (reportTier >= 3) cells.push(html(row.rangeName));
  if (reportTier >= 4) cells.push(html(row.specName));
  return cells.map((c) => `<td>${c}</td>`).join('');
}

function renderOptimalLoadoutTable(rows: ReportRow[], reportTier: number): string {
  const bestRows = optimalRowsByBuild(rows);
  const avg = bestRows.reduce((s, r) => s + r.survivalScore, 0) / Math.max(1, bestRows.length);
  return `<table><thead><tr>${buildDetailHeaders(reportTier)}<th>Best Armor</th><th>Charm</th><th>Survival</th><th>eHP</th><th>maxHP</th><th>Mitig%</th><th>TTL</th><th>Net HP/s</th><th>Spike %HP</th></tr></thead><tbody>${
    bestRows.map((row) => {
      const tone = outlierTone(outlierFlag(row.survivalScore, avg));
      return `<tr>
        ${buildDetailCells(row, reportTier)}
        <td>${html(row.armorName)} +${row.plus}</td>
        <td>${html(row.recoveryName)}${row.recoveryId ? ` +${row.plus}` : ''}</td>
        <td class="${tone ? `outlier ${tone}` : ''}">${asNumber(row.survivalScore)}</td>
        <td>${asNumber(row.ehp)}</td>
        <td>${asNumber(row.maxHp)}</td>
        <td>${asNumber(row.mitigationPct * 100)}%</td>
        <td>${ttl(row.ttlSec)}</td>
        <td>${asNumber(row.netHpPerSec)}</td>
        <td class="${row.oneShotRisk ? 'outlier negative' : ''}">${asNumber(row.biggestHitPct * 100)}%</td>
      </tr>`;
    }).join('')
  }</tbody></table>`;
}

function renderShapeSurvivalTable(reportTier: number, optimalRows: ReportRow[]): string {
  const attackers = representativeAttackers(reportTier);
  if (attackers.length === 0 || optimalRows.length === 0) return '<p>No representative attackers available.</p>';
  const sampled = optimalRows.slice().sort((a, b) => b.ehp - a.ehp).slice(0, 8);
  return `<details>
    <summary>Survival vs representative & boss-spike attackers (top builds)</summary>
    <table>
      <thead><tr><th>Build</th><th>Loadout</th>${attackers.map((a) => `<th>${html(a.label)}<br><span class="meta">${html(a.source)}</span></th>`).join('')}</tr></thead>
      <tbody>
        ${sampled.map((row) => `<tr>
          <td>${html(row.buildKey)}</td>
          <td>${html(row.armorName)} / ${html(row.recoveryName)}</td>
          ${attackers.map((attacker) => {
            const s = evaluateRowAgainst(row, attacker);
            const tone = s.oneShotRisk ? 'outlier negative' : '';
            return `<td class="${tone}">${ttl(s.ttlSec)}${s.oneShotRisk ? ' ⚠' : ''}<br><span class="meta">eHP ${asNumber(s.ehp)}</span></td>`;
          }).join('')}
        </tr>`).join('')}
      </tbody>
    </table>
  </details>`;
}

function renderAllSamplesTable(rows: ReportRow[], reportTier: number): string {
  const rowsByClass = new Map<string, ReportRow[]>();
  for (const row of rows) {
    const bucket = rowsByClass.get(row.classId) ?? [];
    bucket.push(row);
    rowsByClass.set(row.classId, bucket);
  }
  const ordered = [...rowsByClass.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([, bucket]) => bucket.sort((a, b) => b.ehp - a.ehp));

  let lastClassId = '';
  return `<table>
    <thead><tr>
      <th>eHP</th>${buildDetailHeaders(reportTier)}<th>Armor</th><th>Charm</th>
      <th>maxHP</th><th>Plating</th><th>DR</th><th>Dodge</th><th>Mitig%</th>
      <th>In DPS</th><th>Recov/s</th><th>Net/s</th><th>TTL</th><th>Spike %HP</th><th>Notes</th>
    </tr></thead>
    <tbody>
      ${ordered.map((row) => {
        const groupHeader = row.classId !== lastClassId
          ? (() => { lastClassId = row.classId; return `<tr class="class-group"><td colspan="${15 + Math.min(reportTier, 4)}">${classBadge(row.classId, row.className)}</td></tr>`; })()
          : '';
        return `${groupHeader}
          <tr>
            <td>${asNumber(row.ehp)}</td>
            ${buildDetailCells(row, reportTier)}
            <td>${html(row.armorName)} +${row.plus}</td>
            <td>${html(row.recoveryName)}</td>
            <td>${asNumber(row.maxHp)}</td>
            <td>${asNumber(row.plating)}</td>
            <td>${asNumber(row.damageReduction * 100)}%</td>
            <td>${asNumber(row.dodgeRate * 100)}%</td>
            <td>${asNumber(row.mitigationPct * 100)}%</td>
            <td>${asNumber(row.incomingDps)}</td>
            <td>${asNumber(row.recoveryDps)}</td>
            <td>${asNumber(row.netHpPerSec)}</td>
            <td>${ttl(row.ttlSec)}</td>
            <td class="${row.oneShotRisk ? 'outlier negative' : ''}">${asNumber(row.biggestHitPct * 100)}%</td>
            <td>${html([...new Set(row.notes)].join('; '))}</td>
          </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Progression-focused views: instead of only "same-tier +3 vs same-tier mobs",
// these model the moments that actually gate progression — entering a tier with
// old gear, gearing up, hitting the tier's bosses, and probing the next tier.
// ─────────────────────────────────────────────────────────────────────────────

type RouteStatus = 'Safe' | 'Risky' | 'Blocked';
const BOSS_TTL_RISK_SEC = 20;
const BOSS_TTL_BLOCK_SEC = 8;
const MOB_TTL_RISK_SEC = 30;
const MOB_TTL_BLOCK_SEC = 10;
const ITEM_OUTLIER_PCT = 0.25;

interface DataView { title: string; headers: string[]; rows: Array<Array<string | number>>; note?: string }

function routeStatus(s: Survivability, isBoss: boolean): RouteStatus {
  const block = isBoss ? BOSS_TTL_BLOCK_SEC : MOB_TTL_BLOCK_SEC;
  const risk = isBoss ? BOSS_TTL_RISK_SEC : MOB_TTL_RISK_SEC;
  if (s.oneShotRisk) return 'Blocked';
  if (!Number.isFinite(s.ttlSec)) return 'Safe';
  if (s.ttlSec < block) return 'Blocked';
  if (s.ttlSec < risk || s.netHpPerSec < 0) return 'Risky';
  return 'Safe';
}

function statusCell(status: RouteStatus): string {
  const color = status === 'Safe' ? '#15803d' : status === 'Risky' ? '#b45309' : '#b91c1c';
  return `<span style="color:${color};font-weight:700">${status}</span>`;
}

function htmlCell(c: string | number): string {
  if (c === 'Safe' || c === 'Risky' || c === 'Blocked') {
    const color = c === 'Safe' ? '#15803d' : c === 'Risky' ? '#b45309' : '#b91c1c';
    return `<td style="color:${color};font-weight:700">${c}</td>`;
  }
  return `<td>${c}</td>`;
}

function htmlTable(headers: string[], rows: Array<Array<string | number>>): string {
  return `<table><thead><tr>${headers.map((h) => `<th>${html(h)}</th>`).join('')}</tr></thead><tbody>${
    rows.map((r) => `<tr>${r.map(htmlCell).join('')}</tr>`).join('')
  }</tbody></table>`;
}

function summarizeTtl(vals: number[]): number {
  const finite = vals.filter(Number.isFinite);
  if (finite.length === 0) return Number.POSITIVE_INFINITY;
  return finite.reduce((a, b) => a + b, 0) / finite.length;
}

function reportMonstersForBiome(biome: BiomeDefinition, biomeTier: number): MonsterDefinition[] {
  return (biome.monsterPoolByTier[biomeTier] ?? [])
    .map((id) => MONSTER_DATABASE.get(id))
    .filter((m): m is MonsterDefinition => Boolean(m && isReportMonster(m)));
}

function averageAttacker(monsters: MonsterDefinition[], label: string, source: string): Attacker | null {
  if (monsters.length === 0) return null;
  const n = monsters.length;
  const acc = monsters.reduce((a, m) => {
    const dot = monsterDotDps(m);
    a.attack += m.stats.attack; a.cd += Math.max(100, m.stats.attackCooldown);
    a.dot += dot.dps; a.spike += monsterSpikeMult(m); if (dot.bypass) a.bypass = true;
    return a;
  }, { attack: 0, cd: 0, dot: 0, spike: 0, bypass: false });
  return { label, source, attack: acc.attack / n, attackCooldown: acc.cd / n, dotDps: acc.dot / n, dotBypassShield: acc.bypass, spikeMult: acc.spike / n };
}

/** All boss attackers for a biome tier (explicit boss pools, else heuristic),
 *  strongest first, de-duped by monster name. */
function bossAttackersForTier(biomeTier: number): Attacker[] {
  const out: Attacker[] = [];
  for (const biome of BIOME_DATABASE.values()) {
    for (const id of biome.bossPoolByTier?.[biomeTier] ?? []) {
      const m = MONSTER_DATABASE.get(id);
      if (m && m.biome !== 'testroom') out.push(attackerFromMonster(m, m.name));
    }
  }
  if (out.length === 0) for (const m of bossesForBiomeTier(biomeTier)) out.push(attackerFromMonster(m, m.name));
  const seen = new Set<string>();
  return out
    .sort((a, b) => b.attack * b.spikeMult - a.attack * a.spikeMult)
    .filter((a) => (seen.has(a.source) ? false : (seen.add(a.source), true)));
}

/** Worst-case boss attacker for a biome tier. */
function worstBossAttacker(biomeTier: number): Attacker | null {
  return bossAttackersForTier(biomeTier)[0] ?? null;
}

function attackerSummary(a: Attacker): string {
  return `${asNumber(a.attack)} atk / ${asNumber(1000 / a.attackCooldown)} aps / ${asNumber(a.dotDps)} dot / ×${asNumber(a.spikeMult)}`;
}

/** Spec-agnostic combo set used by the comparison/route/checkpoint views (keeps the
 *  cross-product tractable; full specs still appear in the collapsed sample dump). */
function comparisonCombos(reportTier: number): BuildCombo[] {
  return buildCombosForTier(Math.min(2, reportTier - 1));
}

function buildRowsWithCombos(
  reportTier: number, gearTier: number, plus: number, attacker: Attacker, combos: BuildCombo[],
): ReportRow[] {
  const classTier = reportTier - 1;
  const armors = itemsForSlotTier('armor', gearTier);
  const recoveries = itemsForSlotTier('recovery', gearTier);
  const recoveryChoices: Array<ItemDefinition | null> = recoveries.length ? recoveries : [null];
  const rows: ReportRow[] = [];
  for (const combo of combos) for (const armor of armors) for (const recovery of recoveryChoices) {
    const stats = makeStatsTarget(combo, armor, recovery, plus, classTier);
    recalculatePlayerStats(stats);
    const surv = evaluateSurvivability(stats, attacker);
    rows.push({
      tier: reportTier, classId: combo.classId, className: combo.className,
      frameName: combo.frameName, rangeName: combo.rangeName, specName: combo.specName,
      buildKey: formatBuildCombo(combo, reportTier),
      armorId: armor.id, armorName: armor.name,
      recoveryId: recovery?.id ?? null, recoveryName: recovery?.name ?? 'None',
      plus: plus as typeof ITEM_UPGRADE_LEVEL, combo, ...surv,
    });
  }
  return rows;
}

interface Checkpoint { label: string; gearTier: number; plus: number; attacker: Attacker; isBoss: boolean }

function checkpointsForTier(reportTier: number): Checkpoint[] {
  const curTier = attackerMonsterSource(reportTier).sourceTier;
  const curMobs = averageAttacker(monstersForBiomeTier(curTier), `T${reportTier} mobs`, `biome tier ${curTier}`);
  const nextSrc = attackerMonsterSource(reportTier + 1);
  const nextMobs = averageAttacker(monstersForBiomeTier(nextSrc.sourceTier), 'next-tier mobs', `biome tier ${nextSrc.sourceTier}`);
  const boss = worstBossAttacker(curTier);
  const cps: Checkpoint[] = [];
  if (curMobs && itemsForSlotTier('armor', reportTier - 1).length > 0)
    cps.push({ label: 'Prev-tier +3 vs current mobs', gearTier: reportTier - 1, plus: 3, attacker: curMobs, isBoss: false });
  if (curMobs) cps.push({ label: 'Current +0 vs current mobs (entry)', gearTier: reportTier, plus: 0, attacker: curMobs, isBoss: false });
  if (curMobs) cps.push({ label: 'Current +3 vs current mobs (geared)', gearTier: reportTier, plus: 3, attacker: curMobs, isBoss: false });
  if (boss) cps.push({ label: 'Current +3 vs boss/elite', gearTier: reportTier, plus: 3, attacker: boss, isBoss: true });
  if (nextMobs && nextSrc.sourceTier !== curTier)
    cps.push({ label: 'Current +3 vs next-tier mobs', gearTier: reportTier, plus: 3, attacker: nextMobs, isBoss: false });
  return cps;
}

interface CheckpointData { cp: Checkpoint; rows: ReportRow[]; best: ReportRow[] }

function computeCheckpoints(reportTier: number): CheckpointData[] {
  const combos = comparisonCombos(reportTier);
  return checkpointsForTier(reportTier).map((cp) => {
    const rows = buildRowsWithCombos(reportTier, cp.gearTier, cp.plus, cp.attacker, combos);
    return { cp, rows, best: optimalRowsByBuild(rows) };
  });
}

function progressionView(checkpoints: CheckpointData[]): DataView {
  return {
    title: 'Progression Checkpoints',
    headers: ['Checkpoint', 'Gear', 'Attacker', 'Avg eHP', 'Avg net/s', 'Min TTL', 'Safe %', 'Blocked'],
    rows: checkpoints.map(({ cp, best }) => {
      const n = Math.max(1, best.length);
      const avgEhp = best.reduce((s, r) => s + (Number.isFinite(r.ehp) ? r.ehp : 0), 0) / n;
      const avgNet = best.reduce((s, r) => s + r.netHpPerSec, 0) / n;
      const minTtl = Math.min(...best.map((r) => r.ttlSec));
      const safe = best.filter((r) => routeStatus(r, cp.isBoss) === 'Safe').length;
      const blocked = best.filter((r) => routeStatus(r, cp.isBoss) === 'Blocked').length;
      return [cp.label, `T${cp.gearTier} +${cp.plus}`, attackerSummary(cp.attacker),
        asNumber(avgEhp), asNumber(avgNet), ttl(minTtl), `${asNumber((safe / n) * 100)}%`, blocked];
    }),
  };
}

function classAvgByCheckpointView(checkpoints: CheckpointData[]): DataView {
  const classes = [...new Set(checkpoints.flatMap((c) => c.rows.map((r) => r.className)))].sort();
  return {
    title: 'Class Average eHP By Checkpoint',
    headers: ['Class', ...checkpoints.map((c) => c.cp.label)],
    rows: classes.map((cls) => [cls, ...checkpoints.map((c) => {
      const rows = c.best.filter((r) => r.className === cls);
      const n = Math.max(1, rows.length);
      return asNumber(rows.reduce((s, r) => s + (Number.isFinite(r.ehp) ? r.ehp : 0), 0) / n);
    })]),
  };
}

function biomeRouteView(reportTier: number): DataView {
  const curTier = attackerMonsterSource(reportTier).sourceTier;
  const combos = comparisonCombos(reportTier);
  const biomes = [...BIOME_DATABASE.values()].filter((b) => reportMonstersForBiome(b, curTier).length > 0);
  return {
    title: 'Biome Route',
    note: `Player at current +3 gear, spec-agnostic best loadout, vs each biome's tier-${curTier} pool.`,
    headers: ['Biome', 'Attacker', 'Best loadout', 'eHP', 'In DPS', 'Recov/s', 'Net/s', 'TTL', 'Spike %HP', 'Status'],
    rows: biomes.map((biome) => {
      const attacker = averageAttacker(reportMonstersForBiome(biome, curTier), biome.name, biome.name)!;
      const rows = buildRowsWithCombos(reportTier, reportTier, 3, attacker, combos);
      const best = rows.reduce((a, b) => (b.survivalScore > a.survivalScore ? b : a));
      const status = routeStatus(best, false);
      return [biome.name, attackerSummary(attacker), `${best.buildKey} · ${best.armorName}/${best.recoveryName}`,
        asNumber(best.ehp), asNumber(best.incomingDps), asNumber(best.recoveryDps), asNumber(best.netHpPerSec),
        ttl(best.ttlSec), `${asNumber(best.biggestHitPct * 100)}%`, status];
    }),
  };
}

interface ComparisonProfile { label: string; attacker: Attacker; isBoss: boolean }

function comparisonProfiles(reportTier: number): ComparisonProfile[] {
  const curTier = attackerMonsterSource(reportTier).sourceTier;
  const pool = monstersForBiomeTier(curTier);
  const nextSrc = attackerMonsterSource(reportTier + 1);
  const list: ComparisonProfile[] = [];
  const avg = averageAttacker(pool, 'avg mob', `T${reportTier} avg`);
  if (avg) list.push({ label: 'avg mob', attacker: avg, isBoss: false });
  if (pool.length) list.push({ label: 'DoT-heavy', attacker: attackerFromMonster([...pool].sort((a, b) => monsterDotDps(b).dps - monsterDotDps(a).dps)[0], 'DoT'), isBoss: false });
  if (pool.length) list.push({ label: 'hardest', attacker: attackerFromMonster([...pool].sort((a, b) => b.stats.attack - a.stats.attack)[0], 'hardest'), isBoss: false });
  const boss = worstBossAttacker(curTier);
  if (boss) list.push({ label: 'boss', attacker: boss, isBoss: true });
  const next = averageAttacker(monstersForBiomeTier(nextSrc.sourceTier), 'next-tier', 'next');
  if (next && nextSrc.sourceTier !== curTier) list.push({ label: 'next-tier', attacker: next, isBoss: false });
  return list;
}

/** Mean survivability of one item across class builds (other slot fixed), per profile. */
function itemAgainstProfiles(
  reportTier: number, item: ItemDefinition, slot: 'armor' | 'recovery',
  plus: number, combos: BuildCombo[], profiles: ComparisonProfile[], fixedOther: ItemDefinition | null,
): Array<{ label: string; ehp: number; net: number; rec: number; surv: number; ttl: number }> {
  return profiles.map((prof) => {
    let ehp = 0, net = 0, rec = 0, surv = 0, n = 0; const ttls: number[] = [];
    for (const combo of combos) {
      const armor = slot === 'armor' ? item : fixedOther;
      const recovery = slot === 'recovery' ? item : fixedOther;
      if (!armor) continue;
      const stats = makeStatsTarget(combo, armor, recovery, plus, reportTier - 1);
      recalculatePlayerStats(stats);
      const s = evaluateSurvivability(stats, prof.attacker);
      ehp += Number.isFinite(s.ehp) ? s.ehp : 0; net += s.netHpPerSec; rec += s.recoveryDps;
      surv += Number.isFinite(s.survivalScore) ? s.survivalScore : 1e12; ttls.push(s.ttlSec); n++;
    }
    n = Math.max(1, n);
    return { label: prof.label, ehp: ehp / n, net: net / n, rec: rec / n, surv: surv / n, ttl: summarizeTtl(ttls) };
  });
}

function bestWorstLabel(per: Array<{ label: string; surv: number }>): { best: string; worst: string } {
  const sorted = [...per].sort((a, b) => b.surv - a.surv);
  return { best: sorted[0]?.label ?? '-', worst: sorted[sorted.length - 1]?.label ?? '-' };
}

function itemStatLine(item: ItemDefinition, plus: number): { maxHp: number; plating: number; dr: number; evasion: number; recovery: number; special: string } {
  const clamped = Math.min(plus, getMaxUpgrade(item));
  const stats = mergedNumberMaps(item.statModifiers, upgradeStatBonusTotal(item, clamped));
  const fx = mergedNumberMaps(item.mechanicEffects, upgradeMechanicEffectsTotal(item, clamped));
  return { maxHp: stats.maxHp ?? 0, plating: stats.plating ?? 0, dr: stats.damageReduction ?? 0, evasion: stats.evasion ?? 0, recovery: stats.recovery ?? 0, special: mapSummary(fx, 6) };
}

function armorComparisonView(reportTier: number): DataView {
  const combos = comparisonCombos(reportTier);
  const profiles = comparisonProfiles(reportTier);
  const armors = itemsForSlotTier('armor', reportTier);
  const rows: Array<Array<string | number>> = [];
  for (const armor of armors) for (const plus of [0, ITEM_UPGRADE_LEVEL]) {
    const per = itemAgainstProfiles(reportTier, armor, 'armor', plus, combos, profiles, null);
    const avg = per.find((p) => p.label === 'avg mob') ?? per[0];
    const { best, worst } = bestWorstLabel(per);
    const stat = itemStatLine(armor, plus);
    rows.push([armor.name, `+${Math.min(plus, getMaxUpgrade(armor))}`, asNumber(stat.maxHp), asNumber(stat.plating),
      `${asNumber(stat.dr * 100)}%`, asNumber(stat.evasion), stat.special,
      asNumber(avg.ehp), ttl(avg.ttl), asNumber(avg.net), best, worst]);
  }
  return {
    title: 'Armor Comparison',
    note: 'No charm equipped; eHP/TTL/net are vs the avg-mob profile, averaged over spec-agnostic class builds. Best/worst = profile handled best/worst.',
    headers: ['Armor', 'Plus', 'maxHP', 'Plating', 'DR', 'Evasion', 'Special', 'eHP', 'TTL', 'Net/s', 'Best matchup', 'Worst matchup'],
    rows,
  };
}

function charmComparisonView(reportTier: number): DataView {
  const combos = comparisonCombos(reportTier);
  const profiles = comparisonProfiles(reportTier);
  const charms = itemsForSlotTier('recovery', reportTier);
  const refArmor = [...itemsForSlotTier('armor', reportTier)].sort((a, b) => (b.statModifiers.maxHp ?? 0) - (a.statModifiers.maxHp ?? 0))[0];
  if (!refArmor || charms.length === 0) return { title: 'Charm Comparison', headers: ['Charm'], rows: [], note: 'No charms or armor at this tier.' };
  // Baseline eHP (same ref armor, no charm) to express each charm's eHP contribution.
  const baseEhp = itemAgainstProfiles(reportTier, refArmor, 'armor', ITEM_UPGRADE_LEVEL, combos, profiles, null)
    .find((p) => p.label === 'avg mob')?.ehp ?? 0;
  const rows: Array<Array<string | number>> = [];
  for (const charm of charms) for (const plus of [0, ITEM_UPGRADE_LEVEL]) {
    const per = itemAgainstProfiles(reportTier, charm, 'recovery', plus, combos, profiles, refArmor);
    const avg = per.find((p) => p.label === 'avg mob') ?? per[0];
    const { best, worst } = bestWorstLabel(per);
    const stat = itemStatLine(charm, plus);
    // On-kill Recovery is not modeled (no kill cadence), so flag charms that
    // carry it rather than letting them read as dead weight.
    const undercounted = (stat.special.includes('recovery-on-kill') ? ' (on-kill Recovery undercounted)' : '');
    rows.push([charm.name, `+${Math.min(plus, getMaxUpgrade(charm))}`, asNumber(stat.recovery), stat.special + undercounted,
      asNumber(avg.rec), asNumber(avg.ehp - baseEhp), ttl(avg.ttl), best, worst]);
  }
  return {
    title: 'Charm Comparison',
    note: `Reference armor ${refArmor.name} +3; metrics vs avg-mob profile averaged over class builds. eHP contribution = eHP with charm − without. Kill-burst needs a kill cadence to value fully.`,
    headers: ['Charm', 'Plus', 'recovery', 'Special', 'Recov/s', 'eHP contrib', 'TTL', 'Best matchup', 'Worst matchup'],
    rows,
  };
}

function outlierView(reportTier: number, checkpoints: CheckpointData[]): DataView {
  const combos = comparisonCombos(reportTier);
  const profiles = comparisonProfiles(reportTier);
  const avgProfile = profiles.filter((p) => p.label === 'avg mob');
  const rows: Array<Array<string | number>> = [];

  // Item survival vs the avg-mob profile, at +3.
  const armors = itemsForSlotTier('armor', reportTier);
  const charms = itemsForSlotTier('recovery', reportTier);
  const refArmor = [...armors].sort((a, b) => (b.statModifiers.maxHp ?? 0) - (a.statModifiers.maxHp ?? 0))[0] ?? null;
  const armorSurv = armors.map((a) => ({ name: a.name, surv: itemAgainstProfiles(reportTier, a, 'armor', ITEM_UPGRADE_LEVEL, combos, avgProfile, null)[0]?.surv ?? 0,
    all: itemAgainstProfiles(reportTier, a, 'armor', ITEM_UPGRADE_LEVEL, combos, profiles, null) }));
  const charmSurv = charms.map((c) => ({ name: c.name, surv: itemAgainstProfiles(reportTier, c, 'recovery', ITEM_UPGRADE_LEVEL, combos, profiles, refArmor)[0]?.surv ?? 0,
    all: itemAgainstProfiles(reportTier, c, 'recovery', ITEM_UPGRADE_LEVEL, combos, profiles, refArmor) }));

  const flagItems = (items: typeof armorSurv, kind: string) => {
    const mean = items.reduce((s, i) => s + i.surv, 0) / Math.max(1, items.length);
    for (const it of items) {
      if (it.surv > mean * (1 + ITEM_OUTLIER_PCT)) rows.push([`${kind} > +25% tier avg`, it.name, `survival ${asNumber(it.surv)} vs avg ${asNumber(mean)}`]);
      if (it.surv < mean * (1 - ITEM_OUTLIER_PCT)) rows.push([`${kind} < -25% tier avg`, it.name, `survival ${asNumber(it.surv)} vs avg ${asNumber(mean)}`]);
      // Best in every matchup → dominant item.
      const isBestEverywhere = it.all.every((p) => p.surv >= Math.max(...items.map((o) => o.all.find((q) => q.label === p.label)?.surv ?? 0)) - 1e-6);
      if (isBestEverywhere && items.length > 1) rows.push([`dominant ${kind}`, it.name, 'best survival in every matchup profile']);
    }
  };
  flagItems(armorSurv, 'armor');
  flagItems(charmSurv, 'charm');

  // Loadouts that sustain average mobs too early (at +0 entry).
  const entry = checkpoints.find((c) => c.cp.label.includes('+0'));
  if (entry) {
    const early = entry.best.filter((r) => !Number.isFinite(r.ttlSec)).length;
    if (early > 0) rows.push(['sustains too early', `${early} build(s)`, `already immortal vs avg mobs on entry (+0) gear`]);
  }
  // Boss TTL below the risk threshold.
  const bossCp = checkpoints.find((c) => c.cp.isBoss);
  if (bossCp) {
    const fragile = bossCp.best.filter((r) => r.ttlSec < BOSS_TTL_RISK_SEC).sort((a, b) => a.ttlSec - b.ttlSec).slice(0, 8);
    for (const r of fragile) rows.push(['boss TTL < threshold', `${r.buildKey} · ${r.armorName}/${r.recoveryName}`, `${ttl(r.ttlSec)}${r.oneShotRisk ? ' (one-shot)' : ''}`]);
  }

  return {
    title: 'Outlier Summary',
    note: `Flags items >±${Math.round(ITEM_OUTLIER_PCT * 100)}% of tier-average survival, dominant items, early-sustain loadouts, and sub-${BOSS_TTL_RISK_SEC}s boss TTLs.`,
    headers: ['Flag', 'Item / Build', 'Detail'],
    rows,
  };
}

// ─── Boss-focused & per-profile matrix views ────────────────────────────────

interface BossMatchup { boss: Attacker; bestByClass: Map<string, ReportRow>; bestOverall: ReportRow }

function computeBossMatchups(reportTier: number): BossMatchup[] {
  const curTier = attackerMonsterSource(reportTier).sourceTier;
  const combos = comparisonCombos(reportTier);
  return bossAttackersForTier(curTier).map((boss) => {
    const rows = buildRowsWithCombos(reportTier, reportTier, 3, boss, combos);
    const bestByClass = new Map<string, ReportRow>();
    for (const r of rows) {
      const cur = bestByClass.get(r.className);
      if (!cur || r.survivalScore > cur.survivalScore) bestByClass.set(r.className, r);
    }
    const bestOverall = rows.reduce((a, b) => (b.survivalScore > a.survivalScore ? b : a));
    return { boss, bestByClass, bestOverall };
  });
}

function bossMatchupsByClassView(matchups: BossMatchup[]): DataView {
  if (matchups.length === 0) return { title: 'Boss Matchups By Class', headers: ['Class'], rows: [], note: 'No bosses found for this tier.' };
  const classes = [...new Set(matchups.flatMap((m) => [...m.bestByClass.keys()]))].sort();
  return {
    title: 'Boss Matchups By Class',
    note: 'Best current +3 loadout for each class vs each boss; cell = TTL (⚠ = one-shot risk).',
    headers: ['Class', ...matchups.map((m) => m.boss.source)],
    rows: classes.map((cls) => [cls, ...matchups.map((m) => {
      const r = m.bestByClass.get(cls);
      return r ? `${ttl(r.ttlSec)}${r.oneShotRisk ? ' ⚠' : ''}` : '-';
    })]),
  };
}

function bestGearPerBossView(matchups: BossMatchup[]): DataView {
  return {
    title: 'Best Gear Per Boss',
    note: 'Single highest-survival loadout (any class) at current +3 vs each boss.',
    headers: ['Boss', 'Attacker', 'Best build', 'Armor', 'Charm', 'eHP', 'TTL', 'Net/s', 'Spike %HP', 'Status'],
    rows: matchups.map(({ boss, bestOverall: r }) => [
      boss.source, attackerSummary(boss), r.buildKey, r.armorName, r.recoveryName,
      asNumber(r.ehp), ttl(r.ttlSec), asNumber(r.netHpPerSec), `${asNumber(r.biggestHitPct * 100)}%`, routeStatus(r, true),
    ]),
  };
}

function armorMatrixView(reportTier: number): DataView {
  const combos = comparisonCombos(reportTier);
  const profiles = comparisonProfiles(reportTier);
  const armors = itemsForSlotTier('armor', reportTier);
  return {
    title: 'Armor Matrix By Attacker Profile',
    note: 'Survival score (mitigation × pool incl. recovery) at +3, no charm, averaged over class builds.',
    headers: ['Armor', ...profiles.map((p) => p.label)],
    rows: armors.map((a) => {
      const per = itemAgainstProfiles(reportTier, a, 'armor', ITEM_UPGRADE_LEVEL, combos, profiles, null);
      return [a.name, ...per.map((p) => asNumber(p.surv))];
    }),
  };
}

function charmMatrixView(reportTier: number): DataView {
  const combos = comparisonCombos(reportTier);
  const profiles = comparisonProfiles(reportTier);
  const charms = itemsForSlotTier('recovery', reportTier);
  const refArmor = [...itemsForSlotTier('armor', reportTier)].sort((a, b) => (b.statModifiers.maxHp ?? 0) - (a.statModifiers.maxHp ?? 0))[0];
  if (!refArmor || charms.length === 0) return { title: 'Charm Matrix By Attacker Profile', headers: ['Charm'], rows: [], note: 'No charms or armor at this tier.' };
  return {
    title: 'Charm Matrix By Attacker Profile',
    note: `Survival score at +3 with reference armor ${refArmor.name}, averaged over class builds.`,
    headers: ['Charm', ...profiles.map((p) => p.label)],
    rows: charms.map((c) => {
      const per = itemAgainstProfiles(reportTier, c, 'recovery', ITEM_UPGRADE_LEVEL, combos, profiles, refArmor);
      return [c.name, ...per.map((p) => asNumber(p.surv))];
    }),
  };
}

function renderHtmlView(view: DataView): string {
  const note = view.note ? `<p class="meta">${html(view.note)}</p>` : '';
  return `<h3>${html(view.title)}</h3>${note}${view.rows.length ? htmlTable(view.headers, view.rows) : '<p>No data.</p>'}`;
}

function renderTierSectionV2(reportTier: number): string {
  const classTier = reportTier - 1;
  const checkpoints = computeCheckpoints(reportTier);
  const matchups = computeBossMatchups(reportTier);
  const fullRows = buildRowsForTier(reportTier, { tier4MidOnly: true });
  return `
    <section>
      <h2>T${reportTier}</h2>
      <p class="meta">Class unlock tier ${classTier}. Checkpoints model entry/geared/boss/next-tier moments; comparison and route views are spec-agnostic to stay readable. Full per-spec samples are in the collapsed dump.</p>
      ${renderHtmlView(progressionView(checkpoints))}
      ${renderHtmlView(biomeRouteView(reportTier))}
      ${renderHtmlView(bossMatchupsByClassView(matchups))}
      ${renderHtmlView(bestGearPerBossView(matchups))}
      ${renderHtmlView(armorComparisonView(reportTier))}
      ${renderHtmlView(armorMatrixView(reportTier))}
      ${renderHtmlView(charmComparisonView(reportTier))}
      ${renderHtmlView(charmMatrixView(reportTier))}
      ${renderHtmlView(outlierView(reportTier, checkpoints))}
      <details><summary>Full samples (current +3 vs current mobs, all specs)</summary>${renderAllSamplesTable(fullRows, reportTier)}</details>
    </section>
  `;
}

function renderTierSection(reportTier: number, rows: ReportRow[]): string {
  const classTier = reportTier - 1;
  const attacker = averageAttackerForTier(reportTier);
  const optimalRows = optimalRowsByBuild(rows);
  const bestBuilds = averageBy(rows, (row) => row.buildKey).sort((a, b) => b.avg - a.avg).slice(0, 10);
  const worstBuilds = averageBy(rows, (row) => row.buildKey).sort((a, b) => a.avg - b.avg).slice(0, 10);

  const rowToBuild = (item: { key: string; avg: number; count: number }) => ({
    Build: item.key,
    'Avg survival': asNumber(item.avg),
    Samples: item.count,
  });

  return `
    <section>
      <h2>T${reportTier}</h2>
      <p class="meta">
        ${rows.length} samples. Armor + charm tier ${reportTier}; class unlock tier ${classTier}.
        Neutral attacker from ${attacker.monsterCount} non-boss monsters in biome tier ${attacker.sourceTier}${attacker.usedFallback ? ' fallback' : ''}:
        attack ${asNumber(attacker.attack)}, ${asNumber(1000 / attacker.attackCooldown)} APS, DoT ${asNumber(attacker.dotDps)}/s, avg spike ×${asNumber(attacker.spikeMult)}.
      </p>
      <div class="grid">
        <div><h3>Tankiest Build/Loadout Combinations</h3>${renderSummaryTable(bestBuilds.map(rowToBuild))}</div>
        <div><h3>Most Fragile Build/Loadout Combinations</h3>${renderSummaryTable(worstBuilds.map(rowToBuild))}</div>
        <div><h3>Average eHP Per Class</h3>${renderClassAverageTable(rows)}</div>
        <div><h3>Armor Performance</h3>${renderItemPerformanceTable(rows, 'armorName', 'Armor')}</div>
        <div><h3>Charm Performance</h3>${renderItemPerformanceTable(rows, 'recoveryName', 'Charm')}</div>
      </div>
      <h3>Optimal Defensive Loadout By Class Combination</h3>
      ${renderOptimalLoadoutTable(rows, reportTier)}
      ${renderShapeSurvivalTable(reportTier, optimalRows)}
      <details><summary>All samples</summary>${renderAllSamplesTable(rows, reportTier)}</details>
    </section>
  `;
}

function renderReport(sections: string[]): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MMO Idle eHP / Survivability Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #1f2933; background: #f7f8fa; }
    h1, h2, h3 { margin: 0 0 8px; }
    h1 { font-size: 28px; }
    h2 { margin-top: 28px; padding-top: 18px; border-top: 2px solid #c8d0d9; }
    h3 { font-size: 15px; }
    p { max-width: 1100px; line-height: 1.45; }
    .meta { color: #5c6670; font-size: 11px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 18px; align-items: start; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0 18px; background: white; }
    th, td { border: 1px solid #d8dee6; padding: 6px 8px; text-align: left; vertical-align: top; font-size: 12px; }
    th { background: #e8edf2; position: sticky; top: 0; z-index: 1; }
    details { margin-top: 10px; }
    summary { cursor: pointer; font-weight: 700; margin-bottom: 8px; }
    .class-badge { display: inline-block; border-left: 5px solid var(--class-color); padding: 2px 7px;
      background: color-mix(in srgb, var(--class-color) 12%, white); font-weight: 700; white-space: nowrap; }
    .class-group td { background: #f3f6f9; font-size: 13px; padding: 9px 8px; }
    .outlier { font-weight: 800; }
    .outlier.positive { color: #15803d; }
    .outlier.negative { color: #b91c1c; }
  </style>
</head>
<body>
  <h1>MMO Idle Survivability (eHP) Report</h1>
  <p>
    External balance/debug report built from shared item, skill, monster, and stat formulas, plus a
    steady-state re-implementation of the server defense pipeline (mitigation, shields, regen, absorb,
    damage-cap, cheat-death). This is not an in-game panel and not a combat simulator. It omits movement,
    kiting, real AoE target count, enemy AI, party effects, and overkill timing.
  </p>
  <p class="meta">
    Unlock model: T1 class root, T2 frame, T3 close/far range, T4 path/spec. Each class build is crossed
    with every armor × charm (recovery) combination at +${ITEM_UPGRADE_LEVEL}. Weapon held empty; mobility slot excluded
    (movement only). Incoming pressure uses biome spawn pools one tier below the report tier, plus
    representative shape attackers and boss spikes. eHP = maxHP × (raw attacker DPS ÷ post-mitigation DPS),
    so it folds plating, DR, evasion, damage-cap and DoT-resistance into one comparable number. TTL and
    "sustains" use averaged recovery throughput.
    ${OPTIONS.excludeConduit ? 'Conduit and its subclasses are excluded.' : 'Run with --exclude-conduit to omit Conduit and its subclasses.'}
  </p>
  ${sections.join('\n')}
</body>
</html>`;
}

// ─── Markdown / LLM packet ─────────────────────────────────────────────────────

function md(value: unknown): string {
  return String(value).replace(/\s+/g, ' ').replaceAll('|', '\\|').trim();
}

function mdTable(headers: string[], rows: Array<Array<string | number>>): string {
  if (rows.length === 0) return '_No data._\n';
  return [
    `| ${headers.map(md).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(md).join(' | ')} |`),
  ].join('\n') + '\n';
}

function mapSummary(values: Record<string, number> | undefined, limit = 10): string {
  const entries = Object.entries(values ?? {})
    .filter(([, value]) => Number.isFinite(value) && value !== 0)
    .sort(([a], [b]) => a.localeCompare(b));
  const shown = entries.slice(0, limit).map(([key, value]) => `${key}=${asNumber(value)}`);
  if (entries.length > limit) shown.push(`+${entries.length - limit} more`);
  return shown.join(', ') || '-';
}

function mergedNumberMaps(...maps: Array<Record<string, number> | undefined>): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const map of maps) {
    for (const [key, value] of Object.entries(map ?? {})) {
      if (Number.isFinite(value) && value !== 0) merged[key] = (merged[key] ?? 0) + value;
    }
  }
  return merged;
}

function defensivePassiveSummary(passives: PassiveMap): string {
  const filtered = Object.fromEntries(
    Object.entries(passives).filter(([key, value]) =>
      Number.isFinite(value) && value !== 0 && key.startsWith('defense.')),
  );
  return mapSummary(filtered, 16);
}

function rowMarkdownSummary(row: ReportRow): Array<string | number> {
  return [
    row.buildKey,
    `${row.armorName} +${row.plus}`,
    row.recoveryName,
    asNumber(row.survivalScore),
    asNumber(row.ehp),
    asNumber(row.maxHp),
    `${asNumber(row.mitigationPct * 100)}%`,
    asNumber(row.incomingDps),
    asNumber(row.recoveryDps),
    ttl(row.ttlSec),
    `${asNumber(row.biggestHitPct * 100)}%${row.oneShotRisk ? ' ⚠' : ''}`,
  ];
}

function itemInputRows(slot: 'armor' | 'recovery', reportTier: number): Array<Array<string | number>> {
  return itemsForSlotTier(slot, reportTier).flatMap((item) =>
    [0, ITEM_UPGRADE_LEVEL].map((plus) => {
      const clamped = Math.min(plus, getMaxUpgrade(item));
      const stats = mergedNumberMaps(item.statModifiers, upgradeStatBonusTotal(item, clamped));
      const effects = mergedNumberMaps(item.mechanicEffects, upgradeMechanicEffectsTotal(item, clamped));
      return [
        item.name,
        `+${clamped}`,
        mapSummary(stats, 8),
        mapSummary(effects, 10),
        item.upgrades ? `steps ${clamped}/${getMaxUpgrade(item)}` : `generic upgrade ${clamped}/${getMaxUpgrade(item)}`,
      ];
    }));
}

function renderLlmPacket(reportTier: number, rows: ReportRow[]): string {
  const attacker = averageAttackerForTier(reportTier);
  const optimalRows = optimalRowsByBuild(rows).sort((a, b) => b.survivalScore - a.survivalScore);
  const optimalAverage = optimalRows.reduce((s, r) => s + r.survivalScore, 0) / Math.max(1, optimalRows.length);
  const flagged = optimalRows.map((row) => ({ row, flag: outlierFlag(row.survivalScore, optimalAverage) }));
  const outliers = flagged.filter((f) => f.flag);
  const classAverages = averageBy(rows, (row) => row.className).sort((a, b) => b.avg - a.avg);
  const armorAverages = averageBy(rows, (row) => row.armorName).sort((a, b) => b.avg - a.avg);
  const charmAverages = averageBy(rows, (row) => row.recoveryName).sort((a, b) => b.avg - a.avg);
  const oneShots = optimalRows.filter((r) => r.oneShotRisk);
  const sustained = optimalRows.filter((r) => !Number.isFinite(r.ttlSec));
  const reps = representativeAttackers(reportTier);
  const caveatNotes = [...new Set(rows.flatMap((r) => r.notes))].sort();

  const classInputRows = optimalRows.slice()
    .sort((a, b) => a.buildKey.localeCompare(b.buildKey))
    .map((row) => {
      const armor = ITEM_DATABASE.get(row.armorId)!;
      const recovery = row.recoveryId ? ITEM_DATABASE.get(row.recoveryId) ?? null : null;
      const stats = makeStatsTarget(row.combo, armor, recovery, row.plus, row.tier - 1);
      recalculatePlayerStats(stats);
      return [
        row.buildKey,
        `${row.armorName} / ${row.recoveryName}`,
        asNumber(stats.hasHealth.maxHp),
        asNumber(stats.mitigatesDamage.plating),
        `${asNumber(stats.mitigatesDamage.damageReduction * 100)}%`,
        `${asNumber(stats.evadesHits.dodgeRate * 100)}%`,
        asNumber(stats.hasHealth.recovery ?? 0),
        defensivePassiveSummary(stats.usesSkills.passives),
        asNumber(row.ehp),
        ttl(row.ttlSec),
      ];
    });

  return `# MMO Idle LLM Survivability Packet - T${reportTier}${OPTIONS.excludeConduit ? ' (No Conduit)' : ''}

Generated from \`tools/ehp-report.ts\`. Markdown only; the full HTML report is omitted. Companion to the DPS LLM packet.

## 1. Assumptions / Omissions

- Report tier T${reportTier}; class unlock tier ${reportTier - 1}; armor + charm are tier ${reportTier} at +${ITEM_UPGRADE_LEVEL}.
- Every class build (root/frame/range/spec) is crossed with every armor × charm (recovery) combination. Weapon is empty; mobility slot excluded (movement only, no eHP value).
- Incoming pressure comes from biome spawn pools one tier below report tier (tutorial/test/interact/boss excluded), plus representative shape attackers and boss spikes.
- **eHP** = maxHP × (raw attacker DPS ÷ post-mitigation DPS): folds plating, DR, evasion, damage-cap, and DoT-resistance into one number. **TTL** = effective pool ÷ (incoming − recovery); "sustains" when recovery ≥ incoming. **Net HP/s** = recovery − incoming.
- Defense mechanics are deterministic steady-state re-implementations of \`server/src/systems/defense/*\`: Recovery access is summed as a fraction of the Recovery rate and averaged over each source's duty cycle; absorb is averaged as HP/s throughput; the barrier is a one-time buffer added to the pool (it never recharges inside a modeled fight); ramps use their mid-point; cheat-death adds one extra near-full bar; on-kill Recovery and barrier-break heals are omitted (need a kill/break cadence).
- Single-target, in-combat steady state only. No movement, kiting, real AoE target count, enemy AI, party effects, antiheal stacking, or overkill timing.

## 2. Attacker Baseline

| Metric | Value |
| --- | --- |
| Source | biome tier ${attacker.sourceTier}${attacker.usedFallback ? ' fallback' : ''} |
| Mob count | ${attacker.monsterCount} |
| Average attack | ${asNumber(attacker.attack)} |
| Average APS | ${asNumber(1000 / attacker.attackCooldown)} |
| Average DoT/s | ${asNumber(attacker.dotDps)} |
| Average spike mult | ×${asNumber(attacker.spikeMult)} |
| Reference optimal-loadout average eHP | ${asNumber(optimalAverage)} |

${mdTable(
  ['Shape', 'Monster', 'Attack', 'APS', 'DoT/s', 'Spike'],
  reps.map((a) => [a.label, a.source, asNumber(a.attack), asNumber(1000 / a.attackCooldown), asNumber(a.dotDps), `×${asNumber(a.spikeMult)}`]),
)}

## 3. Class / Loadout Input Table (optimal charm+armor per build)

${mdTable(
  ['Build', 'Loadout', 'maxHP', 'Plating', 'DR', 'Dodge', 'recovery', 'Defensive passives', 'eHP', 'TTL'],
  classInputRows,
)}

## 4. Armor Input Table (+0 and +${ITEM_UPGRADE_LEVEL})

${mdTable(['Armor', 'Plus', 'Stats', 'Effects', 'Scaling'], itemInputRows('armor', reportTier))}

## 5. Charm Input Table (+0 and +${ITEM_UPGRADE_LEVEL})

${mdTable(['Charm', 'Plus', 'Stats', 'Effects', 'Scaling'], itemInputRows('recovery', reportTier))}

## 6. Tankiest / Most Fragile Optimal Loadouts

Top 10 (tankiest):

${mdTable(['Build', 'Armor', 'Charm', 'Survival', 'eHP', 'maxHP', 'Mitig%', 'In DPS', 'Recov/s', 'TTL', 'Spike %HP'], optimalRows.slice(0, 10).map(rowMarkdownSummary))}

Bottom 10 (most fragile):

${mdTable(['Build', 'Armor', 'Charm', 'Survival', 'eHP', 'maxHP', 'Mitig%', 'In DPS', 'Recov/s', 'TTL', 'Spike %HP'], optimalRows.slice().sort((a, b) => a.survivalScore - b.survivalScore).slice(0, 10).map(rowMarkdownSummary))}

## 7. Outliers (vs optimal-loadout average eHP)

${mdTable(
  ['Flag', 'Build', 'Armor', 'Charm', 'Survival', 'eHP', 'TTL', 'Spike %HP'],
  outliers.map(({ row, flag }) => [flag, row.buildKey, row.armorName, row.recoveryName, asNumber(row.survivalScore), asNumber(row.ehp), ttl(row.ttlSec), `${asNumber(row.biggestHitPct * 100)}%${row.oneShotRisk ? ' ⚠' : ''}`]),
)}

## 8. Burst & Sustain Risk

- One-shot risk (a single modeled spike ≥ HP + standing shield, no cheat-death): ${oneShots.length} of ${optimalRows.length} optimal builds.
- Builds that fully sustain the neutral attacker (recovery ≥ incoming): ${sustained.length} of ${optimalRows.length}.

${mdTable(
  ['Build', 'Armor', 'Charm', 'Spike %HP', 'TTL'],
  oneShots.slice(0, 20).map((row) => [row.buildKey, row.armorName, row.recoveryName, `${asNumber(row.biggestHitPct * 100)}%`, ttl(row.ttlSec)]),
)}

## 9. Average eHP Per Class

${mdTable(['Class', 'Avg survival', 'Samples'], classAverages.map((i) => [i.key, asNumber(i.avg), i.count]))}

## 10. Average eHP Per Armor / Charm

${mdTable(['Armor', 'Avg survival', 'Samples'], armorAverages.map((i) => [i.key, asNumber(i.avg), i.count]))}

${mdTable(['Charm', 'Avg survival', 'Samples'], charmAverages.map((i) => [i.key, asNumber(i.avg), i.count]))}

## 11. Formula Caveats / Unmodeled Mechanics

- Mitigation uses shared \`estimateMonsterHitDamage\`: \`max(1, round(max(0, attack - plating × 1) × (1 - DR)))\`; stats rebuilt via shared \`recalculatePlayerStats\`.
- Evasion is averaged (\`1 - dodgeRate × evadeMitigation\`), not played out as a deterministic accumulator; first-hit timing and OOC reset are ignored.
- Absorb and Recovery access are steady-state HP/s. The barrier is a flat one-time buffer: correct for a single engagement, but it ignores the between-pack recharge that is the whole point of the mechanic, so multi-pack farm throughput is understated. DoT bypass-barrier is respected only in notes.
- Cheat-death, hardening/stationary/sustained-fight DR ramps use mid-point or one-shot approximations; reactive plating, barrier-break heals and on-kill Recovery are not summed.
- Report notes observed in this tier: ${caveatNotes.length ? caveatNotes.map((n) => `\`${md(n)}\``).join(', ') : 'none'}.
`;
}

function renderMdView(view: DataView): string {
  return `## ${view.title}\n\n${view.note ? `_${md(view.note)}_\n\n` : ''}${mdTable(view.headers, view.rows)}`;
}

function renderLlmPacketV2(reportTier: number): string {
  const checkpoints = computeCheckpoints(reportTier);
  const matchups = computeBossMatchups(reportTier);
  const geared = checkpoints.find((c) => c.cp.label.includes('geared')) ?? checkpoints[checkpoints.length - 1];
  const ranked = (geared?.best ?? []).slice().sort((a, b) => b.survivalScore - a.survivalScore);
  const summary = (row: ReportRow): Array<string | number> => [
    row.buildKey, `${row.armorName}/${row.recoveryName}`, asNumber(row.survivalScore), asNumber(row.ehp),
    asNumber(row.incomingDps), asNumber(row.recoveryDps), ttl(row.ttlSec), `${asNumber(row.biggestHitPct * 100)}%${row.oneShotRisk ? ' ⚠' : ''}`,
  ];
  const topBottomHeaders = ['Build', 'Loadout', 'Survival', 'eHP', 'In DPS', 'Recov/s', 'TTL', 'Spike %HP'];

  return `# MMO Idle LLM Survivability Packet - T${reportTier}${OPTIONS.excludeConduit ? ' (No Conduit)' : ''}

Generated from \`tools/ehp-report.ts --llm-packet\`. Progression-focused companion to the DPS packet.

## Assumptions / Omissions

- Class unlock tier ${reportTier - 1}. Views model progression moments, not just same-tier +3 gear.
- Checkpoints: prev-tier +3 entering, current +0 entry, current +3 geared, current +3 vs boss, current +3 vs next-tier mobs. "Current mobs" = biome spawn pools one tier below report tier (the established convention); bosses come from boss pools.
- Comparison/route/checkpoint views are **spec-agnostic** (root+frame+range only) to keep the cross-product readable; the HTML report's collapsed dump keeps full per-spec rows.
- eHP = maxHP × (raw ÷ post-mitigation DPS). Survival = (maxHP + recovery×${RECOVERY_WINDOW_SEC}s) × mitigation, so charms rank. TTL/"sustains" use averaged recovery.
- Status: Safe / Risky / Blocked from TTL + one-shot risk (mob risk<${MOB_TTL_RISK_SEC}s/block<${MOB_TTL_BLOCK_SEC}s; boss risk<${BOSS_TTL_RISK_SEC}s/block<${BOSS_TTL_BLOCK_SEC}s).

## Undercounted / Unmodeled Mechanics

- **Range & movement**: kiting, attack range, and repositioning are ignored — melee-range pressure is assumed.
- **Kill-burst** recovery is undercounted (no kill cadence modeled); flagged in the charm table.
- **Evasion** is averaged (dodgeRate × evade-mitigation), not the deterministic first-hit accumulator.
- **Barrier** is a flat one-time buffer — no between-engagement recharge, no burst-vs-chip interaction, no DoT bypass beyond notes.
- **Multi-enemy pressure** is not modeled; a single attacker profile is assumed (idle pulls are often several mobs).

${renderMdView(progressionView(checkpoints))}
${renderMdView(classAvgByCheckpointView(checkpoints))}
${renderMdView(armorComparisonView(reportTier))}
${renderMdView(charmComparisonView(reportTier))}
${renderMdView(biomeRouteView(reportTier))}
${renderMdView(bossMatchupsByClassView(matchups))}
${renderMdView(bestGearPerBossView(matchups))}
${renderMdView(armorMatrixView(reportTier))}
${renderMdView(charmMatrixView(reportTier))}

## Top / Bottom Loadouts (current +3 vs current mobs)

${mdTable(topBottomHeaders, ranked.slice(0, 10).map(summary))}

${mdTable(topBottomHeaders, ranked.slice().reverse().slice(0, 10).map(summary))}

${renderMdView(outlierView(reportTier, checkpoints))}
`;
}

async function writeLlmPacket(): Promise<void> {
  const tiers = availableReportTiers();
  const selectedTiers = OPTIONS.tier ? [OPTIONS.tier] : tiers;
  for (const tier of selectedTiers) {
    if (!tiers.includes(tier)) {
      throw new Error(`Use --llm-packet with --tier=<${tiers.join('|')}>`);
    }
    const suffix = OPTIONS.excludeConduit ? '-no-conduit' : '';
    const outPath = path.join(REPO_ROOT, 'reports', `ehp-llm-packet-t${tier}${suffix}.md`);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, renderLlmPacketV2(tier), 'utf8');
    console.log(`Wrote ${outPath}`);
  }
}

async function main(): Promise<void> {
  if (OPTIONS.llmPacket) {
    await writeLlmPacket();
    return;
  }

  const tiers = availableReportTiers();
  const sections = tiers.map((tier) => renderTierSectionV2(tier));
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, renderReport(sections), 'utf8');
  console.log(`Wrote ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
