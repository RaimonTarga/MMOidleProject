# Durability 10 report — missing Bear, Swamp durability and Jungle exposure

Status: **complete frozen synthetic benchmark; no live balance change**. The
operator ran the three fixed blocks once, in the packet order A → B → C:
108 configurations and 324 observations. Every runner, reporter, and
field-level verifier completed successfully with exit 0. There were no
failed observations, retries, restarts, adaptive changes, source edits, or
automatic winners.

This report is diagnostic combat evidence only. It does not certify economy,
acquisition, travel, client presentation, human feel, browser play, or live
balance.

## Decision summary

- **Bear:** The fixed 3,750-HP / 0.08-shield Bear produced six-baseline
  centers of 17.38s and 14.13–14.15s on Tundra 03/05. Reducing Bear attack
  from 185 to 148 produced effectively no six-class center movement
  (17.38s → 17.38s and 14.13s → 14.15s). Keep the fixed-HP/shell result in
  review; do not auto-adopt the attack reduction. The nine player deaths
  were concentrated in full-attack Apprentice and the Slinger weapon
  alternative, so this does not isolate a global Bear attack problem.
- **Snapper:** Increasing Plague-Shell Snapper HP from 1,160 to 1,740 to
  2,320 moved the six-class center from 7.63s → 9.53s → 12.10s in Swamp 03
  and 8.35s → 11.05s → 13.20s in Swamp 05. There were zero player deaths
  across all 108 observations and no low-HP wall. Carry 2,320 as the
  upper-bound candidate for a later long-body review, with 1,740 as the
  conservative alternative; neither is a live patch recommendation.
- **Jungle:** Defensive stance increased T3 Silverback centers by 3.30s in
  Jungle 03 and 3.65s in Jungle 05, but it did not remove the T3 Jungle 03
  death/pressure tail. The 25% ramp cap changed centers only
  10.70s → 9.95s in Jungle 03 and 8.45s → 8.45s in Jungle 05. Keep stance
  and ramp as separate diagnostic arms. T2 Squire had no ramp arm and must
  not be attributed to Silverback tuning.
- **Minion evidence:** New Jungle samples recorded slot state, minion HP,
  position, target, and last-attack timestamps for Conduit. They show sampled
  slot loss/recovery and target delivery, but one-second samples can miss
  brief states. The original Bear runtime did not have these fields.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-durability10-operator-packet.md](bot-balance-durability10-operator-packet.md) |
| New runtime for B/C | 6d8f97fc2f4a70a329b471cf5d16468c456bc277 |
| New source tree for B/C | 3fb3a87ad96ede9ec2a45f4f9df41ae1bf5447a6 |
| Original Bear runtime for A | 02758290bc40042d0f65618e465ecb5e0b78d09d |
| Original Bear source tree for A | 3e5c4e11b39549289fae8843b911d44e1ad9417a |
| Definitions SHA-256 | 9DB8E38909CB8EC1B60FAAC20CDB412FF798498EBEEE4C5D05F6FBD70A9F8AED |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitbox SHA-256 | 08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83 |
| Original Bear checkout | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/source |
| New B/C checkout | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/source |
| Qualification root | C:/Users/osaif/AppData/Local/mmo-idle/validation/durability10 |
| Results root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916 |
| Mode / timestep / window | run / 100ms / 300s per observation |
| Seeds | 173, 947, 2027 |
| Synthetic / economy eligible | true / false |

The packet’s sequential loop used the original Durability 9 checkout only for
durability9bear and the detached Durability 10 checkout for the Swamp and
Jungle blocks. Each block was reported and then verified before the next
block. The operator ledger is retained at
[operator-ledger.jsonl](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/operator-ledger.jsonl>).

| Block | Trial | Planned | Executed | Wall time | Observation outcome |
|---|---|---:|---:|---:|---|
| A | durability9bear | 32 cells / 96 runs | 32 / 96 | 4m50.345s | 87 windows, 9 player deaths, 0 failed |
| B | durability10swamp | 36 cells / 108 runs | 36 / 108 | 12m32.076s | 108 windows, 0 deaths, 0 failed |
| C | durability10jungle | 40 cells / 120 runs | 40 / 120 | 11m05.133s | 115 windows, 5 player deaths, 0 failed |
| **Total** |  | **108 / 324** | **108 / 324** | **28m27.554s** | **310 windows, 14 deaths, 0 failed** |

Each result root contains one run directory per observation plus the six root
artifacts. A has 390 files / 147,981,992 bytes, B has 438 files /
150,567,825 bytes, and C has 486 files / 219,217,087 bytes. No failed.json
exists in any block.

### Artifact hashes

