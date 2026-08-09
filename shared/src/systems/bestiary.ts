import { NODE_BIOMES } from '../world/nodeBiomes';
import { BIOME_DATABASE } from '../biomeDatabase';
import { MONSTER_DATABASE, monsterIsRanged, monsterKites } from '../data/monsters';
import type { MonsterDefinition } from '../data/monsters/types';
import type { MonsterBehavior } from '../data/monsters/behavior';
import { getDungeonDef } from '../dungeons/dungeonDatabase';
import type { DungeonDef, DungeonMonsterModifiers } from '../dungeons/dungeonTypes';
import { GAME_CONFIG } from '../config/gameConfig';

// ─── Zone bestiary ──────────────────────────────────────────────────────────
// Pure presentation helper: from the player's current nodeId, resolve which
// monsters spawn there and their effective (post-modifier) stats. Reads only
// static shared data — no server round-trip — so the client can render the
// bestiary entirely from the node the player is standing in.

export type BestiaryRole = 'trash' | 'guardian' | 'boss';

/** Effective monster stats after any dungeon guardian modifiers are applied. */
export interface BestiaryStats {
  hp: number;
  attack: number;
  /** Sustained single-target DPS: attack × (1000 / attackCooldown). */
  dps: number;
  plating: number;
  /** Damage reduction as a fraction (0–1). */
  damageReduction: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  pullRange: number;
  leashRange: number;
  /** Per-hit dodge fraction (0–1). */
  evasion: number;
  isRanged: boolean;
  behavior: MonsterBehavior;
}

export interface BestiaryEntry {
  /** monsterTypeId — matches MONSTER_DATABASE keys. */
  id: string;
  name: string;
  /** Phaser hex color, used as the sprite fallback / accent. */
  color: number;
  role: BestiaryRole;
  /** Effective stats (after modifiers). */
  stats: BestiaryStats;
  /** Unmodified database stats. Present only when modifiers changed the values. */
  baseStats?: BestiaryStats;
  /** True when this zone scales the monster (dungeon guardian buffs). */
  modified: boolean;
  /** Modifiers that were applied — drives DoT scaling text in the detail view. */
  modifiers?: DungeonMonsterModifiers;
  /** Guard label this entry was drawn from ("Deep Watch"), when applicable. */
  guardLabel?: string;
  /** Short combat-profile hint (authored or derived). */
  profile: string;
  /** Raw definition, for the detail view and mechanic descriptor. */
  def: MonsterDefinition;
}

export interface ZoneBestiary {
  nodeId: string;
  biomeGroup: string;
  biomeName: string;
  biomeTier: number;
  isDungeon: boolean;
  /** True when this node runs the guarded-altar dungeon loop. */
  hasGuardedAltar: boolean;
  /** Ordered trash → guardians → boss. */
  entries: BestiaryEntry[];
}

/**
 * A short combat-profile hint for the bestiary. Returns the authored `profile`
 * when present, otherwise derives one from the monster's stats and mechanics:
 * an optional adjective or two ("charging", "fast-attacking", "slow"…) plus a
 * primary-role noun ("hard hitter", "swarmer", "attrition specialist"…).
 */
