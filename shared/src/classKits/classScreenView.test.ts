/**
 * The class screen's view model (build plan F7): owned pieces and trophies with their ranks,
 * what the config uses, what is new, what comes next this tier, and the toasts between two
 * snapshots. Structure only: no numbers are checked.
 */
import { defaultClassConfig, classConfigContextFromState } from './config';
import { absoluteZoneLevel, CLASS_ARCHETYPES, classKitFor, lineageBossKey } from './registry';
import { classUnlockNotices, composeClassScreenView, type ClassScreenInput } from './view';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function striker(overrides: Partial<ClassScreenInput> = {}): ClassScreenInput {
  return {
    combatArchetype: 'cadence', biomeLevel: {}, bossesCleared: [], disciplineId: null,
    classConfig: null, playerTier: 1, ...overrides,
  };
}

assert(composeClassScreenView(striker({ combatArchetype: null })) === null, 'no class, no class screen');

// Every class composes a screen for a fresh character, with its default config.
for (const archetype of CLASS_ARCHETYPES) {
  const input: ClassScreenInput = { ...striker(), combatArchetype: archetype };
  const ctx = classConfigContextFromState(input)!;
  const view = composeClassScreenView({ ...input, classConfig: defaultClassConfig(ctx) })!;
  const kit = classKitFor(archetype);
  assert(view.className === kit.displayName && view.systemName === kit.systemName, `${archetype}: names`);
  assert(view.mode === 'auto', `${archetype}: a fresh character is in auto mode`);
  assert(view.budget.text.startsWith(kit.budget.label), `${archetype}: the budget reads in the class's words`);
  assert(view.trophies.length === 0 && view.relic.equipped.length === 0, `${archetype}: no trophy before a boss`);
  assert(view.pieces.every((p) => p.rank >= 1 && p.lines.length === p.rank), `${archetype}: a line per learned rank`);
  assert(view.upcoming.every((u) => u.biomeLevel >= 1 && u.where.includes('level')), `${archetype}: upcoming lessons say where`);
}

// A fresh Striker: the Plains technique is coming, at the Plains' lesson level.
const fresh = composeClassScreenView(striker())!;
const sweepLesson = classKitFor('cadence').lessons.find((l) => l.pieceId === 'striker-sweep')!;
assert(sweepLesson.source.kind === 'zone', 'Sweep is a zone lesson');
const sweepLevel = absoluteZoneLevel(sweepLesson.source as Extract<typeof sweepLesson.source, { kind: 'zone' }>);
assert(!fresh.pieces.some((p) => p.id === 'striker-sweep'), 'Sweep is not owned yet');
assert(fresh.upcoming.some((u) => u.pieceId === 'striker-sweep' && u.where === `Plains level ${sweepLevel}`),
  'Sweep is listed as coming, at its Plains level');
assert(!fresh.upcoming.some((u) => u.biome === 'jungle'), 'a T1 character sees only its tier\'s lessons');

// Reaching the level teaches it; the config placing it marks it placed; unseen means new.
const reached = striker({ biomeLevel: { plains: sweepLevel } });
const ctx = classConfigContextFromState(reached)!;
const config = defaultClassConfig(ctx);
const placesSweep = JSON.stringify(config.system).includes('striker-sweep');
const view = composeClassScreenView({ ...reached, classConfig: config }, new Set<string>())!;
const sweep = view.pieces.find((p) => p.id === 'striker-sweep');
assert(sweep !== undefined && sweep.rank === 1 && sweep.lines.length === 1, 'Sweep is owned at rank 1');
assert(sweep!.placed === placesSweep, 'placed follows the config');
assert(sweep!.isNew, 'an unseen piece is new');
assert(!composeClassScreenView({ ...reached, classConfig: config }, new Set(['striker-sweep']))!.pieces
  .find((p) => p.id === 'striker-sweep')!.isNew, 'a seen piece is not');
assert(!composeClassScreenView({ ...reached, classConfig: config })!.pieces.some((p) => p.isNew),
  'without a seen list nothing is new');

// The Plains boss gives its trophy; the auto config equips it.
const cleared = striker({ biomeLevel: { plains: 6 }, bossesCleared: [lineageBossKey('plains', 1)] });
const clearedConfig = defaultClassConfig(classConfigContextFromState(cleared)!);
const clearedView = composeClassScreenView({ ...cleared, classConfig: clearedConfig })!;
const wideArc = clearedView.trophies.find((t) => t.id === 'striker-relic-plains');
assert(wideArc !== undefined && wideArc.rank === 1 && wideArc.lineageName === 'Plains', 'the Plains trophy at rank 1');
assert(wideArc!.equipped && clearedView.relic.equipped.includes(wideArc!.id), 'auto equips the newest trophy');

// Toasts: a lesson reached, a trophy won, a rank-up; nothing across a class change.
const learned = classUnlockNotices(striker(), reached);
assert(learned.some((n) => n.kind === 'piece' && n.id === 'striker-sweep' && !n.isRankUp), 'learning Sweep is announced');
const won = classUnlockNotices(reached, cleared);
assert(won.some((n) => n.kind === 'trophy' && n.id === 'striker-relic-plains' && !n.isRankUp), 'winning Wide Arc is announced');
const rankUp = classKitFor('cadence').lessons.find((l) => l.kind === 'rank-up' && l.source.kind === 'zone')!;
const rankSource = rankUp.source as Extract<typeof rankUp.source, { kind: 'zone' }>;
const beforeRank = striker({ biomeLevel: { [rankSource.biome]: absoluteZoneLevel(rankSource) - 1 }, playerTier: rankSource.tier });
const afterRank = striker({ biomeLevel: { [rankSource.biome]: absoluteZoneLevel(rankSource) }, playerTier: rankSource.tier });
const ranked = classUnlockNotices(beforeRank, afterRank).find((n) => n.id === rankUp.pieceId);
assert(ranked !== undefined && ranked.isRankUp && ranked.rank === rankUp.rank, 'a rank-up is announced as one');
assert(classUnlockNotices({ ...reached, combatArchetype: 'cooldown' }, reached).length === 0, 'a class change announces nothing');

console.log('classScreenView.test.ts: ok');
