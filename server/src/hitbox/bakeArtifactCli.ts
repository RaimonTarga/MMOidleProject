import path from 'path';
import { writeHitboxArtifact } from './cache';

async function main(): Promise<void> {
  const outPath = path.resolve(__dirname, '..', '..', 'dist', 'hitbox', 'baked-hitboxes.json');
  await writeHitboxArtifact(outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
