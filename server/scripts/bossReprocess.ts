/**
 * Re-derive outcomes for an EXISTING boss recording from its raw event log.
 *
 * The recordings are sound: `events.jsonl` carries the authoritative kill and
 * player-death records. Only the runner's INTERPRETATION of them was wrong, so the
 * fights do not need re-fighting to be read correctly -- they need re-reading.
 *
 * This writes a SEPARATE corrected report and never touches the originals. A frozen
 * artifact is evidence, and rewriting evidence to match a later understanding
 * destroys the record of what actually happened.
 *
 * It imports the REAL classifier rather than mirroring it, so the corrected report
 * and the live runner can never drift apart.
 *
 * Usage: bossReprocess.ts --in=<recordingRoot> --out=<file>
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import {
  classifyBossTick, countsTowardAdds, resolveTerminalBossHp, type BossTerminal,
} from '../bench/balance/bossTerminal';

const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const i = s.indexOf('=');
  return [s.slice(2, i), s.slice(i + 1)];
})) as Record<string, string>;
assert(args.in && args.out, 'usage: bossReprocess.ts --in=<recordingRoot> --out=<file>');

const root = resolve(args.in), outFile = resolve(args.out);
assert(existsSync(root), `no recording at ${root}`);
const blockDir = existsSync(join(root, 'reference')) ? join(root, 'reference')
  : existsSync(join(root, 'sovereign')) ? join(root, 'sovereign') : root;

const readJson = (p: string): any => JSON.parse(readFileSync(p, 'utf8'));
const manifest = readJson(join(blockDir, 'manifest.json'));
const original: any[] = readJson(join(blockDir, 'index.json'));
const bossId: string = manifest.bossId;
const bossName = MONSTER_DATABASE.get(bossId)?.name ?? bossId;

/** Does this boss summon anything? If not, any add count is leakage. */
const bossDef = MONSTER_DATABASE.get(bossId) as {
  bossScript?: { phases?: { actions?: { type: string }[] }[] }; raisesDead?: unknown;
} | undefined;
const summonsNothing = (bossDef?.bossScript?.phases ?? [])
  .flatMap((p) => p.actions ?? []).every((a) => a.type !== 'spawn-adds')
  && !bossDef?.raisesDead;

const corrected: Record<string, unknown>[] = [];
for (const dir of readdirSync(blockDir, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const obs = join(blockDir, dir.name);
  if (!existsSync(join(obs, 'events.jsonl'))) continue;

  const before = original.find((r) => `${r.cell}-s${r.seed}` === dir.name);
  assert(before, `no original record for ${dir.name}`);

  const events = readFileSync(join(obs, 'events.jsonl'), 'utf8')
    .split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));

  let kill: { atMs: number; victimId: string | null; victimName: string | null; killerId: string | null } | null = null;
  let death: { atMs: number; cause: unknown } | null = null;
  let reset: { atMs: number; message: string } | null = null;
  for (const { atMs, event } of events) {
    if (event.kind === 'kill' && kill === null && event.victim?.name === bossName) {
      kill = { atMs, victimId: event.victim?.id ?? null, victimName: event.victim?.name ?? null,
        killerId: event.killer?.id ?? null };
    }
    if (event.kind === 'player-death' && death === null) death = { atMs, cause: event.cause ?? null };
    if (event.kind === 'dungeon-message' && reset === null && /reforms/i.test(event.message ?? '')) {
      reset = { atMs, message: event.message };
    }
  }

  const signals = [kill?.atMs, death?.atMs, reset?.atMs].filter((v): v is number => typeof v === 'number');
  const terminalAt = signals.length > 0 ? Math.min(...signals) : before.elapsedMs;
  const terminal: BossTerminal = signals.length === 0 ? null : classifyBossTick({
    bossKillEvent: kill?.atMs === terminalAt,
    playerDead: death?.atMs === terminalAt,
    bossPresent: false,
    dungeonReset: reset?.atMs === terminalAt,
    bossSeen: true,
  });

  // Last SUPPORTED boss HP: the newest sample taken strictly BEFORE the terminal tick.
  let lastSupported: number | null = before.bossMaxHp;
  let maxAdds = 0;
  if (existsSync(join(obs, 'samples.jsonl'))) {
    const samples = readFileSync(join(obs, 'samples.jsonl'), 'utf8')
      .split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
    const priorHp = samples.filter((s) => s.atMs < terminalAt && typeof s.bossHp === 'number');
    if (priorHp.length > 0) lastSupported = priorHp[priorHp.length - 1].bossHp;
    for (const s of samples) {
      if (!countsTowardAdds(s.atMs >= terminalAt ? terminal : null)) continue;
      maxAdds = Math.max(maxAdds, s.addsAlive ?? 0);
    }
  }
  const hp = resolveTerminalBossHp(terminal, lastSupported);

  corrected.push({
    cell: before.cell, seed: before.seed,
    outcome: terminal ?? 'capped',
    bossKilled: terminal === 'boss-killed',
    bossKillEvidence: kill, playerDeathEvidence: death, encounterResetEvidence: reset,
    killedAtMs: terminal === 'boss-killed' || terminal === 'simultaneous-terminal' ? terminalAt : null,
    elapsedMs: before.elapsedMs, windowMs: before.windowMs,
    bossMaxHp: before.bossMaxHp,
    bossHpRemaining: hp.hp, terminalBossHpSupported: hp.supported,
    bossHpFractionRemoved: hp.hp === null ? null : 1 - hp.hp / before.bossMaxHp,
    crossedHalfAtMs: before.crossedHalfAtMs,
    castsStarted: before.castsStarted, castLabels: before.castLabels,
    maxAddsAlive: maxAdds,
    damageFromBoss: before.damageFromBoss, damageFromAdds: before.damageFromAdds,
    attackBeats: before.attackBeats, minionAttackBeats: before.minionAttackBeats,
    hpLost: before.hpLost, peakBurst1s: before.peakBurst1s,
    minHpFraction: before.minHpFraction,
    correctedFrom: {
      outcome: before.outcome, bossKilled: before.bossKilled,
      bossHpRemaining: before.bossHpRemaining,
      bossHpFractionRemoved: before.bossHpFractionRemoved,
      maxAddsAlive: before.maxAddsAlive,
    },
  });
}

corrected.sort((a, b) => String(a.cell).localeCompare(String(b.cell)));

async function main(): Promise<void> {
const { verifyBossRecord } = await import('../../scripts/boss-verify.mjs') as {
  verifyBossRecord: (r: unknown, o: unknown) => string[];
};
for (const r of corrected) {
  r.contradictions = verifyBossRecord(r, { bossSummonsNothing: summonsNothing, expectedBossMaxHp: null });
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({
  note: 'Corrected re-read of an existing recording. The originals are untouched.',
  source: root, bossId, bossName, bossSummonsNothing: summonsNothing,
  recordingRevision: manifest.revision, definitionsHash: manifest.definitionsHash,
  reprocessedAt: new Date().toISOString(),
  records: corrected,
}, null, 2));

for (const r of corrected as any[]) {
  console.log(`${r.cell}: ${r.correctedFrom.outcome} -> ${r.outcome}`
    + ` | bossHp ${r.correctedFrom.bossHpRemaining} -> ${r.bossHpRemaining}`
    + ` | adds ${r.correctedFrom.maxAddsAlive} -> ${r.maxAddsAlive}`
    + ` | contradictions ${r.contradictions.length}`);
}
console.log('corrected report written to', outFile);
}

void main();
