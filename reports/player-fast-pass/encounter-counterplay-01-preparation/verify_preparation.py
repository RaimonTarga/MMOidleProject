"""Read-only compact receipt verification; never starts a World or launches combat."""
import copy
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parent
def read(path):
    return json.loads((root / path).read_text())
def digest(path):
    return hashlib.sha256((root / path).read_bytes()).hexdigest()

manifest = read('packet/manifest.json')
cells = manifest['cases']
receipts = {r['observationId']: r['ready'] for r in read('qualification/resolved-builds.json')}
historical = {r['observationId']: r['ready'] for r in read('historical-reference-receipts.json')}
assert len(cells) == len(receipts) == 24
assert len(historical) == 12
assert read('qualification/resolved-builds.json') == read('receipt-check/resolved-builds.json')
for mode in ['qualification', 'receipt-check']:
    assert read(mode + '/complete.json')['qualified'] == 24
    assert read(mode + '/complete.json')['combatObservations'] == 0
for name, expected in read('packet/seal.json').items():
    assert digest('packet/' + name) == expected
identity = read('packet/identity.json')
assert identity['control'] == identity['candidate']
assert identity['control']['sourceCommit'] == '7c3bf6bc0035feff0c0e432b4cda4a4e804281ad'
checks = []
for i in range(0, 24, 2):
    pair = cells[i:i+2]
    assert pair[0]['seed'] == pair[1]['seed']
    assert pair[0]['arm'] == ('control' if pair[0]['seed'] == 101009 else 'candidate')
    a = next(c for c in pair if c['arm'] == 'control')
    b = next(c for c in pair if c['arm'] == 'candidate')
    expected = copy.deepcopy(a)
    for key in ['id', 'arm']:
        expected[key] = b[key]
    expected['build']['id'] = b['build']['id']
    block = a['block']
    if block in ['J1', 'J2']:
        expected['build']['gearItemIds']['armor'] = 'mountain-vest-t3'
    elif block == 'V1':
        expected['stance'] = 'defensive-stance'
    elif block == 'P1':
        expected['abilities']['guards'].append('brace')
    elif block == 'M1':
        expected['abilities']['guards'].append('endure')
    elif block == 'E1':
        expected['abilities']['techniques'] = ['detonate']
        rules = expected['runeRules']
        j = next(j for j, rule in enumerate(rules) if rule.get('targetAbilityId') == 'brace')
        rules[j] = {'conditionId':'target-max-stacks', 'actionId':'use-ability', 'targetAbilityId':'detonate'}
    assert expected == b, (block, 'undeclared treatment difference')
    base = receipts[a['id']]['packageReadback']
    old = historical[a['referenceObservationId']]['packageReadback']
    for key in ['declared', 'equipment', 'mastery', 'skillPath', 'progression', 'runicPoints']:
        assert base[key] == old[key], (a['id'], key)
    for c in pair:
        ready = receipts[c['id']]
        package = ready['packageReadback']
        assert ready['view']['hp'] == ready['view']['maxHp']
        assert package['runicPoints']['cost'] <= package['runicPoints']['budget']
        assert package['progression']['snapshot'] == c['progressionSnapshot']
        assert package['declared']['abilities'] == c['abilities']
        assert package['declared']['stance'] == c['stance']
        assert package['declared']['runeRules'] == c['runeRules']
        if block in ['J1', 'J2']:
            assert package['equipment']['itemUpgrades'][c['build']['gearItemIds']['armor']] == 3
        checks.append({'id':c['id'],'rp':package['runicPoints'], 'maxHp':ready['view']['maxHp'], 'plating':ready['view']['plating']})
current, previous = read('spirit-readbacks.json'), read('pre-adoption-readbacks.json')
assert current['conduit'] == previous['conduit']
for now, old in zip(current['spirit'], previous['spirit']):
    if now['frame'] in [None, 'heavy']:
        assert now == old
    else:
        for row in now['authored']:
            if row['id'] == 'energy-light':
                assert row['statEffects']['attackPct'] == .02
                assert row['statEffects']['attackSpeedPct'] == .04
            if row['id'] == 'energy-balanced':
                assert row['statEffects']['attackPct'] == .03
                assert row['statEffects']['attackSpeedPct'] == 0
assert len(read('t4-catalogue.json')['identities']) == 54
print(json.dumps({'passed':True,'packages':24,'historicalControlsExact':12,'receiptReplaysExact':24,'combatObservations':0,'checks':checks}, indent=2))
