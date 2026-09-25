import collections,json,pathlib
root=pathlib.Path(__file__).resolve().parent
read=lambda p:json.loads(p.read_text(encoding='utf8'))
data=read(root/'results.json');validation=read(root/'validation.json');lines=[]
lines += ['# Conduit study results - 2026-09-25','', '## Decision','',
'Advance **+50% summon HP with approximately unchanged per-replacement HP payments** as the early-game candidate. Do not adopt the same multiplier globally on the strength of this study: upper-tier responses are package-dependent and include regressions. No gameplay tuning was applied to the main checkout or deployed.','',
'The prototype changes HP budgets by x1.5 and the replacement ratio from 0.30 to 0.20. Reconstruction timers, offense budgets, proc budgets, owner stats and movement are unchanged. Payment rounding can differ by 1 HP. The treatment lives only in each experiment child process.','',
'## What was run','',f"{sum(len(rs) for rs in data.values())} combat observations, including 14 deterministic baseline replays. Separate zero-combat qualification failures are preserved and excluded from balance conclusions. All completed stages have terminal complete.json files; validation checks matching starting worlds and owner stats, unchanged timers/offense, payment bounds, source resolution, raw artifacts and exact baseline replay.",'',
'Real server World ticks at 100 ms, native bot Rune decisions, baked hitboxes, fixed prepared mastery and gear. Farming stops after five simulated minutes or owner death; bosses stop on authoritative boss kill, death or the same cap. These are combat simulations, not socket-based acquisition/economy campaigns, browser play, deployment evidence or rankings against other classes. Tiers 5-6 were not covered. See README.md for source provenance and setup history.','',
'## Early-game iteration','',
'- Half-cost reconstruction alone regressed Plains entry: both baseline lives survived; both tax15 lives died. Lower payments are not automatically a safer combat trajectory.',
'- +25% HP improved developed Cave farming but introduced a Plains-entry death and did not rescue the failing Forest seed.',
'- +50% HP rescued that Forest seed and improved the capped farming work in every T1 context when summed across its two seeds.',
'- +100% HP did not improve on the +50% candidate overall; the larger buff was not advanced.',
'- The original T1 boss packages still failed. A separate affordable defensive package (Orbit plus target-casting Brace, no Sweep) cleared Mountain in both seeds with baseline AND hp50. That is a loadout/automation result, not an HP-buff win. Prepared Plains boss packages still lost the owner with intact summons.','',
'## Baseline versus hp50 summary','', '| Stage / role | Observations per arm | Baseline kills / deaths / boss clears | hp50 kills / deaths / boss clears |','|---|---:|---:|---:|']
for stage in ['t1-iteration2','t1-boss-followup','t1-boss-orbit-r2','t2','t3','t4']:
 if stage not in data:continue
 for role in ['farm','boss']:
  rs=[r for r in data[stage] if r['role']==role and r['arm'] in ['baseline','hp50']]
  if not rs:continue
  arms=[[r for r in rs if r['arm']==a] for a in ['baseline','hp50']]
  vals=[' / '.join(map(str,[sum(r['kills'] for r in a),sum(r['outcome']=='player-died' for r in a),sum(r['bossKilled'] for r in a)])) for a in arms]
  lines.append(f"| {stage} / {role} | {len(arms[0])} | {vals[0]} | {vals[1]} |")
lines += ['', 'Kills include ordinary enemies and boss-spawned adds; **boss clears are counted separately**. Death-shortened runs contribute only their actual completed work. Surviving a five-minute boss cap is not a kill, a death, or an indefinite sustain proof. Do not pool different packages/biomes/tiers into a universal win rate.','',
'## Specific upper-tier findings','',
'- T2: all three frames tested in Plains, Cave and against Stoneplate Juggernaut, with two seeds. Heavy changes from death at 97.0 seconds to a boss clear at 104.8 seconds in both seeds. Balanced farming is near-neutral in Plains; Light and all frames in Cave improve summed work.',
'- T3 Heavy/far Volcano, seed 101009: baseline survives the cap with 21 kills; hp50 dies with 4 kills. This is a concrete reason to hold global adoption. It does not prove that extra HP is generally harmful.',
'- T3 Balanced/mid boss: both arms deal 12,308 HP damage by the cap, with identical recorded gameplay. Bodies rise from 74 to 111 HP while the authored normal boss hit is 204 before any encounter-specific modifiers: the buff does not cross that normal-hit survival threshold. This is not a failure to engage or a zero-damage stall.',
'- T3 ranges were tested separately; higher aggregate work must not hide a new death in a particular frame/range/seed.',
'- T4: farming totals are 493 to 497 kills, with no owner deaths in either arm. All nine bosses clear in both arms. Marshal improves 41 to 53; Chorister falls 66 to 56; Ritualist falls 52 to 48; Inquisitor falls 68 to 64; Iconoclast improves 62 to 68. This one-seed coverage screen does not justify a uniform specialization buff.','',
'## Per-package paired results','', 'Each entry shows actual total kills, owner deaths and boss clears summed over the listed seeds. Availability is an unweighted mean of each run\'s living authored-offense fraction; it is not landed DPS.','']
for stage,rs in data.items():
 lines += [f'### {stage}','', '| Package | Arm | n | Kills | Deaths | Boss clears | Availability | HP paid | HP-blocked seconds |','|---|---|---:|---:|---:|---:|---:|---:|---:|']
 groups=collections.defaultdict(list)
 for r in rs:groups[(r['caseId'],r['arm'])].append(r)
 for (case,arm),a in groups.items():
  lines.append(f"| {case} | {arm} | {len(a)} | {sum(r['kills'] for r in a)} | {sum(r['outcome']=='player-died' for r in a)} | {sum(r['bossKilled'] for r in a)} | {sum(r['availability'] or 0 for r in a)/len(a):.1%} | {sum(r['hpPaid'] for r in a):.0f} | {sum(r['blockedMs'] for r in a)/1000:.1f} |")
 lines += ['']
lines += ['## Next balance step','',
'Keep the early durability candidate separate from upper-tier redesign. Before adoption, define how the extra early HP carries through frame/range unlocks so progression does not create a durability cliff. Then run a real early-character route with earned equipment and compare acquisition time and deaths. For upper tiers, investigate owner damage exposure, summon hit-survival thresholds and range-specific targeting using the recorded failing lives; do not stack a timer reduction onto this candidate to conceal them.','',
'## Validation and artifacts','',
'- Bench TypeScript check passed during preparation; final check is recorded separately in validation-checks.json.',
'- Focused summoner overhaul, specialization and starter-maintenance tests passed. No full repository suite or browser playtest was run.',
'- results.json contains the compact per-life results; validation.json contains integrity checks; artifact-inventory.json lists SHA-256 hashes for raw evidence.',
'- Raw evidence and isolated source: D:/mmo-idle/conduit-study-2026-09-25/.',
'- Main-checkout changes are experiment tooling and a narrow bench preparation fix for starter Rune recipe validation. Production combat values remain untouched.','']
(root/'REPORT.md').write_text('\n'.join(lines),encoding='utf8')
print('Wrote REPORT.md')
