# Durability 8 report — Desert controllers and Tundra shield scaling

Status: complete, synthetic benchmark evidence only. This report records one
exact frozen run and returns the balance decision to the operator. It does not
authorize a source patch, live balance change, client change, economy claim, or
human-play conclusion.

## Decision summary

- The batch completed exactly once: 48/48 cells and 144/144 observations. There
  were 141 normal 300s window endings, 3 player deaths, 0 wall-ceiling censors,
  0 failed observations, and no retries or restarts.
- The frozen source, geometry, player view, initial stats, non-target roster
  members, and node setup matched across each three-arm class/alternate/seed
  group. The only declared changes were Desert controller HP and the Tundra
  Glacier Bear HP/shield-fraction overlays.
- For the six baseline classes, the median of the tougher named Desert
  controller (the per-class max of Dune Stalker and Desert Basilisk) was 7.53s
  in control, 14.45s at controller HP2x, and 21.95s at controller HP3x. The
  packet's 25–35s value is a typical-target context, not a hard per-build
  minimum; this screen remains below it at the six-class center. HP3x produced
  all three deaths, all in Striker, while HP2x had no deaths but still exposed
  severe near-death runs. Return a **2x–3x diagnostic bracket**, with 2x the
  safer next candidate and 3x retained as an upper-bound pressure case. Do not
  select a global live value from this three-seed synthetic screen.
- For the six baseline Glacier Bear rows, the center was 8.23s in control,
  14.05s with Bear HP1.5x and the normal 20% shell, and 12.80s with Bear HP1.5x
  plus a fixed shell. The high-HP shell reproduced the old Conduit extreme
  lifetime (142.40s baseline, 144.90s alternate); fixed-shell returned those
  rows to 16.45s and 18.85s. Return **Bear HP1.5x with the fixed-shell
  fraction** (13.333...% authored overlay, approximately 345 shield at the
  spawned node HP) as the focused shield-scaling candidate.
- No live patch, automatic winner, class nerf, weapon swap, combined treatment,
  or ability decision was made. Ability and weapon balance remain separate
  follow-up work.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-durability8-operator-packet.md](bot-balance-durability8-operator-packet.md) |
| Frozen source revision | 04e80e9ae38183c194f4cacc4b5fa171a3de8873 |
| Frozen source tree | 8a7834e43ff2d5a0fa8a4f6f4fb72ab44f9115c6 |
| Definitions SHA-256 | FFA732EF753525D381623E4F8CEFD131947357FFC1364445E63940CC5AAA59C0 |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitboxes SHA-256 | 08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83 |
| Qualification directory | [durability8/qualification](<C:/Users/osaif/AppData/Local/mmo-idle/validation/durability8/qualification>) |
| Qualification index SHA-256 | 082AD1109709E3A2058ADEDBEB9EBE2E037EADC9B567BE47D2E10540FCB8D034 |
| Detached source worktree | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability8-20260915/source |
| Results root | [durability8 results](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability8-20260915/results>) |
| Manifest mode / trial | run / durability8 |
| Node | T3 Desert `node-t3-desert-03`; T3 Tundra `node-t3-tundra-03` |
| Time step / window | 100ms / 300s per observation |
| Seeds | 173, 947, 2027 |
| Matrix / observations | 48 cells / 144 observations |
| Synthetic / economy | `true` / `economyEligible=false` |

The exact combat command was:

~~~powershell
pnpm --dir C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability8-20260915/source --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability8 --mode=run "--revision=04e80e9ae38183c194f4cacc4b5fa171a3de8873" "--hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json" "--out=C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability8-20260915/results"
~~~

Run window: 2026-09-15T21:04:10.7416018Z–2026-09-15T21:09:40.8929819Z UTC;
wall time 330.1513801s (about 5m30.151s). The single sequential process exited
0. C: free space was 42,854,109,184 bytes at start and 42,167,021,568 bytes at
end, a decrease of 687,087,616 bytes (655.0 MiB). Peak RSS was not
independently sampled.

No Docker, database, restart, retry, source edit, balance edit, adaptive rerun,
or extra experiment was used. The detached checkout stayed at the frozen
revision/tree and clean after the run. The generated analysis was produced with:

~~~powershell
node C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability8-20260915/source/scripts/ttk-survey-report.mjs C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability8-20260915/results
~~~

Qualification was READY before launch: all 48 configurations passed in the
clean frozen source, including matched views/rosters/HP/geometry, target
presence, overlay/restoration coverage, focused pilots, frozen workspace and
bench checks, and report generation. Full-suite validation and human/browser
playtest were not run.

## Arm identity and matched setup

### Desert controller arms

Only Dune Stalker and Desert Basilisk authored HP changed. The normal 1.15 node
modifier produced the spawned values below. Sandweaver/Gilded Scarab remained
authored 510 HP and spawned 587 HP in every arm; its attacks and all controller
attacks/defenses/abilities remained unchanged.

| Arm | Controller authored HP | Spawned controller HP | Sandweaver authored/spawned HP |
|---|---:|---:|---:|
| control | 1,350 | 1,552 | 510 / 587 |
| controller-hp2 | 2,700 | 3,105 | 510 / 587 |
| controller-hp3 | 4,050 | 4,658 | 510 / 587 |

### Tundra Bear arms

Only Glacier Bear HP and, in the fixed-shell arm, shield fraction changed. The
node modifier produced 1,725 HP from authored 1,500 and 2,588 HP from authored
2,250. Actual shield capacity is therefore approximately 345, 518, and 345 in
the three rows; the packet's authored-equivalent capacities are 300, 450, and
300. Shield interval remained 11s, duration 6s, shatter self-damage 12%, and
vulnerability 30% for 4s.

| Arm | Authored Bear HP | Spawned Bear HP | Shield fraction | Approx. spawned shell |
|---|---:|---:|---:|---:|
| control | 1,500 | 1,725 | 20% | 345 |
| bear-hp1.5 | 2,250 | 2,588 | 20% | 518 |
| bear-hp1.5-fixed-shell | 2,250 | 2,588 | 13.333...% | 345 |

The fixed-shell implementation rescales the fraction from the authored old HP,
then restores the shared monster definitions between worlds. HP rounding means
the report compares spawned capacity and raw absorption, not only fractions.

### Matched setup

All rows used +5 gear, medium frames, the normal survey range, biome armor and
charm, Mountain Boots, Tempered Core, offensive stance, existing survey
abilities/runes, and fixed Sweep. Slam was not equipped. No Desert weapon swap
was introduced; the committed Falchion rework was present in the frozen source
but no build equipped it.

