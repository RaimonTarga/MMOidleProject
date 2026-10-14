/**
 * The class-first Passive Tree (build plan §3.5, F4): the six roots, then every kit's
 * disciplines, specializations and leaves, and the gate that scopes picks to the discipline.
 */
import { CLASS_KITS } from '../../classKits/registry';
import { canUnlockSkill, type SkillUnlockTarget } from '../../systems/skills';
import { SKILL_TREE, leafTreeTier } from './index';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const ROOTS = ['cadence-root', 'cooldown-root', 'dot-root', 'reload-root', 'energy-root', 'summoner-root'];
for (const root of ROOTS) assert(SKILL_TREE.get(root)?.tier === 0, `${root} is a tier-0 root`);

let kitNodes = 0;
for (const [archetype, kit] of Object.entries(CLASS_KITS)) {
  const classId = `${archetype}-root`;
  for (const d of kit.disciplines) {
    const node = SKILL_TREE.get(d.id);
    assert(node?.tier === 1 && node.classId === classId && node.disciplineId === d.id, `${d.id}: a tier-1 node of ${classId}`);
    kitNodes += 1;
  }
  for (const s of kit.specializations) {
    const node = SKILL_TREE.get(s.id);
    assert(node?.tier === 2 && node.classId === classId && node.disciplineId === s.disciplineId, `${s.id}: tier 2 under ${s.disciplineId}`);
    assert(SKILL_TREE.get(s.disciplineId)?.children.includes(s.id) === true, `${s.id}: listed under its discipline`);
    kitNodes += 1;
  }
  for (const l of kit.leaves) {
    const node = SKILL_TREE.get(l.id);
    assert(node?.tier === leafTreeTier(l.tier) && node.disciplineId === l.disciplineId, `${l.id}: a leaf under ${l.disciplineId}`);
    kitNodes += 1;
  }
}
assert(SKILL_TREE.size === ROOTS.length + kitNodes, `the tree holds only roots and kit nodes (${SKILL_TREE.size} vs ${ROOTS.length + kitNodes})`);
for (const node of SKILL_TREE.values()) {
  assert(node.subVariantId === null, `${node.id}: no frame keys in the class-first tree`);
}

// The gate, walked with the Striker (entered by K1).
function target(overrides: Partial<SkillUnlockTarget['usesSkills']>, tier: number): SkillUnlockTarget {
  return {
    usesSkills: { unlockedSkills: [], selectedClass: 'cadence-root', disciplineId: null, ...overrides },
    tracksProgression: { skillPoints: 1, currentSkillTier: tier },
  };
}
assert(canUnlockSkill(target({}, 1), 'striker-light').ok, 'a Striker picks a Striker discipline at tier 1');
assert(!canUnlockSkill(target({}, 1), 'squire-avenger').ok, 'never another class\'s discipline');
assert(!canUnlockSkill(target({}, 2), 'striker-thousand-cuts').ok, 'no specialization before a discipline');
assert(canUnlockSkill(target({ disciplineId: 'striker-light' }, 2), 'striker-thousand-cuts').ok, 'Light opens Thousand Cuts');
assert(canUnlockSkill(target({ disciplineId: 'striker-light' }, 2), 'striker-subjugator').reason === 'Wrong discipline', 'Light never opens a Heavy specialization');
assert(canUnlockSkill(target({ disciplineId: 'striker-heavy' }, 3), 'striker-unbreakable').ok, 'Heavy opens its T4 leaves');
assert(!canUnlockSkill(target({ disciplineId: 'striker-light' }, 3), 'striker-thousand-cuts').ok, 'one tier at a time');

console.log(`classFirstTree.test.ts: ok (${SKILL_TREE.size} nodes)`);
