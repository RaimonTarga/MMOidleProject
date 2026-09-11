import { GAME_CONFIG, emptyEquipment, advancePlayerPath, moverOverlapsBlockShapes, navigationBodyHalfExtents } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { setMovePath } from '../src/systems/world/pathMotion';
import { setEntityMotion, stopEntity, updateMovement } from '../src/systems/world/movement';
import { attachComponent } from '../src/ecs/markerHelpers';
import { predictAutoPath } from '../../client/src/render/autoPathPrediction';
function assert(v: unknown, message: string): asserts v { if (!v) throw new Error(message); }
function playerSlices(id: string, nodeId: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      attunedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: "cadence",
    },
  };
}


const world = new World();
const p = world.attachPlayerEntity(playerSlices('auto-smooth','node-t1-plains-01'),'auto-smooth');
p.hasPosition.speed = 120;
world.collision.blockShapes = () => [];
world.collision.staticRegions = () => [];
const points = Array.from({length:20},(_,i)=>({x:432+i*32,y:400}));
setMovePath(world,p,points[19],points,'player');
const route = p.hasMovePath;
let base = {...p.hasPosition.current};
let preview = p.isMoving!.pathPreview!;
for(let tick=0;tick<30;tick++) {
 const before=p.hasPosition.current.x;
 updateMovement(world,100,tick*100);
 assert(Math.abs(p.hasPosition.current.x-before-12)<1e-6,'auto consumes entire tick budget');
 assert(p.hasMovePath===route,'waypoint crossing preserves route');
 assert(!p.hasManualMoveIntent,'auto does not claim manual ownership');
 // Model 5 Hz snapshots and 60 Hz rendering with the real preview helper.
 if(tick%2===0) preview=p.isMoving!.pathPreview!;
 assert(preview.length<=9,'network preview is bounded');
 for(let frame=0;frame<6;frame++) {
  const next=predictAutoPath(base,preview,2,[],{x:22,y:18});
  assert(Math.abs(next.x-base.x-2)<1e-6,'render never waits at intermediate waypoint');
  base=next;
 }
}
stopEntity(world,p);
assert(!p.isMoving && !p.hasMovePath,'stop removes route and preview');
setEntityMotion(world,p,{x:1000,y:400},{mode:'direct'});
assert(!p.isMoving?.pathPreview,'direct movement clears preview');
attachComponent(world,p,'isRooted',{});
updateMovement(world,100,5000);
assert(!p.isMoving,'root stops auto movement');

const fast=world.attachPlayerEntity(playerSlices('fast-auto','node-t1-plains-01'),'fast-auto');
fast.hasPosition.speed=1000;
setMovePath(world,fast,{x:500,y:432},[{x:432,y:400},{x:432,y:432},{x:500,y:432}],'player');
updateMovement(world,100,5100);
assert(fast.hasPosition.current.x===468 && fast.hasPosition.current.y===432,'one tick crosses multiple corners with full budget');
updateMovement(world,100,5200);
assert(fast.hasPosition.current.x===500 && !fast.isMoving && !fast.hasMovePath,'auto finishes precisely without reissuing goal');

// Corners consume distance along the route, without shortcuts or snapshot rewind.
const corner=[{x:0,y:0},{x:32,y:0},{x:32,y:32},{x:64,y:32}];
let rendered={x:30,y:0};
rendered=predictAutoPath(rendered,corner,6,[],{x:0,y:0});
assert(rendered.x===32 && rendered.y===4,'frame carries budget around corner');
rendered=predictAutoPath(rendered,corner,6,[],{x:0,y:0});
assert(rendered.x===32 && rendered.y===10,'stale preview does not return to passed corner');
const end=predictAutoPath({x:64,y:32},corner,6,[],{x:0,y:0});
assert(end.x===64 && end.y===32,'preview endpoint holds without extrapolation');
const wall=[{kind:'rect' as const,x:32,y:16,halfW:10,halfH:2}];
const blocked=predictAutoPath(rendered,corner,20,wall,{x:0,y:0});
assert(blocked.y<14,'preview respects collision');

const mountain = new World();
const mp=mountain.attachPlayerEntity(playerSlices('mountain-smooth','node-t1-mountain-01'),'mountain-smooth');
mp.hasPosition.current={x:2520,y:1600};
setEntityMotion(mountain,mp,{x:1040,y:440});
const mountainRoute=mp.hasMovePath;
assert(mountainRoute,'mountain route exists');
const shapes=mountain.collision.blockShapes(mp.hasPosition.nodeId,'player');
const pad=navigationBodyHalfExtents('player');
for(let tick=0;tick<120;tick++) {
 const expected=advancePlayerPath(mp.hasPosition.current,mp.hasMovePath!.waypoints,mp.hasPosition.speed*.1,shapes,pad);
 updateMovement(mountain,100,tick*100);
 assert(Math.hypot(mp.hasPosition.current.x-expected.position.x,mp.hasPosition.current.y-expected.position.y)<1e-6,'auto follows continuous mountain route');
 assert(mp.hasMovePath===mountainRoute,'mountain route survives crossings without AI reissue');
 assert(!moverOverlapsBlockShapes(mp.hasPosition.current,shapes,pad),'mountain collision safety');
}
console.log('autoMovementSmoothness: ok');
