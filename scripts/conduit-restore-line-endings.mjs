// Reproduce the original raw-byte seal after Git normalizes mixed newlines.
// Refuse any content change: only newline layout with the exact expected hash is written.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');return [a.slice(2,i),a.slice(i+1)];}));
assert(args.source&&args.layout);
const root=resolve(args.source),layout=JSON.parse(readFileSync(args.layout,'utf8'));
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),layout.sourceCommit);
const sha=b=>createHash('sha256').update(b).digest('hex');
const pending=[];
for(const [p,row] of Object.entries(layout.files)) {
  const dest=resolve(root,p);assert(dest.startsWith(root+sep));
  const original=readFileSync(dest);if(sha(original)===row.sha256) continue;
  const normal=Buffer.from(original.toString('utf8').replaceAll('\r\n','\n'));
  assert.equal(sha(normal),row.normalizedSha256,`Content differs: ${p}`);
  const mask=Buffer.from(row.crlfMask,'base64'),parts=[];let start=0,line=0;
  for(let at=0;at<normal.length;at++) if(normal[at]===10) {
    parts.push(normal.subarray(start,at),Buffer.from(mask[line>>3]&(1<<(line&7))?'\r\n':'\n'));
    start=at+1;line++;
  }
  parts.push(normal.subarray(start));const restored=Buffer.concat(parts);
  assert.equal(sha(restored),row.sha256,`Cannot reproduce seal: ${p}`);
  pending.push([dest,restored]);
}
for(const [dest,bytes] of pending) writeFileSync(dest,bytes);
console.log(`Restored ${pending.length} newline layouts; run the original byte-seal verifier next.`);
