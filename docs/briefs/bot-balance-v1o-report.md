# V1o — Pursuit counterplay and biome pressure diagnostics

Status: completed once under the supplied frozen packet. This was an
in-memory authoritative combat diagnostic, not a live bot campaign, farming
run, progression checkpoint, or economy validation. It used one fixed seed and
eight fixed arms. Four arms cleared and four arms died. No harness or
infrastructure failure occurred. No source, gameplay, balance, Docker, live
server, database, or bot changes were made.

The global anti-kiting acceleration remained enabled. Tundra compared the
inherited Heavy/Chill case with Hamstring, Desert Boots, and both together.
Volcano compared a fixed single target and fixed three-monster roster with and
without Heat. Results are observations from one seed, not win rates, optimal
builds, or a basis for a precise nerf.

## Session ledger

| Field | Value |
|---|---|
| Recorded setup start | 2026-09-14T08:43:32.7489105Z |
| Packet ceiling | 30 minutes from recorded setup start |
| Packet deadline | 2026-09-14T09:13:32.7489105Z |
| Evidence re-hash pass | 2026-09-14T08:53:12.2062278Z |
| Frozen execution revision | 91690dd471b2bc3a94908c6465a2e2adc458e124 |
| Frozen source tree | ba3b70a59966ca6f4f1c253b5e79f56ab9730bff |
| Validation checkout | C:/Users/osaif/AppData/Local/mmo-idle/validation/v1o-diagnostics-20260914 |
| Runner | server/scripts/v1oDiagnostics.ts |
| Input Snapshot B | C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t064043z-spirit-wisp-travel-t2-bridge-v/runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-b.json |
| Input SHA-256 | c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144 |
| Node / pnpm | v22.16.0 / 8.15.1 |
| Lockfile SHA-256 | 513852d0b792b5e33920c64a704c6290f66c618cf67d9179fb8bb0eb8b22db10 |
| Dependency install | pnpm install --frozen-lockfile; exit 0; 18.7 seconds |
| Diagnostic TypeScript check | pnpm --filter @mmo-idle/server exec tsc --noEmit -p tsconfig.diagnostics.json; exit 0 |
| Docker / live services | Not started by this packet; unrelated existing services were left untouched |

The isolated checkout was created fresh and detached at the exact revision.
The only status entry after the mandated atlas copy was
M client/public/assets/sprites.json. Its working-tree blob and the frozen
HEAD blob were both f3e81839d6b13806e1c549c53b9c31dbe10697b8, and git diff was
empty; no source content change was present. The required sprites.png copy
was also verified.

## Setup-only preflight

The fresh preflight directory was
C:/Users/osaif/AppData/Local/mmo-idle/validation/v1o-preflight-operator-20260914.
The exact packet command exited 0. It produced eight setup-only case results,
zero ticks, manifest.json, and complete.json with cases=8. The manifest
verified the retained input, both atlas hashes, the generated hitbox hash,
seed 173, 100 ms ticks, 60,000 ms cap, unchanged anti-kiting, reward 1x,
canonical=false, and the synthetic diagnostic fixture classification.

The runner stdout was:

    volcano-single-no-heat: setup validated; no ticks
    volcano-single-heat: setup validated; no ticks
    volcano-pack-no-heat: setup validated; no ticks
    volcano-pack-heat: setup validated; no ticks
    tundra-control: setup validated; no ticks
    tundra-hamstring: setup validated; no ticks
    tundra-boots: setup validated; no ticks
    tundra-both: setup validated; no ticks

## Single authorized execution

The fresh execution directory was
C:/Users/osaif/AppData/Local/mmo-idle/validation/v1o-execution-20260914.
Execution began with more than 20 minutes remaining in the packet window. The
exact packet command exited 0. All eight case files are complete, each has
elapsed/100 samples and its embedded complete world journal, and
complete.json records cases=8. No partial case file was emitted. No runner
stderr was observed in the operator transcript.

The stop outcome is gameplay-only:

| Arm | Outcome | Stop time | Kills | Remaining enemy HP | First incoming contact | First kill |
|---|---|---:|---:|---|---:|---:|
| volcano-single-no-heat | clear | 9.1 s | 1 | Ember Scuttler 0 | 2.6 s | 9.1 s |
| volcano-single-heat | clear | 9.1 s | 1 | Ember Scuttler 0 | 2.6 s | 9.1 s |
| volcano-pack-no-heat | death | 12.1 s | 0 | Cinder Hound 690; Ember Scuttler 272 and 1220 | 2.8 s | — |
| volcano-pack-heat | death | 9.5 s | 0 | Cinder Hound 724; Ember Scuttler 257 and 1220 | 2.8 s | — |
| tundra-control | death | 13.7 s | 0 | Glacier Bear 286 | 5.9 s | — |
| tundra-hamstring | clear | 16.8 s | 1 | Glacier Bear 0 | 6.1 s | 16.8 s |
| tundra-boots | clear | 16.8 s | 1 | Glacier Bear 0 | 10.2 s | 16.8 s |
| tundra-both | clear | 16.8 s | 1 | Glacier Bear 0 | 12.0 s | 16.8 s |

First incoming contact means the first observed world-journal damage event
targeting the player. It is not inferred from equipment, target selection, or
the pursuit timer. A direct hitbox gap of zero was observed only in the two
Volcano pack arms at 3.0 s; single-target and Tundra cases had positive
minimum recorded gaps even when incoming attacks had already occurred.

## Damage and sustain

The journal totals below separate actual player HP damage, barrier absorption,
and explicit heal events. Gross and mitigated are the sums of the per-event
damage mitigation fields. The heal column is not the recorder's totalHealed
field.

| Arm | Gross -> mitigated incoming | HP damage | Barrier absorbed | Explicit HP healing | Final HP / barrier |
|---|---:|---:|---:|---:|---:|
| volcano-single-no-heat | 275 -> 125.2 | 3.0 | 132.0 | 0 across 0 events | 233.0 / 0 |
| volcano-single-heat | 275 -> 125.2 | 25.0 | 132.0 | 0 across 0 events | 211.0 / 0 |
| volcano-pack-no-heat | 1025 -> 413.4 | 353.0 | 132.0 | 80 across 40 events | 0 / 0 |
| volcano-pack-heat | 810 -> 328.9 | 319.0 | 132.0 | 70 across 35 events | 0 / 0 |
| tundra-control | 723 -> 181.1 | 350.4 | 138.6 | 72 across 36 events | 0 / 0 |
| tundra-hamstring | 482 -> 120.7 | 124.7 | 201.3 | 83 across 41 events | 200.3 / 29.7 |
| tundra-boots | 482 -> 120.7 | 184.1 | 141.9 | 48 across 24 events | 103.4 / 0 |
| tundra-both | 241 -> 60.4 | 31.0 | 132.0 | 3 across 1 event | 208.1 / 33 |

The two Volcano single-target arms both cleared at the same recorded time.
Heat reached stack 3 and increased the observed HP damage from 3 to 25 and
player outgoing HP damage from 1331 to 1485. The pack Heat arm died sooner,
so its cumulative incoming totals are lower than the no-Heat pack arm despite
the higher ambient pressure; those totals must not be read as Heat being less
dangerous.

## Ambient pressure, pursuit, and displacement

Ambient trajectories are sampled stack transitions. For a death, the final
sample can clear the status during death processing; peak and transition
history are retained separately. Pursuit is reported as maximum timer to final
timer and maximum sampled effective speed to final sampled speed from the
monster position/AI telemetry.

