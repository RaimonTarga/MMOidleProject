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
  // Weapon reservoir-DoT effects (poison → Poison, fire → Burn, frost → Chill).
  // Swamp owns poison, Volcanic owns fire, Tundra owns frost.
  'poison-dagger-burn':     { label: 'Poison', color: '#7ac74f' },
  'swamp-mirebrand-burn':   { label: 'Poison', color: '#7ac74f' },
  'swamp-blightbrand-burn': { label: 'Poison', color: '#7ac74f' },
  'cinderbrand-burn':       { label: 'Burn',   color: '#ff7a3c' },
  'tundra-rimebrand-burn':  { label: 'Chill',  color: '#6fd0ff' },
  'rimebrand-burn':         { label: 'Chill',  color: '#6fd0ff' },
  'void-corruption':         { label: 'Corrupt', color: '#b06cff' },
  vuln:            { label: 'Vuln',    color: '#ff5577' },
  vulnerability:   { label: 'Vuln',    color: '#ff5577' },
  'expose-weakness': { label: 'Exposed', color: '#ff5577' },
  'summoner-harried': { label: 'Accused', color: '#e6c35c' },
  'summoner-withering-chorus': { label: 'Chorus', color: '#9d6ad6' },
  // Pre-encounter aura SOURCE (pack caller / den alpha) — "this one buffs its allies".
};

const BOSS_META: Record<string, StatusMeta> = {
  enrage:      { label: 'Enraged',   color: '#ff4444' },
  regen:       { label: 'Regen',     color: '#44dd77' },
  shield:      { label: 'Shield',    color: '#5599ff' },
  summon:      { label: 'Summon',    color: '#cc88ff' },
  'stat-buff': { label: 'Empowered', color: '#ffaa33' },
  'bestial-frenzy': { label: 'Bestial Frenzy', color: '#e85d45' },
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