| Class | Alternate | Weapon | Path |
|---|---|---|---|
| Striker | no | volcanic-cinderlash | cadence-root / cadence-balanced / cadence-range-close |
| Squire | no | mountain-avalanche-maul | cooldown-root / cooldown-balanced / cooldown-range-close |
| Apprentice | no | cave-cataclysm-axe | dot-root / dot-balanced / dot-range-mid |
| Slinger | no | jungle-venomthorn-rapier | reload-root / reload-balanced / reload-range-mid |
| Slinger | yes | swamp-blightbrand | reload-root / reload-balanced / reload-range-mid |
| Conduit | no | cave-cataclysm-axe | summoner-root / summoner-balanced / summoner-range-mid |
| Conduit | yes | jungle-venomthorn-rapier | summoner-root / summoner-balanced / summoner-range-mid |
| Spirit | no | cave-cataclysm-axe | energy-root / energy-balanced / energy-range-mid |

The six rows marked alternate=no are the only rows used for the typical-target
center. Slinger and Conduit alternatives remain diagnostic comparisons.

## Artifact verification

The post-run audit found 144 expected run directories, each with
`ready.json`, `summary.json`, `events.jsonl`, and `samples.jsonl`; 581 recursive
files total including the five root artifacts; 0 missing, unexpected, or failed
observations. `complete.json` records `{"cells":48,"runs":144,"mode":"run"}`.

Across every matched class/alternate/arm/seed group, the starting player view,
geometry roster hash, and initial stats hash were identical. The only roster
hash variants were the declared HP overlays: two distinct variants for the
Tundra group (control versus the two HP1.5 rows) and three for the Desert group.
All target types were present, and the unchanged companion/dealer HP values
were stable in READY data.

| Artifact | SHA-256 / result |
|---|---|
| [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability8-20260915/results/manifest.json>) | 941B21A439E17B42B747F0F23F694D34CE7BB29D771FF49CD64A43B7203E25D4 |
| [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability8-20260915/results/complete.json>) | 52E62DB9E7D570436F0EEA3C90E817DD5776D129F319B3E2406DA3B0EF809A0C; `{"cells":48,"runs":144,"mode":"run"}` |
| [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability8-20260915/results/index.json>) | 64E93A59BD11D3C8AB8B2CBF730C87823F6E337E505D74B17B24339D5D606BBF |
| [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability8-20260915/results/analysis.json>) | 7FF2AEACA550BFA7E481B50D0DDBD70A571C380A6264CB2CB31CD8919FECFB80 |
| [analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability8-20260915/results/analysis.md>) | B848617653055B266073A2A8F0F61BF796B327E809C4E69140EEC1890BC5AC61 |
| Result structure | 144 run directories, 581 recursive files, 0 `failed.json` |

## Per-seed survival and pressure

Every seed for every exact class/alternate/arm cell is shown below. Each entry
is `outcome/time / minimum HP / largest hit / maximum damage in one second /
recovery completed/interrupted/open / total incoming damage`. `W` means the
300s window ended; `D` means player death. Recovery counts are summary recovery
episodes, not a death-rate estimate.

### Tundra

| Class / arm | s173 | s947 | s2027 |
|---|---|---|---|
| Striker / control | W@300.0s / 48.4% / 189 / 189 / 18/7/0 / 5,995 | W@300.0s / 58.7% / 189 / 189 / 20/4/1 / 6,346 | W@300.0s / 60.6% / 189 / 189 / 14/12/1 / 6,119 |
| Striker / bear-hp1.5 | W@300.0s / 38.3% / 189 / 189 / 15/10/0 / 7,117 | W@300.0s / 38.3% / 189 / 189 / 9/17/0 / 7,706 | W@300.0s / 38.4% / 189 / 189 / 11/14/1 / 7,269 |
| Striker / bear-hp1.5-fixed-shell | W@300.0s / 38.0% / 189 / 189 / 12/12/1 / 7,352 | W@300.0s / 38.3% / 189 / 189 / 10/15/0 / 7,921 | W@300.0s / 38.4% / 189 / 189 / 11/14/0 / 7,433 |
| Squire / control | W@300.0s / 67.6% / 153 / 153 / 14/8/1 / 5,447 | W@300.0s / 64.4% / 153 / 153 / 17/4/0 / 5,459 | W@300.0s / 67.7% / 153 / 153 / 14/9/0 / 5,602 |
| Squire / bear-hp1.5 | W@300.0s / 61.5% / 153 / 153 / 14/4/0 / 6,119 | W@300.0s / 58.9% / 153 / 153 / 13/8/0 / 6,574 | W@300.0s / 59.0% / 153 / 153 / 11/11/0 / 6,640 |
| Squire / bear-hp1.5-fixed-shell | W@300.0s / 61.7% / 153 / 153 / 14/6/1 / 5,958 | W@300.0s / 61.5% / 153 / 153 / 11/9/0 / 6,484 | W@300.0s / 61.6% / 153 / 153 / 10/10/1 / 6,741 |
| Apprentice / control | W@300.0s / 36.2% / 143 / 150 / 15/10/0 / 2,893 | W@300.0s / 54.3% / 136 / 139 / 15/8/1 / 2,544 | W@300.0s / 51.0% / 133 / 138 / 20/6/0 / 2,241 |
| Apprentice / bear-hp1.5 | W@300.0s / 39.1% / 146 / 153 / 15/5/0 / 3,911 | W@300.0s / 3.2% / 148 / 283 / 11/6/1 / 4,758 | W@300.0s / 10.1% / 159 / 168 / 16/5/0 / 3,342 |
| Apprentice / bear-hp1.5-fixed-shell | W@300.0s / 32.3% / 142 / 148 / 16/5/1 / 3,272 | W@300.0s / 7.5% / 141 / 275 / 12/7/0 / 4,508 | W@300.0s / 23.9% / 146 / 153 / 16/7/0 / 3,293 |
| Slinger / control | W@300.0s / 43.8% / 148 / 148 / 20/7/0 / 2,406 | W@300.0s / 44.2% / 148 / 148 / 16/9/1 / 2,795 | W@300.0s / 49.5% / 148 / 148 / 19/8/0 / 1,761 |
| Slinger / bear-hp1.5 | W@300.0s / 43.0% / 165 / 165 / 11/11/1 / 3,661 | W@300.0s / 46.7% / 165 / 165 / 9/15/0 / 3,749 | W@300.0s / 46.7% / 165 / 165 / 17/5/0 / 2,707 |
| Slinger / bear-hp1.5-fixed-shell | W@300.0s / 46.7% / 165 / 165 / 14/10/0 / 3,698 | W@300.0s / 40.7% / 165 / 165 / 12/9/1 / 3,705 | W@300.0s / 46.6% / 165 / 165 / 20/7/0 / 2,428 |
| Slinger alt / control | W@300.0s / 46.7% / 165 / 165 / 8/5/1 / 4,678 | W@300.0s / 46.6% / 165 / 165 / 6/9/0 / 4,521 | W@300.0s / 46.6% / 165 / 165 / 3/10/0 / 3,878 |
| Slinger alt / bear-hp1.5 | W@300.0s / 19.4% / 165 / 165 / 6/8/1 / 5,423 | W@300.0s / 21.0% / 165 / 165 / 4/11/1 / 4,739 | W@300.0s / 18.0% / 165 / 165 / 1/4/0 / 4,473 |
| Slinger alt / bear-hp1.5-fixed-shell | W@300.0s / 19.4% / 165 / 165 / 6/8/1 / 5,423 | W@300.0s / 21.0% / 165 / 165 / 4/11/1 / 4,739 | W@300.0s / 18.0% / 165 / 165 / 1/4/0 / 4,473 |
| Conduit / control | W@300.0s / 54.9% / 101 / 101 / 18/0/0 / 373 | W@300.0s / 94.1% / 0 / 0 / 18/0/0 / 0 | W@300.0s / 94.1% / 0 / 0 / 18/0/0 / 0 |
| Conduit / bear-hp1.5 | W@300.0s / 48.0% / 115 / 115 / 0/2/0 / 1,470 | W@300.0s / 46.6% / 115 / 223 / 0/0/0 / 1,449 | W@300.0s / 47.1% / 115 / 115 / 6/0/0 / 620 |
| Conduit / bear-hp1.5-fixed-shell | W@300.0s / 94.1% / 0 / 0 / 16/0/1 / 0 | W@300.0s / 94.1% / 0 / 0 / 18/0/0 / 0 | W@300.0s / 94.1% / 0 / 0 / 19/0/0 / 0 |
| Conduit alt / control | W@300.0s / 54.9% / 101 / 101 / 17/1/0 / 371 | W@300.0s / 94.1% / 0 / 0 / 17/0/0 / 0 | W@300.0s / 94.1% / 0 / 0 / 18/0/0 / 0 |
| Conduit alt / bear-hp1.5 | W@300.0s / 47.2% / 115 / 115 / 0/2/0 / 1,461 | W@300.0s / 35.5% / 115 / 223 / 0/0/0 / 1,336 | W@300.0s / 41.0% / 115 / 115 / 4/0/0 / 735 |
| Conduit alt / bear-hp1.5-fixed-shell | W@300.0s / 94.1% / 0 / 0 / 15/0/0 / 0 | W@300.0s / 94.1% / 0 / 0 / 17/0/0 / 0 | W@300.0s / 94.1% / 0 / 0 / 16/0/0 / 0 |
| Spirit / control | W@300.0s / 70.2% / 123 / 123 / 26/3/0 / 754 | W@300.0s / 42.7% / 145 / 145 / 22/6/1 / 1,094 | W@300.0s / 72.8% / 112 / 112 / 26/5/0 / 772 |
| Spirit / bear-hp1.5 | W@300.0s / 60.3% / 145 / 145 / 16/10/0 / 1,228 | W@300.0s / 72.8% / 112 / 112 / 15/7/1 / 728 | W@300.0s / 73.0% / 111 / 111 / 21/4/0 / 912 |
| Spirit / bear-hp1.5-fixed-shell | W@300.0s / 43.3% / 145 / 145 / 19/10/0 / 1,264 | W@300.0s / 42.7% / 145 / 145 / 17/9/0 / 1,233 | W@300.0s / 43.3% / 145 / 145 / 22/7/0 / 1,003 |

