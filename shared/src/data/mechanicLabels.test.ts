/**
 * The invariant behind `mechanicLabels.ts`: every `mechanicEffects` key that any
 * authored item, upgrade step, stance or rite can put in front of a player has an
 * explicit human label.
 *
 * The authored key set is DERIVED from the data on every run, never snapshotted.
 * That is the whole point — a snapshot would pass forever while the real data
 * drifted away from it. Author a new effect key without a label and this test
 * fails on the next `pnpm test`, which is what stops the gap from regrowing.
 */

import { ITEM_DATABASE } from '../itemDatabase';
import { RECIPE_DATABASE } from '../recipeDatabase';
import { STANCE_DATABASE } from '../stances';
import {
  MECHANIC_LABELS,
  isCompanionMechanic,
  mechanicLabel,
  mechanicLabelOrKey,
} from './mechanicLabels';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

/** Where a key was found, so a failure names the file to edit. */
type KeySource = Map<string, string[]>;

function record(into: KeySource, key: string, source: string): void {
  const existing = into.get(key);
  if (existing) {
    if (!existing.includes(source)) existing.push(source);
  } else {
    into.set(key, [source]);
  }
}

function collectAuthoredKeys(): KeySource {
  const found: KeySource = new Map();

  // Recipes: base effects plus every incremental upgrade step. Upgrade steps are
  // typed `Record<string, number>` rather than `MechanicEffects`, so they are the
  // one authoring surface where a key can escape the PassiveKey union entirely —
  // which makes them the most important thing here to check at runtime.
  for (const recipe of RECIPE_DATABASE.values()) {
    for (const key of Object.keys(recipe.mechanicEffects ?? {})) {
      record(found, key, `recipe ${recipe.id}`);
    }
    for (const [index, step] of (recipe.upgrades ?? []).entries()) {
      for (const key of Object.keys(step.mechanicEffects ?? {})) {
        record(found, key, `recipe ${recipe.id} +${index + 1}`);
      }
    }
  }

  // Items. Crafted items are projected from recipes, but the database is the
  // surface tooltips actually read, and it can carry non-recipe entries.
  for (const item of ITEM_DATABASE.values()) {
    for (const key of Object.keys(item.mechanicEffects ?? {})) {
      record(found, key, `item ${item.id}`);
    }
    for (const [index, step] of (item.upgrades ?? []).entries()) {
      for (const key of Object.keys(step.mechanicEffects ?? {})) {
        record(found, key, `item ${item.id} +${index + 1}`);
      }
    }
  }

  // Stances render their effects through the same vocabulary as gear.
  for (const stance of STANCE_DATABASE.values()) {
    for (const key of Object.keys(stance.mechanicEffects ?? {})) {
      record(found, key, `stance ${stance.id}`);
    }
  }

  return found;
}

function testEveryAuthoredKeyHasALabel(): void {
  const authored = collectAuthoredKeys();
  assert(authored.size > 0, 'no authored mechanic keys found — the collector is broken');

  const missing: string[] = [];
  for (const [key, sources] of authored) {
    if (mechanicLabel(key) === undefined) missing.push(`${key} (${sources.join(', ')})`);
  }

  assert(
    missing.length === 0,
    `${missing.length} authored mechanicEffects key(s) have no label in ` +
      `shared/src/data/mechanicLabels.ts — add one for each:\n  ${missing.join('\n  ')}`,
  );
}

function testLabelsAreRealCopyNotDeSlugs(): void {
  // The reported symptom was a de-slugged key reaching a tooltip verbatim:
  // `technique.cast-speed-pct` → "cast speed pct". What gives a de-slug away is
  // the unit suffix trailing as a bare word, and the namespace dot surviving.
  //
  // Deliberately NOT asserted: that a label differs from its key's de-slug. A
  // well-named key de-slugs to the right words by coincidence
  // ("defense.evade-mitigation" → "evade mitigation"), and failing that is
  // testing the coincidence rather than the copy.
  const SUFFIX_NOISE = /(pct|ms|mult|msec|dur pct)$/i;
  for (const [key, entry] of Object.entries(MECHANIC_LABELS)) {
    const label = entry!.label;
    assert(label.trim().length > 0, `${key}: empty label`);
    assert(!label.includes('.'), `${key}: label still carries a namespace ("${label}")`);
    assert(!SUFFIX_NOISE.test(label), `${key}: label ends in a raw unit suffix ("${label}")`);
    assert(
      label[0] === label[0].toUpperCase(),
      `${key}: label should start capitalised ("${label}")`,
    );
  }
}

function testFallbackIsVisiblyWrong(): void {
  // An unlabelled key must never render as something that could pass for a stat.
  const rendered = mechanicLabelOrKey('technique.definitely-not-a-real-key');
  assert(
    rendered.includes('technique.definitely-not-a-real-key') && rendered !== 'definitely not a real key',
    `fallback should surface the raw key, got "${rendered}"`,
  );
}

function testNoItemRendersOnlyCompanions(): void {
  // A companion key is a qualifier inside another effect's sentence, so summaries
  // skip it. An item whose whole effect block is companions therefore renders a
  // blank effect line — a real, observable bug, and the only way a wrong companion
  // flag can reach a player.
  const authored = collectAuthoredKeys();
  const sourcesWithAHeadline = new Set<string>();
  for (const [key, sources] of authored) {
    if (isCompanionMechanic(key)) continue;
    for (const source of sources) sourcesWithAHeadline.add(source);
  }

  const offenders: string[] = [];
  for (const [key, sources] of authored) {
    if (!isCompanionMechanic(key)) continue;
    for (const source of sources) {
      if (!sourcesWithAHeadline.has(source)) offenders.push(`${source} — only companion key ${key}`);
    }
  }

  assert(
    offenders.length === 0,
    `these author only companion effect keys, so their effect summary renders blank:\n  ` +
      offenders.join(`\n  `),
  );
}

function testCompanionsAreSkippedInSummaries(): void {
  assert(isCompanionMechanic('defense.shield-interval-ms'), 'shield interval is a companion');
  assert(!isCompanionMechanic('defense.shield-pct'), 'shield percent is not a companion');
  assert(!isCompanionMechanic('nonexistent.key'), 'unknown keys are not companions');
}

testEveryAuthoredKeyHasALabel();
testLabelsAreRealCopyNotDeSlugs();
testFallbackIsVisiblyWrong();
testNoItemRendersOnlyCompanions();
testCompanionsAreSkippedInSummaries();

console.log('mechanicLabels: ok');
