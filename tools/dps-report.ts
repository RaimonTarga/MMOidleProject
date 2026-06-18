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
  MONSTER_DATABASE,
  recalculatePlayerStats,
  resolveDotClassProfile,
  resolveEmpoweredMultiplier,
  resolveEnergyMax,
  SACRED_APS_MULT,
  SACRED_DMG_MULT,
  SACRED_FAMILY,
  SKILL_TREE,
  upgradeMechanicEffectsTotal,
  upgradeStatBonusTotal,
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
  tier: numberArg('--tier'),
};
const REPORT_PATH = path.join(
  REPO_ROOT,
  'reports',
  OPTIONS.excludeConduit ? 'dps-report-no-conduit.html' : 'dps-report.html',
);
const RANGE_CHOICES = ['close', 'far'] as const;
const WEAPON_UPGRADE_LEVEL = 3;
const REPORT_HORIZON_SEC = 60;
const TUTORIAL_WEAPON_IDS = new Set(['primordial-club']);
const TUTORIAL_MONSTER_IDS = new Set(['tiny-slime']);
const CONDUIT_CLASS_ID = 'summoner-root';
const CADENCE_DAMAGE_MULT_DEFAULT = 2;

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
  rangeKind: typeof RANGE_CHOICES[number] | null;
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

