/**
 * The Passive Tree's class-first content (build plan §3.5), built from the class kits so the
 * kits stay the one source: each class's three disciplines (code tier 1, the product's T2
 * pick), nine specializations scoped to a discipline (code tier 2, T3) and its leaves, three
 * per discipline per tier (code tier 3 for T4, 4 for T5, ...).
 *
 * A node carries no stats of its own: what a pick does lives in the class runtime, which
 * reads the character's `disciplineId` and `specializationId`.
 */
import { CLASS_KITS } from '../../classKits/registry';
import type { SkillNode } from './types';

/** Code tier of a leaf: the product's T4 is the tree's tier 3. */
export function leafTreeTier(productTier: number): number {
  return productTier - 1;
}

function node(fields: Pick<SkillNode, 'id' | 'name' | 'description' | 'tier' | 'classId' | 'parent' | 'disciplineId'>): [string, SkillNode] {
  return [fields.id, { ...fields, cost: 1, subVariantId: null, children: [], statEffects: {}, mechanicEffects: {} }];
}

export function classFirstTreeEntries(): [string, SkillNode][] {
  const entries: [string, SkillNode][] = [];
  for (const [archetype, kit] of Object.entries(CLASS_KITS)) {
    const classId = `${archetype}-root`;
    for (const discipline of kit.disciplines) {
      entries.push(node({
        id: discipline.id, name: discipline.name, description: discipline.text,
        tier: 1, classId, parent: classId, disciplineId: discipline.id,
      }));
    }
    for (const spec of kit.specializations) {
      entries.push(node({
        id: spec.id, name: spec.name, description: spec.text,
        tier: 2, classId, parent: spec.disciplineId, disciplineId: spec.disciplineId,
      }));
    }
    for (const leaf of kit.leaves) {
      entries.push(node({
        id: leaf.id, name: leaf.name, description: leaf.text,
        tier: leafTreeTier(leaf.tier), classId, parent: leaf.disciplineId, disciplineId: leaf.disciplineId,
      }));
    }
  }
  // Children are cosmetic: the panel draws a discipline's branch from them.
  const byId = new Map(entries);
  for (const [, child] of entries) {
    if (child.parent && byId.has(child.parent)) byId.get(child.parent)!.children.push(child.id);
  }
  return entries;
}