| Arm | Ambient stack trajectory | Pursuit timer; effective speed | Player displacement: net / path |
|---|---|---|---:|
| volcano-single-no-heat | none | Scuttler 2.5 -> 1.346 s; 294 -> 167 | 1477.3 / 1477.3 |
| volcano-single-heat | Heat 1@0.2 s -> 2@3.2 s -> 3@6.2 s; peak 3 | Scuttler 2.5 -> 1.346 s; 294 -> 167 | 1477.3 / 1477.3 |
| volcano-pack-no-heat | none | Hound 2.3 -> 2.0 s; 298 -> 80.5; Scuttlers 2.7 -> 1.970 s; 316 -> 73.6 and 2.9 -> 0 s; 339 -> 73.6 | 2057.3 / 2075.7 |
| volcano-pack-heat | Heat 1@0.2 s -> 2@3.2 s -> 3@6.2 s -> 4@9.2 s; peak 4 | Hound 2.3 -> 1.803 s; 298 -> 80.5; Scuttlers 2.7 -> 1.340 s; 316 -> 166 and 2.9 -> 0 s; 339 -> 73.6 | 1571.2 / 1589.5 |
| tundra-control | Chill 1@0.2 s -> 2@4.2 s -> 3@8.2 s -> 4@12.2 s; peak 4 | Bear 5.9 -> 5.350 s; 200 -> 22 | 453.7 / 1960.7 |
| tundra-hamstring | Chill 1@0.2 s -> 2@4.2 s -> 3@8.2 s -> 4@12.2 s -> 5@16.2 s; peak 5 | Bear 8.8 -> 7.800 s; 296 -> 263 | 952.8 / 2081.3 |
| tundra-boots | Chill 1@0.2 s -> 2@4.2 s -> 3@8.2 s -> 4@12.2 s -> 5@16.2 s; peak 5 | Bear 10.1 -> 6.825 s; 339 -> 231 | 2713.5 / 3442.2 |
| tundra-both | Chill 1@0.2 s -> 2@4.2 s -> 3@8.2 s -> 4@12.2 s -> 5@16.2 s; peak 5 | Bear 11.9 -> 10.650 s; 398 -> 357 | 2464.3 / 2938.4 |

Every arm started with the player at (2180, 2400), 220 px left of the node
center. Monsters used the packet's center/60 px vertical placement and fixed
engagement roster. All sampled player positions stayed in the assigned
node-t3-biome-01 node; no transition, repopulation, natural recruitment, or
travel-only movement was observed. Sampled movement ownership remained the
in-combat orbit, always auto-path-enemy, and always avoid-hazards rules. The
net/path values above are calculated from the retained 100 ms positions; exact
end positions remain in each case artifact.

## Techniques, Hamstring, boots, targeting, and guards

Sweep remained armed in every arm. Ordinary sequencing, including cooldowns,
limited Hamstring to the activations shown below.

| Arm | Technique activations | Guard timing | Hamstring status | Boot activation observation |
|---|---|---|---|---|
| volcano-single-no-heat | Sweep@0.1 s; 6.1 s | none | not granted | no multiplier above 1 before clear; inherited Plains Boots showed 1.6 only at the clear sample |
| volcano-single-heat | Sweep@0.1 s; 6.1 s | none | not granted | same inherited 1.6 one-sample clear-boundary observation |
| volcano-pack-no-heat | Sweep@0.1 s; 6.1 s; 12.1 s | Second Wind@6.0 s; Brace@7.2 s | not granted | no multiplier above 1 before death |
| volcano-pack-heat | Sweep@0.1 s; 6.1 s | Second Wind@6.0 s; Brace@6.1 s | not granted | no multiplier above 1 before death |
| tundra-control | Sweep@0.1 s; 6.1 s; 12.1 s | Second Wind@10.1 s; Brace@10.2 s | not granted | no multiplier above 1 |
| tundra-hamstring | Sweep@0.1 s; 6.1 s; 12.1 s; Hamstring@0.2 s; 7.4 s; 13.4 s | Second Wind@12.2 s; Brace@12.3 s | ability-slowed observed in 1.0–4.4 s, 8.2–11.6 s, 14.8–16.8 s; 9.1 s of active 100 ms samples | no Desert Boots grant; inherited Plains Boots was 1.6 at the final clear sample only |
| tundra-boots | Sweep@0.1 s; 6.1 s; 12.1 s | Second Wind@14.5 s; Brace@14.6 s | not granted | Desert Boots +5 multiplier 1.2 on 101 of 168 samples; observed at least once from 0.1–16.7 s |
| tundra-both | Sweep@0.1 s; 6.1 s; 12.1 s; Hamstring@0.2 s; 7.4 s; 13.4 s | none | ability-slowed observed in 1.0–4.4 s, 8.2–11.6 s, 14.8–16.8 s; 9.1 s of active 100 ms samples | Desert Boots +5 multiplier 1.2 on 90 of 168 samples; observed at least once from 0.1–16.7 s |

