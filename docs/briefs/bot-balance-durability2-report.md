# Durability 2 — T2/T3 elite lifetime and pressure calibration — execution report

Executed 2026-09-15 from the frozen
[bot-balance-durability2-operator-packet.md](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-durability2-operator-packet.md>).
The generated analysis was produced first and is the primary summary source:
[analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/analysis.md>)
and [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/analysis.json>).
The tables below interpret those outputs. Raw event and sample streams were
opened only for the death and outgoing-damage-gap outliers called out here.

## Named-elite TTK result

The packet's provisional targets are 10–20 seconds for T2 toughest ordinary
enemies and 20–30 seconds for T3. Values below are clean named-elite TTK
medians in seconds. Each cell median is the median of the available seed
medians, not a pooled median. The bracket is
seed:clean-seed-median / named-kills / unfinished / HP-regain traces; D is
player-death observations in the complete cell.

The five arms are Control, HP-low, HP-high, HP-low-soft and HP-high-soft.
T2 HP-low/high are x2/x3 named-target HP; T3 HP-low/high are x3/x5. Soft
arms keep the same HP and set only the named target's base attack to x0.75,
rounded by the normal definition path.

| Tier/node/role | Build | Named elite | Control | HP-low | HP-high | HP-low-soft | HP-high-soft |
|---|---|---|---|---|---|---|---|
| T2 node-t2-cave-02 / solo | baseline-striker | Cave Troll | 7.35s [173:7.50/8/0/0; 947:7.30/7/0/0; 2027:7.35/4/1/0; D0] | 13.55s [173:14.10/8/1/0; 947:13.55/8/1/0; 2027:13.00/6/0/0; D0] | 22.40s [173:22.40/7/1/0; 947:22.35/6/0/0; 2027:22.60/6/0/0; D0] | 13.90s [173:13.90/5/1/0; 947:13.90/9/0/0; 2027:13.90/7/0/0; D0] | 22.20s [173:22.40/7/0/0; 947:22.20/5/1/0; 2027:22.10/5/0/0; D0] |
| T2 node-t2-cave-02 / solo | baseline-squire | Cave Troll | 4.45s [173:4.55/6/0/0; 947:4.45/8/0/0; 2027:4.40/9/0/0; D0] | 10.30s [173:10.30/6/1/0; 947:10.30/8/1/0; 2027:10.30/7/0/0; D0] | 15.93s [173:15.85/4/0/0; 947:16.00/7/1/0; 2027:—/0/1/0; D1] | 10.30s [173:10.30/6/1/0; 947:10.30/10/0/0; 2027:9.90/5/0/0; D0] | 16.00s [173:16.00/6/0/0; 947:16.00/7/1/0; 2027:15.70/6/0/0; D0] |
| T2 node-t2-cave-02 / solo | baseline-apprentice | Cave Troll | 5.60s [173:6.00/11/0/0; 947:5.40/9/0/0; 2027:5.60/11/0/0; D0] | 9.60s [173:9.60/2/0/0; 947:10.05/8/0/0; 2027:9.60/9/0/0; D1] | 14.20s [173:14.20/5/1/0; 947:14.30/6/0/0; 2027:14.20/7/0/0; D0] | 9.60s [173:9.60/2/0/0; 947:10.05/8/0/0; 2027:9.60/11/0/0; D1] | 14.50s [173:14.50/4/0/0; 947:14.70/4/1/0; 2027:14.20/5/1/0; D0] |
| T2 node-t2-cave-02 / solo | baseline-slinger | Cave Troll | 8.00s [173:8.00/7/0/0; 947:8.00/8/0/0; 2027:8.00/7/0/0; D0] | 14.00s [173:14.00/7/0/0; 947:14.00/6/1/0; 2027:13.50/1/2/0; D1] | 20.00s [173:20.30/6/0/0; 947:20.00/6/1/0; 2027:19.75/6/0/0; D0] | 14.40s [173:14.40/8/0/0; 947:14.50/7/0/0; 2027:13.75/6/1/0; D0] | 19.75s [173:19.75/4/0/0; 947:20.00/5/0/0; 2027:19.50/5/0/0; D0] |
| T2 node-t2-cave-02 / solo | baseline-conduit | Cave Troll | 4.50s [173:4.50/10/0/0; 947:4.50/12/0/0; 2027:4.50/8/0/0; D0] | 9.30s [173:9.30/9/0/0; 947:9.20/10/0/0; 2027:9.30/9/0/0; D0] | 14.30s [173:14.40/7/0/0; 947:14.30/9/0/0; 2027:14.30/6/0/0; D0] | 9.25s [173:9.25/6/0/0; 947:9.20/10/0/0; 2027:9.30/8/0/0; D0] | 14.30s [173:14.45/6/0/0; 947:14.30/9/0/0; 2027:14.30/6/0/0; D0] |
| T2 node-t2-cave-02 / solo | baseline-spirit | Cave Troll | 2.80s [173:3.50/12/0/0; 947:2.80/13/0/0; 2027:2.80/13/0/0; D0] | 7.70s [173:7.70/8/1/0; 947:7.70/12/0/0; 2027:7.70/10/0/0; D1] | 11.90s [173:11.20/9/1/0; 947:11.90/11/1/0; 2027:11.90/7/1/0; D0] | 7.70s [173:7.70/8/0/0; 947:7.70/13/0/0; 2027:7.70/14/0/0; D0] | 11.90s [173:11.20/8/0/0; 947:11.90/10/0/0; 2027:11.90/7/0/0; D0] |
| T2 node-t2-mountain-04 / small-group | baseline-striker | Granite Titan | 6.60s [173:6.60/4/0/0; 947:6.60/7/0/0; 2027:7.85/6/0/0; D0] | 16.75s [173:16.00/7/1/0; 947:16.75/4/0/0; 2027:17.20/5/0/0; D0] | 25.40s [173:24.90/5/1/0; 947:25.40/5/1/0; 2027:25.40/5/1/0; D1] | 16.20s [173:16.20/7/0/0; 947:15.40/4/0/0; 2027:16.70/6/0/0; D0] | 25.65s [173:24.95/4/1/0; 947:25.65/4/0/0; 2027:29.70/1/0/0; D1] |
| T2 node-t2-mountain-04 / small-group | baseline-squire | Granite Titan | 4.90s [173:4.90/12/0/0; 947:4.70/5/0/0; 2027:6.50/4/0/0; D1] | 10.60s [173:10.30/7/0/0; 947:10.60/6/0/0; 2027:12.50/7/0/0; D0] | 18.30s [173:18.30/7/0/0; 947:18.20/7/0/0; 2027:20.50/8/0/0; D0] | 10.60s [173:10.60/8/0/0; 947:10.30/7/0/0; 2027:10.65/8/0/0; D0] | 18.50s [173:18.50/7/1/0; 947:18.45/6/1/0; 2027:18.80/5/0/0; D0] |
| T2 node-t2-mountain-04 / small-group | baseline-apprentice | Granite Titan | 4.50s [173:4.50/6/0/0; 947:4.50/10/0/0; 2027:4.50/13/0/0; D0] | 9.00s [173:9.00/8/0/0; 947:9.00/5/1/0; 2027:9.00/6/0/0; D1] | 13.50s [173:13.50/8/0/1; 947:13.50/7/1/0; 2027:13.50/3/0/0; D0] | 9.00s [173:9.00/8/0/0; 947:9.00/5/1/0; 2027:9.00/6/0/0; D1] | 13.50s [173:13.50/7/0/0; 947:13.50/5/1/0; 2027:13.50/4/0/0; D0] |
| T2 node-t2-mountain-04 / small-group | baseline-slinger | Granite Titan | 7.00s [173:7.00/8/1/0; 947:7.00/7/0/0; 2027:7.00/7/1/1; D0] | 12.00s [173:13.00/10/0/1; 947:12.00/1/0/0; 2027:12.00/5/0/0; D1] | 18.00s [173:19.50/8/0/0; 947:18.00/5/1/0; 2027:18.00/4/1/0; D0] | 12.00s [173:12.00/6/1/1; 947:12.00/1/0/0; 2027:13.00/7/0/0; D1] | 18.00s [173:18.00/6/2/3; 947:18.00/7/0/0; 2027:18.00/5/0/0; D0] |
| T2 node-t2-mountain-04 / small-group | baseline-conduit | Granite Titan | 3.90s [173:3.90/11/1/0; 947:3.85/10/0/0; 2027:3.90/8/0/0; D1] | 7.90s [173:7.90/8/1/0; 947:7.90/9/0/0; 2027:7.90/7/0/0; D0] | 11.90s [173:11.80/8/0/0; 947:12.00/6/0/0; 2027:11.90/5/0/1; D0] | 7.90s [173:7.90/8/1/0; 947:7.90/9/0/0; 2027:7.90/7/0/0; D0] | 11.90s [173:11.80/8/0/0; 947:12.00/6/0/0; 2027:11.90/5/0/1; D0] |
| T2 node-t2-mountain-04 / small-group | baseline-spirit | Granite Titan | 3.50s [173:3.50/15/1/0; 947:3.50/11/0/0; 2027:2.80/11/0/0; D0] | 8.40s [173:7.70/11/0/0; 947:8.40/11/0/0; 2027:8.40/12/0/1; D0] | 11.90s [173:11.90/10/3/2; 947:11.90/1/0/0; 2027:12.25/6/0/0; D1] | 8.40s [173:7.70/11/0/0; 947:8.40/11/0/0; 2027:8.40/12/0/1; D0] | 11.90s [173:11.90/10/3/2; 947:11.90/1/0/0; 2027:11.90/10/0/0; D1] |
| T3 node-t3-cave-02 / solo | baseline-striker | Cavern Troll | 4.85s [173:5.25/10/1/0; 947:4.70/17/0/0; 2027:4.85/14/0/0; D0] | 11.20s [173:11.20/11/0/0; 947:11.35/8/0/0; 2027:11.15/8/1/0; D0] | 17.30s [173:18.20/6/0/0; 947:16.70/8/1/0; 2027:17.30/7/1/0; D0] | 11.10s [173:11.30/8/0/0; 947:11.10/9/0/0; 2027:11.10/11/1/0; D0] | 17.40s [173:18.15/6/1/0; 947:17.40/8/0/0; 2027:17.20/6/0/0; D0] |
| T3 node-t3-cave-02 / solo | baseline-squire | Cavern Troll | 4.40s [173:4.40/9/0/0; 947:4.40/14/0/0; 2027:4.30/10/0/0; D0] | 14.15s [173:13.90/7/0/0; 947:14.30/9/0/0; 2027:14.15/8/0/0; D0] | 24.95s [173:24.95/6/1/0; 947:25.60/6/1/0; 2027:24.50/6/0/0; D0] | 14.00s [173:14.20/8/1/0; 947:14.00/9/0/0; 2027:14.00/9/1/0; D0] | 25.40s [173:25.40/6/1/0; 947:25.85/6/0/0; 2027:24.95/8/0/0; D0] |
| T3 node-t3-cave-02 / solo | baseline-apprentice | Cavern Troll | 4.70s [173:4.70/8/0/0; 947:5.55/10/0/0; 2027:4.50/10/0/0; D0] | 13.50s [173:13.50/7/1/0; 947:12.90/9/1/0; 2027:13.50/7/1/0; D1] | 21.80s [173:22.50/4/1/1; 947:21.80/6/0/1; 2027:21.00/5/1/0; D0] | 13.50s [173:12.70/11/0/0; 947:14.30/7/0/0; 2027:13.50/7/0/0; D0] | 22.10s [173:22.10/6/1/1; 947:22.35/7/0/1; 2027:21.00/7/0/0; D0] |
| T3 node-t3-cave-02 / solo | baseline-slinger | Cavern Troll | 7.30s [173:7.60/9/0/0; 947:7.00/5/0/0; 2027:7.30/12/0/0; D0] | 19.65s [173:20.00/5/1/0; 947:19.50/6/1/0; 2027:19.65/4/1/0; D0] | 32.00s [173:30.80/3/2/1; 947:32.20/5/1/2; 2027:32.00/5/2/1; D0] | 19.50s [173:19.00/6/1/1; 947:19.50/6/0/0; 2027:20.00/5/1/0; D0] | 32.00s [173:31.00/5/3/3; 947:32.00/4/2/2; 2027:32.00/5/1/1; D0] |
| T3 node-t3-cave-02 / solo | baseline-conduit | Cavern Troll | 5.80s [173:5.70/12/0/0; 947:5.80/12/0/0; 2027:5.80/9/1/0; D0] | 18.10s [173:18.00/6/1/0; 947:18.10/7/0/0; 2027:18.20/7/0/0; D0] | 30.45s [173:30.45/4/1/0; 947:30.25/4/1/0; 2027:30.50/6/0/0; D0] | 18.10s [173:18.00/6/1/0; 947:18.10/7/0/0; 2027:18.20/7/0/0; D0] | 30.45s [173:30.45/4/1/0; 947:30.25/4/1/0; 2027:30.50/6/0/0; D0] |
| T3 node-t3-cave-02 / solo | baseline-spirit | Cavern Troll | 2.70s [173:2.70/17/0/0; 947:2.60/15/0/0; 2027:2.80/14/0/0; D0] | 9.35s [173:9.35/12/0/0; 947:9.60/14/0/1; 2027:9.10/8/0/0; D0] | 16.05s [173:15.40/7/1/0; 947:16.70/11/1/0; 2027:16.05/8/1/0; D0] | 9.35s [173:9.35/12/0/0; 947:9.60/14/0/1; 2027:9.10/8/0/0; D0] | 16.15s [173:15.55/10/0/0; 947:16.15/12/0/0; 2027:16.15/8/0/0; D0] |
| T3 node-t3-mountain-04 / small-group | baseline-striker | Mountain Colossus | 4.85s [173:4.85/10/0/0; 947:4.30/7/1/0; 2027:5.00/7/0/0; D0] | 12.60s [173:12.60/9/1/0; 947:12.50/8/0/0; 2027:12.80/7/0/0; D0] | 21.50s [173:21.80/7/0/0; 947:21.50/5/1/0; 2027:21.40/6/0/0; D0] | 12.60s [173:12.40/7/0/0; 947:12.60/9/0/0; 2027:12.70/9/0/0; D0] | 21.80s [173:21.80/6/1/0; 947:21.85/6/1/0; 2027:21.40/6/1/0; D0] |
| T3 node-t3-mountain-04 / small-group | baseline-squire | Mountain Colossus | 4.10s [173:4.10/11/1/0; 947:3.50/11/0/0; 2027:4.60/9/0/0; D0] | 16.20s [173:16.90/9/0/0; 947:16.10/6/1/0; 2027:16.20/7/0/0; D0] | 28.40s [173:28.40/5/1/0; 947:28.30/5/0/0; 2027:31.10/5/0/0; D0] | 16.85s [173:16.85/8/1/0; 947:16.60/5/1/0; 2027:16.90/7/0/0; D0] | 29.90s [173:29.90/5/0/0; 947:29.90/5/0/0; 2027:28.75/6/0/0; D0] |
| T3 node-t3-mountain-04 / small-group | baseline-apprentice | Mountain Colossus | 4.50s [173:4.50/9/0/0; 947:4.50/12/0/0; 2027:4.50/6/0/0; D0] | 12.80s [173:12.00/6/0/0; 947:12.80/9/0/0; 2027:12.80/9/0/0; D0] | 22.50s [173:22.50/6/0/0; 947:22.50/6/1/0; 2027:22.50/5/0/0; D0] | 12.75s [173:12.75/8/0/0; 947:13.50/9/0/0; 2027:12.00/10/0/0; D0] | 22.50s [173:22.50/7/2/4; 947:22.50/7/0/0; 2027:23.25/4/2/0; D0] |
| T3 node-t3-mountain-04 / small-group | baseline-slinger | Mountain Colossus | 7.00s [173:7.00/13/0/0; 947:7.00/7/1/0; 2027:7.00/10/0/0; D0] | 20.00s [173:19.00/6/0/1; 947:21.00/3/1/0; 2027:20.00/4/0/0; D0] | 32.00s [173:32.00/5/1/1; 947:33.25/4/1/0; 2027:32.00/5/1/0; D0] | 19.50s [173:19.00/6/0/1; 947:20.00/3/1/0; 2027:19.50/4/0/0; D0] | 32.00s [173:32.00/4/1/1; 947:32.00/3/1/0; 2027:33.60/4/0/0; D0] |
| T3 node-t3-mountain-04 / small-group | baseline-conduit | Mountain Colossus | 5.10s [173:5.10/7/1/0; 947:5.15/8/0/0; 2027:5.10/6/0/0; D0] | 16.30s [173:16.20/5/0/0; 947:16.35/2/1/0; 2027:16.30/5/0/0; D0] | 27.20s [173:27.20/4/1/0; 947:27.20/5/0/0; 2027:27.00/4/1/0; D0] | 16.30s [173:16.20/5/0/0; 947:16.35/2/1/0; 2027:16.30/5/0/0; D0] | 27.20s [173:27.20/4/1/0; 947:27.20/5/0/0; 2027:27.00/4/1/0; D0] |
| T3 node-t3-mountain-04 / small-group | baseline-spirit | Mountain Colossus | 2.50s [173:2.50/13/0/0; 947:2.25/14/0/0; 2027:2.50/14/1/0; D0] | 11.40s [173:11.40/11/1/0; 947:11.40/10/1/0; 2027:11.70/9/0/0; D0] | 19.40s [173:19.50/8/2/2; 947:18.80/6/1/0; 2027:19.40/8/0/0; D0] | 11.40s [173:11.40/11/1/0; 947:11.40/10/1/0; 2027:11.70/9/0/0; D0] | 19.40s [173:19.50/8/2/2; 947:19.00/7/0/0; 2027:19.40/8/0/0; D1] |

