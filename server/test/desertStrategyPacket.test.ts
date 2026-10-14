import assert from 'node:assert/strict';
import { bondResult } from '../bench/balance/desertStrategyRecorder';
import { endpointIntervals } from '../bench/balance/enduranceProgress';

// The Desert packet's own checks went with the frame/path breadth matrix it was cut from
// (class-first tree); the recorder it reads with stays.
const bond = { packId: 'one', firstBothEngagedMs: 100, bothEngagedMs: 100, ownerHpDamage: 7,
  ownerAbsorbed: 3, controlledMs: 0, lostMembership: false, members: [
    { id: 'd', type: 'sandspitter-cobra', role: 'dealer', firstSeenMs: 0, killedAtMs: 200 },
    { id: 'c', type: 'sand-viper', role: 'controller', firstSeenMs: 0, killedAtMs: 300 },
  ] };
assert.equal(bondResult(bond, 'window-ended').killOrder, 'dealer-first');
assert.equal(bondResult(bond, 'window-ended').dealerRemovalMsFromFirstBothEngaged, 100);
bond.members[1].killedAtMs = 200;
assert.equal(bondResult(bond, 'window-ended').killOrder, 'same-tick');
assert.equal(bondResult({ ...bond, lostMembership: true }, 'window-ended').status, 'ambiguous');
const unfinished = { ...bond, members: bond.members.map(m => ({ ...m, killedAtMs: null })) };
assert.equal(bondResult(unfinished, 'player-died').status, 'unfinished-at-player-death');
assert.equal(bondResult(unfinished, 'window-ended').status, 'unfinished-at-cap');
assert.equal(bondResult({ ...unfinished, firstBothEngagedMs: null }, 'window-ended').exposed, false);
assert.deepEqual(endpointIntervals([{ atMs: 300000, work: { kills: 3 } }], [300000, 600000]).map(x => x.kills), [3, null]);
console.log('desertStrategyPacket: pair ambiguity and null endpoints; zero combat');
