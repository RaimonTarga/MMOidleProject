import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CLASS_ARCHETYPES, classKitFor, resolvePlayerFrame } from '@mmo-idle/shared';

/**
 * The class-first discipline and specialization picks wear the existing T2/T3 bodies
 * (frameMaps `classFirstFrameKey`): every pick resolves to its own packed frame, and the
 * class root alone keeps the root body.
 */
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const atlasPath = resolve(__dirname, '../../client/public/assets/sprites.json');
const atlas = JSON.parse(readFileSync(atlasPath, 'utf8')) as { textures: Array<{ frames: Array<{ filename: string }> }> };
const packed = new Set(atlas.textures.flatMap((t) => t.frames.map((f) => f.filename)));

for (const archetype of CLASS_ARCHETYPES) {
  const kit = classKitFor(archetype);
  const root = `${archetype}-root`;
  const rootFrame = resolvePlayerFrame({ combatArchetype: archetype, unlockedSkills: [root] });
  const bodies = new Set<string>();
  for (const discipline of kit.disciplines) {
    const t2 = resolvePlayerFrame({ combatArchetype: archetype, unlockedSkills: [root, discipline.id] });
    assert(t2 && t2 !== rootFrame, `${discipline.id} keeps the root body (${t2})`);
    assert(packed.has(t2), `${discipline.id} maps to ${t2}, which is not packed`);
    assert(!bodies.has(t2), `${discipline.id} shares ${t2}`);
    bodies.add(t2);
    for (const spec of kit.specializations.filter((s) => s.disciplineId === discipline.id)) {
      const t3 = resolvePlayerFrame({ combatArchetype: archetype, unlockedSkills: [root, discipline.id, spec.id] });
      assert(t3 && t3 !== t2, `${spec.id} keeps the discipline body (${t3})`);
      assert(packed.has(t3), `${spec.id} maps to ${t3}, which is not packed`);
      assert(!bodies.has(t3), `${spec.id} shares ${t3}`);
      bodies.add(t3);
    }
  }
}

console.log('classFirstBodies: ok');