The control arms are below the provisional bands. HP-low moves T2 Cave and
Mountain into the lower part of the T2 band for several builds, but remains
short in all T3 Cave cells and in most T3 Mountain cells. HP-high is the
broadest candidate: T2 Cave cell medians range 10.45–22.40s, T2 Mountain
11.90–25.40s, T3 Cave 16.05–32.00s and T3 Mountain 19.40–32.00s. The
Slinger/Conduit high rows are the upper edge; Spirit remains the lower edge.

Reduced named-target attack generally leaves TTK unchanged at the same HP,
as expected: it changes incoming pressure, not outgoing damage. The
survival and pressure comparison is reported below rather than folded into
the lifetime result.

## Treatment-band classification

This table classifies each build cell median against the provisional band:
Shorter is below the lower bound, Inside is within it, Longer is above the
upper bound, and No clean means no clean named-elite median. Named K/U/R is
total named-target kills / unfinished traces / HP-regain traces across the
24 seed/build observations in the row.

| Tier/node | Arm | Shorter | Inside | Longer | No clean | Clean cell-median range s | Named K/U/R | Death obs |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| T2 node-t2-cave-02 | control | 8 | 0 | 0 | 0 | 2.80–8.00 | 213/4/0 | 2 |
| T2 node-t2-cave-02 | hp-low | 4 | 4 | 0 | 0 | 7.55–14.00 | 187/11/0 | 4 |
| T2 node-t2-cave-02 | hp-high | 0 | 7 | 1 | 0 | 10.45–22.40 | 165/12/1 | 1 |
| T2 node-t2-cave-02 | hp-low-soft | 4 | 4 | 0 | 0 | 7.55–14.40 | 200/5/0 | 1 |
| T2 node-t2-cave-02 | hp-high-soft | 0 | 7 | 1 | 0 | 11.00–22.20 | 158/4/0 | 0 |
| T2 node-t2-mountain-04 | control | 8 | 0 | 0 | 0 | 3.50–7.00 | 222/4/2 | 2 |
| T2 node-t2-mountain-04 | hp-low | 5 | 3 | 0 | 0 | 7.90–16.75 | 176/4/3 | 3 |
| T2 node-t2-mountain-04 | hp-high | 0 | 7 | 1 | 0 | 11.90–25.40 | 139/13/5 | 4 |
| T2 node-t2-mountain-04 | hp-low-soft | 5 | 3 | 0 | 0 | 7.90–16.20 | 178/4/3 | 3 |
| T2 node-t2-mountain-04 | hp-high-soft | 0 | 7 | 1 | 0 | 11.45–25.65 | 136/12/8 | 3 |
| T3 node-t3-cave-02 | control | 8 | 0 | 0 | 0 | 2.70–7.30 | 281/3/0 | 0 |
| T3 node-t3-cave-02 | hp-low | 8 | 0 | 0 | 0 | 9.35–19.65 | 193/12/2 | 1 |
| T3 node-t3-cave-02 | hp-high | 2 | 4 | 2 | 0 | 16.05–32.00 | 145/18/7 | 0 |
| T3 node-t3-cave-02 | hp-low-soft | 8 | 0 | 0 | 0 | 9.35–19.50 | 200/10/3 | 0 |
| T3 node-t3-cave-02 | hp-high-soft | 2 | 4 | 2 | 0 | 16.15–32.00 | 159/11/9 | 0 |
| T3 node-t3-mountain-04 | control | 8 | 0 | 0 | 0 | 2.50–7.00 | 228/6/0 | 0 |
| T3 node-t3-mountain-04 | hp-low | 7 | 1 | 0 | 0 | 11.40–20.00 | 169/8/2 | 0 |
| T3 node-t3-mountain-04 | hp-high | 1 | 6 | 1 | 0 | 19.40–32.00 | 131/14/3 | 0 |
| T3 node-t3-mountain-04 | hp-low-soft | 8 | 0 | 0 | 0 | 11.40–19.50 | 171/8/2 | 0 |
| T3 node-t3-mountain-04 | hp-high-soft | 1 | 6 | 1 | 0 | 19.40–32.00 | 126/18/8 | 0 |

