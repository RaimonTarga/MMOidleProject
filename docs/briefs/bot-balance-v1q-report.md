# V1q — Validate the approved Volcano fodder adjustment

Status: completed once under the supplied frozen packet. Only the four local
Volcano diagnostics were run. No live route, Docker experiment, Tundra rerun,
T4 combat case, retry, resume, adaptive build, source fix, balance edit, or
additional experiment was performed.

All four V1q arms killed one reduced Ember Scuttler at 9.1 simulated seconds,
then died at 12.1 seconds with the Cinder Hound and the other Scuttler still
alive. This is a partial improvement over V1p, where no arm killed a monster,
but it is not a clear and did not enter the post-clear cooling tail. The
diagnostic is synthetic, reward 1x, fixed-seed evidence only; it is not a
normal-population, canonical-progression, or economy result.

No gameplay-rule changes were made by the operator. Heat, pack composition and
density, leaders, rewards, behavior, anti-kiting, and the authored T4 Burn
remained unchanged. The only treatment was the already approved two-stat
fodder adjustment in the frozen source. T4 was not tested and remains pending
an earned-entry validation.

## Frozen treatment

The frozen revision contains one approved treatment. HP and attack changed
together, so this experiment cannot isolate their individual contributions.

| Enemy | HP before -> after | Attack before -> after | Other treatment state |
|---|---:|---:|---|
| T3 Ember Scuttler | 1,220 -> 650 | 55 -> 45 | Same speed, cadence, behavior, rewards, and no-ability filler role |
| T4 Ember Skink | 1,350 -> 720 | 90 -> 75 | Same faster cadence; Burn remains 13 damage per stack with a 4-stack cap |

The fixed three-body diagnostic therefore contains 2,740 raw enemy HP in V1q
(1,440 Hound plus two 650-HP Scuttlers), versus 3,880 in the retained V1p
counterpart. This is not a claim about every natural four-to-six-body Volcano
composition.

The frozen commit changes only
`shared/src/data/monsters/volcano.monsters.ts`: six insertions and two
deletions. The actual T4 combat path was not exercised.

## Session ledger

| Field | Value |
|---|---|
| Operator setup start | 2026-09-14T10:34:48.5619004Z |
| Packet ceiling | 30 real minutes including setup |
| Packet deadline | 2026-09-14T11:04:48.5619004Z |
| Fresh detached checkout | `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1q-diagnostics-20260914` |
| Frozen revision | `e9577ec45fb04f170c4033b486a29d76f1654f92` |
| Frozen source tree | `e3b5c2faaa43c6d2931d360e70d5e7ff73cbc91d` |
| Diagnostic runner | `server/scripts/v1pDiagnostics.ts` (kept unchanged; V1p filenames retained by packet) |
| Input Snapshot B | `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t064043z-spirit-wisp-travel-t2-bridge-v/runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-b.json` |
| Input SHA-256 | `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144` |
| Node / pnpm | `v22.16.0` / `8.15.1` |
| Lockfile SHA-256 | `513852d0b792b5e33920c64a704c6290f66c618cf67d9179fb8bb0eb8b22db10` |
| Dependency install | `pnpm install --frozen-lockfile`; exit 0; pnpm reported 19.2 seconds |
| Fresh typecheck | `pnpm --filter @mmo-idle/server exec tsc --noEmit -p tsconfig.diagnostics.json`; exit 0; 10.480 seconds |
| Preflight complete artifact | 2026-09-14T10:36:18.4272538Z; exit 0 |
| Execution complete artifact | 2026-09-14T10:36:54.9197757Z; exit 0; wrapper elapsed 7.167 seconds |
| Services | No service or network was needed or created by Part A |

At setup, the main checkout was at the V1q freeze line with only the
pre-existing `M docs/briefs/bot-balance-v1g-report.md` and the untracked human
playtest run. Those changes were preserved. The isolated checkout's only status
entry after the packet-authorized atlas copy was
`M client/public/assets/sprites.json`; its Git diff was empty because its
working-tree blob matched the frozen HEAD blob. No source content was changed
by the operator.

