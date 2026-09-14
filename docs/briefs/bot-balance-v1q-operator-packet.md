# V1q — Validate the approved Volcano fodder adjustment

Prepared 2026-09-14, not executed. User launches Luna. Read CLAUDE.md.
This packet authorizes only four local diagnostic cases, once each; no live
route, Docker, Tundra rerun, T4 combat case, balance edits or adaptive retries.

## Frozen treatment

Revision `e9577ec45fb04f170c4033b486a29d76f1654f92`;
tree `e3b5c2faaa43c6d2931d360e70d5e7ff73cbc91d`.
User approved the T3 correction and analogous T4 filler adjustment:

| Enemy | HP before -> after | Attack before -> after |
|---|---|---|
| T3 Ember Scuttler | 1220 -> 650 | 55 -> 45 |
| T4 Ember Skink | 1350 -> 720 | 90 -> 75 |

T4 receives approximately the same proportional reduction, preserving its
faster attack cadence and separately authored Burn (13 damage per stack,
4-stack cap). Burn damage is not derived from base attack in its application
path. This is a provisional T4 role correction, not a validated T4 balance.
Heat, pack composition/density, leaders, rewards and behavior are unchanged.
Two stat changes constitute one approved fodder treatment; this cannot isolate
the individual contribution of HP versus attack.

## Exact comparison

Reuse `server/scripts/v1pDiagnostics.ts` unchanged at the NEW frozen revision.
Its filenames/arm names still say V1p/volcano; keep them unchanged and identify
the containing output directory and report as V1q. Do not check out V1p's old
revision. Run only Part A of that older packet, with these instructions taking
precedence. Do not run its Part B or its handoff prompt.

Same actual V1m snapshot, unchanged:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t064043z-spirit-wisp-travel-t2-bridge-v/runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-b.json`

SHA256 `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144`.
Never substitute the repository fixture or prior end states.

Four sequential arms, all27RP, same Wisp/Ruinous Axe/Tempered Core/Plains Boots+5,
Sweep, Defensive and combat rules, same seed173 and100ms ticks:

1. `volcano-control`: Cave Vest, Mountain Charm, Second Wind + Brace.
2. `volcano-armor`: Plains armor, Mountain Charm, Second Wind + Brace.
3. `volcano-armor-bramble`: Plains armor, Mountain Charm, Second Wind + Bramble.
4. `volcano-armor-bramble-charm`: Plains armor, Plains charm, Second Wind + Bramble.

Same real Alacrity node geometry, full Heat and anti-kiting, Hound + two Scuttlers
engaged at fixed starting positions. No lava/natural population/repopulation.
All gear+5; same full starting health/barrier appropriate to each kit. The new
three-body raw HP is2740 versus3880. This does not represent every natural
4–6-body composition. Gear/ability grants remain synthetic and rewards1x;
log any intra-fight progression. No economy or canonical progression conclusion.

Fight stops at death or60 simulated seconds. A complete roster kill starts the
unchanged30-second same-world observation tail. Do not heal/reset Heat, force
combat exit, add enemies or extend the tail. Maximum90 simulated seconds per
case. Death/timeout continues to the next independent arm; setup/infrastructure
failure stops the packet. No retry, resume or operator fix.

## Setup and execution

Create a NEW detached checkout at the frozen revision. Install dependencies
with `pnpm install --frozen-lockfile`; preserve unrelated work. Record Node/pnpm,
HEAD/tree, clocks, input hash and stdout/stderr/exit codes. No services needed.
Use fresh preflight/execution directories outside the checkout, with V1q names.

Copy these atlas inputs from the main project only as needed and verify hashes:

- `client/public/assets/sprites.png`: `6ed9a1b7f7124cc2489d42239a73ed5f4a9382b3eeb51ce9be93a53722b72c22`
- `client/public/assets/sprites.json`: `8611f8498a03b0dbd8b7366937ef670686b2bf911c0c6e4310d0ba9aae7c1156`

From isolated root, replace path placeholders with the actual input above and
NEW output directories:

```powershell
$env:NODE_ENV = 'production'
pnpm --filter @mmo-idle/server exec tsc --noEmit -p tsconfig.diagnostics.json
pnpm --filter @mmo-idle/server exec tsx --conditions=development scripts/v1pDiagnostics.ts --preflight '<actual snapshot>' '<new V1q preflight directory>'
```

Require exit0, four setup-only cases, `complete.json` cases4 and the runner's
unchanged `tundra-purchase-preflight.json`. That last artifact is only an inherited
zero-tick purchase check, not authorization for a Tundra run. Verify input/atlas
hashes and generated hitboxes
`7d2bb18d34e42a4c24ea720168aace8c5cc7e5e0d120080e4bbd5a34f398a0bf`.
Require frozen HEAD/tree and no tracked source-content changes. Then execute once:

```powershell
pnpm --filter @mmo-idle/server exec tsx --conditions=development scripts/v1pDiagnostics.ts --execute '<actual snapshot>' '<new V1q execution directory>'
```

Whole packet ceiling30 real minutes including setup; start execution with at
least10 minutes remaining. Two-minute per-case compute guard is checked between
ticks; operator terminates if stuck inside a tick. Preserve partial artifacts
on any failure. Retain checkout/evidence; no global cleanup or network creation.

Preparation checks already passed: full `pnpm typecheck`, ecology-polish test,
ambient-ramp test, and all four setup-only arms at
`C:/Users/osaif/AppData/Local/mmo-idle/validation/v1q-preflight-1`.
No V1q combat execution or full repository test-suite pass is claimed.

## Report and decision gates

Write/index `docs/briefs/bot-balance-v1q-report.md`. Hash every artifact. Compare
each arm against its exact retained V1p counterpart at
`C:/Users/osaif/AppData/Local/mmo-idle/validation/v1p-execution-operator-20260914`;
verify old hashes against [V1p report](bot-balance-v1p-report.md). Do not rerun old
cases. Report starting stats, kills/order/timestamps, time to first kill and
clear, remaining enemy HP at death, incoming HP damage separate from absorption
and healing, Sweep secondary hits, target churn, Bramble timing and on-kill
recovery. Preserve complete journals through lethal events.

If a case clears, record Heat at clear, last contact, OUT_OF_COMBAT transition,
each decay step, zero-Heat time and recovery at the tail endpoint. If it does
not clear, these are unobserved; death's combat-state reset is not cooling data.
Treat post-kill divergence in RNG/progression/aggro as consequences to report,
not an identical counterfactual continuation.

Desired evidence: at least one credible prepared kit clears with relief after
early fodder kills and survives its tail. A first kill followed by death is
partial improvement. All failures mean review remaining leader pressure and
target/AoE delivery before another proposal, not an automatic second nerf.
A clear advances to natural larger-pack and chain-pull qualification in a new
packet; it does not validate the entire biome or authorize a downstream run.
T4 remains pending an earned-entry test; no synthetic T3-to-T4 substitution.
Unchanged rewards with shorter kills may affect rates: flag for the later1x
economy pass without compensating rewards during this combat validation.

## Handoff

Ask Luna: “Operate bot-balance-v1q-operator-packet.md exactly at its frozen
revision. Run the four local Volcano diagnostics once using the inherited
V1p script, compare against retained V1p evidence, write/index the V1q report,
and stop. No live route, T4 case, retries, edits or additional experiments.”
