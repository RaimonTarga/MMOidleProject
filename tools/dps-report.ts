import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  computeDotClassDamagePerStack,
  computeEternalDoomDamage,
  computeScaledDotDamage,
  BIOME_DATABASE,
  emptyEquipment,
  estimatePlayerHitDamage,
  GAME_CONFIG,
  getMaxUpgrade,
  ITEM_DATABASE,
  MAX_UPGRADE,
  MONSTER_DATABASE,
  recalculatePlayerStats,
  resolveUpkeepConfig,
  resolveDotClassProfile,
  resolveEmpoweredMultiplier,
  resolveEnergyMax,
  SKILL_TREE,
  upgradeMechanicEffectsTotal,
  upgradeStatBonusTotal,
  upkeepOnHitBonus,
  weaponDotProfileForWeapon,
  type CombatArchetype,
  type ItemDefinition,
  type MonsterDefinition,
  type PassiveMap,
  type PlayerStatsTarget,
  type SkillNode,
  type SubVariant,
} from '@mmo-idle/shared';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = process.argv.slice(2);
const OPTIONS = {
  excludeConduit: ARGS.includes('--exclude-conduit'),
  llmPacket: ARGS.includes('--llm-packet'),
  classMechanics: ARGS.includes('--class-mechanics'),
  t4SubclassMechanics: ARGS.includes('--t4-subclass-mechanics'),
  tier: numberArg('--tier'),
};
const REPORT_PATH = path.join(
  REPO_ROOT,
  'reports',
  OPTIONS.excludeConduit ? 'dps-report-no-conduit.html' : 'dps-report.html',
);
type RangeKind = 'close' | 'mid' | 'far';
const RANGE_CHOICES = ['close', 'far'] as const satisfies readonly RangeKind[];
// Fully-upgraded weapon. Tracks the shared cap so the report never drifts behind
// it again — this was a literal `3` after MAX_UPGRADE moved 3 → 5, which
// silently under-reported every weapon by two upgrade levels.
const WEAPON_UPGRADE_LEVEL = MAX_UPGRADE;
const REPORT_HORIZON_SEC = 60;
const TUTORIAL_WEAPON_IDS = new Set(['primordial-club']);
const TUTORIAL_MONSTER_IDS = new Set(['tiny-slime']);
const CONDUIT_CLASS_ID = 'summoner-root';
const CADENCE_DAMAGE_MULT_DEFAULT = 2;
const NON_SUMMONER_CLASS_IDS = ['cadence-root', 'cooldown-root', 'dot-root', 'energy-root', 'reload-root'] as const;
const WIND_SPIRIT_FROSTBITE_PER_STACK_DEFAULT = 0.03;
const WIND_SPIRIT_FROSTBITE_MAX_STACKS_DEFAULT = 10;
const WIND_SPIRIT_FROSTBITE_MS_DEFAULT = 4000;

function numberArg(name: string): number | null {
  const equals = ARGS.find((arg) => arg.startsWith(`${name}=`));
  const index = ARGS.indexOf(name);
  const raw = equals ? equals.slice(name.length + 1) : index >= 0 ? ARGS[index + 1] : undefined;
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

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

interface TargetDummy {
  hp: number;
  plating: number;
  damageReduction: number;
  monsterCount: number;
  sourceTier: number;
  usedFallback: boolean;
}

interface DpsBreakdown {
  direct: number;
  classMechanic: number;
  dot: number;
  weaponProc: number;
  notes: string[];
}

interface ReportRow extends DpsBreakdown {
  tier: number;
  classId: string;
  className: string;
  frameName: string;
  rangeName: string;
  specName: string;
  buildKey: string;
  weaponId: string;
  weaponName: string;
  plus: typeof WEAPON_UPGRADE_LEVEL;
  total: number;
  attack: number;
  onHitDamage: number;
  attackCooldown: number;
  flag: OutlierFlag;
  combo: BuildCombo;
}

type OutlierFlag = '' | 'LOW' | 'HIGH' | 'EXTREME_LOW' | 'EXTREME_HIGH';

const CLASS_COLORS: Record<string, string> = {
  'cadence-root': '#2563eb',
  'cooldown-root': '#7c3aed',
  'dot-root': '#15803d',
  'energy-root': '#c2410c',
  'reload-root': '#be123c',
  'summoner-root': '#0f766e',
};

function archetypeForClassId(classId: string): Exclude<CombatArchetype, null> {
  return classId.replace(/-root$/, '') as Exclude<CombatArchetype, null>;
}

function asNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
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
  if (flag === 'HIGH' || flag === 'EXTREME_HIGH') return 'positive';
  if (flag === 'LOW' || flag === 'EXTREME_LOW') return 'negative';
  return '';
}

function skill(id: string): SkillNode {
  const node = SKILL_TREE.get(id);
  if (!node) throw new Error(`Missing skill node: ${id}`);
  return node;
}

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
        const range = rangeId ? skill(rangeId) : null;
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