## Input and checkout integrity

The actual V1m Snapshot B was reused unchanged. It retains the earned Wisp,
GM78, mastery, wallet, and provenance state. Neither the repository fixture nor
a prior diagnostic/end state was substituted.

| Item | SHA-256 |
|---|---|
| Retained Snapshot B | `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144` |
| Main `client/public/assets/sprites.png` | `6ed9a1b7f7124cc2489d42239a73ed5f4a9382b3eeb51ce9be93a53722b72c22` |
| Main `client/public/assets/sprites.json` | `8611f8498a03b0dbd8b7366937ef670686b2bf911c0c6e4310d0ba9aae7c1156` |
| Isolated `client/public/assets/sprites.png` | `6ed9a1b7f7124cc2489d42239a73ed5f4a9382b3eeb51ce9be93a53722b72c22` |
| Isolated `client/public/assets/sprites.json` | `8611f8498a03b0dbd8b7366937ef670686b2bf911c0c6e4310d0ba9aae7c1156` |
| Generated hitboxes | `7d2bb18d34e42a4c24ea720168aace8c5cc7e5e0d120080e4bbd5a34f398a0bf` |
| `server/scripts/v1pDiagnostics.ts` | `788964e46c716bbc4f32500c50ae9dcdd953c6c2a1ba1e7ca11b17c28504dc46` |
| `scripts/bot-preflight.mjs` | `b112c930a46d908157f640f309aba5fd3b90c2d36c5110edd7ce2b84c125f719` |
| `pnpm-lock.yaml` | `513852d0b792b5e33920c64a704c6290f66c618cf67d9179fb8bb0eb8b22db10` |

The isolated checkout was rechecked after execution:

```text
HEAD e9577ec45fb04f170c4033b486a29d76f1654f92
tree e3b5c2faaa43c6d2931d360e70d5e7ff73cbc91d
status M client/public/assets/sprites.json
git diff -- client/public/assets/sprites.json: empty
```

## Setup-only preflight

The fresh V1q preflight root was
`C:/Users/osaif/AppData/Local/mmo-idle/validation/v1q-preflight-operator-20260914`.
The diagnostic typecheck and the exact frozen runner preflight both exited 0.

```powershell
$env:NODE_ENV = 'production'
pnpm --filter @mmo-idle/server exec tsc --noEmit -p tsconfig.diagnostics.json

pnpm --filter @mmo-idle/server exec tsx --conditions=development scripts/v1pDiagnostics.ts --preflight "C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260914t064043z-spirit-wisp-travel-t2-bridge-v\runs\001-spirit-wisp-travel-t2-bridge-v1m-intended-r01\artifacts\spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09\snapshot-b.json" "C:\Users\osaif\AppData\Local\mmo-idle\validation\v1q-preflight-operator-20260914"
```

Runner stdout was:

```text
volcano-control: setup validated; no ticks
volcano-armor: setup validated; no ticks
volcano-armor-bramble: setup validated; no ticks
volcano-armor-bramble-charm: setup validated; no ticks
```

The fresh preflight contains four setup-only case files,
`tundra-purchase-preflight.json`, `manifest.json`, `hitboxes.json`, and
`complete.json` with `{"mode":"--preflight","cases":4}`. The manifest
verified the exact Snapshot B, atlas and hitbox hashes, seed 173, 100 ms ticks,
60,000 ms fight cap, 30,000 ms post-clear cap, unchanged anti-kiting and Heat,
reward 1x, canonical=false, and the synthetic diagnostic fixture.

The retained purchase artifact is an inherited zero-tick setup check only. It
confirms the four diagnostic configurations cost 27 RP and that the V1q packet
did not authorize a Tundra run. The supplied V1q preparation directory also
records the previously passed full `pnpm typecheck`, ecology-polish test,
ambient-ramp test, and these four setup-only arms. No full repository test-suite
pass is claimed for this execution.

## Part A — Four Volcano diagnostics

### Fixed setup

