import {readFileSync} from 'node:fs';
import {runicPointLoadoutCost,runeBudgetForGlobalMastery,globalMastery,biomeLevelCap} from '../../shared/src/index';
const rows=JSON.parse(readFileSync(new URL('./iteration-02/historical-survivors.json',import.meta.url),'utf8'));
for(const {cell:c} of rows) {
 if(c.tier!==4||!c.nodeId.includes('volcanic'))continue;
 const levels={...c.progressionSnapshot.mastery};levels.volcanic=biomeLevelCap(3,'volcanic');
 const rp=runicPointLoadoutCost({rules:c.runeRules,abilities:c.abilities,stances:[c.stance,...(c.additionalStances??[])].filter(Boolean),rites:[]});
 const budget=runeBudgetForGlobalMastery(globalMastery(levels));
 if(rp<=budget)console.log(JSON.stringify({id:c.id,rp,budget}));
}
