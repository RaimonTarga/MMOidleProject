import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { MinionView, PlayerView } from '@mmo-idle/shared';
import type { Observation } from '../state/observation';
import { Recorder } from './recorder';
import { TelemetrySink } from './sink';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const temp = mkdtempSync(join(tmpdir(), 'mmo-idle-bot-formation-'));
const sink = new TelemetrySink(temp, 'formation');
const recorder = new Recorder(sink, Date.now(), () => 'player-1', false);

function minion(id: string, targetId: string | null, owner = 'player-1'): MinionView {
  return { id, ownerPlayerId: owner, hp: 10, attackTargetId: targetId } as unknown as MinionView;
}
function obsWith(self: Partial<PlayerView>, minions: MinionView[], nodeId = 'node-1'): Observation {
  return {
    nodeId,
    self: { id: 'player-1', hp: 100, maxHp: 100, isDead: false, attackTargetId: null, catalysts: {}, essences: {}, ...self } as PlayerView,
    attackersOnSelf: () => [],
    monsters: () => [],
    minions: () => minions,
    otherPlayers: () => [],
  } as unknown as Observation;
}
const stats = () => ({ ...recorder.formationAttrition });
// `tick` ignores zero-length frames; space samples like a real run.
function tick(obs: Observation): void {
  const until = Date.now() + 2;
  while (Date.now() < until) { /* spin */ }
  recorder.tick(obs);
}

// Non-Conduit views record nothing.
tick(obsWith({}, []));
tick(obsWith({ attackTargetId: 'wolf' }, []));
assert(stats().pulls === 0, 'non-Conduit fights are not formation pulls');

const full = { summonsMinions: 4, summonActiveCount: 4 };
const idle = [minion('a', null), minion('b', null), minion('c', null), minion('d', null)];
tick(obsWith(full, idle));
assert(stats().pulls === 0, 'an idle formation is not a pull');

// Summons engage while the owner has no target: that is a Conduit pull.
const engaged = idle.map((m) => ({ ...m, attackTargetId: 'wolf' }));
tick(obsWith(full, engaged));
assert(stats().pulls === 1, 'summon engagement starts a pull');
assert(stats().fullAtPull === 1, 'the formation was whole at the pull');

// One body dies mid-fight; target switches inside the grace stay one pull.
tick(obsWith({ ...full, summonActiveCount: 3 }, engaged.slice(1)));
tick(obsWith({ ...full, summonActiveCount: 3 }, engaged.slice(1).map((m) => ({ ...m, attackTargetId: 'wolf-2' }))));
assert(stats().summonDeaths === 1, 'a same-node loss is one summon death');
assert(stats().pulls === 1, 'target switches do not split a pull');

// A node change re-mirrors the formation; it is not a wave of deaths.
tick(obsWith({ ...full, summonActiveCount: 3 }, [], 'node-2'));
assert(stats().summonDeaths === 1, 'node transitions are not deaths');

void sink.close().then(() => {
  rmSync(temp, { recursive: true, force: true });
  console.log('formationAttrition.test.ts: ok');
});
