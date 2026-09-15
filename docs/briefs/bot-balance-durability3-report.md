# Durability 3 report — defense identity and T2 companion pressure

Status: complete, synthetic benchmark evidence only. This report records one exact frozen run and returns the balance decision to the user/Astra. It does not authorize a live patch, resistance mechanic, class nerf, or economy certification.

## Decision summary

- The frozen 152-cell batch completed exactly once: 456/456 observations, 0 failed observations, 32 player deaths, and no retries.
- The HP-trim arm is consistently shorter than reference for baseline classes: the baseline-class range is 0.74–0.88x reference across the four node/build contexts. The DR arm is much closer to reference at 0.85–1.03x. That makes the DR identity the better candidate for preserving the intended T2/T3 durability band than HP trim alone.
- Flat plating is not a clean HP replacement in this batch. It is usually near the reduced-HP arm for ordinary builds, but it produces sparse, very large Conduit outliers: T3 Cave baseline Conduit 56.50s and weapon-alt Conduit 178.90s versus 23.40s and 24.45s in HP-trim; T3 Mountain baseline Conduit 81.75s and weapon-alt Conduit has no clean named median. This is an interaction/outlier signal, not evidence to add DoT resistance.
- The T2 Mountain companion arms do not give a monotonic pressure answer. Named-elite TTK moves only slightly between companion arms, while deaths vary non-monotonically: reference 4, Eagle-soft 3, Thrower-soft 7, Both-soft 0. Because the arms alter both ordinary and opening companion damage and natural episodes diverge, the evidence is insufficient for a live pressure reduction.
- Stone Eagle chronology supports a distinct opening sequence, but the world log does not expose an empowered-hit flag. A later multiplier-only comparison is the appropriate follow-on if Eagle pressure still needs isolation; it was not run here.
- Recommendation: retain the DR profile as the leading experimental defense candidate, keep plating as an investigated interaction rather than a default profile, and defer any companion or class change pending the isolated Eagle multiplier comparison. No source or balance files were changed.

Named-elite aggregate: 2,997 named-target traces; 2,780 killed, 217 censored, 80 with observed HP regain, and 2,735 clean traces. Counts are not mutually exclusive where a target was killed after HP regain. Across all 9,315 target traces, 8,988 were killed, 327 censored, 101 had observed HP regain, and 8,931 were clean.

## Frozen identity, treatment, and execution

| Item | Value |
|---|---|
| Frozen source revision | `5d64868501ebb3f3c877e1980ffbe0e0e269ec28` |
| Frozen source tree | `f1d790774df9b09a6ccb72ceaf154e870b565f24` |
| Untreated definitions hash | `40158eea807ae06a5b531fe40d7ad05fb74eed79900a26503f7ee58f394f3ab1` |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitboxes SHA-256 | `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83` |
| Qualification index | [frozen qualification index](<C:/Users/osaif/AppData/Local/mmo-idle/validation/durability3/frozen-qualification/index.json>) |
| Qualification index SHA-256 | `4BE4753E33108DFBA4D009449D8EE432EEA803A255111A9F36D2C7DB266C9A32` |
| Mode | `run`, synthetic `true`, economyEligible `false` |
| Time step / duration | 100ms / 300s per observation |
| Seeds | 173, 947, 2027 |
| Matrix | 4 nodes × 8 builds × 4 defense arms + T2 Mountain × 8 builds × 3 pressure arms = 152 cells |
| Observations | 456 |
| Qualification | All 152 cells qualified; geometry, actual attack/defense, overlay/restoration, and typecheck gates passed. Pilot runs and report generation passed. Full suite and browser playtest were not run. |

The defense arms were: Reference (T2 3x HP, T3 5x HP), HP-trim (T2 2.4x, T3 4x), Plating (HP-trim plus +8 T2/+16 T3 plating), and DR (HP-trim plus DR moved 20% toward full mitigation). T2 Cave target attack was 0.75x in all defense arms; the other named targets were 1.0x. The three T2 Mountain pressure arms retained reference HP/defenses and full Granite Titan attack while reducing Stone Eagle, Peak Archer, or both companion attack values to 0.75x. Companion populations and all non-target rules stayed fixed.

Each result is joined by manifest cell ID and seed. In the tables below, each seed bracket is `seed: clean named-target median TTK / kills / censored / HP-regain`; `D` is the number of player-death outcomes in that cell. The outer TTK is the median of the three seed medians, never a pooled-kill median. An em dash means that seed/cell had no clean named-target median.

The exact run command was:

~~~
pnpm --dir C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/source --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability3 --mode=run --revision=5d64868501ebb3f3c877e1980ffbe0e0e269ec28 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --out=C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results
~~~

Run window: 2026-09-15T13:50:34.2123717Z–2026-09-15T14:30:07.5268920Z UTC; wall time 2,373.315s. C: free space was 60,290,236,416 bytes at start and 59,728,674,816 at end. Wrapper working set was 95,629,312 bytes at start and 97,263,616 bytes at end. One sequential process was used; no Docker, service restart, retry, or live edit was used.

## Integrity and artifact verification

An independent post-run scan found 152 manifest cells, 456 paired run directories, 32 node/build groups, 0 geometryRosterHash mismatches, 288/288 expected defense overlays, 72/72 expected pressure overlays, and 0 overlay/restoration mismatches. The comparison intentionally ignores the treatment-owned HP/attack/plating/DR fields when checking roster identity and positions; full roster hashes are expected to differ between treatment arms. initialStats was checked against the spawned roster after normal node scaling, so it is not expected to equal the pre-node hpTreatment overlay values.

| Artifact | SHA-256 / result |
|---|---|
| [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/manifest.json>) | `F5FDF1EBC62495BE94EE176A85FD698FB93CFF973A34F465D9D8B01C831457DA` |
| [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/complete.json>) | `D3F9D5CE641BD038DF04C842C8E32DEEAA388364244860371D971BAE24C32C97`; `{"cells":152,"runs":456,"mode":"run"}` |
| [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/index.json>) | `9B5B5E927EDBF8A9C9D9956C1BFBC0879D60EA2A9F55BDF6A3727EFBD51C21E1` |
| [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/analysis.json>) | `B18647C0204FDA500ECC980013D1F0A86D9FE89486BA5A42600B2DC6591C5169` |
| [analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/analysis.md>) | `6A088ED410C1807E126746AFA7D8005D8F4E8B5ECE307026DC1CC3D343083AFC` |
| Result structure | 456 run directories, 1,829 recursive files, 0 `failed.json`, 5 root files |

The detached source checkout remained at the frozen revision/tree and clean after the run. The sibling pilot directory is qualification provenance only and is not treated as treatment evidence.

## Named-elite TTK: all 32 defense combinations