### Desert

| Class / arm | s173 | s947 | s2027 |
|---|---|---|---|
| Striker / control | W@300.0s / 44.7% / 147 / 156 / 18/0/0 / 9,061 | W@300.0s / 15.2% / 147 / 147 / 18/0/0 / 8,786 | W@300.0s / 20.8% / 147 / 147 / 19/0/0 / 9,425 |
| Striker / controller-hp2 | W@300.0s / 0.8% / 147 / 196 / 12/0/0 / 11,039 | W@300.0s / 0.8% / 147 / 196 / 12/0/1 / 11,377 | W@300.0s / 3.0% / 147 / 196 / 12/0/0 / 10,790 |
| Striker / controller-hp3 | D@78.6s / 0.0% / 147 / 196 / 2/0/0 / 3,680 | D@126.8s / 0.0% / 147 / 164 / 4/0/0 / 5,600 | D@15.5s / 0.0% / 147 / 196 / 0/0/0 / 1,072 |
| Squire / control | W@300.0s / 50.6% / 151 / 186 / 15/0/0 / 7,936 | W@300.0s / 46.4% / 151 / 186 / 15/0/0 / 9,066 | W@300.0s / 43.5% / 151 / 186 / 15/0/0 / 8,043 |
| Squire / controller-hp2 | W@300.0s / 43.9% / 151 / 186 / 10/0/0 / 9,037 | W@300.0s / 50.6% / 151 / 186 / 10/0/0 / 8,744 | W@300.0s / 44.3% / 151 / 186 / 11/0/0 / 10,920 |
| Squire / controller-hp3 | W@300.0s / 43.9% / 151 / 186 / 8/0/0 / 9,522 | W@300.0s / 44.7% / 151 / 186 / 7/0/0 / 9,930 | W@300.0s / 41.8% / 151 / 186 / 8/0/0 / 10,401 |
| Apprentice / control | W@300.0s / 25.2% / 156 / 163 / 5/0/1 / 4,592 | W@300.0s / 29.7% / 156 / 163 / 1/0/0 / 5,259 | W@300.0s / 36.1% / 156 / 163 / 0/0/0 / 5,018 |
| Apprentice / controller-hp2 | W@300.0s / 34.7% / 156 / 163 / 0/0/0 / 4,101 | W@300.0s / 17.9% / 156 / 208 / 0/0/0 / 4,516 | W@300.0s / 39.3% / 97 / 129 / 0/0/0 / 3,595 |
| Apprentice / controller-hp3 | W@300.0s / 15.3% / 109 / 146 / 0/0/0 / 4,488 | W@300.0s / 49.8% / 97 / 129 / 0/0/0 / 3,728 | W@300.0s / 9.0% / 156 / 164 / 0/0/0 / 4,540 |
| Slinger / control | W@300.0s / 39.6% / 190 / 190 / 3/0/0 / 4,501 | W@300.0s / 39.4% / 190 / 190 / 1/0/0 / 4,017 | W@300.0s / 39.2% / 190 / 190 / 0/0/0 / 3,925 |
| Slinger / controller-hp2 | W@300.0s / 40.5% / 133 / 133 / 0/0/0 / 3,521 | W@300.0s / 15.2% / 190 / 203 / 0/0/0 / 3,824 | W@300.0s / 40.5% / 119 / 181 / 0/0/0 / 4,065 |
| Slinger / controller-hp3 | W@300.0s / 40.5% / 190 / 190 / 0/0/0 / 3,522 | W@300.0s / 24.6% / 119 / 132 / 0/0/0 / 3,941 | W@300.0s / 40.5% / 119 / 119 / 0/0/0 / 3,654 |
| Slinger alt / control | W@300.0s / 16.7% / 190 / 190 / 0/0/0 / 4,786 | W@300.0s / 38.6% / 190 / 190 / 0/0/0 / 4,188 | W@300.0s / 40.5% / 119 / 119 / 0/0/0 / 4,582 |
| Slinger alt / controller-hp2 | W@300.0s / 31.5% / 119 / 119 / 0/0/0 / 3,167 | W@300.0s / 31.5% / 190 / 190 / 0/0/0 / 4,023 | W@300.0s / 28.8% / 133 / 195 / 0/0/0 / 4,078 |
| Slinger alt / controller-hp3 | W@300.0s / 40.5% / 119 / 119 / 0/0/0 / 3,062 | W@300.0s / 31.5% / 119 / 119 / 1/0/0 / 3,568 | W@300.0s / 30.8% / 119 / 162 / 0/0/0 / 3,751 |
| Conduit / control | W@300.0s / 47.3% / 127 / 166 / 0/0/0 / 1,780 | W@300.0s / 56.2% / 79 / 79 / 0/0/0 / 1,034 | W@300.0s / 71.8% / 79 / 79 / 0/0/0 / 1,069 |
| Conduit / controller-hp2 | W@300.0s / 20.0% / 143 / 143 / 0/0/0 / 1,567 | W@300.0s / 56.4% / 79 / 118 / 0/0/0 / 1,622 | W@300.0s / 55.1% / 79 / 79 / 0/0/0 / 1,203 |
| Conduit / controller-hp3 | W@300.0s / 45.7% / 79 / 79 / 0/0/0 / 1,325 | W@300.0s / 52.9% / 79 / 79 / 0/0/0 / 1,606 | W@300.0s / 32.8% / 127 / 133 / 0/0/0 / 1,854 |
| Conduit alt / control | W@300.0s / 62.0% / 113 / 113 / 0/0/0 / 1,250 | W@300.0s / 70.9% / 113 / 113 / 0/0/0 / 1,007 | W@300.0s / 47.4% / 127 / 127 / 0/0/0 / 1,267 |
| Conduit alt / controller-hp2 | W@300.0s / 40.4% / 143 / 182 / 0/0/0 / 2,124 | W@300.0s / 60.6% / 127 / 127 / 1/0/0 / 1,268 | W@300.0s / 54.1% / 89 / 89 / 0/0/0 / 1,794 |
| Conduit alt / controller-hp3 | W@300.0s / 54.3% / 127 / 127 / 0/0/0 / 1,513 | W@300.0s / 55.6% / 44 / 44 / 0/0/0 / 1,492 | W@300.0s / 43.8% / 79 / 79 / 0/0/0 / 1,782 |
| Spirit / control | W@300.0s / 64.9% / 116 / 116 / 15/1/0 / 1,491 | W@300.0s / 64.3% / 116 / 116 / 16/1/0 / 1,334 | W@300.0s / 36.9% / 125 / 125 / 9/1/0 / 1,776 |
| Spirit / controller-hp2 | W@300.0s / 41.4% / 116 / 116 / 0/0/0 / 1,264 | W@300.0s / 37.8% / 116 / 116 / 0/0/0 / 982 | W@300.0s / 61.3% / 116 / 116 / 0/0/0 / 543 |
| Spirit / controller-hp3 | W@300.0s / 51.8% / 116 / 116 / 0/0/0 / 1,503 | W@300.0s / 35.7% / 116 / 116 / 0/0/0 / 1,404 | W@300.0s / 54.2% / 116 / 162 / 0/0/0 / 1,447 |

