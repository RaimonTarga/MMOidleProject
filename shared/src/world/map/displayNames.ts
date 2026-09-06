import type { NodeModifierFamily } from '../nodeModifierTypes';
import type { WorldNodeAuthoring } from './types';

/**
 * Canonical player-facing names for normal nodes.
 *
 * The lookup identity is deliberately the semantic tuple of tier, biome, and
 * modifier. A biome's native modifier can occupy two stable map cells, so a
 * tuple may contain two authored variants; the variants are not keyed by node
 * id or by the generated normal index.
 */
export type NormalNodeDisplayNameTable = Record<
  number,
  Record<string, Partial<Record<NodeModifierFamily, readonly string[]>>>
>;

export const NORMAL_NODE_DISPLAY_NAMES: NormalNodeDisplayNameTable = {
  1: {
    forest: {
      alacrity: ['Windstep Grove', 'Whisperwood Run'],
      swarming: ['Nestwood Thicket'],
      dominion: ['Crownleaf Wood'],
      fortified: ['Ironbark Hollow'],
    },
    mountain: {
      heavy: ['Stonefall Ridge', 'Deepstone Crag'],
      swarming: ['Cliffnest Shelf'],
      dominion: ['Crownpeak Rise'],
      fortified: ['Wallrock Pass'],
    },
    plains: {
      alacrity: ['Swiftgrass Meadow'],
      heavy: ['Stonehoof Steppe'],
      swarming: ['Thousandgrass Fields'],
      dominion: ['Crownherd Prairie'],
      fortified: ['Sodwall Plain'],
    },
    cave: {
      alacrity: ['Rushing Grotto'],
      heavy: ['Loadstone Vault'],
      swarming: ['Spidernest Grotto'],
      dominion: ['Blackfang Chamber', 'High Roost Cavern'],
      fortified: ['Gatewall Hollow'],
    },
    swamp: {
      alacrity: ['Rushing Reedfen'],
      heavy: ['Sunkroot Bog'],
      swarming: ['Leechbrood Mire'],
      dominion: ['Blackwater Crown', 'Crownmire Pool'],
      fortified: ['Rootwall Marsh', 'Mudbank Bastion'],
    },
  },
  2: {
    forest: {
      alacrity: ['Galeleaf Trail', 'Foxfire Run'],
      swarming: ['Briarhost Thicket'],
      dominion: ['Timbercrown Reach'],
      fortified: ['Oakshield Hollow'],
    },
    plains: {
      alacrity: ['Windmane Prairie'],
      heavy: ['Boulderhoof Steppe'],
      swarming: ['Stampede Fields'],
      dominion: ['Kinggrass Reach'],
      fortified: ['Hedgewall Prairie'],
    },
    mountain: {
      heavy: ['Thunderstone Shelf', 'Mammothstep Crag'],
      swarming: ['Eyriehold Cliffs'],
      dominion: ['Crownstone Overlook'],
      fortified: ['Ironwall Ascent'],
    },
    cave: {
      alacrity: ['Windcut Caverns'],
      heavy: ['Burdenstone Vault'],
      swarming: ['Broodroot Grotto'],
      dominion: ['Black Crown Deep', 'Warden Underkeep'],
      fortified: ['Irongate Cavern'],
    },
    swamp: {
      alacrity: ['Quickwater Fen'],
      heavy: ['Siltweight Bog'],
      swarming: ['Mirehive Expanse'],
      dominion: ['Crownreed Basin', 'Murk Crown Pool'],
      fortified: ['Dikeback Marsh', 'Rootbound Bulwark'],
    },
    jungle: {
      alacrity: ['Vinewind Canopy', 'Flashleaf Run'],
      swarming: ['Nestbloom Wilds'],
      dominion: ['Crownfang Thicket'],
      fortified: ['Ironvine Wall'],
    },
    desert: {
      heavy: ['Graveweight Dunes'],
      swarming: ['Beetlehost Waste'],
      dominion: ['Sun-Crowned Expanse', 'Basilisk Dune Reach'],
      fortified: ['Glasswall Dunes'],
    },
  },
  3: {
    tundra: {
      heavy: ['Glacierweight Shelf', 'Rime-Tusk Basin'],
      swarming: ['Frostnest Expanse'],
      dominion: ['Whitecrown Icefield'],
      fortified: ['Icebound Rampart'],
    },
    mountain: {
      heavy: ['Avalanche Stone Rise', 'Worldstone Crag'],
      swarming: ['Eaglewake Crags'],
      dominion: ['Sovereign Spine'],
      fortified: ['Basalt Rampart'],
    },
    cave: {
      alacrity: ['Undercurrent Grotto'],
      heavy: ['Deepcore Vault'],
      swarming: ['Crystal Broodreach'],
      dominion: ['Heartstone Court', 'Crowndeep Hall'],
      fortified: ['Obsidian Gateworks'],
    },
    jungle: {
      alacrity: ['Stormvine Canopy', 'Razorleaf Run'],
      swarming: ['Blooming Nestwild'],
      dominion: ['Emerald Crownwood'],
      fortified: ['Thornwall Basin'],
    },
    desert: {
      heavy: ['Sunken Colossus Dunes'],
      swarming: ['Locustglass Waste'],
      dominion: ['Dune Crown Expanse', 'Basilisk Sand Throne'],
      fortified: ['Mirrorwall Erg'],
    },
    volcanic: {
      alacrity: ['Cinderstream Ravine'],
      heavy: ['Magmaweight Caldera'],
      swarming: ['Emberbrood Fields', 'Scoria Nestlands'],
      dominion: ['Flamecrown Shelf'],
      fortified: ['Basalt Lock'],
    },
    swamp: {
      alacrity: ['Lanterncurrent Mire'],
      heavy: ['Blackroot Sink'],
      swarming: ['Bogbloom Tangle'],
      dominion: ['Crownrot Basin'],
      fortified: ['Ironreed Fen', 'Mirewall Reach'],
    },
  },
  4: {
    mountain: {
      heavy: ['Titanfall Escarpment', 'Massrock Heights'],
      swarming: ['Rocnest Bastion'],
      dominion: ['Ironcrest Heights'],
      fortified: ['Skywall Rampart'],
    },
    tundra: {
      heavy: ['Mammothfrost Shelf', 'Glacierfall Expanse'],
      swarming: ['Yeti Roostlands'],
      dominion: ['Pale Crown Icefield'],
      fortified: ['Hailstone Bulwark'],
    },
    jungle: {
      alacrity: ['Windlash Canopy', 'Flashvine Reach'],
      swarming: ['Emerald Broodwild'],
      dominion: ['Verdant Crownwood'],
      fortified: ['Thorniron Barrier'],
    },
    desert: {
      heavy: ['Duneburden Expanse'],
      swarming: ['Sirocco Beetlelands'],
      dominion: ['Solar Throne Dunes', 'Basilisk Crown Reach'],
      fortified: ['Obsidian Sunwall'],
    },
    volcanic: {
      alacrity: ['Firewind Ravine'],
      heavy: ['Caldera Weightlands'],
      swarming: ['Cinderbrood Fields', 'Magma Nest Expanse'],
      dominion: ['Sovereign Emberflow'],
      fortified: ['Basalt Crownwall'],
    },
    graveyard: {
      alacrity: ['Carrionwind Flats'],
      heavy: ['Boneweight Reach'],
      swarming: ['Crowgrave Expanse', 'Gravebloom Fields'],
      dominion: ['Charnel Crownlands'],
      fortified: ['Ironbone Bastion'],
    },
    trench: {
      alacrity: ['Hadal Current'],
      heavy: ['Pressuredeep Shelf'],
      swarming: ['Lanternshoal Trench'],
      dominion: ['Leviathan Court', 'Crownwater Deep'],
      fortified: ['Blackwall Drop'],
    },
  },
};

