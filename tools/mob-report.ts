import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  T1_STARTER_PROGRESSION,
  maxGlobalMasteryAtTier,
  upgradeCeilingFromGlobalMastery,
  emptyEquipment,
  estimateMonsterHitDamage,
  estimatePlayerDps,
  GAME_CONFIG,
  getMaxUpgrade,
  recalculatePlayerStats,
  resolveSummonerProfile,
  SKILL_TREE,
  type BiomeDefinition,
  type CombatArchetype,
  type DpsEstimateInput,
  type ItemDefinition,
  type MonsterDefinition,
  type PlayerStatsTarget,
  type SkillNode,
  type SubVariant,
} from '@mmo-idle/shared';
import { balanceData, LOADOUT_MODEL_NOTE } from './balance-data';

// ─────────────────────────────────────────────────────────────────────────────
// Monster balance / threat report — the offence-of-the-world sibling of
// tools/dps-report.ts (player damage) and tools/ehp-report.ts (player survival).
// Here the MONSTER is the subject: every non-boss spawn and every boss is profiled
// for HP, attack, cadence, raw DPS, DoT, plating/DR, range, speed, spike potential
// and special mechanics, then bucketed by biome tier so balance outliers fall out.
//
// Player-facing numbers (incoming DPS, spike %HP, TTL pressure, boss TTK) are
// computed against neutral *reference players* rebuilt from shared item/skill/stat
// formulas — the same makeStatsTarget + recalculatePlayerStats path the other two
// tools use. Convention (mirroring those tools): a player of tier P fights biome
// tier P-1, so a biome-tier-B mob is measured against a tier-(B+1) player, clamped
// to the highest authored item tier.
//
// This is NOT a combat simulator. No movement, kiting, real AoE target count, AI,
// party effects, or player recovery throughput (that lives in the eHP tool). The
// reference player DPS uses the shared archetype-aware planning estimator over
// concrete class builds, including full Conduit formations. T3 specialization,
// abilities, movement, and target-state mechanics remain outside this report;
// every approximation is surfaced in notes.
// ─────────────────────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = balanceData();
const ARGS = process.argv.slice(2);
const OPTIONS = {
  llmPacket: ARGS.includes('--llm-packet'),
  tier: numberArg('--tier'),
};
const REPORT_PATH = path.join(REPO_ROOT, 'reports', 'mob-report.html');

const ITEM_UPGRADE_LEVEL = 3;
const TUTORIAL_MONSTER_IDS = new Set(['tiny-slime']);
const TUTORIAL_WEAPON_IDS = new Set(['primordial-club']);
// Discovery threshold only: this highlights spread and is not a balance target.
const OUTLIER_PCT = 0.25;
// Status thresholds (seconds of survival), mirroring the eHP tool's bands.
const MOB_TTL_RISK_SEC = 30;
const MOB_TTL_BLOCK_SEC = 10;
const BOSS_TTL_RISK_SEC = 20;
const BOSS_TTL_BLOCK_SEC = 8;
// Boss TTK (player kill time) sanity window.
const BOSS_TTK_TRIVIAL_SEC = 6;
const BOSS_TTK_SLOG_SEC = 120;
// A biome-tier is "single-typed" when this fraction of its mobs share one damage type.
const DAMAGE_TYPE_DOMINANCE = 0.8;