## Named-target TTK

Each seed token is `clean-median-seconds / clean samples / kills /
unfinished targets / observed HP-regain targets`. The outer value is the median
of the available per-seed clean medians. It is not a pooled target median. A
`no-kill` token means there was no usable clean median, not zero seconds; no
missing kill was converted to zero.

### Glacier Bear

| Class / alternate | Arm | s173 | s947 | s2027 | Outer clean TTK |
|---|---|---|---|---|---:|
| Striker / no | control | 5.20/7/7/1/0 | 4.70/9/9/0/0 | 5.10/6/6/0/0 | 5.10s |
| Striker / no | bear-hp1.5 | 8.70/6/6/0/0 | 8.50/7/7/0/0 | 8.70/7/7/0/0 | 8.70s |
| Striker / no | bear-hp1.5-fixed-shell | 8.10/8/8/0/0 | 8.00/7/7/1/0 | 8.05/8/8/0/0 | 8.05s |
| Squire / no | control | 8.90/7/7/0/0 | 8.85/8/8/0/0 | 8.70/7/7/0/0 | 8.85s |
| Squire / no | bear-hp1.5 | 16.00/5/5/1/0 | 16.00/5/5/0/0 | 16.65/4/4/0/0 | 16.00s |
| Squire / no | bear-hp1.5-fixed-shell | 13.40/5/5/0/0 | 13.60/6/6/0/0 | 13.95/6/6/0/0 | 13.60s |
| Apprentice / no | control | 8.40/7/7/0/0 | 9.00/9/9/0/0 | 9.00/4/4/0/0 | 9.00s |
| Apprentice / no | bear-hp1.5 | 15.00/5/5/1/0 | 15.00/8/8/0/0 | 15.00/5/5/1/0 | 15.00s |
| Apprentice / no | bear-hp1.5-fixed-shell | 13.50/6/6/0/0 | 13.50/8/8/1/0 | 13.50/6/6/0/0 | 13.50s |
| Slinger / no | control | 7.60/9/9/1/0 | 7.60/10/10/0/0 | 7.80/7/7/1/0 | 7.60s |
| Slinger / no | bear-hp1.5 | 13.10/9/9/0/0 | 13.15/10/10/1/0 | 13.00/5/5/1/1 | 13.10s |
| Slinger / no | bear-hp1.5-fixed-shell | 12.10/6/6/1/0 | 12.05/10/10/0/0 | 12.30/5/5/0/0 | 12.10s |
| Slinger / yes | control | 19.00/6/6/0/0 | 19.00/5/5/1/0 | 19.00/4/4/1/0 | 19.00s |
| Slinger / yes | bear-hp1.5 | 27.00/4/4/0/0 | 28.20/3/3/0/0 | 27.00/3/3/0/0 | 27.00s |
| Slinger / yes | bear-hp1.5-fixed-shell | 27.00/4/4/0/0 | 28.20/3/3/0/0 | 27.00/3/3/0/0 | 27.00s |
| Conduit / no | control | 15.40/6/6/0/0 | 15.65/6/6/1/0 | 15.30/5/5/0/0 | 15.40s |
| Conduit / no | bear-hp1.5 | 142.40/2/2/0/0 | 148.60/1/1/1/0 | 142.20/1/1/1/0 | 142.40s |
| Conduit / no | bear-hp1.5-fixed-shell | 16.40/7/7/0/0 | 16.45/6/6/0/0 | 16.50/4/4/0/0 | 16.45s |
| Conduit / yes | control | 15.70/5/5/0/0 | 15.75/8/8/0/0 | 15.70/5/5/0/0 | 15.70s |
| Conduit / yes | bear-hp1.5 | 144.20/2/2/1/0 | 152.90/1/1/1/0 | 144.90/1/1/1/0 | 144.90s |
| Conduit / yes | bear-hp1.5-fixed-shell | 18.80/6/6/1/0 | 19.10/5/5/0/0 | 18.85/6/6/0/0 | 18.85s |
| Spirit / no | control | 6.40/11/11/0/0 | 6.45/12/12/0/0 | 6.35/6/6/1/0 | 6.40s |
| Spirit / no | bear-hp1.5 | 9.90/7/7/1/0 | 9.90/11/11/0/0 | 10.10/6/6/0/0 | 9.90s |
| Spirit / no | bear-hp1.5-fixed-shell | 9.30/7/7/0/0 | 9.90/10/10/1/0 | 9.80/5/5/1/0 | 9.80s |

