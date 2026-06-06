import path from 'path';

// Resolve asset paths relative to this module (not process.cwd()) so they work
// regardless of the working directory the process is launched from.
// dev:  server/src/hitbox  -> ../../.. -> repo root
// prod: server/dist/hitbox -> ../../.. -> repo root
const repoRoot = path.resolve(__dirname, '..', '..', '..');

/** Atlas asset paths (resolved against the repo root). */
export function getAtlasPaths(): { atlasPng: string; atlasJson: string } {
  return {
    atlasPng:  path.join(repoRoot, 'client/public/assets/sprites.png'),
    atlasJson: path.join(repoRoot, 'client/public/assets/sprites.json'),
  };
}

export function getVoidOverlordPaths(): { png: string } {
  return {
    png: path.join(repoRoot, 'client/public/assets/ultimate_bosses/void_overlord.png'),
  };
}
