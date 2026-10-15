/**
 * The Squire's tier 4 made visible (T4-W2-SQUIRE): every leaf is a pick the Passive Tree gate
 * offers under its own discipline (the tree's tier 3), and the guided tier 4 stretch exists.
 * T4 added no status ids, so there are no new buff tiles. Wiring only.
 */
import assert from 'node:assert/strict';
import { buildSquireBeats, canUnlockSkill, SQUIRE_KIT, type SkillUnlockTarget } from '@mmo-idle/shared';

// 1. Each leaf is offered under its own discipline and under no other.
{
  const target = (disciplineId: string | null): SkillUnlockTarget => ({
    usesSkills: { unlockedSkills: [], selectedClass: 'cooldown-root', disciplineId },
    tracksProgression: { skillPoints: 1, currentSkillTier: 3 },
  });
  assert.equal(SQUIRE_KIT.leaves.length, 9);
  for (const leaf of SQUIRE_KIT.leaves) {
    assert(canUnlockSkill(target(leaf.disciplineId), leaf.id).ok, `${leaf.id}: offered under ${leaf.disciplineId}`);
    const other = SQUIRE_KIT.disciplines.find((d) => d.id !== leaf.disciplineId)!.id;
    assert(!canUnlockSkill(target(other), leaf.id).ok, `${leaf.id}: not offered under ${other}`);
  }
}

// 2. The guided tier 4 stretch follows the tier 3 one and ends on the Trench boss.
{
  const ids = buildSquireBeats().map((b) => b.id);
  const first = ids.indexOf('squire4:leaf');
  assert(first > ids.indexOf('squire3:boss-volcanic'), 'the tier 4 stretch comes after the tier 3 one');
  assert.equal(ids.at(-1), 'squire4:boss-trench');
  assert(new Set(ids).size === ids.length, 'beat ids are unique');
  for (const beat of buildSquireBeats().slice(first)) assert(beat.say.length < 170, `${beat.id}: short enough`);
}

console.log('squireT4W2: ok');