| Block | Artifact | SHA-256 |
|---|---|---|
| A | [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability9bear/manifest.json>) | A02E549310941E112F80EFD7A70A701788B774FE2FE24759F233CDB64A86E519 |
| A | [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability9bear/index.json>) | DAD6373DBF567E43D167C45FBB4B54FE33FD334D060E1C8DE7B02DC40EF18D24 |
| A | [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability9bear/complete.json>) | 0E440BD153BC109BDE21945CEA7573D4AFB2FB0DFE2A234E6D5AA25DAA8706AE |
| A | [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability9bear/analysis.json>) | 1A99FCEAD6D148CCBF9ADFD1913D127ECBE791BB9861F5EA9DA20F400D42901F |
| A | [analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability9bear/analysis.md>) | B3B4BE0EAD4726E837EFCE49F16D1AF54F3F0F9DD7B7960F21EB5860C2DCE2FA |
| A | [verification.log](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability9bear/verification.log>) | 04B29039C38A2C3939CDD425E981F078C51C678F86A59125045E4D3D26DF90C7 |
| B | [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10swamp/manifest.json>) | C0B43309383B502B6B8705B314C6D427A4AA370E3D24069CC3245D2E8C7C4225 |
| B | [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10swamp/index.json>) | 5617D6A49086701268CA2B67187A836BA9688398D3E1F37925593A1D28621A84 |
| B | [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10swamp/complete.json>) | B6EEBC32F28CEF338564EFFD2D67075C426CFC21AD5658999EEC5A6A17B86E00 |
| B | [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10swamp/analysis.json>) | 4BF6698049471DFC7F1676EB4F723CC2E5086A7550AF316F8593D2201D656339 |
| B | [analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10swamp/analysis.md>) | B333DAB59DDD4A556322EDDB8D288BC1DE35E62EDB2C74613413CFACDC22B6D2 |
| B | [verification.log](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10swamp/verification.log>) | C5F9DE9794F0D1260D1CD22AFCB9E3185224A48259C7CD658DEB55C6D682C4BE |
| C | [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10jungle/manifest.json>) | 410D1A395FEC3C4C55F2481311FD01757423693EDB4AAEEFC9A9BDBA261D34BF |
| C | [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10jungle/index.json>) | D7F8F69C6D31772A86DF688437E1B338FB1BDD6421FF2A9B6C05A67A7E0F8A25 |
| C | [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10jungle/complete.json>) | CF5BE55B89E6E3BEDE136BE34D356E397E45F0E378AACD52E9DC5C5A8D2B3DF7 |
| C | [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10jungle/analysis.json>) | 0522152BDD2A6DDBFAEE781B5FF3A10492902DA7576968AF30FAFCBD962624A9 |
| C | [analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10jungle/analysis.md>) | 67BB75A46F8C430D0A41191EE20A68D3211067FF639957822423FC9359AA24E8 |
| C | [verification.log](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10jungle/verification.log>) | CCFD3B1A3DE6EFDAF1537602D3A0C345BF9C7AD647E25AF2FE6E16B20AD70D4B |

## Qualification and arm isolation

The qualification receipts were not rerun. All 76 new configurations passed
the frozen qualification and pilot/report checks; the original 32-cell Bear
qualification was reverified. Qualification index hashes are:

| Trial | Qualification index SHA-256 |
|---|---|
| durability9bear | 0C6033E22960A28D3DB5A7993C7D167D0B1530FA30580369CCD8CE4549DED116 |
| durability10swamp | 0D4C623AC375DE9710F6DF419BD2D38C172484F27D1BE114980D59001A4A9F11 |
| durability10jungle | 1717081336B64FE8BC30935AEF2FA05BD32152B8F30D57ADE9788BAFD178EDE8 |

The actual READY overlays were:

| Block / arm | READY-state treatment |
|---|---|
| A Bear full / soft | Glacier Bear HP 1,500 → 3,750; shield 0.20 → 0.08; attack 185 → 185 / 148. Cadence, duration, shatter, and vulnerability fields were unchanged. |
| B Snapper control / HP1.5 / HP2 | Plague-Shell Snapper HP 1,160 → 1,160 / 1,740 / 2,320; attack 37 unchanged. Shell, plating, pool, poison, and support bodies were unchanged; no DoT resistance was added. |
| C T2 Squire control / defensive | Jungle Ape HP 1,200 and attack 33 unchanged; only offensive stance → defensive stance. There was no T2 ramp arm. |
| C T3 control / defensive / ramp25 | Silverback HP 2,090 and base attack 83 unchanged; control and defensive cap 0.45, ramp25 cap 0.25; defensive changed only stance. The 3%/s ramp rate and initial attack were unchanged. |

The build/geometry audit grouped by node, class, seed, and alternate arm:

| Block | Matched groups | Build mismatches | Geometry mismatches | Missing groups |
|---|---:|---:|---:|---:|
| A | 48 | 0 | 0 | 0 |
| B | 36 | 0 | 0 | 0 |
| C | 42 | 0 | 0 | 0 |

Only the packet-declared Bear attack/shield arm, Snapper HP arm, Jungle
stance, and Silverback ramp cap differed. All equipment, skills, abilities,
support roster, and geometry matched their paired controls.

## Metric definition and data accounting

For every named target, the report first took each seed’s median of eligible
raw target TTK values, then took the median of the available seed medians.
Eligibility required clean=true, a killedAtMs value, finite ttkMs, and
hpRegainObserved not true. Missing seed medians are shown as an em dash and
are never treated as zero. Six-class centers use only the six
alternate=false classes. TTK is post-first-damage body time; it does not
include pre-hit charging.

