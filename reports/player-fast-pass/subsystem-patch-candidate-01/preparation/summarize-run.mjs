// Read-only postprocessing of the reserved run. Never launches or retries combat.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
const [run, output] = process.argv.slice(2);
assert(run && output, 'Usage: node summarize-run.mjs <terminal run directory> <new output JSON>');
assert(!existsSync(output), 'Fresh output only');
assert(existsSync(join(run, 'complete.json')) || existsSync(join(run, 'partial.json')), 'Run must be terminal');
const read = p => JSON.parse(readFileSync(p, 'utf8'));
const lines = p => readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const ledger = read(join(run, 'results-summary.json'));
assert.equal(ledger.experimentId, 'subsystem-patch-candidate-01');
assert.equal(ledger.mode, 'run', 'Qualification is not combat evidence');
const cells = read(join(run, 'manifest.json')).cases;
const out = [];
for (const row of ledger.rows) {
  if (row.status !== 'complete') { out.push({ observationId: row.observationId, status: row.status, reason: row.reason, endpoints: null }); continue; }
  const c = cells.find(c => c.id === row.observationId);
  const dir = dirname(row.externalSummary);
  const ready = read(join(dir, 'ready.json'));
  const events = lines(join(dir, 'events.jsonl'));
  const samples = lines(join(dir, 'samples.jsonl'));
  const techniques = new Set(c.abilities.techniques);
  const endpoints = [300000, 600000].map(atMs => {
    const endpoint = row.endpoints.find(e => e.atMs === atMs);
    if (!endpoint?.work) return { atMs, observed: false, work: null, metrics: null };
    const window = events.filter(r => r.atMs < atMs);
    const sampleWindow = samples.filter(s => s.atMs < atMs);
    const ability = Object.fromEntries([...techniques].map(id => [id, { castStarts: 0, castFires: 0, castAborts: 0, activations: 0 }]));
    let playerAoeHpDamage = 0, ownerHpDamageTaken = 0;
    const outgoing = [];
    for (const { atMs: time, event: e } of window) {
      if (e.playerId === ready.view.id && techniques.has(e.ability)) {
        if (e.kind === 'player-cast-start') ability[e.ability].castStarts++;
        if (e.kind === 'player-cast-end') ability[e.ability][e.fired ? 'castFires' : 'castAborts']++;
      }
      if (e.kind === 'ability-activation' && e.player?.id === ready.view.id && techniques.has(e.abilityId)) ability[e.abilityId].activations++;
      if (e.kind !== 'damage') continue;
      if (e.target?.id === ready.view.id) ownerHpDamageTaken += e.hpDamage ?? 0;
      if (e.source?.id === ready.view.id && e.source.actorType === 'player' && (e.hpDamage ?? 0) > 0) {
        outgoing.push(time);
        if (e.damageType === 'aoe') playerAoeHpDamage += e.hpDamage;
      }
    }
    const contacts = sampleWindow.filter(s => s.selectedTargetId && s.monsters?.some(m => m.id === s.selectedTargetId));
    let awayMotionSamples = 0, slowSamples = 0, rootSamples = 0, slowMotionSum = 0, slowMotionSamples = 0;
    for (const s of sampleWindow) {
      const buffs = s.activeBuffs ?? [];
      // Keep the exact IDs to let the reviewer audit slow versus root classification.
      const slow = buffs.some(b => /slow|chill/i.test(b.id));
      const root = buffs.some(b => /root/i.test(b.id));
      if (slow) slowSamples++;
      if (root) rootSamples++;
      if (slow && Number.isFinite(s.motion?.magnitude)) { slowMotionSum += s.motion.magnitude; slowMotionSamples++; }
      const target = s.monsters?.find(m => m.id === s.selectedTargetId);
      if (target && s.motion?.magnitude > 0 && s.motion.direction &&
        (s.pos.x - target.pos.x) * s.motion.direction.x + (s.pos.y - target.pos.y) * s.motion.direction.y > 0) awayMotionSamples++;
    }
    const damageTimes = [0, ...outgoing, atMs];
    const statusIds = [...new Set(sampleWindow.flatMap(s => (s.activeBuffs ?? []).map(b => b.id)))].sort();
    return { atMs, observed: true, work: endpoint.work, owner: endpoint.owner, metrics: {
      sampledOwnerMinHp: sampleWindow.length ? Math.min(...sampleWindow.map(s => s.hp)) : null,
      sampledOwnerMinHpFraction: sampleWindow.length ? Math.min(...sampleWindow.map(s => s.hp / (s.sustain?.maxHp ?? ready.view.maxHp))) : null,
      ownerHpDamageTaken, techniques: ability, deliveredPlayerSourceAoeHpDamage: playerAoeHpDamage,
      samples: sampleWindow.length, kiteSamples: sampleWindow.filter(s => s.activeBuffs?.some(b => b.id === 'mob-kite')).length,
      selectedTargetSamples: contacts.length, awayMotionSamples, slowSamples, rootSamples,
      sampledMeanMotionMagnitudeWhileSlow: slowMotionSamples ? slowMotionSum / slowMotionSamples : null,
      statusIds, maximumPlayerSourceHpDamageGapMs: Math.max(...damageTimes.slice(1).map((t, i) => t - damageTimes[i])),
      deliveryAnomalyAssessment: 'Requires event/sample review; counters do not classify channel or summon-delivery correctness.'
    } };
  });
  out.push({ observationId: c.id, block: c.block, seed: c.seed, arm: c.arm, outcome: row.outcome, endpoints });
}
writeFileSync(output, JSON.stringify({ experimentId: ledger.experimentId, counts: ledger.counts, limits: [
  'Sample-based minimum HP and mobility exposure are not continuous-time measurements.',
  'Slow/root classification uses recorded status ID names; inspect statusIds and raw samples for unrecognized effects.',
  'Player-source AoE HP damage is delivered damage, not exclusive Technique attribution.',
  'Player-source HP damage gaps include recovery, travel and non-damaging attacks; they are not exact lost-attack opportunity.',
  'Instant Technique activations and cast fires are separate counters; do not sum them as unique deliveries.',
  'Owner damage taken counts recorded HP damage, excluding absorption. No economy or live-play inference.'
], rows: out }, null, 2) + '\n');
console.log(`Summarized ${out.length} planned rows without combat or source mutation.`);
