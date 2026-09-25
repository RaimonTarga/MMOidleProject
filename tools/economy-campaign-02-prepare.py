"""Build an unsealed planning packet from verified static exports. Never launches a run.
Usage: python tools/economy-campaign-02-prepare.py EXTERNAL_EVIDENCE_ROOT
"""
import hashlib, json, pathlib, subprocess, sys

REPO = pathlib.Path(__file__).resolve().parents[1]
OUT = REPO / 'reports/economy-baseline-campaign-02-preparation'
EVIDENCE = pathlib.Path(sys.argv[1]).resolve()
REVISION = 'aa9f7d6c327833dd033777b4c9840a9966eac38f'
ACTORS = [('striker', 'cadence-root', 'cadence-balanced'), ('squire', 'cooldown-root', 'cooldown-heavy'),
          ('apprentice', 'dot-root', 'dot-balanced'), ('conduit', 'summoner-root', 'summoner-balanced')]
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def git(*args): return subprocess.check_output(['git', *args], cwd=REPO, text=True).strip()
def write(name, value):
    (OUT / name).write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
assert git('rev-parse', 'HEAD') == REVISION, 'Source revision changed; review/rebase the preparation'
assert not git('diff', '--name-only', 'HEAD', '--', 'shared/src', 'server/src', 'bot/src'), 'Dirty gameplay/route source'
live = read(EVIDENCE / 'live.json')
audit = read(EVIDENCE / 'ECONOMY_V2_STATIC_VALIDATION.json')
authority = read(EVIDENCE / 'authorities.json')
assert live['source'] == authority['source'] == REVISION
saved = read(REPO / 'reports/economy-v2/live.json')
assert {k:v for k,v in live.items() if k != 'source'} == {k:v for k,v in saved.items() if k != 'source'}, 'Delivered export differs from current source'
assert len(audit['checks']) == 108 and not audit['failures']
assert audit == read(REPO / 'reports/economy-v2/ECONOMY_V2_STATIC_VALIDATION.json'), 'Static audit changed'
OUT.mkdir(parents=True, exist_ok=True)
nodes = {n['id']: n for n in audit['nodes']}
def native(tier, biome):
    all_nodes = sorted(n['id'] for n in nodes.values() if n['tier'] == tier and n['biome'] == biome)
    eligible = [n for n in all_nodes if nodes[n]['family'] == authority['nativeModifiers'].get(biome)] or all_nodes
    return eligible[0] if eligible else None

# Union actual static-check endpoints with native biome chains. Dedup cells, retain all reasons.
selection = {}
pairs = {}
def add_node(tier, node, reason):
    assert nodes[node]['tier'] <= tier and live['NODE_BIOMES'][node]['kind'] == 'normal'
    selection.setdefault((tier, node), set()).add(reason)
def add_pair(tier, current, old, reason):
    assert nodes[current]['tier'] == tier and nodes[old]['tier'] < tier
    key = (tier, current, old)
    pairs.setdefault(key, set()).add(reason)
    add_node(tier, current, reason); add_node(tier, old, reason)
for check in audit['checks']:
    add_pair(check['tier'], check['current'], check['old'], f"static:{check['comparison']}:{check['work']}")
for tier in range(1, 5):
    for biome in sorted({n['biome'] for n in nodes.values() if n['tier'] == tier}):
        current = native(tier, biome)
        assert current, (tier, biome)
        add_node(tier, current, f'representative-current:{biome}:native-preferred-otherwise-node-id')
        for lower in range(1, tier):
            old = native(lower, biome)
            if old: add_pair(tier, current, old, f'native-chain:{biome}:T{lower}-T{tier}')
pair_rows = [dict(id=f'pair-{i+1:03}', playerTier=t, currentNode=c, lowerNode=o, reasons=sorted(reasons))
             for i, ((t,c,o), reasons) in enumerate(sorted(pairs.items()))]
rate_rows = []
for (tier,node), reasons in sorted(selection.items()):
    for actor,root,frame in ACTORS:
        rate_rows.append(dict(id=f'R1-T{tier}-{actor}-{node}', playerTier=tier, actor=actor, root=root,
            lineage=frame, stage='fresh-v2-earned-tier-entry', nodeId=node, contentTier=nodes[node]['tier'],
            reasons=sorted(reasons), inputSha256=None, durationSimulatedMs=1200000, rewardMultiplier=1,
            timeScale=1, status='not-run', readyToLaunch=False))