## Frozen identity and execution record

| Field | Value |
|---|---|
| Source revision | 9fc34ff94b0d6a82490bcc32c8036f25105ccc84 |
| Source tree | 5f2b2b0da07a9e14ee149d8af19e6cadf615c1e2 |
| Detached source worktree | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/source |
| Untreated definitions hash | 40158eea807ae06a5b531fe40d7ad05fb74eed79900a26503f7ee58f394f3ab1 |
| Frozen hitboxes | C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json |
| Hitbox SHA256 | 08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83 |
| Zero-tick qualification | C:/Users/osaif/AppData/Local/mmo-idle/validation/durability2/frozen-qualification |
| Qualification index SHA256 | 6EF82B2AF72391BA384A17DEC3519340435CA102936DA992680FF4B6CB8BD5DE |
| Mode / trial | run / durability2 |
| Synthetic / economy eligible | true / false |
| Simulation | dtMs=100; durationMs=300000; one sequential process |
| Seeds | 173, 947, 2027 |
| Results root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results |

The exact command was executed once from the detached checkout. All 160
cells and 480 observations completed with exit code 0. No declared replicate
was retried and no failed.json was produced. A read-only preflight parser
typo was corrected before output creation; it did not launch a batch and is
not counted as a run attempt.

The isolated checkout resolved the exact revision/tree and remained clean
after offline dependency installation. The shared checkout was not used by
the runner. No Docker worker, experiment lease, database write, service
restart, cleanup workflow, source edit or live balance edit was used.