The tables below use seed order 173 / 947 / 2027 → outer median in seconds.
The n column is eligible clean target records / all named-target records;
u/r/d means unfinished records / HP-regain exclusions / player-death runs.
Named-target records exceed observation counts because fresh 300-second Worlds
contain repeated natural ecology.

| Block | Named target | Target records | Eligible clean | Unfinished | Regained | Player deaths |
|---|---|---:|---:|---:|---:|---:|
| A | Glacier Bear | 630 | 587 | 41 | 5 | 9 |
| B | Plague-Shell Snapper | 1,308 | 1,268 | 35 | 5 | 0 |
| C | Jungle Ape / Silverback | 958 | 884 | 57 | 35 | 5 |

## Block A — original Bear runtime

Bear HP and shield were held fixed while attack was 185 in bear-full and 148
in bear-soft. The Slinger weapon alternative and Conduit on-hit alternative
are shown separately and are not included in six-baseline centers.

| Node | Class / arm | Seed medians → outer | n | u / r / d |
|---|---|---:|---:|---:|
| Tundra 03 | Striker full | 12.50 / 12.40 / 12.40 → 12.40 | 20/21 | 1 / 0 / 0 |
| Tundra 03 | Squire full | 20.35 / 21.00 / 19.50 → 20.35 | 15/17 | 2 / 0 / 0 |
| Tundra 03 | Apprentice full | 18.00 / 18.00 / 18.00 → 18.00 | 12/15 | 3 / 0 / 2 |
| Tundra 03 | Slinger full | 16.75 / 17.00 / 16.70 → 16.75 | 18/19 | 1 / 0 / 0 |
| Tundra 03 | Conduit full | 19.45 / 19.40 / 19.65 → 19.45 | 16/17 | 1 / 0 / 0 |
| Tundra 03 | Spirit full | 14.40 / 14.30 / 14.30 → 14.30 | 24/24 | 0 / 0 / 0 |
| Tundra 03 | Striker soft | 12.40 / 12.20 / 12.40 → 12.40 | 17/18 | 1 / 0 / 0 |
| Tundra 03 | Squire soft | 19.30 / 21.10 / 19.55 → 19.55 | 16/17 | 1 / 0 / 0 |
| Tundra 03 | Apprentice soft | 18.00 / 17.40 / 18.00 → 18.00 | 19/23 | 3 / 2 / 0 |
| Tundra 03 | Slinger soft | 16.60 / 17.05 / 16.75 → 16.75 | 20/22 | 2 / 1 / 0 |
| Tundra 03 | Conduit soft | 19.45 / 19.40 / 19.65 → 19.45 | 16/17 | 1 / 0 / 0 |
| Tundra 03 | Spirit soft | 14.45 / 14.40 / 14.25 → 14.40 | 24/26 | 2 / 0 / 0 |
| Tundra 03 | Slinger DoT alternative full | 42.00 / 42.00 / — → 42.00 | 2/5 | 3 / 0 / 3 |
| Tundra 03 | Slinger DoT alternative soft | 42.00 / 42.90 / 42.00 → 42.00 | 6/9 | 3 / 0 / 3 |
| Tundra 03 | Conduit on-hit alternative full | 22.20 / 22.20 / 22.30 → 22.20 | 16/16 | 0 / 0 / 0 |
| Tundra 03 | Conduit on-hit alternative soft | 22.20 / 22.20 / 22.30 → 22.20 | 16/16 | 0 / 0 / 0 |
| Tundra 05 | Striker full | 11.10 / 11.00 / 11.00 → 11.00 | 24/24 | 0 / 0 / 0 |
| Tundra 05 | Squire full | 17.30 / 17.00 / 17.40 → 17.30 | 20/22 | 2 / 0 / 0 |
| Tundra 05 | Apprentice full | 15.00 / 15.00 / 15.00 → 15.00 | 18/21 | 3 / 0 / 0 |
| Tundra 05 | Slinger full | 13.20 / 13.25 / 13.40 → 13.25 | 27/27 | 0 / 0 / 0 |
| Tundra 05 | Conduit full | 17.10 / 17.00 / 17.00 → 17.00 | 16/17 | 1 / 0 / 0 |
| Tundra 05 | Spirit full | 12.30 / 11.90 / 12.30 → 12.30 | 28/29 | 1 / 0 / 0 |
| Tundra 05 | Striker soft | 10.80 / 11.00 / 11.00 → 11.00 | 26/26 | 0 / 0 / 0 |
| Tundra 05 | Squire soft | 17.25 / 17.15 / 17.30 → 17.25 | 25/25 | 0 / 0 / 0 |
| Tundra 05 | Apprentice soft | 15.00 / 15.00 / 15.00 → 15.00 | 18/21 | 2 / 1 / 0 |
| Tundra 05 | Slinger soft | 13.35 / 12.80 / 13.30 → 13.30 | 24/25 | 1 / 0 / 0 |
| Tundra 05 | Conduit soft | 17.10 / 17.00 / 17.00 → 17.00 | 16/17 | 1 / 0 / 0 |
| Tundra 05 | Spirit soft | 12.30 / 12.10 / 12.30 → 12.30 | 27/28 | 1 / 0 / 0 |
| Tundra 05 | Slinger DoT alternative full | 26.00 / 27.00 / 27.70 → 27.00 | 15/17 | 2 / 1 / 0 |
| Tundra 05 | Slinger DoT alternative soft | 27.00 / 26.85 / 27.00 → 27.00 | 12/13 | 1 / 0 / 1 |
| Tundra 05 | Conduit on-hit alternative full | 16.90 / 16.80 / 17.00 → 16.90 | 17/18 | 1 / 0 / 0 |
| Tundra 05 | Conduit on-hit alternative soft | 16.90 / 16.80 / 17.00 → 16.90 | 17/18 | 1 / 0 / 0 |