| Tier / node / role | Build (manifest alternate) | Elite | Reference | HP-trim | Plating | DR |
|---|---|---|---|---|---|---|
| T2 node-t2-cave-02 / solo | baseline apprentice | cave-troll | 14.5s [173:14.5/4/0/0; 947:14.7/4/1/0; 2027:14.2/5/1/0; D0] | 12s [173:12/7/0/0; 947:12/7/0/0; 2027:11.85/2/2/0; D1] | 12.25s [173:12/4/2/0; 947:12.6/7/1/1; 2027:12.25/2/2/0; D2] | 13.1s [173:13.1/6/0/0; 947:13.5/11/0/0; 2027:13.1/6/0/0; D0] |
| T2 node-t2-cave-02 / solo | baseline conduit | cave-troll | 17.55s [173:17.55/6/0/0; 947:17.5/9/0/0; 2027:17.75/6/0/0; D0] | 14.1s [173:14.1/6/1/0; 947:14.1/10/0/0; 2027:14/7/1/0; D0] | 26.9s [173:26.9/5/0/0; 947:28.45/6/1/0; 2027:26.8/6/0/0; D0] | 17.9s [173:17.8/7/1/0; 947:17.9/10/0/0; 2027:17.9/7/0/0; D0] |
| T2 node-t2-cave-02 / solo | weapon-alt conduit | cave-troll | 14.3s [173:14.45/6/0/0; 947:14.3/9/0/0; 2027:14.3/6/0/0; D0] | 11.4s [173:11.2/8/0/0; 947:11.4/9/1/0; 2027:11.4/7/1/0; D0] | 32.3s [173:32.4/5/1/0; 947:32/6/1/0; 2027:32.3/5/0/0; D0] | 14.9s [173:14.9/7/0/0; 947:14.9/9/1/0; 2027:14.8/4/0/0; D0] |
| T2 node-t2-cave-02 / solo | baseline slinger | cave-troll | 11s [173:11.1/9/0/0; 947:10.3/11/0/0; 2027:11/8/0/0; D0] | 8.8s [173:8.8/11/0/0; 947:8.8/9/1/0; 2027:7.8/6/0/0; D0] | 9.1s [173:9.1/9/0/0; 947:9.1/11/1/0; 2027:9.1/9/0/0; D0] | 11s [173:11.1/9/0/0; 947:10.3/11/0/0; 2027:11/8/0/0; D0] |
| T2 node-t2-cave-02 / solo | weapon-alt slinger | cave-troll | 19.75s [173:19.75/4/0/0; 947:20/5/0/0; 2027:19.5/5/0/0; D0] | 17s [173:17/5/1/0; 947:17/8/0/0; 2027:16/5/1/1; D0] | 18.55s [173:18/5/0/0; 947:18.75/6/1/0; 2027:18.55/4/1/0; D0] | 20s [173:19.75/4/0/0; 947:20/5/0/0; 2027:20/5/0/0; D0] |
| T2 node-t2-cave-02 / solo | baseline spirit | cave-troll | 11.9s [173:11.2/8/0/0; 947:11.9/10/0/0; 2027:11.9/7/0/0; D0] | 9.1s [173:8.4/11/1/0; 947:9.1/14/0/0; 2027:9.1/9/0/0; D0] | 10.5s [173:10/11/0/0; 947:10.5/14/0/0; 2027:10.5/11/0/0; D0] | 11.9s [173:11.2/8/0/0; 947:11.9/10/0/0; 2027:11.9/7/0/0; D0] |
| T2 node-t2-cave-02 / solo | baseline squire | cave-troll | 16s [173:16/6/0/0; 947:16/7/1/0; 2027:15.7/6/0/0; D0] | 14.1s [173:14.1/7/0/0; 947:13.9/8/1/0; 2027:14.1/5/1/0; D0] | 15.9s [173:16/6/0/0; 947:15.6/8/0/0; 2027:15.9/7/0/0; D0] | 16s [173:16/6/0/0; 947:16/7/1/0; 2027:15.7/6/0/0; D0] |
| T2 node-t2-cave-02 / solo | baseline striker | cave-troll | 22.2s [173:22.4/7/0/0; 947:22.2/5/1/0; 2027:22.1/5/0/0; D0] | 16.5s [173:16.6/5/1/0; 947:16.5/8/0/0; 2027:16.2/8/0/0; D0] | 23.4s [173:23.4/7/1/0; 947:23.2/5/1/0; 2027:23.4/4/0/0; D0] | 21.7s [173:21.8/5/1/0; 947:21.7/5/1/0; 2027:21.5/5/0/0; D0] |
| T2 node-t2-mountain-04 / small-group | baseline apprentice | granite-titan | 13.5s [173:13.5/8/0/1; 947:13.5/7/1/0; 2027:13.5/3/0/0; D0] | 10.5s [173:10.5/5/0/0; 947:10.5/8/0/0; 2027:10.5/6/2/1; D1] | 11.25s [173:11.25/2/0/0; 947:12/5/0/0; 2027:10.5/6/0/1; D1] | 12s [173:12/7/0/0; 947:11.2/7/0/0; 2027:12/4/0/0; D0] |
| T2 node-t2-mountain-04 / small-group | baseline conduit | granite-titan | 14.65s [173:14.7/2/1/0; 947:14.6/3/1/0; 2027:—/0/1/1; D2] | 12.07s [173:12.15/8/1/0; 947:12/4/0/1; 2027:—/0/1/1; D1] | 28.23s [173:28.2/5/0/0; 947:28.25/2/1/1; 2027:—/0/1/1; D1] | 14.8s [173:14.8/5/0/0; 947:14.8/3/0/0; 2027:—/0/1/1; D1] |
| T2 node-t2-mountain-04 / small-group | weapon-alt conduit | granite-titan | 11.9s [173:11.8/8/0/0; 947:12/6/0/0; 2027:11.9/5/0/1; D0] | 9.3s [173:9.3/7/0/0; 947:9.3/6/0/0; 2027:9.4/5/0/1; D0] | 32.4s [173:32.3/3/0/0; 947:32.4/4/1/0; 2027:32.5/5/1/1; D0] | 11.5s [173:11.5/11/0/0; 947:11.7/7/0/0; 2027:11.4/8/0/1; D0] |
| T2 node-t2-mountain-04 / small-group | baseline slinger | granite-titan | 12.3s [173:12.3/9/1/0; 947:12.3/7/0/0; 2027:10.6/10/0/0; D0] | 9.1s [173:9.1/8/0/0; 947:9.1/9/0/1; 2027:9.1/6/0/0; D1] | 9.7s [173:9.7/9/0/0; 947:9.7/12/0/0; 2027:9.7/2/0/0; D1] | 11.75s [173:10.9/12/0/0; 947:12.6/9/0/0; 2027:11.75/8/0/0; D0] |
| T2 node-t2-mountain-04 / small-group | weapon-alt slinger | granite-titan | 18s [173:19.5/8/0/0; 947:18/5/1/0; 2027:18/4/1/0; D0] | 15s [173:17/3/0/1; 947:15/6/1/0; 2027:15/7/0/0; D0] | 17s [173:17/1/2/2; 947:17/6/1/0; 2027:17/1/0/0; D2] | 18s [173:19.75/6/0/0; 947:18/5/1/0; 2027:18/1/0/0; D1] |
| T2 node-t2-mountain-04 / small-group | baseline spirit | granite-titan | 11.9s [173:11.9/10/3/2; 947:11.9/1/0/0; 2027:12.25/6/0/0; D1] | 9.8s [173:9.8/14/0/0; 947:9.1/1/0/0; 2027:9.8/9/0/0; D1] | 10.5s [173:10.5/8/0/0; 947:10.5/11/0/0; 2027:11.2/9/0/0; D0] | 11.9s [173:11.9/10/3/2; 947:11.9/1/0/0; 2027:12.25/6/0/0; D1] |
| T2 node-t2-mountain-04 / small-group | baseline squire | granite-titan | 18.3s [173:18.3/7/0/0; 947:18.2/7/0/0; 2027:20.5/8/0/0; D0] | 15.5s [173:15.7/5/0/0; 947:15.15/6/0/0; 2027:15.5/6/0/0; D0] | 17.4s [173:17.4/7/0/0; 947:17.1/4/1/0; 2027:17.45/6/1/0; D0] | 18.3s [173:18.3/7/0/0; 947:18.2/7/0/0; 2027:20.5/8/0/0; D0] |
| T2 node-t2-mountain-04 / small-group | baseline striker | granite-titan | 25.4s [173:24.9/5/1/0; 947:25.4/5/1/0; 2027:25.4/5/1/0; D1] | 19s [173:19/4/1/0; 947:18.8/6/0/0; 2027:19.7/3/1/0; D0] | 27.68s [173:27.1/5/1/0; 947:28.25/4/0/0; 2027:—/0/1/0; D1] | 25.4s [173:24.9/5/1/0; 947:25.4/5/1/0; 2027:25.4/5/1/0; D1] |
| T3 node-t3-cave-02 / solo | baseline apprentice | cavern-troll | 21.8s [173:22.5/4/1/1; 947:21.8/6/0/1; 2027:21/5/1/0; D0] | 17.2s [173:17.2/7/0/1; 947:17.25/5/2/1; 2027:16.85/4/0/0; D1] | 18s [173:18/4/1/1; 947:18/6/1/1; 2027:17.4/5/0/0; D0] | 18.65s [173:18.2/7/1/1; 947:19.5/6/3/2; 2027:18.65/8/0/0; D0] |
| T3 node-t3-cave-02 / solo | baseline conduit | cavern-troll | 29.7s [173:29.7/5/0/0; 947:29.4/6/0/0; 2027:29.8/5/0/0; D0] | 23.4s [173:23.4/5/1/0; 947:23.5/7/0/0; 2027:23.4/5/1/0; D0] | 56.5s [173:56.5/3/0/0; 947:56.15/4/1/0; 2027:56.5/4/1/0; D0] | 30.5s [173:30.5/5/0/0; 947:30.5/7/1/0; 2027:30.5/4/0/0; D0] |
| T3 node-t3-cave-02 / solo | weapon-alt conduit | cavern-troll | 30.45s [173:30.45/4/1/0; 947:30.25/4/1/0; 2027:30.5/6/0/0; D0] | 24.45s [173:24.45/6/0/0; 947:24.4/7/0/0; 2027:24.5/6/0/0; D0] | 178.9s [173:179.6/1/1/0; 947:178.7/1/1/0; 2027:178.9/1/1/0; D0] | 31.6s [173:31.6/5/1/0; 947:31.6/5/0/0; 2027:31.6/6/1/0; D0] |
| T3 node-t3-cave-02 / solo | baseline slinger | cavern-troll | 21.2s [173:21.2/9/1/1; 947:20.65/8/0/0; 2027:22.5/5/1/0; D0] | 16.5s [173:16.5/7/0/0; 947:16.6/9/0/0; 2027:16.4/7/1/0; D0] | 17.4s [173:17.4/7/1/1; 947:17.3/8/1/0; 2027:17.4/5/1/0; D0] | 21.2s [173:21.2/9/1/1; 947:20.65/8/0/0; 2027:22.5/5/1/0; D0] |
| T3 node-t3-cave-02 / solo | weapon-alt slinger | cavern-troll | 32s [173:30.8/3/2/1; 947:32.2/5/1/2; 2027:32/5/2/1; D0] | 25.7s [173:25/5/1/1; 947:26/7/1/0; 2027:25.7/5/0/0; D0] | 29s [173:29/5/0/0; 947:29.4/4/1/1; 2027:29/3/1/0; D0] | 32s [173:32/5/1/0; 947:32/4/1/1; 2027:32/5/1/0; D0] |
| T3 node-t3-cave-02 / solo | baseline spirit | cavern-troll | 16.05s [173:15.4/7/1/0; 947:16.7/11/1/0; 2027:16.05/8/1/0; D0] | 12.8s [173:13.1/11/0/0; 947:12.8/12/0/0; 2027:12.4/7/1/0; D0] | 14.6s [173:13.8/9/1/0; 947:14.6/13/0/0; 2027:14.8/8/1/0; D0] | 16.05s [173:15.4/7/1/0; 947:16.7/11/1/0; 2027:16.05/8/1/0; D0] |
| T3 node-t3-cave-02 / solo | baseline squire | cavern-troll | 24.95s [173:24.95/6/1/0; 947:25.6/6/1/0; 2027:24.5/6/0/0; D0] | 19s [173:18.5/7/0/0; 947:19.5/8/0/0; 2027:19/5/1/0; D0] | 22.2s [173:22.3/8/0/0; 947:22.2/7/1/0; 2027:22.2/6/1/0; D0] | 24.95s [173:24.95/6/1/0; 947:25.6/6/1/0; 2027:24.5/6/0/0; D0] |
| T3 node-t3-cave-02 / solo | baseline striker | cavern-troll | 17.3s [173:18.2/6/0/0; 947:16.7/8/1/0; 2027:17.3/7/1/0; D0] | 14s [173:14/8/1/0; 947:14.1/9/1/0; 2027:14/7/0/0; D0] | 16.3s [173:16.3/9/0/0; 947:16.85/8/1/0; 2027:16.3/9/1/0; D0] | 17.3s [173:18.2/6/0/0; 947:16.7/8/1/0; 2027:17.3/7/1/0; D0] |
| T3 node-t3-mountain-04 / small-group | baseline apprentice | mountain-colossus | 22.5s [173:22.5/6/0/0; 947:22.5/6/1/0; 2027:22.5/5/0/0; D0] | 18.9s [173:19.5/6/1/1; 947:18.9/7/1/0; 2027:18/5/2/1; D0] | 19.5s [173:18.9/7/0/0; 947:19.5/8/0/0; 2027:19.5/6/1/0; D0] | 19.2s [173:19.2/7/1/1; 947:18.9/5/0/0; 2027:19.5/6/0/0; D0] |
| T3 node-t3-mountain-04 / small-group | baseline conduit | mountain-colossus | 26.85s [173:26.85/4/1/0; 947:26.9/4/1/0; 2027:26.8/5/1/0; D0] | 21.2s [173:21.2/5/1/0; 947:21.2/4/1/0; 2027:21.2/5/1/0; D0] | 81.75s [173:81.5/3/1/0; 947:81.75/2/1/0; 2027:82.35/2/1/0; D0] | 27.2s [173:27.2/4/1/0; 947:27.65/4/1/0; 2027:27.1/4/1/0; D0] |
| T3 node-t3-mountain-04 / small-group | weapon-alt conduit | mountain-colossus | 27.2s [173:27.2/4/1/0; 947:27.2/5/0/0; 2027:27/4/1/0; D0] | 21.8s [173:21.8/5/1/0; 947:21.8/5/0/0; 2027:21.9/5/0/0; D0] | —s | 26.5s [173:26.5/5/0/0; 947:26.5/3/1/0; 2027:26.6/4/1/1; D0] |
| T3 node-t3-mountain-04 / small-group | baseline slinger | mountain-colossus | 24.05s [173:25.2/9/0/0; 947:23.9/4/0/0; 2027:24.05/6/0/0; D0] | 18.3s [173:18.1/7/0/0; 947:19.9/5/0/0; 2027:18.3/5/1/0; D0] | 22.25s [173:21.7/7/1/0; 947:22.25/6/1/0; 2027:23.1/6/1/2; D0] | 24.05s [173:25.2/9/0/0; 947:23.9/4/0/0; 2027:24.05/6/0/0; D0] |
| T3 node-t3-mountain-04 / small-group | weapon-alt slinger | mountain-colossus | 32s [173:32/5/1/1; 947:33.25/4/1/0; 2027:32/5/1/0; D0] | 26s [173:27/5/1/1; 947:26/5/1/1; 2027:26/5/0/1; D0] | 32s [173:32/5/1/1; 947:32/4/0/1; 2027:32/5/0/0; D0] | 32s [173:32/5/1/1; 947:32/4/0/1; 2027:32/5/0/0; D0] |
| T3 node-t3-mountain-04 / small-group | baseline spirit | mountain-colossus | 19.4s [173:19.5/8/2/2; 947:18.8/6/1/0; 2027:19.4/8/0/0; D0] | 14.5s [173:15.4/5/0/0; 947:14.5/9/0/0; 2027:14.35/10/0/0; D0] | 17.1s [173:17.1/9/1/2; 947:17.2/8/0/0; 2027:17.1/9/0/0; D0] | 19.4s [173:19.5/8/2/2; 947:18.8/6/1/0; 2027:19.4/8/0/0; D0] |
| T3 node-t3-mountain-04 / small-group | baseline squire | mountain-colossus | 28.4s [173:28.4/5/1/0; 947:28.3/5/0/0; 2027:31.1/5/0/0; D0] | 23.3s [173:23.2/7/1/0; 947:23.3/5/0/0; 2027:23.8/7/0/0; D0] | 26.4s [173:25.45/6/1/0; 947:26.4/5/0/0; 2027:26.55/6/0/0; D0] | 28.4s [173:28.4/5/1/0; 947:28.3/5/0/0; 2027:31.1/5/0/0; D0] |
| T3 node-t3-mountain-04 / small-group | baseline striker | mountain-colossus | 21.5s [173:21.8/7/0/0; 947:21.5/5/1/0; 2027:21.4/6/0/0; D0] | 17.25s [173:16.6/8/0/0; 947:17.25/6/0/0; 2027:18.8/5/0/0; D0] | 22.3s [173:22.7/7/0/0; 947:21.6/5/0/0; 2027:22.3/7/0/0; D0] | 21.8s [173:21.8/7/0/0; 947:21.8/5/1/0; 2027:21.5/6/0/0; D0] |

