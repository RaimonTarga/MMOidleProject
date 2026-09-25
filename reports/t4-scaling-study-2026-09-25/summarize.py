"""Reconcile this exploratory study's terminal files and emit compact evidence tables."""
import hashlib
import json
from pathlib import Path
import subprocess

folder = Path(__file__).resolve().parent
root = folder.parents[1]
stages = ['probes', 'followup', 'farm', 'farm-followup', 'boss', 'structural', 'soft']
rows = []
receipts = []
for stage in stages:
    manifest = json.loads((folder / f'{stage}-manifest.json').read_text())
    complete = json.loads((folder / f'{stage}-complete.json').read_text())
    results = json.loads((folder / f'{stage}-results.json').read_text())
    assert complete['complete'] and complete['rows'] == len(results) == len(manifest['specs'])
    for index, result in enumerate(results):
        artifact = json.loads((folder / f'{stage}-{index}.json').read_text())
        assert artifact['result'] == result
        assert result['spec'] == manifest['specs'][index]
        assert result['outcome'] != 'wall-ceiling'
        if result['spec']['mode'] == 'probe':
            assert result['incoming'] == 0 and result['elapsedMs'] == result['spec']['durationMs']
            assert result['damage'] > 0
        if result['spec']['mode'] == 'boss':
            assert result['bossId'] and result['bossType']
        rows.append({'stage': stage, **result})
        receipts.append(artifact['receipt'])

repeats = {}
for row, receipt in zip(rows, receipts):
    spec = row['spec']
    if spec['arm'] != 'baseline':
        continue
    key = json.dumps({
        'path': spec['path'], 'plus': spec['plus'], 'seed': spec['seed'], 'mode': spec['mode'],
        'durationMs': spec['durationMs'], 'armor': spec.get('armor', False),
        'gear': receipt['cell']['build']['gearItemIds'],
        'abilities': receipt['cell']['abilities'], 'runes': receipt['cell']['runeRules'],
        'stance': receipt['cell']['stance'],
    }, sort_keys=True)
    fingerprint = {k: row[k] for k in ['damage', 'kills', 'elapsedMs', 'outcome', 'incoming']}
    if key in repeats:
        assert repeats[key]['fingerprint'] == fingerprint, (repeats[key], row)
        repeats[key]['copies'] += 1
    else:
        repeats[key] = {'fingerprint': fingerprint, 'copies': 1}

pairs = []
for row in rows:
    if row['spec']['arm'] == 'baseline':
        continue
    base_spec = {**row['spec'], 'arm': 'baseline'}
    baseline = next(r for r in rows if r['stage'] == row['stage'] and r['spec'] == base_spec)
    pairs.append({'stage': row['stage'], 'spec': row['spec'], 'baselineIndex': baseline['index'],
                  'candidateIndex': row['index'], 'dpsChangePct': (row['dps']/baseline['dps']-1)*100,
                  'baselineKills': baseline['kills'], 'candidateKills': row['kills'],
                  'baselineOutcome': baseline['outcome'], 'candidateOutcome': row['outcome'],
                  'baselineMs': baseline['elapsedMs'], 'candidateMs': row['elapsedMs']})

summary = {'observations': len(rows), 'stages': {s: sum(r['stage']==s for r in rows) for s in stages},
           'directHitProbes': len(json.loads((folder/'mitigation-probe.json').read_text())),
           'baselineRepeatComparisons': sum(r['copies']-1 for r in repeats.values()),
           'baselineRepeatComparisonsPassed': True, 'pairs': pairs}
(folder/'summary.json').write_text(json.dumps(summary, indent=2)+'\n')
lines = ['# Evidence tables', '', 'All DPS is fixture-specific. +0 uses mature mastery, not earned entry.', '',
         '| Stage / row | Spec | Arm | Upgrade | Weapon | Relic | DPS | Kills | Outcome | Seconds |',
         '|---|---|---|---:|---|---|---:|---:|---|---:|']
for row, receipt in zip(rows, receipts):
    spec=row['spec']; gear=receipt['cell']['build']['gearItemIds']
    lines.append(f"| {row['stage']}/{row['index']} | {spec['path']} | {spec['arm']} | +{spec['plus']} | {gear['weapon']} | {gear.get('relic','')} | {row['dps']:.1f} | {row['kills']} | {row['outcome']} | {row['elapsedMs']/1000:.1f} |")
(folder/'TABLES.md').write_text('\n'.join(lines)+'\n')

source_files = sorted([*root.glob('server/src/**/*.ts'), *root.glob('shared/src/**/*.ts'),
                       *root.glob('server/bench/balance/*.ts')])
hashes = {str(p.relative_to(root)).replace('\\','/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in source_files}
provenance = {'note': 'Source hashes captured at study close, not a pre-run seal. Repeated baseline outcomes checked separately. Exploratory, adaptive study.',
              'head': subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),
              'sharedEntry': 'shared/src/index.ts via --conditions=development',
              'status': subprocess.check_output(['git','status','--short'],cwd=root,text=True),
              'hitboxArtifact': 'D:/mmo-idle/volcano-heat-management-01/hitboxes.json',
              'hitboxSha256': hashlib.sha256(Path('D:/mmo-idle/volcano-heat-management-01/hitboxes.json').read_bytes()).hexdigest(),
              'sourceHashes': hashes}
(folder/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='pairs'},indent=2))
