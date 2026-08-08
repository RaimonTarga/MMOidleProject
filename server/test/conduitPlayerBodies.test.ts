import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HEAD_ANCHORS, headAnchorFor, resolvePlayerFrame } from '@mmo-idle/shared';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/**
 * The nine Conduit tier-3 specializations each get a bespoke player body, like
 * every other class. Three things have silently broken before and are asserted
 * here rather than trusted:
 *
 *  - a spec key mapped in PLAYER_FRAMES but never packed into the atlas;
 *  - two specs accidentally sharing one body;
 *  - a body with no baked head anchor, so its range ring floats at the roster
 *    average instead of on its own head. `anchors.mjs` had a hardcoded file
 *    list that excluded whole families twice — once for the 45 non-Conduit T3
 *    bodies, and again for these nine.
 */
const SPECS: Array<{ label: string; specId: string; frame: string; expected: string }> = [
  { label: 'Inquisitor', specId: 'summoner-light-t3-a',    frame: 'light',    expected: 'sprites/classes/light_summoner_t3a.png' },
  { label: 'Kilnmaster', specId: 'summoner-light-t3-b',    frame: 'light',    expected: 'sprites/classes/light_summoner_t3b.png' },
  { label: 'Iconoclast', specId: 'summoner-light-t3-c',    frame: 'light',    expected: 'sprites/classes/light_summoner_t3c.png' },
  { label: 'Marshal',    specId: 'summoner-balanced-t3-a', frame: 'balanced', expected: 'sprites/classes/medium_summoner_t3a.png' },
  { label: 'Chorister',  specId: 'summoner-balanced-t3-b', frame: 'balanced', expected: 'sprites/classes/medium_summoner_t3b.png' },
  { label: 'Ritualist',  specId: 'summoner-balanced-t3-c', frame: 'balanced', expected: 'sprites/classes/medium_summoner_t3c.png' },
  { label: 'Covenanter', specId: 'summoner-heavy-t3-a',    frame: 'heavy',    expected: 'sprites/classes/heavy_summoner_t3a.png' },
  { label: 'Champion',   specId: 'summoner-heavy-t3-b',    frame: 'heavy',    expected: 'sprites/classes/heavy_summoner_t3b.png' },
  { label: 'Idolwright', specId: 'summoner-heavy-t3-c',    frame: 'heavy',    expected: 'sprites/classes/heavy_summoner_t3c.png' },
];

const atlasPath = resolve(import.meta.dirname, '../../client/public/assets/sprites.json');
interface AtlasJson {
  textures: Array<{ frames: Array<{ filename: string }> }>;
}
const atlas = JSON.parse(readFileSync(atlasPath, 'utf8')) as AtlasJson;
const atlasFrames: Set<string> = new Set(
  atlas.textures.flatMap((texture) => texture.frames.map((f) => f.filename)),
);

const seen = new Map<string, string>();

for (const spec of SPECS) {
  const frame = resolvePlayerFrame({
    combatArchetype: 'summoner',
    unlockedSkills: ['summoner-root', `summoner-${spec.frame}`, 'summoner-range-mid', spec.specId],
  });

  assert(
    frame === spec.expected,
    `${spec.label} (${spec.specId}) resolved to ${frame}, expected ${spec.expected}`,
  );

  assert(
    atlasFrames.has(spec.expected),
    `${spec.label} maps to ${spec.expected}, which is not packed into sprites.json — run pnpm art:pack`,
  );

  const previous = seen.get(spec.expected);
  assert(
    previous === undefined,
    `${spec.label} shares a body with ${previous} (${spec.expected}) — every spec needs its own`,
  );
  seen.set(spec.expected, spec.label);

  // A missing anchor is not an error, it silently falls back to the roster
  // average, so assert the frame is actually present in the baked map.
  assert(
    Object.prototype.hasOwnProperty.call(HEAD_ANCHORS, spec.expected),
    `${spec.label} has no baked head anchor for ${spec.expected} — re-run art/workbench/accents/anchors.mjs`,
  );

  const anchor = headAnchorFor(spec.expected);
  assert(
    anchor.x >= 24 && anchor.x <= 40,
    `${spec.label} head anchor x=${anchor.x} is far off centre; a raised prop probably captured the head probe`,
  );
}

// Range must never swap the player body — it is a summon/accent channel only.
for (const range of ['summoner-range-close', 'summoner-range-mid', 'summoner-range-far']) {
  const frame = resolvePlayerFrame({
    combatArchetype: 'summoner',
    unlockedSkills: ['summoner-root', 'summoner-balanced', range, 'summoner-balanced-t3-a'],
  });
  assert(
    frame === 'sprites/classes/medium_summoner_t3a.png',
    `range ${range} changed the player body to ${frame}`,
  );
}

console.log('conduitPlayerBodies: ok');
