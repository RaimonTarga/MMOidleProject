/**
 * Quest data integrity. Deliberately written against the DATABASES rather than a
 * hardcoded list, so it keeps working as bosses are renamed or biomes retire.
 *
 * Added by the T3 economy pass (2026-08-30), which found 14 `targetMonsterTypes` entries
 * across tier-2/3/4 naming monsters that no longer exist — fossils of pre-retirement and
 * pre-boss-rework rosters. They no longer gate tier advancement (boss seals do) but the
 * counters still drive auto-combat target priority and HUD unlock gating, so a dead id is
 * live-path dead weight.
 */
import { QUEST_DATABASE, MONSTER_DATABASE, BIOME_DATABASE } from "@mmo-idle/shared";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

// 1. Every target monster id must resolve.
for (const quest of QUEST_DATABASE.values()) {
  assert(quest.targetMonsterTypes.length > 0, `${quest.id}: must name at least one target`);
  for (const id of quest.targetMonsterTypes) {
    assert(MONSTER_DATABASE.has(id), `${quest.id}: target monster '${id}' does not exist in MONSTER_DATABASE`);
  }
  const unique = new Set(quest.targetMonsterTypes);
  assert(unique.size === quest.targetMonsterTypes.length, `${quest.id}: duplicate target ids`);
}

// 2. Each TIER-ADVANCEMENT quest's list must equal that tier's live boss pool exactly —
//    which is what the file's own header comment claims it is. `tier-0` is the Clearing
//    tutorial and intentionally targets trash, not a boss.
for (const quest of QUEST_DATABASE.values()) {
  if (quest.tierRequired === 0) continue;
  const pool = new Set<string>();
  for (const biome of BIOME_DATABASE.values()) {
    for (const id of biome.bossPoolByTier?.[quest.tierRequired] ?? []) pool.add(id);
  }
  assert(pool.size > 0, `${quest.id}: tier ${quest.tierRequired} must have a live boss pool`);
  const targets = new Set(quest.targetMonsterTypes);
  for (const id of pool) {
    assert(targets.has(id), `${quest.id}: live boss '${id}' is missing from targetMonsterTypes`);
  }
  for (const id of targets) {
    assert(pool.has(id), `${quest.id}: '${id}' is not in bossPoolByTier[${quest.tierRequired}]`);
  }
}

// 3. tier-0's tutorial target is a real monster too (covered by rule 1) and must not be
//    a boss — it is the "kill 10 trash" onboarding quest.
{
  const tier0 = QUEST_DATABASE.get("tier-0")!;
  const allBosses = new Set<string>();
  for (const biome of BIOME_DATABASE.values()) {
    for (const pool of Object.values(biome.bossPoolByTier ?? {})) {
      for (const id of pool as string[]) allBosses.add(id);
    }
  }
  for (const id of tier0.targetMonsterTypes) {
    assert(!allBosses.has(id), `tier-0: '${id}' is a boss; the tutorial quest targets trash`);
  }
}

console.log("questMonsterIds: ok");
