import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { chargeReady } from '../src/systems/combat/engine/monsterMechanics';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
const BRUISER_IDS = ['cave-brute', 'cave-troll', 'cavern-troll'];
const NOW = 1_000;

for (const typeId of BRUISER_IDS) {
  const def = MONSTER_DATABASE.get(typeId);
  assert(!!def?.chargedAttack, `${typeId} should define a charged attack`);
  assert(
    def!.chargedAttack!.initialCooldownMs === 0,
    `${typeId} should start its charged attack ready`,
  );

  const world = new World();
  const monster = world.createMonster(NODE, typeId, { x: 400, y: 400 });
  assert(!!monster, `test needs a ${typeId}`);
  setAggroTarget(world, monster!, { id: `${typeId}-target`, kind: 'player' }, NOW);
  assert(
    chargeReady(monster!, NOW, def!.chargedAttack!.initialCooldownMs!),
    `${typeId} charged attack should be ready when combat starts`,
  );
}

console.log('cave brute opener tests passed');
