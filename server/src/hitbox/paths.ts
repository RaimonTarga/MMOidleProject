import path from 'path';

/** Atlas asset paths relative to the server package cwd (`server/`). */
export function getAtlasPaths(): { atlasPng: string; atlasJson: string } {
  const repoRoot = path.resolve(process.cwd(), '..');
  return {
    atlasPng:  path.join(repoRoot, 'client/public/assets/sprites.png'),
    atlasJson: path.join(repoRoot, 'client/public/assets/sprites.json'),
  };
}
