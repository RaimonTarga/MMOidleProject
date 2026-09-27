/**
 * BESPOKE PATHS — the registry of specializations whose attack SHOWS their
 * mechanic (2026-09-27). One module per class under ./bespoke/, sharing
 * ./bespoke/kit.ts; see the kit for the hit / payoff / reload hooks.
 *
 * A path appears here, in pathSignatures.ts (one-motif flourish), or in the
 * short list of paths that replace their attack in combatFx — exactly one of the
 * three (guarded by server/test/attackProgression.test.ts).
 */
import type { BespokePath, PathTable } from './bespoke/kit';
import { STRIKER_PATHS } from './bespoke/striker';
import { SQUIRE_PATHS } from './bespoke/squire';
import { SLINGER_PATHS } from './bespoke/slinger';
import { APPRENTICE_PATHS } from './bespoke/apprentice';

export type { BespokeHit, BespokeReload, BespokePath } from './bespoke/kit';

const BESPOKE_PATHS: PathTable = {
  ...STRIKER_PATHS,
  ...SQUIRE_PATHS,
  ...SLINGER_PATHS,
  ...APPRENTICE_PATHS,
};

export const bespokePathFor = (specId: string | undefined): BespokePath | undefined =>
  specId ? BESPOKE_PATHS[specId] : undefined;
