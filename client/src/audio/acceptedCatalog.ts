// Accepted listening-study masters. Source versions remain in filenames for traceability.
export const ACCEPTED_SFX = {
  "slash": [
    "v31-striker-1",
    "v31-striker-2"
  ],
  "blunt": [
    "v32-squire-2"
  ],
  "shot": [
    "v31-slinger-2"
  ],
  "spirit": [
    "v31-spirit-1"
  ],
  "summon-hit": [
    "v31-conduit-2"
  ],
  "fire": [
    "v32-fire-2"
  ],
  "ice": [
    "v32-ice-1"
  ],
  "poison": [
    "v32-poison-2"
  ],
  "magic": [
    "v42-magic-1",
    "v42-magic-2"
  ],
  "bone": [
    "v41-bone-1"
  ],
  "claw": [
    "v34-claw-1"
  ],
  "bite": [
    "v34-bite-2"
  ],
  "maul": [
    "v34-maul-2"
  ],
  "rock-launch": [
    "v34-rock-launch-1"
  ],
  "rock-impact": [
    "v34-rock-impact-2"
  ],
  "armor-break": [
    "v34-armor-break-1"
  ],
  "explosion": [
    "v34-explosion-1"
  ],
  "player-death": [
    "v34-player-death-1"
  ],
  "pool": [
    "v35-pool-1"
  ],
  "detonation": [
    "v35-detonation-1"
  ],
  "burrow": [
    "v35-burrow-1"
  ],
  "emerge": [
    "v35-emerge-2"
  ],
  "shield-up": [
    "v36-shield-up-1"
  ],
  "shield-break": [
    "v36-shield-break-1"
  ],
  "rally": [
    "v37-rally-1",
    "v37-rally-2"
  ],
  "frenzy": [
    "v37-frenzy-1"
  ],
  "raise-dead": [
    "v38-raise-dead-1"
  ],
  "sand": [
    "v39-sand-2"
  ],
  "execution": [
    "v39-execution-1"
  ],
  "sunbeam": [
    "v39-sunbeam-2"
  ],
  "escape": [
    "v39-escape-2"
  ],
  "ambush": [
    "v39-ambush-1"
  ],
  "mark": [
    "v40-mark-2"
  ],
  "shatter": [
    "v40-shatter-2"
  ],
  "undertow": [
    "v40-undertow-1"
  ],
  "constrict": [
    "v40-constrict-1"
  ],
  "devour": [
    "v40-devour-2"
  ],
  "pressure-lance": [
    "v40-pressure-lance-1"
  ],
  "charge": [
    "v41-charge-1"
  ],
  "fault-lines": [
    "v41-fault-lines-1"
  ],
  "deathroll": [
    "v41-deathroll-1"
  ],
  "curse": [
    "v28-curse-1"
  ],
  "slow": [
    "v28-slow-1"
  ],
  "snare": [
    "v29-snare-2"
  ],
  "poison-status": [
    "v28-poison-1"
  ],
  "burn-status": [
    "v29-burn-2"
  ],
  "freeze": [
    "v6-ice-1-1",
    "v6-ice-2-1"
  ],
  "slam": [
    "v6-slam-impact-2"
  ],
  "bow": [
    "v5-arrow-2-1",
    "v5-arrow-2-2"
  ],
  "striker-empowered": [
    "v30-striker-1"
  ],
  "squire-empowered": [
    "v28-squire-1",
    "v28-squire-2"
  ],
  "spirit-empowered": [
    "v30-lightning-1"
  ],
  "cataclysm": [
    "v25-cataclysm-1",
    "v25-cataclysm-2"
  ],
  "pack": [
    "v24-pack-1",
    "v24-pack-2"
  ],
  "summon": [
    "v5-summon-1-1",
    "v5-summon-1-2"
  ],
  "heal": [
    "v5-heal-2-1",
    "v5-heal-2-2"
  ],
  "dodge": [
    "v4-dodge-1"
  ],
  "block": [
    "v6-block-1-1",
    "v6-block-1-2"
  ],
  "hurt": [
    "v24-hit-1",
    "v24-hit-2"
  ],
  "death": [
    "v4-death-1"
  ],
  "boss-death": [
    "v49-boss-3"
  ],
  "death-magic": ["v48-magic-1"],
  "death-animal": ["v48-animal-2"],
  "death-humanoid": ["v48-humanoid-2"],
  "death-undead": ["v49-undead-2"],
  "death-stone": ["v49-stone-1"],
  "death-aquatic": ["v49-aquatic-2"]
} as const;
export type AcceptedSfxId = keyof typeof ACCEPTED_SFX;