| Measurement | Value |
|---|---:|
| Start UTC | 2026-09-15T11:55:28.0946531Z |
| End UTC | 2026-09-15T12:42:54.7441579Z |
| Wall duration | 2846.650 s (47m 26.650s) |
| C: free at start / end | 61342011392 / 60749860864 bytes |
| Wrapper working set at start / end | 92778496 / 94167040 bytes |
| Results root files / run directories | 5 / 480 |
| Recursive result files | 1925 |

The memory values are PowerShell-wrapper snapshots; the child Node runner's
peak RSS was not persisted by the harness. The packet's 2 GiB RSS and
four-hour batch ceilings therefore remain harness constraints, not independent
peak-RSS measurements from this invocation.

## Trial design and measurement rules

The trial is four natural node/population contexts × eight builds × five arms:

- T2 Cave solo: Cave Troll; T2 Mountain small-group: Granite Titan.
- T3 Cave solo: Cavern Troll; T3 Mountain small-group: Mountain Colossus.
- Six prepared baselines plus the Slinger DoT and Conduit on-hit weapon
  alternatives; the same gear, runes and abilities as the original survey.
- Control, HP-low, HP-high, HP-low-soft and HP-high-soft, with three fixed
  seeds per cell.

Only the named elite's HP and, in soft arms, base attack were overlaid.
Companion HP, companion output, plating, damage reduction, DoT defenses,
population, rewards, attack cadence, cast durations and AI were unchanged.
Natural node populations were retained.

TTK starts at the first positive outgoing player or owned-minion damage to
the named elite and ends at its authoritative kill. A same-tick kill is 0 ms.
A damaged survivor at the 300-second window is unfinished/censored. A target
with observed HP regain is excluded from the clean median but retained in raw
evidence. Cell-level values are medians of available seed medians.

## Qualification and overlay integrity

The preparation scan covered 96 base groups (four node/role contexts × eight
builds × three seeds) and 384 treated/control pairings (four treatment arms
per base group):

- geometryRosterHash matched in 384/384 pairings;
- initial roster identities and positions matched in 384/384 pairings;
- initialRosterHash changed in 384/384 treated pairings as expected;
- hpTreatment type, before/after HP, before/after attack and factors matched
  the frozen overlays in 384/384 pairings;
- actual target HP and target attack relationships matched in 384/384
  pairings, allowing the normal ±1 integer spawn-scaling tolerance for
  attack;
- only the named elite's HP/attack changed; non-target attacks, plating and
  damage reduction remained unchanged in 384/384 pairings.

There were no qualification-scan errors. The generated
[analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/analysis.md>)
contains the complete 160-cell generated table.

## Pressure, recovery, casts and wards