All four sequential arms used the same retained Wisp, Ruinous Axe, Tempered
Core, Plains Boots +5, Sweep, Defensive stance, five combat rules, 27 RP, seed
173, 100 ms ticks, full authored Heat, real Alacrity node geometry, unchanged
anti-kiting, and a fixed Cinder Hound plus two Ember Scuttlers at the packet's
starting positions. All gear was +5. The player started 220 px left of node
center; the monsters started at center and +60 px vertical offsets. There was
no lava, natural recruitment, repopulation, chain-pulling, forced combat exit,
or reset between arms.

| Arm | Armor | Charm | Guards | Starting HP / barrier / plating / DR |
|---|---|---|---|---:|
| `volcano-control` | Cave Vest +5 | Mountain Charm +5 | Second Wind + Brace | 236 / 132 / 18 / 19% |
| `volcano-armor` | Plains armor (`plains-vest-t2`) +5 | Mountain Charm +5 | Second Wind + Brace | 222 / 124 / 29 / 2% |
| `volcano-armor-bramble` | Plains armor (`plains-vest-t2`) +5 | Mountain Charm +5 | Second Wind + Bramble Guard | 222 / 124 / 29 / 2% |
| `volcano-armor-bramble-charm` | Plains armor (`plains-vest-t2`) +5 | Plains charm (`plains-charm-t2`) +5 | Second Wind + Bramble Guard | 222 / 67 / 29 / 2% |

All arms also started with attack 102, recovery 13, speed 187, and an 801 ms
attack cooldown. The starting derived player stats match the retained V1p
counterpart; only the frozen Volcano filler stats changed.

### Execution gate and outcome

The one authorized execution used the fresh V1q output root
`C:/Users/osaif/AppData/Local/mmo-idle/validation/v1q-execution-operator-20260914`:

```powershell
$env:NODE_ENV = 'production'
pnpm --filter @mmo-idle/server exec tsx --conditions=development scripts/v1pDiagnostics.ts --execute "C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260914t064043z-spirit-wisp-travel-t2-bridge-v\runs\001-spirit-wisp-travel-t2-bridge-v1m-intended-r01\artifacts\spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09\snapshot-b.json" "C:\Users\osaif\AppData\Local\mmo-idle\validation\v1q-execution-operator-20260914"
```

It exited 0 with:

```text
volcano-control: 12100ms complete
volcano-armor: 12100ms complete
volcano-armor-bramble: 12100ms complete
volcano-armor-bramble-charm: 12100ms complete
```

Every case has 121 samples through the lethal sample, a complete embedded
world journal, and `outcome=death`. `firstClearMs` is null in all four cases.

| Arm | Retained V1p result | V1q result | Direct comparison |
|---|---|---|---|
| `volcano-control` | Death at 9.5 s; no kill; Hound 724, Scuttlers 257 and 1,220 HP | Ember Scuttler `m2` killed at 9.1 s; death at 12.1 s; Hound 498, `m2` dead (journal HP -313), `m3` 650 | First kill added; survival +2.6 s |
| `volcano-armor` | Death at 9.5 s; no kill; Hound 724, Scuttlers 257 and 1,220 HP | Ember Scuttler `m2` killed at 9.1 s; death at 12.1 s; Hound 498, `m2` dead (journal HP -313), `m3` 650 | First kill added; survival +2.6 s |
| `volcano-armor-bramble` | Death at 9.5 s; no kill; Hound 714, Scuttlers 257 and 1,220 HP | Ember Scuttler `m2` killed at 9.1 s; death at 12.1 s; Hound 498, `m2` dead (journal HP -313), `m3` 650 | First kill added; survival +2.6 s |
| `volcano-armor-bramble-charm` | Death at 8.3 s; no kill; Hound 704, Scuttlers 904 and 1,220 HP | Ember Scuttler `m2` killed at 9.1 s; death at 12.1 s; Hound 488, `m2` dead (journal HP -323), `m3` 650 | First kill added; survival +3.8 s |

All four V1q deaths were Cinder Hound melee hits for 59 at 12.1 s. The
corresponding V1p charm arm died to a 56-damage Hound hit at 8.3 s. The new
filler kill is therefore common to every prepared kit, but no kit produced a
full roster clear.

