// Zero World ticks: production composition and profile resolver boundary readbacks.
import {writeFileSync} from 'node:fs';
import {composePlayerView,SKILL_TREE,resolveSummonerProfile} from '@mmo-idle/shared';
import {createBalanceWorld} from '../bench/balance/worldFactory';
import {materializeBot} from '../bench/balance/botFactory';
const spirit:any[]=[];
for(const tier of [1,2,3,4])for(const frame of tier===1?[null]:['light','balanced','heavy']){
 const skillPath=['energy-root',...(frame?[`energy-${frame}`]:[]),...(tier>=3?['energy-range-mid']:[]),...(tier>=4?[`energy-${frame}-t3-a`]:[])];
 const world=createBalanceWorld();const bot=materializeBot(world,{id:'boundary',classRoot:'energy-root',contentTier:tier,playerTier:tier,gearTier:1,skillPath,gearItemIds:{weapon:'chaotic-axe',armor:'plains-vest-t1',recovery:'mountain-charm-t1',mobility:'swamp-boots-t1'}},{nodeId:'node-t1-plains-03',biomeGroup:'plains',contentTier:1,isDungeon:false},{x:100,y:100});
 const v=composePlayerView(bot)!;
 spirit.push({tier,frame,skillPath,stats:bot.dealsDamage,view:v,energy:bot.usesEnergy,authored:skillPath.map(id=>({id,statEffects:SKILL_TREE.get(id)!.statEffects,mechanicEffects:SKILL_TREE.get(id)!.mechanicEffects}))});
}
const conduit:any[]=[];
for(const frame of [null,'light','balanced','heavy'] as const)for(const range of [null,'close','mid','far'])for(const suffix of frame?[null,'a','b','c']:[null]){
 const unlockedSkills=suffix?[`summoner-${frame}-t3-${suffix}`]:[];
 conduit.push({frame,range,suffix,profile:resolveSummonerProfile({selectedSubVariant:frame,selectedRange:range?`summoner-range-${range}`:null,unlockedSkills})});
}
writeFileSync(process.argv[2],JSON.stringify({worldTicks:0,spirit,conduit},null,2)+'\n');