/** Bespoke landmark names for dungeon nodes, keyed by tier and biome. */
export const DUNGEON_NODE_DISPLAY_NAMES: Record<
  number,
  Record<string, string>
> = {
  1: {
    forest: 'Bearroot Hollow',
    plains: 'Tuskfall Basin',
    mountain: 'Cragfall Ascent',
    cave: 'Obsidian Broodvault',
    swamp: 'Gravewater Fen',
  },
  2: {
    forest: 'Timberclaw Hold',
    plains: 'Tuskgrass Vale',
    mountain: 'Stoneplate Citadel',
    cave: 'Dreadbore Warren',
    swamp: 'Miregorge Basin',
    jungle: 'Gorger Canopy',
    desert: "Emperor's Dune",
  },
  3: {
    tundra: 'Frosthorn Cirque',
    mountain: 'Gorgestone Ascent',
    cave: 'Deepcore Maw',
    jungle: 'Bramblefang Wilds',
    desert: 'Carapace Throne',
    volcanic: 'Cindershell Caldera',
    swamp: 'Rotspore Basin',
  },
  4: {
    mountain: 'Ironcrest Summit',
    tundra: 'Patriarch Icehall',
    jungle: 'Verdant Crown Enclave',
    desert: 'Sovereign Dune Court',
    volcanic: 'Sovereign Caldera',
    graveyard: 'Crownbone Sepulcher',
    trench: 'Elder Serpent Deep',
  },
};

/** Safe regional respawn anchors. T1 intentionally uses the authored Clearing. */
export const SANCTUARY_NODE_DISPLAY_NAMES: Record<number, string> = {
  2: 'Wayfarer Haven',
  3: 'Farwatch Refuge',
  4: 'Horizon Anchorage',
};