export function resolveMonsterProfile(def: MonsterDefinition): string {
  if (def.profile) return def.profile;

  const cd = def.stats.attackCooldown;
  const fast = cd <= 1300;
  const slow = cd >= 2600;
  const armored = def.stats.plating >= 10 || def.stats.damageReduction >= 0.08;
  const bigHit =
    !!def.cadenceFinisher || !!def.empoweredCooldown || !!def.enemySoftCap;
  const dot = !!def.dotEffect;
  const charges = !!def.chargeOnAggro;
  const ranged = monsterIsRanged(def);
  const shielded = !!def.enemyShield;
  const evasive = !!def.evasion;
  const disables = !!def.slowEffect || !!def.rampDebuff;
  const density =
    BIOME_DATABASE.get(def.biome)?.mobDensity ?? GAME_CONFIG.MONSTERS_PER_NODE;
  const swarm = density >= 13;

  let noun: string;
  if (bigHit) noun = 'hard hitter';
  else if (armored) noun = 'armored bruiser';
  else if (swarm && dot) noun = 'attrition swarmer';
  else if (swarm) noun = 'swarmer';
  else if (dot) noun = 'attrition specialist';
  else if (disables) noun = 'disabler';
  else if (monsterKites(def)) noun = 'kiter';
  else if (ranged) noun = 'ranged attacker';
  else if (evasive) noun = 'evasive skirmisher';
  else if (shielded) noun = 'shielded fighter';
  else noun = 'skirmisher';

  const adjs: string[] = [];
  if (charges) adjs.push('charging');
  if (ranged && noun !== 'ranged attacker') adjs.push('ranged');
  if (adjs.length < 2) {
    if (fast) adjs.push('fast-attacking');
    else if (slow) adjs.push('slow');
  }

  const phrase = [...adjs.slice(0, 2), noun].join(' ');
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

function computeStats(
  def: MonsterDefinition,
  mods?: DungeonMonsterModifiers,
): BestiaryStats {
  const s = def.stats;
  const hpMult = mods?.hpMult ?? 1;
  const atkMult = mods?.atkMult ?? 1;
  const asMult = mods?.attackSpeedMult ?? 1;
  const moveMult = mods?.moveSpeedMult ?? 1;
  const armorMult = mods?.armorMult ?? 1;
  const drAdd = mods?.drAdd ?? 0;

  const attack = Math.round(s.attack * atkMult);
  // Higher attackSpeedMult means a shorter cooldown (faster attacks).
  const attackCooldown = Math.max(1, Math.round(s.attackCooldown / asMult));
  const dps =
    attackCooldown > 0 ? Math.round((attack * 1000) / attackCooldown) : attack;

  return {
    hp: Math.round(s.hp * hpMult),
    attack,
    dps,
    plating: Math.round(s.plating * armorMult),
    damageReduction: Math.min(1, Math.max(0, s.damageReduction + drAdd)),
    speed: Math.round(s.speed * moveMult),
    attackRange: s.attackRange,
    attackCooldown,
    pullRange: s.pullRange,
    leashRange: def.ai.leashRange,
    evasion: def.evasion ?? 0,
    isRanged: monsterIsRanged(def),
    behavior: def.behavior,
  };
}

function identityMods(mods?: DungeonMonsterModifiers): boolean {
  if (!mods) return true;
  return (
    (mods.hpMult ?? 1) === 1 &&
    (mods.atkMult ?? 1) === 1 &&
    (mods.attackSpeedMult ?? 1) === 1 &&
    (mods.moveSpeedMult ?? 1) === 1 &&
    (mods.armorMult ?? 1) === 1 &&
    (mods.drAdd ?? 0) === 0 &&
    (mods.dotMult ?? 1) === 1
  );
}

function makeEntry(
  id: string,
  role: BestiaryRole,
  mods?: DungeonMonsterModifiers,
  guardLabel?: string,
): BestiaryEntry | null {
  const def = MONSTER_DATABASE.get(id);
  if (!def) return null;
  const modified = !identityMods(mods);
  return {
    id,
    name: def.name,
    color: def.color,
    role,
    stats: computeStats(def, mods),
    baseStats: modified ? computeStats(def) : undefined,
    modified,
    modifiers: modified ? mods : undefined,
    guardLabel,
    profile: resolveMonsterProfile(def),
    def,
  };
}

/** Distinct guardian monster ids across every guard station, leaders first. */
function guardianMonsterIds(def: DungeonDef): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (monsterId: string) => {
    if (seen.has(monsterId)) return;
    seen.add(monsterId);
    out.push(monsterId);
  };
  for (const group of def.guard.groups) push(group.leaderMonsterId);
  for (const group of def.guard.groups) {
    for (const follower of group.followers ?? []) push(follower.monsterId);
  }
  return out;
}

/**
 * Resolve the full bestiary for the zone the given node belongs to. Returns null
 * for unknown nodes or zones with no spawnable monsters (e.g. the clearing's pool
 * is intentionally tiny — that still resolves; truly empty zones return an entry
 * list of length 0). The clearing and un-authored tiers simply yield few/zero
 * entries.
 */
export function resolveZoneBestiary(nodeId: string): ZoneBestiary | null {
  const info = NODE_BIOMES[nodeId];
  if (!info) return null;

  const biome = BIOME_DATABASE.get(info.biomeGroup);
  const biomeName = biome?.name ?? info.biomeGroup;
  const tier = info.biomeTier;
  const entries: BestiaryEntry[] = [];

  const dungeon = getDungeonDef(nodeId);
  if (dungeon) {
    const guardianMods = dungeon.guard.modifiers;
    for (const id of guardianMonsterIds(dungeon)) {
      const e = makeEntry(id, 'guardian', guardianMods, dungeon.guard.label);
      if (e) entries.push(e);
    }
    const bossEntry = makeEntry(dungeon.boss.bossId, 'boss');
    if (bossEntry) entries.push(bossEntry);
  } else if (info.isDungeon) {
    const dungeonMods: DungeonMonsterModifiers = {
      hpMult: GAME_CONFIG.DUNGEON_HP_MULT,
      atkMult: GAME_CONFIG.DUNGEON_ATK_MULT,
    };
    for (const id of biome?.monsterPoolByTier[tier] ?? []) {
      const e = makeEntry(id, 'trash', dungeonMods);
      if (e) entries.push(e);
    }
    const bossIds = info.bossTypeId
      ? [info.bossTypeId]
      : biome?.bossPoolByTier?.[tier] ?? [];
    for (const id of bossIds) {
      const e = makeEntry(id, 'boss');
      if (e) entries.push(e);
    }
  } else {
    for (const id of biome?.monsterPoolByTier[tier] ?? []) {
      const e = makeEntry(id, 'trash');
      if (e) entries.push(e);
    }
  }

  return {
    nodeId,
    biomeGroup: info.biomeGroup,
    biomeName,
    biomeTier: tier,
    isDungeon: info.isDungeon ?? false,
    hasGuardedAltar: dungeon !== undefined,
    entries,
  };
}