The table’s deaths and censored counts are deliberately shown next to the clean medians. Several cells have sparse named-target comparators, especially T2 Mountain baseline/Conduit and the all-censored T3 Mountain weapon-alt Conduit plating cell. Those rows are not suitable as standalone evidence for a new resistance rule.

## Defense comparison and class/weapon ratios

| Context | HP-trim / reference | Plating / reference | DR / reference |
|---|---:|---:|---:|
| T2 node-t2-cave-02 / solo | 0.74–0.88x (squire max) | 0.83–1.53x (conduit max) | 0.9–1.02x (conduit max) |
| T2 node-t2-mountain-04 / small-group | 0.74–0.85x (squire max) | 0.79–1.93x (conduit max) | 0.89–1.01x (conduit max) |
| T3 node-t3-cave-02 / solo | 0.76–0.81x (striker max) | 0.82–1.9x (conduit max) | 0.86–1.03x (conduit max) |
| T3 node-t3-mountain-04 / small-group | 0.75–0.84x (apprentice max) | 0.87–3.04x (conduit max) | 0.85–1.01x (striker max) |

HP-trim lowers baseline-class named TTK to 0.74–0.88x reference in the four contexts. DR is generally 0.85–1.03x reference and is the most stable identity-preserving arm. Plating ranges from 0.82–1.93x reference in the first three contexts and 0.87–3.04x in T3 Mountain for baseline classes; its high tail is concentrated in Conduit. The named table shows the alternate weapon arms, including the much larger T3 Cave Conduit outlier.

| Context | Arm | Baseline clean TTK min–max s | Spread | Fastest → slowest |
|---|---|---:|---:|---|
| T2 node-t2-cave-02 / solo | reference | 11–22.2 | 2.02x | slinger → striker |
| T2 node-t2-cave-02 / solo | hp-trim | 8.8–16.5 | 1.88x | slinger → striker |
| T2 node-t2-cave-02 / solo | plating | 9.1–26.9 | 2.96x | slinger → conduit |
| T2 node-t2-cave-02 / solo | dr | 11–21.7 | 1.97x | slinger → striker |
| T2 node-t2-mountain-04 / small-group | reference | 11.9–25.4 | 2.13x | spirit → striker |
| T2 node-t2-mountain-04 / small-group | hp-trim | 9.1–19 | 2.09x | slinger → striker |
| T2 node-t2-mountain-04 / small-group | plating | 9.7–28.23 | 2.91x | slinger → conduit |
| T2 node-t2-mountain-04 / small-group | dr | 11.75–25.4 | 2.16x | slinger → striker |
| T3 node-t3-cave-02 / solo | reference | 16.05–29.7 | 1.85x | spirit → conduit |
| T3 node-t3-cave-02 / solo | hp-trim | 12.8–23.4 | 1.83x | spirit → conduit |
| T3 node-t3-cave-02 / solo | plating | 14.6–56.5 | 3.87x | spirit → conduit |
| T3 node-t3-cave-02 / solo | dr | 16.05–30.5 | 1.9x | spirit → conduit |
| T3 node-t3-mountain-04 / small-group | reference | 19.4–28.4 | 1.46x | spirit → squire |
| T3 node-t3-mountain-04 / small-group | hp-trim | 14.5–23.3 | 1.61x | spirit → squire |
| T3 node-t3-mountain-04 / small-group | plating | 17.1–81.75 | 4.78x | spirit → conduit |
| T3 node-t3-mountain-04 / small-group | dr | 19.2–28.4 | 1.48x | apprentice → squire |

The baseline class spread is normally below 3x. The only pairwise ratios at or above 4x are both in T3 Mountain plating:

| Context | Arm | Pair | Slower / faster |
|---|---|---|---:|
| T3 node-t3-mountain-04 / small-group | plating | Conduit vs Apprentice | 4.19x |
| T3 node-t3-mountain-04 / small-group | plating | Conduit vs Spirit | 4.78x |

That is 2/240 baseline-class pairwise comparisons. No class reaches a 4x advantage over the median of the other five baseline classes in any cell. The two flagged ratios are the same sparse plating/Conduit interaction, not a repeated class identity signal.

Alternate weapon ratios (weapon-alt / same-class baseline; >1 means the alternate is slower):

| Context | Arm | Slinger weapon-alt / baseline | Conduit weapon-alt / baseline |
|---|---|---:|---:|
| T2 node-t2-cave-02 / solo | reference | 1.8x | 0.81x |
| T2 node-t2-cave-02 / solo | hp-trim | 1.93x | 0.81x |
| T2 node-t2-cave-02 / solo | plating | 2.04x | 1.2x |
| T2 node-t2-cave-02 / solo | dr | 1.82x | 0.83x |
| T2 node-t2-mountain-04 / small-group | reference | 1.46x | 0.81x |
| T2 node-t2-mountain-04 / small-group | hp-trim | 1.65x | 0.77x |
| T2 node-t2-mountain-04 / small-group | plating | 1.75x | 1.15x |
| T2 node-t2-mountain-04 / small-group | dr | 1.53x | 0.78x |
| T3 node-t3-cave-02 / solo | reference | 1.51x | 1.03x |
| T3 node-t3-cave-02 / solo | hp-trim | 1.56x | 1.04x |
| T3 node-t3-cave-02 / solo | plating | 1.67x | 3.17x |
| T3 node-t3-cave-02 / solo | dr | 1.51x | 1.04x |
| T3 node-t3-mountain-04 / small-group | reference | 1.33x | 1.01x |
| T3 node-t3-mountain-04 / small-group | hp-trim | 1.42x | 1.03x |
| T3 node-t3-mountain-04 / small-group | plating | 1.44x | — (all-censored alt) |
| T3 node-t3-mountain-04 / small-group | dr | 1.33x | 0.97x |

The Slinger alternate is consistently slower, roughly 1.33–2.04x. The Conduit alternate is near parity outside the plating interaction, reaches 3.17x in T3 Cave plating, and has no clean median in T3 Mountain plating. This batch does not justify DoT resistance or a class nerf.

## T2 Mountain companion pressure

Named-elite TTK for the three pressure arms is shown in the last table above. The treatment is not monotonic: the same build can speed up or slow down as companion attack is reduced, and natural repopulation/episode paths change. The full pressure metrics below use totals for cast/ward counts and damage-by-attacker tables use only observations that ended in player death.

