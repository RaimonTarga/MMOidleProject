import { MONSTER_DATABASE } from '@mmo-idle/shared';

// Accepted compositions. Boss arrays: approach, battle, escalation, optional final.
export const ZONE_MUSIC: Record<string, string> = {
  "clearing": "v16-clearing-first-light",
  "sanctuary": "v16-sanctuary-starlit",
  "plains": "v13-plains-open-road",
  "forest": "v13-forest-branchways",
  "swamp": "v13-swamp-stillwater",
  "mountain": "v6-mountain-reference-study",
  "cave": "v17-caves-lantern-hollows",
  "desert": "v19-desert-spacious",
  "jungle": "v19-jungle-steady-canopy",
  "tundra": "v9-tundra-zone",
  "volcanic": "v11-volcano-zone",
  "graveyard": "v21-wasteland-ash-procession",
  "trench": "v21-trench-below-the-light"
};
export const BOSS_MUSIC: Record<string, string[]> = {
  "mountain": [
    "v7-mountain-approach",
    "v8-mountain-battle",
    "v8-mountain-half",
    "v8-mountain-enrage"
  ],
  "plains": [
    "v13-plains-open-road",
    "v15-plains-pulse-battle",
    "v15-plains-pulse-half"
  ],
  "forest": [
    "v13-forest-branchways",
    "v14-forest-escalation",
    "v14-forest-final"
  ],
  "swamp": [
    "v13-swamp-stillwater",
    "v14-swamp-battle",
    "v14-swamp-escalation",
    "v14-swamp-final"
  ],
  "cave": [
    "v23-caves-approach",
    "v23-caves-battle",
    "v23-caves-half",
    "v23-caves-quarter"
  ],
  "desert": [
    "v20-desert-approach",
    "v20-desert-battle",
    "v20-desert-half",
    "v20-desert-quarter"
  ],
  "jungle": [
    "v20-jungle-approach",
    "v20-jungle-battle",
    "v20-jungle-half",
    "v20-jungle-quarter"
  ],
  "graveyard": [
    "v22-wasteland-approach",
    "v22-wasteland-battle",
    "v22-wasteland-escalation",
    "v22-wasteland-climax"
  ],
  "trench": [
    "v22-trench-approach",
    "v22-trench-battle",
    "v22-trench-escalation",
    "v22-trench-climax"
  ],
  "tundra": [
    "v9-tundra-zone",
    "v9-tundra-climax",
    "v11-tundra-climax",
    "v11-tundra-climax"
  ],
  "volcanic": [
    "cinder",
    "v10-volcano-battle",
    "v10-volcano-eruption",
    "v10-volcano-eruption"
  ]
};
export const musicFile = (track: string): string => `/assets/audio/music/accepted/${track}.ogg`;

/**
 * Music stage: 0 approach, 1 battle, 2 escalation, 3 final. It follows the boss's
 * own authored HP phases, firing at the same `hp% <= hpPct` test as bossScripts.ts
 * (the lineages change phase at 65/60/55/50% and 30/25/20%, not a fixed 50/25).
 * The last of two or more phases takes the final track when the suite has one.
 * A boss without HP phases falls back to 50% / 25%, and lower-tier bosses do not
 * acquire a fabricated quarter-health phase there.
 */
export function bossMusicPhase(
  hp: number, maxHp: number, engaged: boolean, tier: number, hasFinal: boolean, bossTypeId?: string,
): number {
  if (!engaged) return 0;
  const ratio = hp / Math.max(1, maxHp);
  const thresholds = (bossTypeId ? MONSTER_DATABASE.get(bossTypeId)?.bossScript?.phases ?? [] : [])
    .map((phase) => phase.hpPct)
    .filter((pct) => pct < 1);
  if (thresholds.length === 0) return ratio <= 0.25 && tier >= 3 && hasFinal ? 3 : ratio <= 0.5 ? 2 : 1;
  const crossed = thresholds.filter((pct) => ratio <= pct).length;
  if (crossed === 0) return 1;
  return crossed === thresholds.length && thresholds.length >= 2 && hasFinal ? 3 : 2;
}
