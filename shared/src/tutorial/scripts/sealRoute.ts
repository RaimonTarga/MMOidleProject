import { biomeLevelCap } from '../../config/gameConfig';
import type { TutorialConceptId } from '../concepts';
import type { TutorialBeat, TutorialNodeRef } from '../types';
import { TUTORIAL_FAREWELL } from './farewell';
import { T1_BIOME_ORDER, TUTORIAL_SEALS, type T1Biome } from './plans';

/**
 * Class-agnostic beats after the opening. No crafting, and no words for the
 * systems the class-first rework removes. Each class's own beats replace this
 * whole list when its builder lands (plan §5.2, task C<c>.6).
 *
 * The first seal's boss counts as open once that zone's mastery is at the
 * tier cap (`biomeLevelCap`). That is the zone's whole Tier-1 fight, and the
 * only condition already in `conditions.ts` that means the player has fought
 * there long enough. Forest, Swamp and Cave then follow in `T1_BIOME_ORDER`
 * (a seal biome is its boss fight, not an extra lap). The second seal is the
 * Mountain boss. The last beat is the farewell: its line is the guide's
 * goodbye, and the panel speaks the rest of `TUTORIAL_FAREWELL` once Tier 2
 * has landed and the script is done.
 */

const CHAPTER: Record<T1Biome, string> = {
  plains: 'The Plains',
  forest: 'The Forest',
  swamp: 'The Swamp',
  mountain: 'The Mountain',
  cave: 'The Cave',
};

const ZONE: Record<T1Biome, string> = {
  plains: 'Plains',
  forest: 'Forest',
  swamp: 'Swamp',
  mountain: 'Mountain',
  cave: 'Cave',
};

/** Why a zone is worth the walk, in fight terms. One line per biome so a seal change still has a sentence. */
const WALK: Record<T1Biome, { say: string; waiting: string; teaches?: readonly TutorialConceptId[] }> = {
  plains: {
    say: 'The Plains are open ground and big packs. Fight across them.',
    waiting: 'Fighting across the Plains.',
  },
  forest: {
    say: 'The Forest fights in fast packs. Cut through it.',
    waiting: 'Fighting through the Forest.',
  },
  swamp: {
    say: 'The Swamp keeps hurting after the hit. Fight through it anyway.',
    waiting: 'Fighting through the Swamp.',
    teaches: ['poison'],
  },
  mountain: {
    say: 'The Mountain hits the hardest. Fight up it.',
    waiting: 'Fighting up the Mountain.',
  },
  cave: {
    say: 'The Cave fields the heaviest bodies out here. Fight through them.',
    waiting: 'Fighting through the Cave.',
  },
};

function zoneRef(biome: T1Biome): TutorialNodeRef {
  return { kind: 'biome', biomeGroup: biome, tier: 1 };
}

function fightZone(
  biome: T1Biome,
  id: string,
  say: string,
  waiting: string,
  teaches?: readonly TutorialConceptId[],
): TutorialBeat {
  const cap = biomeLevelCap(1, biome);
  return {
    id,
    chapter: CHAPTER[biome],
    say,
    waiting,
    ...(teaches && teaches.length > 0 ? { teaches: [...teaches] } : {}),
    progress: [{ type: 'biomeLevel', biomeGroup: biome, level: cap }],
    steps: [{
      type: 'farm',
      at: zoneRef(biome),
      until: { type: 'biomeLevelAtLeast', biomeGroup: biome, level: cap },
    }],
  };
}

function openBoss(biome: T1Biome): TutorialBeat {
  const zone = ZONE[biome];
  return fightZone(
    biome,
    `open:${biome}`,
    `The ${zone} first. Fight there until their boss is open: you want the practice before that fight.`,
    `Fighting in the ${zone} until the boss is open.`,
    ['zones'],
  );
}

function walk(biome: T1Biome): TutorialBeat {
  const line = WALK[biome];
  return fightZone(biome, `zone:${biome}`, line.say, line.waiting, line.teaches);
}

function bossBeat(biome: T1Biome, which: 'first' | 'second'): TutorialBeat {
  const zone = ZONE[biome];
  const first = which === 'first';
  return {
    id: `boss:${biome}`,
    chapter: CHAPTER[biome],
    say: first
      ? `The ${zone} boss is open. Clear the guards, wake it at the altar, and take the first seal. Falling is normal; we just try again.`
      : `The ${zone} boss is the second seal. Two seals open the next tier. Clear the guards, then the altar.`,
    waiting: `Fighting for the ${zone} seal.`,
    ...(first ? { teaches: ['seals', 'boss-altar'] as TutorialConceptId[] } : {}),
    steps: [{ type: 'attemptBoss', biomeGroup: biome, tier: 1 }],
  };
}

function farewellBeat(): TutorialBeat {
  return {
    id: 'farewell',
    chapter: 'Farewell',
    say: TUTORIAL_FAREWELL[0],
    steps: [{
      type: 'farm',
      at: zoneRef(TUTORIAL_SEALS[1]),
      until: { type: 'playerTierAtLeast', tier: 2 },
    }],
  };
}

/** Beats that follow the opening when a class has no builder of its own. */
export function buildSealRouteBeats(): TutorialBeat[] {
  const [first, second] = TUTORIAL_SEALS;
  const beats: TutorialBeat[] = [openBoss(first), bossBeat(first, 'first')];
  for (const biome of T1_BIOME_ORDER) {
    if (biome === first || biome === second) continue;
    beats.push(walk(biome));
  }
  beats.push(bossBeat(second, 'second'), farewellBeat());
  return beats;
}
