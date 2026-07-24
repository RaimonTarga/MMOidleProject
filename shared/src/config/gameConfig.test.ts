import {
  GAME_CONFIG,
  nodeSceneBounds,
  peekSceneBounds,
} from './gameConfig';
import { WORLD_NODE_LIST, worldNodeExits } from '../world/nodeBiomes';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const W = GAME_CONFIG.NODE_WIDTH;
const H = GAME_CONFIG.NODE_HEIGHT;

function testNodeSceneBounds(): void {
  const bounds = nodeSceneBounds();
  assert(bounds.x === 0, 'nodeSceneBounds x');
  assert(bounds.y === 0, 'nodeSceneBounds y');
  assert(bounds.width === W, 'nodeSceneBounds width');
  assert(bounds.height === H, 'nodeSceneBounds height');
}

function testPeekSceneBoundsCenter(): void {
  const vw = 800;
  const vh = 600;
  const bounds = peekSceneBounds('node-clearing', vw, vh);
  const peekW = vw / 2;
  const peekH = vh / 2;

  assert(bounds.x === -peekW, 'center node west peek');
  assert(bounds.y === -peekH, 'center node north peek');
  assert(bounds.width === W + peekW * 2, 'center node width');
  assert(bounds.height === H + peekH * 2, 'center node height');
}

function testPeekSceneBoundsCorner(): void {
  const vw = 1000;
  const vh = 800;
  const cornerNode = WORLD_NODE_LIST.find((node) => {
    if (node.regionId !== 't1' || node.kind !== 'normal') return false;
    const exits = worldNodeExits(node.id);
    return !exits.west && !exits.north && Boolean(exits.east && exits.south);
  });
  assert(Boolean(cornerNode), 'T1 has a northwest corner node');
  if (!cornerNode) throw new Error('unreachable');
  const bounds = peekSceneBounds(cornerNode.id, vw, vh);
  const peekW = vw / 2;
  const peekH = vh / 2;

  assert(bounds.x === 0, 'corner NW has no west peek');
  assert(bounds.y === 0, 'corner NW has no north peek');
  assert(bounds.width === W + peekW, 'corner NW east peek only');
  assert(bounds.height === H + peekH, 'corner NW south peek only');
}

function testPeekSceneBoundsEdge(): void {
  const vw = 1200;
  const vh = 900;
  const edgeNode = WORLD_NODE_LIST.find((node) => {
    if (node.regionId !== 't1' || node.kind !== 'normal') return false;
    const exits = worldNodeExits(node.id);
    return !exits.west && Boolean(exits.north && exits.east && exits.south);
  });
  assert(Boolean(edgeNode), 'T1 has a west-edge node');
  if (!edgeNode) throw new Error('unreachable');
  const bounds = peekSceneBounds(edgeNode.id, vw, vh);
  const peekW = vw / 2;
  const peekH = vh / 2;

  assert(bounds.x === 0, 'west edge has no west peek');
  assert(bounds.y === -peekH, 'west edge north peek');
  assert(bounds.width === W + peekW, 'west edge east peek only');
  assert(bounds.height === H + peekH * 2, 'west edge north+south peek');
}

testNodeSceneBounds();
testPeekSceneBoundsCenter();
testPeekSceneBoundsCorner();
testPeekSceneBoundsEdge();
console.log('gameConfig.test.ts: all passed');
