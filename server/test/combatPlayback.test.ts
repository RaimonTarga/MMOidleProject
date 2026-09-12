import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { CombatPlaybackClock, COMBAT_PLAYBACK_CAPACITY } from '../../client/src/render/combatPlaybackClock';
import { World } from '../src/world/World';
import { buildSpectatorNodeSnapshot } from '../src/world/spectatorSnapshot';

// Real packet batching, including a delayed packet, must not set the shot rhythm.
for (const jitter of [0, 30]) {
  const clock = new CombatPlaybackClock<number>();
  clock.observe('node', 0, 0);
  const shots = [300, 600, 900, 1200, 1500, 2700, 3000];
  const batches = new Map<number, number[]>();
  for (const shot of shots) {
    const sentAt = Math.ceil(shot / 200) * 200;
    const arrival = sentAt + (sentAt === 1000 ? jitter : 0);
    batches.set(arrival, [...(batches.get(arrival) ?? []), shot]);
  }
  const rendered: number[] = [];
  for (let now = 10; now <= 3300; now += 10) {
    // Empty regular snapshots keep the clock alive through a real reload gap.
    if (now % 200 === 0 && now !== 1000) clock.observe('node', now, now);
    const batch = batches.get(now);
    if (batch) {
      clock.observe('node', now === 1000 + jitter ? 1000 : now, now);
      for (const shot of batch) clock.enqueue(shot, shot);
    }
    for (const shot of clock.drain(now)) {
      assert.equal(now, shot + 250, 'confirmed server time determines display time');
      rendered.push(shot);
    }
  }
  assert.deepEqual(rendered, shots, 'one visual per confirmed shot, including across reload');
}

// Genuine same-tick pellets stay simultaneous, stable, and precede cosmetic death.
{
  const clock = new CombatPlaybackClock<string>();
  clock.observe('node', 200, 200);
  clock.enqueue(100, 'pellet-1'); clock.enqueue(100, 'pellet-2');
  clock.enqueue(100, 'death'); clock.enqueue(200, 'next-shot');
  assert.deepEqual(clock.drain(349), []);
  assert.deepEqual(clock.drain(350), ['pellet-1', 'pellet-2', 'death']);
  assert.deepEqual(clock.drain(450), ['next-shot']);
  assert.equal(clock.size, 0);
}

// Duplicate event delivery never creates another hit. A new node/session resets it.
{
  const clock = new CombatPlaybackClock<number>();
  clock.observe('a', 100, 1000);
  assert(clock.acceptSequence(8));
  assert(!clock.acceptSequence(8)); assert(!clock.acceptSequence(7));
  assert(clock.acceptSequence(10));
  clock.observe('b', 200, 1100);
  assert(clock.acceptSequence(1));
}

// Capacity, scene/resync/visibility resets and long stalls release retained sprites.
{
  const clock = new CombatPlaybackClock<number>();
  let disposed = 0;
  clock.observe('a', 0, 0);
  for (let i = 0; i < COMBAT_PLAYBACK_CAPACITY + 20; i++) {
    clock.enqueue(100, i, () => disposed++);
  }
  assert.equal(clock.size, COMBAT_PLAYBACK_CAPACITY);
  assert.equal(disposed, 20);
  assert.deepEqual(clock.drain(800), [], 'a stalled frame cannot replay a backlog');
  assert.equal(disposed, COMBAT_PLAYBACK_CAPACITY + 20);
  clock.enqueue(1000, 1, () => disposed++);
  clock.reset();
  assert.equal(disposed, COMBAT_PLAYBACK_CAPACITY + 21);
  assert.equal(clock.size, 0);
  clock.observe('a', 0, 0);
  clock.enqueue(100, 1, () => disposed++);
  clock.observe('a', 1000, 1000);
  assert.equal(clock.size, 0, 'long receive gap resets the presentation timeline');
  assert.equal(disposed, COMBAT_PLAYBACK_CAPACITY + 22);
}

// World stamps once; private resyncs cannot steal or replay the shared events.
{
  const world = new World();
  const oldNow = Date.now;
  try {
    Date.now = () => 1000;
    const event = { kind: 'damage' as const, targetId: 'target', targetKind: 'monster' as const,
      targetPos: { x: 1, y: 2 }, amount: 7, category: 'direct' as const };
    world.pushEvent('node-5-5', event);
    Date.now = () => 1100;
    world.pushEvent('node-5-5', event);
    const dirty = { patched: new Map(), detached: new Map() };
    assert.deepEqual(world.buildNodeDelta('node-5-5', dirty, { resync: true }).events, []);
    Date.now = () => 1200;
    const broadcast = world.buildNodeDelta('node-5-5', dirty);
    assert.equal(broadcast.serverTime, 1200);
    assert.deepEqual(broadcast.events.map(e => [e.at, e.seq]), [[1000, 1], [1100, 2]]);
    assert.equal('at' in event, false, 'reused emitter payloads are never mutated');
    const spectator = buildSpectatorNodeSnapshot(world, 'node-5-5', broadcast.events);
    assert.equal(spectator.serverTime, 1200);
    assert.deepEqual(spectator.events, broadcast.events);
    assert.deepEqual(world.buildNodeDelta('node-5-5', dirty).events, []);
  } finally { Date.now = oldNow; }
}

// Measure only the added scheduling work, not rendering/GPU cost. 100 actors at
// 10 APS delivered at 5 Hz; 60 FPS drain, repeated for a useful measurement.
{
  const start = performance.now();
  let total = 0;
  let peak = 0;
  for (let repeat = 0; repeat < 20; repeat++) {
    const clock = new CombatPlaybackClock<number>();
    clock.observe('bench', 0, 0);
    for (let frame = 1; frame <= 618; frame++) {
      const now = frame * 1000 / 60;
      if (frame % 12 === 0 && frame <= 600) {
        clock.observe('bench', now, now);
        for (let actor = 0; actor < 100; actor++) {
          clock.enqueue(now - 100, actor); clock.enqueue(now, actor);
        }
        peak = Math.max(peak, clock.size);
      }
      total += clock.drain(now).length;
    }
  }
  assert.equal(total, 200000, 'stress playback loses no events within its supported budget');
  assert(peak <= COMBAT_PLAYBACK_CAPACITY);
  console.log(`combatPlayback scheduling: ${total} events, ${(performance.now() - start).toFixed(1)} ms, peak ${peak} queued`);
}
console.log('combatPlayback: ok');
