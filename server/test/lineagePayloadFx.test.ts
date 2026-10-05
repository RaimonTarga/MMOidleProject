/**
 * The T1 payload FX, client half (course-correction W2-C, design §24.2 rule 4).
 *
 * WHAT THIS PINS — the pure model and the wiring, not the look:
 *
 *   - every payload fx a packet's halves can push (lean payload and pure payload)
 *     has a client effect registered, and the client dispatch routes it there;
 *   - a payload's OWN hit (`lineage-hit:<fx>`) is presented as the payload: the
 *     echo a beat after the hit it echoes, the lunge at the end of its dash;
 *   - lasting looks take the server's duration (the event's applied value, else
 *     the same shared row the server reads), end on its clock, end EARLY only when
 *     the view has shown the state and then lost it, and are forgotten with the body;
 *   - the loaded carry glows only while a card in play lands a loaded carry;
 *   - a T1 payload is mid-weight: never thinned on a fresh character, capped
 *     below a specialization.
 *
 * Run: node --conditions=development --import tsx test/lineagePayloadFx.test.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  emptyEquipment,
  lineagePayloadHitFx,
  type MonsterView,
  type PlayerView,
} from '@mmo-idle/shared';
import {
  ECHO_DELAY_MS,
  LUNGE_CONTACT_MS,
  PAYLOAD_FX,
  PAYLOAD_SIZE_CAP,
  composesLoadedCarry,
  hitOwnsBodyLunge,
  hitPresentationDelayMs,
  isPayloadFx,
  payloadDurationMs,
  payloadFlair,
  payloadFxKeysFromHalves,
  payloadOfHit,
} from '../../client/src/fx/lineagePayloadModel';
import {
  EARLY_END_SLACK_MS,
  endLasting,
  forgetLasting,
  lastingActive,
  lastingRecord,
  resetLastingForTests,
  startLasting,
} from '../../client/src/fx/lineagePayloadStates';
import { attackFlairOf } from '../../client/src/fx/attackFlair';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const clientSrc = (rel: string): string => readFileSync(join(__dirname, '../../client/src', rel), 'utf8');

// ── Coverage: every payload a packet can push has an effect ──────────────────
{
  const fromHalves = payloadFxKeysFromHalves();
  assert(fromHalves.length === 10, `the seven packets' halves name ten payload keys, got ${fromHalves.length}`);
  for (const fx of fromHalves) {
    assert(isPayloadFx(fx), `payload '${fx}' (from PacketDefinition.halves) has no client effect registered`);
  }
  for (const fx of Object.keys(PAYLOAD_FX)) {
    assert(fromHalves.includes(fx as never), `'${fx}' is registered but no packet half pushes it`);
  }

  // The drawing module has a branch for every one, and the dispatch routes there
  // before the lane-primitive switch (and its warn-once default) can see it.
  const draw = clientSrc('fx/lineagePayloadFx.ts');
  for (const fx of Object.keys(PAYLOAD_FX)) {
    assert(draw.includes(`case '${fx}':`), `drawPayloadFx has no branch for '${fx}'`);
  }
  const combatFx = clientSrc('render/combatFx.ts');
  const route = combatFx.indexOf('if (isPayloadFx(ev.fx))');
  assert(route > 0 && combatFx.indexOf('drawPayloadFx(scene, ev, ev.fx)', route) > route,
    'combatFx routes a payload key to drawPayloadFx');
  assert(route < combatFx.indexOf('switch (ev.fx)', route), 'before the lane-primitive switch');
  assert(!combatFx.includes('case "tempo.ghost-strike"'), 'lands-twice is drawn as a payload, not the old streak');
  assert(combatFx.includes("console.warn(`card-fx: no client handler"), 'an undrawn key still warns once');
  assert(combatFx.includes('drawPayloadHit(scene, ev, payloadHit'), 'the payload\'s own hit draws its overlay');
  assert(combatFx.includes('!hitOwnsBodyLunge(ev.effects)'), 'the lunge\'s hit skips the ordinary hit lunge');

  // Lasting looks have an aura row each, and the playback clock carries payloads.
  const auras = clientSrc('fx/auraDefs.ts');
  for (const id of ['lineage-shackle', 'lineage-knockdown', 'lineage-drip', 'lineage-loaded']) {
    assert(auras.includes(`id: '${id}'`), `auraDefs has the '${id}' row`);
  }
  const playback = clientSrc('render/combatPlayback.ts');
  assert(playback.includes("event.kind === 'card-fx' || event.kind === 'lineage-load'"),
    'card-fx and lineage-load play on the hit\'s beat');
  assert(playback.includes('hitPresentationDelayMs(event.effects)'), 'a payload\'s hit is presented at its own delay');
}

// ── The payload's own hit ────────────────────────────────────────────────────
{
  const echo = [lineagePayloadHitFx('tempo.ghost-strike')];
  const lunge = ['ability-sweep', lineagePayloadHitFx('engagement.lunge')];
  const crash = [lineagePayloadHitFx('empowered.crash')];
  assert(payloadOfHit(echo) === 'tempo.ghost-strike', 'the echo\'s hit names its payload');
  assert(hitPresentationDelayMs(echo) === ECHO_DELAY_MS && ECHO_DELAY_MS >= 120,
    'the echo is presented a visible beat after the hit it echoes');
  assert(hitPresentationDelayMs(lunge) === LUNGE_CONTACT_MS, 'the lunge\'s hit lands at the end of its dash');
  assert(hitPresentationDelayMs(crash) === 0, 'a crash lands with its own hit');
  assert(hitPresentationDelayMs(undefined) === 0 && hitPresentationDelayMs(['ability-sweep']) === 0,
    'an ordinary hit is never delayed');
  assert(hitPresentationDelayMs(['lineage-hit:not.a-payload']) === 0, 'an unknown payload tag is ignored');
  assert(hitOwnsBodyLunge(lunge) && !hitOwnsBodyLunge(echo) && !hitOwnsBodyLunge(crash),
    'only the lunge moves the body itself');
  assert(PAYLOAD_FX['technique.refund-flash'].timing === 'immediate', 'the refund is HUD first, at receipt');
  assert(Object.entries(PAYLOAD_FX).every(([fx, spec]) => fx === 'technique.refund-flash' || spec.timing === 'hit'),
    'every other payload plays on its hit\'s beat');
}

// ── Durations: the server's ─────────────────────────────────────────────────
{
  assert(payloadDurationMs('control.shackle') === 2_000, 'the root holds 2 s (PACKET_HALF_NUMBERS)');
  assert(payloadDurationMs('control.knockdown') === 1_500, 'the knockdown 1.5 s');
  assert(payloadDurationMs('affliction.heavy-drip') === 4_000, 'the heavy bleed 4 s');
  assert(payloadDurationMs('affliction.double-dose') === 4_000, 'the re-dose 4 s');
  assert(payloadDurationMs('control.knockdown', 900) === 900, 'the APPLIED duration on the event wins (control resist)');
  assert(payloadDurationMs('control.shackle', 0) === 2_000, 'a zero on the wire falls back to the data');
  assert(payloadDurationMs('engagement.lunge') === 0, 'an instant payload has no duration');
}

// ── Flair: mid-weight ────────────────────────────────────────────────────────
{
  const base = { selectedSubVariant: null, selectedRange: null, unlockedSkills: [] as string[], playerTier: 0 };
  const fresh = attackFlairOf({ ...base, unlockedSkills: ['cadence-root'] });
  const spec = attackFlairOf({
    ...base, selectedSubVariant: 'heavy', selectedRange: 'cadence-range-mid', playerTier: 4,
    unlockedSkills: ['cadence-root', 'cadence-heavy', 'cadence-range-mid', 'cadence-heavy-t3-a'],
  });
  const freshPayload = payloadFlair(fresh);
  assert(freshPayload.k >= 1 && freshPayload.sparks >= 1, 'a fresh character\'s payload is full size, never thinned');
  assert(freshPayload.k > fresh.scale, 'and bigger than its stage-0 basic attack (it is the reward just bought)');
  const top = payloadFlair(spec);
  assert(top.k > freshPayload.k && top.sparks > freshPayload.sparks, 'it grows with stage and ascension');
  assert(top.k <= PAYLOAD_SIZE_CAP, 'and stops at the mid-weight cap');
  assert(payloadFlair(undefined).k === 1, 'no flair draws at 1');
}

// ── Lasting looks: the clock, the server's early end, the body leaving ───────
{
  resetLastingForTests();
  const mob = (extra: Partial<MonsterView> = {}): MonsterView => ({ id: 'mob-1', ...extra }) as MonsterView;
  const rooted = { id: 'ability-rooted', stacks: 1, remainingMs: 1_800, totalMs: 2_000 };
  const other = { id: 'lineage.hemorrhage', stacks: 4, remainingMs: 3_000, totalMs: 0 };

  startLasting('mob-1', 'shackle', 1_000, 2_000);
  assert(lastingActive('mob-1', 'shackle', mob(), 1_500), 'held while its clock runs (untargeted: the clock is trusted)');
  assert(lastingActive('mob-1', 'shackle', mob({ targetStatus: [other] }), 1_600),
    'a list that has never shown the root is not an early end (the mirror can lag a tick)');
  assert(lastingActive('mob-1', 'shackle', mob({ targetStatus: [rooted, other] }), 1_700), 'the view shows the root');
  assert(lastingRecord('mob-1', 'shackle')?.seenHold === true, 'and that is remembered');
  assert(!lastingActive('mob-1', 'shackle', mob({ targetStatus: [other] }), 1_801),
    'the root gone early (well inside the clock) ends the shackle now');
  assert(lastingRecord('mob-1', 'shackle') === undefined, 'and drops the record');

  // The view is applied at receipt and the look on the playback delay, so a
  // NATURAL end shows on the view a little before the clock's: not an early end.
  startLasting('mob-5', 'shackle', 0, 2_000);
  const m5 = (list: MonsterView['targetStatus']) => ({ id: 'mob-5', targetStatus: list }) as MonsterView;
  assert(lastingActive('mob-5', 'shackle', m5([rooted]), 100), 'seen holding');
  assert(lastingActive('mob-5', 'shackle', m5([other]), 2_000 - EARLY_END_SLACK_MS + 50),
    'the root gone from the view inside the slack is the playback delay, not an early end');
  assert(!lastingActive('mob-5', 'shackle', m5([other]), 2_000), 'and the clock ends it');

  startLasting('mob-1', 'shackle', 5_000, 2_000);
  assert(!lastingActive('mob-1', 'shackle', mob(), 7_000), 'the clock ends it');

  // A refresh never cuts a running look short.
  startLasting('mob-2', 'drip', 0, 4_000);
  startLasting('mob-2', 'drip', 1_000, 1_000, 2);
  const drip = lastingRecord('mob-2', 'drip');
  assert(drip?.endsAt === 4_000 && drip.intensity === 2, 'a refresh keeps the later end and the heavier intensity');

  // The knockdown reads `hardControlled`, broadcast for every monster.
  startLasting('mob-3', 'knockdown', 0, 1_500);
  const m3 = (held: boolean) => ({ id: 'mob-3', hardControlled: held }) as unknown as MonsterView;
  assert(lastingActive('mob-3', 'knockdown', m3(true), 100), 'down while the server holds it');
  assert(!lastingActive('mob-3', 'knockdown', m3(false), 200), 'up at once when the stun ends early');

  // The body leaves: live looks come back for their cancel, and are gone.
  startLasting('mob-4', 'shackle', 0, 2_000);
  startLasting('mob-4', 'drip', 0, 500);
  const left = forgetLasting('mob-4', 1_000);
  assert(left.length === 1 && left[0].kind === 'shackle', 'only the still-live shackle is returned for its break');
  assert(lastingRecord('mob-4', 'shackle') === undefined, 'and nothing is kept');
}

// ── The loaded carry ─────────────────────────────────────────────────────────
// On the Axe's T2 band, worn on the Ruinous Axe: since design §26.1 (legibility
// run) the Axe's one T1 verb is its Tempo verb, and its Kill-chain verb and the
// lane leans that compose with it are T2 cards.
{
  resetLastingForTests();
  const axe = (active: Record<string, string>, owned = Object.values(active)): Pick<PlayerView, 'equipment' | 'lineages'> => ({
    equipment: { ...emptyEquipment(), weapon: 'ruinous-axe' },
    lineages: { axe: { ownedCards: owned, active, ownedForms: ['chaotic-axe', 'ruinous-axe'], wornForm: 'ruinous-axe' } },
  });
  const pure = axe({ payoff: 'axe-t2-kill-chain-payoff' });
  const lean = axe({ payoff: 'axe-t2-kill-chain-payoff', stat: 'axe-t2-kill-chain-stat' });
  const echo = axe({ payoff: 'axe-t2-kill-chain-payoff', stat: 'axe-t2-tempo-stat' });
  const nth = axe({ payoff: 'axe-t2-tempo-payoff', stat: 'axe-t2-kill-chain-stat' });
  assert(composesLoadedCarry(pure), 'a Kill-chain verb alone lands its next hit after a kill loaded');
  assert(composesLoadedCarry(lean), 'and with its own lean (the pure pair)');
  assert(!composesLoadedCarry(echo), 'with the Tempo lean the carried hit lands twice instead: nothing loaded');
  assert(!composesLoadedCarry(nth), 'the Kill-chain LEAN on a Tempo verb loads the 6th hit, not a carried one');
  const unworn = { ...pure, equipment: emptyEquipment() };
  assert(!composesLoadedCarry(unworn), 'a tree whose form is not worn carries nothing');

  const player = (dead: boolean, view = pure) => ({ id: 'p1', isDead: dead, ...view }) as unknown as PlayerView;
  startLasting('p1', 'loaded', 0, 0);
  assert(lastingActive('p1', 'loaded', player(false), 60_000), 'the load glows until the server spends it — no clock');
  endLasting('p1', 'loaded');
  assert(!lastingActive('p1', 'loaded', player(false), 60_001), 'spent by its server beat');
  startLasting('p1', 'loaded', 0, 0);
  assert(!lastingActive('p1', 'loaded', player(false, echo), 10), 'a verb or lean swapped away drops the glow');
  startLasting('p1', 'loaded', 0, 0);
  assert(!lastingActive('p1', 'loaded', player(true), 10), 'a death drops it (respawn wipes the carry)');
}

console.log('lineagePayloadFx: ok');