These aggregates cover 24 observations per node/arm: eight builds and three
seeds. All K/C is the total killed/censored target count in the natural
population. Elite K/U/R is named-target killed/unfinished/HP-regain traces.
Min HP is the minimum and median of each run's reported player HP fraction.
Peak hit and peak 1s are incoming-pressure summaries. Recovery is the median
and maximum completed recovery interval; interrupted is the count of recovery
intervals cut short by the next pull. Elite casts and Barrier are starts/fired.

| Tier/node/role | Arm | All K/C | Elite K/U/R | D | Min HP min/median | Peak hit median/max | Peak 1s median/max | Recovery median/max s | Interrupted | Elite casts S/F | Barrier S/F |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| T2 node-t2-cave-02 / solo | control | 633/6 | 213/4/0 | 2 | 0.00/0.50 | 100.90/240.00 | 102.90/240.00 | 1.55/7.70 | 40 | 328/294 | 0/0 |
| T2 node-t2-cave-02 / solo | hp-low | 517/12 | 187/11/0 | 4 | 0.00/0.33 | 114.00/240.00 | 114.00/240.00 | 1.80/6.40 | 24 | 301/300 | 0/0 |
| T2 node-t2-cave-02 / solo | hp-high | 457/15 | 165/12/1 | 1 | 0.00/0.34 | 114.00/212.00 | 114.00/220.50 | 2.00/6.10 | 23 | 319/312 | 0/0 |
| T2 node-t2-cave-02 / solo | hp-low-soft | 542/8 | 200/5/0 | 1 | 0.00/0.53 | 77.50/174.00 | 79.00/174.00 | 1.70/5.70 | 27 | 318/316 | 0/0 |
| T2 node-t2-cave-02 / solo | hp-high-soft | 491/11 | 158/4/0 | 0 | 0.23/0.46 | 83.00/174.00 | 83.00/174.00 | 2.05/7.50 | 25 | 286/281 | 0/0 |
| T2 node-t2-mountain-04 / small-group | control | 669/14 | 222/4/2 | 2 | 0.00/0.34 | 95.00/113.00 | 123.00/190.00 | 2.20/9.50 | 151 | 216/133 | 171/89 |
| T2 node-t2-mountain-04 / small-group | hp-low | 533/16 | 176/4/3 | 3 | 0.00/0.28 | 95.00/113.00 | 112.50/194.00 | 2.30/10.30 | 94 | 225/203 | 136/127 |
| T2 node-t2-mountain-04 / small-group | hp-high | 453/22 | 139/13/5 | 4 | 0.00/0.25 | 88.71/113.00 | 112.00/161.00 | 4.45/10.60 | 92 | 310/262 | 117/117 |
| T2 node-t2-mountain-04 / small-group | hp-low-soft | 536/14 | 178/4/3 | 3 | 0.00/0.38 | 87.61/113.00 | 98.80/194.00 | 2.30/10.30 | 100 | 226/207 | 137/128 |
| T2 node-t2-mountain-04 / small-group | hp-high-soft | 467/18 | 136/12/8 | 3 | 0.00/0.31 | 87.15/113.00 | 112.00/161.00 | 4.20/11.40 | 97 | 290/241 | 115/114 |
| T3 node-t3-cave-02 / solo | control | 811/9 | 281/3/0 | 0 | 0.39/0.75 | 58.00/206.10 | 58.00/215.10 | 0.55/7.60 | 45 | 323/321 | 0/0 |
| T3 node-t3-cave-02 / solo | hp-low | 609/16 | 193/12/2 | 1 | 0.00/0.76 | 79.00/206.10 | 80.00/268.70 | 0.60/5.60 | 27 | 267/263 | 0/0 |
| T3 node-t3-cave-02 / solo | hp-high | 482/20 | 145/18/7 | 0 | 0.12/0.53 | 118.00/206.10 | 118.00/215.10 | 0.80/6.80 | 27 | 296/278 | 0/0 |
| T3 node-t3-cave-02 / solo | hp-low-soft | 607/11 | 200/10/3 | 0 | 0.38/0.79 | 63.00/144.90 | 64.00/149.90 | 0.55/5.10 | 26 | 276/275 | 0/0 |
| T3 node-t3-cave-02 / solo | hp-high-soft | 475/14 | 159/11/9 | 0 | 0.38/0.67 | 84.00/144.90 | 84.00/149.90 | 0.80/7.20 | 27 | 321/297 | 0/0 |
| T3 node-t3-mountain-04 / small-group | control | 769/10 | 228/6/0 | 0 | 0.63/0.84 | 48.70/90.00 | 50.70/90.00 | 0.00/7.70 | 132 | 226/138 | 167/81 |
| T3 node-t3-mountain-04 / small-group | hp-low | 577/11 | 169/8/2 | 0 | 0.27/0.78 | 75.75/102.00 | 76.00/191.00 | 0.00/7.70 | 85 | 253/233 | 142/142 |
| T3 node-t3-mountain-04 / small-group | hp-high | 477/18 | 131/14/3 | 0 | 0.41/0.75 | 83.25/102.00 | 84.75/116.00 | 0.60/7.70 | 86 | 272/271 | 107/107 |
| T3 node-t3-mountain-04 / small-group | hp-low-soft | 590/13 | 171/8/2 | 0 | 0.36/0.84 | 63.00/90.00 | 63.00/168.00 | 0.00/7.70 | 101 | 254/234 | 143/143 |
| T3 node-t3-mountain-04 / small-group | hp-high-soft | 481/22 | 126/18/8 | 0 | 0.51/0.84 | 59.50/90.00 | 59.50/93.00 | 0.40/7.70 | 93 | 269/265 | 104/104 |

At equal HP, reducing the named elite's attack lowered pressure most clearly
in T2 Cave: deaths fell 4 to 1 at HP-low and 1 to 0 at HP-high, while peak
hit and peak one-second damage also fell. T3 Cave HP-low deaths fell 1 to 0.
T2 Mountain HP-low remained at three deaths and HP-high fell from four to
three; T3 Mountain had no deaths in either attack arm. The unchanged
companions still account for many deaths, so x0.75 named-elite attack is a
pressure lever, not a survival guarantee.

Granite Barrier start/fired traces are included in the final column. The
start/fired difference reflects deaths and unfinished engagements; it is not
a failed-cast diagnosis. T2 Mountain totals are 171/89, 136/127, 117/117,
137/128 and 115/114 from control through high-soft. T3 Mountain totals are
167/81, 142/142, 107/107, 143/143 and 104/104.

## Equal-HP full-attack versus reduced-attack comparison

This isolates the soft-arm pressure change at the same named-elite HP. Int is
interrupted recovery count, and casts are named-elite starts/fired.