### Damage, absorption, and healing

The gross value below is the sum of the journal's diagnostic
`mitigation.grossDamage` fields. It is not final delivered damage and is not
combined with unrelated mitigation-stage fields. Actual player HP damage,
barrier absorption, and explicit healing remain separate.

| Arm | Incoming events / gross diagnostic sum | Actual HP damage | Barrier absorbed | Explicit healing | Incoming HP source: Hound / Scuttler | Outgoing events / total HP |
|---|---:|---:|---:|---:|---:|---:|
| `volcano-control` | 12 / 785 | 333 | 132 across 5 events | 80 across 40 events | 296 / 37 | 16 / 1,905 |
| `volcano-armor` | 12 / 785 | 308 | 124 across 5 events | 80 across 40 events | 283 / 25 | 16 / 1,905 |
| `volcano-armor-bramble` | 12 / 785 | 303 | 124 across 6 events | 80 across 40 events | 282 / 21 | 16 / 1,905 |
| `volcano-armor-bramble-charm` | 12 / 785 | 360 | 67 across 4 events | 110 across 61 events | 326 / 34 | 18 / 1,925 |

Every arm ended at HP 0 and barrier 0. First and last incoming contacts were
2.8 s and 12.1 s in all four arms. The retained V1p versus V1q actual damage
and sustain fields were:

| Arm | V1p HP damage / absorbed / explicit heal | V1q HP damage / absorbed / explicit heal | V1p outgoing direct + AOE + proc | V1q outgoing direct + AOE + proc |
|---|---:|---:|---:|---:|
| `volcano-control` | 319 / 132 / 70 | 333 / 132 / 80 | 1,480 + 199 + 0 = 1,679 | 1,706 + 199 + 0 = 1,905 |
| `volcano-armor` | 303 / 124 / 70 | 308 / 124 / 80 | 1,480 + 199 + 0 = 1,679 | 1,706 + 199 + 0 = 1,905 |
| `volcano-armor-bramble` | 326 / 124 / 70 | 303 / 124 / 80 | 1,480 + 199 + 10 = 1,689 | 1,706 + 199 + 0 = 1,905 |
| `volcano-armor-bramble-charm` | 294 / 67 / 46 | 360 / 67 / 110 | 823 + 199 + 30 = 1,052 | 1,706 + 199 + 20 = 1,925 |

V1q's first three arms had 1,706 direct outgoing HP damage and the charm arm
also had 1,706 direct outgoing HP damage after the longer fight. Sweep's two
observed area hits were unchanged in every arm: Ember Scuttler `m2` for 92 at
0.1 s and Cinder Hound `m1` for 107 at 7.3 s, 199 total. No outgoing hit
targeted `m3`.

### Target churn and Bramble

The early target sequence was identical across V1p and V1q through the last
pre-kill target:

```text
m1@0.1s -> m2@2.4s -> m3@2.9s -> m1@3.1s -> m3@3.4s -> m2@3.5s
-> m1@4.4s -> m2@5.0s -> m1@5.5s -> m2@5.6s -> m1@5.8s
-> m2@5.9s -> m1@7.1s -> m2@7.3s -> m1@8.0s -> m2@8.5s
```

V1p then continued to `m1@9.3s` and none at death, except the Plains-charm
arm, which released to none at 8.3 s. In V1q, the `m2` kill caused target none
at 9.1 s, reacquisition of `m1` at 9.2 s, and none at the 12.1-second death
sample. This post-kill target and RNG divergence is a consequence to report,
not an identical counterfactual continuation of V1p.

Bramble Guard gained at 0.1 s and expired at 5.1 s in both V1q Bramble arms.
The armor-Bramble arm produced no Bramble `proc` damage in V1q; all of its
incoming damage while the buff was active had zero HP damage while barrier or
other layers absorbed it. The armor-Bramble-charm arm produced 10-damage
procs against the Scuttler at 4.2 s and the Hound at 4.7 s, 20 total. For
comparison, V1p recorded one 10-damage Bramble proc in the armor-Bramble arm
and three 10-damage procs in the armor-Bramble-charm arm.