The boot column is sampled bootMult telemetry, not an inferred equipment
benefit. There is no separate boot activation world-journal event. Only the
boots and both arms received the diagnostic Desert Boots grant. The one-sample
1.6 value on inherited Plains Boots in the other single/clear arms is retained
as an observation and is not attributed to Desert Boots.

All arms acquired monster 1 as the first target at 0.1 s and released the
target at terminal clear/death processing. The two pack arms selected monster
2 at 2.4 s and monster 3 at 2.9 s, then churned among the fixed three IDs until
the terminal none state; the complete target sequence is embedded in each
case journal. This was not natural pack recruitment: every specified monster
was explicitly engaged at setup.

## Progression and telemetry limits

The sample progression delta was measured against the applied profile baseline.

| Arms | Observed biome XP delta | Levels / mastery |
|---|---|---|
| tundra-hamstring, tundra-boots, tundra-both | Tundra +437 each | No sampled level change; no separate mastery field in the retained per-tick recorder |
| tundra-control | none before death | No sampled level change; mastery delta unavailable |
| all four Volcano arms | none | No sampled level change; mastery delta unavailable |

The diagnostic reward multiplier was 1x, but this does not make the synthetic
entry a progression checkpoint. The retained recorder exposes per-tick biome
levels and biome XP, not a final per-tick mastery counter; mastery is therefore
reported unavailable rather than inferred as unchanged. No purchase, ordinary
acquisition, recipe unlock, or balance adjustment occurred.

All eight case JSON files retain samples at exactly 100 ms through the terminal
elapsed time and the complete embedded world journal. Deaths are gameplay
outcomes, not setup failures. The fixed-seed contrasts also consume RNG
differently as actions diverge, so the arms are descriptive diagnostics rather
than independent statistical estimates.

## Interpretation for Astra review

Tundra provides the requested counterplay screen. The control died at 13.7 s
with 286 Bear HP remaining. Hamstring, Desert Boots, and both together all
cleared at 16.8 s; their first observed incoming contacts were 6.1, 10.2, and
12.0 s respectively, compared with 5.9 s for control. The combinations also
showed different pursuit timers, speeds, routes, guard timing, and explicit
healing. These are observed single-seed contrasts; they do not establish a
causal ranking or ordinary acquisition value.

Volcano shows the fixed roster/Heat pressure screen. Single Ember Scuttler
clears were both 9.1 s, while Heat reached stack 3 and raised observed incoming
HP damage. Both pack arms died without a kill; the no-Heat arm stopped at
12.1 s and Heat stopped at 9.5 s with Heat at stack 4. The shorter Heat death
window explains why cumulative damage totals cannot be used as a direct
pressure ranking.

No result here validates natural travel, recruitment, farming recovery, boss
survival, normal-speed economy, or biome-wide balance. No precise nerf or live
economy change follows from this packet alone. After review, any promising
counterplay should be qualified in an ordinary authorized packet or followed
by a separately approved small tuning pass.

## Retained artifacts and hashes

The input and atlas files were re-hashed after execution:

| Retained input | SHA-256 |
|---|---|
| C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t064043z-spirit-wisp-travel-t2-bridge-v/runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-b.json | c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144 |
| C:/Users/osaif/Documents/Claude/Projects/MMO idle/client/public/assets/sprites.png | 6ed9a1b7f7124cc2489d42239a73ed5f4a9382b3eeb51ce9be93a53722b72c22 |
| C:/Users/osaif/Documents/Claude/Projects/MMO idle/client/public/assets/sprites.json | 8611f8498a03b0dbd8b7366937ef670686b2bf911c0c6e4310d0ba9aae7c1156 |
| Isolated client/public/assets/sprites.png | 6ed9a1b7f7124cc2489d42239a73ed5f4a9382b3eeb51ce9be93a53722b72c22 |
| Isolated client/public/assets/sprites.json | 8611f8498a03b0dbd8b7366937ef670686b2bf911c0c6e4310d0ba9aae7c1156 |