| Tier/node/role | HP bracket | Full attack | Reduced attack |
|---|---|---|---|
| T2 node-t2-cave-02 / solo | low | K/U/R 187/11/0; D4; minHP 0.00/0.33; peak 114.00/240.00; 1s 114.00/240.00; rec 1.80/6.40s; int 24; casts 301/300 | K/U/R 200/5/0; D1; minHP 0.00/0.53; peak 77.50/174.00; 1s 79.00/174.00; rec 1.70/5.70s; int 27; casts 318/316 |
| T2 node-t2-cave-02 / solo | high | K/U/R 165/12/1; D1; minHP 0.00/0.34; peak 114.00/212.00; 1s 114.00/220.50; rec 2.00/6.10s; int 23; casts 319/312 | K/U/R 158/4/0; D0; minHP 0.23/0.46; peak 83.00/174.00; 1s 83.00/174.00; rec 2.05/7.50s; int 25; casts 286/281 |
| T2 node-t2-mountain-04 / small-group | low | K/U/R 176/4/3; D3; minHP 0.00/0.28; peak 95.00/113.00; 1s 112.50/194.00; rec 2.30/10.30s; int 94; casts 225/203 | K/U/R 178/4/3; D3; minHP 0.00/0.38; peak 87.61/113.00; 1s 98.80/194.00; rec 2.30/10.30s; int 100; casts 226/207 |
| T2 node-t2-mountain-04 / small-group | high | K/U/R 139/13/5; D4; minHP 0.00/0.25; peak 88.71/113.00; 1s 112.00/161.00; rec 4.45/10.60s; int 92; casts 310/262 | K/U/R 136/12/8; D3; minHP 0.00/0.31; peak 87.15/113.00; 1s 112.00/161.00; rec 4.20/11.40s; int 97; casts 290/241 |
| T3 node-t3-cave-02 / solo | low | K/U/R 193/12/2; D1; minHP 0.00/0.76; peak 79.00/206.10; 1s 80.00/268.70; rec 0.60/5.60s; int 27; casts 267/263 | K/U/R 200/10/3; D0; minHP 0.38/0.79; peak 63.00/144.90; 1s 64.00/149.90; rec 0.55/5.10s; int 26; casts 276/275 |
| T3 node-t3-cave-02 / solo | high | K/U/R 145/18/7; D0; minHP 0.12/0.53; peak 118.00/206.10; 1s 118.00/215.10; rec 0.80/6.80s; int 27; casts 296/278 | K/U/R 159/11/9; D0; minHP 0.38/0.67; peak 84.00/144.90; 1s 84.00/149.90; rec 0.80/7.20s; int 27; casts 321/297 |
| T3 node-t3-mountain-04 / small-group | low | K/U/R 169/8/2; D0; minHP 0.27/0.78; peak 75.75/102.00; 1s 76.00/191.00; rec 0.00/7.70s; int 85; casts 253/233 | K/U/R 171/8/2; D0; minHP 0.36/0.84; peak 63.00/90.00; 1s 63.00/168.00; rec 0.00/7.70s; int 101; casts 254/234 |
| T3 node-t3-mountain-04 / small-group | high | K/U/R 131/14/3; D0; minHP 0.41/0.75; peak 83.25/102.00; 1s 84.75/116.00; rec 0.60/7.70s; int 86; casts 272/271 | K/U/R 126/18/8; D0; minHP 0.51/0.84; peak 59.50/90.00; 1s 59.50/93.00; rec 0.40/7.70s; int 93; casts 269/265 |

The soft arms reduce the named elite's incoming contribution without
changing its lifetime directly. Their lower named-target kill totals in some
rows are sampling/context variation from the same natural population, not a
claim that lowering enemy attack increases player damage.

## Death attribution

There were 24 player-death observations. The killer counts were Boulder
Thrower 8, Cave Troll 6, Stone Eagle 6, Cave Gargoyle 2, Granite Titan 1
and Cavern Troll 1. The unchanged companion population caused 17 of the
24 deaths; only seven were attributed to one of the named elites.

The cause and damage below come from the authoritative player-death event's
killer/cause fields. Each evidence link is the raw event line for that death.