function buildCombosForTier(classTier: number): BuildCombo[] {
  const combos: BuildCombo[] = [];
  for (const root of classRoots()) {
    const archetype = archetypeForClassId(root.id);
    const frames = classTier >= 1 ? frameNodes(root.id) : [null];
    for (const frame of frames) {
      const subVariant = frame?.subVariantId ?? null;
      const ranges = classTier >= 2 ? [...RANGE_CHOICES] : [null];
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
  return reportMonsterSource(reportTier).monsters;
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
  return ammo / (ammo * secondsPerShot + reloadMs / 1000);
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

function applySacredAverage(
  weaponId: string,
  baseDps: number,
): { extraDps: number; notes: string[] } {
  const sacred = SACRED_FAMILY[weaponId];
  if (!sacred) return { extraDps: 0, notes: [] };
  const cycle = sacred.cdMs + sacred.buffMs;
  const burstWeight = sacred.buffMs / cycle;
  const steadyMult = (1 - burstWeight) + burstWeight * SACRED_DMG_MULT * SACRED_APS_MULT;
  return {
    extraDps: baseDps * (steadyMult - 1),
    notes: [`sacred burst steady multiplier ${steadyMult.toFixed(2)}x`],
  };
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
    const threshold = Math.max(2, Math.round((p['cadence.empowered-threshold'] ?? 5) + (p['cadence.threshold-mod'] ?? 0)));
    const mult = empowered?.effective ?? p['cadence.empowered-mult'] ?? CADENCE_DAMAGE_MULT_DEFAULT;
    const triggerCount = Math.max(1, Math.round(p['cadence.trigger-count'] ?? 1));
    const normalHits = threshold - 1;
    let normal = baseWithOnHit;
    let finisher = directNoOnHit(stats.dealsDamage.attack * mult, targetWithDebuffs, platingMult) + stats.dealsDamage.onHitDamage;

    if ((p['cadence.metronome'] ?? 0) > 0) {
      const flat = (p['cadence.metronome-flat'] ?? 12) * Math.max(1, stats.playerTier ?? 1);
      classMechanicPerSec += ((normalHits * (normalHits - 1)) / 2 + normalHits) * flat / threshold * hitRate;
      notes.push('metronome flat cycle estimate');
    }
    if ((p['cadence.momentum-buildup'] ?? 0) > 0) {
      finisher *= 1 + normalHits * (p['cadence.momentum-buildup'] ?? 0);
      const echoHits = Math.round(p['cadence.momentum-echo'] ?? 0);
      classMechanicPerSec += Math.min(echoHits, normalHits) * normal * 0.5 / threshold * hitRate;
      notes.push('wavecrest resonance/echo steady estimate');
    }
    if ((p['cadence.hemorrhage'] ?? 0) > 0) {
      dotPerSec += (finisher * 1.5 / threshold) * hitRate;
      finisher = 0;
      notes.push('hemorrhage converts finishers to bleed');
    }
    if ((p['cadence.debuff-vuln-pct'] ?? 0) > 0) {
      const vuln = (p['cadence.debuff-vuln-pct'] ?? 0) / 100;
      normal *= 1 + vuln;
      finisher *= 1 + vuln;
      notes.push('cursed finale vulnerability treated as steady-state');
    }
    const cadenceAveragePerHit = (normalHits * normal + triggerCount * finisher) / threshold;
    classMechanicPerSec += (cadenceAveragePerHit - baseWithOnHit) * hitRate;
    directPerHit = baseWithOnHit;
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
      const uptime = Math.min(1, 2.5 / cdSec);
      classMechanicPerSec += baseWithOnHit * hitRate * uptime;
      notes.push('overdrive attack-speed buff averaged');
    }
    if ((p['cooldown.reverb'] ?? 0) > 0) {
      classMechanicPerSec += exec * Math.floor(cdSec * hitRate) * (p['cooldown.reverb-bonus-per-attack'] ?? 0.04) * execRate;
      notes.push('reverb next-window bonus estimated');
    }
    if ((p['cooldown.vengeance'] ?? 0) > 0) {
      classMechanicPerSec += (p['cooldown.vengeance-floor'] ?? 30) * execRate;
      notes.push('vengeance uses floor only; incoming damage is not modeled');
    }
  } else if (archetype === 'energy') {
    const maxEnergy = resolveEnergyMax(p, stats.playerTier ?? 0);
    const perHit = Math.max(1, Math.round(p['energy.per-hit'] ?? 14));
    const normalHits = Math.ceil(maxEnergy / perHit);
    const mult = empowered?.effective ?? p['energy.empowered-mult'] ?? 2;
    let empoweredHit = directNoOnHit(stats.dealsDamage.attack * mult, targetWithDebuffs, platingMult) + stats.dealsDamage.onHitDamage;
    if ((p['energy.awakened-lightning'] ?? 0) > 0) {
      classMechanicPerSec += Math.max(0, empoweredHit - baseWithOnHit) * 3 * hitRate / (normalHits + 4);
      notes.push('awakened lightning next-three empowered hits included');
    }
    if ((p['energy.overdrive'] ?? 0) > 0) {
      empoweredHit = baseWithOnHit;
      classMechanicPerSec += baseWithOnHit * hitRate * 0.35;
      notes.push('surge overdrive approximated as 35% steady attack gain');
    }
    if ((p['energy.endless-storm'] ?? 0) > 0) {
      dotPerSec += stats.dealsDamage.attack * 8 * hitRate / (normalHits + 1);
      notes.push('endless storm DoT budget included per discharge');
    }
    const energyAveragePerHit = (normalHits * baseWithOnHit + empoweredHit) / (normalHits + 1);
    classMechanicPerSec += (energyAveragePerHit - baseWithOnHit) * hitRate;
    directPerHit = baseWithOnHit;
  } else if (archetype === 'dot') {
    const profile = resolveDotClassProfile(p, stats.usesSkills.selectedSubVariant);
    const dmgPerStack = computeDotClassDamagePerStack(stats.dealsDamage.attack, profile);
    const maxStacks = (p['dot.poison-explosion'] ?? 0) > 0 ? 10 : profile.maxStacks;
    directPerHit = Math.max(1, Math.round(baseWithOnHit * (1 - profile.conversionPct)));
    if ((p['dot.eternal-doom'] ?? 0) > 0) {
      const steadyStacks = Math.min(40, Math.max(maxStacks, Math.round(hitRate * profile.durationMs / 1000)));
      dotPerSec += computeEternalDoomDamage(steadyStacks, dmgPerStack) / (profile.tickIntervalMs / 1000);
      notes.push('eternal doom capped to 40 steady stacks for report sanity');
    } else {
      dotPerSec += computeScaledDotDamage({
        id: 'dot',
        stacks: maxStacks,
        maxStacks,
        remainingMs: -1,
        sourceId: 'report',
        data: { damagePerStack: dmgPerStack },
      }) / (profile.tickIntervalMs / 1000);
    }
    if ((p['dot.poison-explosion'] ?? 0) > 0) {
      dotPerSec += computeScaledDotDamage({
        id: 'dot',
        stacks: 10,
        maxStacks: 10,
        remainingMs: -1,
        sourceId: 'report',
        data: { damagePerStack: dmgPerStack },
      }) * hitRate / 10;
      notes.push('poison explosion averaged every 10 stacks');
    }
    if ((p['dot.frenzy'] ?? 0) > 0) {
      effectiveHitRate *= 1.8;
      classMechanicPerSec += 10 * Math.max(1, stats.playerTier ?? 1) * hitRate;
      notes.push('frenzy estimated at high uptime');
    }
    if ((p['dot.rimeshatter'] ?? 0) > 0 || (p['dot.ignition'] ?? 0) > 0) {
      directPerHit = baseWithOnHit;
      notes.push('max-stack direct bypass treated as steady-state');
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
      notes.push('blunderbuss modeled as full-magazine single-target volley');
    } else if ((p['reload.death-mark'] ?? 0) > 0) {
      const ammo = Math.max(1, Math.round(p['reload.max-ammo'] ?? 10));
      classMechanicPerSec += stats.dealsDamage.attack * ammo * (p['reload.death-mark-detonate-mult'] ?? 0.65) * effectiveHitRate / ammo;
      notes.push('death mark detonation averaged per clip');
    } else if ((p['reload.cannon'] ?? 0) > 0) {
      classMechanicPerSec += stats.dealsDamage.attack * (p['reload.cannon-damage-per-shot'] ?? 0.5) * effectiveHitRate;
      notes.push('cannon stored pool averaged per shot');
    }
    if ((p['reload.snipe-fullhp-mult'] ?? 0) > 1) {
      weaponProcPerSec += baseWithOnHit * ((p['reload.snipe-fullhp-mult'] ?? 1) - 1) / REPORT_HORIZON_SEC;
      notes.push('sniper full-HP bonus amortized once per report horizon');
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

  const profile = weaponDotProfileForWeapon(weapon.id);
  let directDps = directPerHit * effectiveHitRate;
  if (profile) {
    const convertedDirect = directDps * profile.convPct;
    const convertedClass = Math.max(0, classMechanicPerSec) * profile.convPct;
    directDps -= convertedDirect;
    classMechanicPerSec -= convertedClass;
    const converted = convertedDirect + convertedClass;
    weaponProcPerSec += converted * profile.dotMultiplier;
    notes.push(`${profile.effectId} reservoir DoT from weapon profile`);
  }

  const sacred = applySacredAverage(weapon.id, directDps + classMechanicPerSec + dotPerSec + weaponProcPerSec);
  weaponProcPerSec += sacred.extraDps;
  notes.push(...sacred.notes);

  return {
    direct: directDps,
    classMechanic: classMechanicPerSec,
    dot: dotPerSec,
    weaponProc: weaponProcPerSec,
    notes,
  };
}

function buildRowsForTier(reportTier: number): ReportRow[] {
  const classTier = reportTier - 1;
  const target = targetDummyForTier(reportTier);
  const weapons = weaponsForTier(reportTier);
  const combos = buildCombosForTier(classTier);
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
    const normalHits = Math.ceil(maxEnergy / perHit);
    return `discharge every ${normalHits + 1} hits (${asNumber(hitRate / (normalHits + 1))}/s)`;
  }
  if (archetype === 'dot') {
    const profile = resolveDotClassProfile(p, stats.usesSkills.selectedSubVariant);
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
        SACRED_FAMILY[weapon.id] ? `sacred burst ${SACRED_DMG_MULT}x dmg and ${SACRED_APS_MULT}x APS during buff` : '',
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
- ${modeledMechanics.join(', ')}, weapon debuffs, weapon DoT reservoirs, and sacred-family burst effects are deterministic steady-state estimates.
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
  if (OPTIONS.llmPacket) {
    await writeLlmPacket();
    return;
  }

  const tiers = availableReportTiers();
  const sections = tiers.map((tier) => renderTierSection(tier, buildRowsForTier(tier)));
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, renderReport(sections), 'utf8');
  console.log(`Wrote ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