### Bear six-baseline centers

| Node / arm | Six class values: Striker / Squire / Apprentice / Slinger / Conduit / Spirit | Center | Range |
|---|---|---:|---:|
| Tundra 03 full | 12.40 / 20.35 / 18.00 / 16.75 / 19.45 / 14.30 | 17.38 | 12.40–20.35 |
| Tundra 03 soft | 12.40 / 19.55 / 18.00 / 16.75 / 19.45 / 14.40 | 17.38 | 12.40–19.55 |
| Tundra 05 full | 11.00 / 17.30 / 15.00 / 13.25 / 17.00 / 12.30 | 14.13 | 11.00–17.30 |
| Tundra 05 soft | 11.00 / 17.25 / 15.00 / 13.30 / 17.00 / 12.30 | 14.15 | 11.00–17.25 |

The attack relief therefore did not move the six-class body-duration center.
It also did not remove the weapon-alternative death tail: Tundra 03 had
three Slinger-alternative deaths in each arm, and Tundra 05 had one
Slinger-alternative death in soft. The original runtime contains no new
minion slot/HP/target snapshots, so no minion-delivery claim is made for A.

## Block B — T3 Swamp Snapper HP bracket

All 108 observations retained the same support roster and attack/plating/
shell/pool/poison configuration. The six-class table keeps direct, DoT, and
Conduit minion damage in their actual class arms rather than pooling them.

| Node / HP arm | Striker | Squire | Apprentice | Slinger | Conduit | Spirit | Six-class center / range |
|---|---|---|---|---|---|---|---|
| Swamp 03 control | 7.90 / 8.10 / 7.95 → 7.95; n33/33; u0/r0/d0 | 7.30 / 7.35 / 7.30 → 7.30; n45/45; u0/r0/d0 | 6.80 / 6.00 / 6.80 → 6.80; n42/42; u0/r0/d0 | 8.15 / 8.10 / 8.25 → 8.15; n48/48; u0/r0/d0 | 9.10 / 9.70 / 9.70 → 9.70; n40/42; u2/r0/d0 | 6.90 / 6.80 / 6.60 → 6.80; n43/44; u1/r0/d0 | 7.63 / 6.80–9.70 |
| Swamp 03 HP1.5 | 9.70 / 9.50 / 9.60 → 9.60; n40/40; u0/r0/d0 | 9.10 / 9.45 / 10.10 → 9.45; n32/33; u1/r0/d0 | 9.05 / 9.45 / 9.50 → 9.45; n43/43; u0/r0/d0 | 10.00 / 9.70 / 10.00 → 10.00; n40/42; u2/r0/d0 | 13.00 / 13.10 / 12.90 → 13.00; n32/35; u3/r0/d0 | 8.90 / 8.20 / 8.40 → 8.40; n46/48; u1/r1/d0 | 9.53 / 8.40–13.00 |
| Swamp 03 HP2 | 11.55 / 11.60 / 11.80 → 11.60; n14/14; u0/r0/d0 | 12.80 / 12.50 / 12.40 → 12.50; n33/34; u1/r0/d0 | 11.95 / 11.90 / 11.70 → 11.90; n33/36; u2/r1/d0 | 12.55 / 12.30 / 12.10 → 12.30; n33/35; u2/r0/d0 | 16.80 / 16.80 / 16.90 → 16.80; n29/30; u1/r0/d0 | 10.20 / 10.30 / 9.80 → 10.20; n41/44; u2/r1/d0 | 12.10 / 10.20–16.80 |
| Swamp 05 control | — / 8.80 / 8.70 → 8.75; n21/21; u0/r0/d0 | 8.20 / 7.75 / 8.70 → 8.20; n21/21; u0/r0/d0 | 7.50 / 7.50 / 7.50 → 7.50; n46/47; u1/r0/d0 | 8.80 / 8.40 / 8.50 → 8.50; n43/44; u1/r0/d0 | 11.45 / 11.20 / 11.20 → 11.20; n37/39; u2/r0/d0 | 7.45 / 6.80 / 7.15 → 7.15; n53/54; u1/r0/d0 | 8.35 / 7.15–11.20 |
| Swamp 05 HP1.5 | — / 11.10 / 11.10 → 11.10; n20/21; u1/r0/d0 | 11.00 / 11.00 / 11.05 → 11.00; n36/37; u1/r0/d0 | 10.50 / 10.50 / 10.50 → 10.50; n37/38; u1/r0/d0 | 10.70 / 11.30 / 11.50 → 11.30; n35/36; u1/r0/d0 | 15.85 / 15.90 / 15.85 → 15.85; n29/32; u2/r1/d0 | 9.60 / 9.30 / 9.10 → 9.30; n45/46; u0/r1/d0 | 11.05 / 9.30–15.85 |
| Swamp 05 HP2 | — / 12.55 / 12.20 → 12.38; n16/17; u1/r0/d0 | 14.75 / 14.75 / 16.30 → 14.75; n25/26; u1/r0/d0 | 12.70 / 12.60 / 12.60 → 12.60; n32/33; u1/r0/d0 | 13.50 / 14.00 / 13.80 → 13.80; n37/38; u1/r0/d0 | 19.80 / 19.55 / 19.90 → 19.80; n26/28; u2/r0/d0 | 11.10 / 11.10 / 11.00 → 11.10; n42/42; u0/r0/d0 | 13.20 / 11.10–19.80 |