| Cell / seed | Death s | Cause | Killer | Damage | Evidence |
|---|---:|---|---|---:|---|
| dur2-ttk-t2-squire-solo-baseline-hp-high / 2027 | 38.7 | melee | Cave Troll (cave-troll) | 101.00 | [events:174](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-squire-solo-baseline-hp-high-s2027/events.jsonl:174>) |
| dur2-ttk-t2-apprentice-solo-baseline-hp-low / 173 | 159.0 | ranged | Cave Gargoyle (cave-gargoyle) | 70.20 | [events:687](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-apprentice-solo-baseline-hp-low-s173/events.jsonl:687>) |
| dur2-ttk-t2-apprentice-solo-baseline-hp-low-soft / 173 | 173.6 | ranged | Cave Gargoyle (cave-gargoyle) | 70.20 | [events:703](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-apprentice-solo-baseline-hp-low-soft-s173/events.jsonl:703>) |
| dur2-ttk-t2-slinger-solo-baseline-control / 173 | 271.2 | melee | Cave Troll (cave-troll) | 240.00 | [events:1401](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-slinger-solo-baseline-control-s173/events.jsonl:1401>) |
| dur2-ttk-t2-slinger-solo-baseline-control / 947 | 53.0 | melee | Cave Troll (cave-troll) | 240.00 | [events:358](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-slinger-solo-baseline-control-s947/events.jsonl:358>) |
| dur2-ttk-t2-slinger-solo-baseline-hp-low / 173 | 232.6 | melee | Cave Troll (cave-troll) | 240.00 | [events:1238](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-slinger-solo-baseline-hp-low-s173/events.jsonl:1238>) |
| dur2-ttk-t2-slinger-solo-weapon-alt-hp-low / 2027 | 82.0 | melee | Cave Troll (cave-troll) | 240.00 | [events:666](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-slinger-solo-weapon-alt-hp-low-s2027/events.jsonl:666>) |
| dur2-ttk-t2-spirit-solo-baseline-hp-low / 173 | 258.8 | melee | Cave Troll (cave-troll) | 221.75 | [events:665](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-spirit-solo-baseline-hp-low-s173/events.jsonl:665>) |
| dur2-ttk-t2-striker-small-group-baseline-hp-high / 173 | 275.8 | ranged | Boulder Thrower (peak-archer) | 72.00 | [events:2059](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-striker-small-group-baseline-hp-high-s173/events.jsonl:2059>) |
| dur2-ttk-t2-striker-small-group-baseline-hp-high-soft / 2027 | 72.2 | melee | Stone Eagle (stone-eagle) | 59.00 | [events:644](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-striker-small-group-baseline-hp-high-soft-s2027/events.jsonl:644>) |
| dur2-ttk-t2-squire-small-group-baseline-control / 2027 | 146.9 | ranged | Boulder Thrower (peak-archer) | 69.00 | [events:512](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-squire-small-group-baseline-control-s2027/events.jsonl:512>) |
| dur2-ttk-t2-apprentice-small-group-baseline-hp-low / 2027 | 144.3 | melee | Stone Eagle (stone-eagle) | 55.80 | [events:439](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-apprentice-small-group-baseline-hp-low-s2027/events.jsonl:439>) |
| dur2-ttk-t2-apprentice-small-group-baseline-hp-low-soft / 2027 | 144.3 | melee | Stone Eagle (stone-eagle) | 55.80 | [events:439](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-apprentice-small-group-baseline-hp-low-s2027/events.jsonl:439>) |
| dur2-ttk-t2-slinger-small-group-weapon-alt-hp-low / 947 | 44.0 | ranged | Boulder Thrower (peak-archer) | 81.00 | [events:414](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-slinger-small-group-weapon-alt-hp-low-s947/events.jsonl:414>) |
| dur2-ttk-t2-slinger-small-group-weapon-alt-hp-low-soft / 947 | 44.0 | ranged | Boulder Thrower (peak-archer) | 81.00 | [events:414](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-slinger-small-group-weapon-alt-hp-low-s947/events.jsonl:414>) |
| dur2-ttk-t2-conduit-small-group-baseline-hp-low / 2027 | 25.2 | ranged | Boulder Thrower (peak-archer) | 56.00 | [events:285](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-conduit-small-group-baseline-hp-low-s2027/events.jsonl:285>) |
| dur2-ttk-t2-conduit-small-group-baseline-hp-high / 173 | 103.3 | melee | Granite Titan (granite-titan) | 68.00 | [events:971](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-conduit-small-group-baseline-hp-high-s173/events.jsonl:971>) |
| dur2-ttk-t2-conduit-small-group-baseline-hp-high / 2027 | 25.2 | ranged | Boulder Thrower (peak-archer) | 56.00 | [events:285](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-conduit-small-group-baseline-hp-high-s2027/events.jsonl:285>) |
| dur2-ttk-t2-conduit-small-group-baseline-hp-low-soft / 2027 | 25.2 | ranged | Boulder Thrower (peak-archer) | 56.00 | [events:285](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-conduit-small-group-baseline-hp-low-soft-s2027/events.jsonl:285>) |
| dur2-ttk-t2-conduit-small-group-baseline-hp-high-soft / 2027 | 25.2 | ranged | Boulder Thrower (peak-archer) | 56.00 | [events:285](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-conduit-small-group-baseline-hp-high-soft-s2027/events.jsonl:285>) |
| dur2-ttk-t2-conduit-small-group-weapon-alt-control / 947 | 291.6 | melee | Stone Eagle (stone-eagle) | 112.00 | [events:1756](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-conduit-small-group-weapon-alt-control-s947/events.jsonl:1756>) |
| dur2-ttk-t2-spirit-small-group-baseline-hp-high / 947 | 37.7 | melee | Stone Eagle (stone-eagle) | 112.00 | [events:153](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-spirit-small-group-baseline-hp-high-s947/events.jsonl:153>) |
| dur2-ttk-t2-spirit-small-group-baseline-hp-high-soft / 947 | 37.7 | melee | Stone Eagle (stone-eagle) | 112.00 | [events:153](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t2-spirit-small-group-baseline-hp-high-soft-s947/events.jsonl:153>) |
| dur2-ttk-t3-apprentice-solo-baseline-hp-low / 173 | 270.8 | melee | Cavern Troll (cavern-troll) | 206.10 | [events:999](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t3-apprentice-solo-baseline-hp-low-s173/events.jsonl:999>) |

The 24 death rows are observed outcomes, not execution failures. In
particular, the two T2 Cave Apprentice deaths show why reducing only the
named elite's attack cannot guarantee survival when companion damage remains
unchanged.

## Independent outgoing-damage-gap audit

This audit is separate from TTK. The longest gap is the maximum interval from
observation start, between outgoing damage events, or from the last outgoing
damage event to observation end. Outgoing damage includes positive damage or
absorption from the player or an owned minion to a monster. The final-monster
value is the median number of monsters with positive HP in the final sample.
Static contacts are sampled staticDamageContacts runs/entries.

| Node | Arm | Runs | Median longest gap s | Max longest gap s | >60s | >120s | Median last outgoing s | Median end gap s | Final monsters median | Static contacts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| node-t2-cave-02 / solo | control | 24 | 13.95 | 20.50 | 0 | 0 | 295.40 | 3.35 | 16 | 0/0 |
| node-t2-cave-02 / solo | hp-low | 24 | 12.85 | 49.10 | 0 | 0 | 297.60 | 1.10 | 16 | 0/0 |
| node-t2-cave-02 / solo | hp-high | 24 | 13.85 | 21.90 | 0 | 0 | 299.20 | 0.75 | 16 | 0/0 |
| node-t2-cave-02 / solo | hp-low-soft | 24 | 12.70 | 48.80 | 0 | 0 | 298.30 | 1.70 | 16 | 0/0 |
| node-t2-cave-02 / solo | hp-high-soft | 24 | 14.15 | 18.10 | 0 | 0 | 299.20 | 0.80 | 16 | 0/0 |
| node-t2-mountain-04 / small-group | control | 24 | 13.85 | 25.20 | 0 | 0 | 295.45 | 2.10 | 24 | 0/0 |
| node-t2-mountain-04 / small-group | hp-low | 24 | 13.95 | 24.80 | 0 | 0 | 294.85 | 2.55 | 24 | 0/0 |
| node-t2-mountain-04 / small-group | hp-high | 24 | 12.30 | 25.10 | 0 | 0 | 298.30 | 0.70 | 24 | 0/0 |
| node-t2-mountain-04 / small-group | hp-low-soft | 24 | 14.00 | 17.90 | 0 | 0 | 294.95 | 2.05 | 24 | 0/0 |
| node-t2-mountain-04 / small-group | hp-high-soft | 24 | 12.45 | 20.20 | 0 | 0 | 296.80 | 1.70 | 24 | 0/0 |
| node-t3-cave-02 / solo | control | 24 | 10.95 | 16.40 | 0 | 0 | 299.25 | 0.75 | 16 | 0/0 |
| node-t3-cave-02 / solo | hp-low | 24 | 10.15 | 17.10 | 0 | 0 | 299.55 | 0.40 | 16 | 0/0 |
| node-t3-cave-02 / solo | hp-high | 24 | 9.90 | 18.80 | 0 | 0 | 299.60 | 0.40 | 16 | 0/0 |
| node-t3-cave-02 / solo | hp-low-soft | 24 | 10.60 | 17.10 | 0 | 0 | 298.75 | 1.25 | 16 | 0/0 |
| node-t3-cave-02 / solo | hp-high-soft | 24 | 9.85 | 14.80 | 0 | 0 | 299.10 | 0.90 | 16 | 0/0 |
| node-t3-mountain-04 / small-group | control | 24 | 13.95 | 50.80 | 0 | 0 | 298.45 | 1.55 | 24 | 0/0 |
| node-t3-mountain-04 / small-group | hp-low | 24 | 13.30 | 83.70 | 1 | 0 | 298.95 | 1.05 | 24 | 0/0 |
| node-t3-mountain-04 / small-group | hp-high | 24 | 12.65 | 19.70 | 0 | 0 | 299.60 | 0.40 | 24 | 0/0 |
| node-t3-mountain-04 / small-group | hp-low-soft | 24 | 13.45 | 83.70 | 1 | 0 | 299.15 | 0.85 | 24 | 0/0 |
| node-t3-mountain-04 / small-group | hp-high-soft | 24 | 14.40 | 19.70 | 0 | 0 | 299.70 | 0.30 | 24 | 0/0 |