function weaponsForTier(reportTier: number): ItemDefinition[] {
  return [...ITEM_DATABASE.values()]
    .filter((item) =>
      item.slot === 'weapon' &&
      item.tier === reportTier &&
      !TUTORIAL_WEAPON_IDS.has(item.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

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

function reportMonsterSource(reportTier: number): { monsters: MonsterDefinition[]; sourceTier: number; usedFallback: boolean } {
  const requestedTier = Math.max(0, reportTier - 1);
  const requested = monstersForBiomeTier(requestedTier);
  if (requested.length > 0) return { monsters: requested, sourceTier: requestedTier, usedFallback: false };

  const fallbackTier = 1;
  return {
    monsters: monstersForBiomeTier(fallbackTier),
    sourceTier: fallbackTier,
    usedFallback: true,
  };
}

function targetDummyForTier(tier: number): TargetDummy {
  const source = reportMonsterSource(tier);
  const pool = source.monsters;
  const sum = pool.reduce(
    (acc, monster) => {
      acc.hp += monster.stats.hp;
      acc.plating += monster.stats.plating;
      acc.damageReduction += monster.stats.damageReduction;
      return acc;
    },
    { hp: 0, plating: 0, damageReduction: 0 },
  );
  const count = Math.max(1, pool.length);
  return {
    hp: sum.hp / count,
    plating: sum.plating / count,
    damageReduction: sum.damageReduction / count,
    monsterCount: pool.length,
    sourceTier: source.sourceTier,
    usedFallback: source.usedFallback,
  };
}

function monstersForReportTier(reportTier: number): MonsterDefinition[] {
  if (reportTier == 1) return reportMonsterSource(reportTier).monsters;
  else return reportMonsterSource(reportTier+1).monsters;
}

function targetForMonster(monster: MonsterDefinition): TargetDummy {
  return {
    hp: monster.stats.hp,
    plating: monster.stats.plating,
    damageReduction: monster.stats.damageReduction,
    monsterCount: 1,
    sourceTier: monster.rewards.level,
    usedFallback: false,
  };
}

function targetShapeChecks(reportTier: number): Array<{ label: string; target: TargetDummy; source: string }> {
  const neutral = targetDummyForTier(reportTier);
  const monsters = monstersForReportTier(reportTier);
  const highPlating = monsters.slice().sort((a, b) =>
    b.stats.plating - a.stats.plating ||
    monsterDurabilityScore(b) - monsterDurabilityScore(a))[0];
  const highHp = monsters.slice().sort((a, b) =>
    b.stats.hp - a.stats.hp ||
    monsterDurabilityScore(b) - monsterDurabilityScore(a))[0];

  const shapes = [
    {
      label: `neutral T${reportTier} dummy`,
      target: neutral,
      source: `${neutral.monsterCount} mob average, biome tier ${neutral.sourceTier}${neutral.usedFallback ? ' fallback' : ''}`,
    },
  ];
  if (highPlating) {
    shapes.push({
      label: `high-plating T${reportTier} dummy`,
      target: targetForMonster(highPlating),
      source: highPlating.name,
    });
  }
  if (highHp && highHp.id !== highPlating?.id) {
    shapes.push({
      label: `high-HP elite T${reportTier} dummy`,
      target: targetForMonster(highHp),
      source: highHp.name,
    });
  } else if (highHp) {
    shapes.push({
      label: `high-HP elite T${reportTier} dummy`,
      target: targetForMonster(highHp),
      source: `${highHp.name} (also highest plating)`,
    });
  }
  return shapes;
}

function monsterDurabilityScore(monster: MonsterDefinition): number {
  const platingValue = Math.max(0, monster.stats.plating) * 8;
  const drValue = 1 / Math.max(0.05, 1 - monster.stats.damageReduction);
  const specialValue =
    (monster.evasion ?? 0) * 0.4 +
    (monster.enemyShield ? monster.enemyShield.shieldPct : 0) +
    (monster.enemySoftCap ? monster.enemySoftCap.capPct : 0);
  return (monster.stats.hp + platingValue) * drValue * (1 + specialValue);
}

function monsterDefenseLabel(monster: MonsterDefinition): string {
  const labels = [
    `HP ${asNumber(monster.stats.hp)}`,
    `plating ${asNumber(monster.stats.plating)}`,
    `DR ${asNumber(monster.stats.damageReduction * 100)}%`,
  ];
  if ((monster.evasion ?? 0) > 0) labels.push(`evasion ${asNumber((monster.evasion ?? 0) * 100)}%`);
  if (monster.enemyShield) labels.push(`shield ${asNumber(monster.enemyShield.shieldPct * 100)}%`);
  if (monster.enemySoftCap) labels.push('soft cap');
  if (monster.rampOnCombat) labels.push('ramp');
  if (monster.rampDebuff) labels.push('ramp debuff');
  return labels.join(', ');
}

function representativeMonstersForTier(reportTier: number): Array<{ role: string; monster: MonsterDefinition }> {
  const monsters = monstersForReportTier(reportTier);
  if (monsters.length === 0) return [];
  const byDurability = monsters.slice().sort((a, b) => monsterDurabilityScore(a) - monsterDurabilityScore(b));
  const picks: Array<{ role: string; monster: MonsterDefinition }> = [];
  const used = new Set<string>();

  function add(role: string, monster: MonsterDefinition | undefined): void {
    if (!monster || used.has(monster.id)) return;
    used.add(monster.id);
    picks.push({ role, monster });
  }

  add('Lightest', byDurability[0]);
  add('Low plating/DR', monsters.slice().sort((a, b) =>
    (a.stats.plating + a.stats.damageReduction * 100) -
    (b.stats.plating + b.stats.damageReduction * 100))[0]);
  add('High plating', monsters.slice().sort((a, b) => b.stats.plating - a.stats.plating)[0]);
  add('High DR/special', monsters.slice().sort((a, b) => {
    const specialA = a.stats.damageReduction + (a.evasion ?? 0) + (a.enemyShield ? a.enemyShield.shieldPct : 0) + (a.enemySoftCap ? 0.25 : 0);
    const specialB = b.stats.damageReduction + (b.evasion ?? 0) + (b.enemyShield ? b.enemyShield.shieldPct : 0) + (b.enemySoftCap ? 0.25 : 0);
    return specialB - specialA;
  })[0]);
  add('Heaviest', byDurability[byDurability.length - 1]);

  for (const index of [0.25, 0.5, 0.75]) {
    if (picks.length >= 5) break;
    add('Mid profile', byDurability[Math.min(byDurability.length - 1, Math.floor(index * (byDurability.length - 1)))]);
  }
  for (const monster of byDurability) {
    if (picks.length >= 5) break;
    add('Extra profile', monster);
  }

  return picks.slice(0, 5).sort((a, b) => monsterDurabilityScore(a.monster) - monsterDurabilityScore(b.monster));
}

function makeStatsTarget(
  combo: BuildCombo,
  weapon: ItemDefinition,
  plus: number,
  tier: number,
): PlayerStatsTarget {
  const equipment = emptyEquipment();
  equipment.weapon = weapon.id;
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
    holdsInventory: {
      inventory: [weapon.id],
      equipment,
      itemUpgrades: { [weapon.id]: Math.min(plus, getMaxUpgrade(weapon)) },
    },
    playerTier: tier,
  };
}

function withWeaponDebuffs(
  target: TargetDummy,
  passives: PassiveMap,
  hitsPerSecond: number,
): TargetDummy {
  let plating = target.plating;
  let damageReduction = target.damageReduction;

  const brittleStacks = Math.max(0, Math.round(passives['weapon.brittle-stacks'] ?? 0));
  if (brittleStacks > 0) {
    plating = Math.max(0, plating - brittleStacks * (passives['weapon.brittle-plating'] ?? 0));
    damageReduction = Math.max(0, damageReduction - brittleStacks * (passives['weapon.brittle-dr'] ?? 0));
    const threshold = passives['weapon.brittle-shatter-threshold'] ?? 0;
    const stripMs = passives['weapon.brittle-shatter-dr-strip-ms'] ?? 0;
    if (threshold > 0 && stripMs > 0 && brittleStacks >= threshold) {
      const uptime = Math.min(1, hitsPerSecond * (stripMs / 1000));
      damageReduction *= 1 - uptime;
    }
  }

  return { ...target, plating, damageReduction };
}

function directHit(
  attack: number,
  onHitDamage: number,
  target: TargetDummy,
  platingMult: number,
): number {
  return estimatePlayerHitDamage({
    attack,
    onHitDamage,
    targetPlating: target.plating,
    targetDamageReduction: target.damageReduction,
    platingMult,
  });
}

function directNoOnHit(
  attack: number,
  target: TargetDummy,
  platingMult: number,
): number {
  return directHit(attack, 0, target, platingMult);
}

function attackRate(stats: PlayerStatsTarget, passives: PassiveMap): number {
  let cooldown = stats.performsAttack.attackCooldown;
  const flurryPct = passives['weapon.flurry-pct'] ?? 0;
  const flurryStacks = Math.max(0, Math.round(passives['weapon.flurry-stacks'] ?? 0));
  if (flurryPct > 0 && flurryStacks > 0) {
    cooldown = Math.max(200, Math.round(cooldown / (1 + flurryPct * flurryStacks)));
  }
  return 1000 / Math.max(1, cooldown);
}

function reloadCycleRate(stats: PlayerStatsTarget, passives: PassiveMap, baseHitRate: number): number {
  if (stats.usesSkills.combatArchetype !== 'reload') return baseHitRate;
  if ((passives['reload.laser'] ?? 0) > 0) return 0;

  const ammo = Math.max(1, Math.round(passives['reload.max-ammo'] ?? 10));
  let reloadMs = Math.max(100, Math.round(passives['reload.reload-time-ms'] ?? 1600));
  if ((passives['reload.momentum'] ?? 0) > 0) {
    const maxStacks = Math.max(0, Math.round(passives['reload.momentum-max-stacks'] ?? 5));
    const reduction = passives['reload.momentum-reload-reduction'] ?? 0.1;
    reloadMs = Math.max(100, Math.round(reloadMs * Math.max(0.3, 1 - maxStacks * reduction)));
  }

  const secondsPerShot = 1 / Math.max(0.01, baseHitRate);
  if ((passives['reload.blunderbuss'] ?? 0) > 0) {
    return ammo / (secondsPerShot + reloadMs / 1000);
  }

  // Hair Trigger: each shot in the clip ramps attack speed (stacks reset on reload),
  // so the clip's shots fire progressively faster. Sum the per-shot intervals
  // instead of assuming a flat cadence.
  let clipShotTime = ammo * secondsPerShot;
  if ((passives['reload.hair-trigger'] ?? 0) > 0) {
    const pct = passives['reload.hair-trigger-pct-per-shot'] ?? 0.07;
    const maxStacks = Math.max(0, Math.round(passives['reload.hair-trigger-max-stacks'] ?? 5));
    clipShotTime = 0;
    for (let i = 0; i < ammo; i++) {
      const stacks = Math.min(i, maxStacks); // first shot fires at base speed, then ramps
      clipShotTime += Math.max(0.2, secondsPerShot / (1 + stacks * pct));
    }
  }
  return ammo / (clipShotTime + reloadMs / 1000);
}

function applyEncounterAverages(
  damagePerHit: number,
  passives: PassiveMap,
  target: TargetDummy,
): { directPerHit: number; weaponProcPerHit: number; notes: string[] } {
  let directPerHit = damagePerHit;
  let weaponProcPerHit = 0;
  const notes: string[] = [];

  const executeThreshold = passives['weapon.execute-threshold-pct'] ?? 0;
  const executeMult = passives['weapon.execute-dmg-mult'] ?? 1;
  if (executeThreshold > 0 && executeMult > 1) {
    const extra = directPerHit * executeThreshold * (executeMult - 1);
    weaponProcPerHit += extra;
    notes.push(`execute averaged over final ${Math.round(executeThreshold * 100)}% HP`);
  }

  const firstStrike = passives['weapon.first-strike-mult'] ?? 0;
  if (firstStrike > 1) {
    weaponProcPerHit += (directPerHit * (firstStrike - 1)) / Math.max(1, target.hp / Math.max(1, directPerHit));
    notes.push('first strike amortized over tier dummy HP');
  }

  const deadSwingEvery = Math.round(passives['weapon.dead-swing-interval'] ?? 0);
  if (deadSwingEvery > 1) {
    directPerHit *= (deadSwingEvery - 1) / deadSwingEvery;
    notes.push(`dead swing every ${deadSwingEvery} hits`);
  }

  return { directPerHit, weaponProcPerHit, notes };
}

function hitsToEnergyCap(
  energyMax: number,
  perHit: number,
  gainMult = 1,
  accelerationScale = 0,
): number {
  let energy = 0;
  let hits = 0;
  while (energy < energyMax && hits < 10_000) {
    const fillPct = energyMax > 0 ? energy / energyMax : 0;
    const gain = Math.max(1, Math.round(perHit * gainMult * (1 + fillPct * accelerationScale)));
    energy = Math.min(energyMax, energy + gain);
    hits++;
  }
  return Math.max(1, hits);
}

function chargeStateMultiplier(fillPct: number, minMult: number, maxMult: number): number {
  const fill = Math.max(0, Math.min(1, fillPct));
  return fill <= 0.5
    ? minMult + (1 - minMult) * fill * 2
    : 1 + (maxMult - 1) * (fill - 0.5) * 2;
}

/**
 * Average Juggernaut crescendo finisher bonus over a sustained combat window.
 * Mirrors server crescendoMultiplier: a front-loaded ramp to `rampMult` over
 * `rampSeconds`, then an unbounded `tailPerSec` tail. Sampled at second
 * midpoints over the horizon (combat assumed continuous; resets out of combat).
 */
function averageCrescendoBonus(passives: PassiveMap, horizonSec: number): number {
  const rampSeconds = Math.max(0.1, passives['cadence.crescendo-ramp-seconds'] ?? 15);
  const rampMult = Math.max(0, passives['cadence.crescendo-ramp-mult'] ?? 0.45);
  const tailPerSec = Math.max(0, passives['cadence.crescendo-tail-per-sec'] ?? 0.01);
  const steps = Math.max(1, Math.round(horizonSec));
  let sum = 0;
  for (let s = 0; s < steps; s++) {
    const t = s + 0.5;
    let mult = rampMult * (Math.min(t, rampSeconds) / rampSeconds);
    if (t > rampSeconds) mult += (t - rampSeconds) * tailPerSec;
    sum += mult;
  }
  return sum / steps;
}

function averageScaledDotTick(observedStacks: number, damagePerStack: number, effectMaxStacks = observedStacks): number {
  let total = 0;
  for (let stacks = 1; stacks <= observedStacks; stacks++) {
    total += computeScaledDotDamage({
      id: 'dot', stacks, maxStacks: effectMaxStacks, remainingMs: -1, sourceId: 'report',
      data: { damagePerStack },
    });
  }
  return total / Math.max(1, observedStacks);
}

function estimateClassDamage(
  stats: PlayerStatsTarget,
  target: TargetDummy,
  weapon: ItemDefinition,
): DpsBreakdown {
  const p = stats.usesSkills.passives;
  const archetype = stats.usesSkills.combatArchetype;
  const baseHitRate = attackRate(stats, p);
  const hitRate = reloadCycleRate(stats, p, baseHitRate);
  const platingMult = archetype === 'reload' ? 0.5 : 1;
  const targetWithDebuffs = withWeaponDebuffs(target, p, Math.max(baseHitRate, hitRate));
  const baseDirect = directNoOnHit(stats.dealsDamage.attack, targetWithDebuffs, platingMult);
  const baseWithOnHit = directHit(stats.dealsDamage.attack, stats.dealsDamage.onHitDamage, targetWithDebuffs, platingMult);
  const empowered = resolveEmpoweredMultiplier(p, archetype);
  const notes: string[] = [];
  let directPerHit = baseWithOnHit;
  let classMechanicPerSec = 0;
  let dotPerSec = 0;
  let weaponProcPerSec = 0;
  let effectiveHitRate = hitRate;

  if (archetype === 'cadence') {
    if ((p['cadence.rampage'] ?? 0) > 0) {
      // Berserker: simulate one full rampage cycle. Each finisher adds a stack
      // (shorter combo, faster attacks, weaker regulars, stronger finisher) until
      // the cap, where the next finisher OVERLOADS (stacks → 0, no rampage mult)
      // and the cycle restarts. Stacks update on the finisher and govern the NEXT
      // buildup's threshold/cooldown/penalty, matching the live recompute order.
      // We sum damage and time across the cycle for an in-combat average DPS.
      const mult = empowered?.effective ?? p['cadence.empowered-mult'] ?? CADENCE_DAMAGE_MULT_DEFAULT;
      const maxStacks = Math.max(1, Math.round(p['cadence.rampage-max-stacks'] ?? 10));
      const thresholdFloor = Math.max(1, Math.round(p['cadence.rampage-threshold-floor'] ?? 2));
      const apsPerStackMs = Math.max(0, p['cadence.rampage-aps-per-stack-ms'] ?? 60);
      const atkPenPerStack = Math.max(0, p['cadence.rampage-atk-pen-per-stack'] ?? 0.08);
      const multPerStack = Math.max(0, p['cadence.rampage-mult-per-stack'] ?? 0.15);
      const baseThreshold = Math.max(thresholdFloor, Math.round((p['cadence.empowered-threshold'] ?? 5) + (p['cadence.threshold-mod'] ?? 0)));
      const baseCooldownMs = Math.max(200, stats.performsAttack.attackCooldown);
      const baseFinisher = directNoOnHit(stats.dealsDamage.attack * mult, targetWithDebuffs, platingMult) + stats.dealsDamage.onHitDamage;

      let cycleDamage = 0;
      let cycleTimeMs = 0;
      for (let k = 1; k <= maxStacks + 1; k++) {
        const buildupStacks = k - 1; // stacks in effect during this finisher's buildup
        const threshold = Math.max(thresholdFloor, baseThreshold - buildupStacks);
        const cooldownMs = Math.max(200, baseCooldownMs - buildupStacks * apsPerStackMs);
        const penalty = Math.min(0.9, buildupStacks * atkPenPerStack);
        const normalHits = Math.max(0, threshold - 1);
        const normalDmg = baseWithOnHit * (1 - penalty);
        const finisherStacks = k <= maxStacks ? k : 0; // overload finisher gets no mult
        const finisherDmg = baseFinisher * (1 + finisherStacks * multPerStack);
        cycleDamage += normalHits * normalDmg + finisherDmg;
        cycleTimeMs += threshold * cooldownMs;
      }
      const rampageDps = cycleDamage / Math.max(0.001, cycleTimeMs / 1000);
      directPerHit = baseWithOnHit;
      classMechanicPerSec += rampageDps - baseWithOnHit * hitRate;
      notes.push(`berserker rampage cycle simulated (1→${maxStacks} stacks then overload), +${Math.round(multPerStack * 100)}% finisher/stack`);
    } else {
      const threshold = Math.max(2, Math.round((p['cadence.empowered-threshold'] ?? 5) + (p['cadence.threshold-mod'] ?? 0)));
      const mult = empowered?.effective ?? p['cadence.empowered-mult'] ?? CADENCE_DAMAGE_MULT_DEFAULT;
      const triggerCount = Math.max(1, Math.round(p['cadence.trigger-count'] ?? 1));
      const extraTriggerMult = Math.max(0, p['cadence.extra-trigger-damage-mult'] ?? 1);
      const normalHits = threshold - 1;
      let normal = baseWithOnHit;
      let finisher = directNoOnHit(stats.dealsDamage.attack * mult, targetWithDebuffs, platingMult) + stats.dealsDamage.onHitDamage;

      if ((p['cadence.metronome'] ?? 0) > 0) {
        // Per-tier flat scales as max(1, playerTier - unlock(4) + 1), matching live.
        const flat = (p['cadence.metronome-flat'] ?? 12) * Math.max(1, (stats.playerTier ?? 4) - 4 + 1);
        classMechanicPerSec += ((normalHits * (normalHits - 1)) / 2 + normalHits) * flat / threshold * hitRate;
        notes.push('metronome flat cycle estimate');
      }
      if ((p['cadence.momentum-buildup'] ?? 0) > 0) {
        finisher *= 1 + normalHits * (p['cadence.momentum-buildup'] ?? 0);
        const echoHits = Math.round(p['cadence.momentum-echo'] ?? 0);
        const echoBonus = p['cadence.momentum-echo-bonus'] ?? 0.5;
        classMechanicPerSec += Math.min(echoHits, normalHits) * normal * echoBonus / threshold * hitRate;
        notes.push('wavecrest resonance/echo steady estimate');
      }
      if ((p['cadence.crescendo'] ?? 0) > 0) {
        const avgCrescendo = averageCrescendoBonus(p, REPORT_HORIZON_SEC);
        finisher *= 1 + avgCrescendo;
        notes.push(`juggernaut crescendo averaged +${Math.round(avgCrescendo * 100)}% finisher over ${REPORT_HORIZON_SEC}s`);
      }
      if ((p['cadence.hemorrhage'] ?? 0) > 0) {
        const hemoMult = p['cadence.hemorrhage-mult'] ?? 1.5;
        dotPerSec += (finisher * hemoMult / threshold) * hitRate;
        finisher = 0;
        notes.push('hemorrhage converts finishers to bleed');
      }
      if ((p['cadence.debuff-vuln-pct'] ?? 0) > 0) {
        const vuln = (p['cadence.debuff-vuln-pct'] ?? 0) / 100;
        normal *= 1 + vuln;
        finisher *= 1 + vuln;
        notes.push('cursed finale vulnerability treated as steady-state');
      }
      const finisherTotal = finisher * (1 + (triggerCount - 1) * extraTriggerMult);
      if (triggerCount > 1) {
        notes.push(`${triggerCount - 1} extra finisher hit(s) at ${Math.round(extraTriggerMult * 100)}% damage`);
      }
      if ((p['cadence.aftershock'] ?? 0) > 0) {
        // Shockblade: the next N regular attacks after a finisher fire on-hit twice
        // (the flat on-hit scaling is already folded into onHitDamage by recalc).
        const aftershockAttacks = Math.max(1, Math.round(p['cadence.aftershock-attacks'] ?? 3));
        const armed = Math.min(aftershockAttacks, normalHits);
        classMechanicPerSec += armed * stats.dealsDamage.onHitDamage * hitRate / threshold;
        notes.push(`shockblade: ${armed} post-finisher attack(s) fire on-hit twice`);
      }
      if ((p['cadence.detonation'] ?? 0) > 0) {
        // Justicar: each finisher banks bankPct of its damage into an execute pool
        // that is eventually spent. Optimistic upper bound — ignores the overshoot
        // wasted when the pool resets on an execute that needed less than banked.
        const bankPct = Math.max(0, p['cadence.verdict-bank-pct'] ?? 0.30);
        classMechanicPerSec += bankPct * finisherTotal * hitRate / threshold;
        notes.push(`justicar verdict: +${Math.round(bankPct * 100)}% finisher banked as execute (optimistic)`);
      }
      const cadenceAveragePerHit = (normalHits * normal + finisherTotal) / threshold;
      classMechanicPerSec += (cadenceAveragePerHit - baseWithOnHit) * hitRate;
      directPerHit = baseWithOnHit;
    }
  } else if (archetype === 'cooldown') {
    const cdSec = Math.max(0.1, (p['cooldown.empowered-cd-ms'] ?? 7000) / 1000);
    const execRate = 1 / cdSec;
    const mult = empowered?.effective ?? p['cooldown.empowered-mult'] ?? 2;
    const exec = directNoOnHit(stats.dealsDamage.attack * mult, targetWithDebuffs, platingMult) + stats.dealsDamage.onHitDamage;
    if ((p['cooldown.singular-extraction'] ?? 0) > 0) {
      directPerHit = stats.dealsDamage.onHitDamage;
      classMechanicPerSec += exec * execRate;
      notes.push('singular extraction: normal direct damage suppressed');
    } else if ((p['cooldown.channeled-beam'] ?? 0) > 0) {
      const beamMult = p['cooldown.channeled-beam-mult'] ?? 1;
      classMechanicPerSec += directNoOnHit(stats.dealsDamage.attack * beamMult, targetWithDebuffs, platingMult) * 6 * execRate;
      notes.push('channeled beam estimated as six 500 ms ticks');
    } else {
      classMechanicPerSec += Math.max(0, exec - baseWithOnHit) * execRate;
    }
    if ((p['cooldown.overdrive'] ?? 0) > 0) {
      const durationSec = Math.max(0.1, (p['cooldown.overdrive-duration-ms'] ?? 2500) / 1000);
      const attackSpeedPct = Math.max(0, p['cooldown.overdrive-attack-speed-pct'] ?? 1);
      const uptime = Math.min(1, durationSec / cdSec);
      classMechanicPerSec += baseWithOnHit * hitRate * attackSpeedPct * uptime;
      notes.push(`${Math.round(attackSpeedPct * 100)}% overdrive attack speed averaged at ${Math.round(uptime * 100)}% uptime`);
    }
    if ((p['cooldown.battery'] ?? 0) > 0) {
      const intervalSec = Math.max(0.1, (p['cooldown.battery-stack-interval-ms'] ?? 1000) / 1000);
      const damagePerStack = Math.max(0, p['cooldown.battery-damage-per-stack'] ?? 2);
      const stacksAtExecution = Math.max(0, Math.floor(cdSec / intervalSec));
      const averageStacks = stacksAtExecution / 2;
      classMechanicPerSec += damagePerStack * averageStacks * hitRate;
      classMechanicPerSec += damagePerStack * stacksAtExecution * execRate;
      notes.push(`dynamo averaged ${asNumber(averageStacks)} regular-hit stacks, ${stacksAtExecution} on execution`);
    }
    if ((p['cooldown.patience-paid'] ?? 0) > 0) {
      const rampSec = Math.max(0.1, (p['cooldown.patience-ramp-ms'] ?? 7000) / 1000);
      const attackMax = Math.max(0, p['cooldown.patience-attack-max'] ?? 0.5);
      const executionMax = Math.max(0, p['cooldown.patience-execution-max'] ?? 0.75);
      const averageRamp = cdSec <= rampSec
        ? cdSec / (2 * rampSec)
        : 1 - rampSec / (2 * cdSec);
      const executionRamp = Math.min(1, cdSec / rampSec);
      classMechanicPerSec += baseWithOnHit * hitRate * attackMax * averageRamp;
      classMechanicPerSec += exec * execRate * executionMax * executionRamp;
      notes.push(`stalwart linear ramp averaged; ${Math.round(attackMax * 100)}% attack/${Math.round(executionMax * 100)}% execution caps`);
    }
    if ((p['cooldown.reverb'] ?? 0) > 0) {
      classMechanicPerSec += exec * Math.floor(cdSec * hitRate) * (p['cooldown.reverb-bonus-per-attack'] ?? 0.04) * execRate;
      notes.push('reverb next-window bonus estimated');
    }
    if ((p['cooldown.vengeance'] ?? 0) > 0) {
      classMechanicPerSec += (p['cooldown.vengeance-floor'] ?? 30) * execRate;
      notes.push('vengeance uses floor only; incoming damage is not modeled');
    }
    if ((p['cooldown.eternal-cycle'] ?? 0) > 0) {
      // Transcendant: each normal attack banks a stack and adds (stacks × flat) to
      // that hit (ramping); the execution adds the full stack total again, then
      // clears. flat scales per tier above unlock(4), matching live.
      const flat = Math.round((p['cooldown.eternal-cycle-flat'] ?? 8) * Math.max(1, (stats.playerTier ?? 4) - 4 + 1));
      const durationSec = Math.max(0.1, (p['cooldown.eternal-charge-duration-ms'] ?? 10000) / 1000);
      const windowSec = Math.min(cdSec, durationSec);
      const n = Math.max(0, Math.floor(windowSec * hitRate)); // normal hits between executions
      const rampBonus = flat * (n * (n + 1)) / 2; // 1×+2×+…+n× across the buildup
      const execBonus = flat * n;                 // execution spends the full stack total
      classMechanicPerSec += (rampBonus + execBonus) * execRate;
      notes.push(`eternal cycle ramps ${n} stacks at ${flat}/stack between executions`);
    }
    if ((p['cooldown.rupture'] ?? 0) > 0) {
      // Duelist: execution ignores plating entirely (platingMult 0). For a window
      // after, regular attacks get reduced plating + partial DR pierce.
      const windowSec = Math.max(0, (p['cooldown.rupture-window-ms'] ?? 2000) / 1000);
      const windowPlatingMult = Math.max(0, p['cooldown.rupture-window-plating-mult'] ?? 0.5);
      const drPierce = Math.max(0, Math.min(1, p['cooldown.rupture-dr-pierce'] ?? 0.10));
      const uptime = Math.min(1, cdSec > 0 ? windowSec / cdSec : 1);
      const windowTarget = { ...targetWithDebuffs, damageReduction: targetWithDebuffs.damageReduction * (1 - drPierce) };
      const windowHit = directHit(stats.dealsDamage.attack, stats.dealsDamage.onHitDamage, windowTarget, windowPlatingMult);
      classMechanicPerSec += (windowHit - baseWithOnHit) * uptime * hitRate;
      const ruptureExec = directNoOnHit(stats.dealsDamage.attack * mult, targetWithDebuffs, 0) + stats.dealsDamage.onHitDamage;
      classMechanicPerSec += (ruptureExec - exec) * execRate;
      notes.push(`rupture: ${Math.round(uptime * 100)}% window (plating ×${windowPlatingMult}, ${Math.round(drPierce * 100)}% DR pierce); execution ignores plating`);
    }
  } else if (archetype === 'energy') {
    const maxEnergy = resolveEnergyMax(p, stats.playerTier ?? 0);
    const perHit = Math.max(1, Math.round(p['energy.per-hit'] ?? 14));
    const mult = empowered?.effective ?? p['energy.empowered-mult'] ?? 2;
    const genericEmpoweredHit = directNoOnHit(stats.dealsDamage.attack * mult, targetWithDebuffs, platingMult) + stats.dealsDamage.onHitDamage;
    let modeledCycle = false;

    if ((p['energy.flash'] ?? 0) > 0) {
      const damageShift = Math.max(0, p['energy.flash-max-damage-shift-pct'] ?? 0.45);
      const speedBonus = Math.min(0.95, Math.max(0, p['energy.flash-max-speed-bonus-pct'] ?? 0.45));
      directPerHit = directHit(
        stats.dealsDamage.attack * (1 - damageShift),
        stats.dealsDamage.onHitDamage,
        targetWithDebuffs,
        platingMult,
      );
      effectiveHitRate = hitRate / (1 - speedBonus);
      modeledCycle = true;
      notes.push(`flash modeled at full red shift: ${Math.round(damageShift * 100)}% attack loss, ${Math.round(speedBonus * 100)}% cooldown reduction`);
    } else if ((p['energy.overdrive'] ?? 0) > 0) {
      const normalHits = hitsToEnergyCap(maxEnergy, perHit);
      const attackBonus = Math.max(0, p['energy.overdrive-attack-damage-pct'] ?? 0.40);
      const decayPerSec = Math.max(0.01, p['energy.overdrive-decay-per-sec'] ?? 18);
      const buildSec = normalHits / hitRate;
      const activeSec = maxEnergy / decayPerSec;
      const uptime = activeSec / (buildSec + activeSec);
      classMechanicPerSec += directNoOnHit(stats.dealsDamage.attack * attackBonus, targetWithDebuffs, platingMult) * hitRate * uptime;
      modeledCycle = true;
      notes.push(`surge ${Math.round(attackBonus * 100)}% attack bonus averaged at ${Math.round(uptime * 100)}% uptime`);
    } else if ((p['energy.upkeep'] ?? 0) > 0) {
      const upkeep = resolveUpkeepConfig(p);
      const decayBase = Math.max(0, p['energy.upkeep-decay-base'] ?? 12);
      const decayRamp = Math.max(0, p['energy.upkeep-decay-ramp-per-sec'] ?? 1.5);
      const gainPerSec = perHit * hitRate;
      let sustainSec = REPORT_HORIZON_SEC;
      if (decayRamp > 0) {
        const peakSec = Math.max(0, (gainPerSec - decayBase) / decayRamp);
        const peakEnergy = Math.min(maxEnergy, perHit + 0.5 * Math.max(0, gainPerSec - decayBase) * peakSec);
        sustainSec = Math.min(REPORT_HORIZON_SEC, peakSec + Math.sqrt(2 * peakEnergy / decayRamp));
      } else if (gainPerSec <= decayBase) {
        sustainSec = Math.min(REPORT_HORIZON_SEC, perHit / Math.max(0.01, decayBase - gainPerSec));
      }
      const averageStacks = Math.max(0, Math.floor((sustainSec * 1000 / upkeep.stackIntervalMs) / 2));
      const tier = (stats.playerTier ?? 3) + 1;
      const flowOnHit = upkeepOnHitBonus(averageStacks, tier, upkeep);
      classMechanicPerSec += flowOnHit * hitRate;
      modeledCycle = true;
      notes.push(`flow averaged at ${averageStacks} stacks over a ${asNumber(sustainSec)}s sustain window`);
    } else if ((p['energy.binary-cycle'] ?? 0) > 0) {
      const chargeGain = Math.max(0.01, p['energy.binary-charge-gain-mult'] ?? 0.6);
      const dischargeGain = Math.max(0.01, p['energy.binary-discharge-gain-mult'] ?? 1.5);
      const chargeSpeed = Math.max(0.01, p['energy.binary-charge-speed-factor'] ?? 1.25);
      const dischargeSpeed = Math.max(0.01, p['energy.binary-discharge-speed-factor'] ?? 0.75);
      const chargeHits = hitsToEnergyCap(maxEnergy, perHit, chargeGain);
      const dischargeHits = hitsToEnergyCap(maxEnergy, perHit, dischargeGain);
      const chargeOnHitBonus = Math.max(0, p['energy.binary-charge-onhit-bonus'] ?? 0.30);
      const chargeOnHitPerTier = Math.max(0, p['energy.binary-charge-onhit-per-tier'] ?? 6);
      const dischargeAttackBonus = Math.max(0, p['energy.binary-discharge-attack-bonus'] ?? 0.30);
      const chargeDischargeMult = Math.max(0, p['energy.binary-charge-discharge-mult'] ?? 0.8);
      const dischargeDischargeMult = Math.max(0, p['energy.binary-discharge-discharge-mult'] ?? 1.3);
      const tierMult = Math.max(1, (stats.playerTier ?? 3) - 3 + 1);
      const chargeHit = directHit(stats.dealsDamage.attack, stats.dealsDamage.onHitDamage * (1 + chargeOnHitBonus), targetWithDebuffs, platingMult)
        + chargeOnHitPerTier * tierMult;
      const dischargeHit = directHit(stats.dealsDamage.attack * (1 + dischargeAttackBonus), stats.dealsDamage.onHitDamage, targetWithDebuffs, platingMult);
      const weakDischarge = directNoOnHit(stats.dealsDamage.attack * mult * chargeDischargeMult, targetWithDebuffs, platingMult) + stats.dealsDamage.onHitDamage;
      const strongDischarge = directNoOnHit(stats.dealsDamage.attack * mult * dischargeDischargeMult, targetWithDebuffs, platingMult) + stats.dealsDamage.onHitDamage;
      const chargeRate = hitRate / chargeSpeed;
      const dischargeRate = hitRate / dischargeSpeed;
      const cycleSec = (chargeHits + 1) / chargeRate + (dischargeHits + 1) / dischargeRate;
      const cycleDamage = chargeHits * chargeHit + weakDischarge + dischargeHits * dischargeHit + strongDischarge;
      classMechanicPerSec += cycleDamage / cycleSec - baseWithOnHit * hitRate;
      modeledCycle = true;
      notes.push(`binary cycle uses ${chargeHits} charge-state and ${dischargeHits} discharge-state builders`);
    } else if ((p['energy.awakened-lightning'] ?? 0) > 0) {
      const normalHits = hitsToEnergyCap(maxEnergy, perHit);
      const strikeCount = Math.max(1, Math.round(p['energy.awakened-strike-count'] ?? 4));
      const damageMult = Math.max(0, p['energy.awakened-damage-mult'] ?? 1.5);
      const strike = directNoOnHit(stats.dealsDamage.attack * damageMult, targetWithDebuffs, platingMult) + stats.dealsDamage.onHitDamage;
      const cycleAverage = (normalHits * baseWithOnHit + strikeCount * strike) / (normalHits + strikeCount);
      classMechanicPerSec += (cycleAverage - baseWithOnHit) * hitRate;
      modeledCycle = true;
      notes.push(`${strikeCount} awakened strikes at ${damageMult}x per discharge cycle`);
    } else if ((p['energy.charge-state'] ?? 0) > 0) {
      const normalHits = hitsToEnergyCap(maxEnergy, perHit);
      const minMult = Math.max(0, p['energy.charge-state-min-mult'] ?? 0.5);
      const maxMult = Math.max(0, p['energy.charge-state-max-mult'] ?? 2.0);
      let cycleDamage = genericEmpoweredHit;
      let energy = 0;
      for (let i = 0; i < normalHits; i++) {
        const attackMult = chargeStateMultiplier(energy / maxEnergy, minMult, maxMult);
        cycleDamage += directHit(stats.dealsDamage.attack * attackMult, stats.dealsDamage.onHitDamage, targetWithDebuffs, platingMult);
        energy = Math.min(maxEnergy, energy + perHit);
      }
      const cycleAverage = cycleDamage / (normalHits + 1);
      classMechanicPerSec += (cycleAverage - baseWithOnHit) * hitRate;
      modeledCycle = true;
      notes.push(`aether oscillation sampled across ${normalHits} energy-building hits`);
    } else if ((p['energy.singularity-execute'] ?? 0) > 0) {
      const accelScale = Math.max(0, p['energy.singularity-gain-accel-scale'] ?? 0.5);
      const normalHits = hitsToEnergyCap(maxEnergy, perHit, 1, accelScale);
      const dischargeScale = maxEnergy / 100;
      const discharge = directNoOnHit(stats.dealsDamage.attack * mult * dischargeScale, targetWithDebuffs, platingMult)
        + stats.dealsDamage.onHitDamage;
      const cycleAverage = (normalHits * baseWithOnHit + discharge) / (normalHits + 1);
      classMechanicPerSec += (cycleAverage - baseWithOnHit) * hitRate;
      modeledCycle = true;
      notes.push(`singularity accelerated gain reaches ${maxEnergy} energy in ${normalHits} hits; early execute averaged separately`);
    } else if ((p['energy.critical-mass'] ?? 0) > 0) {
      const stacks = Math.max(1, Math.round(p['energy.critical-mass-max-stacks'] ?? 3));
      const gainPerStack = Math.max(0, p['energy.critical-mass-gain-per-stack'] ?? 0.20);
      const damagePerStack = Math.max(0, p['energy.critical-mass-discharge-per-stack'] ?? 0.20);
      const normalHits = hitsToEnergyCap(maxEnergy, perHit, 1 + stacks * gainPerStack);
      const discharge = genericEmpoweredHit * (1 + stacks * damagePerStack);
      const cycleAverage = (normalHits * baseWithOnHit + discharge) / (normalHits + 1);
      classMechanicPerSec += (cycleAverage - baseWithOnHit) * hitRate;
      modeledCycle = true;
      notes.push(`critical mass assumes sustained ${stacks}-stack uptime`);
    } else if ((p['energy.endless-storm'] ?? 0) > 0) {
      const normalHits = hitsToEnergyCap(maxEnergy, perHit);
      const totalMult = Math.max(0, p['energy.endless-storm-total-mult'] ?? 8);
      const durationSec = Math.max(0.1, (p['energy.endless-storm-duration-ms'] ?? 4500) / 1000);
      const extendSec = Math.max(0, (p['energy.endless-storm-extend-ms'] ?? 1000) / 1000);
      const maxSec = Math.max(durationSec, (p['energy.endless-storm-max-ms'] ?? 7500) / 1000);
      const cycleSec = (normalHits + 1) / hitRate;
      const stormLifeSec = Math.min(maxSec, durationSec + normalHits * extendSec);
      const uptime = Math.min(1, stormLifeSec / cycleSec);
      dotPerSec += stats.dealsDamage.attack * totalMult / durationSec * uptime;
      const cycleAverage = (normalHits * baseWithOnHit + baseWithOnHit) / (normalHits + 1);
      classMechanicPerSec += (cycleAverage - baseWithOnHit) * hitRate;
      modeledCycle = true;
      notes.push(`endless storm ${totalMult}x budget at ${Math.round(uptime * 100)}% uptime after extensions`);
    }

    if (!modeledCycle) {
      const normalHits = hitsToEnergyCap(maxEnergy, perHit);
      const energyAveragePerHit = (normalHits * baseWithOnHit + genericEmpoweredHit) / (normalHits + 1);
      classMechanicPerSec += (energyAveragePerHit - baseWithOnHit) * hitRate;
    }
  } else if (archetype === 'dot') {
    const profile = resolveDotClassProfile(p, stats.usesSkills.selectedSubVariant);
    const dmgPerStack = computeDotClassDamagePerStack(stats.dealsDamage.attack, profile);
    const poisonExplosion = (p['dot.poison-explosion'] ?? 0) > 0;
    const maxStacks = poisonExplosion
      ? Math.max(1, Math.round(p['dot.poison-explosion-max-stacks'] ?? 10))
      : profile.maxStacks;
    const tickSec = Math.max(0.1, profile.tickIntervalMs / 1000);
    directPerHit = Math.max(1, Math.round(baseWithOnHit * (1 - profile.conversionPct)));

    if (poisonExplosion) {
      const rampStacks = Math.max(0, maxStacks - 1);
      if (rampStacks > 0) dotPerSec = averageScaledDotTick(rampStacks, dmgPerStack, maxStacks) / tickSec;
      const burstTicks = Math.max(0, p['dot.poison-explosion-burst-ticks'] ?? 10);
      classMechanicPerSec += maxStacks * dmgPerStack * burstTicks * hitRate / maxStacks;
      notes.push(`poison explosion ${maxStacks}-hit cycle with ${burstTicks} full-tick burst equivalents`);
    } else if ((p['dot.eternal-doom'] ?? 0) > 0) {
      const fullStacks = Math.max(0, Math.round(p['dot.eternal-doom-full-stacks'] ?? 8));
      const diminishRate = Math.max(0, p['dot.eternal-doom-diminish-rate'] ?? 0.5);
      const stackCap = Math.max(1, Math.round(p['dot.eternal-doom-max-stacks'] ?? 50));
      const steadyStacks = Math.min(stackCap, Math.max(fullStacks, Math.round(hitRate * REPORT_HORIZON_SEC)));
      dotPerSec = computeEternalDoomDamage(steadyStacks, dmgPerStack, fullStacks, diminishRate) / tickSec;
      notes.push(`eternal doom estimated at ${steadyStacks}/${stackCap} stacks over the report horizon`);
    } else {
      dotPerSec = computeScaledDotDamage({
        id: 'dot',
        stacks: maxStacks,
        maxStacks,
        remainingMs: -1,
        sourceId: 'report',
        data: { damagePerStack: dmgPerStack },
      }) / tickSec;
    }

    if ((p['dot.frenzy'] ?? 0) > 0) {
      const durationMs = Math.max(100, Math.round(p['dot.frenzy-duration-ms'] ?? 6000));
      const attackSpeedPct = Math.max(0, p['dot.frenzy-attack-speed-pct'] ?? 0.30);
      const onHitPerTier = Math.max(0, p['dot.frenzy-onhit-per-tier'] ?? 10);
      const tierMult = Math.max(1, (stats.playerTier ?? 3) - 3 + 1);
      effectiveHitRate *= 1 + attackSpeedPct;
      classMechanicPerSec += onHitPerTier * tierMult * effectiveHitRate;
      notes.push(`frenzy ${Math.round(attackSpeedPct * 100)}% attack speed and ${onHitPerTier * tierMult} on-hit (${durationMs / 1000}s, high uptime)`);
    }

    if ((p['dot.fan-the-flames'] ?? 0) > 0) {
      const stackDamageMult = Math.max(0, p['dot.fan-the-flames-stack-damage-mult'] ?? 0.5);
      const stacksPerHit = Math.max(1, Math.round(p['dot.fan-the-flames-stacks-per-hit'] ?? 2));
      const bonusMult = Math.max(0, p['dot.fan-the-flames-max-stack-bonus-mult'] ?? 2);
      dotPerSec *= stackDamageMult;
      classMechanicPerSec += maxStacks * dmgPerStack * bonusMult * effectiveHitRate;
      notes.push(`${stacksPerHit} burn stacks/hit at ${Math.round(stackDamageMult * 100)}% value; max-stack bonus ${bonusMult}x`);
    }

    if ((p['dot.ignition'] ?? 0) > 0) {
      const stackDamageMult = Math.max(0, p['dot.ignition-stack-damage-mult'] ?? 0.6);
      dotPerSec *= stackDamageMult;
      directPerHit = baseWithOnHit;
      notes.push(`ignition uses ${Math.round(stackDamageMult * 100)}% burn stacks and full direct hits at max stacks`);
    }

    if ((p['dot.conflagration'] ?? 0) > 0) {
      const ticks = Math.max(1, Math.round(p['dot.conflagration-ticks'] ?? 10));
      const confTickSec = Math.max(0.1, (p['dot.conflagration-tick-ms'] ?? 250) / 1000);
      const damageFactor = Math.max(0, p['dot.conflagration-damage-factor'] ?? 1);
      const buildSec = maxStacks / effectiveHitRate;
      const confSec = ticks * confTickSec;
      const buildDotPerSec = averageScaledDotTick(maxStacks, dmgPerStack) / tickSec;
      const confTotal = maxStacks * dmgPerStack * damageFactor * ticks;
      dotPerSec = (buildDotPerSec * buildSec + confTotal) / (buildSec + confSec);
      notes.push(`conflagration cycle: ${ticks} ticks every ${Math.round(confTickSec * 1000)}ms at ${damageFactor}x factor`);
    }

    if ((p['dot.wind-spirit'] ?? 0) > 0) {
      const frostbitePerStack = p['dot.frostbite-dot-taken-pct'] ?? WIND_SPIRIT_FROSTBITE_PER_STACK_DEFAULT;
      const frostbiteMaxStacks = Math.max(1, Math.round(p['dot.frostbite-max-stacks'] ?? WIND_SPIRIT_FROSTBITE_MAX_STACKS_DEFAULT));
      const frostbiteMs = Math.max(100, Math.round(p['dot.frostbite-duration-ms'] ?? WIND_SPIRIT_FROSTBITE_MS_DEFAULT));
      const frostbiteStacks = Math.min(frostbiteMaxStacks, Math.max(0, hitRate * frostbiteMs / 1000));
      dotPerSec *= 1 + frostbiteStacks * frostbitePerStack;
      directPerHit = 0;
      notes.push(`wind spirit frostbite estimated at ${asNumber(frostbiteStacks)} steady stacks`);
    }

    if ((p['dot.rimeshatter'] ?? 0) > 0) {
      const drReduction = Math.max(0, p['dot.rimeshatter-dr-reduction'] ?? 0.08);
      const debuffMs = Math.max(100, p['dot.rimeshatter-duration-ms'] ?? 2000);
      const reducedTarget = {
        ...targetWithDebuffs,
        damageReduction: Math.max(0, targetWithDebuffs.damageReduction - drReduction),
      };
      directPerHit = directHit(stats.dealsDamage.attack, stats.dealsDamage.onHitDamage, reducedTarget, platingMult);
      notes.push(`max-stack direct bypass with ${Math.round(drReduction * 100)}% DR reduction (${debuffMs / 1000}s, high uptime)`);
    }

    if ((p['dot.freezing-cold'] ?? 0) > 0) {
      const chillMax = Math.max(1, Math.round(p['dot.chill-max-stacks'] ?? 9));
      const freezeSec = Math.max(0.1, (p['dot.freeze-duration-ms'] ?? 2000) / 1000);
      const damageTakenPct = Math.max(0, p['dot.freeze-damage-taken-pct'] ?? 0.35);
      const buildSec = chillMax / effectiveHitRate;
      const freezeUptime = freezeSec / (buildSec + freezeSec);
      const averageMult = 1 + damageTakenPct * freezeUptime;
      directPerHit *= averageMult;
      dotPerSec *= averageMult;
      notes.push(`freeze damage bonus averaged at ${Math.round(freezeUptime * 100)}% uptime (${chillMax} hits, ${freezeSec}s freeze)`);
    }
  } else if (archetype === 'reload') {
    if ((p['reload.laser'] ?? 0) > 0) {
      const heatPerTick = p['reload.laser-heat-per-tick'] ?? 2;
      const coolPerTick = p['reload.laser-cool-per-tick'] ?? 2.5;
      const duty = (100 / heatPerTick) / ((100 / heatPerTick) + (100 / coolPerTick));
      directPerHit = 0;
      effectiveHitRate = 0;
      classMechanicPerSec += directNoOnHit(stats.dealsDamage.attack * (p['reload.laser-damage-per-tick-pct'] ?? 0.18), targetWithDebuffs, platingMult) * 10 * duty;
      notes.push('laser heat/cool duty cycle estimated');
    } else if ((p['reload.alternating-cadence'] ?? 0) > 0) {
      const attackShot = directNoOnHit(stats.dealsDamage.attack * 2, targetWithDebuffs, platingMult);
      const onHitShot = stats.dealsDamage.onHitDamage * 2;
      directPerHit = (attackShot + onHitShot) / 2;
      notes.push('dual shots averaged 50/50');
    } else if ((p['reload.blunderbuss'] ?? 0) > 0) {
      const mult = Math.max(0, 1 + (p['reload.blunderbuss-damage-mult'] ?? 0));
      directPerHit *= mult;
      notes.push(`blunderbuss modeled as full-magazine single-target volley at ${Math.round(mult * 100)}% pellet damage`);
    } else if ((p['reload.death-mark'] ?? 0) > 0) {
      const ammo = Math.max(1, Math.round(p['reload.max-ammo'] ?? 10));
      classMechanicPerSec += stats.dealsDamage.attack * ammo * (p['reload.death-mark-detonate-mult'] ?? 0.65) * effectiveHitRate / ammo;
      notes.push('death mark detonation averaged per clip');
    } else if ((p['reload.cannon'] ?? 0) > 0) {
      classMechanicPerSec += stats.dealsDamage.attack * (p['reload.cannon-damage-per-shot'] ?? 0.5) * effectiveHitRate;
      notes.push('cannon stored pool averaged per shot');
    } else if ((p['reload.exploding-clip'] ?? 0) > 0) {
      // Duelist: the last round of each clip is armed empowered (reload.empowered-mult)
      // and gets the standard empowered splash (single-target here, so splash ignored).
      const empMult = empowered?.effective ?? p['reload.empowered-mult'] ?? 3.5;
      const ammo = Math.max(1, Math.round(p['reload.max-ammo'] ?? 10));
      const empoweredShot = directNoOnHit(stats.dealsDamage.attack * empMult, targetWithDebuffs, platingMult) + stats.dealsDamage.onHitDamage;
      classMechanicPerSec += (empoweredShot - baseWithOnHit) * effectiveHitRate / ammo;
      notes.push(`exploding clip: empowered last shot (${empMult}x) once per ${ammo}-round clip`);
    }
    if ((p['reload.snipe-fullhp-mult'] ?? 0) > 1) {
      // Full-HP bonus: every shot landed while the target is above the threshold deals
      // fullHpMult x damage (snipeDamage.ts). It only ever applies to the top
      // (1 - threshold) slice of a fresh target's HP bar, so its real value is a
      // start-of-kill burst, not a sustained proc. Model it as the exact kill-time
      // speed-up: ratio of shots-to-kill without the bonus vs. with it, at constant
      // cadence. Folding it into directPerHit (rather than weaponProc) lets it inherit
      // shared.damage-mult and weapon-DoT conversion, matching the live order where the
      // full-HP mult lands in the onHit listener after those layers.
      const fullHpMult = p['reload.snipe-fullhp-mult'] ?? 1;
      const threshold = p['reload.snipe-fullhp-threshold'] ?? 0.95;
      const normalShot = Math.max(1, directPerHit);
      const fullHpShot = normalShot * fullHpMult;
      const windowHp = target.hp * Math.max(0, 1 - threshold);
      // Shots that land above the threshold: enough 4x shots to clear the window,
      // never more than it takes to kill, at least one.
      const bonusShots = Math.max(1, Math.min(
        Math.ceil(windowHp / fullHpShot),
        Math.ceil(target.hp / fullHpShot),
      ));
      const shotsNoBonus = Math.max(1, Math.ceil(target.hp / normalShot));
      const remainingHp = Math.max(0, target.hp - bonusShots * fullHpShot);
      const shotsWithBonus = Math.max(1, bonusShots + Math.ceil(remainingHp / normalShot));
      const killSpeedup = shotsNoBonus / shotsWithBonus;
      directPerHit *= killSpeedup;
      notes.push(`sniper full-HP ${fullHpMult}x on top ${Math.round((1 - threshold) * 100)}% HP: ${bonusShots} bonus shot(s)/kill, +${Math.round((killSpeedup - 1) * 100)}% direct vs avg tier HP`);
    }
  } else if (archetype === 'summoner') {
    const baseCount = p['summoner.minion-count'] ?? 3;
    const countMult = p['summoner.minion-count-mult'] ?? 1;
    const countCap = p['summoner.minion-count-cap'];
    let count = Math.max(1, Math.floor(baseCount * countMult));
    if ((p['summoner.stone-sentinel'] ?? 0) > 0) count = Math.max(count, Math.round(p['summoner.stone-sentinel-count'] ?? 2));
    if (countCap && countCap > 0) count = Math.min(count, Math.floor(countCap));
    const minionMult = (p['summoner.minion-damage-pct'] ?? 1) * (p['summoner.minion-damage-mult'] ?? 1);
    const minionCd = Math.max(100, p['summoner.minion-attack-cooldown'] ?? 1000);
    let mult = 1;
    if ((p['summoner.swarm'] ?? 0) > 0) mult += count * (p['summoner.overwhelmed-pct-per-attacker'] ?? 0.1);
    const minionHit = directNoOnHit(stats.dealsDamage.attack * minionMult * mult, targetWithDebuffs, platingMult);
    directPerHit = 0;
    effectiveHitRate = count * (1000 / minionCd);
    classMechanicPerSec += minionHit * effectiveHitRate;
    notes.push(`${count} minions at ${(1000 / minionCd).toFixed(2)} APS each`);
  }

  const encounter = applyEncounterAverages(directPerHit, p, targetWithDebuffs);
  notes.push(...encounter.notes);
  directPerHit = encounter.directPerHit;
  weaponProcPerSec += encounter.weaponProcPerHit * effectiveHitRate;

  let directDps = directPerHit * effectiveHitRate;

  // shared.damage-mult is applied to ctx.damage in the live pipeline (combat.ts) before
  // the onHit event, so it boosts both the direct hit and any class mechanic that scales
  // from it. Apply it here, before the weapon-DoT conversion, so the converted reservoir
  // portion inherits the boost too. Standalone class DoT (dotPerSec) goes through a
  // separate live damage path and is intentionally left untouched.
  const sharedDamageMult = Math.max(0, p['shared.damage-mult'] ?? 0);
  if (sharedDamageMult > 0) {
    directDps *= 1 + sharedDamageMult;
    classMechanicPerSec *= 1 + sharedDamageMult;
    notes.push(`shared.damage-mult +${Math.round(sharedDamageMult * 100)}% applied to direct + class`);
  }

  const profile = weaponDotProfileForWeapon(weapon.id);
  if (profile) {
    const convertedDirect = directDps * profile.convPct;
    const convertedClass = Math.max(0, classMechanicPerSec) * profile.convPct;
    directDps -= convertedDirect;
    classMechanicPerSec -= convertedClass;
    const converted = convertedDirect + convertedClass;
    weaponProcPerSec += converted * profile.dotMultiplier;
    notes.push(`${profile.effectId} reservoir DoT from weapon profile`);
  }

  return {
    direct: directDps,
    classMechanic: classMechanicPerSec,
    dot: dotPerSec,
    weaponProc: weaponProcPerSec,
    notes,
  };
}

function buildRowsForTier(reportTier: number, comboOptions: BuildComboOptions = {}): ReportRow[] {
  const classTier = reportTier - 1;
  const target = targetDummyForTier(reportTier);
  const weapons = weaponsForTier(reportTier);
  const combos = buildCombosForTier(classTier, comboOptions);
  const rows: ReportRow[] = [];

  for (const combo of combos) {
    for (const weapon of weapons) {
      const plus = WEAPON_UPGRADE_LEVEL;
        const stats = makeStatsTarget(combo, weapon, plus, classTier);
        recalculatePlayerStats(stats);
        const estimate = estimateClassDamage(stats, target, weapon);
        const total = estimate.direct + estimate.classMechanic + estimate.dot + estimate.weaponProc;
        const buildKey = formatBuildCombo(combo, reportTier);
        rows.push({
          tier: reportTier,
          classId: combo.classId,
          className: combo.className,
          frameName: combo.frameName,
          rangeName: combo.rangeName,
          specName: combo.specName,
          buildKey,
          weaponId: weapon.id,
          weaponName: weapon.name,
          plus,
          total,
          ...estimate,
          attack: stats.dealsDamage.attack,
          onHitDamage: stats.dealsDamage.onHitDamage,
          attackCooldown: stats.performsAttack.attackCooldown,
          flag: '',
          combo,
        });
    }
  }

  const average = rows.reduce((sum, row) => sum + row.total, 0) / Math.max(1, rows.length);
  for (const row of rows) row.flag = outlierFlag(row.total, average);
  return rows;
}

function availableReportTiers(): number[] {
  return [...new Set([...ITEM_DATABASE.values()]
    .filter((item) =>
      item.slot === 'weapon' &&
      item.tier > 0 &&
      !TUTORIAL_WEAPON_IDS.has(item.id))
    .map((item) => item.tier))]
    .sort((a, b) => a - b);
}

function outlierFlag(value: number, average: number): OutlierFlag {
  if (average <= 0) return '';
  const ratio = value / average;
  if (ratio >= 2) return 'EXTREME_HIGH';
  if (ratio >= 1.5) return 'HIGH';
  if (ratio <= 0.5) return 'EXTREME_LOW';
  if (ratio <= 0.67) return 'LOW';
  return '';
}

function averageBy<T extends string>(
  rows: ReportRow[],
  keyFn: (row: ReportRow) => T,
): Array<{ key: T; avg: number; count: number }> {
  const buckets = new Map<T, { sum: number; count: number }>();
  for (const row of rows) {
    const key = keyFn(row);
    const bucket = buckets.get(key) ?? { sum: 0, count: 0 };
    bucket.sum += row.total;
    bucket.count++;
    buckets.set(key, bucket);
  }
  return [...buckets.entries()].map(([key, bucket]) => ({
    key,
    avg: bucket.sum / bucket.count,
    count: bucket.count,
  }));
}

function optimalRowsByBuild(rows: ReportRow[]): ReportRow[] {
  const bestByBuild = new Map<string, ReportRow>();
  for (const row of rows) {
    const current = bestByBuild.get(row.buildKey);
    if (!current || row.total > current.total) bestByBuild.set(row.buildKey, row);
  }
  return [...bestByBuild.values()].sort((a, b) =>
    a.classId.localeCompare(b.classId) ||
    a.frameName.localeCompare(b.frameName) ||
    a.rangeName.localeCompare(b.rangeName) ||
    a.specName.localeCompare(b.specName)
  );
}

function renderSummaryTable(items: Array<Record<string, string | number>>): string {
  if (items.length === 0) return '<p>No data.</p>';
  const headers = Object.keys(items[0]);
  return `<table><thead><tr>${headers.map((header) => `<th>${html(header)}</th>`).join('')}</tr></thead><tbody>${
    items.map((item) => `<tr>${headers.map((header) => `<td>${html(item[header])}</td>`).join('')}</tr>`).join('')
  }</tbody></table>`;
}

function renderClassAverageTable(rows: ReportRow[]): string {
  const classAverages = averageBy(rows, (row) => row.classId)
    .sort((a, b) => b.avg - a.avg);
  return `<table><thead><tr><th>Class</th><th>Avg DPS</th><th>Samples</th></tr></thead><tbody>${
    classAverages.map((item) => {
      const row = rows.find((candidate) => candidate.classId === item.key);
      return `<tr><td>${row ? classBadge(row.classId, row.className) : html(item.key)}</td><td>${asNumber(item.avg)}</td><td>${item.count}</td></tr>`;
    }).join('')
  }</tbody></table>`;
}

function renderWeaponPerformanceTable(rows: ReportRow[]): string {
  const weaponAverages = averageBy(rows, (row) => `${row.weaponName} +${row.plus}`)
    .sort((a, b) => b.avg - a.avg);
  const avg = weaponAverages.reduce((sum, item) => sum + item.avg, 0) / Math.max(1, weaponAverages.length);
  return `<table><thead><tr><th>Weapon</th><th>Avg DPS</th><th>Samples</th></tr></thead><tbody>${
    weaponAverages.map((item) => {
      const flag = outlierFlag(item.avg, avg);
      const tone = outlierTone(flag);
      return `<tr><td>${html(item.key)}</td><td class="${tone ? `dps-outlier ${tone}` : ''}">${asNumber(item.avg)}</td><td>${item.count}</td></tr>`;
    }).join('')
  }</tbody></table>`;
}

function renderOutlierTable(rows: ReportRow[]): string {
  if (rows.length === 0) return '<p>No outliers.</p>';
  return `<table><thead><tr><th>Flag</th><th>DPS</th><th>Class</th><th>Build</th><th>Weapon</th></tr></thead><tbody>${
    rows.map((row) => {
      const tone = outlierTone(row.flag);
      return `<tr>
        <td class="flag ${html(row.flag)}">${html(row.flag)}</td>
        <td class="dps-outlier ${tone}">${asNumber(row.total)}</td>
        <td>${classBadge(row.classId, row.className)}</td>
        <td>${html(row.buildKey)}</td>
        <td>${html(row.weaponName)} +${row.plus}</td>
      </tr>`;
    }).join('')
  }</tbody></table>`;
}

function buildDetailHeaders(reportTier: number): string {
  const headers = ['Class'];
  if (reportTier >= 2) headers.push('Frame');
  if (reportTier >= 3) headers.push('Range');
  if (reportTier >= 4) headers.push('Spec');
  return headers.map((header) => `<th>${header}</th>`).join('');
}

function buildDetailCells(row: ReportRow, reportTier: number): string {
  const cells = [classBadge(row.classId, row.className)];
  if (reportTier >= 2) cells.push(html(row.frameName));
  if (reportTier >= 3) cells.push(html(row.rangeName));
  if (reportTier >= 4) cells.push(html(row.specName));
  return cells.map((cell) => `<td>${cell}</td>`).join('');
}

function renderOptimalWeaponTable(rows: ReportRow[], reportTier: number): string {
  const bestRows = optimalRowsByBuild(rows);
  return `<table><thead><tr>${buildDetailHeaders(reportTier)}<th>Best Weapon</th><th>DPS</th><th>Direct</th><th>Class</th><th>DoT</th><th>Weapon/proc</th></tr></thead><tbody>${
    bestRows.map((row) => `<tr>
      ${buildDetailCells(row, reportTier)}
      <td>${html(row.weaponName)} +${row.plus}</td>
      <td>${asNumber(row.total)}</td>
      <td>${asNumber(row.direct)}</td>
      <td>${asNumber(row.classMechanic)}</td>
      <td>${asNumber(row.dot)}</td>
      <td>${asNumber(row.weaponProc)}</td>
    </tr>`).join('')
  }</tbody></table>`;
}

function estimateRowAgainstMonster(row: ReportRow, monster: MonsterDefinition): ReportRow {
  const weapon = ITEM_DATABASE.get(row.weaponId);
  if (!weapon) return row;
  const classTier = row.tier - 1;
  const stats = makeStatsTarget(row.combo, weapon, row.plus, classTier);
  recalculatePlayerStats(stats);
  const estimate = estimateClassDamage(stats, targetForMonster(monster), weapon);
  return {
    ...row,
    ...estimate,
    total: estimate.direct + estimate.classMechanic + estimate.dot + estimate.weaponProc,
    attack: stats.dealsDamage.attack,
    onHitDamage: stats.dealsDamage.onHitDamage,
    attackCooldown: stats.performsAttack.attackCooldown,
  };
}

function renderTtkExamples(reportTier: number, optimalRows: ReportRow[]): string {
  const monsters = representativeMonstersForTier(reportTier);
  if (monsters.length === 0 || optimalRows.length === 0) return '<p>No TTK examples available.</p>';
  return `<details>
    <summary>Time-to-kill examples against representative monsters</summary>
    <table>
      <thead>
        <tr><th>Mob Profile</th><th>Mob</th><th>Defenses</th><th>Build</th><th>Weapon</th><th>DPS vs Mob</th><th>TTK</th></tr>
      </thead>
      <tbody>
        ${monsters.map(({ role, monster }) => {
          return optimalRows.map((row) => {
            const estimated = estimateRowAgainstMonster(row, monster);
            const ttk = monster.stats.hp / Math.max(0.01, estimated.total);
            return `<tr>
              <td>${html(role)}</td>
              <td>${html(monster.name)}</td>
              <td>${html(monsterDefenseLabel(monster))}</td>
              <td>${html(row.buildKey)}</td>
              <td>${html(row.weaponName)} +${row.plus}</td>
              <td>${asNumber(estimated.total)}</td>
              <td>${asNumber(ttk)}s</td>
            </tr>`;
          }).join('');
        }).join('')}
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
    .flatMap(([, bucket]) => bucket.sort((a, b) => b.total - a.total));

  let lastClassId = '';
  return `<table>
    <thead>
      <tr>
        <th>DPS</th><th>Flag</th>${buildDetailHeaders(reportTier)}
        <th>Weapon</th><th>Direct</th><th>Class</th><th>DoT</th><th>Weapon/proc</th>
        <th>ATK</th><th>On-hit</th><th>CD ms</th><th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${ordered.map((row) => {
        const groupHeader = row.classId !== lastClassId
          ? (() => {
              lastClassId = row.classId;
              return `<tr class="class-group"><td colspan="${11 + Math.min(reportTier, 4)}">${classBadge(row.classId, row.className)}</td></tr>`;
            })()
          : '';
        const tone = outlierTone(row.flag);
        return `${groupHeader}
          <tr>
            <td class="${tone ? `dps-outlier ${tone}` : ''}">${asNumber(row.total)}</td>
            <td class="flag ${html(row.flag)}">${html(row.flag)}</td>
            ${buildDetailCells(row, reportTier)}
            <td>${html(row.weaponName)} +${row.plus}</td>
            <td>${asNumber(row.direct)}</td>
            <td>${asNumber(row.classMechanic)}</td>
            <td>${asNumber(row.dot)}</td>
            <td>${asNumber(row.weaponProc)}</td>
            <td>${asNumber(row.attack)}</td>
            <td>${asNumber(row.onHitDamage)}</td>
            <td>${asNumber(row.attackCooldown)}</td>
            <td>${html([...new Set(row.notes)].join('; '))}</td>
          </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

function renderTierSection(reportTier: number, rows: ReportRow[]): string {
  const classTier = reportTier - 1;
  const target = targetDummyForTier(reportTier);
  const optimalRows = optimalRowsByBuild(rows);
  const optimalAverage = optimalRows.reduce((sum, row) => sum + row.total, 0) / Math.max(1, optimalRows.length);
  const bestBuilds = averageBy(rows, (row) => row.buildKey)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);
  const worstBuilds = averageBy(rows, (row) => row.buildKey)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 10);
  const outliers = optimalRows
    .map((row) => ({ ...row, flag: outlierFlag(row.total, optimalAverage) }))
    .filter((row) => row.flag)
    .sort((a, b) => b.total - a.total)
    .slice(0, 30);

  const rowToBuild = (item: { key: string; avg: number; count: number }) => ({
    Build: item.key,
    'Avg DPS': asNumber(item.avg),
    Samples: item.count,
  });

  return `
    <section>
      <h2>T${reportTier}</h2>
      <p class="meta">
        ${rows.length} samples. Uses weapon tier ${reportTier}; class unlock tier ${classTier}.
        Target dummy from ${target.monsterCount} non-boss monsters in biome tier ${target.sourceTier}${target.usedFallback ? ' fallback' : ''}:
        HP ${asNumber(target.hp)}, plating ${asNumber(target.plating)}, DR ${asNumber(target.damageReduction * 100)}%.
      </p>
      <div class="grid">
        <div>
          <h3>Best Build/Spec Combinations</h3>
          ${renderSummaryTable(bestBuilds.map(rowToBuild))}
        </div>
        <div>
          <h3>Worst Build/Spec Combinations</h3>
          ${renderSummaryTable(worstBuilds.map(rowToBuild))}
        </div>
        <div>
          <h3>Average DPS Per Class</h3>
          ${renderClassAverageTable(rows)}
        </div>
        <div>
          <h3>Weapon Performance</h3>
          ${renderWeaponPerformanceTable(rows)}
        </div>
        <div>
          <h3>Outlier Flags</h3>
          ${renderOutlierTable(outliers)}
        </div>
      </div>
      <h3>Optimal DPS Weapon By Class Combination</h3>
      ${renderOptimalWeaponTable(rows, reportTier)}
      ${renderTtkExamples(reportTier, optimalRows)}
      <details>
        <summary>All samples</summary>
        ${renderAllSamplesTable(rows, reportTier)}
      </details>
    </section>
  `;
}

function md(value: unknown): string {
  return String(value)
    .replace(/\s+/g, ' ')
    .replaceAll('|', '\\|')
    .trim();
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

function statsForRow(row: ReportRow): PlayerStatsTarget {
  const weapon = ITEM_DATABASE.get(row.weaponId);
  if (!weapon) throw new Error(`Missing weapon: ${row.weaponId}`);
  const stats = makeStatsTarget(row.combo, weapon, row.plus, row.tier - 1);
  recalculatePlayerStats(stats);
  return stats;
}

function classPassiveSummary(passives: PassiveMap, archetype: Exclude<CombatArchetype, null>): string {
  const prefix = `${archetype}.`;
  const filtered = Object.fromEntries(
    Object.entries(passives).filter(([key, value]) =>
      Number.isFinite(value) &&
      value !== 0 &&
      (key.startsWith(prefix) || key.startsWith('shared.') || key === 'attackSpeedPct')),
  );
  return mapSummary(filtered, 12);
}

function mechanicFrequency(stats: PlayerStatsTarget): string {
  const p = stats.usesSkills.passives;
  const archetype = stats.usesSkills.combatArchetype;
  const baseHitRate = attackRate(stats, p);
  const hitRate = reloadCycleRate(stats, p, baseHitRate);
  if (archetype === 'cadence') {
    const threshold = Math.max(2, Math.round((p['cadence.empowered-threshold'] ?? 5) + (p['cadence.threshold-mod'] ?? 0)));
    return `finisher every ${threshold} hits (${asNumber(hitRate / threshold)}/s)`;
  }
  if (archetype === 'cooldown') {
    const cdSec = Math.max(0.1, (p['cooldown.empowered-cd-ms'] ?? 7000) / 1000);
    return `empowered every ${asNumber(cdSec)}s (${asNumber(1 / cdSec)}/s)`;
  }
  if (archetype === 'energy') {
    const maxEnergy = resolveEnergyMax(p, stats.playerTier ?? 0);
    const perHit = Math.max(1, Math.round(p['energy.per-hit'] ?? 14));
    if ((p['energy.flash'] ?? 0) > 0) {
      return `no discharge; +${asNumber(p['energy.flash-energy-per-hit'] ?? 5)} energy/hit toward shift`;
    }
    if ((p['energy.upkeep'] ?? 0) > 0) {
      return `no discharge; 1 Flow stack/${asNumber(p['energy.upkeep-stack-interval-ms'] ?? 1000)}ms while sustained`;
    }
    const accel = (p['energy.singularity-execute'] ?? 0) > 0
      ? Math.max(0, p['energy.singularity-gain-accel-scale'] ?? 0.5)
      : 0;
    const gainMult = (p['energy.critical-mass'] ?? 0) > 0
      ? 1 + Math.max(1, p['energy.critical-mass-max-stacks'] ?? 3) * Math.max(0, p['energy.critical-mass-gain-per-stack'] ?? 0.2)
      : 1;
    const normalHits = hitsToEnergyCap(maxEnergy, perHit, gainMult, accel);
    if ((p['energy.awakened-lightning'] ?? 0) > 0) {
      const strikes = Math.max(1, Math.round(p['energy.awakened-strike-count'] ?? 4));
      return `${strikes} empowered strikes every ${normalHits + strikes} total attacks`;
    }
    if ((p['energy.overdrive'] ?? 0) > 0) {
      const activeSec = maxEnergy / Math.max(0.01, p['energy.overdrive-decay-per-sec'] ?? 18);
      return `Overdrive after ${normalHits} builders; active ${asNumber(activeSec)}s`;
    }
    return `discharge every ${normalHits + 1} hits (${asNumber(hitRate / (normalHits + 1))}/s)`;
  }
  if (archetype === 'dot') {
    const profile = resolveDotClassProfile(p, stats.usesSkills.selectedSubVariant);
    if ((p['dot.poison-explosion'] ?? 0) > 0) {
      return `detonation every ${Math.max(1, Math.round(p['dot.poison-explosion-max-stacks'] ?? 10))} hits`;
    }
    if ((p['dot.freezing-cold'] ?? 0) > 0) {
      return `freeze every ${Math.max(1, Math.round(p['dot.chill-max-stacks'] ?? 9))} chill hits for ${asNumber((p['dot.freeze-duration-ms'] ?? 2000) / 1000)}s`;
    }
    return `DoT cap ${profile.maxStacks} stacks, tick ${asNumber(profile.tickIntervalMs)}ms`;
  }
  if (archetype === 'reload') {
    if ((p['reload.laser'] ?? 0) > 0) return 'laser heat/cool duty cycle';
    const ammo = Math.max(1, Math.round(p['reload.max-ammo'] ?? 10));
    const reloadMs = Math.max(100, Math.round(p['reload.reload-time-ms'] ?? 1600));
    return `${ammo} shots, ${asNumber(reloadMs)}ms reload, ${asNumber(hitRate)} effective shots/s`;
  }
  if (archetype === 'summoner') {
    const baseCount = p['summoner.minion-count'] ?? 3;
    const countMult = p['summoner.minion-count-mult'] ?? 1;
    const countCap = p['summoner.minion-count-cap'];
    let count = Math.max(1, Math.floor(baseCount * countMult));
    if ((p['summoner.stone-sentinel'] ?? 0) > 0) count = Math.max(count, Math.round(p['summoner.stone-sentinel-count'] ?? 2));
    if (countCap && countCap > 0) count = Math.min(count, Math.floor(countCap));
    const minionCd = Math.max(100, p['summoner.minion-attack-cooldown'] ?? 1000);
    return `${count} minions at ${asNumber(1000 / minionCd)} APS each`;
  }
  return `${asNumber(hitRate)} hits/s`;
}

function formulaLabel(row: ReportRow): string {
  const notes = [...new Set(row.notes)].slice(0, 3).join('; ');
  return notes || `${row.combo.archetype} steady-state hit estimate`;
}

function rowBuildSummary(row: ReportRow): Array<string | number> {
  return [
    row.buildKey,
    `${row.weaponName} +${row.plus}`,
    asNumber(row.total),
    asNumber(row.direct),
    asNumber(row.classMechanic),
    asNumber(row.dot),
    asNumber(row.weaponProc),
    row.flag || '-',
  ];
}

function bestWeaponByBuildRows(rows: ReportRow[]): ReportRow[] {
  return optimalRowsByBuild(rows).sort((a, b) => b.total - a.total);
}

function classWeaponExtremes(rows: ReportRow[], direction: 'best' | 'worst'): Array<Array<string | number>> {
  const classIds = [...new Set(rows.map((row) => row.classId))].sort();
  return classIds.map((classId) => {
    const classRows = rows.filter((row) => row.classId === classId);
    const row = classRows[0];
    const weapons = averageBy(classRows, (candidate) => candidate.weaponName)
      .sort((a, b) => direction === 'best' ? b.avg - a.avg : a.avg - b.avg);
    const winner = weapons[0];
    return [
      row ? row.className : classId,
      winner?.key ?? '-',
      winner ? asNumber(winner.avg) : '-',
      winner?.count ?? 0,
    ];
  });
}

function averageWeaponDpsAgainstTarget(reportTier: number, weapon: ItemDefinition, target: TargetDummy): number {
  const classTier = reportTier - 1;
  const combos = buildCombosForTier(classTier);
  let total = 0;
  let count = 0;
  for (const combo of combos) {
    const stats = makeStatsTarget(combo, weapon, WEAPON_UPGRADE_LEVEL, classTier);
    recalculatePlayerStats(stats);
    const estimate = estimateClassDamage(stats, target, weapon);
    total += estimate.direct + estimate.classMechanic + estimate.dot + estimate.weaponProc;
    count++;
  }
  return total / Math.max(1, count);
}

function weaponTargetShapeRows(reportTier: number): Array<Array<string | number>> {
  const shapes = targetShapeChecks(reportTier);
  return weaponsForTier(reportTier).map((weapon) => [
    `${weapon.name} +${WEAPON_UPGRADE_LEVEL}`,
    ...shapes.map(({ target }) => asNumber(averageWeaponDpsAgainstTarget(reportTier, weapon, target))),
    shapes.map(({ label, source }) => `${label}: ${source}`).join('; '),
  ]);
}

function suspectedSource(row: ReportRow): string {
  const parts = [
    ['direct', row.direct],
    ['class mechanic', row.classMechanic],
    ['DoT', row.dot],
    ['weapon/proc', row.weaponProc],
  ] as const;
  const [largest] = parts.sort((a, b) => b[1] - a[1]);
  const notes = [...new Set(row.notes)].slice(0, 2).join('; ');
  return `${largest[0]} share${notes ? `; ${notes}` : ''}`;
}

type DangerousAssumption =
  | 'high uptime assumed'
  | 'execute averaged'
  | 'incoming damage not modeled'
  | 'AoE treated as single-target'
  | 'infinite/stack cap approximation';

function shortText(value: string | undefined, max = 180): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text || '-';
  return `${text.slice(0, Math.max(0, max - 1)).trim()}...`;
}

function t4SubclassNodes(): SkillNode[] {
  return [...SKILL_TREE.values()]
    .filter((node) =>
      node.tier === 3 &&
      !(OPTIONS.excludeConduit && node.classId === CONDUIT_CLASS_ID))
    .sort((a, b) =>
      a.classId.localeCompare(b.classId) ||
      String(a.subVariantId).localeCompare(String(b.subVariantId)) ||
      a.name.localeCompare(b.name));
}

function rowSubclassNode(row: ReportRow): SkillNode | undefined {
  return row.combo.specId ? skillById(row.combo.specId) : undefined;
}

function subclassRows(rows: ReportRow[], node: SkillNode): ReportRow[] {
  return rows.filter((row) => row.combo.specId === node.id);
}

function dangerousAssumptionsFromText(text: string): DangerousAssumption[] {
  const lower = text.toLowerCase();
  const flags: DangerousAssumption[] = [];
  if (/(high uptime|steady|steady-state|uptime|duty cycle|amortized|estimated)/.test(lower)) {
    flags.push('high uptime assumed');
  }
  if (/execute averaged/.test(lower)) {
    flags.push('execute averaged');
  }
  if (/(incoming damage is not modeled|vengeance|damage taken)/.test(lower)) {
    flags.push('incoming damage not modeled');
  }
  if (/(aoe|splash|area|nearby|blast|storm|volley|echo|beam|multi-target|conflagration|single-target volley)/.test(lower)) {
    flags.push('AoE treated as single-target');
  }
  if (/(capped|cap |max stacks|max-stack|steady stacks|stack cap|reservoir|momentum|max-ammo|death mark|eternal doom|frostbite)/.test(lower)) {
    flags.push('infinite/stack cap approximation');
  }
  return [...new Set(flags)];
}

function dangerousAssumptionSummary(node: SkillNode | undefined, rows: ReportRow[] = []): string {
  const text = [
    node?.description ?? '',
    mapSummary(node?.mechanicEffects, 20),
    ...rows.flatMap((row) => row.notes),
  ].join(' ');
  const flags = dangerousAssumptionsFromText(text);
  return flags.join(', ') || '-';
}

function reportFormulaForSubclass(node: SkillNode, rows: ReportRow[]): string {
  const best = rows.slice().sort((a, b) => b.total - a.total)[0];
  const archetype = archetypeForClassId(node.classId);
  const rootFormula =
    archetype === 'cadence' ? 'cycle average of normal hits plus empowered finisher over threshold' :
    archetype === 'cooldown' ? 'execution DPS = execution hit / cooldown; replacement paths override direct hit model' :
    archetype === 'dot' ? 'DoT DPS = computeScaledDotDamage(max stacks) / tick interval; direct reduced by conversion pct' :
    archetype === 'energy' ? 'cycle average over energy charge hits plus empowered discharge' :
    archetype === 'reload' ? 'effective shots/s = ammo / (shot time + reload time); spec branches override as needed' :
    archetype === 'summoner' ? 'minion count * minion APS * inherited attack; minion survival/pathing omitted' :
    'steady-state hit estimate';
  const notes = best ? formulaLabel(best) : '';
  return notes && !notes.includes('steady-state hit estimate')
    ? `${rootFormula}; ${notes}`
    : rootFormula;
}

function subclassNodeRowsForPacket(rows: ReportRow[]): Array<Array<string | number>> {
  return t4SubclassNodes().map((node) => {
    const rowsForNode = subclassRows(rows, node);
    const best = rowsForNode.slice().sort((a, b) => b.total - a.total)[0];
    return [
      skill(node.classId).name,
      String(node.subVariantId ?? '-'),
      node.name,
      node.id,
      shortText(node.description, 220),
      mapSummary(node.statEffects, 8),
      mapSummary(node.mechanicEffects, 14),
      reportFormulaForSubclass(node, rowsForNode),
      dangerousAssumptionSummary(node, best ? [best] : []),
    ];
  });
}

function bestWorstWeaponRowsBySubclass(rows: ReportRow[]): Array<Array<string | number>> {
  return t4SubclassNodes().flatMap((node) => {
    const rowsForNode = subclassRows(rows, node);
    const weaponAverages = averageBy(rowsForNode, (row) => row.weaponName)
      .sort((a, b) => b.avg - a.avg);
    const best = weaponAverages[0];
    const worst = weaponAverages[weaponAverages.length - 1];
    return [
      [
        skill(node.classId).name,
        node.name,
        'best',
        best?.key ?? '-',
        best ? asNumber(best.avg) : '-',
        best?.count ?? 0,
      ],
      [
        skill(node.classId).name,
        node.name,
        'worst',
        worst?.key ?? '-',
        worst ? asNumber(worst.avg) : '-',
        worst?.count ?? 0,
      ],
    ];
  });
}

function groupedTopBottomSubclassRows(rows: ReportRow[]): Array<Array<string | number>> {
  const optimalRows = bestWeaponByBuildRows(rows);
  const optimalAverage = optimalRows.reduce((sum, row) => sum + row.total, 0) / Math.max(1, optimalRows.length);
  const flagged = optimalRows.map((row) => ({ ...row, flag: outlierFlag(row.total, optimalAverage) }));
  const classIds = [...new Set(flagged.map((row) => row.classId))].sort();
  const packetRows: Array<Array<string | number>> = [];
  for (const classId of classIds) {
    const classRows = flagged.filter((row) => row.classId === classId);
    const top = classRows.slice().sort((a, b) => b.total - a.total).slice(0, 5);
    const bottom = classRows.slice().sort((a, b) => a.total - b.total).slice(0, 5);
    for (const [kind, selected] of [['top', top], ['bottom', bottom]] as const) {
      for (const row of selected) {
        packetRows.push([
          row.className,
          kind,
          row.buildKey,
          `${row.weaponName} +${row.plus}`,
          asNumber(row.total),
          asNumber(row.direct),
          asNumber(row.classMechanic),
          asNumber(row.dot),
          asNumber(row.weaponProc),
          row.flag || '-',
          dangerousAssumptionSummary(rowSubclassNode(row), [row]),
        ]);
      }
    }
  }
  return packetRows;
}

function renderT4SubclassMechanicsPacket(rows: ReportRow[]): string {
  const target = targetDummyForTier(4);
  return `# MMO Idle T4 Subclass Mechanics Packet${OPTIONS.excludeConduit ? ' (No Conduit)' : ''}

Generated from \`tools/dps-report.ts --t4-subclass-mechanics\`. This packet is meant for external LLM balance review and omits the full HTML report.

## Scope And Assumptions

- Report tier: T4; class unlock tier: 3; weapons: T4 at +${WEAPON_UPGRADE_LEVEL}.
- Row set uses the HTML report's compact T4 rule: only the mid/balanced range node is included for each frame/path, avoiding close/far duplicate rows.
- Target baseline: ${target.monsterCount} mobs from biome tier ${target.sourceTier}${target.usedFallback ? ' fallback' : ''}; HP ${asNumber(target.hp)}, plating ${asNumber(target.plating)}, DR ${asNumber(target.damageReduction * 100)}%.
- Single-target theoretical steady-state only. Movement, sustain, enemy attacks, death, pathing, aggro, party effects, eHP, and real AoE target count are omitted.
- Dangerous-assumption flags are generated from subclass text and report formula notes. Treat them as review prompts, not final verdicts.

## Known Missing Context

- AoE and splash value are not modeled; they are treated as single-target unless the formula explicitly says otherwise.
- Uptime is often steady-state or averaged, especially buffs, cooldown windows, max-stack mechanics, reservoirs, and heat/cool cycles.
- Incoming damage is not modeled, so vengeance-like or defensive feedback loops use floors or are effectively ignored.
- Overkill, execute timing, target swapping, enemy count, and encounter length are approximated or amortized.
- Stack caps and infinite-fight assumptions can overstate classes that need ramp time or understate classes that burst early.

## T4 Subclass Nodes / Mechanics / Report Formula

${mdTable(
  ['Class', 'Frame', 'Subclass', 'Node', 'Intended identity', 'Stat effects', 'Mechanic effects', 'Report formula approximation', 'Danger flags'],
  subclassNodeRowsForPacket(rows),
)}

## Best / Worst Weapon Per Subclass

${mdTable(
  ['Class', 'Subclass', 'Kind', 'Weapon', 'Avg DPS', 'Samples'],
  bestWorstWeaponRowsBySubclass(rows),
)}

## Top / Bottom Subclass Rows Grouped By Root Class

${mdTable(
  ['Class', 'Group', 'Build', 'Weapon', 'DPS', 'Direct', 'Class', 'DoT', 'Weapon/proc', 'Outlier', 'Danger flags'],
  groupedTopBottomSubclassRows(rows),
)}
`;
}

async function writeT4SubclassMechanicsPacket(): Promise<void> {
  const rows = buildRowsForTier(4, { tier4MidOnly: true });
  const suffix = OPTIONS.excludeConduit ? '-no-conduit' : '';
  const outPath = path.join(REPO_ROOT, 'reports', `t4-subclass-mechanics-packet${suffix}.md`);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, renderT4SubclassMechanicsPacket(rows), 'utf8');
  console.log(`Wrote ${outPath}`);
}

function renderLlmPacket(reportTier: number, rows: ReportRow[]): string {
  const target = targetDummyForTier(reportTier);
  const optimalRowsRaw = bestWeaponByBuildRows(rows);
  const optimalAverage = optimalRowsRaw.reduce((sum, row) => sum + row.total, 0) / Math.max(1, optimalRowsRaw.length);
  const optimalRows = optimalRowsRaw
    .map((row) => ({ ...row, flag: outlierFlag(row.total, optimalAverage) }));
  const outliers = optimalRows
    .filter((row) => row.flag)
    .sort((a, b) => b.total - a.total);
  const representative = representativeMonstersForTier(reportTier);
  const expectedLow = optimalAverage * 0.67;
  const expectedHigh = optimalAverage * 1.5;
  const targetTtk = target.hp / Math.max(0.01, optimalAverage);

  const classInputRows = optimalRows.slice()
    .sort((a, b) => a.buildKey.localeCompare(b.buildKey))
    .map((row) => {
      const stats = statsForRow(row);
      const hitRate = reloadCycleRate(stats, stats.usesSkills.passives, attackRate(stats, stats.usesSkills.passives));
      return [
        row.buildKey,
        `${row.weaponName} +${row.plus}`,
        asNumber(stats.dealsDamage.attack),
        asNumber(stats.dealsDamage.onHitDamage),
        asNumber(hitRate),
        asNumber(stats.performsAttack.attackCooldown),
        asNumber(stats.performsAttack.attackRange),
        asNumber(stats.hasHealth.maxHp),
        asNumber(stats.mitigatesDamage.plating),
        `${asNumber(stats.mitigatesDamage.damageReduction * 100)}%`,
        classPassiveSummary(stats.usesSkills.passives, row.combo.archetype),
        mechanicFrequency(stats),
        formulaLabel(row),
      ];
    });

  const weaponInputRows = weaponsForTier(reportTier).flatMap((weapon) =>
    [0, WEAPON_UPGRADE_LEVEL].map((plus) => {
      const clampedPlus = Math.min(plus, getMaxUpgrade(weapon));
      const stats = mergedNumberMaps(weapon.statModifiers, upgradeStatBonusTotal(weapon, clampedPlus));
      const effects = mergedNumberMaps(weapon.mechanicEffects, upgradeMechanicEffectsTotal(weapon, clampedPlus));
      const profile = weaponDotProfileForWeapon(weapon.id);
      const formulas = [
        weapon.attacksPerSecond ? `${asNumber(weapon.attacksPerSecond)} APS base` : '',
        profile ? `${profile.effectId} DoT reservoir ${asNumber(profile.convPct * 100)}% conversion x${asNumber(profile.dotMultiplier)}` : '',
      ].filter(Boolean).join('; ') || '-';
      return [
        weapon.name,
        `+${clampedPlus}`,
        mapSummary(stats, 8),
        mapSummary(effects, 8),
        formulas,
        weapon.upgrades ? `explicit steps ${clampedPlus}/${getMaxUpgrade(weapon)}` : `generic fallback upgrade ${clampedPlus}/${getMaxUpgrade(weapon)}`,
      ];
    }));

  const classAverages = averageBy(rows, (row) => row.className).sort((a, b) => b.avg - a.avg);
  const weaponAverages = averageBy(rows, (row) => row.weaponName).sort((a, b) => b.avg - a.avg);
  const shapeChecks = targetShapeChecks(reportTier);
  const caveatNotes = [...new Set(rows.flatMap((row) => row.notes))].sort();
  const modeledMechanics = ['Cadence', 'cooldown', 'energy', 'reload', 'DoT'];
  if (!OPTIONS.excludeConduit) modeledMechanics.push('summoner');

  return `# MMO Idle LLM Balance Packet - T${reportTier}${OPTIONS.excludeConduit ? ' (No Conduit)' : ''}

Generated from \`tools/dps-report.ts\`. This packet is Markdown only; it intentionally omits the full HTML report.

## 1. Assumptions / Omissions

- Report tier T${reportTier}; class unlock tier ${reportTier - 1}; weapons are tier ${reportTier}.
- DPS conclusions use +${WEAPON_UPGRADE_LEVEL} weapons only. Weapon input context includes +0 and +${WEAPON_UPGRADE_LEVEL}.
- Target mobs come from biome spawn pools one tier below report tier; tutorial/test/interact/boss monsters are excluded.
- When the shifted target tier contains only tutorial/test content, the packet falls back to the first real non-tutorial biome tier.
- Single-target theoretical steady-state only: no movement, enemy attacks, deaths, sustain, AoE value, pathing, aggro, party effects, or eHP.
- Outliers/top/bottom use each class combination's optimal +${WEAPON_UPGRADE_LEVEL} weapon. Class/weapon averages use all +${WEAPON_UPGRADE_LEVEL} weapon samples.

## 2. Target Monster Baseline

| Metric | Value |
| --- | --- |
| Source | biome tier ${target.sourceTier}${target.usedFallback ? ' fallback' : ''} |
| Mob count | ${target.monsterCount} |
| Average mob HP | ${asNumber(target.hp)} |
| Average plating | ${asNumber(target.plating)} |
| Average DR | ${asNumber(target.damageReduction * 100)}% |
| Reference optimal-build average DPS | ${asNumber(optimalAverage)} |
| Target TTK at reference DPS | ${asNumber(targetTtk)}s |
| Expected DPS band | ${asNumber(expectedLow)} - ${asNumber(expectedHigh)} |

${mdTable(
  ['Profile', 'Monster', 'HP', 'Plating', 'DR', 'Defensive notes'],
  representative.map(({ role, monster }) => [
    role,
    monster.name,
    asNumber(monster.stats.hp),
    asNumber(monster.stats.plating),
    `${asNumber(monster.stats.damageReduction * 100)}%`,
    monsterDefenseLabel(monster),
  ]),
)}

## 3. Class / Spec Input Table

${mdTable(
  ['Build', 'Optimal Weapon', 'ATK', 'On-hit', 'APS', 'CD ms', 'Range', 'HP', 'Plating', 'DR', 'Class passives', 'Mechanic frequency', 'Formula notes'],
  classInputRows,
)}

## 4. Weapon Input Table (+0 and +${WEAPON_UPGRADE_LEVEL})

${mdTable(
  ['Weapon', 'Plus', 'Stats', 'Effects', 'Formulas', 'Scaling notes'],
  weaponInputRows,
)}

## 5. Top / Bottom Builds And Outliers

Top 10 builds:

${mdTable(['Build', 'Weapon', 'DPS', 'Direct', 'Class', 'DoT', 'Weapon/proc', 'Flag'], optimalRows.slice(0, 10).map(rowBuildSummary))}

Bottom 10 builds:

${mdTable(['Build', 'Weapon', 'DPS', 'Direct', 'Class', 'DoT', 'Weapon/proc', 'Flag'], optimalRows.slice().sort((a, b) => a.total - b.total).slice(0, 10).map(rowBuildSummary))}

All optimal-weapon outliers:

${mdTable(['Build', 'Weapon', 'DPS', 'Direct', 'Class', 'DoT', 'Weapon/proc', 'Flag'], outliers.map(rowBuildSummary))}

## 6. Average DPS Per Class

${mdTable(['Class', 'Avg DPS', 'Samples'], classAverages.map((item) => [item.key, asNumber(item.avg), item.count]))}

## 7. Average DPS Per Weapon

${mdTable(['Weapon', 'Avg DPS', 'Samples'], weaponAverages.map((item) => [item.key, asNumber(item.avg), item.count]))}

Weapon DPS against target shapes:

${mdTable(
  ['Weapon', ...shapeChecks.map((shape) => shape.label), 'Shape sources'],
  weaponTargetShapeRows(reportTier),
)}

## 8. Best Weapon Per Class

${mdTable(['Class', 'Weapon', 'Avg DPS', 'Samples'], classWeaponExtremes(rows, 'best'))}

## 9. Worst Weapon Per Class

${mdTable(['Class', 'Weapon', 'Avg DPS', 'Samples'], classWeaponExtremes(rows, 'worst'))}

## 10. Outlier Detail

${mdTable(
  ['Flag', 'Build', 'Weapon', 'DPS', 'Direct', 'Class', 'DoT', 'Weapon/proc', 'Suspected source'],
  outliers.map((row) => [
    row.flag,
    row.buildKey,
    `${row.weaponName} +${row.plus}`,
    asNumber(row.total),
    asNumber(row.direct),
    asNumber(row.classMechanic),
    asNumber(row.dot),
    asNumber(row.weaponProc),
    suspectedSource(row),
  ]),
)}

## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared \`estimatePlayerHitDamage\`; stats are rebuilt through shared \`recalculatePlayerStats\`.
- ${modeledMechanics.join(', ')}, weapon debuffs, and weapon DoT reservoirs are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: ${caveatNotes.length ? caveatNotes.map((note) => `\`${md(note)}\``).join(', ') : 'none'}.
`;
}

async function writeLlmPacket(): Promise<void> {
  const tiers = availableReportTiers();
  const selectedTiers = OPTIONS.tier ? [OPTIONS.tier] : tiers;
  for (const tier of selectedTiers) {
    if (!tiers.includes(tier)) {
      throw new Error(`Use --llm-packet with --tier=<${tiers.join('|')}>`);
    }
    const rows = buildRowsForTier(tier);
    const suffix = OPTIONS.excludeConduit ? '-no-conduit' : '';
    const outPath = path.join(REPO_ROOT, 'reports', `dps-llm-packet-t${tier}${suffix}.md`);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, renderLlmPacket(tier, rows), 'utf8');
    console.log(`Wrote ${outPath}`);
  }
}

function skillById(id: string): SkillNode | undefined {
  return SKILL_TREE.get(id);
}

function nonSummonerRoots(): SkillNode[] {
  return NON_SUMMONER_CLASS_IDS
    .map((id) => skillById(id))
    .filter((node): node is SkillNode => Boolean(node));
}

function frameRowsForMechanics(): Array<Array<string | number>> {
  return [...SKILL_TREE.values()]
    .filter((node) =>
      node.tier === 1 &&
      Boolean(node.subVariantId) &&
      NON_SUMMONER_CLASS_IDS.includes(node.classId as typeof NON_SUMMONER_CLASS_IDS[number]))
    .sort((a, b) => a.classId.localeCompare(b.classId) || String(a.subVariantId).localeCompare(String(b.subVariantId)))
    .map((node) => [
      skill(node.classId).name,
      node.name,
      String(node.subVariantId),
      mapSummary(node.statEffects),
      mapSummary(node.mechanicEffects),
      md(node.description ?? ''),
    ]);
}

function rangeRowsForMechanics(): Array<Array<string | number>> {
  return [...SKILL_TREE.values()]
    .filter((node) =>
      node.tier === 2 &&
      NON_SUMMONER_CLASS_IDS.includes(node.classId as typeof NON_SUMMONER_CLASS_IDS[number]) &&
      (node.id.endsWith('-range-close') || node.id.endsWith('-range-far')))
    .sort((a, b) => a.classId.localeCompare(b.classId) || a.id.localeCompare(b.id))
    .map((node) => [
      skill(node.classId).name,
      node.name,
      node.id.endsWith('-range-close') ? 'close' : 'far',
      mapSummary(node.statEffects),
      mapSummary(node.mechanicEffects),
      md(node.description ?? ''),
    ]);
}

function specRowsForMechanics(): Array<Array<string | number>> {
  return [...SKILL_TREE.values()]
    .filter((node) =>
      node.tier === 3 &&
      NON_SUMMONER_CLASS_IDS.includes(node.classId as typeof NON_SUMMONER_CLASS_IDS[number]))
    .sort((a, b) =>
      a.classId.localeCompare(b.classId) ||
      String(a.subVariantId).localeCompare(String(b.subVariantId)) ||
      a.name.localeCompare(b.name))
    .map((node) => [
      skill(node.classId).name,
      String(node.subVariantId ?? '-'),
      node.name,
      mapSummary(node.statEffects),
      mapSummary(node.mechanicEffects),
      md(node.description ?? ''),
    ]);
}

function rootRowsForMechanics(): Array<Array<string | number>> {
  return nonSummonerRoots().map((node) => [
    node.name,
    archetypeForClassId(node.id),
    mapSummary(node.statEffects),
    mapSummary(node.mechanicEffects),
    md(node.description ?? ''),
  ]);
}

function classMechanicFormulaRows(): Array<Array<string | number>> {
  return [
    [
      'Striker',
      'Cadence',
      'Empowered finisher after threshold normal hits. Threshold = max(2, cadence.empowered-threshold + cadence.threshold-mod).',
      'Final empowered multiplier = (cadence.empowered-mult + cadence.damage-mult-add + shared.empowered-mult-add) * (1 + weapon.empowered-mult-bonus). Chaotic miss preserves the queued empowered hit.',
      'Cycle estimate: threshold - 1 normal hits, then empowered hit. Frequency ~= hitRate / threshold.',
    ],
    [
      'Squire',
      'Cooldown',
      'Execution arms on cooldown. Base cooldown from cooldown.empowered-cd-ms.',
      'Final empowered multiplier = (cooldown.empowered-mult + shared.empowered-mult-add) * (1 + weapon.empowered-mult-bonus).',
      'Frequency = 1 / (cooldown.empowered-cd-ms / 1000).',
    ],
    [
      'Apprentice',
      'DoT',
      'Each hit converts a profile percentage of attack into a stack budget. Direct hit is reduced by conversion pct except bypass specs.',
      'Damage per stack = computeDotClassDamagePerStack(attack, resolveDotClassProfile(passives, selectedSubVariant)); tick DPS = computeScaledDotDamage(stacks) / tickInterval.',
      'Stacks assumed at max steady-state in the report.',
    ],
    [
      'Spirit',
      'Energy',
      'Normal non-empowered hits gain energy.per-hit. On reaching energyMax, energy resets to 0 and the next real hit is empowered.',
      'Energy max = 100, plus energy.max-bonus * max(1, playerTier - 4 + 1) for Voidwalker-style scaling. Discharge multiplier uses energy.empowered-mult plus shared/weapon empowered bonuses.',
      'Normal hits to charge = ceil(energyMax / energy.per-hit); full cycle = normalHits + 1 empowered hit. Seconds depend on final hit rate.',
    ],
    [
      'Slinger',
      'Reload',
      'Magazine drains per shot; empty clip starts reload. max ammo and reload time come from frame/spec passives.',
      'After skill/equipment stats: normal reload attack = floor(attack * 0.65), then attack cooldown *= 0.5. Sniper and laser skip the 0.65 damage layer and double-speed layer.',
      'Effective shot rate = ammo / (ammo / baseHitRate + reloadSeconds), except blunderbuss report estimate treats the clip as a single-target volley.',
    ],
  ];
}

function renderClassMechanicsPacket(): string {
  return `# MMO Idle Class Mechanics Packet

Generated from \`SKILL_TREE\`, shared stat rebuild rules, and the report's formula helpers. Summoner/Conduit is intentionally omitted for this balance pass.

## Stat Pipeline

- Base stats reset from \`GAME_CONFIG\`, then equipped weapon APS sets base attack cooldown when present.
- Skill stat effects apply additively. \`attackSpeedPct\` sources sum, then cooldown becomes \`round(cooldown / max(0.1, 1 + attackSpeedPct))\`, floored to 200 ms before reload-specific layers.
- Equipment stats and item upgrade stats apply after skill stats. Mechanic effects merge into \`usesSkills.passives\`.
- Close range gets its authored range node plus class-specific close bonus from the stat pipeline: Squire +5 plating/+1 hpRegen, Apprentice +4/+2, Striker +3/+3, Slinger +2/+4, Spirit +1/+5.
- \`shared.damage-mult\` matches the live pipeline (combat.ts): direct DPS and class-mechanic DPS are multiplied by \`1 + shared.damage-mult\` (applied before weapon-DoT conversion so the converted reservoir inherits it). Standalone class DoT is unaffected, mirroring the separate live DoT path.
- Empowered multiplier formula: \`effective = (archetypeBase + archetypeAdd + shared.empowered-mult-add) * (1 + weapon.empowered-mult-bonus)\`, then \`ctx.damage = floor(ctx.damage * effective)\`.

## Root / Base Stat Bonuses

${mdTable(['Class', 'Archetype', 'Root stat effects', 'Root passive effects', 'Design text'], rootRowsForMechanics())}

## Frame Modifiers

${mdTable(['Class', 'Frame', 'Subvariant', 'Stat effects', 'Passive effects', 'Design text'], frameRowsForMechanics())}

## Close / Far Modifiers

${mdTable(['Class', 'Range', 'Kind', 'Stat effects', 'Passive effects', 'Design text'], rangeRowsForMechanics())}

## Path / Spec Modifiers

${mdTable(['Class', 'Frame', 'Spec', 'Stat effects', 'Passive effects', 'Design text'], specRowsForMechanics())}

## Class Mechanic Formulas

${mdTable(['Class', 'Mechanic', 'Passive formulas', 'Final damage multipliers', 'Mechanic frequency rule'], classMechanicFormulaRows())}

## Reload Exact Notes

- Root Slinger stats: attack +18, maxHp +24, attackSpeedPct +0.20, attackRange +120, evasion +0.25, speed +15.
- Frame magazine/reload bases: Scout 5 ammo / 1200 ms reload; Marksman 10 ammo / 2000 ms reload; Artillerist 20 ammo / 3000 ms reload.
- Generic reload stat layer in \`recalculatePlayerStats\`: after normal stat rebuild, if not Sniper and not Laser, \`attack = max(1, floor(attack * 0.65))\`; if not Sniper, \`attackCooldown = max(200, round(attackCooldown * 0.5))\`; Gatling halves cooldown again with a 100 ms floor.
- Sniper: \`attack += round(attack * attackSpeedPct * (reload.snipe-as-to-dmg ?? 0.5))\`, then cooldown hard-sets to \`reload.snipe-cadence-ms ?? 2000\`; it ignores weapon APS, attack-speed cooldown scaling, and reload double-speed.
- Laser: keeps full attack and does not use normal hit rate in the report; report estimates heat/cool duty cycle using \`laser-heat-per-tick\`, \`laser-cool-per-tick\`, and \`laser-damage-per-tick-pct\`.
- Plating compensation/bypass: live reload \`beforeAttack\` sets \`ctx.platingMult = 0.5\`; damage formula receives effective target plating multiplied by 0.5. The report mirrors this with \`platingMult = 0.5\` for reload.
- Reload time: \`reload.reload-time-ms ?? 1600\`, multiplied by \`reload.reload-time-mult\` when present, minimum 100 ms. Momentum reduces reload time by \`1 - stacks * reload.momentum-reload-reduction\`, floored by the runtime constant.

## Energy Exact Notes

- Root Spirit stats: attack +11, maxHp +10, attackSpeedPct +0.25, attackRange +130, speed +15.
- Frame energy rules: Spark gains 20 energy/hit and has 1.5x empowered; Wraith gains 14 energy/hit and has 2.0x empowered; Phantasm gains 10 energy/hit and has 6.0x empowered.
- Energy has no special hidden APS bonus beyond normal \`attackSpeedPct\` stat effects from root/frame/range/spec. Attack-speed stats feed the shared cooldown formula above.
- Energy max defaults to 100. If \`energy.max-bonus\` exists, \`energyMax = 100 + round(energy.max-bonus * max(1, playerTier - 4 + 1))\`.
- After a non-empowered hit, if no T3 handler consumed the event, energy gains \`round(energy.per-hit ?? 14)\`. Empowered hits do not generate energy.
- When energy reaches max, energy resets to 0 and the next real hit is empowered. Therefore discharge timing is hit-count based, not seconds-based: \`normalHits = ceil(energyMax / energy.per-hit)\`, then the next hit discharges. Seconds = \`(normalHits + 1) / finalHitsPerSecond\`.
- Discharge damage is an empowered hit using \`energy.empowered-mult\`, plus shared/weapon empowered multiplier modifiers. T3 specs may replace or augment this with their own handlers, as listed in the spec table.
`;
}

async function writeClassMechanicsPacket(): Promise<void> {
  const outPath = path.join(REPO_ROOT, 'reports', 'class-mechanics-packet.md');
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, renderClassMechanicsPacket(), 'utf8');
  console.log(`Wrote ${outPath}`);
}

function renderReport(sections: string[]): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MMO Idle DPS Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #1f2933; background: #f7f8fa; }
    h1, h2, h3 { margin: 0 0 8px; }
    h1 { font-size: 28px; }
    h2 { margin-top: 28px; padding-top: 18px; border-top: 2px solid #c8d0d9; }
    h3 { font-size: 15px; }
    p { max-width: 1100px; line-height: 1.45; }
    .meta { color: #5c6670; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 18px; align-items: start; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0 18px; background: white; }
    th, td { border: 1px solid #d8dee6; padding: 6px 8px; text-align: left; vertical-align: top; font-size: 12px; }
    th { background: #e8edf2; position: sticky; top: 0; z-index: 1; }
    details { margin-top: 10px; }
    summary { cursor: pointer; font-weight: 700; margin-bottom: 8px; }
    .class-badge {
      display: inline-block;
      border-left: 5px solid var(--class-color);
      padding: 2px 7px;
      background: color-mix(in srgb, var(--class-color) 12%, white);
      font-weight: 700;
      white-space: nowrap;
    }
    .class-group td {
      background: #f3f6f9;
      font-size: 13px;
      padding: 9px 8px;
    }
    .dps-outlier { font-weight: 800; }
    .dps-outlier.positive { color: #15803d; }
    .dps-outlier.negative { color: #b91c1c; }
    .flag { font-weight: 700; white-space: nowrap; }
    .LOW, .EXTREME_LOW { color: #a83232; }
    .HIGH, .EXTREME_HIGH { color: #1f7a3f; }
  </style>
</head>
<body>
  <h1>MMO Idle Theoretical DPS Report</h1>
  <p>
    External balance/debug report generated from shared item, skill, monster, stat, DoT,
    empowered, upgrade, and weapon-family formulas. This is not an in-game panel and not
    a combat simulator. It omits movement, enemies attacking back, deaths, sustain, AoE,
    pathing, aggro, and eHP.
  </p>
  <p class="meta">
    Unlock model: T1 class root, T2 frame, T3 close/far range, T4 path/spec.
    Weapons: each report tier's non-tutorial weapons at +3. Targets use biome spawn pools one tier below the report tier,
    excluding tutorial/test monsters. Mechanics with runtime
    state are represented as deterministic steady-state estimates and are called out in row notes.
    ${OPTIONS.excludeConduit ? 'Conduit and its subclasses are excluded.' : 'Run with --exclude-conduit to omit Conduit and its subclasses.'}
  </p>
  ${sections.join('\n')}
</body>
</html>`;
}

async function main(): Promise<void> {
  if (OPTIONS.classMechanics) {
    await writeClassMechanicsPacket();
    return;
  }

  if (OPTIONS.t4SubclassMechanics) {
    await writeT4SubclassMechanicsPacket();
    return;
  }

  if (OPTIONS.llmPacket) {
    await writeLlmPacket();
    return;
  }

  const tiers = availableReportTiers();
  const sections = tiers.map((tier) => renderTierSection(tier, buildRowsForTier(tier, { tier4MidOnly: true })));
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, renderReport(sections), 'utf8');
  console.log(`Wrote ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