The target-event audit over both Swamp nodes and all HP arms found
2,053,436 HP damage typed direct, 254,731 typed dot, and 8,082 typed aoe.
The DoT total came from Apprentice; Slinger remained a direct-damage tail,
and Conduit’s target damage was primarily minion/direct damage. This is a
damage-type audit, not a resistance inference.

Every HP arm had one median Snapper cast and one median cast fire per named
target. Median damage-event counts increased as HP rose (Swamp 03:
9 → 13 → 17; Swamp 05: 11 → 15 → 19), while median maximum damage gaps
remained about 1.5–2.0s. Sampled player minimums stayed well above a death
wall: across B, p10/p50/p90 were 83.44% / 90.77% / 96.65%, with a minimum
of 66.52%, and no observation died. The higher HP arms expose more existing
damage time but do not show a new poison/overlap attrition failure or a
disproportionate direct-class survival collapse.

## Block C — Jungle stance and Silverback ramp

### T2 Squire stance arm

| Node / arm | Seed medians → outer | n | u / r / d |
|---|---:|---:|---:|
| Jungle 03 control | 11.40 / 11.40 / 11.40 → 11.40 | 22/22 | 0 / 0 / 0 |
| Jungle 03 defensive | 16.80 / 18.90 / 16.80 → 16.80 | 10/10 | 0 / 0 / 0 |
| Jungle 05 control | 9.50 / 9.50 / 9.50 → 9.50 | 15/17 | 2 / 0 / 1 |
| Jungle 05 defensive | 16.80 / 16.80 / 16.80 → 16.80 | 20/21 | 1 / 0 / 0 |

The T2 defensive stance increased the named Ape duration without a defensive
death in this 12-cell screen. The Jungle 05 control death was a
Chameleon/Snake/Ape pressure event, not evidence for a Silverback ramp
adjustment.

### T3 Silverback target medians

Each cell is seed 173 / 947 / 2027 → outer; n is clean/records and the
parenthetical suffix is u/r/d.

| Node | Class | Control | Defensive | Ramp25 |
|---|---|---|---|---|
| Jungle 03 | Striker | 7.10 / 7.00 / 7.00 → 7.00; 18/18 (0/0/0) | 9.80 / 10.00 / 10.00 → 10.00; 8/8 (0/0/0) | 7.10 / 7.00 / 7.00 → 7.00; 18/18 (0/0/0) |
| Jungle 03 | Squire | 11.50 / 12.80 / 12.10 → 12.10; 9/10 (1/0/0) | 16.00 / 16.00 / 15.15 → 16.00; 12/12 (0/0/0) | 11.00 / 11.40 / 11.70 → 11.40; 16/17 (1/0/0) |
| Jungle 03 | Apprentice | 10.50 / 10.50 / 10.50 → 10.50; 16/16 (0/0/0) | 14.40 / 15.00 / 15.00 → 15.00; 17/19 (2/0/1) | 10.50 / 10.50 / 10.50 → 10.50; 11/11 (0/0/0) |
| Jungle 03 | Slinger | 10.90 / 9.40 / 11.00 → 10.90; 32/33 (1/0/0) | 16.00 / 13.00 / 13.00 → 13.00; 16/21 (4/4/0) | 9.40 / 9.40 / 9.40 → 9.40; 31/31 (0/0/0) |
| Jungle 03 | Conduit | — / 31.45 / 27.85 → 29.65; 6/15 (8/5/1) | 37.70 / 34.40 / 36.60 → 36.60; 9/15 (5/2/0) | 29.50 / 28.00 / 27.95 → 28.00; 8/16 (5/4/1) |
| Jungle 03 | Spirit | 7.40 / 7.50 / 7.70 → 7.50; 29/29 (0/0/0) | 12.60 / 12.00 / 11.90 → 12.00; 24/27 (3/0/1) | 7.40 / 7.50 / 7.70 → 7.50; 29/29 (0/0/0) |
| Jungle 05 | Striker | 5.85 / 5.70 / 5.65 → 5.70; 25/25 (0/0/0) | 8.00 / 8.00 / 7.80 → 8.00; 34/36 (2/0/0) | 5.85 / 5.70 / 5.65 → 5.70; 25/25 (0/0/0) |
| Jungle 05 | Squire | 9.60 / 9.60 / 9.60 → 9.60; 34/36 (2/0/0) | 12.80 / 12.80 / 12.70 → 12.80; 23/25 (2/0/0) | 9.60 / 9.60 / 9.60 → 9.60; 33/34 (1/0/0) |
| Jungle 05 | Apprentice | 9.00 / 9.00 / 9.00 → 9.00; 36/38 (2/0/0) | 12.70 / 13.30 / 12.00 → 12.70; 27/28 (1/1/0) | 9.00 / 9.00 / 9.00 → 9.00; 34/34 (0/0/0) |
| Jungle 05 | Slinger | 7.80 / 7.90 / 7.90 → 7.90; 30/31 (0/1/0) | 11.45 / 11.65 / 11.50 → 11.50; 24/26 (1/1/0) | 7.80 / 7.90 / 7.90 → 7.90; 33/33 (0/0/0) |
| Jungle 05 | Conduit | 22.10 / 24.20 / 21.55 → 22.10; 22/29 (6/6/0) | 23.95 / 22.90 / 17.10 → 22.90; 7/16 (4/7/0) | 22.80 / 22.60 / 22.00 → 22.60; 18/21 (2/2/0) |
| Jungle 05 | Spirit | 5.70 / 6.20 / 6.30 → 6.20; 35/35 (0/0/0) | 8.60 / 8.50 / 9.15 → 8.60; 33/36 (1/2/0) | 5.70 / 6.20 / 6.30 → 6.20; 35/35 (0/0/0) |

