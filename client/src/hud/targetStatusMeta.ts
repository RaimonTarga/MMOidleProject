// Display metadata for target-frame debuff tiles. Status ids come straight from
// the server's TracksCombat effects; boss-effect names from bossScripts. Unknown
// ids fall back to a prettified label so nothing renders blank.

export interface StatusMeta {
  label: string;
  color: string;
}

const STATUS_META: Record<string, StatusMeta> = {
  dot:             { label: 'DoT',     color: '#7ac74f' },
  'dot-chill':     { label: 'Chill',   color: '#6fd0ff' },
  'dot-frozen':    { label: 'Frozen',  color: '#9fe8ff' },
  'dot-smolder':   { label: 'Smolder', color: '#ff8a3c' },
  'dot-conf':      { label: 'Conflag', color: '#ff5a2c' },
  slow:            { label: 'Slow',    color: '#88aaff' },
  root:            { label: 'Root',    color: '#aa77ee' },
  'plating-shred': { label: 'Shred',   color: '#d8b24a' },
  'cadence-hemorrhage': { label: 'Bleed', color: '#c41e1e' },
  'energy-storm':       { label: 'Storm', color: '#c77dff' },
  brittle:         { label: 'Brittle', color: '#d88a4a' },
  'ashbrand-burn': { label: 'Burn',    color: '#ff7a3c' },
  // Burn-family DoT weapons (fire → Burn, frost → Chill).
  'swamp-mirebrand-burn':   { label: 'Burn',  color: '#ff7a3c' },
  'swamp-blightbrand-burn': { label: 'Burn',  color: '#ff7a3c' },
  'blightbrand-burn':       { label: 'Burn',  color: '#ff7a3c' },
  'swamp-frostbrand-burn':  { label: 'Chill', color: '#6fd0ff' },
  'swamp-rimebrand-burn':   { label: 'Chill', color: '#6fd0ff' },
  'rimebrand-burn':         { label: 'Chill', color: '#6fd0ff' },
  'void-corruption':         { label: 'Corrupt', color: '#b06cff' },
  vuln:            { label: 'Vuln',    color: '#ff5577' },
  vulnerability:   { label: 'Vuln',    color: '#ff5577' },
};

const BOSS_META: Record<string, StatusMeta> = {
  enrage:      { label: 'Enraged',   color: '#ff4444' },
  regen:       { label: 'Regen',     color: '#44dd77' },
  shield:      { label: 'Shield',    color: '#5599ff' },
  summon:      { label: 'Summon',    color: '#cc88ff' },
  'stat-buff': { label: 'Empowered', color: '#ffaa33' },
  morph:       { label: 'Morph',     color: '#dd66cc' },
  slam:        { label: 'Slam',      color: '#ff7744' },
};

function prettify(id: string): string {
  return id
    .replace(/^dot-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusMeta(id: string): StatusMeta {
  return STATUS_META[id] ?? { label: prettify(id), color: '#b0a8d0' };
}

export function bossEffectMeta(name: string): StatusMeta {
  return BOSS_META[name] ?? { label: prettify(name), color: '#ffcc55' };
}
