import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../..');
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const sources={};
for(const [arm,folder] of [['baseline',root],['candidate',resolve(root,'../mmo-reward-candidate')]]) {
  const files=execFileSync('git',['ls-files','shared/src','server/src','server/bench/balance','server/bench/harness.ts'],{cwd:folder,encoding:'utf8'}).trim().split(/\r?\n/);
  const hashes=Object.fromEntries(files.map(p=>[p,sha(resolve(folder,p))]));
  sources[arm]={folder,head:execFileSync('git',['rev-parse','HEAD'],{cwd:folder,encoding:'utf8'}).trim(),combinedSha256:createHash('sha256').update(JSON.stringify(hashes)).digest('hex'),files:hashes};
}
writeFileSync(resolve(here,'bot-source-identities.json'),JSON.stringify({recordedAt:new Date().toISOString(),sources,hitboxSha256:sha(resolve(root,'server/dist/hitbox/baked-hitboxes.json')),harnesses:Object.fromEntries(['run-bot.ts','run-bot-supported.ts','run-bot-final.ts'].map(p=>[p,sha(resolve(here,p))]))},null,2)+'\n');
console.log('Recorded baseline/candidate gameplay source, benchmark and hitbox hashes.');