# Mature throughput can reverse entry economics; fixed mandatory set, independent of R1 results.
mature_pairs = set()
for tier in range(2, 5):
    for metric in ['E ', 'C ', 'same-biome X']:
        candidates = [c for c in audit['checks'] if c['tier'] == tier and c['comparison'].startswith(metric)]
        c = min(candidates, key=lambda c: (c['ratio']/c['target'], c['current'], c['old'], c['work']))
        mature_pairs.add((tier, c['current'], c['old']))
    mature_pairs.add((tier, native(tier,'mountain'), native(tier-1,'mountain')))
mature_nodes = sorted({(t,n) for t,c,o in mature_pairs for n in (c,o)})
mature_rows = [dict(id=f'R1M-T{t}-{a}-{n}', playerTier=t, actor=a, nodeId=n,
    stage='fresh-v2-earned-current-primary-plus3', inputSha256=None, durationSimulatedMs=1200000,
    rewardMultiplier=1, timeScale=1, status='not-run', readyToLaunch=False,
    xpRule='only-uncapped-at-entry-else-not-applicable-no-xp-reset') for t,n in mature_nodes for a,_,_ in ACTORS]

pacing = []
for tier in range(1,5):
    for actor,root,frame in ACTORS:
        for replica in [1,2]:
            pacing.append(dict(id=f'P-T{tier}-{actor}-r{replica}', tier=tier, actor=actor, root=root,
                lineage=frame, replica=replica, seed=None, exposure='independent-fresh-world',
                baselineRoute=f'{actor}-t{tier}'+('-mid' if tier==2 else '') if tier<=2 else None,
                compiledV2Route=None, inputSha256=None, timeScale=1, rewardMultiplier=1,
                zoneMasteryTargetMinutes=[5,15,30,60][tier-1],
                suggestedZoneReviewBandMinutes=[4,6] if tier==1 else [12,18] if tier==2 else [24,36] if tier==3 else [48,72],
                reviewBandStatus='analyst-triage-only-not-designer-approved',
                capSimulatedMs=86400000, capStatus='proposed-freeze-after-stage1',
                status='not-run', readyToLaunch=False))
write('rate-matrix.json', rate_rows)
write('matched-pairs.json', pair_rows)
write('mature-rate-matrix.json', mature_rows)
write('mature-pairs.json', [dict(playerTier=t,currentNode=c,lowerNode=o) for t,c,o in sorted(mature_pairs)])
write('pacing-matrix.json', pacing)
write('premium-matrix.json', [dict(id=f"PPLUS-T{p['tier']}-{p['actor']}-r{p['replica']}",
    tier=p['tier'],actor=p['actor'],replica=p['replica'],parentLife=p['id'],
    primaryItem=None,routeId=None,inputSha256=None,
    startCondition='core-boundary-complete-and-required-mastery-gates-available',
    capSimulatedMs={2:30,3:60,4:120}[p['tier']]*60000,
    timeScale=1,rewardMultiplier=1,status='not-run',readyToLaunch=False)
    for p in pacing if p['tier']>=2])
write('source-authorities.json', authority)
write('public-prices-and-gates.json', {k:live[k] for k in ['RECIPE_DATABASE','ABILITY_RECIPE_DATABASE',
    'RUNE_RECIPE_DATABASE','STANCE_RECIPE_DATABASE','RITE_RECIPE_DATABASE','upgrades','caps','GAME_CONFIG']})
write('route-gross-demand.json', dict(status='static-planned-demand-not-earned-input-budget',
    source=REVISION, includesConditionalAndOpportunisticPurchases=True,
    demand=audit['demand'], primaryItemAnchors=audit['anchors'],
    exactInputReconciliationRequired=True, laterTierFullBudgets=None))