### Dune Stalker

| Class / alternate | Arm | s173 | s947 | s2027 | Outer clean TTK |
|---|---|---|---|---|---:|
| Striker / no | control | 4.75/8/8/0/0 | 4.75/10/10/1/0 | 4.80/8/8/1/0 | 4.75s |
| Striker / no | controller-hp2 | 10.40/3/3/0/0 | 10.40/5/5/0/0 | 10.30/5/5/1/0 | 10.40s |
| Striker / no | controller-hp3 | no-kill/0/0/0/0 | 15.65/4/4/0/0 | no-kill/0/0/0/0 | 15.65s |
| Squire / no | control | 8.20/7/7/0/0 | 8.20/8/8/0/0 | 8.20/6/6/0/0 | 8.20s |
| Squire / no | controller-hp2 | 16.00/6/6/0/0 | 15.80/8/8/0/0 | 16.00/3/3/0/0 | 16.00s |
| Squire / no | controller-hp3 | 24.20/4/4/1/0 | 23.80/2/2/1/0 | 23.40/2/2/0/0 | 23.80s |
| Apprentice / no | control | 7.45/4/4/0/0 | 7.30/11/11/0/0 | 7.20/6/6/0/0 | 7.30s |
| Apprentice / no | controller-hp2 | 13.50/6/6/0/0 | 13.50/6/7/0/1 | 13.30/4/4/0/0 | 13.50s |
| Apprentice / no | controller-hp3 | 21.00/4/4/0/0 | 21.00/6/6/0/0 | 21.00/4/4/0/0 | 21.00s |
| Slinger / no | control | 7.30/6/6/0/0 | 7.20/9/9/1/0 | 7.30/9/9/0/0 | 7.30s |
| Slinger / no | controller-hp2 | 13.40/2/2/0/0 | 13.80/7/7/0/0 | 14.00/5/5/0/0 | 13.80s |
| Slinger / no | controller-hp3 | 21.30/3/3/0/0 | 21.75/6/6/0/0 | 21.40/5/5/0/0 | 21.40s |
| Slinger / yes | control | 12.20/4/4/0/0 | 12.00/8/8/0/0 | 12.20/4/4/0/0 | 12.20s |
| Slinger / yes | controller-hp2 | 22.00/4/4/0/0 | 22.00/6/6/1/0 | 22.00/3/3/0/0 | 22.00s |
| Slinger / yes | controller-hp3 | no-kill/0/1/1/1 | 32.40/3/3/1/0 | 33.10/2/2/0/0 | 32.75s |
| Conduit / no | control | 19.90/5/5/0/0 | 20.25/6/6/0/0 | 19.80/2/2/0/0 | 19.90s |
| Conduit / no | controller-hp2 | 30.10/2/2/0/0 | 29.80/2/2/0/0 | 26.50/2/2/1/0 | 29.80s |
| Conduit / no | controller-hp3 | 38.40/2/2/0/0 | 39.85/4/4/0/0 | 30.90/1/1/0/0 | 38.40s |
| Conduit / yes | control | 20.20/3/3/1/0 | 20.80/5/5/1/0 | 17.90/2/2/0/0 | 20.20s |
| Conduit / yes | controller-hp2 | 31.60/2/2/0/0 | 30.50/4/4/1/0 | 22.10/1/1/1/0 | 30.50s |
| Conduit / yes | controller-hp3 | 40.85/2/2/1/0 | 43.05/4/4/0/0 | 43.05/2/2/1/0 | 43.05s |
| Spirit / no | control | 5.00/9/9/0/0 | 4.90/9/9/1/0 | 4.90/7/7/0/0 | 4.90s |
| Spirit / no | controller-hp2 | 11.20/6/6/1/0 | 11.55/8/8/0/0 | 10.55/4/4/1/0 | 11.20s |
| Spirit / no | controller-hp3 | 16.20/4/4/0/0 | 15.60/7/7/1/0 | 16.50/4/4/1/0 | 16.20s |

### Desert Basilisk

| Class / alternate | Arm | s173 | s947 | s2027 | Outer clean TTK |
|---|---|---|---|---|---:|
| Striker / no | control | 5.20/10/10/0/0 | 5.15/8/8/0/0 | 5.20/11/11/0/0 | 5.20s |
| Striker / no | controller-hp2 | 10.80/9/9/1/0 | 10.95/8/8/0/0 | 10.80/7/7/0/0 | 10.80s |
| Striker / no | controller-hp3 | 17.15/2/2/1/0 | no-kill/0/0/1/0 | no-kill/0/0/1/0 | 17.15s |
| Squire / no | control | 8.20/8/8/0/0 | 8.20/7/7/0/0 | 8.20/9/9/1/0 | 8.20s |
| Squire / no | controller-hp2 | 16.35/4/4/1/0 | 16.20/2/2/0/0 | 16.20/8/8/0/0 | 16.20s |
| Squire / no | controller-hp3 | 25.50/4/4/0/0 | 24.20/5/5/0/0 | 25.00/6/6/1/0 | 25.00s |
| Apprentice / no | control | 7.50/9/9/0/0 | 7.20/4/4/0/0 | 7.50/9/9/0/0 | 7.50s |
| Apprentice / no | controller-hp2 | 14.30/4/4/0/0 | 15.00/3/3/0/0 | 14.30/7/7/0/0 | 14.30s |
| Apprentice / no | controller-hp3 | 21.70/5/5/0/0 | 21.50/2/2/0/0 | 21.50/5/5/0/0 | 21.50s |
| Slinger / no | control | 7.55/10/10/0/0 | 7.50/7/7/0/0 | 8.20/7/7/0/0 | 7.55s |
| Slinger / no | controller-hp2 | 14.40/9/9/0/0 | 15.80/5/5/0/0 | 14.60/5/5/0/0 | 14.60s |
| Slinger / no | controller-hp3 | 22.40/6/6/1/0 | 22.50/4/4/0/0 | 22.15/4/4/0/0 | 22.40s |
| Slinger / yes | control | 13.40/7/7/1/0 | 13.40/3/3/0/0 | 13.80/7/7/0/0 | 13.40s |
| Slinger / yes | controller-hp2 | 24.00/5/5/0/0 | 23.80/2/2/0/0 | 24.80/5/5/1/0 | 24.00s |
| Slinger / yes | controller-hp3 | 35.00/5/5/0/0 | 35.00/3/3/0/0 | 35.60/3/4/1/1 | 35.00s |
| Conduit / no | control | 21.10/5/5/0/0 | 21.30/3/3/1/0 | 21.30/7/7/0/0 | 21.30s |
| Conduit / no | controller-hp2 | 32.35/4/4/0/0 | 33.40/4/4/1/0 | 31.90/4/4/0/0 | 32.35s |
| Conduit / no | controller-hp3 | 43.50/3/3/0/0 | 42.90/2/2/0/0 | 43.30/4/4/1/0 | 43.30s |
| Conduit / yes | control | 21.25/4/4/0/0 | 22.10/3/3/0/0 | 21.45/6/6/0/0 | 21.45s |
| Conduit / yes | controller-hp2 | 32.40/5/5/0/0 | 32.85/2/2/0/0 | 32.65/6/6/0/0 | 32.65s |
| Conduit / yes | controller-hp3 | 43.20/3/3/0/0 | 45.25/2/2/0/0 | 43.20/3/3/0/0 | 43.20s |
| Spirit / no | control | 5.00/8/8/0/0 | 4.80/8/8/0/0 | 5.20/9/9/1/0 | 5.00s |
| Spirit / no | controller-hp2 | 11.30/8/8/0/0 | 11.80/5/5/0/0 | 11.30/7/7/0/0 | 11.30s |
| Spirit / no | controller-hp3 | 18.15/6/6/1/0 | 17.05/4/4/0/0 | 17.90/6/6/0/0 | 17.90s |