### T3 six-class centers

| Node / arm | Six class values: Striker / Squire / Apprentice / Slinger / Conduit / Spirit | Center | Range | Deaths |
|---|---|---:|---:|---:|
| Jungle 03 control | 7.00 / 12.10 / 10.50 / 10.90 / 29.65 / 7.50 | 10.70 | 7.00–29.65 | 1 |
| Jungle 03 defensive | 10.00 / 16.00 / 15.00 / 13.00 / 36.60 / 12.00 | 14.00 | 10.00–36.60 | 2 |
| Jungle 03 ramp25 | 7.00 / 11.40 / 10.50 / 9.40 / 28.00 / 7.50 | 9.95 | 7.00–28.00 | 1 |
| Jungle 05 control | 5.70 / 9.60 / 9.00 / 7.90 / 22.10 / 6.20 | 8.45 | 5.70–22.10 | 0 |
| Jungle 05 defensive | 8.00 / 12.80 / 12.70 / 11.50 / 22.90 / 8.60 | 12.10 | 8.00–22.90 | 0 |
| Jungle 05 ramp25 | 5.70 / 9.60 / 9.00 / 7.90 / 22.60 / 6.20 | 8.45 | 5.70–22.60 | 0 |

Defensive stance is a player-available duration increase, but the T3 Jungle
03 death count was two in defensive versus one in control and one in ramp25.
The 25% ramp cap did not produce a broad class benefit: it lowered the
Jungle 03 center by 0.75s, left Jungle 05 unchanged, and still had one
Jungle 03 Conduit death. These are separate arms; no stance/ramp interaction
claim is permitted.

### Conduit minion and slot snapshots

Only Conduit emitted non-empty summon-slot and minion snapshot payloads.
Other classes are not missing observations; the instrumentation is
Conduit-specific in this runtime. Values below are medians over the three
Conduit seeds for each T3 node/arm. Active and targeted are one-second
sample fractions, not event-certified uptime.

| Node / arm | Active slots | Active range | Targeted samples | Avg targeted minions | Sampled dead runs | Median sampled dead IDs | Minion attack beats | Deaths |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| Jungle 03 control | 55% | 0–5 | 66% | 1.58 | 3/3 | 5 | 705 | 1 |
| Jungle 03 defensive | 62% | 0–5 | 67% | 1.66 | 3/3 | 3 | 802 | 0 |
| Jungle 03 ramp25 | 63% | 0–5 | 64% | 1.62 | 3/3 | 6 | 755 | 1 |
| Jungle 05 control | 57% | 0–5 | 66% | 1.48 | 3/3 | 7 | 782 | 0 |
| Jungle 05 defensive | 67% | 0–5 | 65% | 1.65 | 3/3 | 7 | 858 | 0 |
| Jungle 05 ramp25 | 63% | 0–5 | 61% | 1.56 | 3/3 | 6 | 791 | 0 |

The snapshots distinguish some slot loss/recovery and target delivery, but a
brief death and respawn between one-second samples can be invisible. Sampled
dead IDs are not a minion-kill event count. Conduit’s player-only attack-beat
count can be zero; minion and total attack beats plus damage events are the
relevant measures.

## Death, pressure, and recovery

The block-level pressure audit is over the 96/108/120 observations. Attack
beats are cooldown timestamp changes, not guaranteed hits.