write('node-inventory.json', audit['nodes'])
write('campaign.json', dict(schemaVersion=2,id='economy-baseline-campaign-02',
    source=dict(revision=REVISION,tree=git('rev-parse','HEAD^{tree}'),branch=git('branch','--show-current')),
    supersedesPlan='economy-baseline-campaign-01; preserve original artifacts',
    state='prepared-unsealed-not-launchable', scope='review-and-preparation-only', launched=False,
    rates=dict(entryCells=len(rate_rows),matureCells=len(mature_rows),matchedPairs=len(pair_rows),
        maturePairs=len(mature_pairs),simulatedMinutesPerCell=20,
        workerHours=(len(rate_rows)+len(mature_rows))/3),
    pacing=dict(lives=len(pacing),freezeAfter='stage1-review',targetsMinutes=[5,15,30,60],tierDurationTargets=None),
    comparisons=dict(orientation='current/lower',essenceAndUncappedXpMinimum=1.25,catalystMinimum=1.10,
        inversion='ratio<1',nearParity='ratio>=1 and ratio<1.10',
        zeroDenominator='positive/zero=unbounded;zero/zero=uninformative;missing=unavailable'),
    confirmations=dict(durationSimulatedMs=3600000,replicasPerPair=2,
        triggers=['any-inversion','any-below-v2-target','all-uncapped-same-biome-inversions'],
        nearMarginSampleMaximumPairs=8,selection='pass-margin ascending then pair-id',
        noAutomaticLaunch=True),
    schedule=dict(stage1Workers=2,stage2Workers=4,stage2NeedsResourceQualification=True,
        policy='R first; then one active P life per tier; shared global limit; no five-way launch'),
    inputPolicy='new earned candidate-revision lineage only; no historical save conversion or synthetic grants',
    upgradePolicy='retain T1; T2+ core +3 affordability and legal adoption; optional primary +5 sidecar',
    launchGates=['earned-inputs','fixed-profile-reward-ledger-adapter','restore-eligibility',
        'actual-input-route-and-budget-compilation','T3-T4-full-route-and-terminal-definition',
        'resource-and-clock-qualification','stage1-review-before-pacing-seal'] ))
evidence_files = [EVIDENCE / f for f in ['baseline.json','live.json','authorities.json','ECONOMY_V2_STATIC_VALIDATION.json']]
write('evidence-receipt.json', dict(source=REVISION,exportMatchesDeliveredApartFromSourceLabel=True,
    staticComparisons=108,staticFailures=0,files=[dict(path=str(p),sha256=sha(p)) for p in evidence_files],
    note='Reproduced locally; no dynamic economy measurements'))
files = sorted(p for p in OUT.glob('*.json') if p.name != 'preparation-hashes.json')
write('preparation-hashes.json', dict(scope='preparation-only-not-execution-seal',
    files=[dict(file=p.name,sha256=sha(p)) for p in files]))
assert len(rate_rows)==468 and len(mature_rows)==92 and len(pacing)==32
for rows in [rate_rows,mature_rows,pacing,read(OUT/'premium-matrix.json')]:
    assert len({r['id'] for r in rows}) == len(rows), 'Duplicate cell identity'
    assert all(r['status']=='not-run' and not r['readyToLaunch'] and
               r['timeScale']==r['rewardMultiplier']==1 for r in rows)
for c in audit['checks']:
    assert (c['tier'],c['current'],c['old']) in pairs, 'Missing static comparison pair'
for tier,current,old in pairs:
    for actor,_,_ in ACTORS:
        assert all(any(r['playerTier']==tier and r['actor']==actor and r['nodeId']==n for r in rate_rows)
                   for n in (current,old)), 'Missing entry pair endpoint'
for tier,current,old in mature_pairs:
    for actor,_,_ in ACTORS:
        assert all(any(r['playerTier']==tier and r['actor']==actor and r['nodeId']==n for r in mature_rows)
                   for n in (current,old)), 'Missing mature pair endpoint'
for tier in range(1,5):
    for actor,_,_ in ACTORS:
        assert {p['replica'] for p in pacing if p['tier']==tier and p['actor']==actor}=={1,2}
for receipt in read(OUT/'preparation-hashes.json')['files']:
    assert sha(OUT/receipt['file'])==receipt['sha256']
print(json.dumps(dict(out=str(OUT),entryCells=len(rate_rows),matureCells=len(mature_rows),
    entryPairs=len(pair_rows),maturePairs=len(mature_pairs),pacingLives=len(pacing),launched=False)))
