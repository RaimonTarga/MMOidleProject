# Night 2 packet D operator report

Packet D ran the four authorized Squire cases in ABBA order on one worker:
Mountain, Plains, Plains, Mountain. Three cases completed the prepared T2
Plains screen and one Plains case stopped at its first ordinary gameplay death.
The remaining declared case continued as authorized. No retries or fifth case
were started.

## Frozen execution

- Manifest: `20260913t233030z-squire-plains-mountain-armor-t`
- Revision/tree: `04f1e041c0b689d0a44a874c233e3d2dc6af734f` /
  `a75dd27863a9c58c8cfcf8d147bd57e1fa3499a0`
- Image: `sha256:5bdfe0eea9c89ec961d46eeb794f8f37e87626b180cd05afd16e04feabb30751`
- Mode: `smoke-isolated`, reward multiplier 25, one worker, `count=2` per
  study arm, `maxRunMs=1500000`, automatic retries 0, fast boss retry false.
- Original Squire snapshot SHA: `f7f6a884f4f03798ee5c1019a3f49a6e18ecd4fb82f6bc357d00642f9b44d344`.
- Actual setup start: `2026-09-13T23:27:32.326Z`; packet deadline
  `2026-09-14T01:57:32.326Z`. All cases finished by `00:21:27.576Z`.
- Exact checkout install and `pnpm bot:preflight` passed before creation.
- Study SHA on checkout: `fa4f6e761de4454bcd2ebaf5e1e378d11f107f5f81f3a90d3c6c179db0220c5f`;
  normalized study bytes matched the supplied study (checkout line-ending
  representation differs).

Manifest and release hashes:

| Filename | SHA-256 |
|---|---|
| `experiment.json` | `ea37b50d0fecf8bb1680cb943b2d6324b5339845cef89eddcbaaeedd738aad73` |
| `experiment.sha256` | `a35d6bc52e79ee46b2f3fd73c119d8b0c99f421d4b7143e412001c1e18afc336` |
| `cohort-summary.json` | `888cb4089393efa3d8e36d8cdeec9667a4245ceb437ee6c4f7350429f5ea4f92` |
| `network-release.json` | `0de06ed435108605f635228ae2890203c24839776d0a8566eb5e8dcb4bb76b5d` |

## Case results

All cases used Quake Hammer +5, Plains charm +5, Plains boots +5, the arm's
T2 armor +5, Core Tempered, Sweep, Second Wind, Brace, defensive stance, and
the fixed 25 RP rune package. Readiness markers were emitted at the matching
arm. No resource stalls occurred.

| Case | Result | Duration | Boss attempt / boss combat | Final snapshot |
|---|---|---:|---:|---|
| `001-mountain-r1` | completed; Plains:2 clear | 726,190 ms | 333,258 ms / 79,059 ms | `runs/001-mountain-r1/artifacts/squire-plains-mountain-armor-t2-night2-intended-2026-09-13T23-32-24-667Z-8f30d61c/snapshot-b.json`, SHA `54f3c5fb0f719872726507c0621db8a879bfde3a3aa31e46031594e22c527a37` |
| `002-plains-r1` | completed; Plains:2 clear | 752,213 ms | 345,759 ms / 81,550 ms | `runs/002-plains-r1/artifacts/squire-plains-plains-armor-t2-night2-intended-2026-09-13T23-44-49-614Z-f95a2eff/snapshot-b.json`, SHA `7fe6871111c81648f2289683df0a8889e7469969bc595831750e40ada06306d4` |
| `003-plains-r2` | first-death stop | 678,634 ms | no victory | no final snapshot |
| `004-mountain-r2` | completed; Plains:2 clear | 730,693 ms | 323,723 ms / 71,545 ms | `runs/004-mountain-r2/artifacts/squire-plains-mountain-armor-t2-night2-intended-2026-09-14T00-09-16-815Z-942f5e84/snapshot-b.json`, SHA `f08cd309b90fd7d24b414eb1ae4f3656aba042adf363d317d90ecc9c3a51657b` |

The three completed snapshots record T2, current skill tier 2, global mastery
72, no range selection or skill points, cooldown-root/cooldown-heavy, the
appropriate +5 armor, Quake Hammer +5, Plains charm/boots +5, defensive stance,
and full HP/no DoT at the cleared dungeon handoff. They are synthetic,
noncanonical reward-25 artifacts and are not economy evidence.

For completed cases, whole-run ability activations were Mountain r1
Sweep 26 / Second Wind 7 / Brace 5, Plains r1 26 / 8 / 6, and Mountain r2
23 / 6 / 6. These run-wide counts are separate from the boss-only windows
above. The failed Plains r2 case recorded Sweep 19 / Second Wind 3 / Brace 3
before its stop.

