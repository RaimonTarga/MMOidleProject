import type Phaser from 'phaser';
import { NODE_FEATURES, resolveFeatureShape } from '@mmo-idle/shared';
import { drawMountainElevation } from '../../client/src/render/mountainLedges';
import { mountainCornerImage } from '../../client/src/render/mountainCornerTextures';

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const textures = new Set<string>();
let bakes = 0, disposedGraphics = 0;
const bakeCommands: Array<{ name: string; args: number[] }> = [];
const images: Array<{ x: number; y: number; key: string; depth: number; destroyed: boolean }> = [];
const scene = {
  textures: { exists: (key: string) => textures.has(key) },
  make: { graphics: () => {
    const graphics = new Proxy({}, { get: (_target, name: string) => (...args: number[]) => {
      if (name === 'generateTexture') {
        const [key, width, height] = args as unknown as [string, number, number];
        assert(width === 84 && height === 84, 'textures have bounded dimensions');
        assert(!textures.has(key), 'each orientation bakes once');
        textures.add(key); bakes++;
      } else if (name === 'destroy') disposedGraphics++;
      else bakeCommands.push({ name, args });
      return graphics;
    }});
    return graphics;
  } },
  add: { image: (x: number, y: number, key: string) => {
    const data = { x, y, key, depth: 0, destroyed: false };
    images.push(data);
    const image = {
      setOrigin: (x: number, y: number) => {
        assert(x === 0 && y === 0, 'patch origin is explicit'); return image;
      },
      setDepth: (depth: number) => { data.depth = depth; return image; },
      destroy: () => { data.destroyed = true; },
    };
    return image;
  } },
} as unknown as Phaser.Scene;

for (const offset of [0, 3200]) {
  let liveRoundedFills = 0, corners = 0;
  const graphics = new Proxy({}, { get: (_target, name: string) => () => {
    if (name === 'fillRoundedRect') liveRoundedFills++;
    return graphics;
  }}) as Phaser.GameObjects.Graphics;
  const features = NODE_FEATURES['node-t1-mountain-01']
    .filter(feature => feature.id.startsWith('mountain_'))
    .map(feature => ({ id: feature.id, shape: resolveFeatureShape(feature) }));
  assert(drawMountainElevation(graphics, features, offset, 0, (x, y, dx, dy) => {
    const image = mountainCornerImage(scene, x, y, dx, dy, -10.01);
    const data = images[images.length - 1];
    assert(data.x + 42 === x && data.y + 42 === y, 'baked lip stays at authored world coordinates');
    assert(data.depth === -10.01, 'neighbor depth preserved');
    image.destroy(); corners++;
  }), 'mountain elevation is built');
  assert(corners === 8, 'both rings retain their four corners');
  assert(liveRoundedFills === 0, 'live scenery has no rounded polygon fills');
}
assert(bakes === 4 && disposedGraphics === 4, 'active and neighbor maps reuse four textures and release bakers');
assert(images.every(image => image.destroyed), 'node images can be destroyed independently');
assert(textures.size === 4, 'image teardown retains shared textures');
assert(bakeCommands.filter(command => command.name === 'fillRoundedRect').length === 12,
  'three original filled layers per orientation');
assert(bakeCommands.filter(command => command.name === 'strokePath').length === 4,
  'original lip strokes are baked too');
for (const {name, args} of bakeCommands) {
  if (name === 'fillRoundedRect') {
    const [x,y,w,h] = args;
    assert(x >= 2 && y >= 2 && x+w <= 82 && y+h <= 82, 'fills fit within transparent padding');
  }
  if (name === 'moveTo' || name === 'lineTo') {
    assert(args.every(v => v >= 2 && v <= 82), 'lip strokes fit within texture');
  }
}
console.log('mountainCornerTextures: ok');