### Six-baseline centers and matched-arm screen

The center below uses only the six baseline classes. For Desert, “tougher” is
the per-class maximum of the separately reported Dune Stalker and Desert
Basilisk outer medians; it is not a pooled target value. The six-class center is
the median of those six class medians.

| Controller arm | Dune Stalker center | Desert Basilisk center | Tougher-controller center | Six-class tougher spread |
|---|---:|---:|---:|---:|
| control | 7.30s | 7.53s | 7.53s | 5.00–21.30s |
| controller-hp2 | 13.65s | 14.45s | 14.45s | 10.80–32.35s |
| controller-hp3 | 21.20s | 21.95s | 21.95s | 17.15–43.30s |

The 25–35s typical T3 target is therefore a context band rather than a pass
criterion for every class. HP3x moves the slow classes into or near that band,
but the fast classes remain below it, Conduit is above it, and the arm caused
three Striker deaths. HP2x has no deaths in this run but remains materially
short of the context band at the center. This supports a bracket return rather
than an automatic global selection.

The two diagnostic weapon alternatives were excluded from that center:

| Alternate | control Dune / Basilisk | controller-hp2 Dune / Basilisk | controller-hp3 Dune / Basilisk |
|---|---:|---:|---:|
| Slinger alt | 12.20s / 13.40s | 22.00s / 24.00s | 32.75s / 35.00s |
| Conduit alt | 20.20s / 21.45s | 30.50s / 32.65s | 43.05s / 43.20s |

For Tundra, the six-baseline Glacier Bear centers were 8.23s in control,
14.05s in Bear HP1.5x, and 12.80s in Bear HP1.5x fixed-shell, with spreads of
5.10–15.40s, 8.70–142.40s, and 8.05–16.45s respectively. Slinger alt and
Conduit alt remain separate diagnostics (27.00s and 27.00s/27.00s in the two
HP1.5 arms for Slinger alt; 144.90s and 18.85s for Conduit alt).

All named-target values in the tables above were recomputed from the raw
per-run `index.json` `targets` arrays. Generated pooled per-type medians were
not used. Clean values exclude unfinished targets and observed HP-regain
traces; the counts beside each value retain those exclusions explicitly.

## Desert controller, dealer, and encounter pairing

The Desert audit kept Dune Stalker and Basilisk target lifetimes separate, then
paired the controller with the unchanged Sandweaver dealer at the encounter
episode level. Dealer attacks and damage below are medians across the 24 runs
in an arm; controller damage is likewise a run-level median. Pair counts are
episode counts, with `I/M` meaning intentional two-enemy episodes versus
merged natural/repopulation episodes. A longer controller can reduce later
pull count, so lower total dealer damage is not evidence of lower per-hit
pressure.

| Arm | Runs | Dealer attacks / damage | Controller damage | Pair episodes I/M | Controller-before-dealer / dealer-before-controller | Median overlap | Controller life | Recovery C/I/O |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| control | 24 | 13.0 / 1,456.6 | 432.5 | 170 / 148/22 | 150 / 17 | 0.0s | 5.60s | 150/3/1 |
| controller-hp2 | 24 | 12.5 / 1,368.1 | 736.0 | 90 / 70/20 | 79 / 6 | 0.0s | 14.30s | 68/0/1 |
| controller-hp3 | 24 | 12.0 / 1,136.7 | 960.5 | 52 / 32/20 | 38 / 6 | 0.0s | 24.20s | 30/0/0 |

The class-level pairing screen shows where that aggregate comes from. The
controller lifetime is the paired episode's clean median, not a replacement
for the per-species TTK tables.

| Class / alternate | Arm | Pair episodes I/M | Median overlap | Controller-before / dealer-before | Controller life | Dealer attacks / damage |
|---|---|---:|---:|---:|---:|---:|
| Striker / no | control | 56 / 54/2 | 4.7s | 51 / 4 | 5.00s | 26.0 / 2,855 |
| Striker / no | controller-hp2 | 39 / 39/0 | 0.8s | 37 / 0 | 10.80s | 41.0 / 4,370 |
| Striker / no | controller-hp3 | 9 / 8/1 | 13.8s | 6 / 0 | 15.90s | 17.0 / 1,817 |
| Squire / no | control | 46 / 45/1 | 0.0s | 35 / 10 | 8.20s | 34.0 / 3,090 |
| Squire / no | controller-hp2 | 32 / 31/1 | 0.0s | 25 / 6 | 16.00s | 51.0 / 5,103 |
| Squire / no | controller-hp3 | 24 / 24/0 | 0.0s | 17 / 6 | 24.60s | 51.0 / 4,939 |
| Apprentice / no | control | 9 / 6/3 | 6.0s | 9 / 0 | 7.40s | 14.0 / 1,439 |
| Apprentice / no | controller-hp2 | 3 / 0/3 | 0.0s | 3 / 0 | 14.30s | 15.0 / 1,458 |
| Apprentice / no | controller-hp3 | 3 / 0/3 | 0.0s | 2 / 0 | 21.00s | 16.0 / 1,555 |
| Slinger / no | control | 7 / 3/4 | 0.0s | 6 / 0 | 7.50s | 10.0 / 1,474 |
| Slinger / no | controller-hp2 | 3 / 0/3 | 0.0s | 3 / 0 | 13.70s | 11.0 / 1,297 |
| Slinger / no | controller-hp3 | 3 / 0/3 | 0.0s | 3 / 0 | 22.00s | 10.0 / 1,107 |
| Slinger / yes | control | 3 / 0/3 | 0.0s | 3 / 0 | 12.80s | 17.0 / 1,691 |
| Slinger / yes | controller-hp2 | 3 / 0/3 | 0.0s | 3 / 0 | 23.60s | 16.0 / 1,572 |
| Slinger / yes | controller-hp3 | 4 / 0/4 | 0.0s | 4 / 0 | 34.70s | 14.0 / 1,417 |
| Conduit / no | control | 3 / 0/3 | 0.0s | 3 / 0 | 21.00s | 2.0 / 158 |
| Conduit / no | controller-hp2 | 3 / 0/3 | 0.0s | 3 / 0 | 31.40s | 2.0 / 158 |
| Conduit / no | controller-hp3 | 3 / 0/3 | 0.0s | 2 / 0 | 42.10s | 2.0 / 158 |
| Conduit / yes | control | 3 / 0/3 | 0.0s | 3 / 0 | 21.90s | 2.0 / 158 |
| Conduit / yes | controller-hp2 | 4 / 0/4 | 0.0s | 2 / 0 | 31.45s | 3.0 / 247 |
| Conduit / yes | controller-hp3 | 3 / 0/3 | 0.0s | 1 / 0 | 45.50s | 4.0 / 316 |
| Spirit / no | control | 43 / 40/3 | 0.0s | 40 / 3 | 4.90s | 11.0 / 605 |
| Spirit / no | controller-hp2 | 3 / 0/3 | 0.0s | 3 / 0 | 11.20s | 11.0 / 486 |
| Spirit / no | controller-hp3 | 3 / 0/3 | 0.0s | 3 / 0 | 18.20s | 12.0 / 472 |

