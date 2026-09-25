import ts from 'typescript';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const target=resolve(process.argv[2]);
const proposal=JSON.parse(readFileSync(resolve(here,process.argv.includes('--live-t1')?'candidate-costs-live-t1.json':'candidate-costs.json'),'utf8'));
const proposed=new Map(proposal.recipes.map(r=>[r.id,r]));
let count=0;
const folder=resolve(target,'shared/src/data/recipes');
for(const file of readdirSync(folder).filter(f=>f.endsWith('.recipes.ts'))) {
  const path=resolve(folder,file), source=readFileSync(path,'utf8');
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
  const edits=[];
  const prop=(node,name)=>node.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(ast)===name)?.initializer;
  function visit(node) {
    if(ts.isObjectLiteralExpression(node)) {
      const id=prop(node,'id');
      const candidate=id&&ts.isStringLiteral(id)?proposed.get(id.text):undefined;
      if(candidate) {
        const upgrades=prop(node,'upgrades');
        if(!upgrades||!ts.isArrayLiteralExpression(upgrades)||upgrades.elements.length!==5) throw Error(`Bad upgrades ${id.text}`);
        upgrades.elements.forEach((step,i)=>{
          const cost=prop(step,'cost'); if(!cost) throw Error('Missing cost');
          edits.push({start:cost.getStart(ast),end:cost.getEnd(),text:JSON.stringify(candidate.steps[i])});
        }); count++;
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);
  if(edits.length) {
    let updated=source;
    for(const e of edits.sort((a,b)=>b.start-a.start)) updated=updated.slice(0,e.start)+e.text+updated.slice(e.end);
    writeFileSync(path,updated);
  }
}
if(count!==117) throw Error(`Expected 117 recipes, got ${count}`);
if(process.argv.includes('--recipes-only')) {console.log(`Applied ${count} recipe schedules only.`);process.exit(0);}
const configPath=resolve(target,'shared/src/config/gameConfig.ts');
let config=readFileSync(configPath,'utf8');
for(const [before,after] of [
  ['[0, 1_750, 5_000, 7_000, 9_000]','[0, 6_000, 18_000, 42_000, 108_000]'],
  ['1.0, 2.0, 0.85, 0.70, 0.55,','1.0, 1.8, 0.765, 0.63, 0.495,'],
  ['{ 1: 0.5 } as Readonly<Record<number, number>>','{ 1: 0.5, 2: 5 / 18, 3: 1 / 6, 4: 1 / 12 } as Readonly<Record<number, number>>'],
]) { if(!config.includes(before)) throw Error(`Missing anchor ${before}`); config=config.replace(before,after); }
writeFileSync(configPath,config);
console.log(`Applied ${count} recipe schedules and tier controls to ${target}`);