| Build | Arm | Deaths | Min HP min/median | Peak hit median/max | Peak 1s median/max | Recovery median/max s | Interrupted | Elite casts S/F | Barrier S/F | Live final median | Max outgoing gap median/max s | Late gap median s | Same-tick kills | Static contacts entries/max | Cleanse uses | Late joiners / max members |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| baseline striker | reference | 1 | 0 / 0.06 | 86 / 86 | 138 / 151 | 6.65 / 8.8 | 15 | 63/63 | 15/15 | 24 | 12.7 / 18 | 0.2 | 43 | 0/0 | 0 | 4/3 |
| baseline striker | hp-trim | 0 | 0.06 / 0.19 | 86 / 86 | 131 / 145 | 7.05 / 8.2 | 18 | 46/45 | 14/14 | 24 | 14.8 / 16.8 | 2.2 | 57 | 0/0 | 0 | 7/2 |
| baseline striker | plating | 1 | 0 / 0.06 | 86 / 86 | 131 / 138 | 6.5 / 8.7 | 10 | 44/44 | 11/11 | 24 | 12.7 / 13.6 | 0.2 | 33 | 0/0 | 0 | 4/3 |
| baseline striker | dr | 1 | 0 / 0.06 | 86 / 86 | 138 / 151 | 6.65 / 8.8 | 15 | 63/63 | 15/15 | 24 | 12.7 / 18 | 0.2 | 43 | 0/0 | 0 | 4/3 |
| baseline striker | eagle-soft | 0 | 0.25 / 0.3 | 79 / 79 | 118 / 146 | 6.95 / 7.6 | 11 | 52/52 | 13/13 | 23 | 13.9 / 19.8 | 3.1 | 53 | 0/0 | 0 | 9/3 |
| baseline striker | thrower-soft | 1 | 0 / 0.29 | 86 / 86 | 118 / 138 | 7.1 / 8.8 | 15 | 48/48 | 12/12 | 23 | 12.8 / 14.3 | 0.5 | 43 | 0/0 | 0 | 10/3 |
| baseline striker | both-soft | 0 | 0.27 / 0.3 | 79 / 79 | 118 / 118 | 6.9 / 7.7 | 26 | 54/54 | 13/13 | 24 | 12.1 / 13.8 | 0.3 | 58 | 0/0 | 0 | 9/3 |
| baseline squire | reference | 0 | 0.1 / 0.21 | 89.2 / 95 | 139 / 139 | 4.5 / 7.6 | 14 | 71/70 | 22/22 | 23 | 15.2 / 18.7 | 2.6 | 58 | 0/0 | 0 | 9/3 |
| baseline squire | hp-trim | 0 | 0.24 / 0.36 | 94.4 / 95 | 123 / 139 | 6 / 8.5 | 20 | 48/48 | 15/15 | 23 | 14.5 / 18.7 | 2.8 | 71 | 0/0 | 0 | 7/3 |
| baseline squire | plating | 0 | 0.35 / 0.44 | 95 / 95 | 95 / 123 | 4.25 / 7.5 | 22 | 56/55 | 18/18 | 24 | 14.2 / 20 | 1.3 | 67 | 0/0 | 0 | 7/3 |
| baseline squire | dr | 0 | 0.1 / 0.21 | 89.2 / 95 | 139 / 139 | 4.5 / 7.6 | 14 | 71/70 | 22/22 | 23 | 15.2 / 18.7 | 2.6 | 58 | 0/0 | 0 | 9/3 |
| baseline squire | eagle-soft | 2 | 0 / 0 | 85 / 85 | 119 / 119 | 4.5 / 7.8 | 13 | 53/52 | 16/16 | 24 | 12.2 / 14.9 | 1.2 | 45 | 0/0 | 0 | 10/3 |
| baseline squire | thrower-soft | 0 | 0.1 / 0.12 | 85 / 95 | 139 / 139 | 5.65 / 7.8 | 8 | 72/72 | 22/22 | 23 | 20.5 / 20.8 | 4.4 | 56 | 0/0 | 0 | 12/3 |
| baseline squire | both-soft | 0 | 0.29 / 0.42 | 85 / 85 | 85 / 119 | 4.1 / 7.8 | 18 | 66/65 | 21/21 | 24 | 12.2 / 19.9 | 2.6 | 61 | 0/0 | 0 | 7/3 |
| baseline apprentice | reference | 0 | 0 / 0.29 | 97.2 / 97.2 | 129 / 155 | 7.45 / 10.6 | 13 | 37/36 | 18/18 | 23 | 18 / 25.1 | 0.8 | 58 | 0/0 | 0 | 8/3 |
| baseline apprentice | hp-trim | 1 | 0 / 0.19 | 97.2 / 97.2 | 157 / 197.4 | 7.5 / 9.2 | 3 | 38/28 | 19/19 | 24 | 13.9 / 14.5 | 0.1 | 60 | 0/0 | 0 | 20/8 |
| baseline apprentice | plating | 1 | 0 / 0.2 | 97.2 / 97.2 | 154 / 155 | 7.45 / 8.9 | 6 | 27/19 | 13/13 | 24 | 15.5 / 23.1 | 1.6 | 51 | 0/0 | 0 | 12/4 |
| baseline apprentice | dr | 0 | 0.15 / 0.25 | 97.2 / 97.2 | 101.2 / 153.6 | 7.55 / 8.7 | 12 | 37/30 | 18/18 | 24 | 16 / 23.2 | 4.4 | 64 | 0/0 | 0 | 6/2 |
| baseline apprentice | eagle-soft | 1 | 0 / 0.25 | 81 / 81 | 84 / 168.5 | 7.6 / 7.9 | 18 | 31/28 | 14/14 | 24 | 14.3 / 16.1 | 0.3 | 56 | 0/0 | 0 | 5/4 |
| baseline apprentice | thrower-soft | 2 | 0 / 0 | 97.2 / 97.2 | 110.4 / 156 | 6.95 / 7.7 | 10 | 26/25 | 12/12 | 24 | 12.5 / 17.6 | 0.8 | 44 | 0/0 | 0 | 11/8 |
| baseline apprentice | both-soft | 0 | 0.31 / 0.42 | 85.5 / 85.5 | 89.5 / 156.3 | 7.55 / 7.8 | 16 | 46/44 | 21/21 | 24 | 12.8 / 12.8 | 5 | 65 | 0/0 | 0 | 14/6 |
| baseline slinger | reference | 0 | 0.33 / 0.56 | 88.2 / 113 | 88.2 / 113 | 4.3 / 7.7 | 23 | 52/31 | 26/26 | 24 | 9.8 / 10.8 | 2 | 86 | 0/0 | 0 | 6/2 |
| baseline slinger | hp-trim | 1 | 0 / 0.26 | 113 / 113 | 178 / 202.7 | 4.8 / 7.7 | 19 | 26/24 | 23/23 | 24 | 10.3 / 13.1 | 3.2 | 76 | 0/0 | 0 | 11/3 |
| baseline slinger | plating | 1 | 0 / 0.39 | 113 / 113 | 113 / 180 | 0 / 7.5 | 22 | 27/25 | 23/23 | 24 | 12.1 / 12.7 | 0.1 | 64 | 0/0 | 0 | 2/3 |
| baseline slinger | dr | 0 | 0.32 / 0.54 | 102.2 / 113 | 102.2 / 164 | 4.25 / 7.8 | 20 | 58/38 | 29/29 | 23 | 15.5 / 16.2 | 1.6 | 76 | 0/0 | 0 | 7/2 |
| baseline slinger | eagle-soft | 0 | 0.53 / 0.58 | 62.4 / 100 | 62.4 / 100 | 0 / 7.1 | 27 | 60/39 | 31/31 | 23 | 8.8 / 14.4 | 3.3 | 81 | 0/0 | 0 | 4/2 |
| baseline slinger | thrower-soft | 1 | 0 / 0.32 | 100.3 / 111.5 | 100.3 / 111.5 | 1.3 / 7.7 | 21 | 43/29 | 22/22 | 23 | 16.4 / 65.6 | 4.6 | 63 | 0/0 | 0 | 3/2 |
| baseline slinger | both-soft | 0 | 0.57 / 0.71 | 68.5 / 77 | 68.5 / 92 | 1.95 / 7.7 | 35 | 52/33 | 27/27 | 23 | 16.4 / 16.5 | 2.8 | 88 | 0/0 | 0 | 6/3 |
| weapon-alt slinger | reference | 0 | 0.01 / 0.25 | 102.2 / 113 | 104.1 / 113 | 6.5 / 9.7 | 12 | 49/39 | 18/18 | 24 | 12.6 / 16.7 | 0.5 | 53 | 0/0 | 0 | 15/6 |
| weapon-alt slinger | hp-trim | 0 | 0.11 / 0.36 | 98 / 113 | 113 / 132 | 6.2 / 7.6 | 10 | 35/35 | 16/16 | 24 | 15.7 / 17.7 | 1.7 | 58 | 0/0 | 0 | 21/16 |
| weapon-alt slinger | plating | 2 | 0 / 0 | 113 / 113 | 119.6 / 227.3 | 5.9 / 6.8 | 5 | 20/18 | 9/9 | 24 | 10.1 / 16.3 | 0.1 | 26 | 0/0 | 0 | 12/9 |
| weapon-alt slinger | dr | 1 | 0 / 0.01 | 113 / 113 | 113 / 133 | 6.65 / 10 | 7 | 31/27 | 12/12 | 24 | 10.8 / 14.3 | 0.2 | 42 | 0/0 | 0 | 28/16 |
| weapon-alt slinger | eagle-soft | 0 | 0.13 / 0.28 | 84 / 98 | 105.5 / 110.2 | 5.7 / 7.6 | 11 | 31/29 | 13/13 | 24 | 13.2 / 202.5 | 5 | 48 | 0/0 | 0 | 27/14 |
| weapon-alt slinger | thrower-soft | 1 | 0 / 0.01 | 113 / 113 | 113 / 164 | 6.4 / 9.7 | 23 | 33/29 | 13/13 | 24 | 11.5 / 16.7 | 0.2 | 53 | 0/0 | 0 | 19/6 |
| weapon-alt slinger | both-soft | 0 | 0.28 / 0.44 | 98 / 98 | 98 / 105.5 | 5.5 / 6.7 | 13 | 49/42 | 19/19 | 24 | 10.2 / 14.6 | 0.3 | 57 | 0/0 | 0 | 31/13 |
| baseline conduit | reference | 2 | 0 / 0 | 78 / 78 | 78 / 146 | 0.45 / 7.3 | 0 | 3/3 | 0/0 | 24 | 8.1 / 11.1 | 0.5 | 29 | 0/0 | 0 | 7/4 |
| baseline conduit | hp-trim | 1 | 0 / 0.35 | 78 / 78 | 123 / 146 | 1.4 / 8 | 1 | 0/0 | 0/0 | 24 | 10.7 / 18.6 | 0.9 | 42 | 0/0 | 0 | 9/4 |
| baseline conduit | plating | 1 | 0 / 0.52 | 56 / 78 | 56 / 146 | 0.5 / 6.9 | 1 | 0/0 | 0/0 | 24 | 9.7 / 14.7 | 4.4 | 36 | 0/0 | 0 | 11/6 |
| baseline conduit | dr | 1 | 0 / 0.67 | 45 / 78 | 45 / 146 | 2.2 / 6.9 | 0 | 0/0 | 0/0 | 24 | 13 / 16.5 | 9.5 | 42 | 0/0 | 0 | 4/4 |
| baseline conduit | eagle-soft | 0 | 0.08 / 0.25 | 56 / 68 | 68 / 116 | 0.6 / 7.6 | 1 | 3/3 | 0/0 | 24 | 12 / 18 | 0.4 | 62 | 0/0 | 0 | 12/7 |
| baseline conduit | thrower-soft | 2 | 0 / 0 | 78 / 78 | 78 / 129 | 0.45 / 7.3 | 0 | 3/3 | 0/0 | 24 | 8.1 / 11.1 | 0.5 | 29 | 0/0 | 0 | 7/4 |
| baseline conduit | both-soft | 0 | 0.22 / 0.25 | 52 / 68 | 68 / 99 | 0.4 / 7.3 | 0 | 3/3 | 0/0 | 24 | 11.4 / 14.5 | 0.4 | 66 | 0/0 | 0 | 22/17 |
| weapon-alt conduit | reference | 0 | 0.1 / 0.62 | 45 / 112 | 45 / 161 | 1.35 / 7.7 | 1 | 0/0 | 0/0 | 24 | 13.8 / 15.5 | 7.1 | 66 | 0/0 | 0 | 7/3 |
| weapon-alt conduit | hp-trim | 0 | 0 / 0.2 | 78 / 112 | 123 / 161 | 0.6 / 8.5 | 2 | 1/1 | 1/1 | 23 | 12.7 / 22 | 3.1 | 69 | 0/0 | 0 | 19/15 |
| weapon-alt conduit | plating | 0 | 0.1 / 0.65 | 45 / 78 | 45 / 123 | 0.3 / 7.6 | 1 | 0/0 | 0/0 | 24 | 13 / 13.5 | 0.3 | 45 | 0/0 | 0 | 4/3 |
| weapon-alt conduit | dr | 0 | 0.1 / 0.67 | 45 / 78 | 45 / 123 | 1.3 / 7.5 | 1 | 0/0 | 0/0 | 24 | 13.4 / 15.5 | 0.3 | 62 | 0/0 | 0 | 6/3 |
| weapon-alt conduit | eagle-soft | 0 | 0.51 / 0.79 | 30 / 52 | 30 / 82 | 1.3 / 7.6 | 1 | 0/0 | 0/0 | 23 | 13.8 / 24.2 | 1.9 | 68 | 0/0 | 0 | 8/4 |
| weapon-alt conduit | thrower-soft | 0 | 0.1 / 0.62 | 45 / 112 | 45 / 161 | 1.35 / 7.7 | 1 | 0/0 | 0/0 | 23 | 13.8 / 15.5 | 7.1 | 66 | 0/0 | 0 | 6/3 |
| weapon-alt conduit | both-soft | 0 | 0.51 / 0.79 | 30 / 52 | 30 / 82 | 1.3 / 7.6 | 1 | 0/0 | 0/0 | 23 | 13.8 / 24.2 | 1.9 | 68 | 0/0 | 0 | 8/4 |
| baseline spirit | reference | 1 | 0 / 0.24 | 112 / 112 | 112 / 112 | 3.7 / 7.6 | 14 | 35/20 | 18/18 | 24 | 11.4 / 11.6 | 0.4 | 60 | 0/0 | 0 | 32/26 |
| baseline spirit | hp-trim | 1 | 0 / 0.55 | 95 / 112 | 95 / 112 | 0 / 7.8 | 29 | 31/24 | 24/23 | 23 | 10.4 / 11.1 | 0.7 | 67 | 0/0 | 0 | 4/2 |
| baseline spirit | plating | 0 | 0.29 / 0.4 | 112 / 112 | 112 / 112 | 0 / 7.8 | 34 | 45/32 | 28/27 | 24 | 13.7 / 49.4 | 1.5 | 89 | 0/0 | 0 | 11/3 |
| baseline spirit | dr | 1 | 0 / 0.24 | 112 / 112 | 112 / 112 | 3.7 / 7.6 | 14 | 35/20 | 18/18 | 24 | 11.4 / 11.6 | 0.4 | 60 | 0/0 | 0 | 32/26 |
| baseline spirit | eagle-soft | 0 | 0.15 / 0.58 | 75 / 80 | 75 / 86.7 | 3.1 / 8 | 18 | 53/39 | 27/27 | 23 | 12.2 / 19.5 | 1.7 | 83 | 0/0 | 0 | 34/15 |
| baseline spirit | thrower-soft | 0 | 0.25 / 0.37 | 95 / 112 | 95 / 112 | 2.4 / 7.7 | 15 | 56/37 | 28/28 | 24 | 11.7 / 13.3 | 3.7 | 87 | 0/0 | 0 | 37/27 |
| baseline spirit | both-soft | 0 | 0.3 / 0.48 | 86 / 86 | 86 / 86 | 0 / 7.1 | 20 | 66/43 | 33/33 | 23 | 13 / 14.4 | 1.2 | 83 | 0/0 | 0 | 37/27 |

