// Accepted compositions. Boss arrays: approach, battle, 50%, optional 25%.
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

/** Lower-tier bosses do not acquire a fabricated quarter-health music phase. */
export function bossMusicPhase(hp: number, maxHp: number, engaged: boolean, tier: number, hasFinal: boolean): number {
  if (!engaged) return 0;
  const ratio = hp / Math.max(1, maxHp);
  return ratio <= 0.25 && tier >= 3 && hasFinal ? 3 : ratio <= 0.5 ? 2 : 1;
}