| Block | Player deaths | Window-ended | Sampled min HP p10 / p50 / p90 / min | Incoming damage | Player / minion / total attack beats | Recovery windows completed / interrupted |
|---|---:|---:|---|---:|---:|---:|
| A | 9 | 87 | 10.37% / 49.69% / 94.06% / 0% | 300,159.1 | 20,107 / 26,048 / 46,155 | 1,179 / 564 |
| B | 0 | 108 | 83.44% / 90.77% / 96.65% / 66.52% | 83,768.6 | 20,724 / 21,124 / 41,848 | 1,988 / 733 |
| C | 5 | 115 | 26.96% / 66.32% / 88.29% / 0% | 312,501.5 | 24,169 / 13,821 / 37,990 | 1,584 / 411 |

### Death rows

The minimum column is the last nonzero sampled player HP before the recorded
death, with the sample time in parentheses. Recovery is completed windows /
interrupted windows / median completed recovery gap.

| Block / cell / seed | Death time | Minimum sample | Largest hit / max 1s | Incoming | Recovery |
|---|---:|---:|---:|---:|---:|
| A Tundra 03 Apprentice full / 947 | 141.6s | 175.1 HP @ 139s | 144.9 / 290.1 | 3,055.1 | 5 / 2 / 5,600ms |
| A Tundra 03 Apprentice full / 2027 | 95.1s | 129.9 HP @ 92s | 147.6 / 158.7 | 1,513.8 | 4 / 2 / 0ms |
| A Tundra 03 Slinger alternative full / 173 | 113.6s | 25.2 HP @ 35s | 165 / 165 | 3,061.3 | 2 / 1 / 6,000ms |
| A Tundra 03 Slinger alternative full / 947 | 143.2s | 24.2 HP @ 136s | 165 / 165 | 3,518.4 | 1 / 0 / 7,300ms |
| A Tundra 03 Slinger alternative full / 2027 | 114.1s | 39.0 HP @ 105s | 165 / 165 | 1,889.6 | 1 / 4 / 6,600ms |
| A Tundra 03 Slinger alternative soft / 173 | 159.8s | 108.3 HP @ 157s | 146 / 146 | 3,850.0 | 1 / 2 / 7,100ms |
| A Tundra 03 Slinger alternative soft / 947 | 275.7s | 80.1 HP @ 273s | 154 / 287.3 | 5,855.4 | 4 / 2 / 7,500ms |
| A Tundra 03 Slinger alternative soft / 2027 | 152.2s | 64.6 HP @ 151s | 148 / 198 | 2,686.6 | 1 / 4 / 6,600ms |
| A Tundra 05 Slinger alternative soft / 947 | 201.9s | 19.5 HP @ 201s | 154 / 205 | 3,962.5 | 1 / 7 / 0ms |
| C T2 Jungle 05 Squire control / 947 | 224.5s | 24.3 HP @ 224s | 34 / 96 | 1,265.0 | 2 / 0 / 400ms |
| C T3 Jungle 03 Apprentice defensive / 173 | 187.2s | 35.9 HP @ 187s | 91.8 / 147 | 3,586.5 | 8 / 2 / 3,400ms |
| C T3 Jungle 03 Conduit control / 173 | 142.9s | 90.2 HP @ 142s | 110 / 173 | 2,590.0 | 3 / 0 / 700ms |
| C T3 Jungle 03 Conduit ramp25 / 947 | 235.1s | 35.9 HP @ 234s | 111 / 200 | 2,561.0 | 2 / 0 / 1,100ms |
| C T3 Jungle 03 Spirit defensive / 947 | 262.7s | 41.8 HP @ 262s | 99 / 197 | 2,816.0 | 2 / 17 / 6,700ms |

### Death-window source attribution

Values are HP damage by source in ±10s / ±30s around the death. The
Silverback, Stalker, Chameleon, Bear, and caster contributions remain
separate.

| Cell / seed | ±10s sources | ±30s sources |
|---|---|---|
| A Tundra 03 Apprentice full / 947 | Bear 449.1; Rime Caster 286.0 | Bear 601.8; Rime Caster 472.0 |
| A Tundra 03 Apprentice full / 2027 | Bear 627.0 | Bear 1,121.5 |
| A Tundra 03 Slinger alternative full / 173 | Bear 397.0 | Bear 1,023.3 |
| A Tundra 03 Slinger alternative full / 947 | Bear 394.6 | Bear 1,188.7 |
| A Tundra 03 Slinger alternative full / 2027 | Bear 552.6 | Bear 1,181.6 |
| A Tundra 03 Slinger alternative soft / 173 | Bear 327.0 | Bear 981.0 |
| A Tundra 03 Slinger alternative soft / 947 | Bear 327.0; Rime Caster 154.0 | Bear 742.0; Rime Caster 308.0 |
| A Tundra 03 Slinger alternative soft / 2027 | Bear 276.0; Frost Lurker 147.0; Rime Caster 133.0 | Bear 781.0; Frost Lurker 147.0; Rime Caster 133.0 |
| A Tundra 05 Slinger alternative soft / 947 | Rime Caster 610.0; Bear 102.0 | Rime Caster 662.0; Bear 276.9 |
| C T2 Jungle 05 Squire control / 947 | Vine Chameleon 348.0; Jungle Snake 124.0; Jungle Ape 44.0 | Vine Chameleon 437.0; Jungle Snake 256.0; Jungle Ape 48.0; unknown 9.0 |
| C T3 Jungle 03 Apprentice defensive / 173 | Silverback 627.3 | Silverback 1,194.2; Jungle Stalker 122.6 |
| C T3 Jungle 03 Conduit control / 173 | Silverback 575.0; Jungle Stalker 294.0 | Silverback 962.0; Jungle Stalker 349.0 |
| C T3 Jungle 03 Conduit ramp25 / 947 | Silverback 661.0; Jungle Stalker 218.0 | Silverback 1,115.0; Jungle Stalker 459.0 |
| C T3 Jungle 03 Spirit defensive / 947 | Silverback 579.0; Canopy Chameleon 78.0; Jungle Stalker 54.0 | Silverback 826.0; Jungle Stalker 291.0; Canopy Chameleon 122.0 |