Definitions: Min HP is minimum player HP fraction (minimum/median across the three seeds). Peak hit and Peak 1s are HP damage, excluding absorbed damage; Recovery is the median/max completed recovery interval in seconds and Interrupted counts intervals cut off by the next pull. Elite cast S/F comes from named-elite target traces. Barrier S/F comes from Granite Barrier cast events. Live final is the median number of positive-HP monsters in the final sample. Max outgoing gap includes the initial gap, inter-event gaps, and the final gap to the observation end.

| Build | Arm | Death runs | Pre-death 10s: attacker / type HP+absorbed | Pre-death 30s: attacker / type HP+absorbed |
|---|---|---:|---|---|
| baseline striker | reference | 1 | s173 Boulder Thrower / direct 216+0; Granite Titan / direct 158+0 | s173 Boulder Thrower / direct 328+176; Granite Titan / direct 158+0 |
| baseline striker | hp-trim | 0 |  |  |
| baseline striker | plating | 1 | s2027 Granite Titan / direct 158+0; Stone Eagle / direct 145+0 | s2027 Granite Titan / direct 380.8+93.2; Stone Eagle / direct 204+0 |
| baseline striker | dr | 1 | s173 Boulder Thrower / direct 216+0; Granite Titan / direct 158+0 | s173 Boulder Thrower / direct 328+176; Granite Titan / direct 158+0 |
| baseline striker | eagle-soft | 0 |  |  |
| baseline striker | thrower-soft | 1 | s2027 Granite Titan / direct 108+50; Stone Eagle / direct 86+0 | s2027 Granite Titan / direct 311.8+162.2; Stone Eagle / direct 231+0 |
| baseline striker | both-soft | 0 |  |  |
| baseline squire | reference | 0 |  |  |
| baseline squire | hp-trim | 0 |  |  |
| baseline squire | plating | 0 |  |  |
| baseline squire | dr | 0 |  |  |
| baseline squire | eagle-soft | 2 | s173 Granite Titan / direct 170+0; Stone Eagle / direct 68+0<br>s2027 Granite Titan / direct 170+0; Stone Eagle / direct 93+0 | s173 Granite Titan / direct 322+18; Stone Eagle / direct 136+59; Boulder Thrower / direct 69+0<br>s2027 Granite Titan / direct 263+77; Stone Eagle / direct 202+18 |
| baseline squire | thrower-soft | 0 |  |  |
| baseline squire | both-soft | 0 |  |  |
| baseline apprentice | reference | 0 |  |  |
| baseline apprentice | hp-trim | 1 | s173 Stone Eagle / direct 343.8+66; Stone Eagle / debt 13+0 | s173 Stone Eagle / direct 343.8+66; Boulder Thrower / direct 63.2+85.8; Stone Eagle / debt 13+0; Boulder Thrower / debt 4+0 |
| baseline apprentice | plating | 1 | s173 Stone Eagle / direct 288+66; Stone Eagle / debt 6+0; Boulder Thrower / debt 2+0 | s173 Stone Eagle / direct 343.8+66; Boulder Thrower / direct 63.2+85.8; Stone Eagle / debt 11+0; Boulder Thrower / debt 4+0 |
| baseline apprentice | dr | 0 |  |  |
| baseline apprentice | eagle-soft | 1 | s2027 Stone Eagle / direct 223.9+8.3; Boulder Thrower / direct 81+66; Boulder Thrower / debt 5+0; Stone Eagle / debt 3+0 | s2027 Boulder Thrower / direct 144.2+151.8; Stone Eagle / direct 223.9+8.3; Boulder Thrower / debt 9+0; Stone Eagle / debt 3+0 |
| baseline apprentice | thrower-soft | 2 | s947 Stone Eagle / direct 208.8+0; Boulder Thrower / direct 88.3+9.9; Stone Eagle / debt 20+0<br>s2027 Stone Eagle / direct 208.8+0; Boulder Thrower / direct 79.4+19.8; Stone Eagle / debt 11+0; Boulder Thrower / debt 9+0 | s947 Stone Eagle / direct 340.2+132; Boulder Thrower / direct 88.3+9.9; Stone Eagle / debt 28+0<br>s2027 Stone Eagle / direct 246.6+66; Boulder Thrower / direct 99.4+105.6; Stone Eagle / debt 13+0; Boulder Thrower / debt 9+0 |
| baseline apprentice | both-soft | 0 |  |  |
| baseline slinger | reference | 0 |  |  |
| baseline slinger | hp-trim | 1 | s2027 Stone Eagle / direct 332.7+57.3 | s2027 Stone Eagle / direct 332.7+57.3; Boulder Thrower / direct 19+62 |
| baseline slinger | plating | 1 | s2027 Stone Eagle / direct 212+0; Boulder Thrower / direct 100+62 | s2027 Stone Eagle / direct 263+62; Boulder Thrower / direct 119+124 |
| baseline slinger | dr | 0 |  |  |
| baseline slinger | eagle-soft | 0 |  |  |
| baseline slinger | thrower-soft | 1 | s947 Boulder Thrower / direct 107.8+23.3 | s947 Boulder Thrower / direct 287.9+48.1 |
| baseline slinger | both-soft | 0 |  |  |
| weapon-alt slinger | reference | 0 |  |  |
| weapon-alt slinger | hp-trim | 0 |  |  |
| weapon-alt slinger | plating | 2 | s173 Granite Titan / direct 126.3+69.8; Stone Eagle / direct 113+0; Boulder Thrower / direct 24+0<br>s2027 Stone Eagle / direct 218+0 | s173 Granite Titan / direct 126.3+69.8; Stone Eagle / direct 113+0; Boulder Thrower / direct 86.4+18.6<br>s2027 Stone Eagle / direct 331+0; Granite Titan / direct 36+62 |
| weapon-alt slinger | dr | 1 | s2027 Stone Eagle / direct 297+62 | s2027 Stone Eagle / direct 484.1+72.8; Granite Titan / direct 36+62 |
| weapon-alt slinger | eagle-soft | 0 |  |  |
| weapon-alt slinger | thrower-soft | 1 | s2027 Stone Eagle / direct 334+62 | s2027 Stone Eagle / direct 516.6+122.4; Boulder Thrower / direct 57+0 |
| weapon-alt slinger | both-soft | 0 |  |  |
| baseline conduit | reference | 2 | s173 Stone Eagle / direct 213+0; Granite Titan / direct 68+0<br>s2027 Stone Eagle / direct 307+63; Boulder Thrower / direct 56+0 | s173 Granite Titan / direct 116+126; Stone Eagle / direct 213+0<br>s2027 Stone Eagle / direct 307+63; Boulder Thrower / direct 56+0 |
| baseline conduit | hp-trim | 1 | s2027 Stone Eagle / direct 307+63; Boulder Thrower / direct 56+0 | s2027 Stone Eagle / direct 307+63; Boulder Thrower / direct 56+0 |
| baseline conduit | plating | 1 | s2027 Stone Eagle / direct 307+63; Boulder Thrower / direct 56+0 | s2027 Stone Eagle / direct 307+63; Boulder Thrower / direct 56+0 |
| baseline conduit | dr | 1 | s2027 Stone Eagle / direct 307+63; Boulder Thrower / direct 56+0 | s2027 Stone Eagle / direct 307+63; Boulder Thrower / direct 56+0 |
| baseline conduit | eagle-soft | 0 |  |  |
| baseline conduit | thrower-soft | 2 | s173 Stone Eagle / direct 213+0; Granite Titan / direct 68+0<br>s2027 Stone Eagle / direct 307+63; Boulder Thrower / direct 39+0 | s173 Granite Titan / direct 116+126; Stone Eagle / direct 213+0<br>s2027 Stone Eagle / direct 307+63; Boulder Thrower / direct 39+0 |
| baseline conduit | both-soft | 0 |  |  |
| weapon-alt conduit | reference | 0 |  |  |
| weapon-alt conduit | hp-trim | 0 |  |  |
| weapon-alt conduit | plating | 0 |  |  |
| weapon-alt conduit | dr | 0 |  |  |
| weapon-alt conduit | eagle-soft | 0 |  |  |
| weapon-alt conduit | thrower-soft | 0 |  |  |
| weapon-alt conduit | both-soft | 0 |  |  |
| baseline spirit | reference | 1 | s947 Stone Eagle / direct 224+0; Boulder Thrower / direct 44.5+35.5 | s947 Boulder Thrower / direct 116.8+203.2; Stone Eagle / direct 224+0 |
| baseline spirit | hp-trim | 1 | s947 Stone Eagle / direct 224+0; Boulder Thrower / direct 44.5+35.5 | s947 Boulder Thrower / direct 116.8+203.2; Stone Eagle / direct 224+0 |
| baseline spirit | plating | 0 |  |  |
| baseline spirit | dr | 1 | s947 Stone Eagle / direct 224+0; Boulder Thrower / direct 44.5+35.5 | s947 Boulder Thrower / direct 116.8+203.2; Stone Eagle / direct 224+0 |
| baseline spirit | eagle-soft | 0 |  |  |
| baseline spirit | thrower-soft | 0 |  |  |
| baseline spirit | both-soft | 0 |  |  |