V1q ability timing was:

| Arm | Ability activations |
|---|---|
| `volcano-control` | Sweep 0.1 s; Second Wind 6.0 s; Sweep 6.1 s; Brace 7.2 s; Sweep at the 12.1 s terminal sample |
| `volcano-armor` | Sweep 0.1 s; Second Wind 6.0 s; Sweep 6.1 s; Brace 7.2 s; Sweep at the 12.1 s terminal sample |
| `volcano-armor-bramble` | Sweep 0.1 s; Bramble Guard 0.1 s; Sweep 6.1 s; Second Wind 7.2 s; Sweep at the 12.1 s terminal sample |
| `volcano-armor-bramble-charm` | Sweep 0.1 s; Bramble Guard 0.1 s; Second Wind 6.0 s; Sweep 6.1 s; Sweep at the 12.1 s terminal sample |

### First-kill recovery and Heat limits

The first Ember Scuttler kill occurred at 9.1 s in every arm and recorded 657
damage, 20 red essence, and 0 biome XP. The normal post-kill journal sequence
included the kill, explicit recovery events, and a `mob-haste` gain of +60%
move speed at 9.1 s. The following recovery samples were retained:

| Arm | HP sample at 9.0 s -> 9.1 s -> 9.9 s | Post-kill recovery observation |
|---|---:|---|
| `volcano-control` | 87.5756 -> 89.7232 -> 106.904 | 2-HP explicit heal events each 100 ms through 9.9 s; Recovery expired at 9.9 s |
| `volcano-armor` | 94.6262 -> 96.6464 -> 112.808 | 2-HP explicit heal events each 100 ms through 9.9 s; Recovery expired at 9.9 s |
| `volcano-armor-bramble` | 75.3838 -> 77.4040 -> 93.5656 | 2-HP explicit heal events each 100 ms through 9.9 s; Bramble had already expired at 5.1 s |
| `volcano-armor-bramble-charm` | 42.6262 -> 45.8585 -> 71.7171 | 3-HP explicit heal events through 9.9 s, then Recovery updated to 42% and later 1-HP ticks were recorded |

These are journal observations around the kill, not a claim that every healing
component was caused by the kill itself. No arm cleared the roster. Heat rose
to stack 4 at 9.2 s in all four V1q arms. The V1p charm arm had stopped at 8.3
s before stack 4; the other V1p arms also reached stack 4 before death.

Because no roster cleared, the packet-authorized 30-second same-world tail was
not entered in any case. Post-clear last contact, a post-combat OUT_OF_COMBAT
transition, Heat decay steps, zero-Heat time, and tail-end recovery are all
unobserved. The `OUT_OF_COMBAT` state on a death sample is combat-state reset,
not cooling data. No natural recruitment or repopulation occurred.

Progression remained diagnostic-only: no arm changed biome level or global
mastery, and the per-kill biome XP was zero. The 1x rewards and synthetic grants
do not create an economy or canonical-progression conclusion.

## V1p counterpart verification

Each retained V1p execution file was re-hashed without rerunning the old cases.
Every disk hash matched the corresponding hash recorded in
`docs/briefs/bot-balance-v1p-report.md`.

| Artifact | Retained V1p SHA-256 | V1p report / disk check |
|---|---|---|
| `complete.json` | `04e0886720a5365375ba505af40924e7c2964357f19322860e495e358c7d0084` | pass |
| `hitboxes.json` | `7d2bb18d34e42a4c24ea720168aace8c5cc7e5e0d120080e4bbd5a34f398a0bf` | pass |
| `manifest.json` | `cdd2d274eaaff7c10941501d567789e226cf830066d2377234c19f566dc9c91d` | pass |
| `volcano-control.json` | `b55473b1865ebfff6a0fe4b37e0aacd2f9a2380501916d927444a24234e9bfe9` | pass |
| `volcano-armor.json` | `dc2b940b3f3a3098e25f5133658754d8dd02c6ba0c732401e82bea4f8749f2f2` | pass |
| `volcano-armor-bramble.json` | `934217192c6f3c0815f24fdada0988c9e7058548bf38b6bb77a9ad586a8d0554` | pass |
| `volcano-armor-bramble-charm.json` | `a4ec7a7ae7776ad491a9769e56480bea2bee731661e2b5c922e44e92b5e8d3bd` | pass |