### Surviving runs below 20% sampled HP

No B survivor crossed this threshold. The table gives the recorded minimum
fraction, actual sampled HP and time, then source damage in ±10s / ±30s around
that sample.

| Block / cell / seed | Minimum | ±10s sources | ±30s sources |
|---|---|---|---|
| A Tundra 03 Apprentice soft / 173 | 19.72%; 143.6 HP @ 79s | Bear 538.6 | Bear 930.7 |
| A Tundra 05 Apprentice soft / 173 | 3.41%; 25.9 HP @ 117s | Rime Caster 621.3; Bear 134.2 | Rime Caster 930.7; Bear 284.4 |
| A Tundra 05 Slinger alternative full / 173 | 17.33%; 91.7 HP @ 81s | Bear 392.3 | Bear 628.3; Rime Caster 250.2 |
| A Tundra 05 Slinger alternative full / 947 | 19.47%; 85.9 HP @ 23s | Bear 394.6 | Bear 933.6; Frost Lurker 53.0 |
| A Tundra 05 Slinger alternative full / 2027 | 17.75%; 106.0 HP @ 48s | Bear 454.6 | Bear 1,137.5 |
| C T3 Jungle 03 Apprentice control / 2027 | 8.62%; 45.7 HP @ 296s | Silverback 418.9; Jungle Stalker 164.4; Canopy Chameleon 75.8 | Silverback 790.5; Jungle Stalker 271.7; Canopy Chameleon 75.8 |
| C T3 Jungle 03 Conduit control / 2027 | 0.66%; 13.1 HP @ 107s | Silverback 681.0; Jungle Stalker 366.0; Canopy Chameleon 10.0 | Silverback 1,643.0; Jungle Stalker 705.0; Canopy Chameleon 40.0 |
| C T3 Jungle 03 Conduit ramp25 / 2027 | 19.72%; 82.8 HP @ 153s | Silverback 468.0; Jungle Stalker 270.0 | Silverback 1,312.0; Jungle Stalker 314.0 |
| C T3 Jungle 03 Slinger control / 2027 | 9.78%; 40.1 HP @ 28s | Silverback 443.0; Jungle Stalker 173.0; Canopy Chameleon 49.0 | Silverback 1,193.0; Jungle Stalker 266.0; Canopy Chameleon 120.0 |
| C T3 Jungle 03 Slinger ramp25 / 2027 | 19.18%; 75.1 HP @ 28s | Silverback 408.0; Jungle Stalker 252.0; Canopy Chameleon 49.0 | Silverback 863.0; Jungle Stalker 266.0; Canopy Chameleon 120.0 |
| C T3 Jungle 05 Conduit control / 2027 | 5.80%; 22.1 HP @ 67s | Silverback 953.0; Canopy Chameleon 28.0 | Silverback 1,617.0; Canopy Chameleon 28.0 |

## Limitations and exit boundary

- Body TTK excludes pre-hit charging and can span several natural pulls, so
  it is not an authored isolated-pack duration.
- A’s old runtime has no minion slot/HP/target snapshots and no explicit
  Bear break/vulnerability event record. Shield, shatter, slow, and
  vulnerability mechanism conclusions remain bounded by READY fields and
  damage timelines.
- One-second C samples can miss brief minion loss, death, respawn, or target
  changes. Sampled dead IDs are not event-certified minion death counts.
- Attack beats are cooldown timestamp changes, not guaranteed hits. Conduit
  player-only attack beats can be zero; minion/total beats and target damage
  are the valid Conduit measures.
- No AoE winner, economy/acquisition, travel, client, browser, human-play,
  or live-balance conclusion is authorized. Qualification, pilots, and
  verifier output are tooling evidence, not balance evidence.

Return to the planner is therefore: hold production source unchanged; retain
Bear fixed-HP evidence without the 148-attack rollout; carry Snapper 2,320 as
the upper-bound follow-up candidate with 1,740 as the conservative comparator;
and keep Jungle defensive stance and ramp25 as separate diagnostic inputs.
Any live change or combined Jungle arm requires a new explicit packet.