Pre-death damage cells are `HP+absorbed` totals by attacker and damage type, per death seed; debt is kept as its own type. A blank means that no observation in the cell ended in player death. These are top categories by gross damage in each death window; the raw events remain the source of truth.

### Stone Eagle opening dive

The frozen Stone Eagle contract defines a 75-attack flyer and a `cast-charge-strike` Skyfall Rend opener with a 1,000ms cast, 4x charge speed, 2,800ms max charge, and 1.75x damage multiplier ([mountain.monsters.ts:112](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/shared/src/data/monsters/mountain.monsters.ts:112>), [lines 124–127](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/shared/src/data/monsters/mountain.monsters.ts:124>)). It is important not to label every Eagle hit as a dive.

| Pressure arm | Skyfall starts/fired | Opening candidates | Opening HP median | Opening gross median/max | Ordinary HP median | Ordinary gross median/max |
|---|---:|---:|---:|---:|---:|---:|
| reference | 154/154 | 122 | 51 | 107.9/113 | 55.8 | 59/113 |
| eagle-soft | 169/169 | 106 | 15 | 71.4/77 | 36.9 | 36.9/77 |
| thrower-soft | 151/150 | 113 | 51 | 103.8/113 | 55.8 | 59/113 |
| both-soft | 180/178 | 118 | 15 | 73.2/77 | 36.9 | 39/77 |

Opening candidates are the first positive Stone Eagle player-damage events within 1,000ms after a fired Skyfall Rend cast. The world log does not carry the internal empowered flag, and not every fired cast has a matching candidate because the target can disappear, die, or the event boundary can fall outside the matching window. The ordinary column excludes those candidate event lines, but its maximum can still overlap an opener when the raw event lacks a sequence tag. Therefore the table supports the cast/charge chronology and shows that opening candidates are materially larger in the reference arms, but it does not prove a per-hit multiplier from events alone. Because Eagle-soft reduces both ordinary and opening damage, it is not a multiplier-only test. If the Eagle remains a pressure concern, the next experiment should change only the 1.75x multiplier while retaining the 75 base attack; no such change was made here.

### Cave root/slam chronology

The Cave Troll and Cavern Troll contracts use a 1,700ms root and then Ground Slam; the T2/T3 charged attacks use 2,000/2,200ms cast times and 2.1/2.0 multipliers ([cave.monsters.ts:105](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/shared/src/data/monsters/cave.monsters.ts:105>), [lines 108–122](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/shared/src/data/monsters/cave.monsters.ts:108>), [lines 177–192](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/shared/src/data/monsters/cave.monsters.ts:177>)). Across the cave defense observations, T2 logged 553 root gains/expiries, 659 slam starts/633 slam ends, 657 telegraph results and 59 results with damage; T3 logged 291/291, 559/494, 553 and 40. Slam ends can be absent when the caster disappears before resolution.

| Tier | Example | Spike | Root gain → expire | Slam start → end | Nearby live roster at nearest sample | Raw evidence |
|---|---|---:|---|---|---:|---|
| Tundefined | dur3-ttk-t2-slinger-solo-baseline-reference / s947 | 174 HP | 82.0s [494] → 83.7s [508] | 82.0s [495] → 84.0s [515] | 16 | [line 510](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-slinger-solo-baseline-reference-s947/events.jsonl:510>) |

These examples show the relevant pattern: root and Slam can begin together, root expires only 300–500ms before impact, and a failed telegraph escape receives the large direct spike. The sample window around both examples had 16 live monsters. Cleanse activation was observable (1,506 activations across all runs), but the event schema does not provide enough cooldown/eligibility state to reconstruct a cooldown failure. No Cleanse bug is inferred from these deaths.

## Death attribution: all 32 player deaths

| Cell / seed | At | Cause | Damage | Killer | Evidence |
|---|---:|---|---:|---|---|
| dur3-ttk-t2-apprentice-solo-baseline-hp-trim / 2027 | 65.6s | melee | 151.2 | Cave Troll (cave-troll) | [349](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-apprentice-solo-baseline-hp-trim-s2027/events.jsonl:349>) |
| dur3-ttk-t2-apprentice-solo-baseline-plating / 173 | 200.8s | melee | 151.2 | Cave Troll (cave-troll) | [825](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-apprentice-solo-baseline-plating-s173/events.jsonl:825>) |
| dur3-ttk-t2-apprentice-solo-baseline-plating / 2027 | 65.6s | melee | 151.2 | Cave Troll (cave-troll) | [350](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-apprentice-solo-baseline-plating-s2027/events.jsonl:350>) |
| dur3-ttk-t2-striker-small-group-baseline-reference / 173 | 275.8s | ranged | 72 | Boulder Thrower (peak-archer) | [2059](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-striker-small-group-baseline-reference-s173/events.jsonl:2059>) |
| dur3-ttk-t2-striker-small-group-baseline-plating / 2027 | 37.9s | melee | 79 | Granite Titan (granite-titan) | [400](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-striker-small-group-baseline-plating-s2027/events.jsonl:400>) |
| dur3-ttk-t2-striker-small-group-baseline-dr / 173 | 275.8s | ranged | 72 | Boulder Thrower (peak-archer) | [2059](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-striker-small-group-baseline-dr-s173/events.jsonl:2059>) |
| dur3-ttk-t2-striker-small-group-baseline-thrower-soft / 2027 | 113.1s | melee | 86 | Stone Eagle (stone-eagle) | [1013](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-striker-small-group-baseline-thrower-soft-s2027/events.jsonl:1013>) |
| dur3-ttk-t2-squire-small-group-baseline-eagle-soft / 173 | 103.2s | melee | 85 | Granite Titan (granite-titan) | [374](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-squire-small-group-baseline-eagle-soft-s173/events.jsonl:374>) |
| dur3-ttk-t2-squire-small-group-baseline-eagle-soft / 2027 | 276.2s | melee | 85 | Granite Titan (granite-titan) | [836](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-squire-small-group-baseline-eagle-soft-s2027/events.jsonl:836>) |
| dur3-ttk-t2-apprentice-small-group-baseline-hp-trim / 173 | 201.1s | melee | 55.8 | Stone Eagle (stone-eagle) | [699](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-apprentice-small-group-baseline-hp-trim-s173/events.jsonl:699>) |
| dur3-ttk-t2-apprentice-small-group-baseline-plating / 173 | 91s | melee | 55.8 | Stone Eagle (stone-eagle) | [329](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-apprentice-small-group-baseline-plating-s173/events.jsonl:329>) |
| dur3-ttk-t2-apprentice-small-group-baseline-eagle-soft / 2027 | 240s | melee | 64.8 | Stone Eagle (stone-eagle) | [803](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-apprentice-small-group-baseline-eagle-soft-s2027/events.jsonl:803>) |
| dur3-ttk-t2-apprentice-small-group-baseline-thrower-soft / 947 | 280.6s | ranged | 39.7 | Boulder Thrower (peak-archer) | [997](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-apprentice-small-group-baseline-thrower-soft-s947/events.jsonl:997>) |
| dur3-ttk-t2-apprentice-small-group-baseline-thrower-soft / 2027 | 58.6s | ranged | 30.8 | Boulder Thrower (peak-archer) | [282](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-apprentice-small-group-baseline-thrower-soft-s2027/events.jsonl:282>) |
| dur3-ttk-t2-slinger-small-group-baseline-hp-trim / 2027 | 157.8s | melee | 65 | Stone Eagle (stone-eagle) | [1034](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-slinger-small-group-baseline-hp-trim-s2027/events.jsonl:1034>) |
| dur3-ttk-t2-slinger-small-group-baseline-plating / 2027 | 73.9s | ranged | 81 | Boulder Thrower (peak-archer) | [484](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-slinger-small-group-baseline-plating-s2027/events.jsonl:484>) |
| dur3-ttk-t2-slinger-small-group-baseline-thrower-soft / 947 | 143.3s | ranged | 57 | Boulder Thrower (peak-archer) | [795](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-slinger-small-group-baseline-thrower-soft-s947/events.jsonl:795>) |
| dur3-ttk-t2-slinger-small-group-weapon-alt-plating / 173 | 107.2s | melee | 113 | Stone Eagle (stone-eagle) | [936](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-slinger-small-group-weapon-alt-plating-s173/events.jsonl:936>) |
| dur3-ttk-t2-slinger-small-group-weapon-alt-plating / 2027 | 29.8s | melee | 20 | Stone Eagle (stone-eagle) | [299](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-slinger-small-group-weapon-alt-plating-s2027/events.jsonl:299>) |
| dur3-ttk-t2-slinger-small-group-weapon-alt-dr / 2027 | 38.7s | melee | 113 | Stone Eagle (stone-eagle) | [366](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-slinger-small-group-weapon-alt-dr-s2027/events.jsonl:366>) |
| dur3-ttk-t2-slinger-small-group-weapon-alt-thrower-soft / 2027 | 191.5s | melee | 20 | Stone Eagle (stone-eagle) | [1754](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-slinger-small-group-weapon-alt-thrower-soft-s2027/events.jsonl:1754>) |
| dur3-ttk-t2-conduit-small-group-baseline-reference / 173 | 103.3s | melee | 68 | Granite Titan (granite-titan) | [971](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-conduit-small-group-baseline-reference-s173/events.jsonl:971>) |
| dur3-ttk-t2-conduit-small-group-baseline-reference / 2027 | 25.2s | ranged | 56 | Boulder Thrower (peak-archer) | [285](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-conduit-small-group-baseline-reference-s2027/events.jsonl:285>) |
| dur3-ttk-t2-conduit-small-group-baseline-hp-trim / 2027 | 25.2s | ranged | 56 | Boulder Thrower (peak-archer) | [285](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-conduit-small-group-baseline-hp-trim-s2027/events.jsonl:285>) |
| dur3-ttk-t2-conduit-small-group-baseline-plating / 2027 | 25.2s | ranged | 56 | Boulder Thrower (peak-archer) | [285](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-conduit-small-group-baseline-plating-s2027/events.jsonl:285>) |
| dur3-ttk-t2-conduit-small-group-baseline-dr / 2027 | 25.2s | ranged | 56 | Boulder Thrower (peak-archer) | [285](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-conduit-small-group-baseline-dr-s2027/events.jsonl:285>) |
| dur3-ttk-t2-conduit-small-group-baseline-thrower-soft / 173 | 103.3s | melee | 68 | Granite Titan (granite-titan) | [971](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-conduit-small-group-baseline-thrower-soft-s173/events.jsonl:971>) |
| dur3-ttk-t2-conduit-small-group-baseline-thrower-soft / 2027 | 25.2s | ranged | 39 | Boulder Thrower (peak-archer) | [285](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-conduit-small-group-baseline-thrower-soft-s2027/events.jsonl:285>) |
| dur3-ttk-t2-spirit-small-group-baseline-reference / 947 | 37.7s | melee | 112 | Stone Eagle (stone-eagle) | [153](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-spirit-small-group-baseline-reference-s947/events.jsonl:153>) |
| dur3-ttk-t2-spirit-small-group-baseline-hp-trim / 947 | 37.6s | melee | 112 | Stone Eagle (stone-eagle) | [141](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-spirit-small-group-baseline-hp-trim-s947/events.jsonl:141>) |
| dur3-ttk-t2-spirit-small-group-baseline-dr / 947 | 37.7s | melee | 112 | Stone Eagle (stone-eagle) | [153](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t2-spirit-small-group-baseline-dr-s947/events.jsonl:153>) |
| dur3-ttk-t3-apprentice-solo-baseline-hp-trim / 947 | 209.3s | ranged | 49.5 | Crystal Gargoyle (crystal-gargoyle) | [1118](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/dur3-ttk-t3-apprentice-solo-baseline-hp-trim-s947/events.jsonl:1118>) |