const BIOME_FALLBACK_LABELS: Record<string, string> = {
  cave: 'Caverns',
  graveyard: 'Wasteland',
  trench: 'Deep-Sea Trench',
};

const MODIFIER_FALLBACK_LABELS: Record<NodeModifierFamily, string> = {
  alacrity: 'Alacrity',
  heavy: 'Heavy',
  swarming: 'Swarming',
  dominion: 'Dominion',
  fortified: 'Fortified',
};

function biomeFallbackLabel(biomeGroup: string): string {
  return (
    BIOME_FALLBACK_LABELS[biomeGroup] ??
    biomeGroup.charAt(0).toUpperCase() + biomeGroup.slice(1)
  );
}

function normalNodeFallback(
  tier: number,
  biomeGroup: string,
  modifier: NodeModifierFamily,
  occurrence: number,
): string {
  const occurrenceLabel = occurrence > 0 ? ` ${occurrence + 1}` : '';
  return `T${tier} ${biomeFallbackLabel(biomeGroup)} ${MODIFIER_FALLBACK_LABELS[modifier]}${occurrenceLabel}`;
}

/** Return the authored variant for a semantic normal-node key, if present. */
export function authoredNormalNodeDisplayName(
  tier: number,
  biomeGroup: string,
  modifier: NodeModifierFamily,
  occurrence = 0,
): string | undefined {
  return NORMAL_NODE_DISPLAY_NAMES[tier]?.[biomeGroup]?.[modifier]?.[occurrence];
}

/** Resolve a normal-node name, retaining a readable fallback for future tiers. */
export function resolveNormalNodeDisplayName(
  tier: number,
  biomeGroup: string,
  modifier: NodeModifierFamily,
  occurrence = 0,
): string {
  return (
    authoredNormalNodeDisplayName(tier, biomeGroup, modifier, occurrence) ??
    normalNodeFallback(tier, biomeGroup, modifier, occurrence)
  );
}

/** Resolve a dungeon landmark name, retaining a readable fallback for future tiers. */
export function resolveDungeonNodeDisplayName(
  tier: number,
  biomeGroup: string,
): string {
  return (
    DUNGEON_NODE_DISPLAY_NAMES[tier]?.[biomeGroup] ??
    `T${tier} ${biomeFallbackLabel(biomeGroup)} Dungeon`
  );
}

/** Resolve a sanctuary name, retaining a readable fallback for future tiers. */
export function resolveSanctuaryNodeDisplayName(tier: number): string {
  return SANCTUARY_NODE_DISPLAY_NAMES[tier] ?? `T${tier} Sanctuary`;
}

/**
 * Validate the names attached to the canonical node list.
 *
 * Normal-node occurrences are counted by semantic key, not by node id. This
 * mirrors the authoring resolver and catches missing authored coverage as well
 * as accidental duplicate labels across the current world.
 */
export function validateNodeDisplayNames(
  nodes: readonly WorldNodeAuthoring[],
): string[] {
  const violations: string[] = [];
  const normalOccurrences = new Map<string, number>();
  const names = new Map<string, string>();

  for (const node of nodes) {
    if (!node.displayName.trim()) {
      violations.push(`${node.id}: display name is empty`);
      continue;
    }

    let expectedName: string | undefined;
    if (node.kind === 'normal' && node.modifier) {
      const key = `${node.biomeTier}|${node.biomeGroup}|${node.modifier}`;
      const occurrence = normalOccurrences.get(key) ?? 0;
      normalOccurrences.set(key, occurrence + 1);
      expectedName = authoredNormalNodeDisplayName(
        node.biomeTier,
        node.biomeGroup,
        node.modifier,
        occurrence,
      );
      if (!expectedName) {
        violations.push(
          `${node.id}: missing authored normal display name for ${key}`,
        );
      }
    } else if (node.kind === 'dungeon') {
      expectedName = DUNGEON_NODE_DISPLAY_NAMES[node.biomeTier]?.[
        node.biomeGroup
      ];
      if (!expectedName) {
        violations.push(
          `${node.id}: missing authored dungeon display name for T${node.biomeTier} ${node.biomeGroup}`,
        );
      }
    } else if (node.kind === 'sanctuary') {
      expectedName = SANCTUARY_NODE_DISPLAY_NAMES[node.biomeTier];
      if (!expectedName) {
        violations.push(
          `${node.id}: missing authored sanctuary display name for T${node.biomeTier}`,
        );
      }
    }

    if (expectedName && node.displayName !== expectedName) {
      violations.push(
        `${node.id}: display name '${node.displayName}' does not match authored name '${expectedName}'`,
      );
    }

    const previousNodeId = names.get(node.displayName);
    if (previousNodeId) {
      violations.push(
        `duplicate canonical display name '${node.displayName}' on ${previousNodeId} and ${node.id}`,
      );
    } else {
      names.set(node.displayName, node.id);
    }
  }

  return violations;
}
