import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MONSTER_DATABASE } from '@mmo-idle/shared';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/**
 * MONSTER FX COVERAGE — the emitted-vs-handled diff, automated.
 *
 * Both of the wiring bugs the 2026-09-12 animation audit found were the same shape:
 * an id that one side emits and the other side does not handle, failing SILENTLY.
 * `stagger` was published by `bossPatterns.ts` and dropped by the client's six-id
 * `boss-fx` chain, so the punish window drew nothing for however long it had been
 * broken; `huge-boulder` fell through to `fxPowerShot` and rendered a thrown rock as
 * a glowing arrow. Neither is a type error: `ATTACK_FX_BY_STYLE` is a
 * `Record<string, …>` and the cue chain is a string comparison, so TypeScript cannot
 * see either one.
 *
 * This test is deliberately a TEXT scan of the client dispatch rather than an import
 * of it: `combatFx.ts` pulls in Phaser and `GameScene`, which a server-side tsx test
 * cannot load. It is coarse by nature — it proves an id is mentioned in the right
 * table, not that the FX looks right (Phaser FX have no test coverage at all).
 */

const CLIENT_FX = join(__dirname, '../../client/src/render/combatFx.ts');
const source = readFileSync(CLIENT_FX, 'utf8');
const STAGGER_FX = join(__dirname, '../../client/src/fx/stagger.ts');
const staggerSource = readFileSync(STAGGER_FX, 'utf8');

// ─── 1. Every authored `attackStyle` is registered in ATTACK_FX_BY_STYLE ─────
const styleTable = source.slice(
  source.indexOf('const ATTACK_FX_BY_STYLE'),
  source.indexOf('const GUARD_FX_BY_ABILITY'),
);
assert(styleTable.length > 0, 'could not locate ATTACK_FX_BY_STYLE in combatFx.ts');

// Keys appear in all three spellings in this table — `impact:`, `'bear-claws':` and
// `"claws-light":` — so match every one. A regex that handles only some silently
// under-reports the table and makes this whole test pass for the wrong reason.
const registeredStyles = new Set<string>();
for (const m of styleTable.matchAll(/^\s{2}(?:"([a-z0-9-]+)"|'([a-z0-9-]+)'|([a-z0-9-]+)):/gm)) {
  registeredStyles.add(m[1] ?? m[2] ?? m[3]);
}
assert(registeredStyles.size > 10, `parsed too few styles (${registeredStyles.size})`);

const authoredStyles = new Map<string, string[]>();
for (const [, def] of MONSTER_DATABASE) {
  const d = def as { attackStyle: string; name: string };
  const list = authoredStyles.get(d.attackStyle) ?? [];
  list.push(d.name);
  authoredStyles.set(d.attackStyle, list);
}

const unregistered = [...authoredStyles.keys()].filter((s) => !registeredStyles.has(s));
assert(
  unregistered.length === 0,
  `attackStyle with no ATTACK_FX_BY_STYLE entry (silently falls back to the generic ` +
    `impact bloom): ${unregistered
      .map((s) => `${s} (${authoredStyles.get(s)!.join(', ')})`)
      .join('; ')}`,
);

// Guard the split itself: if these collapse back onto one style, the bestiary has
// quietly lost the attack identity this pass added.
for (const style of [
  'gore',
  'troll-fist',
  'ape-fist',
  'reptile-tail',
  'bone',
  'peck',
  'dart',
  'fire-spit',
  'frost-bolt',
  'claws-light',
  'claws-frost',
  'bite-trench',
  'bite-fire',
  'bite-venom',
]) {
  assert(registeredStyles.has(style), `${style} must stay registered client-side`);
  assert(authoredStyles.has(style), `${style} must stay in use by at least one monster`);
}

// ─── 2. Every cue id the data emits is handled somewhere client-side ─────────
// Ids handled outside the `ev.fx === …` chain:
//  - the `boss-fx` union has its own branch set;
//  - `slam` is the deliberate generic fallback for an impact that names no cue;
//  - `power-shot` is the `else` at the BOTTOM of the cast-end chain, so it has no
//    branch of its own by design. That is exactly why it silently absorbed 15 named
//    abilities and why it must stay on this list rather than gain a branch.
const HANDLED_ELSEWHERE = new Set([
  'slam',
  'summon',
  'shield',
  'morph',
  'roar',
  'frenzy',
  'stagger',
  'power-shot',
]);

const handledCues = new Set<string>(HANDLED_ELSEWHERE);
for (const m of source.matchAll(/ev\.fx === "([a-z0-9-]+)"/g)) handledCues.add(m[1]);

const emitted = new Map<string, string[]>();
const note = (fx: string, who: string) => {
  const list = emitted.get(fx) ?? [];
  list.push(who);
  emitted.set(fx, list);
};
for (const [, def] of MONSTER_DATABASE) {
  const d = def as any;
  if (d.chargedAttack?.fx) note(d.chargedAttack.fx, `${d.name} charged`);
  if (d.chargedAttack?.aoe?.impactFx) note(d.chargedAttack.aoe.impactFx, `${d.name} impact`);
  if (d.engageSequence?.fx) note(d.engageSequence.fx, `${d.name} engage`);
  if (d.castedAttackSpeedBuff?.fx) note(d.castedAttackSpeedBuff.fx, `${d.name} casted`);
  for (const ability of d.monsterAbilities ?? []) {
    if (ability.fx) note(ability.fx, `${d.name}:${ability.name}`);
  }
  for (const step of d.bossPattern?.steps ?? []) {
    if (step.fx) note(step.fx, `${d.name} step ${step.name ?? step.kind}`);
  }
  const walk = (actions: any[]): void => {
    for (const action of actions ?? []) {
      if (action.type === 'cast') {
        if (action.fx) note(action.fx, `${d.name} cast ${action.label}`);
        walk(action.actions);
      }
    }
  };
  for (const phase of d.bossScript?.phases ?? []) walk(phase.actions);
  for (const rep of d.bossScript?.repeating ?? []) walk(rep.actions);
}

const unhandled = [...emitted.keys()].filter((fx) => !handledCues.has(fx));
assert(
  unhandled.length === 0,
  `cue id emitted by monster data and handled by NO client branch (falls through to ` +
    `the generic fxPowerShot, silently): ${unhandled
      .map((fx) => `${fx} (${emitted.get(fx)!.join(', ')})`)
      .join('; ')}`,
);

// The two ids the audit found broken. Pinned against the client SOURCE, not against
// `handledCues` — `stagger` is seeded into that set by HANDLED_ELSEWHERE above, so a
// `handledCues.has('stagger')` assertion would only be testing this file's own
// allowlist and passes even with the client branch deleted (verified by mutation).
assert(
  source.includes('ev.fx === "stagger"'),
  'the `boss-fx` chain must still handle `stagger` — without it, breaking a boss ' +
    'plate or escape-guard draws nothing at all',
);
assert(
  /from ['"]\.\/stunningStrike['"]/.test(staggerSource) &&
    staggerSource.includes('fxStunningStrike(scene, x, y)'),
  'boss recovery/stagger must reuse the player Stunning Strike animation',
);
assert(
  source.includes('ev.fx === "huge-boulder"'),
  '`huge-boulder` must still have its own branch, not fall through to fxPowerShot',
);

console.log('monsterStyleCoverage: ok');
