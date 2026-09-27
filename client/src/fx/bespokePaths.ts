/**
 * BESPOKE PATHS — the registry of specializations whose attack SHOWS their
 * mechanic (2026-09-27). One module per class under ./bespoke/, sharing
 * ./bespoke/kit.ts; see the kit for the hit / payoff / reload hooks.
 *
 * Every combat specialization is either here or in the short list of paths that
 * replace their whole attack in combatFx — exactly one of the two (guarded by
 * server/test/attackProgression.test.ts). Conduit's are out of scope for now.
 */
import type { GameScene } from '../scenes/GameScene';
import { ring } from './bossKit';
import type { AttackFlair } from './attackFlair';
import type { BespokePath, PathTable } from './bespoke/kit';
import { STRIKER_PATHS } from './bespoke/striker';
import { SQUIRE_PATHS } from './bespoke/squire';
import { SLINGER_PATHS } from './bespoke/slinger';
import { SPIRIT_PATHS } from './bespoke/spirit';
import { APPRENTICE_PATHS } from './bespoke/apprentice';

export type { BespokeHit, BespokeReload, BespokePath } from './bespoke/kit';

const BESPOKE_PATHS: PathTable = {
  ...STRIKER_PATHS,
  ...SQUIRE_PATHS,
  ...SLINGER_PATHS,
  ...SPIRIT_PATHS,
  ...APPRENTICE_PATHS,
};

export const bespokePathFor = (specId: string | undefined): BespokePath | undefined =>
  specId ? BESPOKE_PATHS[specId] : undefined;

/** Each class's accent, for the ascension ring (Striker gold, Squire ember, ...). */
const CLASS_RING: Record<string, number> = {
  cadence: 0xffd27a,
  cooldown: 0xff9a4a,
  reload: 0xffc040,
  energy: 0x9fc8ff,
  dot: 0xc08aff,
};

/**
 * ASCENSION ring (attackFlair.ts): from T3 a specialized player's payoff (finisher,
 * execution, discharge) rings out in the class colour, a little wider per tier.
 */
export function playAscensionRing(scene: GameScene, flair: AttackFlair, at: { x: number; y: number }): void {
  if (flair.stage < 3 || flair.ascension < 3 || !flair.specId) return;
  const color = CLASS_RING[flair.specId.split('-')[0]] ?? 0xffffff;
  ring(scene, at.x, at.y, color, { from: 14, scale: 3.4 + 0.4 * (flair.ascension - 3), width: 3, ms: 360, alpha: 0.85 });
}
