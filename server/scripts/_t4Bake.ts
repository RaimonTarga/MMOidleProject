import { writeHitboxArtifact } from '../src/hitbox/cache';
writeHitboxArtifact(process.argv[2]).then((p) => console.log('baked', p));
