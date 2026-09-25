import { getResource, setResource } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { isPlayerActivelyInCombat } from '../../combat/ai/engagement';
import { registerCombatListener } from '../../combat/engine/combatPipeline';

const WINDOW='engagementDrRemainingMs', QUIET='engagementDrQuietMs', USED='engagementDrUsed';
export function getEngagementDrRemaining(player:PlayerEntity):number{return getResource(player.tracksCombat,WINDOW);}
function engage(player:PlayerEntity):void{
 const cs=player.tracksCombat;
 if((player.usesSkills.passives['defense.engagement-dr-pct']??0)<=0)return;
 if(!getResource(cs,USED)){setResource(cs,WINDOW,player.usesSkills.passives['defense.engagement-dr-ms']??4000);setResource(cs,USED,1);}
 setResource(cs,QUIET,0);
}
export function registerEngagementDr():void{
 registerCombatListener('onAttack',ctx=>{if(ctx.defenderType==='player')engage(ctx.defender);if(ctx.attackerType==='player')engage(ctx.attacker);});
 registerCombatListener('onDamageTaken',ctx=>{if(ctx.defenderType!=='player'||ctx.metadata.isDot)return;engage(ctx.defender);if(getEngagementDrRemaining(ctx.defender)>0)ctx.damage*=1-Math.min(.75,ctx.defender.usesSkills.passives['defense.engagement-dr-pct']??0);});
}
export function updateEngagementDr(world:World,player:PlayerEntity,dt:number):void{
 const cs=player.tracksCombat;
 setResource(cs,WINDOW,Math.max(0,getResource(cs,WINDOW)-dt));
 // Owner engagement includes hostiles targeting its living summons.
 const active=isPlayerActivelyInCombat(world,player)||[...world.minionEntities].some(m=>m.isMinion.ownerPlayerId===player.isPlayer.id&&m.hasHealth.hp>0&&m.hasAttackTarget!==undefined);
 // A selected target holds the engagement open but does not spend the opening
 // window during approach. The first confirmed attack starts protection.
 if(active){setResource(cs,QUIET,0);return;}
 const quiet=getResource(cs,QUIET)+dt;setResource(cs,QUIET,quiet);
 if(quiet>=6000)setResource(cs,USED,0);
}
