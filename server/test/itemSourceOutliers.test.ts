import { GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment, MONSTER_DATABASE, ITEM_DATABASE, applyStatusEffect, getStatusEffect, removeStatusEffect, getCounter, getCooldown, setCounter, CHAOTIC_HIT_COUNTER_KEY, estimatePlayerDps, itemMechanicEffectsAt, upgradeStatBonusTotal } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { attachComponent } from '../src/ecs/markerHelpers';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack, runMonsterAttack } from '../src/systems/combat/engine/combat';
import { updateReloadT3Ticks } from '../src/systems/classes/archetypes/reload/t3/ticks/laser';
import { updateChanneledBeam } from '../src/systems/classes/archetypes/cooldown/t3/ticks/heavy/channeledBeam';
import { equipItem } from '../src/systems/player/economy/inventory';
import { updateDefensiveSystems } from '../src/systems/defense';
import { runDebuffCleanse } from '../src/systems/defense/mitigation/debuffCleanse';
import { applyResistedPlayerDebuff } from '../src/systems/combat/status/debuffGuard';
import { applyPlatingShredStacks } from '../src/systems/combat/status/platingShred';
import { getAntiHealMult } from '../src/systems/defense/regen/healing';
initCombatSystems();
let serial = 0;
function fixture(archetype: 'cadence' | 'cooldown' | 'reload' | 'dot' | 'energy' | 'summoner' | null) {
  const id = `audit-${serial++}`;
  const world = new World();
  const slices: PersistedPlayerSlices = {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: GAME_CONFIG.PLAYER_RECOVERY },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [],
      questProgress: {}, playerTier: 4, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: archetype ? [`${archetype}-root`, `${archetype}-balanced`] : [],
      passives: {}, selectedClass: archetype ? `${archetype}-root` : null,
      selectedSubVariant: 'balanced', selectedRange: null, combatArchetype: archetype,
    },
  };
  const player = world.attachPlayerEntity(slices, id);
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  return { world, player };
}
function targetFor(world: World) {
  const target = world.createMonster('node-clearing', 'plains-slime', { x: 410, y: 400 });
  if (!target) throw new Error('missing target');
  target.hasHealth.hp = target.hasHealth.maxHp = 1000000;
  target.mitigatesDamage.plating = target.mitigatesDamage.damageReduction = 0;
  return target;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function eq(actual: number, expected: number, message: string) {
  assert(Math.abs(actual - expected) < 1e-8, `${message}: got ${actual}, expected ${expected}`);
}
const attack = (world: World, player: ReturnType<typeof fixture>['player'], target: ReturnType<typeof targetFor>) =>
  runPlayerAttack(world, player, target, 1000, { attackOrigin: player.hasPosition.current, aggroSource: { id: player.isPlayer.id, kind: 'player' } });



function equip(world: World, player: ReturnType<typeof fixture>['player'], id: string) {
  player.holdsInventory.inventory.push(id);
  assert(equipItem(world, player, id), 'equip '+id);
}

// Actual armor -> stat rebuild -> defense update; buffs and immune effects survive.
{
  const {world,player}=fixture(null);
  equip(world,player,'desert-vest-t4');
  for(const [id,data] of [
    ['sunlight',{attackPct:.25}], ['mob-forest-haste',{speedPct:.4}],
    ['volcanic-heat',{isAmbientRamp:1,damageTakenPct:.03}],
    ['cave-lockdown',{speedMult:0}], ['antiheal',{reductionPerStack:.2}],
    ['tundra-chill',{isAmbientRamp:1}], ['monster-dot:test',{isDot:1}],
  ] as [string,Record<string,number>][]) {
    for(let i=0;i<3;i++) applyStatusEffect(player.tracksCombat,{id,sourceId:'test',maxStacks:10,remainingMs:5000,data});
  }
  updateDefensiveSystems(world,100,100);
  for(const id of ['sunlight','mob-forest-haste','volcanic-heat','cave-lockdown','monster-dot:test'])
    eq(getStatusEffect(player.tracksCombat,id)!.stacks,3,id+' untouched');
  eq(getStatusEffect(player.tracksCombat,'antiheal')!.stacks,1,'armor cleanses harmful stack count');
  eq(getStatusEffect(player.tracksCombat,'tundra-chill')!.stacks,1,'armor respects partial cleanse');
  eq(getCooldown(player.tracksCombat,'cleanse'),8000,'independent armor clock');
  runDebuffCleanse(world,player);
  eq(getStatusEffect(player.tracksCombat,'antiheal')!.stacks,1,'no repeated pulse while on cooldown');
}

// Real monster hit riders receive equipment resistance; repeated applications do not compound it.
{
  const id='test-item-outlier-monster';
  const original=MONSTER_DATABASE.get('plains-slime')!;
  MONSTER_DATABASE.set(id,{...original,id,name:'Audit debuffer',
    slowEffect:{speedMult:.5,durationMs:5000},
    appliesAntiheal:{reductionPerStack:.2,maxStacks:5,durationMs:5000},
    appliesVulnerability:{damageTakenPct:.3,maxStacks:5,durationMs:5000},
    rampDebuff:{moveSlowPerHit:.1,moveSlowMaxPct:.5,atkSlowPerHit:.1,atkSlowMaxPct:.5,stackDurationMs:5000},
  });
  try {
    const {world,player}=fixture(null);
    equip(world,player,'desert-vest-t4');
    if (player.evadesHits) player.evadesHits.dodgeRate=0;
    player.hasHealth.hp=player.hasHealth.maxHp=100000;
    const monster=world.createMonster('node-clearing',id,{x:410,y:400})!;
    runMonsterAttack(world,monster,player,1000);
    const cs=player.tracksCombat;
    eq(getStatusEffect(cs,'slow')!.data.speedMult,.65,'50% slow reduced to 35%');
    eq(getStatusEffect(cs,'slow')!.data.totalMs,5000,'duration is not reduced');
    eq(getStatusEffect(cs,'antiheal')!.data.reductionPerStack,.14,'antiheal severity');
    eq(getAntiHealMult(cs),.86,'healing consumes resisted antiheal');
    eq(getStatusEffect(cs,'sundered')!.data.damageTakenPct,.21,'vulnerability severity');
    eq(getStatusEffect(cs,'frost-ramp')!.data.moveSlowMaxPct,.35,'ramp cap reduced, not merely per-hit ramp');
    runMonsterAttack(world,monster,player,1100);
    eq(getStatusEffect(cs,'antiheal')!.data.reductionPerStack,.14,'second hit does not resist twice');
    eq(getAntiHealMult(cs),.72,'stack count preserved');
    const shredDef={...original,appliesPlatingShred:{platingPerStack:3,maxStacks:5}};
    applyPlatingShredStacks(world,monster,player,shredDef,1);
    eq(getStatusEffect(cs,'plating-shred')!.data.platingPerStack,2.1,'corrosion resistance');
    removeStatusEffect(cs,'slow');
    applyResistedPlayerDebuff(player,{id:'slow',sourceId:id,remainingMs:2000,data:{speedMult:0,totalMs:2000}});
    eq(getStatusEffect(cs,'slow')!.data.speedMult,0,'root remains root');
    removeStatusEffect(cs,'slow');
    applyResistedPlayerDebuff(player,{id:'slow',sourceId:id,remainingMs:2000,data:{speedMult:.5,isGroundZone:1,totalMs:2000}});
    eq(getStatusEffect(cs,'slow')!.data.speedMult,.5,'environmental slow keeps its own counterplay');
    applyResistedPlayerDebuff(player,{id:'monster-dot:audit',sourceId:id,data:{isDot:1,damagePerStack:10}});
    eq(getStatusEffect(cs,'monster-dot:audit')!.data.damagePerStack,10,'DoT is not debuff resistance');
  } finally { MONSTER_DATABASE.delete(id); }
}

// Real equipped Axe: each third channel tick pays the same dead hit as a basic attack.
for(const mode of ['normal','laser','beam'] as const) {
  const {world,player}=fixture(mode==='laser'?'reload':mode==='beam'?'cooldown':null);
  equip(world,player,'graveyard-plague-axe');
  const target=targetFor(world);
  player.dealsDamage.attack=100;
  player.dealsDamage.onHitDamage=20;
  // Control the damage basis; keep the actual equipped weapon's interval and vulnerability rider.
  if(mode==='laser') Object.assign(player.usesSkills.passives,{'reload.laser':1,'reload.laser-damage-per-tick-pct':1});
  if(mode==='beam') {
    player.usesSkills.passives['cooldown.channeled-beam-mult']=1;
    player.usesSkills.passives['cooldown.beam-tick-ms']=100;
    attachComponent(world,player,'isChanneling',{remainingMs:10000,nextTickMs:0,targetId:target.isMonster.id,pct:0});
  }
  const losses:number[]=[];
  for(let i=0;i<3;i++) {
    const hp=target.hasHealth.hp;
    if(mode==='laser') updateReloadT3Ticks(world,100,1000+i*100);
    else if(mode==='beam') updateChanneledBeam(world,100,1000+i*100);
    else attack(world,player,target);
    losses.push(hp-target.hasHealth.hp);
  }
  assert(losses[0]>0&&losses[1]>0,mode+' first two hits deal damage');
  eq(losses[2],0,mode+' dead hit suppresses direct AND flat on-hit damage');
  eq(getCounter(player.tracksCombat,CHAOTIC_HIT_COUNTER_KEY),3,mode+' progression');
  assert(getStatusEffect(target.tracksCombat,'vulnerability'),mode+' dead swing still applies its rider');
  if(mode==='laser') assert(player.usesReload!.laserHeat>0,'dead laser tick still spends heat');
}
// No target: channel state updates must not secretly spend a swing.
{
  const {world,player}=fixture('reload');
  equip(world,player,'chaotic-axe');
  player.usesSkills.passives['reload.laser']=1;
  updateReloadT3Ticks(world,100,1000);
  eq(getCounter(player.tracksCombat,CHAOTIC_HIT_COUNTER_KEY),0,'idle laser does not spend swing');
}
// A cancelled ordinary attack must not commit the prepared dead swing.
{
  const {world,player}=fixture('reload');
  equip(world,player,'chaotic-axe');
  const target=targetFor(world);
  player.usesReload!.reloadingMs=1000;
  setCounter(player.tracksCombat,CHAOTIC_HIT_COUNTER_KEY,2);
  attack(world,player,target);
  eq(getCounter(player.tracksCombat,CHAOTIC_HIT_COUNTER_KEY),2,'cancelled attack retains progress');
}
// Preview stays consistent with the newly paid channel drawback.
{
  const base={attack:100,onHitDamage:20,attackCooldownMs:1000,archetype:'reload',passives:{'reload.laser':1,'reload.laser-damage-per-tick-pct':1},playerTier:4};
  const normal=estimatePlayerDps(base);
  const axe=estimatePlayerDps({...base,passives:{...base.passives,'weapon.dead-swing-interval':3}});
  assert(Math.abs(axe.total / normal.total - 2/3) < .001,'laser sheet pays dead tick (rounded display)');
}
// Requested conservative authored budgets (not simulated balance conclusions).
for(const [id,speed] of [['desert-boots-t2',113],['desert-boots-t3',157],['desert-boots-t4',209]] as const) {
  const item=ITEM_DATABASE.get(id)!;
  eq(item.statModifiers.speed+upgradeStatBonusTotal(item,5).speed,speed,id+' completed speed');
}
{
  const item=ITEM_DATABASE.get('graveyard-charm-t4-gravetide')!;
  const p=itemMechanicEffectsAt(item,5);
  const mean=item.statModifiers.recovery*(p['defense.recovery-active-pct']+p['defense.recovery-pulse-pct']*.5);
  eq(mean,2.88,'Grave-Tide retains smoothing and clears predecessor item-only mean');
}
console.log('itemSourceOutliers: ok');
