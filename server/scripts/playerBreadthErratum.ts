import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { supportedLegacyFormation } from '../bench/balance/conduitRecorder';
const args=Object.fromEntries(process.argv.slice(2).map(x=>{const i=x.indexOf('=');return [x.slice(2,i),x.slice(i+1)];}));
assert(args.samples && args.out);
const raw=readFileSync(args.samples,'utf8');
const samples=raw.trim().split(/\r?\n/).map(line=>JSON.parse(line));
const availability=supportedLegacyFormation(samples);
assert.equal(availability.livingBodyCounts,null,'Erratum is specific to unsupported historical boss schema');
const originalPath=resolve('../reports/player-fast-pass/package-fit-run-01-review/diagnostics/conduit-detail.json');
const original=readFileSync(originalPath);
const corrected=JSON.parse(original.toString());
const row=corrected.find((r:{candidateId:string})=>r.candidateId==='pfit-r1-t4-conduit-boss');
row.conduit.formation.activeBodyDistribution=null;
row.conduit.formation.emptySamples=null;
row.conduit.formation.distinctSpawnedIds=null;
row.conduit.formation.unavailableReason=availability.unavailableReason;
row.conduit.targetPersistence.targetSwitches=null;
row.conduit.targetPersistence.emptyTargetSamples=null;
row.conduit.targetPersistence.unavailableReason='Historical boss schema does not record owner target IDs.';
row.conduit.ownerMovement.intentDistribution=null;
row.conduit.ownerMovement.intentUnavailableReason='Historical boss schema does not record autoIntent.';
const out=resolve(args.out);mkdirSync(out,{recursive:true});
writeFileSync(join(out,'conduit-detail-corrected.json'),JSON.stringify(corrected,null,2)+'\n');
writeFileSync(join(out,'erratum.json'),JSON.stringify({caseId:row.candidateId,measuredCommit:'291702d5397aa5c24d2c77ac2557e3122a815a37',
  originalPath:'reports/player-fast-pass/package-fit-run-01-review/diagnostics/conduit-detail.json',
  originalSha256:createHash('sha256').update(original).digest('hex'),rawSamplesSha256:createHash('sha256').update(raw).digest('hex'),
  sampleCount:samples.length,sampleFields:Object.keys(samples[0]),availability,
  reason:'Absent schema fields were incorrectly defaulted to zero/empty. Original evidence retained. No combat replay; kill time and supported damage events are unchanged.'},null,2)+'\n');
console.log('Historical nullability erratum written; original unchanged.');