Case `003-plains-r2` died at 678,632 ms in `node-t2-plains-dungeon` during the
Plains boss attempt. The authoritative cause is a 47-damage melee hit from
Gorging Razortusk (the boss); its stale-window `killingBlow` field shows a
1-damage Field Hare hit at 678,467 ms. The largest hit was the same Razortusk
47 damage at 664,459 ms, the dominant source in the death window was Gorging
Razortusk at 244 damage, and max concurrent attackers was 11. These named
telemetry fields are reported separately from duplicated concurrent snapshots;
unchanged-HP recovery/absorb records are not treated as effective healing.

Per-case artifact hashes (each hash is paired with its filename):

- `001-mountain-r1`: `summary.json` `7d42f31fcf2e23493d72ee7d8e31a022418bae13db1f0d6171600bc625c2e0cd`; `events.jsonl` `cf9a454b71b52dc525f66f7b426ece389797507d688d0fc82c36c70d3ffb0f2d`; `deaths.jsonl` `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; `snapshot-index.json` `5fcdb2bb5a21eaa1cf345948ec1029865ec3293fff806529f61d298339e981a5`.
- `002-plains-r1`: `summary.json` `36874088f5b2af70e9f632bab6d7100a8097aa9f9a921474b3c9f405c949f05a`; `events.jsonl` `8672e23afd191c7279370b7fcec53255e21cdf38d050ab8256b0227b0c0883ee`; `deaths.jsonl` `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; `snapshot-index.json` `8e3c973f62256f21ceddb99d98830ff3f183173e22a3fc98289661a31cce7b7e`.
- `003-plains-r2`: `summary.json` `4f5a2239e2f741a868a35a01df7f14a517107aa0f45c6d195fa9308e0192c32a`; `events.jsonl` `6966e86bbf934f1aca6b292e947a8229c81e0af875afbad9677ff429680416a7`; `deaths.jsonl` `a1202fccaf72723f7d0588fabba311a9f304e3ce44b3df21f84bd0c71df1a437`; `snapshot-index.json` `4c5ba7b1236fc6f8959d13138480003b9755ccc813bc7a4947c75aa713db7c2d`.
- `004-mountain-r2`: `summary.json` `9cd13e0c0ff01cc2de2ec3b3dd9cd87f2c523ab8a6dee66e7f6a133f1d7f03f4`; `events.jsonl` `92b6e532ef90a24d0bac2d262be908ded881b7b38976ff71872666fe2bc55f38`; `deaths.jsonl` `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; `snapshot-index.json` `6e44d804bfc1b436c39c0f02ec86ffb7c2ff0c76e253fd25d3a3a8b0e77470d3`.

The terminal release receipt reports `released` and retains the two service
containers and their volumes. `docker network inspect
mmoexp-9420da0ac083-network` returned not found after release. No source,
template, balance, or unrelated v1g/human log files were changed. This was the
fourth and final packet; no downstream work was started.

## Astra verification and interpretation

Independently checked four manifest/receipt files and19 per-case artifacts.
The receipt hash had an extra character and failed-case summary hash lacked
its final character in the original report; corrected above without changing
any artifact. Receipt time00:21:40.528Z. All three final snapshots have the
Plains:2 seal and incomingDoT0; Mountain317/317HP, Plains281/281HP.

| Case | Boss-only start–end ms | Sweep / Second Wind / Brace inside window |
|---|---|---|
| Mountain r1 | 625611–704670 | 13 / 6 / 4 |
| Plains r1 | 649137–730687 | 13 / 7 / 6 |
| Mountain r2 | 637623–709168 | 11 / 6 / 6 |

Plains r2 has no terminal boss-attempt result because first-death abort fired.
Guardian clear was629634ms, death678632ms; the interval between those events
contains7 Sweep,3 Second Wind,3 Brace. Do not call that interval an exact
boss combat duration or invent the missing final boss HP fraction.

The observed final Mountain build has317maxHP/30plating; Plains has281maxHP/
40plating. Both have109attack,13recovery,7%DR and12attack range. Mountain also
has its authored Guard-potency advantage; activation counts do not attribute
effective healing or mitigation to it. Plains2 lost despite more plating,
with11 attackers and a boss lethal hit. The result confirms this Squire
package can defeat Plains and supports keeping Mountain armor as a candidate;
2/2 versus1/2 is not a reliable armor ranking or proof of the responsible
passive. This melee execution build's71.5–81.6s winning boss windows should
not be causally compared with Spirit's independently prepared runs.

Artifact root:
`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260913t233030z-squire-plains-mountain-armor-t`