The exact retained V1p root is
`C:/Users/osaif/AppData/Local/mmo-idle/validation/v1p-execution-operator-20260914`.
No old case was rerun or modified.

## Decision gates and handoff

The packet's desired evidence was at least one prepared kit clearing with a
survivable relief tail. That gate was not met. The approved fodder treatment
did produce a common first kill and extended all four arms to 12.1 seconds,
but remaining leader pressure, target churn, and the surviving Scuttler still
ended the fight. This is a partial improvement, not a basis for an automatic
second nerf, a filler HP/attack proposal, or a reward compensation.

Shorter fodder engagements may affect rates and should be flagged for a later
1x economy pass; rewards were not changed during this combat validation. A
future clear, if authorized in a new packet, would advance only to natural
larger-pack and chain-pull qualification. It would not validate the entire
biome or authorize a downstream run. T4 remains pending earned-entry testing.

Per the packet, Luna should state the exact next operation. Stop here.

## Retained artifacts and hashes

All fresh V1q output files are retained. Hashes below are SHA-256.

### V1q preflight

Root: `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1q-preflight-operator-20260914`

| Artifact | SHA-256 |
|---|---|
| `complete.json` | `4939db4712357653cd9fec89c55a8deea76886d783f6cd38291ae69b372e7043` |
| `hitboxes.json` | `7d2bb18d34e42a4c24ea720168aace8c5cc7e5e0d120080e4bbd5a34f398a0bf` |
| `manifest.json` | `58303471caa6df836af3f4ed09920787d75cf74cacddf146b16ee5eb868f1307` |
| `tundra-purchase-preflight.json` | `fd9eeaaf6b3a6dac58b0697fa885a718db8f95573cd4f2f82a503c926957ffeb` |
| `volcano-control.json` | `5c828ed2e9b19d1e9b1d4ba7dee625425fd30510c61324cd0d74954d91865d8a` |
| `volcano-armor.json` | `b1f3f83ee2388ee331e322b58e710c6ac4bbc87601253b36c56589a24ce5e15c` |
| `volcano-armor-bramble.json` | `b2b4aca4e04059b7091418ef266b47e2c6aa617edaf9f7263b4bd4ee2b0a51c6` |
| `volcano-armor-bramble-charm.json` | `5d0b2a8dbff48c07c11509a6139b0738b2fcff5514478bd8245c052660ae39ec` |

### V1q execution

Root: `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1q-execution-operator-20260914`

| Artifact | SHA-256 |
|---|---|
| `complete.json` | `04e0886720a5365375ba505af40924e7c2964357f19322860e495e358c7d0084` |
| `hitboxes.json` | `7d2bb18d34e42a4c24ea720168aace8c5cc7e5e0d120080e4bbd5a34f398a0bf` |
| `manifest.json` | `cdd2d274eaaff7c10941501d567789e226cf830066d2377234c19f566dc9c91d` |
| `tundra-purchase-preflight.json` | `fd9eeaaf6b3a6dac58b0697fa885a718db8f95573cd4f2f82a503c926957ffeb` |
| `volcano-control.json` | `51f9ce61663d6605d436a5ad9374100c00c647502bfcafab3c4150a269928add` |
| `volcano-armor.json` | `52e861614fc64da9bfee835fe343c36e085a9e800068ca6ab6b5126a14bc9afb` |
| `volcano-armor-bramble.json` | `b207b8dc388b3681461ec52b48ac4c681e275a1ac73fa224034cd914eb8a6894` |
| `volcano-armor-bramble-charm.json` | `7c873f7494f63987c8fda17cd4836deabcda57268467e08b339964605e938a1c` |

No Docker, live route, or experiment-network artifacts exist for this packet.
