import path from 'path';
import { bakeTreeHitboxRects } from './bake/treeHitbox';

/**
 * Prints the baked tree trunk hitbox rects as a TypeScript literal to paste into
 * `shared/src/world/trees.ts` (`TREE_HITBOX_RECTS`). Run with:
 *   pnpm --filter @mmo-idle/server bake:tree-hitboxes
 */
async function main(): Promise<void> {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const png = path.join(
    repoRoot,
    'client/public/assets/environment/trees/trees_hitbox.png',
  );
  const perVariant = await bakeTreeHitboxRects(png);

  const lines = perVariant.map((rects, variant) => {
    const body = rects
      .map(
        (r) =>
          `    { offsetX: ${Math.round(r.offsetX)}, offsetY: ${Math.round(
            r.offsetY,
          )}, halfW: ${Math.round(r.halfW)}, halfH: ${Math.round(r.halfH)} },`,
      )
      .join('\n');
    return `  // variant ${variant} (${rects.length} rects)\n  [\n${body}\n  ],`;
  });

  console.log(`[\n${lines.join('\n')}\n]`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
