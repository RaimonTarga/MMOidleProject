# Night 2 handoff — autonomous Astra and Luna

Closed2026-09-14 after the fourth frozen packet. Activated2026-09-13
21:04:42 UTC; final gameplay ended00:21:27 UTC. All12 declared cases reached
a terminal result:9 completed safe observations,3 first-death stops. Across
them,15 boss victories and one boss loss; two additional deaths occurred
after earning T3, during transit. No gameplay balance changes, extra retries,
fifth packet or T3 boss probe. The eight-hour ceiling was not a work quota.

## What changed in our knowledge

**T2 Spirit now has candidate victories on all seven bosses.** This night
added Cave control2/2, timed Brace2/2 and Jungle Hamstring2/2, all with safe
post-kill observations. Previous Plains/Forest/Mountain/Swamp/Desert evidence
completes that narrow coverage. Cave controls also won, despite historical
losses; consistency remains open. Inside Telegraph did activate Brace about
600ms before alternate eruptions, but all boss slams still hit. This is a
verified timing instruction, not a solved dodge or a causal win-rate result.

**Continuous T2 progression works through the third seal.** Two separate
characters earned Plains, Forest and Desert seals sequentially and naturally
advanced to T3. Neither reached a safe Sanctuary checkpoint. The first died
with no travel ability firing; ordinary Fight Back fixed that behavior in the
next packet, which fired both Guards and Sweep and killed one Scuttler.

**The remaining transit failure exposes a real automation interaction.** C's
fatal14HP ticks are positional lava damage. Tiny Wisp is a death-attribution
fallback, not the monster responsible. A read-only World diagnostic reproduces
a hurt traveler remaining paused in static lava with Recover First enabled;
without that rule navigation resumes. The existing persistent-hazard escape
helper covers runtime ground pools but not authored static lava. Out-of-combat
regeneration is suppressed in damaging terrain. This is a concrete behavior
gap, not proof that the exact recorded trajectory has been reconstructed or
that removing the Rune guarantees safe transit.

**Squire also has a prepared T2 Plains solution.** The final fallback tested
Bulwark's Quake Hammer with Plains charm/boots, Sweep, Second Wind and Brace.
Mountain armor won2/2; Plains armor1/2. Both armor options were bought/upgraded
identically before selection. Mountain's observed317HP/30plating traded
against Plains'281HP/40plating; Mountain also improves Guard potency. The
failed Plains case had11 attackers and died to the boss. More plating alone
is not a universal answer, but this sample cannot rank the armor passives.

T1 was not rerun this night and remains at the previously accepted human/bot
status. T2 coverage is strongest for Spirit; all-class progression and
consistency are unfinished. T3/T4 balance is still open. The user's Volcano/
Tundra high-damage concern and low mob eHP/TTK concern remain separate. One
accelerated Scuttler kill does not qualify T3 farming or establish its TTK.

## Frozen execution ledger

| Packet | Cases | Revision | Result / report |
|---|---:|---|---|
| A Cave + Jungle | 6 | `14bda8be14f067654f305e8a10a7179ccf4eab22` | All6 wins and safe tails; [report](bot-balance-night2-a-report.md) |
| B continuous bridge | 1 | `8ebfbbada901b65bde5e65834c7a7961c4cc1d4f` | Three seals/T3, direct-damage transit death; [report](bot-balance-night2-b-report.md) |
| C travel package | 1 | `ac14e2702f6f521cdc2658bbb2336cb5572bb713` | Three seals/T3, abilities fire, lava death; [report](bot-balance-night2-c-report.md) |
| D Squire armor | 4 | `04f1e041c0b689d0a44a874c233e3d2dc6af734f` | Mountain2/2, Plains1/2, three safe tails; [report](bot-balance-night2-d-report.md) |

Five manifests, always one active worker/manifest:

- `20260913t211850z-spirit-cave-control-t2-night2`
- `20260913t214400z-spirit-jungle-hamstring-t2-nig`
- `20260913t220504z-spirit-continuous-t2-bridge-ni`
- `20260913t225153z-spirit-travel-t2-bridge-night2`
- `20260913t233030z-squire-plains-mountain-armor-t`

All live under `C:/Users/osaif/AppData/Local/mmo-idle/experiments/`. Reports
contain exact input/tree/image/artifact hashes and case paths. All terminal
network receipts are released; volumes/artifacts/service containers retained.
No global Docker prune or unrelated resource cleanup. Original Spirit input
SHA4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6;
Squire input SHAf7f6a884f4f03798ee5c1019a3f49a6e18ecd4fb82f6bc357d00642f9b44d344.
Both remain synthetic prepared entries with reward25 provenance. No normal
economy, average-player readiness or canonical evidence claim.

## Preparation, validation and operator lessons

Bot routes now contain the Cave timing/Jungle packages, cumulative three-seal
bridge, ordinary travel response and Squire armor comparison. Harness support
adds a player-visible full-HP/no-DoT recovery predicate, first-death abort
before respawn, and strict earned/unbranched T3 snapshot import. It preserves
the actual tier, required seals, unspent point and provenance; it does not
invent a checkpoint. B/C never exported one.

Full typecheck and bot preflight passed on the frozen preparations. Luna
repeated exact clean-checkout preflight. Focused server travel Fight Back and
T3 bootstrap checks passed; the actual Squire input passed146 strict checks.
The isolated lava diagnostic ran successfully. No claim of a full gameplay
suite or live human validation of the proposed movement fix.

Astra corrected report transcription and attribution errors against raw files:
whole-run versus boss-window counts, stale killing-blow samples, environment
fallback names, misplaced/short hashes and a reused setup clock. Artifacts
were unchanged. Future operator reports should generate filename/hash pairs
mechanically and keep exact timing fields; reviewer verification remains
necessary. Delegation did remove the user's messenger role: Luna operated
each frozen packet and Astra resumed analysis on completion. Bounded agent
waits were renewed without routine Astra runtime log polling; this is not a
claim of zero orchestration overhead.

## Next decision and unapplied proposals

1. **Resolve static hazard escape before more T3 viability claims.** Review
   shared player behavior so Avoid Hazards can move out of authored damaging
   features before Recover First pauses, including the40px lava contact band.
   Keep HP, mob damage and lava damage unchanged initially. Reproduce inside,
   edge-band, safe-outside and post-combat travel states; verify movement and
   damage cessation. Also correct environmental killer attribution. These are
   proposed shared behavior/telemetry changes, not applied bot-only patches.
2. **If shared movement remains unchanged, the next bot-only experiment is
   explicit:** repeat the earned bridge with the same travel package except
   omit Recover First during transit, then recover at Sanctuary. The isolated
   diagnostic justifies testing it but does not establish survival. Use one
   first-death-bounded case; do not revive B/C or fabricate a T3 snapshot.
3. After a safe earned entry, ordinarily spend the range point and screen a
   source-audited T3 reference, then separate Volcano/Tundra first-death probes.
   Keep incoming bursts, hazards, DoTs and short enemy TTK separate. No T3 boss
   pass until preparation/access is credible.
4. Broaden T2 beyond Spirit. A useful next Squire question is Forest with
   Quake Hammer/Mountain armor, a non-kill-dependent recovery charm, and an
   appropriate single-target Technique. Audit/acquire from Squire's own state;
   do not assume the Plains charm's add-fight value transfers to a lone boss.

**No numerical balance nerf is justified by tonight's new evidence alone.**
Volcano damage remains a priority to measure after the movement confound;
Tundra has no new runtime result. T3/T4 low enemy eHP remains flagged, with no
HP increase or damage adjustment applied. Further execution needs a new session
packet because this night's four-packet ceiling is exhausted.