The aggregate killer counts are 12 Stone Eagle, 11 Boulder Thrower, 5 Granite Titan, 3 Cave Troll, and 1 Crystal Gargoyle. No Cavern Troll death occurred. The exact event-line links above preserve damage-type and final-cause evidence.

## Inactivity, summons, episode merging, and same-tick outcomes

The full per-cell diagnostic appendix below preserves outgoing-gap, late-final-gap, owned-summon, final-live-target, same-tick, static-contact, and no-outgoing fields. Max gap is measured from 0 through the final logged positive outgoing event; a long gap can be a natural repopulation/target-path interval rather than an authored-pack clear failure.

| Tier / node / build / arm | Max gap median/max s | Last outgoing-to-window median s | Owned summon outgoing HP+absorbed | Final live target median | Same-tick kills | Static contacts entries/max | No outgoing |
|---|---:|---:|---:|---:|---:|---:|---:|
| T2 node-t2-cave-02 / baseline striker / reference | 13.3/18.1 | 0.5 | 0 | 16 | 47 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline striker / hp-trim | 16.6/18.3 | 0.4 | 0 | 16 | 47 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline striker / plating | 13.3/18.8 | 0.6 | 0 | 16 | 47 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline striker / dr | 18.1/36.9 | 0.4 | 0 | 16 | 47 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline squire / reference | 16.3/17.8 | 0.8 | 0 | 16 | 56 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline squire / hp-trim | 13.7/17.2 | 1.6 | 0 | 16 | 62 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline squire / plating | 16.3/16.8 | 3.8 | 0 | 15 | 57 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline squire / dr | 16.3/17.8 | 0.8 | 0 | 16 | 56 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline apprentice / reference | 14.2/17.4 | 0.4 | 0 | 16 | 57 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline apprentice / hp-trim | 13.3/17.9 | 0.6 | 0 | 16 | 42 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline apprentice / plating | 16.5/17.8 | 0.6 | 0 | 16 | 34 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline apprentice / dr | 12.9/14.3 | 7.9 | 0 | 16 | 59 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline slinger / reference | 15/15.4 | 1.5 | 0 | 15 | 75 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline slinger / hp-trim | 13.7/16.1 | 1.3 | 0 | 16 | 87 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline slinger / plating | 16.9/17.5 | 2.4 | 0 | 16 | 78 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline slinger / dr | 15/15.4 | 1.5 | 0 | 15 | 75 | 0/0 | 0 |
| T2 node-t2-cave-02 / weapon-alt slinger / reference | 13.3/14.7 | 2.1 | 0 | 16 | 54 | 0/0 | 0 |
| T2 node-t2-cave-02 / weapon-alt slinger / hp-trim | 12.3/15.4 | 0.4 | 0 | 16 | 54 | 0/0 | 0 |
| T2 node-t2-cave-02 / weapon-alt slinger / plating | 14/14.3 | 0.3 | 0 | 16 | 55 | 0/0 | 0 |
| T2 node-t2-cave-02 / weapon-alt slinger / dr | 12.7/13.3 | 3.1 | 0 | 16 | 55 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline conduit / reference | 12.4/15 | 0.3 | 46745 | 16 | 52 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline conduit / hp-trim | 15/15.1 | 0.4 | 44689 | 16 | 56 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline conduit / plating | 12.4/13.3 | 0.9 | 31524 | 16 | 40 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline conduit / dr | 9.3/13.3 | 0.4 | 42008 | 16 | 49 | 0/0 | 0 |
| T2 node-t2-cave-02 / weapon-alt conduit / reference | 14.2/16.3 | 3.7 | 51863 | 16 | 64 | 0/0 | 0 |
| T2 node-t2-cave-02 / weapon-alt conduit / hp-trim | 12.4/15.2 | 0.1 | 49363 | 16 | 65 | 0/0 | 0 |
| T2 node-t2-cave-02 / weapon-alt conduit / plating | 9.9/11.1 | 0.2 | 30377 | 16 | 38 | 0/0 | 0 |
| T2 node-t2-cave-02 / weapon-alt conduit / dr | 13.1/14.2 | 0.1 | 44664 | 16 | 63 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline spirit / reference | 12/12.9 | 3.6 | 0 | 15 | 86 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline spirit / hp-trim | 11.8/12.9 | 0.5 | 0 | 16 | 85 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline spirit / plating | 12.8/13 | 3.4 | 0 | 16 | 75 | 0/0 | 0 |
| T2 node-t2-cave-02 / baseline spirit / dr | 12/12.9 | 3.6 | 0 | 15 | 86 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline striker / reference | 12.7/18 | 0.2 | 0 | 24 | 43 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline striker / hp-trim | 14.8/16.8 | 2.2 | 0 | 24 | 57 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline striker / plating | 12.7/13.6 | 0.2 | 0 | 24 | 33 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline striker / dr | 12.7/18 | 0.2 | 0 | 24 | 43 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline striker / eagle-soft | 13.9/19.8 | 3.1 | 0 | 23 | 53 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline striker / thrower-soft | 12.8/14.3 | 0.5 | 0 | 23 | 43 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline striker / both-soft | 12.1/13.8 | 0.3 | 0 | 24 | 58 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline squire / reference | 15.2/18.7 | 2.6 | 0 | 23 | 58 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline squire / hp-trim | 14.5/18.7 | 2.8 | 0 | 23 | 71 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline squire / plating | 14.2/20 | 1.3 | 0 | 24 | 67 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline squire / dr | 15.2/18.7 | 2.6 | 0 | 23 | 58 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline squire / eagle-soft | 12.2/14.9 | 1.2 | 0 | 24 | 45 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline squire / thrower-soft | 20.5/20.8 | 4.4 | 0 | 23 | 56 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline squire / both-soft | 12.2/19.9 | 2.6 | 0 | 24 | 61 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline apprentice / reference | 18/25.1 | 0.8 | 0 | 23 | 58 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline apprentice / hp-trim | 13.9/14.5 | 0.1 | 0 | 24 | 60 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline apprentice / plating | 15.5/23.1 | 1.6 | 0 | 24 | 51 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline apprentice / dr | 16/23.2 | 4.4 | 0 | 24 | 64 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline apprentice / eagle-soft | 14.3/16.1 | 0.3 | 0 | 24 | 56 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline apprentice / thrower-soft | 12.5/17.6 | 0.8 | 0 | 24 | 44 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline apprentice / both-soft | 12.8/12.8 | 5 | 0 | 24 | 65 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline slinger / reference | 9.8/10.8 | 2 | 0 | 24 | 86 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline slinger / hp-trim | 10.3/13.1 | 3.2 | 0 | 24 | 76 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline slinger / plating | 12.1/12.7 | 0.1 | 0 | 24 | 64 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline slinger / dr | 15.5/16.2 | 1.6 | 0 | 23 | 76 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline slinger / eagle-soft | 8.8/14.4 | 3.3 | 0 | 23 | 81 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline slinger / thrower-soft | 16.4/65.6 | 4.6 | 0 | 23 | 63 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline slinger / both-soft | 16.4/16.5 | 2.8 | 0 | 23 | 88 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt slinger / reference | 12.6/16.7 | 0.5 | 0 | 24 | 53 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt slinger / hp-trim | 15.7/17.7 | 1.7 | 0 | 24 | 58 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt slinger / plating | 10.1/16.3 | 0.1 | 0 | 24 | 26 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt slinger / dr | 10.8/14.3 | 0.2 | 0 | 24 | 42 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt slinger / eagle-soft | 13.2/202.5 | 5 | 0 | 24 | 48 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt slinger / thrower-soft | 11.5/16.7 | 0.2 | 0 | 24 | 53 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt slinger / both-soft | 10.2/14.6 | 0.3 | 0 | 24 | 57 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline conduit / reference | 8.1/11.1 | 0.5 | 19152 | 24 | 29 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline conduit / hp-trim | 10.7/18.6 | 0.9 | 26543 | 24 | 42 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline conduit / plating | 9.7/14.7 | 4.4 | 19504 | 24 | 36 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline conduit / dr | 13/16.5 | 9.5 | 22306 | 24 | 42 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline conduit / eagle-soft | 12/18 | 0.4 | 39786 | 24 | 62 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline conduit / thrower-soft | 8.1/11.1 | 0.5 | 19152 | 24 | 29 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline conduit / both-soft | 11.4/14.5 | 0.4 | 40375 | 24 | 66 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt conduit / reference | 13.8/15.5 | 7.1 | 44404 | 24 | 66 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt conduit / hp-trim | 12.7/22 | 3.1 | 39763 | 23 | 69 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt conduit / plating | 13/13.5 | 0.3 | 26467 | 24 | 45 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt conduit / dr | 13.4/15.5 | 0.3 | 42979 | 24 | 62 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt conduit / eagle-soft | 13.8/24.2 | 1.9 | 43197 | 23 | 68 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt conduit / thrower-soft | 13.8/15.5 | 7.1 | 44336 | 23 | 66 | 0/0 | 0 |
| T2 node-t2-mountain-04 / weapon-alt conduit / both-soft | 13.8/24.2 | 1.9 | 43197 | 23 | 68 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline spirit / reference | 11.4/11.6 | 0.4 | 0 | 24 | 60 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline spirit / hp-trim | 10.4/11.1 | 0.7 | 0 | 23 | 67 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline spirit / plating | 13.7/49.4 | 1.5 | 0 | 24 | 89 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline spirit / dr | 11.4/11.6 | 0.4 | 0 | 24 | 60 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline spirit / eagle-soft | 12.2/19.5 | 1.7 | 0 | 23 | 83 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline spirit / thrower-soft | 11.7/13.3 | 3.7 | 0 | 24 | 87 | 0/0 | 0 |
| T2 node-t2-mountain-04 / baseline spirit / both-soft | 13/14.4 | 1.2 | 0 | 23 | 83 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline striker / reference | 10.4/12.7 | 0.2 | 0 | 16 | 76 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline striker / hp-trim | 10.1/11.1 | 0.3 | 0 | 15 | 83 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline striker / plating | 10.7/16.6 | 0.3 | 0 | 16 | 71 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline striker / dr | 10.4/12.7 | 0.2 | 0 | 16 | 76 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline squire / reference | 9.9/11.6 | 1 | 0 | 16 | 64 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline squire / hp-trim | 10.7/12.8 | 1.3 | 0 | 16 | 71 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline squire / plating | 9.9/10.2 | 2 | 0 | 16 | 62 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline squire / dr | 9.9/11.6 | 1 | 0 | 16 | 64 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline apprentice / reference | 11.7/13.5 | 0.3 | 0 | 16 | 58 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline apprentice / hp-trim | 13.9/15.9 | 0.6 | 0 | 16 | 54 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline apprentice / plating | 10.7/13.4 | 0.2 | 0 | 16 | 65 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline apprentice / dr | 10.7/15.4 | 0.2 | 0 | 16 | 62 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline slinger / reference | 9.3/18.8 | 0.3 | 0 | 16 | 61 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline slinger / hp-trim | 10.8/13 | 2 | 0 | 16 | 73 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline slinger / plating | 10.3/12.9 | 0.2 | 0 | 16 | 73 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline slinger / dr | 9.3/18.8 | 0.3 | 0 | 16 | 61 | 0/0 | 0 |
| T3 node-t3-cave-02 / weapon-alt slinger / reference | 9.6/11 | 0.4 | 0 | 16 | 44 | 0/0 | 0 |
| T3 node-t3-cave-02 / weapon-alt slinger / hp-trim | 11.7/14.2 | 0.3 | 0 | 16 | 46 | 0/0 | 0 |
| T3 node-t3-cave-02 / weapon-alt slinger / plating | 10.1/10.4 | 0.1 | 0 | 16 | 50 | 0/0 | 0 |
| T3 node-t3-cave-02 / weapon-alt slinger / dr | 8.9/9 | 0.1 | 0 | 16 | 41 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline conduit / reference | 9.3/12 | 4.4 | 97214 | 16 | 48 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline conduit / hp-trim | 10.6/10.9 | 0.3 | 91572 | 16 | 50 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline conduit / plating | 10.3/13.4 | 0.5 | 55300 | 16 | 27 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline conduit / dr | 11.4/11.9 | 0.5 | 82326 | 16 | 46 | 0/0 | 0 |
| T3 node-t3-cave-02 / weapon-alt conduit / reference | 9.9/10.7 | 0.3 | 92231 | 16 | 47 | 0/0 | 0 |
| T3 node-t3-cave-02 / weapon-alt conduit / hp-trim | 10.3/10.5 | 2.9 | 90548 | 15 | 47 | 0/0 | 0 |
| T3 node-t3-cave-02 / weapon-alt conduit / plating | 5.3/9.6 | 0.2 | 23542 | 16 | 14 | 0/0 | 0 |
| T3 node-t3-cave-02 / weapon-alt conduit / dr | 9.7/9.7 | 0.2 | 81794 | 16 | 42 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline spirit / reference | 8.5/10.6 | 0.7 | 0 | 16 | 84 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline spirit / hp-trim | 10.2/10.9 | 1.4 | 0 | 16 | 89 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline spirit / plating | 9.9/10.2 | 0.4 | 0 | 16 | 86 | 0/0 | 0 |
| T3 node-t3-cave-02 / baseline spirit / dr | 8.5/10.6 | 0.7 | 0 | 16 | 84 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline striker / reference | 10.3/12 | 1.5 | 0 | 24 | 67 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline striker / hp-trim | 16.3/19.9 | 0.4 | 0 | 23 | 76 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline striker / plating | 12.4/12.5 | 0.5 | 0 | 24 | 66 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline striker / dr | 10.3/12 | 0.4 | 0 | 23 | 68 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline squire / reference | 13.4/17.2 | 1.2 | 0 | 24 | 53 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline squire / hp-trim | 12.9/17.3 | 0.7 | 0 | 24 | 55 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline squire / plating | 16.8/29.1 | 1 | 0 | 24 | 47 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline squire / dr | 13.4/17.2 | 1.2 | 0 | 24 | 53 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline apprentice / reference | 13.3/14.9 | 0.2 | 0 | 24 | 66 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline apprentice / hp-trim | 14.2/15.5 | 0.7 | 0 | 24 | 60 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline apprentice / plating | 15.6/15.6 | 0.4 | 0 | 24 | 60 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline apprentice / dr | 11.6/14.1 | 0.3 | 0 | 24 | 69 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline slinger / reference | 12.7/14.5 | 0.6 | 0 | 24 | 69 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline slinger / hp-trim | 16.6/34 | 0.6 | 0 | 23 | 71 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline slinger / plating | 11.9/13.3 | 0.9 | 0 | 24 | 73 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline slinger / dr | 12.7/14.5 | 0.6 | 0 | 24 | 69 | 0/0 | 0 |
| T3 node-t3-mountain-04 / weapon-alt slinger / reference | 9.8/14.1 | 0.3 | 0 | 24 | 45 | 0/0 | 0 |
| T3 node-t3-mountain-04 / weapon-alt slinger / hp-trim | 9.8/10.4 | 0.4 | 0 | 24 | 55 | 0/0 | 0 |
| T3 node-t3-mountain-04 / weapon-alt slinger / plating | 9.8/14.1 | 0.4 | 0 | 24 | 48 | 0/0 | 0 |
| T3 node-t3-mountain-04 / weapon-alt slinger / dr | 9.8/14.1 | 0.4 | 0 | 24 | 48 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline conduit / reference | 11.7/19 | 0.1 | 88908 | 24 | 52 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline conduit / hp-trim | 17.5/18.5 | 0.2 | 82088 | 24 | 54 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline conduit / plating | 10.4/13.3 | 0.2 | 37574 | 24 | 20 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline conduit / dr | 11.7/15.9 | 0.2 | 71223 | 24 | 51 | 0/0 | 0 |
| T3 node-t3-mountain-04 / weapon-alt conduit / reference | 15.3/19.7 | 0.1 | 83116 | 24 | 46 | 0/0 | 0 |
| T3 node-t3-mountain-04 / weapon-alt conduit / hp-trim | 12.4/24.9 | 0.2 | 79046 | 24 | 54 | 0/0 | 0 |
| T3 node-t3-mountain-04 / weapon-alt conduit / plating | 1.6/7.6 | 0.1 | 8862 | 24 | 5 | 0/0 | 0 |
| T3 node-t3-mountain-04 / weapon-alt conduit / dr | 14.1/17.1 | 0.4 | 72248 | 24 | 54 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline spirit / reference | 11/16.8 | 0.4 | 0 | 23 | 79 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline spirit / hp-trim | 15.1/121.2 | 1.8 | 0 | 24 | 76 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline spirit / plating | 9.7/13 | 0.8 | 0 | 24 | 84 | 0/0 | 0 |
| T3 node-t3-mountain-04 / baseline spirit / dr | 11/16.8 | 0.4 | 0 | 23 | 79 | 0/0 | 0 |