Preflight artifacts are retained at
C:/Users/osaif/AppData/Local/mmo-idle/validation/v1o-preflight-operator-20260914:

| Artifact | SHA-256 |
|---|---|
| complete.json | bd42a2a99d94b0a635e5dcc18517f856387796299ea57021fd68712da526013e |
| hitboxes.json | 7d2bb18d34e42a4c24ea720168aace8c5cc7e5e0d120080e4bbd5a34f398a0bf |
| manifest.json | 58344eddfd4420fc1d3add2e2b99805e7ed77bd9ab2b3a1bc19beb68ee47e43a |
| tundra-boots.json | ec8bd322363227aebaf697074879d0d9fc47cbf3283bf89c0f3faaaebe1569ff |
| tundra-both.json | 41e0356f8629e16b9de57262ecbb2120d129d81fd8743bb63f02a8ea65d352a2 |
| tundra-control.json | 79debde87b0c884a921d99535dda9ec84cb43707b70419987eede95847919e62 |
| tundra-hamstring.json | b13739bac5df73de82bad38cac3edb04d980d70b4a798cf9ff4d881e90bc9e71 |
| volcano-pack-heat.json | ec06165b85c182f828360a5804937a925e5fadde65b76b24a49264385e5af909 |
| volcano-pack-no-heat.json | d4c94e6a731a2bfee7b060cd604d1b360654825480069401f74161eaeee80e32 |
| volcano-single-heat.json | fefdc2ec7d19cc0a36b6cfb81c43b53e03738304a51bc4b0aff596cdf0f48442 |
| volcano-single-no-heat.json | 4ed4ba7628a811e9eee1762c5042aff269de9a39d38c3f35c9fcfb036468bc15 |

Execution artifacts are retained at
C:/Users/osaif/AppData/Local/mmo-idle/validation/v1o-execution-20260914:

| Artifact | SHA-256 |
|---|---|
| complete.json | 2d509e6a768adbb02b62d6fe5363ce48cadf3c1f13331a92f9b19c02907c3064 |
| hitboxes.json | 7d2bb18d34e42a4c24ea720168aace8c5cc7e5e0d120080e4bbd5a34f398a0bf |
| manifest.json | 832e82c1e765f1fc16c44126639134bc0e8f9ce56cc83e718447d9422c557f58 |
| tundra-boots.json | 57ebdbe27809180a732e5b42493881999dee72baeb842783ff5bbaab8f10d51f |
| tundra-both.json | 5df0bbdcd4eb66f279e096730764ac092d652357c1a0da01a7803887aca73218 |
| tundra-control.json | 4f98bd00ae4fcf4322ef2f8eca994435aba22020b69a95e67badb060bb48a65f |
| tundra-hamstring.json | 13d66fcd8a78c9b60cc7665f95d6aa18d26ac098a133be202b162205982d681b |
| volcano-pack-heat.json | 83002879198b8ecc399da92c15c6afae42abcabfc0206e5cc497f8fa5c810120 |
| volcano-pack-no-heat.json | f1f49aa495907b5299ac6bd3ef7178e743e7b56974ea243c12f08d7666ac86ac |
| volcano-single-heat.json | be421b7260586729a3f3fa7f4f2ca5cf31c6bcfc496c81e2c65325c8979fd79e |
| volcano-single-no-heat.json | 2b42910536d1d987bfc9e0f2c8b9db22d73912a270fb466821fd5efead18ec4e |

Both retained directories and the small isolated checkout are intentionally
preserved for review. No retry, rerun, cleanup, automatic winner, or balance
proposal was performed.
