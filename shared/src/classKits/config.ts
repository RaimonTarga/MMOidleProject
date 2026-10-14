/**
 * The class config's one entry point (build plan §3.3): the context a config is checked
 * against, the class default, and the check every config passes before the server uses it,
 * whether it came from a client, a save or the auto default.
 */
import { APPRENTICE_SYSTEM } from './configs/apprentice';
import { isRecord, oneOf, stringArray, type ClassSystemSpec } from './configs/common';
import { CONDUIT_SYSTEM } from './configs/conduit';
import { SLINGER_SYSTEM } from './configs/slinger';
import { SPIRIT_SYSTEM } from './configs/spirit';
import { SQUIRE_SYSTEM } from './configs/squire';
import { STRIKER_SYSTEM } from './configs/striker';
import {
  SYSTEM_KIND_BY_ARCHETYPE,
  type ClassConfig,
  type ClassConfigCheck,
  type ClassConfigContext,
  type ClassSystemConfig,
  type ClassSystemKind,
} from './configTypes';
import {
  classBudget,
  classKitFor,
  pieceRanks,
  trophyRanks,
  type ClassKitProgress,
} from './registry';
import type { ClassArchetype } from './types';

const SYSTEMS: { [K in ClassSystemKind]: ClassSystemSpec<Extract<ClassSystemConfig, { kind: K }>> } = {
  order: STRIKER_SYSTEM,
  responses: SQUIRE_SYSTEM,
  payoffs: APPRENTICE_SYSTEM,
  loadout: SLINGER_SYSTEM,
  thresholds: SPIRIT_SYSTEM,
  formation: CONDUIT_SYSTEM,
};

function systemFor(archetype: ClassArchetype): ClassSystemSpec<ClassSystemConfig> {
  return SYSTEMS[SYSTEM_KIND_BY_ARCHETYPE[archetype]] as unknown as ClassSystemSpec<ClassSystemConfig>;
}

/** Owned trophies, most recently earned first, read from the boss-clear log's order. */
function trophiesNewestFirst(archetype: ClassArchetype, progress: ClassKitProgress, owned: ReadonlyMap<string, number>): string[] {
  const trophies = classKitFor(archetype).trophies;
  const ordered: string[] = [];
  for (let i = progress.bossesCleared.length - 1; i >= 0; i -= 1) {
    // Boss-clear keys are `<biome>:<tier>` (`lineageBossKey`).
    const biome = progress.bossesCleared[i].split(':')[0];
    const trophy = trophies.find((t) => t.lineage === biome);
    if (trophy && owned.has(trophy.id) && !ordered.includes(trophy.id)) ordered.push(trophy.id);
  }
  return ordered;
}

/** Everything a config is checked against, from state the server already persists. */
export function classConfigContext(
  archetype: ClassArchetype,
  progress: ClassKitProgress,
  globalMasteryValue: number,
  relicSlots = 1,
): ClassConfigContext {
  const trophies = trophyRanks(archetype, progress.bossesCleared);
  return {
    archetype,
    pieceRanks: pieceRanks(archetype, progress),
    trophyRanks: trophies,
    trophiesNewestFirst: trophiesNewestFirst(archetype, progress, trophies),
    budget: classBudget(archetype, globalMasteryValue).value,
    disciplineId: progress.disciplineId,
    relicSlots,
  };
}

/** The class default: what `auto` mode fields. The newest trophy goes in the relic slot. */
export function defaultClassConfig(ctx: ClassConfigContext): ClassConfig {
  return {
    mode: 'auto',
    relic: ctx.trophiesNewestFirst.slice(0, ctx.relicSlots),
    system: systemFor(ctx.archetype).defaults(ctx),
  };
}

/** Rebuild a clean config from untrusted input (a client, a save), or null if it isn't one. */
export function parseClassConfig(archetype: ClassArchetype, raw: unknown): ClassConfig | null {
  if (!isRecord(raw) || !isRecord(raw.system)) return null;
  const mode = oneOf(raw.mode, ['auto', 'custom'] as const);
  const relic = stringArray(raw.relic);
  if (!mode || !relic) return null;
  const spec = systemFor(archetype);
  if (raw.system.kind !== spec.kind) return null;
  const system = spec.parse(raw.system);
  return system ? { mode, relic, system } : null;
}

/** Every reason a parsed config can't be used by this character. */
export function checkClassConfig(config: ClassConfig, ctx: ClassConfigContext): ClassConfigCheck {
  const reasons: string[] = [];
  if (config.relic.length > ctx.relicSlots) reasons.push(`the relic slot holds ${ctx.relicSlots} trophy`);
  const seen = new Set<string>();
  for (const id of config.relic) {
    if (!ctx.trophyRanks.has(id)) reasons.push(`"${id}" is not a trophy you hold`);
    if (seen.has(id)) reasons.push(`"${id}" is equipped twice`);
    seen.add(id);
  }
  if (config.system.kind !== SYSTEM_KIND_BY_ARCHETYPE[ctx.archetype]) {
    reasons.push(`this class uses ${SYSTEM_KIND_BY_ARCHETYPE[ctx.archetype]}, not ${config.system.kind}`);
  } else {
    reasons.push(...systemFor(ctx.archetype).validate(config.system, ctx));
  }
  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}

/** Parse and check in one step: the config a client sent, ready to store, or the reasons. */
export function validateClassConfig(
  raw: unknown,
  ctx: ClassConfigContext,
): { ok: true; config: ClassConfig } | { ok: false; reasons: string[] } {
  const config = parseClassConfig(ctx.archetype, raw);
  if (!config) return { ok: false, reasons: ['That is not a valid setup for this class.'] };
  const check = checkClassConfig(config, ctx);
  return check.ok ? { ok: true, config } : check;
}

/**
 * The config to field now: `auto` (or anything unusable, such as a save written before a
 * data change) becomes the current default; a usable `custom` config is kept as it is.
 */
export function resolveClassConfig(saved: unknown, ctx: ClassConfigContext): ClassConfig {
  const config = parseClassConfig(ctx.archetype, saved);
  if (config && config.mode === 'custom' && checkClassConfig(config, ctx).ok) return config;
  return defaultClassConfig(ctx);
}

export function sameClassConfig(a: ClassConfig, b: ClassConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