There were no observations with no outgoing damage. Every run recorded
movement samples, and every run recorded at least one null-target sample.
There were no sampled static-hazard contacts in these Cave/Mountain nodes.
Across all 480 observations, only two crossed a 60-second outgoing-damage
gap and none crossed 120 seconds.

The two 83.7-second outliers are the same seed, 173, in the T3 Mountain
baseline Conduit HP-low and HP-low-soft cells. In both, owned-minion damage
killed a Crag Mortar at 178.7s, then the next positive owned-minion damage
hit a Mountain Colossus at 262.4s. The player emitted no direct damage in
that run; the Consort minions emitted damage before and after the gap.
Samples at 180.0s and 260.0s show null target, attack intent and player
movement with waypoints, while the 270.0s sample shows a live target after
movement. See [events.jsonl:898](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t3-conduit-small-group-baseline-hp-low-s173/events.jsonl:898>),
[events.jsonl:909](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t3-conduit-small-group-baseline-hp-low-s173/events.jsonl:909>),
[samples.jsonl:181](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t3-conduit-small-group-baseline-hp-low-s173/samples.jsonl:181>),
[samples.jsonl:261](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t3-conduit-small-group-baseline-hp-low-s173/samples.jsonl:261>)
and [samples.jsonl:271](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/dur2-ttk-t3-conduit-small-group-baseline-hp-low-s173/samples.jsonl:271>).
This is a retargeting/movement diagnostic signal in the synthetic harness,
not proof of a client idle or pathfinding defect. The T2 Cave 49.1s and
48.8s maxima are death-tailed intervals in the two Apprentice seed-173
observations, not live combat inactivity.

## Censored and failed slots

All 160 cells have all three declared seeds represented. Across 480
observations, 456 ended at the 300-second window and 24 ended in a player
death. Target traces contain 11,176 kills and 280 unfinished/censored
traces; 72 traces recorded HP regain and are retained outside the clean
TTK medians. The clean TTK aggregate contains 11,139 target traces.

There was no failed.json, runner failure or retry. A player death is an
observed run outcome; each declared death advanced to the next cell as
required by the packet.

## Artifact verification

The completion marker and generated report were checked after the single run:

| Artifact | SHA256 / value |
|---|---|
| [manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/manifest.json>) | C2F37CBE1E7AEFE0FD64C969C5F95EC45228C089FBC74A21ADBFF8C3AD248E31 |
| [complete.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/complete.json>) | CA440CA879B08F51CAB3076B1A6D3DFE71C0888865B29DFE87D17A02A26EBEB8; {"cells":160,"runs":480,"mode":"run"} |
| [analysis.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/analysis.json>) | 78BD068BB79A5A76680F4F53BA13FE1A1A719B8DAE0524FF50E47FBA46CFD7C9 |
| [analysis.md](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/analysis.md>) | 3BCF2689A7FEDB9815C24D9D3FDD23D91B74302AA9F946E05BD3E43AB9992A31 |
| [index.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability2-20260915/results/index.json>) | B511654EF11C91A132C0833BBBBF71CF84C823A5FE74F01F2688FDCD42E4BB44 |

The results root contains five root files, 480 run directories and 1,925
recursive files. The completion marker declares 160 cells and 480 runs. The
detached source worktree still resolves to revision
9fc34ff94b0d6a82490bcc32c8036f25105ccc84, tree
5f2b2b0da07a9e14ee149d8af19e6cadf615c1e2, with a clean status. The shared
checkout's pre-existing modified campaign/docs files and human-playtest
artifacts were not included in the run or altered by it.

## Decision for Astra and user review

Durability 2 is sufficient to select a candidate durability/pressure screen
for a later defense comparison. It is not sufficient to select a live
balance value or to certify player readiness.

| Slice | Readout | Review disposition |
|---|---|---|
| T2 Cave | HP-high gives 10.45–22.40s across the six baseline builds; HP-low is mostly below target. x0.75 attack lowers peak pressure and deaths. | Keep T2 HP-high as the durability candidate; carry x0.75 attack as a paired pressure candidate, not an automatic live edit. |
| T2 Mountain | HP-high gives 11.90–25.40s, with Granite Barrier activity and companion deaths in the small-group context. | Keep T2 HP-high for defense review, with group pressure and Barrier exposure retained as acceptance metrics. |
| T3 Cave | HP-high gives 16.05–32.00s; Slinger/Conduit reach the upper edge while Spirit remains below 20s. | Keep T3 HP-high as the closest broad candidate, but review class spread before canonizing one factor. |
| T3 Mountain | HP-high gives 19.40–32.00s; only one same-seed Conduit low/low-soft gap exceeded 60s and no T3 Mountain run died. | Keep T3 HP-high for defense review; inspect the Conduit retargeting outlier if it recurs in a later screen. |

The practical next comparison is selected plating, damage-reduction and
DoT-resistance profiles against T2 HP-high and T3 HP-high references, with
the x0.75 named-elite attack arms retained when pressure attribution matters.
No source, ability, population, reward, defense, damage or live balance patch
is authorized by this result. The T3 target band is a review target, not a
requirement for every class or swarm body.

The packet's recorded qualification, overlay, restoration, typecheck and
pilot prerequisites passed. The full repository suite, Docker/economy path
and live/browser playtests were not run for this packet; those remain separate
validation requirements.
