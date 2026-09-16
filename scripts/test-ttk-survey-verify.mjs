import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifySurvey } from './ttk-survey-verify.mjs';
const dir=mkdtempSync(join(tmpdir(),'survey-verify-test-'));
try {
  const expected={trial:'example',revision:'abc',definitionsHash:'ABC',hitboxesSha256:'DEF',mode:'run',cells:1,runs:1,seeds:[173]};
  const manifest={...expected,definitionsHash:'abc',hitboxesSha256:'def',cells:[{id:'example'}]};
  const write=(file,value)=>writeFileSync(join(dir,file),JSON.stringify(value));
  write('manifest.json',manifest);write('complete.json',{cells:1,runs:1,mode:'run'});
  write('index.json',[{cell:'example',seed:173,outcome:'window-ended'}]);
  mkdirSync(join(dir,'example-s173'));
  for(const file of ['ready.json','summary.json','events.jsonl','samples.jsonl'])write('example-s173/'+file,{});
  assert.equal(verifySurvey(dir,expected).verified,true);
  assert.throws(()=>verifySurvey(dir,{...expected,revision:'wrong'}),/revision: expected "wrong", got "abc"/);
  assert.throws(()=>verifySurvey(dir,{...expected,seeds:[947]}),/seeds:/);
  write('index.json',[{cell:'example',seed:173,outcome:'wall-ceiling'}]);
  assert.throws(()=>verifySurvey(dir,expected),/outcome/);
  write('index.json',[{cell:'example',seed:173,outcome:'player-died'},{cell:'example',seed:173,outcome:'player-died'}]);
  assert.throws(()=>verifySurvey(dir,expected),/duplicate/);
} finally { rmSync(dir,{recursive:true,force:true}); }
console.log('survey verification: ok');
