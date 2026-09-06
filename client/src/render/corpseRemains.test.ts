/**
 * Pure-logic coverage for the corpse-remains presentation mapping (now spanning
 * every biome's regular roster, not just Wasteland). No Phaser/DOM dependency,
 * so this is safe to run outside a browser — but the `client` package isn't
 * part of the discovered test suite (scripts/run-tests.mjs only walks
 * server/test, shared/src, and bot/src), so this file must be run manually, e.g.:
 *   pnpm --filter @mmo-idle/server exec tsx --conditions=development \
 *     ../client/src/render/corpseRemains.test.ts
 */
import {
  CORPSE_REMAINS_ART,
  CORPSE_SIZE_PX,
  resolveCorpsePresentation,
  resolveCorpseRemains,
} from "./corpseRemains";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// The five active Wasteland monsters resolve to the expected family + size.
const expectedPresentation: Record<string, { family: string; size: string }> = {
  "bone-crawler": { family: "beast", size: "medium" },
  "plague-hound": { family: "beast", size: "medium" },
  "carrion-vulture": { family: "avian", size: "medium" },
  "plague-rat": { family: "small-beast", size: "small" },
  "gravewright": { family: "large-beast", size: "large" },

  // A handful of the id/lore-name-vs-actual-sprite mismatches caught while
  // classifying the rest of the roster (the same trap bone-crawler hit) —
  // guards against a future edit silently reverting to the misleading name.
  "dust-djinn": { family: "arthropod", size: "small" }, // display "Sun Scarab", sprite is a beetle
  "dune-tyrant": { family: "arthropod", size: "large" }, // sprite is a giant scorpion, not a brute
  "granite-mammoth": { family: "large-beast", size: "large" }, // literal mammoth despite "granite"
  "sandspitter-cobra": { family: "arthropod", size: "small" }, // display "Sunshield Scarab", sprite is a beetle
  "hadal-stalker": { family: "arthropod", size: "large" }, // sprite is a giant spider crab
};

for (const [monsterTypeId, expected] of Object.entries(expectedPresentation)) {
  const presentation = resolveCorpsePresentation(monsterTypeId);
  assert(presentation !== null, `${monsterTypeId} should resolve a presentation`);
  assert(
    presentation!.family === expected.family,
    `${monsterTypeId} family: expected ${expected.family}, got ${presentation!.family}`,
  );
  assert(
    presentation!.size === expected.size,
    `${monsterTypeId} size: expected ${expected.size}, got ${presentation!.size}`,
  );
}

// A Bone Rat (small) must render visibly smaller than a Gravewright (large).
const ratRemains = resolveCorpseRemains("plague-rat", "corpse-1");
const wrightRemains = resolveCorpseRemains("gravewright", "corpse-2");
assert(ratRemains !== null && wrightRemains !== null, "both should resolve remains art");
assert(
  ratRemains!.sizePx < wrightRemains!.sizePx,
  "Bone Rat remains must be smaller than Gravewright remains",
);
assert(ratRemains!.sizePx === CORPSE_SIZE_PX.small, "Bone Rat should use the 'small' size class");
assert(wrightRemains!.sizePx === CORPSE_SIZE_PX.large, "Gravewright should use the 'large' size class");

// Unsupported / deferred monster types safely fall back to `null` rather than
// throwing or guessing — deferred (charnel-brute), a boss (void-overlord), a
// reptile with no matching family (sand-viper, a literal cobra despite its
// "scorpion-lineage" role), a humanoid construct (cave-troll), and an empty id.
for (const unmapped of ["charnel-brute", "sand-viper", "cave-troll", "void-overlord", ""]) {
  assert(
    resolveCorpsePresentation(unmapped) === null,
    `${unmapped || "(empty id)"} should have no configured presentation`,
  );
  assert(
    resolveCorpseRemains(unmapped, "some-corpse-id") === null,
    `${unmapped || "(empty id)"} should resolve no remains art`,
  );
}

// Variant selection is a pure function of (monsterTypeId, corpseId): stable
// across repeated calls, no per-call randomness.
const first = resolveCorpseRemains("bone-crawler", "corpse-abc");
const second = resolveCorpseRemains("bone-crawler", "corpse-abc");
assert(first !== null && second !== null && first!.key === second!.key, "variant selection must be deterministic for the same corpse id");

// Two different corpse ids of the same family CAN choose different variants
// (not guaranteed for any one pair, but beast has 2 variants — scanning a
// spread of ids must surface both, proving the hash actually varies output).
// Bone Crawler and Plague Hound share the 'beast' pool (both skeletal
// quadrupeds), so this also covers that shared-family case.
const seenBeastKeys = new Set<string>();
for (let i = 0; i < 50; i++) {
  const remains = resolveCorpseRemains("plague-hound", `corpse-${i}`);
  if (remains) seenBeastKeys.add(remains.key);
}
assert(
  seenBeastKeys.size === 2,
  `expected both beast variants to appear across a spread of corpse ids, saw: ${[...seenBeastKeys].join(", ")}`,
);

// All 8 approved assets are registered exactly once, with unique keys and a
// served path under /assets/corpses/ (actual on-disk presence is checked
// separately — see the validation pass in the corpse-remains summary).
assert(CORPSE_REMAINS_ART.length === 8, `expected 8 remains art entries, got ${CORPSE_REMAINS_ART.length}`);
const seenKeys = new Set<string>();
for (const art of CORPSE_REMAINS_ART) {
  assert(!seenKeys.has(art.key), `duplicate remains texture key: ${art.key}`);
  seenKeys.add(art.key);
  assert(
    art.file.startsWith("/assets/corpses/") && art.file.endsWith(".png"),
    `unexpected remains asset path: ${art.file}`,
  );
}

console.log("corpseRemains: ok");