The high-density Conduit, Apprentice, Slinger, and most alternative rows are
merged natural episodes rather than clean isolated controller-plus-dealer
pairs. Their pair-level kill ordering is therefore descriptive encounter
context, not a pure two-enemy causal trial. Where an isolated pair was
available, controllers generally died before the dealer; the longer HP arms
kept the unchanged dealer present longer and increased the controller's
damage exposure. Recovery totals fell with longer controller lifetime because
fewer encounters completed in the 300s window. This is consistent with longer
control duration increasing dealer exposure in fragile cases, even though the
dealer definition did not change.

## Tundra Bear shield audit

The arm-level pressure summary is included to keep the survival comparison
visible. Incoming damage and recovery totals are not normalized for encounter
count; the high-HP arm changes fight length and therefore the number of later
pulls.

| Tundra arm | Runs / deaths | Median minimum HP | Median incoming damage | Median largest / max1s hit | Recovery completed/interrupted/open |
|---|---:|---:|---:|---:|---:|
| control | 24 / 0 | 54.9% | 2,474.9 | 146.5 / 148 | 399/131/7 |
| bear-hp1.5 | 24 / 0 | 44.8% | 3,704.8 | 153.0 / 165 | 225/159/6 |
| bear-hp1.5-fixed-shell | 24 / 0 | 43.3% | 3,495.6 | 149.4 / 153 | 328/160/8 |

The following shield values are medians across the 24 runs in each arm.
`Absorbed` is the sum of absorption amounts over all Bear instances in a run;
it is not the single-Bear capacity. A break proxy is a persisted Bear-targeted
damage event with both `absorbed > 0` and positive HP damage.

| Arm | Spawned Bear HP | Absorbed per run | Absorb events | Break proxies | Median Bear TTK | Last observed break (median per run) |
|---|---:|---:|---:|---:|---:|---:|
| control | 1,725 | 1,725 | 19 | 4 | 8.88s | 237.3s |
| bear-hp1.5 | 2,588 | 2,744 | 33 | 3.5 | 15.50s | 197.0s |
| bear-hp1.5-fixed-shell | 2,588 | 2,070 | 27 | 5 | 13.50s | 229.8s |

### Direct HP1.5 comparison

The direct paired screen compares the two high-HP arms within each matched
class/alternate. TTK, absorbed amount, and break proxies are medians across the
three matched seeds; absorption and break counts again aggregate all Bears in
each run.

| Class / alternate | Normal 20% shell: TTK / absorbed / breaks | Fixed shell: TTK / absorbed / breaks |
|---|---:|---:|
| Striker / no | 8.70s / 2,072 / 4 | 8.05s / 1,380 / 4 |
| Squire / no | 16.00s / 2,072 / 4 | 13.60s / 2,070 / 6 |
| Apprentice / no | 15.00s / 2,898 / 3 | 13.50s / 3,069 / 5 |
| Slinger / no | 13.10s / 3,626 / 7 | 12.10s / 2,070 / 6 |
| Slinger / yes | 27.00s / 1,568 / 0 | 27.00s / 1,568 / 0 |
| Conduit / no | 142.40s / 21,106 / 2 | 16.45s / 9,315 / 25 |
| Conduit / yes | 144.90s / 22,687 / 2 | 18.85s / 6,609 / 18 |
| Spirit / no | 9.90s / 2,072 / 4 | 9.80s / 1,380 / 4 |

The Conduit chronology is the clearest capacity signal. These raw-event
summaries show break-proxy count and first-to-last observed break time, then
Bear kill count and last kill time:

| Build | Arm / seed | Break proxies and chronology | Bear kills / last kill | Clean Bear TTK |
|---|---|---|---:|---:|
| Conduit baseline | bear-hp1.5 / s173 | 4 @ 134.1–290.3s | 2 / 291.8s | 142.40s |
| Conduit baseline | bear-hp1.5 / s947 | 1 @ 141.5–141.5s | 1 / 148.6s | 148.60s |
| Conduit baseline | bear-hp1.5 / s2027 | 2 @ 173.6–183.3s | 1 / 184.3s | 142.20s |
| Conduit baseline | fixed-shell / s173 | 25 @ 5.3–284.1s | 5 / 285.2s | 16.40s |
| Conduit baseline | fixed-shell / s947 | 25 @ 3.2–290.5s | 5 / 291.3s | 16.45s |
| Conduit baseline | fixed-shell / s2027 | 10 @ 45.3–202.8s | 2 / 203.6s | 16.50s |

The alternate Conduit repeats the same pattern: normal-shell TTK was
144.20/152.90/144.90s across seeds, while fixed-shell was 18.80/19.10/18.85s.
The Slinger alternative happened to produce identical 27.00/28.20/27.00s
results and zero break proxies in both high-HP arms. That zero is a telemetry
and encounter observation, not evidence that the automatic shield was absent.

### Shatter and vulnerability telemetry boundary