Aggregate diagnostics:
- No observation had zero outgoing damage and no observation reported static-damage contacts.
- Owned-summon outgoing damage was 1,949,986 HP+absorbed across the batch, all from the `Consort / minion` source (113,435 positive events). It is retained as outgoing damage rather than dropped from the inactivity audit.
- The log contained 8,988 target kill events, and all 8,988 shared an `atMs` with a positive outgoing damage event. This is the expected same-timestamp server causality check, not evidence that the bot was inactive.
- Natural episodes include repopulation and late joiners; pressure rows show late-joiner totals and maximum episode membership. They are not authored-pack clear measurements. Repeated seeds can diverge after the initial state.
- Granite Barrier absorption and HP-scaled wards are left in the pressure metrics as treatment consequences. No ward change is inferred from the plating outliers.

## Exit recommendation

This batch is evidence for a constrained next decision, not a release decision:

1. Keep the HP-trim+DR identity as the leading experimental defense profile. It returns baseline named TTK close to reference while retaining class differences and does not create a repeated 4x class advantage.
2. Do not promote flat plating as the default defense identity. The T3 Cave and Mountain Conduit results are large, sparse interaction outliers and need a separately designed mechanic audit if they are important; do not add DoT resistance based on this run.
3. Do not ship an Eagle attack reduction from this evidence. If pressure remains a concern, run a later multiplier-only Stone Eagle comparison that holds ordinary attack at 75 and changes only Skyfall Rend’s 1.75x multiplier.
4. Do not interpret the companion-arm death counts as a monotonic pressure ranking. Thrower-soft had more deaths than reference, while Both-soft had none; the target/episode paths and coupled attack changes make that insufficient for a live pressure edit.
5. Keep Cave Slam/Sweep, boss TTK, other biomes, hazards/retargeting, and economy validation separate. No live/browser evidence was collected.

## Artifact links

- [Generated analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/analysis.md>)
- [Generated analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/analysis.json>)
- [Run manifest](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/manifest.json>)
- [Run index](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/index.json>)
- [Completion marker](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability3-20260915/results/complete.json>)
- [Durability 3 operator packet](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability3-operator-packet.md>)

All source and live-play boundaries above are intentional. No economy state, build definition, balance parameter, or runtime logic was changed by this experiment.
