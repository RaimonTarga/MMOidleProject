# Monster Targeting Current State

Monster aggro is server-authoritative. Live targets are represented by the
`hasAggroTarget` component on monsters.

## Data Policy

Monster definitions can opt into a targeting policy:

```ts
targeting?: {
  mode?: "closest" | "lowest-hp";
  ignoresTaunts?: boolean;
}
```

Defaults:

- omitted `mode` means `closest`
- omitted `ignoresTaunts` means `false`

No existing monster data needs to set this field to preserve current behavior.

## Acquisition

`server/src/systems/combat/ai/monsterTargeting.ts` owns initial aggro selection.
The monster AI calls it only when a monster has no current aggro target.

Modes:

- `closest`: current legacy behavior; nearest valid player/minion in pull range
- `lowest-hp`: lowest HP percent valid player/minion in pull range, tie-broken by
  distance

Players still use `playerDetectionMult`, so stealth and aggro-pull modifiers
apply to pull range before the policy chooses a target.

## Lock-On

This framework does not add periodic retargeting. Once a monster has aggro, it
keeps that target until the existing rules drop it: death, disconnect, leaving
the node, minion death, or leash break.

## Taunt Hook

`monsterIgnoresTaunts(monster)` reads the new `ignoresTaunts` flag. The rune
taunt system calls this before forcing or overriding a monster's target.

`server/src/systems/combat/ai/taunt.ts` currently implements
`taunt-current-target`: direct player hits force the hit monster to aggro the
attacking player, with a 4 second internal cooldown per player. Summon/minion
hits do not trigger this rune response.