The persisted event inventory contained 14,241 `absorb` events, 83,286
`damage` events, 2,728 kills, 2,300 monster-cast starts, 2,155 cast ends, and
3 `player-death` events. It contained no persisted `ecology-pulse`,
`frost-shatter`, or `shatter-vulnerable` rows. The frozen source still defines
the Bear shatter self-damage and vulnerability path: it calls the generic
`pushDamageEvent` and pushes a `frost-shatter` world event, but the benchmark
recorder persists the world-log journal plus cast events and does not drain
generic node events into `events.jsonl`. Therefore exact self-damage,
vulnerability start/end, and uptime are **not observable in this artifact**.
The report does not infer them from zero counts. Break timing above is limited
to the available mixed absorb/HP-damage proxy and raw kill chronology.

The old Conduit extreme lifetime is consequently reproduced as a result, not
explained by invented shatter timing: the normal 20% shell lets the fight spend
most of the window in shield-heavy churn, while preserving the authored shell
capacity at HP1.5x collapses it back to the 16–19s range. This is strong enough
to return fixed-shell as the focused candidate, subject to a later telemetry-
complete validation if the exact shatter payoff itself must be tuned.

## Death and severe near-death attribution

The batch contained 3 player deaths and 16 additional severe rows below 20%
minimum HP. All three deaths were Desert Striker baseline controller-hp3
observations. The final 10s/30s source audit is below; damage is
`source total / hit count`, and cast lists are event labels in the corresponding
window.

| Cell / seed | Death time or low-point anchor | Final 10s source damage | Final 30s source damage | Casts in final 10s / 30s |
|---|---:|---|---|---|
| Desert Striker / hp3 / s173 | D@78.6s | Gilded Scarab 552.3/5; Basilisk 176/4 | Gilded Scarab 1,111.3/10; Basilisk 269/6 | Petrifying Gaze 74.5 / Gaze 64.8,74.5; Sunbeam 68.5 |
| Desert Striker / hp3 / s947 | D@126.8s | Gilded Scarab 547.3/5; Basilisk 181/4 | Gilded Scarab 1,185.3/11; Basilisk 225/5; Dune 26/1 | Sunbeam 117.2; Gaze 122.7 / Gaze 113.0,122.7; Sunbeam 117.2 |
| Desert Striker / hp3 / s2027 | D@15.5s | Gilded Scarab 547.3/5; Basilisk 181/4 | Gilded Scarab 847.3/8; Basilisk 225/5 | Sunbeam 6.4; Gaze 11.4 / Gaze 1.7,11.4; Sunbeam 6.4 |

Representative severe survivors show that the low points came from different
encounter shapes. They are not a single pure controller-HP signal.

| Cell / seed | Minimum HP / sampled anchor | Final 10s sources | Final 30s sources | Casts in final 10s / 30s |
|---|---:|---|---|---|
| Tundra Apprentice / hp1.5 / s947 | 3.2% / 212.0s | Rime Caster 435.2/9; Glacier Bear 162.9/5 | Rime Caster 435.2/9; Bear 361.5/11 | Frostbind 210.1 / Frostbind 210.1 |
| Tundra Apprentice / hp1.5 / s2027 | 10.1% / 200.0s | Glacier Bear 455.2/13; Frost Lurker 159.3/1 | Bear 591.0/21; Lurker 159.3/1; Rime Caster 13.0/7 | Rime Pounce 198.8 / Pounce 177.1,198.8 |
| Tundra Apprentice / fixed-shell / s947 | 7.5% / 182.0s | Rime Caster 401.3/6; Glacier Bear 298.5/8 | Rime Caster 401.3/6; Bear 350.3/14 | none / Rime Pounce 153.8 |
| Tundra Slinger alt / hp1.5 / s2027 | 18.0% / 141.0s | Glacier Bear 394.7/3 | Bear 630.7/5; Frost Lurker 53/1 | none / none |
| Desert Striker / hp2 / s173 | 0.8% / 43.0s | Gilded Scarab 547.3/5; Basilisk 137/3 | Scarab 1,159.3/11; Basilisk 181/4 | Gaze 39.2; Sunbeam 33.4 / Gaze 14.8,29.5,39.2; Sunbeam 33.4 |
| Desert Apprentice / hp3 / s2027 | 9.0% / 122.0s | Scarab 226.1/10; Basilisk 100.8/4 | Scarab 442.2/15; Basilisk 351.3/24 | Gaze 120.4 / Gaze 93.2,104.7,111.1,120.4 |
| Desert Slinger / hp2 / s947 | 15.2% / 53.0s | Scarab 499/3; Dune 13/1 | Scarab 499/3; Basilisk 81/2; Dune 56/2 | Sunbeam 46.7,51.5; Sting 46.9 / Gaze 32.5; Sting 41.3,46.9; Sunbeam 46.7,51.5 |
| Desert Slinger alt / control / s173 | 16.7% / 202.0s | Scarab 345/3; Basilisk 19/1 | Scarab 464/4; Basilisk 81/2; Dune 43/1 | Sunbeam 196.7 / Sting 174.9; Gaze 187.4; Sunbeam 196.7 |

The Tundra low points include long kiting/chill and overlapping Bear/caster
pressure, while Desert low points include persistent Gilded Scarab damage plus
controller casts. In particular, HP3x Striker dies even though its aggregate
controller arm has fewer later attacks: the deaths censor the later encounter
tail, so the lower total is not a safety improvement.

## Cross-run context, limitations, and exit

The Durability 1 controls are context only. Source and ability changes between
that historical batch and this frozen revision prevent a causal historical
comparison. The current Durability 8 control is the causal reference for this
screen.

This was synthetic prepared combat only: no acquisition, travel, economy,
client/browser state, or human playtest was involved. Natural ecology and
repopulation were retained within fresh 300s worlds. The runner stopped each
observation at first player death, used a 120s wall ceiling and retained the
packet's resource ceilings. No replicate hit the wall ceiling, but the sample
is only three seeds and several slow cells have sparse clean target counts or
unfinished targets. The report keeps those censored values visible and does
not turn them into zeros.

The exact shatter self-damage, vulnerability start/end, and uptime remain a
telemetry gap, as described above. Zero cast counts are not treated as evidence
that an automatic shield mechanic was absent. Full-suite validation and live
browser feel remain unverified.

### Returned operator decision

- **Desert controllers:** retain authored HP2x–HP3x as the diagnostic bracket.
  HP2x is the safer next candidate because it had 0/72 Desert deaths and still
  lengthened controllers substantially; HP3x is an upper-bound case because it
  caused 3/24 deaths in the baseline Striker cell and produced censored named
  targets. Neither is a live selection, and no class-specific nerf follows.
- **Glacier Bear:** return HP1.5x with the fixed-shell fraction
  `0.2 * 1500 / 2250 = 0.133333...`. It preserves the old authored-equivalent
  shell at the increased Bear HP and removes the reproduced Conduit extreme
  lifetime. Keep interval, duration, shatter payoff, and vulnerability unchanged
  until telemetry-complete follow-up evidence exists.
- **Next scope:** if the operator continues, validate the returned Desert
  bracket and fixed-shell overlay with telemetry that records Ice Shatter
  self-damage/vulnerability explicitly. Keep ability and weapon balance as
  separate later experiments. No live patch is made by this report.
