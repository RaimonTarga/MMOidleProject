import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verifySurvey} from './ttk-survey-verify.mjs';
const dir=mkdtempSync(join(tmpdir(),'night5-verifier-'));
const expected={trial:'night5',revision:'frozen',mode:'run',definitionsHash:'abc',hitboxesSha256:'def',seeds:[1],cells:1,runs:1};
const write=(n,v)=>writeFileSync(join(dir,n),JSON.stringify(v));
try{
 const {mkdirSync}=await import('node:fs');mkdirSync(join(dir,'case-s1'));
 write('manifest.json',{...expected,cells:[{id:'case'}]});write('complete.json',{cells:1,runs:1,mode:'run'});
 write('index.json',[{cell:'case',seed:1,outcome:'wall-ceiling'}]);
 for(const n of ['ready.json','summary.json','samples.jsonl','events.jsonl'])write(`case-s1/${n}`,{});
 assert.throws(()=>verifySurvey(dir,expected),/outcome/);
 const result=verifySurvey(dir,{...expected,allowCensored:true});assert.equal(result.censored,1);assert.equal(result.completeWindows,0);
 write('index.json',[{cell:'case',seed:1,outcome:'invented'}]);assert.throws(()=>verifySurvey(dir,{...expected,allowCensored:true}),/outcome/);
 write('index.json',[]);assert.throws(()=>verifySurvey(dir,{...expected,allowCensored:true}),/present/);
 console.log('night5 verifier: ok');
}finally{rmSync(dir,{recursive:true,force:true});}