function numberArg(name: string): number | null {
  const equals = ARGS.find((arg) => arg.startsWith(`${name}=`));
  const index = ARGS.indexOf(name);
  const raw = equals ? equals.slice(name.length + 1) : index >= 0 ? ARGS[index + 1] : undefined;
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

// ─── Formatting helpers (shared shape with the dps/ehp tools) ────────────────

function asNumber(value: number): string {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '0';
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function pct(value: number): string {
  return `${asNumber(value * 100)}%`;
}

function ttl(value: number): string {
  return Number.isFinite(value) ? `${asNumber(value)}s` : 'survives';
}

function html(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function md(value: unknown): string {
  return String(value).replace(/\s+/g, ' ').replaceAll('|', '\\|').trim();
}

// ─── Monster threat model ─────────────────────────────────────────────────────

type DamageType = 'Direct' | 'DoT' | 'Mixed';
type Status = 'Safe' | 'Risky' | 'Blocked';

function aps(monster: MonsterDefinition): number {
  return 1000 / Math.max(100, monster.stats.attackCooldown);
}

/**
 * Mean number of full pipeline hits one attack opportunity resolves.
 *
 * Mirrors `beatMultiple` in tools/tier-table.ts — kept in the same shape so the two
 * monster instruments cannot disagree about what a "beat" is:
 *
 *   consecutiveHits  one opportunity resolves this many hits (the loop in combat.ts)
 *   cadenceVolley    every Nth beat delivers `hits` hits INSTEAD OF one
 *   cadenceFinisher  every Nth beat is multiplied by `multiplier`
 *
 * `openingStrike` / `openingVolley` are excluded on purpose: they fire once per combat
 * session, so they are burst rather than sustained pressure.
 */
function beatMultiple(monster: MonsterDefinition): number {
  const base = Math.max(1, Math.round(monster.consecutiveHits ?? 1));
  let mult = base;
  const volley = monster.cadenceVolley;
  if (volley) {
    const n = Math.max(1, Math.round(volley.everyNAttacks));
    mult = (base * (n - 1) + Math.max(1, volley.hits)) / n;
  }
  const finisher = monster.cadenceFinisher;
  if (finisher) {
    const n = Math.max(1, Math.round(finisher.everyNAttacks));
    mult *= ((n - 1) + finisher.multiplier) / n;
  }
  return mult;
}

/**
 * Raw (pre-mitigation) direct DPS.
 *
 * Was `attack x attacks-per-second` until 2026-08-23, which ignored both
 * `consecutiveHits` and the whole charged-attack cycle — 47 of 134 authored monsters
 * carry a `chargedAttack`, so a third of the roster read as carrying no offensive
 * mechanic at all.
 *
 * A charged attack is not free damage added to the auto-attack stream: during `castMs`
 * the monster neither moves nor auto-attacks, so a cycle TRADES normal beats for one
 * multiplied hit. Modelling the trade is what makes a pure-control cast (multiplier 1.0
 * — Petrifying Gaze, Wither, Frostbind) read correctly as a small sustained-damage loss
 * rather than as no mechanic. This mirrors `directDps` in tools/tier-table.ts.
 */
function directDpsWith(
  monster: MonsterDefinition,
  hitOf: (attack: number) => number,
): number {
  const { attack, attackCooldown } = monster.stats;
  const cd = Math.max(1, attackCooldown);
  const beat = beatMultiple(monster);
  // `hitOf` resolves ONE hit at the monster's base attack; every mechanic below is a
  // multiplier on top of it. That ordering is deliberate — the runtime mitigates
  // first and multiplies the empowered/charged beat afterwards, so a mitigated
  // `hitOf` composes correctly here without re-deriving mitigation per beat size.
  const hit = hitOf(attack);
  let dps = (hit * beat * 1000) / cd;

  const charged = monster.chargedAttack;
  if (charged) {
    const cycle = Math.max(1, charged.cooldownMs);
    // Beats actually taken in a cycle: the wind-up is dead time for normal attacks.
    const beats = Math.max(0, (cycle - charged.castMs) / cd);
    const perCycle = hit * beat * beats + hit * charged.multiplier;
    dps = (perCycle * 1000) / cycle;
  }

  if (monster.empoweredCooldown) {
    // A timer finisher with no cast: it adds its surplus over a normal beat,
    // amortised across its cooldown.
    const cycle = Math.max(1, monster.empoweredCooldown.cooldownMs);
    const surplus = hit * (monster.empoweredCooldown.multiplier - beat);
    if (surplus > 0) dps += (surplus * 1000) / cycle;
  }

  return dps;
}

function rawDirectDps(monster: MonsterDefinition): number {
  return directDpsWith(monster, (attack) => attack);
}

/** Steady-state raw DoT DPS assuming the player carries the full refreshed stack. */
function monsterDotDps(monster: MonsterDefinition): { dps: number; bypass: boolean } {
  const d = monster.dotEffect;
  if (!d) return { dps: 0, bypass: false };
  const ticksPerSec = 1000 / Math.max(1, d.tickIntervalMs);
  return { dps: d.maxStacks * d.damagePerStack * ticksPerSec, bypass: Boolean(d.bypassShield) };
}

function rawTotalDps(monster: MonsterDefinition): number {
  return rawDirectDps(monster) + monsterDotDps(monster).dps;
}

/** Largest single-hit multiplier the monster can land (cadence/cooldown/charged/aoe/ramp/boss). */
function monsterSpikeMult(monster: MonsterDefinition): number {
  let mult = 1;
  if (monster.cadenceFinisher) mult = Math.max(mult, monster.cadenceFinisher.multiplier);
  if (monster.empoweredCooldown) mult = Math.max(mult, monster.empoweredCooldown.multiplier);
  // The charged cast is the largest telegraphed hit in the reworked design and was
  // missing here entirely until 2026-08-23, so every charged monster reported a x1
  // spike. `openingStrike` fires once per session but is still the biggest hit the
  // player eats on the pull, so it belongs in a "worst spike" column.
  if (monster.chargedAttack) mult = Math.max(mult, monster.chargedAttack.multiplier);
  if (monster.openingStrike) mult = Math.max(mult, monster.openingStrike.multiplier);
  if (monster.markedStrike) mult = Math.max(mult, monster.markedStrike.multiplier);
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
    for (const rep of monster.bossScript.repeating ?? []) {
      for (const action of rep.actions) {
        if (action.type === 'enrage') mult = Math.max(mult, action.atkMult);
        if (action.type === 'stat-buff' && action.stat === 'attack') mult = Math.max(mult, action.mult);
        if (action.type === 'slam') mult = Math.max(mult, action.damageMult ?? 1);
      }
    }
  }
  return mult;
}

function damageType(monster: MonsterDefinition): DamageType {
  const direct = rawDirectDps(monster);
  const dot = monsterDotDps(monster).dps;
  const total = direct + dot;
  if (total <= 0) return 'Direct';
  const dotShare = dot / total;
  if (dotShare >= 0.6) return 'DoT';
  if (dotShare <= 0.2) return 'Direct';
  return 'Mixed';
}

/** Single primary tag for the at-a-glance role column. Specials carry the rest. */
function monsterRole(monster: MonsterDefinition): string {
  if (monster.isBoss) return monster.ultimateEncounter ? 'Ultimate' : 'Boss';
  const dot = monsterDotDps(monster).dps;
  const direct = rawDirectDps(monster);
  if (dot > direct) return 'DoT';
  if (monster.aoeAttack) return 'AoE';
  if (monster.isRanged || monster.kite) return 'Ranged';
  if (monsterSpikeMult(monster) >= 1.8) return 'Spiker';
  if (monster.stats.plating >= 8 || monster.stats.damageReduction >= 0.2) return 'Tank';
  if (aps(monster) >= 1.2 && monster.stats.hp <= 30) return 'Swarm';
  if ((monster.evasion ?? 0) >= 0.15) return 'Evasive';
  return 'Bruiser';
}

/** Compact list of every special mechanic the monster carries. */
function monsterSpecials(monster: MonsterDefinition): string[] {
  const out: string[] = [];
  const dot = monster.dotEffect;
  if (dot) out.push(`dot ${asNumber(monsterDotDps(monster).dps)}/s×${dot.maxStacks}${dot.bypassShield ? ' bypass' : ''}`);
  if (monster.slowEffect) out.push(monster.slowEffect.speedMult === 0 ? 'root' : `slow ×${asNumber(monster.slowEffect.speedMult)}`);
  if (monster.aoeAttack) out.push(`aoe ×${asNumber(1 + (monster.aoeAttack.damageMult ?? 1))}`);
  if (monster.cadenceFinisher) out.push(`cadence ${monster.cadenceFinisher.everyNAttacks}→×${asNumber(monster.cadenceFinisher.multiplier)}`);
  if (monster.empoweredCooldown) out.push(`cooldown ${asNumber(monster.empoweredCooldown.cooldownMs / 1000)}s→×${asNumber(monster.empoweredCooldown.multiplier)}`);
  if (monster.rampOnCombat) out.push(`ramp +${pct(monster.rampOnCombat.maxPct)} atk`);
  if (monster.rampDebuff) out.push(`debuff-ramp slow/atk`);
  if (monster.enemyShield) out.push(`shield ${pct(monster.enemyShield.shieldPct)}/${asNumber(monster.enemyShield.intervalMs / 1000)}s`);
  if (monster.enemySoftCap) out.push(`softcap ${pct(monster.enemySoftCap.capPct)}×${asNumber(monster.enemySoftCap.capMult)}`);
  if ((monster.evasion ?? 0) > 0) out.push(`evasion ${pct(monster.evasion ?? 0)}`);
  if (monster.chargeOnAggro) out.push(`charge ×${asNumber(monster.chargeOnAggro.speedMult)}`);
  if (monster.isRanged) out.push('ranged');
  if (monster.kite) out.push('kite');
  if (monster.bossScript) out.push('script');
  if (monster.ultimateEncounter) out.push('ultimate');
  return out;
}

// ─── Biome / tier selection ───────────────────────────────────────────────────

function isReportMob(monster: MonsterDefinition): boolean {
  return !monster.isBoss &&
    monster.biome !== 'testroom' &&
    !monster.interactKind &&
    !TUTORIAL_MONSTER_IDS.has(monster.id);
}

function mobsForBiomeTier(biome: BiomeDefinition, biomeTier: number): MonsterDefinition[] {
  return (biome.monsterPoolByTier[biomeTier] ?? [])
    .map((id) => DATA.monster(id))
    .filter((m): m is MonsterDefinition => Boolean(m && isReportMob(m)));
}

function bossesForBiomeTier(biome: BiomeDefinition, biomeTier: number): MonsterDefinition[] {
  return (biome.bossPoolByTier?.[biomeTier] ?? [])
    .map((id) => DATA.monster(id))
    .filter((m): m is MonsterDefinition => Boolean(m && m.biome !== 'testroom'));
}

/** Biome tiers (1..N) that have at least one report mob. Clearing (0) is skipped. */
function reportBiomeTiers(): number[] {
  const tiers = new Set<number>();
  for (const biome of DATA.biomes()) {
    for (const key of Object.keys(biome.monsterPoolByTier)) {
      const tier = Number(key);
      if (tier >= 1 && mobsForBiomeTier(biome, tier).length > 0) tiers.add(tier);
    }
  }
  return [...tiers].sort((a, b) => a - b);
}

interface BiomeGroup { biome: BiomeDefinition; mobs: MonsterDefinition[]; bosses: MonsterDefinition[] }

function biomeGroupsAtTier(biomeTier: number): BiomeGroup[] {
  return DATA.biomes()
    .filter((b) => b.id !== 'testroom')
    .map((biome) => ({ biome, mobs: mobsForBiomeTier(biome, biomeTier), bosses: bossesForBiomeTier(biome, biomeTier) }))
    .filter((g) => g.mobs.length > 0 || g.bosses.length > 0)
    .sort((a, b) => a.biome.name.localeCompare(b.biome.name));
}

function allMobsAtTier(biomeTier: number): MonsterDefinition[] {
  return biomeGroupsAtTier(biomeTier).flatMap((g) => g.mobs);
}

function maxItemTier(): number {
  return Math.max(...DATA.items().filter((i) => i.slot === 'armor').map((i) => i.tier));
}

// ─── Reference player profiles (rebuilt from shared formulas) ─────────────────

interface BuildCombo {
  classId: string;
  subVariant: SubVariant | null;
  rangeId: string | null;
  archetype: Exclude<CombatArchetype, null>;
  unlockedSkills: string[];
}

function archetypeForClassId(classId: string): Exclude<CombatArchetype, null> {
  return classId.replace(/-root$/, '') as Exclude<CombatArchetype, null>;
}

function classRoots(): SkillNode[] {
  return [...SKILL_TREE.values()]
    .filter((node) => node.tier === 0 && node.classId === node.id)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function frameNodes(classId: string): SkillNode[] {
  return [...SKILL_TREE.values()]
    .filter((node) => node.tier === 1 && node.classId === classId && node.subVariantId)
    .sort((a, b) => String(a.subVariantId).localeCompare(String(b.subVariantId)));
}

/** Spec-agnostic combos (root + frame + range, no T3 spec) capped at class tier 2,
 *  matching the comparison views in the eHP tool. Keeps the cross-product small. */
function comparisonCombos(classTier: number): BuildCombo[] {
  const cappedTier = Math.min(2, classTier);
  const combos: BuildCombo[] = [];
  for (const root of classRoots()) {
    const archetype = archetypeForClassId(root.id);
    const frames = cappedTier >= 1 ? frameNodes(root.id) : [null];
    for (const frame of frames) {
      const subVariant = frame?.subVariantId ?? null;
      const ranges: Array<'close' | 'far' | null> = cappedTier >= 2 ? ['close', 'far'] : [null];
      for (const rangeKind of ranges) {
        const rangeId = rangeKind ? `${archetype}-range-${rangeKind}` : null;
        const unlockedSkills = [root.id];
        if (frame) unlockedSkills.push(frame.id);
        if (rangeId && SKILL_TREE.has(rangeId)) unlockedSkills.push(rangeId);
        combos.push({ classId: root.id, subVariant, rangeId: rangeId && SKILL_TREE.has(rangeId) ? rangeId : null, archetype, unlockedSkills });
      }
    }
  }
  return combos;
}

function itemsForSlotTier(slot: 'weapon' | 'armor' | 'recovery', tier: number): ItemDefinition[] {
  return DATA.items()
    .filter((item) => item.slot === slot && item.tier === tier && !TUTORIAL_WEAPON_IDS.has(item.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function makeStatsTarget(
  combo: BuildCombo,
  items: { weapon?: ItemDefinition; armor?: ItemDefinition; recovery?: ItemDefinition },
  plus: number,
  classTier: number,
): PlayerStatsTarget {
  const equipment = emptyEquipment();
  const inventory: string[] = [];
  const itemUpgrades: Record<string, number> = {};
  for (const item of [items.weapon, items.armor, items.recovery]) {
    if (!item) continue;
    inventory.push(item.id);
    itemUpgrades[item.id] = Math.min(plus, getMaxUpgrade(item));
  }
  if (items.weapon) equipment.weapon = items.weapon.id;
  if (items.armor) equipment.armor = items.armor.id;
  if (items.recovery) equipment.recovery = items.recovery.id;
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
    playerTier: classTier,
  };
}

interface PlayerProfile {
  label: string;
  gearLabel: string;
  maxHp: number;
  plating: number;
  damageReduction: number;
  dodgeRate: number;
  evadeMitigation: number;
  // Display summaries plus the concrete class builds used for target-aware DPS.
  attack: number;
  onHitDamage: number;
  attackCooldown: number;
  offenceSamples: DpsEstimateInput[];
  usedFallbackTier: boolean;
}

/** Mean defensive stats over spec-agnostic combos × armor × recovery (weapon empty). */
function averageDefence(combos: BuildCombo[], gearTier: number, plus: number, classTier: number) {
  const armors = itemsForSlotTier('armor', gearTier);
  const recoveries = itemsForSlotTier('recovery', gearTier);
  const recoveryChoices: Array<ItemDefinition | null> = recoveries.length ? recoveries : [null];
  const acc = { maxHp: 0, plating: 0, dr: 0, dodge: 0, evadeMit: 0, n: 0 };
  for (const combo of combos) for (const armor of armors) for (const recovery of recoveryChoices) {
    const stats = makeStatsTarget(combo, { armor, recovery: recovery ?? undefined }, plus, classTier);
    recalculatePlayerStats(stats);
    acc.maxHp += stats.hasHealth.maxHp;
    acc.plating += stats.mitigatesDamage.plating;
    acc.dr += stats.mitigatesDamage.damageReduction;
    acc.dodge += stats.evadesHits.dodgeRate;
    acc.evadeMit += stats.evadesHits.evadeMitigation;
    acc.n++;
  }
  const n = Math.max(1, acc.n);
  return { maxHp: acc.maxHp / n, plating: acc.plating / n, damageReduction: acc.dr / n, dodgeRate: acc.dodge / n, evadeMitigation: acc.evadeMit / n };
}

/** Mean offensive stats and concrete class builds across combos × weapon. */
function dpsInputForStats(stats: PlayerStatsTarget): DpsEstimateInput {
  const profileInput = {
    selectedSubVariant: stats.usesSkills.selectedSubVariant,
    selectedRange: stats.usesSkills.selectedRange,
    unlockedSkills: stats.usesSkills.unlockedSkills,
    passives: stats.usesSkills.passives,
  };
  const summoner = stats.usesSkills.combatArchetype === 'summoner'
    ? {
      profileInput,
      activeCount: resolveSummonerProfile(profileInput).slots.length,
    }
    : undefined;
  return {
    attack: stats.dealsDamage.attack,
    onHitDamage: stats.dealsDamage.onHitDamage,
    attackCooldownMs: stats.performsAttack.attackCooldown,
    archetype: stats.usesSkills.combatArchetype,
    passives: stats.usesSkills.passives,
    selectedSubVariant: stats.usesSkills.selectedSubVariant,
    playerTier: stats.playerTier,
    summoner,
  };
}

function averageOffence(combos: BuildCombo[], gearTier: number, plus: number, classTier: number) {
  const weapons = itemsForSlotTier('weapon', gearTier);
  const acc = { attack: 0, onHit: 0, cooldown: 0, n: 0 };
  const offenceSamples: DpsEstimateInput[] = [];
  for (const combo of combos) for (const weapon of weapons) {
    const stats = makeStatsTarget(combo, { weapon }, plus, classTier);
    recalculatePlayerStats(stats);
    acc.attack += stats.dealsDamage.attack;
    acc.onHit += stats.dealsDamage.onHitDamage;
    acc.cooldown += stats.performsAttack.attackCooldown;
    offenceSamples.push(dpsInputForStats(stats));
    acc.n++;
  }
  const n = Math.max(1, acc.n);
  return {
    attack: acc.attack / n,
    onHitDamage: acc.onHit / n,
    attackCooldown: acc.cooldown / n,
    offenceSamples,
  };
}

/** The four reference player baselines for a biome tier, per the report spec. */
function playerProfilesForBiomeTier(biomeTier: number): PlayerProfile[] {
  const max = maxItemTier();
  const playerTier = Math.min(biomeTier + 1, max);
  const usedFallbackTier = biomeTier + 1 > max;
  const classTier = playerTier - 1;
  const combos = comparisonCombos(classTier);

  function profile(label: string, gearTier: number, plus: number): PlayerProfile | null {
    if (itemsForSlotTier('armor', gearTier).length === 0) return null;
    const def = averageDefence(combos, gearTier, plus, classTier);
    const off = averageOffence(combos, gearTier, plus, classTier);
    return {
      label,
      gearLabel: `T${gearTier} +${plus}`,
      ...def,
      ...off,
      usedFallbackTier,
    };
  }

  const entryTier = Math.max(1, playerTier - 1);
  const profiles: Array<PlayerProfile | null> = [
    profile('Entry (prev-tier +3)', entryTier, ITEM_UPGRADE_LEVEL),
    profile('Same-tier +0', playerTier, 0),
    profile('Same-tier +3', playerTier, ITEM_UPGRADE_LEVEL),
    bossReadyProfile(combos, playerTier, classTier, usedFallbackTier),
  ];
  // De-dupe Entry == Same-tier when playerTier-1 collapses (e.g. clamped top tier).
  const seen = new Set<string>();
  return profiles.filter((p): p is PlayerProfile => {
    if (!p) return false;
    const key = `${p.label}|${p.gearLabel}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── The progression walk ────────────────────────────────────────────────────
//
// A player does not meet all of a tier's biomes in the same gear. They walk the
// tier's ladder in a fixed order, and every biome they master raises Global
// Mastery, which is the ONLY gate on item upgrade level
// (`upgradeCeilingFromGlobalMastery`). So arriving at the last biome of a tier
// means arriving four upgrade levels above where the first one was fought.
//
// Measuring every biome against one fixed reference player — which this report
// did until 2026-08-23 — therefore answers the wrong question. It reports the
// progression the player is MISSING rather than how hard the biome is for the
// player who is actually standing in it, and it makes the end of every tier look
// like a cliff by construction.
//
// The arrival gear below is DERIVED, not assumed: GM at rung k is the tier's
// starting GM plus k biomes' worth of levels, and the ceiling falls straight out
// of the shared upgrade gate. For T1 that yields +0/+1/+2/+3/+4 across
// plains→forest→swamp→mountain→cave.

/**
 * Authored intra-tier progression order, easiest → hardest.
 *
 * Locked with the designer 2026-08-23; the authority is
 * `docs/tier-balance-current-state.md` §2. Tier 1 additionally exists in code as
 * `T1_STARTER_PROGRESSION`, and `assertLadderMatchesAuthoredPolicy` below fails
 * the run if the two ever drift apart.
 */
const BIOME_LADDER: Record<number, string[]> = {
  1: ['plains', 'forest', 'swamp', 'mountain', 'cave'],
  2: ['plains', 'forest', 'swamp', 'mountain', 'cave', 'jungle', 'desert'],
  3: ['swamp', 'mountain', 'cave', 'jungle', 'desert', 'tundra', 'volcanic'],
  4: ['mountain', 'jungle', 'desert', 'tundra', 'volcanic', 'graveyard', 'trench'],
};

function assertLadderMatchesAuthoredPolicy(): void {
  const authored = [...T1_STARTER_PROGRESSION.steps]
    .sort((a, b) => a.order - b.order)
    .map((s) => s.biomeId);
  const ours = BIOME_LADDER[1];
  if (authored.join(',') !== ours.join(',')) {
    throw new Error(
      `T1 ladder disagrees with T1_STARTER_PROGRESSION.\n`
      + `  authored: ${authored.join(' -> ')}\n`
      + `  report:   ${ours.join(' -> ')}\n`
      + `Fix BIOME_LADDER (or the policy) — they must not drift.`,
    );
  }
}

/**
 * Upgrade level a player can hold on arriving at rung `index` of `biomeTier`'s ladder.
 *
 * The band is the BIOME's own tier, not `biomeTier + 1`. A player walks a tier's
 * ladder while they are of that tier — the seal gate proves it, since advancing out
 * of tier N requires clearing tier-N bosses, which sit at the top of this very
 * ladder. Using the next tier's band instead credits the player with mastery they
 * only earn by finishing the walk, which collapses the whole climb to +5 and hides
 * exactly the pacing this table exists to show.
 *
 * GM is cumulative across the game, so the band runs from "everything the previous
 * tier could offer" to "everything this one can".
 */
function arrivalUpgradeFor(biomeTier: number, index: number): { plus: number; gm: number } {
  const gmStart = maxGlobalMasteryAtTier(biomeTier - 1);
  const gmEnd = maxGlobalMasteryAtTier(biomeTier);
  const rungs = BIOME_LADDER[biomeTier]?.length ?? 1;
  const gm = Math.round(gmStart + index * ((gmEnd - gmStart) / rungs));
  // Gear is crafted from the tier being farmed, so it is the BIOME's tier; only
  // the upgrade level moves along the walk.
  return { plus: upgradeCeilingFromGlobalMastery(gm, biomeTier), gm };
}

interface WalkRung {
  index: number;
  biomeId: string;
  biomeName: string;
  profile: PlayerProfile;
  gm: number;
  /** Mean seconds to kill one pool-average mob of this biome. */
  mobTtkSec: number;
  /** Seconds the player survives the biome's mean incoming pressure, no recovery. */
  ttlSec: number;
  /** Worst single mitigated hit in the biome, as a share of the arrival player's maxHp. */
  worstSpikePct: number;
  worstSpikeName: string;
  /**
   * Share of the arrival player's health pool spent killing one average mob —
   * incoming DPS x time-to-kill. This is the walk's load-bearing number: it folds
   * offence and defence into "what does one kill here cost me?", which is the
   * quantity that should climb smoothly across a tier.
   */
  burden: number;
  /** burden(this) / burden(previous). 1.0 = no change in real difficulty. */
  step: number | null;
}

function buildWalk(biomeTier: number): WalkRung[] {
  const ladder = BIOME_LADDER[biomeTier];
  if (!ladder) return [];
  const groups = new Map(biomeGroupsAtTier(biomeTier).map((g) => [g.biome.id, g]));
  const playerTier = Math.min(biomeTier + 1, maxItemTier());
  const classTier = playerTier - 1;
  const combos = comparisonCombos(classTier);
  const rungs: WalkRung[] = [];

  ladder.forEach((biomeId, index) => {
    const group = groups.get(biomeId);
    if (!group || group.mobs.length === 0) return;
    const { plus, gm } = arrivalUpgradeFor(biomeTier, index);
    if (itemsForSlotTier('armor', biomeTier).length === 0) return;

    const def = averageDefence(combos, biomeTier, plus, classTier);
    const off = averageOffence(combos, biomeTier, plus, classTier);
    const profile: PlayerProfile = {
      label: `Arrive ${group.biome.name}`,
      gearLabel: `T${biomeTier} +${plus}`,
      ...def,
      ...off,
      usedFallbackTier: false,
    };

    const threats = group.mobs.map((m) => threatAgainst(profile, m, false));
    const ttks = group.mobs.map((m) => expectedTtkSec(profile, m));
    const meanIncoming = mean(threats.map((t) => t.incomingDps));
    const meanTtk = mean(ttks.filter((v) => Number.isFinite(v)));
    const worst = maxBy(
      group.mobs.map((m, i) => ({ m, spike: threats[i].spikeHit })),
      (x) => x.spike,
    );

    const ttlSec = meanIncoming > 0 ? profile.maxHp / meanIncoming : Number.POSITIVE_INFINITY;
    const burden = profile.maxHp > 0 && Number.isFinite(meanTtk)
      ? (meanIncoming * meanTtk) / profile.maxHp
      : Number.POSITIVE_INFINITY;

    rungs.push({
      index,
      biomeId,
      biomeName: group.biome.name,
      profile,
      gm,
      mobTtkSec: meanTtk,
      ttlSec,
      worstSpikePct: worst ? worst.spike / Math.max(1, profile.maxHp) : 0,
      worstSpikeName: worst?.m.name ?? '-',
      burden,
      step: null,
    });
  });

  for (let i = 1; i < rungs.length; i++) {
    const prev = rungs[i - 1].burden;
    rungs[i].step = prev > 0 && Number.isFinite(prev) ? rungs[i].burden / prev : null;
  }
  return rungs;
}

/**
 * Step band used only to LABEL a rung, never to gate one.
 *
 * A tier is supposed to climb, so a step near 1.0 means the biome got no harder
 * once the player's own growth is accounted for. These edges are discovery
 * thresholds picked to surface the extremes, not authored balance targets — the
 * designer owns what a healthy step actually is (see the audit's D2/D5).
 */
const STEP_FLAT = 1.05;
const STEP_WALL = 1.8;

function stepLabel(step: number | null): string {
  if (step === null) return 'baseline';
  if (step < 0.95) return 'EASIER';
  if (step < STEP_FLAT) return 'flat';
  if (step > STEP_WALL) return 'WALL';
  return 'ok';
}

/** Boss-ready: same-tier +3, but biased to the tankiest armor and best recovery. */
function bossReadyProfile(combos: BuildCombo[], playerTier: number, classTier: number, usedFallbackTier: boolean): PlayerProfile | null {
  const armors = itemsForSlotTier('armor', playerTier);
  const recoveries = itemsForSlotTier('recovery', playerTier);
  if (armors.length === 0) return null;
  const tankiestArmor = [...armors].sort((a, b) => (b.statModifiers.maxHp ?? 0) + (b.statModifiers.plating ?? 0) - ((a.statModifiers.maxHp ?? 0) + (a.statModifiers.plating ?? 0)))[0];
  const bestRecovery = recoveries.length
    ? [...recoveries].sort((a, b) => ((b.mechanicEffects?.['defense.barrier-pct'] ?? 0) + (b.statModifiers.recovery ?? 0)) - ((a.mechanicEffects?.['defense.barrier-pct'] ?? 0) + (a.statModifiers.recovery ?? 0)))[0]
    : null;
  const acc = { maxHp: 0, plating: 0, dr: 0, dodge: 0, evadeMit: 0, n: 0 };
  for (const combo of combos) {
    const stats = makeStatsTarget(combo, { armor: tankiestArmor, recovery: bestRecovery ?? undefined }, ITEM_UPGRADE_LEVEL, classTier);
    recalculatePlayerStats(stats);
    acc.maxHp += stats.hasHealth.maxHp;
    acc.plating += stats.mitigatesDamage.plating;
    acc.dr += stats.mitigatesDamage.damageReduction;
    acc.dodge += stats.evadesHits.dodgeRate;
    acc.evadeMit += stats.evadesHits.evadeMitigation;
    acc.n++;
  }
  const n = Math.max(1, acc.n);
  const off = averageOffence(combos, playerTier, ITEM_UPGRADE_LEVEL, classTier);
  return {
    label: 'Boss-ready (tankiest +3)',
    gearLabel: `T${playerTier} +${ITEM_UPGRADE_LEVEL}`,
    maxHp: acc.maxHp / n,
    plating: acc.plating / n,
    damageReduction: acc.dr / n,
    dodgeRate: acc.dodge / n,
    evadeMitigation: acc.evadeMit / n,
    ...off,
    usedFallbackTier,
  };
}

// ─── Player ↔ monster interaction math ────────────────────────────────────────

interface Threat {
  incomingDps: number; // post-mitigation/evasion HP loss per second (direct + DoT)
  spikeHit: number; // biggest single mitigated hit
  spikePctHp: number;
  ttlSec: number; // maxHp / incomingDps (no player recovery modeled)
  status: Status;
}

function evadeFactor(p: PlayerProfile): number {
  return Math.max(0, 1 - p.dodgeRate * p.evadeMitigation);
}

function threatAgainst(p: PlayerProfile, monster: MonsterDefinition, isBoss: boolean): Threat {
  const hit = estimateMonsterHitDamage({ attack: monster.stats.attack, targetPlating: p.plating, targetDamageReduction: p.damageReduction });
  const dot = monsterDotDps(monster).dps; // player dot-resistance not modeled here (lives in eHP tool)
  // Mitigate one hit, then let the cadence mechanics multiply it — the same
  // ordering the runtime uses, and the same beat/charged model the raw-DPS column
  // uses. Before 2026-08-23 this was a flat `hit x attacks-per-second`, which
  // silently dropped consecutiveHits, volleys, finishers and the whole charged
  // cycle from the player-facing pressure number.
  const directDps = directDpsWith(monster, () => hit);
  const incomingDps = directDps * evadeFactor(p) + dot;
  const spikeHit = mitigatedSpike(p, monster);
  const spikePctHp = spikeHit / Math.max(1, p.maxHp);
  const ttlSec = incomingDps > 0 ? p.maxHp / incomingDps : Number.POSITIVE_INFINITY;
  return { incomingDps, spikeHit, spikePctHp, ttlSec, status: threatStatus(spikePctHp, ttlSec, isBoss) };
}

/**
 * Biggest mitigated single hit a specific monster can land on the player.
 *
 * ORDER MATTERS. The runtime mitigates FIRST and applies the empowered / charged
 * multiplier afterwards (`runMonsterAttack` in server/src/systems/combat/engine/combat.ts:
 * the base hit resolves against plating and DR, then `ctx.damage *= empoweredMult`).
 * Multiplying the attack before the plating subtraction — which this did until
 * 2026-08-23 — inflates the spike by a plating-dependent factor, since
 * `(A - P) * M < (A * M - P)` for any P > 0.
 */
function mitigatedSpike(p: PlayerProfile, monster: MonsterDefinition): number {
  const base = estimateMonsterHitDamage({
    attack: monster.stats.attack,
    targetPlating: p.plating,
    targetDamageReduction: p.damageReduction,
  });
  return base * monsterSpikeMult(monster);
}

function threatStatus(spikePctHp: number, ttlSec: number, isBoss: boolean): Status {
  const block = isBoss ? BOSS_TTL_BLOCK_SEC : MOB_TTL_BLOCK_SEC;
  const risk = isBoss ? BOSS_TTL_RISK_SEC : MOB_TTL_RISK_SEC;
  if (spikePctHp >= 1) return 'Blocked';
  if (!Number.isFinite(ttlSec)) return spikePctHp >= 0.5 ? 'Risky' : 'Safe';
  if (ttlSec < block) return 'Blocked';
  if (ttlSec < risk || spikePctHp >= 0.5) return 'Risky';
  return 'Safe';
}

/** Mean class-aware DPS of the concrete reference builds against one target. */
function referenceDpsAgainst(p: PlayerProfile, target: MonsterDefinition): number {
  return mean(p.offenceSamples.map((sample) => estimatePlayerDps({
    ...sample,
    target: {
      plating: target.stats.plating,
      damageReduction: target.stats.damageReduction,
    },
  }).total));
}

/** Planning TTK: HP ÷ class-aware DPS. Shield/soft-cap remain unmodeled. */
function expectedTtkSec(p: PlayerProfile, target: MonsterDefinition): number {
  const dps = referenceDpsAgainst(p, target);
  return dps > 0 ? target.stats.hp / dps : Number.POSITIVE_INFINITY;
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function maxBy<T>(items: T[], score: (item: T) => number): T | undefined {
  if (items.length === 0) return undefined;
  return items.reduce((best, item) => (score(item) > score(best) ? item : best));
}

// ─── Generic view model (rendered to both HTML and Markdown) ──────────────────

interface DataView { title: string; headers: string[]; rows: Array<Array<string | number>>; note?: string }

interface BiomeComparison {
  name: string;
  meanHp: number;
  maxHp: number;
  meanIncomingDps: number;
  maxIncomingDps: number;
  maxSpikePctHp: number;
  maxSpikeMob: string;
  density: number | null;
  meanEssence: number;
  meanBiomeXp: number;
}

function walkView(rungs: WalkRung[]): DataView {
  return {
    title: 'The Walk',
    note:
      'Each biome measured against the player who actually arrives there, in authored '
      + 'ladder order. Arrival gear is DERIVED: Global Mastery accrues as you master each '
      + 'biome, and GM is the only gate on upgrade level, so the ladder walks +0 to +4. '
      + '"Cost/kill" is the share of your health pool one average kill spends — it folds '
      + 'offence and defence into one number. "Step" is this rung\'s cost divided by the '
      + 'previous rung\'s: 1.0 means the biome got no harder once your own growth is '
      + 'counted. Labels flag extremes for investigation; they are not pass/fail gates.',
    headers: ['#', 'Biome', 'Arrive with', 'GM', 'Mob TTK', 'Your TTL', 'Worst hit %HP', 'Cost/kill', 'Step', ''],
    rows: rungs.map((r) => [
      r.index + 1,
      r.biomeName,
      r.profile.gearLabel,
      r.gm,
      `${asNumber(r.mobTtkSec)}s`,
      ttl(r.ttlSec),
      `${asNumber(r.worstSpikePct * 100)}% (${r.worstSpikeName})`,
      `${asNumber(r.burden * 100)}%`,
      r.step === null ? '-' : `${asNumber(r.step)}x`,
      stepLabel(r.step),
    ]),
  };
}

function walkSignalsView(rungs: WalkRung[]): DataView {
  const rows: Array<Array<string | number>> = [];
  for (const r of rungs) {
    const label = stepLabel(r.step);
    if (label === 'WALL') {
      rows.push([r.biomeName, 'Difficulty wall', `cost/kill jumps ${asNumber(r.step ?? 0)}x over the previous rung`]);
    } else if (label === 'EASIER' || label === 'flat') {
      rows.push([r.biomeName, 'No progression', `cost/kill is ${asNumber(r.step ?? 0)}x the previous rung — the climb stalls here`]);
    }
    if (r.worstSpikePct >= 1) {
      rows.push([r.biomeName, 'One-shot', `${r.worstSpikeName} hits for ${asNumber(r.worstSpikePct * 100)}% of the arrival player's maxHP`]);
    } else if (r.worstSpikePct >= 0.5) {
      rows.push([r.biomeName, 'Heavy spike', `${r.worstSpikeName} hits for ${asNumber(r.worstSpikePct * 100)}% of maxHP`]);
    }
    if (Number.isFinite(r.ttlSec) && r.ttlSec < 15) {
      rows.push([r.biomeName, 'Low TTL', `${asNumber(r.ttlSec)}s to die under mean pressure (no recovery modelled)`]);
    }
  }
  return {
    title: 'Walls & Stalls',
    note: rows.length
      ? 'Only the rungs that break the pattern. Everything absent from this table walked cleanly.'
      : 'Nothing flagged: every rung climbed within the step band and no mob spikes past half the arrival player\'s health.',
    headers: ['Biome', 'Signal', 'Detail'],
    rows: rows.length ? rows : [['-', 'clean walk', 'no walls, stalls, or one-shots at this tier']],
  };
}

function crossBiomeComparisons(biomeTier: number, profiles: PlayerProfile[]): BiomeComparison[] {
  const entry = profiles.find((p) => p.label.startsWith('Entry')) ?? profiles[0];
  if (!entry) return [];
  return biomeGroupsAtTier(biomeTier)
    .filter((group) => group.mobs.length > 0)
    .map((group) => {
      const incoming = group.mobs.map((mob) => threatAgainst(entry, mob, false).incomingDps);
      const spikeMob = maxBy(group.mobs, (mob) => mitigatedSpike(entry, mob))!;
      return {
        name: group.biome.name,
        meanHp: mean(group.mobs.map((mob) => mob.stats.hp)),
        maxHp: Math.max(...group.mobs.map((mob) => mob.stats.hp)),
        meanIncomingDps: mean(incoming),
        maxIncomingDps: Math.max(...incoming),
        maxSpikePctHp: mitigatedSpike(entry, spikeMob) / Math.max(1, entry.maxHp),
        maxSpikeMob: spikeMob.name,
        density: group.biome.mobDensity ?? null,
        meanEssence: mean(group.mobs.map((mob) => mob.rewards.essence)),
        meanBiomeXp: mean(group.mobs.map((mob) => mob.rewards.biomeXp ?? 0)),
      };
    })
    .sort((a, b) => b.meanIncomingDps - a.meanIncomingDps || b.maxIncomingDps - a.maxIncomingDps);
}

/** One ranked, fixed-tier view where danger and payout can be read together. */
function crossBiomeComparisonView(biomeTier: number, profiles: PlayerProfile[]): DataView {
  const entry = profiles.find((p) => p.label.startsWith('Entry')) ?? profiles[0];
  const comparisons = crossBiomeComparisons(biomeTier, profiles);
  const tierMedianThreat = median(comparisons.map((row) => row.meanIncomingDps));
  return {
    title: 'Cross-Biome Threat & Reward',
    note: `Every biome at tier ${biomeTier}, ranked by mean incoming DPS against ${entry?.label ?? 'the entry reference player'}. Threat is post-mitigation; spike is the worst individual hit. Rewards are authored per-kill means, not hourly yield. The threat index is relative to this tier's sibling median, not a target.`,
    headers: ['Biome', 'Threat index', 'Mean HP', 'Max HP', 'Mean incoming DPS', 'Max incoming DPS', 'Worst spike %HP', 'Density', 'Essence / kill', 'Biome XP / kill'],
    rows: comparisons.map((row) => [
      row.name,
      tierMedianThreat > 0 ? `×${asNumber(row.meanIncomingDps / tierMedianThreat)}` : '-',
      asNumber(row.meanHp),
      asNumber(row.maxHp),
      asNumber(row.meanIncomingDps),
      asNumber(row.maxIncomingDps),
      `${pct(row.maxSpikePctHp)} (${row.maxSpikeMob})`,
      row.density ?? '-',
      asNumber(row.meanEssence),
      asNumber(row.meanBiomeXp),
    ]),
  };
}

function biomeDeviationView(biomeTier: number, profiles: PlayerProfile[]): DataView {
  const comparisons = crossBiomeComparisons(biomeTier, profiles);
  const rows: Array<{ magnitude: number; cells: Array<string | number> }> = [];
  const metrics = [
    { axis: 'Threat', label: 'Mean incoming DPS', value: (row: BiomeComparison) => row.meanIncomingDps, format: asNumber },
    { axis: 'Threat', label: 'Max incoming DPS', value: (row: BiomeComparison) => row.maxIncomingDps, format: asNumber },
    { axis: 'Threat', label: 'Worst spike %HP', value: (row: BiomeComparison) => row.maxSpikePctHp, format: pct },
    { axis: 'Exposure', label: 'Mob density', value: (row: BiomeComparison) => row.density ?? 0, format: asNumber },
    { axis: 'Reward', label: 'Essence / kill', value: (row: BiomeComparison) => row.meanEssence, format: asNumber },
    { axis: 'Reward', label: 'Biome XP / kill', value: (row: BiomeComparison) => row.meanBiomeXp, format: asNumber },
  ] as const;

  for (const metric of metrics) {
    const siblingMedian = median(comparisons.map(metric.value));
    if (siblingMedian <= 0) continue;
    for (const comparison of comparisons) {
      const value = metric.value(comparison);
      const deviation = value / siblingMedian - 1;
      if (Math.abs(deviation) < OUTLIER_PCT) continue;
      rows.push({
        magnitude: Math.abs(deviation),
        cells: [
          comparison.name,
          metric.axis,
          metric.label,
          metric.format(value),
          metric.format(siblingMedian),
          `${deviation >= 0 ? '+' : ''}${pct(deviation)}`,
        ],
      });
    }
  }

  rows.sort((a, b) => b.magnitude - a.magnitude || String(a.cells[0]).localeCompare(String(b.cells[0])));
  return {
    title: 'Cross-Biome Deviation Signals',
    note: `Discovery-only signals for values at least ${Math.round(OUTLIER_PCT * 100)}% from the tier-sibling median. Deliberate outliers are expected; this is neither a pass/fail gate nor a recommended balance band.`,
    headers: ['Biome', 'Axis', 'Metric', 'Value', 'Sibling median', 'Deviation'],
    rows: rows.map((row) => row.cells),
  };
}

// 1. Mob Stat Summary
function mobStatRow(monster: MonsterDefinition): Array<string | number> {
  return [
    monster.name,
    monsterRole(monster),
    asNumber(monster.stats.hp),
    asNumber(monster.stats.attack),
    `${asNumber(aps(monster))} / ${asNumber(monster.stats.attackCooldown)}ms`,
    asNumber(rawDirectDps(monster)),
    asNumber(monsterDotDps(monster).dps),
    asNumber(monster.stats.plating),
    pct(monster.stats.damageReduction),
    asNumber(monster.stats.attackRange),
    asNumber(monster.stats.speed),
    `×${asNumber(monsterSpikeMult(monster))}`,
    monsterSpecials(monster).join(', ') || '-',
  ];
}

function mobStatSummaryView(biomeTier: number): DataView {
  const rows: Array<Array<string | number>> = [];
  for (const group of biomeGroupsAtTier(biomeTier)) {
    for (const mob of [...group.mobs].sort((a, b) => rawTotalDps(b) - rawTotalDps(a))) {
      rows.push([group.biome.name, ...mobStatRow(mob)]);
    }
  }
  return {
    title: 'Mob Stat Summary',
    note: `Every non-boss spawn in biome tier ${biomeTier}, sorted by raw total DPS within each biome. Raw DPS is pre-mitigation (attack × APS); DoT/s assumes full refreshed stacks.`,
    headers: ['Biome', 'Mob', 'Role', 'HP', 'Attack', 'APS / CD', 'Raw DPS', 'DoT/s', 'Plating', 'DR', 'Range', 'Speed', 'Spike', 'Specials'],
    rows,
  };
}

// 2. Biome Threat Summary
function biomeThreatSummaryView(biomeTier: number): DataView {
  const rows: Array<Array<string | number>> = [];
  for (const group of biomeGroupsAtTier(biomeTier)) {
    const mobs = group.mobs;
    if (mobs.length === 0) continue;
    const hardest = maxBy(mobs, (m) => rawDirectDps(m))!;
    const fastest = maxBy(mobs, (m) => aps(m))!;
    const tankiest = maxBy(mobs, (m) => m.stats.hp + m.stats.plating * 8)!;
    const dotHeavy = maxBy(mobs, (m) => monsterDotDps(m).dps);
    const spiker = maxBy(mobs, (m) => monsterSpikeMult(m) * m.stats.attack)!;
    const types = mobs.map(damageType);
    const dotCount = types.filter((t) => t !== 'Direct').length;
    const notes: string[] = [];
    if (group.biome.mobDensity != null) notes.push(`density ${group.biome.mobDensity}`);
    notes.push(`${dotCount}/${mobs.length} carry DoT`);
    rows.push([
      group.biome.name,
      mobs.length,
      asNumber(mean(mobs.map((m) => m.stats.hp))),
      asNumber(mean(mobs.map(rawDirectDps))),
      asNumber(mean(mobs.map((m) => m.stats.attack))),
      asNumber(mean(mobs.map(aps))),
      asNumber(mean(mobs.map((m) => monsterDotDps(m).dps))),
      hardest.name,
      fastest.name,
      tankiest.name,
      dotHeavy && monsterDotDps(dotHeavy).dps > 0 ? dotHeavy.name : '-',
      `${spiker.name} ×${asNumber(monsterSpikeMult(spiker))}`,
      notes.join('; '),
    ]);
  }
  return {
    title: 'Biome Threat Summary',
    note: `Per-biome aggregates for biome tier ${biomeTier}. "Hardest hitter" uses raw direct DPS; "tankiest" weights plating ×8 against HP.`,
    headers: ['Biome', 'Mobs', 'Avg HP', 'Avg DPS', 'Avg atk', 'Avg APS', 'Avg DoT/s', 'Hardest', 'Fastest', 'Tankiest', 'DoT-heavy', 'Biggest spike', 'Notes'],
    rows,
  };
}

// 3. Player Matchup Summary
function playerMatchupView(biomeTier: number, profiles: PlayerProfile[]): DataView {
  const rows: Array<Array<string | number>> = [];
  for (const group of biomeGroupsAtTier(biomeTier)) {
    if (group.mobs.length === 0) continue;
    // Average the resolved per-mob pressure. Building a synthetic mob from mean
    // attack/cooldown is not equivalent because cadence and mitigation are nonlinear.
    for (const p of profiles) {
      const incomingDps = mean(group.mobs.map((mob) => threatAgainst(p, mob, false).incomingDps));
      const ttlSec = incomingDps > 0 ? p.maxHp / incomingDps : Number.POSITIVE_INFINITY;
      const worstSpikeMob = maxBy(group.mobs, (m) => mitigatedSpike(p, m))!;
      const spikePctHp = mitigatedSpike(p, worstSpikeMob) / Math.max(1, p.maxHp);
      const status = threatStatus(spikePctHp, ttlSec, false);
      rows.push([
        group.biome.name,
        p.label,
        asNumber(incomingDps),
        `${pct(spikePctHp)} (${worstSpikeMob.name})`,
        ttl(ttlSec),
        status,
      ]);
    }
  }
  return {
    title: 'Player Matchup Summary',
    note: `Mean resolved per-mob pressure vs the four reference players, with worst-spike %HP from the biome's hardest-spiking individual mob. Incoming DPS folds plating/DR/evasion; TTL = maxHP ÷ incoming (no player recovery — see eHP packet). Status: Safe/Risky/Blocked (mob risk<${MOB_TTL_RISK_SEC}s, block<${MOB_TTL_BLOCK_SEC}s, ≥50% spike = Risky, one-shot = Blocked).${profiles[0]?.usedFallbackTier ? ` ⚠ No tier-${biomeTier + 1} gear authored; using best-available T${maxItemTier()} as reference.` : ''}`,
    headers: ['Biome', 'Player', 'Incoming DPS', 'Worst spike %HP', 'TTL pressure', 'Status'],
    rows,
  };
}

// 4. Boss / Elite Table
function bossTableView(biomeTier: number, profiles: PlayerProfile[]): DataView {
  const bossReady = profiles.find((p) => p.label.startsWith('Boss-ready')) ?? profiles[profiles.length - 1];
  const rows: Array<Array<string | number>> = [];
  for (const group of biomeGroupsAtTier(biomeTier)) {
    for (const boss of group.bosses) {
      const t = bossReady ? threatAgainst(bossReady, boss, true) : null;
      const ttk = bossReady ? expectedTtkSec(bossReady, boss) : Number.POSITIVE_INFINITY;
      const defenseBits = [
        `plate ${asNumber(boss.stats.plating)}`,
        `DR ${pct(boss.stats.damageReduction)}`,
        boss.enemyShield ? `shield ${pct(boss.enemyShield.shieldPct)}` : '',
        boss.enemySoftCap ? `softcap ${pct(boss.enemySoftCap.capPct)}` : '',
        (boss.evasion ?? 0) > 0 ? `evasion ${pct(boss.evasion ?? 0)}` : '',
      ].filter(Boolean).join(', ');
      rows.push([
        boss.name,
        group.biome.name,
        asNumber(boss.stats.hp),
        `${asNumber(boss.stats.attack)} @ ${asNumber(aps(boss))} aps`,
        asNumber(rawTotalDps(boss)),
        `×${asNumber(monsterSpikeMult(boss))}`,
        defenseBits || '-',
        ttl(ttk),
        t ? ttl(t.ttlSec) : '-',
        t ? t.status : '-',
        bossNotes(boss, ttk, t),
      ]);
    }
  }
  return {
    title: 'Boss / Elite Table',
    note: `Bosses for biome tier ${biomeTier} vs the boss-ready reference player (${bossReady?.gearLabel ?? 'n/a'}). TTK uses the shared class-aware planning estimator; T3 specs, abilities, and shields/soft-caps remain unmodeled. TTL is player survival with no recovery modeled.`,
    headers: ['Boss', 'Biome', 'HP', 'Attack profile', 'Raw DPS', 'Spike', 'Defenses', 'Expected TTK', 'Player TTL', 'Status', 'Notes'],
    rows,
  };
}

function bossNotes(boss: MonsterDefinition, ttk: number, threat: Threat | null): string {
  const notes: string[] = [];
  if (Number.isFinite(ttk) && ttk < BOSS_TTK_TRIVIAL_SEC) notes.push('TTK trivial');
  if (ttk > BOSS_TTK_SLOG_SEC) notes.push('TTK slog');
  if (threat?.status === 'Blocked') notes.push(threat.spikePctHp >= 1 ? 'one-shots player' : 'kills player fast');
  if (boss.enemyShield || boss.enemySoftCap) notes.push('TTK undercounted (shield/softcap)');
  if (boss.ultimateEncounter) notes.push('staged encounter');
  return notes.join('; ') || '-';
}

// 5. Outlier Summary
function outlierView(biomeTier: number, profiles: PlayerProfile[]): DataView {
  const mobs = allMobsAtTier(biomeTier);
  const rows: Array<Array<string | number>> = [];
  if (mobs.length === 0) return { title: 'Outlier Summary', headers: ['Flag'], rows: [], note: 'No mobs at this tier.' };

  const avgHp = mean(mobs.map((m) => m.stats.hp));
  const avgDps = mean(mobs.map(rawDirectDps));
  const avgSpike = mean(mobs.map((m) => m.stats.attack * monsterSpikeMult(m)));

  const flag = (metric: string, value: number, avg: number, mob: MonsterDefinition) => {
    if (avg <= 0) return;
    const ratio = value / avg;
    if (ratio >= 1 + OUTLIER_PCT) rows.push([`${metric} > +${Math.round(OUTLIER_PCT * 100)}% tier avg`, mob.name, `${asNumber(value)} vs avg ${asNumber(avg)} (×${asNumber(ratio)})`]);
    else if (ratio <= 1 - OUTLIER_PCT) rows.push([`${metric} < -${Math.round(OUTLIER_PCT * 100)}% tier avg`, mob.name, `${asNumber(value)} vs avg ${asNumber(avg)} (×${asNumber(ratio)})`]);
  };
  for (const mob of mobs) {
    flag('HP', mob.stats.hp, avgHp, mob);
    flag('Raw DPS', rawDirectDps(mob), avgDps, mob);
    flag('Spike', mob.stats.attack * monsterSpikeMult(mob), avgSpike, mob);
  }

  // Bosses too easy / hard vs the boss-ready player.
  const bossReady = profiles.find((p) => p.label.startsWith('Boss-ready'));
  if (bossReady) {
    for (const group of biomeGroupsAtTier(biomeTier)) {
      for (const boss of group.bosses) {
        const ttk = expectedTtkSec(bossReady, boss);
        const t = threatAgainst(bossReady, boss, true);
        if (Number.isFinite(ttk) && ttk < BOSS_TTK_TRIVIAL_SEC) rows.push(['short boss TTK', boss.name, `planning TTK ${ttl(ttk)}`]);
        if (t.status === 'Blocked' || (Number.isFinite(t.ttlSec) && t.ttlSec < BOSS_TTL_BLOCK_SEC)) rows.push(['high boss lethality', boss.name, `player TTL ${ttl(t.ttlSec)}, spike ${pct(t.spikePctHp)}`]);
      }
    }
  }

  // Biomes with no meaningful threat / single damage type.
  for (const group of biomeGroupsAtTier(biomeTier)) {
    if (group.mobs.length === 0) continue;
    const biomeAvgDps = mean(group.mobs.map(rawTotalDps));
    if (biomeAvgDps < avgDps * 0.4) rows.push(['low sustained-threat signal', group.biome.name, `avg total DPS ${asNumber(biomeAvgDps)} vs tier avg ${asNumber(avgDps)}`]);
    const types = group.mobs.map(damageType);
    for (const t of ['Direct', 'DoT'] as const) {
      const share = types.filter((x) => x === t).length / types.length;
      if (group.mobs.length >= 2 && share >= DAMAGE_TYPE_DOMINANCE) rows.push(['biome single-type', group.biome.name, `${Math.round(share * 100)}% ${t} damage`]);
    }
  }

  return {
    title: 'Mob / Boss Diagnostic Signals',
    note: `Attention signals only: mobs >±${Math.round(OUTLIER_PCT * 100)}% of biome-tier average on HP / raw DPS / spike, bosses outside the TTK/TTL observation bands, and narrow biome threat profiles. These are not verdicts or balance gates.`,
    headers: ['Flag', 'Subject', 'Detail'],
    rows,
  };
}

// ─── HTML rendering ─────────────────────────────────────────────────────────

function statusCellHtml(c: string | number): string {
  if (c === 'Safe' || c === 'Risky' || c === 'Blocked') {
    const color = c === 'Safe' ? '#15803d' : c === 'Risky' ? '#b45309' : '#b91c1c';
    return `<td style="color:${color};font-weight:700">${c}</td>`;
  }
  return `<td>${html(c)}</td>`;
}

function htmlTable(headers: string[], rows: Array<Array<string | number>>): string {
  if (rows.length === 0) return '<p>No data.</p>';
  return `<table><thead><tr>${headers.map((h) => `<th>${html(h)}</th>`).join('')}</tr></thead><tbody>${
    rows.map((r) => `<tr>${r.map(statusCellHtml).join('')}</tr>`).join('')
  }</tbody></table>`;
}

function renderHtmlView(view: DataView, collapsed = false): string {
  const note = view.note ? `<p class="meta">${html(view.note)}</p>` : '';
  const body = `<h3>${html(view.title)}</h3>${note}${htmlTable(view.headers, view.rows)}`;
  if (!collapsed) return body;
  return `<details><summary>${html(view.title)}</summary>${note}${htmlTable(view.headers, view.rows)}</details>`;
}

function renderTierSection(biomeTier: number): string {
  const profiles = playerProfilesForBiomeTier(biomeTier);
  const rungs = buildWalk(biomeTier);
  const playerTier = Math.min(biomeTier + 1, maxItemTier());
  return `
    <section>
      <h2>Biome Tier ${biomeTier}</h2>
      <p class="meta"><strong>Read the Walk first.</strong> It measures each biome against the player who actually arrives there. Everything below it holds the player fixed, so it compares biomes at one power level rather than along the climb.${profiles[0]?.usedFallbackTier ? ` No tier-${biomeTier + 1} gear authored yet — best-available T${maxItemTier()} used.` : ''}</p>
      ${renderHtmlView(walkView(rungs))}
      ${renderHtmlView(walkSignalsView(rungs))}
      <h3>Detail — fixed reference (tier ${playerTier})</h3>
      ${renderHtmlView(bossTableView(biomeTier, profiles))}
      ${renderHtmlView(outlierView(biomeTier, profiles))}
      ${renderHtmlView(crossBiomeComparisonView(biomeTier, profiles), true)}
      ${renderHtmlView(biomeDeviationView(biomeTier, profiles), true)}
      ${renderHtmlView(playerMatchupView(biomeTier, profiles), true)}
      ${renderHtmlView(biomeThreatSummaryView(biomeTier), true)}
      ${renderHtmlView(mobStatSummaryView(biomeTier), true)}
    </section>`;
}

function renderReport(tiers: number[]): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MMO Idle Monster Balance Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #1f2933; background: #f7f8fa; }
    h1, h2, h3 { margin: 0 0 8px; }
    h1 { font-size: 28px; }
    h2 { margin-top: 28px; padding-top: 18px; border-top: 2px solid #c8d0d9; }
    h3 { font-size: 15px; margin-top: 18px; }
    p { max-width: 1100px; line-height: 1.45; }
    .meta { color: #5c6670; font-size: 11px; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0 18px; background: white; }
    th, td { border: 1px solid #d8dee6; padding: 6px 8px; text-align: left; vertical-align: top; font-size: 12px; }
    th { background: #e8edf2; position: sticky; top: 0; z-index: 1; }
    details { margin-top: 10px; }
    summary { cursor: pointer; font-weight: 700; margin-bottom: 8px; }
  </style>
</head>
<body>
  <h1>MMO Idle Monster Balance &amp; Threat Report</h1>
  <p class="meta"><strong>${LOADOUT_MODEL_NOTE}</strong></p>
  <p>
    Monster-centric balance report built from shared monster, item, skill, and stat formulas plus the shared
    class-aware DPS estimator. The subject is the world's offence: every spawn and boss is profiled and bucketed by
    biome tier. Player-facing numbers use neutral reference players rebuilt with <code>recalculatePlayerStats</code>.
  </p>
  <p class="meta">
    Not a combat simulator: no movement, kiting, real AoE target count, AI, party effects, or player recovery
    throughput (that lives in the eHP report). Reference player DPS includes each root archetype's sustained cycle and
    full Conduit formations; T3 specs, abilities, and target-state mechanics remain omitted. Raw mob DPS
    is pre-mitigation; DoT/s assumes full refreshed stacks; spike is the largest single-hit multiplier available.
  </p>
  ${tiers.map(renderTierSection).join('\n')}
</body>
</html>`;
}

// ─── Markdown / LLM packet ─────────────────────────────────────────────────────

function mdTable(headers: string[], rows: Array<Array<string | number>>): string {
  if (rows.length === 0) return '_No data._\n';
  return [
    `| ${headers.map(md).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(md).join(' | ')} |`),
  ].join('\n') + '\n';
}

function renderMdView(view: DataView): string {
  return `## ${view.title}\n\n${view.note ? `_${md(view.note)}_\n\n` : ''}${mdTable(view.headers, view.rows)}`;
}

function renderLlmPacket(biomeTier: number): string {
  const profiles = playerProfilesForBiomeTier(biomeTier);
  const rungs = buildWalk(biomeTier);
  const playerTier = Math.min(biomeTier + 1, maxItemTier());
  const mobs = allMobsAtTier(biomeTier);
  const avgHp = mean(mobs.map((m) => m.stats.hp));
  const avgDps = mean(mobs.map(rawTotalDps));

  return `# MMO Idle Monster Balance Packet - Biome Tier ${biomeTier}

Generated from \`tools/mob-report.ts --llm-packet\`. Markdown only. Companion to the DPS and eHP packets.

## Assumptions / Omissions

- ${LOADOUT_MODEL_NOTE}

**Read the Walk first.** It is the only section that measures each biome against the
player who actually arrives there. Everything below it is detail for a biome the Walk
already told you to look at.

- Monster-centric: subject is the world's offence and durability, bucketed by biome tier ${biomeTier}.
- Reference players are tier ${playerTier} (a player of tier P fights biome tier P-1)${profiles[0]?.usedFallbackTier ? `; **no tier-${biomeTier + 1} gear authored yet, best-available T${maxItemTier()} used as the reference**` : ''}. Defensive stats are averaged over spec-agnostic class builds × armor × recovery.
- Reference player DPS uses shared \`estimatePlayerDps\` across concrete class builds, including full Conduit formations. T3 specialization, abilities, target-state mechanics, and shields/soft-caps remain outside this planning TTK; cross-check the detailed DPS packet for spec-level clear speed.
- TTL = player maxHP ÷ incoming DPS with **no player recovery** (that lives in the eHP packet). Incoming DPS folds plating/DR/averaged evasion; player DoT-resistance is not applied here.
- Not a combat simulator: no movement, kiting, real AoE target count, AI, or party effects. ${mobs.length} mobs; tier avg HP ${asNumber(avgHp)}, avg total DPS ${asNumber(avgDps)}.

${renderMdView(walkView(rungs))}
${renderMdView(walkSignalsView(rungs))}

## Arrival Players

_Derived, not assumed: GM accrues per biome mastered and gates upgrade level, so the ladder walks +0 to +4._

${mdTable(
    ['#', 'Arrive at', 'Gear', 'GM', 'maxHP', 'Plating', 'DR', 'Dodge', 'Ref atk', 'Ref APS'],
    rungs.map((r) => [r.index + 1, r.biomeName, r.profile.gearLabel, r.gm, asNumber(r.profile.maxHp), asNumber(r.profile.plating), pct(r.profile.damageReduction), pct(r.profile.dodgeRate), asNumber(r.profile.attack), asNumber(1000 / Math.max(100, r.profile.attackCooldown))]),
  )}

---

## Detail

_Fixed-reference views, kept for cross-biome comparison at one power level. These do NOT account for the walk — read them only after the Walk has pointed you at a biome._

${renderMdView(bossTableView(biomeTier, profiles))}
${renderMdView(outlierView(biomeTier, profiles))}
${renderMdView(mobStatSummaryView(biomeTier))}`;
}

// ─── Entrypoint ─────────────────────────────────────────────────────────────

async function writeLlmPackets(): Promise<void> {
  const tiers = reportBiomeTiers();
  const selected = OPTIONS.tier != null ? [OPTIONS.tier] : tiers;
  for (const tier of selected) {
    if (!tiers.includes(tier)) throw new Error(`Use --llm-packet with --tier=<${tiers.join('|')}>`);
    const outPath = path.join(REPO_ROOT, 'reports', `mob-llm-packet-t${tier}.md`);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, renderLlmPacket(tier), 'utf8');
    console.log(`Wrote ${outPath}`);
  }
}

async function main(): Promise<void> {
  // Fail loudly if the report's ladder and the authored T1 policy ever drift.
  assertLadderMatchesAuthoredPolicy();
  if (OPTIONS.llmPacket) {
    await writeLlmPackets();
    return;
  }
  const tiers = OPTIONS.tier != null ? [OPTIONS.tier] : reportBiomeTiers();
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, renderReport(tiers), 'utf8');
  console.log(`Wrote ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
